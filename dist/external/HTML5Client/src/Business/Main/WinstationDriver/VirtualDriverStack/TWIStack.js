function TWIStack()
{
	  var stack = null;
    var processor = null;
    var myself = this;

    var TWI_MODULE_PARAMETERS = new VirtualDriverParameter("Transparent Windowing", 1, 1, "CTXTWI\0", 0x2000);
	this.setModuleParameter(TWI_MODULE_PARAMETERS);
	
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
        var clist = new CapabilityList();
        clist.AddCapability(new SeamlessCap(0xFFFFFFFF));
        return clist;
    };

    /**
     * Sets the capabilities of a module stored in the object CapabilityList.
     */
    this.SetCapabilityList = function(caplist)
    {
        var sc = caplist.GetCapability(Capability.WD_CAP_ID_SEAMLESS);
    };


}

TWIStack.prototype = new VirtualDriver();
