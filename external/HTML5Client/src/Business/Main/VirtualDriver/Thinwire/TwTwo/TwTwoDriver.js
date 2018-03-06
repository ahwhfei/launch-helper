function TwTwoDriver(gcontext, rendForm, callbackWrapper, memoryCache)
{
    var gcontext = gcontext;
    var frame = 1;
    var myself = this ;
    var twAnyDriver = new TwAnyDriver(gcontext , myself );
    var version = 0;
    var input = null;
    var memoryCache = memoryCache;
    var rForm = rendForm;
    var line = new LineGraphics();
    var block = new BlockGraphics();
    var text = new TextGraphics();
    var image = new ImageGraphics();
    var pointer = new PointerGraphics();
	
    var NULL_SURFACE   					 	 	= -1;
    var NULL_CONTEXT 					 		= new GraphicsContext(false);
    var TW2_VERSION 					 	 	= 2;
    var TW2_VERSION_CAPS_MIN 			 	 	= 3;
    var stopwatchReplyPacket = new Uint8Array(10);
        stopwatchReplyPacket[0] = PACKET_COMMAND_CACHE;
        stopwatchReplyPacket[1] = 0x07;
        stopwatchReplyPacket[2] = 0x00;
        stopwatchReplyPacket[3] = COMMAND_TW2_C2S_STOPWATCH_RESULT;
        stopwatchReplyPacket[4] = 0;
        stopwatchReplyPacket[5] = 0;
        stopwatchReplyPacket[6] = 0;
        stopwatchReplyPacket[7] = 0;
        stopwatchReplyPacket[8] = 0;
        stopwatchReplyPacket[9] = 0;
	  
    var ggWD = null;
    
    var lastCoordinate = new Point();
    
    var cacheStream = new CacheStream();
    var decoder
    var destPoint;
    var frameWidth;
    var frameHeight;
    
    var isUint8ClampSupport = window.Uint8ClampedArray ? true : false;
    var PixelDataType = isUint8ClampSupport ? Uint8ClampedArray : Uint8Array;
    var useTextures = (HTML5_CONFIG && HTML5_CONFIG['features'] && HTML5_CONFIG['features']['graphics'] && (HTML5_CONFIG['features']['graphics']['useGlTexH264'] == false))? false : true;
    
    // Fix: RFHTMCRM-1166
    // 
    var lastY, 
        lastU, 
        lastV;
    
    this.setgWD = function() {
        ggWD = twAnyDriver.GetGWD();
    };

    var VarUIntSize = function varUIntSize(value) {
		if (value < 128)
			return 1;
		else if (value < 16384)
			return 2;
		else if (value < 2097152)
			return 3;
		else if (value < 268435456)
			return 4;
		else
			return 5;
	};

    var VarUIntXYSize = function varUIntXYSize(x, y) {
		if (y <= 7  &&  x <= 7)
			return 1;
		else if (y <= 63  &&  x <= 255)
			return 2;
		else if (y <= 16383  &&  x <= 65535)
			return 4;
		else
			return 8;
	};
    var stopwatches = new Dictionary();

    var CmdStopwatchStart = function cmdStopwatchStart() {
		var now = 0;
		var id = input.ReadUInt16();
		if (ggWD.IsInteractive())
		{
			gcontext.FlushDisplay();
			now = (new Date()).getTime() * 10000;
			ggWD.ResetInteractive();
		}
		else
		{
			now = 0;
		}

		stopwatches.Add(id, now);
	};

    var CmdStopwatchRead = function cmdStopwatchRead(input) {
 		var id = input.ReadUInt16();
		var then = stopwatches.Value(id);
		var time = 0;
		var i = 4;

		if (then != 0)
		{
			
			gcontext.FlushDisplay();
			var now = (new Date()).getTime() * 10000;
            //double bitwise NOT to floor
			time = ~~((now - then) / 10000);
		}

		stopwatchReplyPacket[i++] = id & 0xFF;
		stopwatchReplyPacket[i++] = (id >>> 8) & 0xFF;
		stopwatchReplyPacket[i++] = time & 0xFF;
		stopwatchReplyPacket[i++] = (time >>>  8) & 0xFF;
		stopwatchReplyPacket[i++] = (time >>> 16) & 0xFF;
		stopwatchReplyPacket[i++] = (time >>> 24) & 0xFF;

		if (ggWD != null)
		{
			ggWD.writeCachePacket(stopwatchReplyPacket);
		}
	};
	
	
    this.EndWriting = function endWriting(reason) {
        if (gcontext != null && gcontext.FrameBuffer != null ) {
            gcontext.FrameBuffer.EndWriting( );
        }
    };

    //this.Open = function open(){};

    this.SetWinstationDriver = function setWinstationDriver(winstationDriver) {
        image.SetWinstationDriver(winstationDriver);
        return twAnyDriver.SetWinstationDriver(winstationDriver);
    };


    this.SetReadStream = function setReadStream(readStream) {
        twAnyDriver.SetReadStream(readStream);
    };

    this.Close = function close() {
        twAnyDriver.Close();
    };

    this.AlterDisplaySize = function alterDisplaySize(width, height, rendForm) {
        twAnyDriver.AlterDisplaySize(width, height, rendForm);
    };

    this.GetLastCD= function getLastCD() {
        return input.GetLastCoordinate();
    };

    this.SetLastCD = function setLastCD(pt) {
        input.ResetLastCoordinate(pt);
    };

    this.SetInputStream = function setInputStream(readStream ,input1 ) {
        this.SetReadStream(readStream);
        input = input1 ;
    };

    this.SwitchInputStream  = function switchInputStream(readStream) {
        return input.SwitchReadStream(readStream);
    };
        
    this.reinitialize = function(colorMode, width, height, capabilities) {
        NULL_CONTEXT.ColorMode = colorMode;
        callbackWrapper.setRenderMode(RENDERMODE.TWFULL, {'width': width, 'height': height});
        
        // TODO: render surface based check and graphics operation decision should
        // be handled better in common place
        // check the current active render surface and set useTextures state to false
        // if it is '2d' surface
        // for now using g.env object but to finalize graphics runtime config sharing mech to
        // be used by all graphics components
        useTextures = (useTextures && g && g.environment && (g.environment["gfxCtx"] == RENDER_SURFACE_WEBGL));
        lastY = null;
        lastU = null;
        lastV = null;
        frame = 1;            
        this.AlterDisplaySize( width, height, rForm);
    };
    
    this.endOfFrame = function( ) {
        myself.RenderCanvas();
    };
    
    this.frameComplete = function frameComplete(encodeBuffer, gCurrentUncachedBmp, gRegionData, gDestPoint) {
        cacheStream.Reset(encodeBuffer, 0, gCurrentUncachedBmp.uiEncodedDataSize);
        destPoint = gDestPoint;
        // TODO: Move h264 decode to bimap maker
        if ((gCurrentUncachedBmp.controlByte >> 4) == RleDecode.BMP_CODEC_ID_H264) { // codec Id
            
            var rectCount = gRegionData.rectCount, 
                dirtyRects = gRegionData.dirtyRects, 
                imageQ = gRegionData.imageQ, 
                colorFormat = gCurrentUncachedBmp.bmi.colorFormat;
        
            // TODO: check for new context and delete the older one on size change
            // For now there is only a single context so always create new context.
            // When supporting multi context, each should be uniquely identified based
            // on its size and position and respect the deletion bit as well
            if (frameWidth != gCurrentUncachedBmp.bmi.width || frameHeight != gCurrentUncachedBmp.bmi.height) {
                if (decoder) {
                    decoder.dispose();
                }
                // TODO: use factory to get the decoder and modify decoder to force use 
                // one decoder with no decoder switch
                decoder = new CoreAvcDecoder(decodeComplete, modeChangeCallback);
                decoder.addAvailabilityListener(checkDecoderChange);
			}
            
            // Fix: RFHTMCRM-1166 - workaround
            // Offscreen framebuffer pixel array will not have latest yuv updates when using 
            // YUV texture, this causes graphics corruption of rendering older rgb data when we
            // drag the h264 screen and context got updates. For now, the workaround it to convert
            // the last yuv data to rgb and bitblt to rgb texture on delete context.
            // 
            if (gCurrentUncachedBmp.deleteContext) {
                if (useTextures) {
                    if (lastY && lastU && lastV){
                        var lastYuvBmp = new DirectBitmap(frameWidth, frameHeight, false);
                        // TODO: send format to DirectBitmap to create pixel array of specific format
                        var lastYuv2RgbPixels = new PixelDataType(frameWidth * frameHeight * 4);

                        convertYUV420RGB(lastY, lastU, lastV, lastYuv2RgbPixels, frameWidth, frameHeight, 0, 0);
                        lastYuvBmp.Pixels = new Int32Array(lastYuv2RgbPixels.buffer);
                        gcontext.BitbltTrick(new Point(destPoint.X, destPoint.Y), lastYuvBmp);
                    }
                }
            }
            
            frameWidth = gCurrentUncachedBmp.bmi.width;
            frameHeight = gCurrentUncachedBmp.bmi.height;
            
            // TODO: since we are using single context there is no explicit
            // handler neccessary to delete the context for now based on the rectangle.
            // When using multiple context, means multi decoder the context should be searched
            // from hash and deleted when this delete context bit is set.
            if (gCurrentUncachedBmp.deleteContext) {
                if (useTextures) {
                    callbackWrapper.clearOverlays();
                }
            }
            else {
                decoder.decodeFrames(encodeBuffer, rectCount, dirtyRects, 0, 0, frameWidth, frameHeight, colorFormat);
            }
        }
        else {
            var dBmp = Bitmap.Make(cacheStream, gCurrentUncachedBmp.controlByte, gCurrentUncachedBmp.bmi.width, gCurrentUncachedBmp.bmi.height);
            gcontext.BitbltTrick(new Point(gDestPoint.X, gDestPoint.Y), dBmp);
        }                
    };    
   
    function modeChangeCallback() {
        // TODO: dummy function ; tobe removed 
    }
    
    
    function decodeComplete(yBuf, uBuf, vBuf, rectCount, dirtyRects, decodedFrame, decodeTime, queueTime, colorFormat) {
        if (decoder !== null) {
          
		    lastY = yBuf;
            lastU = uBuf;
            lastV = vBuf;
            
            if (rectCount == 0)
                return;
            
            if (!useTextures) {
                var dBmp = new DirectBitmap(frameWidth, frameHeight, false);
                // TODO: send format to DirectBitmap to create pixel array of specific format
                var pixels = new PixelDataType(frameWidth * frameHeight * 4);
            
                convertYUV420RGB(yBuf, uBuf, vBuf, pixels, frameWidth, frameHeight, 0, 0);
                dBmp.Pixels = new Int32Array(pixels.buffer);
            
                //for (var i = 0; i < rectCount; i++) {
                //    dirtyRects[i] = new Rectangle(dirtyRects[i].X, dirtyRects[i].Y, dirtyRects[i].Width, dirtyRects[i].Height);
                // TODO: render only the dirty region
                //setBoundary(dBmp, dirtyRects, i);
                //gcontext.BitbltTrick(new Point(destPoint.X, destPoint.Y), dBmp, dirtyRects[i]);
                //callbackWrapper.renderYuvSurface(yBuf, uBuf, vBuf, rectCount, dirtyRects, colorFormat);
                //}
            
                // TODO: UT call to be moved to wrapper       
                // drawBitmap(destPoint.X, destPoint.Y, dBmp);
                gcontext.BitbltTrick(new Point(destPoint.X, destPoint.Y), dBmp);
            } else {
				// draw YUV overlay.
                var rect = new Rectangle(destPoint.X, 
									 destPoint.Y,
									 frameWidth,
									 frameHeight);			
                callbackWrapper.renderYuvSurface(yBuf, uBuf, vBuf, 1, [rect], DecoderConstants.TW2_YUV420);
				rForm.dirty = true; // explicitly mark frame as dirty as we are bypassing gContext.
            }
        }
    }
    
    function checkDecoderChange() {
        // TODO: dummy call, remove after decoder factory change to force use
    }
    
    // TODO: convert yuv420 to BGRA
    // Move to common util or emscripten lib
    function clampValue(val) {
		if (val < 0) return 0;
		if (val > 255) return 255;
		return val;
	}
	
	
    function convertYUV420RGB(ybuffer, ubuffer, vbuffer, buffer, yuvWidth, yuvHeight, x, y) {
        var y1, y2, y3, y4, u, v;
        var desOff1 = 0, desOff2 = 0;
        var srcOff1 = 0, srcOff2 = 0;
        var srcoff3;
		
        var textureWidth = yuvWidth;
		// enlarge rect if x/y/width/height is odd
        if (x & 1) { x--; yuvWidth++; }
        if (yuvWidth & 1) { yuvWidth++; }
        if (y & 1) { y--; yuvHeight++; }
        if (yuvHeight & 1) { yuvHeight++; }
        
		var start = y * textureWidth + x;
        for (var i = 0; i < yuvHeight;) {
            srcOff1 = start + i * textureWidth;
            srcOff2 = srcOff1 + textureWidth;
            srcoff3 = (srcOff1+x) >>> 2;
            desOff1 = srcOff1 << 2;
            desOff2 = srcOff2 << 2;
            for (var j = 0; j < yuvWidth ;) {             
                y1 = ((ybuffer[srcOff1]) - 16) * 1.164;
                y2 = ((ybuffer[srcOff1 + 1]) - 16) * 1.164;
                y3 = ((ybuffer[srcOff2]) - 16) * 1.164;
                y4 = ((ybuffer[srcOff2 + 1]) - 16) * 1.164;
                u = ubuffer[srcoff3] - 128;
                v = vbuffer[srcoff3] - 128;
                var u1v2 = (0.392 * u + 0.813 * v);
                var u2 = 2.017 * u;
                var v1 = 1.596 * v;
                // B = 1.164(Y - 16) + 2.018(U - 128)
                // G = 1.164(Y - 16) - 0.813(V - 128) - 0.391(U - 128)
                // R = 1.164(Y - 16) + 1.596(V - 128)
                if (isUint8ClampSupport) {
                    buffer[desOff1 + 3] = 0x0ff;                      
                    buffer[desOff1 + 2] = (y1 + v1);       
                    buffer[desOff1 + 1] = (y1 - u1v2);     
                    buffer[desOff1 + 0] = (y1 + u2);        
                    desOff1 += 4;

                    buffer[desOff1 + 3] = 0xff;
                    buffer[desOff1 + 2] = (y2 + v1);
                    buffer[desOff1 + 1] = (y2 - u1v2);
                    buffer[desOff1 + 0] = (y2 + u2);
                    desOff1 += 4;

                    buffer[desOff2 + 3] = 0xff;
                    buffer[desOff2 + 2] = (y3 + v1);
                    buffer[desOff2 + 1] = (y3 - u1v2);
                    buffer[desOff2 + 0] = (y3 + u2);
                    desOff2 += 4;

                    buffer[desOff2 + 3] = 0xff;
                    buffer[desOff2 + 2] = (y4 + v1);
                    buffer[desOff2 + 1] = (y4 - u1v2);
                    buffer[desOff2 + 0] = (y4 + u2);
                    desOff2 += 4;
                }
                else { // clamp the value 
                    buffer[desOff1 + 3] = 0x0ff;                      
                    buffer[desOff1 + 2] = clampValue(y1 + v1);       
                    buffer[desOff1 + 1] = clampValue(y1 - u1v2);     
                    buffer[desOff1 + 0] = clampValue(y1 + u2);        
                    desOff1 += 4;
                
                    buffer[desOff1 + 3] = 0xff;
                    buffer[desOff1 + 2] = clampValue(y2 + v1);
                    buffer[desOff1 + 1] = clampValue(y2 - u1v2);
                    buffer[desOff1 + 0] = clampValue(y2 + u2);
                    desOff1 += 4;

                    buffer[desOff2 + 3] = 0xff;
                    buffer[desOff2 + 2] = clampValue(y3 + v1);
                    buffer[desOff2 + 1] = clampValue(y3 - u1v2);
                    buffer[desOff2 + 0] = clampValue(y3 + u2);
                    desOff2 += 4;

                    buffer[desOff2 + 3] = 0xff;
                    buffer[desOff2 + 2] = clampValue(y4 + v1);
                    buffer[desOff2 + 1] = clampValue(y4 - u1v2);
                    buffer[desOff2 + 0] = clampValue(y4 + u2);
                    desOff2 += 4;
                }
                j += 2;
                srcOff1 += 2;
                srcOff2 += 2;
                srcoff3 += 1;
            }
            i += 2;
        }
    }
    
    this.render = function processNextCmd(command, twStream, cache) {
		var temp = myself.GetLastCD();
		lastCoordinate.X = temp.X;
		lastCoordinate.Y = temp.Y;
        //var status = true;
		try
		{
	 		switch (command)
			{
				case CMD_TW2_NULL_CLIP_REGION:
					return gcontext.SetClipRegionSize(0);
					break;
				case CMD_TW2_SIMPLE_CLIP_REGION:
					return input.CmdChangeClipRegionSimple(gcontext);
					break;
				case CMD_TW2_COMPLEX_CLIP_REGION:
					return input.CmdChangeClipRegionComplex(gcontext, memoryCache);
					break;
				case CMD_TW2_NEW_SOLID_BRUSH:
					return image.CmdNewSolidBrush(gcontext, input);
					break;
				case CMD_TW2_NEW_PATTERN_BRUSH:
					return image.CmdNewPatternBrush(gcontext, input, memoryCache);
					break;
				case CMD_TW2_CHANGE_TEXT_MODE:
					return gcontext.ToggleOpaqueText();
					break;
				case CMD_TW2_CHANGE_TEXT_COLOR:
					return text.CmdChangeTextColor(gcontext, input);
					break;
				case CMD_TW2_CHANGE_TEXT_BACKGROUND_COLOR:
					return text.CmdChangeTextBackgroundColor(gcontext, input);
					break;
				case CMD_TW2_CHANGE_PALETTE:
					return input.CmdChangePalette(gcontext, memoryCache);
					break;
				case CMD_TW2_SOLID_FILL:
					return block.CmdClippedSolidFill(gcontext, input);
					break;
				case CMD_TW2_SOLID_FILL_NEW_COLOR:
					block.NewSolidColor(gcontext, input);
					return block.CmdClippedSolidFill(gcontext, input);
					break;
				case CMD_TW2_SOLID_FILL_NO_CLIPPING:
					return block.CmdSolidFill(gcontext, input);
					break;
				case CMD_TW2_SOLID_FILL_NEW_COLOR_NO_CLIPPING:
				    return block.CmdSolidFillNewColorNoClip(gcontext, input);
					break;
				case CMD_TW2_BITBLT_TRICK_PARTIAL:
					return image.CmdBitbltTrickPartial(gcontext, input, memoryCache);
					break;
				case CMD_TW2_BITBLT_TRICK:
					return image.CmdBitbltTrick(gcontext, input, memoryCache);
					break;
				case CMD_TW2_SCR_TO_SCR_BITBLT:
					return image.CmdScrToScrBitblt(gcontext, input, memoryCache);
					break;
				case CMD_TW2_BITBLT:
					return image.CmdBitblt(gcontext, input, memoryCache);
					break;
				case CMD_TW2_TEXT_OUT:
					return text.CmdTextOut(gcontext, input, memoryCache);
					break;
				case CMD_TW2_DRAW_PATH:
					return line.CmdDrawPath(gcontext, input, memoryCache);
					break;
				case TW2_WRITE_DISK_OBJECTS:
					break;
				case TW2_WRITE_DISK_COOKIES:
					break;
				case TW2_READ_DISK_OBJECT:
					break;
				case TW2_CMD_START_STOPWATCH:
					return CmdStopwatchStart();
					break;
				case TW2_CMD_STOP_STOPWATCH:
					return CmdStopwatchRead();
					break;
				case TW2_CMD_BITBLT_SPEEDBROWSE:
				case TW2_CMD_CREATE_SPEEDBROWSE_IMAGE:
				case TW2_CMD_DELETE_SPEEDBROWSE_IMAGE:
				case TW2_CMD_ASSOCIATE_SPEEDBROWSE_DATA_CHUNK:
				case TW2_CMD_STRETCHIMAGE_SPEEDBROWSE:
					// Speed Browse not supported
					break;
				case TW2_CMD_ACTIVATE_THINWIRE_REDUCER:
					// This command is not meaningful for a client, so it is ignored.
		            // Signature bytes.
		            input.ReadInt32();
		            input.ReadInt32();
		            input.ReadInt32();
		            input.ReadInt32();
		            var parserLevel = input.ReadByte();
					break;
			
				default:
					throw TwTwoDriverError.UNKNOWN_TW2_COMMAND;
					break;
			}
//            if (HTML5_CONFIG && HTML5_CONFIG['features'] && HTML5_CONFIG['features']['graphics'] && HTML5_CONFIG['features']['graphics']['noWaitForSpaceEx']) {
//                if (!status) {
//                    return status; 
//                }
//            }
		}
		catch (error)
		{
			if( error == VirtualStreamError.NO_SPACE_ERROR )
			{
				myself.SetLastCD(lastCoordinate);
			}
			throw error ;
		}
	};
    
    this.RenderCanvas = function renderCanvas() {
            if (rForm.dirty == true) {
                var dfb = gcontext.FrameBuffer;
                if (dfb != null) {
                    if (dfb instanceof DirectFrameBuffer) {
                        var gPainter = dfb.gPainter;
                        gPainter.FlushRectangle(callbackWrapper);
                        //callbackWrapper.presentFrame( );
                    }
                    else {
                        throw VirtualDriverError.UNSUPPORTED_BUFFER;
                    }
                }
                callbackWrapper.presentFrame( );
                rForm.dirty = false;
            }
      
    };

	
}


