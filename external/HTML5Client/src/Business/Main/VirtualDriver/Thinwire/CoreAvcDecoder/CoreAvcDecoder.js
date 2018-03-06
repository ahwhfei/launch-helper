var CoreAvcDecoder = (function () {

    var timestamp;
    try {
        timestamp = performance.now.bind(performance);
    }
    catch (error) {
        timestamp = Date.now.bind(Date);
    }

    function CoreAvcDecoder(decodeCallback, modeChangeCallback) {
        var availabilityListeners = new Array();
        var decodedData = null;
        var decodedDataLength = 0;
        var buffer = null;
        var yData = null;
        var uData = null;
        var vData = null;
        var bufferLength = 0;
        var modeChange = true;
        var nrCriticalPacket = 0;
        var avcDecoder = null;
        var compiledDecoder = null;
        //var testMem = 0;
		var curMemSize = 0;
		
		// Heap memory size for emscripten code based on resolution.
		var getMemorySize = function(width, height) {
			var res = width*height;
			var r1 = 1024*768;var r2 = 1600*900;var r3 = 1920*1080;
			if (res <= r1) {
			  return 1 << 23; //8mb
			} else if (res <= r2) {
			  return 1 << 24; //16mb
			} else if (res <= r3) {
			  return 1 << 25; //32mb
			} else {
			  return 1 << 26; //64mb
			}
		};
		
		// Ignore width, height of session window and use from frame itself.
		// This is imp for 3dPro where graphics adapter uses only few resolutions rather than any.
        this.reinitialize = function (width, height) {
            nrCriticalPacket = 0;
            modeChange = true;
        };

        this.decodeFrames = function (bufferData, rectCount, dirtyRects, frameNr, queueTime, frameWidth, frameHeight, colorFormat) {
			
			// notify mode change to renderers
            var width = frameWidth;
            var height = frameHeight;
            if (modeChange === true) {
				
				// Adjust for higher resolutions and 444 needs more memory
				var old = curMemSize;
				curMemSize = getMemorySize(width, height);
				if (colorFormat == DecoderConstants.TW2_YUV444) {
					curMemSize = curMemSize << 1;
				}
				if (curMemSize != old) {
					avcDecoder = new CompiledDecoder(curMemSize);
					compiledDecoder = avcDecoder.Module;
					compiledDecoder._init();
				}
			
                modeChangeCallback({'width': frameWidth, 'height': frameHeight, 'texturewidth': width, 'textureheight': height});
                modeChange = false;
            }
			
			// encoded input buffer
            buffer = compiledDecoder._malloc(bufferData.byteLength);
            bufferLength = bufferData.byteLength;

            // output decoded buffer
            var newDecodedDataLength = (colorFormat == DecoderConstants.TW2_YUV420) ? (width * height * 3 / 2) : (width * height * 3);
            decodedDataLength = newDecodedDataLength;
            decodedData = compiledDecoder._malloc(decodedDataLength);

            // decode now
            var startTime = timestamp();
            compiledDecoder.HEAPU8.set(new Uint8Array(bufferData), buffer);
            var err = compiledDecoder._decode_frame(buffer, bufferData.byteLength, decodedData, decodedDataLength);

            // read output based on format
            var lumaSize =  width * height; // y always same
            var chromaSize = (colorFormat == DecoderConstants.TW2_YUV420) ? (lumaSize >> 2) : lumaSize; // uv
            var data = new Uint8Array(compiledDecoder.HEAPU8.buffer, decodedData, lumaSize);
            yData = new Uint8Array(data);
            data = new Uint8Array(compiledDecoder.HEAPU8.buffer, decodedData + lumaSize, chromaSize);
            uData = new Uint8Array(data);
            data = new Uint8Array(compiledDecoder.HEAPU8.buffer, decodedData + lumaSize + chromaSize, chromaSize);
            vData = new Uint8Array(data);
            var decodeTime = timestamp() - startTime;
            decodeCallback(yData, uData, vData, rectCount, dirtyRects, frameNr, decodeTime, queueTime, colorFormat);

            // check highest memory location for debugging
            /*var old = testMem;
            testMem = compiledDecoder._malloc(1024*1024*16);
            compiledDecoder._free(testMem);

            testMem = Math.max(testMem, buffer+bufferLength, decodedData+decodedDataLength);
            if (testMem > old) {
              console.log("New address of 1mb: " + testMem);
            }*/

            // free input/output buffers
            if (buffer !== null) {
                compiledDecoder._free(buffer);
                bufferLength = 0;
                buffer = null;
            }
            if (decodedData !== null) {
                compiledDecoder._free(decodedData);
                decodedDataLength = 0;
                decodedData = null;
            }

            // change decoder only after rendering current frame
            if (decodeTime > DecoderConstants.MAX_DECODE_TIME)
            {
                // This can occur when the decoder is taking too much time to decode frames
                nrCriticalPacket++;
                if (nrCriticalPacket == DecoderConstants.MAX_PACKETS_FOR_FALLBACK) {
                    for (var i = 0; i < availabilityListeners.length; i++) {
                        availabilityListeners[i](DecoderType.CoreAvc, false);
                    }
                }
            }
            else {
                nrCriticalPacket = 0;
            }
        };

        this.dispose = function () {
            if (buffer !== null) {
                compiledDecoder._free(buffer);
                bufferLength = 0;
                buffer = null;
            }
            if (decodedData !== null) {
                compiledDecoder._free(decodedData);
                decodedDataLength = 0;
                decodedData = null;
            }
            
            compiledDecoder._done();
        };

        this.isDecodeAndRenderParallel = function () {
            return false;
        };

        this.addAvailabilityListener = function (listener) {
            availabilityListeners.push(listener);
        };
    }
    return CoreAvcDecoder;
})();

