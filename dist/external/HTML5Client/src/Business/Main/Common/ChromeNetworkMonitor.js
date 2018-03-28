function ChromeNetworkMonitor(onlineCallback,offlineCallback){
  //window.addEventListener('online',  WindowOnLineCallback);
  window.addEventListener('offline', WindowOffLineCallback);
	
    var isOnline = false;
	var offlineCallbackCalled = false;
	var onlineCallbackCalled = false;
	var curIpAddr = "0.0.0.0";
	var prevIpAddr = null;
    var dontCallback = false;
	var firstTime = true;
	var isOnlineCheckTimeout = 5000;
	var ipUpdateTimeout = 2000;
	
    function WindowOnLineCallback(){
      console.log("window online callback called");
        isOnline = true;
        if(firstTime){
    			firstTime = false;
    		}else{
    			onlineCallback();
    		}
        dontCallback = true;
    }
	
    function WindowOffLineCallback(){
        isOnline = false;
        if(firstTime){
    			firstTime = false;
    		}else{
    			offlineCallback();
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
        getMyIp();
        setTimeout(timeOutFunciton,isOnlineCheckTimeout);
    }
    
	//timeOutFunction is called for every time interval to check whether client has an IP address
  setTimeout(timeOutFunciton,isOnlineCheckTimeout);
  
  function callbackHandler(){
    if(prevIpAddr!= curIpAddr){
      prevIpAddr = curIpAddr;
  		if(curIpAddr == null){
  			isOnline = false;
  			offlineCallbackCalled = false;
  		}else {
  			isOnline = true;
  			onlineCallbackCalled = false;
  		}
  		if(isOnline){
  			if(!onlineCallbackCalled){
          if(dontCallback){
              dontCallback = false;
          }else{
            if(firstTime){
  						firstTime = false;
  					}else{
  						onlineCallback();
  					}
          }
  				onlineCallbackCalled = true;
  			}
  		}else{
  			if(!offlineCallbackCalled){
          if(dontCallback){
              dontCallback = false;
          }else{
          		if(firstTime){
          			firstTime = false;
          		}else{
          			offlineCallback();
          		}
            }
  				offlineCallbackCalled = true;
  			}
  		}
  	}
  }
	
  function getMyIp(){
    chrome.system.network.getNetworkInterfaces(function (networkInterfaces){
      if(networkInterfaces.length == 0){
        curIpAddr = null;
      }else{
        for(var i=0;i<networkInterfaces.length;i++){
          if(networkInterfaces[i].prefixLength <30 ){
            //console.log(networkInterfaces[i].address);
            curIpAddr = networkInterfaces[i].address;
            break;
          }
        }
      }
      callbackHandler();
    });
  }
  
  
  
}
