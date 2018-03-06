/**
 * Created by Goutham on 3/17/2015.
 */

function CGPSocket(socket,  OnConnectCallback, OnReceiveCallback, OnCloseCallback, OnErrorCallback, callBackWrapper, SRTimeOut){
    var tcpSvc          = TcpProxyService;
    var connected       = false;
    var cgpCore         = null;         // This is object to Core
    writeHTML5Log(0, "INIT :|: CONNECTION :|: CGP SOCKET :|: INFO :|: Start Initializing CGP Socket");
    var user            = this;         // We are assuming user as CGPSocket
                                        // itself eliminating the userPart to access CGPSocket internal functions

    // Use this to send Channel Open Request only once
    var channelOpenRequestSent = false;
    var serverAddress;
    var serverPort;

    /*  This is the first function that will be hit when the CGP Channel is being created.
     This function Has the handshake Part along with bind and validation of responses until Handshake is successful
     In Short this is an entry to Channel.
     */
    this.OnConnect 	= function(host, port, securityTicketData){
        // The CGP Core tries to connect and establish a CGP connection to the server.
        //cgpCore = socket.Send;
        //console.log("Sending CGP Core Connect");
        //channelOpenRequestSent = false;
        if(coreState == CORESTATE_UNCONNECTED) {
            //serverAddress = host;
            //serverPort = port;
			// TODO The win32 client always uses 127.0.0.1 as the address to connect
            // to so we do too, seems a bit short sighted to me.
			serverAddress = "127.0.0.1";
			serverPort = 1494;
            // Ideally we Should be sending an array of Services
            // But we know we have only 1 service and 1 channel.
            // It kind of makes it simpler.
            cgpCore = new CGPCore(user, [tcpSvc], socket, callBackWrapper, SRTimeOut);
            if(securityTicketData){
                cgpCore.setSecurityTicket(CGPConstants.CGP_TICKET_TYPE_STA, securityTicketData);
            }
            cgpCore.connect();
        } else{
			writeHTML5Log(0, "SESSION :|: RE-CONNECTION :|: CGP SOCKET :|: INFO :|: Trying to Resume");
            cgpCore.resume();
        }
        writeHTML5Log(0, "SESSION :|: CGP :|: CGP SOCKET :|: INFO :|: TCP Handshake Sent!!!!");
    };
    this.WriteByte = function writeByte(data, off, len)
    {
        //console.log("Sending Data From Channel to Socket: ", data);
        tcpSvc.WriteStream(data, off, len);
    };
    this.OnDisonnect    = OnCloseCallback;
    this.Send 		    = socket.Send;
    this.OnReceiveCallback = function(aEvent){
        //console.log("On Receive Call back of CGP Channel Hit");
        var receivedData = aEvent.data;
        var cgpData = new Uint8Array(receivedData);
        //console.log("CGP Data Received is : ", cgpData);
        cgpCore.consumeData(cgpData, 0, cgpData.length);
        if(!channelOpenRequestSent){
            writeHTML5Log(0, "SESSION :|: CGP :|: CGP SOCKET :|: INFO :|: CGP HANDSHAKE SUCCESSFUL. Sending CHANNEL OPEN REQUEST");
            tcpSvc.openConnection(serverAddress, serverPort, OnReceiveCallback);
            channelOpenRequestSent = true;
            writeHTML5Log(0, "SESSION :|: CGP :|: CGP SOCKET :|: INFO :|: TCP Handshake Complete!!!!");
        }
    };

    this.Disconnect = socket.Disconnect;

	
	this.close = function(){
        writeHTML5Log(0, "SESSION :|: TERMINATE :|: CGP SOCKET :|: INFO :|: CLOSING HTML5 SESSION");
        cgpCore.Close();
    }
	
    this.Reconnect = function(){
        cgpCore.resume();
    };
	
	this.Suspend = function(){
		cgpCore.Suspend();
	};

	this.getReliabilityParams = function(){
        if(cgpCore != null)
		    return cgpCore.getReliabilityParams();
        else
            return 0;
	};
    socket.setReceiveCallback(this.OnReceiveCallback);
    this.OnError 		= OnErrorCallback;
    writeHTML5Log(0, "INIT :|: CONNECTION :|: CGP SOCKET :|: INFO :|: Finish Initializing CGP SOCKET");

    /*
     Implement user related functions here
     */

    this.sessionAccepted = function(){
        connected = true;
    };

    this.sessionResumed = function(){
        connected = true;
    };
}
