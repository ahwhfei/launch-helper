function ThinwireEngine(callback) { 
    var LOGGER = "TW" + "_" + "ENG" + ": ";

    var callbackWrapper = callback;
    var thinWireStack = new ThinWireStack();
    var renderForm = new RenderForm();
    var capabilities = new Tw2Capabilities();
    var myself = this;
    
    var prevReadIndex = 0;
    var mCache = null;
    var mCacheVar = null;
    var lastCoordinate = new Point();
    
    var readMode = 0;
    var reqiredByteData = 0;

    var TW2_CAPUPDATE_PREFMODE = 0x01;
    var TW2_CAPUPDATE_CAPS = 0x02;
    var vStream;
    var streamName = "CTXTW  ";
    var streamSize = 0x10000;
    var nRemainingInStream = 0;
    var availByteInStream = 0;
    var renderer = null;
    var normalRenderer = null;
    var h264Renderer = null;
    var memoryCache = new MemoryCache();
    var pointer = new PointerGraphics(callback);
    var gc = new GraphicsContext(false);
	var resolutionObject = {};
	var monitorCountToVDA = 0;
	var isFirstTwInit = true;
    var createVirtualStream = function (streamName, streamSize) {
        var chnl = ChannalMap.virtualChannalMap[streamName];
        var stream = new VirtualStream(chnl, callbackWrapper, streamSize);
        return stream;
    };

    this.getStreamName = function () {
        return streamName;
    };

    this.getVStream = function () {
        return vStream;
    };

    this.EndWriting = function endWriting(reason) {
        MediaEncoder.canvas = null;
        //if (twTwoDriver != null) {
        //    twTwoDriver.EndWriting(reason);
        //}
    };

    this.SetStack = function () {
        vStream = createVirtualStream(streamName, streamSize);
        twStream = new TwWireStream(vStream);
        //processor.setStack(stack);
        return vStream;
    };

    this.setLastRequiredByte = function (moreByteData) {
        //console.log("byte re" + moreByteData );
        reqiredByteData = moreByteData;
    };

    this.getColorDepth = function () {
        switch (gc.colorMode) {
            case ColorConstants.COLOR_PALETTED_1BIT:
                return 1;

            case ColorConstants.COLOR_PALETTED_4BIT:
                return 4;

            case ColorConstants.COLOR_PALETTED_8BIT:
                return 8;

            case ColorConstants.COLOR_RGB_16BIT:
                return 16;

            case ColorConstants.COLOR_RGB_24BIT:
                return 24;
        }

        return 0;
    };
	
	this.setRenderCaps = function(flags) {
		thinWireStack.setRenderCaps(flags);
	};
    
	this.setResolution = function(res) {
        writeHTML5Log(0, LOGGER + "set resolution : " + res.width + ", " + res.height);
        resolutionObject.Width = res.width;
        resolutionObject.Height = res.height;
        myself.initCount = 0;
        if (!capabilities.multimonitor) {
            this.sendCapabilities();
        }
	};
	
	var sendCapabilities = function(prefModeOnly){
		if (capabilities.enhanceMode == true) {
			this.tw2SendEnhancedModeChange();
		} else {
			this.writeCapabilitiesUpdate(prefModeOnly);
		}
	};

    this.sendCapabilities = sendCapabilities;
	
	this.setMonitorInfo = function(sendToVda, monitorCount){	  
      var prefModeOnly = true;
	  if (capabilities.multimonitor) {
            thinWireStack.setMonitorInfo();
            if(sendToVda == true){
                writeHTML5Log(0, LOGGER + "update monitor info : old_count " + monitorCountToVDA + ", new_count " + monitorCount);
                monitorCountToVDA = monitorCount;
                this.sendCapabilities(prefModeOnly);
            }
	    }
	};

	this.tw2SendEnhancedModeChange = function() {
		if(capabilities.enhanceMode == false)
		{
			return;
		}
        callbackWrapper.showResizeDialog();
		var res = resolutionObject;
		var capsArray = thinWireStack.getThinwireCapabilityBlocks();
		var packetLen = capsArray.length + 1 + SIZE_OF_TW_DISPLAY_MODE + 2 ;
		var out = new ByteArrayOutputStream();
		out.WriteByte(PACKET_COMMAND_CACHE);
		ByteWriter.WriteInt16ToStream(out, packetLen);
		out.WriteByte(COMMAND_TW2_C2S_ENHANCED_MODE_CHANGE);
		out.WriteByte(0);
		out.WriteByte(myself.getColorDepth());
		// colour depth
		ByteWriter.WriteInt16ToStream(out, res.Width);
		ByteWriter.WriteInt16ToStream(out, res.Height);
        writeHTML5Log(0, LOGGER + "Enhanced mode change. Res : " + res.Width + ", " + res.Height);
		ByteWriter.WriteInt16ToStream(out, capsArray.length);
		out.WriteByteArray(capsArray, 0, capsArray.length);

		var outBytes = out.ToByteArray();
		callback.writeCachePacket(outBytes);
	};

    this.writeCapabilitiesUpdate = function (prefModeOnly) {
		var res = resolutionObject;
		if (capabilities.capUpdateSupport) {
            callbackWrapper.showResizeDialog();
                    
            var out = new ByteArrayOutputStream();

            out.WriteByte(PACKET_COMMAND_CACHE);
            ByteWriter.WriteInt16ToStream(out, 76);

            // Begin header (4 bytes)
            out.WriteByte(COMMAND_TW2_C2S_CAPABILITIES_UPDATE);
            out.WriteByte(0); // reserved
            ByteWriter.WriteInt16ToStream(out, 72); // packet length excluding header
            // End header

            // Begin TW2_UPDATED_CAPS structure
            var flags = prefModeOnly ? TW2_CAPUPDATE_PREFMODE : (TW2_CAPUPDATE_PREFMODE | TW2_CAPUPDATE_CAPS);
            ByteWriter.WriteInt16ToStream(out, flags); // flags
            ByteWriter.WriteInt16ToStream(out, 0); // reserved/padding
            // Begin TW_DISPLAY_MODE structure (8 bytes)
            out.WriteByte(0); // flags
            out.WriteByte(myself.getColorDepth()); // colour depth

            writeHTML5Log(0, LOGGER + "Update capabilities. Res : " + res.Width + ", " + res.Height);
            ByteWriter.WriteInt16ToStream(out, res.Width);
            ByteWriter.WriteInt16ToStream(out, res.Height);
            ByteWriter.WriteInt16ToStream(out, 0); // padding
            // End TW_DISPLAY_MODE

            // Begin THINWIRECAPS structure (24 bytes)
            var capsStream = new OffsetableOutputStream();
            var colorPref = (gc.colorMode == ColorConstants.COLOR_RGB_16BIT) ? 0x4 : 0x8;
			thinWireStack.reWriteThinwireCaps(capsStream, res, colorPref);
            var capsBytes = capsStream.ToByteArray();
            out.WriteByteArray(capsBytes, 0, capsBytes.length);
            // End THINWIRECAPS

            // Write 9 x SCREENRES structures, all ignored (36 bytes)
            for (var i = 0; i < 9; i++) {
                ByteWriter.WriteInt16ToStream(out, 0); // width
                ByteWriter.WriteInt16ToStream(out, 0); // height
            }
            // End SCREENRES

            // End TW2_UPDATED_CAPS

            var outBytes = out.ToByteArray();
            callback.writeCachePacket(outBytes);
            
            if (capabilities.multimonitor) {
                sendMMInfoUpdate();
            }
       }
    };

    function sendMMInfoUpdate(){
        thinWireStack.getMultimonitorCapability(function(mmBuffer){
            writeHTML5Log(0, LOGGER + " send monitor info update");
    		mmBuffer[0]=8;
    		var out = new ByteArrayOutputStream();
    		out.WriteByte(PACKET_COMMAND_CACHE);
    		ByteWriter.WriteInt16ToStream(out, mmBuffer.length+3);
    
    		out.WriteByte(COMMAND_TW2_C2S_MONITOR_INFO_UPDATE);
    		ByteWriter.WriteInt16ToStream(out, mmBuffer.length);
    		for(var i=0;i<mmBuffer.length;i++){
    			out.WriteByte(mmBuffer[i]);
    		}
    		var outBytes = out.ToByteArray();
    		callback.writeCachePacket(outBytes);
        });
    }

    this.Run = function run() {
        vStream.RegisterCallback(myself._Run1);
        //twTwoDriver.Open();
        prevReadIndex = 0;
    };

    function getRenderer() {
        if (capabilities.thinwireProfile === ThinwireProfile.H264 || capabilities.thinwireProfile === ThinwireProfile.H264PlusLossless) {
            if (normalRenderer) {
                // Switch to NaCl if required.
                if (HTML5Interface.ChromeNacl.isFeatureEnabled('graphics') === true) {                    
                    callbackWrapper.reInitNativeGfx();
                }
                normalRenderer = null;
            }
			
            if (h264Renderer === null) {
				CEIP.add('graphics:decoder:type','H264');
                h264Renderer = new H264Renderer(callbackWrapper, myself);
            }
            renderer = h264Renderer;
        }
        else {
            if (normalRenderer === null) {				
                if (h264Renderer) {
                    h264Renderer.dispose(); // cleanup h264 renderer/worker/nacl if they exist
                    h264Renderer = null;
                }
                // Normal renderer uses only canvas surface so reinit the surface
                // and exit the native gfx module 
                if (HTML5Interface.ChromeNacl.isFeatureEnabled('graphics') === true) {                    
                    callbackWrapper.initRenderSurface();
                }
                normalRenderer = new TwTwoDriver(gc, renderForm, callbackWrapper, memoryCache);
                normalRenderer.SetInputStream(vStream, twStream);
                
                if (capabilities.jpegSupport) {
                    Profiler.Ui.update("Decoder", "Jpeg");
                }
                if (capabilities.multimonitor) {
                    Profiler.Ui.update("Multimonitor", "true");
                }
                if (capabilities.avoidCache) {
                    Profiler.Ui.update("AvoidCache", "true");
                }
                if (capabilities.selectiveH264) {
                    Profiler.Ui.update("selectiveH264", "true");
                }
                normalRenderer.SetInputStream(vStream, twStream);
                
                if (capabilities.jpegSupport) {
                    Profiler.Ui.update("Decoder", "Jpeg");
					CEIP.add('graphics:decoder:type','jpeg');
                }
                if (capabilities.multimonitor) {
                    Profiler.Ui.update("Multimonitor", "true");
                }
                if (capabilities.avoidCache) {
                    Profiler.Ui.update("AvoidCache", "true");
                }
                if (capabilities.selectiveH264) {
                    Profiler.Ui.update("selectiveH264", "true");
                }
                normalRenderer.SetInputStream(vStream, twStream);               
            }
            renderer = normalRenderer;
        } 
    }
    
    var twInfo = {
        version: 0,
        sessionId: 0,
        colorFormat: 0,
        screen : {
            width: 0,
            height: 0
        },
        cachePower: 0,
        handlePower: 0,
        maxObjectLength: 0,
        minDiskObjLength: 0,
        
        caps: {
            monitorInfo: {
                hdrSize: 0,
                numMonitors: 0,
                primaryMonitor: 0,
                preferredLaunchMonitor: 0,
                MmFlags: 0,     // 0x01 means TW2_MM_ENABLE_PREFERRED_LAUNCH_MONITOR
                // array of TW_MONITOR_INFO
                monitors: []
            }
        },

        reset: function reset() {
            this.caps.monitorInfo.numMonitors = 0;
            this.caps.monitorInfo.primaryMonitor = 0;
            this.caps.monitorInfo.preferredLaunchMonitor = 0;
            this.caps.monitorInfo.monitors = [];
        }
    };
    
    function onDisplaysUpdated(){
        // sending c2h pause from seamless to refresh the app window positions on thinwire init
        if(g.environment.receiver.seamlessMode){
            writeHTML5Log(0, LOGGER + "send c2h seamless pause, resume");
            callbackWrapper.sendSeamlessPauseCmd();
            callbackWrapper.sendSeamlessResumeCmd();
        }
    }
    
    function CmdInit() {
        twInfo.reset();
        var version = twStream.ReadUInt8();                 twInfo.version = version;
        var psuedoSessionId = twStream.ReadInt32();         twInfo.sessionId = psuedoSessionId;
        gc.colorMode = twStream.ReadUInt8();                twInfo.colorFormat = gc.colorMode;
        
        var point = new Point(0, 0), oldRes = new Point(0, 0);
        
        twStream.ReadUIntXY(point);                         twInfo.screen.width = point.X; twInfo.screen.height = point.Y;
        size = new Size(point.X, point.Y);
        
        var cachePower = twStream.ReadVarUInt();            twInfo.cachePower = cachePower;
        var handlePower = twStream.ReadVarUInt();           twInfo.handlePower = handlePower;
        var maxObjSize = twStream.ReadVarUInt();            twInfo.maxObjectLength = maxObjSize;
        var minDiskObjectLength = twStream.ReadVarUInt();   twInfo.minDiskObjLength = minDiskObjectLength;
		
		newSessionWidth = point.X;
		newSessionHeight = point.Y;

        memoryCache.Initialize(cachePower, handlePower, maxObjSize, minDiskObjectLength);

        twInfo.initSeedValue = twStream.ReadVarUInt();             // initialSeedValue, not needed     
        
        twStream.ReInitialize();
        
        gc.ResetOpaqueText();
        if (version >= TW2_VERSION_CAPS_MIN) {
            var capsLength = twStream.ReadUInt16();
            var offset = twStream.ReadUInt16();
            var capList = new Uint8Array(capsLength);

            twStream.ReadBytes(capList, 0, capsLength);
            
            writeHTML5Log(0, LOGGER + "Initialize " + point.X + " " + point.Y); 
            Profiler.Ui.update("Tw_Res", point.X + "x" + point.Y);
            
            if (gc.colorMode <= ColorConstants.COLOR_RGB_16BIT) {
                writeHTML5Log(0, LOGGER + "16 Bit Color");
            }
            
            capabilities = Tw2Capabilities.parse(capList, twInfo);
	
			oldRes.X = resolutionObject.Width;
			oldRes.Y = resolutionObject.Height;
            resolutionObject.Width =  point.X;
			resolutionObject.Height = point.Y;
			callbackWrapper.setSessionResolutionInfo(point.X,point.Y);
            getRenderer();
            renderer.reinitialize(gc.colorMode, point.X, point.Y, capabilities);
        }
        
        sendInitAck(psuedoSessionId);
        callbackWrapper.onInit(resolutionObject.Width ,resolutionObject.Height);
		
    	// First time set the values to current
    	if (!oldRes.X && !oldRes.Y) {
    		myself.initCount = 0;
    		oldRes.X = resolutionObject.Width;
    		oldRes.Y = resolutionObject.Height;
    	}
    	
        if (capabilities.multimonitor) {
            // On first init cmd set the intended monitorCountToVDA read from RU
            if (isFirstTwInit) {
                isFirstTwInit = false;
                var displayDetails = UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation);
                if (displayDetails.monitorCountToVDA) {
                    writeHTML5Log(0, LOGGER + " Init monitor count " + monitorCountToVDA);
                    monitorCountToVDA = displayDetails.monitorCountToVDA;
                }
            }
            initMultimonitor(oldRes);
        }

    }

    function initMultimonitorCapsUpdate(oldRes) {		
		// In case of multimonitor layout sent to VDA, where multiMonitorToVDA > 1
		//
		if (monitorCountToVDA > 1 || twInfo.caps.monitorInfo.numMonitors > 1) {
		    // If sent resolution does not match with the received one then reinit the
		    // thinwire channel twice assuming it will fix the issue.
		    // This issue observed frequently on Win7 VDAs
		    //
		    if (oldRes.X != resolutionObject.Width || oldRes.Y != resolutionObject.Height) {
                myself.initCount = myself.initCount + 1;
			     
                writeHTML5Log(0, LOGGER +"resolution sent : " + oldRes.X + ", " + oldRes.Y +', recv : '+ resolutionObject.Width + ", " + resolutionObject.Height);
                if (myself.initCount < 2) {
                    writeHTML5Log(0, LOGGER + "reset twE " + myself.initCount);
                    myself.setResolution(oldRes);
                    myself.sendCapabilities();
                }
		    } else {
                myself.initCount = 0;
                // if resolution matches for multimonitor layout but if VDA responded with wrong monitor count, then
                // assume that the monitor count received from VDA is wrong and safely use the monitor layout information
                // sent to VDA to create the display windows.
                if (twInfo.caps.monitorInfo.numMonitors !== monitorCountToVDA) {
                    // set numMonitors to zero, thereby the next execution case assumes
                    // monitorCount from VDA is wrong and uses the clinet monitor info
                    // for display window creation.
                    writeHTML5Log(0, LOGGER +"Monitor count mismatch. Sent : " + monitorCountToVDA + ", Received : " + twInfo.caps.monitorInfo.numMonitors);
                    twInfo.caps.monitorInfo.numMonitors = 0;
                }			      
		    }
		}

         // Workaround for LTSR w2k12 VDA where capability exists but monitor layout not 
        // returned. so use data sent to VDA.
		var displayDetails = UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation, null);
        if (twInfo.caps.monitorInfo.numMonitors === 0) {
            // use monitor data sent to vda 
            // use display Info array length instead of monitorCount as displayInfo array has the layout data that has
            // been sent to VDA where as monitorCount still may hold value of actual physical monitors connected.
            //
            writeHTML5Log(0, LOGGER + "using client monitor layout for display");
            
            twInfo.caps.monitorInfo.numMonitors = displayDetails.displayInfo.length;
            twInfo.caps.monitorInfo.primaryMonitor = displayDetails.primaryMonitor;

            for (var iMon = 0; iMon < twInfo.caps.monitorInfo.numMonitors; iMon++) {
                var left = displayDetails.displayInfo[iMon].bounds.left;
                var top = displayDetails.displayInfo[iMon].bounds.top;
                var right = displayDetails.displayInfo[iMon].bounds.width + left;
                var bottom = displayDetails.displayInfo[iMon].bounds.height + top;

                var wleft = displayDetails.displayInfo[iMon].workArea.left;
                var wtop = displayDetails.displayInfo[iMon].workArea.top;
                var wright = displayDetails.displayInfo[iMon].workArea.width + wleft;
                var wbottom = displayDetails.displayInfo[iMon].workArea.height + wtop;

                twInfo.caps.monitorInfo.monitors[iMon] = {
                    rect: { 
                        'left': left,
                        'top': top,
                        'right': right,
                        'bottom': bottom
                    },
                    workArea : {
                        'left': wleft,
                        'top': wtop,
                        'right': wright,
                        'bottom': wbottom
                    } 
                }                               
            }
        }        
        sendMMInfoUpdate();        
    }

    function initMultimonitorEnhancedMode(oldRes) {
       	// In case of multimonitor layout sent to VDA, where multiMonitorToVDA > 1
		//
		if (monitorCountToVDA > 1) {
		    // If sent resolution does not match with the received one then reinit the
		    // thinwire channel twice assuming it will fix the issue.
		    // This issue observed frequently on Win7 VDAs
		    //
		    if (oldRes.X != resolutionObject.Width || oldRes.Y != resolutionObject.Height) {
                myself.initCount = myself.initCount + 1;

                writeHTML5Log(0, LOGGER +"resolution sent : " + oldRes.X + ", " + oldRes.Y +', recv : '+ resolutionObject.Width + ", " + resolutionObject.Height);
                if (myself.initCount < 2) {
                    writeHTML5Log(0, LOGGER + "reset twE " + myself.initCount);
                    myself.setResolution(oldRes);
                    myself.sendCapabilities();
                }
		    } else {
                myself.initCount = 0;
                // if resolution matches for multimonitor layout but if VDA responded with wrong monitor count, then
                // assume that the monitor count received from VDA is wrong and safely use the monitor layout information
                // sent to VDA to create the display windows.
                if (twInfo.caps.monitorInfo.numMonitors !== monitorCountToVDA) {
                    // set numMonitors to zero, thereby the next execution case assumes
                    // monitorCount from VDA is wrong and uses the clinet monitor info
                    // for display window creation.
                    writeHTML5Log(0, LOGGER +"Monitor count mismatch. Sent : " + monitorCountToVDA + ", Received : " + twInfo.caps.monitorInfo.numMonitors);
                    twInfo.caps.monitorInfo.numMonitors = 0;
                }			      
		    }
		}

         // Workaround for LTSR w2k12 VDA where capability exists but monitor layout not 
        // returned. so use data sent to VDA.
		var displayDetails = UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation, null);
        if (twInfo.caps.monitorInfo.numMonitors === 0) {
            // use monitor data sent to vda 
            // use display Info array length instead of monitorCount as displayInfo array has the layout data that has
            // been sent to VDA where as monitorCount still may hold value of actual physical monitors connected.
            //
            writeHTML5Log(0, LOGGER + "using client monitor layout for display");
            
            twInfo.caps.monitorInfo.numMonitors = displayDetails.displayInfo.length;
            twInfo.caps.monitorInfo.primaryMonitor = displayDetails.primaryMonitor;

            for (var iMon = 0; iMon < twInfo.caps.monitorInfo.numMonitors; iMon++) {
                var left = displayDetails.displayInfo[iMon].bounds.left;
                var top = displayDetails.displayInfo[iMon].bounds.top;
                var right = displayDetails.displayInfo[iMon].bounds.width + left;
                var bottom = displayDetails.displayInfo[iMon].bounds.height + top;

                var wleft = displayDetails.displayInfo[iMon].workArea.left;
                var wtop = displayDetails.displayInfo[iMon].workArea.top;
                var wright = displayDetails.displayInfo[iMon].workArea.width + wleft;
                var wbottom = displayDetails.displayInfo[iMon].workArea.height + wtop;

                twInfo.caps.monitorInfo.monitors[iMon] = {
                    rect: { 
                        'left': left,
                        'top': top,
                        'right': right,
                        'bottom': bottom
                    },
                    workArea : {
                        'left': wleft,
                        'top': wtop,
                        'right': wright,
                        'bottom': wbottom
                    } 
                }                              
            }
        }
    }

    function initMultimonitor(oldRes) {

        // For now duplicating to initMonitor workaround into two different methods based of tw capabilities,
        // which helps to isolate the problamatic cases and fixes based on VDA/graphics mode.
        // Integrate it later once identified all the cased and fixes in all graphics mode and XD version.
        //
        var displayDetails = UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation, null);
        
        writeHTML5Log(0, LOGGER + "Initial monitor info : count " + twInfo.caps.monitorInfo.numMonitors + ", primary " + twInfo.caps.monitorInfo.primaryMonitor);

        if (capabilities.enhanceMode) {
            initMultimonitorEnhancedMode(oldRes);
        } else if(capabilities.capUpdateSupport) {
            initMultimonitorCapsUpdate(oldRes);
        }

        writeHTML5Log(0, LOGGER + "Final monitor info : count " + twInfo.caps.monitorInfo.numMonitors + ", primary " + twInfo.caps.monitorInfo.primaryMonitor +
        ", isUnifiedMode " + displayDetails.isUnifiedMode);

        Profiler.Ui.update("TwCaps_Monitors", twInfo.caps.monitorInfo.numMonitors);
        Profiler.Ui.update("TwCaps_Primary", twInfo.caps.monitorInfo.primaryMonitor);
        
        for (var iMon = 0; iMon < twInfo.caps.monitorInfo.numMonitors; iMon++) {
            var monitorNameRect = "TwCaps_Monitor_" + iMon + "_Rect";
            var monitorNameWorkArea = "TwCaps_Monitor_" + iMon + "_WorkArea";
            var monitorRect = "{"+ twInfo.caps.monitorInfo.monitors[iMon].rect['left'] + ", " +
                                     twInfo.caps.monitorInfo.monitors[iMon].rect['top'] + ", " +
                                     twInfo.caps.monitorInfo.monitors[iMon].rect['right'] + ", " +
                                     twInfo.caps.monitorInfo.monitors[iMon].rect['bottom'] + "}";
            var monitorWorkArea = "{"+ twInfo.caps.monitorInfo.monitors[iMon].workArea['left'] + ", " +
                                     twInfo.caps.monitorInfo.monitors[iMon].workArea['top'] + ", " +
                                     twInfo.caps.monitorInfo.monitors[iMon].workArea['right'] + ", " +
                                     twInfo.caps.monitorInfo.monitors[iMon].workArea['bottom'] + "}";
            Profiler.Ui.update(monitorNameRect, monitorRect);
            Profiler.Ui.update(monitorNameWorkArea, monitorWorkArea);
            writeHTML5Log(0, LOGGER + "Display " + iMon + ": bounds " + monitorRect); 
            writeHTML5Log(0, LOGGER + "Display " + iMon + ": workArea " + monitorWorkArea);
        }

        displayManager.updateDisplaySurface(twInfo.caps.monitorInfo.numMonitors, 
                                            twInfo.caps.monitorInfo.primaryMonitor, 
                                            twInfo.caps.monitorInfo.monitors,
                                            twInfo.screen.width, 
                                            twInfo.screen.height, displayDetails.isUnifiedMode, onDisplaysUpdated);
                                            
        // refresh the screens if possible.
		callbackWrapper.sendWdRedrawPacket(0,0,twInfo.screen.width,twInfo.screen.height);
    }

    function handleFrameMetrics() {
        var frameMetrics = {
            mask : 0,
            seqId : 0,
            baseTime : 0,
            euemTriggerDelta : 0,
            firstDrawDelta : 0,
            frameCutDelta : 0,
            frameSendDelta : 0,
            wdTriggerDelta : 0
        };
        var byteCount = twStream.ReadUInt8();
		if (byteCount === 0) {
            writeHTML5Log(0, LOGGER + "frame metrics bytecount is 0");
			console.error("frame metrics bytecount is 0");
			return;
		}
		
        frameMetrics.mask = twStream.ReadUInt8();		

		// seqId present only if mas is present
		if(frameMetrics.mask & ThinWireStack.EUEM_TRIGGER_FLAG) {
			frameMetrics.seqId = twStream.ReadUInt8();
		}
		
		frameMetrics.baseTime = twStream.ReadInt32();

		// Check and send metrics to EUEM only if present
        if(frameMetrics.mask !== 0) {
			if(frameMetrics.mask & ThinWireStack.EUEM_TRIGGER_FLAG) {
			   frameMetrics.euemTriggerDelta = twStream.ReadVarUInt();
			}
			if(frameMetrics.mask & ThinWireStack.FIRST_GDI_DRAW_FLAG) {
				frameMetrics.firstDrawDelta = twStream.ReadVarUInt();
			}
			if(frameMetrics.mask & ThinWireStack.FRAME_CUT_FLAG) {
				frameMetrics.frameCutDelta = twStream.ReadVarUInt();
			}
			if(frameMetrics.mask & ThinWireStack.SEND_TO_WD_FLAG) {
				frameMetrics.frameSendDelta = twStream.ReadVarUInt();
			}
			if(frameMetrics.mask & ThinWireStack.WD_TIGGER_FLAG) {
				frameMetrics.wdTriggerDelta = twStream.ReadVarUInt();
			}
			
			callbackWrapper.setEuemRoundTripMetrics(frameMetrics);
		}
    }

    function sendInitAck(session) {
        var buf = new Uint8Array(8);
        buf[0] = PACKET_COMMAND_CACHE;
        buf[1] = 0x05;
        buf[2] = 0x00;
        buf[3] = COMMAND_TW2_C2S_ACK_TW2_INIT;
        buf[4] = session & 0xff;
        buf[5] = (session >> 8) & 0xff;
        buf[6] = (session >> 16) & 0xff;
        buf[7] = (session >>> 24) & 0xff;

        callbackWrapper.writeCachePacket(buf);
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
        this.deleteContext = 0;
    }

    function ImageRegionData() {
        this.rectCount = 0;
        this.dirtyRects = new Array(MAX_DIRTY_RECT);
        this.imageQ = 0;
        for (var i = 0; i < MAX_DIRTY_RECT; i++) {
            this.dirtyRects[i] = new Rectangle(0, 0, 0, 0);
        }
    }
    
    var gRegionData = new ImageRegionData(),      // Stores the Dirty region for the current image data
        gBitmapRect = new Rectangle(0, 0, 0, 0),  // Rectangle to store the dimension and top-left corner of the received bitmap, in order to identify the screen
        gCurrentUncachedBmp = new UncachedBitmap(),
        gDestPoint = new Point(0, 0);
    var encodeBuffer;

    function tw2ReceiveUncachedBitmap(twStream, bDirtyRegionCmd, bNewBitmap, bClrFormat) {
        if (bNewBitmap) {
             twStream.WaitForSpace(13);
                       gCurrentUncachedBmp.uiEncodedDataSize = twStream.ReadInt32();
            var controlByte = twStream.ReadByte();
            gDestPoint.X = twStream.ReadUInt16();
            gDestPoint.Y = twStream.ReadUInt16();
            gCurrentUncachedBmp.bmi.width = twStream.ReadUInt16();
            gCurrentUncachedBmp.bmi.height = twStream.ReadUInt16();

            /*
              Bits 4-5: codec id
              Bits 0-3: bitmap format
              All other bits are reserved and must be 0
            */
            gCurrentUncachedBmp.controlByte = controlByte;
            gCurrentUncachedBmp.codecId = controlByte >> 4;
            gCurrentUncachedBmp.bmi.colorFormat = DecoderConstants.TW2_YUV420; // default to YUV420
            if (bClrFormat) {
                var codecFlags = twStream.ReadInt32();
				// TODO: set constants for mask and move to tw constants
                var deleteContext = (codecFlags & 0x00000010) >> 4;
                gCurrentUncachedBmp.deleteContext = deleteContext;
                gCurrentUncachedBmp.bmi.colorFormat = (codecFlags & H264_COLOR_FORMAT_MASK);
            }
            
            if (bDirtyRegionCmd) {
                var i = 0;
                var controlFlag = twStream.ReadUInt16();
                var top = 0, left = 0, right = 0, bottom = 0;
                gRegionData.rectCount = controlFlag & DIRTY_RECT_COUNT_MASK; //Bits 0-4 for Length
                gRegionData.imageQ = (controlFlag & REGION_CONTROL_FLAG) ? true : false;  //Bit 15 for Control flag
                twStream.WaitForSpace(gRegionData.rectCount * 8);
                for (i = 0; i < gRegionData.rectCount; i++) {
                    left = twStream.ReadUInt16();
                    top = twStream.ReadUInt16();
                    right = twStream.ReadUInt16();
                    bottom = twStream.ReadUInt16();
                    gRegionData.dirtyRects[i].SetBounds(left, top, right - left, bottom - top);
                }
					
            }
            else {
                gRegionData.rectCount = 1;
                gRegionData.dirtyRects[0].SetBounds(0, 0, gCurrentUncachedBmp.bmi.width, gCurrentUncachedBmp.bmi.height);
                gRegionData.imageQ = true;
            }

            gBitmapRect.X = gDestPoint.X;
            gBitmapRect.Y = gDestPoint.Y;

            /*
             * get here offset and pointer to player and indicate that new frame is
             * coming for now 0
             */
            gCurrentUncachedBmp.uiTotalDataReceived = 0;
        }

        gDestPoint.X = gBitmapRect.X;
        gDestPoint.Y = gBitmapRect.Y;
        gBitmapRect.Height = gCurrentUncachedBmp.bmi.height;
        gBitmapRect.Width = gCurrentUncachedBmp.bmi.width;
        var uiCurrentChunkSize = twStream.ReadVarUInt();

        twStream.WaitForSpace(uiCurrentChunkSize);
        if (gCurrentUncachedBmp.uiTotalDataReceived === 0) {
            encodeBuffer = new Uint8Array(gCurrentUncachedBmp.uiEncodedDataSize);
        }
        twStream.ReadBytes(encodeBuffer, gCurrentUncachedBmp.uiTotalDataReceived, uiCurrentChunkSize);

        gCurrentUncachedBmp.uiTotalDataReceived += uiCurrentChunkSize;
        if (gCurrentUncachedBmp.uiTotalDataReceived >= gCurrentUncachedBmp.uiEncodedDataSize) {  
                        
            renderer.frameComplete(encodeBuffer, gCurrentUncachedBmp, gRegionData, gDestPoint);
                
            gCurrentUncachedBmp.uiTotalDataReceived = 0;
            // use new image region data else dirty rects data will be overided by new frames
            // in the queued data.
            gRegionData = new ImageRegionData();
        }
    }

    this._Run1 = function _run() {
        nRemainingInStream = vStream.Available();
        if (reqiredByteData > nRemainingInStream) {
            return;
        }
        availByteInStream = nRemainingInStream;
        var startIndex;
        var cmd = 0;
        var status = true;
        //at least for data for command read should be there
        while (nRemainingInStream >= 1) {
            startIndex = vStream.GetReadIndex();
            try {
                cmd = twStream.ReadByte();
                switch (cmd) {
                    // Handle common commands
                    case CMD_TW2_INIT:
                        CmdInit();
                        break;
                    case CMD_TW2_CACHE_NEW_OBJECT:                        
                        status = memoryCache.NewObject(twStream, true);
                        break;
                    case CMD_TW2_CACHE_NEW_OBJECT_INCOMPLETE:
                        status = memoryCache.NewObject(twStream, false);
                        break;
                    case CMD_TW2_CACHE_EXTEND_OBJECT:
                        status = memoryCache.ExtendObject(twStream, true);
                        break;
                    case CMD_TW2_CACHE_EXTEND_OBJECT_INCOMPLETE:
                        status = memoryCache.ExtendObject(twStream, false);
                        break;
                    case CMD_TW2_CACHE_PURGE_MEMORY_CACHE:
                        memoryCache.Purge(twStream);
                        break;
                    case CMD_TW2_SET_MOUSE_POINTER:
                        // TODO: get default palette for h.264 mode
                        var colorModel = gc ? gc.getCurrentColorModel() : null;
                        pointer.CmdSetMousePointer(twStream, memoryCache, colorModel);
                        break;
                    case CMD_TW2_HIDE_MOUSE_POINTER:
                        pointer.CmdHideMousePointer();
                        break;
                    case CMD_TW2_RESTORE_MOUSE_POINTER:
                        pointer.CmdRestoreMousePointer();
                        break;
                    case CMD_TW2_END_OF_FRAME:
                        twStream.ReadByte();
                        renderer.endOfFrame();
                        break;
                    case CMD_TW2_FRAME_METRICS:
                        handleFrameMetrics();
                        break;
                        	
                    case CMD_TW2_BITBLT_IMAGE_AVOIDCACHE:
                        tw2ReceiveUncachedBitmap(twStream, false, true);
                        break;
                    
                    case CMD_TW2_BITBLT_IMAGE_REGION_AVOIDCACHE:
                        tw2ReceiveUncachedBitmap(twStream, true, true);
                        break;
                    
                    case CMD_TW2_BITBLT_IMAGE_AVOIDCACHE_EX:
                        tw2ReceiveUncachedBitmap(twStream, true, true, true);
                        break;
                    
                    case CMD_TW2_EXTEND_BITBLT_IMAGE_AVOIDCACHE:
                        tw2ReceiveUncachedBitmap(twStream, false, false);
                        break;
                        
                    default:
                        renderer.render(cmd, twStream, memoryCache);
                        break;
                }
                if (HTML5_CONFIG && HTML5_CONFIG['features'] && HTML5_CONFIG['features']['graphics'] && HTML5_CONFIG['features']['graphics']['noWaitForSpaceEx']) {
                    if (!status) {
                        vStream.setReadIndex(startIndex);
                        vStream.compact();
                        return; 
                    }
                }
            }
            catch (error) {
                if (error == VirtualStreamError.NO_SPACE_ERROR) {
                   
                    // OPT_JPEG start
                    if (JpegProfiler.cmd == CMD_TW2_CACHE_NEW_OBJECT || JpegProfiler.cmd == CMD_TW2_CACHE_NEW_OBJECT_INCOMPLETE) {
                        JpegProfiler.newObjectExceptionCount++;
                        Profiler.Ui.update("NewCacheExp", JpegProfiler.newObjectExceptionCount);
                    } else if (JpegProfiler.cmd == CMD_TW2_CACHE_EXTEND_OBJECT || JpegProfiler.cmd == CMD_TW2_CACHE_EXTEND_OBJECT) {
                        JpegProfiler.extendObjectExceptionCount++;
                        Profiler.Ui.update("ExtendObjectExp", JpegProfiler.extendObjectExceptionCount);
                    }
                   
                    // OPT_JPEG end
                    vStream.setReadIndex(startIndex);
                    vStream.compact();
                    return;
                }
                else {
					if (error instanceof Error) {
                      console.error(error.message);
                      console.log(error.stack);
					} else {
						console.error("error during processing thinwire command: " + error);
					}
                    writeHTML5Log(0, LOGGER + "Cmd " + cmd + " Error " + error);
                    throw error;
                }
            }
            prevReadIndex = vStream.GetReadIndex();
            nRemainingInStream -= (prevReadIndex - startIndex);
        }
        vStream.compact();
  };
}

// TODO : Move it to appropriate profiler object
var JpegProfiler = {
    cmd : 0,
    newObjectExceptionCount : 0,
    extendObjectExceptionCount : 0,
    
    jpegCount: 0,
    totalJpegDecodeTime: 0
};