function PrinterEngine(callbackWrapper1)
{
	var callbackWrapper = callbackWrapper1 ;
    var processor = null;
    var myself = this;
	var version = 7 ;
	var vStream;
	var streamName = "CTXCPM ";
	var streamSize= 0x2000;
    var printObject1=printObject(callbackWrapper);

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

	this.EndWriting =function endWriting(reason) {
	
	};

    this.getPrintObject = function() {
      return printObject1;
    };

	var prevReadIndex = 0;    
    this.Run = function run() {
		prevReadIndex = 0;
		vStream.RegisterCallback(this._Run);
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
					if (error === VirtualStreamError.NO_SPACE_ERROR) {
						errorHandle();
						return ;
					}
					else {
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

	function processCommand() {
        var cmdObj = new CpmPacketHeader();
        var  startIndex = vStream.GetReadIndex();
        marshallReadCpmPacketHeader(vStream,cmdObj);
		processor.processCommand(cmdObj);
		var endIndex = vStream.GetReadIndex();
		vStream.writeAck(endIndex-startIndex);
	}

    this.initialize = function() {
        if (processor === null) {
            processor = new PrinterProcessor();
        }
        processor.initialize(this);
    };
}