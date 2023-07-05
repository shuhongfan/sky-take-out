$axure.internal(function($ax) {
    var _actionHandlers = {};
    var _action = $ax.action = {};

    var queueTypes = _action.queueTypes = {
        none: 0,
        move: 1,
        setState: 2,
        fade: 3,
        resize: 4,
        rotate: 5
    };

    var animationQueue = {};

    // using array as the key doesn't play nice
    var nextAnimationId = 1;
    var animationsToCount = {};
    var actionToActionGroups = {};
    var getAnimation = function(id, type) {
        return animationQueue[id] && animationQueue[id][type] && animationQueue[id][type][0];
    };

    var _addAnimation = _action.addAnimation = function (id, type, func, suppressFire) {

        var wasEmpty = !getAnimation(id, type);
        // Add the func to the queue. Create the queue if necessary.
        var idQueue = animationQueue[id];
        if(!idQueue) animationQueue[id] = idQueue = {};

        var queue = idQueue[type];
        if(!queue) idQueue[type] = queue = [];

        queue[queue.length] = func;
        // If it was empty, there isn't a callback waiting to be called on this. You have to fire it manually.
        // If this is waiting on something, suppress it, and it will fire when it's ready
        if(wasEmpty && !suppressFire) func();
    };

    var _addAnimations = function (animations) {
        if(animations.length == 1) {
            _addAnimation(animations[0].id, animations[0].type, animations[0].func);
            return;
        }
        var allReady = true;
        var readyCount = 0;
        for(var i = 0; i < animations.length; i++) {
            var animation = animations[i];
            var thisReady = !getAnimation(animation.id, animation.type);
            allReady = allReady && thisReady;
            if (thisReady) readyCount++;
            else {
                var typeToGroups = actionToActionGroups[animation.id];
                if (!typeToGroups) actionToActionGroups[animation.id] = typeToGroups = {};

                var groups = typeToGroups[animation.type];
                if (!groups) typeToGroups[animation.type] = groups = [];

                groups[groups.length] = animations;
            }
        }

        for(i = 0; i < animations.length; i++) {
            animation = animations[i];
            _addAnimation(animation.id, animation.type, animation.func, true);
        }

        if (allReady) {
            for (i = 0; i < animations.length; i++) animations[i].func();
        } else {
            animations.id = nextAnimationId++;
            animationsToCount[animations.id] = readyCount;
        }
    }

    var _fireAnimationFromQueue = _action.fireAnimationFromQueue = function (id, type) {
        // Remove the function that was just fired
        if (animationQueue[id] && animationQueue[id][type]) $ax.splice(animationQueue[id][type], 0, 1);

        // Fire the next func if there is one
        var func = getAnimation(id, type);
        if(func && !_checkFireActionGroup(id, type, func)) func();
    };

    var _checkFireActionGroup = function(id, type, func) {
        var group = actionToActionGroups[id];
        group = group && group[type];
        if (!group || group.length == 0) return false;

        var animations = group[0];
        var found = false;
        for (var i = 0; i < animations.length; i++) {
            var animation = animations[i];
            if (animation.id == id && animation.type == type) {
                found = func == animation.func;
                break;
            }
        }

        // if found then update this action group, otherwise, keep waiting for right action to fire
        if(!found) return false;
        $ax.splice(group, 0, 1);
        var count = animationsToCount[animations.id] + 1;
        if(count != animations.length) {
            animationsToCount[animations.id] = count;
            return true;
        }
        delete animationsToCount[animations.id];

        // Funcs is needed because an earlier func can try to cascade right away (when no animation for example) and will kill this func and move on to the
        //  next one (which may not even exist). If we get all funcs before calling any, then we know they are all the func we want.
        var funcs = [];
        for(i = 0; i < animations.length; i++) {
            animation = animations[i];
            funcs.push(getAnimation(animation.id, animation.type));
        }
        for(i = 0; i < funcs.length; i++) {
            funcs[i]();
        }

        return true;
    }

    var _refreshing = [];
    _action.refreshStart = function(repeaterId) { _refreshing.push(repeaterId); };
    _action.refreshEnd = function() { _refreshing.pop(); };

    // TODO: [ben] Consider moving this to repeater.js
    var _repeatersToRefresh = _action.repeatersToRefresh = [];
    var _ignoreAction = function(repeaterId) {
        for(var i = 0; i < _refreshing.length; i++) if(_refreshing[i] == repeaterId) return true;
        return false;
    };

    var _addRefresh = function(repeaterId) {
        if(_repeatersToRefresh.indexOf(repeaterId) == -1) _repeatersToRefresh.push(repeaterId);
    };

    var _getIdToResizeMoveState = function(eventInfo) {
        if(!eventInfo.idToResizeMoveState) eventInfo.idToResizeMoveState = {};
        return eventInfo.idToResizeMoveState;
    }

    var _queueResizeMove = function (id, type, eventInfo, actionInfo) {
        if (type == queueTypes.resize || type == queueTypes.rotate) $ax.public.fn.convertToSingleImage($jobj(id));
        
        var idToResizeMoveState = _getIdToResizeMoveState(eventInfo);
        if(!idToResizeMoveState[id]) {
            idToResizeMoveState[id] = {};
            idToResizeMoveState[id][queueTypes.move] = { queue: [], used: 0 };
            idToResizeMoveState[id][queueTypes.resize] = { queue: [], used: 0 };
            idToResizeMoveState[id][queueTypes.rotate] = { queue: [], used: 0 };
        }
        var state = idToResizeMoveState[id];

        // If this is not a type being queued (no action of it's type waiting already) then if it is an instant, fire right away.
        var myOptions = type == queueTypes.resize ? actionInfo : actionInfo.options;
        if(!state[type].queue.length && (!myOptions.easing || myOptions.easing == 'none' || !myOptions.duration)) {
            var func = type == queueTypes.resize ? _addResize : type == queueTypes.rotate ? _addRotate : _addMove;
            func(id, eventInfo, actionInfo, { easing: 'none', duration: 0, stop: { instant: true } });
            return;
        }

        // Check other 2 types to see if either is empty, if so, we can't do anything, so just queue it up
        var otherType1 = type == queueTypes.move ? queueTypes.resize : queueTypes.move;
        var otherType2 = type == queueTypes.rotate ? queueTypes.resize : queueTypes.rotate;
        if (!state[otherType1].queue.length || !state[otherType2].queue.length) {
            state[type].queue.push({ eventInfo: eventInfo, actionInfo: actionInfo });
        } else {
            var duration = myOptions.duration;
            var used1 = state[otherType1].used;
            var used2 = state[otherType2].used;

            while(state[otherType1].queue.length && state[otherType2].queue.length && duration != 0) {
                var other1 = state[otherType1].queue[0];
                var otherOptions1 = otherType1 == queueTypes.resize ? other1.actionInfo : other1.actionInfo.options;
                // If queue up action is a non animation, then don't combo it, just queue it and move on
                if(!otherOptions1.easing || otherOptions1.easing == 'none' || !otherOptions1.duration) {
                    func = otherType1 == queueTypes.resize ? _addResize : otherType1 == queueTypes.rotate ? _addRotate : _addMove;
                    func(id, eventInfo, actionInfo, { easing: 'none', duration: 0, stop: { instant: true } });
                    continue;
                }
                var other2 = state[otherType2].queue[0];
                var otherOptions2 = otherType2 == queueTypes.resize ? other2.actionInfo : other2.actionInfo.options;
                // If queue up action is a non animation, then don't combo it, just queue it and move on
                if(!otherOptions2.easing || otherOptions2.easing == 'none' || !otherOptions2.duration) {
                    func = otherType2 == queueTypes.resize ? _addResize : otherType2 == queueTypes.rotate ? _addRotate : _addMove;
                    func(id, eventInfo, actionInfo, { easing: 'none', duration: 0, stop: { instant: true } });
                    continue;
                }

                // Other duration is what is left over. When in queue it may be partly finished already
                var otherDuration1 = otherOptions1.duration - used1;
                var otherDuration2 = otherOptions2.duration - used2;

                var resizeInfo = type == queueTypes.resize ? actionInfo : otherType1 == queueTypes.resize ? other1.actionInfo : other2.actionInfo;
                var rotateInfo = type == queueTypes.rotate ? actionInfo : otherType1 == queueTypes.rotate ? other1.actionInfo : other2.actionInfo;
                var moveInfo = type == queueTypes.move ? actionInfo : otherType1 == queueTypes.move ? other1.actionInfo : other2.actionInfo;
                var options = { easing: moveInfo.options.easing, duration: Math.min(duration, otherDuration1, otherDuration2) };
                // Start for self is whole duration - duration left, end is start plus duration of combo to be queued, length is duration
                var stop = { start: myOptions.duration - duration, len: myOptions.duration };
                stop.end = stop.start + options.duration;
                // Start for other is used (will be 0 after 1st round), end is start plus length is duration of combo to be queued, length is other duration
                var otherStop1 = { start: used1, end: options.duration + used1, len: otherOptions1.duration };
                var otherStop2 = { start: used2, end: options.duration + used2, len: otherOptions2.duration };
                options.stop = type == queueTypes.resize ? stop : otherType1 == queueTypes.resize ? otherStop1 : otherStop2;
                options.moveStop = type == queueTypes.move ? stop : otherType1 == queueTypes.move ? otherStop1 : otherStop2;
                options.rotateStop = type == queueTypes.rotate ? stop : otherType1 == queueTypes.rotate ? otherStop1 : otherStop2;

                _addResize(id, eventInfo, resizeInfo, options, moveInfo, rotateInfo);

                // Update duration for this animation
                duration -= options.duration;
                // For others update used and remove from queue if necessary
                if(otherDuration1 == options.duration) {
                    $ax.splice(state[otherType1].queue, 0, 1);
                    used1 = 0;
                } else used1 += options.duration;

                if(otherDuration2 == options.duration) {
                    $ax.splice(state[otherType2].queue, 0, 1);
                    used2 = 0;
                } else used2 += options.duration;
            }

            // Start queue for new type if necessary
            if(duration) {
                state[type].queue.push({ eventInfo: eventInfo, actionInfo: actionInfo });
                state[type].used = myOptions.duration - duration;
            }

            // Update used for others
            state[otherType1].used = used1;
            state[otherType2].used = used2;
        }
    };

    _action.flushAllResizeMoveActions = function (eventInfo) {
        var idToResizeMoveState = _getIdToResizeMoveState(eventInfo);
        for(var id in idToResizeMoveState) _flushResizeMoveActions(id, idToResizeMoveState);
    };

    var _flushResizeMoveActions = function(id, idToResizeMoveState) {
        var state = idToResizeMoveState[id];
        var move = state[queueTypes.move];
        var moveInfo = move.queue[0];
        var resize = state[queueTypes.resize];
        var resizeInfo = resize.queue[0];
        var rotate = state[queueTypes.rotate];
        var rotateInfo = rotate.queue[0];
        while (moveInfo || resizeInfo || rotateInfo) {
            var eventInfo = moveInfo ? moveInfo.eventInfo : resizeInfo ? resizeInfo.eventInfo : rotateInfo.eventInfo;
            moveInfo = moveInfo && moveInfo.actionInfo;
            resizeInfo = resizeInfo && resizeInfo.actionInfo;
            rotateInfo = rotateInfo && rotateInfo.actionInfo;

            // Resize is used by default, then rotate
            if(resizeInfo) {
                // Check for instant resize
                if(!resizeInfo.duration || resizeInfo.easing == 'none') {
                    _addResize(id, resize.queue[0].eventInfo, resizeInfo, { easing: 'none', duration: 0, stop: { instant: true } });
                    _updateResizeMoveUsed(id, queueTypes.resize, 0, idToResizeMoveState);
                    resizeInfo = resize.queue[0];
                    continue;
                }

                var duration = resizeInfo.duration - resize.used;
                if(moveInfo) duration = Math.min(duration, moveInfo.options.duration - move.used);
                if(rotateInfo) duration = Math.min(duration, rotateInfo.options.duration - rotate.used);

                var baseOptions = moveInfo ? moveInfo.options : resizeInfo;
                var options = { easing: baseOptions.easing, duration: duration };

                options.stop = { start: resize.used, end: resize.used + duration, len: resizeInfo.duration };
                if(moveInfo) options.moveStop = { start: move.used, end: move.used + duration, len: moveInfo.options.duration };
                if(rotateInfo) options.rotateStop = { start: rotate.used, end: rotate.used + duration, len: rotateInfo.options.duration };

                _addResize(id, eventInfo, resizeInfo, options, moveInfo, rotateInfo);

                _updateResizeMoveUsed(id, queueTypes.resize, duration, idToResizeMoveState);
                resizeInfo = resize.queue[0];
                if(rotateInfo) {
                    _updateResizeMoveUsed(id, queueTypes.rotate, duration, idToResizeMoveState);
                    rotateInfo = rotate.queue[0];
                }
                if(moveInfo) {
                    _updateResizeMoveUsed(id, queueTypes.move, duration, idToResizeMoveState);
                    moveInfo = move.queue[0];
                }
            } else if (rotateInfo) {
                // Check for instant rotate
                if(!rotateInfo.options.duration || rotateInfo.options.easing == 'none') {
                    _addRotate(id, rotate.queue[0].eventInfo, rotateInfo, { easing: 'none', duration: 0, stop: { instant: true } });
                    _updateResizeMoveUsed(id, queueTypes.rotate, 0, idToResizeMoveState);
                    rotateInfo = rotate.queue[0];
                    continue;
                }

                duration = rotateInfo.options.duration - rotate.used;
                if(moveInfo) duration = Math.min(duration, moveInfo.options.duration - move.used);

                baseOptions = moveInfo ? moveInfo.options : rotateInfo.options;
                options = { easing: baseOptions.easing, duration: duration };

                options.stop = { start: rotate.used, end: rotate.used + duration, len: rotateInfo.options.duration };
                if(moveInfo) options.moveStop = { start: move.used, end: move.used + duration, len: moveInfo.options.duration };

                _addRotate(id, eventInfo, rotateInfo, options, moveInfo);

                _updateResizeMoveUsed(id, queueTypes.rotate, duration, idToResizeMoveState);
                rotateInfo = rotate.queue[0];
                if(moveInfo) {
                    _updateResizeMoveUsed(id, queueTypes.move, duration, idToResizeMoveState);
                    moveInfo = move.queue[0];
                }
            } else {
                if(!moveInfo.options.duration || moveInfo.options.easing == 'none') {
                    _addMove(id, eventInfo, moveInfo, { easing: 'none', duration: 0, stop: { instant: true } });
                    _updateResizeMoveUsed(id, queueTypes.move, 0, idToResizeMoveState);
                    moveInfo = move.queue[0];
                    continue;
                }

                duration = moveInfo.options.duration - move.used;
                options = { easing: moveInfo.options.easing, duration: duration };
                options.stop = { start: move.used, end: moveInfo.options.duration, len: moveInfo.options.duration };
                _addMove(id, eventInfo, moveInfo, options);

                _updateResizeMoveUsed(id, queueTypes.move, duration, idToResizeMoveState);
                moveInfo = move.queue[0];
            }
        }
    };

    var _updateResizeMoveUsed = function(id, type, duration, idToResizeMoveState) {
        var state = idToResizeMoveState[id][type];
        state.used += duration;
        var options = state.queue[0].actionInfo;
        if(options.options) options = options.options;
        var optionDur = (options.easing && options.easing != 'none' && options.duration) || 0;
        if(optionDur <= state.used) {
            $ax.splice(state.queue, 0, 1);
            state.used = 0;
        }
    }

    var _dispatchAction = $ax.action.dispatchAction = function(eventInfo, actions, currentIndex) {
        currentIndex = currentIndex || 0;
        //If no actions, you can bubble
        if(currentIndex >= actions.length) return;
        //actions are responsible for doing their own dispatching
        _actionHandlers[actions[currentIndex].action](eventInfo, actions, currentIndex);
    };

    _actionHandlers.wait = function(eventInfo, actions, index) {
        var action = actions[index];
        var infoCopy = $ax.eventCopy(eventInfo);
        window.setTimeout(function() {
            infoCopy.now = new Date();
            infoCopy.idToResizeMoveState = undefined;
            _dispatchAction(infoCopy, actions, index + 1);
            _action.flushAllResizeMoveActions(infoCopy);
        }, action.waitTime);
    };

    _actionHandlers.expr = function(eventInfo, actions, index) {
        var action = actions[index];

        $ax.expr.evaluateExpr(action.expr, eventInfo); //this should be a block

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.setFunction = _actionHandlers.expr;

    _actionHandlers.linkWindow = function(eventInfo, actions, index) {
        linkActionHelper(eventInfo, actions, index);
    };

    _actionHandlers.closeCurrent = function(eventInfo, actions, index) {
        $ax.closeWindow();
        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.linkFrame = function(eventInfo, actions, index) {
        linkActionHelper(eventInfo, actions, index);
    };

    _actionHandlers.setAdaptiveView = function(eventInfo, actions, index) {
        var action = actions[index];
        var view = action.setAdaptiveViewTo;

        if(view) $ax.adaptive.setAdaptiveView(view);
    };

    var linkActionHelper = function(eventInfo, actions, index) {
        var action = actions[index];
        eventInfo.link = true;

        if(action.linkType != 'frame') {
            var includeVars = _includeVars(action.target, eventInfo);
            if(action.target.targetType == "reloadPage") {
                $ax.reload(action.target.includeVariables);
            } else if(action.target.targetType == "backUrl") {
                $ax.back();
            }

            var url = action.target.url;
            if(!url && action.target.urlLiteral) {
                url = $ax.expr.evaluateExpr(action.target.urlLiteral, eventInfo, true);
            }

            if(url) {
                if(action.linkType == "popup") {
                    $ax.navigate({
                        url: url,
                        target: action.linkType,
                        includeVariables: includeVars,
                        popupOptions: action.popup
                    });
                } else {
                    $ax.navigate({
                        url: url,
                        target: action.linkType,
                        includeVariables: includeVars
                    });
                }
            }
        } else linkFrame(eventInfo, action);
        eventInfo.link = false;

        _dispatchAction(eventInfo, actions, index + 1);
    };

    var _includeVars = function(target, eventInfo) {
        if(target.includeVariables) return true;
        // If it is a url literal, that is a string literal, that has only 1 sto, that is an item that is a page, include vars.
        if(target.urlLiteral) {
            var literal = target.urlLiteral;
            var sto = literal.stos[0];
            if(literal.exprType == 'stringLiteral' && literal.value.indexOf('[[') == 0 && literal.value.indexOf(']]' == literal.value.length - 2) && literal.stos.length == 1 && sto.sto == 'item' && eventInfo.item) {
                var data = $ax.repeater.getData(eventInfo, eventInfo.item.repeater.elementId, eventInfo.item.index, sto.name, 'data');
                if (data && $ax.public.fn.IsPage(data.type)) return true;
            }
        }
        return false;
    };

    var linkFrame = function(eventInfo, action) {
        for(var i = 0; i < action.framesToTargets.length; i++) {
            var framePath = action.framesToTargets[i].framePath;
            var target = action.framesToTargets[i].target;
            var includeVars = _includeVars(target, eventInfo);

            var url = target.url;
            if(!url && target.urlLiteral) {
                url = $ax.expr.evaluateExpr(target.urlLiteral, eventInfo, true);
            }

            var id = $ax.getElementIdsFromPath(framePath, eventInfo)[0];
            if(id) $ax('#' + $ax.INPUT(id)).openLink(url, includeVars);
        }
    };

    var _repeatPanelMap = {};

    _actionHandlers.setPanelState = function(eventInfo, actions, index) {
        var action = actions[index];

        for(var i = 0; i < action.panelsToStates.length; i++) {
            var panelToState = action.panelsToStates[i];
            var stateInfo = panelToState.stateInfo;
            var elementIds = $ax.getElementIdsFromPath(panelToState.panelPath, eventInfo);

            for(var j = 0; j < elementIds.length; j++) {
                var elementId = elementIds[j];
                // Need new scope for elementId and info
                (function(elementId, stateInfo) {
                    _addAnimation(elementId, queueTypes.setState, function() {
                        var stateNumber = stateInfo.stateNumber;
                        if(stateInfo.setStateType == "value") {
                            var oldTarget = eventInfo.targetElement;
                            eventInfo.targetElement = elementId;
                            var stateName = $ax.expr.evaluateExpr(stateInfo.stateValue, eventInfo);
                            eventInfo.targetElement = oldTarget;

                            // Try for state name first
                            var states = $ax.getObjectFromElementId(elementId).diagrams;
                            var stateNameFound = false;
                            for(var k = 0; k < states.length; k++) {
                                if(states[k].label == stateName) {
                                    stateNumber = k + 1;
                                    stateNameFound = true;
                                }
                            }

                            // Now check for index
                            if(!stateNameFound) {
                                stateNumber = Number(stateName);
                                var panelCount = $('#' + elementId).children().length;

                                // Make sure number is not NaN, is in range, and is a whole number.
                                // Wasn't a state name or number, so return
                                if(isNaN(stateNumber) || stateNumber <= 0 || stateNumber > panelCount || Math.round(stateNumber) != stateNumber) return _fireAnimationFromQueue(elementId, queueTypes.setState);
                            }
                        } else if(stateInfo.setStateType == 'next' || stateInfo.setStateType == 'previous') {
                            var info = $ax.deepCopy(stateInfo);
                            var repeat = info.repeat;

                            // Only map it, if repeat exists.
                            if(typeof (repeat) == 'number') _repeatPanelMap[elementId] = info;
                            return _progessPanelState(elementId, info, info.repeatSkipFirst);
                        }
                        delete _repeatPanelMap[elementId];

                        // If setting to current (to stop repeat) break here
                        if(stateInfo.setStateType == 'current') return _fireAnimationFromQueue(elementId, queueTypes.setState);

                        $ax('#' + elementId).SetPanelState(stateNumber, stateInfo.options, stateInfo.showWhenSet);
                    });
                })(elementId, stateInfo);
            }
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    var _progessPanelState = function(id, info, skipFirst) {
        var direction = info.setStateType;
        var loop = info.loop;
        var repeat = info.repeat;
        var options = info.options;

        var hasRepeat = typeof (repeat) == 'number';
        var currentStateId = $ax.visibility.GetPanelState(id);
        var stateNumber = '';
        if(currentStateId != '') {
            currentStateId = $ax.repeater.getScriptIdFromElementId(currentStateId);
            var currentStateNumber = Number(currentStateId.substr(currentStateId.indexOf('state') + 5));
            if(direction == "next") {
                stateNumber = currentStateNumber + 2;

                if(stateNumber > $ax.visibility.GetPanelStateCount(id)) {
                    if(loop) stateNumber = 1;
                    else {
                        delete _repeatPanelMap[id];
                        return _fireAnimationFromQueue(id, queueTypes.setState);
                    }
                }
            } else if(direction == "previous") {
                stateNumber = currentStateNumber;
                if(stateNumber <= 0) {
                    if(loop) stateNumber = $ax.visibility.GetPanelStateCount(id);
                    else {
                        delete _repeatPanelMap[id];
                        return _fireAnimationFromQueue(id, queueTypes.setState);
                    }
                }
            }

            if(hasRepeat && _repeatPanelMap[id] != info) return _fireAnimationFromQueue(id, queueTypes.setState);

            if (!skipFirst) $ax('#' + id).SetPanelState(stateNumber, options, info.showWhenSet);
            else _fireAnimationFromQueue(id, queueTypes.setState);

            if(hasRepeat) {
                var animate = options && options.animateIn;
                if(animate && animate.easing && animate.easing != 'none' && animate.duration > repeat) repeat = animate.duration;
                animate = options && options.animateOut;
                if(animate && animate.easing && animate.easing != 'none' && animate.duration > repeat) repeat = animate.duration;

                window.setTimeout(function() {
                    // Either new repeat, or no repeat anymore.
                    if(_repeatPanelMap[id] != info) return;
                    _addAnimation(id, queueTypes.setState, function() {
                        _progessPanelState(id, info, false);
                    });
                }, repeat);
            } else delete _repeatPanelMap[id];
        }
    };

    _actionHandlers.fadeWidget = function(eventInfo, actions, index) {
        var action = actions[index];

        for(var i = 0; i < action.objectsToFades.length; i++) {
            var fadeInfo = action.objectsToFades[i].fadeInfo;
            var elementIds = $ax.getElementIdsFromPath(action.objectsToFades[i].objectPath, eventInfo);

            for(var j = 0; j < elementIds.length; j++) {
                var elementId = elementIds[j];
                // Need new scope for elementId and info
                (function(elementId, fadeInfo) {
                    _addAnimation(elementId, queueTypes.fade, function() {
                        if(fadeInfo.fadeType == "hide") {
                            $ax('#' + elementId).hide(fadeInfo.options);
                        } else if(fadeInfo.fadeType == "show") {
                            $ax('#' + elementId).show(fadeInfo.options, eventInfo);
                        } else if(fadeInfo.fadeType == "toggle") {
                            $ax('#' + elementId).toggleVisibility(fadeInfo.options);
                        }
                    });
                })(elementId, fadeInfo);
            }
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.setOpacity = function(eventInfo, actions, index) {
        var action = actions[index];

        for(var i = 0; i < action.objectsToSetOpacity.length; i++) {
            var opacityInfo = action.objectsToSetOpacity[i].opacityInfo;
            var elementIds = $ax.getElementIdsFromPath(action.objectsToSetOpacity[i].objectPath, eventInfo);

            for(var j = 0; j < elementIds.length; j++) {
                var elementId = elementIds[j];

                (function(elementId, opacityInfo) {
                    _addAnimation(elementId, queueTypes.fade, function () {
                        var oldTarget = eventInfo.targetElement;
                        eventInfo.targetElement = elementId;
                        var opacity = $ax.expr.evaluateExpr(opacityInfo.opacity, eventInfo);
                        eventInfo.targetElement = oldTarget;
                        opacity = Math.min(100, Math.max(0, opacity));
                        $ax('#' + elementId).setOpacity(opacity/100, opacityInfo.easing, opacityInfo.duration);
                    })
                })(elementId, opacityInfo);
            }
        }

        _dispatchAction(eventInfo, actions, index + 1);
    }

    _actionHandlers.moveWidget = function(eventInfo, actions, index) {
        var action = actions[index];
        for(var i = 0; i < action.objectsToMoves.length; i++) {
            var moveInfo = action.objectsToMoves[i].moveInfo;
            var elementIds = $ax.getElementIdsFromPath(action.objectsToMoves[i].objectPath, eventInfo);

            for(var j = 0; j < elementIds.length; j++) {
                var elementId = elementIds[j];
                _queueResizeMove(elementId, queueTypes.move, eventInfo, moveInfo);
                //_addMove(eventInfo, elementId, moveInfo, eventInfo.dragInfo);
            }
        }
        _dispatchAction(eventInfo, actions, index + 1);
    };

    //var _compoundChildrenShallow = function (id) {
    //    var deep = [];
    //    var children = $ax('#' + id).getChildren()[0].children;
    //    var piecePrefix = id + 'p';

    //    for (var i = 0; i < children.length; i++) {
    //        if(children[i].substring(0, id.length + 1) == piecePrefix) {
    //            deep.push(children[i]);
    //        }
    //    }
    //    return deep;
    //};

    var _addMove = function (elementId, eventInfo, moveInfo, optionsOverride) {
        var eventInfoCopy = $ax.eventCopy(eventInfo);
        var idToResizeMoveState = _getIdToResizeMoveState(eventInfoCopy);
        eventInfoCopy.targetElement = elementId;

        var options = $ax.deepCopy(moveInfo.options);
        options.easing = optionsOverride.easing;
        options.duration = optionsOverride.duration;
        options.dragInfo = eventInfo.dragInfo;

        if($ax.public.fn.IsLayer($obj(elementId).type)) {
            var childrenIds = $ax.public.fn.getLayerChildrenDeep(elementId, true);
            if(childrenIds.length == 0) return;

            var animations = [];

            // Get move delta once, then apply to all children
            animations.push({
                id: elementId,
                type: queueTypes.move,
                func: function () {
                    var layerInfo = $ax('#' + elementId).offsetBoundingRect();
                    //var layerInfo = $ax.public.fn.getWidgetBoundingRect(elementId);
                   var deltaLoc = _getMoveLoc(elementId, moveInfo, eventInfoCopy, optionsOverride.stop, idToResizeMoveState[elementId], options, layerInfo);
//                    $ax.event.raiseSyntheticEvent(elementId, "onMove");
                    $ax.visibility.pushContainer(elementId, false);

                    options.onComplete = function () {
                        _fireAnimationFromQueue(elementId, queueTypes.move);
                        $ax.visibility.popContainer(elementId, false);
                    };

                    $ax('#' + elementId).moveBy(deltaLoc.x, deltaLoc.y, options);
                }
            });

            //for(var i = 0; i < childrenIds.length; i++) {
            //    (function(childId) {
            //        animations.push({
            //            id: childId,
            //            type: queueTypes.move,
            //            func: function () {
            //                // Nop, while trying to move as container
            //                //$ax.event.raiseSyntheticEvent(childId, "onMove");
            //                //if($ax.public.fn.IsLayer($obj(childId).type)) _fireAnimationFromQueue(childId, queueTypes.move);
            //                //else $ax('#' + childId).moveBy(deltaLoc.x, deltaLoc.y, moveInfo.options);
            //            }
            //        });
            //    })(childrenIds[i]);
            //}
            _addAnimations(animations);
        } else {
            _addAnimation(elementId, queueTypes.move, function() {
                var loc = _getMoveLoc(elementId, moveInfo, eventInfoCopy, optionsOverride.stop, idToResizeMoveState[elementId], options);

//                $ax.event.raiseSyntheticEvent(elementId, "onMove");
                if(loc.moveTo) $ax('#' + elementId).moveTo(loc.x, loc.y, options);
                else $ax('#' + elementId).moveBy(loc.x, loc.y, options);
            });
        }
    };

    var _moveSingleWidget = function (elementId, delta, options, onComplete) {
        if(!delta.x && !delta.y) {
            $ax.action.fireAnimationFromQueue(elementId, $ax.action.queueTypes.move);
            if (onComplete) onComplete();
            return;
        }
        var fixedInfo = $ax.dynamicPanelManager.getFixedInfo(elementId);
        var xProp = 'left';
        var xDiff = '+=';
        if(fixedInfo) {
            if(fixedInfo.horizontal == 'right') {
                xProp = 'right';
                xDiff = '-=';
            } else if(fixedInfo.horizontal == 'center') {
                xProp = 'margin-left';
            }
        }
        var yProp = 'top';
        var yDiff = '+=';
        if(fixedInfo) {
            if(fixedInfo.vertical == 'bottom') {
                yProp = 'bottom';
                yDiff = '-=';
            } else if(fixedInfo.vertical == 'middle') {
                yProp = 'margin-top';
            }
        }

        var css = {};
        css[xProp] = xDiff + delta.x;
        css[yProp] = yDiff + delta.y;

        $ax.visibility.moveMovedLocation(elementId, delta.x, delta.y);

        var moveInfo = $ax.move.PrepareForMove(elementId, delta.x, delta.y,false, options);
        $jobjAll(elementId).animate(css, {
            duration: options.duration,
            easing: options.easing,
            queue: false,
            complete: function () {
                if(onComplete) onComplete();
                if(moveInfo.rootLayer) $ax.visibility.popContainer(moveInfo.rootLayer, false);
                $ax.dynamicPanelManager.fitParentPanel(elementId);
                $ax.action.fireAnimationFromQueue(elementId, $ax.action.queueTypes.move);
            }
        });
    }

    var _getMoveLoc = function (elementId, moveInfo, eventInfoCopy, stopInfo, comboState, options, layerInfo) {
        var moveTo = false;
        var moveWithThis = false;
        var xValue = 0;
        var yValue = 0;
        var moveResult = comboState.moveResult;
        var widgetDragInfo = eventInfoCopy.dragInfo;
        var jobj = $jobj(elementId);

        var startX;
        var startY;

        switch(moveInfo.moveType) {
        case "location":
            // toRatio is ignoring anything before start since that has already taken effect we just know whe have from start to len to finish
            //  getting to the location we want to get to.
            var toRatio = stopInfo.instant ? 1 : (stopInfo.end - stopInfo.start) / (stopInfo.len - stopInfo.start);

            // If result already caluculated, don't recalculate again, other calculate and save
            if (moveResult) {
                xValue = moveResult.x;
                yValue = moveResult.y;
            } else {
                comboState.moveResult = moveResult = { x: $ax.expr.evaluateExpr(moveInfo.xValue, eventInfoCopy), y: $ax.expr.evaluateExpr(moveInfo.yValue, eventInfoCopy) };
                xValue = moveResult.x;
                yValue = moveResult.y;
            }
            // If this is final stop for this move, then clear out the result so next move won't use it
            if(stopInfo.instant || stopInfo.end == stopInfo.len) comboState.moveResult = undefined;

            if (layerInfo) {
                startX = layerInfo.left;
                startY = layerInfo.top;
            //} else if ($ax.public.fn.isCompoundVectorHtml(jobj[0])) {
            //    var dimensions = $ax.public.fn.compoundWidgetDimensions(jobj);
            //    startX = dimensions.left;
            //    startY = dimensions.top;
            } else {
                var offsetLocation = $ax('#' + elementId).offsetLocation();
                startX = offsetLocation.left;
                startY = offsetLocation.top;
                //startX = $ax('#' + elementId).locRelativeIgnoreLayer(false);
                //startY = $ax('#' + elementId).locRelativeIgnoreLayer(true);
                if(jobj.css('position') == 'fixed') {
                    startX -= $(window).scrollLeft();
                    startY -= $(window).scrollTop();
                }
            }

            xValue = xValue == '' ? 0 : (xValue - startX) * toRatio;
            yValue = yValue == '' ? 0 : (yValue - startY) * toRatio;

            break;
        case "delta":
            var ratio = stopInfo.instant ? 1 : (stopInfo.end - stopInfo.start) / stopInfo.len;

            // See case location above
            if(moveResult) {
                xValue = moveResult.x * ratio;
                yValue = moveResult.y * ratio;
            } else {
                comboState.moveResult = moveResult = { x: $ax.expr.evaluateExpr(moveInfo.xValue, eventInfoCopy), y: $ax.expr.evaluateExpr(moveInfo.yValue, eventInfoCopy) };
                xValue = moveResult.x * ratio;
                yValue = moveResult.y * ratio;
            }
            if (stopInfo.instant || stopInfo.end == stopInfo.len) comboState.moveResult = undefined;

            break;
        case "drag":
            xValue = widgetDragInfo.xDelta;
            yValue = widgetDragInfo.yDelta;
            break;
        case "dragX":
            xValue = widgetDragInfo.xDelta;
            yValue = 0;
            break;
        case "dragY":
            xValue = 0;
            yValue = widgetDragInfo.yDelta;
            break;
        case "locationBeforeDrag":
            var location = widgetDragInfo.movedWidgets[eventInfoCopy.targetElement];
            if (location) {
                var axObj = $ax('#' + eventInfoCopy.targetElement);
                //This may require using the css value
                var viewportLocation = axObj.viewportLocation();
                xValue = location.x - viewportLocation.left;
                yValue = location.y - viewportLocation.top;
                //xValue = location.x - axObj.left();
                //yValue = location.y - axObj.top();
            } else {
                _fireAnimationFromQueue(eventInfoCopy.srcElement, queueTypes.move);
                return { x: 0, y: 0 };
            }
            //moveTo = true;
            break;
        case "withThis":
            moveWithThis = true;
            var widgetMoveInfo = $ax.move.GetWidgetMoveInfo();
            var srcElementId = $ax.getElementIdsFromEventAndScriptId(eventInfoCopy, eventInfoCopy.srcElement)[0];
            var delta = widgetMoveInfo[srcElementId];
            options.easing = delta.options.easing;
            options.duration = delta.options.duration;
            xValue = delta.x;
            yValue = delta.y;
            break;
        }

        if (options && options.boundaryExpr) {
            //$ax.public.fn.removeCompound(jobj);

            //if(jobj.css('position') == 'fixed') {
            //    //swap page coordinates with fixed coordinates
            //    options.boundaryExpr.leftExpr.value = options.boundaryExpr.leftExpr.value.replace('.top', '.topfixed').replace('.left', '.leftfixed').replace('.bottom', '.bottomfixed').replace('.right', '.rightfixed');
            //    options.boundaryExpr.leftExpr.stos[0].leftSTO.prop = options.boundaryExpr.leftExpr.stos[0].leftSTO.prop + 'fixed';
            //    options.boundaryStos.boundaryScope.direcval0.value = options.boundaryStos.boundaryScope.direcval0.value.replace('.top', '.topfixed').replace('.left', '.leftfixed').replace('.bottom', '.bottomfixed').replace('.right', '.rightfixed');
            //    options.boundaryStos.boundaryScope.direcval0.stos[0].leftSTO.prop = options.boundaryStos.boundaryScope.direcval0.stos[0].leftSTO.prop + 'fixed';
            //}

            if(moveWithThis && (xValue || yValue)) {
                _updateLeftExprVariable(options.boundaryExpr, xValue.toString(), yValue.toString());
            }

            if(!$ax.expr.evaluateExpr(options.boundaryExpr, eventInfoCopy)) {
                var boundaryStoInfo = options.boundaryStos;
                if(boundaryStoInfo) {
                    if(moveWithThis) {
                        var stoScopes = boundaryStoInfo.boundaryScope;
                        if(stoScopes) {
                            for(var s in stoScopes) {
                                var boundaryScope = stoScopes[s];
                                if(!boundaryScope.localVariables) continue;

                                if(boundaryScope.localVariables.withx) boundaryScope.localVariables.withx.value = xValue.toString();
                                if(boundaryScope.localVariables.withy) boundaryScope.localVariables.withy.value = yValue.toString();
                            }
                        }
                    }

                    if(layerInfo) {
                        startX = layerInfo.left;
                        startY = layerInfo.top;
                    } else {
                        offsetLocation = $ax('#' + elementId).offsetLocation();
                        startX = offsetLocation.left;
                        startY = offsetLocation.top;
                        //startX = $ax('#' + elementId).locRelativeIgnoreLayer(false);
                        //startY = $ax('#' + elementId).locRelativeIgnoreLayer(true);
                        if(jobj.css('position') == 'fixed') {
                            startX -= $(window).scrollLeft();
                            startY -= $(window).scrollTop();
                        }
                    }

                    if(boundaryStoInfo.ySto) {
                        var currentTop = layerInfo ? layerInfo.top : startY;
                        var newTop = $ax.evaluateSTO(boundaryStoInfo.ySto, boundaryStoInfo.boundaryScope, eventInfoCopy);
                        if(moveTo) yValue = newTop;
                        else yValue = newTop - currentTop;
                    }

                    if(boundaryStoInfo.xSto) {
                        var currentLeft = layerInfo ? layerInfo.left : startX;
                        var newLeft = $ax.evaluateSTO(boundaryStoInfo.xSto, boundaryStoInfo.boundaryScope, eventInfoCopy);
                        if(moveTo) xValue = newLeft;
                        else xValue = newLeft - currentLeft;
                    }
                }
            }

            //$ax.public.fn.restoreCompound(jobj);
        }

        return { x: Number(xValue), y: Number(yValue), moveTo: moveTo };
    };

    //we will have something like [[Target.right + withX]] for leftExpr, and this function set the value of withX
    var _updateLeftExprVariable = function (exprTree, xValue, yValue) {
        if(exprTree.leftExpr && !exprTree.leftExpr.op) {
            var localVars = exprTree.leftExpr.localVariables;
            if(localVars) {
                if(localVars.withx) localVars.withx.value = xValue;
                if(localVars.withy) localVars.withy.value = yValue;
            }
        }

        //traversal
        if(exprTree.op) {
            if(exprTree.leftExpr) _updateLeftExprVariable(exprTree.leftExpr, xValue, yValue);
            if(exprTree.rightExpr) _updateLeftExprVariable(exprTree.rightExpr, xValue, yValue);
        }
    }
    
    var widgetRotationFilter = [
        $ax.constants.IMAGE_BOX_TYPE, $ax.constants.IMAGE_MAP_REGION_TYPE, $ax.constants.DYNAMIC_PANEL_TYPE,
        $ax.constants.VECTOR_SHAPE_TYPE, $ax.constants.VERTICAL_LINE_TYPE, $ax.constants.HORIZONTAL_LINE_TYPE
    ];
    _actionHandlers.rotateWidget = function(eventInfo, actions, index) {
        var action = actions[index];

        for(var i = 0; i < action.objectsToRotate.length; i++) {
            var rotateInfo = action.objectsToRotate[i].rotateInfo;
            var elementIds = $ax.getElementIdsFromPath(action.objectsToRotate[i].objectPath, eventInfo);

            for(var j = 0; j < elementIds.length; j++) {
                var elementId = elementIds[j];
                _queueResizeMove(elementId, queueTypes.rotate, eventInfo, rotateInfo);
            }
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    var _addRotate = function (elementId, eventInfo, rotateInfo, options, moveInfo) {
        var idToResizeMoveState = _getIdToResizeMoveState(eventInfo);
        rotateInfo = $ax.deepCopy(rotateInfo);
        rotateInfo.options.easing = options.easing;
        rotateInfo.options.duration = options.duration;

        var eventInfoCopy = $ax.eventCopy(eventInfo);
        eventInfoCopy.targetElement = elementId;

        //calculate degree value at start of animation
        var rotateDegree;
        var offset = {};
        var eval = function(boundingRect) {
            rotateDegree = parseFloat($ax.expr.evaluateExpr(rotateInfo.degree, eventInfoCopy));
            offset.x = Number($ax.expr.evaluateExpr(rotateInfo.offsetX, eventInfoCopy));
            offset.y = Number($ax.expr.evaluateExpr(rotateInfo.offsetY, eventInfoCopy));
            if(!rotateInfo.options.clockwise) rotateDegree = -rotateDegree;

            _updateOffset(offset, rotateInfo.anchor, boundingRect);
        }

        if(moveInfo) {
            var moveOptions = { dragInfo: eventInfoCopy.dragInfo, duration: options.duration, easing: options.easing, boundaryExpr: moveInfo.options.boundaryExpr, boundaryStos: moveInfo.options.boundaryStos };
        }

        var obj = $obj(elementId);

        if($ax.public.fn.IsLayer(obj.type)) {
            var childrenIds = $ax.public.fn.getLayerChildrenDeep(elementId, true, true);
            if(childrenIds.length == 0) return;

            var animations = [];
            //get center point of the group, and degree delta
            var centerPoint, degreeDelta, moveDelta;
            animations.push({
                id: elementId,
                type: queueTypes.rotate,
                func: function () {
                    var boundingRect = $ax('#' + elementId).offsetBoundingRect();
                    //var boundingRect = $axure.fn.getWidgetBoundingRect(elementId);
                    eval(boundingRect);
                    centerPoint = boundingRect.centerPoint;
                    centerPoint.x += offset.x;
                    centerPoint.y += offset.y;
                    degreeDelta = _initRotateLayer(elementId, rotateInfo, rotateDegree, options, options.stop);
                    _fireAnimationFromQueue(elementId, queueTypes.rotate);

                    moveDelta = { x: 0, y: 0 };
                    if (moveInfo) {
                        moveDelta = _getMoveLoc(elementId, moveInfo, eventInfoCopy, options.moveStop, idToResizeMoveState[elementId], moveOptions, boundingRect);
                        if (moveDelta.moveTo) {
                            moveDelta.x -= $ax.getNumFromPx($jobj(elementId).css('left'));
                            moveDelta.y -= $ax.getNumFromPx($jobj(elementId).css('top'));
                        }
                        $ax.event.raiseSyntheticEvent(elementId, 'onMove');
                    }
                }
            });

            for(var idIndex = 0; idIndex < childrenIds.length; idIndex++) {
                var childId = childrenIds[idIndex];
                (function(id) {
                    var childObj = $obj(id);
                    var rotate = $.inArray(childObj.type, widgetRotationFilter) != -1;

                    var isLayer = $ax.public.fn.IsLayer(childObj.type);
                    animations.push({
                        id: id,
                        type: queueTypes.rotate,
                        func: function() {
                            $ax.event.raiseSyntheticEvent(id, "onRotate");
                            if(isLayer) _fireAnimationFromQueue(id, queueTypes.rotate);
                            else $ax('#' + id).circularMoveAndRotate(degreeDelta, options, centerPoint.x, centerPoint.y, rotate, moveDelta);
                        }
                    });
                    if(!isLayer) animations.push({ id: id, type: queueTypes.move, func: function() {} });
                })(childId);
            }

            _addAnimations(animations);
        } else {
            animations = [];
            animations.push({
                id: elementId,
                type: queueTypes.rotate,
                func: function () {
                    var jobj = $jobj(elementId);
                    var unrotatedDim = { width: $ax.getNumFromPx(jobj.css('width')), height: $ax.getNumFromPx(jobj.css('height')) };
                    eval(unrotatedDim);
                    var delta = { x: 0, y: 0 };
                    if(moveInfo) {
                        delta = _getMoveLoc(elementId, moveInfo, eventInfoCopy, options.moveStop, idToResizeMoveState[elementId], moveOptions);
                        if(delta.moveTo) {
                            delta.x -= $ax.getNumFromPx($jobj(elementId).css('left'));
                            delta.y -= $ax.getNumFromPx($jobj(elementId).css('top'));
                        }
                    }

                    $ax.event.raiseSyntheticEvent(elementId, 'onRotate');
                    if(offset.x == 0 && offset.y == 0) _rotateSingle(elementId, rotateDegree, rotateInfo.rotateType == 'location', delta, options, options.stop, true);
                    else _rotateSingleOffset(elementId, rotateDegree, rotateInfo.rotateType == 'location', delta, { x: offset.x, y: offset.y }, options, options.stop);
                    if(moveInfo) $ax.event.raiseSyntheticEvent(elementId, 'onMove');
                }
            });
            animations.push({ id: elementId, type: queueTypes.move, func: function () { } });

            _addAnimations(animations);
        }
    }

    var _updateOffset = function(offset, anchor, boundingRect) {
        if (anchor.indexOf('left') != -1) offset.x -= boundingRect.width / 2;
        if (anchor.indexOf('right') != -1) offset.x += boundingRect.width / 2;
        if (anchor.indexOf('top') != -1) offset.y -= boundingRect.height / 2;
        if (anchor.indexOf('bottom') != -1) offset.y += boundingRect.height / 2;
    }

    var _rotateSingle = function(elementId, rotateDegree, rotateTo, delta, options, stop, handleMove) {
        var degreeDelta = _applyRotateStop(rotateDegree, $ax.move.getRotationDegree(elementId), rotateTo, stop);
        $ax('#' + elementId).rotate(degreeDelta, options.easing, options.duration, false, true);
        if(handleMove) {
            if (delta.x || delta.y) _moveSingleWidget(elementId, delta, options);
            else $ax.action.fireAnimationFromQueue(elementId, $ax.action.queueTypes.move);
        }
    };

    var _rotateSingleOffset = function (elementId, rotateDegree, rotateTo, delta, offset, options, stop, resizeOffset) {
        var obj = $obj(elementId);
        var currRotation = $ax.move.getRotationDegree(elementId);

        // Need to fix offset. Want to to stay same place on widget after rotation, so need to take the offset and rotate it to where it should be.
        if(currRotation) {
            offset = $axure.fn.getPointAfterRotate(currRotation, offset, { x: 0, y: 0 });
        }

        var degreeDelta = _applyRotateStop(rotateDegree, currRotation, rotateTo, stop);
        var widgetCenter = $ax('#' + elementId).offsetBoundingRect().centerPoint;
        //var widgetCenter = $axure.fn.getWidgetBoundingRect(elementId).centerPoint;
        
        var rotate = $.inArray(obj.type, widgetRotationFilter) != -1;
        $ax('#' + elementId).circularMoveAndRotate(degreeDelta, options, widgetCenter.x + offset.x, widgetCenter.y + offset.y, rotate, delta, resizeOffset);
    }

    var _applyRotateStop = function(rotateDegree, currRotation, to, stop) {
        var degreeDelta;
        var ratio;
        if(to) {
            degreeDelta = rotateDegree - currRotation;
            ratio = stop.instant ? 1 : (stop.end - stop.start) / (stop.len - stop.start);
        } else {
            degreeDelta = rotateDegree;
            ratio = stop.instant ? 1 : (stop.end - stop.start) / stop.len;
        }

        return degreeDelta * ratio;
    }


    var _initRotateLayer = function(elementId, rotateInfo, rotateDegree, options, stop) {
        var layerDegree = $jobj(elementId).data('layerDegree');
        if (layerDegree === undefined) layerDegree = 0;
        else layerDegree = parseFloat(layerDegree);

        var to = rotateInfo.rotateType == 'location';
        var newDegree = to ? rotateDegree : layerDegree + rotateDegree;
        var degreeDelta = newDegree - layerDegree;

        var ratio = stop.instant ? 1 : (stop.end - stop.start) / (stop.len - stop.start);
        degreeDelta *= ratio;

        $jobj(elementId).data('layerDegree', newDegree);
        $ax.event.raiseSyntheticEvent(elementId, "onRotate");

        return degreeDelta;
    }

    _actionHandlers.setWidgetSize = function(eventInfo, actions, index) {
        var action = actions[index];
        for(var i = 0; i < action.objectsToResize.length; i++) {
            var resizeInfo = action.objectsToResize[i].sizeInfo;
            var objPath = action.objectsToResize[i].objectPath;
            if(objPath == 'thisItem') {
                var thisId = eventInfo.srcElement;
                var repeaterId = $ax.getParentRepeaterFromElementId(thisId);
                var itemId = $ax.repeater.getItemIdFromElementId(thisId);
                var currSize = $ax.repeater.getItemSize(repeaterId, itemId);
                var newSize = _getSizeFromInfo(resizeInfo, eventInfo, currSize.width, currSize.height);
                $ax.repeater.setItemSize(repeaterId, itemId, newSize.width, newSize.height);

                continue;
            }

            var elementIds = $ax.getElementIdsFromPath(objPath, eventInfo);

            for(var j = 0; j < elementIds.length; j++) {
                var elementId = elementIds[j];
                _queueResizeMove(elementId, queueTypes.resize, eventInfo, resizeInfo);
                //_addResize(elementId, resizeInfo);
            }
        }
        _dispatchAction(eventInfo, actions, index + 1);
    };

    // Move info undefined unless this move/resize actions are being merged
    var _addResize = function(elementId, eventInfo, resizeInfo, options, moveInfo, rotateInfo) {
        var axObject = $obj(elementId);
        resizeInfo = $ax.deepCopy(resizeInfo);
        resizeInfo.easing = options.easing;
        resizeInfo.duration = options.duration;

        var eventInfoCopy = $ax.eventCopy(eventInfo);
        eventInfoCopy.targetElement = elementId;

        var moves = moveInfo || resizeInfo.anchor != "top left" || ($ax.public.fn.IsDynamicPanel(axObject.type) &&
        ((axObject.fixedHorizontal && axObject.fixedHorizontal == 'center') || (axObject.fixedVertical && axObject.fixedVertical == 'middle'))) ||
        (rotateInfo && (rotateInfo.offsetX || rotateInfo.offsetY));

        if(moveInfo) {
            var moveOptions = { dragInfo: eventInfoCopy.dragInfo, duration: options.duration, easing: options.easing, boundaryExpr: moveInfo.options.boundaryExpr, boundaryStos: moveInfo.options.boundaryStos };
        }

        var idToResizeMoveState = _getIdToResizeMoveState(eventInfoCopy);

        var animations = [];
        if($ax.public.fn.IsLayer(axObject.type)) {
            moves = true; // Assume widgets will move will layer, even though not all widgets may move
            var childrenIds = $ax.public.fn.getLayerChildrenDeep(elementId, true, true);
            if(childrenIds.length === 0) return;
            // Need to wait to calculate new size, until time to animate, but animates are in separate queues
            //  best option seems to be to calculate in a "animate" for the layer itself and all children will use that.
            //  May just have to be redundant if this doesn't work well.

            var boundingRect, widthChangedPercent, heightChangedPercent, unchanged, deltaLoc, degreeDelta, resizeOffset;
            animations.push({
                id: elementId,
                type: queueTypes.resize,
                func: function () {
                    $ax.visibility.pushContainer(elementId, false);
                    boundingRect = $ax('#' + elementId).offsetBoundingRect();
                    //boundingRect = $ax.public.fn.getWidgetBoundingRect(elementId);
                    var size = _getSizeFromInfo(resizeInfo, eventInfoCopy, boundingRect.width, boundingRect.height, elementId);
                    deltaLoc = { x: 0, y: 0 };

                    var stop = options.stop;
                    var ratio = stop.instant ? 1 : (stop.end - stop.start) / (stop.len - stop.start);
                    widthChangedPercent = Math.round(size.width - boundingRect.width) / boundingRect.width * ratio;
                    heightChangedPercent = Math.round(size.height - boundingRect.height) / boundingRect.height * ratio;
                    resizeOffset = _applyAnchorToResizeOffset(widthChangedPercent * boundingRect.width, heightChangedPercent * boundingRect.height, resizeInfo.anchor);
                    if(stop.instant || stop.end == stop.len) idToResizeMoveState[elementId].resizeResult = undefined;

                    unchanged = widthChangedPercent === 0 && heightChangedPercent === 0;
                    $ax.event.raiseSyntheticEvent(elementId, 'onResize');
                    _fireAnimationFromQueue(elementId, queueTypes.resize);
                }
            });

            if(moveInfo) animations.push({
                id: elementId,
                type: queueTypes.move,
                func: function() {
                    deltaLoc = _getMoveLoc(elementId, moveInfo, eventInfoCopy, options.moveStop, idToResizeMoveState[elementId], moveOptions, boundingRect);
                    $ax.visibility.pushContainer(elementId, false);
                    _fireAnimationFromQueue(elementId, queueTypes.move);
                    $ax.event.raiseSyntheticEvent(elementId, 'onMove');
                }
            });
            if (rotateInfo) animations.push({
                id: elementId,
                type: queueTypes.rotate,
                func: function () {
                    resizeOffset = _applyAnchorToResizeOffset(widthChangedPercent * boundingRect.width, heightChangedPercent * boundingRect.height, resizeInfo.anchor);
                    var rotateDegree = parseFloat($ax.expr.evaluateExpr(rotateInfo.degree, eventInfoCopy));
                    degreeDelta = _initRotateLayer(elementId, rotateInfo, rotateDegree, options, options.rotateStop);
                    _fireAnimationFromQueue(elementId, queueTypes.rotate);
                    $ax.event.raiseSyntheticEvent(elementId, 'onRotate');
                }
            });

            var completeCount = childrenIds.length*2; // Because there is a resize and move complete, it needs to be doubled
            for(var idIndex = 0; idIndex < childrenIds.length; idIndex++) {
                // Need to use scoping trick here to make sure childId doesn't change on next loop
                (function(childId) {
                    //use ax obj to get width and height, jquery css give us the value without border
                    var isLayer = $ax.public.fn.IsLayer($obj(childId).type);
                    var rotate = $.inArray($obj(childId).type, widgetRotationFilter) != -1;
                    animations.push({
                        id: childId,
                        type: queueTypes.resize,
                        func: function() {
                            //$ax.event.raiseSyntheticEvent(childId, 'onResize');
                            if(isLayer) {
                                completeCount -= 2;
                                _fireAnimationFromQueue(childId, queueTypes.resize);
                                $ax.event.raiseSyntheticEvent(childId, 'onResize');
                            } else {
                                var currDeltaLoc = { x: deltaLoc.x, y: deltaLoc.y };
                                var resizeDeltaMove = { x: 0, y: 0 };
                                var css = _getCssForResizingLayerChild(childId, resizeInfo.anchor, boundingRect, widthChangedPercent, heightChangedPercent, resizeDeltaMove);
                                var onComplete = function() {
                                    if(--completeCount == 0) $ax.visibility.popContainer(elementId, false);
                                };
                                $ax('#' + childId).resize(css, resizeInfo, true, moves, onComplete);
                                if(rotateInfo) {
                                    var offset = { x: Number($ax.expr.evaluateExpr(rotateInfo.offsetX, eventInfoCopy)), y: Number($ax.expr.evaluateExpr(rotateInfo.offsetY, eventInfo)) };
                                    _updateOffset(offset, resizeInfo.anchor, boundingRect);
                                    var centerPoint = { x: boundingRect.centerPoint.x + offset.x, y: boundingRect.centerPoint.y + offset.y };
                                    $ax('#' + childId).circularMoveAndRotate(degreeDelta, options, centerPoint.x, centerPoint.y, rotate, currDeltaLoc, resizeOffset, resizeDeltaMove, onComplete);
                                } else {
                                    currDeltaLoc.x += resizeDeltaMove.x;
                                    currDeltaLoc.y += resizeDeltaMove.y;
                                    _moveSingleWidget(childId, currDeltaLoc, options, onComplete);
                                }
                            }
                        }
                    });
                    if(!isLayer) animations.push({ id: childId, type: queueTypes.move, func: function () {} });
                    if(!isLayer && rotateInfo) animations.push({ id: childId, type: queueTypes.rotate, func: function () {} });
                })(childrenIds[idIndex]);
            }
        } else {
            // Not func, obj with func
            animations.push({
                id: elementId,
                type: queueTypes.resize,
                func: function() {
                    //textarea can be resized manully by the user, but doesn't update div size yet, so doing this for now.
                    //alternatively axquery get for size can account for this

                    var sizeId = $ax.public.fn.IsTextArea(axObject.type) ? $jobj(elementId).children('textarea').attr('id') : elementId;
                    var oldSize = $ax('#' + sizeId).size();
                    var oldWidth = oldSize.width;
                    var oldHeight = oldSize.height;

                    var stop = options.stop;
                    var ratio = stop.instant ? 1 : (stop.end - stop.start) / (stop.len - stop.start);

                    var size = _getSizeFromInfo(resizeInfo, eventInfoCopy, oldWidth, oldHeight, elementId);
                    var newWidth = size.width;
                    var newHeight = size.height;
                    var deltaWidth = Math.round(newWidth - oldWidth) * ratio;
                    var deltaHeight = Math.round(newHeight - oldHeight) * ratio;
                    newWidth = oldWidth + deltaWidth;
                    newHeight = oldHeight + deltaHeight;

                    var delta = { x: 0, y: 0 };
                    if(moveInfo) {
                        delta = _getMoveLoc(elementId, moveInfo, eventInfoCopy, options.moveStop, idToResizeMoveState[elementId], moveOptions);
                        if (delta.moveTo) {
                            delta.x -= $ax.getNumFromPx($jobj(elementId).css('left'));
                            delta.y -= $ax.getNumFromPx($jobj(elementId).css('top'));
                        }
                    }

                    var rotateHandlesMove = false;
                    var offset = { x: 0, y: 0 };
                    if(rotateInfo) {
                        offset.x = Number($ax.expr.evaluateExpr(rotateInfo.offsetX, eventInfoCopy));
                        offset.y = Number($ax.expr.evaluateExpr(rotateInfo.offsetY, eventInfoCopy));
                        _updateOffset(offset, rotateInfo.anchor, $ax('#' + elementId).offsetBoundingRect());
                        //_updateOffset(offset, rotateInfo.anchor, $axure.fn.getWidgetBoundingRect(elementId));
                        rotateHandlesMove = Boolean(rotateInfo && (offset.x || offset.y || rotateInfo.anchor != 'center'));
                        $ax.event.raiseSyntheticEvent(elementId, 'onRotate');
                    }

                    var css = null;
                    var rootLayer = null;
                    if(deltaHeight != 0 || deltaWidth != 0) {
                        rootLayer = $ax.move.getRootLayer(elementId);
                        if(rootLayer) $ax.visibility.pushContainer(rootLayer, false);
                        css = _getCssForResizingWidget(elementId, eventInfoCopy, resizeInfo.anchor, newWidth, newHeight, oldWidth, oldHeight, delta, options.stop, !rotateHandlesMove);
                        idToResizeMoveState[elementId].resizeResult = undefined;
                    }

                    if(rotateInfo) {
                        var rotateDegree = parseFloat($ax.expr.evaluateExpr(rotateInfo.degree, eventInfoCopy));

                        if(rotateHandlesMove) {
                            var resizeOffset = _applyAnchorToResizeOffset(deltaWidth, deltaHeight, rotateInfo.anchor);
                            _rotateSingleOffset(elementId, rotateDegree, rotateInfo.rotateType == 'location', delta, offset, options, options.rotateStop, resizeOffset);
                        } else {
                            // Not handling move so pass in nop delta
                            _rotateSingle(elementId, rotateDegree, rotateInfo.rotateType == 'location', { x: 0, y: 0 }, options, options.rotateStop);
                            if (moves) _fireAnimationFromQueue(elementId, queueTypes.move);
                        }
                    } else if(!css && moves) _moveSingleWidget(elementId, delta, options);

                    // Have to do it down here to make sure move info is registered
                    if(moveInfo) $ax.event.raiseSyntheticEvent(elementId, 'onMove');

                    //$ax.event.raiseSyntheticEvent(elementId, 'onResize');
                    if (css) {
                        $ax('#' + elementId).resize(css, resizeInfo, true, moves, function () {
                            if(rootLayer) $ax.visibility.popContainer(rootLayer, false);
                        });
                    } else {
                        _fireAnimationFromQueue(elementId, queueTypes.resize);

                        $ax.event.raiseSyntheticEvent(elementId, 'onResize');
                    }
                }
            });
            // Nop move (move handled by resize)
            if(rotateInfo) animations.push({ id: elementId, type: queueTypes.rotate, func: function () { } });
            if(moves) animations.push({ id: elementId, type: queueTypes.move, func: function () { } });
        }

        _addAnimations(animations);
    };

    var _applyAnchorToResizeOffset = function (deltaWidth, deltaHeight, anchor) {
        var offset = {};
        if (anchor.indexOf('left') != -1) offset.x = -deltaWidth / 2;
        else if (anchor.indexOf('right') != -1) offset.x = deltaWidth / 2;
        if (anchor.indexOf('top') != -1) offset.y = -deltaHeight / 2;
        else if (anchor.indexOf('bottom') != -1) offset.y = deltaHeight / 2;

        return offset;
    }

    //var _getOldAndNewSize = function (resizeInfo, eventInfo, targetElement) {
    //    var axObject = $obj(targetElement);
    //    var oldWidth, oldHeight;
    //    //textarea can be resized manully by the user, use the textarea child to get the current size
    //    //because this new size may not be reflected on its parents yet
    //    if ($ax.public.fn.IsTextArea(axObject.type)) {
    //        var jObject = $jobj(elementId);
    //        var textObj = $ax('#' + jObject.children('textarea').attr('id'));
    //        //maybe we shouldn't use ax obj to get width and height here anymore...
    //        oldWidth = textObj.width();
    //        oldHeight = textObj.height();
    //    } else {
    //        oldWidth = $ax('#' + elementId).width();
    //        oldHeight = $ax('#' + elementId).height();
    //    }

    //    var size = _getSizeFromInfo(resizeInfo, eventInfo, oldHeight, oldWidth, elementId);
    //    return { oldWidth: oldWidth, oldHeight: oldHeight, newWidth: size.width, newHeight: size.height, change: oldWidth != size.width || oldHeight != size.height };
    //}

    var _getSizeFromInfo = function(resizeInfo, eventInfo, oldWidth, oldHeight, targetElement) {
        var oldTarget = eventInfo.targetElement;
        eventInfo.targetElement = targetElement;

        var state = _getIdToResizeMoveState(eventInfo)[targetElement];
        if(state && state.resizeResult) return state.resizeResult;

        var width = $ax.expr.evaluateExpr(resizeInfo.width, eventInfo);
        var height = $ax.expr.evaluateExpr(resizeInfo.height, eventInfo);
        eventInfo.targetElement = oldTarget;


        // If either one is not a number, use the old value
        width = width != "" ? Number(width) : oldWidth;
        height = height != "" ? Number(height) : oldHeight;

        width = isNaN(width) ? oldWidth : width;
        height = isNaN(height) ? oldHeight : height;

        // can't be negative
        var result = { width: Math.max(width, 0), height: Math.max(height, 0) };
        if(state) state.resizeResult = result;
        return result;
    }

    //var _queueResize = function (elementId, css, resizeInfo) {
    //    var resizeFunc = function() {
    //        $ax('#' + elementId).resize(css, resizeInfo, true);
    //        //$ax.public.fn.resize(elementId, css, resizeInfo, true);
    //    };
    //    var obj = $obj(elementId);
    //    var moves = resizeInfo.anchor != "top left" || ($ax.public.fn.IsDynamicPanel(obj.type) && ((obj.fixedHorizontal && obj.fixedHorizontal == 'center') || (obj.fixedVertical && obj.fixedVertical == 'middle')))
    //    if(!moves) {
    //        _addAnimation(elementId, queueTypes.resize, resizeFunc);
    //    } else {
    //        var animations = [];
    //        animations[0] = { id: elementId, type: queueTypes.resize, func: resizeFunc };
    //        animations[1] = { id: elementId, type: queueTypes.move, func: function() {}}; // Nop func - resize handles move and firing from queue
    //        _addAnimations(animations);
    //    }
    //};

    //should clean this function and 
    var _getCssForResizingWidget = function (elementId, eventInfo, anchor, newWidth, newHeight, oldWidth, oldHeight, delta, stop, handleMove) {
        var ratio = stop.instant ? 1 : (stop.end - stop.start) / (stop.len - stop.start);
        var deltaWidth = (newWidth - oldWidth) * ratio;
        var deltaHeight = (newHeight - oldHeight) * ratio;
        if(stop.instant || stop.end == stop.len) {
            var idToResizeMoveState = _getIdToResizeMoveState(eventInfo);
            if(idToResizeMoveState[elementId]) idToResizeMoveState[elementId].resizeResult = undefined;
        }

        var css = {};
        css.height = oldHeight + deltaHeight;

        var obj = $obj(elementId);
        //if it's 100% width, don't change its width
        if($ax.dynamicPanelManager.isPercentWidthPanel(obj)) var is100Dp = true;
        else css.width = oldWidth + deltaWidth;

        var jobj = $jobj(elementId);
        //if this is pinned dp, we will mantain the pin, no matter how you resize it; so no need changes left or top
        //NOTE: currently only pinned DP has position == fixed
        if(jobj.css('position') == 'fixed') {
            if(obj.fixedHorizontal && obj.fixedHorizontal == 'center') css['margin-left'] = '+=' + delta.x;
            if(obj.fixedVertical && obj.fixedVertical == 'middle') css['margin-top'] = '+=' + delta.y;
            return css;
        }

        // If it is pinned, but temporarily not fixed because it is wrappen in a container, then just make sure to anchor it correctly
        if(obj.fixedVertical) {
            if(obj.fixedVertical == 'middle') anchor = obj.fixedHorizontal;
            else anchor = obj.fixedVertical + (obj.fixedHorizontal == 'center' ? '' : ' ' + obj.fixedHorizontal);
            
        }

        //use position relative to parents
        //var position = obj.generateCompound ? $ax.public.fn.getWidgetBoundingRect(elementId) : $ax.public.fn.getPositionRelativeToParent(elementId);


        var locationShift;
        switch(anchor) {
            case "top left":
                locationShift = { x: 0, y: 0 }; break;
            case "top":
                locationShift = { x: -deltaWidth / 2.0, y: 0.0 }; break;
            case "top right":
                locationShift = { x: -deltaWidth, y: 0.0 }; break;
            case "left":
                locationShift = { x: 0.0, y: -deltaHeight / 2.0 }; break;
            case "center":
                locationShift = { x: -deltaWidth / 2.0, y: -deltaHeight / 2.0 }; break;
            case "right":
                locationShift = { x: -deltaWidth, y: -deltaHeight / 2.0 }; break;
            case "bottom left":
                locationShift = { x: 0.0, y: -deltaHeight }; break;
            case "bottom":
                locationShift = { x: -deltaWidth/2.0, y: -deltaHeight }; break;
            case "bottom right":
                locationShift = { x: -deltaWidth, y: -deltaHeight }; break;
        }

        if(handleMove) {
            if(jobj.css('position') === 'absolute') {
                css.left = $ax.getNumFromPx(jobj.css('left')) + locationShift.x + delta.x;
                css.top = $ax.getNumFromPx(jobj.css('top')) + locationShift.y + delta.y;
            } else {
                var axQuery = $ax('#' + elementId);
                var offsetLocation = axQuery.offsetLocation();
                css.left = offsetLocation.left + locationShift.x + delta.x;
                css.top = offsetLocation.top + locationShift.y + delta.y;
                //css.left = axQuery.left(true) + locationShift.x + delta.x;
                //css.top = axQuery.top(true) + locationShift.y + delta.y;
            }
        } else {
            delta.x += locationShift.x;
            delta.y += locationShift.y;
        }

        css.deltaX = locationShift.x + delta.x;
        css.deltaY = locationShift.y + delta.y;

        return css;
    };


    var _getCssForResizingLayerChild = function (elementId, anchor, layerBoundingRect, widthChangedPercent, heightChangedPercent, deltaLoc) {
        var boundingRect = $ax('#' + elementId).offsetBoundingRect();
        //var boundingRect = $ax.public.fn.getWidgetBoundingRect(elementId);
        var childCenterPoint = boundingRect.centerPoint;

        var currentSize = $ax('#' + elementId).size();
        var newWidth = currentSize.width + currentSize.width * widthChangedPercent;
        var newHeight = currentSize.height + currentSize.height * heightChangedPercent;

        var css = {};
        css.height = newHeight;

        var obj = $obj(elementId);
        //if it's 100% width, don't change its width and left
        var changeLeft = true;
        if($ax.dynamicPanelManager.isPercentWidthPanel(obj)) changeLeft = false;
        else css.width = newWidth;

        var jobj = $jobj(elementId);
        //if this is pinned dp, we will mantain the pin, no matter how you resize it; so no need changes left or top
        //NOTE: currently only pinned DP has position == fixed
        if(jobj.css('position') == 'fixed') return css;
        //use bounding rect position relative to parents to calculate delta
        //var axObj = $ax('#' + elementId);
        // This will be absolute world coordinates, but we want body coordinates.
        var offsetLocation = $ax('#' + elementId).offsetLocation();
        var currentLeft = offsetLocation.left;
        var currentTop = offsetLocation.top;
        //var currentLeft = axObj.locRelativeIgnoreLayer(false);
        //var currentTop = axObj.locRelativeIgnoreLayer(true);

        var resizable = $ax.public.fn.IsResizable(obj.type);
        if(anchor.indexOf("top") > -1) {
            var topDelta = (currentTop - layerBoundingRect.top) * heightChangedPercent;
            if(!resizable && Math.round(topDelta)) topDelta += currentSize.height * heightChangedPercent;
        } else if(anchor.indexOf("bottom") > -1) {
            if(resizable) topDelta = (currentTop - layerBoundingRect.bottom) * heightChangedPercent;
            else {
                var bottomDelta = Math.round(currentTop + currentSize.height - layerBoundingRect.bottom) * heightChangedPercent;
                if(bottomDelta) topDelta = bottomDelta - currentSize.height * heightChangedPercent;
                else topDelta = 0;
            }
        } else { //center vertical
            if(resizable) topDelta = (childCenterPoint.y - layerBoundingRect.centerPoint.y)*heightChangedPercent - currentSize.height*heightChangedPercent/2;
            else {
                var centerTopChange = Math.round(childCenterPoint.y - layerBoundingRect.centerPoint.y)*heightChangedPercent;
                if(centerTopChange > 0) topDelta = centerTopChange + Math.abs(currentSize.height * heightChangedPercent / 2);
                else if(centerTopChange < 0) topDelta = centerTopChange - Math.abs(currentSize.height * heightChangedPercent / 2);
                else topDelta = 0;
            }
        }

        if(changeLeft) {
            if(anchor.indexOf("left") > -1) {
                var leftDelta = (currentLeft - layerBoundingRect.left) * widthChangedPercent;
                if(!resizable && Math.round(leftDelta)) leftDelta += currentSize.width * widthChangedPercent;
            } else if(anchor.indexOf("right") > -1) {
                if(resizable) leftDelta = (currentLeft - layerBoundingRect.right) * widthChangedPercent;
                else {
                    var rightDelta = Math.round(currentLeft + currentSize.width - layerBoundingRect.right) * widthChangedPercent;
                    if(rightDelta) leftDelta = rightDelta - currentSize.width * widthChangedPercent;
                    else leftDelta = 0;
                }
            } else { //center horizontal
                if(resizable) leftDelta = (childCenterPoint.x - layerBoundingRect.centerPoint.x)*widthChangedPercent - currentSize.width*widthChangedPercent/2;
                else {
                    var centerLeftChange = Math.round(childCenterPoint.x - layerBoundingRect.centerPoint.x) * widthChangedPercent;
                    if(centerLeftChange > 0) leftDelta = centerLeftChange + Math.abs(currentSize.width * widthChangedPercent / 2);
                    else if(centerLeftChange < 0) leftDelta = centerLeftChange - Math.abs(currentSize.width * widthChangedPercent / 2);
                    else leftDelta = 0;
                }
            }
        }

        if(topDelta) deltaLoc.y += topDelta;
        if(leftDelta && changeLeft) deltaLoc.x += leftDelta;

        return css;
    };

    _actionHandlers.setPanelOrder = function(eventInfo, actions, index) {
        var action = actions[index];
        for(var i = 0; i < action.panelPaths.length; i++) {
            var func = action.panelPaths[i].setOrderInfo.bringToFront ? 'bringToFront' : 'sendToBack';
            var elementIds = $ax.getElementIdsFromPath(action.panelPaths[i].panelPath, eventInfo);
            for(var j = 0; j < elementIds.length; j++) $ax('#' + elementIds[j])[func]();
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.modifyDataSetEditItems = function(eventInfo, actions, index) {
        var action = actions[index];
        var add = action.repeatersToAddTo;
        var repeaters = add || action.repeatersToRemoveFrom;
        var itemId;
        for(var i = 0; i < repeaters.length; i++) {
            var data = repeaters[i];
            // Grab the first one because repeaters must have only element id, as they cannot be inside repeaters
            //  or none if unplaced
            var id = $ax.getElementIdsFromPath(data.path, eventInfo)[0];
            if(!id) continue;

            if(data.addType == 'this') {
                var scriptId = $ax.repeater.getScriptIdFromElementId(eventInfo.srcElement);
                itemId = $ax.repeater.getItemIdFromElementId(eventInfo.srcElement);
                var repeaterId = $ax.getParentRepeaterFromScriptId(scriptId);
                if(add) $ax.repeater.addEditItems(repeaterId, [itemId]);
                else $ax.repeater.removeEditItems(repeaterId, [itemId]);
            } else if(data.addType == 'all') {
                var allItems = $ax.repeater.getAllItemIds(id);
                if(add) $ax.repeater.addEditItems(id, allItems);
                else $ax.repeater.removeEditItems(id, allItems);
            } else {
                var oldTarget = eventInfo.targetElement;
                var itemIds = $ax.repeater.getAllItemIds(id);
                var itemIdsToAdd = [];
                for(var j = 0; j < itemIds.length; j++) {
                    itemId = itemIds[j];
                    eventInfo.targetElement = $ax.repeater.createElementId(id, itemId);
                    if($ax.expr.evaluateExpr(data.query, eventInfo) == "true") {
                        itemIdsToAdd[itemIdsToAdd.length] = String(itemId);
                    }
                    eventInfo.targetElement = oldTarget;
                }
                if(add) $ax.repeater.addEditItems(id, itemIdsToAdd);
                else $ax.repeater.removeEditItems(id, itemIdsToAdd);
            }
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _action.repeaterInfoNames = { addItemsToDataSet: 'dataSetsToAddTo', deleteItemsFromDataSet: 'dataSetItemsToRemove', updateItemsInDataSet: 'dataSetsToUpdate',
        addFilterToRepeater: 'repeatersToAddFilter', removeFilterFromRepeater: 'repeatersToRemoveFilter',
        addSortToRepeater: 'repeaterToAddSort', removeSortFromRepeater: 'repeaterToRemoveSort',
        setRepeaterToPage: 'repeatersToSetPage', setItemsPerRepeaterPage: 'repeatersToSetItemCount'
    };

    _actionHandlers.addItemsToDataSet = function(eventInfo, actions, index) {
        var action = actions[index];
        for(var i = 0; i < action.dataSetsToAddTo.length; i++) {
            var datasetInfo = action.dataSetsToAddTo[i];
            // Grab the first one because repeaters must have only element id, as they cannot be inside repeaters
            //  or none if unplaced
            var id = $ax.getElementIdsFromPath(datasetInfo.path, eventInfo)[0];
            if(!id || _ignoreAction(id)) continue;
            var dataset = datasetInfo.data;

            for(var j = 0; j < dataset.length; j++) $ax.repeater.addItem(id, $ax.deepCopy(dataset[j]), eventInfo);
            if(dataset.length) _addRefresh(id);
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.deleteItemsFromDataSet = function(eventInfo, actions, index) {
        var action = actions[index];
        for(var i = 0; i < action.dataSetItemsToRemove.length; i++) {
            // Grab the first one because repeaters must have only element id, as they cannot be inside repeaters
            //  or none if unplaced
            var deleteInfo = action.dataSetItemsToRemove[i];
            var id = $ax.getElementIdsFromPath(deleteInfo.path, eventInfo)[0];
            if(!id || _ignoreAction(id)) continue;
            $ax.repeater.deleteItems(id, eventInfo, deleteInfo.type, deleteInfo.rule);
            _addRefresh(id);
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.updateItemsInDataSet = function(eventInfo, actions, index) {
        var action = actions[index];
        for(var i = 0; i < action.dataSetsToUpdate.length; i++) {
            var dataSet = action.dataSetsToUpdate[i];
            // Grab the first one because repeaters must have only element id, as they cannot be inside repeaters
            //  or none if unplaced
            var id = $ax.getElementIdsFromPath(dataSet.path, eventInfo)[0];
            if(!id || _ignoreAction(id)) continue;

            $ax.repeater.updateEditItems(id, dataSet.props, eventInfo, dataSet.type, dataSet.rule);
            _addRefresh(id);
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.setRepeaterToDataSet = function(eventInfo, actions, index) {
        var action = actions[index];

        for(var i = 0; i < action.repeatersToSet.length; i++) {
            var setRepeaterInfo = action.repeatersToSet[i];
            // Grab the first one because repeaters must have only element id, as they cannot be inside repeaters
            //  or none if unplaced
            var id = $ax.getElementIdsFromPath(setRepeaterInfo.path, eventInfo)[0];
            if(!id) continue;
            $ax.repeater.setDataSet(id, setRepeaterInfo.localDataSetId);
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.addFilterToRepeater = function(eventInfo, actions, index) {
        var action = actions[index];

        for(var i = 0; i < action.repeatersToAddFilter.length; i++) {
            var addFilterInfo = action.repeatersToAddFilter[i];
            // Grab the first one because repeaters must have only element id, as they cannot be inside repeaters
            //  or none if unplaced
            var id = $ax.getElementIdsFromPath(addFilterInfo.path, eventInfo)[0];
            if(!id || _ignoreAction(id)) continue;

            $ax.repeater.addFilter(id, addFilterInfo.removeOtherFilters, addFilterInfo.label, addFilterInfo.filter, eventInfo.srcElement);
            _addRefresh(id);
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.removeFilterFromRepeater = function(eventInfo, actions, index) {
        var action = actions[index];

        for(var i = 0; i < action.repeatersToRemoveFilter.length; i++) {
            var removeFilterInfo = action.repeatersToRemoveFilter[i];
            // Grab the first one because repeaters must have only element id, as they cannot be inside repeaters
            //  or none if unplaced
            var id = $ax.getElementIdsFromPath(removeFilterInfo.path, eventInfo)[0];
            if(!id || _ignoreAction(id)) continue;

            if(removeFilterInfo.removeAll) $ax.repeater.removeFilter(id);
            else if(removeFilterInfo.filterName != '') {
                $ax.repeater.removeFilter(id, removeFilterInfo.filterName);
            }
            _addRefresh(id);
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.addSortToRepeater = function(eventInfo, actions, index) {
        var action = actions[index];

        for(var i = 0; i < action.repeatersToAddSort.length; i++) {
            var addSortInfo = action.repeatersToAddSort[i];
            // Grab the first one because repeaters must have only element id, as they cannot be inside repeaters
            //  or none if unplaced
            var id = $ax.getElementIdsFromPath(addSortInfo.path, eventInfo)[0];
            if(!id || _ignoreAction(id)) continue;

            $ax.repeater.addSort(id, addSortInfo.label, addSortInfo.columnName, addSortInfo.ascending, addSortInfo.toggle, addSortInfo.sortType);
            _addRefresh(id);
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.removeSortFromRepeater = function(eventInfo, actions, index) {
        var action = actions[index];

        for(var i = 0; i < action.repeatersToRemoveSort.length; i++) {
            var removeSortInfo = action.repeatersToRemoveSort[i];
            // Grab the first one because repeaters must have only element id, as they cannot be inside repeaters
            //  or none if unplaced
            var id = $ax.getElementIdsFromPath(removeSortInfo.path, eventInfo)[0];
            if(!id || _ignoreAction(id)) continue;

            if(removeSortInfo.removeAll) $ax.repeater.removeSort(id);
            else if(removeSortInfo.sortName != '') $ax.repeater.removeSort(id, removeSortInfo.sortName);
            _addRefresh(id);
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.setRepeaterToPage = function(eventInfo, actions, index) {
        var action = actions[index];

        for(var i = 0; i < action.repeatersToSetPage.length; i++) {
            var setPageInfo = action.repeatersToSetPage[i];
            // Grab the first one because repeaters must have only element id, as they cannot be inside repeaters
            //  or none if unplaced
            var id = $ax.getElementIdsFromPath(setPageInfo.path, eventInfo)[0];
            if(!id || _ignoreAction(id)) continue;

            var oldTarget = eventInfo.targetElement;
            eventInfo.targetElement = id;
            $ax.repeater.setRepeaterToPage(id, setPageInfo.pageType, setPageInfo.pageValue, eventInfo);
            eventInfo.targetElement = oldTarget;
            _addRefresh(id);
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.setItemsPerRepeaterPage = function(eventInfo, actions, index) {
        var action = actions[index];

        for(var i = 0; i < action.repeatersToSetItemCount.length; i++) {
            var setItemCountInfo = action.repeatersToSetItemCount[i];
            // Grab the first one because repeaters must have only element id, as they cannot be inside repeaters
            //  or none if unplaced
            var id = $ax.getElementIdsFromPath(setItemCountInfo.path, eventInfo)[0];
            if(!id || _ignoreAction(id)) continue;

            if(setItemCountInfo.noLimit) $ax.repeater.setNoItemLimit(id);
            else $ax.repeater.setItemLimit(id, setItemCountInfo.itemCountValue, eventInfo);
            _addRefresh(id);
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.refreshRepeater = function(eventInfo, actions, index) {
        // We use this as a psudo action now.
        var action = actions[index];
        for (var i = 0; i < action.repeatersToRefresh.length; i++) {
            // Grab the first one because repeaters must have only element id, as they cannot be inside repeaters
            //  or none if unplaced
            var id = $ax.getElementIdsFromPath(action.repeatersToRefresh[i], eventInfo)[0];
            if(id) _tryRefreshRepeater(id, eventInfo);
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    var _tryRefreshRepeater = function(id, eventInfo) {
        var idIndex = _repeatersToRefresh.indexOf(id);
        if(idIndex == -1) return;

        $ax.splice(_repeatersToRefresh, idIndex, 1);
        $ax.repeater.refreshRepeater(id, eventInfo);
    };

    _action.tryRefreshRepeaters = function(ids, eventInfo) {
        for(var i = 0; i < ids.length; i++) _tryRefreshRepeater(ids[i], eventInfo);
    };

    _actionHandlers.scrollToWidget = function(eventInfo, actions, index) {
        var action = actions[index];
        var elementIds = $ax.getElementIdsFromPath(action.objectPath, eventInfo);
        if(elementIds.length > 0) $ax('#' + elementIds[0]).scroll(action.options);

        _dispatchAction(eventInfo, actions, index + 1);
    };


    _actionHandlers.enableDisableWidgets = function(eventInfo, actions, index) {
        var action = actions[index];
        for(var i = 0; i < action.pathToInfo.length; i++) {
            var elementIds = $ax.getElementIdsFromPath(action.pathToInfo[i].objectPath, eventInfo);
            var enable = action.pathToInfo[i].enableDisableInfo.enable;
            for(var j = 0; j < elementIds.length; j++) $ax('#' + elementIds[j]).enabled(enable);
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.setImage = function(eventInfo, actions, index) {
        var oldTarget = eventInfo.targetElement;
        var action = actions[index];
        var view = $ax.adaptive.currentViewId;

        eventInfo.image = true;
        for(var i = 0; i < action.imagesToSet.length; i++) {
            var imgInfo = action.imagesToSet[i];
            if (view && imgInfo.adaptive[view]) imgInfo = imgInfo.adaptive[view];
            else imgInfo = imgInfo.base;
            var elementIds = $ax.getElementIdsFromPath(action.imagesToSet[i].objectPath, eventInfo);

            for(var j = 0; j < elementIds.length; j++) {
                var elementId = elementIds[j];

                eventInfo.targetElement = elementId;
                var evaluatedImgs = _evaluateImages(imgInfo, eventInfo);

                var img = evaluatedImgs.normal;
                if($ax.style.IsWidgetDisabled(elementId)) {
                    if(imgInfo.disabled) img = evaluatedImgs.disabled;
                } else if($ax.style.IsWidgetSelected(elementId)) {
                    if(imgInfo.selected) img = evaluatedImgs.selected;
                } else if($ax.event.mouseDownObjectId == elementId && imgInfo.mouseDown) img = evaluatedImgs.mouseDown;
                else if($ax.event.mouseOverIds.indexOf(elementId) != -1 && imgInfo.mouseOver) {
                    img = evaluatedImgs.mouseOver;
                    //Update mouseOverObjectId
                    var currIndex = $ax.event.mouseOverIds.indexOf($ax.event.mouseOverObjectId);
                    var imgIndex = $ax.event.mouseOverIds.indexOf(elementId);
                    if(currIndex < imgIndex) $ax.event.mouseOverObjectId = elementId;
                } else if(imgInfo.mouseOver && elementId == eventInfo.srcElement) {
                    img = evaluatedImgs.mouseOver;
                }

                //            $('#' + $ax.repeater.applySuffixToElementId(elementId, '_img')).attr('src', img);
                $jobj($ax.GetImageIdFromShape(elementId)).attr('src', img);

                //Set up overrides
                $ax.style.mapElementIdToImageOverrides(elementId, evaluatedImgs);
                $ax.style.updateElementIdImageStyle(elementId);

                if(evaluatedImgs.mouseOver || evaluatedImgs.mouseDown) $ax.event.updateIxStyleEvents(elementId);
            }
        }
        eventInfo.targetElement = oldTarget;
        eventInfo.image = false;

        _dispatchAction(eventInfo, actions, index + 1);
    };

    var _evaluateImages = function(imgInfo, eventInfo) {
        var retVal = {};
        for(var state in imgInfo) {
            if(!imgInfo.hasOwnProperty(state)) continue;
            var img = imgInfo[state][$ax.adaptive.getSketchKey()] || $ax.expr.evaluateExpr(imgInfo[state].literal, eventInfo);
            if(!img) img = $axure.utils.getTransparentGifPath();
            retVal[state] = img;
        }
        return retVal;
    };

    $ax.clearRepeaterImageOverrides = function(repeaterId) {
        var childIds = $ax.getChildElementIdsForRepeater(repeaterId);
        for(var i = childIds; i < childIds.length; i++) $ax.style.deleteElementIdToImageOverride(childIds[i]);
    };

    _actionHandlers.setFocusOnWidget = function(eventInfo, actions, index) {
        var action = actions[index];
        if(action.objectPaths.length > 0) {
            var elementIds = $ax.getElementIdsFromPath(action.objectPaths[0], eventInfo);
            if(elementIds.length > 0) {
                $ax('#' + elementIds[0]).focus();
                //if select text and not in placeholder mode, then select all text
                if(action.selectText && !$ax.placeholderManager.isActive(elementIds[0])) {
                    var elementChildren = document.getElementById(elementIds[0]).children;
                    //find the input or textarea element
                    for(var i = 0; i < elementChildren.length; i++) {
                        if (elementChildren[i].id.indexOf('_input') == -1) continue;
                        var elementTagName = elementChildren[i].tagName;
                        if(elementTagName && (elementTagName.toLowerCase() == "input" || elementTagName.toLowerCase() == "textarea")) {
                            elementChildren[i].select();
                        }
                    }
                }
            }
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.expandCollapseTree = function(eventInfo, actions, index) {
        var action = actions[index];
        for(var i = 0; i < action.pathToInfo.length; i++) {
            var pair = action.pathToInfo[i];
            var elementIds = $ax.getElementIdsFromPath(pair.treeNodePath, eventInfo);
            for(var j = 0; j < elementIds.length; j++) $ax('#' + elementIds[j]).expanded(pair.expandCollapseInfo.expand);
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.other = function(eventInfo, actions, index) {
        var action = actions[index];
        $ax.navigate({
            url: $axure.utils.getOtherPath() + "#other=" + encodeURI(action.otherDescription),
            target: "popup",
            includeVariables: false,
            popupOptions: action.popup
        });

        _dispatchAction(eventInfo, actions, index + 1);
    };

    _actionHandlers.fireEvents = function(eventInfo, actions, index) {
        var action = actions[index];
        //look for the nearest element id

        var objId = eventInfo.srcElement;
        var thisWidget = eventInfo.thiswidget;
        var obj = $ax.getObjectFromElementId(objId);
        var rdoId = obj ? $ax.getRdoParentFromElementId(objId) : "";
        var rdo = $ax.getObjectFromElementId(rdoId);
        var page = rdo ? $ax.pageData.masters[rdo.masterId] : $ax.pageData.page;

        // Check if rdo should be this
        var oldIsMasterEvent = eventInfo.isMasterEvent;
        if (obj && $ax.public.fn.IsReferenceDiagramObject(obj.type) && eventInfo.isMasterEvent) {
            rdoId = objId;
            rdo = obj;
            page = $ax.pageData.masters[rdo.masterId];
        }

        for(var i = 0; i < action.firedEvents.length; i++) {
            var firedEvent = action.firedEvents[i];
            var isPage = firedEvent.objectPath.length == 0;
            var targetObjIds = isPage ? [rdoId] : $ax.getElementIdsFromPath(firedEvent.objectPath, eventInfo);
            for (var j = 0; j < targetObjIds.length; j++) {
                var targetObjId = targetObjIds[j];
                var targetObj = isPage ? rdo : $ax.getObjectFromElementId(targetObjId);

                eventInfo.srcElement = targetObjId || '';
                eventInfo.thiswidget = $ax.getWidgetInfo(eventInfo.srcElement);

                eventInfo.isMasterEvent = false;
                var raisedEvents = firedEvent.raisedEventIds;
                if(raisedEvents) {
                    for(var k = 0; k < raisedEvents.length; k++) {
                        var event = targetObj.interactionMap && targetObj.interactionMap.raised && targetObj.interactionMap.raised[raisedEvents[k]];
                        if(event) $ax.event.handleEvent(targetObjId, eventInfo, event, false, true);
                    }
                }

                if(isPage) {
                    eventInfo.isMasterEvent = true;
                    eventInfo.label = $ax.pageData.page.name;
                    eventInfo.friendlyType = 'Page';
                }

                var firedTarget = isPage ? page : targetObj;
                var firedEventNames = firedEvent.firedEventNames;
                if(firedEventNames) {
                    for(k = 0; k < firedEventNames.length; k++) {
                        event = firedTarget.interactionMap && firedTarget.interactionMap[firedEventNames[k]];
                        if(event) $ax.event.handleEvent(isPage ? '' : targetObjId, eventInfo, event, false, true);
                    }
                }
                if(isPage) eventInfo.isMasterEvent = oldIsMasterEvent;
            }
            eventInfo.srcElement = objId;
            eventInfo.thiswidget = thisWidget;

            eventInfo.isMasterEvent = oldIsMasterEvent;
        }

        _dispatchAction(eventInfo, actions, index + 1);
    };
});
