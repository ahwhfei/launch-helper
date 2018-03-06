/* Generic Capability prototype */

function Capability() {
    /* Signature for the capability */
    this.gID = 0;
}

/* Signatures (or IDs) of all supported interfaces */

Capability.WD_CAP_ID_MTU = 1;
Capability.WD_CAP_ID_REDUCERS_SUPPORTED = 2;
Capability.WD_CAP_ID_SEAMLESS = 3;
Capability.WD_CAP_ID_INTELLIMOUSE = 4;
Capability.WD_CAP_ID_CHANNEL_MONITORING = 6;
Capability.WD_CAP_ID_TIME_ZONE = 8;
Capability.WD_CAP_ID_LONG_NAME = 9;
Capability.WD_CAP_ID_COOKIE = 10;
Capability.WD_CAP_ID_TW2_DISK_CACHE = 12;
Capability.WD_CAP_ID_PRT_BW_CTRL = 11;
Capability.WD_CAP_ID_SERVER_VERSION = 13;
Capability.WD_CAP_ID_HIGH_THROUGHPUT = 16;
Capability.WD_CAP_ID_SSL_OVERHEAD = 17;
Capability.WD_CAP_ID_CREDENTIALS_PASSING = 18;
Capability.WD_CAP_ID_CAPABILITY_EUKS = 20;
Capability.WD_CAP_ID_SYSTEM_FLOW_CONTROL = 37;
Capability.WD_CAP_ID_WANSCALER_SUPPORT = 30;
Capability.WD_CAP_PACKET_PRIORITY = 5;

/* EUKS Capability */
function EuksCapability(constType, x, y) {
    var DISABLE_EUKS = 0;
    var ENABLE_EUKS = 1;
    var CAPABILITY_LENGTH = 8;
    this.version = 1;
    this.mode = 1;
    this.gID = Capability.WD_CAP_ID_CAPABILITY_EUKS;

    if ((constType == 0) || (arguments.length == 0)) {
        /* Empty constructor, do nothing*/
    } else if (constType == 1) {
        /*version, mode*/
        this.version = x;
        this.mode = y;
    } else {
        /*packet, index*/
        this.version = x[y + 4];
        this.mode = x[y + 6];
    }

    this.canDoEUKS = function () {
        return (this.mode == ENABLE_EUKS);
    };

    this.Negotiate = function (agentCap) {
        if (agentCap instanceof EuksCapability) {

            // It seems that the EUKS capability is different to other capabilities.
            // If the capability comes from the server, then this means that the
            // server can do EUKS or not, so the server-to-client "mode"
            // specification should be ignored.
            var newMode = ENABLE_EUKS;

            var d = new EuksCapability(1, Math.min(agentCap.version, this.version), newMode);
            return d;
        }
        return null;
    };

    this.GetBytes = function () {
        var data = new Array(CAPABILITY_LENGTH);
        var offset = 0;

        // Length
        data[offset++] = (CAPABILITY_LENGTH) & 0xFF;
        data[offset++] = 0x00;

        // Capability ID
        data[offset++] = this.gID & 0xFF;
        data[offset++] = 0x00;

        // Version
        data[offset++] = this.version;
        data[offset++] = 0x00;

        // Mode
        data[offset++] = this.mode;
        data[offset++] = 0x00;

        return data;
    };
}
EuksCapability.prototype = new Capability();

/* Time Zone Capability */
function TimeZoneCapability() {
    var UNICODE = 1;
    var SIZE = 64;
    var TIME_ZONE_MODE_STANDARD = 1;
    var TIME_ZONE_MODE_DAYLIGHT = 2;
    var curDate = new Date();
    var version = 1;

    this.operatingMode = TIME_ZONE_MODE_STANDARD;
    this.gID = Capability.WD_CAP_ID_TIME_ZONE;
    this.bias = curDate.getTimezoneOffset();
    var timeZoneString = curDate.toString();
    var startIndex = timeZoneString.indexOf('(');
    var endIndex = timeZoneString.indexOf(')');
    var timeZoneName = timeZoneString.substring(startIndex + 1, endIndex);

    timeZoneName = HTML5Interface.getWinTimezoneName(timeZoneName, this.bias);
    CEIP.add('timezone:vda',timeZoneName);
    //Check if DST is applicable for this time zone or not
    var curFullYear = curDate.getFullYear();
    var jan1 = new Date(curFullYear, 0, 1); // 1st January
    var jul1 = new Date(curFullYear, 6, 1); // 1st July
    var dstOffset = Math.abs(jan1.getTimezoneOffset() - jul1.getTimezoneOffset());
    if (dstOffset != 0) {
        this.operatingMode = TIME_ZONE_MODE_DAYLIGHT;
    }

    this.Negotiate = function (agentCapability) {
        /* Return as it is, no modification required */
        return agentCapability;
    }

    this.GetBytes = function () {
        var length = SIZE + (timeZoneName.length + 1) * 2;
        var data = new Array(length);
        var offset = 0;
        // Length
        data[offset++] = (length) & 0xFF;
        data[offset++] = (length >> 8) & 0xFF;

        // Capability ID
        data[offset++] = this.gID & 0xFF;
        data[offset++] = 0x00;

        // Version
        data[offset++] = version;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;

        // Operating Mode
        data[offset++] = this.operatingMode & 0xFF;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;

        // Bias can me more than one byte, at max 2 bytes.
        data[offset++] = this.bias & 0xFF;
        data[offset++] = (this.bias >> 8) & 0xFF;
        data[offset++] = (this.bias >> 16) & 0xFF;
        data[offset++] = (this.bias >> 24) & 0xFF;

        // std name offset...
        data[offset++] = SIZE & 0xFF;
        data[offset++] = (SIZE >> 8) & 0xFF;

        // DateTime structure
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;

        // StandardBias
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;


        // DST name offset
        data[offset++] = 0x00;
        data[offset++] = 0x00;

        // DayLight Date structure
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;

        // DaylightBias
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        data[offset++] = 0x00;

        // Encoding
        data[offset++] = UNICODE & 0xFF;
        data[offset++] = (UNICODE >> 8) & 0xFF;

        //Encoding Data
        data[offset++] = 0x00;
        data[offset++] = 0x00;

        // TimeZoneName String
        for (var i = 0; i < timeZoneName.length; i++) {
            data[offset++] = timeZoneName.charCodeAt(i) & 0xFF;
            data[offset++] = (timeZoneName.charCodeAt(i) >> 8) & 0xFF;
        }
		
		writeHTML5Log(0, "SESSION:|:ICA:|:TIMEZONE:|:time zone name: " + timeZoneName + " bias " +  this.bias + " dstOffset " + dstOffset);

        // Set Null character to string
        data[offset++] = 0x00;
        data[offset++] = 0x00;
        return data;
    }
}
TimeZoneCapability.prototype = new Capability();

/* Server version capability prototype */

/* Packet is a byte array and index is starting position in packet */
function ServerVersionCapability(packet, index) {
    var size = 10;
    var serverFamily = 0;
    this.GetServerFamily = function () {
        return serverFamily;
    };
    var serverFamilyVersion = 0;
    this.GetServerFamilyVersion = function () {
        return serverFamilyVersion;
    };
    var serverVariant = 0;
    this.GetServerVariant = function () {
        return serverVariant;
    };

    this.gID = Capability.WD_CAP_ID_SERVER_VERSION;

    if (packet != null) {
        serverFamily = ByteConverter.Byte2ToInt32AtOffset(packet, index + 4);
        serverFamilyVersion = ByteConverter.Byte2ToInt32AtOffset(packet, index + 6);
        serverVariant = ByteConverter.Byte2ToInt32AtOffset(packet, index + 8);
    }

    this.GetBytes = function () {
        var data = new Array();
        // Data element needs to be in bytes
        data[0] = size & 0xFF;
        data[1] = 0;
        data[2] = this.gID & 0xFF;
        data[3] = 0;
        data[4] = serverFamily & 0xFF;
        data[5] = (serverFamily >>> 8) & 0xFF;
        data[6] = serverFamilyVersion & 0xFF;
        data[7] = (serverFamilyVersion >>> 8) & 0xFF;
        data[8] = serverVariant & 0xFF;
        data[9] = (serverVariant >>> 8) & 0xFF;
        return data;
    };

    this.Negotiate = function (serverCapability) {
        /* Do nothing as no response is needed by server for this capability */
        return null;
    };
}

ServerVersionCapability.prototype = new Capability();

/* Long name capability prototype */

function LongNameCapability() {
    this.gID = Capability.WD_CAP_ID_LONG_NAME;

    this.GetBytes = function () {
        var data = new Array();
        data[0] = 0x04;
        data[1] = 0x00;
        data[2] = this.gID & 0xFF;
        data[3] = 0x00;
        return data;
    };
    this.Negotiate = function (agentCapability) {
        /* Return as it is, no modification required */
        return agentCapability;
    };

}

LongNameCapability.prototype = new Capability();

function CredentialsCapability(packet, index) {
    this.gID = Capability.WD_CAP_ID_CREDENTIALS_PASSING;
    var CAPABILITY_LENGTH = 5;
    this.version = 0;

    if (arguments.length == 1) {
        this.version = packet;
    } else if (arguments.length == 2) {
        this.version = packet[index + 4];
    }

    this.GetBytes = function () {
        var data = new Array(CAPABILITY_LENGTH);
        data[0] = CAPABILITY_LENGTH;
        data[1] = (CAPABILITY_LENGTH >> 8);
        data[2] = this.gID;
        data[3] = 0x00;
        data[4] = this.version;
        return data;
    };

    this.Negotiate = function (agentCapability) {
        if (agentCapability instanceof CredentialsCapability) {
            return new CredentialsCapability(agentCapability.version < this.version ? agentCapability.version : this.version);
        }

        return null;
    };

}

CredentialsCapability.prototype = new Capability();

function ChannelMonitorCapability(packet, index, mTU) {
    var VERSION = 1;
    var STATUS_ENABLED = 2;
    var MOUSE_FEEDBACK_ENABLED = 4;
    var SIZE = 16;
    // CAP_HEAD = 4 bytes, version = 2, repeatDelay = 2, flags = 4, mouseThresholdLower = 2, mouseThresholdUpper = 2

    this.version// Capability block version. (Currently 1)
    this.repeatDelay// Delay (in seconds) between channel monitoring pings
    this.flags// Status flags. (Only STATUS_ENABLED is currently used)
    this.mouseThresholdLower// Latency threshold (millisecs) before ZL is turned off
    this.mouseThresholdUpper// Latency threshold (millisecs) before ZL is turned on

    this.gID = Capability.WD_CAP_ID_CHANNEL_MONITORING;

    if (arguments.length == 2) {
        // Creates a ChannelMonitorCap from a byte array (ie from a packet sent from the server)
        this.version = ByteConverter.Byte2ToInt32AtOffset(packet, index + 4);
        this.repeatDelay = ByteConverter.Byte2ToInt32AtOffset(packet, index + 6);
        this.flags = ByteConverter.Byte2ToInt32AtOffset(packet, index + 8);
        this.mouseThresholdLower = ByteConverter.Byte2ToInt32AtOffset(packet, index + 10);
        this.mouseThresholdUpper = ByteConverter.Byte2ToInt32AtOffset(packet, index + 12);
    } else if (arguments.length == 3) {
        // Creates a ChannelMonitorCap with the given delay and mouse thresholds. (Version is always 1,
        // and flags = STATUS_ENABLED | MOUSE_FEEDBACK_ENABLED, to inidicate that the client supports
        // channel monitoring with mouse feedback)
        this.version = VERSION;
        this.repeatDelay = packet;
        this.flags = STATUS_ENABLED | MOUSE_FEEDBACK_ENABLED;
        this.mouseThresholdLower = index;
        this.mouseThresholdUpper = mTU;
    }

    this.IsEnabled = function isEnabled() {
        return ((this.flags & STATUS_ENABLED) != 0);
    };

    this.IsMouseEnabled = function isMouseEnabled() {
        return ((this.flags & MOUSE_FEEDBACK_ENABLED) != 0);
    };
    /**
    * Returns the byte array with data in this capability block
    */
    this.GetBytes = function getBytes() {
        var data = new Array(SIZE);
        data[0] = SIZE;
        data[1] = 0;
        data[2] = this.gID;
        data[3] = 0;

        data[4] = this.version;
        data[5] = 0;
        data[6] = (this.repeatDelay & 0xff);
        data[7] = ((this.repeatDelay >>> 8) & 0xff);
        data[8] = (this.flags & 0xff);
        data[9] = ((this.flags >>> 8) & 0xff);
        data[10] = ((this.flags >>> 16) & 0xff);
        data[11] = ((this.flags >>> 24) & 0xff);
        data[12] = (this.mouseThresholdLower & 0xff);
        data[13] = ((this.mouseThresholdLower >>> 8) & 0xff);
        data[14] = (this.mouseThresholdUpper & 0xff);
        data[15] = ((this.mouseThresholdUpper >>> 8) & 0xff);

        return data;
    };

    /**
    * Returns a capability block as a result of negotiation
    */
    this.Negotiate = function (serverCap) {
        if (serverCap instanceof ChannelMonitorCapability) {
            // We return a ChannelMonitorCap with the default version and flags, and with the preferences
            // taken from the client rather than the server. If the version number is updated, we wil need
            // to handle version 1 servers.
            return new ChannelMonitorCapability(this.repeatDelay, this.mouseThresholdLower, this.mouseThresholdUpper);
        }
        return null;
    };
}

ChannelMonitorCapability.prototype = new Capability();

function HighThroughputCap(packet, index, lLP) {
    this.gID = Capability.WD_CAP_ID_HIGH_THROUGHPUT;
    var SUPPORT_HIGH_THROUGHPUT_CDM = 1;
    var SUPPORT_HIGH_THROUGHPUT_CPM = 2;
    var HIGH_THROUGHPUT_VERSION = 0;
    var SIZE = 12;

    if (arguments.length == 0) {
        // TODO determine whether we could send  a mask or individual channel information depoending on some conditions.
        this.supportMask = SUPPORT_HIGH_THROUGHPUT_CDM | SUPPORT_HIGH_THROUGHPUT_CPM;
        this.maxICAPacketLength = 1460; 	// TODO impact of increasing this value.
        this.lineLoadingPercent = 0; 	// Mostly a testing and debugging varibale
    } else if (arguments.length == 2) {
        this.supportMask = ByteConverter.Byte4ToInt32AtOffset(packet, 0);
        this.maxICAPacketLength = ByteConverter.Byte2ToInt32AtOffset(packet, index + 8);
        this.lineLoadingPercent = ByteConverter.Byte2ToInt32AtOffset(packet, index + 10);
    } else if (arguments.length == 3) {
        this.supportMask = packet;
        this.maxICAPacketLength = index;
        this.lineLoadingPercent = lLP;
    }

    /**
    * Returns the byte array with data in this capability block
    */
    this.GetBytes = function getBytes() {
        var data = new Array(SIZE);
        data[0] = SIZE;
        data[1] = 0x00;
        data[2] = this.gID;
        data[3] = 0x00;
        data[4] = (this.supportMask & 0xff);
        data[5] = ((this.supportMask >>> 8) & 0xff);
        data[6] = ((this.supportMask >>> 16) & 0xff);
        data[7] = ((this.supportMask >>> 24) & 0xff);
        data[8] = (this.maxICAPacketLength & 0xff);
        data[9] = ((this.maxICAPacketLength >>> 8) & 0xff);
        data[10] = (this.lineLoadingPercent & 0xff);
        data[11] = ((this.lineLoadingPercent >>> 8) & 0xff);
        return data;
    };

    /**
    * Returns a capability block as a result of negotiation
    */
    this.Negotiate = function negotiate(agentCap) {
        if (agentCap instanceof HighThroughputCap) {
            return new HighThroughputCap(agentCap.supportMask & this.supportMask, agentCap.maxICAPacketLength, agentCap.lineLoadingPercent);
        }

        return null;
    };

    // TODO check for individual channels as well
    this.CanDoHighThroughput = function canDoHighThroughput() {
        return (this.supportMask == 0/*(SUPPORT_HIGH_THROUGHPUT_CDM | SUPPORT_HIGH_THROUGHPUT_CPM)*/);
    };
}
HighThroughputCap.prototype = new Capability();

function ReducerCap(arg1, arg2) {

    this.reducersMask = 0;
    //var  perverse = false;
    var mark2 = false;
    var v3 = false;
    var v4 = false;

    var enabled = false;

    this.gID = Capability.WD_CAP_ID_REDUCERS_SUPPORTED;

    if (arguments.length == 1) {
        this.reducersMask = arg1;

    } else if (arguments.length == 2) {
        this.reducersMask = ByteConverter.Byte2ToInt32AtOffset(arg1, arg2 + 4);

    }
    /**
    * Gets the currently understood 'set' of enableds from the
    * given mask.
    */
    //if ((this.reducersMask & ReducerCap.PERVERSE_MASK) != 0)
    //    perverse = true;
    if ((this.reducersMask & ReducerCap.MARK2_MASK) != 0)
        mark2 = true;
    if ((this.reducersMask & ReducerCap.V3_MASK) != 0)
        v3 = true;
    if ((this.reducersMask & ReducerCap.V4_MASK) != 0)
        v4 = true;

    enabled = /*perverse ||*/mark2 || v3 || v4;

    /**************************************************************************
    *                                                                        *
    *  Methods                                                               *
    *                                                                        *
    **************************************************************************/
    /**
    * Returns the byte array with data in this capability block
    */
    this.GetBytes = function () {
        var data = new Array(6);
        data[0] = 0x06;
        data[1] = 0x00;
        data[2] = this.gID & 0xff;
        data[3] = 0x00;
        data[4] = this.reducersMask & 0xff;
        data[5] = (this.reducersMask >>> 8) & 0xff;
        return data;
    };

    /**
    * Returns the highest supported reducer version.
    * Information calculated from internal parameters.
    */
    this.getHighReducer = function () {

        return (enabled ? (v4 ? 4 : (v3 ? 3 : (mark2 ? 2 : (/*perverse ? 1 :*/0)))) : 0);
    };

    /**
    * Returns a capability block as a result of negotiation
    */

    this.Negotiate = function negotiate(agentCap) {
        if (agentCap instanceof ReducerCap) {
            return new ReducerCap(agentCap.reducersMask & this.reducersMask);
        }

        return null;
    };
}

ReducerCap.prototype = new Capability();
//Public static :
ReducerCap.MARK2_MASK = 0x02;
ReducerCap.V3_MASK = 0x04;
ReducerCap.V4_MASK = 0x08;

function SeamlessCap(packet, index) {
    var SEAMLESS_CAP_SLOGON = 1;
    var SEAMLESS_CAP_DEFERRED_UPDATE = 2;
    var SEAMLESS_CAP_BALANCE_NC = 4;
    var SEAMLESS_CAP_NC_PREDICTION = 8;
    var SEAMLESS_CAP_ZERO_LATENCY1 = 16;

    this.gID = Capability.WD_CAP_ID_SEAMLESS;

    this.seamlessMask = 0;

    if (arguments.length == 0) {
        this.seamlessMask = SEAMLESS_CAP_SLOGON | SEAMLESS_CAP_ZERO_LATENCY1;
    } else if (arguments.length == 1) {
        this.seamlessMask = packet;
    } else if (arguments.length == 2) {
        this.seamlessMask = ByteConverter.Byte2ToInt32AtOffset(packet, index + 4);
    }

    /**
    * Returns the byte array with data in this capability block
    */
    this.GetBytes = function () {
        var data = new Array(8);
        data[0] = 0x08;
        data[1] = 0x00;
        data[2] = this.gID;
        data[3] = 0x00;

        data[4] = this.seamlessMask & 0xff;
        data[5] = (this.seamlessMask >>> 8) & 0xff;
        data[6] = (this.seamlessMask >>> 16) & 0xff;
        data[7] = (this.seamlessMask >>> 24) & 0xff;

        return data;
    };

    /**
    * Returns a capability block as a result of negotiation
    */
    this.Negotiate = function (agentCap) {
        if (agentCap instanceof SeamlessCap) {
            return new SeamlessCap(agentCap.seamlessMask);
        }
        return null;
    };
}

function SystemFlowControlCap(packet, index) {
    this.gID = Capability.WD_CAP_ID_SYSTEM_FLOW_CONTROL;
    this.version = 1;
    /**
    * Returns a capability block as a result of negotiation
    */
    console.log("system flow control arg " + arguments.length);
    if (arguments.length == 0) {
        this.version = 1;
    } else if (arguments.length == 1) {
        console.log("setting version " + packet);
        this.version = packet;
    } else if (arguments.length == 2) {
        this.version = (packet[index + 5] << 8) | packet[index + 4];
    }
    this.Negotiate = function (agentCap) {
        if (agentCap instanceof SystemFlowControlCap) {
            return new SystemFlowControlCap(agentCap.version);
        }
        return null;
    };
    /**
    * Returns the byte array with data in this capability block
    */
    this.GetBytes = function () {

        console.log("getting data of caps +++++++++++++++++++++++" + this.version);
        var data = new Array(6);
        data[0] = 0x06;
        data[1] = 0x00;
        data[2] = this.gID;
        data[3] = 0x00;
        // Version
        data[4] = this.version;
        data[5] = 0x00;
        return data;
    };
}

SystemFlowControlCap.prototype = new Capability();
function IntelMouseCapability(packet, index) {
    var size = 6;
    this.gID = Capability.WD_CAP_ID_INTELLIMOUSE;
    var INTELLIMOUSE_CAP_WHEEL = 0x0001;
    var INTELLIMOUSE_CAP_X1 = 0x0002;
    var INTELLIMOUSE_CAP_X2 = 0x0004;
    var intellimouseFeaturesMask;
    this.mouseWhellSupport = true;
    var defaultIntellimouseFeaturesMask = INTELLIMOUSE_CAP_WHEEL | INTELLIMOUSE_CAP_X1 | INTELLIMOUSE_CAP_X2;
    if (packet != null) {
        intellimouseFeaturesMask = ByteConverter.Byte2ToInt32AtOffset(packet, index + 4);
        if (intellimouseFeaturesMask & INTELLIMOUSE_CAP_WHEEL) {
            this.mouseWhellSupport = true;
        } else {
            this.mouseWhellSupport = false;
        }
    } else {
        intellimouseFeaturesMask = defaultIntellimouseFeaturesMask;
    }
    this.GetBytes = function () {
        var data = new Array();
        // Data element needs to be in bytes
        data[0] = size & 0xFF;
        data[1] = 0;
        data[2] = this.gID & 0xFF;
        data[3] = 0;
        data[4] = intellimouseFeaturesMask & 0xFF;
        data[5] = (intellimouseFeaturesMask >>> 8) & 0xFF;
        return data;
    };

    this.Negotiate = function (serverCapability) {
        /* Do nothing as no response is needed by server for this capability */
        return null;
    };
}

IntelMouseCapability.prototype = new Capability();

function PrinterBandwidthControl( packet , index )
{
	this.gID = Capability.WD_CAP_ID_PRT_BW_CTRL;
	this.GetBytes = function()
	{
		var data = new Array();
		data[0] = 0x04;
		data[1] = 0x00;
		data[2] = this.gID & 0xFF;
		data[3] = 0x00;
		return data;
	};
	this.Negotiate = function(agentCapability)
	{
		/* Return as it is, no modification required */
		return agentCapability;
	};
}
PrinterBandwidthControl.prototype = new Capability();


function PacketPriority(packet, index, wdDriver) {
    this.gID = Capability.WD_CAP_PACKET_PRIORITY;    

    if(packet && wdDriver) {                
        var priorityOffset = ByteConverter.Byte4ToInt32AtOffset(packet, index + 4); 
        var arrayLen = ByteConverter.Byte2ToInt32AtOffset(packet, index + 8);        
        wdDriver.UseLowestPriority = (packet[index + 10] == 1) ? true : false;             
        
        index += priorityOffset;    
        //console.log("Priority list.... ");
        for(var i = 0; i < arrayLen; i++, index++ ) {
            wdDriver.ChannelPriorityMap[i] = packet[index];   
            /*if(ChannalMap.revVirtualChannalMap[i]) {
                console.log("[" + ChannalMap.revVirtualChannalMap[i] + " : " + packet[index] + "]");
            }*/
        } 
    }
    
    this.Negotiate = function (serverCapability) {
        /* Do nothing as no response is needed by server for this capability */
        return null;
    };

    this.GetBytes = function () {            
        var data = new Array();
        data[0] = 0x04;
        data[1] = 0x00;
        data[2] = this.gID & 0xFF;
        data[3] = 0x00;        
        return data;
    }    
};

PacketPriority.prototype =  new Capability();

function WanscalerSupport(packet, index) {    
    this.gID = Capability.WD_CAP_ID_WANSCALER_SUPPORT;    
    this.packet = [];    
    var packetSize=29;     

    if(packet) { //Copy the entire cap packet
        //var startIndex = index;        
        for(var i = 0; i < packetSize; i++) {
            this.packet.push(packet[index++]);
        } 
        //parse(packet, startIndex);
    }    

    this.GetBytes = function(){
        var data = [];
        if(this.packet) { //Modify client version and icaClientFlags and echo the other parameters
            var index = 4;        
            var icaProtocolVersion = 1;
            var CAP_WANSCALER_DISABLE_COMPRESSION=0x01;
            var CAP_WANSCALER_DISABLE_PRINTER_COMPRESSION=0x02;
            
            var icaClientFlag = CAP_WANSCALER_DISABLE_COMPRESSION | CAP_WANSCALER_DISABLE_PRINTER_COMPRESSION;
            
            this.packet[index++] =  icaProtocolVersion;        
            ByteWriter.WriteInt32ToBuffer(this.packet, index, icaClientFlag);
            data = this.packet;            
        }
        return data;
    }

    this.Negotiate = function(agentCapability) {
        return agentCapability;        
    }

    function parse(packet, index) {        
        index += 4;
        var icaProtocolVersion = packet[index++];
        var icaClientFlag=ByteConverter.Byte4ToInt32AtOffset(packet,index);
        
        index+=4;
        var clientWsProtocolVersion=packet[index++];
        var clientWsFlags=ByteConverter.Byte4ToInt32AtOffset(packet,index);
        
        index+=4;
        var serverWsProtocolVersion=packet[index++];
        var serverWsFlags=ByteConverter.Byte4ToInt32AtOffset(packet,index);
        
        index+=4;
        var cpsServerProtocolVersion=packet[index++];
        var cpsServerFlags=ByteConverter.Byte4ToInt32AtOffset(packet,index);
        
        index+=4;
        var sessionProtocolVersion=packet[index++];
        var sessionFlags=ByteConverter.Byte4ToInt32AtOffset(packet,index);
        
        console.log("icaProtocolVersion  "+icaProtocolVersion);
        console.log("icaClientFlag       "+icaClientFlag);
        console.log("clientWsProtocolVersion   "+clientWsProtocolVersion);
        console.log("clientWsFlags       "+clientWsFlags);
        console.log("serverWsProtocolVersion    "+serverWsProtocolVersion);
        console.log("serverWsFlags       "+serverWsFlags);
        console.log("cpsServerProtocolVersion    "+cpsServerFlags);
        console.log("cpsServerFlags      "+cpsServerFlags);
        console.log("sessionProtocolVersion       "+sessionProtocolVersion);
        console.log("sessionFlags         "+sessionFlags);        
    }    
}
WanscalerSupport.prototype = new Capability();
