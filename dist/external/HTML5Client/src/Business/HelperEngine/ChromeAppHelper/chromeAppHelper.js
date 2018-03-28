function ChromeAppHelper() {
	var config;
	var clipHelper = null;
	var myself = this;
	this.initEngine = function(dataObj, engineConfig) {
		if (engineConfig['features']['seamlessclip'] === true) {
			clipHelper = new chromeClipHelper(myself);
			clipHelper.start();
		}
		
	};
	this.processCmd = function(dataObj) {
		if (dataObj['source'] === DRIVERID.ID_RECEIVER_MANAGER) {
			handleRcvManagerCmd(dataObj);
		}
	};

	function handleRcvManagerCmd(dataObj) {
		if (dataObj['cmd'] === WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONW2C || dataObj['cmd'] === WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTW2C || dataObj['cmd'] === WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEW2C) {
			clipHelper.processCmd(dataObj);
		}
	}

	this.closeConnection = function() {
		if(clipHelper){
			clipHelper.close( );
		}
	};
	function chromeClipHelper(callback1) {
		var myself = this;
		var clipEnable = false;
		var timestamp = HTML5Interface.timeStamp();
		var CLIPBOARD_THREAD_WAIT = 600;
		var lockupdate = false;
		var lastCopiedData = {}; // data shared with local OS.
		var lastcopiedTime = -1;
		var currentServerUpdate = null;
		var currentclip = { // data received from server.
			'formatArray' : null,
			'len' : -1,
			'timestamp' : -1,
			'currentDataArray' : null,
			'formatname' : null,
			'pendingFormats' : 0
		};
		var rcvManagerPort = null;
		var callback = callback1;
		var storedText = null; // text data received from server.
		var storedHTMLText = null; // html data received from server.
		// This should be dynamically Generated, Either from Config.
		// Note: Always Keep text as the first format else if any other format after text is disabled
		// on VDA, it would cause the entire clipboard to fail
		var supportedFormats = new Array(ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT, ClipFormatConverter.FORMAT_PRIVATE);
		var addClipboardListener, restartTimer;
		function onMessageFromReceiverManager(event) {
			callback.processCmd(event.data);
		}


		this.start = function() {
			var rcvMgrWrPAth = createWorkerPath(THREADID.RECEIVER_MANAGER);
			var rcvManagerThread = new SharedWorker(rcvMgrWrPAth);
			rcvManagerPort = rcvManagerThread.port;
			rcvManagerThread.onerror = function(error) {
				console.log("error in receiver Manager initialization");
			};
			rcvManagerPort.addEventListener('message', onMessageFromReceiverManager);
			rcvManagerPort.start();
			myself.sendClipDataToSeamless({
				'cmd' : WorkerCommand.REGISTER_AS_NEW_INSTANCE
			});
			myself.sendClipDataToSeamless({
				'cmd' : WorkerCommand.REGISTER_CLIPBOARD
			});
			myself.sendClipDataToSeamless({
				'cmd' : WorkerCommand.SEAMLESS_CLIPBOARD_INIT
			});
			clipEnable = true;
			addClipboardListener();
			document.oncopy = onCopy;
			//document.onpaste = onPaste;
		};
		this.close = function( ){
			clipEnable = false;
			this.sendClipDataToSeamless({
				'cmd' : WorkerCommand.CMD_CLOSECURRENTTAB,
				'reason' : null
			});
		};

		/*
		 * This function checked system clip board after every 1000 milisecond
		 * This would be obselete if the new API is available. So renaming it to addClipboardListenerTimer
		 */

		function addClipboardListenerTimer() {
		
			if(lockupdate === false){
				document.execCommand("Paste");
			}
			setTimeout(function() {
				if(clipEnable === true){
					addClipboardListener();
				}
			}, CLIPBOARD_THREAD_WAIT);
		}

		/*
		 * This would override the existing functionaliy in the presence of new API.
		 * Else it would keep using the old API.
		 */

        try{
            if(chrome.clipboard.onClipboardDataChanged){
				addClipboardListener = function(){
					chrome.clipboard.onClipboardDataChanged.addListener(function(e){
						document.execCommand("Paste");
					});
				};
				document.onpaste = onPaste;
				// Don't keep a restart timer, This is for Old Paste mechanism. Remove when removing onPasteOld.
				restartTimer = function(){};
            }
        }catch(e){
			console.log("Clipboard Data Changed API not available, going with legacy event");
			addClipboardListener = addClipboardListenerTimer;
			document.onpaste = onPasteOld;
			restartTimer = function(){
				setTimeout(function(){ document.execCommand("Paste");}, 50);
			}
        }

		/*
		 * IMPORTANT NOTE:	The new Clipboard Notification API does not have proper documentation.
		 * 					So At this point, either we are unaware of an implementation or there exists
		 * 					a possibility where the SetData API is not even implemented.
		 * 					Upon Availability Even the below needs to be modified.
		 */

		function onCopy(event){
			if(lastcopiedTime < currentServerUpdate){
				lastCopiedData["text/plain"] = storedText;
				lastCopiedData["text/html"] = storedHTMLText;
				console.log("Updating HTML Clipboard");
				event.clipboardData.setData('text/html', storedHTMLText);
				console.log("Updating plain Clipboard");
				event.clipboardData.setData('text/plain', storedText);
  				event.preventDefault();
  				lastcopiedTime = currentServerUpdate;
  				lockupdate = true;
				// We call paste here so that we can make lockupdate as false. We delay it so that clipboard is updated to OS fully also that we should not do it recursively.
				// Restart the timer. Remove this when onPasteOld is cleaned up in future.
				restartTimer();
  				
			} else {
				console.log("No change of data in onCopy handler as local OS has new data");
			}
		}

		/*
		 * With the availability of new Clipboard Notification API, there is a way to get the list of Available DataFormats.
		 * Hence we won't need to keep having a tab on the data formats supported. Hence we use the new PasteModel.
		 */
		function onPaste(event){
			//var clipData = event.clipboardData;
            if(lockupdate){
				// This means that the server has sent the data. Dont Update server again.
				// Set this lockupdate to false so when Local Clipboard Event is triggered,
				// the server Clipboard can be updated.
				lockupdate = false;
				return;
			}
			var formats = event.clipboardData.items;
			//var formatCount = 0;

			lastCopiedData["text/plain"] = lastCopiedData["text/html"] = "";
            var dataFormats = [];
            //console.log("Foramts are  : ", formats);
            for (var i = 0; i< formats.length;i++)
            {
                if (formats[i].kind == "string") {
                    dataFormats.push(new Promise(function(resolve, rejected) {
                        formats[i].getAsString(function(type, value) {
                            resolve({"type" : type, "value" : value});
                        }.bind(null, formats[i].type));
                    }));
                }
            }
            Promise.all(dataFormats).then(function(data){
                for(var i=0;i<data.length;i++){
                    if(data[i].type == "text/html")
                        data[i].value = ClipFormatConverter.sanitizeHtml(data[i].value);
                    lastCopiedData[data[i].type] = data[i].value;
                }
                lockupdate = false;
                sendData();
            })
            .catch(function(reason){
                console.log("reason for failure is :", reason);
            });
			//	Keep doing this so that Copy is not broken.
			//	TODO: Remove if Copy also implements new API or Async methods.
			
		}

		// Renaming the Existing implementation to Provide scope for new.
		function onPasteOld(event){
			var clipTextData = event.clipboardData.getData('text/plain');
            var clipHTMLData = event.clipboardData.getData('text/html');
			if (clipHTMLData != "") {
				// remove extra chars, script tags etc, see santizeHtml function comments to know more.
				clipHTMLData = ClipFormatConverter.sanitizeHtml(clipHTMLData);
			}
			if(clipTextData != lastCopiedData["text/plain"] || clipHTMLData != lastCopiedData["text/html"]){
				console.log("New update from local OS clipboard");
				lastCopiedData["text/plain"] = clipTextData;
				lastCopiedData["text/html"] = clipHTMLData;
				lastcopiedTime = timestamp();
				sendData();
				lockupdate = false;
			}else if(lastcopiedTime < currentServerUpdate){
				// If we have new data we would have called copy
				console.log("We have a new data from server but copy did not finish yet!");
			}else{
                //console.log("No change in clip data");
				lockupdate = false;
			}
		}

		function sendData() {
            currentclip['currentDataArray'] = [];
            currentclip['formatArray']      = [];
            currentclip['formatname']       = [];
			currentclip['timestamp']        = timestamp();
			currentclip['len']				= 0;
            for(var i=0; i< supportedFormats.length; i++){
                if(supportedFormats[i] === ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT){
                    console.trace("Adding Text Data");
                    currentclip['formatname'][currentclip['len']] = "";
                    currentclip['formatArray'][currentclip['len']]= supportedFormats[i];//[ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT];
                    currentclip['currentDataArray'][currentclip['len']] = ClipFormatConverter.convertData(ClipFormatConverter.replaceslashRtoslashRN(lastCopiedData["text/plain"]), ClipFormatConverter.FORMAT_STRING, ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT);
					currentclip['len'] +=1;
                } else if(supportedFormats[i] === ClipFormatConverter.FORMAT_PRIVATE && lastCopiedData["text/html"] != "" ){
                    console.trace("Adding HTML data");
                    currentclip['formatArray'][currentclip['len']] = supportedFormats[i];//[ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT];
                    currentclip['formatname'][currentclip['len']] = ClipFormatConverter.FORMAT_NAME_HTML;
                    currentclip['currentDataArray'][currentclip['len']] = ClipFormatConverter.convertData(lastCopiedData["text/html"], ClipFormatConverter.FORMAT_NAME_HTML, ClipFormatConverter.FORMAT_STRING );
					currentclip['len'] +=1;
                }
            }
            currentclip['pendingFormats'] = 0; // all data ready
            sendNotification();
        }
		function sendNotification() {
			var dataObj = {};
			dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONC2W;
			dataObj['formatarr'] = currentclip['formatArray'];
			dataObj['timestamp'] = currentclip['timestamp'];
			dataObj['len'] = currentclip['len'];
			dataObj['formatname'] = currentclip['formatname'];
			myself.sendClipDataToSeamless(dataObj);
		}


		this.sendClipDataToSeamless = function(dataObj) {
			dataObj['source'] = DRIVERID.ID_SESSION_MANAGER;
			dataObj['destination'] = DRIVERID.ID_RECEIVER_MANAGER;
			rcvManagerPort.postMessage(dataObj);
		};
		this.processCmd = function(dataObj) {
			if (dataObj['cmd'] === WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONW2C) {
				handleNotification(dataObj);
			} else if (dataObj['cmd'] === WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTW2C) {
				handleRequestPacket(dataObj);
			} else if (dataObj['cmd'] === WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEW2C) {
				handleResponsePacket(dataObj);
			}
		};
		function handleResponsePacket(dataObj) {
			if (dataObj['timestamp'] === currentclip['timestamp']) {
				var index = findFormatIndex(dataObj['format'], dataObj['formatname']);
				if(index >= 0){
					currentclip['currentDataArray'][index] = dataObj['data'];
					if (dataObj['format'] === ClipFormatConverter.FORMAT_PRIVATE && dataObj['formatname'] === ClipFormatConverter.FORMAT_NAME_HTML) {
						if(_CEIP){
							_CEIP.add('clipboard:HTMLFormatEnabled',true);
						}
						console.log("received HTML Format data");
						storedHTMLText = ClipFormatConverter.convertData(dataObj['data'], ClipFormatConverter.FORMAT_STRING, ClipFormatConverter.FORMAT_NAME_HTML);
						currentclip['pendingFormats']--; // decrement now that we received a response
						updateLocalClipboard(currentclip['timestamp']);
					} else if (dataObj['format'] === ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT) {
						console.log("received text data");
						storedText = ClipFormatConverter.replaceslashRNtoslashN(ClipFormatConverter.convertData(dataObj['data'],
							ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT, ClipFormatConverter.FORMAT_STRING));
						currentclip['pendingFormats']--; // decrement now that we received a response
						updateLocalClipboard(currentclip['timestamp']);
					}
				}
			}
		}

		function handleRequestPacket(dataObj) {
			if (dataObj['timestamp'] === currentclip['timestamp']) {
				var index = findFormatIndex(dataObj['format'], dataObj['formatname']);
				if (index >= 0) {
					if (currentclip['currentDataArray'][index]) {
						var dataObj1 = {};
						dataObj1['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEC2W;
						dataObj1['data'] = currentclip['currentDataArray'][index];
						dataObj1['format'] = dataObj['format'];
						dataObj1['formatname'] = dataObj['formatname'];
						dataObj1['failure'] = false;
						dataObj1['timestamp'] = currentclip['timestamp'];
						myself.sendClipDataToSeamless(dataObj1);
					}
				}
			} else {
					// Do Nothing as of now.
			}
		};
		function handleNotification(dataObj) {
			if (dataObj['timestamp'] > currentclip['timestamp']) {
				currentclip['formatArray'] = dataObj['formatarr'];
				currentclip['len'] = dataObj['len'];
				currentclip['timestamp'] = dataObj['timestamp'];
				currentclip['currentDataArray'] = new Array(currentclip['len']);
				currentclip['formatname'] = dataObj['formatname'];
				requestData();
			}
		}

		function requestData() {
			currentclip["pendingFormats"] = 0; // reset pending formats
			var currentFormatIndex = -1;
			for (var i = 0; i < supportedFormats.length ; i++) {
				var idx = findFormatIndex(supportedFormats[i]);
				if (idx >= 0){
					var dataObj = {};
					currentclip["pendingFormats"]++;
					currentFormatIndex = idx;
					dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTC2W;
					dataObj['format'] = currentclip['formatArray'][idx];
					dataObj['formatname'] = currentclip['formatname'][idx];
					dataObj['timestamp'] = currentclip['timestamp'];
					myself.sendClipDataToSeamless(dataObj);
				}
			}
			
			// We understand text and html only now. TODO: read this from some config
			if (currentclip["pendingFormats"] == 0) {
				// No format understood, empty the local clipboard.
				updateLocalClipboard("", currentclip['timestamp']);
			} else if (currentclip["pendingFormats"] == 1 && currentclip['formatArray'][currentFormatIndex] == ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT) {
				// only text, set empty html
				storedHTMLText = "";
			} else if (currentclip["pendingFormats"] == 1 && currentclip['formatname'][currentFormatIndex] == ClipFormatConverter.FORMAT_NAME_HTML) {
				// only html, set empty text
				storedText = "";
			}
		}
		
		function updateLocalClipboard(timestamp) {
			// wait for all formats to finish before updating locally.
			if (currentclip['pendingFormats'] == 0) {
				currentServerUpdate = timestamp;
				document.execCommand("Copy");
			}
		}

		function findFormatIndex(formatId, formatname) {
			if (formatId == ClipFormatConverter.FORMAT_PRIVATE) {
				return currentclip['formatname'].indexOf(ClipFormatConverter.FORMAT_NAME_HTML);
			} else {
                return currentclip['formatArray'].indexOf(formatId);
			}
		}
	}

}
