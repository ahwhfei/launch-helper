/*
 * Only winstation driver is needed for this channel
 * icaWrapper1--wrapper for winstation driver
 */
function CVCWrapper(uiWrapper1, icaWrapper1, supportedChannel) {"use strict";
	var myself = this;
	var selfSender = myself;
	var icaWrapper = icaWrapper1;
	var uiWrapper = uiWrapper1;
	this.WrapperId = DRIVERID.ID_CTL;
	this.isInitialize = false;
	var stream = null;
	this.streamName = "CTXCTL ";
	var ctlVirtualDriver = null;
	var channel = ChannalMap.virtualChannalMap[myself.streamName];
	this.errorCode = ERRORCODE.NONE;
	var capExchange = false;
	var launchApp = new Array(0);
	var euemWrapper = null;

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
	this.showUrlDialog = function(message) {
		var pass_data = {
			'message' : message
		};
		uiWrapper.processOtherWrapperCmd({
			'cmd' : WorkerCommand.URL_REDIRECTION_MSG,
			'msg' : JSON.stringify(pass_data),
			'source' : DRIVERID.ID_CTL,
			'destination' : DRIVERID.ID_UI
		});
	};
	this.focusWindow = function() {
		uiWrapper.processOtherWrapperCmd({
			'cmd' : WorkerCommand.SEAMLESS_WINDOW_SHOW,
			'msg' : "",
			'source' : DRIVERID.ID_CTL,
			'destination' : DRIVERID.ID_UI
		});
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
			case DRIVERID.ID_SESSION_MANAGER:
				handleSessionManagerCmd(dataObj);
				break;
			default:
				throw new Error("Unknown CVCWrapper source channel " + sourceChannel);
				break;
		}
	}
	function handleSessionManagerCmd(dataObj){
		var cmd = dataObj['cmd'];
		if (cmd === WorkerCommand.SESSION_LAUNCH_APPLICATION) {
				sendIcaDataToEuem(dataObj['icaData']);
				if(capExchange == false){
				launchApp[launchApp.length] = dataObj;
			}else{
				ctlVirtualDriver.launchApplication(dataObj['icaData']);
			}			
		}		
	}
	function handleUiWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.CMD_URL_REDIRECTION_STATUS) {
			ctlVirtualDriver.urlRedirectionCallback(dataObj.status);
		}
	}

	function handleIcaWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.CONSUME) {
			stream.consumeData(dataObj.buff, dataObj.offset, dataObj.toCopy);
		}
	}

	this.setEuemWrapper = function(euemWrapperObj) {
		euemWrapper = euemWrapperObj;
	};

	function sendIcaDataToEuem(icadata) {
		euemWrapper.processOtherWrapperCmd({
			'cmd': WorkerCommand.ICADATA_INFO,
			'icadata': icadata,
			'source': myself.WrapperId,
			'destination' : DRIVERID.ID_EUEM
		});
	}

	this.sendEndScdToEuem = function(endScd) {
		euemWrapper.processOtherWrapperCmd({
			'cmd': WorkerCommand.ENDSCD_INFO,
			'endScd': endScd,
			'source': myself.WrapperId,
			'destination' : DRIVERID.ID_EUEM,
			'isSharedSession' : true
		});
	}

	this.capExchangeComplete = function( ){
		capExchange = true;
		for(var i = 0 ;i< launchApp.length ; i++){
			ctlVirtualDriver.launchApplication(launchApp[i]['icaData']);
		}
        this.raiseSessionReadyEvent();
		launchApp = new Array(0);
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
        writeHTML5Log(0,"SESSION:|:CONTROLVC:|:WRAPPER:|:INFO : Time take to Initialize " + this.streamName + " is " + timeToInitialize/1000 +" seconds");
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
				ctlVirtualDriver = new CTLVirtualDriver(this);
				ctlVirtualDriver.initialize(configObj);
				stream = ctlVirtualDriver.SetStack();
				ctlVirtualDriver.Run();
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