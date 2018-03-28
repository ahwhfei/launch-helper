/*
 * winstation and UI driver is needed for this channel
 * icaWrapper1--wrapper for winstation driver
 */
function FileWrapper(uiWrapper1, icaWrapper1, supportedChannel) {"use strict";
	var myself = this;
	var selfSender = myself;
	var icaWrapper = icaWrapper1;
	var uiWrapper = uiWrapper1;
	this.WrapperId = DRIVERID.ID_FILE;
	this.isInitialize = false;
	var stream = null;
	this.streamName = "CTXFILE";
	var fileVirtualDriver = null;
	var channel = ChannalMap.virtualChannalMap[myself.streamName];
	this.errorCode = ERRORCODE.NONE;
	var capExchange = false;
	var launchApp = new Array(0);
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
	
	this.enableFileVC = function() {
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.FILE_INIT;
		dataObj['source'] = DRIVERID.ID_FILE;
		dataObj['destination'] = DRIVERID.ID_UI;
		uiWrapper.processOtherWrapperCmd(dataObj);
	};
	
	this.sendUploadResponseNotificationToUi = function()
	{
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.FILE_UPLOAD_RESPONSE_RECEIVED;
		dataObj['source'] = DRIVERID.ID_FILE;
		dataObj['destination'] = DRIVERID.ID_UI;
		uiWrapper.processOtherWrapperCmd(dataObj);
	};
	this.sendFileTransferConfigToUi = function(maxFileCount)
	{
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.FILE_TRANSFER_CONFIG;
		dataObj['source'] = DRIVERID.ID_FILE;
		dataObj['destination'] = DRIVERID.ID_UI;
		dataObj['maxfilecount'] = maxFileCount;
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
				handleUiWrapperCmd(dataObj);
				break;
			default:
				throw new Error("Unknown FileVCWrapper source channel " + sourceChannel);
				break;
		}
	}

	function handleUiWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.CMD_FILE_UPLOAD_INIT) {
			fileVirtualDriver.sendFileUploadRequest();
		}
		else if(cmd === WorkerCommand.CMD_SET_FILE_UPLOAD_OBJECT)
		{
			fileVirtualDriver.setFileUploadObject(dataObj["fileObject"]);
		}
		else if(cmd === WorkerCommand.CMD_FILE_DOWNLOAD_INIT) {
			fileVirtualDriver.sendFileDownloadRequest();
		}
		
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
        writeHTML5Log(0,"SESSION:|:FILEVC:|:WRAPPER:|:INFO : Time take to Initialize " + this.streamName + " is " + timeToInitialize/1000 +" seconds");
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
				fileVirtualDriver = new FileVirtualDriver(this);
				
				stream = fileVirtualDriver.SetStack();
				
				fileVirtualDriver.Run();
				
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
	this.showFileTransferError = function(cmd){
		if(cmd)
			uiWrapper.mainEngine.uiEngine.showFileTransferError(cmd);
	};
}