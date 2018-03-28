/* Packet Header */
function CpmPacketHeader() {
    this.h_type  = -1;
    this.mpxId   = -1;
    this.initialize=function (h_type , mpxId) {
        this.h_type=h_type;
        this.mpxId=mpxId;
    };
} 

/*ENUMPRINTER REQUEST packet Header*/
function EnumPrinterRequest() {
    this.header=new CpmPacketHeader();
    this.index=-1;
    this.size=-1;
}

/*CONNECT2 REQUEST packet Header*/
function Connect2Request() {
    this.header=new CpmPacketHeader();
    this.packetSize=-1;
    this.lowerVersion=-1;
    this.higherVersion=-1;
    this.flags=-1;
}
/*OPENPRINTER REQUEST packet Header*/
function OpenPrinterRequest() {
    this.header=new CpmPacketHeader();
    this.nameSize=-1;
    this.accessMode=-1;
}

/*CLOSEPRINTER REQUEST packet Header*/
function ClosePrinterRequest() {
    this.header=new CpmPacketHeader();
    this.context=-1;
}

/*WRITEPRINTER REQUEST packet Header*/
function WritePrinterRequest() {
    this.header=new CpmPacketHeader();
    this.context=-1;
    this.size=-1;
}

/*ENUMPRINTER_REPLY packet*/
function EnumPrinterReply() {
    this.header=new CpmPacketHeader();
    this.result=-1;
    this.numberOfPrinter=-1;
    this.size=-1;
}
/*OPENPRINTER REPLY packet Header*/
function OpenPrinterReply() {
    this.header = new CpmPacketHeader();
    this.result = -1;
    this.context = -1;
}

/*CLOSEPRINTER REPLY packet header*/
function ClosePrinterReply() {
    this.header=new CpmPacketHeader();
    this.result=-1;
}

/*WRITEPRINTER REPLY packet Header*/
function WritePrinterReply() {
    this.header=new CpmPacketHeader();
    this.result=-1;
    this.size=-1;
}
