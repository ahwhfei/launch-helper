// Copyright 2015 Citrix Systems, Inc. All rights reserved.


//EndPointCapability.prototype = new CGPCapability(CGPConstants.CGP_SERVICEID_CORE, CGPConstants.CGP_CAPABILITY_ENDPOINT_ADDRESS);


function EndPointCapability(){
    var addressType = CGPConstants.CGP_ADDRESSTYPE_DEFAULT;
    var addressData = new Uint8Array(0);
	
	this.serviceId 	= CGPConstants.CGP_SERVICEID_CORE;
	this.capabilityId=CGPConstants.CGP_CAPABILITY_ENDPOINT_ADDRESS;
	
    this.securityTicketEndPoint = function() {
        this.set(CGPConstants.CGP_ADDRESSTYPE_SECURITY_TICKET,
            new Uint8Array(0));
    };

    this.set = function(addType, addData)
    {
        addressType = addType;
        addressData = addData;
    };

    this.getBytes = function() {
        var size = 2 + 2 + 1 + 1 +
            1 + // address type
            getVarDataLength(addressData);

        var capability = new Uint8Array(size + getVarLenLength(size));

        var offset = 0;

        offset = cgpWriteVarLength(size, offset, capability );
        offset = writeUint16(this.serviceId, offset, capability);
        offset = writeUint16(this.capabilityId, offset, capability);
        capability[offset++] = 0; // reserved
        capability[offset++] = 0; // reserved
        capability[offset++] = addressType;
        offset = cgpWriteVarData(addressData, offset, capability);
        //console.log("End Point Capability is : ", capability);
        return capability;
    };
}
