function LineGraphics()
{
	var startPoint = new Point(0,0), segmentPoint = new Point(0,0), bezierControl1 = new Point(0,0), bezierControl2 = new Point(0,0);
	var bezierEnd  = new Point(0,0), ellipsePoint = new Point(0,0);

	var PATH_CONTROL_STROKE       				= 0x80;
	var PATH_CONTROL_FILL          				= 0x40;
	var PATH_CONTROL_PRECACHEDPATH 				= 0x20;
	var PATH_CONTROL_IMMEDIATE     				= 0x80;
	var PATH_CONTROL_COLORCHANGE 				= 0x10;
	var PATH_CONTROL_MIXCHANGE     				= 0x08;
	var PATH_CONTROL_TYPE_MASK     				= 0x07;
	var PATH_TYPE_STRIPS           				= 0x00;
	var PATH_TYPE_SEGMENTS         				= 0x01;
	var PATH_TYPE_BEZIERS         				= 0x02;
	var PATH_TYPE_ELLIPSE          				= 0x03;
	var PATH_FLAG_DRAW             				= 0x80;
	var PATH_FLAG_CONTINUATION     				= 0x40;
	var PATH_PIXEL_LENGTH_MASK     				= 0x3F;

	var NewLineColor = function newLineColor(graphicsContext, twTwoReadStream)
	{
		switch (graphicsContext.colorMode)
		{
			case ColorConstants.COLOR_PALETTED_1BIT:
			case ColorConstants.COLOR_PALETTED_4BIT:
			case ColorConstants.COLOR_PALETTED_8BIT:
			{
				var dummy =  twTwoReadStream.ReadByte();
				graphicsContext.SetLineColor(dummy, true);
			}
				break;
			case ColorConstants.COLOR_RGB_16BIT:
			{
				var dummy =  twTwoReadStream.ReadRGB16();
				graphicsContext.SetLineColor(dummy, false);
			}
				break;
			case ColorConstants.COLOR_RGB_24BIT:
			{
				var dummy =  twTwoReadStream.ReadRGB();
				graphicsContext.SetLineColor(dummy, false);
			}
				break;
		}
	};

	var DrawStripsInternal = function drawStripsInternal(c, input)
	{
		var angle = 0;

		var dummy = input.ReadUInt8();

		for (var segment = dummy + 1; segment > 0; --segment)
		{
			dummy = input.ReadUInt8();
			angle += dummy;
			angle &= 0x0F;

			dummy = input.ReadUInt8();

			for (var strip = dummy + 1; strip > 0; --strip)
			{
				var stripValue = input.ReadUInt8();
				var pixels     = (stripValue & PATH_PIXEL_LENGTH_MASK);

				if (pixels == 0)
					pixels = input.ReadVarUInt();


				if ((stripValue & PATH_FLAG_CONTINUATION) != 0)
				{
					switch (angle)
					{
						case 0:
						case 7:
						case 9:
						case 14:
							c.MoveLineStartBy(0, -1);
							break;
						case 1:
						case 6:
						case 8:
						case 15:
							c.MoveLineStartBy(0, 1);
							break;
						case 2:
						case 4:
						case 11:
						case 13:
							c.MoveLineStartBy(-1, 0);
							break;
						case 3:
						case 5:
						case 10:
						case 12:
							c.MoveLineStartBy(1, 0);
							break;
					}
				}

				var dx = 0, dy = 0;

				switch (angle)
				{
					case 0:
						dx = pixels;
						break;
					case 1:
					case 2:
						dx = pixels;
						dy = -pixels;
						break;
					case 3:
					case 4:
						dy = -pixels;
						break;
					case 5:
					case 6:
						dx = -pixels;
						dy = -pixels;
						break;
					case 7:
					case 8:
						dx = -pixels;
						break;
					case 9:
					case 10:
						dx = -pixels;
						dy = pixels;
						break;
					case 11:
					case 12:
						dy = pixels;
						break;
					case 13:
					case 14:
						dx = pixels;
						dy = pixels;
						break;
					case 15:
						dx = pixels;
						break;
				}

				if ((stripValue & PATH_FLAG_DRAW) != 0)
				{
					if (dy == 0)
					{
						c.DrawHLine(dx);
					}
					else if (dx == 0)
					{
						c.DrawVLine(dy);
					}
					else
					{
						c.DrawDLine(dx, dy);
					}
				}
				else
				{
					c.MoveLineStartBy(dx, dy);
				}
			}
		}
	};

	var DrawStrips = function drawStrips(c, input)
	{
		input.ReadByte();

		return DrawStripsInternal(c, input);
	};

	var DrawSegmentsInternal = function drawSegmentsInternal(c, input)
	{
		var dummy = input.ReadUInt16();
		for (var segment = dummy + 1; segment > 0; --segment)
		{
			var endDelta = new Point(0,0);
			input.ReadCoordinate(startPoint);
			input.ReadCoordinate(endDelta);
			endDelta.Translate(-startPoint.X, -startPoint.Y);
			c.MoveLineStartTo(startPoint);
			
			if (endDelta.X == 0) {
                // Vertical line
                c.DrawVLine(endDelta.Y);
            } else if (endDelta.Y == 0) {
                // Horizontal line
                c.DrawHLine(endDelta.Y);
            } else if (endDelta.X == endDelta.Y) {
                // Up-right diagonal  or  down-left diagonal
                c.DrawDLine(endDelta.Y, endDelta.Y);
            } else if (endDelta.X == -endDelta.Y) {
                // Down-right diagonal  or  up-left diagonal
                c.DrawDLine(endDelta.X, endDelta.Y);
            } else {
                // Other, imperfect line.
                DrawBresenhamLine(c, endDelta);
            }
		}
	};

	var DrawSegments = function drawSegments(c, input)
	{
		// Get cache object id byte:
		input.ReadByte();

		return DrawSegmentsInternal(c, input);
	};

	var DrawBeziers = function drawBeziers(graphicsContext, twTwoReadStream)
	{
		var bez =  twTwoReadStream.ReadUInt8();
		for (var bezier = bez + 1; bezier > 0; --bezier)
		{
			twTwoReadStream.ReadCoordinate(bezierControl1);
			twTwoReadStream.ReadCoordinate(bezierControl2);
			twTwoReadStream.ReadCoordinate(bezierEnd);
		}
	};

	this.CmdDrawPath = function cmdDrawPath(c, input, cache)
	{
		var controlByte = input.ReadUInt8();

		if ((controlByte & PATH_CONTROL_COLORCHANGE) != 0)
		{
			NewLineColor(c, input);
		}

		if ((controlByte & PATH_CONTROL_MIXCHANGE) != 0) {
			var dummy = input.ReadByte();
			c.SetLineRop((dummy & 0x0F));
		}

		input.ReadCoordinate(startPoint);

		c.MoveLineStartTo(startPoint);


		if ((controlByte & PATH_CONTROL_IMMEDIATE) == 0)
		{
			// Non-immediate mode - using cache.
			var dummy = input.ReadUInt16();
			var pathStream = cache.ReadObject(dummy);

			pathStream.ResetLastCoordinate(startPoint);

			switch (controlByte & PATH_CONTROL_TYPE_MASK)
			{
				case PATH_TYPE_STRIPS:
					dummy = DrawStrips(c, pathStream);
					break;
				case PATH_TYPE_SEGMENTS:
					dummy = DrawSegments(c, pathStream);
					break;
				case PATH_TYPE_BEZIERS:
					dummy = DrawBeziers(c, pathStream);
					break;
				case PATH_TYPE_ELLIPSE:
					dummy = pathStream.ReadCoordinate(ellipsePoint);
					break;
				default:
					break;
			}
		}
		else
		{
            // No caching - immediately following this object.
            switch (controlByte & PATH_CONTROL_TYPE_MASK)
			{
	            case PATH_TYPE_STRIPS:
	                dummy = DrawStripsInternal(c, input);
	                break;

	            case PATH_TYPE_SEGMENTS:
	                dummy = DrawSegmentsInternal(c, input);
	                break;

				case PATH_TYPE_BEZIERS:
					dummy = DrawBeziers(c, pathStream);
					break;

				case PATH_TYPE_ELLIPSE:
					dummy = pathStream.ReadCoordinate(ellipsePoint);
					break;

	            default:
	                break;
            }
        }
	};
}