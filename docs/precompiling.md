
Precompilation
==============

For production environments, it is recommended to precompile Jiko templates.

Installation of the Compiler
----------------------------

Start by installing the jiko npm package globally.

    :::bash
    sudo npm install -g jiko

Usage of the Compiler
---------------------

Now you have access to the `jiko` command line tool. You can use that tool to compile a file using its `compile`
sub-command:

    :::bash
    jiko compile mytemplates.html

This command will generate a file named `mytemplates.js` next to `mytemplate.html`.

JavaScript files generated this way do not have any dependencies. They don't even depend on the `jiko.js` file, so you
can safely remove it if you plan to use exclusively server-side precompilation.

These files are valid AMD and CommonJS modules. They can be imported in node.js like any other source file.

You can also include these files directly in a web page. When doing so, they will define a global variable whose name is
the same than the name of the file. (So `mytemplates.html` will result in a `mytemplates` global variable.) That global
variable will be a dictionary or a function depending if the file was a module or not. (See the [Modules
part](/docs/syntax.html#modules).)

You can have more information about the Jiko compiler using `--help`:

    :::bash
    jiko --help

Grunt
-----

No Grunt plugin exists yet. But you can create one if you want, just contact me on Github if you need information.
