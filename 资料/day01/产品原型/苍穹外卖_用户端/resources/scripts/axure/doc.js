$axure.internal(function($ax) {
    var _pageData;


    var _initializePageFragment = function(pageFragment, objIdToObject) {
        var objectArrayHelper = function(objects, parent) {
            for(var i = 0; i < objects.length; i++) {
                diagramObjectHelper(objects[i], parent);
            }
        };

        var diagramObjectHelper = function(diagramObject, parent) {
            $ax.initializeObject('diagramObject', diagramObject);
            objIdToObject[pageFragment.packageId + '~' + diagramObject.id] = diagramObject;
            diagramObject.parent = parent;
            diagramObject.owner = pageFragment;
            diagramObject.scriptIds = [];
            if(diagramObject.diagrams) { //dynamic panel
                for(var i = 0; i < diagramObject.diagrams.length; i++) {
                    var diagram = diagramObject.diagrams[i];
                    objectArrayHelper(diagram.objects, diagram);
                }
            } else if($ax.public.fn.IsLayer(diagramObject.type)) {
                var layerObjs = diagramObject.objs;
                objectArrayHelper(layerObjs, parent);
            }
            if(diagramObject.objects) objectArrayHelper(diagramObject.objects, diagramObject);
        };
        objectArrayHelper(pageFragment.diagram.objects, pageFragment.diagram);
    };

    var _initalizeStylesheet = function(stylesheet) {
        var stylesById = {};
        var customStyles = stylesheet.customStyles;
        for(var key in customStyles) {
            var style = customStyles[key];
            stylesById[style.id] = style;
        }
        var duplicateStyles = stylesheet.duplicateStyles;
        for(var duplicateKey in duplicateStyles) {
            stylesById[duplicateKey] = stylesById[duplicateStyles[duplicateKey]];
        }

        stylesheet.stylesById = stylesById;
    };


    var _initializeDocumentData = function() {
        _initalizeStylesheet($ax.document.stylesheet);
    };


    var _initializePageData;
    // ******* Dictionaries ******** //
    (function() {
        var scriptIdToParentLayer = {};
        var elementIdToObject = {};
        var scriptIdToObject = {};
        var scriptIdToRepeaterId = {};
        var repeaterIdToScriptIds = {};
        var repeaterIdToItemIds = {};
        var scriptIdToPath = {};
        var _scriptIds = [];
        var elementIdToText = {};
        var radioGroupToSelectedElementId = {};
        _initializePageData = function() {
            if(!_pageData || !_pageData.page || !_pageData.page.diagram) return;

            var objIdToObject = {};
            _initializePageFragment(_pageData.page, objIdToObject);
            for(var masterId in _pageData.masters) {
                var master = _pageData.masters[masterId];
                _initializePageFragment(master, objIdToObject);
            }

            var _pathsToScriptIds = [];
            _pathToScriptIdHelper(_pageData.objectPaths, [], _pathsToScriptIds, scriptIdToPath);

            for(var i = 0; i < _pathsToScriptIds.length; i++) {
                var path = _pathsToScriptIds[i].idPath;
                var scriptId = _pathsToScriptIds[i].scriptId;

                var packageId = _pageData.page.packageId;
                if(path.length > 1) {
                    for(var j = 0; j < path.length - 1; j++) {
                        var rdoId = path[j];
                        var rdo = objIdToObject[packageId + '~' + rdoId];
                        packageId = rdo.masterId;
                    }
                }
                var diagramObject = objIdToObject[packageId + '~' + path[path.length - 1]];
                diagramObject.scriptIds[diagramObject.scriptIds.length] = scriptId;

                scriptIdToObject[scriptId] = diagramObject;
                _scriptIds[_scriptIds.length] = scriptId;
            }

            // Now map scriptIds to repeaters and layers
            var mapScriptIdToRepeaterId = function(scriptId, repeaterId) {
                scriptIdToRepeaterId[scriptId] = repeaterId;
                var scriptIds = repeaterIdToScriptIds[repeaterId];
                if(scriptIds) scriptIds[scriptIds.length] = scriptId;
                else repeaterIdToScriptIds[repeaterId] = [scriptId];
            };
            var mapScriptIdToLayerId = function(obj, layerId, path) {
                var pathCopy = $ax.deepCopy(path);
                pathCopy[path.length] = obj.id;
                var scriptId = $ax.getScriptIdFromPath(pathCopy);
                scriptIdToParentLayer[scriptId] = layerId;
            }
            var mapIdsToRepeaterAndLayer = function(path, objs, repeaterId) {
                var pathCopy = $ax.deepCopy(path);

                for(var i = 0; i < objs.length; i++) {
                    var obj = objs[i];
                    pathCopy[path.length] = obj.id;
                    var scriptId = $ax.getScriptIdFromPath(pathCopy);
                    // Rdo have no element on page and are not mapped to the repeater
                    if(repeaterId) mapScriptIdToRepeaterId(scriptId, repeaterId);

                    if($ax.public.fn.IsDynamicPanel(obj.type)) {
                        for(var j = 0; j < obj.diagrams.length; j++) mapIdsToRepeaterAndLayer(path, obj.diagrams[j].objects, repeaterId);
                    } else if($ax.public.fn.IsReferenceDiagramObject(obj.type)) {
                        mapIdsToRepeaterAndLayer(pathCopy, $ax.pageData.masters[obj.masterId].diagram.objects, repeaterId);
                    } else if($ax.public.fn.IsRepeater(obj.type)) {
                        mapScriptIdToRepeaterId(scriptId, scriptId);
                        mapIdsToRepeaterAndLayer(path, obj.objects, scriptId);
                    } else if($ax.public.fn.IsLayer(obj.type)) {
                        var layerObjs = obj.objs;
                        for(var j = 0; j < layerObjs.length; j++) {
                            mapScriptIdToLayerId(layerObjs[j], scriptId, path);
                        }
                        mapIdsToRepeaterAndLayer(path, layerObjs, repeaterId);
                    } else if(obj.objects && obj.objects.length) {
                        if(repeaterId) {
                            for(var j = 0; j < obj.objects.length; j++) {
                                mapIdsToRepeaterAndLayer(path, obj.objects, repeaterId);
                            }
                        }
                    }
                }
            };
            mapIdsToRepeaterAndLayer([], $ax.pageData.page.diagram.objects);
        };


        $ax.getPathFromScriptId = function(scriptId) {
            var reversedPath = [];
            var path = scriptIdToPath[scriptId];
            while(path && path.uniqueId) {
                reversedPath[reversedPath.length] = path.uniqueId;
                path = path.parent;
            }
            return reversedPath.reverse();
        };

        var _getScriptIdFromFullPath = function(path) {
            var current = $ax.pageData.objectPaths;
            for(var i = 0; i < path.length; i++) {
                current = current[path[i]];
                if(!current) return current;
            }
            return current && current.scriptId;
        };


        var _getScriptIdFromPath = function(path, relativeTo, includeLimbo) {
            var relativePath = [];
            var includeMasterInPath = false;
            if(relativeTo) {
                var relativeToScriptId;
                if(relativeTo.srcElement) { //this is eventInfo
                    relativeToScriptId = $ax.repeater.getScriptIdFromElementId(relativeTo.srcElement);
                    includeMasterInPath = relativeTo.isMasterEvent;
                } else if(typeof relativeTo === 'string') { //this is an element id
                    relativeToScriptId = relativeTo;
                }

                if(relativeToScriptId) {
                    relativePath = $ax.getPathFromScriptId(relativeToScriptId);
                    if(!includeMasterInPath) relativePath = relativePath.slice(0, relativePath.length - 1);
                } else if(relativeTo instanceof Array) { //this is a path
                    relativePath = relativeTo;
                }
            }
            var fullPath = relativePath.concat(path);
            var scriptId = _getScriptIdFromFullPath(fullPath);
            return (includeLimbo || !$ax.visibility.isScriptIdLimbo(scriptId)) && scriptId;
        };
        $ax.getScriptIdFromPath = _getScriptIdFromPath;

        var _getElementIdsFromPath = function(path, eventInfo) {
            var scriptId = _getScriptIdFromPath(path, eventInfo);
            if(!scriptId) return [];
            // Don't need placed check hear. If unplaced, scriptId will be undefined and exit out before here.
            return $ax.getElementIdsFromEventAndScriptId(eventInfo, scriptId);
        };
        $ax.getElementIdsFromPath = _getElementIdsFromPath;

        var _getElementIdFromPath = function(path, params, includeLimbo) {
            var scriptId = _getScriptIdFromPath(path, params.relativeTo, includeLimbo);
            if(!scriptId) return scriptId;

            var itemNum = params.itemNum;
            if(params.relativeTo && typeof params.relativeTo === 'string') {
                if($jobj(params.relativeTo)) itemNum = $ax.repeater.getItemIdFromElementId(params.relativeTo);
            }
            return $ax.repeater.createElementId(scriptId, itemNum);
        };
        $ax.getElementIdFromPath = _getElementIdFromPath;

        var _getElementsIdFromEventAndScriptId = function(eventInfo, scriptId) {
            var itemId = eventInfo && $ax.repeater.getItemIdFromElementId(eventInfo.srcElement);
            var target = false;
            // Try to get itemId from target if you can't get it from source.
            if(!itemId) {
                itemId = eventInfo && eventInfo.targetElement && $ax.repeater.getItemIdFromElementId(eventInfo.targetElement);
                if(itemId) target = true;
            }

            var parentRepeater = $ax.getParentRepeaterFromScriptId(scriptId);
            if(parentRepeater && scriptId != parentRepeater) {
                if(itemId && (!eventInfo || parentRepeater == $ax.getParentRepeaterFromScriptId($ax.repeater.getScriptIdFromElementId(target ? eventInfo.targetElement : eventInfo.srcElement)))) {
                    return [$ax.repeater.createElementId(scriptId, itemId)];
                }
                var elementIds = [];
                var itemIds = $ax.getItemIdsForRepeater(parentRepeater);
                if(!itemIds) return [];

                for(var i = 0; i < itemIds.length; i++) elementIds[i] = $ax.repeater.createElementId(scriptId, itemIds[i]);
                return elementIds;
            }
            return [scriptId];
        };
        $ax.getElementIdsFromEventAndScriptId = _getElementsIdFromEventAndScriptId;

        var _getSrcElementIdFromEvent = function(event) {
            var currentQuery = $(event.srcElement || event.target);
            while(currentQuery && currentQuery.length && (!$obj(currentQuery.attr('id')) || $jobj(currentQuery.attr('id')).hasClass('text'))) {
                currentQuery = currentQuery.parent();
            };
            return currentQuery.attr('id');
        };
        $ax.getSrcElementIdFromEvent = _getSrcElementIdFromEvent;

        var _getEventInfoFromEvent = function(event, skipShowDescriptions, elementId) {
            var eventInfo = {};
            eventInfo.srcElement = elementId;
            eventInfo.now = new Date();

            if(event != null) {
                //elementId can be empty string, so can't simple use "or" assignment here.
                eventInfo.srcElement = elementId || elementId == '' ? elementId : _getSrcElementIdFromEvent(event);
                eventInfo.which = event.which;

                // When getting locations in mobile, need to extract the touch object to get the mouse location attributes
                var mouseEvent = (event.originalEvent && event.originalEvent.changedTouches && event.originalEvent.changedTouches[0]) || event.originalEvent;
                if(mouseEvent && !mouseEvent.type) mouseEvent.type = event.type;

                if(skipShowDescriptions) eventInfo.skipShowDescriptions = true;

                // Always update mouse location if possible
                $ax.event.updateMouseLocation(mouseEvent);
            }

            // Always set event info about cursor
            var _cursor = eventInfo.cursor = {};
            _cursor.x = $ax.mouseLocation.x;
            _cursor.y = $ax.mouseLocation.y;

            var body = $('body');
            if(body.css('position') == 'relative') {
                _cursor.x -= ($ax.getNumFromPx(body.css('left')) + Math.max(0, ($(window).width() - body.width()) / 2));
            }

            eventInfo.pageX = _cursor.x + 'px';
            eventInfo.pageY = _cursor.y + 'px';

            // Do Keyboard Info
            eventInfo.keyInfo = $ax.event.keyState();

            eventInfo.window = $ax.getWindowInfo();

            eventInfo.thiswidget = _getWidgetInfo(eventInfo.srcElement);
            eventInfo.item = _getItemInfo(eventInfo.srcElement);
            eventInfo.dragInfo = $ax.drag.GetWidgetDragInfo();

            return eventInfo;
        };
        $ax.getEventInfoFromEvent = _getEventInfoFromEvent;

        $ax.getBasicEventInfo = function() {
            var eventInfo = {};
            eventInfo.now = new Date();
            eventInfo.window = $ax.getWindowInfo();
            eventInfo.cursor = { x: 0, y: 0};
            return eventInfo;

        };

        //var _getWindowInfo = function() {
        //    var win = {};
        //    win.width = $(window).width();
        //    win.height = $(window).height();
        //    win.scrollx = $(window).scrollLeft();
        //    win.scrolly = $(window).scrollTop();
        //    return win;
        //};
        //$ax.getWindowInfo = _getWindowInfo;

        var repeaterInfoCache = [];
        $ax.cacheRepeaterInfo = function(repeaterId, repeaterInfo) {
            repeaterInfoCache[repeaterId] = repeaterInfo;
        }
        $ax.removeCachedRepeaterInfo = function(repeaterId) {
            repeaterInfoCache[repeaterId] = undefined;
        }

        var _getItemInfo = function(elementId) {
            if(!elementId) return { valid: false };

            elementId = _getParentElement(elementId);

            var index = $ax.repeater.getItemIdFromElementId(elementId);
            if(!index) return { valid: false };

            var item = { valid: true };

            var scriptId = $ax.repeater.getScriptIdFromElementId(elementId);
            var repeaterId = $ax.getParentRepeaterFromScriptId(scriptId);
            item.repeater = repeaterInfoCache[repeaterId] ? repeaterInfoCache[repeaterId] : _getWidgetInfo(repeaterId);
            $ax.repeater.setDisplayProps(item, repeaterId, index);
            item.ismarked = $ax.repeater.isEditItem(repeaterId, index);
            item.isvisible = Boolean($jobj(elementId).length);

            return item;
        };
        $ax.getItemInfo = _getItemInfo;

        var _getWidgetInfo = function(elementId) {
            if(!elementId) return { valid: false };

            elementId = _getParentElement(elementId);

            //var elementAxQuery = $ax('#' + elementId);
            var elementQuery = $jobj(elementId);
            var obj = $obj(elementId);
            var widget = { valid: true, isWidget: true, obj: obj, elementQuery: elementQuery, isLayer: $ax.public.fn.IsLayer(obj.type) };
            widget.elementId = elementId;
            widget.name = widget.label = (elementQuery.data('label') ? elementQuery.data('label') : '');
            //widget.text = $ax('#' + elementId).text();
            widget.opacity = Number(elementQuery.css('opacity')) * 100;
            //widget.rotation = $ax.move.getRotationDegree(widget.elementId);
            var scriptId = $ax.repeater.getScriptIdFromElementId(elementId);
            var repeaterId = $ax.getParentRepeaterFromScriptId(scriptId);
            if(repeaterId) widget.repeater = $ax.public.fn.IsRepeater(obj.type) ? widget : _getWidgetInfo(repeaterId);
            
            // Right now only dynamic panel can scroll
            if($ax.public.fn.IsDynamicPanel(obj.type)) {
                var stateId = $ax.visibility.GetPanelState(elementId);
                //can be empty when refreshing repeater and applying filter
                if(stateId) {
                    var stateQuery = $('#' + stateId);
                    widget.scrollx = stateQuery.scrollLeft();
                    widget.scrolly = stateQuery.scrollTop();
                    //widget.stateQuery = stateQuery;
                }
            } else {
                widget.scrollx = 0;
                widget.scrolly = 0;
            }

            // repeater only props
            if($ax.public.fn.IsRepeater(obj.type)) {
                widget.visibleitemcount = repeaterIdToItemIds[scriptId] ? repeaterIdToItemIds[scriptId].length : $ax.repeater.getVisibleDataCount(scriptId);
                widget.itemcount = $ax.repeater.getFilteredDataCount(scriptId);
                widget.datacount = $ax.repeater.getDataCount(scriptId);
                widget.pagecount = $ax.repeater.getPageCount(scriptId);
                widget.pageindex = $ax.repeater.getPageIndex(scriptId);
            }

            // Get widget info funcs
            //widget.elementAxQuery = function () {
            //    return this.elementAxQueryProp || (this.elementAxQueryProp = $ax('#' + this.elementId));
            //}

            //widget.isFitToContent = function () {
            //    if (this.isFitToContentProp === undefined) {
            //        if (!this.stateQuery) this.isFitToContentProp = false;
            //        else this.isFitToContentProp = $ax.dynamicPanelManager.isIdFitToContent(this.elementId);
            //    }
            //    return this.isFitToContentProp;
            //}

            widget.x = function () { return this.getProp('x'); }
            widget.y = function () { return this.getProp('y'); }
            widget.pagex = function () { return this.getProp('pagex'); }
            widget.pagey = function () { return this.getProp('pagey'); }
            widget.width = function () { return this.getProp('width'); }
            widget.height = function () { return this.getProp('height'); }
            widget.left = function () { return this.x(); }
            widget.top = function () { return this.y(); }
            widget.right = function () { return this.x() + this.width(); }
            widget.bottom = function () { return this.y() + this.height(); }
            widget.rotation = function () { return this.getProp('rotation'); }
            widget.text = function () { return this.getProp('text'); }

            widget.getProp = function (prop) {
                var propName = prop + 'Prop';
                if (typeof (this[propName]) != 'undefined') return this[propName];
                return this[propName] = this.cacheProp(prop);
            };

            widget.cacheProp = function (prop) {

                if(prop == 'x' || prop == 'y' || prop == 'width' || prop == 'height') {
                    var boundingRect = $ax('#' + this.elementId).offsetBoundingRect(true);
                    this.xProp = boundingRect.left;
                    this.yProp = boundingRect.top;
                    this.widthProp = boundingRect.width;
                    this.heightProp = boundingRect.height;                    
                }

                if(prop == 'pagex' || prop == 'pagey') {
                    var viewportLocation = $ax('#' + this.elementId).viewportLocation();
                    this.pagexProp = viewportLocation.left;
                    this.pageyProp = viewportLocation.top;
                }

                if(prop == 'rotation') {
                    this.rotationProp = $ax.move.getRotationDegree(this.elementId);
                }

                if (prop == 'text') {
                    this.textProp = $ax('#' + this.elementId).text();
                }

                return this[prop + 'Prop'];

                //// I'm keeping the returned undefineds the same as before, but really I could probably return undefined right away if elementQuery is empty
                //if (this.isLayer) {
                //    if (prop == 'pagex' || prop == 'pagey') {
                //        if (this.elementQuery.length > 0) {
                //            if (prop == 'pagex') return this.elementAxQuery().left();
                //            else return this.elementAxQuery().top();
                //        }
                //        return undefined; // Otherwise, it is undefined as there is no element
                //    }
                //    var boundingRect = $ax.public.fn.getWidgetBoundingRect(this.elementId);
                //    this.xProp = boundingRect.left;
                //    this.yProp = boundingRect.top;
                //    this.widthProp = boundingRect.width;
                //    this.heightProp = boundingRect.height;
                //    return this[prop + 'Prop'];
                //}

                //if (this.elementQuery.length <= 0) return prop == 'x' || prop == 'y' ? 0 : undefined;

                //switch (prop) {
                //    case 'x': return this.elementAxQuery().locRelativeIgnoreLayer(false);
                //    case 'y': return this.elementAxQuery().locRelativeIgnoreLayer(true);
                //    case 'pagex': return this.elementAxQuery().left();
                //    case 'pagey': return this.elementAxQuery().top();
                //}

                //var val = this.elementAxQuery()[prop]();
                //if (this.isFitToContent()) val = this.stateQuery[prop]();

                //return val;
            };

            //widget.leftfixed = function() { this.getFixed('left'); }
            //widget.topfixed = function() { this.getFixed('top'); }
            //widget.rightfixed = function() { this.getFixed('right'); }
            //widget.bottomfixed = function() { this.getFixed('bottom'); }

            //widget.isFixed = function() {
            //    if(this.isFixedProp === undefined) this.isFixedProp = this.elementQuery.css('position') == 'fixed)';
            //    return this.isFixedProp;
            //}

            //widget.getFixed = function (prop) {
            //    var fixed = prop + 'fixedProp';
            //    if(!this.isFixed()) widget[fixed] = widget[prop]();
            //    if(widget[fixed] === undefined) {

            //        if(prop == 'left' || prop == 'right') {
            //            if(this.windowScrollX === undefined) this.windowScrollX = $(window).scrollLeft();
            //            var windowScroll = this.windowScrollX;
            //        } else {
            //            if(this.windowScrollY === undefined) this.windowScrollY = $(window).scrollTop();
            //            windowScroll = this.windowScrollY;
            //        }
            //        widget[fixed] = widget[prop]() - windowScroll;
            //    }
            //    return widget[fixed];
            //}

            return widget;
        };
        $ax.getWidgetInfo = _getWidgetInfo;

        $ax.GetTextPanelId = function (id, create) {
            if(!$ax('#' + id).SupportsRichText()) return '';
            var buttonShape = $ax.GetButtonShape(id);
            var panelDiv = buttonShape.find('.text')[0];
            if(!panelDiv) {
                if(!create) return "";

                var adaptiveId = $ax.adaptive.currentViewId;
                var newId = id + "_text";
                //var newDiv = $('<div id="' + newId + '" class="text" style="visibility: inherit; position: absolute"></div>');
                var newDiv = $('<div id="' + newId + '" class="text' + (adaptiveId ? (' ' + adaptiveId) : '') + '" style="visibility: inherit; position: absolute"><p><span></span></p></div>');
                buttonShape.append(newDiv);

                $ax.style.setAdaptiveStyle(id, $ax.style.computeAllOverrides(id, undefined, $ax.style.generateState(id), adaptiveId));

                panelDiv = newDiv[0];
            }

            return panelDiv.id;
        }

        $ax.GetParentIdFromLink = function(id) {
            return $ax.GetShapeIdFromText($jobj(id).parentsUntil('.text').parent().attr('id'));
        };

        $ax.GetButtonShapeId = function(id) {
            var obj = $obj(id);
            switch(obj.type) {
            case $ax.constants.TREE_NODE_OBJECT_TYPE:
                return obj.buttonShapeId ? $ax.getElementIdFromPath([obj.buttonShapeId], { relativeTo: id }) : "";
            case $ax.constants.LINK_TYPE:
                return "";
            default:
                return id;
            }
        };

        $ax.GetButtonShape = function(id) {
            return $jobj($ax.GetButtonShapeId(id));
        };

        $ax.GetShapeIdFromText = function(id) {
            if(!id) return undefined; // this is to prevent an infinite loop.

            var current = document.getElementById(id);
            if(!current) return undefined;
            current = current.parentElement;
            while(current && current.tagName != 'BODY') {
                var currentId = current.id;
                if(currentId && currentId != 'base') return $ax.visibility.getWidgetFromContainer(currentId);
                current = current.parentElement;
            }

            return undefined;
        };

        $ax.GetImageIdFromShape = function(id) {
            var image = $ax.GetButtonShape(id).find('img[id$=img]');
            if(!image.length) image = $jobj(id).find('img[id$=image_sketch]');
            return image.attr('id');
        };

        var _getParentElement = $ax.getParentElement = function(elementId) {
            var obj = $obj(elementId);
            while(obj.isContained) {
                var path = $ax.getPathFromScriptId($ax.repeater.getScriptIdFromElementId(elementId));
                var itemId = $ax.repeater.getItemIdFromElementId(elementId);
                path[path.length - 1] = obj.parent.id;
                elementId = $ax.getElementIdFromPath(path, { itemNum: itemId });
                obj = $obj(elementId);
            }

            return elementId;
        };

        $ax.addItemIdToRepeater = function(itemId, repeaterId) {
            var itemIds = repeaterIdToItemIds[repeaterId];
            if(itemIds) itemIds[itemIds.length] = itemId;
            else repeaterIdToItemIds[repeaterId] = [itemId];

            var scriptIds = repeaterIdToScriptIds[repeaterId];
            for(var i = 0; i < scriptIds.length; i++) elementIdToObject[$ax.repeater.createElementId(scriptIds[i], itemId)] = $ax.getObjectFromScriptId(scriptIds[i]);
        };

        $ax.getAllElementIds = function() {
            var elementIds = [];
            for(var i = 0; i < _scriptIds.length; i++) {
                var scriptId = _scriptIds[i];
                var repeaterId = scriptIdToRepeaterId[scriptId];
                if(repeaterId && repeaterId != scriptId) {
                    var itemIds = repeaterIdToItemIds[repeaterId] || [];
                    for(var j = 0; j < itemIds.length; j++) elementIds[elementIds.length] = $ax.repeater.createElementId(scriptId, itemIds[j]);
                } else elementIds[elementIds.length] = scriptId;
            }
            return elementIds;
        };

        $ax.getAllScriptIds = function() {
            return _scriptIds;
        };

        $ax.getObjectFromElementId = function(elementId) {
            return $ax.getObjectFromScriptId($ax.repeater.getScriptIdFromElementId(elementId));
        };

        $ax.getObjectFromScriptId = function(scriptId) {
            return scriptIdToObject[scriptId];
        };

        $ax.getParentRepeaterFromElementId = function(elementId) {
            return $ax.getParentRepeaterFromScriptId($ax.repeater.getScriptIdFromElementId(elementId));
        };

        $ax.getParentRepeaterFromElementIdExcludeSelf = function (elementId) {
            var repeaterId = $ax.getParentRepeaterFromElementId(elementId);
            return repeaterId != elementId ? repeaterId : undefined;
        };

        $ax.getParentRepeaterFromScriptId = function(scriptId) {
            return scriptIdToRepeaterId[scriptId];
        };

        var _getChildScriptIdsForRepeater = function(repeaterId) {
            return repeaterIdToScriptIds[repeaterId];
        };

        var _getItemIdsForRepeater = function(repeaterId) {
            return repeaterIdToItemIds[repeaterId] || [];
        };
        $ax.getItemIdsForRepeater = _getItemIdsForRepeater;

        var _clearItemIdsForRepeater = function(repeaterId) {
            repeaterIdToItemIds[repeaterId] = [];
        };
        $ax.clearItemsForRepeater = _clearItemIdsForRepeater;

        $ax.getChildElementIdsForRepeater = function(repeaterId) {
            var scriptIds = _getChildScriptIdsForRepeater(repeaterId);
            var itemIds = _getItemIdsForRepeater(repeaterId);

            var retVal = [];
            if(!itemIds || !scriptIds) return retVal;

            for(var i = 0; i < scriptIds.length; i++) {
                for(var j = 0; j < itemIds.length; j++) {
                    retVal[retVal.length] = $ax.repeater.createElementId(scriptIds[i], itemIds[j]);
                }
            }
            return retVal;
        };

        $ax.getRdoParentFromElementId = function(elementId) {
            var scriptId = $ax.repeater.getScriptIdFromElementId(elementId);
            var rdoId = scriptIdToPath[scriptId].parent.scriptId;
            if($ax.getParentRepeaterFromScriptId(rdoId)) rdoId = $ax.repeater.createElementId(rdoId, $ax.repeater.getItemIdFromElementId(elementId));
            return rdoId;
        };

        $ax.getLayerParentFromElementId = function (elementId) {
            var itemId = $ax.repeater.getItemIdFromElementId(elementId);
            var scriptId = scriptIdToParentLayer[$ax.repeater.getScriptIdFromElementId(elementId)];
            return $ax.getParentRepeaterFromElementId(scriptId) ? $ax.repeater.createElementId(scriptId, itemId) : scriptId;
        }

        $ax.updateElementText = function(elementId, text) {
            elementIdToText[elementId] = text;
        };

        $ax.hasElementTextChanged = function(elementId, text) {
            return elementIdToText[elementId] != text;
        };

        $ax.updateRadioButtonSelected = function(group, elementId) {
            var old = radioGroupToSelectedElementId[group];
            radioGroupToSelectedElementId[group] = elementId;
            return old;
        };

        $ax.hasRadioButtonSelectedChanged = function(group, elementId) {
            return radioGroupToSelectedElementId[group] != elementId;
        };
    })();

    //Recursively populates fullPathArray with:
    // [ { idPath, scriptId }, ... ]
    //for every scriptId in the object
    //also populates an object of scriptId -> path
    var _pathToScriptIdHelper = function(currentPath, currentChain, fullPathArray, scriptIdToPath) {
        for(var key in currentPath) {
            if(key != "scriptId") {
                var nextPath = currentPath[key];
                _pathToScriptIdHelper(nextPath, currentChain.concat(key), fullPathArray, scriptIdToPath);
                nextPath.parent = currentPath;
                nextPath.uniqueId = key;
            } else {
                fullPathArray[fullPathArray.length] = { idPath: currentChain, scriptId: currentPath.scriptId };
                scriptIdToPath[currentPath.scriptId] = currentPath;
            }
        }
    };

    $ax.public.loadCurrentPage = $ax.loadCurrentPage = function(pageData) {
        $ax.pageData = _pageData = pageData;
        _initializePageData();
    };

    $ax.public.loadDocument = $ax.loadDocument = function(document) {
        $ax.document = document;
        _initializeDocumentData();
    };


    /**
    Navigates to a page


    */
    $ax.public.navigate = $ax.navigate = function(to) { //url, includeVariables, type) {
        var targetUrl;
        if(typeof (to) === 'object') {
            includeVariables = to.includeVariables;
            targetUrl = !includeVariables ? to.url : $ax.globalVariableProvider.getLinkUrl(to.url);

            if(to.target == "new") {
                window.open(targetUrl, "");
            } else if(to.target == "popup") {
                var features = _getPopupFeatures(to.popupOptions);
                window.open(targetUrl, "", features);
            } else {
                var targetLocation = window.location;
                if(to.target == "current") {
                } else if(to.target == "parent") {
                    if(!top.opener) return;
                    targetLocation = top.opener.window.location;
                } else if(to.target == "parentFrame") {
                    targetLocation = parent.location;
                } else if(to.target == "frame") {
                    //                    targetLocation = to.frame.contentWindow.location;
                    $(to.frame).attr('src', targetUrl || 'about:blank');
                    return;
                }

                if (!_needsReload(targetLocation, to.url)) {
                    targetLocation.href = targetUrl || 'about:blank';
                } else {
                    targetLocation.href = $axure.utils.getReloadPath() + "#" + encodeURI(targetUrl);
                }
            }
        } else {
            $ax.navigate({
                url: to,
                target: "current",
                includeVariables: arguments[1]
            });
        }
    };

    var _needsReload = function(oldLocation, newBaseUrl) {
        var reload = false;
        try {
            var oldUrl = oldLocation.href;
            var oldBaseUrl = oldUrl.split("#")[0];
            var lastslash = oldBaseUrl.lastIndexOf("/");
            if(lastslash > 0) {
                oldBaseUrl = oldBaseUrl.substring(lastslash + 1, oldBaseUrl.length);
                if(oldBaseUrl == encodeURI(newBaseUrl)) {
                    reload = true;
                }
            }
        } catch(e) {
        }
        return reload;
    };

    var _getPopupFeatures = function(options) {
        var defaultOptions = {
            toolbar: true,
            scrollbars: true,
            location: true,
            status: true,
            menubar: true,
            directories: true,
            resizable: true,
            centerwindow: true,
            left: -1,
            top: -1,
            height: -1,
            width: -1
        };

        var selectedOptions = $.extend({}, defaultOptions, options);

        var optionsList = [];
        optionsList.push('toolbar=' + (selectedOptions.toolbar ? 'yes' : 'no'));
        optionsList.push('scrollbars=' + (selectedOptions.scrollbars ? 'yes' : 'no'));
        optionsList.push('location=' + (selectedOptions.location ? 'yes' : 'no'));
        optionsList.push('status=' + (selectedOptions.status ? 'yes' : 'no'));
        optionsList.push('menubar=' + (selectedOptions.menubar ? 'yes' : 'no'));
        optionsList.push('directories=' + (selectedOptions.directories ? 'yes' : 'no'));
        optionsList.push('resizable=' + (selectedOptions.resizable ? 'yes' : 'no'));

        if(selectedOptions.centerwindow == false) {
            if(selectedOptions.left > -1) {
                optionsList.push('left=' + selectedOptions.left);
            }

            if(selectedOptions.top > -1) {
                optionsList.push('top=' + selectedOptions.top);
            }
        }

        var height = 0;
        var width = 0;
        if(selectedOptions.height > 0) {
            optionsList.push('height=' + selectedOptions.height);
            height = selectedOptions.height;
        }

        if(selectedOptions.width > 0) {
            optionsList.push('width=' + selectedOptions.width);
            width = selectedOptions.width;
        }

        var features = optionsList.join(',');
        if(selectedOptions.centerwindow) {
            var winl = (window.screen.width - width) / 2;
            var wint = (window.screen.height - height) / 2;
            features = features + ',left=' + winl + ',top=' + wint;
        }

        return features;
    };

    /**
    Closes a window


    */
    $ax.public.closeWindow = $ax.closeWindow = function() {
        parent.window.close();
    };

    /**
    Goes back


    */
    $ax.public.back = $ax.back = function() {
        window.history.go(-1);
    };

    /**
    Reloads the current page.
    # includeVariables: true if it should re-include the variables when the page is reloaded
    */
    $ax.public.reload = $ax.reload = function(includeVariables) {
        var targetUrl = (includeVariables === false)
            ? $axure.utils.getReloadPath() + "#" + encodeURI($ax.pageData.url)
            : $axure.utils.getReloadPath() + "#" + encodeURI($ax.globalVariableProvider.getLinkUrl($ax.pageData.url));
        window.location.href = targetUrl;
    };

    /**
    Sets a variable.
    # name: The name of the global variable to set
    # value: The value that should be set
    */
    $ax.public.setGlobalVariable = $ax.setGlobalVariable = function(name, value) {
        if(!name || !value) {
            return;
        }

        $ax.globalVariableProvider.setVariableValue(name, value);
    };

    /**
    Gets the value of a global variable
    # name: The name of the global variable value to get
    */
    $ax.public.getGlobalVariable = $ax.getGlobalVariable = function(name) {
        $ax.globalVariableProvider.getVariableValue(name);
    };

    $ax.getObjectFromElementIdDisregardHex = function (elementId) {
        var elementIdInput = elementId.charAt(0) == '#' ? elementId.substring(1) : elementId;
        return this.getObjectFromElementId(elementIdInput);
    }


    $ax.getTypeFromElementId = function(elementId) {
        var obj = this.getObjectFromElementIdDisregardHex(elementId);
        return obj && obj.type;
    };

    $ax.getNumFromPx = function(pxNum) {
        return Number(pxNum.replace('px', ''));
    }

});