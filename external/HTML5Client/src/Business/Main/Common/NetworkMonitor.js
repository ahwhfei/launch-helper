function NetworkMonitor(onLineCallback,offLineCallback){
    window.addEventListener('online',  WindowOnLineCallback);
	window.addEventListener('offline', WindowOffLineCallback);
	var rtcPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    var rtc = null;
    var isOnline = false;
	var ipAddr = [];
	var offlineCallbackCalled = false;
	var onlineCallbackCalled = false;
	var curIpAddr = "0.0.0.0";
    var dontCallback = false;
	var firstTime = true;
	var isOnlineCheckTimeout = 5000; // Time out is to check whether session is online or offline or whether ip address has changed
	var ipUpdateTimeout = 4000; // Time out is to make sure that all ip addresses are update. TODO: Remove this timeout and wait for success/error only.
    function WindowOnLineCallback(){
        isOnline = true;
        if(firstTime){	//All 'firstTime' checks in this file is to make sure whenever session is launched, onlineCallback or offLineCallback is not called
			firstTime = false;
		}else{
			onLineCallback();
		}
        dontCallback = true;
    }
	
    function WindowOffLineCallback(){
        isOnline = false;
        if(firstTime){
			firstTime = false;
		}else{
			offLineCallback();
		}
        dontCallback = true;
    }
	
	this.getIpAddress = function(){
		if(curIpAddr){
			return curIpAddr;
		}
	};
	
    this.getOnlineStatus = function(){
         return isOnline;
    };
	
    function timeOutFunciton()
    {
        initiateWebRTC(); 
        setTimeout(callbackHandler, ipUpdateTimeout); 
        setTimeout(timeOutFunciton,isOnlineCheckTimeout);
    }
    
	//timeOutFunction is called for every time interval to check whether client has an IP address
    setTimeout(timeOutFunciton,isOnlineCheckTimeout);
	
	function callbackHandler(){
		tempIp = validateIpAddress();
		//TODO Now only first Ipv4 address in ipAddr array is checked. In future, all addresses should be checked.
		if(curIpAddr != tempIp){ //Enter inside if curIpAddr has changed
			curIpAddr = tempIp;
			if(curIpAddr === undefined ){	//Enter inside if curIpAddr is null. So now session is offline
				isOnline = false;
				offlineCallbackCalled = false;	//Network status is offline, so call offlineCallback
			}else {	//Enter inside if curIpAddr is not null. So now session has changed the network.
				isOnline = true;
				onlineCallbackCalled = false; //Network status is online, so call onlineCallback
			}
		}
		if(isOnline && !onlineCallbackCalled){
			onlineCallbackCalled = true;
			if(dontCallback){	//Window eventListener has already notified as online and has called onlineCallback . So dont call it again
				dontCallback = false;
			}else{
				if(firstTime){ //Dont call during initial launch
					firstTime = false;
				}else{
					onLineCallback();
				}
			}
		}else if(!isOnline&&!offlineCallbackCalled){
			offlineCallbackCalled = true;
			if(dontCallback){ //Window eventListener has already notified as offline and has called offlineCallback . So dont call it again
				dontCallback = false;
			}else{
				if(firstTime){ //Dont call during initial launch
					firstTime = false;
				}else{
					offLineCallback();
				}
			}
		}
	}
	
	function isIpv4Address(str){
		var parts = str.split('.');
		if(parts.length == 4){
			return true;			
		}
		return false;
	}
	
    function validateIpAddress(){
	//TODO validateIpAddress for Ipv6 addresses
		var validIpAddr;
		for(var i=0; i< ipAddr.length; i++)
			if(isIpv4Address(ipAddr[i])){
				validIpAddr = ipAddr[i];
				break;
			}
		return validIpAddr;
	}
	
    function initiateWebRTC(){
        if (rtcPeerConnection) {
            initiateRTCPeerConnection();
        }
    }
	
   function initiateRTCPeerConnection() {
	   ipAddr = [];
	   rtc = new rtcPeerConnection({iceServers:[]});
		if (1 || window.mozRTCPeerConnection) {      // FF [and now Chrome!] needs a channel/stream to proceed
			rtc.createDataChannel('', {reliable:false});
		}
		rtc.onicecandidate = OnICeCandidate;
		rtc.createOffer(createOfferCallback,errorCallback);
   }
    
    
	function OnICeCandidate(evt){
		// convert the candidate to SDP so we can run it through our general parser
		if (evt.candidate){
			parseSDP("a="+evt.candidate.candidate);
		}

	}
    
    function isNewAddress(str){
		for(var i=0;i<ipAddr.length;i++){
			if(ipAddr[i]==str){
				return false;				
			}
		}
		return true;
	}
	
    function updateIpAddress(newAddr) {
        if (isNewAddress(newAddr)&&newAddr!="0.0.0.0"){
			ipAddr.push(newAddr);
		}
	}
        
	createOfferCallback = function (offerDesc) {
		parseSDP(offerDesc.sdp);
		rtc.setLocalDescription(offerDesc);
	} 
        
        
	errorCallback = function (e) { 
		console.log(" WebRTC offer failed", e); 
	}
        
        
	function parseSDP(sdp) {
		var hosts = [];
		sdp.split('\r\n').forEach(function (line) { 
			if (~line.indexOf("a=candidate")) {     
				var parts = line.split(' ');        
				var	addr = parts[4];
				var	type = parts[7];
				if (type === 'host'){
					updateIpAddress(addr);
				}
			} else if (~line.indexOf("c=")) {       
				var parts = line.split(' ');
				var	addr = parts[2];
				updateIpAddress(addr);
			}
		});
	}
 }
