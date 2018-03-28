function PrinterWrapper(uiWrapper1,icaWrapper1,supportedChannel)
{
	var myself =  this;
	var selfSender = myself ;
	var icaWrapper = icaWrapper1 ;
	var uiWrapper  = uiWrapper1 ;
	this.WrapperId = DRIVERID.ID_PRINTER ;
	var stream 	   = null ;
	this.streamName	= "CTXCPM " ;
	var printerEngine	= null ;
	var channel = ChannalMap.virtualChannalMap[myself.streamName];
	
	this.errorCode = ERRORCODE.NONE;
	var printcounter = 1;
	
	if (supportedChannel && supportedChannel[this.streamName] === false) {
		this.errorCode = ERRORCODE.NOTSUPPORTED;
	}
	
	this.showPrintDialog= function(message) {
		var pass_data = {
			'bloburl' : message,
			'printcounter':printcounter
		};
		printcounter++;
		uiWrapper.processOtherWrapperCmd({
			'cmd' : WorkerCommand.OPEN_PDF_PRINT_FILE,
			'msg' : pass_data,
			'source' : DRIVERID.ID_PRINTER,
			'destination' : DRIVERID.ID_UI
		});
	};

    this.openPrintWindow=function(message) {
        var pass_data = {
            'bloburl' : message,
            'printcounter':printcounter
        };
        printcounter++;
        uiWrapper.processOtherWrapperCmd({
            'cmd' : WorkerCommand.OPEN_PDF_PRINT_WINDOW_CHROME_APP,
            'msg' : pass_data,
            'source' : DRIVERID.ID_PRINTER,
            'destination' : DRIVERID.ID_UI
        });
    };

    this.kioskModeSendPrintObject=function(message) {
        var pass_data = {
            'bloburl' : message,
            'printcounter':printcounter
        };
        printcounter++;
        uiWrapper.processOtherWrapperCmd({
            'cmd' : WorkerCommand.KIOSK_MODE_SEND_PRINT_OBJECT,
            'msg' : pass_data,
            'source' : DRIVERID.ID_PRINTER,
            'destination' : DRIVERID.ID_UI
        });
    };

    this.showDownloadingPDFDialog= function() {
		var pass_data = '';
		uiWrapper.processOtherWrapperCmd({
			'cmd' : WorkerCommand.SHOW_DOWNLOADING_PDF_FILE,
			'msg' : pass_data,
			'source' : DRIVERID.ID_PRINTER,
			'destination' : DRIVERID.ID_UI
		});
	};

    this.hideDownloadingPDFDialog= function () {
        var pass_data = '';
        uiWrapper.processOtherWrapperCmd({
            'cmd' : WorkerCommand.HIDE_DOWNLOADING_PDF_FILE,
            'msg' : pass_data,
            'source' : DRIVERID.ID_PRINTER,
            'destination' : DRIVERID.ID_UI
        });
    };

    this.setTotalFiles=function(message) {
        var pass_data = {
            'message' : message
        };
        uiWrapper.processOtherWrapperCmd({
            'cmd' : WorkerCommand.TOTAL_FILES,
            'msg' : pass_data,
            'source' : DRIVERID.ID_PRINTER,
            'destination' : DRIVERID.ID_UI
        });
    };

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
			printerEngine.getPrintObject().PDFFileCallBack(dataObj.status);
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
			if( engineThread ) {
				selfSender = engineThread ;
			}
			else {
			    printerEngine = new PrinterEngine( myself );			    
				stream = printerEngine.SetStack();	
				printerEngine.initialize();		
			  	printerEngine.Run( );
				selfSender = myself ;
				myself.processOtherWrapperCmd =  ProcessThreadCommand ;
				myself.processSelfWrapperCmd  = ProcessThreadCommand  ;
				myself.processConsumeCmd	  = ProcessThreadCommand  ;
				myself.postMessage			  = ProcessThreadCommand  ;
			}
		}
	};
}