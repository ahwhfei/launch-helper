function SCardWrapper(uiWrapper1, icaWrapper1, supportedChannel) {"use strict";
	var myself = this;
	var selfSender = myself;
	var icaWrapper = icaWrapper1;
	var uiWrapper = uiWrapper1;
	this.WrapperId = DRIVERID.ID_SCARD;
	this.isInitialize = false;
	var stream = null;
	this.streamName = "CTXSCRD";
	var ctlVirtualDriver = null;
	var channel = ChannalMap.virtualChannalMap[myself.streamName];
	this.errorCode = ERRORCODE.NONE;
	var capExchange = false;
	var launchApp = new Array(0);
	var scardEngine = null;

	if (supportedChannel && supportedChannel[this.streamName] === false) {
		this.errorCode = ERRORCODE.NOTSUPPORTED;
	}
	//console.log("channel is " + channel);
	/*
	 * This is only function that can call from otherWrappers
	 */
	this.processOtherWrapperCmd = function(dataObj) {
		dataObj.destination = myself.WrapperId;
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
				//handleUiWrapperCmd(dataObj);
				break;
			case DRIVERID.ID_SESSION_MANAGER:
				//handleSessionManagerCmd(dataObj);
				break;
			default:
				alert("not defined");
				break;
		}
	}
	
	
	function handleIcaWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.CONSUME) {
			stream.consumeData(dataObj.buff, dataObj.offset, dataObj.toCopy);
		}
	}

	
	this.initialize = function(cmd, engineThread, configObj) {
		if (this.errorCode !== ERRORCODE.NONE) {
			return;
		}
		if (cmd === THREADCOMMAND.INIT_ENGINE) {
			this.isInitialize = true;
			if (engineThread) {
				selfSender = engineThread;
			} else {
				scardEngine = new SCard.Engine(this);
				
				stream = scardEngine.SetStack();
				
				scardEngine.Run();
				selfSender = myself;
				myself.processOtherWrapperCmd = processThreadCommand;
				myself.processSelfWrapperCmd = processThreadCommand;
				myself.processConsumeCmd = processThreadCommand;
				myself.postMessage = processThreadCommand;
			}
		}

	};
}