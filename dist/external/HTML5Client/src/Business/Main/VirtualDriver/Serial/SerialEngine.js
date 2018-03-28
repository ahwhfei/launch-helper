function SerialEngine(callbackWrapper1)
{
	var callbackWrapper = callbackWrapper1 ;
    var processor = null;
    var myself = this;

	var vStream;
	var streamName = "CTXCCM ";
	var streamSize= 0x2000;
	
	var CCM_CONNECT_REQUEST =104;

	var prevReadIndex = 0;
    this.Run = function run() {
		prevReadIndex = 0;
		vStream.RegisterCallback(this._Run);
	};
	
	 var createVirtualStream = function(streamName,streamSize) {
  	   var chnl = ChannalMap.virtualChannalMap[streamName];
  	   var stream = new VirtualStream(chnl, callbackWrapper , streamSize);
	   return stream;
    };
  
     this.getStreamName = function() {
         return streamName;
    };
  
      this.SetStack = function() {
          vStream = createVirtualStream(streamName,streamSize);
          return vStream;
    };

	this.getCallbackWrapper=function() {
		return callbackWrapper;
	};
	
	this.getVStream = function() {
		return vStream;
	};

	this._Run = function _run() {
		var errorHandle = function() {
			vStream.setReadIndex(prevReadIndex);
		 	vStream.compact();
        };
		try {
			while (vStream.Available( ) > 0) {
				/* Main processing */
				prevReadIndex = vStream.GetReadIndex();
				try {
					processCommand();
				}
				catch(error) {
					if (error == VirtualStreamError.NO_SPACE_ERROR) {
						errorHandle();
						return;
					}
					else {
					  console.log(error.stack);
						throw error;
					}
				}
				prevReadIndex = vStream.GetReadIndex();
			 }
		}
		catch(error) {
			throw error;
		}
	};
	
 this.getCallbackWrapper = function(){
   return callbackWrapper;
 };
 
	function processCommand() {
         var cmdObj = new CcmPacketHeader();
         var  startIndex = vStream.GetReadIndex();
         marshallReadCcmPacketHeader(vStream,cmdObj);
	     processor.processCommand(cmdObj);
	     var endIndex = vStream.GetReadIndex();
		 vStream.writeAck(endIndex-startIndex);
	}

    this.initialize = function() {
        if (processor == null) {
            processor = new SerialProcessor();
        }
        processor.initialize(this);
    };
}