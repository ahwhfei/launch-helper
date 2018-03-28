
function MultimediaWrapper(streamName, wrappers,supportedChannel) {
    
    var engine;
    var stream;
    var streamSize = 0x10000;
    var module = this; 
       
    /**
     * @property {String} streamName Holds copy of streamName string 
     *                    from the local variable streamName
     */
    this.streamName = streamName;
    
    /**
     * @property {Number} WrapperId Id corresponds to this stream
     */
    this.WrapperId = Utility.getWrapperId(streamName);
    
    if (wrappers) {
        wrappers[this.WrapperId] = this;
    }
        
    /**
     * @property {Number} current error state of the module
     */
    this.errorCode = ERRORCODE.NONE;
	
	if (supportedChannel && supportedChannel[this.streamName] === false) {
		this.errorCode = ERRORCODE.NOTSUPPORTED;
	}
    /**
     * @method MultimediaWrapper.queueVirtualWrite
     * @param {TypedArray} byteData
     * @param {Number} offset
     * @param {Number} length
     * @returns {undefined}
     */
    this.queueVirtualWrite = function (byteData, offset, length) {
        var dataSendObj = {};
        var icaWrapper = wrappers[DRIVERID.ID_WINSTATION];
        dataSendObj.source = DRIVERID.ID_GENERICWRITE;
        dataSendObj.destination = icaWrapper.WrapperId;
        dataSendObj.cmd = WorkerCommand.QUEUEWRITEBYTE;
        dataSendObj.channel = ChannalMap.virtualChannalMap[streamName];
        dataSendObj.buff = byteData;
        dataSendObj.offset = offset;
        dataSendObj.toCopy = length;
        icaWrapper.processOtherWrapperCmd(dataSendObj);
    };
 
    /**
     * @method MultimediaWrapper.processConsumeCmd 
     * @param {type} dataObj
     * @returns {undefined}
     */
    this.processConsumeCmd = function (dataObj) {
        if ((dataObj.source === DRIVERID.ID_WINSTATION) &&
            (dataObj.cmd === WorkerCommand.CONSUME)) {
            stream.consumeData(dataObj.buff, dataObj.offset, dataObj.toCopy);
        }
    };



    var timeToInitialize;
    this.raiseSessionReadyEvent = function() {
        var eventCommand = {
            'cmd': WorkerCommand.SESSION_READY_EVENT,
            'source': DRIVERID.ID_CALLBACK_EVENTS,
            'destination' : wrappers.WrapperId,
            'data' :
            {
                'state' : "sessionready",
                'channel' : this.streamName
            }
        };
        //wrappers.processOtherWrapperCmd(eventCommand);
        timeToInitialize = (new Date()).getTime() - timeToInitialize;
        writeHTML5Log(0,"SESSION:|:MULTIMEDIA:|:WRAPPER:|:INFO : Time take to Initialize " + this.streamName + " is " + timeToInitialize/1000 +" seconds");
    };


    /**
     * @method MultimediaWrapper.initEngine
     * @returns {Boolean} true on initialization success, false otherwire
     */
    this.initEngine = function initEngine() {
        // Create engine
        timeToInitialize = (new Date()).getTime();
        engine = new VdmmEngine(module);
        if (!engine) {
            console.error("Error creating engine");
            return false;
        }
        
        // Create virtual stream 
        stream = new VirtualStream(ChannalMap.virtualChannalMap[streamName], module, streamSize);
        if (!stream) {
            console.error("Error creating stream");
            return false;
        }
        
        // Run engine using stream data
        engine.run(stream);
        
        return true;
    };
}


