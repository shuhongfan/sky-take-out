// This is actually for BOTH trees and menus
$axure.internal(function($ax) {
    var _tree = $ax.tree = {};
    var _menu = $ax.menu = {};

    $ax.menu.InitializeSubmenu = function(subMenuId, cellId) {
        var $submenudiv = $('#' + subMenuId);

        //mouseenter and leave for parent table cell
        $('#' + cellId).mouseenter(function(e) {
            //show current submenu
//            var submenuElement = document.getElementById(subMenuId);
//            if($ax.visibility.IsVisible(submenuElement) && submenuElement.style.display !== 'none') return;
            $ax.visibility.SetIdVisible(subMenuId, true);
            $ax.legacy.BringToFront(subMenuId);
            //$submenudiv.find('.menu_item').each(function() {
            //    $ax.style.updateTextAlignmentForVisibility($ax.GetTextPanelId($(this).attr('id')));
            //});
            _fireEventForSubmenu(subMenuId, "onShow");

        }).mouseleave(function (e) {
            var offset = $submenudiv.offset();
            var subcontwidth = $submenudiv.width();
            var subcontheight = $submenudiv.height();
            //If mouse is not within the submenu (added 3 pixel margin to top and left calculations), then close the submenu...
            if(e.pageX + 3 < offset.left || e.pageX > offset.left + subcontwidth || e.pageY + 3 < offset.top || e.pageY > offset.top + subcontheight) {
                $submenudiv.find('.sub_menu').addBack().each(function () {
//                    if(!$ax.visibility.IsVisible(this)) return;
                    $ax.visibility.SetVisible(this, false);
                    _fireEventForSubmenu(subMenuId, "onHide");
                });
                $ax.style.SetWidgetHover(cellId, false);
            }
        });

        $submenudiv.css('display', 'none');

        //mouseleave for submenu
        $submenudiv.mouseleave(function(e) {
            //close this menu and all menus below it
            $(this).find('.sub_menu').addBack().css({ 'visibility': 'hidden', 'display': 'none' }).each(function () {
//                if(!$ax.visibility.IsVisible(this)) return;
                _fireEventForSubmenu(this.id, "onHide");
            });
            $ax.style.SetWidgetHover(cellId, false);
        });
    };

    var _fireEventForSubmenu = function(targetId, eventName) {
        var diagramObject = $ax.getObjectFromElementId(targetId);
        var event = diagramObject.interactionMap && diagramObject.interactionMap[eventName];
        if(event) {
            var eventInfo = $ax.getEventInfoFromEvent($ax.getjBrowserEvent(), false, targetId);
            $ax.event.handleEvent(targetId, eventInfo, event, false, true);
        }
    }

    function IsNodeVisible(nodeId) {
        var current = window.document.getElementById(nodeId);
        var parent = current.parentNode;

        //move all the parent's children that are below the node and their annotations
        while(!$(current).hasClass("treeroot")) {
            if(!$ax.visibility.IsVisible(parent)) return false;
            current = parent;
            parent = parent.parentNode;
        }
        return true;
    }

    $ax.tree.ExpandNode = function(nodeId, childContainerId, plusMinusId) {
        var container = window.document.getElementById(childContainerId);
        if(!container || $ax.visibility.IsVisible(container)) return;
        $ax.visibility.SetVisible(container, true);

        if(plusMinusId != '') $ax.style.SetWidgetSelected(plusMinusId, true);

        var delta = _getExpandCollapseDelta(nodeId, childContainerId);

        var isVisible = IsNodeVisible(nodeId);
        var current = window.document.getElementById(nodeId);
        var parent = current.parentNode;

        //move all the parent's children that are below the node and their annotations
        while(!$(current).hasClass("treeroot")) {
            var after = false;
            var i = 0;
            for(i = 0; i < parent.childNodes.length; i++) {
                var child = parent.childNodes[i];
                if(after && child.id && $(child).hasClass("treenode")) {
                    var elementId = child.id;
                    child.style.top = $ax.getNumFromPx($(child).css('top')) + delta + 'px';
                    var ann = window.document.getElementById(elementId + "_ann");
                    if (ann) ann.style.top = $ax.getNumFromPx($(ann).css('top')) + delta + 'px';
                }
                if(child == current) after = true;
            }
            current = parent;
            parent = parent.parentNode;
            if(!isVisible && $ax.visibility.IsVisible(parent)) break;
        }
    };

    $ax.tree.CollapseNode = function(nodeId, childContainerId, plusMinusId) {
        var container = window.document.getElementById(childContainerId);
        if(!container || !$ax.visibility.IsVisible(container)) return;

        if(plusMinusId != '') $ax.style.SetWidgetSelected(plusMinusId, false);

        var delta = _getExpandCollapseDelta(nodeId, childContainerId);

        //hide it after getting the delta, otherwise the delta can't be calculated (offsetParent is null)
        $ax.visibility.SetVisible(container, false);

        var isVisible = IsNodeVisible(nodeId);
        var current = window.document.getElementById(nodeId);
        var parent = current.parentNode;

        //move all the parent's children that are below the node and their annotations
        while(!$(current).hasClass("treeroot")) {
            var after = false;
            var i = 0;
            for(i = 0; i < parent.childNodes.length; i++) {
                var child = parent.childNodes[i];
                if(after && child.id && $(child).hasClass("treenode")) {
                    var elementId = child.id;
                    child.style.top = $ax.getNumFromPx($(child).css('top')) - delta + 'px';
                    var ann = window.document.getElementById(elementId + "_ann");
                    if (ann) ann.style.top = $ax.getNumFromPx($(ann).css('top')) - delta + 'px';
                }
                if(child == current) after = true;
            }
            current = parent;
            parent = current.parentNode;
            if(!isVisible && $ax.visibility.IsVisible(parent)) break;
        }
    };

    var _getExpandCollapseDelta = function(nodeId, childContainerId) {
        return _getChildContainerHeightHelper(childContainerId);
    };

    var _getChildContainerHeightHelper = function(childContainerId) {
        var height = 0;
        $('#' + childContainerId).children().each(function() {
            if($(this).hasClass("treenode")) {
                height += $(this).height();
                var subContainer = window.document.getElementById(this.id + '_children');
                if(subContainer && $ax.visibility.IsVisible(subContainer)) {
                    height += _getChildContainerHeightHelper(subContainer.id);
                }
            }
        });
        return height;
    };

    $ax.tree.InitializeTreeNode = function(nodeId, plusminusid, childContainerId, selectText) {
        var childContainer = window.document.getElementById(childContainerId);
        if(childContainer) {
            //relying on the html generator to put this inline so we know to collapse by default
            var isCollapsed = childContainer.style.visibility == "hidden";
            if(isCollapsed) $ax.visibility.SetVisible(childContainer, false);

            if(!isCollapsed && plusminusid != '') $ax.style.SetWidgetSelected(plusminusid, true);
        }

        if(plusminusid != '') {
            $jobj(plusminusid).click(function() {
                var visibleSet = $ax.visibility.IsIdVisible(childContainerId);

                if(visibleSet) $ax.tree.CollapseNode(nodeId, childContainerId, plusminusid);
                else $ax.tree.ExpandNode(nodeId, childContainerId, plusminusid);
                $ax.tree.SelectTreeNode(nodeId, true);

                return false;
            }).css('cursor', 'default');
        }
    };

    var _getButtonShapeId = function(id) {
        var obj = $obj(id);
        return $ax.public.fn.IsTreeNodeObject(obj.type) ? $ax.getElementIdFromPath([obj.buttonShapeId], { relativeTo: id }) : id;
    };

    $ax.tree.SelectTreeNode = function(id, selected) {
        $ax.style.SetWidgetSelected(_getButtonShapeId(id), selected);
    };

});