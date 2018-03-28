function DirectFrameBuffer(width, height, graphicsContext, rendForm)
{

	this.DirectBitmap = new DirectBitmap(width, height , true );
	var directBitmapWidth = width ;
	var directBitmapHeight = height  ;
	this.DirectBitmap.LineSkip = width ;
	var directBitmapLineSkip = width ;
	this.GetPalette  = function(){ return this.DirectBitmap.GetPalette();						 };
	this.SetPalette  = function(palette){this.DirectBitmap.SetPalette(palette);			 };
	this.gPainter    = null;

	var BLACK = 0;
	var WHITE = 0xFF;
    var colorModel = [];

    var rgbPalette = [];
	for (var index = 256; index--;)
	{
		rgbPalette[index] = 0;
	}

    var indexColorModel = new CtxIndexColorModel(rgbPalette);
    var context = graphicsContext;
    var ourPalette = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255];
	this.gPainter = new GridPainter(this, colorModel, width, height , rendForm, true);
    graphicsContext.setframebufferDimension( directBitmapWidth , directBitmapHeight , directBitmapLineSkip );

	var pixelArray = this.DirectBitmap.Pixels;

	this.Flush = function flush()
	{
		if (this.gPainter != null)
			this.gPainter.Flush();
	};
	this.EndWriting = function ( )
	{
		this.DirectBitmap.Pixels = null;
	};
	this.Close = function close()
	{
		if (this.gPainter != null)
			this.gPainter.Close();
	};

	this.Release = function release()
	{
	};

	this.AsBitmap = function asBitmap()
	{
		return this;
	};

	this.GetPaletteEntry = function getPaletteEntry(n)
	{
		return rgbPalette[n];
	};

	this.GetTranslationColorModel = function getTranslationColorModel()
	{
		return indexColorModel;
	};

	this.SetPaletteEntry = function setPaletteEntry(n, color)
	{
		rgbPalette[n] = color;
	};

	this.NewPixels = function newPixels(x, y, w, h)
	{
			this.gPainter.NewPixels(x,y,w,h);
	};

	var DoROP3 = function doROP3(rop3, s, p, d)
	{
		var result = 0;
		var sOrP = s|p;
		if (sOrP<0) sOrP = sOrP + 0xffffffff + 1;
 		var sOrPnot = ~sOrP;
		if (sOrPnot<0) sOrPnot = sOrPnot + 0xffffffff + 1;

		var sXorD = s^d, dOrP = d|p;
		if (sXorD<0) sXorD = sXorD + 0xffffffff + 1;
		var dOrPnot = ~dOrP, pnot = ~p, snot = ~s, dnot = ~d;
		if (dOrPnot<0) dOrPnot = dOrPnot + 0xffffffff + 1;
		if (pnot<0) pnot = pnot + 0xffffffff + 1;
		if (snot<0) snot = snot + 0xffffffff + 1;
		if (dnot<0) dnot = dnot + 0xffffffff + 1;

		switch (rop3 & 0x0F)
		{
			default:   result = 0;            break;
			case 0x01:
			{
				result = sOrP | d;
				if (result<0) result = result + 0xffffffff + 1;
				result = ~result;
				if (result<0) result = result + 0xffffffff + 1;
				break;
			}
			case 0x02: result = sOrPnot & d;   break;
			case 0x03: result = sOrPnot;       break;
			case 0x04: result = dOrPnot & s;   break;
			case 0x05: result = dOrPnot;       break;
			case 0x06: result = sXorD & pnot;   break;
			case 0x07:
			{
				result = (s&d) | p;
				if (result<0) result = result + 0xffffffff + 1;
				result = ~result;
				if (result<0) result = result + 0xffffffff + 1;
				break;
			}
			case 0x08: result = s & pnot & d;   break;
			case 0x09:
			{
				result = sXorD | p;
				if (result<0) result = result + 0xffffffff + 1;
				result = ~result;
				if (result<0) result = result + 0xffffffff + 1;
				break;
			}
			case 0x0A: result = d & pnot;       break;
			case 0x0B:
			{
				result = ~s;
				if (result<0) result = result + 0xffffffff + 1;
				result = d | result;
				if (result<0) result = result + 0xffffffff + 1;
				result = result & pnot;
				break;
			}
			case 0x0C: result = s & pnot;       break;
			case 0x0D:  
			{
				result = ~d;
				if (result<0) result = result + 0xffffffff + 1;
				result = s | result;
				if (result<0) result = result + 0xffffffff + 1;
				result = result & pnot;
				break;
			}
			case 0x0E:
			{
				result = s | d;
				if (result<0) result = result + 0xffffffff + 1;
				result = result & pnot;
				break;
			}
			case 0x0F: result = pnot;           break;
		}
		var dummy = 0 ;
		switch ((rop3 >> 4) & 0x0F)
		{
			default:    dummy = result;
			break ;
			case 0x01:
			{
				dummy = result | snot & p & dnot;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x02:
			{
				dummy = result | snot & p & d;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x03:
			{
				dummy = result | snot & p;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x04:
			{
				dummy = result | dnot & p & s;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x05:
			{
				dummy = result | dnot & p;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x06:
			{
				dummy = result | sXorD & p;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x07:
			{
				dummy = ~(s&d);
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				dummy = result | dummy & p;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x08:
			{
				dummy = result | s & p & d;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x09:
			{
				dummy = ~(sXorD);
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				dummy = result | dummy & p;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x0A:
			{
				dummy = result | d & p;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x0B:
			{
				dummy = d|snot;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				dummy = result | dummy & p;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x0C:
			{
				dummy = result | s & p;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x0D:
			{
				dummy = s|dnot;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				dummy = result | dummy & p;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x0E:
			{
				dummy = s|d;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				dummy = result | dummy & p;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x0F:
			{
				dummy = result | p;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			
		}
		return  dummy ;
	};

	var DoROP2 = function doROP2(rop2, s, d)
	{
		var snot = ~s, dnot = ~d, sOrD = s|d, sXorD = s^d;
		if (snot<0) snot = snot + 0xffffffff + 1;
		if (dnot<0) dnot = dnot + 0xffffffff + 1;
		if (sXorD<0) sXorD = sXorD + 0xffffffff + 1;
		if (sOrD<0) sOrD = sOrD + 0xffffffff + 1;
		var dummy = 0 ; 
		switch (rop2 & 0x0F)
		{
			default:   dummy = 0 ;
			break ;
			case 0x01:
			{
				dummy = ~sOrD;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break ;
			}
			case 0x02:  dummy = snot & d;
				break;
			case 0x03:  dummy =  snot;
				break;
			case 0x04:  dummy =  dnot & s;
				break;
			case 0x05:  dummy =  dnot;
				break;
			case 0x06:  dummy =  sXorD;
				break;
			case 0x07:
			{
				dummy = ~(s&d);
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break;
			}
			case 0x08: dummy = s&d;
				break;
			case 0x09:
			{
				dummy = ~sXorD;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break;
			}
			case 0x0A: dummy = d;
				break;
			case 0x0B:
			{
				dummy = d|snot;
				if (dummy<0) dummy = dummy + 0xffffffff + 1;
				break;
			}
			case 0x0C: dummy = s;
				break;
			case 0x0D: dummy = sOrDnot;
				break;
			case 0x0E: dummy = sOrD;
				break;
			case 0x0F: dummy = 0xFF;
				break;
		}
		return dummy  ;
	};

	this.CopyPixels = function copyPixels(x, y, w, h, sx, sy)
	{
		var lineSkip 		= directBitmapLineSkip;
		var drawForwards 	= (y <= sy);
		var delta 			= drawForwards ? lineSkip : -lineSkip;
		var rows 			= h - 1;
		var dRow 			= lineSkip * (drawForwards ?  y :  y + rows) +  x;
		var sRow 			= lineSkip * (drawForwards ? sy : sy + rows) + sx;

        if (rows >= 0) {
            rows += 1;

            while (rows--)
            {
				if (dRow < sRow){
					for (var i = 0; i < w; ++i){
						pixelArray[i + dRow] = pixelArray[i + sRow];
					  }
					}
				else{
					for (var i = w -1; i >= 0; --i){
						pixelArray[i + dRow] = pixelArray[i + sRow];
					  }
				}
				
                dRow += delta;
                sRow += delta;
            }
        }

		this.NewPixels(x, y, w, h);
	};
	this.Fill = function fill(x, y, w, h)
	{
		var lineWidth = directBitmapWidth;
		var lineSkip  = directBitmapLineSkip;
		var first = x + lineSkip * y;
		var last  = first + h * lineSkip;
		var linecolor = context.GetCurrentColor();

		for (var dp = first; dp < last; dp += lineSkip) {
			
			for(var i = 0; i < w ;++i)
			{
				pixelArray[i+dp] = linecolor;
			}
		}

		this.NewPixels(x, y, w, h);
	};

	this.DrawLineInternal = function drawLineInternal(first, last, delta)
	{
		var rop3 = context.GetLineRop();
		context.UseLineColor();
		var color = context.GetCurrentColor();

		if (rop3 == Bitmap.BLACK_ROP)
		{
			color = BLACK;
			rop3 = Bitmap.PEN_ROP;
		}
		else if (rop3 == Bitmap.WHITE_ROP)
		{
			color = WHITE;
			rop3 = Bitmap.PEN_ROP;
		}

		if (rop3 == Bitmap.PEN_ROP)
		{
			var lineSkip = directBitmapLineSkip;
			
				for (var i=first; i<last; i+=delta)
					pixelArray[i] = color;
		}
		else
		{
			for (var i=first; i<last; i+=delta)
				pixelArray[i] = DoROP3(rop3, 0, color, pixelArray[i]);
		}
	};
	
	var Convert1BppByteTransparent = function convert1BppByteTransparent(src, dest, offset, fg)
	{
		src = src & 0xff ;
		while(src != 0)
		{
			if ((src & 0x80) != 0)
				dest[offset] = fg;
			src = (src << 1)&0xff;
			++offset;
		}
	};

	this.GlyphBltTransparent = function glyphBltTransparent(x, y, w, h, src, off, clipRect)
	{
		var lineSkip = directBitmapLineSkip;
		if (arguments.length == 6)
		{
			var firstRow = y * lineSkip + x;
			var lastRow  = firstRow + h * lineSkip;
			context.UseTextColor();
			var color = context.GetCurrentColor();
			for (var rowStart=firstRow; rowStart<lastRow; rowStart+=lineSkip)
			{
				var rowEnd = rowStart + w;
				for (var dp=rowStart; dp<rowEnd; dp+=8)
					Convert1BppByteTransparent(src[off++], pixelArray, dp, color);
			}
		}

		else if (arguments.length == 7)
		{
            //double bitwise NOT to floor
			var sWidth = ~~((w+7) / 8);
			var topClip = clipRect.Y - y;

			if (topClip > 0)
			{
				y   += topClip;
				off += topClip * sWidth;
				h   -= topClip;
			}

			var botClip = (y+h) - (clipRect.Y + clipRect.Height);

			if (botClip > 0)
			{
				h -= botClip;
			}

			if (h <= 0) return null;

			if (x >= clipRect.X  &&  (x+w) <= (clipRect.X + clipRect.Width))
			{
				this.GlyphBltTransparent(x, y, w, h, src, off);
				return null;
			}

			var left  = 0>(clipRect.X - x)?0:clipRect.X - x;
			var right = w < (clipRect.X + clipRect.Width - x)?w :(clipRect.X + clipRect.Width - x);

			if (left >= right) return null;

			var dStart = (y * lineSkip) + x;
			var sStart  = off;
			context.UseTextColor();
			var color = context.GetCurrentColor();

			for (var rows=h; rows>0; --rows)
			{
				for (var i=(left & ~7); i<right; i+=8)
				{
                    //double bitwise NOT to floor
					var b = src[sStart + ~~(i/8)];
					if (i < left)      b &=  ((0xFF >>> (left - i)) & 0xFF);
					if (i > right - 8) b &=  ((~0xFF >> (right - i)) & 0xFF);
					Convert1BppByteTransparent(b, pixelArray, dStart + i, color);
				}
				dStart += lineSkip;
				sStart += sWidth;
			}
		}

	};

	var SetOurPalette = function setOurPalette(indexColorModel, alphaPixel)
	{
		indexColorModel.GetPalette(ourPalette);
		if (alphaPixel >= 0)
		{
			ourPalette[alphaPixel] = 0;
		}
	};

	this.Rop3PixelsDirect = function rop3PixelsDirect(rop3, x, y, w, h, src, sx, sy, lineWidth, lineSkip, srcLineSkip)
	{
		if (x < 0) { w += x; sx -= x; x = 0; }
		if (y < 0) { h += y; sy -= y; y = 0; }
		if (x+w > directBitmapWidth)  w = directBitmapWidth  - x;
		if (y+h > directBitmapHeight) h = directBitmapHeight - y;
		if (sx < 0) { w += sx; x -= sx; sx = 0; }
		if (sy < 0) { h += sy; y -= sy; sy = 0; }
		if (sx+w > directBitmapWidth)  w = directBitmapWidth  - sx;
		if (sy+h > directBitmapHeight) h = directBitmapHeight - sy;
		if (w <= 0 || h <= 0) return;
		var srcPixels = src.Pixels;
		var first = lineSkip * y + x;
		var last  = lineSkip * h + first;
		var sFirst = srcLineSkip * sy + sx;
		var sLast = srcLineSkip * src.Height + sFirst;
		
		if (sx > src.Width || sy > src.Height || w > src.Width || h > src.Height) {
			console.error("Invalid params for Rop3PixelsDirect ", arguments);
			return;
		}
		
		if (rop3==Bitmap.SRC_ROP)
		{
			// copy from src to dest row by row
			var sRow = sFirst, dRow = first;
			while (dRow < last && sRow < sLast) {
				var sub = srcPixels.subarray(sRow, sRow+w);
				pixelArray.set(sub, dRow);
				
				dRow += lineSkip;
				sRow += srcLineSkip;
			}
		}
		else if (GraphicsContext.RopUsesBrush(rop3))
		{
			var patternCache = context.GetDeepPatternCache(lineSkip);
			var patternCacheLength = context.PatternCacheLength;
			var bRow = first % patternCacheLength;
			var sRow = sFirst;
			for (var dRow = first; dRow < last; dRow += lineSkip)
			{
				var bp = bRow;
				var sp = sRow;
				for (var dp = dRow; dp < dRow + w; ++dp)
				{
					pixelArray[dp] = DoROP3(rop3, srcPixels[sp], patternCache[bp], pixelArray[dp]);
					++sp;
					++bp;
				}
				bRow = (bRow + lineSkip) % patternCacheLength;
				sRow += srcLineSkip;
			}
		}
		else
		{
			var sRow = sFirst;
			for (var dRow = first; dRow < last; dRow += lineSkip)
			{
				var sp = sRow;
				for (var dp = dRow; dp < dRow + w; ++dp)
				{
					pixelArray[dp] = DoROP2(rop3, srcPixels[sp], pixelArray[dp]);
					++sp;
				}
				sRow += srcLineSkip;
			}
		}
	};

	this.Rop3PixelsIndexed = function rop3pixelsIndexed(rop3, x, y, w, h, src, sx, sy, lineWidth, lineSkip, srcLineSkip)
	{
		var srcPixels = src.Pixels;
		var first = lineSkip * y + x;
		var last  = lineSkip * h + first;
		var sFirst = srcLineSkip * sy + sx;

		rop3 &= 0xFF;
		if (rop3 == Bitmap.SRC_ROP)
		{
			var sRow = sFirst;
			for (var dRow = first; dRow < last; dRow += lineSkip)
			{
				var dRight = dRow + w;
				var sp = sRow;
				for (var dp = dRow; dp < dRight; ++dp)
				{
					pixelArray[dp] = ourPalette[srcPixels[sp] & 0xFF];
					++sp;
				}
				sRow += srcLineSkip;
			}
		}
		else if (rop3 == 0xb8)
		{
			var patternCache = context.GetDeepPatternCache(lineSkip);
			var patternCacheLength = context.PatternCacheLength;
			var bRow = first % patternCacheLength;
			var sRow = sFirst;
			for (var dRow = first; dRow < last; dRow += lineSkip)
			{
				var dRight = dRow + w;
				var bp = bRow;
				var sp = sRow;
				for (var dp = dRow; dp < dRight; ++dp)
				{
					var pen = patternCache[bp];
					var dummy1 = pen ^ pixelArray[dp];
					if (dummy1<0) dummy1 = dummy1 + 0xffffffff + 1;
					var dummy2 = (dummy1 & ourPalette[srcPixels[sp] & 0xFF]) ^ pen;
					if (dummy2<0) dummy2 = dummy2 + 0xffffffff + 1;
					pixelArray[dp]  = dummy2 ;
					++sp;
					++bp;
				}
				bRow = (bRow + lineSkip) % patternCacheLength;
				sRow += srcLineSkip;
			}
		}
		else if (GraphicsContext.RopUsesBrush(rop3))
		{
			var patternCache = context.GetDeepPatternCache(lineSkip);
			var patternCacheLength = context.PatternCacheLength;
			var bRow = first % patternCacheLength;
			var sRow = sFirst;
			for (var dRow = first; dRow < last; dRow += lineSkip)
			{
				var dRight = dRow + w;
				var bp = bRow;
				var sp = sRow;
				for (var dp = dRow; dp < dRight; ++dp)
				{
					pixelArray[dp] = DoROP3(rop3, ourPalette[srcPixels[sp] & 0xFF], patternCache[bp], pixelArray[dp]);
					++sp;
					++bp;
				}
				bRow = (bRow + lineSkip) % patternCacheLength;
				sRow += srcLineSkip;
			}
		}
		else
		{
			var sRow = sFirst;
			for (var dRow = first; dRow < last; dRow += lineSkip)
			{
				var dRight = dRow + w;
				var sp = sRow;
				for (var dp = dRow; dp < dRight; ++dp)
				{
					pixelArray[dp] = DoROP2(rop3, ourPalette[srcPixels[sp] & 0xFF], pixelArray[dp]);
					++sp;
				}
				sRow += srcLineSkip;
			}
		}
        srcPixels = [];
        src = null;
	};

	this.Rop3Pixels = function rop3Pixels(rop3, x, y, w, h, sx, sy, src)
	{
		if (arguments.length == 8)
		{
			if (src==this)
			{
				this.Rop3Pixels(rop3, x, y, w, h, sx, sy);
				return null;
			}

			var lineWidth = directBitmapWidth;
			var lineSkip = directBitmapLineSkip;
			var srcLineSkip = src.LineSkip;
			var srcType = src.tp;
			var indexSrc = null;

			switch (srcType)
			{
				case Bitmap.UNPALETTED:
					this.Rop3PixelsDirect(rop3, x, y, w, h, src, sx, sy, lineWidth, lineSkip, srcLineSkip);
					break;
				case Bitmap.RGB_PALETTED:
				{
					indexSrc = src;
					var alphaPixel = indexSrc.AlphaPixel;
					indexColorModel.SetPalette(indexSrc.GetPalette(false),false, alphaPixel);
					SetOurPalette(indexColorModel, alphaPixel);
					this.Rop3PixelsIndexed(rop3, x, y, w, h, indexSrc, sx, sy, lineWidth, lineSkip, srcLineSkip);
					indexColorModel.UseBasePalette();
					break;
				}
				case Bitmap.INDEX_PALETTED:
				{
					indexSrc = src;
					var alphaPixel = indexSrc.AlphaPixel;
					indexColorModel.SetPalette(indexSrc.GetPalette(true),true, alphaPixel);
					SetOurPalette(indexColorModel, alphaPixel);
					this.Rop3PixelsIndexed(rop3, x, y, w, h, indexSrc, sx, sy, lineWidth, lineSkip, srcLineSkip);
					indexColorModel.UseBasePalette();
					break;
				}
				case Bitmap.INDEXED:
				{
					indexSrc = src;
					var alphaPixel = indexSrc.AlphaPixel;
					indexColorModel.SetAlphaPixel(alphaPixel);
					SetOurPalette(indexColorModel, alphaPixel);
					this.Rop3PixelsIndexed(rop3, x, y, w, h, indexSrc, sx, sy, lineWidth, lineSkip, srcLineSkip);
					indexColorModel.ClearAlphaPixel();
					break;
				}
				default:
					return null;
			}
		}

		else if (arguments.length == 7)
		{
			if (rop3 == Bitmap.SRC_ROP)
			{
				this.CopyPixels(x, y, w, h, sx, sy);
				return null;
			}

			var lineSkip  = directBitmapLineSkip ;
			var lineWidth = directBitmapLineSkip ;
			var drawForwards = (y < sy);
			var delta = drawForwards ? lineSkip : -lineSkip;
			var rows = h - 1;
			var dRow = lineSkip * (drawForwards ?  y :  y + rows) + x;
			var sRow = lineSkip * (drawForwards ? sy : sy + rows) + sx;
			var drawLinesForwards = (y != sy || x < sx);

			if (drawForwards == false)
			{
				--dRow;
				--sRow;
			}

			if (GraphicsContext.RopUsesBrush(rop3))
			{
				var patternCache = context.GetDeepPatternCache(lineSkip);
				var patternCacheLength = context.PatternCacheLength;
				while (rows > 0)
				{
					var bp = dRow % patternCacheLength;
					if (drawLinesForwards == true)
					{
						var sp = sRow;
						for (var dp = dRow; dp < dRow + w; ++dp)
						{
							pixelArray[dp] = DoROP3(rop3, pixelArray[sp], patternCache[bp], pixelArray[dp]);
							++sp;
							++bp;
						}
					}
					else
					{
						var sp = sRow + w;
						for (var dp = dRow + w; dp > dRow; --dp)
						{
							pixelArray[dp] = DoROP3(rop3, pixelArray[sp], patternCache[bp], pixelArray[dp]);
							--sp;
							--bp;
						}
					}
					sRow += delta;
					dRow += delta;
					--rows;
				}
			}
			else
			{
				while (rows > 0)
				{
					if (drawLinesForwards == true)
					{
						var sp = sRow;
						for (var dp = dRow; dp < dRow + w; ++dp)
						{
							pixelArray[dp] = DoROP2(rop3, pixelArray[sp], pixelArray[dp]);
							++sp;
						}
					}
					else
					{
						var sp = sRow + w;
						for (var dp = dRow + w; dp > dRow; --dp)
						{
							pixelArray[dp] = DoROP2(rop3, pixelArray[sp], pixelArray[dp]);
							--sp;
						}
					}
					sRow += delta;
					dRow += delta;
					--rows;
				}
			}
		}

		else if (arguments.length == 5)
		{
			var lineWidth = directBitmapWidth;
			var lineSkip  = directBitmapLineSkip;
			var first = x + lineSkip * y;
			var last  = first + h * lineSkip;

			switch (rop3)
			{
				case Bitmap.WHITE_ROP:
				case Bitmap.BLACK_ROP:
				{
					var lineColor = rop3;
					for (var j=first; j<last; j+=lineSkip)
					{
						
						for(var i = 0 ; i<w ; ++i)
						{
							pixelArray[i+j] = lineColor;
						}
					}
					break;
				}
				case Bitmap.PEN_ROP:
				{
					var penCache = context.GetDeepPatternCache(lineSkip);
					var penCacheLength = context.PatternCacheLength;
					for (var j=first; j<last; j+=lineSkip)
					{
						var srcOffset =  j % penCacheLength ;
						for(var i = 0 ; i<w ; ++i)
						{
							pixelArray[i+j] = penCache[i+srcOffset];
						}
						
					}
					break;
				}
				case Bitmap.INVERT_ROP:
				{
					for (var j = first; j < last; j += lineSkip)
					{
						for (var i = j; i < j + w; ++i)
						{
							pixelArray[i] = ~pixelArray[i];
						}
					}
					break;
				}
				default:
				{
					var patternCache = context.GetDeepPatternCache(lineSkip);
					var patternCacheLength = context.PatternCacheLength;
					for (var j=first; j<last; j+=lineSkip)
					{
						var bp = j % patternCacheLength;
						for (var i=j; i<j+w; ++i)
						{
							pixelArray[i] = DoROP3(rop3, 0, patternCache[bp], pixelArray[i]);
							++bp;
						}
					}
					break;
				}
			}
		}

	};
}


