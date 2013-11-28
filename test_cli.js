
(function() {
"use strict";

var assert = require("assert");
var _ = require("underscore");
var fs = require("fs");
var sh = require("execSync");

describe("Jiko cli", function() {

var rm = function(f) {
    if (fs.existsSync(f))
        fs.unlinkSync(f);
};

it("function", function() {
    try {
        var code = sh.run('./jiko_cli.js compile ./test_templates/exfunction.html');
        assert.equal(code, 0);
        var tmpl = require("./test_templates/exfunction");
        var res = tmpl();
        assert.equal(res.trim().replace(/\s+/g, " "), "Hello World");
    } finally {
        rm("./test_templates/exfunction.js");
    }
});

it("module", function() {
    try {
        var code = sh.run('./jiko_cli.js compile ./test_templates/exmodule.html');
        assert.equal(code, 0);
        var tmpl = require("./test_templates/exmodule");
        var res = tmpl.func2();
        assert.equal(res.trim().replace(/\s+/g, " "), "<div> zzz yyy");
    } finally {
        rm("./test_templates/exmodule.js");
    }
});

});

})();
