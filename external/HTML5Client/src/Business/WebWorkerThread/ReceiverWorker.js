if ( typeof importScripts != 'undefined') { HTML5OFFUSCATIONJSASSEMBLERSTARTTEB;
	loadScript("Business/Main/Common/WorkerCommand.js");
	loadScript("Business/ModuleWrapper/UiWrapper.js");
	loadScript("Business/ModuleWrapper/ReceiverManagerWrapper.js");
	loadScript("Business/ReceiverManager/SessionContainer.js");
	loadScript("Business/Main/VirtualDriver/clipboard/ClipFormatConverter.js");
	loadScript("Business/ReceiverManager/ClipboardSeamlessManager.js");
	loadScript("Business/ReceiverManager/UsbSeamlessManager.js");
	loadScript("Business/ReceiverManager/ReceiverManager.js"); HTML5OFFUSCATIONJSASSEMBLERENDTEB;
	var rcvManagerWrapper = new ReceiverManagerWrapper();
	rcvManagerWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null);
	function closeSharedWorker() {
		writeHTML5Log(0, "SESSION:|:RECEIVER MANAGER:|:WORKER:|:close worker");
		self.close();
	}
	onconnect = function(event) {
		var uiWrapper = new UiWrapper(null, null);
		uiWrapper.initialize(THREADCOMMAND.INIT_ENGINE, event.ports[0]);
		rcvManagerWrapper.registerNewWindow(event.ports[0], uiWrapper);
	};
}