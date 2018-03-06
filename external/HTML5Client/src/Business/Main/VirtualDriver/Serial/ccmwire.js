/* Packet Header */
function CcmPacketHeader() {
    this.h_type  = -1;
    this.mpxId   = -1;
    this.initialize=function (h_type , mpxId) {
        this.h_type=h_type;
        this.mpxId=mpxId;
    };
}
function LineStatus(){
  this.lineError=0;
  this.holdStatus=0;
  this.inputCount=0;
  this.outputCount=0;
}

/*ENUMSERIAL REQUEST packet Header*/
function EnumSerialRequest() {
    this.header=new CcmPacketHeader();
    this.index=-1;
    this.size=-1;
}

/*CONNECTSERIAL REQUEST packet Header*/
function ConnectSerialRequest() {
    this.header=new CcmPacketHeader();
    this.packetSize=-1;
    this.lowerVersion=-1;
    this.higherVersion=-1;
    this.flags=-1;
}
/*OPENPSERIAL REQUEST packet Header*/
function OpenSerialRequest() {
    this.header=new CcmPacketHeader();
    this.nameSize=0;
    this.accessMode=0;
    this.portName ="";
}

/*CLOSESERIAL REQUEST packet Header*/
function CloseSerialRequest() {
    this.header=new CcmPacketHeader();
    this.context=-1;
}

/*WRITESERIAL REQUEST packet Header*/
function WriteSerialRequest() {
    this.header=new CcmPacketHeader();
    this.context=0;
    this.size=0;
}

/*READSERIAL REQUEST packet Header*/
function ReadSerialRequest() {
    this.header=new CcmPacketHeader();
    this.context=-1;
    this.size=-1;
}


/*SETSERIAL REQUEST packet Header*/
function SetSerialRequest() {
    this.header=new CcmPacketHeader();
    this.context=-1;
    this.infoType=-1;
    this.infoSize=-1;
}

/*SETSERIAL REPLY packet Header*/
function SetSerialReply() {
    this.header=new CcmPacketHeader();
    this.result=-1;
    this.flags=-1;
}

/*GETSERIAL REQUEST packet Header*/
function GetSerialRequest() {
    this.header=new CcmPacketHeader();
    this.context=-1;
    this.infoType=-1;
    this.maxInfoSize=-1;
    this.flags =-1;
}

/*GETSERIAL REPLY packet Header*/
function GetSerialReply() {
    this.header=new CcmPacketHeader();
    this.result=-1;
    this.infoSize=-1;
}

/*GETASYNC REPLY packet Header*/
function GetAsyncReply(){
    this.header =0 ;
    this.padding =0 ;
    this.context = -1;
    this.modemStatus = 0;
}


/*ENUMSERIAL_REPLY packet*/
function EnumSerialReply() {
    this.header=new CcmPacketHeader();
    this.result=-1;
    this.numberOfPorts=-1;
    this.size=-1;
}

/*ENUMPORT_STRUCT*/
function EnumPortStruct(){
  this.nameSize =0;
  this.pad =0;
  this.extraSize=0;
  this.flags= 0;
}

/*OPENSERIAL REPLY packet Header*/
function OpenSerialReply() {
    this.header = new CcmPacketHeader();
    this.result = -1;
    this.context = -1;
}

/*CLOSESERIAL REPLY packet header*/
function CloseSerialReply() {
    this.header=new CcmPacketHeader();
    this.result=-1;
}

/*WRITESERIAL REPLY packet Header*/
function WriteSerialReply() {
    this.header=new CcmPacketHeader();
    this.result=0;
    this.amountWritten=0;
}

/*READSERIAL REPLY packet Header*/
function ReadSerialReply() {
    this.header=new CcmPacketHeader();
    this.result=-1;
    this.size=-1;
    this.lineStatus= new LineStatus();
}

function CcmLineInfo(){
  
  this.dataBits=0;
  this.stopBits=0;
  this.parity=0;
}

function CcmBaudRate(){
  this.baudRate=0;
}
function CcmCapabilities(){
  this.macTxQueue=0;
  this.maxRxQueue=0;
  this.supportedBauds=0;
  this.capabilities=0;
  this.settableCaps=0;
  this.dataBits=0;
  this.stopParity =0;
  
}
function CcmBufferSize(){
  this.txQueueSize=0;
  this.rxQueueSize =0;
}
function CcmChars(){
  this.eOfChar=0;
  this.errorChar=0;
  this.breakChar=0;
  this.eventChar=0;
  this.xonChar=0;
  this.xoffChar=0;
}
function CcmEscapeChar(){
  this.escapeChar=0;
}
function CcmHandFlow(){
  this.controlHandShake=0;
  this.flowReplace=0;
  this.xonLimit=0;
  this.xoffLimit=0;
}
function CcmTimeouts(){
  this.readIntervalTimeout=0;
  this.readTotalTimeoutMultiplier=0;
  this.readTotalTimeoutConstant=0;
  this.writeTotalTimeoutMultiplier=0;
  this.writeTotalTimeoutConstant=0;
  
}

function CcmAsyncSettings(){
  this.hType=0;
  this.mpxId=0;
  this.pad=0;
  
  this.specialChars = new CcmChars();
  this.escapeChar = new CcmEscapeChar();
  this.handFlow = new CcmHandFlow();
  this.timeouts = new CcmTimeouts();
}

function hostRequest(){
  
  this.requestState=0;
  this.mpxId=0;
  this.result=0;
  this.amountRequest=0;
  this.amountXfer=0;
  this.info=0;
}

function OpenContext(){
  
  this.state=0;
  this.deferredClose=0;
  this.context=0;
  this.closeMpxId=0;
  this.connectionId=0;
  this.readMpxId = -1;
  
  this.InputBuffer = new Uint8Array(CCMCONSTANT.CCM_DEFAULT_RXQUEUESIZE); // Let us use fixed array buffer for receiving reads
  this.OutputBuffer = [];
  this.InputBufferLength = 0;
  
  this.readInfo=new hostRequest();
  this.writeInfo=new hostRequest();
  this.eventInfo=new hostRequest();
  
  this.lineInfo = new CcmLineInfo();
  this.currentBaud = new CcmBaudRate();
  this.capabilities = new CcmCapabilities();
  this.queueSizes = new CcmBufferSize();
  
  this.specialChars = new CcmChars();
  this.escapeChar= new CcmEscapeChar();
  this.handFlow = new CcmHandFlow();
  this.timeouts = new CcmTimeouts();
  
  this.readWakeup=0;
  this.lastModemStatus=0;
  this.eventMask=0;
  this.wakeEvents=0;
  this.lineError=0;
  this.escapeModemStatus=0;
  this.escapeLineStatus=0;
  
  this.hPort=0;
  this.portNumber=0;
  this.wordLength=0;
  
  this.result=0;
  
  this.lastErrorStatus = "";
}
