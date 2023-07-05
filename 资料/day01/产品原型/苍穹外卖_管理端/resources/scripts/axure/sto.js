
$axure.internal(function($ax) {
    var funcs = {};

    var weekday = new Array(7);
    weekday[0] = "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";

    funcs.getDayOfWeek = function() {
        return _getDayOfWeek(this.getDay());
    };

    var _getDayOfWeek = $ax.getDayOfWeek = function(day) {
        return weekday[day];
    };

    var month = new Array(12);
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";
    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";

    funcs.getMonthName = function() {
        return _getMonthName(this.getMonth());
    };

    var _getMonthName = $ax.getMonthName = function(monthNum) {
        return month[monthNum];
    };

    funcs.getMonth = function() {
        return this.getMonth() + 1;
    };

    funcs.addYears = function(years) {
        var retVal = new Date(this.valueOf());
        retVal.setFullYear(this.getFullYear() + Number(years));
        return retVal;
    };

    funcs.addMonths = function(months) {
        var retVal = new Date(this.valueOf());
        retVal.setMonth(this.getMonth() + Number(months));
        return retVal;
    };

    funcs.addDays = function(days) {
        var retVal = new Date(this.valueOf());
        retVal.setDate(this.getDate() + Number(days));
        return retVal;
    };

    funcs.addHours = function(hours) {
        var retVal = new Date(this.valueOf());
        retVal.setHours(this.getHours() + Number(hours));
        return retVal;
    };

    funcs.addMinutes = function(minutes) {
        var retVal = new Date(this.valueOf());
        retVal.setMinutes(this.getMinutes() + Number(minutes));
        return retVal;
    };

    funcs.addSeconds = function(seconds) {
        var retVal = new Date(this.valueOf());
        retVal.setSeconds(this.getSeconds() + Number(seconds));
        return retVal;
    };

    funcs.addMilliseconds = function(milliseconds) {
        var retVal = new Date(this.valueOf());
        retVal.setMilliseconds(this.getMilliseconds() + Number(milliseconds));
        return retVal;
    };

    var _stoHandlers = {};

    _stoHandlers.literal = function(sto, scope, eventInfo) {
        return sto.value;
    };

    //need angle bracket syntax because var is a reserved word
    _stoHandlers['var'] = function(sto, scope, eventInfo) {
        // Can't us 'A || B' here, because the first value can be false, true, or empty string and still be valid.
        var retVal = scope.hasOwnProperty(sto.name) ? scope[sto.name]  : $ax.globalVariableProvider.getVariableValue(sto.name, eventInfo);
        // Handle desired type here?
        
        if(retVal && retVal.exprType) {
            retVal = $ax.expr.evaluateExpr(retVal, eventInfo);
        }
        
        if((sto.desiredType == 'int' || sto.desiredType == 'float')) {
            var num = new Number(retVal);
            retVal = isNaN(num.valueOf()) ? retVal : num;
        }


        return retVal;
    };

    //TODO: Perhaps repeaterId can be detirmined at generation, and stored in the sto info.
    _stoHandlers.item = function(sto, scope, eventInfo, prop) {
        prop = prop || (eventInfo.data ? 'data' : eventInfo.link ? 'url' : eventInfo.image ? 'img' : 'text');
        var id = sto.isTarget || !$ax.repeater.hasData(eventInfo.srcElement, sto.name) ? eventInfo.targetElement : eventInfo.srcElement;
        return getData(eventInfo, id, sto.name, prop);
    };

    var getData = function(eventInfo, id, name, prop) {
        var repeaterId = $ax.getParentRepeaterFromScriptId($ax.repeater.getScriptIdFromElementId(id));
        var itemId = $ax.repeater.getItemIdFromElementId(id);
        return $ax.repeater.getData(eventInfo, repeaterId, itemId, name, prop);
    };

    _stoHandlers.paren = function(sto, scope, eventInfo) {
        return _evaluateSTO(sto.innerSTO, scope, eventInfo);
    };

    _stoHandlers.fCall = function(sto, scope, eventInfo) {
        //TODO: [mas] handle required type
        var thisObj = _evaluateSTO(sto.thisSTO, scope, eventInfo);
        if(sto.thisSTO.desiredType == 'string' && sto.thisSTO.computedType != 'string') thisObj = thisObj.toString();
        
        var args = [];
        for(var i = 0; i < sto.arguments.length; i++) {
            args[i] = _evaluateSTO(sto.arguments[i], scope, eventInfo);
        }
        var fn = (funcs.hasOwnProperty(sto.func) && funcs[sto.func]) || thisObj[sto.func];
        return fn.apply(thisObj, args);
    };

    _stoHandlers.propCall = function(sto, scope, eventInfo) {
        //TODO: [mas] handle required type
        if((sto.prop == 'url' || sto.prop == 'img') && sto.thisSTO.sto == 'item') return _stoHandlers.item(sto.thisSTO, scope, eventInfo, sto.prop);
        var thisObj = _evaluateSTO(sto.thisSTO, scope, eventInfo);
        var prop = thisObj[sto.prop] instanceof Function ? thisObj[sto.prop]() : thisObj[sto.prop];
        return prop;
    };

    var _binOps = {};
    _binOps['+'] = function(left, right) {
        if(left instanceof Date) return addDayToDate(left, right);
        if(right instanceof Date) return addDayToDate(right, left);

        var num = Number(left) + Number(right);
        return isNaN(num) ? (String(left) + String(right)) : num;
    };
    _binOps['-'] = function(left, right) {
        if(left instanceof Date) return addDayToDate(left, -right);
        return left - right;
    };
    _binOps['*'] = function(left, right) { return Number(left) * Number(right); };
    _binOps['/'] = function(left, right) { return Number(left) / Number(right); };
    _binOps['%'] = function(left, right) { return Number(left) % Number(right); };
    _binOps['=='] = function(left, right) { return _getBool(left) == _getBool(right); };
    _binOps['!='] = function(left, right) { return _getBool(left) != _getBool(right); };
    _binOps['<'] = function(left, right) { return Number(left) < Number(right); };
    _binOps['<='] = function(left, right) { return Number(left) <= Number(right); };
    _binOps['>'] = function(left, right) { return Number(left) > Number(right); };
    _binOps['>='] = function(left, right) { return Number(left) >= Number(right); };
    _binOps['&&'] = function(left, right) { return _getBool(left) && _getBool(right); };
    _binOps['||'] = function(left, right) { return _getBool(left) || _getBool(right); };

    // TODO: Move this to generic place to be used.
    var addDayToDate = function(date, days) {
        var retVal = new Date(date.valueOf());
        retVal.setDate(date.getDate() + days);
        return retVal;
    };

    var _unOps = {};
    _unOps['+'] = function(arg) { return +arg; };
    _unOps['-'] = function(arg) { return -arg; };
    _unOps['!'] = function(arg) { return !_getBool(arg); };

    _stoHandlers.binOp = function(sto, scope, eventInfo) {
        var left = _evaluateSTO(sto.leftSTO, scope, eventInfo);
        var right = _evaluateSTO(sto.rightSTO, scope, eventInfo);
        return _binOps[sto.op](left, right);
    };

    _stoHandlers.unOp = function(sto, scope, eventInfo) {
        var input = _evaluateSTO(sto.inputSTO, scope, eventInfo);
        return _unOps[sto.op](input);
    };

    var _getBool = function(val) {
        var lowerVal = val.toLowerCase ? val.toLowerCase() : val;
        return lowerVal == "false" ? false : lowerVal == "true" ? true : val;
    };
    $ax.getBool = _getBool;

    var _evaluateSTO = function(sto, scope, eventInfo) {
        if(sto.sto == 'error') return undefined;
        return _tryEscapeRichText(castSto(_stoHandlers[sto.sto](sto, scope, eventInfo), sto), eventInfo);
    };
    $ax.evaluateSTO = _evaluateSTO;

    var castSto = function(val, sto) {
        var type = sto.computedType || sto.desiredType;
        if(type == 'string') val = String(val);
        else if(type == 'date' && !(val instanceof Date)) val = new Date(val);
        else if(type == 'int' || type == 'float') val = Number(val);
        else if(type == 'bool') val = Boolean(val);

        return val;
    };

    var _tryEscapeRichText = function(text, eventInfo) {
        return eventInfo.htmlLiteral ? _escapeRichText(text) : text;
    };

    var _escapeRichText = function(text) {
        if(typeof (text) != 'string') return text;

        return text.replace('<', '&lt;');
    };
});