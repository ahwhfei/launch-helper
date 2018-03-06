function ClipboardHelper(callback1) {
	var myself = this;
	var callback = callback1;
	var sessionMgr = null;
	this.clipstart = false;
	var currentClip = {
		'formatArray' : null,
		'len' : -1,
		'timestamp' : -1,
		'sessionkey' : -1,
		'windowid' : -1,
		'currentDataArray' : null,
		'source' : null,
		'formatname' : null,
		'inProcessFormat' : null
	};

	var currentRequest = {
		'pending' : false,
		'timestamp' : -1,
		'format' : 0,
		'formatname' : null,
	};

	var UNPROCESS = 0;
	var PROCESSPENDING = 1;
	var PROCESSCOMPLETE = 2;
	this.setSessionMgr = function(sessinmgr1) {
		sessionMgr = sessinmgr1;
	};
	this.processCommand = function(dataObj, winInstance) {
		var cmd = dataObj['cmd'];
		try {
			if (cmd === WorkerCommand.CMD_ENABLE_UI_CLIP) {
				if (myself.clipstart === false) {
					return;
				}
				var index = findFormatIndex(ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT, null);
				sessionMgr.sendClipMsgToSourceUI({
					'cmd' : WorkerCommand.CLIP_INIT,
					'data' : currentClip['currentDataArray'] && currentClip['currentDataArray'][index] ? currentClip['currentDataArray'][index] : null
				}, winInstance);
			} else if (cmd === WorkerCommand.CLIP_INIT) {
				myself.clipstart = true;
				callback.sendToClipMgr({
					'cmd' : WorkerCommand.SEAMLESS_CLIPBOARD_INIT
				});
				sessionMgr.sendClipMsgToUI({
					'cmd' : WorkerCommand.CLIP_INIT,
					'data' : null
				}, winInstance, false);
			} else if (cmd === WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONU2C || cmd === WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONH2C || cmd === WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONW2C) {
				console.log("helper notification " + cmd + "  " + dataObj['timestamp'] + "  " + dataObj['source']);
				handleNotificationPacket(dataObj, winInstance);
			} else if (cmd === WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTU2C || cmd === WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTW2C || cmd === WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTH2C) {
				console.log("helper request " + cmd + "  " + dataObj['timestamp'] + "  " + dataObj['source']);
				handleRequestPacket(dataObj);
			} else if (cmd === WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEU2C || cmd === WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEH2C || cmd === WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEW2C) {
				console.log("helper response " + cmd + "  " + dataObj['timestamp'] + "  " + dataObj['source']);
				handleResponsePacket(dataObj, winInstance);
			} else if (cmd === WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTNOTIFICATION) {
				if (currentClip['source'] !== DRIVERID.ID_CLIPBOARD) {
					notifyServer(currentClip['formatArray'], currentClip['timestamp'], currentClip['len'], currentClip['formatname']);
				}
			}
		} catch(error) {
			console.log("error is coming in helper*************************************");
		}
	};

	function handleResponsePacket(dataObj, winInstance) {
		if (currentClip['timestamp'] > dataObj['timestamp']) {
			if (dataObj['source'] === DRIVERID.ID_CLIPBOARD) {
				if (currentClip['source'] !== DRIVERID.ID_CLIPBOARD) {
					notifyServer(currentClip['formatArray'], currentClip['timestamp'], currentClip['len'], currentClip['formatname']);
				}
			}
		} else if (currentClip['timestamp'] == dataObj['timestamp']) {
			if (storeLocally(dataObj['format'], dataObj['formatname']) == true) {
				var index = findFormatIndex(dataObj['format'], dataObj['formatname']);
				currentClip['currentDataArray'][index] = dataObj['data'];
				currentClip['inProcessFormat'][index] = PROCESSCOMPLETE;
			}
			sendResponseToUI(dataObj, winInstance);
			if ((dataObj['source'] !== DRIVERID.ID_CLIPBOARD) && (currentRequest['format']===dataObj['format']) && (currentRequest['pending'] == true)) {
				sendResponse(dataObj['data'], dataObj['format'], dataObj['formatname'], dataObj['timestamp'], DRIVERID.ID_CLIPBOARD);
				currentRequest['pending'] = false;
			} else if (dataObj['source'] == DRIVERID.ID_CLIPBOARD) {
				sendResponse(dataObj['data'], dataObj['format'], dataObj['formatname'], dataObj['timestamp'], DRIVERID.ID_RECEIVER_MANAGER);
			}
		}

	}

	function sendResponseToUI(dataObj, winInstance) {
		var dataObj1 = {};
		dataObj1['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEC2U;
		dataObj1['format'] = dataObj['format'];
		dataObj1['formatname'] = dataObj['formatname'];
		dataObj1['data'] = dataObj['data'];
		dataObj1['timestamp'] = dataObj['timestamp'];
		if (uiSupportedFormat(dataObj['format'], dataObj['formatname']) === false) {
			return;
		}
		if (dataObj['source'] === DRIVERID.ID_UI) {
			sessionMgr.sendClipMsgToUI(dataObj1, winInstance, true);
		} else {
			sessionMgr.sendClipMsgToUI(dataObj1, winInstance, false);
		}
	}

	function uiSupportedFormat(formatId, formatName) {
		if (formatId == ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT || (formatId === ClipFormatConverter.FORMAT_PRIVATE && formatName === ClipFormatConverter.FORMAT_NAME_HTML)) {
			return true;
		}
		return false;
	}

	function handleNotificationPacket(dataObj, winInstance) {
		if (currentClip['timestamp'] < dataObj['timestamp']) {
			if (currentRequest['pending'] == true) {
				currentRequest['pending'] = false;
				if (dataObj['source'] != DRIVERID.ID_CLIPBOARD) {
					sendFailureMessage();
				}
			}
			changeCurrentClipData(dataObj, winInstance);
			if (dataObj['source'] == DRIVERID.ID_UI) {
				notifyServer(dataObj['formatarr'], dataObj['timestamp'], dataObj['len'], dataObj['formatname']);
				notifySeamlessClipManager(dataObj);
			} else if (dataObj['source'] == DRIVERID.ID_CLIPBOARD) {
				notifySeamlessClipManager(dataObj);
				notifyUI(dataObj, winInstance);
				requestDatawithnoDelay();
			} else if (dataObj['source'] == DRIVERID.ID_RECEIVER_MANAGER) {
				notifyServer(dataObj['formatarr'], dataObj['timestamp'], dataObj['len'], dataObj['formatname']);
				notifyUI(dataObj, winInstance);
				requestDatawithnoDelay();
			} else {
				console.log("error is coming**************************************");
			}
		} else if (currentClip['timestamp'] > dataObj['timestamp']) {
			if (dataObj['source'] === DRIVERID.ID_CLIPBOARD) {
				if (currentClip['source'] !== DRIVERID.ID_CLIPBOARD) 
					notifyServer(currentClip['formatArray'], currentClip['timestamp'], currentClip['len'], currentClip['formatname']);
			}
		} else {
			//it should not occur two copy paste should not happen at same time
		}

	}

	function requestDatawithnoDelay() {
		for (var i = 0; i < currentClip['len']; i++) {
			if ((noDelayFormat(currentClip['formatArray'][i], currentClip['formatname'][i]) == true)) {
				requestData(null, currentClip['formatArray'][i], currentClip['formatname'][i]);
			}
		}
	}

	function noDelayFormat(formatId, formatname) {
		if ( (formatId === ClipFormatConverter.FORMAT_PRIVATE && formatname === ClipFormatConverter.FORMAT_NAME_HTML) || (formatId == ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT)){
			return true;
		}
		//format id
		return false;
	}

	function storeLocally(formatId, formatname) {
		return true;
		// if (formatId == ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT) {
		// return true;
		// }
		// return false;
	}
	function handleRequestPacket(dataObj) {
		if (currentClip['timestamp'] > dataObj['timestamp']) {
			if (dataObj['source'] === DRIVERID.ID_CLIPBOARD) {
				sendFailureMessage();
				if (currentClip['source'] !== DRIVERID.ID_CLIPBOARD) 
				  notifyServer(currentClip['formatArray'], currentClip['timestamp'], currentClip['len'], currentClip['formatname']);
			}
		} else if (currentClip['timestamp'] == dataObj['timestamp']) {
			var index = findFormatIndex(dataObj['format'], dataObj['formatname']);
			if (index >= 0) {
				if (currentClip['currentDataArray'][index]) {
					sendResponse(currentClip['currentDataArray'][index], dataObj['format'], dataObj['formatname'], currentClip['timestamp'], dataObj['source']);
				} else {
					requestData(dataObj, dataObj['format'], dataObj['formatname']);
				}
			} else {
				if (dataObj['source'] === DRIVERID.ID_CLIPBOARD) {
					sendFailureMessage();
					if (currentClip['source'] !== DRIVERID.ID_CLIPBOARD) 
						notifyServer(currentClip['formatArray'], currentClip['timestamp'], currentClip['len'], currentClip['formatname']);
				}
			}

		} else {
			console.log("error happening in request data");
		}
	}

	function requestData(dataObj, format, formatname) {
		if (currentClip['source'] === DRIVERID.ID_CLIPBOARD) {
			requestdataFromServer(format, formatname);
		} else if (currentClip['source'] === DRIVERID.ID_RECEIVER_MANAGER) {
			if (dataObj && dataObj['source'] === DRIVERID.ID_CLIPBOARD) {
				changerequestData(dataObj);
			}
			requestdataSeamless(format, formatname);
		} else if (currentClip['source'] === DRIVERID.ID_UI) {
			//Do nothing as ui send data immediatly after sending notification command
		}
	}

	function requestdataFromServer(format, formatname) {
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTC2H;
		dataObj['format'] = format;
		dataObj['formatname'] = formatname;
		dataObj['timestamp'] = currentClip['timestamp'];
		var index = findFormatIndex(format, formatname);
		if (index >= 0 && (currentClip['inProcessFormat'][index] === UNPROCESS)) {
			callback.sendToClipboardEngine(dataObj);
			currentClip['inProcessFormat'][index] = PROCESSPENDING;
		}

	}

	function requestdataSeamless(format, formatname) {
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTC2W;
		dataObj['format'] = format;
		dataObj['formatname'] = formatname;
		dataObj['timestamp'] = currentClip['timestamp'];
		callback.sendToClipMgr(dataObj);
	}

	function skipMessage(dataObj) {
		//if("come from server then notify server with latest update");
	}

	function sendResponse(data, format, formatname, tstamp, destination) {
		var dataObj = {};
		dataObj['data'] = data;
		dataObj['format'] = format;
		dataObj['formatname'] = formatname;
		dataObj['failure'] = false;
		dataObj['timestamp'] = tstamp;
		if (destination === DRIVERID.ID_CLIPBOARD) {
			dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEC2H;
			callback.sendToClipboardEngine(dataObj);
		} else if (destination === DRIVERID.ID_RECEIVER_MANAGER) {
			dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEC2W;
			callback.sendToClipMgr(dataObj);
		}
	}

	function notifyServer(formatarr, timestamp, len, formatname) {
		var dataObj = {};
		currentRequest['pending'] = false;
		dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONC2H;
		dataObj['formatarr'] = formatarr;
		dataObj['timestamp'] = timestamp;
		dataObj['len'] = len;
		dataObj['formatname'] = formatname;
		callback.sendToClipboardEngine(dataObj);
	}

	function notifySeamlessClipManager(dataObj1) {
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONC2W;
		dataObj['formatarr'] = dataObj1['formatarr'];
		dataObj['timestamp'] = dataObj1['timestamp'];
		dataObj['len'] = dataObj1['len'];
		dataObj['formatname'] = dataObj1['formatname'];
		callback.sendToClipMgr(dataObj);
	}

	function notifyUI(dataObj, winInstance) {
		var supported = false;
		for (var i = 0; i < dataObj['len']; i++) {
			if (uiSupportedFormat(dataObj['formatarr'][i], dataObj['formatname'][i]) === true) {
				supported = true;
				break;
			}
		}
		if (supported === false) {
			var dataObj1 = {};
			dataObj1['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEC2U;
			dataObj1['failure'] = true;
			if (dataObj['source'] === DRIVERID.ID_UI) {
				sessionMgr.sendClipMsgToUI(dataObj1, winInstance, true);
			} else {
				sessionMgr.sendClipMsgToUI(dataObj1, winInstance, false);
			}
		}
	}

	function changerequestData(dataObj) {
		if (dataObj['source'] === DRIVERID.ID_CLIPBOARD) {
			currentRequest['format'] = dataObj['format'];
			currentRequest['pending'] = true;
			currentRequest['timestamp'] = dataObj['timestamp'];
			currentRequest['formatname'] = dataObj['formatname'];
		}

	}

	function changeCurrentClipData(dataObj, winInstance) {
		currentClip['formatArray'] = dataObj['formatarr'];
		currentClip['len'] = dataObj['len'];
		currentClip['timestamp'] = dataObj['timestamp'];
		currentClip['sessionkey'] = winInstance.sessionkey;
		currentClip['windowid'] = winInstance.idIndex;
		currentClip['source'] = dataObj['source'];
		currentClip['formatname'] = dataObj['formatname'];
		currentClip['currentDataArray'] = new Array(currentClip['len']);
		currentClip['inProcessFormat'] = new Uint8Array(currentClip['len']);
	}

	function sendFailureMessage() {
		currentRequest['pending'] = false;
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEC2H;
		dataObj['format'] = currentRequest['format'];
		dataObj['formatname'] = currentRequest['formatname'];
		dataObj['data'] = null;
		dataObj['timestamp'] = currentRequest['timestamp'];
		dataObj['failure'] = true;
		callback.sendToClipboardEngine(dataObj);
	}

	function findFormatIndex(formatId, formatname) {
		var rvalue = -1;
		if (formatId == ClipFormatConverter.FORMAT_PRIVATE) {
			for (var i = 0; i < currentClip['len']; i++) {
				if (formatname == currentClip['formatname'][i]) {
					return i;
				}
			}
		} else {
			for (var i = 0; i < currentClip['len']; i++) {
				if (formatId == currentClip['formatArray'][i]) {
					return i;
				}
			}
		}

		return rvalue;
	}

	function sendToUI(dataObj, winInstance) {

	};
}
