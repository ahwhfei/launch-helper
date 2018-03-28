/**
 * Created by rajasekarp on 22-05-2014.
 */

/**
 * Singleton class to hold all the global values of EUEM which can be queried
 * from anywhere in the code
 * @constructor
 */
var EuemContext = new function () {}

EuemContext.bindVersion = EuemConstants.EUEMVD_CURRENT_VERSION;
EuemContext.RoundTripPeriod = 0;
EuemContext.RoundTripWhenIdle = false;
EuemContext.bindComplete = false;

var durationIds = [ "SCD",
	"AECD",
	"COCD",
	"RECD",
	"REWD",
	"NRCD",	
	"NRWD",
	"TRWD",
	"LPWD",
	"IFDCD",
	"SLCD",
	"SCCD",
	"CFDCD",
	"BUCC",	
	"SCTW_HIGH",
	"SCTW_LOW",
	"SCTM_HIGH",
	"SCTM_LOW"];

/**
 * Class to hold different duration information
 * for both round trip and startup times
 */
function EuemDuration(id, durationLength) {
	this.id = id; //Round trip duration ids defined in EuemConstants [Byte]
	this.durationLength = durationLength; //[ULONG (4 byes)]
}

/**
 * Class to define host and client capabilities
 * @constructor
 */
function EuemCapability() {
	this.id = EuemConstants.EUEMVD_CAPABILITY_VERSION;
	this.version = EuemConstants.EUEMVD_CURRENT_VERSION;
}

/**
 * Class to hold all the startup metrics
 * Many fields required by protocol will be calculated from these fields.
 * Note: Durations field contains array of Duration class instances defined in this file
 */

var euemStartupInfo = {
	startupFlag: EuemConstants.CLIENT_NEW_SESSION,
	appName: "",
	durations: [],
	launchMechanism: "",
	startSCD: 0,
	endSCD: 0,
	startSCCD: 0,
	isSharedSession: false,

	reset: function () {
		this.durations = [];
		this.startSCCD = 0;
		this.startSCD = 0;
		this.endSCD = 0;
		this.appName = "";
		this.launchMechanism = "";
	},

	updateLastMetrics: function (endSCD, isSharedSession) {
		this.endSCD = endSCD;
		this.durations.push(new EuemDuration(EuemConstants.SCD, this.endSCD - this.startSCD));
		if (!isSharedSession) {
			this.durations.push(new EuemDuration(EuemConstants.SCCD, this.endSCD - this.startSCCD));
		}else {
			this.startupFlag = EuemConstants.CLIENT_SHARED_SESSION;
		}
		this.isSharedSession = isSharedSession;
	},

	log: function () {
		for (var i = 0; i < this.durations.length; i++) {
			console.log(durationIds[this.durations[i].id] + " : " + this.durations[i].durationLength);
		}
	}
}

/**
 * Class to hold EUEM Connection Information
 * @type {{SessionId: number, Timestamp: number, Name: string, address: string}}
 */
function EuemConnectionInfo() {
	this.sessionId = 0;
	this.timestamp = Date.now();
	this.name = "";
	this.address = "";
}

/**
 * Class to hold round trip results
 * @type {{RoundTripDuration: number, SequenceId: number, Durations: Array}}
 */
function EuemIcaRoundTripResult() {
	this.roundTripDuration = 0;
	this.sequenceId = 0;
	this.durations = [];
}

var EuemSettings = {
	roundTripPeriod: 0,
	roundTripWhenIdle: false
}


/**
 * Class to capture
 */
function EuemRoundTripMetrics() {
	this.triggerDelta = 0;
	this.firstDrawDelta = 0;
	this.frameCutDelta = 0;
	this.sendDelta = 0;
	this.wdTriggerDelta = 0;
}

