function ThinwireWrapper(uiWrapper1, icaWrapper1, wrappers) {
    var myself = this;
    var selfSender;
    var uiWrapper = uiWrapper1;
    var icaWrapper = icaWrapper1;
    var euemWrapper = null;
    var ctxWrapper = null;
    var twiWrapper = null;
    this.WrapperId = DRIVERID.ID_THINWIRE;
    var thinwireEngine = null;
    var stream = null;
    this.streamName = 'CTXTW  ';
    var channel = ChannalMap.virtualChannalMap[myself.streamName];
	this.errorCode = ERRORCODE.NONE;
    var resizeInConnecting = false;
    var firstFrame = true;
    var resizeTimer = null;
    if (wrappers) {
        wrappers[this.WrapperId] = this;
    }
        
    /*
    * This is only function that can call from otherWrappers
    */
    this.processOtherWrapperCmd = function (dataObj) {
        selfSender.postMessage(dataObj);
    };
    this.processSelfWrapperCmd = function (dataObj) {
        processThreadCommand(dataObj);
    };
    this.processConsumeCmd = function (dataObj) {
        selfSender.postMessage(dataObj);
    };

    this.postMessage = function (dataObj) {
        processThreadCommand(dataObj);
    };

    var dataSendObj = {};
    dataSendObj.channel = channel;
    dataSendObj.source = DRIVERID.ID_GENERICWRITE;
    dataSendObj.destination = icaWrapper.WrapperId;
    dataSendObj.cmd = WorkerCommand.QUEUEWRITEBYTE;
    this.queueVirtualWrite = function (channel, byteData, offset, length) {
        dataSendObj.buff = byteData;
        dataSendObj.offset = offset;
        dataSendObj.toCopy = length;
        icaWrapper.processOtherWrapperCmd(dataSendObj);
    };

    function processThreadCommand(dataObj) {
        var sourceChannel = dataObj.source;
        switch (sourceChannel) {
            case DRIVERID.ID_THINWIRE:
                HandleThinWireCmd(dataObj);
                break;
            case DRIVERID.ID_WINSTATION:
            case DRIVERID.ID_TRANSPORT:
            case DRIVERID.ID_PROTOCOL:
                handleIcaWrapperCmd(dataObj);
                break;
        }
    }
	
    function handleIcaWrapperCmd(dataObj) {
        var cmd = dataObj.cmd;
        if (cmd === WorkerCommand.CONSUME) {
            stream.consumeData(dataObj.buff, dataObj.offset, dataObj.toCopy);
        }
    }

    this.setDisplayCursor = function (cursor, hotspot) {
        uiWrapper.setDisplayCursor(cursor, hotspot);
    };

    this.setRenderMode = function (mode, data) {
        uiWrapper.processOtherWrapperCmd({
            cmd: WorkerCommand.SET_RENDER_MODE,
            mode: mode,
            width: data["width"],
            height: data["height"],
            texturewidth: data["texturewidth"],
            textureheight: data["textureheight"],
            source: this.WrapperId,
            destination: uiWrapper.WrapperId
        });
    };

    this.renderYuvSurface = function (yBuf, uBuf, vBuf, rectCount, dirtyRects, colorFormat) {
        uiWrapper.processOtherWrapperCmd({
            cmd: WorkerCommand.RENDER_YUV,
            yBuf: yBuf,
            uBuf: uBuf,
            vBuf: vBuf,
            rectCount: rectCount,
            dirtyRects: dirtyRects,
            colorFormat: colorFormat,
            source: this.WrapperId,
            destination: uiWrapper.WrapperId
        });
    };

    this.renderRGBSurface = function (buf, coordinateArray) {
        uiWrapper.processOtherWrapperCmd({
            cmd: WorkerCommand.RENDER_RGB,
            rgbBuf: buf,
            rectInfo: coordinateArray,
            source: this.WrapperId,
            destination: uiWrapper.WrapperId
        });
    };

    this.addOverlaySolidRect = function (data) {
        uiWrapper.processOtherWrapperCmd({
            cmd: WorkerCommand.RENDER_SOLID_RECT,
            data: data,
            source: this.WrapperId,
            destination: uiWrapper.WrapperId
        });
    };

    this.addOverlayBitmap = function (data) {
        uiWrapper.processOtherWrapperCmd({
            cmd: WorkerCommand.RENDER_BITMAP,
            data: data,
            source: this.WrapperId,
            destination: uiWrapper.WrapperId
        });
    };

    this.addTextBitmap = function (data) {
        uiWrapper.processOtherWrapperCmd({
            cmd: WorkerCommand.RENDER_TEXT,
            data: data,
            source: this.WrapperId,
            destination: uiWrapper.WrapperId
        });
    };

    this.deleteText = function (data) {
        uiWrapper.processOtherWrapperCmd({
            cmd: WorkerCommand.DELETE_TEXT,
            data: data,
            source: this.WrapperId,
            destination: uiWrapper.WrapperId
        });
    };

    this.presentFrame = function (data) {
        uiWrapper.processOtherWrapperCmd({
            cmd: WorkerCommand.PRESENT_FRAME,
            data: data,
            source: this.WrapperId,
            destination: uiWrapper.WrapperId
        });
    };

	this.showResizeDialog = function (){
		uiWrapper.processOtherWrapperCmd({
            cmd: WorkerCommand.SHOW_RESIZE_DIALOG,
            source: this.WrapperId,
            destination: uiWrapper.WrapperId
        });
	};
	this.onInit = function(width ,height){
		/*
		 * //RES  resolution check if sessionsize changed and change session size
		 */
		if(firstFrame == true && resizeInConnecting == true){
			 firstFrame = false;
			 console.log(firstFrame + " " +resizeInConnecting );
				 resizeTimer = setTimeout(function(){
						UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.sessionResize ,function(res){
			               onSessionResize(res);
			          });
				 },3000);    
	     }
        firstFrame = false;
		uiWrapper.processOtherWrapperCmd({
            cmd: WorkerCommand.THINWIRE_INITCOMMAND,
            source: this.WrapperId,
            destination: uiWrapper.WrapperId,
            sessionSize : {
            	width : width,
            	height : height
            }
        });
	};
    this.clearOverlays = function (data) {
        uiWrapper.processOtherWrapperCmd({
            cmd: WorkerCommand.CLEAR_OVERLAYS,
            data: data,
            source: this.WrapperId,
            destination: uiWrapper.WrapperId
        });
    };

    this.setEuemWrapper = function(euemWrapperObj) {
         euemWrapper = euemWrapperObj;
    };

    this.setTwiWrapper = function(twiWrapperObj) {
         twiWrapper = twiWrapperObj;
    };

    this.setCtxWrapper = function(ctxWrapperObj) {
        ctxWrapper = ctxWrapperObj;
    };
    
    this.setEuemRoundTripMetrics = function (roundTripMetrics) {
        if(euemWrapper != null) {
            euemWrapper.processOtherWrapperCmd({
                'cmd': WorkerCommand.ROUNDTRIP_INFO,
                'roundTripMetrics': roundTripMetrics,
                'source': this.WrapperId,
                'destination': euemWrapper.WrapperId
            });
        }
    };

    this.sendSeamlessPauseCmd = function(){
      if(twiWrapper != null){
        twiWrapper.processOtherWrapperCmd({
                'cmd': WorkerCommand.Pause,
                'source': this.WrapperId,
                'destination': twiWrapper.WrapperId
            });
      }
    };
    
    this.sendSeamlessResumeCmd = function(){
      if(twiWrapper != null){
        twiWrapper.processOtherWrapperCmd({
                'cmd': WorkerCommand.Resume,
                'source': this.WrapperId,
                'destination': twiWrapper.WrapperId
            });
      }
    };

    this.sendWdRedrawPacket = function(left,top,width,height){
      if(icaWrapper != null){
        icaWrapper.processOtherWrapperCmd({
                'cmd': WorkerCommand.PACKET_REDRAW,
                'source': this.WrapperId,
                'destination': icaWrapper.WrapperId,
                'left':left,
                'top' : top,
                'width' : width,
                'height' : height
            });
      }
    };

	this.setSessionResolutionInfo = function(width,height)
	{
		if(icaWrapper != null) {
            icaWrapper.processOtherWrapperCmd({
                'cmd': WorkerCommand.SESSION_RESOLUTION_INFO,
                'width': width,
				'height': height,
                'source': this.WrapperId,
                'destination': icaWrapper.WrapperId
            });
        }
	};

    this.writeCachePacket = function (buffer) {
        icaWrapper.processOtherWrapperCmd({ 'cmd': WorkerCommand.CMD_WRITECACHEPACKET, 'source': DRIVERID.ID_GENERICWRITE, 'buffer': buffer, 'destination': icaWrapper.WrapperId });
    };

    this.initRenderSurface = function() {
        uiWrapper.processOtherWrapperCmd({
                'cmd': WorkerCommand.SET_RENDER_CANVAS,   
                'source': this.WrapperId,
                'destination': uiWrapper.WrapperId
            });        
    };
	this.reInitNativeGfx = function() {
		uiWrapper.processOtherWrapperCmd({
                'cmd': WorkerCommand.SET_RENDER_NATIVE,   
                'source': this.WrapperId,
                'destination': uiWrapper.WrapperId
            });   
	};

   function onSessionResize(res){
   	  clearTimeout(resizeTimer);
   	  if(firstFrame == false){
   	  	if(ctxWrapper) {
	     	ctxWrapper.onSessionResize(res.width, res.height);
		  }
	      thinwireEngine.setResolution(res);
   	  }else{
   	  		resizeInConnecting = true;
   	  }
   }
   
   	function onDisplayInfoChange(displayDetails){
		 thinwireEngine.setMonitorInfo(true, displayDetails.monitorCountToVDA);
   	}
   	
    this.initialize = function (cmd, engineThread) {        
        if (cmd === THREADCOMMAND.INIT_ENGINE) {
            if (engineThread) {
                selfSender = engineThread;
            }
            else {
                thinwireEngine = new ThinwireEngine(myself);
                stream = thinwireEngine.SetStack();
                thinwireEngine.Run();
                /*
                * optimized wrapper function call
                *
                */
                selfSender = myself;
                myself.processOtherWrapperCmd = processThreadCommand;
                myself.processSelfWrapperCmd = processThreadCommand;
                myself.processConsumeCmd = processThreadCommand;
                myself.postMessage = processThreadCommand;
                UiControls.ResolutionUtility.registerCallback(UiControls.ResolutionUtility.constants.sessionResize ,onSessionResize);
                UiControls.ResolutionUtility.registerCallback(UiControls.ResolutionUtility.constants.displayInformation,onDisplayInfoChange);
            }
        }
    };
}
