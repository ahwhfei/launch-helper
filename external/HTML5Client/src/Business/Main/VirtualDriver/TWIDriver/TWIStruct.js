var seamlessContext = {
	pMonitorLayout : null,
	version : {
		clientversion : 3,
		protocolversion : 2
	},
	clientConfig : {
		seamlessMode : true,
		previewEnabled : true,
		useiconV2 : true,
		extraIconV2 : true,
		cacheIcon : true,
		mutimonitor : false
	},
	sysInfo : {/* Frames */
		stdFrameX : null, /*  thickness of the standard frame */
		stdFrameY : null, /*  thickness of the standard frame */
		dlgFrameX : null, /*  thickness of the dialog frame */
		dlgFrameY : null, /*  thickness of the dialog frame */
		stdFrameCCX : null, /*  corner area of the frame */
		stdFrameCCY : null, /*  corner area of the frame */
		dlgFrameCCX : null, /*  corner area of the frame */
		dlgFrameCCY : null, /*  corner area of the frame */
		/* Captions */

		stdCaptY : null, /*  thickness of a standard caption */
		stdCBX : null, /*  size of standard caption button, X */
		stdCBY : null, /*  size of standard caption button, Y */

		mainWindow : null,
		thickFrameX : null,
		thickFrameY : null,
		thinFrameX : null,
		thinFrameY : null,
		thickFrameCCX : null,
		thickFrameCCY : null,
		thinFrameCCX : null,
		thinFrameCCY : null,
		tinyCaptY : null,
		tinyCBX : null,
		tinyCBY : null,
		serverName : null,
		userName : null,
		userDomainName : null
	},
	hostInfo : {
		
		vdaRes : {
		  width : 0xffffffff,
		  height : 0xffffffff  
		},
		hostType : null, /* OS type: 1 - WF1.x, 2 - Hydra */
		hostVersionMajor : null, /* NT version (e.g. for WF will be 3) */
		hostVersionMinor : null, /* NT version (e.g. for WF will be 51) */
		hostAgentVersion : null, /* Host Agent (TWI.DLL) version */
		hostPausedFlag : true,
		g_fWaitingForLogin : true,
		g_dwClientCP : twiConstant.ASCII,
		g_dwHostCP : null,
		lastHostFocusedApp : null,
		lastFocused : null,
		twiVersion : null, /* TWI protocol version (preferred) */
		twiVersionLow : null, /* lowest supported TWI protocol version */
		/* (in case we will support older protocol versions) */

		hostBuild : null, /* just in case of any build-number dep. bugs */

		xRes : null,
		yRes : null,
		/* current state: */
		/* 0 - just started */
		/* 1 - reconnect */
		/* 2 - already active (shadow ?) */
		hostAgentState : null, 
		/* Capabilities, */
		/* enabled features */
		/* and current state */
		hostAgentFlags : null, 
	}
};

function TwiRect() {
	this.left = 0;
	this.top = 0;
	this.right = 0;
	this.bottom = 0;
}

TwiRect.prototype.setData = function(l, t, w, h) {
	this.left = l;
	this.top = t;
	this.right = l + w;
	this.bottom = t + h;
};
TwiRect.prototype.memset = function(value) {
	this.left = value;
	this.top = value;
	this.right = value;
	this.bottom = value;
};
TwiRect.prototype.write = function(buffer, offset) {
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.left);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.top);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.right);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.bottom);
	return offset;
};
TwiRect.prototype.size = 4 + 4 + 4 + 4;

/* minimized window metrics structure */
function TwiMinimizedMetrics() {
	this.cbSize = 20;
	this.iWidth = 154;
	this.iHorzGap = 0;
	this.iVertGap = 0;
	this.iArrange = twiConstant.ARW_HIDE;

}

TwiMinimizedMetrics.prototype.write = function(buffer, offset) {
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.cbSize);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iWidth);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iHorzGap);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iVertGap);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iArrange);
	return offset;
};
TwiMinimizedMetrics.prototype.memset = function(value) {
	this.iWidth = value;
	this.iHorzGap = value;
	this.iVertGap = value;
	this.iArrange = value;
};
TwiMinimizedMetrics.prototype.cbSize = 0;
TwiMinimizedMetrics.prototype.size = 4 * 5;

/* Logical Font Structure */
var TWI_LF_FACESIZE = 32;
function TwiLogFont() {
	this.lfHeight;
	this.lfWidth;
	this.lfEscapement;
	this.lfOrientation;
	this.lfWeight;
	this.lfItalic;
	this.lfUnderline;
	this.lfStrikeOut;
	this.lfCharSet;
	this.lfOutPrecision;
	this.lfClipPrecision;
	this.lfQuality;
	this.lfPitchAndFamily;
	this.lfFaceName = new Uint8Array(TWI_LF_FACESIZE);

}

TwiLogFont.prototype.write = function(buffer, offset) {
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.lfHeight);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.lfWidth);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.lfEscapement);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.lfOrientation);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.lfWeight);
	buffer[offset++] = this.lfItalic;
	buffer[offset++] = this.lfUnderline;
	buffer[offset++] = this.lfStrikeOut;
	buffer[offset++] = this.lfCharSet;
	buffer[offset++] = this.lfOutPrecision;
	buffer[offset++] = this.lfClipPrecision;
	buffer[offset++] = this.lfQuality;
	buffer[offset++] = this.lfPitchAndFamily;
	for (var i = 0; i < TWI_LF_FACESIZE; i++) {
		buffer[offset++] = this.lfFaceName[i];
	}
	return offset;
};
TwiLogFont.prototype.memset = function(value) {
	this.lfHeight = value;
	this.lfWidth = value;
	this.lfEscapement = value;
	this.lfOrientation = value;
	this.lfWeight = value;
	this.lfItalic = value;
	this.lfUnderline = value;
	this.lfStrikeOut = value;
	this.lfCharSet = value;
	this.lfOutPrecision = value;
	this.lfClipPrecision = value;
	this.lfQuality = value;
	this.lfPitchAndFamily = value;
	for (var i = 0; i < TWI_LF_FACESIZE; i++) {
		this.lfFaceName[i] = value;
	}
};
TwiLogFont.prototype.size = 5 * 4 + 8 + TWI_LF_FACESIZE;
function TwiIconMetrics() {
	this.iHorzSpacing;
	this.iVertSpacing;
	this.iTitleWrap;
	this.lfFont = new TwiLogFont();

}

TwiIconMetrics.prototype.write = function(buffer, offset) {
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.cbSize);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iHorzSpacing);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iVertSpacing);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iTitleWrap);
	offset = this.lfFont.write(buffer, offset);
	return offset;
};
TwiIconMetrics.prototype.memset = function(value) {
	this.iHorzSpacing = value;
	this.iVertSpacing = value;
	this.iTitleWrap = value;
	this.lfFont.memset(value);
};
TwiIconMetrics.prototype.size = 4 + 4 + 4 + 4 + TwiLogFont.prototype.size;
TwiIconMetrics.prototype.cbSize = 0;
/* Non client metrics structure */
function TwiNonClientMetrics() {
	this.iBorderWidth;
	this.iScrollWidth;
	this.iScrollHeight;
	this.iCaptionWidth;
	this.iCaptionHeight;
	this.lfCaptionFont = new TwiLogFont();
	this.iSmCaptionWidth;
	this.iSmCaptionHeight;
	this.lfSmCaptionFont = new TwiLogFont();
	this.iMenuWidth;
	this.iMenuHeight;
	this.lfMenuFont = new TwiLogFont();
	this.lfStatusFont = new TwiLogFont();
	this.lfMessageFont = new TwiLogFont();

}

TwiNonClientMetrics.prototype.write = function(buffer, offset) {
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.cbSize);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iBorderWidth);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iScrollWidth);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iScrollHeight);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iCaptionWidth);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iCaptionHeight);
	offset = this.lfCaptionFont.write(buffer, offset);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iSmCaptionWidth);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iSmCaptionHeight);
	offset = this.lfSmCaptionFont.write(buffer, offset);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iMenuWidth);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.iMenuHeight);
	offset = this.lfMenuFont.write(buffer, offset);
	offset = this.lfStatusFont.write(buffer, offset);
	offset = this.lfMessageFont.write(buffer, offset);
	return offset;
};
TwiNonClientMetrics.prototype.memset = function(value) {
	this.iBorderWidth = value;
	this.iScrollWidth = value;
	this.iScrollHeight = value;
	this.iCaptionWidth = value;
	this.iCaptionHeight = value;
	this.lfCaptionFont.memset(value);
	this.iSmCaptionWidth = value;
	this.iSmCaptionHeight = value;
	this.lfSmCaptionFont.memset(value);
	this.iMenuWidth = value;
	this.iMenuHeight = value;
	this.lfMenuFont.memset(value);
	this.lfStatusFont.memset(value);
	this.lfMessageFont.memset(value);
};

TwiNonClientMetrics.prototype.size = 4 + 4 + 4 + 4 + 4 + 4 + TwiLogFont.prototype.size + 4 + 4 + TwiLogFont.prototype.size + 4 + 4 + TwiLogFont.prototype.size + TwiLogFont.prototype.size + TwiLogFont.prototype.size;
TwiNonClientMetrics.prototype.cbSize = 0;
function TwiC2HClientInfoData() {
	this.workArea = new TwiRect();/* client workarea */
	this.borderMultiplier;/* window border multiplier */
	this.nonClientMetrics = new TwiNonClientMetrics();/* non-client settings */
	this.minimizedMetrics = new TwiMinimizedMetrics();/* minimized window settings */
	this.iconMetrics = new TwiIconMetrics();/* Icon settings */

}
TwiC2HClientInfoData.prototype.size = TwiRect.prototype.size + 4 + TwiNonClientMetrics.prototype.size + TwiMinimizedMetrics.prototype.size + TwiIconMetrics.prototype.size;
TwiC2HClientInfoData.prototype.memset = function(value) {
	this.workArea.memset(value);
	this.borderMultiplier = value;
	this.nonClientMetrics.memset(value);
	this.minimizedMetrics.memset(value);
	this.iconMetrics.memset(value);
};
TwiC2HClientInfoData.prototype.write = function(buffer, offset) {
	offset = this.workArea.write(buffer, offset);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.borderMultiplier);
	offset = this.nonClientMetrics.write(buffer, offset);
	offset = this.minimizedMetrics.write(buffer, offset);
	offset = this.iconMetrics.write(buffer, offset);
	return offset;
};

function TwiPreviewData() {
	this.hostID = -1;
	this.extraFlags = 0;
	this.previewInfoByteCount = 0;
	this.pExtendedData = new TwiExtData();
}

function TwiPreviewCacheData() {
	this.iconBufferSize = 0;
	this.currentOffset = 0;
	this.buffer = null;
	this.bDefragCompleted = true;
}

function Twi_Data_C2H_SetPos() {
	this.hostID = -1;
	this.rect = new TwiRect();
}

Twi_Data_C2H_SetPos.prototype.size = 4 + TwiRect.prototype.size;
Twi_Data_C2H_SetPos.prototype.memset = function(value) {
	this.hostID = value;
	this.rect.memset(value);

};
Twi_Data_C2H_SetPos.prototype.setData = function(hostId, left, top, width, height) {
	this.hostID = hostId;
	this.rect.setData(left, top, width, height);
};
Twi_Data_C2H_SetPos.prototype.write = function(buffer, offset) {
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, this.hostID);
	offset = this.rect.write(buffer, offset);
	return offset;
};

function Twi_C2H_Startack_Data() {

	this.clientType;/* Client OS type */
	this.clientVersion;/* Client TWI driver version */
	this.tWIVersion;/* TWI protocol version requested */
	
	/* ==0 - Client want to enable TWI */
	/* ==1 - Client don't want to enable TWI */
	this.action = 1;
	
	/* Capabilities, */
	/* enabled features */
	/* and current state */
	this.clientAgentFlags = 0;

}

/*
function Twi_C2H_MonitorLayoutInfo(buffer){
  this.buffer = buffer;
}

Twi_C2H_MonitorLayoutInfo.prototype.write = function(buffer, offset) {
	buffer[offset++] = this.clientType;
	buffer[offset++] = this.clientVersion;
	buffer[offset++] = this.tWIVersion;
	buffer[offset++] = this.action;
	buffer[offset++] = (this.clientAgentFlags) & 0xff;
	buffer[offset++] = (this.clientAgentFlags >> 8) & 0xff;
	buffer[offset++] = (this.clientAgentFlags >> 16) & 0xff;
	buffer[offset++] = (this.clientAgentFlags >> 24) & 0xff;
	return offset;
};
*/

Twi_C2H_Startack_Data.prototype.size = 1 + 1 + 1 + 1 + 4;
Twi_C2H_Startack_Data.prototype.write = function(buffer, offset) {
	buffer[offset++] = this.clientType;
	buffer[offset++] = this.clientVersion;
	buffer[offset++] = this.tWIVersion;
	buffer[offset++] = this.action;
	buffer[offset++] = (this.clientAgentFlags) & 0xff;
	buffer[offset++] = (this.clientAgentFlags >> 8) & 0xff;
	buffer[offset++] = (this.clientAgentFlags >> 16) & 0xff;
	buffer[offset++] = (this.clientAgentFlags >> 24) & 0xff;
	return offset;
};
function Twi_C2H_Set_Wnd_Mobile() {
	this.enabled = 0;

}

Twi_C2H_Set_Wnd_Mobile.prototype.size = 4;
Twi_C2H_Set_Wnd_Mobile.prototype.write = function(buffer, offset) {
	buffer[offset++] = (this.enabled) & 0xff;
	buffer[offset++] = (this.enabled >> 8) & 0xff;
	buffer[offset++] = (this.enabled >> 16) & 0xff;
	buffer[offset++] = (this.enabled >> 24) & 0xff;
	return offset;
};
/* new process information */
function TwiNewProcessData() {
	this.processID;// Process ID of host process creating the window (value can be full range of DWORD)
	this.parentProcessID;// Process ID of parent process of host process creating the window (value can be full range of DWORD)
	this.extraFlags;// Extra information/flags
	this.moduleFileDesc = null;
	this.moduleFilePath = null;
	this.publishedAppName = null;

}

/* new window WITH extended process information */
function TwiNewWindowDataV2() {
	this.hostID = null;
	/* window ID on the host */
	this.windowStyle = 0;
	/* standard window style dword */
	this.exWindowStyle = 0;
	/* standard Extended style */
	this.position = new TwiRect();
	this.clientRect = new TwiRect();
	this.hostOwner = null;
	/* owner HWND on the host */
	this.processID = null;
	/* Process ID forProvides metadata about the process which created the window on the host, or the process that is created, but has yet to display windows */
	this.extraFlags = 0;
	/* extra info/flags */
	this.windowName = "";
	this.windowGroupID = "";
}

function TwiNewWindowData() {
	this.hostID = null;
	/* window ID on the host */
	this.extraFlags = 0;
	/* extra info/flags */
	this.windowStyle = 0;
	/* standard window style dword */
	this.exWindowStyle = 0;
	/* standard Extended style */
	this.position = new TwiRect();
	this.clientRect = new TwiRect();
	this.hostOwner = null;
	/* owner HWND on the host */
	this.windowName = null;
}

/*
 * window region structure, for TWI_PACKET_WINDOW_REGION
 * variable length packet, will contain number of rectangles at the end
 */
function TwiWindowRegion() {

	this.operation = null;/* TWI_REGION_SET | CLEAR | EMPTY | SET_MORE */
	this.hostID = null;/* HWND on the host */
	this.cRectangle = 0;/* number of rectangles in packet (Used only for SET; ignored for others) */
	this.oRectangle = 0;/* Offset of TWI_RECT array (Used only for SET; ignored for others)*/
	this.rectArr = [];

}

function TwiSizeBoxData() {
	this.hostID = -1;
	this.sizeBoxRect = new TwiRect();
} ;

// Used to support additional process information and fragmentation

function TwiIconDataV2() {
	this.hostID = -1;// Window ID on the host
	this.processID = -1;// Process ID of the process module, which provides the icon information
	this.iconType = -1;// Icon type (Large or Small)
	this.extraFlags = 0;// Extra information/flags. See detailed description below and in section Extra Flags.
	this.iconInfoObj = {};
}

function TwiIconDataV1() {
	this.hostID = -1;// Window ID on the host
	this.iconType = -1;// Icon type (Large or Small)
	this.iconInfoObj = {};
}
/* process termination */

function TwiDeleteProcessData() {
	this.processID = -1;// Process ID of host process
	this.extraFlags = 0;// Extra information/flags (reserved for future use)
}

/* Change Window structure

 This structure is used as a parameter for Change Window request and contains the updated window information.

 */

function TwiChangeWindowDataInt() {

	this.hostID = -1;/* window ID on the host */
	this.changeMask = 0;/* bitmask what was changed */
	this.extraFlags = 0;/* extra info */
	this.windowStyle = null;/* standard window style dword, */
	this.exWindowStyle = null;/* standard Extended style, */
	this.position = new TwiRect();
	this.clientRect = new TwiRect();
	this.hostOwner = -1;/* owner HWND on the host. */
	this.hwndAboveMe = null;/* the remote window that should be *//* above this window */

	this.windowName = null;

}

function TwiIconData() {
	this.iconBufferSize = 0;
	this.currentOffset = 0;
	this.buffer = null;
	this.bDefragCompleted = true;
	this.bCacheIcon = false;
	this.pExtendedData = new TwiExtData();
}

function TwiExtData() {
	this.totalByteCount = 0;
}

function Twi_C2H_SetFocus(hostID) {
	this.hostID = hostID;

};
Twi_C2H_SetFocus.prototype.write = function(buffer, offset) {
	buffer[offset++] = (this.hostID) & 0xff;
	buffer[offset++] = (this.hostID >> 8) & 0xff;
	buffer[offset++] = (this.hostID >> 16) & 0xff;
	buffer[offset++] = (this.hostID >> 24) & 0xff;
	return offset;
};
Twi_C2H_SetFocus.prototype.size = 4;
function Twi_C2H_Terminate(hostID) {
	this.hostID = hostID;

};
Twi_C2H_Terminate.prototype.write = function(buffer, offset) {
	buffer[offset++] = (this.hostID) & 0xff;
	buffer[offset++] = (this.hostID >> 8) & 0xff;
	buffer[offset++] = (this.hostID >> 16) & 0xff;
	buffer[offset++] = (this.hostID >> 24) & 0xff;
	return offset;
};
Twi_C2H_Terminate.prototype.size = 4;

function Twi_C2H_CloseWnd (hostID) {
	this.hostID = hostID;

};
Twi_C2H_CloseWnd.prototype.write = function(buffer, offset) {
	buffer[offset++] = (this.hostID) & 0xff;
	buffer[offset++] = (this.hostID >> 8) & 0xff;
	buffer[offset++] = (this.hostID >> 16) & 0xff;
	buffer[offset++] = (this.hostID >> 24) & 0xff;
	return offset;
};
Twi_C2H_CloseWnd.prototype.size = 4;

function Twi_C2H_ResendWnd (hostID) {
    this.hostID = hostID;
};
Twi_C2H_ResendWnd.prototype.write = function(buffer, offset) {
    buffer[offset++] = (this.hostID) & 0xff;
    buffer[offset++] = (this.hostID >> 8) & 0xff;
    buffer[offset++] = (this.hostID >> 16) & 0xff;
    buffer[offset++] = (this.hostID >> 24) & 0xff;
    return offset;
};
Twi_C2H_ResendWnd.prototype.size = 4;



function TwiSendMessageData() {

	// which host window the message is for
	this.hostID = -1;/* The mesage */
	this.msg = null;
	this.wParam = null;/* Message Parameters */
	this.lParam = null;
	this.timeOut = 0;

}
TwiSendMessageData.prototype.write = function(buffer, offset) {
	buffer[offset++] = (this.hostID) & 0xff;
	buffer[offset++] = (this.hostID >> 8) & 0xff;
	buffer[offset++] = (this.hostID >> 16) & 0xff;
	buffer[offset++] = (this.hostID >> 24) & 0xff;
	buffer[offset++] = (this.msg) & 0xff;
	buffer[offset++] = (this.msg >> 8) & 0xff;
	buffer[offset++] = (this.msg >> 16) & 0xff;
	buffer[offset++] = (this.msg >> 24) & 0xff;
	buffer[offset++] = (this.wParam) & 0xff;
	buffer[offset++] = (this.wParam >> 8) & 0xff;
	buffer[offset++] = (this.wParam >> 16) & 0xff;
	buffer[offset++] = (this.wParam >> 24) & 0xff;
	buffer[offset++] = (this.lParam) & 0xff;
	buffer[offset++] = (this.lParam >> 8) & 0xff;
	buffer[offset++] = (this.lParam >> 16) & 0xff;
	buffer[offset++] = (this.lParam >> 24) & 0xff;
	buffer[offset++] = (this.timeOut) & 0xff;
	buffer[offset++] = (this.timeOut >> 8) & 0xff;
	buffer[offset++] = (this.timeOut >> 16) & 0xff;
	buffer[offset++] = (this.timeOut >> 24) & 0xff;
	return offset;
};
TwiSendMessageData.prototype.size = 20;

function Twi_C2H_Restore() {
	this.hostID = -1;

}
Twi_C2H_Restore.prototype.write = function(buffer, offset) {
	buffer[offset++] = (this.hostID) & 0xff;
	buffer[offset++] = (this.hostID >> 8) & 0xff;
	buffer[offset++] = (this.hostID >> 16) & 0xff;
	buffer[offset++] = (this.hostID >> 24) & 0xff;
	return offset;
};
Twi_C2H_Restore.prototype.size = 4;
