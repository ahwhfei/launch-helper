function PacketIdentifier() {
}

PacketIdentifier.PACKET_INIT_REQUEST = 0x00;
PacketIdentifier.PACKET_INIT_CONNECT = 0x02;
PacketIdentifier.PACKET_CALLBACK = 0x03;
PacketIdentifier.PACKET_TERMINATE = 0x05;
PacketIdentifier.PACKET_STOP_OK = 0x08;
PacketIdentifier.PACKET_CLEAR_SCREEN = 0x10;
PacketIdentifier.PACKET_CLEAR_EOL = 0x12;
PacketIdentifier.PACKET_RAW_WRITE0 = 0x14;
PacketIdentifier.PACKET_RAW_WRITE1 = 0x15;
PacketIdentifier.PACKET_RAW_WRITE2 = 0x16;
PacketIdentifier.PACKET_WRTCHARSTRATTR1 = 0x17;
PacketIdentifier.PACKET_WRTCHARSTRATTR2 = 0x18;
PacketIdentifier.PACKET_WRTNCELL1 = 0x19;
PacketIdentifier.PACKET_WRTNCELL2 = 0x1A;
PacketIdentifier.PACKET_BEEP = 0x1B;
PacketIdentifier.PACKET_SETMOU_POSITION = 0x1C;
PacketIdentifier.PACKET_SETMOU_ATTR = 0x1D;
PacketIdentifier.PACKET_SETCUR_POSITION = 0x1E;
PacketIdentifier.PACKET_SETCUR_ROW = 0x1F;
PacketIdentifier.PACKET_SETCUR_COLUMN = 0x20;
PacketIdentifier.PACKET_SETCUR_SIZE = 0x21;
PacketIdentifier.PACKET_SCROLL_SCREEN = 0x22;
PacketIdentifier.PACKET_SCROLLUP = 0x23;
PacketIdentifier.PACKET_SCROLLDN = 0x24;
PacketIdentifier.PACKET_SCROLLLF = 0x25;
PacketIdentifier.PACKET_SCROLLRT = 0x26;
PacketIdentifier.PACKET_SCROLLUP1 = 0x27;
PacketIdentifier.PACKET_SCROLLDN1 = 0x28;
PacketIdentifier.PACKET_SCROLLLF1 = 0x29;
PacketIdentifier.PACKET_SCROLLRT1 = 0x2A;
PacketIdentifier.PACKET_SCROLLUP2 = 0x2B;
PacketIdentifier.PACKET_SCROLLDN2 = 0x2C;
PacketIdentifier.PACKET_SCROLLLF2 = 0x2D;
PacketIdentifier.PACKET_SCROLLRT2 = 0x2E;
PacketIdentifier.PACKET_VIRTUAL_WRITE0 = 0x2F;
PacketIdentifier.PACKET_VIRTUAL_WRITE1 = 0x30;
PacketIdentifier.PACKET_VIRTUAL_WRITE2 = 0x31;
PacketIdentifier.PACKET_SET_GRAPHICS = 0x33;
PacketIdentifier.PACKET_SET_TEXT = 0x34;
PacketIdentifier.PACKET_SET_GLOBAL_ATTR = 0x35;
PacketIdentifier.PACKET_SET_VIDEO_MODE = 0x36;
PacketIdentifier.PACKET_SET_LED = 0x37;
PacketIdentifier.PACKET_VIRTUAL_FLUSH = 0x38;
PacketIdentifier.PACKET_SET_CLIENT_DATA = 0x3B;
PacketIdentifier.PACKET_CHANNEL_MONITORING = 0x3F;
PacketIdentifier.PACKET_COOKIE = 0x41;
PacketIdentifier.PACKET_WDCREDENTIALS = 0x44;

function SubCommand() {
}

SubCommand.TERMINATE_DISCONNECT = 0x00;
SubCommand.TERMINATE_LOGOFF = 0x01;
SubCommand.DEF_MOU_SAMPLING_INTRVL = 150;
SubCommand.COOKIE_COMMAND_DATA = 0x01;
SubCommand.COOKIE_COMMAND_REQUEST = 0x02;

function KeyboardConstant() {
}

KeyboardConstant.KEY_UP_FLAG = 0x01;
KeyboardConstant.KEY_DOWN_FLAG = 0x00;
KeyboardConstant.SPECIAL_KEY_FLAG = 0x02;

function MouseConstant() {
}

MouseConstant.MOUSE_STATUS_MOVED = 0x01;
MouseConstant.MOUSE_STATUS_B1DOWN = 0x02;
MouseConstant.MOUSE_STATUS_B1UP = 0x04;
MouseConstant.MOUSE_STATUS_B2DOWN = 0x08;
MouseConstant.MOUSE_STATUS_B2UP = 0x10;
MouseConstant.MOUSE_STATUS_B3DOWN = 0x20;
MouseConstant.MOUSE_STATUS_B3UP = 0x40;
MouseConstant.MOUSE_STATUS_B4DOWN = 0x02;
MouseConstant.MOUSE_STATUS_B4UP = 0x04;
MouseConstant.MOUSE_STATUS_B5DOWN = 0x08;
MouseConstant.MOUSE_STATUS_B5UP = 0x10;
MouseConstant.MOUSE_STATUS_DBCLK = 0x80;
MouseConstant.MOU_STATUS_WHEEL = 0x20;
MouseConstant.MOUSE_MASK_PRESS = 0xA;
MouseConstant.MOUSE_MASK_RELEASE = 0x54;
MouseConstant.MOUSE_DOUBLECLICK_WINDOW = 500;
MouseConstant.MOUSE_DOUBLECLICK_WINLEN = 10;

MouseConstant.MOUSE_DATA_CLIENT_NORMAL = 0x00;
MouseConstant.MOUSE_DATA_CLIENT_EXTRA = 0x01;

MouseConstant.CLICK_TYPES = new Array(MouseConstant.MOUSE_STATUS_B1DOWN, MouseConstant.MOUSE_STATUS_B3DOWN, MouseConstant.MOUSE_STATUS_B2DOWN, MouseConstant.MOUSE_STATUS_B4DOWN, MouseConstant.MOUSE_STATUS_B5DOWN);
MouseConstant.UI_TYPES = new Array(MouseConstant.MOUSE_DATA_CLIENT_NORMAL, MouseConstant.MOUSE_DATA_CLIENT_NORMAL, MouseConstant.MOUSE_DATA_CLIENT_NORMAL, MouseConstant.MOUSE_DATA_CLIENT_EXTRA, MouseConstant.MOUSE_DATA_CLIENT_EXTRA);
MouseConstant.MOU_STATE = new Array(0);
function ModuleConstant() {
}

ModuleConstant.MODULE_VERSIONL = 1;
ModuleConstant.MODULE_VERSIONH = 9;
ModuleConstant.MODULE_NAME = "WinstationDriver.class";
ModuleConstant.MODULE_HOSTMODULENAME = "WDICA";
ModuleConstant.MODULE_DATE = new Date();
ModuleConstant.MODULE_SIZE = 0;

function ClientConstant() {
}

ClientConstant.CLIENT_NAME_LENGTH = 20;
ClientConstant.DOMAINLENGTH_SHORT = 17;
ClientConstant.USERNAMELENGTH_SHORT = 20;
ClientConstant.PASSWORDLENGTH_SHORT = 14;
ClientConstant.CLIENTDIRLENGTH_SHORT = 256;
ClientConstant.WORKDIRLENGTH_SHORT = 256;
ClientConstant.INITIALPROGLENGTH_SHORT = 256;
ClientConstant.CLIENTNAMELENGTH_SHORT = 20;
/* CLIENT_NAME_LENGTH */
ClientConstant.CLIENTLICENSELENGTH_SHORT = 32;
ClientConstant.DOMAINLENGTH_LONG = 256;
ClientConstant.USERNAMELENGTH_LONG = 256;
ClientConstant.PASSWORDLENGTH_LONG = 256;
ClientConstant.CLIENTDIRLENGTH_LONG = 256;
ClientConstant.WORKDIRLENGTH_LONG = 256;
ClientConstant.INITIALPROGLENGTH_LONG = 256;
ClientConstant.CLIENTNAMELENGTH_LONG = 20;
/* CLIENT_NAME_LENGTH */
ClientConstant.CLIENTLICENSELENGTH_LONG = 32;
