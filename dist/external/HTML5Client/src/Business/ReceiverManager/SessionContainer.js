function SessionContainer(rcvMgr1, rcvWrapper1) {
	var windowArray = new Array(0);
	var windowLength = 0;
	this.sessionkey = null;
	var seamlessEnable = false;
	var sessionSharing = false;
	var myself = this;
	var rcvMgr = rcvMgr1;
	var rcvWrapper = rcvWrapper1;
	this.setConfiguration = function(dataObj) {
		if (dataObj['sessionkey']) {
			myself.sessionKey = dataObj['sessionkey'];
		}
		if (dataObj['seamlesswindow']) {
			seamlessEnable = dataObj['seamlesswindow'];
		}
		if (dataObj['sessionsharing']) {
			sessionSharing = dataObj['sessionsharing'];
		}
	};
	this.sendClipboardData = function(dataObj, winInstance, sourceOnly) {
		dataObj['source'] = DRIVERID.ID_RECEIVER_MANAGER;
		dataObj['destination'] = DRIVERID.ID_SESSION_MANAGER;
		for (var i = 0; i < windowLength; i++) {
			var winInstance1 = windowArray[i];
			if (winInstance1 && winInstance1.clipinstance === true && (!(sourceOnly === false && winInstance.index === winInstance1.index ))) {
				winInstance1.sendMessage(dataObj);
			}
		}
	};
	this.sendUSBData = function(dataObj, winInstance, sourceOnly) {
		dataObj['source'] = DRIVERID.ID_RECEIVER_MANAGER;
		dataObj['destination'] = DRIVERID.ID_SESSION_MANAGER;
		for (var i = 0; i < windowLength; i++) {
			var winInstance1 = windowArray[i];
			if (winInstance1 && winInstance1.usbinstance === true && (!(sourceOnly === false && winInstance.index === winInstance1.index ))) {
				winInstance1.sendMessage(dataObj);
			}
		}
	};
	this.registerNewWindow = function(winInstance) {
		winInstance.setContainer(myself);
		windowArray[windowLength++] = winInstance;
	};
	this.unregisterWindow = function(winInstance) {
		for (var i = 0; i < windowLength; i++) {
			var temp = windowArray[i];
			if (temp.index === winInstance.index) {
				windowArray[i] = windowArray[windowLength - 1];
				windowArray[windowLength - 1] = null;
				windowLength--;
				break;
			}
		}
		return windowLength;
	};
	this.clearAll = function() {

	};
}

function WindowInstance(receiverMgr1, port) {
	var receiverMgr = receiverMgr1;
	var myself = this;
	this.port = port;
	this.uiWrapper = null;
	this.type = "other";
	this.index;
	this.sessionkey = 0;
	this.clipinstance = false;
	this.usbinstance = false;
	this.container;
	this.setContainer = function(cntr) {
		myself.container = cntr;
	};
	function onMessage(event) {
		var dataObj = event.data;
		if (dataObj['cmd'] === WorkerCommand.REGISTER_SESSION_PORT) {
			dataObj['byref'] = [event.ports[0]];
		}
		receiverMgr.processCommand(dataObj, myself);
	}


	this.postMessage = function(dataObj) {
		myself.port.postMessage(dataObj);
	};
	this.sendMessage = this.postMessage;
	if (myself.port.start) {
		myself.port.onmessage = onMessage;
		myself.port.start();
	}
	this.closeConnection = function() {
		myself.clearConnection();
	};
	this.clearConnection = function() {
		if (myself.port.close) {
			myself.port.close();
		}
	};

}
