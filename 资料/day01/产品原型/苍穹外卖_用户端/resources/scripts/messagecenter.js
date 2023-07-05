if (typeof console == 'undefined') console = {
    log: function () { }
};

// sniff chrome
var CHROME_5_LOCAL = false;
var CHROME = false;
var SAFARI = false;
var FIREFOX = false;
var WEBKIT = false;
var QQ = false;
var UC = false;
var OS_MAC = false;
var IOS = false;
var ANDROID = false;
var MOBILE_DEVICE = false;
var SHARE_APP = false;

var IE = false;
var IE_10_AND_BELOW = false;  //ie 10 and lower
var IE_11_AND_ABOVE = false; //ie 11 and above
var BROWSER_VERSION = 5000;
(function () {
    if(!window.$axure) window.$axure = function() {};
    var useragent = window.navigator.userAgent;

    IOS = useragent.match(/iPhone/i) || useragent.match(/iPad/i) || useragent.match(/iPod/i);
    ANDROID = useragent.match(/Android/i);

    MOBILE_DEVICE = ANDROID || IOS
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Tablet PC/i)
        || navigator.userAgent.match(/Windows Phone/i);

    var edgeRegex = /Edge\/([0-9]+)/g;
    var edgeMatch = edgeRegex.exec(useragent);
    $axure.browser = { isEdge: Boolean(edgeMatch) };
    if ($axure.browser.isEdge) BROWSER_VERSION = Number(edgeMatch[1]);

    if(!$axure.browser.isEdge) {
        var chromeRegex = /Chrome\/([0-9]+).([0-9]+)/g;
        var chromeMatch = chromeRegex.exec(useragent);
        CHROME = Boolean(chromeMatch);
        CHROME_5_LOCAL = chromeMatch &&
            Number(chromeMatch[1]) >= 5 &&
            location.href.indexOf('file://') >= 0 &&
            !MOBILE_DEVICE; // Otherwise, Android webview will show up as CHROME_5_LOCAL
        if (CHROME) BROWSER_VERSION = Number(chromeMatch[1]);
    }

    var safariRegex = /Safari\/([0-9]+)/g;
    var safariMatch = safariRegex.exec(useragent);
    SAFARI = Boolean(safariMatch) && !CHROME && !$axure.browser.isEdge; //because chrome also inserts safari string into user agent
    if (SAFARI) BROWSER_VERSION = Number(safariMatch[1]);

    var webkitRegex = /WebKit\//g ;
    WEBKIT = Boolean(webkitRegex.exec(useragent));

    var firefoxRegex = /Firefox\/([0-9]+)/g;
    var firefoxMatch = firefoxRegex.exec(useragent);
    FIREFOX = useragent.toLowerCase().indexOf('firefox') > -1;
    if (FIREFOX) BROWSER_VERSION = Number(firefoxMatch[1]);

    QQ = useragent.toLowerCase().indexOf('qqbrowser') > -1;
    UC = useragent.toLowerCase().indexOf('ucbrowser') > -1 || useragent.toLowerCase().indexOf('ubrowser') > -1;

    SHARE_APP = useragent.toLowerCase().indexOf('shareapp') > -1;

    var macRegex = /Mac/g ;
    OS_MAC = Boolean(macRegex.exec(window.navigator.platform));
    
    if($.browser) {
        if($.browser.msie) IE_10_AND_BELOW = true;
        else IE_11_AND_ABOVE = useragent.toLowerCase().indexOf('trident') > -1;

        BROWSER_VERSION = $.browser.version;
    }

    IE_11_AND_ABOVE = useragent.toLowerCase().indexOf('trident') > -1;
    IE_10_AND_BELOW = !IE_11_AND_ABOVE && useragent.toLowerCase().indexOf('msie') > -1;
    IE = IE_10_AND_BELOW || IE_11_AND_ABOVE;

    var _supports = $axure.mobileSupport = {};
    _supports.touchstart = typeof window.ontouchstart !== 'undefined';
    _supports.touchmove = typeof window.ontouchmove !== 'undefined';
    _supports.touchend = typeof window.ontouchend !== 'undefined';
    _supports.mobile = _supports.touchstart && _supports.touchend && _supports.touchmove;

    if (!MOBILE_DEVICE && _supports.mobile) {
        _supports.touchstart = false;
        _supports.touchmove = false;
        _supports.touchend = false;
        _supports.mobile = false;
    }

    var _eventNames = $axure.eventNames = {};
    _eventNames.mouseDownName = _supports.touchstart ? 'touchstart' : 'mousedown';
    _eventNames.mouseUpName = _supports.touchend ? 'touchend' : 'mouseup';
    _eventNames.mouseMoveName = _supports.touchmove ? 'touchmove' : 'mousemove';

    //Used by sitemap and variables.js getLinkUrl functions so that they know
    //whether to embed global variables in URL as query string or hash string
    //_shouldSendVars persists the value for sitemap instead of re-checking every time
    var _shouldSendVars;
    var _shouldSendVarsToServer = function(url) {
        if(typeof _shouldSendVars != 'undefined') {
            return _shouldSendVars;
        }

        if(SAFARI || (IE_10_AND_BELOW && BROWSER_VERSION < 10)) {
            var urlToCheck = typeof url != 'undefined' ? url : window.location.href;
            var serverRegex = /http:\/\/127\.0\.0\.1:[0-9]{5}/g;
            var serverMatch = serverRegex.exec(urlToCheck);
            var previewRegex = /[0-9]{2}\.[0-9]{2}\.[0-9]{2}/g;
            var previewMatch = previewRegex.exec(urlToCheck);
            if(Boolean(serverMatch) && Boolean(previewMatch)) {
                _shouldSendVars = true;
                return _shouldSendVars;
            }
        }

        _shouldSendVars = false;
        return _shouldSendVars;
    };
    $axure.shouldSendVarsToServer = _shouldSendVarsToServer;
})();

(function () {
    var matched, browser;

    // Use of jQuery.browser is frowned upon.
    // More details: http://api.jquery.com/jQuery.browser
    // jQuery.uaMatch maintained for back-compat
    jQuery.uaMatch = function (ua) {
        ua = ua.toLowerCase();

        var match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
            /(webkit)[ \/]([\w.]+)/.exec(ua) ||
            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
            /(msie) ([\w.]+)/.exec(ua) ||
            ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
            [];

        return {
            browser: match[1] || "",
            version: match[2] || "0"
        };
    };

    matched = jQuery.uaMatch(navigator.userAgent);
    browser = {};

    if (matched.browser) {
        browser[matched.browser] = true;
        browser.version = matched.version;
    }

    // Chrome is Webkit, but Webkit is also Safari.
    if (browser.chrome) {
        browser.webkit = true;
    } else if (browser.webkit) {
        browser.safari = true;
    }

    jQuery.browser = browser;

    jQuery.sub = function () {
        function jQuerySub(selector, context) {
            return new jQuerySub.fn.init(selector, context);
        }
        jQuery.extend(true, jQuerySub, this);
        jQuerySub.superclass = this;
        jQuerySub.fn = jQuerySub.prototype = this();
        jQuerySub.fn.constructor = jQuerySub;
        jQuerySub.sub = this.sub;
        jQuerySub.fn.init = function init(selector, context) {
            if (context && context instanceof jQuery && !(context instanceof jQuerySub)) {
                context = jQuerySub(context);
            }

            return jQuery.fn.init.call(this, selector, context, rootjQuerySub);
        };
        jQuerySub.fn.init.prototype = jQuerySub.fn;
        var rootjQuerySub = jQuerySub(document);
        return jQuerySub;
    };

})();

(function() {
    var _topMessageCenter;
    var _messageCenter = {};
    var _listeners = [];
    var _stateListeners = [];
    var _state = {};
    var _eventObject = null;

    var _queuedMessages = [];
    var _initialized = false;

    // this is for the non Chrome 5 local scenarios. The "top" message center will dispatch to all the bottom ones
    var _childrenMessageCenters = [];

    // create $axure if it hasn't been created
    if(!window.$axure) window.$axure = function() {};
    $axure.messageCenter = _messageCenter;

    // isolate scope, and initialize _topMessageCenter.
    (function() {
        if(!CHROME_5_LOCAL) {
            var topAxureWindow = window;
            try {
                while(topAxureWindow.parent && topAxureWindow.parent !== topAxureWindow && topAxureWindow.parent.$axure)
                    topAxureWindow = topAxureWindow.parent;
            } catch(e) {
            }
            _topMessageCenter = topAxureWindow.$axure.messageCenter;
        }
    })();

    if (CHROME_5_LOCAL) {
        document.addEventListener("DOMContentLoaded", function () {
            $('body').append("<div id='axureEventReceiverDiv' style='display:none'></div>" +
                "<div id='axureEventSenderDiv' style='display:none'></div>");

            _eventObject = window.document.createEvent('Event');
            _eventObject.initEvent('axureMessageSenderEvent', true, true);

            $('#axureEventReceiverDiv')[0].addEventListener('axureMessageReceiverEvent',
                function () {
                    var request = JSON.parse($(this).text());
                    _handleRequest(request);
                });
        });
    } else {
        $(window.document).ready(function () {
            if (_topMessageCenter != _messageCenter) {
                _topMessageCenter.addChildMessageCenter(_messageCenter);
                console.log('adding from ' + window.location.toString());
            }
        });
    }

    var _handleRequest = function (request) {
        // route the request to all the listeners
        for(var i = 0; i < _listeners.length; i++) _listeners[i](request.message, request.data);

        // now handle the queued messages if we're initializing
        if (request.message == 'initialize') {
            _initialized = true;
            // send all the queued messages and return
            for (var i = 0; i < _queuedMessages.length; i++) {
                var qRequest = _queuedMessages[i];
                _messageCenter.postMessage(qRequest.message, qRequest.data);
            }
            _queuedMessages = [];
        }
                
        // and then handle the set state messages, if necessary
        if (request.message == 'setState') {
            _state[request.data.key] = request.data.value;
            for (var i = 0; i < _stateListeners.length; i++) {
                var keyListener = _stateListeners[i];
                // if thep passed a null or empty value, always post the message
                if (!keyListener.key || keyListener.key == request.data.key) {
                    keyListener.listener(request.data.key, request.data.value);
                }
            }
        }

    };

    // -----------------------------------------------------------------------------------------
    // This method allows for dispatching messages in the non-chromelocal scenario.
    // Each child calls this on _topMessageCenter
    // -----------------------------------------------------------------------------------------
    _messageCenter.addChildMessageCenter = function(messageCenter) {
        _childrenMessageCenters[_childrenMessageCenters.length] = messageCenter;
    };

    // -----------------------------------------------------------------------------------------
    // This method allows for dispatching messages in the non-chromelocal scenario.
    // Each child calls this on _topMessageCenter
    // -----------------------------------------------------------------------------------------
    _messageCenter.dispatchMessage = function(message, data) {
        _handleRequest({
            message: message,
            data: data
        });
    };

    // -----------------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------
    _messageCenter.dispatchMessageRecursively = function(message, data) {
        console.log("dispatched to " + window.location.toString());

        // dispatch to the top center first
        _messageCenter.dispatchMessage(message, data);

        $('iframe').each(function(index, frame) {
            //try,catch to handle permissions error in FF when loading pages from another domain
            try {
                if (frame.contentWindow.$axure && frame.contentWindow.$axure.messageCenter) {
                    frame.contentWindow.$axure.messageCenter.dispatchMessageRecursively(message, data);
                }
            }catch(e) {}
        });
    };

    var _combineEventMessages = false;
    var _compositeEventMessageData = [];
    _messageCenter.startCombineEventMessages = function() {
        _combineEventMessages = true;
    }

    _messageCenter.endCombineEventMessages = function () {
        _messageCenter.sendCompositeEventMessage();
        _combineEventMessages = false;
    }

    _messageCenter.sendCompositeEventMessage = function () {
        _messageCenter.postMessage('axCompositeEventMessage', _compositeEventMessageData);
        _compositeEventMessageData = [];
    }

    _messageCenter.postMessage = function (message, data) {
        if(_combineEventMessages) {
            if(message == 'axEvent' || message == 'axCase' || message == 'axAction' || message == 'axEventComplete') {
                _compositeEventMessageData.push({ 'message': message, 'data': data });
                if(_compositeEventMessageData.length >= 10) _messageCenter.sendCompositeEventMessage();
                return;
            }
        }

        if(!CHROME_5_LOCAL) {
            _topMessageCenter.dispatchMessageRecursively(message, data);
        } else {
            var request = {
                message: message,
                data: data
            };

            if(_initialized) {
                var senderDiv = window.document.getElementById('axureEventSenderDiv');
                var messageText = JSON.stringify(request);
                //                console.log('sending event: ' + messageText);
                senderDiv.innerText = messageText;
                senderDiv.dispatchEvent(_eventObject);
                //                console.log('event sent');
            } else {
                _queuedMessages[_queuedMessages.length] = request;
            }
        }
    };

    _messageCenter.setState = function(key, value) {
        var data = {
            key: key,
            value: value
        };
        _messageCenter.postMessage('setState', data);
    };

    _messageCenter.getState = function(key) {
        return _state[key];
    };

    _messageCenter.addMessageListener = function(listener) {
        _listeners[_listeners.length] = listener;
    };

    _messageCenter.addStateListener = function(key, listener) {
        _stateListeners[_stateListeners.length] = {
            key: key,
            listener: listener
        };
    };

})();
