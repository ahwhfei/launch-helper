function GridPainter(frameBuffer, colorModel, width, height , rendForm, isDeep)
{
	var gWidth 				= width;
	var gHeight 			= height;
	var gLineSkip 			= width;
	var gBuffer 			= frameBuffer;
	var NROFGRIDROWS        = 32;
	var NROFGRIDCOLS        = 32;
	var gridDirty 			= false;
	var gColorModel 		= colorModel;
	var rf 					= rendForm;
    //double Bitwise NOT to floor
	var gridColSize 		= ~~((width  + NROFGRIDCOLS - 1) / NROFGRIDCOLS);
	var gridRowSize 		= ~~((height + NROFGRIDROWS - 1) / NROFGRIDROWS);
	var bFirst              = true;
	var coordinateArray		= new Uint32Array( 32* 32 * 4 + 1);

	var dirtyRows  = new Int32Array(NROFGRIDROWS);


	var MarkNew = function markNew(start, end, mask)
	{
		var dRows = dirtyRows;
		if (!gridDirty || mask == 0xffffffff)
		{
			for (var row = start;  row <= end;  ++row)
			{
				dRows[row] = mask;
			}
		}
		else
		{
			for (var row = start;  row <= end;  ++row)
				dRows[row] |= mask;
		}
		gridDirty = true;
		// Mark Dirty..
		rf.dirty = true;
	};

	

	this.PaletteChanged = function paletteChanged(cm)
	{
		gColorModel = cm;
		MarkNew(0, NROFGRIDROWS - 1, 0xffffffff);
	};
	this.NewPixels = function newPixels(x, y, width, height)
	{
		if (x < 0)                x = 0;
		if (y < 0)                y = 0;
		if (x + width  > gWidth)  width  = gWidth  - x;
		if (y + height > gHeight) height = gHeight - y;

        //double bitwise NOT to floor
		var startCol = ~~(x / gridColSize);
		var endCol   = ~~((x + width - 1) / gridColSize);

		MarkNew(~~(y / gridRowSize), ~~((y + height - 1) / gridRowSize), ((2 << endCol) - 1) ^ ((1 << startCol) - 1));
	};

	this.Close = function close()
	{
	};

	this.Flush = function flush()
	{
	    // Mark Dirty..
		rf.dirty = true;
	};

	this.FlushRectangle = function flushRectangle(callback)
	{
		// Return quickly if we have no work to do
        if (!gridDirty)
		{
		      return false ;
		}
		var coodinateOffset = 1 ;
		var noRect = 0;
		for (var row = 0; row < NROFGRIDROWS; ++row)
		{
			var colMask = dirtyRows[row];
			dirtyRows[row] = 0;
			var col = 0;
			while (colMask != 0)
			{
				while ((colMask & 0xF) == 0)
				{
					colMask >>>= 4;
					col += 4;
				}
				while ((colMask & 0x1) == 0)
				{
					colMask >>>= 1;
					++col;
				}
				var startCol = col;
				++col;
				colMask >>>= 1;
				while ((colMask & 0xF) == 0xF)
				{
					colMask >>>= 4;
					col += 4;
				}
				while ((colMask & 0x1) == 1)
				{
					colMask >>>= 1;
					++col;
				}

				var endCol = col;
				var rectMask = (1 << endCol) - 1;

				if (endCol == 32) {
                    rectMask = -1;
                }
				rectMask ^= ((1 << startCol) - 1);

				var endRow = row + 1;

				while ((endRow < NROFGRIDROWS) && ((dirtyRows[endRow] & rectMask) == rectMask))
				{
					dirtyRows[endRow] ^= rectMask;
					if (dirtyRows[endRow]<0) dirtyRows[endRow]+= 0xffffffff + 1;
					++endRow;
				}

				var left   = startCol * gridColSize;
				var right  = endCol   * gridColSize;
				var top    = row      * gridRowSize;
				var bottom = endRow   * gridRowSize;

				if (right  > gWidth)  right  = gWidth;
				if (bottom > gHeight) bottom = gHeight;
				if (left < 0) left = 0;
				if (right < 0) right = 0;

				var width  = right  - left;
				var height = bottom - top;
				if (width > 0 && height > 0)
				{
					noRect++;
					coordinateArray[coodinateOffset++] = left ;
					coordinateArray[coodinateOffset++] = top ;
					coordinateArray[coodinateOffset++] = width ;
					coordinateArray[coodinateOffset++] = height ;
				}
			}
		}
		coordinateArray[0] = noRect ;
		callback.renderRGBSurface(gBuffer.DirectBitmap.Pixels ,coordinateArray );
		gridDirty = false;
		return true ;
	};
}