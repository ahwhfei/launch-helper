var CheckCaretPosition = (function(){
    // Check caret position for client IME support
    // Fixing BUG0357280 by Qiang ZHUO
    
    // The caret drawing algorithm is application-dependent
    // Here's the heuristic way of caret detection.
    // It's not 100% reliable
    
    var CARET_MIN_WIDTH = 1;
    var CARET_MAX_WIDTH = 2;
    var CARET_MIN_HEIGHT = 3;
    
    function IsCaret(rectangle) {
        return rectangle.Width <= CARET_MAX_WIDTH
            && rectangle.Width >= CARET_MIN_WIDTH
            && rectangle.Height >= CARET_MIN_HEIGHT;
    }
    
    return function(rectangle, x, y) {
        if (window.UpdateCaretPosition) {
            // console.log('checking caret ' + rectangle.Width + ', ' + rectangle.Height);
            if (IsCaret(rectangle)) {
                if (arguments.length === 1) {
                    x = rectangle.X;
                    y = rectangle.Y;
                }
                // console.log('update caret postion ' + x + ', ' + y);
                window.UpdateCaretPosition(x, y, rectangle.Width, rectangle.Height);
            }   
        }
    };
}());

function BlockGraphics()
{
	var block = new Rectangle(0,0,0,0);

	this.CmdClippedSolidFill = function cmdClippedSolidFill(graphicsContext, twTwoReadStream)
	{
		twTwoReadStream.ReadRectangle(block);
		graphicsContext.UseSolidColor();
		graphicsContext.BlockFillClipped(block);
	};

	this.CmdSolidFill = function cmdSolidFill(graphicsContext, twTwoReadStream)
	{
		twTwoReadStream.ReadRectangle(block);
		graphicsContext.UseSolidColor();
		graphicsContext.BlockFillUnclipped(block);
	};

	this.CmdSolidFillNewColorNoClip = function(graphicsContext, twTwoReadStream)
	{
        this.NewSolidColor(graphicsContext, twTwoReadStream);
        this.CmdSolidFill(graphicsContext, twTwoReadStream);
        CheckCaretPosition(block);
	};
    
	this.NewSolidColor  = function newSolidColor(graphicsContext, twTwoReadStream)
	{
		switch (graphicsContext.colorMode)
		{
			case ColorConstants.COLOR_PALETTED_1BIT:
			case ColorConstants.COLOR_PALETTED_4BIT:
			case ColorConstants.COLOR_PALETTED_8BIT:
			{
				var dummy = twTwoReadStream.ReadByte();
				graphicsContext.SetSolidColor(dummy, true);
			}
				break;
			case ColorConstants.COLOR_RGB_16BIT:
			{
				var dummy = twTwoReadStream.ReadRGB16();
				graphicsContext.SetSolidColor(dummy, false);
			}
				break;
			case ColorConstants.COLOR_RGB_24BIT:
			{
				var dummy = twTwoReadStream.ReadRGB();
				graphicsContext.SetSolidColor(dummy, false);
			}
				break;
		}
	};
}
