var PAGE_ID_NAME = 'id';
var PAGE_URL_NAME = 'p';
var SITEMAP_COLLAPSE_VAR_NAME = 'c';
var PLUGIN_VAR_NAME = 'g';
var FOOTNOTES_VAR_NAME = 'fn';
var ADAPTIVE_VIEW_VAR_NAME = 'view';
var SCALE_VAR_NAME = 'sc';
var DIM_VAR_NAME = 'dm';
var ROT_VAR_NAME = 'r';
var CLOUD_VAR_NAME = 'cl';
var TRACE_VAR_NAME = 'tr';
var RP_VERSION = 9;
var lastLeftPanelWidth = 220;
var lastRightPanelWidth = 220;
var lastLeftPanelWidthDefault = 220;
var lastRightPanelWidthDefault = 220;
var toolBarOnly = true;
// TODO: need to find a way to get rid of iphone X hacks!!!
// - could possibly have app detect iphone and send information back to player, but currently, that information would arrive too late
var iphoneX = false;
var iphoneXFirstPass = true;


// isolate scope
(function () {

    if (!window.$axure) window.$axure = function () { };
    if (typeof console == 'undefined') console = {
        log: function () { }
    };
    if (window._axUtils) $axure.utils = _axUtils;

    setUpController();

    var getHashStringVar = $axure.player.getHashStringVar = function (query) {
        var qstring = self.location.href.split("#");
        if (qstring.length < 2) return "";
        return GetParameter(qstring, query);
    }

    var isCloud = $axure.player.isCloud = getHashStringVar(CLOUD_VAR_NAME);
    if (isCloud) {
        $("#topPanel").css('display', 'none');
        lastRightPanelWidthDefault = 290;
    }else {
        $("#topPanel").css('display', '');
    }

    $axure.loadDocument = function (document) {
        $axure.document = document;

        var configuration = $axure.document.configuration;
        var _settings = {};
        _settings.projectId = configuration.prototypeId;
        _settings.projectName = configuration.projectName;
        _settings.isAxshare = configuration.isAxshare;
        _settings.isExpo = configuration.isExpo == null ? false : configuration.isExpo;
        _settings.loadSitemap = configuration.loadSitemap;
        _settings.loadFeedbackPlugin = configuration.loadFeedbackPlugin;
        var cHash = getHashStringVar(SITEMAP_COLLAPSE_VAR_NAME);
        _settings.startCollapsed = cHash == "1";
        if (cHash == "2") closePlayer();
        var gHash = getHashStringVar(PLUGIN_VAR_NAME);
        _settings.startPluginGid = gHash;

        $axure.player.settings = _settings;

        var additionalJs = $axure.document.additionalJs;
        if (additionalJs != null) {
            var total = additionalJs.length;
            if (total > 0) $.holdReady(true);            
            $.each(additionalJs, function (index, value) {
                var script = window.document.createElement("script");
                script.type = "text/javascript";
                script.src = value;
                script.async = false;
                script.onload = script.onreadystatechange = function (e) {
                    if (!script.readyState || /loaded|complete/.test(script.readyState)) {
                        script.onload = script.onreadystatechange = null;
                        script = undefined;
                    }
                    if (--total == 0) $.holdReady(false);
                }
                window.document.head.appendChild(script);
            });
        }

        var additionalCss = $axure.document.additionalCss;
        if(additionalCss != null) {
            $.each(additionalCss, function(index, value) {
                var style = window.document.createElement('link');
                style.type = "text/css";
                style.rel = "stylesheet";
                style.href = value;
                window.document.head.appendChild(style);
            });
        }

        if(_settings.isExpo && configuration.isMobile) {
            initializeDeviceFrame();
        }

        // Pseudo-indicator that the document has been loaded
        $axure.document.isLoaded = true;
    };

    $(window).bind('load', function () {
        if ((CHROME && BROWSER_VERSION < 64) || // First 2018 release
            (SAFARI && BROWSER_VERSION < 602) || // Minor version 10
            (FIREFOX && BROWSER_VERSION < 57) || // Support Quantum 
            ($axure.browser.isEdge && BROWSER_VERSION < 15) || // 15 for mobile devices (else could go 16, possibly 17)
            (!$axure.browser.isEdge && IE)) {
            if (!QQ && !UC) appendOutOfDateNotification();
        }

        if (CHROME_5_LOCAL && !$('body').attr('pluginDetected')) {
            window.location = 'resources/chrome/chrome.html';
        }
    });

    function appendOutOfDateNotification() {
        var toAppend = '';
        toAppend += '<div id="browserOutOfDateNotification">';
        toAppend += '   <div style="font-size: 24px; text-align: center; color: #FFFFFF;">LOOKS LIKE YOUR BROWSER IS OUT OF DATE</div>';
        toAppend += '   <div style="font-size: 14px; text-align: center; color: #FFFFFF; margin-bottom: 16px;">This prototype may not look or function correctly until you update your browser</div>';
        toAppend += '   <div id="supportedBrowsersListContainer">';
        toAppend += '       <div class="browserContainer">';
        toAppend += '           <div class="browserName">Google Chrome</div><div class="browserSupportedVersion">v64 and later</div>';
        toAppend += '       </div>';
        toAppend += '       <div class="browserContainer">';
        toAppend += '           <div class="browserName">Mozilla Firefox</div><div class="browserSupportedVersion">v57 and later</div>';
        toAppend += '       </div>';
        toAppend += '       <div class="browserContainer">';
        toAppend += '           <div class="browserName">Microsoft Edge</div><div class="browserSupportedVersion">v15 and later</div>';
        toAppend += '       </div>';
        toAppend += '       <div class="browserContainer">';
        toAppend += '           <div class="browserName">Apple Safari</div><div class="browserSupportedVersion">v10 and later</div>';
        toAppend += '       </div>';
        toAppend += '   </div>';
        toAppend += '   <div id="browserOutOfDateNotificationButtons">'
        if (!MOBILE_DEVICE) {
            toAppend += '       <div style="margin-right: 36px"><a href="http://outdatedbrowser.com/en" id="updateBrowserButton">UPDATE BROWSER</a></div>';
            toAppend += '       <div style="flex: 0 1 45%;"><a id="continueToPrototypeButton">Continue viewing prototype anyway</a></div>';
        } else {
            toAppend += '       <div style="width: 100%; text-align:center"><a id="continueToPrototypeButton">Continue viewing prototype anyway</a></div>';
        }
        toAppend += '   </div>';
        toAppend += '</div>';

        $('body').prepend(toAppend);

        $('#continueToPrototypeButton').on('click', function () {
            var $message = $('#browserOutOfDateNotification');
            $message.children().hide();
            $message.css('padding-top', '0px');
            $message.animate({ 'height': '0px' }, { duration: 400, complete: function () { $message.hide(); } });
        });
    }

    $axure.page.bind('load.start', mainFrame_onload);
    $axure.messageCenter.addMessageListener(messageCenter_message);

    var suppressPluginVarUpdate = false;
    $(document).on('pluginShown', function (event, data) {
        if (!suppressPluginVarUpdate) $axure.player.setVarInCurrentUrlHash(PLUGIN_VAR_NAME, data ? data : '');
    });

    $(document).on('pluginCreated', function (event, data) {
        if (!$axure.player.isMobileMode() && $axure.player.settings.startPluginGid.indexOf(data) > -1) {
            suppressPluginVarUpdate = true;
            $axure.player.showPlugin(data);
            suppressPluginVarUpdate = false;
        }

        if (data == '1') {
            $('#interfaceControlFrame').animate({ opacity: 1 }, 200);
        }

        if ($axure.player.settings.isExpo) {
            // TODO: Do this only if expo is a mobile device
            // TODO: Figure out better way to deal with this issue
            $axure.messageCenter.postMessage('setDeviceMode', { device: false });
            $axure.messageCenter.postMessage('setDeviceMode', { device: true });
            //$axure.player.refreshViewPort();
        }
    });
    
    function initializeEvents() {
        $('#interfaceControlFrameMinimizeContainer').on('click', collapse);
        $('#interfaceControlFrameCloseButton').on('click', closePlayer);
        $('#interfacePageNameContainer').on($axure.eventNames.mouseDownName, toggleSitemap);
        $('#interfaceAdaptiveViewsContainer').on($axure.eventNames.mouseDownName, toggleAdaptiveViewsPopup);
        $('#overflowMenuButton').on($axure.eventNames.mouseDownName, toggleOverflowMenuPopup);

        if (!MOBILE_DEVICE) {
            $('#maximizePanel').mouseenter(function () {
                $(this).addClass('maximizePanelOver');
            });
            $('#maximizePanel').mouseleave(function () {
                if ($(this).hasClass('maximizePanelOver')) {
                    $(this).animate(isMobileMode() ? {
                            top: '-' + $('#maximizePanel').height() + 'px'
                        } : {
                            left: '-' + $('#maximizePanel').width() + 'px'
                        }, 300);
                }
                $(this).removeClass('maximizePanelOver');
            });
            $('#maximizePanelOver').mouseenter(function () {
                $('#maximizePanel').animate(isMobileMode() ? {
                        top: '0px'
                    } : {
                        left: '0px'
                    }, 100);
            });
        }

        $minimizeContainer = $('#interfaceControlFrameMinimizeContainer');
        $minimizeContainer.mouseenter(function () { $minimizeContainer.addClass('collapseHovered') });
        $minimizeContainer.mouseleave(function () { $minimizeContainer.removeClass('collapseHovered') });
        $maximizeContainer = $('#maximizePanelContainer');
        $maximizeContainer.mouseenter(function () { if(!MOBILE_DEVICE) $minimizeContainer.addClass('expandHovered') });
        $maximizeContainer.mouseleave(function () { if(!MOBILE_DEVICE) $minimizeContainer.removeClass('expandHovered') });

        $('#maximizePanel').click(function () {
            $(this).removeClass('maximizePanelOver');
            $('#maximizePanelContainer').hide();
            $axure.messageCenter.postMessage('expandFrame');
        });

        $('#mHideSidebar').on($axure.eventNames.mouseDownName, function (e) { startM(e); });
        $('#lsplitbar').on($axure.eventNames.mouseDownName, startLeftSplit);
        $('#rsplitbar').on($axure.eventNames.mouseDownName, startRightSplit);

        if ($axure.mobileSupport.mobile) {
            var touchCount = 0;
            var lastTouch = Date.now();
            $('#mainPanel').on('touchstart',
                (function (e) {
                    var now = Date.now();
                    if (now - lastTouch < 375) {
                        if (++touchCount === 3) {
                            if ($axure.player.isMobileMode() || MOBILE_DEVICE) expand();
                            touchCount = 0;
                            e.preventDefault();
                        };
                    } else {
                        touchCount = 1;
                    }
                    lastTouch = now;
                }));
        }

        $(window).resize(function () {
            $axure.player.resizeContent();
        });

        $(window).on("orientationchange", function () {
            // IOS often does not complete updating innerHeight and innerWidth
            // until after calling orientation changed and resized window
            // Also, cannot use $(window).height() call since iOS11 needs padding amount
            iphoneXFirstPass = false
            if (IOS && isMobileMode()) setTimeout(function () { $axure.player.resizeContent(true); }, 250);
        });

        $('#mainPanel').scroll(function () {
            repositionClippingBoundsScroll();
        });
    }

    function initializeMainFrame() {
        var legacyQString = getQueryString("Page");
        if (legacyQString.length > 0) {
            location.href = location.href.substring(0, location.href.indexOf("?")) + "#" + PAGE_URL_NAME + "=" + legacyQString;
            return;
        }

        var mainFrame = document.getElementById("mainFrame");
        //if it's local file on safari, test if we can access mainframe after its loaded
        if (SAFARI && document.location.href.indexOf('file://') >= 0) {
            $(mainFrame).on('load', function () {
                var canAccess;
                try {
                    var mainFrameWindow = mainFrame.contentWindow || mainFrame.contentDocument;
                    mainFrameWindow['safari_file_CORS'] = 'Y';
                    canAccess = mainFrameWindow['safari_file_CORS'] === 'Y';
                } catch (err) {
                    canAccess = false;
                }

                if (!canAccess) window.location = 'resources/chrome/safari.html';
            });
        }

        if($axure.player.settings != null && !$axure.player.settings.isExpo) {
            mainFrame.contentWindow.location.href = getInitialUrl();
        }
    }

    function initializeDeviceFrame() {
        // TODO: Load device bezel and necessary overlays if applicable
        // - Need to determine if device has a frame/overlay
        // - Determine where to store said assets
        // - Determine sizing, positioning, orientation, and styling for HTML containers
        // - Verify that it stays consistent for every state (expo)

        var expo = $axure.expo;
        var project = expo.project;
        var device = project.Platform.Device;

        // in expo.ts, Web is 12
        if (device === 12) {
            // Hide containers
            $('#deviceFrameContainer').hide();
            $('#bezelOverlay').hide();

            return;
        }

        // map devices to their corresponding frame/bezel/overlays
    }
    var wasMobile = false;
    var isMobileMode = $axure.player.isMobileMode = function () { return isShareApp() || (MOBILE_DEVICE && $(window).width() < 420); }
    var isMobileTextEntry = false;

    var isViewOverridden = $axure.player.isViewOverridden = function() {
        return getHashStringVar(ADAPTIVE_VIEW_VAR_NAME).length > 0;
    }

    function toggleSitemapMobileMode() {
        var $container = $('#sitemapHost');
        if (!$container.length) return;
        var $header = $container.find('.pluginNameHeader');
        var projectName = $axure.player.getProjectName();

        if (isMobileMode()) {
            $header.text('PROJECT PAGES');
            $container.addClass('mobileMode');
            $container.find('.sitemapPageName').addClass('mobileText');
            // Give sitemapHost left-margin so it does not collide with projectOptionsHost
            if (MOBILE_DEVICE) $container.css('margin-left', '13px');
        } else {
            $container.removeClass('mobileMode');
            $header.text(projectName ? projectName : 'Pages');
            $container.find('.sitemapPageName').removeClass('mobileText');
            if (MOBILE_DEVICE) $container.css('margin-left', '');
        }
    }

    function togglePageNotesMobileMode() {
        var $container = $('#pageNotesHost');
        if (!$container.length) return;

        if (isMobileMode()) {
            $container.addClass('mobileMode');
            $('#pageNotesSectionHeader').text('PAGE NOTES');
            $('#widgetNotesSectionHeader').text('WIDGET NOTES');
            $container.find('.notesPageNameHeader').addClass('mobileSubHeader');
            $container.find('.pageNote').addClass('mobileText');
            $container.find('.emptyStateTitle').addClass('mobileSubHeader');
            $container.find('.emptyStateContent').addClass('mobileText');
        } else {
            $container.removeClass('mobileMode');
            $('#pageNotesSectionHeader').text('Page Notes');
            $('#widgetNotesSectionHeader').text('Widget Notes');
            $container.find('.notesPageNameHeader').removeClass('mobileSubHeader');
            $container.find('.pageNote').removeClass('mobileText');
            $container.find('.emptyStateTitle').removeClass('mobileSubHeader');
            $container.find('.emptyStateContent').removeClass('mobileText');
        }
    
    }

    function toggleFeedbackMobileMode() {
        var $container = $('#feedbackHost');
        if (!$container.length) return;

        if (isMobileMode()) {
            $container.addClass('mobileMode');
            $('.noDiscussionText span').text('Comments added in Axure Cloud will appear here');
        } else {
            $container.removeClass('mobileMode');
            $('.noDiscussionText span').text('Either select the button above to post to a location on the page, or use the field to post without location.');
        }
    }

    $axure.player.updatePlugins = function updatePlugins() {
        if (MOBILE_DEVICE && !isShareApp()) {
            var hostPanelPadding = isMobileMode() ? '8px 15px 0px 15px' : '';
            $('.rightPanel .leftPanel .mobileOnlyPanel').css('padding', hostPanelPadding);
        }

        if (isMobileMode()) {
            $('body').addClass('mobileMode');
            if ($('#debugHost').length) $('#debugHost').hide();
            if ($('#handoffHost').length) $('#handoffHost').hide();
        } else $('body').removeClass('mobileMode');

        toggleSitemapMobileMode();
        togglePageNotesMobileMode();
        toggleFeedbackMobileMode();
    }

    // TODO: this is done for IOS and Android (check what can be done for Pixel, etc)
    $axure.player.setIsMobileModeTextEntry = function (isTextEntry) {
        isMobileTextEntry = isTextEntry;
        if (IOS && isTextEntry) {
            activateMobileTextEntry()
        } else if (IOS) {
            setTimeout(deactivateMobileTextEntry, 150);
        }
    }

    function deactivateMobileTextEntry() {
        newHeight = window.innerHeight;
        var newControlHeight = newHeight - (!isShareApp() ? 140 : IOS ? 157 : 138);

        if (!$('.leftPanel').hasClass('popup')) {
            $('.leftPanel').height(newControlHeight);
        }
        $('.rightPanel').height(newControlHeight);
        $('.mobileOnlyPanel').height(newControlHeight);
        $('#mobileControlFrameContainer').show();
    }

    function activateMobileTextEntry() {
        $('#mobileControlFrameContainer').hide();

        newHeight = window.innerHeight;
        var newControlHeight = newHeight - (!isShareApp() ? 140 : IOS ? 157 : 138);
        newControlHeight = newControlHeight + (!isShareApp() ? 61 : IOS ? 72 : 60);

        if (!$('.leftPanel').hasClass('popup')) {
            $('.leftPanel').height(newControlHeight);
        }
        $('.rightPanel').height(newControlHeight);
        $('.mobileOnlyPanel').height(newControlHeight);
    }

    function setAdaptiveView() {
        if (typeof noViewport == 'undefined') {
            // Block during animation -- end of animation will call resizeContent once completed with isAnimating equal to false
            if (!isViewOverridden() && !isAnimating) $axure.messageCenter.postMessage('setAdaptiveViewForSize', { 'width': $('#mainPanel').width(), 'height': $('#mainPanel').height() });
            //if (!isViewOverridden()) $axure.messageCenter.postMessage('setAdaptiveViewForSize', { 'width': $('#mainPanel').width(), 'height': $('#mainPanel').height() });
            $axure.player.refreshViewPort();
            if ($axure.player.updateAdaptiveViewHeader != null) $axure.player.updateAdaptiveViewHeader();
        }
    }

    $axure.player.resizeContent = function (noViewport) {
        var isMobile = isMobileMode();

        if (wasMobile && !isMobile) {
            $('#clippingBoundsScrollContainer').show();
            $('#outerContainer').prepend($('.leftPanel'));
            $('#outerContainer').append($('.rightPanel'));

            $axure.player.updatePlugins();

            $('#mHideSidebar').hide();
            $('#mobileBrowserControlFrame').hide();
            $('#nativeAppControlFrame').hide();

            if ($('#topPanel').is(':visible')) {
                $('#maximizePanelContainer').hide();
                $axure.player.restorePlugins();
            } else {
                $('.leftPanel').hide();
                $('.rightPanel').hide();
                if (!MOBILE_DEVICE) $('#maximizePanelContainer').show();
            }

            $('.leftPanel').css({ 'top': '', 'left': '' });
            $('.rightPanel').css({ 'top': '', 'left': '' });

        } else if (!wasMobile && isMobile) {
            $('#clippingBoundsScrollContainer').hide();
            $axure.player.closePopup();

            $('#lsplitbar').hide();
            $('#rsplitbar').hide();

            $('.leftPanel').show();
            $('.rightPanel').show();

            $axure.player.updatePlugins();
            $('#mHideSidebar').append($('.leftPanel'));
            $('#mHideSidebar').append($('.rightPanel'));
            if (MOBILE_DEVICE) $('#maximizePanelContainer').hide();

            $axure.messageCenter.postMessage('collapseFrameOnLoad');
        }


        var newHeight = 0;
        var newWidth = 0;
        if (iphoneX && isShareApp()) {
            // Hack for Iphone X
            newHeight = $(window).height() - ((!isMobile && $('#topPanel').is(':visible')) ? $('#topPanel').height() : 0);
            newWidth = $(window).width();
            // This does not need to make sense, since it is Iphone X
            var notchAndHomeOffsetPortrait = iphoneXFirstPass ? 35 : 5;
            var notchOffsetLandscape = iphoneXFirstPass ? 45 : 10;
            var homeButtonOffsetLandscape = iphoneXFirstPass ? 21 : 10;
            if (newHeight > newWidth) {
                newHeight = newHeight + notchAndHomeOffsetPortrait;
            } else {
                newWidth = newWidth + notchOffsetLandscape * 2;
                newHeight = newHeight + homeButtonOffsetLandscape;
            }
        } else {
            // innerHeight includes padding for window -- needed in iOS 11 to have prototype stretch to bottom of screen (could put in -- if (iOS) -- block if needed)
            //var newHeight = $(window).height() - ((!isMobile && $('#topPanel').is(':visible'))? $('#topPanel').height() : 0);
            newHeight = window.innerHeight - ((!isMobile && $('#topPanel').is(':visible')) ? $('#topPanel').height() : 0);
            newWidth = $(window).width();
        }

        $('#outerContainer').height(newHeight).width(newWidth);
        $('#mainPanel').height(newHeight);
        $('#clippingBounds').height(newHeight);

        if (isMobile) {
            $('#mobileControlFrameContainer').height(newHeight);
            $('#mobileControlFrameContainer').width(newWidth);
            var newControlHeight = newHeight - (!MOBILE_DEVICE ? 112 : !isShareApp() ? 140 : IOS ? 157 : 138);
            // Screen resize is only way through browser to catch mobile device keyboard expand and collapse
            if ($('#mHideSidebar').is(':visible') && !$('#mobileControlFrameContainer').is(':visible')) {
                $('#mobileControlFrameContainer').delay(150).show();
            } else if (isMobileTextEntry) {
                newControlHeight = newControlHeight + (!isShareApp() ? 61 : IOS ? 72 : 60);
                $('#mobileControlFrameContainer').hide();
            }

            if(!$('.leftPanel').hasClass('popup')) {
                $('.leftPanel').height(newControlHeight);
            }
            $('.rightPanel').height(newControlHeight);
            $('.mobileOnlyPanel').height(newControlHeight);
        } else {
            if (!$('.leftPanel').hasClass('popup')) {
                $('.leftPanel').css('height','');
            }
            $('.rightPanel').css('height', '');
            if ($('.rightPanel').is(':visible')) {
                var lastRightPanelWidthDefaultSub = ($(window).width() - lastRightPanelWidthDefault || 0);
                var rightPanelWidth = ($('.rightPanel').width() || 0);
                var leftPanelPanelWidthSub = ($(window).width() - $('.leftPanel').width()) || 0;

                var newWidth = Math.min(lastRightPanelWidthDefaultSub, rightPanelWidth, leftPanelPanelWidthSub);
                lastRightPanelWidth = Math.max(lastRightPanelWidthDefault, newWidth);
                $('.rightPanel').width(lastRightPanelWidth ? lastRightPanelWidth : lastRightPanelWidthDefault);
                $('#rsplitbar').css('left', $(window).width() - $('.rightPanel').width());
            }
            if ($('.leftPanel').is(':visible')) {
                var lastLeftPanelWidthSub = ($(window).width() - lastLeftPanelWidthDefault || 0);
                var leftPanelWidth = ($('.leftPanel').width() || 0);
                var rightPanelWidthSub = ($(window).width() - $('.rightPanel').width()) || 0;

                var newWidth = Math.min(lastLeftPanelWidthSub, leftPanelWidth, rightPanelWidthSub);

                lastLeftPanelWidth = Math.max(lastLeftPanelWidthDefault, newWidth);
                $('.leftPanel').width(lastLeftPanelWidth ? lastLeftPanelWidth : lastLeftPanelWidthDefault);
                $('#lsplitbar').css('left', $('.leftPanel').width() - 4);
            }
        }

        if (isMobile) {
            var newControlWidth = newWidth - 80;
            $('.leftPanel').css({ 'width': newControlWidth + 'px' });
            $('.rightPanel').css({ 'width': newControlWidth + 'px' });
            $('.mobileOnlyPanel').css({ 'width': newControlWidth + 'px' });
            adjustM('left');
        }

        updateClippingBoundsWidth();
        repositionClippingBoundsScroll();
        setAdaptiveView();

        wasMobile = isMobile;
    }

    function contentDocument_onload() {
        (function setRepositionWhenReady() {
            var $iframe = $('#mainPanel').find('iframe')[0];
            if ($($iframe.contentWindow.document.body).length === 0 || $iframe.contentWindow.document.URL === "about:blank") {
                setTimeout(setRepositionWhenReady, 50);
            } else {
                var $iframe = $($('#mainPanel').find('iframe')[0].contentWindow.document);
                $iframe.scroll(function () {
                    repositionClippingBoundsScroll();
                });
            }
        })();
    }

    // This is the full width and height of the prototype (beyond the window width and height)
    var determineIframeDimensions = function () {
        var $iframe = $($('#mainPanel').find('iframe')[0].contentWindow);

        return {
            width: $iframe.width(),
            height: $iframe.height()
        };
    };

    // Position of this (upper left hand corner) should match the existingPinPanel position
    var determineIframePosition = function () {
        var dimensions = determineIframeDimensions();
        var $iframe = $($('#mainPanel').find('iframe')[0].contentWindow);

        var $body = $($iframe[0].document.body);
        var bodyWidth = $body.offset().left !== 0 ? $body.width() : dimensions.width;

        if (FIREFOX) {
            var left = $body[0].getBoundingClientRect().left;
            bodyWidth = left !== 0 ? $body.width() : dimensions.width;
        }

        return {
            top: 0,// Math.max(0, (dimensions.height - $($iframe[0].document.body).height()) / 2),
            left: Math.max(0, (dimensions.width - bodyWidth) / 2)
        };
    };

    // Return iframe scroll top and scroll left
    var determineIframeScroll = function () {
        var $iframe = $($('#mainPanel').find('iframe')[0].contentWindow);

        return {
            scrollTop: $iframe.scrollTop(),
            scrollLeft: $iframe.scrollLeft()
        };
    };

    function calculateClippingBoundsWidth(panelSize, isLeftPanel) {
        var $leftPanel = $('.leftPanel:visible');
        var leftPanelOffset = (!isMobileMode() && $leftPanel.length > 0 && !$leftPanel.hasClass('popup')) ? $leftPanel.width() : 0;

        var $rightPanel = $('.rightPanel:visible');
        var rightPanelOffset = (!isMobileMode() && $rightPanel.length > 0) ? $rightPanel.width() : 0;

        // Replace current panel size with panel size after animation for expand or collapse completes
        if (typeof panelSize !== 'undefined') {
            if (isLeftPanel) leftPanelOffset = panelSize;
            else rightPanelOffset = panelSize;
        }

        return $(window).width() - rightPanelOffset - leftPanelOffset;
    }

    var updateClippingBoundsWidth = $axure.player.updateClippingBoundsWidth = function () {
        if ($('.leftPanel').is(':visible')) $('#clippingBounds').css('left', $('.leftPanel').width());
        else $('#clippingBounds').css('left', '0px');
        $('#clippingBounds').width(calculateClippingBoundsWidth());
    }

    var contentLeftOfOriginOffset = 0;
    function calculateClippingBoundsScrollPosition() {
        // Adjust for mainPanelContainer scaling (scale should be "none" for scaleVal == 0 or scaleVal == 1)
        var $iframe = $($('#mainPanel').find('iframe')[0].contentWindow);
        var selectedScale = $('.vpScaleOption').find('.selectedRadioButton');
        var scaleVal = $(selectedScale).parent().attr('val');

        var dimStr = $('.currentAdaptiveView').attr('data-dim');
        var dim = dimStr ? dimStr.split('x') : { w: '0', h: '0' };
        var isDevice = dim[1] != '0' ? true : false;
        // This line is necessary for right handling DEFAULT SCALE
        // Because default scale relates to scale-to-fit item for device projects
        if (scaleVal == '0' && isDevice) scaleVal = 2;

        var scale = $('#mainPanelContainer').css('transform');;
        scale = (scale == "none") ? 1 : Number(scale.substring(scale.indexOf('(') + 1, scale.indexOf(',')));

        // Iframe and Main Panel Positioning
        var iframeScroll = determineIframeScroll();
        var iframePos = determineIframePosition();
        var viewablePanelLeftMargin = parseInt($('#mainPanelContainer').css('margin-left'));
        var viewablePanelTop = parseInt($('#mainPanelContainer').css('top'));
        if (isNaN(viewablePanelTop)) viewablePanelTop = 0;
        if (scaleVal == 2) {
            // Scale to Fit (account for main panel container scale) -- needed for device mode in Scale to Fit
            viewablePanelLeftMargin = ($('#mainPanel').width() - ($('#mainPanelContainer').width() * scale)) / 2
            viewablePanelTop = ($('#mainPanel').height() - ($('#mainPanelContainer').height() * scale)) / 2
        }

        // left and top positioning
        var leftPos = viewablePanelLeftMargin + (iframePos.left - iframeScroll.scrollLeft) * scale;
        var topPos = viewablePanelTop - iframeScroll.scrollTop * scale;

        // Special cases for Centered Page
        var isCentered = $($iframe[0].document.body).css('position') == 'relative';
        if (isCentered && scaleVal == 1) leftPos = 0;
        else if (isCentered && scaleVal == 2) leftPos = $('#mainPanelContainer').width() * scale / 2.0 - contentLeftOfOriginOffset;

        // Include clipFrameScroll offset in mainPanelContainer
        topPos += (parseFloat($('#clipFrameScroll').css("top")) || 0) * scale;

        return {
            left: leftPos,
            top: topPos
        }
    }

    function repositionClippingBoundsScroll() {
        if (!$axure.player.settings.isAxshare) return; 

        (function repositionWhenReady() {
            if ($($('#mainPanel').find('iframe')[0].contentWindow.document.body).length === 0) {
                setTimeout(repositionWhenReady, 50);
            } else {
                var position = calculateClippingBoundsScrollPosition();

                // Adding mainPanel scroll here, since it does not work well with calculating animation left position
                position.left = position.left - $('#mainPanel').scrollLeft() - $('#clipFrameScroll').scrollLeft();
                position.top = position.top - $('#mainPanel').scrollTop() - $('#clipFrameScroll').scrollTop();

                $('#clippingBoundsScrollContainer').css('left', position.left + 'px');
                $('#clippingBoundsScrollContainer').css('top', position.top + 'px');
            }
        })();
    }

    function calculateScrollLeftWithOffset(offset, isLeftPanel) {
        if (!$axure.player.settings.isAxshare) return;
        if ($($('#mainPanel').find('iframe')[0].contentWindow.document.body).length === 0) return;
        var scaleVal = $('.vpScaleOption').find('.selectedRadioButton').parent().attr('val');
        if (scaleVal == 2) return;

        var $iframe = $($('#mainPanel').find('iframe')[0].contentWindow);
        var $body = $($iframe[0].document.body);

        var dimStr = $('.currentAdaptiveView').attr('data-dim');
        var hasFrame = (!dimStr ? false : dimStr.split('x')[1] != '0') && !$axure.player.noFrame;
        var isCentered = $body.css('position') == 'relative'; //body position is always static while page is still loading (thus false, if called on intial load)
        var isCollapsing = offset > 0; //offset is positive when collapsing since we are gaining offset more space for content viewing

        // Base case left positioning
        var leftPos = calculateClippingBoundsScrollPosition().left;

        // If maintaining view options requires a left adjustment not equivalent to panel size (which has already being added in leftPos above)
        var viewAdjustment = 0;

        // Mobile Frame adjustment
        if (hasFrame) {
            var viewablePanelLeftMargin = parseInt($('#mainPanelContainer').css('margin-left'));
            var viewablePanelRightMargin = parseInt($('#mainPanelContainer').css('margin-right'));

            // Cases
            // 0) Adaptive view frame doesn't fit in viewable bounds (viewablePanelLeftMargin is zero) -- use entire offset of panel (no adjustment needed)
            // 1) Adaptive view frame fits in bounds -- then half of incoming panel will be split left and half right (offset / 2)
            // 2) and 3) View Frame either fits in bounds before animation and no longer will after, or vice versa. Mix of previous two cases
            if (isCollapsing) {
                if (viewablePanelLeftMargin != 0) {
                    viewAdjustment = offset / 2;
                } else if (-viewablePanelRightMargin < offset) {
                    viewAdjustment = ((offset + viewablePanelRightMargin) / 2);
                }
            } else if (viewablePanelLeftMargin != 0) {
                viewAdjustment = Math.max(offset / 2, -viewablePanelLeftMargin)
            }
        }

        // Centered Page adjustment
        if (isCentered) {
            // Width of content not able to fit inside current viewable frame
            var clippedContentWidth = $body.width() - calculateClippingBoundsWidth(Math.abs(offset), isLeftPanel);

            // Cases
            // 0) Content never fits in bounds -- then entire offset of panel will move content left value (no adjustment needed as already handled)
            // 1) Content fits in bounds -- then half of incoming panel offset will be split left and half right (offset / 2)
            // 2) and 3) Content either fits in bounds before animation and no longer will after, or vice versa. Mix of previous two cases
            if (clippedContentWidth <= 0) {
                viewAdjustment = offset / 2;
            } else if (isCollapsing && clippedContentWidth < offset) {
                viewAdjustment = (offset - clippedContentWidth) / 2;
            } else if (!isCollapsing && clippedContentWidth < -offset) {
                viewAdjustment = (clippedContentWidth + offset) / 2;
            }
        }

        return leftPos + viewAdjustment;
    }

    // Set to true when left panel or right panel are being expanded/collapsed
    // returns to false when lsplitbar (switched to clippingBounds) finishes animation (thus panels will be fully expanded or retracted at this point)
    var isAnimating = $axure.player.isAnimating = false;

    $axure.player.collapseToBar = function (context, hostId) {
        lastLeftPanelWidth = $('.leftPanel').width();
        lastRightPanelWidth = $('.rightPanel').width();
        if (context === 'project' || context === 'all') {

            if(!isMobileMode()) {
                isAnimating = true;
                var newWidth = lastLeftPanelWidth != 0 ? lastLeftPanelWidth : lastLeftPanelWidthDefault;
                var clippingWidth = calculateClippingBoundsWidth(0, true);
                var newLeft = calculateScrollLeftWithOffset(newWidth, true);

                $('.leftPanel').animate({ 'margin-left': -newWidth + 'px' },
                    { duration: 200, complete: function() { $('.leftPanel').width(0).hide().css({ 'margin-left': '' }); } });
                $('#lsplitbar').animate({ left: '-4px' },
                    { duration: 200, complete: function() { $('#lsplitbar').hide(); } });

                $('#clippingBounds').animate({ left: '', width: clippingWidth + 'px' }, { duration: 200 });
                $('#clippingBoundsScrollContainer').animate({ left: newLeft + 'px' },
                    { duration: 200, complete: function () {
                        isAnimating = false;
                        $axure.player.resizeContent();
                        $axure.player.pluginVisibleChanged(hostId, false);
                    }});
            } else {
                $('.leftPanel').width(0);
                $('#lsplitbar').hide();
            }
        }
        if (context === 'inspect' || context === 'all') {
            if (!isMobileMode()) {
                isAnimating = true;
                var newWidth = lastRightPanelWidth != 0 ? lastRightPanelWidth : lastRightPanelWidthDefault;
                var clippingWidth = calculateClippingBoundsWidth(0, false); 
                var newLeft = calculateScrollLeftWithOffset(newWidth, false);

                $('.rightPanel').animate({ 'margin-right': -newWidth + 'px' },
                    { duration: 200, complete: function () { $('.rightPanel').width(0).hide().css({ 'margin-right': '' }); } });
                $('#rsplitbar').animate({ left: $(window).width() + 'px' },
                    { duration: 200, complete: function () { $('#rsplitbar').hide(); } });

                $('#clippingBounds').animate({ width: clippingWidth + 'px' }, { duration: 200 });
                $('#clippingBoundsScrollContainer').animate({ left: newLeft + 'px' },
                    { duration: 200, complete: function () {
                        isAnimating = false;
                        $axure.player.resizeContent();
                        $axure.player.pluginVisibleChanged(hostId, false);
                    }});
            } else {
                $('.rightPanel').width(0);
                $('#rsplitbar').hide();
            }
        }

        $(window).resize();
        toolBarOnly = true;
    }

    $axure.player.expandFromBar = function (hostId, context, isFinalPluginToRestore) {

        if (context === 'project') {
            if ($('#lsplitbar').is(':visible')) return;
            $('.leftPanel').removeClass('popup');
            if(!isMobileMode()) {
                isAnimating = true;
                var newWidth = (lastLeftPanelWidth ? lastLeftPanelWidth : lastLeftPanelWidthDefault);
                var clippingWidth = calculateClippingBoundsWidth(newWidth, true);
                var newLeft = calculateScrollLeftWithOffset(-newWidth, true);

                $('.leftPanel').width(newWidth);
                $('.leftPanel').css('margin-left', -newWidth + 'px').show();
                $('.leftPanel').animate({ 'margin-left': '0px' }, { duration: 200, complete: function () { $('.leftPanel').css({ 'margin-left': '' }); } });

                $('#lsplitbar').css('left', '-4px');
                $('#lsplitbar').show();
                $('#lsplitbar').animate({ left: newWidth - 4 + 'px' }, { duration: 200 });

                $('#clippingBounds').animate({ left: newWidth + 'px', width: clippingWidth + 'px' }, { duration: 200 });
                $('#clippingBoundsScrollContainer').animate({ left: newLeft + 'px' },
                    { duration: 200, complete: function () {
                        isAnimating = false;
                        $axure.player.resizeContent();
                        if (isFinalPluginToRestore) $('#clippingBoundsScrollContainer').show();
                        $axure.player.pluginVisibleChanged(hostId, true);
                    }});
            }
        } else {
            if ($('#rsplitbar').is(':visible')) {
                // update width of rightPanel plugin
                var newWidth = lastRightPanelWidth ? lastRightPanelWidth : lastRightPanelWidthDefault;
                $('#' + hostId).width(newWidth);
                $('#' + hostId).show();
                $axure.player.pluginVisibleChanged(hostId, true);
                return;
            }
            if (!isMobileMode()) {
                isAnimating = true;
                var newWidth = lastRightPanelWidth ? lastRightPanelWidth : lastRightPanelWidthDefault;
                var clippingWidth = calculateClippingBoundsWidth(newWidth, false);
                var newLeft = calculateScrollLeftWithOffset(-newWidth, false);

                $('.rightPanel').width(newWidth);
                $('.rightPanel').css('margin-right', -newWidth + 'px');
                $('#' + hostId).show();
                $('.rightPanel').animate({ 'margin-right': '0px' }, { duration: 200, complete: function () { $('.rightPanel').css({ 'margin-right': '' }); } });

                $('#rsplitbar').css('left', $(window).width());
                $('#rsplitbar').show();
                $('#rsplitbar').animate({ left: $(window).width() - $('.rightPanel').width() + 'px' }, { duration: 200 });

                $('#clippingBounds').animate({ width: clippingWidth + 'px' }, { duration: 200 });
                $('#clippingBoundsScrollContainer').animate({ left: newLeft + 'px' },
                    { duration: 200, complete: function () {
                        isAnimating = false;
                        $axure.player.resizeContent();
                        if (isFinalPluginToRestore) $('#clippingBoundsScrollContainer').show();
                        $axure.player.pluginVisibleChanged(hostId, true);
                    }});
            }
        }
        $(window).resize();
        toolBarOnly = false;

        if (isMobileMode()) {
            $('#mHideSidebar').show();
            $('#nativeAppControlFrame').show();
        }
    }

    var suspendRefreshViewPort = $axure.player.suspendRefreshViewPort = false;
    $axure.player.refreshViewPort = function () {
        if (suspendRefreshViewPort) return;

        var dimStr = $('.currentAdaptiveView').attr('data-dim');
        var dim = dimStr ? dimStr.split('x') : { w: '0', h: '0' };
        var w = dim[0] != '0' ? dim[0] : '';
        var h = dim[1] != '0' ? dim[1] : '';

        var scaleVal = $('.vpScaleOption').find('.selectedRadioButton').parent().attr('val');
        var selectedScaleValue = scaleVal;
        $axure.player.noFrame = false;
        if (h && scaleVal == 1) $axure.player.noFrame = true;

        $('#mainPanelContainer').attr({
            "data-scale-n": scaleVal,
            "data-page-dimensions-type": h ? "device" : w ? "web" : "auto",
            "data-scale-shift-x": null,
            "data-scale-shift-y": null,
        });

        var clipToView = h && !$axure.player.noFrame;
        var isDevice = h;

        var mainPanelWidth = $('#mainPanel').width();
        var mainPanelHeight = $('#mainPanel').height();
        
        if (!w || !clipToView) w = mainPanelWidth;
        if (!h || !clipToView) h = mainPanelHeight;
        if (MOBILE_DEVICE && h > mainPanelHeight) h = mainPanelHeight;
        if (MOBILE_DEVICE && w > mainPanelWidth) w = mainPanelWidth;
        
        if (clipToView) {
            if (!MOBILE_DEVICE && scaleVal == '0') scaleVal = 2;

            w = Number(w);
            h = Number(h);

            $('#mainFrame').width(w);
            $('#clipFrameScroll').width(w);
            $('#mainFrame').height(h);
            $('#clipFrameScroll').height(h);

            var topPadding = MOBILE_DEVICE ? 0 : 10;
            var leftPadding = 0;
            var rightPadding = 0;
            var bottomPadding = MOBILE_DEVICE ? 0 : 10;

            w = w + leftPadding + rightPadding;
            h = h + topPadding + bottomPadding;

            var x = (mainPanelWidth - w) / 2;
            var y = (mainPanelHeight - h) / 2 - 1;

            if (scaleVal != 2) {
                x = Math.max(0, x);
                y = Math.max(0, y);
            }
            
            $('#mainPanelContainer').attr({
                "data-scale-shift-x": x,
                "data-scale-shift-y": y,
            });

            $('#mainPanelContainer').css({
                'margin': 'auto',
                'top': y + 'px',
                'left': (x < 0 ? x + 'px' : 'auto')
            });

            $('#clipFrameScroll').css({
                'left': leftPadding + 'px',
                'top': topPadding + 'px'
            });

            $('#mainPanelContainer').width(w);
            $('#mainPanelContainer').height(h);
        } else {
            $('#mainFrame').width('100%');
            $('#mainFrame').height(h);

            $('#clipFrameScroll').width('100%');
            $('#clipFrameScroll').height(h);
            $('#clipFrameScroll').css({ 'left': '', 'top': '' });

            $('#mainPanelContainer').width('100%');
            $('#mainPanelContainer').height(h);
            $('#mainPanelContainer').css({
                'left': '',
                'margin': '',
                'top': ''
            });
        }
        $axure.messageCenter.postMessage('setDeviceMode', { device: isDevice, width: w, scaleToWidth: (scaleVal == "1") });

        $(".vpScaleOption").show();
        var prevScaleN = $('#mainPanelContainer').css('transform');
        prevScaleN = (prevScaleN == "none") ? 1 : Number(prevScaleN.substring(prevScaleN.indexOf('(') + 1, prevScaleN.indexOf(',')));
        var newScaleN = 1;

        $('#mainPanelContainer').css({
            'transform': '',
            'transform-origin': ''
        });

        var $leftPanel = $('.leftPanel:visible');
        var leftPanelOffset = (!isMobileMode() && $leftPanel.length > 0) ? $leftPanel.width() : 0;
        var $rightPanel = $('.rightPanel:visible');
        var rightPanelOffset = (!isMobileMode() && $rightPanel.length > 0) ? $rightPanel.width() : 0;

        var vpScaleData = {
            scale: scaleVal,
            prevScaleN: prevScaleN,
            viewportHeight: h,
            viewportWidth: w,
            panelWidthOffset: leftPanelOffset + rightPanelOffset,
            clipToView: clipToView
        };
        $axure.messageCenter.postMessage('getScale', vpScaleData);
        $axure.messageCenter.postMessage('cloud_ScaleValueChanged', {
            scale: selectedScaleValue,
        });
        if (scaleVal == '0' && clipToView) $('#mainPanel').css('overflow', 'auto');
        else $('#mainPanel').css('overflow', '');
    }

    $axure.player.getProjectName = function getProjectName() {
        if (typeof PREVIEW_INFO !== 'undefined') {
            return PREVIEW_INFO.fileName;
        } else if(typeof $axure.player.settings.projectName !== 'undefined') {
            return $axure.player.settings.projectName;
        } else return false;
    }

    function initializeLogo() {

        if(typeof PREVIEW_INFO !== 'undefined') {
            $('#previewNotice').show();
        }

        //if (typeof PREVIEW_INFO !== 'undefined') {
        //    $('#interfaceControlFrameLogoCaptionContainer').html(PREVIEW_INFO.fileName);
        //} else if (typeof $axure.player.settings.projectName !== 'undefined') {
        //    $('#interfaceControlFrameLogoCaptionContainer').html($axure.player.settings.projectName);
        //} else {
        //    $('#interfaceControlFrameLogoCaptionContainer').hide();
        //}

        //if ($axure.document.configuration.logoImagePath) {
        //    var image = new Image();
        //    //image.onload = function () {
        //    //    //$('#logoImage').css('max-width', this.width + 'px');
        //    //    $('#interfaceControlFrameContainer').css('margin-left', '-' + $('#logoImage').width() / 2 + 'px');
        //    //    //$axure.player.resizeContent();
        //    //};
        //    image.src = $axure.document.configuration.logoImagePath;

        //    $('#interfaceControlFrameLogoImageContainer').html('<img id="logoImage" src="" />');
        //    $('#logoImage').attr('src', $axure.document.configuration.logoImagePath);//.on('load', function () { $axure.player.resizeContent(); });
        //} else $('#interfaceControlFrameLogoImageContainer').hide();

        //if ($axure.document.configuration.logoImageCaption) {
        //    $('#interfaceControlFrameLogoCaptionContainer').html($axure.document.configuration.logoImageCaption);
        //} else $('#interfaceControlFrameLogoCaptionContainer').hide();

        //if(!$('#interfaceControlFrameLogoImageContainer').is(':visible') && !$('#interfaceControlFrameLogoCaptionContainer').is(':visible')) {
        //    $('#interfaceControlFrameLogoContainer').hide();
        //}
    }
    
    function initializePreview() {
        if (typeof PREVIEW_INFO !== 'undefined') {
            $('#separatorContainer').addClass('hasLeft');
            $('#overflowMadeWith').addClass('preview');
            
            var callback = undefined;
            $('#publishButton').click(function () {
                $.ajax({
                    type: 'GET',
                    url: 'publish',
                    data: {},
                    success: function (response) {
                        if (callback) callback(response);
                    },
                    error: function (response) {
                        if (callback) callback(response);
                    },
                    dataType: 'jsonp'
                });
            });
        }
    }

    var userAcct = {
        userId: '',
        userName: '',
        userEmail: '',
        userProfileImg: '',
        isUsingAxureAcct: false,
    }

    var authCookieValue = null;
    var userCookieValue = null;
    var isSubInstance = false;
    //var readOnlyMode = false;
    //var readOnlyMessage = '';

    // Watermark hints
    // NOTE: The trailing characters serve to be a distinguishing element in case the user actually does use text similar to the hint.
    var emailHint = "Email               ";
    var passHint = "Password             ";

    var feedbackServiceUrl = (window.AXSHARE_HOST_SECURE_URL || 'https://share.axure.com') + '/issue';
    // Look at creating a new location to have GetShareStatus(FbEnabled replacement) and SafariAuth since they are more general calls that are not solely for feedback now
    //var prototypeControlUrl = (window.AXSHARE_HOST_SECURE_URL || 'https://share.axure.com') + '/prototype';

    // Checks if the browser is Safari 3.0+
    // https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
    function isSafari() {
        // Safari 3.0+ "[object HTMLElementConstructor]" 
        var liveSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
        return liveSafari || SAFARI || (IOS && isShareApp());
    };

    function includeTokens(ajaxData, excludeUser) {
        //If the authCookieValue is set (a password-protected local prototype), then send the
        //token as well (because cookies don't always get sent to external domains)
        if (authCookieValue) {
            $.extend(ajaxData, { token: authCookieValue });
        }
        if (!excludeUser && userCookieValue) {
            $.extend(ajaxData, { utoken: userCookieValue });
        }
    }

    function setUserLoggedInStatus(response, safariAuthResponseProfile) {
        if (!response.success) {
            userAcct.isUsingAxureAcct = false;
        } else {
            if (safariAuthResponseProfile) response = safariAuthResponseProfile;
            userAcct.userId = response.userId;
            if (safariAuthResponseProfile) 
                userAcct.userName = response.username == null || response.username.trim() === '' ? response.userEmail : decodeURIComponent(response.username.trim());
            else
                userAcct.userName = response.nickname == null || response.nickname.trim() === '' ? response.userEmail : decodeURIComponent(response.nickname.trim());
            userAcct.userEmail = response.userEmail;
            userAcct.userProfileImg = response.profileImageUrl;
            userAcct.isUsingAxureAcct = true;

            if (response.authToken != null) {
                $axshare.setAuthCookie(response.authToken);
                userCookieValue = response.authToken;
            }
        }

        // If feedback is loaded, update feedback with new account information
        if (typeof feedback !== 'undefined') feedback.updateUserAccountInfo(userAcct, authCookieValue, userCookieValue);
    }

    // TODO: for on prem, we need to use an ajax call directly to share instead of accounts
    // Verify authentication against axure accounts
    $axure.player.axureAuth = function axureAuth(callback) {
        if (window.$axshare != null) {
            $axshare.auth(function (response) {
                if (response.success) {
                    setUserLoggedInStatus(response);
                } else {
                    if (isSafari()) {
                        var ajaxData = {
                            userId: userAcct.isUsingAxureAcct ? userAcct.userId : ""
                        };
                        includeTokens(ajaxData);

                        $.ajax({
                            type: 'GET',
                            url: feedbackServiceUrl + '/safariAuth',
                            data: ajaxData,
                            success: function (response) {
                                if (!response.success) {
                                    setUserLoggedInStatus(response);
                                } else {
                                    setUserLoggedInStatus(response, response.data.profile[userAcct.userId]);

                                    if (callback != null) {
                                        callback(response);
                                    }
                                }
                            },
                            dataType: 'jsonp'
                        });
                    } else {
                        setUserLoggedInStatus(response);
                    }
                }

                if (callback != null) {
                    callback(response);
                }

            });
        }
    }

    // TODO: for on prem, we need to use an ajax call directly to share instead of accounts
    // Log into axure accounts
    $axure.player.axureLogin = function axureLogin(email, password, success, failure, saml) {
        if (window.$axshare != null) {
            password = password === passHint ? "" : password;
            $axshare.login(email, password, false, function (response) {
                if (response.redirecturl !== "" && response.redirecturl != null) {
                    saml(response);
                    return;
                }

                if (response.success && (response.verified || isSubInstance)) {
                    if (isSafari()) setUserLoggedInStatus(response);
                    $axure.player.axureAuth(success);
                } else {
                    failure(response);
                }
            });
            // TODO: add ldap authentication
            //}, window.ON_PREM_LDAP_ENABLED);
        } else {
            failure();
        }
    }

    function playerLogout() {
        userAcct.isUsingAxureAcct = false;
        userAcct.userId = '';
        userAcct.userProfileImg = '';

        // If feedback is loaded, update feedback with new account information
        if (typeof feedback !== 'undefined') feedback.updateUserAccountInfo(userAcct);
    }

    $axure.player.logout = function (feedbackLogout) {
        var completeLogout = playerLogout;
        if (feedbackLogout) {
            completeLogout = function () {
                feedbackLogout();
                playerLogout();
            }
        }
        if (window.$axshare != null) {
            $axshare.logout(completeLogout);
        } else {
            completeLogout();
        }
    }

    /*
    * TODO: Start of Login/Account Mgmt UI, which will need to be updated (currenly uses feedback9.css often)
    */
    function buildAccountLoginPopup() {
        return [
            '<div class="axClearMsgBubble_Player axureLoginBubble_Player">',
            '   <div class="axureLoginBubbleContainer_Player">',
            '       <span style="font-weight: bold; font-size: 10px;">Login into your Axure Cloud account</span>',
            '       <input type="text" autocapitalize="none" name="email" class="axureEmail" style="margin-top: 7px;"/>',
            '       <input name="password" autocapitalize="none" class="axurePassword" />',
            '       <div class="feedbackGreenBtn_Player">LOG IN</div>',
            '       <div class="errorMessage"></div>',
            '       <div id="playerSignUpLink" style="text-align: right; margin-top: 5px; font-size: 10px;">',
            '           <span>No account? <a class="axureSignUpLink" href="', window.AXSHARE_HOST_SECURE_URL, '" target="_blank">Sign Up</a></span>',
            '       </div>',
            '   </div>',
            '</div>'
        ].join("");
    }

    // Bind events to axure login speech bubble (watermark, login, errors, click outside)
    function bindAxureLoginContainerEvent() {
        var $container = $("#accountLoginContainer");
        $container.find('input[name="email"]').addClass("watermark").val(emailHint).focus(function () {
            if ($(this).val() === emailHint) {
                $(this).removeClass("watermark").val("");
            }
        }).blur(function () {
            if ($(this).val() === "") {
                $(this).addClass("watermark").val(emailHint);
            }

            $container.find('.errorMessage').text('');
            $container.find('.errorMessage').hide();
        }).keyup(function (event) {
            if (event.keyCode == 13) {
                $container.find('.feedbackGreenBtn').click();
            }
        });
        $container.find('input[name="password"]').addClass("watermark").val(passHint).focus(function () {
            if ($(this).val() === passHint) {
                $(this).removeClass("watermark").val("");
                //$(this).removeClass("watermark").val("").attr("type", "password");

                // Note: this might be an issue since jquery doesn't like it. Test in IE
                $(this)[0].setAttribute('type', 'password');
            }
        }).blur(function () {
            if ($(this).val() === "") {
                $(this).val(passHint).addClass("watermark");
                //$(this).val(passHint).addClass("watermark").removeAttr("type");

                // Note: this might be an issue since jquery doesn't like it. Test in IE
                $(this)[0].setAttribute('type', 'text');
            }

            $container.find('.errorMessage').text('');
            $container.find('.errorMessage').hide();
        }).keyup(function (event) {
            if (event.keyCode == 13) {
                $container.find('.feedbackGreenBtn_Player').click();
            }
        });

        // Login Submit Event
        $container.find('.feedbackGreenBtn_Player').click(function (e) {
            var email = $container.find('.axureEmail').val();
            var password = $container.find('.axurePassword').val();

            $axure.player.axureLogin(email, password, function (response) {
                // Success
                // Clear out fields
                $container.find('.axureEmail').val(emailHint).addClass("watermark");
                $container.find('.axurePassword').val(passHint).addClass("watermark");
                $container.find('.axurePassword')[0].setAttribute('type', 'text');

                closePopup();
            }, function (response) {
                // Failure
                $container.find('.errorMessage').text(response != null && response.message ? response.message : "There was an error connecting to the server, please try again later.");
                $container.find('.errorMessage').show();
            }, function (response) {
                // SAML User
                $container.find('.errorMessage').empty();
                $container.find('.errorMessage').append("Please <a class='refreshLink' style='text-decoration: underline;'>refresh</a> this page after logging in via your identity provider.");
                $container.find('.errorMessage').show();

                window.open(response.redirecturl, '_blank');

                $container.find('.errorMessage').find('.refreshLink').click(function () {
                    location.reload(true);
                });
            });
        });
    };

    function initializeSignIn() {
        if (typeof PREVIEW_INFO === 'undefined' && $axure.player.settings.isAxshare) {
            (function finishInit() {
                if (window.$axshare == null || $axshare.auth == null || $axshare.login == null) {
                    setTimeout(finishInit, 50);
                } else {
                    // Call to set readOnlyMode, readOnlyMessage, and isSubinstance (readOnlyMode/Message currently only used for feedback9)
                    $.ajax({
                        type: 'GET',
                        url: feedbackServiceUrl + '/GetShareStatus',
                        data: {},
                        success: function (response) {
                            //readOnlyMode = response.readOnlyMode;
                            //readOnlyMessage = response.readOnlyMessage;
                            isSubInstance = response.isSubInstance;
                            if (isSubInstance) $('#accountLoginContainer').find("#playerSignUpLink").hide();

                            // For now, calling methods to set these values in feedback on start (could later make a general method to retrieve these values from player)
                            if (typeof feedback !== 'undefined') {
                                feedback.setReadOnlyModeAndMessage(response.readOnlyMode, response.readOnlyMessage);
                                feedback.setIsSubInstance(isSubInstance);
                            }
                        },
                        dataType: 'jsonp'
                    });

                    // Login container
                    $("#accountLoginContainer").append(buildAccountLoginPopup());
                    bindAxureLoginContainerEvent();

                    // Attempt to auth and acquire account information, then update top panel
                    $axure.player.axureAuth();
                }
            })();
        }
    }

    function overflowIsHidden(node) {
        var style = getComputedStyle(node);
        return style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden';
    }

    function findNearestScrollableParent(firstNode) {
        var node = firstNode;
        var scrollable = null;
        while (!scrollable && node) {
            if (node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight) {
                if (!overflowIsHidden(node) || $(node).css('-webkit-overflow-scrolling') === 'touch') {
                    scrollable = node;
                }
            }
            node = node.parentNode;
        }
        return scrollable;
    }

    function getScrollOwner(target) {
        var owner = findNearestScrollableParent(target);
        if (!owner || owner === document.documentElement || owner === document.body || $(owner).parents('#topPanel').length || owner == document.getElementById('forwardSlash')) {
            return null;
        }

        return owner;
    }

    function removeElasticScrollFromIframe() {
        var $iframe = $($('#mainPanel').find('iframe')[0].contentWindow);
        $iframe[0].document.body.addEventListener('touchmove', function (event) {
            if (!getScrollOwner(event.target)) {
                event.preventDefault();
            }
        }, { passive: false });
    }

    $(document).ready(function () {
        (function finishPlayerInit() {
            if ($axure.player.settings.isAxshare) {
                $axure.page.bind('load.start', contentDocument_onload);
                if ($axure.player.settings.loadFeedbackPlugin) {
                    $axure.utils.loadJS('/Scripts/plugins/feedback/feedback9.js');

                    /******* DEBUG: Allows for debugging/viewing feedback9.js in browser inspect mode ******/
                    //var hdr = document.createElement('script');
                    //hdr.type = "text/javascript"
                    //hdr.src = '/Scripts/plugins/feedback/feedback9.js';
                    //document.head.appendChild(hdr);
                }
            }

            initializeEvents();
            initializeMainFrame();

            $('.leftPanel').width(0);

            $('#maximizePanelContainer').hide();

            if ($axure.player.settings.startCollapsed) {
                collapse();
                $('.leftPanel').width(0);

                var maxPanelWidth = $('#maximizePanel').width();
                setTimeout(function() {
                    $('#maximizePanel').animate({
                        left:'-' + maxPanelWidth + 'px'
                    }, 300);
                }, 2000);
            }

            if (MOBILE_DEVICE) {
                $('body').removeClass('hashover');

                if (SAFARI) {
                    // Stop pinch zoom (stopping all gestures for now)
                    // Gesturestart is only supported in Safari
                    document.addEventListener("gesturestart", function (e) {
                        e.preventDefault();
                    });
                }

                if (IOS) {
                    // Attempt at removing elastic scroll while in mobile menu
                    var touching = false;
                    var pageYStart = 0;
                    var pageYOffset = 0;
                    document.body.addEventListener('touchend', function (event) {
                        if (getScrollOwner(event.target)) {
                            touching = false;
                        }
                    }, { passive: false });

                    document.body.addEventListener('touchmove', function (event) {
                        var owner = getScrollOwner(event.target)
                        if (!owner) {
                            event.preventDefault();
                        } else {
                            if ($(owner).scrollTop() == 0) {
                                if (touching) {
                                    if (event.pageY >= pageYStart) {
                                        event.preventDefault();
                                    } 
                                }
                            }
                            if ($(owner).scrollTop() + $(owner).height() == owner.scrollHeight) {
                                if (touching) {
                                    if (event.pageY <= pageYStart) {
                                        event.preventDefault();
                                    } 
                                }
                            }
                        }
                    }, { passive: false });

                    document.body.addEventListener('touchstart', function (event) {
                        var owner = getScrollOwner(event.target);
                        if (owner) {
                            if ($(owner).scrollTop() == 0) {
                                touching = true;
                                pageYStart = event.pageY;
                                pageYOffset = event.pageY;
                            }
                            if ($(owner).scrollTop() + $(owner).height() == owner.scrollHeight) {
                                touching = true;
                                pageYStart = event.pageY;
                                pageYOffset = event.pageY;
                            }
                        }
                    }, { passive: false });

                    removeElasticScrollFromIframe();

                    $('html').css('-webkit-tap-highlight-color', 'transparent');

                    // Stop iOS from automatically scaling parts of the mobile player
                    // Could stop automatic scaling on Ipads as well that we actually want, but for now, seems fine
                    $('body').css('-webkit-text-size-adjust', '100%');

                    // Prepare for Iphone X hacks
                    // Link for dimensions: https://kapeli.com/cheat_sheets/iOS_Design.docset/Contents/Resources/Documents/index
                    var ratio = window.devicePixelRatio || 1;
                    // Regular iphoneX
                    if (IOS && window.screen.width * ratio == 1125 && window.screen.height * ratio === 2436) {
                        iphoneX = true;
                    }
                    // Iphone XS Max and Iphone XR
                    if (IOS && window.screen.width == 414 && window.screen.height === 896) {
                        iphoneX = true;
                    }

                    window.addEventListener("orientationchange", function () {
                        var viewport = document.querySelector("meta[name=viewport]");
                        //so iOS doesn't zoom when switching back to portrait
                        if (iphoneX) {
                            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover');
                            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
                        } else {
                            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
                            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
                        }
                        $axure.player.resizeContent();
                    }, false);

                    $axure.page.bind('load.start', function () {
                        $axure.player.resizeContent();
                    });

                }

                // Always append both mobile browser menu and native menu, as app might not have returned value signifying native at this point
                appendNativePrototypeControlFrame();
                appendMobileBrowserControlFrame();
                appendProjectOptions();
            }

            initializeLogo();
            initializePreview();

            $axure.player.resizeContent(true);

            // Has timeout to keep waiting to build sign in controls while axAccount is still loading
            initializeSignIn();
        })();
    });

    function appendProjectOptions() {
        var toAppend = '';
        toAppend += '<div id="projectOptionsHost" class="mobileOnlyPanel mobileMode">';
        toAppend += '    <div class="pluginNameHeader">PROJECT OPTIONS</div>';
        toAppend += '    <div id="projectOptionsScrollContainer">';
        toAppend += '       <div class="mobileSubHeader">Hotspots</div>';
        toAppend += '       <div id="projectOptionsShowHotspots" class="mobileText projectOptionsHotspotsRow" style="border-bottom: solid 1px #c7c7c7">';
        toAppend += '           <div id="projectOptionsHotspotsCheckbox"></div>';
        toAppend += '       Show Hotspots</div> ';
        toAppend += '       <div class="mobileSubHeader" style="margin-top: 16px">Scale</div>';
        toAppend += '       <div id="projectOptionsScaleContainer" class="mobileText"></div>';
        toAppend += '       <div id="projectOptionsAdaptiveViewsHeader" class="mobileSubHeader" style="margin-top: 16px">Adaptive Views</div>';
        toAppend += '       <div id="projectOptionsAdaptiveViewsContainer" class="mobileText"></div>'
        toAppend += '    </div>'
        toAppend += '</div>';

        $('#mHideSidebar').prepend(toAppend);
        $(('#projectOptionsHost')).click(function (e) { e.stopPropagation(); });

        if (isMobileMode()) $axure.player.resizeContent();
    }

    function appendMobileBrowserControlFrame() {
        var toAppend = "";
        
        toAppend += '<div id="mobileBrowserControlFrame" class="mobilePrototypeControlFrame">';
        toAppend += '    <div id="return" style="width:100%; position:relative; top:-15px; float:left">';
        toAppend += '        <div id="closeBackground" class="circleBackground">';
        toAppend += '           <div id="forwardSlash" class="closeIconSlash"><div id="backwardSlash" class="closeIconSlash"></div></div>';
        toAppend += '        </div>';
        toAppend += '    </div>';
        toAppend += '</div>';

        $('#mobileControlFrameContainer').append(toAppend);

        $('#closeBackground').click(collapse);

        // iOS will do incorrect click position / content bounds calculation which results in scroll getting reset to (0, 0)
        if (IOS) $('#mobileControlFrameContainer').on($axure.eventNames.mouseDownName, function (e) { e.stopPropagation(); });
    }

    function appendNativePrototypeControlFrame() {
        var toAppend = "";
        toAppend += '<div id="nativeAppControlFrame" class="mobilePrototypeControlFrame">';
        toAppend += '    <ul id="nativeMenuBlueBackground">';
        toAppend += '        <li style="width:30%; float:left;">';
        toAppend += '           <div id="exit" class="nativePrototypeButton" >';
        toAppend += '               <div>';
        toAppend += '                   <div id="exitIcon"></div>';
        toAppend += '                   <div id="exitText" class="nativeMenuText">Exit</div>';
        toAppend += '               </div>';
        toAppend += '           </div>';
        toAppend += '        </li>';
        toAppend += '        <li id="return" style="width:40%; position:relative; top:-15px; float:left">';
        toAppend += '            <div id="returnBackground" class="circleBackground">';
        toAppend += '                <div id="returnIcon"></div>';
        toAppend += '            </div>';
        toAppend += '            <div id="returnText" class="nativeMenuText">Return to Prototype</div>';
        toAppend += '        </li>';
        toAppend += '        <li style="width:30%; float:right;">';
        toAppend += '           <div id="refresh" class="nativePrototypeButton" >';
        toAppend += '               <div>';
        toAppend += '                   <div id="refreshIcon"></div>';
        toAppend += '                   <div id="refreshText" class="nativeMenuText">Refresh</div>';
        toAppend += '               </div>';
        toAppend += '           </div>';
        toAppend += '        </li>';
        toAppend += '    </ul>';
        toAppend += '</div>';

        $('#mobileControlFrameContainer').append(toAppend);

        var barHeight = IOS ? (iphoneX ? '82px' : '72px') : '60px';
        var returnIconDisplacement = IOS ? '-15px': '-20px';
        var iconTopMargin = IOS ? '14px': '7px';
        var returnTextTopMargin = IOS ? '9px': '7px';

        document.getElementById('nativeAppControlFrame').style.height = barHeight;
        document.getElementById('nativeMenuBlueBackground').style.height = barHeight;
        document.getElementById('return').style.top = returnIconDisplacement;
        document.getElementById('returnText').style.marginTop = returnTextTopMargin;
        document.getElementById('refreshIcon').style.marginTop = iconTopMargin;
        document.getElementById('exitIcon').style.marginTop = iconTopMargin;
        
        addAppButtonClickListener("exit");
        addAppButtonClickListener("refresh");

        $('#returnBackground').click(collapse);
        $('#nativeAppControlFrame').on('touchmove', function (e) {
            e.stopPropagation();
        }, false);
    }

    function addAppButtonClickListener(id) {
        var func = function () { IOS ? window.webkit.messageHandlers.prototypeMenuButtonClick.postMessage(id) : ShareApp.PrototypeMenuButtonClick(id); };
        document.getElementById(id).addEventListener("click", func, false);
    }

    function toggleSitemap() {
        $axure.player.showPlugin(1);
    }

    function closePopup() {
        var $container = $('.popup');
        var isLeftPanel = $container.hasClass('leftPanel');
        $container.removeClass('popup');
        $('#overflowMenuButton').removeClass('selected');
        $('#interfaceAdaptiveViewsContainer').removeClass('selected');
        $container.hide();

        $('div.splitterMask').unbind($axure.eventNames.mouseDownName, closePopup);
        $('div.splitterMask').remove();
    }

    $axure.player.closePopup = closePopup;

    function showPopup($container) {
        if ($('#browserOutOfDateNotification').is(":visible")) return;
        $container.addClass('popup');
        $container.show();

        $('<div class="splitterMask"></div>').insertAfter($container);
        $('div.splitterMask').bind($axure.eventNames.mouseDownName, closePopup);
    }

    $axure.player.showPopup = showPopup;

    function toggleAdaptiveViewsPopup() {
        if (($('#interfaceAdaptiveViewsListContainer').hasClass('popup'))) {
            closePopup();
        } else {
            $('#interfaceAdaptiveViewsContainer').addClass('selected');
            showPopup($('#interfaceAdaptiveViewsListContainer'));
        }
    }

    function toggleOverflowMenuPopup() {
        if (($('#overflowMenuContainer').hasClass('popup'))) {
            closePopup();
        } else {
            $('#overflowMenuButton').addClass('selected');
            showPopup($('#overflowMenuContainer'));
        }
    }


    var startSplitX;
    var startSplitWidth;
    function startLeftSplit() {
        startSplitX = window.event.pageX;
        startSplitWidth = lastLeftPanelWidth;
        var $left = $('#lsplitbar');
        $left.addClass('active');
        $('<div class="splitterMask"></div>').insertAfter($left);
        $(document).bind($axure.eventNames.mouseMoveName, doLeftSplitMove).bind($axure.eventNames.mouseUpName, endLeftSplitMove);
    }

    function startRightSplit() {
        startSplitX = window.event.pageX;
        startSplitWidth = lastRightPanelWidth;
        var $left = $('#rsplitbar');
        $left.addClass('active');
        $('<div class="splitterMask"></div>').insertAfter($left);
        $(document).bind($axure.eventNames.mouseMoveName, doRightSplitMove).bind($axure.eventNames.mouseUpName, endRightSplitMove);
    }

    function doLeftSplitMove() {
        var currentX = window.event.pageX;
        var newWidth = Math.min(startSplitWidth + currentX - startSplitX, $(window).width() - $('.rightPanel').width(), $(window).width() - lastRightPanelWidthDefault);
        lastLeftPanelWidth = Math.max(lastLeftPanelWidthDefault, newWidth);
        $('.leftPanel').width(lastLeftPanelWidth ? lastLeftPanelWidth : lastLeftPanelWidthDefault);
        $('#lsplitbar').css('left', $('.leftPanel').width() - 4);
        $axure.player.updateClippingBoundsWidth();
        $axure.player.refreshViewPort();
    }

    function doRightSplitMove() {
        var currentX = window.event.pageX;
        var newWidth = Math.min(startSplitWidth - currentX + startSplitX, $(window).width() - $('.leftPanel').width(), $(window).width() - lastLeftPanelWidthDefault);
        lastRightPanelWidth = Math.max(lastRightPanelWidthDefault, newWidth);
        $('.rightPanel').width(lastRightPanelWidth ? lastRightPanelWidth : lastRightPanelWidthDefault);
        $('#rsplitbar').css('left', $(window).width() - $('.rightPanel').width());
        $axure.player.updateClippingBoundsWidth();
        $axure.player.refreshViewPort();
    }

    function endLeftSplitMove() {
        $('div.splitterMask').remove();
        var $left = $('#lsplitbar');
        $left.removeClass('active');
        $(document).unbind($axure.eventNames.mouseMoveName, doLeftSplitMove).unbind($axure.eventNames.mouseUpName, endLeftSplitMove);
        setAdaptiveView()
    }

    function endRightSplitMove() {
        $('div.splitterMask').remove();
        var $left = $('#rsplitbar');
        $left.removeClass('active');
        $(document).unbind($axure.eventNames.mouseMoveName, doRightSplitMove).unbind($axure.eventNames.mouseUpName, endRightSplitMove);
        setAdaptiveView()
    }


    var startMX;
    var startMLeft;
    var startMElement;
    var maxMLeft;
    var getMaxMLeft = function () {
        if ($('.rightPanel.mobileMode').length == 0) return $('.leftPanel.mobileMode').last().position().left + 100;
        return $('.rightPanel.mobileMode').last().position().left + 100;
    }

    function startM(e) {
        // Android touch event does not define pageX directly
        if(window.event.pageX) {
            startMX = window.event.pageX;
        } else {
            startMX = window.event.touches[0].pageX;
        }

        startMElement = window.event.target.id;
        var $m = $('#mHideSidebar');
        startMLeft = Number($m.css('left').replace('px', ''));
        $(document).bind($axure.eventNames.mouseMoveName, doMMove).bind($axure.eventNames.mouseUpName, endMMove);

        // Must stop propagation on iOS; otherwise scroll position of content will be reset to (0, 0)
        // (likely due to position of click being calculated as out of bounds for outerContainer -- iOS is not adding scroll offset to bounds)
        if (IOS) { e.stopPropagation() };
    }

    function doMMove() {
        var $m = $('#mHideSidebar');
        if(window.event.pageX) {
            currentX = window.event.pageX;
        } else {
            currentX = window.event.touches[0].pageX;
        }

        var deltaX = currentX - startMX;
        if (Math.abs(deltaX) > 0 && $('.splitterMask').length == 0) {
            $('<div class="splitterMask"></div>').insertAfter($m);
        }
        var newLeft = startMLeft + deltaX;
        newLeft = Math.min(0, newLeft);
        newLeft = Math.max(-getMaxMLeft(), newLeft);
        $m.css('left', newLeft + 'px');
    }

    function endMMove(e) {
        $('div.splitterMask').remove();
        $(document).unbind($axure.eventNames.mouseMoveName, doMMove).unbind($axure.eventNames.mouseUpName, endMMove);
        e.stopPropagation();

        var $m = $('#mHideSidebar');
        if(window.event.pageX) {
            currentX = window.event.pageX;
        } else {
            currentX = window.event.changedTouches[0].pageX;
        }
        var deltaX = currentX - startMX;
        if (deltaX != 0 || startMElement != 'mHideSidebar') {
            adjustM(currentX < startMX ? 'left' : 'right', true);
        }
    }

    function adjustM(direction, animate) {
        var $m = $('#mHideSidebar');
        var duration = animate ? 100 : 0;
        var newLeft = Number($m.css('left').replace('px', ''));
        if (!$m.is(':visible') || newLeft > -100) {
            $m.animate({ 'left': '-60px' }, duration);
        } else if (newLeft < -getMaxMLeft() + 100) {
            $m.animate({ 'left': (-getMaxMLeft() + 125) + 'px' }, duration);
        } else if (direction == 'left') {
            var handled = false;
            var $panels = $('.rightPanel.mobileMode, .leftPanel.mobileMode');
            $panels.each(function () {
                var panelX = $(this).position().left;
                if (panelX > -newLeft) {
                    $m.animate({ 'left': (-panelX + 25) + 'px' }, duration);
                    handled = true;
                    return false;
                }
            });
            if (!handled) {
                $m.animate({ 'left': (-$panels.last().position().left + 25) + 'px' }, duration);
            }
        } else if (direction == 'right') {
            var handled = false;
            var $panels = $('.rightPanel.mobileMode, .leftPanel.mobileMode');
            $($panels.get().reverse()).each(function () {
                var panelRight = $(this).position().left + $(this).width();
                if (panelRight < -newLeft + $(window).width()) {
                    $m.animate({ 'left': (-$(this).position().left + 25) + 'px' }, duration);
                    handled = true;
                    return false;
                }
            });
            if (!handled) {
                $m.animate({ 'left': '-60px' }, duration);
            }
        }
    }

    function repositionPinsOnScaleChange(data) {
        var $pins = $('#existingPinsOverlay').children();
        for (var i = 0; i < $pins.length; i++) {
            // calculate new position of pin
            const left = parseFloat($($pins[i]).attr('data-x'));
            const top = parseFloat($($pins[i]).attr('data-y'));
            const width = $($pins[i]).width();
            const height = $($pins[i]).height();

            // Get current scale of mainPanelContainer
            // MainPanelContainer scaled without setContentScale message
            var scale = $('#mainPanelContainer').css('transform');
            scale = (scale == "none") ? 1 : Number(scale.substring(scale.indexOf('(') + 1, scale.indexOf(',')));
            const scaledLeft = (left * scale) - (width / 2);
            const scaledTop = (top * scale) - (height / 2);


            $($pins[i]).css('left', scaledLeft + 'px');
            $($pins[i]).css('top', scaledTop + 'px');
        }

        // Distance from left of project content to origin (used for pins positioning when on a centered page in Scale to Fit mode)
        if (typeof data.contentOriginOffset !== "undefined") contentLeftOfOriginOffset = data.contentOriginOffset;
    }

    function messageCenter_message(message, data) {
        if (message == 'expandFrame') expand();
        else if (message == 'getCollapseFrameOnLoad' && $axure.player.settings.startCollapsed && !MOBILE_DEVICE) $axure.messageCenter.postMessage('collapseFrameOnLoad');
        else if (message == 'tripleClick') {
            if ($axure.player.isMobileMode() || MOBILE_DEVICE) expand();
        } else if (message == 'setContentScale') {
            if (data.clipToView) {
                var scaleVal = $('.vpScaleOption').find('.selectedRadioButton').parent().attr('val');
                if (scaleVal == '2' || (!MOBILE_DEVICE && scaleVal == '0')) {
                    var scaleN = newScaleN = $('#mainPanel').width() / data.viewportWidth;
                    var hScaleN = ($('#mainPanel').height()) / data.viewportHeight;
                    if (hScaleN < scaleN) scaleN = newScaleN = hScaleN;
                    if(scaleVal == '0') scaleN = Math.min(1, scaleN);
                    var scale = 'scale(' + scaleN + ')';
                    $('#mainPanelContainer').css({
                        'transform': scale,
                        'transform-origin': ''
                    });
                }
            } else {
                if (data.scaleN != 1) {
                    var scale = 'scale(' + data.scaleN + ')';
                    var width = 100 / data.scaleN + '%';
                    var height = Number($('#mainPanelContainer').css('height').replace('px', '')) / data.scaleN + 'px';
                    $('#mainPanelContainer').css({
                        'transform': scale,
                        'transform-origin': '0px 0px',
                        'width': width,
                        'height': height
                    });
                    //$('#clipFrameScroll').css('height' , height + 'px');
                    //$('#mainFrame').css('height' , height + 'px');
                    $('#clipFrameScroll').height(height);
                    $('#mainFrame').height(height);
                }
            }
            
            repositionPinsOnScaleChange(data);
            repositionClippingBoundsScroll();
            // Fix for edge not redrawing content after scale change
            if ($axure.browser.isEdge) {
                newHeight = window.innerHeight - ((!isMobileMode() && $('#topPanel').is(':visible')) ? $('#topPanel').height() : 0);
                newWidth = $(window).width();
                $('#outerContainer').height(newHeight).width(newWidth);
                $('#mainPanel').height(newHeight);
                $('#clippingBounds').height(newHeight);
            }
        }
    }

    function getInitialUrl() {
        var shortId = getHashStringVar(PAGE_ID_NAME);
        var foundById = [];
        if (shortId.length > 0) {
            getPageUrlsById(shortId, foundById, undefined);
            if (foundById.length == 1) return foundById[0];
        }

        var pageName = getHashStringVar(PAGE_URL_NAME);
        if (pageName.length > 0) return pageName + ".html";
        else {
            if (foundById.length > 0) return foundById[0];
            var url = getFirstPageUrl($axure.document.sitemap.rootNodes);
            return (url ? url : "about:blank");
        }
    }

    var getPageUrlsById = $axure.player.getPageUrlsById = function (packageId, foundById, nodes) {
        if (!nodes) nodes = $axure.document.sitemap.rootNodes;
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.id == packageId) foundById.push(node.url);
            var hasChildren = (node.children && node.children.length > 0);
            if (hasChildren) {
                getPageUrlsById(packageId, foundById, node.children);
            }
        }
    }

    var getPageIdByUrl = $axure.player.getPageIdByUrl = function(url, nodes) {
        if (!nodes) nodes = $axure.document.sitemap.rootNodes;
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.url == url) return node.id;
            else {
                var hasChildren = (node.children && node.children.length > 0);
                if (hasChildren) {
                    var id = getPageIdByUrl(url, node.children);
                    if (id) return id;
                }
            }
        }
        return null;
    }

    function getFirstPageUrl(nodes) {
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.url) return node.url;
            else {
                var hasChildren = (node.children && node.children.length > 0);
                if (hasChildren) {
                    var url = getFirstPageUrl(node.children);
                    if (url) return url;
                }
            }
        }
        return null;
    }

    function closePlayer() {
        if ($axure.page.location) window.location.href = $axure.page.location;
        else {
            var pageFile = getInitialUrl();
            var currentLocation = window.location.toString();
            window.location.href = currentLocation.substr(0, currentLocation.lastIndexOf("/") + 1) + pageFile;
        }
    }

    function replaceHash(newHash) {
        var currentLocWithoutHash = window.location.toString().split('#')[0];

        //We use replace so that every hash change doesn't get appended to the history stack.
        //We use replaceState in browsers that support it, else replace the location
        if (typeof window.history.replaceState != 'undefined') {
            try {
                //Chrome 45 (Version 45.0.2454.85 m) started throwing an error here when generated locally (this only happens with sitemap open) which broke all interactions.
                //try catch breaks the url adjusting nicely when the sitemap is open, but all interactions and forward and back buttons work.
                //Uncaught SecurityError: Failed to execute 'replaceState' on 'History': A history state object with URL 'file:///C:/Users/Ian/Documents/Axure/HTML/Untitled/start.html#p=home' cannot be created in a document with origin 'null'.
                window.history.replaceState(null, null, currentLocWithoutHash + newHash);
            } catch (ex) { }
        } else {
            window.location.replace(currentLocWithoutHash + newHash);
        }
    }

    function collapse() {
        if (IOS) {
            $('body').off('touchstart');
            $('body').off('touchend');
        }

        if ($axure.player.isMobileMode()) {
            $('#mHideSidebar').hide();
            $('#nativeAppControlFrame').hide();
            $('#mobileBrowserControlFrame').hide();
        } else {
            $axure.player.deleteVarFromCurrentUrlHash('g');
            $axure.player.setVarInCurrentUrlHash('c', 1);
            if (!MOBILE_DEVICE) $('#maximizePanelContainer').show();
            lastLeftPanelWidth = $('.leftPanel').width();
            lastRightPanelWidth = $('.rightPanel').width();

            $('.leftPanel').hide();
            $('.rightPanel').hide();
            $('#topPanel').hide();

            $('.splitbar').hide();
            $('#mainPanel').width($(window).width());
            $('#clippingBounds').width($(window).width());
            $('#clippingBounds').css('left', '0px');
            $(window).resize();

            $(document).trigger('sidebarCollapse');
            $('#maximizeButton').addClass('rotated');
        }
    }

    // This will return true if prototype is opened from version of app after update with code that sets this value 
    // (won't be able to distinguish between browser and outdated app)
    var isShareApp = function () { return /ShareApp/.test(navigator.userAgent); }

    function expand() {
        if ($axure.player.isMobileMode()) {
            $('#mHideSidebar').show();
            $('#mobileControlFrameContainer').show();
            isShareApp() ? $('#nativeAppControlFrame').show() : $('#mobileBrowserControlFrame').show();
        } else {
            $minimizeContainer = $('#interfaceControlFrameMinimizeContainer');
            $minimizeContainer.removeClass('collapseHovered');
            $axure.player.deleteVarFromCurrentUrlHash('c');
            $('#maximizeButton').removeClass('rotated');
            $('#maximizePanelContainer').hide();
            $axure.player.restorePlugins();
            $('#topPanel').show();
            $(window).resize();

            $(document).trigger('sidebarExpanded');
        }
    }


    function mainFrame_onload() {
        if ($axure.page.pageName) document.title = $axure.page.pageName;
    }

    function getQueryString(query) {
        var qstring = self.location.href.split("?");
        if (qstring.length < 2) return "";
        return GetParameter(qstring, query);
    }

    function GetParameter(qstring, query) {
        var prms = qstring[1].split("&");
        var frmelements = new Array();
        var currprmeter, querystr = "";

        for (var i = 0; i < prms.length; i++) {
            currprmeter = prms[i].split("=");
            frmelements[i] = new Array();
            frmelements[i][0] = currprmeter[0];
            frmelements[i][1] = currprmeter[1];
        }

        for (j = 0; j < frmelements.length; j++) {
            if (frmelements[j][0].toLowerCase() == query.toLowerCase()) {
                querystr = frmelements[j][1];
                break;
            }
        }
        return querystr;
    }
    
    function setHashStringVar(currentHash, varName, varVal) {
        var varWithEqual = varName + '=';
        var poundVarWithEqual = varVal === '' ? '' : '#' + varName + '=' + varVal;
        var ampVarWithEqual = varVal === '' ? '' : '&' + varName + '=' + varVal;
        var hashToSet = '';

        var pageIndex = currentHash.indexOf('#' + varWithEqual);
        if (pageIndex == -1) pageIndex = currentHash.indexOf('&' + varWithEqual);
        if (pageIndex != -1) {
            var newHash = currentHash.substring(0, pageIndex);

            newHash = newHash == '' ? poundVarWithEqual : newHash + ampVarWithEqual;

            var ampIndex = currentHash.indexOf('&', pageIndex + 1);
            if (ampIndex != -1) {
                newHash = newHash == '' ? '#' + currentHash.substring(ampIndex + 1) : newHash + currentHash.substring(ampIndex);
            }
            hashToSet = newHash;
        } else if (currentHash.indexOf('#') != -1) {
            hashToSet = currentHash + ampVarWithEqual;
        } else {
            hashToSet = poundVarWithEqual;
        }

        if (hashToSet != '' || varVal == '') {
            return hashToSet;
        }

        return null;
    }

    $axure.player.setVarInCurrentUrlHash = function(varName, varVal) {
        var newHash = setHashStringVar(window.location.hash, varName, varVal);

        if (newHash != null) {
            replaceHash(newHash);
        }
    }

    function deleteHashStringVar(currentHash, varName) {
        var varWithEqual = varName + '=';

        var pageIndex = currentHash.indexOf('#' + varWithEqual);
        if (pageIndex == -1) pageIndex = currentHash.indexOf('&' + varWithEqual);
        if (pageIndex != -1) {
            var newHash = currentHash.substring(0, pageIndex);

            var ampIndex = currentHash.indexOf('&', pageIndex + 1);

            //IF begin of string....if none blank, ELSE # instead of & and rest
            //IF in string....prefix + if none blank, ELSE &-rest
            if (newHash == '') { //beginning of string
                newHash = ampIndex != -1 ? '#' + currentHash.substring(ampIndex + 1) : '';
            } else { //somewhere in the middle
                newHash = newHash + (ampIndex != -1 ? currentHash.substring(ampIndex) : '');
            }

            return newHash;
        }

        return null;
    }

    $axure.player.deleteVarFromCurrentUrlHash = function(varName) {
        var newHash = deleteHashStringVar(window.location.hash, varName);

        if (newHash != null) {
            replaceHash(newHash);
        }
    }

    function setUpController() {

        //$axure.utils = _axUtils;

        var _page = {};
        $axure.page = _page;

        $axure.utils.makeBindable(_page, ['load']);

        var _player = function () {
        };
        $axure.player = _player;

        //-----------------------------------------
        //Global Var array, getLinkUrl function and setGlobalVar listener are
        //for use in setting global vars in page url string when clicking a 
        //page in the sitemap
        //-----------------------------------------
        var _globalVars = {};

        //-----------------------------------------
        //Used by getLinkUrl below to check if local server is running 
        //in order to send back the global variables as a query string
        //in the page url
        //-----------------------------------------
        var _shouldSendVarsToServer = function () {
            //If exception occurs (due to page in content frame being from a different domain, etc)
            //then run the check without the url (which will end up checking against sitemap url)
            try {
                var mainFrame = document.getElementById("mainFrame");
                return $axure.shouldSendVarsToServer(mainFrame.contentWindow.location.href);
            } catch (e) {
                return $axure.shouldSendVarsToServer();
            }
        };

        var _getLinkUrl = function (baseUrl) {
            var toAdd = '';
            for (var globalVarName in _globalVars) {
                var val = _globalVars[globalVarName];
                if (val != null) {
                    if (toAdd.length > 0) toAdd += '&';
                    toAdd += globalVarName + '=' + encodeURIComponent(val);
                }
            }
            return toAdd.length > 0 ? baseUrl + (_shouldSendVarsToServer() ? '?' : '#') + toAdd + "&CSUM=1" : baseUrl;
        };
        $axure.getLinkUrlWithVars = _getLinkUrl;

        $axure.messageCenter.addMessageListener(function (message, data) {
            if (message == 'setGlobalVar') {
                _globalVars[data.globalVarName] = data.globalVarValue;
            }
        });

        $axure.messageCenter.addStateListener('page.data', function (key, value) {
            for (var subKey in value) {
                _page[subKey] = value[subKey];
            }
            $axure.page.triggerEvent('load');
        });

        // ---------------------------------------------
        // Navigates the main frame (setting the currently visible page). If the link is relative,
        // this method should test if it is actually a axure rp page being loaded and properly set
        // up all the controller for the page if it is
        // ---------------------------------------------
        _page.navigate = function (url, includeVariables) {
            var mainFrame = document.getElementById("mainFrame");
            //var mainFrame = window.parent.mainFrame;
            // if this is a relative url...
            var urlToLoad;
            if (url.indexOf(':') < 0 || url[0] == '/') {
                var winHref = window.location.href;
                var page = winHref.substring(0, winHref.lastIndexOf('/') + 1) + url;
                urlToLoad = page;
            } else {
                urlToLoad = url;
            }
            if (!includeVariables) {
                mainFrame.contentWindow.location.href = urlToLoad;
                return;
            }
            var urlWithVars = $axure.getLinkUrlWithVars(urlToLoad);
            var currentData = $axure.messageCenter.getState('page.data');
            var currentUrl = currentData && currentData.location;
            if (currentUrl && currentUrl.indexOf('#') != -1) currentUrl = currentUrl.substring(0, currentUrl.indexOf('#'))

            // this is so we can make sure the current frame reloads if the variables have changed
            // by default, if the location is the same but the hash code is different, the browser will not
            // trigger a reload
            mainFrame.contentWindow.location.href =
                currentUrl && urlToLoad.toLowerCase() != currentUrl.toLowerCase()
                    ? urlWithVars
                    : 'resources/reload.html#' + encodeURI(urlWithVars);

        };

        var pluginIds = [];
        var plugins = {};
        var currentVisibleHostId = {};
        // ---------------------------------------------
        // Adds a tool box frame from a url to the interface. This is useful for loading plugins
        // settings is an object that supports the following properties:
        //    - id : the id of the element for the plugin
        //    - context : the context to create the plugin host for
        //    - title : the user-visible caption for the plugin
        // ---------------------------------------------
        _player.createPluginHost = function (settings) {
            if (!settings.context || !(settings.context === 'project' || settings.context === 'inspect')) {
                //throw ('unknown context type');
                return false;
            }

            if (settings.id == 'feedbackHost')
                $('#overflowMenuContainer').prepend('<div id="showCommentsOption" class="showOption" style="order: 2"><div class="overflowOptionCheckbox"></div>Show Comments</div>');

            if (!settings.id) throw ('each plugin host needs an id');

            if (typeof PREVIEW_INFO === 'undefined') {
                //  Share-Hosted Prototype
                if (settings.id == 'debugHost') { return false; }
                if (settings.id == 'handoffHost') { $('#handoffControlFrameHeaderContainer').show(); }
            } else {
                // Preview Mode
                if (settings.id == 'handoffHost') { return false; }
            }

            pluginIds[pluginIds.length] = settings.id;
            plugins[settings.id] = settings;

            var hostContainerId = settings.context + 'ControlFrameHostContainer';
            hostContainerId = _player.isMobileMode() ? 'mHideSidebar' : 'outerContainer';
            var panelClass = 'rightPanel';
            var host;
            if (settings.context == 'project') {
                panelClass = 'leftPanel';
                if (_player.isMobileMode() && $('#' + hostContainerId).find('#projectOptionsHost').length > 0) {
                    host = $('<div id="' + settings.id + '" class="' + panelClass + '"></div>')
                        .insertAfter('#projectOptionsHost');
                } else {
                    host = $('<div id="' + settings.id + '" class="' + panelClass + '"></div>')
                        .prependTo('#' + hostContainerId);
                }
            } else {
                if (!$('#separatorContainer').hasClass('hasLeft')) $('#separatorContainer').addClass('hasLeft');
                host = $('<div id="' + settings.id + '" class="' + panelClass + '"></div>')
                    .appendTo('#' + hostContainerId);
            }

            $(('#' + settings.id)).click(function (e) { e.stopPropagation(); });

            var controlContainerId = getControlContainerId(settings.id);


            if (!_player.isMobileMode()) host.hide();
            else _player.updatePlugins();

            // TODO: border radius in ie and edge causes image to be blurry (for now, just remove border-radius)
            var style = (IE || $axure.browser.isEdge) ? '" style="border-radius: 0': '';
            var headerLink = $('<a pluginId="' + settings.id + '" title="' + settings.title + style + '" >' + (settings.context === 'inspect' ? ('<span>' + '</span>'): '&nbsp;') + '</a>');
            headerLink.mousedown($axure.utils.curry(interfaceControlHeaderButton_click, settings.id)).wrap('<li id="' + settings.id + 'Btn"' + (settings.id == "handoffHost" ? ' style="display: none"' : '') + '>');

            headerLink.parent().appendTo('#' + controlContainerId);

            if (_player.isMobileMode()) $axure.player.resizeContent();

            $(document).trigger('pluginCreated', [settings.gid]);
        };

        var getControlContainerId = function (id) {
            return plugins[id].context + 'ControlFrameHeader';
        }

        var getVisiblePlugins = function () {
            var ids = '';
            for (var id in plugins) {
                var context = plugins[id].context;
                if (currentVisibleHostId[context] == id) {
                    ids += plugins[id].gid;
                }
            }
            return ids;
        }

        _player.pluginVisibleChanged = function(hostId, visible) {
            if ($axure.player.isCloud && plugins[hostId]) {
                $axure.messageCenter.postMessage('pluginVisibleChanged', { id: hostId, gid: plugins[hostId].gid, visible: visible });
            }
        }

        var interfaceControlHeaderButton_click = function (id) {
            if (_player.isAnimating) { return; }
            $axure.player.closePopup();

            var controlContainerId = getControlContainerId(id);
            var context = plugins[id].context;

            var clickedPlugin = $('#' + controlContainerId + ' a[pluginId=' + id + ']');
            if (currentVisibleHostId[context] == id) {
                clickedPlugin.removeClass('selected');
                if (id == "sitemapHost") { $('#sitemapControlFrameContainer').removeClass('selected'); }
                currentVisibleHostId[context] = -1;
                _player.collapseToBar(context, id);
                
                $(document).trigger('pluginShown', [getVisiblePlugins()]);
            } else {
                $('#' + controlContainerId + ' a').removeClass('selected');
                clickedPlugin.addClass('selected');
                if (id == "sitemapHost") { $('#sitemapControlFrameContainer').addClass('selected'); }

                $('#' + currentVisibleHostId[context]).hide();
                $axure.player.pluginVisibleChanged(currentVisibleHostId[context], false);
                currentVisibleHostId[context] = id;
                _player.expandFromBar(id, context);

                $(document).trigger('pluginShown', [getVisiblePlugins()]);
            }
        };

        _player.pluginClose = function (id) {
            var controlContainerId = getControlContainerId(id);
            var context = plugins[id].context;

            var clickedPlugin = $('#' + controlContainerId + ' a[pluginId=' + id + ']');
            if (!clickedPlugin.hasClass('selected')) { return; }
            clickedPlugin.removeClass('selected');
            currentVisibleHostId[context] = -1;
            _player.collapseToBar(context, id);

            $(document).trigger('pluginShown', [getVisiblePlugins()]);
        };

        _player.showPlugin = function (gid) {
            for (var id in plugins) {
                if (plugins[id].gid == gid) {
                    interfaceControlHeaderButton_click(id);
                    break;
                }
            }
        };

        _player.restorePlugins = function () {
            var selectedPluginsCount = 0;
            for (var id in plugins) {
                var clickedPlugin = $('#' + getControlContainerId(id) + ' a[pluginId=' + id + ']');
                if (clickedPlugin.hasClass('selected')) selectedPluginsCount++;
            }
            if ($axure.player.settings.isAxshare && selectedPluginsCount != 0) $('#clippingBoundsScrollContainer').hide();

            var selectedPluginsSeen = 0;
            for (var id in plugins) {
                var controlContainerId = getControlContainerId(id);
                var context = plugins[id].context;
                var clickedPlugin = $('#' + controlContainerId + ' a[pluginId=' + id + ']');
                if (clickedPlugin.hasClass('selected')) {
                    //_player.showPlugin(id);
                    // TODO: handoffHost would need center inspect icon highlighted and rightFrameIcon set to visible
                    //if (id == 'handoffHost') { } 
                    //$('#' + id).show();
                    selectedPluginsSeen++;
                    _player.expandFromBar(id, context, selectedPluginsCount == selectedPluginsSeen);
                } else {
                    $('#' + id).hide();
                }
            }
            $(document).trigger('pluginShown', [getVisiblePlugins()]);
        };

    }


    $axure.player.hideAllPlayerControllers = function(isVisible) {
        // TOOD: Verify that the containers are set to the right state after re-enabling them
        if(isVisible) {
            $('#topPanel').css('display', '');
            $('#popupContainer').css('display', '');
            $('#maximizePanelContainer').css('display', '');        
            $('#mobileControlFrameContainer').css('display', '');
        } else {
            $('#topPanel').hide();
            $('#popupContainer').hide();
            $('#maximizePanelContainer').hide();        // TODO: This needs to have a function where it prevents itself from showing up externally
            $('#mobileControlFrameContainer').hide();
        }
    }


    // TODO: General function to add bezels/overlays if applicable
    $axure.player.addDeviceFraming = function (project, isEdit) {
        // Temporary
        var devices = {
            iPhone8: 0,
            iPhone8Plus: 1,
            iPhoneSE: 2,
            iPhoneX: 3,
            iPad4: 4,
            GalaxyS8: 5,
            Pixel2: 6,
            Pixel2XL: 7,
            Mobile: 8,
            Tablet9: 9,
            Tablet7: 10,
            Custom: 11,
            Web: 12
        };

        // TODO: Need to bring over some platform functionality -> function might not be present
        if (!$axure.player.settings.isExpo || project.Platform.Device === 12) { return; }

        // TODO: Generate html for overlay and bezel containers
        // TODO: Determine if preview player or full prototype player to establish where containers will be stored
        var currDevice = project.Platform.Device;
        var rootPath = '../../Scripts/Expo/StaticContent/resources/images/mobile/';
        var framePath, overlayPath;

        var $overlayParent = $(window.parent.parent.document).find('#previewPlayerDiv');
        $overlayParent = isEdit && $overlayParent.length !== 0 ? $overlayParent : $('#mainPanelContainer');

        $overlayParent.css('overflow', 'visible');

        // TODO: Import enum of Device types -> import via TS definitions. WILL NEED TO REMEMBER THAT WE NEED TO SYNC SERVER AND CLIENT SIDE
        // TODO: Create mapping of required images to device type
        // images will be stored in ../../images/mobile
        // TODO: Manage resizing
        // TODO: Manage pointer clicks
        // TODO: Status bar -> Default or via settings


        // TODO: Establish img paths
        switch (currDevice) {
            case devices.iPhone8:
            case devices.iPhone8Plus:
                framePath = rootPath + 'iphone.svg';
                overlayPath = "";
                break;
            case devices.iPhoneSE:
                break;
            case devices.iPhoneX:
                framePath = "";
                overlayPath = "";
                break;
            case devices.iPad4:
                break;
            case devices.Pixel2:
                break;
            case devices.Pixel2XL:
                break;
            case devices.GalaxyS8:
                break;
            case devices.Mobile:
            case devices.Tablet7:
            case devices.Tablet9:
            case devices.Custom:
            default:
                break;
        }

        // TODO: Append images
        // TODO: Position and initial dimensions
        // TODO: Add resize handlers (?)
        // TODO: Add pointer event handers (?)
        if (framePath != undefined) {
            $overlayParent.prepend(genFrameContainer());

            var $fContainer = $overlayParent.find('#deviceFrameContainer');
            var $frame = $fContainer.find('#deviceFrame');

            $frame.css('background-image', "url('" + framePath + "')");
            $frame.css('height', '');
            $frame.css('width', '');
            $frame.css('top', '');
            $frame.css('left', '');

            if(isEdit) {
                $fContainer.css('z-index', -1);
            }
        }

        if (overlayPath != undefined) {
            // TODO: Update for edit mode
            // $overlayParent.append(genOverlayContainer());

            var $oContainer = $overlayParent.find('#deviceOverlayContainer');
            var $overlay = $oContainer.find('#deviceOverlay');

            $overlay.css('background-image', "url('" + overlayPath + "')");
        }
    }

    function genFrameContainer(bezelPath) {
        var container = [
            '<div id="deviceFrameContainer">',
            '   <div id="deviceFrame">',
            '   </div>',
            '</div>'
        ].join("");

        return container;
    }

})();
