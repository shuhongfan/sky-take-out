// use this to isolate the scope
(function () {
    // No notes shown specified by generation config
    if (!$axure.document.configuration.showPageNotes && !$axure.document.configuration.showAnnotationsSidebar && !$axure.document.configuration.showAnnotations) { return; }

    $(window.document).ready(function () {
        // Load right panel for Page Notes
        if ($axure.document.configuration.showPageNotes || $axure.document.configuration.showAnnotationsSidebar) {
            $axure.player.createPluginHost({
                id: 'pageNotesHost',
                context: 'inspect',
                title: 'Documentation',
                gid: 2,
            });
        }

        // Load footnotes on widgets
        if ($axure.document.configuration.showAnnotations) {
            $('#overflowMenuContainer').prepend('<div id="showNotesOption" class="showOption" style="order: 3"><div class="overflowOptionCheckbox"></div>Show Note Markers</div>');
        }

        createNotesOverlay();
        generatePageNotes();

        if ($axure.player.isMobileMode()) {
            $('#showNotesOption').hide();
        } else {
            $('#showNotesOption').click(footnotes_click);
            $('#showNotesOption').find('.overflowOptionCheckbox').addClass('selected');
        }

        function populateNotes(pageForNotes) {
            var hasNotes = false;
            if ($axure.document.configuration.showPageNotes) {
                var pageNoteUi = '';

                function populatePageNotes(pageOrMaster) {
                    //populate the page notes
                    var notes = pageOrMaster.notes;
                    if (notes && !$.isEmptyObject(notes)) {
                        pageNoteUi += "<div class='notesPageNameHeader'>" + pageOrMaster.pageName + "</div>";

                        var showNames = $axure.document.configuration.showPageNoteNames;
                        for(var noteName in notes) {
                            pageNoteUi += "<div class='pageNoteContainer'>";
                            if(showNames) {
                                pageNoteUi += "<div class='pageNoteName'>" + noteName + "</div>";
                            }
                            pageNoteUi += "<div class='pageNote'>" + linkify(notes[noteName]) + "</div>";
                            pageNoteUi += "</div>";
                            //$('#pageNotesContent').append(pageNoteUi);

                            hasNotes = true;
                        }
                    }
                }

                populatePageNotes(pageForNotes);
                if (pageForNotes.masterNotes) {
                    for (var i = 0; i < pageForNotes.masterNotes.length; i++) {
                        populatePageNotes(pageForNotes.masterNotes[i]);
                    }
                }

                if (pageNoteUi.length > 0) {
                    pageNoteUi += "<div class='lineDivider'></div>";
                    var pageNotesHeader = "<div id='pageNotesSectionHeader' class='notesSectionHeader pluginNameHeader'>Page Notes</div>";
                    $('#pageNotesContent').append(pageNotesHeader + pageNoteUi);
                }
            }

            if ($axure.document.configuration.showAnnotationsSidebar) {
                var widgetNoteUi = '';
                //var widgetNotes = pageForNotes.widgetNotes;
                function populateWidgetNotes(widgetNotes){
                    if (widgetNotes) {
                        for (var i = 0; i < widgetNotes.length; i++) {
                            var widgetNote = widgetNotes[i];
                            widgetNoteUi += "<div class='widgetNoteContainer' data-id='" + widgetNote["ownerId"] + "'>";
                            widgetNoteUi += "<div class='widgetNoteFootnote'>" + widgetNote["fn"] + "</div>";
                            widgetNoteUi += "<div class='widgetNoteLabel'>" + widgetNote["label"] + "</div>";

                            for (var widgetNoteName in widgetNote) {
                                if (widgetNoteName != "label" && widgetNoteName != "fn" && widgetNoteName != "ownerId") {
                                    widgetNoteUi += "<div class='pageNoteName'>" + widgetNoteName + "</div>";
                                    widgetNoteUi += "<div class='pageNote'>" + linkify(widgetNote[widgetNoteName]) + "</div>";
                                    //widgetNoteUi += "<div class='nondottedDivider'></div>";
                                }
                            }
                            widgetNoteUi += "</div>";
                            //widgetNoteUi += "<div class='nondottedDivider'></div>";
                            //$('#pageNotesContent').append(widgetNoteUi);
                            hasNotes = true;
                        }
                    }
                }

                populateWidgetNotes(pageForNotes.widgetNotes);
                if (pageForNotes.masterNotes) {
                    for (var i = 0; i < pageForNotes.masterNotes.length; i++) {
                        populateWidgetNotes(pageForNotes.masterNotes[i].widgetNotes);
                    }
                }

                if (widgetNoteUi.length > 0) {
                    var widgetNotesHeader = "<div id='widgetNotesSectionHeader' class='notesSectionHeader pluginNameHeader'>Widget Notes</div>";
                    $('#pageNotesContent').append(widgetNotesHeader + widgetNoteUi);

                    //$('.widgetNoteContainer').children(':last-child').remove();
                    //$('.widgetNoteFootnote').append("<div class='annnoteline'></div><div class='annnoteline'></div><div class='annnoteline'></div>");
                    $('.widgetNoteContainer').click(function () {
                        var wasSelected = $(this).hasClass('widgetNoteContainerSelected');
                        $('.widgetNoteContainerSelected').removeClass('widgetNoteContainerSelected');
                        if (!wasSelected) $(this).addClass('widgetNoteContainerSelected');

                        var dimStr = $('.currentAdaptiveView').attr('data-dim');
                        var h = dimStr ? dimStr.split('x')[1] : '0';
                        var $leftPanel = $('.leftPanel:visible');
                        var leftPanelOffset = (!$axure.player.isMobileMode() && $leftPanel.length > 0) ? $leftPanel.width() : 0;
                        var $rightPanel = $('.rightPanel:visible');
                        var rightPanelOffset = (!$axure.player.isMobileMode() && $rightPanel.length > 0) ? $rightPanel.width() : 0;
                        var viewDimensions = {
                            h: h != '0' ? h : '',
                            scaleVal: $('.vpScaleOption').find('.selectedRadioButton').parent().attr('val'),
                            height: $('.rightPanel').height(),
                            panelWidthOffset: leftPanelOffset + rightPanelOffset
                        };
                        $axure.messageCenter.postMessage('toggleSelectWidgetNote', { id: this.getAttribute('data-id'), value: !wasSelected, view: viewDimensions});
                    });
                }

                
                //if (pageForNotes.masterNotes) {
                //    for (var i = 0; i < pageForNotes.masterNotes.length; i++) {
                //        var master = pageForNotes.masterNotes[i];
                //        hasNotes = populateNotes(master) || hasNotes;
                //    }
                //}
            }
            
            return hasNotes;
        }

        // bind to the page load
        $axure.page.bind('load.page_notes', function () {
            closeAllDialogs();

            var hasNotes = false;

            $('#pageNotesContent').html("");
            hasNotes = populateNotes($axure.page);
            
            if(hasNotes) $('#pageNotesEmptyState').hide();
            else $('#pageNotesEmptyState').show();

            //If footnotes enabled for this prototype...
            if ($axure.player.isMobileMode()) {
                $axure.messageCenter.postMessage('annotationToggle', false);
            } else if($axure.document.configuration.showAnnotations == true) {
                //If the fn var is defined and set to 0, hide footnotes
                //else if hide-footnotes button selected, hide them
                var fnVal = $axure.player.getHashStringVar(FOOTNOTES_VAR_NAME);
                if(fnVal.length > 0 && fnVal == 0) {
                    $('#showNotesOption').find('.overflowOptionCheckbox').removeClass('selected');
                    $axure.messageCenter.postMessage('annotationToggle', false);
                } else if(!$('#showNotesOption').find('.overflowOptionCheckbox').hasClass('selected')) {
                    //If the footnotes button isn't selected, hide them on this loaded page
                    $axure.messageCenter.postMessage('annotationToggle', false);
                }
            }

            // Get multiple click call if not removing beforehand
            $('#notesOverlay').off('click');
            $('#notesOverlay').on('click', '.closeNotesDialog', function () {
                var ownerId = $(this).attr("data-ownerid");
                _toggleAnnDialog(ownerId);
            });
            
            $axure.player.updatePlugins();
            return false;
        });

        $axure.messageCenter.addMessageListener(function (message, data) {
            //var messageData = { id: elementId, x: event.pageX, y: event.pageY }
            if (message == 'toggleAnnDialog') {
                _toggleAnnDialog(data.id, data.x, data.y, data.page);
            }
        });

    });

    function linkify(text) {
        var urlRegex = /(\b(((https?|ftp|file):\/\/)|(www\.))[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(urlRegex, function (url, b, c) {
            var url2 = (c == 'www.') ? 'http://' + url : url;
            return '<a href="' + url2 + '" target="_blank" class="noteLink">' + url + '</a>';
        });
    }

    function getWidgetNotesHtml(ownerId, page) {
        var pageForNotes = page || $axure.page;
        var widgetNoteUi = '';

        widgetNoteUi += "<div data-ownerid='" + ownerId + "' class='closeNotesDialog'></div>";
        widgetNoteUi += "<div class='notesDialogScroll'>";

        function getNotesForPage(widgetNotes) {
            for (var i = 0; i < widgetNotes.length; i++) {
                var widgetNote = widgetNotes[i];
                if (widgetNote["ownerId"] == ownerId) {
                    widgetNoteUi += "<div class='widgetNoteContainer' data-id='" + widgetNote["ownerId"] + "'>";
                    widgetNoteUi += "<div class='widgetNoteFootnote'>" + widgetNote["fn"] + "</div>";
                    widgetNoteUi += "<div class='widgetNoteLabel'>" + widgetNote["label"] + "</div>";

                    for (var widgetNoteName in widgetNote) {
                        if (widgetNoteName != "label" && widgetNoteName != "fn" && widgetNoteName != "ownerId") {
                            widgetNoteUi += "<div class='pageNoteName'>" + widgetNoteName + "</div>";
                            widgetNoteUi += "<div class='pageNote'>" + linkify(widgetNote[widgetNoteName]) + "</div>";
                        }
                    }
                    widgetNoteUi += "</div>";
                }
            }
        }

        getNotesForPage(pageForNotes.widgetNotes);
        if (pageForNotes.masterNotes) {
            for (var i = 0; i < pageForNotes.masterNotes.length; i++) {
                getNotesForPage(pageForNotes.masterNotes[i].widgetNotes);
            }
        }

        widgetNoteUi += "</div>";
        widgetNoteUi += "<div class='resizeNotesDialog'></div>";

        return widgetNoteUi;
    }

    var maxZIndex = 1;
    var dialogs = {};
    var _toggleAnnDialog = function (id, srcLeft, srcTop, page) {

        if(dialogs[id]) {
            var $dialog = dialogs[id];
            // reset the dialog
            dialogs[id] = undefined;
            $dialog.find('.notesDialogScroll').getNiceScroll().remove();
            $dialog.remove();
            return;
        }
        
        var bufferH = 10;
        var bufferV = 10;
        var blnLeft = false;
        var blnAbove = false;
        var mfPos = $('#mainPanelContainer').position();
        var viewablePanelLeftMargin = parseInt($('#mainPanelContainer').css('margin-left'));

        var sourceTop = srcTop + mfPos.top;
        var sourceLeft = srcLeft + viewablePanelLeftMargin;

        var width = 300;
        var height = 300;

        if(sourceLeft > width + bufferH) {
            blnLeft = true;
        }
        if(sourceTop > height + bufferV) {
            blnAbove = true;
        }

        var top = 0;
        var left = 0;
        if(blnAbove) top = sourceTop - height - 20;
        else top = sourceTop + 10;
        if(blnLeft) left = sourceLeft - width - 4;
        else left = sourceLeft - 6;

        //need to set the zindex
        maxZIndex = maxZIndex + 1;
        
        var $dialog = $('<div class="notesDialog"></div>')
            .appendTo('#notesOverlay')
            .html(getWidgetNotesHtml(id, page));     

        $dialog.css({ 'left': left, 'top': top, 'z-index': maxZIndex });

        $dialog.find('.notesDialogScroll').niceScroll({ cursorcolor: "#8c8c8c", cursorborder: "0px solid #fff" });

        $dialog.find('.notesDialogScroll').on($axure.eventNames.mouseDownName, function(event) {
            event.stopPropagation();
        });
        
        $dialog.find('.closeNotesDialog').on($axure.eventNames.mouseDownName, function (event) {
            event.stopPropagation();
        });

        $dialog.on($axure.eventNames.mouseDownName, startDialogMove);
        var startMouseX;
        var startMouseY;
        var startDialogX;
        var startDialogY;
        function startDialogMove() {
            startMouseX = window.event.pageX;
            startMouseY = window.event.pageY;
            var position = $dialog.position();
            startDialogX = position.left;
            startDialogY = position.top;

            $dialog.addClass('active');
            $('<div class="splitterMask"></div>').insertAfter($('#notesOverlay'));
            $(document).bind($axure.eventNames.mouseMoveName, doDialogMove).bind($axure.eventNames.mouseUpName, endDialogMove);

            $dialog.find('.notesDialogScroll').getNiceScroll().hide();
        }

        function doDialogMove() {
            var currentX = window.event.pageX;
            var currentY = window.event.pageY;
            $dialog.css({ 'left': startDialogX + currentX - startMouseX, 'top': startDialogY + currentY - startMouseY });
        }

        function endDialogMove() {
            $('div.splitterMask').remove();
            $dialog.removeClass('active');
            $(document).unbind($axure.eventNames.mouseMoveName, doDialogMove).unbind($axure.eventNames.mouseUpName, endDialogMove);

            $dialog.find('.notesDialogScroll').getNiceScroll().resize();
            $dialog.find('.notesDialogScroll').getNiceScroll().show();
        }

        $dialog.find('.resizeNotesDialog').on($axure.eventNames.mouseDownName, startDialogResize);

        var startDialogW;
        var startDialogH;
        function startDialogResize() {
            event.stopPropagation();

            startMouseX = window.event.pageX;
            startMouseY = window.event.pageY;
            startDialogW = Number($dialog.css('width').replace('px',''));
            startDialogH = Number($dialog.css('height').replace('px', ''));

            $dialog.addClass('active');
            $('<div class="splitterMask"></div>').insertAfter($('#notesOverlay'));
            $(document).bind($axure.eventNames.mouseMoveName, doDialogResize).bind($axure.eventNames.mouseUpName, endDialogResize);

            $dialog.find('.notesDialogScroll').getNiceScroll().hide();
        }

        function doDialogResize() {
            var currentX = window.event.pageX;
            var currentY = window.event.pageY;
            var newWidth = Math.max(200, startDialogW + currentX - startMouseX);
            var newHeight = Math.max(200, startDialogH + currentY - startMouseY);
            $dialog.css({ 'width': newWidth, 'height': newHeight });
        }

        function endDialogResize() {
            $('div.splitterMask').remove();
            $dialog.removeClass('active');
            $(document).unbind($axure.eventNames.mouseMoveName, doDialogResize).unbind($axure.eventNames.mouseUpName, endDialogResize);

            $dialog.find('.notesDialogScroll').getNiceScroll().resize();
            $dialog.find('.notesDialogScroll').getNiceScroll().show();
        }

        dialogs[id] = $dialog;

        // scroll ... just for IE
        //window.scrollTo(scrollX, scrollY);
    };
    
    $(document).on('sidebarCollapse', function (event, data) {
        clearSelection();
    });

    $(document).on('pluginShown', function (event, data) {
        if(data != 2) {
            clearSelection();
        }
    });

    function clearSelection() {
        var selectedNote = $('#pageNotesContainer').find('.widgetNoteContainerSelected');
        if(selectedNote.length > 0) {
            selectedNote.removeClass('widgetNoteContainerSelected');
            //var dimStr = $('.currentAdaptiveView').attr('data-dim');
            //var h = dimStr ? dimStr.split('x')[1] : '0';
            //var $leftPanel = $('.leftPanel:visible');
            //var leftPanelOffset = (!$axure.player.isMobileMode() && $leftPanel.length > 0) ? $leftPanel.width() : 0;
            //var $rightPanel = $('.rightPanel:visible');
            //var rightPanelOffset = (!$axure.player.isMobileMode() && $rightPanel.length > 0) ? $rightPanel.width() : 0;
            //var viewDimensions = {
            //    h: h != '0' ? h : '',
            //    scaleVal: $('.vpScaleOption').find('.selectedRadioButton').parent().attr('val'),
            //    scrollLeft: $('#clipFrameScroll').scrollLeft(),
            //    scrollTop: $('#clipFrameScroll').scrollTop(),
            //    height: $('.rightPanel').height(),
            //    panelWidthOffset: leftPanelOffset + rightPanelOffset
            //};
            //$axure.messageCenter.postMessage('toggleSelectWidgetNote', { id: '', value: false, view: viewDimensions });
            $axure.messageCenter.postMessage('toggleSelectWidgetNote', { id: '', value: false });
            //$axure.messageCenter.postMessage('toggleSelectWidgetNote', '');
        }
    }

    function closeAllDialogs() {
        for (var id in dialogs) {
            var $dialog = dialogs[id];
            if ($dialog !== undefined) _toggleAnnDialog(id);
        }
    }

    $axure.player.toggleFootnotes = function(val) {
        var scaleCheckDiv = $('#showNotesOption').find('.overflowOptionCheckbox');
        if (scaleCheckDiv.hasClass('selected')) {
            if (!val) $('#showNotesOption').click();
        } else {
            if (val) $('#showNotesOption').click();
        }
    }

    function footnotes_click(event) {
        var scaleCheckDiv = $('#showNotesOption').find('.overflowOptionCheckbox');
        if (scaleCheckDiv.hasClass('selected')) {
            closeAllDialogs();

            scaleCheckDiv.removeClass('selected');
            $axure.messageCenter.postMessage('annotationToggle', false);
            //Add 'fn' hash string var so that footnotes stay hidden across reloads
            $axure.player.setVarInCurrentUrlHash(FOOTNOTES_VAR_NAME, 0);
        } else {
            scaleCheckDiv.addClass('selected');
            $axure.messageCenter.postMessage('annotationToggle', true);
            //Delete 'fn' hash string var if it exists since default is visible
            $axure.player.deleteVarFromCurrentUrlHash(FOOTNOTES_VAR_NAME);
        }
    }

    function createNotesOverlay() {
        var $targetPanel = $('#clippingBounds');

        if (!$('#notesOverlay').length) {
            var notesOverlay = document.createElement('div');
            notesOverlay.setAttribute('id', 'notesOverlay');

            $targetPanel.prepend(notesOverlay);
            $(notesOverlay).append('&nbsp;');
        }
    }

    function generatePageNotes() {
        var pageNotesUi = "<div id='pageNotesHeader'>";

        pageNotesUi += "<div id='pageNotesToolbar' style='height: 12px;'>";
        pageNotesUi += "</div>";
        pageNotesUi += "</div>";


        pageNotesUi += "<div id='pageNotesScrollContainer'>";
        pageNotesUi += "<div id='pageNotesContainer'>";
        pageNotesUi += "<div id='pageNotesEmptyState' class='emptyStateContainer'><div class='emptyStateTitle'>No notes for this page.</div><div class='emptyStateContent'>Notes added in Axure RP will appear here.</div><div class='dottedDivider'></div></div>";
        pageNotesUi += "<span id='pageNotesContent'></span>";
        pageNotesUi += "</div></div>";

        $('#pageNotesHost').html(pageNotesUi);

        if(!$axure.document.configuration.showAnnotations) {
            $('#pageNotesHost .pageNameHeader').css('padding-right', '55px');
        }
    }

})();   