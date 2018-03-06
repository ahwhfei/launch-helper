var ThinwireProfile = Object.freeze(
    {
        Full: 0,
        Reduced: 1,
        H264: 2,
        H264PlusLossless: 3
    });

var Tw2Capabilities = (function () {
    var LOGGER = "TW" + "_" + "CAP" + ": ";

    function Tw2Capabilities() {
		this.jpegSupport = false;
        this.capUpdateSupport = false;
        this.endOfFrameSupport = false;
        this.thinwireProfile = ThinwireProfile.Full;
        this.fpsLimitSupport = false;
        this.enhanceMode = false;
        this.dirtyRegions = false;
        this.h264ColorFormat = false;
        this.avoidCache = false;
        this.selectiveH264 = false;
        this.multimonitor = false;
    }

    Tw2Capabilities.parse = function (capList, twInfo) {
        var caps = new Tw2Capabilities();
            caps.twType = "TwFull"
        var offset = 1 + 1;//more Data + count + capOffset
        offset = (capList[offset + 1] << 8) | capList[offset];
        while (offset + 2 < capList.length) {
            var len = (capList[offset + 1] << 8) | capList[offset];
            var capId = (capList[offset + 3] << 8) | capList[offset + 2];
            switch (capId) {
                case ThinWireStack.TW2_CAPID_CAPABILITIES_UPDATE:
                    caps.capUpdateSupport = true;
                    break;
                case ThinWireStack.TW2_CAPID_END_OF_FRAME:
                    caps.endOfFrameSupport = true;
                    break;
				case ThinWireStack.TW2_CAPID_JPEGCODEC:
					caps.jpegSupport = true;
					break;
                case ThinWireStack.TW2_CAPID_THINWIRE_PROFILE:
                    var mode = (capList[offset + 5] << 8) + capList[offset + 4];
                    switch (mode) {
                        case 1: // THINWIRE_PROFILE_REDUCED
                            caps.thinwireProfile = ThinwireProfile.Reduced;
                            break;
                        case 2: //THINWIRE_PROFILE_H264
                            caps.thinwireProfile = ThinwireProfile.H264;
                            caps.twType = "H264"
                            break;
                        case 3: //THINWIRE_PROFILE_H264_WITH_LOSSLESS_OVERLAYS
                            caps.thinwireProfile = ThinwireProfile.H264PlusLossless;
                            caps.twType = "H264+LL"
                            break;
                        default:
                            caps.thinwireProfile = ThinwireProfile.Full;
                            break;
                    }
                    break;
                case ThinWireStack.TW2_CAPID_CLIENT_FPS_LIMIT:
                    caps.fpsLimitSupport = true;
                    break;
                case ThinWireStack.TW2_CAPID_ENHANCED_MODE_CHANGE:
                	caps.enhanceMode = true;
                	break;
                case ThinWireStack.TW2_CAPID_IMAGE_DIRTY_REGION:
                    caps.dirtyRegions = true;                  
                    break;
                case ThinWireStack.TW2_CAPID_H264_COLOR_FORMAT:
                    caps.h264ColorFormat = true;
                    break;
                case ThinWireStack.TW2_CAPID_AVOID_CACHE:
                    caps.avoidCache = true;
                    break;                        
                case ThinWireStack.TW2_CAPID_MONITOR_INFO:
                        caps.multimonitor = true;
                        if (len > 4) {
                            offset = offset + 4;
                            len = len - 4;
                            
                            //monitorLayoutInfo.hdrSize = capList[offset] uint32 - 
                            offset = offset + 4;
                            len = len - 4;
                            
                            twInfo.caps.monitorInfo.numMonitors = capList[offset++];
                            twInfo.caps.monitorInfo.primaryMonitor = capList[offset++];
                            len = len - 2;
                            
                            //
                            offset = offset + 2;    // for preferred launch monitor - 1byte and MmFlags - 1byte
                            len = len - 2;  
                            
                            //twInfo.caps.monitorInfo.monitors = new Array(twInfo.caps.monitorInfo.numMonitors);
                            for (var mons = 0; mons < twInfo.caps.monitorInfo.numMonitors; mons++) {
                                var left = capList[offset + 1] << 8 | capList[offset]; offset = offset + 2;
                                var top = capList[offset + 1] << 8 | capList[offset]; offset = offset + 2;
                                var right = capList[offset + 1] << 8 | capList[offset]; offset = offset + 2;
                                var bottom = capList[offset + 1] << 8 | capList[offset]; offset = offset + 2;
                                
                                var wleft = capList[offset + 1] << 8 | capList[offset]; offset = offset + 2;
                                var wtop = capList[offset + 1] << 8 | capList[offset]; offset = offset + 2;
                                var wright = capList[offset + 1] << 8 | capList[offset]; offset = offset + 2;
                                var wbottom = capList[offset + 1] << 8 | capList[offset]; offset = offset + 2;
                                len = len - 16;
                                
                                twInfo.caps.monitorInfo.monitors[mons] = {
                                    rect: { 
                                        'left' : left,
                                        'top' : top,
                                        'right' : right,
                                        'bottom' : bottom
                                    },
                                    workArea : {
                                        'left' : wleft,
                                        'top' : wtop,
                                        'right' : wright,
                                        'bottom' : wbottom
                                    } 
                                }
                                
                            }
                            
                            
                        }                    
                    break;
                case ThinWireStack.TW2_CAPID_PARTIAL_SCREEN_VIDEO_CODEC:
                    caps.selectiveH264 = true;
                    break;
                default:
                    break;
            }
            offset += len;
        }
           
        Profiler.Ui.update("TwCap_Profile", caps.twType);
        Profiler.Ui.update("TwCap_UpdateCaps", caps.capUpdateSupport);
        Profiler.Ui.update("TwCap_EndofFrame", caps.endOfFrameSupport);
        Profiler.Ui.update("TwCap_JpegCodec", caps.jpegSupport);
        Profiler.Ui.update("TwCap_ClientFpsLimit", caps.fpsLimitSupport);
        Profiler.Ui.update("TwCap_EnhancedMode", caps.enhanceMode);
        Profiler.Ui.update("TwCap_DirtyRect", caps.dirtyRegions);
        Profiler.Ui.update("TwCap_H264ColorFmt", caps.h264ColorFormat);
        Profiler.Ui.update("TwCap_AvoidCache", caps.avoidCache);
        Profiler.Ui.update("TwCap_MultiMon", caps.multimonitor);
        Profiler.Ui.update("TwCap_SelectiveH264", caps.selectiveH264);
		CEIP.add('graphics:caps:profile',caps.twType);
		CEIP.add('graphics:caps:jpeg',caps.jpegSupport);
		CEIP.add('graphics:caps:enhancedMode',caps.enhanceMode);
		CEIP.add('graphics:caps:dirtyRect',caps.dirtyRegions);
		CEIP.add('graphics:caps:avoidCache',caps.avoidCache);
		CEIP.add('graphics:caps:selectiveH264',caps.selectiveH264);
        writeHTML5Log(0, LOGGER + "Type " + caps.twType + ", " + "JpgSupport " + caps.jpegSupport + ", " +
                        "capsUpdate " + caps.capUpdateSupport + ", enhanceMode " + caps.enhanceMode + ", " +
                        "DirtyRegions " + caps.dirtyRegions + ", " + "H264ColorFormat " + caps.h264ColorFormat + 
                        "AvoidCache " + caps.avoidCache + ", " + "multimonitorSupport " + caps.multimonitor +
						"selectiveH264 " + caps.selectiveH264);
        return caps;
    };

    return Tw2Capabilities;
})();