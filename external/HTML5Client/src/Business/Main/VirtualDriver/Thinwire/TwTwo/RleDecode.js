/* RleDecode prototype */

function RleDecode()
{
	this.Width = 0;
	this.Height = 0;
	this.Bpp = 0;
	var OutputCount = 0;
	this.End = 0;
	this.RawLength = 0;
	this.RunLength = 0;
	this.IsLeftRun = false ;
	this.IsPhotoCodec = true;
	this.InUse = false;
	this.TwTwoReadStream  = null;
	var fnRC ,fnRCD;
	
    this.jpgDecoder = null;
}


RleDecode.prototype.BaseInitialize = function baseInitialize(w, h, bitsPerPixel, twTwoReadStream)
{
    this.TwTwoReadStream = twTwoReadStream;
    this.Height = h;
    this.Width  = w;
    this.Bpp = bitsPerPixel;
    fnRC = (this.Bpp == 16) ? this.ReadCache16 : this.ReadCache24;
    fnRCD = (this.Bpp == 16) ? this.ReadColorDelta16 : this.ReadColorDelta24;
			
    this.End = w * h;
    OutputCount = 0;
};

RleDecode.prototype.InterpretEncoding = function interpretEncoding(encoding) {
	// Implement a table lookup written in C using a cascaded if sequence.
	// NB: A length value of 0xFF indicates that extra input data follows for that length.
	if (encoding > 0x3B) {
		if (encoding == 0x3F) {
			this.RunLength = this.RawLength = 0xFF;
		} else {
			this.RunLength = 0x02;
			this.RawLength = (encoding == 0x3E) ? 0xFF : (encoding - 0x39);
		}
	} else if (encoding > 0x35) {
		this.RunLength = 0x01;
		this.RawLength = (encoding == 0x3B) ? 0xFF : (encoding - 0x33);
	} else if (encoding > 0x29) {
		this.RunLength = 0x00;
		this.RawLength = (encoding == 0x35) ? 0xFF : (encoding - 0x27);
	} else if (encoding > 0x23) {
		this.RunLength = (encoding == 0x29) ? 0xFF : (encoding - 0x24);
		this.RawLength = 0x02;
	} else if (encoding > 0x17) {
		this.RunLength = (encoding == 0x23) ? 0xFF : (encoding - 0x18);
		this.RawLength = 0x01;
	} else {
		this.RunLength = (encoding == 0x17) ? 0xFF : encoding;
		this.RawLength = 0x00;
	}

	if (this.RawLength == 0xFF)
		this.RawLength = this.ReadBigNum();

	if (this.RunLength == 0xFF)
		this.RunLength = this.ReadBigNum();

	this.RunLength++; // Zero based 1.
}

RleDecode.prototype.ReadBigNum = function readBigNum()
{
    var x = this.TwTwoReadStream.ReadUInt8();

    if (x == 0xFF)
    {
        x = this.TwTwoReadStream.ReadUInt16();
        if (x == 0xFFFF)
        {
            x = this.TwTwoReadStream.ReadInt32();
        }
    }

    return x;
};

RleDecode.prototype.RleDecompress2D = function rleDecompress2D()
{
    while(OutputCount < this.End)
    {
        this.ReadLength();

        if (this.RawLength)
        {
            this.DoRawData(this.RawLength);
        }

        if (this.IsLeftRun)
        {
            this.DoRunDataLeft(this.RunLength);
        }
        else
        {
            this.DoRunDataUp(this.RunLength);
        }
    }
};

RleDecode.RleDecompressCommon = function rleDecompressCommon(format, w, h, twTwoReadStream, pixels, isPhotoCodec, isByteSized)
{
    var decoder = RleDecode.GetRleDecoder(format);
    decoder.InUse = true;
    var scan = 0, bp = 0, ra = 0;

	if( (isByteSized != true) ) 
    {
        decoder.IsPhotoCodec = isPhotoCodec;
        switch (format)
        {
            case RleDecode.GCS_RGB_16BIT:
                bp = 16;
                ra = w * h * 2;
                break;
            case RleDecode.GCS_RGB_24BIT:
                bp = 24;
                ra = w * h * 3;
                break;
            case RleDecode.GCS_PALETTED_1BIT:
            case RleDecode.GCS_PALETTED_4BIT:
            case RleDecode.GCS_PALETTED_8BIT:
                throw RleDecodeError.NOT_INT_SIZED_BITMAP;
            case GCS_RGB_32BIT:
                throw RleDecodeError.DECODER_NOT_SUPPORTED;
            default:
                throw RleDecodeError.BAD_DECODER;
        }

        decoder.Initialize(w, h, bp, twTwoReadStream, pixels);
        if (ra >= RleDecode.MIN_ENCODED_LENGTH)
        {
        	decoder.RleDecompress2D();
            
        }
        else
        {
            // Not encoded at all.
            // Read as raw data of correct length, given in pixels:
            decoder.IsPhotoCodec = false;
            decoder.DoRawData(w * h);
        }
    }
    else
    {
        switch (format)
        {
            case RleDecode.GCS_PALETTED_1BIT:
                //double bitwise NOT to floor
                scan = ~~((w + 7) / 8);
                decoder.Initialize(w, h, scan, 1, twTwoReadStream, pixels);
                break;
            case RleDecode.GCS_PALETTED_4BIT:
                //double bitwise NOT to floor
                scan = ~~((w + 1) / 2);
                decoder.Initialize(w, h, scan, 4, twTwoReadStream, pixels);
                break;
            case RleDecode.GCS_PALETTED_8BIT:
                scan = w;
                decoder.Initialize(w, h, twTwoReadStream, pixels);
                break;
            case RleDecode.GCS_RGB_16BIT:
            case RleDecode.GCS_RGB_24BIT:
                throw RleDecodeError.NOT_BYTE_SIZED_BITMAP;
            case RleDecode.GCS_RGB_32BIT:
                throw RleDecodeError.DECODER_NOT_SUPPORTED;
            default:
                throw RleDecodeError.BAD_DECODER;
        }
        if ((scan * h) < RleDecode.MIN_ENCODED_LENGTH)
        {
            // Not encoded at all.
            // Read as raw data of correct length (in bytes of raw input).
            decoder.DoRawData(scan * h);
        }
        else
        {
            decoder.IsPhotoCodec = isPhotoCodec;
            decoder.RleDecompress2D();
        }
    }

    decoder.InUse = false;   
};

RleDecode.expandNullBitmapInt = function(format, w, h, twTwoReadStream, pixels)
{
	var noPixels = w * h;

    switch(format) {
        case RleDecode.GCS_RGB_16BIT:
            for (var i = 0; i < noPixels; i++) {
                pixels[i] = twTwoReadStream.ReadRGB16();
            }
            break;

        case RleDecode.GCS_RGB_24BIT:
            for (var i = 0; i < noPixels; i++) {
                pixels[i] = twTwoReadStream.ReadRGB();
            }
            break;

        case RleDecode.GCS_RGB_32BIT:
            // Not currently used

        default:
            throw RleDecodeError.UNSUPPORTED_RAW_IMAGE_FORMAT;
    }	
};

RleDecode.expandNullBitmapByte = function(format, w, h, twTwoReadStream, pixels)
{
	var bpp;

    switch(format) {
        case RleDecode.GCS_PALETTED_1BIT:
            bpp = 1;
            break;

        case RleDecode.GCS_PALETTED_4BIT:
            bpp = 4;
            break;

        case RleDecode.GCS_PALETTED_8BIT:
            // Direct read/copy for 8bpp images
            twTwoReadStream.ReadBytes(pixels, 0, w * h);
            return;

        default:
            throw RleDecodeError.UNSUPPORTED_RAW_IMAGE_FORMAT;
    }

    // Need to unpack in the case of < 8 bpp
    var ppb             = 8 / bpp;
    var srcBytesPerLine = (w + ppb - 1) / ppb;
    var revBpp          = 8 - bpp;
    var mask            = (1 << bpp) - 1;
    var oddTrailing     = w & (ppb - 1);

    for (var line = 0; line < h; line++) {
        var destOffset   = w * line;
        var srcBytesToGo = srcBytesPerLine;

        while (srcBytesToGo-- > 0) {
            var src = twTwoReadStream.ReadUInt8();
            if (srcBytesToGo == 0 && oddTrailing != 0) {
                for (var i = 0; i < oddTrailing; i++) {
                    pixels[destOffset++] = ((src >> revBpp) & mask) & 0xFF;
					src <<= bpp;
                }
            } else {
                switch(bpp) {
                    case 1:
                        pixels[destOffset++] = 0xFF & ((src >> revBpp) & mask); src <<= bpp;
                        pixels[destOffset++] = 0xFF & ((src >> revBpp) & mask); src <<= bpp;
                        pixels[destOffset++] = 0xFF & ((src >> revBpp) & mask); src <<= bpp;
                        pixels[destOffset++] = 0xFF & ((src >> revBpp) & mask); src <<= bpp;
                        // Fall through
                    // case 2:
                        pixels[destOffset++] = 0xFF & ((src >> revBpp) & mask); src <<= bpp;
                        pixels[destOffset++] = 0xFF & ((src >> revBpp) & mask); src <<= bpp;
                        // Fall through
                    case 4:
                        pixels[destOffset++] = 0xFF & ((src >> revBpp) & mask); src <<= bpp;
                    // case 8: (no expansion necessary)
                        pixels[destOffset++] = 0xFF & ((src >> revBpp) & mask);
                }
            }
        }
    }
};

// Using emscripten jpeg instead of CanvasJpgDecode as it is now similar or better, and it works on all browsers!
// Canvas decode had problems loading image sizes > 64k synchronously, works only on Chrome and IE, failed with Edge, Firefox and Safari.

// TODO: Move to utility
var timestamp;
    try {
        timestamp = performance.now.bind(performance);
    } catch (error) {
        timestamp = Date.now.bind(Date);
    }
	//  based on resolution, setting memory.
		var getMemorySize = function(width, height) {
			var res = width*height;
			var r1 = 1280*800;var r2 = 1600*1200;
			if (res <= r1) {
			  return (2*1048576); //2mb
			} else if (res <= r2) {
			  return (4*1048576); //4mb
			} else  {
			  return (8*1048576); //8mb
			}
		};
RleDecode.decompressJpeg = function(format, twTwoReadStream, width, height) {
        var status;
	// init emscripten module and store function ref
	if (!this.jpgDecoder) {
	  var jpgMem = getMemorySize(newSessionWidth,newSessionHeight);
		this.jpgDecoder = (new (self["tJpegDecoder_1_5_0"])(jpgMem))["decompress"];
	}

	var length = twTwoReadStream.Available();
	var buffer = new Uint8Array(length);
	twTwoReadStream.ReadBytes(buffer, 0, length);
        
    var start = timestamp();

    // Emscripten no thread Decode
    status = this.jpgDecoder(buffer, width, height);	
    // Canvas JpegDecode
    // status = CanvasJpegDecode(buffer, width, height);

    // Emscripten async thread Decode
    // status = JpgDecoderThread(buffer, width, height, callback); // post and wait

    // Nacl async/sync Decode
    // status = PostMessageAndWait({'buffer': buffer, 'width': width, 'height': height});

    var stop = timestamp() - start;
    JpegProfiler.totalJpegDecodeTime += stop;
    
    JpegProfiler.jpegCount++;
//    console.info("OPT_JPEG: METRICS " + jpegCount + " : Width " + width + " Height " + height + " DecodeTime " + stop + " ms");
    
    return status;
}

// Canvas Jpeg decoding:
// 1) encode jpeg data in base64
// 2) load img, using base64 data url
// 3) draw img data to canvas
// 4) get data from canvas
// Note: Thinwire engine code expects bitmaps to cache the result, copy to frame buffer etc,
// so we cant return result in async fashion. If image can't be loaded we let js jpg decode handle from next time.
// var jpegCanvas = null;
// var jpgCtx = null;
// function CanvasJpgDecode(buffer , width , height ) {
	// // setup canvas, context and image first time.
	// if (!jpegCanvas) {
		// jpegCanvas = document.createElement('canvas');
		// jpgCtx = jpegCanvas.getContext('2d');
	// }
	// // Use new image so that we dont render older data.
	// var jpgImg = new Image();
	// // encode to base64 and load as data url
	// var str = "";
	// for (var si = 0; si < buffer.length; si++) {
		// str += String.fromCharCode(buffer[si]);
	// }
	// jpgImg.src = "data:image/jpeg;base64," + window.btoa(str);
	
	// // If image is still not loaded give up
	// if (jpgImg.complete == false) {
		// console.log("could not decode jpeg! : " + jpgImg.src + ", w: " + width + ", h: " + height);
		// return null;
	// }

	// // draw to canvas, take the decoded data (RGBA) and clear rect
	// jpegCanvas.width = width;
	// jpegCanvas.height = height;
	// jpgCtx.drawImage(jpgImg, 0, 0);
	// var imgData = (jpgCtx.getImageData(0, 0, width, height)).data;
	// jpgCtx.clearRect(0, 0, width, height);

	// // RGBA => BGRA
	// for (var off = 0; off < imgData.length; off+=4) {
		// var temp = imgData[off+2];
		// imgData[off+2] = imgData[off];
		// imgData[off] = temp;
	// }	

	// return new Int32Array(imgData.buffer);
// };

RleDecode.RLE_2D_UP_RUN_MASK  	= 0x80;
RleDecode.RLE_2D_RAW_LEN_MASK	= 0x78;
RleDecode.RLE_2D_RUN_LEN_MASK	= 0x07;
RleDecode.RLE_2D_RAW_1BYTE 		= 14;
RleDecode.RLE_2D_RAW_2BYTE 		= 15;
RleDecode.RLE_2D_RUN_1BYTE 		= 6;
RleDecode.RLE_2D_RUN_2BYTE 		= 7;
RleDecode.MIN_ENCODED_LENGTH 	= 32;
RleDecode.GCS_UNSPECIFIED   	= 0;
RleDecode.GCS_PALETTED_1BIT 	= 1;
RleDecode.GCS_PALETTED_4BIT 	= 2;
RleDecode.GCS_PALETTED_8BIT 	= 3;
RleDecode.GCS_RGB_16BIT     	= 4;
RleDecode.GCS_RGB_24BIT     	= 5;
RleDecode.GCS_RGB_32BIT     	= 6;
RleDecode.GCS_UPPERBOUND    	= 7;

// TODO: move codec id to constants
RleDecode.BMP_CODEC_ID_NULL       = 0x00;
RleDecode.BMP_CODEC_ID_2DRLE      = 0x01;
RleDecode.BMP_CODEC_ID_2DRLE_V2   = 0x02;
RleDecode.BMP_CODEC_ID_JPEG_LOSSY = 0x03;
RleDecode.BMP_CODEC_ID_H264 = 0x06;

RleDecode.Decoders = new Array(RleDecode.GCS_UPPERBOUND);

RleDecode.GetRleDecoder = function getRleDecoder(format)
{
	
	var d = RleDecode.Decoders[format];

	if (d != null)
	{
		if (RleDecode.Decoders[format].InUse == false)
		{
			/* If not in use then mark it as in use */
			RleDecode.Decoders[format].InUse = true;
		}
	}
	else{
			switch(format)
			{
				case RleDecode.GCS_PALETTED_1BIT:
					d =  new RleDecodeByte();
					break ;
				case RleDecode.GCS_PALETTED_4BIT:
					d =  new RleDecodeByte();
					break ;
				case RleDecode.GCS_PALETTED_8BIT:
					d =  new RleDecode8();
					break ;
				case RleDecode.GCS_RGB_16BIT:
					d =  new RleDecodeInt();
					break ;
				case RleDecode.GCS_RGB_24BIT:
					d =  new RleDecodeInt();
					break ;
				default:
					d =  null;
			}
			 RleDecode.Decoders[format] = d;
		
	}
	return d;
};
