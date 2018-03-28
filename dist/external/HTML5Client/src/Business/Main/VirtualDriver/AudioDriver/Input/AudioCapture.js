function AudioCapture(wrapper) {
    
    var CAM_COMMAND_INIT			= 0x00;
    var CAM_COMMAND_OPEN			= 0x01;
    var CAM_COMMAND_CLOSE			= 0x02;
    var CAM_COMMAND_WRITE			= 0x03;
    var CAM_COMMAND_RESET_ACK		= 0x04;
    var CAM_COMMAND_REQUEST_CAPINFO = 0x05;
    var CAM_COMMAND_READ			= 0x06;
    var CAM_COMMAND_START_RECORD	= 0x07;
    var CAM_COMMAND_STOP_RECORD		= 0x08;
    var CAM_COMMAND_RESET_RECORD	= 0x09;
    var CAM_COMMAND_SET_CONTROL		= 0x0A;

    var sampleRate;
    var channels;
    var audioConstraints = { 'audio': true };
    var CH_MMEDIA_AUDIO = 3;
    var ctxModule = document.getElementById("CitrixRenderElement");
    
    var complexity = 2;
    var quality = 9;
    var resampleQuality = 9;
    var enableVAD,
        enableDTX,
        enablePEH,
        enableHighPass,
        enablePreprocessor,
        enableThread;
    
    if (HTML5_CONFIG['nacl'] && HTML5_CONFIG['nacl']['audio'] && HTML5_CONFIG['nacl']['audio']['config']) {
        complexity = HTML5_CONFIG['nacl']['audio']['config']['complexity'] || 3;
        quality = HTML5_CONFIG['nacl']['audio']['config']['quality'] || 8;
        resampleQuality = HTML5_CONFIG['nacl']['audio']['config']['resampleQuality'] || 8;
        enableVAD = HTML5_CONFIG['nacl']['audio']['config']['enableVAD'] || false;
        enableDTX = HTML5_CONFIG['nacl']['audio']['config']['enableDTX'] || false;
        enablePEH = HTML5_CONFIG['nacl']['audio']['config']['enablePEH'] || false;
        enableHighPass = HTML5_CONFIG['nacl']['audio']['config']['enableHighPass'] || false;
        enablePreprocessor = HTML5_CONFIG['nacl']['audio']['config']['enablePreprocessor'] || false;
        enableThread = HTML5_CONFIG['nacl']['audio']['config']['enableThread'] || false;
    }
    
    var ctxWrapper = Utility.getCtxWrapper();
    // TODO: Don't intialize ctxWrapper or AudioCapture unless it is required. Null check let's HTML5 Receiver load ok.
	if (ctxWrapper) {
		ctxWrapper.setMessageHandler(CH_MMEDIA_AUDIO, ctxMessageHandler);
	}
    function ctxMessageHandler(data) {
      var stream = new OffsetableOutputStream();
        var channel = 18;
        var bytes;
        if (data['response'] === true) {
            var CAM_OPEN_RESPONSE = 0x84;
            var sampleRate = data['sampleRate'] || 16000;
            var MAX_MIC_PERIOD = 20;
            //((SamplesPerSec * BitsPerSample * Channels)/8)* 0.001 * MAX_MIC_PERIOD;
            var MaxBytesPerPacket = ((sampleRate * 16 * 1) / 8) * 0.001 * MAX_MIC_PERIOD;
            var MaxPacketCount = 64*1; //2;
            stream.WriteByte(CAM_OPEN_RESPONSE);
            stream.WriteByte(2);
            ByteWriter.WriteInt16ToStream(stream, MaxBytesPerPacket);
            ByteWriter.WriteInt16ToStream(stream, MaxPacketCount);
            stream.WriteByte(0x00);
            bytes = stream.ToByteArray();
            wrapper.queueVirtualWrite(channel, bytes, 0, bytes.length);
            sendFlowControl(1, 0);
            
        } else {
            var CAM_READ_RESPONSE = 0x83;
            stream.WriteByte(CAM_READ_RESPONSE);
            stream.WriteByte(2);

            var len = 0;
            if (data.buffer) {
                var pcm16buffer = new Uint8Array(data.buffer);
                if (pcm16buffer) {
                    len = pcm16buffer.byteLength;
                }
            }

            ByteWriter.WriteInt16ToStream(stream, 6);   // offset to sound data

            if (data.silent) {
                ByteWriter.WriteInt16ToStream(stream, 0); // length of sound data
            } else {
                ByteWriter.WriteInt16ToStream(stream, len + 2); // length of sound data
                ByteWriter.WriteInt16ToStream(stream, len);
                if (pcm16buffer) {
                    stream.WriteByteArray(pcm16buffer, 0, len); //pcm16buffer.byteLength); //length * pcm16buffer.BYTES_PER_ELEMENT);
                }
            }

            bytes = stream.ToByteArray();
            wrapper.queueVirtualWrite(channel, bytes, 0, bytes.byteLength);
        }
    }
    
     
    function sendFlowControl (commands, data)
	{
		var stream;
		var bytes;
		if( commands > 0  )
		{
			stream = new OffsetableOutputStream();
			stream.WriteByte([0x80],0,1);
			ByteWriter.WriteInt16ToStream(stream, 0x0001);
			ByteWriter.WriteInt16ToStream(stream, commands);
			bytes = stream.ToByteArray();
			wrapper.queueVirtualWrite(18, bytes, 0, bytes.length);
		}
		if( data > 0)
		{
			stream = new OffsetableOutputStream();
			stream.WriteByte([0x80],0,1);
			ByteWriter.WriteInt16ToStream(stream, 0x0002);
			ByteWriter.WriteInt16ToStream(stream, data);
			bytes = stream.ToByteArray();
			wrapper.queueVirtualWrite(18, bytes, 0, bytes.length);
		}
	}
    
    
    function postCtxMessage(msg) {
        if (ctxModule) {
            msg['channel'] = CH_MMEDIA_AUDIO;
            ctxModule.postMessage(msg);
        }
    }
    
    function audiosuccessCallback(stream) {
         postCtxMessage({'channel': CH_MMEDIA_AUDIO,
                    'cmd': CAM_COMMAND_OPEN,
                    'deviceId': 0,
                    'deviceType': 0, // AudioIn/ out
                    'encoder': 1, // 0-pcm, 1-speex, 2-vorbis
                    'track': stream.getAudioTracks()[0],
                    'sampleRate': sampleRate,
                    'complexity': complexity,
                    'quality': quality,
                    'resampleQuality': resampleQuality,
                    'enableVAD': enableVAD,
                    'enableDTX': enableDTX,
                    'enablePEH': enablePEH,              // perceptual enhancement - decoder only
                    'enableHighPass': enableHighPass,
                    'enablePreprocessor': enablePreprocessor,
                    'enableThread': enableThread});
    }

    function errorCallback(error) {
        console.error("getUserMedia error: ", error);
    };

    this.processDeviceCommand = function (dataObj) {
        switch (dataObj.cmd) {
            case CAM_COMMAND_OPEN:
                sampleRate = dataObj.sampleRate;
                channels = dataObj.noOfChannel;
                if (!ctxModule) {
                    ctxModule = document.getElementById("CitrixRenderElement");
                }
                getUserMedia(audioConstraints, audiosuccessCallback, errorCallback);
                break;
            
            case CAM_COMMAND_READ:
            case CAM_COMMAND_START_RECORD:
            case CAM_COMMAND_STOP_RECORD:
            case CAM_COMMAND_RESET_RECORD:
                postCtxMessage(dataObj);
                break;
                
            case CAM_COMMAND_CLOSE:
                postCtxMessage(dataObj);
                break;
            
            default:
                break;
        }
    };  
};


