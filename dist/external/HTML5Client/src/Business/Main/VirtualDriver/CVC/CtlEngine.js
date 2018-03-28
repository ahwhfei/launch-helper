/**
* This class implements the ICA control
* virtual channel client functionality.
*
*/

function CTLVirtualDriver(callbackWrapper1) {
    var myself = this;
    var callBackWrapper = callbackWrapper1;
    var streamName = "CTXCTL ";

    //TODO: Why is this 0x2000?
    var streamSize = 0x2000;

    var ICACC_BIND_REQUEST = 0x00;
    var ICACC_BIND_RESPONSE = 0x01;
    var ICACC_BIND_COMMIT = 0x02;

    var ICACC_LAUNCH_REQUEST = 0x03;
    var ICACC_LAUNCH_RESPONSE = 0x04;

    var ICACC_LOGOUT = 0x08;
	var ICACC_SFTA_URL_LAUNCH_REQUEST = 0x09;
    var ICACC_SFTA_URL_RESPONSE = 0x0a;
	var ICACC_SESSION_EVENT = 0x0F;

    var ICACC_ENCODING_UNICODE = 0x02;
    var ICACC_FLAG_INITIAL_PROGRAM_SUPPORT = 0x01;

    // Values for the capability blocks.

    var ICACC_CAPABILITY_VERSION = 0x01;
    var ICACC_CAPABILITY_ENCODING = 0x02;
    var ICACC_CAPABILITY_LAUNCH_PARAMETERS = 0x03;
    var ICACC_CAPABILITY_GENERIC_PARAMETERS = 0x04;
    var ICACC_CAPABILITY_INITIAL_PROGRAM = 0x05;
    var ICACC_CAPABILITY_SFTA = 0x06;
	var ICACC_CAPABILITY_SESSION_EVENT = 0x0A;
	
	// Session event types
	var CTXCTL_EL_TYPE_SESSION_EVENT_STATE = 0x00000001;
	var CTXCTL_EL_TYPE_SESSION_EVENT_GUID = 0x00000002;
	// Session event session states
	var CTXCTL_SESSION_STATE_LOCK = 0x00000001;
	var CTXCTL_SESSION_STATE_DISCONNECT = 0x00000002;
	var CTXCTL_SESSION_STATE_LOGOFF = 0x00000003;

    var ICACC_SFTA_URL = 0x01;
    var ICACC_LAUNCH_FLAGS_DEFAULT = 0;

    var ICACC_LAUNCH_FLAGS_RECONNECT = 0x10000;
    var ICACC_SFTA_SUCCESS = 0;
    var ICACC_SFTA_FAILURE = 1;
    //THE VALUES RETURNED FROM LAUNCH RESPONSE
    
    var ICACC_LAUNCH_STATUS_SUCCESS              = 0x00;
    var ICACC_LAUNCH_STATUS_INCORRECT_PARAMETER  = 0x01;
    var ICACC_LAUNCH_STATUS_PERMISSION_VIOLATION = 0x02;
    var ICACC_LAUNCH_STATUS_PERMISSION_MISMATCH  = 0x03;
    var ICACC_LAUNCH_STATUS_BAD_APP_CONFIG       = 0x04;
    var ICACC_LAUNCH_STATUS_LAUNCH_ERROR         = 0x06;
    var ICACC_LAUNCH_STATUS_BAD_COMMAND_LINE     = 0x07;
    var ICACC_LAUNCH_STATUS_NOT_LOGGED_IN        = 0x08;
    



    var ICACC_CURRENT_VERSION = 1;
    var ICACC_LOGOUT_DISCONNECT = 2;
    var ii = 0;
    var SFTA_RESPONSE_LENGTH = 4;
    var LAUNCH_REQUEST_LENGTH = 12;
    var LOGOUT_REQUEST_LENGTH = 2;
    var BIND_RESPONSE_LENGTH = 4;
    var GENERIC_PARAMETERS_CAP_LENGTH = 10;

    var maxCmdLineLength = 0;
    var initialProgram = null;
    var longCommandLine = null;
    //private int packet_len = 0;
    var hasCommitted = false;

    // private Stack launchCallbacks = new Stack();
    var channelActive = false;
    var vStream = null;


    this.getStreamName = function () {
        return streamName;
    };





    /**
    * Processes the commands as they come over the virtual channel.  This
    * method is currently designed to run continually in the thread.  This
    * consuming is synchronized by the vStream which blocks on any read until
    * data is available.
    */
    var processCommand = function () {

        var packet_len = vStream.ReadUInt16();  // Length is two-byte
        var command = vStream.ReadByte();   // Commands are 1-byte
        vStream.ReadByte();  //reserved one.

        var cmdBuffer = new Uint8Array(packet_len);
        vStream.ReadBytes(cmdBuffer, 0, packet_len);

        switch (command) {
            case ICACC_BIND_REQUEST:
                readCapabilities(cmdBuffer, true);
                break;

            case ICACC_BIND_COMMIT:
                readCapabilities(cmdBuffer, false);
                callBackWrapper.capExchangeComplete( );
                break;

            case ICACC_LAUNCH_RESPONSE:
                handleLaunchResponse(cmdBuffer);
                break;

            case ICACC_SFTA_URL_LAUNCH_REQUEST:
                handleSFTA(cmdBuffer);
                break;
				
			case ICACC_SESSION_EVENT:
				handleSessionEvent(cmdBuffer);
				break;

            default:
                // Unknown command
                //throw new ProtocolException("Control Virtual Channel unknown command: "+Util.twoHexChars(command));
                //break;
        }
    };

    var driverShutdown = function () {

    };

    var createVirtualStream = function (streamName, streamSize) {
        var chnl = ChannalMap.virtualChannalMap[streamName];
        var stream = new VirtualStream(chnl, callBackWrapper, streamSize);
        return stream;
    };
    this.EndWriting = function endWriting(reason) {

    };

    this.driverStart = function () {
    };

    /**
    * Reads capabilities. If "respond" is true, this is the initial packet
    * from the server, and we need to respond to it. If "respond" is false,
    * then this is the final packet from the server (after our response) and
    * the capabilities in the packet should be used.
    */
    var readCapabilities = function (buffer, respond) {
        //Debug.trace("CTL - reading capabilities respond = " + respond);
        //Debug.traceBuf(buffer);
        var outputStream = new ByteArrayOutputStream();

        channelActive = true;

        var offset = ByteWriter.readUInt2(buffer, 0);
        var originalOffset = offset;
        var numCaps = buffer[2];
        var initialProgramByte = 0;
        //byte [] returningBuffer = new byte[packet_len];
        //int returningOffset  = 0;
        var returningCapsNum = 0;

        for (var i = 0; i < numCaps; i++) {
            var capOffset = offset;
            var capabilityID = ByteWriter.readUInt2(buffer, offset); offset += 2;
            var capabilitySize = buffer[offset++];
            offset++; // Reserved byte

            //console.log("Read capabilityID " + capabilityID + ", size = " + capabilitySize);
            switch (capabilityID) {
                
                case ICACC_CAPABILITY_LAUNCH_PARAMETERS: {
                var cmdLineLength = ByteWriter.readUInt2(buffer, offset);
                // hack to overcome the server side bug
                // The server sends us the same capability ID for
                // ICACC_CAPABILITY_LAUNCH_PARAMETERS and
                // ICACC_CAPABILITY_GENERIC_PARAMETERS.  However as the size of
                // the two capability blocks is different so we have to be
                // cautious while reading the capability and sending the
                // response back.

                if(cmdLineLength != 0) {
                // As we are dealing only with Unicode characters, just
                // making sure that the server sends us a command line
                // length which is a multiple of 2.
                maxCmdLineLength = cmdLineLength;
                maxCmdLineLength &= ~1;

                if (respond) {
                returningCapsNum++;
                ByteWriter.WriteInt16ToStream(outputStream,capabilityID);
                outputStream.WriteByte(capabilitySize);
                outputStream.WriteByte(0);//reserved byte

                // we dont have a maximum limit.  So we record this
                // value and send the same back to the server
                ByteWriter.WriteInt16ToStream(outputStream, maxCmdLineLength);

                // its 0 here for maximum environment block as we don't
                // suport environment variables.
                ByteWriter.WriteInt16ToStream(outputStream, 0);

                if(capabilitySize == GENERIC_PARAMETERS_CAP_LENGTH) {
                // Again to overcome server side bug.
                ByteWriter.WriteInt16ToStream(outputStream,0);
                }
                }
                }

                break;
                } 
                case ICACC_CAPABILITY_SFTA:
                    {
                        var sftaLevel = ByteConverter.Byte4ToInt32AtOffset(buffer, offset);
                        if (respond) {
                            returningCapsNum++;
                            ByteWriter.WriteInt16ToStream(outputStream, capabilityID);
                            outputStream.WriteByte(capabilitySize);
                            outputStream.WriteByte(0); //reserved byte
                            var returnValue = ((sftaLevel == ICACC_SFTA_URL) ? ICACC_SFTA_URL : 0);
                            ByteWriter.WriteInt32ToStream(outputStream, returnValue);
                            // ui.initializePrintDialog();

                        }
                        break;
                    }
					
				case ICACC_CAPABILITY_SESSION_EVENT:
                    {
                        if (respond) {
                            returningCapsNum++;
                            ByteWriter.WriteInt16ToStream(outputStream, capabilityID);
                            outputStream.WriteByte(capabilitySize);
                            outputStream.WriteByte(0); //reserved byte
                        }
                        break;
                    }


                case ICACC_CAPABILITY_ENCODING:
                    {
                        var encodingType = buffer[offset]; //neglect the encoding type here as we always use unicode
                        if (respond) {
                            returningCapsNum++;
                            ByteWriter.WriteInt16ToStream(outputStream, capabilityID);
                            outputStream.WriteByte(capabilitySize);
                            outputStream.WriteByte(0); //reserved
                            outputStream.WriteByte(ICACC_ENCODING_UNICODE);
                            outputStream.WriteByte(0); //reserved
                            outputStream.WriteByte(0); //reserved
                            outputStream.WriteByte(0); //reserved
                            ByteWriter.WriteInt32ToStream(outputStream, 0); //ASCII encoding page -- valid for ASCII only.

                        }
                        break;
                    }
                case ICACC_CAPABILITY_VERSION:
                    {
                        var versionNumber = buffer[offset];
                        if (respond) {
                            returningCapsNum++;
                            ByteWriter.WriteInt16ToStream(outputStream, capabilityID);
                            outputStream.WriteByte(capabilitySize);
                            outputStream.WriteByte(0); //reserved
                            outputStream.WriteByte(ICACC_CURRENT_VERSION);
                            outputStream.WriteByte(0); //reserved
                            outputStream.WriteByte(0); //reserved
                            outputStream.WriteByte(0); //reserved

                        }
                        break;
                    }
                    
                    case ICACC_CAPABILITY_INITIAL_PROGRAM: {
                    initialProgramByte = buffer[offset];
                    if(respond){
                    returningCapsNum++;
                    ByteWriter.WriteInt16ToStream(outputStream,capabilityID);
                    outputStream.WriteByte(capabilitySize);
                    outputStream.WriteByte(0);//reserved
                    var useInitialProgram = 0x01;
                    if (longCommandLine == null || longCommandLine.length == 0 )
                    useInitialProgram = 0x00;
                    outputStream.WriteByte(useInitialProgram);
                    outputStream.WriteByte(0);//reserved
                    outputStream.WriteByte(0);//reserved
                    outputStream.WriteByte(0);//reserved
                    }
                    break;
                    }
                    
                default:
                    {
                        //do nothing.
                    }
            }
            offset = capOffset + capabilitySize;

        }
        if (respond) {
            sendBindResponsePacket(returningCapsNum, outputStream.ToByteArray());
            hasCommitted = true;
        }
        else if (initialProgramByte == ICACC_FLAG_INITIAL_PROGRAM_SUPPORT && hasCommitted && !(initialProgram == null || initialProgram.length == 0)) {
            launchApp(initialProgram, longCommandLine, false, this);
        }
    };

    //Sends the bind response packet with all the capabilities the client could handle.
    var sendBindResponsePacket = function (numCaps, capsArray) {

        var packetLen = capsArray.length;
        //Debug.traceBuf(capsArray);
        var returnStream = new ByteArrayOutputStream();
        ByteWriter.WriteInt16ToStream(returnStream, packetLen + BIND_RESPONSE_LENGTH); //length of the packet
        returnStream.WriteByte(ICACC_BIND_RESPONSE);
        returnStream.WriteByte(0); //reserved byte
        ByteWriter.WriteInt16ToStream(returnStream, BIND_RESPONSE_LENGTH); //offset to the capability blocks.
        returnStream.WriteByte(numCaps); //number of returning capability blocks.
        returnStream.WriteByte(0); //reserved byte
        returnStream.WriteByteArray(capsArray, 0, capsArray.length); //capabilty array
        var response = returnStream.ToByteArray();
        //Debug.traceBuf(response);
        vStream.WriteByte(response, 0, response.length);
        //vStream.flush();
    };

    var launchApp = function (appName, parameters, isSharedSession) {
        if (channelActive) {
            try {
                if (writeLaunchRequest(appName, parameters, isSharedSession)) {
                    //launchCallbacks.push(cb);
                }
            } catch (e) {
                // We are no longer connected, return false because the
                // launch could not be completed.
                return false;
            }
        }

        return channelActive;
    };
	this.launchApplication = function(icaData){
		var cmdLineParam = null;
		if (icaData['cmdLine'] || icaData['LongCommandLine']) {
			if (icaData['LongCommandLine'] != "") {
				cmdLineParam = icaData['LongCommandLine'];
			} else if (icaData['cmdLine'] != "") {
				cmdLineParam = icaData['cmdLine'];
			}
		}
		launchApp(icaData['InitialProgram'], cmdLineParam, true);
		
		// bring window to focus.
		callBackWrapper.focusWindow();
	};
    this.getAppLauncherPriority = function () {
        return AppLauncher.APPLAUNCH_PRIORITY_CVC;
    };


    //This method sends the initial program across the wire along with the long command line.
    var writeLaunchRequest = function (appName, parameters, isSharedSession) {
        console.log("writeLaunchRequest(\""+appName+"\", \"" + parameters+"\")");
        //the syntax of the initial program should be
        //  #"<initial program name>"

        if (appName.indexOf("#") == 0) {
            // Strip off leading # if necessary
            appName = appName.substring(1);
        } else {
            // no leading #
            return false;
        }

        // Add " at beginning of application name if necessary
        if (!(appName.indexOf("\"") == 0))
            appName = "\"" + appName;

        // Add " at end of application name if necessary
        if (!(appName.lastIndexOf("\"") == appName.length - 1))
            appName += "\"";

        appName += "\"";

        // Replace # at beginning of application name
        appName = "#" + appName;

        // Nul terminate application name
        appName += "\0";

        // Record length of application name
        var appNameLength = Utility.getUnicodeStringSize(appName, 0);

        if (parameters == null || parameters.length == 0) {
            parameters = "";
        } else if ((Utility.getUnicodeStringSize(parameters, 0) + 2) > maxCmdLineLength) {
            // Truncate command line to maximum length (leaving space for terminating Nul
            parameters = parameters.substring(0, (maxCmdLineLength - 2) / 2);
        }

        // Nul terminate command line
        parameters += "\0";

        // Record length of command line
        var paramsLength = Utility.getUnicodeStringSize(parameters, 0);
        var longCmdLineOffset = LAUNCH_REQUEST_LENGTH + appNameLength;
        var packetLength = LAUNCH_REQUEST_LENGTH + appNameLength + paramsLength;

        var outputStream = new ByteArrayOutputStream();

        // Write CVC header
        ByteWriter.WriteInt16ToStream(outputStream, packetLength);               // packet length (excludes header)
        outputStream.WriteByte(ICACC_LAUNCH_REQUEST);
        outputStream.WriteByte(0);                                          // reserved

        // Write message payload
        ByteWriter.WriteInt16ToStream(outputStream, LAUNCH_REQUEST_LENGTH);      // offset to application name
        ByteWriter.WriteInt16ToStream(outputStream, longCmdLineOffset);          // offset to the long command line.
        ByteWriter.WriteInt16ToStream(outputStream, 0x00);                       // environment block length
        ByteWriter.WriteInt16ToStream(outputStream, 0x00);                       // offset to environment block
        ByteWriter.WriteInt32ToStream(outputStream, ICACC_LAUNCH_FLAGS_DEFAULT); // Launching flags.

        // application name bytes in unicode format
        var program = new Uint8Array(appNameLength);
        Utility.writeUnicodeString(program, 0, appName, appName.length);
        outputStream.WriteByteArray(program, 0, program.length);

        var cmdLine = new Uint8Array(Utility.getUnicodeStringSize(parameters, 0));
        Utility.writeUnicodeString(cmdLine, 0, parameters, paramsLength);
        outputStream.WriteByteArray(cmdLine, 0, cmdLine.length);

        var packet = outputStream.ToByteArray();

        //Debug.traceBuf(packet);

        vStream.WriteByte(packet, 0, packet.length);

		if(isSharedSession) {
			callBackWrapper.sendEndScdToEuem(Date.now());
		}

        // vStream.flush();

        return true;
    };

    /**************************************************************************
    *                                                                        *
    *  ICAModule Interface Implementation                                    *
    *                                                                        *
    **************************************************************************/


    /**
    * Initialize using any needed parameters in the profile, etc.
    */
    this.initialize = function (configObj) {
        // Read profile data for initial program launching.
        initialProgram = configObj.initialprogram;
        longCommandLine = configObj.cmdLine;
    };

    /**
    * This method takes care of the response sent back by the server once a
    * launch request has been processed by the server.
    */
    var handleLaunchResponse = function (buffer) {
        var statusCode = ByteConverter.Byte4ToInt32AtOffset(buffer, 0);

        // Call back the originator of the launch request (if a callback is
        // required)
        /* AppLaunchCallback cb = (AppLaunchCallback)launchCallbacks.pop();

        if (cb != null) {
        cb.appLaunchStatus(statusCode);
        }*/
    };

    /**
    * This method gets the url name from the server and opens the url in the
    * client machine browser rather than in the session browser.
    */
    var handleSFTA = function (buffer) {


        var offset = ByteWriter.readUInt2(buffer, 0);
        var index;
        for (index = offset; index < buffer.length; index++) {
            var ch = buffer[index];
            if (ch == '\u0000') //looking for the null termination at the end of the url name given by the server.
                break;
        }
        var tempArray = new Uint8Array(index - offset);
        Utility.CopyArray(buffer, 2, tempArray, 0, tempArray.length);
        //   var url = new String(tempArray);
        var sftaUrl = "";
        for (var i = 0; i < tempArray.length; i++) {
            sftaUrl = sftaUrl + String.fromCharCode(tempArray[i]);
        }
        var startChar = sftaUrl.charCodeAt(0);
        if ((startChar >= 48 && startChar <= 57) || (startChar >= 65 && startChar <= 90) || (startChar >= 97 && startChar <= 122)) {
             callBackWrapper.showUrlDialog(sftaUrl);
        }
        else {
            this.urlRedirectionCallback(false);
        }


        // vStream.flush();
    };

    this.urlRedirectionCallback = function (status) {
        var outputStream = new ByteArrayOutputStream();
        var sftaResponseStatus;
        if (status == true) {
            sftaResponseStatus = ICACC_SFTA_SUCCESS;
        }
        else {
            sftaResponseStatus = ICACC_SFTA_FAILURE;
        }
        ByteWriter.WriteInt16ToStream(outputStream, SFTA_RESPONSE_LENGTH);
        outputStream.WriteByte(ICACC_SFTA_URL_RESPONSE);
        outputStream.WriteByte(0); //reserved byte
        ByteWriter.WriteInt32ToStream(outputStream, sftaResponseStatus); //returning status whether a success or failure.
        var packet = outputStream.ToByteArray();
        vStream.WriteByte(packet, 0, packet.length);
    };
	
	/**
    * This method handles the session events from the server - guid, lock, disconnect, logoff etc.
    */
    var handleSessionEvent = function (eventData) {
		var buffer = eventData.buffer;
		var offset = 0;
		
		//CTXP_ELEMENT_ARRAY_HEADER
		var temp = new Uint16Array(buffer, offset, 1);
        var oElements = temp[0];
		offset += 2;
		temp = new Uint16Array(buffer, offset, 1);
		var elementsCount = temp[0];
		offset += 2;
		
		//CTXP_ELEMENT_HEADER, only one element for session event
		temp = new Uint32Array(buffer, offset, 1);
		var byteCount = temp[0];
		offset += 4;
		temp = new Uint32Array(buffer, offset, 1);
		var type = temp[0];
		offset += 4;

		/*console.log("Session event received, ElementsCount: " + elementsCount + ", oElements: " + oElements +
					", ByteCount: " + byteCount + ", Type: " + type + ", totalLen: " + eventData.length);*/
		
		if (type === CTXCTL_EL_TYPE_SESSION_EVENT_STATE) {
			// CTXCTL_SESSION_EVENT_STATE
			temp = new Uint32Array(buffer, offset, 1);
			var sessionState = temp[0];
			offset += 4;
			if (sessionState === CTXCTL_SESSION_STATE_LOCK) {
				sessionState = "LOCK";
			} else if (sessionState === CTXCTL_SESSION_STATE_DISCONNECT) {
				sessionState = "DISCONNECT";
			} else if (sessionState === CTXCTL_SESSION_STATE_LOGOFF) {
				sessionState = "LOGOFF";
			}
			writeHTML5Log(0, "SESSION:|:ICA:|:CONTROL:|:DRIVER:|:Session Event of type Session State: " + sessionState );
		} else if (type === CTXCTL_EL_TYPE_SESSION_EVENT_GUID) {
			// CTXCTL_SESSION_EVENT_GUID
			function formatNum(num, size) {
				var s = num+"";
				while (s.length < size) s = "0" + s;
				return s;
			}
			// CTXP_GUID
			temp = new Uint32Array(buffer, offset, 1);
			var data1 = temp[0];
			offset += 4;
			data1 = formatNum(data1.toString(16), 8); // 8 digit hex
			temp = new Uint16Array(buffer, offset, 1);
			var data2 = temp[0];
			offset += 2;
			data2 = formatNum(data2.toString(16), 4); // 4 digit hex
			temp = new Uint16Array(buffer, offset, 1);
			var data3 = temp[0];
			offset += 2;
			data3 = formatNum(data3.toString(16), 4); // 4 digit hex
			var data4 = new Uint8Array(buffer, offset, 8);
			var index;
			temp = "";
			for (index = 0; index < 8; index++) {
				if (index === 2) temp += "-"; // 4 digit hex
				temp += formatNum(data4[index].toString(16), 2); //  12 digit hex
			}
			offset += 8;
			data4 = temp;
			
			var guid = "{" + data1 + "-" + data2 + "-" + data3 + "-" + data4 + "}";
			writeHTML5Log(0, "SESSION:|:ICA:|:CONTROL:|:DRIVER:|:Session Event of type Session GUID: " + guid );
		} else {
			writeHTML5Log(0, "SESSION:|:ICA:|:CONTROL:|:DRIVER:|:Session Event error with unknown type: " + type );
		}        
    };



    // AppLaunchCallback implementation
    // ================================
    this.appLaunchStatus = function (statusCode) {
        // Handle status code from launch of initial program...

        // The server reports any failure conditions through the thinwire
        // channel so we don't need to do anything here.
    };

    this.EndWriting = function endWriting(reason) {

    };

    this.SetStack = function (virtualStreamSupplier) {
        vStream = createVirtualStream(streamName, streamSize);
        return vStream;
    };


    var prevReadIndex = 0;

    this.Run = function run() {
        prevReadIndex = 0;
        vStream.RegisterCallback(this._Run);
    };

    this._Run = function _run() {
        var errorHandle = function () {
            vStream.setReadIndex(prevReadIndex);
            vStream.RegisterCallback(myself._Run);
        };

        try {
            while (vStream.Available( ) > 0) {
                /* Main processing */
                prevReadIndex = vStream.GetReadIndex();
                try {
                    processCommand();

                }
                catch (error) {
                    if (error == VirtualStreamError.NO_SPACE_ERROR) {
                        errorHandle();
                        return;
                    }
                    else {
                        throw error;
                    }
                }

                prevReadIndex = vStream.GetReadIndex();
            }
        }
        catch (error) {
            throw error;
        }
    };

}

