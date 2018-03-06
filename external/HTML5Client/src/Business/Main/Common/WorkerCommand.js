function WorkerCommand() { }


WorkerCommand.SESSION_LAUNCH_APPLICATION							= 0;
WorkerCommand.CMD_WRITECACHEPACKET 					= 2;
WorkerCommand.CMD_WRITEKBDPACKET					= 3;
WorkerCommand.CMD_WRITESETLEDPACKET					= 4;
WorkerCommand.CMD_WRITE_SINGLEMOUSE_PACKET			= 5;
WorkerCommand.CMD_WRITE_MULTIMOUSE_PACKET			= 6;
WorkerCommand.CONSUME                               = 9;
WorkerCommand.EUKS                                  = 10;
WorkerCommand.CONSOLE                               = 12;
WorkerCommand.QUEUEWRITEBYTE                        = 14;
WorkerCommand.CMD_CLOSECURRENTTAB                   = 15;
WorkerCommand.ERR_MSG                        		= 16;
WorkerCommand.CMD_ENDWRITING          	    	    = 20;
WorkerCommand.THREADTERMINATE						= 23 ;
WorkerCommand.CMD_INIT_PLAYER                       = 24;
WorkerCommand.CMD_PLAY_AUDIO                       	= 25;
WorkerCommand.CMD_CHANNEL_ERROR_CODE				= 26;
WorkerCommand.URL_REDIRECTION_MSG                   = 27;
WorkerCommand.CMD_URL_REDIRECTION_STATUS			= 28;
WorkerCommand.WRITE_ACK								= 29;
WorkerCommand.CMD_SET_RCV_MGR						= 30;
WorkerCommand.SESSION_RESOLUTION_INFO				= 31;
WorkerCommand.NOTIFY_AS_MAIN_WINDOW   = 32;
WorkerCommand.NOTIFY_RESOLUTION_CHANGE = 33;
WorkerCommand.CMD_WRITE_SINGLESCANCODE_PACKET		= 34;
WorkerCommand.SESSION_INFO                          = 35;
WorkerCommand.PACKET_REDRAW                       = 36;

/*************************CDM specific********************/
WorkerCommand.CMDENABLEHIGHTHROUGHPUT 			= 100 ;
WorkerCommand.CMDINITIALIZEFILEROOT 			= 101 ;
WorkerCommand.CMDSHUTDOWNCDM 					= 102 ;
WorkerCommand.CMDREINITIALIZEFILEROOT 			= 103 ;
WorkerCommand.QUOTA_EXCEEDED_ERR 				= 104 ;
WorkerCommand.CMDMAXWINDOWSIZEDATA 				= 105 ;
WorkerCommand.CMD_WINCDMDRIVEINFO 				= 106 ;
WorkerCommand.CMDUPDATEFILEROOT  				= 107 ;
WorkerCommand.CMDINVALIDEXTENSION               = 108 ;

/*************************************************************/


/*****************************Seamless Clipboard*******************/
WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONH2C       	= 301 ;
WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONC2W    	= 302;
WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONW2C      	= 303;
WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONU2C      	= 304;
WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONC2H       	= 305 ;
WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTH2C       		= 306 ;
WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTC2W    			= 307;
WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTW2C      		= 308;
WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTU2C      		= 309;
WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTC2H       		= 310 ;
WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEH2C       		= 311 ;
WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEC2W    		= 312;
WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEW2C      		= 313;
WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEU2C      		= 314;
WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEC2H       		= 315 ;
WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEC2U			= 316;
WorkerCommand.SEAMLESS_CLIPBOARD_INIT					= 317;
WorkerCommand.CLIP_INIT 								= 318 ;
WorkerCommand.CMD_ENABLE_UI_CLIP 						= 319;
WorkerCommand.SEAMLESS_CLIPBOARD_REQUESTNOTIFICATION    = 320;
/*******************************************************************/
WorkerCommand.THINWIRE_INITCOMMAND = 1000;
WorkerCommand.SET_RENDER_MODE = 1001;
WorkerCommand.RENDER_YUV = 1002;
WorkerCommand.RENDER_SOLID_RECT = 1003;
WorkerCommand.RENDER_BITMAP = 1004;
WorkerCommand.PRESENT_FRAME = 1005;
WorkerCommand.CLEAR_OVERLAYS = 1006;
WorkerCommand.RENDER_RGB = 1007;
WorkerCommand.RENDER_TEXT = 1008;
WorkerCommand.DELETE_TEXT = 1009;
WorkerCommand.MULTIMONITOR_CAPABILITY = 1013;

/**********************************************************************/
// tw to ui
WorkerCommand.SET_RENDER_CANVAS = 1010;
WorkerCommand.RESET_FALLBACK = 1011;
WorkerCommand.SET_RENDER_NATIVE = 1012;

// tw to seamless
WorkerCommand.Pause = 1301;
WorkerCommand.Resume = 1302;

// tw to ctx
WorkerCommand.CTXMODULE_CREATE = 1205;

// ctx to tw
WorkerCommand.CTXMODULE_MESSAGE = 1204;

/****************************SessionSharing*******************************/
WorkerCommand.REGISTER_SESSION = 1501;
WorkerCommand.REGISTER_SESININFO = 1502;
WorkerCommand.REGISTER_ENGINE = 1503;
WorkerCommand.SESSION_WINDOW_INFO = 1504;
WorkerCommand.REGISTER_SESSION_PORT = 1505;
WorkerCommand.REGISTER_AS_NEW_INSTANCE = 1506;
WorkerCommand.CREATE_CHANNEL = 1507;
WorkerCommand.REGISTER_CLIPBOARD = 1508;
WorkerCommand.REQUESRT_UNIQUE_ID = 1509;
WorkerCommand.REPLY_UNIQUE_ID = 1509;
WorkerCommand.NOTIFY_FOR_CREATE_CHANNEL=1510;
/************************************************************/

/***********************EUEM******************/
WorkerCommand.STARTSCCD_INFO = 200;
WorkerCommand.ROUNDTRIP_INFO = 201;
WorkerCommand.ICADATA_INFO = 202;
WorkerCommand.ENDSCD_INFO = 203;
WorkerCommand.ROUNDTRIP_PACKET = 204;
WorkerCommand.ROUNDTRIP_ACK = 206;
/************************************************************/

WorkerCommand.AUDIO_PLAYER_TYPE	=	2000 ;
/***********************USB Redirection**********************/
WorkerCommand.USB_INIT = 500;
WorkerCommand.CMD_USB_BUILD_DEVICE = 501;
WorkerCommand.USB_ADD_DEVICE = 503;
WorkerCommand.CMD_ENABLE_UI_USB = 504;
WorkerCommand.REGISTER_USB  = 505;
WorkerCommand.SEAMLESS_USB_ADD_DEVICE = 506;
WorkerCommand.SEAMLESS_USB_NOTIFICATIONW2C = 507;
WorkerCommand.SEAMLESS_USB_INIT = 508;
WorkerCommand.SEAMLESS_USB_RESPONSEC2U = 509;
WorkerCommand.USB_UPDATE_DEVICE = 510;
WorkerCommand.SEAMLESS_USB_UPDATE_DEVICE = 512;
WorkerCommand.SEAMLESS_USB_GET_ALL_DEVICES = 513;
WorkerCommand.SEAMLESS_USB_LIST  = 515;
WorkerCommand.CMD_USB_LIST = 516;
WorkerCommand.CMD_USB_SENDING_LIST =517;
WorkerCommand.CMD_USB_TRANSFER_RELEASING =518;
WorkerCommand.CMD_USB_TRANSFER_RELEASED =519;
WorkerCommand.CMD_USB_RELEASE_ALL =520;
WorkerCommand.CMD_USB_RELEASE_DEVICES =521;
WorkerCommand.USB_RELEASE_DEVICES =522;
WorkerCommand.SEAMLESS_USB_RELEASE_DEVICES = 523;
WorkerCommand.USB_RELEASE_OTHER_SESSION_DEVICES = 524;


WorkerCommand.SEAMLESS_TO_UIMANAGER = 600;
WorkerCommand.UIMANAGER_TO_SEAMLESS = 601;

/***********************PDF Printing******************/
WorkerCommand.OPEN_PDF_PRINT_FILE = 2100;
WorkerCommand.OPEN_PDF_PRINT_FILE_STATUS = 2101;
WorkerCommand.TOTAL_FILES = 2102;
WorkerCommand.SHOW_DOWNLOADING_PDF_FILE = 2103;
WorkerCommand.HIDE_DOWNLOADING_PDF_FILE = 2104;
WorkerCommand.OPEN_PDF_PRINT_WINDOW_CHROME_APP = 2105;
WorkerCommand.KIOSK_MODE_SEND_PRINT_OBJECT = 2106;
/************************************************************/

/***********************FPS Meter and Resize Dialog******************/
WorkerCommand.UPDATE_FPS_METER = 3000;
WorkerCommand.SHOW_RESIZE_DIALOG = 3001;
WorkerCommand.SHOW_RECONNECTING_SCREEN = 3002;	// FOR CGP Reconnect Screen
WorkerCommand.HIDE_RECONNECTING_SCREEN = 3003;  // FOR CGP Hide Screen
/************************************************************/

/****************************FileTransfer*******************************/
WorkerCommand.CMD_FILE_UPLOAD_INIT = 4001;
WorkerCommand.CMD_SET_FILE_UPLOAD_OBJECT = 4002;
WorkerCommand.FILE_INIT    = 4003;
WorkerCommand.FILE_UPLOAD_RESPONSE_RECEIVED = 4004;
WorkerCommand.FILE_TRANSFER_CONFIG = 4005;
/************************************************************/

/****************************MultiTouch*******************************/
WorkerCommand.SEND_MULTI_TOUCH_DATA= 2500;
WorkerCommand.MULTI_TOUCH_INIT  = 2501;
/************************************************************/


/****************EVENTS related to SDK ********************************************/
WorkerCommand.SESSION_READY_EVENT = 5000;
/************************************************************/
function DRIVERID( ){};
DRIVERID.ID_THINWIRE = 0 ;//have to change according to channlemap
DRIVERID.ID_UI = 1 ;
DRIVERID.ID_WINSTATION = 2 ;
DRIVERID.ID_TRANSPORT = 3 ;
DRIVERID.ID_PROTOCOL = 4 ;
DRIVERID.ID_TWI		 = 5 ;
DRIVERID.ID_CLIPBOARD		 = 6 ;
DRIVERID.ID_AUDIO = 7 ;
DRIVERID.ID_CTL	  = 8;
DRIVERID.ID_EUEM = 9;
DRIVERID.ID_PRINTER = 10;
DRIVERID.ID_USB = 11;
DRIVERID.ID_FILE = 12;
DRIVERID.ID_MOBILE = 13;
DRIVERID.ID_MULTIMEDIA = 19;
DRIVERID.ID_CTX_MODULE = 100;
DRIVERID.ID_MTU = 20;

DRIVERID.ID_RECEIVER_MANAGER = 201;
DRIVERID.ID_APPLICATION = 202;
DRIVERID.ID_SESSION_MANAGER = 203;
DRIVERID.ID_GENERIC_INFO = 204;//used for passing general information as errorcode between drivers and winstationdriver
/*
 * below command can be used for writing data to winstation driver from any other driver
 */
DRIVERID.ID_GENERICWRITE = 200 ;
/*
 * Command source which is set for the receiver events that need to be posted to parent window when HTML5
 * receiver is hosted in iFrame
 */
DRIVERID.ID_CALLBACK_EVENTS = 300;

function THREADCOMMAND( ){};
THREADCOMMAND.INIT_ENGINE = 0 ;//initialize that variable in that object where actual processing happen
THREADCOMMAND.INIT_AUDIOPLAYER = 1 ;




function GRAPHICSMODE( ){}
GRAPHICSMODE.NONE		 = -1;
GRAPHICSMODE.NORMAL_MODE = 0 ;
GRAPHICSMODE.H264_MODE 	 = 1 ;

/*
 * RENDERMODE value  should be power of 2 and should not zero
 */
function RENDERMODE() {}
RENDERMODE.TWFULL = 1;
RENDERMODE.H264 = 2;

function ERRORCODE(){}
ERRORCODE.NONE = 0;
/*
 * Driver is not supported , this error code have to be set before sendind module information to VDA
 * otherwise it wil behave as ERRORCODE.DISCONNECTED
 */
ERRORCODE.NOTSUPPORTED = 1;
/*
 * All necessary data has been processed and data shoold not come form winstationdriver
 */
ERRORCODE.DISCONNECTED = 2;


function THREADID(){}
THREADID.H264 = 0;
THREADID.THREAD2 = 1;
THREADID.SESSION_MANAGER = 2;
THREADID.RECEIVER_MANAGER = 3;




var STRING_TO_CMD = { };
STRING_TO_CMD['browserType'] = {};
STRING_TO_CMD['browserType']['chrome'] =  6;

STRING_TO_CMD['cmd'] = {};
STRING_TO_CMD['cmd']['launch'] = WorkerCommand.SESSION_LAUNCH_APPLICATION;
STRING_TO_CMD['cmd']['init'] = WorkerCommand.REGISTER_SESSION;
STRING_TO_CMD['cmd']['close'] = WorkerCommand.CMD_CLOSECURRENTTAB;

STRING_TO_CMD['source'] = {};
STRING_TO_CMD['source']['ID_UI'] = DRIVERID.ID_UI;


