/*Read the common Request packet header */
function marshallReadCcmPacketHeader(vStream , writePtr) {
    writePtr.h_type=vStream.ReadUInt8();
    writePtr.mpxId=vStream.ReadUInt8();
}

/*Read the EnumSerial Request packet header*/
function marshallReadEnumSerialRequest(vStream , writePtr) {
    writePtr.index=vStream.ReadUInt16();
    writePtr.size=vStream.ReadUInt16();
    return writePtr.index;
}

/*Read the Connect serial Request packet header*/
function marshallReadConnectSerialRequest(vStream , writePtr) {
    writePtr.packetSize=vStream.ReadUInt16();
    writePtr.lowerVersion=vStream.ReadUInt16();
    writePtr.higherVersion=vStream.ReadUInt16();
    writePtr.flags=vStream.ReadUInt16();

}
/*Read the OpenPrinter Request packet header*/
function marshallReadOpenSerialRequest(vStream , writePtr) {
    writePtr.nameSize=vStream.ReadUInt8();
    writePtr.accessMode=vStream.ReadUInt8();
    
    var  byteName = new Uint8Array(writePtr.nameSize);
    vStream.ReadBytes(byteName, 0, writePtr.nameSize);//reading the printer name
    writePtr.portName = String.fromCharCode.apply(null,byteName);
   
    writePtr.portName = writePtr.portName.substr(0,writePtr.nameSize-1);
}

/*Read the CloseSerial Request packet header*/
function marshallReadCloseSerialRequest(vStream , writePtr) {
    writePtr.context=vStream.ReadUInt16();
}

/*Read the SetSerial Request packet header*/
function marshallReadSetSerialRequest(vStream , writePtr) {
    writePtr.context=vStream.ReadUInt16();
    writePtr.infoType=vStream.ReadInt32();
    writePtr.infoSize=vStream.ReadUInt16();
}

/*Read the SetSerial Request packet header*/
function marshallReadGetSerialRequest(vStream , writePtr) {
    writePtr.context=vStream.ReadUInt16();
    writePtr.infoType=vStream.ReadInt32();
    writePtr.maxInfoSize=vStream.ReadUInt16();
    writePtr.flags=vStream.ReadInt32();
}


/*Read the WriteSerial Request packet header*/
function marshallReadWriteSerialRequest(vStream , writePtr) {
    writePtr.context=vStream.ReadUInt16();
    writePtr.size=vStream.ReadUInt16();
    
}

function formatBitRateH2C(rate) {
  switch (rate) {
      case CCMCONSTANT.CCM_BAUD_075    : return 110;
      case CCMCONSTANT.CCM_BAUD_110    : return 110;
      case CCMCONSTANT.CCM_BAUD_134_5  : return 110;
      case CCMCONSTANT.CCM_BAUD_150    : return 110;
      case CCMCONSTANT.CCM_BAUD_300    : return 300;
      case CCMCONSTANT.CCM_BAUD_600    : return 300;
      case CCMCONSTANT.CCM_BAUD_1200   : return 1200;
      case CCMCONSTANT.CCM_BAUD_1800   : return 1200;
      case CCMCONSTANT.CCM_BAUD_2400   : return 2400;
      case CCMCONSTANT.CCM_BAUD_4800   : return 4800;
      case CCMCONSTANT.CCM_BAUD_7200   : return 4800;
      case CCMCONSTANT.CCM_BAUD_9600   : return 9600;
      case CCMCONSTANT.CCM_BAUD_14400  : return 14400;
      case CCMCONSTANT.CCM_BAUD_19200  : return 19200;
      case CCMCONSTANT.CCM_BAUD_38400  : return 38400;
      case CCMCONSTANT.CCM_BAUD_56K    : return 57600;
      case CCMCONSTANT.CCM_BAUD_57600  : return 57600;
      case CCMCONSTANT.CCM_BAUD_115200 : return 115200;
      case CCMCONSTANT.CCM_BAUD_128K   : return 128000;
      case CCMCONSTANT.CCM_BAUD_MASK   : return 230400;
	}

	return 9600; // default
}

function formatBitRateC2H(rate) {
  switch (rate) {
      case 110    : return CCMCONSTANT.CCM_BAUD_110;
      case 300    : return CCMCONSTANT.CCM_BAUD_300;
      case 1200   : return CCMCONSTANT.CCM_BAUD_1200;
      case 2400   : return CCMCONSTANT.CCM_BAUD_2400;
      case 4800   : return CCMCONSTANT.CCM_BAUD_4800;
      case 9600   : return CCMCONSTANT.CCM_BAUD_9600;
      case 14400  : return CCMCONSTANT.CCM_BAUD_14400;
      case 19200  : return CCMCONSTANT.CCM_BAUD_19200;
      case 38400  : return CCMCONSTANT.CCM_BAUD_38400;
      case 57600  : return CCMCONSTANT.CCM_BAUD_57600;      
      case 115200 : return CCMCONSTANT.CCM_BAUD_115200;
      case 230400 : return CCMCONSTANT.CCM_BAUD_MASK;
	}

	return CCMCONSTANT.CCM_BAUD_9600; // default
}

function marshallReadCcmBaudRate(vStream,writePtr){

  writePtr.bitrate = vStream.ReadInt32();
  writePtr.bitrate =  formatBitRateH2C(writePtr.bitrate);
  writeHTML5Log(0,"SESSION:|:ICA:|:COM:|:ENGINE:|:Reading Baud Rate"+ writePtr.bitrate ); 
}

function marshallReadCcmSetSignal(vStream,writePtr){
  var signalMask = vStream.ReadInt32();
  var signalState= vStream.ReadUInt8();
  writeHTML5Log(0,"SESSION:|:ICA:|:COM:|:ENGINE:|:Reading signal mask"+signalMask); 
  if(signalMask ===CCMCONSTANT.CCM_CAP_RTSCTS)
  {
    writePtr.rts = true;
  }
   else if(signalMask ===CCMCONSTANT.CCM_CAP_DTRDSR)
  {
    writePtr.dtr = true;
  }
}

function marshallReadCcmLineInfo(vStream,writePtr){
  var dataBits = vStream.ReadUInt8();
  var parityBit = vStream.ReadUInt8();
  var stopBits = vStream.ReadUInt8();
  
  switch(dataBits){
    case CCMCONSTANT.CCM_8_DATA:
      writePtr.dataBits="eight";
      break;
    case CCMCONSTANT.CCM_7_DATA:
      writePtr.dataBits="seven";
      break;
    default:
      writePtr.dataBits="eight";
  }
  writeHTML5Log(0,"SESSION:|:ICA:|:COM:|:ENGINE:|:Reading CCMLINE INFO DATABITS:"+dataBits);  
  
  switch(parityBit){
     case CCMCONSTANT.CCM_NONE_PARITY:
      writePtr.parityBit = "no";
      break;
    case CCMCONSTANT.CCM_ODD_PARITY:
      writePtr.parityBit = "odd";
      break;
    case CCMCONSTANT.CCM_EVEN_PARITY:
      writePtr.parityBit = "even";
      break;
    default:
      writePtr.parityBit = "no";
    
  }
  writeHTML5Log(0,"SESSION:|:ICA:|:COM:|:ENGINE:|:Reading CCMLINE INFO PARITYBIT:"+parityBit);  
  
  switch(stopBits){
     case CCMCONSTANT.CCM_1_STOP:
      writePtr.stopBits="one";
      break;
    case CCMCONSTANT.CCM_2_STOP:
      writePtr.stopBits="two";
      break;
    default:
      writePtr.stopBits="one";
    
  }
  writeHTML5Log(0,"SESSION:|:ICA:|:COM:|:ENGINE:|:Reading CCMLINE INFO STOPBITS:"+stopBits); 

}

function marshallReadCcmBufferSize(vStream,writePtr,txQueueSize,rxQueueSize){
    var infoTxQueueSize =  vStream.ReadUInt16();
    var infoRxQueueSize =  vStream.ReadUInt16();
  
}

/*Read the ReadSerial Request packet header*/
function marshallReadReadSerialRequest(vStream , writePtr) {
    writePtr.context=vStream.ReadUInt16();
    writePtr.size=vStream.ReadUInt16();
}

/*Write common replay packet header*/
function marshallWriteCcmPacketHeader(buffer , offset , readPtr) {
    buffer[offset++]=readPtr.h_type;
    buffer[offset++]=readPtr.mpxId;
    return offset;
}

/*Write EnumSerialreply packet header*/
function marshallWriteEnumSerialReply(buffer , offset , readPtr,enumStruct,portName) {
    offset=marshallWriteCcmPacketHeader(buffer,offset,readPtr.header);
    buffer[offset++]=readPtr.result & 0xff;
    buffer[offset++]=(readPtr.result>>8) & 0xff;
    buffer[offset++]=readPtr.numberOfPorts & 0xff;
    buffer[offset++]=(readPtr.numberOfPorts >>8) & 0xff;
    buffer[offset++]=readPtr.size & 0xff;
    buffer[offset++]=(readPtr.size>>8) & 0xff;
    
    buffer[offset++]=enumStruct.nameSize & 0xff;
    buffer[offset++]=enumStruct.pad & 0xff;
    buffer[offset++]=enumStruct.extraSize & 0xff;
    buffer[offset++]=(enumStruct.extraSize>>8) & 0xff;
    buffer[offset++]=enumStruct.flags & 0xff;
    buffer[offset++]=(enumStruct.flags>>8) & 0xff;
    buffer[offset++]=enumStruct.flags>>16 & 0xff;
    buffer[offset++]=(enumStruct.flags>>24) & 0xff;
    
    for(var i=0;i<portName.length;i++)
    {
      buffer[offset++] = portName.charCodeAt(i) & 0xff;
      //buffer[offset++] = (charCode>>8) & 0xff;
    }
    buffer[offset++] = 0;
    return offset;
   
}


/*Write OpenPrinter replay packet header*/
function marshallWriteOpenSerialReply(buffer , offset , readPtr,openContext) {
    offset=marshallWriteCcmPacketHeader(buffer,offset,readPtr.header);
    buffer[offset++]=readPtr.result & 0xff;
    buffer[offset++]=(readPtr.result>>8) & 0xff;
    buffer[offset++]=readPtr.context & 0xff;
    buffer[offset++]=(readPtr.context>>8) & 0xff;

    offset = marshallWriteCcmLineInfo(buffer,offset,openContext.lineInfo);

    offset = marshallWriteCcmBaudRate(buffer,offset,openContext.currentBaud);

    offset = marshallWriteCcmCapabilities(buffer,offset,openContext.capabilities);
   
    offset = marshallWriteCcmBufferSize(buffer,offset,openContext.queueSizes);
    return offset;
}

function marshallWriteAsyncSettingsReply(buffer,offset,readPtr){
  buffer[offset++] = readPtr.hType;
  buffer[offset++] = readPtr.mpxId;
  buffer[offset++] = readPtr.pad & 0xff;
  buffer[offset++] = (readPtr.pad>>8) & 0xff;
  offset= marshallWriteCcmChars(buffer,offset,readPtr.specialChars);
  offset= marshallWriteCcmEscapeChar(buffer,offset,readPtr.escapeChar);
  offset= marshallWriteCcmHandFlow(buffer,offset,readPtr.handFlow);
  offset= marshallWriteCcmTimeouts(buffer,offset,readPtr.timeouts);
    return offset;
}

function marshallWriteCcmLineInfo(buffer,offset,readPtr){
  
  buffer[offset++] = readPtr.dataBits;
  buffer[offset++] = readPtr.stopBits;
  buffer[offset++] = readPtr.parity;
  
  return offset;
}

function marshallWriteCcmBaudRate(buffer,offset,readPtr){
  
  buffer[offset++] = readPtr.baudRate& 0xff;
  buffer[offset++] = (readPtr.baudRate>>8)& 0xff;
  buffer[offset++] = (readPtr.baudRate>>16)& 0xff;
  buffer[offset++] = (readPtr.baudRate>>24)& 0xff;
  
  return offset;
}

function marshallWriteCcmCapabilities(buffer,offset,readPtr){
  
  buffer[offset++] = readPtr.macTxQueue & 0xff;
  buffer[offset++] = (readPtr.macTxQueue >>8)& 0xff;
  buffer[offset++] = readPtr.maxRxQueue & 0xff;
  buffer[offset++] = (readPtr.maxRxQueue >>8 )& 0xff;
  buffer[offset++] = readPtr.supportedBauds & 0xff;
  buffer[offset++] = (readPtr.supportedBauds >>8 ) & 0xff;
  buffer[offset++] = (readPtr.supportedBauds >>16 ) & 0xff;
  buffer[offset++] = (readPtr.supportedBauds >>24 ) & 0xff;
  buffer[offset++] = readPtr.capabilities& 0xff;
  buffer[offset++] = (readPtr.capabilities >>8) & 0xff;
  buffer[offset++] = readPtr.settableCaps& 0xff;
  buffer[offset++] = (readPtr.settableCaps >>8)& 0xff;
  buffer[offset++] = readPtr.dataBits& 0xff;
  buffer[offset++] = (readPtr.dataBits >>8)& 0xff;
  buffer[offset++] = readPtr.stopParity& 0xff;
  buffer[offset++] = (readPtr.stopParity >>8)& 0xff;
  
  return offset;
}

function marshallWriteCcmBufferSize(buffer,offset,readPtr){
  

  buffer[offset++] = readPtr.txQueueSize & 0xff ;
  buffer[offset++] = (readPtr.txQueueSize>>8) & 0xff ;
  buffer[offset++] = readPtr.rxQueueSize& 0xff ;
  buffer[offset++] = (readPtr.rxQueueSize >>8)& 0xff ;

  return offset;
}
function marshallWriteCcmChars(buffer,offset,readPtr){
  
  buffer[offset++] = readPtr.eOfChar;
  buffer[offset++] = readPtr.errorChar;
  buffer[offset++] = readPtr.breakChar;
  buffer[offset++] = readPtr.eventChar;
  buffer[offset++] = readPtr.xonChar;
  buffer[offset++] = readPtr.xoffChar;
  
  return offset;
}

function marshallWriteCcmEscapeChar(buffer,offset,readPtr){
  
  buffer[offset++] = readPtr.escapeChar;
  return offset;
}

function marshallWriteCcmHandFlow(buffer,offset,readPtr){
  
  buffer[offset++] = readPtr.controlHandShake & 0xff;
  buffer[offset++] = (readPtr.controlHandShake >>8) & 0xff;
   buffer[offset++] = (readPtr.controlHandShake >>16) & 0xff;
    buffer[offset++] = (readPtr.controlHandShake >>24) & 0xff;
  buffer[offset++] = readPtr.flowReplace & 0xff;
  buffer[offset++] = (readPtr.flowReplace >>8) & 0xff;
  buffer[offset++] = (readPtr.flowReplace >>16) & 0xff;
  buffer[offset++] = (readPtr.flowReplace >>24) & 0xff;
  buffer[offset++] = readPtr.xonLimit& 0xff;
  buffer[offset++] = (readPtr.xonLimit >>8)& 0xff;
  buffer[offset++] = readPtr.xoffLimit& 0xff;
  buffer[offset++] = (readPtr.xoffLimit>>8)& 0xff;
  
  
  return offset;
}

function marshallWriteCcmTimeouts(buffer,offset,readPtr){
  
  buffer[offset++] = readPtr.readIntervalTimeout& 0xff;
  buffer[offset++] = (readPtr.readIntervalTimeout >>8)& 0xff;
  buffer[offset++] = (readPtr.readIntervalTimeout >>16)& 0xff;
  buffer[offset++] = (readPtr.readIntervalTimeout >>24)& 0xff;
  buffer[offset++] = readPtr.readTotalTimeoutMultiplier;
  buffer[offset++] = (readPtr.readTotalTimeoutMultiplier >>8) & 0xff;
  buffer[offset++] = (readPtr.readTotalTimeoutMultiplier >>16) & 0xff;
  buffer[offset++] = (readPtr.readTotalTimeoutMultiplier >>24) & 0xff;
  buffer[offset++] = readPtr.readTotalTimeoutConstant & 0xff;
  buffer[offset++] = (readPtr.readTotalTimeoutConstant >>8) & 0xff;
  buffer[offset++] = (readPtr.readTotalTimeoutConstant >>16) & 0xff;
  buffer[offset++] = (readPtr.readTotalTimeoutConstant >>24) & 0xff;
  buffer[offset++] = readPtr.writeTotalTimeoutMultiplier&0xff;
  buffer[offset++] = (readPtr.writeTotalTimeoutMultiplier>>8)&0xff;
  buffer[offset++] = (readPtr.writeTotalTimeoutMultiplier>>16)&0xff;
  buffer[offset++] = (readPtr.writeTotalTimeoutMultiplier>>24)&0xff;
  buffer[offset++] = readPtr.writeTotalTimeoutConstant & 0xff;
  buffer[offset++] = (readPtr.writeTotalTimeoutConstant>>8) & 0xff;
  buffer[offset++] = (readPtr.writeTotalTimeoutConstant>>16) & 0xff;
  buffer[offset++] = (readPtr.writeTotalTimeoutConstant>>24) & 0xff;
  
  return offset;
}



/*Write ClosePrinter replay packet header*/
function marshallWriteCloseSerialReply(buffer , offset , readPtr) {
    offset=marshallWriteCcmPacketHeader(buffer,offset,readPtr.header);
    buffer[offset++]=readPtr.result & 0xff;
    buffer[offset++]=(readPtr.result>>8) & 0xff;
    return offset;
}

/*Write WritePrinter replay packet header*/
function marshallWriteWriteSerialReply(buffer , offset , readPtr) {
    offset=marshallWriteCcmPacketHeader(buffer,offset,readPtr.header);
    buffer[offset++]=readPtr.result & 0xff;
    buffer[offset++]=(readPtr.result>>8) & 0xff;
    buffer[offset++]=readPtr.amountWritten & 0xff;
    buffer[offset++]=(readPtr.amountWritten>>8) & 0xff;
    
     buffer[offset++]=0;
    buffer[offset++]=0;
    buffer[offset++]=0;
    buffer[offset++]=0;
    
    buffer[offset++]=CCMCONSTANT.CCM_DEFAULT_RXQUEUESIZE&0xff;
    buffer[offset++]=(CCMCONSTANT.CCM_DEFAULT_RXQUEUESIZE>>8)&0xff;
     buffer[offset++]=0;
    buffer[offset++]= 0
    
    return offset;
}

/*Write ReadSerial replay packet header*/
function marshallWriteReadSerialReply(buffer , offset , readPtr) {
    offset=marshallWriteCcmPacketHeader(buffer,offset,readPtr.header);
    buffer[offset++]=readPtr.result & 0xff;
    buffer[offset++]=(readPtr.result>>8) & 0xff;
    buffer[offset++]=readPtr.size & 0xff;
    buffer[offset++]=(readPtr.size>>8) & 0xff;
    
     buffer[offset++]= readPtr.lineStatus.lineError & 0xff;
    buffer[offset++]=  (readPtr.lineStatus.lineError>>8) & 0xff;
    buffer[offset++]=  readPtr.lineStatus.holdStatus & 0xff;
    buffer[offset++]=  (readPtr.lineStatus.holdStatus>>8) & 0xff;
    
    buffer[offset++]= (readPtr.lineStatus.inputCount) & 0xff;
    buffer[offset++]= (readPtr.lineStatus.inputCount>>8) & 0xff;
     buffer[offset++]= (readPtr.lineStatus.outputCount) & 0xff;
    buffer[offset++]= (readPtr.lineStatus.outputCount>>8) & 0xff;
    return offset;
}

/*Read the SetSerial Reply packet header*/
function marshallWriteSetSerialReply(buffer , offset , readPtr) {
    offset=marshallWriteCcmPacketHeader(buffer,offset,readPtr.header);
    buffer[offset++]=readPtr.result & 0xff;
    buffer[offset++]=(readPtr.result>>8) & 0xff;
    buffer[offset++]=readPtr.flags & 0xff;
    buffer[offset++]=(readPtr.flags>>8) & 0xff;
    buffer[offset++]=(readPtr.flags>>16) & 0xff;
    buffer[offset++]=(readPtr.flags>>24) & 0xff;
    return offset;
}

/*Write Capabilities the GetSerial Reply packet header*/
function marshallWriteGetSerialCapReply(buffer , offset , readPtr, capabilities) {
    offset=marshallWriteCcmPacketHeader(buffer,offset,readPtr.header);
    buffer[offset++]=readPtr.result & 0xff;
    buffer[offset++]=(readPtr.result>>8) & 0xff;
    buffer[offset++]=readPtr.infoSize & 0xff;
    buffer[offset++]=(readPtr.infoSize>>8) & 0xff;
    
    offset = marshallWriteCcmCapabilities(buffer,offset,capabilities);
   
  
    return offset;
}

/*Write ModemStatus in GetSerial Reply packet header*/
function marshallWriteGetSerialModemReply(buffer , offset , readPtr, modemStatus) {
    offset=marshallWriteCcmPacketHeader(buffer,offset,readPtr.header);
    buffer[offset++]=readPtr.result & 0xff;
    buffer[offset++]=(readPtr.result>>8) & 0xff;
    buffer[offset++]=readPtr.infoSize & 0xff;
    buffer[offset++]=(readPtr.infoSize>>8) & 0xff;
    
    buffer[offset++]= modemStatus & 0xff;
    buffer[offset++]= (modemStatus>>8) & 0xff;
    buffer[offset++]= (modemStatus>>16) & 0xff;
    buffer[offset++]= (modemStatus>>24) & 0xff;
   
  
    return offset;
}

/*Write ModemStatus in GetSerial Reply packet header*/
function marshallWriteGetAsyncModemReply(buffer , offset , readPtr) {
    
    buffer[offset++]= readPtr.header & 0xff;
    buffer[offset++]= readPtr.padding & 0xff;
    buffer[offset++]= (readPtr.context) & 0xff;
    buffer[offset++]= (readPtr.context>>8) & 0xff;
     
    buffer[offset++]= readPtr.modemStatus & 0xff;
    buffer[offset++]= (readPtr.modemStatus>>8) & 0xff;
    buffer[offset++]= (readPtr.modemStatus>>16) & 0xff;
    buffer[offset++]= (readPtr.modemStatus>>24) & 0xff;
   
    return offset;
}

