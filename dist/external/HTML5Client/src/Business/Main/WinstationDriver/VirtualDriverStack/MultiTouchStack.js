function MultiTouchStack()
{
	var stack = null;
    var processor = null;
    var myself = this;

    var MULTITOUCH_MODULE_PARAMETERS = new VirtualDriverParameter("MultiTouch", 1, 0, "CTXMTCH"  , 0x2000);
	this.setModuleParameter(MULTITOUCH_MODULE_PARAMETERS);
	
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

MultiTouchStack.prototype = new VirtualDriver();
