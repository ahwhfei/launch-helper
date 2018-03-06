var PPAPIDecoder = function(decodeCallback, modeChangeCallback) {
    var GFX_CMD_INIT = 0,
        GFX_CMD_H264_DECODE = 1,      
        GFX_CMD_EXIT = 10;
    
    /// Message received from Module's graphics channel
    var GFX_MSG_CHANGE_MODE              = 20,
        GFX_MSG_REQUEST_RESET            = 21,
        GFX_MSG_ERROR_FALLBACK           = 22,
        GFX_MSG_UPDATE_FPS_SERVER        = 23,
        GFX_MSG_UPDATE_FPS_METER         = 24,
        GFX_MSG_GFX_TEST_STATUS          = 25,
        GFX_MSG_DECODE_DONE              = 26;
        
    var ACCELERATION_SW = 0,
        ACCELERATION_HW = 1,
        ACCELERATION_AUTO_DETECT = 3;
    
    var cmdChannel = CTX_MODULE_CMD_CHANNEL.GRAPHICS,
        availabilityListeners = [],
        ctxWrapper = Utility.getCtxWrapper(),
        gfxConfig = (HTML5Interface.ChromeNacl.isFeatureEnabled('graphics') && HTML5_CONFIG['nacl']['graphics']['config']) ?
                                                                        HTML5_CONFIG['nacl']['graphics']['config'] : {};

    var LOGGER = "TW" + "_" + "DNT" + ": "; 
                                
    // R13 workaround: detect picture delay, applicable for any chromebook
    // platform. TODO: move to app init conformance run. 
    // if picture delay is detected then fallback to 'js' coreavc decoder
	//
    var firstFrame = false;
    var idPicDelayTimeout = null;
    // Bad to use timeout. TODO: must move to conformance test manager and run 
    // on startup/update for config management
    // 
    var PIC_DELAY_DETECT_TIMEOUT = 3000;
    
    gfxConfig['fpsUpdateFreq'] =  HTML5_CONFIG['fpsMeter']['updateFrequency'];

    function onPictureDelay() {
        writeHTML5Log(0, LOGGER + "Picture delay detected. Disable native decoder");
        // note: error, code and level are placeholder for future use
        handleMessage({'cmd': GFX_MSG_ERROR_FALLBACK, 'error': 0, 'code': 0, 'level': 0});
    }
    
    function clearPicDelayTimeout() {
        if (idPicDelayTimeout !== null) {
            clearTimeout(idPicDelayTimeout);
            idPicDelayTimeout = null;
        }
    }
    
    function setPicDelayTimeout() {
        idPicDelayTimeout = setTimeout(onPictureDelay, PIC_DELAY_DETECT_TIMEOUT);
    }
    
    function postGfxCommand(msg) {
        if (ctxWrapper) {
            ctxWrapper.postMessage(msg);
        }
    };
   
    function handleMessage(msg) {
            var data = msg;           
            switch(data["cmd"]) {

            case GFX_MSG_CHANGE_MODE:
                {
                    var type = data["decoder"]? "Hw" : "Sw";
                    writeHTML5Log(0, LOGGER + "NativeClient: Decoder Profile: " + data["profile"] + "; Acceleration type: " + data["decoder"]);                  
                    Profiler.Ui.update("Decoder", "NACL " + type);
					CEIP.add('graphics:decoder:type',"NACL" + type)
                    modeChangeCallback(data);
                }
                break;

            case GFX_MSG_ERROR_FALLBACK:
                {
                    writeHTML5Log(0, LOGGER + "ResetFallback:: Error: "+data["error"]+", Code :"+data["code"]+", Level :"+data["level"]);
                    postGfxCommand({'channel': cmdChannel, 'cmd': GFX_CMD_EXIT});
                    for (var i = 0; i < availabilityListeners.length; i++) {
                        availabilityListeners[i](DecoderType.PPAPIDecoder, false);
                    }
                }
                break;

            case GFX_MSG_REQUEST_RESET:
                {
                    for (var i = 0; i < availabilityListeners.length; i++) {
                        availabilityListeners[i](DecoderType.PPAPIDecoder, true);
                    }
                }
                break;

            case GFX_MSG_UPDATE_FPS_METER:
                {
                    var avgFps = data['avgFps'];
                    avgFps = avgFps.toFixed(2);
                    
                    Profiler.Ui.update("AvgFps", avgFps);
                }
                break;
               
            case GFX_MSG_DECODE_DONE: 
                {
                    // R13: check for valid timeoutId and then call the cleartimout
                    // instead of directly calling clearTimeoutfunction to avoid 
                    // overhead of function call for all decode msg callback
                    if (idPicDelayTimeout) {
                        clearPicDelayTimeout();
                    }
                    decodeCallback(0, 0, 0, 0, 0, data["frameNr"], data["decodeTime"], data["queueTime"], 0)
                }
                break;
            
            default:
                break;
            }            
        }   

    function init(width, height, arch) {
        if ((gfxConfig['acceleration'] === ACCELERATION_AUTO_DETECT) || (!gfxConfig['acceleration'] && (gfxConfig['acceleration'] !== 0))) {
            gfxConfig['acceleration'] = (PlatformInfo["browserMajorVersion"] > 49)? ACCELERATION_HW : ACCELERATION_SW;
        }
         
        writeHTML5Log(0, LOGGER + "Platform : " + PlatformInfo["arch"]);
            
        postGfxCommand({'channel': cmdChannel,
                'cmd': GFX_CMD_INIT,
                'width': width,
                'height': height,
                'config' : gfxConfig}); 
    }

    return {
        isDecodeAndRenderParallel: function() {
            return true;
        },
    
        /* R13: description
         *  1. on reinit -> set firstFrame and clear the timeout
         *  2. on decode call if firstFrame set the delay detect timer
         *  3. on frame got and if there is timeout then clear it
         * 
         */
    
        reinitialize: function(width, height) {
            // R13 issue: picture delay detect 
            clearPicDelayTimeout();
            firstFrame = true;
            
            ctxWrapper.setMessageHandler(cmdChannel, handleMessage);
            /// Post init cmd to native decoder
            ///
            
            // Test platform architecture and set to software acceleration
            // if arm platform detected
            init(width, height);
        },
        
        decodeFrames: function(encodeBuffer, rectCount, dirtyRects, frameCount, time, frameWidth, frameHeight, colorFormat) {
            
            // On first frame, that is ideally after reinit set the timeout for picture delay detect
            if (firstFrame) {
                firstFrame = false;
                setPicDelayTimeout();
            }
            
            postGfxCommand({'channel': cmdChannel,
                            'cmd': GFX_CMD_H264_DECODE,
                            'width': frameWidth,
                            'height': frameHeight,
                            'buffer': encodeBuffer.buffer,
                            'frameNr': frameCount,
                            'colorFormat': colorFormat,
                            'queueTime': time});
        },
        
        addAvailabilityListener: function (listener) {
            availabilityListeners.push(listener);
        },
        
        dispose: function() {
            postGfxCommand({
                'channel': cmdChannel,
                'cmd': GFX_CMD_EXIT
            });
        }
    };
};
