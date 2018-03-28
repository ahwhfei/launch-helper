function WinstationDriver(callBackWrapper1) {
	var myself = this;
	var callBackWrapper = callBackWrapper1;
	var WD_SERIALNUMBER = 1;
	var WD_GRAPHICSENABLED = true;
	var WD_MOUSEENABLED = true;
	var WD_ICABUFFERLENGTH = 2048;
	var WD_ICABUFFERLENGTH_FOR_HIGHTHROUGHPUT = 5000;
	var WD_OUTBUFCOUNTHOST = 6;
	var WD_OUTBUFCOUNTHOST_FOR_HIGHTHROUGHPUT = 44;
	var WD_OUTBUFCOUNTCLIENT_FOR_HIGHTHROUGHPUT = 44;
	var WD_OUTBUFCOUNTCLIENT = 6;
	var WD_OUTBUFDELAYHOST = -1;
	var WD_OUTBUFDELAYCLIENT = -1;
	var WD_CLIENTSERIALNUMBER = 0;
	var WD_DOUBLECLICKDETECT = true;
	var MAX_VIRTUAL_CHANNELS = 64;

	var WD_C2H_GRAPHICS = 0x01, WD_C2H_MOUSE = 0x02, WD_C2H_DOUBLE_CLICK = 0x04, WD_C2H_WINDOWS_KEY = 0x08, WD_C2H_AUTO_RECONNECT = 0x10;
	var haveSerialNumber = false;
	var serialNumber = -1;
	var gMouSampler = null, gPingTimer = null;
	
	this.UseLowestPriority = false;
	this.ChannelPriorityMap = new Uint8Array(MAX_VIRTUAL_CHANNELS);

	var CREDENTIALS_QUERY = 0x01;
	var CREDENTIALS_DATA = 0x02;
	var CREDENTIALS_XOR_ENCRYPTION_ALGORITHM = 0x01;

	// Channel Monitoring
	var gChannelMonitoringEnabled = false;	// Is channel monitoring enabled?
	var gShowMouseFeedback = false;	// Has the server told us to show mouse feedback?
	var channelMonitor = null;
	// ZeroLatency control. (Depending on the latency detected by the ChannelMonitor, we may wish to
	// turn the zero-latency behaviour on and off.)
	var gZLMouseMode;
	var gZLTextMode;

	// Default, is to disable Zero latency keyboard mode
	var DEF_ZLC_MODE = 0;
	// Default to auto Zero latency mouse
	var DEF_ZLMOUSE_MODE = 2;
	// Default Zero latency lower threshhold 150mS
	var DEF_ZL_LOW_LIMIT = 150;
	// Default Zero latency upper threshhold 150mS
	var DEF_ZL_HI_LIMIT = 250;
	// Default delay betwen connection pings
	var DEF_CHANNEL_MONITOR_DELAY = 20;


	var enableHighThroughput = true;

	var gZLMouseLowerThreshold = DEF_ZL_LOW_LIMIT;
	var gZLMouseUpperThreshold = DEF_ZL_HI_LIMIT;
	var gChannelMonitorTickRate = DEF_CHANNEL_MONITOR_DELAY;

	var context = new WDContext(this);
	// New WDHighThroughput class
	var highThroughputExtractor = null;
	var htContext = null;
	// Defaults to use WDHIghThroughput
	var useWDHighThroughput = true;

	var virtualWrites = new VirtualWriteQueue();
	var VIRTUAL_WRITE_INTERVAL = 20;

	/*
		Inactivity monitor for EUEM, flag to capture activity state
	*/
	var activityFound = true;

	var pingPacketRequest = new Uint8Array(11);
	pingPacketRequest[0] = 0x3F;
	pingPacketRequest[1] = 9;
	pingPacketRequest[2] = 0x1;
	var pingPacketResponse = new Uint8Array([0x3F, 1, 0x2]);
	var keyboardPacket = new Uint8Array(6);
	keyboardPacket[0] = 0x3C;
	keyboardPacket[1] = 0x3;
	keyboardPacket[2] = 0x00;
	var singleScancodePacket = new Uint8Array(2);
	singleScancodePacket[0] = 0x0A;
	var WritePacketRedrawpacket = new Uint8Array(9);
	WritePacketRedrawpacket[0] = 0x06;
	WritePacketRedrawpacket[1] = 6;
	WritePacketRedrawpacket[2] = 0;

	this.WdStream = null;
	var WriteStream = null;
	this.IcaStackControl = null;
	this.InteractiveMode = false, gUserInputEnabled = false;
	this.DontResetInteractiveMode = false;
	//Buffer for writing packet
	var outBuffer = null;

	var mouseHandler = new MouseHandler(myself);
	var getExpansionBufferSize = function() {
		return gExpanderPow2;
	};
	var getReductionBufferSize = function() {
		// Since we don't currently do Mark I (Perverse) Reduction, set the Reducer buffer size to
		// be zero *except* when we're doing Mark II Reduction.
		gReducerPow2 = (gExpanderLevel >= 3) ? gReducerPow2 : 0;
		return gReducerPow2;
	};

	var isExpanderEnabled = function() {
		return (gRedExEnabled & (getExpansionBufferSize() != 0));
	};
	this.getMouseHandler = function() {
		return mouseHandler;
	};
	this.EndWriting = function endWriting(reason) {
		if (gPingTimer)
			gPingTimer.Stop();

		if (WriteStream != null)
			WriteStream.EndWriting(reason);

	};

	/**
	 * Support for detecting whether the winstation driver is being interacted
	 * with, used by tw2 to determine whether stopwatch commands should force
	 * screen updates.
	 */
	this.IsInteractive = function isInteractive() {
		return myself.InteractiveMode;
	};

	this.ResetInteractive = function resetInteractive() {
		if (!myself.DontResetInteractiveMode) {
			myself.InteractiveMode = false;
		}
	};

	/**
	 * Returns the amount of output buffers on the host. (?)
	 */
	this.getOutBufCountHost = function() {
		var transport = HTML5_CONFIG['transport'];
		WD_OUTBUFCOUNTHOST_FOR_HIGHTHROUGHPUT = (transport['outbufscounthost'] != null) ? transport['outbufscounthost'] : 44;
		return enableHighThroughput ? WD_OUTBUFCOUNTHOST_FOR_HIGHTHROUGHPUT : WD_OUTBUFCOUNTHOST;
	};

	/**
	 * Returns the amount of output buffers on the client. (?)
	 */
	this.getOutBufCountClient = function() {
		var transport = HTML5_CONFIG['transport'];
		WD_OUTBUFCOUNTHOST_FOR_HIGHTHROUGHPUT = (transport['outbufscountclient'] != null) ? transport['outbufscountclient'] : 44;
		return enableHighThroughput ? WD_OUTBUFCOUNTCLIENT_FOR_HIGHTHROUGHPUT : WD_OUTBUFCOUNTCLIENT;
	};
	this.SetWriteStream = function setWriteStream(stream) {
		WriteStream = stream;
	};

	this.GetWriteStream = function getWriteStream() {
		return WriteStream;
	};

	this.getVirtualBinding = function getVirtualBinding() {
		return callBackWrapper.getVirtualBinding();

	};

	this.getVirtualStreamManager = function() {
		return callBackWrapper;
	};

	this.getVirtualStream = function getVirtualStream(channel) {
		return callBackWrapper.getVirtualStream(channel);
	};

	this.Close = function close(level) {
		highThroughputExtractor.EndConsuming();
	};

	this.WriteString = function writeString(byteArrayOutputStream, str, totalBytes) {
		var barr = new Array(totalBytes);
		for (var i = 0; i < totalBytes; ++i) {
			barr[i] = 0;
		}

		if (str != null) {
			var strLen = str.length;
			var len = strLen < totalBytes ? strLen : totalBytes;
			var c = [];
			for (var i = 0; i < strLen; ++i) {
				c[i] = str.charCodeAt(i);
			}
			for (var i = 0; i < len; ++i) {
				barr[i] = c[i];
			}
			byteArrayOutputStream.WriteByteArray(barr, 0, totalBytes);
		}
	};

	this.GetSerialNumber = function getSerialNumber() {
		if (haveSerialNumber == true)
			return serialNumber;

		serialNumber = 345675765;
		if (gLaunchData["SerialNumber"]) {
			serialNumber = gLaunchData["SerialNumber"];
		}
		haveSerialNumber = true;
		return serialNumber;
	};

	this.GetTextModes = function getTextModes() {
		var textModes = [];
		return textModes;
	};

	this.WriteInitResponseBody = function writeInitResponseBody(offsetableOutputStream) {
		ByteWriter.WriteInt32ToStream(offsetableOutputStream, myself.GetSerialNumber());

		var d = new Date();
		offsetableOutputStream.WriteByte(d.getDate());
		offsetableOutputStream.WriteByte(d.getMonth() + 1);

		ByteWriter.WriteInt16ToStream(offsetableOutputStream, d.getFullYear());

		offsetableOutputStream.WriteByte(d.getHours());
		offsetableOutputStream.WriteByte(d.getMinutes());
		offsetableOutputStream.WriteByte(d.getSeconds());
		offsetableOutputStream.WriteByte(Math.round(d.getMilliseconds() / 10));

		var flags = 0;

		if (WD_GRAPHICSENABLED == true)
			flags = flags | WD_C2H_GRAPHICS;

		if (WD_MOUSEENABLED == true)
			flags = flags | WD_C2H_MOUSE;

		flags = flags | WD_C2H_DOUBLE_CLICK;

		ByteWriter.WriteInt32ToStream(offsetableOutputStream, flags);

		var textModes = myself.GetTextModes();

		ByteWriter.WriteInt16ToStream(offsetableOutputStream, textModes.length / 12);

		offsetableOutputStream.WriteByteArrayWithOffset(textModes, 0, textModes.length);
		ByteWriter.WriteInt16ToStream(offsetableOutputStream, myself.getICABufferLength());
		ByteWriter.WriteInt16ToStream(offsetableOutputStream, myself.getOutBufCountHost());
		ByteWriter.WriteInt16ToStream(offsetableOutputStream, myself.getOutBufCountClient());
		ByteWriter.WriteInt16ToStream(offsetableOutputStream, WD_OUTBUFDELAYHOST);
		ByteWriter.WriteInt16ToStream(offsetableOutputStream, WD_OUTBUFDELAYCLIENT);
		ByteWriter.WriteInt16ToStream(offsetableOutputStream, 0x0101 /* product id */ );
		ByteWriter.WriteInt32ToStream(offsetableOutputStream, WD_CLIENTSERIALNUMBER);

		var vcBind = myself.getVirtualBinding();
		var vcBindLen = vcBind.length;
		ByteWriter.WriteInt16ToStream(offsetableOutputStream, vcBindLen);

		var temp = new ByteArrayOutputStream();
		var s = "";
		var n = 0;
		for (var i = 0; i < vcBindLen; ++i) {
			s = vcBind[i].Object;
			n = vcBind[i].Number;
			myself.WriteString(temp, s, 7);
			temp.WriteByte(0);
			ByteWriter.WriteInt16ToStream(temp, n);
		}
		var byteArray = temp.ToByteArray();
		offsetableOutputStream.WriteByteArrayWithOffset(byteArray, 0, byteArray.length);

		/* Added from Ica30WinstationDriver */

		if (gRedExEnabled) {
			offsetableOutputStream.WriteByte(getReductionBufferSize());
			offsetableOutputStream.WriteByte(getExpansionBufferSize());
			ByteWriter.WriteInt16ToStream(offsetableOutputStream, 0);
			ByteWriter.WriteInt16ToStream(offsetableOutputStream, gExpanderLevel);
		}

		if (gCapabilityEnabled && gWDCapabilities.Size() != 0) {
			var capData = gWDCapabilities.GetWDBytes();
			ByteWriter.WriteInt16ToStream(offsetableOutputStream, capData.length);
			if (capData.length == 0)
				offsetableOutputStream.WriteByteWithOffset(0);
			else
				offsetableOutputStream.WriteByteArrayWithOffset(capData);
		}
	};

	this.KeyboardLayout = 0;
	this.KeyboardSubtype = 0x000c0000;
	var gServerLevel = 0, gServerCodepage = 0;
	var gMouPos = new Point(0, 0);
	var gLastMouSent = new Point(0, 0);
	var gConnectionOpen = false;
	var gCharEncoding = SupportedEncoding.UNICODE_ENCODING;

	var domainLength = ClientConstant.DOMAINLENGTH_SHORT, usernameLength = ClientConstant.USERNAMELENGTH_SHORT;
	var passwordLength = ClientConstant.PASSWORDLENGTH_SHORT, clientDirLength = ClientConstant.CLIENTDIRLENGTH_SHORT;
	var workDirLength = ClientConstant.WORKDIRLENGTH_SHORT, initialProgLength = ClientConstant.INITIALPROGLENGTH_SHORT;
	var clientNameLength = ClientConstant.CLIENTNAMELENGTH_SHORT, clientLicenseLength = ClientConstant.CLIENTLICENSELENGTH_SHORT;

	var gMTUDetermine = false, gLongFields = false;
	var gCredentialsCommand = false;
		var gRedExEnabled          = true; // Is RedEx enabled?
    var WD_V2EXPBUFFERPOW2     = 17 & 0xff; // Default M2 Expander Buffer size (2^)
    var WD_V2HIGHEXPBUFFERPOW2 = 18 & 0xff; // Def High M2 Expander Buffer size (2^)
    var DEFAULT_MAX_NEW_DATA   = 4096; // Default maximum new data size
    var gExpanderPow2          = WD_V2EXPBUFFERPOW2; // Actual Expander Size
    var gReducerPow2           = WD_V2EXPBUFFERPOW2; // Actual Reducer Size
    var noExpander = false; // Is the Expander disabled?
    var noReducer  = false; // Is the Reducer disabled?

    var highExpanderPow2 = false; // Is this a WAN connection?

	var gExpanderLevel = 3    ; // V3_EXPANSION
    var temp = 1 << (gExpanderPow2 - 1);
	var gMaxExpanderSize = DEFAULT_MAX_NEW_DATA < temp?DEFAULT_MAX_NEW_DATA : temp;

	var expander = null  ;
    var reducer = new Reducer();

	var euks = false; // Can we send "proper" Unicode?


	var gCmdBuffer = [];

	var gCapabilityEnabled = false;
	var gHostCapabilities = null, gWDCapabilities = null;
	var gClientCapabilities = null;
	var serverVersion = null;

	var encryptionRequired = false, encryptionAvailable = false;

	this.TransportDriver = null;

	var getMaximumTransmissionBufferSize = function() {
		var chunkSize = TransportDriver.TD_OUTBUFLENGTH;
		chunkSize -= 2;
		// Framing
		chunkSize -= 1;
		// XOR encryption
		chunkSize -= myself.TransportDriver.SslOverhead;
		// SSL overhead
		return chunkSize;
	};

	this.HandlePacketInitRequest = function handlePacketInitRequest(serverLevel) {
		var modules = myself.IcaStackControl.GetIcaModules();
		var szModules = modules.length, count = modules.length;
		var szPacket = 0;
		var packet = [];

		gServerLevel = serverLevel;
		var cap = gHostCapabilities.GetCapability(Capability.WD_CAP_ID_INTELLIMOUSE);
		if ((cap != null) && ( cap instanceof IntelMouseCapability)) {
			var cap1 = gWDCapabilities.GetCapability(Capability.WD_CAP_ID_INTELLIMOUSE);
			if (cap1 !== null) {
				mouseHandler.setWheelSuppot(cap.mouseWhellSupport);
			}

		}
		if (gCapabilityEnabled && gHostCapabilities.Size() != 0) {
			for (var i = 0; i < szModules; ++i) {

				var module = modules[i];
				var moduleList = module.GetCapabilityList();
				if (moduleList != null) {
					var capList = gHostCapabilities.NegotiateWithClient(moduleList);
					module.SetCapabilityList(capList);
				}
			}
		}

		//Set client initiated caps
		this.SetClientCapabilities();

		gRedExEnabled = (gServerLevel >= 5);
		// TP.

		if (gCapabilityEnabled == true)
			SetCapabilitiesInformation(modules);

		// Note: gExpanderLevel is updated by setCapabilitiesInformation().

		// Do RedEx setup here
		if (!noExpander)
			gExpanderPow2 = ((gExpanderLevel >= 2) ? ((highExpanderPow2) ? WD_V2HIGHEXPBUFFERPOW2 : WD_V2EXPBUFFERPOW2) : 0);
		else
			gExpanderPow2 = 0;

		if (!noReducer) {
			// FIXME we need to see if we can implement Mark2 C->S with the new WD.
			gReducerPow2 = (gExpanderLevel >= 3) ? WD_V2EXPBUFFERPOW2 : 0;
		} else {
			gReducerPow2 = 0;
		}

		if (gServerLevel < 6) {
			throw WinstationDriverError.WRONG_SERVER_VERSION;
		}

		var stream = new OffsetableOutputStream();

		if (gMTUDetermine == true) {
			myself.TransportDriver.setMTU();
		}

		for (var i = 0; i < szModules; ++i) {
			count = count - 1;
			var module = modules[i];

			stream.Reset();
			WriteModuleHeader(stream, module);

			myself.WriteModuleBody(stream, module);
			packet = stream.ToByteArray();
			szPacket = packet.length;
			packet[0] = szPacket & 0xFF;
			packet[1] = (szPacket >>> 8) & 0xFF;
			packet[2] = count & 0xFF;
			myself.WritePacketInitResponse(packet);
		}

	};

	var WriteModuleHeader = function writeModuleHeader(stream, module) {
		ByteWriter.WriteInt16ToStream(stream, 0);
		stream.WriteByte(0);
		stream.WriteByte(module.GetModuleClass());
		stream.WriteByte(module.GetVersionL());
		stream.WriteByte(module.GetVersionH());

		stream.WriteString("", 12);
		stream.WriteByte(0);

		stream.WriteString(module.GetHostModuleName(), 8);
		stream.WriteByte(0);

		var d = module.GetModuleDate();
		var day = d.getDate();
		var year = d.getFullYear() - 1980;
		var month = d.getMonth() + 1;
		var date = (day & 0x001F) | ((month << 5) & 0x01E0) | ((year << 9) & 0xFE00);

		var hrs = d.getHours();
		var min = d.getMinutes();
		var sec = d.getSeconds();
		//double bitwise not to floor
		var time = ((~~(sec / 2)) & 0x001F) | ((min << 5) & 0x07E0) | ((hrs << 11) & 0xF800);

		ByteWriter.WriteInt16ToStream(stream, date);
		ByteWriter.WriteInt16ToStream(stream, time);

		ByteWriter.WriteInt32ToStream(stream, module.GetModuleSize());
	};

	this.WriteModuleBody = function writeModuleBody(stream, module) {
		if ( module instanceof WinstationDriver) {
			module.WriteInitResponseBody(stream);
		} else if ( module instanceof TransportDriver) {
			myself.WriteTransportDriverBody(stream, module);
		} else if ( module instanceof RFrameProtocolDriverStack) {
			myself.WriteProtocolDriverBody(stream, module);
		} else if ( module instanceof EncryptProtocolDriverStack) {
			myself.WriteProtocolDriverBody(stream, module);
		} else if ( module instanceof SecureICAProtocolDriverStack) {
            myself.WriteProtocolDriverBody(stream, module);
        } else if ( module instanceof ThinWireStack) {
			myself.WriteVirtualDriverBody(stream, module);
		}
		/* else if (module instanceof TUIVirtualDriver)
		 {
		 myself.WriteVirtualDriverBody(stream, module);
		 }*/
		else if ( module instanceof TWIStack) {
			myself.WriteVirtualDriverBody(stream, module);
		} else if ( module instanceof UIModule) {
			myself.WriteUserInterfaceBody(stream, module);
		} else if ( module instanceof ClipBoardStack) {
		    myself.WriteVirtualDriverBody(stream, module);
		} else if ( module instanceof EuemStack) {
			myself.WriteVirtualDriverBody(stream, module);
		} else if ( module instanceof AudioStack) {

			myself.WriteVirtualDriverBody(stream, module);
		} else if ( module instanceof VdmmStack) {
			myself.WriteVirtualDriverBody(stream, module);
		}else if(module instanceof CTLStack)
        {
            myself.WriteVirtualDriverBody(stream,module);
        }
		else if (module instanceof PrinterStack) {
			myself.WriteVirtualDriverBody(stream, module);
		}else if (module instanceof UsbStack) {
		    myself.WriteVirtualDriverBody(stream, module);
		}
		else if(module instanceof FileStack) {
			myself.WriteVirtualDriverBody(stream, module);
		}
		else if(module instanceof SerialStack) {
			myself.WriteVirtualDriverBody(stream, module);
		}
		else if(module instanceof MRVCStack) {			
			myself.WriteVirtualDriverBody(stream, module);
		}
		else if(module instanceof SCardStack) {			
			myself.WriteVirtualDriverBody(stream, module);
		}
		else if(module instanceof MultiTouchStack)
        {
            myself.WriteVirtualDriverBody(stream,module);
        }else if(module instanceof CustomVCStack) {		
			myself.WriteVirtualDriverBody(stream, module);
		}
	};

	this.WritePacketInitResponse = function writePacketInitResponse(appendedData) {
		var szData = appendedData.length;
		var packet = new Uint8Array(3 + szData);
		packet[0] = 0x01;
		packet[1] = szData;
		packet[2] = (szData >> 8);
		Utility.CopyArray(appendedData, 0, packet, 3, szData);
		writeBytes(packet, 0, packet.length);
	};
	this.setHighThroughputExtractor = function(extractor) {
		highThroughputExtractor = extractor;
		htContext = extractor.GetContext();
		mouseHandler.setContext(htContext);
	};
	this.setExpander = function(expand) {
		expander = expand;
	};

	/**
	 * Returns the maximum size of one ICA packet.
	 */
	this.getICABufferLength = function() {
		return enableHighThroughput ? WD_ICABUFFERLENGTH_FOR_HIGHTHROUGHPUT : WD_ICABUFFERLENGTH;
	};

	var writeBytes = function(packet, offset, length) {
		if (WriteStream == null) {
			return;
		}
		// Determine if the last virtual write was partial.  If it was, then we need
		// to interrupt it in order to send this WD packet.  If not, then we don't
		// want to be sending the WD_TO_WD_INTERRUPT_VIRTUAL_WRITE flag, since there
		// isn't a virtual write to interrupt.
		var partialLastVW = context.lastVirtualWriteWasPartial;

		if (gExpanderLevel < 3)
			context.needToSendInterrupt = partialLastVW;

		// If we need to interrupt, then we'll also need to resume.  The "resume"
		// flag is only unset when it is actually used.
		if (partialLastVW) {
			context.needToResumeVirtualWrite = true;
		}

		// Obtain the maximum buffer length.
		var maxLen = getMaximumTransmissionBufferSize();

		if (outBuffer == null)
			outBuffer = new Uint8Array(maxLen);

		var maxOverhead = highThroughputExtractor.GetMaximumOverheadBytes();
		maxLen -= maxOverhead;

		var outbuf = new RedExOutputBuffer(outBuffer, maxOverhead, maxLen);
		var priority = 0;			

		// Compress here.
		var partial = reducer.compressData(packet, offset, length, virtualWrites, outbuf, context, htContext);

		// Indicate if the last virtual write was partial.
		context.lastVirtualWriteWasPartial = partial;

		var len = outbuf.getLength();

		// Add the high throughput header.
		var newOffset = highThroughputExtractor.AddHeader(outBuffer, maxOverhead, len, context);

		virtualWrites.compact();

		// We now have an outbuf that we can send.  Calculate the actual length of
		// this write, and then send it.
		var writeLen = len + (maxOverhead - newOffset);
		writeLen |= ((priority << 14) & 0xffff); //Set first two bits to priority

		WriteStream.WriteByte(outBuffer, newOffset, writeLen);

		activityFound = true;
	};
	this.writeByte = writeBytes;
	var sendVirtualWrites = function() {
		//change to while
		while (!virtualWrites.isEmpty()) {

			if (WriteStream == null) {
				return;
			}

			// Obtain the maximum buffer length.
			var maxLen = getMaximumTransmissionBufferSize();

			if (outBuffer == null)
				outBuffer = new Uint8Array(maxLen);

			var maxOverhead = highThroughputExtractor.GetMaximumOverheadBytes();
			maxLen -= maxOverhead;
			
			var priority = 0;	//Find priority for the channel
			var item = virtualWrites.getHeadItem();			
			if(item instanceof VirtualWriteItem) {									
				priority = item.priority;					
			}

			var outbuf = new RedExOutputBuffer(outBuffer, maxOverhead, maxLen);

			// Compress here.
			var partial = reducer.compressData(virtualWrites, outbuf, context, htContext);

			// Indicate if the last virtual write was partial.
			context.lastVirtualWriteWasPartial = partial;

			var len = outbuf.getLength();

			// Add the high throughput header.
			var newOffset = highThroughputExtractor.AddHeader(outBuffer, maxOverhead, len, context);

			virtualWrites.compact();

			// We now have an outbuf that we can send.  Calculate the actual length of
			// this write, and then send it.
			var writeLen = len + (maxOverhead - newOffset);
			writeLen |= ((priority << 14) & 0xffff); //Set first two bits of length to priority						
			WriteStream.WriteByte(outBuffer, newOffset, writeLen);
			activityFound = true;
		}
	};
	var SetCapabilitiesInformation = function setCapabilitiesInformation(modules) {
		var szModules = modules.length;
		for (var modIndex = 0; modIndex < szModules; ++modIndex) {
			if (modules[modIndex].GetModuleClass() == UIModule.WINSTATION_DRIVER) {
				var capsList = modules[modIndex].GetCapabilityList();
				if (capsList != null) {
					var cap = capsList.GetCapability(Capability.WD_CAP_ID_LONG_NAME);
					if ((cap != null) && ( cap instanceof LongNameCapability))
						gLongFields = true;

					cap = capsList.GetCapability(Capability.WD_CAP_ID_CREDENTIALS_PASSING);
					if ((cap != null) && ( cap instanceof CredentialsCapability)) {
						gCredentialsCommand = true;
					}

					// Can we use High Throughput architecture
					cap = capsList.GetCapability(Capability.WD_CAP_ID_HIGH_THROUGHPUT);
					if ((cap != null) && ( cap instanceof HighThroughputCap)) {
						enableHighThroughput = cap.CanDoHighThroughput();
						var channal = ChannalMap.virtualChannalMap["CTXCDM "];
						var channel = callBackWrapper.getVirtualStream(channal);
						if (channel) {
							var data = new Object();
							data.cmd = WorkerCommand.CMDENABLEHIGHTHROUGHPUT;
							data.channel = channal;
							data.cmd_enablehighthroughput = enableHighThroughput;

							channel.postMessage(data);

						}
						if (useWDHighThroughput)
							highThroughputExtractor.canDoWDHighThroughput = enableHighThroughput;
						//else
						//  highThroughputExtractor.setCanDoHighThroughput(false);

						context.highThroughputSupported = true;
					} else {
						context.highThroughputSupported = false;
					}

					cap = capsList.GetCapability(Capability.WD_CAP_ID_REDUCERS_SUPPORTED);
					if ((cap != null) && ( cap instanceof ReducerCap)) {
						gExpanderLevel = cap.getHighReducer();
					}

					// Can we send "proper" Unicode?
					cap = capsList.GetCapability(Capability.WD_CAP_ID_CAPABILITY_EUKS);
					if ((cap != null) && ( cap instanceof EuksCapability)) {
						euks = cap.canDoEUKS();
						callBackWrapper.enableEUKS(euks);
					}

				}
				break;
			}
		}
	};

	this.WriteProtocolDriverBody = function writeProtocolDriverBody(offsetableOutputStream, protocolDriver) {
		offsetableOutputStream.WriteByte(protocolDriver.GetProtocolClass());
		offsetableOutputStream.WriteByte(0);
		offsetableOutputStream.WriteByte(0);
		offsetableOutputStream.WriteByte(0);
		protocolDriver.AddInitResponseData(offsetableOutputStream);

		if (protocolDriver.GetProtocolClass() == ProtocolDriver.PD_ENCRYPT) {
			encryptionRequired = true;
		}
	};

	this.WriteTransportDriverBody = function writeTransportDriverBody(offsetableOutputStream, transportDriver) {
		ByteWriter.WriteInt16ToStream(offsetableOutputStream, TransportDriver.TD_OUTBUFLENGTH);
		ByteWriter.WriteInt16ToStream(offsetableOutputStream, TransportDriver.TD_AF_INET);
		var address = transportDriver.GetClientAddress();
		var length = address.length;
		if (length > 19)
			length = 19;
		offsetableOutputStream.WriteByteArray(address, 0, length);
		if (length < 19) {
			for (var i = length; i < 19; ++i)
				offsetableOutputStream.WriteByte(0);
		}
		// Null terminating string
		offsetableOutputStream.WriteByte(0);
	};

	this.WriteVirtualDriverBody = function writeVirtualDriverBody(offsetableOutputStream, virtualDriver) {
		ByteWriter.WriteInt32ToStream(offsetableOutputStream, virtualDriver.GetChannelMask(callBackWrapper));
		offsetableOutputStream.WriteByte(virtualDriver.GetBandwidthQuota());
		
		if( virtualDriver.flowType == VirtualDriver.VD_FLOW_ACK ){
			offsetableOutputStream.WriteByte(VirtualDriver.VD_FLOW_ACK);
			offsetableOutputStream.WriteByte(0);
			offsetableOutputStream.WriteByte(0);
	 		if (enableHighThroughput) {
			   ByteWriter.WriteInt16ToStream(offsetableOutputStream, virtualDriver.getMaxWindowSize2());
               ByteWriter.WriteInt16ToStream(offsetableOutputStream, virtualDriver.getWindowSize2());
            }
            else {
               ByteWriter.WriteInt16ToStream(offsetableOutputStream, virtualDriver.getMaxWindowSize());
               ByteWriter.WriteInt16ToStream(offsetableOutputStream, virtualDriver.getWindowSize());
            }
		}
		else {
			offsetableOutputStream.WriteByte(VirtualDriver.VD_FLOW_NONE);
			offsetableOutputStream.WriteByte(0);
			offsetableOutputStream.WriteByte(0);
			offsetableOutputStream.WriteByte(0);
			offsetableOutputStream.WriteByte(0);
			offsetableOutputStream.WriteByte(0);
			offsetableOutputStream.WriteByte(0);
		}
		virtualDriver.AddInitResponseData(offsetableOutputStream);
	};

	var IncreaseFieldLengths = function increaseFieldLengths() {
		domainLength = ClientConstant.DOMAINLENGTH_LONG;
		usernameLength = ClientConstant.USERNAMELENGTH_LONG;
		passwordLength = ClientConstant.PASSWORDLENGTH_LONG;
		clientDirLength = ClientConstant.CLIENTDIRLENGTH_LONG;
		workDirLength = ClientConstant.WORKDIRLENGTH_LONG;
		initialProgLength = ClientConstant.INITIALPROGLENGTH_LONG;
		clientNameLength = ClientConstant.CLIENTNAMELENGTH_LONG;
		clientLicenseLength = ClientConstant.CLIENTLICENSELENGTH_LONG;
	};

	this.HandlePacketInitConnect = function handlePacketInitConnect(packet) {
		var modulesLeft = (packet[2] & 0xff);
		var moduleClass = (packet[3] & 0xff);

		if (moduleClass == UIModule.PROTOCOL_DRIVER) {
			var pdClass = packet[8];
			if (pdClass == ProtocolDriver.PD_ENCRYPT) {
				encryptionAvailable = true;
			}
		}

		if (moduleClass == UIModule.WINSTATION_DRIVER && gRedExEnabled) {
			var winstationConnectionVersion = packet[6] & 0xFF;
			var nextIndex = 8;
			nextIndex = nextIndex + 2 + 2 + 2 + 2 + 2 + 2 + 4 + 2;

			gReducerPow2 = packet[nextIndex++];
			gExpanderPow2 = packet[nextIndex++];

			gMaxExpanderSize = ((packet[nextIndex++] & 0xff) | ((packet[nextIndex++] << 8) & 0xff00));

			gExpanderLevel = ((packet[nextIndex++] & 0xff) | ((packet[nextIndex++] << 8) & 0xff00));

			if (gCapabilityEnabled == true) {
				var capListLength = (packet[nextIndex++] & 0xff) | ((packet[nextIndex++] << 8) & 0xff00);
				var oCapList = (packet[nextIndex++] & 0xff) | ((packet[nextIndex++] << 8) & 0xff00);

				if (oCapList + capListLength > packet.length)
					throw WinstationDriverError.INVALID_CAPABILITY_LIST_LENGTH;
				gWDCapabilities.ReadWDCapabilityList(packet, oCapList, myself);

				// Determine if Channel Monitoring is enabled
				var cap = gWDCapabilities.GetCapability(Capability.WD_CAP_ID_CHANNEL_MONITORING);
				if ((cap != null) && ( cap instanceof ChannelMonitorCapability)) {
					if (cap.IsEnabled()) {
						gChannelMonitoringEnabled = true;
						gChannelMonitorTickRate = cap.repeatDelay;
						channelMonitor = new ChannelMonitor(this, cap.mouseThresholdUpper, cap.mouseThresholdUpper);
						if (cap.IsMouseEnabled()) {
							gShowMouseFeedback = true;
						}
					}
				}

				var cap = gWDCapabilities.GetCapability(Capability.WD_CAP_ID_SERVER_VERSION);

				if ((cap != null) && ( cap instanceof ServerVersionCapability)) {
					serverVersion = cap;
				}
			}

			if (winstationConnectionVersion >= 9) {
				gServerCodepage = (packet[nextIndex++] & 0xff) | ((packet[nextIndex++] << 8) & 0xff00);
			}
		}

		if (modulesLeft === 0) {
			if ((encryptionRequired == true) && (encryptionAvailable == false)) {
				throw WinstationDriverError.REQUESTED_ENCRYPTION_NOT_SUPPORTED;
			}

			//TODO:
			if (isExpanderEnabled() || (gExpanderLevel == 3 || gExpanderLevel == 4)) {
				expander.ActivateExpander(getExpansionBufferSize(), gMaxExpanderSize, gExpanderLevel);
				// Activate the reducer AFTER the next packet has been sent
			}

			myself.WritePacketInitConnectResponse();

			highThroughputExtractor.useInterruption = (gExpanderLevel < 3);
			highThroughputExtractor.startUsingWDHighThroughput = true;
			myself.IcaStackControl.EnableProtocolDrivers();

			if (isExpanderEnabled() || (gExpanderLevel == 3 || gExpanderLevel == 4)) {
				var reduceSize = getReductionBufferSize();
				reducer.ActivateReducer(reduceSize, gMaxExpanderSize, (reduceSize > 0 || (gExpanderLevel == 3 || gExpanderLevel == 4)) ? gExpanderLevel : 0);
			}

			this.queueVirtualWrite = writeVcPacket;
			EnableUserInput();

			if (gChannelMonitoringEnabled) {
				channelMonitor.Enable();
			}
		}
	};

	this.CGP_Resume = function(){
		console.log("Enabling User Input in WD");
		EnableUserInput();
	};
	this.CGP_Suspend = function (){
		console.log("Disabling User Input in WD");
		DisableUserInput();
	};
	var DisableUserInput = function disableUserInput() {
		gUserInputEnabled = false;
		mouseHandler.setUserInput(false);
	};

	var EnableUserInput = function enableUserInput() {
		gUserInputEnabled = true;
		mouseHandler.setUserInput(true);
	};

	this.WritePacketInitConnectResponse = function writePacketInitConnectResponse() {
		if (gServerLevel != 0) {
			var packet = new Uint8Array(3);
			packet[0] = 0x04;
			packet[1] = 0x00;
			packet[2] = 0x00;
			writeBytes(packet, 0, packet.length);
		}
		gConnectionOpen = true;
        	
		//send endSCD to euem
		callBackWrapper.sendEndScdToEuem(Date.now());
	};

	this.GetDisplayName = function() {
		return "ICA 3.0";
	};
	this.GetHostModuleName = function() {
		return ModuleConstant.MODULE_HOSTMODULENAME;
	};
	this.GetModuleClass = function() {
		return UIModule.WINSTATION_DRIVER;
	};
	this.GetVersionL = function() {
		return ModuleConstant.MODULE_VERSIONL;
	};
	this.GetVersionH = function() {
		return ModuleConstant.MODULE_VERSIONH;
	};
	this.GetModuleDate = function() {
		return ModuleConstant.MODULE_DATE;
	};
	this.GetModuleSize = function() {
		return ModuleConstant.MODULE_SIZE;
	};
	this.GetEncodingType = function() {
		return gCharEncoding;
	};
	this.SetEncodingType = function(encoding) {
		gCharEncoding = encoding;
	};
	this.GetCapabilityList = function() {
		return gWDCapabilities;
	};
	this.SetCapabilityList = function(capabilityList) {
		gWDCapabilities = capabilityList;
	};

	this.SetClientCapabilities = function() {
		if(gWDCapabilities && gClientCapabilities) {
			gWDCapabilities.AddCapabilityList(gClientCapabilities);
		}
	}
	
	this.GetMaxPacketSize = function getMaxPacketSize() {
		return TransportDriver.TD_OUTBUFLENGTH;
	};

	var pingResponseCame = false;
	var isPingRequested = false;

	var SendPingRequest = function sendPingRequest() {
		//pingResponseCame = false; Don't manipulate this variable here. Ideally this should be false itself.
		if (channelMonitor != null)
			if(channelMonitor.AppendPing()) // What if ChannelMonitoring is not enabled?
				isPingRequested = true;		// This will take up unnecassary cycle but won't break the PollServer Logic.
	};

	this.PingReceived = function pingReceived() {
		pingResponseCame = true;	//Set only the variable required.
		// isPingRequested = false; // Why are we setting this here?? This might break the logic below.
	};

	function PollServer() {
		if (TransportDriver.isServerActive) {	// Check if server is active?
			if (isPingRequested) {				// Did we send a request??
				if (pingResponseCame) {			// Did we get a response?
					pingResponseCame = false;	// Reset Condition variables and repeat the loop.
					isPingRequested = false;
					SendPingRequest();
				} else {
					// What do we ned to do here?? Log it? Disconnect?? or Wait again for a response??
					// Keep a counter and see the number of retries before it gets a response??
					//callBackWrapper.showError("Citrix Receiver", String("error-reach-server-msg"), null, null, CTXDLGCB.CLOSECURRENTTAB);
					writeHTML5Log(0,"SESSION:|:ICA:|:WINSTATION:|:POLLSERVER: Server is active but no response Came. Issue with Ping Response From server.");
					//return;
				}
			} else {							// No Ping request has been sent. Send One now.
				SendPingRequest();
			}
		} else {							// Server is not active. What do we do??
			// IDEALLY THIS IS WHERE WE SHOULD ABORT THE CONNECTION. BUT what if there is CGP in place? Do we even need to disconnect the session here?
			// This scenario is being hit when we have disable SR on the DDC. Check for CGP Disabled and Then Disconnect.
			// RFHTMCRM-1428 Bug fix
			if(!TransportDriver.CGPEnabled) {
				callBackWrapper.showError("Citrix Receiver", String("error-reach-server-msg"), null, null, CTXDLGCB.CLOSECURRENTTAB);
			}
			writeHTML5Log(0,"SESSION:|:ICA:|:WINSTATION:|:POLLSERVER: Server is inactive and session should have been disconnected here.");
			
		}
		TransportDriver.isServerActive = false;
		ChMonTimer = setTimeout(function() {
			PollServer();
		}, 60000);
	}

	var ChMonTimer = setTimeout(function() {
		PollServer();
	}, 20000);
	
	this.ProcessWDCapabilities = function processWDCapabilities() {
		gWDCapabilities = new CapabilityList();

		var redMask = ReducerCap.V4_MASK | ReducerCap.V3_MASK | ReducerCap.MARK2_MASK;

		gWDCapabilities.AddCapability(new ReducerCap(redMask));
		gWDCapabilities.AddCapability(new ChannelMonitorCapability(gChannelMonitorTickRate, gZLMouseLowerThreshold, gZLMouseUpperThreshold));
		gWDCapabilities.AddCapability(new LongNameCapability());
		gWDCapabilities.AddCapability(new ServerVersionCapability(null, 0));
		gWDCapabilities.AddCapability(new CredentialsCapability(0));
		gWDCapabilities.AddCapability(new HighThroughputCap());
		gWDCapabilities.AddCapability(new TimeZoneCapability());
		gWDCapabilities.AddCapability(new EuksCapability(1, 1, 1));		// version 1
		gWDCapabilities.AddCapability(new IntelMouseCapability(null));
		gWDCapabilities.AddCapability(new WanscalerSupport(null,0));

		//Add client initiated capabilites 
		gClientCapabilities = new CapabilityList();
		gClientCapabilities.AddCapability(new PacketPriority(null, 0, null));			
	};

	var PACKET_WDCREDENTIALS_HEADER = new Array(PacketIdentifier.PACKET_WDCREDENTIALS, 0x00, 0x00, CREDENTIALS_DATA, CREDENTIALS_XOR_ENCRYPTION_ALGORITHM);

	this.HandlePacketWDCredentials = function handlePacketWDCredentials(dataPacket) {
		var command = dataPacket[0];
		switch (command) {
			case CREDENTIALS_QUERY:
				var format = dataPacket[1];
				if (format == CREDENTIALS_XOR_ENCRYPTION_ALGORITHM) {
					var stream = new OffsetableOutputStream();
					stream.Reset();

					var uidata = [];
					var encodingType = SupportedEncoding.UNICODE_ENCODING;
					var szDomain = 0, szUsername = 0, szPassword = 0;

					var icaUsername = "";
					if (gLaunchData["Username"]) {
						icaUsername = gLaunchData["Username"];
					}
					szUsername = AppendUIData(encodingType, icaUsername, uidata, usernameLength);

					var icaDomain = "";
					if (gLaunchData["Domain"]) {
						icaDomain = gLaunchData["Domain"];
					}
					szDomain = AppendUIData(encodingType, icaDomain, uidata, domainLength);

					var icaPassword = "";
					if (gLaunchData["ClearPassword"]) {
						icaPassword = gLaunchData["ClearPassword"];
					}
					szPassword = AppendUIData(encodingType, icaPassword, uidata, passwordLength);

					if (encodingType == SupportedEncoding.UNICODE_ENCODING) {
						szDomain *= 2;
						szUsername *= 2;
						szPassword *= 2;
					}

					var dataOff = 0;

					stream.WriteByteArrayWithBigOffset(uidata, dataOff, szUsername);
					dataOff += szUsername;

					stream.WriteByteArrayWithBigOffset(uidata, dataOff, szDomain);
					dataOff += szDomain;

					stream.WriteByteArrayWithBigOffset(uidata, dataOff, szPassword);
					dataOff += szPassword;

					// Turn stream into byte array.
					var bodyData = stream.ToByteArray();
					var headerLength = PACKET_WDCREDENTIALS_HEADER.length;
					var bodyLength = bodyData.length;
					var packet = new Uint8Array(headerLength + bodyLength);
					Utility.CopyArray(PACKET_WDCREDENTIALS_HEADER, 0, packet, 0, headerLength);
					Utility.CopyArray(bodyData, 0, packet, headerLength, bodyLength);

					// Add correct length.
					var length = packet.length - 3;
					// Take off command byte and length bytes.
					packet[1] = length;
					packet[2] = (length >> 8);
					// Write output.
					writeBytes(packet, 0, packet.length);

				} else {
					// Error.
					// TODO - ProtocolException.
				}
				break;
			case CREDENTIALS_DATA:
			// fallthrough
			default:
				// Error condition - we should never be sent this sub-command.
				// TODO - ProtocolException.
				break;
		}
	};

	this.writeBandwidthPacket = function() {
		if (WriteStream == null)
			return null;
		var ICM_PING_NOP = 0x4;
		var packet = new Uint8Array(3);
		packet[0] = PacketIdentifier.PACKET_CHANNEL_MONITORING;
		packet[1] = 1;
		packet[2] = ICM_PING_NOP;

		writeBytes(packet, 0, packet.length);
	};

	this.writeCachePacket = function writeCachePacket(packet) {
		if (WriteStream == null)
			return null;

		writeBytes(packet, 0, packet.length);
	};

	this.WritePacketTerminateAck = function writePacketTerminateAck() {
		expander.disableExpander();
		if (WriteStream == null)
			return null;

		var packet = new Uint8Array(3);
		packet[0] = 0x05;
		packet[1] = 0x00;
		packet[2] = 0x02;
		writeBytes(packet, 0, packet.length);
	};

	this.WritePacketPingRequest = function writePacketPingRequest(lastLatency, averageLatency) {
		if (WriteStream == null)
			return null;
		pingPacketRequest[3] = lastLatency & 0xFF;
		pingPacketRequest[4] = (lastLatency >>> 8) & 0xFF;
		pingPacketRequest[5] = (lastLatency >>> 16) & 0xFF;
		pingPacketRequest[6] = (lastLatency >>> 24) & 0xFF;
		averageLatency = averageLatency >> 3;
		pingPacketRequest[7] = averageLatency & 0xFF;
		pingPacketRequest[8] = (averageLatency >>> 8) & 0xFF;
		pingPacketRequest[9] = (averageLatency >>> 16) & 0xFF;
		pingPacketRequest[10] = (averageLatency >>> 24) & 0xFF;
		writeBytes(pingPacketRequest, 0, pingPacketRequest.length);
	};

	this.WritePacketPingResponse = function writePacketPingResponse() {

		writeBytes(pingPacketResponse, 0, pingPacketResponse.length);
	};

	this.writePacketKeyboardUnicode = function writePacketKeyboardUnicode(unicode, typeOfKey) {
		
		
		if (gUserInputEnabled == true) {
			if (WriteStream == null)
				return null;
			keyboardPacket[3] = typeOfKey;
			keyboardPacket[4] = unicode;
			keyboardPacket[5] = (unicode >> 8);
			writeBytes(keyboardPacket, 0, keyboardPacket.length);
			myself.InteractiveMode = true;
		}
	};

	this.writePacketKeyboardSingleScanCode = function writePacketKeyboardSingleScanCode(scancode, isKeyUp){
		if(!isKeyUp){
			singleScancodePacket[1] = scancode;
		}
		else{
			singleScancodePacket[1] = scancode + 0x80;
		}
		writeBytes(singleScancodePacket, 0, singleScancodePacket.length);
		myself.InteractiveMode = true;
	};

	this.isEUKSEnabled = function() {
		return euks;
	};

	this.writePacketSetLed = function writePacketSetLed(ledBitmask) {
		if (WriteStream == null)
			return null;

		var packet = new Uint8Array(2);
		packet[0] = 0x37;
		packet[1] = ledBitmask;
		writeBytes(packet, 0, packet.length);
	};

	this.WritePacketRedraw = function writePacketRedraw(x, y, width, height) {
		if (WriteStream == null)
			return null;

		var x1, y1, x2, y2;

		x1 = x;
		y1 = y;
		x2 = x1 + width;
		y2 = y1 + height;
		WritePacketRedrawpacket[3] = x1;
		WritePacketRedrawpacket[4] = (((x1 >> 8) & 0x0f) | (y1 << 4));
		WritePacketRedrawpacket[5] = (y1 >> 4);
		WritePacketRedrawpacket[6] = x2;
		WritePacketRedrawpacket[7] = (((x2 >> 8) & 0x0f) | (y2 << 4));
		WritePacketRedrawpacket[8] = (y2 >> 4);

		writeBytes(WritePacketRedrawpacket, 0, WritePacketRedrawpacket.length);
	};

	var zlActive = false;

	this.SetZlMode = function SetZlMode(isActive) {
		zlActive = isActive;
	};

	this.ToggleActiveZlStatus = function toggleActiveZlStatus() {
		zlActive = !zlActive;
	};
	this.HandlePacketTerminate = function handlePacketTerminate(command) {				
		if (command == SubCommand.TERMINATE_DISCONNECT) {
			DisableUserInput();
			myself.WritePacketTerminateAck();
			myself.IcaStackControl.ResetProtocolDrivers();
			
			this.queueVirtualWrite = ignoreWrite;
			gRedExEnabled = true;
			expander.pause();
			reducer.pause();
			return true;
		} else if (command == SubCommand.TERMINATE_LOGOFF) {		
			myself.WritePacketTerminateAck();			
			myself.EndWriting(null);				
			return false;
		} else {					
			throw WinstationDriverError.INVALID_TERMINATION_TYPE;
		}		
	};
	
	var HandlePacketBeep = function handlePacketBeep(frequency, duration) {
	};

	this.ProcessNextCmd = function processNextCmd(commandByte, size) {
		var command = commandByte;
		var processMore = true;
		var stream = myself.WdStream;
		var packet = null;
		stream.ResetRead();

		if (command == PacketIdentifier.PACKET_INIT_REQUEST) {
			writeHTML5Log(0,"SESSION:|:ICA:|:WINSTATION:|:DRIVER:|:init request");
			var serverLevel = 0;
			if (size != 0)
				serverLevel = stream.ReadUInt8();
			if (serverLevel > 6) {
				packet = new Uint8Array(size - 1);
				stream.ReadBytes(packet, 0, size - 1);
				gCapabilityEnabled = true;
				myself.ProcessWDCapabilities();
				gHostCapabilities = new CapabilityList();
				gHostCapabilities.ReadWDCapabilityList(packet, 0, myself);
				myself.HandlePacketInitRequest(serverLevel);
			}
		} else if (command == PacketIdentifier.PACKET_INIT_CONNECT) {
			packet = new Uint8Array(size);
			stream.ReadBytes(packet, 0, size);
			myself.HandlePacketInitConnect(packet);
		} else if (command == PacketIdentifier.PACKET_TERMINATE) {
			writeHTML5Log(0,"SESSION:|:ICA:|:WINSTATION:|:DRIVER:|:terminate session" + command);
			var terminateType = stream.ReadByte();
			if (size > 1) {
				stream.SkipByte(size - 1);
			}
			processMore = myself.HandlePacketTerminate(terminateType);
		} else if (command == PacketIdentifier.PACKET_BEEP) {
			var frequency = stream.ReadUInt16();
			var duration = stream.ReadUInt16();
			HandlePacketBeep(frequency, duration);
		} else if (command == PacketIdentifier.PACKET_VIRTUAL_WRITE0) {
			throw WinstationDriverError.COMMAND_REPROCESSING_NOT_ALLOWED;
		} else if (command == PacketIdentifier.PACKET_VIRTUAL_WRITE1) {
			throw WinstationDriverError.COMMAND_REPROCESSING_NOT_ALLOWED;
		} else if (command == PacketIdentifier.PACKET_VIRTUAL_WRITE2) {
			throw WinstationDriverError.COMMAND_REPROCESSING_NOT_ALLOWED;
		} else if (command == PacketIdentifier.PACKET_SET_CLIENT_DATA) {
		   
            var logJson = {
                type : "",
                value : "",
                description : ""
            };
            packet = new Uint8Array(size);
            stream.ReadBytes(packet, 0, size);
            var oem_token = String.fromCharCode(packet[0], packet[1], packet[2], packet[3], packet[4], packet[5], packet[6]);
            var offset = 8;
            logJson.type = oem_token;
            if (oem_token == 'CTXSRVR') {
                var serverName = "";
                for (var i = offset; (i < packet.length) && (packet[i] != 0 ); i++) {
                    serverName += String.fromCharCode(packet[i]);
                }
                logJson.value = serverName;
                logJson.description = "serverName";
                callBackWrapper.sendSessionInfo(oem_token , serverName);
            } else if (oem_token == 'CTXUSRN') {
                var userName = "";
                for (var i = offset; (i < packet.length) && (packet[i] != 0 ); i++) {
                    userName += String.fromCharCode(packet[i]);
                }

                logJson.value = userName;
                logJson.description = "userName";

            } else if (oem_token == 'CTXDOMN') {
                var domain = "";
                for (var i = offset; (i < packet.length) && (packet[i] != 0 ); i++) {
                    domain += String.fromCharCode(packet[i]);
                }
                logJson.value = domain;
                logJson.description = "domain";
            } else if (oem_token == 'CTXSID ') {
                var sessionId = Convert.ToUTF8FromByteArray(packet, offset, size - offset);
                logJson.value = sessionId;
                logJson.description = "sessionId";
            } else if (oem_token == 'CTXKEY ') {
                var sessionKeyGuid = Convert.ToUTF8FromByteArray(packet, offset, size - offset);
                logJson.value = sessionKeyGuid;
                logJson.description = "sessionKeyGuid";
            } else if (oem_token == 'CTXTYPE') {
                var sessionType = Convert.ToUTF8FromByteArray(packet, offset, size - offset);
                logJson.value = sessionType;
                logJson.description = "sessionType";
            } else if (oem_token == 'CTXVERS') {
                var version = Convert.ToUTF8FromByteArray(packet, offset, size - offset);
                logJson.value = version;
                logJson.description = "vda version";
            } else if (oem_token == 'CTXDG00') {
                var brokerVersion = Convert.ToUTF8FromByteArray(packet, offset, size - offset);
                logJson.value = brokerVersion;
                logJson.description = "brokerVersion";
            } else if (oem_token == 'CTXDG01') {
                var farmId = Convert.ToUTF8FromByteArray(packet, offset, size - offset);
                logJson.value = farmId;
                logJson.description = "farmId";
            } else if (oem_token == 'CTXDG02') {
                var registeredDdcFqdn = Convert.ToUTF8FromByteArray(packet, offset, size - offset);
                logJson.value = registeredDdcFqdn;
                logJson.description = "registeredDdcFqdn";
            } else if (oem_token == 'CTXDG03') {
                var desktopCatalogId = Convert.ToUTF8FromByteArray(packet, offset, size - offset);
                logJson.value = desktopCatalogId;
                logJson.description = "desktopCatalogId";
            } else if (oem_token == 'CTXDG04') {
                var desktopGroupId = Convert.ToUTF8FromByteArray(packet, offset, size - offset);
                logJson.value = desktopGroupId;
                logJson.description = "desktopGroupId";
            }
            
            var logstr = JSON.stringify(logJson);
            
            writeHTML5Log(0,"SESSION:|:ICA:|:WINSTATION:|:SESSIONINFO:|:" + logstr);
			
		
		} else if (command == PacketIdentifier.PACKET_CHANNEL_MONITORING) {
			if (channelMonitor != null)
				channelMonitor.ReadPing(stream, size);
		} else if (command == PacketIdentifier.PACKET_WDCREDENTIALS) {
			packet = new Uint8Array(size);
			stream.ReadBytes(packet, 0, size);
			myself.HandlePacketWDCredentials(packet);
		}

		stream.ResetWrite();

		return processMore;

	};

	var currentCursor = null;

	var gLaunchData = null;

	this.SetLaunchData = function setLaunchData(icaData) {
		gLaunchData = icaData;
	};


	AppendUIData = function appendUIData(encodingType, srcString, desArray, count) {
		var length = 0;

		if (srcString != null) {
			var srcStringLen = srcString.length;
			var minCount = (srcStringLen <= count) ? srcStringLen : count;
			var desArrayLen = desArray.length;

			for (var ind = 0; ind < minCount; ++ind) {
				desArray[desArrayLen++] = srcString.charCodeAt(ind);
				if (encodingType == SupportedEncoding.UNICODE_ENCODING) {
					desArray[desArrayLen++] = srcString.charCodeAt(ind) >> 8;
				}
			}

			length = srcStringLen + 1;
			// The '\0' "null terminates" the string, which is necessary since string
			// lengths are not used when sending the string across the wire.
			desArray[desArrayLen++] = 0;
			if (encodingType == SupportedEncoding.UNICODE_ENCODING) {
				desArray[desArrayLen++] = 0;
			}
		}

		return length;
	};

	
	  
	this.WriteUserInterfaceBody = function writeUserInterfaceBody(offsetableOutputStream, userInterface) {
		var stream = offsetableOutputStream;
		var ui = userInterface;
		var len_module_header = stream.Size(); 	// module header length
		var LEN_UI_C2H_V7 = 59;					// length of V7 UI_C2H structure. We will be using V7. V7 is added in uimodule.js (MODULE_VERSIONH_UNICODE)
		var LEN_UI_C2H_V8 = 60;					// length of V8 UI_C2H structure

		if (gLongFields == true)
			IncreaseFieldLengths();

		var flags = 0;
		if (ui.IsSoundEnabled())
			flags = flags | 0x00001;

		flags = flags | 0x00004;

		// Send UI_C2H_Seamless for App Sessions: Fix BUG0482595
		if(gLaunchData["TWIMode"] === "On")
		{
			flags = flags | 0x00010;
		}

		if(gLaunchData["KeyboardLayout"])
		{
				myself.KeyboardLayout = gLaunchData["KeyboardLayout"];
		}	
		
		ByteWriter.WriteInt32ToStream(stream, flags);
		ByteWriter.WriteInt32ToStream(stream, myself.KeyboardLayout);
          

		var uidata = [];
		var encodingType = ui.GetEncodingType();

		var szDomain = 0, szUsername = 0, szPassword = 0, szClientDir = 0;
		var szWorkDir = 0, szInitProg = 0, szCloudName = 0, szClientName = 0;
		var szClientLic = 0, szLauncher = 0, szVersion = 0;
		var szLaunchRef = 0;

		if (gCredentialsCommand) {
			szDomain = AppendUIData(encodingType, "", uidata, domainLength);
			szUsername = AppendUIData(encodingType, "", uidata, usernameLength);
			szPassword = AppendUIData(encodingType, "", uidata, passwordLength);
		} else {
			var icaDomain = "";
			if (gLaunchData["Domain"]) {
				 icaDomain = gLaunchData["Domain"];
			}
			szDomain = AppendUIData(encodingType, icaDomain, uidata, domainLength);

			var icaUsername = "";
			if (gLaunchData["Username"]) {
				 icaUsername = gLaunchData["Username"];
			}
			szUsername = AppendUIData(encodingType, icaUsername, uidata, usernameLength);

			var icaPassword = "";
			if (gLaunchData["ClearPassword"]) {
				 icaPassword = gLaunchData["ClearPassword"];
			}
			szPassword = AppendUIData(encodingType, icaPassword, uidata, passwordLength);
		}

		szClientDir = AppendUIData(encodingType, ui.GetClientDirectory(), uidata, clientDirLength);
		szWorkDir = AppendUIData(encodingType, "", uidata, workDirLength);

		var icaInitProgram = "";
		if (gLaunchData["InitialProgram"] && gLaunchData["InitialProgram"] != "" && gLaunchData["InitialProgram"] != "#") {
			icaInitProgram = gLaunchData["InitialProgram"];
		} else {
			// TODO ERROR HANDLING Drop a connection if "InitialProgram" is not specified...
			myself.WritePacketTerminateAck();
			myself.EndWriting(null);
			return;
		}
		szInitProg = AppendUIData(encodingType, icaInitProgram, uidata, initialProgLength);

		szCloudName = 0;

		var icaClientName = String("HTML5-Receiver");
		if (gLaunchData["ClientName"]) {
			icaClientName = gLaunchData["ClientName"];
		}
		var versionNo ="5";
		if(gLaunchData["ClientVersion"]){
			versionNo = gLaunchData["ClientVersion"];
		}
		szClientName = AppendUIData(encodingType, icaClientName, uidata, clientNameLength);

		szClientLic = AppendUIData(encodingType, "", uidata, clientNameLength);

		szLauncher = AppendUIData(encodingType, String("ReceiverWeb"), uidata, 256);

		szVersion = AppendUIData(encodingType, versionNo, uidata, 256);

		szLaunchRef = AppendUIData(encodingType, gLaunchData["LaunchReference"], uidata, 256);

		if (encodingType == SupportedEncoding.UNICODE_ENCODING) {
			szDomain *= 2;
			szUsername *= 2;
			szPassword *= 2;
			szClientDir *= 2;
			szWorkDir *= 2;
			szInitProg *= 2;
			szCloudName *= 2;
			szClientName *= 2;
			szClientLic *= 2;
			szLauncher *= 2;
			szVersion *= 2;
			szLaunchRef *= 2;
		}

		var seed = 0;
		var encryptLevel = 0;

		if (gServerLevel != 0) {
			encryptLevel = 1;
			//double bitwise not to floor
			while (seed == 0)
			seed = ~~(Math.random() * 256);
			WdCryptoProvider.LightEncrypt(uidata, seed);
		}

		stream.WriteByte(encryptLevel);

		stream.WriteByte(seed);

		var dataOff = 0;

		stream.WriteByteArrayWithOffset(uidata, dataOff, szDomain);
		dataOff += szDomain;

		stream.WriteByteArrayWithOffset(uidata, dataOff, szUsername);
		dataOff += szUsername;

		stream.WriteByteArrayWithOffset(uidata, dataOff, szPassword);
		dataOff += szPassword;

		stream.WriteByteArrayWithOffset(uidata, dataOff, szClientDir);
		dataOff += szClientDir;

		stream.WriteByteArrayWithOffset(uidata, dataOff, szWorkDir);
		dataOff += szWorkDir;

		stream.WriteByteArrayWithOffset(uidata, dataOff, szInitProg);
		dataOff += szInitProg;

		stream.WriteByte(0);
		stream.WriteByte(0);
		stream.WriteByte(0);
		stream.WriteByte(0);
		stream.WriteByte(0);
		stream.WriteByte(0);

		stream.WriteByteArrayWithOffset(uidata, dataOff, szCloudName);
		dataOff += szCloudName;
		var buildno = 1;
		if(gLaunchData["ClientBuildNumber"]){
			buildno = Math.floor(gLaunchData["ClientBuildNumber"]) & 0xffff;
		}
		ByteWriter.WriteInt16ToStream(stream, buildno);
		stream.WriteByteArrayWithOffset(uidata, dataOff, szClientName);
		dataOff += szClientName;

		if (encodingType == SupportedEncoding.UNICODE_ENCODING) {
			/*
			 * fixedLength is the sum of module header and the length of the UI_C2H structure used.
			 * Here, we are using V7 of the UI module. The fixedLength is used for proper encryption/decryption.
			 */
			var fixedLength = len_module_header + LEN_UI_C2H_V7;
			ByteWriter.WriteInt16ToStream(stream, fixedLength);
		} else {
			/* We currently do not expect ASCII, it may cause error */
			ByteWriter.WriteInt16ToStream(stream, (stream.Size() + 6));
		}

		ByteWriter.WriteInt16ToStream(stream, uidata.length);

		stream.WriteByteArrayWithOffset(uidata, dataOff, szClientLic);
		dataOff += szClientLic;

		if (encodingType == SupportedEncoding.UNICODE_ENCODING) {
			ByteWriter.WriteInt16ToStream(stream, SupportedEncoding.UNICODE_ENCODING);
			ByteWriter.WriteInt16ToStream(stream, 0);
			ByteWriter.WriteInt16ToStream(stream, (myself.KeyboardSubtype & 0x0000ffff));
			var bSubtype = ((myself.KeyboardSubtype & 0xff000000) >>> 24);
			stream.WriteByte(bSubtype);
			stream.WriteByte((myself.KeyboardSubtype & 0x00FF0000) >>> 16);
			ByteWriter.WriteInt16ToStream(stream, 0);
			ByteWriter.WriteInt16ToStream(stream, 0);
		}
		stream.WriteByteArrayWithOffset(uidata, dataOff, szLauncher);
		dataOff += szLauncher;

		stream.WriteByteArrayWithOffset(uidata, dataOff, szVersion);
		dataOff += szVersion;

		/*
		 * Additional variables for V7 of UI_C2H structure neeeds to be included.
		 * LaunchReference is required for workspace control.
		 * 8 corresponds to Preferred Icon Depth. (#define UI_C2H_TWI_ICON_32BPP	(BYTE) 0x10)
		 */
		stream.WriteByte(0x10);
		stream.WriteByteArrayWithOffset(uidata, dataOff, szLaunchRef);
	};

	var buttonUpFilter = 0;
	var waitingX = 0, waitingY = 0, waitingFlags = 0;

	var DOUBLECLICK_WINDOW = 500, DOUBLECLICK_WINLEN = 10;
	var lastButtonTime = new Array(0, 0, 0);
	var lastButtonX = new Array(0, 0, 0);
	var lastButtonY = new Array(0, 0, 0);
	var isButtonDown = new Array(false, false, false);

	var writeVcPacket = function(channel, data, off, len) {		
		virtualWrites.addWrite(channel, data, off, len, myself.ChannelPriorityMap[channel]);

		//For now send it immediately ,currenlty we only have TUI ,see if alter we need to accumulate them and the send them

		sendVirtualWrites();
	};
	this.queueVirtualWrite = writeVcPacket;
	function ignoreWrite(channel, data, off, len){
		console.error("Ignoring virtual channel writes for channel: " + channel + ", of len: " + len);
	}

	this.writeAck = function(channel , windowSize){
		virtualWrites.addAck(channel , windowSize);
		sendVirtualWrites();
	};

	this.Close = function close(level) {
		DisableUserInput();
		if (gPingTimer != null && gPingTimer.IsAlive()) {
			gPingTimer.Stop();
			gPingTimer = null;
		}
		gConnectionOpen = false;
	};

	var IsActionWithinWindow = function isActionWithinWindow(x, y, button) {
		var d = new Date();
		//double bitwise NOT to floor
		var this_instant = ~~(d.valueOf() / 10000);
		var time_lapse = this_instant - lastButtonTime[button];

		return ((time_lapse < DOUBLECLICK_WINDOW) && (lastButtonX[button] - DOUBLECLICK_WINLEN / 2 <= x) && (lastButtonX[button] + DOUBLECLICK_WINLEN / 2 >= x) && (lastButtonY[button] - DOUBLECLICK_WINLEN / 2 <= y) && (lastButtonY[button] + DOUBLECLICK_WINLEN / 2 >= y)
		);
	};

	this.writeEuemRoundTrip = function(dataObj) {
		if(dataObj['isResult']) {
			var currentState = activityFound;
			this.queueVirtualWrite(dataObj['channel'], dataObj['buff'], dataObj['offset'], dataObj['toCopy']);
			activityFound = currentState;
			return;
		}

		var packetQueued = false;
		if(activityFound) {
			this.queueVirtualWrite(dataObj['channel'], dataObj['buff'], dataObj['offset'], dataObj['toCopy']);
			activityFound = false;
			packetQueued = true;
		}
		callBackWrapper.sendRtAckToEuem(packetQueued);
	}
}
