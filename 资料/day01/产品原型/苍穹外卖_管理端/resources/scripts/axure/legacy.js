//stored on each browser event
var windowEvent;

$axure.internal(function($ax) {
    var _legacy = {};
    $ax.legacy = _legacy;

    var Forms = window.document.getElementsByTagName("FORM");
    for(var i = 0; i < Forms.length; i++) {
        var Form = Forms[i];
        Form.onclick = $ax.legacy.SuppressBubble;
    }

    $ax.legacy.SuppressBubble = function(event) {
        if(IE_10_AND_BELOW) {
            window.event.cancelBubble = true;
            window.event.returnValue = false;
        } else {
            if(event) {
                event.stopPropagation();
            }
        }
    };
    
    $ax.legacy.BringToFront = function(id, skipFixed) {
        _bringToFrontHelper(id);
        if(!skipFixed) $ax.legacy.BringFixedToFront();
    };

    var _bringToFrontHelper = function(id) {
        var target = window.document.getElementById(id);
        if(target == null) return;
        $ax.globals.MaxZIndex = $ax.globals.MaxZIndex + 1;
        target.style.zIndex = $ax.globals.MaxZIndex;
    };

    $ax.legacy.BringFixedToFront = function() {
        $ax(function(diagramObject) { return diagramObject.fixedKeepInFront; }).each(function(diagramObject, scriptId) {
            _bringToFrontHelper(scriptId);
        });
    };

    $ax.legacy.SendToBack = function(id) {
        var target = window.document.getElementById(id);
        if(target == null) return;
        target.style.zIndex = $ax.globals.MinZIndex = $ax.globals.MinZIndex - 1;
    };

    $ax.legacy.RefreshScreen = function() {
        var oldColor = window.document.body.style.backgroundColor;
        var setColor = (oldColor == "rgb(0,0,0)") ? "#FFFFFF" : "#000000";
        window.document.body.style.backgroundColor = setColor;
        window.document.body.style.backgroundColor = oldColor;
    };

    $ax.legacy.getAbsoluteLeft = function(currentNode, elementId) {
        var oldDisplay = currentNode.css('display');
        var displaySet = false;
        if(oldDisplay == 'none') {
            currentNode.css('display', '');
            displaySet = true;
        }
        var left = currentNode.offset().left;

        // Special Layer code
        if($ax.getTypeFromElementId(elementId) == 'layer') {
            var first = true;
            var children = currentNode.children();
            for(var i = 0; i < children.length; i++) {
                var child = $(children[i]);
                var subDisplaySet = false;
                if(child.css('display') == 'none') {
                    child.css('display', '');
                    subDisplaySet = true;
                }
                if(first) left = child.offset().left;
                else left = Math.min(child.offset().left, left);
                first = false;

                if(subDisplaySet) child.css('display', 'none');
            }
        }

        if (displaySet) currentNode.css('display', oldDisplay);

        return $axure.fn.bodyToWorld(left, true);
    };

    $ax.legacy.getAbsoluteTop = function(currentNode, elementId) {
        var oldDisplay = currentNode.css('display');
        var displaySet = false;
        if(oldDisplay == 'none') {
            currentNode.css('display', '');
            displaySet = true;
        }
        var top = currentNode.offset().top;

        // Special Layer code
        if ($ax.getTypeFromElementId(elementId) == 'layer') {
            var first = true;
            var children = currentNode.children();
            for (var i = 0; i < children.length; i++) {
                var child = $(children[i]);
                var subDisplaySet = false;
                if (child.css('display') == 'none') {
                    child.css('display', '');
                    subDisplaySet = true;
                }
                if (first) top = child.offset().top;
                else top = Math.min(child.offset().top, top);
                first = false;

                if (subDisplaySet) child.css('display', 'none');
            }
        }

        if(displaySet) currentNode.css('display', oldDisplay);
        return top;
    };

    // ******************  Annotation and Link Functions ****************** //

    $ax.legacy.GetAnnotationHtml = function(annJson) {
        var retVal = "";
        for(var noteName in annJson) {
            if(noteName != "label" && noteName != "id") {
                retVal += "<div class='annotationName'>" + noteName + "</div>";
                retVal += "<div class='annotationValue'>" + linkify(annJson[noteName]) + "</div>";
            }
        }
        return retVal;

        function linkify(text) {
            var urlRegex = /(\b(((https?|ftp|file):\/\/)|(www\.))[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            return text.replace(urlRegex, function (url, b, c) {
                var url2 = (c == 'www.') ? 'http://' + url : url;
                return '<a href="' + url2 + '" target="_blank" class="noteLink">' + url + '</a>';
            });
        }
    };


    $ax.legacy.GetScrollable = function(target) {
        var $target = $(target);
        var last = $target;
        // Start past inital target. Can't scroll to target in itself, must be some ancestor.
        var current = last.parent();

        while(!current.is('body') && !current.is('html')) {
            var elementId = current.attr('id');
            var diagramObject = elementId && $ax.getObjectFromElementId(elementId);
            if (diagramObject && $ax.public.fn.IsDynamicPanel(diagramObject.type) && diagramObject.scrollbars != 'none') {
                //returns the panel diagram div which handles scrolling
                return $ax.dynamicPanelManager.getShownState(current.attr('id'))[0];
            }
            last = current;
            current = current.parent();
        }
        // Need to do this because of ie
        if(IE_10_AND_BELOW) return window.document.documentElement;
        else return window.document.body;
    };



});