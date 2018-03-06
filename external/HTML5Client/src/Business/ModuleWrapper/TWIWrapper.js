/*
 * Only winstation driver is needed for this channel
 * icaWrapper1--wrapper for winstation driver
 */
function TWIWrapper(uiWrapper1, icaWrapper1, supportedChannel) {
	var myself = this;
	var selfSender = myself;
	var icaWrapper = icaWrapper1;
	var uiWrapper = uiWrapper1;
	this.WrapperId = DRIVERID.ID_TWI;
	var stream = null;
	this.streamName = "CTXTWI\0";
	var twiEngine = null;
	var channel = ChannalMap.virtualChannalMap[myself.streamName];
	var TWIMode;
	var icaData;
	var twiManager;
	this.errorCode = ERRORCODE.NONE;
	/*
	* Unlike other VCs the TWI VC should have null terminal character to be send to the VDA (VDA itself expects the channel string to be communicated with null terminal 
	* during stack/vc init). In configuration.js we are using the channel name strings to enable/disable the vc by including it is supportedChannel list.
	* Unfortunately disabling the TWI channel using the channel name cannot be done throught google admin console policy due to limitation in adding the 
	* null terminal ('\0') character to the configuration schema. As a workaround, in google console policy schema we can use the 'CTXTWI\\0' string to 
	* disable the TWI vc and in our wrapper we can check for this vc list in supported list of HTML5_CONFIG and we can disable the vc with error code not supported
	* if it is diasabled through policy or through configuration settings.
	*/
	if (supportedChannel && (supportedChannel[this.streamName] === false || supportedChannel["CTXTWI\\0"] === false)) {
		this.errorCode = ERRORCODE.NOTSUPPORTED;
	}
	/*
	 * This is only function that can call from otherWrappers
	 */
	this.processOtherWrapperCmd = function(dataObj) {
        // Process message and handle only when error code is none
        // TODO: 1) if hit an error code then make process other wrapper cmd handler as empty method
        //       2) if channel is not supported then do not init any component or register for anyevent
        //          related to it, thereby no message will be posted for it. (In case of seamless check for
        //          virtual window and seamless manager component initialization based on the channel support).
        if (this.errorCode === ERRORCODE.NONE) {
            selfSender.postMessage(dataObj);
        }
	};
	this.processSelfWrapperCmd = function(dataObj) {
		processThreadCommand(dataObj);
	};
	this.processConsumeCmd = function(dataObj) {
		selfSender.postMessage(dataObj);
	};
	this.getTWIMode = function() {
		return TWIMode;
	};
	this.getIcaData = function( ){
		return icaData;
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
		     	handleUIMessage(dataObj);
		     	break;
		    case DRIVERID.ID_THINWIRE:
		      handleThinWireMessage(dataObj);
		      break;
			default:
				throw new Error("Unknown TWIWrapper source channel " + sourceChannel);
				break;
		}
	}

	function handleUIMessage(dataObj) {
		if (dataObj.cmd == WorkerCommand.UIMANAGER_TO_SEAMLESS) {
			twiManager.processClientMessage(dataObj);
		}
	}
	
	function handleThinWireMessage(dataObj){
	  if (dataObj.cmd == WorkerCommand.Pause) {
			twiManager.sendC2HPause();
		}
		if (dataObj.cmd == WorkerCommand.Resume) {
			twiManager.sendC2HResume();
		}
	}
	
	function handleIcaWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.CONSUME) {
			stream.consumeData(dataObj.buff, dataObj.offset, dataObj.toCopy);
		} else if (cmd === WorkerCommand.ICADATA_INFO) {
			loadIcaInfo(dataObj['icadata']);
		}
	}

	function loadIcaInfo(icaData1) {
		TWIMode = icaData1["TWIMode"];
		icaData = icaData1;
		twiEngine.onIcaFile( );
		
	}

	function onDisplayInfoChange(displayDetails){
		 var dataObj ={
			 	data: {
	                cmd: 'sessionInfo',
	                attributes: {
	                    monitorInfo: displayDetails.displayInfo
	                }
	         }
         };
		twiManager.processClientMessage(dataObj);
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

	this.sendToUI = function(data, cmd) {
	    var dataObj = {};
	    dataObj.source = DRIVERID.ID_TWI;
	    dataObj.destination = DRIVERID.ID_UI;
	    dataObj.data = data;
	    dataObj.cmd = cmd;
	   //Only while creating app/changing foreground check for fullscreen
	   if(data.attributes.focus === true || dataObj.data.cmd === 'create')
	   {
			if(dataObj.data.window_info && dataObj.data.window_info.bounds) {
				var windowHeight = dataObj.data.window_info.bounds.bottom - dataObj.data.window_info.bounds.top;
				var windowWidth = dataObj.data.window_info.bounds.right - dataObj.data.window_info.bounds.left;
		
	        if (((window.innerHeight - windowHeight) < 5) && ((window.innerWidth - windowWidth) < 5)) {
	            dataObj.data.window_info.isFullScreen = true;
	        } else {
	            dataObj.data.window_info.isFullScreen = false;
	        }
	      }
        }
	    uiWrapper.processOtherWrapperCmd(dataObj);
	};
	
	function onVdaResChange(res){
	    twiEngine.setVdaRes(res);
	    
	}
	
	
	this.initialize = function(cmd, engineThread, config) {
		if (this.errorCode !== ERRORCODE.NONE) {
			return;
		}
		if (cmd === THREADCOMMAND.INIT_ENGINE) {
			if (engineThread) {
				selfSender = engineThread;
				engineThread.postMessage({
					'cmd' : cmd,
					'streamname' : myself.streamName,
					'config' : config
				});
			} else {
				twiEngine = new TWIEngine(myself);
				twiEngine.initialize();
				stream = twiEngine.getVStream();
				twiEngine.Run();
				twiManager = twiEngine.getTwiManager();
				twiManager.setConfig(config);

				/*
				 * optimized wraqpper function call
				 *
				 */
				selfSender = myself;
				myself.processOtherWrapperCmd = processThreadCommand;
				myself.processSelfWrapperCmd = processThreadCommand;
				myself.processConsumeCmd = processThreadCommand;
				myself.postMessage = processThreadCommand;
			    UiControls.ResolutionUtility.registerCallback(UiControls.ResolutionUtility.constants.vdaSessionSize ,onVdaResChange);
            
			}

		}

	};
}