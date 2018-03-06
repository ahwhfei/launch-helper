// Your code goes here.// Your code goes here.
function CanvasRenderer(canvas, surfaceRender) {
  "use strict";
    var LOGGER = "TW" + "_" + "RCN" + ": "; 
    var mode = RENDERMODE.TWFULL;
    var canContext = null;
    var canvasWidth = 0;
    var canvasHeight = 0;
    var textureWidth = 0;
    var textureHeight = 0;
    var canvasData = null;
    var canData = null;
    /*
    * This canvas is used for h264 frame and loseless text
    */

    var offCanvasData = null;
    var offCanData = null;
	var offscreenCanvas_width = 0;
	var offscreenCanvas_height = 0;
    var textTrackingData = [];

    var yuvWidth = 0;
    var yuvHeight = 0;

    var fullFrame = false;
		/*
	 * YUV TO RGB preProcess Table data
	 */
	var yTable = new Float32Array(256);
	var  uOfUVTable = new Float32Array(256);
	var vOfUVTable = new Float32Array(256);
	var uTable = new Float32Array(256);
	var vTable = new Float32Array(256);
	var yuvTorgbtable = false;
	function makeTable(){
		var j;
		for(var i = 0 ; i < 256 ; i++){
			yTable[i] = (i-16) * 1.164;
			j = i-128;
			uOfUVTable[i] = j*.392;
			vOfUVTable[i] = j*.813;
			uTable[i] = 2.017*j;
			vTable[i] = 1.596*j;
		}
	}
    this.setRenderMode = function (newMode, newWidth, newHeight, textureWidth1, textureHeight1) {
        CEIP.add('graphics:renderer:type','canvas');
		Profiler.Ui.update("Renderer", "Canvas");
        writeHTML5Log(0, LOGGER + " Set Mode");
		mode = newMode;
        textTrackingData = [];
        if (mode === RENDERMODE.TWFULL) {
            this.presentFrame = this.presentRGBFrame;
		} else if (mode === RENDERMODE.H264) {
            this.presentFrame = this.presentYUVFrame;
        }
        initializeCanvas(newWidth, newHeight, textureWidth1, textureHeight1, mode);
    };

    function initializeCanvas(gWidth, gHeight, textureWidth1, textureHeight1, mode) {
        var len = 0;
      var i;
        textureWidth = textureWidth1;
        textureHeight = textureHeight1;
        if (canvas !== null) {
            if (gWidth !== canvasWidth || gHeight !== canvasHeight) {
                canvas.width = gWidth;
                canvas.height = gHeight;
            }
            canvasWidth = gWidth;
            canvasHeight = gHeight;
            yuvWidth = (gWidth % 2 === 0) ? gWidth : gWidth + 1;
            yuvHeight = (gHeight % 2 === 0) ? gHeight : gHeight + 1;
            canContext = canvas.getContext('2d');
            canvasData = canContext.getImageData(0, 0, canvasWidth, canvasHeight);
            canData = canvasData.data;
            len = canvasWidth * canvasHeight * 4;
            for ( i = 3; i < len; i += 4) {
                canData[i] = 0xFF;
            }
		} else {
            return MediaEncoderError.NULL_CANVAS;
        }

        if (mode === RENDERMODE.H264) {
           if(yuvTorgbtable == false){
        		makeTable();
        		yuvTorgbtable = true;
        	}
           if (textureWidth !== offscreenCanvas_width || textureHeight !== offscreenCanvas_height) {
                  offscreenCanvas_width = textureWidth;
                  offscreenCanvas_height = textureHeight;
                  offCanvasData = canContext.createImageData( textureWidth, textureHeight);
                  offCanData = offCanvasData.data;
                  len = textureWidth * textureHeight * 4;
                  for ( i = 3; i < len; i += 4) {
                      offCanData[i] = 0xFF;
                  }
              }
        }
    }


    this.Encode24 = function encode24(input, left, top, width, height) {
        var start = top * canvasWidth + left;
        var canData = canvasData.data;
        var current = start - canvasWidth;
        var offset = 0;
        var colLen = 0;
        var pixel = 0;
        var col = 0;
        var row = 0;

        for (; row < height; ++row) {
            current += canvasWidth;
            offset = (current << 2) - 1;
            colLen = current + width;
            for (col = current; col < colLen; ++col) {
                pixel = input[col];

                canData[++offset] = ((pixel & 0x00ff0000) >> 16);
                canData[++offset] = ((pixel & 0x0000ff00) >> 8);
                canData[++offset] = (pixel & 0x000000ff);
                ++offset;

            }
        }
        canContext.putImageData(canvasData, 0, 0, left, top, width, height);
    };

    this.renderRgbSurface = function (rgbbuffer, rectInfo) {
        var nrRect = rectInfo[0];
        var offset = 1;
        for (var i = 0; i < nrRect; i++) {
            this.Encode24(rgbbuffer, rectInfo[offset], rectInfo[offset + 1], rectInfo[offset + 2], rectInfo[offset + 3]);
            offset += 4;
        }
    };

    this.renderYuvSurface = function (ybuffer, ubuffer, vbuffer, rectCount, dirtyRects, colorFormat) {
        fullFrame = true;
		var converter = (colorFormat == DecoderConstants.TW2_YUV420) ? convertYUV420RGB : convertYUV444BGR;
		for (var i = 0; i < rectCount; i++) {
		  var rect = dirtyRects[i];
		  converter(ybuffer, ubuffer, vbuffer, offCanData, rect.Width, rect.Height, rect.X, rect.Y);
		}
    };

    this.presentYUVFrame = function () {
        // draw text
        if (fullFrame) {
            var len = textTrackingData.length;
            for (var i = 0; i < len; i++) {
                this.renderOverlayBitmap(textTrackingData[i]);
            }
        }

        // Draw from offscreen to onscreen canvas
        canContext.putImageData(offCanvasData , 0 , 0 , 0 , 0 ,canvasWidth, canvasHeight);
        fullFrame = false;
    };

    this.presentRGBFrame = function () {

    };

    function convertYUV420RGB(ybuffer, ubuffer, vbuffer, buffer, yuvWidth, yuvHeight, x, y) {
        var y1, y2, y3, y4, u, v;
        var desOff1 = 0, desOff2 = 0;
        var srcOff1 = 0, srcOff2 = 0;
        var srcoff3;
		
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
                buffer[desOff1] = (y1 + v1);
                buffer[desOff1 + 1] = (y1 - u1v2);
                buffer[desOff1 + 2] = (y1 + u2);
                desOff1 += 4;
                buffer[desOff1] = (y2 + v1);
                buffer[desOff1 + 1] = (y2 - u1v2);
                buffer[desOff1 + 2] = (y2 + u2);
                desOff1 += 4;
                buffer[desOff2] = (y3 + v1);
                buffer[desOff2 + 1] = (y3 - u1v2);
                buffer[desOff2 + 2] = (y3 + u2);
                desOff2 += 4;
                buffer[desOff2] = (y4 + v1);
                buffer[desOff2 + 1] = (y4 - u1v2);
                buffer[desOff2 + 2] = (y4 + u2);
                desOff2 += 4;
                j += 2;
                srcOff1 += 2;
                srcOff2 += 2;
                srcoff3 += 1;
            }
            i += 2;
        }
    }

    function convertYUV444BGR(ybuffer, ubuffer, vbuffer, buffer, yuvWidth, yuvHeight, x, y) {
        var y, u, v;
        var srcOff = 0, desOff = 0;
		var start = y * textureWidth + x;
        for (var i = 0; i < yuvHeight; i++) {
            srcOff = start + i * textureWidth;
            desOff = srcOff << 2;
            for (var j = 0; j < yuvWidth; j++) {
                y = ((ybuffer[srcOff]) - 16) * 1.164;
                u = ubuffer[srcOff] - 128;
                v = vbuffer[srcOff] - 128;
                var u1v2 = (0.392 * u + 0.813 * v);
                var u2 = 2.017 * u;
                var v1 = 1.596 * v;

                buffer[desOff + 2] = (y + v1);  //R
                buffer[desOff + 1] = (y - u1v2);//G
                buffer[desOff    ] = (y + u2);  //B

                srcOff++; desOff += 4;
            }
        }
    }


    this.clearOverlays = function () {
        //do nothing
    };

    this.renderTextBitmap = function (dataObj) {
		textTrackingData.push({
			rect : dataObj["rect"],
			bmp : new Uint8Array(dataObj["bmp"])
		});
    };

    this.deleteText = function (dataObj) {
        var len = textTrackingData.length;
        var rect = dataObj["rect"];
        for (var i = 0; i < len; i++) {
			if (textTrackingData[i].rect.X === rect.X && textTrackingData[i].rect.Y === rect.Y && textTrackingData[i].rect.Width === rect.Width && textTrackingData[i].rect.Height === rect.Height) {
                textTrackingData.splice(i, 1);
                break;
            }
        }
    };

    this.renderOverlaySolidRect = function (dataObj) {
        var left, top, width, height;
        var rect = dataObj["rect"];
        var color = dataObj["color"];
        left = rect.X;
        top = rect.Y;
        width = rect.Width;
        height = rect.Height;
        var start = top * textureWidth + left;
        var current = start - textureWidth;
        var offset = 0;
        var colLen = 0;
        var col = 0;
        var row = 0;
        var r = (color & 0xff0000) >> 16;
        var g = (color & 0xff00) >> 8;
        var b = color & 0xff;
        for (; row < height; ++row) {
            current += textureWidth;
			offset = (current << 2) - 1;
            colLen = current + width;
            for (col = current; col < colLen; ++col) {
				offCanData[++offset] = r;
				offCanData[++offset] = g;
				offCanData[++offset] = b;
				++offset;
            }
        }
    };

    this.renderOverlayBitmap = function (dataObj) {
        var left, top, width, height;
        var rect = dataObj["rect"];
        var bmp = new Uint8Array(dataObj["bmp"]);
        left = rect.X;
        top = rect.Y;
        width = rect.Width;
        height = rect.Height;
        var start = top * textureWidth + left;
        var current = start - textureWidth;
        var offset = 0;
        var colLen = 0;
        var col = 0;
        var row = 0;
        var srcoffset = 0;
        for (; row < height; ++row) {
            current += textureWidth;
			offset = (current << 2) - 1;
            colLen = current + width;
            for (col = current; col < colLen; ++col) {
				offCanData[++offset] = bmp[srcoffset++];
				offCanData[++offset] = bmp[srcoffset++];
				offCanData[++offset] = bmp[srcoffset++];
				offCanData[++offset] = bmp[srcoffset++];

            }
        }
    };
    
    // TODO: set common gfx config data for all tw modules
    if (g && g.environment) {
        g.environment["gfxCtx"] = RENDER_SURFACE_CAN2D;
    }
}
