
var jiko = require('./jiko');
var _ = require('underscore');

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
    expect(trim(r)).toBe("Hello");
    r = templates.test({testVar: "azerty"});
    expect(trim(r)).toBe("azerty");
    r = templates.test2({lst: [1, 2, 3]});
    r = transform(r);
    expect(r).toBe("1 2 3");
    r = templates.test3({lst: [2, 3, 4]});
    r = transform(r);
    expect(r).toBe("2 3 4");
    r = templates.testfct();
    expect(transform(r)).toBe("abc def");

});

test("escaping", function() {
    var r = templates.testescaping();
    expect(trim(r)).toBe("&lt;div&gt;&lt;&#x2F;div&gt;");
});

test("noescaping", function() {
    var r = templates.testnoescaping();
    expect(trim(r)).toBe("<div></div>");
});

test("this", function() {
    var obj = {str: "test"};
    var r = templates.testThis.call(obj);
    expect(trim(r)).toBe(obj.str);
});

test("slash_escape", function() {
    var tmpl = jiko.loadTemplate("\\${1+1}");
    expect(tmpl()).toBe("${1+1}");
    tmpl = jiko.loadTemplate("\\\\${1+1}");
    expect(tmpl()).toBe("\\2");
    tmpl = jiko.loadTemplate("\\\\\\${1+1}");
    expect(tmpl()).toBe("\\${1+1}");
    tmpl = jiko.loadTemplate("\\\\\\\\${1+1}");
    expect(tmpl()).toBe("\\\\2");
    tmpl = jiko.loadTemplate("\\\\\\\\\\${1+1}");
    expect(tmpl()).toBe("\\\\${1+1}");
    tmpl = jiko.loadTemplate("\\${1+1}\n${1+1}");
    expect(tmpl()).toBe("${1+1}\n2");
    tmpl = jiko.loadTemplate("\\\\${1+1}\n${1+1}");
    expect(tmpl()).toBe("\\2\n2");
});

test("def", function() {
    var r = templates.testDef();
    expect(trim(r)).toBe("Test");
});

test("functional_prog", function() {
    var r = templates.testFunctional();
    expect(transform(r)).toBe("<div> Test </div>");
});

test("comment", function() {
    var r = templates.testComment();
    expect(transform(r)).toBe("Test");
});

test("multiComment", function() {
    var r = templates.testMultiComment();
    expect(transform(r)).toBe("Test");
});

test("print", function() {
    var r = templates.printtest();
    expect(transform(r)).toBe("Test");
});

test("singleLineEventSlashEscape", function() {
    var r = jiko.evaluate("\n\\%o += 1+1");
    expect(r).toBe("\n%o += 1+1");
    r = jiko.evaluate("\n\\\\%o += 1+1");
    expect(r).toBe("\n\\2");
});

test("keepUsefulWhitespaces", function() {
    var r = jiko.evaluate("Foo ${a.bar}", {bar:"Bar"});
    expect(r).toBe("Foo Bar");
    r = jiko.evaluate("${a.bar} Foo", {bar:"Bar"});
    expect(r).toBe("Bar Foo");
    r = jiko.evaluate("Foo\n%if(true===true){\nBar\n%}");
    expect(transform(r)).toBe("Foo Bar");
});

test("doesNotAddSpaces", function() {
    var r = jiko.evaluate("Foo${a.bar}", {bar:"Bar"});
    expect(r).toBe("FooBar");
    r = jiko.evaluate("${a.bar}Foo", {bar:"Bar"});
    expect(r).toBe("BarFoo");
});

test("singleLinePreviousSpace", function() {
    var r = templates.singleLinePreviousSpace();
    expect(transform(r)).toBe("abc def");
});

test("multiSingleLine", function() {
    var r = templates.multiSingleLine();
    expect(transform(r)).toBe("Test");
    r = jiko.evaluate("\n\n%if (true === true) {\nTest\n%}\n\n");
    expect(transform(r)).toBe("Test");
});
