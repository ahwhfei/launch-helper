function TwWireStream(readStream)
{
	var rs = readStream;
	var coordBuffer = new Point(0, 0), sizeBuffer = new Point(0, 0), lastCoordinate = new Point(0, 0);

	var ReadBitmap2 = function readBitmap2(cache, bitmapRef, keepExpandedForm)
	{
		var b = keepExpandedForm ? cache.GetExpandedBitmap(bitmapRef) : null;
		if (b == null)
		{
			var bitmapStream = cache.ReadObject(bitmapRef);
			var objId = bitmapStream.ReadUInt8();
			if (objId != Cache.ID_BITMAP)
			{
				throw TwWireStreamError.INVALID_CACHE_OBJECT;
			}
			var bitmapControl = bitmapStream.ReadUInt8();

			bitmapStream.ReadUIntXY(coordBuffer);
			b = Bitmap.Make(bitmapStream, bitmapControl, coordBuffer.X+1, coordBuffer.Y+1);
			if (keepExpandedForm)
			{
				cache.CacheExpandedBitmap(bitmapRef, b);
			}
		}
		return b;
	};
   this.ReadBitmap1 = function readBitmap1(cache, paletteRef, bitmapRef)
	{
		var bitmap = ReadBitmap2(cache, bitmapRef, true);

		if (paletteRef >= 0)
		{
			var paletteStream = cache.ReadObject(paletteRef);
			var objId = paletteStream.ReadUInt8();

			switch (objId)
			{
				case Cache.ID_RGB_PALETTE:
					bitmap.SetPalette(paletteStream.ReadRgbPalette(), false);
					break;
				case Cache.ID_INDEX_PALETTE:
					bitmap.SetPalette(paletteStream.ReadIndexPalette(), true);
					break;
				default:
					throw TwWireStreamError.INVALID_CACHE_OBJECT;
			}
		}
		return bitmap;
	};

	var ReadBrush = function readBrush(cache, paletteRef, bitmapRef)
	{
		var bitmap = ReadBitmap2(cache, bitmapRef, false);

		if (paletteRef >= 0)
		{
			var paletteStream = cache.ReadObject(paletteRef);
			var objId = paletteStream.ReadUInt8();

			switch (objId)
			{
				case Cache.ID_RGB_PALETTE:
					bitmap.SetPalette(paletteStream.ReadRgbPalette(), false);
					break;
				case Cache.ID_INDEX_PALETTE:
					bitmap.SetPalette(paletteStream.ReadIndexPalette(), true);
					break;
				default:
					throw TwWireStreamError.INVALID_CACHE_OBJECT;
			}
		}
		return bitmap;
	};

	this.WaitForSpace = function waitForSpace(needed)
	{
		return rs.WaitForSpace(needed);
	};

    this.isEnoughData = function isEnoughData(needed) {
        return rs.isEnoughData(needed);
    };

	this.ReInitialize = function reInitialize()
	{
		this.ResetLastCoordinate();
	};

	this.TranslatePoint = function translatePoint(point)
	{
		point.Translate(lastCoordinate.X, lastCoordinate.Y);
		lastCoordinate.X = point.X , lastCoordinate.Y = point.Y ;
	};

	this.ResetLastCoordinate = function resetLastCoordinate(point)
	{
		if (arguments.length == 1)
		{
			lastCoordinate.X = point.X , lastCoordinate.Y = point.Y ;
			
		}	
		else if (arguments.length == 0)
		{
			lastCoordinate.X = 0 , lastCoordinate.Y = 0;
		}

	};

	this.GetLastCoordinate = function getLastCoordinate()
	{
		return lastCoordinate;
	};

	this.SwitchReadStream = function switchReadStream(readStream)
	{
		rs = readStream;
	};

	this.ReadByte = function readByte()
	{
		return rs.ReadByte();
	};

	this.ReadSByte = function readSByte()
	{
		return rs.ReadSByte();
	};

	this.ReadBytes = function readBytes(desBuffer, desOffset, length)
	{
		return rs.ReadBytes(desBuffer, desOffset, length);
	};

	this.SkipByte = function skipByte(numByteToSkip)
	{
		return rs.SkipByte(numByteToSkip);
	};

	this.ResetRead = function resetRead()
	{
		return rs.ResetRead();
	};

	this.ResetWrite = function resetWrite()
	{
		return rs.ResetWrite();
	};

	this.Available = function available()
	{
		return rs.Available();
	};

	this.ReadUInt8 = function readUInt8()
	{
		return rs.ReadByte();
	};

	this.ReadInt8 = function readInt8()
	{
		return rs.ReadInt8();
	};

	this.ReadUInt16 = function readUInt16()
	{
		return rs.ReadUInt16();
	};

	this.ReadInt16 = function readInt16()
	{
		return rs.ReadInt16();
	};

	this.ReadUInt24 = function readUInt24()
	{
		return rs.ReadUInt24();
	};

	this.ReadInt24 = function readInt24()
	{
		return rs.ReadInt24();
	};

	this.ReadUInt32 = function readUInt32()
	{
		return rs.ReadUInt32();
	};

	this.ReadInt32 = function readInt32()
	{
		return rs.ReadInt32();;
	};

	this.ReadVarUInt = function readVarUInt()
	{
		var b = rs.ReadByte();
		var value = 0;
		var shift = 0;
		var dummy;
		for ( ; (b & 0x80) != 0; b = rs.ReadByte() )
		{
			dummy = (b & 0x7F) << shift;
			if (dummy<0) dummy = dummy + 0xffffffff + 1;
			value = value | dummy;
			shift += 7;
		}
		dummy = b<<shift;
		if (dummy<0) dummy = dummy + 0xffffffff + 1;
		return  value | dummy;
	};

	this.ReadRGB = function readRGB()
	{
		var bgr = this.ReadUInt24();
		var value = bgr << 16;
		value = value | (bgr & 0xff00);
		value = value | (bgr >>> 16);
		return value;
	};

	this.ReadBGR = function readBGR(dest, offset, length)
	{
			var finalPixel = offset + length;
			for (var count = offset; count < finalPixel; ++count)
			{
				dest[count] = this.ReadUInt24();
		}
	};

	this.ReadRGB16 = function readRGB16(dest, offset, length)
	{
		if (arguments.length == 0) {
			var i = this.ReadUInt16();			
			// Widen 0RRRRRGG.GGGBBBBB to RRRRR000.GGGGG000.BBBBB000
			i = (i << 9 | i << 3) & 0xF800F8 | (i << 6) & 0x00F800;
			// Widen RRRRR000.GGGGG000.BBBBB000 to RRRRRRrrr.GGGGGggg.BBBBBbbb
			i |= ((i >> 5) & 0x070707);
		
			return i;
		} else if (arguments.length == 3) {
			var finalPixel = offset + length;
			for (var count = offset; count < finalPixel; ++count) {
				var i = this.ReadUInt16();
				// Widen 0RRRRRGG.GGGBBBBB to RRRRR000.GGGGG000.BBBBB000
				i = (i << 9 | i << 3) & 0xF800F8 | (i << 6) & 0x00F800;
				// Widen RRRRR000.GGGGG000.BBBBB000 to RRRRRRrrr.GGGGGggg.BBBBBbbb
				i |= ((i >> 5) & 0x070707);
				dest[count] = i;
			}
		}
	};

	this.CmdChangePalette = function cmdChangePalette(graphicsContext, cache)
	{
		var start = this.ReadUInt8();
		var paletteRef = rs.ReadUInt16();
		var index = start;

		var cacheInput = cache.ReadObject(paletteRef);

		var objId = cacheInput.ReadUInt8();
		var count = cacheInput.ReadUInt8();
			++count;
		var lastEntry = index + count;

		switch (objId)
		{
			case Cache.ID_RGB_PALETTE:
			{
				while (index < lastEntry)
				{
					graphicsContext.SetPaletteEntry(index, cacheInput.ReadRGB());
					++index;
				}
				break;
			}
			case Cache.ID_INDEX_PALETTE:
			{
				while (index < lastEntry)
				{
					graphicsContext.SetPaletteEntry(index, cacheInput.ReadByte());
					++index;
				}
				break;
			}
			default:
				throw TwWireStreamError.INVALID_CACHE_OBJECT;
		}
		graphicsContext.PaletteChanged();
	};

	this.ReadIntXY = function readIntXY(point)
	{
		var firstByte = rs.ReadByte();
		var flags = firstByte >> 5;
		var dummy;
		

		switch (flags)
		{
			case 0x00:
				point.X = ((firstByte & 0x1F) << 27) >> 27;
				point.Y = 0;
				break;
			case 0x01:
				point.Y = ((firstByte & 0x1F) << 27) >> 27;
				point.X = 0;
				break;
			case 0x02:
				point.X = ((firstByte & 0x1F) << 27) >> 27;
				point.Y = rs.ReadSByte();
				break;
			case 0x03:
				point.Y = ((firstByte & 0x1F) << 27) >> 27;
				point.X = rs.ReadSByte();
				break;
			case 0x04:
			case 0x05:
				dummy = ((firstByte & 0x3F) << 26 ) >> 18;
				point.Y = dummy |  rs.ReadByte();
				dummy = rs.ReadByte();
				point.X = (dummy  << 24) >> 16;
				point.X |= rs.ReadByte();
				
				break;
			case 0x06:
			case 0x07:
				point.Y =  ((firstByte & 0x3F) << 26 ) >> 2;
				point.Y  |= rs.ReadUInt24Reverse( );
				point.X  = rs.ReadInt32Reverse();
				break;
		}
	};

	this.ReadUIntXY = function readUIntXY(point)
	{
		var firstByte = rs.ReadByte();
		var	flags = firstByte >>> 6;
		var dummy;

		switch (flags)
		{
			case 0x00:
				point.Y = (firstByte & 0x38) >> 3;
				point.X = firstByte & 0x07;
				break;
			case 0x01:
				point.Y = firstByte & 0x3F;
				point.X = rs.ReadByte();
				break;
			case 0x02:
				point.Y = (firstByte & 0x3F) << 8;
				point.Y |= rs.ReadByte(); 
				point.X = rs.ReadUInt16Reverse( );
				break;
			case 0x03:
				point.Y = (firstByte & 0x3F) << 24;
				point.Y |= rs.ReadUInt24Reverse( ) ; 
				dummy = rs.ReadByte();
				point.X = (dummy & 0xFF) << 24;
				if (point.X<0) point.X += 0xffffffff + 1;
				point.X |= rs.ReadUInt24Reverse( ) ; 
				break;
		}
	};

	this.ReadCoordinate = function readCoordinate(point)
	{
	    this.ReadIntXY(point);
	    this.TranslatePoint(point);
	};

	this.ReadAbsoluteCoordinate = function readAbsoluteCoordinate(point)
	{
		return this.ReadUIntXY(point);
	};

	this.ReadRectangle = function readRectangle(rect)
	{
		this.ReadCoordinate(coordBuffer);
		var x = coordBuffer.X;
		var y = coordBuffer.Y;
		this.ReadUIntXY(coordBuffer);
		rect.SetBounds(x, y, coordBuffer.X, coordBuffer.Y);
	};

	this.ReadAbsoluteRectangle = function readAbsoluteRectangle(rect)
	{
		this.ReadUIntXY(coordBuffer);
		var x = coordBuffer.X;
		var y = coordBuffer.Y;
		this.ReadUIntXY(coordBuffer);
		rect.SetBounds(x, y, coordBuffer.X, coordBuffer.Y);
	};

	this.CmdChangeClipRegionSimple = function cmdChangeClipRegionSimple(graphicsContext)
	{
		graphicsContext.SetClipRegionSize(1);

		return this.ReadRectangle(graphicsContext.GetClipRegionArea(0));
	};

	this.CmdChangeClipRegionComplex = function cmdChangeClipRegionComplex(graphicsContext, cache)
	{
		this.ReadCoordinate(coordBuffer);
		var regionRef = rs.ReadUInt16();

		var cacheInput = cache.ReadObject(regionRef);
		cacheInput.ResetLastCoordinate(lastCoordinate);
		var objId = cacheInput.ReadByte();

		if (objId != Cache.ID_CLIPPING_REGION)
		{
			throw TwWireStreamError.INVALID_CACHE_OBJECT;
		}

		cacheInput.ReadUIntXY(sizeBuffer);
		var size = cacheInput.ReadVarUInt() + 2;
		graphicsContext.SetClipRegionSize(size);
		graphicsContext.GetClipRegionArea(0).SetBounds(coordBuffer.X, coordBuffer.Y, sizeBuffer.X,  sizeBuffer.Y);
		for (var i = 1; i < size; ++i)
			cacheInput.ReadRectangle(graphicsContext.GetClipRegionArea(i));
	};

	this.ReadBrushPaletted = function readBrushPaletted(cache)
	{
		var paletteRef = rs.ReadUInt16();
		var bitmapRef  = rs.ReadUInt16();
		return ReadBrush(cache, paletteRef, bitmapRef);
	};
	this.ReadBrushUnpaletted = function readBrushUnpaletted(cache)
	{
		var bitmapRef = rs.ReadUInt16();
		return ReadBitmap2(cache, bitmapRef, false);
	};

	this.ReadBitmapPaletted = function readBitmapPaletted(cache)
	{
		var paletteRef = rs.ReadUInt16();

		var bitmapRef  = rs.ReadUInt16();

		return this.ReadBitmap1(cache, paletteRef, bitmapRef);
	};

	this.ReadBitmapUnpaletted = function readBitmapUnpaletted(cache)
	{
		var bitmapRef = rs.ReadUInt16();
		return ReadBitmap2(cache, bitmapRef, true);
	};
}