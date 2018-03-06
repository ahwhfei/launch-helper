/*
Written by Sai Sheshank Burra starting from 04-06-2014
*/

function MultiTouchEngine(callbackWrapper1) {

 var myself = this;
 var callBackWrapper = callbackWrapper1;
 var streamName = "CTXMTCH";
	
 var vStream= null;	
 var streamSize = 0x2000; //check with Protocol Spec and findout.
 
  // ------- Command IDs ------- //
    // Bind
    var MT_CMD_BIND_REQUEST    = 0x00;
    var MT_CMD_BIND_RESPONSE = 0x80;
    var MT_CMD_BIND_COMMIT = 0x01;
    var MT_CMD_RAW_TOUCH_INPUT = 0x81;

    var MT_DISABLED = 0x0000;
    var MT_RAW_TOUCH = 0x0001;

    // ------- Touch state ------- //
  /*  var TOUCH_DOWN = 0x00;
    var TOUCH_UPDATE = 0x01;
    var TOUCH_UP = 0x02;  */

    // -------- Multi-touch element type ----------//
    var MT_EL_TYPE_CAP_MULTI_TOUCH = 0x0001;
    var MT_EL_TYPE_RAW_TOUCH_INPUT = 0x0001;

    // -------Touch input type --------------//
    var MT_POINTERTYPE_PEN = 0x01;
    var MT_POINTERTYPE_TOUCH = 0x02;
    var MT_EVENT_RAW_TOUCH_INPUT = 0x0001;
	
	var capabilities = {};
	var m_finalCaps ={};
	 
	var processCommand = function () {
	
	   //var commandHeader = new MtVdCommandHeader();
	/*   mtvdcommandHeader.createFromStream();
       var commandId = mtvdcommandHeader.getCommandId();*/
	   
	    var packet_len = vStream.ReadUInt16();  // Length is two-byte
        var commandId = vStream.ReadByte();   // Commands are 1-byte
        vStream.ReadByte();  //reserved one.

        switch (commandId) {
		
            case MT_CMD_BIND_REQUEST:
				var mtvccBindRequest = new MtVCCmdBindRequest();
				var commandHeader = new MtVdCommandHeader();
				commandHeader.initialize(packet_len,commandId);
				mtvccBindRequest.initialize(commandHeader);
				processBindRequest(mtvccBindRequest);
                break;

            case MT_CMD_BIND_COMMIT:
				var mtvccBindCommit = new MtVCCmdBindCommit();
				mtvccBindCommit.initialize();
				processBindCommit(mtvccBindCommit);
                callBackWrapper.raiseSessionReadyEvent();
                break;

            default:
                // Unknown command
                //throw new ProtocolException("Control Virtual Channel unknown command: "+Util.twoHexChars(command));
                //break;
        }
    };
	
	
	function MtVcElementArrayHeader() {
		var HEADER_SIZE=4;
		var m_oElements =HEADER_SIZE; 
		var m_ElementsCount;
		
		this.createFromStream  = function(){
			m_oElements = vStream.ReadUInt16();
			m_ElementsCount = vStream.ReadUInt16();
			return this;
		};
		
		this.getHeaderSize = function(){
			return HEADER_SIZE;
		};
		this.getElementsCount = function(){
		 return m_ElementsCount;
		};
		this.setElementsCount = function(elementsCount){
			m_ElementsCount =elementsCount;
		};
		this.getOffSet = function(){
		  return m_oElements;
		};
	}
	 var mtvcElementArrayHeader = new MtVcElementArrayHeader();
	function MtVcElementHeader(){
	   var HEADER_SIZE=8;
		/** Corresponds to byte count(size) of the cap/element */
		var m_byteCount;

		/** CAPID/Element type */
		var m_elementType;

		this.createFromStream  = function(){
				m_byteCount = vStream.ReadInt32();
				m_elementType = vStream.ReadInt32();
				return this;
			};
	
		this.getHeaderSize = function(){
			return HEADER_SIZE;
		};
	   this.getByteCount = function(){
	   
			return m_byteCount;
	   };
	   this.getElementType = function(){
	   
			return m_elementType;
	   };
	}
	
	function MtVdCommandHeader(){
		
		/** Size in bytes of the header on the wire */
		var HEADER_SIZE = 4;

		/** Corresponds to ByteCount field */
		var  m_byteCount;

		/** Corresponds to CommandId field */
		var  m_commandId;
		
		
		this.createFromStream = function(){
					m_byteCount = vStream.ReadUInt16();
					m_commandId =  vStream.ReadByte();
					return this;
		};
	
		this.getHeaderSize = function(){
			return HEADER_SIZE;
		};
		 this.getCommnadId = function(){
			return m_commandId;
		 };
		 
		 this.getByteCount= function(){
			return m_byteCount;
		 };
		 
		 this.initialize = function(byteCount,commandId){
			m_byteCount = byteCount;
			m_commandId = commandId ;
		};
	}	
	var mtvdcommandHeader=new MtVdCommandHeader();
	function MtVcTouchCap(){
			// Size is header + 4byte value
			var CAP_SIZE = mtvcElementArrayHeader.getHeaderSize() + 4;
			var m_featuresBitmask;
			var m_maxTouches;
			this.className = "TouchCap";
			
			this.getSize = function()
			{
				return CAP_SIZE;
			};
			
			this.createFromStream= function () {
				m_featuresBitmask = vStream.ReadUInt16();
				m_maxTouches =  vStream.ReadUInt16();
				return this;
			};
			
			this.getFeaturesBitMask = function(){
				return m_featuresBitmask;
			};
			this.getMaxTouches = function(){
				return m_maxTouches;
			};
			this.initialize = function(featuresBitMask,maxTouches){
				m_featuresBitmask= featuresBitMask;
				m_maxTouches = maxTouches; 
			};
	}
	
	function MtVCCmdTouchData(){
	
	    var touchArrayHeader;
		var m_TouchData={};
		var m_touchDataCount;		
		var packetSize = 0;
		
		this.initialize = function(touchData,touchDataCount){
			m_TouchData =  generateRawTouchData(touchData,touchDataCount);		
			m_touchDataCount = touchDataCount;
			touchArrayHeader = new MtVcElementArrayHeader();
			touchArrayHeader.setElementsCount(touchDataCount);
		};
		
		this.send = function(){

			var mtvcElementHeader  = new MtVcElementHeader();
			var mtvcTouchData      = new MtVcTouchData();
			var mtvdcommandHeader  = new MtVdCommandHeader();
			
			var touchInputDataSize = (mtvcElementHeader.getHeaderSize() + mtvcTouchData.DATA_SIZE) * m_touchDataCount;			
					
			packetSize = touchInputDataSize + mtvdcommandHeader.getHeaderSize() + touchArrayHeader.getHeaderSize();
			
			var outputStream = new ByteArrayOutputStream();
			
			ByteWriter.WriteInt16ToStream(outputStream, packetSize);
			outputStream.WriteByte(MT_CMD_RAW_TOUCH_INPUT);
			outputStream.WriteByte(0); //reserved one.
			ByteWriter.WriteInt16ToStream(outputStream, touchArrayHeader.getOffSet());
			
			ByteWriter.WriteInt16ToStream(outputStream, touchArrayHeader.getElementsCount());
			
			for(var key in m_TouchData)
			{
				ByteWriter.WriteInt32ToStream(outputStream, mtvcElementHeader.getHeaderSize() + mtvcTouchData.DATA_SIZE);
				ByteWriter.WriteInt32ToStream(outputStream, MT_EL_TYPE_RAW_TOUCH_INPUT);
						
				ByteWriter.WriteInt16ToStream(outputStream, m_TouchData[key].x);
				ByteWriter.WriteInt16ToStream(outputStream, m_TouchData[key].y);
				ByteWriter.WriteInt32ToStream(outputStream, m_TouchData[key].Time);
				ByteWriter.WriteInt16ToStream(outputStream, m_TouchData[key].ID);
				ByteWriter.WriteInt16ToStream(outputStream, m_TouchData[key].TouchState);
				ByteWriter.WriteInt16ToStream(outputStream, m_TouchData[key].Pressure);
			}
			
			 //Now we send the packet over the wire
			 var response = outputStream.ToByteArray();
             //Debug.traceBuf(response);
			 
             vStream.WriteByte(response, 0, response.length);
		};
	}
	
	function createHexString(arr) {
    var result = "";
    var z;

    for (var i = 0; i < arr.length; i++) {
        var str = arr[i].toString(16);
        z = 8 - str.length + 1;
        str = Array(z).join("0") + str;

        result += str;
    }

    return result;
}
	function MtVCCmdBindRequest(){
	 var m_commandHeader;
	 var m_caps;
	 var rand;
	 this.initialize = function(commandHeader){
	    m_commandHeader = commandHeader;
		m_caps = generateCapablitiesFromWire();
		rand = Math.random();
	 };
	 
	 this.getCommandHeader = function(){
		return m_commandHeader;
	 };
	 this.getCaps= function(){
		return m_caps;
	 };
	 
	 this.rand = function(){
		return rand;
	 }
	}
	
	function MtVCCmdBindResponse(){
		var m_caps;
		this.send = function(serverCaps, TouchCount){
		
			m_caps = generateClientCaps(serverCaps,TouchCount);
			var capList= new MtVcElementArrayHeader();
			var m_caps_length= Object.keys(m_caps).length;
			capList.setElementsCount(m_caps_length);

			// Calculate the caps packet size
			var packetSize = this.getBindResponsePacketSize(m_caps);
			packetSize += mtvcElementArrayHeader.getHeaderSize() + mtvdcommandHeader.getHeaderSize();

			// Now generate the packet
			var outputStream = new ByteArrayOutputStream();

			// Write the command header
			ByteWriter.WriteInt16ToStream(outputStream, packetSize);
			outputStream.WriteByte(MT_CMD_BIND_RESPONSE);
			outputStream.WriteByte(0); //reserved one

			//Write the VD_CAP_LIST structure
			ByteWriter.WriteInt16ToStream(outputStream, capList.getOffSet());
			ByteWriter.WriteInt16ToStream(outputStream, capList.getElementsCount());

			//Now we write all the caps themselves immediately following the VD_CAP_LIST structure
			for(var key in m_caps)
			{
				ByteWriter.WriteInt32ToStream(outputStream,12);
				ByteWriter.WriteInt32ToStream(outputStream,MT_EL_TYPE_CAP_MULTI_TOUCH);
				ByteWriter.WriteInt16ToStream(outputStream,m_caps[key].getFeaturesBitMask());
				ByteWriter.WriteInt16ToStream(outputStream,m_caps[key].getMaxTouches());
			}
		
			 //Now we send the packet over the wire
			 var response = outputStream.ToByteArray();
             vStream.WriteByte(response, 0, response.length);
			
		};
		
		this.getBindResponsePacketSize = function(capSet){
		
			// The size of the bind response packet is the size of the command header + the size of the
			// mtvcElementArrayHeader structure followed by all the caps
			var packetSize = mtvdcommandHeader.getHeaderSize() + mtvcElementArrayHeader.getHeaderSize();
			var caps=[];
			for(var key in capSet)
			{
			  caps.push(capSet[key]);
			  packetSize += capSet[key].getSize();
			}
			
			return packetSize;
		};
	}
	
	function MtVCCmdBindCommit(){
	 var m_commandHeader;
	 var m_caps;
	 
	 this.initialize = function(){
		m_caps = generateCapablitiesFromWire();
	 };
	 
	 this.getCommandHeader = function(){
		return m_commandHeader;
	 };
	 
	 this.getCaps = function(){
		return m_caps;
	 };
	}
	
	var createVirtualStream = function(streamName, streamSize) {
		var chnl = ChannalMap.virtualChannalMap[streamName];
		var stream = new VirtualStream(chnl, callBackWrapper, streamSize);
		return stream;
	};
	
	this.SetStack = function(virtualStreamSupplier) {
		vStream = createVirtualStream(streamName, streamSize);
		return vStream;

	};
	
	this.getStreamName = function () {
        return streamName;
    };
	//Sends the bind response packet with all the capabilities the client could handle.
    var sendBindResponsePacket = function (numCaps, capsArray) {
	
        var packetLen = capsArray.length;
        //Debug.traceBuf(capsArray);
        var returnStream = new ByteArrayOutputStream();
        ByteWriter.WriteInt16ToStream(returnStream, packetLen + BIND_RESPONSE_LENGTH); //length of the packet
        returnStream.WriteByte(CMD_BIND_RESPONSE);
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
	
	var processBindRequest = function(cmd){
        //Send bind response to server
        sendBindResponse(cmd.getCaps());
	}
	
	var sendBindResponse = function(serverCaps){
		 var mtvCCBindResponse = new MtVCCmdBindResponse();
		 mtvCCBindResponse.send(serverCaps,255);
	}
	
	var processBindCommit = function(cmd){
		callBackWrapper.enableMultTouch();
	}

	/* Reading Capabilities from the Server*/
	var generateCapablitiesFromWire = function(){
	var caps= {};
	var vdCapList= new MtVcElementArrayHeader();
	vdCapList.createFromStream();
	var mtvcElementHeader = new MtVcElementHeader();
		for(var i=0;i<vdCapList.getElementsCount();i++)
		{
			 var capHead = mtvcElementHeader.createFromStream();
			  // Read in the current cap
				var curCap = readCapFromWire(capHead);
				if (curCap != null)
				{
					caps[capHead.getElementType()]= curCap;
				} 
		}
		return caps;
	}

    var readCapFromWire = function(capHead){	
		var cap ;
		var mtvcTouchCap = new MtVcTouchCap();
        switch (capHead.getElementType())
        {
			case MT_EL_TYPE_CAP_MULTI_TOUCH:
				cap = mtvcTouchCap.createFromStream();
				break;
			default:
				// In this case we've read the cap head but we need to skip the actual cap pay-load.
				var skipBytesCount = capHead.getByteCount() - MtVcElementHeader.getHeaderSize();
				if (skipBytesCount > 0)
				{
					//Log.v(TAG, "readCapFromWire(): skipping: " + skipBytesCount + " bytes");
					vStream.SkipByte(skipBytesCount);
				}
				break;
        }
        return cap;
	}
	
	 /**
     * Populates the client caps with information about the device
     */
	var generateClientCaps = function(serverCaps,TouchCount){
    
		var clientCaps ={};
		
        // Now process other caps based on the caps that the server reported - starting with the
        // multi-touch cap
        var mtvcTouchCap =  serverCaps[MT_EL_TYPE_CAP_MULTI_TOUCH]; 
        if (mtvcTouchCap != null)
        {
            var mtvcClientCap= new MtVcTouchCap();
			mtvcClientCap.initialize(MT_RAW_TOUCH,TouchCount);
            clientCaps[MT_EL_TYPE_CAP_MULTI_TOUCH]=  mtvcClientCap;
        }
        return clientCaps;
    }
	
	var generateRawTouchData = function( RawTouchData, TouchCount)
    {
        var TouchData = {};
		for(var key in RawTouchData)
		{
		  var mtvcTouchData= new MtVcTouchData();
		  mtvcTouchData.initialize(RawTouchData[key].x, RawTouchData[key].y, RawTouchData[key].Time, RawTouchData[key].ID, RawTouchData[key].TouchState);
		  TouchData[RawTouchData[key].ID] = mtvcTouchData;
		}
        return TouchData;
    }
	
	this.sendTouchData = function(touchData, touchCount){
		mtvccmdTouchData = new MtVCCmdTouchData();
		mtvccmdTouchData.initialize(touchData, touchCount);	
		mtvccmdTouchData.send();		
	}
	
	
	var prevReadIndex = 0;

    this.Run = function run() {
        prevReadIndex = 0;
        vStream.RegisterCallback(this._Run);
    };
	
	this._Run = function _run() {
        var errorHandle = function () {
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