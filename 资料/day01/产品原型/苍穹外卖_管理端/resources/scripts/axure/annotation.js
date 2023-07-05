// ******* Annotation MANAGER ******** //
$axure.internal(function($ax) {
    var NOTE_SIZE = 10;

    var _annotationManager = $ax.annotation = {};

    var _updateLinkLocations = $ax.annotation.updateLinkLocations = function(elementId) {
        var textId = $ax.GetTextPanelId(elementId);
        if(!textId) return;

        var rotation = $ax.getObjectFromElementId(elementId).style.rotation;
        //we have to do this because webkit reports the post-transform position but when you set positions it's pre-transform
        if(WEBKIT && rotation) {
            //we can dynamiclly rotate a widget now, show need to remember the transform rather than just remove it
            //here jquery.css will return 'none' if element is display none
            var oldShapeTransform = document.getElementById(elementId).style['-webkit-transform'];
            var oldTextTransform = document.getElementById(textId).style['-webkit-transform'];
            $('#' + elementId).css('-webkit-transform', 'scale(1)');
            $('#' + textId).css('-webkit-transform', 'scale(1)');
        }

        $('#' + textId).find('div[id$="_ann"]').each(function(index, value) {
            var elementId = value.id.replace('_ann', '');
            var $link = $('#' + elementId);
            var annPos = $link.position();
            annPos.left += $link.width();
            //var annPos = $(value).position();
            var left = annPos.left;// - NOTE_SIZE;
            var top = annPos.top - 5;

            $(value).css('left', left).css('top', top);
        });

        //undo the transform reset
        if(WEBKIT && rotation) {
            $('#' + elementId).css('-webkit-transform', oldShapeTransform || '');
            $('#' + textId).css('-webkit-transform', oldTextTransform || '');
        }
    };

    var _toggleAnnotationDialog = function (elementId, event) {
            var win = $(window);
            var scrollY = win.scrollTop();
            var scrollX = win.scrollLeft();

        var messageData = { id: elementId, x: event.pageX - scrollX, y: event.pageY - scrollY }
        if (window.name != 'mainFrame') messageData.page = $ax.pageData.notesData;
        $ax.messageCenter.postMessage('toggleAnnDialog', messageData);
    }
    
    $ax.annotation.initialize = function () {
        _createFootnotes($ax('*'), true);
    }

    var _createFootnotes = $ax.annotation.createFootnotes = function(query, create) {
        if(!$ax.document.configuration.showAnnotations) return;
        
        var widgetNotes = $ax.pageData.notesData.widgetNotes;
        if (widgetNotes) {
            var ownerToFns = $ax.pageData.notesData.ownerToFns;
            if(!$.isEmptyObject(ownerToFns)) {
                query.each(function(dObj, elementId) {
                    var fns = ownerToFns[dObj.id];
                    if (fns !== undefined) {
                        var elementIdQuery = $('#' + elementId);
                        if (dObj.type == 'hyperlink') {
                            var parentId = $ax.GetParentIdFromLink(elementId);
                            if (create) {
                                elementIdQuery.after("<div id='" + elementId + "_ann' class='annnote'>&#8203;</div>");
                                appendFns($('#' + elementId + "_ann"), fns);
                            }
                            _updateLinkLocations(parentId);
                        } else {
                            if (create) {
                                elementIdQuery.after("<div id='" + elementId + "_ann' class='annnote'>&#8203;</div>");
                                appendFns($('#' + elementId + "_ann"), fns);
                            }
                            _adjustIconLocation(elementId, dObj);
                        }

                        if (create) {
                            $('#' + elementId + "_ann").click(function (e) {
                                _toggleAnnotationDialog(dObj.id, e);
                                return false;
                            });

                            var isVisible = true;
                            var isMaster = $ax.public.fn.IsReferenceDiagramObject(dObj.type);
                            if (isMaster) isVisible = dObj.visible;
                            else isVisible = $ax.visibility.IsIdVisible(elementId);
                            if (!isVisible) {
                                var ann = document.getElementById(elementId + "_ann");
                                if (ann) $ax.visibility.SetVisible(ann, false);
                            }
                        }
                    }
                });
            }
        }

        function appendFns($parent, fns) {
            for (var index = 0; index < fns.length; index++) {
                $parent.append("<div class='annnotelabel' >" + fns[index] + "</div>");
            }
        }
    };

    $ax.annotation.updateAllFootnotes = function () {
        _createFootnotes($ax('*'), false);
    }

    $ax.annotation.jQueryAnn = function(query) {
        var elementIds = [];
        query.each(function(diagramObject, elementId) {
            if(diagramObject.annotation) elementIds[elementIds.length] = elementId;
        });
        var elementIdSelectors = jQuery.map(elementIds, function(elementId) { return '#' + elementId + '_ann'; });
        var jQuerySelectorText = (elementIdSelectors.length > 0) ? elementIdSelectors.join(', ') : '';
        return $(jQuerySelectorText);
    };

    $(window.document).ready(function() {
        //$ax.annotation.InitializeAnnotations($ax(function(dObj) { return dObj.annotation; }));

        $ax.messageCenter.addMessageListener(function(message, data) {
            //If the annotations are being hidden via the Sitemap toggle button, hide any open dialogs
            if(message == 'annotationToggle') {
                if (data == true) {
                    $('div.annnote').show();
                } else {
                    $('div.annnote').hide();
                }
            }
        });
    });

    //adjust annotation location to a element's top right corner
    var _adjustIconLocation = $ax.annotation.adjustIconLocation = function(id, dObj) {
        var ann = document.getElementById(id + "_ann");
        if(ann) {
            var corners = $ax.public.fn.getCornersFromComponent(id);
            var width = $(ann).width();
            var newTopRight = $ax.public.fn.vectorPlus(corners.relativeTopRight, corners.centerPoint);
            //note size is 14x8, this is how rp calculated it as well
            ann.style.left = (newTopRight.x - width) + "px";

            var elementType = dObj ? dObj.type : $ax.getTypeFromElementId(id);
            var yOffset = $ax.public.fn.IsTableCell(elementType) ? 0 : -8;
            ann.style.top = (newTopRight.y + yOffset) + "px";
        }

        var ref = document.getElementById(id + "_ref");
        if(ref) {
            if(!corners) corners = $ax.public.fn.getCornersFromComponent(id);
            var newBottomRight = $ax.public.fn.vectorPlus(corners.relativeBottomRight, corners.centerPoint);

            ref.style.left = (newBottomRight.x - 8) + 'px';
            ref.style.top = (newBottomRight.y - 10) + 'px';
        }
    }
});