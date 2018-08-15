
// only runs in node

var _ = require("underscore");
var assert = require("assert");
var fs = require("fs");
var execSync = require("child_process").execSync;

var rm = function(f) {
    if (fs.existsSync(f))
        fs.unlinkSync(f);
};

test("function", function() {
    try {
        var code = execSync('./jiko_cli.js compile ./test_templates/exfunction.html');
        var tmpl = require("./test_templates/exfunction");
        var res = tmpl();
        assert.equal(res.trim().replace(/\s+/g, " "), "Hello World");
    } finally {
        rm("./test_templates/exfunction.js");
    }
});

test("module", function() {
    try {
        var code = execSync('./jiko_cli.js compile ./test_templates/exmodule.html');
        var tmpl = require("./test_templates/exmodule");
        var res = tmpl.func2();
        assert.equal(res.trim().replace(/\s+/g, " "), "<div> zzz yyy");
    } finally {
        rm("./test_templates/exmodule.js");
    }
});
