function SerialWrapper(uiWrapper1,icaWrapper1,supportedChannel)
{
	var myself =  this;
	var selfSender = myself;
	var icaWrapper = icaWrapper1;
	var uiWrapper  = uiWrapper1;
	this.WrapperId = DRIVERID.ID_SERIAL;
	var stream 	   = null;
	this.streamName	= "CTXCCM " ; //change this name
	var serialEngine	= null;
	var channel = ChannalMap.virtualChannalMap[myself.streamName];
	
	this.errorCode = ERRORCODE.NONE;
	if (supportedChannel && supportedChannel[this.streamName] === false) {
		this.errorCode = ERRORCODE.NOTSUPPORTED;
	}
	this.processOtherWrapperCmd = function( dataObj ) {
		selfSender.postMessage( dataObj );
	};

	this.processSelfWrapperCmd = function( dataObj ) {
		ProcessThreadCommand(dataObj);
	};

	this.processConsumeCmd = function(dataObj) {
		selfSender.postMessage( dataObj );
	};
	var dataSendObj = {};
	dataSendObj.channel = channel ;
	dataSendObj.source = DRIVERID.ID_GENERICWRITE ;
	dataSendObj.destination = icaWrapper.WrapperId ;
	dataSendObj.cmd = WorkerCommand.QUEUEWRITEBYTE ;

    this.queueVirtualWrite = function( channel,byteData,offset,length) {
		dataSendObj.buff = byteData ;
		dataSendObj.offset = offset ;
		dataSendObj.toCopy = length ;
		icaWrapper.processOtherWrapperCmd( dataSendObj );
	};

	this.writeAck = function(channel,windowSize) {
		icaWrapper.processOtherWrapperCmd( {'channel':channel,'source':DRIVERID.ID_GENERICWRITE ,'destination':icaWrapper.WrapperId ,'cmd':WorkerCommand.WRITE_ACK ,'windowsize':windowSize} );
	};

	this.postMessage = function(dataObj) {
		ProcessThreadCommand(dataObj);
	};

	function ProcessThreadCommand(dataObj) {
		var sourceChannel = dataObj.source ;
		switch( sourceChannel )
		{
			case DRIVERID.ID_WINSTATION:
			case DRIVERID.ID_TRANSPORT:
			case DRIVERID.ID_PROTOCOL:
				HandleIcaWrapperCmd( dataObj );
				break ;
			case DRIVERID.ID_UI:
				handleUiWrapperCmd(dataObj);
				break;
			default:
			break ;
		}
	}
	
	function handleUiWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.OPEN_PDF_PRINT_FILE_STATUS) {
			serialEngine.getPrintObject().PDFFileCallBack(dataObj.status);
		}
	}
	
	function HandleIcaWrapperCmd( dataObj ) {
		var cmd = dataObj.cmd ;
		if( cmd === WorkerCommand.CONSUME ) {
			stream.consumeData(dataObj.buff, dataObj.offset, dataObj.toCopy);
		}
	}

	this.Initialize = function( cmd , engineThread ) {
		if( cmd === THREADCOMMAND.INIT_ENGINE ) {
			console.log("Inside Initializing the Serial Wrapper!");
			if( engineThread ) {
				selfSender = engineThread ;
			}
			else {
			    serialEngine = new SerialEngine( myself );
				stream = serialEngine.SetStack();
				serialEngine.initialize();
			  	serialEngine.Run( );
				selfSender = myself ;
				myself.processOtherWrapperCmd =  ProcessThreadCommand ;
				myself.processSelfWrapperCmd  = ProcessThreadCommand  ;
				myself.processConsumeCmd	  = ProcessThreadCommand  ;
				myself.postMessage			  = ProcessThreadCommand  ;
			}
		}
	};
}