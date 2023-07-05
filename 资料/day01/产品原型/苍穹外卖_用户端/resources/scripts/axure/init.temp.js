$axure.internal(function($ax) {

    $(window.document).ready(function () {
        
        //var readyStart = (new Date()).getTime();

        //this is because the page id is not formatted as a guid
        var pageId = $ax.pageData.page.packageId;

        var pageData = {
            id: pageId,
            pageName: $ax.pageData.page.name,
            location: window.location.toString(),
            notes: $ax.pageData.page.notes,
            widgetNotes: $ax.pageData.page.annotations,
            //clipToView: $ax.pageData.clipToView,
            defaultAdaptiveView: $ax.pageData.defaultAdaptiveView,
            adaptiveViews: $ax.pageData.adaptiveViews,
            masterNotes: []
        };

        var fnPrefix = '';
        function pushNextPrefix() {
            if (fnPrefix.length == 0) fnPrefix = 'A';
            else fnPrefix = fnPrefix[0] == 'Z' ? 'A'.repeat(fnPrefix.length + 1) : String.fromCharCode(fnPrefix.charCodeAt(0) + 1).repeat(fnPrefix.length);
        }

        function populateNotes(pageForNotes) {
            for (var master in pageForNotes.masters) {
                //var master = pageForNotes.masters[i];
                var masterData = pageForNotes.masters[master];
                var hasWidgetNotes = masterData.annotations && masterData.annotations.length > 0;
                if ((master.notes && !$.isEmptyObject(masterData.notes)) || hasWidgetNotes) {
                    if(hasWidgetNotes) pushNextPrefix();
                    var m = {};
                    m.pageName = masterData.name;
                    m.notes = masterData.notes;
                    m.widgetNotes = masterData.annotations;
                    pageData.masterNotes.push(m);
                    if(hasWidgetNotes) populateOwnerToFn(m.widgetNotes);
                }
                populateNotes(master);
            }
        }

        var ownerToFns = {};
        function populateOwnerToFn(widgetNotes) {
            if(typeof widgetNotes == 'undefined') return false;
            for (var i = 0; i < widgetNotes.length; i++) {
                var widgetNote = widgetNotes[i];
                widgetNote['fn'] = fnPrefix + widgetNote['fn'];
                var fn = widgetNote['fn'];
                var ownerId = widgetNote['ownerId'];
                if (ownerId !== undefined && ownerId.length > 0) {
                    var ownerLabels = ownerToFns[ownerId];
                    if (ownerLabels == undefined) ownerLabels = [];
                    ownerLabels.push(fn);
                    ownerToFns[ownerId] = ownerLabels;
                }
            }
        }

        populateOwnerToFn(pageData.widgetNotes);
        populateNotes($ax.pageData);
        pageData.ownerToFns = ownerToFns;

        $ax.pageData.notesData = pageData;

        //var anns = [];
        //$ax('*').each(function (dObj, elementId) {
        //    pushAnnotation(dObj, elementId);
        //});

        //function pushAnnotation(dObj, elementId) {
        //    var ann = dObj.annotation;
        //    if(ann) {
        //        ann = $ax.deepCopy(ann);
        //        ann["id"] = elementId;
        //        ann["label"] = dObj.label + " (" + dObj.friendlyType + ")";
        //        anns.push(ann);
        //    }

        //    if(dObj.type === 'repeater' && dObj.objects) {
        //        //if it's repeater, save the id as repeaterId@scriptId
        //        for(var i = 0, len = dObj.objects.length; i < len; i++) {
        //            var child = dObj.objects[i];
        //            var scriptId = $ax.getScriptIdFromPath([child.id], elementId);
        //            pushAnnotation(child, elementId + '@' + scriptId);
        //        }
        //    }
        //}

        //pageData.widgetNotes = anns;

        //only trigger the page.data setting if the window is on the mainframe
        var isMainFrame = false;
        try {
            if(window.name == 'mainFrame' ||
            (!CHROME_5_LOCAL && window.parent.$ && window.parent.$('#mainFrame').length > 0)) {
                isMainFrame = true;

                $ax.messageCenter.addMessageListener(function(message, data) {
                    if(message == 'finishInit') {
                        _processTempInit();
                    }
                });

                $axure.messageCenter.setState('page.data', pageData);
                window.focus();
            }
        } catch(e) { }

        //attach here for chrome local
        //$(window).on('load', function() {
        //    $ax.style.initializeObjectTextAlignment($ax('*'));
        //});

        if(!isMainFrame) _processTempInit();
    });

    var touchCount = 0;
    var lastTouch = Date.now();
    var _registerTouchCount = $ax.registerTouchCount = function (e) {
        var now = Date.now();
        if (now - lastTouch < 375) {
            if (++touchCount === 3) {
                $(':input').blur();
                $ax.messageCenter.postMessage('tripleClick', true);
                e.preventDefault();
            };
        } else {
            touchCount = 1;
        }
        lastTouch = now;
    };

    // Block IOS stalling second tap.
    // Stop third click from also clicking mobile card
    var _clearTouchCount = $ax.clearTouchCount = function (e) {
        if (touchCount === 3) {
            touchCount = 0;
            e.preventDefault();
        }
    };

    var _processTempInit = function() {
        //var start = (new Date()).getTime();
        //var end = (new Date()).getTime();
        //window.alert('elapsed ' + (end - start));

        $('iframe').each(function() {
            var origSrc = $(this).attr('basesrc');

            var $this = $(this);
            if(origSrc) {
                var newSrcUrl = origSrc.toLowerCase().indexOf('http://') == -1 ? $ax.globalVariableProvider.getLinkUrl(origSrc) : origSrc;
                $this.attr('src', newSrcUrl);
            }

            if(IOS) {
                $this.parent().css('overflow', 'auto').css('-webkit-overflow-scrolling', 'touch').css('-ms-overflow-x', 'hidden').css('overflow-x', 'hidden');
            }
        });

        $axure.messageCenter.addMessageListener(function(message, data) {
            if(message == 'setGlobalVar') {
                $ax.globalVariableProvider.setVariableValue(data.globalVarName, data.globalVarValue, true);
            }
        });

        window.lastFocusedClickable = null;
        var _lastFocusedClickableSelector = 'input, a';
        var shouldOutline = true;

        $ax(function (dObj) { return dObj.tabbable; }).each(function (dObj, elementId) {
            if ($ax.public.fn.IsLayer(dObj.type)) $ax.event.layerMapFocus(dObj, elementId);
            var focusableId = $ax.event.getFocusableWidgetOrChildId(elementId);
            var $focusable = $('#' + focusableId);
            $focusable.attr("tabIndex", 0);
            if($focusable.is('div') || $focusable.is('img')) {
                $focusable.bind($ax.features.eventNames.mouseDownName, function() {
                    shouldOutline = false;
                });
                attachFocusAndBlur($focusable);
            }
        });

        $(window.document).bind($ax.features.eventNames.mouseUpName, function() {
            shouldOutline = true;
        });

        attachFocusAndBlur($(_lastFocusedClickableSelector));

        function attachFocusAndBlur($query) {
            $query.focus(function () {
                if(shouldOutline) {
                    $(this).css('outline', '');
                } else {
                    $(this).css('outline', 'none');
                }
                window.lastFocusedClickable = this;
            }).blur(function () {
                if(window.lastFocusedClickable == this) window.lastFocusedClickable = null;
            });
        }

        $(window.document).bind('keyup', function (e) {
            switch(e.which) {
                case 13:
                case 32:
                    if(window.lastFocusedClickable) $(window.lastFocusedClickable).click();
                    break;
                default: return; // exit this handler for other keys
            }
        });

        //if($ax.document.configuration.hideAddress) {
        //    $(window).on('load', function() {
        //        window.setTimeout(function() {
        //            window.scrollTo(0, 0.9);
        //        }, 0);
        //    });
        //}

        //if($ax.document.configuration.preventScroll) {
        //    $(window.document).bind('touchmove', function(e) {
        //        var inScrollable = $ax.legacy.GetScrollable(e.target) != window.document.body;
        //        if(!inScrollable) {
        //            e.preventDefault();
        //        }
        //    });

        //    $ax(function(diagramObject) {
        //        return $ax.public.fn.IsDynamicPanel(diagramObject.type) && diagramObject.scrollbars != 'none';
        //    }).$().children().bind('touchstart', function() {
        //        var target = this;
        //        var top = target.scrollTop;
        //        if(top <= 0) target.scrollTop = 1;
        //        if(top + target.offsetHeight >= target.scrollHeight) target.scrollTop = target.scrollHeight - target.offsetHeight - 1;
        //    });
        //}

        if(OS_MAC && WEBKIT) {
            $ax(function(diagramObject) {
                return $ax.public.fn.IsComboBox(diagramObject.type);
            }).each(function(obj, id) {
                $jobj($ax.INPUT(id)).css('-webkit-appearance', 'menulist-button');
            });
        }

        if($ax.features.supports.mobile) {
            $('html').first().on('touchstart', _registerTouchCount);
            $('html').first().on('touchend', _clearTouchCount);

            // Stop pinch zoom (stopping all gestures for now)
            // Gesturestart is only supported in Safari
            if (SAFARI) {
                document.addEventListener("gesturestart", function (e) {
                    e.preventDefault();
                });
            }
        }

        $ax.annotation.initialize();

        $ax.legacy.BringFixedToFront();
        $ax.event.initialize();
        $ax.style.initialize();
        $ax.visibility.initialize();
        $ax.repeater.initialize();
        $ax.dynamicPanelManager.initialize(); //needs to be called after visibility is initialized
        $ax.adaptive.initialize();
        $ax.loadDynamicPanelsAndMasters();
        $ax.adaptive.loadFinished();
        var start = (new Date()).getTime();
        $ax.repeater.initRefresh();
        var end = (new Date()).getTime();
        console.log('loadTime: ' + (end - start) / 1000);
        $ax.style.prefetch();

        $(window).resize();

        //var readyEnd = (new Date()).getTime();
        //window.alert('elapsed ' + (readyEnd - readyStart));
    };
});

/* extend canvas */
var gv_hasCanvas = false;
(function() {
    var _canvas = document.createElement('canvas'), proto, abbrev;
    if(gv_hasCanvas = !!(_canvas.getContext && _canvas.getContext('2d')) && typeof (CanvasGradient) !== 'undefined') {
        function chain(func) {
            return function() {
                return func.apply(this, arguments) || this;
            };
        }

        with(proto = CanvasRenderingContext2D.prototype) for(var func in abbrev = {
            a: arc,
            b: beginPath,
            n: clearRect,
            c: clip,
            p: closePath,
            g: createLinearGradient,
            f: fill,
            j: fillRect,
            z: function(s) { this.fillStyle = s; },
            l: lineTo,
            w: function(w) { this.lineWidth = w; },
            m: moveTo,
            q: quadraticCurveTo,
            h: rect,
            r: restore,
            o: rotate,
            s: save,
            x: scale,
            y: function(s) { this.strokeStyle = s; },
            u: setTransform,
            k: stroke,
            i: strokeRect,
            t: translate
        }) proto[func] = chain(abbrev[func]);
        CanvasGradient.prototype.a = chain(CanvasGradient.prototype.addColorStop);
    }
})();
