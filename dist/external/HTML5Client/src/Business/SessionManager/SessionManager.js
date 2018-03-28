function SessionManager(callback1) {
	var CMD_UPDATE_MAINWINDOW = 0;
	var callback = callback1;
	var windowList = new Array(0);
	var windowListLength = 0;
	var mySelf = this;
	var sessionKey = null;
	var seamlessEnable = false;
	var sessionsharing = false;
	var seamlessClipboard = false;
	var seamlessusb = false;
	var mainWindow = null;
	var launchApp = new Array(0);
	var initialize = {};
	initialize["ICA"] = false;
	initialize['CTXCTL '] = false;
	initialize['CTXCLIP'] = false;
	initialize['CTXGUSB'] = false;
	var fullinitialize = false;
	var isNewConnection = false;
	var rcvMessageInstance = null;
	var idGenerator = 0;
	var portArray = new Array(0);
	function getNextId() {
		return idGenerator++;
	}


	this.processCommand = function(dataObj, windowInstance) {
		writeHTML5Log(0, "SESSION:|:SESSION MANAGER:|:START:|:command =" + dataObj['cmd']);
		if (dataObj['strcmd']) {
			dataObj = convertStringtoCommand(dataObj);
		}
		if (dataObj['source'] === DRIVERID.ID_UI) {
			handleUICommand(dataObj, windowInstance);
		} else if (dataObj['source'] === DRIVERID.ID_CLIPBOARD) {
			handleClipBoardCommand(dataObj, windowInstance);
		}else if(dataObj['source']===DRIVERID.ID_USB){
		  handleUSBCommand(dataObj, windowInstance);
		} else if (dataObj['source'] === DRIVERID.ID_RECEIVER_MANAGER) {
			handleReceiverMgrCmd(dataObj, windowInstance);
		}
		writeHTML5Log(0, "SESSION:|:SESSION MANAGER:|:END:|:command =" + dataObj['cmd']);
	};
	this.removeEntry = function(winInstance) {
		winInstance.closeConnection();
		var j = 0;
		for (var i = 0; i < windowListLength; i++) {
			if (windowList[i].idIndex === winInstance.idIndex) {
				windowList[i] = null;
			} else {
				windowList[j] = windowList[i];
				j++;
			}
		}
		windowListLength = j;
		var closeworker = true;
		for (var i = 0; i < windowListLength; i++) {
			if (windowList[i].type === "session") {
				closeworker = false;
				break;
			}
		}
		if (closeworker == true) {
			for (var i = 0; i < windowListLength; i++) {
				windowList[i].closeConnection();
			}
			for (var i = 0; i < portArray.length; i++) {
				if (portArray[i] && portArray[i].postMessage) {
					portArray[i].postMessage({
						'cmd' : WorkerCommand.CMD_CLOSECURRENTTAB,
						'reason' : null
					});
				}
			}
			closeSharedWorker();
		}
	};
	this.sendClipMsgToUI = function(dataObj, winInstance , exceptSource) {
		for (var i = 0; i < windowListLength; i++) {
			if (windowList[i].uiClip === true && ((exceptSource === true && winInstance.idIndex !== windowList[i].idIndex) || ( exceptSource === false))) {
				windowList[i].sendUIMessage(dataObj);
			}
		}
	};
	this.sendUSBMsgToUI = function(dataObj, winInstance , exceptSource){
	  for (var i = 0; i < windowListLength; i++) {
			if (windowList[i].uiUsb === true && ((exceptSource === true && winInstance.idIndex !== windowList[i].idIndex) || ( exceptSource === false))) {
				windowList[i].sendUIMessage(dataObj);
			}
		}
	};
	this.sendClipMsgToSourceUI = function(dataObj, winInstance) {
		if (winInstance.uiClip === true) {
			winInstance.sendUIMessage(dataObj);
		}
	};
		this.sendUSBMsgToSourceUI = function(dataObj, winInstance) {
		if (winInstance.uiUsb === true) {
			winInstance.sendUIMessage(dataObj);
		}
	};
	function handleReceiverMgrCmd(dataObj, windowInstance) {
		if (dataObj['cmd'] === WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONW2C || dataObj['cmd'] === WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTW2C || dataObj['cmd'] === WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEW2C) {
			callback.handleClipBoardCmd(dataObj, windowInstance);
		}else if (dataObj['cmd'] === WorkerCommand.SEAMLESS_USB_NOTIFICATIONW2C || dataObj['cmd'] === WorkerCommand.SEAMLESS_USB_LIST) {
			callback.handleUSBCmd(dataObj, windowInstance);
		}
	}

	function handleClipBoardCommand(dataObj, windowInstance) {
		callback.handleClipBoardCmd(dataObj, windowInstance);
	}
	
		function handleUSBCommand(dataObj, windowInstance) {
		callback.handleUSBCmd(dataObj, windowInstance);
	}


	function handleUICommand(dataObj, windowInstance) {
		if (dataObj['cmd'] === WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONU2C || dataObj['cmd'] === WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTU2C || dataObj['cmd'] === WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEU2C) {
			callback.handleClipBoardCmd(dataObj, windowInstance);
		} else if (dataObj['cmd'] === WorkerCommand.REGISTER_ENGINE) {
			if (initialize["CTXCLIP"] === false && dataObj['type'] === "CTXCLIP") {
				callback.setClipEngine(dataObj['port']);
				if (dataObj['isnew'] === true) {
					portArray[portArray.length] = dataObj['port'];
				}
				initialize["CTXCLIP"] = true;
			}
			if(initialize["CTXGUSB"] === false && dataObj['type'] === "CTXGUSB") {
				callback.setUsbEngine(dataObj['port']);
				if (dataObj['isnew'] === true) {
					portArray[portArray.length] = dataObj['port'];
				}
				initialize["CTXGUSB"] = true;
			}
			if (initialize["ICA"] == false && dataObj['type'] === "ICA") {
				callback.setIcaEngine(dataObj['port']);
				if (dataObj['isnew'] === true) {
					portArray[portArray.length] = dataObj['port'];
				}
				initialize["ICA"] = true;
			}
			if (initialize['CTXCTL '] === false && dataObj['type'] === "CTXCTL ") {
				callback.setCVCEngine(dataObj['port']);
				if (dataObj['isnew'] === true) {
					portArray[portArray.length] = dataObj['port'];
				}
				initialize['CTXCTL '] = true;
			}
			writeHTML5Log(0, "SESSION:|:SESSION MANAGER:|:WINDOW:|:SET_ENGINE" + dataObj['type']);
			checkforstart();
		}else if(dataObj['cmd'] === WorkerCommand.NOTIFY_FOR_CREATE_CHANNEL) {

           if( dataObj['port1'] == DRIVERID.ID_SESSION_MANAGER &&  dataObj['port2'] == DRIVERID.ID_RECEIVER_MANAGER && !rcvMessageInstance){
               windowInstance.sendUIMessage({
                   'cmd' : WorkerCommand.CREATE_CHANNEL,
                   'exist' : false,
                   'port1':DRIVERID.ID_SESSION_MANAGER,
                   'port2':DRIVERID.ID_RECEIVER_MANAGER
               });
           }
        }else if (dataObj['cmd'] === WorkerCommand.REGISTER_SESSION_PORT) {
			if (dataObj['otherport'] === DRIVERID.ID_RECEIVER_MANAGER && !rcvMessageInstance) {
				rcvMessageInstance = new WindowStruct( dataObj['byref'][0], mySelf, callback);
				windowList[windowListLength++] = rcvMessageInstance;
				callback.setrcvEngine( dataObj['byref'][0]);
				rcvMessageInstance.type = "messageport";
				rcvMessageInstance.idIndex = getNextId();
				rcvMessageInstance.destination = DRIVERID.ID_RECEIVER_MANAGER;
                rcvMessageInstance.sendToMessagePort({
                    'cmd' : WorkerCommand.REGISTER_AS_NEW_INSTANCE
                });
                rcvMessageInstance.sendToMessagePort({
                    'cmd' : WorkerCommand.REGISTER_CLIPBOARD
                });
                rcvMessageInstance.sendToMessagePort({
                    'cmd' : WorkerCommand.REGISTER_USB
                });

			}
		} else if (dataObj['cmd'] === WorkerCommand.REGISTER_SESININFO) {
			if (!sessionKey) {
				sessionKey = dataObj['sessionkey'];
				seamlessEnable = dataObj['seamlesswindow'];
				sessionsharing = dataObj['sessionsharing'];
				seamlessClipboard = dataObj['seamlessclip'];
				seamlessusb = dataObj['seamlessusb'];
				callback.resetClip(seamlessClipboard);
				callback.resetUSB(seamlessusb);
				for (var i = 0; i < windowListLength; i++) {
					var winInstance = windowList[i];
					if (winInstance && (winInstance.type === "session")) {
						winInstance.sessionkey = sessionKey;
					}
				}

			}
		} else if (dataObj['cmd'] === WorkerCommand.REGISTER_SESSION) {
			windowInstance.type = dataObj['type'];
		} else if (dataObj['cmd'] === WorkerCommand.SESSION_LAUNCH_APPLICATION) {
			writeHTML5Log(0, "SESSION:|:SESSION MANAGER:|:WINDOW:|:SESSION_LAUNCH_APPLICATION");
			if (!mainWindow) {
				updateInformation(CMD_UPDATE_MAINWINDOW);
			}
			if (seamlessEnable == false) {
				handleNonSeamlessUICmd(dataObj, windowInstance);
			}
		} else if (dataObj['cmd'] === WorkerCommand.CMD_CLOSECURRENTTAB) {
			writeHTML5Log(0, "SESSION:|:SESSION MANAGER:|:WINDOW:|:handleUICommand close window");
			mySelf.removeEntry(windowInstance);
		} else if (dataObj['cmd'] === WorkerCommand.CMD_ENABLE_UI_CLIP) {
			windowInstance.uiClip = true;
			clipHelper.processCommand(dataObj, windowInstance);
		}else if(dataObj['cmd'] === WorkerCommand.CMD_SET_RCV_MGR){
			callback.setrcvEngine(windowInstance.port);
		}else if(dataObj['cmd']===WorkerCommand.CMD_ENABLE_UI_USB){
		  windowInstance.uiUsb = true;
		  USBHelper.processCommand(dataObj,windowInstance);
		}
	}

	function updateInformation(cmd) {
		if (cmd === CMD_UPDATE_MAINWINDOW && mainWindow === null) {
			for (var i = 0; i < windowListLength; i++) {
				var winInstance = windowList[i];
				if (winInstance && (winInstance.type === "session")) {
					mainWindow = winInstance;
					mainWindow.isParent = true;
					break;
				}
			}
		}
	}

	function checkforstart() {
		var fullComplete = true;
		for (var key in initialize) {
			if (initialize.hasOwnProperty(key)) {
				if (initialize[key] == false) {
					fullComplete = false;
					break;
				}
			}
		}
		if (fullComplete == true) {
			fullinitialize = true;
			launchApplication();
		}
	}

	function convertStringtoCommand(dataObj) {
		var skey = dataObj['strcmd'];
		for (var key in skey) {
			if (skey.hasOwnProperty(key)) {
				dataObj[key] = STRING_TO_CMD[key][dataObj[key]];
			}
		}
		dataObj['strcmd'] = null;
		return dataObj;
	}

	function launchApplication(dataObj1) {
		if (fullinitialize === true) {
			var offset = 0;
			if (launchApp.length > 0) {
				var dataObj = launchApp[offset++];
				createNewConnection(dataObj);
				isNewConnection = true;

			}
			for (var i = offset; i < launchApp.length; i++) {
				launch_In_ConnectedSession(launchApp[i]);
			}

			launchApp = new Array(0);
			if (dataObj1) {
				if (isNewConnection == false) {
					createNewConnection(dataObj1);
					isNewConnection = true;
				} else {
					launch_In_ConnectedSession(dataObj1);
				}
			}

		} else {
			launchApp[launchApp.length] = dataObj;
		}
	}

	function createNewConnection(dataObj) {
		callback.sendIcaWrapperMessaage({
			'cmd' : WorkerCommand.SESSION_LAUNCH_APPLICATION,
			'icaData' : dataObj["icaData"],
			'browserType' : dataObj['browserType'],
			'secprotocol' : dataObj['secprotocol']
		});
		writeHTML5Log(0, "SESSION:|:SESSION MANAGER:|:NONSEAMLESS:|:ica connection with new connection");
	}

	function launch_In_ConnectedSession(dataObj) {
		callback.sendCVCWrapperMessaage({
			'cmd' : WorkerCommand.SESSION_LAUNCH_APPLICATION,
			'icaData' : dataObj["icaData"],
			'browserType' : dataObj['browserType'],
			'secprotocol' : dataObj['secprotocol']
		});
		writeHTML5Log(0, "SESSION:|:SESSION MANAGER:|:NONSEAMLESS:|:cmd line ica");
	}

	function handleNonSeamlessUICmd(dataObj, windowInstance) {
		if (dataObj['cmd'] === WorkerCommand.SESSION_LAUNCH_APPLICATION) {
			if (windowInstance.isParent === false) {
				if (windowInstance.type == "session") {
					mySelf.removeEntry(windowInstance);
				}
				writeHTML5Log(0, "SESSION:|:SESSION MANAGER:|:NONSEAMLESS:|:handleNonSeamlessUICmd close window");
			}else{
				if (windowInstance.type == "session") {
					windowInstance.sendUIMessage({cmd : WorkerCommand.NOTIFY_AS_MAIN_WINDOW});
				}
			}
			launchApplication(dataObj);
		}
	}

	function handleSeamlessUICmd() {

	}


	this.registerNewWindow = function(port, uiWrapper) {
		var windowInstance = new WindowStruct(port, mySelf, callback);
		windowList[windowListLength] = windowInstance;
		windowInstance.idIndex = getNextId();
		windowInstance.uiWrapper = uiWrapper;
		windowListLength++;
		return windowInstance;
	};
}

function WindowStruct(port, sessionMgr1, callback1) {
	this.port = port;
	this.idIndex = null;
	this.isParent = false;
	this.uiWrapper = null;
	this.type = "other";
	this.destination = DRIVERID.ID_UI;
	this.sessionkey = null;
	this.uiClip = false;
	this.uiUsb = false;
	var mySelf = this;
	var sessionMgr = sessionMgr1;
	var callback = callback1;
	function onMessage(event) {
		try {
			var data = event.data;
			if (data['cmd'] === WorkerCommand.REGISTER_ENGINE) {
				if (data['port'] === 'self') {
					data['port'] = mySelf.port;
					data['isnew'] = false;
				} else {
					data['port'] = event.ports[0];
					data['isnew'] = true;
				}
			}else if(data['cmd'] === WorkerCommand.REGISTER_SESSION_PORT) {
                data['byref'] = [event.ports[0]];
            }
			mySelf.processCommand(data);
		} catch(error) {
			writeHTML5Log(0, "SESSION:|:SESSION MANAGER:|:WINDOW:|:ERROR:|:error =" + error.message);
		}

	}

	/*
	 * This function is entry point for all data
	 * 1:-passing by worker/messagechannel( on event omMessage fn get called that call this function)
	 * 2:-In case of nonworker sessionManagerWrapper call it directly
	 */
	this.processCommand = function(dataObj) {
		sessionMgr.processCommand(dataObj, mySelf);
	};
	this.postMessage = function(dataObj, databyref) {
		if (databyref) {
			mySelf.port.postMessage(dataObj, databyref);
		} else {
			mySelf.port.postMessage(dataObj);
		}

	};
	this.sendUIMessage = function(dataObj) {
		dataObj['source'] = DRIVERID.ID_SESSION_MANAGER;
		dataObj['destination'] = DRIVERID.ID_UI;
		mySelf.uiWrapper.processOtherWrapperCmd(dataObj);
	};
	this.sendToMessagePort = function(dataObj) {
		dataObj['source'] = DRIVERID.ID_SESSION_MANAGER;
		dataObj['destination'] = mySelf.destination;
		mySelf.port.postMessage(dataObj);
	};
	this.sendMessage = this.postMessage;
	this.closeConnection = function() {
		if (mySelf.type === "session") {
			mySelf.sendUIMessage({
				'cmd' : WorkerCommand.CMD_CLOSECURRENTTAB,
				'reason' : null
			});
		} else if (mySelf.type === "messageport") {
			mySelf.sendToMessagePort({
				'cmd' : WorkerCommand.CMD_CLOSECURRENTTAB,
				'reason' : null
			});
		} else {
			mySelf.sendToMessagePort({
				'cmd' : "close",
				'reason' : null
			});
		}

		this.clearConnection();
	};
	this.clearConnection = function() {
		if (this.port.close) {
			this.port.onmessage = null;
			this.port.close();
		}
	};
	if (this.port.start) {
		this.port.onmessage = onMessage;
		this.port.start();
	}
}
