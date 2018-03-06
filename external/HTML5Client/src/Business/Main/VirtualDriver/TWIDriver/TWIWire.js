function marshallReadTwiSysinfoData(vStream, writePtr, len, type) {
	writePtr.mainWindow = vStream.ReadInt32();
	writePtr.stdFrameX = vStream.ReadInt16();
	writePtr.stdFrameY = vStream.ReadInt16();
	writePtr.dlgFrameX = vStream.ReadInt16();
	writePtr.dlgFrameY = vStream.ReadInt16();
	writePtr.thickFrameX = vStream.ReadInt16();
	writePtr.thickFrameY = vStream.ReadInt16();
	writePtr.thinFrameX = vStream.ReadInt16();
	writePtr.thinFrameY = vStream.ReadInt16();
	writePtr.stdFrameCCX = vStream.ReadInt16();
	writePtr.stdFrameCCY = vStream.ReadInt16();
	writePtr.dlgFrameCCX = vStream.ReadInt16();
	writePtr.dlgFrameCCY = vStream.ReadInt16();
	writePtr.thickFrameCCX = vStream.ReadInt16();
	writePtr.thickFrameCCY = vStream.ReadInt16();
	writePtr.thinFrameCCX = vStream.ReadInt16();
	writePtr.thinFrameCCY = vStream.ReadInt16();
	writePtr.stdCaptY = vStream.ReadInt16();
	writePtr.tinyCaptY = vStream.ReadInt16();
	writePtr.stdCBX = vStream.ReadInt16();
	writePtr.stdCBY = vStream.ReadInt16();
	writePtr.tinyCBX = vStream.ReadInt16();
	writePtr.tinyCBY = vStream.ReadInt16();
	var oServerName = vStream.ReadInt16();
	var oUserName = vStream.ReadInt16();
	var oUserDomainName = vStream.ReadInt16();
	len = len - 54;
	var strData = new Uint8Array(len);
	vStream.ReadBytes(strData, 0, len);
	var offset = oServerName ;
	for (var i = 0; i < len; i++) {
		if (strData[offset + i] === 0) {
			break;
		}
	}
	if (type === twiConstant.CP_UTF8) {
		writePtr.serverName = Convert.ToUTF8FromByteArray(strData, offset, i + 1);
	} else {
		writePtr.serverName = Convert.ToASCIIFromByteArray(strData, offset, i + 1);
	}
	
	var offset = oUserName ;
	for (var i = 0; i < len; i++) {
		if (strData[offset + i] === 0) {
			break;
		}
	}
	if (type === twiConstant.CP_UTF8) {
		writePtr.userName = Convert.ToUTF8FromByteArray(strData, offset, i + 1);
	} else {
		writePtr.userName = Convert.ToASCIIFromByteArray(strData, offset, i + 1);
	}
	var offset = oUserDomainName ;
	for (var i = 0; i < len; i++) {
		if (strData[offset + i] === 0) {
			break;
		}
	}
	if (type === twiConstant.CP_UTF8) {
		writePtr.userDomainName = Convert.ToUTF8FromByteArray(strData, offset, i + 1);
	} else {
		writePtr.userDomainName = Convert.ToASCIIFromByteArray(strData, offset, i + 1);
	}
	return len;
}

function marshallReadTwiHostInfo(vStream, writePtr, len) {
	writePtr.hostType = vStream.ReadUInt8();
	writePtr.hostVersionMajor = vStream.ReadUInt8();
	writePtr.hostVersionMinor = vStream.ReadUInt8();
	writePtr.hostAgentVersion = vStream.ReadUInt8();
	writePtr.twiVersion = vStream.ReadUInt8();
	writePtr.twiVersionLow = vStream.ReadUInt8();
	writePtr.hostBuild = vStream.ReadInt16();
	writePtr.xRes = vStream.ReadInt16();
	writePtr.yRes = vStream.ReadInt16();
	writePtr.hostAgentState = vStream.ReadUInt8();
	writePtr.hostAgentFlags = vStream.ReadInt32();
	return len;
}

function marshallReadTwiNewProcessData(vStream, writePtr, len, type) {
	var oModuleFileDesc = vStream.ReadInt16();
	var oModuleFilePath = vStream.ReadInt16();
	var oPublishedAppName = vStream.ReadInt16();
	writePtr.processID = vStream.ReadInt32();
	writePtr.parentProcessID = vStream.ReadInt32();
	writePtr.extraFlags = vStream.ReadInt16();
	len = len - 16;
	var strData = new Uint8Array(len);
	vStream.ReadBytes(strData, 0, len);
	var offset = oModuleFileDesc - 16;
	for (var i = 0; i < len; i++) {
		if (strData[offset + i] === 0) {
			break;
		}
	}
	if (type === twiConstant.CP_UTF8) {
		writePtr.moduleFileDesc = Convert.ToUTF8FromByteArray(strData, offset, i + 1);
	} else {
		writePtr.moduleFileDesc = Convert.ToASCIIFromByteArray(strData, offset, i + 1);
	}

	var offset = oModuleFilePath - 16;
	for ( i = 0; i < len; i++) {
		if (strData[offset + i] === 0) {
			break;
		}
	}
	if (type === twiConstant.CP_UTF8) {
		writePtr.moduleFilePath = Convert.ToUTF8FromByteArray(strData, offset, i + 1);
	} else {
		writePtr.moduleFilePath = Convert.ToASCIIFromByteArray(strData, offset, i + 1);
	}
	var offset = oPublishedAppName - 16;
	for ( i = 0; i < len; i++) {
		if (strData[offset + i] === 0) {
			break;
		}
	}
	if (type === twiConstant.CP_UTF8) {
		writePtr.publishedAppName = Convert.ToUTF8FromByteArray(strData, offset, i + 1);
	} else {
		writePtr.publishedAppName = Convert.ToASCIIFromByteArray(strData, offset, i + 1);
	}
	return len;
}

function marshallReadTwiNewWindowV2(vStream, writePtr, len, type) {
	writePtr.hostID = vStream.ReadInt32();
	writePtr.windowStyle = vStream.ReadInt32();
	writePtr.exWindowStyle = vStream.ReadInt32();
	writePtr.position.left = vStream.ReadInt32();
	writePtr.position.top = vStream.ReadInt32();
	writePtr.position.right = vStream.ReadInt32();
	writePtr.position.bottom = vStream.ReadInt32();
	writePtr.clientRect.left = vStream.ReadInt32();
	writePtr.clientRect.top = vStream.ReadInt32();
	writePtr.clientRect.right = vStream.ReadInt32();
	writePtr.clientRect.bottom = vStream.ReadInt32();
	writePtr.hostOwner = vStream.ReadInt32();
	writePtr.processID = vStream.ReadInt32();
	writePtr.extraFlags = vStream.ReadInt16();
	var oWindowName = vStream.ReadInt16();
	var oWindowGroupID = vStream.ReadInt16();
	len = len - 58;
	var strData = new Uint8Array(len);
	vStream.ReadBytes(strData, 0, len);
	var offset = oWindowName - 58;
	for (var i = 0; i < len; i++) {
		if (strData[offset + i] === 0) {
			break;
		}
	}
	if (type === twiConstant.CP_UTF8) {
		writePtr.windowName = Convert.ToUTF8FromByteArray(strData, offset, i + 1);
	} else {
		writePtr.windowName = Convert.ToASCIIFromByteArray(strData, offset, i + 1);
	}

	var offset = oWindowGroupID - 58;
	for ( i = 0; i < len; i++) {
		if (strData[offset + i] === 0) {
			break;
		}
	}
	if (type === twiConstant.CP_UTF8) {
		writePtr.windowGroupID = Convert.ToUTF8FromByteArray(strData, offset, i + 1);
	} else {
		writePtr.windowGroupID = Convert.ToASCIIFromByteArray(strData, offset, i + 1);
	}
	return len;

}

function marshallReadTwiNewWindow(vStream, writePtr, len, type) {
	writePtr.hostID = vStream.ReadInt32();
	writePtr.extraFlags = vStream.ReadInt16();
	writePtr.windowStyle = vStream.ReadInt32();
	writePtr.exWindowStyle = vStream.ReadInt32();
	writePtr.position.left = vStream.ReadInt32();
	writePtr.position.top = vStream.ReadInt32();
	writePtr.position.right = vStream.ReadInt32();
	writePtr.position.bottom = vStream.ReadInt32();
	writePtr.clientRect.left = vStream.ReadInt32();
	writePtr.clientRect.top = vStream.ReadInt32();
	writePtr.clientRect.right = vStream.ReadInt32();
	writePtr.clientRect.bottom = vStream.ReadInt32();
	writePtr.hostOwner = vStream.ReadInt32();
	len -= 50;
	if (len > 0) {
		var strData = new Uint8Array(len);
		vStream.ReadBytes(strData, 0, len);
		for (var i = 0; i < len; i++) {
			if (strData[i] === 0) {
				break;
			}
		}
	   if (type === twiConstant.CP_UTF8) {
			writePtr.windowName = Convert.ToUTF8FromByteArray(strData, 0, i + 1);
		} else {
			writePtr.windowName = Convert.ToASCIIFromByteArray(strData, 0, i + 1);
		}
			
	}
	return len;

}

function marshallReadDeleteProcess(vStream, writePtr, len) {
	writePtr.processID = vStream.ReadInt32();
	writePtr.extraFlags = vStream.ReadInt16();
	return len;
}

function marshallReadSizeBox(vStream, writePtr, len) {
	writePtr.hostID = vStream.ReadInt32();
	writePtr.sizeBoxRect.left = vStream.ReadInt32();
	writePtr.sizeBoxRect.top = vStream.ReadInt32();
	writePtr.sizeBoxRect.right = vStream.ReadInt32();
	writePtr.sizeBoxRect.bottom = vStream.ReadInt32();
	return len;
}

function marshallReadIcon(vStream, writePtr, len) {
	var totalLen = len;
	writePtr.hostID = vStream.ReadInt32();
	writePtr.iconType = vStream.ReadInt32();
	len-=8;
	writePtr.iconInfo = new Uint8Array(len);
	vStream.ReadBytes(writePtr.iconInfo, 0, len);
}
function marshallReadIconV2(vStream, writePtr, len) {
	var totalLen = len;
	writePtr.hostID = vStream.ReadInt32();
	writePtr.processID = vStream.ReadInt32();
	writePtr.iconType = vStream.ReadInt32();
	writePtr.extraFlags = vStream.ReadInt16();
	var oIconInfo = vStream.ReadInt16();
	writePtr.iconInfoByteCount = vStream.ReadInt16();
	len -= 18;
	if ((writePtr.extraFlags & twiConstant.TWI_EF_EXT_DATA) && (writePtr.extraFlags & twiConstant.TWI_EF_MORE_EXT_COMMANDS)) {
		len = marshallReadTwiExtData(vStream, writePtr.pExtendedData, len);
	}
	var skipbytes = totalLen - len - oIconInfo;
	if (skipbytes > 0) {
		len -= skipbytes;
		vStream.SkipByte(skipbytes);
	}
	var iconlen = 0;
	if ((writePtr.extraFlags & twiConstant.TWI_EF_MORE_EXT_COMMANDS)) {
		iconlen = writePtr.iconInfoByteCount;
	} else {
		var maxIconLengthInPkt = totalLen - oIconInfo;
		iconlen = writePtr.iconInfoByteCount > maxIconLengthInPkt ? maxIconLengthInPkt : writePtr.iconInfoByteCount;
	}
	if (iconlen > 0) {
		writePtr.iconInfo = new Uint8Array(iconlen);
		vStream.ReadBytes(writePtr.iconInfo, 0, iconlen);
		len -= iconlen;
	}
	return len;

}

function marshallReadPreviewData(vStream, writePtr, len) {
	var totalLen = len;
	writePtr.hostID = vStream.ReadInt32();
	writePtr.extraFlags = vStream.ReadInt16();
	var oPreviewInfo = vStream.ReadInt16();
	writePtr.previewInfoByteCount = vStream.ReadInt16();
	len = len - 10;
	if ((writePtr.extraFlags & twiConstant.TWI_EF_EXT_DATA) && (writePtr.extraFlags & twiConstant.TWI_EF_MORE_EXT_COMMANDS)) {
		len = marshallReadTwiExtData(vStream, writePtr.pExtendedData, len);
	}
	var skipbytes = totalLen - len - oPreviewInfo;
	if (skipbytes > 0) {
		len -= skipbytes;
		vStream.SkipByte(skipbytes);
	}

	var iconlen = 0;
	if ((writePtr.extraFlags & twiConstant.TWI_EF_MORE_EXT_COMMANDS)) {
		iconlen = writePtr.previewInfoByteCount;
	} else {
		var maxIconLengthInPkt = totalLen - oPreviewInfo;
		iconlen = writePtr.previewInfoByteCount > maxIconLengthInPkt ? maxIconLengthInPkt : writePtr.previewInfoByteCount;
	}
	if (iconlen > 0) {
		writePtr.previewBuffer = new Uint8Array(iconlen);
		vStream.ReadBytes(writePtr.previewBuffer, 0, iconlen);
		len -= iconlen;
	}
	return len;

}

function marshallReadTwiExtData(vStream, writePtr, len) {
	writePtr.totalByteCount = vStream.ReadInt32();
	len -= 4;
	return len;
}

function marshallChangeWindowDataInt(vStream, writePtr, len, type) {
	writePtr.hostID = vStream.ReadInt32();
	writePtr.changeMask = vStream.ReadInt32();
	writePtr.extraFlags = vStream.ReadInt16();
	len -= 10;
	if (twiConstant.TWI_CHANGED_STYLE & writePtr.changeMask) {
		writePtr.windowStyle = vStream.ReadInt32();
		len -= 4;
	}
	if (twiConstant.TWI_CHANGED_EXSTYLE & writePtr.changeMask) {
		writePtr.exWindowStyle = vStream.ReadInt32();
		len -= 4;
	}
	if (twiConstant.TWI_CHANGED_RECT & writePtr.changeMask) {
		writePtr.position.left = vStream.ReadInt32();
		writePtr.position.top = vStream.ReadInt32();
		writePtr.position.right = vStream.ReadInt32();
		writePtr.position.bottom = vStream.ReadInt32();
		len -= 16;
	}
	if (twiConstant.TWI_CHANGED_CLIENT_RECT & writePtr.changeMask) {

		writePtr.clientRect.left = vStream.ReadInt32();
		writePtr.clientRect.top = vStream.ReadInt32();
		writePtr.clientRect.right = vStream.ReadInt32();
		writePtr.clientRect.bottom = vStream.ReadInt32();
		len -= 16;
	}
	if (twiConstant.TWI_CHANGED_OWNER & writePtr.changeMask) {

		writePtr.hostOwner = vStream.ReadInt32();
		len -= 4;
	}
	if (twiConstant.TWI_CHANGED_ZORDER & writePtr.changeMask) {
		writePtr.hwndAboveMe = vStream.ReadInt32();
		len -= 4;
	}
	if (twiConstant.TWI_CHANGED_NAME & writePtr.changeMask) {
		if (len > 0) {
			var strData = new Uint8Array(len);
			vStream.ReadBytes(strData, 0, len);
			for (var i = 0; i < len; i++) {
				if (strData[i] === 0) {
					break;
				}
			}
			if (type === twiConstant.CP_UTF8) {
				writePtr.windowName = Convert.ToUTF8FromByteArray(strData, 0, i + 1);
			} else {
				writePtr.windowName = Convert.ToASCIIFromByteArray(strData, 0, i + 1);
			}
			
		}
	}
	return len;
}

function marshallReadTwiWindowRegion(vStream, writePtr, len) {

	writePtr.operation = vStream.ReadInt16();
	writePtr.hostID = vStream.ReadInt32();
	writePtr.cRectangle = vStream.ReadInt32();
	writePtr.oRectangle = vStream.ReadInt32();
	len -= 14;
	writePtr.rectArr = new Array(0);
	for (var i = 0; i < writePtr.cRectangle; ++i) {
		var rect = new TwiRect();
		rect.left = vStream.ReadInt32();
		rect.top = vStream.ReadInt32();
		rect.right = vStream.ReadInt32();
		rect.bottom = vStream.ReadInt32();
		len -= 16;
		writePtr.rectArr[i] = rect;
	}
	return len;
}
