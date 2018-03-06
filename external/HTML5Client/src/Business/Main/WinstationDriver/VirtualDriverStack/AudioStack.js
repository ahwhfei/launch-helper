function AudioStack()
{
    var MAX_DATA_SIZE = audio_MAX_DATA_SIZE ;
    var CAM_FLOW_CONTROL_VERSION = 1; 
    var CAM_MIN_VERSION = 1;
    var CAM_MAX_VERSION = 1;
    
    if (HTML5Interface.ChromeNacl.isFeatureEnabled("audio")) {
        CAM_MAX_VERSION = 2;
    }
    
	// TODO: pick min max versions dynamically
    var AU_MODULE_PARAMETERS     = new VirtualDriverParameter("Audio", CAM_MIN_VERSION, CAM_MAX_VERSION, "CTXCAM ", 0x1000 );
	this.setModuleParameter( AU_MODULE_PARAMETERS );
	var VDCAM_CAP_AUDIO_INPUT = 0x01;
	
	    // VirtualDriver Interface Implementation
    // ======================================
    this.AddInitResponseData = function(stream )
    {
        ByteWriter.WriteInt16ToStream(stream, MAX_DATA_SIZE);
        stream.WriteByte(CAM_FLOW_CONTROL_VERSION);
        
        if (HTML5Interface.ChromeNacl.isFeatureEnabled("audio")) {
            var caps = 0;
            caps |= VDCAM_CAP_AUDIO_INPUT;
            ByteWriter.WriteInt32ToStream(stream, caps);
        }
    };
	
	  /**
     * Returns the capabilities of a module stored in the objetc CapabilityList.
     */
    this.GetCapabilityList = function()
    {
        return null ;
    };

    /**
     * Sets the capabilities of a module stored in the object CapabilityList.
     */
    this.SetCapabilityList = function(caplist)
    {
       
    };


}

AudioStack.prototype = new VirtualDriver();
