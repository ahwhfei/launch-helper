function ByteConverter(){}

/* Return at a offset in an array version of above functions. buffer 
 * is the array input which will hold output at offset. It also 
 * returns the value of new offset. In versions that convert byte to 
 * number, offset tells the position of starting byte.
 * */

ByteConverter.Byte4ToInt32AtOffset = function byte4ToInt32AtOffset(num, offset)
{
   return (num[offset] | (num[offset + 1] << 8) | (num[offset + 2] << 16) | (num[offset + 3] << 24) );
};

ByteConverter.Byte2ToInt32AtOffset = function byte2ToInt32AtOffset(num, offset)
{
	return (num[offset] | (num[offset + 1] << 8));
};

/* Input is array of 2 byte and output is a 16bit number */
ByteConverter.Byte2ToInt16 = function byte2ToInt16(num , offset )
{
	if( !offset )
	{
		offset = 0;
	}
    
    return ((num[offset] & 0xFF) | ((num[offset + 1] & 0xFF) << 8) );
};

