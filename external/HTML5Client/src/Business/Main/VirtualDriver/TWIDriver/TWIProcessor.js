function TWIProcessor(callback1, option) {
	var vStream;
	var callback = callback1;
	var iconCache = {};
	var winPreviewDataCache = {};
	var previewDataCache = {};
	var pContext = seamlessContext;
	var myself = this;
	var isC2HPausePackateSent = false;
	var isBlur = false;
	var bTimestamp = 0;
	
	var twiWindowManager = new TWIWindowManager(callback, myself);
	twiWindowManager.setContext(pContext);
	var twiSendPacket;
	myself.getTwiManager = function() {
		return twiWindowManager;
	};
	myself.onIcaFile = function( ){
		if (callback.getTWIMode() == 'on' || callback.getTWIMode() == 'On') {
			return;
		}
		var icaData = callback.getIcaData();
		setIconFromIca( icaData);
		twiWindowManager.resetOnClose();
		twiWindowManager.flushUIManagerCmd();
	};
	
	myself.setVdaRes = function(res){
	    pContext.hostInfo.vdaRes.width = res.width;
	    pContext.hostInfo.vdaRes.height = res.height;
	    twiSendClientInfoAtInterval(true);
	};
	
	myself.handleCmd = function(command, packet_len) {
		switch (command) {
		case twiConstant.TWI_PACKET_START:
			handleInitRequestPacket(pContext, packet_len);
			break;
		case twiConstant.TWI_PACKET_SERVER_CODEPAGE:
			pContext.hostInfo.g_dwHostCP = vStream.ReadInt32();
			break;
		case twiConstant.TWI_PACKET_OPEN:
			handleOpenPacket(pContext, packet_len);
			break;
		case twiConstant.TWI_PACKET_CLOSE:
			handleClosePacket();
			break;
		case  twiConstant.TWI_PACKET_SYSINFO:
			marshallReadTwiSysinfoData(vStream, pContext.sysInfo, packet_len, pContext.hostInfo.g_dwClientCP);
			handleSystemInfoPacket(pContext, packet_len);
			break;
		case twiConstant.TWI_PACKET_FOREGROUNDW:
			var wID = vStream.ReadInt32();
			tWISetForegroundWindow(pContext, packet_len, wID);
			break;
		case twiConstant.TWI_PACKET_CHANGEW:
			var data = new TwiChangeWindowDataInt();
			marshallChangeWindowDataInt(vStream, data, packet_len, pContext.hostInfo.g_dwClientCP);
			twiChangeWindow(pContext, data, packet_len);
			break;
		case twiConstant.TWI_PACKET_LOGIN_SUCCEEDED:
			twiLoginSucceeded(pContext, packet_len);
			break;
		case  twiConstant.TWI_PACKET_SYSTRAY_CMD:
			twiHandleSysTrayIcon(pContext, packet_len, false);
			break;
		case twiConstant.TWI_PACKET_CREATEP:
			var newProcessData = new TwiNewProcessData();
			marshallReadTwiNewProcessData(vStream, newProcessData, packet_len, pContext.hostInfo.g_dwClientCP);
			twiNewHostProcess(newProcessData);
			break;
		case twiConstant.TWI_PACKET_CREATEW:
		case twiConstant.TWI_PACKET_CREATEMENU:
			var win = new TwiNewWindowData();
			marshallReadTwiNewWindow(vStream, win, packet_len, pContext.hostInfo.g_dwClientCP);
			twiNewWindow(pContext, win, (command === twiConstant.TWI_PACKET_CREATEMENU));
			break;
		case twiConstant.TWI_PACKET_CREATEW_V2:
			var win = new TwiNewWindowDataV2();
			marshallReadTwiNewWindowV2(vStream, win, packet_len, pContext.hostInfo.g_dwClientCP);
			twiNewWindowV2(pContext, win);
			break;
		case twiConstant.TWI_PACKET_DELETEW:
			if (packet_len === 4) {
				var wID = vStream.ReadInt32();
				twiDeleteWindow(wID);
			}
			break;

		case twiConstant.TWI_PACKET_DELETEP:
			var deleteProcessstruct = new TwiDeleteProcessData();
			marshallReadDeleteProcess(vStream, deleteProcessstruct, packet_len);
			twiHostProcessGone(deleteProcessstruct);
			break;
		case twiConstant.TWI_PACKET_PREVIEW_DATA:
			twiPreviewData(pContext, vStream, packet_len);
			break;
		case twiConstant.TWI_PACKET_SIZEBOX:
			var sizebox = new TwiSizeBoxData();
			marshallReadSizeBox(vStream, sizebox, packet_len);
			twiSetSizeBox(pContext, sizebox, packet_len);
			break;
		case twiConstant.TWI_PACKET_ICON:
			twiChangeIconV1(pContext, vStream, packet_len);
			break;
		case twiConstant.TWI_PACKET_ICON_V2:
			twiChangeIconV2(pContext, vStream, packet_len);
			break;
		case twiConstant.TWI_PACKET_WINDOW_REGION:
			var pkt = new TwiWindowRegion();
			marshallReadTwiWindowRegion(vStream, pkt, packet_len);
			twiSetWindowRegion(pContext, pkt);
			break;
		default:
			consumeData(packet_len);

			break;

		}
		twiWindowManager.flushUIManagerCmd();

	};

	 function setIconFromIca(icaData ){
	 	twiWindowManager.systemInfo({
				iconObj : {
					width : 32,
					height : 32,
					data : icaData['IconUrl'],
					type : 'image/png'
				}
			});
	 }
	/**
	 * Handles twiConstant.TWI_PACKET_START(1) messages.  Sends a twiConstant.TWI_PACKET_C2H_START_ACK message.
	 */
	var handleInitRequestPacket = function(pContext, len) {
		twiSendPacket = twiSendVcPacket;
		//resetWindow();
		marshallReadTwiHostInfo(vStream, pContext.hostInfo, len);
		var ackData = new Twi_C2H_Startack_Data();

		ackData.clientType = 0;
		ackData.clientVersion = pContext.version.clientversion;
		ackData.tWIVersion = pContext.version.protocolversion;
		ackData.clientAgentFlags = 0;
		if (pContext.hostInfo.hostAgentFlags & twiConstant.HOST_AGENT_FLAGS_EXT_WND_PROCESS_INFO) {
			if (twi_use_V2_icons(pContext)) {
				ackData.clientAgentFlags |= twiConstant.TWI_CLIENT_FLAG_EXT_WND_PROCESS_INFO;

			}
			if ((pContext.hostInfo.hostAgentFlags & twiConstant.HOST_AGENT_FLAGS_ICON_V2_EXT) && twi_use_V2_extra(pContext) == true) {
				ackData.clientAgentFlags |= twiConstant.TWI_CLIENT_FLAG_ICON_V2_EXT;
			}
			if ((pContext.hostInfo.hostAgentFlags & twiConstant.HOST_AGENT_FLAGS_CACHE_ICONS) && twi_cacheIcon(pContext) == true) {
				ackData.clientAgentFlags |= twiConstant.TWI_CLIENT_FLAG_CACHE_ICONS;
			}

		}
		if (pContext.hostInfo.hostAgentFlags & twiConstant.HOST_AGENT_FLAGS_STR_UTF8_CAPABLE) {
			pContext.hostInfo.g_dwClientCP = twiConstant.CP_UTF8;
			ackData.clientAgentFlags |= twiConstant.TWI_CLIENT_FLAG_STR_UTF8_CAPABLE;
		}
		if (pContext.hostInfo.hostAgentFlags & twiConstant.HOST_AGENT_FLAGS_PREVIEW && pContext.clientConfig.previewEnabled) {
			ackData.clientAgentFlags |= twiConstant.TWI_CLIENT_FLAG_PREVIEW;
		}
		ackData.action = 0;
		if (callback.getTWIMode() == 'on' || callback.getTWIMode() == 'On') {
			twiWindowManager.systemInfo({
				iconObj : {
					width : 32,
					height : 32,
					data : null,
					type : 'image/png'
				}
			});
			pContext.hostPausedFlagTemp = true;
		} else {
			ackData.action = 1;
			var icaData = callback.getIcaData();
			setIconFromIca( icaData );
			twiWindowManager.resetOnClose();
		}
		if (pContext.hostInfo.hostAgentFlags & twiConstant.HOST_AGENT_FLAGS_PRESERVE_WINDOW_SUPPORT) {
			//ackData.clientAgentFlags |= twiConstant.TWI_CLIENT_FLAG_PRESERVE_WINDOW_ENABLED;
		}

		if (pContext.hostInfo.hostAgentFlags & twiConstant.HOST_AGENT_FLAGS_MOBILE_WINDOW) {

			//ackData.clientAgentFlags |= twiConstant.TWI_CLIENT_FLAG_MOBILE_WINDOW;
		}
		//ackData.clientAgentFlags |= (twiConstant.TWI_CLIENT_FLAG_WINDOWREGION  );
		ackData.clientAgentFlags |= (twiConstant.TWI_CLIENT_FLAG_WINDOWREGION | twiConstant.TWI_CLIENT_FLAG_FLASHWINDOW );
		twiSendClientInfo(true);
		twiSendPacket(twiConstant.TWI_PACKET_C2H_START_ACK, ackData, ackData.size);

		// setTimeout(function() {
		// set_Wnd_As_Mobile(true);
		// }, 5000);
    //sendMonitorLayoutInfo();
  };

	function set_Wnd_As_Mobile(enable) {
		var enableVal = (enable == true) ? 1 : 0;
		var replyPacket = new Twi_C2H_Set_Wnd_Mobile();
		replyPacket.enabled = enableVal;
		twiSendPacket(twiConstant.TWI_PACKET_C2H_SET_WND_MOBILE, replyPacket, replyPacket.size);
	}

	function handleOpenPacket(pContext, len) {
		pContext.hostInfo.hostPausedFlag = false;
		iconCache = {};
		twiWindowManager.resetOnOpen();
		twiSendClientInfo(true);

	}

	function twi_use_V2_icons(pContext) {
		return pContext.clientConfig.useiconV2;
	}

	function twi_use_V2_extra(pContext) {
		return pContext.clientConfig.extraIconV2;

	}

	function twi_cacheIcon(pContext) {
		return pContext.clientConfig.extraIconV2 && pContext.clientConfig.cacheIcon;
	}

	function twiHandleSysTrayIcon(pcontext, len, fv2) {
		consumeData(len);

	}

	function twi_HandleSysTrayIcon(pContext, len, fv2) {
		consumeData(len);
	}

	function twiNewHostProcess(newProcessData) {
		if (pContext.hostInfo.hostPausedFlag) {
			return;
		}
		twiWindowManager.createNewProcess(newProcessData, true);
	}

	function twiHostProcessGone(deleteProcessstruct) {
		if (pContext.hostInfo.hostPausedFlag) {
			return;
		}
		twiWindowManager.removeProcessEntry(deleteProcessstruct);
	}

	function handleSystemInfoPacket(pContext, len) {
		if (pContext.hostInfo.hostPausedFlag) {
			return;
		}
		twiWindowManager.systemInfo(pContext.sysInfo);
	}

	function twiLoginSucceeded(pContext, len) {
		if (pContext.hostInfo.twiVersion >= 3) {
			twiSendClientInfo(true);
		}

		pContext.hostInfo.g_fWaitingForLogin = false;
	}

	function twiSetWindowRegion(pContext, pkt) {
		if (pContext.hostInfo.hostPausedFlag) {
			return;
		}
		if (pkt.operation == twiConstant.TWI_REGION_SET) {
			for (var i = 0; i < pkt.cRectangle; i++) {
				var rect = pkt.rectArr[i];
				//addWindow(pkt.hostID, rect.left, rect.top, rect.right, rect.bottom);
			}
		} else {
		}
	}

	/*******************************************************************************
	 *
	 *  TWISetSizeBox
	 *
	 *  We've just discovered a sizebox on a window,or we've discovered that the size
	 *  box has disappeared. Set the sizebox info in the local c_win cache.  The size
	 *  box is that little box seen in the bottom left hand corner of the window that
	 *  can be used for sizing.
	 */

	function twiSetSizeBox(pContext, pSizeBoxData, len) {
		var c_win;

	}

	function twiChangeWindow(pContext, data, packet_len) {
		if (pContext.hostInfo.hostPausedFlag == true) {
			return;
		}
		twiWindowManager.changeWindow(data);
	}

	myself.setMonitorsLayout = function(monitorInfos) {
		if (!pContext.pMonitorLayout) {
			pContext.pMonitorLayout = [];
		}
		for (var i = 0; i < monitorInfos.length; i++) {
			var monitorInfo = monitorInfos[i];
			var index = 0;
			var id = monitorInfo.id;
			if (!id) {
				id = twiConstant.PRIMARY;
			}
			for (var j = 0; j < pContext.pMonitorLayout.length; j++) {
				if (pContext.pMonitorLayout[j].id == id) {
					index = j;
					break;
				}
			}
			if (!pContext.pMonitorLayout[index]) {
				pContext.pMonitorLayout[index] = { };
			}
			pContext.pMonitorLayout[index].workArea = monitorInfo.workArea;
			// pContext.pMonitorLayout[index].monitorCoordinates = monitorInfo.monitorCoordinates;
			pContext.pMonitorLayout[index].bounds = monitorInfo.bounds;
		}
		twiSendClientInfoAtInterval(true);
	}

    var clientInfoTimer = null;
    function twiSendClientInfoAtInterval(workAreaOnly){
        if(clientInfoTimer){
            clearTimeout(clientInfoTimer);
        }
        clientInfoTimer = setTimeout(function(workAreaOnly){
           twiSendClientInfo(workAreaOnly);
        }.bind(this,workAreaOnly), 1200);
        
    }
    
    
	function twiSendClientInfo(workAreaOnly) {
		if(pContext.hostInfo.hostPausedFlag == true){
			return;
		}
		var bSendClientInfoToHost = true;
		if (!workAreaOnly && pContext.hostInfo.hostAgentFlags & twiConstant.HOST_AGENT_FLAGS_CLIENTINFOEX) {
			var cInfoEx = new TwiC2HClientInfoDataEx();
			twiGetWorkArea(cInfoEx.workArea);
			cInfoEx.dwClientCP = pContext.hostInfo.g_dwClientCP;
			if (!pContext.hostInfo.g_fWaitingForLogin) {
				bSendClientInfoToHost = true;
			}
			if (bSendClientInfoToHost == true) {
				twiSendPacket(twiConstant.TWI_PACKET_C2H_CLIENTINFOEX, cInfoEx, cInfoEx.size);
				}

		} else if (!workAreaOnly && (pContext.hostInfo.hostAgentFlags & twiConstant.HOST_AGENT_FLAGS_CLIENT_SEND_CODEPAGE ) && (pContext.hostInfo.g_dwClientCP))/*New Server*/
		{

			var cInfoV2 = new TwiC2HClientInfoDataV2();
			cInfoV2.memset(0);
			twiGetWorkArea(cInfoV2.workArea);
			cInfoV2.dwClientCP = pContext.hostInfo.g_dwClientCP;
			if (!pContext.hostInfo.g_fWaitingForLogin && !workAreaOnly) {
				bSendClientInfoToHost = false;
			}
			if (bSendClientInfoToHost == true) {
				twiSendPacket(twiConstant.TWI_PACKET_C2H_CLIENTINFO, cInfoV2, cInfoV2.size);
				}
		} else {
			var cInfo = new TwiC2HClientInfoData();
			twiGetWorkArea(cInfo.workArea);
			cInfo.dwClientCP = pContext.hostInfo.g_dwClientCP;
			if (!pContext.hostInfo.g_fWaitingForLogin && !workAreaOnly) {
				bSendClientInfoToHost = false;
			}
			if (bSendClientInfoToHost == true) {
				twiSendPacket(twiConstant.TWI_PACKET_C2H_CLIENTINFO, cInfo, cInfo.size);
			}
		}
	}

	myself.twiSendPausePacket = function(){
	  isC2HPausePackateSent = true;
	  twiSendCmdPacket(twiConstant.TWI_PACKET_C2H_PAUSE);
	}
	
	myself.twiSendResumePacket = function(){
	 twiWindowManager.resetWindows();
	  twiSendCmdPacket(twiConstant.TWI_PACKET_C2H_RESUME);
	}

	function twiPreviewData(pContext, vStream, packet_len) {
		var previewPktObj = new TwiPreviewData();
		marshallReadPreviewData(vStream, previewPktObj, packet_len);
		var hostID = previewPktObj.hostID;
		var extraFlags = previewPktObj.extraFlags;
		var previewPkt = previewPktObj.previewBuffer;
		var previewInPkt = previewPktObj.previewInfoByteCount;
		var pExtendedData = previewPktObj.pExtendedData;
		if (!(extraFlags & twiConstant.TWI_EF_MORE_EXT_COMMANDS)) {
			var bIconBeingDefragmented = isPreviewBeingDefragmented(hostID);
			if (!bIconBeingDefragmented) {
				var preViewImageObj = deCompressPreviewData(previewPkt, 0);
				removePreviewDataToMap(hostID);

			} else {
				var previewData = getPreviewDataFromCache(hostID);
				var offset = previewInPkt.currentOffset;
				for (var i = 0; i < previewInPkt; i++) {
					previewData.buffer[i + offset] = previewPkt[i];
				}
				previewData.currentOffset += previewInPkt;
				previewData.bDefragCompleted = true;
				var iconImageObj = deCompressPreviewData(previewData.buffer, 0);
				removePreviewDataToMap(hostID);

			}

		} else if ((extraFlags & twiConstant.TWI_EF_EXT_DATA) && (extraFlags & twiConstant.TWI_EF_MORE_EXT_COMMANDS)) {

			var curPreviewData = new TwiPreviewCacheData();
			curPreviewData.iconBufferSize = pExtendedData.totalByteCount;
			curPreviewData.bDefragCompleted = false;
			curPreviewData.currentOffset = 0;
			curPreviewData.buffer = new Uint8Array(curPreviewData.iconBufferSize);
			var offset = curPreviewData.currentOffset;
			for (var i = 0; i < previewInPkt; i++) {
				curPreviewData.buffer[i + offset] = previewPkt[i];
			}
			curPreviewData.currentOffset += previewInPkt;
			addPreviewDataToMap(hostID, curPreviewData);
		} else if (extraFlags & twiConstant.TWI_EF_MORE_EXT_COMMANDS) {
			var previewData = getPreviewDataFromCache(hostID);
			var offset = previewData.currentOffset;
			for (var i = 0; i < previewInPkt; i++) {
				previewData.buffer[i + offset] = previewPkt[i];
			}
			previewData.currentOffset += previewInPkt;
		}
	}

	function deCompressPreviewData(pSrc, offset) {
		var buffer = decompressRLEWindow(pSrc, pSrc.length);
		var rvalue = decodePreviewData(buffer, 0);

		return rvalue;
	}

	function addPreviewDataToMap(hostID, curPreviewData) {
		var key = hostID;
		previewDataCache[key] = curPreviewData;
	}

	function removePreviewDataToMap(hostID) {
		var key = hostID;
		previewDataCache[key] = null;
	}

	function getPreviewDataFromCache(hostID) {
		var rvalue = null;
		var key = hostID;
		if (previewDataCache[key]) {
			rvalue = previewDataCache[key];
		}
		return rvalue;
	}

	function getWindowPreviewFromMap(hostID) {
		var rvalue = null;
		var key = hostID;
		if (winPreviewDataCache[key]) {
			rvalue = winPreviewDataCache[key];
		}
		return rvalue;

	}

	function isPreviewBeingDefragmented(hostID) {
		var bReturn = false;
		var pIconData = getPreviewDataFromCache(hostID);
		if (pIconData != null) {
			bReturn = !pIconData.bDefragCompleted;
		}
		return bReturn;
	}

	function decompressRLEWindow(pSrc, ulSrcLen) {
		var ulAllocIncrementSize = 100000;
		var ulSrcPtr = 0;
		var ulDesPtr = 0;
		var nRunSize;
		var nWindowSize = 4;
		// image is always 32-bit, so hardcode window size to 32-bit (4 bytes)
		var i, j;
		var ulCurrentAllocSize = ulAllocIncrementSize;
		var pDes = new Uint8Array(ulCurrentAllocSize);
		while (ulSrcPtr < ulSrcLen) {
			nRunSize = pSrc[ulSrcPtr++] + 1;
			// 1-256 is mapped to values 0-255
			for ( i = 0; i < nRunSize; i++) {
				for ( j = 0; j < nWindowSize; j++) {
					pDes[(ulDesPtr++)] = pSrc[ulSrcPtr + j];

					if (ulDesPtr >= ulCurrentAllocSize) {
						ulCurrentAllocSize += ulAllocIncrementSize;
						var pNewDes = new Uint8Array(ulCurrentAllocSize);
						for (var k = 0; k < ulDesPtr; k++) {
							pNewDes[k] = pDes[k];
						}
						pDes = pNewDes;
					}
				}
			}
			ulSrcPtr += nWindowSize;

		}

		return pDes;

	}

	function decodePreviewData(iconData, offset, previousData) {
		var biSize = ByteWriter.readInt4(iconData, offset + 0);
		var biWidth = ByteWriter.readInt4(iconData, offset + 4);
		var biHeight = ByteWriter.readInt4(iconData, offset + 8);
		var biPlanes = ByteWriter.readUInt2(iconData, offset + 12);
		var biBitCount = ByteWriter.readUInt2(iconData, +14);
		var biCompression = ByteWriter.readInt4(iconData, offset + 16);
		var biSizeImage = ByteWriter.readInt4(iconData, offset + 20);
		var biXPelsPerMeter = ByteWriter.readInt4(iconData, offset + 24);
		var biYPelsPerMeter = ByteWriter.readInt4(iconData, offset + 28);
		var biClrUsed = ByteWriter.readInt4(iconData, offset + 32);
		var biClrImportant = ByteWriter.readInt4(iconData, offset + 36);
		var finalData;
		if (previousData) {
			finalData = previousData;
		}
		if (!finalData) {
			finalData = new Uint32Array(biWidth * biHeight);
		}
		var position = 40;
		var final8Data = new Uint8Array(finalData.buffer);
		var icon32Data = new Uint32Array(iconData.buffer, 40);
		for (var y = biHeight - 1; y >= 0; y--) {
			var location = y * biWidth;
			for (var x = 0; x < biWidth; x++) {
				finalData[location] = 0xff000000 | (((iconData[position] << 16) | (iconData[position + 1] << 8) | iconData[position + 2])) ^ finalData[location];
				position += 4;
				;
				location++;
			}
			position += (biWidth & 3);
		}
		return {
			width : biWidth,
			height : biHeight,
			data : finalData,
			type : 'Int32Array'
		};

	}

	/****************************************************************************
	 *
	 *  TWINewWindow
	 *
	 *  We have been given parameters to create a new seamless window.  If the
	 *  window already exists then we don't bother creating it.
	 */

	function twiNewWindow(pContext, pkt, fIsAMenu) {
		if (pContext.hostInfo.hostPausedFlag)
			return;
		twiWindowManager.createNewWindow(pkt, fIsAMenu);

	}

	/*******************************************************************************
	 *
	 *  TWINewWindowV2
	 *
	 *  Extended request to create a new seamless window.  If the
	 *  window already exists then we don't bother creating it.
	 *
	 ******************************************************************************/

	function twiNewWindowV2(pContext, pkt) {
		if (pContext.hostInfo.hostPausedFlag)
			return;
		twiWindowManager.createNewWindow(pkt, false);
	}

	function twiDeleteWindow(wId) {
		if (pContext.hostInfo.hostPausedFlag == true) {
			return;
		}
		twiWindowManager.deleteWindow(wId);

	}

 function twiChangeIconV1(pContext, vStream, packet_len) {
		var iconpkt = new TwiIconDataV1();
		packet_len = marshallReadIcon(vStream, iconpkt, packet_len);
		if (!iconpkt.iconInfo) {
			return;
		}
		var hostID = iconpkt.hostID;
		var iconType = iconpkt.iconType;
		var iconPacket = iconpkt.iconInfo;
				if (iconType == twiConstant.TWI_SMALL_ICON || iconType == twiConstant.TWI_LARGE_ICON) {
					var iconImageObj = decodeIconBitMap(iconPacket, 0);
					twiChangeIcon(hostID, 0, iconType, iconImageObj);
				}
 }
	function twiChangeIconV2(pContext, vStream, packet_len) {
		var iconpkt = new TwiIconDataV2();
		packet_len = marshallReadIconV2(vStream, iconpkt, packet_len);
		if (!iconpkt.iconInfo) {
			return;
		}
		var hostID = iconpkt.hostID;
		var processID = iconpkt.processID;
		var iconType = iconpkt.iconType;
		var iconDataInPkt = iconpkt.iconInfoByteCount;
		var extraFlags = iconpkt.extraFlags;
		var pExtendedData = iconpkt.pExtendedData;
		var iconPacket = iconpkt.iconInfo;
		if (!(extraFlags & twiConstant.TWI_EF_MORE_EXT_COMMANDS)) {
			var bIconBeingDefragmented = isIconBeingDefragmented(hostID, processID, iconType);
			if (!bIconBeingDefragmented) {
				if (iconType == twiConstant.TWI_SMALL_ICON || iconType == twiConstant.TWI_LARGE_ICON) {
					var iconImageObj = decodeIconBitMap(iconPacket, 0);
					twiChangeIcon(hostID, processID, iconType, iconImageObj);
				} else {
				}

			} else {
				var iconData = getIconDataFromMap(hostID, processID, iconType);
				var offset = iconData.currentOffset;
				for (var i = 0; i < iconDataInPkt; i++) {
					iconData.buffer[i + offset] = iconPacket[i];
				}
				iconData.currentOffset += iconDataInPkt;
				iconData.bDefragCompleted = true;
				var iconImageObj = decodeIconBitMap(iconData.buffer, 0);
				twiChangeIcon(hostID, processID, iconType, iconImageObj);
			}

		} else if ((extraFlags & twiConstant.TWI_EF_EXT_DATA) && (extraFlags & twiConstant.TWI_EF_MORE_EXT_COMMANDS)) {
			var curIconData = new TwiIconData();
			curIconData.iconBufferSize = pExtendedData.totalByteCount;
			curIconData.bDefragCompleted = false;
			curIconData.currentOffset = 0;
			curIconData.bCacheIcon = extraFlags & twiConstant.TWI_EF_CACHE_ICON;
			curIconData.buffer = new Uint8Array(curIconData.iconBufferSize);
			var offset = curIconData.currentOffset;
			for (var i = 0; i < iconDataInPkt; i++) {
				curIconData.buffer[i + offset] = iconPacket[i];
			}
			curIconData.currentOffset += iconDataInPkt;
			addIconDataToMap(hostID, processID, iconType, curIconData);
		} else if (nExtraFlags & twiConstant.TWI_EF_MORE_EXT_COMMANDS) {
			var iconData = getIconDataFromMap(hostID, processID, iconType);
			var offset = iconData.currentOffset;
			for (var i = 0; i < iconDataInPkt; i++) {
				iconData.buffer[i + offset] = iconPacket[i];
			}
			iconData.currentOffset += iconDataInPkt;
		}

	}

	function addIconDataToMap(hostID, processID, iconType, curIconData) {
		var key = hostID + "/" + processID + "/" + iconType;
		iconCache[key] = curIconData;
	}

	function getIconDataFromMap(hostID, processID, iconType) {
		var rvalue = null;
		var key = hostID + "/" + processID + "/" + iconType;
		if (iconCache[key]) {
			rvalue = iconCache[key];
		}
		return rvalue;
	}

	function isIconBeingDefragmented(hostID, processID, iconType) {
		var bReturn = false;
		var pIconData = getIconDataFromMap(hostID, processID, iconType);
		if (pIconData != null) {
			bReturn = !pIconData.bDefragCompleted;
		}
		return bReturn;
	}

	function twiChangeIcon(hostID, processID, iconType, iconObj) {
		if (pContext.hostInfo.hostPausedFlag) {
			return;
		}
		twiWindowManager.changeWindowIcon(hostID, processID, iconType, iconObj);
	}

	function twiGetWorkArea(pRect) {
		if (pContext.pMonitorLayout) {
			if (pContext.pMonitorLayout.length == 1) {
				pRect.left = pContext.pMonitorLayout[0].workArea.left;
				pRect.top = pContext.pMonitorLayout[0].workArea.top;
				// pRect.right =  (pContext.pMonitorLayout[0].workArea.right < pContext.hostInfo.vdaRes.width)?pContext.pMonitorLayout[0].workArea.right : pContext.hostInfo.vdaRes.width;
				pRect.right =  pContext.pMonitorLayout[0].workArea.width;
				// pRect.bottom = (pContext.pMonitorLayout[0].workArea.bottom	 < pContext.hostInfo.vdaRes.height)?pContext.pMonitorLayout[0].workArea.bottom : pContext.hostInfo.vdaRes.height;
				pRect.bottom = pContext.pMonitorLayout[0].workArea.height;
			}

		} else {
			pRect.left = 0;
			pRect.top = 0;
			pRect.right = ( pContext.hostInfo.vdaRes.width == 0xffffffff) ? pContext.hostInfo.xRes : pContext.hostInfo.vdaRes.width;
			pRect.bottom = (pContext.hostInfo.vdaRes.height == 0xffffffff) ? pContext.hostInfo.yRes : pContext.hostInfo.vdaRes.height;
		}
	}

	// We have been asked by the server to force this window into the foreground
	function tWISetForegroundWindow(pContext, packet_len, wID) {
		/*
		 * resetting lastFocused 
		 */
		pContext.hostInfo.lastFocused = wID;
		if (wID != 0) {
			pContext.hostInfo.lastHostFocusedApp = wID;
			
		}
		if (pContext.hostInfo.hostPausedFlag === true)
			return;
		twiWindowManager.changeFocus(wID);
	}

	var handleClosePacket = function() {
		pContext.hostInfo.hostPausedFlag = true;
		twiWindowManager.resetOnClose();
	    if(isC2HPausePackateSent){
	      //myself.twiSendResumePacket();
	      isC2HPausePackateSent = false;
	    }
	};

	/*****************
	 * Input helpers *
	 *****************/

	/**
	 * Discards incoming data from the virtual stream.
	 *
	 * @param   packet_len the number of bytes to discard.
	 */
	var consumeData = function(packet_len) {
		for (var i = 0; i < packet_len; i++) {
			var data = vStream.ReadByte();
		}
	};

	/**
	 * Initialize using any needed parameters in the profile, etc.
	 */
	myself.initialize = function(vs) {
		vStream = vs;
	};

	myself.terminate = function() {

	};
	function twiWriteDummyPacket( ){
		
	}
	twiSendPacket = twiWriteDummyPacket;
	function twiSendVcPacket(cmd, cmdStruct, cmdStructSize) {
		var len = cmdStructSize;
		var data = new Uint8Array(len + 3);
		data[0] = cmd;
		data[1] = (len ) & 0xff;
		data[2] = (len >> 8) & 0xff;
		var offset = cmdStruct.write(data, 3);
		vStream.WriteByte(data, 0, offset);
	}

	function twiSendCmdPacket(cmd) {
		var data = new Uint8Array(3);
		data[0] = cmd;
		data[1] = 0;
		data[2] = 0;
		vStream.WriteByte(data, 0, 3);
	}


	myself.sendC2HFocus = function(hostID,timestamp) {
	  //calculate time between blur and succesive focus and if time < 150 ms consider as minimize instead of focus
	  if(timestamp)
	  {
		var diffTimeStamp = timestamp - bTimestamp;
		console.log("diffTimeStamp"+diffTimeStamp);
		if(pContext.hostInfo.lastHostFocusedApp === hostID)
		{
			if(isBlur === true && diffTimeStamp < 150 && hostID > 0)
			{
				console.log("Minimize for hostID "+hostID);
				twiSendMessageCmd(hostID, twiConstant.WM_SYSCOMMAND, twiConstant.SC_MINIMIZE, 0, 0);
				// Let's minimize proxy window here.
				{
				twiWindowManager.minimizeWindow(hostID);
				twiWindowManager.flushUIManagerCmd();
				//Setting pContext.hostInfo.lastHostFocusedApp to 0 only in showInShelf case because for regular case this can impact Alt+Tab
				if (HTML5_CONFIG && HTML5_CONFIG['seamless'] && HTML5_CONFIG['seamless']['showInShelf'])
				  pContext.hostInfo.lastHostFocusedApp = 0;
				}
			return;
			}
		}
	  }
	  
	  twiWindowManager.chkIfRestore(hostID);
		pContext.hostInfo.lastFocused = hostID;
		twiConstant.writeSeamlessLog({'cmdType':'C2H','cmd':'focus' ,'hostID' : hostID  });
		var c2hFocusStruct = new Twi_C2H_SetFocus(hostID);
		twiSendPacket(twiConstant.TWI_PACKET_C2H_SETFOCUS, c2hFocusStruct, Twi_C2H_SetFocus.prototype.size);
	};

	myself.terminateWindow = function(hostID) {
		var c2hTerminateStruct = new Twi_C2H_Terminate(hostID);
		twiSendPacket(twiConstant.TWI_PACKET_C2H_TERMINATE, c2hTerminateStruct, Twi_C2H_Terminate.prototype.size);
	};
	
	myself.closeWindow = function(hostID) {
		var c2hCloseStruct = new Twi_C2H_CloseWnd(hostID);
		twiSendPacket(twiConstant.TWI_PACKET_C2H_CLOSEWND, c2hCloseStruct, Twi_C2H_CloseWnd.prototype.size);
	};


	myself.changePosition = function(hostId, left, top, width, height) {
		var c2hReposition = new Twi_Data_C2H_SetPos();
		c2hReposition.setData(hostId, left, top, width, height);
		twiSendPacket(twiConstant.TWI_PACKET_C2H_SETPOS, c2hReposition, c2hReposition.size);
        myself.sendC2HFocus(hostId);
	};
	myself.sendLog_offC2H = function() {
		twiSendCmdPacket(twiConstant.TWI_PACKET_C2H_LOGOUT);
	};
	myself.blurSessionApps = function(bTimeStamp) {
       //when we get a blur event set isBlur and calculate time when blur was received		
    if(bTimeStamp)
    {
	    isBlur = true;
	    bTimestamp = Math.floor(Date.now());
    }
    else
    {
		if (pContext.hostInfo.hostPausedFlag === true)
			return;
		  myself.sendC2HFocus(0);
    }
	};
	myself.focusSession = function() {
	    isBlur = false;
		bTimestamp = 0;
		if (pContext.hostInfo.hostPausedFlag === true)
			return;
		if( pContext.hostInfo.lastFocused == 0){
			  myself.sendC2HFocus(pContext.hostInfo.lastHostFocusedApp);
		  }
	};
	function twiSendMessageCmd(hostID, msg, wParam, lParam, timeOut) {
		if (!timeOut) {
			timeOut = 0;
		}
		var sendMessageData = new TwiSendMessageData();
		sendMessageData.hostID = hostID;
		sendMessageData.msg = msg;
		sendMessageData.wParam = wParam;
		sendMessageData.lParam = lParam;
		sendMessageData.timeOut = timeOut;
		twiSendPacket(twiConstant.TWI_PACKET_C2H_SEND_MESSAGE, sendMessageData, sendMessageData.size);
	}


	myself.minimizeC2HWindow = function(hostID) {
		twiSendMessageCmd(hostID, twiConstant.WM_SYSCOMMAND, twiConstant.SC_MINIMIZE, 0, 0);
	};

	myself.restoreC2HWindow = function(hostID) {
		var restore = new Twi_C2H_Restore();
		restore.hostID = hostID;
		twiSendPacket(twiConstant.TWI_PACKET_C2H_RESTORE, restore, restore.size);
	};
	myself.maximizeC2HWindow = function(hostID) {
		twiSendMessageCmd(hostID, twiConstant.WM_SYSCOMMAND, twiConstant.SC_MAXIMIZE, 0, 0);
	};
	myself.sendResendWnd = function(hostID) {
	    var c2hResendWin = new Twi_C2H_ResendWnd(hostID);
        twiSendPacket(twiConstant.TWI_PACKET_C2H_RESENDWND, c2hResendWin, Twi_C2H_ResendWnd.prototype.size);
        console.log("sending resend window");
    };
	function decodeIconBitMap(iconData, offset) {
		var BITMAP_SIZE_OFFSET = 0;
		var BITMAP_WIDTH_OFFSET = 4;
		var BITMAP_HEIGHT_OFFSET = 8;
		var BITMAP_PLANES_OFFSET = 12;
		var BITMAP_BITCOUNT_OFFSET = 14;
		var BITMAP_COMPRESSION_OFFSET = 16;
		var BITMAP_SIZEIMAGE_OFFSET = 20;
		var BITMAP_XPELSPERMETER_OFFSET = 24;
		var BITMAP_YPELSPERMETER_OFFSET = 28;
		var BITMAP_CLRUSED_OFFSET = 32;
		var BITMAP_CLRIMPORTANT_OFFSET = 36;
		var BITMAP_RGBQUADS_OFFSET = 40;
		var RGBQUAD_SIZE = 4;
		var version = ByteWriter.readUInt2(iconData, 0);
		var headerSize = ByteWriter.readUInt2(iconData, 2);
		var totalSize = ByteWriter.readInt4(iconData, 4);
		var offsetMaskInfo = ByteWriter.readInt4(iconData, 8);
		var offsetMaskBits = ByteWriter.readInt4(iconData, 12);
		var offsetIconInfo = ByteWriter.readInt4(iconData, 16);
		var offsetIconBits = ByteWriter.readInt4(iconData, 20);
		var maskBitCount = ByteWriter.readUInt2(iconData, offsetMaskInfo + BITMAP_BITCOUNT_OFFSET);
		var iconBitCount = ByteWriter.readUInt2(iconData, offsetIconInfo + BITMAP_BITCOUNT_OFFSET);
		var iconWidth = ByteWriter.readInt4(iconData, offsetIconInfo + BITMAP_WIDTH_OFFSET);
		var iconHeight = ByteWriter.readInt4(iconData, offsetIconInfo + BITMAP_HEIGHT_OFFSET);
		var maskWidth = ByteWriter.readInt4(iconData, offsetMaskInfo + BITMAP_WIDTH_OFFSET);
		var maskHeight = ByteWriter.readInt4(iconData, offsetMaskInfo + BITMAP_HEIGHT_OFFSET);
		var ppb = 8 / iconBitCount;
		var srcBytesPerLine = Math.floor((iconWidth + ppb - 1) / ppb);
		var srcMaskBytesPerLine = Math.floor((iconWidth + 7) / 8);
		var totalSrcBytesPerLine = (srcBytesPerLine + 0x3) & ~0x3;
		var totalMaskBytesPerLine = (srcMaskBytesPerLine + 0x3) & ~0x3;

		var pixelCount = iconWidth * iconHeight;
		var Bpp = Math.round(iconBitCount / 8);
		var blue, green, red, alpha;
		var r = new Uint8Array(256);
		var g = new Uint8Array(256);
		var b = new Uint8Array(256);
		var a = new Uint8Array(256);

		var iconPixels = decodeIconBitMap.expandImage(iconData, offsetIconBits, iconWidth, iconHeight, iconBitCount);

		var iconrgbPixel = null;
		if (iconPixels) {
			iconrgbPixel = new Uint32Array(iconWidth * iconHeight);
			if (iconBitCount <= 8) {
				var offsetPaletteData = offsetIconInfo + BITMAP_RGBQUADS_OFFSET;
				var noColors = 1 << iconBitCount;
				// Create pallette
				for (var i = 0; i < noColors; i++) {
					b[i] = iconData[offsetPaletteData++];
					g[i] = iconData[offsetPaletteData++];
					r[i] = iconData[offsetPaletteData++];
					offsetPaletteData++;
				}
			}
			var bAllAlphaZero = (iconBitCount <= 8) ? false : true;
			for (var pixel = 0; pixel < pixelCount; pixel++) {
				var ix = pixel % iconWidth;
				var iy = Math.floor(pixel / iconHeight);

				if (iconBitCount <= 8) {
					// The pixel components are in the format BGRA
					blue = b[iconPixels[pixel]] & 0x000000ff;
					green = (g[iconPixels[pixel]] << 8) & 0x0000ff00;
					red = (r[iconPixels[pixel]] << 16) & 0x00ff0000;
				} else {
					var imageIndex = pixel * Bpp;
					blue = (iconPixels[imageIndex] << 16) & 0x00ff0000;
					green = (iconPixels[imageIndex + 1] << 8) & 0x0000ff00;
					;
					red = iconPixels[imageIndex + 2] & 0x000000ff;
					
                    if(iconBitCount == 32) {
						alpha = (iconPixels[imageIndex + 3] << 24) & 0xff000000;
					}
					//for iconBitCount 8/16/24 make alpha as 255
					else
					{
					alpha = 0xff000000;
					}
					// Toggle the flag if we've seen a non-zero alpha
					if (alpha != 0 && bAllAlphaZero) {
						bAllAlphaZero = false;
					}
				}
				var color = alpha | red | green | blue;
				iconrgbPixel[ix + iconWidth * iy] = color;
			}
				}
        //pass bAllAlphaZero if alpha mask is all 0's
		decodeIconBitMap.cutOutMask(iconData, offsetMaskBits, iconrgbPixel, 0, iconWidth, iconHeight, 0x00000000 ,bAllAlphaZero);
		return {
			width : iconWidth,
			height : iconHeight,
			data : iconrgbPixel,
			type : 'Int32Array'
		};
	};

	decodeIconBitMap.expandImage = function(imageData, imageOffset, width, height, bpp) {
		var newImage = null;
		var totalPixels = width * height;
		// Only support 1,2 and 4 bpp expansion
		if (bpp > 8) {
			// Special case, just create a new array and flip over the image.
			var Bpp = Math.floor(bpp / 8);
			newImage = new Uint8Array(totalPixels * Bpp);
			for (var line = 0; line < height; line++) {
				var srcOff = imageOffset + (height - line - 1) * width * Bpp;
				var desOff = line * width * Bpp;
				var length = width * Bpp;
				for (var i = 0; i < length; i++) {
					newImage[desOff + i] = imageData[srcOff + i];
				}
			}
		} else if (bpp == 1 || bpp == 2 || bpp == 4 || bpp == 8) {
			// Expanding to 8bpp image
			newImage = new Uint8Array(totalPixels);
			var destOffset;
			var mask = (1 << bpp) - 1;
			var ppb = Math.floor(8 / bpp);

			// Calculate number of bytes of useful pixel data per line.
			var srcBytesPerLine = Math.floor((width + ppb - 1) / ppb);

			// Each line is aligned on a 4 byte boundary.  Round up to determine the total
			// bytes per line.
			var totalSrcBytesPerLine = (srcBytesPerLine + 0x3) & ~0x3;

			// Left over pixels occupying the last byte of the line.
			var trailingPixels = width & (ppb - 1);

			// If there is a partially used byte at the end of the line, process all other
			// bytes first, and deal with the trailing byte later.
			if (trailingPixels > 0) {
				srcBytesPerLine--;
			}

			for (var line = 0; line < height; line++) {
				destOffset = width * (height - line - 1);
				var srcBytesToGo = srcBytesPerLine;
				var srcOffset = imageOffset + line * totalSrcBytesPerLine;
				var revBpp = 8 - bpp;
				var srcByte;

				while (srcBytesToGo-- > 0) {
					srcByte = imageData[srcOffset++];
					// Expand byte
					switch(bpp) {
					case 1:
						newImage[destOffset++] = ((srcByte >> revBpp) & mask);
						srcByte <<= bpp;
						newImage[destOffset++] = ((srcByte >> revBpp) & mask);
						srcByte <<= bpp;
						newImage[destOffset++] = ((srcByte >> revBpp) & mask);
						srcByte <<= bpp;
						newImage[destOffset++] = ((srcByte >> revBpp) & mask);
						srcByte <<= bpp;
					// Fall through
					case 2:
						newImage[destOffset++] = ((srcByte >> revBpp) & mask);
						srcByte <<= bpp;
						newImage[destOffset++] = ((srcByte >> revBpp) & mask);
						srcByte <<= bpp;
					// Fall through
					case 4:
						newImage[destOffset++] = ((srcByte >> revBpp) & mask);
						srcByte <<= bpp;
						// case 8: (no expansion necessary)
						newImage[destOffset++] = ((srcByte >> revBpp) & mask);
					}
				}

				// Handle any trailing byte that is not fully populated with pixel data.
				if (trailingPixels > 0) {
					srcByte = imageData[srcOffset++];
					for (var i = 0; i < trailingPixels; i++) {
						newImage[destOffset++] = ((srcByte >> revBpp) & mask);
						srcByte <<= bpp;
					}
				}
			}
		}
		// else, unsupported bit depth
		return newImage;
	};

	decodeIconBitMap.cutOutMaskRow = function(maskData, maskOffset, imageData, imageOffset, rowLength, cutoutColor ,bAllAlphaZero) {
		var mask = 0;

		for (var count = 0; count < rowLength; count++) {
			// Have we run out of mask pixels in the current mask byte?
			if ((count & 0x7) == 0x0) {
				// Yes, get the next mask byte.
				mask = maskData[maskOffset + Math.floor(count / 8)];
			}

			// Test top bit of mask byte
			if ((mask & 0x80) == 0x80) {
				// Mask bit represents transparent pixel, set the appropriate
				// pixel in the icon image data to transparent.
				imageData[imageOffset + count] = 0x00000000;
			} 
			//if all alpha values are 0 then mask it with 255
			else if(bAllAlphaZero)
			{
				imageData[imageOffset + count] |= 0xff000000;
			}

			// Shift the next relevant mask pixel into the top bit of the byte.
			mask <<= 1;
		}
	};

	/**
	 * This function was used in the original java client - refer to the change history if we need to reincarnate support for masked icons
	 */
	decodeIconBitMap.cutOutMask = function(maskData, maskOffset, imageData, imageOffset, width, height, cutOutColour, bAllAlphaZero) {
		// convert width to 1bpp and round up stride to 4 bytes
		var maskStride = Math.floor((width / 8) + 0x3) & ~0x3;

		// Count through all icon rows cutting out transparent pixels.
		for (var y = 0; y < height; y++) {
			// We step forward through the image data but backward through
			// the mask data (we have already reversed the icon image row order
			// from its DIB origins.)
			decodeIconBitMap.cutOutMaskRow(maskData, (height - y - 1) * maskStride + maskOffset, imageData, y * width + imageOffset, width, cutOutColour, bAllAlphaZero);
		}
	};

}
