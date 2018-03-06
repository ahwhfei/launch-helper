function SocksV5(socket, icaData, ExchangeIcaDetectString, tdReceiveCallback , callBackWrapper1 )
{
	var SOCKS_CONNECT          = 1;
    var SOCKS_ADDR_TYPE_IPV4   = 1;
    var SOCKS_ADDR_TYPE_DOM    = 3;
    var SOCKS_ADDR_TYPE_IPV6   = 4;
    var SOCKS_VERSION          = 5;
    var SOCKS_AUTH_PACKET      = 1;
    var SOCKS4_REPLY           = 0;
    var SOCKS_TRUE             = 0;
    var SOCKS_BASIC_METHOD     = 0;
    var SOCKS_AUTH_METHOD      = 2;
    var SOCKS4_RESPONSE_LENGTH    = 8;
    var SOCKS5_AUTH_HEADER_LENGTH = 4;
    var SOCKS5_RESPONSE_LENGTH    = 2;

    var SOCKS_REALM = String("SOCKS");

	var STATUS_INITIALIZING 			= 0;
	var STATUS_METHODS_SENT				= 1;
	var STATUS_METHODS_RESPONSE			= 2;
	var STATUS_AUTH_SENT				= 3;
	var STATUS_AUTH_RESPONSE			= 4;
	var STATUS_SOCKS_CONNECT_SENT		= 5;
	var STATUS_SOCKS_CONNECT_RESPONSE 	= 6;
	var STATUS_HANDSHAKE_COMPLETE 		= 7;
	var connectionState 				= STATUS_INITIALIZING;
	
	var myself = this;
	
	this.serverConnector = socket;	
	this.Send = null;
	var gLaunchData = icaData;
	var callBackWrapper = callBackWrapper1 ;
	this.OnConnect = function (host, port, securityTicketData){
		writeHTML5Log(0, " INIT :|: PROTOCOL :|: SOCKSV5 :|: SOCKET CONNECTED. INITIATING SOCKS HANDSHAKE");
		this.Send = myself.serverConnector.Send;
		myself.sendMethods(host, port, securityTicketData);
	};


	this.onReceiveCallback = function (aEvent)
	{
		switch (connectionState)
		{
			case STATUS_METHODS_SENT:
				myself.checkResponse(aEvent.data);
				if (connectionState == STATUS_AUTH_RESPONSE) {
					// Send SOCKS connect packet
					myself.sendConnect();
				}
				break;
				
			case STATUS_AUTH_SENT:
				myself.readAuthenticationResponse(aEvent.data);
				if (connectionState == STATUS_AUTH_RESPONSE) {
					// Send SOCKS connect packet
					myself.sendConnect();
				}
				break;
				
			case STATUS_SOCKS_CONNECT_SENT:
				myself.readConnectReply(aEvent.data);
				break;
				
			case STATUS_HANDSHAKE_COMPLETE:
				//tdReceiveCallback(aEvent);
				socket.setReceiveCallback(tdReceiveCallback);
				break;
		}
		
	};
	
	this.sendMethods = function() {
		if( callBackWrapper.getBrowserType( ) == BrowserInfo["FIREFOX"] )
		{
				// HACK HACK HACK ....Firefox buffers first packet if it is sent in the onopen Event, workaround for that is to send packet after timeout.
		// See https://bugzilla.mozilla.org/show_bug.cgi?id=761061 for further details
			setTimeout(function() {
				var buffer = new Uint8Array(4);
		        // Currently only support 2 possible methods.
		
		        buffer[0] = SOCKS_VERSION;
		        buffer[1] = 2; // number of auth methods
		        buffer[2] = SOCKS_BASIC_METHOD;
		        buffer[3] = SOCKS_AUTH_METHOD;
			    myself.serverConnector.Send(buffer);
				connectionState = STATUS_METHODS_SENT;
				// Maximum buffer size here is 4 bytes
				}, 50);
		}
		else
		{
			 var buffer = new Uint8Array(4);
	        // Currently only support 2 possible methods.
	
	        buffer[0] = SOCKS_VERSION;
	        buffer[1] = 2; // number of auth methods
	        buffer[2] = SOCKS_BASIC_METHOD;
	        buffer[3] = SOCKS_AUTH_METHOD;
		    myself.serverConnector.Send(buffer);
			connectionState = STATUS_METHODS_SENT;
			// Maximum buffer size here is 4 bytes
		}
       
   };
	
	this.checkResponse = function(data) {
				
		var responseData  = new Uint8Array(data);
		if (responseData.length == SOCKS5_RESPONSE_LENGTH) {
            // usually 2 bytes
            //   first byte  -version and the
            //   second byte -accepted method.
            if(responseData[0] != SOCKS_VERSION) {
				// Throw error
            }
        }
		else {
			// Throw Error
		}
		
		switch(responseData[1]) {
            case SOCKS_BASIC_METHOD:
                // Success, we're connected
				connectionState = STATUS_AUTH_RESPONSE;
                return true;

            case SOCKS_AUTH_METHOD:
                // TODO VINEET Prompt if we want user to enter credentials again...
                myself.sendAuthentication();
				connectionState = STATUS_AUTH_SENT;
				//connectionState = STATUS_METHODS_SENT;
                return true;

            default:
                // Throw Error			
		}
	};
	
	this.sendAuthentication = function() {
	
        var userBytes, passBytes;

		// TODO Credentials can be in ICA file or user specified later so need to handle both here.. 
        userBytes = gLaunchData["Username"]; // TODO Do we need Domain also here????
        passBytes = gLaunchData["ClearPassword"];

        // username and password not present for anonymous sessions. Use empty string as WD uses the same.
        if(!userBytes)
        {
            userBytes = "";
        }
		if(!passBytes)
        {
            passBytes = "";
        }

        // If the username or password are more than 255 bytes long we truncate them.
        var userBytesLength = Math.min(userBytes.length, 0xff);
        var passBytesLength = Math.min(passBytes.length, 0xff);
	    var buffer = new Uint8Array(userBytesLength+passBytesLength+3);

	    var index = 0;
        buffer[index++] = SOCKS_AUTH_PACKET;
        buffer[index++] = userBytesLength;
		for (var i=0; i<userBytesLength; ++i) {
			buffer[index++] = userBytes.charCodeAt(i);
		}
        buffer[index++] = passBytesLength;
		for (var i=0; i<passBytesLength; ++i) {
			buffer[index++] = passBytes.charCodeAt(i);
		}
		
	    myself.serverConnector.Send(buffer);
		
	};
	
	this.readAuthenticationResponse = function(data) {
		var responseData  = new Uint8Array(data);
	
		if (responseData.length == 2 && responseData[1] == SOCKS_TRUE) {
			connectionState = STATUS_AUTH_RESPONSE;
		}
		else {
			// Throw Error
		}
	};
	
	this.sendConnect = function() {
		
		 var address = Utility.getAddress(gLaunchData['Address']);
		 
		 // Maximum buffer size here is 255 bytes
         var addressLength = Math.min(address.length, 0xff);
		 var buffer = new Uint8Array(addressLength+7);
        buffer[0] = SOCKS_VERSION;
        buffer[1] = SOCKS_CONNECT;
        buffer[2] = 0;

        // Buffer size so far 3 bytes

       if (Utility.isDottedQuad(address)) {
            buffer[3] = SOCKS_ADDR_TYPE_IPV4;
			
		    var parts = address.split(".");
			buffer[4] = parseInt(parts[0]);
			buffer[5] = parseInt(parts[1]);
			buffer[6] = parseInt(parts[2]);
			buffer[7] = parseInt(parts[3]);
			
			var port = 1494;
			var tempPort = Utility.getPort(gLaunchData['Address']);
			if (tempPort != 0) {
					port = tempPort;
				}				
		     buffer[8] = (port >> 8) & 0xFF;
             buffer[9] = port & 0xFF;
        }
         else if( Utility.isColonOct(address) )
        {
        		buffer[3] = SOCKS_ADDR_TYPE_IPV6;
        		var indexOfopenBracket = address.indexOf("[");
	 			var indexOfCloseBracket = address.indexOf("]");
	 			var offset = 4 ;
	 			indexOfopenBracket++;
	 			if( indexOfCloseBracket == -1 )
	 			{
	 				indexOfCloseBracket = address.length ;
	 			}
	 			address = address.substring( indexOfopenBracket , indexOfCloseBracket );//getting address wihtout bracket and port	 	
				
        	  	var parts = address.split(":");
        	  	for( var i = 0 ; i < parts.length ; i++ )
        	  	{
        	  		var temp = parts[i];
        	  		if(( temp.match(String("0x")) == null) &&  (temp.match(String("0X")) == null ))
        	  		{
        	  			temp = String("0x", temp);
        	  		}
        	  		temp = parseInt( temp );
        	  		buffer[offset++] = (temp >> 8) & 0xFF;
            		buffer[offset++] = temp & 0xFF;
        	  	}
        	  var port = 1494;
			  var tempPort = Utility.getPort(gLaunchData['Address']);
			  if (tempPort != 0) {
					port = tempPort;
				}				
		      buffer[offset++] = (port >> 8) & 0xFF;
              buffer[offset++] = port & 0xFF;
        }
        
		else{
            buffer[3] = SOCKS_ADDR_TYPE_DOM;	
            buffer[4] = addressLength;		
			for (var i=0; i<addressLength; ++i) {
				buffer[5+i] = address.charCodeAt(i);
			}

            var offset = addressLength + 5;
			var port = 1494;
			var tempPort = Utility.getPort(gLaunchData['Address']);
			if (tempPort != 0) {
					port = tempPort;
				}
            buffer[offset++] = (port >> 8) & 0xFF; // TODO...
            buffer[offset++] = port & 0xFF;

            // Maximum buffer size here is 262 bytes

        }
			myself.serverConnector.Send(buffer);
			connectionState = STATUS_SOCKS_CONNECT_SENT;
	};
	
	this.readConnectReply = function(data) {
		
		var responseData  = new Uint8Array(data);
		var index = 0;
		if (responseData[index++] != SOCKS_VERSION || responseData[index++] != SOCKS_TRUE || responseData[index++] != 0) {
			return false; // Break connection
		}
		
		var addrType = responseData[index++];
		switch (addrType) {
            case SOCKS_ADDR_TYPE_IPV4:
                //

                break;

            case SOCKS_ADDR_TYPE_DOM:
                var addLength = responseData[index];
				index += addLength + 1;
                break;

            case SOCKS_ADDR_TYPE_IPV6:
                //throw new SocketException("IPv6 not supported for SOCKS.");

            case -1:
                //throw new EOFException();

            default:
                //throw new SocketException("Unrecognised SOCKS address type: " + type);
        }
		var port = (responseData[index++] << 8) || responseData[index++];
		connectionState = STATUS_HANDSHAKE_COMPLETE;
		myself.serverConnector.setReceiveCallback(tdReceiveCallback);
		//ExchangeIcaDetectString();
	};
	this.WriteByte = function writeByte(byteData, off, len)
	{
		//console.log("Got a ByteWrite Request for ", byteData);
		var finalData = new Uint8Array(len);
		finalData.set(byteData.subarray(off, len+off));
		//console.log("Sending Data From Channel to Socket: ", finalData);
		myself.serverConnector.Send(finalData);
	};

	socket.setReceiveCallback(this.onReceiveCallback);
}
