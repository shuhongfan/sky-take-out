$axure.internal(function ($ax) {
    if ((IOS && SAFARI) || SHARE_APP) {
        var outerHtml = document.documentElement;
        outerHtml.id = 'ios-safari';
        var html = document.createElement('html');
        html.id = 'ios-safari-html';
        outerHtml.appendChild(html);
        var body = document.body;
        html.appendChild(body);
        Object.defineProperty(document, 'body', {
            get: function () {
                return body;
            }
        });
        var fixedBody = document.createElement('body');
        fixedBody.id = 'ios-safari-fixed';
        outerHtml.appendChild(fixedBody);
        var fixedBase = document.createElement('div');
        fixedBase.id = 'base-fixed';
        fixedBody.appendChild(fixedBase);

        var isDevice = false;
        var deviceWidth = 0;
        var updateHtmlWidth = function (panelWidthOffset, scale, height, scaleN) {
            var iosSafHtml = $('#ios-safari-html');
            iosSafHtml.css('overflow', '');
            iosSafHtml.css('overflow-x', '');
            iosSafHtml.css('height', '');
            if (isDevice) {
                iosSafHtml.width(deviceWidth / scaleN);
                iosSafHtml.css('overflow-x', 'hidden');
            } else {
                var isLandscape = window.orientation != 0 && window.orientation != 180;
                var mobileWidth = isLandscape ? window.screen.height : window.screen.width
                iosSafHtml.width((mobileWidth - panelWidthOffset) / scaleN);
            }
            if (scale == 1) {
                iosSafHtml.css('overflow-x', 'hidden');
                iosSafHtml.css('height', (height / scaleN) + 'px');
            } else if (scale == 2) iosSafHtml.css('overflow', 'hidden');
        };

        updateHtmlWidth(0);

        $axure('*').each(function (obj, element) {
            if (obj && obj.fixedVertical && obj.fixedKeepInFront) {
                var parent = $axure('#' + element).getParents(false, ['item', 'state'])[0];
                if (!parent) {
                    $('#base-fixed').append($('#' + element));
                }
            }
        });

        $axure.messageCenter.addMessageListener(function (message, data) {
            if (message == "setContentScale") {
                updateHtmlWidth(data.panelWidthOffset, data.scale, data.viewportHeight, data.scaleN);
            } else if (message == "setDeviceMode") {
                isDevice = data.device && !data.scaleToWidth;
                if (isDevice) deviceWidth = data.width;
                updateHtmlWidth(0);
            }
        });


        $('#ios-safari-html').scroll(function () {
            $axure.updateWindowInfo();
        });
        
        var scrollStartY;
        var maxScrollY
        var touchStart;
        $axure('*').each(function (obj, element) {
            if (obj && obj.scrollbars && obj.scrollbars.toLowerCase() != 'none') {
                if (obj.scrollbars == 'horizontalAsNeeded') return;

                $('#' + element).on('touchstart', function (e) {
                    touchStart = e.pageY;
                    var stateId = $ax.visibility.GetPanelState($('#' + element).attr('id'));
                    scrollStartY = $('#' + stateId).scrollTop();
                    maxScrollY = $('#' + stateId)[0].scrollHeight - $('#' + stateId).height();
                });

                $('#' + element).on('touchmove', function (e) {
                    if (maxScrollY <= 0) return false;
                    if (scrollStartY == 0 && e.pageY > touchStart) e.preventDefault();
                    if (scrollStartY == maxScrollY && e.pageY < touchStart) e.preventDefault();
                });
            }
        });        
    }
});