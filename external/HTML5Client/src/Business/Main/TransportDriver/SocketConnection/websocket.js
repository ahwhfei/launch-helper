function MyWebSocket(proxyAddress, proxyPort , onOpenCallback, onMessageCallback, onCloseCallback, onErrorCallBack , callBackWrapper1)
{	
	var myWebSocket = null;
	var callBackWrapper1 = callBackWrapper1 ;
	var myself = this;
	var dataConsumer = onMessageCallback;
	var valid_WebSocket_protocol = false;
	/*
	 * used for custom header of websocket handshake
	 */
	var sec_WebSocket_Protocol = ["", "ica.citrix.com"];
	var custom_Websocket_protocol = callBackWrapper1.getWebSocket_Protocol( );
	if( custom_Websocket_protocol !== null && 
	    custom_Websocket_protocol !== sec_WebSocket_Protocol[0] && 
	    custom_Websocket_protocol !== sec_WebSocket_Protocol[1]) {
		for(var i = 0; i < custom_Websocket_protocol.length; i++)	{
			sec_WebSocket_Protocol[2+i] = custom_Websocket_protocol[i];
		}
	}

	//console.log("Secondary WebSocket Protocol is : ", sec_WebSocket_Protocol);
	//console.log("Custom Web Scoket Protocol is : ", custom_Websocket_protocol);
	var currentProtocolIndex = 0;
	var OnConnectCallback = function onConnectCallback()
	{				
		writeHTML5Log(0, "INIT :|: CONNECTION :|: TRANSPORT:|: WEBSOCKET :|: connected");
		valid_WebSocket_protocol = true;
		myWebSocket.onclose = onCloseCallback;
		waitForSocketReady();
	};
	
	function waitForSocketReady(){
		if(myWebSocket.readyState ===1){
			writeHTML5Log(0, "INIT :|: CONNECTION :|: WEB SOCKET :|: INFO :|: WEB SOCKET IS READY TO SEND/RECEIVE DATA.");
			onOpenCallback();
		} else {
			writeHTML5Log(0, "INIT :|: CONNECTION :|: WEB SOCKET :|: INFO :|: WEb SOCKET IS STILL NOT READY TO SEND/RECEIVE DATA. Waiting for Socket Ready");
			setTimeout(waitForSocketReady, 500);
		}
	}
	/*
	 * Check for custom sec_WebSocket_Protocol 
	 */
	function onWebsocketFailure(hostname,port,isSSLEnabled){
		//console.log("########################################## on WEb SOCKET FAILURE HIT ##########################################");
		if(!valid_WebSocket_protocol){
		 currentProtocolIndex++;
		}
		myself.Connect(hostname,port,isSSLEnabled);
	} 

	this.Connect = function connect(hostname,port,isSSLEnabled)
	{
		var lURL, wsProxy = hostname, wsPort = port;
		myWebSocket = null;
		var browserType = callBackWrapper1.getBrowserType( );
		//Checking for both IE and Edge
		if( isMSBrowser(browserType) )
		{
			//Literal IPv6 addresses , second-level domain ipv6-literal.net
			var indexOfopenBracket = wsProxy.indexOf("[");
			if(indexOfopenBracket  >= 0 )//if ipv6
			{
				var indexOfCloseBracket = wsProxy.indexOf("]");
	 			indexOfopenBracket++;
	 			if( indexOfCloseBracket == -1 )
	 			{
	 				indexOfCloseBracket = wsProxy.length ;
	 				
	 			}
	 			wsProxy = wsProxy.substring( indexOfopenBracket , indexOfCloseBracket );//getting address without bracket and port
	 			wsProxy = wsProxy.replace(/:/g,"-"); 
				wsProxy = wsProxy + ".ipv6-literal.net" ;	
			}
		}
		if(isSSLEnabled){
			  lURL = String("wss://"+wsProxy+":"+wsPort);
			  CEIP.add('network:type','wss');
		}else{
		      CEIP.add('network:type','ws');
			  lURL = String("ws://"+wsProxy+":"+wsPort);
		}
	   writeHTML5Log(0,"INIT :|: CONNECTION :|: WEB SOCKET :|: INFO :|: websocket-url="+lURL);	   
	   try
		{
			writeHTML5Log(0,"INIT :|: CONNECTION :|: WEB SOCKET :|: INFO :|: Current Protocol Index is : " + currentProtocolIndex);
			if(sec_WebSocket_Protocol[currentProtocolIndex] == ""){
				//console.trace("Connection Init");
				myWebSocket = new WebSocket(lURL);
			}else {
				myWebSocket = new WebSocket(lURL, sec_WebSocket_Protocol[currentProtocolIndex]);
			}			
			myWebSocket.binaryType= String("arraybuffer");
			myWebSocket.onopen = OnConnectCallback;
        	myWebSocket.onmessage = dataConsumer;
			if(valid_WebSocket_protocol){
				//Use Valid WebSocket protocol. Don't juggle anymore.
				myWebSocket.onclose = onCloseCallback;
			} else if( currentProtocolIndex === sec_WebSocket_Protocol.length)	{
				currentProtocolIndex =0;
        		myWebSocket.onclose = onCloseCallback;
        	}else{
        		myWebSocket.onclose = onWebsocketFailure.bind(null, hostname,port,isSSLEnabled);
        	}
        	return true;
		}
		catch(ex)
		{

			if (onErrorCallBack != null)
				onErrorCallBack(ex);
		}

	};

	this.Disconnect = function disconnect(reason)
	{
		if ( myWebSocket )
		{
			writeHTML5Log(0,"SESSION:|:ICA:|:TRANSPORT:|:WEBSOCKET:|:disconnect=");
			try
			{
				myWebSocket.onopen = null;
				myWebSocket.onmessage = null;
				myWebSocket.onclose = null;
				//myWebSocket.close();
			}
			catch( ex )
			{
				if (onErrorCallBack != null)
					onErrorCallBack(ex);
			}
			finally
			{
				if(reason != ProxyError.CLOSE )
			  	   callBackWrapper1.CloseConnection(WorkerCommand.CMD_CLOSECURRENTTAB , reason);
			}
		}
	};

	this.Suspend = function(){
		myself.Disconnect(ProxyError.CLOSE);
		onCloseCallback({code: 1006});
	};
	this.Send = function send(message)
	{
		//console.log("Sending Data From Socket to VDA", message);
		//console.trace("Sending Data From Socket to VDA", message);
		try
		{
			//Always check if socket is in ready State before sending data.
			if (myWebSocket.readyState=== 1) {
				myWebSocket.send(message.buffer);
			}
		}
		catch(ex)
		{
			if(ex.name === "NS_ERROR_UNEXPECTED"){
				writeHTML5Log(0,"SESSION:|:ICA:|:WEB SOCKET :|:ERROR - NS_ERROR_CALLBACK - IGNORING");
				return;
			}else if (onErrorCallBack != null) {
				onErrorCallBack(ex);
			}	
		}
	};
	
	this.setReceiveCallback = function (callback)
	{
		myWebSocket.onmessage = callback;
		dataConsumer = callback;

	};
}
