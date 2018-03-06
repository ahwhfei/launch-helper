function VirtualDriverParameter(displayName, minVersion, maxVersion, streamName, streamSize) {
    this.StreamName = streamName;
    this.StreamSize = streamSize;
    this.Parameter = new ModuleParameter(displayName, UIModule.VIRTUAL_DRIVER, minVersion, maxVersion, null, "ICA", 0);
}

function VirtualDriver() {
    var charEncoding = SupportedEncoding.ASCII_ENCODING;
    var moduleParameter = null;

    this.GetVersionH = function getVersionH() { return moduleParameter.Parameter.MaxVersion; };
    this.GetVersionL = function getVersionL() { return moduleParameter.Parameter.MinVersion; };
    this.GetModuleClass = function getModuleClass() { return moduleParameter.Parameter.ModuleClass; };
    this.GetModuleSize = function getModuleSize() { return moduleParameter.Parameter.ModuleSize; };
    this.GetDisplayName = function getDisplayName() { return moduleParameter.Parameter.DisplayName; };
    this.GetModuleDate = function getModuleDate() { return moduleParameter.Parameter.ModuleDate; };
    this.GetHostModuleName = function () { return moduleParameter.Parameter.HostModuleName; };

    this.GetCapabilityList = function getCapabilityList() { return (new CapabilityList()); };
    this.SetCapabilityList = function setCapabilityList(capList) { };
    this.AddInitResponseData = function (stream) { };


    this.GetEncodingType = function () { return charEncoding; };
    this.SetEncodingType = function (encoding) { charEncoding = encoding; };

    this.GetChannelMask = function getChannelMask(virtualStreamManager) {
        var channel = virtualStreamManager.getChannelUsingName(moduleParameter.StreamName);
        if (channel !== null || channel !== undefined)
            return (1 << channel);
        else
            return 0;
    };

    this.GetBandwidthQuota = function getBandwidthQuota() {
        return 0;
    };

    this.GetDependents = function getDependents() {
        return [];
    };
    this.setModuleParameter = function (paramater) {
        moduleParameter = paramater;
    };
}

VirtualDriver.VD_FLOW_NONE = 0;
VirtualDriver.VD_FLOW_ACK = 1;
VirtualDriver.VD_FLOW_DELAY = 2;
VirtualDriver.VD_FLOW_CDM = 3;
