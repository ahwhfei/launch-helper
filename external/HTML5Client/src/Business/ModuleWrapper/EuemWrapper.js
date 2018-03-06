function EuemWrapper(uiWrapper1, icaWrapper1, supportedChannel) {
	var myself = this;
	var selfSender = myself;
	var icaWrapper = icaWrapper1;
	this.WrapperId = DRIVERID.ID_EUEM;
	var stream = null;
	this.streamName = EuemConstants.EUEM_CHANNEL_NAME;
	var euemEngine = null;
	var channel = ChannalMap.virtualChannalMap[myself.streamName];
	this.errorCode = ERRORCODE.NONE;
    var timeToInitialize = 0;
	//Added for Unit test
	this.getEngine = function() {
		return euemEngine;
	};

	if (supportedChannel && supportedChannel[this.streamName] === false) {
		this.errorCode = ERRORCODE.NOTSUPPORTED;
	}

	/*
	 * This is only function that can call from otherWrappers
	 */
	this.processOtherWrapperCmd = function (dataObj) {
		selfSender.postMessage(dataObj);
	};
	this.processSelfWrapperCmd = function (dataObj) {
		processThreadCommand(dataObj);
	};
	this.processConsumeCmd = function (dataObj) {
		selfSender.postMessage(dataObj);
	};
	var dataSendObj = {};
	dataSendObj.channel = channel;
	dataSendObj.source = DRIVERID.ID_GENERICWRITE;
	dataSendObj.destination = icaWrapper.WrapperId;
	dataSendObj.cmd = WorkerCommand.QUEUEWRITEBYTE;
	this.queueVirtualWrite = function (channel, byteData, offset, length) {
		dataSendObj.buff = byteData;
		dataSendObj.offset = offset;
		dataSendObj.toCopy = length;
		icaWrapper.processOtherWrapperCmd(dataSendObj);
	};

	var rtDataSendObj = {};
	rtDataSendObj['channel'] = channel;
	rtDataSendObj['source'] = DRIVERID.ID_EUEM;
	rtDataSendObj['destination'] = icaWrapper.WrapperId;
	rtDataSendObj['cmd'] = WorkerCommand.ROUNDTRIP_PACKET;
	//This method will check for activity in WD driver before queuing EUEM Round trip start packet.
	//Will ignore activity flags for both round trip start and result packet in WD driver.
	// The activity is ignored to prevent from considering RT packets write as valid activity which will
	// result in always active state even when there are no valid activities happening in any other channel.
	this.checkAndQueueRTWrite = function (byteData, offset, length, isResultData) {
		rtDataSendObj['isResult'] = isResultData;
		rtDataSendObj['buff'] = byteData;
		rtDataSendObj['offset'] = offset;
		rtDataSendObj['toCopy'] = length;
		icaWrapper.processOtherWrapperCmd(rtDataSendObj);
	};

	this.postMessage = function (dataObj) {
		processThreadCommand(dataObj);
	};

	function handleEuemCmd(dataObj) {
		var isEuemCmd = true;
		switch (dataObj['cmd']) {
			case WorkerCommand.STARTSCCD_INFO:
				euemStartupInfo.startSCCD = dataObj['startSCCD'];				
				break;
			case WorkerCommand.ICADATA_INFO:
				loadIcaInfo(dataObj['icadata']);
				break;
			case WorkerCommand.ENDSCD_INFO:
				euemStartupInfo.updateLastMetrics(dataObj['endScd'], dataObj['isSharedSession']);
				if (dataObj['isSharedSession']) {
					euemEngine.sendStartupMetrics();
				}
				break;
			case WorkerCommand.ROUNDTRIP_INFO:
				euemEngine.handleTWFrameMetrics(dataObj['roundTripMetrics']);
				break;
			case WorkerCommand.ROUNDTRIP_ACK:
				euemEngine.ackReceivedForRT(dataObj['status']);
				break;
			default :
				isEuemCmd = false;
				break;
		}
		return isEuemCmd;
	}


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
			case DRIVERID.ID_CTL:
				handleCtrlWrapperCmd(dataObj);
				break;
			case DRIVERID.ID_THINWIRE:
				handleEuemCmd(dataObj);
				break;
			default:
				throw new Error("Unknown EUEMWrapper source channel " + sourceChannel);
				break;
		}
	}

	function handleCtrlWrapperCmd(dataObj) {
		handleEuemCmd(dataObj);
	}

	function handleUIWrappedCmd(dataObj) {
		handleEuemCmd(dataObj);
	}

	function loadStartupMetrics(icadata) {
		euemStartupInfo.appName = icadata["InitialProgram"];
		euemStartupInfo.launchMechanism = icadata["Launcher"];

		for (var i = 1; i < durationIds.length; i++) {
			try {
				var res = icadata[durationIds[i]];
				if (res != null || res != undefined) {
					euemStartupInfo.durations.push(new EuemDuration(i, parseInt(res)));
				}
			} catch (error) {
				console.log("error while loading startup time");
			}
		}
		euemStartupInfo.durations.push(new EuemDuration(EuemConstants.SLCD, 1));
		var startSCD = icadata["startSCD"];
		if (startSCD) {
			euemStartupInfo.startSCD = startSCD;
		}
	}

	function loadIcaInfo(icaData) {
		loadStartupMetrics(icaData);
		EuemContext.clientName = icaData['ClientName'];
		EuemContext.clientIp = icaData['ClientIp'];
	}

	function handleIcaWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.CONSUME) {
			stream.consumeData(dataObj.buff, dataObj.offset, dataObj.toCopy);
		}
		else if (cmd == WorkerCommand.CMDENABLEHIGHTHROUGHPUT) {
			// euemEngine.setHighThroughput(dataObj.cmd_enablehighthroughput);
		}
		else {
			handleEuemCmd(dataObj);
		}
	}
	
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
        writeHTML5Log(0,"SESSION:|:EUEMVC:|:WRAPPER:|:INFO : Time take to Initialize " + this.streamName + " is " + timeToInitialize/1000 +" seconds");
	};

	this.initialize = function (cmd, engineThread) {
		if (this.errorCode !== ERRORCODE.NONE) {
			return;
		}
		if (cmd === THREADCOMMAND.INIT_ENGINE) {
            timeToInitialize = (new Date()).getTime();
			if (engineThread) {
				selfSender = engineThread;
			} else {
				myself.isInitialize = true;
				euemEngine = new EuemEngine(myself);
				euemEngine.driverStart();
				stream = euemEngine.SetStack();
				euemEngine.Run();
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