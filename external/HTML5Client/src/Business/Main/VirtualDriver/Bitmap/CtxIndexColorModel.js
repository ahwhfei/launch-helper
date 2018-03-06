/*
 * A color model that is based on the standard Java IndexColorModel,
 * but provides an interface more appropriate for our use here.
 */
function CtxIndexColorModel(pal, indexPalette) {
    var stock 			= []; // Palette array cache.
    var basePalette 	= null;
	var palette 		= null;
	var alphaPixel 		= -1; //because 0 index represent color it can not be used for transparent color index
    var alphaPixelMode 	= false; // Use alpha pixel value.
    var alphaMode      	= false; // Allow alpha channel data.
    var cachePalette   	= false; // Palette can be reused.
	var map_size		= 0;
	basePalette = pal.slice(0);

	/**
     * Create index color model containing palette created
     * from an index palette and base color palette.
     */
	if (indexPalette == undefined || indexPalette == null)
	{
		palette = pal.slice(0);
	}
	else
	{
		GetCachePalette();
		MapPixels(pal, indexPalette);
	}

	/* this function return no palette in color model map_size is set at time of color\
	 * it should be set to no of color present in color model
	 */
	

	this.getMapSize = function()
	{
		return map_size;
	};
	/* this function set map_size of color model  that is equal to no of different color
	 * present in color model
	 */
	
	this.setMapSize = function(size)
	{
		map_size = size;
	} ;
	   
	   
	
    this.SetPalette = function setPalette(pal, isIndexed, alphaPixel)
	{
		if (isIndexed == false)
		{
	        if (cachePalette)
			{
	            // Put palette in cache for reuse.
	            stock[stock.length] = palette.slice(0);
	            cachePalette = false;
	        }
			Utility.CopyArray(pal, 0, palette, 0, pal.length);
		}
		else
		{
			if (indexPalette == null)
			{
				this.UseBasePalette();
			}
			else
			{
				if (cachePalette == false) // Can't reuse current palette, so get one.
					GetCachePalette();

				MapPixels(basePalette, indexPalette);
			}
		}

		if (arguments.length == 3)
		{
			this.SetAlphaPixel(alphaPixel);
		}
   };

    this.UseBasePalette = function useBasePalette()
	{
        if (cachePalette)
		{
            // Put palette in cache for reuse.
			stock[stock.length] = palette.slice(0);
			cachePalette = false;
        }
		palette = basePalette.slice(0);
        // Also unset alpha pixel:
        alphaPixelMode = false;
   };
	this.getAlphaPixel = function ()
	{
		return alphaPixel;
	};
	this.getTransparentPixel= function()
	{
		return alphaPixel;
	};
	this.setTransparentPixel= function(pixel)
	{
		this.SetAlphaPixel(pixel);
		if( pixel >=0 && pixel < map_size )
		{
			palette[pixel] &= 0x00ffffff;
		}
	};
    this.SetAlphaPixel = function setAlphaPixel(pixel)
	{
        alphaPixelMode = (pixel >= 0);
        alphaPixel = pixel;
   };

    this.ClearAlphaPixel = function clearAlphaPixel()
	{
        alphaPixelMode = false;
   };

    var GetCachePalette = function getCachePalette()
	{
        if (stock.length == 0)
		{
            palette = new Array(256); // Always use max size (8 bits pre pixel);
        }
		else
		{
            palette = stock[stock.length - 1].slice(0);
			--stock.length;
        }
        cachePalette = true;
   };;

    var MapPixels = function mapPixels(pal, indexPalette)
	{
        var colorCount = indexPalette.length;
        map_size=colorCount;
        for (var i = colorCount; i--;)
            palette[i] = pal[indexPalette[i]];
   };

    /**
     * Returns a reference to the current active palette, not a copy.
     * @param newPalette the palette to have palette entries copied into.
     * @return the filled in new palette.
     */
    this.GetPalette = function getPalette(newPalette) {
		Utility.CopyArray(palette, 0, newPalette, 0, palette.length);
    };

 this.setAlphaChannelMode = function () {
        // NOTE If this ever gets used, ensure that DirectFrameBuffer.setOurPalette() is updated.
        alphaMode = true;
   };

    /**
     * Returns the color of the pixel in the default RGB color model.
     * @see ColorModel#getRGBdefault
     */
    this.GetRGB = function getRGB(pixel)
	{
        return (alphaPixelMode && (pixel == alphaPixel))
               ? 0
               : (alphaMode)
               ? palette[pixel]
               : palette[pixel] | 0xFF000000;
   };
     /**
     * Provides the red color compoment for the specified pixel.
     * @return          The red color component ranging from 0 to 255
     */
    this.getRed =function (pixel) {
        return (alphaPixelMode && (pixel == alphaPixel))
               ? 0
               : (palette[pixel] & 0xFF0000) >> 16;
    };

    /**
     * Provides the green color compoment for the specified pixel.
     * @return          The green color component ranging from 0 to 255
     */
    this.getGreen=function(pixel) {
        return (alphaPixelMode && (pixel == alphaPixel))
               ? 0
               :  (palette[pixel] & 0xFF00) >> 8;
    };
    /**
     * Provides the blue color compoment for the specified pixel.
     * @return          The blue color component ranging from 0 to 255
     */
    this.getBlue = function(pixel) {
        return (alphaPixelMode && (pixel == alphaPixel))
               ? 0
               : palette[pixel] & 0xFF;
    };

    /**
     * Provides the alpha color compoment for the specified pixel.
     * @return          The alpha transparency value ranging from 0 to 255 (always 255; opaque)
     */
    this.getAlpha=function(pixel) {
        return (alphaPixelMode && (pixel == alphaPixel))
               ? 0
               : (alphaMode)
               ? ((palette[pixel] & 0xFF000000) >> 24)&0xff
               : 0xFF;
    };
    
  
}
function indexColorModel( bits , size ,  cmap , start , hasalpha , trans )
{
	//no of bit should be in range of 1-16
	//to do throw erro check bit
	//to do if size<1 then throw error
	var rgb               =   new Array();
	var transparent_index =   -1;
	var alpha             =   0xff;
	var j				  =   start;
	for (var i = 0; i < size; i++) {
                    var r = cmap[j++] & 0xff;
                    var g = cmap[j++] & 0xff;
                    var b = cmap[j++] & 0xff;
                    if (hasalpha) {
                        alpha = cmap[j++] & 0xff;
                        if (alpha != 0xff) {
                            if (alpha == 0x00) {
                               
                                if (transparent_index < 0) {
                                    transparent_index = i;
                                }
                            } 
                            
                        }
                    }
                    rgb[i] = (alpha << 24) | (r << 16) | (g << 8) | b;
                }
           var indexColor = new CtxIndexColorModel(rgb);
           indexColor.setMapSize(size);
           indexColor.setAlphaChannelMode();
           indexColor.setTransparentPixel(transparent_index);
           indexColor.setTransparentPixel(trans);
	 	   return indexColor ;
}
