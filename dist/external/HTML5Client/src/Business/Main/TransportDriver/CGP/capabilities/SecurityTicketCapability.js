// Copyright 2015 Citrix Systems, Inc. All rights reserved.

//SecurityTicketCapability.prototype = new CGPCapability(CGPConstants.CGP_SERVICEID_CORE, CGPConstants.CGP_CAPABILITY_SECURITY_TICKET);
function SecurityTicketCapability(tcktType,tcktData){
    this.ticketType = tcktType;
    this.ticketData = tcktData;
	
	this.serviceId 	= CGPConstants.CGP_SERVICEID_CORE;
	this.capabilityId=CGPConstants.CGP_CAPABILITY_SECURITY_TICKET;
	
    this.set  = function(tktType,tktData) {
        this.ticketType = tktType;
        this.ticketData = tktData;
    };

    this.read = function(data) {
        this.ticketType = data.readUInt8();
        this.ticketData = data.copyVarData();
        return this;
    };

    this.getBytes = function() {
		/*	We get STA from Server but we store it in ByteFormat.
			So while reconnecting or reading Data there would be
			conflict on the type of data we read.
			Validating the type would fix this.
		*/
        var ticketByte;
        if((this.ticketData instanceof  String) || (typeof this.ticketData == "string")){
            ticketByte = stringToBytes(this.ticketData);
        } else {
            ticketByte = this.ticketData;
        }
        var size        = 7 + getVarDataLength(ticketByte);
        var capability  = new Uint8Array(getVarLength(size));
        var offset      = 0;
        offset = cgpWriteVarLength(size, offset, capability);
        offset = writeUint16(this.serviceId, offset, capability);
        offset = writeUint16(this.capabilityId, offset, capability);
        capability[offset++] = CGPConstants.CGP_RESERVED; // reserved byte
        capability[offset++] = CGPConstants.CGP_RESERVED; // reserved byte
        capability[offset++] = this.ticketType;
        offset = cgpWriteVarData(ticketByte, offset, capability);;
        //console.log("Security Ticket Capability is : ", capability);
        return capability;
    };
}
