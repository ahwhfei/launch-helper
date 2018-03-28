/* WdStream prototype */

function WdStream()
{
	var encoding = SupportedEncoding.UNICODE_ENCODING;
	var offset = 0, size = 0, maxBufferSize = 500 ;
	var increment_slice = 100 ;
	var buffer = new Uint8Array(maxBufferSize);

	this.ReadByte = function readByte()
	{
		return buffer[offset++];
	};

	this.ReadBytes = function readBytes(desBuffer, desOffset, length)
	{
		for (var i=0; i<length; ++i)
			desBuffer[desOffset + i] = buffer[offset + i];
		offset = offset + length;
	};
	this.SkipByte = function skipByte(numByteToSkip)
	{
		offset = offset + numByteToSkip;
	};

	this.ResetRead = function resetRead()
	{
  		size = offset;
  		offset = 0;
	};

	this.ResetWrite = function resetWrite()
	{
  		size = 0;
  		offset = 0;
	};

	this.Available = function available()
	{
		return size - offset;
	};

	this.consumeData = function consumeData(srcData, srcOffset, length ,channal )
	{
		if( maxBufferSize < ( size + length ) )
		{
			maxBufferSize  = size + length + increment_slice;
			var temp = buffer ;
			buffer = new Uint8Array( maxBufferSize );
			for (var i=0; i<size; ++i)
			{
				buffer[i] = temp[ i ];
			}
				
		}
		for (var i=0; i<length; ++i)
		{
			buffer[size + i] = srcData[srcOffset + i];
		}
			
		size +=length;
	};

	/* Formed using only one byte so INT32 > UINT8 */
	this.ReadUInt8 = function readUInt8()
	{
		
		return buffer[offset++] & 0xff;
	};

	/* Formed using only 2 byte so INT32 > UINT16 */
	this.ReadUInt16 = function readUInt16()
	{
        var result = buffer[offset] | (buffer[offset + 1] << 8);
        offset += 2;
        return result;
	};

	this.ReadInt16 = function readInt16()
	{
	    var result = buffer[offset] | (buffer[offset + 1] << 8);
        offset += 2;
        if ((result | 0x8000) != 0) {
            result |= 0xffff0000;
        }
        return result;
	};

	/* Formed using only 3 byte so INT32 > UINT24 */
	this.ReadUInt24 = function readUInt24()
	{
	    var result = (buffer[offset] | (buffer[offset + 1] << 8)
                      | (buffer[offset + 2] << 16));
        offset += 3;
        return result;
	};

	this.ReadInt24 = function readInt24()
	{
	   var result = (buffer[offset] | (buffer[offset + 1] << 8)
                      | (buffer[offset + 2] << 16));
        offset += 3;
        if((result | 0x800000) != 0) {
            result |= 0xff000000;
        }
        return result;
	};


	this.ReadInt32 = function readInt32()
	{
	     var result = (buffer[offset] | (buffer[offset + 1] << 8)
                      | (buffer[offset + 2] << 16) | (buffer[offset + 3] << 24));
        offset += 4;
        return result;
	};

}
