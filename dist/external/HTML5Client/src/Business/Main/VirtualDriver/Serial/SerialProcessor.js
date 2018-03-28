function SerialProcessor( ) {
    var vStream;
    var callbackWrapper;
    var MAX_PORTS = 4;
    var MAX_READ_DATA = 1024;
    var OpenPorts = {};
	var backPage;
	
	// Read port reply helper
	function writeReadPortReplyPacket(port, mpxId) {
		var readSerialReply = new ReadSerialReply();
		// We can't write more than max packet size even if we have data available!
		var dataSize = Math.min(port.InputBufferLength, MAX_READ_DATA);
		var packet = new Uint8Array(CCMCONSTANT.READSERIAL_REPLY_PACKET_SIZE + dataSize);
		var offset = 0;
		
		// write the read reply header first
		var header = new CcmPacketHeader();
		header.initialize(CCMCONSTANT.CCM_READPORT_REPLY, mpxId);
		readSerialReply.header = header;
		readSerialReply.result = errorWord(CCMCONSTANT.CCM_DOSERROR_NOERROR , CCMCONSTANT.CCM_ERROR_NONE);
		readSerialReply.size   = dataSize;
        
        writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:Sending read reply packet of size: " + dataSize);

		// Inform server about our pending data
		readSerialReply.lineStatus.lineError = 0;
		readSerialReply.lineStatus.holdStatus = 0;
		readSerialReply.lineStatus.inputCount = 0;//CCMCONSTANT.CCM_DEFAULT_TXQUEUESIZE;
		readSerialReply.lineStatus.outputCount = Math.min(port.InputBufferLength - dataSize, MAX_READ_DATA);
		offset = marshallWriteReadSerialReply(packet, offset, readSerialReply);
		
		// write actual read data now
		var data = port.InputBuffer.subarray(0, dataSize);
		packet.set(data, offset);
		offset += data.length;
		
		// write full packet now
		vStream.WriteByte(packet, 0, offset);
		
		// Move pending data to the beginning and reset length. We are done with MpxId.
		if (port.InputBufferLength > dataSize) {
			port.InputBuffer.set(port.InputBuffer.subarray(dataSize, port.InputBufferLength));
		}
		port.InputBufferLength -= dataSize;
		port.readMpxId = -1;		
	}
	
	// These listeners are common for all open ports
	function setupReceiveHandler() {
		chrome.serial.onReceive.addListener(function(info){
            
            // TODO: return proper error to server via async modem status?
            if (chrome.runtime.lastError || !info) {
                writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:ERROR in CHROME.SERIAL.ONRECEIVE: " + chrome.runtime.lastError);
                return;
            }
            
            writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:RECEIVED DATA FROM CHROME.SERIAL.ONRECEIVE");
			
			var port; // find port in our open ports list
            for (var i=0 ;i<MAX_PORTS;i++) {
				if (OpenPorts[i] != undefined && OpenPorts[i].connectionId === info.connectionId) {
					port = OpenPorts[i];
					break;
				}
			}
			
			// This should ideally not happen
			if (!port) {
				console.info("chrome.serial.onReceive error: data received on unknown port!");
				return;
			}
				
			// Append or set the read data.
			var dataBuffer = new Uint8Array(info.data);
			// Extend data store if required
			var newLen = dataBuffer.length + port.InputBufferLength;
			if (newLen > port.InputBuffer.length) {
				var current = port.InputBuffer;
				port.InputBuffer = new Uint8Array(current.length + CCMCONSTANT.CCM_DEFAULT_RXQUEUESIZE); // extend using max read size
				port.InputBuffer.set(current);
			}
			// Now append the data
			port.InputBuffer.set(dataBuffer, port.InputBufferLength);
			port.InputBufferLength = newLen;
			
			// If no pending read request we are done
			if ( port.readMpxId === -1) {
				return;
			}
			
			// else send the read reply now.
			writeReadPortReplyPacket(port, port.readMpxId);
        });
	
		chrome.serial.onReceiveError.addListener(function(info){
			writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:ERROR FROM CHROME.SERIAL.ONRECEIVEERROR: " + info.error);
			
			var port; // find port in our open ports list
            for (var i=0 ;i<MAX_PORTS;i++) {
				if (OpenPorts[i] !== null && OpenPorts[i].connectionId === info.connectionId) {
					port = OpenPorts[i];
					break;
				}
			}
			
			// TODO: return proper error to server via async modem status?
			port.lastErrorStatus = info.error;
		});
	}

	this.initialize = function (vd) {
        vStream = vd.getVStream();
        callbackWrapper = vd.getCallbackWrapper();
		
		setupReceiveHandler();
    };

    this.processCommand = function (cmd) {
        switch (cmd.h_type) {
            case CCMCONSTANT.CCM_CONNECT_REQUEST:
                writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:GOT A CONNECT REQUEST");
                handleConnectSerialRequest(cmd);
                break;
            case CCMCONSTANT.CCM_ENUMPORT_REQUEST:
                writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:GOT A ENUM REQUEST");
                handleEnumSerialRequest(cmd);
                break;
            case CCMCONSTANT.CCM_OPENPORT_REQUEST:
                writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:GOT A OPEN REQUEST");
                handleOpenSerialRequest(cmd);
                break;

            case CCMCONSTANT.CCM_WRITEPORT_REQUEST:
                writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:GOT A WRITE REQUEST");
                handleWriteSerialRequest(cmd);
                CEIP.add("serial:used",true);
                break;
                
            case CCMCONSTANT.CCM_CLOSEPORT_REQUEST:
                writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:GOT A CLOSE REQUEST");
                handleCloseSerialRequest(cmd);
                break;
            case CCMCONSTANT.CCM_READPORT_REQUEST:
              writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:GOT A READ REQUEST");
                handleReadSerialRequest(cmd);
                CEIP.add("serial:used",true);
                break;
            case CCMCONSTANT.CCM_SETPORT_REQUEST:
              writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:GOT A SETPORT REQUEST");
                handleSetPortSerialRequest(cmd);
                break;
            case CCMCONSTANT.CCM_GETPORT_REQUEST:
              writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:GOT A GETPORT REQUEST");
                handleGetPortSerialRequest(cmd);
                break;
            default:
                writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:Unknown command " + cmd.h_type);
                
        }
    };

    function errorWord(errorCode, errorClass) {
        return ((errorCode << 8) | errorClass);
    }

    function handleConnectSerialRequest(cmd)
    {
        var connectRequest = new ConnectSerialRequest();
        connectRequest.header = cmd;
        marshallReadConnectSerialRequest(vStream, connectRequest);
    }

    function handleEnumSerialRequest(cmd) {
       writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:INSIDE ENUM REPLY");
        var enumSerialRequest = new EnumSerialRequest();
        var enumSerialReply = new EnumSerialReply();
        var enumBuffer =[];
       
        var offset = 0;
        var header = new CcmPacketHeader();
        header.initialize(CCMCONSTANT.CCM_ENUMPORT_REPLY, cmd.mpxId);
        enumSerialRequest.header = cmd;
        var idx= marshallReadEnumSerialRequest(vStream, enumSerialRequest);
        
        var enumPortStruct = new EnumPortStruct();
        var portName = (HTML5_CONFIG && HTML5_CONFIG['features'] && HTML5_CONFIG['features']['com'] && HTML5_CONFIG['features']['com']['portname'])? HTML5_CONFIG['features']['com']['portname']:"COM5";
        enumPortStruct.nameSize = portName.length+1;
        enumPortStruct.extraSize = 0;
        
         var packet = new Uint8Array(CCMCONSTANT.ENUMSERIAL_REPLY_PACKET_HEADER_SIZE+CCMCONSTANT.ENUMPORTSTRUCT+  enumPortStruct.nameSize);
        
       
        enumSerialReply.header = header;
        enumSerialReply.numberOfPorts = 1;
        if(idx<enumSerialReply.numberOfPorts)
        {
             enumSerialReply.result =  errorWord(CCMCONSTANT.CCM_DOSERROR_NOERROR, CCMCONSTANT.CCM_ERROR_NONE);
        }
        else
        {
              enumSerialReply.result =  errorWord(CCMCONSTANT.CCM_DOSERROR_NOFILES, CCMCONSTANT.CCM_ERROR_NOTFOUND);
              enumPortStruct.nameSize = 0;
              enumPortStruct.extraSize = 0;
              enumSerialReply.numberOfPorts = 0;
              portName="";
        }
        
        enumSerialReply.size =  enumPortStruct.nameSize + enumPortStruct.extraSize + CCMCONSTANT.ENUMPORTSTRUCT;
        
        offset = marshallWriteEnumSerialReply(packet, offset, enumSerialReply,enumPortStruct,portName);
      
        vStream.WriteByte(packet, 0, offset);
       
    }

   function ccmFindContext(){
      var context;
      for(context=0;context<MAX_PORTS;context++)
      {
        if(OpenPorts[context]==undefined || OpenPorts[context] == null)
        {
          return context;
        }
      }
      
      return -1;
    }
    
    function CcmGetPortDefaults(openContext)
    {
          openContext.escapeModemStatus = 0;
          openContext.escapeLineStatus = 0;
      
          openContext.currentBaud.baudRate = CCMCONSTANT.CCM_BAUD_9600;
          openContext.lineInfo.dataBits =  CCMCONSTANT.CCM_8_DATA;
          openContext.lineInfo.parity   =  CCMCONSTANT.CCM_NONE_PARITY;
          openContext.lineInfo.stopBits =  CCMCONSTANT.CCM_1_STOP;
        
          openContext.queueSizes.txQueueSize=CCMCONSTANT.CCM_DEFAULT_TXQUEUESIZE;
          openContext.queueSizes.rxQueueSize=CCMCONSTANT.CCM_DEFAULT_RXQUEUESIZE;
        
          openContext.capabilities.maxTxQueue        = CCMCONSTANT.CCM_MAX_TXQUEUESIZE;
          openContext.capabilities.maxRxQueue        = CCMCONSTANT.CCM_MAX_RXQUEUESIZE;
          openContext.capabilities.supportedBauds    = CCMCONSTANT.CCMHOST_SUPPORTED_BAUDS;
          openContext.capabilities.capabilities      = CCMCONSTANT.CCMHOST_SUPPORTED_CAPS;
          openContext.capabilities.settableCaps      = CCMCONSTANT.CCMHOST_SUPPORTED_SET;
          openContext.capabilities.dataBits          = CCMCONSTANT.CCMHOST_SUPPORTED_DATABITS;
          openContext.capabilities.stopParity        = CCMCONSTANT.CCMHOST_SUPPORTED_STOPPARITY;
        
          openContext.specialChars.eOfChar   = 0;
          openContext.specialChars.errorChar = 0;
          openContext.specialChars.breakChar = 0;
          openContext.specialChars.eventChar = 0;
          openContext.specialChars.xonChar   = CCMCONSTANT.CCM_DEFAULT_XON;
          openContext.specialChars.xoffChar  = CCMCONSTANT.CCM_DEFAULT_XOFF;
          
          openContext.handFlow.controlHandShake = CCMCONSTANT.CCM_DTR_CONTROL;
          openContext.handFlow.flowReplace      = CCMCONSTANT.CCM_RTS_CONTROL;
          openContext.handFlow.xonLimit         = CCMCONSTANT.CCM_DEFAULT_XONLIMIT;
          openContext.handFlow.xoffLimit        = CCMCONSTANT.CCM_DEFAULT_XOFFLIMIT;
          
          openContext.timeouts.readIntervalTimeout = 0xFFFFFFFF;
          openContext.timeouts.readTotalTimeoutMultiplier = 0;
          openContext.timeouts.readTotalTimeoutConstant = 0;
          openContext.timeouts.writeTotalTimeoutMultiplier = 0;
          openContext.timeouts.writeTotalTimeoutConstant = 5000;
          
          openContext.escapeChar.escapeChar = 0;
    }
    
    function CcmOpenPort(portName,cmd,context,openSerialReply){
		var openContext = new OpenContext();
        CcmGetPortDefaults(openContext);
		
		// TODO: This should be done in ENUM request and we need to map COMx => local device names!
		chrome.serial.getDevices(function(devices) {
            writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:INSIDE CHROME.SERIAL.GETDEVICES");
          
			// TODO: Use the one that VDA wants after the mapping above and do not use the first one!
            chrome.serial.connect(devices[0].path,function(ConnectionInfo){                 
                openContext.connectionId = ConnectionInfo['connectionId'];
                writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:INSIDE CHROME.SERIAL.CONNECT");
                
			    // Convert to host format enum
				openContext.currentBaud.baudRate = formatBitRateC2H(ConnectionInfo.bitrate);
                
				// adjust data, parity and stop bits
				openContext.lineInfo.dataBits = (ConnectionInfo.dataBits=="eight") ? CCMCONSTANT.CCM_8_DATA : CCMCONSTANT.CCM_7_DATA;
                openContext.lineInfo.parity = (ConnectionInfo.parityBit == "no")  ? CCMCONSTANT.CCM_NONE_PARITY : 
											  (ConnectionInfo.parityBit == "odd") ? CCMCONSTANT.CCM_ODD_PARITY : CCMCONSTANT.CCM_EVEN_PARITY;
				openContext.lineInfo.stopBits = (ConnectionInfo.stopBits=="one") ? CCMCONSTANT.CCM_1_STOP : CCMCONSTANT.CCM_2_STOP;
          
				// We first need to reply async settings
				var aSyncSettingsReply = new CcmAsyncSettings();
				var aSyncPacket = new Uint8Array(CCMCONSTANT.CCM_ASYNC_SETTINGS_REPLY_PACKET_SIZE);
				var aSyncOffset = 0;
				
				aSyncSettingsReply.hType = CCMCONSTANT.CCM_ASYNC_SETTINGS;
				aSyncSettingsReply.mpxId = cmd.mpxId;
				aSyncSettingsReply.specialChars = openContext.specialChars;
				aSyncSettingsReply.escapeChar = openContext.escapeChar;
				aSyncSettingsReply.handFlow = openContext.handFlow;
				aSyncSettingsReply.timeouts = openContext.timeouts;
				
				// store the context for later use. reset the input buffer
				OpenPorts[context] = openContext;
				OpenPorts[context].InputBufferLength =  0;
				
				aSyncOffset = marshallWriteAsyncSettingsReply(aSyncPacket,aSyncOffset,aSyncSettingsReply);
				vStream.WriteByte(aSyncPacket,0,aSyncOffset);
				
				// Now lets write the actual open reply
				var packet = new Uint8Array(CCMCONSTANT.OPENSERIAL_REPLY_PACKET_SIZE);
				var offset = 0;
				openSerialReply.context = context;
				openSerialReply.result = errorWord(CCMCONSTANT.CCM_DOSERROR_NOERROR , CCMCONSTANT.CCM_ERROR_NONE);
				offset = marshallWriteOpenSerialReply(packet, offset, openSerialReply,openContext);
				vStream.WriteByte(packet, 0, offset);
				
				// add connection id to cleanup list during close of session.
				var current = chrome.app.window.current();
				if (current) {
					if (!backPage) {
						chrome.runtime.getBackgroundPage(function(bp){
							backPage = bp;
							backPage.SessionCleanupHelper.add("serial", current, openContext.connectionId);
						});
					} else {
						backPage.SessionCleanupHelper.add("serial", current, openContext.connectionId);
					}
				}
			});
          
		});
       return openContext;
    }

    function handleOpenSerialRequest(cmd) {
      writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:INSIDE OPEN REPLY");
        var openSerialRequest = new OpenSerialRequest();
        var openSerialReply = new OpenSerialReply();
       
        var header = new CcmPacketHeader();
        var byteName;
        var context;
        var openContext = new OpenContext();
        header.initialize(CCMCONSTANT.CCM_OPENPORT_REPLY, cmd.mpxId);
        openSerialRequest.header = cmd;
        marshallReadOpenSerialRequest(vStream, openSerialRequest);
        
        openSerialReply.header = header;
        context = ccmFindContext();
       
        if(context==-1)
        {
            openSerialReply.result = errorWord(CCMCONSTANT.CCM_DOSERROR_UNKNOWN , CCMCONSTANT.CCM_ERROR_RESOURCE );
            openSerialReply.context = -1;
            openSendReply(openSerialReply);
            return;
        }
        
        openContext= CcmOpenPort(openSerialRequest.portName,cmd,context,openSerialReply);
        
    }

    function handleWriteSerialRequest(cmd) {
        var writeSerialRequest = new WriteSerialRequest();
        var writeSerialReply = new WriteSerialReply();
        var packet = new Uint8Array(CCMCONSTANT.WRITESERIAL_REPLY_PACKET_SIZE);
        var offset = 0;
        var header = new CcmPacketHeader();
        var data;
        var context;
        header.initialize(CCMCONSTANT.CCM_WRITEPORT_REPLY, cmd.mpxId);
        writeSerialRequest.header = cmd;
        writeSerialReply.header = header;
        marshallReadWriteSerialRequest(vStream, writeSerialRequest);
        
        var writeData = new Uint8Array(writeSerialRequest.size);
        vStream.ReadBytes(writeData, 0, writeSerialRequest.size);
        
        writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:WRITE REQUESTED SIZE " + writeData.length);
        var openContext = OpenPorts[writeSerialRequest.context];
		// TODO: Let us combine smaller writes so that we can reply sooner to server instead of waiting for each send
        chrome.serial.send(openContext.connectionId, writeData.buffer, function(sendInfo){
            if(sendInfo.error)
            {
              writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:ERROR IN CHROME.SERIAL.SEND " + sendInfo.error  );
              writeSerialReply.amountWritten =0;
              writeSerialReply.result = errorWord(CCMCONSTANT.CCM_DOSERROR_LOCK , CCMCONSTANT.CCM_ERROR_INTERNAL);
            }
            else
            {
              writeSerialReply.amountWritten = sendInfo.bytesSent;
              writeSerialReply.result =  errorWord(CCMCONSTANT.CCM_DOSERROR_NOERROR , CCMCONSTANT.CCM_ERROR_NONE);
            }
            offset = marshallWriteWriteSerialReply(packet, offset, writeSerialReply);
            vStream.WriteByte(packet, 0, offset);
        });
        
    }

    function handleReadSerialRequest(cmd) {
        var readSerialRequest = new ReadSerialRequest();
        readSerialRequest.header = cmd;
        marshallReadReadSerialRequest(vStream, readSerialRequest);
        
        var port = OpenPorts[readSerialRequest.context];		
        if(port.InputBufferLength === 0) {
			// We don't have pending data, store the request mpx id.
           port.readMpxId = cmd.mpxId;
		   return; // done with request now.
        }
        
		// Let's send the pending data now
		writeReadPortReplyPacket(port, cmd.mpxId);
    }
    
    function handleSetPortSerialRequest(cmd){
      var setSerialRequest = new SetSerialRequest();
      var setSerialReply = new SetSerialReply();
      var packet = new Uint8Array(CCMCONSTANT.SETSERIAL_REPLY_PACKET_SIZE);
      var offset = 0;
      var header = new CcmPacketHeader();
      header.initialize(CCMCONSTANT.CCM_SETPORT_REPLY, cmd.mpxId);
      setSerialReply.header = header;
      setSerialRequest.header = cmd;
      setSerialReply.flags=0;
      
      marshallReadSetSerialRequest(vStream, setSerialRequest);
      var openContext = OpenPorts[setSerialRequest.context];
      var infoType = setSerialRequest.infoType;
      var infoSize = setSerialRequest.infoSize;
      
      var connectionOptions = {};
      var updateRequired = false;
      var setControlSignals= false;
      var connectionSignals={};

      writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:SETPORT REQUEST infoType: " + infoType + ", size: " + infoSize);
      
       switch(infoType){
          
            case CCMCONSTANT.CCM_INFO_TYPE_LINEINFO:
              marshallReadCcmLineInfo(vStream, connectionOptions);
              updateRequired=true;
              break;

            case CCMCONSTANT.CCM_INFO_TYPE_BAUDRATE:
              marshallReadCcmBaudRate(vStream, connectionOptions);
              updateRequired = true;
              break;
              
            case CCMCONSTANT.CCM_INFO_TYPE_SETSIGNAL:
              marshallReadCcmSetSignal(vStream,connectionSignals);
              setControlSignals = true;
              break;
              
			// Not implemented. TODO: parse data like above!
            case CCMCONSTANT.CCM_INFO_TYPE_CHARS:
            case CCMCONSTANT.CCM_INFO_TYPE_HANDFLOW:
            case CCMCONSTANT.CCM_INFO_TYPE_TIMEOUTS:  
            case CCMCONSTANT.CCM_INFO_TYPE_EVENTWAIT:
            case CCMCONSTANT.CCM_INFO_TYPE_ESCAPECHAR:
            case CCMCONSTANT.CCM_INFO_TYPE_CAPABILITIES:
            case CCMCONSTANT.CCM_INFO_TYPE_BUFFERSIZE:
            case CCMCONSTANT.CCM_INFO_TYPE_PURGE:
            case CCMCONSTANT.CCM_INFO_TYPE_MODEMSTATUS:
               updateRequired = true;
               vStream.SkipByte(infoSize);
               break;
        }
      
      if(updateRequired)
      {
        chrome.serial.update(openContext.connectionId, connectionOptions, function(result){
          setSerialReply.result = errorWord(CCMCONSTANT.CCM_DOSERROR_NOERROR , CCMCONSTANT.CCM_ERROR_NONE);
          offset = marshallWriteSetSerialReply(packet, offset, setSerialReply);
          vStream.WriteByte(packet, 0, offset);
        });
      }
      
      
      if(setControlSignals)
      {
        chrome.serial.setControlSignals(openContext.connectionId, connectionSignals, function(result){
          setSerialReply.result = errorWord(CCMCONSTANT.CCM_DOSERROR_NOERROR , CCMCONSTANT.CCM_ERROR_NONE);
          offset = marshallWriteSetSerialReply(packet, offset, setSerialReply);
          vStream.WriteByte(packet, 0, offset);
        });
      }
      
    }
    
    function handleGetPortSerialRequest(cmd){
      writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:INSIDE GETPORT REQUEST");
      
      var getSerialRequest = new GetSerialRequest();
      var getSerialReply = new GetSerialReply();
      var getAsyncReply = new GetAsyncReply();
      var packet = new Uint8Array(CCMCONSTANT.GETSERIAL_REPLY_PACKET_SIZE);
      var offset = 0;
      var header = new CcmPacketHeader();
      header.initialize(CCMCONSTANT.CCM_GETPORT_REPLY, cmd.mpxId);
      getSerialReply.header = header;
      getSerialRequest.header = cmd;
      
      marshallReadGetSerialRequest(vStream, getSerialRequest);
      var openContext = OpenPorts[getSerialRequest.context];
      
      var infoType = getSerialRequest.infoType;
     
      
       switch(infoType){
          
            case CCMCONSTANT.CCM_INFO_TYPE_EVENTWAIT:
              writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:GETPORT REQUEST INFOTYPE: EVENTWAIT");
              
              /*var modemStatusState=0;
              
              if(!modemAsyncStatusFlag)
              {
                    offset=0;
                    chrome.serial.getControlSignals(openContext.connectionId, function(signals){
                    if(signals.dcd)
                    {
                      modemStatusState = modemStatusState |CCMCONSTANT.CCM_MODEM_DCD;
                    }
                     if(signals.cts)
                    {
                      modemStatusState = modemStatusState |CCMCONSTANT.CCM_MODEM_CTS;
                    }
                     if(signals.ri)
                    {
                      modemStatusState = modemStatusState |CCMCONSTANT.CCM_MODEM_RI;
                    }
                     if(signals.dsr)
                    {
                      modemStatusState = modemStatusState |CCMCONSTANT.CCM_MODEM_DSR;
                    }
                    
                     packet = new Uint8Array(CCMCONSTANT.GETSERIAL_REPLY_PACKET_SIZE + CCMCONSTANT.CCM_ASYNC_MODEM_PACKET_SIZE);
                     offset=0;
                     
                     
                     getAsyncReply.header = CCMCONSTANT.ASYNC_MODEM_STATUS;
                     getAsyncReply.padding=0;
                     getAsyncReply.context =  getSerialRequest.context;
                     getAsyncReply.modemStatus = modemStatusState;
                     
                     if(!modemAsyncStatusFlag)
                     {
                        offset = marshallWriteGetAsyncModemReply(packet, offset, getAsyncReply);
                        vStream.WriteByte(packet, 0, offset);
                     }
                  
                  });
              }*/
          
              break;

            case CCMCONSTANT.CCM_INFO_TYPE_CAPABILITIES:
              writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:GETPORT REQUEST INFOTYPE: CAPABILITIES");
              
              getSerialReply.infoSize = CCMCONSTANT.CCM_CAPABILITIES_PACKET_SIZE;
              getSerialReply.result = errorWord(CCMCONSTANT.CCM_DOSERROR_NOERROR , CCMCONSTANT.CCM_ERROR_NONE);
              
              packet = new Uint8Array(CCMCONSTANT.GETSERIAL_REPLY_PACKET_SIZE+CCMCONSTANT.CCM_CAPABILITIES_PACKET_SIZE);
              offset=0;
              offset = marshallWriteGetSerialCapReply(packet, offset, getSerialReply,openContext.capabilities);
              vStream.WriteByte(packet, 0, offset);
              break;
              
            case CCMCONSTANT.CCM_INFO_TYPE_MODEMSTATUS:
              writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:GETPORT REQUEST INFOTYPE: MODEMSTATUS");
              
              getSerialReply.infoSize = CCMCONSTANT.CCM_MODEMSTATUS_PACKET_SIZE;
              getSerialReply.result = errorWord(CCMCONSTANT.CCM_DOSERROR_NOERROR , CCMCONSTANT.CCM_ERROR_NONE);
              
              chrome.serial.getControlSignals(openContext.connectionId, function(signals){
                // TODO: return proper error to server via async modem status?
                if (chrome.runtime.lastError || !signals) {
                    writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:ERROR in CHROME.SERIAL.ONRECEIVE: " + chrome.runtime.lastError);
                    return;
                }
                
				// TODO: Do we need to send actual status first time?
				var curModemStatus = 0;
                if(signals.dcd) {
                  curModemStatus |= CCMCONSTANT.CCM_MODEM_DCD;
                }
                if(signals.cts) {
                  curModemStatus |= CCMCONSTANT.CCM_MODEM_CTS;
                }
                if(signals.ri) {
                  curModemStatus |= CCMCONSTANT.CCM_MODEM_RI;
                }
                if(signals.dsr) {
                  curModemStatus |= CCMCONSTANT.CCM_MODEM_DSR;
                }
				
				// Compute delta values and store latest state
				var delta = openContext.lastModemStatus ^ curModemStatus;
				openContext.lastModemStatus = curModemStatus;
				
				if (delta & CCMCONSTANT.CCM_MODEM_DCD) {
                  curModemStatus |= CCMCONSTANT.CCM_MODEM_DDCD;
                }
                if (delta & CCMCONSTANT.CCM_MODEM_CTS) {
                  curModemStatus |= CCMCONSTANT.CCM_MODEM_DCTS;
                }
                if (delta & CCMCONSTANT.CCM_MODEM_RI) {
                  curModemStatus |= CCMCONSTANT.CCM_MODEM_TERI;
                }
                if (delta & CCMCONSTANT.CCM_MODEM_DSR) {
                  curModemStatus |= CCMCONSTANT.CCM_MODEM_DDSR;
                }
                
                 packet = new Uint8Array(CCMCONSTANT.GETSERIAL_REPLY_PACKET_SIZE+CCMCONSTANT.CCM_MODEMSTATUS_PACKET_SIZE);
                 offset=0;
                 offset = marshallWriteGetSerialModemReply(packet, offset, getSerialReply,curModemStatus);
                 vStream.WriteByte(packet, 0, offset);
              
              });
              
             
          
              break;
            
            default:
				writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|: Unhandled GETPORT REQUEST INFOTYPE: " + infoType);
                break;
        }
    }

    function handleCloseSerialRequest(cmd) {
      writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:INSIDE CLOSEPORT REQUEST");
        var closeSerialRequest = new CloseSerialRequest();
        var closeSerialReply = new CloseSerialReply();
        var packet = new Uint8Array(CCMCONSTANT.CLOSESERIAL_REPLY_PACKET_SIZE);
        var offset = 0;
        var header = new CcmPacketHeader();
        var data;
        var tempvar;
        var lastArrayBuffer;
        header.initialize(CCMCONSTANT.CCM_CLOSEPORT_REPLY, cmd.mpxId);
        closeSerialReply.header = header;
        closeSerialRequest.header = cmd;
        
        marshallReadCloseSerialRequest(vStream, closeSerialRequest);
        var openContext = OpenPorts[closeSerialRequest.context];
        
        // cleanup the context now
        OpenPorts[closeSerialRequest.context] = null;
        
        chrome.serial.flush(openContext.connectionId, function(result){
          
           writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:INSIDE CHROME.SERIAL.FLUSH");
        
            chrome.serial.disconnect(openContext.connectionId, function(finalResult){
              
              writeHTML5Log(0, "SESSION:|:ICA:|:COM:|:ENGINE:|:INSIDE CHROME.SERIAL.DISCONNECT");
              
                closeSerialReply.result = errorWord(CCMCONSTANT.CCM_DOSERROR_NOERROR , CCMCONSTANT.CCM_ERROR_NONE);
                offset = marshallWriteCloseSerialReply(packet, offset, closeSerialReply);
        
                vStream.WriteByte(packet, 0, offset);
				
				// We no longer need this connection to be cleaned up
				var current = chrome.app.window.current();
				if (current && backPage) {	
					backPage.SessionCleanupHelper.remove("serial", current, openContext.connectionId);
				}
             });
        });
    }
}