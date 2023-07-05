var currentNodeUrl = '';
var allNodeUrls = [];

var openNextPage = $axure.player.openNextPage = function () {
    var index = allNodeUrls.indexOf(currentNodeUrl) + 1;
    if(index >= allNodeUrls.length) return;
    var nextNodeUrl = allNodeUrls[index];
    currentNodeUrl = nextNodeUrl;
    $('.sitemapPageLink[nodeUrl="' + nextNodeUrl + '"]').parent().mousedown();
};

var openPreviousPage = $axure.player.openPreviousPage = function () {
    var index = allNodeUrls.indexOf(currentNodeUrl) - 1;
    if(index < 0) return;
    var nextNodeUrl = allNodeUrls[index];
    currentNodeUrl = nextNodeUrl;
    $('.sitemapPageLink[nodeUrl="' + nextNodeUrl + '"]').parent().mousedown();
};

// use this to isolate the scope
(function() {

    var SHOW_HIDE_ANIMATION_DURATION = 0;

    var HIGHLIGHT_INTERACTIVE_VAR_NAME = 'hi';

    var currentPageLoc = '';
    var currentPlayerLoc = '';
    var currentPageHashString = '';

    $(window.document).ready(function() {
        $axure.player.createPluginHost({
            id: 'sitemapHost',
            context: 'project',
            title: 'Project Pages',
            gid: 1,
        });

        $(window.document).bind('keyup', function (e) {
            if (e.target.localName == "textarea" || e.target.localName == "input") return;
            switch(e.which) {
                case 188:
                    openPreviousPage();
                    break;
                case 190:
                    openNextPage();
                    break;
                default: return; // exit this handler for other keys
            }
        });

        generateSitemap();

        $('.leftArrow').click(openPreviousPage);
        $('.rightArrow').click(openNextPage);

        $('.sitemapPlusMinusLink').click(collapse_click);
        $('.sitemapPageLink').parent().mousedown(node_click);

        $('#interfaceAdaptiveViewsListContainer').hide();

        $('#projectOptionsShowHotspots').click(showHotspots_click);
        $('#searchIcon').click(searchBoxClose_click);
        $('#searchDiv').click(searchBoxExpand_click);
        $('#searchBox').keyup(search_input_keyup);

        // bind to the page load
        $axure.page.bind('load.sitemap', function() {
            currentPageLoc = $axure.page.location.split("#")[0];
            var decodedPageLoc = decodeURI(currentPageLoc);
            currentNodeUrl = decodedPageLoc.substr(decodedPageLoc.lastIndexOf('/') ? decodedPageLoc.lastIndexOf('/') + 1 : 0);
            currentPlayerLoc = $(location).attr('href').split("#")[0].split("?")[0];
            currentPageHashString = '#p=' + currentNodeUrl.substr(0, currentNodeUrl.lastIndexOf('.'));

            $axure.player.setVarInCurrentUrlHash(PAGE_ID_NAME, $axure.player.getPageIdByUrl(currentNodeUrl));
            $axure.player.setVarInCurrentUrlHash(PAGE_URL_NAME, currentNodeUrl.substring(0, currentNodeUrl.lastIndexOf('.html')));

            $('#sitemapTreeContainer').find('.sitemapHighlight').removeClass('sitemapHighlight');
            $('.sitemapPageLink[nodeUrl="' + currentNodeUrl + '"]').parent().parent().addClass('sitemapHighlight');

            var pageName = $axure.page.pageName;
            $('.pageNameHeader').html(pageName);

            //If highlight var is present and set to 1 or else if
            //sitemap highlight button is selected then highlight interactive elements
            var hiVal = $axure.player.getHashStringVar(HIGHLIGHT_INTERACTIVE_VAR_NAME);
            if(hiVal.length > 0 && hiVal == 1) {
                $('#showHotspotsOption').find('.overflowOptionCheckbox').addClass('selected');
                if ($('#projectOptionsHotspotsCheckbox').length > 0) $('#projectOptionsHotspotsCheckbox').addClass('selected');
                $axure.messageCenter.postMessage('highlightInteractive', true);
            } else if ($('#showHotspotsOption').find('.overflowOptionCheckbox').hasClass('selected')) {
                $axure.messageCenter.postMessage('highlightInteractive', true);
            }

            generateAdaptiveViews(false);
            if (MOBILE_DEVICE) generateAdaptiveViews(true);

            $axure.player.suspendRefreshViewPort = true;

            //Set the current view if it is defined in the hash string
            //If the view is invalid, set it to 'auto' in the string
            //ELSE set the view based on the currently selected view in the toolbar menu
            var viewStr = $axure.player.getHashStringVar(ADAPTIVE_VIEW_VAR_NAME);
            if(viewStr.length > 0) {
                var $view = $('.adaptiveViewOption[val="' + viewStr + '"]');
                if($view.length > 0) $view.click();
                else $('.adaptiveViewOption[val="auto"]').click();
            } else if($('.selectedRadioButton').length > 0) {
                var $viewOption = $('.selectedRadioButton').parents('.adaptiveViewOption');
                $viewOption.click();
            }
            updateAdaptiveViewHeader();

            function setDefaultScaleForDevice() {
                if(MOBILE_DEVICE && $axure.player.isMobileMode()) {
                    $('.projectOptionsScaleRow[val="0"]').click();
                } else {
                    $('.vpScaleOption[val="0"]').click();
                }
            }

            var scaleStr = $axure.player.getHashStringVar(SCALE_VAR_NAME);
            if(scaleStr.length > 0) {
                var $scale = $('.vpScaleOption[val="' + scaleStr + '"]');
                if($scale.length > 0) $scale.click();
                else setDefaultScaleForDevice();
            } else {
                setDefaultScaleForDevice();
            }

            var rotateStr = $axure.player.getHashStringVar(ROT_VAR_NAME);
            if(rotateStr.length > 0) {
                $('#vpRotate').prop('checked', true);
            }

            $axure.player.suspendRefreshViewPort = false;

            if (!$axure.player.isViewOverridden()) $axure.messageCenter.postMessage('setAdaptiveViewForSize', { 'width': $('#mainPanel').width(), 'height': $('#mainPanel').height() });

            $axure.player.refreshViewPort();

            $axure.messageCenter.postMessage('finishInit');

            showMainPanel();
            return false;
        });

        var $vpContainer = $('#interfaceScaleListContainer');
        
        var scaleOptions = '<div class="vpScaleOption" val="0"><div class="scaleRadioButton"><div class="selectedRadioButtonFill"></div></div>Default Scale</div>';
        scaleOptions += '<div class="vpScaleOption" val="1"><div class="scaleRadioButton"><div class="selectedRadioButtonFill"></div></div>Scale to Width</div>';
        scaleOptions += '<div class="vpScaleOption" val="2"><div class="scaleRadioButton"><div class="selectedRadioButtonFill"></div></div>Scale to Fit</div>';
        $(scaleOptions).appendTo($vpContainer);

        $('#overflowMenuContainer').append('<div id="showHotspotsOption" class="showOption" style="order: 1"><div class="overflowOptionCheckbox"></div>Show Hotspots</div>');
        $('#overflowMenuContainer').append($vpContainer);
        $vpContainer.show();

        $('#showHotspotsOption').click(showHotspots_click);
        $('.vpScaleOption').click(vpScaleOption_click);
        $('.vpScaleOption').mouseup(function (event) {
            event.stopPropagation();
        });

        if (MOBILE_DEVICE) {
            var scaleOptions = '<div class="projectOptionsScaleRow" val="1"><div class="scaleRadioButton"><div class="selectedRadioButtonFill"></div></div>Scale to fit width</div>';
            scaleOptions += '<div class="projectOptionsScaleRow" val="0"><div class="scaleRadioButton"><div class="selectedRadioButtonFill"></div></div>Original size (100%)</div>';
            scaleOptions += '<div class="projectOptionsScaleRow" val="2" style="border-bottom: solid 1px #c7c7c7"><div class="scaleRadioButton"><div class="selectedRadioButtonFill"></div></div>Fit all to screen</div>';
            $(scaleOptions).appendTo($('#projectOptionsScaleContainer'));

            $('.projectOptionsScaleRow').click(vpScaleOption_click);
        }

        $('#searchBox').focusin(function() {
            if($(this).is('.searchBoxHint')) {
                $(this).val('');
                $(this).removeClass('searchBoxHint');
            }
        }).focusout(function() {
            if($(this).val() == '') {
                $(this).addClass('searchBoxHint');
            }
        });


        $('#searchBox').focusout();
    });

    var _formatViewDimension = function(dim) {
        if(dim == 0) return 'any';
        if(dim.toString().includes('.')) return dim.toFixed(2);
        return dim;
    };

    function generateAdaptiveViews(forProjectOptions) {
        var $container = forProjectOptions ? $('#projectOptionsAdaptiveViewsContainer') : $('#interfaceAdaptiveViewsListContainer');
        var $viewSelect = forProjectOptions ? $('#projectOptionsViewSelect') : $('#viewSelect');
        var adaptiveViewOptionClass = forProjectOptions ? 'projectOptionsAdaptiveViewRow' : 'adaptiveViewOption';
        var currentViewClass = forProjectOptions ? '' : 'currentAdaptiveView';

        $container.empty();
        $viewSelect.empty();

        //Fill out adaptive view container with prototype's defined adaptive views, as well as the default, and Auto
        var viewsList = '<div class="' + adaptiveViewOptionClass + '" val="auto"><div class="adapViewRadioButton selectedRadioButton"><div class="selectedRadioButtonFill"></div></div>Adaptive</div>';
        var viewSelect = '<option value="auto">Adaptive</option>';
        if (typeof $axure.page.defaultAdaptiveView.name != 'undefined') {
            //If the name is a blank string, make the view name the width if non-zero, else 'any'
            var defaultView = $axure.page.defaultAdaptiveView;
            var defaultViewName = defaultView.name;

            var widthString = _formatViewDimension(defaultView.size.width);
            var heightString = _formatViewDimension(defaultView.size.height);

            var viewString = defaultViewName + ' (' + widthString + ' x ' + heightString + ')';

            viewsList += '<div class="' + adaptiveViewOptionClass + ' ' + currentViewClass + '" val="default"data-dim="' + defaultView.size.width + 'x' + defaultView.size.height + '">' +
                '<div class="adapViewRadioButton"><div class="selectedRadioButtonFill"></div></div>' + viewString + '</div>';
            viewSelect += '<option value="default">' + viewString + '</option>';
        }

        var useViews = $axure.document.configuration.useViews;
        var hasViews = false;
        if(useViews) {
            for(var viewIndex = 0; viewIndex < $axure.page.adaptiveViews.length; viewIndex++) {
                var currView = $axure.page.adaptiveViews[viewIndex];

                var widthString = _formatViewDimension(currView.size.width);
                var heightString = _formatViewDimension(currView.size.height);

                var viewString = currView.name + ' (' + widthString + ' x ' + heightString + ')';
                viewsList += '<div class="' + adaptiveViewOptionClass +
                    ((forProjectOptions && (viewIndex == $axure.page.adaptiveViews.length - 1)) ? '" style="border-bottom: solid 1px #c7c7c7; margin-bottom: 15px;' : '') + 
                    '" val="' +
                    currView.id +
                    '"  data-dim="' +
                    currView.size.width +
                    'x' +
                    currView.size.height +
                    '"><div class="adapViewRadioButton"><div class="selectedRadioButtonFill"></div></div>' +
                    viewString +
                    '</div>';
                viewSelect += '<option value="' + currView.id + '">' + viewString + '</option>';

                hasViews = true;
            }
        }

        $container.append(viewsList);
        $viewSelect.append(viewSelect);

        if (!hasViews) {
            if (forProjectOptions) {
                $('#projectOptionsAdaptiveViewsHeader').hide();
                $('#projectOptionsAdaptiveViewsContainer').hide();
            } else $('#interfaceAdaptiveViewsContainer').hide();
        } else {
            if (forProjectOptions) {
                $('#projectOptionsAdaptiveViewsHeader').show();
                $('#projectOptionsAdaptiveViewsContainer').show();
            } else $('#interfaceAdaptiveViewsContainer').show();
        }

        $(('.' + adaptiveViewOptionClass)).click(adaptiveViewOption_click);

        if (!forProjectOptions) {
            $(('.' + adaptiveViewOptionClass)).mouseup(function (event) {
                event.stopPropagation();
            });
        }
    }


    function collapse_click(event) {
        if($(this).children('.sitemapPlus').length > 0) {
            expand_click($(this));
        } else {
            $(this)
                .children('.sitemapMinus').removeClass('sitemapMinus').addClass('sitemapPlus').end()
                .closest('li').children('ul').hide(SHOW_HIDE_ANIMATION_DURATION);
        }
        event.stopPropagation();
    }

    function expand_click($this) {
        $this
            .children('.sitemapPlus').removeClass('sitemapPlus').addClass('sitemapMinus').end()
            .closest('li').children('ul').show(SHOW_HIDE_ANIMATION_DURATION);
    }

    function searchBoxExpand_click(event) {
        if (!$('#searchIcon').hasClass('sitemapToolbarButtonSelected')) {
            $('#searchIcon').addClass('sitemapToolbarButtonSelected')
            $('#searchBox').width(0);
            $('#searchBox').show();
            $('#searchBox').animate({ width: '95%' }, { duration: 200, complete: function () { $('#searchBox').focus(); } });
        }
    }

    function searchBoxClose_click(event) {
        if ($('#searchIcon').hasClass('sitemapToolbarButtonSelected')) {
            $('#searchBox').animate({ width: '0%' }, { duration: 200,
                complete: function () {
                    $('#searchBox').hide();
                    $('#searchIcon').removeClass('sitemapToolbarButtonSelected')
                }});
            $('#searchBox').val('');
            $('#searchBox').keyup();
        }
    }

    function node_click(event) {
        hideMainPanel();
        $('#sitemapTreeContainer').find('.sitemapHighlight').removeClass('sitemapHighlight');
        $(this).parent().addClass('sitemapHighlight');
        $axure.page.navigate($(this).children('.sitemapPageLink')[0].getAttribute('nodeUrl'), true);
    }

    function hideMainPanel() {
        $('#mainPanel').css('opacity', '0');
        $('#clippingBounds').css('opacity', '0');
    }
    function showMainPanel() {
        $('#mainPanel').animate({ opacity: 1 }, 10);
        $('#clippingBounds').animate({ opacity: 1 }, 10);
    }

    $axure.messageCenter.addMessageListener(function(message, data) {
        if(message == 'adaptiveViewChange') {
            $('.adaptiveViewOption').removeClass('currentAdaptiveView');
            if(data.viewId) {$('.adaptiveViewOption[val="' + data.viewId + '"]').addClass('currentAdaptiveView');}
            else $('.adaptiveViewOption[val="default"]').addClass('currentAdaptiveView');

            //when we set adaptive view through user event, we want to update the checkmark on sitemap
            if(data.forceSwitchTo) {
                $('.adapViewRadioButton').find('.selectedRadioButtonFill').hide();
                $('.adapViewRadioButton').removeClass('selectedRadioButton');
                $('div[val="' + data.forceSwitchTo + '"]').find('.adapViewRadioButton').addClass('selectedRadioButton');
                $('div[val="' + data.forceSwitchTo + '"]').find('.selectedRadioButtonFill').show();
            }

            updateAdaptiveViewHeader();
            $axure.player.refreshViewPort();

        } else if(message == 'previousPage') {
            openPreviousPage();
        } else if(message == 'nextPage') {
            openNextPage();
        }
    });

    $axure.player.toggleHotspots = function (val) {
        var overflowMenuCheckbox = $('#showHotspotsOption').find('.overflowOptionCheckbox');
        if ($(overflowMenuCheckbox).hasClass('selected')) {
            if (!val) $('#showHotspotsOption').click();
        } else {
            if (val) $('#showHotspotsOption').click();
        }
    }

    function showHotspots_click(event) {
        var overflowMenuCheckbox = $('#showHotspotsOption').find('.overflowOptionCheckbox');
        var projOptionsCheckbox = $('#projectOptionsHotspotsCheckbox');

        if ($(overflowMenuCheckbox).hasClass('selected')) {
            overflowMenuCheckbox.removeClass('selected');
            if (projOptionsCheckbox.length > 0 ) projOptionsCheckbox.removeClass('selected');
            $axure.messageCenter.postMessage('highlightInteractive', false);
            //Delete 'hi' hash string var if it exists since default is unselected
            $axure.player.deleteVarFromCurrentUrlHash(HIGHLIGHT_INTERACTIVE_VAR_NAME);
        } else {
            overflowMenuCheckbox.addClass('selected');
            if (projOptionsCheckbox.length > 0) projOptionsCheckbox.addClass('selected');
            $axure.messageCenter.postMessage('highlightInteractive', true);
            //Add 'hi' hash string var so that stay highlighted across reloads
            $axure.player.setVarInCurrentUrlHash(HIGHLIGHT_INTERACTIVE_VAR_NAME, 1);
        }
    }


    function adaptiveViewOption_click(event) {
        var currVal = $(this).attr('val');

        $('.adaptiveViewOption').removeClass('currentAdaptiveView');
        if(currVal) {$('.adaptiveViewOption[val="' + currVal + '"]').addClass('currentAdaptiveView');}
        else $('.adaptiveViewOption[val="default"]').addClass('currentAdaptiveView');

        $('.adapViewRadioButton').find('.selectedRadioButtonFill').hide();
        $('.adapViewRadioButton').removeClass('selectedRadioButton');
        $('div[val="' + currVal + '"]').find('.adapViewRadioButton').addClass('selectedRadioButton');
        $('div[val="' + currVal + '"]').find('.selectedRadioButtonFill').show();

        selectAdaptiveView(currVal);
        $axure.player.closePopup();
        updateAdaptiveViewHeader();
    }

    var selectAdaptiveView = $axure.player.selectAdaptiveView = function(currVal) {
        if (currVal == 'auto') {
            $axure.messageCenter.postMessage('setAdaptiveViewForSize', { 'width': $('#mainPanel').width(), 'height': $('#mainPanel').height() });
            $axure.player.deleteVarFromCurrentUrlHash(ADAPTIVE_VIEW_VAR_NAME);
        } else {
            currentPageLoc = $axure.page.location.split("#")[0];
            var decodedPageLoc = decodeURI(currentPageLoc);
            var nodeUrl = decodedPageLoc.substr(decodedPageLoc.lastIndexOf('/')
                ? decodedPageLoc.lastIndexOf('/') + 1
                : 0);
            var adaptiveData = {
                src: nodeUrl
            };

            adaptiveData.view = currVal;
            $axure.messageCenter.postMessage('switchAdaptiveView', adaptiveData);
            $axure.player.setVarInCurrentUrlHash(ADAPTIVE_VIEW_VAR_NAME, currVal);
        }
    }

    $axure.player.updateAdaptiveViewHeader = updateAdaptiveViewHeader = function () {
        var hasDefinedDim = true;
        var dimensionlessViewStr = '(any x any)';

        var viewString = $('.adaptiveViewOption.currentAdaptiveView').text();
        if (viewString != null && viewString.indexOf(dimensionlessViewStr) >= 0) hasDefinedDim = false;

        if (!hasDefinedDim) {
            var viewName = viewString.substring(0, viewString.lastIndexOf(' ('));
            var widthString = $('#mainPanelContainer').width();
            viewString = viewName + ' (' + widthString + ' x any)';
        }

        $('.adaptiveViewHeader').html(viewString);
    }

    $axure.player.selectScaleOption = function (scaleVal) {
        var $scale = $('.vpScaleOption[val="' + scaleVal + '"]');
        if ($scale.length > 0) $scale.click();
    }

    function vpScaleOption_click(event) {
        var scaleCheckDiv = $(this).find('.scaleRadioButton');
        var scaleVal = $(this).attr('val');
        if (scaleCheckDiv.hasClass('selectedRadioButton')) return false;

        var $selectedScaleOption = $('.vpScaleOption[val="' + scaleVal + '"], .projectOptionsScaleRow[val="' + scaleVal + '"]');
        var $allScaleOptions = $('.vpScaleOption, .projectOptionsScaleRow');
        $allScaleOptions.find('.scaleRadioButton').removeClass('selectedRadioButton');
        $allScaleOptions.find('.selectedRadioButtonFill').hide();
        $selectedScaleOption.find('.scaleRadioButton').addClass('selectedRadioButton');
        $selectedScaleOption.find('.selectedRadioButtonFill').show();

        if (scaleVal == '0') {
            $axure.player.deleteVarFromCurrentUrlHash(SCALE_VAR_NAME);
        } else if (typeof scaleVal !== 'undefined') {
            $axure.player.setVarInCurrentUrlHash(SCALE_VAR_NAME, scaleVal);
        }

        $axure.player.refreshViewPort();
    }

    function search_input_keyup(event) {
        var searchVal = $(this).val().toLowerCase();
        //If empty search field, show all nodes, else grey+hide all nodes and
        //ungrey+unhide all matching nodes, as well as unhide their parent nodes
        if(searchVal == '') {
            $('.sitemapPageName').removeClass('sitemapGreyedName');
            $('.sitemapNode').show();
        } else {
            $('.sitemapNode').hide();

            $('.sitemapPageName').addClass('sitemapGreyedName').each(function() {
                var nodeName = $(this).text().toLowerCase();
                if(nodeName.indexOf(searchVal) != -1) {
                    $(this).removeClass('sitemapGreyedName').parents('.sitemapNode:first').show().parents('.sitemapExpandableNode').show();
                }
            });
        }
    }


    function generateSitemap() {
        var treeUl = "<div id='sitemapHeader'' class='sitemapHeader'>";
        treeUl += "<div id='sitemapToolbar' class='sitemapToolbar'>";

        treeUl += '<div id="searchDiv"><span id="searchIcon" class="sitemapToolbarButton"></span><input id="searchBox" type="text"/></div>';
        treeUl += "<div class='leftArrow sitemapToolbarButton'></div>";
        treeUl += "<div class='rightArrow sitemapToolbarButton'></div>";

        treeUl += "</div>";
        treeUl += "</div>";

        ///////////////////

        var sitemapTitle = $axure.player.getProjectName();
        if (!sitemapTitle) sitemapTitle = "Pages";
        treeUl += "<div class='sitemapPluginNameHeader pluginNameHeader'>" + sitemapTitle + "</div>";

        treeUl += "<div id='sitemapTreeContainer'>";
        treeUl += "<ul class='sitemapTree' style='clear:both;'>";
        var rootNodes = $axure.document.sitemap.rootNodes;
        for(var i = 0; i < rootNodes.length; i++) {
            treeUl += generateNode(rootNodes[i], 0);
        }
        treeUl += "</ul></div>";

        if (!MOBILE_DEVICE) {
            treeUl += "<div id='changePageInstructions' class='pageSwapInstructions'>Use  ";
            treeUl += '<span class="backKeys"></span>';
            treeUl += "  and  ";
            treeUl += '<span class="forwardKeys"></span>';
            treeUl += "  keys<br>to move between pages";
            treeUl += "</div>";
        }

        $('#sitemapHost').html(treeUl);
    }

    function generateNode(node, level) {
        var hasChildren = (node.children && node.children.length > 0);
        var margin, returnVal;
        if(hasChildren) {
            margin = (9 + level * 17);
            returnVal = "<li class='sitemapNode sitemapExpandableNode'><div><div class='sitemapPageLinkContainer' style='margin-left:" + margin + "px'><a class='sitemapPlusMinusLink'><span class='sitemapMinus'></span></a>";
        } else {
            margin = (19 + level * 17);
            returnVal = "<li class='sitemapNode sitemapLeafNode'><div><div class='sitemapPageLinkContainer' style='margin-left:" + margin + "px'>";
        }

        var isFolder = node.type == "Folder";
        if(!isFolder) {
            returnVal += "<a class='sitemapPageLink' nodeUrl='" + node.url + "'>";
            allNodeUrls.push(node.url);
        }
        returnVal += "<span class='sitemapPageIcon";
        if(isFolder) { returnVal += " sitemapFolderIcon"; }

        returnVal += "'></span><span class='sitemapPageName'>";
        returnVal += $('<div/>').text(node.pageName).html();
        returnVal += "</span>";
        if(!isFolder) returnVal += "</a>";
        returnVal += "</div></div>";

        if(hasChildren) {
            returnVal += "<ul>";
            for(var i = 0; i < node.children.length; i++) {
                var child = node.children[i];
                returnVal += generateNode(child, level + 1);
            }
            returnVal += "</ul>";
        }
        returnVal += "</li>";
        return returnVal;
    }
})();
