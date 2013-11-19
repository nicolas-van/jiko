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
/* jshint evil: true */
"use strict";

if (typeof(exports) !== "undefined") { // nodejs
    var underscore = require("underscore");
    underscore.extend(exports, declare(underscore, true));
} else if (typeof(define) !== "undefined") { // amd
    define(["underscore"], declare);
} else { // define global variable
    window.jiko = declare(_);
}


function declare(_, isNode) {
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
    _.each(_.keys(escapes), function(p) { escapes[escapes[p]] = p; });
    var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
    var escape_ = function(text) {
        return "'" + text.replace(escaper, function(match) {
            return '\\' + escapes[match];
        }) + "'";
    };
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
        blockProperties: /(\w+)\s*=\s*((?:"(?:.+?)")|(?:'(?:.+?)'))/gm,
        commentMultiBegin: /\{\*/gm,
        commentMultiEnd: /\*\}/gm,
        evalLongBegin: /<%/gm,
        evalLongEnd: /%>/gm,
        evalShortBegin: /^\\*[ \t]*%(?!{)/gm,
        evalShortEnd: /\n|$/gm,
        evalBegin: /\${/gm,
        interpolateBegin: /%{/gm,
        commentBegin: /##/gm,
        commentEnd: /\n|$/gm,
        slashes: /\\*/gm,
        slashBegin: /^\\*/g
    };
    var allbegin = new RegExp(
        "(" + tparams.slashes.source + ")(" +
        "(" + tparams.block.source + ")|" +
        "(" + tparams.commentMultiBegin.source + ")|" +
        "(" + tparams.evalLongBegin.source + ")|" +
        "(" + tparams.interpolateBegin.source + ")|" +
        "(" + tparams.evalShortBegin.source + ")|" +
        "(" + tparams.evalBegin.source + ")|" +
        "(" + tparams.commentBegin.source + ")" +
        ")",
        "gm");
    var regexes = {
        slashes: 1,
        match: 2,
        block: 3,
        blockType: 4,
        commentMultiBegin: 5,
        evalLong: 6,
        interpolate: 7,
        evalShort: 8,
        escape: 9,
        comment: 10
    };
    var regexCount = 4;

    var printDirectives = "var __p = '';\n" +
        "var print = function(t) { __p += t; };\n";

    var escapeDirectives = "var __ematches = {'&': '&amp;','<': '&lt;','>': '&gt;" +
        "','\"': '&quot;',\"'\": '&#x27;','/': '&#x2F;'};\n" +
        "var escape_function = function(s) {return ('' + (s == null ? '' : s))" +
        ".replace(/[&<>\"'/]/g, function(a){return __ematches[a]})};\n";

    var compile = function(text, options) {
        /* jshint loopfunc: true */
        options = _.extend({start: 0, noEsc: false, fileMode: false, removeWhitespaces: true}, options);
        var start = options.start;
        var source = "";
        var current = start;
        allbegin.lastIndex = current;
        var textEnd = text.length;
        var restart = textEnd;
        var found;
        var rmWhite = options.removeWhitespaces ? function(txt) {
            if (! txt)
                return txt;
            var tmp = _.chain(txt.split("\n")).map(function(x) { return _trim(x); })
                .reject(function(x) { return !x; }).value().join("\n");
            if (txt.charAt(0).match(/\s/) && ! tmp.charAt(0).match(/\s/))
                tmp = txt.charAt(0) + tmp;
            if (txt.charAt(txt.length - 1).match(/\s/) && ! tmp.charAt(tmp.length - 1).match(/\s/))
                tmp += txt.charAt(txt.length - 1);
            return tmp;
        } : function(x) { return x; };
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
        var end, braces, bCount, brace, toAdd;
        while ((found = allbegin.exec(text))) {
            toAdd = rmWhite(text.slice(current, found.index));
            escapePrint(toAdd);
            current = found.index;

            // slash escaping handling
            tparams.slashBegin.lastIndex = 0;
            var findSlash = tparams.slashBegin.exec(found[0]);
            var slashes = findSlash ? findSlash[0] : "";
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
                var blockType = found[regexes.blockType];
                var blockComplete = found[regexes.block];
                var blockArgs = {};
                var blockParse;
                while ((blockParse = tparams.blockProperties.exec(blockComplete))) {
                    blockArgs[blockParse[1]] = _.unescape(blockParse[2].slice(1, blockParse[2].length - 1));
                }
                if (blockType === "function") {
                    var name = blockArgs.name;
                    if (! name || ! name.match(/^\w+$/)) {
                        throw new Error("Function with invalid name");
                    }
                    var subCompile = compile(text, _.extend({}, options, {start: found.index + found[0].length,
                        noEsc: true, fileMode: false}));
                    source += "var " + name  + " = function(context) {\n" + indent_(subCompile.source) + "};\n";
                    if (options.fileMode) {
                        source += "exports." + name + " = " + name + ";\n";
                    }
                    current = subCompile.end;
                } else if (blockType === "end") {
                    textEnd = found.index;
                    restart = found.index + found[0].length;
                    break;
                } else {
                    throw new Error("Unknown block type: '" + blockType + "'");
                }
            } else if (found[regexes.commentMultiBegin]) {
                tparams.commentMultiEnd.lastIndex = found.index + found[0].length;
                end = tparams.commentMultiEnd.exec(text);
                if (!end)
                    throw new Error("{* without corresponding *}");
                current = end.index + end[0].length;
            } else if (found[regexes.evalLong]) {
                tparams.evalLongEnd.lastIndex = found.index + found[0].length;
                end = tparams.evalLongEnd.exec(text);
                if (!end)
                    throw new Error("<% without matching %>");
                var code = text.slice(found.index + found[0].length, end.index);
                code = _(code.split("\n")).chain().map(function(x) { return _trim(x); })
                    .reject(function(x) { return !x; }).value().join("\n");
                source += code + "\n";
                current = end.index + end[0].length;
            } else if (found[regexes.interpolate]) {
                braces = /{|}/g;
                braces.lastIndex = found.index + found[0].length;
                bCount = 1;
                while ((brace = braces.exec(text))) {
                    if (brace[0] === "{")
                        bCount++;
                    else {
                        bCount--;
                    }
                    if (bCount === 0)
                        break;
                }
                if (bCount !== 0)
                    throw new Error("%{ without a matching }");
                appendPrint(_trim(text.slice(found.index + found[0].length, brace.index)));
                current = brace.index + brace[0].length;
            } else if (found[regexes.evalShort]) {
                tparams.evalShortEnd.lastIndex = found.index + found[0].length;
                end = tparams.evalShortEnd.exec(text);
                if (!end)
                    throw new Error("impossible state!!");
                source += _trim(text.slice(found.index + found[0].length, end.index)) + "\n";
                current = end.index + end[0].length;
            } else if (found[regexes.escape]) {
                braces = /{|}/g;
                braces.lastIndex = found.index + found[0].length;
                bCount = 1;
                while ((brace = braces.exec(text))) {
                    if (brace[0] === "{")
                        bCount++;
                    else {
                        bCount--;
                    }
                    if (bCount === 0)
                        break;
                }
                if (bCount !== 0)
                    throw new Error("${ without a matching }");
                appendPrint("escape_function(" + _trim(text.slice(found.index + found[0].length, brace.index)) + ")");
                current = brace.index + brace[0].length;
            } else { // comment 
                tparams.commentEnd.lastIndex = found.index + found[0].length;
                end = tparams.commentEnd.exec(text);
                if (!end)
                    throw new Error("impossible state!!");
                current = end.index + end[0].length;
            }
            allbegin.lastIndex = current;
        }
        toAdd = rmWhite(text.slice(current, textEnd));
        escapePrint(toAdd);

        if (options.fileMode) {
            source = escapeDirectives + "var exports = {};\n" + source + "return exports;\n";
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
        if (! isNode) {
            var req = new XMLHttpRequest();
            req.open("GET", filename, false);
            req.send();
            result = req.responseText;
        } else {
            var fs = require("fs");
            result = fs.readFileSync(filename, "utf8");
        }
        return jiko.loadFileContent(result, {filename: filename});
    };

    jiko.loadFileContent = function(fileContent, options) {
        options = options || {};
        var code = jiko.compileFile(fileContent);

        var debug = options.filename ? "\n//@ sourceURL=" + options.filename : "";

        return new Function("return (" + code + ")();" + debug)();
    };

    jiko.compileFile = function(fileContent) {
        var code = compile(fileContent, {fileMode: true}).source;
        code = "function() {\n" + indent_(code) + "}";
        return code;
    };

    jiko.evaluate = function(text, context) {
        return jiko.loadTemplate(text)(context);
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
}
})();
