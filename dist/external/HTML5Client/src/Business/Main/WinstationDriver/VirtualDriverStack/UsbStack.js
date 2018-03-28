function UsbStack()
{
    var myself = this;

    var USB_MODULE_PARAMETERS = new VirtualDriverParameter("CTXGUSB", 1, 1, "CTXGUSB", 0x10000); //tbd few things here
    myself.setModuleParameter(USB_MODULE_PARAMETERS);


    this.AddInitResponseData = function (stream)
    {
    };
    /*
    * Get the capability
    */
    this.GetCapabilityList = function ()
    {
        return null;
    };

    this.SetCapabilityList = function (caplist)
    {

    };
}

UsbStack.prototype = new VirtualDriver();