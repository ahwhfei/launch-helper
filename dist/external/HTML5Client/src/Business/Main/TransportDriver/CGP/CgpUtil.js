/* Copyright 2003-2012 Citrix Systems, Inc. */

function CgpEncodeVarlenInTwoBytes(value, offset, buffer)
{
    buffer[offset++] = (value & 0x7F) | 0x80;
   	buffer[offset++] = (value >> 7);
    //(ppDestination)++;
    //console.log("CGP Encode Varlen Buffer is : ", buffer);
    return offset;
}

function CgpEncodeShort(value, offset, buffer)
{
    buffer[offset++] = value & 0xFF;
    buffer[offset++] = (value >> 8) & 0xFF;
    return offset;
}

function CgpEncodeVarlen(value, offset, buffer)
{
    if (value < 128)
    {
        buffer[offset++] = (value & 0xFF);
    }
    else
    {
        buffer[offset++] = (value & 0x7F) | 0x80;
   		buffer[offset++] = (value >> 7);
    }
    return offset;
}

function CgpEncodeVarlenBytesMacro(_value) {
	if(_value < 128) {
		return 1;
	} else {
		return 2;
	}
}

function getVarDataLength(data) {
        var length = data.length;
        return (CgpEncodeVarlenBytesMacro(length) + length);
}

// This is the replacement for OverRide function of getVarDataLength
function getVarLength(length) {
    return (CgpEncodeVarlenBytesMacro(length) + length);
}

function CgpEncodeLong(value, offset, buffer)
{
    buffer[offset++] = value & 0xFF;
    buffer[offset++] = (value >> 8) & 0xFF;
    buffer[offset++] = (value >> 16) & 0xFF;
    buffer[offset++] = (value >> 24) & 0xFF;
    return offset;
}

function cgpWriteVarLength(value, offset, buffer){
	if ((value & 0x7f) != value) {
            buffer[offset++] = ((value & 0x7f) | 0x80);
            buffer[offset++] = ((value >> 7) & 0x7f);
        } else {
            buffer[offset++] = value;
        }
        return offset;
}

function cgpWriteVarData(data, offset, buffer){
	var dataLen = data.length;
	offset = cgpWriteVarLength(dataLen, offset, buffer);
	var dataBuf = data.subarray(0,dataLen);
	buffer.set(dataBuf, offset);
	return (offset + dataLen);
}

function writeUint16(value , offset, buffer) {
    buffer[offset++] = (value & 0xff);
    buffer[offset++] = ((value >> 8) & 0xff);
    return offset;
}

function writeUint32(value , offset, buffer){
	buffer[offset++] = (value & 0xff);
	buffer[offset++] = ((value >> 8)  & 0xff);
	buffer[offset++] = ((value >> 16) & 0xff);
	buffer[offset++] = ((value >> 24) & 0xff);
	return offset;
}

function getVarLenLength(value) {
        return ((value & 0x7f) == value) ? 1 : 2;
}


function stringToBytes(str) {
    var bytes = new Uint8Array(str.length);
    for (var i=0; i< str.length; i++){
        bytes[i] = str.charCodeAt(i);
    }
    return bytes;
}

//function arrayCopy