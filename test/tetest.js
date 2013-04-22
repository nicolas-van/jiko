
if (typeof(exports) !== "undefined") { // nodejs
    _ = require("underscore");
    $ = require('jquery-deferred');
}

var trim = function(t) {
    return t.replace(/^\s+|\s+$/g, ''); 
};

var transform = function(x) {
    return _.filter(_.map(x.split(/\s+/), function(el) { return trim(el); }),
        function(el) { return el; }).join(" ");
};

var templates = jiko.loadFile("templates.html");

test("base", function() {
    var r = templates.yop();
    equal(trim(r), "Hello");
    r = templates.test({test_var: "azerty"});
    equal(trim(r), "azerty");
    r = templates.test2({lst: [1, 2, 3]});
    r = transform(r);
    equal(r, "1 2 3");
    r = templates.test3({lst: [2, 3, 4]});
    r = transform(r);
    equal(r, "2 3 4");
    r = templates.testfct();
    equal(transform(r), "abc def");

});

test("escaping", function() {
    var r = templates.testescaping();
    equal(trim(r), "&lt;div&gt;&lt;&#x2F;div&gt;");
});

test("noescaping", function() {
    var r = templates.testnoescaping();
    equal(trim(r), "<div></div>");
});

test("this", function() {
    var obj = {str: "test"};
    var r = templates.test_this.call(obj);
    equal(trim(r), obj.str);
});

test("slash_escape", function() {
    var tmpl = jiko.buildTemplate("\\${1+1}");
    equal(tmpl(), "${1+1}");
    var tmpl = jiko.buildTemplate("\\\\${1+1}");
    equal(tmpl(), "\\2");
    var tmpl = jiko.buildTemplate("\\\\\\${1+1}");
    equal(tmpl(), "\\${1+1}");
    var tmpl = jiko.buildTemplate("\\\\\\\\${1+1}");
    equal(tmpl(), "\\\\2");
    var tmpl = jiko.buildTemplate("\\\\\\\\\\${1+1}");
    equal(tmpl(), "\\\\${1+1}");
    var tmpl = jiko.buildTemplate("\\${1+1}\n${1+1}");
    equal(tmpl(), "${1+1}\n2");
    var tmpl = jiko.buildTemplate("\\\\${1+1}\n${1+1}");
    equal(tmpl(), "\\2\n2");
});

test("def", function() {
    var r = templates.testDef();
    equal(trim(r), "Test");
});

test("functional_prog", function() {
    var r = templates.testFunctional();
    equal(transform(r), "<div> Test </div>");
});

test("comment", function() {
    var r = templates.testComment();
    equal(transform(r), "Test");
});

test("multiComment", function() {
    var r = templates.testMultiComment();
    equal(transform(r), "Test");
});

test("print", function() {
    var r = templates.printtest();
    equal(transform(r), "Test");
});

test("singleLineEventSlashEscape", function() {
    var r = jiko.eval("\n\\%print(1+1)");
    equal(r, "\n%print(1+1)");
    var r = jiko.eval("\n\\\\%print(1+1)");
    equal(r, "\n\\2");
});

test("keepUsefulWhitespaces", function() {
    var r = jiko.eval("Foo ${bar}", {bar:"Bar"});
    equal(r, "Foo Bar");
    var r = jiko.eval("${bar} Foo", {bar:"Bar"});
    equal(r, "Bar Foo");
    var r = jiko.eval("Foo\n%if(true===true){\nBar\n%}");
    equal(transform(r), "Foo Bar");
});

test("doesNotAddSpaces", function() {
    var r = jiko.eval("Foo${bar}", {bar:"Bar"});
    equal(r, "FooBar");
    var r = jiko.eval("${bar}Foo", {bar:"Bar"});
    equal(r, "BarFoo");
});

test("singleLinePreviousSpace", function() {
    var r = templates.singleLinePreviousSpace();
    equal(transform(r), "abc def");
});
