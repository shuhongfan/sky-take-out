// ******* AxQuery Plugins ******** //

$axure.internal(function($ax) {
    $ax.constants = {};

    $ax.constants.TABLE_TYPE = 'table';
    $ax.constants.MENU_OBJECT_TYPE = 'menuObject';
    $ax.constants.MASTER_TYPE = 'master';
    $ax.constants.PAGE_TYPE = 'page';
    $ax.constants.REFERENCE_DIAGRAM_OBJECT_TYPE = 'referenceDiagramObject';
    $ax.constants.REPEATER_TYPE = 'repeater';
    $ax.constants.DYNAMIC_PANEL_TYPE = 'dynamicPanel';
    $ax.constants.LAYER_TYPE = 'layer';
    $ax.constants.TEXT_BOX_TYPE = 'textBox';
    $ax.constants.TEXT_AREA_TYPE = 'textArea';
    $ax.constants.LIST_BOX_TYPE = 'listBox';
    $ax.constants.COMBO_BOX_TYPE = 'comboBox';
    $ax.constants.CHECK_BOX_TYPE = 'checkbox';
    $ax.constants.RADIO_BUTTON_TYPE = 'radioButton';
    $ax.constants.BUTTON_TYPE = 'button'; //html button
    $ax.constants.IMAGE_MAP_REGION_TYPE = 'imageMapRegion';
    $ax.constants.IMAGE_BOX_TYPE = 'imageBox';
    $ax.constants.VECTOR_SHAPE_TYPE = 'vectorShape';
    $ax.constants.SNAPSHOT_TYPE = 'screenshot';
    $ax.constants.TREE_NODE_OBJECT_TYPE = 'treeNodeObject';
    $ax.constants.TABLE_CELL_TYPE = 'tableCell';
    $ax.constants.VERTICAL_LINE_TYPE = 'verticalLine';
    $ax.constants.HORIZONTAL_LINE_TYPE = 'horizontalLine';
    $ax.constants.INLINE_FRAME_TYPE = 'inlineFrame';
    $ax.constants.CONNECTOR_TYPE = 'connector';
    $ax.constants.ALL_TYPE = '*';

    $ax.constants.TEXT_TYPE = 'richTextPanel';
    $ax.constants.LINK_TYPE = 'hyperlink';

    // TODO: Need solid passo f this. Constants should be able to bemade local, may need some public lists or something.
    //       public.fn function should take not arg and use this. May need some $ax.IsType fuctions that will take a type arg and be static
    $ax.public.fn.IsTable = function (type) { return type == $ax.constants.TABLE_TYPE; }
    $ax.public.fn.IsMenuObject = function (type) { return type == $ax.constants.MENU_OBJECT_TYPE; }
    $ax.public.fn.IsMaster = function (type) { return type == $ax.constants.MASTER_TYPE; }
    $ax.public.fn.IsPage = function (type) { return type == $ax.constants.PAGE_TYPE; }
    $ax.public.fn.IsReferenceDiagramObject = function (type) { return type == $ax.constants.REFERENCE_DIAGRAM_OBJECT_TYPE; }
    $ax.public.fn.IsRepeater = function (type) { return type == $ax.constants.REPEATER_TYPE; }
    $ax.public.fn.IsDynamicPanel = $ax.IsDynamicPanel = function (type) { return type == $ax.constants.DYNAMIC_PANEL_TYPE; }
    $ax.public.fn.IsLayer = $ax.IsLayer = function (type) { return type == $ax.constants.LAYER_TYPE; }
    $ax.public.fn.IsTextBox = function (type) { return type == $ax.constants.TEXT_BOX_TYPE; }
    $ax.public.fn.IsTextArea = function (type) { return type == $ax.constants.TEXT_AREA_TYPE; }
    $ax.public.fn.IsListBox = function (type) { return type == $ax.constants.LIST_BOX_TYPE; }
    $ax.public.fn.IsComboBox = function (type) { return type == $ax.constants.COMBO_BOX_TYPE; }
    $ax.public.fn.IsCheckBox = function (type) { return type == $ax.constants.CHECK_BOX_TYPE; }
    $ax.public.fn.IsRadioButton = function (type) { return type == $ax.constants.RADIO_BUTTON_TYPE; }
    $ax.public.fn.IsButton = function (type) { return type == $ax.constants.BUTTON_TYPE; }
    $ax.public.fn.IsIamgeMapRegion = function (type) { return type == $ax.constants.IMAGE_MAP_REGION_TYPE; }
    $ax.public.fn.IsImageBox = function (type) { return type == $ax.constants.IMAGE_BOX_TYPE; }
    $ax.public.fn.IsVector = function (type) { return type == $ax.constants.VECTOR_SHAPE_TYPE; }
    $ax.public.fn.IsSnapshot = function (type) { return type == $ax.constants.SNAPSHOT_TYPE; }
    $ax.public.fn.IsTreeNodeObject = function (type) { return type == $ax.constants.TREE_NODE_OBJECT_TYPE; }
    $ax.public.fn.IsTableCell = function (type) { return type == $ax.constants.TABLE_CELL_TYPE; }
    $ax.public.fn.IsInlineFrame = function (type) { return type == $ax.constants.INLINE_FRAME_TYPE; }
    $ax.public.fn.IsConnector = function (type) { return type == $ax.constants.CONNECTOR_TYPE; }
    $ax.public.fn.IsContainer = function (type) { return type== $ax.constants.VECTOR_SHAPE_TYPE || type == $ax.constants.TABLE_TYPE || type == $ax.constants.MENU_OBJECT_TYPE || type == $ax.constants.TREE_NODE_OBJECT_TYPE; }

    var PLAIN_TEXT_TYPES = [$ax.constants.TEXT_BOX_TYPE, $ax.constants.TEXT_AREA_TYPE, $ax.constants.LIST_BOX_TYPE,
        $ax.constants.COMBO_BOX_TYPE, $ax.constants.CHECK_BOX_TYPE, $ax.constants.RADIO_BUTTON_TYPE, $ax.constants.BUTTON_TYPE];

    $ax.public.fn.IsResizable = function (type) { return $.inArray(type, RESIZABLE_TYPES) !== -1; }
    var RESIZABLE_TYPES = [
        $ax.constants.BUTTON_TYPE, $ax.constants.DYNAMIC_PANEL_TYPE, $ax.constants.IMAGE_BOX_TYPE, $ax.constants.IMAGE_MAP_REGION_TYPE,
        $ax.constants.INLINE_FRAME_TYPE, $ax.constants.LAYER_TYPE, $ax.constants.LIST_BOX_TYPE, $ax.constants.COMBO_BOX_TYPE,
        $ax.constants.VECTOR_SHAPE_TYPE, $ax.constants.TEXT_AREA_TYPE, $ax.constants.TEXT_BOX_TYPE, $ax.constants.SNAPSHOT_TYPE
    ];

    $ax.public.fn.SupportsRichText = function() {
        var obj = $obj(this.getElementIds()[0]);
        // Catch root tree nodes as they are not supported.
        if(obj.type == $ax.constants.TREE_NODE_OBJECT_TYPE) return obj.friendlyType == 'Tree Node';
        // Do the same for tree node icons maybe?

        return $.inArray(obj.type, SUPPORTS_RICH_TEXT_TYPES) != -1;
    }
    var SUPPORTS_RICH_TEXT_TYPES = [$ax.constants.CHECK_BOX_TYPE, $ax.constants.RADIO_BUTTON_TYPE,
        $ax.constants.IMAGE_BOX_TYPE, $ax.constants.VECTOR_SHAPE_TYPE, $ax.constants.TABLE_CELL_TYPE, $ax.constants.CONNECTOR_TYPE];

    var _addJQueryFunction = function(name) {
        $ax.public.fn[name] = function() {
            var val = $.fn[name].apply(this.jQuery(), arguments);
            return arguments[0] ? this : val;
        };
    };
    var _jQueryFunctionsToAdd = ['text', 'val', 'css'];
    for (var jqueryFunctionIndex = 0; jqueryFunctionIndex < _jQueryFunctionsToAdd.length; jqueryFunctionIndex++) _addJQueryFunction(_jQueryFunctionsToAdd[jqueryFunctionIndex]);


    //    var _addJQueryEventFunction = function(name) {
    //        $ax.public.fn[name] = function() {
    //            $.fn[name].apply(this.jQuery(), arguments);
    //            return this;
    //        };
    //    };

    //    var _addJQueryEventFunction = function(name) {
    //        $ax.public.fn[name] = (function(nn) {
    //            return function() {
    //                $.fn[nn].apply(this.jQuery(), arguments);
    //                return this;
    //            };
    //        })(name);
    //    };

    var _addJQueryEventFunction = function(name) {
        $ax.public.fn[name] = function() {
            //With Martin - No idea why this is necessary. We tried encapsulating the function thinking it was related to closure (above),
            //but that didn't fix the problem. If we don't add this Repeaters will give "Uncaught TypeError: Object #<Object> has no method 'apply'"
            //here (but Indeterminately, often on larger/slower Repeaters) because it is Undefined. However it seems the catch is never hit
            //if we surround the statement with the try/catch. Perhaps the try/catch block creates a scope or closure.
            try {
                $.fn[name].apply(this.jQuery(), arguments);
            } catch(e) {
                console.log("Couldn't find the event: " + name);
            }

            return this;
        };
    };
    var _jQueryEventFunctionsToAdd = ['click', 'mouseenter', 'mouseleave', 'bind'];
    for(var jqueryEventIndex = 0; jqueryEventIndex < _jQueryEventFunctionsToAdd.length; jqueryEventIndex++) _addJQueryEventFunction(_jQueryEventFunctionsToAdd[jqueryEventIndex]);


    $ax.public.fn.openLink = function(url, includeVariables) {
        this.jQuery().each(function() {
            if(!($(this).is('iframe'))) {
                return;
            }

            var objIframe = $(this).get(0);

            $ax.navigate({
                url: url,
                target: "frame",
                includeVariables: includeVariables,
                frame: objIframe
            });
        });

        return this;
    };

    $ax.public.fn.SetPanelState = function(stateNumber, options, showWhenSet) {

        var animateInInfo = _getAnimateInfo(options && options.animateIn, 500);
        var animateOutInfo = _getAnimateInfo(options && options.animateOut, 500);

        var elementIds = this.getElementIds();

        for(var index = 0; index < elementIds.length; index++) {
            var elementId = elementIds[index];
            if ($ax.public.fn.IsDynamicPanel($ax.getTypeFromElementId(elementId))) {
                var stateName = $ax.visibility.GetPanelStateId(elementId, Number(stateNumber) - 1);
                var wasVisible = $ax.visibility.IsIdVisible(elementId);
                // If compressing because you are fit to content and the change of state may change size, must be before the change.
                if(options.compress && $ax.dynamicPanelManager.isIdFitToContent(elementId) && wasVisible) {
                    $ax.dynamicPanelManager.compressDelta(elementId, $ax.visibility.GetPanelState(elementId), stateName, options.vertical, options.compressEasing, options.compressDuration);
                }
                $ax.visibility.SetPanelState(elementId, stateName, animateOutInfo.easingType, animateOutInfo.direction, animateOutInfo.duration,
                    animateInInfo.easingType, animateInInfo.direction, animateInInfo.duration, showWhenSet);
                // If compressing because of a show, must be after state is set.
                if(options.compress && !wasVisible && showWhenSet) {
                    $ax.dynamicPanelManager.compressToggle(elementId, options.vertical, true, options.compressEasing, options.compressDuration);
                }
            }
        }

        return this;
    };

    $ax.public.fn.show = function(options, eventInfo) {
        var elementIds = this.getElementIds();

        for(var index = 0; index < elementIds.length; index++) {
            var elementId = elementIds[index];

            var lightboxId = $ax.repeater.applySuffixToElementId(elementId, '_lightbox');
            var lightbox = $jobj(lightboxId);
            if(options && options.showType == 'lightbox') {
                $ax.flyoutManager.unregisterPanel(elementId, true);
                // Add lightbox if there isn't one
                if(lightbox.length == 0) {
                    lightbox = $('<div></div>');
                    lightbox.attr('id', lightboxId);
                    var color = 'rgb(' + options.lightbox.r + ',' + options.lightbox.g + ',' + options.lightbox.b + ')';
                    lightbox.css({
                        position: 'fixed',
                        left: '0px',
                        top: '0px',
                        width: '10000px',
                        height: '10000px',
                        'background-color': color,
                        opacity: options.lightbox.a / 255
                    });

                    var parents = $ax('#' + elementId).getParents(true, ['dynamicPanel'])[0];
                    var fixedParentPanelId = undefined;
                    for(var j = 0; j < parents.length; j++) {
                        var parentId = parents[j];
                        if($jobj(parentId).css('z-index') != 'auto' || $ax.features.supports.mobile) {
                            fixedParentPanelId = parents[j];
                            break;
                        }
                    }

                    if(!fixedParentPanelId) $('#base').append(lightbox);
                    else $jobj(fixedParentPanelId).append(lightbox);

                    var wasVisible = $ax.visibility.IsIdVisible(elementId);

                    (function(lightbox, query) {
                        $ax.event.attachClick(lightbox, function() {
                            $ax.action.addAnimation(elementId, $ax.action.queueTypes.fade, function() {
                                if(!wasVisible) query.hide();
                                else $ax.action.fireAnimationFromQueue(elementId, $ax.action.queueTypes.fade);
                                lightbox.remove();
                            });
                        });
                    })(lightbox, this);
                }
                $ax.legacy.BringToFront(lightboxId, true);
                $ax.legacy.BringToFront(elementId, true);
            } else if(options && options.showType == 'flyout') {
                // Remove lightbox if there is one
                lightbox.remove();

                var src = eventInfo.thiswidget;
                var target = $ax.getWidgetInfo(elementId);
                var rects = {};
                if(src.valid) rects.src = $ax.geometry.genRect(src, true);
                if(target.valid) rects.target = $ax.geometry.genRect(target, true);
                $ax.flyoutManager.registerFlyout(rects, elementId, eventInfo.srcElement);
                //$ax.style.AddRolloverOverride(elementId);
                $ax.legacy.BringToFront(elementId);
            } else {
                // Remove lightbox, unregister flyout
                lightbox.remove();
                $ax.flyoutManager.unregisterPanel(elementId, true);
            }
            _setVisibility(elementId, true, options);
        }

        return this;
    };

    var _getAnimateInfo = function (options, defaultDuration, useHide) {
        var durationOption, easingOption, animationOption;

        if(options) {
            if (useHide) {
                durationOption = options.durationHide;
                easingOption = options.easingHide;
                animationOption = options.animationHide;
            } else {
                durationOption = options.duration;
                easingOption = options.easing;
                animationOption = options.animation;
            }
            if (animationOption == 'none') animationOption = 'swing';
        } else {
            durationOption = defaultDuration;
            easingOption = 'none',
            animationOption = 'swing';
        }
        var animateInfo = { duration: durationOption };
        switch (easingOption) {
        case 'fade':
            animateInfo.easingType = 'fade';
            animateInfo.direction = '';
            break;
        case 'slideLeft':
            animateInfo.easingType = animationOption;
            animateInfo.direction = 'left';
            break;
        case 'slideRight':
            animateInfo.easingType = animationOption;
            animateInfo.direction = 'right';
            break;
        case 'slideUp':
            animateInfo.easingType = animationOption;
            animateInfo.direction = 'up';
            break;
        case 'slideDown':
            animateInfo.easingType = animationOption;
            animateInfo.direction = 'down';
            break;
        case 'flipLeft':
            animateInfo.easingType = 'flip';
            animateInfo.direction = 'left';
            break;
        case 'flipRight':
            animateInfo.easingType = 'flip';
            animateInfo.direction = 'right';
            break;
        case 'flipUp':
            animateInfo.easingType = 'flip';
            animateInfo.direction = 'up';
            break;
        case 'flipDown':
            animateInfo.easingType = 'flip';
            animateInfo.direction = 'down';
            break;
        default:
            animateInfo.easingType = 'none';
            animateInfo.direction = '';
        }

        return animateInfo;
    };

    $ax.public.fn.hide = function(options) {
        var elementIds = this.getElementIds();

        for(var index = 0; index < elementIds.length; index++) {
            var elementId = elementIds[index];
//            var wasShown = $ax.visibility.IsIdVisible(elementId);
            _setVisibility(elementId, false, options, true);
        }

        return this;
    };

    $ax.public.fn.toggleVisibility = function(options) {
        var elementIds = this.getElementIds();

        for (var index = 0; index < elementIds.length; index++) {
            var elementId = elementIds[index];
            var show = !$ax.visibility.IsIdVisible(elementId);
            _setVisibility(elementId, show, options, !show);
        }

        return this;
    };

    var _setVisibility = function (elementId, value, options, useHide) {
        var animateInfo = _getAnimateInfo(options, 0, useHide);

        var wasShown = $ax.visibility.IsIdVisible(elementId);
        var compress = options && options.showType == 'compress' && wasShown != value;
        if (compress) $ax.dynamicPanelManager.compressToggle(elementId, options.vertical, value, options.compressEasing, options.compressDuration);

        var onComplete = function () {
            $ax.dynamicPanelManager.fitParentPanel(elementId);
        };
        $ax.visibility.SetWidgetVisibility(elementId, {
            value: value,
            easing: animateInfo.easingType,
            direction: animateInfo.direction,
            duration: animateInfo.duration,
            animation: animateInfo.animation,
            fire: true,
            onComplete: onComplete
        });
        
        if(options && options.bringToFront) $ax.legacy.BringToFront(elementId);
    };

    $ax.public.fn.setOpacity = function(opacity, easing, duration) {
        if(!easing || ! duration) {
            easing = 'none';
            duration = 0;
        }

        var elementIds = this.getElementIds();

        for(var index = 0; index < elementIds.length; index++) {
            var elementId = elementIds[index];
            var onComplete = function() {
                $ax.action.fireAnimationFromQueue(elementId, $ax.action.queueTypes.fade);
            };

            var query = $jobj(elementId);
            if(duration == 0 || easing == 'none') {
                query.css('opacity', opacity);
                onComplete();
            } else query.animate({ opacity: opacity }, { duration: duration, easing: easing, queue: false, complete: onComplete });
        }
    }
    //move one widget.  I didn't combine moveto and moveby, since this is in .public, and separate them maybe more clear for the user
    var _move = function (elementId, x, y, options, moveTo) {
        if(!options.easing) options.easing = 'none';
        if(!options.duration) options.duration = 500;
        var obj = $obj(elementId);

        // Layer move using container now.
        if($ax.public.fn.IsLayer(obj.type)) {
            $ax.move.MoveWidget(elementId, x, y, options, moveTo,
                function () {
                    if(options.onComplete) options.onComplete();
                    $ax.dynamicPanelManager.fitParentPanel(elementId);
                }, false);
        } else {
            var xDelta = x;
            var yDelta = y;
            if (moveTo) {
                var jobj = $jobj(elementId);
                var left = $ax.getNumFromPx(jobj.css('left'));
                var top = $ax.getNumFromPx(jobj.css('top'));
                xDelta = x - left;
                yDelta = y - top;
            }
            $ax.move.MoveWidget(elementId, xDelta, yDelta, options, false,
                function () { $ax.dynamicPanelManager.fitParentPanel(elementId); }, true);
        }
    };

    $ax.public.fn.moveTo = function (x, y, options) {
        var elementIds = this.getElementIds();
        for(var index = 0; index < elementIds.length; index++) {
            _move(elementIds[index], x, y, options, true);
        }

        return this;
    };

    $ax.public.fn.moveBy = function (x, y, options) {
        var elementIds = this.getElementIds();

        if(x == 0 && y == 0) {
            for(var i = 0; i < elementIds.length; i++) {
                var elementId = elementIds[i];
                $ax.move.nopMove(elementId, options);

                //$ax.event.raiseSyntheticEvent(elementId, "onMove");
                $ax.action.fireAnimationFromQueue(elementId, $ax.action.queueTypes.move);

                //if($axure.fn.IsLayer($obj(elementId).type)) {
                //    var childrenIds = $ax.public.fn.getLayerChildrenDeep(elementId, true);
                //    for(var j = 0; j < childrenIds.length; j++) $ax.event.raiseSyntheticEvent(childrenIds[j], 'onMove');
                //}
            }
            return this;
        }

        for(var index = 0; index < elementIds.length; index++) {
            _move(elementIds[index], x, y, options, false);
        }
        return this;
    };

    $ax.public.fn.circularMoveAndRotate = function(degreeChange, options, centerPointLeft, centerPointTop, doRotation, moveDelta, resizeOffset, rotatableMove, moveComplete) {
        if(!rotatableMove) rotatableMove = { x: 0, y: 0 };
        var elementIds = this.getElementIds();

        for(var index = 0; index < elementIds.length; index++) {
            var elementId = elementIds[index];

            var onComplete = function () {
                $ax.dynamicPanelManager.fitParentPanel(elementId);
                if (moveComplete) moveComplete();
            }

            $ax.move.circularMove(elementId, degreeChange, { x: centerPointLeft, y: centerPointTop }, moveDelta, rotatableMove, resizeOffset, options, true, onComplete, doRotation);
            if(doRotation) $ax.move.rotate(elementId, degreeChange, options.easing, options.duration, false, true, function () { $ax.dynamicPanelManager.fitParentPanel(elementId); });
            else $ax.action.fireAnimationFromQueue(elementId, $ax.action.queueTypes.rotate);
        }
    };

    $ax.public.fn.rotate = function (degree, easing, duration, to, axShouldFire) {
        var elementIds = this.getElementIds();
        // this function will no longer handle compound vectors.

        for(var index = 0; index < elementIds.length; index++) {
            var elementId = elementIds[index];
            degree = parseFloat(degree);
            $ax.move.rotate(elementId, degree, easing, duration, to, axShouldFire, function () { $ax.dynamicPanelManager.fitParentPanel(elementId); });
        }
    };

    $ax.public.fn.resize = function(newLocationAndSizeCss, resizeInfo, axShouldFire, moves, onCompletedFunc) {
        var elementIds = this.getElementIds();
        if(!elementIds) return;

        var completeAndFire = function(moved, id) {
            if(axShouldFire) {
                $ax.action.fireAnimationFromQueue(id, $ax.action.queueTypes.resize);
                if(moves) $ax.action.fireAnimationFromQueue(id, $ax.action.queueTypes.move);
            }

            if(onCompletedFunc) onCompletedFunc();
        };

        for(var index = 0; index < elementIds.length; index++) {
            var elementId = elementIds[index];

            var obj = $obj(elementId);
            if(!$ax.public.fn.IsResizable(obj.type)) {
                //$ax.dynamicPanelManager.fitParentPanel(elementId);
                completeAndFire(moves, elementId);
                continue;
            }

            var oldSize = $ax('#' + elementId).size();
            var oldWidth = oldSize.width;
            var oldHeight = oldSize.height;
            var query = $jobj(elementId);

            var isDynamicPanel = $ax.public.fn.IsDynamicPanel(obj.type);
            if(isDynamicPanel) {
                // No longer fitToContent, calculate additional styling that needs to be done.
                $ax.dynamicPanelManager.setFitToContentCss(elementId, false, oldWidth, oldHeight);

                if (query.css('position') == 'fixed' && ((obj.fixedHorizontal && obj.fixedHorizontal == 'center') || (obj.fixedVertical && obj.fixedVertical == 'middle'))) {
                    moves = true;
                    var loc = $ax.dynamicPanelManager.getFixedPosition(elementId, oldWidth, oldHeight, newLocationAndSizeCss.width, newLocationAndSizeCss.height);
                    if(loc) {
                        if (loc[0] != 0 && !$ax.dynamicPanelManager.isPercentWidthPanel(obj)) newLocationAndSizeCss['margin-left'] = '+=' + (Number(newLocationAndSizeCss['margin-left'].substr(2)) + loc[0]);
                        if (loc[1] != 0) newLocationAndSizeCss['margin-top'] = '+=' + (Number(newLocationAndSizeCss['margin-top'].substr(2)) + loc[1]);
                    }
                }

                var onComplete = function() {
                    $ax.flyoutManager.updateFlyout(elementId);
                    $ax.dynamicPanelManager.fitParentPanel(elementId);
                    $ax.dynamicPanelManager.updatePanelPercentWidth(elementId);
                    $ax.dynamicPanelManager.updatePanelContentPercentWidth(elementId);

                    completeAndFire(moves, elementId);
                    $ax.event.raiseSyntheticEvent(elementId, 'onResize');
                };

            } else {
                ////if contains text
                //var textChildren = query.children('div.text');
                //if(textChildren && textChildren.length != 0) {
                //    var textDivId = textChildren.attr('id');
                //    var padding = $ax.style.getPadding(textDivId);
                //    var leftPadding = padding.paddingLeft;
                //    var rightPadding = padding.paddingRight;
                //    //var textObj = $ax('#' + textDivId);
                //    //var leftPadding = textObj.left(true);
                //    //var rightPadding = oldWidth - leftPadding - textObj.width();

                //    //greater or equal to 1px
                //    var newTextWidth = Math.max(newLocationAndSizeCss.width - leftPadding - rightPadding, 1);
                //    var textChildCss = { width: newTextWidth };

                //    var textStepFunction = function() {
                //        //change the width of the text div may effect the height
                //        //var currentTextHeight = Number($(textChildren.children('p')[0]).css('height').replace('px', ''));
                //        //textChildren.css('height', currentTextHeight);
                //        //var display = $ax.public.fn.displayHackStart(document.getElementById(textDivId));

                //        var trap = _displayWidget(textDivId);
                //        $ax.style.setTextAlignment([textDivId]);
                //        trap();

                //        //$ax.public.fn.displayHackEnd(display);
                //    };
                //}

                //get all the other children that matters
                onComplete = function() {
                    $ax.dynamicPanelManager.fitParentPanel(elementId);
                    completeAndFire(moves, elementId);

                    $ax.annotation.adjustIconLocation(elementId);
                    $ax.event.raiseSyntheticEvent(elementId, 'onResize');
                };
            }

            var children = query.children().not('div.text');
            while(children && children.length && $(children[0]).attr('id').indexOf('container') != -1) {
                children = children.children().not('div.text');
            }

            if(children && children.length !== 0) {
                var childAnimationArray = [];
                var isConnector = $ax.public.fn.IsConnector(obj.type);
                children.each(function (i, child) {
                    var childCss = {
                        width: newLocationAndSizeCss.width,
                        height: newLocationAndSizeCss.height
                    };

                    //$ax.size() use outerWidth/Height(false), which include padding and borders(no margins)
                    var childSizingObj = $ax('#' + child.id).size();
                    var differentSizedImage = childSizingObj.width - oldWidth != 0 || childSizingObj.height - oldHeight != 0;
                    if ((differentSizedImage || isConnector) && child.tagName == 'IMG') {
                        //oldwidth is zero for connectors
                        var widthOffset = oldWidth ? (childSizingObj.width - oldWidth) * newLocationAndSizeCss.width / oldWidth : childSizingObj.width;
                        var heightOffset = oldHeight ? (childSizingObj.height - oldHeight) * newLocationAndSizeCss.height / oldHeight : childSizingObj.height;

                        childCss.width += widthOffset;
                        childCss.height += heightOffset;
                    }
                    //there are elements like inputs, come with a padding and border, so need to use outerwidth for starting point, due to jquery 1.7 css() on width/height bugs
                    if($(child).css('position') === 'absolute') {
                        if(child.offsetLeft) {
                            childSizingObj.left = child.offsetLeft;
                            childCss.left = oldWidth ? child.offsetLeft * newLocationAndSizeCss.width / oldWidth : child.offsetLeft; //- transformedShift.x;
                        }
                        if(child.offsetTop) {
                            childSizingObj.top = child.offsetTop;
                            childCss.top = oldHeight ? child.offsetTop * newLocationAndSizeCss.height / oldHeight : child.offsetTop; //- transformedShift.y;
                        }
                    }
                    childAnimationArray.push({ obj: child, sizingObj: childSizingObj, sizingCss: childCss });
                });
            }
            
            if (newLocationAndSizeCss.left || newLocationAndSizeCss.top) {
                //var movedLeft = newLocationAndSizeCss.left;
                //var movedTop = newLocationAndSizeCss.top;
                //$ax.visibility.setMovedLocation(elementId, movedLeft, movedTop);
                var movedLeft = newLocationAndSizeCss.deltaX;
                var movedTop = newLocationAndSizeCss.deltaY;
                $ax.visibility.moveMovedLocation(elementId, movedLeft, movedTop);
            }
            if (newLocationAndSizeCss.width || newLocationAndSizeCss.height) {
                var resizedWidth = newLocationAndSizeCss.width;
                var resizedHeight = newLocationAndSizeCss.height;
                $ax.visibility.setResizedSize(elementId, resizedWidth, resizedHeight);
            }

            if (!resizeInfo.easing || resizeInfo.easing == 'none') {
                query.animate(newLocationAndSizeCss, 0);

                if (childAnimationArray) {
                    $(childAnimationArray).each(function (i, animationObj) {
                        if(animationObj.resizeMatrixFunction) {
                            $(animationObj.obj).css($ax.public.fn.setTransformHowever(animationObj.resizeMatrixFunction(animationObj.width, animationObj.height)));
                        } else {
                            //var sizingCss = animationObj.sizingCss;
                            //if (sizingCss.left || sizingCss.top) {
                            //    var movedLeft = sizingCss.left;
                            //    var movedTop = sizingCss.top;
                            //    $ax.visibility.setMovedLocation(animationObj.obj.id, movedLeft, movedTop);
                            //}
                            //if (sizingCss.width || sizingCss.height) {
                            //    var resizedWidth = sizingCss.width;
                            //    var resizedHeight = sizingCss.height;
                            //    $ax.visibility.setResizedSize(animationObj.obj.id, resizedWidth, resizedHeight);
                            //}

                            $(animationObj.obj).animate(animationObj.sizingCss, 0);
                        }
                    });
                }
                //if(childCss) children.animate(childCss, 0);
                //if(sketchyImage && sketchyImageCss) $(sketchyImage).animate(sketchyImageCss, 0);
                //if(textChildCss) {
                //    textChildren.animate(textChildCss, {
                //        duration: 0,
                //        step: textStepFunction
                //    });
                //}
                onComplete();
            } else {
                if(childAnimationArray) {
                    $(childAnimationArray).each(function (i, animationObj) {
                        if(animationObj.resizeMatrixFunction) {
                            $(animationObj.sizingObj).animate(animationObj.sizingCss, {
                                queue: false,
                                duration: resizeInfo.duration,
                                easing: resizeInfo.easing,
                                step: function (now) {
                                    var widthRatio = (animationObj.width - 1.0) * now + 1.0;
                                    var heightRatio = (animationObj.height - 1.0) * now + 1.0;
                                    $(animationObj.obj).css($ax.public.fn.setTransformHowever(animationObj.resizeMatrixFunction(widthRatio, heightRatio)));
                                }
                            });
                        } else {
                            $(animationObj.sizingObj).animate(animationObj.sizingCss, {
                                queue: false,
                                duration: resizeInfo.duration,
                                easing: resizeInfo.easing,
                                step: function (now, tween) {
                                    $(animationObj.obj).css(tween.prop, now);
                                }
                            });
                        }
                    });
                }

                //if(textChildCss) {
                //    textChildren.animate(textChildCss, {
                //        queue: false,
                //        duration: resizeInfo.duration,
                //        easing: resizeInfo.easing,
                //        step: textStepFunction
                //    });
                //}

                if(isDynamicPanel) {
                    query.animate(newLocationAndSizeCss, { queue: false, duration: resizeInfo.duration, easing: resizeInfo.easing, complete: onComplete });
                } else {
                    var locObj = {
                        left: $ax.public.fn.GetFieldFromStyle(query, 'left'), top: $ax.public.fn.GetFieldFromStyle(query, 'top'),
                        width: $ax.public.fn.GetFieldFromStyle(query, 'width'), height: $ax.public.fn.GetFieldFromStyle(query, 'height'),
                    };
                    $(locObj).animate(newLocationAndSizeCss, {
                        queue: false,
                        duration: resizeInfo.duration,
                        easing: resizeInfo.easing,
                        step: function (now, tween) {
                            query.css(tween.prop, now);
                        },
                        complete: onComplete
                    });
                }
            }
        }
    };

    $ax.public.fn.bringToFront = function() {
        var elementIds = this.getElementIds();
        for(var index = 0; index < elementIds.length; index++) { $ax.legacy.BringToFront(elementIds[index]); }
        return this;
    };

    $ax.public.fn.sendToBack = function() {
        var elementIds = this.getElementIds();
        for(var index = 0; index < elementIds.length; index++) { $ax.legacy.SendToBack(elementIds[index]); }
        return this;
    };

    $ax.public.fn.text = function() {
        if(arguments[0] == undefined) {
            var firstId = this.getElementIds()[0];

            if(!firstId) { return undefined; }

            return getWidgetText(firstId);
        } else {
            var elementIds = this.getElementIds();

            for(var index = 0; index < elementIds.length; index++) {
                var currentItem = elementIds[index];

                var widgetType = $ax.getTypeFromElementId(currentItem);

                if($ax.public.fn.IsTextBox(widgetType) || $ax.public.fn.IsTextArea(widgetType)) { //For non rtf
                    SetWidgetFormText(currentItem, arguments[0]);
                } else {
                    var idRtf = '#' + currentItem;
                    if($(idRtf).length == 0) idRtf = '#u' + (Number(currentItem.substring(1)) + 1);

                    if($(idRtf).length != 0) {
                        //If the richtext div already has some text in it,
                        //preserve only the first style and get rid of the rest
                        //If no pre-existing p-span tags, don't do anything
                        if($(idRtf).find('p').find('span').length > 0) {
                            $(idRtf).find('p:not(:first)').remove();
                            $(idRtf).find('p').find('span:not(:first)').remove();

                            //Replace new-lines with NEWLINE token, then html encode the string,
                            //finally replace NEWLINE token with linebreak
                            var textWithLineBreaks = arguments[0].replace(/\n/g, '--NEWLINE--');
                            var textHtml = $('<div/>').text(textWithLineBreaks).html();
                            $(idRtf).find('span').html(textHtml.replace(/--NEWLINE--/g, '<br>'));
                        }
                    }
                }
            }

            return this;
        }
    };

    var getWidgetText = function(id) {
        var idQuery = $jobj(id);
        var inputQuery = $jobj($ax.INPUT(id));
        if(inputQuery.length) idQuery = inputQuery;

        if (idQuery.is('input') && ($ax.public.fn.IsCheckBox(idQuery.attr('type')) || idQuery.attr('type') == 'radio')) {
            idQuery = idQuery.parent().find('label').find('div');
        }

        if(idQuery.is('div')) {
            var $rtfObj = idQuery.hasClass('text') ? idQuery : idQuery.find('.text');
            if($rtfObj.length == 0) return '';

            var textOut = '';
            $rtfObj.children('p,ul,ol').each(function(index) {
                if(index != 0) textOut += '\n';

                //var htmlContent = $(this).html();
                //if(isSoloBr(htmlContent)) return; // It has a solo br, then it was just put in for a newline, and paragraph already added the new line.
                if (isSoloBr($(this).children())) return;

                var htmlContent = $(this).html();            
                //Replace line breaks (set in SetWidgetRichText) with newlines and nbsp's with regular spaces.
                htmlContent = htmlContent.replace(/<br[^>]*>/ig, '\n').replace(/&nbsp;/ig, ' ');
                textOut += $(htmlContent).text();
                //textOut += htmlContent.replace(/<[^>]*>/g, '');
            });

            return textOut;
        } else {
            var val = idQuery.val();
            return val == undefined ? '' : val;
        }
    };

    var isSoloBr = function($html) {
        //html = $(html);
        // Html needs one and only one span
        var spanChildren = $html.length == 1 && $html.is('span') ? $html.children() : false;
        // Span children needs exactly one br and no text in the span
        return spanChildren && spanChildren.length == 1 && spanChildren.is('br') && spanChildren.text().trim() == '';
    };

    $ax.public.fn.setRichTextHtml = function() {
        if(arguments[0] == undefined) {
            //No getter function, so just return undefined
            return undefined;
        } else {
            var elementIds = this.getElementIds();

            for(var index = 0; index < elementIds.length; index++) {
                var currentItem = elementIds[index];

                var widgetType = $ax.getTypeFromElementId(currentItem);
                if ($ax.public.fn.IsTextBox(widgetType) || $ax.public.fn.IsTextArea(widgetType)) { //Do nothing for non rtf
                    continue;
                } else {
                    //TODO -- [mas] fix this!
                    var idRtf = '#' + currentItem;
                    if($(idRtf).length == 0) idRtf = '#u' + (parseInt(currentItem.substring(1)) + 1);
                    if($(idRtf).length != 0) SetWidgetRichText(idRtf, arguments[0]);
                }
            }

            return this;
        }
    };

    $ax.public.fn.value = function() {
        if(arguments[0] == undefined) {
            var firstId = this.getElementIds()[0];

            if(!firstId) {
                return undefined;
            }

            var widgetType = $ax.getTypeFromElementId(firstId);

            if ($ax.public.fn.IsComboBox(widgetType) || $ax.public.fn.IsListBox(widgetType)) { //for select lists and drop lists
                return $('#' + firstId + ' :selected').text();
            } else if ($ax.public.fn.IsCheckBox(widgetType) || $ax.public.fn.IsRadioButton(widgetType)) { //for radio/checkboxes
                return $('#' + firstId + '_input').is(':selected');
            } else if ($ax.public.fn.IsTextBox(widgetType)) { //for text box
                return $('#' + firstId + '_input').val();
            } else { //for text based form elements
                return this.jQuery().first().val();
            }
        } else {
            var elementIds = this.getElementIds();

            for(var index = 0; index < elementIds.length; index++) {
                var widgetType = $ax.getTypeFromElementId(elementIds[index]);

                var elementIdQuery = $('#' + elementIds[index]);

                if ($ax.public.fn.IsCheckBox(widgetType) || $ax.public.fn.IsRadioButton(widgetType)) { //for radio/checkboxes
                    if(arguments[0] == true) {
                        elementIdQuery.prop('selected', true);
                    } else if(arguments[0] == false) {
                        elementIdQuery.prop('selected', false);
                    }
                } else { //For select lists, drop lists, text based form elements
                    elementIdQuery.val(arguments[0]);
                }
            }

            return this;
        }
    };

    $ax.public.fn.checked = function() {
        if(arguments[0] == undefined) {
            return this.selected();
        } else {
            this.selected(arguments[0]);
            return this;
        }
    };

    //var _getRelativeLeft = function (id, parent) {
    //    var currentNode = window.document.getElementById(id).offsetParent;
    //    var left = $ax('#' + id).left(true);
    //    while (currentNode != null && currentNode.tagName != "BODY" && currentNode != parent) {
    //        left += currentNode.offsetLeft;
    //        currentNode = currentNode.offsetParent;
    //    }
    //    return left;
    //};

    //var _getRelativeTop = function(id, parent) {
    //    var currentNode = window.document.getElementById(id).offsetParent;
    //    var top = $ax('#' + id).top(true);
    //    while(currentNode != null && currentNode.tagName != "BODY" && currentNode != parent) {
    //        top += currentNode.offsetTop;
    //        currentNode = currentNode.offsetParent;
    //    }
    //    return top;
    //};

    var _scrollHelper = function(id, scrollX, scrollY, easing, duration) {
        var target = window.document.getElementById(id);
        var scrollable = $ax.legacy.GetScrollable(target);
        var $scrollable = $(scrollable);

        var viewportLocation;
        if ($scrollable.is('body')) viewportLocation = $ax('#' + id).viewportLocation();
        else viewportLocation = $ax('#' + id).pageBoundingRect(true, $scrollable.attr('id')).location;

        var targetLeft = viewportLocation.left;
        var targetTop = viewportLocation.top;
        //var targetLeft = _getRelativeLeft(id, scrollable);
        //var targetTop = _getRelativeTop(id, scrollable);
        if(!scrollX) targetLeft = scrollable.scrollLeft;
        if(!scrollY) targetTop = scrollable.scrollTop;
        
        if($scrollable.is('body')) {
            $scrollable = $('html,body');
        }
        if(easing == 'none') {
            if(scrollY) $scrollable.scrollTop(targetTop);
            if(scrollX) $scrollable.scrollLeft(targetLeft);
        } else {
            if(!scrollX) {
                $scrollable.animate({ scrollTop: targetTop }, duration, easing);
            } else if(!scrollY) {
                $scrollable.animate({ scrollLeft: targetLeft }, duration, easing);
            } else {
                $scrollable.animate({ scrollTop: targetTop, scrollLeft: targetLeft }, duration, easing);
            }
        }
    };

    $ax.public.fn.scroll = function(scrollOption) {
        var easing = 'none';
        var duration = 500;

        if(scrollOption && scrollOption.easing) {
            easing = scrollOption.easing;

            if(scrollOption.duration) {
                duration = scrollOption.duration;
            }
        }

        var scrollX = true;
        var scrollY = true;

        // TODO: check this without vertical option -- might scroll outside of device frame
        if(scrollOption.direction == 'vertical') {
            scrollX = false;
        } else if(scrollOption.direction == 'horizontal') {
            scrollY = false;
        }

        var elementIds = this.getElementIds();
        for(var index = 0; index < elementIds.length; index++) {
            //            if($ax.getTypeFromElementId(elementIds[index]) == IMAGE_MAP_REGION_TYPE) {
            _scrollHelper(elementIds[index], scrollX, scrollY, easing, duration);
            //            }
        }

        return this;
    };

    $ax.public.fn.enabled = function() {
        if(arguments[0] == undefined) {
            var firstId = this.getElementIds()[0];
            if(!firstId) return undefined;

            var widgetType = $ax.getTypeFromElementId(firstId);
            if ($ax.public.fn.IsImageBox(widgetType) || $ax.public.fn.IsVector(widgetType)
                || $ax.public.fn.IsLayer(widgetType)) return !$ax.style.IsWidgetDisabled(firstId);
            else return this.jQuery().children(':disabled').length <= 0;
        } else {
            var elementIds = this.getElementIds();

            for(var index = 0; index < elementIds.length; index++) {
                var elementId = elementIds[index];
                var widgetType = $ax.getTypeFromElementId(elementId);

                var enabled = arguments[0];
                if ($ax.public.fn.IsImageBox(widgetType) || $ax.public.fn.IsVector(widgetType)
                    || $ax.public.fn.IsTextBox(widgetType) || $ax.public.fn.IsTextArea(widgetType)
                    || $ax.public.fn.IsComboBox(widgetType) || $ax.public.fn.IsListBox(widgetType)
                    || $ax.public.fn.IsCheckBox(widgetType) || $ax.public.fn.IsRadioButton(widgetType)
                ) $ax.style.SetWidgetEnabled(elementId, enabled);

                if ($ax.public.fn.IsDynamicPanel(widgetType) || $ax.public.fn.IsLayer(widgetType)) {
                    $ax.style.SetWidgetEnabled(elementId, enabled);
                    var children = this.getChildren(false, true)[index].children;
                    for(var i = 0; i < children.length; i++) {
                        $axure('#' + children[i]).enabled(enabled);
                    }
                }
                var obj = $obj(elementId);
                var images = obj.images;
                if(PLAIN_TEXT_TYPES.indexOf(widgetType) != -1 && images) {
                    var img = $jobj($ax.repeater.applySuffixToElementId(elementId, '_image_sketch'));
                    var key = (enabled ? 'normal~' : 'disabled~') + ($ax.adaptive.currentViewId || '');
                    img.attr('src', images[key]);

                }
                var jobj = $jobj(elementId);
                var input = $jobj($ax.INPUT(elementId));
                if(input.length) jobj = input;

                //if (OS_MAC && WEBKIT && $ax.public.fn.IsComboBox(widgetType)) jobj.css('color', enabled ? '' : 'grayText');

                if(enabled) jobj.prop('disabled', false);
                else jobj.prop('disabled', true);
            }

            return this;
        }
    };

    $ax.public.fn.visible = function() {
        var ids = this.getElementIds();
        for(var index = 0; index < ids.length; index++) $ax.visibility.SetIdVisible(ids[index], arguments[0]);
        return this;
    };

    $ax.public.fn.selected = function() {
        if(arguments[0] == undefined) {
            var firstId = this.getElementIds()[0];
            if(!firstId) return undefined;

            var widgetType = $ax.getTypeFromElementId(firstId);
            if ($ax.public.fn.IsTreeNodeObject(widgetType)) {
                var treeNodeButtonShapeId = '';
                var allElementIds = $ax.getAllElementIds();
                for(var i = 0; i < allElementIds.length; i++) {
                    var elementId = allElementIds[i];
                    var currObj = $ax.getObjectFromElementId(elementId);

                    if ($ax.public.fn.IsVector(currObj.type) && currObj.parent && currObj.parent.scriptIds && currObj.parent.scriptIds[0] == firstId) {
                        treeNodeButtonShapeId = elementId;
                        break;
                    }
                }

                if(treeNodeButtonShapeId == '') return undefined;
                return $ax.style.IsWidgetSelected(treeNodeButtonShapeId);
            } else if ($ax.public.fn.IsImageBox(widgetType) || $ax.public.fn.IsVector(widgetType) || $ax.public.fn.IsTableCell(widgetType) || $ax.public.fn.IsDynamicPanel(widgetType) || $ax.public.fn.IsLayer(widgetType)) {
                return $ax.style.IsWidgetSelected(firstId);
            } else if ($ax.public.fn.IsCheckBox(widgetType) || $ax.public.fn.IsRadioButton(widgetType)) {
                return $jobj($ax.INPUT(firstId)).prop('checked');
            }
            return this;
        }
        var elementIds = this.getElementIds();
        var func = typeof (arguments[0]) === 'function' ? arguments[0] : null;
        var enabled = arguments[0]; // If this is a function it will be overridden with the return value;

        for(var index = 0; index < elementIds.length; index++) {
            var elementId = elementIds[index];
            if(func) {
                enabled = func($axure('#' + elementId));
            }

            var widgetType = $ax.getTypeFromElementId(elementId);

            if ($ax.public.fn.IsTreeNodeObject(widgetType)) { //for tree node
                var treeRootId = $('#' + elementIds[index]).parents('.treeroot').attr('id');

                var treeNodeButtonShapeId = '';
                var childElementIds = $jobj(elementId).children();
                for(var i = 0; i < childElementIds.length; i++) {
                    var elementId = childElementIds[i].id;
                    var currObj = $ax.getObjectFromElementId(elementId);

                    if (currObj && currObj.type == $ax.constants.VECTOR_SHAPE_TYPE && currObj.parent &&
                        currObj.parent.scriptIds && currObj.parent.scriptIds[0] == elementIds[index]) {
                        treeNodeButtonShapeId = elementId;
                        break;
                    }
                }

                if(treeNodeButtonShapeId == '') continue;

                $ax.tree.SelectTreeNode(elementId, enabled);
            } else if ($ax.public.fn.IsImageBox(widgetType) || $ax.public.fn.IsVector(widgetType) || $ax.public.fn.IsVector(widgetType) || $ax.public.fn.IsTableCell(widgetType) || $ax.public.fn.IsDynamicPanel(widgetType) || $ax.public.fn.IsLayer(widgetType)) {
                $ax.style.SetWidgetSelected(elementIds[index], enabled);
            } else if ($ax.public.fn.IsCheckBox(widgetType) || $ax.public.fn.IsRadioButton(widgetType)) {
                var query = $jobj($ax.INPUT(elementId));
                var curr = query.prop('checked');
                //NOTE: won't fire onselect nore onunselect event if states didn't changes
                if(curr != enabled) {
                    query.prop('checked', enabled);
                    $ax.style.SetWidgetSelected(elementIds[index], enabled, true);
                    $ax.event.TryFireCheckChanged(elementId, enabled);
                }
            }
        }
        return this;
    };

    $ax.public.fn.focus = function() {
        var firstId = this.getElementIds()[0];
        var focusableId = $ax.event.getFocusableWidgetOrChildId(firstId);
        // This will scroll but not focus
        $('#' + focusableId).triggerHandler("focus");
        // This will focus but does not call our custom scroll so will not animate scroll
        $('#' + focusableId).focus();

        return this;
    };

    $ax.public.fn.expanded = function() {
        if(arguments[0] == undefined) {
            var firstId = this.getElementIds()[0];
            return firstId && !$ax.public.fn.IsTreeNodeObject($ax.getTypeFromElementId(firstId)) && $ax.visibility.IsIdVisible(firstId + '_children');
        } else {
            var elementIds = this.getElementIds();

            for(var index = 0; index < elementIds.length; index++) {
                if ($ax.public.fn.IsTreeNodeObject($ax.getTypeFromElementId(elementIds[index]))) {
                    var treeNodeId = elementIds[index];
                    var childContainerId = treeNodeId + '_children';

                    var scriptId = $ax.repeater.getScriptIdFromElementId(treeNodeId);
                    var itemId = $ax.repeater.getItemIdFromElementId(treeNodeId);
                    var plusMinusId = 'u' + (parseInt(scriptId.substring(1)) + 1);
                    if(itemId) plusMinusId = $ax.repeater.createElementId(plusMinusId, itemId);
                    if($('#' + childContainerId).length == 0 || !$jobj(plusMinusId).children().first().is('img'))
                        plusMinusId = '';

                    if(arguments[0] == true) {
                        $ax.tree.ExpandNode(treeNodeId, childContainerId, plusMinusId);
                    } else if(arguments[0] == false) {
                        $ax.tree.CollapseNode(treeNodeId, childContainerId, plusMinusId);
                    }
                }
            }

            return this;
        }
    };

    var _populateBoundingRect = function (boundingRect) {
        boundingRect.right = boundingRect.left + boundingRect.width;
        boundingRect.bottom = boundingRect.top + boundingRect.height;

        boundingRect.x = boundingRect.left;
        boundingRect.y = boundingRect.top;

        boundingRect.location = {
            x: boundingRect.left,
            y: boundingRect.top,
            left: boundingRect.left,
            top: boundingRect.top
        };

        boundingRect.size = {
            width: boundingRect.width,
            height: boundingRect.height
        };

        boundingRect.centerPoint = {
            x: boundingRect.width / 2 + boundingRect.left,
            y: boundingRect.height / 2 + boundingRect.top
        };
        return boundingRect;
    }

    //boundingrect relative to its offset parent
    //var _getBoundingRectForSingleWidget = function (elementId) {
    //    var element = document.getElementById(elementId);
    //    var tempBoundingRect, position;

    //    var state = $ax.style.generateState(elementId);
    //    var style = $ax.style.computeFullStyle(elementId, state, $ax.adaptive.currentViewId);
    //    position = { left: style.location.x, top: style.location.y };
    //    tempBoundingRect = { left: style.location.x, top: style.location.y, width: style.size.width, height: style.size.height };

    //    if ($ax.public.fn.isCompoundVectorHtml(element)) {
    //        tempBoundingRect.width = Number(element.getAttribute('data-width'));
    //        tempBoundingRect.height = Number(element.getAttribute('data-height'));
    //    } else {
    //        var boundingElement = element;
    //        if ($ax.dynamicPanelManager.isIdFitToContent(elementId)) {
    //            var stateId = $ax.visibility.GetPanelState(elementId);
    //            if (stateId != '') boundingElement = document.getElementById(stateId);
    //            tempBoundingRect = boundingElement.getBoundingClientRect();
    //        }

    //        //From getLoc
    //        //var fixed = _fixedOffset(id, vert);
    //        //if (fixed.valid) loc = !vert && fixed.fullWidth ? 0 : fixed.offset;

    //        var jElement = $(element);
    //        if (jElement.css('position') == 'fixed') {
    //            position = jElement.position();
    //            position.left += Number(jElement.css('margin-left').replace("px", ""));
    //            position.top += Number(jElement.css('margin-top').replace("px", ""));
    //        }
    //    }
        
    //    var boundingRect = {
    //        left: position.left,
    //        top: position.top,
    //        width: tempBoundingRect.width,
    //        height: tempBoundingRect.height
    //    };
        
    //    return _populateBoundingRect(boundingRect);
    //};

    //var _getBoundingRectForMultipleWidgets = function (widgetsIdArray) {
    //    if (!widgetsIdArray || widgetsIdArray.constructor !== Array) return undefined;
    //    if (widgetsIdArray.length == 0) return { left: 0, top: 0, centerPoint: { x: 0, y: 0 }, width: 0, height: 0 };
    //    var widgetRect = _getBoundingRectForSingleWidget(widgetsIdArray[0]);
    //    var boundingRect = { left: widgetRect.left, right: widgetRect.right, top: widgetRect.top, bottom: widgetRect.bottom };

    //    for (var index = 1; index < widgetsIdArray.length; index++) {
    //        widgetRect = _getBoundingRectForSingleWidget(widgetsIdArray[index]);
    //        boundingRect.left = Math.min(boundingRect.left, widgetRect.left);
    //        boundingRect.top = Math.min(boundingRect.top, widgetRect.top);
    //        boundingRect.right = Math.max(boundingRect.right, widgetRect.right);
    //        boundingRect.bottom = Math.max(boundingRect.bottom, widgetRect.bottom);
    //    }

    //    boundingRect.centerPoint = { x: (boundingRect.right + boundingRect.left) / 2.0, y: (boundingRect.bottom + boundingRect.top) / 2.0 };
    //    boundingRect.width = boundingRect.right - boundingRect.left;
    //    boundingRect.height = boundingRect.bottom - boundingRect.top;
    //    return _populateBoundingRect(boundingRect);
    //};

    //var _getLayerChildrenDeep = $ax.public.fn.getLayerChildrenDeep = function (layerId, includeLayers, includeHidden) {
    //    var deep = [];
    //    var children = $ax('#' + layerId).getChildren()[0].children;
    //    for (var index = 0; index < children.length; index++) {
    //        var childId = children[index];
    //        if (!includeHidden && !$ax.visibility.IsIdVisible(childId)) continue;
    //        if ($ax.public.fn.IsLayer($obj(childId).type)) {
    //            if (includeLayers) deep.push(childId);
    //            var recursiveChildren = _getLayerChildrenDeep(childId, includeLayers, includeHidden);
    //            for (var j = 0; j < recursiveChildren.length; j++) deep.push(recursiveChildren[j]);
    //        } else deep.push(childId);
    //    }
    //    return deep;
    //};

    var _boundingRectForIds = function(childIds) {
        // Default size
        var childrenBoundingRect = { left: childIds.length > 0 ? 9999999 : 0, top: childIds.length > 0 ? 9999999 : 0, right: 0, bottom: 0 };
        for (var i = 0; i < childIds.length; i++) {
            var childId = childIds[i];
            var childObj = $obj(childId);

            if (!childObj) continue;

            // Ignore fixed and hidden
            if ($ax.visibility.limboIds[childId] ||
                !$ax.visibility.IsIdVisible(childId) ||
                $ax.public.fn.IsDynamicPanel(childObj.type) && childObj.fixedHorizontal) continue;

            var boundingRect = $ax('#' + childId).offsetBoundingRect();

            // Ignore empty groups
            if ($ax.public.fn.IsLayer(childObj.type) && boundingRect.width == 0 && boundingRect.height == 0) continue;

            childrenBoundingRect.left = Math.min(childrenBoundingRect.left, boundingRect.left);
            childrenBoundingRect.top = Math.min(childrenBoundingRect.top, boundingRect.top);
            childrenBoundingRect.right = Math.max(childrenBoundingRect.right, boundingRect.right);
            childrenBoundingRect.bottom = Math.max(childrenBoundingRect.bottom, boundingRect.bottom);
        }
        childrenBoundingRect.width = childrenBoundingRect.right - childrenBoundingRect.left;
        childrenBoundingRect.height = childrenBoundingRect.bottom - childrenBoundingRect.top;

        return _populateBoundingRect(childrenBoundingRect);
    }

    $ax.public.fn.getPageSize = function() {
        var containerQuery = $('#base');
        var children = containerQuery.children();
        var childIds = [];
        for (var i = 0; i < children.length; i++) {
            var child = $(children[i]);
            var childId = child.attr('id');
            childIds.push(childId);
        }

        return _boundingRectForIds(childIds);
    }

    $ax.public.fn.childrenBoundingRect = function () {        
        var childIds = this.getChildren()[0].children;
        return _boundingRectForIds(childIds);
    };

    var _fixedLocation = function (elementId, size) {
        var axObj = $obj(elementId);
        if (!axObj || !axObj.fixedVertical) return { valid: false };

        var win = $(window);
        var windowWidth = win.width();
        var windowHeight = win.height();
        //getting the scroll forces layout. consider caching these values.
        var windowScrollLeft = win.scrollLeft();
        var windowScrollTop = win.scrollTop();

        var newLeft = 0;
        var newTop = 0;
        var width = size.width;
        var height = size.height;

        var horz = axObj.fixedHorizontal;
        if(horz == 'left') {
            newLeft = windowScrollLeft + (axObj.percentWidth ? 0 : $ax.getNumFromPx($jobj(elementId).css('left')));
        } else if(horz == 'center') {
            newLeft = windowScrollLeft + ((windowWidth - width) / 2) + axObj.fixedMarginHorizontal;
        } else if(horz == 'right') {
            newLeft = windowScrollLeft + windowWidth - width - axObj.fixedMarginHorizontal;
        }

        var vert = axObj.fixedVertical;
        if(vert == 'top') {
            newTop = windowScrollTop + $ax.getNumFromPx($jobj(elementId).css('top'));
        } else if(vert == 'middle') {
            newTop = windowScrollTop + ((windowHeight - height) / 2) + axObj.fixedMarginVertical;
        } else if(vert == 'bottom') {
            newTop = windowScrollTop + windowHeight - height - axObj.fixedMarginVertical;
        }

        //probably need to make this relative to the page for hit testing
        return { valid: true, top: newTop, left: axObj.isPercentWidthPanel ? 0 : newLeft };
    };

    //relative to the parent
    $ax.public.fn.offsetBoundingRect = function (ignoreRotation) {
        var elementId = this.getElementIds()[0];
        if (!elementId) return undefined;
        
        //element is null if RDO
        //data- values are for layers (legacy compound) 
        var element = document.getElementById(elementId);
        var position, size, rotation;

        var trap;
        var state;
        var style;
        var movedLoc = $ax.visibility.getMovedLocation(elementId);
        var resizedSize = $ax.visibility.getResizedSize(elementId);
        
        if (movedLoc) {
            position = movedLoc;
        } else if(element && element.getAttribute('data-left')) {
            position = {
                left: Number(element.getAttribute('data-left')),
                top: Number(element.getAttribute('data-top'))
            };
        } else if($obj(elementId)) {
            state = $ax.style.generateState(elementId);
            style = $ax.style.computeFullStyle(elementId, state, $ax.adaptive.currentViewId);
            position = { left: style.location.x, top: style.location.y };

            var parents = this.getParents(true, '*')[0];
            //if(parents.length > 0) {
            //    var parentId = parents[0];
            //    var type = $ax.getTypeFromElementId(parentId);
            //    if ($axure.fn.IsReferenceDiagramObject(type)) {
            //        var rdoLoc = $ax('#' + parentId).offsetLocation();
            //        position.left += rdoLoc.x;
            //        position.top += rdoLoc.y;
            //    }
            //}
            for(var i = 0; i < parents.length; i++) {
                var parentId = parents[i];
                var type = $ax.getTypeFromElementId(parentId);
                if ($axure.fn.IsReferenceDiagramObject(type)) {
                    var rdoLoc = $ax('#' + parentId).offsetLocation();
                    position.left += rdoLoc.x;
                    position.top += rdoLoc.y;
                    break;
                } else if (!$axure.fn.IsLayer(type)) break;
            }
        } else {
            if (!trap) trap = _displayWidget($ax.repeater.removeSuffixFromElementId(elementId));
            var jObjPosition = $(element).position();
            position = { left: jObjPosition.left, top: jObjPosition.top };
        }

        if (resizedSize) {
            size = resizedSize;
        } else if (element && element.getAttribute('data-width')) {
            size = {
                width: Number(element.getAttribute('data-width')),
                height: Number(element.getAttribute('data-height'))
            };
        } else if($obj(elementId)) {
            state = state || $ax.style.generateState(elementId);
            style = style || $ax.style.computeFullStyle(elementId, state, $ax.adaptive.currentViewId);
            size = { width: style.size.width, height: style.size.height };
        } else {
            if(!trap) trap = _displayWidget($ax.repeater.removeSuffixFromElementId(elementId));
            var jObj = $(element);
            size = { width: jObj.outerWidth(), height: jObj.outerHeight() };
        }
        
        var fixed = _fixedLocation(elementId, size);
        if(fixed.valid) {
            position.left = fixed.left;
            position.top = fixed.top;
        }

        var boundingRect = {
            left: position.left,
            top: position.top,
            width: size.width,
            height: size.height,
            isFixed: fixed.valid
        };

        if(!ignoreRotation) {
            var rotatedAngle = $ax.visibility.getRotatedAngle(elementId);
            if(rotatedAngle) {
                rotation = rotatedAngle;
            } else if(element && element.getAttribute('data-rotation')) {
                rotation = Number(element.getAttribute('data-rotation'));
            } else if($obj(elementId)) {
                state = state || $ax.style.generateState(elementId);
                style = style || $ax.style.computeFullStyle(elementId, state, $ax.adaptive.currentViewId);
                rotation = style.rotation;
            } else {
                if (!trap) trap = _displayWidget($ax.repeater.removeSuffixFromElementId(elementId));
                rotation = $ax.move.getRotationDegreeFromElement(element);
            }
            if(rotation && rotation != 0)
                boundingRect = $ax.public.fn.getBoundingRectForRotate(_populateBoundingRect(boundingRect), rotation);
        }

        if (trap) trap();

        return _populateBoundingRect(boundingRect);
    };

    //relative to the page
    $ax.public.fn.pageBoundingRect = function (ignoreRotation, scrollableId) {
        var boundingRect = this.offsetBoundingRect(ignoreRotation);
        if(!boundingRect) return undefined;

        if(boundingRect.isFixed) return _populateBoundingRect(boundingRect);

        var loc = boundingRect.location;

        //var parents = [];
        //var parObj = id.indexOf('text') != -1 ? axObj : axObj.parent; // When working with text id, parent widget is the ax obj we are dealing with, so that should be the first parent
        //while ($ax.public.fn.IsContainer(parObj.type)) {
        //    parents.push($ax.getScriptIdFromPath([parObj.id], strippedId));
        //    parObj = parObj.parent;
        //}
        //var otherParents = $ax('#' + id).getParents(true, ['item', 'repeater', 'dynamicPanel', 'layer'])[0];
        //for (var i = 0; i < otherParents.length; i++) {
        //    parents.push(otherParents[i]);
        //}

        var elementId = this.getElementIds()[0];
        //    var strippedId = $ax.repeater.removeSuffixFromElementId(id);
        //        var parObj = id.indexOf('text') != -1 ? axObj : axObj.parent; // When working with text id, parent widget is the ax obj we are dealing with, so that should be the first parent
        var parentIds = [];
        var parObj = $obj(elementId).parent;
        while ($ax.public.fn.IsContainer(parObj.type)) {
            parentIds.push($ax.getScriptIdFromPath([parObj.id], this.id));
            parObj = parObj.parent;
        }
        var otherParents = $ax('#' + elementId).getParents(true, ['item', 'repeater', 'dynamicPanel'])[0];
        for (var i = 0; i < otherParents.length; i++) {
            parentIds.push(otherParents[i]);
        }

        var parentScrollableId = scrollableId ? scrollableId.split('_')[0] : scrollableId;
        for (var i = 0; i < parentIds.length; i++) {
            //var parentId = $ax.visibility.getWidgetFromContainer(parents[0]);
            //var parent = $ax.visibility.applyWidgetContainer(parentId, true);
            //if(parent.length) {
            //var parentId = parentIds[i];
            //var fixed = _fixedOffset(parentId, vert);
            //if (fixed.valid) {
            //    loc += fixed.offset;
            //    break;
            //} else loc += $ax.getNumFromPx(parent.css(prop));
            //}
            
            var parentId = parentIds[i];
            if (parentId == parentScrollableId) break;
            var parentLoc = $ax('#' + parentId).offsetLocation();
            loc = { 
                x: loc.x + parentLoc.x,
                y: loc.y + parentLoc.y,
                left: loc.left + parentLoc.left,
                top: loc.top + parentLoc.top,
             }
            var axObj = $obj(parentId);
            if(axObj && axObj.fixedVertical) {
                boundingRect.isFixed = true;
                break;
            }
        }

        boundingRect.left = loc.x;
        boundingRect.top = loc.y;
        return _populateBoundingRect(boundingRect);
    };

    $ax.public.fn.viewportBoundingRect = function (scrollableId) {
        var boundingRect = this.pageBoundingRect(true, scrollableId);
        if (!boundingRect) return undefined;

        if(!boundingRect.isFixed) boundingRect.left = _bodyToWorld(boundingRect.left, false);
        return _populateBoundingRect(boundingRect);
    }

    $ax.public.fn.size = function () {
        var boundingRect = this.offsetBoundingRect(true);
        return boundingRect ? boundingRect.size : undefined;

        //var firstId = this.getElementIds()[0];
        //if(!firstId) return undefined;

        //var object = $ax.getObjectFromElementIdDisregardHex(firstId);
        //if(object && (object.type == 'layer' || object.generateCompound)) {
        //    var boundingRect = $ax.public.fn.getWidgetBoundingRect(firstId);
        //    return { width: boundingRect.width, height: boundingRect.height };
        //}

        //var firstIdObject = $jobj(firstId);
        //var trap = _displayWidget($ax.repeater.removeSuffixFromElementId(firstId));
        //var size = { width: firstIdObject.outerWidth(), height: firstIdObject.outerHeight() };
        //trap();
        //return size;
    };

    $ax.public.fn.width = function () {
        var boundingRect = this.offsetBoundingRect(true);
        return boundingRect ? boundingRect.width : undefined;

        //var firstId = this.getElementIds()[0];
        //if(!firstId) return undefined;

        //var object = $ax.getObjectFromElementIdDisregardHex(firstId);
        //if (object && (object.type == 'layer' || object.generateCompound)) {
        //    var boundingRect = $ax.public.fn.getWidgetBoundingRect(firstId);
        //    return boundingRect.width;
        //}

        //var firstIdObject = $jobj(firstId);

        //return firstIdObject.outerWidth();
    };

    $ax.public.fn.height = function () {
        var boundingRect = this.offsetBoundingRect(true);
        return boundingRect ? boundingRect.height : undefined;

        //var firstId = this.getElementIds()[0];
        //if(!firstId) return undefined;

        //var object = $ax.getObjectFromElementIdDisregardHex(firstId);
        //if (object && (object.type == 'layer' || object.generateCompound)) {
        //    var boundingRect = $ax.public.fn.getWidgetBoundingRect(firstId);
        //    return boundingRect.height;
        //}

        //var firstIdObject = $jobj(firstId);

        //return firstIdObject.outerHeight();
    };

    //this should replace locRelativeIgnoreLayer
    $ax.public.fn.offsetLocation = function () {
        var boundingRect = this.offsetBoundingRect(true);
        return boundingRect ? boundingRect.location : undefined;
    };

    //$ax.public.fn.offsetLeft = function () {
    //    var boundingRect = this.offsetBoundingRect();
    //    return boundingRect ? boundingRect.left : undefined;
    //};

    //$ax.public.fn.offsetTop = function () {
    //    var boundingRect = this.offsetBoundingRect();
    //    return boundingRect ? boundingRect.top : undefined;
    //};

    $ax.public.fn.viewportLocation = function (scrollableId) {
        var boundingRect = this.viewportBoundingRect(scrollableId);
        return boundingRect ? boundingRect.location : undefined;
    };

    //$ax.public.fn.pageLeft = function () {
    //    var boundingRect = this.pageBoundingRect();
    //    return boundingRect ? boundingRect.left : undefined;
    //};

    //$ax.public.fn.pageTop = function () {
    //    var boundingRect = this.pageBoundingRect();
    //    return boundingRect ? boundingRect.top : undefined;
    //};

    //This is getting its position in the Editor
    //It was needed because the widget would be contained so getting the position from jQuery would not be accurate
    //This can use the editor values
    //$ax.public.fn.locRelativeIgnoreLayer = function (vert) {
    //    var elementId = this.getElementIds()[0];
    //    if(!elementId) return undefined;

    //    var parents = this.getParents(true, '*')[0];

    //    for(var i = 0; i < parents.length; i++) {
    //        var type = $ax.getTypeFromElementId(parents[i]);
    //        if(!$axure.fn.IsLayer(type) && !$axure.fn.IsReferenceDiagramObject(type)) {
    //            var func = vert ? _getRelativeTop : _getRelativeLeft;
    //            return func(elementId, $jobj(parents[i])[0]);
    //        }
    //    }
    //    var axThis = $ax('#' + elementId);
    //    return vert ? axThis.top() : _bodyToWorld(axThis.left(), true);
    //};

    var _bodyToWorld = $axure.fn.bodyToWorld = function(x, from) {
        var body = $('body');
        if (body.css('position') != 'relative') return x;
        var offset = $ax.getNumFromPx(body.css('left')) + Math.max(0, ($(window).width() - body.width()) / 2);
        if(from) offset *= -1;
        return x + offset;
    }

    $ax.public.fn.left = function (relative) {
        return relative ? this.offsetLocation().left : this.viewportLocation().left;

        //var firstId = this.getElementIds()[0];
        //if(!firstId) return undefined;

        //var left = _getLoc(firstId, false, false, relative);

        //// If you are absolute, unless your are a pinned panel...
        //if(relative || $obj(firstId) && $obj(firstId).fixedVertical) return left;

        //// ... or you are in one...
        //var parentPanels = $ax('#' + firstId).getParents(true, 'dynamicPanel')[0];
        //for(var i = 0; i < parentPanels.length; i++) if ($obj(parentPanels[i]).fixedVertical) return left;

        //// ... you must convert from body to world coordinates
        //return _bodyToWorld(left);
    };

    $ax.public.fn.top = function(relative) {
        return relative ? this.offsetLocation().top : this.viewportLocation().top;

        //var firstId = this.getElementIds()[0];
        //return firstId && _getLoc(firstId, true, false, relative);
    };

    //var _getLoc = function(id, vert, high, relative) {
    //    var mathFunc = high ? 'max' : 'min';
    //    var prop = vert ? 'top' : 'left';
    //    var dim = vert ? 'height' : 'width';

    //    var obj = $jobj(id);
    //    var strippedId = $ax.repeater.removeSuffixFromElementId(id);
    //    var axObj = $obj(strippedId);
    //    var oldDisplay = obj.css('display');
    //    var displaySet = false;
    //    if(oldDisplay == 'none') {
    //        obj.css('display', '');
    //        displaySet = true;
    //    }
    //    var loc = Math.NaN;
    //    var rdo = axObj.type == $ax.constants.REFERENCE_DIAGRAM_OBJECT_TYPE;

    //    if (!rdo) loc = $ax.getNumFromPx(obj.css(prop));

    //    var fixed = _fixedOffset(id, vert);
    //    if(fixed.valid) loc = !vert && fixed.fullWidth ? 0 : fixed.offset;
    //    else if (!relative) {
    //        var parents = [];
    //        var parObj = id.indexOf('text') != -1 ? axObj : axObj.parent; // When working with text id, parent widget is the ax obj we are dealing with, so that should be the first parent
    //        while($ax.public.fn.IsContainer(parObj.type)) {
    //            parents.push($ax.getScriptIdFromPath([parObj.id], strippedId));
    //            parObj = parObj.parent;
    //        }
    //        var otherParents = $ax('#' + id).getParents(true, ['item', 'repeater', 'dynamicPanel', 'layer'])[0];
    //        for(var i = 0; i < otherParents.length; i++) {
    //            parents.push(otherParents[i]);
    //        }

    //        for(var i = 0; i < parents.length; i++) {
    //            var parentId = $ax.visibility.getWidgetFromContainer(parents[i]);
    //            var parent = $ax.visibility.applyWidgetContainer(parentId, true);

    //            // Layer may not have container, and will be at 0,0 otherwise.
    //            if (!parent.length) continue;

    //            fixed = _fixedOffset(parentId, vert);
    //            if(fixed.valid) {
    //                loc += fixed.offset;
    //                break; // If fixed ignore any parents if there are any, they don't matter.
    //            } else loc += $ax.getNumFromPx(parent.css(prop));
    //        }
    //    }

    //    if (high) loc += obj[dim]();

    //    // Special Layer code
    //    if (axObj.type == 'layer') {
    //        // If layer has a container, then use that. Otherwise must deal with children. Children can move in container after created, but ignoring for now.
    //        var container = $ax.visibility.applyWidgetContainer(id, true, true);
    //        if(container.length) loc += $ax.getNumFromPx(container.css(prop));
    //        else loc += (_getChildLoc(axObj.objs, vert, high, dim, true, id) || 0);
    //    }

    //    if(displaySet) obj.css('display', oldDisplay);
    //    return loc;
    //};

    //var _getChildLoc = function (children, vert, high, dim, root, path, itemId) {
    //    if (typeof (path) == 'string') {
    //        itemId = $ax.repeater.getItemIdFromElementId(path);
    //        path = $ax.getPathFromScriptId(path);
    //        path.pop(); // Remove object id, only want rdo path.
    //    }
    //    var mathFunc = high ? 'max' : 'min';
    //    var childLoc = NaN;
    //    for (var i = 0; i < children.length; i++) {
    //        var childObj = children[i];
    //        var childId = $ax.getElementIdFromPath([childObj.id], { relativeTo: path });
    //        if (!childId) continue;
    //        childId = $ax.repeater.createElementId(childId, itemId);
    //        if($ax.public.fn.IsReferenceDiagramObject(childObj.type)) {
    //            path.push(childObj.id);
    //            var childProp = _getChildLoc($ax.pageData.masters[$obj(childId).masterId].diagram.objects, vert, high, dim, false, path, itemId);
    //            path.pop();
    //            if(isNaN(childProp)) continue;
    //        } else if($ax.public.fn.IsLayer(childObj.type)) {
    //            childProp = _getChildLoc(childObj.objs, vert, high, dim, false, path, itemId);
    //        } else {
    //            if(!$ax.visibility.IsIdVisible(childId)) continue;
    //            childProp = $ax('#' + childId).locRelativeIgnoreLayer(vert);
    //            if(high) childProp += $jobj(childId)[dim]();
    //        }

    //        if(isNaN(childLoc)) childLoc = childProp;
    //        else if(!isNaN(childProp)) childLoc = Math[mathFunc](childLoc, childProp);
    //    }

    //    return root && isNaN(childLoc) ? 0 : childLoc;
    //};

    //var _fixedOffset = function (id, vert) {
    //    var axObj = $obj(id);
    //    //I think this is only for pinned panels? So why are we coming through here for rtps?
    //    if(!axObj) return { valid: false };

    //    var dim = vert ? 'height' : 'width';
    //    var alignment = axObj['fixed' + (vert ? 'Vertical' : 'Horizontal')];
    //    if(!alignment) return { valid: false };
    //    var loc = 0;

    //    // TODO: This returns 0 for width/height it or any parent is display none. Similar issue when using axquery width/height
    //    // TODO:  Look into replacing this with axquery width/height and fixing that to use this hack. Potentially want to make js generic trapper.
    //    var trap = _displayWidget(id);
    //    var query = $jobj(id);
    //    var objSize = query[dim]();
    //    trap();

    //    if(alignment == 'center' || alignment == 'middle') {
    //        loc = $ax.getNumFromPx(query.css('margin-' + (vert ? 'top' : 'left')));
    //        loc += ($(window)[dim]()) / 2;
    //    } else if(alignment == 'bottom' || alignment == 'right') {
    //        loc = $ax.getNumFromPx(query.css(vert ? 'bottom' : 'right'));
    //        loc = $(window)[dim]() - objSize - loc; // subract loc because margin here moves farther left/up as it gets bigger.
    //    } else {
    //        loc = $ax.getNumFromPx(query.css(vert ? 'top' : 'left'));
    //    }

    //    var scrollKey = 'scroll' + (vert ? 'Top' : 'Left');
    //    return { offset: $(window)[scrollKey]() + loc, valid: true, fullWidth: axObj.percentWidth == 1 };
    //};

    var _displayWidget = function(id) {
        var parents = $ax('#' + id).getParents(true, '*')[0];
        parents.push(id); // also need to show self

        var displayed = [];
        for(var i = 0; i < parents.length; i++) {
            var currId = parents[i];
            var currObj = $jobj(currId);
            if(currObj.css('display') == 'none') {
                currObj.css('display', 'block');
                displayed.push(currId);
            }
        }

        return function() {
            for(var i = 0; i < displayed.length; i++) {
                $jobj(displayed[i]).css('display', 'none');
            }
        };
    }
});
