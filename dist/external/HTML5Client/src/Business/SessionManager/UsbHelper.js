function UsbHelper(callback1) {
	var myself = this;
	var callback = callback1;
	var sessionMgr = null;
	this.usbstart = false;
	var UNPROCESS = 0;
	var PROCESSPENDING = 1;
	var PROCESSCOMPLETE = 2;
	this.setSessionMgr = function(sessionmgr1) {
		sessionMgr = sessionmgr1;
	};
	this.processCommand = function(dataObj, winInstance) {
		var cmd = dataObj['cmd'];
		try {
			if (cmd === WorkerCommand.CMD_ENABLE_UI_USB) {
				if (myself.usbstart === false) {
					return;
				}
				sessionMgr.sendUSBMsgToSourceUI({
					'cmd' : WorkerCommand.USB_INIT,
					'data' : currentUSBDevices['currentDataArray'] && currentUSBDevices['currentDataArray'][index] ? currentUSBDevices['currentDataArray'][index] : null
				}, winInstance);
			} else if (cmd === WorkerCommand.USB_INIT) {
				myself.usbstart = true;
				callback.sendToUSBMgr({
					'cmd' : WorkerCommand.SEAMLESS_USB_INIT
				});
				sessionMgr.sendUSBMsgToUI({
					'cmd' : WorkerCommand.USB_INIT,
					'data' : null
				}, winInstance, false);
			}
			else if(cmd=== WorkerCommand.USB_UPDATE_DEVICE)
			{
				dataObj['cmd'] = WorkerCommand.SEAMLESS_USB_UPDATE_DEVICE;
				callback.sendToUSBMgr(dataObj);
			}
			else if(cmd=== WorkerCommand.USB_RELEASE_DEVICES)
			{
				dataObj['cmd'] = WorkerCommand.SEAMLESS_USB_RELEASE_DEVICES;
				callback.sendToUSBMgr(dataObj);
			}
			else if(cmd=== WorkerCommand.SEAMLESS_USB_LIST)
			{
			  dataObj['cmd'] = WorkerCommand.CMD_USB_SENDING_LIST;
				handleNotificationPacket(dataObj,winInstance);
			}
			else if (cmd ===WorkerCommand.SEAMLESS_USB_NOTIFICATIONW2C) {
				handleNotificationPacket(dataObj, winInstance);
			}
		} catch(error) {
			console.log("error is coming in helper*************************************");
		}
	};



	function handleNotificationPacket(dataObj, winInstance) {
		 if (dataObj['source'] == DRIVERID.ID_RECEIVER_MANAGER) {
				notifyUI(dataObj, winInstance);
			}
	}

	function notifyUI(dataObj, winInstance) {
			  
			if (dataObj['source'] === DRIVERID.ID_UI) {
				sessionMgr.sendUSBMsgToUI(dataObj, winInstance, true);
			} else {
				sessionMgr.sendUSBMsgToUI(dataObj, winInstance, false);
			}
	}

}
