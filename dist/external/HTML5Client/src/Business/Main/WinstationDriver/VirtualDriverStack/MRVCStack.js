function MRVCStack() {
	var stack = null;
	var processor = null;
	var myself = this;

	var CTL_MODULE_PARAMETERS = new VirtualDriverParameter("mobile", 1, 2, "CTXMOB", 2048, // stream size to make sure
	SupportedEncoding.UNICODE_ENCODING, 0);
	this.setModuleParameter(CTL_MODULE_PARAMETERS);

	// VirtualDriver Interface Implementation
	// ======================================
	this.AddInitResponseData = function(stream) {
	};

	this.GetCapabilityList = function getCapabilityList() {
		return null;
	};
	this.SetCapabilityList = function setCapabilityList(capList) {
	};
}

MRVCStack.prototype = new VirtualDriver();
