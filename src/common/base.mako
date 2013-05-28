<%!
    title = ""
    description = ""
    hideSideContent = False
%>
<!DOCTYPE html>

<html class="progdesign">
<head>
    <meta http-equiv="X-UA-Compatible" content="chrome=1">
    <title>${self.attr.title}</title>
    <meta name="description" content="${self.attr.title}">
    <meta name="author" content="Nicolas Vanhoren">

    <%block name="favicons">
    <link rel="shortcut icon" href="/common/static/img/icon.ico">
    </%block>
    <link rel="stylesheet/less" type="text/css" href="/common/static/css/base_style.less" />
    <%block name="head">
    </%block>
    <script src="/common/static/js/less.js" type="text/javascript"></script>
</head>
</body>

    <div class="mainHorizontalTable">
        <div class="contentRow">
            <div class="contentTable">
                % if not self.attr.hideSideContent:
                <div class="leftAreaCell">
                    <%block name="sideContent">
                    </%block>
                </div>
                %endif
                <div class="rightAreaCell">
                    <%block name="headerMainContent">
                    </%block>
                    <%block name="mainContent">
                    </%block>
                </div>
            </div>
        </div>
        <div class="footerRow">
            <div class="footerCell">
                Copyright 2013, Nicolas Vanhoren
            </div>
        </div>
    </div>

  <!--[if lt IE 8]>
    <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/chrome-frame/1/CFInstall.min.js"></script>
    <script>
        // You may want to place these lines inside an onload handler
        CFInstall.check({
        mode: "overlay"
        });
    </script>
  <![endif]-->
</body>
</html>
