function MainWorkerManager(icaData, mainEngine, icaFrame,  startupInfo) {
	icaData["startSCD"] = startupInfo.startSCD;
	icaData["IFDCD"] = startupInfo.icaTime;
    icaData['TWIMode'] = icaData['TWIMode']?icaData['TWIMode']:false;
	function onMessageFromWorker(event) {
		var data = event.data;
		switch( data.destination ) {
			case DRIVERID.ID_WINSTATION:
			case DRIVERID.ID_GENERICWRITE :
			case DRIVERID.ID_GENERIC_INFO:
				icaWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_THINWIRE:
				thinwireWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_UI:
				uiWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_TWI:
				twiWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_AUDIO:
				audioWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_CTL:
				ctlWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_EUEM:
				euemWrapper.processSelfWrapperCmd(data);
				break;
		    case DRIVERID.ID_USB:
		        usbWrapper.processSelfWrapperCmd(data);
		        break;
			case DRIVERID.ID_FILE:
				fileWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_MOBILE:
				if(mrvcWrapper){
					mrvcWrapper.processSelfWrapperCmd(data);
				}
				break;
				case DRIVERID.ID_SCARD:
				scardWrapper.processSelfWrapperCmd(data);
			default:
				throw new Error("Unknown destination inside MainWorkerManager " + data.destination);

		}
	}

    var moduleWrappers = {},
        ctxWrapper;

    if (HTML5Interface.ChromeNacl.isAvailable()) {
        ctxWrapper = new CtxWrapper(moduleWrappers);
        Utility.setCtxWrapper(ctxWrapper);
    }
        
	var usbWrapper = null;
	var uiWrapper = null;
	var icaWrapper = null;
	var twiWrapper = null;
	var clipBoardWrapper = null;
	var ctlWrapper = null;
	var audioWrapper = null;
	var euemWrapper = null;
	var printerWrapper=null;
	var serialWrapper = null;
	var fileWrapper = null;
	var scardWrapper = null;
    var mmWrapper = null;
	var mrvcWrapper = null;
	var multiTouchWrapper = null;
	var virtualChannel = [];
	var thread2 = null;
	var supportedChannel = HTML5_CONFIG['vc_channel'];
	var sessionMgrWrapper = null;
	var sessionManagerPort = null;
	var rcvManagerPort = null;
	var rcvMgrWrapper = null;
	var isseamlessUsb = true;
	var shared_worker_support = ( typeof SharedWorker != 'undefined');
	var isSharedMgr =shared_worker_support;
	var messageChannelSupport = ( typeof MessageChannel != 'undefined');
	var isseamlessclip = HTML5_CONFIG['features']['seamlessclip'] && ( shared_worker_support == true);
	var isSeamlessWindow = HTML5_CONFIG['features']['seamlesswindow'] && ( shared_worker_support == true);
	var isSessionSharing = HTML5_CONFIG['features']['sessionsharing'] && ( shared_worker_support == true);
	var isUiClip = (HTML5_CONFIG['ui']['toolbar'] && (HTML5_CONFIG['ui']['toolbar']['clipboard'] !== false) && (HTML5_CONFIG['ui']['toolbar']['menubar'] !== false));
	var isUiUsb = (HTML5_CONFIG['ui']['toolbar'] && (HTML5_CONFIG['ui']['toolbar']['usb'] !== false) && (HTML5_CONFIG['ui']['toolbar']['menubar'] !== false));//Read from config
	var startSCCD;

	this.closeConnection = function(error_code) {
		icaWrapper.TerminateConnection(WorkerCommand.CMD_CLOSECURRENTTAB, null);
		if (sessionManagerPort) {
			uiWrapper.sendSessionManagerCmd({
				'cmd' : WorkerCommand.CMD_CLOSECURRENTTAB,
				'reason' : null
			});
			sessionManagerPort.close();
		}
		if (rcvManagerPort) {
			uiWrapper.sendRcvManagerCmd({
				'cmd' : WorkerCommand.CMD_CLOSECURRENTTAB,
				'reason' : null,
				'sessionName': document.title
			});
			rcvManagerPort.close();
		}
	};

	if (isseamlessclip === true || isSharedMgr === true) {
		var rcvMgrWrPAth = createWorkerPath(THREADID.RECEIVER_MANAGER);
		var rcvManagerThread = new SharedWorker(rcvMgrWrPAth);
		rcvManagerPort = rcvManagerThread.port;
		rcvManagerThread.onerror = function(error) {
			console.log("error in receiver Manager initialization");
		};
		rcvManagerPort.addEventListener('message', onMessageFromReceiverManager);
		rcvManagerPort.start();
	}

	if (isSharedMgr === true) {
		var addressInfo = Utility.getAddressInfo(icaData);
		rcvManagerPort.postMessage({
			'cmd' : WorkerCommand.REQUESRT_UNIQUE_ID,
			'source' : DRIVERID.ID_UI,
			'destination' : DRIVERID.ID_RECEIVER_MANAGER,
			'connectAddress' : addressInfo['connectAddress'],
			'connectPort' : addressInfo['connectPort'],
			'isSSLEnabled' : addressInfo['isSSLEnabled'],
			'SessionsharingKey':icaData['SessionsharingKey'],
			'TWIMode':icaData['TWIMode']
		});
	} else {
		var timestamp = HTML5Interface.timeStamp();
		start(timestamp());
	}

	function onMessageFromSessionManager(event) {
		var data = event.data;
		switch( data.destination ) {
			case DRIVERID.ID_UI:
				if (data['cmd'] === WorkerCommand.REGISTER_SESSION_PORT) {
					data['byref'] = [event.ports[0]];
				}
				uiWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_WINSTATION:
			case DRIVERID.ID_GENERICWRITE :
			case DRIVERID.ID_GENERIC_INFO:
				icaWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_CTL:
				ctlWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_FILE:
				fileWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_SCARD:
				scardWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_CLIPBOARD:
				clipBoardWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_RECEIVER_MANAGER:
				 rcvMgrWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_USB:
				 usbWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_MOBILE:
				if(mrvcWrapper){
					mrvcWrapper.processSelfWrapperCmd(data);
				}
				break;
			default:
				console.log("*******************************" + event.data.message);
		}

	}

	function onMessageFromReceiverManager(event) {
		var data = event.data;
		switch( data['destination'] ) {
			case DRIVERID.ID_SESSION_MANAGER:
				if (data['cmd'] === WorkerCommand.REPLY_UNIQUE_ID) {
					start(data['sessionkey']);
				} else {
					sessionMgrWrapper.processSelfWrapperCmd(data);
				}
				break;
		}
	}

	function initializeWebWorker() {
		if (Utility.isWorkerEnabled()) {
			var path = createWorkerPath(THREADID.THREAD2);
			thread2 = new Worker(path);
			UiControls.ResolutionUtility.registerCallback(UiControls.ResolutionUtility.constants.registerForAll ,function(type ,data){
				var dataObj = {
					'source' : DRIVERID.ID_UI,
					'destination' : DRIVERID.ID_UI,
					'cmd' : WorkerCommand.NOTIFY_RESOLUTION_CHANGE,
					type : type,
					data :data
				};
				thread2.postMessage(dataObj);
			}.bind(this));
			thread2.onerror = function(event) {
				console.log("in error");
			};
			thread2.addEventListener('message', onMessageFromWorker);
		}
	}

	MainWorkerManager.sendMessageToTh2 = function(msg)
	{
	    thread2.postMessage(msg);
	}
	function initializeSharedWorker(sessionkey) {
		if (isSessionSharing === true) {
			var sessionWorkerPath = createWorkerPath(THREADID.SESSION_MANAGER, sessionkey);
			var sessionManagerThread = new SharedWorker(sessionWorkerPath);
			sessionManagerPort = sessionManagerThread.port;
			sessionManagerThread.onerror = function(error) {
				console.log("error in seamless initialization");
			};
			sessionManagerPort.addEventListener('message', onMessageFromSessionManager);
			sessionManagerPort.start();
		}
	}

	function initializeWrappers(sessionkey) {
        
        Profiler.Ui.initialize("CitrixSuperRenderCanvas");
        mainEngine.sessionId = sessionkey;
		startSCCD = Date.now();
		sessionMgrWrapper = new SessionManagerWrapper();
		rcvMgrWrapper = new ReceiverManagerWrapper();
        uiWrapper = new UiWrapper(null, mainEngine, moduleWrappers);
		icaWrapper = new IcaThreadWrapper(uiWrapper, moduleWrappers);
		thinwireWrapper = new ThinwireWrapper(uiWrapper, icaWrapper, moduleWrappers, supportedChannel);
      
		twiWrapper = new TWIWrapper(uiWrapper, icaWrapper, supportedChannel);
		clipBoardWrapper = new ClipBoardWrapper(uiWrapper, icaWrapper, supportedChannel);
		ctlWrapper = new CVCWrapper(uiWrapper, icaWrapper, supportedChannel);
		audioWrapper = new AudioWrapper(null, icaWrapper, moduleWrappers, supportedChannel);
		euemWrapper = new EuemWrapper(null,icaWrapper, supportedChannel);
		printerWrapper = new PrinterWrapper(uiWrapper , icaWrapper,supportedChannel);
		if(isChromeOS == true && g.environment.receiver.isChromeApp == true){
			serialWrapper = new SerialWrapper(uiWrapper,icaWrapper,supportedChannel);
		}
		usbWrapper = new UsbWrapper(uiWrapper, icaWrapper, supportedChannel);
		fileWrapper = new FileWrapper(uiWrapper, icaWrapper, supportedChannel);
		if(isChromeOS == true && g.environment.receiver.isChromeApp == true){
			scardWrapper = new SCardWrapper(uiWrapper, icaWrapper, supportedChannel);
		}
		if((g.environment.os.isTouch)){
			mrvcWrapper = new MRVCWrapper(uiWrapper, icaWrapper, supportedChannel);			
			multiTouchWrapper = new MultiTouchWrapper(uiWrapper,icaWrapper,supportedChannel);
		}
		
		var customVCs = mainEngine.getCustomVCInfo();
		//TODO : To allocate dynamically in future
		var ChannalNoForCustomVCs = ChannalMap.availableChannalNosForCustomVC; 
		for(var i=0;i<customVCs.length;i++){						
			ChannalMap.revVirtualChannalMap[customVCs[i].channel] = customVCs[i]["streamName"];
			ChannalMap.virtualChannalMap[customVCs[i]["streamName"]] = customVCs[i].channel = ChannalNoForCustomVCs[i];
			var wrapper = new CustomVCWrapper(customVCs[i],icaWrapper);
			customVCs[i].wrapper = wrapper;
			customVCs[i].wrapper.initialize();
			icaWrapper.setChannelConsumer(wrapper , wrapper.streamName);			
		}
		icaWrapper.setCustomVC(customVCs);
		
        mmWrapper = new MultimediaWrapper("CTXMM  ", moduleWrappers,supportedChannel);     
      
		uiWrapper.setIcaWrapper(icaWrapper);
		uiWrapper.seamlessWrapper(twiWrapper);
		uiWrapper.setSessionManager(sessionMgrWrapper);
		uiWrapper.setReceiverManager(rcvMgrWrapper);
		uiWrapper.setClipboardWrapper(clipBoardWrapper);
		uiWrapper.setCVCWrapper(ctlWrapper);
		uiWrapper.setFileWrapper(fileWrapper);
		uiWrapper.setEuemWrapper(euemWrapper);
        uiWrapper.setCtxWrapper(ctxWrapper);                
		ctlWrapper.setEuemWrapper(euemWrapper);
		thinwireWrapper.setEuemWrapper(euemWrapper);
		thinwireWrapper.setTwiWrapper(twiWrapper);
        thinwireWrapper.setCtxWrapper(ctxWrapper);
		uiWrapper.setPrinterWrapper(printerWrapper);
		if(serialWrapper){
			uiWrapper.setSerialWrapper(serialWrapper);
		}
        if (ctxWrapper) {
			ctxWrapper.setThinwireWrapper(thinwireWrapper);
		}
         uiWrapper.setUsbWrapper(usbWrapper);       
		 uiWrapper.setMultiTouchWrapper(multiTouchWrapper);       
		icaFrame.SetCallBackWrapper(uiWrapper);
		sessionMgrWrapper.setIcaWrapper(icaWrapper);
		sessionMgrWrapper.setCVCWrapper(ctlWrapper);
		sessionMgrWrapper.setClipWrapper(clipBoardWrapper);
		sessionMgrWrapper.setUsbWrapper(usbWrapper);
		clipBoardWrapper.setSessionMgrWrapper(sessionMgrWrapper);
		usbWrapper.setSessionMgrWrapper(sessionMgrWrapper);
		        	
		/*
		 * All this have Engine in main thread so initialize their engine & corresponding variablein main thread
		 *
		 * second argument null means that all variable that this thread lie into current thread
		 */
        // create embed element only for new session so moving this initialization code to icathreadwrapper
        // ctxWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null);
                
		uiWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null, {sessionKey : sessionkey}); 
		icaWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null , {sessionKey : sessionkey});
		
		sessionMgrWrapper.initialize(THREADCOMMAND.INIT_ENGINE, sessionManagerPort);
		rcvMgrWrapper.initialize(THREADCOMMAND.INIT_ENGINE, rcvManagerPort);		
		uiWrapper.sendRcvManagerCmd({
			'cmd' : WorkerCommand.REGISTER_SESSION,
			'type' : "session"
		});
		if (isSessionSharing !== true) {
			var winInstance = sessionMgrWrapper.registerNewWindow(uiWrapper, uiWrapper);
			sessionMgrWrapper.setWindowInstance(winInstance);
		}
		uiWrapper.sendSessionManagerCmd({
			'cmd' : WorkerCommand.REGISTER_SESSION,
			'type' : "session"
		});

		thinwireWrapper.initialize(THREADCOMMAND.INIT_ENGINE);

		twiWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null , {sessionkey: sessionkey });
		clipBoardWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null);
		euemWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null);

		var cmdLineParam = "";
		if (icaData['cmdLine'] || icaData['LongCommandLine']) {
			if (icaData['LongCommandLine'] != "") {
				cmdLineParam = icaData['LongCommandLine'];
			} else if (icaData['cmdLine'] != "") {
				cmdLineParam = icaData['cmdLine'];
			}
		}
		ctlWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null, {
			'cmdLine' : cmdLineParam,
			'initialprogram' : icaData['InitialProgram']
		});
		
		var audioConfig = {
							'HTML5_Audio_Buffer_Duration' : (HTML5_CONFIG['features']['audio'] && (HTML5_CONFIG['features']['audio']['HTML5_Audio_Buffer_Duration'] !== null))? HTML5_CONFIG['features']['audio']['HTML5_Audio_Buffer_Duration']:250,
							'HTML5_Audio_Lag_Threshold'	  :	( HTML5_CONFIG['features']['audio'] && (HTML5_CONFIG['features']['audio']['HTML5_Audio_Lag_Threshold'] !== null))? HTML5_CONFIG['features']['audio']['HTML5_Audio_Lag_Threshold']:250
						};
		audioWrapper.initialize(THREADCOMMAND.INIT_ENGINE,thread2,audioConfig);
		audioWrapper.initialize(THREADCOMMAND.INIT_AUDIOPLAYER, null);
		printerWrapper.Initialize(THREADCOMMAND.INIT_ENGINE , null);
		

		fileWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null);
		icaWrapper.setChannelConsumer(thinwireWrapper, thinwireWrapper.streamName);
		icaWrapper.setChannelConsumer(twiWrapper, twiWrapper.streamName);
		icaWrapper.setChannelConsumer(clipBoardWrapper, clipBoardWrapper.streamName);
		icaWrapper.setChannelConsumer(ctlWrapper, ctlWrapper.streamName);
		icaWrapper.setChannelConsumer(audioWrapper, audioWrapper.streamName);
		icaWrapper.setChannelConsumer(fileWrapper, fileWrapper.streamName);
		icaWrapper.setChannelConsumer(euemWrapper, euemWrapper.streamName);
		icaWrapper.setChannelConsumer(printerWrapper , printerWrapper.streamName);
		
		if(mrvcWrapper){
			mrvcWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null);		
			icaWrapper.setChannelConsumer(mrvcWrapper , mrvcWrapper.streamName);
		}		
		if(multiTouchWrapper){
			multiTouchWrapper.initialize(THREADCOMMAND.INIT_ENGINE,null);
			icaWrapper.setChannelConsumer(multiTouchWrapper, multiTouchWrapper.streamName);
		}
		
		usbWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null);
		icaWrapper.setChannelConsumer(usbWrapper, usbWrapper.streamName);
		if(serialWrapper)
		{
			icaWrapper.setChannelConsumer(serialWrapper , serialWrapper.streamName);
			serialWrapper.Initialize(THREADCOMMAND.INIT_ENGINE,null);
		}
		if(scardWrapper){
			icaWrapper.setChannelConsumer(scardWrapper, scardWrapper.streamName);
        	scardWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null);
		}
        
        if (mmWrapper.initEngine()) {
            icaWrapper.setChannelConsumer(mmWrapper, mmWrapper.streamName);
        }
        
		uiWrapper.sendRcvManagerCmd({
			'cmd' : WorkerCommand.SESSION_WINDOW_INFO,
			'sessionkey' : sessionkey,
			'seamlesswindow' : isSeamlessWindow,
			'sessionsharing' : isSessionSharing,
			'seamlessclip' : isseamlessclip,
			'seamlessusb' : isseamlessUsb //isUiUsb
		});
		uiWrapper.sendRcvManagerCmd({
			'cmd' : WorkerCommand.REGISTER_AS_NEW_INSTANCE
		});
		if (isSessionSharing !== true) {
			var clipHelper = new ClipboardHelper(sessionMgrWrapper);
			sessionMgrWrapper.setClipboardHelper(clipHelper);
			if (isseamlessclip === true) {
				sessionMgrWrapper.setrcvManager(rcvMgrWrapper);
			}
		}
		if ((isseamlessclip === true || isseamlessUsb == true)&& isSessionSharing === true) {
			if(messageChannelSupport === true){
				uiWrapper.sendSessionManagerCmd({
                    'cmd' : WorkerCommand.NOTIFY_FOR_CREATE_CHANNEL,
                    'port1' : DRIVERID.ID_SESSION_MANAGER,
                    'port2' : DRIVERID.ID_RECEIVER_MANAGER
                });
			}else{
				uiWrapper.sendSessionManagerCmd({
					'cmd' : WorkerCommand.CMD_SET_RCV_MGR
				});
				uiWrapper.sendRcvManagerCmd({
					'cmd' : WorkerCommand.REGISTER_CLIPBOARD
				});
			}
			
		} else {
		  if (isseamlessclip === true) {
			uiWrapper.sendRcvManagerCmd({
				'cmd' : WorkerCommand.REGISTER_CLIPBOARD
			});
		  }
		  if(isseamlessUsb == true ){
				uiWrapper.sendRcvManagerCmd({
					'cmd' : WorkerCommand.REGISTER_USB
				});
			}
		}
		/*
		 * If seamless window in not present then all Ica processing will happen in
		 * main thread and webworker theads
		 */
		if (isSeamlessWindow !== true) {
			uiWrapper.sendSessionManagerCmd({
				'cmd' : WorkerCommand.REGISTER_ENGINE,
				'port' : "self",
				'type' : "ICA"
			});
			uiWrapper.sendSessionManagerCmd({
				'cmd' : WorkerCommand.REGISTER_ENGINE,
				'port' : "self",
				'type' : 'CTXCTL '
			});
			uiWrapper.sendSessionManagerCmd({
				'cmd' : WorkerCommand.REGISTER_ENGINE,
				'port' : "self",
				'type' : 'CTXCLIP'
			});
				uiWrapper.sendSessionManagerCmd({
				'cmd' : WorkerCommand.REGISTER_ENGINE,
				'port' : "self",
				'type' : 'CTXGUSB'
			});
		}
		if (isUiClip === true) {
			uiWrapper.sendSessionManagerCmd({
				'cmd' : WorkerCommand.CMD_ENABLE_UI_CLIP,
			});
		}
		if (isUiUsb === true) {
			uiWrapper.sendSessionManagerCmd({
				'cmd' : WorkerCommand.CMD_ENABLE_UI_USB,
			});
		}
		uiWrapper.sendSessionManagerCmd({
			'cmd' : WorkerCommand.REGISTER_SESININFO,
			'sessionkey' : sessionkey,
			'seamlesswindow' : isSeamlessWindow,
			'sessionsharing' : isSessionSharing,
			'seamlessclip' : isseamlessclip,
			'seamlessusb' : isseamlessUsb //isUiUsb
		});

		uiWrapper.sendSessionManagerCmd({
			'cmd' : WorkerCommand.SESSION_LAUNCH_APPLICATION,
			'icaData' : icaData,
			'browserType' : PlatformInfo["browserid"],
			'secprotocol' : HTML5_CONFIG['other']['sec_protocol']
		});
	}

	function start(sessionkey) {
		initializeWebWorker();
		initializeSharedWorker(sessionkey);
		initializeWrappers(sessionkey);
		uiWrapper.setEuemSCCD(startSCCD);
	};
}

function createWorkerPath(id, sessionkey) {
	var path = HTML5_WORKER_URL + "&tid=" + id;
	if (sessionkey) {
		path = path + "&sessionkey=" + sessionkey;
	}
	return path;
}
