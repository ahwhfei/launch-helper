function CPMCONSTANT(){}

var REQUEST_TAG = 0x40;
var REPLY_TAG   = 0xC0;

// request constants:
CPMCONSTANT.ENUMPRINTER_REQUEST             = REQUEST_TAG | 0;
CPMCONSTANT.OPENPRINTER_REQUEST             = REQUEST_TAG | 1;
CPMCONSTANT.CLOSEPRINTER_REQUEST            = REQUEST_TAG | 2;
CPMCONSTANT.WRITEPRINTER_REQUEST            = REQUEST_TAG | 4;
CPMCONSTANT.CONNECT2_REQUEST                = REQUEST_TAG | 8;

// reply constants:
CPMCONSTANT.ENUMPRINTER_REPLY               = 0xff & (REPLY_TAG | 0);
CPMCONSTANT.OPENPRINTER_REPLY               = 0xff & (REPLY_TAG | 1);
CPMCONSTANT.CLOSEPRINTER_REPLY              = 0xff & (REPLY_TAG | 2);
CPMCONSTANT.WRITEPRINTER_REPLY              = 0xff & (REPLY_TAG | 4);

// error classes:
CPMCONSTANT.CPM_ERROR_NONE       = 0x0000;
CPMCONSTANT.CPM_ERROR_NOTFOUND   = 0x0008;
CPMCONSTANT.CPM_ERROR_INVALID    = 0x0007;
CPMCONSTANT.CPM_ERROR_UNKNOWN    = 0x000E;

// error codes:
CPMCONSTANT.CPM_DOSERROR_NOERROR       = 0x0000;
CPMCONSTANT.CPM_DOSERROR_INVALIDHANDLE = 0x0006;
CPMCONSTANT.CPM_DOSERROR_BADACCESS     = 0x000C;
CPMCONSTANT.CPM_DOSERROR_NOFILES       = 0x0012;
CPMCONSTANT.CPM_DOSERROR_UNKNOWN       = 0x00FF;

//packet size
CPMCONSTANT.OPENPRINTER_REPLY_PACKET_SIZE  = 0x06;
CPMCONSTANT.CLOSEPRINTER_REPLY_PACKET_SIZE = 0x04;
CPMCONSTANT.WRITEPRINTER_REPLY_PACKET_SIZE = 0x06;
CPMCONSTANT.ENUMPRINTER_REPLY_PACKET_HEADER_SIZE =0x08;

//File Sharing Modes
CPMCONSTANT.CPM_EXCLUSIVE_MODE  = 0x10;
CPMCONSTANT.CPM_SHARE_MASK      = 0x70;

//access mode
CPMCONSTANT.CPM_READACCESS      = 0x00;
CPMCONSTANT.CPM_WRITEACCESS     = 0x01;
CPMCONSTANT.CPM_READWRITE       = 0x02;
CPMCONSTANT.CPM_ACCESS_MASK     = 0x07;