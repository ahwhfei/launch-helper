function UsbSeamlessManager(wmg) {
	var wmanager = wmg;
	var UsbDeviceList = {};
	var index = 0;
	
	var USBStatus = {};
	  USBStatus.STATUS_FAILED = -1;
	  USBStatus.STATUS_REDIR = 0;
	  USBStatus.STATUS_PENDING = 1;
	  USBStatus.STATUS_GONE = 2;
	  USBStatus.STATUS_REDIR_SUCCESS = 3;
	  USBStatus.STATUS_CLIENT_REDIR = 4;
	  USBStatus.STATUS_REJECTED    = 5;
	  USBStatus.STATUS_STOP    = 6;
	  USBStatus.STATUS_TRANSFER_RELEASING    = 7;
	  USBStatus.STATUS_TRANSFER_RELEASE    = 8;
	  USBStatus.STATUS_TRANSFER_RELEASED =9;
    USBStatus.STATUS_RELEASE_ALL    = 10;
     

	this.processNextCmd = function(dataObj, winInstance) {
		var cmd = dataObj['cmd'];
		
		if(cmd===WorkerCommand.SEAMLESS_USB_UPDATE_DEVICE)
		{
		  updateDeviceinList(dataObj,winInstance);
		}
		else if(cmd===WorkerCommand.SEAMLESS_USB_RELEASE_DEVICES)
		{
		  releaseDeviceList(dataObj,winInstance);
		}
	  else if(cmd===WorkerCommand.SEAMLESS_USB_INIT)
		{
		  sendDeviceList(winInstance);
		}
	};
	
	this.releaseDevicesCloseSession = function(dataObj,winInstance){
		releaseDeviceList(dataObj,winInstance);
	};
	function sendDeviceList(winInstance)
	{
	  var data = {};
		data["cmd"] = WorkerCommand.SEAMLESS_USB_LIST;
		data['usbList'] = UsbDeviceList;
		var sourceOnly = true;
		sendResponseMessage(data,winInstance,sourceOnly);
	}
	function releaseDeviceList(dataObj,winInstance)
	{
     var removeUsbList = [];
		 for(var member in UsbDeviceList)
		    {
		          if(UsbDeviceList[member]['deviceOwner']===dataObj['sessionName'])
		          {
		            removeUsbList.push(member);
	        	    delete UsbDeviceList[member];
		          }
		    }
		  var sessionData = {
		  'sessionName': dataObj['sessionName'],
		  'removeUsbDevicesList': removeUsbList,
		  'cmd': WorkerCommand.SEAMLESS_USB_NOTIFICATIONW2C,
		  'action': "RELEASE_DEVICES"
		};
		sendResponseMessage(sessionData,winInstance,false);
	}
	function updateDeviceinList(dataObj, winInstance){
	   var ret = false;
	   var id = dataObj["productId"] + "_" + dataObj["vendorId"] + "_" +dataObj['device']["device"];
	   if(dataObj['status']===USBStatus.STATUS_FAILED ||dataObj['status']===USBStatus.STATUS_REJECTED || dataObj['status']===USBStatus.STATUS_GONE|| dataObj['status']===USBStatus.STATUS_STOP)
	   {
	     if(UsbDeviceList[id] !== "undefined" )
	     {
	       if(UsbDeviceList[id]['status']!==USBStatus.STATUS_TRANSFER_RELEASING)
	       {
	          sendNotificationMessage("DELETED",true,UsbDeviceList[id],winInstance);
	          delete UsbDeviceList[id];
	       }
	       else
	       {
	          sendNotificationMessage("TRANSFER_RELEASED",true,UsbDeviceList[id],winInstance);
	          delete UsbDeviceList[id];
	       }
	     }
	   }
	   else if(dataObj['status']===USBStatus.STATUS_TRANSFER_RELEASING)
	   {
		  if(UsbDeviceList[id] !== "undefined")
	     {
	       UsbDeviceList[id]['status']= USBStatus.STATUS_TRANSFER_RELEASING;
	       UsbDeviceList[id]['nextOwner']= dataObj['nextOwner'];
	       sendNotificationMessage("TRANSFER_RELEASING",true,UsbDeviceList[id],winInstance);
	     }
	   }
	    else if(dataObj['status']===USBStatus.STATUS_RELEASE_ALL)
	   {
	     var device = UsbDeviceList[id];
		    for(var member in UsbDeviceList)
		    {
	        	  delete UsbDeviceList[member];
		    }
	     sendNotificationMessage("RELEASE_ALL",true,device, winInstance);
	   }
	   else{ 
	      var usbDevice = new UsbDeviceStruct(dataObj);
	      UsbDeviceList[id] = usbDevice;
	      sendNotificationMessage("ADDED",true,UsbDeviceList[id],winInstance);
	   }
	}


function sendNotificationMessage(action,status,device,winInstance)
{
	   var responseData = {};
	   responseData["cmd"] = WorkerCommand.SEAMLESS_USB_NOTIFICATIONW2C;
	   responseData["status"] = status;
	   responseData["action"] = action;
	   responseData['device'] = device;
	   var sourceOnly = false;
	   sendResponseMessage(responseData,winInstance,sourceOnly);
}

function sendResponseMessage(data,winInstance,sourceOnly) {
		wmanager.sendUSBData(data,winInstance,sourceOnly);
	}


}
 function UsbDeviceStruct(deviceInfo)
 {
 	this['vendorId'] = deviceInfo["vendorId"]?deviceInfo["vendorId"]:"";
 	this['productId'] = deviceInfo["productId"]?deviceInfo["productId"]:"";
 	this['device'] = deviceInfo["device"]?deviceInfo["device"]:"";
 	this['deviceName'] =deviceInfo["deviceName"]?deviceInfo["deviceName"]:"";
 	this['deviceOwner'] = deviceInfo["deviceOwner"]?deviceInfo["deviceOwner"]:"" ;//name of session where device is redirected
 	this['status'] =deviceInfo["status"];
 	this['unitId'] =deviceInfo["unitId"];
	this['nextOwner']=deviceInfo["nextOwner"]?deviceInfo["nextOwner"]:"" ;
 }