function OutputError(){}

OutputError.WriteToInputBox = function writeToInputBox(inputBoxId, message)
{
	//document.getElementById(inputBoxId).value+= message;
};

function SessionInitiationError(){}
SessionInitiationError.NO_WINDOW_OPENER = 901;
SessionInitiationError.LAUNCH_ID_NULL = 902;
SessionInitiationError.ICA_DATA_NULL = 903;
SessionInitiationError.SERVER_ADDR_NULL = 904;
SessionInitiationError.INVALID_APP = 904;

function ProtocolError(){}

ProtocolError.UNKNOWN_PROTOCOL = 1;
ProtocolError.PROTOCOL_ENCRYPT_INIT_FAILED = 2;
ProtocolError.INVALID_CODEC_FOR_TW_PROTOCOL = 3;

function WinstationDriverError(){}

WinstationDriverError.WRONG_SERVER_VERSION = 11;
WinstationDriverError.INVALID_CAPABILITY_LIST_LENGTH = 12;
WinstationDriverError.REQUESTED_ENCRYPTION_NOT_SUPPORTED = 13;
WinstationDriverError.INVALID_TERMINATION_TYPE = 14;
WinstationDriverError.COMMAND_REPROCESSING_NOT_ALLOWED = 15;
WinstationDriverError.UNKNOWN_ENCODING = 16;
WinstationDriverError.PACKET_RESUME_VIRTUAL_WRITE = 17;

function TransportDriverError(){}

TransportDriverError.NO_ICA_STRING = 21;
TransportDriverError.ZERO_LENGTH_READ = 22;

function RleDecodeError(){}

RleDecodeError.NOT_BYTE_SIZED_BITMAP = 31;
RleDecodeError.DECODER_NOT_SUPPORTED = 32;
RleDecodeError.BAD_DECODER = 33;
RleDecodeError.NOT_INT_SIZED_BITMAP = 34;
RleDecodeError.INVALID_DEPTH = 35;
RleDecodeError.BMP_CODEC_ID_NULL = 36;
RleDecodeError.BMP_CODEC_ID_JPEG_LOSSY = 37;
RleDecodeError.UNSUPPORTED_RAW_IMAGE_FORMAT = 38;

function TwWireStreamError(){}

TwWireStreamError.INVALID_CACHE_OBJECT = 41;
TwWireStreamError.READRGBPALETTE = 42;
TwWireStreamError.READINDEXPALETTE = 43;

function CacheError(){}

CacheError.OBJECT_TOO_LARGE = 51;

function TwTwoDriverError(){}

TwTwoDriverError.UNKNOWN_TW2_COMMAND = 61;
TwTwoDriverError.TW2_COLOR_MODE_NOT_SUPPORTED = 62;

function TUIVirtualDriverError(){}
TUIVirtualDriverError.INVALID_PACKET = 151;
TUIVirtualDriverError.UNKNOWNCLASSID  = 152;


function DictionaryError(){}

DictionaryError.DUPLICATE_ELEMENT = 71;

function VirtualDriverError(){}

VirtualDriverError.ILLEGAL_STACK = 81;
VirtualDriverError.WD_SETUP_FAILED = 82;
VirtualDriverError.THINWIRE_VERSION_NOT_SUPPORTED = 83;
VirtualDriverError.RUN_FAILED = 84;
VirtualDriverError.UNSUPPORTED_BUFFER = 85;

function UtilityError(){}

UtilityError.ArrayCopyFailed = 91;

function WDStreamError(){}

WDStreamError.RequestedDataNotAvailable = 101;

function MediaEncoderError(){}

MediaEncoderError.NULL_CANVAS = 111;

function WriteItemError(){}
WriteItemError.INVALID_V3_ACTION = 201;

function VirtualWriteQueueError() {}
VirtualWriteQueueError.NEGATIVE_COUNT = 301;
VirtualWriteQueueError.HEAD_TAIL_COUNT_MISMATCH = 302;

function ReducerError() {}
ReducerError.PARTIALWRITE_ERROR                 = 401;
ReducerError.CANT_COMPLETE_WRITE                = 402;
ReducerError.PARTIAL_WRITE_OF_NONVIRT_WRITE     = 403;
ReducerError.TOO_LARGE_ICA_PACKET               = 404;
ReducerError.NULL_VIRTUAL_WRITE_REQUEST         = 405;
ReducerError.CANT_CREATE_2E32BYTE_VIRTUALWRITE  = 406;
ReducerError.INVALID_REDUCER_LEVEL_SPECIFIED    = 407;

function ExpanderError() {}
ExpanderError.UNSUPPORTED_EXPENSION_TYPE		= 451;

function V3ReducerError() {}
V3ReducerError.VIRTUALWRITEQUEUE_CANT_WRITEITEMS = 501;

function V3ExpanderError() {}
V3ExpanderError.WRAP_ERROR_SENDERFAULTY                           = 601;
V3ExpanderError.CANT_RESTART_EXPANDER                             = 602;
V3ExpanderError.EXPANDER_ERROR                                    = 603;
V3ExpanderError.TERMINATION_ERROR                                 = 604;
V3ExpanderError.TOO_MUCH_DATA                                     = 605;
V3ExpanderError.ILLEGAL_USAGE_DEFINE_NR_OF_CODERS                 = 606;
V3ExpanderError.ILLEGAL_USAGE_V3_ASSIGN_CODER_TO_CHANNEL          = 607;
V3ExpanderError.CODER_NUMBER_TOO_GREAT                            = 608;
V3ExpanderError.ILLEGAL_USAGE_V3_INIT_SPECIAL_THINWIRE_CHANNEL    = 609;
V3ExpanderError.TOO_MANY_CODERS                                   = 610;
V3ExpanderError.ILLEGAL_USAGE_V3_LIGHTWEIGHT_OBJECT_COMPRESSION   = 611;
V3ExpanderError.ILLEGAL_USAGE_V3_HEAVYWEIGHT_OBJECT_COMPRESSION   = 612;
V3ExpanderError.CORRUPT_DATA_LENGTH                               = 613;
V3ExpanderError.EXPANSION_NOT_ENABLED                             = 614;
V3ExpanderError.UNDEFINED_DECODER                                 = 615;
V3ExpanderError.CONSUMED_LENGTH_TOO_LONG                          = 616;
V3ExpanderError.TOO_MUCH_VIRTUAL_DATA                             = 617;
V3ExpanderError.ILLEGAL_EXPANDER_POWER                            = 618;

function V3CoderError() {}
V3CoderError.UNKNOWN_STATE               = 701;

function VirtualStreamError() {}
VirtualStreamError.NO_SPACE_ERROR = 801;
VirtualStreamError.CALLBACK_NOT_REGISTERED = 802;

function GCError() {}
GCError.BUFFER_NOT_SUPPORTED = 901;

function ProxyError() {}
ProxyError.NULL_TOKEN_RECEIVED = 951;
ProxyError.CLOSE = 1001;

function cursorError() {}
cursorError.Image_Mask_Mismatch = 250;
cursorError.Direct_Cursor_Image = 251;
cursorError.Index_cursor_Image  = 252; 

function clipBoardError(){}
clipBoardError.Unsupported_clipboard_format = 260 ;
clipBoardError.Unknown_clipboard_format     = 261 ;

function convertError(){}
convertError.convert_Str2_Cp1252byteArray   = 270 ;
convertError.convertCp1252_byteArray_2_Str  = 271 ;
convertError.convertStr_2_Cp437byteArray    = 272 ;
convertError.convertCp437_byteArray_2_str   = 273 ;


function audioError( ){}
audioError.decodePCMData = 290 ;
audioError.AUDIO_NOT_SUPPORTED = 291 ;
function CDMERROR(){}
CDMERROR.NOT_VALID_DRIVENAME = 550;


function WEBGLERROR( ){}
WEBGLERROR.NOT_SUPPORTED = 1100;
WEBGLERROR.UNSUPPORTED_TEXTURE = 1101;

