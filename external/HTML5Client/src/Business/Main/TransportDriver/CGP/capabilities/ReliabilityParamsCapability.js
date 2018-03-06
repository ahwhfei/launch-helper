// Copyright 2016 Citrix Systems, Inc. All rights reserved.

function ReliabilityParamsCapability(){
    var blockVersion = 1;
    var reliabilityTimeOut = 180;	// default.
	var UIFlags = CGPConstants.CGP_RELIABILITY_UIFLAG_DIMMING;
	var UIDimmingPercentage = 25;	// default.
	var estimatedTCPTimeout = 10;	//Server ignores this value anyway.
	this.serviceId		=	CGPConstants.CGP_SERVICEID_CORE;
	this.capabilityId	=	CGPConstants.CGP_CAPABILITY_RELIABILITY_PARAMS;
	//this.capabilityId	=	CGPConstants.CGP_CAPABILITY_KEEP_ALIVES;
	
	this.getReliabilityTimeout = function(){
		return reliabilityTimeOut; 
	};
	
	this.getUIFlag = function(){
		return UIFlags; 
	};

	this.getUIDimmingPercentage = function(){
		return UIDimmingPercentage; 
	};
	
	this.getEstimatedTCPTimeout = function(){
		return estimatedTCPTimeout; 
	};
	
    this.read = function(data) {
        blockVersion = data.readUInt8();
        reliabilityTimeOut	= data.readUInt16();
		UIFlags				= data.readUInt16();
		UIDimmingPercentage = data.readUInt16();
		estimatedTCPTimeout = data.readUInt16();
		//console.log("The server sent values of BLOCK VERSION:" + blockVersion + " RELIABILITY TIMEOUT : " + reliabilityTimeOut + " UI FLAGS : " + UIFlags + " UI DIMMING PERCENTAGE : " + UIDimmingPercentage + " TCP TIMEOUT: " + estimatedTCPTimeout);
        return this;
    };

    this.getBytes = function() {
		writeHTML5Log(0, "SESSION :|: CGP :|: ReliabilityParamsCapability :|: INFO:|:Adding Reliability Params Capability to Bind Request.");
		var size = 15;
        var capability = new Uint8Array(getVarLength(size));
        var offset      = 0;
        offset = cgpWriteVarLength(size, offset, capability);
		
        offset = writeUint16(this.serviceId, offset, capability);
        offset = writeUint16(this.capabilityId, offset, capability);
        capability[offset++] = CGPConstants.CGP_RESERVED; // reserved byte
        capability[offset++] = CGPConstants.CGP_RESERVED; // reserved byte
        capability[offset++] = blockVersion;
		
		offset = writeUint16(reliabilityTimeOut, offset, capability);
		offset = writeUint16(UIFlags, offset, capability);
		offset = writeUint16(UIDimmingPercentage, offset, capability);
		offset = writeUint16(estimatedTCPTimeout, offset, capability);
		
        return capability;
    };
}
