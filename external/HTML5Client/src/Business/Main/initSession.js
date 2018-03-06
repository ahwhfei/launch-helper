function UIEngine(mainEngine1) {
	var mainEngine = mainEngine1;
	var uiWrapper;
	var bb;
	var myself = this;
	var localClipData = {};
	var lastClipChangeTime = 0;
	var mouseEventHandler;
	var clientImeHandler = null;
	var icaFrame;
	var frameWidth = 0;
	var frameHeight = 0;
	var autoInputEvent = {};
	var isMouseDown = false;
	var isKeyPressReq = false;
	var keyDownEvent = null;
	var altDownEvent= null;
	var altFlag=false;
	var keyPressExecuted = false;
	var icaFrame;
	var mobileReceiverView_obj;
	var multiTouchHandler;
	var orientationMode = window.orientation;
	var connectStatus = false;
	var multiTochMode = false;
	
	this.initEngine = function(parentElementId, isError) {
		UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation ,function(displayDetails){
			if(displayDetails.multimonitor == true){
				frameWidth = displayDetails.displayInfo[displayDetails.currentMonitor].bounds.width;
				frameHeight = displayDetails.displayInfo[displayDetails.currentMonitor].bounds.height;
			}else{
				frameWidth = displayDetails.sessionSize.width;
				frameHeight = displayDetails.sessionSize.height;
			}
			if(isError != true){
				mouseEventHandler = new MouseEvtHandler();
                
                // move to multimonitor - eventually rename it later
				var parentElement = document.getElementById(parentElementId);
				//createUIElement(parentElement, frameWidth, frameHeight);
                displayManager.createUiElement(parentElement, frameWidth, frameHeight);
				
                // input
                myself.resetInputHandler(autoInputEvent.mouseflag, autoInputEvent.keyboardflag);
                myself.resetInputHandler(autoInputEvent.mouseflag, autoInputEvent.keyboardflag);
                MediaEncoder.canvas = displayManager.getPointerDiv();
                
				attachEventHandler();
				
			}
			bb = GetBrowserBox();
			bb.SetCallbackWrapper(myself);
			ui = GetUI();
			ui.SetDimensions(frameWidth, frameHeight);
		});
		UiControls.ResolutionUtility.registerCallback(UiControls.ResolutionUtility.constants.vdaSessionSize,onResize);
	};
		
	this.resetMouseHandler = function(enable) {
		this.resetInputHandler(enable, autoInputEvent.keyboardflag);
	};
	this.resetKeyBoardHandler = function(enable) {
		this.resetInputHandler(autoInputEvent.mouseflag, enable);
	};
	this.resetInputHandler = function(mouseflag, keyboardflag) {
		autoInputEvent.mouseflag = mouseflag;
		autoInputEvent.keyboardflag = keyboardflag;
		attachEventHandler(mouseflag, keyboardflag);
		detachEventHandler(mouseflag, keyboardflag);
	};
	function detachEventHandler(mouseflag, keyboardflag) {
		// Fix for BUG0291556 [F11] Cannot scroll using Middle mouse button on a doc which is launched through
		//DOMMouseScroll is for mozilla.
        var superSurface = displayManager.getSuperSurface();
        var rootElement = displayManager.getRootElement();
        
		if (mouseflag == false) {
			if (window.addEventListener) {
				window.addEventListener('DOMMouseScroll', null, false);
            }
			// in case of touch device, add touchevetns handler to canvas
			/*
			 * On window 8 os chrome contain touch event so PlatformInfo.isTouchOS become true
			 * and it prevent mouseevent .Currently this variable  set to false
			 * and register all touch event if any touch event come then that will be touch device and deregister mousedown
			 * mouseup event  , mousemove event
			 */
			if (superSurface) {
				superSurface.ontouchstart = null;
				superSurface.ontouchend = null;
				superSurface.ontouchmove = null;
				superSurface.onmousedown = null;
				superSurface.onmouseup = null;
				superSurface.onmousemove = null;
				superSurface.onmouseout = null;
				superSurface.onmouseover = null;
				superSurface.onmousewheel = null;
				superSurface.oncontextmenu = function(evt) {
					return false;
				};
				superSurface.onselectstart = function(evt) {
					return false;
				};

				// Remove any mouse event handler attached in documen
				// for chromeapp
				if (g.environment.receiver.isChromeApp) {
					document.onmouseup = null;
					document.onmousemove = null;
				}
			}
			document.body.onblur = null;
		}
		if (keyboardflag == false) {
			if (rootElement) {
				rootElement.onkeydown = null;
				rootElement.onkeyup = null;
				rootElement.onkeypress = null;
			}
		}

	}

	function attachEventHandler(mouseflag, keyboardflag) {
		// Fix for BUG0291556 [F11] Cannot scroll using Middle mouse button on a doc which is launched through
		//DOMMouseScroll is for mozilla.
        var superSurface = displayManager.getSuperSurface();
        var rootElement = displayManager.getRootElement();
        
		if (mouseflag == true) {
			if (window.addEventListener) {
				window.addEventListener('DOMMouseScroll', ffwheelhandler, false);
            }

			// in case of touch device, add touchevetns handler to canvas
			/*
			 * On window 8 os chrome contain touch event so PlatformInfo.isTouchOS become true
			 * and it prevent mouseevent .Currently this variable  set to false
			 * and register all touch event if any touch event come then that will be touch device and deregister mousedown
			 * mouseup event  , mousemove event
			 */
			if (superSurface) {
                //for seamless to redirect events in seamless ui div to session
                superSurface.inputEvt = mouseEventHandler.inputEvt;
            
                console.info("mouse evnetreg");
				superSurface.ontouchstart = mouseEventHandler.inputEvt;
				superSurface.ontouchend = mouseEventHandler.inputEvt;
				superSurface.ontouchmove = mouseEventHandler.inputEvt;
				superSurface.onmousedown = mouseEventHandler.inputEvt;
				superSurface.onmouseup = mouseEventHandler.inputEvt;
				superSurface.onmousemove = mouseEventHandler.inputEvt;
				superSurface.onmouseout = mouseEventHandler.inputEvt;
				superSurface.onmouseover = mouseEventHandler.inputEvt;
				superSurface.onmousewheel = mouseEventHandler.inputEvt;
				superSurface.oncontextmenu = function(evt) {
					return false;
				};
				superSurface.onselectstart = function(evt) {
					return false;
				};

                superSurface.ondrop = EventDisable;
				superSurface.ondrag = EventDisable;
				superSurface.ondragstart = EventDisable;
				superSurface.ondragover = EventDisable;

				// For chromeApp handle mouseup and mousemove event so
				// that mouse movement can be tracked across the window to 
				// handle it for multimonitor case
				//
				if (g.environment.receiver.isChromeApp) {
					document.onmouseup = mouseEventHandler.chromeInputEvt;
					document.onmousemove = mouseEventHandler.chromeInputEvt;
				}
			}

			document.body.onblur = InputEvt;
		}
		if (keyboardflag == true) {
			if (rootElement) {
				rootElement.onkeydown = InputEvt;
				rootElement.onkeyup = InputEvt;
				rootElement.onkeypress = InputEvt;
			}
			
			// IE10 & IE11 generates "onhelp" event when we press F1 key, so ignore this as we are sending F1 key to session
			//  Fixes : BUG0487279
			if("onhelp" in window)
				HTML5Interface.window.addEventListener("help", onHelpEvent);
				
			// IE and Firefox generates "oncontextmenu" event when we press "ContextMenu" key, so ignore this as we are sending this key to session
			// Fixes : BUG0488546
			if("oncontextmenu" in window)
				HTML5Interface.window.addEventListener("contextmenu", onContextmenu);

		}
	}

	function onHelpEvent(event){
		event.preventDefault();
		return false;
	}
	
	function onContextmenu(event){
		event.preventDefault();
		return false;
	}
	//Sends CAD to session.
	this.initiateCtrlAltDel = function() {		
		icaFrame.initiateCtrlAltDel();
	};
	//To send any other special key combination to session using HDX SDK for HTML5
	this.sendSpecialKeys = function(keys){
		icaFrame.SendCustomKeyEvents(keys);
	};
	
	this.setFileUploadObject = function(file)
	{
		uiWrapper.sendFileUploadObjectSetRequest(file);
	};
	this.initiateFileUpload = function() {
		uiWrapper.sendFileUploadInitRequest();
	};
	this.initiateFileDownload = function() {
		uiWrapper.sendFileDownloadInitRequest();
	};
	
	this.toggleMultiTouchMode = function() {
		if(multiTochMode == true)
			multiTochMode = false;
		else
			multiTochMode = true;
	};
	
	
	this.connectionAction = function(msg){
		uiWrapper.connectionAction(msg);
	};
	this.setIcaFrame = function(icaframe1) {
		mainEngine.icaEngine.icaframe = icaframe1;
		icaFrame = icaframe1;
		clientImeHandler = new ClientImeHandler(mainEngine.icaEngine.icaframe, InputEvt);
//        if (HTML5_CONFIG && HTML5_CONFIG['feature'] && HTML5_CONFIG['feature']['graphics'] && HTML5_CONFIG['feature']['graphics']['extendedDisplay']) {
//            displayManager.setKeyBoardEvtHandler(InputEvt);
//        }
//        
		// Initalize Mobile touchevents handler/settings
		if (g.environment.os.isTouch) {
			mobileReceiverView_obj = new MobileReceiverView(clientImeHandler);
			multiTouchHandler = new MultiTouchHandler(icaFrame);
			if (mobileReceiverView_obj) 
			{
			mobileReceiverView_obj.Initialise(icaFrame);
				// Set the mobile receiver view object for the browserbox
				bb.setMobileReceiverView(mobileReceiverView_obj);
				bb.enableKeyboardButton();
			}
		}
	};
	function EventCancel(e) {
		if (e.preventDefault) {
			e.stopPropagation();
			e.preventDefault();
		}
		return false;
	}

	function EventDisable(e) {
		if (e.preventDefault) {
			e.preventDefault();
		}
	}

	/** Event handler for mouse wheel event from firefox.
	 */
	function ffwheelhandler(event) {
		var delta = 0;
		if (event.detail) {/** Mozilla case. */
			/** In Mozilla, sign of delta is different than in IE.
			 * Server code expects wheelDelta to be defined
			 */
			event.wheelDelta = -1 * 40 * event.detail;
		}

		icaFrame.MouseEventHandler(event);

		/** Prevent default actions caused by mouse wheel.
		 */

		if (event.preventDefault)
			event.preventDefault();
		event.returnValue = false;
	}


	this.createShortcutIcon = function(url) {
		HTML5Interface.window.setIcon({type:'image/png', url: url });
	};
	
	this.registerUSBClick = function(func){
		if(uiWrapper){
			uiWrapper.registerUSBClick(func);
		}
	};
	
	this.setUiWrapper = function(wrapper) {
		uiWrapper = wrapper;
		if(!bb)
			bb = GetBrowserBox();
		if(multiTouchHandler)
		{
			multiTouchHandler.setUiWrapper(uiWrapper);
		}
	};
	this.closeUsbDevice = function(device,status)
	{
	    uiWrapper.closeUsbDevice(device,status);
	};
	this.transferUsbDevice = function(device)
	{
		uiWrapper.transferUsbDevice(device);
	};
	
	this.enableFileTransferButtons = function()
	{
		bb = GetBrowserBox();
		bb.enableFileTransfer();
	};

	this.enableMultiTouchButton = function()
	{
		bb = GetBrowserBox();
		bb.enableMultiTouchButton();
	};
	
	this.processUploadResponseNotification = function()
	{
		bb = GetBrowserBox();
		bb.processUploadResponseNotification();
	};
	
	this.sendFileTransferConfig = function(maxFileCount)
	{
		bb = GetBrowserBox();
		bb.processFileTransferConfig(maxFileCount);
	};   
    
    this.sendToSeamlessUiManager = function name(cmd) {
        if(uiWrapper != undefined) {
            uiWrapper.sendToSeamlessUiManager(cmd);
        }
    };
	
	/*this.sendDataToThinwireWrapper = function name(cmd) {
        if(uiWrapper != undefined) {
            uiWrapper.sendDataToThinwireWrapper(cmd);
        }
    };*/
	
	/* The device parameter will be ignored. This function will send "RELEASE_ALL" notification to all sessions thorugh shared worker. */
	/* The parameter could have been avoided completely but this makes our implementation simpler in descriptor.js*/
	this.releaseOtherSessionDevices = function(device)
	{
		uiWrapper.releaseOtherSessionDevices(device);
	};
	this.closeSessionUsbDevices = function(sessionName)
	{
	  uiWrapper.closeSessionUsbDevices(sessionName);
	};
	this.transferToOtherSessionUSB = function()
	{
		uiWrapper.transferToOtherSessionUSB(device);
	};
	this.transferAdding = function()
	{
	  uiWrapper.transferAdding(device);
	}
	this.initiateUSBRedirection = function(productId,vendorId,device) {
			 uiWrapper.BuildDevice(productId,vendorId,device);
	};
	this.getAllDevicesList = function()
	{
	  return uiWrapper.getAllDevicesList();
	}
	this.enableUSB = function()
	{
		bb = GetBrowserBox();
		bb.enableUSB();
	};
	this.callMouseEvt = function(event)
	{
	  mouseEventHandler.chromeInputEvt(event);
	};
	this.enableClipboard = function(data) {
		if(!bb)
			bb = GetBrowserBox();
		bb.enableClipboard();
		localClipData["text/plain"] = data;
	};
	this.onClipboardChange = function(dataObj) {
		if (dataObj === null) {
			localClipData = {};
		} else if (dataObj['format'] === ClipFormatConverter.FORMAT_PRIVATE && dataObj['formatname'] === ClipFormatConverter.FORMAT_NAME_HTML) {
 			localClipData["text/html"] = ClipFormatConverter.convertData(dataObj['data'], 
				ClipFormatConverter.FORMAT_STRING, ClipFormatConverter.FORMAT_NAME_HTML);
			if(lastClipChangeTime != dataObj['timestamp']){
				delete localClipData['text/plain'];
			}
 		} else if (dataObj['format'] === ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT) {
 			localClipData["text/plain"] = ClipFormatConverter.replaceslashRNtoslashN(ClipFormatConverter.convertData(dataObj['data'], 
				ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT, ClipFormatConverter.FORMAT_STRING));
			if(lastClipChangeTime != dataObj['timestamp']){
				delete localClipData['text/html'];
			}
 		}
		lastClipChangeTime = dataObj['timestamp'];
		bb.OnClipboardChange();
	};
	this.notifyUsbUi = function(data) {
		bb.notifyUsbUi(data);
	};
	this.copyToLocalClipBoard = function() {
		return localClipData;
	};
	this.changeServerClipboard = function(data) {
		localClipData = data;
		uiWrapper.changeServerClipboard(data);
	};
	this.processIcaData = function(icaData) {
		if (icaData['Title']) {
			var title = icaData['Title'];
			if (title.search(/[\\\/\;\:\#\.\*\?\=\<\>\|\[\]\(\)\'\"]/) == -1) {
				document.title = icaData['Title'];
			}
		}
		if (icaData['IconUrl']) {
			var url = icaData['IconUrl'];
			if (url.indexOf("<") == -1 && url.indexOf(">") == -1) {
				myself.createShortcutIcon(icaData['IconUrl']);
			}

		}
	};
	this.beforeUnloadCheck = true;
	this.showError = function(ctxTxtHeader, ctxMsg, ctxbText, ctxDisableClose, ctxCallback) {		
		var messageObj ={
					'id' : '',
					'message' : ''
			};		
		
		if ( typeof (ctxMsg) == 'string') {
			messageObj['id'] = ctxMsg;
			messageObj['message'] = HTML5Engine.i18n.getMessage(ctxMsg);
		} else if (ctxMsg.length == 2) {
			messageObj['id'] = ctxMsg[0];
			messageObj['message'] = HTML5Engine.i18n.getMessage(ctxMsg[0]);			
		}		
		mainEngine.postReceiverEvent("onError",messageObj);
		if(HTML5_CONFIG && HTML5_CONFIG["ui"] && HTML5_CONFIG["ui"]["hide"] && (HTML5_CONFIG["ui"]["hide"]["error"] === true)){			
			return;
		}
		this.beforeUnloadCheck = false;
		
		if (ctxTxtHeader === null) {
			ctxTxtHeader = '';
		}
		if (1 == ctxCallback) {
			ctxCallback = mainEngine.closeCurrentTab;
		}
		if(!bb){
			bb = GetBrowserBox();
		}
		bb.showError(HTML5Engine.i18n.getMessage(ctxTxtHeader), ctxMsg, ctxbText, ctxDisableClose, mainEngine.closeCurrentTab);
	};
	this.showURLMessage = function(ctxUrl, ctxCallback) {
		mainEngine.postReceiverEvent("onURLRedirection",{'url' : ctxUrl});		
		if(HTML5_CONFIG && HTML5_CONFIG["ui"] && HTML5_CONFIG["ui"]["hide"] && (HTML5_CONFIG["ui"]["hide"]["urlredirection"] === true)){
			return;			
		}
		bb.showURLMessage(ctxUrl, ctxCallback);
	};
	
	this.showPrintData=function(printInfo, PrinterCallback) {
		bb.showPrintData(printInfo, PrinterCallback);
	};

    this.showTotalFile=function(fileRatio) {
        bb.showTotalFile(fileRatio);
    };

    this.showDownloadingPDFDialog=function() {
        bb.showDownloadingPDFDialog();
    };

    this.hideDownloadingPDFDialog=function() {
        bb.hideDownloadingPDFDialog();
    };

    this.kioskModeSendPrintObject=function(printInfo, PrinterCallback) {
        bb.kioskModeSendPrintObject(printInfo, PrinterCallback);
    };

    this.kioskPrinterCallbackOnMessage=function() {
        bb.kioskPrinterCallbackOnMessage();
    };

	this.showOverlay=function(options) {
        bb.showOverlay(options);
    };
	this.hideOverlay=function() {
        bb.hideOverlay();
    };
	
	this.showReconnectingOverlay=function(UIDimmingPercentage) {
        bb.showReconnectingOverlay(UIDimmingPercentage);
    };
	this.hideReconnectingOverlay=function() {
        bb.hideReconnectingOverlay();
    };
	
	this.updateFpsMeter=function(meterInfo) {
        bb.updateFpsMeter(meterInfo);
    };
	this.showFileTransferError = function(cmd){
		bb.showFileTransferError(cmd);
	};
	
    this.openChromeAppPrintWindow=function(printInfo){
        bb.openChromeAppPrintWindow(printInfo);
    };

	this.resetConnectStatus = function(ishide) {
		connectStatus = ishide;
		bb.resetConnectStatus(ishide);	
	};	

	var ctrlKeyDown = false;
	var isTouchEventActive = false;
	var isMax = false;
	function MouseEvtHandler() {
		var isMouseOut = false;
		var prevEvent = "";
		var skipEvent = new Array();
		skipEvent["touchstart"] = "mousedown";
		skipEvent["touchend"] = "mouseup";
		skipEvent["touchmove"] = "mousemove";

		this.inputEvt = function(event,isMaxChk) {
		  if(event.type === "mousedown")
		    isMax = isMaxChk;
			if (icaConnected) {
				if (icaFrame !== undefined) {
					icaFrame.checkModifiers(event);
				}
				var evType = event.type;
				if (evType === skipEvent[prevEvent]) {
					return false;
				}
				else if(multiTochMode && (evType === "touchend" || evType === "touchstart" || evType === "touchmove"))
				{
					
					event.returnValue = multiTouchHandler.handleTouchEvents(event);
				}
				else {
					prevEvent = evType;
					isMouseOut = false;
					if (evType === "touchend") {
						//on hybrid touch devices focusing the Imeclientbuffer textarea so that keyinputs from physical keyboard can go to server
						if (clientImeHandler.IsActive() || !g.environment.os.isMobile) {
							clientImeHandler.MouseUpInCanvas(event);
						}
						if (event.touches.length == 0) {
							isTouchEventActive = false;
						}
						isMouseDown = false;
						event.returnValue = icaFrame.MouseTouchEventHandler(event);
					} else if (evType === "touchstart") {
						isTouchEventActive = true;
						isMouseDown = true;
						event.returnValue = icaFrame.MouseTouchEventHandler(event);

					} else if (evType === "touchmove") {
						event.returnValue = icaFrame.MouseTouchEventHandler(event);
					} else if (evType === "mouseup") {
						//if (clientImeHandler.IsActive()) {
						clientImeHandler.MouseUpInCanvas(event);
						//}
						event.returnValue = icaFrame.MouseEventHandler(event);
						isMouseDown = false;
					}
					// On hybrid touch devices, two finger tap giving mousedown alone in between of touchstart and touchend
					//Don't send this mousedown event to server because server is getting confused
					else if (evType === "mousedown" && isTouchEventActive === false) {
						event.returnValue = icaFrame.MouseEventHandler(event);
						isMouseDown = true;

					} else if (evType === "mousemove") {
						event.returnValue = icaFrame.MouseEventHandler(event);
					} else if (evType === "mousewheel") {
						icaFrame.MouseEventHandler(event);
						return false;
					} else if (evType === "mouseout") {
						isMouseOut = true;
						//mouse moved out of canvas
						
						// Restrict mouse out only for HTML5 session
						if (isMouseDown && !g.environment.receiver.isChromeApp) {
							//end mouse drag here, sendmouseup
							injectedUp = new Object;
							injectedUp.type = "mouseup";
							injectedUp.clientX = event.clientX;
							injectedUp.clientY = event.clientY;
							injectedUp.button = event.button;
							icaFrame.MouseEventHandler(injectedUp);
							isMouseDown = false;
						}
					} else if (evType === "mouseover") {
						return true;
					} else if (evType === "blur") {
						return true;
					}
				}
			}
		};

		this.chromeInputEvt = function(event) {
			if (icaConnected) {
				if (icaFrame !== undefined) {
					icaFrame.checkModifiers(event);
				}
				var evType = event.type;
				// TODO: handle better
				// For now handle mouse events from document only if mouse is down and 
				// out of the super surface 
				//
				if (isMouseDown && isMouseOut) {
					if (evType === "mouseup") {
						clientImeHandler.MouseUpInCanvas(event);
						event.returnValue = icaFrame.MouseEventHandler(event);
						isMouseDown = false;					
						isMax = false;
					} else if (evType === "mousemove") {
					  //We need to send mousemove only for desktop session and Maximized seamless apps(server side)
					  if(isMax === true || !g.environment.receiver.seamlessMode)
					  {
						event.returnValue = icaFrame.MouseEventHandler(event);
					  }
					}
				}				
			}
		};
	}

	if (PlatformInfo["browserid"] == BrowserInfo["FIREFOX"]) {
		var prev_key = -1;
		//this is used for handle +  numpad + because both have same code
		// 107 so can not be decided at key press  but at keypress it
		var is_keydowneventdone = false;
		// this key is used for keys combination that give different  code at keydown
		// and keypress because keyPressExecuted  become true at first key press then if consecutive
		//keydown and keypress occur then thet charcter either print twicw or two chacter pronted
		// like 1 + downarrowkey

		var unifyKeyCode = ( function() {
				// fix BUG0356471 by Qiang ZHUO

				var unifyFunction;
				// Browser using different keycode table.
				// we unify the keycode to the `IE keycode` which is used by IE and chrome
				// @see http://unixpapa.com/js/key.html
				var mozillaToIeKeycodeMapping = new Uint8Array(172);
				mozillaToIeKeycodeMapping[63] = 219;
				// ÃŸ (\xDF) in DE, press <->
				mozillaToIeKeycodeMapping[171] = 187;
				// ~ in DE, press <AltGr> + <]>
				mozillaToIeKeycodeMapping[169] = 219;
				// > in FR, press <Maj> + <<>
				mozillaToIeKeycodeMapping[60] = 226;
				// ] in FR, press <AltGr> + <->
				mozillaToIeKeycodeMapping[61] = 187;
				// } in FR, press <AltGr> + <=>
				mozillaToIeKeycodeMapping[164] = 186;
				// Â¤ (\xA4) in FR, press <AltGr> + <]>

				unifyFunction = function(keyCode) {
					return mozillaToIeKeycodeMapping[keyCode] || keyCode;
				};

				return unifyFunction;
			}());

        
		function InputEvt(event) {
			if (icaConnected) {
				var evType = event.type;
				if (evType === "keydown") {
                    //clipboardDialogShown set to true will not send keyboard events to server.
					if (clientImeHandler.IsActive() || clipboardDialogShown) {
						return true;
					}
					
					//The followinng if loop comes into active when 'Alt' is pressed.
					//There are 5 cases we have to take care
					//1. When only Alt is Pressed. In this case we send 'Alt Down' and 'Alt Up' to Server during 'Alt Up' Event
					//2. When Hot keys like 'Alt+Search' are pressed. We donot send any keys to Server
					//3. When Non Hot keys like 'Alt+ F' are Pressed. We send Alt Down and F to the Server
					//4. Cases like Alt+Ctrl or Alt+Shift are pressed. We send Alt Down and Ctrl/SHift to Server
					//5. Complicated Scenarios like Alt+Tab are Pressed.
					if(event.keyCode==18 && event.shiftKey==false && event.ctrlKey==false){
						altDownEvent = event;
						altFlag=true;
						return true;
					}
					
					if(event.keyCode!=18 && altFlag)
					{  
						if(isHotKey(event))
						{
							//This loop handles Hot keys like in case of 'Alt+Search'. We simply return them to Browser.
							altDownEvent = null;
							altFlag = false;
							return true;
						}
						else if(event.altKey==true)
						{
							//This loop handles non Hot keys like in case of 'Alt+F'. We send 'Alt Down' here and 'F' in the code below.
							icaFrame.updateAltModifier(altDownEvent);
							altDownEvent =null;
							altFlag=false;
						}
						else
						{
							//This is for clearing the Alt Down event in any other error cases.
							altDownEvent = null;
							altFlag = false;
						}
					}
					
					// Win_Left_Keycode = 91, Win_Right_Keycode = 92
					if ((navigator.appVersion.indexOf("Win") != -1) && (event.keyCode == 91 || event.keyCode == 92)) {

						var evt = event ? event : window.event;
						if (evt.stopPropagation) {
							evt.stopPropagation();
							evt.stopImmediatePropagation();
						}
						if (evt.cancelBubble != null) {
							evt.cancelBubble = true;
						}
						return true;
					}
					keyDownEvent = null;
					keyPressExecuted = false;
					is_keydowneventdone = false;

					
					icaFrame.checkModifiers(event);
					//icaFrame.updateAltModifier(event);
					
					var key = unifyKeyCode(event.keyCode);
					
					if (isChromeOS && (key == 0) && (event.which == 0)) {
						//Key sent in chrome os device when power switch is pressed for a short duration: Do nothing
						isKeyPressReq = false;
						return true;
					}
					
					//Ctrl+Shift+L (for logging out ) or Ctrl+Shift+Q (for signing out) or Ctrl+Shift+Refresh should not be sent to browser in Chrome OS.
					if(event.ctrlKey && event.shiftKey  &&  isChromeOS && (event.keyCode==76 || event.keyCode==81 || event.keyCode==168))
					{
						keyDownEvent = null;
						keyPressExecuted = false;
						isKeyPressReq = false;
						return true;
					}
					
					if (clipboardPolicyEnabled && HandleClipboardEvents(event)) {
						return true;
					}
					if (event.ctrlKey && event.altKey)//Only if both keys are pressed simultaneously
					{
						/*
						 adding 58 , 59  for firefox ;: key
						 */

						if ((key > 64 && key < 91) || (key >= 48 && key <= 60) || (key == 12) || (key >= 33 && key <= 40) || (key == 45) || (key >= 186 && key <= 192) || (key >= 219 && key <= 223) || (key == 226) || (key == 0) || (key == 161) || (key == 160)) {
							/* All printable character (These values remain same for all keyboards as these are not ASCII/UNICODE values and have no relation with them)
							 (key > 64 && key < 91): A-Z
							 (key >= 48 && key <=57):0-9
							 (key==12)||(key>=33 && key<=40)||(key==45): NumPad
							 (key>=186 && key<=192)||(key>=219 && key<=222): Other printable characters like `,;]\ etc.
							 (key==226) European keyboards (DE, FR) maps to <>|
							 */
							keyDownEvent = event;
							isKeyPressReq = true;
							return true;
						}
						/* Else it is a non printable character and therefore should be handled like it is being handled right now */
					}
					if (key != 144 && key != 145 && key != 224// 224 is Command key on Firefox + Mac
					&& ((key > 64 && key < 91) || (key >= 48 && key <= 59) || key == 61// = key on Firefox + Mac
					// Firefox on Mac Unicode keyboard keydown events come in as 0/0, keypress.which contains Unicode codepoint
					|| (!isChromeOS && key == 0 && event.which == 0) || (key >= 128)) && !icaFrame.CtrlKey(event) && !event.altKey)/*BUG??: (key>=128) ?*/
					{
						isKeyPressReq = true;
						return true;
					}

					/* handle with Dutch keyboard key as `~'"^ */
					if (isKeyPressReq && key == 32)
					{
						return true;
					}

					///Handling special keys on Chrome OS Device
					if ((key >= 112) && (key <= 115) && isChromeOS) {
						switch (key) {
							case 112:
							case 113:
							case 114:
								//Handling for Refresh Key on Chrome OS
								return false;
								// Neither send it to browser nor to XenApp Server
								break;
							case 115:
								return true;
								// Let browser handle this
								break;
						}
					}
					/*
					 * num lock + - have same code as + - so not handling in keydown
					 */
					if ((key == 107) || (key == 109)) {
						prev_key = key;
						isKeyPressReq = true;
						return true;
					}
					icaFrame.KeyBoardEventHandler(event, evType);
					is_keydowneventdone = true;
					if (key == 122) {
						return true;
					} else {
						event.preventDefault();
						return false;
					}
				} else if (evType === "keyup") {
					if (clientImeHandler.IsActive()) {
						return true;
					}
					
					//In cases of Hot Keys like 'Alt+Search' we should not send it to server.
					if(isHotKey(event))
					{
						altDownEvent = null;
						altFlag = false;
						return true;
					}
					
					//This is in the case of Only 'Alt' key, we send 'Alt Down' now and 'Alt Up' in the code below.
					if(event.keyCode==18 &&  altDownEvent!=null && !event.ctrlKey && !event.shiftKey){
						altFlag = false;
						icaFrame.updateAltModifier(altDownEvent);
						altDownEvent = null;
					}
					
					altFlag=false; 	 //We clear the flag in case of any error scenarios.
					
					// Win_Left_Keycode = 91, Win_Right_Keycode = 92
					if ((navigator.appVersion.indexOf("Win") != -1) && (event.keyCode == 91 || event.keyCode == 92)) {

						var evt = event ? event : window.event;
						if (evt.stopPropagation) {
							evt.stopPropagation();
							evt.stopImmediatePropagation();
						}
						if (evt.cancelBubble != null) {
							evt.cancelBubble = true;
						}
						return true;
					}
					var key = unifyKeyCode(event.keyCode);
					HandleClipboardKeyup(event);

					if ((keyDownEvent != null) && (keyPressExecuted == false)) {
						/* Key down wont be executed when cntrl+alt+key is not having any 3rd character */
						icaFrame.KeyBoardEventHandler(keyDownEvent, "keydown");
						/*  Event Should be cleared */
						keyDownEvent = null;
						keyPressExecuted = false;
					}

					if (isChromeOS && (key == 0) && (event.which == 0)) {
						//Key sent in chrome os device when power switch is pressed for a short duration: Do nothing
						isKeyPressReq = false;
						return true;
					}
					
					
					/*
					 adding 58 , 59  for firefox ;: key
					 adding 61, 224 for firefox on Mac: 61 is equal sign, 224 is Command key
					 */
					if (((key > 64 && key < 91) || (key >= 48 && key <= 59) || key == 61 || (key >= 128)) && key != 224 && keyPressExecuted) {
						isKeyPressReq = false;
						return true;
					}

					/* handle with Dutch keyboard key as `~'"^ */
					if (keyPressExecuted && key == 32) {
						return true;
					}

					if ((key == 107) || (key == 109)) {
						isKeyPressReq = false;
						return true;
					}

					//Handling special keys on Chrome OS Device
					if ((key >= 112) && (key <= 115) && isChromeOS) {
						switch (key) {
							case 112:
							//Handling for Back Key on Chrome OS
							case 113:
							//Handling for Forward Key on Chrome OS
							case 114:
								//Handling for Refresh Key on Chrome OS
								return false;
								// Neither send it to browser nor to XenApp Server
								break;
							case 115:
								return true;
								// Let browser handle this
								break;
						}
					}

					icaFrame.KeyBoardEventHandler(event, evType);
					return false;
				} else if (evType === "keypress") {
					if (clientImeHandler.IsActive()) {
						return true;
					}
					// Win_Left_Keycode = 91, Win_Right_Keycode = 92
					if ((navigator.appVersion.indexOf("Win") != -1) && (event.keyCode == 91 || event.keyCode == 92)) {

						var evt = event ? event : window.event;
						if (evt.stopPropagation) {
							evt.stopPropagation();
							evt.stopImmediatePropagation();
						}
						if (evt.cancelBubble != null) {
							evt.cancelBubble = true;
						}
						return true;
					}

					if (event.keyCode == 27 || event.keyCode == 9)// Firefox Mac only handle preventDefault for onkeypress events
					{
						// If IE
						if (!event)
							event.returnValue = false;
						// Firefox, Safari, Opera
						else {
							event.preventDefault();
							event.stopImmediatePropagation();
						}
						return false;
					}
					var key = event.which;
					keyPressExecuted = true;
					if (isKeyPressReq && (is_keydowneventdone == false)) {
						/*
						 * for handling keys( +- ) && and numpasd( + - ) same code in firefox
						 * at key down so can not be handle at keydown at keypress simple + have
						 * different key code then 107 nut here K ,M have same code as numpad +
						 * - have so need previous keycode
						 */
						if ((prev_key == key) && ((prev_key == 107) || (prev_key == 109))) {
							icaFrame.KeyBoardEventHandler(event, "keydown");
						} else {
							icaFrame.KeyBoardEventHandler(event, evType);
						}
						prev_key = -1;
						return false;
					}
				}
			}
		}

	} else {
		function InputEvt(event) {
			if (icaConnected) {
				var evType = event.type;
				if (evType === "keydown") {
					//clipboardDialogShown set to true will not send keyboard events to server.
					if (clientImeHandler.IsActive() || clipboardDialogShown) {
						return true;
					}

					//The followinng if loop comes into active when 'Alt' is pressed.
					//There are 5 cases we have to take care
					//1. When only Alt is Pressed. In this case we send 'Alt Down' and 'Alt Up' to Server during 'Alt Up' Event
					//2. When Hot keys like 'Alt+Search' are pressed. We donot send any keys to Server
					//3. When Non Hot keys like 'Alt+ F' are Pressed. We send Alt Down and F to the Server
					//4. Cases like Alt+Ctrl or Alt+Shift are pressed. We send Alt Down and Ctrl/SHift to Server
					//5. Complicated Scenarios like Alt+Tab are Pressed.
					if(event.keyCode==18 && event.shiftKey==false && event.ctrlKey==false){
					    altDownEvent = event;
						altFlag=true;
						return true;
					}
					
					var key = event.keyCode;
					
					if(event.keyCode!=18 && altFlag)
					{  
					  if(isHotKey(event))
					  {
					  
					  //This loop handles Hot keys like in case of 'Alt+Search'. We simply return them to Browser.
					    altDownEvent = null;
					    altFlag = false;
					    return true;
					  }
					  else if(event.altKey==true)
					  {
						//BUG0531872, in Mac OS, some Alt+keys are used to output a 3rd character, for example, Alt+e gives '€' and Alt+r gives '®' in German.
						//In this situation, we need to handle it in keypress but not in keydown.
						if (PlatformInfo["OS"] == OSInfo["MAC"]) {
							if ((key > 64 && key < 91) || (key >= 48 && key <= 57) || (key >= 186 && key <= 192) || (key >= 219 && key <= 222) || (key == 226)) {
							/* All printable characters in Mac OS.
							 (key > 64 && key < 91): A-Z
							 (key >= 48 && key <=57):0-9
							 (key>=186 && key<=192)||(key>=219 && key<=222): Other printable characters like `,;]\ etc.
							 */
							altDownEvent = null;
							isKeyPressReq = true;
							return true;
							}
						} else {
							//This loop handles non Hot keys like in case of 'Alt+F'. We send 'Alt Down' here and 'F' in the code below.
							icaFrame.updateAltModifier(altDownEvent);
							altDownEvent = null;
							altFlag=false;
						}
					  }
					  else
					  {
					  //This is for clearing the Alt Down event in any other error cases.
						altDownEvent = null;
					    altFlag = false;
					  }
					}
					
					// Win_Left_Keycode = 91, Win_Right_Keycode = 92
					if ((navigator.appVersion.indexOf("Win") != -1) && (event.keyCode == 91 || event.keyCode == 92)) {

						var evt = event ? event : window.event;
						if (evt.stopPropagation) {
							evt.stopPropagation();
							evt.stopImmediatePropagation();
						}
						if (evt.cancelBubble != null) {
							evt.cancelBubble = true;
						}
						return true;
					}

					keyDownEvent = null;
					keyPressExecuted = false;
					
					icaFrame.checkModifiers(event);
				//	icaFrame.updateAltModifier(event);
					
					
					
				
					if ((key == 0) && (event.which == 0)) {
						//Key sent in chrome os device when power switch is pressed for a short duration: Do nothing
						isKeyPressReq = false;
						return true;
					}
					
					
					//Ctrl+Shift+L (for logging out ) or Ctrl+Shift+Q (for signing out) or Ctrl+Shift+Refresh  or Alt+[ , Alt+] (keys to side dock, snap and restore windows) or <Alt> + "+" and <Alt> + "- "
					// should not be sent to session in Chrome OS.
                  if(isChromeOS)
                  {
					if(event.ctrlKey && event.shiftKey && (event.keyCode==76 || event.keyCode==81 || event.keyCode==168) || event.altKey && (event.keyCode==219 || event.keyCode==221 || event.keyCode==187 || event.keyCode == 189))
					{
						keyDownEvent = null;
						keyPressExecuted = false;
						isKeyPressReq = false;
						return true;
					}
                  }
					
					if (clipboardPolicyEnabled && HandleClipboardEvents(event)) {
						return true;
					}
					

					if (event.ctrlKey && event.altKey)//Only if both keys are pressed simultaneously
					{
						if ((key > 64 && key < 91) || (key >= 48 && key <= 57) || (key == 12) || (key >= 33 && key <= 40) || (key == 45) || (key >= 186 && key <= 192) || (key >= 219 && key <= 223) || (key == 226)) {
							/* All printable character (These values remain same for all keyboards as these are not ASCII/UNICODE values and have no relation with them)
							 (key > 64 && key < 91): A-Z
							 (key >= 48 && key <=57):0-9
							 (key==12)||(key>=33 && key<=40)||(key==45): NumPad
							 (key>=186 && key<=192)||(key>=219 && key<=222): Other printable characters like `,;]\ etc.
							 (key==226) European keyboards (DE, FR) maps to <>|
							 */
							keyDownEvent = event;
							isKeyPressReq = true;
							return true;
						}
						/* Else it is a non printable character and therefore should be handled like it is being handled right now */
					}
										
					if (key != 144 && key != 145 && ((key > 64 && key < 91) || (key >= 48 && key <= 57) || (key >= 128)) && !icaFrame.CtrlKey(event) && !event.altKey)/*BUG??: (key>=128) ?*/
					{
						isKeyPressReq = true;
						return true;
					}

					/* handle with Dutch keyboard key as `~'"^ */
					if (isKeyPressReq && key == 32)
					{
						return true;
					}

					/*///Handling special keys on Chrome OS Device
					
					if ((key >= 112) && (key <= 115) && isChromeOS) {
						switch (key) {
							case 112:
							case 113:
							case 114:
								//Handling for Refresh Key on Chrome OS
								return false;
								// Neither send it to browser nor to XenApp Server
								break;
							case 115:
								return true;
								// Let browser handle this
								break;
						}
					}*/
					
					if (key ==27 && isChromeOS) { // This is to send Esc Key during FullScreen into the session.
					    event.preventDefault();
						event.stopImmediatePropagation();
					}
					
					icaFrame.KeyBoardEventHandler(event);
					event.preventDefault();
					return false;

				} else if (evType === "keyup") {
									
					if (clientImeHandler.IsActive()) {
						return true;
					}
					
					//In cases of Hot Keys like 'Alt+Search' we should not send it to server.
					if(isHotKey(event))
					{
					  altDownEvent = null;
					  altFlag = false;
					  return true;
					}
					
					if (event.keyCode == 18) {
						/* Clear altFlag when 'Alt' up. 
						   BUG0531872, in Mac OS, some Alt+keys are used to output a 3rd character. 
						   Clearing altFlag until 'Alt' up enables the user to hold 'Alt' down and input characters constantly. 
						*/
						altFlag=false;	
						//This is in the case of Only 'Alt' key, we send 'Alt Down' now and 'Alt Up' in the code below.
						if (altDownEvent!=null && !event.ctrlKey && !event.shiftKey) {
							icaFrame.updateAltModifier(altDownEvent);
							altDownEvent = null;
						}
					}
					
					// Win_Left_Keycode = 91, Win_Right_Keycode = 92
					if ((navigator.appVersion.indexOf("Win") != -1) && (event.keyCode == 91 || event.keyCode == 92)) {

						var evt = event ? event : window.event;
						if (evt.stopPropagation) {
							evt.stopPropagation();
							evt.stopImmediatePropagation();
						}
						if (evt.cancelBubble != null) {
							evt.cancelBubble = true;
						}
						return true;
					}
					var key = event.keyCode;
					HandleClipboardKeyup(event);
					if ((keyDownEvent != null) && (keyPressExecuted == false)) {
						/* Key down wont be executed when cntrl+alt+key is not having any 3rd character */
						icaFrame.KeyBoardEventHandler(keyDownEvent);
						/*  Event Should be cleared */
						keyDownEvent = null;
						keyPressExecuted = false;
					}

					if ((key == 0) && (event.which == 0)) {
						//Key sent in chrome os device when power switch is pressed for a short duration: Do nothing
						isKeyPressReq = false;
						return true;
					}

					
					if (((key > 64 && key < 91) || (key >= 48 && key <= 57) || (key >= 128)) && keyPressExecuted) {
						isKeyPressReq = false;
						return true;
					}
					
					/* handle with Dutch keyboard key as `~'"^ */
					if (keyPressExecuted && key == 32) {
						return true;
					}
						
					//Handling special keys on Chrome OS Device
				/*	if ((key >= 112) && (key <= 115) && isChromeOS) {
						switch (key) {
							case 112:
							//Handling for Back Key on Chrome OS
							case 113:
							//Handling for Forward Key on Chrome OS
							case 114:
								//Handling for Refresh Key on Chrome OS
								return false;
								// Neither send it to browser nor to XenApp Server
								break;
							case 115:
								return true;
								// Let browser handle this
								break;
						}
					} */
					
				if (key ==27 && isChromeOS) { // This is to send Esc Key during FullScreen into the session.
					    event.preventDefault();
						event.stopImmediatePropagation();
					}
					
					icaFrame.KeyBoardEventHandler(event);
					// TODO Added Ctrl & Shift check for debugging on chrome temporarily... Remove it later...
					if (event.shiftKey == true && event.ctrlKey == true)
						return true;
					else
						return false;
				} else if (evType === "keypress") {
					
					if (clientImeHandler.IsActive()) {
						return true;
					}

					var key = event.which;
					keyPressExecuted = true;
					if (isKeyPressReq) {
						icaFrame.KeyBoardEventHandler(event);
						return false;
					}
				}
			}
		}

	}
    gInputEvt = InputEvt;
    //displayManager.setKeyBoardEvtHandler()
    
  function isHotKey(event){
    //This function currently only checks if the current event is Hot Key or Not.
    if(isChromeOS){
      if(event.keyCode==91 && event.altKey==true)  //Alt+Search
      {
        return true;
      }
      else if(!HTML5Interface.window.isFullscreen() && event.keyCode==9 && event.altKey==true) //Alt+Tab
      { //In The Case of FullScreen we should send Alt+Tab to Server else we need to send it to browser.
        return true;
      }
    }
    return false;
  }
	function HandleClipboardEvents(evt) {

		var isMac = /mac/i.test(navigator.userAgent);
		propagateEvent = false;
		var keyCode = evt.keyCode;
		var bb = GetBrowserBox();
		if (!isMac && evt.ctrlKey == false) {
			ctrlKeyDown = false;
		} else if (isMac && clipboardDialogShown === false) {
			ctrlKeyDown = false;
		}
		if (isMac && (keyCode == 91 || keyCode == 93 || keyCode == 224)) {
			keyCode = 17;
		}
		switch (keyCode) {
			case 17:
				ctrlKeyDown = true;
				break;
			case 88:
			case 120:
			case 99:
			case 67:
				if (ctrlKeyDown) {
					propagateEvent = true;
				}
				break;
			case 86:
			case 118:
				if (ctrlKeyDown) {
					propagateEvent = true;
				}
				break;

			default:
				bb.OnArbitraryKeyPress(evt);

		}
		return propagateEvent;
	}

	function HandleClipboardKeyup(evt) {
		var isMac = /mac/i.test(navigator.userAgent);
		var keyCode = evt.keyCode;
		if (!isMac && evt.ctrlKey == false) {
			ctrlKeyDown = false;
		} else if (isMac && clipboardDialogShown === false) {
			ctrlKeyDown = false;
		}

		if (isMac && (keyCode == 91 || keyCode == 93 || keyCode == 224)) {
			keyCode = 17;
		}
		switch (keyCode) {

			case 17:
				ctrlKeyDown = false;
				break;
		}

	}

	this.closeConnection = function( ){
	
	//We don't need the below code as we are now handling closing of USB devices when UI sends message directly to ReceiverManager.
	    /*if(HTML5Interface.isUSBAPIAvailable()){
		  myself.closeSessionUsbDevices(document.title);
	    }*/
	};

	this.setUserPreferredResolution = function(preResolution){
		UiControls.ResolutionUtility.set( UiControls.ResolutionUtility.constants.preferredResolution, preResolution);			
	};
	this.setAutoresize = function(value){
		UiControls.ResolutionUtility.set(UiControls.ResolutionUtility.constants.autoResize  , value);
	};
	
	var onResize = function(sessionSize) {
	    UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation,function(displayDetails){
			if(displayDetails.multimonitor == true){
			  var bounds;
        if(g.environment.receiver.seamlessMode){
          bounds = displayDetails.displayInfo[displayDetails.primaryMonitor].workArea;
        }
        else{
          bounds = displayDetails.displayInfo[displayDetails.primaryMonitor].bounds;
        }
				newSessionWidth = bounds.width;
				newSessionHeight = bounds.height;
			}else{
				newSessionWidth = displayDetails.sessionSize.width;
				newSessionHeight = displayDetails.sessionSize.height;
			}
			  var bb = GetBrowserBox();
					var lessSpace = bb.OnResize([newSessionWidth, newSessionHeight]);
					if (!lessSpace) {
						var ui = GetUI();
						ui.SetDimensions(newSessionWidth, newSessionHeight);
						if(connectStatus == false)
						{
                            displayManager.setSizePointerDiv(newSessionWidth, newSessionHeight);
						}
						bb.AfterResize();
					}
	    });
	};
}

function IcaEngine(mainEngine1, uiEngine1) {
	var mainEngine = mainEngine1;
	var workerManager = null;
	var icaFrame;
	this.connect = function(icaData, width, height, startupMetrics) {
		try {
			if (icaData == null) {
				throw SessionInitiationError.ICA_DATA_NULL;
			}
			
			if (icaData["InitialProgram"] == null || icaData["InitialProgram"] == "" || icaData["InitialProgram"] == "#") {
				throw SessionInitiationError.INVALID_APP;
			}

			icaData['Address'] = Utility.getIPVFullAddress(icaData['Address']);
			icaData["SSLProxyHost"] = Utility.getIPVFullAddress(icaData['SSLProxyHost']);
			icaFrame = new ICAFrame(100, 100, width, height);
			mainEngine.uiEngine.setIcaFrame(icaFrame);
			displayManager && displayManager.setIcaFrame(icaFrame);
			displayManager && displayManager.setIcaMainEngine(mainEngine);
			workerManager = new MainWorkerManager(icaData, mainEngine, icaFrame , startupMetrics);
			icaConnected = true;

		} catch (error) {
			mainEngine.uiEngine.showError(String('receiver-brand'), [String('error-connect'), String('error-ica-server')], null, null, CTXDLGCB.CLOSECURRENTTAB);
		}
	};

	this.closeConnection = function( ){
		workerManager.closeConnection( );
	};
}

// TODO: access from UI module to get the ica frame
var gIcaFrame;