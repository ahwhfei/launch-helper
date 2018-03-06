function Utility() {
}

Utility.getUnicodeStringSize = function(s, extra) {
	return (s.length + extra) * 2;
};
Utility.writeUnicodeString = function(bytes, offset, s, maxLength) {
	var originalOffset = offset;
	var length = Math.min(s.length, maxLength);
	for (var i = 0; i < length; i++, offset += 2) {
		var c = s.charCodeAt(i);
		bytes[offset] = c & 0xff;
		bytes[offset + 1] = (c >>> 8) & 0xff;
	}
	return originalOffset + length * 2;
};
Utility.CopyArray = function(srcArray, srcOffset, desArray, desOffset, length) {
	for (var i = 0; i < length; ++i) {
		desArray[i + desOffset] = srcArray[i + srcOffset];
	}
};
Utility.CopyInSameArray = function(srcArray, srcOffset, desArray, desOffset, length) {
	if (desOffset >= srcOffset) {
		for (var i = length - 1; i >= 0; --i) {
			desArray[i + desOffset] = srcArray[i + srcOffset];
		}

	} else {
		for (var i = 0; i < length; ++i) {
			desArray[i + desOffset] = srcArray[i + srcOffset];
		}
	}
};
// @return port number if found, otherwise 0
Utility.getPort = function(address) {
	if (address === null || address === undefined)
		return null;
	var colonPos = address.lastIndexOf(':');
	if (colonPos >= 0 && colonPos < address.length - 1) {
		var portStr = address.substring(colonPos + 1);
		var tempPort = parseInt(portStr);
		if (tempPort !== NaN) {
			return tempPort;
		}
	}
	return 0;
};

Utility.getAddress = function(address) {
	if (address === null || address === undefined)
		return null;
	var colonPos = address.lastIndexOf(':');
	if (colonPos < 0)
		return address;
	return address.substring(0, colonPos);
};

Utility.isDottedQuad = function(address) {
	if (address === null || address === undefined)
		return false;
	var parts = address.split(".");
	if (parts.length !== 4)
		return false;
	for (var i = 0; i < 4; i++) {
		if (parseInt(parts[i]) > 255)
			return false;
	}
	return true;
};
Utility.isColonOct = function(address) {
	if (address === null || address === undefined)
		return false;
	var parts = address.split(":");
	if (parts.length !== 8)
		return false;
	return true;
};

Utility.parseIpAddress = function (ipaddress, port) {
	var ipbuffer = new Array(20);

	if(port) {
		ipbuffer[0] = (port >> 8) & 0xFF;
		ipbuffer[1] = port & 0xFF;
	}

	var j = 2;
	var iptokens;
	if(/:/g.test(ipaddress) === false) {  //IPV4
		iptokens = ipaddress.split(".");
		for(var i = 0; i < iptokens.length; i++) {
			ipbuffer[j++] = parseInt(iptokens[i]);
		}
	}else { //IPV6
		ipaddress = Utility.getIPVFullAddress(ipaddress);
		var indexOfopenBracket = ipaddress.indexOf("[");
		var indexOfCloseBracket = ipaddress.indexOf("]");
		indexOfopenBracket++;
		if (indexOfCloseBracket === -1) {
			indexOfCloseBracket = ipaddress.length;
		}
		ipaddress = ipaddress.substring(indexOfopenBracket, indexOfCloseBracket);
		iptokens = ipaddress.split(":");

		var intValue;
		for(var i = 0; i < iptokens.length ; i++) {
			intValue = parseInt(iptokens[i], 16);
			ipbuffer[j++] = intValue & 0xff;
			ipbuffer[j++] = (intValue >> 8) & 0xff;
		}
	}
	return ipbuffer;
}
/*
 * This function change ipv6 to full length ipv6 address for
 * ipv4 it do nothing
 * ex-xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx = as it is
 * xxx::xxx = xxxx:0:0:0:0:0:0:xxxx
 */
Utility.getIPVFullAddress = function(address) {
	/*
	 * different type address
	 * xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx
	 * xxx::xxx
	 * [xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx]:Port
	 * [xxx::xxx]:Port
	 */
	if (address) {
		var parts = address.match(/:/g);
		if ((parts !== null) && (parts.length >= 2))//if it is ipv6
		{
			var portPresence = address.match(/\[/g);
			var partialAddress = "";
			var port = "";
			var addressColonPart;
			var noOfZero;
			var zeroString;
			var indexOfopenBracket = address.indexOf("[");
			var indexOfCloseBracket = address.indexOf("]");
			indexOfopenBracket++;
			if (indexOfCloseBracket === -1) {
				indexOfCloseBracket = address.length;
			}
			partialAddress = address.substring(indexOfopenBracket, indexOfCloseBracket);
			//getting address wihtout bracket and port
			partialAddress = partialAddress.replace(/\s/g, '');
			//remove whiltespace
			if (portPresence !== null) {
				var addressPort = address.split("]:");

				if (addressPort.length > 1) {
					port = addressPort[1];
					//if port is present
				}

			}
			var addressParts = partialAddress.split("::");
			//address contain :: instead of consecutive zero
			if (addressParts.length >= 2) {
				if ((addressParts[0] === "") && (addressParts[1] === "")) {
					address = "0:0:0:0:0:0:0:0";
					//contain :: type address
				} else if (addressParts[0] === "")//::XXXX.... type address
				{
					addressColonPart = addressParts[1].split(/:/g);
					noOfZero = 8 - addressColonPart.length;
					zeroString = "";
					for (var i = 0; i < noOfZero; i++) {
						zeroString = zeroString + "0:";
					}
					address = zeroString + addressParts[1];
				} else if (addressParts[1] === "")//....xxxx:: type address
				{
					addressColonPart = addressParts[0].split(/:/g);
					noOfZero = 8 - addressColonPart.length;
					zeroString = "";
					for (var i = 0; i < noOfZero; i++) {
						zeroString = zeroString + ":0";
					}
					address = addressParts[0] + zeroString;
				} else//....xxxx::xxx.. type address
				{
					addressColonPart = addressParts[0].split(/:/g);
					noOfZero = 8 - addressColonPart.length;
					addressColonPart = addressParts[1].split(/:/g);
					noOfZero -= addressColonPart.length;
					zeroString = "";
					for (var i = 0; i < noOfZero; i++) {
						zeroString = zeroString + ":0";
					}
					address = addressParts[0] + zeroString + ":" + addressParts[1];
				}
			}
			else if (addressParts.length == 1) //[xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx]:Port  type address
			{
				address = partialAddress;
			}
			address = "[" + address + "]:" + port;

		}
	}

	return address;
};

Utility.getAddressInfo = function(icaData) {
	var data = {};
	var serverAdd = Utility.getAddress(icaData['Address']);
	var serverPort = Utility.getPort(icaData['Address']);
	if (serverPort == null || serverPort == 0) { serverPort = 1494; }
	var proxyAddress = Utility.getAddress(icaData['ProxyHost']);
	var proxyPort = Utility.getPort(icaData['ProxyHost']);
	var proxyPresent = (proxyAddress != null) ? true : false;
	// This should contain the final connect address immaterial of the server/proxy address
	var connectAddress;				
	var connectPort;
	var isSSLEnabled = false;
	var cgpEnabled = false;
	var securityToken_Present = false;
	var cgpSecurityToken = "";
	var reconnectTimeOut = 3000; // This is default and is applicable for SR reconnects
	var useChromeSock = HTML5Interface.isChromeSocketAvailable();
	var sessionReliabilityTimeout = 180;
	console.log("Using websocket : " + (useChromeSock == false));
	
	// This would enable the proxy port to be set to anything other than the default port specified by ica file.
	var tempstr = icaData['clientPreferences'];
	if (tempstr != undefined) {
		var tokenvalue = tempstr.split(";");
		var len = tokenvalue.length;
		for (var i = 0; i < len; i++) {
			var token = tokenvalue[i].split(":");
			var temp = token[0].replace(/\s/g, "");
			if (temp == "wsPort"){
				proxyPort = token[1].replace(/\s/g, "");
			}

		}
	}
	// Check for SSL proxy if SSL is enabled.
	if (icaData["SSLEnable"] == "On") {
		proxyPort = 443;	// set this to default.
		proxyAddress = Utility.getAddress(icaData["SSLProxyHost"]);
		var tempPort = Utility.getPort(icaData["SSLProxyHost"]);
		if (tempPort != 0) {
			proxyPort = tempPort;
		}
		isSSLEnabled = true;
		proxyPresent = true;
	}
	
	// Use CGP only if enabled on client, else ignore settings
	if (HTML5_CONFIG['transport']['cgpEnabled'] != false) {
		if(icaData["CGPSecurityTicket"] === "On"){
			securityToken_Present = true;
			cgpSecurityToken = serverAdd;
			cgpEnabled = true;
		} else if(icaData["CGPAddress"] != null) { // direct cgp connection
			cgpEnabled = true;
			// Use CGP port only if it is a direct non-ssl chrome socket connection
			if (useChromeSock === true && proxyPresent === false) {
				var tempPort = Utility.getPort(icaData["CGPAddress"]);
				proxyPort = (tempPort != null && tempPort != 0) ? tempPort : 2598;
			}
			// This is a work around until VDA fixes the server side issue.
			// Increase timer in case of direct HTML5->CGP connections or SSL enabled chrome socket
			// reconnectTimeOut = (!useChromeSock || isSSLEnabled) ? 30000 : 3000;
		}
	}
	// proxy/cgp/ssl present
	if (proxyAddress != null) {
		connectAddress = proxyAddress;
	} else {
		connectAddress = serverAdd;
	}
	// regular connection, 8008 default for websocket
	if(proxyPort == null){
		proxyPort = (useChromeSock === true) ? serverPort : 8008;
	}
	connectPort = proxyPort;
		
	// Removed proxy info as that would be redundant and confusing 
	// Use only ConnectAddress or ConnectPort while making connections.
	
	//Reading sessionReliabilityTimeout from icadata
	if(icaData&&icaData['SessionReliabilityTTL']){
		var tempTimeout = parseInt(icaData['SessionReliabilityTTL']);
		if(tempTimeout>0){
			sessionReliabilityTimeout = tempTimeout;
		}
	}
    console.log("Session Reliability Timeout: ", sessionReliabilityTimeout);
	return {
		'isSSLEnabled' : isSSLEnabled,
		'connectAddress' : connectAddress,
		'connectPort' : connectPort,
		'isSecurityTokenPresent' : securityToken_Present,
		'cgpSecurityToken' : cgpSecurityToken,
		'cgpEnabled' : cgpEnabled,
		'reconnectTimeOut' : reconnectTimeOut,
		'useChromeSock' : useChromeSock,
		'proxyPresent' : proxyPresent,
		'sessionReliabilityTime' : sessionReliabilityTimeout
	};
}; 

/*Fetch the Encryption Info if any present in the ICA File*/
Utility.getEncryptionInfo = function(icaData){
    // Secure ICA only for ChromeApp
    if(g.environment.receiver.isChromeApp === true && icaData["EncryptionLevelSession"]){
        return icaData["EncryptionLevelSession"];
    }
    return null;
};


/*Helper function that writes a two byte int to a byte buffer*/

Utility.WriteInt2 = function writeInt2(data, offset, value) {
	data[offset++] = value & 0xFF;
	data[offset++] = (value >>> 8) & 0xFF;
	return offset;
};


/* Helper function that writes a 4 byte int into a byte buffer*/

Utility.WriteInt4 = function writeInt4(data, offset, value) {
	data[offset++] = value & 0xFF;
	data[offset++] = (value >> 8) & 0xFF;
	data[offset++] = (value >> 16) & 0xFF;
	data[offset++] = (value >> 24) & 0xFF;
	return offset;
};

/*Helper function that writes a single byte to a byte buffer*/

Utility.WriteByte = function writeByte(data, offset, value) {
	data[offset++] = value & 0xFF;
	return offset;
};

Utility.makeResolutionEven = function(data){
  if(data.width%2 == 1) data.width--;
  if(data.height%2 == 1) data.height--;
}

Utility.makeBoundsEven = function(display){
  for(var i = 0;i<display.length;i++){
    var db = display[i]['bounds'];
    if(db.left%2 == 1) db.left--;
    if(db.top%2 == 1) db.top--;
    if(db.width%2 == 1) db.width--;
    if(db.height%2 == 1) db.height--;
    var dw = display[i]['workArea'];
    if(dw.left%2 == 1) dw.left--;
    if(dw.top%2 == 1) dw.top--;
    if(dw.width%2 == 1) dw.width--;
    if(dw.height%2 == 1) dw.height--;
  }
}

Utility.convertBoundsToRect = function(data){
  if(data.left<0){
   // data.left = 0;
  }
  if(data.top<0){
   // data.top = 0;
  }
  var temp = {
    left: data.left,
    top: data.top,
    right: data.left+data.width,
    bottom: data.top+data.height
  };
  return temp;
};

Utility.checkIfRectPresentInMonitor = function(rect, monitorBounds){
		 monitorBounds =  Utility.convertBoundsToRect(monitorBounds);
		 //rect = Utility.convertBoundsToRect(rect);
		  if(rect['right'] < monitorBounds['left'] || rect['bottom'] < monitorBounds['top'] || rect['left'] > monitorBounds['right'] || rect['top'] > monitorBounds['bottom']){
        return false;
      }
      else{
        return true;
      }
		}

Utility.getWindowIntersection = function(rect,monitorBounds){
      if(rect['right'] < monitorBounds['left'] || rect['bottom'] < monitorBounds['top'] || rect['left'] > monitorBounds['right'] || rect['top'] > monitorBounds['bottom']){
        return null;
      }
        if(rect['left'] <= monitorBounds['left'] && rect['right'] > monitorBounds['left']){
          rect['left'] = monitorBounds['left'];
        }
        if(rect['top'] <= monitorBounds['top'] && rect['bottom'] > monitorBounds['top']){
          rect['top'] = monitorBounds['top'];
        }
        if(rect['right'] >= monitorBounds['right']){
          rect['right'] = monitorBounds['right'];
        }
        if(rect['bottom'] >= monitorBounds['bottom']){
          rect['bottom'] = monitorBounds['bottom'];
        }
      
      return {
        'left' : rect['left'],
        'top' : rect['top'],
        'width' : rect['right'] - rect['left'],
        'height' : rect['bottom'] - rect['top']
      };
    }

Utility.convertRectToScreenCoordinates = function(rect){
  var displayDetails = UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation ,null);
  var boundary = displayDetails.boundary;
  var currentBounds = {left : 0, top : 0, width : 0, height : 0};
  if(g.environment.receiver.isChromeApp && !g.environment.receiver.isKiosk){
	  currentBounds = chrome.app.window.current()['outerBounds'];
  }
  if(displayDetails.multimonitor == true){
    return {
      'left' : rect['left'] + boundary.left,
      'top' : rect['top'] + boundary.top,
      'width' : rect['width'],
      'height' : rect['height']
    };
  }
  else{
    
    return {
      'left' : rect['left'] + currentBounds.left,
      'top' : rect['top'] + currentBounds.top,
      'width' : rect['width'],
      'height' : rect['height']
    };
  }
  
};

Utility.convertRectToVdaCoordinates = function(rect){
  var displayDetails = UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation ,null);
  var boundary = displayDetails.boundary;
  var currentBounds = {left : 0, top : 0, width : 0, height : 0};
  if(g.environment.receiver.isChromeApp && !g.environment.receiver.isKiosk){
	  currentBounds = chrome.app.window.current()['outerBounds'];
  }
  if(displayDetails.multimonitor == true){
    return {
      'left' : rect['left'] - boundary.left,
      'top' : rect['top'] - boundary.top,
      'width' : rect['width'],
      'height' : rect['height']
    };
  }
  else{
    return {
      'left' : rect['left'] - currentBounds.left,
      'top' : rect['top'] - currentBounds.top,
      'width' : rect['width'],
      'height' : rect['height']
    }
  }
  
};

Utility.convertPointToVdaCoordinates = function(point){
  var displayDetails = UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation ,null);
  var boundary = displayDetails.boundary;
  var currentBounds = {left : 0, top : 0, width : 0, height : 0};
  // outerbounds value is rquired only for chrome app seamless app session
  if(g.environment.receiver.isChromeApp && g.environment.receiver.seamlessMode && !g.environment.receiver.isKiosk){
	  currentBounds = chrome.app.window.current()['outerBounds'];
  }
  if(displayDetails.multimonitor == true){
    return {
      'X' : point.X - boundary.left,
      'Y' : point.Y - boundary.top
    };
  }
  else{
    return {
      'X' : point.X - currentBounds.left,
      'Y' : point.Y - currentBounds.top
    };
  }
};

Utility.convertValueRelativeToWindow = function(data,monitorInfo){
  return {
    'left' : data['left'] - monitorInfo['left'],
    'top' : data['top'] - monitorInfo['top'],
    'height' : data['height'],
    'width' : data['width']
  };
};

Utility.SplitLongInt = function(longNumber) {
	return {
		hiBits : Math.floor(longNumber / 4294967296),
		loBits : (longNumber & 0xffffffff) >>> 0
	};
};

Utility.GetFileTransferConfig = function() {
	var fileTransferUploadSizeLimit = 2*1024*1024*1024;
	var fileTransferDownloadSizeLimit = 2*1024*1024*1024;
	var allowFileUpload = false;
	var allowFileDownload = false;
	var fileTransferAllowed = false;

	if(HTML5_CONFIG['features']&&HTML5_CONFIG['features']['filetransfer']&&(typeof HTML5_CONFIG['features']['filetransfer']['maxuploadsize'] !== "undefined")){
		fileTransferUploadSizeLimit = HTML5_CONFIG['features']['filetransfer']['maxuploadsize'];
	}
	if(HTML5_CONFIG['features']&&HTML5_CONFIG['features']['filetransfer']&&(typeof HTML5_CONFIG['features']['filetransfer']['maxdownloadsize'] !== "undefined")){
		fileTransferDownloadSizeLimit = HTML5_CONFIG['features']['filetransfer']['maxdownloadsize'];
	}
	if(HTML5_CONFIG['features']&&HTML5_CONFIG['features']['filetransfer']&&(HTML5_CONFIG['features']['filetransfer']['allowupload']===true)){
		allowFileUpload = true;
	}
	if(HTML5_CONFIG['features']&&HTML5_CONFIG['features']['filetransfer']&&(HTML5_CONFIG['features']['filetransfer']['allowdownload']===true)){
		allowFileDownload = true;
	}
	if(HTML5_CONFIG['ui'] && HTML5_CONFIG['ui']['toolbar'] && (HTML5_CONFIG['ui']['toolbar']['fileTransfer'] === true)){
		fileTransferAllowed = true;
	}
	return {
		'fileTransferUploadSizeLimit' : fileTransferUploadSizeLimit,
		'fileTransferDownloadSizeLimit' : fileTransferDownloadSizeLimit,
		'allowFileUpload' : allowFileUpload,
		'allowFileDownload' : allowFileDownload,
		'fileTransferAllowed' : fileTransferAllowed
	};
};

Utility.isFileDownloadAvailable = function() {
    // Filedownload is not available in Safari on Ipad amd Mac and Windows phone, Continuum device
    return (!g.environment.os.isWindowsPhone && !g.environment.browser.isSafari && !g.environment.os.isWindowsContinuum);
};

// TODO: Move
Utility.setCtxWrapper = function setCtxWrapper(wrapper) {
    Utility.ctxWrapper = wrapper;
};

Utility.getCtxWrapper = function getCtxWrapper() {
    return Utility.ctxWrapper;
};

/**
 * @function getWrapperId 
 * @param {String} streamName
 * @returns {Number} Wrapper Id for the given stream
 */
Utility.getWrapperId = function getWrapperId(streamName) {
    // For now using only for multimedia wrapper
    var wrapperId;
    switch(streamName) {
        case 'CTXMM  ': 
            wrapperId = DRIVERID.ID_MULTIMEDIA;
            break;       
        
        case 'CTXTW  ':
            wrapperId = DRIVERID.ID_THINWIRE;
            break;
    }
    return wrapperId;
};
        //Adding a mapping between languages supported currently by html5/chrome receiver and the corresponding keyboard layout
		//Initially check if keyboard layout is set in default.ica and use it
		//else based on locale set by user it will pick the corresponding keyboard layout and set it at server side to interpret the client keyboard
		
		
		//We support languages which are supported on VDA side http://wwwcode.eng.citrite.net/source/xref/ICAPE-Arthur/src/ica/HostCore/Stack/wd/kbddata/headers/xref.txt
		//The codes are taken from https://msdn.microsoft.com/en-us/goglobal/bb895996.aspx
		
		
		
Utility.getKbdLayout= function(lang){
	CEIP.add('keyboard:layout',lang);
 var kbdLayouts = {
	 
	 'en':1033,//00000409 - US 104 Keyboard
     'ja':1041,// 00000411 - Japanese without IME
	 'ja-jp':1041,
     'ja':1041,// E0010411 - Japanese with IME
     'ko':1042,// E0010412 - Korean layout with IME
	 'ko-kr':1042,
     'fr':1036 ,// 0000040C - French
	 'fr-fr':1036 , //same as 'fr'
	 'fr-lu':1036, //French Luxembourg is mapped to French
	 'fr-mc':1036, //French Monaco is mapped to French
     'de':1031,// 00000407 - German
	 'de-de':1031, //same as 'de'
	 'de-at':1031, // German Austrian is mapped to German
	 'de-li':1031, //German Lechiesten is mapped to German
	 'de-lu':1031, //German Luxembourg is mapped to German
     'es':1034,// 0000040A - Spanish
     'bg':1026, // 00000402 - Bulgarian
	 'bg-bg':1026,
     'sv':1053, // 0000041D - Swedish
	 'sv-se':1053, //same as swedish
	 'sv-fi':1053,  //Swedish Finland is mapped to swedish
     'cs':1029,// 00000405 - Czech
	 'cs-cz':1029,
     'da':1030,// 00000406 - Danish
	 'da-dk':1030,
     'en-gb':2057,// 00000809 - British
     'fr-ch':4108,// 0000100C - Swiss French
     'sv':1053,// 0000041D - Swedish, same as Finnish
     'fi':1035,// 0000040B - Finnish, same as Swedish
	 'fi-fi':1035,
     'hu':1038,// 0000040E - Hungarian, similar to Czech
	 'hu-hu':1038,
     'it':1040,// 00000410 - Italian
	 'it-it':1040, //same as 'it'
	 'it-ch':1040, //Italian switzerland is mapepd to Italian
     'el':1032,// 00000408 - Greek
	 'el-gr':1032,
     'nl':132105,// 00000413 - Dutch
	 'nl-nl':132105,
     'pt-br':1046,// 00000416 - Brazilian ABNT
     // 00010415 - Polish (214)
     'ro':1048,// 00000418 - Romanian
	 'ro-md':1048,
	 'ro-ro':1048,
     'ru':1049,// 00000419 - Russian
	 'ru-ru':1049,
	 'ru-md':1049,
     'hr':1050,// 0000041A - Croatian
	 'hr-hr':1050,
     'sk':1051,// 0000041B - Slovak
	 'sk-sk':1051,
     'tr':1055,// 0000041F - Turquish - Q
	 'tr-tr':1055,
     'de-ch':2055,// 00000807 - Swiss German
     'es-mx':2058,// 0000080A - Latin American
	 'es-419':2058,//same as latin american
	 'es-gt':2058, //spanish Guatamela is mapped to Latin American
	 'es-cr':2058,  //spanish costarica is mapped to Latin American
	 'es-pa':2058,  //spanish panama is mapped to Latin American
	 'es-do':2058,  //spanish dominician republic is mapped to latin american
	 'es-co':2058 , //spanish colombian is mapped to latin american
	 'es-pe':2058,  //spanish peru is mapped to latin american
	 'es-ve':2058,  //spanish venezuala is mapped to latin american
	 'es-ar':2058,   //spanish Argentina is mapped to latin american
	 'es-bo':2058,  //spanish Bolivia is mapped to latin american
	 'es-cl':2058,  //spanish Chile is mapped to latin american
	 'es-ec':2058,  //spanish Ecudaor is mapped to latin american
	 'es-sv':2058,  //spanish El salvadaor is mapped to latin american
	 'es-pr':2058,   //spanish puerto rico is mapped to latin american
	 'es-py':2058,   //spanish  paraguay is mapped to latin american
	 'es-uy':2058,   //spanish  uruguay is mapped to latin american
	 'es-ni':2058,   //spanish nicargua is mapped to latin american
	 'es-hn':2058,  //spanish honduras is mapped to latin american
	 'es-es':1034,	//Spanish - Spain (Traditional)
     'fr-be':2060,// 0000080C - Belgian
     'pt':2070,// 00000816 - Portuguese
	 'pt-pt':2070,
     'fr-ca':3084, // 00000C0C - French Canadian
     'uk':1058,// 00000422 - Ukrainian
	 'uk-ua':1058,
     'be':1059, // 00000423 - Byelorussian
	 'be-by':1059, 
     'sl':1060, // 00000424 - Slovenian, same as Croatian
	 'sl-si':1060,
     'et':1061, // 00000425 - Estonian
	 'et-ee':1061,
     'lv':1062, // 00000426 - Latvian
	 'lv-lv':1062,
     // 00010C0C - Canadian French Multilingual
     'en-ie':6153,// 00001809 - Irish
	 'ga-ie':6153,
	 'ga':6153, //same as 'en-ie'
     // 00010405 - Czech - QWERTY
     // 00010409 - US - Dvorak
     // 0001041B - Slovak - QWERTY
     // 0001041F - Turquish - F
     'sr-sp':2074,// 00010C1A - Serbian - Latin
	 'sr':2074,
	 'sr-latn-cs':2074,
	 'sr-latn-rs':2074,
	 'sr-ba':2074,
     // 00020409 - US - International
     'pl':1045,// 00000415 - Polish (Programmer)
	 'pl-pl':1045,
     'nl-be':2067,// 00000813 - Belgian Dutch
     'is':1039,// 0000040F - Icelandic
	 'is-is':1039,
     'no-no':1044,// 00000414 - Norwegian
	 'no':1044, //same as norwegian
	 'nb':1044, // Norwegian (Bokmal) is mapped to Norwegian
	 'nb-no':1044,
	 'nn':1044, //Norwegian (Nynorsk) is mapped to Norwegian
	 'nn-no':1044,
     'en-ca':4105// 00001009 - Canadian English (Multiligual)
     // 00010407 - German (IBM)
     // 0001040A - Spanish variation
     // 00010410 - Italian (142)
     // 00030409 - US - Dvorak left hand
     // 00040409 - US - Dvorak right hand
     // 00050408 - Greek Latin
     // 00010416 - Brazilian ABNT2
	 
	 
	 };
	 
	 if(kbdLayouts[lang]){
		return kbdLayouts[lang];
	 }
	 else
	 {
		return 0;
	 }
};

Utility.isWorkerEnabled = function() {
	if ((HTML5_CONFIG['other']['workerdisable'] == true) || ( typeof Worker == 'undefined')) {
        return false;
	}
    return true;
};


Utility.copyJson = function(target , source){
	if(target == null){
		target = { };
	}
	
	function changeAtrribute(key, output, input) {
		if (input.hasOwnProperty(key)) {
			if (!output[key]) {
				if ( typeof input[key] === 'Object' || typeof  input[key] === 'object') {
					output[key] = { };
					Utility.copyJson(output[key] ,input[key] );
				} else {
					output[key] = input[key];
				}
				return;
			}
			var value = input[key];
			var len = 0;
			if ( typeof value === 'Object' || typeof value === 'object') {
				for (var key1 in value) {
					if (value.hasOwnProperty(key1)) {
						changeAtrribute(key1, output[key], value);
						len++;
					}
				}
			}

			if (len === 0) {
				output[key] = input[key];
			}
		}
	}
	
	for (var key in source) {
		if (source.hasOwnProperty(key)) {
			changeAtrribute(key, target, source);
		}
    }
	
	return target;
};

