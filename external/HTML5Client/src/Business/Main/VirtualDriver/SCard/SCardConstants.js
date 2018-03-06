
var SCard;
(function (SCard) {
    var Constants = {};

    Constants.managerAppId = (typeof HTML5_CONFIG !== 'undefined') ? ((HTML5_CONFIG['smartcard']) ? HTML5_CONFIG['smartcard']['managerappid'] : undefined) : undefined;
    Constants.SPECIAL_READER_NAME = '\\\\?PnP?\\Notification';
    Constants.headerSize = 4;
    Constants.TIMEOUT_SECONDS = 15;
    Constants.BIND_RESPONSE_LENGTH = 4;

    Constants.CTXSCARD_S_SUCCESS = 0x00000000;

    //commands
    Constants.SCARDVD_CMD_BIND_REQUEST = 0x00;
    Constants.SCARDVD_CMD_BIND_RESPONSE = 0x80;
    Constants.SCARDVD_CMD_BIND_COMMIT = 0x01;
    Constants.SCARDVD_CMD_RESOURCE_MANAGER_QUERY_RUNNING = 0x03;
    Constants.SCARDVD_CMD_RESOURCE_MANAGER_QUERY_RUNNING_CANCEL = 0x04;
    Constants.SCARDVD_CMD_ESTABLISH_CONTEXT_REQUEST = 0x05;
    Constants.SCARDVD_CMD_RELEASE_CONTEXT_REQUEST = 0x06;
    Constants.SCARDVD_CMD_ESTABLISH_CONTEXT_REPLY = 0x85;
    Constants.SCARDVD_CMD_RELEASE_CONTEXT_REPLY = 0x86;
    Constants.SCARDVD_CMD_READERS_STATUS = 0x82;
    Constants.SCARDVD_CMD_RESOURCE_MANAGER_RUNNING = 0x83;
    Constants.SCARDVD_CMD_RESOURCE_MANAGER_STOPPED = 0x84;
    Constants.SCARDVD_CMD_LIST_READERS_REQUEST = 0x13;
    Constants.SCARDVD_CMD_LIST_READERS_REPLY = 0x93;
    Constants.SCARD_CMD_CONNECT_REQUEST = 0x15;
    Constants.SCARD_CMD_CONNECT_REPLY = 0x95;
    Constants.SCARD_CMD_RECONNECT_REQUEST = 0x16;
    Constants.SCARD_CMD_RECONNECT_REPLY = 0x96;
    Constants.SCARD_CMD_BEGIN_TRANSACTION_REQUEST = 0x19;
    Constants.SCARD_CMD_BEGIN_TRANSACTION_REPLY = 0x99;
    Constants.SCARD_CMD_STATUS_REQUEST = 0x18;
    Constants.SCARD_CMD_STATUS_REPLY = 0x98;
    Constants.SCARDVD_CMD_GET_READER_CAPABILITIES_REQUEST = 0x1E;
    Constants.SCARDVD_CMD_GET_READER_CAPABILITIES_REPLY = 0x9E;
    Constants.SCARDVD_CMD_TRANSMIT_REQUEST = 0x1C;
    Constants.SCARDVD_CMD_TRANSMIT_REPLY = 0x9C;
    Constants.SCARDVD_CMD_END_TRANSACTION_REQUEST = 0x1A;
    Constants.SCARDVD_CMD_END_TRANSACTION_REPLY = 0x9A;
    Constants.SCARDVD_CMD_DISCONNECT_REQUEST = 0x17;
    Constants.SCARDVD_CMD_DISCONNECT_REPLY = 0x97;
    Constants.SCARDVD_CMD_IS_VALID_CONTEXT_REQUEST = 0x20;
    Constants.SCARDVD_CMD_IS_VALID_CONTEXT_REPLY = 0xA0;
    Constants.SCARDVD_CMD_CONTROL_REQUEST = 0x1D;
    Constants.SCARDVD_CMD_CONTROL_REPLY = 0x9D;
    Constants.SCARDVD_CMD_TRANSACTION_CANCEL_REQUEST = 0x1B;
    Constants.SCARDVD_CMD_TRANSACTION_CANCEL_REPLY = 0x9B;

    //capabilities
    Constants.SCARDVD_CAP_TYPE_NATIVE_OS_SCARD_SUPPORT = 0x01;
    Constants.SCARDVD_CAP_TYPE_STRING_ENCODING = 0x02;
    Constants.SCARDVD_CAP_TYPE_EXTENDED_COMMAND_SUPPORT = 0x03;
    Constants.SCARDVD_CAP_TYPE_READER_PNP_SUPPORT = 0x04;
    Constants.SCARDVD_CAP_TYPE_RESOURCE_MANAGER_STATUS_SUPPORT = 0x05;
    Constants.SCARDVD_CAP_TYPE_CONCURRENT_PROTOCOL_SUPPORT = 0x06;
    Constants.SCARDVD_CAP_TYPE_READER_INFO_SUPPORT = 0x07;
    //extended capabilities
    Constants.SCARDVD_EXTENDED_TRANSMIT = 0x01;
    Constants.SCARDVD_EXTENDED_CONTROL = 0x02;
    //string encoding types
    Constants.CTXSCARD_STRING_ENCODING_ASCII = 0x01;
    Constants.CTXSCARD_STRING_ENCODING_UNICODE = 0x02;

    //attributes
    Constants.SCARD_ATTR_ATR_STRING = 590595;
    Constants.SCARD_ATTR_DEVICE_FRIENDLY_NAME = 2147418117;
    Constants.SCARD_ATTR_DEVICE_FRIENDLY_NAME_A = 2147418115;
    Constants.SCARD_ATTR_DEVICE_SYSTEM_NAME = 2147418118;
    Constants.SCARD_ATTR_ICC_INTERFACE_STATUS = 590593;
    Constants.SCARD_ATTR_ICC_PRESENCE = 590592;
    Constants.SCARD_ATTR_MAXINPUT = 499719;
    Constants.SCARD_ATTR_VENDOR_IFD_SERIAL_NO = 65795;
    Constants.SCARD_ATTR_VENDOR_IFD_VERSION = 65794;
    Constants.SCARD_ATTR_VENDOR_NAME = 65792;
    Constants.SCARD_ATTR_CURRENT_PROTOCOL_TYPE = 524801;
    Constants.SCARD_ATTR_CHANNEL_ID = 131344;

    //disposition flag
    Constants.SCARD_STATE_EMPTY = 0x0010;
    Constants.SCARD_PRESENT = 0x0004;

    //errors
    Constants.CTXSCARD_E_TIMEOUT = 0x8010000A;
    Constants.CTXSCARD_E_INVALID_HANDLE = 0x80100003;
    Constants.CTXSCARD_E_INVALID_PARAMETER = 0x80100004;
    Constants.CTXSCARD_E_INVALID_VALUE = 0x80100011;
    Constants.CTXSCARD_E_CANCELLED = 0x80100002;
    Constants.CTXSCARD_E_NO_MEMORY = 0x80100006;
    Constants.CTXSCARD_E_INSUFFICIENT_BUFFER = 0x80100008;
    Constants.CTXSCARD_E_UNKNOWN_READER = 0x80100009;
    Constants.CTXSCARD_E_SHARING_VIOLATION = 0x8010000B;
    Constants.CTXSCARD_E_NO_SMARTCARD = 0x8010000C;
    Constants.CTXSCARD_E_UNKNOWN_CARD = 0x8010000D;
    Constants.CTXSCARD_E_PROTO_MISMATCH = 0x8010000F;
    Constants.CTXSCARD_E_NOT_READY = 0x80100010;
    Constants.CTXSCARD_E_SYSTEM_CANCELLED = 0x80100012;
    Constants.CTXSCARD_E_NOT_TRANSACTED = 0x80100016;
    Constants.CTXSCARD_E_READER_UNAVAILABLE = 0x80100017;
    Constants.CTXSCARD_E_BAD_SEEK = 0x80100029;
    Constants.CTXSCARD_E_CANT_DISPOSE = 0x8010000E;
    Constants.CTXSCARD_E_CARD_UNSUPPORTED = 0x8010001C;
    Constants.CTXSCARD_E_CERTIFICATE_UNAVAILABLE = 0x8010002D;
    Constants.CTXSCARD_E_COMM_DATA_LOST = 0x8010002F;
    Constants.CTXSCARD_E_DIR_NOT_FOUND = 0x80100023;
    Constants.CTXSCARD_E_DUPLICATE_READER = 0x8010001B;
    Constants.CTXSCARD_E_FILE_NOT_FOUND = 0x80100024;
    Constants.CTXSCARD_E_ICC_CREATEORDER = 0x80100021;
    Constants.CTXSCARD_E_ICC_INSTALLATION = 0x80100020;
    Constants.CTXSCARD_E_INVALID_ATR = 0x80100015;
    Constants.CTXSCARD_E_INVALID_CHV = 0x8010002A;
    Constants.CTXSCARD_E_INVALID_TARGET = 0x80100005;
    Constants.CTXSCARD_E_NO_ACCESS = 0x80100027;
    Constants.CTXSCARD_E_NO_DIR = 0x80100025;
    Constants.CTXSCARD_E_NO_FILE = 0x80100026;
    Constants.CTXSCARD_E_NO_READERS_AVAILABLE = 0x8010002E;
    Constants.CTXSCARD_E_NO_SERVICE = 0x8010001D;
    Constants.CTXSCARD_E_NO_SUCH_CERTIFICATE = 0x8010002C;
    Constants.CTXSCARD_E_PCI_TOO_SMALL = 0x80100019;
    Constants.CTXSCARD_E_READER_UNSUPPORTED = 0x8010001A;
    Constants.CTXSCARD_E_SERVICE_STOPPED = 0x8010001E;
    Constants.CTXSCARD_E_UNEXPECTED = 0x8010001F;
    Constants.CTXSCARD_E_UNKNOWN_RES_MNG = 0x8010002B;
    Constants.CTXSCARD_E_UNSUPPORTED_FEATURE = 0x80100022;
    Constants.CTXSCARD_E_WRITE_TOO_MANY = 0x80100028;
    Constants.CTXSCARD_F_COMM_ERROR = 0x80100013;
    Constants.CTXSCARD_F_INTERNAL_ERROR = 0x80100001;
    Constants.CTXSCARD_F_UNKNOWN_ERROR = 0x80100014;
    Constants.CTXSCARD_F_WAITED_TOO_LONG = 0x80100007;
    Constants.CTXSCARD_P_SHUTDOWN = 0x80100018;
    Constants.CTXSCARD_W_CANCELLED_BY_USER = 0x8010006E;
    Constants.CTXSCARD_W_CHV_BLOCKED = 0x8010006C;
    Constants.CTXSCARD_W_EOF = 0x8010006D;
    Constants.CTXSCARD_W_SECURITY_VIOLATION = 0x8010006A;
    Constants.CTXSCARD_W_WRONG_CHV = 0x8010006B;
    Constants.CTXSCARD_W_UNSUPPORTED_CARD = 0x80100065;
    Constants.CTXSCARD_W_UNRESPONSIVE_CARD = 0x80100066;
    Constants.CTXSCARD_W_UNPOWERED_CARD = 0x80100067;
    Constants.CTXSCARD_W_RESET_CARD = 0x80100068;
    Constants.CTXSCARD_W_REMOVED_CARD = 0x80100069;

    //scopes
    Constants.CTXSCARD_SCOPE_USER = 0x00000000;
    Constants.CTXSCARD_SCOPE_TERMINAL = 0x00000001;
    Constants.CTXSCARD_SCOPE_SYSTEM = 0x00000002;

    //shared mode
    Constants.CTXSCARD_SHARE_EXCLUSIVE = 0x00000001;
    Constants.CTXSCARD_SHARE_SHARED = 0x00000002;
    Constants.CTXSCARD_SHARE_DIRECT = 0x00000003;

    //protocols
    Constants.CTXSCARD_PROTOCOL_UNDEFINED = 0x00000000;
    Constants.CTXSCARD_PROTOCOL_DEFAULT = 0x80000000;
    Constants.CTXSCARD_PROTOCOL_OPTIMAL = 0x00000000;
    Constants.CTXSCARD_PROTOCOL_T0 = 0x00000001;
    Constants.CTXSCARD_PROTOCOL_T1 = 0x00000002;
    Constants.CTXSCARD_PROTOCOL_RAW = 0x00010000;

    //reader commands
    Constants.CTXSCARD_LEAVE_CARD = 0x00000000;
    Constants.CTXSCARD_RESET_CARD = 0x00000001;
    Constants.CTXSCARD_UNPOWER_CARD = 0x00000002;
    Constants.CTXSCARD_EJECT_CARD = 0x00000003;

    //card commands
    Constants.CTXSCARD_UNKNOWN = 0x00000000;
    Constants.CTXSCARD_ABSENT = 0x00000001;
    Constants.CTXSCARD_PRESENT = 0x00000002;
    Constants.CTXSCARD_SWALLOWED = 0x00000003;
    Constants.CTXSCARD_POWERED = 0x00000004;
    Constants.CTXSCARD_NEGOTIABLE = 0x00000005;
    Constants.CTXSCARD_SPECIFIC = 0x00000006;
    Constants.SCARD_UNKNOWN = 0x0001;
    Constants.SCARD_ABSENT = 0x0002;
    Constants.SCARD_PRESENT = 0x0004;
    Constants.SCARD_SWALLOWED = 0x0008;
    Constants.SCARD_POWERED = 0x0010;
    Constants.SCARD_NEGOTIABLE = 0x0020;
    Constants.SCARD_SPECIFIC = 0x0040;
    Constants.CTXSCARD_PROVIDER_PRIMARY = 0x00000001;
    Constants.CTXSCARD_PROVIDER_CSP = 0x00000002;
    Constants.CTXSCARD_CANCEL_TRANSACTION_SUPPORT = 0x00000001;
    Constants.CTXSCARD_IS_VALID_RM_CONTEXT_SUPPORT = 0x00000002;
    Constants.CTXSCARD_GET_CARD_TYPE_PROVIDER_NAME_SUPPORT = 0x00000004;
    Constants.CTXSCARD_SET_CARD_TYPE_PROVIDER_NAME_SUPPORT = 0x00000008;

    Constants.CTXSCARD_INFINITE = 0xFFFFFFFF;

    //reader status
    //SCARDVD_FLAG_READER_PNP_READER_PLUGGED
    Constants.READER_PLUGGED = 0x01;
    Constants.READER_UNPLUGGED = 0x02;

    //card status
    Constants.CTXSCARD_STATE_UNAWARE = 0x00000000;
    Constants.CTXSCARD_STATE_IGNORE = 0x00000001;
    Constants.CTXSCARD_STATE_CHANGED = 0x00000002;
    Constants.CTXSCARD_STATE_UNKNOWN = 0x00000004;
    Constants.CTXSCARD_STATE_UNAVAILABLE = 0x00000008;
    Constants.CTXSCARD_STATE_EMPTY = 0x00000010;
    Constants.CTXSCARD_STATE_PRESENT = 0x00000020;
    Constants.CTXSCARD_STATE_ATRMATCH = 0x00000040;
    Constants.CTXSCARD_STATE_EXCLUSIVE = 0x00000080;
    Constants.CTXSCARD_STATE_INUSE = 0x00000100;
    Constants.CTXSCARD_STATE_MUTE = 0x00000200;
    Constants.CTXSCARD_STATE_UNPOWERED = 0x00000400;

    SCard.Constants = Constants;
})(SCard || (SCard = {}));
