// Actual render done by native ctx module
function NaclRenderer(surfaceRenderer) {
    // var mode = RENDERMODE.H264NATIVE
    var canvasRemoved = false,
        frameData = [],
        cmdChannel = CTX_MODULE_CMD_CHANNEL.GRAPHICS,
        GFX_CMD_FRAME_DATA = 9,
        ctxWrapper = Utility.getCtxWrapper();
    
    var LOGGER = "TW" + "_" + "RNT" + ": "; 
    
    function postGfxCommand(msg) {
        ctxWrapper.postMessage(msg);
    };
    
    this.setRenderMode = function (newMode, newWidth, newHeight, textureWidth1, textureHeight1) {
        CEIP.add('graphics:renderer:type','Embed');
		frameData = [];
        Profiler.Ui.update("Renderer", "Embed");
        writeHTML5Log(0, LOGGER + "Set Mode");
        surfaceRenderer.setNaclSurfaceSize(newWidth, newHeight);    
        if (canvasRemoved === false) {
            canvasRemoved = true;
            surfaceRenderer.removeCanvas();
        }
    };     
    
    this.renderYuvSurface = function() {
 
    };
    
    this.renderOverlaySolidRect = function(data) {
        frameData.push(data);
    };
    
    this.renderOverlayBitmap = function(data) {
        frameData.push(data);
    };
    
    this.renderTextBitmap = function(data) {
        frameData.push(data);
    };
    
    this.deleteText = function(data) {
        frameData.push(data);
    };
    
    this.clearOverlays = function(data) {
        for (var i = 0; i < data.rectCount; i++) {

            // Fix for BUG0540226: Increase dirty region rectangle to avoid distorted borders 
            // when dragging a window. 
            // (Usually enlarge by 1 is sufficient but NACL requires enlarge of bounding rectangle
            //  by +3).
            //
            data.dirtyRects[i].X-=3;           
            data.dirtyRects[i].Width+=5;

            data.dirtyRects[i].Y-=3;           
            data.dirtyRects[i].Height+=5;

            // Check for boundary
            if (data.dirtyRects[i].X < 0) {
                data.dirtyRects[i].Width += data.dirtyRects[i].X; data.dirtyRects[i].X = 0;
            }
            if (data.dirtyRects[i].Y < 0) {
                data.dirtyRects[i].Height += data.dirtyRects[i].Y; data.dirtyRects[i].Y = 0;
            }
            if ((data.dirtyRects[i].X + data.dirtyRects[i].Width)  > data.frameWidth) {
                data.dirtyRects[i].Width = data.frameWidth - data.dirtyRects[i].X;
            }

            if ((data.dirtyRects[i].Y + data.dirtyRects[i].Height) > data.frameHeight) {
                data.dirtyRects[i].Height = data.frameHeight - data.dirtyRects[i].Y;
            }
        }
        frameData.push(data);
    };
    
    this.presentFrame = function(data) {
        data.channel = cmdChannel;
        data.data = frameData;
        data.cmd = GFX_CMD_FRAME_DATA;
        postGfxCommand(data);
        frameData = [];
    };
    
     // TODO: set common gfx config data for all tw modules
    if (g && g.environment) {
        g.environment["gfxCtx"] = RENDER_SURFACE_EMBGL;
    }
}


