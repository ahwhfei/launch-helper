function VdmmCapability() {

    var capsSupported = [];
    var responseSize= 0;
    
    var secondsToBuffer = 4; 
    var majorMediaTypeBitMask = 1; 
    var version = 0;

    // Major media type formats bits
    var CTXMM_MAJOR_MEDIA_TYPE_ALL = 0xFFFFFFFF;
    var CTXMM_MAJOR_MEDIA_TYPE_VIDEO = 0x00000001;
    var CTXMM_MAJOR_MEDIA_TYPE_AUDIO = 0x00000002;

    /**
     * Capabilities
     * @type Number|Number
     */
    var CTXMM_TYPE_CAPABILITY_MEDIA_STREAM_SECONDS_TO_BUFFER = 0;
    var CTXMM_TYPE_CAPABILITY_MAJOR_MEDIA_TYPE_SUPPORT = 1;
    var CTXMM_TYPE_CAPABILITY_C2H_MEDIA_STREAMS = 3;
    var CTXMM_TYPE_CAPABILITY_C2H_CONTROL = 4;
    var CTXMM_TYPE_CAPABILITY_FLOW_CONTROL_V3 = 5;
    var CTXMM_TYPE_CAPABILITY_MULTICAST = 6;
    var CTXMM_TYPE_CAPABILITY_SEEK = 7;

    var wireSize = {};
    
        // wire size for capability type
        wireSize[CTXMM_TYPE_CAPABILITY_MEDIA_STREAM_SECONDS_TO_BUFFER] = 4;
        wireSize[CTXMM_TYPE_CAPABILITY_MAJOR_MEDIA_TYPE_SUPPORT] = 4;
        wireSize[CTXMM_TYPE_CAPABILITY_C2H_MEDIA_STREAMS] = 1;
        wireSize[CTXMM_TYPE_CAPABILITY_C2H_CONTROL] = 1;
        wireSize[CTXMM_TYPE_CAPABILITY_FLOW_CONTROL_V3] = 1;
        wireSize[CTXMM_TYPE_CAPABILITY_MULTICAST] = 2;
        wireSize[CTXMM_TYPE_CAPABILITY_SEEK] = 1;
        
        // element header wire size
        wireSize.elementHeader = 8;

  
    this.writeCapabilityBuffer = function(buffer, offset) {
        for (var i = 0; i < capsSupported.length; i++) {
            offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, wireSize.elementHeader + wireSize[capsSupported[i]]);
            offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, capsSupported[i]);
            switch (capsSupported[i]) {
                case CTXMM_TYPE_CAPABILITY_MEDIA_STREAM_SECONDS_TO_BUFFER:
                    offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, secondsToBuffer);
                    break;

                case CTXMM_TYPE_CAPABILITY_MAJOR_MEDIA_TYPE_SUPPORT:
                    majorMediaTypeBitMask = 0x00000001;
                    offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, majorMediaTypeBitMask);
                    break;

                case CTXMM_TYPE_CAPABILITY_C2H_MEDIA_STREAMS:
                case CTXMM_TYPE_CAPABILITY_C2H_CONTROL:
                case CTXMM_TYPE_CAPABILITY_FLOW_CONTROL_V3:
                case CTXMM_TYPE_CAPABILITY_SEEK:
                    buffer[offset++] = 0 & 0xFF;
                    break;

                case CTXMM_TYPE_CAPABILITY_MULTICAST:
                    buffer[offset++] = version & 0xFF;
                    buffer[offset++] = 0 & 0xFF;
                    break;

                default:
                    console.error("Unreconized capability element in list " + capsSupported[i]);
                    break;
            }
        }
    };

    this.getCapabilityCount = function() {
        return capsSupported.length;
    };

    this.getBufferSize = function() {
        return responseSize;
    };

    this.setCapability = function(elementCount, stream) {
        // read each capability element
        while (elementCount) {
            var byteCount = stream.ReadInt32();
            var type = stream.ReadInt32();
            var bytesRead = wireSize.elementHeader;

            switch (type) {
                case CTXMM_TYPE_CAPABILITY_MEDIA_STREAM_SECONDS_TO_BUFFER:
                    capsSupported.push(type);
                    secondsToBuffer = stream.ReadInt32();
                    bytesRead += wireSize[type];
                    responseSize += bytesRead;
                    break;

                case CTXMM_TYPE_CAPABILITY_MAJOR_MEDIA_TYPE_SUPPORT:
                    capsSupported.push(type);
                    majorMediaTypeBitMask = stream.ReadInt32();
                    bytesRead += wireSize[type];
                    responseSize += bytesRead;
                    break;

                case CTXMM_TYPE_CAPABILITY_C2H_MEDIA_STREAMS:
                case CTXMM_TYPE_CAPABILITY_C2H_CONTROL:
                case CTXMM_TYPE_CAPABILITY_FLOW_CONTROL_V3:
                case CTXMM_TYPE_CAPABILITY_SEEK:
                    capsSupported.push(type);
                    stream.ReadUInt8();        // reserved byte
                    bytesRead += wireSize[type];
                    responseSize += bytesRead;
                    break;

                case CTXMM_TYPE_CAPABILITY_MULTICAST:
                    capsSupported.push(type);
                    version = stream.ReadUInt8();
                    stream.ReadUInt8();         // reserved byte
                    bytesRead += wireSize[type];
                    responseSize += bytesRead;
                    break;

                default:
                    console.warn("Unreconized capability element " + type);
                    break;
            }
            
            if (byteCount - bytesRead > 0) {
                stream.SkipByte(byteCount - bytesRead);
            }
            
            elementCount--;
        }
    };
}