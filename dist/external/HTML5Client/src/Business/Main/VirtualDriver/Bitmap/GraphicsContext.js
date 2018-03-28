function GraphicsContext(offScreen)
{
	this.FrameBuffer = null;
	this.CurrentColorIndex = 0;
	this.PatternCacheLength = 0;
	this.colorMode = 0;
	this.Size = new Size(0, 0);
	var CurrentTextColor = 0;
	var CurrentTextBgColor = 0;
	var CurrentLineColor = 0;
	var CurrentSolidColor = 0;

	var isOffScreen = offScreen;
	var currentColor = 0;
	var currentSolidBrushColor = 0;
	var currentTextColorIndex = 0;
	var currentTextBgColorIndex = 0;
	var currentSolidColorIndex = 0;
	var currentSolidBrushColorIndex = 0;
	var currentLineColorIndex = 0;
	var textIsOpaque = false;
	var brush = null;
	var brushOffset = new Point(0,0);
	var brushCache = [];
	var deepBrushCache = [];
	var LineRop = 0;

	var patternCache = null;
	var deepPatternCache = [];
	var regionBufferSize = 0;
	var regionBuffer = new Array( 	(new Rectangle(0, 0, 0, 0)),
									(new Rectangle(0, 0, 0, 0)),
									(new Rectangle(0, 0, 0, 0)),
									(new Rectangle(0, 0, 0, 0))
								);
	var regionLastUsed = 0;
	var lineStart  = new Point(0, 0), lineEnd = new Point(0, 0), bitBltDest = new Point(0, 0), clipOrigin = new Point(0, 0), clipFirst  = new Point(0, 0);
	var lineRectangle = new Rectangle(0, 0, 0, 0), clippedLine   = new Rectangle(0, 0, 0, 0), clippedBlock  = new Rectangle(0, 0, 0, 0), bitBltArea = new Rectangle(0, 0, 0, 0);
	var bitBltClip = new Rectangle(0, 0, 0, 0), trickClip = new Rectangle(0, 0, 0, 0);
	var frameBufferwidth ;
	var frameBufferheight ;
	var frameBufferlineskip ;
	this.setframebufferDimension =  function( width ,  height ,lineskip )
	{
		frameBufferwidth =  width ;
		frameBufferheight =  height ;
		frameBufferlineskip =  lineskip ;
	};
	function directframebuffer_NULL ()
	{
		return null ;
	}
	this.TextBitblt = directframebuffer_NULL;
	this.BitbltTrick = directframebuffer_NULL;
	this.GlyphBltTransparent = directframebuffer_NULL;
	this.Rop3Pixels = directframebuffer_NULL ;
	
	var CanDrawRegion = function canDrawRegion(n, dx, dy, drawn)
	{
		if (drawn[n]==true) return false;

		bitBltClip.SetBounds(regionBuffer[n].X, regionBuffer[n].Y, regionBuffer[n].Width, regionBuffer[n].Height);
		bitBltClip.Translate(dx, dy);

		var left  = bitBltClip.X;
		var top   = bitBltClip.Y;
		var right = left + bitBltClip.Width;
		var bot   = top + bitBltClip.Height;

		var regionDivide = regionLastUsed;

		for (var i=regionDivide; i<regionBufferSize; i=((i==0)?regionDivide+1:(i<=regionDivide)?(i-1):(i+1)))
		{
			if (i == n || drawn [i]) continue;

			var clip = regionBuffer[i];
			var cl = clip.X;
			var cr = cl + clip.Width;
			var ct = clip.Y;
			var cb = ct + clip.Height;

			if (i <= regionDivide)
			{
				if (ct >= bot)
				{
					continue;
				}
				else if (cb <= top || ct <= top && cr <= left)
				{
					i = 0;
					continue;
				}
			}
			else
			{
				if (cb <= top)
					continue;
				else if (ct >= bot || cb >= bot && cl >= right)
					break;
			}

			if (cl >= right || cr <= left)
				continue;

			return false;

		}
		drawn[n] = true;
		regionLastUsed = n;
		return true;
	};

	var NextArea = function nextArea(dx, dy, drawn)
	{
		for (var i=regionLastUsed; i<regionBufferSize; ++i)
		{
			if (CanDrawRegion(i, dx, dy, drawn) == true)
				return regionBuffer[i];
		}
		for (var i=regionLastUsed-1; i>=0; --i)
		{
			if (CanDrawRegion(i, dx, dy, drawn) == true)
				return regionBuffer[i];
		}
		return null;
	};

	this.GetCurrentColor = function getCurrentColor()
	{
		return currentColor;
	};

	this.SetLineRop = function setLineRop(rop)
	{
		var rop2 = (rop - 1) & 0x0F;
		lineRop = (((rop2 & 0x3) * 0x05) | ((rop2 & 0xC) * 0x14));

		lineRop &=  0xFF;
	};

	this.GetLineRop = function getLineRop()
	{
		return lineRop;
	};

	this.SetTextColor = function setTextColor(color, isByteColor)
	{
		if (isByteColor == true)
		{
			currentTextColorIndex = color;
			if (this.FrameBuffer == null)
				return null;
			CurrentTextColor = this.FrameBuffer.GetPaletteEntry(color & 0xff);
		}
		else
			CurrentTextColor = color;
	};

	this.SetTextBgColor  = function setTextBgColor(color, isByteColor)
	{
		if (isByteColor == true)
		{
			currentTextBgColorIndex = color;
			if (this.FrameBuffer == null)
				return null;
			CurrentTextBgColor = this.FrameBuffer.GetPaletteEntry(color & 0xff);
		}
		else
			CurrentTextBgColor = color;
	};

	this.SetLineColor  = function setLineColor(color, isByteColor)
	{
		if (isByteColor == true)
		{
			currentLineColorIndex = color;
			if (this.FrameBuffer == null)
				return null;
			  CurrentLineColor = this.FrameBuffer.GetPaletteEntry(color & 0xff);
		}
		else
			CurrentLineColor = color;
	};

	this.SetSolidColor  = function setSolidColor(color, isByteColor)
	{
		if (isByteColor != true)
		{
			CurrentSolidColor = color;
		}
		else
		{
			
			currentSolidColorIndex = color;
			if (this.FrameBuffer == null)
				return;
			CurrentSolidColor = this.FrameBuffer.GetPaletteEntry(color & 0xff);
		}
			
	};

	this.SetSolidBrushColor  = function setSolidBrushColor(color, isByteColor)
	{
		if (isByteColor == true)
		{
			currentSolidBrushColorIndex = color;
			if (this.FrameBuffer == null) return;
			currentSolidBrushColor = this.FrameBuffer.GetPaletteEntry(color & 0xff);
		}
		else
		{
			currentSolidBrushColor = color;
			patternCache = null;
			deepPatternCache = null;
			if (brush != null)
			{
				brush = null;
			}
		}
	};

	this.ResetOpaqueText = function resetOpaqueText()
	{
		textIsOpaque = false;
	};

	this.ToggleOpaqueText = function toggleOpaqueText()
	{
		textIsOpaque = !textIsOpaque;
	};

	this.IsTextOpaque = function isTextOpaque()
	{
		return textIsOpaque;
	};

	this.SetBrush = function setBrush(brushBitmap)
	{
		brush = brushBitmap;
		patternCache = null;
		deepPatternCache = null;
	};

	this.SetBrushOffset = function setBrushOffset(point)
	{
		brushOffset.X = point.X , brushOffset.Y = point.Y ;
		patternCache = null;
		deepPatternCache = null;
	};

	this.UseTextColor = function useTextColor()
	{
		this.CurrentColorIndex = currentTextColorIndex;
		currentColor = CurrentTextColor;
	};

	this.UseTextBgColor = function useTextBgColor()
	{
		this.CurrentColorIndex = currentTextBgColorIndex;
		currentColor = CurrentTextBgColor;
	};
	this.UseLineColor = function useLineColor()
	{
		this.CurrentColorIndex = currentLineColorIndex;
		currentColor = CurrentLineColor;
	};

	this.UseSolidColor = function useSolidColor()
	{
		this.CurrentColorIndex = currentSolidColorIndex;
		currentColor = CurrentSolidColor;
	};

	this.SetPaletteEntry = function setPaletteEntry(n, color)
	{
		if (this.FrameBuffer == null) return null;
		this.FrameBuffer.SetPaletteEntry(n, color);
	};

	this.FlushDisplay = function flushDisplay() {
			if (this.FrameBuffer != null) {
				this.FrameBuffer.Flush();
			}
	};

	this.Fill = function fill(x, y, w, h)
	{
		this.FrameBuffer.Fill(x, y, w, h);
	};

	/* Accepts one argument (dx) as its overloaded form */
	this.DrawHLine = function drawHLine(x1, y, x2)
	{
		if (arguments.length == 1)
		{
			var dx = arguments[0];
			lineEnd.X = lineStart.X , lineEnd.Y = lineStart.Y ;
			
			lineEnd.Translate(dx, 0);

			if (regionBufferSize == 0)
			{
				this.DrawHLine(lineStart.X, lineStart.Y, lineEnd.X);
			}
			else
			{
				var sx = lineStart.X;
				var ex = lineEnd.X;
				var sy = lineStart.Y;
				var l2r = (dx > 0);

				var left  = l2r ? sx : ex + 1;
				var top   = sy;
				var right = l2r ? ex : sx + 1;
				var bot   = sy + 1;

				var pixelsRemaining = l2r ? dx : -dx;
				var regionDivide = regionLastUsed;

				for (var i=regionDivide; i<regionBufferSize; i = ((i==0)?(regionDivide+1):(i<=regionDivide)?(i-1):(i+1)))
				{
					var clip = regionBuffer[i];
					var cl = clip.X;
					var cr = cl + clip.Width;
					var ct = clip.Y;
					var cb = ct + clip.Height;

					if (i<=regionDivide)
					{
						if (ct >= bot)
						{
							continue;
						}
						else if (cb <= top || ct <= top && cr <= left)
						{
							i = 0;
							continue;
						}
						else
						{
						}
					}
					else
					{
						if (cb <= top)
							continue;
						else if (ct >= bot || cb >= bot && cl >= right)
							break;
						else
						{
						}
					}

					if (cl >= right || cr <= left)
						continue;

					var includesStart = (cl <= sx && cr > sx);
					var includesEnd = (cl <= ex + 1 && cr >= ex);

					var x1 = includesStart ? sx : l2r ? cl : cr - 1;
					var x2 = includesEnd ? ex : l2r ? cr : cl - 1;

					this.DrawHLine(x1, sy, x2);

					if (includesEnd == true)
						regionLastUsed = i;

					pixelsRemaining -= l2r ? (x2 - x1) : (x1 - x2);
					if (pixelsRemaining <= 0)
					{
						break;
					}
				}
			}

			
			lineStart.X = lineEnd.X , lineStart.Y = lineEnd.Y ; 
		}
		else if (arguments.length == 3)
		{
			if (this.FrameBuffer == null)
				return null;

			if (x2 < x1) {
				var temp = x1;
				x1 = x2 + 1;
				x2 = temp + 1;
			}

			var lineSkip = frameBufferlineskip;
			var width = frameBufferwidth;

			var startPixel = y * lineSkip + x1;
			var endPixel = y * lineSkip + x2;
			this.FrameBuffer.DrawLineInternal(startPixel, endPixel, 1);
			this.FrameBuffer.NewPixels(x1, y, x2 - x1, 1);
		}
	};

	/* Accepts one argument (dy) as its overloaded form */
	this.DrawVLine = function drawVLine(x, y1, y2)
	{
		if (arguments.length == 1)
		{
			var dy = arguments[0];
        	lineEnd.X = lineStart.X , lineEnd.Y = lineStart.Y ;
			
			lineEnd.Translate(0, dy);

			if (regionBufferSize == 0)
			{
				this.DrawVLine(lineStart.X, lineStart.Y, lineEnd.Y);
			}
			else
			{
				var sx = lineStart.X;
				var sy = lineStart.Y;
				var ey = lineEnd.Y;

				var t2b = (dy > 0);

				var left  = sx;
				var top = t2b ? sy : ey + 1;
				var right = sx + 1;
				var bot = t2b ? ey : sy + 1;
				var pixelsRemaining = t2b ? dy : -dy;
				var regionDivide = regionLastUsed;

				for (var i=regionDivide; i<regionBufferSize; i = ((i==0)?(regionDivide+1):(i <= regionDivide)?(i-1):(i+1)))
				{
					var clip = regionBuffer[i];
					var cl = clip.X;
					var cr = cl + clip.Width;
					var ct = clip.Y;
					var cb = ct + clip.Height;

					if (i <= regionDivide)
					{
						if (ct >= bot)
						{
							continue;
						}
						else if (cb <= top || ct <= top && cr <= left)
						{
							i = 0;
							continue;
						}
						else
						{
						}
					}
					else
					{
						if (cb <= top)
							continue;
						else if (ct >= bot || cb >= bot && cl >= right)
							break;
					}

					if (cl >= right || cr <= left)
						continue;

					var includesStart = (ct <= sy     && cb > sy);
					var includesEnd   = (ct <= ey + 1 && cb >= ey);

					var y1 = includesStart ? sy : t2b ? ct : cb - 1;
					var y2 = includesEnd   ? ey : t2b ? cb : ct - 1;

					this.DrawVLine(sx, y1, y2);

					if (includesEnd == true)
						regionLastUsed = i;

					pixelsRemaining -= t2b ? (y2 - y1) : (y1 - y2);
					if (pixelsRemaining <= 0)
					{
						break;
					}
				}
			}
			
			lineStart.X = lineEnd.X , lineStart.Y = lineEnd.Y ; 

		}

		else if (arguments.length == 3)
		{
			if (this.FrameBuffer == null) return null;

			if (y2 < y1)
			{
				var temp = y1;
				y1 = y2 + 1;
				y2 = temp + 1;
			}

			var lineSkip = frameBufferlineskip;
			var width = frameBufferwidth;
			var startPixel = y1 * lineSkip + x;
			var endPixel   = y2 * lineSkip + x;
			this.FrameBuffer.DrawLineInternal(startPixel, endPixel, lineSkip);
			this.FrameBuffer.NewPixels(x, y1, 1, y2 - y1);
		}
	};

	/* Accepts two argument (dx, dy) as its overloaded form */
	this.DrawDLine = function drawDLine(x1, y1, x2, y2)
	{
		if (arguments.length == 2)
		{
			var dx = arguments[0];
			var dy = arguments[1];
			lineEnd.X = lineStart.X , lineEnd.Y = lineStart.Y ;
			lineEnd.Translate(dx, dy);
			if (regionBufferSize == 0)
				this.DrawDLine(lineStart.X, lineStart.Y, lineEnd.X, lineEnd.Y);
			else if (dx*dy < 0)
				this.DrawSWNEline(dx, dy);
			else
				this.DrawNWSEline(dx, dy);
			lineStart.X = lineEnd.X , lineStart.Y = lineEnd.Y ;
		}

		else if (arguments.length == 4)
		{
			if (this.FrameBuffer == null) return null;

			if (y2 < y1)
			{
				var temp = y1;
				y1 = y2 + 1;
				y2 = temp + 1;

				temp = x1;
				if (x2 < x1)
				{
					x1 = x2 + 1;
					x2 = temp + 1;
				}
				else
				{
					x1 = x2 - 1;
					x2 = temp - 1;
				}

			}

			var lineSkip = frameBufferlineskip;
			var width = frameBufferwidth;

			var first = lineSkip * y1 + x1;
			var last  = lineSkip * y2 + x2;
			var delta = lineSkip + ((x1 < x2) ? 1 : -1);

			this.FrameBuffer.DrawLineInternal(first, last, delta);

			if (x1 < x2)
				this.FrameBuffer.NewPixels(x1, y1, x2 - x1, y2 - y1);
			else
				this.FrameBuffer.NewPixels(x2 + 1, y1, x1 - x2, y2 - y1);
		}
	};

	this.DrawSWNEline = function drawSWNEline(dx, dy)
	{
		var ex = lineEnd.X;
		var ey = lineEnd.Y;
		var sx = lineStart.X;
		var sy = lineStart.Y;

		var l2r = (ex > sx);

		var left  = l2r ? sx : ex + 1;
		var top   = l2r ? ey + 1 : sy;
		var right = l2r ? ex : sx + 1;
		var bot   = l2r ? sy + 1 : ey;

		var pixelsRemaining = right - left;

		var regionDivide = regionLastUsed;

		for (var i=regionDivide; i<regionBufferSize; i=((i==0)?(regionDivide+1):(i<=regionDivide)?(i-1):(i+1)))
		{
			var clip = regionBuffer[i];
			var cl = clip.X;
			var cr = cl + clip.Width;
			var ct = clip.Y;
			var cb = ct + clip.Height;

			if (i <= regionDivide)
			{
				if (ct >= bot)
				{
					continue;
				}
				else if (cb <= top || ct <= top && cr <= left)
				{
					i = 0;
					continue;
				}
				else
				{
				}
			}
			else
			{
				if (cb <= top)
					continue;
				else if (ct >= bot || cb >= bot && cl >= right)
					break;
			}

			if (cl >= right || cr <= left)
				continue;

			if (cl + ct > sx + sy || cr + cb <= sx + sy)
				continue;

			var includesStart = clip.Contains(sx, sy);
			var includesEnd   = clip.Contains(ex, ey);

			var x1 = 0, x2 = 0, y1 = 0, y2 = 0;
			if (includesStart==true)
			{
				x1 = sx;
				y1 = sy;
			}
			else if (l2r)
			{
				if ((cl + cb) <= (sx + sy))
				{
					y1 = cb - 1;
					x1 = sx + (sy - y1);
				}
				else
				{
					x1 = cl;
					y1 = sy + (sx - x1);
				}
			}
			else
			{
				if ((cr + ct) > (sx + sy))
				{
					y1 = ct;
					x1 = sx + (sy - y1);
				}
				else
				{
					x1 = cr - 1;
					y1 = sy + (sx - x1);
				}
			}
			if (includesEnd == true)
			{
				x2 = ex;
				y2 = ey;
			}
			else if (l2r)
			{
				if (cr + ct > ex + ey)
				{
					y2 = ct - 1;
					x2 = ex + (ey - y2);
				}
				else
				{
					x2 = cr;
					y2 = ey + (ex - x2);
				}
			}
			else
			{
				if (cl + cb <= ex + ey)
				{
					y2 = cb;
					x2 = ex + (ey - y2);
				}
				else
				{
					x2 = cl - 1;
					y2 = ey + (ex - x2);
				}
			}

			this.DrawDLine(x1, y1, x2, y2);

			if (includesEnd==true)
				regionLastUsed = i;

			pixelsRemaining -= l2r ? (x2 - x1) : (x1 - x2);
			if (pixelsRemaining <= 0)
			{
				break;
			}
		}
	};

	this.DrawNWSEline = function drawNWSEline(dx, dy)
	{
		var ex = lineEnd.X;
		var ey = lineEnd.Y;
		var sx = lineStart.X;
		var sy = lineStart.Y;
		var l2r = (ex > sx);
		var left  = l2r ? sx : ex + 1;
		var top   = l2r ? sy : ey + 1;
		var right = l2r ? ex : sx + 1;
		var bot   = l2r ? ey : sy + 1;
		var pixelsRemaining = right - left;

		var regionDivide = regionLastUsed;

		for (var i=regionDivide; i<regionBufferSize; i=((i==0)?regionDivide+1:(i<=regionDivide)?i-1:i+1))
		{
			var clip = regionBuffer[i];
			var cl = clip.X;
			var cr = cl + clip.Width;
			var ct = clip.Y;
			var cb = ct + clip.Height;

			if (i <= regionDivide)
			{
				if (ct >= bot)
				{
					continue;
				}
				else if (cb <= top || ct <= top && cr <= left)
				{
					i = 0;
					continue;
				}
			}
			else
			{
				if (cb <= top)
					continue;
				else if (ct >= bot || cb >= bot && cl >= right)
					break;
			}

			if (cl >= right || cr <= left)
				continue;

			if (cr - ct <= sx - sy || cl - cb >= sx - sy)
				continue;

			var includesStart = clip.Contains(sx, sy);
			var includesEnd   = clip.Contains(ex, ey);

			var x1, x2, y1, y2;
			if (includesStart==true)
			{
				x1 = sx;
				y1 = sy;
			}
			else if (l2r)
			{
				if (cl - ct < sx - sy)
				{
					y1 = ct;
					x1 = sx + (y1 - sy);
				}
				else
				{
					x1 = cl;
					y1 = sy + (x1 - sx);
				}
			}
			else
			{
				if (cr - cb < sx - sy)
				{
					x1 = cr - 1;
					y1 = sy + (x1 - sx);
				}
				else
				{
					y1 = cb - 1;
					x1 = sx + (y1 - sy);
				}
			}
			if (includesEnd==true)
			{
				x2 = ex;
				y2 = ey;
			}
			else if (l2r)
			{
				if (cr - cb < ex - ey)
				{
					x2 = cr;
					y2 = ey + (x2 - ex);
				}
				else
				{
					y2 = cb;
					x2 = ex + (y2 - ey);
				}
			}
			else
			{
				if (cl - ct < ex - ey)
				{
					y2 = ct - 1;
					x2 = ex + (y2 - ey);
				}
				else
				{
					x2 = cl - 1;
					y2 = ey + (x2 - ex);
				}
			}

			this.DrawDLine(x1, y1, x2, y2);

			if (includesEnd==true)
				regionLastUsed = i;

			pixelsRemaining -= l2r ? (x2 - x1) : (x1 - x2);
			if (pixelsRemaining <= 0)
			{
				break;
			}
		}
	};

	this.SetClipRegionSize = function setClipRegionSize(size)
	{
		if (size == 0 && isOffScreen && this.FrameBuffer != null)
		{
			size = 1;
			regionBuffer[0].SetBounds(0, 0, frameBufferwidth, frameBufferheight);
		}

		regionBufferSize = size;

		if (size <= regionLastUsed)
			regionLastUsed = 0;

		if (regionBuffer.length < regionBufferSize)
		{
			for (var i = regionBuffer.length; i < regionBufferSize; ++i)
				regionBuffer[i] = new Rectangle(0,0,0,0);
		}
	};

    this.GetClipRegionArea = function getClipRegionArea(areaNumber)
	{
		return regionBuffer[areaNumber];
   };

	this.ClipRegionsSatisfyAssumptions = function clipRegionsSatisfyAssumptions()
	{
		var x = 0, y = 0, b = 0;
		for (var i=0; i<regionBufferSize; ++i)
		{
			var clip = regionBuffer[i];
			if (clip.Y >= b)
			{
				y = b;
				x = 0;
			}
			if (clip.X < x) return false;
			x = clip.X + clip.Width;
			if (clip.Y < y) return false;
			b = b > (clip.Y + clip.Height)?b:(clip.Y + clip.Height);
		}
		return true;
	};

	this.MoveLineStartTo = function moveLineStartTo(p)
	{
		lineStart.X = p.X , lineStart.Y = p.Y;
	};

	this.MoveLineStartBy = function moveLineStartBy(dx, dy)
	{
		lineStart.Translate(dx, dy);
	};

	this.BlockFillUnclipped = function blockFillUnclipped(block)
	{
		if (this.FrameBuffer == null) return null;
		var frameBuff = this.FrameBuffer;
		frameBuff.Fill(block.X, block.Y, block.Width, block.Height);
	};

	this.BlockFillClipped = function blockFillClipped(block)
	{
		if (this.FrameBuffer == null) return;

		if (regionBufferSize == 0)
		{
			this.BlockFillUnclipped(block);
		}
		else
		{
			var left  = block.X;
			var top   = block.Y;
			var right = left + block.Width;
			var bot   = top + block.Height;
			var regionDivide = regionLastUsed;
			for (var i=regionDivide; i<regionBufferSize; i=((i==0)?regionDivide+1:(i<=regionDivide)?i-1:i+1))
			{
				var clip = regionBuffer[i];
				var cl = clip.X;
				var cr = cl + clip.Width;
				var ct = clip.Y;
				var cb = ct + clip.Height;

				if (i <= regionDivide)
				{
					if (ct >= bot)
					{
						continue;
					}
					else if (cb <= top || ct <= top && cr <= left)
					{
						i = 0;
						continue;
					}
					else
					{
					}
				}
				else
				{
					if (cb <= top)
						continue;
					else if (ct >= bot || cb >= bot && cl >= right)
						break;
					else
					{
					}
				}

				if (cl >= right || cr <= left)
					continue;

				clippedBlock = block.Intersection(clip);

				if (clippedBlock != null) {
				this.BlockFillUnclipped(clippedBlock);
				}

				if (clippedBlock.Equals(block))
				{
					regionLastUsed = i;
					break;
				}
			}
		}
	};

	 function rop3Pixels(rop3, x, y, w, h, sx, sy, bitmapSrc)
	{
		if (arguments.length == 8) {
			this.FrameBuffer.Rop3Pixels(rop3, x, y, w, h, sx, sy, bitmapSrc);
		}
		else if (arguments.length == 5) {
			this.FrameBuffer.Rop3Pixels(rop3, x, y, w, h);
		}
		else if (arguments.length == 7) {
			this.FrameBuffer.Rop3Pixels(rop3, x, y, w, h, sx, sy);
		}
		
	}

	this.CopyPixels = function copyPixels(x, y, w, h, sx, sy)
	{
		if (this.FrameBuffer == null) return null;
		this.FrameBuffer.CopyPixels(x, y, w, h, sx, sy);
	};

	this.Close = function close()
	{
		if (this.FrameBuffer != null)
		{
			this.FrameBuffer.Close();
			this.FrameBuffer = null;
		}
	};

	this.Flush = function flush()
	{
		if (this.FrameBuffer != null)
		{
			this.FrameBuffer.Flush();
		}
	};

	function glyphBltTransparent( x,  y,  w,  h, srcByte,  offset, clipRect)
	{
		if (arguments.length == 6)
			this.FrameBuffer.GlyphBltTransparent(x, y, w, h, srcByte, offset);
		else if (arguments.length == 7)
			this.FrameBuffer.GlyphBltTransparent(x, y, w, h, srcByte, offset, clipRect);
		
    }

	 function bitbltTrick(destination, image, clipping)
	{
		if (arguments.length == 2)
		{
			this.Rop3Pixels(GraphicsContext.ROP3_SRC, destination.X, destination.Y, image.Width, image.Height, 0, 0, image);
			this.FrameBuffer.NewPixels(destination.X, destination.Y, image.Width, image.Height);
		}
		else if (arguments.length == 3)
		{
			trickClip.SetBounds(0, 0, image.Width, image.Height);
			trickClip = clipping.Intersection(trickClip);
			var trueClip = (trickClip!=null) ? trickClip : clipping;

			this.Rop3Pixels(GraphicsContext.ROP3_SRC, destination.X, destination.Y, trueClip.Width, trueClip.Height, trueClip.X, trueClip.Y, image);
			this.FrameBuffer.NewPixels(destination.X, destination.Y, trueClip.Width, trueClip.Height);
		}

		
	}

	this.BitBlt = function bitBlt(rop3, area, destination, image)
	{
		if (this.FrameBuffer == null) return null;
		if (arguments.length == 4)
		{
			var left = destination.X;
			var top  = destination.Y;
			var w    = area.Width;
			var h    = area.Height;

			
			if (regionBufferSize != 0)
			{
				var ix = left - area.X;
				var iy = top  - area.Y;

				bitBltArea.SetBounds(left, top, w, h);

				var right = left + w;
				var bot   = top + h;

				var regionDivide = regionLastUsed;

				for (var i=regionDivide; i<regionBufferSize; i=((i==0)?regionDivide+1:(i<=regionDivide)?i-1:i+1))
				{
					var clip = regionBuffer[i];
					var cl = clip.X;
					var cr = cl + clip.Width;
					var ct = clip.Y;
					var cb = ct + clip.Height;

					if (i <= regionDivide)
					{
						if (ct >= bot)
						{
							continue;
						}
						else if (cb <= top || ct <= top && cr <= left)
						{
							i = 0;
							continue;
						}
						else
						{
						}
					}
					else
					{
						if (cb <= top)
							continue;
						else if (ct >= bot || cb >= bot && cl >= right)
							break;
					}

					if (cl >= right || cr <= left)
						continue;

					bitBltClip = bitBltArea.Intersection(clip);

					if (bitBltClip != null) {
					var isLast = bitBltClip.Equals(bitBltArea);
					bitBltDest.X = bitBltClip.X ,bitBltDest.Y = bitBltClip.Y ;
					bitBltClip.Translate(-ix, -iy);
					if (image != null)
						this.Rop3Pixels(rop3, bitBltDest.X, bitBltDest.Y, bitBltClip.Width, bitBltClip.Height, bitBltClip.X, bitBltClip.Y, image);
					else
						this.Rop3Pixels(rop3, bitBltDest.X, bitBltDest.Y, bitBltClip.Width, bitBltClip.Height, bitBltClip.X, bitBltClip.Y);
					
						if (isLast == true) {
						regionLastUsed = i;
						break;
					}
				}
			}
			}
			else  
			{
				if (image==null)
					this.Rop3Pixels(rop3, destination.X, destination.Y, area.Width, area.Height, area.X, area.Y);
				else
					this.Rop3Pixels(rop3, destination.X, destination.Y, area.Width, area.Height, area.X, area.Y, image);
			}
			this.FrameBuffer.NewPixels(left, top, w, h);
		}
		else if (arguments.length == 2)
		{
			if (regionBufferSize == 0)
			{
				this.Rop3Pixels(rop3, area.X, area.Y, area.Width, area.Height);
			}
			else
			{
				var left  = area.X;
				var top   = area.Y;
				var w     = area.Width;
				var h     = area.Height;
				var right = left + w;
				var bot   = top + h;

				var regionDivide = regionLastUsed;

				for (var i=regionDivide; i<regionBufferSize; i=((i==0)?regionDivide+1:(i<=regionDivide)?i-1:i+1))
				{
					var clip = regionBuffer[i];
					var cl = clip.X;
					var cr = cl + clip.Width;
					var ct = clip.Y;
					var cb = ct + clip.Height;

					if (i <= regionDivide)
					{
						if (ct >= bot)
						{
							continue;
						}
						else if (cb <= top || ct <= top && cr <= left)
						{
							i = 0;
							continue;
						}
					}
					else
					{
						if (cb <= top)
							continue;
						else if (ct >= bot || cb >= bot && cl >= right)
							break;
					}

					if (cl >= right || cr <= left)
						continue;

					bitBltClip = area.Intersection(clip);

					if (bitBltClip != null) {
					this.Rop3Pixels(rop3, bitBltClip.X, bitBltClip.Y, bitBltClip.Width, bitBltClip.Height);

						if (bitBltClip.Equals(area)) {
						regionLastUsed = i;
						break;
					}
				}
			}
			}
			this.FrameBuffer.NewPixels(area.X, area.Y, area.Width, area.Height);
		}

		else if (arguments.length == 3)
		{
			if (regionBufferSize == 0)
			{
				this.Rop3Pixels(rop3, destination.X, destination.Y, area.Width, area.Height, area.X, area.Y);
			}
			else
			{
				bitBltArea.SetBounds(destination.X, destination.Y, area.Width, area.Height);

				var drawn = [];
				for (var i=0; i<regionBufferSize; ++i)
					drawn[i] = false;

				for ( i=0; i<regionBufferSize; ++i)
				{
					drawn[i] = !bitBltArea.Intersects(regionBuffer[i]);
				}

				regionLastUsed = (area.Y > destination.Y) ? 0 : regionBufferSize - 1;

				var dx = destination.X - area.X;
				var dy = destination.Y - area.Y;

				var r = null;
				while((r = NextArea(dx, dy, drawn)) != null)
				{
					bitBltClip = bitBltArea.Intersection(r);
					if (bitBltClip != null)
					{
						this.Rop3Pixels(rop3, bitBltClip.X, bitBltClip.Y, bitBltClip.Width,  bitBltClip.Height, bitBltClip.X - dx, bitBltClip.Y - dy);
					}
				}
			}
			this.FrameBuffer.NewPixels(destination.X, destination.Y, area.Width, area.Height);
		}

	
	};

	 function textBitblt(textArea, textData)
	{
		
		var left  = textArea.X;
		var top   = textArea.Y;
		var w     = textArea.Width;
		var h     = textArea.Height;

		if (regionBufferSize == 0)
		{
			this.GlyphBltTransparent(left, top, w, h, textData, 0);
		}
		else
		{
			var right = left + w;
			var bot   = top + h;

			var regionDivide = regionLastUsed;

			for (var i=regionDivide; i<regionBufferSize; i=((i==0)?regionDivide+1:(i<=regionDivide)?i-1:i+1))
			{
				var clip = regionBuffer[i];
				var cl = clip.X;
				var cr = cl + clip.Width;
				var ct = clip.Y;
				var cb = ct + clip.Height;

				if (i <= regionDivide)
				{
					if (ct >= bot)
					{
						continue;
					}
					else if (cb <= top || ct <= top && cr <= left)
					{
						i = 0;
						continue;
					}
					else
					{
					}
				}
				else
				{
					if (cb <= top)
						continue;
					else if (ct >= bot || cb >= bot && cl >= right)
						break;
					else
					{
					}
				}

				if (cl >= right || cr <= left)
					continue;

				if (textArea.Contains(right, bot))
				{
					regionLastUsed = i;
					if (textArea.Contains(left, top))
					{
						this.GlyphBltTransparent(left, top, w, h, textData, 0);
						break;
					}
				}
				this.GlyphBltTransparent(left, top, w, h, textData, 0, clip);
			}
		}

		this.FrameBuffer.NewPixels(left, top, w, h);
	}

	this.GetPixels = function getPixels(r)
	{
		if (this.FrameBuffer == null) return null;
		var pixels = this.FrameBuffer.GetPixels(r);

		if (pixels instanceof IndexBitmap)
		{
			pixels.SetPalette(null, true);
		}
		return pixels;
	};

	this.PaletteChanged = function paletteChanged()
	{
	};

	this.MakeFrameBuffer = function makeFrameBuffer(width, height , rendForm)
	{
		var isDeep = (this.colorMode > ColorConstants.COLOR_PALETTED_8BIT);

		if (this.FrameBuffer == null || width != frameBufferwidth || height != frameBufferheight )
		{
			if (this.FrameBuffer != null)
			{
				this.FrameBuffer.Close();
				this.FrameBuffer = null;
			}

			if (isDeep == true)
			{
				this.FrameBuffer = new DirectFrameBuffer(width, height, this, rendForm);
				this.TextBitblt = textBitblt;
				this.BitbltTrick = bitbltTrick;
				this.GlyphBltTransparent = glyphBltTransparent;
				this.Rop3Pixels = rop3Pixels ;	
			}
			else
			{
				this.TextBitblt = directframebuffer_NULL;
				this.BitbltTrick = directframebuffer_NULL;
				this.GlyphBltTransparent = directframebuffer_NULL;
				this.Rop3Pixels = directframebuffer_NULL ;
				throw GCError.BUFFER_NOT_SUPPORTED;
			}
		}
		this.Size.SetSize(width, height);
		this.SetClipRegionSize(0);
	};

    this.getCurrentColorModel = function( ) {
        if ( this.FrameBuffer == null) return null;
        return this.FrameBuffer.GetTranslationColorModel();
     };
	this.GetPatternCache = function getPatternCache(width)
	{
		if (patternCache != null)
		{
			return patternCache;
		}
		else if (brush==null)
		{
			this.PatternCacheLength = width;
			patternCache = GraphicsContext.GetSolidLine(currentSolidBrushColorIndex, width, true );
			return patternCache;
		}
		else if (!(brush instanceof IndexBitmap))
		{
			brush = null;       // Use the solid color instead.
			return this.GetPatternCache(width);
		}
		else
		{
			var indexBrush = brush;
			var cache = brushCache;
			var brushHeight   = brush.Height;
			var brushWidth    = brush.Width;
			var brushLineSkip = brush.LineSkip;
			var brushLength   = brushHeight * brushLineSkip;

			if (cache == null || cache.length < width*brushHeight)
			{
				for (var i=0; i<(width*brushHeight); ++i)
					cache[i] = 0;
				brushCache = cache;
			}

			var offx = brushOffset.X;
			var offy = brushOffset.Y;
			var brushPixels = indexBrush.Pixels;

			var brushPalette = indexBrush.GetIndexPalette();
			if (brushPalette != null)
			{
				var pixels = [];

				for (var i=0; i<brushLength; ++i)
					pixels[i] = brushPalette[brushPixels[i]&0xFF];
				brushPixels = pixels;
			}

			for (var i=0; i<brushHeight; ++i)
			{
				var bRow = ((i + offy) % brushHeight) * brushLineSkip;
				var cRow = i * width;

				if (brushWidth <= width)
				{
					if (offx == 0)
					{
						Utility.CopyArray(brushPixels, bRow,  cache, cRow,  brushWidth);
					}
					else
					{
						var w1 = offx, w2 = brushWidth - w1;
						Utility.CopyArray(brushPixels, bRow + w1, cache, cRow, w2);
						Utility.CopyArray(brushPixels, bRow, cache, cRow + w2, w1);
					}

					for (var j=brushWidth; j<width; j *= 2)
						Utility.CopyInSameArray(cache, cRow,  cache, cRow + j, j<(width-j)?j:width-j);
				}
				else
				{
					if (offx == 0)
					{
						Utility.CopyArray(brushPixels, bRow,  cache, cRow,  width);
					}
					else
					{
						var w1 = offx, w2 = brushWidth - w1;
						if (w2 >= width)
						{
							Utility.CopyArray(brushPixels, bRow + w1, cache, cRow, width);
						}
						else
						{
							Utility.CopyArray(brushPixels, bRow + w1, cache, cRow, w2);
							Utility.CopyArray(brushPixels, bRow, cache, cRow + w2, width - w2);
						}
					}
				}
			}

			this.PatternCacheLength = width*brushHeight;
			patternCache = cache;
			return cache;
		}
	};

	this.GetDeepPatternCache = function getDeepPatternCache(width)
	{
		if (deepPatternCache != null)
		{
			return deepPatternCache;
		}
		else if (brush==null)
		{
			this.PatternCacheLength = width;
			deepPatternCache = GraphicsContext.GetSolidLine(currentSolidBrushColor, width, false );
			return deepPatternCache;
		}
		else
		{
			var cache = deepBrushCache;
			var brushHeight = brush.Height;
			var brushWidth  = brush.LineSkip;

			if (cache == null || cache.length < width*brushHeight)
			{
				var cacheLength = width*brushHeight;
				cache = new Array(cacheLength);
				//for (var ind = 0; ind < cacheLength; ++ind)
				//{
				//	cache[ind] = 0;
				//}
				deepBrushCache = cache;
			}

			var offx = brushOffset.X;
			var offy = brushOffset.Y;


			switch(brush.tp)
			{
				case Bitmap.INDEXED:
				case Bitmap.INDEX_PALETTED:
				case Bitmap.RGB_PALETTED:
				{
					var indexBrush = brush;
					var brushPixels = indexBrush.Pixels;

					var brushPalette = indexBrush.GetPalette(true);
					if (brushPalette != null)
					{
						var pixels = [];
						var brushLength = brushHeight * brushWidth;
						for (var i=0; i<brushLength; ++i)
							pixels[i] = brushPalette[brushPixels[i]&0xFF];
						brushPixels = pixels;
					}

					var colors = this.FrameBuffer.GetTranslationColorModel();
					var brushColorPalette = indexBrush.GetColorPalette();

					for (var i=0; i<brushHeight; ++i)
					{
						var bRow = ((i + offy) % brushHeight) * brushWidth;
						var cRow = i * width;

						if (brushColorPalette != null)
						{
							var k = offx;
							for (var j=0; (j < brushWidth) && (j < width); ++j)
							{
								k %= brushWidth;
								cache[cRow + j] = brushColorPalette[brushPixels[bRow + k]&0xFF];
								++k;
							}
						}
						else
						{
							var k = offx;
							for (var j=0; (j < brushWidth) && (j < width); ++j)
							{
								k %= brushWidth;
								cache[cRow + j] = colors[brushPixels[bRow + k]].GetRGB();
								++k;
							}
						}

						for (var j=brushWidth; j<width; j *= 2)
							Utility.CopyInSameArray(cache, cRow,  cache, cRow + j,  j < (width-j)?j:width-j);
					}
					break;
				}

				case Bitmap.UNPALETTED:
				{
					var brushPixels = brush.Pixels;

					for (var i=0; i<brushHeight; ++i)
					{
						var bRow = ((i + offy) % brushHeight) * brushWidth;
						var cRow = i * width;

						var k = offx;
						for (var j=0; (j < brushWidth) && (j < width);  ++j)
						{
							k %= brushWidth;
							cache[cRow + j] = brushPixels[bRow + k];
							++k;
						}

						for (var j = brushWidth;  j < width;  j *= 2)
							Utility.CopyInSameArray(cache, cRow,  cache, cRow + j, j < (width-j)?j:width-j);
					}
					break;

				}

			}

			this.PatternCacheLength = width*brushHeight;
			deepPatternCache = cache;
			return cache;
		}
	};
}

GraphicsContext.ROP3_PEN = 0xF0;
GraphicsContext.ROP3_SRC = 0xCC;
GraphicsContext.PALETTE_TYPE_RGB = 0;
GraphicsContext.PALETTE_TYPE_INDEX = 1;
GraphicsContext.ColorCache = [];  /* Has to serve as a 2D array */
GraphicsContext.DeepColorCache = [];  /* Has to serve as a 2D array */
for (var i = 0; i < 256; ++i)
			GraphicsContext.DeepColorCache[i] = null;
GraphicsContext.GetSolidLine = function getSolidLine(color, width, isByteColorCode)
{
	if (isByteColorCode != true)
	{
		var index = color ^ (color >>> 5) ^ (color >>> 11) ^ (color >>> 15) ^ (color >>> 17);
		index &= 0xFF;
		var line = GraphicsContext.DeepColorCache[index];
		var i = 0;
		if( !line || line.length < width )
		{
				line = new Int32Array(width);
				for( var i = 0 ; i < width ;i++ )
				{
					line[i] = color ;
				}
				GraphicsContext.DeepColorCache[index] = line;	
		}
		else 
		{
			var len = line.length ;
			if( line[0] != color )
			{
				for( var i = 0 ; i < len ;i++)
				{
					line[i] = color ;
				}
			}
			
			
		}
	
	}
	else
	{
		var line = GraphicsContext.ColorCache[color & 0xFF];
		if( !line || line.length < width )
		{
				line = new Int32Array(width);
				for( var i = 0 ; i < width ;i++ )
				{
					line[i] = color ;
				}
				GraphicsContext.ColorCache[color & 0xFF] = line;
		}
		else 
		{
			var len = line.length ;
			if( line[0] != color )
			{
				for( var i = 0 ; i < len ;i++)
				{
					line[i] = color ;
				}
			}
			
			
		}
		
	}
		
		return line;
	
	
};

GraphicsContext.RopUsesBrush = function ropUsesBrush(rop)  { return (0 != (((rop>>>4)^rop) & 0x0F)); };
GraphicsContext.RopUsesSource = function ropUsesSource(rop) { return (0 != (((rop>>>2)^rop) & 0x33)); };
GraphicsContext.RopUsesDest = function ropUsesDest(rop)   { return (0 != (((rop>>>1)^rop) & 0x55)); };


