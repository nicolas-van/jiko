# Jiko

{% raw  %}

[![Build Status](https://travis-ci.org/nicolas-van/jiko.svg?branch=master)](https://travis-ci.org/nicolas-van/jiko)

Jiko is a modern and easy to use template engine for Javascript. Its objective is to provide to Javascript programmers a
way to write templates with an engine as powerful as server-side state of the art template engines like Jinja and Mako.

```
    <%
        var rows = _.map(_.range(0, 10), function(el) { return _.range(0, 10); });
    %>
    {% function name="makeRow" %}
        <tr>
        % a.row.forEach(function(name) {
            <td>${name}</td>
        % });
        </tr>
    {% end %}

    <table>
        % rows.forEach(function(row) {
            %{makeRow({row: row})}
        % });
    </table>
```

Jiko's features:

* Its syntax is as simple and direct as possible. Influenced by well-known template engines.
* *Don't reinvent the wheel!* Why use a new language for expressions when you can use JavaScript?
* Allows multiple templates to be defined in a single template file.
* Compiles templates directly to Javascript to be one of the fastest JavaScript template engines ever.
* Allows browser-side on-the-fly compilation for development and server-side compilation for production.
* Works in a browser (IE7, Chrome, Firefox) and inside Node.js.
* Uses the MIT open source licence.

Jiko is still in development. You can help to improve it on Github.

Interested? Take a look at the [Documentation](./docs/docs.md).

{% endraw %}
