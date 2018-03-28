/*
 * This function is gateway for data that pass between winstation driver to
 *  virtual drivers this function contain
 * TransportDriver
 * ProtocolDriver
 * WinstationDriver( Expander , Reducer , icastack , virtualdriverstacks)
 */

/*processThreadCommand:-All command has to be finished in this function
 * processOtherWrapperCmd:-This function called by other Wrapper to handle command related
 * to this Wrapper
 */
function IcaThreadWrapper(uiWrapper1, wrappers) {
	"use strict";
	var icaStack = null;
	var virtualStreamManager = null;
	var myself = this;
	var MAX_VIRTUAL_CHANNELS = 32;
	var gVirtualNames = [];
	var gVirtualStreams = [];
	var selfSender;
	var uiWrapper = uiWrapper1;
	this.WrapperId = DRIVERID.ID_WINSTATION;
    var sessionKey;
    var sessionReadyReceived = false;
    if (wrappers)
        wrappers[this.WrapperId] = this;
    
	this.isInitialize = false;
	var wd = null;
	var mouseHandler = null;
	var browserType;
	this.errorCode = ERRORCODE.NONE;
	var secProtocolStr = null;//sepetrated by ;
	var customVC;

	/*
	 * This is only function that can call from otherWrappers
	 */
	this.processOtherWrapperCmd = function(dataObj) {
		selfSender.postMessage(dataObj);
	};

	this.postMessage = function(dataObj) {
		processThreadCommand(dataObj);
	};

	this.processSelfWrapperCmd = function(dataObj) {
		processThreadCommand(dataObj);
	};

	function processThreadCommand(dataObj) {
		var sourceChannel = dataObj.source;
		switch (sourceChannel) {
			case DRIVERID.ID_GENERICWRITE:
				if (dataObj.cmd === WorkerCommand.QUEUEWRITEBYTE) {
					wd.queueVirtualWrite(dataObj.channel, dataObj.buff, dataObj.offset, dataObj.toCopy);
				} else if (dataObj.cmd === WorkerCommand.CMD_WRITECACHEPACKET) {
					wd.writeCachePacket(dataObj.buffer);
				}else if( dataObj['cmd'] === WorkerCommand.WRITE_ACK){
					wd.writeAck(dataObj['channel'],dataObj['windowsize']);
				}
				break;
			case DRIVERID.ID_UI:
				handleUIThreadCmd(dataObj);
				break;
			case DRIVERID.ID_GENERIC_INFO:
				handleGenericInfo(dataObj);
				break;
			case DRIVERID.ID_WINSTATION:
			case DRIVERID.ID_TRANSPORT:
			case DRIVERID.ID_PROTOCOL:
				handleIcaWrapperCmd(dataObj);
				break;
			case DRIVERID.ID_SESSION_MANAGER:
				handleSessionManagerCmd(dataObj);
				break;
			case DRIVERID.ID_EUEM:
				if(dataObj['cmd'] == WorkerCommand.ROUNDTRIP_PACKET) {
					wd.writeEuemRoundTrip(dataObj);
				}
				break;
			case DRIVERID.ID_THINWIRE:
				if(dataObj['cmd'] == WorkerCommand.SESSION_RESOLUTION_INFO) {
					mouseHandler.setDisplay(dataObj['width'],dataObj['height']);
				}
				else if(dataObj['cmd'] == WorkerCommand.PACKET_REDRAW){
				  wd.WritePacketRedraw(dataObj['left'], dataObj['top'], dataObj['width'], dataObj['height']);
				}
				break;
			case DRIVERID.ID_CALLBACK_EVENTS:
                if(!sessionReadyReceived){
                    writeHTML5Log(0,"SESSION:|:ICA:|:WRAPPER:|:INFO : Session Ready Event not received, raising Session Ready event from " + dataObj['data']['channel']);
                    sessionReadyReceived = true;
                    var data = {};
                    data.cmd = WorkerCommand.SESSION_READY_EVENT;
                    data.state = "sessionReady";
                    data.source = myself.WrapperId;
                    data.destination = uiWrapper.WrapperId;
                    uiWrapper.processOtherWrapperCmd(data);
                }
			break;
		}

	}
	function handleSessionManagerCmd(dataObj){		
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.SESSION_LAUNCH_APPLICATION) {
                    
                        // create embed element only for new session
                        uiWrapper.processOtherWrapperCmd({
                            'cmd' : WorkerCommand.CTXMODULE_CREATE,
                            'source' : myself.WrapperId,
                            'destination' : uiWrapper.WrapperId
                        });
            	UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.sessionResize  ,function(res){
            		setIcaStack(dataObj ,res.width ,res.height);
            		writeHTML5Log(0,"SESSION:|:ICA:|:WRAPPER:|:INFO : session size in icastack "+ JSON.stringify(res));
					icaStack.start();
					sendIcaDataToEuem(dataObj.icaData);
            		sendIcaDataToTWI(dataObj.icaData);
            	});
			
		}		
	}

    function sendIcaDataToTWI(icaData) {
        if(gVirtualStreams[ChannalMap.virtualChannalMap["CTXTWI\0"]]) {
        gVirtualStreams[ChannalMap.virtualChannalMap["CTXTWI\0"]].processOtherWrapperCmd({
                'cmd': WorkerCommand.ICADATA_INFO,
                'icadata': icaData,
                'source': myself.WrapperId,
                'destination' : DRIVERID.ID_TWI
            }

        );
        }
    }

	function sendIcaDataToEuem(icadata) {
	
	 if(gVirtualStreams[ChannalMap.virtualChannalMap["CTXEUEM"]] != undefined){
		gVirtualStreams[ChannalMap.virtualChannalMap["CTXEUEM"]].processOtherWrapperCmd({
			'cmd': WorkerCommand.ICADATA_INFO,
			'icadata': icadata,
			'source': myself.WrapperId,
			'destination' : DRIVERID.ID_EUEM
		});
	}
	
	}

	this.sendRtAckToEuem = function(status) {
	
	 if(gVirtualStreams[ChannalMap.virtualChannalMap["CTXEUEM"]] != undefined){
		gVirtualStreams[ChannalMap.virtualChannalMap["CTXEUEM"]].processOtherWrapperCmd({
			'cmd': WorkerCommand.ROUNDTRIP_ACK,
			'status': status,
			'source': myself.WrapperId,
			'destination' : DRIVERID.ID_EUEM
		});
	}
	
	}

	this.sendSessionInfo = function(id , value){
	    var info = {
	        attributes : { },
	        cmd : 'sessionInfo',
	        window_info : {
	            sessionId :sessionKey,
	            appId : null
	        }
	    };
	    if(id == "CTXSRVR"){
	        info.attributes.serverName = value;
	    }
	    uiWrapper.processOtherWrapperCmd({
            'cmd' : WorkerCommand.SESSION_INFO,
            'data' : info,
            'source' : myself.WrapperId,
            'destination' : uiWrapper.WrapperId
        });
	    
	};
	this.CGP_Resume = function(){
		wd.CGP_Resume();
	};
	this.CGP_Suspend = function (){
		wd.CGP_Suspend();
	};
	
	this.sendEndScdToEuem = function(endScd) {
	 if(gVirtualStreams[ChannalMap.virtualChannalMap["CTXEUEM"]] != undefined){
		gVirtualStreams[ChannalMap.virtualChannalMap["CTXEUEM"]].processOtherWrapperCmd({
			'cmd': WorkerCommand.ENDSCD_INFO,
			'endScd': endScd,
			'source': myself.WrapperId,
			'destination' : DRIVERID.ID_EUEM,
			'isSharedSession' : false
		});
	  }
	}

    function handleGenericInfo(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.CMD_CHANNEL_ERROR_CODE) {
			myself.removeChannelConsumer(dataObj.channel , dataObj.errorcode);
		}
	}

	function handleIcaWrapperCmd(dataObj) {
		switch (dataObj.source){
			case DRIVERID.ID_TRANSPORT:
				if(dataObj.cmd == WorkerCommand.CMD_CLOSECURRENTTAB ){
					icaStack.transportDriver.Close();
				}
				break;
			default :
				// do nothing as of now.
		}
	}

	this.getWebSocket_Protocol = function( ){
		var rvalue = null;
		if((secProtocolStr != null) && (secProtocolStr != "")){
			rvalue = secProtocolStr.split(";");
		}
		return rvalue;
	};

	var consumeObj = {
		'cmd' : WorkerCommand.CONSUME,
		'channel' : 0,
		'offset' : 0,
		'toCopy' : 0,
		'buff' : null,
		'source' : myself.WrapperId,
		'isarraybuffer' : false
	};
	
	this.consumeData = function(buff, offset, toCopy, channel) {
		consumeObj.offset = offset;
		consumeObj.toCopy = toCopy;
		consumeObj.channel = channel;
		consumeObj.buff = buff;
		consumeObj.destination = gVirtualStreams[channel].WrapperId;
        if (gVirtualStreams[channel].errorCode == ERRORCODE.NONE) {
			gVirtualStreams[channel].processConsumeCmd(consumeObj);
		}				
    };

	function handleUIThreadCmd(data) {
		var cmd = data.cmd;
		if (cmd === WorkerCommand.CMD_WRITE_SINGLEMOUSE_PACKET) {
			if(mouseHandler)
				mouseHandler.processSingleMouseCmd(data);
        }
        else if (cmd === WorkerCommand.CMD_WRITE_MULTIMOUSE_PACKET) {
			if(mouseHandler)
				mouseHandler.processMultiMouseCmd(data.data, data.offset, data.moucount);
        }
        else if (cmd === WorkerCommand.CMD_WRITEKBDPACKET) {
			wd.writePacketKeyboardUnicode(data.unicode, data.typeOfKey);
        }
		else if (cmd == WorkerCommand.CMD_WRITE_SINGLESCANCODE_PACKET) {
			wd.writePacketKeyboardSingleScanCode(data["scancode"], data["isKeyUp"]);
		}
        else if (cmd === WorkerCommand.CMD_WRITESETLEDPACKET) {
			wd.writePacketSetLed(data.ledBitmask);
        }   
	}

	function setIcaStack(data ,width ,height) {
		browserType = data.browserType;
		secProtocolStr = data.secprotocol;
		icaStack = new ICAStack(data.icaData, myself, width, height);
		icaStack.setCustomVCInfo(customVC);
		for (var i = 0; i < MAX_VIRTUAL_CHANNELS; ++i) {
			if ((gVirtualNames[i]) && (gVirtualStreams[i].errorCode == ERRORCODE.NONE)) {
				icaStack.SupportedChannel(ChannalMap.revVirtualChannalMap[i]);
            }
            else {
				gVirtualNames[i] = "";
			}
		}
	 	
		wd = icaStack.GetWinstationDriver();
		mouseHandler = wd.getMouseHandler();
	}

    this.getBrowserType = function () {
		return browserType;
	};

    this.getChannelUsingName = function (name) {
		return ChannalMap.virtualChannalMap[name];
	};

	this.setChannelConsumer = function(consumer, channelName) {
  		if(consumer.errorCode === ERRORCODE.NONE)
  		{
  			var channel = myself.getChannelUsingName(channelName);
			gVirtualNames[channel] = channelName;
			gVirtualStreams[channel] = consumer;	
  		}        
    };

	this.removeChannelConsumer = function(channel, errorCode) {
		// if channel is not yet initialized then cannot set error code now
        if (gVirtualStreams[channel]) {
            gVirtualStreams[channel].errorCode |= errorCode;
        }
	};

    this.showError = function (textheader, message, bText, disableClose, cboption) {
		var pass_data = {
			'textheader' : textheader,
			'message' : message,
			'bText' : bText,
            'cb' : cboption,
			'disableClose' : disableClose
		};
		uiWrapper.processOtherWrapperCmd({
			'cmd' : WorkerCommand.ERR_MSG,
			'msg' : JSON.stringify(pass_data),
			'source' : myself.WrapperId,
			'destination' : uiWrapper.WrapperId
		});
	};

	this.showReconnectingOverlay = function(UIDimmingPercentage){
		uiWrapper.processOtherWrapperCmd({
			'cmd' : WorkerCommand.SHOW_RECONNECTING_SCREEN,
			'source' : myself.WrapperId,
			'destination' : uiWrapper.WrapperId,
			'dimmingPercent' : UIDimmingPercentage
		});
	};
	
	this.hideReconnectingOverlay = function(){
		uiWrapper.processOtherWrapperCmd({
			'cmd' : WorkerCommand.HIDE_RECONNECTING_SCREEN,
			'msg' : "",
			'source' : myself.WrapperId,
			'destination' : uiWrapper.WrapperId
		});
	}
	
	this.enableEUKS = function(euks) {
		var data = {};
		data.cmd = WorkerCommand.EUKS;
		data.enabled = euks;
		data.source = myself.WrapperId;
		data.destination = uiWrapper.WrapperId;
		uiWrapper.processOtherWrapperCmd(data);
	};

	this.getVirtualStream = function getVirtualStream(channel) {
		return gVirtualStreams[channel];
	};

	this.terminateThread = function(channel) {
		gVirtualStreams[channel] = new SkipMessageChannel();
	};

	this.TerminateConnection = function(cmd, reason){
		var data = {};
 		data.cmd = cmd;
 		data.reason = reason;
		data.source = DRIVERID.ID_TRANSPORT;
 		data.destination = uiWrapper.WrapperId;
		myself.postMessage(data);
	};
	
	this.CloseConnection = function(cmd, reason) {
		var data = {};
		data.cmd = cmd;
		data.reason = reason;
		data.source = myself.WrapperId;
		data.destination = uiWrapper.WrapperId;
		uiWrapper.processOtherWrapperCmd(data);
	};

	this.getVirtualBinding = function getVirtualBinding() {
		var v = [];
		var k = 0;
		var virtNameLength = gVirtualNames.length;
		for (var i = 0; i < virtNameLength; ++i) {
			var s = gVirtualNames[i];
			if (s !== "") {
				v[k++] = new NumberedObject(i, s);
			}
		}
		return v;
	};

	this.initialize = function(cmd, engineThread ,config) {
		if (cmd === THREADCOMMAND.INIT_ENGINE) {
			this.isInitialize = true;
			if (engineThread) {
				selfSender = engineThread;
            }
            else {
                if(config)
                    sessionKey = config.sessionKey;
                // optimized wrapper function call
				selfSender = myself;
				myself.processOtherWrapperCmd = processThreadCommand;
				myself.processSelfWrapperCmd = processThreadCommand;
				myself.postMessage = processThreadCommand;
			
			}
		}
	};
	this.setCustomVC = function(obj){
		customVC = obj;
	};
}
