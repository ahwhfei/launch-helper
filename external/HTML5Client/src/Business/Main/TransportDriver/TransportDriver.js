// WebSocket Codes

var CLOSE_NORMAL = 1000;
var CLOSE_GOING_AWAY = 1001;
var CLOSE_PROTOCOL_ERROR = 1002;
var CLOSE_UNSUPPORTED = 1003;
var CLOSE_TOO_LARDE = 1004;
var CLOSE_NO_STATUS = 1005;
var CLOSE_ABNORMAL = 1006;

// Firefox throws this error code
// while establishing a ws connection
// from https page.
var CLOSE_INSECURECONN_FIREFOX = 18;

function TransportDriver(connectInfo, icaData, callBackWrapper1 )
{
	var myself = this;
	var callBackWrapper = callBackWrapper1 ;
	var dataConsumer = null;
	var icaHandShakeReceived = false;
	var icaHandShakeCompleted = false;
	this.SslOverhead = 0;
	//var firstMessage = true;
	var icaPollCount = 0;
	this.WriteByte = null;
	var channel = {};
	var proxyAddress = connectInfo["connectAddress"];
	var proxyPort = connectInfo["connectPort"];
	// CGP info
	var isSSLEnabled = connectInfo["isSSLEnabled"];
	var cgpSecurityToken = connectInfo['cgpSecurityToken'];
	var CGPEnabled = connectInfo["cgpEnabled"];
    TransportDriver.CGPEnabled = CGPEnabled;
	var reconnectTimer = connectInfo['reconnectTimeOut'];
	var sessionReliabilityTimeout = connectInfo['sessionReliabilityTime'];
    var UIDimmingPercentage = 75;
	this.WriteByte = function writeByte(byteData, offset, length) {
		channel.WriteByte(byteData, offset, length);
	};

	this.SetDataConsumer = function setDataConsumer(consumer)
	{
		dataConsumer = consumer;
	};

	this.GetDataConsumer = function ()
	{
		return dataConsumer;
	};

	var OnConnectCallback = function onConnectCallback()
	{
		channel.OnConnect(proxyAddress, proxyPort, cgpSecurityToken);
		this.Send = channel.Send;
	};


	var OnReceiveCallback = function onReceiveCallback(aEvent)
	{
		TransportDriver.isServerActive	= true;
		try {
			var d = new Date();
			TransportDriver.receiveTime = d.getTime();
			var receivedData = new Uint8Array(aEvent.data);
			//console.log("Received Data is :", receivedData);
			var tdICAStrLength = TransportDriver.ICA_DETECT_STRING.length;
			if (icaHandShakeCompleted) {
				//console.log("Ica Handshake is completed Sending data to PD");
				if(IsICADetectString(receivedData) == false){ // data without ICA detect string
					dataConsumer.consumeData(receivedData, 0, receivedData.length);
				} else if (receivedData.length > tdICAStrLength ) { // data along with ICA detect string
					dataConsumer.consumeData(receivedData, tdICAStrLength, receivedData.length - tdICAStrLength);
				}
			}
			else {
				//console.log("Ica Handshake not yet received and cgpenabled: " + CGPEnabled);
				if(CGPEnabled){
					sendCGPIcaDetectString();
				} else {
					if(IsICADetectString(receivedData) == true){
						icaHandShakeReceived = true;
						
						// if server sent other data along with ICA detect string process it
						if (receivedData.length > tdICAStrLength ) {
							icaHandShakeCompleted = true;
							dataConsumer.consumeData(receivedData, tdICAStrLength, receivedData.length - tdICAStrLength);
						} else { // only ica detect string received
							ExchangeIcaDetectString();
						}
					}
				}
			}
			d = new Date();
			TransportDriver.consumptionTime = d.getTime() - TransportDriver.receiveTime;
		}catch(ex){
			// End the session when the first exception happened so that it helps in debugging issue quicker.
			myself.EndWriting(CLOSE_GOING_AWAY);
			var errDetails = (ex.message) ? ex.message : ex;
			callBackWrapper.showError(String('receiver-brand'), [String('error-general'), errDetails] ,null,null,CTXDLGCB.CLOSECURRENTTAB);
			var logMsg = " , name=" +  (ex.name  ? ex.name  : "no error name" );
			logMsg += " , message=" +  (ex.message ? ex.message : "no error message") ;
			logMsg += " ,call stack=" +  (ex.stack ? ex.stack : "no call stack") ;
			writeHTML5Log(0,"SESSION:|:ICA:|:TRANSPORT:|:DRIVER:|:ERROR=" + errDetails);
			writeHTML5Log(0,"SESSION:|:ICA:|:TRANSPORT:|:DRIVER:|:ERROR=" + logMsg);
		}
	};
	function sendCGPIcaDetectString(){
		var cgpICADetectString = new Uint8Array([7,10,127,127,73,67,65,0]);
		this.Send(cgpICADetectString);
		icaHandShakeCompleted = true;
	}
	
	function Disconnect(errorMsg, moreDetails){
		/* First case Might not be required Any longer as we are handling network disruptions now.*/
		if(!navigator.onLine){
			callBackWrapper.showError(String('receiver-brand'), String('error-retry'),null,null,CTXDLGCB.CLOSECURRENTTAB);
		}else if(!TransportDriver.isServerActive){
			callBackWrapper.showError(String('receiver-brand') ,[errorMsg,moreDetails],null,null,CTXDLGCB.CLOSECURRENTTAB);
		}else{
			callBackWrapper.showError(String('receiver-brand') ,errorMsg,null,null,CTXDLGCB.CLOSECURRENTTAB);
		}
	}

	var reconnectStartTime = 0;
	var OnCloseCallback = function onCloseCallback(isClientInitiated)
	{
	    writeHTML5Log(0,"SESSION:|:ICA:|:TRANSPORT:|:DRIVER:|:close with code=" + isClientInitiated.code);
        var errorMsg = String('error-server');
        var moreDetails = isClientInitiated["errorMsg"] ? isClientInitiated["errorMsg"] : String('error-local-access');
        if(CGPEnabled){
            var reliabilityParams = channel.getReliabilityParams();
            if(reliabilityParams){
                sessionReliabilityTimeout = reliabilityParams['reliabilityTimeOut']*1000;
                UIDimmingPercentage = 100 - reliabilityParams['UIDimmingPercentage']; // Invert the dimming percentage to Opacity.
                console.log("############# AT TRANSPORT DRIVER #####################", reliabilityParams);
            }
        }
        if(TransportDriver.pollTimerObj)
        {
            clearTimeout(TransportDriver.pollTimerObj);
            TransportDriver.pollTimerObj = null;
        } 
        switch(isClientInitiated.code)
        {
			case CLOSE_NO_STATUS:
				if(CGPEnabled){
					writeHTML5Log(0, "INIT :|: CONNECTING :|: TRANSPORTDRIVER :|: CGP Not Supported. TRYING ICA-Socks");
					changeCoreState(CORESTATE_UNCONNECTED);
					CGPEnabled = false;
					myself.Connect(connectInfo);
				} else{
					moreDetails = [String('error-websocket'), isClientInitiated.code];
					callBackWrapper.showError(String('receiver-brand'), [errorMsg, moreDetails],null,null,CTXDLGCB.CLOSECURRENTTAB);
				}
				break;
            case CLOSE_ABNORMAL:
				if(CGPEnabled){
					switch(coreState){
						case CORESTATE_CONNECTED:
							reconnectStartTime = Date.now();
							channel.Suspend();
							callBackWrapper.showReconnectingOverlay(UIDimmingPercentage);
							callBackWrapper.CGP_Suspend();
							writeHTML5Log(0, "SESSION :|: CGP :|: TRANSPORT DRIVER :|: Connection to server lost");
							// The reason the first reconnect should be >30sec is because of VDA bug.
							// Reduce this to normal once it is fixed.
							setTimeout(Reconnect, reconnectTimer);
							break;
						case CORESTATE_SUSPENDED:
							var disconnectTimeLapsed = Date.now() - reconnectStartTime;
							console.log("Disconnect Time Lapsed is :", disconnectTimeLapsed);
							console.log("Session Reliability Timeout is :", sessionReliabilityTimeout);
							// Since it is Suspended and assuming network is not yet up, Keep retrying.
							if(disconnectTimeLapsed <= sessionReliabilityTimeout){
								// If reconnect time is less than 180 seconds Keep Going...
								writeHTML5Log(0, "SESSION :|: CGP :|: TRANSPORT DRIVER :|: Trying a Reconnect. Time Elapsed : " + disconnectTimeLapsed);
								setTimeout(Reconnect, 3000);
							} else {
								// Assuming network is not up after 180 seconds. Stop Retrying and Disconnect.
								writeHTML5Log(0, "SESSION :|: CGP :|: TRANSPORT DRIVER :|: Reconnect time lapsed. Disconnecting");
								Disconnect(errorMsg, moreDetails);
							}
							break;
						case CORESTATE_RECONNECTING:
							// Might have been a issue with Security Ticket or reconnect.
						case CORESTATE_DISCONNECTED:
							// Implement this disconnect function for all other scenarios.
							Disconnect(errorMsg, moreDetails);
							break;
						case CORESTATE_UNCONNECTED:
							//Ideally Should never be hit.
							//Fall through
						case CORESTATE_CONNECTING:
							// Disable CGP and Try connecting with ICA-Socks
							writeHTML5Log(0, "INIT :|: CONNECTING :|: TRANSPORTDRIVER :|: CGP HANDSHAKE FAILED. TRYING ICA-Socks");
							changeCoreState(CORESTATE_UNCONNECTED);
							CGPEnabled = false;
							myself.Connect(connectInfo);
							break;
						default:
							// In any other scenario just fall back by disabling CGP
							// Should we do this??
					}
				}else {
					Disconnect(errorMsg, moreDetails);
				}
                break;
            case CLOSE_PROTOCOL_ERROR:
                callBackWrapper.showError(String('receiver-brand'),[String('error-helpdesk'),
                                                           String('error-protocol')],null,null,CTXDLGCB.CLOSECURRENTTAB);
                break;
		    case CLOSE_INSECURECONN_FIREFOX:
           		callBackWrapper.showError(String('receiver-brand'), String('error-secure') , null, null, CTXDLGCB.CLOSECURRENTTAB);
           		break ;
            default:
                moreDetails = [String('error-websocket'), isClientInitiated.code];
		        callBackWrapper.showError(String('receiver-brand'), [errorMsg, moreDetails],null,null,CTXDLGCB.CLOSECURRENTTAB);

        } 
	};

	var OnErrorCallback = function onErrorCallback(ex)
	{
		var errorMsg = String('error-server');
        var moreDetails = String('error-local-access');
        if(TransportDriver.pollTimerObj)
        {
            clearTimeout(TransportDriver.pollTimerObj);
            TransportDriver.pollTimerObj = null;
        }
		var logMsg = " , name=" +  (ex.name  ? ex.name  : "no error name" );
		logMsg += " , message=" +  (ex.message ? ex.message : "no error message") ;
		logMsg += " ,call stack=" +  (ex.stack ? ex.stack : "no call stack") ;
		
		writeHTML5Log(0,"SESSION:|:ICA:|:TRANSPORT:|:DRIVER:|:error with code=" + ex.code + logMsg);       

		switch(ex.code)
        {
            case CLOSE_ABNORMAL:
                if(!navigator.onLine)
                {
                    callBackWrapper.showError(String('receiver-brand') ,String('error-retry'),null,null,CTXDLGCB.CLOSECURRENTTAB);
                }
                else if(!TransportDriver.isServerActive)
                {
                    callBackWrapper.showError(String('receiver-brand') ,[errorMsg,moreDetails],null,null,CTXDLGCB.CLOSECURRENTTAB);
                }
                else
                {
                    callBackWrapper.showError(String('receiver-brand') ,errorMsg,null,null,CTXDLGCB.CLOSECURRENTTAB);
                }
				break;
            case CLOSE_PROTOCOL_ERROR:
                callBackWrapper.showError(String('receiver-brand'),[String('error-helpdesk'),
                String('error-protocol')],null,null,CTXDLGCB.CLOSECURRENTTAB);
                break;
			case CLOSE_INSECURECONN_FIREFOX:
           		callBackWrapper.showError(String('receiver-brand'), String('error-secure') , null, null, CTXDLGCB.CLOSECURRENTTAB);
           		break ;       
            default:
                moreDetails = [String('error-websocket'), ex.code];
		        callBackWrapper.showError(String('receiver-brand') ,[errorMsg, moreDetails],null,null,CTXDLGCB.CLOSECURRENTTAB);

        }
	};

	var IsICADetectString = function isICADetectString(candidate)
	{
		var tdICAStrLength = TransportDriver.ICA_DETECT_STRING.length;
	    for (var i=0; i<tdICAStrLength; ++i)
		{
	        if (candidate[i] != TransportDriver.ICA_DETECT_STRING[i])
			{
	            return false;
	        }
	    }
	    return true;
	};

	function sendIcaDetectString()
	{
		writeHTML5Log(0, "SESSION :|: ICA :|: CONNECTION :|: TRANSPORT DRIVER :|: ICA handshake Sent");
		channel.Send(TransportDriver.ICA_DETECT_STRING);
	}

	var ExchangeIcaDetectString = function exchangeIcaDetectString()
	{
		sendIcaDetectString();
		if(icaHandShakeReceived == true){
			icaHandShakeCompleted = true;
		}
	};

	this.EndWriting =function endWriting(reason)
	{
        myself.Close(reason);
	};

	this.Close = function close(reason)
	{
		if(channel.close) channel.close();
		serverConnector.Disconnect(reason);
	};
	
	this.Connect = function connect(addressInfo)
	{
		this.SetClientAddress();
		writeHTML5Log(0, "INIT :|: CONNECTION :|: TRANSPORT DRIVER :|: TRYING FOR SOCKET CONNECTION ON " + proxyAddress + " : " + proxyPort);
		serverConnector.Connect(proxyAddress ,proxyPort,isSSLEnabled);
		channel = getProxyChannel();
	};
	function Reconnect(){
		writeHTML5Log(0, "SESSION :|: RE-CONNECTION :|: TRANSPORT DRIVER :|: TRYING FOR RECONNECT.");
		var state = getCoreState();
		if(state == CORESTATE_SUSPENDED){
			serverConnector.Connect(proxyAddress, proxyPort, isSSLEnabled);
		}else{
			writeHTML5Log(0, "SESSION :|: RE-CONNECTION :|: TRANSPORT DRIVER :|: WARNING :|: RECONNECT DURING INVALID STATE :|: " + state);
		}
	}

	var gCharEncoding = SupportedEncoding.UNICODE_ENCODING;
	var gPotentialOutBufLength = 1460;
	var clientAddress = new Array();
	var clientPort = connectInfo["connectPort"];
	var clientIpString = icaData['ClientIp'];
	var MODULE_PARAMETER = new ModuleParameter(String("TCP/IP"),UIModule.TRANSPORT_DRIVER,1,2,"TCPTransportDriver.class",null, 0);
	var useChromeSock = connectInfo['useChromeSock'];
	var serverConnector = new ProxyServerConnector(useChromeSock, proxyAddress, proxyPort, OnConnectCallback, OnReceiveCallback, OnCloseCallback, OnErrorCallback , callBackWrapper);
	this.Send = serverConnector.Send;

	this.GetDisplayName 	= function() { return MODULE_PARAMETER.DisplayName; 		};
	this.GetHostModuleName 	= function() { return MODULE_PARAMETER.HostModuleName;		};
	this.GetModuleClass 	= function() { return MODULE_PARAMETER.ModuleClass; 		};
	this.GetVersionL 		= function() { return MODULE_PARAMETER.MinVersion; 			};
	this.GetVersionH 		= function() { return MODULE_PARAMETER.MaxVersion; 			};
	this.GetModuleDate 		= function() { return MODULE_PARAMETER.ModuleDate; 			};
	this.GetModuleSize 		= function() { return MODULE_PARAMETER.ModuleSize; 			};
	this.GetEncodingType 	= function() { return gCharEncoding; 						};
	this.SetEncodingType 	= function(encoding) { gCharEncoding = encoding;			};

	this.GetCapabilityList = function() { return null; };
	this.SetCapabilityList = function(capabilityList) {};
	var outbufLength = TransportDriver.TD_OUTBUFLENGTH;
	this.ShouldReconnect = false;

	this.GetClientAddress = function getClientAddress()
	{
		return clientAddress;
	};

	this.SetClientAddress = function setClientAddress()
	{
		var address = Utility.parseIpAddress(clientIpString, clientPort);
		clientAddress = address.slice(0, address.length);
	};

	this.SetMTU = function setMTU()
	{
		outbufLength = gPotentialOutBufLength;
	};

	function getProxyChannel()
	{
		var channel;
		if(CGPEnabled){ // CGP by default
			writeHTML5Log(0, "INIT :|: CONNECTION :|: TRANSPORT DRIVER :|: SOCKET CONNECTED. Setting CGP Channel");
			channel = new CGPSocket(serverConnector, OnConnectCallback, OnReceiveCallback, OnCloseCallback, OnErrorCallback , callBackWrapper, sessionReliabilityTimeout);
		} else if (useChromeSock == false || connectInfo['proxyPresent'] === true) { // Socks is required if proxy is present or for websockets
			writeHTML5Log(0, "INIT :|: CONNECTION :|: TRANSPORT DRIVER :|: SOCKET CONNECTED. Setting SOCKSV5 Channel");
			channel = new SocksV5(serverConnector, icaData, ExchangeIcaDetectString, OnReceiveCallback , callBackWrapper);
		} else { // no proxy.
			writeHTML5Log(0, "INIT :|: CONNECTION :|: TRANSPORT DRIVER :|: SOCKET CONNECTED. Direct ICA chrome socket connection");
			channel = {};
			channel.WriteByte = function writeByte(byteData, off, len) {
				var finalData = new Uint8Array(len);
				finalData.set(byteData.subarray(off, len+off));
				serverConnector.Send(finalData);
			};
			channel.Send = serverConnector.Send;
			channel.OnConnect = ExchangeIcaDetectString;
			serverConnector.setReceiveCallback(OnReceiveCallback);			
		}
		return channel;
	}
}

TransportDriver.ICA_DETECT_STRING  = new Uint8Array(6);
TransportDriver.ICA_DETECT_STRING[0] = 0x7f;
TransportDriver.ICA_DETECT_STRING[1] = 0x7f; 
TransportDriver.ICA_DETECT_STRING[2] = String("I").charCodeAt(0); 
TransportDriver.ICA_DETECT_STRING[3] = String("C").charCodeAt(0); 
TransportDriver.ICA_DETECT_STRING[4] = String("A").charCodeAt(0); 
TransportDriver.ICA_DETECT_STRING[5] = 0x00;  
TransportDriver.ICA_DETECT_POLL_TIME  	= 500;
TransportDriver.ICA_DETECT_POLL_COUNT 	= 10;
TransportDriver.MAX_ICA_PACKET 			= 4240;

//TransportDriver.TD_AF_UNSPEC    =  0;
//TransportDriver.TD_AF_UNIX      =  1;
TransportDriver.TD_AF_INET      =  2;
//TransportDriver.TD_AF_IMPLINK   =  3;
//TransportDriver.TD_AF_PUP       =  4;
//TransportDriver.TD_AF_CHAOS     =  5;
//TransportDriver.TD_AF_IPX       =  6;
//TransportDriver.TD_AF_NS        =  6;
//TransportDriver.TD_AF_ISO       =  7;
//TransportDriver.TD_AF_OSI       =  TransportDriver.TD_AF_ISO;
//TransportDriver.TD_AF_ECMA      =  8;
//TransportDriver.TD_AF_DATAKIT   =  9;
//TransportDriver.TD_AF_CCITT     = 10;
//TransportDriver.TD_AF_SNA       = 11;
//TransportDriver.TD_AF_DECnet    = 12;
//TransportDriver.TD_AF_DLI       = 13;
//TransportDriver.TD_AF_LAT       = 14;
//TransportDriver.TD_AF_HYLINK    = 15;
//TransportDriver.TD_AF_APPLETALK = 16;
//TransportDriver.TD_AF_NETBIOS   = 17;
TransportDriver.TD_OUTBUFLENGTH = 1460;
TransportDriver.receiveTime 	= 0;
TransportDriver.consumptionTime = 0;
TransportDriver.isServerActive	= false;
TransportDriver.pollTimerObj = null;
TransportDriver.CGPEnabled = false;