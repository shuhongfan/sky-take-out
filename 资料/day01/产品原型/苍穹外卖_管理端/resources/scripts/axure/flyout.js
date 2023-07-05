// ******* Flyout MANAGER ******** //
$axure.internal(function($ax) {
    var _flyoutManager = $ax.flyoutManager = {};

    var getFlyoutLabel = function(panelId) {
        return panelId + '_flyout';
    };

    var _unregisterPanel = function(panelId, keepShown) {
        $ax.geometry.unregister(getFlyoutLabel(panelId));
        if(panelToSrc[panelId]) {
            $ax.style.RemoveRolloverOverride(panelToSrc[panelId]);
            delete panelToSrc[panelId];
        }
        if(!keepShown) {
            $ax.action.addAnimation(panelId, $ax.action.queueTypes.fade, function() {
                $ax('#' + panelId).hide();
            });
        }
    };
    _flyoutManager.unregisterPanel = _unregisterPanel;

    var genPoint = $ax.geometry.genPoint;

    var _updateFlyout = function(panelId) {
        var label = getFlyoutLabel(panelId);
        if(!$ax.geometry.polygonRegistered(label)) return;
        var info = $ax.geometry.getPolygonInfo(label);
        var rects = info && info.rects;

        var targetWidget = $ax.getWidgetInfo(panelId);
        rects.target = $ax.geometry.genRect(targetWidget);

        // Src will stay the same, just updating
        $ax.flyoutManager.registerFlyout(rects, panelId, panelToSrc[panelId]);

        if(!$ax.geometry.checkInsideRegion(label)) _unregisterPanel(panelId);
    };
    _flyoutManager.updateFlyout = _updateFlyout;

    var panelToSrc = {};
    var _registerFlyout = function(rects, panelId, srcId) {
        var label = _getFlyoutLabel(panelId);
        var callback = function(info) {
            // If leaving object or already outside it, then unregister, otherwise just return
            if(!info.exiting && !info.outside) return;
            _unregisterPanel(panelId);
        };
        var points = [];

        var lastSrcId = panelToSrc[panelId];
        if(lastSrcId != srcId) {
            if(lastSrcId) $ax.style.RemoveRolloverOverride(lastSrcId);
            if(srcId) {
                $ax.style.AddRolloverOverride(srcId);
                panelToSrc[panelId] = srcId;
            } else delete panelToSrc[panelId];
        }

        // rects should be one or two rectangles
        if(!rects.src) {
            var rect = rects.target;
            points.push(genPoint(rect.Left(), rect.Top()));
            points.push(genPoint(rect.Right(), rect.Top()));
            points.push(genPoint(rect.Right(), rect.Bottom()));
            points.push(genPoint(rect.Left(), rect.Bottom()));
        } else {
            var r0 = rects.src;
            var r1 = rects.target;

            // Right left of right, left right of left, top below top, bottom above bottom
            var rlr = r0.Right() <= r1.Right();
            var lrl = r0.Left() >= r1.Left();
            var tbt = r0.Top() >= r1.Top();
            var bab = r0.Bottom() <= r1.Bottom();

            var info = { rlr: rlr, lrl: lrl, tbt: tbt, bab: bab };

            if((rlr && lrl) || (tbt && bab)) {
                points = getSmallPolygon(r0, r1, info);
            } else {
                points = getLargePolygon(r0, r1, info);
            }
        }

        $ax.geometry.registerPolygon(label, points, callback, { rects: rects });
    };
    _flyoutManager.registerFlyout = _registerFlyout;

    var _getFlyoutLabel = function(panelId) {
        return panelId + '_flyout';
    };

    var _reregisterAllFlyouts = function() {
        for(var panelId in panelToSrc) _reregisterFlyout(panelId);
    };
    _flyoutManager.reregisterAllFlyouts = _reregisterAllFlyouts;

    var _reregisterFlyout = function(panelId) {
        var rects = $ax.geometry.getPolygonInfo(getFlyoutLabel(panelId)).rects;
        _registerFlyout(rects, panelId, panelToSrc[panelId]);
    };

    // This is the reduced size polygon connecting r0 to r1 by means of horizontal or vertical lines.
    var getSmallPolygon = function(r0, r1, info) {
        var points = [];

        // NOTE: currently I make the assumption that if horizontal/vertical connecting lines from the src hit the target
        //        Meaning if horizontal, rlr and lrl are true, and if vertical, tbt and bab are true.

        var r0Left = r0.Left();
        var r0Right = r0.Right();
        var r0Top = r0.Top();
        var r0Bottom = r0.Bottom();
        var r1Left = r1.Left();
        var r1Right = r1.Right();
        var r1Top = r1.Top();
        var r1Bottom = r1.Bottom();

        points.push(genPoint(r1Left, r1Top));

        if(!info.tbt) {
            points.push(genPoint(r0Left, r1Top));
            points.push(genPoint(r0Left, r0Top));
            points.push(genPoint(r0Right, r0Top));
            points.push(genPoint(r0Right, r1Top));
        }

        points.push(genPoint(r1Right, r1Top));

        if(!info.rlr) {
            points.push(genPoint(r1Right, r0Top));
            points.push(genPoint(r0Right, r0Top));
            points.push(genPoint(r0Right, r0Bottom));
            points.push(genPoint(r1Right, r0Bottom));
        }

        points.push(genPoint(r1Right, r1Bottom));

        if(!info.bab) {
            points.push(genPoint(r0Right, r1Bottom));
            points.push(genPoint(r0Right, r0Bottom));
            points.push(genPoint(r0Left, r0Bottom));
            points.push(genPoint(r0Left, r1Bottom));
        }

        points.push(genPoint(r1Left, r1Bottom));

        if(!info.lrl) {
            points.push(genPoint(r1Left, r0Bottom));
            points.push(genPoint(r0Left, r0Bottom));
            points.push(genPoint(r0Left, r0Top));
            points.push(genPoint(r1Left, r0Top));
        }

        return points;
    };

    // This is the original algorithm that connects the most extream corners to make polygon
    var getLargePolygon = function(r0, r1, info) {
        var points = [];

        var r0Left = r0.Left();
        var r0Right = r0.Right();
        var r0Top = r0.Top();
        var r0Bottom = r0.Bottom();
        var r1Left = r1.Left();
        var r1Right = r1.Right();
        var r1Top = r1.Top();
        var r1Bottom = r1.Bottom();

        // Top lefts
        if(info.tbt) {
            if(!info.lrl) points.push(genPoint(r0Left, r0Top));
            points.push(genPoint(r1Left, r1Top));
        } else {
            if(info.lrl) points.push(genPoint(r1Left, r1Top));
            points.push(genPoint(r0Left, r0Top));
        }

        // Top rights
        if(info.tbt) {
            points.push(genPoint(r1Right, r1Top));
            if(!info.rlr) points.push(genPoint(r0Right, r0Top));
        } else {
            points.push(genPoint(r0Right, r0Top));
            if(info.rlr) points.push(genPoint(r1Right, r1Top));
        }

        // Bottom rights
        if(info.bab) {
            if(!info.rlr) points.push(genPoint(r0Right, r0Bottom));
            points.push(genPoint(r1Right, r1Bottom));
        } else {
            if(info.rlr) points.push(genPoint(r1Right, r1Bottom));
            points.push(genPoint(r0Right, r0Bottom));
        }

        // Bottom Lefts
        if(info.bab) {
            points.push(genPoint(r1Left, r1Bottom));
            if(!info.lrl) points.push(genPoint(r0Left, r0Bottom));
        } else {
            points.push(genPoint(r0Left, r0Bottom));
            if(info.lrl) points.push(genPoint(r1Left, r1Bottom));
        }
        return points;
    };
});

// ******* Placeholder Manager ********* //

$axure.internal(function($ax) {
    var _placeholderManager = $ax.placeholderManager = {};
    var idToPlaceholderInfo = {};

    var _registerPlaceholder = function(elementId, text, password) {
        idToPlaceholderInfo[elementId] = { text: text, password: password, active: false };
    };
    _placeholderManager.registerPlaceholder = _registerPlaceholder;

    _placeholderManager.refreshPlaceholder = function (elementId) {
        var info = idToPlaceholderInfo[elementId];
        if (!info || !info.active) return;
        $ax.style.SetWidgetPlaceholder(elementId, true, info.text, info.password);
    }

    var _updatePlaceholder = function(elementId, active, clearText) {
        var inputId = $ax.repeater.applySuffixToElementId(elementId, '_input');

        var info = idToPlaceholderInfo[elementId];
        if(!info || info.active == active) return;
        info.active = active;

        if(active) var text = info.text;
        else if(!ANDROID) text = clearText ? '' : document.getElementById(inputId).value;
        else {
            var currentText = document.getElementById(inputId).value;
            if(!clearText) text = currentText;
            else if(currentText == info.text) text = "";
            else {
                var lastIndex = currentText.lastIndexOf(info.text);
                //here i am assuming the text is always inserted in front
                text = currentText.substring(0, lastIndex);
            }
        }

        $ax.style.SetWidgetPlaceholder(elementId, active, text, info.password);
    };
    _placeholderManager.updatePlaceholder = _updatePlaceholder;

    var _isActive = function(elementId) {
        var info = idToPlaceholderInfo[elementId];
        return Boolean(info && info.active);
    };
    _placeholderManager.isActive = _isActive;

    var _selectRange = function(elementId, start, end) {
        $jobj(elementId).each(function() {
            if(this.setSelectionRange) {
                var validTypes = ["text", "search", "url", "tel", "password"];
                if(this.tagName.toLowerCase() != "input" || validTypes.indexOf(this.type) > -1) {
                    this.focus();
                    this.setSelectionRange(start, end);
                }
            } else if(this.createTextRange) {
                var range = this.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', start);
                range.select();
            }
        });
    };
    _placeholderManager.selectRange = _selectRange;

    var _moveCaret = function(id, index) {
        var inputIndex = id.indexOf('_input');
        if(inputIndex == -1) return;
        var inputId = id.substring(0, inputIndex);

        if(!_isActive(inputId)) return;
        _selectRange(id, index, index);
    };
    _placeholderManager.moveCaret = _moveCaret;
});