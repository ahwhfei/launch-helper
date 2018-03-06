function Convert() { }

Convert.Dmap1 = null;
Convert.Dmap2 = null;
Convert.Dmap3 = null;
Convert.Dmap4 = null;
Convert.WINDOW1252ENC = 0;
Convert.WINDOW437ENC = 1;
/*
* this function change string to byte array ( encoded in window 1252)
*/
Convert.convertStr2Cp1252byteArray = function (str, length1, desOffset) {
    var len = str.length;
    var size_of_array = len;

    if (length1) {
        size_of_array = length1;
        if (len > length1) {
            len = length1;
        }
    }
    if (!desOffset) {
        desOffset = 0;
    }
    var outarray = new Int8Array(size_of_array + desOffset);
    var offset = desOffset;
    var ord, ord1;
    if (Convert.Dmap1 === null) {
        Convert.makeEncodingArray(Convert.WINDOW1252ENC);
    }
    for (var i = 0; i < len; i++) {
        ord = str.charCodeAt(i);
        if (!(ord in Convert.Dmap1)) {
            ord1 = 63; // append "?" code 
            //throw convertError.convert_Str2_Cp1252byteArray ;
        }
        else {
            ord1 = Convert.Dmap1[ord];
        }

        outarray[offset++] = ord1;
    }

    return outarray;
};

/*
* this function change byte array  to string ( decoded  by  window-1252)
*/
Convert.convertCp1252_byteArray_2_Str = function (byteArray, offset, count) {
    if (count === 0)
        return null;
    var outstr = "";
    var offset1 = 0;
    if (offset)
        offset1 = offset;
    var len = 0;
    if (count)
        len = count;
    else
        len = byteArray.length;
    if (Convert.Dmap2 === null) {
        Convert.makeEncodingArray(Convert.WINDOW1252ENC);
    }
    var ord, ord1;
    for (var i = 0; i < len; i++) {
        ord = byteArray[i + offset1];
        if (!(ord in Convert.Dmap2)) {
            ord1 = 63; // append "?" code 
            //throw convertError.convertCp1252_byteArray_2_Str ;
        }
        else {
            ord1 = Convert.Dmap2[ord];
        }

        outstr += String.fromCharCode(ord1);
    }

    return outstr;
};

/*
* this function change string to byte array ( encoded in window-437)
*/
Convert.convertStr2Cp437byteArray = function (str, length, desOffset) {
    var len = str.length;
    if (!desOffset) {
        desOffset = 0;
    }
    var outarray = new Int8Array(len + desOffset);
    var offset = desOffset;
    if (Convert.Dmap3 === null) {
        Convert.makeEncodingArray(Convert.WINDOW437ENC);
    }
    var ord, ord1;
    for (var i = 0; i < len; i++) {
        ord = str.charCodeAt(i);
        if (!(ord in Convert.Dmap3)) {
            throw convertError.convertStr_2_Cp437byteArray;
        }
        ord1 = Convert.Dmap3[ord];
        outarray[offset++] = ord1;
    }

    return outarray;
};

/*
* this function change byte array  to string ( decoded  by  window-437)
*/
Convert.convertCp437_byteArray_2_str = function (byteArray) {
    var outstr = "";

    var len = byteArray.length;
    var ord, ord1;
    if (Convert.Dmap4 === null) {
        Convert.makeEncodingArray(Convert.WINDOW437ENC);
    }
    for (var i = 0; i < len; i++) {
        ord = byteArray[i];
        if (!(ord in Convert.Dmap4))
            throw convertError.convertCp437_byteArray_2_str;
        ord1 = Convert.Dmap4[ord];
        outstr += String.fromCharCode(ord1);
    }

    return outstr;
};


Convert.makeEncodingArray = function (encType) {

    //map-1  and map-2 is defined for window 1252 encoding
    var map1 = new Int16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 8364, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, 381, 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, 382, 376, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255]);
    var map2 = new Int16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 142, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255]);
    //map3 and map4 is used for window 437 encoding
    var map3 = new Int16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 199, 252, 233, 226, 228, 224, 229, 231, 234, 235, 232, 239, 238, 236, 196, 197, 201, 230, 198, 244, 246, 242, 251, 249, 255, 214, 220, 162, 163, 165, 8359, 402, 225, 237, 243, 250, 241, 209, 170, 186, 191, 8976, 172, 189, 188, 161, 171, 187, 9617, 9618, 9619, 9474, 9508, 9569, 9570, 9558, 9557, 9571, 9553, 9559, 9565, 9564, 9563, 9488, 9492, 9524, 9516, 9500, 9472, 9532, 9566, 9567, 9562, 9556, 9577, 9574, 9568, 9552, 9580, 9575, 9576, 9572, 9573, 9561, 9560, 9554, 9555, 9579, 9578, 9496, 9484, 9608, 9604, 9612, 9616, 9600, 945, 223, 915, 960, 931, 963, 181, 964, 934, 920, 937, 948, 8734, 966, 949, 8745, 8801, 177, 8805, 8804, 8992, 8993, 247, 8776, 176, 8729, 183, 8730, 8319, 178, 9632, 160]);
    var map4 = new Int16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255]);

    if (encType === Convert.WINDOW1252ENC) {
        var map1Len = map1.length;
        Convert.Dmap1 = [];
        Convert.Dmap2 = [];
        for (var i = 0; i < map1Len; i++) {
            Convert.Dmap1[map1[i]] = map2[i];
            Convert.Dmap2[map2[i]] = map1[i];
        }
    }
    else if (Convert.WINDOW437ENC) {
        var map3Len = map3.length;
        Convert.Dmap3 = [];
        Convert.Dmap4 = [];
        for (var i = 0; i < map3Len; i++) {
            Convert.Dmap3[map3[i]] = map4[i];
            Convert.Dmap4[map4[i]] = map3[i];
        }
    }



};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint
Convert.codePointAtImpl = function(src, index) {
	var size = src.length;
	// Get the first code unit
	var first = src.charCodeAt(index);
	var second;
	// check if it’s the start of a surrogate pair and there is other surrogate half in next index.
	if (first >= 0xD800 && first <= 0xDBFF && size > index + 1) {
		second = src.charCodeAt(index + 1);
		if (second >= 0xDC00 && second <= 0xDFFF) { // low surrogate
			// http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
			return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
		}
	}
	return first; // non surrogate pair codepoint.
};

Convert.fromCodePointImpl = function(codePoint) {
    if (codePoint < 0 || codePoint > 0x10FFFF) { // range check.
        return "";
    }
	  
    if (codePoint <= 0xFFFF) { // BMP code point
		return String.fromCharCode(codePoint);
    } 	
	
	// Astral code point; split in surrogate halves
    // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
    codePoint -= 0x10000;
    var highSurrogate = (codePoint >> 10) + 0xD800;
    var lowSurrogate = (codePoint % 0x400) + 0xDC00;
	
    return String.fromCharCode(highSurrogate, lowSurrogate);
};

// Use native functions if available else fallback.
if (String.prototype.codePointAt) {		
	Convert.CodePointAt = function(str, pos) {
		return str.codePointAt(pos);
	};
	Convert.FromCodePoint = function(cp) {
		return String.fromCodePoint(cp);
	};
} else {
	Convert.CodePointAt = Convert.codePointAtImpl;
	Convert.FromCodePoint = Convert.fromCodePointImpl;
}

// Get the codepoint from utf8 first and then convert it to string.
// https://mathiasbynens.be/notes/javascript-unicode

Convert.ToASCIIFromByteArray = function (bytes, offset, length) {
    var output = "";
    var ln = bytes.length;
    var startoffset = 0;
    if (offset) {
        startoffset = offset;
    }
    if (length) {
        ln = length;
    } 
    for(var i = 0; i<ln ;i++){
    	output +=  String.fromCharCode(bytes[startoffset + i]);
    }   
    return output;
};

Convert.ToUTF8FromByteArray = function (bytes, offset, length) {
    var output = "";
    var b, b1, b2, b3, b4, bE;
    var ln = bytes.length;
    var startoffset = 0;
    if (offset) {
        startoffset = offset;
    }
    if (length) {
        ln = length;
    }

    for (var i = 0; i < ln; i++) {
        var cp;
        b = bytes[startoffset + i];
        if (b < 0x80) {
            // Char represended by 1 byte.
            cp = b;
        }
        else if (b < 0xC0) {
            // Byte 2,3,4 of unicode char.
            continue;
        }
        else if (b < 0xE0) {
            // Char represended by 2 bytes.
            if (ln > i + 1) {
                b1 = (b & 0x1F); i++;
                b2 = (bytes[startoffset + i] & 0x3F);
                bE = (b1 << 6) | b2;
                cp = bE;
            }
        }
        else if (b < 0xF0) {
            // Char represended by 3 bytes.
            if (ln > i + 2) {
                b1 = (b & 0xF); i++;
                b2 = (bytes[startoffset + i] & 0x3F); i++;
                b3 = (bytes[startoffset + i] & 0x3F);
                bE = (b1 << 12) | (b2 << 6) | b3;
                cp = bE;
            }
        }
        else if (b < 0xF8) {
            // Char represended by 4 bytes.
            if (ln > i + 3) {
                b1 = (b & 0x7); i++;
                b2 = (bytes[startoffset + i] & 0x3F); i++;
                b3 = (bytes[startoffset + i] & 0x3F); i++;
                b4 = (bytes[startoffset + i] & 0x3F);
                bE = (b1 << 18) | (b2 << 12) | (b3 << 6) | b4;
                cp = bE;
            }
        }
        else {
            output += "?";
            continue;
        }
        output += Convert.FromCodePoint(cp);
    }
    return output;
};

Convert.ToUTF16LEFromByteArray = function (bytes, length1) {
    var output = "";
    var byte1, byte2, codePoint;
    var length = length1;
    if (!length1) {
        length = bytes.length;
    }


    for (var i = 0; i + 1 < length; i += 2) {
        // Javascript expects surrogate pair characters to remain separate.
        // Converting them to a code point first and passing that into
        // fromCharCode() is not desired
        byte1 = bytes[i];
        byte2 = bytes[i + 1];
        codePoint = byte2 << 8 | byte1;
        output += String.fromCharCode(codePoint);
    }

    return output;
};

Convert.ToByteArrayFromUTF16LE = function(src, dest, offset, length) {
	for (var i = offset; i < length; i++) {
		var code = src.charCodeAt(i);
		dest[2 * i] = code & 0xff;
		dest[2 * i + 1] = (code >> 8) & 0xff;
	}
	return dest; // return dest so that it is useful for passing it to other functions.
};

// First read codepoints from string and then convert them to bytes. JS has two surrogate halves instead of one character.
// For BMP chars, get codepoint directly. For surrogate use codePointAt at the index and skip the low surrogate pair index.
// https://mathiasbynens.be/notes/javascript-unicode
Convert.CharToByteUTF8 = function (str) {
	var cacheforcharcode = [];
	var cacheforcharcodelen = 0;
	var bytesNeeded = 0;
	var len = str.length;
	var temp;
	for (var i = 0; i < len; i++) {
		cacheforcharcode.push(Convert.CodePointAt(str, i));
		temp = cacheforcharcode[cacheforcharcodelen];

		if (temp < 0x80) {
			++bytesNeeded;
		}
		else if (temp < 0x0800) {
			bytesNeeded += 2;
		}
		else if (temp < 0x10000) {
			bytesNeeded += 3;
		}
		else {
			bytesNeeded += 4;
		}

		if (temp >= 0x10000) i++; // skip low surrogate pair index.
		cacheforcharcodelen++;
	}

	var utf8buffer = new Uint8Array(bytesNeeded);

	for (var i = 0, bytes = 0; i < cacheforcharcodelen; i++) {
		temp = cacheforcharcode[i];
		if (temp < 0x80) {
			utf8buffer[bytes++] = temp & 0xff;
		}
		else if (temp < 0x0800) {
			utf8buffer[bytes++] = (temp >> 6 | 0xC0) & 0xff;
			utf8buffer[bytes++] = (temp & 0x3F | 0x80) & 0xff;
		}
		else if (temp < 0x10000) {
			utf8buffer[bytes++] = (temp >> 12 | 0xE0) & 0xff;
			utf8buffer[bytes++] = (temp >> 6 & 0x3F | 0x80) & 0xff;
			utf8buffer[bytes++] = (temp & 0x3F | 0x80) & 0xff;
		}
		else {
			utf8buffer[bytes++] = (temp >> 18 | 0xF0) & 0xff;
			utf8buffer[bytes++] = (temp >> 12 & 0x3F | 0x80) & 0xff;
			utf8buffer[bytes++] = (temp >> 6 & 0x3F | 0x80) & 0xff;
			utf8buffer[bytes++] = (temp & 0x3F | 0x80) & 0xff;
		}
	}
	return utf8buffer;
};