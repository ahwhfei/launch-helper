function ClipboardEngine(callBackWrapper1) {
	var callBackWrapper = callBackWrapper1;
	var vStream;
	var myself = this;
	var streamName = "CTXCLIP";
	var streamSize = 0x2000;
	var VERSION = 3;
	var VERSION_LOW = 1;
	var VERSION_HIGH = 3;
	var VERSION_V2 = 2;
	var VERSION_V3 = 3;	
	/* No single data packet can be greater than this size */
	var CLIP_MAX_PACKET_SIZE = (1024 - 4);
	var WFCF_REGISTEREDFIRST = 0xC000;
	var WFCF_REGISTEREDLAST = 0xFFFF;

	var gnSessionVersion = 1;
	var gVCPacketSize = CLIP_MAX_PACKET_SIZE;
	var gClipPacketSize = CLIP_MAX_PACKET_SIZE;
	var gfUpdatesEnabled = false;
	var gpRegisterFormatMap = null;
	var gpFormatArray = null;
	var guFormat = 0;
	var gusNumberOfRegisterFormats = 0;
	var genableClient = false;
	var MAX_FORAMT = 100;
	var requested_format = new Uint8Array(MAX_FORAMT);
	var current_formatData = new Uint16Array(MAX_FORAMT);
	var current_format_Len = 0;	
	var pendingQueue = new Uint16Array(MAX_FORAMT);
	var pendingQueueLength = 0;
	var lastRequestedFormat = null;
	var clip_empty = false;
	
	// Define possible states
	var protocolState = 0;
	var STATE_PROTOCOL_START = 0;
	var STATE_PROTOCOL_OPERATING = 1;
	var STATE_PROTOCOL_REPLY_WAIT = 2;

	/* Windows Clipboard format */
	var uWin32FormatArray = [1, /* CF_TEXT          */
	2, /* CF_BITMAP        */
	3, /* CF_METAFILEPICT  */
	4, /* CF_SYLK          */
	5, /* CF_DIF           */
	6, /* CF_TIFF          */
	7, /* CF_OEMTEXT       */
	8, /* CF_DIB           */
	9, /* CF_PALETTE       */
	10, /* CF_PENDATA       */
	11, /* CF_RIFF          */
	12, /* CF_WAVE          */
	13, /* CF_UNICODETEXT   */
	14, /* CF_ENHMETAFILE   */
	15, /* CF_HDROP     (NT 4.0 and above)  */
	16, /* CF_LOCALE    (NT 4.0 and above)  */
	17, /* CF_DIBV5     (Windows 2000)      */
	0x0080, /* CF_OWNERDISPLAY  */
	0x0081, /* CF_DSPTEXT       */
	0x0082, /* CF_DSPBITMAP     */
	0x0083, /* CF_DSPMETAFILEPICT */
	0x008E];
	/* CF_DSPENHMETAFILE */
	
	
	var cWin32Format = uWin32FormatArray.length;

	// Define packet command constants
	var CMD_INIT_REQUEST = 1;
	var CMD_INIT_REPLY = 2;
	var CMD_PLACE = 3;
	var CMD_RENDER_REQUEST = 4;
	var CMD_RENDER_REPLY = 5;
	//Cancel request(s) in progress
	var CMD_CANCEL = 0x0006;
	//Update progress indicator
	var CMD_PROGRESS = 0x0007;
	//Host packet for registered format negotiation
	var CMD_REGISTER_FORMAT_REQUEST = 0x0008;
	//Client reply for registered format negotiation
	var CMD_REGISTER_FORMAT_REPLY = 0x0009;

	// Define possible packet flags
	var PACKET_FLAG_NORMAL = 0x0000;
	// Notification only - data not included
	var PACKET_FLAG_PLACE_NOTIFICATION_ONLY = 0x0001;
	//Multiple formats included
	var PACKET_FLAG_PLACE_MULTIPLE_FORMATS = 0x0002;
	//request failed
	var PACKET_FLAG_REQUEST_FAILED = 0x0004;
	//Request to make the clipboard empty. Comes with WFCLIP_REQUEST_FAILED
	var PACKET_FLAG_REQUEST_EMPTY = 0x0008;

	/*
	 * The WFCLIPFORMAT data block is sent as part of the WFCLIPDATA data block.
	 * It is variable length depending upon the Flags specified as part of the packet
	 * header.
	 */
	function ClipFormat() {
		this.uFormat/* CF_xxx, 0 indicates end of chain */
		this.cbData/* size of Data */
		this.data/* exists unless WFCLIP_NOTIFICATION_ONLY
		 /* If registered format, zero-terminated format name immediate follows cbData if
		 * NOTIFICATION_ONLY, otherwise Data + cbData
		 *
		 * If WFCLIP_MULTIPLE_FORMATS, next WFCLIPFORMAT structure immediately follows
		 * After the last WFCLIPFORMAT block, a ULONG of 0 indicates the end of the chain
		 */
	}

	function FormatMap() {
		this.uHostFormat
		this.uClientFormat
	}

	var weChangedTheClipboard = false;
	var timestamp = HTML5Interface.timeStamp( );
	var lastH2CTimestamp = -1;
	var lastC2HTimestamp = -1;

	/***************************************************************************************************/
	//TODO
	var CF_METAFILEPICT = 3;
	var CF_ENHMETAFILE = 14;
	var CF_OWNERDISPLAY = 0x0080;
	var CF_PRIVATEFIRST = 0x0200;
	var CF_PRIVATELAST = 0x02FF;
	/***************************************************************************************************/
	var SIZE_OF_CLIP_HEADER = 4;
	var SIZE_OF_CLIP_FORMAT = 7;
	var CLIP_FORMAT_MIN = SIZE_OF_CLIP_FORMAT - 1;
	var CLIP_DATA_MIN = CLIP_FORMAT_MIN + SIZE_OF_CLIP_HEADER;

	this.getStreamName = function() {
		return streamName;
	};
	var createVirtualStream = function(streamName, streamSize) {
		var chnl = ChannalMap.virtualChannalMap[streamName];
		var stream = new VirtualStream(chnl, callBackWrapper, streamSize);
		return stream;
	};
	this.EndWriting = function endWriting(reason) {

	};

	this.Initialize = function(profile) {
	};

	this.SetStack = function(virtualStreamSupplier) {
		vStream = createVirtualStream(streamName, streamSize);
		return vStream;

	};
	this.setHighThroughput = function(highthroughput) {
		if (highthroughput == true) {
			gVCPacketSize = 5000 - 4;
		}
	};
	this.Run = function run() {
		prevReadIndex = 0;
		vStream.RegisterCallback(this._Run);
	};
	this.driverStart = function() {
		setState(STATE_PROTOCOL_START);
		weChangedTheClipboard = false;
	};
	function setState(state) {
		if (state == protocolState) {
			return;
		}
		var oldState = protocolState;
		protocolState = state;
		// If this session is a reconnection to a disconnected session, the
		// host may never send a CMD_INIT_REQUEST.  This body starts listening
		// services in this case.
		if (oldState == STATE_PROTOCOL_START) {
			addClipboardListener();
		}
	}
	function getState( ){
		return protocolState;
			}

	function addClipboardListener() {
		//TODO
	}


	this._Run = function _run() {

		var errorHandle = function() {
			vStream.setReadIndex(prevReadIndex);
			vStream.allocateSpace();
			vStream.compact();
		};

		try {
			while (vStream.Available() > 0) {
				/* Main processing */
				var result = 0;

				prevReadIndex = vStream.GetReadIndex();
				try {
					result = ProcessNextCmd();
				} catch (error) {
					if (error == VirtualStreamError.NO_SPACE_ERROR) {
						errorHandle();
						return;
					} else {
						console.log(error);
					}

				}

				prevReadIndex = vStream.GetReadIndex();
				//We have used this command data completely safe to shrink virtual stream
				//vStream.shrinkBuffer(prevReadIndex);
			}
		} catch (error) {
			console.log(error);
		}
	};

	/**
	 * Processes the commands as they come over the virtual channel.  This method
	 * is currently designed to run continually in the thread.  This consuming
	 * is synchronized by the vStream which blocks on any read until data is
	 * available.
	 */

	var ProcessNextCmd = function() {

		var command = vStream.ReadUInt16();
		// Commands are two-byte
		switch (command) {

			case CMD_INIT_REQUEST:

				// An INIT_REQUEST packet is sent from the host before the virtual
				// channel is turned on.  This is done to resolve versions between
				// the host and client protocol.  We will send an INIT_REPLY packet
				// back stating our version information.
				// Note: This packet is NOT sent during a session reconnect - only
				// when initializing a new session.				
				handleInitRequestPacket();
				if(gfUpdatesEnabled === true && genableClient === false){
					genableClient = true;
					if(clip_empty === false){						
						emptyHostClipboard( );
					}
					callBackWrapper.enableClipboard();	
				}							
				break;
			case CMD_REGISTER_FORMAT_REQUEST:
				handleRegisterRequestFormat();
				if(gfUpdatesEnabled === true && genableClient === false){
					genableClient = true;
					emptyHostClipboard( );
					callBackWrapper.enableClipboard();	
				}	
				break;
			case CMD_PLACE:
				// When the contents of the server's clipboard change, the client is
				// notified by means of a PLACE packet.  This packet contains format
				// information for the available data.  Since there is no mechanism to
				// facilitate the Windows concept of "delayed rendering", we will choose
				// the format we desire and send for the clipboard data immediately.
				handlePlacePacket();
				CEIP.add('clipboard:used',true);
				break;
			case CMD_RENDER_REQUEST:
				// When we have reported to the host that we have new clipboard data
				// (through a PLACE packet), it may request that data in a chosen
				// format.  This is done through a RENDER_REQUEST packet.  We will
				// respond with a RENDER_REPLY packet containing the requested data
				// or a failure flag if we cannot deliver. */
				handleRenderRequestPacket();
				CEIP.add('clipboard:used',true);
				break;
			case CMD_RENDER_REPLY:
				// In this case, we have requested clipboard data from the host
				// (through a RENDER_REQUEST packet), and this packet contains the
				// requested data.
				handleRenderReplyPacket();
				break;
			default:
				throw new Error("Unsupported clipboard command is" + command);
		}
		
	};

	function handleInitRequestPacket() {
		var lowestHostSupportedProtocolVersionL = vStream.ReadUInt16();
		var lowestHostSupportedProtocolVersionH = vStream.ReadUInt16();
		writeInitReplyPacket(lowestHostSupportedProtocolVersionL, lowestHostSupportedProtocolVersionH);
		lastRequestedFormat = null;
		setState(STATE_PROTOCOL_OPERATING);
	}

	function handleRegisterRequestFormat() {
		var usNumberOfFormats, usIndex, usSupported;
		var flags = vStream.ReadUInt16();
		if (gfUpdatesEnabled == true) {
			//this condition should not occur
		}
		var index = 0;
		var pRequestClipFormat = new Array(0);
		pRequestClipFormat[index] = new ClipFormat();
		usNumberOfFormats = 0;
		readFormatStructure(pRequestClipFormat[index]);
		while (pRequestClipFormat[index].uFormat) {
			  if (checkFormatSupported(pRequestClipFormat[index].data)) {
				usNumberOfFormats++;
			  }
			  index++;
			  pRequestClipFormat[index] = new ClipFormat();
			readFormatStructure(pRequestClipFormat[index]);
		}
		console.log("Requested Clipboard Formats are :", pRequestClipFormat);
		if (usNumberOfFormats) {
			gpRegisterFormatMap = new Array(usNumberOfFormats);
			for (var i = 0; i < usNumberOfFormats; i++) {
				gpRegisterFormatMap[i] = new FormatMap();
			}
			console.log("Registered Format Map :", gpRegisterFormatMap);
		}
		if (gpFormatArray == null) {
			gpFormatArray = new Int32Array(usNumberOfFormats + cWin32Format);
		}
		for (var i = 0; i < cWin32Format; i++) {
			gpFormatArray[i] = uWin32FormatArray[i];
			guFormat++;
		}

		var cbPacketData = CLIP_DATA_MIN + usNumberOfFormats * CLIP_FORMAT_MIN;
		var replyPacket = new Uint8Array(cbPacketData);
		var replyIndex = 0;
		replyPacket[replyIndex++] = (CMD_REGISTER_FORMAT_REPLY) & 0xff;
		replyPacket[replyIndex++] = (CMD_REGISTER_FORMAT_REPLY >> 8) & 0xff;
		replyPacket[replyIndex++] = 0;
		replyPacket[replyIndex++] = 0;
		for (var i = 0, usIndex = 0, usSupported = 0; i < pRequestClipFormat.length - 1; i++, usIndex++) {
			temp = pRequestClipFormat[i];
			if (checkFormatSupported(temp.data) == true) {
				gpRegisterFormatMap[usSupported].uHostFormat = temp.uFormat;
				gpRegisterFormatMap[usSupported].uClientFormat = getFormatName(temp.data);
				console.log("registered format: [" + gpRegisterFormatMap[usSupported].uHostFormat +"]: " +  gpRegisterFormatMap[usSupported].uClientFormat);
				//currently TODO
				gpFormatArray[guFormat++] = gpRegisterFormatMap[usSupported].uHostFormat;
				//TODO
				usSupported++;
				replyPacket[replyIndex++] = temp.uFormat & 0xff;
				replyPacket[replyIndex++] = (temp.uFormat >> 8) & 0xff;
				replyPacket[replyIndex++] = 0;
				replyPacket[replyIndex++] = 0;
				replyPacket[replyIndex++] = 0;
				replyPacket[replyIndex++] = 0;
			}
		}
		gusNumberOfRegisterFormats = usSupported;
		/*
		 * End of format packet
		 */
		replyPacket[replyIndex++] = 0;
		replyPacket[replyIndex++] = 0;
		replyPacket[replyIndex++] = 0;
		replyPacket[replyIndex++] = 0;
		replyPacket[replyIndex++] = 0;
		replyPacket[replyIndex++] = 0;
		/*
		 * Signal that it is ok to start sending clipboard updates to the
		 * server.
		 */
		gfUpdatesEnabled = true;
		vStream.WriteByte(replyPacket, 0, cbPacketData);
	}

	/*******************************************************************************
	 *
	 *  CheckFormatSupported
	 *
	 *  PURPOSE:
	 *    To check if a specified registered format is supported.
	 *    Read from configuration supported format
	 */
	function checkFormatSupported(data) {
		return true;
	}
	function getFormatName(data){
		var s = "";
		for (var i = 0; i < data.length; i++) {
			s = s + String.fromCharCode(data[i]);
		}
		return s;
	}
	function getFormatNameById(formatId){
		var rvalue ="";
		if(formatId >= WFCF_REGISTEREDFIRST && formatId <= WFCF_REGISTEREDLAST)
		{
			for(var i = 0 ; i < gusNumberOfRegisterFormats ; i++){
				if( formatId == gpRegisterFormatMap[i].uHostFormat){
					return gpRegisterFormatMap[i].uClientFormat;
				}
			}
		}		
		return rvalue;
	}
	function getFormatByName( name){
		for(var i = 0 ; i < gusNumberOfRegisterFormats ; i++){
				if( name == gpRegisterFormatMap[i].uClientFormat){
					return gpRegisterFormatMap[i].uHostFormat;
				}
			}
			return -1;
	}
	function readFormatStructure(formatObj) {
		formatObj.uFormat = vStream.ReadUInt16();
		formatObj.cbData = vStream.ReadInt32();
		formatObj.data = null;
		if (formatObj.cbData != 0) {
			formatObj.data = new Uint8Array(formatObj.cbData);
			vStream.ReadBytes(formatObj.data, 0, formatObj.cbData);
		}
	}

	/**
	 * Write a packet to the host containing version information for this
	 * clipboard virtual driver.  This is the ICA means of initializing
	 * compatibility of client/server drivers.
	 */
	function writeInitReplyPacket(versionlow, versionhigh) {
		var version = (VERSION > versionhigh) ? versionhigh : VERSION;
		var packet = new Uint8Array([CMD_INIT_REPLY, // 2-byte command
		0, //
		0, // Reserved; set to zero
		0, //
		(version & 0xFF ), // Client protocol version
		((version >> 8) & 0xFF ), //
		0, // Reserved; set to zero
		0, //
		0, //
		0, //
		0, // Reserved; set to zero
		0//
		]);
		gnSessionVersion = version;
		if (gnSessionVersion < VERSION_V3) {
			gVCPacketSize = CLIP_MAX_PACKET_SIZE;
		}
		setClipPacketSize(gVCPacketSize);
		if (versionhigh < VERSION_V2) {
			gfUpdatesEnabled = true;
		}
		/* Write packet to the wire. */
		vStream.WriteByte(packet, 0, packet.length);

	}

	function handlePlacePacket() {
		var packetFlags = vStream.ReadUInt16();
		var formatID, dataLength;
		current_format_Len = 0;
		pendingQueueLength = 0;	
		lastRequestedFormat = null;	
		clip_empty = false;	
		setState(STATE_PROTOCOL_OPERATING);
		// BUGBUG: for some reason, we see 4 extra bytes occasionally, but only
		// if the packetFlags == 4, which is an invalid value.  For now, we just
		// consume the offending bytes and resume normal operation.  This bug
		// can be reproduced by doing a copy in WordPad on the host.
		if ((packetFlags & PACKET_FLAG_REQUEST_FAILED) != 0){
			if(packetFlags & PACKET_FLAG_REQUEST_EMPTY){
				current_format_Len = 0 ;				
				notifyformatToClient( );
				clip_empty = true;
			}
			return;
		}
			
		
		var notificationOnly = ((packetFlags & PACKET_FLAG_PLACE_NOTIFICATION_ONLY) != 0);

		if ((packetFlags & PACKET_FLAG_PLACE_MULTIPLE_FORMATS) != 0) {
			formatID = vStream.ReadUInt16();
			while (formatID > 0) {
				//preferredFormat = selectPreferredFormat(formatID, preferredFormat);				
				current_formatData[current_format_Len] = formatID;
				requested_format[current_format_Len] = 0;
				current_format_Len++;
				dataLength = vStream.ReadInt32();
				formatID = vStream.ReadUInt16();
			}
		} else {
			formatID = vStream.ReadUInt16();
			dataLength = vStream.ReadInt32();
			current_formatData[current_format_Len] = formatID;
			requested_format[current_format_Len] = 0;
			current_format_Len++;
		}	
		notifyformatToClient();
	}
	
	function requestClipData(formatId){
		var index = findFormatIndex(formatId );	
		if(getState( ) == STATE_PROTOCOL_OPERATING){
				requested_format[index] = 1;
				setState(STATE_PROTOCOL_REPLY_WAIT);
				writeRenderRequestPacket(formatId);	
			}
	}
	
	this.requestForClipData = function( formatId , formatname , timestamp){
		if(timestamp !== lastH2CTimestamp){
			return;
		}
		if(formatId == ClipFormatConverter.FORMAT_PRIVATE){
			formatId = getFormatByName(formatname);
		}
		var index = findFormatIndex(formatId );		
		if((index >= 0) && (requested_format[index] != 1)){
			//setState(STATE_PROTOCOL_REPLY_WAIT);
			if(getState( ) == STATE_PROTOCOL_OPERATING){
				requestClipData(formatId);
			}else if(requested_format[index] != 1){
				var match = false;
				for(var i = 0 ; i< pendingQueueLength ; i++){
					if(pendingQueue[i] === formatId){
						match = true;
						break;
					}
				}
				if(match === false){
					pendingQueue[pendingQueueLength++] = formatId;
				}				
			}			
		}		
	};
	this.notifyFormatChangec2h = function(formatarr , len , tstamp , formatname ){
		lastC2HTimestamp = tstamp;
		for(var i = 0 ; i < current_format_Len ; i++){
			requested_format[i] = 0 ;
		}
		current_format_Len = 0 ;
		pendingQueueLength = 0;
		if(lastH2CTimestamp >lastC2HTimestamp){
			return;
		}
		if(getState( ) !== STATE_PROTOCOL_OPERATING){
			return;
		}
		if(len == 0 && clip_empty === false){
			emptyHostClipboard( );			
		}else if(len > 0){
			clip_empty = false;
			notifyClipboardChange(formatarr, len , formatname);
		}
		
	};
	
	function findFormatIndex( formatId)
	{
		var rvalue = -1;
		for(var i = 0 ; i < current_format_Len ; i++){
			if(formatId == current_formatData[i]){
				return i;
			}
		}
		return rvalue;
	}

	function selectPreferredFormat(curFormat, preferred) {
		if (preferred == ClipFormatConverter.FORMAT_UNDEFINED) {
			return curFormat;
		} else if ((curFormat == ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT) || (preferred == ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT)) {
			return ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT;
		} else if ((curFormat == ClipFormatConverter.FORMAT_WINDOWS_OEM_TEXT) || (curFormat == ClipFormatConverter.FORMAT_WINDOWS_TEXT)) {
			return curFormat;
		} else if ((preferred >= WFCF_REGISTEREDFIRST) && (preferred <= WFCF_REGISTEREDLAST)) {
			return curFormat;
		} else {
			return preferred;
		}
	}

	/**
	 * Write a packet to the host requesting its clipboard data in a format
	 * that we specify.
	 *
	 * @param requested data format
	 */
	var writeRenderRequestPacket = function(format) {
		var packet = new Uint8Array( [CMD_RENDER_REQUEST, 0, // 2-byte command
		0, 0, // Reserved; set to zero
		format & 0xff, (format >> 8) & 0xff, // Format requested
		0, 0 // Reserved; set to zero
		]);

		/* Write packet to the wire. */
		vStream.WriteByte(packet, 0, packet.length);

	};

	/*******************************************************************************
	 *
	 *  Function: wMapRegisterFormat
	 *
	 *  Purpose: Map registered clipboard format numbers between client number
	 *           and host number. If format is not supported, it returns 0.
	 *
	 *  Entry:
	 *     uFormat (input)
	 *        registered clipboard format number to check and map
	 *     fSending (input)
	 *        direction of mapping (depending on whether sending or received
	 *        the format number)
	 *        if TRUE  map from client to host
	 *        if FALSE map from host   to client
	 *
	 *  Exit:
	 *     Mapped Format if supported
	 *     0 if not supported
	 *
	 ******************************************************************************/
	function wMapRegisterFormat(uFormat, fSending) {
		//this function should maintain three array server to client client to seamless clipboard
		//and after checking with data
		var usIndex;
		var uMappedFormat = 0;

		if (fSending) {
			for ( usIndex = 0; usIndex < gusNumberOfRegisterFormats; usIndex++) {
				if (gpRegisterFormatMap[usIndex].uClientFormat == uFormat) {
					uMappedFormat = gpRegisterFormatMap[usIndex].uHostFormat;
					break;
				}
			}
		} else {
			for ( usIndex = 0; usIndex < gusNumberOfRegisterFormats; usIndex++) {
				if (gpRegisterFormatMap[usIndex].uHostFormat == uFormat) {
					uMappedFormat = gpRegisterFormatMap[usIndex].uClientFormat;
					break;
				}
			}
		}
		return uMappedFormat;
	}

	/**
	 * In this case, a COPY operation has taken place on the host, and we have
	 * requested that data in order to sync the client clipboard.  This packet
	 * is th e host's response, and should contain the data we requested.
	 */
	function handleRenderReplyPacket() {
		/* Retrieve the clipboard contents from the packet and send the
		 formatted equivalent to the system clipboard. */
		var packetFlags = vStream.ReadUInt16();
		var receivedFormat = vStream.ReadUInt16();
		var unreadData = vStream.ReadInt32();
		vStream.WaitForSpace(unreadData);
		var index = findFormatIndex( receivedFormat);
		if( (index >= 0) && (requested_format[index] == 0) ){
			vStream.SkipByte(unreadData);
			setState(STATE_PROTOCOL_OPERATING);
			callBackWrapper.requestNotification();
			return;
		}
		var clipData = new Uint8Array(unreadData);
		vStream.ReadBytes(clipData, 0, unreadData);
		setLocalClipboard(receivedFormat, clipData, true);
		// Return to operating state		
		requested_format[index] = 0;
		setState(STATE_PROTOCOL_OPERATING);
		if(pendingQueueLength >0){
			requestClipData(pendingQueue[0]);
			for(var i = 1; i< pendingQueueLength ;i++){
				pendingQueue[i-1] = pendingQueue[i];
			}	
			pendingQueueLength--;
		}
	}

	// Get the RENDER_REQUEST packet data
	function handleRenderRequestPacket() {
		// two reserved bytes
		vStream.ReadUInt16();
		var serverRequestedFormat = vStream.ReadUInt16();
		// two more reserved bytes
		vStream.ReadUInt16();
		lastRequestedFormat = serverRequestedFormat;
		requestClientForData(serverRequestedFormat);
	}
	function requestClientForData( serverRequestedFormat){
		var formatname = getFormatNameById(serverRequestedFormat);
		if(formatname != ""){
			serverRequestedFormat = ClipFormatConverter.FORMAT_PRIVATE;
		}
		callBackWrapper.requestFormatData(serverRequestedFormat , formatname , lastC2HTimestamp);
	}
	this.sendRenderRequestReply = function (serverRequestedFormat , formatname ,clipData , isFailure) {	
		if(serverRequestedFormat == ClipFormatConverter.FORMAT_PRIVATE){
			serverRequestedFormat = getFormatByName(formatname);
		}		
		if(serverRequestedFormat !== lastRequestedFormat && (isFailure !== true) ){
		 	return;
		 }
		if((isFailure == true) && (serverRequestedFormat != -1)){
			// Either an unsupported format, or an exception occurred above.
			// Whatever happened, tell the server we're not including any data.
			var failurePacket = new Uint8Array(4);
			write2Byte(failurePacket, 0, CMD_RENDER_REPLY);
			write2Byte(failurePacket, 2, PACKET_FLAG_REQUEST_FAILED);
			vStream.WriteByte(failurePacket, 0, failurePacket.length);
		}else
		{
			var startOffset = 10;
			var data = new Uint8Array(startOffset + clipData.length);
			for (var i = 0; i < clipData.length; i++) {
				data[startOffset + i] = clipData[i];
			}
			write2Byte(data, 0, CMD_RENDER_REPLY);
			write2Byte(data, 2, PACKET_FLAG_NORMAL);
			write2Byte(data, 4, serverRequestedFormat);
			write4Byte(data, 6, clipData.length);
			// Write length
			sendClipDataToHost(data, 0, data.length);
		}
		setState(STATE_PROTOCOL_OPERATING);
	};

	function sendClipDataToHost(data, offset, length) {
		while (length > gClipPacketSize) {
			vStream.WriteByte(data, offset, gClipPacketSize);
			offset += gClipPacketSize;
			length -= gClipPacketSize;
		}
		vStream.WriteByte(data, offset, length);
	}

	function canConvertCurrentToRequestFormat(serverRequestedFormat) {
		//check whether conversion from current clipboard data to request format is possible
		return true;

	}

	/*
	 * buffer is array to which data is copied
	 * offset - where is ic copied
	 * i is data
	 */
	function write2Byte(buffer, offset, i) {

		buffer[offset++] = i & 0xff;
		buffer[offset++] = (i >> 8) & 0xff;
		return offset;
	}

	/*
	 * buffer is array to which data is copied
	 * offset - where is ic copied
	 * i is data
	 */
	function write4Byte(buffer, offset, i) {

		buffer[offset++] = i & 0xff;
		buffer[offset++] = (i >> 8) & 0xff;
		buffer[offset++] = (i >> 16) & 0xff;
		buffer[offset++] = (i >> 24) & 0xff;
		return offset;
	}

	/*
	 * if notify server that local system clipboard has been changed
	 * and sending capability what type f data it can send
	 * now only string data is supported
	 */
	function notifyClipboardChange(formatarr , formatlen , formatname) {
		//TODO send multiple format currently send only one format supported
		var stream = new Uint8Array(6 + 6* formatlen);
		var formatsupported = 0;
		var flags = PACKET_FLAG_NORMAL |PACKET_FLAG_PLACE_NOTIFICATION_ONLY ;
		var offset = 0;
		offset = write2Byte(stream, offset, CMD_PLACE);
		offset += 2;
		
		for(var i = 0 ; i < formatlen ; i++){
			var id = formatarr[i];
			if( id >= WFCF_REGISTEREDFIRST && id <= WFCF_REGISTEREDLAST){
				id = getFormatByName(formatname[i]);
			}
			if(id >= 0){
				formatsupported++;
				offset = write2Byte(stream, offset, id);
				offset = write4Byte(stream, offset, 0);
			}		
		}	
		if( formatsupported == 0 ){
			if(clip_empty === false){
				emptyHostClipboard( );
			}			
			setState(STATE_PROTOCOL_OPERATING);
			return ;
		}	
		if( formatsupported > 1){
			flags = flags | PACKET_FLAG_PLACE_MULTIPLE_FORMATS;
			offset = write2Byte(stream, offset, 0);
		}
		write2Byte(stream, 2, flags);
		vStream.WriteByte(stream, 0, offset);
		pendingQueueLength = 0;
		setState(STATE_PROTOCOL_OPERATING);
	}

	function emptyClipboard() {
		//TODO

	}
	function emptyHostClipboard( ){
		for(var i = 0 ; i < current_format_Len ; i++){
			requested_format[i] = 0 ;
		}
		current_format_Len = 0;
		pendingQueueLength = 0 ;
		if(clip_empty === true){
			return;
		}
		clip_empty = true;
		var stream = new Uint8Array(4);
		var flags = PACKET_FLAG_REQUEST_EMPTY | PACKET_FLAG_REQUEST_FAILED;
		var offset = 0;
		offset = write2Byte(stream, offset, CMD_PLACE);
		offset = write2Byte(stream, 2, flags);		
		vStream.WriteByte(stream, 0, offset);
	}
	function closeClipboard() {
		//TODO
	}

	function setClipPacketSize(size) {
		gClipPacketSize = size;
	}

	function notifyformatToClient( ){
		lastH2CTimestamp = Math.floor(timestamp( ));		
		sortByPriority( );
		var data = new Uint16Array(current_formatData);
		var formatname = new Array(current_format_Len);
		for(var i = 0 ; i < current_format_Len ;i++){
			formatname[i] = getFormatNameById(data[i]);
			if(formatname[i] != ""){
				data[i] = ClipFormatConverter.FORMAT_PRIVATE;
			}
		}
		callBackWrapper.notifyFormatChange( data , current_format_Len , formatname , lastH2CTimestamp);
	}
	function getPriority(formatId ){
		if(formatId >= CF_PRIVATEFIRST && formatId <= CF_PRIVATELAST){
			return -1;
		}
		else if(formatId >= WFCF_REGISTEREDFIRST && formatId <=WFCF_REGISTEREDLAST){
			return 0 ;
		}
		else if((formatId == 3) ||( formatId == 14 )){
			return 1;
		}
		else if( (formatId == 2) ||  ( (formatId <= 0x0080) &&  (formatId >= 0x0080))  ||( formatId == 9 )){
			return 2;
		}else
			return 3;
	}
	function sortByPriority( ){
		var j = 0 ;
		for(var i = 0 ; i < 4 ; i++){
			for(var k = j ; k < current_format_Len ; k++){
				if(getPriority(current_formatData[k]) == i ){
					var temp = current_formatData[k];
					current_formatData[k] = current_formatData[j];
					current_formatData[j++] = temp ;
				}
			}
		}
		current_format_Len = j;
	}
	function setLocalClipboard(format , data){
		var formatname ="";
		if(format >= WFCF_REGISTEREDFIRST && format <= WFCF_REGISTEREDLAST){			
			formatname = getFormatNameById(format);
			format = ClipFormatConverter.FORMAT_PRIVATE;
		}
		callBackWrapper.responseFormatData(format, formatname , data , lastH2CTimestamp);
	}	

}

