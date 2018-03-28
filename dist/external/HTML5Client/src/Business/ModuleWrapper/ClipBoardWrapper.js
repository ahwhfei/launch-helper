function ClipBoardWrapper(uiWrapper1, icaWrapper1, supportedChannel) {
	"use strict" ;
	var myself = this;
	var selfSender = myself;
	var icaWrapper = icaWrapper1;
	var uiWrapper = uiWrapper1;
	this.WrapperId = DRIVERID.ID_CLIPBOARD;
	var stream = null;
	this.streamName = "CTXCLIP";
	var clipBoardEngine = null;
	var channel = ChannalMap.virtualChannalMap[myself.streamName];
	var sessionMgrWrapper = null;
	this.errorCode = ERRORCODE.NONE;
	this.isInitialize = false;
	if (supportedChannel && supportedChannel[this.streamName] === false) {
		this.errorCode = ERRORCODE.NOTSUPPORTED;
	}
	
	

	//console.log("channel is " + channel);
	/*
	 * This is only function that can call from otherWrappers
	 */
	this.processOtherWrapperCmd = function(dataObj) {
		selfSender.postMessage(dataObj);
	};
	this.processSelfWrapperCmd = function(dataObj) {
		processThreadCommand(dataObj);
	};
	this.processConsumeCmd = function(dataObj) {
		selfSender.postMessage(dataObj);
	};
	var dataSendObj = {};
	dataSendObj.channel = channel;
	dataSendObj.source = DRIVERID.ID_GENERICWRITE;
	dataSendObj.destination = icaWrapper.WrapperId;
	dataSendObj.cmd = WorkerCommand.QUEUEWRITEBYTE;
	this.queueVirtualWrite = function(channel, byteData, offset, length) {
		dataSendObj.buff = byteData;
		dataSendObj.offset = offset;
		dataSendObj.toCopy = length;
		icaWrapper.processOtherWrapperCmd(dataSendObj);
	};
	this.postMessage = function(dataObj) {
		processThreadCommand(dataObj);
	};
	function processThreadCommand(dataObj) {
		var sourceChannel = dataObj.source;
		switch (sourceChannel) {
			case DRIVERID.ID_WINSTATION:
			case DRIVERID.ID_TRANSPORT:
			case DRIVERID.ID_PROTOCOL:
				handleIcaWrapperCmd(dataObj);
				break;
			case DRIVERID.ID_UI:
				handleUIWrappedCmd(dataObj);
				break;
			case DRIVERID.ID_SESSION_MANAGER:
				handleSessionManagerCmd(dataObj);
				break;
			default:
				throw new Error("Unknown ClipBoardWrapper source channel " + sourceChannel);
				break;
		}
	}

	function handleUIWrappedCmd(dataObj) {
		
	}
	function handleSessionManagerCmd(dataObj){
		var cmd = dataObj['cmd'];
		if( cmd == WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTC2H){
			clipBoardEngine.requestForClipData(dataObj['format'] , dataObj['formatname'],dataObj['timestamp']);
		}else if(cmd == WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONC2H){
			clipBoardEngine.notifyFormatChangec2h(dataObj['formatarr'],dataObj['len'] , dataObj['timestamp'] , dataObj['formatname']);
		}else if(cmd == WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEC2H){
			clipBoardEngine.sendRenderRequestReply(dataObj['format'],dataObj['formatname'] , dataObj['data'] , dataObj['failure']);
		}
	}
	function handleIcaWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.CONSUME) {
			stream.consumeData(dataObj.buff, dataObj.offset, dataObj.toCopy);
		}
		else if( cmd == WorkerCommand.CMDENABLEHIGHTHROUGHPUT){
			clipBoardEngine.setHighThroughput(dataObj.cmd_enablehighthroughput);
		}
	}

	this.sendToSessionMgr = function(dataObj){
		dataObj['source'] = DRIVERID.ID_CLIPBOARD;
		dataObj['destination'] = DRIVERID.ID_SESSION_MANAGER;
		sessionMgrWrapper.processOtherWrapperCmd(dataObj);
	};
	this.setSessionMgrWrapper = function(mgr){
		sessionMgrWrapper = mgr;
	};
	this.enableClipboard = function() {
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.CLIP_INIT;
		myself.sendToSessionMgr(dataObj);
        this.raiseSessionReadyEvent();
	};
	this.responseFormatData = function(format,formatname ,data, tstamp ){
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEH2C;
		dataObj['format'] = format;
		dataObj['data'] = data;
		dataObj['timestamp'] = tstamp;
		dataObj['formatname'] = formatname;
		myself.sendToSessionMgr(dataObj);
	};
	this.notifyFormatChange = function( formatArr , len , formatname , lastH2CTimestamp){
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONH2C;
		dataObj['formatarr'] = formatArr;
		dataObj['formatname'] = formatname;
		dataObj['len'] = len;			
		dataObj['timestamp'] = lastH2CTimestamp;
		myself.sendToSessionMgr(dataObj);
	};
	this.requestFormatData = function(format , formatname , tstamp){
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTH2C;
		dataObj['format'] = format;			
		dataObj['timestamp'] = tstamp;
		dataObj['formatname'] = formatname ;
		myself.sendToSessionMgr(dataObj);
	};
	this.requestNotification = function( ){
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTNOTIFICATION;
		myself.sendToSessionMgr(dataObj);
	};
    var timeToInitialize = 0;
    this.raiseSessionReadyEvent = function() {
        var eventCommand = {
            'cmd': WorkerCommand.SESSION_READY_EVENT,
            'source': DRIVERID.ID_CALLBACK_EVENTS,
            'destination' : icaWrapper.WrapperId,
            'data' :
            {
                'state' : "sessionready",
                'channel' : this.streamName
            }
        };
        icaWrapper.processOtherWrapperCmd(eventCommand);
        timeToInitialize = (new Date()).getTime() - timeToInitialize;
        writeHTML5Log(0,"SESSION:|:CLIPBOARDVC:|:WRAPPER:|:INFO : Time take to Initialize " + this.streamName + " is " + timeToInitialize/1000 +" seconds");
    };

	this.initialize = function(cmd, engineThread) {
		if (this.errorCode !== ERRORCODE.NONE) {
			return;
		}
		if (cmd === THREADCOMMAND.INIT_ENGINE) {
            timeToInitialize = (new Date()).getTime();
			if (engineThread) {
				selfSender = engineThread;
			} else {
				myself.isInitialize = true;
				clipBoardEngine = new ClipboardEngine(myself);
				clipBoardEngine.driverStart();
				stream = clipBoardEngine.SetStack();
				clipBoardEngine.Run();
				/*
				 * optimized wraqpper function call
				 *
				 */
				selfSender = myself;
				myself.processOtherWrapperCmd = processThreadCommand;
				myself.processSelfWrapperCmd = processThreadCommand;
				myself.processConsumeCmd = processThreadCommand;
				myself.postMessage = processThreadCommand;
			}

		}

	};
}