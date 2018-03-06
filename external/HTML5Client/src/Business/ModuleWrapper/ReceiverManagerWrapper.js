function ReceiverManagerWrapper() {
	this.errorCode = ERRORCODE.NONE;
	this.WrapperId = DRIVERID.ID_RECEIVER_MANAGER;
	var myself = this;
	var receiverMgr;
	var seamlessClipManager;
	var seamlessUsbManager;
	this.isInitialize = false;
	this.processOtherWrapperCmd = function(dataObj) {
		dataObj['destination'] = myself.WrapperId;
		if (dataObj['byref']) {
			var temp = dataObj['byref'];
			dataObj['byref'] = null;
			selfSender.postMessage(dataObj, temp);
		} else {
			selfSender.postMessage(dataObj);
		}
	};
	this.processSelfWrapperCmd = function(dataObj) {
		processThreadCommand(dataObj);
	};
	this.postMessage = function(dataObj, byRef) {
		if (byRef) {
			dataObj['byref'] = byRef;
		}
		processThreadCommand(dataObj);
	};
	function processThreadCommand(dataObj) {

	}


	this.registerNewWindow = function(port, uiWrapper) {
		var rvalue = receiverMgr.registerNewWindow(port, uiWrapper);
		return rvalue;
	};
	this.initialize = function(cmd, engineThread, config) {
		if (cmd == THREADCOMMAND.INIT_ENGINE) {
			myself.isInitialize = true;
			if (engineThread) {
				selfSender = engineThread;
				engineThread.postMessage({
					'cmd' : cmd,
					'config' : config,
					'source' : myself.WrapperId,
					'destination' : myself.WrapperId
				});
				myself.processSelfWrapperCmd = myself.processOtherWrapperCmd;
			} else {				
				receiverMgr = new ReceiverManager(myself);
				seamlessClipManager = new ClipboardSeamlessManager(receiverMgr);
				receiverMgr.setClipMgr(seamlessClipManager);
				seamlessUsbManager = new UsbSeamlessManager(receiverMgr);
				receiverMgr.setUsbMgr(seamlessUsbManager);
				selfSender = myself;
				myself.processOtherWrapperCmd = processThreadCommand;
				myself.processSelfWrapperCmd = processThreadCommand;
				myself.postMessage = processThreadCommand;
			}
		}
	};
}