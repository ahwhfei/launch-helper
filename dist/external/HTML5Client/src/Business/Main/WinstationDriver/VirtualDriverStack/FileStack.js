function FileStack() {
	var stack = null;
	var processor = null;
	var myself = this;

	var FILE_MODULE_PARAMETERS = new VirtualDriverParameter("File", 1, 2, "CTXFILE", 2048, // stream size to make sure
	SupportedEncoding.UNICODE_ENCODING, 0);
	this.setModuleParameter(FILE_MODULE_PARAMETERS);

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

FileStack.prototype = new VirtualDriver();
