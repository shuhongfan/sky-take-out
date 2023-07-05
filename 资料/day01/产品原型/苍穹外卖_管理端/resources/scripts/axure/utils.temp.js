// ******* Deep Copy ******** //
$axure.internal(function($ax) {
    // TODO: [ben] Ah, infinite loops cause major issues here. Tried saving objects we've already hit, but that didn't seem to work (at least at my first shot).
    // TODO:  [ben] To continue from above, added a filter to filter out problem keys. Will need a better way of sorting this out eventually.
    var _deepCopy = function (original, trackCopies, filter) {
        if(trackCopies) {
            var index = _getCopyIndex(original);
            if(index != -1) return _originalToCopy[index][1];
        }
        var isArray = original instanceof Array;
        var isObject = !(original instanceof Function) && !(original instanceof Date) && (original instanceof Object);
        if(!isArray && !isObject) return original;
        var copy = isArray ? [] : { };
        if(trackCopies) _originalToCopy.push([original, copy]);
        isArray ? deepCopyArray(original, trackCopies, copy, filter) : deepCopyObject(original, trackCopies, copy, filter);
        return copy;
    };
    $ax.deepCopy = _deepCopy;

    // Hacky way to copy event info. Copying dragInfo causes major issues due to infinite loops
    // Hashmap doesn't map objects well. It just toStrings them, making them all the same key. This has to be slow...
    var _originalToCopy = [];
    var _getCopyIndex = function(original) {
        for(var i = 0; i < _originalToCopy.length; i++) if(original === _originalToCopy[i][0]) return i;
        return -1;
    };

    $ax.eventCopy = function(eventInfo) {
        var copy = _deepCopy(eventInfo, true, ['dragInfo', 'elementQuery', 'obj']);
        // reset the map. TODO: May need to reset elsewhere too, but this is the only way it's used currently
        _originalToCopy = [];

        return copy;
    };

    var deepCopyArray = function(original, trackCopies, copy, filter) {
        for(var i = 0; i < original.length; i++) {
            copy[i] = _deepCopy(original[i], trackCopies, filter);
        }
    };

    var deepCopyObject = function(original, trackCopies, copy, filter) {
        for(var key in original) {
            if(!original.hasOwnProperty(key)) continue; // Continue if the prop was not put there like a dictionary, but just a native part of the object

            if(filter && filter.indexOf[key] != -1) copy[key] = original[key]; // If that key is filtered out, skip recursion on it.
            else copy[key] = _deepCopy(original[key], trackCopies, filter);
        }
    };

    // Our implementation of splice because it is broken in IE8...
    $ax.splice = function(array, startIndex, count) {
        var retval = [];
        if(startIndex >= array.length || startIndex < 0 || count == 0) return retval;
        if(!count || startIndex + count > array.length) count = array.length - startIndex;
        for(var i = 0; i < count; i++) retval[i] = array[startIndex + i];
        for(i = startIndex + count; i < array.length; i++) array[i - count] = array[i];
        for(i = 0; i < count; i++) array.pop();
        return retval;
    };
});



// ******* Flow Shape Links ******** //
$axure.internal(function($ax) {

    $(window.document).ready(function() {
        if (!$ax.document.configuration.linkFlowsToPages && !$ax.document.configuration.linkFlowsToPagesNewWindow) return;

        $ax(function (dObj) { return ($ax.public.fn.IsVector(dObj.type) || $ax.public.fn.IsSnapshot(dObj.type)) && dObj.referencePageUrl; }).each(function (dObj, elementId) {

            var elementIdQuery = $('#' + elementId);

            if($ax.document.configuration.linkFlowsToPages && !$ax.event.HasClick(dObj)) {
                elementIdQuery.css("cursor", "pointer");
                elementIdQuery.click(function() {
                    $ax.navigate({
                        url: dObj.referencePageUrl,
                        target: "current",
                        includeVariables: true
                    });
                });
            }

            if($ax.document.configuration.linkFlowsToPagesNewWindow) {
                $('#' + elementId + "_ref").append("<div id='" + elementId + "PagePopup' class='refpageimage'></div>");
                $('#' + elementId + "PagePopup").click(function() {
                    $ax.navigate({
                        url: dObj.referencePageUrl,
                        target: "new",
                        includeVariables: true
                    });
                });
            }
        });
    });

});
