/*
 * Only winstation driver is needed for this channel
 * icaWrapper1--wrapper for winstation driver
 */
function MRVCWrapper(uiWrapper1, icaWrapper1, supportedChannel) {
	var myself = this;
	var selfSender = myself;
	var icaWrapper = icaWrapper1;
	var uiWrapper = uiWrapper1;
	this.WrapperId = DRIVERID.ID_MOBILE;
	this.isInitialize = false;
	var stream = null;
	this.streamName = "CTXMOB";
	var channel = ChannalMap.virtualChannalMap[myself.streamName];
	this.errorCode = ERRORCODE.NONE;
	var capExchange = false;
	var launchApp = new Array(0);
	var mrvcEngine = null;

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
	this.postMessage = function(dataObj){
		processThreadCommand(dataObj);
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

	function processThreadCommand(dataObj) {
		var sourceChannel = dataObj.source;
		switch (sourceChannel) {
			case DRIVERID.ID_WINSTATION:
			case DRIVERID.ID_TRANSPORT:
			case DRIVERID.ID_PROTOCOL:
				handleIcaWrapperCmd(dataObj);
				break;
			case DRIVERID.ID_UI:
				handleUiWrapperCmd(dataObj);
				break;			
			default:
				throw new Error("Unknown MRVCWrapper source channel " + sourceChannel);
				break;
		}
	}
	
	function handleUiWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		/* if (cmd === WorkerCommand.CMD_URL_REDIRECTION_STATUS) {
			mrvcEngine.urlRedirectionCallback(dataObj.status);
		} */
	}

	function handleIcaWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.CONSUME) {
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
        writeHTML5Log(0,"SESSION:|:MRVC:|:WRAPPER:|:INFO : Time take to Initialize " + this.streamName + " is " + timeToInitialize/1000 +" seconds");
    };

	this.initialize = function(cmd, engineThread, configObj) {
		if (this.errorCode !== ERRORCODE.NONE) {
			return;
		}
		if (cmd === THREADCOMMAND.INIT_ENGINE) {
            timeToInitialize = (new Date()).getTime();
			this.isInitialize = true;
			if (engineThread) {
				selfSender = engineThread;
			} else {
				mrvcEngine = new MRVCEngine(this);
				stream = mrvcEngine.SetStack();
				mrvcEngine.Run();
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