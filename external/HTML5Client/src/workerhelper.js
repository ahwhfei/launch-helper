if ( typeof importScripts != 'undefined') {
	/*THESE VARIABLE USED FOR OFFUSCATION in jSAssembler*/
	var HTML5OFFUSCATIONJSASSEMBLERSTARTTEB ;//start of replaceable
	var HTML5OFFUSCATIONJSASSEMBLERENDTEB ;
	var HTML5_OBFUSCATE_THIRDPARTY_DIRECTORY = "/";
	 var writeHTML5Log = function (label,logMsg){
	 };
	function loadScript(path) {
		importScripts(HTML5LocationParam["filepath"]+ path);
	}
	function loadThirdPartyScript(path) {
		importScripts(HTML5LocationParam["thirdpartypath"]+ path);
	}
	
	// define these only if not present! 
	// Chrome shows these logs as well in console and is very helpful in debugging.
	if (!self.console || !self.console.log) {
		self.console = function( ){};
		self.console.log = function(level ,msg ){};
	}
	
	loadScript("../Common/TypeScriptStub.js");
    loadScript("../Common/environment.js");
	 ;HTML5OFFUSCATIONJSASSEMBLERSTARTTEB;	 
	loadScript("Business/CtxDialog/Logger/log.js");
	loadScript("Business/Main/Common/WorkerCommand.js");
	;HTML5OFFUSCATIONJSASSEMBLERENDTEB;
	
	loadScript("../Common/HTML5CommonInterface/HTML5Interface.js");
	var threadId = -1;
	if ( typeof HTML5LocationParam != "undefined") {
		threadId = parseInt(HTML5LocationParam["tid"]);
	}
	if (threadId === THREADID.H264) {
	 ;HTML5OFFUSCATIONJSASSEMBLERSTARTTEB;
		loadScript("Business/Main/VirtualDriver/Thinwire/CoreAvcDecoder/CoreAvcWorkerInterface.js");
		;HTML5OFFUSCATIONJSASSEMBLERENDTEB;
	} else if (threadId === THREADID.THREAD2) {
	 ;HTML5OFFUSCATIONJSASSEMBLERSTARTTEB;
		loadScript("Business/WebWorkerThread/Thread2.js");
		;HTML5OFFUSCATIONJSASSEMBLERENDTEB;
	}else if(threadId === THREADID.SESSION_MANAGER){
		;HTML5OFFUSCATIONJSASSEMBLERSTARTTEB;		
		loadScript("Business/WebWorkerThread/SessionWorker.js");
		;HTML5OFFUSCATIONJSASSEMBLERENDTEB;
	}else if(threadId === THREADID.RECEIVER_MANAGER){
		;HTML5OFFUSCATIONJSASSEMBLERSTARTTEB;		
		loadScript("Business/WebWorkerThread/ReceiverWorker.js");
		;HTML5OFFUSCATIONJSASSEMBLERENDTEB;
	}

}

