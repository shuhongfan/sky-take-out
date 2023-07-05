
// ******* Repeater MANAGER ******** //
$axure.internal(function($ax) {
    var _repeaterManager = {};
    $ax.repeater = _repeaterManager;

    var _refreshType = _repeaterManager.refreshType = {
        reset: 1,
        persist: 2,
        preEval: 3
    };

    //This is a mapping of current editItems
    var repeaterToEditItems = {};
    //This is a mapping of current filters
    var repeaterToFilters = {};
    // This is a mapping of current sorts
    var repeaterToSorts = {};
    // This is a mapping of repeater page info
    var repeaterToPageInfo = {};

    //Hopefully this can be simplified, but for now I think 3 are needed.
    //This is the data set that is owned by this repeater. The repeater may or may not reference this data set, and others can reference it.
    var repeaterToLocalDataSet = {};
    //This is the data set referenced by the repeater. It is not a copy of the local data set, but a reference to a local data set (or eventually a global data set could be referenced).
    var repeaterToCurrentDataSet = {};
    //This is a copy of the current data set, that is replaced whenever a set or refresh is done.
    var repeaterToActiveDataSet = {};
    var _loadRepeaters = function() {
        $ax(function(obj) { 
            return $ax.public.fn.IsRepeater(obj.type);
        }).each(function(obj, repeaterId) {
            repeaterToLocalDataSet[repeaterId] = $ax.deepCopy(obj.data);
            repeaterToLocalDataSet[repeaterId].props = obj.dataProps;
            repeaterToEditItems[repeaterId] = [];

            _initPageInfo(obj, repeaterId);

            _setRepeaterDataSet(repeaterId, repeaterId);
            var initialItemIds = obj.repeaterPropMap.itemIds;
            for (var i = 0; i < initialItemIds.length; i++) $ax.addItemIdToRepeater(initialItemIds[i], repeaterId);
            $ax.visibility.initRepeater(repeaterId);
        });
    };
    _repeaterManager.loadRepeaters = _loadRepeaters;

    var fullRefresh = {};
    var repeatersReady = false;
    var _initRepeaters = function () {
        repeatersReady = true;
        $ax(function(obj, repeaterId) {
            return $ax.public.fn.IsRepeater(obj.type);
        }).each(function(obj, repeaterId) {
            _refreshRepeater(repeaterId, undefined, _refreshType.reset, !fullRefresh[repeaterId]);
            //// Fix selected and default if necessary
            //var states = obj.evaluatedStates[repeaterId];
            //if(!states) return; // If there are no evaluated states the repeater id key could not be mapped to an array of states.

            //for(var i = 0; i < states.length; i++) {
            //    var state = states[i];

            //    $ax.style.SetWidgetEnabled(state.id, true); // So selected will take place. If disabled, selected wouldn't happen.
            //    $ax.style.SetWidgetSelected(state.id, state.selected);
            //    $ax.style.SetWidgetEnabled(state.id, !state.disabled);
            //}
        });
    };
    _repeaterManager.initRefresh = _initRepeaters;

    var repeatersHaveNewDataSet = [];
    var _setRepeaterDataSet = function(repeaterId, dataSetId) {
        //TODO: No idea about how global data sets will be handled...
        repeaterToCurrentDataSet[repeaterId] = repeaterToLocalDataSet[dataSetId];
        repeaterToActiveDataSet[repeaterId] = getActiveDataSet(repeaterId);
        repeaterToFilters[repeaterId] = [];
        repeaterToSorts[repeaterId] = [];


        // Not using this currently
        //        if(repeatersHaveNewDataSet.indexOf(repeaterId) == -1) repeatersHaveNewDataSet[repeatersHaveNewDataSet.length] = repeaterId;
    };
    _repeaterManager.setDataSet = _setRepeaterDataSet;

    var _refreshRepeater = function(repeaterId, eventInfo, refreshType, itemsPregen) {
        if(!refreshType) refreshType = _refreshType.reset; // Set default
        if(!repeatersReady) {
            fullRefresh[repeaterId] = true;
            return;
        }

        // Reset selected/disabled dictionaries upon reset, if necessary (reset must, persist can't, and preeval doesn't care because it hasn't been set up yet.
        if(refreshType == _refreshType.reset) $ax.style.clearStateForRepeater(repeaterId);

        // Don't show if you have a parent rdos thats limboed.
        var rdoPath = $ax.getPathFromScriptId(repeaterId);
        // Check each parent rdo through appropriate views to see if you are limboed
        while (rdoPath.length > 0) {
            if(!$ax.getScriptIdFromPath(rdoPath)) {
                removeItems(repeaterId);
                return;
            }

            $ax.splice(rdoPath, rdoPath.length - 1, 1);
        }
        
        $ax.action.refreshStart(repeaterId);
        $ax.style.ClearCacheForRepeater(repeaterId);

        if($ax.visibility.limboIds[repeaterId]) {
            removeItems(repeaterId);
            $ax.dynamicPanelManager.fitParentPanel(repeaterId);
            return;
        }

        // Remove delete map if there is one at this point
        if(eventInfo && eventInfo.repeaterDeleteMap) delete eventInfo.repeaterDeleteMap[repeaterId];
        var path = $ax.getPathFromScriptId(repeaterId);
        path.pop();

        if(eventInfo) {
            eventInfo = $ax.eventCopy(eventInfo);
        }

        var obj = $ax.getObjectFromScriptId(repeaterId);
        var propMap = obj.repeaterPropMap;

        //If there is no wrap, then set it to be above the number of rows
        var viewId = $ax.adaptive.currentViewId || '';
        var wrap = _getAdaptiveProp(propMap, 'wrap', viewId, repeaterId, obj);
        var vertical = _getAdaptiveProp(propMap, 'vertical', viewId, repeaterId, obj);
        //var offset = propMap[viewId];
        var offset = propMap[_getViewIdFromPageViewId(viewId, repeaterId, obj)];

        // Right now pregen only works for default adaptive view
        if(viewId) itemsPregen = false;
        var orderedIds = [];
        if(itemsPregen) {
            var repeaterChildren = $jobj(repeaterId).children();
            // Start at 1 to skip script div child
            for(var i = 1; i < repeaterChildren.length; i++) {
                orderedIds.push(_getItemIdFromElementId($(repeaterChildren[i]).attr('id')));
            }
        } else orderedIds = getOrderedIds(repeaterId, eventInfo);
        var ids = [];
        var background = _getAdaptiveProp(propMap, 'backColor', viewId, repeaterId, obj);
        var hasAltColor = _getAdaptiveProp(propMap, 'hasAltColor', viewId, repeaterId, obj);
        var altColor = hasAltColor ? _getAdaptiveProp(propMap, 'altColor', viewId, repeaterId, obj) : undefined;
        var useAlt = false;

        if(itemsPregen) {
            var start = 0;
            var end = orderedIds.length;
        } else {
            var bounds = _getVisibleDataBounds(repeaterToPageInfo[repeaterId], itemsPregen ? obj.data.length : orderedIds.length);
            start = bounds[0];
            end = bounds[1];
        }

        var repeaterObj = $jobj(repeaterId);
        var preevalMap = {};

        var shownCount = end - start;
        var primaryCount = wrap == -1 ? shownCount : Math.min(shownCount, wrap);
        var secondaryCount = wrap == -1 ? 1 : Math.ceil(shownCount / wrap);
        var widthCount = vertical ? secondaryCount : primaryCount;
        var heightCount = vertical ? primaryCount : secondaryCount;
        var paddingTop = _getAdaptiveProp(propMap, 'paddingTop', viewId, repeaterId, obj);
        var paddingLeft = _getAdaptiveProp(propMap, 'paddingLeft', viewId, repeaterId, obj);
        var paddingY = paddingTop + _getAdaptiveProp(propMap, 'paddingBottom', viewId, repeaterId, obj);
        var paddingX = paddingLeft + _getAdaptiveProp(propMap, 'paddingRight', viewId, repeaterId, obj);

        var spacingX = _getAdaptiveProp(propMap, 'horizontalSpacing', viewId, repeaterId, obj);
        var xOffset = offset.width + spacingX;
        var spacingY = _getAdaptiveProp(propMap, 'verticalSpacing', viewId, repeaterId, obj);
        var yOffset = offset.height + spacingY;
        var repeaterSize = { width: paddingX, height: paddingY };
        repeaterSize.width += offset.width + (widthCount - 1) * xOffset;
        repeaterSize.height += offset.height + (heightCount - 1) * yOffset;
        $ax.visibility.setResizedSize(repeaterId, repeaterSize.width, repeaterSize.height);

        if(itemsPregen) {
            var templateIds = [repeaterId];
            var processScriptIds = function (full, prop, id) {
                if(id.indexOf('_') <= 0 && id.indexOf('p') == -1) templateIds.push('u' + id);
            };
            $('#' + repeaterId + '_script').html().replace(/(id|for)="?u([0-9]+(p([0-9]){3})?(_[_a-z0-9]*)?)"?/g, processScriptIds);
            for(var i = 0; i < templateIds.length; i++) {
                for(var j = 0; j < orderedIds.length; j++) {
                    ids.push(_createElementId(templateIds[i], orderedIds[j]));
                }
            }

            for(var pos = start; pos < end; pos++) {
                var itemId = orderedIds[pos];
                itemElementId = _createElementId(repeaterId, itemId);
                var jobj = $jobj(itemElementId);
                if(jobj.hasClass('preeval')) refreshType = _refreshType.preEval;
                for(var i = 0; i < templateIds.length; i++) $ax.initializeObjectEvents($ax('#' + _createElementId(templateIds[i], itemId)), refreshType);
                if(refreshType == _refreshType.preEval) {
                    preevalMap[itemId] = true;
                    jobj.removeClass('preeval');
                }

                $ax.visibility.setResizedSize(itemElementId, $ax.getNumFromPx(jobj.css('width')), $ax.getNumFromPx(jobj.css('height')));
                $ax.visibility.setMovedLocation(itemElementId, $ax.getNumFromPx(jobj.css('left')), $ax.getNumFromPx(jobj.css('top')));
            }
        } else {
            var html = $('#' + repeaterId + '_script').html();

            var div = $('<div></div>');
            div.html(html);
            div.find('.' + $ax.visibility.HIDDEN_CLASS).removeClass($ax.visibility.HIDDEN_CLASS);
            div.find('.' + $ax.visibility.UNPLACED_CLASS).removeClass($ax.visibility.UNPLACED_CLASS);
            div.css({
                width: offset.width,
                height: offset.height
            });

            _applyColorCss(background, div);
            var altDiv = div;
            if(hasAltColor) altDiv = _applyColorCss(altColor, div.clone());

            // Hide repeater, if shown, while updating.
            var shown = $ax.visibility.IsIdVisible(repeaterId);
            if(shown) document.getElementById(repeaterId).style.visibility = 'hidden';

            //clean up old items as late as possible
            removeItems(repeaterId);
            resetItemSizes(repeaterId, offset, bounds, orderedIds, vertical, wrap);

            var i = 0;
            var startTop = paddingTop;
            var startLeft = paddingLeft;
            if(repeaterObj.css('box-sizing') == 'border-box') {
                startTop -= $ax.getNumFromPx(repeaterObj.css('border-top-width')) || 0;
                startLeft -= $ax.getNumFromPx(repeaterObj.css('border-left-width')) || 0;
            }
            var top = startTop;
            var left = startLeft;
            for(pos = start; pos < end; pos++) {
                itemId = orderedIds[pos];

                var itemElementId = _createElementId(repeaterId, itemId);
                $ax.addItemIdToRepeater(itemId, repeaterId);

                ids.push(itemElementId);
                var processId = function(full, prop, id) {
                    var elementId = _createElementId('u' + id, itemId);
                    //If there is a suffix (ex. _img), then don't push the id.
                    if (id.indexOf('_') <= 0 && id.indexOf('p') == -1) ids.push(elementId);
                    return prop + '="' + elementId + '"';
                };

                var copy = (useAlt ? altDiv : div).clone();
                useAlt = !useAlt;
                copy.attr('id', itemElementId);
                copy.html(div.html().replace(/(id|for)="?u([0-9]+(p([0-9]){3})?(_[_a-z0-9]*)?)"?/g, processId));
                if(obj.repeaterPropMap.isolateRadio) {
                    var radioButtons = copy.find(':radio');
                    for(var radioIndex = 0; radioIndex < radioButtons.length; radioIndex++) {
                        var radio = $(radioButtons[radioIndex]);
                        var oldName = radio.attr('name') || '';
                        // Can't use create element id because there could be an underscore in name
                        if(oldName) radio.attr('name', oldName + '-' + itemId);
                    }
                }
                

                copy.css({
                    'position': 'absolute',
                    'top': top + 'px',
                    'left': left + 'px',
                    'width': obj.width + 'px',
                    'height': obj.height + 'px'
                });
                $('#' + repeaterId).append(copy);
                $ax.visibility.setResizedSize(itemElementId, offset.width, offset.height);
                $ax.visibility.setMovedLocation(itemElementId, left, top);

                i++;
                if(wrap != -1 && i % wrap == 0) {
                    if(vertical) {
                        top = startTop;
                        left += xOffset;
                    } else {
                        left = startLeft;
                        top += yOffset;
                    }
                } else if (vertical) top += yOffset;
                else left += xOffset;
            }

            repeaterObj.css(repeaterSize);

            // Had to move this here because it sets up cursor: pointer on inline links,
            // but must be done before style cached when adaptive view is set.
            // TODO: Should be able to combine this with initialization done in pregen items. Just need to have ids and template ids be the same.
            for (var i = 0; i < ids.length; i++) {
                var id = ids[i];
                var childJobj = $jobj(id);
                if (obj.repeaterPropMap.isolateSelection && childJobj.attr('selectiongroup')) {
                    childJobj.attr('selectiongroup', _createElementId(childJobj.attr('selectiongroup'), _getItemIdFromElementId(id)));
                }
                $ax.initializeObjectEvents($ax('#' + id), refreshType);
            }
        }

        var query = _getItemQuery(repeaterId);
        if(viewId) $ax.adaptive.applyView(viewId, query);
        else $ax.visibility.resetLimboAndHiddenToDefaults(_getItemQuery(repeaterId, preevalMap));

        $ax.annotation.createFootnotes(query, true);

        for(var index = 0; index < ids.length; index++) {
            id = ids[index];
            
            if ($ax.ieColorManager) $ax.ieColorManager.applyBackground($ax('#' + id));
            //$ax.style.initializeObjectTextAlignment($ax('#' + id));
            $ax.applyHighlight($ax('#' + id), true);
        }

        $ax.messageCenter.startCombineEventMessages();
        $ax.cacheRepeaterInfo(repeaterId, $ax.getWidgetInfo(repeaterId));

        //$ax.style.startSuspendTextAlignment();
        // Now load
        for(pos = start; pos < end; pos++) {
            itemId = orderedIds[pos];
            itemElementId = _createElementId(repeaterId, itemId);
            if(!preevalMap[orderedIds[pos]]) $ax.event.raiseSyntheticEvent(itemElementId, 'onItemLoad', true);
            $ax.loadDynamicPanelsAndMasters(obj.objects, path, itemId);
        }
        //$ax.style.resumeSuspendTextAlignment();

        $ax.removeCachedRepeaterInfo(repeaterId);
        $ax.messageCenter.endCombineEventMessages();

        // Reshow repeater if it was originally shown (load is complete by now)
        if(shown && !itemsPregen) document.getElementById(repeaterId).style.visibility = 'inherit';

        $ax.dynamicPanelManager.fitParentPanel(repeaterId);

        // Need to reapply the state style after refresh for text styles, and for applying a non-default style that wasn't reset for certain refreshes (adaptive changed for example). This could be way more selective but doing a safe change for the moment
        if(refreshType != _refreshType.preEval) $ax.style.updateStateClass(repeaterId);

        // Right now we assume only one refresh at a time. If we can manually trigger refreshes, that may possibly change.
        $ax.action.refreshEnd();
    };
    _repeaterManager.refreshRepeater = _refreshRepeater;

    var _getItemQuery = function(repeaterId, preevalMap) {
        var query = $ax(function (diagramObject, elementId) {
            // Also need to check that this in not preeval
            if(preevalMap) {
                var itemId = _getItemIdFromElementId(elementId);
                if(preevalMap[itemId]) return false;
            }

            // All objects with the repeater as their parent, except the repeater itself.
            var scriptId = _getScriptIdFromElementId(elementId);
            return $ax.getParentRepeaterFromScriptId(scriptId) == repeaterId && scriptId != repeaterId;
        });

        return query;
    }

    _repeaterManager.refreshAllRepeaters = function() {
        $ax('*').each(function(diagramObject, elementId) {
            if(!$ax.public.fn.IsRepeater(diagramObject.type)) return;
            if($ax.visibility.isElementIdLimboOrInLimboContainer(elementId)) return;
            _initPageInfo(diagramObject, elementId);
            _refreshRepeater(elementId, $ax.getEventInfoFromEvent($ax.getjBrowserEvent()), _refreshType.persist);
        });
    };

    _repeaterManager.refreshRepeaters = function(ids, eventInfo) {
        for(var i = 0; i < ids.length; i++) _refreshRepeater(ids[i], eventInfo);
    };

    var _initPageInfo = function(obj, elementId) {
        var pageInfo = {};
        var map = obj.repeaterPropMap;

        var currentViewId = $ax.adaptive.currentViewId || '';
        var itemsPerPage = _getAdaptiveProp(map, 'itemsPerPage', currentViewId, elementId, obj);
        if(itemsPerPage == -1) pageInfo.noLimit = true;
        else {
            pageInfo.itemsPerPage = itemsPerPage;
            pageInfo.currPage = _getAdaptiveProp(map, 'currPage', currentViewId, elementId, obj);
        }
        repeaterToPageInfo[elementId] = pageInfo;
    };

    _repeaterManager.initialize = function() {
        $ax(function (obj) {
            return $ax.public.fn.IsRepeater(obj.type);
        }).each(function (obj, repeaterId) {
            _initPregen(repeaterId);
        });
    }

    var _initPregen = function(repeaterId) {
        var obj = $ax.getObjectFromScriptId(repeaterId);
        var propMap = obj.repeaterPropMap;

        //If there is no wrap, then set it to be above the number of rows
        var viewId = $ax.adaptive.currentViewId || '';
        var wrap = _getAdaptiveProp(propMap, 'wrap', viewId, repeaterId, obj);
        var vertical = _getAdaptiveProp(propMap, 'vertical', viewId, repeaterId, obj);

        var orderedIds = [];
        var ids = [];
        var background = _getAdaptiveProp(propMap, 'backColor', viewId, repeaterId, obj);
        var hasAltColor = _getAdaptiveProp(propMap, 'hasAltColor', viewId, repeaterId, obj);
        var altColor = hasAltColor ? _getAdaptiveProp(propMap, 'altColor', viewId, repeaterId, obj) : undefined;
        var useAlt = false;

        var bounds = _getVisibleDataBounds(repeaterToPageInfo[repeaterId], obj.data.length);
        var start = bounds[0];
        var end = bounds[1];

        // Starts empty
        if(start == end) {
            $ax.action.refreshEnd(repeaterId);
            return;
        }
        var unprocessedBaseIds = $jobj($ax.repeater.createElementId(repeaterId, start + 1)).html().match(/(id|for)="?u([0-9]+)/g);
        var baseIds = [];
        if(unprocessedBaseIds) {
            for(var i = 0; i < unprocessedBaseIds.length; i++) {
                var val = unprocessedBaseIds[i].split('=')[1].substr(1);
                if(baseIds.indexOf(val) == -1) baseIds.push(val);
            }
        }

        for(var itemNum = start; itemNum < end; itemNum++) {
            ids.push($ax.repeater.createElementId(repeaterId, itemNum + 1));
            for(i = 0; i < baseIds.length; i++) ids.push($ax.repeater.createElementId(baseIds[i], itemNum + 1));
            var itemId = itemNum + 1;
            orderedIds[itemNum] = itemId;

            var itemDiv = $jobj($ax.repeater.createElementId(repeaterId, itemNum + 1));
            _applyColorCss(useAlt ? altColor : background, itemDiv);
            if(hasAltColor) useAlt = !useAlt;
        }

        resetItemSizes(repeaterId, undefined, bounds, orderedIds, vertical, wrap);
    };

    var _applyColorCss = function(json, div) {
        var args = json.r + ', ' + json.g + ', ' + json.b;
        var background = json.a == 0 ? '' : json.a == 1 ? 'rgb(' + args + ')' : 'rgba(' + args + ', ' + json.a + ')';
        if($ax.ieColorManager && json.a != 0 && json.a != 1) {
            var ieColor = $ax.ieColorManager.getColorFromArgb(json.a * 255, json.r, json.g, json.b, true);
            if(ieColor) background = ieColor;
        }
        div.css('background-color', background);
        return div;
    };

    var _getViewIdFromPageViewId = function (pageViewId, id, diagramObject) {
        if (diagramObject.owner.type != 'Axure:Master') {
            return pageViewId;
        } else {
            var parentRdoId = $ax('#' + id).getParents(true, ['rdo'])[0][0];
            var rdoState = $ax.style.generateState(parentRdoId);
            var rdoStyle = $ax.style.computeFullStyle(parentRdoId, rdoState, pageViewId);
            var viewOverride = rdoStyle.viewOverride;
            return viewOverride;
        }
    }

    var _getAdaptiveProp = _repeaterManager.getAdaptiveProp = function (map, prop, viewId, repeaterId, repeaterObj) {
        var viewChain = $ax.style.getViewIdChain(viewId, repeaterId, repeaterObj);

        for(var i = viewChain.length - 1; i >= 0; i--) {
            viewId = viewChain[i];
            var viewProps = map[viewId];
            if(viewProps.hasOwnProperty(prop)) return viewProps[prop];
        }

        var base = repeaterObj.owner.type != 'Axure:Master' ? map[''] : map['19e82109f102476f933582835c373474'];
        if(base.hasOwnProperty(prop)) return base[prop];
        return map['default'][prop];
    };

    _repeaterManager.getItemCount = function(repeaterId) {
        var data = repeaterToActiveDataSet[repeaterId].length;
        var info = repeaterToPageInfo[repeaterId];
        if(!info.noLimit) {
            var start = Math.min(data, info.itemsPerPage * info.currPage);
            var end = Math.min(data, start + info.itemsPerPage);
            data = end - start;
        }
        return data;
    };

    _repeaterManager.setDisplayProps = function(obj, repeaterId, itemIndex) {
        var data = repeaterToActiveDataSet[repeaterId];
        var info = repeaterToPageInfo[repeaterId];
        var start = 0;
        var end = data.length;
        if(!info.noLimit) {
            start = Math.min(end, info.itemsPerPage * (info.currPage - 1));
            end = Math.min(end, start + info.itemsPerPage);
        }
        var count = end - start;
        var index = -1;
        for(var i = 0; i < count; i++) {
            if(data[start + i].index == itemIndex) index = i + 1;
        }
        if(index == -1) return;
        obj.index = index;
        obj.isfirst = index == 1;
        obj.islast = index == end - start;
        obj.iseven = index % 2 == 0;
        obj.isodd = index % 2 == 1;
    };

    var _getVisibleDataBounds = function(pageInfo, count) {
        var retval = [0, count];
        if(!pageInfo.noLimit) {
            var end = pageInfo.itemsPerPage * pageInfo.currPage;
            var start = end - pageInfo.itemsPerPage;

            // If past the end, move to last page
            if(start >= count) {
                pageInfo.currPage = Math.floor((count - 1) / pageInfo.itemsPerPage) + 1;
                if(pageInfo.currPage <= 0) pageInfo.currPage = 1;

                end = pageInfo.itemsPerPage * pageInfo.currPage;
                start = end - pageInfo.itemsPerPage;
            }
            end = Math.min(end, count);
            retval[0] = start;
            retval[1] = end;
        }
        return retval;
    };

    _repeaterManager.getVisibleDataCount = function(repeaterId) {
        var bounds = _getVisibleDataBounds(repeaterToPageInfo[repeaterId], repeaterToActiveDataSet[repeaterId].length);
        return bounds[1] - bounds[0];
    };

    _repeaterManager.getDataCount = function(repeaterId) {
        return repeaterToCurrentDataSet[repeaterId].length;
    };

    var _getFilteredDataCount = _repeaterManager.getFilteredDataCount = function(repeaterId) {
        return repeaterToActiveDataSet[repeaterId].length;
    };

    _repeaterManager.getPageCount = function(repeaterId) {
        var info = repeaterToPageInfo[repeaterId];
        return info.noLimit ? 1 : Math.ceil(_getFilteredDataCount(repeaterId) / info.itemsPerPage);
    };

    _repeaterManager.getPageIndex = function(repeaterId) {
        var info = repeaterToPageInfo[repeaterId];
        return info.noLimit ? 1 : info.currPage;
    };

    var getActiveDataSet = function(repeaterId) {
        var active = $ax.deepCopy(repeaterToCurrentDataSet[repeaterId]);
        // Set up 1 indexing each item.
        for(var i = 0; i < active.length; i++) active[i].index = i + 1;
        return active;
    };

    var getOrderedIds = function(repeaterId, eventInfo) {
        var data = repeaterToActiveDataSet[repeaterId] = getActiveDataSet(repeaterId);

        // Filter first so less to sort
        applyFilter(repeaterId, data, eventInfo);

        // Sort next
        var sorts = repeaterToSorts[repeaterId] || [];
        if(sorts.length != 0 && data.length > 1) {
            // TODO: Make this generic and factor out if we want to use it elsewhere...
            // Compare is a function that takes 2 arguments, and returns a number. A high number means the second should go first
            // Otherwise the first stays first.
            var mergesort = function(list, start, end, compare) {
                var middle = Math.floor((start + end) / 2);
                if(middle - start > 1) mergesort(list, start, middle, compare);
                if(end - middle > 1) mergesort(list, middle, end, compare);
                var index1 = start;
                var index2 = middle;
                var tempList = [];
                while(index1 < middle && index2 < end) {
                    tempList[tempList.length] = list[compare(list[index1], list[index2]) > 0 ? index2++ : index1++];
                }
                while(index1 < middle) tempList[tempList.length] = list[index1++];
                while(index2 < end) tempList[tempList.length] = list[index2++];

                // transfer from temp list to the real list.
                for(var i = 0; i < tempList.length; i++) list[start + i] = tempList[i];
            };
            // Compare is the tie breaking function to us if necessary.
            var getComparator = function(columnName, ascending, type, compare) {
                // If this needs to be sped up, break up into several smaller functions conditioned off of type
                return function(row1, row2) {
                    // If column undefined have it be empty string, NaN, or invalid date
                    //// If column undefined, no way to measure this, so call it a tie.
                    //if(row1[columnName] === undefined || row2[columnName] === undefined) return 0;

                    var text1 = (row1[columnName] && row1[columnName].text) || '';
                    var text2 = (row2[columnName] && row2[columnName].text) || '';

                    // This means we are case insensitive, so lowercase everything to kill casing
                    if(type == 'Text') {
                        text1 = text1.toLowerCase();
                        text2 = text2.toLowerCase();
                    }

                    //If tied, go to tie breaker
                    if(text1 == text2) {
                        if(compare) return compare(row1, row2);
                        // Actually a tie.
                        return 0;
                    }
                    if(type == 'Text' || type == 'Text (Case Sensitive)') {
                        if(text1 < text2 ^ ascending) return 1;
                        else return -1;
                    } else if(type == 'Number') {
                        var num1 = text1 == '' ? NaN : Number(text1);
                        var num2 = text2 == '' ? NaN : Number(text2);

                        if(isNaN(num1) && isNaN(num2)) return 0;
                        if(isNaN(num1) || isNaN(num2)) return isNaN(num1) ? 1 : -1;
                        if(num1 < num2 ^ ascending) return 1;
                        else return -1;
                    } else if(type == 'Date - YYYY-MM-DD' || type == 'Date - MM/DD/YYYY') {
                        var func = type == 'Date - YYYY-MM-DD' ? getDate1 : getDate2;
                        var date1 = func(text1);
                        var date2 = func(text2);
                        if(!date1.valid && !date2.valid) return 0;
                        if(!date1.valid || !date2.valid) return date1.valid ? -1 : 1;
                        var diff = date2.year - date1.year;
                        if(diff == 0) diff = date2.month - date1.month;
                        if(diff == 0) diff = date2.day - date1.day;
                        if(diff == 0) return 0;
                        return diff > 0 ^ ascending ? 1 : -1;
                    }
                    console.log('unhandled sort type');
                    return 0;
                };
            };
            var compareFunc = null;
            for(var i = 0; i < sorts.length; i++) compareFunc = getComparator(sorts[i].columnName, sorts[i].ascending, sorts[i].sortType, compareFunc);

            mergesort(data, 0, data.length, compareFunc);
        }

        var ids = [];
        for(i = 0; i < data.length; i++) ids[i] = data[i].index;

        return ids;
    };

    var getDate1 = function(text) {
        var date = { valid: false };
        var sections = text.split('-');
        if(sections.length == 1) sections = text.split('/');
        if(sections.length != 3) return date;
        date.year = Number(sections[0]);
        date.month = Number(sections[1]);
        date.day = Number(sections[2]);
        date.valid = !isNaN(date.year);
        date.valid &= !isNaN(date.month) && date.month > 0 && date.month <= 12;
        date.valid &= !isNaN(date.day) && date.day > 0 && date.day <= daysPerMonth(date.month, date.year);
        return date;
    };

    var getDate2 = function(text) {
        var date = { valid: false };
        var sections = text.split('-');
        if(sections.length == 1) sections = text.split('/');
        if(sections.length != 3) return date;
        date.month = Number(sections[0]);
        date.day = Number(sections[1]);
        date.year = Number(sections[2]);
        date.valid = !isNaN(date.year);
        date.valid &= !isNaN(date.month) && date.month > 0 && date.month <= 12;
        date.valid &= !isNaN(date.day) && date.day > 0 && date.day <= daysPerMonth(date.month, date.year);
        return date;
    };

    var daysPerMonth = function(month, year) {
        if(month == 9 || month == 4 || month == 6 || month == 11) return 30;
        if(month != 2) return 31;

        if(year % 4 != 0) return 28;
        if(year % 100 != 0) return 29;
        return year % 400 == 0 ? 29 : 28;
    };

    var applyFilter = function(repeaterId, data, eventInfo) {
        var dataFiltered = [];
        var filters = repeaterToFilters[repeaterId] || [];
        if (filters.length != 0) {
            if(!eventInfo) eventInfo = $ax.getBasicEventInfo();
            var oldTarget = eventInfo.targetElement;
            var oldSrc = eventInfo.srcElement;
            var oldThis = eventInfo.thiswidget;
            var oldItem = eventInfo.item;

            var idToWidgetInfo = {};

            outer:
            for(var i = 1; i <= data.length; i++) {
                for(var j = 0; j < filters.length; j++) {
                    eventInfo.targetElement = _createElementId(repeaterId, i);
                    eventInfo.srcElement = filters[j].thisId;
                    if(!idToWidgetInfo[eventInfo.srcElement]) idToWidgetInfo[eventInfo.srcElement] = $ax.getWidgetInfo(eventInfo.srcElement);
                    eventInfo.thiswidget = idToWidgetInfo[eventInfo.srcElement];
                    eventInfo.item = $ax.getItemInfo(eventInfo.srcElement);

                    if($ax.expr.evaluateExpr(filters[j].filter, eventInfo) != 'true') continue outer;
                }
                dataFiltered[dataFiltered.length] = data[i - 1];
            }

            for(i = 0; i < dataFiltered.length; i++) data[i] = dataFiltered[i];
            while(data.length > dataFiltered.length) data.pop();

            eventInfo.targetElement = oldTarget;
            eventInfo.srcElement = oldSrc;
            eventInfo.thiswidget = oldThis;
            eventInfo.item = oldItem;
        }
    };

    var _addFilter = function(repeaterId, removeOtherFilters, label, filter, thisId) {
        if(removeOtherFilters) _removeFilter(repeaterId);
        
        var filterList = repeaterToFilters[repeaterId];
        if(!filterList) repeaterToFilters[repeaterId] = filterList = [];

        var filterObj = { filter: filter, thisId: thisId };
        if(label) filterObj.label = label;
        filterList[filterList.length] = filterObj;
    };
    _repeaterManager.addFilter = _addFilter;

    var _removeFilter = function(repeaterId, label) {
        var filterList = repeaterToFilters[repeaterId];
        // If no list, nothing to remove
        if(!filterList) return;

        // If no label, remove everything
        if(!label) {
            repeaterToFilters[repeaterId] = [];
            return;
        }

        for(var i = filterList.length - 1; i >= 0; i--) {
            var filterObj = filterList[i];
            if(filterObj.label && filterObj.label == label) $ax.splice(filterList, i, 1);
        }
    };
    _repeaterManager.removeFilter = _removeFilter;

    var _addSort = function(repeaterId, label, columnName, ascending, toggle, sortType) {
        var sortList = repeaterToSorts[repeaterId];
        if(!sortList) repeaterToSorts[repeaterId] = sortList = [];

        for(var i = 0; i < sortList.length; i++) {
            if(columnName == sortList[i].columnName) {
                var lastSortObj = $ax.splice(sortList, i, 1)[0];
                if(toggle) ascending = !lastSortObj.ascending;
                break;
            }
        }

        var sortObj = { columnName: columnName, ascending: ascending, sortType: sortType };

        if(label) sortObj.label = label;
        sortList[sortList.length] = sortObj;
    };
    _repeaterManager.addSort = _addSort;

    var _removeSort = function(repeaterId, label) {
        var sortList = repeaterToSorts[repeaterId];
        // If no list, nothing to remove
        if(!sortList) return;

        // If no label, remove everything
        if(!label) {
            repeaterToSorts[repeaterId] = [];
            return;
        }

        for(var i = sortList.length - 1; i >= 0; i--) {
            var sortObj = sortList[i];
            if(sortObj.label && sortObj.label == label) $ax.splice(sortList, i, 1);
        }
    };
    _repeaterManager.removeSort = _removeSort;

    var _setRepeaterToPage = function(repeaterId, type, value, eventInfo) {
        var pageInfo = repeaterToPageInfo[repeaterId];
        // page doesn't matter if there is no limit.
        if(pageInfo.noLimit) return;

        var dataSet = repeaterToActiveDataSet[repeaterId];
        if(!dataSet) dataSet = repeaterToCurrentDataSet[repeaterId];
        var lastPage = Math.max(1, Math.ceil(dataSet.length / pageInfo.itemsPerPage));

        if(type == 'Value') {
            var val = Number($ax.expr.evaluateExpr(value, eventInfo));
            // if invalid, default to 1, otherwise, clamp the value
            if(isNaN(val)) val = 1;
            else if(val < 1) val = 1;
            else if(val > lastPage) val = lastPage;

            pageInfo.currPage = val;
        } else if(type == 'Previous') {
            if(pageInfo.currPage > 1) pageInfo.currPage--;
        } else if(type == 'Next') {
            if(pageInfo.currPage < lastPage) pageInfo.currPage++;
        } else if(type == 'Last') {
            pageInfo.currPage = lastPage;
        } else {
            console.log('Unknown type');
        }
    };
    _repeaterManager.setRepeaterToPage = _setRepeaterToPage;

    var _setNoItemLimit = function(repeaterId) {
        var pageInfo = repeaterToPageInfo[repeaterId];
        delete pageInfo.currPage;
        delete pageInfo.itemsPerPage;
        pageInfo.noLimit = true;
    };
    _repeaterManager.setNoItemLimit = _setNoItemLimit;

    var _setItemLimit = function(repeaterId, value, eventInfo) {
        var pageInfo = repeaterToPageInfo[repeaterId];

        if(pageInfo.noLimit) {
            pageInfo.noLimit = false;
            pageInfo.currPage = 1;
        }

        var oldTarget = eventInfo.targetElement;
        eventInfo.targetElement = repeaterId;
        var itemLimit = Number($ax.expr.evaluateExpr(value, eventInfo));
        eventInfo.targetElement = oldTarget;
        if(isNaN(itemLimit)) itemLimit = 20;
        else if(itemLimit < 1) itemLimit = 1;
        pageInfo.itemsPerPage = itemLimit;
    };
    _repeaterManager.setItemLimit = _setItemLimit;

    var removeItems = function(repeaterId) {
        var elementIds = $ax.getChildElementIdsForRepeater(repeaterId);
        var itemId = $ax.getItemIdsForRepeater(repeaterId);
        for(var i = 0; i < itemId.length; i++) $jobj(_createElementId(repeaterId, itemId[i])).remove();
        $ax.visibility.clearLimboAndHiddenIds(elementIds);
        $ax.visibility.clearMovedAndResizedIds(elementIds);
        $ax.clearItemsForRepeater(repeaterId);
    };

    var repeaterSizes = {};
    var resetItemSizes = function (repeaterId, itemSize, bounds, ids, vertical, wrap) {
        var calcItem = !itemSize;
        if(calcItem) itemSize = {};

        var repeaterMap = {};
        repeaterMap.vert = vertical;
        var sizesMap = {};
        var sizes = [];
        var currSizes = wrap == -1 ? sizes : [];
        for(var i = 0; i + bounds[0] < bounds[1]; i++) {
            var itemId = ids[i + bounds[0]];
            if(calcItem) {
                var itemJobj = $jobj(_createElementId(repeaterId, itemId));
                itemSize.width = $ax.getNumFromPx(itemJobj.css('width'));
                itemSize.height = $ax.getNumFromPx(itemJobj.css('height'));
            }

            var size = { itemId: itemId, width: itemSize.width, height: itemSize.height };
            currSizes.push(size);
            sizesMap[size.itemId] = size;
            if(currSizes.length == wrap) {
                sizes.push(currSizes);
                currSizes = [];
            }
        }
        if (wrap != -1 && currSizes.length > 0) sizes.push(currSizes);
        repeaterMap.sizes = sizes;
        repeaterMap.sizesMap = sizesMap;
        repeaterSizes[repeaterId] = repeaterMap;
    };

    _repeaterManager.getItemSize = function(repeaterId, itemId) {
        var repeaterSize = repeaterSizes[repeaterId];
        if (!repeaterSize) return false;
        return repeaterSize.sizesMap[itemId];
    }

    _repeaterManager.setItemSize = function (repeaterId, itemId, width, height) {
        var repeaterSize = repeaterSizes[repeaterId];
        if(!repeaterSize) return false;
        var size = repeaterSize.sizesMap[itemId];
        var deltaX = width - size.width;
        var deltaY = height - size.height;
        if(!deltaX && !deltaY) return false;

        repeaterSize.resized = true;

        if(deltaX) _pushItems(repeaterId, itemId, deltaX, false, true);
        if(deltaY) _pushItems(repeaterId, itemId, deltaY, true, true);

        if(deltaX || deltaY) $ax.event.raiseSyntheticEvent(_createElementId(repeaterId, itemId), 'onItemResize');

        return true;
    }

    var _pushItems = _repeaterManager.pushItems = function (repeaterId, itemId, delta, vertical, suppressFire) {
        if(delta == 0) return;

        // Update repeater item size
        var prop = vertical ? 'height' : 'width';
        var itemElementId = _createElementId(repeaterId, itemId);
        var itemObj = $jobj(itemElementId);
        itemObj.css(prop, $ax.getNumFromPx(itemObj.css(prop)) + delta);
        $ax.visibility.setResizedSize(itemElementId, $ax.getNumFromPx(itemObj.css('width')), $ax.getNumFromPx(itemObj.css('height')));

        var repeaterObj = $jobj(repeaterId);
        var repeaterMap = repeaterSizes[repeaterId];
        var sizes = repeaterMap.sizes;
        var wrap = sizes[0].length != undefined;
        var vert = repeaterMap.vert;

        // Not wrapping, has to push in primary direction
        if (!wrap && vert != vertical) {
            var before = 0;
            var after = 0;
            var limit = 0;
            for(var i = 0; i < sizes.length; i++) {
                var size = sizes[i];
                if(size.itemId == itemId) {
                    before = size[prop];
                    size[prop] += delta;
                    after = size[prop];
                } else {
                    limit = limit ? Math.max(limit, size[prop]) : size[prop];
                }
            }

            // Repeater delta is because an item can increase secondary direction, but if another item is already larger, then repeater size isn't effected.
            var repeaterDelta = delta;
            if(sizes.length != 1) {
                if(after >= limit) repeaterDelta = after - Math.max(limit, before);
                else if(before > limit) repeaterDelta = limit - before;
                else repeaterDelta = 0;
            }

            _updateRepeaterSize(prop, repeaterObj, repeaterDelta, vert);

            if(!suppressFire) $ax.event.raiseSyntheticEvent(_createElementId(repeaterId, itemId), 'onItemResize');
            return;
        }

        var index = 0;
        var index2 = 0;
        // Get the indices first
        if(wrap) {
            outer:
                for(; index < sizes.length; index++) {
                    var innerSizes = sizes[index];
                    for(index2 = 0; index2 < innerSizes.length; index2++) if(innerSizes[index2].itemId == itemId) break outer;
                }
        } else {
            for(; index < sizes.length; index++) if(sizes[index].itemId == itemId) break;
        }
        // Find out who is being pushed
        var itemIdsEffected = [];
        if (vert == vertical) {
            // To check for repeater resize, non-wrap is easy, for wrap you have to see if your new size is enough to effect the size given other col/row sizes.
            repeaterDelta = delta;
            if(wrap && sizes.length > 1) {
                var viewId = $ax.adaptive.currentViewId || '';
                var obj = $obj(repeaterId);
                var spacing = _getAdaptiveProp(obj.repeaterPropMap, (vert ? 'vertical' : 'horizontal') + 'Spacing', viewId, repeaterId, obj);
                for(i = 0; i < sizes.length; i++) {
                    var rowColSize = 0;
                    var rowCol = sizes[i];
                    for(var j = 0; j < rowCol.length; j++) {
                        if(j != 0) rowColSize += spacing;
                        rowColSize += rowCol[j][prop];
                    }

                    if(i == index) {
                        before = rowColSize;
                        after = before + delta;
                    } else {
                        limit = limit ? Math.max(limit, rowColSize) : rowColSize;
                    }
                }

                if(after >= limit) repeaterDelta = after - Math.max(limit, before);
                else if (before > limit) repeaterDelta = limit - before;
                else repeaterDelta = 0;
            }

            if (repeaterDelta) {
                _updateRepeaterSize(prop, repeaterObj, repeaterDelta, vert);
            }

            // Done the hard part, calculating/updating new repeater size. Now just resize items and find what to push.
            var array = wrap ? sizes[index] : sizes;
            i = wrap ? index2 : index;
            array[i][prop] += delta;

            for(i++; i < array.length; i++) itemIdsEffected.push(array[i].itemId);
        } else {
            // Secondary push is more interesting. See how much your primary row/column is already pushing, if that changes
            //  then effect all rows/columns after it

            // Get the biggest one in the current row/column, ignoring the one we're changing
            var biggest = 0;
            var currSizes = sizes[index];
            for(i = 0; i < currSizes.length; i++) {
                if (i == index2) continue;

                biggest = Math.max(biggest, currSizes[i][prop]);
            }

            var beforeSize = Math.max(biggest, currSizes[index2][prop]);
            currSizes[index2][prop] += delta;
            var afterSize = Math.max(biggest, currSizes[index2][prop]);

            // Nothing pushed/pulled
            if (afterSize == beforeSize) return;

            for(i = index + 1; i < sizes.length; i++) {
                currSizes = sizes[i];
                for(j = 0; j < currSizes.length; j++) itemIdsEffected.push(currSizes[j].itemId);
            }

            // Delta is only how much the whole row/column changed
            delta = afterSize - beforeSize;

            // Repeater resize secondary is determined by the effective delta.
            _updateRepeaterSize(prop, repeaterObj, delta, vert);
        }

        for(i = 0; i < itemIdsEffected.length; i++) {
            var currItemId = itemIdsEffected[i];
            var elementId = _createElementId(repeaterId, currItemId);
            var loc = vertical ? 'top' : 'left';
            var jobj = $jobj(elementId);
            var currVal = $ax.getNumFromPx(jobj.css(loc));
            jobj.css(loc, currVal + delta);
            $ax.visibility.setMovedLocation(elementId, $ax.getNumFromPx(jobj.css('left')), $ax.getNumFromPx(jobj.css('top')));
        }

        if(!suppressFire) $ax.event.raiseSyntheticEvent(_createElementId(repeaterId, itemId), 'onItemResize');
    }

    var _updateRepeaterSize = function(prop, jobj, delta, vert) {
        if (delta == 0) return;
        var val = $ax.getNumFromPx(jobj.css(prop)) + delta;
        var border = 0;
        if(vert) border += $ax.getNumFromPx(jobj.css('border-top-width')) + $ax.getNumFromPx(jobj.css('border-bottom-width'));
        else border += $ax.getNumFromPx(jobj.css('border-left-width')) + $ax.getNumFromPx(jobj.css('border-right-width'));
        val += border;
        jobj.css(prop, val);
        $ax.visibility.setResizedSize(jobj.attr('id'), $ax.getNumFromPx(jobj.css('width')), $ax.getNumFromPx(jobj.css('height')));
        $ax.dynamicPanelManager.fitParentPanel(jobj.attr('id'));
    }

    var _getDataFromDataSet = function (eventInfo, repeaterId, itemId, propName, type) {
        var row = undefined;
        var deleteMap = eventInfo && eventInfo.repeaterDeleteMap && eventInfo.repeaterDeleteMap[repeaterId];
        if(deleteMap) row = deleteMap.idToRow[itemId];

        if(!row) {
            var itemNum = _getRealItemId(eventInfo, repeaterId, Number(itemId));
            row = repeaterToCurrentDataSet[repeaterId][itemNum];
        }
        // Default to obj with text as empty string, as we don't generate the data for empty props
        var data = row[propName] || { text: '' };
        //For now text is always the default. May change this to depend on context.
        switch(type) {
            case 'data': return data.type == 'text' ? data.text : data
            case 'img': return (data.img && data.img[$ax.adaptive.getSketchKey()]) || data.text;
            default: return (type && data[type]) || data.text;
        }
        //return type == 'data' && data.type != 'text' ? data : (type && data[type]) || data['text'];
    };
    _repeaterManager.getData = _getDataFromDataSet;

    _repeaterManager.hasData = function(id, propName) {
        if(!_getItemIdFromElementId(id)) return false;
        var repeaterId = $ax.getParentRepeaterFromScriptId(_getScriptIdFromElementId(id));
        return Boolean(repeaterToCurrentDataSet[repeaterId] && repeaterToCurrentDataSet[repeaterId].props.indexOf(propName) != -1);
    };

    var _getEventDeleteData = function(eventInfo, repeaterId) {
        var repeaterDeleteMap = eventInfo.repeaterDeleteMap;
        if(!repeaterDeleteMap) repeaterDeleteMap = eventInfo.repeaterDeleteMap = {};

        var myDeleteMap = repeaterDeleteMap[repeaterId];
        if(!myDeleteMap) {
            myDeleteMap = repeaterDeleteMap[repeaterId] = {};
            myDeleteMap.deletedIds = [];
            myDeleteMap.idToRow = {};
        }

        return myDeleteMap;
    };

    var _getRealItemId = function(eventInfo, repeaterId, itemId) {
        var deletedBefore = 0;
        var map = eventInfo.repeaterDeleteMap && eventInfo.repeaterDeleteMap[repeaterId];
        var deletedIds = map && map.deletedIds;
        if(!deletedIds) return itemId - 1;

        for(var i = 0; i < deletedIds.length; i++) if (deletedIds[i] < itemId) deletedBefore++;
        return itemId - deletedBefore - 1;
    }

    var _addItemToDataSet = function(repeaterId, row, itemEventInfo) {
        itemEventInfo.data = true;
        var oldTarget = itemEventInfo.targetElement;
        itemEventInfo.targetElement = repeaterId;
        var dataSet = repeaterToLocalDataSet[repeaterId];

        for(var propName in row) {
            if(!row.hasOwnProperty(propName)) continue;
            var prop = row[propName];
            if(prop.type == 'literal') {
                var retval = $ax.expr.evaluateExpr(prop.literal, itemEventInfo);
                if(typeof (retval) == 'string' || retval instanceof Date) retval = { type: 'text', text: retval };
                row[propName] = retval;
            }
        }

        itemEventInfo.targetElement = oldTarget;
        dataSet[dataSet.length] = row;
        itemEventInfo.data = false;
    };
    _repeaterManager.addItem = _addItemToDataSet;

    var _deleteItemsFromDataSet = function(repeaterId, eventInfo, type, rule) {
        var dataSet = repeaterToCurrentDataSet[repeaterId];
        var deleteDataMap = _getEventDeleteData(eventInfo, repeaterId);
        var items;

        // Should always be this, marked, or rule.
        if(type == 'this') items = [_getItemIdFromElementId(eventInfo.srcElement)];
        else if(type == 'marked') items = $ax.deepCopy(repeaterToEditItems[repeaterId]);
        else {
            // This should be rule
            var visibleData = repeaterToCurrentDataSet[repeaterId];
            items = [];
            var oldTarget = eventInfo.targetElement;
            for(var i = 0; i < visibleData.length + deleteDataMap.deletedIds.length; i++) {
                var index = i + 1;
                if(deleteDataMap.deletedIds.indexOf(index) != -1) continue;

                eventInfo.targetElement = _createElementId(repeaterId, index);
                if($ax.expr.evaluateExpr(rule, eventInfo).toLowerCase() != 'true') continue;
                items.push(index);
            }
            eventInfo.targetElement = oldTarget;
        }
        // Want them decending
        items.sort(function(a, b) { return b - a; });
        var editItems = repeaterToEditItems[repeaterId];

        for(i = 0; i < items.length; i++) {
            var itemId = items[i];

            // Don't delete already deletedItem
            if(deleteDataMap.deletedIds.indexOf(itemId) != -1) continue;
            
            var deletedRow = $ax.splice(dataSet, _getRealItemId(eventInfo, repeaterId, itemId), 1)[0];
            deleteDataMap.deletedIds.push(itemId);
            deleteDataMap.idToRow[itemId] = deletedRow;
            for(var j = editItems.length - 1; j >= 0; j--) {
                var editItem = editItems[j];
                if(editItem == itemId) $ax.splice(editItems, j, 1);
                else if(editItem > itemId) editItems[j] = editItem - 1;
            }
        }
    };
    _repeaterManager.deleteItems = _deleteItemsFromDataSet;

    var _updateEditItemsInDataSet = function(repeaterId, propMap, eventInfo, type, rule) {
        var oldTarget = eventInfo.targetElement;
        var dataSet = repeaterToCurrentDataSet[repeaterId];
        var items;

        // Should always be this, marked, or rule.
        if(type == 'this') items = [_getItemIdFromElementId(eventInfo.srcElement)];
        else if(type == 'marked') items = repeaterToEditItems[repeaterId];
        else {
            // This should be rule
            var currData = repeaterToCurrentDataSet[repeaterId];
            items = [];
            oldTarget = eventInfo.targetElement;
            for(var i = 0; i < currData.length; i++) {
                var index = i + 1;
                eventInfo.targetElement = _createElementId(repeaterId, index);
                if($ax.expr.evaluateExpr(rule, eventInfo).toLowerCase() != 'true') continue;
                items.push(index);
            }
            eventInfo.targetElement = oldTarget;
        }

        eventInfo.data = true;
        for(var prop in propMap) {
            if(!propMap.hasOwnProperty(prop)) continue;
            for(i = 0; i < items.length; i++) {
                var data = propMap[prop];
                var item = items[i];
                if(data.type == 'literal') {
                    eventInfo.targetElement = _createElementId(repeaterId, item);
                    data = $ax.expr.evaluateExpr(data.literal, eventInfo);
                    if(typeof (data) == 'object' && data.isWidget) data = data.text;
                    if(typeof (data) == 'string') data = { type: 'text', text: data };
                }
                dataSet[_getRealItemId(eventInfo, repeaterId, item)][prop] = data;
            }
        }
        eventInfo.targetElement = oldTarget;
        eventInfo.data = false;
    };
    _repeaterManager.updateEditItems = _updateEditItemsInDataSet;

    var _getAllItemIds = function(repeaterId) {
        var retval = [];
        var currDataSet = repeaterToCurrentDataSet[repeaterId];
        for(var i = 0; i < currDataSet.length; i++) retval.push(i + 1);
        return retval;
    };
    _repeaterManager.getAllItemIds = _getAllItemIds;

    var _addEditItemToRepeater = function(repeaterId, itemIds) {
        for(var i = 0; i < itemIds.length; i++) {
            var itemId = Number(itemIds[i]);
            var items = repeaterToEditItems[repeaterId];
            if(items.indexOf(itemId) == -1) items[items.length] = itemId;
        }
    };
    _repeaterManager.addEditItems = _addEditItemToRepeater;

    var _removeEditItemFromRepeater = function(repeaterId, itemIds) {
        for(var i = 0; i < itemIds.length; i++) {
            var itemId = itemIds[i];
            var items = repeaterToEditItems[repeaterId];
            var index = items.indexOf(Number(itemId));
            if(index != -1) $ax.splice(items, index, 1);
        }
    };
    _repeaterManager.removeEditItems = _removeEditItemFromRepeater;

    _repeaterManager.isEditItem = function(repeaterId, itemId) {
        var items = repeaterToEditItems[repeaterId];
        return items.indexOf(Number(itemId)) != -1;
    };

    var _createElementId = function(scriptId, itemId) {
        if(!itemId) return scriptId;
        var i = scriptId.indexOf('_');
        var sections = i > -1 ? [scriptId.substring(0, i), scriptId.substring(i + 1)] : [scriptId];
        var retval = sections[0] + '-' + itemId;
        return sections.length > 1 ? retval + '_' + sections[1] : retval;
    };
    _repeaterManager.createElementId = _createElementId;

    var _getElementId = function(scriptId, childId) {
        var elementId = scriptId;
        if($ax.getParentRepeaterFromScriptId(scriptId)) {
            // Must be in the same item as the child
            var itemId = $ax.repeater.getItemIdFromElementId(childId);
            elementId = $ax.repeater.createElementId(scriptId, itemId);
        }
        return elementId;
    };
    _repeaterManager.getElementId = _getElementId;

    var _getScriptIdFromElementId = function(elementId) {
        if(!elementId) return elementId;
        var sections = elementId.split('-');
        var retval = sections[0];
        if(sections.length <= 1) return retval;
        sections = sections[1].split('_');
        return sections.length > 1 ? retval + '_' + sections[1] : retval;
    };
    _repeaterManager.getScriptIdFromElementId = _getScriptIdFromElementId;

    var _getItemIdFromElementId = function(elementId) {
        var sections = elementId.split('-');
        if(sections.length < 2) return '';
        sections = sections[1].split('_');
        return sections[0];
    };
    _repeaterManager.getItemIdFromElementId = _getItemIdFromElementId;

    // TODO: Just inline this if we keep it this way.
    var _applySuffixToElementId = function(id, suffix) {
        return id + suffix;
        //        return _createElementId(_getScriptIdFromElementId(id) + suffix, _getItemIdFromElementId(id));
    };
    _repeaterManager.applySuffixToElementId = _applySuffixToElementId;

    var _removeSuffixFromElementId = function (id) {
        var suffixId = id.indexOf('_');
        if(suffixId != -1) return id.substr(0, suffixId);

        var partId = id.indexOf('p');
        if(partId != -1) return _createElementId(id.substr(0, partId), _getItemIdFromElementId(id)); // item id is after part, but before suffix

        return id;
    }
    _repeaterManager.removeSuffixFromElementId = _removeSuffixFromElementId;

    //    var _getRepeaterSize = function(repeaterId) {
    //        var itemCount = ($ax.getItemIdsForRepeater(repeaterId) || []).length;
    //        if(itemCount == 0) return { width: 0, height: 0 };

    //        var repeater = $obj(repeaterId);
    //        // Width and height per item;
    //        var width = repeater.width;
    //        var height = repeater.height;

    //        var viewId = $ax.adaptive.currentViewId || '';
    //        var widthIncrement = width + _getAdaptiveProp(repeater.repeaterPropMap, 'horizontalSpacing', viewId);
    //        var heightIncrement = height + _getAdaptiveProp(repeater.repeaterPropMap, 'verticalSpacing', viewId);

    //        var wrap = _getAdaptiveProp(repeater.repeaterPropMap, 'wrap', viewId);
    //        var vertical = _getAdaptiveProp(repeater.repeaterPropMap, 'vertical', viewId);

    //        if(wrap == -1 || itemCount <= wrap) {
    //            if(vertical) height += heightIncrement * (itemCount - 1);
    //            else width += widthIncrement * (itemCount - 1);
    //        } else {
    //            var primaryDim = wrap;
    //            var secondaryDim = Math.ceil(itemCount / primaryDim);

    //            if(vertical) {
    //                height += heightIncrement * (primaryDim - 1);
    //                width += widthIncrement * (secondaryDim - 1);
    //            } else {
    //                width += widthIncrement * (primaryDim - 1);
    //                height += heightIncrement * (secondaryDim - 1);
    //            }
    //        }
    //        return { width: width, height: height };
    //    };
    //    _repeaterManager.getRepeaterSize = _getRepeaterSize;

});

// ******* Dynamic Panel Manager ******** //
$axure.internal(function($ax) {
    // TODO: Probably a lot of the dynamic panel functions from pagescript should be moved here at some point...
    var _dynamicPanelManager = $ax.dynamicPanelManager = {};

    var _isIdFitToContent = _dynamicPanelManager.isIdFitToContent = function(id) {
        var obj = $obj(id);
        if (!obj || !$ax.public.fn.IsDynamicPanel(obj.type) || !obj.fitToContent) return false;

        var jpanel = $jobj(id);
        return !jpanel.attr('data-notfit');
    };

    //this function fit parent panel, also check for parent layer or repeaters
    var _fitParentPanel = function (widgetId) {

        var parentLayer = getParentLayer(widgetId);
        if(parentLayer) {
            if(_updateLayerRectCache(parentLayer)) _fitParentPanel(parentLayer);
            return;
        }

        // Find parent panel if there is one.
        var parentPanelInfo = getParentPanel(widgetId);
        if(parentPanelInfo) {
            var parentId = parentPanelInfo.parent;
            _updateMobileScroll(parentId, parentPanelInfo.stateId, true);
            if(_updateFitPanel(parentId, parentPanelInfo.state)) _fitParentPanel(parentId);
            return;
        }

        // Otherwise, try to get parent repeater
        var parentRepeaterId = $ax.getParentRepeaterFromElementId(widgetId);
        var repeaterObj = $obj(parentRepeaterId);
        if (repeaterObj && widgetId != parentRepeaterId && repeaterObj.repeaterPropMap.fitToContent) {
            var itemId = $ax.repeater.getItemIdFromElementId(widgetId);
            var containerId = $ax.repeater.createElementId(parentRepeaterId, itemId);
            var childrenRect = $ax('#' + containerId).childrenBoundingRect();
            $ax.repeater.setItemSize(parentRepeaterId, itemId, childrenRect.right, childrenRect.bottom);
            return;
        }

        $ax.adaptive.updateMobileScrollOnBody();
    };
    _dynamicPanelManager.fitParentPanel = _fitParentPanel;

    var _updateMobileScroll = _dynamicPanelManager.updateMobileScroll = function (panelId, stateId, blockResetScroll) {
        if (!panelId) return false;

        // Only update scroll if panel is scrollable
        if ($ax.dynamicPanelManager.isIdFitToContent(panelId)) return false;
        var obj = $obj(panelId);
        if (!obj || obj.scrollbars.toLowerCase() == 'none') return false;
        
        var stateQuery = $jobj(stateId);
        $ax.adaptive.removeNiceScroll(stateQuery, blockResetScroll);
        
        //check if the page is in mobile mode
        if (!$ax.adaptive.isDeviceMode()) {
            stateQuery.css('cursor', '');
            return false;
        }

        var stateContentId = stateId + '_content';
        var childrenRect = $ax('#' + stateContentId).childrenBoundingRect();
        var size = { width: childrenRect.right, height: childrenRect.bottom };

        var $stateContent = $('#' + stateContentId);
        $stateContent.css({ 'height': size.height + 'px', 'width': size.width + 'px' });

        // Apply niceScroll and update cursor
        if (obj.isExpo) {
            var headerHeight = obj.headerHeight ? obj.headerHeight : 0;
            var footerHeight = obj.footerHeight ? obj.footerHeight : 0;

            $ax.adaptive.addNiceScroll(stateQuery, { touchbehavior: true, bouncescroll: false, grabcursorenabled: false, railmargin: { top: headerHeight, bottom: footerHeight }, scrollbarid: stateId + "-sb" });
            stateQuery.find('.nicescroll-rails').css('margin-top', headerHeight + 'px');
        } else {
            $ax.adaptive.addNiceScroll(stateQuery, { emulatetouch: true, horizrailenabled: obj.scrollbars != 'verticalAsNeeded' }, blockResetScroll);
        }
        
        stateQuery.css('cursor', 'url(resources/css/images/touch.cur), auto');
        stateQuery.css('cursor', 'url(resources/css/images/touch.svg) 32 32, auto');
    }

    _dynamicPanelManager.initMobileScroll = function () {
        var scrollable = [];
        $ax('*').each(function (obj, elementId) {
            var scriptId = $ax.repeater.getScriptIdFromElementId(elementId);
            if ($ax.public.fn.IsDynamicPanel(obj.type) && obj.scrollbars != 'None' && obj.scrollbars != 'none' && !$ax.visibility.isElementIdLimboOrInLimboContainer(scriptId)) {
                scrollable[scrollable.length] = elementId;
            }
        });
        for (var i = scrollable.length - 1; i >= 0; i--) {
            var panelId = scrollable[i];
            var stateId = $ax.repeater.applySuffixToElementId(panelId, '_state0');
            _updateMobileScroll(panelId, stateId, true);
        }
    };
    

    _dynamicPanelManager.initialize = function() {
        $axure.resize(_handleResize);
        $(window).scroll(_handleScroll);
    };

    var percentPanelToLeftCache = [];
    var percentPanelsInitialized = false;
    var _handleResize = function() {
        if(percentPanelsInitialized) {
            for(var key in percentPanelToLeftCache) {
                //could optimize to only update non-contained panels
                _updatePanelPercentWidth(key);
            }
        } else {
            $ax('*').each(function(obj, elementId) {
                if(_isPercentWidthPanel(obj)) _updatePanelPercentWidth(elementId);
            });
            percentPanelsInitialized = true;
        }
        _adjustFixedCenter();
    };

    var _isPercentWidthPanel = _dynamicPanelManager.isPercentWidthPanel = function(obj) {
        return obj && $ax.public.fn.IsDynamicPanel(obj.type) && obj.percentWidth;
    };

    _dynamicPanelManager.updatePanelContentPercentWidth = function(elementId) {
        //        if(_isPercentWidthPanel($obj(elementId))) return;
        var stateChildrenQuery = $jobj(elementId).children('.panel_state');
        stateChildrenQuery.children('.panel_state_content').each(
            function() {
                $(this).children('.ax_dynamic_panel').each(
                    function() { _updatePanelPercentWidth(this.id); }
                );
            }
        );
    };

    _dynamicPanelManager.updatePercentPanelCache = function(query) {
        query.each(function(obj, elementId) {
            if(_isPercentWidthPanel(obj)) {
                if(_updatePercentPanelToLeftCache(obj, elementId, true)) {
                    _updatePanelPercentWidth(elementId);
                }
            }
        });
    };

    var _handleScroll = function () {
        _adjustFixedCenter();
    };

    var fixedCenterPanels = [];
    var fixedCenterPanelsInitialized = false;

    var _adjustFixedCenter = function () {

        if (!fixedCenterPanelsInitialized) {
            $axure(function(diagramObject) {
                     return diagramObject.fixedHorizontal && diagramObject.fixedHorizontal == 'center' && !diagramObject.percentWidth;
                })
                .each(function (diagramObject, elementId) {
                    fixedCenterPanels.push(elementId);
                });
            fixedCenterPanelsInitialized = true;
        }

        for (var i = 0; i < fixedCenterPanels.length; i++) {
            var elementId = fixedCenterPanels[i];
            var boundingRect = $ax('#' + elementId).offsetBoundingRect();
            var left = boundingRect.left;

            var win = $(window);
            var winWidth = win.width();
            var elementQuery = $('#' + elementId);

            if (left >= 0 && winWidth >= boundingRect.width) {
                elementQuery.css('left', '50%');
                continue;
            }

            var leftMargin = $ax.getNumFromPx(elementQuery.css('margin-left'));
            var newLeft = -leftMargin;
            elementQuery.css('left', newLeft + 'px');
        }
    };

    _dynamicPanelManager.resetFixedPanel = function(obj, domElement) {
        if(obj.fixedHorizontal == 'center') domElement.style.marginLeft = "";
        if(obj.fixedVertical == 'middle') domElement.style.marginTop = "";
    };

    _dynamicPanelManager.resetAdaptivePercentPanel = function(obj, domElement) {
        if(!_isPercentWidthPanel(obj)) return;

        if(obj.fixedHorizontal == 'center') domElement.style.marginLeft = "";
        else if(obj.fixedHorizontal == 'right') domElement.style.width = "";
    };

    var _updatePercentPanelToLeftCache = function(obj, elementId, overwrite) {
        var wasUpdated = false;
        var jObj = $jobj(elementId);
        var axObj = $ax('#' + elementId);
        if(percentPanelToLeftCache[elementId] == undefined || overwrite) {
            if (obj.fixedHorizontal == 'center') percentPanelToLeftCache[elementId] = $ax.getNumFromPx(jObj.css('margin-left'));
            else if (obj.fixedHorizontal == 'right') percentPanelToLeftCache[elementId] = axObj.width() + $ax.getNumFromPx(jObj.css('right'));
            else percentPanelToLeftCache[elementId] = $ax.getNumFromPx(jObj.css('left'));
            wasUpdated = true;
        }

        if(obj.fixedHorizontal == 'right' && _isIdFitToContent(elementId)) {
            //var fitWidth = getContainerSize($ax.visibility.GetPanelState(elementId) + '_content').width;
            var containerId = $ax.visibility.GetPanelState(elementId) + '_content';
            var childrenRect = $ax('#' + containerId).childrenBoundingRect();
            var fitWidth = childrenRect.right;
            percentPanelToLeftCache[elementId] = fitWidth + $ax.getNumFromPx(jObj.css('right'));
            wasUpdated = true;
        }
        return wasUpdated;
    };

    var _updatePanelPercentWidth = _dynamicPanelManager.updatePanelPercentWidth = function(elementId) {
        var obj = $obj(elementId);
        if(!_isPercentWidthPanel(obj)) return;

        _updatePercentPanelToLeftCache(obj, elementId, false);

        var width;
        var x;

        if(obj.fixedHorizontal) {
            x = 0;
            width = $(window).width();
        } else {
            var parentPanelInfo = getParentPanel(elementId);
            if(parentPanelInfo) {
                var parentId = parentPanelInfo.parent;
                width = $ax('#' + parentId).width();
                var parentObj = $obj(parentId);
                if(parentObj.percentWidth) {
                    var stateId = $ax.repeater.applySuffixToElementId(parentId, '_state' + parentPanelInfo.state);
                    var stateContentId = stateId + '_content';
                    x = -$ax.getNumFromPx($jobj(stateContentId).css('margin-left'));
                } else x = 0;
            } else {
                var parentRepeater = $ax.getParentRepeaterFromScriptId($ax.repeater.getScriptIdFromElementId(elementId));
                if(parentRepeater) {
                    var itemId = $ax.repeater.getItemIdFromElementId(elementId);
                    var itemContainerId = $ax.repeater.createElementId(parentRepeater, itemId);
                    x = 0;
                    width = $ax('#' + itemContainerId).width();
                } else {
                    var $window = $(window);
                    width = $window.width();
                    var bodyLeft = $ax.getNumFromPx($('body').css('left'));
                    var bodyWidth = $ax.getNumFromPx($('body').css('width'));
                    var isCenter = $ax.adaptive.getPageStyle().pageAlignment == 'center';
                    width = Math.max(width, bodyWidth);
                    x = isCenter ? -(width - bodyWidth) / 2 - bodyLeft : 0;
                }
            }
        }

        var jObj = $jobj(elementId);
        if(obj.fixedHorizontal == 'left') jObj.css('left', x + 'px');
        else if(obj.fixedHorizontal == 'center') {
            jObj.css('left', x + 'px');
            jObj.css('margin-left', 0 + 'px');
        } else jObj.css('left', x + 'px');

        jObj.css('width', width + 'px');

        $ax.visibility.setResizedSize(elementId, width, $ax('#' + elementId).height());
        
        var panelLeft = percentPanelToLeftCache[elementId];
        var stateParent = jObj;
        while(stateParent.children()[0].id.indexOf($ax.visibility.CONTAINER_SUFFIX) != -1) stateParent = stateParent.children();
        var stateChildrenQuery = stateParent.children('.panel_state');
        stateChildrenQuery.css('width', width + 'px');

        if(obj.fixedHorizontal == 'center')
            stateChildrenQuery.children('.panel_state_content').css('left', '50%').css('margin-left', panelLeft + 'px');
        else if(obj.fixedHorizontal == 'right')
            stateChildrenQuery.children('.panel_state_content').css('left', width - panelLeft + 'px');
        else stateChildrenQuery.children('.panel_state_content').css('margin-left', panelLeft - x + 'px');
    };


    _dynamicPanelManager.updateParentsOfNonDefaultFitPanels = function () {
        $ax('*').each(function (diagramObject, elementId) {
            if(!$ax.public.fn.IsDynamicPanel(diagramObject.type) || !diagramObject.fitToContent) return;
            if($ax.visibility.isElementIdLimboOrInLimboContainer(elementId)) return;

            var stateId = $ax.visibility.GetPanelState(elementId);
            if(stateId != $ax.repeater.applySuffixToElementId(elementId, '_state0')) _fitParentPanel(elementId);
        });
    };

    _dynamicPanelManager.updateAllLayerSizeCaches = function() {
        var fitToContent = [];
        var layers = [];
        $ax('*').each(function (obj, elementId) {
            var isLayer = $ax.public.fn.IsLayer(obj.type);
            if(!isLayer) return;
            if($ax.visibility.isElementIdLimboOrInLimboContainer(elementId)) return;
            layers[layers.length] = elementId;
        });
        for(var i = layers.length - 1; i >= 0; i--) {
            var layerId = layers[i];
            _updateLayerRectCache(layerId);
        }
    };

    //_dynamicPanelManager.updateAllFitPanelsAndLayerSizeCaches = function() {
    //    var fitToContent = [];
    //    var layers = [];
    //    $ax('*').each(function (obj, elementId) {
    //        var isFitPanel = $ax.public.fn.IsDynamicPanel(obj.type) && obj.fitToContent;
    //        var isLayer = $ax.public.fn.IsLayer(obj.type);
    //        if(!isFitPanel && !isLayer) return;
    //        if($ax.visibility.isElementIdLimboOrInLimboContainer(elementId)) return;

    //        if(isFitPanel) {
    //            fitToContent[fitToContent.length] = elementId;
    //        } else if(isLayer) {
    //            layers[layers.length] = elementId;
    //        }
    //    });
    //    for(var i = fitToContent.length - 1; i >= 0; i--) {
    //        var panelId = fitToContent[i];
    //        var stateCount = $obj(panelId).diagrams.length;
    //        for(var j = 0; j < stateCount; j++) {
    //            $ax.dynamicPanelManager.setFitToContentCss(panelId, true);
    //            _updateFitPanel(panelId, j, true);
    //        }
    //    }
    //    for(var i = layers.length - 1; i >= 0; i--) {
    //        var layerId = layers[i];
    //        _updateLayerSizeCache(layerId);
    //    }
    //};

    //var _getCachedLayerRect = function (elementId) {
    //    var element = document.getElementById(elementId);
    //    var rect = {};
    //    rect.width = Number(element.getAttribute('data-width'));
    //    rect.height = Number(element.getAttribute('data-height'));
    //    rect.x = Number(element.getAttribute('data-left'));
    //    rect.y = Number(element.getAttribute('data-top'));
    //    return rect;
    //}

    var _updateLayerRectCache = function (elementId) {
        //var oldRect = _getCachedLayerRect(elementId);

        var axObj = $ax('#' + elementId);
        var oldRect = axObj.offsetBoundingRect();

        var childrenRect = axObj.childrenBoundingRect();
        var size = childrenRect.size;
        var loc = childrenRect.location;
        //var size = axObj.size();
        //var loc = {};
        //loc.x = axObj.locRelativeIgnoreLayer(false);
        //loc.y = axObj.locRelativeIgnoreLayer(true);
        
        var sizeChange = oldRect.width != size.width || oldRect.height != size.height;
        var locChange = oldRect.x != loc.x || oldRect.y != loc.y;
        if(sizeChange || locChange) {
            //var element = document.getElementById(elementId);
            if(sizeChange) {
                //element.setAttribute('data-width', size.width);
                //element.setAttribute('data-height', size.height);
                $ax.visibility.setResizedSize(elementId, size.width, size.height);
                $ax.event.raiseSyntheticEvent(elementId, 'onResize');
            }
            if(locChange) {
                //element.setAttribute('data-left', loc.x);
                //element.setAttribute('data-top', loc.y);
                $ax.visibility.setMovedLocation(elementId, loc.x, loc.y);
                $ax.event.raiseSyntheticEvent(elementId, 'onMove');
            }
            return true;
        }
        return false;
    }

    _dynamicPanelManager.setFitToContentCss = function(elementId, fitToContent, oldWidth, oldHeight) {

        if($ax.dynamicPanelManager.isIdFitToContent(elementId) == fitToContent) return;

        var panel = $jobj(elementId);
        var stateCss;
        var scrollbars = $obj(elementId).scrollbars;

        if(fitToContent) {
            panel.attr('style', '');
            panel.removeAttr('data-notfit');
            stateCss = {};
            stateCss.position = 'relative';
            if(scrollbars != 'none') {
                stateCss.overflow = 'visible';
                stateCss['-webkit-overflow-scrolling'] = 'visible';
            }
            if(scrollbars == 'verticalAsNeeded') {
                stateCss['overflow-x'] = 'visible';
                stateCss['-ms-overflow-x'] = 'visible';
            } else if(scrollbars == 'horizontalAsNeeded') {
                stateCss['overflow-y'] = 'visible';
                stateCss['-ms-overflow-y'] = 'visible';
            }
            panel.children().css(stateCss);
        } else {
            panel.attr('data-notfit', 'true');
            var panelCss = { width: oldWidth, height: oldHeight };
            stateCss = { width: oldWidth, height: oldHeight };
            panelCss.overflow = 'hidden';
            stateCss.position = 'absolute';
            if(scrollbars != 'none') {
                stateCss.overflow = 'auto';
                stateCss['-webkit-overflow-scrolling'] = 'touch';
            }
            if(scrollbars == 'verticalAsNeeded') {
                stateCss['overflow-x'] = 'hidden';
                stateCss['-ms-overflow-x'] = 'hidden';
            } else if(scrollbars == 'horizontalAsNeeded') {
                stateCss['overflow-y'] = 'hidden';
                stateCss['-ms-overflow-y'] = 'hidden';
            }
            panel.css(panelCss);
            panel.children().css(stateCss);
        }
    };

    var _getShownStateId = function (id) {
        var obj = $obj(id);
        if (!obj || !$ax.public.fn.IsDynamicPanel(obj.type)) return id;

        var children = $ax.visibility.applyWidgetContainer(id, true, false, true).children();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            while ($ax.visibility.isContainer(child.id)) child = $(child).children()[0];
            if (child && child.style && child.style.display != 'none') return child.id;
        }
        return id;
    };

    var _getShownStateObj = function(id) { return $ax('#' + _getShownStateId(id));}

    _dynamicPanelManager.getShownState = function (id) { return $jobj(_getShownStateId(id)); };

    var _getClamp = function(id) {
        var obj = $obj(id);
        if(!obj) return $ax('#' + id);
        if ($ax.public.fn.IsDynamicPanel(obj.type)) return _getShownStateObj(id);
        return $ax('#' + id);
    };

    var _updateFitPanel = function(panelId, stateIndex) {
        if(!panelId) return false;

        // Only fit if fitToContent is true
        if(!$ax.dynamicPanelManager.isIdFitToContent(panelId)) return false;

        // Traverse through children to find what size it should be.
        var stateId = $ax.repeater.applySuffixToElementId(panelId, '_state' + stateIndex);

        var stateContentId = stateId + '_content';
        var stateQuery = $jobj(stateId);

        //var size = getContainerSize(stateContentId);
        var childrenRect = $ax('#' + stateContentId).childrenBoundingRect();
        var size = {width: childrenRect.right, height: childrenRect.bottom};
        
        // Skip if size hasn't changed
        var oldWidth = stateQuery.width();
        var oldHeight = stateQuery.height();
        if(oldWidth == size.width && oldHeight == size.height) return false;

        var isPercentWidth = $obj(panelId).percentWidth;
        if(!isPercentWidth) stateQuery.width(size.width);
        stateQuery.height(size.height);

        //updatePercentWidth on all child panels
        $jobj(stateContentId).children('.ax_dynamic_panel').each(
            function() { _updatePanelPercentWidth(this.id); }
        );

        //do the following only if it is the current state
        if(stateId != $ax.visibility.GetPanelState(panelId)) return false;

        //var panelQuery = $jobj(panelId);
        //if (!isPercentWidth) panelQuery.attr('data-width', size.width);
        //panelQuery.attr('data-height', size.height);
        $ax.visibility.setResizedSize(panelId, isPercentWidth ? $ax('#' + panelId).width() : size.width, size.height);

        _adjustFixed(panelId, oldWidth, oldHeight, size.width, size.height);
        
        $ax.event.raiseSyntheticEvent(panelId, 'onResize');
        $ax.flyoutManager.updateFlyout(panelId);

        return true;
    };

    // widgetId is the one that crawls up masters until it finds a parent panel, targetId is the original widgetId (not the crawling master)
    // finds the immediate parent panel and crawls up through masters but not repeaters 
    var getParentPanel = function(widgetId, path, targetId) {
        path = path || $ax.getPathFromScriptId($ax.repeater.getScriptIdFromElementId(widgetId));

        var obj = $obj(widgetId);
        if(obj.parentDynamicPanel) {
            path[path.length - 1] = obj.parentDynamicPanel;
            var parentId = $ax.getScriptIdFromPath(path);
            if(!parentId) return undefined;
            parentId = $ax.repeater.getElementId(parentId, widgetId);
            var parentObj = $obj(parentId);
            var retVal = { parent: parentId };
            for(var i = 0; i < parentObj.diagrams.length; i++) {
                var stateId = $ax.repeater.applySuffixToElementId(parentId, '_state' + i);
                var stateQuery = $jobj(stateId);
                if(stateQuery.find('#' + (targetId || widgetId)).length != 0) {
                    retVal.state = i;
                    retVal.stateId = stateId;
                    break;
                }
            }
            return retVal;
        }

        if(path.length == 1) return undefined;

        path.pop();
        var parentMaster = $ax.getScriptIdFromPath(path);
        if(!parentMaster) return undefined;
        parentMaster = $ax.repeater.getElementId(parentMaster, widgetId);

        //check if the master is in the same repeater as the widgetId widget
        var parentMasterItemId = $ax.repeater.getItemIdFromElementId(parentMaster);
        var widgetItemId = $ax.repeater.getItemIdFromElementId(widgetId);
        if(parentMasterItemId != widgetItemId) return undefined;

        return getParentPanel(parentMaster, path, targetId || widgetId);
    };

    // finds the immediate parent layer and crawls up through masters but not repeaters or panels
    var getParentLayer = function (widgetId, path) {
        path = path || $ax.getPathFromScriptId($ax.repeater.getScriptIdFromElementId(widgetId));

        //gets immediate parent layer only
        var layerId = $ax.getLayerParentFromElementId(widgetId);
        if(layerId) return layerId;

        if(path.length == 1) return undefined;

        path.pop();
        var parentMaster = $ax.getScriptIdFromPath(path);
        if(!parentMaster) return undefined;
        parentMaster = $ax.repeater.getElementId(parentMaster, widgetId);

        //check if the master is in the same panel as the widgetId widget
        var widgetParentPanel = getParentPanel(widgetId);
        if(widgetParentPanel) {
            var parentMasterParentPanel = getParentPanel(parentMaster);
            if(!parentMasterParentPanel || widgetParentPanel.parent != parentMasterParentPanel.parent) return undefined;
        }

        //check if the master is in the same repeater as the widgetId widget
        var parentMasterItemId = $ax.repeater.getItemIdFromElementId(parentMaster);
        var widgetItemId = $ax.repeater.getItemIdFromElementId(widgetId);
        if(parentMasterItemId != widgetItemId) return undefined;

        return getParentLayer(parentMaster, path);
    };

    //// TODO: May be a better location for this. Used currently for rdo and panel state containers
    //var getContainerSize = function(containerId) {
    //    var containerQuery = containerId ? $jobj(containerId) : $('#base');
    //    var children = containerQuery.children();
    //    // Default size
    //    var size = { width: 0, height: 0 };
    //    for(var i = 0; i < children.length; i++) {
    //        var child = $(children[i]);
    //        var childId = child.attr('id');
    //        //var axChild = $ax('#' + childId).width();

    //        var childObj = $obj(childId);
    //        if(!childObj) {
    //            // On the body there are some children that should be ignored, as they are not objects.
    //            if(!child.hasClass('basiclink') || child.get(0).tagName.toLowerCase() != 'a') continue;

    //            // Otherwise it should be a basic link
    //            var linkChildren = child.children();
    //            if(!linkChildren.length) continue;
    //            child = $(linkChildren[0]);
    //            childId = child.attr('id');
    //            childObj = $obj(childId);
    //        }

    //        // Ignore fixed
    //        if(!childId || $ax.visibility.limboIds[childId] || !$ax.visibility.IsIdVisible(childId)
    //            || $ax.public.fn.IsDynamicPanel(childObj.type) && childObj.fixedHorizontal) continue;

    //        var boundingRect = $ax.public.fn.getWidgetBoundingRect(childId);
    //        var position = { left: boundingRect.left, top: boundingRect.top };
    //        var width = boundingRect.width;
    //        var height = boundingRect.height;

    //        if($ax.public.fn.IsMaster(childObj.type)) {
    //            var masterSize = getContainerSize(childId);
    //            width = masterSize.width;
    //            height = masterSize.height;
    //            //            } else if($ax.public.fn.IsRepeater(childObj.type)) {
    //            //                var repeaterSize = $ax.repeater.getRepeaterSize(childId);
    //            //                width = repeaterSize.width;
    //            //                height = repeaterSize.height;

    //            //                if(width == 0 && height == 0) continue;

    //            //                position.left += childObj.x;
    //            //                position.top += childObj.y;
    //        } else if ($ax.public.fn.IsDynamicPanel(childObj.type)) {
    //            if($ax.dynamicPanelManager.isIdFitToContent(childId)) {
    //                var stateQuery = $jobj($ax.visibility.GetPanelState(childId));
    //                width = stateQuery.width();
    //                height = stateQuery.height();
    //            }
    //        }

    //        size.width = Math.max(size.width, position.left + width);
    //        size.height = Math.max(size.height, position.top + height);
    //    }

    //    return size;
    //};
    //_dynamicPanelManager.getContainerSize = getContainerSize;

    var _adjustFixed = _dynamicPanelManager.adjustFixed = function(panelId, oldWidth, oldHeight, width, height) {
        var loc = _getFixedPosition(panelId, oldWidth, oldHeight, width, height);
        if(loc) {
            $ax.action.addAnimation(panelId, $ax.action.queueTypes.move, function() {
                $ax.move.MoveWidget(panelId, loc[0], loc[1], { easing: 'none', duration: 0 }, false, null, true);
            });
        }
    };

    var _getFixedPosition = _dynamicPanelManager.getFixedPosition = function(panelId, oldWidth, oldHeight, width, height) {
        var panelObj = $obj(panelId);
        var x = 0;
        var y = 0;
        if(panelObj.fixedHorizontal == 'center') {
            x = (oldWidth - width) / 2;
        }
        if(panelObj.fixedVertical == 'middle') {
            y = (oldHeight - height) / 2;
        }
        return x == 0 && y == 0 ? undefined : [x, y];
    };

    _dynamicPanelManager.getFixedInfo = function(panelId) {
        var panelObj = $obj(panelId);
        if (!panelObj || !$ax.public.fn.IsDynamicPanel(panelObj.type)) return {};
        var jobj = $jobj(panelId);
        if(jobj.css('position') == 'absolute') return {};

        var info = {};
        var horizontal = panelObj.fixedHorizontal;
        if(!horizontal) return info;

        info.fixed = true;
        info.horizontal = horizontal;
        info.vertical = panelObj.fixedVertical;

        if (info.horizontal == 'left') info.x = $ax.getNumFromPx(jobj.css('left'));
        else if (info.horizontal == 'center') info.x = $ax.getNumFromPx(jobj.css('margin-left'));
        else if (info.horizontal == 'right') info.x = $ax.getNumFromPx(jobj.css('right'));

        if (info.vertical == 'top') info.y = $ax.getNumFromPx(jobj.css('top'));
        else if (info.vertical == 'middle') info.y = $ax.getNumFromPx(jobj.css('margin-top'));
        else if (info.vertical == 'bottom') info.y = $ax.getNumFromPx(jobj.css('bottom'));

        return info;
    };

    // Show isn't necessary if this is always done before toggling (which is currently true), but I don't want that
    //  change (if it happened) to break this.
    var _compressToggle = function (id, vert, show, easing, duration) {
        var layer = $ax.getTypeFromElementId(id) == $ax.constants.LAYER_TYPE;
        var locProp = vert ? 'top' : 'left';
        var dimProp = vert ? 'height' : 'width';

        var threshold;
        var delta;

        threshold = $ax('#' + id)[locProp](true);
        delta = layer ? $ax('#' + id)[dimProp]() : _getShownStateObj(id)[dimProp]();

        if(!show) {
            // Need to make threshold bottom/right
            threshold += delta;
            // Delta is in the opposite direction
            delta *= -1;
        }

        _compress(id, vert, threshold, delta, easing, duration);
    };
    _dynamicPanelManager.compressToggle = _compressToggle;

    // Used when setting state of dynamic panel
    var _compressDelta = function(id, oldState, newState, vert, easing, duration) {
        var oldQuery = $jobj(oldState);
        var newQuery = $jobj(newState);

        var thresholdProp = vert ? 'top' : 'left';
        var thresholdOffset = vert ? 'height' : 'width';
        var threshold = $ax('#' + id)[thresholdProp](true);
        threshold += oldQuery[thresholdOffset]();

        var delta = newQuery[thresholdOffset]() - oldQuery[thresholdOffset]();

        var clampOffset = vert ? 'width' : 'height';
        var clampWidth = Math.max(oldQuery[clampOffset](), newQuery[clampOffset]());
         
        _compress(id, vert, threshold, delta, easing, duration, clampWidth);
    };
    _dynamicPanelManager.compressDelta = _compressDelta;

    var _compress = function (id, vert, threshold, delta, easing, duration, clampWidth) {
        // If below, a horizantal clamp, otherwise a vertical clamp
        var clamp = {
            prop: vert ? 'left' : 'top',
            offset: vert ? 'width' : 'height'
        };

        // Get clamp in coords relative to parent. Account for layers farther down
        if($ax.getTypeFromElementId(id) == $ax.constants.LAYER_TYPE) {
            clamp.start = $ax('#' + id)[clamp.prop](true);
            clamp.end = clamp.start + $ax('#' + id)[clamp.offset]();
        } else {
            var clampLoc = $jobj(id);
            if(typeof clampWidth == 'undefined') clampWidth = _getClamp(id)[clamp.offset]();

            clamp.start = $ax.getNumFromPx(clampLoc.css(clamp.prop));
            clamp.end = clamp.start + clampWidth;
        }

        // If clamps, threshold, or delta is not a number, can't compress.
        if (isNaN(clamp.start) || isNaN(clamp.end) || isNaN(threshold) || isNaN(delta)) return;

        // Update clamp if fixed, to account for body position (only necessary when page centered)
        if($jobj(id).css('position') == 'fixed') {
            var clampDelta = $('#base').position().left;
            clamp.start -= clampDelta;
            clamp.end -= clampDelta;
        }

        if(!easing) {
            easing = 'none';
            duration = 0;
        }
        var parent = $ax('#' + id).getParents(false, ['item', 'state', 'layer'])[0];
        var obj = parent && $ax.getObjectFromElementId($ax.repeater.removeSuffixFromElementId(parent));
        // Go until you hit a parent item or state, or a layer that is hidden to use as parent.
        // Account for layer container positions as you go.
        while(obj && $ax.public.fn.IsLayer(obj.type) && $ax.visibility.IsIdVisible(parent)) {
            var container = $ax.visibility.applyWidgetContainer(parent, true, true);
            // If layer is using container, offset is going to be necessary
            if(container.length) {
                var offsetX = $ax.getNumFromPx(container.css('left'));
                var offsetY = $ax.getNumFromPx(container.css('top'));
                var clampProp = clamp.prop == 'left' ? offsetX : offsetY;
                var threshProp = clamp.prop == 'left' ? offsetY : offsetX;
                threshold += threshProp;
                clamp.start += clampProp;
                clamp.end += clampProp;
            }

            parent = $ax('#' + parent).getParents(false, ['item', 'state', 'layer'])[0];
            obj = parent && $ax.getObjectFromElementId($ax.repeater.removeSuffixFromElementId(parent));
        }

        // Add container mid push causes strange behavior because we take container into account as we go down, but if after we accounted for it,
        //  a container is added, that container is not accounted for with threshold and clamp values.
        var layer = obj && $ax.public.fn.IsLayer(obj.type) && parent;
        if(layer) {
            // If your parent layer is invisible, you want to be relative to it's container. That is true already if it has a container,
            //  but if you are just adding one now, then you need to offset your values
            var needsOffset = !$jobj(layer + '_container').length && !$ax.visibility.IsIdVisible(layer);
            $ax.visibility.pushContainer(layer, false);
            if(needsOffset) {
                container = $jobj(layer + '_container');
                offsetX = $ax.getNumFromPx(container.css('left'));
                offsetY = $ax.getNumFromPx(container.css('top'));
                clampProp = clamp.prop == 'left' ? offsetX : offsetY;
                threshProp = clamp.prop == 'left' ? offsetY : offsetX;
                threshold -= threshProp;
                clamp.start -= clampProp;
                clamp.end -= clampProp;
            }
        }

        // Note: If parent is body, some of these aren't widgets
        if(parent && $jobj(parent + '_content').length > 0) parent = parent + '_content';
        if(parent && $jobj(parent + '_container').length > 0) parent = parent + '_container';
        _compressChildrenHelper(id, $(parent ? '#' + parent : '#base').children(), vert, threshold, delta, clamp, easing, duration);

        if(layer) $ax.visibility.popContainer(layer, false);

        // Do item push
        var itemId = $ax.repeater.getItemIdFromElementId(id);
        if(!itemId) return;

        var repeaterId = $ax.getParentRepeaterFromElementId(id);
        // Only need to push when parent is an item directly.
        if(parent != $ax.repeater.createElementId(repeaterId, itemId)) return;
        
        // If repeater is fit to content, then don't worry about it, it'll be handled elsewhere
        if(!obj.repeaterPropMap.fitToContent) $ax.repeater.pushItems(repeaterId, itemId, delta, vert);
    };

    var _compressChildrenHelper = function (id, children, vert, threshold, delta, clamp, easing, duration, parentLayer) {
        var toMove = [];
        var allMove = true;
        for (var i = 0; i < children.length; i++) {
            var child = $(children[i]);

            // Check for basic links
            if(child[0] && child[0].tagName == 'A' && child.hasClass('basiclink')) child = child.children();
            var childId = child.attr('id');

            // TODO: Played with this a lot, went with a safer fix, but I don't like the catch all with !$obj(childId), should handle these cases explicitally.
            //       ann/ref suffixes should skip without turning off allMove, lightbox should be skipped, and is unclear if allMove should be turned off, I think others including container, inner_container, div, img, and text should not be hit ever.
            // Don't move self, and check id to make sure it a widget and not a fixed panel
            if(childId == id || !childId || childId[0] != 'u' || !$obj(childId) || $obj(childId).fixedVertical) {
                // ann/ref widgets should not stop allMove, they move if their widget does, and that widget will be checked and turn this off if it doesn't move
                var suffix = childId && childId.split('_')[1];
                allMove = allMove && (suffix == 'ann' || suffix == 'ref');
                continue;
            }

            if ($ax.getTypeFromElementId(childId) == $ax.constants.LAYER_TYPE) {
                $ax.visibility.pushContainer(childId, false);
                var addSelf;
                var container = $ax.visibility.applyWidgetContainer(childId, true, true);
                var layerChildren = (container.length ? container : child).children();
                //if(container.length) {
                var offsetX = -$ax.getNumFromPx(container.css('left'));
                var offsetY = -$ax.getNumFromPx(container.css('top'));
                var clampProp = clamp.prop == 'left' ? offsetX : offsetY;
                var threshProp = clamp.prop == 'left' ? offsetY : offsetX;
                var layerClamp = { prop: clamp.prop, offset: clamp.offset, start: clamp.start + clampProp, end: clamp.end + clampProp };
                addSelf = _compressChildrenHelper(id, layerChildren, vert, threshold + threshProp, delta, layerClamp, easing, duration, childId);
                //} else addSelf = _compressChildrenHelper(id, layerChildren, vert, threshold, delta, clamp, easing, duration, childId);

                if(addSelf) toMove.push(childId);
                else allMove = false;
                $ax.visibility.popContainer(childId, false);
                continue;
            }

            var numbers = childId.substring(1).split('-');
            if(numbers.length < 1 || isNaN(Number(numbers[0])) || (numbers.length == 2 && isNaN(Number(numbers[1]))) || numbers.length > 2) continue;

            var marker, childClamp;

            var axChild = $ax('#' + childId);
            var markerProp = vert ? 'top' : 'left';
            marker = Number(axChild[markerProp](true));
            childClamp = [Number(axChild[clamp.prop](true))];

            if(parentLayer) {
                var axParent = $ax('#' + parentLayer);
                marker -= Number(axParent[markerProp](true));
                childClamp[0] -= Number(axParent[clamp.prop](true));
            }

            // Dynamic panels are not reporting correct size sometimes, so pull it from the state. Get shown state just returns the widget if it is not a dynamic panel.
            var sizeChild = _getShownStateObj(childId);
            childClamp[1] = childClamp[0] + sizeChild[clamp.offset]();

            if(isNaN(marker) || isNaN(childClamp[0]) || isNaN(childClamp[1]) ||
                marker < threshold || childClamp[1] <= clamp.start || childClamp[0] >= clamp.end) {
                allMove = false;
                continue;
            }

            toMove.push(childId);
        }

        if (allMove && parentLayer) {
            return true;
        } else {
            for(var i = 0; i < toMove.length; i++) {
                $ax('#' + toMove[i]).moveBy(vert ? 0 : delta, vert ? delta : 0, easing == 'none' ? {} : { duration: duration, easing: easing });
            }
        }
        return false;
    };

    var _parentHandlesStyles = function(id) {
        var parents = $ax('#' + id).getParents(true, ['dynamicPanel', 'layer'])[0];
        if(!parents) return false;
        var directParent = true;
        for(var i = 0; i < parents.length; i++) {
            var parentId = parents[i];
            var parentObj = $obj(parentId);
            if(!parentObj.propagate) {
                directParent = false;
                continue;
            }
            return { id: parentId, direct: directParent };
        }
        return false;
    };
    _dynamicPanelManager.parentHandlesStyles = _parentHandlesStyles;

    var _propagateMouseOver = function(id, value) {
        propagate(id, true, value);
    };
    _dynamicPanelManager.propagateMouseOver = _propagateMouseOver;

    var _propagateMouseDown = function(id, value) {
        propagate(id, false, value);
    };
    _dynamicPanelManager.propagateMouseDown = _propagateMouseDown;

    var propagate = function(id, hover, value) {
        var hoverChildren = function(children) {
            if(!children) return;
            for(var i = 0; i < children.length; i++) {
                var elementId = children[i].id;
                var obj = $obj(elementId);
                if(obj == null) {
                    elementId = elementId.split('_')[0];
                    obj = $obj(elementId);
                }
                if(obj == null) continue;
                if (($ax.public.fn.IsDynamicPanel(obj.type) || $ax.public.fn.IsLayer(obj.type)) && !obj.propagate) continue;

                if(hover) $ax.style.SetWidgetHover(elementId, value);
                else $ax.style.SetWidgetMouseDown(elementId, value);
                $ax.annotation.updateLinkLocations(elementId);

                hoverChildren(children[i].children);
            }
        };
        hoverChildren($ax('#' + id).getChildren(true)[0].children);
    };
});
