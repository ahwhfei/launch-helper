function AudioPlayer() {
    var player = null;
    var webAudioPlayer = AUDIOPLAYERCONSTANT.WEBAUDIOPLAYER;
    var mozillaPlayer = AUDIOPLAYERCONSTANT.MOZILLAPLAYER;
    var audioFormat;
    var type_of_player;
    var myself = this;

    this.playAudio = function (audioData) {
		CEIP.add('audio:used',true);
        player.play(audioData);
    };
    this.getPlayerType = function () {
        return type_of_player;
    };
    this.initializePlayer = function (no_of_channel, sampleRate1,audioConfig1) {
        if (player != null) {
            player.initializePlayer(no_of_channel, sampleRate1,audioConfig1);
        }
    };
    function playerType() {

        if ((typeof AudioContext !== "undefined") || (typeof webkitAudioContext !== "undefined")) {
            return webAudioPlayer;
        }
        else {
            try {
                var temp = null;
                var audio = new Audio();
                if (audio.mozSetup)
                    temp = mozillaPlayer;
                return temp;
            } catch (error) {
                return temp;
            }
        }

    }
    this.createPlayer = function () {
        type_of_player = playerType();
        try {
            if (type_of_player == webAudioPlayer) {
                player = new WebAudioPlayer();
            }
            else if (type_of_player == mozillaPlayer) {
                player = new MozillaPlayer();

            }
            else {
                console.log("audio is not supported in this browser ");
                player = null;
                throw audioError.AUDIO_NOT_SUPPORTED;
            }


        } catch (error) {

            player = null;
        }



    };

    myself.createPlayer();
}

function WebAudioPlayer() {
    var nextTime = 0;
    var context;
    var noOfChannel;
    var sampleRate;
    var myself = this;
	var minimumAudioLag;
	var audioBuffers = null;
	var audioBufferLen = 0;
    this.initializePlayer = function (no_of_channel, sampleRate1,audioConfig) {
        nextTime = 0;
        noOfChannel = no_of_channel;
        sampleRate = sampleRate1;
		minimumAudioLag = audioConfig['HTML5_Audio_Lag_Threshold']/1000;
		
		// create buffers to hold threshold duration data. Use 50ms as minimum.
		// Why couple of buffers ? So that we can swap them each time like graphics rendering, otherwise we would be overwriting data in between playback
		var buffDuration = audioConfig['HTML5_Audio_Buffer_Duration'] + 50; // Use extra for safety.
		audioBufferLen = Math.floor((sampleRate * buffDuration * noOfChannel)/1000.0);
		
		try {
			if (!audioBuffers) {
				audioBuffers = new Array(2);
				audioBuffers[0] = context.createBuffer(noOfChannel, audioBufferLen, sampleRate);
				audioBuffers[1] = context.createBuffer(noOfChannel, audioBufferLen, sampleRate);
			}
			this.play = playAudioRaw.bind(this);
		} catch (e) {
			// Safari and older Chrome versions do not like sample rate < 22500kHz so we convert to Wav and play it.
			audioBuffers = null;
			audioBufferLen = 0;
			this.play = playAudioWav.bind(this);
		}
    };

	var currentBuffer = false;
    var playAudioRaw = function (audioData) {
		// Reuse same audiobuffer for all the playback, otherwise there are huge memory leaks in Chrome
		// So we also need to pass duration while playback.
		var sampleLength = audioData.length;
		var duration = (Math.min(sampleLength, audioBufferLen) * 1.0)/sampleRate;
		// swap buffers so that during playback we do not overwrite the data.
		// Currently 0 <=> 1. If using more buffers do it in round-robin.
		currentBuffer = !currentBuffer; 
		var audioBuffer = ((currentBuffer == true) ? audioBuffers[0] : audioBuffers[1]);
		if (noOfChannel == 2) {
			sampleLength = sampleLength / 2;
			duration /= 2.0;
			var leftIndex = 0;
			var leftChannel = audioBuffer.getChannelData(0);
			var rightChannel = audioBuffer.getChannelData(1);
			for (var i = 0; i < (audioBufferLen/2); i++) {
				leftChannel[i] = audioData[leftIndex];
				rightChannel[i] = audioData[leftIndex + 1];					
				// zero out remaining buffer
				if (i >= sampleLength) {
					leftChannel[i] = 0;
					rightChannel[i] = 0;
				}
				leftIndex += 2;
			}

		}
		else {
			var leftIndex = 0;
			var leftChannel = audioBuffer.getChannelData(0);
			for (var i = 0; i < audioBufferLen; i++) {
				leftChannel[i] = audioData[leftIndex];
				if (i >= sampleLength) {
					leftChannel[i] = 0;
				}
				leftIndex++;
			}
		}
		playAudioData(audioBuffer, duration);
	};
	
	var convertPCMFToWav = function (audioData) {
	    var appendOffset = 44; // Wav header
		var bitsPerSample = 16; // Only PCM uses 8-bit which we no longer need to support.
		var decodedIntAudioData = new Int8Array(appendOffset + audioData.length);
		var initializeWaveFileHeader = function(buf, no_of_channel, sampleRate, BitsPersample) {
			// no of channel
			buf[22] = no_of_channel & 0xff;
			buf[23] = (no_of_channel >> 8) & 0xff;

			// sampleRate start from 24 byte in little endian format
			buf[24] = sampleRate & 0xff;
			buf[25] = (sampleRate >> 8) & 0xff;
			buf[26] = (sampleRate >> 16) & 0xff;
			buf[27] = (sampleRate >> 24) & 0xff;
			// Byte Rate 
			var byteRate = Math.floor((sampleRate * no_of_channel * BitsPersample) / 8);
			buf[28] = byteRate & 0xff;
			buf[29] = (byteRate >> 8) & 0xff;
			buf[30] = (byteRate >> 16) & 0xff;
			buf[31] = (byteRate >> 24) & 0xff;
			//Block Align
			var blockAlign = Math.floor((no_of_channel * BitsPersample) / 8);
			buf[32] = blockAlign & 0xff;
			buf[33] = (blockAlign >> 8) & 0xff;
			// Bits per Sample
			buf[34] = BitsPersample & 0xff;
			buf[35] = (BitsPersample >> 8) & 0xff;
		};
		
		var waveFileHeaderforPCM = function(buf) {
			//Write RIFF in header
			buf[0] = 82;
			buf[1] = 73;
			buf[2] = 70;
			buf[3] = 70;
			// Size of entire file in byte - 8  or 36 + size of data in byte 
			// write at time of buffer initilization 
			//write WAVE format 

			buf[8] = 87; //W
			buf[9] = 65; //A
			buf[10] = 86; //V
			buf[11] = 69; //E
			//there two part in wave file header one describe format of data other is used for data
			// start of fmt part
			buf[12] = 102; //F
			buf[13] = 109; //M
			buf[14] = 116; //T
			buf[15] = 32;
			//subchunk1size it is 16 for PCM

			buf[16] = 16;
			buf[17] = 0;
			buf[18] = 0;
			buf[19] = 0;
			//Audio format 1 for PCM
			buf[20] = 1;
			buf[21] = 0;
			// start of data format 
			buf[36] = 100; //D
			buf[37] = 97; //A
			buf[38] = 116; //T
			buf[39] = 97; //A
		};
		
		var initilizeWaveFileHeaderLength = function(buf, len) {
			var chunk_size = 36 + len;
			buf[4] = chunk_size & 0xff;
			buf[5] = (chunk_size >> 8) & 0xff;
			buf[6] = (chunk_size >> 16) & 0xff;
			buf[7] = (chunk_size >> 24) & 0xff;
			buf[40] = len & 0xff;
			buf[41] = (len >> 8) & 0xff;
			buf[42] = (len >> 16) & 0xff;
			buf[43] = (len >> 24) & 0xff;
		};
		
		// if decodedData is in float PCM linear format then need to convert into  before converting into wav format
		var tempArray = new Int16Array(audioData.length);
		for (var i = 0; i < audioData.length; i++) {
			tempArray[i] = Math.floor(audioData[i] * 32768);
			decodedIntAudioData[appendOffset++] = (tempArray[i]) & 0xff;
			decodedIntAudioData[appendOffset++] = (tempArray[i] >> 8) & 0xff;
		}
		
		// convert to Wav
		waveFileHeaderforPCM(decodedIntAudioData);
		initializeWaveFileHeader(decodedIntAudioData, noOfChannel, sampleRate, bitsPerSample);
		initilizeWaveFileHeaderLength(decodedIntAudioData, appendOffset);
		return decodedIntAudioData.buffer;
	};
	
	var playAudioWav = function (audioData) {
		var wavData = convertPCMFToWav(audioData);
		context.decodeAudioData(wavData, function(buf) {
			playAudioData(buf, buf.duration);
		});
	};
	
	function playAudioData(buffer, duration)
	{
		var voice = context.createBufferSource();
        voice.buffer = buffer;
        voice.playbackRate.value = 1;
        voice.connect(context.destination);
        var currentTime1 = context.currentTime;
		if (nextTime < currentTime1 || nextTime === 0) {
            nextTime = currentTime1;
        }
		var nextplay = nextTime;
		nextTime += duration;
		var audioOffset = 0;;
		if (nextplay - currentTime1 < minimumAudioLag) {
			audioOffset = 0;
		}
		else
		{
			audioOffset = (minimumAudioLag <= duration)?minimumAudioLag:duration;
		}
		if(typeof voice.start === "undefined")
		{
			voice.noteOn(nextplay, audioOffset, duration-audioOffset);
		}
		else
		{
			voice.start(nextplay, audioOffset, duration-audioOffset);
		}
		nextTime -= audioOffset;
	}

	 try {

        if (typeof AudioContext !== "undefined") {
            context = new AudioContext();
        }
        else {
            context = new webkitAudioContext();
        }
    }
    catch (error) {
    }

}
function MozillaPlayer() {
    var audioOutput = null;
    this.initializePlayer = function (no_of_channel, sampleRate) {
        audioOutput = new Audio();
        audioOutput.mozSetup(no_of_channel, sampleRate);
    };
    this.play = function (arr) {
        audioOutput.mozWriteAudio(arr);
    };

}


