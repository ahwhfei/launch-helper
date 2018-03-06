// Copyright 2015 Citrix Systems, Inc. All rights reserved.

//KeepAliveCapability.prototype = new CGPCapability(CGPConstants.CGP_SERVICEID_CORE, CGPConstants.CGP_CAPABILITY_KEEP_ALIVES);

function KeepAliveCapability(){
    var clientToServerInterval = 3000;
    var serverToClientInterval = 3000;
	
	this.serviceId 	= CGPConstants.CGP_SERVICEID_CORE;
	this.capabilityId=CGPConstants.CGP_CAPABILITY_KEEP_ALIVES;
	
    this.set = function(cToSInterval , sToCInterval) {
        clientToServerInterval = cToSInterval;
        serverToClientInterval = sToCInterval;
    };

    this.read = function(data) {
        clientToServerInterval = data.readUInt32();
        serverToClientInterval = data.readUInt32();
        return this;
    };

    this.getBytes = function() {
        var SIZE = 14;
        var capability = new Uint8Array(SIZE + getVarLenLength(SIZE));

        var offset = 0;
        offset = cgpWriteVarLength(SIZE, offset, capability);
        offset = writeUint16(this.serviceId, offset, capability);
        offset = writeUint16(this.capabilityId, offset, capability);
        capability[offset++] = CGPConstants.CGP_RESERVED; // reserved byte
        capability[offset++] = CGPConstants.CGP_RESERVED; // reserved byte

        offset = writeUint32(clientToServerInterval, offset, capability);
        offset = writeUint32(serverToClientInterval, offset, capability);
        //console.log("Keep Alive Capability is : ", capability);
        return capability;
    };
}
