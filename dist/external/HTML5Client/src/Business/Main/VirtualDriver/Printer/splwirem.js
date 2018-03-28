/*Read the common Request packet header */
function marshallReadCpmPacketHeader(vStream , writePtr) {
    writePtr.h_type=vStream.ReadUInt8();
    writePtr.mpxId=vStream.ReadUInt8();
}

/*Read the EnumPrinter Request packet header*/
function marshallReadEnumPrinterRequest(vStream , writePtr) {
    writePtr.index=vStream.ReadUInt16();
    writePtr.size=vStream.ReadUInt16();
}

/*Read the Connect2 Request packet header*/
function marshallReadConnect2Request(vStream , writePtr) {
    writePtr.packetSize=vStream.ReadUInt16();
    writePtr.lowerVersion=vStream.ReadUInt16();
    writePtr.higherVersion=vStream.ReadUInt16();
    writePtr.flags=vStream.ReadUInt16();

}
/*Read the OpenPrinter Request packet header*/
function marshallReadOpenPrinterRequest(vStream , writePtr) {
    writePtr.nameSize=vStream.ReadUInt8();
    writePtr.accessMode=vStream.ReadUInt8();
}

/*Read the ClosePrinter Request packet header*/
function marshallReadClosePrinterRequest(vStream , writePtr) {
    writePtr.context=vStream.ReadUInt16();
}

/*Read the WritePrinter Request packet header*/
function marshallReadWritePrinterRequest(vStream , writePtr) {
    writePtr.context=vStream.ReadUInt16();
    writePtr.size=vStream.ReadUInt16();
}

/*Write common replay packet header*/
function marshallWriteCpmPacketHeader(buffer , offset , readPtr) {
    buffer[offset++]=readPtr.h_type;
    buffer[offset++]=readPtr.mpxId;
    return offset;
}

/*Write EnumPrinter replay packet header*/
function marshallWriteEnumPrinterReply(buffer , offset , readPtr) {
    offset=marshallWriteCpmPacketHeader(buffer,offset,readPtr.header);
    buffer[offset++]=readPtr.result & 0xff;
    buffer[offset++]=(readPtr.result>>8) & 0xff;
    buffer[offset++]=readPtr.numberOfPrinter & 0xff;
    buffer[offset++]=(readPtr.numberOfPrinter>>8) & 0xff;
    buffer[offset++]=readPtr.size & 0xff;
    buffer[offset++]=(readPtr.size>>8) & 0xff;
    return offset;
}

/*Write OpenPrinter replay packet header*/
function marshallWriteOpenPrinterReply(buffer , offset , readPtr) {
    offset=marshallWriteCpmPacketHeader(buffer,offset,readPtr.header);
    buffer[offset++]=readPtr.result & 0xff;
    buffer[offset++]=(readPtr.result>>8) & 0xff;
    buffer[offset++]=readPtr.context & 0xff;
    buffer[offset++]=(readPtr.context>>8) & 0xff;
    return offset;
}

/*Write ClosePrinter replay packet header*/
function marshallWriteClosePrinterReply(buffer , offset , readPtr) {
    offset=marshallWriteCpmPacketHeader(buffer,offset,readPtr.header);
    buffer[offset++]=readPtr.result & 0xff;
    buffer[offset++]=(readPtr.result>>8) & 0xff;
    return offset;
}

/*Write WritePrinter replay packet header*/
function marshallWriteWritePrinterReply(buffer , offset , readPtr) {
    offset=marshallWriteCpmPacketHeader(buffer,offset,readPtr.header);
    buffer[offset++]=readPtr.result & 0xff;
    buffer[offset++]=(readPtr.result>>8) & 0xff;
    buffer[offset++]=readPtr.size & 0xff;
    buffer[offset++]=(readPtr.size>>8) & 0xff;
    return offset;
}