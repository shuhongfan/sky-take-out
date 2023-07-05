$axure.internal(function($ax) {
    var _move = {};
    $ax.move = _move;

    var widgetMoveInfo = {};
    //register and return move info, also create container for rootlayer if needed
    $ax.move.PrepareForMove = function (id, x, y, to, options, jobj, rootLayer, skipContainerForRootLayer) {
        var fixedInfo = jobj ? {} : $ax.dynamicPanelManager.getFixedInfo(id);

        var widget = $jobj(id);
        var query = $ax('#' + id);
        var isLayer = $ax.getTypeFromElementId(id) == $ax.constants.LAYER_TYPE;
        if(!rootLayer) {
            rootLayer = _move.getRootLayer(id);
            if (rootLayer && !skipContainerForRootLayer) {
                $ax.visibility.pushContainer(rootLayer, false);
                if (isLayer) widget = $ax.visibility.applyWidgetContainer(id, true);
            }
        }
        if (!jobj) jobj = widget;

        var horzProp = 'left';
        var vertProp = 'top';
        var offsetLocation = to ? query.offsetLocation() : undefined;
        var horzX = to ? x - offsetLocation.x : x;
        var vertY = to ? y - offsetLocation.y : y;
        //var horzX = to ? x - query.locRelativeIgnoreLayer(false) : x;
        //var vertY = to ? y - query.locRelativeIgnoreLayer(true) : y;

        if (fixedInfo.horizontal == 'right') {
            horzProp = 'right';
            horzX = to ? $(window).width() - x - $ax.getNumFromPx(jobj.css('right')) - query.width() : -x;
            var leftChanges = -horzX;
        } else if(fixedInfo.horizontal == 'center') {
            horzProp = 'margin-left';
            if (to) horzX = x - $(window).width() / 2;
        }

        if (fixedInfo.vertical == 'bottom') {
            vertProp = 'bottom';
            vertY = to ? $(window).height() - y - $ax.getNumFromPx(jobj.css('bottom')) - query.height() : -y;
            var topChanges = -vertY;
        } else if (fixedInfo.vertical == 'middle') {
            vertProp = 'margin-top';
            if (to) vertY = y - $(window).height() / 2;
        }

        //todo currently this always save the info, which is not needed for compound vector children and maybe some other cases
        //let's optimize it later, only register if registerid is valid..
        widgetMoveInfo[id] = {
            x: leftChanges === undefined ? horzX : leftChanges,
            y: topChanges === undefined ? vertY : topChanges,
            options: options
        };

        return {
            horzX: horzX,
            vertY: vertY,
            horzProp: horzProp,
            vertProp: vertProp,
            rootLayer: rootLayer,
            jobj: jobj
        };
    };
    $ax.move.GetWidgetMoveInfo = function() {
        return $.extend({}, widgetMoveInfo);
    };

    _move.getRootLayer = function (id) {
        var isLayer = $ax.getTypeFromElementId(id) == $ax.constants.LAYER_TYPE;
        var rootLayer = isLayer ? id : '';

        var parentIds = $ax('#' + id).getParents(true, '*')[0];
        for(var i = 0; i < parentIds.length; i++) {
            var parentId = parentIds[i];
            // Keep climbing up layers until you hit a non-layer. At that point you have your root layer
            if($ax.public.fn.IsLayer($ax.getTypeFromElementId(parentId))) rootLayer = parentId;
            else break;
        }

        return rootLayer;
    };

    $ax.move.MoveWidget = function (id, x, y, options, to, animationCompleteCallback, shouldFire, jobj, skipOnMoveEvent) {
        var moveInfo = $ax.move.PrepareForMove(id, x, y, to, options, jobj);
        $ax.drag.LogMovedWidgetForDrag(id, options.dragInfo);

        var object = $obj(id);
        if(object && $ax.public.fn.IsLayer(object.type)) {
            var childrenIds = $ax.public.fn.getLayerChildrenDeep(id, true);
            //don't push container when register moveinfo for child
            if(!skipOnMoveEvent) {
                for(var i = 0; i < childrenIds.length; i++) $ax.move.PrepareForMove(childrenIds[i], x, y, to, options, null, moveInfo.rootLayer, true);
            }
        }

        //if(!moveInfo) moveInfo = _getMoveInfo(id, x, y, to, options, jobj);

        jobj = moveInfo.jobj;

        _moveElement(id, options, animationCompleteCallback, shouldFire, jobj, moveInfo);

        if(skipOnMoveEvent) return;
        $ax.event.raiseSyntheticEvent(id, "onMove");
        if(childrenIds) {
            for(var i = 0; i < childrenIds.length; i++) $ax.event.raiseSyntheticEvent(childrenIds[i], 'onMove');
        }
    };

    var _moveElement = function (id, options, animationCompleteCallback, shouldFire,  jobj, moveInfo){
        var cssStyles = {};

        if(!$ax.dynamicPanelManager.isPercentWidthPanel($obj(id))) cssStyles[moveInfo.horzProp] = '+=' + moveInfo.horzX;
        cssStyles[moveInfo.vertProp] = '+=' + moveInfo.vertY;
        
        $ax.visibility.moveMovedLocation(id, moveInfo.horzX, moveInfo.vertY);

        // I don't think root layer is necessary anymore after changes to layer container structure.
        //  Wait to try removing it until more stable.
        var rootLayer = moveInfo.rootLayer;

        var query = $addAll(jobj, id);
        var completeCount = query.length;
        var completeAnimation = function() {
            completeCount--;
            if(completeCount == 0 && rootLayer) $ax.visibility.popContainer(rootLayer, false);
            if(animationCompleteCallback) animationCompleteCallback();
            if(shouldFire) $ax.action.fireAnimationFromQueue(id, $ax.action.queueTypes.move);
        };
        if(options.easing==='none') {
            query.animate(cssStyles, { duration: 0, queue: false });

            if(rootLayer) $ax.visibility.popContainer(rootLayer, false);
            if(animationCompleteCallback) animationCompleteCallback();
            //if this widget is inside a layer, we should just remove the layer from the queue
            if(shouldFire) $ax.action.fireAnimationFromQueue(id, $ax.action.queueTypes.move);
        } else if (options.trajectory === 'straight' || moveInfo.horzX === 0 || moveInfo.vertY === 0) {
                query.animate(cssStyles, {
                    duration: options.duration, easing: options.easing, queue: false, complete: completeAnimation});
        } else {
            var initialHorzProp = $ax.getNumFromPx(query.css(moveInfo.horzProp));
            var initialVertProp = $ax.getNumFromPx(query.css(moveInfo.vertProp));
            var state = { parameter: 0 };
            var ellipseArcFunctionY = function(param) {
                return {
                    x: initialHorzProp + (1.0 - Math.cos(param * Math.PI * 0.5)) * moveInfo.horzX,
                    y: initialVertProp + Math.sin(param * Math.PI * 0.5) * moveInfo.vertY
                };
            };
            var ellipseArcFunctionX = function (param) {
                return {
                    x: initialHorzProp + Math.sin(param * Math.PI * 0.5) * moveInfo.horzX,
                    y: initialVertProp + (1.0 - Math.cos(param * Math.PI * 0.5)) * moveInfo.vertY
                };
            };
            var ellipseArcFunction = (moveInfo.horzX > 0) ^ (moveInfo.vertY > 0) ^ options.trajectory === 'arcClockwise'
                    ? ellipseArcFunctionX : ellipseArcFunctionY;
            var inverseFunction = $ax.public.fn.inversePathLengthFunction(ellipseArcFunction);
            $(state).animate({ parameter: 1.0 }, {
                duration: options.duration, easing: options.easing, queue: false,
                step: function (now) {
                    var newPos = ellipseArcFunction(inverseFunction(now));
                    var changeFields = {};
                    changeFields[moveInfo.horzProp] = newPos.x;
                    changeFields[moveInfo.vertProp] = newPos.y;
                    query.css(changeFields);
                },
                complete: completeAnimation});
        }

        //        //moveinfo is used for moving 'with this'
        //        var moveInfo = new Object();
        //        moveInfo.x = horzX;
        //        moveInfo.y = vertY;
        //        moveInfo.options = options;
        //        widgetMoveInfo[id] = moveInfo;


    };

    _move.nopMove = function(id, options) {
        var moveInfo = new Object();
        moveInfo.x = 0;
        moveInfo.y = 0;
        moveInfo.options = {};
        moveInfo.options.easing = 'none';
        moveInfo.options.duration = 0;
        widgetMoveInfo[id] = moveInfo;

        // Layer move using container now.
        var obj = $obj(id);
        if($ax.public.fn.IsLayer(obj.type)) if(options.onComplete) options.onComplete();

        $ax.event.raiseSyntheticEvent(id, "onMove");
    };

    //rotationDegree: total degree to rotate
    //centerPoint: the center of the circular path


    var _noRotateOnlyMove = function (id, moveDelta, rotatableMove, fireAnimationQueue, easing, duration, completionCallback) {
        moveDelta.x += rotatableMove.x;
        moveDelta.y += rotatableMove.y;
        if (moveDelta.x == 0 && moveDelta.y == 0) {
            if(fireAnimationQueue) {
                $ax.action.fireAnimationFromQueue(id, $ax.action.queueTypes.rotate);
                $ax.action.fireAnimationFromQueue(id, $ax.action.queueTypes.move);
            }
            if (completionCallback) completionCallback();
        } else {
            $jobj(id).animate({ top: '+=' + moveDelta.y, left: '+=' + moveDelta.x }, {
                duration: duration,
                easing: easing,
                queue: false,
                complete: function () {
                    if(fireAnimationQueue) {
                        $ax.action.fireAnimationFromQueue(id, $ax.action.queueTypes.move);
                        $ax.action.fireAnimationFromQueue(id, $ax.action.queueTypes.rotate);
                    }
                    if (completionCallback) completionCallback();
                }
            });
        }
    }


    _move.circularMove = function (id, degreeDelta, centerPoint, moveDelta, rotatableMove, resizeOffset, options, fireAnimationQueue, completionCallback, willDoRotation) {
        var elem = $jobj(id);
        if(!willDoRotation) elem = $addAll(elem, id);

        var moveInfo = $ax.move.PrepareForMove(id, moveDelta.x, moveDelta.y, false, options);
        // If not rotating, still need to check moveDelta and may need to handle that.
        if (degreeDelta === 0) {
            _noRotateOnlyMove(id, moveDelta, rotatableMove, fireAnimationQueue, options.easing, options.duration, completionCallback);
            return;
        }

        var stepFunc = function(newDegree) {
            var deg = newDegree - rotation.degree;
            var widgetCenter = $ax('#' + id).offsetBoundingRect().centerPoint;
            //var widgetCenter = $ax.public.fn.getWidgetBoundingRect(id).centerPoint;
            //console.log("widget center of " + id + " x " + widgetCenter.x + " y " + widgetCenter.y);
            var widgetNewCenter = $axure.fn.getPointAfterRotate(deg, widgetCenter, centerPoint);

            // Start by getting the move not related to rotation, and make sure to update center point to move with it.
            var ratio = deg / degreeDelta;

            var xdelta = (moveDelta.x + rotatableMove.x) * ratio;
            var ydelta = (moveDelta.y + rotatableMove.y) * ratio;
            if(resizeOffset) {
                var resizeShift = {};
                resizeShift.x = resizeOffset.x * ratio;
                resizeShift.y = resizeOffset.y * ratio;
                $axure.fn.getPointAfterRotate(rotation.degree, resizeShift, { x: 0, y: 0 });
                xdelta += resizeShift.x;
                ydelta += resizeShift.y;
            }
            centerPoint.x += xdelta;
            centerPoint.y += ydelta;

            // Now for the move that is rotatable, it must be rotated
            rotatableMove = $axure.fn.getPointAfterRotate(deg, rotatableMove, { x: 0, y: 0 });

            // Now add in circular move to the mix.
            xdelta += widgetNewCenter.x - widgetCenter.x;
            ydelta += widgetNewCenter.y - widgetCenter.y;

            $ax.visibility.moveMovedLocation(id, xdelta, ydelta);

            if(xdelta < 0) elem.css('left', '-=' + -xdelta);
            else if(xdelta > 0) elem.css('left', '+=' + xdelta);

            if(ydelta < 0) elem.css('top', '-=' + -ydelta);
            else if(ydelta > 0) elem.css('top', '+=' + ydelta);
        };

        var onComplete = function() {
            if(fireAnimationQueue) $ax.action.fireAnimationFromQueue(id, $ax.action.queueTypes.move);
            if(completionCallback) completionCallback();
            if(moveInfo.rootLayer) $ax.visibility.popContainer(moveInfo.rootLayer, false);
            var isPercentWidthPanel = $ax.dynamicPanelManager.isPercentWidthPanel($obj(id));
            if(isPercentWidthPanel) {
                $ax.dynamicPanelManager.updatePanelPercentWidth(id);
                $ax.dynamicPanelManager.updatePanelContentPercentWidth(id);
            }
            if(elem.css('position') == 'fixed') {
                if(!isPercentWidthPanel) elem.css('left', '');
                elem.css('top', '');
            }
        };

        var rotation = { degree: 0 };

        if(!options.easing || options.easing === 'none' || options.duration <= 0) {
            stepFunc(degreeDelta);
            onComplete();
        } else {
            $(rotation).animate({ degree: degreeDelta }, {
                duration: options.duration,
                easing: options.easing,
                queue: false,
                step: stepFunc,
                complete: onComplete
            });
        }
    };

    //rotate a widget by degree, center is 50% 50%
    _move.rotate = function (id, degree, easing, duration, to, shouldFire, completionCallback) {
        var currentDegree = _move.getRotationDegree(id);
        if(to) degree = degree - currentDegree;

        if(degree === 0) {
            if (shouldFire) $ax.action.fireAnimationFromQueue(id, $ax.action.queueTypes.rotate);
            return;
        }

        var query = $jobj(id);
        var stepFunc = function(now) {
            var degreeDelta = now - rotation.degree;
            var newDegree = currentDegree + degreeDelta;
            query.css($ax.public.fn.setTransformHowever("rotate(" + newDegree + "deg)"));
            currentDegree = newDegree;
        };

        var onComplete = function() {
            if(shouldFire) {
                $ax.action.fireAnimationFromQueue($ax.public.fn.compoundIdFromComponent(id), $ax.action.queueTypes.rotate);
            }
            if(completionCallback) completionCallback();

            $ax.annotation.adjustIconLocation(id);
        };

        var rotation = { degree: 0 };

        $ax.visibility.setRotatedAngle(id, currentDegree + degree);
        
        //if no animation, setting duration to 1, to prevent RangeError in rotation loops without animation
        if(!easing || easing === 'none' || duration <= 0) {
            stepFunc(degree);
            onComplete();
        } else {
            $(rotation).animate({ degree: degree }, {
                duration: duration,
                easing: easing,
                queue: false,
                step: stepFunc,
                complete: onComplete
            });
        }
    };

    _move.compoundRotateAround = function (id, degreeDelta, centerPoint, moveDelta, rotatableMove, resizeOffset, easing, duration, fireAnimationQueue, completionCallback) {
        if (degreeDelta === 0) {
            _noRotateOnlyMove($ax.public.fn.compoundIdFromComponent(id), moveDelta, rotatableMove, fireAnimationQueue, easing, duration, completionCallback, $ax.action.queueTypes.rotate);
            return;
        }
        var elem = $jobj(id);
        var rotation = { degree: 0 };

        if (!easing || easing === 'none' || duration <= 0) {
            duration = 1;
            easing = 'linear'; //it doesn't matter anymore here...
        }

        var originalWidth = $ax.getNumFromPx(elem.css('width'));
        var originalHeight = $ax.getNumFromPx(elem.css('height'));
        var originalLeft = $ax.getNumFromPx(elem.css('left'));
        var originalTop = $ax.getNumFromPx(elem.css('top'));

        $(rotation).animate({ degree: degreeDelta }, {
            duration: duration,
            easing: easing,
            queue: false,
            step: function (newDegree) {
                var transform = $ax.public.fn.transformFromElement(elem[0]);
                var originalCenter = { x: originalLeft + 0.5 * originalWidth, y: originalTop + 0.5 * originalHeight};
                var componentCenter = { x: originalCenter.x + transform[4], y: originalCenter.y + transform[5] };
                var deg = newDegree - rotation.degree;
                var ratio = deg / degreeDelta;
                var xdelta = (moveDelta.x + rotatableMove.x) * ratio;
                var ydelta = (moveDelta.y + rotatableMove.y) * ratio;
                if (resizeOffset) {
                    var resizeShift = {};
                    resizeShift.x = resizeOffset.x * ratio;
                    resizeShift.y = resizeOffset.y * ratio;
                    $axure.fn.getPointAfterRotate(rotation.degree, resizeShift, { x: 0, y: 0 });
                    xdelta += resizeShift.x;
                    ydelta += resizeShift.y;
                }

                var rotationMatrix = $ax.public.fn.rotationMatrix(deg);
                var compositionTransform = $ax.public.fn.matrixMultiplyMatrix(rotationMatrix,
                    { m11: transform[0], m21: transform[1], m12: transform[2], m22: transform[3] });

                //console.log("widget center of " + id + " x " + widgetCenter.x + " y " + widgetCenter.y);
                var widgetNewCenter = $axure.fn.getPointAfterRotate(deg, componentCenter, centerPoint);
                var newMatrix = $ax.public.fn.matrixString(compositionTransform.m11, compositionTransform.m21, compositionTransform.m12, compositionTransform.m22,
                    widgetNewCenter.x - originalCenter.x + xdelta, widgetNewCenter.y - originalCenter.y + ydelta);
                elem.css($ax.public.fn.setTransformHowever(newMatrix));
            },
            complete: function () {
                if (fireAnimationQueue) {
                    $ax.action.fireAnimationFromQueue(elem.parent()[0].id, $ax.action.queueTypes.rotate);
                }

                if(completionCallback) completionCallback();
            }
        });
    };

    _move.getRotationDegreeFromElement = function(element) {
        if(element == null) return NaN;

        var transformString = element.style['transform'] ||
            element.style['-o-transform'] ||
            element.style['-ms-transform'] ||
            element.style['-moz-transform'] ||
            element.style['-webkit-transform'];

        if(transformString) {
            var rotateRegex = /rotate\(([-?0-9]+)deg\)/;
            var degreeMatch = rotateRegex.exec(transformString);
            if(degreeMatch && degreeMatch[1]) return parseFloat(degreeMatch[1]);
        }

        if(window.getComputedStyle) {
            var st = window.getComputedStyle(element, null);
        } else {
            console.log('rotation is not supported for ie 8 and below in this version of axure rp');
            return 0;
        }

        var tr = st.getPropertyValue("transform") ||
            st.getPropertyValue("-o-transform") ||
            st.getPropertyValue("-ms-transform") ||
            st.getPropertyValue("-moz-transform") ||
            st.getPropertyValue("-webkit-transform");

        if(!tr || tr === 'none') return 0;
        var values = tr.split('(')[1];
        values = values.split(')')[0],
        values = values.split(',');

        var a = values[0];
        var b = values[1];

        var radians = Math.atan2(b, a);
        if(radians < 0) {
            radians += (2 * Math.PI);
        }

        return radians * (180 / Math.PI);
    };

    _move.getRotationDegree = function(elementId) {
        if($ax.public.fn.IsLayer($obj(elementId).type)) {
            return $jobj(elementId).data('layerDegree');
        }
        return _move.getRotationDegreeFromElement(document.getElementById(elementId));
    }
});