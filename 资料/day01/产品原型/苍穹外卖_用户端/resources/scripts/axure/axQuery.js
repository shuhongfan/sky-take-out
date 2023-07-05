$axure = function(query) {
    return $axure.query(query);
};
 
// ******* AxQuery and Page metadata ******** //
(function() {
    var $ax = function() {
        var returnVal = $axure.apply(this, arguments);
        var axFn = $ax.fn;
        for (var key in axFn) {
            returnVal[key] = axFn[key];
        }

        return returnVal;
    };

    $ax.public = $axure;
    $ax.fn = {};

    $axure.internal = function(initFunction) {
        //Attach messagecenter to $ax object so that it can be used in viewer.js, etc in internal scope
        if(!$ax.messageCenter) $ax.messageCenter = $axure.messageCenter;

        return initFunction($ax);
    };
    
   var _lastFiredResize = 0; 
   var _resizeFunctions = []; 
   var _lastTimeout;
   var _fireResize = function() {
       if (_lastTimeout) window.clearTimeout(_lastTimeout);       
       _lastTimeout = undefined;
       _lastFiredResize = new Date().getTime(); 
       for(var i = 0; i < _resizeFunctions.length; i++) _resizeFunctions[i](); 
   };
    
   $axure.resize = function(fn) { 
       if(fn) _resizeFunctions[_resizeFunctions.length] = fn; 
       else $(window).resize(); 
   };

    $(window).resize(function() {
        var THRESHOLD = 50;
        var now = new Date().getTime();
        if(now - _lastFiredResize > THRESHOLD) {
            _updateWindowInfo();
            _fireResize();
        } else if(!_lastTimeout) {
            _lastTimeout = window.setTimeout(_fireResize, THRESHOLD);
        }
   });

    $(window).scroll(function () {
        _updateWindowInfo();
    });

    var _windowInfo;
    var _updateWindowInfo = $axure.updateWindowInfo = function () {
        var win = {};
        var jWin = $(window);
        var scrollWin = $('#ios-safari-html').length > 0 ? $('#ios-safari-html') : jWin;
        win.width = jWin.width();
        win.height = jWin.height();
        win.scrollx = scrollWin.scrollLeft();
        win.scrolly = scrollWin.scrollTop();
        _windowInfo = win;
    };
    $ax.getWindowInfo = function () {
        if(!_windowInfo) _updateWindowInfo();
        return _windowInfo;
    };

    
    window.$obj = function(id) {
        return $ax.getObjectFromElementId(id);
    };

    window.$id = function(obj) {
        return obj.scriptIds[0];
    };

    window.$jobj = function(id) {
        return $(document.getElementById(id));
    };

    window.$jobjAll = function(id) {
        return $addAll($jobj(id), id);
    };

    window.$addAll = function(jobj, id) {
        return jobj.add($jobj(id + '_ann')).add($jobj(id + '_ref'));
    };

    $ax.INPUT = function(id) { return id + "_input"; };
    $ax.IsImageFocusable = function (type) { return $ax.public.fn.IsImageBox(type) || $ax.public.fn.IsVector(type) || $ax.public.fn.IsTreeNodeObject(type) || $ax.public.fn.IsTableCell(type); };
    $ax.IsTreeNodeObject = function (type) { return $ax.public.fn.IsTreeNodeObject(type); };
    $ax.IsSelectionButton = function (type) { return $ax.public.fn.IsCheckBox(type) || $ax.public.fn.IsRadioButton(type); };

    var _fn = {};
    $axure.fn = _fn;
    $axure.fn.jQuery = function() {
        var elements = this.getElements();
        return $(elements);
    };
    $axure.fn.$ = $axure.fn.jQuery;

    var _query = function(query, queryArg) {
        var returnVal = {};
        var _axQueryObject = returnVal.query = { };
        _axQueryObject.filterFunctions = [];

        if (query == '*') {
            _axQueryObject.filterFunctions[0] = function() { return true; };
        } else if (typeof(query) === 'function') {
            _axQueryObject.filterFunctions[0] = query;
        } else {
            var firstString = $.trim(query.toString());
            if (firstString.charAt(0) == '@') {
                _axQueryObject.filterFunctions[0] = function(diagramObject) {
                    return diagramObject.label == firstString.substring(1);
                };
            } else if (firstString.charAt(0) == '#') {
                _axQueryObject.elementId = firstString.substring(1);
            } else {
                if (firstString == 'label') {
                    _axQueryObject.filterFunctions[0] = function(diagramObject) {
                        return queryArg instanceof Array && queryArg.indexOf(diagramObject.label) > 0 ||
                            queryArg instanceof RegExp && queryArg.test(diagramObject.label) ||
                            diagramObject.label == queryArg;
                    };
                } else if(firstString == 'elementId') {
                    _axQueryObject.filterFunctions[0] = function(diagramObject, elementId) {
                        return queryArg instanceof Array && queryArg.indexOf(elementId) > 0 ||
                            elementId == queryArg;
                    };
                }
            }
        }

        var axureFn = $axure.fn;
        for (var key in axureFn) {
            returnVal[key] = axureFn[key];
        }
        return returnVal;
    };
    $axure.query = _query;

    var _getFilterFnFromQuery = function(query) {
        var filter = function(diagramObject, elementId) {
            // Non diagram objects are allowed to be queryed, such as text inputs.
            if (diagramObject && !$ax.public.fn.IsReferenceDiagramObject(diagramObject.type) && !document.getElementById(elementId)) return false;
            var retVal = true;
            for(var i = 0; i < query.filterFunctions.length && retVal; i++) {
                retVal = query.filterFunctions[i](diagramObject, elementId);
            }
            return retVal;
        };
        return filter;
    };

    $ax.public.fn.filter = function(query, queryArg) {
        var returnVal = _query(query, queryArg);
        
        if(this.query.elementId) returnVal.query.elementId = this.query.elementId;
        
        //If there is already a function, offset by 1 when copying other functions over.
        var offset = returnVal.query.filterFunctions[0] ? 1 : 0;
        
        //Copy all functions over to new array.
        for(var i = 0; i < this.query.filterFunctions.length; i++) returnVal.query.filterFunctions[i+offset] = this.query.filterFunctions[i];
        
        //Functions are in reverse order now
        returnVal.query.filterFunctions.reverse();

        return returnVal;
    };

    $ax.public.fn.each = function(fn) {
        var filter = _getFilterFnFromQuery(this.query);
        var elementIds = this.query.elementId ? [this.query.elementId] : $ax.getAllElementIds();
        for (var i = 0; i < elementIds.length; i++) {
            var elementId = elementIds[i];
            var diagramObject = $ax.getObjectFromElementId(elementId);
            if (filter(diagramObject, elementId)) {
                fn.apply(diagramObject, [diagramObject, elementId]);
            }
        }
    };

    $ax.public.fn.getElements = function() {
        var elements = [];
        this.each(function(dObj, elementId) {
            var elementById = document.getElementById(elementId);
            if(elementById) elements[elements.length] = elementById;
        });
        return elements;
    };
    
    $ax.public.fn.getElementIds = function() {
        var elementIds = [];
        this.each(function(dObj, elementId) { elementIds[elementIds.length] = elementId; });
        return elementIds;
    };

    // Deep means to keep getting parents parent until at the root parent. Parent is then an array instead of an id.
    // Filter options: layer, rdo, repeater, item, dynamicPanel, state
    $ax.public.fn.getParents = function (deep, filter) {
        if(filter == '*') filter = ['layer', 'rdo', 'repeater', 'item', 'dynamicPanel', 'state'];
        var elementIds = this.getElementIds();
        var parentIds = [];

        var getParent = function(elementId) {
            var containerIndex = elementId.indexOf('_container');
            if(containerIndex !== -1) elementId = elementId.substring(0, containerIndex);
            if(elementId.indexOf('_text') !== -1) elementId = $ax.GetShapeIdFromText(elementId);

            // Check repeater item before layer, because repeater item detects it's parent layer, but wants to go directly to it's repeater first.
            // if repeater item, then just return repeater
            var scriptId = $ax.repeater.getScriptIdFromElementId(elementId);
            var itemNum = $ax.repeater.getItemIdFromElementId(elementId);
            var parentRepeater = $ax.getParentRepeaterFromScriptId(scriptId);

            // scriptId is item or repeater itself
            if (parentRepeater == scriptId) {
                // If you are repeater item, return your repeater
                if (itemNum) return filter.indexOf('repeater') != -1 ? scriptId : getParent(scriptId);
                // Otherwise you are actually at repeater, clean parentRepeater, or else you loop
                parentRepeater = undefined;
            }

            // Layer only references it if it is a direct layer to it
            var parent = $ax.getLayerParentFromElementId(elementId);
            // If layer is allowed we found parent, otherwise ignore and keep climbing
            if (parent) return filter.indexOf('layer') != -1 ? parent : getParent(parent);
            
            // if state, then just return panel
            if(scriptId.indexOf('_state') != -1) {
                var panelId = $ax.repeater.createElementId(scriptId.split('_')[0], itemNum);
                // If dynamic panel is allowed we found parent, otherwise ignore and keep climbing
                return filter.indexOf('dynamicPanel') != -1 ? panelId : getParent(panelId);
            }

            var parentType = '';
            if(parentRepeater) {
                parentType = 'item';
                parent = $ax.repeater.createElementId(parentRepeater, itemNum);
            }

            var masterPath = $ax.getPathFromScriptId($ax.repeater.getScriptIdFromElementId(elementId));
            masterPath.pop();
            if(masterPath.length > 0) {
                var masterId = $ax.getElementIdFromPath(masterPath, { itemNum: itemNum }, true);
                if(!masterId) return undefined;
                var masterRepeater = $ax.getParentRepeaterFromElementId($ax.repeater.getScriptIdFromElementId(masterId));
                if(!parentRepeater || masterRepeater) {
                    parentType = 'rdo';
                    parent = masterId;
                }
            }

            var obj = $obj(elementId);
            var parentDynamicPanel = obj.parentDynamicPanel;
            if(parentDynamicPanel) {
                // Make sure the parent if not parentRepeater, or dynamic panel is also in that repeater
                // If there is a parent master, the dynamic panel must be in it, otherwise parentDynamicPanel would be undefined.
                var panelPath = masterPath;
                panelPath[panelPath.length] = parentDynamicPanel;
                panelId = $ax.getElementIdFromPath(panelPath, { itemNum: itemNum }, true);
                if(!panelId) return undefined;
                var panelRepeater = $ax.getParentRepeaterFromElementId(panelId);
                if(!parentRepeater || panelRepeater) {
                    parentType = 'state';
                    parent = panelId + '_state' + obj.panelIndex;
                }
            }

            // If at top or parent type is desired, then return parent, otherwise keep climbing
            return !parent || filter.indexOf(parentType) != -1 ? parent : getParent(parent);
        };

        for(var i = 0; i < elementIds.length; i++) {
            var parent = getParent(elementIds[i]);
            if(deep) {
                var parents = [];
                while(parent) {
                    parents[parents.length] = parent;
                    // If id is not a valid object, you are either repeater item or dynamic panel state
                    //if(!$obj(parent)) parent = $ax.visibility.getWidgetFromContainer($jobj(parent).parent().attr('id'));

                    parent = getParent(parent);
                }
                parent = parents;
            }
            parentIds[parentIds.length] = parent;
        }
        return parentIds;
    };

    // Get the path to the child, where non leaf nodes can be masters, layers, dynamic panels, and repeaters.
    $ax.public.fn.getChildren = function(deep, ignoreUnplaced) { // ignoreUnplaced should probably be the default, but when that is done a full audit of usages should be done
        var elementIds = this.getElementIds();
        var children = [];

        var getChildren = function (elementId) {
            var obj = $obj(elementId);
            //if(!obj) return undefined;

            var isRepeater = obj && obj.type == $ax.constants.REPEATER_TYPE;
            if (isRepeater && $ax.repeater.getScriptIdFromElementId(elementId) != elementId) {
                //prevent repeater items from being marked as isRepeater
                //TODO: evaluate changing the naming convention to be more like panel states which don't seem to have this problem
                obj = undefined;
                isRepeater = false;
            }
            var isDynamicPanel = obj && obj.type == $ax.constants.DYNAMIC_PANEL_TYPE;
            //var isLayer = obj.type == $ax.constants.LAYER_TYPE;
            //var isMaster = obj.type == $ax.constants.MASTER_TYPE || obj.type == $ax.constants.REFERENCE_DIAGRAM_OBJECT_TYPE;
            
            var isMenu = obj && obj.type == $ax.constants.MENU_OBJECT_TYPE;
            var isTreeNode = obj && obj.type == $ax.constants.TREE_NODE_OBJECT_TYPE;
            //var isTable = obj.type == $ax.constants.TABLE_TYPE;
            //var isCompoundVector = obj.type == $ax.constants.VECTOR_SHAPE_TYPE && obj.generateCompound;

            //if (isRepeater || isDynamicPanel || isLayer || isMaster || isMenu || isTreeNode || isTable) {// || isCompoundVector) {
                // Find parent that children should be pulled from. Default is just the elementId query (used by table and master)
                var parent = $jobj(elementId);
                if(isRepeater) {
                    parent = $();
                    var itemIds = $ax.getItemIdsForRepeater(elementId);
                    for(var itemIndex = 0; itemIndex < itemIds.length; itemIndex++) parent = parent.add($jobj($ax.repeater.createElementId(elementId, itemIds[itemIndex])));
                } else if(isDynamicPanel) {
                    // Really only need to do active state probably...
                    parent = $jobj(elementId).children();
                    // Get through all containers
                    while ($(parent[0]).attr('id').indexOf('container') != -1) parent = parent.children();
                    // Now at states, but want states content
                    parent = parent.children();
                } else if(isTreeNode) parent = $jobj($ax.repeater.applySuffixToElementId(elementId, '_children'));

                // Menu doesn't want all children, only tables and menus, so it must be handled specially
                var children = isMenu ? parent.children('.ax_table').add(parent.children('.ax_menu')) : parent.children();
                children = $ax.visibility.getRealChildren(_fixForBasicLinks(children));
                
                // For tree nodes you want the the button shape contained by the elementQuery too
                if(isTreeNode) {
                    var treeNodeChildren = $jobj(elementId).children();
                    for(var treeNodeIndex = 0; treeNodeIndex < treeNodeChildren.length; treeNodeIndex++) {
                        var treeNodeChild = $(treeNodeChildren[treeNodeIndex]);
                        var childObj = $obj(treeNodeChild.attr('id'));
                        if (childObj && $ax.public.fn.IsVector(childObj.type)) children = children.add(treeNodeChild);
                    }
                }
                

                var childrenIds = [];
                for(var childIndex = 0; childIndex < children.length; childIndex++) {
                    var childObj = $(children[childIndex]);
                    var id = childObj.attr('id');
                    if(typeof(id) == 'undefined' && childObj.is('a')) id = $(childObj.children()[0]).attr('id');
                    // Ignore annotations and any other children that are not elements
                    if (id.split('_').length > 1) continue;
                    // Ignore Unplaced
                    if(ignoreUnplaced && $ax.visibility.isScriptIdLimbo($ax.repeater.getScriptIdFromElementId(id))) continue;
                    childrenIds.push(id);
                }
                
                if(deep) {
                    var childObjs = [];
                    for(var i = 0; i < childrenIds.length; i++) {
                        var childId = childrenIds[i];
                        childObjs[i] = { id: childId, children: getChildren(childId) };
                    }
                    childrenIds = childObjs;
                }
                
                return childrenIds;
            //}

            //return undefined;
        };

        for(var i = 0; i < elementIds.length; i++) {
            var elementId = elementIds[i];
            //if the state is passed in, look for children in the content element
            if (elementId.indexOf('_state') > -1 && elementId.indexOf('_content') < 0) elementId = elementId + '_content';
            children[children.length] = { id: elementId, children: getChildren(elementId)};
        }
        return children;
    };

    var _fixForBasicLinks = function(query) {
        var hasBasicLinks = query.filter('.basiclink').length > 0;
        if(!hasBasicLinks) return query;

        var retval = $();
        for(var i = 0; i < query.length; i++) {
            var child = $(query[i]);
            if(child.hasClass('basiclink')) retval = retval.add(child.children());
            else retval = retval.add(child);
        }
        return retval;
    };

})();