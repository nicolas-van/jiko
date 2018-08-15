
Syntax Guide
============

{% raw  %}

Before explaining the syntax of Jiko in details, it's important to notice that all Jiko templates are compiled to
JavaScript code. Every syntax element has an equivalent in JavaScript and understanding the resulting code can be
useful.

To ease debugging, Jiko was created to generate a JavaScript code as clean as possible. So you are invited to take a
look at that generated code to precisely understand how Jiko works.

Expression Escaping
-------------------

The most basic task of a template engine is probably to output the result of an expression. Jiko uses the `${}` syntax:

    The current time is ${new Date().toString()}.

Expressions inside `${}` must simply be any kind of valid JavaScript expression.

Every time the `${}` construct is used, `escapeFunction()` will be called with the result of the expression evaluation.
`escapeFunction()` is a function defined in all Jiko compiled templates. Its default behavior is to escape HTML. So all
expressions given to `${}` will be escaped.

Please note that you could redefine `escapeFunction()` to use another escaping mechanism if you don't intend to output
HTML.

Expression Substitution
-----------------------

If you know that the variable you want to output is some valid HTML and you don't want to escape it you should use the
`%{}` construct:

    <div>I like to put some %{"<em>emphasis</em>"} some times.</div>

Expressions given to `%{}` are not processed through `escapeFunction()` like with `${}`.

JavaScript Blocks
-----------------

To put one or multiple lines of JavaScript in the generated code, use the `<% %>` construct:

    <%
        var now = new Date();
        var tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    %>
    <div>Let's meet tomorrow at this time: ${tomorrow.toString()}.</div>

Inside a JavaScript block, you are free to use the `o` variable which contains the text currentlry rendered to output
some more text in the current template. When doing so, don't forget to escape the outputed text. Just in case, `o`
stands for *output*.

    <ul>
        <%
            ["apple", "banana", "pie"].forEach(function(el) {
                o + "<li>" + escapeFunction(el) + "</li>";
            });
        %>
    </ul>

Single Line of JavaScript
-------------------------

JavaScript blocks are useful but the syntax is not so nice anymore when you want a single line of JavaScript. This is
often the case when you use control structures. For these use cases, Jiko also has another construct: the single line
`%`.

    % [1, 2, 3, 4, 5].forEach(function(el) {
        <p>${el}</p>
    % });

Lines beginning with the `%` character will be considered as JavaScript until the end of the line.

This syntax allows a cleaner code in some cases. You should learn both the JavaScript blocks construct and the single
line construct and switch between those two syntaxes according to the situation.

Template Parameters
-------------------

Usually templates are used to render a view according to existing data. To give parameters to a template function you
must give it a dictionary as first parameter. That dictionary will be available in the template as the `a` variable. In
this case, `a` stands for *arguments*.

    var mytemplate= jiko.loadFile("mytemplate.html");
    console.log(mytemplates({customers: ["Harrold", "Richard", "Bill"]}));

The `mytemplate.html` file:

    <p>Customers:</p>
    <ul>
    % a.customers.forEach(function(el) {
        <li>${el}</li>
    % });
    </ul>

Functions
---------

The `{% function %}` construct was already demonstrated in the [tutorial](/docs/tutorial.html#multiple-templates-
in-a-file). There we explained it allows to put multiple template functions in a single file.

What was not explained is that you can actually define `{% function %}` constructs anywhere in Jiko. They will be
translated to real JavaScript functions that can be called like any other template functions:

    {% function name="renderDate" %}
        <strong>${a.date.getMonth() + 1}-${a.date.getDay()}</strong>
    {% end %}

    <p>Today: %{renderDate({date: new Date()})}</p>

`{% function %}` constructs must have a `name` parameter specifying the name of the template function. They end with a
`{% end %}` construct. Here we use the `%{}` construct instead of `${}` because when we call the `renderDate` template
it already returns valid HTML, so we don't have to escape it.

Modules
-------

The module is a facility to define multiple templates in a single file. To indicate a file is in fact a module we put
a `{% module %}` construct at the beginning of the file.

    {% module %}

    {% function name="renderCustomer" %}
        <p>${a.customer.name}</p>
        <p>${a.customer.account}</p>
    {% end %}

    <%
        var precision = 2;
    %>

    {% function name="renderBill" %}
        %{renderCustomer({customer: a.customer})}
        <p>${a.product.name}</p>
        <p>${a.product.price.toFixed(precision)}$</p>
    {% end %}

The `renderBill` template could be called using this JavaScript code:

    mymodule.renderBill({customer: {name: "Albert", account: "123"}, product: {name: "Keyboard", price: 8.9}});

Once a Jiko file beginning with `{% module %}` is compiled using `jiko.loadFile()` or using the server-side
precompiler, it will result in a dictionary instead of a function. That dictionary will contain every functions
defined in the module.

Please note that all functions defined in a module, as well as any JavaScript variable declared, are all located in
the same scope. So it's possible for functions to call each others or to use variables defined outside a function like
in the above example.

Comments
--------

There are two notations to mark comments in Jiko: single-line and multi-lines.

    ## This is a single-line comment
    This is some text
    {* This is 
    a multi-line comment *}

Comments using the Jiko notation will not be outputted at all in the compiled JavaScript.

Escaping Jiko Constructs
------------------------

If, for one reason or another, you really need to output a text like `${exp}` in your HTML code you'll have a problem
because Jiko will try to interpret it. To solve this problem Jiko supports escaping of any construct using `\`:

    \${this will directly appear in the HTML}

The `\` can itself be escaped by doubling it, etc...

{% endraw %}
