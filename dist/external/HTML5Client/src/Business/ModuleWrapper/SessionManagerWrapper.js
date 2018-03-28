function SessionManagerWrapper() {
	this.errorCode = ERRORCODE.NONE;
	this.WrapperId = DRIVERID.ID_SESSION_MANAGER;
	var myself = this;
	var selfSender = this;
	var sessionMgr;
	var icaWrapper;
	var ctrlWrapper;
	var clipHelper;
	var usbHelper;
	var clipWrapper;
	var usbWrapper;
	var rcvMgrWraper = null;
	var seamlessClipEnable = false;
	var usbEnable =false;
	//use in sesion sharing does not happen by shared thread
	var windowInstance;
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
	this.postMessage = function(dataObj ,byRef) {
        if (byRef) {
            dataObj['byref'] = byRef;
        }
		processThreadCommand(dataObj);
	};
	this.setIcaWrapper = function(wrapper) {
		icaWrapper = wrapper;
	};
	this.setClipWrapper = function(wrapper) {
		clipWrapper = wrapper;
	};
	this.setUsbWrapper = function(wrapper){
	  usbWrapper = wrapper;
	};
	this.setIcaEngine = function(engine, forceChange) {
		if (forceChange == true || icaWrapper.isInitialize == false) {
			icaWrapper.initialize(THREADCOMMAND.INIT_ENGINE, engine);
		}
	};
	this.setClipEngine = function(engine, forceChange) {
		if (forceChange == true || clipWrapper.isInitialize == false) {
			clipWrapper.initialize(THREADCOMMAND.INIT_ENGINE, engine);
		}
	};
	this.setUsbEngine = function(engine, forceChange) {
		if (forceChange == true || usbWrapper.isInitialize == false) {
			usbWrapper.initialize(THREADCOMMAND.INIT_ENGINE, engine);
		}
	};
	this.setClipboardHelper = function(clipHelper1) {
		clipHelper = clipHelper1;
		clipHelper.setSessionMgr(sessionMgr);
	};
	this.setUsbHelper = function(usbHelper1) {
		usbHelper = usbHelper1;
		usbHelper.setSessionMgr(sessionMgr);
	};
	this.resetClip = function(enable) {
		seamlessClipEnable = enable;
	};
	this.resetUSB = function(enable) {
		usbEnable = enable;
	};
	this.setrcvManager = function(mgr) {
		rcvMgrWraper = mgr;
	};
	this.getrcvMgr = function() {
		return rcvMgrWraper;
	};
	this.setrcvEngine = function(engine, forceChange) {
		if (forceChange == true || rcvMgrWraper.isInitialize == false) {
			rcvMgrWraper.initialize(THREADCOMMAND.INIT_ENGINE, engine);
		}
	};
	this.sendToClipboardEngine = function(dataObj, winInstance) {
		dataObj['source'] = myself.WrapperId;
		dataObj['destination'] = clipWrapper.WrapperId;
		clipWrapper.processOtherWrapperCmd(dataObj);
	};
	this.sendToUsbEngine = function(dataObj, winInstance) {
		dataObj['source'] = myself.WrapperId;
		dataObj['destination'] = usbWrapper.WrapperId;
		usbWrapper.processOtherWrapperCmd(dataObj);
	};
	this.handleClipBoardCmd = function(dataObj, winInstance) {
		clipHelper.processCommand(dataObj, winInstance);
	};
	this.handleUSBCmd = function(dataObj, winInstance) {
		usbHelper.processCommand(dataObj, winInstance);
	};
	this.setWindowInstance = function(winObj) {
		windowInstance = winObj;
	};
	this.sendIcaWrapperMessaage = function(dataObj) {
		dataObj['source'] = myself.WrapperId;
		dataObj['destination'] = icaWrapper.WrapperId;
		icaWrapper.processOtherWrapperCmd(dataObj);
	};
	this.setCVCWrapper = function(wrapper) {
		ctrlWrapper = wrapper;
	};
	this.setCVCEngine = function(engine, forceChange) {
		if (forceChange == true || ctrlWrapper.isInitialize == false) {
			ctrlWrapper.initialize(THREADCOMMAND.INIT_ENGINE, engine);
		}
	};
	this.sendCVCWrapperMessaage = function(dataObj) {
		dataObj['source'] = myself.WrapperId;
		dataObj['destination'] = ctrlWrapper.WrapperId;
		ctrlWrapper.processOtherWrapperCmd(dataObj);
	};
	this.sendToClipMgr = function(dataObj) {
		if (seamlessClipEnable === true) {
			dataObj['source'] = myself.WrapperId;
			dataObj['destination'] = rcvMgrWraper.WrapperId;
			rcvMgrWraper.processOtherWrapperCmd(dataObj);
		}
	};
		this.sendToUSBMgr = function(dataObj) {
		if (usbEnable === true) {
			dataObj['source'] = myself.WrapperId;
			dataObj['destination'] = rcvMgrWraper.WrapperId;
			rcvMgrWraper.processOtherWrapperCmd(dataObj);
		}
	};
	function processThreadCommand(dataObj) {
		try {
			windowInstance.processCommand(dataObj);
		} catch(error) {
			writeHTML5Log(0, "SESSION:|:SESSION MANAGER:|:WRAPPER:|:process command");
		}

	}


	this.registerNewWindow = function(port, uiWrapper) {
		var rvalue = sessionMgr.registerNewWindow(port, uiWrapper);
		return rvalue;
	};
	this.initialize = function(cmd, engineThread, config) {
		if (cmd == THREADCOMMAND.INIT_ENGINE) {
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
				sessionMgr = new SessionManager(myself);
				selfSender = myself;
				myself.processOtherWrapperCmd = processThreadCommand;
				myself.processSelfWrapperCmd = processThreadCommand;
				myself.postMessage = processThreadCommand;
			}
		}
	};
}
