function RleDecode8()
{
	var isMultiColorSection = true;
	var pixelZero = 0, pixelOne = 0;
	var output = [];
	var initialScanLine = new Uint8Array(0);	
	var PIXEL_ZERO_INITIAL_STATE = 0x00;
	var PIXEL_ONE_INITIAL_STATE  = 0xFF;

	this.Initialize = function initialize(w, h, twTwoReadStream, pixels)
	{
		isMultiColorSection = true;
		pixelZero = PIXEL_ZERO_INITIAL_STATE;
		pixelOne  = PIXEL_ONE_INITIAL_STATE;

		this.BaseInitialize(w, h, 8, twTwoReadStream);

		output = pixels;

		if (initialScanLine.length < w)
		{
		    initialScanLine = new Uint8Array(w);
			for (var i=0; i<w; ++i)
			{
				initialScanLine[i] = PIXEL_ZERO_INITIAL_STATE;
			}
		}

	};

	this.ReadLength = function readLength()
	{
		var encoding = this.TwTwoReadStream.ReadUInt8();
		isMultiColorSection = ((encoding & 0x40) != 0);
		this.IsLeftRun = ((encoding & 0x80) == 0);
		this.InterpretEncoding(encoding & 0x3F);
	};

	this.DoRunDataUp = function doRunDataUp(length)
	{
		var finalPixel = (OutputCount + length) < this.End?(OutputCount + length) : this.End;
		var pixelCopyOrigin = OutputCount - this.Width;

		if (pixelCopyOrigin < 0)
		{
            //ABS of pixelCopyOrigin
			var temp = Math.abs(pixelCopyOrigin);
			var numToCopy = Math.min(temp, length);
			Utility.CopyArray(initialScanLine, 0, output, OutputCount, numToCopy);
			OutputCount = OutputCount + numToCopy;
	        pixelCopyOrigin = 0;
		}

		var numValidPixels = this.Width;
		while(OutputCount < finalPixel)
		{
			var numToCopy = numValidPixels < (finalPixel - OutputCount)?numValidPixels : finalPixel - OutputCount;

			Utility.CopyInSameArray(output, pixelCopyOrigin, output, OutputCount, numToCopy);

			OutputCount = OutputCount  + numToCopy;
			numValidPixels = numValidPixels + numToCopy;
		}

		if (isMultiColorSection)
		{
			var index = (OutputCount - 1);
			var lastPixel = 0;

			if (index < 0)
			{
				lastPixel = PIXEL_ZERO_INITIAL_STATE;
			}
			else
			{
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
				newPixel = PIXEL_ZERO_INITIAL_STATE;
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
			return null;
		}

		var finalPixel = this.End < (OutputCount + length)?this.End : OutputCount + length;

		if (length < 20)
		{
			while(OutputCount < finalPixel)
			{
				output[OutputCount] = pixelZero;
				OutputCount = OutputCount + 1;
			}
		}
		else
		{
			var numValidPixels = 256 ;
			var numToCopy = numValidPixels < (finalPixel - OutputCount)?numValidPixels : finalPixel - OutputCount;
			for (var i=0; i<numToCopy; ++i)
				output[OutputCount + i] = pixelZero ;
			OutputCount = OutputCount + numToCopy;

			var pixelCopyOrigin = OutputCount - numValidPixels;
			while(OutputCount < finalPixel)
			{
				numToCopy = numValidPixels < (finalPixel - OutputCount)?numValidPixels : finalPixel - OutputCount;
				Utility.CopyInSameArray(output, pixelCopyOrigin, output, OutputCount, numToCopy);

				OutputCount = OutputCount + numToCopy;
				numValidPixels = numValidPixels + numToCopy;
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

	this.DoRawData = function doRawData(length)
	{
		if (isMultiColorSection == true)
		{
			if (length == 1)
			{
				var pixel = this.TwTwoReadStream.ReadByte();
				output[OutputCount++] = pixel;
				pixelOne  = pixelZero;
				pixelZero = pixel;
			}
			else
			{
				this.TwTwoReadStream.ReadBytes(output, OutputCount, length);
				OutputCount = OutputCount + length;
				pixelZero = output[OutputCount - 1];
				pixelOne = output[OutputCount - 2];
			}
		}
		else
		{
			var limit = length >> 1;
			for (var i=0; i<limit; ++i)
			{
				output[OutputCount++] = pixelOne;
				output[OutputCount++] = pixelZero;
			}
			if ((length & 0x01) != 0)
			{
				var pixel = output[OutputCount++] = pixelOne;
				pixelOne  = pixelZero;
				pixelZero = pixel;
			}
		}
	};

}

RleDecode8.prototype = new RleDecode();
