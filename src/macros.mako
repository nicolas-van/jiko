
<%namespace name="basemacros" file="/common/macros.mako"/>

<%def name="navigation()">
    <a href="/">home</a>
    <a href="/releases.html">download</a>
    <a href="/docs/docs.html">documentation</a>
</%def>

<%def name="links()">
    <a href="https://github.com/nicolas-van/jiko/issues">Bug tracker</a>
    <a href="https://github.com/nicolas-van/jiko">Jiko @ Github</a>
    ${basemacros.links()}
</%def>

<%def name="social()">
    <a href="https://twitter.com/share" class="twitter-share-button" data-url="http://jiko.neoname.eu" data-text="Jiko - Full Featured Template Engine for JavaScript" data-via="nicolasvanhoren" data-lang="fr">Tweeter</a>
    <a href="https://twitter.com/nicolasvanhoren" class="twitter-follow-button" data-show-count="false" data-show-screen-name="false">Follow @nicolasvanhoren</a>
    <script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>
    <iframe src="http://ghbtns.com/github-btn.html?user=nicolas-van&repo=jiko&type=watch&count=true" allowtransparency="true" frameborder="0" scrolling="0" width="110" height="20"></iframe>
</%def>