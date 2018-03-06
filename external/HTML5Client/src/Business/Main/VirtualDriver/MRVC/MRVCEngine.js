/**
* This class implements the ICA control
* virtual channel client functionality.
*
*/

function MRVCEngine(callbackWrapper1) {
    var myself = this;
    var callBackWrapper = callbackWrapper1;
    var streamName = "CTXMOB";

    //TODO: Why is this 0x2000?
    var streamSize = 0x2000;

    var MRVC_BIND_REQUEST = 0x01;
    var MRVC_BIND_RESPONSE = 0x02;
    var MRVC_BIND_COMMIT = 0x03;
	
		
	var CAPID_PICKER_CONTROL = 0x0A;
	var CAPID_INPUT = 0x01;
	
	var INPUT_DISPLAY_KEYBOARD = 0x01;
	var KYBD_TYPE_STANDARD_SUPPORT = 0x02;
	
	var KYBD_HIDE_SUPPORT = 0x01;
	var KYBD_RETURN_KEY_DEFAULT_SUPPORT = 0x01;
	
	var PICKER_CONTROL_SUPPORT = 0x01;
	var PICKER_CONTROL_TITLE_SUPPORT = 0x02;
	
	var MRVC_CMD_KEYBOARD_STATE_GET_REQUEST = 0x80;
	var MRVC_CMD_KEYBOARD_SHOW_REQUEST = 0x81;
	var MRVC_CMD_KEYBOARD_HIDE_REQUEST = 0x82;	
	var MRVC_CMD_KEYBOARD_STATE_GET_RESPONSE = 0x88;
	
	var KYBD_INVISIBLE = 0x00;
	
	var CMD_PICKER_CONTROL_SHOW_REQUEST = 0xB0;
	var CAP_LIST_HEADER_SIZE = 4;
	var KEYBOARD_CAP_LENGTH = 12;
	var PICKER_CAP_LENGTH = 6;
	
	var KEYBOARD_STATE_GET_RESPONSE_LENGTH = 34;
	var bb;
	var mobileReceiverView_obj;
	//Initializing in case of normal execution. For UT, mock objects will be set located at the EOF
	if(!(dependency && dependency.testEnv === true)){
		bb = GetBrowserBox();
		mobileReceiverView_obj = bb.getMobileReceiverView();
	}
	//Functions names needed for UT.
	var fns = {};	
    this.getStreamName = function () {
        return streamName;
    };
	function cmdBindResponse(capabilities,transactionId){
		this.size = 6;
		this.cmd = MRVC_BIND_RESPONSE;
		this.transactionId = 0;	//As per vc settting to 0. Once it is implemented should change	
		this.capabilities = capabilities;
	}
	function getClientCapabilities(capabilities){
		var buffer = new Array(0);
		buffer[0] = constructKeyboardCapability(capabilities["input"]);
		//Will be implemented in future, do not remove
		//buffer[1] = constructPickerCapability();
		
		return buffer;
	}
	cmdBindResponse.prototype.write = function(){
		var capsbuffer = getClientCapabilities(this.capabilities);
		var size = this.size + CAP_LIST_HEADER_SIZE;
		
		for(var i=0;i<capsbuffer.length;i++){
			size += capsbuffer[i].length;
		}
		
		var buffer = new Uint8Array(size);
		var offset = 0;
		buffer[offset++] = size & 0xff;
		buffer[offset++] = (size >> 8) & 0xff;
		
		buffer[offset++] = this.cmd & 0xff;
		buffer[offset++] = (this.cmd >> 8) & 0xff;
		
		buffer[offset++] = this.transactionId & 0xff;
		buffer[offset++] = (this.transactionId >> 8) & 0xff;
		
		buffer[offset++] = 4 & 0xff;
		buffer[offset++] = (4 >> 8) & 0xff;
		//count cap blocks
		buffer[offset++] = capsbuffer.length & 0xff;
		buffer[offset++] = (capsbuffer.length >> 8) & 0xff;
		
		for(var i=0;i<capsbuffer.length;i++){
			buffer.set(capsbuffer[i],offset);
			offset += capsbuffer[i].length;
		}

		return buffer;
	};
	function writeCapResponse(){
		
	}
	function capHeader(byteCount,capId){
		this.id = capId;
		this.size = byteCount;
	}
    /**
    * Processes the commands as they come over the virtual channel.  This
    * method is currently designed to run continually in the thread.  This
    * consuming is synchronized by the vStream which blocks on any read until
    * data is available.
    */
	
    var processCommand = function (vStream) {

        var packet_len = vStream.ReadUInt16();  // Length is two-byte
        var command = vStream.ReadUInt16();   // Commands are 2-bytes
        var transactionId = vStream.ReadUInt16();  //Will be zero
		
        switch (command) {
            case MRVC_BIND_REQUEST:
				console.log("MRVC_BIND_REQUEST");
				fns.processBindRequest(vStream,true);
                break;
            case MRVC_BIND_COMMIT:
				console.log("MRVC_BIND_COMMIT");
                callBackWrapper.raiseSessionReadyEvent();
				fns.processBindRequest(vStream,false,transactionId);				
                break;           
			case MRVC_CMD_KEYBOARD_STATE_GET_REQUEST :
				fns.sendKeyboardStateResponse(vStream,transactionId);
				break;
			case CMD_PICKER_CONTROL_SHOW_REQUEST:
				//Will be implemented in future
				break;
			case MRVC_CMD_KEYBOARD_SHOW_REQUEST : 
				fns.processShowKeyboardRequest(vStream);
			break;
			case MRVC_CMD_KEYBOARD_HIDE_REQUEST:
				fns.processHideKeyboardRequest();
			break;
            default:
				console.log("================================================================");
				console.log("new command " + command);
				console.log("================================================================");
                // Unknown command
                break;
        }
    };
	function processShowKeyboardRequest(vStream){
		if(!dependency.testEnv){
			CEIP.add('mrvc:autoKeyboardEnabled',true);
		}
		var kbTypes = vStream.ReadUInt16();
		var kbFlags = vStream.ReadUInt16();
		var kbCapitalization = vStream.ReadUInt16();
		var returnKeyType = vStream.ReadUInt16();
		var boundingRectangle = {};		
		boundingRectangle["left"] = vStream.ReadInt32();
		boundingRectangle["top"] = vStream.ReadInt32();
		boundingRectangle["right"] = vStream.ReadInt32();
		boundingRectangle["bottom"] = vStream.ReadInt32();			
		
		if(mobileReceiverView_obj){
			mobileReceiverView_obj.showAutoKeyboardBtn(boundingRectangle);
		}		
	}
	function processHideKeyboardRequest(){		
		if(mobileReceiverView_obj){
			mobileReceiverView_obj.hideAutoKeyboardBtn();
		}
	}

	function sendKeyboardStateResponse(vStream,transactionId){
		var buffer = new Uint8Array(KEYBOARD_STATE_GET_RESPONSE_LENGTH);
		var offset = 0;
		
		buffer[offset++] = KEYBOARD_STATE_GET_RESPONSE_LENGTH & 0xff;
		buffer[offset++] = (KEYBOARD_STATE_GET_RESPONSE_LENGTH >> 8) & 0xff;
		
		buffer[offset++] = MRVC_CMD_KEYBOARD_STATE_GET_RESPONSE & 0xff;
		buffer[offset++] = (MRVC_CMD_KEYBOARD_STATE_GET_RESPONSE >> 8) & 0xff; 
		
		buffer[offset++] = transactionId & 0xff;
		buffer[offset++] = (transactionId >> 8) & 0xff;
		
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		
		buffer[offset++] = KYBD_TYPE_STANDARD_SUPPORT & 0xff;
		buffer[offset++] = (KYBD_TYPE_STANDARD_SUPPORT >> 8) & 0xff;			
		
		buffer[offset++] = KYBD_INVISIBLE & 0xff;
		buffer[offset++] = (KYBD_INVISIBLE >> 8) & 0xff;		
		
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		
		buffer[offset++] = KYBD_RETURN_KEY_DEFAULT_SUPPORT & 0xff;
		buffer[offset++] = (KYBD_RETURN_KEY_DEFAULT_SUPPORT >> 8) & 0xff;
		
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		buffer[offset++] = 0;
		
		vStream.WriteByte(buffer,0,offset);
		
	}	
	
	function processBindRequest(vStream,sendResponse,transactionId){		
		var capabilities = parseBindRequest(vStream);
		if(sendResponse){
			sendBindResponse(vStream,capabilities,transactionId);
		}
	}
	
	function parseBindRequest(vStream){
		var capabilityOffset = vStream.ReadUInt16();
		var capabilityCount = vStream.ReadUInt16();
		var capByteCount = 0;
		var capId = 0;
		var capabilities = {};
		for(var i=0;i<capabilityCount;i++){
			//Reading Capability header
			capByteCount = vStream.ReadUInt16();
			capId = vStream.ReadUInt16();
			
			switch(capId){
				//Auto pop up keyboard 
				case CAPID_INPUT:
					var deviceInputTypes = vStream.ReadUInt16();
					var keyboardTypes = vStream.ReadUInt16();
					var keyboardFeatures = vStream.ReadUInt16();
					var returnKeyTypes = vStream.ReadUInt16();
					capabilities["input"]={"deviceInputTypes":deviceInputTypes,"keyboardTypes":keyboardTypes,"keyboardFeatures":keyboardFeatures,"returnKeyTypes":returnKeyTypes};
					break;
				//Picker 	
				case CAPID_PICKER_CONTROL:
					var pickerSupportFlags = vStream.ReadUInt16();
					break;
					
				//Other capabilities
				default:
					vStream.SkipByte(capByteCount-4);
			}
			
		}		
		return capabilities;
	}
	
	var constructKeyboardCapability = function(capability){
		var buffer = new Uint8Array(KEYBOARD_CAP_LENGTH);
		var offset = 0;
		//cap input
		buffer[offset++] = KEYBOARD_CAP_LENGTH & 0xff;
		buffer[offset++] = (KEYBOARD_CAP_LENGTH >> 8) & 0xff;
		
		buffer[offset++] = CAPID_INPUT & 0xff;
		buffer[offset++] = (CAPID_INPUT >> 8) & 0xff;
		
		buffer[offset++] = (capability["deviceInputTypes"] && INPUT_DISPLAY_KEYBOARD) & 0xff;
		buffer[offset++] = ((capability["deviceInputTypes"] && INPUT_DISPLAY_KEYBOARD) >> 8) & 0xff;
		  
		buffer[offset++] = (capability["keyboardTypes"] && KYBD_TYPE_STANDARD_SUPPORT) & 0xff;
		buffer[offset++] = ((capability["keyboardTypes"] && KYBD_TYPE_STANDARD_SUPPORT) >> 8) & 0xff;
		
		buffer[offset++] = (capability["keyboardFeatures"] && KYBD_HIDE_SUPPORT) & 0xff;
		buffer[offset++] = ((capability["keyboardFeatures"] && KYBD_HIDE_SUPPORT) >> 8) & 0xff;
		
		buffer[offset++] = (capability["returnKeyTypes"] && KYBD_RETURN_KEY_DEFAULT_SUPPORT) & 0xff;
		buffer[offset++] = ((capability["returnKeyTypes"] && KYBD_RETURN_KEY_DEFAULT_SUPPORT) >> 8) & 0xff;
		
		return buffer;
	};
	var constructPickerCapability = function(){
		var buffer = new Uint8Array(PICKER_CAP_LENGTH);
		var offset = 0;
		
		//picker capByteCount
		buffer[offset++] = PICKER_CAP_LENGTH & 0xff;
		buffer[offset++] = (PICKER_CAP_LENGTH >> 8) & 0xff;
		
		buffer[offset++] = CAPID_PICKER_CONTROL & 0xff;
		buffer[offset++] = (CAPID_PICKER_CONTROL >> 8) & 0xff;
		
		buffer[offset++] = 3 & 0xff;//bitwise or for picker flags
		buffer[offset++] = (3 >> 8) & 0xff;
		
		return buffer;
	};
	var sendBindResponse = function(vStream,capabilities,transactionId){
		var cbr = new cmdBindResponse(capabilities,transactionId);
		var responseBuffer = cbr.write();		
		//write to VStream
		vStream.WriteByte(responseBuffer,0,responseBuffer.length);
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

    };

    //Sends the bind response packet with all the capabilities the client could handle.
    var sendBindResponsePacket = function (numCaps, capsArray) {

      
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
                    processCommand(vStream);

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
	
	fns.processBindRequest = processBindRequest;
	fns.sendKeyboardStateResponse = sendKeyboardStateResponse;
	fns.processShowKeyboardRequest = processShowKeyboardRequest;
	fns.processHideKeyboardRequest = processHideKeyboardRequest;
	
	//Exposing the functions as public in case of UT
	if(dependency.testEnv === true) {
		var myself = this;
		this.processCommand = processCommand;
		
		var arr = [processBindRequest, sendKeyboardStateResponse, processShowKeyboardRequest, processHideKeyboardRequest];
		
		/*CreateWrapper function creates a wrapper around the private functions 
		  that need to be verified in UT scripts. 
		  The wrapper is created by routing the private function calls 
		  through exposed public functions so that UT framework detects the private function call references. */
		for(var i=0;i<arr.length;i++){			
			//To ensure UT runs successfully with correct function reference
			var wrapperObj = unitTestUtils.createWrapper(myself,arr[i]);
			this[arr[i].name] = wrapperObj.actualFn;
			fns[arr[i].name] = wrapperObj.wrapper;		
		}

		this.parseBindRequest = parseBindRequest;		
		this.sendBindResponse = sendBindResponse;
		this.sendKeyboardStateResponse = sendKeyboardStateResponse;
		this.processShowKeyboardRequest = processShowKeyboardRequest;
		this.processHideKeyboardRequest = processHideKeyboardRequest;
		//Setting the mock objects for UT
		this.setBrowserBox = function(_bb){
			bb = _bb;
			mobileReceiverView_obj = bb.getMobileReceiverView();
		};
	}
}

