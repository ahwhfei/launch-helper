function CustomVCWrapper(vcInfo,icaWrapper1){
	this.streamName = vcInfo["streamName"];
	var streamSize =  0x2000;
	var icaWrapper = icaWrapper1;
	var channel = vcInfo["channel"];	
	var appId = vcInfo["appId"];
	var myself = this;
	this.errorCode = ERRORCODE.NONE;
	
	var port;
	
	//received from server (app/desktop connected)
	this.processConsumeCmd = function(dataObj){			
		//Directly handling the stream.consumeData here.
		var byteData = dataObj.buff;
		var offset = dataObj.offset;
		var len = dataObj.toCopy;
        var buffer = new Uint8Array(len);

        for (var i = 0; i < len; ++i) {
            buffer[i] = byteData[i + offset];
        }
		try{		
			if(port){			
				port.postMessage({"cmd":"VC_READ","packet":{"data": buffer,"length":len,"offset":0},"streamName": this.streamName,"sessionId":window.sessionId});				
			}
		}catch(e){
			console.log("Unable to send message to port : ",e);
		}
	};

	//sends data to server (app/desktop connected)
	this.queueVirtualWrite = function(channel, byteData, offset, length) {		
		var dataSendObj = {};
		dataSendObj.channel = channel;
		dataSendObj.source = DRIVERID.ID_GENERICWRITE;
		dataSendObj.destination = icaWrapper.WrapperId;
		dataSendObj.cmd = WorkerCommand.QUEUEWRITEBYTE;
		dataSendObj.buff = byteData;
		dataSendObj.offset = offset;
		dataSendObj.toCopy = length;
		icaWrapper.processOtherWrapperCmd(dataSendObj);
	};	
	
	this.initialize = function() {		
		try{
			//Port created When the wrapper is initialized
			port = chrome.runtime.connect(appId,{"name":"Receiver_"+sessionId+"_"+this.streamName});
			CEIP.incrementCounter('noOfCustomVCsUsed');
			port["onMessage"]["addListener"](function(msg){
				if(msg["cmd"] === "VC_WRITE"){
					var packet = msg["packet"];
					//Data sent in the packet is read from offset till the length and stored in new Uint8Array
					var response = new Uint8Array(packet["length"]);
					var desOffset = 0;
					var length = packet["length"];
					Utility.CopyArray(packet["data"], packet["offset"], response, 0, packet["length"]);
					
					myself.queueVirtualWrite(channel,response,0, packet["length"]);
				}
			});
			
			port["onDisconnect"]["addListener"](function(){
				console.log("port disconnected for stream : " + port.name); 
				port = null;
			});
		}catch(e){
			console.log("Creation of port failed",e);
		}
	};
}