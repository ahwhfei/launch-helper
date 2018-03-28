 function GFX_SURFACE_MODE() {};
    GFX_SURFACE_MODE.NATIVE = 0;
    GFX_SURFACE_MODE.CANVAS = 1;
        
 var RenderSurfInterface = (function() {
        
	var LOGGER = "TW" + "_" + "RSF" + ": ";
	function RenderSurfInterface(callback) {
		var myself = this;
		var canvas = null;
        
        // TODO: remove accessing of super render canvas, it is only used to conceal the child div elements
        // and surface
		var superRenderCanvas = displayManager.getSuperSurface();             
		canvas = displayManager.getSurface();                           
        
		var surfaceRenderer;
		var mode, frameWidth, frameHeight;
		var errorinRender = false;
		var first_render= true;
        
		var fpsupdateFrequency = (Profiler.Ui.isEnabled() ? HTML5_CONFIG['fpsMeter']['updateFrequency'] : 0) * 1000;
        
		var timeRef = HTML5Interface.getTimeTicks();
		var prevTime = timeRef();
		var curTime = 0,
            sumFrameTime = 0,
            frameCounter = 0;
    
     	var averageFps = 0;

        var gfx_surface =  HTML5Interface.ChromeNacl.isFeatureEnabled('graphics')? GFX_SURFACE_MODE.NATIVE : GFX_SURFACE_MODE.CANVAS;
                
		MediaEncoder.canvas = superRenderCanvas;

        this.initSurface = function() {
	        try {
				if (HTML5_CONFIG['hardware']['webgl'] === true) {
	                canvas = displayManager.getSurface();                     // tMM
					surfaceRenderer = new WebGLRenderer(canvas, myself);
				} else {
					throw "error";
				}
	        } catch (error) {
	                myself.reInitializeContext();
	                surfaceRenderer = new CanvasRenderer(canvas,myself);
	        }
	    };
                
		this.reInitializeContext = function() {
			var createCanvas = false;
			try {/*
				 * 	try to get context of older canvas if it fail remove old canvas and create new one
				 */
				var canContext = canvas.getContext('2d');
				if (!canContext) {
					createCanvas = true;
				}
			} catch(error) {
				createCanvas = true;
			}
			if (createCanvas == true) {
				displayManager.createUiElement(superRenderCanvas, frameWidth, frameHeight);
				displayManager.removeSurface(canvas);
				canvas = displayManager.getSurface();
			}

		};

        // If using native graphics then only need native surface
        //
        if (gfx_surface === GFX_SURFACE_MODE.NATIVE) {
            writeHTML5Log(0, LOGGER + "Init renderer");  
            surfaceRenderer = new NaclRenderer(myself);
        } else {
            myself.initSurface();
        };
                                
		function changeToTextureDimension(length) {
//			if ((length % 16) !== 0) {
//				length = length + (16 - (length % 16));
//			}
			return length;
		}

        /*
         * This function gets called only to switch from embed surface to canvas surface
         */
        this.switchToCanvas = function() {
            // SET_SPINNER
            writeHTML5Log(0, LOGGER + "Switch to webgl render"); 
            gfx_surface = GFX_SURFACE_MODE.CANVAS;
            errorinRender = true;
            
            displayManager.createSurface(frameWidth, frameHeight);
            canvas = displayManager.getSurface();
            
            myself.initSurface();
        };
		
		/*
         * This function gets called only to switch from canvas surface to embed surface
         */
        this.switchToNative = function() {
            writeHTML5Log(0, LOGGER + "Switch to native render");
            gfx_surface = GFX_SURFACE_MODE.NATIVE;
			errorinRender = true;
			
            surfaceRenderer = new NaclRenderer(myself);
			displayManager.createSurface(frameWidth, frameHeight, gfx_surface);
        };
        		
		/*
		 * This function get called only from webgl mode to nonwebgl mode
		 */
		this.switchToCanvasRender = function() {
			averageFps = 0;
			writeHTML5Log(0, LOGGER + "Switch to canvas renderer");
			errorinRender = true;
			var width = canvas.width;
			var height = canvas.height;
			callback.changeSessionSize(width, height);
			myself.reInitializeContext();
			surfaceRenderer = new CanvasRenderer(canvas,myself);
			surfaceRenderer.setRenderMode(mode, frameWidth, frameHeight, changeToTextureDimension(frameWidth), changeToTextureDimension(frameHeight));
		};
		this.requestforReset = function( ){
			averageFps = 0;
			errorinRender = true;
			var width = canvas.width;
			var height = canvas.height;
			callback.changeSessionSize(width, height);
		};
        
        // called only from NaclRenderer to remove the canvas element
        this.removeCanvas = function() {
            displayManager.removeSurface(canvas);
            canvas = null;
        };
        
        this.setNaclSurfaceSize = function(width, height) {
            callback.setNativeGfxSurfaceSize(width, height);                    
        };

        this.processNextCmd = function(dataObj) {
			var cmd = dataObj.cmd;
			if(errorinRender == true && cmd != WorkerCommand.SET_RENDER_MODE){
				return;

			}
			try {
				switch (cmd) {
					case WorkerCommand.SET_RENDER_MODE:
					    //window.setTimeout(callback.mainEngine.uiEngine.hideOverlay,3500);
						errorinRender = false;
						if (!dataObj.texturewidth) {
							dataObj.texturewidth = changeToTextureDimension(dataObj.width);
							dataObj.textureheight = changeToTextureDimension(dataObj.height);
						}
						mode = dataObj.mode;
						frameWidth = dataObj.width;
						frameHeight = dataObj.height;
			            if (displayManager) {
							displayManager.setSize(frameWidth, frameHeight);
						}
                        
                        writeHTML5Log(0, LOGGER + "Mode " +dataObj.mode + ", W " + dataObj.width + ", H " + dataObj.height
                                + ", TW " + dataObj.texturewidth + ", TH " + dataObj.textureheight);
						surfaceRenderer.setRenderMode(dataObj.mode, dataObj.width, dataObj.height, dataObj.texturewidth, dataObj.textureheight);
						break;
					case WorkerCommand.RENDER_YUV:
						surfaceRenderer.renderYuvSurface(dataObj.yBuf, dataObj.uBuf, dataObj.vBuf, dataObj.rectCount, dataObj.dirtyRects, dataObj.colorFormat);
						break;
					case WorkerCommand.RENDER_SOLID_RECT:
						surfaceRenderer.renderOverlaySolidRect(dataObj["data"]);
						break;
					case WorkerCommand.RENDER_BITMAP:
						surfaceRenderer.renderOverlayBitmap(dataObj["data"]);
						break;
					case WorkerCommand.PRESENT_FRAME:
						if(fpsupdateFrequency){
							var curTime = timeRef();	
                            sumFrameTime = sumFrameTime + (curTime - prevTime);
                            frameCounter++;
                            if (sumFrameTime >= fpsupdateFrequency) {
								averageFps = frameCounter * 1000 / sumFrameTime;
								averageFps = averageFps.toFixed(2);
                                
                                //writeHTML5Log(0,"UI:|:RENDER:|:RENDERER:|:FPS=" + averageFps + "    timestamp: " + curTime + "   frames: " + frameCounter + "   time elapsed: " + sumFrameTime);
                                
                                Profiler.Ui.update("AvgFps", averageFps);
                                frameCounter = 0;
                                averageFps = 0;
                                sumFrameTime = 0;
							}
							prevTime = curTime;
						}
						surfaceRenderer.presentFrame(dataObj["data"]);
                        if(first_render== true && canvas)
						{	canvas.style.backgroundColor = '';
							first_render= false;
						}
                        
                        if (displayManager) {
                            displayManager.drawScene(canvas);
                        }
                        
						break;
					case WorkerCommand.CLEAR_OVERLAYS:
						surfaceRenderer.clearOverlays(dataObj["data"]);
						break;
					case WorkerCommand.RENDER_TEXT:
						surfaceRenderer.renderTextBitmap(dataObj["data"]);
						break;
					case WorkerCommand.DELETE_TEXT:
						surfaceRenderer.deleteText(dataObj["data"]);
						break;
					case WorkerCommand.RENDER_RGB:
						surfaceRenderer.renderRgbSurface(dataObj.rgbBuf, dataObj.rectInfo);
						break;
					default:
						writeHTML5Log(0, LOGGER + "Unknown command" + cmd);
						break;
				}
			} catch(error) {
				errorinRender = true;
				console.log(error.stack);
				writeHTML5Log(0, LOGGER + "Fallback to normal " + error.message);
				this.switchToCanvasRender();
			}
		};
	}

	return RenderSurfInterface;
})();
