/*
 * USB Transfers protocol
 *
 * Copyright 2014 Citrix Systems, Inc. All rights reserved.
 */


var DIRECTION_MASK = 0x80;
var RECIPEINT_MASK = 0x1F;
var TYPE_MASK = 0x60;


function GetDevice(unitId)
{
    return DeviceList[unitId];
}

////////////////////////////////////////////////////////////////////////
//
//              Get String
//
////////////////////////////////////////////////////////////////////////
function gsStringDescriptor(index, langid, str, length) {
    var self = this;
    this.index = index;
    this.langid = langid;
    this.strlen = length;
    this.input = str;
    this.packed = null;

    this.buildDescriptor = function () {
        this.packed = new Uint8Array(self.strlen + 3);
        self.packed[0] = self.index;
        ByteWriter.WriteInt16ToBuffer(self.packed, 1, self.langid);
        ByteWriter.WriteInt16ToBuffer(self.packed, 3, self.strlen - 2);

        for (x = 0; x < self.strlen - 2; x++) {
            self.packed[x + 5] = self.input[x + 2];
        }
    };

    this.getWireSize = function () {
        return self.strlen + 3;
    };

    this.getWireData = function () {
        return self.packed;
    };
}

function requestGetString(packet) {

    var usbDevice = GetDevice(packet['deviceid']);
    if (usbDevice == null) {
        //todo - Do we send the device removal again
        usbEngine.sendUrbResponse(packet['urbhandle'], packet['deviceid'], URB_STATUS_FAILED, null, 0);
        return;
    }

    var req = {
        'urbhandle': packet['urbhandle'],
        'deviceid': packet['deviceid'],
        'handle': usbDevice['deviceInstance'],
        'gsdata': {
            'langid': packet['langid'],
            'index': packet['index']
        }
    };

    try {
        var index = req['gsdata']['index'];
        var langid = req['gsdata']['langid'];

        var val = (DescriptorType.STRING << 8) | index;

        var ti = {
            'requestType': 'standard',
            'recipient': 'device',
            'direction': 'in',
            'request': UsbRequest.GET_DESCRIPTOR,
            'value': val,
            'index': langid,
            'length': 256,
            'data': new ArrayBuffer(256)
        };

        chrome.usb.controlTransfer(usbDevice['deviceInstance'], ti, callbackGetString.bind(null, req));
    }
    catch (error) {
        console.log('error: ' + error.message);
    }
}

var callbackGetString = function (req, usbEvent) {

    if (chrome.runtime.lastError) {
		console.log('callbackGetString Error:', chrome.runtime.lastError);
    }
    var getsdesc = null;
    var errors = chrome.runtime.lastError;
    if (usbEvent) {
        if (usbEvent['data']) {
            var buf2 = new Uint8Array(usbEvent.data);
            getsdesc = new gsStringDescriptor(req['gsdata']['index'], req['gsdata']['langid'], buf2, usbEvent['data']['byteLength']);
            getsdesc.buildDescriptor();
        }
        if (usbEvent['resultCode'] !== 0) {
        }
        errors = usbEvent['resultCode'];
    }
    var status;
    try {
        if (errors === 0)
            status = URB_STATUS_SUCCESS;
        else if (errors == 4)
            status = URB_STATUS_STALLED;
        else
            status = URB_STATUS_FAILED;

        usbEngine.sendUrbResponse(req['urbhandle'], req['deviceid'], status, getsdesc ? getsdesc.getWireData() : null, getsdesc ? getsdesc.getWireSize() : 0);
    }
    catch (error) {
        console.log('callbackGetString:' + error.message);
    }
};



/////////////////////////////////////////////////////////////////////
//
//          Select Interface
//
/////////////////////////////////////////////////////////////////////
function requestSelectInterface(packet) {
    var usbDevice = GetDevice(packet['deviceid']);
    if (usbDevice == null) {
        //todo - Do we send the device removal again
        usbEngine.sendUrbResponse(packet['urbhandle'], packet['deviceid'], URB_STATUS_FAILED, null, 0);
        return;
    }

    var req = {
        'urbhandle': packet['urbhandle'],
        'deviceid': packet['deviceid'],
        'handle': usbDevice['deviceInstance'],
        'sidata': {
            'interface': packet['interface'],
            'alternate': packet['alternate']
        }
    };

    try {
        chrome.usb.claimInterface(req['handle'], req['sidata']['interface'], callbackSelectInterface.bind(null, req));
    }
    catch (error) {
        console.log('error: ' + error.message);
        var status = URB_STATUS_FAILED;
        if (error.number == 4) {
            status = URB_STATUS_STALLED;
        }
        usbEngine.sendUrbResponse(req['urbhandle'], req['deviceid'], status, null, 0);
    }
}

var callbackSelectInterface = function (req) {
	var status = URB_STATUS_SUCCESS;
	if (chrome.runtime.lastError) {
		console.log('callbackSelectInterface Error:', chrome.runtime.lastError);
		status = URB_STATUS_FAILED;
    }

    usbEngine.sendUrbResponse(req['urbhandle'], req['deviceid'], status, null, 0);
};


/////////////////////////////////////////////////////////////////////
//
//                      Control Transfer                           //
//
/////////////////////////////////////////////////////////////////////
function requestControl(packet) {
    
    var usbDevice = GetDevice(packet['deviceid']);
    if (usbDevice == null) {
        //todo - Do we send the device removal again
        usbEngine.sendUrbResponse(packet['urbhandle'], packet['deviceid'], URB_STATUS_FAILED, null, 0);
        return;
    }

    var recipient = 'reserved';
    var rx = packet['requesttype'] & RECIPEINT_MASK;

    switch (rx) {
        case 0:
            recipient = 'device';
            break;

        case 1:
            recipient = 'interface';
            break;

        case 2:
            recipient = 'endpoint';
            break;

        case 3:
            recipient = 'other';
            break;

        case 31:
            recipient = 'vendor';
            break;

        default:
            console.log('Reserved type: ' + rx);
            break;
    }

    var requesttype = 'reserved';
    var tx = packet['requesttype'] & TYPE_MASK;
    tx = tx >> 5;

    switch (tx) {
        case 0:
            requesttype = 'standard';
            break;

        case 1:
            requesttype = 'class';
            break;

        case 2:
            requesttype = 'vendor';
            break;

        default:
            console.log('Reserved request type');
            break;
    }

    console.log('control flags' + packet['flags']);

    var direction = (packet['flags'] & URB_DIRECTION_IN) ? 'in' : 'out';
    var req = {
      'packet':packet,
        'urbhandle': packet['urbhandle'],
        'deviceid': packet['deviceid'],
        'handle': usbDevice['deviceInstance'],
        'ti': {
            'requestType': requesttype,
            'recipient': recipient,
            'direction': direction,
            'request': packet['request'],
            'value': packet['value'],
            'index': recipient == 'endpoint' ? packet['endpoint'] : packet['index'],
            'length': packet['length'],
            'data': packet['data']['buffer']
        }
    };

  /*  console.log('ControlURB: type: ' + packet.requesttype + ' length: ' + packet.length + ' request: ' + packet.request + ' value: '
                + packet.value + ' index: ' + packet.index + ' urbhandle:' + packet.urbhandle + ' direction: ' + direction + ' recipient:' + recipient
                + ' requesttype: ' + requesttype + 'endpoint: ' + packet.endpoint);*/

    try {
        chrome.usb.controlTransfer(req['handle'], req['ti'], callbackCommonTransfer.bind(null, req));
    }
    catch (error) {
        //todo add error response back
        console.log('error: ' + error.message);
    }
}

var callbackCommonTransfer = function (req, usbEvent) {

    if (chrome.runtime.lastError) {
        console.log('callbackCommonTransfer Error: ', chrome.runtime.lastError);
    }
    var buf = null;
    var errors = usbEvent ? usbEvent['resultCode'] : chrome.runtime.lastError;
    if (usbEvent) {
        if (usbEvent['data']) {
            buf = new Uint8Array(usbEvent['data']);
            //console.log('Response Buffer: ' + buf.length, buf);
        }
        if (usbEvent['resultCode'] !== 0) {
            console.log('Error writing to device', usbEvent['resultCode']);
        }
        errors = usbEvent['resultCode'];
    }

    var status;
    var deviceGone = false;
    if (errors === 0)
        status = URB_STATUS_SUCCESS;
    else if (errors == 4)
        status = URB_STATUS_STALLED;
    else if(errors ==5)
      deviceGone = true;
    else
        status = URB_STATUS_FAILED;
    
    try {
      
      if(deviceGone) {
        usbEngine.sendDeviceGone(device['unitId']);
        console.log('Device is gone');
      }
      else {
        if (req['ti']['direction'] == 'out')
            usbEngine.sendUrbStatus(req['urbhandle'], req['deviceid'], status);
        else
            usbEngine.sendUrbResponse(req['urbhandle'], req['deviceid'], status, buf, buf ? buf.length : 0);
      }
    }
    catch (error) {
        console.log('error: ' + error.message);
    }
};

/////////////////////////////////////////////////////////////////
//
//
//      Isochronous Transfer
//
//
/////////////////////////////////////////////////////////////////

function requestIsoc(packet) {

    var usbDevice = GetDevice(packet['deviceid']);
    if (usbDevice == null) {
        //todo - Do we send the device removal again
        usbEngine.sendUrbResponse(packet['urbhandle'], packet['deviceid'], URB_STATUS_FAILED, null, 0);
        return;
    }

    var direction = (packet['flags'] & URB_DIRECTION_IN) ? 'in' : 'out';

    var req = {
        'urbhandle': packet['urbhandle'],
        'deviceid': packet['deviceid'], //tbd
        'handle': usbDevice['deviceInstance'], //tbd
        'isocdata': {
            'packets': packet['packetscount'],
            'packetLength': packets['packetlength']
        },
        'ti': {
            'direction': direction,
            'endpoint': packet['endpoint'],
            'length': packet['length'],
            'data': packet['data']['buffer']
        }
    };

   // console.log('IsocURB: length: ' + packet['length'], ' flags: ' + packet.flags + ' pkc ount: ' + packet.packetscount + 'direction: ' + direction);

    try {
        chrome.usb.isochronousTransfer(req['handle'], req['ti'], callbackCommonTransfer.bind(null, req));
    }
    catch (error) {
        //todo - send error response
        console.log('error: ' + error.message);
    }

}

//////////////////////////////////////////////////////////////////
//
//
//      Bulk Transfer
//
//
//////////////////////////////////////////////////////////////////

function requestBulk(packet) {

    var usbDevice = GetDevice(packet['deviceid']);
    if (usbDevice == null) {
        //todo - Do we send the device removal again
        usbEngine.sendUrbResponse(packet['urbhandle'], packet['deviceid'], URB_STATUS_FAILED, null, 0);
        return;
    }

    var direction = (packet['flags'] & URB_DIRECTION_IN) ? 'in' : 'out';
    var req = {
        'urbhandle': packet['urbhandle'],
        'deviceid': packet['deviceid'],
        'handle': usbDevice['deviceInstance'],
        'ti': {
            'direction': direction,
            'endpoint': packet['endpoint'],
            'length': packet['length'],
            'data': packet['data']['buffer']
        }
    };

    //console.log('BulkURB: UrbHandle: ' + packet.urbhandle + 'length: ' + packet.length);// todo for out transfers, packet.data);
    //console.log('Bulk flags: ' + packet.flags + ' endpoint: ' + packet.endpoint + ' direction: ' + direction);

    try {
        chrome.usb.bulkTransfer(req['handle'], req['ti'], callbackCommonTransfer.bind(null, req));
    }
    catch (error) {
        console.log('error: ' + error.message);
    }

}

//////////////////////////////////////////////////////////////////
//
//
//      Interrupt Transfer
//
//
////////////////////////////////////////////////////////////////////

function requestInterrupt(packet) {

    var usbDevice = GetDevice(packet['deviceid']);
    if (usbDevice == null) {
        //todo - Do we send the device removal again
        usbEngine.sendUrbResponse(packet['urbhandle'], packet['deviceid'], URB_STATUS_FAILED, null, 0);
        return;
    }

    var direction = (packet['flags'] & URB_DIRECTION_IN) ? 'in' : 'out';

    var req = {
        'urbhandle': packet['urbhandle'],
        'deviceid': packet['deviceid'], //tbd
        'handle': usbDevice['deviceInstance'], //tbd
        'ti': {
            'direction': direction,
            'endpoint': packet['endpoint'],
            'length': packet['length'],
            'data': packet['data']['buffer']
        }
    };

   // console.log('Interrupt: urbhandle' + packet.urbhandle + 'length: ' + packet.length, ' flags: ' + packet.flags + ' endpoint: ' + packet.endpoint + ' direction: ' + direction);

    try {
        chrome.usb.interruptTransfer(req['handle'], req['ti'], callbackCommonTransfer.bind(null, req));
    }
    catch (error) {
        console.log('error: ' + error.message);
        //todo - send error back to host
    }
}

/////////////////////////////////////////////////////////////////////////
//
//      Reset Device
//
/////////////////////////////////////////////////////////////////////////
var callbackResetDevice = function (success) {
    if (!success) {
        //todo - simulate device re-plug
        console.log('callbackResetDevice error: ', success);
    }
};

function requestResetDevice(deviceid)
{
    console.log('requesting reset on device');
    var usbDevice = GetDevice(deviceid);
    if (usbDevice == null) {
        //todo - Do we send the device removal again
        return;
    }

    try {
        chrome.usb.resetDevice(usbDevice['deviceInstance'], callbackResetDevice);
    }
    catch (error) {
        console.log('requestResetDevice'+error.message);
    }
}

/////////////////////////////////////////////////////////////////////////
//
// Reset Endpoint
//
/////////////////////////////////////////////////////////////////////////
var callbackResetEp = function (req, usbevent) {
    if (chrome.runtime.lastError) {
        console.log('callbackResetEp Error:', chrome.runtime.lastError);
    }
    //
    // No response is needed by host
    //
};

function requestResetEp(endpoint, deviceid) {

    console.log('requesting reset on device');
    var usbDevice = GetDevice(deviceid);
    if (usbDevice == null) {
        //todo - Do we send the device removal again
        return;
    }
    //todo - validate that endpoint is not isoc or default control
    var req = {
        'urbhandle': 0,
        'deviceid': deviceid,
        'handle': usbDevice['deviceInstance'],
        'ti': {
            'requestType': 'standard',
            'recipient': 'endpoint',
            'direction': 'out',
            'request': UsbRequest.CLEAR_FEATURE,
            'value': FeatureSelector.ENDPOINT_HALT,
            'index': endpoint,
            'length': 0,
            'data': new ArrayBuffer(0)
        }
        
    };
    try {
        chrome.usb.controlTransfer(req['handle'], req['ti'], callbackResetEp.bind(null,req));
    }
    catch (error)
    {
        console.error('control transfer error:'+error);
    }
}

////////////////////////////////////////////////////////////////////////
//
// Select Configuration
//
////////////////////////////////////////////////////////////////////////

function requestSelectConfig(packet) { //tbd - pass device

    console.log('requestSelectConfig - index: ' + packet['configidx']);
    
    var usbDevice = GetDevice(packet['deviceid']);
    if (usbDevice == null) {
        //todo - Do we send the device removal again
        return;
    }

    var req = {
        'urbhandle': packet['urbhandle'],
        'deviceid': packet['deviceid'], //tbd
        'handle': usbDevice['deviceInstance'], //tbd
        'ti': {
            'requestType': 'standard',
            'recipient': 'device',
            'direction': 'out',
            'request': UsbRequest.SET_CONFIGURATION,
            'value': packet['configidx'],
            'index': 0,
            'length': 0,
            'data': new ArrayBuffer(0)
        }
    };

    try {
        chrome.usb.controlTransfer(req['handle'], req['ti'], callbackCommonTransfer.bind(null, req));
    }
    catch (error) {
        console.log('error: ' + error.message);
    }
}