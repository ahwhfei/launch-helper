function CustomVCStack(vcInfo) {	
	//Will add the methods of VirtualDriver class to the CustomVCStack object creation
	VirtualDriver.call(this);
	var packet = vcInfo && vcInfo["driverInfo"] && vcInfo["driverInfo"]["packet"];
	var initResponseData = (packet && packet["length"]) ? new Uint8Array(packet["length"]) : null;
	var streamSize = 2048;
	var streamName = vcInfo["streamName"];
	
	var CTL_MODULE_PARAMETERS = new VirtualDriverParameter(vcInfo["description"], vcInfo["minVersion"], vcInfo["maxVersion"], vcInfo["streamName"], streamSize,SupportedEncoding.UNICODE_ENCODING, 0);
	this.setModuleParameter(CTL_MODULE_PARAMETERS);

	// VirtualDriver Interface Implementation
	// ======================================
	this.AddInitResponseData = function(stream) {
		try{
			if(packet && packet["length"]>0){
				//Copies the data from the buffer and write to the stream.
				Utility.CopyArray(packet["data"], packet["offset"], initResponseData, 0, packet["length"]);	
				stream.WriteByteArray(initResponseData, 0, initResponseData["length"]);
			}
		}catch(ex){
			console.log("Exception in AddInitResponseData for custom VC : " + streamName);
			console.log("Exception Details custom VC : " , ex);
		}
	};

	this.GetCapabilityList = function getCapabilityList() {
		return null;
	};
	this.SetCapabilityList = function setCapabilityList(capList) {
	};
}

CustomVCStack.prototype.constructor = CustomVCStack;