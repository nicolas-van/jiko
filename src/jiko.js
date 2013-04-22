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
    underscore.extend(exports, declare(underscore, true));
} else if (typeof(define) !== "undefined") { // amd
    define(["underscore"], declare);
} else { // define global variable
    jiko = declare(_);
}


function declare(_, is_node) {
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
        block: /\{%\s*(\w+)(?:\s+(?:\w+)\s*=\s*(?:(?:"(?:.+?)")|(?:'(?:.+?)')))*\s*%\}/gm,
        block_properties: /(\w+)\s*=\s*((?:"(?:.+?)")|(?:'(?:.+?)'))/gm,
        comment_multi_begin: /\{\*/gm,
        comment_multi_end: /\*\}/gm,
        eval_long_begin: /<%/gm,
        eval_long_end: /%>/gm,
        eval_short_begin: /^\\*[ \t]*%(?!{)/gm,
        eval_short_end: /\n|$/gm,
        escape_begin: /\${/gm,
        interpolate_begin: /%{/gm,
        comment_begin: /##/gm,
        comment_end: /\n|$/gm,
        slashes: /\\*/gm,
        slash_begin: /^\\*/g
    };
    var allbegin = new RegExp(
        "(" + tparams.slashes.source + ")(" +
        "(" + tparams.block.source + ")|" +
        "(" + tparams.comment_multi_begin.source + ")|" +
        "(" + tparams.eval_long_begin.source + ")|" +
        "(" + tparams.interpolate_begin.source + ")|" +
        "(" + tparams.eval_short_begin.source + ")|" +
        "(" + tparams.escape_begin.source + ")|" +
        "(" + tparams.comment_begin.source + ")" +
        ")"
    , "gm");
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
        "var print = function(t) { __p += t; };\n";

    var escapeDirectives = "var __ematches = {'&': '&amp;','<': '&lt;','>': '&gt;','\"': '&quot;',\"'\": '&#x27;','/': '&#x2F;'};\n" +
        "var escape_function = function(s) {return ('' + (s == null ? '' : s)).replace(/[&<>\"'/]/g, function(a){return __ematches[a]})};\n" +
        "var exports = {};\n";

    var compile = function(text, options) {
        options = _.extend({start: 0, noEsc: false, fileMode: false, removeWhitespaces: true}, options);
        start = options.start;
        var source = "";
        var current = start;
        allbegin.lastIndex = current;
        var text_end = text.length;
        var restart = end;
        var found;
        var rmWhite = options.removeWhitespaces ? function(txt) {
            if (! txt)
                return txt;
            var tmp = _.chain(txt.split("\n")).map(function(x) { return _trim(x) })
                .reject(function(x) { return !x }).value().join("\n");
            if (txt.charAt(0).match(/\s/) && ! tmp.charAt(0).match(/\s/))
                tmp = txt.charAt(0) + tmp;
            if (txt.charAt(txt.length - 1).match(/\s/) && ! tmp.charAt(tmp.length - 1).match(/\s/))
                tmp += txt.charAt(txt.length - 1);
            return tmp;
        } : function(x) { return x };
        var appendPrint = ! options.fileMode ? function(t) {
            source += t ? "__p += " + t + ";\n" : '';
        }: function() {};
        var escapePrint = function(t) {
            t = (t || '').split("\n");
            for(var i = 0; i < t.length; i++) {
                var v = t[i];
                if (i < t.length - 1)
                    v += "\n";
                else if (! v)
                    continue;
                appendPrint(escape_(v));
            }
        };
        while (found = allbegin.exec(text)) {
            var to_add = rmWhite(text.slice(current, found.index));
            escapePrint(to_add);
            current = found.index;

            // slash escaping handling
            tparams.slash_begin.lastIndex = 0;
            var find_slash = tparams.slash_begin.exec(found[0]);
            var slashes = find_slash ? find_slash[0] : "";
            var nbr = slashes.length;
            var nslash = slashes.slice(0, Math.floor(nbr / 2));
            escapePrint(nbr !== 0 ? nslash : null);
            if (nbr % 2 !== 0) {
                escapePrint(found[0].slice(slashes.length));
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
                    var sub_compile = compile(text, _.extend({}, options, {start: found.index + found[0].length, noEsc: true, fileMode: false}));
                    source += "var " + name  + " = function(context) {\n" + indent_(sub_compile.source) + "};\n";
                    if (options.fileMode) {
                        source += "exports." + name + " = " + name + ";\n";
                    }
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
        escapePrint(to_add );

        if (options.fileMode) {
            source = escapeDirectives + source + "return exports;\n";
        } else {
            source = (options.noEsc ? '' : escapeDirectives) + printDirectives +
                "with (context || {}) {\n" + indent_(source) + "}\nreturn __p;\n";
        }

        return {
            source: source,
            end: restart
        };
    };

    jiko.loadFile = function(filename) {
        var result;
        if (! is_node) {
            var req = new XMLHttpRequest();
            req.open("GET", filename, false);
            req.send();
            result = req.responseText;
        } else {
            var fs = require("fs");
            result = fs.readFileSync(filename, "utf8");
        }
        return jiko.loadFileContent(result, filename);
    };

    jiko.loadFileContent = function(file_content, options) {
        options = options || {};
        var code = jiko.compileFile(file_content);

        var debug = options.filename ? "\n//@ sourceURL=" + options.filename : "";

        return eval("(" + code + ")();" + debug);
    };

    jiko.compileFile = function(file_content) {
        var code = compile(file_content, {fileMode: true}).source;
        code = "function() {\n" + indent_(code) + "}";
        return code;
    };

    jiko.eval = function(text, context) {
        return this.loadTemplate(text)(context);
    };

    jiko.loadTemplate = function(text) {
        var code = jiko.compileTemplate(text);
        return new Function("return (" + code + ");")();
    };

    jiko.compileTemplate = function(text) {
        var code = compile(text).source;
        code = "function(context) {\n" + indent_(code) + "}";
        return code;
    };

    return jiko;
};
})();
