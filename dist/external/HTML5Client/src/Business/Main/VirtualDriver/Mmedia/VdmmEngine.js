function VdmmEngine(module) {

    var UNKNOWN_FORMAT = 0,
        THEORA_FORMAT = 1,
        H264_FORMAT = 2;

    var vStream;
    var prevReadIndex = 0;
    var vdmmCaps;
    var streamContexts = {};
    var myself = this;
	var webcamContext;
    
    var captureDevice;
    
    var FILE = "VdmmEngine.js"
    
    /**
     * @Command Bytes
     * @Command Initialization_Command_Bytes
     */
    var MMVD_CMD_BIND_REQUEST = 0x00,
        MMVD_CMD_BIND_RESPONSE = 0x80,
        MMVD_CMD_BIND_COMMIT = 0x01;
    /** 
     * @Command Stream_Context_Management_Command_Bytes
     */
    var MMVD_CMD_CREATE_CONTEXT_REQUEST = 0x02,
        MMVD_CMD_CREATE_CONTEXT_RESPONSE = 0x81,
        MMVD_CMD_CREATE_CONTEXT_RESPONSE_EX = 0x86,
        MMVD_CMD_UPDATE_CONTEXT = 0x03,
        MMVD_CMD_DESTROY_CONTEXT = 0x04,
        MMVD_CMD_CONTEXT_STATUS = 0x82;
    /** 
     * @Command Transmission_Command_Bytes
     */
    var MMVD_CMD_TRANSMIT = 0x05,
        MMVD_CMD_TRANSMIT_C2H = 0x85;
    /** 
     * @Command Stream_Control_Command_Bytes
     */
    var MMVD_CMD_CONTROL = 0x06,
        MMVD_CMD_CONTROL_C2H = 0x87;
    /** 
     * @Command Stream_Flow_Control_Command_Bytes
     */
    var MMVD_CMD_FLOW_ADJUSTMENT = 0x83;
    /**
     * @Command Stream_Flow_Amount_Command_Bytes
     * Stream Flow Amount Command Bytes
     */
    var MMVD_CMD_FLOW_AMOUNT = 0x84;

    /**
     * @Element Type Identifiers
     * @Identifiers - Element Type Capability
     */
    var CTXMM_MEDIA_STREAM_CONTEXT_HANDLE_INVALID = 0x00;
    var CTXMM_TYPE_CAPABILITY_MEDIA_STREAM_SECONDS_TO_BUFFER = 0x0;
    var CTXMM_TYPE_CAPABILITY_MAJOR_MEDIA_TYPE_SUPPORT = 0x1;
    var CTXMM_TYPE_CAPABILITY_C2H_MEDIA_STREAMS = 0x3;
    var CTXMM_TYPE_CAPABILITY_C2H_CONTROL = 0x4;
    var CTXMM_TYPE_CAPABILITY_FLOW_CONTROL_V3 = 0x5;
    var CTXMM_TYPE_CAPABILITY_MULTICAST = 0x6;
    var CTXMM_TYPE_CAPABILITY_SEEK = 0x7;
    /*
     * @Identifiers - Element Type Media Property
     */
    var CTXMM_TYPE_MEDIA_PROPERTY_ALLOCATOR = 0x00000000;
    var CTXMM_TYPE_MEDIA_PROPERTY_TYPE = 0x00000001;
    var CTXMM_TYPE_MEDIA_PROPERTY_PRIORITY = 0x00000002;
    var CTXMM_TYPE_MEDIA_PROPERTY_DEVICE = 0x00000003;
    var CTXMM_TYPE_MEDIA_PROPERTY_PREROLL_AMOUNT = 0x00000004;
    var CTXMM_TYPE_MEDIA_PROPERTY_FILENAME = 0x00000005;
    var CTXMM_TYPE_MEDIA_PROPERTY_SEGMENT = 0x00000006;
    var CTXMM_TYPE_MEDIA_PROPERTY_CHARACTERISTICS = 0x00000007;
    /**
     * @Identifiers - Element Type Media Sample
     */
    var CTXMM_TYPE_MEDIA_SAMPLE	= 0x00000000;
    var CTXMM_TYPE_MEDIA_SAMPLE_REFERENCE = 0x00000001;
    /**
     * @Identifiers - Element Type Media Control
     */
    var CTXMM_TYPE_MEDIA_CONTROL_PLAY				=	0x00000000;
    var CTXMM_TYPE_MEDIA_CONTROL_PAUSE				=	0x00000001;
    var CTXMM_TYPE_MEDIA_CONTROL_STOP				=	0x00000002;
    var CTXMM_TYPE_MEDIA_CONTROL_FLUSH				=	0x00000003;
    var CTXMM_TYPE_MEDIA_CONTROL_END_OF_STREAM		=	0x00000004;

    
    /**
     * CTXMM_STATUS types
     * @type type
     */
    var CTXMM_S_OK  = 0x00000000,
        CTXMM_E_FAIL = 0x80004005;


    var mmvdCmdHeader = {
            byteCount: 0,
            command: 0,
            flagsBitMask: 0
        },

        wireSize = {
            cmdHeader: 4,
            elementHeader: 8,
            
            cmdBindRequest: 4,
            cmdCtxRequest: 16,
            cmdCtxResponse: 16,
            cmdCtxResponseEx: 20,
            cmdCtxDestroy: 8,
            cmdTransmit: 12,
            cmdControl: 12,
            
            //
            mediaPropertyAllocator: 16,
            mediaPropertyType: 64,
            mediaPropertyDevice: 12,
            
            // samples
            mediaSampleElement: 32
        };

    /**
     * @Object for debug purpose (internal use)
     * @type String|String|String|String|String|String|String
     */
    var commandText = {};
    commandText[MMVD_CMD_BIND_REQUEST] = "MMVD_CMD_BIND_REQUEST";
    commandText[MMVD_CMD_BIND_COMMIT] = "MMVD_CMD_BIND_COMMIT";
    commandText[MMVD_CMD_CREATE_CONTEXT_REQUEST] = "MMVD_CMD_CREATE_CONTEXT_REQUEST";
    commandText[MMVD_CMD_UPDATE_CONTEXT] = "MMVD_CMD_UPDATE_CONTEXT";
    commandText[MMVD_CMD_DESTROY_CONTEXT] = "MMVD_CMD_DESTROY_CONTEXT";
    commandText[MMVD_CMD_TRANSMIT] = "MMVD_CMD_TRANSMIT";
    commandText[MMVD_CMD_CONTROL] = "MMVD_CMD_CONTROL";
    
    var mediaPropertyText = {}; 
    mediaPropertyText[CTXMM_TYPE_MEDIA_PROPERTY_ALLOCATOR] = "CTXMM_TYPE_MEDIA_PROPERTY_ALLOCATOR";
    mediaPropertyText[CTXMM_TYPE_MEDIA_PROPERTY_TYPE] = "CTXMM_TYPE_MEDIA_PROPERTY_TYPE";
    mediaPropertyText[CTXMM_TYPE_MEDIA_PROPERTY_PRIORITY] = "CTXMM_TYPE_MEDIA_PROPERTY_PRIORITY";
    mediaPropertyText[CTXMM_TYPE_MEDIA_PROPERTY_PREROLL_AMOUNT] = "CTXMM_TYPE_MEDIA_PROPERTY_PREROLL_AMOUNT";
    mediaPropertyText[CTXMM_TYPE_MEDIA_PROPERTY_DEVICE] = "CTXMM_TYPE_MEDIA_PROPERTY_DEVICE";
    mediaPropertyText[CTXMM_TYPE_MEDIA_PROPERTY_FILENAME] = "CTXMM_TYPE_MEDIA_PROPERTY_FILENAME";
    mediaPropertyText[CTXMM_TYPE_MEDIA_PROPERTY_SEGMENT] = "CTXMM_TYPE_MEDIA_PROPERTY_SEGMENT";
    mediaPropertyText[CTXMM_TYPE_MEDIA_PROPERTY_CHARACTERISTICS] = "CTXMM_TYPE_MEDIA_PROPERTY_CHARACTERISTICS";
    
    var mediaControlText = {};
    mediaControlText[CTXMM_TYPE_MEDIA_CONTROL_PLAY] = "CTXMM_TYPE_MEDIA_CONTROL_PLAY";
    mediaControlText[CTXMM_TYPE_MEDIA_CONTROL_PAUSE] = "CTXMM_TYPE_MEDIA_CONTROL_PAUSE";
    mediaControlText[CTXMM_TYPE_MEDIA_CONTROL_STOP] = "CTXMM_TYPE_MEDIA_CONTROL_STOP";
    mediaControlText[CTXMM_TYPE_MEDIA_CONTROL_FLUSH] = "CTXMM_TYPE_MEDIA_CONTROL_FLUSH";
    mediaControlText[CTXMM_TYPE_MEDIA_CONTROL_END_OF_STREAM] = "CTXMM_TYPE_MEDIA_CONTROL_END_OF_STREAM";
    
    function Log(data) {
        console.log(FILE + ": " + data);
    }
    
    this.mmvdSendSampleToHost = function mmvdSendSampleToHost(frameArray) {
        
        if (!frameArray || frameArray.byteLength === 0) {
            console.info("no sample to send to host");
            return;
        }
    
        var frame = new Uint8Array(frameArray);
        var staticSize = wireSize.cmdTransmit + wireSize.elementHeader + wireSize.mediaSampleElement;
        var maxRawPerPacketSize = 4000; // TBD - Query from wd
        
        var movingOffset = 0;
        var residual = frame.byteLength % maxRawPerPacketSize;
        var packetCount = Math.floor(frame.byteLength / maxRawPerPacketSize) + ((residual !== 0) ? 1 : 0);
        
        for (var ctr = 0; ctr < packetCount; ctr++) {
            
            var offset = 0;
            var lastpkt = ((ctr + 1) === packetCount) ? true : false;
            var samplebytes = lastpkt ? (frame.byteLength - movingOffset) : maxRawPerPacketSize;
            var byteCount = samplebytes + wireSize.cmdHeader;
            
            if (ctr === 0) {    // first packet
                byteCount += staticSize;
            }

            var buffer = new Uint8Array(byteCount);
            
            // MMVD_CMD_HEADER         
            offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, byteCount);
            buffer[offset++] = MMVD_CMD_TRANSMIT_C2H;
            buffer[offset++] = lastpkt? 0x00 : 0x01;
        
            if (ctr == 0) { // first packet
                // MMVD_CMD_CONTROL Header for C2H
                offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, webcamContext.majorHandle);  // major handle
                offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, webcamContext.minorHandle);  // 
                offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, wireSize.cmdTransmit);      // offset control element
                buffer[offset++] = 1;   // one sample control element
                buffer[offset++] = 0;

                // Element Header
                var elementSize = wireSize.elementHeader + wireSize.mediaSampleElement + frame.byteLength;
                offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, elementSize);                // byte count
                offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, CTXMM_TYPE_MEDIA_SAMPLE);    // type

                // MEDIA SAMPLE element structure
                var MMMS_AM_VIDEO_FLAG_INTERLEAVED_FRAME = 0x0000;
                var MMMS_AM_STREAM_MEDIA = 0x00;

                offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, MMMS_AM_VIDEO_FLAG_INTERLEAVED_FRAME);                
                offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, MMMS_AM_STREAM_MEDIA);                
                offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, 0);                
                offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, 0);                
                offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, 0);                
                offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, 0);                
                offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, MMMS_AM_STREAM_MEDIA);                
                offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, frame.byteLength);                
            } 
            for (var i = 0; movingOffset < frame.byteLength && i < maxRawPerPacketSize; i++) //Handle extended packet 
            {
                buffer[offset++] = frame[movingOffset++];
            }
            //buffer.set(new Uint8Array(frame), offset, frame.byteLength);
            module.queueVirtualWrite(buffer, 0, buffer.byteLength)
        }        
    };
    
    function onMmvdCmdControl() {
        var majorHandle = vStream.ReadInt32();
        var minorHandle = vStream.ReadInt32();
                
        var context = streamContexts[majorHandle][minorHandle];
        
        var elementOffset = vStream.ReadUInt16();
        var elementCount = vStream.ReadUInt8();
        vStream.ReadUInt8();    // reserved
        
        if (elementOffset > wireSize.mmvdCmdControl) {
            vStream.SkipByte(elementOffset - wireSize.mmvdCmdControl);
        }
        
        for (var i = 0; i < elementCount; i++) {
            var byteCount = vStream.ReadInt32();
            var type = vStream.ReadInt32();
            var bytesRead = wireSize.elementHeader;
            console.log(mediaControlText[type] + " " + byteCount);
            switch(type) {
                case CTXMM_TYPE_MEDIA_CONTROL_PLAY:
                    if (context) {
                        context.device.play();
                    }
                    break;
                    
                case CTXMM_TYPE_MEDIA_CONTROL_PAUSE: 
                    if (context) {
                        context.device.pause();
                    }
                    break;
                    
                case CTXMM_TYPE_MEDIA_CONTROL_STOP:
                    if (context) {
                        context.device.stop();
                    }
                    break;
                    
                case CTXMM_TYPE_MEDIA_CONTROL_FLUSH:
                case CTXMM_TYPE_MEDIA_CONTROL_END_OF_STREAM:
                    break;
                
                default:
                    break;
            }
            
            vStream.SkipByte(byteCount - bytesRead);           
        }        
    }
    
    function CTXMM_GUID(data1, data2, data3, data4) {
        this.data1 = data1? data1 : 0;
        this.data2 = data2? data2 : 0;
        this.data3 = data3? data3 : 0;
        this.data4 = new Uint8Array(8);
        if (data4) {
           this.data4.set(data4); 
        }
    }
    
    CTXMM_GUID.prototype.printGuid = function() {
        console.log("{ 0x" + this.data1.toString(16) + ", " + this.data2.toString(16) + ", " + this.data3.toString(16) + ", " +
               "0x"+ this.data4[0].toString(16) + " 0x" + this.data4[1].toString(16) + " 0x" + this.data4[2].toString(16) + " 0x" + this.data4[3].toString(16) + " 0x" +
               " 0x" +this.data4[4].toString(16) + " 0x" + this.data4[5].toString(16) + " 0x" + this.data4[6].toString(16) + " 0x" + this.data4[7].toString(16) + " }");
    };
    
    CTXMM_GUID.prototype.readFromStream = function(stream) {
        this.data1 = vStream.ReadInt32();
        this.data2 = vStream.ReadUInt16();
        this.data3 = vStream.ReadUInt16();
        this.data4 = new Uint8Array(8);
        this.data4[0] = vStream.ReadUInt8();
        this.data4[1] = vStream.ReadUInt8();
        this.data4[2] = vStream.ReadUInt8();
        this.data4[3] = vStream.ReadUInt8();
        this.data4[4] = vStream.ReadUInt8();
        this.data4[5] = vStream.ReadUInt8();
        this.data4[6] = vStream.ReadUInt8();
        this.data4[7] = vStream.ReadUInt8();
    };
    
    // TODO: Check complete GUID
    CTXMM_GUID.prototype.getFormat = function() {
        if (this.data1 ===  0x34363248) {
            return H264_FORMAT;
        } else if (this.data1 === -0x2edb4d4f) {
            return THEORA_FORMAT;
        } else {
            return UNKNOWN_FORMAT;
        }        
    };
 
    CTXMM_GUID.prototype.writeToBuffer = function(buffer, offset) {
        // todo check if there enough buffer byteLength available
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.data1);
        offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, this.data2);
        offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, this.data3);
        buffer[offset++] = this.data4[0];
        buffer[offset++] = this.data4[1];
        buffer[offset++] = this.data4[2];
        buffer[offset++] = this.data4[3];
        buffer[offset++] = this.data4[4];
        buffer[offset++] = this.data4[5];
        buffer[offset++] = this.data4[6];
        buffer[offset++] = this.data4[7];
        return offset;
    };
    
    function onMmvdDestroyContext() {
        var majorHandle = vStream.ReadInt32();
        var minorHandle = vStream.ReadInt32();
        
        console.info("DeleteContext " + majorHandle + ", " + minorHandle);
        if (webcamContext && webcamContext.majorHandle === majorHandle && webcamContext.minorHandle === minorHandle) {
            webcamContext = null;
            // todo handle context all and invalid handles
            var context = streamContexts[majorHandle][minorHandle];
            if (context && context.device) {
                context.device.stop();
            }
            captureDevice.releaseDevice(context);
            delete streamContexts[majorHandle][minorHandle];    
        }
    }
    
    function onMmvdCreateContext() {
        var context = {}; 
        context.majorHandle = vStream.ReadInt32();
        context.minorHandle = vStream.ReadInt32();
        context.queueSize = vStream.ReadInt32();

        Log("MajorHandle " + context.majorHandle + ", MinorHandle " + context.minorHandle);
        // Read Media property element count
        var elementOffset = vStream.ReadUInt16();
        var elementCount = vStream.ReadUInt8();
        vStream.ReadUInt8(); // reserved
        
        if (elementOffset > wireSize.cmdCtxRequest) {
            vStream.SkipByte(elementOffset - wireSize.cmdCtxRequest);
        }
        
        context.mediaPropertyType = [];
        context.mediaFormats = 0;
                       
        // Read media property elements
        for (var i = 0; i < elementCount; i++) {
            var byteCount = vStream.ReadInt32();
            var type = vStream.ReadInt32();
            var bytesRead = wireSize.elementHeader;
            //Log(mediaPropertyText[type] + " " + byteCount);
            switch (type) {
                case CTXMM_TYPE_MEDIA_PROPERTY_ALLOCATOR:
                    break;
                case CTXMM_TYPE_MEDIA_PROPERTY_TYPE:
                    var propertyType = {};
                    propertyType.majorMediaType = new CTXMM_GUID();   
                        propertyType.majorMediaType.readFromStream();
                    
                    propertyType.minorMediaType = new CTXMM_GUID();                    
                        propertyType.minorMediaType.readFromStream();
                    
                    var format = propertyType.minorMediaType.getFormat();
                    context.mediaFormats |= format;
                    
                    propertyType.mediaFormatType = new CTXMM_GUID();
                        propertyType.mediaFormatType.readFromStream();
                    
                    propertyType.mediaFormatByteCount = vStream.ReadInt32();
                    propertyType.fixedSizeSamples = vStream.ReadInt32();
                    propertyType.temporalCompression = vStream.ReadInt32();
                    propertyType.sampleByteCount = vStream.ReadInt32();
                                                           
                    context.mediaPropertyType.push(propertyType);
                    bytesRead += 64;
                    break;

                case CTXMM_TYPE_MEDIA_PROPERTY_PRIORITY: 
                    context.mediaPropertyPriority = vStream.ReadInt32();
                    bytesRead += 4;
                    break;
                    
                case CTXMM_TYPE_MEDIA_PROPERTY_PREROLL_AMOUNT:
                    break;
                    
                case CTXMM_TYPE_MEDIA_PROPERTY_DEVICE:
                    // If media property device exists then it is from client to host stream
                    context.clientToHostStream = true;
                    context.mediaPropertyDevice = {};
                    context.mediaPropertyDevice.oDeviceName = vStream.ReadUInt16();                                                         
                    context.mediaPropertyDevice.oFriendlyName = vStream.ReadUInt16();
                    context.mediaPropertyDevice.deviceNameByteCount = vStream.ReadInt32();
                    context.mediaPropertyDevice.friendlyNameByteCount = vStream.ReadInt32();
                    bytesRead += 12;
                    
                    if (context.mediaPropertyDevice.oDeviceName !== wireSize.mediaPropertyDevice) {
                        vStream.SkipByte(context.mediaPropertyDevice.oDeviceName = wireSize.mediaPropertyDevice)
                    }
                    
                    if (context.mediaPropertyDevice.deviceNameByteCount > 0) {
                        Log("TODO: Read device name");
                    } else {
                        //Log("Device name not available");
                    }
                    
                    if (context.mediaPropertyDevice.friendlyNameByteCount > 0) {
                        Log("TODO: Read device friendly name");
                    } else {
                        //Log("Device friendly name not available");
                    }
                    
                    break;
                    
                default:
                    break;
            }
            
            vStream.SkipByte(byteCount - bytesRead);
        }

        Log("VDA Supported Encoder Formats " + context.mediaFormats.toString(16));
        
        var offset = 0;
        var responseSize;
        var buffer;
        if (//context.majorHandle === CTXMM_MEDIA_STREAM_CONTEXT_HANDLE_INVALID ||
            context.minorHandle === CTXMM_MEDIA_STREAM_CONTEXT_HANDLE_INVALID || !context.clientToHostStream ||
            webcamContext) {    // check for earlier context 
            
            responseSize = wireSize.cmdHeader + wireSize.cmdCtxResponse;
            buffer = new Uint8Array(responseSize);
            
            // MMVD_CMD_HEADER 
            offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, responseSize);   // byteCount
            buffer[offset++] = MMVD_CMD_CREATE_CONTEXT_RESPONSE;                    // command
            buffer[offset++] = 0;                 
            
            // MMVD_CMD_CREATE_CONTEXT_RESPONSE
            offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, context.majorHandle)  // major handle
            offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, context.minorHandle)  // minor handle
            offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, CTXMM_E_FAIL);    // STATUS_FAIL
            offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, 0);    // Burst byte count
            
            // write to wire
            module.queueVirtualWrite(buffer, 0, buffer.byteLength);           
        } else {
            // If major context exists then add only the minor context within the major
            // context else add both major and minor contexts to the list
            if (!streamContexts[context.majorHandle]) {
                streamContexts[context.majorHandle] = {};            
            }
            streamContexts[context.majorHandle][context.minorHandle] = context;
           
            captureDevice.initializeDevice(context);
            webcamContext = context;
        }
    }
    
    this.mmvdSendContextResponse = function mmvdSendContextResponse(formatBlock, format) {        
        
        var offset = 0;
        var responseSize;
        var buffer;
		var context = webcamContext;
        // send response of structure
        // 1. MMVD_CMD_HEADER
        // 2. MMVD_CMD_CONTEXT_RESPONSE_EX (with 2 media properties a) allocator (mandatory for XA6.5) b) type
        // 3. Media Property Allocator
        // 4. Media Property Type
        var responseFixedSize = wireSize.cmdHeader + wireSize.cmdCtxResponseEx;
        responseSize = responseFixedSize + 2 * wireSize.elementHeader + wireSize.mediaPropertyType + wireSize.mediaPropertyAllocator +  formatBlock.byteLength; 
        buffer = new Uint8Array(responseSize);

        // MMVD_CMD_HEADER 
        offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, responseSize);   // byteCount
        buffer[offset++] = MMVD_CMD_CREATE_CONTEXT_RESPONSE_EX;                    // command
        buffer[offset++] = 0;                 

        // MMVD_CMD_CREATE_CONTEXT_RESPONSE
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, context.majorHandle)  // major handle
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, context.minorHandle)  // minor handle
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, CTXMM_S_OK);          // STATUS_SUCCESS
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, Math.ceil(352 * 288 * 3)); // Queue byte count TODO: queue calc
        offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, responseFixedSize);  // property elements offset
        buffer[offset++] = 2;   // element count
        buffer[offset++] = 0;   // reserved
        
        // Element header for Allocator
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, wireSize.elementHeader + wireSize.mediaPropertyAllocator);   // ByteCount
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, CTXMM_TYPE_MEDIA_PROPERTY_ALLOCATOR);                             // Element type
        // Media property element Allocator
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, 8);
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, Math.ceil(352 * 288 * 3));
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, 1);
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, 0);

        // Element header for Type
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, wireSize.elementHeader + wireSize.mediaPropertyType + formatBlock.byteLength); //wireSize_VideoInfoHeader);               // ByteCount
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, CTXMM_TYPE_MEDIA_PROPERTY_TYPE);                                    // Element type
        // Media property element Type
        var guid = new CTXMM_GUID(0x73646976, 0x0000, 0x0010, [0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71]); // MEDIATYPE_Video;
        offset = guid.writeToBuffer(buffer, offset);
        
        if (format === H264_FORMAT) { 
            guid = new CTXMM_GUID(0x34363248, 0x0000, 0x0010, [0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71]);     // MEDIASUBTYPE_H264
        } else { // TODO check if unknown failure status / format
            guid = new CTXMM_GUID(0xd124b2b1, 0x8968, 0x4ae8, [0xb2, 0x88, 0xfe, 0x16, 0xea, 0x34, 0xb0, 0xce]);     // MEDIASUBTYPE_Theora
        }
        offset = guid.writeToBuffer(buffer, offset);
        
        if (format === H264_FORMAT) { // H264
            guid = new CTXMM_GUID(0x0f6417d6, 0xc318, 0x11d0, [0xa4, 0x3f, 0x00, 0xa0, 0xc9, 0x22, 0x31, 0x96]);
        } else { // TODO check for unknown failure status / format
            guid = new CTXMM_GUID(0xa99f116c, 0xdffa, 0x412c, [0x95, 0xde, 0x72, 0x5f, 0x99, 0x87, 0x48, 0x26]);     // Format_Theora
        }
        offset = guid.writeToBuffer(buffer, offset);
              
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, formatBlock.byteLength);                          // wireSize_VideoInfoHeader;
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, 0);                                               // fixedSizeSamples;
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, 0);                                               // temporalCompression;
        offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, 0);                                               // sampleByteCount
        
        // write to wire
        buffer.set(new Uint8Array(formatBlock), offset);
        module.queueVirtualWrite(buffer, 0, buffer.byteLength);
    };

    /**
     * @method onMmvdBindCommand
     * @returns {undefined}
     */
    function onMmvdBindCommand() {
        var elementOffset = vStream.ReadUInt16();   // offset of first capability element
        var elementCount = vStream.ReadUInt8();     // number of capability elements
        vStream.ReadUInt8();                        // reserved UINT8

        // skip to element offset position
        if (elementOffset > wireSize.cmdBindRequest) {
            vStream.SkipByte(elementOffset - wireSize.cmdBindRequest);
        }

        vdmmCaps.setCapability(elementCount, vStream);
        
        // send bind response
        if (mmvdCmdHeader.command === MMVD_CMD_BIND_REQUEST) {
            var offset = 0;
            var responseSize = wireSize.cmdHeader + vdmmCaps.getBufferSize() + wireSize.cmdBindRequest
            var buffer = new Uint8Array(responseSize);

            // MMVD_CMD_HEADER
            offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, responseSize);   // byteCount
            buffer[offset++] = MMVD_CMD_BIND_RESPONSE;                              // command
            buffer[offset++] = 0;                                                   //flagsBitMask

            // MMVD_BIND_RESPONSE
            offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, wireSize.cmdBindRequest); // elementOffset
            buffer[offset++] = vdmmCaps.getCapabilityCount();                               // capabilityCount
            buffer[offset++] = 0;                                                           // reserved

            vdmmCaps.writeCapabilityBuffer(buffer, offset);

            // queue to write to wire
            module.queueVirtualWrite(buffer, 0, buffer.byteLength);
        }
    }

    /**
     * @function processNextCommand
     * @returns {undefined}
     */
    function processNextCommand() {
        console.info(commandText[mmvdCmdHeader.command] + ": " + mmvdCmdHeader.byteCount);
        var bytesToSkip = 0;
        switch (mmvdCmdHeader.command) {
            case MMVD_CMD_BIND_REQUEST:
                // a) reset internal state, b) release all stream contexts and c) clear capabilities
                if (!captureDevice) {
                    captureDevice = new CaptureDevice(myself);
                }
                vdmmCaps = new VdmmCapability();
                onMmvdBindCommand();
                break;

            case MMVD_CMD_BIND_COMMIT:
                onMmvdBindCommand();
                module.raiseSessionReadyEvent();
                break;

            case MMVD_CMD_CREATE_CONTEXT_REQUEST:
                onMmvdCreateContext();
                break;

            case MMVD_CMD_UPDATE_CONTEXT:
                bytesToSkip = mmvdCmdHeader.byteCount - wireSize.cmdHeader;
                if (bytesToSkip > 0) {
                    vStream.SkipByte(bytesToSkip);
                }
                break;

            case MMVD_CMD_DESTROY_CONTEXT:
                onMmvdDestroyContext();
                break;

            case MMVD_CMD_TRANSMIT:
				CEIP.add('multimedia:used',true);
                bytesToSkip = mmvdCmdHeader.byteCount - wireSize.cmdHeader;
                if (bytesToSkip > 0) {
                    vStream.SkipByte(bytesToSkip);
                }
                break;

            case MMVD_CMD_CONTROL:
                onMmvdCmdControl();
                break;

            default:
                console.error("Unknown cmd " + mmvdCmdHeader.command);
                bytesToSkip = mmvdCmdHeader.byteCount - wireSize.cmdHeader;
                if (bytesToSkip > 0) {
                    vStream.SkipByte(bytesToSkip);
                }
                break;
        }

    }

    /**
     * @function processStreamData
     * @returns {undefined}
     */
    function processStreamData() {
        var errorHandle = function() {
            vStream.setReadIndex(prevReadIndex);
            vStream.compact();
        };

        var nRemainingInStream = vStream.Available();

        while (nRemainingInStream >= wireSize.cmdHeader) {

            mmvdCmdHeader.byteCount = vStream.peekUint16();
            if (nRemainingInStream >= mmvdCmdHeader.byteCount) {
                prevReadIndex = vStream.GetReadIndex();
                try {
                    vStream.SkipByte(2);
                    mmvdCmdHeader.command = vStream.ReadUInt8();
                    mmvdCmdHeader.flagsBitMask = vStream.ReadUInt8();
                    processNextCommand();
                    nRemainingInStream -= mmvdCmdHeader.byteCount;
                } catch (error) {
                    if (error === VirtualStreamError.NO_SPACE_ERROR) {
                        errorHandle();
                        return;
                    } else {
                        console.error(error);
                        throw error;
                    }
                }
            } else {
                return;
            }
        }
        vStream.compact();
    }

    /**
     * @method VdmmEngine.run Starts the engine to process multimedia commands
     * @param {Object} stream
     * @returns {undefined}
     */
    this.run = function run(stream) {
        vStream = stream;
        vStream.RegisterCallback(processStreamData);
    };
}