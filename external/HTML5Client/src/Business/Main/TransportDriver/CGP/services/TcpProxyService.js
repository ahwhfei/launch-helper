// Copyright 2015 Citrix Systems, Inc. All rights reserved.
/*
	This should actually be using a Prototype Inheritance model.
	But at this time too risky to change. Should be handled in next release.
*/
var TcpProxyService = new CGPService("Citrix.TcpProxyService", 1);

    TcpProxyService.CGP_TCPPROXY_PROTOCOL_UNKNOWN     = 0;
    TcpProxyService.CGP_TCPPROXY_PROTOCOL_UNSPECIFIED = 1;
    TcpProxyService.CGP_TCPPROXY_PROTOCOL_MIXED       = 2;
    TcpProxyService.CGP_TCPPROXY_PROTOCOL_ICA         = 3;
    TcpProxyService.CGP_TCPPROXY_PROTOCOL_HTTP        = 4;
    TcpProxyService.CGP_TCPPROXY_PROTOCOL_RDP         = 5;

    TcpProxyService.CONNECT_STATUS_ACCEPTED                 = 0;
    TcpProxyService.CONNECT_STATUS_INVALID_PARAMETER_BLOCK  = 1;
    TcpProxyService.CONNECT_STATUS_USER_PROGRAM_ERROR       = 2;
    TcpProxyService.CONNECT_STATUS_DESTINATION_UNRESOLVABLE = 3;
    TcpProxyService.CONNECT_STATUS_DESTINATION_REFUSED      = 4;
    TcpProxyService.CONNECT_STATUS_DESTINATION_TIMEOUT      = 5;
    TcpProxyService.CONNECT_STATUS_CORE_FAILURE             = 6;

    TcpProxyService.CONNECTION_CLOSE_NORMAL  = 0;
    TcpProxyService.CONNECTION_CLOSE_SESSION = 1;
    TcpProxyService.CONNECTION_CLOSE_ERROR   = 2;

    TcpProxyService.NAME    = "Citrix.TcpProxyService";
    TcpProxyService.VERSION = 1;

    
    var consumers = {};
	TcpProxyService.dataArrived= function(channel, data) {
        var dc = consumers[channel];
        if (dc != null) {
            dc(data);
        }
    };
	TcpProxyService.WriteStream = function(){};
    TcpProxyService.openConnection = function(host, port, rec)
    {
        var header = makeChannelOpenHeader(stringToBytes(host + ":" + port),
                                              TcpProxyService.CGP_TCPPROXY_PROTOCOL_ICA);

        var c = this.serviceToCore.openChannel(this, false, CGPConstants.CGP_CHANNEL_PRIORITY_REALTIME, header);

        consumers[c] =  rec;

        this.WriteStream = c.writeData;
    }

    function makeChannelOpenHeader(hostAddress, protocolType) {
        var hdr = new Uint8Array(1 + getVarLenLength(hostAddress.length) +
                              hostAddress.length + 2);

        var offset = 0;

        hdr[offset++] = TcpProxyService.VERSION;
        offset = cgpWriteVarLength(hostAddress.length, offset, hdr);
        Utility.CopyArray(hostAddress, 0, hdr, offset, hostAddress.length);
        offset += hostAddress.length;
        offset += writeUint16(protocolType, offset, hdr);
        return hdr;
    }





