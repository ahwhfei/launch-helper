/* Generic Bitmap prototype */

function Bitmap()
{
}

Bitmap.UNPALETTED 			= 0;
Bitmap.RGB_PALETTED  		= 1;
Bitmap.INDEXED        		= 2;
Bitmap.INDEX_PALETTED 		= 3;
Bitmap.PALETTE_CTRL_FLAG 	= 1;
Bitmap.CLIP_CTRL_FLAG    	= 2;
Bitmap.OSS_CTRL_FLAG     	= 4;
Bitmap.BLACK_ROP  			= 0x00;
Bitmap.WHITE_ROP  			= 0xFF;
Bitmap.SRC_ROP    			= 0xCC;
Bitmap.SRC_ROP2   			= 0x0C;
Bitmap.PEN_ROP    			= 0xF0;
Bitmap.INVERT_ROP 			= 0x55;

Bitmap.Make = function make(twTwoReadStream, bitmapControl, width, height)
{
	var codec  = bitmapControl >>> 4;
	var format = bitmapControl & 0xF;
 	if (format >= RleDecode.GCS_RGB_16BIT)
	{
		var directBitmap ;
		switch(codec)
		{
			case RleDecode.BMP_CODEC_ID_NULL:
				directBitmap= new DirectBitmap(width, height , true );
				RleDecode.expandNullBitmapInt(format, width, height, twTwoReadStream, directBitmap.Pixels);
				break;
			case RleDecode.BMP_CODEC_ID_2DRLE:
				directBitmap = new DirectBitmap(width, height , true );
				// RleDecompress2DInt
				RleDecode.RleDecompressCommon(format, width, height, twTwoReadStream, directBitmap.Pixels, false, false);
				break;
			case RleDecode.BMP_CODEC_ID_2DRLE_V2:
				directBitmap = new DirectBitmap(width, height , true );
				// RleDecompressPhotographicInt 
				RleDecode.RleDecompressCommon(format, width, height, twTwoReadStream, directBitmap.Pixels, true, false);
				break;
			case RleDecode.BMP_CODEC_ID_JPEG_LOSSY:
				directBitmap = new DirectBitmap(width, height , false  );
				directBitmap.Pixels = RleDecode.decompressJpeg(format, twTwoReadStream , width , height );
				break;
            
            // TODO: move decoder to common factory and support both sync and async bitmap retrieval
            case RleDecode.BMP_CODEC_ID_H264:
                directBitmap = new DirectBitmap(width, height , false  );
                break;
                
			default:
				throw ProtocolError.INVALID_CODEC_FOR_TW_PROTOCOL;
		}
		return directBitmap;
	}
	else
	{
		var indexBitmap = new IndexBitmap(width, height , true );
		switch(codec)
		{
			case RleDecode.BMP_CODEC_ID_NULL:
				RleDecode.expandNullBitmapByte(format, width, height, twTwoReadStream, indexBitmap.Pixels);
				break;
			case RleDecode.BMP_CODEC_ID_2DRLE:
				// RleDecompress2DByte 
				RleDecode.RleDecompressCommon(format, width, height, twTwoReadStream, indexBitmap.Pixels, false, true);
				break;
			case RleDecode.BMP_CODEC_ID_2DRLE_V2:
                RleDecode.RleDecompressCommon(format, width, height, twTwoReadStream, indexBitmap.Pixels, true, true);
                break;
			case RleDecode.BMP_CODEC_ID_JPEG_LOSSY:
				// The jpeg codec is not defined for indexed images.
            	// *FALLTHROUGH*
			default:
				throw ProtocolError.INVALID_CODEC_FOR_TW_PROTOCOL;
		}

		return indexBitmap;
	}
};


/* DirectBitmap prototype: for 15 & 24 bit bitmaps */

function DirectBitmap(width, height , allocate_memory )
{
	this.Width = width;
	this.Height = height;
	this.LineSkip = width;
	if( allocate_memory )
	{
		this.Pixels =  new Int32Array(height * width);
	}
	else
	{
		this.Pixels = null ;
	
	}
	

}

DirectBitmap.prototype.tp          = Bitmap.UNPALETTED;
/* IndexBitmap prototype: for 8 bit bitmaps */

function IndexBitmap(width, height , allocate_memory )
{
	this.Width = width;
	this.Height = height;
	this.LineSkip = width;
	this.Pixels = null ;
	if( allocate_memory )
	{
		this.Pixels =  new Uint8Array(height * width);
	}
}

 

IndexBitmap.prototype.Palette 		   = null;
IndexBitmap.prototype.tp 			   = Bitmap.INDEXED;
IndexBitmap.prototype.AlphaPixel 	   = -1;
IndexBitmap.prototype.GetIndexPalette  = function(){ return (this.tp==Bitmap.INDEX_PALETTED)?this.Palette:null;};
IndexBitmap.prototype.GetColorPalette  = function(){ return (this.tp==Bitmap.RGB_PALETTED)?this.Palette:null;    };
IndexBitmap.prototype.SetPalette       = function(palette, isIndexed)
{
    this.Palette = palette;

    if (isIndexed == false)
    {
        this.tp = palette == null ? Bitmap.INDEXED : Bitmap.RGB_PALETTED;
    }
    else
    {
        this.tp = palette == null ? Bitmap.INDEXED : Bitmap.INDEX_PALETTED;
    }
};

IndexBitmap.prototype.GetPalette = function(isIndexed)
{
    if (isIndexed == true)
    {
        return ((this.tp == Bitmap.INDEX_PALETTED) ? this.Palette : null);
    }
    else
    {
        return ((this.tp == Bitmap.RGB_PALETTED) ? this.Palette : null);
    }
};

