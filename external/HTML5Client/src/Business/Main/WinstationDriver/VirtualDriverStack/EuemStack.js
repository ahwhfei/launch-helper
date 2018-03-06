/**
 * Created by rajasekarp on 14-05-2014.
 */
function EuemStack() {
	var stack = null;
	var processor = null;
	var myself = this;

	var CLIP_MODULE_PARAMETERS = new VirtualDriverParameter("EUEM", 1, 0, "CTXEUEM", 0x500000, SupportedEncoding.UNICODE_ENCODING, 0);
	this.setModuleParameter(CLIP_MODULE_PARAMETERS);

	// VirtualDriver Interface Implementation
	// ======================================
	this.AddInitResponseData = function (stream) {
	};

	/**
	 * Returns the capabilities of a module stored in the objetc CapabilityList.
	 */
	this.GetCapabilityList = function () {
		return null;
	};

	/**
	 * Sets the capabilities of a module stored in the object CapabilityList.
	 */
	this.SetCapabilityList = function (caplist) {

	};
}

EuemStack.prototype = new VirtualDriver();
