function TextGraphics()
{
	var textArea = new Rectangle(0,0,0,0);
	var glyphPosition = new Point(0,0);
	var glyphSize = new Point(0,0);
	var glyphOrigin = new Point(0,0);
	var glyphDestination = new Point(0,0);
	var glyphDeltaInput = new Point(0,0);
	var glyphDelta = new Point(0,0);
	var glyphBuffer = new Uint8Array(0);
	var gA = new Rectangle(0, 0, 0, 0);
	var GlyphDeltaZero = new Point(0, 0);

	var GetGlyph = function getGlyph(twTwoReadStream, memoryCache)
	{
		var dummy = twTwoReadStream.ReadUInt16();

		var glyphStream = memoryCache.ReadObject(dummy);
		glyphStream.ReadByte();
		glyphStream.ReadUIntXY(glyphSize);
		glyphSize.Translate(1, 1);
		glyphStream.ReadIntXY(glyphOrigin);
		glyphStream.ReadIntXY(glyphDeltaInput);
		glyphPosition.Translate(glyphDelta.X, glyphDelta.Y);
		glyphDestination.X = glyphPosition.X , glyphDestination.Y = glyphPosition.Y ;
		glyphDestination.Translate(glyphOrigin.X, glyphOrigin.Y);
		glyphPosition.Translate(glyphSize.X, 0);
		var numPixels = ((glyphSize.X + 7) >> 3) * glyphSize.Y;
		if (glyphBuffer.length < numPixels) {
            glyphBuffer = new Uint8Array(numPixels);
        }
		glyphStream.ReadBytes(glyphBuffer, 0, numPixels);
	};

	this.CmdChangeTextColor = function cmdChangeTextColor(graphicsContext, twTwoReadStream)
	{
		switch (graphicsContext.colorMode)
		{
			case ColorConstants.COLOR_PALETTED_1BIT:
			case ColorConstants.COLOR_PALETTED_4BIT:
			case ColorConstants.COLOR_PALETTED_8BIT:
				graphicsContext.SetTextColor(twTwoReadStream.ReadByte(), true);
				break;
			case ColorConstants.COLOR_RGB_16BIT:
				graphicsContext.SetTextColor(twTwoReadStream.ReadRGB16(), false);
				break;
			case ColorConstants.COLOR_RGB_24BIT:
				graphicsContext.SetTextColor(twTwoReadStream.ReadRGB(), false);
				break;
		}
	};

	this.CmdChangeTextBackgroundColor = function cmdChangeTextBackgroundColor(graphicsContext, twTwoReadStream)
	{
		switch (graphicsContext.colorMode)
		{
			case ColorConstants.COLOR_PALETTED_1BIT:
			case ColorConstants.COLOR_PALETTED_4BIT:
			case ColorConstants.COLOR_PALETTED_8BIT:
				graphicsContext.SetTextBgColor(twTwoReadStream.ReadByte(), true);
				break;
			case ColorConstants.COLOR_RGB_16BIT:
				graphicsContext.SetTextBgColor(twTwoReadStream.ReadRGB16(), false);
				break;
			case ColorConstants.COLOR_RGB_24BIT:
				graphicsContext.SetTextBgColor(twTwoReadStream.ReadRGB(), false);
				break;
		}
	};

	this.CmdTextOut = function cmdTextOut(graphicsContext, twTwoReadStream, memoryCache)
	{
		twTwoReadStream.ReadRectangle(textArea);
		var glyphCount = twTwoReadStream.ReadUInt8() + 1;

		twTwoReadStream.ReadCoordinate(glyphPosition);

		if (graphicsContext.IsTextOpaque())
		{
			graphicsContext.UseTextBgColor();
			graphicsContext.BlockFillClipped(textArea);
		}

		glyphDelta = GlyphDeltaZero;

		for (var i = 0; i < glyphCount; ++i)
		{
			GetGlyph(twTwoReadStream, memoryCache);
			gA.X = glyphDestination.X;
			gA.Y = glyphDestination.Y;
			gA.Width = glyphSize.X;
			gA.Height = glyphSize.Y;
			graphicsContext.TextBitblt(gA, glyphBuffer);
			glyphDelta = glyphDeltaInput;
		}
	};
}