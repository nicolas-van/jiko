<%!
    title = "Jiko - Template Engine for Javascript"
    description = "Home Page of the Jiko Template Engine"
    sideContent = True
%>

<%inherit file="/common/base.mako"/>

<%namespace name="macros" file="/macros.mako"/>

<%block name="favicons">
    <link rel="shortcut icon" href="/static/img/favicon.ico">
</%block>

<%block name="head">
    <link rel="stylesheet" type="text/css" href="/static/css/style.css" />
</%block>

<%block name="sideContent">

<div class="sidePageHeader">
    <div class="sidePageHeader sideBlock">
        <a href="/"><img src="/static/img/horse_150.png"></img></a>
        <div>
            <h1>Jiko</h1>
            <h2>Full Featured Template Engine for JavaScript</h2>
        </div>
    </div>
    <div class="verticalSocialNetwork">
        ${macros.social()}
    </div>
    <div class="sideNavigation sideBlock">
        <h3>Navigation</h3>
        ${macros.navigation()}
    </div>
    <div class="usefulLinks sideBlock">
        <h3>Useful Links</h3>
        ${macros.links()}
    </div>
</div>

</%block>
