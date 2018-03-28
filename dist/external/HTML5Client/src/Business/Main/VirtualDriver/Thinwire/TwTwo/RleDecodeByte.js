function RleDecodeByte()
{
	var scanLineSize = 0;
	var pixelMask = 0;
	var lastScanLine = new Uint8Array(0);
	var scan = 0;
	var output = [];

	this.Initialize = function initialize(w, h, scanSize, bitsPerPixel, twTwoReadStream, pixels)
	{
		this.BaseInitialize(w, h, bitsPerPixel, twTwoReadStream);
		scan = scanSize;
		output = pixels;
        //double bitwise not to floor
		this.InitializeScanLineBuffer(~~((scan * 8) / bitsPerPixel));
		switch(bitsPerPixel)
		{
			case 1:
				pixelMask = 0x01;
				break;
			case 4:
				pixelMask = 0x0F;
				break;
		}
	};

	this.InitializeScanLineBuffer = function initializeScanLineBuffer(size)
	{
		if (lastScanLine.length < size)
            lastScanLine = new Uint8Array(size);
	
		for (var i = 0; i<size; ++i)
			lastScanLine[i] = 0;
		scanLineSize = size;
	};

	this.ReadLength = function readLength()
	{
		var encoding = this.TwTwoReadStream.ReadUInt8();
		this.RunLength = encoding & 0x0F;
		this.RawLength = (encoding >> 4) & 0x07;
		this.IsLeftRun = ((encoding & 0x80) == 0);

		if (this.RawLength == 0x07)
		{
			this.RawLength = this.ReadBigNum();
		}

		if (this.RunLength == 0x0F)
		{
			this.RunLength = this.ReadBigNum();
		}

		this.RunLength += 1;
	};

	this.DoRunDataUp = function doRunDataUp(length)
	{
        //double bitwise not to floor
		var ppb = ~~(8 / this.Bpp);
		var pixelCopyOrigin = OutputCount % this.Width;
		var pixelsToScanEnd = this.Width - pixelCopyOrigin;
		var pixelCount = length * ppb;
		var temp = pixelCopyOrigin + pixelCount;
		var pixelScan = ppb * scan;
        //double bitwise not to floor
		var wholeLines = ~~(temp / pixelScan) - 1;
		var pixelsOver = temp % pixelScan;

		if (wholeLines < 1)
		{
			if (pixelsToScanEnd < pixelCount)
			{
				Utility.CopyArray(lastScanLine, pixelCopyOrigin, output, OutputCount, pixelsToScanEnd);
				OutputCount += pixelsToScanEnd;
				var more = pixelsOver < this.End - OutputCount?pixelsOver:this.End - OutputCount;
				Utility.CopyArray(lastScanLine, 0, output, OutputCount, more);
				OutputCount += more;
			}
			else
			{
				Utility.CopyArray(lastScanLine, pixelCopyOrigin, output, OutputCount, pixelCount);
				OutputCount += pixelCount;
			}
		}
		else if ((OutputCount + pixelsToScanEnd) > this.End)
		{
			var dummy = this.End - OutputCount;
			Utility.CopyArray(lastScanLine, pixelCopyOrigin, output, OutputCount, dummy);
			OutputCount = this.End;
		}
		else
		{
			Utility.CopyArray(lastScanLine, pixelCopyOrigin, output, OutputCount, pixelsToScanEnd);
			OutputCount += pixelsToScanEnd;
			for (var i = 0; i<wholeLines; ++i)
			{
				Utility.CopyArray(lastScanLine, 0, output, OutputCount, this.Width);
				OutputCount += this.Width;
			}
			if ((OutputCount + pixelsOver) > this.End)
			{
				var dummy = this.End - OutputCount;
				Utility.CopyArray(lastScanLine, 0, output, OutputCount, dummy);
				OutputCount = this.End;
			}
			else
			{
				Utility.CopyArray(lastScanLine, 0, output, OutputCount, pixelsOver);
				OutputCount += pixelsOver;
			}
		}
	};

	this.DoRunDataLeft = function doRunDataLeft(length)
	{
		var nextPadBoundary = OutputCount + this.Width - (OutputCount % this.Width);
        //double bitwise NOT to floor
		var ppb             = ~~(8 / this.Bpp);
		var pixelCopyOrigin = ((OutputCount % this.Width) + scanLineSize - ppb) % scanLineSize;
		var pixelInByte  	= 0;
		var pixelInBuff  	= pixelCopyOrigin;
		var pixelOutBuff 	= (pixelCopyOrigin + ppb) % scanLineSize;

		for (var i=0; i<length; ++i)
		{
			for (var pixel = ppb; pixel>0; --pixel)
			{
				var color = lastScanLine[pixelInBuff++];

				if (OutputCount < nextPadBoundary)
				{
					if (OutputCount < this.End)
					{
						output[OutputCount++] = color;
					}
					else
					{
						break;
					}
				}

				lastScanLine[pixelOutBuff++] = color;
				pixelInByte++;
				if (pixelInByte >= ppb)
				{
					pixelInByte = 0;
					pixelInBuff = pixelCopyOrigin;
				}
			}
			if (OutputCount >= nextPadBoundary)
			{
				nextPadBoundary += this.Width;
				pixelOutBuff %= scanLineSize;
			}
		}
	};

	this.DoRawData = function doRawData(length)
	{
		var nextPadBoundary = OutputCount + this.Width - (OutputCount % this.Width);

		for (var i=0; i<length; ++i)
		{
			var inByte = this.TwTwoReadStream.ReadUInt8();
			var scanIndex = OutputCount % this.Width;
			for (var bit = 8-this.Bpp; bit>=0; bit = bit - this.Bpp)
			{
				var pixel = ((inByte >> bit) & pixelMask) & 0xFF;
				if (OutputCount < nextPadBoundary)
					output[OutputCount++] = pixel;

				lastScanLine[scanIndex++] = pixel;
            }
			if (OutputCount >= nextPadBoundary)
				nextPadBoundary += this.Width;
		}
	};

}

RleDecodeByte.prototype = new RleDecode();



