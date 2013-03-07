
if (typeof(exports) !== "undefined") { // nodejs
    _ = require("underscore");
    $ = require('jquery-deferred');
}

var te = new jiko.TemplateEngine();

var transform = function(x) {
    return _.filter(_.map(x.split(/\s+/), function(el) { return el.trim(); }),
        function(el) { return el; }).join(" ");
};

var load_def = te.loadFile("templates.html");

$.when(load_def).pipe(function(templates) {

test("base", function() {
    var r = templates.yop();
    equal(r.trim(), "Hello");
    r = templates.test({test_var: "azerty"});
    equal(r.trim(), "azerty");
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
    equal(r.trim(), "&lt;div&gt;&lt;&#x2F;div&gt;");
});

test("noescaping", function() {
    var r = templates.testnoescaping();
    equal(r.trim(), "<div></div>");
});

test("this", function() {
    var obj = {str: "test"};
    var r = templates.test_this.call(obj);
    equal(r.trim(), obj.str);
});

test("slash_escape", function() {
    var tmpl = te.buildTemplate("\\${1+1}");
    equal(tmpl(), "${1+1}");
    var tmpl = te.buildTemplate("\\\\${1+1}");
    equal(tmpl(), "\\2");
    var tmpl = te.buildTemplate("\\\\\\${1+1}");
    equal(tmpl(), "\\${1+1}");
    var tmpl = te.buildTemplate("\\\\\\\\${1+1}");
    equal(tmpl(), "\\\\2");
    var tmpl = te.buildTemplate("\\\\\\\\\\${1+1}");
    equal(tmpl(), "\\\\${1+1}");
    var tmpl = te.buildTemplate("\\${1+1}\n${1+1}");
    equal(tmpl(), "${1+1}\n2");
    var tmpl = te.buildTemplate("\\\\${1+1}\n${1+1}");
    equal(tmpl(), "\\2\n2");
});

test("def", function() {
    var r = templates.testDef();
    equal(r.trim(), "Test");
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

test("multiSingleLine", function() {
    var r = templates.multiSingleLine();
    equal(transform(r), "Test");
    r = te.eval("\n\n%if (true === true) {\nTest\n%}\n\n");
    equal(transform(r), "Test");
});

test("print", function() {
    var r = templates.printtest();
    equal(transform(r), "Test");
});

test("singleLineEventSlashEscape", function() {
    var r = te.eval("\\\n%print(1+1)");
    equal(r, "\n%print(1+1)");
    var r = te.eval("\\\\\n%print(1+1)");
    equal(r, "\\2");
});

test("keepUsefulWhitespaces", function() {
    var r = te.eval("Foo ${bar}", {bar:"Bar"});
    equal(r, "Foo Bar");
    var r = te.eval("${bar} Foo", {bar:"Bar"});
    equal(r, "Bar Foo");
    var r = te.eval("Foo\n%if(true===true)\nBar", {bar:"Bar"});
    equal(transform(r), "Foo Bar");
});

test("doesNotAddSpaces", function() {
    var r = te.eval("Foo${bar}", {bar:"Bar"});
    equal(r, "FooBar");
    var r = te.eval("${bar}Foo", {bar:"Bar"});
    equal(r, "BarFoo");
});


});