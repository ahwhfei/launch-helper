function ThinWireStack() {
    var NORMAL_MODE = 0;
    var DIVERSION_MODE = 1;
    var RECOVERY_MODE = 2;
    var GET_DIVERSION_MODE = 3;

    var CCAPS_4BPP = 0x01;
    var CCAPS_8BPP = 0x02;
    var CCAPS_16BIT = 0x04;
    var CCAPS_24BIT = 0x08;
    var GCAPS_COMPLEX_CURVES = 0x00000001;
    var GCAPS_COMPLEX_CURVES_FILL = 0x00000002;
    var GCAPS_PTRS_ANIMATED = 0x00000004;
    var GCAPS_PTRS_GT_32_BY_32 = 0x00000008;
    var GCAPS_BRUSH_GT_8_BY_8 = 0x00000010;
    var GCAPS_SS_BMP_FILE = 0x00000020;
    var GCAPS_BMPS_PRECACHED = 0x00000040;
    var GCAPS_ROP4_BITBLT = 0x00000080;
    var GCAPS_RES_VARIABLE = 0x00000100;
    var GCAPS_SSB_1BYTE_PP = 0x00000200;
    var GCAPS_PREFER_TW2 = 0x00000800;
	var GCAPS_SUPPORTS_RESTORE_POINTER = 0x00001000;
    var COLOR_CAP_MAX = CCAPS_16BIT | CCAPS_24BIT;
	var DEFAULT_HANDLE_POWER = 14;
    var TW_MAX_DISPLAY_WIDTH = 0x8000;
    var TW_MAX_DISPLAY_HEIGHT = 0x8000;
    var MODULE_HOSTNAME = "VDTW30";
    var SSB_MAX_COUNT = 32;
    var SSB_MAX_POW2 = 16;
    var DISPLAY_MAX_WIDTH = 5120;
    var DISPLAY_MAX_HEIGHT = 4096;
    var UNSUPPORTED_CODEC = 0;
    var JPEG_CODEC = 1;
    var H264_CODEC = 2;
    var THINWIRE_CODEC_GROUP_1_PEGASUS_OP_SE2D = 1; /* Pegasus codec bitmask in Group 1*/
    var THINWIRE_CODEC_GROUP_1_CODEC_2 = 2; /* Available bitmask in Group 1 */
    var THINWIRE_CODEC_GROUP_1_ELEMENTAL_H264 = 4; /* Elemental codec (H264) in Group 1*/
    var THINWIRE_CODEC_GROUP_1_CODEC_4 = 8; /* Available bitmask in Group 1 */
    var THINWIRE_CODEC_GROUP_2_CODEC_1 = 1; /* Available bitmask in Group 2 */
    var THINWIRE_CODEC_GROUP_2_CODEC_2 = 2; /* Available bitmask in Group 2 */
    var THINWIRE_CODEC_GROUP_2_CODEC_3 = 4; /* Available bitmask in Group 2 */
    var THINWIRE_CODEC_GROUP_2_CODEC_4 = 8; /* Available bitmask in Group 2 */
    var THINWIRE_CODEC_GROUP_3_CODEC_1 = 1; /* Available bitmask in Group 3 */
    var THINWIRE_CODEC_GROUP_3_CODEC_2 = 2; /* Available bitmask in Group 3 */
    var THINWIRE_CODEC_GROUP_3_CODEC_3 = 4; /* Available bitmask in Group 3 */
    var THINWIRE_CODEC_GROUP_3_CODEC_4 = 8; /* Available bitmask in Group 3 */
    var THINWIRE_CODEC_GROUP_4_CODEC_1 = 1; /* Available bitmask in Group 4 */
    var THINWIRE_CODEC_GROUP_4_CODEC_2 = 2; /* Available bitmask in Group 4 */
    var THINWIRE_CODEC_GROUP_4_CODEC_3 = 4; /* Available bitmask in Group 4 */
    var THINWIRE_CODEC_GROUP_4_CODEC_4 = 8; /* Available bitmask in Group 4 */
    var TW_MODULE_PARAMETERS = new VirtualDriverParameter("Thinwire", 1, 5, "CTXTW  ", 0x10000);
    this.setModuleParameter(TW_MODULE_PARAMETERS);
    this.SetEncodingType(SupportedEncoding.ASCII_ENCODING);
	var capabilityInfo = [ ];
    this.EndWriting = function endWriting(reason) {
        var data = new Object();
        data.cmd = WorkerCommand.CM_TW2ENDWRITING;
        data.msg = reason;
        self.postMessage(data);
    };

    var colorPref = CCAPS_24BIT;

    var gDisplay = null;
    this.SetDisplay = function setDisplay(icaDisplay) {
        gDisplay = icaDisplay;
		// Set colorPref to 16-bit or 24-bit only as we only support these
		var color = parseInt(gDisplay.color, 10);
		switch (color)
		{
			case CCAPS_16BIT: // upgrade <16 to 16bpp
			case CCAPS_8BPP:
			case CCAPS_4BPP:
				colorPref = CCAPS_16BIT;
				console.log("16-bit color session");
				break;
				
			case CCAPS_24BIT: // default 24bpp
			default:
				colorPref = CCAPS_24BIT;
				console.log("24-bit color session");
				break;
		}
    };
    this.GetHostModuleName = function getHostModuleName() { return MODULE_HOSTNAME; };

    var DefaultLargeCacheSize = function defaultLargeCacheSize(d) {
        var dimProduct = d.Width * d.Height;
        var temp;
		var result = new Int32Array(1);

        if (dimProduct <= 0x01E000) {
            temp = 2.5 * dimProduct + 0.5;
            result[0] = temp > 0x019000 ? temp : 0x019000;
        }
        else if (dimProduct <= 0x03E800) {
            temp = 2 * dimProduct;
            result[0] = temp > 0x04B000 ? temp : 0x04B000;
        }
        else if (dimProduct <= 0x07D000) {
            temp = 1.5 * dimProduct + 0.5;
            result[0] = temp > 0x07D000 ? temp : 0x07D000;
        }
        else {
            result[0] = dimProduct > 0x0BB800 ? dimProduct : 0x0BB800;
        }
        result[0] = (result[0]) & ~0x07FF;

        return result[0];
    };

    this.AddInitResponseData = function addInitResponseData(stream) {
        var capStream = null;
        var largeCacheSize = 0;
        var data = null;

        capStream = new OffsetableOutputStream();

        var res = new Size(gDisplay.width, gDisplay.height);

        largeCacheSize = DefaultLargeCacheSize(res);
        console.warn("TW_STACK: Resolution to VDA ", JSON.stringify(res));
        WriteThinwireCaps(capStream, res, largeCacheSize, colorPref);
        data = capStream.ToByteArray();
        stream.WriteByteArray(data, 0, data.length);
        //double bitwise NOT to floor
        var twTwoCache = ~ ~(largeCacheSize / 4);

        switch (colorPref) {
            case CCAPS_16BIT:
                twTwoCache *= 2;
                break;
            case CCAPS_24BIT:
                twTwoCache *= 3;
                break;
        }
        console.warn("TW_STACK: Max resolution to VDA ", JSON.stringify(res));
        var maxres = new Size(DISPLAY_MAX_WIDTH, DISPLAY_MAX_HEIGHT);
        capStream = new OffsetableOutputStream();
        largeCacheSize = DefaultLargeCacheSize(maxres);


        WriteThinwireCaps(capStream, maxres, largeCacheSize, COLOR_CAP_MAX);
        data = capStream.ToByteArray();
        stream.WriteByteArray(data, 0, data.length);

        WriteThinwireCapsExtra(stream, largeCacheSize, twTwoCache);
        var capabilityList = this.getThinwireCapabilityBlocks(stream);
		ByteWriter.WriteInt16ToStream(stream, capabilityList.length);
        stream.WriteByteArrayWithOffset(capabilityList);

    };

    var WriteThinwireCaps = function writeThinwireCaps(stream, res, largeCache, colorCaps) {
        var version = 2;
        stream.WriteByte(version);
        stream.WriteByte(0);

        ByteWriter.WriteInt16ToStream(stream, 0x008000);
        ByteWriter.WriteInt32ToStream(stream, largeCache);

        var graphicsCaps = GCAPS_COMPLEX_CURVES
                         | GCAPS_PTRS_GT_32_BY_32
                         | GCAPS_PREFER_TW2
		                 | GCAPS_RES_VARIABLE
                         | GCAPS_SUPPORTS_RESTORE_POINTER;

        ByteWriter.WriteInt32ToStream(stream, graphicsCaps);
        ByteWriter.WriteInt16ToStream(stream, colorCaps);
        stream.WriteByte(0);
        stream.WriteByte(0);

        var sizeData = null;
        var sizes;

        sizeData = new ByteArrayOutputStream();
        ByteWriter.WriteInt16ToStream(sizeData, res.Width < TW_MAX_DISPLAY_WIDTH ? res.Width : TW_MAX_DISPLAY_WIDTH);
        ByteWriter.WriteInt16ToStream(sizeData, res.Height < TW_MAX_DISPLAY_HEIGHT ? res.Height : TW_MAX_DISPLAY_HEIGHT);
        sizes = sizeData.ToByteArray();
        stream.WriteByteArrayWithOffset(sizes);
        ByteWriter.WriteInt16ToStream(stream, 1);
    };

    var WriteThinwireCapsExtra = function writeThinwireCapsExtra(stream, largeCache, twTwoCache) {
        for (var i = 0; i < 36; ++i)
            stream.WriteByte(0);

        ByteWriter.WriteInt32ToStream(stream, 0x008000); 			// for WinAdmin (small cache size is fixed)
        ByteWriter.WriteInt32ToStream(stream, largeCache);      	// for WinAdmin
        ByteWriter.WriteInt32ToStream(stream, 0); 				// for WinAdmin (cacheXMS)
        ByteWriter.WriteInt32ToStream(stream, 0); 				// for WinAdmin(cacheDASD)

        ByteWriter.WriteInt32ToStream(stream, 0);               	// DimCacheSize
        ByteWriter.WriteInt32ToStream(stream, 0);               	// DimBitmapMin
        ByteWriter.WriteInt32ToStream(stream, 0);               	// DimSignatureLevel (0 at present)
        ByteWriter.WriteInt32ToStream(stream, 8); 				// DimFileSysOverhead

        var cachePower = 1;
        if (twTwoCache > 1) {
            for (var c = twTwoCache; c > 0; c = c >> 1) {
                ++cachePower;
            }
        }
        else {
            // In case our calculation for cache has overflowed.
            // I would expect the largest array size to be 2**32,
            // but as we allow a bit extra for object overflow,
            // we decrease by a power of two, giving us a cache
            // of size 2**31 + maxObjSize.
            // If this branch is taken, then Java better have been
            // started with a really big maximum heap size.
            cachePower = 31;
        }

        // We should probably make the max object size depend on the cache size,
        // but this is the calculation currently used by the C client.
        var maxObjSize = 0;
        var dummy = (1 << cachePower) / 12;
        if (dummy < 0) {
            maxObjSize = Math.ceil(dummy);
        }
        else {
            //double bitwise not to floor
            maxObjSize = ~ ~(dummy);
        }

        stream.WriteByte(cachePower & 0xFF);
        stream.WriteByte(0);  // Pad..

        // Handle power, allow an average item size of 128 bytes. (This could be optimised.)
        stream.WriteByte(DEFAULT_HANDLE_POWER);
        stream.WriteByte(0); 	// Pad..

        // Write maxObjSize as long:
        ByteWriter.WriteInt32ToStream(stream, maxObjSize);

        // Use the same value for minimum cache object size in TW2 as in TW1.
        ByteWriter.WriteInt32ToStream(stream, 0);
    };

    this.reWriteThinwireCaps = function (capsStream, res, color) {
        var largeCacheSize = DefaultLargeCacheSize(res);
        WriteThinwireCaps(capsStream, res, largeCacheSize, color);
    };

    this.isCapabilityAvailable = function (capID) {
    	  for(var key in capabilityInfo){
       		if(capabilityInfo.hasOwnProperty(key)){
       			var capsGroup = capabilityInfo[key];
       			if(capsGroup.capsArray){
       				var capsArray = capsGroup.capsArray;
       				for(var i = 0 ; i < capsArray.length ; i++){
       					if(capsArray[i].id == capID){
       						return true;
       					}
       				}
       			}
       		}
       }
        return false;
    };

    var Tw2Capability = function tw2Capability(number, parameter) {
        var NO_DATA = [];
        this.id = number;

        if (arguments.length != 2)
            parameter = NO_DATA;

        this.WriteTo = function writeTo(outs) {
            ByteWriter.WriteInt16ToStream(outs, parameter.length + 4);
            ByteWriter.WriteInt16ToStream(outs, number);
            outs.WriteByteArray(parameter, 0, parameter.length);
        };
    };
    this.Tw2Capability = Tw2Capability;

    function ThinwireCodecs() {
        this.group1 = 0;
        this.group2 = 0;
        this.group3 = 0;
        this.group4 = 0;
        this.size = 4; //Sizeof this struct

    }

    function Bitmap_supportsEncodedType(type) {
        var rvalue = false;
        if (type == H264_CODEC) {
            rvalue = true;
        }
        return rvalue;
    }

    function InitThinwireCodecs() {

        var thinwireCodecs = new ThinwireCodecs();
        /* Elemental Codec*/
        if (Bitmap_supportsEncodedType(H264_CODEC)) {
            thinwireCodecs.group1 |= THINWIRE_CODEC_GROUP_1_ELEMENTAL_H264;
            // thinwireCodecs.group1 |= THINWIRE_CODEC_GROUP_1_CODEC_2;
            // thinwireCodecs.group1 |= THINWIRE_CODEC_GROUP_1_PEGASUS_OP_SE2D;
        }
        /* Add Capability only if the Client Supports an Advanced Codec */
        if (thinwireCodecs.group1 || thinwireCodecs.group2 || thinwireCodecs.group3 || thinwireCodecs.group4) {
            var capsData = new Uint8Array(thinwireCodecs.size);
            var offset = 0;
            capsData[offset++] = thinwireCodecs.group1;
            capsData[offset++] = thinwireCodecs.group2;
            capsData[offset++] = thinwireCodecs.group3;
            capsData[offset++] = thinwireCodecs.group4;
        }
        return new Tw2Capability(ThinWireStack.TW2_CAPID_THINWIRE_CODECS, capsData);
    }
	
    var h264Capabilities = [];
    var tw2fullModeCapability = [];
									
	var twConfigCaps = (function() {
        // setup default
        var defTwCaps = {
            jpegEnabled: true,
            h264Enabled: true,
            losslessOverlays: true,
            dirtyRegions: true,
            yuv444Support: false,
            avoidCache: true,
            selectiveH264: true,
            multimonitor: false
        };

        // sanity check
        if (!HTML5_CONFIG || !HTML5_CONFIG['features'] || !HTML5_CONFIG['features']['graphics']) {
            console.info("TW_STACK: return default twCaps");
            return defTwCaps;
        }

        var graphics = HTML5_CONFIG['features']['graphics'];

        // jpeg disabled?
        if (graphics['jpegSupport'] == false) {
            defTwCaps.jpegEnabled = false;
        }

        if (graphics['avoidCache'] === false) {
            defTwCaps.avoidCache = false;
        }

        // For MM config use displayDetails.useAllMyMonitors value as it
        // is the final value overriden based on local pref
        var displayDetails = UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation);
        if (displayDetails && displayDetails.useAllMyMonitors) {
            defTwCaps.multimonitor = displayDetails.useAllMyMonitors;
        }

        if (graphics['selectiveH264'] === false) {
            defTwCaps.selectiveH264 = false;
        }

        // h264 disabled?
        var h264Sup = graphics['h264Support'];
        if (h264Sup && (typeof h264Sup === 'object')) {
            // check separate caps
            if (h264Sup['enabled'] == false) {
                defTwCaps.h264Enabled = false;
            }
            if (h264Sup['losslessOverlays'] == false) {
                defTwCaps.losslessOverlays = false;
            }
            if (h264Sup['dirtyRegions'] == false) {
                defTwCaps.dirtyRegions = false;
            }
            if (h264Sup['yuv444Support'] == true) {
                defTwCaps.yuv444Support = true;
            }
        }

        return defTwCaps;
    })();

    function getMultimonitorCapability(callback) {
        // Append monitor info capability when multimonitor configuration is set to true
        if (twConfigCaps.multimonitor === true) {
            UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation, function (displayDetails) {            
                var mmBuffer;
                mmBuffer = constructMultiMonitorCapabilityBuffer(displayDetails);
                callback(mmBuffer);
            });
        }
    }

	function SetupTWCaps(config) {
        getMultimonitorCapability(function(mmBuffer){
            addToCapabilityInfo('multimonitor', new Tw2Capability(ThinWireStack.TW2_CAPID_MONITOR_INFO, mmBuffer), true);
        });
        
        // TODO: Mode update style capability and the flag should be set only if monitor info update command is guranteed to 
        // send exact monitor resolution and details as well as the server supports this capability.
        // For now this capability will not be sent to force update the monitor information in server (fix: RFHTMCRM-1118)
        // Ideally the following should be done to handle this capability
        //  1. Check if the capability supported by server in tw2capability on tw init command
        //  2. If async monitor info in retrived then send required capability in c2s_capability_update command and
        //  3. Send session res, color depth, origin and mon res info in c2s_monitor_info command, set the mode update style flag appropriately
        //  4. If, intended to send monitor info sync in c2s_cap_update command itself, then it may be inappropriate to share the monitor details
        //     twice in cs2_update and c2s_monitor_info command. So, either clear the mode update style flag or remove this capability itself in 
        //     c2s_capability_update command.
        //
        // addToCapabilityInfo('compatibleMode' , new Tw2Capability(ThinWireStack.TW2_CAPID_MODE_UPDATE_STYLE,[1,0,0,0]), true);
		addToCapabilityInfo('compatibleMode' , new Tw2Capability(ThinWireStack.TW2_CAPID_NEWCODEC), true);
		addToCapabilityInfo('compatibleMode' ,new Tw2Capability(ThinWireStack.TW2_CAPID_PALNOREDRAW), true);
		addToCapabilityInfo('compatibleMode' ,new Tw2Capability(ThinWireStack.TW2_CAPID_CAPABILITIES_UPDATE), true);
		addToCapabilityInfo('compatibleMode' ,new Tw2Capability(ThinWireStack.TW2_CAPID_END_OF_FRAME), true);
		addToCapabilityInfo('compatibleMode' ,new Tw2Capability(ThinWireStack.TW2_CAPID_ENHANCED_MODE_CHANGE), true);
		addToCapabilityInfo('compatibleMode' ,new Tw2Capability(ThinWireStack.TW2_CAPID_FRAME_METRICS, [ThinWireStack.EUEM_TRIGGER_FLAG |
																			  ThinWireStack.FIRST_GDI_DRAW_FLAG |
																			  ThinWireStack.FRAME_CUT_FLAG |
																			  ThinWireStack.SEND_TO_WD_FLAG |
																			  ThinWireStack.SEND_TO_WD_FLAG, 0]), true);
        // TODO: get actual width, height and number of concurrent h264 decoding and set it.
        if (config.selectiveH264) {
            addToCapabilityInfo('compatibleMode', new Tw2Capability(ThinWireStack.TW2_CAPID_PARTIAL_SCREEN_VIDEO_CODEC, [1, 0, 0x07, 0x80, 0x04, 0x38]), true);            
        }

		if (config.avoidCache) {
            addToCapabilityInfo('compatibleMode', new Tw2Capability(ThinWireStack.TW2_CAPID_AVOID_CACHE), true);            
        }
		        
		if (config.jpegEnabled == true) {
			addToCapabilityInfo('jpeg' ,new Tw2Capability(ThinWireStack.TW2_CAPID_JPEGCODEC), true);
		}
		
		// H264 caps
		UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation, function (data) {
            if (config.h264Enabled == true ) { //&& !(data.multimonitor == true)) {
                addToCapabilityInfo('h264Mode', new InitThinwireCodecs(), true);
                addToCapabilityInfo('h264Mode', new Tw2Capability(ThinWireStack.TW2_CAPID_ATOMIC_FRAME_DISPLAY), true);
                addToCapabilityInfo('h264Mode', new Tw2Capability(ThinWireStack.TW2_CAPID_H264_MODE_CHANGE), true);
                addToCapabilityInfo('h264Mode', new Tw2Capability(ThinWireStack.TW2_CAPID_H264_PROFILE_SUPPORT, [1, 0, 1, 0]), true);
                addToCapabilityInfo('h264Mode',	new Tw2Capability(ThinWireStack.TW2_CAPID_CLIENT_FPS_LIMIT), true);
                                        
                // h264 with lossless overlays, enable text tracking
                if (config.losslessOverlays == true) {
                    addToCapabilityInfo('h264Mode',	new Tw2Capability(ThinWireStack.TW2_CAPID_THINWIRE_PROFILE, [3 , 0 , 0 , 0]), true);
                    addToCapabilityInfo('h264Mode',	new Tw2Capability(ThinWireStack.TW2_CAPID_TEXT_TRACKING, [0, 0]), true);
                } else {
                    addToCapabilityInfo('h264Mode',	new Tw2Capability(ThinWireStack.TW2_CAPID_THINWIRE_PROFILE, [2 , 0 , 0 , 0]), true);
                }
                // dirty rects
                if (config.dirtyRegions == true) {
                    addToCapabilityInfo('h264Mode',	new Tw2Capability(ThinWireStack.TW2_CAPID_IMAGE_DIRTY_REGION, [0]), true);
                    // Server sends incorrect data when colorformat is set without dirty region cap
                    if (config.yuv444Support == true) {
                        // add 420 and 444
                        addToCapabilityInfo('h264Mode',	new Tw2Capability(ThinWireStack.TW2_CAPID_H264_COLOR_FORMAT, [5, 0]), true);
                    }
                }
            }
		});
	}
	
	SetupTWCaps(twConfigCaps);

	this.setRenderCaps = function (flags) {
		if((flags & RENDERMODE.H264) !== 0 )
		{
			updateCapabilityInfo('h264Mode', true);
		}else{
			updateCapabilityInfo('h264Mode', false);
		}
	};
	function addToCapabilityInfo(identifier, caps, valid){
        if(!capabilityInfo[identifier]){
			capabilityInfo[identifier] = { 
			 valid : false,
			 capsArray : [ ]	
			};
		}
		if(identifier == 'multimonitor'){
		  capabilityInfo[identifier].capsArray = [];
		}
		capabilityInfo[identifier].capsArray.push(caps);
		capabilityInfo[identifier].valid = valid;
	}
	function updateCapabilityInfo(identifier , valid){
		if(valid != null){
			if(capabilityInfo[identifier]){
				capabilityInfo[identifier].valid = valid;
			}
		}
	}
    var EncodeCapabilities = function encodeCapabilities( ) {
      //console.log('Encode caps ',capabilityInfo);
       var outs = new ByteArrayOutputStream();
       var length = 0;
       UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation, function(data){
         var h264shouldBeDisabled = data.multimonitor;
         //console.log('caps sent to server are ->');
         for(var key in capabilityInfo){
           if(key == 'h264Mode' && h264shouldBeDisabled == true){
             //do not send h264 capability to server
             continue;
           }
         		if(capabilityInfo.hasOwnProperty(key) && capabilityInfo[key].valid == true){
         		  //console.log(key);
         			var capsGroup = capabilityInfo[key];
         			if(capsGroup.valid == true && capsGroup.capsArray){
         				var capsArray = capsGroup.capsArray;
         				for(var i = 0 ; i < capsArray.length ; i++){
         					capsArray[i].WriteTo(outs);
         					length++;
         				}
         			}
         		}
         }
       });
       return {buffer : outs.ToByteArray() , nrCaps : length};
    };

    
    this.getThinwireCapabilityBlocks = function() {
        var capabilityListStream = new OffsetableOutputStream();
        capabilityListStream.WriteByte(0);
        var tw2CapabilitiesBlock = EncodeCapabilities( );
        capabilityListStream.WriteByte(tw2CapabilitiesBlock.nrCaps);
        capabilityListStream.WriteByteArrayWithOffset(tw2CapabilitiesBlock.buffer, 0, tw2CapabilitiesBlock.buffer.length);
        var capabilityList = capabilityListStream.ToByteArray();
     
        return capabilityList;
    };
    
    //TODO check why is this required
    /*this.getMonitorLayoutInfo = function( ){
    	return monitorInfo.getData( );
    };*/
	
	function constructMultiMonitorCapabilityBuffer (displayDetails) {
        var monitorData = displayDetails.displayInfo;
        var monitorCount = monitorData.length;
        var size = 8 + monitorCount * 16;
        var buffer = new Uint8Array(size);
        var offset = 0;
        
        var primaryMonitor = displayDetails.multimonitor? displayDetails.primaryMonitor : 0;
        
        offset = Utility.WriteInt4(buffer, offset, size);
        offset = Utility.WriteByte(buffer, offset, monitorCount);
        offset = Utility.WriteByte(buffer, offset, primaryMonitor);//primary monitor
        offset = Utility.WriteByte(buffer, offset, 0);//preferred launch monitor
        offset = Utility.WriteByte(buffer, offset, 0);//flags
        //we need to send top, left, right, bottom as bounds instead of top, left, width, height
        //console.info("TW_STACK: Multimonitor data construct for VDA. Monitors : " + monitorCount + ", Primary : " + primaryMonitor);
        for (var i = 0; i < monitorCount; i++) {
            var twRectBound = Utility.convertBoundsToRect(monitorData[i].bounds);
            offset = Utility.WriteInt2(buffer, offset, twRectBound.left);
            offset = Utility.WriteInt2(buffer, offset, twRectBound.top);
            offset = Utility.WriteInt2(buffer, offset, twRectBound.right);
            offset = Utility.WriteInt2(buffer, offset, twRectBound.bottom);
            var twRectWorkArea = Utility.convertBoundsToRect(monitorData[i].workArea);//for unified desktop mode, sending all values in +ve coordinates
            offset = Utility.WriteInt2(buffer, offset, twRectWorkArea.left);
            offset = Utility.WriteInt2(buffer, offset, twRectWorkArea.top);
            offset = Utility.WriteInt2(buffer, offset, twRectWorkArea.right);
            offset = Utility.WriteInt2(buffer, offset, twRectWorkArea.bottom);
			// TODO: log added for debug purpose. remove it later or move it to
			// log file.
            //console.info("TW_STACK: Display " + i + " : bounds : " + JSON.stringify(twRectBound) + ", workArea : " + JSON.stringify(twRectWorkArea));
        }

        return buffer;
	}

    this.setMonitorInfo = function(){
        getMultimonitorCapability(function(mmBuffer){
            addToCapabilityInfo('multimonitor', new Tw2Capability(ThinWireStack.TW2_CAPID_MONITOR_INFO, mmBuffer), true);
        });
    };

    this.getMultimonitorCapability = getMultimonitorCapability;
}

ThinWireStack.prototype = new VirtualDriver();

