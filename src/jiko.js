/*
Jiko version 0.7

Copyright (c) 2013, Nicolas Vanhoren

Released under the MIT license

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function() {

if (typeof(exports) !== "undefined") { // nodejs
    var underscore = require("underscore");
    underscore.extend(exports, declare(underscore, null));
} else if (typeof(define) !== "undefined") { // amd
    define(["underscore", "jquery"], declare);
} else { // define global variable
    jiko = declare(_, $);
}


function declare(_, $) {
    var jiko = {};

    var escapes = {
        '\\': '\\',
        "'": "'",
        'r': '\r',
        'n': '\n',
        't': '\t',
        'u2028': '\u2028',
        'u2029': '\u2029'
    };
    for (var p in escapes) escapes[escapes[p]] = p;
    var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
    var escape_ = function(text) {
        return "'" + text.replace(escaper, function(match) {
            return '\\' + escapes[match];
        }) + "'";
    }
    var indent_ = function(txt) {
        var tmp = _.map(txt.split("\n"), function(x) { return "    " + x; });
        tmp.pop();
        tmp.push("");
        return tmp.join("\n");
    };
    var _trim = function(t) {
        return t.replace(/^\s+|\s+$/g, ''); 
    };
    var tparams = {
        block: /\{%\s*(\w+)(?:\s+(?:\w+)\s*=\s*(?:(?:"(?:.+?)")|(?:'(?:.+?)')))*\s*%\}/g,
        block_properties: /(\w+)\s*=\s*((?:"(?:.+?)")|(?:'(?:.+?)'))/g,
        comment_multi_begin: /\{\*/g,
        comment_multi_end: /\*\}/g,
        eval_long_begin: /<%/g,
        eval_long_end: /%>/g,
        eval_short_begin: /(?:^|\n)[[ \t]*%(?!{)/g,
        eval_short_end: /\n|$/g,
        escape_begin: /\${/g,
        interpolate_begin: /%{/g,
        comment_begin: /##/g,
        comment_end: /\n|$/g
    };
    var allbegin = new RegExp(
        "((?:\\\\)*)(" +
        "(" + tparams.block.source + ")|" +
        "(" + tparams.comment_multi_begin.source + ")|" +
        "(" + tparams.eval_long_begin.source + ")|" +
        "(" + tparams.interpolate_begin.source + ")|" +
        "(" + tparams.eval_short_begin.source + ")|" +
        "(" + tparams.escape_begin.source + ")|" +
        "(" + tparams.comment_begin.source + ")" +
        ")"
    , "g");
    allbegin.global = true;
    var regexes = {
        slashes: 1,
        match: 2,
        block: 3,
        block_type: 4,
        comment_multi_begin: 5,
        eval_long: 6,
        interpolate: 7,
        eval_short: 8,
        escape: 9,
        comment: 10
    };
    var regex_count = 4;

    var printDirectives = "var __p = '';\n" +
        "var print = function(t) { __p+=t; };\n";

    var escapeDirectives = "var __ematches = {'&': '&amp;','<': '&lt;','>': '&gt;','\"': '&quot;',\"'\": '&#x27;','/': '&#x2F;'};\n" +
        "var escape_function = function(s) {return ('' + (s == null ? '' : s)).replace(/[&<>\"'/]/g, function(a){return __ematches[a]})};\n";

    var compileTemplate = function(text, options) {
        options = _.extend({start: 0, indent: true, noEsc: false, fileMode: false}, options);
        start = options.start;
        var source = "";
        var current = start;
        allbegin.lastIndex = current;
        var text_end = text.length;
        var restart = end;
        var found;
        var functions = [];
        var indent = options.indent ? indent_ : function (txt) { return txt; };
        var rmWhite = options.removeWhitespaces ? function(txt) {
            if (! txt)
                return txt;
            var tmp = _.chain(txt.split("\n")).map(function(x) { return _trim(x) })
                .reject(function(x) { return !x }).value().join("\n");
            if (txt.length >= 1 && txt.charAt(0).match(/\s/))
                tmp = txt.charAt(0) + tmp;
            if (txt.length >= 2 && txt.charAt(txt.length - 1).match(/\s/))
                tmp += txt.charAt(txt.length - 1);
            return tmp;
        } : function(x) { return x };
        var appendPrint = ! options.fileMode ? function(t) {
            source += t ? "__p+=" + t + ";\n" : '';
        }: function() {};
        while (found = allbegin.exec(text)) {
            var to_add = rmWhite(text.slice(current, found.index));
            appendPrint(to_add ? escape_(to_add) : null);
            current = found.index;

            // slash escaping handling
            var slashes = found[regexes.slashes] || "";
            var nbr = slashes.length;
            var nslash = slashes.slice(0, Math.floor(nbr / 2));
            appendPrint(nbr !== 0 ? escape_(nslash) : null);
            if (nbr % 2 !== 0) {
                appendPrint(escape_(found[regexes.match]));
                current = found.index + found[0].length;
                allbegin.lastIndex = current;
                continue;
            }

            if (found[regexes.block]) {
                var block_type = found[regexes.block_type];
                var block_complete = found[regexes.block];
                var block_args = {};
                var block_parse;
                while (block_parse = tparams.block_properties.exec(block_complete)) {
                    block_args[block_parse[1]] = _.unescape(block_parse[2].slice(1, block_parse[2].length - 1));
                }
                if (block_type === "function") {
                    var name = block_args["name"];
                    if (! name || ! name.match(/^\w+$/)) {
                        throw new Error("Function with invalid name");
                    }
                    var sub_compile = compileTemplate(text, _.extend({}, options, {start: found.index + found[0].length, noEsc: true, fileMode: false}));
                    source += "var " + name  + " = function(context) {\n" + indent(sub_compile.header + sub_compile.source
                        + sub_compile.footer) + "}\n";
                    functions.push(name);
                    current = sub_compile.end;
                } else if (block_type === "end") {
                    text_end = found.index;
                    restart = found.index + found[0].length;
                    break;
                } else {
                    throw new Error("Unknown block type: '" + block_type + "'");
                }
            } else if (found[regexes.comment_multi_begin]) {
                tparams.comment_multi_end.lastIndex = found.index + found[0].length;
                var end = tparams.comment_multi_end.exec(text);
                if (!end)
                    throw new Error("{* without corresponding *}");
                current = end.index + end[0].length;
            } else if (found[regexes.eval_long]) {
                tparams.eval_long_end.lastIndex = found.index + found[0].length;
                var end = tparams.eval_long_end.exec(text);
                if (!end)
                    throw new Error("<% without matching %>");
                var code = text.slice(found.index + found[0].length, end.index);
                code = _(code.split("\n")).chain().map(function(x) { return _trim(x) })
                    .reject(function(x) { return !x }).value().join("\n");
                source += code + "\n";
                current = end.index + end[0].length;
            } else if (found[regexes.interpolate]) {
                var braces = /{|}/g;
                braces.lastIndex = found.index + found[0].length;
                var b_count = 1;
                var brace;
                while (brace = braces.exec(text)) {
                    if (brace[0] === "{")
                        b_count++;
                    else {
                        b_count--;
                    }
                    if (b_count === 0)
                        break;
                }
                if (b_count !== 0)
                    throw new Error("%{ without a matching }");
                appendPrint(text.slice(found.index + found[0].length, brace.index));
                current = brace.index + brace[0].length;
            } else if (found[regexes.eval_short]) {
                tparams.eval_short_end.lastIndex = found.index + found[0].length;
                var end = tparams.eval_short_end.exec(text);
                if (!end)
                    throw new Error("impossible state!!");
                source += _trim(text.slice(found.index + found[0].length, end.index)) + "\n";
                current = end.index;
            } else if (found[regexes.escape]) {
                var braces = /{|}/g;
                braces.lastIndex = found.index + found[0].length;
                var b_count = 1;
                var brace;
                while (brace = braces.exec(text)) {
                    if (brace[0] === "{")
                        b_count++;
                    else {
                        b_count--;
                    }
                    if (b_count === 0)
                        break;
                }
                if (b_count !== 0)
                    throw new Error("${ without a matching }");
                appendPrint("escape_function(" + text.slice(found.index + found[0].length, brace.index) + ")");
                current = brace.index + brace[0].length;
            } else { // comment 
                tparams.comment_end.lastIndex = found.index + found[0].length;
                var end = tparams.comment_end.exec(text);
                if (!end)
                    throw new Error("impossible state!!");
                current = end.index + end[0].length;
            }
            allbegin.lastIndex = current;
        }
        var to_add = rmWhite(text.slice(current, text_end));
        appendPrint(to_add ? escape_(to_add) : null);

        if (options.fileMode) {
            var header = escapeDirectives;
            var footer = '';
        } else {
            var header = printDirectives +
                (options.noEsc ? '' : escapeDirectives) +
                "with (context || {}) {\n";
            var footer = "}\nreturn __p;\n";
            source = indent(source);
        }

        return {
            header: header,
            source: source,
            footer: footer,
            end: restart,
            functions: functions
        };
    };

    if (! $) {
        var fs = require("fs");
    }

    // unused for now
    var namespaceFromFileName = function(filename) {
        var namespace = filename.split("/");
        namespace = namespace[namespace.length -1];
        namespace = namespace.split(".");
        namespace = _.filter(_.map(namespace, function(x) {return _trim(x)}), function(x) {return x !== ""});
        if (namespace.length > 1) {
            namespace = _.first(namespace, namespace.length - 1);
        }
        namespace = namespace.join("_");
        namespace = namespace.replace(/[^a-zA-Z0-9_]/g, '_');
        return namespace;
    };

    jiko.TemplateEngine = function() {
        this.__init__();
    };

    _.extend(jiko.TemplateEngine.prototype, {
        __init__: function() {
            this.options = {
                includeInDom: $ ? true : false,
                indent: true,
                removeWhitespaces: true
            };
        },
        loadFile: function(filename) {
            var self = this;
            if ($) {
                return $.get(filename).pipe(function(content) {
                    return self.loadFileContent(content);
                });
            } else {
                var content = fs.readFileSync(filename, "utf8");
                return this.loadFileContent(content);
            }
        },
        loadFileContent: function(file_content) {
            var code = this.compileFile(file_content);

            if (this.options.includeInDom && $) {
                var varname = _.uniqueId("jikotemplate");
                var previous = window[varname];
                code = "window." + varname + " = (" + code + ")();";
                var def = $.Deferred();
                var script   = document.createElement("script");
                script.type  = "text/javascript";
                script.text  = code;
                $("head")[0].appendChild(script);
                $(script).ready(function() {
                    def.resolve();
                });
                var script_result;
                var loaded = false;
                def.then(_.bind(function() {
                    loaded = true;
                    script_result = window[varname];
                    window[varname] = previous;
                }, this));
                // we want this method to behave synchronously, if the browser
                // does not seem to support synchronous inclusion of scripts, we
                // use new Function() method of script loading instead
                if (loaded) {
                    if (script_result) {
                        return script_result;
                    } else {
                        throw new Error("Error during execution of a Jiko template's code");
                    }
                } else {
                    if (typeof(console) !== "undefined")
                        console.log("Could not include compiled Jiko in DOM, fallbacking on new Function().");
                }
            }

            return (new Function("return (" + code + ")();"))();
        },
        compileFile: function(file_content) {
            var result = compileTemplate(file_content, _.extend({}, this.options, {fileMode: true}));
            var to_append = "";
            var last = result.functions.length - 1;
            _.each(_.range(result.functions.length), function(i) {
                var name = result.functions[i];
                to_append += name + ": " + name;
                if (i !== last)
                    to_append += ",";
                to_append += "\n";
            }, this);
            to_append = this.options.indent ? indent_(to_append) : to_append;
            to_append = "return {\n" + to_append + "};\n";
            var code = result.header + result.source + to_append + result.footer;
            code = this.options.indent ? indent_(code) : code;
            code = "function() {\n" + code + "}";
            return code;
        },
        buildTemplate: function(text) {
            var comp = compileTemplate(text, _.extend({}, this.options));
            var result = comp.header + comp.source + comp.footer;
            var func = new Function('context', result);
            return func;
        },
        eval: function(text, context) {
            return this.buildTemplate(text)(context);
        }
    });

    return jiko;
};
})();
