function ImageGraphics()
{
    // ROP3 IDs used for draw carets
    // @see `Raster Operations using Filter Elements <http://www.svgopen.org/2003/papers/RasterOperationsUsingFilterElements/index.html>`
    // and `ROP Code Reference <http://msdn.microsoft.com/zh-cn/subscriptions/downloads/aa932106.aspx>`
	// For vast majority of Windows applications
	var ROP3_PATINVERT = 0x5A; // Background ^ Brush
	var ROP3_PATINVERT_REVERSE = 0xA5; // ~(Background ^ Brush)
	
	// For special Windows applications like Outlook and Visio
	var ROP3_SRCINVERT = 0x66; // Background ^ Source

	var trickOrigin = new Point(0,0);
	var trickClip   = new Rectangle(0,0,0,0);
	var bltRect     = new Rectangle(0,0,0,0);
	var bltPoint    = new Point(0,0);
	var brushOffset = new Point(0,0);
	var wd = null;

	var SrcBitblt = function srcBitblt(rop3, c, input, cache)
	{
		var source = null;

		var control = input.ReadUInt8();

		var hasPalette  = (control & Bitmap.PALETTE_CTRL_FLAG) != 0;
		var hasClip     = (control & Bitmap.CLIP_CTRL_FLAG)    != 0;
		var isOffscreen = (control & Bitmap.OSS_CTRL_FLAG)     != 0;

		// even though we do not suport OSS yet, 7.x adds this flag for bitblt :(
		if (isOffscreen) {
            var srcCtx = input.ReadUInt16();
			if (srcCtx == 0) { // lets make sure it is default screen only
				source = c.FrameBuffer.AsBitmap();
			} else {
				console.error("Offscreen surface not supported!, surface id: " + srcCtx);
			}
        }
		else if (hasPalette)
		{
			source = input.ReadBitmapPaletted(cache);
		}
		else
		{
			source = input.ReadBitmapUnpaletted(cache);
		}

		if (hasClip) {
            input.ReadAbsoluteRectangle(bltRect);
        }
        else {
            if (source != null) {
                bltRect.SetBounds(0, 0, source.Width, source.Height);
            }
        }

		input.ReadCoordinate(bltPoint);

		if (source != null)
		{
			c.BitBlt(rop3, bltRect, bltPoint, source);
			
            if (rop3 === ROP3_SRCINVERT) {
                CheckCaretPosition(bltRect, bltPoint.X, bltPoint.Y);
            }
		}
		else if (wd != null)
		{
			wd.WritePacketRedraw(bltPoint.X, bltPoint.Y, bltRect.Width, bltRect.Height);
		}
	};

	var NoSrcBitblt = function noSrcBitblt(rop3, graphicsContext, twTwoReadStream)
	{
		twTwoReadStream.ReadRectangle(bltRect);
		graphicsContext.BitBlt(rop3, bltRect);
        
        if (rop3 === ROP3_PATINVERT_REVERSE || rop3 === ROP3_PATINVERT) {
            CheckCaretPosition(bltRect);
        }
	};

	this.SetWinstationDriver = function setWinstationDriver(winstationDriver)
	{
		wd = winstationDriver;
	};

	this.CmdBitblt = function cmdBitblt(graphicsContext, twTwoReadStream, memoryCache)
	{
		var rop3 = twTwoReadStream.ReadByte();
		if (ImageGraphics.RopUsesSource(rop3) == true)
			return SrcBitblt(rop3, graphicsContext, twTwoReadStream, memoryCache);
		else
			return NoSrcBitblt(rop3, graphicsContext, twTwoReadStream);
	};

	this.CmdScrToScrBitblt = function cmdScrToScrBitblt(graphicsContext, twTwoReadStream, memoryCache)
	{
		var rop3  = twTwoReadStream.ReadByte();
		twTwoReadStream.ReadRectangle(bltRect);
		twTwoReadStream.ReadCoordinate(bltPoint);
		graphicsContext.BitBlt(rop3, bltRect, bltPoint);
	};

	this.CmdBitbltTrickPartial = function cmdBitbltTrickPartial(c, input, cache)
	{
		input.ReadAbsoluteRectangle(trickClip);

		var source = input.ReadBitmapUnpaletted(cache);

		input.ReadCoordinate(trickOrigin);

		c.BitbltTrick(trickOrigin, source, trickClip);
	};

	this.CmdBitbltTrick = function cmdBitbltTrick(c, input, cache)
	{
		var source = input.ReadBitmapUnpaletted(cache);
		input.ReadCoordinate(trickOrigin);
		c.BitbltTrick(trickOrigin, source);
	};

	this.CmdNewSolidBrush = function cmdNewSolidBrush(c, input)
	{
		switch (c.colorMode)
		{
			case ColorConstants.COLOR_PALETTED_1BIT:
			case ColorConstants.COLOR_PALETTED_4BIT:
			case ColorConstants.COLOR_PALETTED_8BIT:
			{
				var dummy = input.ReadByte();
				c.SetSolidBrushColor(dummy, true);
			}
				break;
			case ColorConstants.COLOR_RGB_16BIT:
			{
				var dummy = input.ReadRGB16();
				c.SetSolidBrushColor(dummy, false);
			}
				break;
			case ColorConstants.COLOR_RGB_24BIT:
			{
				var dummy = input.ReadRGB();
				c.SetSolidBrushColor(dummy, false);
			}
				break;
		}
	};

	this.CmdNewPatternBrush = function cmdNewPatternBrush(c, input, cache){
		var control = input.ReadUInt8();
		var hasPalette = (control & Bitmap.PALETTE_CTRL_FLAG) != 0, hasOffset = (control & Bitmap.CLIP_CTRL_FLAG) != 0;
		var brush = null;

		if (hasPalette)
		{
			var dummy = input.ReadBrushPaletted(cache);
			brush = dummy;
		}
		else
		{
			var dummy = input.ReadBrushUnpaletted(cache);
			brush = dummy;
		}

		if (hasOffset)
		{
			input.ReadUIntXY(brushOffset);
			c.SetBrushOffset(brushOffset);
		}

		c.SetBrush(brush);
	};
}

ImageGraphics.Bit = function bit(bit, val) { return 0 != ((1<<bit) & val); };
ImageGraphics.RopUsesBrush = function RopUsesBrush(rop)  { return 0 != (((rop>>>4)^rop) & 0x0F); };
ImageGraphics.RopUsesSource = function RopUsesSource(rop) { return 0 != (((rop>>>2)^rop) & 0x33); };
ImageGraphics.RopUsesDest = function RopUsesDest(rop)   { return 0 != (((rop>>>1)^rop) & 0x55); };
