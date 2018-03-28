var UiControls;
(function (UiControls) {
    var ConnectionCenter = (function () {
        //static variable
        var sessionInfoManager;
        var sessionSnapshot = {};
		//UI elements
        var sessionButtonList = [];
        var appButtonList = [];
        var sessionsListElement;
        var sesionInfoManager = null;
        var previousSelectedItem = null;
        var devicesButtonElement = null;
		//Constant strings
        var sessionEntryTitleString = "session_entry";
        var appEntryTitleString = "app_entry";
        var radioLabelString = "radio_label_";
        var radioString = "radio_";

        var initialize = function (background) {
            sessionsListElement = document.getElementById('sessionsList');
            initializeButtons();
            initializeTitles();
            chrome.runtime.getBackgroundPage(function(bg) {
					bg.asyncObjects.get( 'object.sessionInfoManager' ,function(mgr){
						 sessionInfoManager = mgr;
		                 sessionInfoManager.addListener(commandParser);
		                 sessionSnapshot = sessionInfoManager.getSnapShot();
		                 constructUI();
					});
			});				

            document.getElementById('SettingsCloseButton').addEventListener('click', OnCloseClicked);
        };

        var initializeButtons = function () {
            var ctrlAltDel = document.getElementById('CtrlAltDel');
            sessionButtonList.push(ctrlAltDel);
            var devices = document.getElementById('Devices');
            sessionButtonList.push(devices);
            devicesButtonElement = devices;
            var disconnect = document.getElementById('Disconnect');
            sessionButtonList.push(disconnect);
            var logOff = document.getElementById('LogOff');
            sessionButtonList.push(logOff);

            var terminate = document.getElementById('Terminate');
            appButtonList.push(terminate);

            ctrlAltDel.addEventListener('click', ctrlAltDelClickHandler);
            disconnect.addEventListener('click', disconnectClickHandler);
            logOff.addEventListener('click', logoffClickHandler);
            terminate.addEventListener('click', terminateClickHandler);
            devices.addEventListener('click', devicesClickHandler);
        };

        var initializeTitles = function () {
            document.getElementById('connectionCenterHeader').textContent = chrome.i18n.getMessage('connection_center_title');
            document.getElementById('sessionsListDescription').textContent = chrome.i18n.getMessage('connection_center_description');
            document.getElementById('sessionButtonTitle').textContent = chrome.i18n.getMessage('connection_center_session_buttons_title');
            document.getElementById('appButtonTitle').textContent = chrome.i18n.getMessage('connection_center_app_buttons_title');
            document.getElementById('CtrlAltDel').value = chrome.i18n.getMessage('connection_center_ctrl_alt_del_button');
            document.getElementById('Devices').value = chrome.i18n.getMessage('connection_center_devices_button');
            document.getElementById('Disconnect').value = chrome.i18n.getMessage('connection_center_disconnect_button');
            document.getElementById('LogOff').value = chrome.i18n.getMessage('connection_center_logoff_button');
            document.getElementById('Terminate').value = chrome.i18n.getMessage('connection_center_terminate_button');
        };

        var OnCloseClicked = function () {
            var curWin = chrome.app.window.current();
            curWin.close();
        };

        var commandParser = function (message) {
            switch (message.cmd) {
                case "add":
                    console.log('adding entry for session : ' +  message.windowInfo.sessionId + "  / AppId : " +  message.windowInfo.appId);
                    addEntry(message);
                    break;
                case "remove":
                    console.log('Removing entry for session : ' +  message.windowInfo.sessionId + "  / AppId : " +  message.windowInfo.appId);
                    removeEntry(message);
                    break;
                case "unregister":
                    console.log('unregister session : ' + message.windowInfo.sessionId);
                    unregisterEntry(message);
                    break;
                case "sessionUpdate":
                    sessionUpdateHandler(message);
                    break;
                case "title":
                    udpateTitle(message);
                    break;
                case 'focus':
                case 'icon':
                    break;
                default:
                    console.log("Not valid message");
            }
        };

        var addEntry = function (msg) {
            var sessionId = msg.windowInfo.sessionId;
            var customSessionId = sessionEntryTitleString + sessionId;
            var appId = msg.windowInfo.appId;
            var customAppId = customSessionId + appEntryTitleString + appId;
            var appName = msg.data.windowName;
            var parent = document.getElementById(customSessionId);
			if (parent) {
				createAppElement(parent, customAppId, appName);
			} else {
				console.log("!!! parent is null ", customSessionId, customAppId);
			}
        };

        var removeEntry = function (msg) {
            var sessionId = msg.windowInfo.sessionId;
            var customSessionId = sessionEntryTitleString + sessionId;
            var appId = msg.windowInfo.appId;
            var customAppId = customSessionId + appEntryTitleString + appId;
            var parent = document.getElementById(customSessionId);
            if (parent) {
                var entry = document.getElementById(customAppId);
                 if (parent.id == entry.parentElement.id) {
                    parent.removeChild(entry);
                } 
            }
            
            if(previousSelectedItem && previousSelectedItem.id == customAppId){
                disableAllButtons();
            }
        };

        var unregisterEntry = function (msg) {
            var sessionId = msg.windowInfo.sessionId;
            var customSessionId = sessionEntryTitleString + sessionId;
            var entry = document.getElementById(customSessionId);
            if (sessionsListElement && entry) {
                if (sessionsListElement.id == entry.parentElement.id) {
                    sessionsListElement.removeChild(entry);
                } else {
                    console.log("Not a valid child ", entry);
                }
            }
            if(previousSelectedItem && previousSelectedItem.id == customSessionId){
                disableAllButtons();
            }
        };

        var sessionUpdateHandler = function (msg) {
            var sessionId = msg.windowInfo.sessionId;
            var customSessionId = sessionEntryTitleString + sessionId;
            var entry;

            console.log("Received session update event for session : " + msg.windowInfo.sessionId + "data : ", msg.data);
            if(msg.data.usbEnabled == true){
               entry = document.getElementById(customSessionId);
                if (entry){
                    entry.usbEnabled = true;
                    if(previousSelectedItem.id == customSessionId){
                        devicesButtonElement.disabled = false;
                    }
                }
            }else{
                entry = document.getElementById(customSessionId);
                if (!entry) {
                    createSessionElement(customSessionId, msg.data);
                }else{
                    console.log("Entry has already been created",customSessionId);
                }
            }
            
            
        };

        var udpateTitle = function (msg) {
            var sessionId = msg.windowInfo.sessionId;
            var customSessionId = sessionEntryTitleString + sessionId;
            var appId = msg.windowInfo.appId;
            var appName = msg.data.windowName;
            var customAppId = customSessionId + appEntryTitleString + appId;
            var labelElementId = radioLabelString + customAppId;
            var entry = document.getElementById(labelElementId);
            entry.textContent = appName;
        };

        var constructUI = function () {
            disableAllButtons();
            var curData = null;

            var sessionId = null;
            var customSessionId = null;
            var appId = null;
            var customAppId = null;
            var appName = null;

            var appCount = 0;
            for (var elem in sessionSnapshot) {
                curData = sessionSnapshot[elem];
                sessionId = elem;
                customSessionId = sessionEntryTitleString + sessionId;
                if (curData.desktopMode == true) {
                    createSessionElement(customSessionId, curData);
                } else {
                    createSessionElement(customSessionId, curData);
                    for (var element in curData.entries) {
                        appId = element;
                        customAppId = customSessionId + appEntryTitleString + appId;
                        appName = curData.entries[appId].windowName;
                        var parent = document.getElementById(customSessionId);
                        if (parent) {
                            createAppElement(parent, customAppId, appName);
                        }
                    }
                }
                appCount = 0;
            }
        };

        var disableAllButtons = function () {
            disableSessionButtons();
            disableAppButtons();
        };

        var disableSessionButtons = function () {
            for (var i = 0; i < sessionButtonList.length; i++) {
                sessionButtonList[i].disabled = true;
            }
        };

        var disableAppButtons = function () {
            for (var i = 0; i < appButtonList.length; i++) {
                appButtonList[i].disabled = true;
            }
        };

        var enableSessionButtons = function (elem) {
            for (var i = 0; i < sessionButtonList.length; i++) {
                if(sessionButtonList[i] == devicesButtonElement && elem.usbEnabled == false){
                     sessionButtonList[i].disabled = true;
                }else{
                     sessionButtonList[i].disabled = false;
                }
            }
        };

        var enableAppButtons = function () {
            for (var i = 0; i < appButtonList.length; i++) {
                appButtonList[i].disabled = false;
            }
        };

        var createSessionElement = function (sessionId, curData) {
            var sessionName = curData.caption;  
            var desktopMode = curData.desktopMode;
            var usbEnabled = curData.usbEnabled;
            
            var sessionDivElement = null;
            var customRadioButtonElement = null;
            var radioButtonElement = null;
            var label = null;
            var customRadioInnerCircle = null;
            var dummyDiv = null;
			
            //parent div
            sessionDivElement = document.createElement('div');
            sessionDivElement.id = sessionId;
            sessionDivElement.setAttribute('class', 'sessionElement');

            //actual radio button
            radioButtonElement = document.createElement('input');
            radioButtonElement.setAttribute('type', 'radio');
            radioButtonElement.id = radioString + sessionId;
            radioButtonElement.name = "SessionRadio";
            radioButtonElement.addEventListener("change", sessionRadioHandler.bind(null, radioButtonElement, sessionDivElement));

            //custom radio button div
            customRadioButtonElement = document.createElement('div');
            customRadioButtonElement.setAttribute('class', 'radioOuterCircle');
            customRadioButtonElement.addEventListener('click', sessionRadioHandler.bind(null, radioButtonElement, sessionDivElement));

            //custom radio button inner div
            customRadioInnerCircle = document.createElement('div');
            customRadioInnerCircle.setAttribute('class', 'radioInnerCircle');

            //label for radio button
            label = document.createElement('label');
            label.id = radioLabelString + sessionId;
            label.setAttribute('for', radioButtonElement.id);
            label.setAttribute('class', 'labelSession');
            label.textContent = sessionName;

            customRadioButtonElement.appendChild(customRadioInnerCircle);
            sessionDivElement.appendChild(radioButtonElement);

            //add customRadioButtonElement only after radioButtonElement
            sessionDivElement.appendChild(customRadioButtonElement);
            sessionDivElement.appendChild(label);

            if (!desktopMode) {
                //dummy div to adjust spacing
                dummyDiv = document.createElement('div');
                dummyDiv.setAttribute('class', 'dummyDiv');
                sessionDivElement.appendChild(dummyDiv);
            }
            sessionDivElement.addEventListener('click', sessionRadioHandler.bind(null, radioButtonElement, sessionDivElement));
            //devices option is disable by default
            sessionDivElement.usbEnabled = usbEnabled;
            sessionsListElement.appendChild(sessionDivElement);
            //return sessionDivElement;
        };

        var createAppElement = function (parent, appId, appName) {
            var appElement = null;
            var customRadioButtonElement = null;
            var radioButtonElement = null;
            var label = null;
            var customRadioInnerCircle = null;

            appElement = document.createElement('div');
            appElement.setAttribute('class', 'appElement');
            appElement.id = appId;

            //acutal radio button
            radioButtonElement = document.createElement('input');
            radioButtonElement.setAttribute('type', 'radio');
            radioButtonElement.id = radioString + appId;
            radioButtonElement.addEventListener("change", appRadioHandler.bind(null, radioButtonElement, appElement));
            radioButtonElement.name = "SessionRadio";

            //custom radio button div
            customRadioButtonElement = document.createElement('div');
            customRadioButtonElement.setAttribute('class', 'radioOuterCircle');
            customRadioButtonElement.addEventListener("click", appRadioHandler.bind(null, radioButtonElement, appElement));

            //custom radio button inner div
            customRadioInnerCircle = document.createElement('div');
            customRadioInnerCircle.setAttribute('class', 'radioInnerCircle');

            //label for radio button
            label = document.createElement('label');
            label.id = radioLabelString + appId;
            label.setAttribute('for', radioButtonElement.id);
            label.setAttribute('class', 'labelApp');
            label.textContent = appName;

            customRadioButtonElement.appendChild(customRadioInnerCircle);
            appElement.appendChild(radioButtonElement);

            //add radioButtonDiv only after radioButtonElement
            appElement.appendChild(customRadioButtonElement);
            appElement.appendChild(label);
            appElement.addEventListener("click", appRadioHandler.bind(null, radioButtonElement, appElement));

            parent.appendChild(appElement);
            //return appElement;
        };

        var appRadioHandler = function (radioButtonElement, parentDivElement, event) {
            event.stopPropagation();
            var curElement = null;
            if (radioButtonElement) {
                radioButtonElement.checked = true;
                curElement = radioButtonElement;
            }
            if (curElement.checked) {
                disableSessionButtons();
                enableAppButtons();
                parentDivElement.className += " selectedElement";
                if (previousSelectedItem == null) {
                    previousSelectedItem = parentDivElement;
                } else {
                    var className = previousSelectedItem.className;
                    className = className.replace(" selectedElement", "");
                    previousSelectedItem.className = className;
                    previousSelectedItem = parentDivElement;
                }
            }
        };

        var sessionRadioHandler = function (radioButtonElement, parentDivElement, event) {
            var curElement = null;
            if (radioButtonElement) {
                radioButtonElement.checked = true;
                curElement = radioButtonElement;
            }
            if (curElement.checked) {
                disableAppButtons();
                enableSessionButtons(parentDivElement);
                parentDivElement.className += " selectedElement";
                if (previousSelectedItem == null) {
                    previousSelectedItem = parentDivElement;
                } else {
                    var className = previousSelectedItem.className;
                    className = className.replace(" selectedElement", "");
                    previousSelectedItem.className = className;
                    previousSelectedItem = parentDivElement;
                }
            }
        };

        var ctrlAltDelClickHandler = function () {
            var radioGroup = document.getElementsByName('SessionRadio');
            var radioElement = null;
            var sessionId = null;
            for (var i = 0; i < radioGroup.length; i++) {
                if (radioGroup[i].checked) {
                    radioElement = radioGroup[i];
                    sessionId = radioElement.parentElement.id;
                    sessionId = sessionId.split(sessionEntryTitleString);
                    sessionId = sessionId[1];
                    var ctrlAltDelMsg = {
                        window_info: {
                            sessionId: sessionId
                        },
                        cmd: "action",
                        action: "ctrlaltdel"
                    };
                    if (sessionSnapshot[sessionId].sessionCall)
                        sessionSnapshot[sessionId].sessionCall(ctrlAltDelMsg);
                }
            }
        };

        var disconnectClickHandler = function () {
            var radioGroup = document.getElementsByName('SessionRadio');
            var radioElement = null;
            var sessionId = null;
            for (var i = 0; i < radioGroup.length; i++) {
                if (radioGroup[i].checked) {
                    radioElement = radioGroup[i];
                    sessionId = radioElement.parentElement.id;
                    sessionId = sessionId.split(sessionEntryTitleString);
                    sessionId = sessionId[1];
                    var disconnectMsg = {
                        window_info: {
                            sessionId: sessionId
                        },
                        cmd: "action",
                        action: "disconnect"
                    };
                    if (sessionSnapshot[sessionId].sessionCall)
                        sessionSnapshot[sessionId].sessionCall(disconnectMsg);
                }
            }
        };

        var logoffClickHandler = function () {
            var radioGroup = document.getElementsByName('SessionRadio');
            var radioElement = null;
            var sessionId = null;
            for (var i = 0; i < radioGroup.length; i++) {
                if (radioGroup[i].checked) {
                    radioElement = radioGroup[i];
                    sessionId = radioElement.parentElement.id;
                    sessionId = sessionId.split(sessionEntryTitleString);
                    sessionId = sessionId[1];
                    var logoffMsg = {
                        window_info: {
                            sessionId: sessionId
                        },
                        cmd: "action",
                        action: "logoff"
                    };
                    if (sessionSnapshot[sessionId].sessionCall)
                        sessionSnapshot[sessionId].sessionCall(logoffMsg);
                }
            }
        };

        var devicesClickHandler = function () {
            var radioGroup = document.getElementsByName('SessionRadio');
            var radioElement = null;
            var sessionId = null;
            for (var i = 0; i < radioGroup.length; i++) {
                if (radioGroup[i].checked) {
                    radioElement = radioGroup[i];
                    sessionId = radioElement.parentElement.id;
                    sessionId = sessionId.split(sessionEntryTitleString);
                    sessionId = sessionId[1];
                    var devices = {
                        window_info: {
                            sessionId: sessionId
                        },
                        cmd: "action",
                        action: "devices"
                    };
                    if (sessionSnapshot[sessionId].sessionCall)
                        sessionSnapshot[sessionId].sessionCall(devices);
                }
            }
        }

        var terminateClickHandler = function () {
            var radioGroup = document.getElementsByName('SessionRadio');
            var sessionId = null;
            var appId = null;
            var sessionElement = null;
            var appElement = null;
            for (var i = 0; i < radioGroup.length; i++) {
                if (radioGroup[i].checked) {
                    appElement = radioGroup[i].parentElement;
                    appId = appElement.id;
                    appId = appId.split(appEntryTitleString);
                    appId = appId[1];
                    sessionElement = appElement.parentElement;
                    sessionId = sessionElement.id;
                    sessionId = sessionId.split(sessionEntryTitleString);
                    sessionId = sessionId[1];
                    var terminateMsg = {
                        window_info: {
                            sessionId: sessionId,
                            appId: appId
                        },
                        cmd: "action",
                        action: "terminate"
                    };
                    if (sessionSnapshot[sessionId].sessionCall)
                        sessionSnapshot[sessionId].sessionCall(terminateMsg);
                }
            }
        };

        return {
            initialize: initialize
        };
    })();
    UiControls.ConnectionCenter = ConnectionCenter;
})(UiControls || (UiControls = {}));

window.addEventListener("DOMContentLoaded", function (e) {
	document.title = chrome.i18n.getMessage('connection_center_title');
    chrome.runtime.getBackgroundPage(function (backgroundPage) {
        UiControls.ConnectionCenter.initialize(backgroundPage);
    });
});