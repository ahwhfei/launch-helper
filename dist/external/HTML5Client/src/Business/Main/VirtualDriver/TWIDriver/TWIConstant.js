var twiConstant = function() {
	var TWI_CONSTANT = { };
	
	
	
	
	
	
	
	
	
	
	TWI_CONSTANT.TWI_PACKET_START = 1;
	TWI_CONSTANT.TWI_PACKET_OPEN = 2;
	TWI_CONSTANT.TWI_PACKET_CLOSE = 3;
	TWI_CONSTANT.TWI_PACKET_CREATEW = 10;
	TWI_CONSTANT.TWI_PACKET_DELETEW = 11;
	TWI_CONSTANT.TWI_PACKET_CHANGEW = 12;
	TWI_CONSTANT.TWI_PACKET_SYSINFO = 13;
	TWI_CONSTANT.TWI_PACKET_ICON = 14;
	TWI_CONSTANT.TWI_PACKET_FOREGROUNDW = 20;
	TWI_CONSTANT.TWI_PACKET_SETTOPW = 21;
	TWI_CONSTANT.TWI_PACKET_SETFOCUS = 22;
	TWI_CONSTANT.TWI_PACKET_CREATEMENU = 23;
	TWI_CONSTANT.TWI_PACKET_IGNORE_FOREGROUND = 24;
	TWI_CONSTANT.TWI_PACKET_SIZEBOX = 25;
	TWI_CONSTANT.TWI_PACKET_SYSTRAY_CMD = 26;
	TWI_CONSTANT.TWI_PACKET_SERVER_CODEPAGE = 27;
	TWI_CONSTANT.TWI_PACKET_SPA_STATUS = 50;
	TWI_CONSTANT.TWI_PACKET_WINDOW_REGION = 51;

	TWI_CONSTANT.TWI_PACKET_LOGIN_SUCCEEDED = 58;
	TWI_CONSTANT.TWI_PACKET_ICON_V2 = 62;
	TWI_CONSTANT.TWI_PACKET_CREATEW_V2 = 63;
	TWI_CONSTANT.TWI_PACKET_CREATEP = 64;
	TWI_CONSTANT.TWI_PACKET_DELETEP = 65;
	TWI_CONSTANT.TWI_PACKET_PREVIEW_DATA = 66;

	TWI_CONSTANT.TWI_PACKET_C2H_START_ACK = 1;
	TWI_CONSTANT.TWI_PACKET_C2H_OPEN = 2;
	TWI_CONSTANT.TWI_PACKET_C2H_CLOSE = 3;
	TWI_CONSTANT.TWI_PACKET_C2H_REDRAW = 4;
	TWI_CONSTANT.TWI_PACKET_C2H_PAUSE = 5;
	TWI_CONSTANT.TWI_PACKET_C2H_RESUME = 6;
	TWI_CONSTANT.TWI_PACKET_C2H_SETPOS = 10;
	TWI_CONSTANT.TWI_PACKET_C2H_SETFOCUS = 11;
	TWI_CONSTANT.TWI_PACKET_C2H_RESTORE = 12;
	TWI_CONSTANT.TWI_PACKET_C2H_TERMINATE = 14;
	TWI_CONSTANT.TWI_PACKET_C2H_RESENDWND = 20;
	TWI_CONSTANT.TWI_PACKET_C2H_SET_WND_MOBILE = 49;
	TWI_CONSTANT.TWI_PACKET_C2H_STARTAPP = 50;
	TWI_CONSTANT.TWI_PACKET_C2H_LOGOUT = 51;
	TWI_CONSTANT.TWI_PACKET_C2H_START_PUBLICAPP = 52;
	TWI_CONSTANT.TWI_PACKET_C2H_CLIENTINFO = 53;
	TWI_CONSTANT.TWI_PACKET_C2H_SEND_MESSAGE = 54;
	TWI_CONSTANT.TWI_PACKET_SYSCOLORS = 55;
	TWI_CONSTANT.TWI_PACKET_WININFO = 56;
	TWI_CONSTANT.TWI_PACKET_C2H_REQUEST_WININFO = 57;
	TWI_CONSTANT.TWI_PACKET_C2H_MONITOR_LAYOUTINFO = 59;
	TWI_CONSTANT.TWI_PACKET_C2H_CLOSEWND	= 60;
	TWI_CONSTANT.TWI_PACKET_C2H_CLIENTINFOEX	= 61;

	/*
	 * client capability bit definitions.
	 */
	TWI_CONSTANT.TWI_CLIENT_FLAG_ZLC = 0x00000001;
	TWI_CONSTANT.TWI_CLIENT_FLAGS_NO_TWI = 0x00000002;
	TWI_CONSTANT.TWI_CLIENT_FLAG_WINDOWREGION = 0x00000004;
	TWI_CONSTANT.TWI_CLIENT_FLAG_FLASHWINDOW = 0x00000008;
	TWI_CONSTANT.TWI_CLIENT_FLAG_MM_ENABLED = 0x00000010;
	TWI_CONSTANT.TWI_CLIENT_FLAG_PRESERVE_WINDOW_ENABLED = 0x00000020;
	TWI_CONSTANT.TWI_CLIENT_FLAG_BALLOONSYSTRAY = 0x00000040;
	TWI_CONSTANT.TWI_CLIENT_FLAG_EXT_WND_PROCESS_INFO = 0x00000080;
	TWI_CONSTANT.TWI_CLIENT_FLAG_ICON_V2_EXT = 0x00000100;
	TWI_CONSTANT.TWI_CLIENT_FLAG_JUMBO_ICONS = 0x00000200;
	TWI_CONSTANT.TWI_CLIENT_FLAG_EXTRA_LARGE_ICONS = 0x00000400;
	TWI_CONSTANT.TWI_CLIENT_FLAG_CACHE_ICONS = 0x00000800;
	TWI_CONSTANT.TWI_CLIENT_FLAG_STR_UTF8_CAPABLE = 0x00001000;
	TWI_CONSTANT.TWI_CLIENT_FLAG_PREVIEW = 0x00002000;
	TWI_CONSTANT.TWI_CLIENT_FLAG_MOBILE_WINDOW = 0x01000000;

	TWI_CONSTANT.HOST_AGENT_FLAGS_ZL_CAPABLE = 0x00000001;
	TWI_CONSTANT.HOST_AGENT_FLAGS_DISABLE_MODALITY_CHECK = 0x00000002;
	TWI_CONSTANT.HOST_AGENT_FLAGS_MODALITY_PASSTOSERVER = 0x00000004;
	TWI_CONSTANT.HOST_AGENT_FLAGS_CLIENT_SEND_CODEPAGE = 0x00000008;
	TWI_CONSTANT.HOST_AGENT_FLAGS_MM_MAXIMIZE_SUPPORT = 0x00000010;
	TWI_CONSTANT.HOST_AGENT_FLAGS_PRESERVE_WINDOW_SUPPORT = 0x00000020;
	TWI_CONSTANT.HOST_AGENT_FLAGS_DISABLE_MINIMIZE_ALL = 0x00000040;
	TWI_CONSTANT.HOST_AGENT_FLAGS_BALLOONSYSTRAY = 0x00000080;
	TWI_CONSTANT.HOST_AGENT_FLAGS_UTF8_CAPABLE = 0x00000100;
	TWI_CONSTANT.HOST_AGENT_FLAGS_CLOSEWND = 0x00000200;
	TWI_CONSTANT.HOST_AGENT_FLAGS_CLIENTINFOEX = 0x00000400;
	TWI_CONSTANT.HOST_AGENT_FLAGS_EXT_WND_PROCESS_INFO = 0x00000800;
	TWI_CONSTANT.HOST_AGENT_FLAGS_ICON_V2_EXT = 0x00001000;
	TWI_CONSTANT.HOST_AGENT_FLAGS_EXTRA_LARGE_ICONS = 0x00002000;
	TWI_CONSTANT.HOST_AGENT_FLAGS_JUMBO_ICONS = 0x00004000;
	TWI_CONSTANT.HOST_AGENT_FLAGS_CACHE_ICONS = 0x00008000;
	TWI_CONSTANT.HOST_AGENT_FLAGS_STR_UTF8_CAPABLE = 0x00010000;
	TWI_CONSTANT.HOST_AGENT_FLAGS_PREVIEW = 0x00020000;
	TWI_CONSTANT.HOST_AGENT_FLAGS_MOBILE_WINDOW = 0x01000000;
	TWI_CONSTANT.HOST_AGENT_FLAGS_REVERSE_SEAMLESS = 0x10000000;
	
	
	
	
	TWI_CONSTANT.TWI_SMALL_ICON = 0;
	TWI_CONSTANT.TWI_LARGE_ICON = 1;
	TWI_CONSTANT.TWI_EXTRA_LARGE_ICON = 2;
	TWI_CONSTANT.TWI_JUMBO_ICON = 3;
	TWI_CONSTANT.CP_UTF8 = 65001;
	TWI_CONSTANT.ASCII = 0;
	TWI_CONSTANT.TWI_MAXIMUM_NUMBER_OF_WINDOWS = 128;
	TWI_CONSTANT.TWI_WS_OVERLAPPED = 0x00000000;
	TWI_CONSTANT.TWI_WS_POPUP = 0x80000000;
	TWI_CONSTANT.TWI_WS_CHILD = 0x40000000;
	TWI_CONSTANT.TWI_WS_MINIMIZE = 0x20000000;
	TWI_CONSTANT.TWI_WS_VISIBLE = 0x10000000;
	TWI_CONSTANT.TWI_WS_DISABLED = 0x08000000;
	TWI_CONSTANT.TWI_WS_CLIPSIBLINGS = 0x04000000;
	TWI_CONSTANT.TWI_WS_CLIPCHILDREN = 0x02000000;
	TWI_CONSTANT.TWI_WS_MAXIMIZE = 0x01000000;
	TWI_CONSTANT.TWI_WS_CAPTION = 0x00000400;
	TWI_CONSTANT.TWI_WS_BORDER = 0x00800000;
	TWI_CONSTANT.TWI_WS_DLGFRAME = 0x00400000;
	TWI_CONSTANT.TWI_WS_VSCROLL = 0x00200000;
	TWI_CONSTANT.TWI_WS_HSCROLL = 0x00100000;
	TWI_CONSTANT.TWI_WS_SYSMENU = 0x00080000;
	TWI_CONSTANT.TWI_WS_THICKFRAME = 0x00040000;
	TWI_CONSTANT.TWI_WS_SIZEBOX = 0x00040000;
	TWI_CONSTANT.TWI_WS_GROUP = 0x00020000;
	TWI_CONSTANT.TWI_WS_TABSTOP = 0x00010000;
	TWI_CONSTANT.TWI_WS_MINIMIZEBOX = 0x00020000;
	TWI_CONSTANT.TWI_WS_MAXIMIZEBOX = 0x00010000;

	TWI_CONSTANT.TWI_WS_EX_DLGMODALFRAME = 0x00000001;
	TWI_CONSTANT.TWI_WS_EX_NOPARENTNOTIFY = 0x00000004;
	TWI_CONSTANT.TWI_WS_EX_TOPMOST = 0x00000008;
	TWI_CONSTANT.TWI_WS_EX_ACCEPTFILES = 0x00000010;
	TWI_CONSTANT.TWI_WS_EX_TRANSPARENT = 0x00000020;
	TWI_CONSTANT.TWI_WS_EX_MDICHILD = 0x00000040;
	TWI_CONSTANT.TWI_WS_EX_TOOLWINDOW = 0x00000080;
	TWI_CONSTANT.TWI_WS_EX_WINDOWEDGE = 0x00000100;
	TWI_CONSTANT.TWI_WS_EX_CLIENTEDGE = 0x00000200;
	TWI_CONSTANT.TWI_WS_EX_CONTEXTHELP = 0x00000400;
	TWI_CONSTANT.TWI_WS_EX_RIGHT = 0x00001000;
	TWI_CONSTANT.TWI_WS_EX_LEFT = 0x00000000;
	TWI_CONSTANT.TWI_WS_EX_RTLREADING = 0x00002000;
	TWI_CONSTANT.TWI_WS_EX_LTRREADING = 0x00000000;
	TWI_CONSTANT.TWI_WS_EX_LEFTSCROLLBAR = 0x00004000;
	TWI_CONSTANT.TWI_WS_EX_RIGHTSCROLLBAR = 0x00000000;
	TWI_CONSTANT.TWI_WS_EX_CONTROLPARENT = 0x00010000;
	TWI_CONSTANT.TWI_WS_EX_STATICEDGE = 0x00020000;
	TWI_CONSTANT.TWI_WS_EX_APPWINDOW = 0x00040000;
	TWI_CONSTANT.TWI_WS_EX_NOACTIVATE = 0x08000000;

	TWI_CONSTANT.TWI_DEF_EX_STYLE = TWI_CONSTANT.TWI_WS_EX_NOPARENTNOTIFY;

	// Flags in Use by the Following Commands: TWI_PACKET_CREATEW, TWI_PACKET_CREATEW_V2, TWI_PACKET_CHANGEW, TWI_PACKET_CREATEMENU

	TWI_CONSTANT.TWI_EF_CORNER = 1;
	/* right bottom corner */
	TWI_CONSTANT.TWI_EF_INACTIVE = 2;
	/* Window not active */
	TWI_CONSTANT.TWI_EF_USERCAPTION = 4;
	/* user-emulated caption */
	TWI_CONSTANT.TWI_EF_NOCAPTION = 8;
	/* no caption or incompatible window */
	TWI_CONSTANT.TWI_EF_IME = 16;
	/* IME related window */

	// Flags in Use by the Following Commands: TWI_PACKET_ICON_V2

	TWI_CONSTANT.TWI_EF_WND_PROCESS_EVENT = 32;
	/* Specifies that the packet contains icon information from the module of a process that has been created (HostID field will be NULL) */

	// Generic flags (currently only in use by TWI_PACKET_ICON_V2 but in the future can be used by any command that is extended to cope with the ICA packet size limit)

	TWI_CONSTANT.TWI_EF_EXT_DATA = 64;
	// Command structure is immediately followed by a TWI_EXT_DATA structure. If this flag is set, then TWI_EF_MORE_EXT_COMMANDS must also be set. This packet contains the first chunk of extended data.
	TWI_CONSTANT.TWI_EF_MORE_EXT_COMMANDS = 128;
	// More extension commands follow this command. The Seamless command byte in the extension command sequence is the same.
	TWI_CONSTANT.TWI_EF_CACHE_ICON = 256;
	// The specific icon must be cached by the client and not retransmitted by the host.

	// Flags used only by TWI_PACKET_C2H_PREVIEW_CONTROL and TWI_PACKET_PREVIEW_DATA

	TWI_CONSTANT.TWI_EF_PREVIEW_DIFF_BITMAP = 8192;
	// Specifies that the preview data represents a differential bitmap, and should be XORed with clients last preview bitmap (for the specific seamless window) to generate the new bitmap for display.

	// Flags used only by TWI_PACKET_CREATEW_V2

	TWI_CONSTANT.TWI_EF_EXTRA_LARGE_ICON_PENDING = 512;
	// The host is about to send a TWI_PACKET_ICON_V2 command with an icon of type TWI_EXTRA_LARGE_ICON. The host will not set this flag and will not send the icon if an icon if this type has not been requested, or it is not available, or it is available but has already been cached. See TWI_PACKET_ICON_V2 for more details.
	TWI_CONSTANT.TWI_EF_JUMBO_ICON_PENDING = 1024;
	// The host is about to send a TWI_PACKET_ICON_V2 command with an icon of type TWI_JUMBO_ICON. The host will not set this flag and will not send the icon if an icon if this type has not been requested, or it is not available, or it is available but has already been cached by the client. See TWI_PACKET_ICON_V2 for more details.

	TWI_CONSTANT.TWI_EF_SYSTEM_PROCESS = 2048;
	// The process is identified as a system process. For example, logonui.exe, csrss.exe, wfshell.exe, etc. Currently, a list of well-known system processes is configured on the host. This flag serves as a hint to the client to ignore the process for purposes of client UI integration, e.g., with the Mac Dock.
	TWI_CONSTANT.TWI_EF_INITIAL_PROCESS = 4096;
	// The process is the initial process in the remote session associated with the published application and directly resulting from the client-requested published application launch.  For example, winword.exe, iexplore.exe, etc. During Seamless session sharing each subsequent application launch will create an additional initial process. Processes launched in the remote session as a result of server-side FTA, which also happen to be published applications, are not marked as initial processes.  The same initial process (or processes) are reported following reconnection to disconnected session. This flag serves as a hint to the client for purposes of client UI integration, e.g., with the Mac Dock.

	TWI_CONSTANT.TWI_EF_AUTO_HIDE = 16384;
	// The window has ABS_AUTOHIDE set

	TWI_CONSTANT.TWI_CHANGED_NAME = 1;
	TWI_CONSTANT.TWI_CHANGED_STYLE = 2;
	TWI_CONSTANT.TWI_CHANGED_EXSTYLE = 4;
	TWI_CONSTANT.TWI_CHANGED_RECT = 8;
	TWI_CONSTANT.TWI_CHANGED_CLIENT_RECT = 16;
	TWI_CONSTANT.TWI_CHANGED_OWNER = 32;
	TWI_CONSTANT.TWI_CHANGED_ZORDER = 64;

	TWI_CONSTANT.SC_MINIMIZE = 0xF020;
	TWI_CONSTANT.SC_MAXIMIZE = 0xF030;
	TWI_CONSTANT.WM_SYSCOMMAND = 0x0112;
	/* Regular window regions. */
	TWI_CONSTANT.TWI_REGION_SET = 0;
	/* No region. */
	TWI_CONSTANT.TWI_REGION_CLEAR = 1;
	/* Empty region. */
	TWI_CONSTANT.TWI_REGION_EMPTY = 2;
	/* Set additional window regions that cannot be accommodated in the first region packet. */
	TWI_CONSTANT.TWI_REGION_SET_MORE = 3;


	
	TWI_CONSTANT.TASKBAR_EDGE_LEFT = 0;
	TWI_CONSTANT.TASKBAR_EDGE_TOP  = 1;
	TWI_CONSTANT.TASKBAR_EDGE_RIGHT = 2;
	TWI_CONSTANT.TASKBAR_EDGE_BOTTOM = 3;
	
	
	TWI_CONSTANT.TASKBAR_STATE_NONE = 0 ;
	TWI_CONSTANT.TASKBAR_STATE_AUTOHIDE  = 1;  
	TWI_CONSTANT.TASKBAR_STATE_ALWAYSONTOP = 2;

	/*
	 * MINIMIZEDMETRICS structure
	 * iArrange  values
	 */
	TWI_CONSTANT.ARW_HIDE = 0x0008;
	
	TWI_CONSTANT.PRIMARY = 'primary';
	TWI_CONSTANT.writeSeamlessLog = function(logJson){
		writeHTML5Log(0,"SESSION:|:ICA:|:TWI :|: ={" + JSON.stringify(logJson) + "}= " );
	};
	return TWI_CONSTANT;
}(); 