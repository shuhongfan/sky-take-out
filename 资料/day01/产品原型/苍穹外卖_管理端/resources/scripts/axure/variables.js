// ******* GLOBAL VARIABLE PROVIDER ******** //
$axure.internal(function($ax) {
    var _globalVariableValues = {};

    var _globalVariableProvider = {};
    $ax.globalVariableProvider = _globalVariableProvider;

    var setVariableValue = function(variable, value, suppressBroadcast) {
        if(!(value instanceof Object)) value = value.toString();

        variable = variable.toLowerCase();
        _globalVariableValues[variable] = value;

        if(suppressBroadcast !== true) {
            var varData = {
                globalVarName: variable,
                globalVarValue: value.toString()
            };

            $axure.messageCenter.postMessage('setGlobalVar', varData);
        }

        //Post global var values only if pageData is loaded (suppresses exception which occurs when page loads)
        if($ax.pageData) {
            _postGlobalVarVals();
        }
    };
    _globalVariableProvider.setVariableValue = setVariableValue;

    var getVariableValue = function(variable, eventInfo, ignoreDefaultsForLinkUrl) {
        variable = variable.toLowerCase();
        if(_globalVariableValues[variable] !== undefined) {
            //If this is for the GetLinkUrl function and 
            //the current value of the global variable is the same as the default defined in the document, don't return it
            if(ignoreDefaultsForLinkUrl == true && $ax.document.globalVariables[variable] == _globalVariableValues[variable]) {
                return null;
            }

            return _globalVariableValues[variable];
        }
        if($ax.document.globalVariables[variable] !== undefined) return ignoreDefaultsForLinkUrl == true ? null : $ax.document.globalVariables[variable];
        switch(variable) {
            case "pagename": return $ax.pageData.page.name;

            case "now": return eventInfo.now;
            case "gendate": return $ax.pageData.generationDate;

            case "dragx": return $ax.drag.GetDragX();
            case "dragy": return $ax.drag.GetDragY();
            case "totaldragx": return $ax.drag.GetTotalDragX();
            case "totaldragy": return $ax.drag.GetTotalDragY();
            case "dragtime": return $ax.drag.GetDragTime();

            case "math": return Math;
            case "date": return Date;

            case "window": return eventInfo && eventInfo.window;
            case "this": return eventInfo && eventInfo.thiswidget && $ax.getWidgetInfo(eventInfo.thiswidget.elementId);
            case "item": return (eventInfo && eventInfo.item && eventInfo.item.valid && eventInfo.item) || getVariableValue('targetitem', eventInfo, ignoreDefaultsForLinkUrl);
            case "targetitem": return eventInfo && eventInfo.targetElement && $ax.getItemInfo(eventInfo.targetElement);
            case "repeater": return eventInfo && eventInfo.repeater;
            case "target": return eventInfo && eventInfo.targetElement && $ax.getWidgetInfo(eventInfo.targetElement);
            case "cursor": return eventInfo && eventInfo.cursor;
            default:
                var gen = variable.substr(0, 3) == "gen";
                var date = gen ? $ax.pageData.generationDate : new Date();
                var prop = gen ? variable.substr(3) : variable;
                switch(prop) {
                    case "day": return date.getDate();
                    case "month": return date.getMonth() + 1;
                    case "monthname": return $ax.getMonthName(date.getMonth());
                    case "dayofweek": return $ax.getDayOfWeek(date.getDay());
                    case "year": return date.getFullYear();
                    case "time": return date.toLocaleTimeString();
                    case "hours": return date.getHours();
                    case "minutes": return date.getMinutes();
                    case "seconds": return date.getSeconds();
                    default: return '';
                }
        }
    };
    _globalVariableProvider.getVariableValue = getVariableValue;

    var load = function() {
        var csum = false;

        var query = (window.location.href.split("#")[1] || ''); //hash.substring(1); Firefox decodes this so & in variables breaks
        if(query.length > 0) {
            var vars = query.split("&");
            for(var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                var varName = pair[0];
                var varValue = pair[1];
                if(varName) {
                    if(varName == 'CSUM') {
                        csum = true;
                    } else setVariableValue(varName, decodeURIComponent(varValue), true);
                }
            }

            if(!csum && query.length > 250) {
                window.alert('Axure Warning: The variable values were too long to pass to this page.\n\nIf you are using IE, using Chrome or Firefox will support more data.');
            }
        }
    };

    var getLinkUrl = function(baseUrl) {
        var toAdd = '';
        var definedVariables = _getDefinedVariables();
        for(var i = 0; i < definedVariables.length; i++) {
            var key = definedVariables[i];
            var val = getVariableValue(key, undefined, true);
            if(val != null) { 
                if(toAdd.length > 0) toAdd += '&';
                toAdd += key + '=' + encodeURIComponent(val);
            }
        }
        return toAdd.length > 0 ? baseUrl + ($axure.shouldSendVarsToServer() ? '?' : '#') + toAdd + "&CSUM=1" : baseUrl;
    };
    _globalVariableProvider.getLinkUrl = getLinkUrl;

    var _getDefinedVariables = function() {
        return $ax.pageData.variables;
    };
    _globalVariableProvider.getDefinedVariables = _getDefinedVariables;

    var _postGlobalVarVals = function() {
        var retVal = {};
        var definedVariables = _getDefinedVariables();
        for(var i = 0; i < definedVariables.length; i++) {
            var key = definedVariables[i];
            var val = getVariableValue(key);
            if(val != null) {
                retVal[key] = val;
            }
        }

        $ax.messageCenter.postMessage('globalVariableValues', retVal);
    };

    $ax.messageCenter.addMessageListener(function(message, data) {
        if(message == 'getGlobalVariables') {
            _postGlobalVarVals();
        } else if(message == 'resetGlobalVariables') {
            _globalVariableValues = {};
            _postGlobalVarVals();
        }
    });

    load();
});