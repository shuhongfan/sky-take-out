// ******* Recording MANAGER ******** //

$axure.internal(function($ax) {
    var _recording = $ax.recording = {};

    $ax.recording.recordEvent = function(element, eventInfo, axEventObject, timeStamp) {

        var elementHtml = $jobj(element);
        var className = elementHtml.attr('class');
        var inputValue;

        if(className === 'ax_checkbox') {
            inputValue = elementHtml.find('#' + element + '_input')[0].checked;
            eventInfo.inputType = className;
            eventInfo.inputValue = inputValue;
        }

        if(className === 'ax_text_field') {
            inputValue = elementHtml.find('#' + element + '_input').val();
            eventInfo.inputType = className;
            eventInfo.inputValue = inputValue;
        }


        var scriptId = $ax.repeater.getScriptIdFromElementId(element);
        var diagramObjectPath = $ax.getPathFromScriptId(scriptId);
        var form = {
            recordingId: $ax.recording.recordingId,
            elementID: element,
            eventType: axEventObject.description,
            'eventInfo': eventInfo,
            //            eventObject: axEventObject,
            'timeStamp': timeStamp,
            'path': diagramObjectPath
//            ,
//            'trigger': function() {
//                $ax.event.handleEvent(element, eventInfo, axEventObject);
//                return false;
//            }
        };

        $ax.messageCenter.postMessage('logEvent', form);
    };


    $ax.recording.maybeRecordEvent = function(element, eventInfo, axEventObject, timeStamp) {
    };


    $ax.recording.recordingId = "";
    $ax.recording.recordingName = "";

    $ax.messageCenter.addMessageListener(function(message, data) {
        if(message === 'startRecording') {
            $ax.recording.maybeRecordEvent = $ax.recording.recordEvent;
            $ax.recording.recordingId = data.recordingId;
            $ax.recording.recordingName = data.recordingName;
        } else if(message === 'stopRecording') {
            $ax.recording.maybeRecordEvent = function(element, eventInfo, axEventObject, timeStamp) {
            };

        }
        else if(message === 'playEvent') {

            var eventType = makeFirstLetterLower(data.eventType);
            var inputElement;

            var dObj = data.element === '' ? $ax.pageData.page : $ax.getObjectFromElementId(data.element);
            if(!data.axEventObject) {
                data.axEventObject = dObj && dObj.interactionMap && dObj.interactionMap[eventType];
            }

            data.eventInfo.thiswidget = $ax.getWidgetInfo(data.element);
            data.eventInfo.item = $ax.getItemInfo(data.element);

            if(data.eventInfo.inputType && data.eventInfo.inputType === 'ax_checkbox') {
                inputElement = $jobj(data.element + '_input');
                inputElement[0].checked = data.eventInfo.inputValue;
            }

            if(data.eventInfo.inputType && data.eventInfo.inputType === 'ax_text_field') {
                inputElement = $jobj(data.element + '_input');
                inputElement.val(data.eventInfo.inputValue);
            }

            $ax.event.handleEvent(data.element, data.eventInfo, data.axEventObject, false, true);
        }
    });

    var makeFirstLetterLower = function(eventName) {
        return eventName.substr(0, 1).toLowerCase() + eventName.substr(1);
    };

});