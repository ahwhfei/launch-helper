function ClipboardSeamlessManager(wmg) {
	var wmanager = wmg;
	var MAX_PENDING_REQUEST = 300;
	var currentclip = {
		'formatArray' : null,
		'len' : -1,
		'timestamp' : -1,
		'currentDataArray' : null,
		'wininstance' : null,
		'formatname' : null,
		'inProcessFormat':null
	};
	var UNPROCESS = 0;
	var PROCESSPENDING = 1;
	var PROCESSCOMPLETE = 2;
	var pendingRequest = new Uint16Array(MAX_PENDING_REQUEST);
	var pendingRequestsession = new Array(MAX_PENDING_REQUEST);
	var pendingRequestname = new Array(MAX_PENDING_REQUEST);
	var pendingRequestLen = 0;
	this.processNextCmd = function(dataObj, winInstance) {
		var cmd = dataObj['cmd'];
		if (cmd == WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONC2W) {
			handleNotification(dataObj, winInstance);
		} else if (cmd == WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTC2W) {
			handleRequestPacket(dataObj, winInstance);
		} else if (cmd == WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEC2W) {
			handleResponsePacket(dataObj, winInstance);
		} else if (cmd == WorkerCommand.SEAMLESS_CLIPBOARD_INIT) {
			handleInitCommand(winInstance);
		}
	};
	function handleInitCommand(winInstance) {
		if (currentclip['timestamp'] == -1) {
			return;
		}
		var dataObj = {};
		dataObj['formatarr'] = currentclip['formatArray'];
		dataObj['len'] = currentclip['len'];
		dataObj['timestamp'] = currentclip['timestamp'];
		dataObj['formatname'] = currentclip['formatname'];
		dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONW2C;
		wmanager.sendClipboardData(dataObj, winInstance, true);
	}

	function handleNotification(dataObj, winInstance) {
		if (currentclip['timestamp'] < dataObj['timestamp']) {
			pendingRequestLen = 0;
			currentclip['wininstance'] = winInstance;
			currentclip['formatArray'] = dataObj['formatarr'];
			currentclip['len'] = dataObj['len'];
			currentclip['timestamp'] = dataObj['timestamp'];
			currentclip['currentDataArray'] = new Array(currentclip['len']);
			currentclip['inProcessFormat'] = new Uint8Array(currentclip['len']);
			currentclip['formatname'] = dataObj['formatname'];
			dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONW2C;
			wmanager.sendClipboardData(dataObj, winInstance, false);
		} else {
			//just skip message
		}
	}

	function handleRequestPacket(dataObj, winInstance) {
		if (currentclip['timestamp'] == dataObj['timestamp']) {
			var index = findFormatIndex(dataObj['format'], dataObj['formatname']);
			if (index >= 0) {
				if (currentclip['currentDataArray'][index]) {
					sendResponseMessage(currentclip['currentDataArray'][index], dataObj['format'], dataObj['formatname'], winInstance);
				} else {
					pendingRequest[pendingRequestLen] = dataObj['format'];
					pendingRequestsession[pendingRequestLen] = winInstance;
					pendingRequestname[pendingRequestLen] = dataObj['formatname'];
					pendingRequestLen++;
					if(currentclip['inProcessFormat'][index] === UNPROCESS){
						currentclip['inProcessFormat'][index] = PROCESSPENDING;
						dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTW2C;
						wmanager.sendClipboardData(dataObj, currentclip['wininstance'], true);						
					}					
				}
			} else {
				//skip message as this format does not contain
			}
		} else {
			//skip message
		}
	}

	function handleResponsePacket(dataObj, winInstance) {
		if (currentclip['timestamp'] === dataObj['timestamp']) {
			var index = findFormatIndex(dataObj['format'], dataObj['formatname']);
			if (index >= 0) {
				currentclip['currentDataArray'][index] = dataObj['data'];
				currentclip['inProcessFormat'][index] = PROCESSCOMPLETE;
				var j = 0;
				for (var i = 0; i < pendingRequestLen; i++) {
					if (((pendingRequest[i] == dataObj['format']) && (dataObj['format'] != ClipFormatConverter.FORMAT_PRIVATE)) || ((pendingRequestname[i] == dataObj['formatname']) && (dataObj['format'] == ClipFormatConverter.FORMAT_PRIVATE))) {
						sendResponseMessage(dataObj['data'], dataObj['format'], dataObj['formatname'], pendingRequestsession[i]);
					} else {
						pendingRequest[j] = pendingRequest[i];
						pendingRequestsession[j] = pendingRequestsession[i];
						pendingRequestname[j] = pendingRequestname[i];
						j++;
					}
				}
				pendingRequestLen = j;
			}
		} else {
			//skip message
		}
	}

	function sendResponseMessage(data, format, formatname, winInstance) {
		var dataObj = {};
		dataObj['timestamp'] = currentclip['timestamp'];
		dataObj['format'] = format;
		dataObj['data'] = data;
		dataObj['formatname'] = formatname;
		dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEW2C;
		wmanager.sendClipboardData(dataObj, winInstance, true);
	}

	function findFormatIndex(formatId, formatname) {
		var rvalue = -1;
		if (formatId == ClipFormatConverter.FORMAT_PRIVATE) {
			for (var i = 0; i < currentclip['len']; i++) {
				if (formatname == currentclip['formatname'][i]) {
					return i;
				}
			}
		} else {
			for (var i = 0; i < currentclip['len']; i++) {
				if (formatId == currentclip['formatArray'][i]) {
					return i;
				}
			}
		}

		return rvalue;
	}

}
