function ByteWriter(){}

ByteWriter.WriteInt32ToBuffer = function writeInt32ToBuffer(buffer, offset, num)
{
	buffer[offset++] = num & 0xFF;
	buffer[offset++] = (num >> 8) & 0xFF;
	buffer[offset++] = (num >> 16) & 0xFF;
	buffer[offset++] = (num >> 24) & 0xFF;
	
	
	return offset;
};
ByteWriter.WriteInt16ToBuffer = function writeInt16ToBuffer (buffer, offset, num)
{
	buffer[offset++] = num & 0xFF;
	buffer[offset++] = (num >> 8) & 0xFF;	
	return offset;
};

ByteWriter.WriteAsciiStringWithNullEnding = function(buffer, offset, string)
{
	for (var i = 0; i < string.length; ++i)
	{
		buffer[offset++] = string.charCodeAt(i);
	}
	buffer[offset++] = '\0';
	return offset;
}

ByteWriter.WriteInt32ToStream = function writeInt32ToStream(stream, num)
{
	stream.WriteByte(num & 0xff);
	stream.WriteByte((num >> 8) & 0xff);
	stream.WriteByte((num >> 16) & 0xff);
	stream.WriteByte((num >> 24) & 0xff);
};

ByteWriter.WriteInt16ToStream = function writeInt16ToStream(stream, num)
{
	stream.WriteByte(num & 0xff);
	stream.WriteByte((num >> 8) & 0xff);
};
ByteWriter.readUInt2 = function readUint2FromBuffer(buffer, index)
{
	return ((buffer[index] & 0xFF) |
                ((buffer[index+1] &0xFF) << 8) ) ;

};
ByteWriter.readInt4 = function readInt4FromBuffer(buffer, index)
{
	return ((buffer[index] & 0xFF) |
                ((buffer[index+1] &0xFF) << 8) |
                ((buffer[index+2] &0xFF) << 16) |
                ((buffer[index+3] &0xFF) << 24) ) ;
	
};

