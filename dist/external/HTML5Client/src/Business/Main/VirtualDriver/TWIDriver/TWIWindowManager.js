function TWIWindowManager(callback, twiProcessor) {

	var mySelf = this;
	/*
	 * window_info{
	 info : pkt,
	 isMenu : fIsAMenu,
	 hostWindow:true/false
	 };
	 */
	var windowInfo = { };
	/*process_info{
	 *  hostProcess : true,
	 info : process structure from VDA,
	 windowArr : [{info : pkt,
	 isMenu : fIsAMenu,
	 hostWindow : hostWindow,
	 dragdrop : false,
	 decoration : {
	 captionPresentFlag : false,
	 framePresentFlag : false,
	 hasMaximize : false,
	 hasMinimize : false

	 },
	 toolbar : {
	 taskEntry : true,
	 appMainwindow : false
	 }}]}
	 */
	var processInfo = {};
	/*
	 *process_Info {
	 windowArr : [{hostID:window id}]
	 hostProcess:true/false,
	 info:TwiNewProcessData
	 };
	 */

	var groupInfo = { };

	var processStore = {};
	var windowStore = {};
	var groupStore = {};
	var pContext;
	var uiCmdFormatFactory = seamlessUIFromatFactory;
	uiCmdFormatFactory.setCallback(callback);
	processStore.NULLPROCESSID = '_NONE_';
	groupStore.NULLWINDOWGROUP = "_NONE_";

	windowStore.reset = function() {
		for (var key in windowInfo) {
			if (windowInfo.hasOwnProperty(key)) {
				uiCmdFormatFactory.updateUICmdClose(windowInfo[key]);
			}
		}
		windowInfo = {};
	};

	windowStore.updateDefaultInfo = function(pkt) {
		if (windowStore.checkWinByHostID(pkt.hostOwner) == false) {
			pkt.hostOwner = -1;
		}
	};
	windowStore.updateOnNewWin = function(pkt, fIsAMenu, hostWindow) {
		if (windowStore.checkWinByHostID(pkt.hostID) == true) {
			return;
		}
		windowInfo[pkt.hostID] = {
			info : pkt,
			isMenu : fIsAMenu,
			hostWindow : hostWindow,
			dragdrop : false,
			decoration : {
				captionPresentFlag : false,
				framePresentFlag : false,
				hasMaximize : false,
				hasMinimize : false

			},
			toolbar : {
				taskEntry : true,
				appMainwindow : false
			}
		};
		windowStore.changeStyle(windowInfo[pkt.hostID], windowInfo[pkt.hostID].info.windowStyle, windowInfo[pkt.hostID].info.exWindowStyle);
		uiCmdFormatFactory.updateOnWindowCreate(windowInfo[pkt.hostID]);
		var winInfo = windowInfo[pkt.hostID];
		/*
		 * When reconnect a session having all application minimized then nothing will be seen on screen 
		 * restoring all minimized application on launch
		 */
		if(winInfo){
			var winStyle = winInfo.info.windowStyle;
			if(winStyle & twiConstant.TWI_WS_MINIMIZE){
				twiProcessor.restoreC2HWindow(pkt.hostID);
			}
		}
		return true;
	};
	
	windowStore.getChildWindows = function(hostID){
		var childWindows = [ ];
		childWindows[0] = hostID;
		var currentIndex = 0;
		while(currentIndex < childWindows.length){
			for(var key in windowInfo){
				if(windowInfo.hasOwnProperty(key)){
					if(windowInfo[key].info &&( windowInfo[key].info.hostOwner == childWindows[currentIndex])){
						if(childWindows.indexOf(windowInfo[key].info.hostID) == -1){
							childWindows[childWindows.length] = windowInfo[key].info.hostID;
						}
					}
				}
			}
			currentIndex++;
	 	}
	 	return childWindows;
	};
	windowStore.setStyle = function(hostID, newwinStyle, exWinStyle) {
		var winInfo = windowInfo[hostID];
		if (newwinStyle) {
			winInfo.info.windowStyle = newwinStyle;
		}
		if (exWinStyle) {
			winInfo.info.exWindowStyle = exWinStyle;
		}
		
		windowStore.changeStyle(winInfo, winInfo.info.windowStyle, winInfo.info.exWindowStyle);
		uiCmdFormatFactory.updatePositionRect(winInfo);
		uiCmdFormatFactory.updateClientRect(winInfo);
		
	};

	windowStore.changeStyle = function(winInfo, newwinStyle, exWinStyle) {
		winInfo.info.exWindowStyle = exWinStyle;
		winInfo.info.windowStyle = newwinStyle;
		windowStore.setToolbarInfo(winInfo);
		windowStore.setproperty(pContext, winInfo);
	};
	windowStore.setToolbarInfo = function(winInfo) {
		var exWinStyle = winInfo.info.exWindowStyle;
        var winStyle = winInfo.info.windowStyle;
        var popup = (winStyle & (twiConstant.TWI_WS_CLIPSIBLINGS | twiConstant.TWI_WS_POPUP | twiConstant.TWI_WS_VISIBLE) ) == (twiConstant.TWI_WS_CLIPSIBLINGS | twiConstant.TWI_WS_POPUP | twiConstant.TWI_WS_VISIBLE);
        winInfo.toolbar.taskEntry = false;
		var reason = "default";
		if (!(winStyle & twiConstant.TWI_WS_VISIBLE)) {
			winInfo.toolbar.taskEntry = false;
			reason = "hidden"; // invisible window
		}else if (winInfo.info.isMenu == true) {
            winInfo.toolbar.taskEntry = false;
			reason = "menu"; // menu window
        } else if ( (twiConstant.TWI_WS_EX_TOOLWINDOW & exWinStyle) || 
					((exWinStyle & twiConstant.TWI_WS_EX_NOACTIVATE) && !(exWinStyle & twiConstant.TWI_WS_EX_APPWINDOW))) {
            winInfo.toolbar.taskEntry = false;
			reason = "toolwindow or noactivate"; // is a toolwindow or has ws_ex_noactivate
        } else if (winInfo.info.hostOwner == 0) {
            winInfo.toolbar.taskEntry = true;
			reason = "not owned"; // top level
        } else if ((exWinStyle & twiConstant.TWI_WS_EX_APPWINDOW)) {
            winInfo.toolbar.taskEntry = true;
			reason = "app window"; // forced onto taskbar
        }

        if (winInfo.info.hostOwner == 0) {
            winInfo.toolbar.appMainwindow = true;
        }
	    twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'taskbarInfo' ,'hostID' : winInfo.info.hostID , 'appWindow' : winInfo.toolbar.appMainwindow , 'taskEntry': winInfo.toolbar.taskEntry, "style" : winStyle, "exstyle" : exWinStyle, "reason": reason});
	
		uiCmdFormatFactory.updateToolbarInfo(winInfo);
	};
	windowStore.setproperty = function(pContext, winInfo) {
		recalcDecoration(pContext, winInfo);
		calculateMetaInfo(pContext, winInfo);
	};
	windowStore.checkWinByHostID = function(hostID) {
		var rvalue = false;
		if (windowInfo[hostID] || (hostID == 0)) {
			rvalue = true;
		}
		return rvalue;
	};

	windowStore.changeWindowName = function(hostID, windowName) {
		if (windowInfo[hostID]) {
			windowInfo[hostID].info.windowName = windowName;
			seamlessUIFromatFactory.updateWindowTitle(windowInfo[hostID]);
		}
	};
	windowStore.minimizeWindow = function(hostID) {
		if (windowInfo[hostID]) {
			seamlessUIFromatFactory.minimizeWindow(windowInfo[hostID]);
		}
	};
	windowStore.changeWindowIcon = function(hostID, iconType, iconObj) {
		if (iconType == twiConstant.TWI_SMALL_ICON){
				return;
			}
		if (windowInfo[hostID]) {
			windowInfo[hostID].iconInfo = [];
			windowInfo[hostID].iconInfo[windowInfo[hostID].iconInfo.length] = {
				iconObj : iconObj,
				iconType : iconType,
				hostID : hostID
			};

			if (windowInfo[hostID].toolbar.taskEntry == true) {
				uiCmdFormatFactory.updateIcon(windowInfo[hostID]);
			}
		}
	};

	windowStore.changePositionRect = function(hostID, rect) {
		if (windowInfo[hostID]) {
			if (windowInfo[hostID].info && (!windowInfo[hostID].info.position)) {
				windowInfo[hostID].info.position = {};
			}
			windowInfo[hostID].info.position.left = rect.left;
			windowInfo[hostID].info.position.top = rect.top;
			windowInfo[hostID].info.position.right = rect.right;
			windowInfo[hostID].info.position.bottom = rect.bottom;
			recalcDecoration(pContext, windowInfo[hostID]);
            uiCmdFormatFactory.updatePositionRect(windowInfo[hostID]);
		}
	};
	windowStore.changeClientRect = function(hostID, rect) {
		if (windowInfo[hostID]) {
			if (windowInfo[hostID].info && (!windowInfo[hostID].info.clientRect)) {
				windowInfo[hostID].info.clientRect = {};
			}
			windowInfo[hostID].info.clientRect.left = rect.left;
			windowInfo[hostID].info.clientRect.top = rect.top;
			windowInfo[hostID].info.clientRect.right = rect.right;
			windowInfo[hostID].info.clientRect.bottom = rect.bottom;
			recalcDecoration(pContext, windowInfo[hostID]);
            uiCmdFormatFactory.updateClientRect(windowInfo[hostID]);
		}
	};
	windowStore.getProcessID = function(hostID, hostOwner) {
		var rvalue = null;
		if (windowInfo[hostID] && windowInfo[hostID].info && windowInfo[hostID].info.processID) {
			rvalue = windowInfo[hostID].info.processID;
		} else if (hostOwner && (hostOwner != 0)) {
			if (windowInfo[hostOwner] && windowInfo[hostOwner].info && windowInfo[hostOwner].info.processID) {
				rvalue = windowInfo[hostOwner].info.processID;
			}
		}
		return rvalue;
	};
	windowStore.getGroupID = function(hostID, hostOwner) {
		var rvalue = null;
		if (windowInfo[hostID] && windowInfo[hostID].info && windowInfo[hostID].info.windowGroupID) {
			rvalue = windowInfo[hostID].info.windowGroupID;
		} else if (hostOwner && (hostOwner != 0)) {
			if (windowInfo[hostOwner] && windowInfo[hostOwner].info && windowInfo[hostOwner].info.windowGroupID) {
				rvalue = windowInfo[hostOwner].info.windowGroupID;
			}
		}
		return rvalue;

		return windowInfo[hostID].info.windowGroupID;
	};
	windowStore.removeWindowEntry = function(hostID) {
		if (windowStore.checkWinByHostID(hostID) == true) {
			uiCmdFormatFactory.updateUICmdClose(windowInfo[hostID]);
			delete windowInfo[hostID];
		}
	};
	windowStore.sendFocus = function(hostID) {
		if (windowInfo[hostID]) {
			uiCmdFormatFactory.sendFocus(windowInfo[hostID]);
		}
	};
	processStore.reset = function() {
		processInfo = {};

	};

	processStore.updateDefaultInfo = function(pkt, processID) {
		if (pkt.version == 1 || !pkt.processID) {
			if (processID) {
				pkt.processID = processID;
			} else {
				pkt.processID = processStore.NULLPROCESSID;
			}
		}
	};
	processStore.onProcessCreate = function(newProcessData, hostProcess) {
		var processId = newProcessData.processID;
		if (!processInfo[processId]) {
			processInfo[processId] = {
				hostProcess : hostProcess,
				info : newProcessData,
				windowArr : []
			};
		}

	};

	processStore.onProcessDelete = function(processID) {
			delete processInfo[processID];

	};
	processStore.updateOnNewWin = function(pkt) {
		if (!processInfo[pkt.processID]) {
			var pInfo = processStore.createProcessInfo();
			pInfo.processID = pkt.processID;
			mySelf.createNewProcess(pInfo);
		}
		if (processStore.findWindowInProcessInfo(pkt.processID, pkt.hostID) == false) {
			processInfo[pkt.processID].windowArr.push({
				hostID : pkt.hostID
			});
		}

		return true;

	};
	processStore.removeWindowEntry = function(processId, hostID) {
		if (processInfo[processId]) {
			var windowArr = processInfo[processId].windowArr;
			for (var i = 0; i < windowArr.length; i++) {
				if (windowArr[i].hostID == hostID) {
					windowArr.splice(i, 1);
					return true;
				}
			}
		}

	};
	processStore.createProcessInfo = function() {
		return new TwiNewProcessData();
	};
	processStore.findWindowInProcessInfo = function(processId, hostID) {
		var rvalue = false;
		if (processInfo[processId]) {
			var windowArr = processInfo[processId].windowArr;
			for (var i = 0; i < windowArr.length; i++) {
				if (windowArr[i].hostID == hostID) {
					rvalue = true;
					break;
				}
			}
		}
		return rvalue;
	};

	groupStore.reset = function() {
		groupInfo = {};

	};
	groupStore.updateDefaultInfo = function(pkt, gruopID) {
		if (pkt.version == 1 || !pkt.windowGroupID) {
			if (gruopID) {
				pkt.windowGroupID = gruopID;
			} else {
				pkt.windowGroupID = groupStore.NULLWINDOWGROUP;
			}
		}
	};
	groupStore.updateOnNewWin = function(pkt) {
		if (!groupInfo[pkt.windowGroupID]) {
			groupStore.createNewGroup(pkt.windowGroupID);
		}
		if (groupStore.findWindowInGroupInfo(pkt.windowGroupID, pkt.hostID) == false) {
			groupInfo[pkt.windowGroupID].windowArr.push({
				hostID : pkt.hostID
			});
		}

		return true;
	};
	groupStore.removeWindowEntry = function(gID, hostID) {
		if( groupInfo[gID]){
			var windowArr = groupInfo[gID].windowArr;
			for (var i = 0; i < windowArr.length; i++) {
				if (windowArr[i].hostID == hostID) {
					windowArr.splice(i, 1);
					return true;
				}
			}
		}

	};
	groupStore.createNewGroup = function(groupId) {
		groupInfo[groupId] = {
			windowArr : []
		};
	};

	groupStore.findWindowInGroupInfo = function(groupId, hostID) {
		var rvalue = false;
		if (groupInfo[groupId]) {
			var windowArr = groupInfo[groupId].windowArr;
			for (var i = 0; i < windowArr.length; i++) {
				if (windowArr[i].hostID == hostID) {
					rvalue = true;
					break;
				}
			}
		}
		return rvalue;
	};

	function recalcDecoration(pContext, new_win) {
		var thisFrameX, thisFrameY, thisFrameCCX, thisFrameCCY;

		/* Frame/caption preparation. */
		var w_pos = new_win.info.position;
		var exWinStyle = new_win.info.exWindowStyle;
		var winStyle = new_win.info.windowStyle;
		var extraFlags = new_win.info.extraFlags;
		new_win.decoration.framePresentFlag = false;
		new_win.decoration.captionPresentFlag = false;
		if ((winStyle & twiConstant.TWI_WS_DLGFRAME) && !(winStyle & twiConstant.TWI_WS_BORDER)) {
			thisFrameX = pContext.sysInfo.dlgFrameX;
			thisFrameY = pContext.sysInfo.dlgFrameY;
			thisFrameCCX = pContext.sysInfo.dlgFrameCCX;
			thisFrameCCY = pContext.sysInfo.dlgFrameCCY;
		} else {
			thisFrameX = pContext.sysInfo.stdFrameX;
			thisFrameY = pContext.sysInfo.stdFrameY;
			thisFrameCCX = pContext.sysInfo.stdFrameCCX;
			thisFrameCCY = pContext.sysInfo.stdFrameCCY;
		}

		if ((winStyle & (twiConstant.TWI_WS_SIZEBOX)) && !(winStyle & twiConstant.TWI_WS_MINIMIZE) && !(winStyle & twiConstant.TWI_WS_MAXIMIZE) && !(exWinStyle & twiConstant.TWI_WS_EX_TOOLWINDOW)) {

			/* we have a frame*/
			new_win.decoration.framePresentFlag = true;

			/*new_win.FrameRect.top = w_pos.top + thisFrameY;
			 new_win.FrameRect.bottom = w_pos.bottom - thisFrameY;
			 new_win.FrameRect.left = w_pos.left + thisFrameX;
			 new_win.FrameRect.right = w_pos.right - thisFrameX;*/
			/* corners*/
			var cornerLT = {};
			var cornerRT = {};
			var cornerLB = {};
			var cornerRB = {};
			var sideLeft = {};
			var sideRight = {};
			var sideTop = {};
			var sideBottom = {};
			cornerLT.top = w_pos.top;
			cornerLT.left = w_pos.left;
			cornerLT.right = w_pos.left + thisFrameCCX;
			cornerLT.bottom = w_pos.top + thisFrameCCY;
			cornerRT.top = w_pos.top;
			cornerRT.left = w_pos.right - thisFrameCCX;
			cornerRT.right = w_pos.right;
			cornerRT.bottom = w_pos.top + thisFrameCCY;
			cornerLB.top = w_pos.bottom - thisFrameCCY;
			cornerLB.left = w_pos.left;
			cornerLB.right = w_pos.left + thisFrameCCX;
			cornerLB.bottom = w_pos.bottom;

			cornerRB.top = w_pos.bottom - thisFrameCCY;
			cornerRB.left = w_pos.right - thisFrameCCX;
			cornerRB.right = w_pos.right;
			cornerRB.bottom = w_pos.bottom;
			/* sides*/
			sideLeft.top = w_pos.top + thisFrameCCY;
			sideLeft.left = w_pos.left;
			sideLeft.right = w_pos.left + thisFrameX;
			sideLeft.bottom = w_pos.bottom - thisFrameCCY;

			sideRight.top = w_pos.top + thisFrameCCY;
			sideRight.left = w_pos.right - thisFrameX;
			sideRight.right = w_pos.right;
			sideRight.bottom = w_pos.bottom - thisFrameCCY;

			sideTop.top = w_pos.top;
			sideTop.left = w_pos.left + thisFrameCCX;
			sideTop.right = w_pos.right - thisFrameCCX;
			sideTop.bottom = w_pos.top + thisFrameY;

			sideBottom.top = w_pos.bottom - thisFrameY;
			sideBottom.left = w_pos.left + thisFrameCCX;
			sideBottom.right = w_pos.right - thisFrameCCX;
			sideBottom.bottom = w_pos.bottom;

			new_win.decoration.cornerLT = cornerLT;
			new_win.decoration.cornerRT = cornerRT;
			new_win.decoration.cornerLB = cornerLB;
			new_win.decoration.cornerRB = cornerRB;
			new_win.decoration.sideLeft = sideLeft;
			new_win.decoration.sideRight = sideRight;
			new_win.decoration.sideTop = sideTop;
			new_win.decoration.sideBottom = sideBottom;
			uiCmdFormatFactory.updateCornerRect(new_win);
			uiCmdFormatFactory.updateSideRect(new_win);

		}

		/* Caption. */
		if (windowHasCaption(new_win.info)) {
			var thisCaptX, thisCaptY, thisCaptLeft;

			new_win.decoration.captionPresentFlag = true;
			var captionRect = {};
			thisCaptY = pContext.sysInfo.stdCaptY;
			thisCaptX = (w_pos.right - w_pos.left - thisFrameX - thisFrameX);
			thisCaptLeft = w_pos.left + thisFrameX;

			if (winStyle & twiConstant.TWI_WS_SYSMENU) {
				thisCaptX -= pContext.sysInfo.stdCBX;
				thisCaptLeft += pContext.sysInfo.stdCBX;
			}

			if ((extraFlags & twiConstant.TWI_EF_USERCAPTION) && !(winStyle & twiConstant.TWI_WS_SYSMENU) && !(exWinStyle & twiConstant.TWI_WS_EX_CONTEXTHELP)) {
				thisCaptX -= pContext.sysInfo.stdCBX;
			}

			if (exWinStyle & twiConstant.TWI_WS_EX_CONTEXTHELP)
				thisCaptX -= pContext.sysInfo.stdCBX;
			if (pContext.hostInfo.hostType >= 2) {
				if ((winStyle & twiConstant.TWI_WS_MINIMIZEBOX) || (winStyle & twiConstant.TWI_WS_MAXIMIZEBOX)) {
					thisCaptX -= pContext.sysInfo.stdCBX * 2;
				}

				thisCaptX -= pContext.sysInfo.stdCBX;
				/* NT4 has 3 buttons*/
			} else {
				if (winStyle & twiConstant.TWI_WS_MINIMIZEBOX)
					thisCaptX -= pContext.sysInfo.stdCBX;
				if (winStyle & twiConstant.TWI_WS_MAXIMIZEBOX)
					thisCaptX -= pContext.sysInfo.stdCBX;
			}

			captionRect.top = w_pos.top + thisFrameY;
			captionRect.bottom = w_pos.top + thisCaptY + thisFrameY;
			captionRect.left = thisCaptLeft;
			captionRect.right = thisCaptLeft + thisCaptX;
			new_win.decoration.captionRect = captionRect;
			if (winStyle & twiConstant.TWI_WS_MINIMIZE) {
				new_win.decoration.captionPresentFlag = true;
				new_win.decoration.captionRect = w_pos;
			}
			uiCmdFormatFactory.updateCaptionRect(new_win);

		}

	}

	function calculateMetaInfo(pContext, new_win) {
		var exWinStyle = new_win.info.exWindowStyle;
		var winStyle = new_win.info.windowStyle;
		var extraFlags = new_win.info.extraFlags;

		if (pContext.hostInfo.hostType >= 2) {
			if (winStyle & (twiConstant.TWI_WS_MINIMIZEBOX | twiConstant.TWI_WS_MAXIMIZEBOX))
				new_win.decoration.hasMinimize = new_win.decoration.hasMaximize = true;
		} else {
			if (winStyle & twiConstant.TWI_WS_MINIMIZEBOX)
				new_win.decoration.hasMinimize = true;
			if (winStyle & twiConstant.TWI_WS_MAXIMIZEBOX)
				new_win.decoration.hasMaximize = true;
		}
		uiCmdFormatFactory.updateMaximizeInfo(new_win);
		uiCmdFormatFactory.updateMinimizeInfo(new_win);
		if (exWinStyle & twiConstant.TWI_WS_EX_ACCEPTFILES) {
			new_win.dragdrop = true;
		}
		uiCmdFormatFactory.updatedragProperty(new_win);
	}

	function windowHasCaption(winInfo) {
		return (((winInfo.windowStyle & twiConstant.TWI_WS_BORDER) && (winInfo.windowStyle & twiConstant.TWI_WS_DLGFRAME) && (winInfo.windowName && winInfo.windowName != "")) || (winInfo.extraFlags & twiConstant.TWI_EF_USERCAPTION)) && !(winInfo.extraFlags & twiConstant.TWI_EF_NOCAPTION) && !(winInfo.windowStyle & twiConstant.TWI_WS_MAXIMIZE) && !(winInfo.exWindowStyle & twiConstant.TWI_WS_EX_TOOLWINDOW);
	}
	
	function focusWindow(hostID){
	  var timestamp = Math.floor(Date.now());
	  twiProcessor.sendC2HFocus(hostID,timestamp);
	}
	
	function checkDisabled(hostID){
	  hostID = parseInt(hostID);
	  var winInfo = windowInfo[hostID];
	  if(winInfo){
			var winStyle = winInfo.info.windowStyle;
			console.log("Window has disabled style: ", (winStyle & twiConstant.TWI_WS_DISABLED)!=0);
			if(winStyle & twiConstant.TWI_WS_DISABLED)
			  return true;
	    }
		return false;
	}
	function checkIfMaximize(hostID){
	  hostID = parseInt(hostID);
	  var winInfo = windowInfo[hostID];
	  if(winInfo){
			var winStyle = winInfo.info.windowStyle;
			console.log("Window has Maximize style: ", (winStyle & twiConstant.TWI_WS_MAXIMIZE)!=0);
			if(winStyle & twiConstant.TWI_WS_MAXIMIZE)
			  return true;
	    }
		return false;
	}
	mySelf.chkIfRestore = function(hostID)
	{
	  var winInfo = windowInfo[hostID];
	  if(winInfo){
			var winStyle = winInfo.info.windowStyle;
			console.log("Style has minimize: ", (winStyle & twiConstant.TWI_WS_MINIMIZE)!=0);
			if(winStyle & twiConstant.TWI_WS_MINIMIZE){
			  console.log("trying to restore ", hostID);
				twiProcessor.restoreC2HWindow(hostID);
			}
	    }
	}
	
	function terminateWindow(hostID){
		 hostID = parseInt(hostID);
		// var childWindowIds = windowStore.getChildWindows(hostID);
		// for(var i = childWindowIds.length -1 ; i >=0 ;i--){
			// if(windowInfo[childWindowIds[i]])
				// twiProcessor.terminateWindow(childWindowIds[i]);
			// console.log("closning window" + childWindowIds[i]);
		// }
		twiProcessor.sendC2HFocus(hostID);
		if(pContext.hostInfo.hostAgentFlags & twiConstant.HOST_AGENT_FLAGS_CLOSEWND){
			twiProcessor.closeWindow(hostID);
		}else{
			twiProcessor.terminateWindow(hostID);
		}
	}
	mySelf.processClientMessage = function(dataObj) {
		uiCmdFormatFactory.parseClientData(dataObj.data);

	};

	function minimizeC2HWindow(hostID) {
		twiProcessor.minimizeC2HWindow(hostID);
	}

	function maximizeWindow() {

	}


	mySelf.resetOnOpen = function() {
		windowStore.reset();
		CEIP.add("seamless:used",true);
		uiCmdFormatFactory.setSeamlessMode(true);
		//processStore.reset();
		//groupStore.reset();
	};

	mySelf.setContext = function(info) {
		pContext = info;
	};

	mySelf.createNewWindow = function(pkt, fIsAMenu) {
		twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'createWindow' ,'hostID' : pkt.hostID , 'hostOwner' : pkt.hostOwner , 'style': pkt.windowStyle,'exWinStyle': pkt.exWindowStyle ,'windowName': pkt.windowName});
		windowStore.updateDefaultInfo(pkt);
		var pID = windowStore.getProcessID(pkt.hostID, pkt.hostOwner);
		var gID = windowStore.getGroupID(pkt.hostID, pkt.hostOwner);
		processStore.updateDefaultInfo(pkt, pID);
		groupStore.updateDefaultInfo(pkt, gID);
		windowStore.updateOnNewWin(pkt, fIsAMenu, true);
		processStore.updateOnNewWin(pkt);
		groupStore.updateOnNewWin(pkt);
	};

	mySelf.deleteWindow = function(hostID) {
		twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'deleteWindow' ,'hostID' : hostID });
		var pID = windowStore.getProcessID(hostID);
		var gID = windowStore.getGroupID(hostID);
		windowStore.removeWindowEntry(hostID);
		processStore.removeWindowEntry(pID, hostID);
		groupStore.removeWindowEntry(gID, hostID);
	};
	mySelf.changeWindowIcon = function(hostID, processID, iconType, iconObj) {
		twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'changeWindowIcon' ,'hostID' : hostID });
	
		windowStore.changeWindowIcon(hostID, iconType, iconObj);
	};
	
	mySelf.minimizeWindow = function(hostID) {
		twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'minimizeWindow' ,'hostID' : hostID });
	
		windowStore.minimizeWindow(hostID);
	};
	mySelf.createNewProcess = function(newProcessData, hostProcess) {
		twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'createNewProcess' ,'processID' : newProcessData.processID });
		processStore.onProcessCreate(newProcessData, hostProcess);
	};
	mySelf.removeProcessEntry = function(deleteProcessstruct) {
		twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'removeProcess' ,'processID' : deleteProcessstruct.processID });

		processStore.onProcessDelete(deleteProcessstruct.processID);
	};

	mySelf.changeWindow = function(dataObj) {
	    if(windowStore.checkWinByHostID(dataObj.hostID) != true){
            if(dataObj.changeMask == (twiConstant.TWI_CHANGED_CLIENT_RECT | twiConstant.TWI_CHANGED_RECT|twiConstant.TWI_CHANGED_STYLE|twiConstant.TWI_CHANGED_EXSTYLE|twiConstant.TWI_CHANGED_OWNER|twiConstant.TWI_CHANGED_NAME)){
                var win = new TwiNewWindowDataV2();
                win.hostID = dataObj.hostID;
                win.windowStyle = dataObj.windowStyle;
                win.exWindowStyle = dataObj.exWindowStyle;
                win.position = dataObj.position;
                win.clientRect = dataObj.clientRect;
                win.hostOwner = dataObj.hostOwner;
                win.windowName = dataObj.windowName;
                mySelf.createNewWindow(win , false);
            }else{
                
                twiProcessor.sendResendWnd(dataObj.hostID);
            }
	    }else{
    		if (twiConstant.TWI_CHANGED_STYLE & dataObj.changeMask) {
    			twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'changeWindow' ,'hostID' : dataObj.hostID, 'style': dataObj.windowStyle });
    			var isMinimized = (dataObj.windowStyle & twiConstant.TWI_WS_MINIMIZE)!= 0;
    			console.log("changed style contains minimize = ", isMinimized);
    			
    			// Let's minimize proxy window here.
				if (dataObj.hostID > 0 && isMinimized == true) {
					mySelf.minimizeWindow(dataObj.hostID);
					mySelf.flushUIManagerCmd();
				//Setting pContext.hostInfo.lastHostFocusedApp to 0 only in showInShelf case because for regular case this can impact Alt+Tab
				if (HTML5_CONFIG && HTML5_CONFIG['seamless'] && HTML5_CONFIG['seamless']['showInShelf'])
				  pContext.hostInfo.lastHostFocusedApp = 0;
				}
    			windowStore.setStyle(dataObj.hostID, dataObj.windowStyle, null);
    		
    		}
    		if (twiConstant.TWI_CHANGED_EXSTYLE & dataObj.changeMask) {
    			twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'changeWindow' ,'hostID' : dataObj.hostID, 'exstyle':dataObj.exWindowStyle });
    			windowStore.setStyle(dataObj.hostID, null, dataObj.exWindowStyle);
    	
    		}
    		if (twiConstant.TWI_CHANGED_RECT & dataObj.changeMask) {
    			twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'changeWindow' ,'hostID' : dataObj.hostID, 'position_rect': {'left': dataObj.position.left, 'top': dataObj.position.top, 'right' : dataObj.position.right,'bottom':dataObj.position.bottom } });
    			windowStore.changePositionRect(dataObj.hostID, dataObj.position);
    			
    		}
    		if (twiConstant.TWI_CHANGED_CLIENT_RECT & dataObj.changeMask) {
    			twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'changeWindow' ,'hostID' : dataObj.hostID, 'client_rect': {'left': dataObj.clientRect.left, 'top': dataObj.clientRect.top, 'right' : dataObj.clientRect.right,'bottom':dataObj.clientRect.bottom } });
    			
    			windowStore.changeClientRect(dataObj.hostID, dataObj.clientRect);
    	
    		}
    		if (twiConstant.TWI_CHANGED_OWNER & dataObj.changeMask) {
    			twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'changeWindow' ,'hostID' : dataObj.hostID , 'newOwner' : dataObj.hostOwner  });
    
    		}
    		if (twiConstant.TWI_CHANGED_ZORDER & dataObj.changeMask) {
    			twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'changeWindow' ,'hostID' : dataObj.hostID , 'hwndAboveMe' : dataObj.hwndAboveMe  });
    
    		}
    		if (twiConstant.TWI_CHANGED_NAME & dataObj.changeMask) {
    			twiConstant.writeSeamlessLog({'cmdType':'H2C','cmd':'changeWindow' ,'hostID' : dataObj.hostID , 'windowName' : dataObj.windowName  });
    			windowStore.changeWindowName(dataObj.hostID, dataObj.windowName);
    	
    		}
    		if (dataObj.position.left == 0 && dataObj.position.top == 0 && dataObj.position.right == 0 && dataObj.position.bottom == 0) {
    		} else {
    			//twiWindowManager.changeWindow(data);
    		}
		}
		
	};
	mySelf.changeFocus = function(hostID) {
		windowStore.sendFocus(hostID);
	};
	mySelf.flushUIManagerCmd = function() {
		uiCmdFormatFactory.sendDataToUI();
	};
	mySelf.systemInfo = function(dataObj){
		uiCmdFormatFactory.setSystemInfo(dataObj);
	};
	mySelf.resetOnClose = function( ){
		uiCmdFormatFactory.setSeamlessMode(false);
        g.environment.receiver.seamlessMode = false;
	};
	mySelf.sendC2HPause = function(){
	  twiProcessor.twiSendPausePacket();
	};
	mySelf.sendC2HResume = function(){
	  twiProcessor.twiSendResumePacket();
	};
	mySelf.setConfig = function(config) {
		uiCmdFormatFactory.setSessionId(config.sessionkey);
		uiCmdFormatFactory.addEventListener({
			terminateWindow : terminateWindow,
			focus : focusWindow,
			minimize : minimizeC2HWindow,
			miximize : twiProcessor.maximizeC2HWindow,
			restore : twiProcessor.restoreC2HWindow,
			resize : twiProcessor.changePosition,
			logoff : twiProcessor.sendLog_offC2H ,
			blurSessionApps : twiProcessor.blurSessionApps ,
			focusSession : twiProcessor.focusSession,
			setLayoutInfo : twiProcessor.setMonitorsLayout,
			checkDisabled : checkDisabled,
			checkIfMaximize : checkIfMaximize
		});
	};
	mySelf.resetWindows = function(){
	  uiCmdFormatFactory.resetWindows();
	};

}

