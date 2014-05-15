
// only runs in browser

(function() {
"use strict";

var trim = function(t) {
    return t.replace(/^\s+|\s+$/g, '');
};

describe("Jiko Server-side Compilation", function() {

it("function", function() {
    var res = exfunction();
    assert.equal(trim(res).replace(/\s+/g, " "), "Hello World");
});

it("module", function() {
    var res = exmodule.func2();
    assert.equal(trim(res).replace(/\s+/g, " "), "<div> zzz yyy");
});

});

})();
