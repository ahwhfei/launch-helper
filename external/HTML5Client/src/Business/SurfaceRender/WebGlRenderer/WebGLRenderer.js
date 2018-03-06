function WebGLRenderer(canvas, surfaceRender) {
    var currentGlCanvas = null;
    var width = 0;
    var height = 0;
    var currentMode = RENDERMODE.TWFULL;
    var glContext = WebGLCanvas.getContext(canvas);
    var completeCleanup = false;
	var MAXFRAME_FORERROR = 50;
	var nrGlErrorCheck = 0;
	var nrResetCallback = 0;
	var maxContextLostCallback = 1;
	var isContextLost = false;
    var LOGGER = "TW" + "_" + "RGL" + ": "; 
	function onlostContext(event){
		writeHTML5Log(0, LOGGER + "webgl context is lost start");
		console.log(0,"UI:|:RENDER:|:WEBGL:|:webgl context is lost start");
		try{
			currentGlCanvas.reInitMemory(true);
		}catch(error){

		}
		currentGlCanvas = null;
		isContextLost = true;
		requestForInit( );
		event.preventDefault();
		writeHTML5Log(0, LOGGER + "webgl context is lost end");
		console.log(0,"UI:|:RENDER:|:WEBGL:|:webgl context is lost end");
	}

	function onRestoreContext( ){
		writeHTML5Log(0, LOGGER + "webgl context is resumed");
		isContextLost = false;
		nrResetCallback = 0;
	}

	canvas.addEventListener("webglcontextlost", onlostContext, false);
	canvas.addEventListener("webglcontextrestored", onRestoreContext, false);
	function requestForInit( ){
		writeHTML5Log(0, LOGGER + "request for initsession");
		if(isContextLost == true){
			nrResetCallback++;
		}
		if(nrResetCallback > maxContextLostCallback){
			writeHTML5Log(0, LOGGER + "Fallback to normal");
			surfaceRender.switchToCanvasRender( );
		}else{
			surfaceRender.requestforReset();
		}
	}
    this.setRenderMode = function (mode, newWidth, newHeight, textureWidth, textureHeight) {
        Profiler.Ui.update("Renderer", "WebGL");
		CEIP.add('graphics:renderer:type','WEBGL');
		writeHTML5Log(0, LOGGER + "Set Mode");
    	if(isContextLost == true){
    		requestForInit( );
    		return;
    	}
    	nrResetCallback = 0;
        completeCleanup = false;
        nrGlErrorCheck = 0;
        oldGlCanvas = currentGlCanvas;
        var tempGLFunc;
        if (currentGlCanvas === null || mode !== currentMode) {
            currentGlCanvas = null;
            completeCleanup = true;
            if (mode === RENDERMODE.TWFULL) {
                tempGLFunc = RGBWebGLCanvas;
            }
            else if (mode === RENDERMODE.H264) {
                tempGLFunc = YUVWebGLCanvasWithOverlays;
            }
        }
        if (oldGlCanvas != null) {
            // Free pre allocated memory because sometimes webgl is not able to
            // deallocate memory.
            oldGlCanvas.reInitMemory(completeCleanup);
        }
        if(completeCleanup == true)
        {
        	 currentGlCanvas = new tempGLFunc(canvas, glContext);
        }
		width = newWidth;
        height = newHeight;
		currentGlCanvas.setDimension(width, height, textureWidth, textureHeight);
        currentMode = mode;
    };

    this.renderYuvSurface = function (ybuffer, ubuffer, vbuffer, rectCount, dirtyRects, colorFormat) {
    	if (currentGlCanvas) {
    		currentGlCanvas.fillYUVTextures(ybuffer, ubuffer, vbuffer, rectCount, dirtyRects, colorFormat);
    	}
    };

    this.renderRgbSurface = function (rgbbuffer, rectInfo) {
    	 if (currentGlCanvas) {
    	 	rgbbuffer = new Uint8Array(rgbbuffer.buffer);
        	currentGlCanvas.fillRGBTexture(rgbbuffer, width, height);
    	 }

    };

    this.renderOverlayBitmap = function (dataObj) {
        if (currentGlCanvas) {
            currentGlCanvas.addOverlayBitmap(dataObj["rect"], new Uint8Array(dataObj["bmp"]));
        }
    };

    this.renderTextBitmap = function (dataObj) {
        if (currentGlCanvas) {
            currentGlCanvas.addTextBitmap(dataObj["rect"], new Uint8Array(dataObj["bmp"]));
        }
    };

    this.deleteText = function (dataObj) {
        if (currentGlCanvas) {
            currentGlCanvas.deleteText(dataObj["rect"]);
        }
    };

    this.renderOverlaySolidRect = function (dataObj) {
        if (currentGlCanvas) {
            currentGlCanvas.addOverlaySolidRect(dataObj["rect"], dataObj["color"]);
        }
    };

    this.clearOverlays = function () {
        if (currentGlCanvas) {
            currentGlCanvas.clearOverlays();
        }
    };

    this.presentFrame = function () {
        if (currentGlCanvas) {
            currentGlCanvas.drawScene();
            if (currentGlCanvas.glError != 0) {
                try {
                    currentGlCanvas.reInitMemory();
                    currentGlCanvas = null;
                }
                catch (error) {
					console.log(error);
				}
                surfaceRender.switchToCanvasRender();
            }

            if (WebGLCanvas.checkerror == true) {
                WebGLCanvas.checkerror = false;
                nrGlErrorCheck = 0;
            }

            nrGlErrorCheck++;
            if (nrGlErrorCheck == MAXFRAME_FORERROR) {
                WebGLCanvas.checkerror = true;
            }
        }
    };
    
    // TODO: set common gfx config data for all tw modules
    if (g && g.environment) {
        g.environment["gfxCtx"] = RENDER_SURFACE_WEBGL;
    }
}
