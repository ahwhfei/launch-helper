function UIModule() {
    var charEncoding = SupportedEncoding.UNICODE_ENCODING;

    var MODULE_VERSIONL = 1;
    var MODULE_VERSIONH_ASCII = 3;
    var MODULE_VERSIONH_UNICODE = 7;
    var MODULE_NAME = "UIModule.class";
    var MODULE_DATE = new Date();
    var MODULE_SIZE = 0;

    this.GetModuleClass = function getModuleClass() {
        return UIModule.USER_INTERFACE;
    };

    this.GetVersionL = function getVersionL() {
        return MODULE_VERSIONL;
    };

    this.GetVersionH = function getVersionH() {
        if (charEncoding === SupportedEncoding.UNICODE_ENCODING) {
            return MODULE_VERSIONH_UNICODE;
        }
        else {
            return MODULE_VERSIONH_ASCII;
        }
    };

    this.GetDisplayName = function getDisplayName() {
        return "User Interface";
    };

    this.GetModuleName = function getModuleName() {
        return MODULE_NAME;
    };

    this.GetHostModuleName = function getHostModuleName() {
        return null;
    };

    this.GetModuleDate = function getModuleDate() {
        return MODULE_DATE;
    };

    this.GetModuleSize = function getModuleSize() {
        return MODULE_SIZE;
    };

    this.GetEncodingType = function getEncodingType() {
        return charEncoding;
    };

    this.SetEncodingType = function setEncodingType(encoding) {
        charEncoding = encoding;
    };

    this.GetCapabilityList = function getCapabilityList() {
        return null;
    };

    this.SetCapabilityList = function setCapabilityList(caplist) {
    };

    this.GetUserInterfaceExtentions = function getUserInterfaceExtentions() { return null; };

    this.GetClientDirectory = function getClientDirectory() {
        return "none";
    };

    this.IsSoundEnabled = function isSoundEnabled() { return true; };

    this.SendCredentials = function sendCredentials() {
        return true;
    };
}

//UIModule.USER_INTERFACE     = 0;
//UIModule.USER_INTERFACE_EXT = 1;
UIModule.WINSTATION_DRIVER = 2;
UIModule.VIRTUAL_DRIVER = 3;
UIModule.PROTOCOL_DRIVER = 4;
UIModule.TRANSPORT_DRIVER = 5;
//UIModule.NAME_RESOLVER      = 6;
//UIModule.NAME_ENUMERATOR    = 7;
//UIModule.SCRIPTING          = 8;