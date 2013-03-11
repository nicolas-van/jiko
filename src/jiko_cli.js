

var _ = require('underscore');
var jiko = require('./jiko');
var fs = require("fs");
var path = require("path");


var program = require('commander');
program.version('0.7.0');

var _trim = function(t) {
    return t.trim();
}
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

var compile = program.command('compile <file>');
compile.description('Compile a Jiko template file to a javascript file.')
    .option('-o, --output', 'Do not automatically write file, outputs in console instead.')
    .option('-i, --noindent', 'Do not indent file.')
    .option('-w, --whitespaces', 'Do not remove whitespaces.')
    .action(function(filename, env){
        var content = fs.readFileSync(filename, "utf8");
        var namespace = namespaceFromFileName(filename);
        var te = new jiko.TemplateEngine();
        _.extend(te.options, {
            indent: ! compile.noindent,
            removeWhitespaces: ! compile.whitespaces,
        });
        var compiled = te.compileFile(content);
        compiled = "(function() {\n" +
            "var declare = " + compiled + ";\n" +
            "if (typeof(define) !== 'undefined') {\n" +
            "    define([], declare);\n" +
            "} else if (typeof(exports) !== 'undefined') {\n" +
            "    module.exports = declare();\n" +
            "} else {\n" +
            "    " + namespace + " = declare();\n" +
            "}\n" +
            "})();";
        if (compile.output) {
            console.log(compiled);
        } else {
            var n_name = path.join(path.dirname(filename), namespace + ".js");
            fs.writeFileSync(n_name, compiled, "utf8");
        }
    });

program.parse(process.argv);

