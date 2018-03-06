/*
 * Enabled only for platforms that support USB devices like Chrome
 */

function UsbWrapper(uiWrapper1, icaWrapper1, supportedChannel) {
	var myself = this;
	var selfSender = myself;
	var icaWrapper = icaWrapper1;
	var uiWrapper = uiWrapper1;
	this.WrapperId = DRIVERID.ID_USB;
	var stream = null;
	this.streamName = "CTXGUSB";
	var sessionMgrWrapper = null;
	this.isInitialize = false;
	var channel = ChannalMap.virtualChannalMap[myself.streamName];
	this.errorCode = ERRORCODE.NONE;

	if (supportedChannel && supportedChannel[this.streamName] === false){
		this.errorCode = ERRORCODE.NOTSUPPORTED;
	}
	
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

	this.enableUSB = function() {
		var dataObj = {};
		dataObj['cmd'] = WorkerCommand.USB_INIT;
		myself.sendToSessionMgr(dataObj);
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
	        handleUIWrapperCmd(dataObj);
				break;
      case DRIVERID.ID_USB:
          handleUsbWrapperCmd(dataObj);
          break;
      case DRIVERID.ID_SESSION_MANAGER:
				handleSessionManagerCmd(dataObj);
				break;
			default:
				throw new Error("Unknown USBWrapper source channel " + sourceChannel);
				break;
		}
	}


function handleSessionManagerCmd(dataObj){
		var cmd = dataObj['cmd'];
		if( cmd == WorkerCommand.SEAMLESS_USB_LIST){
			usbEngine.getUSbDevicelist(dataObj['usbList']);
		}
	}


	function handleUsbCmd(dataObj) {

		var cmd = dataObj.cmd;
	}

	function handleIcaWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd == WorkerCommand.CONSUME) {
			stream.consumeData(dataObj.buff, dataObj.offset, dataObj.toCopy);
		}
	}
	
	function handleUsbWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd == WorkerCommand.USB_ADD_DEVICE) {
		    AddUSBDevice(dataObj);
		}
		else if(cmd === WorkerCommand.USB_UPDATE_DEVICE){
			  uiWrapper.processOtherWrapperCmd(dataObj);
			  if(dataObj['status'] == DeviceStatus.STATUS_REDIR_SUCCESS || dataObj['status'] == DeviceStatus.STATUS_GONE || dataObj['status'] == DeviceStatus.STATUS_REJECTED || dataObj['status'] == DeviceStatus.STATUS_STOP || dataObj['status'] == DeviceStatus.STATUS_REDIR ||dataObj['status'] == DeviceStatus.STATUS_TRANSFER_RELEASING || dataObj['status'] == DeviceStatus.STATUS_TRANSFER_RELEASED || dataObj['status']== DeviceStatus.STATUS_RELEASE_ALL) {
			    myself.sendToSessionMgr(dataObj);
			  }
		}
			else if(cmd === WorkerCommand.CMD_USB_SENDING_LIST){
				uiWrapper.processOtherWrapperCmd(dataObj);
		}
		else if(cmd === WorkerCommand.USB_RELEASE_DEVICES){
		  myself.sendToSessionMgr(dataObj);
		}
		
		
	}
	
	function handleUIWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd == WorkerCommand.CMD_USB_BUILD_DEVICE) {
			usbEngine.preBuildDevice(dataObj['productId'],dataObj['vendorId'],dataObj['device']);
		}
		else if(cmd == WorkerCommand.CMD_USB_CLOSE_DEVICE)
		{
		  usbEngine.releaseDevice(dataObj['device'],dataObj['status']);
		}
		else if(cmd === WorkerCommand.CMD_USB_LIST){
				usbEngine.getUsblist();
		}
		else if(cmd == WorkerCommand.CMD_USB_TRANSFER_RELEASING)
		{
		  usbEngine.transferDevice(dataObj['device']);
		}
		else if(cmd == WorkerCommand.CMD_USB_RELEASE_ALL)
		{
		  usbEngine.releaseOtherSessionDevices(dataObj['device']);
		}
			else if(cmd == WorkerCommand.CMD_USB_RELEASE_DEVICES)
		{
		  usbEngine.closeSessionUsbDevices(dataObj['sessionName']);
		}
		
	}

  this.onChannelClose = function() {
    
    try
    {
      usbEngine.driverShutdown();
    }
    catch(error)
    {
      console.error("failed to close USB channel"+error);
    }
  };
  this.sendToSessionMgr = function(dataObj){
		dataObj['source'] = DRIVERID.ID_USB;
		dataObj['destination'] = DRIVERID.ID_SESSION_MANAGER;
		sessionMgrWrapper.processOtherWrapperCmd(dataObj);
	};
	this.setSessionMgrWrapper = function(mgr){
		sessionMgrWrapper = mgr;
	};
	
function AddUSBDevice( dataObj){
		dataObj['cmd'] = WorkerCommand.USB_ADD_DEVICE;
		myself.sendToSessionMgr(dataObj);
 };
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
	this.initialize = function(cmd, engineThread, config) {
		if (this.errorCode !== ERRORCODE.NONE) {
			return;
		}
		if (cmd == THREADCOMMAND.INIT_ENGINE) {
			if (engineThread) {
				selfSender = engineThread;
			/*	engineThread.postMessage({
					'cmd' : cmd,
					'streamname' : myself.streamName,
					'config' : config
				});*/
			} else {
			
			 if (!HTML5Interface.isUSBAPIAvailable()){
					this.errorCode = ERRORCODE.NOTSUPPORTED;
					return;
				}
                myself.isInitialize = true;
				usbEngine = new UsbEngine(myself);
				stream = usbEngine.SetStack();
				usbEngine.Run();
				selfSender = myself;
				myself.processOtherWrapperCmd = processThreadCommand;
				myself.processSelfWrapperCmd = processThreadCommand;
				myself.processConsumeCmd = processThreadCommand;
				myself.postMessage = processThreadCommand;
			}
		}
	};
}

