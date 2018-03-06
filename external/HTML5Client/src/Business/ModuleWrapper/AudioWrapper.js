function AudioWrapper(uiWrapper1, icaWrapper1, wrappers, supportedChannel) {
	var myself = this;
	var selfSender = myself;
	var icaWrapper = icaWrapper1;
	var uiWrapper = uiWrapper1;
	
    this.WrapperId = DRIVERID.ID_AUDIO;
    if(wrappers)
        wrappers[this.WrapperId] = this;
    
    
	var stream = null;
	this.streamName = "CTXCAM ";
	var audioEngine = null;
	this.audioEngineThread = null;
	var audioPlayer = null;
	var audioPlayerThread = null;
	var audioCapture = null;
	var captureCallback = null;
	var channel = ChannalMap.virtualChannalMap[myself.streamName];
	this.errorCode = ERRORCODE.NONE;
	if (supportedChannel && supportedChannel[this.streamName] == false) {
		this.errorCode = ERRORCODE.NOTSUPPORTED;
	}
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
			case DRIVERID.ID_AUDIO:
				handleAudioCommmand(dataObj);
				break;
			default:
				throw new Error("Unknown AudioWrapper source channel " + sourceChannel);
				break;
		}
	}

	function handleAudioCommmand(dataObj) {
        
        if (dataObj['deviceType'] === 2) {
            audioCapture.processDeviceCommand(dataObj);
            return;
        }
        
	    var cmd = dataObj.cmd;
        try {
            switch(cmd) {
                case WorkerCommand.CMD_INIT_PLAYER:
                    audioPlayer.initializePlayer(dataObj.noOfChannel, dataObj.sampleRate, dataObj['audioConfig']);
                    break;

                case WorkerCommand.CMD_PLAY_AUDIO:
                    audioPlayer.playAudio(dataObj.audioData);
                    break;

                case WorkerCommand.AUDIO_PLAYER_TYPE:
                    audioEngine.setPlayerType(dataObj.playerType);
                    break;

                case THREADCOMMAND.INIT_ENGINE:
                    audioEngine.setAudioConfig(dataObj['config']);
                    break;
                    
                default:
                    console.error("Unknown command " + cmd);
                    break;
            }
        }
        catch(error)
        {
            console.error(" error in handling audio command: " + error);
        }
    }

	function handleIcaWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd == WorkerCommand.CONSUME) {
			stream.consumeData(dataObj.buff, dataObj.offset, dataObj.toCopy);
		}
	}

	this.disConnectDriver = function(code) {
		var data = {
			'channel' : channel,
			'source' : DRIVERID.ID_GENERIC_INFO,
			'destination' : DRIVERID.ID_WINSTATION,
			'cmd' : WorkerCommand.CMD_CHANNEL_ERROR_CODE,
			'errorcode' : code,
			'channel' : channel
		};
		icaWrapper.processOtherWrapperCmd(data);
	};
	this.setPlayerConfig = function(noofchannel, samplerate,audioConfig) {
		var data = {
			'cmd' : WorkerCommand.CMD_INIT_PLAYER,
			'destination' : DRIVERID.ID_AUDIO,
			'source' : myself.WrapperId,
			'noOfChannel' : noofchannel,
			'sampleRate' : samplerate,
			'audioConfig' : audioConfig
		};
		audioPlayerThread.postMessage(data);
	};

    //Input Audio communication
	// TODO: Change the device type to be feteched dynamically. 
    this.sendInputCommand = function (data) {
        data['source'] = myself.WrapperId;
        data['destination'] = DRIVERID.ID_AUDIO;
        data['deviceType'] = 2; // AUDIO_IN
        audioPlayerThread.postMessage(data);
    };
    
	this.playAudio = function(audiodata) {
		var data = {
			'cmd' : WorkerCommand.CMD_PLAY_AUDIO,
			'destination' : DRIVERID.ID_AUDIO,
			'source' : myself.WrapperId,
			'audioData' : audiodata
		};
		audioPlayerThread.postMessage(data);
	};
	this.initialize = function(cmd, engineThread, config) {
		if (this.errorCode !== ERRORCODE.NONE) {
			return;
		}
		if (cmd == THREADCOMMAND.INIT_ENGINE) {
			if (engineThread) {
			    selfSender = engineThread;
			    myself.audioEngineThread = engineThread;
				engineThread.postMessage({
					'cmd' : cmd,
					'streamname' : myself.streamName,
					'config' : config,
					'source' : myself.WrapperId
				});
			} else {
			    myself.audioEngineThread = myself;
				audioEngine = new AudioEngine(myself);
				stream = audioEngine.SetStack();
				audioEngine.setAudioConfig(config);
				audioEngine.Run();
				selfSender = myself;
				myself.processOtherWrapperCmd = processThreadCommand;
				myself.processSelfWrapperCmd = processThreadCommand;
				myself.processConsumeCmd = processThreadCommand;
				myself.postMessage = processThreadCommand;
			}

		} else if (cmd == THREADCOMMAND.INIT_AUDIOPLAYER) {
			if (engineThread) {
				audioPlayerThread = engineThread;
			} else {
				audioPlayerThread = myself;
				audioPlayer = new AudioPlayer();
				var audioPlayerType = audioPlayer.getPlayerType();
				if (audioPlayerType == null) {
					this.errorCode = ERRORCODE.NOTSUPPORTED;
					myself.disConnectDriver(this.errorCode);
				} else {
					var dataSendObj = {};
					dataSendObj.source = myself.WrapperId;
					dataSendObj.destination = myself.WrapperId;
					dataSendObj.cmd = WorkerCommand.AUDIO_PLAYER_TYPE;
					dataSendObj.playerType = audioPlayerType;
					selfSender.postMessage(dataSendObj);
					audioCapture = new AudioCapture(myself);
				}
			}
		}
	};   
}
