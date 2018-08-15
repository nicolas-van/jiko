Tutorial
========

{% raw  %}

Installation for On-the-Fly Evaluation
--------------------------------------

There are two ways to use Jiko. The recommended way for production environments is to precompile the templates
server-side. But to test Jiko it's faster to compile templates on-the-fly. Here is how to do it in both node.js and
the browser:

### In Node.js

    :::bash
    npm install jiko

To include jiko in your project:

    :::javascript
    var jiko = require("jiko");

### In the Browser

You can download the latest version on the [download page](/releases.html) or use [Bower](http://bower.io/):

    :::bash
    bower install jiko

In the browser you can use any AMD or CommonJS loader. You can also include directly the Jiko source file and
underscore. When you do so, don't forget Jiko has a dependency on [underscore](http://underscorejs.org/), which is
bundled in the release archive and downloaded if you use Bower.

    :::html
    <script type="text/javascript" src="underscore.js"></script>
    <script type="text/javascript" src="jiko.js"></script>

If you directly include the source files the methods of Jiko will be available under the `jiko` global variable.

A First Template
----------------

Now it's time for the classic Hello World. Copy-paste this example:

    :::javascript
    console.log(jiko.evaluate("Hello ${'Wo' + 'rld'}"));

That's it, you evaluated your first Jiko template!

Loading Templates From a File
-----------------------------

As useful it can be to directly evaluate a string using `jiko.evaluate()`, it's quite a problem to have many lines
of templates contained in a JavaScript string, especially with all the characters you'll have to escape. To solve this
problem Jiko templates can be loaded from a file.

As an example create a file named `template.html` in the folder of your application and put this code in it:

    :::html+mako
    <div>
        <p>Hello, my name is ${a.name}</p>
    </div>

Now in your application use this code:

    :::javascript
    var template = jiko.loadFile("template.html");

`jiko.loadFile` has a different behavior depending you are in node.js or a browser. In node.js it will load a file
from the file system. In a browser it will perform a GET request to the server to get the content of the file. That
request will always be synchronous and will block the JavaScript interpreter until we get the response.

The `template` variable is now a function representing our template that can be called at any time. Since in this
example template we used an attribute named `name` contained in the `a` object we also have to pass a value for that
attribute for the template to work:

    :::javascript
    console.log(template({'name': 'Nicolas'}));

Multiple Templates in a File
----------------------------

When using template engines in JavaScript application, experience tells us that we generally use a lot of them. When
you add the fact that it's not recommended to load too many files for performance reasons it can be quite useful to
be able to define multiple templates in a single file. This is possible in Jiko. Take a look at the `mytemplates.html`
file:

    :::html+mako

    {% module %}

    {% function name="firstTemplate" %}
        This is template number ${1}.
    {% end %}

    {% function name="secondTemplate" %}
        This is template number ${2}.
    {% end %}

When loading a file beginning with `{% module %}` using `jiko.loadFile()`, the result will not be a function. It will
be a dictionary containing all the functions defined in the file. Example:

    :::javascript
    var mytemplates = jiko.loadFile("mytemplate.html");
    console.log(mytemplates.firstTemplate());
    /* >>> This is template number 1 */
    console.log(mytemplates.secondTemplate());
    /* >>> This is template number 2 */

Going Further
-------------

This tutorial covered the basic about loading and executing templates. To use Jiko effectively you should at least
take a look at the [Syntax guide](/docs/syntax.html). You can also take a look at the complete
[Documentation](/docs/docs.html).

{% endraw %}
