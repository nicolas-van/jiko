
<%namespace name="basemacros" file="/common/macros.mako"/>

<%def name="navigation()">
    <a href="/">home</a>
    <a href="/docs/docs.html">documentation</a>
</%def>

<%def name="links()">
    <a href="https://github.com/nicolas-van/jiko/issues">Bug tracker</a>
    <a href="https://github.com/nicolas-van/jiko">Ring.js @ Github</a>
    ${basemacros.links()}
</%def>