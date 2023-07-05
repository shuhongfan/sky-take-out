// ******* SITEMAP TOOLBAR VIEWER ACTIONS ******** //
$axure.internal(function ($ax) {
    var userTriggeredEventNames = ['onClick', 'onDoubleClick', 'onMouseOver', 'onMouseMove', 'onMouseOut', 'onMouseDown', 'onMouseUp',
        'onKeyDown', 'onKeyUp', 'onFocus', 'onLostFocus', 'onTextChange', 'onSelectionChange', 'onSelectedChange', 'onSelect', 'onUnselect',
        'onSwipeLeft', 'onSwipeRight', 'onSwipeUp', 'onSwipeDown', 'onDragStart', 'onDrag', 'onDragDrop', 'onScroll', 'onContextMenu', 'onMouseHover', 'onLongClick'];
    
    //var _toggleSelectWidgetNoteForRepeater = function (repeaterId, scriptId, select) {
    //    var itemIds = $ax.getItemIdsForRepeater(repeaterId);

    //    for(var i = 0; i < itemIds.length; i++) {
    //        var itemId = itemIds[i];
    //        var elementId = $ax.repeater.createElementId(scriptId, itemId);
    //        if(select) $('#' + elementId).addClass('widgetNoteSelected');
    //        else $('#' + elementId).removeClass('widgetNoteSelected');
    //    }
    //}
    $ax.messageCenter.addMessageListener(function (message, data) {
        //If annotation toggle message received from sitemap, toggle footnotes
        if(message == 'toggleSelectWidgetNote') {

            if (!IOS) {
                $('.widgetNoteSelected').removeClass('widgetNoteSelected');
            }

            if(!data.value) return;

            //if(lastSelectedWidgetNote == data.id) {
            //    lastSelectedWidgetNote = null;
            //    return;
            //}

            $ax('*').each(function(obj, elementId) {
                if (obj.id == data.id) {
                    if (!IOS) {
                        $('#' + elementId).addClass('widgetNoteSelected');
                    }

                    _scrollToSelectedNote($('#' + elementId), data.view);
                }
            });
        }
    });

    var _scrollToSelectedNote = function ($elmt, view) {
        var isLandscape = IOS ? window.orientation != 0 && window.orientation != 180 : false;
        var winWidth = !IOS ? $(window).width() : (isLandscape ? window.screen.height : window.screen.width) - view.panelWidthOffset;
        var winHeight = !IOS ? $(window).height() : view.height;
        var docLeft = $('html').last().scrollLeft();
        var docTop = $('html').last().scrollTop();
        var docRight = docLeft + winWidth;
        var docBottom = docTop + winHeight;

        var scale = $('#base').css('transform');;
        scale = (scale == "none") ? 1 : Number(scale.substring(scale.indexOf('(') + 1, scale.indexOf(',')));

        var bodyLeft = ($('body').css('left') !== undefined && $('body').css('left') !== "auto") ? Number($('body').css('left').replace('px','')) : 0;
        var top = scale * Number($elmt.css('top').replace('px', ''));
        var bottom = top + scale * $elmt.height();
        var left = scale * Number($elmt.css('left').replace('px', '')) + bodyLeft;
        var right = left + scale * $elmt.width();

        var doHorizontalMove = left < docLeft || right > docRight;
        var doVerticalMove = top < docTop || bottom > docBottom;
        var padding = scale * 50;

        var newScrollLeft = 0
        if (left < docLeft) {
            newScrollLeft = left - padding;
        } else if (right > docRight) {
            newScrollLeft = right + padding - winWidth;
        }

        var newScrollTop = 0
        if (top < docTop) {
            newScrollTop = top - padding;
        } else if (bottom > docBottom) {
            newScrollTop = bottom + padding - winHeight;
        }

        // Device Frame or Scale to width or Scale to fit (situations where there is no horizontal scroll)
        if (view.h || view.scaleVal == 1 || view.scaleVal == 2) {
            doHorizontalMove = false;
        }

        // Has Device Frame or Scale to Width and widget with note is outside of viewable panel right bounds
        if ((view.scaleVal == 1 || view.h) && (left > docRight)) {
            doVerticalMove = false;
        }

        // TODO: need to do something for dynamic panel with scroll
        if (doHorizontalMove && doVerticalMove) {
            $("html, body").animate({ scrollLeft: newScrollLeft, scrollTop: newScrollTop }, 300);
        } else if (doHorizontalMove) {
            $("html, body").animate({ scrollLeft: newScrollLeft }, 300);
        } else if (doVerticalMove) {
            $("html, body").animate({ scrollTop: newScrollTop }, 300);
        }
    }

    var highlightEnabled = false;
    $ax.messageCenter.addMessageListener(function(message, data) {
        if(message == 'highlightInteractive') {
            highlightEnabled = data == true;
            _applyHighlight($ax('*'));
        }
    });

    var _applyHighlight = $ax.applyHighlight = function(query, ignoreUnset) {
        if(ignoreUnset && !highlightEnabled) return;

        var pulsateClassName = 'legacyPulsateBorder';
        //Determine if the widget has a defined userTriggeredEventName specified in the array above
        var _isInteractive = function(diagramObject) {
            if(diagramObject && diagramObject.interactionMap) {
                for(var index in userTriggeredEventNames) {
                    if(diagramObject.interactionMap[userTriggeredEventNames[index]]) return true;
                }
            }
            return false;
        };

        //Traverse through parent layers (if any) of an element and see if any have a defined userTriggeredEventName
        var _findMatchInParent = function(id) {
            var parents = $ax('#' + id).getParents(true, ['layer'])[0];
            for(var i in parents) {
                var parentId = parents[i];
                var parentObj = $ax.getObjectFromScriptId(parentId);
                if(_isInteractive(parentObj)) return true;
            }
            return false;
        };

        //Find all widgets with a defined userTriggeredEventName specified in the array above
        var $matchingElements = query.filter(function (obj, id) {

            //This prevents the top left corner of the page from highlighting with everything else
            if($ax.public.fn.IsLayer(obj.type)) return false;

            if(_isInteractive(obj)) return true;
            else if($ax.public.fn.IsVector(obj.type) && obj.referencePageUrl) return true;

            //Last check on the object's parent layer(s), if a layer has a defined userTriggeredEventName
            //then we shall highlight each member of that layer TODO This is a design decision and is subject to change
            return _findMatchInParent(id);
        }).$();

        var isHighlighted = $matchingElements.is('.' + pulsateClassName);

        //Toggle the pulsate class on the matched elements
        if(highlightEnabled && !isHighlighted) {
            $matchingElements.addClass(pulsateClassName);
        } else if(!highlightEnabled && isHighlighted) {
            $matchingElements.removeClass(pulsateClassName);
        }
    };
    
    var getElementsFromPoint = function (x, y) {
        var elementsFromPointFn = document.elementsFromPoint || document.msElementsFromPoint;
        if (typeof elementsFromPointFn === "function") {
            return elementsFromPointFn.bind(document)(x, y);
        }
        return [];
    }

    $axure.getIdAndRectAtLoc = function (data) {
        var element = document.elementFromPoint(data.x, data.y);
        if (!element) return undefined;

        var jObj = _getElementIdFromTarget(element);
        if (jObj.length > 0) {
          var id = jObj.attr('id');
          var axObj = $ax('#' + id);
          var rect = axObj.pageBoundingRect();
          return { 'id': id, 'rect': rect };
        }
        return undefined;
    }

    $axure.getListOfIdAndRectAtLoc = function (data) {
        var domElements = getElementsFromPoint(data.x, data.y);

        if (!domElements || !domElements.length) return [];

        const elements = [];
        
        domElements.forEach(function (domElement) {
            var jObj = _getElementIdFromTarget(domElement);
            if (jObj.length > 0) {
                var id = jObj.attr('id');
                var axObj = $ax('#' + id);                
                var rect = axObj.pageBoundingRect();
                if (elements.findIndex(function (x) { return x.id === id }) < 0) {                    
                    elements.push( { 'id': id, 'rect': rect } );
                }
            }
        });

        return elements;
    }

    $axure.getIdRectAndStyleAtLoc = function(data) {
        var element = document.elementFromPoint(data.x, data.y);
        if (!element) return undefined;

        var jObj = _getElementIdFromTarget(element);
        if (jObj.length > 0) {
          var id = jObj.attr('id');
          return $axure.getRectAndStyleById(id);
        }
        return undefined;
    }

    $axure.getListOfIdRectAndStyleAtLoc = function(data) {
        var domElements = getElementsFromPoint(data.x, data.y);

        if (!domElements || !domElements.length) return [];
        
        const elements = [];
        
        domElements.forEach(function (domElement) {
            var jObj = _getElementIdFromTarget(domElement);
            if (jObj.length > 0) {
                var id = jObj.attr('id');
                if (elements.findIndex(function (x) { return x.id === id }) < 0) {                    
                    elements.push($axure.getRectAndStyleById(id));
                }
            }
        });

        return elements;
    }

    $axure.getRectAndStyleById = function (id) {
        var axObj = $ax('#' + id);
        var rect = axObj.pageBoundingRect();
        var style = $ax.style.computeFullStyle(id, $ax.style.generateState(id), $ax.adaptive.currentViewId);
        style.text = axObj.text();
        return { 'id': id, 'rect': rect, 'style': style };
    }

    $axure.isIdVisible = function (id) {
        return id ? $ax.visibility.IsIdVisible(id) : false;
    }

    $axure.getParentElementById = function (elementId) {
        if (!elementId) return undefined;
        var parentId = $ax.getLayerParentFromElementId(elementId);
        if (!parentId) {
            return undefined;
        }
        return $axure.getRectAndStyleById(parentId);
    }

    var _getElementIdFromTarget = function (target) {
        var targetId = target.id;
        var jTarget = $(target);
        while((!targetId || targetId.indexOf('cache') > -1) && jTarget[0].tagName != 'HTML') {
            jTarget = jTarget.parent();
            targetId = jTarget.attr('id');
        }
        if(targetId && targetId != 'base') {
            var sections = targetId.split('_');
            return $('#' + sections[0]);
        }
        return '';
    }

});