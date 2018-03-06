// Copyright 2004 Citrix Systems, Inc. All rights reserved.

//var capBufferOffset = 0;
var CGPBufferOffset =0;										// This is pointer to the CGP  Buffer.
var capReliability = CGPConstants.CGP_TRUE;
var capKeepAlives = CGPConstants.CGP_TRUE;
var capSecurityTicket = CGPConstants.CGP_TRUE;
var capBindServices = CGPConstants.CGP_TRUE;

function CGPCapability(svcId, capId){
	this.serviceId 		= svcId;
	this.capabilityId 	= capId;
}
