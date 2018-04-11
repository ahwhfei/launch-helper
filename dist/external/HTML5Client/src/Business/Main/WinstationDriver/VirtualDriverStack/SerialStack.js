function SerialStack() {
	
	var minimumVersion = 4;
    var maximumVersion = 7;
//	var VDCPM_CAPABILITY_PDF_PRINT_BIT =0x8000;  /* Client supports unbound PDF printers*/
    this.flowType = VirtualDriver.VD_FLOW_ACK;
    var PR_MODULE_PARAMETERS = new VirtualDriverParameter("Serial", minimumVersion, maximumVersion, "CTXCCM ", 0x1000, SupportedEncoding.ASCII_ENCODING, 0);
    this.setModuleParameter(PR_MODULE_PARAMETERS);

    this.AddInitResponseData = function (stream) {
        var flags = 0;
        stream.WriteByte(0); // LPT mask
        stream.WriteByte(0); // COM mask
        ByteWriter.WriteInt16ToStream(stream, SupportedEncoding.ASCII_ENCODING); // encoding type
        ByteWriter.WriteInt16ToStream(stream, 0);                // encoding data
      //  flags |=VDCPM_CAPABILITY_PDF_PRINT_BIT;// capability flags
        ByteWriter.WriteInt16ToStream(stream, flags);
    };

    this.GetCapabilityList = function () {
        return null;
    };

    this.SetCapabilityList = function (capList) {

    };
    this.getMaxWindowSize2 = function () {
        return 62500;
    };
    this.getMaxWindowSize = function () {
        return 2048;
    };
    this.getWindowSize2 = function () {
        return 4102;
    };
    this.getWindowSize = function () {
        return 1024;
    };
}
SerialStack.prototype = new VirtualDriver();
