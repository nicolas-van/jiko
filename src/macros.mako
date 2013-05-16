<%!
    import markdown
%>

<%def name="navigation()">
    <a href="/">home</a>
    <a href="/docs/docs.html">documentation</a>
</%def>

<%def name="markdown()">
${markdown.markdown(capture(caller.body))}
</%def>

