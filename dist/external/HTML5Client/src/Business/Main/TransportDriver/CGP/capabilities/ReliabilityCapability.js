// Copyright 2015 Citrix Systems, Inc. All rights reserved.

//ReliabilityCapability.prototype  = new CGPCapability(CGPConstants.CGP_SERVICEID_CORE, CGPConstants.CGP_CAPABILITY_SESSION_RELIABILITY);


function ReliabilityCapability(){

	this.serviceId 	= CGPConstants.CGP_SERVICEID_CORE;
	this.capabilityId=CGPConstants.CGP_CAPABILITY_SESSION_RELIABILITY;
	
    var preferredVersion        = 1;
    var minimalVersion          = 1;
    var csAckAlgorithm          = CGPConstants.CGP_RELIABILITY_ACKING_ALGORITHM_N_MESSAGES_PER_ACK;
    var csAckData               = new Uint8Array(2);
    var scAckAlgorithm          = CGPConstants.CGP_RELIABILITY_ACKING_ALGORITHM_N_MESSAGES_PER_ACK;
    var scAckData               = new Uint8Array(2);
    this.nextMessageNumber      = 0;
    this.reconnectTicketVersion = 2;
    this.reconnectTicket        = new Uint8Array(0);
    var channelOpenRequests     = [];
    var reconnectFlags          = 0;
    writeUint16(CGPConstants.CGP_DEFAULT_MESSAGES_PER_ACK, 0, csAckData);
    writeUint16(CGPConstants.CGP_DEFAULT_MESSAGES_PER_ACK, 0, scAckData);
    this.set= function(ticketVersion, ticket, nextMessage, openRequests) {
        preferredVersion            = 1;
        minimalVersion              = 1;
        csAckAlgorithm              = CGPConstants.CGP_RELIABILITY_ACKING_ALGORITHM_N_MESSAGES_PER_ACK;
        csAckData                   = new Uint8Array(2);
        scAckAlgorithm              = CGPConstants.CGP_RELIABILITY_ACKING_ALGORITHM_N_MESSAGES_PER_ACK;
        scAckData                   = new Uint8Array(2);
        this.nextMessageNumber      = nextMessage;
        this.reconnectTicketVersion = ticketVersion;
        this.reconnectTicket        = ticket != null ? ticket : new Uint8Array(0);
        channelOpenRequests         = openRequests;
        reconnectFlags              = ticket != null ? 1 : 0;
        writeUint16(CGPConstants.CGP_DEFAULT_MESSAGES_PER_ACK, 0, csAckData);
        writeUint16(CGPConstants.CGP_DEFAULT_MESSAGES_PER_ACK, 0, scAckData);

    };

    /**
     * Create a this structure from a capability block.
     */
    this.read= function(data) {
        preferredVersion            = data.readUInt8();
        minimalVersion              = data.readUInt8();
        csAckAlgorithm              = data.readUInt8();
        csAckData                   = data.copyVarData();
        scAckAlgorithm              = data.readUInt8();
        scAckData                   = data.copyVarData();
        this.nextMessageNumber      = data.readUInt32();
        reconnectFlags              = data.readUInt8();
        this.reconnectTicketVersion = data.readUInt8();
        this.reconnectTicket        = data.copyVarData();
        var noOpenRequests          = data.readVarInt();
        channelOpenRequests         = new Array(noOpenRequests);

        writeHTML5Log(0, " SESSION :|: CGP :|: CGP-CORE :|: INFO:|: RECONNECT FLAG is " + reconnectFlags);
        for(var i = 0; i < noOpenRequests; i++) {
            var oldOffset   = data.offset;
            var oldLength   = data.length;
            var length      = data.readVarInt();
            length += oldOffset - data.offset;
            data.offset = oldOffset;
            data.length = oldLength;
            channelOpenRequests[i] = data.copyData(length);
        }
        return this;
    };

    this.getBytes = function() {
        var size = 2 + 2 + 1 + 1 + // service id, capability id, 2 x reserved
            1 + 1 + // pref version, min version
            1 + getVarDataLength(csAckData) +
            1 + getVarDataLength(scAckData) +
            4 + 1 + // next message number, reconnect flags
            1 + getVarDataLength(this.reconnectTicket) +
            getVarLenLength(channelOpenRequests.length);

        // Calculate length of open requests
        for(var i = 0; i < channelOpenRequests.length; i++) {
            size += channelOpenRequests[i].length;
        }

        var capability = new Uint8Array(getVarLength(size));

        var offset = 0;

        offset = cgpWriteVarLength(size, offset, capability);
        offset = writeUint16(this.serviceId, offset, capability);    // 0
        offset = writeUint16(this.capabilityId, offset, capability); // 5
        capability[offset++] = 0; // reserved
        capability[offset++] = 0; // reserved
        capability[offset++] = preferredVersion;
        capability[offset++] = minimalVersion;

        capability[offset++] = csAckAlgorithm;
        offset = cgpWriteVarData(csAckData, offset, capability);

        capability[offset++] = scAckAlgorithm;
        offset = cgpWriteVarData(scAckData, offset, capability);

        offset = CgpEncodeLong(this.nextMessageNumber, offset, capability);
        capability[offset++] = reconnectFlags;

        capability[offset++] = this.reconnectTicketVersion;
        offset = cgpWriteVarData(this.reconnectTicket, offset, capability);

        offset = cgpWriteVarLength(channelOpenRequests.length, offset, capability);

        for(i = 0; i < channelOpenRequests.length; i++) {
            Utility.CopyArray(channelOpenRequests[i], 0, capability, offset, channelOpenRequests[i].length);
            offset += channelOpenRequests[i].length;
        }
        //console.log("Reliability Capability is : ", capability);
        return capability;
    };
}
