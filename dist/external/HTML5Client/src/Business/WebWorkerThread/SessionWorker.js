if ( typeof importScripts != 'undefined') { HTML5OFFUSCATIONJSASSEMBLERSTARTTEB;
	loadScript("Business/Main/Common/WorkerCommand.js");
	loadScript("Business/SessionManager/SessionManager.js");
	loadScript("Business/ModuleWrapper/SessionManagerWrapper.js");
	loadScript("Business/ModuleWrapper/CVCWrapper.js");
	loadScript("Business/ModuleWrapper/IcaThreadWrapper.js");
	loadScript("Business/ModuleWrapper/UiWrapper.js");
	loadScript("Business/Main/Common/ChannalMap.js");
	loadScript("Business/SessionManager/ClipboardHelper.js");
	loadScript("Business/SessionManager/UsbHelper.js");
	loadScript("Business/Main/VirtualDriver/clipboard/ClipFormatConverter.js");
	loadScript("Business/ModuleWrapper/ReceiverManagerWrapper.js");
	loadScript("Business/ModuleWrapper/ClipBoardWrapper.js");
	loadScript("Business/ModuleWrapper/UsbWrapper.js");
	HTML5OFFUSCATIONJSASSEMBLERENDTEB;
	var icaWrapper = new IcaThreadWrapper(null);
	var ctrlWrapper = new CVCWrapper(null, icaWrapper);
	var sessionMgrWrapper = new SessionManagerWrapper();
	var rcvMgrWrapper = new ReceiverManagerWrapper();
	var clipBoardWrapper = new ClipBoardWrapper(null, icaWrapper);
	var usbWrapper = new UsbWrapper(null,icaWrapper);
	sessionMgrWrapper.setClipWrapper(clipBoardWrapper);
	sessionMgrWrapper.setUsbWrapper(usbWrapper);
	sessionMgrWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null);
	sessionMgrWrapper.setIcaWrapper(icaWrapper);
	sessionMgrWrapper.setCVCWrapper(ctrlWrapper);
	var clipHelper = new ClipboardHelper(sessionMgrWrapper);
	var usbHelper = new UsbHelper(sessionMgrWrapper);
	sessionMgrWrapper.setClipboardHelper(clipHelper);
	sessionMgrWrapper.setUsbHelper(usbHelper);
	sessionMgrWrapper.setrcvManager(rcvMgrWrapper);
	function closeSharedWorker() {
		writeHTML5Log(0, "SESSION:|:SESSION MANAGER:|:WORKER:|:close worker");
		self.close();
	}

	onconnect = function(event) {
		writeHTML5Log(0, "SESSION:|:SESSION MANAGER:|:WORKER:|:on connect start");
		var uiWrapper = new UiWrapper(icaWrapper, null);
		uiWrapper.initialize(THREADCOMMAND.INIT_ENGINE, event.ports[0]);
		var winInstance = sessionMgrWrapper.registerNewWindow(event.ports[0], uiWrapper);
		winInstance.uiWrapper.initialize(THREADCOMMAND.INIT_ENGINE, winInstance);
		writeHTML5Log(0, "SESSION:|:SESSION MANAGER:|:WORKER:|:on connect end");
	};

}