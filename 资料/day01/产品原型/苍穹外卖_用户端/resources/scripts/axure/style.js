$axure.internal(function($ax) {
    var _style = {};
    $ax.style = _style;

    var _disabledWidgets = {};
    var _selectedWidgets = {};

    // A table to cache the outerHTML of the _rtf elements before the rollover state is applied.
    var _originalTextCache = {};
    // A table to exclude the normal style from adaptive overrides
    var _shapesWithSetRichText = {};

    // just a listing of shape ids
    var _adaptiveStyledWidgets = {};

    var _setLinkStyle = function(id, styleName) {
        var parentId = $ax.GetParentIdFromLink(id);
        var style = _computeAllOverrides(id, parentId, styleName, $ax.adaptive.currentViewId);

        var textId = $ax.GetTextPanelId(parentId);
        if(!_originalTextCache[textId]) {
            $ax.style.CacheOriginalText(textId);
        }
        if($.isEmptyObject(style)) return;

        var textCache = _originalTextCache[textId].styleCache;

        _transformTextWithVerticalAlignment(textId, function() {
            var cssProps = _getCssStyleProperties(style);
            $('#' + id).find('*').addBack().each(function(index, element) {
                element.setAttribute('style', textCache[element.id]);
                _applyCssProps(element, cssProps);
            });
        });
    };

    var _resetLinkStyle = function(id) {
        var textId = $ax.GetTextPanelId($ax.GetParentIdFromLink(id));
        var textCache = _originalTextCache[textId].styleCache;

        _transformTextWithVerticalAlignment(textId, function() {
            $('#' + id).find('*').addBack().each(function(index, element) {
                element.style.cssText = textCache[element.id];
            });
        });
        if($ax.event.mouseDownObjectId) {
            $ax.style.SetWidgetMouseDown($ax.event.mouseDownObjectId, true);
        } else if($ax.event.mouseOverObjectId) {
            $ax.style.SetWidgetHover($ax.event.mouseOverObjectId, true);
        }
    };

    $ax.style.SetLinkHover = function(id) {
        _setLinkStyle(id, MOUSE_OVER);
    };

    $ax.style.SetLinkNotHover = function(id) {
        _resetLinkStyle(id);
    };

    $ax.style.SetLinkMouseDown = function(id) {
        _setLinkStyle(id, MOUSE_DOWN);
    };

    $ax.style.SetLinkNotMouseDown = function(id) {
        _resetLinkStyle(id);
        var style = _computeAllOverrides(id, $ax.event.mouseOverObjectId, MOUSE_OVER, $ax.adaptive.currentViewId);

        if(!$.isEmptyObject(style)) $ax.style.SetLinkHover(id);
        //we dont do anything here because the widget not mouse down has taken over here
    };

    var _widgetHasState = function(id, state) {
        if($ax.style.getElementImageOverride(id, state)) return true;
        var diagramObject = $ax.getObjectFromElementId(id);

        //var adaptiveIdChain = $ax.adaptive.getAdaptiveIdChain($ax.adaptive.currentViewId);
        var adaptiveIdChain = $ax.style.getViewIdChain($ax.adaptive.currentViewId, id, diagramObject);

        for(var i = 0; i < adaptiveIdChain.length; i++) {
            var viewId = adaptiveIdChain[i];
            var adaptiveStyle = diagramObject.adaptiveStyles[viewId];
            if(adaptiveStyle && adaptiveStyle.stateStyles && adaptiveStyle.stateStyles[state]) return true;
        }

        if(diagramObject.style.stateStyles) {
            var stateStyle = diagramObject.style.stateStyles[state];
            if(!stateStyle) return false;
            return !$.isEmptyObject(stateStyle);
        }

        return false;
    };

    // Returns what overrides the hover, or false if nothing.
    var _hoverOverride = function(id) {
        if($ax.style.IsWidgetDisabled(id)) return DISABLED;
        if($ax.style.IsWidgetSelected(id)) return SELECTED;
        var obj = $ax.getObjectFromElementId(id);
        if(!obj.isContained) return false;
        var path = $ax.getPathFromScriptId($ax.repeater.getScriptIdFromElementId(id));
        path[path.length - 1] = obj.parent.id;
        var itemId = $ax.repeater.getItemIdFromElementId(id);
        return _hoverOverride($ax.getElementIdFromPath(path, { itemNum: itemId }));
    };

    $ax.style.SetWidgetHover = function(id, value) {
        var override = _hoverOverride(id);
        if(override == DISABLED) return;
        if(!_widgetHasState(id, MOUSE_OVER)) return;

        var valToSet = value || _isRolloverOverride(id);
        var state = _generateMouseState(id, valToSet ? MOUSE_OVER : NORMAL, override == SELECTED);
        _applyImageAndTextJson(id, state);
        _updateElementIdImageStyle(id, state);
    };

    var _rolloverOverrides = [];
    var _isRolloverOverride = function(id) {
        return _rolloverOverrides.indexOf(id) != -1;
    };

    $ax.style.AddRolloverOverride = function(id) {
        if(_isRolloverOverride(id)) return;
        _rolloverOverrides[_rolloverOverrides.length] = id;
        if($ax.event.mouseOverIds.indexOf(id) == -1) $ax.style.SetWidgetHover(id, true);
    };

    $ax.style.RemoveRolloverOverride = function(id) {
        var index = _rolloverOverrides.indexOf(id);
        if(index == -1) return;
        $ax.splice(_rolloverOverrides, index, 1);
        if($ax.event.mouseOverIds.indexOf(id) == -1) $ax.style.SetWidgetHover(id, false);
    };

    //    function GetWidgetCurrentState(id) {
    //        if($ax.style.IsWidgetDisabled(id)) return "disabled";
    //        if($ax.style.IsWidgetSelected(id)) return "selected";
    //        if($ax.event.mouseOverObjectId == id) return "mouseOver";
    //        if($ax.event.mouseDownObjectId == id) return "mouseDown";

    //        return "normal";
    //    }

    $ax.style.ObjHasMouseDown = function(id) {
        var obj = $obj(id);
        if($ax.style.getElementImageOverride(id, 'mouseDown') || obj.style && obj.style.stateStyles && obj.style.stateStyles.mouseDown) return true;

        //var chain = $ax.adaptive.getAdaptiveIdChain($ax.adaptive.currentViewId);
        var chain = $ax.style.getViewIdChain($ax.adaptive.currentViewId, id, obj);
        for(var i = 0; i < chain.length; i++) {
            var style = obj.adaptiveStyles[chain[i]];
            if(style && style.stateStyles && style.stateStyles.mouseDown) return true;
        }
        return false;
    };

    $ax.style.SetWidgetMouseDown = function(id, value, checkMouseOver) {
        if($ax.style.IsWidgetDisabled(id)) return;
        if(!_widgetHasState(id, MOUSE_DOWN)) return;

        //if set to value is true, it's mousedown, if check mouseover is true,
        //check if element is currently mouseover and has mouseover state before setting mouseover
        if(value) var state = MOUSE_DOWN;
        else if(!checkMouseOver || $ax.event.mouseOverIds.indexOf(id) !== -1 && _widgetHasState(id, MOUSE_OVER)) state = MOUSE_OVER;
        else state = NORMAL;

        var mouseState = _generateMouseState(id, state, $ax.style.IsWidgetSelected(id));
        _applyImageAndTextJson(id, mouseState);
        _updateElementIdImageStyle(id, mouseState);
    };

    var _generateMouseState = function(id, mouseState, selected) {

        var isSelectedFocused = function (state) {
            if(!_widgetHasState(id, FOCUSED)) return state;

            var jObj = $('#' + id);
            if(state == SELECTED) return (jObj.hasClass(FOCUSED)) ? SELECTED_FOCUSED : state;
            else return (jObj.hasClass(FOCUSED) || jObj.hasClass(SELECTED_FOCUSED)) ? FOCUSED : state;
        }

        if (selected) {
            if (_style.getElementImageOverride(id, SELECTED)) return isSelectedFocused(SELECTED);

            var obj = $obj(id);
            //var viewChain = $ax.adaptive.getAdaptiveIdChain($ax.adaptive.currentViewId);
            var viewChain = $ax.style.getViewIdChain($ax.adaptive.currentViewId, id, obj);
            viewChain[viewChain.length] = '';
            if($ax.IsDynamicPanel(obj.type) || $ax.IsLayer(obj.type)) return isSelectedFocused(SELECTED);

            var any = function(dict) {
                for(var key in dict) return true;
                return false;
            };

            for(var i = 0; i < viewChain.length; i++) {
                var viewId = viewChain[i];
                // Need to check seperately for images.
                var scriptId = $ax.repeater.getScriptIdFromElementId(id);
                if(obj.adaptiveStyles && obj.adaptiveStyles[viewId] && any(obj.adaptiveStyles[viewId])
                    || obj.images && (obj.images[scriptId + '~selected~' + viewId] || obj.images['selected~' + viewId])) return isSelectedFocused(SELECTED);
            }
            var selectedStyle = obj.style && obj.style.stateStyles && obj.style.stateStyles.selected;
            if(selectedStyle && any(selectedStyle)) return isSelectedFocused(SELECTED);
        }

        // Not using selected
        return isSelectedFocused(mouseState);
    };

    $ax.style.SetWidgetFocused = function (id, value) {
        if (_isWidgetDisabled(id)) return;
        if (!_widgetHasState(id, FOCUSED)) return;

        if (value) var state = $ax.style.IsWidgetSelected(id) ? SELECTED_FOCUSED : FOCUSED;
        else state = $ax.style.IsWidgetSelected(id) ? SELECTED : NORMAL;

        _applyImageAndTextJson(id, state);
        _updateElementIdImageStyle(id, state);
    }

    $ax.style.SetWidgetSelected = function(id, value, alwaysApply) {
        if(_isWidgetDisabled(id)) return;
        //NOTE: not firing select events if state didn't change
        var raiseSelectedEvents = $ax.style.IsWidgetSelected(id) != value;

        if(value) {
            var group = $('#' + id).attr('selectiongroup');
            if(group) {
                $("[selectiongroup='" + group + "']").each(function() {
                    var otherId = this.id;
                    if(otherId == id) return;
                    if ($ax.visibility.isScriptIdLimbo($ax.repeater.getScriptIdFromElementId(otherId))) return;

                    $ax.style.SetWidgetSelected(otherId, false, alwaysApply);
                });
            }
        }
        var obj = $obj(id);
        if(obj) {
            var actionId = id;
            if ($ax.public.fn.IsDynamicPanel(obj.type) || $ax.public.fn.IsLayer(obj.type)) {
                if(!value) $jobj(id).removeClass('selected');
                var children = $axure('#' + id).getChildren()[0].children;
                for(var i = 0; i < children.length; i++) {
                    var childId = children[i];
                    // Special case for trees
                    var childObj = $jobj(childId);
                    if(childObj.hasClass('treeroot')) {
                        var treenodes = childObj.find('.treenode');
                        for(var j = 0; j < treenodes.length; j++) {
                            $axure('#' + treenodes[j].id).selected(value);
                        }
                    } else $axure('#' + childId).selected(value);
                }
            } else {
                var widgetHasSelectedState = _widgetHasState(id, SELECTED);
                while(obj.isContained && !widgetHasSelectedState) obj = obj.parent;
                var itemId = $ax.repeater.getItemIdFromElementId(id);
                var path = $ax.getPathFromScriptId($ax.repeater.getScriptIdFromElementId(id));
                path[path.length - 1] = obj.id;
                actionId = $ax.getElementIdFromPath(path, { itemNum: itemId });
                if(alwaysApply || widgetHasSelectedState) {
                    var state = _generateSelectedState(actionId, value);
                    _applyImageAndTextJson(actionId, state);
                    _updateElementIdImageStyle(actionId, state);
                }
                //added actionId and this hacky logic because we set style state on child, but interaction on parent
                //then the id saved in _selectedWidgets would be depended on widgetHasSelectedState... more see case 1818143
                while(obj.isContained && !$ax.getObjectFromElementId(id).interactionMap) obj = obj.parent;
                path = $ax.getPathFromScriptId($ax.repeater.getScriptIdFromElementId(id));
                path[path.length - 1] = obj.id;
                actionId = $ax.getElementIdFromPath(path, { itemNum: itemId });
            }
        }

        //    ApplyImageAndTextJson(id, value ? 'selected' : 'normal');
        _selectedWidgets[id] = value;
        if(raiseSelectedEvents) $ax.event.raiseSelectedEvents(actionId, value);
    };

    var _generateSelectedState = function(id, selected) {
        var mouseState = $ax.event.mouseDownObjectId == id ? MOUSE_DOWN : $.inArray(id, $ax.event.mouseOverIds) != -1 ? MOUSE_OVER : NORMAL;
        //var mouseState = $ax.event.mouseDownObjectId == id ? MOUSE_DOWN : $ax.event.mouseOverIds.indexOf(id) != -1 ? MOUSE_OVER : NORMAL;
        return _generateMouseState(id, mouseState, selected);
    };

    $ax.style.IsWidgetSelected = function(id) {
        return Boolean(_selectedWidgets[id]) || $('#'+id).hasClass('selected');
    };

    $ax.style.SetWidgetEnabled = function(id, value) {
        _disabledWidgets[id] = !value;
        $('#' + id).find('a').css('cursor', value ? 'pointer' : 'default');

        if(!_widgetHasState(id, DISABLED)) return;
        if(!value) {
            _applyImageAndTextJson(id, DISABLED);
            _updateElementIdImageStyle(id, DISABLED);
        } else $ax.style.SetWidgetSelected(id, $ax.style.IsWidgetSelected(id), true);
    };

    $ax.style.SetWidgetPlaceholder = function(id, active, text, password) {
        var inputId = $ax.repeater.applySuffixToElementId(id, '_input');

        // Right now this is the only style on the widget. If other styles (ex. Rollover), are allowed
        //  on TextBox/TextArea, or Placeholder is applied to more widgets, this may need to do more.
        var obj = $jobj(inputId);

        var height = document.getElementById(inputId).style['height'];
        var width = document.getElementById(inputId).style['width'];
        obj.attr('style', '');
        //removing all styles, but now we can change the size, so we should add them back
        //this is more like a quick hack
        if (height) obj.css('height', height);
        if (width) obj.css('width', width);

        if(!active) {
            try { //ie8 and below error
                if(password) document.getElementById(inputId).type = 'password';
            } catch(e) { } 
        } else {
            var element = $('#' + inputId)[0];
            var style = _computeAllOverrides(id, undefined, HINT, $ax.adaptive.currentViewId);
            var styleProperties = _getCssStyleProperties(style);

            //moved this out of GetCssStyleProperties for now because it was breaking un/rollovers with gradient fills
            //if(style.fill) styleProperties.allProps.backgroundColor = _getColorFromFill(style.fill);

            _applyCssProps(element, styleProperties, true);
            try { //ie8 and below error
                if(password && text) document.getElementById(inputId).type = 'text';
            } catch(e) { }
        }
        obj.val(text);
    };

    var _isWidgetDisabled = $ax.style.IsWidgetDisabled = function(id) {
        return Boolean(_disabledWidgets[id]);
    };

    var _elementIdsToImageOverrides = {};
    $ax.style.mapElementIdToImageOverrides = function (elementId, override) {
        for(var key in override) _addImageOverride(elementId, key, override[key]);
    };

    var _addImageOverride = function (elementId, state, val) {
        if (!_elementIdsToImageOverrides[elementId]) _elementIdsToImageOverrides[elementId] = {};
        _elementIdsToImageOverrides[elementId][state] = val;
    }

    $ax.style.deleteElementIdToImageOverride = function(elementId) {
        delete _elementIdsToImageOverrides[elementId];
    };

    $ax.style.getElementImageOverride = function(elementId, state) {
        var url = _elementIdsToImageOverrides[elementId] && _elementIdsToImageOverrides[elementId][state];
        return url;
    };

    $ax.style.elementHasAnyImageOverride = function(elementId) {
        return Boolean(_elementIdsToImageOverrides[elementId]);
    };

    var NORMAL = 'normal';
    var MOUSE_OVER = 'mouseOver';
    var MOUSE_DOWN = 'mouseDown';
    var SELECTED = 'selected';
    var DISABLED = 'disabled';
    var HINT = 'hint';
    var FOCUSED = 'focused';
    var SELECTED_FOCUSED = 'selectedFocused';

    var _generateState = _style.generateState = function(id) {
        return $ax.placeholderManager.isActive(id) ? HINT : _style.IsWidgetDisabled(id) ? DISABLED : _generateSelectedState(id, _style.IsWidgetSelected(id));
    };

    var _progressState = _style.progessState = function(state) {
        if(state == NORMAL) return false;
        if(state == MOUSE_DOWN) return MOUSE_OVER;
        return NORMAL;
    };

    var _unprogressState = function(state, goal) {
        state = state || NORMAL;
        if(state == goal || state == SELECTED_FOCUSED) return undefined;
        if(state == NORMAL && goal == MOUSE_DOWN) return MOUSE_OVER;
        if(state == NORMAL && goal == SELECTED_FOCUSED) return SELECTED;
        if(state == SELECTED && goal == SELECTED_FOCUSED) return FOCUSED;
        return goal;
    };

    var _updateElementIdImageStyle = _style.updateElementIdImageStyle = function(elementId, state) {
        if(!_style.elementHasAnyImageOverride(elementId)) return;

        if(!state) state = _generateState(elementId);

        var style = _computeFullStyle(elementId, state, $ax.adaptive.currentViewId);

        var query = $jobj($ax.repeater.applySuffixToElementId(elementId, '_img'));
        style.size.width = query.width();
        style.size.height = query.height();
        var borderId = $ax.repeater.applySuffixToElementId(elementId, '_border');
        var borderQuery = $jobj(borderId);
        if(!borderQuery.length) {
            borderQuery = $('<div></div>');
            borderQuery.attr('id', borderId);
            query.after(borderQuery);
        }

        borderQuery.attr('style', '');
        //borderQuery.css('position', 'absolute');
        query.attr('style', '');

        var borderQueryCss = { 'position': 'absolute' };
        var queryCss = {}

        var borderWidth = Number(style.borderWidth);
        var hasBorderWidth = borderWidth > 0;
        if(hasBorderWidth) {
            //borderQuery.css('border-style', 'solid');
            //borderQuery.css('border-width', borderWidth + 'px'); // If images start being able to turn off borders on specific sides, need to update this.
            //borderQuery.css('width', style.size.width - borderWidth * 2);
            //borderQuery.css('height', style.size.height - borderWidth * 2);
            //borderQuery.css({
            //    'border-style': 'solid',
            //    'border-width': borderWidth + 'px',
            //    'width': style.size.width - borderWidth * 2,
            //    'height': style.size.height - borderWidth * 2
            //});
            borderQueryCss['border-style'] = 'solid';
            borderQueryCss['border-width'] = borderWidth + 'px'; // If images start being able to turn off borders on specific sides, need to update this.
            borderQueryCss['width'] = style.size.width - borderWidth * 2;
            borderQueryCss['height'] = style.size.height - borderWidth * 2;
        }

        var linePattern = style.linePattern;
        if(hasBorderWidth && linePattern) borderQueryCss['border-style'] = linePattern;

        var borderFill = style.borderFill;
        if(hasBorderWidth && borderFill) {
            var color = borderFill.fillType == 'solid' ? borderFill.color :
                borderFill.fillType == 'linearGradient' ? borderFill.colors[0].color : 0;

            var alpha = Math.floor(color / 256 / 256 / 256);
            color -= alpha * 256 * 256 * 256;
            alpha = alpha / 255;

            var red = Math.floor(color / 256 / 256);
            color -= red * 256 * 256;
            var green = Math.floor(color / 256);
            var blue = color - green * 256;

            borderQueryCss['border-color'] = _rgbaToFunc(red, green, blue, alpha);
        }

        var cornerRadiusTopLeft = style.cornerRadius;
        if(cornerRadiusTopLeft) {
            queryCss['border-radius'] = cornerRadiusTopLeft + 'px';
            borderQueryCss['border-radius'] = cornerRadiusTopLeft + 'px';
        }

        var outerShadow = style.outerShadow;
        if(outerShadow && outerShadow.on) {
            var arg = '';
            arg += outerShadow.offsetX + 'px' + ' ' + outerShadow.offsetY + 'px' + ' ';
            var rgba = outerShadow.color;
            arg += outerShadow.blurRadius + 'px' + ' 0px ' + _rgbaToFunc(rgba.r, rgba.g, rgba.b, rgba.a);
            //query.css('-moz-box-shadow', arg);
            //query.css('-wibkit-box-shadow', arg);
            //query.css('box-shadow', arg);
            //query.css('left', '0px');
            //query.css('top', '0px');
            //query.css({
            //    '-moz-box-shadow': arg,
            //    '-webkit-box-shadow': arg,
            //    'box-shadow': arg,
            //    'left': '0px',
            //    'top': '0px'
            //});
            queryCss['-moz-box-shadow'] = arg;
            queryCss['-wibkit-box-shadow'] = arg;
            queryCss['box-shadow'] = arg;
            queryCss['left'] = '0px';
            queryCss['top'] = '0px';
        }

        queryCss['width'] = style.size.width;
        queryCss['height'] = style.size.height;

        borderQuery.css(borderQueryCss);
        query.css(queryCss);

        //query.css({ width: style.size.width, height: style.size.height });
    };

    var _rgbaToFunc = function(red, green, blue, alpha) {
        return 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
    };

    var _applyImageAndTextJson = function(id, event) {
        var textId = $ax.GetTextPanelId(id);
        if(textId) _resetTextJson(id, textId);

        // This should never be the case
        //if(event != '') {
        var imgQuery = $jobj($ax.GetImageIdFromShape(id));
        var e = imgQuery.data('events');
        if(e && e[event]) imgQuery.trigger(event);

        var imageUrl = $ax.adaptive.getImageForStateAndView(id, event);
        if(imageUrl) _applyImage(id, imageUrl, event);

        var style = _computeAllOverrides(id, undefined, event, $ax.adaptive.currentViewId);
        if(!$.isEmptyObject(style) && textId) _applyTextStyle(textId, style);

        _updateStateClasses(id, event);
        _updateStateClasses($ax.repeater.applySuffixToElementId(id, '_div'), event);
        _updateStateClasses($ax.repeater.applySuffixToElementId(id, '_input'), event);
    };

    var _updateStateClasses = function(id, event) {
        var jobj = $jobj(id);

        //if(jobj[0] && jobj[0].hasAttribute('widgetwidth')) {
        //    for (var x = 0; x < jobj[0].children.length; x++) {
        //        var childId = jobj[0].children[x].id;
        //        if (childId.indexOf('p') < 0) continue;

        //        _updateStateClasses(childId, event) ;
        //    }
        //} else {
            for (var i = 0; i < ALL_STATES.length; i++) jobj.removeClass(ALL_STATES[i]);
            if (event == 'mouseDown') jobj.addClass('mouseOver');
            if(event != 'normal') jobj.addClass(event);
        //}
    }

    /* -------------------

    here's the algorithm in a nutshell:
    [DOWN] -- refers to navigation down the view inheritance heirarchy (default to most specific)
    [UP] -- navigate up the heirarchy

    ComputeAllOverrides (object):
    All view styles [DOWN]
    If hyperlink
    - DO ComputeStateStyle for parent object
    - if (MouseOver || MouseDown) 
    - linkMouseOver Style
    - if (MouseDown) 
    - linkMouseDown style
    - ComputeStateStyleForViewChain (parent, STATE)
    
    if (MouseDown) DO ComputeStateStyleForViewChain for object, mouseOver
    DO ComputeStateStyleForViewChain for object, style


    ComputeStateStyleForViewChain (object, STATE)
    FIRST STATE state style [UP] the chain OR default object STATE style

    ------------------- */

    var FONT_PROPS = {
        'typeface': true,
        'fontName': true,
        'fontWeight': true,
        'fontStyle': true,
        'fontStretch': true,
        'fontSize': true,
        'underline': true,
        'foreGroundFill': true,
        'horizontalAlignment': true,
        'letterCase': true,
        'strikethrough': true
    };

    var _getViewIdChain = $ax.style.getViewIdChain = function(currentViewId, id, diagramObject) {
        var viewIdChain;
        if (diagramObject.owner.type != 'Axure:Master') {
            viewIdChain = $ax.adaptive.getAdaptiveIdChain(currentViewId);
        } else {
            //set viewIdChain to the chain from the parent RDO
            var parentRdoId = $ax('#' + id).getParents(true, ['rdo'])[0][0];
            var rdoState = $ax.style.generateState(parentRdoId);
            var rdoStyle = $ax.style.computeFullStyle(parentRdoId, rdoState, currentViewId);
            var viewOverride = rdoStyle.viewOverride;
            viewIdChain = $ax.adaptive.getMasterAdaptiveIdChain(diagramObject.owner.packageId, viewOverride);
        }
        return viewIdChain;
    }

    var _computeAllOverrides = $ax.style.computeAllOverrides = function(id, parentId, state, currentViewId) {
        var computedStyle = {};
        if(parentId) computedStyle = _computeAllOverrides(parentId, null, state, currentViewId);

        var diagramObject = $ax.getObjectFromElementId(id);

        var viewIdChain = _getViewIdChain(currentViewId, id, diagramObject);
        var excludeFont = _shapesWithSetRichText[id];
        for(var i = 0; i < viewIdChain.length; i++) {
            var viewId = viewIdChain[i];
            var style = diagramObject.adaptiveStyles[viewId];
            if(style) {
                // we want to exclude the normal font style for shapes where the rich text has been set with an interaction
                // so we copy the style so we don't modify the original, then delete all the font props.
                if(excludeFont) {
                    style = $ax.deepCopy(style);
                    for(var prop in FONT_PROPS) delete style[prop];
                }

                if(style) {
                    var customStyle = style.baseStyle && $ax.document.stylesheet.stylesById[style.baseStyle];
                    //make sure not to extend the customStyle this can mutate it for future use
                    $.extend(computedStyle, customStyle);
                }
                $.extend(computedStyle, style);
            }
        }

        var currState = NORMAL;
        while(currState) {
            $.extend(computedStyle, _computeStateStyleForViewChain(diagramObject, currState, viewIdChain, true));
            currState = _unprogressState(currState, state);
        }

        return _removeUnsupportedProperties(computedStyle, diagramObject);
    };

    var _computeStateStyleForViewChain = function(diagramObject, state, viewIdChain, excludeNormal) {
        var styleObject = diagramObject;
        while(styleObject.isContained) styleObject = styleObject.parent;

        var adaptiveStyles = styleObject.adaptiveStyles;

        for(var i = viewIdChain.length - 1; i >= 0; i--) {
            var viewId = viewIdChain[i];
            var viewStyle = adaptiveStyles[viewId];
            var stateStyle = viewStyle && _getFullStateStyle(viewStyle, state, excludeNormal);
            if (stateStyle) return $.extend({}, stateStyle);
            else if (viewStyle && viewStyle.stateStyles) return {}; //stateStyles are overriden but states could be null
        }

        // we dont want to actually include the object style because those are not overrides, hence the true for "excludeNormal" and not passing the val through
        var stateStyleFromDefault = _getFullStateStyle(styleObject.style, state, true);
        return $.extend({}, stateStyleFromDefault);
    };

    // returns the full effective style for an object in a state state and view
    var _computeFullStyle = $ax.style.computeFullStyle = function(id, state, currentViewId) {
        var obj = $obj(id);
        var overrides = _computeAllOverrides(id, undefined, state, currentViewId);
        // todo: account for image box
        var objStyle = obj.style;
        var customStyle = objStyle.baseStyle && $ax.document.stylesheet.stylesById[objStyle.baseStyle];
        var returnVal = $.extend({}, $ax.document.stylesheet.defaultStyle, customStyle, objStyle, overrides);
        return _removeUnsupportedProperties(returnVal, obj);
    };

    var _removeUnsupportedProperties = function(style, object) {
        // for now all we need to do is remove padding from checkboxes and radio buttons
        if ($ax.public.fn.IsRadioButton(object.type) || $ax.public.fn.IsCheckBox(object.type)) {
            style.paddingTop = 0;
            style.paddingLeft = 0;
            style.paddingRight = 0;
            style.paddingBottom = 0;
        }
        if ($ax.public.fn.IsTextBox(object.type) || $ax.public.fn.IsTextArea(object.type) || $ax.public.fn.IsButton(object.type)
            || $ax.public.fn.IsListBox(object.type) || $ax.public.fn.IsComboBox(object.type)) {
            if (object.images && style.fill) delete style['fill'];
        }

        return style;
    };

    var _getFullStateStyle = function(style, state, excludeNormal) {
        //'normal' is needed because now DiagramObjects get their image from the Style and unapplying a rollover needs the image
        var stateStyle = state == 'normal' && !excludeNormal ? style : style && style.stateStyles && style.stateStyles[state];
        if(stateStyle) {
            var customStyle = stateStyle.baseStyle && $ax.document.stylesheet.stylesById[stateStyle.baseStyle];
            //make sure not to extend the customStyle this can mutate it for future use
            return $.extend({}, customStyle, stateStyle);
        }
        return undefined;
    };

    // commented this out for now... we actually will probably need it for ie
    var _applyOpacityFromStyle = $ax.style.applyOpacityFromStyle = function(id, style) {
        return;
        var opacity = style.opacity || '';
        $jobj(id).children().css('opacity', opacity);
    };

    var _initialize = function() {
        //$ax.style.initializeObjectTextAlignment($ax('*'));
    };
    $ax.style.initialize = _initialize;

    //var _initTextAlignment = function(elementId) {
    //    var textId = $ax.GetTextPanelId(elementId);
    //    if(textId) {
    //        _storeIdToAlignProps(textId);
    //        // now handle vertical alignment
    //        if(_getObjVisible(textId)) {
    //            //_setTextAlignment(textId, _idToAlignProps[textId], false);
    //            _setTextAlignment(textId);
    //        }
    //    }
    //};

    //$ax.style.initializeObjectTextAlignment = function(query) {
    //    query.filter(function(diagramObject) {
    //        return $ax.public.fn.IsVector(diagramObject.type) || $ax.public.fn.IsImageBox(diagramObject.type);
    //    }).each(function(diagramObject, elementId) {
    //        if($jobj(elementId).length == 0) return;
    //        _initTextAlignment(elementId);
    //    });
    //};

    //$ax.style.initializeObjectTextAlignment = function (query) {
    //    var textIds = [];
    //    query.filter(function(diagramObject) {
    //        return $ax.public.fn.IsVector(diagramObject.type) || $ax.public.fn.IsImageBox(diagramObject.type);
    //    }).each(function(diagramObject, elementId) {
    //        if($jobj(elementId).length == 0) return;
    //        var textId = $ax.GetTextPanelId(elementId);
    //        if(textId) {
    //            _storeIdToAlignProps(textId);
    //            textIds.push(textId);
    //        }
    //    });

    //    $ax.style.setTextAlignment(textIds);
    //};

    //var _getPadding = $ax.style.getPadding = function (textId) {
    //    var shapeId = $ax.GetShapeIdFromText(textId);
    //    var shapeObj = $obj(shapeId);
    //    var state = _generateState(shapeId);

    //    var style = _computeFullStyle(shapeId, state, $ax.adaptive.currentViewId);
    //    var vAlign = style.verticalAlignment || 'middle';

    //    var paddingLeft = Number(style.paddingLeft) || 0;
    //    paddingLeft += (Number(shapeObj && shapeObj.extraLeft) || 0);
    //    var paddingTop = style.paddingTop || 0;
    //    var paddingRight = style.paddingRight || 0;
    //    var paddingBottom = style.paddingBottom || 0;
    //    return { vAlign: vAlign, paddingLeft: paddingLeft, paddingTop: paddingTop, paddingRight: paddingRight, paddingBottom: paddingBottom };
    //}

    //var _storeIdToAlignProps = function(textId) {
    //    _idToAlignProps[textId] = _getPadding(textId);
    //};

    var ALL_STATES = ['mouseOver', 'mouseDown', 'selected', 'focused', 'selectedFocused', 'disabled'];
    var _applyImage = $ax.style.applyImage = function (id, imgUrl, state) {
            var object = $obj(id);
            if (object.generateCompound) {
                for (var i = 0; i < object.compoundChildren.length; i++) {
                    var componentId = object.compoundChildren[i];
                    var childId = $ax.public.fn.getComponentId(id, componentId);
                    var childImgQuery = $jobj(childId + '_img');
                    var childQuery = $jobj(childId);
                    childImgQuery.attr('src', imgUrl[componentId]);
                    for (var j = 0; j < ALL_STATES.length; j++) {
                        childImgQuery.removeClass(ALL_STATES[j]);
                        childQuery.removeClass(ALL_STATES[j]);
                    }
                    if (state != 'normal') {
                        childImgQuery.addClass(state);
                        childQuery.addClass(state);
                    }
                }
            } else {
                var imgQuery = $jobj($ax.GetImageIdFromShape(id));
                var idQuery = $jobj(id);
                //it is hard to tell if setting the image or the class first causing less flashing when adding shadows.
                imgQuery.attr('src', imgUrl);
                for (var i = 0; i < ALL_STATES.length; i++) {
                    idQuery.removeClass(ALL_STATES[i]);
                    imgQuery.removeClass(ALL_STATES[i]);
                }
                if (state != 'normal') {
                    idQuery.addClass(state);
                    imgQuery.addClass(state);
                }
                if (imgQuery.parents('a.basiclink').length > 0) imgQuery.css('border', 'none');
            }

    };

    $ax.public.fn.getComponentId = function (id, componentId) {
        var idParts = id.split('-');
        idParts[0] = idParts[0] + componentId;
        return idParts.join('-');
    }

    var _resetTextJson = function(id, textid) {
        // reset the opacity
        $jobj(id).children().css('opacity', '');

        var cacheObject = _originalTextCache[textid];
        if(cacheObject) {
            _transformTextWithVerticalAlignment(textid, function() {
                var styleCache = cacheObject.styleCache;
                var textQuery = $('#' + textid);
                textQuery.find('*').each(function(index, element) {
                    element.style.cssText = styleCache[element.id];
                });
            });
        }
    };

    // Preserves the alingment for the element textid after executing transformFn

    //var _getRtfElementHeight = function(rtfElement) {
    //    if(rtfElement.innerHTML == '') rtfElement.innerHTML = '&nbsp;';

    //    // To handle render text as image
    //    //var images = $(rtfElement).children('img');
    //    //if(images.length) return images.height();
    //    return rtfElement.offsetHeight;
    //};

    // why microsoft decided to default to round to even is beyond me...
    //var _roundToEven = function(number) {
    //    var numString = number.toString();
    //    var parts = numString.split('.');
    //    if(parts.length == 1) return number;
    //    if(parts[1].length == 1 && parts[1] == '5') {
    //        var wholePart = Number(parts[0]);
    //        return wholePart % 2 == 0 ? wholePart : wholePart + 1;
    //    } else return Math.round(number);
    //};

    //var _suspendTextAlignment = 0;
    //var _suspendedTextIds = [];
    //$ax.style.startSuspendTextAlignment = function() {
    //    _suspendTextAlignment++;
    //}
    //$ax.style.resumeSuspendTextAlignment = function () {
    //    _suspendTextAlignment--;
    //    if(_suspendTextAlignment == 0) $ax.style.setTextAlignment(_suspendedTextIds);
    //}

    var _transformTextWithVerticalAlignment = $ax.style.transformTextWithVerticalAlignment = function(textId, transformFn) {
        if(!_originalTextCache[textId]) {
            $ax.style.CacheOriginalText(textId);
        }

        var rtfElement = window.document.getElementById(textId);
        if(!rtfElement) return;

        transformFn();

        //_storeIdToAlignProps(textId);

        //if (_suspendTextAlignment) {
        //    _suspendedTextIds.push(textId);
        //    return;
        //}

        //$ax.style.setTextAlignment([textId]);
    };

    // this is for vertical alignments set on hidden objects
    //var _idToAlignProps = {};
    
    //$ax.style.updateTextAlignmentForVisibility = function (textId) {
    //    var textObj = $jobj(textId);
    //    // must check if parent id exists. Doesn't exist for text objs in check boxes, and potentially elsewhere.
    //    var parentId = textObj.parent().attr('id');
    //    if (parentId && $ax.visibility.isContainer(parentId)) return;

    //    //var alignProps = _idToAlignProps[textId];
    //    //if(!alignProps || !_getObjVisible(textId)) return;
    //    //if (!alignProps) return;

    //    //_setTextAlignment(textId, alignProps);
    //    _setTextAlignment(textId);
    //};

    var _getObjVisible = _style.getObjVisible = function (id) {
        var element = document.getElementById(id);
        return element && (element.offsetWidth || element.offsetHeight);
    };

    //$ax.style.setTextAlignment = function (textIds) {
        
    //    var getTextAlignDim = function(textId, alignProps) {
    //        var dim = {};
    //        var vAlign = alignProps.vAlign;
    //        var paddingTop = Number(alignProps.paddingTop);
    //        var paddingBottom = Number(alignProps.paddingBottom);
    //        var paddingLeft = Number(alignProps.paddingLeft);
    //        var paddingRight = Number(alignProps.paddingRight);

    //        var topParam = 0.0;
    //        var bottomParam = 1.0;
    //        var leftParam = 0.0;
    //        var rightParam = 1.0;

    //    var textObj = $jobj(textId);
    //    var textObjParent = textObj.offsetParent();
    //    var parentId = textObjParent.attr('id');
    //    if(!parentId) {
    //        // Only case should be for radio/checkbox that get the label now because it must be absolute positioned for animate (offset parent ignored it before)
    //        textObjParent = textObjParent.parent();
    //        parentId = textObjParent.attr('id');
    //    }

    //    parentId = $ax.visibility.getWidgetFromContainer(textObjParent.attr('id'));
    //    textObjParent = $jobj(parentId);
    //    var parentObj = $obj(parentId);
    //    if(parentObj['bottomTextPadding']) bottomParam = parentObj['bottomTextPadding'];
    //    if(parentObj['topTextPadding']) topParam = parentObj['topTextPadding'];
    //    if(parentObj['leftTextPadding']) leftParam = parentObj['leftTextPadding'];
    //    if(parentObj['rightTextPadding']) rightParam = parentObj['rightTextPadding'];

    //    // smart shapes are mutually exclusive from compound vectors.
    //    var isConnector = parentObj.type == $ax.constants.CONNECTOR_TYPE;
    //    if(isConnector) return;

    //        var axTextObjectParent = $ax('#' + textObjParent.attr('id'));


    //        var jDims = textObj.css(['width','left','top']);
    //        var oldWidth = $ax.getNumFromPx(jDims['width']);
    //        var oldLeft = $ax.getNumFromPx(jDims['left']);
    //        var oldTop = $ax.getNumFromPx(jDims['top']);

    //        var newTop = 0;
    //        var newLeft = 0.0;

    //        var size = axTextObjectParent.size();
    //        var width = size.width;
    //        var height = size.height;
    //        //var width = axTextObjectParent.width();
    //        //var height = axTextObjectParent.height();

    //        // If text rotated need to handle getting the correct width for text based on bounding rect of rotated parent.
    //        var boundingRotation = -$ax.move.getRotationDegreeFromElement(textObj[0]);
    //        var boundingParent = $axure.fn.getBoundingSizeForRotate(width, height, boundingRotation);
    //        var extraLeftPadding = (width - boundingParent.width) / 2;
    //        width = boundingParent.width;
    //        var relativeTop = 0.0;
    //        relativeTop = height * topParam;
    //        var containerHeight = height * bottomParam - relativeTop;

    //        newLeft = paddingLeft + extraLeftPadding + width * leftParam;

    //        var newWidth = width * (rightParam - leftParam) - paddingLeft - paddingRight;

    //        var horizChange = newWidth != oldWidth || newLeft != oldLeft;
    //        if(horizChange) {
    //            dim.left = newLeft;
    //            dim.width = newWidth;
    //            //textObj.css('left', newLeft);
    //            //textObj.width(newWidth);
    //        }

    //        var textHeight = _getRtfElementHeight(textObj[0]);

    //        if(vAlign == "middle")
    //            newTop = _roundToEven(relativeTop + (containerHeight - textHeight + paddingTop - paddingBottom) / 2);
    //        else if(vAlign == "bottom")
    //            newTop = _roundToEven(relativeTop + containerHeight - textHeight - paddingBottom);
    //        else newTop = _roundToEven(paddingTop + relativeTop);
    //        var vertChange = oldTop != newTop;
    //        if (vertChange) dim.top = newTop; //textObj.css('top', newTop + 'px');

    //        return dim;
    //    };

    //    var applyTextAlignment = function(textId, dim) {
    //        var textObj = $jobj(textId);
    //        if(dim.left) {
    //            textObj.css('left', dim.left);
    //            textObj.width(dim.width);
    //        }
    //        if(dim.top) textObj.css('top', dim.top);

    //        if((dim.top || dim.left)) _updateTransformOrigin(textId);
    //    };

    //    var idToDim = [];
    //    for (var i = 0; i < textIds.length; i++) {
    //        var textId = textIds[i];
    //        var alignProps = _idToAlignProps[textId];
    //        if (!alignProps || !_getObjVisible(textId)) continue;

    //        idToDim.push({ id: textId, dim: getTextAlignDim(textId, alignProps) });
    //    }

    //    for (var i = 0; i < idToDim.length; i++) {
    //        var info = idToDim[i];
    //        applyTextAlignment(info.id, info.dim);
    //    }
    //};

    //var _setTextAlignment = function(textId, alignProps, updateProps) {
    //    if(updateProps) _storeIdToAlignProps(textId);
    //    if(!alignProps) return;

    //    var vAlign = alignProps.vAlign;
    //    var paddingTop = Number(alignProps.paddingTop);
    //    var paddingBottom = Number(alignProps.paddingBottom);
    //    var paddingLeft = Number(alignProps.paddingLeft);
    //    var paddingRight = Number(alignProps.paddingRight);

    //    var topParam = 0.0;
    //    var bottomParam = 1.0;
    //    var leftParam = 0.0;
    //    var rightParam = 1.0;

    //    var textObj = $jobj(textId);
    //    var textObjParent = textObj.offsetParent();
    //    var parentId = textObjParent.attr('id');
    //    var isConnector = false;
    //    if(parentId) {
    //        parentId = $ax.visibility.getWidgetFromContainer(textObjParent.attr('id'));
    //        textObjParent = $jobj(parentId);
    //        var parentObj = $obj(parentId);
    //        if(parentObj['bottomTextPadding']) bottomParam = parentObj['bottomTextPadding'];
    //        if(parentObj['topTextPadding']) topParam = parentObj['topTextPadding'];
    //        if(parentObj['leftTextPadding']) leftParam = parentObj['leftTextPadding'];
    //        if(parentObj['rightTextPadding']) rightParam = parentObj['rightTextPadding'];

    //        // smart shapes are mutually exclusive from compound vectors.
    //        isConnector = parentObj.type == $ax.constants.CONNECTOR_TYPE;
    //    }
    //    if(isConnector) return;

    //    var axTextObjectParent = $ax('#' + textObjParent.attr('id'));

    //    var oldWidth = $ax.getNumFromPx(textObj.css('width'));
    //    var oldLeft = $ax.getNumFromPx(textObj.css('left'));
    //    var oldTop = $ax.getNumFromPx(textObj.css('top'));

    //    var newTop = 0;
    //    var newLeft = 0.0;

    //    var width = axTextObjectParent.width();
    //    var height = axTextObjectParent.height();

    //    // If text rotated need to handle getting the correct width for text based on bounding rect of rotated parent.
    //    var boundingRotation = -$ax.move.getRotationDegreeFromElement(textObj[0]);
    //    var boundingParent = $axure.fn.getBoundingSizeForRotate(width, height, boundingRotation);
    //    var extraLeftPadding = (width - boundingParent.width) / 2;
    //    width = boundingParent.width;
    //    var relativeTop = 0.0;
    //    relativeTop = height * topParam;
    //    var containerHeight = height * bottomParam - relativeTop;


    //    newLeft = paddingLeft + extraLeftPadding + width * leftParam;

    //    var newWidth = width * (rightParam - leftParam) - paddingLeft - paddingRight;

    //    var horizChange = newWidth != oldWidth || newLeft != oldLeft;
    //    if(horizChange) {
    //        textObj.css('left', newLeft);
    //        textObj.width(newWidth);
    //    }

    //    var textHeight = _getRtfElementHeight(textObj[0]);

    //    if(vAlign == "middle") newTop = _roundToEven(relativeTop + (containerHeight - textHeight + paddingTop - paddingBottom) / 2);
    //    else if(vAlign == "bottom") newTop = _roundToEven(relativeTop + containerHeight - textHeight - paddingBottom);
    //    else newTop = _roundToEven(paddingTop + relativeTop);
    //    var vertChange = oldTop != newTop;
    //    if(vertChange) textObj.css('top', newTop + 'px');

    //    if((vertChange || horizChange)) _updateTransformOrigin(textId);
    //};

    //var _updateTransformOrigin = function (textId) {
    //    var textObj = $jobj(textId);
    //    var parentId = textObj.parent().attr('id');
    //    if(!$obj(parentId).hasTransformOrigin) return;

    //    //var transformOrigin = textObj.css('-webkit-transform-origin') ||
    //    //        textObj.css('-moz-transform-origin') ||
    //    //            textObj.css('-ms-transform-origin') ||
    //    //                textObj.css('transform-origin');
    //    //if(transformOrigin) {
    //        var textObjParent = $ax('#' + textObj.parent().attr('id'));
    //        var newX = (textObjParent.width() / 2 - $ax.getNumFromPx(textObj.css('left')));
    //        var newY = (textObjParent.height() / 2 - $ax.getNumFromPx(textObj.css('top')));
    //        var newOrigin = newX + 'px ' + newY + 'px';
    //        textObj.css('-webkit-transform-origin', newOrigin);
    //        textObj.css('-moz-transform-origin', newOrigin);
    //        textObj.css('-ms-transform-origin', newOrigin);
    //        textObj.css('transform-origin', newOrigin);
    //    //}
    //};

    $ax.style.reselectElements = function() {
        for(var id in _selectedWidgets) {
            // Only looking for the selected widgets that don't have their class set
            if(!_selectedWidgets[id] || $jobj(id).hasClass('selected')) continue;

            $jobj(id).addClass('selected');
            _applyImageAndTextJson(id, $ax.style.generateState(id));
        }

        for(id in _disabledWidgets) {
            // Only looking for the disabled widgets that don't have their class yet
            if (!_disabledWidgets[id] || $jobj(id).hasClass('disabled')) continue;

            $jobj(id).addClass('disabled');
            _applyImageAndTextJson(id, $ax.style.generateState(id));
        }
    }

    $ax.style.clearStateForRepeater = function(repeaterId) {
        var children = $ax.getChildElementIdsForRepeater(repeaterId);
        for(var i = 0; i < children.length; i++) {
            var id = children[i];
            delete _selectedWidgets[id];
            delete _disabledWidgets[id];
        }
    }

    _style.updateStateClass = function (repeaterId) {
        var subElementIds = $ax.getChildElementIdsForRepeater(repeaterId);
        for (var i = 0; i < subElementIds.length; i++) {
            _applyImageAndTextJson(subElementIds[i], $ax.style.generateState(subElementIds[i]));
        }
    }

    $ax.style.clearAdaptiveStyles = function() {
        for(var shapeId in _adaptiveStyledWidgets) {
            var repeaterId = $ax.getParentRepeaterFromScriptId(shapeId);
            if(repeaterId) continue;
            var elementId = $ax.GetButtonShapeId(shapeId);
            if(elementId) _applyImageAndTextJson(elementId, $ax.style.generateState(elementId));
        }

        _adaptiveStyledWidgets = {};
    };

    $ax.style.setAdaptiveStyle = function(shapeId, style) {
        _adaptiveStyledWidgets[$ax.repeater.getScriptIdFromElementId(shapeId)] = style;

        var textId = $ax.GetTextPanelId(shapeId);
        if(textId) _applyTextStyle(textId, style);

        $ax.placeholderManager.refreshPlaceholder(shapeId);

        // removing this for now
        //        if(style.location) {
        //            $jobj(shapeId).css('top', style.location.x + "px")
        //                .css('left', style.location.y + "px");
        //        }
    };

    //-------------------------------------------------------------------------
    // _applyTextStyle
    //
    // Applies a rollover style to a text element.
    //       id : the id of the text object to set.
    //       styleProperties : an object mapping style properties to values. eg:
    //                         { 'fontWeight' : 'bold',
    //                           'fontStyle' : 'italic' }
    //-------------------------------------------------------------------------
    var _applyTextStyle = function(id, style) {
        _transformTextWithVerticalAlignment(id, function() {
            var styleProperties = _getCssStyleProperties(style);
            $('#' + id).find('*').each(function(index, element) {
                _applyCssProps(element, styleProperties);
            });
        });
    };

    var _applyCssProps = function(element, styleProperties, applyAllStyle) {
        if(applyAllStyle) {
            var allProps = styleProperties.allProps;
            for(var prop in allProps) element.style[prop] = allProps[prop];
        } else {
            var nodeName = element.nodeName.toLowerCase();
            if(nodeName == 'p') {
                var parProps = styleProperties.parProps;
                for(prop in parProps) element.style[prop] = parProps[prop];
            } else if(nodeName != 'a') {
                var runProps = styleProperties.runProps;
                for(prop in runProps) element.style[prop] = runProps[prop];
            }
        }
    };

    var _getCssShadow = function(shadow) {
        return !shadow.on ? "none"
            : shadow.offsetX + "px " + shadow.offsetY + "px " + shadow.blurRadius + "px " + _getCssColor(shadow.color);
    };

    var _getCssStyleProperties = function(style) {
        var toApply = {};
        toApply.runProps = {};
        toApply.parProps = {};
        toApply.allProps = {};

        if(style.fontName) toApply.allProps.fontFamily = toApply.runProps.fontFamily = style.fontName;
        // we need to set font size on both runs and pars because otherwise it well mess up the measure and thereby vertical alignment
        if(style.fontSize) toApply.allProps.fontSize = toApply.runProps.fontSize = toApply.parProps.fontSize = style.fontSize;
        if(style.fontWeight !== undefined) toApply.allProps.fontWeight = toApply.runProps.fontWeight = style.fontWeight;
        if(style.fontStyle !== undefined) toApply.allProps.fontStyle = toApply.runProps.fontStyle = style.fontStyle;

        var textDecoration = [];
        if(style.underline !== undefined) textDecoration[0] = style.underline ? 'underline ' : 'none';
        if(style.strikethrough !== undefined) {
            var index = textDecoration.length;
            if(style.strikethrough) textDecoration[index] ='line-through';
            else if(index == 0) textDecoration[0] = 'none';
        } 
        if (textDecoration.length > 0) {
            var decorationLineUp = "";
            for (var l = 0; l < textDecoration.length; l++) {
                decorationLineUp = decorationLineUp + textDecoration[l];
            }
            toApply.allProps.textDecoration = toApply.runProps.textDecoration = decorationLineUp;
        }
        if(style.foreGroundFill) {
            toApply.allProps.color = toApply.runProps.color = _getColorFromFill(style.foreGroundFill);
            //if(style.foreGroundFill.opacity) toApply.allProps.opacity = toApply.runProps.opacity = style.foreGroundFill.opacity;
        }
        if(style.horizontalAlignment) toApply.allProps.textAlign = toApply.parProps.textAlign = toApply.runProps.textAlign = style.horizontalAlignment;
        if(style.lineSpacing) toApply.allProps.lineHeight = toApply.parProps.lineHeight = style.lineSpacing;
        if(style.textShadow) toApply.allProps.textShadow = toApply.parProps.textShadow = _getCssShadow(style.textShadow);
        if (style.letterCase) toApply.allProps.textTransform = toApply.parProps.textTransform = style.letterCase;
        if (style.characterSpacing) toApply.allProps.letterSpacing = toApply.runProps.letterSpacing = style.characterSpacing;

        return toApply;
    };

    var _getColorFromFill = function(fill) {
        //var fillString = '00000' + fill.color.toString(16);
        //return '#' + fillString.substring(fillString.length - 6);
        var val = fill.color;
        var color = {};
        color.b = val % 256;
        val = Math.floor(val / 256);
        color.g = val % 256;
        val = Math.floor(val / 256);
        color.r = val % 256;
        color.a = typeof (fill.opacity) == 'number' ? fill.opacity : 1;
        return _getCssColor(color);
    };

    var _getCssColor = function(rgbaObj) {
        return "rgba(" + rgbaObj.r + ", " + rgbaObj.g + ", " + rgbaObj.b + ", " + rgbaObj.a + ")";
    };

    //    //--------------------------------------------------------------------------
    //    // ApplyStyleRecursive
    //    //
    //    // Applies a style recursively to all span and div tags including elementNode
    //    // and all of its children.
    //    //
    //    //     element : the element to apply the style to
    //    //     styleName : the name of the style property to set (eg. 'font-weight')     
    //    //     styleValue : the value of the style to set (eg. 'bold')
    //    //--------------------------------------------------------------------------
    //    function ApplyStyleRecursive(element, styleName, styleValue) {
    //        var nodeName = element.nodeName.toLowerCase();

    //        if (nodeName == 'div' || nodeName == 'span' || nodeName == 'p') {
    //            element.style[styleName] = styleValue;
    //        }

    //        for (var i = 0; i < element.childNodes.length; i++) {
    //            ApplyStyleRecursive(element.childNodes[i], styleName, styleValue);
    //        }
    //    }

    //    //---------------------------------------------------------------------------
    //    // ApplyTextProperty
    //    //
    //    // Applies a text property to rtfElement.
    //    //
    //    //     rtfElement : the the root text element of the rtf object (this is the
    //    //                  element named <id>_rtf
    //    //     prop : the style property to set.
    //    //     value : the style value to set.
    //    //---------------------------------------------------------------------------
    //    function ApplyTextProperty(rtfElement, prop, value) {
    //        /*
    //        var oldHtml = rtfElement.innerHTML;
    //        if (prop == 'fontWeight') {
    //            rtfElement.innerHTML = oldHtml.replace(/< *b *\/?>/gi, "");
    //        } else if (prop == 'fontStyle') {
    //            rtfElement.innerHTML = oldHtml.replace(/< *i *\/?>/gi, "");
    //        } else if (prop == 'textDecoration') {
    //            rtfElement.innerHTML = oldHtml.replace(/< *u *\/?>/gi, "");
    //        }
    //        */

    //        for (var i = 0; i < rtfElement.childNodes.length; i++) {
    //            ApplyStyleRecursive(rtfElement.childNodes[i], prop, value);
    //        }
    //    }
    //}

    //---------------------------------------------------------------------------
    // GetAndCacheOriginalText
    //
    // Gets the html for the pre-rollover state and returns the Html representing
    // the Rich text.
    //---------------------------------------------------------------------------
    var CACHE_COUNTER = 0;

    $ax.style.CacheOriginalText = function(textId, hasRichTextBeenSet) {
        var rtfQuery = $('#' + textId);
        if(rtfQuery.length > 0) {

            var styleCache = {};
            rtfQuery.find('*').each(function(index, element) {
                var elementId = element.id;
                if(!elementId) element.id = elementId = 'cache' + CACHE_COUNTER++;
                styleCache[elementId] = element.style.cssText;
            });

            _originalTextCache[textId] = {
                styleCache: styleCache
            };
            if(hasRichTextBeenSet) {
                var shapeId = $ax.GetShapeIdFromText(textId);
                _shapesWithSetRichText[shapeId] = true;
            }
        }
    };

    $ax.style.ClearCacheForRepeater = function(repeaterId) {
        for(var elementId in _originalTextCache) {
            var scriptId = $ax.repeater.getScriptIdFromElementId(elementId);
            if($ax.getParentRepeaterFromScriptId(scriptId) == repeaterId) delete _originalTextCache[elementId];
        }
    };



    $ax.style.prefetch = function() {
        var scriptIds = $ax.getAllScriptIds();
        var image = new Image();
        for(var i = 0; i < scriptIds.length; i++) {
            var obj = $obj(scriptIds[i]);
            if (!$ax.public.fn.IsImageBox(obj.type)) continue;
            var images = obj.images;
            for (var key in images) image.src = images[key];

            var imageOverrides = obj.imageOverrides;
            for(var elementId in imageOverrides) {
                var override = imageOverrides[elementId];
                for (var state in override) {
                    _addImageOverride(elementId, state, override[state]);
                    image.src = override[state];
                }
            }
        }
    };
});