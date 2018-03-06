/**
 * Created by rajasekarp on 22-05-2014.
 * These classes defines commands and protocol specific ids.
 */

var EuemCommands = function () {}

EuemCommands.EUEMVD_BIND_REQUEST = 0x00;
EuemCommands.EUEMVD_BIND_RESPONSE = 0x01;
EuemCommands.EUEMVD_BIND_COMMIT = 0x02;
EuemCommands.EUEMVD_PKT_SETTINGS = 0x03;
EuemCommands.EUEMVD_PKT_CONNECTION_ID = 0x04;
EuemCommands.EUEMVD_PKT_AUTORECONNECT = 8;

//ICA Roundtrip related commands
EuemCommands.EUEMVD_PKT_ROUNDTRIP_START = 5;
EuemCommands.EUEMVD_PKT_ROUNDTRIP_ABORT = 6;
EuemCommands.EUEMVD_PKT_ICA_RESULT = 7;

//Startup timing related
EuemCommands.EUEMVD_PKT_CLIENT_STARTUP_TIMES = 9;

var EuemConstants = function () {}

//Min packet size excluding header size
EuemConstants.BIND_REQUEST_DATA = 9;
EuemConstants.CONNECTION_INFO_DATA = 16;
EuemCommands.SETTINGS_DATA = 4;

EuemConstants.EUEMVD_CAPABILITY_VERSION = 0x01;
EuemConstants.EUEMVD_PRE_RELEASE_VERSION = 0x01;
EuemConstants.INITIAL_RELEASE_VERSION = 0x02;
EuemConstants.STARTUP_DURATION_VERSION = 0x03;
EuemConstants.EUEMVD_CURRENT_VERSION = EuemConstants.STARTUP_DURATION_VERSION;
EuemConstants.EUEM_CHANNEL_NAME = "CTXEUEM";

//Round trip duration ids
EuemConstants.RT_DURATION_FIRST_RAW = 0x00;
EuemConstants.RT_DURATION_EUEM_TRIGGER = 0x01;
EuemConstants.RT_DURATION_FRAME_CUT = 0x02;
EuemConstants.RT_DURATION_FRAME_SEND = 0x03;
EuemConstants.RT_DURATION_WD_TRIGGER = 0x04;


//Client Startup ids
EuemConstants.CLIENT_SHARED_SESSION = 0x00;
EuemConstants.CLIENT_NEW_SESSION = 0x01;
/*
 Round trip setting ids
 */
EuemConstants.EUEMVD_SETTINGS_ICA_ROUNDTRIP_PERIOD = 0x00;
EuemConstants.EUEMVD_SETTINGS_ICA_ROUNDTRIP_WHEN_IDLE = 0x01;


/*
 Euem startup metrics
 */

EuemConstants.SCD = 0;
EuemConstants.SCCD = 11;
EuemConstants.SLCD = 10;
EuemConstants.SCTW_HIGH = 14;
EuemConstants.SCTW_LOW = 15;
EuemConstants.SCTM_HIGH = 16;
EuemConstants.SCTM_LOW = 17;
