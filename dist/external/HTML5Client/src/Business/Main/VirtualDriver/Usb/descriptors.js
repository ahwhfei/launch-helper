var callbackWrapper = null;
//
//Request types from USB2.0 specification
//
var UsbRequest = {};
UsbRequest.GET_STATUS           = 0;
UsbRequest.CLEAR_FEATURE        = 1;
UsbRequest.SET_FEATURE          = 3;
UsbRequest.SET_ADDRESS          = 4;
UsbRequest.GET_DESCRIPTOR       = 6;
UsbRequest.SET_DESCRIPTOR       = 7;
UsbRequest.GET_CONFIGURATION    = 8;
UsbRequest.SET_CONFIGURATION    = 9;
UsbRequest.GET_INTERFACE        = 10;
UsbRequest.SET_INTERFACE        = 11;
UsbRequest.SYNC_FRAME           = 12;
UsbRequest.SET_ISOCH_DELAY      = 49;

//
// Feature Selector USB2.0 Specification
// Used for USbRequest.CLEAR_FEATURE/SET_FEATURE
//
var FeatureSelector = {};
FeatureSelector.ENDPOINT_HALT = 0;
FeatureSelector.DEVICE_REMOTE_WAKEUP = 1;
FeatureSelector.TEST_MODE = 2;

//
//Descriptor types USB2.0 Specification
//
var DescriptorType = {};
DescriptorType.DEVICE = 1;
DescriptorType.CONFIG = 2;
DescriptorType.STRING = 3;
DescriptorType.INTERFACE = 4;
DescriptorType.ENDPOINT = 5;
DescriptorType.DEVICE_QUALIFIER = 6;
DescriptorType.OTHER_SPEED_CONFIGURATION = 7;
DescriptorType.INTERFACE_POWER1 = 8;
DescriptorType.DEVICE_CAPABILITY = 16;


//
// Descriptor size USB2.0
//
var SIZE_INTERFACE_DESCRIPTOR = 9;
var SIZE_ENDPOINT_DESCRIPTOR = 7;

function Valid(type)
{
    if(
        (type == DescriptorType.DEVICE) ||
        (type == DescriptorType.CONFIG) ||
        (type == DescriptorType.ENDPOINT) ||
        (type == DescriptorType.INTERFACE)
        )
        return true;
    return false;
}

var DEFAULT_IN_SIZE = 256;

var DeviceList = {};//[];
var GlobalDeviceList ={};
var gNextUnitId = 1;

//
// Local definitions
//
var DEV_STAGE_ERROR = -1;
var DEV_STAGE_DEV = 1;
var DEV_STAGE_CONFIG = 2;
var DEV_STAGE_STR = 3;
var DEV_STAGE_COMPLETE = 4;

//
//Error status codes
//
var DeviceStatus = {};
DeviceStatus.STATUS_FAILED = -1;
DeviceStatus.STATUS_REDIR = 0;
DeviceStatus.STATUS_PENDING = 1;
DeviceStatus.STATUS_GONE = 2;
DeviceStatus.STATUS_REDIR_SUCCESS = 3;
DeviceStatus.STATUS_CLIENT_REDIR = 4;
DeviceStatus.STATUS_REJECTED    = 5;
DeviceStatus.STATUS_STOP    = 6;
DeviceStatus.STATUS_TRANSFER_RELEASING    = 7;
DeviceStatus.STATUS_TRANSFER_RELEASE    = 8;
DeviceStatus.STATUS_TRANSFER_RELEASED    = 9;
DeviceStatus.STATUS_RELEASE_ALL   = 10;
DeviceStatus.STATUS_SILENT_STOP=11;



function AddDeviceToList(usbDevice)
{

//The following if loop is not really necessary. This function is for updating the DeviceList. So if the element exists already, we delete the element and add it again.
  if(usbDevice['unitId'] in DeviceList)
  {
    delete DeviceList[usbDevice['unitId']];
  }
    DeviceList[usbDevice['unitId']] = usbDevice;
}

function GetNextDeviceId()
{
    return gNextUnitId++;     //simple one at the moment
}


function GetDeviceForId(unitId)
{
    return DeviceList[unitId];
}

function getUsbList(usbList)
{
  GlobalDeviceList = usbList;
}

function getUsbDevicesList(callbackWrapper1)
{
  
  //console.log("Get Usb Devices List is called in descriptor.js");
  callbackWrapper = callbackWrapper1;
   var data = {
						'cmd' : WorkerCommand.CMD_USB_SENDING_LIST,
						'deviceList' : GlobalDeviceList
					};
			data.source = callbackWrapper.WrapperId;
			callbackWrapper.processOtherWrapperCmd(data);
}

function transferDevice(device,callbackWrapper1)
{
    callbackWrapper = callbackWrapper1;
    var usbDevice={
                  'productId' : device['productId'],
    					  	'vendorId' : device['vendorId'],
    						  'crDevice' : device['device'],
    						  'unitId': device['unitId'],
    						  'status': DeviceStatus.STATUS_TRANSFER_RELEASING,
    						  'deviceOwner':device['deviceOwner'],
    						  'nextOwner':device['nextOwner'],
    						  'deviceName':device['deviceName']
    };
   sendDeviceUpdate(usbDevice,DeviceStatus.STATUS_TRANSFER_RELEASING); 
}



function releaseOtherSessionDevices(device,callbackWrapper1)
{
  callbackWrapper = callbackWrapper1;
    var usbDevice={
                  'productId' : device['productId'],
    					  	'vendorId' : device['vendorId'],
    						  'crDevice' : device['device'],
    						  'unitId': device['unitId'],
    						  'status': DeviceStatus.STATUS_RELEASE_ALL,
    						  'deviceOwner':device['deviceOwner'],
    						  'nextOwner':device['nextOwner'],
    						  'deviceName':device['deviceName']
    };
   sendDeviceUpdate(usbDevice,DeviceStatus.STATUS_RELEASE_ALL);
}

function closeSessionUsbDevices(sessionName,callbackWrapper1)
{
  callbackWrapper = callbackWrapper1;
   
   	var data = {
						'cmd' : WorkerCommand.USB_RELEASE_DEVICES,
            'sessionName': sessionName
					};
			data.source = callbackWrapper.WrapperId;
			callbackWrapper.processOtherWrapperCmd(data);
   
}

function RemoveDeviceFromList(usbDevice)
{
    if (DeviceList[usbDevice['unitId']] == usbDevice) {
        delete DeviceList[usbDevice['unitId']];
        if (gNextUnitId - 1 == usbDevice['unitId'])
            gNextUnitId--; //for single device this is helpful, change it afterwards
    }
}

function releaseDevice(device,status)
{ 
  writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|:RELEASING DEVICE"  );
  var usbDevice = GetDeviceForId(device['unitId']);
  if(device['status']===DeviceStatus.STATUS_FAILED){
    if(device['unitId'] in DeviceList)
    {
     
      DeviceList[device['unitId']]['status'] = DeviceStatus.STATUS_FAILED;
    }
  }

  if(usbDevice)
  {
    usbDevice['status'] = DeviceStatus.STATUS_GONE;
    usbEngine.sendDeviceGone(usbDevice['unitId']);
    if(usbDevice['deviceInstance']!= undefined)
    {
      chrome.usb.closeDevice(usbDevice['deviceInstance'], closecallback.bind(null, usbDevice));
    }
    RemoveDeviceFromList(usbDevice);
    device['unitId'] = 0;
    sendDeviceUpdate(usbDevice,status);
  }
}


function requestDeviceRejected(deviceId)
{
    var device = GetDeviceForId(deviceId);
    if (device !== null) {
        RemoveDeviceFromList(device);
        device['unitId'] = 0;
        if(device.status!==DeviceStatus.STATUS_TRANSFER_RELEASE)
         {
           sendDeviceUpdate(device,DeviceStatus.STATUS_REJECTED);
         }
         else
         {
           sendDeviceUpdate(device,DeviceStatus.STATUS_TRANSFER_RELEASED);
         }
    }
}

function requestDeviceAccepted(deviceId)
{
    var device = GetDeviceForId(deviceId);
    if (device !== null) {
        sendDeviceUpdate(device,DeviceStatus.STATUS_REDIR_SUCCESS);
    }
}


function closecallback(device)
{
	writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|:Device Closed Successfully " + device['deviceInstance'] );
	// we no longer need to cleanup this device upon close
	var current = chrome.app.window.current();
	if (current && backPage) {	
		backPage.SessionCleanupHelper.remove("usb", current, device['deviceInstance']);
	}
}

var monitorCallback = function (device, usbEvent) {
    if (chrome.runtime.lastError) {
        console.error('monitorCallback Error:', chrome.runtime.lastError);
    }

    if (usbEvent) {
        if (usbEvent['resultCode'] !== 0) {
            console.error('Error writing to device', usbEvent['resultCode']);
            device.status = DeviceStatus.STATUS_GONE;
            usbEngine.sendDeviceGone(device['unitId']);
            chrome.usb.closeDevice(device['deviceInstance'], closecallback.bind(null, device));
            RemoveDeviceFromList(device);
            sendDeviceUpdate(device,DeviceStatus.STATUS_GONE);
        }
    }
};

var _UsbActiveDeviceMonitor;
function StartMonitoring()
{
	if(_UsbActiveDeviceMonitor == null)
		_UsbActiveDeviceMonitor = setInterval(monitorDevices, 7000);
}
function StopMonitoring()
{
    clearInterval(_UsbActiveDeviceMonitor);
	_UsbActiveDeviceMonitor = null;
}

function monitorDevices()
{
  var usbDevice=null;
    for (var device in DeviceList)
    {
      usbDevice = DeviceList[device];
      if (usbDevice.status == DeviceStatus.STATUS_GONE) {
            //report to host device is gone
            //remove device from list
            //reclaim unitId

            //tbd - before sending response always check device is available in list
        }
        else {
            var ti = {
                'requestType': 'standard',
                'recipient': 'device',
                'direction': 'in',
                'request': UsbRequest.GET_STATUS,
                'value': 0,
                'index': 0,
                'length': 2,
                'data': new ArrayBuffer(2)
            };
            chrome.usb.controlTransfer(usbDevice['deviceInstance'], ti, monitorCallback.bind(null, usbDevice));
        }
    }
}

var backPage;
var Watcher = function (usbDevice) {
    var deviceInfo = {
        'vendorId': usbDevice['vendorId'],
        'productId': usbDevice['productId']
    };
    var callbackFindDevice = function (usbDevice, devices) {
      
        if (!devices || !devices.length|| usbDevice.status!=DeviceStatus.STATUS_PENDING) {
		 writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|:ERROR IN OPENING THE DEVICE"  );
            usbDevice.Helper(DEV_STAGE_ERROR);
            return;
        }
        usbDevice['deviceInstance'] = devices[0];
        try {
            chrome.usb.resetDevice(devices[0], onFirstReset.bind(null, usbDevice));
        } catch (error) {
        }

        StartMonitoring();
    };
    var onFirstReset = function (usbDevice, result) {
        if (!result || chrome.runtime.lastError) {
		     writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|:Failed to reset the device! " + chrome.runtime.lastError["message"] );
			 sendDeviceUpdate(usbDevice,DeviceStatus.STATUS_FAILED);
			 return;
        }
        try {
            if(usbDevice.status===DeviceStatus.STATUS_PENDING)
            {
              usbDevice.Init();
            }
            if (usbDevice.status == DeviceStatus.STATUS_GONE) {
                usbDevice.Helper(DEV_STAGE_COMPLETE);
            }
            else {
                usbDevice.Helper(DEV_STAGE_DEV);
            }
        }
        catch (error) {
			  writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|:ERROR: " + error.message );
        }
    };

    try {
      // Use actual device for API calls.
      var crDevice = usbDevice["crDevice"];
      chrome.usb.openDevice(crDevice, function(handle) {
        if (chrome.runtime.lastError) {
		  writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|:Failed to open the device " + chrome.runtime.lastError["message"] );
       	  sendDeviceUpdate(usbDevice,DeviceStatus.STATUS_FAILED);
       	  return;
        }
		
		// add device handle to cleanup list
		var current = chrome.app.window.current();
		if (current) {
			if (!backPage) {
				chrome.runtime.getBackgroundPage(function(bp){
					backPage = bp;
					backPage.SessionCleanupHelper.add("usb", current, handle);
				});
			} else {
				backPage.SessionCleanupHelper.add("usb", current, handle);
			}
		}

        chrome.usb.listInterfaces(handle, function(interfaces){
          if (chrome.runtime.lastError) {
			writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|:Failed to list interfaces " + chrome.runtime.lastError["message"] );
         	sendDeviceUpdate(usbDevice,DeviceStatus.STATUS_FAILED);
         	return;
          }

          var claimed = 0;
          for (var idx = 0; idx < interfaces.length; idx++) {
            chrome.usb.claimInterface(handle, interfaces[idx]["interfaceNumber"], function(){
              if (chrome.runtime.lastError) {
				writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|:Failed to claim an interface " + chrome.runtime.lastError["message"] );
             	sendDeviceUpdate(usbDevice,DeviceStatus.STATUS_FAILED);
             	return;
              }

              claimed++;
              if (claimed == interfaces.length) {
			    writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|:Claimed all interfaces" );
                callbackFindDevice(usbDevice, [handle]);
              }
            });
          }
        });
      });

      return DeviceStatus.STATUS_PENDING;
    }
    catch (error) {
        return DeviceStatus.STATUS_FAILED;
    }
};

//
// Build a device, permissions must be obtained for this beforehand
//
function BuildDevice(callbackWrapper1,productId, vendorId,crDevice,deviceStatus) {
	callbackWrapper = callbackWrapper1;
    var device = new UsbDevice();
    device.Init();

    device['vendorId'] = vendorId;
    device['productId'] = productId;
    device['crDevice'] = crDevice;
	device['deviceName'] = crDevice["productName"];
	if (!device['deviceName'] || device['deviceName'] === "") {
		device['deviceName'] = "Unknown product " + productId.toString(16) + ":" + vendorId.toString(16);
	}
   sendDeviceUpdate(device,deviceStatus);
    Watcher(device);
}


function UsbDevice() {
    var self = this;
    this['productId'] = 0;
    this['vendorId'] = 0;
    this['deviceClass'] = 0;
	  this['deviceName'] = "";
	  self['unitId'] = GetNextDeviceId();
	  AddDeviceToList(self);
    this.Init = function () {
        //self['unitId'] = 0;
        
        self.deviceDescriptor = null;
        self.configDescriptor = null;
        self.stringDescriptors = []; // Array of String Descriptors
        self.stringDescIndexes = [];
        self.stringDescriptorsCount = 0; //Count of String Descriptors
        self.clientCallback = null;
        self.status = DeviceStatus.STATUS_PENDING;

    };

    this.Helper = function (stage) {
        var bComplete = false;
        if (stage == DEV_STAGE_ERROR) {
            self.status = DeviceStatus.STATUS_FAILED;
            bComplete = true;
        }
        else {
            switch (stage) {
                case DEV_STAGE_DEV:
                    //build device_descriptor
					//writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|: Getting Device Descriptors " );
                    GetDescriptor(self, DescriptorType.DEVICE, 0, 0, DEFAULT_IN_SIZE);
                    break;
                case DEV_STAGE_CONFIG:
                    //build config_descriptor
					//writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|: Getting Config Descriptors" );
                    GetDescriptor(self, DescriptorType.CONFIG, 0, 0, DEFAULT_IN_SIZE);
                    break;
                case DEV_STAGE_STR:
                    //build string_0
					//writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|: Getting string Descriptors" );
                    if (self.stringDescriptorsCount < self.stringDescIndexes.length) {
                        var langId = 0;
                        if (self.stringDescriptorsCount > 0) {
                            langId = self.stringDescriptors[self.stringDescIndexes[0]].langId;
                        }
                        GetDescriptor(self, DescriptorType.STRING, self.stringDescIndexes[self.stringDescriptorsCount], langId, DEFAULT_IN_SIZE-1);
                    }
                    else {
                        bComplete = true;
                    }
                    break;
                case DEV_STAGE_COMPLETE:
                    //its a replug of the device, Is it good to do this?? probably not, we should re build device.
					//writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|: Got all descriptors" );
                    bComplete = true;
                    break;
                default:
                    self.status = DeviceStatus.STATUS_FAILED;
                    //notify the event handler
                    bComplete = true;
                    break;
            }
        }

        //
        //Notify caller of the error
        //
        if (bComplete) {

           writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|: GOT ALL THE DESCRIPTORS" );
        if (self.status != DeviceStatus.STATUS_FAILED && (self['unitId'] in DeviceList) &&DeviceList[self['unitId']].status===DeviceStatus.STATUS_PENDING) {
				 writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|: Sending Device Information to Server" );
                if (usbEngine.SendDevice(self)) {
                  	writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|: Device information sent to server!" );
                    self.status = DeviceStatus.STATUS_REDIR;
                    self['deviceOwner'] = document.title;
                    AddDeviceToList(self);
                    sendDeviceUpdate(self,DeviceStatus.STATUS_REDIR);
			   	}
                else{
                    self.status = DeviceStatus.STATUS_FAILED;
                    sendDeviceUpdate(self,DeviceStatus.STATUS_FAILED);
                }
            }
            else {
			
			writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:ENGINE:|: DIDN'T SEND DEVICE INFORMATION TO THE SERVER." );
            }
        }
    };
    //
    // Add other functions for interface details etc.
    //

}
function sendDeviceUpdate(device,status){
      
    	var data = {
						'cmd' : WorkerCommand.USB_UPDATE_DEVICE,
						'productId':device['productId'],
						'vendorId': device['vendorId'],
						'device':device['crDevice'],
						'deviceName':device['deviceName'],
						'status' : status,
						'unitId' : device['unitId'],
					  'deviceOwner' : device['deviceOwner'],
						'nextOwner': device['nextOwner']
					};
			data.source = callbackWrapper.WrapperId;
			callbackWrapper.processOtherWrapperCmd(data);
}
function DeviceDescriptor() {
    var self = this;

    /* Protocol START */
    this.bLength = 18;          //1 byte
    this.bDescriptorType = 0;   //1 byte
    this.bcdUSB = 0;            //2 byte
    this.bDeviceClass = 0;      //1 byte
    this.bDeviceSubClass = 0;   //1 byte
    this.bDeviceProtocol = 0;   //1 byte
    this.bMaxPacketSize0 = 0;   //1 byte
    this.idVendor = 0;          //2 byte
    this.idProduct = 0;         //2 byte
    this.bcdDevice = 0;         //2 byte
    this.iManufacturer = 0;     //1 byte
    this.iProduct = 0;          //1 byte
    this.iSerialNumber = 0;     //1 byte
    this.bNumConfigurations = 0; //1 byte
    /* Protocol END */

    this.configDesc = null;
    this.currentConfigcount = 0;
    this.stringDesc = new Array(3);
    this.currentStringDescCount = 0;
    this.addStringDesc = function (stringDesc)
    {
        self.stringDesc[self.currentStringDescCount++] = stringDesc;
    };
    this.addConfigDesc = function(configDesc)
    {
        self.configDesc[self.currentConfigcount++] = configDesc;
    };

    //Packed Descriptor
    this.packed = null;

    this.setHeader = function () {
        self.bLength = 18;
    };
    this.getWireSize = function()
    {
        return self.packed.length;
    };

    this.getWireData = function () {
        return self.packed;
    };

    this.buildDescriptor = function (data, length) {
        /*
        Store the packed data for wire frame
        */
        self.packed = new Int8Array(length);
        for (var i = 0; i < length; i++) {
            self.packed[i] = data[i];
        }

        var stream = new ByteReader(data, length);
        if (!stream) {
            throw 'Failed to create read stream';
        }
        self.bLength = stream.readByte();
        self.bDescriptorType = stream.readByte();
        self.bcdUSB = stream.readUInt16();
        self.bDeviceClass = stream.readByte();
        self.bDeviceSubClass = stream.readByte();
        self.bDeviceProtocol = stream.readByte();
        self.bMaxPacketSize0 = stream.readByte();
        self.idVendor = stream.readUInt16();
        self.idProduct = stream.readUInt16();
        self.bcdDevice = stream.readUInt16();
        self.iManufacturer = stream.readByte();
        self.iProduct = stream.readByte();
        self.iSerialNumber = stream.readByte();
        self.bNumConfigurations = stream.readByte();

        this.configDesc = new Array(self.bNumConfigurations);
    };

    this.traceDescriptor = function () {
    };
}


function ConfigDescriptor() {
    var self = this;
    /* Protocol - Start
    */
    this.bLength = 0;               //1 byte
    this.bDescriptorType = 2;        //1 byte
    this.wTotalLength = 0;          //2 byte
    this.bNumInterfaces = 0;        //1 byte
    this.bConfigurationValue = 0; //1 byte
    this.iConfiguration = 0;         //1 byte
    this.bmAttributes = 0;      //1 byte - bitmap
    this.bMaxPower = 0;         //1byte mA
    /* Protocol - End
    */

    this.interfaces = new Array();
    //Packed descriptor
    this.packed = null;

    this.getWireSize = function()
    {
        return self.packed.length;
    };

    this.getWireData = function()
    {
        return self.packed;
    };

    this.buildDescriptor = function (data, length) {
        //Store the packed descriptor
        self.packed = new Uint8Array(length);
        for (var i = 0; i < length;i++) {
          self.packed[i]=data[i];
        }

        var stream = new ByteReader(self.packed, length);
        if (!stream) {
            throw 'Failed ot create read stream';
        }
        var hdr = new commonDescriptor();
        hdr.buildDescriptor(stream, length);
        if (hdr.getDescriptorType() != DescriptorType.CONFIG)
            throw 'Invalid descriptor type';

        self.bLength = hdr.getLength();
        self.bDescriptorType = hdr.getDescriptorType();
        self.wTotalLength = stream.readUInt16();
        self.bNumInterfaces = stream.readByte();
        self.bConfigurationValue = stream.readByte();
        self.iConfiguration = stream.readByte();
        self.bmAttributes = stream.readByte();
        self.bMaxPower = stream.readByte();

        if (stream.remaining() >= SIZE_INTERFACE_DESCRIPTOR) {
            var ix = 0;

            while( ix < self.bNumInterfaces)
            {
                var chdr = new commonDescriptor();
                chdr.buildDescriptor(stream, length);
                if (chdr.getDescriptorType() != DescriptorType.INTERFACE) {
                    chdr.skipDescriptor(stream);
                    continue;
                }
                self.interfaces[ix] = new InterfaceDescriptor();
                self.interfaces[ix].buildDescriptor(chdr, stream, length);
                ix++;
            }
        }
    };

    this.traceDescriptor = function ()
    {
        for (var i = 0; i < self.bNumInterfaces; i++) {
            self.interfaces[i].traceDescriptor();
        }
    };
    this.fillDescriptor = function (data, length)
    {

    };
}

function InterfaceDescriptor()
{
    var self = this;
    /* Protocol - Start
    */
    this.bLength = 0; // 1 byte
    this.bDescriptorType = 0;//1 byte
    this.bInterfaceNumber = 0; //1 byte
    this.bAlternateSetting = 0; //1 byte
    this.bNumEndpoints = 0; //1 byte
    this.bInterfaceClass = 0; //1 byte
    this.bInterfaceSubClass = 0; //1 byte
    this.bInterfaceProtocol = 0; //1 byte
    this.iInterface = 0; // 1 byte
    /* Protocol - End
    */
    this.endpoints = new Array();
    this.buildDescriptor = function (hdr, stream, length) {
        self.bLength = hdr.getLength();
        self.bDescriptorType = hdr.getDescriptorType(); //stream.readByte();
        self.bInterfaceNumber = stream.readByte();
        self.bAlternateSetting = stream.readByte();
        self.bNumEndpoints = stream.readByte();
        self.bInterfaceClass = stream.readByte();
        self.bInterfaceSubClass = stream.readByte();
        self.bInterfaceProtocol = stream.readByte();
        self.iInterface = stream.readByte();
        if (self.bLength > SIZE_INTERFACE_DESCRIPTOR)
        {
            for (var x = 0; x < self.bLength - SIZE_INTERFACE_DESCRIPTOR; x++)
                var drain = stream.readByte();
        }

        var y = 0;
        while( y < self.bNumEndpoints )
            {
            var chdr = new commonDescriptor();
            chdr.buildDescriptor(stream, length);
            if (chdr.getDescriptorType() != DescriptorType.ENDPOINT) {
                chdr.skipDescriptor(stream);
                continue;
            }
            self.endpoints[y] = new EndpointDescriptor();
            self.endpoints[y].buildDescriptor(chdr, stream, length);
            y++;
        }

    };

    this.traceDescriptor = function () {
        for (var i = 0; i < self.bNumEndpoints; i++) {
            self.endpoints[i].traceDescriptor();
        }
    };
    this.fillDescriptor = function (data, length) {
    };
}

function commonDescriptor()
{
    var self = this;
    /*Protocol - Start
    */
    this.bLength = 0;
    this.bDescriptorType = 0;
    /* Protocol - end
    */
    this.draineddata = new Int8Array();
    this.buildDescriptor = function (stream, length) {
        self.bLength = stream.readByte();
        self.bDescriptorType = stream.readByte();
    };
    this.getLength = function () {
        return self.bLength;
    };
    this.getDescriptorType = function () {
        return self.bDescriptorType;
    };
    this.skipDescriptor = function (stream) {
        for (var i = 0; i < self.bLength-2; i++)
            self.draineddata[i] = stream.readByte();
    };
}

function EndpointDescriptor() {
    var self = this;
    /*
     * Protocol - Start
     */
    this.bLength = 0;           //1 byte
    this.bDescriptorType = 0; // 1 byte
    this.bEndpointAddress = 0; //1 byte
    this.bmAttributes = 0;   //1 byte
    this.wMaxPacketSize = 0; //2 byte
    this.bInterval = 0;      //1 byte 125us unit
    /*
     *   Protocol - End
     */

    this.buildDescriptor = function (hdr, stream, length) {
        self.bLength = hdr.getLength();
        self.bDescriptorType = hdr.getDescriptorType();
        self.bEndpointAddress = stream.readByte();
        self.bmAttributes = stream.readByte();
        self.wMaxPacketSize = stream.readUInt16();
        self.bInterval = stream.readByte();
    };
    this.traceDescriptor = function () {
    };
    this.fillDescriptor = function (data, length) {

    };
}

function EndpointCompanion() {
    var self = this;
    this.bLength = 0;//1 byte
    this.bDescriptorType = 0; //1 byte
    this.bMaxBurst = 0; //1 byte
    this.bmAttributes = 0;// 1byte bitmap
    this.wBytesPerInterval = 0; // 2 bytes

}
/*
StringDesc - wireframe
    index : 1;
    langid : 2
    string {
    bytelength : 2
    n*data
    }


    VarBuf - wireframe
    {
        bytelength :2
        data :N
    }

    PacketHdr - wireframe
    {
    bytecount : 4
    commandid : 1
    deviceid: 2;
    }

    device and config descriptor - wireframe same as usb protocol
    string, devic descriptor is varbuf
*/
function UnicodeStringDescriptor() {
    var self = this;
    this.bLength = 0; //1 byte
    this.bDescriptorType = 0; //1 byte
    this.bString = null;   //N

    //language id - // ICA protocol
    this.index = 0;  //1 byte
    this.langID = 0; // 2 byte
    //wire protocol 1 (index) + 2 (lang) + 2 (data length) + N( data)

    this.wireData = null;

    this.getWireSize = function () {
        return 1 + 2 + 2 + self.bString.length;
    };
    this.getWireData = function () {
        var offset = 0;
        self.wireData = new Int8Array(self.getWireSize());
        self.wireData[offset] = self.index; offset++;
        ByteWriter.WriteInt16ToBuffer(self.wireData, offset, self.langID); offset += 2;
        ByteWriter.WriteInt16ToBuffer(self.wireData, offset, self.bString.length); offset += 2;
        for (var x = 0; x < self.bString.length; x++) {
            self.wireData[offset++] = self.bString[x];
        }
        return self.wireData;
    };

    this.buildDescriptor = function (data, length, idx, langId)
    {
        if (length <= 0) {
            return;
        }
        self.index = idx;
        self.langId = langId;
        self.bLength = data[0];
        self.bDescriptorType = data[1];
        self.bString = new Int8Array(self.bLength-2);
        for (var x = 0; x < self.bLength-2; x++) {
            self.bString[x] = data[x + 2];
        }
        if (idx == 0) // this is langId
        {
          self.langId = (new Uint16Array(self.bString.buffer))[0];
        }
    };

    this.traceDescriptor = function () {
        var str = '';
        for (var i = 0; i < self.bString.length; i += 2) {
            var code = self.bString[i] | self.bString[i + 1] << 8;
            var str1 = String.fromCharCode(code);
            str = str.concat(str1);
        }
    };

    this.fillDescriptor = function () {

    };
}


function InitThread() { }
var usbEngine = null;

InitThread.Init = function (engine) {
    var path = createWorkerPath(THREADID.THREADUSB);
    var usbthread = new Worker(path);
    usbthread.onerror = function (event) {
    };
    usbEngine = engine;
    return usbthread;
};


/////////////////////////////////////////////////////////////////////
//
//          Device callback
//
///////////////////////////////////////////////////////////////////////
var descriptorCallback = function (req, usbEvent) {
    if (chrome.runtime.lastError) {
        console.error('sendCompleted Error:', chrome.runtime.lastError);
    }

try {
    var buf = null;
    if (usbEvent) {

        if (usbEvent['data']) {
            buf = new Uint8Array(usbEvent['data']);

            var arr = Array.prototype.slice.call(new Uint8Array(usbEvent['data']));

            switch(req['type'])
            {
                case DescriptorType.DEVICE:
                    req['device'].deviceDescriptor = new DeviceDescriptor();
                    req['device'].deviceDescriptor.buildDescriptor(buf, buf.length);
                    var i = 0;

                    req['device'].stringDescIndexes[i++] = 0; //Zero Index for LanguageId

                    if (req['device'].deviceDescriptor.iManufacturer !== 0) {
                        req['device'].stringDescIndexes[i++] = req['device'].deviceDescriptor.iManufacturer;
                    }

                    if (req['device'].deviceDescriptor.iProduct !== 0) {
                        req['device'].stringDescIndexes[i++] = req['device'].deviceDescriptor.iProduct;
                    }

                    if (req['device'].deviceDescriptor.iSerialNumber !== 0) {
                        req['device'].stringDescIndexes[i++] = req['device'].deviceDescriptor.iSerialNumber;
                    }
                    req['device'].Helper(DEV_STAGE_CONFIG);
                    break;

                case DescriptorType.CONFIG:
                    req['device'].configDescriptor = new ConfigDescriptor();
                    req['device'].configDescriptor.buildDescriptor(buf, buf.length);
                    req['device'].Helper(DEV_STAGE_STR);
                    break;

                case DescriptorType.STRING:
                    var strDesc = new UnicodeStringDescriptor();
                    strDesc.buildDescriptor(buf, buf.length, req['ti'].value & 0x00ff, req['ti'].index);
                    req['device'].stringDescriptors[req['device'].stringDescriptorsCount++] = strDesc;
                    req['device'].Helper(DEV_STAGE_STR);
                    strDesc.traceDescriptor();
                    break;

                default:
                    //invalid case
                    req['device'].Helper(DEV_STAGE_ERROR);
                    break;
            }
        }

        if (usbEvent['resultCode'] !== 0) {
            req['device'].Helper(DEV_STAGE_ERROR);
        }
    }
  }
  catch(error)
  {
    console.error('Error: '+error);
    sendDeviceUpdate(req['device'],DeviceStatus.STATUS_GONE);

  }
};

var GetDescriptor = function (usbDevice, descType, descIndex, wIndex, length) {

    var wVal = (descType << 8) | descIndex;

    if (descType != DescriptorType.DEVICE &&
        descType != DescriptorType.CONFIG &&
        descType != DescriptorType.STRING) {

        console.error('getdescriptr - error invalis descriptor type: ' + descType);
        return false;
    }

    var req = {
        'device': usbDevice,
        'type': descType,
        'ti': {
            'requestType': 'standard',
            'recipient': 'device',
            'direction': 'in',
            'request': UsbRequest.GET_DESCRIPTOR,
            'value': wVal,
            'index': wIndex,
            'length': length,
            'data': new ArrayBuffer(length)
        }
    };


    chrome.usb.controlTransfer(usbDevice['deviceInstance'], req['ti'], descriptorCallback.bind(null, req));
    return true;
};
