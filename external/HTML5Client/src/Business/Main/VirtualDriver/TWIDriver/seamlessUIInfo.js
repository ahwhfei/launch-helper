var seamlessUIFromatFactory = (function(intlzr) {
	var pendingUICmds = { };
	var sessionId = -1;
	var callback;
	var listeners = { };
	function addEventListener(listenerObj) {
		for (var key in listenerObj) {
			if (listenerObj.hasOwnProperty(key)) {
				listeners[key] = listenerObj[key];
			}
		}
	}

	function parseClientData(dataObj) {
		if (dataObj.cmd == 'close') {
			if (listeners.terminateWindow) {
				twiConstant.writeSeamlessLog({'cmdType':'C2H','cmd':'terminate','hostID' : dataObj.window_info.appId });
				listeners.terminateWindow(dataObj.window_info.appId);
			}
		} else if (dataObj.cmd == 'update') {
			if (dataObj.attributes && dataObj.attributes.focus && (dataObj.attributes.focus == true)) {
				twiConstant.writeSeamlessLog({'cmdType':'C2H','cmd':'focus','hostID' : dataObj.window_info.appId });
				if (listeners.focus) {
					listeners.focus(dataObj.window_info.appId);
				}
			}
			if (dataObj.attributes && dataObj.attributes.dimension && dataObj.attributes.dimension.position) {
				if (listeners.resize) {
					var position = dataObj.attributes.dimension.position;
					twiConstant.writeSeamlessLog({'cmdType':'C2H','cmd':'changePosition','hostID' : dataObj.window_info.appId ,'rect':{'left': position.left, 'top': position.top, 'width' : position.width,'height':position.height } });
					listeners.resize(dataObj.window_info.appId, position.left, position.top, position.width, position.height);
				}
			}
		} else if (dataObj.cmd == 'action') {
			if (dataObj.action == 'logoff') {
				twiConstant.writeSeamlessLog({'cmdType':'C2H','cmd':'logoff' });
				listeners.logoff( );
			} else if (dataObj.action == 'terminate') {
				twiConstant.writeSeamlessLog({'cmdType':'C2H','cmd':'terminate', 'hostID':dataObj.window_info.appId });
				listeners.terminateWindow(dataObj.window_info.appId);
			}else if(dataObj.action == 'blursession'){
				twiConstant.writeSeamlessLog({'cmdType':'C2H','cmd':'blursession' });
				listeners.blurSessionApps(dataObj.bTimeStamp);
			}else if(dataObj.action == 'focussession'){
				listeners.focusSession( );
			}

		}else if (dataObj.cmd == 'sessionInfo') {
			if(dataObj.attributes && dataObj.attributes.monitorInfo){
				twiConstant.writeSeamlessLog({'cmdType':'C2H','cmd':'monitorInfo', 'info':JSON.stringify(dataObj.attributes.monitorInfo) });
				if (listeners.setLayoutInfo)
					listeners.setLayoutInfo(dataObj.attributes.monitorInfo);
			}
		}
		else if(dataObj.cmd == 'workArea'){
			if (listeners.setLayoutInfo)
					listeners.setLayoutInfo(dataObj.monitorInfo);
			}
			else if(dataObj.cmd == 'checkDisabled'){
			  if (listeners.checkDisabled && dataObj.window_info)
				 var retDisabled = listeners.checkDisabled(dataObj.window_info.appId);
				 dataObj.retDisabled = retDisabled;
			}
			else if(dataObj.cmd == 'checkIfMaximize'){
			  if (listeners.checkIfMaximize && dataObj.window_info)
				 var retIsMaximize = listeners.checkIfMaximize(dataObj.window_info.appId);
				 dataObj.retIsMaximize = retIsMaximize;
			}
	}

	function setSessionId(id) {
		sessionId = id;
	}

	function setCallback(cb) {
		callback = cb;
	}

	function updateOnWindowCreate(win) {
		/*
		 */
		updateMinimizeInfo(win);
		updateMaximizeInfo(win);
		updateSeamlessCmd(win);
		updateUICmd(win, 'create');
		updateToolbarInfo(win);
		updateWindowTitle(win);
		updatePositionRect(win);
		updateClientRect(win);
		updatedragProperty(win);
	}
	function createNonWindowCommand(id ,cmd){
		if (!pendingUICmds[id]) {
			pendingUICmds[id] = { };
			pendingUICmds[id].attributes = { };
			pendingUICmds[id].cmd = cmd;
		}
		var pendingInfo = pendingUICmds[id];
		pendingInfo.window_info = {
			sessionId : sessionId,
			appId : null
		};
		
	}
	function createNewPendingCmd(win) {
		var hostId = win.info.hostID;
		var bounds = win.info.position;
		if (!pendingUICmds[hostId]) {
			pendingUICmds[hostId] = { };
			pendingUICmds[hostId].attributes = { };
			pendingUICmds[hostId].attributes.resizable = false;
			pendingUICmds[hostId].attributes.movable = false;
			updateUICmd(win, 'update');
		}
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.window_info = {
			sessionId : sessionId,
			appId : hostId,
			bounds : bounds
		};
	}

	function updateCornerRect(win) {
		checkforDecoration(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.attributes.dimension.decoration.cornerLT = { };
		pendingInfo.attributes.dimension.decoration.cornerRT = { };
		pendingInfo.attributes.dimension.decoration.cornerLB = { };
		pendingInfo.attributes.dimension.decoration.cornerRB = { };

		copyRectInfo(pendingInfo.attributes.dimension.decoration.cornerLT, win.decoration.cornerLT);
		copyRectInfo(pendingInfo.attributes.dimension.decoration.cornerRT, win.decoration.cornerRT);
		copyRectInfo(pendingInfo.attributes.dimension.decoration.cornerLB, win.decoration.cornerLB);
		copyRectInfo(pendingInfo.attributes.dimension.decoration.cornerRB, win.decoration.cornerRB);
	
	}

	function copyRectInfo(destRect, sourceRect) {
		destRect.left = sourceRect.left;
		destRect.top = sourceRect.top;
		destRect.width = sourceRect.right - sourceRect.left;
		destRect.height = sourceRect.bottom - sourceRect.top;
	}

	function updateSideRect(win) {
		checkforDecoration(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.attributes.dimension.decoration.sideLeft = {};
		pendingInfo.attributes.dimension.decoration.sideRight = { };
		pendingInfo.attributes.dimension.decoration.sideTop = { };
		pendingInfo.attributes.dimension.decoration.sideBottom = {};
		pendingUICmds[hostId].attributes.resizable = true;
		copyRectInfo(pendingInfo.attributes.dimension.decoration.sideLeft, win.decoration.sideLeft);
		copyRectInfo(pendingInfo.attributes.dimension.decoration.sideRight, win.decoration.sideRight);
		copyRectInfo(pendingInfo.attributes.dimension.decoration.sideTop, win.decoration.sideTop);
		copyRectInfo(pendingInfo.attributes.dimension.decoration.sideBottom, win.decoration.sideBottom);


	}

	function updateCaptionRect(win) {
		checkforDecoration(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.attributes.dimension.decoration.captionRect = { };
		pendingUICmds[hostId].attributes.movable = true;
		copyRectInfo(pendingInfo.attributes.dimension.decoration.captionRect, win.decoration.captionRect);
	}

	function updatedragProperty(win) {
		createNewPendingCmd(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.attributes.dragdrop = win.dragdrop;
	}

	function checkForDimension(win) {
		createNewPendingCmd(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		if (!pendingInfo.attributes.dimension) {
			pendingInfo.attributes.dimension = { };
		}
	}

	function updateClientRect(win) {
		checkForDimension(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.attributes.dimension.clientRect = { };
		copyRectInfo(pendingInfo.attributes.dimension.clientRect, win.info.clientRect);
	}

	function updatePositionRect(win) {
		checkForDimension(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.attributes.dimension.position = {};
		copyRectInfo(pendingInfo.attributes.dimension.position, win.info.position);
	}

	function updateWindowTitle(win) {
		createNewPendingCmd(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.attributes.windowName = win.info.windowName;
	}

  function minimizeWindow(win) {
		createNewPendingCmd(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.attributes.minimizeWindow = true;
	}
	function updateToolbarInfo(win) {
		createNewPendingCmd(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.attributes.taskbar = win.toolbar.taskEntry;
	}

	function updateUICmd(win, cmd) {
		createNewPendingCmd(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.cmd = cmd;
        return pendingInfo;
	}

	function updateSeamlessCmd(win, cmd) {
		createNewPendingCmd(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.twi_cmd = cmd;
	}

	function checkforDecoration(win) {
		checkForDimension(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		if (!pendingInfo.attributes.dimension.decoration) {
			pendingInfo.attributes.dimension.decoration = { };
		}
	}

	function updateMaximizeInfo(win) {
		createNewPendingCmd(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.attributes.maximise = win.decoration.hasMaximize;
	}

	function updateMinimizeInfo(win) {
		createNewPendingCmd(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.attributes.minimise = win.decoration.hasMinimize;
	}

	function updateUICmdClose(win) {
       var pendingInfo =  updateUICmd(win, 'close');
        pendingInfo.attributes.taskbar = win.toolbar.taskEntry;
	}

	function updateIcon(win) {
		createNewPendingCmd(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		var iconInfos = win.iconInfo;
		for (var i = 0; i < 1; i++) {
			var iconInfo = iconInfos[i];
			pendingInfo.attributes.icon = {
				iconData : {
					dataType : iconInfo.iconObj.type,
					rawdata : iconInfo.iconObj.data
				},
				width : iconInfo.iconObj.width,
				height : iconInfo.iconObj.height

			};
		}
	}

	function sendDataToUI() {
		for (var key in pendingUICmds) {
			if (pendingUICmds.hasOwnProperty(key)) {
				callback.sendToUI(pendingUICmds[key], WorkerCommand.SEAMLESS_TO_UIMANAGER);
				delete pendingUICmds[key];
			}
		}

	}

	function sendFocus(win) {
		createNewPendingCmd(win);
		var hostId = win.info.hostID;
		var pendingInfo = pendingUICmds[hostId];
		pendingInfo.attributes.focus = true;
	}
	
	function resetWindows(){
	  createNonWindowCommand('seamlessWindows','reset');
	}
	
	function setSystemInfo(sysInfo){
		createNonWindowCommand('sysInfo' ,  "sessionInfo");
		var pendingInfo = pendingUICmds['sysInfo'];
		if(sysInfo.iconObj){
			pendingInfo.attributes.icon = {
				iconData : {
					dataType : sysInfo.iconObj.type,
					rawdata : sysInfo.iconObj.data
				},
				width : sysInfo.iconObj.width,
				height : sysInfo.iconObj.height
			};
		}
	}
	function setSeamlessMode(seamlessMode){
		twiConstant.writeSeamlessLog({'seamlessMode' : seamlessMode});
		createNonWindowCommand('seamlessMode' ,"sessionInfo");
		var pendingInfo = pendingUICmds['seamlessMode'];
		pendingInfo.attributes.seamlessMode = seamlessMode;
	}
	
	return {
		updateOnWindowCreate : updateOnWindowCreate,
		updateCaptionRect : updateCaptionRect,
		updateCornerRect : updateCornerRect,
		updateSideRect : updateSideRect,
		updatedragProperty : updatedragProperty,
		updateClientRect : updateClientRect,
		updatePositionRect : updatePositionRect,
		updateWindowTitle : updateWindowTitle,
		updateToolbarInfo : updateToolbarInfo,
		updateUICmd : updateUICmd,
		updateSeamlessCmd : updateSeamlessCmd,
		setSessionId : setSessionId,
		updateMaximizeInfo : updateMaximizeInfo,
		updateMinimizeInfo : updateMinimizeInfo,
		setSessionId : setSessionId,
		updateUICmdClose : updateUICmdClose,
		sendDataToUI : sendDataToUI,
		updateIcon : updateIcon,
		setCallback : setCallback,
		addEventListener : addEventListener,
		parseClientData : parseClientData,
		sendFocus : sendFocus,
		setSystemInfo : setSystemInfo ,
		setSeamlessMode : setSeamlessMode ,
		minimizeWindow : minimizeWindow,
		resetWindows : resetWindows
	};
})();

