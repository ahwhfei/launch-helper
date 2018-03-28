function VdmmStack()
{
	
    var myself = this;

    var RAVE_MODULE_PARAMETERS = new VirtualDriverParameter("Rave", 3 , 0, "CTXMM  "  , 0x2000 ,SupportedEncoding.UNICODE_ENCODING, 0);
	this.setModuleParameter(RAVE_MODULE_PARAMETERS);
	
	    // VirtualDriver Interface Implementation
    // ======================================
    this.AddInitResponseData = function(stream )
    {
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

VdmmStack.prototype = new VirtualDriver();
