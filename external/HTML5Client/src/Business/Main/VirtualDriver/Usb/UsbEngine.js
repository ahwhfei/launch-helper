/**
 * This class implements the ICA Generic USB virtual channel client functionality.
 */

/*
 * USBProtocol.c - Definitions for the generic USB protocol.
 *
 * This file defines the protocol command numbers and other
 * protocol specified values.
 *
 * Copyright 2014 Citrix Systems, Inc. All rights reserved.
 */

/* Protocol Setup Packets */
var CMD_BIND_REQUEST_H2C            = 0x00;
var CMD_BIND_RESPONSE_C2H           = 0x01;
var CMD_BIND_COMMIT_H2C             = 0x02;

/* Device Negotiation Packets */
var CMD_ANNOUNCE_DEVICE_C2H         = 0x10;
var CMD_ANNOUNCE_DEVICE_VETOED_C2H  = 0x11;
var CMD_ACCEPT_DEVICE_H2C           = 0x12;
var CMD_REJECT_DEVICE_H2C           = 0x13;

/* Device Channel Packets */
var CMD_URB_STATUS_C2H              = 0x1F;
var CMD_URB_RESPONSE_C2H            = 0x20;
var CMD_GET_STRING_H2C              = 0x21;
var CMD_SELECT_CONFIGURATION_H2C    = 0x22;
var CMD_SELECT_INTERFACE_H2C        = 0x23;
var CMD_SEND_URB_CONTROL_H2C        = 0x24;
var CMD_SEND_URB_BULK_H2C           = 0x25;
var CMD_SEND_URB_INTERRUPT_H2C      = 0x26;
var CMD_SEND_URB_ISOCHRONOUS_H2C    = 0x27;

var CMD_URB_CANCEL_H2C              = 0x30;
var CMD_RESET_ENDPOINT_H2C          = 0x31;
var CMD_CLEAR_HALT_AND_RESET_ENDPOINT_H2C  = 0x32;
var CMD_RESET_DEVICE_H2C            = 0x33;
var CMD_STOP_DEVICE_C2H             = 0x34;
var CMD_STOP_DEVICE_RESPONSE_H2C    = 0x35;
var CMD_DEVICE_GONE_C2H             = 0x36;

/* Flags for URBs */
var URB_DIRECTION_IN        = 0x00000001;
var URB_SHORT_OK            = 0x00000002;
var URB_DEFAULT_PIPE        = 0x00000004;
var URB_START_TRANSFER_ASAP = 0x00000008;

/* Flags for device/hub speeds */
var URB_SPEED_MASK          = 0x0007;
var URB_LOW_SPEED           = 0x0000;
var URB_FULL_SPEED          = 0x0001;
var URB_HIGH_SPEED          = 0x0002;

var URB_HUB_SELF_POWERED    = 0x0008;

/* Status codes for responses */
var URB_STATUS_FAILED       = 0xFFFFFFFF;
var URB_STATUS_SUCCESS      = 0x00000000;
var URB_STATUS_CANCELLED    = 0x00000001;
var URB_STATUS_STALLED      = 0x00000002;
var URB_STATUS_GONE         = 0x00000003;
var URB_STATUS_IN_USE       = 0x00000004;
var URB_STATUS_BABBLE       = 0x00000005;

/* Capabilities */
var CAP_ISO_SUPPORTED       = 0x0001;
var CAP_HINT_AVOID_ISO_VIDEO	= 0x0002;
var CAP_HINT_AVOID_STILL_IMAGE  = 0x0003;


/* Size of standard packet header (bytecount, cmd, deviceId) */
var SIZEOF_PACKET_HEADER   = 7;

/* Size of response packet excl. data (header, urb, status, datalen) */
var SIZEOF_RESPONSE_PACKET = SIZEOF_PACKET_HEADER + 10;

var SIZEOF_CAPABILITY_HEADER = 4;
var SIZE_OF_VAR_HEADER = 2;


var gDevice;

function UsbHostCapability(capid)
{
    this.bytecount = 0;
    this.capabilityid = capid;
    this.data = null;
}

function UsbCapability(capid, datalength)
{
    var self = this;
    this.bytecount = datalength;
    this.capabilityid = capid;
    this.data = null;
    this.offset = 0;

    if(datalength !== 0 ){
      this.data = Int8Array(datalength);
    }
    this.StoreByte = function (buffer)
    {
        if (self.bytecount <= self.offset)
        {
          throw 'Buffer overrun';
        }
        self.data[self.offset++] = buffer;
    };
    this.CopyCapToBuffer = function(outbuffer, size)
    {
        if (self.bytecount > size)
        {
          return false;
        }
        for (var i = 0; i < size; i++)
        {
            outbuffer[i] = self.data[i];
        }
        return true;
    };
}

function UsbWritePacket(cmdId, deviceId, datalen)
{
	var self = this;
    this.bytecount = SIZEOF_PACKET_HEADER + datalen; //INT32 Current sizeof of protocol header + datalength
    this.command = cmdId;   //INT8 packetid
    this.deviceId = deviceId; //INT16 - deviceid
    this.offset = 0; //offset in data
    this.wiredata = new Uint8Array(self.bytecount);


    this.WriteHeader = function ()
    {
        if (!self.wiredata) {
            return false;
        }
        self.offset = 0;
        ByteWriter.WriteInt32ToBuffer(self.wiredata, self.offset, self.bytecount);
        self.offset += 4;
        self.wiredata[self.offset++] = self.command;
        ByteWriter.WriteInt16ToBuffer(self.wiredata, self.offset, self.deviceId);
        self.offset += 2;
        return true;
    };
    
    this.WriteInt16 = function (num)
    {
        //validate with bytecount
        ByteWriter.WriteInt16ToBuffer(self.wiredata, self.offset, num);
        self.offset += 2;
    };
    
    this.WriteInt8 = function (num)
    {
        //validate with bytecount
      self.wiredata[self.offset++] = num;
    };
    
    this.WriteInt32 = function(num)
    {
        ByteWriter.WriteInt32ToBuffer(self.wiredata, self.offset, num);
        self.offset += 4;
    };
    
    this.getWireData = function ()
    {
        return self.wiredata;
    };
}

var commitCaps;
var usbthread = null;

function UsbEngine(callbackWrapper1) {
    var callbackWrapper = callbackWrapper1;
    var processor = null;
    var myself = this;

    var vStream;
    var streamName = 'CTXGUSB';
    var streamSize = 0x1000; //tbd

    var createVirtualStream = function (streamName, streamSize) {
        var chnl = ChannalMap.virtualChannalMap[streamName];
        var stream = new VirtualStream(chnl, callbackWrapper, streamSize);
        return stream;
    };

    this.getStreamName = function () {
        return streamName;
    };

    this.SetStack = function () {
        vStream = createVirtualStream(streamName, streamSize);
        return vStream;
    };
    
    this.getVStream = function () {
        return vStream;
    };
    
    /**************************************************************************
     *                                                                        *
     * Runnable Interface Implementation                                      *
     *                                                                        *
     **************************************************************************/

    var driverShutdown = function () {
      closeDevices(true);
    };

    this.EndWriting = function endWriting(reason) {

    };

    var prevReadIndex = 0;

    this.Run = function run() {
        prevReadIndex = 0;
        vStream.RegisterCallback(this._Run);
    };

    this._Run = function _run() {
        var errorHandle = function () {
            vStream.setReadIndex(prevReadIndex);
            vStream.allocateSpace();
            vStream.compact();
        };

        try {
            while (vStream.Available() > 0) {
                /* Main processing */
                prevReadIndex = vStream.GetReadIndex();
                try {
                    processCommand();

                }
                catch (error) {
                    if (error == VirtualStreamError.NO_SPACE_ERROR) {
                        prevReadIndex = vStream.GetReadIndex();
                        errorHandle();
                        return;
                    }
                    else {
                        return;
                    }
                }

                prevReadIndex = vStream.GetReadIndex();
            }
        }
        catch (error) {
            throw error;
        }
    };
  
    var timeout;

    var cancelledURb = [];

    function MarkUrbCancelled(urbHandle)
    {
        cancelledURb[urbHandle] = true;
    }

    function RemoveCancelled(urbHandle)
    {
        cancelledURb.splice(cancelledURb.indexOf(urbHandle), 1);
    }

    function IsRequestCancelled(urbHandle)
    {
        if (cancelledURb[urbHandle] != null)
            return true;
        else
            return false;
    }
    
    function GetCaps()
    {
        var caparray = new Array();
        caparray[0] = new UsbCapability(CAP_ISO_SUPPORTED, 0);
        caparray[1] = new UsbCapability(CAP_HINT_AVOID_ISO_VIDEO, 0);
        caparray[2] = new UsbCapability(CAP_HINT_AVOID_STILL_IMAGE, 0);
        return caparray;
    }
    //
    //
    //      SENDERS
    //
    //
    var sendtimeout;
    this.SendDevice = function (usbDevice) {
        try {
            var wiresize = 4;

            wiresize += usbDevice.deviceDescriptor.getWireSize() + 2;//bytecount
            wiresize += usbDevice.configDescriptor.getWireSize() + 2;
            var sdsize = 0;
            for (var i = 0; i < usbDevice.stringDescriptorsCount; i++) {
                sdsize += usbDevice.stringDescriptors[i].getWireSize();
            }
            wiresize += sdsize + 2;

           var packet = new UsbWritePacket(CMD_ANNOUNCE_DEVICE_C2H, usbDevice['unitId'], wiresize);
            packet.WriteHeader();
            packet.WriteInt16(URB_FULL_SPEED);
            packet.WriteInt16(URB_HUB_SELF_POWERED | URB_FULL_SPEED);


            packet.WriteInt16(sdsize);
            var itr = 0;
            for (i = 0; i < usbDevice.stringDescriptorsCount; i++) {
                var sd = usbDevice.stringDescriptors[i].getWireData();
                for (itr = 0; itr < sd.length; itr++) {
                    packet.WriteInt8(sd[itr]);
                }
            }

            //
            //device desc
            //
            var dd = usbDevice.deviceDescriptor.getWireData();
            packet.WriteInt16(dd.length);
            for (itr = 0; itr < dd.length; itr++) {
                packet.WriteInt8(dd[itr]);
            }

            //
            //config desc
            //
            var cd = usbDevice.configDescriptor.getWireData();
            packet.WriteInt16(cd.length);

            for (itr = 0; itr < cd.length ; itr++) {
                packet.WriteInt8(cd[itr]);
            }
        }
        catch (error) {
            console.error('Invalid device');
            return false;
        }
        vStream.WriteByte(packet.getWireData(), 0, packet.bytecount);
        return true;
    };

    this.sendUrbStatus = function(urbhandle, deviceid, status)
    {
      try {
        var wiresize = 2 + 4;
        var packet = new UsbWritePacket(CMD_URB_STATUS_C2H, deviceid, wiresize);
        packet.WriteHeader();
        packet.WriteInt16(urbhandle);
        packet.WriteInt32(status);
        
        vStream.WriteByte(packet.getWireData(), 0, packet.bytecount);
      }
      catch (error) {
      }
    };
    
    this.sendDeviceGone = function (deviceid)
    {
        var wiresize = 0;
        var packet = new UsbWritePacket(CMD_DEVICE_GONE_C2H, deviceid, wiresize);
        packet.WriteHeader();

        vStream.WriteByte(packet.getWireData(), 0, packet.bytecount);
    };

    this.sendDeviceStopped = function (deviceid) {
        var wiresize = 0;
        var packet = new UsbWritePacket(CMD_STOP_DEVICE_C2H, deviceid, wiresize);
        packet.WriteHeader();

        vStream.WriteByte(packet.getWireData(), 0, packet.bytecount);
    };

    this.sendUrbResponse = function (urbhandle, deviceid, status, data)
    {
        if (IsRequestCancelled(urbhandle)) {
            data = null;
            length = 0;
            RemoveCancelled(urbhandle);
        }
        var length = (data!=null) ? data.length : 0;
        var bResponse = length > 0 ? true : false;
        
        try {
            var wiresize = 2 + 4 + length;
            if (bResponse > 0) {
                wiresize += 4; //
            }

            var packet = null;
            if(!bResponse)
                packet = new UsbWritePacket(CMD_URB_STATUS_C2H, deviceid, wiresize);
            else
                packet = new UsbWritePacket(CMD_URB_RESPONSE_C2H, deviceid, wiresize);

            packet.WriteHeader();
            packet.WriteInt16(urbhandle);
            packet.WriteInt32(status);
        
            if (length>0) {
                packet.WriteInt32(length);
                for (var x = 0; x < length ; x++) {
                    packet.WriteInt8(data[x]);
                }
            }
            var gClipPacketSize= 4096-4;
            var offset=0;
          var data= packet.getWireData();
          var packetbyteCount = packet.bytecount;
             while (packetbyteCount > gClipPacketSize) {
			     vStream.WriteByte(data, offset, gClipPacketSize);
			     offset += gClipPacketSize;
			     packetbyteCount -= gClipPacketSize;
		     }
		      vStream.WriteByte(data, offset, packetbyteCount);

        }
        catch (error) {
        }
    };

    /////////////////////////////////////////////
    //
    //      Receivers
    //
    ////////////////////////////////////////////
    function onBindRequest(bytecount, stream)
    {
        //remove server caps off the stream
        for (var i=0 ; i < bytecount - SIZEOF_PACKET_HEADER; i++)
        {
            var x = stream.readByte(); //tbd - handle later on, not needed for smartcards
        }
        var caps = GetCaps();
        var capsize = 0;
        for (i = 0; i < caps.length ; i++) {
            capsize += caps[i].bytecount;
            capsize += SIZEOF_CAPABILITY_HEADER;
        }

        var packet = new UsbWritePacket(CMD_BIND_RESPONSE_C2H, 0, capsize+SIZE_OF_VAR_HEADER);
        packet.WriteHeader();
        packet.WriteInt16(capsize);

        //validate result and allocation
        for ( i = 0; i < caps.length ; i++)
        {
            packet.WriteInt16(caps[i].bytecount);
            packet.WriteInt16(caps[i].capabilityid);
        }
        vStream.WriteByte(packet.getWireData(), 0, packet.bytecount);
    }
    
    function onBindCommit(datalength, stream)
    {
        if (datalength < SIZEOF_PACKET_HEADER)
        {
            return;
        }
        if (datalength == SIZEOF_PACKET_HEADER)
        {
            //good packet with no caps from host
            return;
        }
        commitCaps = new Array();
        var capcount = 0;
        var bytestoread = datalength - SIZEOF_PACKET_HEADER;
        var capslen = stream.readUInt16();
        while (bytestoread >= 4) //Cap block is atleast 4
        {
            var bytecount = stream.readUInt16();
            var capid = stream.readUInt16();
            if (bytecount === 0) {
                commitCaps[capcount++] = UsbHostCapability(capid);
            }
            else {
                var cap = UsbHostCapability(capid, bytecount);
                for (var i = 0; i < bytecount; i++)
                {
                    cap.StoreByte(stream.readByte());
                }
                commitCaps[capcount++] = cap;
            }
            bytestoread -= (SIZEOF_CAPABILITY_HEADER + bytecount); //Fixed size of bytecount + capid + variable cap data
        }
    }

  this.releaseDevice = function(device,status)
  {
    releaseDevice(device,status);
  };
   this.transferDevice = function(device)
  {
    transferDevice(device,callbackWrapper);
  };
   this.releaseOtherSessionDevices = function(device)
  {
    releaseOtherSessionDevices(device,callbackWrapper);
  };
  this.closeSessionUsbDevices = function(sessionName)
  {
    closeSessionUsbDevices(sessionName,callbackWrapper);
  };
  this.releaseAllDevices = function()
  {
    closeDevices(false);
  }
  
  this.preBuildDevice = function(productId,vendorId,device){
	 
			BuildDevice(callbackWrapper,productId, vendorId, device,DeviceStatus.STATUS_PENDING);
	 };
	 this.getUSbDevicelist = function(UsbDeviceList)
	 {
	   getUsbList(UsbDeviceList);
	 }
	 this.getUsblist = function()
	 {
	   getUsbDevicesList(callbackWrapper);
	 }
  
    function onGetString(bytecount, deviceid, stream) {
        var urbhandle = stream.readUInt16();
        var langid = stream.readUInt16();
        var index = stream.readByte();

        var packet = {
            'urbhandle': urbhandle,
            'deviceid': deviceid,
            'langid': langid,
            'index': index
        };
        requestGetString(packet);
    }

    function onSelectConfiguration(bytecount, deviceid, stream)
    {
        var urbhandle = stream.readUInt16();
        var configIndex = stream.readByte();
        var packet = {
            'urbhandle': urbhandle,
            'deviceid': deviceid,
            'configidx': configIndex
        };
        requestSelectConfig(packet);
    }
    
    function onSelectInterface(bytecount, deviceid, stream) {
        var urbhandle = stream.readUInt16();
        var intf = stream.readByte();
        var altenative = stream.readByte();

        var reqSelectIntf = {
            'urbhandle': urbhandle,
            'deviceid': deviceid,
            'interface': intf,
            'alternate': alter
        };
        requestSelectInterface(reqSelectIntf);
    }
    
    function onUrbControl(bytecount, deviceid, stream)
    {
        var urbhandle = stream.readUInt16();
        var endpoint = stream.readByte();
        var flags = stream.readUInt16();
        var requesttype = stream.readByte();
        var request = stream.readByte();
        var value = stream.readUInt16();
        var index = stream.readUInt16();

        var din = (flags & URB_DIRECTION_IN) !== 0 ? true : false;
        var datalength = 0;
        
        datalength = stream.readUInt32();
    
        var data = new Uint8Array(datalength);
        if (datalength !== 0 && !din) {
            for (var x = 0; x < datalength; x++)
            {
                data[x] = stream.readByte();
            }
        }

        var req = {
            'urbhandle': urbhandle,
            'deviceid': deviceid,
            'endpoint': endpoint,
            'flags': flags,
            'requesttype': requesttype,
            'request': request,
            'value': value,
            'index': index,
            'length': datalength,
            'data': data
        };
        requestControl(req);
    }

    function onUrbBulk(bytecount, deviceid, stream) {
        var urbhandle = stream.readUInt16();
        var endpoint = stream.readByte();
        var flags = stream.readUInt16();

        var din = (flags & URB_DIRECTION_IN) !== 0 ? true : false;
        var datalength = 0;

        datalength = stream.readUInt32();
        
        var data = new Uint8Array(datalength);
        if (datalength !== 0 && !din) {
            
            for (var x = 0; x < datalength; x++) {
                data[x] = stream.readByte();
            }
        }
        var req = {
            'urbhandle': urbhandle,
            'deviceid': deviceid,
            'endpoint': endpoint,
            'flags': flags,
            'length': datalength,
            'data':data
        };
        requestBulk(req);
    }
    
    function onUrbInterrupt(bytecount, deviceid, stream) {
        var urbhandle = stream.readUInt16();
        var endpoint = stream.readByte();
        var flags = stream.readUInt16();
        var din = (flags & URB_DIRECTION_IN) !== 0 ? true : false;
        var datalength = 0;

        datalength = stream.readUInt32();

        var data = new Uint8Array(datalength);
        if (datalength !== 0 && !din) {
            
            for (var x = 0; x < datalength; x++) {
                data[x] = stream.readByte();
            }
        }
        var req = {
            'urbhandle': urbhandle,
            'deviceid': deviceid,
            'endpoint': endpoint,
            'flags': flags,
            'length': datalength,
            'data': data
        };
        requestInterrupt(req);
    }

    function onUrbIsochronous(bytecount, deviceid, stream) {
        var data = null;
        var datalength = 0;

        var urbhandle = stream.readUInt16();
        var endpoint = stream.readByte();
        var flags = stream.readUInt16();
        var startframe = stream.readUInt32();
        var requestedat = stream.readUInt32();
        var numberofpackets = stream.readUInt16();

        var din = (flags & URB_DIRECTION_IN) !== 0 ? true : false;
        
        if (din) {
            stream.readUInt32();
        }
        else {
            datalength = stream.readUInt32();
        }
        var packetlength = 0;
        if (din) {
            for (var i = 0; i < numberofpackets; i++) {
                packetlength += stream.readUInt32();
            }
            if (packetlength !== 0) {
                data = new Uint8Array(packetlength);
                for (var x = 0; x < packetlength; x++) {
                    data[x] = stream.readByte();
                }
            }
        }
        
        if(data === null)
        {
          data = new Uint8Array(0);
        }
        
        var isocreq = {
            'urbhandle': urbhandle,
            'deviceid': deviceid,
            'endpoint': endpoint,
            'flags': flags,
            'length': datalength,
            'data': data,
            'packetscount': numberofpackets,
            'packetlength': packetlength
        };
        requestIsoc(isocreq);
    }
    
    function onUrbCancel(bytecount, deviceid, stream) {
        var urbhandle = stream.readUInt16();
        //tbd - Send message to worker and iterate to message queue and mark it for cancellation
    }
    
    function onResetEndpoint(bytecount, deviceid, stream) {
        var endpoint = stream.readByte();
        requestResetEp(endpoint, deviceid);
    }
    
    function onClearHaltandResetEndpoint(bytecount, deviceid, stream) {
        var endpoint = stream.readByte();
        requestResetEp(endpoint, deviceid);
    }
    
    function onResetDevice(bytecount, deviceid, stream) {
      requestResetDevice(deviceid);
    }
    
    function onStopDeviceResponse(bytecount, deviceid, stream) {
        var status = stream.readUInt32();
    }
    
    function onDeviceStopped(bytecount, deviceid, stream) {
    }
    function onDeviceRejected(deviceId, stream)
    {
        requestDeviceRejected(deviceId);
    }
	function onDeviceAccepted(deviceId)
    {
        CEIP.add('usb:used',true);
		requestDeviceAccepted(deviceId);
    }
    
    var ReadUsbPacket = {};
    ReadUsbPacket.commad = 0;
    ReadUsbPacket.deviceid = 0;
    ReadUsbPacket.bytecount = 0;
    ReadUsbPacket.data = null;

    var UsbBytesToRead = 0;
    var UsbRecvdPacket;
    var UsbPacketSize = 0;
    /**
     * Processes the commands as they come over the virtual channel.  This
     * method is currently designed to run continually in the thread.  This
     * consuming is synchronized by the vStream which blocks on any read until
     * data is available.
     */
    var processCommand = function () {
        //
        //TBD implement USB header protocol and a UsbReadPacket object
        //TBD Add validation for usb packet header
        //TODO - A packet may come in multiple reads, handle it accordingly
        //
        //subsequent validation will happen for each packet type
        var bytecount = 0;
        var command = 0;
        var deviceId = 0;
        var itr = 0;
        if (UsbBytesToRead == 0) {
          
            UsbPacketSize = vStream.ReadInt32();
             
            UsbBytesToRead = UsbPacketSize - 4;
            UsbRecvdPacket = new Uint8Array(UsbPacketSize);
            ByteWriter.WriteInt32ToBuffer(UsbRecvdPacket, 0, UsbPacketSize);

            for ( itr = UsbPacketSize - UsbBytesToRead ; UsbBytesToRead > 0; itr++)
            {
                UsbRecvdPacket[itr] = vStream.ReadByte();  //if read is beyond then it will throw
                UsbBytesToRead--;
            }
        }
        else {

            for (itr = UsbPacketSize - UsbBytesToRead ; UsbBytesToRead > 0; itr++) {
                UsbRecvdPacket[itr] = vStream.ReadByte(); //if read is beyond it will throw
                UsbBytesToRead--;
            }
        }

        if (UsbBytesToRead != 0)
            throw 'Malformed packet';

        var stream = new ByteReader(UsbRecvdPacket, UsbPacketSize);
        UsbRecvdPacket = null;
        UsbPacketSize = 0;

        bytecount = stream.readUInt32();
        command = stream.readByte();
        deviceId = stream.readUInt16();
        switch (command) {
            case CMD_BIND_REQUEST_H2C:
                onBindRequest(bytecount, stream);
				callbackWrapper.enableUSB();
                break;
            case CMD_BIND_COMMIT_H2C:
                onBindCommit(bytecount, stream);
                //At this point we will send a device to the host
                break;
            case CMD_ACCEPT_DEVICE_H2C:
                //no data packets, report to user
                onDeviceAccepted(deviceId);
                break;
            case CMD_REJECT_DEVICE_H2C:
                onDeviceRejected(deviceId, stream);
                break;
            case CMD_GET_STRING_H2C:
                onGetString(bytecount, deviceId, stream);
                break;
            case CMD_SELECT_CONFIGURATION_H2C:
                onSelectConfiguration(bytecount, deviceId, stream);
                break;
            case CMD_SELECT_INTERFACE_H2C:
                onSelectInterface(bytecount, deviceId, stream);
                break;
            case CMD_SEND_URB_CONTROL_H2C:
                onUrbControl(bytecount, deviceId, stream);
                break;
            case CMD_SEND_URB_BULK_H2C:
                onUrbBulk(bytecount, deviceId, stream);
                break;
            case CMD_SEND_URB_INTERRUPT_H2C:
                onUrbInterrupt(bytecount, deviceId, stream);
                break;
            case CMD_SEND_URB_ISOCHRONOUS_H2C:
                onUrbIsochronous(bytecount, deviceId, stream);
                break;
            case CMD_URB_CANCEL_H2C:
                onUrbCancel(bytecount, deviceId, stream);
                break;
            case CMD_RESET_ENDPOINT_H2C:
                onResetEndpoint(bytecount, deviceId, stream);
                break;
            case CMD_CLEAR_HALT_AND_RESET_ENDPOINT_H2C:
                onClearHaltandResetEndpoint(bytecount, deviceId, stream);
                break;
            case CMD_RESET_DEVICE_H2C:
                onResetDevice(bytecount, deviceId, stream);
                break;
            case CMD_STOP_DEVICE_RESPONSE_H2C:
                onStopDeviceResponse(bytecount, deviceId, stream);
                break;
            default:
                console.log('Unknown command: ' + command);
        }
    };

    this.writeBytes = function (packet, offset, length) {
        vStream.WriteByte(packet, offset, length);
    };

/**
* Initialize using any needed parameters in the profile, etc.
*/
    this.initialize = function () {
        //tbd - add a device here and send this device inside the session
        if (processor === null) {
            processor = new USbDeviceProcessor(callbackWrapper);
        }
        processor.initialize(this);
    };

    this.logoutRequest = function () {
        processor.logoutRequest();
    };
}

function onTabClose(event)
{
  closeDevices(true);
}

function ChromeUsbHelper()
{
  var self = this;
  
  this.close=function()
  {
    try {
      closeDevices();
    }
    catch(error)
    {
    }
  };
}