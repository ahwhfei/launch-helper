function MultiTouchWrapper(uiWrapper1, icaWrapper1, supportedChannel) {
	var myself = this;
	var selfSender = myself;
	var icaWrapper = icaWrapper1;
	var uiWrapper = uiWrapper1;
	this.WrapperId = DRIVERID.ID_MTU;
	var stream = null;
	this.streamName = "CTXMTCH";
	var multiTouchEngine = null;
	var channel = ChannalMap.virtualChannalMap[myself.streamName];
	this.errorCode = ERRORCODE.NONE;
	if (supportedChannel && supportedChannel[this.streamName] == false) {
		this.errorCode = ERRORCODE.NOTSUPPORTED;
	}
	
	this.processOtherWrapperCmd = function(dataObj) {
		dataObj.destination = myself.WrapperId;
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
	
	this.postMessage = function(dataObj) {
		processThreadCommand(dataObj);
	};
	
	this.processSelfWrapperCmd = function(dataObj) {
		processThreadCommand(dataObj);
	};
	
	this.processConsumeCmd = function(dataObj) {
		selfSender.postMessage(dataObj);
	};
	
	this.enableMultTouch = function() {
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.MULTI_TOUCH_INIT;
		dataObj['source'] = DRIVERID.ID_MTU;
		dataObj['destination'] = DRIVERID.ID_UI;
		uiWrapper.processOtherWrapperCmd(dataObj);
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
				handleUIWrapperCmd(dataObj);
				break;
			default:
				throw new Error("Unknown MultiTouchWrapper source channel " + sourceChannel);
				break;
		}
	}
	
	function sendTouchData(touchData, touchCount){
		multiTouchEngine.sendTouchData(touchData,touchCount);
	}
	
	function handleUIWrapperCmd(dataObj) {
		var cmd = dataObj['cmd'];
		if (cmd == WorkerCommand.SEND_MULTI_TOUCH_DATA) {
			var hashTouchData= dataObj.touchData;
			var touchDataCount = dataObj.touchDataCount;
			sendTouchData(hashTouchData,touchDataCount);
		}
	}
	
	function handleIcaWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd == WorkerCommand.CONSUME) {
			stream.consumeData(dataObj.buff, dataObj.offset, dataObj.toCopy);
		}
	}

    var timeToInitialize;
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
        writeHTML5Log(0,"SESSION:|:MULTITOUCH:|:WRAPPER:|:INFO : Time take to Initialize " + this.streamName + " is " + timeToInitialize/1000 +" seconds");
    };

    this.initialize = function(cmd, engineThread, config) {
		if (this.errorCode !== ERRORCODE.NONE) {
			return;
		}
		if (cmd == THREADCOMMAND.INIT_ENGINE) {
            timeToInitialize = (new Date()).getTime();
			if (engineThread) {
				selfSender = engineThread;
				engineThread.postMessage({
					'cmd' : cmd,
					'streamname' : myself.streamName,
					'config' : config
				});
			} else {
				multiTouchEngine = new MultiTouchEngine(myself);
				stream = multiTouchEngine.SetStack();
				multiTouchEngine.Run();
				selfSender = myself;
				myself.processOtherWrapperCmd = processThreadCommand;
				myself.processSelfWrapperCmd = processThreadCommand;
				myself.processConsumeCmd = processThreadCommand;
				myself.postMessage = processThreadCommand;
			}
		}

	}
}
