function SCardStack() {
    var stack = null;
    var processor = null;
    var myself = this;
    this.flowType = VirtualDriver.VD_FLOW_ACK;
    //var FILE_MODULE_PARAMETERS = new VirtualDriverParameter("File", 1, 2, "CTXFILE", 2048, // stream size to make sure
    //SupportedEncoding.UNICODE_ENCODING, 0);

    var SCARD_MODULE_PARAMETERS = new VirtualDriverParameter("SCard", 1, 1, "CTXSCRD", 0x2000,
        SupportedEncoding.UNICODE_ENCODING, 0);
    this.setModuleParameter(SCARD_MODULE_PARAMETERS);

    // VirtualDriver Interface Implementation
    // ======================================
    this.AddInitResponseData = function(stream) {
    };

    this.GetCapabilityList = function getCapabilityList() {
        return null;
    };
    this.SetCapabilityList = function setCapabilityList(capList) {
    };
    this.getMaxWindowSize2 = function() {
        return 62500;
    };
    this.getMaxWindowSize = function() {
        return 2048;
    };
    this.getWindowSize2 = function() {
        return 4102;
    };
    this.getWindowSize = function() {
        return 1024;
    };
}

SCardStack.prototype = new VirtualDriver();
