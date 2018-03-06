function CacheStream()
{
    var coordBuffer = new Point(0, 0); 
    var sizeBuffer = new Point(0, 0);
    var lastCoordinate = new Point(0, 0);

	var inputData = null;
	var signedinputData = null ;
	var inputOffset = 0;
    var objectEnd = 0;
	var v = new Int32Array(2);
    
	this.GetAllVariable = function getAllVariable()
	{
		
		v[0] = inputOffset;
		v[1] =  objectEnd;
		return v;
	};

	this.RestoreAllVariable = function restoreAllVariable(io, oe)
	{
		inputOffset = io;
		objectEnd = oe;
	};

	this.ReInitialize = function reInitialize()
	{
		this.ResetLastCoordinate();
	};

	this.TranslatePoint = function translatePoint(point)
	{
		point.Translate(lastCoordinate.X, lastCoordinate.Y);
		lastCoordinate.X = point.X, lastCoordinate.Y = point.Y ;
	};

	this.ResetLastCoordinate = function resetLastCoordinate(point)
	{
		if (arguments.length == 0)
		{
			lastCoordinate.X = 0 , lastCoordinate.Y = 0 ;
		}	
		else if (arguments.length == 1)
		{
			lastCoordinate.X = point.X , lastCoordinate.Y = point.Y;
		}
	};

	this.GetLastCoordinate = function getLastCoordinate()
	{
		return lastCoordinate;
	};

	this.ReadVarUInt = function readVarUInt()
	{
		var b = 0, value = 0, shift = 0;
		for (b = this.ReadByte() & 0xFF; (b & 0x80) != 0; b = this.ReadByte() & 0xFF )
		{
			var dummy = (b & 0x7F) << shift;
			if (dummy<0) dummy = dummy + 0xffffffff + 1;
			value = value | dummy;
			shift += 7;
		}
		var dummy = b<<shift;
		if (dummy<0) dummy = dummy + 0xffffffff + 1;
		return  value | dummy;
	};

	this.ReadRGB = function readRGB()
	{
		return this.ReadUInt24Reverse( );
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


	this.ReadIntXY = function readIntXY(point)
	{

		var firstByte = this.ReadByte() ;
		var flags = firstByte >>> 5;

		switch (flags)
		{
			case 0x00:
				point.X = ((firstByte & 0x1F) << 27);
				if (point.X<0) point.X += 0xffffffff + 1;
				point.X = point.X >> 27;
				point.Y = 0;
				break;
			case 0x01:
				point.Y = ((firstByte & 0x1F) << 27);
				if (point.Y<0) point.Y += 0xffffffff + 1;
				point.Y = point.Y >> 27;
				point.X = 0;
				break;
			case 0x02:
				point.X = ((firstByte & 0x1F) << 27);
				if (point.X<0) point.X += 0xffffffff + 1;
				point.X = point.X >> 27;
				point.Y = this.ReadSByte();
				break;
			case 0x03:
				point.Y = ((firstByte & 0x1F) << 27);
				if (point.Y<0) point.Y += 0xffffffff + 1;
				point.Y = point.Y >> 27;
				point.X = this.ReadSByte();
				break;
			case 0x04:
			case 0x05:
				point.Y = ((firstByte & 0x3F) << 26);
				if (point.Y<0) point.Y += 0xffffffff + 1;
				point.Y = point.Y >> 18;
				point.Y |=  this.ReadByte()  ;
				

				point.X = this.ReadByte()  << 24;
				if (point.X<0) point.X += 0xffffffff + 1;
				point.X >>= 16;
				point.X |= this.ReadByte() ;				
				break;
			case 0x06:
			case 0x07:
				point.Y = (firstByte & 0x3F) << 26;
				if (point.Y<0) point.Y += 0xffffffff + 1;
				point.Y >>= 2;
				point.Y |= this.ReadUInt24Reverse( );
				point.X =  this.ReadByte()  << 24;
				if (point.X<0) point.X += 0xffffffff + 1;
				point.X |= this.ReadUInt24Reverse( );
				break;
		}
	};

	this.ReadUIntXY = function readUIntXY(point)
	{
		var firstByte = this.ReadByte() & 0xFF;
		var	flags = firstByte >>> 6;

		switch (flags)
		{
			case 0x00:
				point.Y = (firstByte & 0x38) >> 3;
				point.X = firstByte & 0x07;
				break;
			case 0x01:
				point.Y = firstByte & 0x3F;
				point.X = this.ReadByte() & 0xFF;
				break;
			case 0x02:
				point.Y = (firstByte & 0x3F) << 8;
				point.Y |= this.ReadByte() ;
				point.X = this.ReadUInt16Reverse( );
				break;
			case 0x03:
				point.Y = (firstByte & 0x3F) << 24;
				point.Y |= this.ReadUInt24Reverse( );
				point.X = (this.ReadByte() & 0xFF) << 24;
				if (point.X<0) point.X += 0xffffffff + 1;
				point.X |= this.ReadUInt24Reverse( );
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
		this.ReadUIntXY(point);
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

	this.ReadRgbPalette = function readRgbPalette()
	{
		var size = 1 + this.ReadUInt8();
		var palette = [];
		var bufferSize = size * 3;
		var buffer = [];
		this.ReadBytes(buffer, 0, bufferSize);
		var offset = 0;
		for (var i = 0; i<size; ++i)
		{
			var d1 = (buffer[offset++] << 16);
			var d2 = ((buffer[offset++] & 0xff) << 8);
			var d3 = (buffer[offset++] & 0xff);

			palette[i] = d1 | d2;
			palette[i] = palette[i] | d3;
		}
		return palette;
	};

	this.ReadIndexPalette = function readIndexPalette()
	{
		var size = 1 + this.ReadUInt8();
		var palette = [];
		this.ReadBytes(palette, 0, size);
		return palette;
	};


	this.Reset = function reset(data, offset, size)
	{
		inputData   = data;
		signedinputData = new Int8Array( inputData.buffer );
		inputOffset = offset;
		objectEnd   = offset + size;
		this.ResetLastCoordinate();
	};

	this.ReadByte = function readByte()
	{
		return inputData[inputOffset++];
	};

	this.ReadSByte = function readSByte()
	{
		return signedinputData[inputOffset++] ;
	};

	this.ReadUInt8 = function readUInt8()
	{
		return inputData[inputOffset++];
		
	};

	this.ReadInt16 = function readInt16()
	{
		var dummy = this.ReadUInt16();
		if (dummy > 0x7FFF)
		{
			dummy = 32768 - dummy;
		}
		return dummy;
	};

	this.ReadUInt16 = function readUInt16()
	{
		return  inputData[inputOffset++] | (inputData[inputOffset++]  << 8 );
	};
	this.ReadUInt16Reverse = function readUInt16Reverse()
	{
		return   ( inputData[inputOffset++] << 8 ) | inputData[inputOffset++] ;
	};

	this.ReadInt24 = function readInt24()
	{
		var dummy = this.ReadUInt24();
		if (dummy > 0x7FFFFF)
		{
			dummy = 8388608 - dummy;
		}
		return dummy;
	};

	this.ReadUInt24 = function readUInt24()
	{
		return (inputData[inputOffset++]  | (inputData[inputOffset++] << 8) | (inputData[inputOffset++]  << 16));
	};
	this.ReadUInt24Reverse = function readUInt24Reverse( )
	{
		return (inputData[inputOffset++] << 16 )  | (inputData[inputOffset++] << 8) | inputData[inputOffset++] ;
	};

	this.ReadInt32 = function readInt32()
	{
		var dummy = ByteConverter.Byte4ToInt32AtOffset(inputData, inputOffset);
		inputOffset = inputOffset + 4;
		return dummy;
	};

	this.ReadBytes = function readBytes(array, offset, length)
	{
		Utility.CopyArray(inputData, inputOffset, array, offset, length);
		inputOffset += length;
	};

	this.SkipByte = function skipByte(numByteToSkip)
	{
		inputOffset += numByteToSkip;
	};

	this.Available = function available()
	{
		return objectEnd - inputOffset;
	};
}
