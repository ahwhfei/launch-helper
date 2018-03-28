var CEIPObj = (function () {
	var dataObj;
	var prevTimeStamp;
	window['indexedDB'] = window['indexedDB'] || window['mozIndexedDB'] || window['webkitIndexedDB'] || window['msIndexedDB'];
	window['IDBTransaction'] = window['IDBTransaction'] || window['webkitIDBTransaction'] || window['msIDBTransaction'];
	window['IDBKeyRange'] = window['IDBKeyRange'] || window['webkitIDBKeyRange'] || window['msIDBKeyRange'];
	var DBOpenRequest;
	var db;
	var dbName = "CitrixDatabase";
	var tableName = "CEIP";
	var transaction;
	var clientID;
	var timeStampToDayConstant = 24 * 60 * 60 * 1000;
	var canAdd = false;
	var bufferArray = [];
	var getFailed;
	var config;
	var isCEIPEnabled = true;

	function get(key) {
		var returnValue = -1;
		var data;
		if (key === undefined) {
			returnValue = 0;
		} else if (key === "*") {
			returnValue = 1;
			data = dataObj;
		} else if (dataObj && (dataObj[key] !== undefined)) {
			returnValue = 1;
			data = dataObj[key];
		} else if (dataObj) {
			var keys = key.split(':');
			var dataReference = dataObj[keys[0]];
			data = dataReference;
			if (typeof dataReference != 'undefined') {
				for (var i = 1; i < keys.length; i++) {
					if (typeof dataReference[keys[i]] !== 'undefined') {
						data = dataReference[keys[i]];
						returnValue = 1;
						dataReference = data;
					}
				}
			} else {
				//Invalid get called
				returnValue = -2;
			}
		}
		return {
			data: data,
			returnValue: returnValue
		};
	}

	function deleteEntry(id) {
		makeDbTransaction();
		var deleteRequest = objectStore['delete'](id);
		deleteRequest.onsuccess = function (e) {
			console.log('[CEIP] deleteEntry: entry deleted successfully', id);
		}
		deleteRequest.onerror = function (e) {
			console.log('[CEIP] deleteEntry error', e);
		}
	}

	function add(key, data, callback) {
		if (!canAdd) {
			bufferArray.push({
				'key': key,
				'value': data
			});
			return 1;
		}
		if (key === undefined) {
			return 0; //TODO throw exception
		}
		if (key != -1) {
			var keys = key.split(':');
			key = keys[0];
			var index = keys[0];
			var dataReference = dataObj;
			for (var i = 0; i < keys.length - 1; i++) {
				if (dataReference[index]) {
					dataReference = dataReference[index];
					index = keys[i + 1];
				} else {
					//Invalid add called
					return -2;
				}
			}
			if (dataReference[index] == undefined && data == undefined) {
				return -2;
			} else {
				if (dataReference[index] === data) {
					return 0;
				}
				dataReference[index] = data;
			}
		}
		var entryID = isCEIPEnabled ? CEIPObj.Constants.ceipEntry : CEIPObj.Constants.ceipDisabled;
		addToDB(entryID, dataObj, callback);
		return 1;
	}

	function addCounter(key, value) {
		if (getFailed == true) {
			bufferArray.push({
				'key': key,
				'value': "GETFAILED"
			});
			getFailed = false;
		}
	}

	function incrementCounter(key, callback) {
		var result = get(key);
		if (result.returnValue == -1) {
			getFailed = true;
			addCounter(key);
		} else if (result.returnValue == -2) {
			return 0;
			//Invalid datapoint
		} else {
			add(key, parseInt(result.data) + 1, callback);
		}
	}

	function addToDB(id, data, callback) {
		makeDbTransaction();
		var getRequest = objectStore.get(id);

		getRequest.onsuccess = function (e) {
			makeDbTransaction();
			var putRequest = objectStore.put(data);
			putRequest.onsuccess = function (e) {
				if (callback) {
					callback();
				}
			}
			putRequest.onerror = function (e) {
				console.log('[CEIP] addToDB:putRequest.onerror ', e);
			}
		}
		getRequest.onerror = function (e) {
			console.log('[CEIP] addToDB:getRequest.onerror ', e);
		}
	}

	function makeDbTransaction() {
		transaction = db.transaction(["CEIP"], "readwrite");
		transaction.oncomplete = function (e) {
			//console.log('[CEIP] makeDbTransaction ', e);
		};

		transaction.onerror = function (e) {
			console.log('[CEIP] makeDbTransaction error', e);
		};
		objectStore = transaction.objectStore("CEIP");
	}

	function init(sendData, configObj, callback) {
		if (configObj) {
			config = configObj;
		} else {
			config = HTML5_CONFIG;
		}
		//IF chrome app, have to get the stored value.
		if (typeof chrome != 'undefined' && chrome && chrome.storage && chrome.storage.local && chrome.storage.local.get) {
			chrome.storage.local.get('ceipEnabled', function (result) {
				if (typeof result['ceipEnabled'] != 'undefined') {
					config['ceip']['enabled'] = result['ceipEnabled'];
				}
				initDB(sendData, callback);
			});
		} else {
			initDB(sendData, callback);
		}
	}

	function initDB(sendData, callback) {
		if (config && config['ceip'] && typeof config['ceip']['enabled'] != 'undefined') {
			isCEIPEnabled = config['ceip']['enabled'];
		}
		DBOpenRequest = window['indexedDB'].open(dbName);
		DBOpenRequest['onerror'] = openRequestErrorHandler;
		DBOpenRequest['onsuccess'] = openRequestSuccess.bind(null, sendData, callback);
		DBOpenRequest['onupgradeneeded'] = openRequestUpgradeNeeded;
	}

	function getRandomArbitrary() {
		var min = 1;
		var max = 4294967296;
		return Math.floor(Math.random() * (max - min) + min);
	}

	function openRequestErrorHandler(event) {
		//TODO handle errors
	}

	function openRequestSuccess(sendData, callback, event) {
		var entryID = isCEIPEnabled ? CEIPObj.Constants.ceipEntry : CEIPObj.Constants.ceipDisabled;
		db = DBOpenRequest['result'];
		makeDbTransaction();
		var getRequest = objectStore.get(entryID);
		getRequest.onsuccess = function (e) {
			var result = getRequest.result;
			if (result === undefined) {
				//TODO check chrome or HTML5 or whether CEIP is disabled
				if (isCEIPEnabled) {
					if (g && g.environment && g.environment.receiver && g.environment.receiver.isChromeApp == false) {
						dataObj = JSON.parse(JSON.stringify(CEIPObj.Constants.HTML5));
					} else {
						dataObj = JSON.parse(JSON.stringify(CEIPObj.Constants.Chrome));
					}
					deleteEntry(CEIPObj.Constants.ceipDisabled);
				} else {
					dataObj = JSON.parse(JSON.stringify(CEIPObj.Constants.Disabled));
					deleteEntry(CEIPObj.Constants.ceipEntry);
				}
				dataObj['clientId'] = getRandomArbitrary();
				if (isCEIPEnabled) {
					getStaticData();
				}
				add(-1, null, callback);
			} else {
				dataObj = result;
				if (isCEIPEnabled) {
					getStaticData();
					addNewDataPoints();
				}
			}
			canAdd = true;
			while (bufferArray.length) {
				var pair = bufferArray.pop();
				if (pair['value'] == "GETFAILED") {
					incrementCounter(pair['key'], callback);
				} else {
					add(pair['key'], pair['value'], callback)
				};
			}
			if (!sendData) {
				scheduler(callback);
			} else {
				send(null, sendData);
			}
		}
		getRequest.onerror = function (e) {
			console.log('[CEIP] openRequestSuccess:getRequest.onerror ', e);
		}
	}

	function openRequestUpgradeNeeded(event) {
		//TODO check what is this
		db = event.target.result;
		objectStore = db.createObjectStore(tableName, {
				'keyPath': "id",
				'autoIncrement': true
			});
	}

	function updateTimeStamp() {
		var curTimeStamp = Date.now();
		addToDB(CEIPObj.Constants.timeStamp, {
			'id': CEIPObj.Constants.timeStamp,
			'timeStamp': curTimeStamp
		});
	}

	function send(timeSpan, isChrome, callback) {
		updateTimeStamp();
		var entryID = isCEIPEnabled ? CEIPObj.Constants.ceipEntry : CEIPObj.Constants.ceipDisabled;
		db = DBOpenRequest['result'];
		makeDbTransaction();
		var getRequest = objectStore.get(entryID);
		getRequest.onsuccess = function (e) {
			var result = getRequest.result;
			if (typeof result != 'undefined') {
				sendDataToServer(result, isChrome, callback);
			}
		}
		getRequest.onerror = function (e) {
			console.log('[CEIP] error in getRequest ', e);
		}
		if (timeSpan) {
			setTimeout(send.bind(null, timeSpan), timeSpan);
		}
	}

	function sendDataToServer(data, isChrome, callback) {
		var http;
		if (dependency && dependency.testEnv === true) {
			http = XMLHttpRequest;
		} else {
			http = new XMLHttpRequest();
		}
		//http.withCredentials = true;

		http.addEventListener("readystatechange", function () {
			if (this.readyState === 4) {
				console.log(this.responseText);
			}
		});
		if (config && config['ceip'] && config['ceip']['url'] && config['ceip']['productKey']) {
			http.open("POST", config['ceip']['url']);
			http.setRequestHeader("authorization", config['ceip']['productKey']);
			http.setRequestHeader("content-type", "application/json");
			http.setRequestHeader("cache-control", "no-cache");
			http.setRequestHeader("accept", "application/json,text/html,application/xhtml+xml,application/xml");

			http.send(JSON.stringify(data));
		}
		console.log(data);
		resetData(isChrome, callback);
	}

	function resetData(isChrome, callback) {
		var clientID = dataObj['clientId'];
		dataObj = {};
		if (isCEIPEnabled) {
			deleteEntry(CEIPObj.Constants.ceipEntry);
			if (isChrome || g.environment.receiver.isChromeApp) {
				dataObj = JSON.parse(JSON.stringify(CEIPObj.Constants.Chrome));
			} else {
				dataObj = JSON.parse(JSON.stringify(CEIPObj.Constants.HTML5));
			}
		} else {
			deleteEntry(CEIPObj.Constants.ceipDisabled);
			dataObj = JSON.parse(JSON.stringify(CEIPObj.Constants.Disabled));
		}
		dataObj['clientId'] = clientID;
		if (isCEIPEnabled) {
			getStaticData();
		}
		add(-1);
		if (callback) {
			callback();
		}
	}

	function scheduler(callback) {
		if (g && g.environment && g.environment.receiver && g.environment.receiver.isChromeApp == false) {
			var canSend = false;
			var getRequest = objectStore.get(CEIPObj.Constants.timeStamp);
			getRequest.onsuccess = function (e) {
				prevTimeStamp = getRequest.result;
				if (prevTimeStamp === undefined) {
					prevTimeStamp = Date.now();
					addToDB(CEIPObj.Constants.timeStamp, {
						'id': CEIPObj.Constants.timeStamp,
						'timeStamp': prevTimeStamp
					});
				} else {
					prevTimeStamp = getRequest.result['timeStamp'];
					canSend = true;
				}
				checkForTimeOut(canSend, callback);
			}
			getRequest.onerror = function (e) {
				console.log('[CEIP] scheduler:getRequest.onerror ', e);
			}
		}
	}

	function checkForTimeOut(canSend, callback) {
		var timeSpan;
		if (config && config['ceip'] && config['ceip']['timeSpan']) {
			timeSpan = config['ceip']['timeSpan'];
		}
		if (timeSpan < 1 || timeSpan > 7 || timeSpan === undefined) {
			timeSpan = 7;
		}
		timeSpan *= timeStampToDayConstant;
		var curTimeStamp = Date.now();
		if (curTimeStamp > (prevTimeStamp + timeSpan) && canSend) {
			send(timeSpan, false, callback);
		} else {
			var remainingTime = timeSpan - (curTimeStamp - prevTimeStamp);
			setTimeout(send.bind(null, timeSpan), remainingTime);
		}
	}
	function addNewDataPoints(){
		var source = (g.environment.receiver.isChromeApp) ? CEIPObj.Constants.Chrome : CEIPObj.Constants.HTML5;
		for(var key in source){
			if (source.hasOwnProperty(key)) {
				if(dataObj[key]== undefined){					
					console.log(key);
					dataObj[key] = source[key];
				}
			}
		}
	}
	function getStaticData() { //http://stackoverflow.com/questions/9514179/how-to-find-the-operating-system-version-using-javascript
		//screen
		var screenSize = '';
		if (screen.width) {
			width = (screen.width) ? screen.width : '';
			height = (screen.height) ? screen.height : '';
			screenSize += '' + width + " x " + height;
		}
		var dpr = window['devicePixelRatio'];
		if (screenSize) {
			dataObj['screen']['displayResolution'] = screenSize;
		}
		if (dpr) {
			dataObj['screen']['dpr'] = dpr;
		}

		//browser
		if (g.environment) {
			if (g.environment.browser.name) {
				dataObj['browser']['name'] = g.environment.browser.name;
			}
			if (g.environment.browser.browserMajorVersion) {
				dataObj['browser']['major'] = g.environment.browser.browserMajorVersion;
			}
			if (g.environment.browser.browserVersion) {
				dataObj['browser']['version'] = g.environment.browser.browserVersion;
			}

			//OS
			if (g.environment.os.name) {
				dataObj['os']['name'] = g.environment.os.name;
			}
			if (g.environment.os.osVersion) {
				dataObj['os']['version'] = g.environment.os.osVersion;
			}

			//touch and mobile
			var touch = g.environment.os.isTouch;
			if (touch) {
				dataObj['touch'] = true;
			}
			var mobile = g.environment.os.isMobile;
			if (mobile && !g.environment.receiver.isChromeApp) {
				dataObj['mobile'] = true;
			}

			//language
			var preferredLanguage;
			if (navigator['languages']) {
				preferredLanguage = '';
				for (var i = 0; i < navigator['languages'].length; i++) {
					preferredLanguage += navigator['languages'][i] + ' ';
				}
			} else {
				preferredLanguage = navigator['language'] || navigator['userLanguage'];
			}
			preferredLanguage = (preferredLanguage).toLowerCase();
			dataObj['language']['browser'] = preferredLanguage;

			//Timezone
			var timezone = new Date().toString().match(/([A-Z]+[\+-][0-9]+.*)/)[1];
			if (timezone) {
				dataObj['timezone']['local'] = timezone;
			}
		}
	}

	function disable() {
		if (isCEIPEnabled == false) {
			return;
		}
		isCEIPEnabled = false;
		db = DBOpenRequest['result'];
		makeDbTransaction();
		var clientID = dataObj['clientId'];
		deleteEntry(CEIPObj.Constants.ceipEntry);
		dataObj = JSON.parse(JSON.stringify(CEIPObj.Constants.Disabled));
		dataObj['clientId'] = clientID;
		add(-1);
	}

	function enable() {
		if (isCEIPEnabled == true) {
			return;
		}
		isCEIPEnabled = true;
		db = DBOpenRequest['result'];
		makeDbTransaction();
		var clientID = dataObj['clientId'];
		deleteEntry(CEIPObj.Constants.ceipDisabled);
		dataObj = JSON.parse(JSON.stringify(CEIPObj.Constants.Chrome));
		dataObj['clientId'] = clientID;
		add(-1);
	}

	return {
		init: init,
		add: add,
		get: get,
		incrementCounter: incrementCounter,
		disable: disable,
		enable: enable
	};
})();
CEIPObj.Constants = {};
CEIPObj.Constants.ceipEntry = 1;
CEIPObj.Constants.ceipDisabled = 2;
CEIPObj.Constants.timeStamp = 3;

CEIPObj.Constants.Chrome = {
	"id": 1,
	"clientId": 0,
	"language": {
		"browser": "NA",
		"session": "NA"
	},
	"os": {
		"name": "NA", //Chromeapp in chrome / windows /linux /mac
		"version": "NA"
	}, //Chrome os version
	"browser": {
		"name": "NA", //Chromeapp in chrome / windows /linux /mac
		"version": "NA",
		"major": "NA"
	}, //Chrome os version
	"receiverVersion": "NA", //TODO
	"sessionMode": "general", //'general|kiosk|public,//TODO
	"touch": false, //true/false
	"session": { //TODO
		"launchType": "NA", //sf|ica|fta|appview|external message
		"attempt": 0,
		"error": {
			"count": 0 //Count of error dialogs shown
		}
	},
	"screen": {
		"displayResolution": "NA", //1920X1080
		"dpr": 0 //1/1.25/1.5
	},
	"graphics": { //TODO
		"caps": {
			"profile": "NA", //H264+LL,TwFull,H264
			"jpeg": false, //T|F
			"dirtyRect": false, //T|F
			"enhancedMode": false, //T|F
			"avoidCache": false, //T|F
			"selectiveH264": false, //T|F
		},
		"decoder": {
			"type": "rle" //H264|NACLHw|NACLSw|jpeg
		},
		"renderer": {
			"type": "NA" //canvas|webgl|nacl
		}
	},
	"fileTransfer": { //TODO
		"used": false, //true/false
		"uploadDnD": false //uploaded through drag and drop
	},
	"network": {
		"type": "NA", //https|http
		"reconnectionTimeOut": -1
	},
	"timezone": { //TODO
		"local": "NA", //browser (UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi
		"vda": "NA" //Sent to server
	},
	"printing": { //TODO
		"used": false //true/false
	},
	"toolbar": { //TODO
		"enabled": false, //true/false
		"click": 0,
		"buttons": {
			// buttons click count
			"switchApps": 0,
			"gestureGuide": 0,
			"preferences": 0,
			"openLog": 0,
			"about": 0,
			"fullscreen": 0, //TODO
			"keyboard": 0,
			"toggleMultiTouch": 0,
			"upload": 0,
			"download": 0,
			"usb": 0,
			"clipboard": 0,
			"lock": 0,
			"disconnect": 0,
			"logoff": 0,
			"secondaryMenu": 0
		}
	},
	"clipboard": {
		"used": false, //true/false
		"HTMLFormatEnabled": false
	},
	"serial": { //TODO
		"used": false //true/false
	},
	"seamless": { //TODO
		"used": false //true/false
	},
	"audio": {
		"used": false //true/false
	},
	"multimedia": { //TODO
		"used": false //true/false
	},
	"euem": {
		"used": false //true/false
	},
	"usb": { //TODO
		"used": false //true/false
	},
	"mrvc": { //TODO
		"autoKeyboardEnabled": false //true/false
	},
	"multitouch": { //TODO
		"gesture": false, //true/false
		"vc": false
	},
	"smartcard": {
		"used": false //true/false
	},
	"keyboard": { //TODO
		"layout": "NA"
	},
	"multimonitor": { //TODO
		"unified": false, //true/false
		"resolution": "NA",
		"monitorCount": 1
	},
	"configuration": { //TODO
		"policy": false,
		"cr": false,
		"webConfig": false,
		"defaultIca": false
	},
	"urlRedirection": { //TODO
		"used": false //true/false
	},
	"nps": { //TODO
		"rating": 0
	},
	"secureIca": {
		"used": false
	},
	'noOfCustomVCsUsed' : 0
};

CEIPObj.Constants.HTML5 = {
	"id": 1,
	"clientId": 0, // random string to identify device
	"language": {
		"browser": "NA",
		"session": "NA"
	},
	"browser": {
		"name": "NA", //Chromeapp in chrome / windows /linux /mac
		"version": "NA",
		"major": "NA"
	}, //Chrome os version
	"os": {
		"name": "NA", //Chromeapp in chrome / windows /linux /mac
		"version": "NA"
	}, //Chrome os version
	"receiverVersion": "NA", //TODO
	"touch": false,
	"mobile": false,
	"session": { //TODO
		"launchType": "store", //sf | SDK
		"attempt": 0, //count
		"error": {
			"count": 0 //Count of error dialogs shown
		}
	},
	"screen": {
		"displayResolution": "NA", //1920X1080
		"dpr": -1 //1/1.25/1.5
	},
	"graphics": { //TODO
		"caps": {
			"profile": "NA", //H264+LL,TwFull,H264
			"jpeg": false, //T|F
			"dirtyRect": false, //T|F
			"enhancedMode": false, //T|F
			"avoidCache": false, //T|F
			"selectiveH264": false, //T|F
		},
		"decoder": {
			"type": "rle" //H264|jpeg
		},
		"renderer": {
			"type": "NA" //canvas|webgl|nacl
		}
	},
	"fileTransfer": { //TODO
		"used": false, //true/false
		"uploadDnD": false //uploaded through drag and drop
	},
	"network": {
		"type": "NA", //wss|ws
		"reconnectionTimeOut": -1
	},
	"timezone": { //TODO
		"local": "NA", //browser (UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi
		"vda": "NA" //Sent to server
	},
	"printing": { //TODO
		"used": false //true/false
	},
	"toolbar": {
		"enabled": false,
		"click": 0,
		"buttons": {
			"switchApps": 0,
			"gestureGuide": 0,
			"preferences": 0,
			"openLog": 0,
			"about": 0,
			"fullscreen": 0,
			"keyboard": 0,
			"toggleMultiTouch": 0,
			"upload": 0,
			"download": 0,
			"clipboard": 0,
			"lock": 0,
			"disconnect": 0,
			"logoff": 0,
			"secondaryMenu": 0
		}
	},
	"clipboard": {
		"used": false //true/false
	},
	"seamless": { //TODO
		"used": false //true/false
	},
	"audio": {
		"used": false //true/false
	},
	"multimedia": { //TODO
		"used": false //true/false
	},
	"euem": {
		"used": false //true/false
	},
	"mrvc": { //TODO
		"autoKeyboardEnabled": false //true/false
	},
	"multitouch": { //TODO
		"gesture": false, //true/false
		"vc": false
	},
	"keyboard": { //TODO
		"layout": "NA"
	},
	"urlRedirection": { //TODO
		"used": false //true/false
	},
	"appSwitcher": { //TODO
		"used": false //true/false
	}
};

CEIPObj.Constants.Disabled = {
	"id": 2,
	"clientId": -1,
	"receiverVersion": "NA"
};
