function pointerUtil() {
    ///this hash map is used for stroing cursor string as in base64 url for look up into this
    //hashmap string are used as first element+"/"+second element+"/"+ so on if cursor imae found
    //then it return that string  else return null it is created once for every application 
    //launch
    var myself = this;
    var hiddenCursor = createHiddenCursor();
    var colorCounts = new Int32Array(256);
    //monoPalette noe become an array contain bgra format
    var monoPalette = new Int32Array([-16777216, -1, 255, 16777471]); //Black , while , yellow( in ABGR format)
    var monoPalettergb = new Uint8Array([0, 0, 0, 255, 255, 255, 255, 255, 0, 255, 0, 0]); //contain in (R,G,B) for monoPalette
    var monoPaletteTransparentIndex = 2;
    var currentPalette = null;
    var currentPalettergb = null;
    var monocolormodel = false;
    var maxColors = getMaximumCursorColor();
    var image_width = 32;
    var image_height = 32;
    var image_size = 32 * 32;
    var image_pixel = new Int32Array(image_size);
    var result_pixel = new Int32Array(image_size);
    var is_Directcolor = false;
    var drawingCanvas = document.createElement('canvas');
    drawingCanvas.height = image_height;
    drawingCanvas.width = image_width;
    var context = drawingCanvas.getContext('2d');
	var scaledCanvas;
	var scaledCtx;
    var canvasData = context.getImageData(0, 0, image_width, image_height);
    var canData = canvasData.data;
	var transparentCursor = false;
    //this function return complete transparent image
    function createHiddenCursor() {
        var hideImagedata = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjbQg61aAAAADUlEQVQYV2P4//8/IwAI/QL/+TZZdwAAAABJRU5ErkJggg==';
        cursorAsData = hideImagedata;
        return cursorAsData;
    }

    function getMaximumCursorColor() {
        //to do this function return maximum cursor color return by system
        //it return 65536now for using indexcolormodel
        var maxcolor = 65536;
        return maxcolor;
    }

    // this function set hide pointer
    this.getHideCursor = function () {
        return hiddenCursor;
    };

    /*
    * this is general function
    * image-array of pixel and other important attribute it contain mask in first half
    * if mask is null
    * mask - is array pf pixel which represent image pixel is maskable or not
    * color model is array of color by that cursor will be made 
    */
    this.GetCursor = function (image, mask, width, height, type, colorModel, is_mono) {
        try {
            monocolormodel = is_mono;
            image_width = width;
            image_height = height;
			transparentCursor = false;
            var cursor;
            if (mask === null || colorModel == null) {
                var len = monoPalette.length;
                currentPalette = new Int32Array(len);
                for (var i = 0; i < len; i++) {
                    currentPalette[i] = monoPalette[i];
                }
                currentPalettergb = new Uint8Array(currentPalette.buffer);
            }
            else if (type != Bitmap.UNPALETTED) {
                getColorModelPalette(colorModel);
            }
            if (mask == null) {
                //make the array called pixel to do
                height /= 2;
                image_width = width;
                image_height = height;
                if ((drawingCanvas.height !=image_height ) ||(drawingCanvas.width !=image_width)) {
                    image_size = image_width * image_height;
                    image_pixel = new Int32Array(image_size);
                    result_pixel = new Int32Array(image_size);
                    drawingCanvas.height = image_height;
                    drawingCanvas.width = image_width;
                    context = drawingCanvas.getContext('2d');
                    canvasData = context.getImageData(0, 0, image_width, image_height);
                    canData = canvasData.data;
                }
                Utility.CopyArray(image, image_size, image_pixel, 0, image_size);
                monocolormodel = true;
                mask = image;
            }
            else {
                if ((drawingCanvas.height !=image_height ) ||(drawingCanvas.width !=image_width)) {
                    image_size = image_width * image_height;
                    image_pixel = new Int32Array(image_size);
                    result_pixel = new Int32Array(image_size);
                    drawingCanvas.height = image_height;
                    drawingCanvas.width = image_width;
                    context = drawingCanvas.getContext('2d');
                    canvasData = context.getImageData(0, 0, image_width, image_height);
                    canData = canvasData.data;
                }
                Utility.CopyArray(image, 0, image_pixel, 0, image_size);

            }
            if (type == Bitmap.UNPALETTED) {
                GetCursorforDirectModel(image_pixel, mask);
            }
            else {
                GetCursorforIndexModel(image_pixel, mask, colorModel);
            }
            context.putImageData(canvasData, 0, 0);
			
			// scale the image if reqd.
			// Scaling doesn't work well in Mac, so setting it to 1.0 - BUG0608899 
			// If scaling is required in future set scale factor correctly.
			var scaleF = 1.0; //(window.devicePixelRatio > 1) ? window.devicePixelRatio : 1.0;
			var cursor = "";
			if (scaleF > 1.0) // Hope no one scales downwards?
			{
				if (!scaledCanvas) {
					scaledCanvas = document.createElement('canvas');
					scaledCtx = scaledCanvas.getContext('2d');
				}
				scaledCanvas.width = drawingCanvas.width * scaleF;
				scaledCanvas.height = drawingCanvas.height * scaleF;

				// use cursor canvas as src and scale it
				scaledCtx.drawImage(drawingCanvas, 0, 0, drawingCanvas.width, drawingCanvas.height, 0, 0, scaledCanvas.width, scaledCanvas.height);
				cursor = scaledCanvas.toDataURL();
			} else {
				cursor = drawingCanvas.toDataURL();
			}
            return cursor;
        }
        catch (error) {
            return null;
        }
    };
    function getColorModelPalette(colorModel) {
        var pal = colorModel.GetPalette();
        var len = pal.length;
        currentPalette = new Int32Array(len);
        var r, g, b;
        for (var i = 0; i < len; i++) {
            r = colorModel.getRed();
            g = colorModel.getBlue();
            b = colorModel.getGreen();
            currentPalette[i] = (255 << 24) | (b << 16) | (g << 8) | r;
        }
        currentPalettergb = new Uint8Array(currentPalette.buffer);
    }
    var attr_direct = new PointerAttributes_of_directmap();
    /* this function make cursor from direct color model
    * in direct color model each array component is combination of alpha red green blue
    * image-represent index  or direct color
    * mask is arrar of pixel that represent that respective pixel is tranparent or opaque
    */
    function GetCursorforDirectModel(image, mask) {
        try {
            attr_direct.setImageMask(image, mask);

            if (maxColors < 65536 || attr_direct.InvertPixels > 0) {
                var monoImage = ReduceImage_Direct(image, mask);
                var cursor = myself.GetCursor(monoImage, mask, image_width, image_height, Bitmap.INDEX_PALETTED, null, true);
                return cursor;
            }
            else {
                CombineBitmapsDirect(image, mask, attr_direct);
                is_Directcolor = true;
                GetCursorImage();
            }
        }
        catch (error) {
            throw cursorError.Direct_Cursor_Image;
        }
    }

    var attr_index = new PointerAttributes_of_indexmap();
    /*
    * this function is used for draw cursor for idex color model 
    * in index color model image represent index of particular model 
    * image is array of pixel that represent index of color in color model
    * mask represent that array that represent that respective pixel is maskable or not
    */
    function GetCursorforIndexModel(image, mask, colorModel) {
        try {
            is_Directcolor = false;

            var cursorBitmap;
            var cursorColorModel;

            attr_index.setImageMask(image, mask);
            if (attr_index.InvertPixels == 0 && attr_index.SolidPixels <= maxColors) {
                // We can do this one in color!  :-)
                CombineBitmapsColor(image, mask, attr_index);
                var alpha = attr_index.LeastUsedPixel;
                if (alpha < 0) {
                    cursorColorModel = colorModel;
                }
                else {
                    currentPalette[alpha] = monoPalette[monoPaletteTransparentIndex];
                }
				if(completeTranparentIndexImage(result_pixel, image_size, alpha) == true)
				{
					transparentCursor = true;
				}

            }
            else {
                ReduceImage_Index(image, mask);
                CombineBitmapsMono(image, mask, attr_index);
            }
            GetCursorImage(cursorColorModel);
        }
        catch (error) {
            throw cursorError.Index_cursor_Image;
        }
    }
	function completeTranparentIndexImage(buffer, size, index) {
		for (var i = 0; i < size; i++) {
			if (buffer[i] != index) {
				return false;
			}

		}
		return true;
	}
    /** Combines a color bitmap with a mask to produce an image with
    *  transparency.  This function does not attempt to deal with invert
    *  colors. */
    function CombineBitmapsDirect(image, mask, attrs) {
        var width = image_width;
        var height = image_height;
        var size = width * height;
        var imgPixels = image;
        var maskPixels = mask;
        var resultPixels = result_pixel;
        var OPAQUE = 0xFF000000;

        // Set the pixels
        for (var i = 0; i < size; i++) {
            if (maskPixels[i] == 0)
            // opaque
                resultPixels[i] = imgPixels[i] | OPAQUE;
            else
                resultPixels[i] = imgPixels[i] & (~OPAQUE);
        }
    }

    /** Combines a color bitmap with a mask to produce an image with
    *  transparency.  This function does not attempt to deal with invert
    *  colors. */
    function CombineBitmapsColor(image, mask, attrs) {
        var width = image_width;
        var height = image_height;
        var size = width * height;
        var imgPixels = image;
        var maskPixels = mask;
        var resultPixels = result_pixel;
        var transparentIndex = attrs.LeastUsedPixel;

        // We don't set the palette - that's handled externally using a ColorModel.
        // Set the pixels
        for (var i = 0; i < size; i++) {
            resultPixels[i] = (maskPixels[i] == 0) ? imgPixels[i] : transparentIndex;
        }
    }

    function MakeTransparent(model, alphaPixel) {
        model.setTransparentPixel(alphaPixel);
        return model;
    }

    /**
    * getCursorImage function is used for getting image of cursor as in form of canvas
    * of appropriate size (generally 32*32). It make a canvas and for each pixel it fill
    * color by rgba() standard HTML function and return canvas as base64 dataurl
    * image is Bitmap containing array  of pixel array that is either index or
    * direct color  for that respective pixel
    * color model represent different color
    */
    function GetCursorImage(colorModel) {
        if (is_Directcolor == false) {
            if (monocolormodel == true) {
                FillCursorIndexMonocolor();
            }
            else {
                FillCursorIndexcolor(colorModel);
            }
        }

        else {
            FillCursorDirectbitmap();
        }
    }

    function FillCursorDirectbitmap() {
        var temp;
        var offset = 0;
        for (var i = 0; i < image_height; i++) {
            rowstartindex = i * image_width;
            for (var j = 0; j < image_width; j++) {
                temp = result_pixel[rowstartindex + j];
                canData[offset + 3] = (temp >> 24) & 0xff;
                canData[offset] = ((temp & 0x00ff0000) >> 16);
                canData[offset + 1] = ((temp & 0x0000ff00) >> 8);
                canData[offset + 2] = (temp & 0x000000ff);

                offset += 4; ;
            }
        }
    }

    function FillCursorIndexMonocolor() {
        var temp, offset = 0;
        var candata1 = new Int32Array(canData.buffer);
        for (var i = 0; i < image_height; i++) {
            for (var j = 0; j < image_width; j++) {
                candata1[offset] = currentPalette[result_pixel[offset]];
                offset++;
            }
        }
		/*
		 * Hack in some browser complete transparent image shown as black cursor
		 * if make alpha to lower value(1-255) as 1 then faded cursor shown
		 */
		 if (transparentCursor == true) {
			 candata1[0] = monoPalette[3];
		 }
    }

    function FillCursorIndexcolor(colorModel) {
        var temp, rowstartindex;
        for (var i = 0; i < image_height; i++) {
            rowstartindex = i * image_width;
            for (var j = 0; j < image_width; j++) {
                temp = currentPalette[result_pixel[rowstartindex + j]];
                canData[offset + 3] = (temp >> 24) & 0xff;
                canData[offset] = ((temp & 0x00ff0000) >> 16);
                canData[offset + 1] = ((temp & 0x0000ff00) >> 8);
                canData[offset + 2] = (temp & 0x000000ff);
                offset += 4; ;
            }
        }
    }

    /* this function reduce direct colore mdel image to index color model image if
    * image  contain less no of color 
    */
    function ReduceImage_Direct(image, mask) {
        var pixels = image;
        var maskPixels = mask;
        var width = image_width;
        var height = image_height;
        var size = width * height;

        // N.B. We only consider masked-in pixels.
        var len = colorCounts.length;
        for (var i = 0; i < len; i++)
            colorCounts[i] = 0;
        var solidPixelCount = 0;
        for (var i = 0; i < size; i++) {
            if (maskPixels[i] == 0) {
                colorCounts[Brightness_Direct(pixels[i])]++;
                solidPixelCount++;
            }
        }

        var resultPixels = pixels;
        var median = FindMedian(colorCounts, solidPixelCount);

        for (var i = 0; i < size; i++)
            resultPixels[i] = Brightness_Direct(pixels[i]) < median ? 0 : 1;

        return resultPixels;
    }

    /** Reduces the color-depth of the supplied image, as masked by <var>mask</var>.
    @param image the image to reduce
    @param mask mask that specifies which colours are opaque (0) or transparent (1)
    @param cm palette of <var>image</var>
    @return an {@link IndexBitmap} similar to <var>image</var>, with pixels
    quantised where the corresponding <var>mask</var> pixels are
    zero.  If nothing needs reducing, may return the original.
    */
    function ReduceImage_Index(image, mask) {
        //console.log("start of reduceimage in pointerutil");
        // Does it need reducing?  If not, return the original.

        var pixels = image;
        var maskPixels = mask;
        var width = image_width;
        var height = image_height;
        var size = width * height;

        // N.B. We only consider masked-in pixels.
        var len = colorCounts.length;
        for (var i = 0; i < len; i++)
            colorCounts[i] = 0;
        var solidPixelCount = 0;
        for (var i = 0; i < size; i++) {
            if (maskPixels[i] == 0) {
                colorCounts[Brightness_Index(pixels[i] & 0xff)]++;
                solidPixelCount++;
            }
        }

        var median = FindMedian(colorCounts, solidPixelCount);

        for (var i = 0; i < size; i++)
            if (maskPixels[i] == 0)
                pixels[i] = Brightness_Index(pixels[i] & 0xff) < median ? 0 : 1;
            else
                pixels[i] = pixels[i];
    }

    function Brightness_Index(color) {

        // We use the formula Y = 0.299*r + 0.587*g + 0.114*b, scaled 1000 times so that we can use
        // integer arithmetic.  Resultant range is 0(black) to 255,000 (white).
        var offset = color * 3;

        brightness = 299 * currentPalettergb[offset] + 587 * currentPalettergb[offset + 1] + 114 * currentPalettergb[offset + 2];

        return Math.floor(brightness / 1000);
    }

    function Brightness_Direct(color) {
        var r = (color >> 16) & 0xff;
        var g = (color >> 8) & 0xff;
        var b = (color) & 0xff;
        brightness = 299 * r + 587 * g + 114 * b;
        return Math.floor(brightness / 1000);

    }

    function FindMedian(values, total) {
        var valueLen = values.length;
        // Find the position k that minimises
        //  abs(sum_{i=0}^{k-1}values[i] - sum_{i=k}^{values.length}values[i]).
        if (total < 0) {
            total = 0;
            for (var i = 0; i < valueLen; i++) {
                total += values[i];
            }
        }

        if (total == 0) {
            // Empty array - shouldn't happen!
            return valueLen / 2;
        }

        // Instead of summing counts and comparing against half = total/2, we maintain a double sum,
        // avoiding the inaccurate integer divide.
        var sum = 0;
        var oldSum = 0;
        for (var i = 0; i < valueLen; i++) {
            sum += 2 * values[i];
            if (sum >= total) {
                // Which is closer, sum[0,i] or sum[0,i-1]?
                if ((sum - total) <= (total - oldSum)) {
                    i++;
                }
                return i;
            }
            oldSum = sum;
        }

        return valueLen / 2;
    }

    function CombineBitmapsMono(image, mask, attrs) {
        var width = image_width;
        var height = image_height;
        var size = width * height;
        var imgPixels = image;
        var maskPixels = mask;
        var resultPixels = result_pixel;
        var containsSolid = (attrs.SolidPixels > 0);
        var containsInvert = (attrs.InvertPixels > 0);

        // First, set the solid-color pixels
        for (var i = 0; i < size; i++) {
            if (maskPixels[i] == 0) { // solid
                resultPixels[i] = imgPixels[i];
            } else {
                resultPixels[i] = 2; // transparent
            }
        }

        var counts = new Int32Array(3);
        // Set any invert pixels that adjoin color pixels.  We prefer to contrast with solid
        // colours and be consistent with our chosen invert colors.  Repeat this until no more
        // changes possible.
        if (containsSolid && containsInvert) {
            var changed;
            do {
                changed = false;
                containsInvert = false; // We'll set it again if there's any we can't choose.
                for (var row = 0; row < height; row++) {
                    for (var col = 0; col < height; col++) {
                        var i = row * height + col;
                        if (resultPixels[i] == 2 && imgPixels[i] != 0) {
                            // invert - is it adjacent to a colored pixel?
                            counts[0] = counts[1] = counts[2] = 0;
                            if (row > 0) {
                                if (col > 0 && maskPixels[i - height - 1] == 0) counts[resultPixels[i - height - 1]]++;
                                if (maskPixels[i - height] == 0) counts[resultPixels[i - height]]++;
                                if (col < width - 1 && maskPixels[i - height + 1] == 0) counts[resultPixels[i - height + 1]]++;
                            }
                            if (col > 0 && maskPixels[i - 1] == 0) counts[resultPixels[i - 1]]++;
                            if (col < width - 1 && maskPixels[i + 1] == 0) counts[resultPixels[i + 1]]++;
                            if (row < height - 1) {
                                if (col > 0 && maskPixels[i + height - 1] == 0) counts[resultPixels[i + height - 1]]++;
                                if (maskPixels[i + height] == 0) counts[resultPixels[i + height]]++;
                                if (col < width - 1 && maskPixels[i + height + 1] == 0) counts[resultPixels[i + height + 1]]++;
                            }
                            if (counts[0] != counts[1]) {
                                resultPixels[i] = (counts[0] > counts[1]) ? 1 : 0;
                                changed = true;
                                continue;
                            }
                            // Is it adjacent to any already-chosen invert pixels?
                            // No need to reset counts, as they begin equal...
                            if (row > 0) {
                                if (col > 0) counts[resultPixels[i - height - 1]]++;
                                counts[resultPixels[i - height]]++;
                                if (col < width - 1) counts[resultPixels[i - height + 1]]++;
                            }
                            if (col > 0) counts[resultPixels[i - 1]]++;
                            if (col < width - 1) counts[resultPixels[i + 1]]++;
                            if (row < height - 1) {
                                if (col > 0) counts[resultPixels[i + height - 1]]++;
                                counts[resultPixels[i + height]]++;
                                if (col < width - 1) counts[resultPixels[i + height + 1]]++;
                            }
                            if (counts[0] != counts[1]) {
                                resultPixels[i] = (counts[0] > counts[1]) ? 0 : 1;
                                changed = true;
                                continue;
                            }
                            containsInvert = true; // We couldn't decide...
                        }
                    }
                }
            } while (changed);
        }

        if (containsInvert) {
            // Choose black for any remaining invert pixels...
            for (var i = 0; i < size; i++) {
                if (resultPixels[i] == 2 && imgPixels[i] != 0)
                    resultPixels[i] = 0;
            }

            // Choose contrasting colour for transparent pixels adjoining invert
            for (var row = 0; row < height; row++) {
                for (var col = 0; col < height; col++) {
                    var i = row * height + col;
                    if (resultPixels[i] == 2 && imgPixels[i] == 0) {
                        //transparent - is it adjacent to an invert pixel?
                        counts[0] = counts[1] = counts[2] = 0;
                        if (row > 0) {
                            if (col > 0 && maskPixels[i - height - 1] != 0 && imgPixels[i - height - 1] != 0)
                                counts[resultPixels[i - height - 1]]++;
                            if (maskPixels[i - height] != 0 && imgPixels[i - height] != 0)
                                counts[resultPixels[i - height]]++;
                            if (col < width - 1 && maskPixels[i - height + 1] != 0 && imgPixels[i - height + 1] != 0)
                                counts[resultPixels[i - height + 1]]++;
                        }
                        if (col > 0 && maskPixels[i - 1] != 0 && imgPixels[i - 1] != 0)
                            counts[resultPixels[i - 1]]++;
                        if (col < width - 1 && maskPixels[i + 1] != 0 && imgPixels[i + 1] != 0)
                            counts[resultPixels[i + 1]]++;
                        if (row < height - 1) {
                            if (col > 0 && maskPixels[i + height - 1] != 0 && imgPixels[i + height - 1] != 0)
                                counts[resultPixels[i + height - 1]]++;
                            if (maskPixels[i + height] != 0 && imgPixels[i + height] != 0)
                                counts[resultPixels[i + height]]++;
                            if (col < width - 1 && maskPixels[i + height + 1] != 0 && imgPixels[i + height + 1] != 0)
                                counts[resultPixels[i + height + 1]]++;
                        }
                        if (counts[0] > counts[1])
                            resultPixels[i] = 1;
                        else if (counts[1] > 0) // either c1>c0 or c1==c0!=0
                            resultPixels[i] = 0;
                    }
                }
            }
        }
    }

    // A structure that stores useful knowledge about a pointer.
    function PointerAttributes_of_directmap(image, mask) {

        /** The number of pixels in opaque colors. */
        this.SolidPixels = 0;

        /** The number of pixels in "invert" colors.  These colors are not
        representable by a HTML  image. */
        this.InvertPixels = 0;

        /** The number of different colors used by this pointer image. It is the number of different greyscales. */
        this.DistinctColors = 0;

        /** Best (least-used) pixel value for transparent index. */
        this.LeastUsedPixel;

        this.setImageMask = function (image, mask) {
            var len = colorCounts.length;

            for (var i = 0; i < len; ++i) {
                colorCounts[i] = 0;
            }
            var invertPixels = 0;
            var solidPixels = 0;
            var distinctColors = 0;

            var width = image_width;
            var height = image_height;
            var size = width * height;

            var imgPixels = image;
            var maskPixels = mask;

            // Count colors, noting as we go whether we have any invert pixels.
            for (var i = 0; i < size; i++) {
                if (maskPixels[i] == 0) { // solid
                    var colorIndex = Brightness_Direct(imgPixels[i]);
                    colorCounts[colorIndex]++;
                    solidPixels++;
                } else {
                    if (imgPixels[i] != 0) // invert
                        invertPixels++;
                }
            }

            var leastUsed = 0;

            // Now count the distinct colors.
            var len = colorCounts.length;
            for (var i = 0; i < len; ++i) {
                if (colorCounts[i] > 0)
                    distinctColors++;
                if (colorCounts[i] < colorCounts[leastUsed])
                    leastUsed = i;
            }

            // Write the fields.
            this.SolidPixels = solidPixels;
            this.InvertPixels = invertPixels;
            this.DistinctColors = distinctColors;
            this.LeastUsedPixel = leastUsed;
        };
    }

    // A structure that stores useful knowledge about a pointer.
    function PointerAttributes_of_indexmap(image, mask) {
        /** The number of pixels in opaque colors. */
        this.SolidPixels = 0;

        /** The number of pixels in "invert" colors.  These colors are not
        representable by a HTML  image. */
        this.InvertPixels = 0;

        /** The number of different colors used by this pointer image.  */
        this.DistinctColors = 0;

        /** Best (least-used) pixel value for transparent index. */
        this.LeastUsedPixel;

        this.setImageMask = function (image, mask) {
            for (var i = 0; i < 256; ++i) {
                colorCounts[i] = 0;
            }

            var invertPixels = 0;
            var solidPixels = 0;
            var distinctColors = 0;

            var width = image_width;
            var height = image_height;
            var size = width * height;

            var imgPixels = image;
            var maskPixels = mask;

            // Count colors, noting as we go whether we have any invert pixels.
            for (var i = 0; i < size; i++) {
                if (maskPixels[i] == 0) { // solid
                    var colorIndex = imgPixels[i] & 0xFF;
                    colorCounts[colorIndex]++;
                    solidPixels++;
                } else {
                    if (imgPixels[i] != 0) // invert
                        invertPixels++;
                }
            }

            var leastUsed = 0;

            // Now count the distinct colors.
            var len = colorCounts.length;
            for (var i = 0; i < len; ++i) {
                if (colorCounts[i] > 0)
                    distinctColors++;
                if (colorCounts[i] < colorCounts[leastUsed])
                    leastUsed = i;
            }

            // Write the fields.
            this.SolidPixels = solidPixels;
            this.InvertPixels = invertPixels;
            this.DistinctColors = distinctColors;
            this.LeastUsedPixel = leastUsed;
        };
    }
}
