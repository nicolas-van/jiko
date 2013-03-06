/*
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
    var underscore = require("underscore")
    underscore.extend(exports, declare(underscore, null));
} else if (typeof(define) !== "undefined") { // amd
    define(["underscore", "jquery"], declare);
} else { // define global variable 'nova'
    jiko = declare(_, $);
}

function declare(_, $) {
    var jiko = {};

    /*
        Nova Template Engine
    */
    var escape_ = function(text) {
        return JSON.stringify(text);
    }
    var indent_ = function(txt) {
        var tmp = _.map(txt.split("\n"), function(x) { return "    " + x; });
        tmp.pop();
        tmp.push("");
        return tmp.join("\n");
    };
    var tparams = {
        def_begin: /<%\s*def\s+(?:name=(?:(?:"(.+?)")|(?:'(.+?)')))\s*>/g,
        def_end: /<\/%\s*def\s*>/g,
        comment_multi_begin: /<%\s*doc\s*>/g,
        comment_multi_end: /<\/%\s*doc\s*>/g,
        eval_long_begin: /<%/g,
        eval_long_end: /%>/g,
        eval_short_begin: /(?:^|\n)[[ \t]*%(?!{)/g,
        eval_short_end: /\n|$/g,
        escape_begin: /\${/g,
        interpolate_begin: /%{/g,
        comment_begin: /##/g,
        comment_end: /\n|$/g
    };
    // /<%\s*def\s+(?:name=(?:"(.+?)"))\s*%>([\s\S]*?)<%\s*def\s*%>/g
    var allbegin = new RegExp(
        "((?:\\\\)*)(" +
        "(" + tparams.def_begin.source + ")|" +
        "(" + tparams.def_end.source + ")|" +
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
        def_begin: 3,
        def_name1: 4,
        def_name2: 5,
        def_end: 6,
        comment_multi_begin: 7,
        eval_long: 8,
        interpolate: 9,
        eval_short: 10,
        escape: 11,
        comment: 12
    };
    var regex_count = 4;

    var compileTemplate = function(text, options) {
        options = _.extend({start: 0, indent: true}, options);
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
            var tmp = _.chain(txt.split("\n")).map(function(x) { return x.trim() })
                .reject(function(x) { return !x }).value().join("\n");
            if (txt.length >= 1 && txt[0].match(/\s/))
                tmp = txt[0] + tmp;
            if (txt.length >= 2 && txt[txt.length - 1].match(/\s/))
                tmp += txt[txt.length - 1];
            return tmp;
        } : function(x) { return x };
        while (found = allbegin.exec(text)) {
            var to_add = rmWhite(text.slice(current, found.index));
            source += to_add ? "__p+=" + escape_(to_add) + ";\n" : '';
            current = found.index;

            // slash escaping handling
            var slashes = found[regexes.slashes] || "";
            var nbr = slashes.length;
            var nslash = slashes.slice(0, Math.floor(nbr / 2));
            source += nbr !== 0 ? "__p+=" + escape_(nslash) + ";\n" : "";
            if (nbr % 2 !== 0) {
                source += "__p+=" + escape_(found[regexes.match]) + ";\n";
                current = found.index + found[0].length;
                allbegin.lastIndex = current;
                continue;
            }

            if (found[regexes.def_begin]) {
                var sub_compile = compileTemplate(text, _.extend({}, options, {start: found.index + found[0].length}));
                var name = (found[regexes.def_name1] || found[regexes.def_name2]);
                source += "var " + name  + " = function(context) {\n" + indent(sub_compile.header + sub_compile.source
                    + sub_compile.footer) + "}\n";
                functions.push(name);
                current = sub_compile.end;
            } else if (found[regexes.def_end]) {
                text_end = found.index;
                restart = found.index + found[0].length;
                break;
            } else if (found[regexes.comment_multi_begin]) {
                tparams.comment_multi_end.lastIndex = found.index + found[0].length;
                var end = tparams.comment_multi_end.exec(text);
                if (!end)
                    throw new Error("<%doc> without corresponding </%doc>");
                current = end.index + end[0].length;
            } else if (found[regexes.eval_long]) {
                tparams.eval_long_end.lastIndex = found.index + found[0].length;
                var end = tparams.eval_long_end.exec(text);
                if (!end)
                    throw new Error("<% without matching %>");
                var code = text.slice(found.index + found[0].length, end.index);
                code = _(code.split("\n")).chain().map(function(x) { return x.trim() })
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
                source += "__p+=" + text.slice(found.index + found[0].length, brace.index) + ";\n"
                current = brace.index + brace[0].length;
            } else if (found[regexes.eval_short]) {
                tparams.eval_short_end.lastIndex = found.index + found[0].length;
                var end = tparams.eval_short_end.exec(text);
                if (!end)
                    throw new Error("impossible state!!");
                source += text.slice(found.index + found[0].length, end.index).trim() + "\n";
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
                source += "__p+=_.escape(" + text.slice(found.index + found[0].length, brace.index) + ");\n"
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
        source += to_add ? "__p+=" + escape_(to_add) + ";\n" : "";

        var header = "var __p = ''; var print = function() { __p+=Array.prototype.join.call(arguments, '') };\n" +
          "with (context || {}) {\n";
        var footer = "}\nreturn __p;\n";
        source = indent(source);

        return {
            header: header,
            source: source,
            footer: footer,
            end: restart,
            functions: functions,
        };
    };

    jiko.TemplateEngine = function() {
        this.__init__();
    };

    _.extend(jiko.TemplateEngine.prototype, {
        __init__: function() {
            this.resetEnvironment();
            this.options = {
                includeInDom: $ ? true : false,
                indent: true,
                removeWhitespaces: true,
            };
        },
        loadFile: function(filename) {
            var self = this;
            return $.get(filename).pipe(function(content) {
                return self.loadFileContent(content);
            });
        },
        loadFileContent: function(file_content) {
            var code = this.compileFile(file_content);

            if (this.options.includeInDom) {
                var varname = _.uniqueId("novajstemplate");
                var previous = window[varname];
                code = "window." + varname + " = " + code + ";";
                var def = $.Deferred();
                var script   = document.createElement("script");
                script.type  = "text/javascript";
                script.text  = code;
                $("head")[0].appendChild(script);
                $(script).ready(function() {
                    def.resolve();
                });
                def.then(_.bind(function() {
                    var tmp = window[varname];
                    window[varname] = previous;
                    this.includeTemplates(tmp);
                }, this));
                return def;
            } else {
                console.log("return (" + code + ")(context);");
                return this.includeTemplates(new Function('context', "return (" + code + ")(context);"));
            }
        },
        compileFile: function(file_content) {
            var result = compileTemplate(file_content, _.extend({}, this.options));
            var to_append = "";
            _.each(result.functions, function(name) {
                to_append += name + ": " + name + ",\n";
            }, this);
            to_append = this.options.indent ? indent_(to_append) : to_append;
            to_append = "return {\n" + to_append + "};\n";
            to_append = this.options.indent ? indent_(to_append) : to_append;
            var code = "function(context) {\n" + result.header +
                result.source + to_append + result.footer + "}\n";
            return code;
        },
        includeTemplates: function(fct) {
            var add = _.extend({engine: this}, this._env);
            var functions = fct(add);
            _.each(functions, function(func, name) {
                if (this[name])
                    throw new Error("The template '" + name + "' is already defined");
                this[name] = func;
            }, this);
        },
        buildTemplate: function(text) {
            var comp = compileTemplate(text, _.extend({}, this.options));
            var result = comp.header + comp.source + comp.footer;
            var add = _.extend({engine: this}, this._env);
            var func = new Function('context', result);
            return function(data) {
                return func.call(this, _.extend(add, data));
            };
        },
        eval: function(text, context) {
            return this.buildTemplate(text)(context);
        },
        resetEnvironment: function(nenv) {
            this._env = {_: _};
            this.extendEnvironment(nenv);
        },
        extendEnvironment: function(env) {
            _.extend(this._env, env || {});
        },
    });

    return jiko;
};
})();
