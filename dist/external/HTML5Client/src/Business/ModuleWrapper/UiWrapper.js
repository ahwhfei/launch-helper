function UiWrapper(icaWrapper1, mainEngine, wrappers) {
	var surfInterface = null;
	var myself = this;
	var selfSender = myself;
	var icaWrapper = icaWrapper1;
	var twiWrapper ;
	var usbClickHandler;
	this.WrapperId = DRIVERID.ID_UI;
    
    if (wrappers)
        wrappers[this.WrapperId] = this;
    
	var clipBoardWrapper = null;
	var cvcWrapper = null;
	var printerWrapper=null;
	var fileWrapper = null;
	this.errorCode = ERRORCODE.NONE;
	this.mainEngine = mainEngine;
	this.isInitialize = false;
	var icaFrame;
	var sessionMgrWrapper = null;
	var rcvMgrWrapper = null;
	var clipStart = false;
	var timestamp = HTML5Interface.timeStamp( );
	var euemWrapper = null;
    var ctxWrapper = null;
	var usbWrapper= null;
	var multiTouchWrapper = null;
	var seamlessUiWrapper = null;
	this.isFpsMeterEnabled = null;
	var config ;
	var appSwitcher = null;
	var sessionSize = {};
	var thinwireStarted = false;
	/*
	 * This is only function that can call from otherWrappers
	 */

	this.processOtherWrapperCmd = function(dataObj) {
		dataObj['destination'] = myself.WrapperId;
		if(dataObj['byref']){
			var temp = dataObj['byref'];
			dataObj['byref'] = null;
			selfSender.postMessage(dataObj ,temp);
		}else{
			selfSender.postMessage(dataObj);
		}
	};

	this.postMessage = function(dataObj ,byRef) {
		if(byRef){
			dataObj['byref'] = byRef;
		}
		processThreadCommand(dataObj);
	};

	this.setIcaWrapper = function(icaWrapper1) {
		icaWrapper = icaWrapper1;
	};
	
	this.setMultiTouchWrapper = function(obj){
	
		multiTouchWrapper = obj;
	};
	
	this.seamlessWrapper = function(twWr){
		twiWrapper = twWr;
	};

	this.changeSessionSize = function(frameWidth, frameHeight) {
		UiControls.ResolutionUtility.set(UiControls.ResolutionUtility.constants.sessionResize , {width :frameWidth ,height:frameHeight ,alwaysSend : true});
	   
	};


	this.processSelfWrapperCmd = function(dataObj) {
		processThreadCommand(dataObj);
	};

	function processThreadCommand(dataObj) {
		var sourceChannel = dataObj.source;
		switch (sourceChannel) {
			case DRIVERID.ID_SESSION_MANAGER:
				handleSessionManagerCmd(dataObj);
				break;
			case DRIVERID.ID_THINWIRE:
				handleThinWireWrapperCmd(dataObj);
				break;
			case DRIVERID.ID_UI:
				handleUiWrapperCmd(dataObj);
				break;
			case DRIVERID.ID_WINSTATION:
			case DRIVERID.ID_TRANSPORT:
			case DRIVERID.ID_PROTOCOL:
				handleIcaWrapperCmd(dataObj);
				break;
			case DRIVERID.ID_CLIPBOARD:
				handleClipBoardWrapperCmd(dataObj);
				break;
			case DRIVERID.ID_CTL:
				handleCVCWrapperCmd(dataObj);
				break;
			case DRIVERID.ID_PRINTER:
				handelPrinterWrapperCmd(dataObj);
				break;
			case DRIVERID.ID_USB:
				handleUSBWrapperCmd(dataObj);
				break;
			case DRIVERID.ID_FILE:
				handleFileVCWrapperCmd(dataObj);
				break;
			case DRIVERID.ID_TWI:
				handleSeamlessCmd(dataObj);
				break;
			case DRIVERID.ID_MTU:
				handleMultiTouchVCWrapperCmd(dataObj);
				break;
		}
	}
	
	this.registerUSBClick = function(func){
		usbClickHandler = func;
	};

		
	function handleMultiTouchVCWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.MULTI_TOUCH_INIT) {
			myself.mainEngine.uiEngine.enableMultiTouchButton();
		}
	}

	this.sendTouchDataToMTWrapper = function(dataObj){
	
		var cmd= dataObj.cmd;
		switch(cmd)
		{
			case WorkerCommand.SEND_MULTI_TOUCH_DATA:
				multiTouchWrapper.processOtherWrapperCmd({
					cmd: WorkerCommand.SEND_MULTI_TOUCH_DATA,
					source: myself.WrapperId,
					destination: DRIVERID.ID_MTU,
					touchData: dataObj.touchData,
					touchDataCount: dataObj.touchDataCount
				});
				break;
			default:
				break;
		}
	};
	
	function handleSeamlessCmd(dataObj) {
		if(dataObj.cmd === WorkerCommand.SEAMLESS_TO_UIMANAGER) {
			try{
				seamlessUiWrapper.execute(dataObj.data);
			}catch(error){
			
			}
		}
	}

	function handleSessionManagerCmd(dataObj) {
        var cmd = dataObj['cmd'];
        if (cmd === WorkerCommand.CMD_CLOSECURRENTTAB) {
            myself.mainEngine.closeCurrentTab(true);
        } else if (cmd === WorkerCommand.REGISTER_SESSION_PORT) {
            myself.sendRcvManagerCmd(dataObj);
        }
        else if (cmd === WorkerCommand.CLIP_INIT) {
            clipStart = true;
            myself.mainEngine.uiEngine.enableClipboard(dataObj['data']);
        }
        else if (cmd === WorkerCommand.USB_INIT) {
            //clipStart = true;
            myself.usbEnabled = true;
            myself.mainEngine.uiEngine.enableUSB();
            sendUsbInitToSlUiWrapper();
        } else if (cmd === WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEC2U) {
            if (dataObj['failure'] === true) {
                myself.mainEngine.uiEngine.onClipboardChange(null);
            } else {
                myself.mainEngine.uiEngine.onClipboardChange(dataObj);
            }
        } else if (cmd === WorkerCommand.SEAMLESS_USB_NOTIFICATIONW2C || cmd === WorkerCommand.CMD_USB_SENDING_LIST) {
            myself.mainEngine.uiEngine.notifyUsbUi(dataObj);
        } else if (cmd === WorkerCommand.CREATE_CHANNEL) {
            var msgChannel = new MessageChannel();
            var port1 ={'cmd' : WorkerCommand.REGISTER_SESSION_PORT,
                'byref' : [msgChannel.port1],
                'otherport':dataObj['port2']
            };
            var port2 ={'cmd' : WorkerCommand.REGISTER_SESSION_PORT,
                'byref' : [msgChannel.port2],
                'otherport':dataObj['port1']
            };
            forwardPort(dataObj['port2'], port2);
            forwardPort(dataObj['port1'], port1);
        }else if( cmd === WorkerCommand.NOTIFY_AS_MAIN_WINDOW){
        	if(!seamlessUiWrapper) {
					seamlessUiWrapper = dependency.resolve(SeamlessUI, 'UiManager', config.sessionKey);
					seamlessUiWrapper.addListener(sendToSeamlessVC);
					seamlessUiWrapper.actionCallback = connectionCenterAction.bind(myself);
					seamlessUiWrapper.addListenerById('sessionInfo' , onSessionInfocallback.bind(myself));                    		
				}
        }
	}
    
    function sendUsbInitToSlUiWrapper() {
        var slMessage = new SeamlessUI.Message();
        slMessage.sessionId = mainEngine.sessionId;
        slMessage.cmd = "sessionInfo";
        slMessage.usbEnabled = true;         
        seamlessUiWrapper.execute(slMessage.message);   
    }
	
	/*this.sendDataToThinwireWrapper = function(data){
		if(wrappers && wrappers[DRIVERID.ID_THINWIRE]){
			data.source = DRIVERID.ID_UI;
			data.destination = DRIVERID.ID_THINWIRE;
			wrappers[DRIVERID.ID_THINWIRE].processOtherWrapperCmd(data);
		}
	};*/
	
    this.sendToSeamlessUiManager = function name(cmd) {
        if(seamlessUiWrapper) {
            seamlessUiWrapper.execute(cmd);   
        }        
    };
    
    function forwardPort(forwardTo , dataObj){
        if(forwardTo == DRIVERID.ID_SESSION_MANAGER){
            myself.sendSessionManagerCmd(dataObj);
        }else if(forwardTo == DRIVERID.ID_RECEIVER_MANAGER){
            myself.sendRcvManagerCmd(dataObj);
        }

    }

	function handleUiWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd == WorkerCommand.SET_MOUSE_CURSOR) {
			icaFrame.setDisplayCursor(dataObj.cursor, dataObj.X, dataObj.Y);
		}
	}

	this.setEuemWrapper = function(euemWrapperObj) {
		euemWrapper = euemWrapperObj;
	};

	this.setEuemSCCD = function (duration) {
        	if(euemWrapper != null) {
	            euemWrapper.processOtherWrapperCmd({
        	        'cmd': WorkerCommand.STARTSCCD_INFO,
                	'startSCCD': duration,
	                'source': this.WrapperId,
	                'destination': euemWrapper.WrapperId
        	    });
        	}
    	};

	function handleThinWireWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		switch (cmd) {

			case WorkerCommand.SHOW_RESIZE_DIALOG:
					var options = {};
				options['title'] = HTML5Engine.i18n.getMessage("resizing");
				options['info'] = HTML5Engine.i18n.getMessage("resizingInfo");
				myself.mainEngine.uiEngine.showOverlay(options);
				window.setTimeout(function(){
				  myself.mainEngine.uiEngine.hideOverlay();
				},3500);
			break;
            case WorkerCommand.SET_RENDER_CANVAS:
                {
                   surfInterface.switchToCanvas();
                }
                break;
			case WorkerCommand.SET_RENDER_NATIVE:
                {
                   surfInterface.switchToNative();
                }
                break;
            case WorkerCommand.THINWIRE_INITCOMMAND:
            	{
            		UiControls.ResolutionUtility.set(UiControls.ResolutionUtility.constants.vdaSessionSize , dataObj.sessionSize );
            		if(thinwireStarted == true){
            			return;
            		}
					/*	Linux VDA does not have seamless channel. However .ica file may have TWIMode = "on". 
						Since seamless channel is not there the apps were not shown. 
						To fix this, session is shown fully after the connection, and apps are cut once seamless channel gives us the packet.
						When seamless is not present session remains full and user can view the apps.
					*/
					if(g.environment.receiver.seamlessMode && !g.environment.receiver.isKiosk && g.environment.receiver.isChromeApp){
						chrome.app.window.current().setShape({});
					}
            		thinwireStarted = true;
            		myself.mainEngine.uiEngine.resetConnectStatus(true);
            		myself.mainEngine.postReceiverEvent("onConnection",{'state' : 'connected'});					
					//TODO : Come up with a better way to determine if launch is success than just timeout
					setTimeout(function(){
						//Call launch success after 10 minutes
						NetPromoters.launchSuccess();
					},10*60*1000);
					
					//Toolbar should be initialized only after the reading  menubar field from configuration
					if(HTML5_CONFIG && HTML5_CONFIG['ui']&& HTML5_CONFIG['ui']['toolbar'] && HTML5_CONFIG['ui']['toolbar']['menubar'] == true){
						UiControls.Toolbar.load();
					}
            	}
            	break;      
			default:
                if (null !== surfInterface) {
                    surfInterface.processNextCmd(dataObj);
                }
				break;
		}

	}

	function handleClipBoardWrapperCmd(dataObj) {
		
	}


	this.setClipboardWrapper = function(obj) {
		clipBoardWrapper = obj;
	};

	this.setUsbWrapper = function(obj) {
		usbWrapper = obj;
	}
	
	this.setCVCWrapper = function(obj) {
		cvcWrapper = obj;
	};
	this.setFileWrapper = function(obj) {
		fileWrapper = obj;
	};
	this.setSessionManager = function(mgr) {
		sessionMgrWrapper = mgr;
	};
	this.setReceiverManager = function(mgr) {
		rcvMgrWrapper = mgr;
	};
	this.setPrinterWrapper = function(mgr) {
		printerWrapper = mgr;
	};
	this.setSerialWrapper = function(mgr) {
		serialWrapper = mgr;
	};
    this.setCtxWrapper = function(obj) {
        ctxWrapper = obj;
    };
	this.sendSessionManagerCmd = function(dataObj) {
		dataObj['destination'] = sessionMgrWrapper.WrapperId;
		dataObj['source'] = myself.WrapperId;
		sessionMgrWrapper.processOtherWrapperCmd(dataObj);
	};
	this.sendRcvManagerCmd = function(dataObj ) {
		dataObj['destination'] = rcvMgrWrapper.WrapperId;
		dataObj['source'] = myself.WrapperId;
		rcvMgrWrapper.processOtherWrapperCmd(dataObj);
	};
	this.sendFileUploadObjectSetRequest = function(fileObj)
	{
		var data = {
			'cmd' : WorkerCommand.CMD_SET_FILE_UPLOAD_OBJECT,
			'fileObject' : fileObj
		};
		data.source = myself.WrapperId;
		data.destination = fileWrapper.WrapperId;
		fileWrapper.processOtherWrapperCmd(data);
	};
	this.sendFileUploadInitRequest = function()
	{		var data = {
			'cmd' : WorkerCommand.CMD_FILE_UPLOAD_INIT,
		};
		data.source = myself.WrapperId;
		data.destination = fileWrapper.WrapperId;
		fileWrapper.processOtherWrapperCmd(data);		
	};
	this.sendFileDownloadInitRequest = function(fileObj)
	{		var data = {
			'cmd' : WorkerCommand.CMD_FILE_DOWNLOAD_INIT
		};
		data.source = myself.WrapperId;
		data.destination = fileWrapper.WrapperId;
		fileWrapper.processOtherWrapperCmd(data);		
	};
	this.changeServerClipboard = function(data , tstamp) {
		if (!clipStart) {
			return;		
		}

		// Send notification first.
		var dataObj = {};
		dataObj['formatarr'] = [];
		dataObj['formatname'] = [];
		dataObj['len'] = 0;
		var timeChanged = tstamp ? tstamp : Math.floor(timestamp());
		dataObj['timestamp'] = timeChanged;
		// Note: Always Keep text as the first format else if any other format after text is disabled
		// on VDA, it would cause the entire clipboard to fail
		if("text/plain" in data){
			dataObj['formatarr'].push(ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT);
			dataObj['len'] += 1;
			dataObj['formatname'].push("");
		}
		if("text/html" in data){
			dataObj['formatarr'].push(ClipFormatConverter.FORMAT_PRIVATE);
			dataObj['len'] += 1;
			dataObj['formatname'].push(ClipFormatConverter.FORMAT_NAME_HTML);				
		}
		dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_NOTIFICATIONU2C;
		myself.sendSessionManagerCmd(dataObj);
		
		// Send data as well now.
		// Note: Always Keep text as the first format else if any other format after text is disabled
		// on VDA, it would cause the entire clipboard to fail
		if("text/plain" in data){
			dataObj = {};
			dataObj['timestamp'] = timeChanged;
			var textData = data['text/plain'];
			dataObj['format'] = ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT;
			dataObj['formatname'] = "";
			textData = ClipFormatConverter.convertData(ClipFormatConverter.replaceslashRtoslashRN(textData), ClipFormatConverter.FORMAT_STRING, ClipFormatConverter.FORMAT_WINDOWS_UNICODE_TEXT);
			dataObj['data'] = textData;
			dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEU2C;
			myself.sendSessionManagerCmd(dataObj);
		}
		if("text/html" in data){
			dataObj = {};
			dataObj['timestamp'] = timeChanged;
			var htmlData = data['text/html'];
			dataObj['format'] = ClipFormatConverter.FORMAT_PRIVATE;
			dataObj['formatname'] = ClipFormatConverter.FORMAT_NAME_HTML;
			htmlData = ClipFormatConverter.convertData(htmlData, ClipFormatConverter.FORMAT_NAME_HTML, ClipFormatConverter.FORMAT_STRING);
			dataObj['data'] = htmlData;
			dataObj['cmd'] = WorkerCommand.SEAMLESS_CLIPBOARD_RESPONSEU2C;
			myself.sendSessionManagerCmd(dataObj);
		}
	};

	this.setDisplayCursor = function(cursor, hotspot) {
		var data = {};
		data.cmd = WorkerCommand.SET_MOUSE_CURSOR;
		data.cursor = cursor;
		data.X = hotspot.X;
		data.Y = hotspot.Y;
		data.source = myself.WrapperId;
		data.destination = myself.WrapperId;
		selfSender.processSelfWrapperCmd(data);
	};
	
	this.closeUsbDevice = function(device,status)
	{
	  var data = {
			'cmd' : WorkerCommand.CMD_USB_CLOSE_DEVICE,
			'device':device,
			'status': status
		};
		data.source = myself.WrapperId;
		data.destination = usbWrapper.WrapperId;
		usbWrapper.processOtherWrapperCmd(data);
	};
	this.transferUsbDevice = function(device)
	{
		var data = {
			'cmd' : WorkerCommand.CMD_USB_TRANSFER_RELEASING,
			'device':device
		};
		data.source = myself.WrapperId;
		data.destination = usbWrapper.WrapperId;
		usbWrapper.processOtherWrapperCmd(data);
	};
	this.releaseOtherSessionDevices = function(device)
	{
	  var data = {
			'cmd' : WorkerCommand.CMD_USB_RELEASE_ALL,
			'device':device
		};
		data.source = myself.WrapperId;
		data.destination = usbWrapper.WrapperId;
		usbWrapper.processOtherWrapperCmd(data);
	};
		this.closeSessionUsbDevices = function(sessionName)
	{
	  var data = {
			'cmd' : WorkerCommand.CMD_USB_RELEASE_DEVICES,
			'sessionName': sessionName
		};
		data.source = myself.WrapperId;
		data.destination = usbWrapper.WrapperId;
		usbWrapper.processOtherWrapperCmd(data);
	};
	this.transferAdding = function(device)
	{
		var data = {
			'cmd' : WorkerCommand.CMD_USB_TRANSFER_ADDING,
			'device':device
		};
		data.source = myself.WrapperId;
		data.destination = usbWrapper.WrapperId;
		usbWrapper.processOtherWrapperCmd(data);
	};
	this.BuildDevice = function(productId,vendorId,device)
	{		var data = {
			'cmd' : WorkerCommand.CMD_USB_BUILD_DEVICE,
			'productId':productId,
			'vendorId':vendorId,
			'device':device,
			'deviceName':"",
			'deviceOwner':""
		};
		data.source = myself.WrapperId;
		data.destination = usbWrapper.WrapperId;
		usbWrapper.processOtherWrapperCmd(data);
	};
    
    
  this.getAllDevicesList = function()
  {
    var data ={
      'cmd': WorkerCommand.CMD_USB_LIST
    };
    data.source = myself.WrapperId;
    data.destination = usbWrapper.WrapperId;
    usbWrapper.processOtherWrapperCmd(data);
  }
	this.writePacketKeyboardUnicode = function writePacketKeyboardUnicode(unicode, typeOfKey) {
		var data = {
			'cmd' : WorkerCommand.CMD_WRITEKBDPACKET,
			'unicode' : unicode,
			'typeOfKey' : typeOfKey
		};
		data.source = myself.WrapperId;
		data.destination = icaWrapper.WrapperId;
		icaWrapper.processOtherWrapperCmd(data);
	};

	this.writePacketKeyboardSingleScanCode = function writePacketKeyboardSingleScanCode(scancode, isKeyUp){
		var data = {
			'cmd' : WorkerCommand.CMD_WRITE_SINGLESCANCODE_PACKET,
			'scancode' : scancode,
			'isKeyUp' : isKeyUp
		};
		data.source = myself.WrapperId;
		data.destination = icaWrapper.WrapperId;
		icaWrapper.processOtherWrapperCmd(data);
	};

	this.writePacketSetLed = function writePacketSetLed(ledBitmask) {
		var data = {
			'cmd' : WorkerCommand.CMD_WRITESETLEDPACKET,
			'ledBitmask' : ledBitmask
		};
		data.source = myself.WrapperId;
		data.destination = icaWrapper.WrapperId;
		icaWrapper.processOtherWrapperCmd(data);
	};

	this.mousePressed = function mousePressed(x, y, buttonNo) {
		var data = {
			'cmd' : WorkerCommand.CMD_WRITE_SINGLEMOUSE_PACKET,
			'x' : x,
			'y' : y,
			'buttonNo' : buttonNo
		};
		data.source = myself.WrapperId;
		data.destination = icaWrapper.WrapperId;
		data.state = MouseConstant.CLICK_TYPES[buttonNo];
		data.uiType = MouseConstant.UI_TYPES[buttonNo];
		icaWrapper.processOtherWrapperCmd(data);
	};

	this.mouseReleased = function mouseReleased(x, y, buttonNo) {
		var data = {
			'cmd' : WorkerCommand.CMD_WRITE_SINGLEMOUSE_PACKET,
			'x' : x,
			'y' : y,
			'buttonNo' : buttonNo
		};
		data.source = myself.WrapperId;
		data.destination = icaWrapper.WrapperId;
		data.state = MouseConstant.CLICK_TYPES[buttonNo] << 1;
		data.uiType = MouseConstant.UI_TYPES[buttonNo];
		icaWrapper.processOtherWrapperCmd(data);
	};

	this.mouseMoved = function mouseMoved(x, y) {
		var data = {
			'cmd' : WorkerCommand.CMD_WRITE_SINGLEMOUSE_PACKET,
			'x' : x,
			'y' : y
		};
		data.source = myself.WrapperId;
		data.destination = icaWrapper.WrapperId;
		data.state = MouseConstant.MOUSE_STATUS_MOVED;
		data.uiType = MouseConstant.MOUSE_DATA_CLIENT_NORMAL;
		icaWrapper.processOtherWrapperCmd(data);
	};

	this.mouseWheelMoved = function mouseWheelMoved(x, y, amount) {
		var data = {
			'cmd' : WorkerCommand.CMD_WRITE_SINGLEMOUSE_PACKET,
			'x' : x,
			'y' : y,
			'amount' : amount
		};
		data.source = myself.WrapperId;
		data.destination = icaWrapper.WrapperId;
		data.state = MouseConstant.MOU_STATUS_WHEEL;
		data.uiType = MouseConstant.MOUSE_DATA_CLIENT_EXTRA;
		icaWrapper.processOtherWrapperCmd(data);
	};
    
    this.setNativeGfxSurfaceSize = function(width, height) {
        ctxWrapper.setModuleSize(width, height);
    };
	

	function handleIcaWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		switch(cmd){
			case WorkerCommand.SESSION_READY_EVENT:				
				myself.mainEngine.postReceiverEvent("onConnection",{'state' : 'sessionReady'});
				break;
			case WorkerCommand.ERR_MSG:
				ShowError(dataObj);	
				break;
	        case WorkerCommand.EUKS:
	            icaFrame.EUKSEnabled(dataObj.enabled);
				break;
	        case WorkerCommand.CMD_CLOSECURRENTTAB:
				myself.mainEngine.closeCurrentTab(true);
				break;
	        case WorkerCommand.SHOW_RECONNECTING_SCREEN:
				console.log("Showing Reconnecting Screen");
				myself.mainEngine.uiEngine.showReconnectingOverlay(dataObj['dimmingPercent']);
	            break;
			case WorkerCommand.HIDE_RECONNECTING_SCREEN:
				console.log("Hiding Reconnecting Screen");
				myself.mainEngine.uiEngine.hideReconnectingOverlay();
	            break;
            case WorkerCommand.CTXMODULE_CREATE:
                    if (ctxWrapper) {
                        ctxWrapper.initialize();
                    }
                    break;
            case WorkerCommand.SESSION_INFO:
                seamlessUiWrapper.execute(dataObj.data);
                break;         
           }
          
	}

	function handleCVCWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.URL_REDIRECTION_MSG) {
			ShowUrlRedirectionMessage(dataObj);
		} else if (cmd === WorkerCommand.SEAMLESS_WINDOW_SHOW) {
			HTML5Interface.window.focus();
		}
	}
function handleUSBWrapperCmd(dataObj) {
			var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.USB_INIT) {
            myself.usbEnabled = true;
			myself.mainEngine.uiEngine.enableUSBButton();
		} else if(cmd === WorkerCommand.USB_UPDATE_DEVICE){
			myself.mainEngine.uiEngine.notifyUsbUi(dataObj);
		}
		else if(cmd === WorkerCommand.CMD_USB_SENDING_LIST){
			myself.mainEngine.uiEngine.notifyUsbUi(dataObj);
		}
	}
		
	function handelPrinterWrapperCmd(dataObj) {
		var cmd = dataObj['cmd'];
		var pass_data;
	        switch (cmd){
	            case WorkerCommand.OPEN_PDF_PRINT_FILE:
	                pass_data = dataObj.msg;
	                myself.mainEngine.uiEngine.showPrintData(pass_data,PDFFileStatusCallBack);
	                break;
	            case WorkerCommand.TOTAL_FILES:
	                pass_data = dataObj.msg;
	                myself.mainEngine.uiEngine.showTotalFile(pass_data.message);
	                break;
	            case WorkerCommand.SHOW_DOWNLOADING_PDF_FILE:
	                myself.mainEngine.uiEngine.showDownloadingPDFDialog();
	                break;
	            case WorkerCommand.HIDE_DOWNLOADING_PDF_FILE:
	                myself.mainEngine.uiEngine.hideDownloadingPDFDialog();
	                break;
	            case WorkerCommand.OPEN_PDF_PRINT_WINDOW_CHROME_APP:
	                pass_data = dataObj.msg;
	                myself.mainEngine.uiEngine.openChromeAppPrintWindow(pass_data);
	                break;
                case WorkerCommand.KIOSK_MODE_SEND_PRINT_OBJECT:
                    pass_data = dataObj.msg;
                    myself.mainEngine.uiEngine.kioskModeSendPrintObject(pass_data,PDFFileStatusCallBack);
                    break;
        	}
	}
	
	function PDFFileStatusCallBack(status) {
		var data = {
			'cmd' : WorkerCommand.OPEN_PDF_PRINT_FILE_STATUS,
			'status' : status
		};
		data.source = DRIVERID.ID_UI;
		data.destination = DRIVERID.ID_PRINTER;
		printerWrapper.processOtherWrapperCmd(data);
	}
	
	function handleFileVCWrapperCmd(dataObj) {
		var cmd = dataObj.cmd;
		if (cmd === WorkerCommand.FILE_INIT) {
			myself.mainEngine.uiEngine.enableFileTransferButtons();
		} 
		else if (cmd === WorkerCommand.FILE_UPLOAD_RESPONSE_RECEIVED) {
			myself.mainEngine.uiEngine.processUploadResponseNotification();
		}
		else if (cmd === WorkerCommand.FILE_TRANSFER_CONFIG) {
			myself.mainEngine.uiEngine.sendFileTransferConfig(dataObj['maxfilecount']);
		}
	}

	function ShowError(data) {
		var pass_data = JSON.parse(data.msg);
		// We should translate the message to l10n string here, $.t is not avalible in child thread
		var message = pass_data.message;
		var text = pass_data.bText;
		var textheader = pass_data.textheader;
		myself.mainEngine.uiEngine.showError(textheader, message, text, pass_data.disableClose, pass_data.cb);
	}

	function ShowUrlRedirectionMessage(data) {
		var pass_data = JSON.parse(data.msg);
		myself.mainEngine.uiEngine.showURLMessage(pass_data.message, urlRedirectionStatusCallBack);
	}

	var urlRedirectionStatusCallBack = function(status) {
		var data = {
			'cmd' : WorkerCommand.CMD_URL_REDIRECTION_STATUS,
			'status' : status
		};
		data.source = DRIVERID.ID_UI;
		data.destination = DRIVERID.ID_CTL;
		cvcWrapper.processOtherWrapperCmd(data);
	};
    function sendToSeamlessVC(data){
    	var dataObj = {};
    	dataObj.cmd = WorkerCommand.UIMANAGER_TO_SEAMLESS;
    	dataObj.source = DRIVERID.ID_UI;
		dataObj.destination = DRIVERID.ID_TWI;
		dataObj.data = data;
		twiWrapper.processOtherWrapperCmd(dataObj);
    } 
    
    
    function connectionCenterAction(msg){
      this.hello="wassup";
      switch(msg.action){
        case 'logoff':
        case 'terminate':
          //console.log('logoff is called');
          sendToSeamlessVC(msg);
          break;
        case 'disconnect':
          //console.log("disconnect is called");
          myself.mainEngine.closeCurrentTab(true);
          break;
        case 'ctrlaltdel':
          //console.log('ctrlaltdel is called');
          this.mainEngine.uiEngine.initiateCtrlAltDel();
          break;
		case 'devices':
			//console.log('devices is called');
			if(usbClickHandler){
				usbClickHandler();
			}
			break;
        default:
          console.log("bad message");
      }
    }
    this.connectionAction = connectionCenterAction;
    
  
	function onSessionInfocallback(message){
		if(message && message.cmd === "sessionInfo"){
			if(message.attributes){
				if(message.attributes.seamlessMode){
					g.environment.receiver.seamlessMode = message.attributes.seamlessMode;
					if(message.attributes.seamlessMode === true){
						if(g.environment.receiver.isChromeApp && !g.environment.receiver.isKiosk){
						//Toolbar should be initialized only after the reading  menubar field from configuration
						if(HTML5_CONFIG && HTML5_CONFIG['ui']&& HTML5_CONFIG['ui']['toolbar'] && HTML5_CONFIG['ui']['toolbar']['menubar'] == true){
								UiControls.Toolbar.hide();
							}
						}else{
							if(appSwitcher === null && (HTML5_CONFIG['ui']['appSwitcher']['showTaskbar'] !== false || HTML5_CONFIG['ui']['toolbar']['switchApp'] !== false)){
								var prefs = myself.mainEngine.getClientInfo();								
								appSwitcher = new UiControls.AppSwitcher(seamlessUiWrapper,prefs);
								appSwitcher.initialize();
							}
						}
					}
				}
				if(message.attributes.serverName){
					HTML5Interface.window.setTitle({Title:message.attributes.serverName});
				}
				if(message.attributes.icon){
					var type = 'image/png';
					HTML5Interface.window.setIcon({type:type, url: message.attributes.icon.iconData.rawdata });
				}
			}
		}
	}
	this.initialize = function(cmd, engineThread, configdata) {
		if (cmd === THREADCOMMAND.INIT_ENGINE) {
			config = configdata;
			this.isInitialize = true;
			if (engineThread) {
				selfSender = engineThread;
			} else {
                 surfInterface = new RenderSurfInterface(myself);
				/*
				 * optimized wraqpper function call
				 *
				 */
				selfSender = myself;
				myself.processOtherWrapperCmd = processThreadCommand;
				myself.processSelfWrapperCmd = processThreadCommand;
				myself.postMessage = processThreadCommand;
				if (this.mainEngine) {
					this.mainEngine.uiEngine.setUiWrapper(myself);
					icaFrame = this.mainEngine.icaEngine.icaframe;
				}
			}
		}
	};
}
