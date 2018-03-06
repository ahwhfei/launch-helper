   
	

function RleDecodeInt()
{
	var isMultiColorSection = 0;
	var pixelZero = 0, pixelOne = 0;
	var output = null;
	var initialScanLine = new Int32Array( 0 );
	var pixelCache = new Int32Array(128);
	var initialPixelCache16 = (function getPixelCache16() {
        var pixels = new Int32Array(128);
        var pixelHexString16 =
            "0000"+"6110"+"2000"+"7e1f"+"4000"+"2110"+"6000"+"0110"+
            "63ff"+"0000"+"43ff"+"7f08"+"23ff"+"7e18"+"03ff"+"6739"+
            "03f0"+"6118"+"23f0"+"4118"+"43f0"+"2118"+"63f0"+"0118"+
            "011f"+"5ad6"+"7f00"+"211f"+"411f"+"7e10"+"611f"+"0000"+
            "4100"+"2010"+"6100"+"0010"+"0100"+"6010"+"2100"+"7f1f"+
            "7f18"+"0000"+"0000"+"0000"+"0842"+"0000"+"7e08"+"7bde"+
            "23e0"+"2018"+"03e0"+"0018"+"63e0"+"6018"+"43e0"+"4018"+
            "401f"+"7f10"+"601f"+"35ad"+"001f"+"0000"+"7e00"+"201f"+
            "39ce"+"0000"+"7d08"+"4a52"+"7fe0"+"7c18"+"0000"+"0000"+
            "0200"+"6310"+"2200"+"7c1f"+"4200"+"2310"+"6200"+"0310"+
            "031f"+"0000"+"7d00"+"231f"+"431f"+"7c10"+"631f"+"0421"+
            "6318"+"0208"+"4318"+"2208"+"2318"+"4208"+"0318"+"6208"+
            "7d18"+"2529"+"56b5"+"0000"+"0000"+"0000"+"7ff0"+"7c08"+
            "4300"+"2210"+"6300"+"0210"+"0300"+"6210"+"2300"+"7d1f"+
            "421f"+"7d10"+"621f"+"0000"+"021f"+"6b5a"+"7c00"+"221f"+
            "7fff"+"2218"+"0218"+"6308"+"6218"+"0308"+"4218"+"2308";
        var hex = pixelHexString16.split('');
        for (var i = 0, j = 0;  i < pixels.length;  i++) {
            var n;
            n  = (parseInt(hex[j++], 16) & 0xFF) << 12;
            n |= (parseInt(hex[j++], 16) & 0xFF) << 8;
            n |= (parseInt(hex[j++], 16) & 0xFF) << 4;
            n |= (parseInt(hex[j++], 16) & 0xFF);

            // Widen RRRRRGGGGGBBBBB to RRRRR000GGGGG000BBBBB000
            // (n << 9) & 0xF80000 | (n << 6) & 0x00F800 | (n << 3) & 0x0000F8;
            n = (n << 9 | n <<3) & 0xF800F8 | (n << 6) & 0x00F800;
            // Widen RRRRR000GGGGG000BBBBB000 to RRRRRRrrrGGGGGgggBBBBBbbb
            n |= ((n >> 5) & 0x070707);

            pixels[i] = n;
        }
		return pixels;
    })();
	
	var initialPixelCache24 = (function getPixelCache24() {
        var pixels = new Int32Array(128);
        var pixelHexString24 =
            "000000"+"ff8000"+"ececec"+"bfbfbf"+"c7c7c7"+"949494"+"dedede"+"8d8d8d"+
            "000080"+"ff8080"+"c2c2c2"+"919191"+"0000c0"+"ff80c0"+"f0f0f0"+"a3a3a3"+
            "800000"+"ffc000"+"e3e3e3"+"b0b0b0"+"c000c0"+"c8c8c8"+"d1d1d1"+"828282"+
            "c00000"+"800080"+"cdcdcd"+"9e9e9e"+"8000c0"+"ffc0c0"+"ffffff"+"acacac"+
            "ebebeb"+"b8b8b8"+"ff0000"+"008000"+"c0ffff"+"d9d9d9"+"c0c0c0"+"939393"+
            "c5c5c5"+"969696"+"008080"+"c0c000"+"80ffff"+"f7f7f7"+"ff00c0"+"0080c0"+
            "e4e4e4"+"b7b7b7"+"808000"+"00c000"+"d6d6d6"+"858585"+"c080c0"+"cfcfcf"+
            "cacaca"+"999999"+"808080"+"c08000"+"00ffff"+"f8f8f8"+"8080c0"+"00c0c0"+
            "00ffc0"+"d0d0d0"+"8080ff"+"00c0ff"+"00ff80"+"e2e2e2"+"fbfbfb"+"a8a8a8"+
            "fefefe"+"adadad"+"c080ff"+"e7e7e7"+"00ff00"+"cccccc"+"d5d5d5"+"868686"+
            "80ffc0"+"dfdfdf"+"ff00ff"+"0080ff"+"c0ff00"+"80ff80"+"f4f4f4"+"a7a7a7"+
            "c0ffc0"+"f1f1f1"+"c0c0ff"+"e8e8e8"+"80ff00"+"c0ff80"+"dadada"+"898989"+
            "8000ff"+"ffc0ff"+"ffffc0"+"d7d7d7"+"fcfcfc"+"afafaf"+"ffff80"+"e5e5e5"+
            "c000ff"+"e0e0e0"+"f9f9f9"+"aaaaaa"+"d2d2d2"+"818181"+"ffff00"+"cbcbcb"+
            "0000ff"+"ff80ff"+"d8d8d8"+"8b8b8b"+"f3f3f3"+"a0a0a0"+"eaeaea"+"b9b9b9"+
            "efefef"+"bcbcbc"+"f6f6f6"+"a5a5a5"+"dddddd"+"8e8e8e"+"c4c4c4"+"979797";
        var hex = pixelHexString24.split('');
        for (var i = 0, j = 0;  i < pixels.length;  i++) {
            var n;
            n  = (parseInt(hex[j++], 16) & 0xFF) << 20;
            n |= (parseInt(hex[j++], 16) & 0xFF) << 16;
            n |= (parseInt(hex[j++], 16) & 0xFF) << 12;
            n |= (parseInt(hex[j++], 16) & 0xFF) << 8;
            n |= (parseInt(hex[j++], 16) & 0xFF) << 4;
            n |= (parseInt(hex[j++], 16) & 0xFF);
            pixels[i] = n;
        }
		return pixels;
    })();
	
	var photographicWeighting = 0;  
	var twTwoReadStream = null;

	this.GetPixelCache = function getPixelCache()
	{
		
		if (this.Bpp == 24 )
		{
			
			return initialPixelCache24;
		}
		else
		{
			
			return initialPixelCache16;
		}
	};

	var ReadCache = function readCache(index)
	{
		var pixel = pixelCache[index];
		if ( index & 1)
		{
			var other = index & ~1;
			pixelCache[index] = pixelCache[other];
			pixelCache[other] = pixel;
		}
		return pixel;
	};

	this.ReadCache24 = function readCache24()
	{
		var pixel = twTwoReadStream.ReadUInt24(); // RRead BGR 24-bit pixel; high bits are zero
		var hash = pixel ^ (pixel >>> 5) ^ (pixel >>> 11) ^ (pixel >>> 15) ^ (pixel >>> 20);
		hash = (hash & 0x3F) << 1;
		pixelCache[hash+1] = pixelCache[hash];
		pixelCache[hash] = pixel;
		return pixel;
   };

	this.ReadCache16 = function readCache16(control)
	{
		var b1 = twTwoReadStream.ReadUInt8();
		var pixel = ((control & 0x7F) << 8) | b1;// 15-bit pixel, to calculate hash
		var hash = pixel ^ (pixel >>> 4) ^ (pixel >>> 7) ^ (pixel >>> 13);
		hash = (hash & 0x3F) << 1;

		// Widen RRRRRGGGGGBBBBB to RRRRR000GGGGG000BBBBB000
        // (pixel << 9) & 0xF80000 | (pixel << 6) & 0x00F800 | (pixel << 3) & 0x0000F8;
        pixel = (pixel << 9 | pixel <<3) & 0xF800F8 | (pixel << 6) & 0x00F800;
        // Widen RRRRR000GGGGG000BBBBB000 to RRRRRRrrrGGGGGgggBBBBBbbb
        pixel |= ((pixel >> 5) & 0x070707);
		
		pixelCache[hash+1] = pixelCache[hash];
		pixelCache[hash] = pixel;
		return pixel;
	};

	this.ReadColorDelta24 = function readColorDelta24(pixel)
	{
		var red = 0, green = 0, blue = 0;
		var control = twTwoReadStream.ReadByte();

		if (!(control & 0x80))
		{
			// 15 bits:  1ggbbbbb rrrrrggg
			photographicWeighting += 1;
			var b1 = twTwoReadStream.ReadUInt8();
			blue = control & 0x1F;
			green = ((control >>> 2) & 0x18) | (b1 & 0x07);
			red = b1 >>> 3;
		}
		else if (!(control & 0x40))
		{
			// 6 bits: 10ggrrbb
			photographicWeighting += 2;
			blue = control & 3;
			green = (control >> 2) & 3;
			red = (control >> 4) & 3;
		}
		else if (!(control & 0x20))
		{
			// 21 bits: 110bbbbb gggggggb rrrrrrrb
			photographicWeighting -= 1;
			var b1 = twTwoReadStream.ReadUInt16();
			blue = ((control << 2) & 0x7C) | ((b1 >> 7) & 2) | (b1 & 1);
			green = (b1 >>> 1) & 0x7F;
			red = b1 >>> 9;
		}
		else
		{
			// 24 bits: 1110xxxx bbbbbbbb gggggggg rrrrrrrr
			photographicWeighting -= 2;
			blue = twTwoReadStream.ReadUInt8();
			green = twTwoReadStream.ReadUInt8();
			red = twTwoReadStream.ReadUInt8();
		}

		var dRed = (red ^ (0x1FF * (red&1))) << 15;
		var dGreen = (green ^ (0x1FF * (green&1))) << 7;
		var dBlue = (blue  ^ (0x1FF * (blue&1)))  >> 1;

		// Important to mask off top byte as equality tests are performed on
        // pixel values in doRunDataUp in the if (isMultiColorSection) block.
		return (pixel + (dRed | dGreen | dBlue)) & 0xffffff;
	};

    this.ReadColorDelta16 = function readColorDelta16(pixel)
	{
		var red = 0, green = 0, blue = 0;
		var control = twTwoReadStream.ReadUInt8();

		if ((control & 0x80) == 0)
		{
			// 7 bits: 0gggrrbb
			blue = control & 3;
			green = control >> 4;
			red = (control >> 2) & 3;
			photographicWeighting += 1;
		}
		else
		{
			// 15 bits: 1bbbbbgg rrrrrggg
			var b1 = twTwoReadStream.ReadUInt8();
			blue = (control >>> 2) & 0x1F;
			green = (control << 3) & 0x18 | b1 & 0x07;
			red = b1 >>> 3;
			photographicWeighting -= 1;
		}

		var dRed   = (red   ^ (0x3F * (red&1)))   << 18;
		var dGreen = (green ^ (0x3F * (green&1))) << 10;
		var dBlue  = (blue  ^ (0x3F * (blue&1)))  << 2;
		var delta  = (dRed + dGreen + dBlue);

		pixel |= 0x070707;
		pixel += delta;

		pixel = pixel & 0xF8F8F8 | (pixel >> 5) & 0x070707;

		return pixel;
	};

	this.ReadLength = function readLength()
	{
		var encoding = twTwoReadStream.ReadUInt8();
		isMultiColorSection = (encoding & 0x40) ;
		this.IsLeftRun = ((encoding & 0x80) == 0);
		this.InterpretEncoding(encoding & 0x3F);
	};

	this.DoRunDataUp = function doRunDataUp(length)
	{
		var finalPixel = OutputCount + length < this.End?OutputCount + length: this.End;
		var pixelCopyOrigin = OutputCount - this.Width;
		if (pixelCopyOrigin < 0)
		{
            //find ABS of pixelCopyOrigin
			var temp = Math.abs(pixelCopyOrigin);
			var numToCopy = Math.min(temp, length);
			Utility.CopyArray(initialScanLine, 0, output, OutputCount, numToCopy);
			OutputCount += numToCopy;
	        pixelCopyOrigin = 0;
		}

		var numValidPixels = this.Width;

		while(OutputCount < finalPixel)
		{
			var numToCopy = numValidPixels < (finalPixel - OutputCount)?numValidPixels:(finalPixel - OutputCount);
			
			Utility.CopyInSameArray(output, pixelCopyOrigin, output, OutputCount, numToCopy);
			
			OutputCount += numToCopy;
			numValidPixels += numToCopy;
		}

		if (isMultiColorSection)
		{
			var index = (OutputCount - 1);
			var lastPixel = 0;

			if (index < 0)
			{
				lastPixel = RleDecodeInt.PIXEL_ZERO_INITIAL_STATE;
			} else {
				lastPixel = output[index];
			}
			if (lastPixel != pixelZero)
			{
				pixelOne  = pixelZero;
				pixelZero = lastPixel;
			}
		}
		else
		{
			var index = OutputCount - this.Width;
			var newPixel = 0;

			if (index < 0)
			{
				newPixel = RleDecodeInt.PIXEL_ZERO_INITIAL_STATE;
			}
			else
			{
				newPixel = output[index];
			}

			if (newPixel == pixelOne)
			{
				newPixel  = pixelZero;
			}
			else
			{
				newPixel  = pixelOne;
				pixelOne  = pixelZero;
				pixelZero = newPixel;
			}

			if (OutputCount < this.End)
			{
				output[OutputCount++] = newPixel;
			}
		}
	};

	this.DoRunDataLeft = function doRunDataLeft(length)
	{
		if ((length == 0) || (OutputCount >= this.End))
		{
			return;
		}
		var finalPixel = Math.min(this.End, OutputCount + length);

		if (length < 20)
		{
			while(OutputCount < finalPixel)
			{
				output[OutputCount++] = pixelZero;
			}
		}
		else
		{
			var numValidPixels = 256 ;
			var numToCopy = Math.min(numValidPixels,(finalPixel - OutputCount));
			
			var desOffset =  OutputCount ;
			for (var i = 0; i < numToCopy; ++i) {
				output[i + desOffset] =  pixelZero;
			}			
			OutputCount += numToCopy;

			var pixelCopyOrigin = OutputCount - numValidPixels;
			while(OutputCount < finalPixel)
			{
				numToCopy = numValidPixels < (finalPixel - OutputCount)?numValidPixels : finalPixel - OutputCount;
				Utility.CopyInSameArray(output, pixelCopyOrigin, output, OutputCount, numToCopy);
				
				OutputCount += numToCopy;
				numValidPixels += numToCopy;
			}
		}

		if (!isMultiColorSection && (OutputCount < this.End))
		{
			var newPixel = pixelOne;
			pixelOne  = pixelZero;
			pixelZero = newPixel;
			output[OutputCount++] = newPixel;
		}
	};

	this.GetPixel = function getPixel()
	{
		if (this.Bpp == 16)
		{
			return twTwoReadStream.ReadRGB16();
		}
		else if (this.Bpp == 24)
		{
			return twTwoReadStream.ReadUInt24(); // Read BGR
		}
		else
		{
			return 0x00000000;
		}
	};

	this.ReadRawPhoto = function readRawPhoto(length)
	{
				
		if (photographicWeighting > 0)
		{
			// We're in photographic mode; use colour deltas.
			var pixel = output[OutputCount-1];
			var count = OutputCount;
			while(length-- > 0)
			{
				pixel = fnRCD(pixel);
				output[count++] = pixel;
			}
			OutputCount  = count;
		}
		else
		{
			// Non-photographic mode; use pixel cache.
			
			// Function ReadCache24 doesn't takes any input but nothing wrong in passing one  in Java Script
			// as deciding function outside loop improves our performance.
			var count =      OutputCount ;
			var readUint8 =  twTwoReadStream.ReadUInt8;
			var readcache =  ReadCache;
			while(length-- > 0)
			{
				var control = readUint8();
				if ( control & 0x80)
				{
					// read from input, and store into cache
					++photographicWeighting;
					output[count++] = fnRC(control);
				}
				else 
				{
					// read from cache
					--photographicWeighting;
					output[count++] = readcache(control);
				}
				
			}
			
			OutputCount  = count;
		}

		if (OutputCount > 1)
			pixelOne = output[OutputCount - 2];
		else
			pixelOne = pixelZero;

		pixelZero = output[OutputCount - 1];
	};

	this.DoRawData = function doRawData(length)
	{
		if (isMultiColorSection)
		{
			if (this.IsPhotoCodec == true)
			{
				this.ReadRawPhoto(length);
			}
			else
			{
				this.ReadRaw(length);
			}
		}
		else
		{
			var odd = (length & 0x01) != 0;
			var limit = length >> 1;
			for (var i=0;  i<limit; ++i)
			{
				output[OutputCount++] = pixelOne;
				output[OutputCount++] = pixelZero;
			}
			if (odd )
			{
				output[OutputCount++] = pixelOne;
				var pixel = pixelOne;
				pixelOne  = pixelZero;
				pixelZero = pixel;
			}
		}
	};

	this.ReadRaw = function readRaw(length)
	{
		if (length == 1)
		{
			var pixel = this.GetPixel();
			output[OutputCount++] = pixel;
			pixelOne  = pixelZero;
			pixelZero = pixel;
		}
		else
		{
			if (this.Bpp == 16)
			{
				twTwoReadStream.ReadRGB16(output, OutputCount, length);
			}
			else if (this.Bpp == 24)
			{
				twTwoReadStream.ReadBGR(output, OutputCount, length);
			}
			OutputCount += length;
			pixelZero = output[OutputCount - 1];
			pixelOne = output[OutputCount - 2];
		}
	};

	this.Initialize = function initialize(w, h, bpp, twTwoReadStrm, pixels)
	{
		if (bpp != 16 && bpp != 24)
			throw RleDecodeError.INVALID_DEPTH;

		isMultiColorSection = 1;//TRUE

		pixelZero = RleDecodeInt.PIXEL_ZERO_INITIAL_STATE;
		pixelOne  = RleDecodeInt.PIXEL_ONE_INITIAL_STATE;
		
		twTwoReadStream = twTwoReadStrm;

		this.BaseInitialize(w, h, bpp, twTwoReadStrm);

		output = pixels;

		if ( initialScanLine.length < w)
		{
			
			initialScanLine = new Int32Array(w);
			for (var i = 0; i < w; i++) {
                initialScanLine[i] = RleDecodeInt.PIXEL_ZERO_INITIAL_STATE;
            }
		}

		if (this.IsPhotoCodec == true)
		{
			photographicWeighting = RleDecodeInt.INITIAL_PHOTOGRAPHIC_WEIGHTING;
			
			
			var src = this.GetPixelCache();
			
		
				pixelCache.set( src );
			
		}

	};
}

RleDecodeInt.prototype = new RleDecode();

RleDecodeInt.PIXEL_ZERO_INITIAL_STATE =  0x00; // black
RleDecodeInt.PIXEL_ONE_INITIAL_STATE =  (new Int32Array([~0]))[0]; // white
RleDecodeInt.INITIAL_PHOTOGRAPHIC_WEIGHTING = -10;

