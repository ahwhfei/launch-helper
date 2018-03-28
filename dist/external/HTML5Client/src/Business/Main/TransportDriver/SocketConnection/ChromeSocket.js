function ChromeSocket(proxyAddress, proxyPort, onOpenCallback, onMessageCallback1, onCloseCallback, onErrorCallBack, callBackWrapper1) {
	var callBackWrapper1 = callBackWrapper1;
	var myself = this;
	var socketId = null;
	var onMessageCallback = onMessageCallback1;
	var READ_FAILURE_TIMEOUT = 3000; // if first read doesn't come after 3sec then close the connection.
	var READ_BUFFER_SIZE = null; // change this for fixed buffer reads.
	var dataReadFirstTime = false;
	var backPage = null;
	// When session is loaded in iframe, chrome.app.window.current() will be null.Variable checks if currentWindow is null or not.
	var registerSocketToCurWin = (chrome.app.window.current() != null)? true:false; 
	
	var OnConnectCallback = function onConnectCallback(result) {
		if (result < 0 || chrome.runtime.lastError) {
			writeHTML5Log(0, "INIT :|: CONNECTION :|: CHROME SOCKET :|: ERROR :|: Error during connection, Error Code : " + result);
			handleClose(result);
			return;
		}

		writeHTML5Log(0, "INIT :|: CONNECTION :|: CHROME SOCKET :|: INFO :|: Socket Connection has been established");
		
		// register with background page for socket cleanup.
		// we cant clean ourselves during window close chrome APIs are not available during unload.
		if(!backPage) {
			chrome.runtime.getBackgroundPage(function(bp) {
				backPage = bp;
				if(registerSocketToCurWin){
					backPage.SessionCleanupHelper.set("socket", chrome.app.window.current(), socketId);
				}
			});
		} else {
			if(registerSocketToCurWin){
				backPage.SessionCleanupHelper.set("socket", chrome.app.window.current(), socketId);
			}
		}
        
        // set no delay on the socket to disable nagle algo
        chrome.socket.setNoDelay(socketId, true, function(res) {
            console.log("Disabling nagle algorithm on the socket: ", res);
        });
		
		// we have successfully connected now
		onOpenCallback();
		
		// start read callback loop
		dataReadFirstTime = false;
		chrome.socket.read(socketId, READ_BUFFER_SIZE, onReceive);
		
		// set a read timer to close the socket on timeout
		setTimeout(onFirstReadTimeout, READ_FAILURE_TIMEOUT);
	};
	
	function onReceive(readInfo) {
		if (!socketId) {
			console.log("Received read callback after socket close. Ignoring it: ", readInfo);
			return;
		}
	
		if(!dataReadFirstTime) dataReadFirstTime = true; // got a read.
		
		if (readInfo["resultCode"] <= 0) {
			writeHTML5Log(0, "SESSION :|: CONNECTION :|: CHROME SOCKET :|: ERROR :|: error during socket read and closing the connection: " + readInfo["resultCode"]);
		
			handleClose(readInfo["resultCode"]);
			return;
		}
		
		// Important note: Read <-> process <-> Read... loop gives us best performance in case of thinwire/snowball codec
		// This is because server recognizes client is loaded and adjusts frames/bandwidth/quality accordingly without us doing anything special.
		// For websocket.onmessage or chrome.sockets.tcp.onReceive, browser reads all the data in background so server has no way to know how much client is loaded!
		// We need explicit flow control for those cases but client_fps_limit or systemflowcontrol is present only in 7.x!
		onMessageCallback(readInfo);
		try{
			chrome.socket.read(socketId, READ_BUFFER_SIZE, onReceive);
		}catch(e){
			var exceptionMsg = e.message;
			console.log(0, "SESSION :|: CONNECTION :|: CHROME SOCKET :|: ERROR :|: error during socket read and closing the connection: " + exceptionMsg);
			writeHTML5Log(0, "SESSION :|: CONNECTION :|: CHROME SOCKET :|: ERROR :|: error during socket read and closing the connection: " + exceptionMsg);
		}
	};
	
	function onFirstReadTimeout() {
		if (!dataReadFirstTime) {
			writeHTML5Log(0, "INIT :|: CONNECTION :|: CHROME SOCKET :|: ERROR :|: no inbound data from socket even after " + READ_FAILURE_TIMEOUT + " ms");
			//Setting the error code to connection timed out
			handleClose(-118);
		}
	}
	
	var handleError = function(err) {
		writeHTML5Log(0, "INIT :|: CONNECTION :|: CHROME SOCKET :|: ERROR :|: " + err);
		if (onErrorCallBack != null) {
			var errObj = new Error(err);
			errObj.code = err.message;
			// close the socket
			myself.Disconnect(ProxyError.CLOSE);
			onErrorCallBack(errObj);
		}
	};
	
	var handleClose = function(errorCode) {
		writeHTML5Log(0, "SESSION :|: CONNECTION :|: CHROME SOCKET :|: INFO :|: closing the connection");
		myself.Disconnect(ProxyError.CLOSE);
		var errorMsg;
		if(errorCode){
			 errorMsg = NetworkErrors.getErrorMsg(errorCode) + " (" + errorCode +")";
		}
		onCloseCallback({code: 1006,"errorMsg" : errorMsg});
	};
	
	this.Suspend = handleClose;
	
	this.Connect = function(hostname, port, isSSLEnabled) {		
		// For TLS connections we need to establish secure channel first
		var connectCB = OnConnectCallback;
		if (isSSLEnabled) {
			connectCB = function(result) {
				if (result < 0 || chrome.runtime.lastError) {
					writeHTML5Log(0, "INIT :|: CONNECTION :|: CHROME SOCKET :|: ERROR :|: Error during secure connection, Error Code : " + result);
					handleClose(result);
					return;
				}
				// establish ssl and call the original callback. By default allow only TLS1 and above.
				writeHTML5Log(0, "INIT :|: CONNECTION :|: CHROME SOCKET :|: INFO :|: connection to server: " + hostname + ", port: " + port + ", result: " + result + ", socketId: " + socketId);
				CEIP.add('network:type','https');
				chrome.socket.secure(socketId, {'tlsVersion' : {'min':'tls1'}}, OnConnectCallback);
			};
		}
		try {
			// first cleanup previous socket if any.
			var oldSockId = socketId;
			if (oldSockId) {
				writeHTML5Log(0, "SESSION :|: CONNECTION :|: CHROME SOCKET :|: WARNING :|: existing socket not cleaned up! " + oldSockId);
				chrome.socket.destroy(oldSockId);
				writeHTML5Log(0, "SESSION :|: CONNECTION :|: CHROME SOCKET :|: INFO :|: existing socket closed now: " + oldSockId);
			}
			socketId = null;
			
			// create a new one.
			chrome.socket.create("tcp", {}, function(createInfo) {
				socketId = createInfo.socketId;
				CEIP.add('network:type','http');
				chrome.socket.connect(createInfo.socketId, hostname, port, connectCB);
			});
		} catch(ex) {
			handleError(ex);
		}

	};
	this.Disconnect = function disconnect(reason)
	{
		var curSocketId = socketId;
		socketId = null; // do not use member variable for cleanup as some other callback may use it.
		if (curSocketId != null )
		{
			try
			{
				// cleanup socket
				chrome.socket.disconnect(curSocketId);
				chrome.socket.destroy(curSocketId);
				// de-register socket cleanup
				if (backPage) {
					if(registerSocketToCurWin){
						// TODO : We need to deregister with backpage but doing so in onClosed handler would prevent it from cleaning up.
						//backPage.SessionCleanupHelper.remove("socket", chrome.app.window.current(), curSocketId);
					}
					// close the current window if server disconnected us.
					if(reason != ProxyError.CLOSE ) {
						callBackWrapper1.CloseConnection(WorkerCommand.CMD_CLOSECURRENTTAB , reason);
					}
				}
			}
			catch( ex )
			{
				handleError(ex);
			}			
		}
	};
	
	this.Send = function send(message)
	{
		try
		{
			if (socketId != null ) {
				chrome.socket.write(socketId, message.buffer, function(sendInfo){
				    if (sendInfo["bytesWritten"] < 0 || chrome.runtime.lastError) {
						console.error("tcp write failure: " + sendInfo["bytesWritten"] + ", lastError: " + chrome.runtime.lastError);
						handleClose(sendInfo["bytesWritten"]);
					}
				});
			}
		}
		catch(ex)
		{
			handleError(ex);
		}
	};
	
	this.setReceiveCallback = function(callback){
		onMessageCallback = callback;
	};
}
