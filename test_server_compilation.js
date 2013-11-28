
// only runs in browser

(function() {
"use strict";

describe("Jiko Server-side Compilation", function() {

it("function", function() {
    var res = exfunction();
    assert.equal(res.trim().replace(/\s+/g, " "), "Hello World");
});

it("module", function() {
    var res = exmodule.func2();
    assert.equal(res.trim().replace(/\s+/g, " "), "<div> zzz yyy");
});

});

})();
