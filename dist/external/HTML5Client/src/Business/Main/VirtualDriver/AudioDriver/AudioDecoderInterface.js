function AudioDecoderInterface(audioWrapper1) {
    var noOfChannels;
    var sampleRate;
    var bitsPerSample;
    var audioFormat;
    var audioDecoder, pcmDecoder, vorbisDecoder, speexDecoder;
    var appendOffset = 0;
    var typeOfPlayer;
    var decodedFloatAudioData;
    var thresholdDecodedAudioLength;
    var doNotDecodePCM = false;
    var byteData;
    var audioWrapper = audioWrapper1;
    var audioDuration = 0;
	var prevPlayTime = 0;
	var timeNow = HTML5Interface.timeStamp();
	var packetExpiryDuration = 3000; // 3sec

    // Send audio data to Decoder
    this.processAudioData = function (audioData) {
        audioDecoder.decode(audioData, doNotDecodePCM);
    };
	
	this.setAudioConfig = function(audioConfig1)
	{
		// Use 50ms as minimum
		audioDuration=Math.max(audioConfig1['HTML5_Audio_Buffer_Duration'], 50);
	};
	
    /*
    * Initialize decoder on the basis of audio format
    * and register callback to the decoder on the basis of sampleARte and type_of_player
    */
    this.initializeDecodeInfo = function (no_of_channel, sampleRate1, bitsPersample1, audioFormat1, type_of_player,mode) {
        noOfChannels = no_of_channel;
        sampleRate = sampleRate1;
        bitsPerSample = bitsPersample1;
        audioFormat = audioFormat1;
        typeOfPlayer = type_of_player;
		appendOffset = 0; 
        // decoded data to buffer before playing back.
        thresholdDecodedAudioLength = Math.floor((sampleRate * audioDuration * noOfChannels)/1000.0);
		if (!decodedFloatAudioData) {
			decodedFloatAudioData = new Float32Array(thresholdDecodedAudioLength * 2); // initialize buffer here and use double for safety.
		}
        switch (audioFormat) {
            case FORMAT_LINEAR_PCM:
				if (!pcmDecoder) {
					pcmDecoder = new PCMDecoder();
				}
				audioDecoder = pcmDecoder;
                audioDecoder.initialize(noOfChannels, sampleRate, bitsPerSample);
                byteData = true;
                if (typeOfPlayer !== AUDIOPLAYERCONSTANT.MOZILLAPLAYER) {

                    if (sampleRate < 22050) {
                        doNotDecodePCM = true;
                    }
                    else {
                        doNotDecodePCM = false;
                    }
                }
                break;
            case FORMAT_CTX_VORBIS:
				if (!vorbisDecoder) {
					vorbisDecoder = new VorbisDecoder();
				}
				audioDecoder = vorbisDecoder;
                audioDecoder.initialize(noOfChannels, sampleRate, bitsPerSample);
                byteData = false;
                break;
            case FORMAT_CTX_SPEEX:
				if (!speexDecoder) {
					speexDecoder = new SpeexDecoder();
				}
				audioDecoder = speexDecoder;
                audioDecoder.initialize(noOfChannels, sampleRate, bitsPerSample,mode);
                byteData = false;
                break;


        }
		audioDecoder.registerCallback(decodeCallback);

    };

    /*
    * callback from audio decoders
    */
    var decodeCallback = function (decodedData) {
		if(prevPlayTime == 0)
		{
			prevPlayTime = timeNow();
		}
		// Discard previous old audio packet, if new packet comes after time >= packetExpiryDuration
		else if((timeNow() - prevPlayTime) > packetExpiryDuration)
		{
			appendOffset = 0;
			prevPlayTime = timeNow();
		}
        decodedFloatAudioData.set(decodedData, appendOffset);
        appendOffset += decodedData.length;
        if (appendOffset >= thresholdDecodedAudioLength) {
            var audioData = decodedFloatAudioData.subarray(0, appendOffset);
            sendDataToPlay(audioData);
			prevPlayTime = timeNow();
            appendOffset = 0;
        }
    };

    //send decoded audio data to audio player
    var sendDataToPlay = function (audioData) {
        audioWrapper.playAudio(audioData);
    };
}
