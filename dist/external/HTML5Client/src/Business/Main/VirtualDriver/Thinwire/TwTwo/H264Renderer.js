var H264Renderer = (function () {
    var SHARPEN_FREQUENCY = 60;      // every 60 framess
   
    var GFX_CMD_INIT = 0,
        GFX_CMD_H264_DECODE = 1,        
        GFX_CMD_SOLID_COLOR = 2,
        GFX_CMD_BMP = 3,
        GFX_CMD_TEXT_BMP = 4,
        GFX_CMD_DELETE_TEXT = 5,
        GFX_CMD_CLEAR_OVERLAY = 6,
        GFX_CMD_EOF = 7;
 
    var LOGGER = "TW" + "_" + "DH2" + ": ";

    var timestamp;
    try {
        timestamp = performance.now.bind(performance);
    } catch (error) {
        timestamp = Date.now.bind(Date);
    }
   
    function GraphColor() {
        this.colorData = new Uint8Array(3);
        this.flags = 0;
    }

    function GraphBitmapInfo() {
        this.width = 0;
        this.height = 0;
        this.colorSpace = new GraphColor();
        this.vColors = null;
        this.colorFormat = DecoderConstants.TW2_YUV420;
    }

    function UncachedBitmap() {
        this.uiTotalDataReceived = 0;//till now data received
        this.uiEncodedDataSize = 0;
        this.bmi = new GraphBitmapInfo();
    }

    function ImageRegionData() {
        this.rectCount = 0;
        this.dirtyRects = new Array(MAX_DIRTY_RECT);
        this.imageQ = 0;
        for (var i = 0; i < MAX_DIRTY_RECT; i++) {
            this.dirtyRects[i] = new Rectangle(0, 0, 0, 0);
        }
    }
   
    //TODO: Look into not gathering timing data if flow control is not available.
    function FrameTime() {
        this.queuedTime = 0;
        this.decodeTime = 0;
        this.renderTime = 0;
        this.waitForPresentTime = 0;
        this.parallelDecodeAndRender = false;
    }
        
    function H264Renderer(thinwireWrapper, twEngine) { 
        var frameToDraw,
            decoder,
            twFlowControl,
            h264Frame,
            cmdQueue = new Queue(),
            currentFrameTime = new FrameTime(),
            lastDecodedFrame,
            frameCount,
            previousColorFormat,
            sharpeningCounter = 0,
            decoderFactory = H264DecoderFactory(newDecoderAvailable),
            currentSolidColor = 0;
           
        this.frameComplete = function frameComplete(encodeBuffer, gCurrentUncachedBmp, gRegionData) {
            var frameWidth = gCurrentUncachedBmp.bmi.width, 
                frameHeight = gCurrentUncachedBmp.bmi.height, 
                rectCount = gRegionData.rectCount, 
                dirtyRects = gRegionData.dirtyRects, 
                imageQ = gRegionData.imageQ, 
                colorFormat = gCurrentUncachedBmp.bmi.colorFormat;
        	frameToDraw = true;
            if(previousColorFormat != colorFormat){
                previousColorFormat = colorFormat;
                //yuvFormat
                var yuvFormat = (colorFormat === DecoderConstants.TW2_YUV420) ? "YUV420" : "YUV444"
                Profiler.Ui.update("YUV Format", yuvFormat);
                writeHTML5Log(0, LOGGER + "YUV Format " + yuvFormat);
            }
            
            if (++sharpeningCounter == SHARPEN_FREQUENCY || imageQ) {
                sharpeningCounter = 0;
                rectCount = 1;
                dirtyRects[0].X = 0;
                dirtyRects[0].Y = 0;
                dirtyRects[0].Width = frameWidth;
                dirtyRects[0].Height = frameHeight;
            }
            h264Frame = true;
            
            var time = timestamp();
            if (decoder === null) {
                return;
            }

            decoder.decodeFrames(encodeBuffer, rectCount, dirtyRects, frameCount, time, frameWidth, frameHeight, colorFormat);
            // clear overlay command of native client needs dirty rects and rect count
            // todo: remove dirty rects from clear overlay and handle it in shader of nacl
            cmdQueue.queue({ 'cmd': GFX_CMD_CLEAR_OVERLAY, 'rectCount': rectCount, 'dirtyRects': dirtyRects, 'frameWidth': frameWidth, 'frameHeight': frameHeight});
            processCmdQueue();
        }
    
		function newDecoderAvailable(preferredDecoderType, resetSurface) {
		    // Ask for a reinit so we can switch the the new decoder
		    var flags = RENDERMODE.TWFULL;
		    if (preferredDecoderType !== DecoderType.None) {
		        flags |= RENDERMODE.H264;
                if (resetSurface) {
                    thinwireWrapper.initRenderSurface();
                }
		    }
		    twEngine.setRenderCaps(flags);
		    twEngine.tw2SendEnhancedModeChange();
		    cmdQueue.clear();
		    decoder = null;
		}

		function decodeComplete(yBuf, uBuf, vBuf, rectCount, dirtyRects, decodedFrame, decodeTime, queueTime, colorFormat) {
		    if (decoder !== null) {
		        var startTime = timestamp();
		        currentFrameTime.queuedTime = startTime - queueTime - decodeTime;
		        currentFrameTime.decodeTime = decodeTime;
		        lastDecodedFrame = decodedFrame;
		        for (var i = 0; i < rectCount; i++) {
		            // restore type data for dirty rects, lost in post message calls
		            dirtyRects[i] = new Rectangle(dirtyRects[i].X, dirtyRects[i].Y, dirtyRects[i].Width, dirtyRects[i].Height);
		        }
		        thinwireWrapper.renderYuvSurface(yBuf, uBuf, vBuf, rectCount, dirtyRects, colorFormat);
		        var stopTime = timestamp();
		        currentFrameTime.renderTime = stopTime - startTime;
		        currentFrameTime.waitForPresentTime = stopTime;
		        processCmdQueue();
		    }
        }

        function sessionModeChange(data) {
            writeHTML5Log(0, LOGGER + "Session mode change");
            
            thinwireWrapper.setRenderMode(RENDERMODE.H264, data);    
            if(cmdQueue.length > 0){
                var cmd = cmdQueue.peek();
                if(cmd.cmd === GFX_CMD_INIT){
                    cmdQueue.dequeue();
                }
            }
            processCmdQueue( );
        }

        function onFlowControlFpsChange(fps) {
            //console.log("JS FPS Received " + fps);            
            var buf = new Uint8Array(6);
            buf[0] = PACKET_COMMAND_CACHE;
            buf[1] = 0x03;
            buf[2] = 0x00;
            buf[3] = COMMAND_TW2_C2S_CLIENT_FPS_LIMIT;
            buf[4] = fps & 0xff;
            buf[5] = (fps >> 8) & 0xff;
            thinwireWrapper.writeCachePacket(buf);
            //writeHTML5Log(0, LOGGER + "fps change " + fps);
        }

        function processCmdQueue() {
            var cmd, gfxCmd;
            if (decoder === null) {
                cmdQueue.clear();
                return;
            }

            while (cmdQueue.length > 0) {
                cmd = cmdQueue.peek();
                gfxCmd = cmd.cmd;
                
                if (gfxCmd === GFX_CMD_INIT || (gfxCmd === GFX_CMD_EOF && cmd['frameNr'] !== lastDecodedFrame && cmd['h264Frame'])) {
                    return;
                }

                cmd = cmdQueue.dequeue();
                switch (gfxCmd) {
                    case GFX_CMD_SOLID_COLOR:
                        thinwireWrapper.addOverlaySolidRect(cmd);
                        break;
                    case GFX_CMD_BMP:
                        thinwireWrapper.addOverlayBitmap(cmd);
                        break;
                    case GFX_CMD_EOF:
                        thinwireWrapper.presentFrame(cmd);
                        var time = timestamp();
                        if (currentFrameTime.waitForPresentTime) {
                            // Only process if it's an h.264 frame, ignore small frames for
                            // flow control purposes.
                            currentFrameTime.waitForPresentTime = time - currentFrameTime.waitForPresentTime;
                            if (twFlowControl) {
                                twFlowControl.frameProcessed(currentFrameTime);
                            }
                            currentFrameTime.waitForPresentTime = 0;
                        }
                        break;
                     case GFX_CMD_TEXT_BMP:
                        thinwireWrapper.addTextBitmap(cmd);
                        break;
                    case GFX_CMD_DELETE_TEXT:
                        thinwireWrapper.deleteText(cmd);
                        break;
                    case GFX_CMD_CLEAR_OVERLAY:
                        thinwireWrapper.clearOverlays(cmd);
                        break;
                }
            }
        }

        this.previousColorFormat = 0;

        this.render = function (cmd, twStream, cache) {
            frameToDraw = true;
			// Store the last co-ordinate and reset it if we ran out of space!
			// Otherwise we might read relative co-ordinate more than once.
			var currentCoord = twStream.GetLastCoordinate();
			var lastCoord = new Point(currentCoord.X, currentCoord.Y); // Clone it as we dont want it to be modified.
			
			try {			
				switch (cmd) {
					
					case CMD_TW2_SOLID_FILL_NEW_COLOR_NO_CLIPPING:
						currentSolidColor = twStream.ReadRGB();
						// fallthrough, now solid fill operations are the same
					case CMD_TW2_SOLID_FILL_NO_CLIPPING:
						var rect = new Rectangle(0, 0, 0, 0);
						twStream.ReadRectangle(rect);
						cmdQueue.queue({'cmd': GFX_CMD_SOLID_COLOR, 'rect': rect, 'color': currentSolidColor});
						processCmdQueue();
						break;
						
					case CMD_TW2_BITBLT_TRICK:
					case CMD_TW2_TEXT_TRACKING_DRAW:
						var srcBmp = twStream.ReadBitmapUnpaletted(cache);
						var dest = new Point(0, 0);
						twStream.ReadCoordinate(dest);
						// TODO: need to set alpha and convert rgb to rgba format, is there a better way
						var pixelBytes = new Uint8Array(srcBmp.Pixels.byteLength);
						var pixel;
						for (var i = 0; i < srcBmp.Pixels.length; i++) {
							pixel = srcBmp.Pixels[i];
							pixelBytes[(i * 4)] = ((pixel & 0x00ff0000) >> 16);
							pixelBytes[(i * 4) + 1] = ((pixel & 0x0000ff00) >> 8);
							pixelBytes[(i * 4) + 2] = (pixel & 0x000000ff);
							pixelBytes[(i * 4) + 3] = 0xff;
						}
						var rect = new Rectangle(dest.X, dest.Y, srcBmp.Width, srcBmp.Height);
						var type = (cmd === CMD_TW2_BITBLT_TRICK)? GFX_CMD_BMP : GFX_CMD_TEXT_BMP;
						cmdQueue.queue({'cmd': type, 'bmp': pixelBytes.buffer, 'rect': rect});  
						processCmdQueue();
						break;
						
					case CMD_TW2_TEXT_TRACKING_DELETE:
						var point = new Point(0, 0);
						twStream.ReadUIntXY(point);
						size = new Size(point.X, point.Y);
						twStream.ReadCoordinate(point);
						var rect = new Rectangle(point.X, point.Y, size.Width, size.Height);
						var msg = {'cmd': GFX_CMD_DELETE_TEXT, 'rect': rect};
						cmdQueue.queue(msg);
						processCmdQueue();
						break;
						
					default:
						writeHTML5Log(0, LOGGER + "Unexpected graphics command: " + cmd);
						console.error("Unexpected graphics command: " + cmd);
						throw TwTwoDriverError.UNKNOWN_TW2_COMMAND;
						break;
				}
			} catch (error) {
				// reset the last co-ordinate now and continue!
				if( error == VirtualStreamError.NO_SPACE_ERROR ) {
					twStream.ResetLastCoordinate(lastCoord);
				}
				throw error ;
			}
        };

        this.reinitialize = function (colorMode, width, height, capabilities) {
            writeHTML5Log(0, LOGGER + "Initialize " + width + " " + height);
            lastDecodedFrame = -1;
            frameCount = 0;
            cmdQueue.clear();
            if (colorMode != ColorConstants.COLOR_RGB_24BIT) {
                // only 24-bit color is supported in h.264 mode
                throw TwTwoDriverError.TW2_COLOR_MODE_NOT_SUPPORTED;
            }
        
            this.dispose();
            decoder = decoderFactory.getDecoder(decodeComplete, sessionModeChange);
            currentFrameTime.parallelDecodeAndRender = decoder.isDecodeAndRenderParallel();
              
            twFlowControl = capabilities.fpsLimitSupport ? new ThinwireFlowControl(onFlowControlFpsChange, DecoderConstants.MIN_FRAME_TIME) : null;  
            cmdQueue.queue({ 'cmd': GFX_CMD_INIT, 'frameNr': frameCount, 'h264Frame': h264Frame });
            decoder.reinitialize(width, height);
        };

        this.endOfFrame = function () {
            if (frameToDraw) {
                frameToDraw = false;
                cmdQueue.queue({ 'cmd': GFX_CMD_EOF, 'frameNr': frameCount, 'h264Frame': h264Frame });
                frameCount++;
                h264Frame = false;
                processCmdQueue();
            }
        };

        this.dispose = function () {
            if (decoder) {
                //writeHTML5Log(0, LOGGER + "Decoder dispose");
                decoder.dispose();
                decoder = null;
            }
        };
    }

    return H264Renderer;
})();