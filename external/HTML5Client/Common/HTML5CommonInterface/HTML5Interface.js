// This file contains wrappers for HTML5 APIs.
function HTML5Interface() {

}


HTML5Interface.platformInfo = {
	getReceiverType : function() {
		if ( typeof window != 'undefined' && window && window.chrome && window.chrome.app && window.chrome.app.window) {
			return HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER;
		} else if ( typeof window != 'undefined') {
			return HTML5Interface.platformInfo.RECEIVER.HTML5_RECEIVER;
		} else {
			return HTML5Interface.platformInfo.RECEIVER.UNRECOGNISED;
		}
	},
	checkAPISupport : function(apiId, receiver) {
		var rvalue = false;
		if (receiver != null && receiver != HTML5Interface.platformInfo.getReceiverType()) {
			return false;
		}
		if (receiver == null) {
			receiver = HTML5Interface.platformInfo.getReceiverType();
		}
		switch(apiId) {
		case HTML5Interface.platformInfo.APIIDENTIFIER.NATIVESOCKET:
			if (receiver == HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) {
				if (chrome.socket && chrome.socket.secure) {
					rvalue = true;
				}
			}
			break;
		case  HTML5Interface.platformInfo.APIIDENTIFIER.DEVICE_ATTRIBUTE:
			if (receiver == HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) {
				if (window.chrome.enterprise && window.chrome.enterprise.deviceAttributes) {
					rvalue = true;
				}
			}
			break;
		case  HTML5Interface.platformInfo.APIIDENTIFIER.NETWORKLIST :
			if (receiver == HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) {
				if (window.chrome.system) {
					rvalue = true;
				}
			}
			break;
		case HTML5Interface.platformInfo.APIIDENTIFIER.RECEIVERTYPE :
			if (receiver == HTML5Interface.platformInfo.getReceiverType()) {
				rvalue = true;
			}
			break;
		case HTML5Interface.platformInfo.APIIDENTIFIER.USB :
			if (receiver == HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) {
				if (window.chrome.usb) {
					rvalue = true;
				}
			}
			break;
		case HTML5Interface.platformInfo.APIIDENTIFIER.NOTIFICATION :
			if (receiver == HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) {
				if (window.chrome.notifications) {
					rvalue = true;
				}
			}
			break;
		}

		return rvalue;
	},
	RECEIVER : {
		UNRECOGNISED : 0,
		CHROME_RECEIVER : 1,
		HTML5_RECEIVER : 2,
	},
	APIIDENTIFIER : {
		NATIVESOCKET : 0,
		RECEIVERTYPE : 2,
		DEVICE_ATTRIBUTE : 3,
		NETWORKLIST : 4,
		USB : 5,
		NOTIFICATION : 6
	}
}; 



// Timestamp
HTML5Interface.timeStamp = function() {
	var timestamp;
    timestamp = Date.now.bind(Date);
	return timestamp;
};
HTML5Interface.isKiosk = function(){
	return (window.parent && (window.parent.isKioskMode=== true)) || window["appViewMode"];
};

HTML5Interface.isChromeApp = function(){
	if(HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.RECEIVERTYPE, HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) == true){
		return true;
	}
	return false;
};
//TimeTicks
HTML5Interface.getTimeTicks = function() {
	var timestamp;
    try{
		timestamp = performance.now.bind(performance);
	}catch(error){
		timestamp = Date.now.bind(Date);		
	}
	return timestamp;
};


HTML5Interface.getClientInfo = function(launchSession) {
    
    // Chaining the callbacks. TODO: Find a better way to chain each async call and call final version.
	var ceipCallback = function(result){
		if(HTML5Interface.isChromeApp()){
			chrome.runtime.getBackgroundPage(function (bp){
				result['CEIP'] = bp._CEIP;
				launchSession(result);
			});
		}else{
			result['CEIP'] = CEIPObj;
			launchSession(result);
		}
	}
	
	var finalCallback = function(result){
        if(HTML5Interface.isChromeApp()){
        chrome.system.display['getInfo'](function(displayInfo){
          result['displayInfo']= displayInfo;
          ceipCallback(result);
        })
      }else{
        ceipCallback(result);
      }
    }
    
    
    var callback = function getPlatformInfo(result) {
        if (HTML5Interface.isChromeApp()) {
            chrome.runtime["getPlatformInfo"](function(info){
                PlatformInfo["arch"] = info["arch"]; 
                finalCallback(result);
            });
        } else {
            finalCallback(result);
        }
    };

	// Use random number to generate 15 char clientname
	var generateClientNameRandom = function()
	{
		 function addLeadingZeros (n) {
		 
			var str = n.toString ();
			if (1 == str.length) {
				str = '000' + str;
			}
			else if (2 == str.length) {
				str = '00' + str;
			}
			else if (3 == str.length) {
				str = '0' + str;
			}
			return str;
		}
		
		var d = new Date ();
		var r1 = (d.getTime() % 10000);
		var r2 = (Math.floor((Math.random()*10000)) % 10000);
		return 'HTML-' + addLeadingZeros (r1) + '-' + addLeadingZeros (r2);
	};
		
    // converts GUID to 16 alphanumeric or hiphen char clientname and prefixes
	var generateClientNameEnterprise =function (deviceId) {
        var table = "abcdefghijklmnopqrstuvwxyz1234567890-";
		var res = (HTML5_CONFIG["uniqueID"] && HTML5_CONFIG["uniqueID"]["prefixKey"])? HTML5_CONFIG["uniqueID"]["prefixKey"] : "";
		var tempStr = "";
		// skipping characters other than alphaNumeric 
		for(var i = 0; i < res.length; i++){
			var code = res.charCodeAt(i);
			if ((code > 47 && code < 58) || (code > 64 && code < 91) || (code > 96 && code < 123)){
				tempStr += res.charAt(i);
			}
		}
		res = tempStr;
		// maximum allowed prefix length is 3, so read first 3 characters
		if(tempStr.length > 3){
			res = tempStr.substring(0, 3);
		}
        var i=0;
        do{
            if(deviceId[i]!='-')
            {
                // convert hexadecimal byte to alphanumeric range
                var tempId = parseInt(deviceId.substring(i,i+2), 16);
                tempId = tempId % table.length;
                res += table[tempId];
                i= i+2;
            }
            else 
            {
                i++; // skip hiphen
            }
        } while(i<deviceId.length);
        var restrictNameLength = (HTML5_CONFIG["uniqueID"] && HTML5_CONFIG["uniqueID"]["restrictNameLength"] !== undefined) ? HTML5_CONFIG["uniqueID"]["restrictNameLength"] : false;
        if (restrictNameLength === true && res.length > 15) {
            res = res.substring(0, 15);
        }
        return res;
	};
	
	
	var getLanguage = function(callback){
	
		var lang = null;
		var langCode = 0;
				
		if(HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.RECEIVERTYPE, HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) == true && chrome.i18n.getAcceptLanguages)
		{			
			
			chrome.i18n.getAcceptLanguages(function(LanguageList){
			
				for(var i=0;(i<LanguageList.length)&&(langCode===0);i++)
				{
					lang = LanguageList[i];
					lang = lang.toLowerCase();
					langCode = Utility.getKbdLayout(lang);
				}
				
				if(langCode===0)
				{
					langCode = Utility.getKbdLayout('en'); // setting it to 'en'		
				}
				CEIP.add("keyboard:layout",lang);
				callback(langCode);
			});
		}else{
			var langs = navigator.languages;
			
			if(langs === null||langs===undefined||langs.length == 0)
			{
				lang = navigator.language;
				if(lang===null||(navigator.browserLanguage))     //In the case of IE both we go ahead with navigator.browserlanguage, in other browsers navigator.browserlanguage is null
				{
					lang= navigator.browserLanguage;
				}
				lang = lang.toLowerCase();
				langCode = Utility.getKbdLayout(lang);
			}
			else
			{
				for(var i=0;(i<langs.length)&&(langCode===0);i++)
				{
					lang = langs[i];
					lang = lang.toLowerCase();
					langCode = Utility.getKbdLayout(lang);
				}
			}
			
			if(langCode===0)
			{
					langCode = Utility.getKbdLayout('en');
			}
			CEIP.add("keyboard:layout",lang);
			callback(langCode);
		}
	};
	// Use random 32-bit number
	var generateSerialNumberRandom = function(){
			return Math.floor(Math.random() * (0xFFFFFFFF));
	};
	
	// Use CRC32 of deviceId
	var generateSerialNumberEnterprise= function (deviceId) {

			var CRC32=function(str){

			var CRCTable=[0x00000000,0x77073096,0xEE0E612C,0x990951BA,0x076DC419,0x706AF48F,0xE963A535,0x9E6495A3,0x0EDB8832,0x79DCB8A4,0xE0D5E91E,0x97D2D988,0x09B64C2B,0x7EB17CBD,0xE7B82D07,0x90BF1D91,0x1DB71064,0x6AB020F2,0xF3B97148,0x84BE41DE,0x1ADAD47D,0x6DDDE4EB,0xF4D4B551,0x83D385C7,0x136C9856,0x646BA8C0,0xFD62F97A,0x8A65C9EC,0x14015C4F,0x63066CD9,0xFA0F3D63,0x8D080DF5,0x3B6E20C8,0x4C69105E,0xD56041E4,0xA2677172,0x3C03E4D1,0x4B04D447,0xD20D85FD,0xA50AB56B,0x35B5A8FA,0x42B2986C,0xDBBBC9D6,0xACBCF940,0x32D86CE3,0x45DF5C75,0xDCD60DCF,0xABD13D59,0x26D930AC,0x51DE003A,0xC8D75180,0xBFD06116,0x21B4F4B5,0x56B3C423,0xCFBA9599,0xB8BDA50F,0x2802B89E,0x5F058808,0xC60CD9B2,0xB10BE924,0x2F6F7C87,0x58684C11,0xC1611DAB,0xB6662D3D,0x76DC4190,0x01DB7106,0x98D220BC,0xEFD5102A,0x71B18589,0x06B6B51F,0x9FBFE4A5,0xE8B8D433,0x7807C9A2,0x0F00F934,0x9609A88E,0xE10E9818,0x7F6A0DBB,0x086D3D2D,0x91646C97,0xE6635C01,0x6B6B51F4,0x1C6C6162,0x856530D8,0xF262004E,0x6C0695ED,0x1B01A57B,0x8208F4C1,0xF50FC457,0x65B0D9C6,0x12B7E950,0x8BBEB8EA,0xFCB9887C,0x62DD1DDF,0x15DA2D49,0x8CD37CF3,0xFBD44C65,0x4DB26158,0x3AB551CE,0xA3BC0074,0xD4BB30E2,0x4ADFA541,0x3DD895D7,0xA4D1C46D,0xD3D6F4FB,0x4369E96A,0x346ED9FC,0xAD678846,0xDA60B8D0,0x44042D73,0x33031DE5,0xAA0A4C5F,0xDD0D7CC9,0x5005713C,0x270241AA,0xBE0B1010,0xC90C2086,0x5768B525,0x206F85B3,0xB966D409,0xCE61E49F,0x5EDEF90E,0x29D9C998,0xB0D09822,0xC7D7A8B4,0x59B33D17,0x2EB40D81,0xB7BD5C3B,0xC0BA6CAD,0xEDB88320,0x9ABFB3B6,0x03B6E20C,0x74B1D29A,0xEAD54739,0x9DD277AF,0x04DB2615,0x73DC1683,0xE3630B12,0x94643B84,0x0D6D6A3E,0x7A6A5AA8,0xE40ECF0B,0x9309FF9D,0x0A00AE27,0x7D079EB1,0xF00F9344,0x8708A3D2,0x1E01F268,0x6906C2FE,0xF762575D,0x806567CB,0x196C3671,0x6E6B06E7,0xFED41B76,0x89D32BE0,0x10DA7A5A,0x67DD4ACC,0xF9B9DF6F,0x8EBEEFF9,0x17B7BE43,0x60B08ED5,0xD6D6A3E8,0xA1D1937E,0x38D8C2C4,0x4FDFF252,0xD1BB67F1,0xA6BC5767,0x3FB506DD,0x48B2364B,0xD80D2BDA,0xAF0A1B4C,0x36034AF6,0x41047A60,0xDF60EFC3,0xA867DF55,0x316E8EEF,0x4669BE79,0xCB61B38C,0xBC66831A,0x256FD2A0,0x5268E236,0xCC0C7795,0xBB0B4703,0x220216B9,0x5505262F,0xC5BA3BBE,0xB2BD0B28,0x2BB45A92,0x5CB36A04,0xC2D7FFA7,0xB5D0CF31,0x2CD99E8B,0x5BDEAE1D,0x9B64C2B0,0xEC63F226,0x756AA39C,0x026D930A,0x9C0906A9,0xEB0E363F,0x72076785,0x05005713,0x95BF4A82,0xE2B87A14,0x7BB12BAE,0x0CB61B38,0x92D28E9B,0xE5D5BE0D,0x7CDCEFB7,0x0BDBDF21,0x86D3D2D4,0xF1D4E242,0x68DDB3F8,0x1FDA836E,0x81BE16CD,0xF6B9265B,0x6FB077E1,0x18B74777,0x88085AE6,0xFF0F6A70,0x66063BCA,0x11010B5C,0x8F659EFF,0xF862AE69,0x616BFFD3,0x166CCF45,0xA00AE278,0xD70DD2EE,0x4E048354,0x3903B3C2,0xA7672661,0xD06016F7,0x4969474D,0x3E6E77DB,0xAED16A4A,0xD9D65ADC,0x40DF0B66,0x37D83BF0,0xA9BCAE53,0xDEBB9EC5,0x47B2CF7F,0x30B5FFE9,0xBDBDF21C,0xCABAC28A,0x53B39330,0x24B4A3A6,0xBAD03605,0xCDD70693,0x54DE5729,0x23D967BF,0xB3667A2E,0xC4614AB8,0x5D681B02,0x2A6F2B94,0xB40BBE37,0xC30C8EA1,0x5A05DF1B,0x2D02EF8D];

				var len=str.length;
				var r=0xffffffff;
				for(var i=0;i<len;i++){
					r=(r>>8)^CRCTable[str[i]^(r&0x000000FF)];
				}
				
				 var res = new Uint32Array(1);
				res[0] = ~r;
				return res[0];
			};
			
			return CRC32(deviceId);
			
		};
	
    // Check if localStorage has value, otherwise generate one and set it.
    var localClientInfo = function() {
        HTML5Engine.localStorage.getItem(['ClientName','SerialNumber','defaultResolutionSetting','showAutoPopupKbdButton','appSwitcher','useAllMyMonitors','ceipEnabled'], function(result) {
            if (!result || !result['ClientName'] || !result['SerialNumber']) {
				if(!result){
					result = {};
				}
                result['ClientName'] = generateClientNameRandom();
                HTML5Engine.localStorage.setItem('ClientName',result['ClientName']);
                result['SerialNumber'] = generateSerialNumberRandom();
                HTML5Engine.localStorage.setItem('SerialNumber',result['SerialNumber']);
			}
           
            getLanguage(function(langId){
				result['KbdLayout'] = langId;
                callback(result);
			});
        });
    };
    
	// check if api is available then use it.
	
	if (HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.DEVICE_ATTRIBUTE, HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) == true) {
	
		// get the deviceId async, then use sync funcs.
		chrome.enterprise.deviceAttributes.getDirectoryDeviceId(function(deviceId) {
            if (deviceId) {
                var res = {};
			res['ClientName'] = generateClientNameEnterprise(deviceId);
			res['SerialNumber'] = generateSerialNumberEnterprise(deviceId);
			getLanguage(function(langId){
				res['KbdLayout']= langId;
				callback(res);
			});
            } else {
                localClientInfo();
            }
		});
	}else {		
		localClientInfo();
	}
};

HTML5Interface.createWebWindow = function(url, callbacks, createWindowOptions){
	   var win = window.open(url, createWindowOptions.name);
	   var appWindow = {contentWindow : win};  
      if(callbacks.onCreate){
             callbacks.onCreate(appWindow);
      }
   
};
HTML5Interface.chromeWindow = function(url, callbacks, createWindowOptions){
	  	var options = { };
			if(createWindowOptions.frame){
				options['frame'] = createWindowOptions.frame;
			}
			if(createWindowOptions.id){
				options['id'] = createWindowOptions.id;
			}
			if(createWindowOptions.state){
				options['state'] = createWindowOptions.state;
			}		
			if(createWindowOptions.showInShelf){
				options['showInShelf'] = createWindowOptions.showInShelf;
			}
			if(createWindowOptions.icon){
				options['icon'] = createWindowOptions.icon;
			}
			/*if(createWindowOptions.title){
				options['title'] = createWindowOptions.title;
			}*/
			if( typeof(createWindowOptions.left) !== 'undefined' || typeof(createWindowOptions.top) !== 'undefined' || typeof(createWindowOptions.width) !== 'undefined' || typeof(createWindowOptions.height) !== 'undefined'){
				
				options['outerBounds'] = { };
				if(typeof(createWindowOptions.left) !== 'undefined'){
					options['outerBounds']['left'] = createWindowOptions.left;
				}
				if(typeof(createWindowOptions.top) !== 'undefined'){
					options['outerBounds']['top'] = createWindowOptions.top;
				}
				if(typeof(createWindowOptions.width) !== 'undefined'){
					options['outerBounds']['width'] = createWindowOptions.width;
				}
				if(typeof(createWindowOptions.height) !== 'undefined'){
					options['outerBounds']['height'] = createWindowOptions.height;
				}
				if(createWindowOptions.minWidth){
				    options['outerBounds']['minWidth'] = createWindowOptions.minWidth;
    			}
    			if(createWindowOptions.minHeight){
    				options['outerBounds']['minHeight'] = createWindowOptions.minHeight;
    			}
			}
			console.log(createWindowOptions);
			console.log(options);
            chrome.app.window.create(
                url,
                options,
                function (createdWindow) {
                  
                  if (createWindowOptions.shapeRects) {
                    createdWindow.setShape({'rects': createWindowOptions.shapeRects});
                  }
                  
                	if(callbacks.onCreate){
                    	callbacks.onCreate(createdWindow);
                     }
					 var uiWidth = createWindowOptions.uiWidth;
					var uiHeight = createWindowOptions.height;
					
                    if(callbacks.onDOMContentLoaded)
	                    createdWindow.contentWindow.addEventListener('DOMContentLoaded', function( ){
							/*Closes the window , button added during seamless app launch to citrixuiElement*/
							if(createWindowOptions.isSeamless){
								var closeBtn = document.createElement("span");
								closeBtn.id = "connectionCloseBtn";
								/*To align to the right top corner of connecting dialog*/
								var connectingDialogWidth = 342 , connectingDialogHeight = 142, iconCloseWidth = 17;
								
								closeBtn.style.left = (uiWidth/2 + connectingDialogWidth/2) - iconCloseWidth-8 + "px"; 
								closeBtn.style.top = (uiHeight/2 -connectingDialogHeight/2) + 10 + "px";							
								closeBtn.addEventListener("click",function(e){
									createdWindow.close();
								});
								var citrixuiElement = createdWindow.contentWindow.document.getElementById("citrixuiElement");
								if(citrixuiElement){
									citrixuiElement.appendChild(closeBtn);
								}
							}
	                    	callbacks.onDOMContentLoaded(createdWindow);
	                    }, false);
                });
   
};

HTML5Interface.iFrameWindow = function(url, callbacks, createWindowOptions){

	var iFrame = document.createElement("iframe");
	if(createWindowOptions.id){
		iFrame.id = createWindowOptions.id;
	}			
	iFrame.src = url;
	iFrame.addEventListener('load',function(e){
		if(callbacks.onDOMContentLoaded){
			callbacks.onDOMContentLoaded(iFrame);
		}
	});
	var parentEle;
	if((!createWindowOptions.customWindow ) || (createWindowOptions.customWindow && createWindowOptions.customWindow.containerID == '__body__')){
		parentEle = document.body;
	}else{
		parentEle = document.getElementById(createWindowOptions.customWindow.elementId);
	}
	if(parentEle){
		parentEle.appendChild(iFrame);
	}else{
		if(callbacks.onError){
			callbacks.onError("Invalid containerID");
		}
	}
	if(callbacks.onCreate){
        callbacks.onCreate(iFrame);
    }	
};

HTML5Interface.webviewWindow  = function(url, callbacks, createWindowOptions){
  console.log(createWindowOptions);
  console.log(callbacks);
  var webViewElement1 = document.createElement("webview");
  webViewElement1.tabIndex = "0";
  if(createWindowOptions.id){
		webViewElement1.id = createWindowOptions.id;
  }	
  webViewElement1["partition"] = "persist:Rfweb";
  webViewElement1.request.onCompleted.addListener(function(e) {
		if (e.type === "main_frame") {
			if (e['statusCode'] == 200) {
			}
		}
	}, {
		urls : ["<all_urls>"]
	});
	webViewElement1.request.onErrorOccurred.addListener(function(e) {
		if (e.type === "main_frame") {
			if (e['statusCode'] == 200) {
			}
		}
	}, {
		urls : ["<all_urls>"]
	});
	webViewElement1.addEventListener('newwindow', function(e) {
		var url = e["targetUrl"];
		e.preventDefault();
		console.log(url);
		createWindowOptions.id = Math.random( ) + "";
   		if (url && url !== 'about:blank') {
				HTML5Interface.createWindow(url ,{onCreate : function(appWindow){
					 e.window.attach(appWindow);
				},onDOMContentLoaded:function(appWindow){
					if(createWindowOptions.onNewWindowLoad){
						createWindowOptions.onNewWindowLoad(appWindow);
					}
				} }, createWindowOptions);
		}
		
    });
    webViewElement1.addEventListener('contentload', function() {
    console.log("webview created");
	   if(callbacks.onDOMContentLoaded){
		   callbacks.onDOMContentLoaded(webViewElement1);
	   }
	});
    if((!createWindowOptions.customWindow ) || (createWindowOptions.customWindow && createWindowOptions.customWindow.containerID == '__body__')){
		parentEle = document.body;
	}else{
		parentEle = document.getElementById(createWindowOptions.customWindow.elementId);
	}
	if(parentEle){
		parentEle.appendChild(webViewElement1);
	}
	if(callbacks.onCreate){
             callbacks.onCreate(webViewElement1);
     }
     webViewElement1.src = url;
     webViewElement1.style.left = '0px';
     webViewElement1.style.top = '0px';
     webViewElement1.style.width = window.outerWidth + 'px';
     webViewElement1.style.height = window.outerHeight + 'px';
     webViewElement1.style.position = 'absolute';
};
/*
 * same as chrome.app.window + 
 * name as per window.open spec
 * customWindow{type , elementId} iframe ,webView , sperateWindow
 * 
 */

HTML5Interface.createWindow = function (url, callbacks, createWindowOptions) {
	   var created = false;
	   if(!createWindowOptions)
	    createWindowOptions = {};
	   if(HTML5Interface.isKiosk( ) == true){
	   		if(!createWindowOptions.customWindow){
					createWindowOptions.customWindow = {};
				
			}
			createWindowOptions.customWindow.type = 'iFrame';
	   		if(!createWindowOptions.customWindow.containerID){
	   			createWindowOptions.customWindow.containerID = '__body__';
	   		} 
			createWindowOptions.fallbackWindow = false;
	   }
	   if(createWindowOptions.customWindow && createWindowOptions.customWindow.type != 'nativeWindow'){
	   		if(createWindowOptions.customWindow.type == 'iFrame'){
	   			HTML5Interface.iFrameWindow(url, callbacks, createWindowOptions);
	   			created = true;
	   		}
	   		if(createWindowOptions.customWindow.type == 'webview'){
	   			HTML5Interface.webviewWindow(url, callbacks, createWindowOptions);
	   			created = true;
	   		}
	   }
	   if(created == false && createWindowOptions.fallbackWindow != false){
		     if (HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.RECEIVERTYPE, HTML5Interface.platformInfo.RECEIVER.HTML5_RECEIVER)) {
		           	HTML5Interface.createWebWindow(url, callbacks, createWindowOptions); 
		           	created = true;
		         } else if (HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.RECEIVERTYPE, HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER)) {
					HTML5Interface.chromeWindow(url, callbacks, createWindowOptions);
					created = true;
		      }
	      
	   }
 	return created;
};
HTML5Interface.launchSessionWindow = function(url, callbacks, createWindowOptions ,icaData){
	
	// Launch session on same monitor as Receiver in case of Chrome.
	if(!HTML5Interface.isKiosk() && HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.RECEIVERTYPE, HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) == true){
		var appwindows = chrome.app.window.getAll();
		var rfAppWindow, outerBounds;
  var isSeamless = false;
	if(icaData){
		  if((icaData['TWIMode'] == 'on' || icaData['TWIMode'] == 'On')){
			isSeamless = true;
		}
	}
	
		// search for main receiver window
		for(var i = 0 ; i < appwindows.length ;i++){
			if(appwindows[i].contentWindow.location.href.indexOf('Main.html') != -1){
				rfAppWindow = appwindows[i];
				break;
			}
		}
		
		// if no main receiver just use default monitor For e.g. ICA file/FTA launches.
		outerBounds = {top : 0, left: 0, width : 800, height : 600};
		if(rfAppWindow){
			outerBounds = rfAppWindow['outerBounds'];
		}
		
		// Check out which monitor the midpoint of window belongs to as sometimes window may be partially present in two monitors.
		var centerX = outerBounds.left + (outerBounds.width >> 1);
		var centerY = outerBounds.top + (outerBounds.height >> 1);
	 
	  function checkPointOnRect(x, y, rect) {
			if ((x >= rect.left) && (x <= (rect.left + rect.width)) && (y >= rect.top) && (y <= (rect.top + rect.height))) {
				return true;
			}
			return false;
		}
		
		chrome['system']['display']['getInfo'](function(displays) {
		  var display, primary = displays[0], uiWidth, uiHeight;
			var displayBounds = g.Utils.getUnifiedDisplayBounds(displays);
			console.log(JSON.stringify(displayBounds));
			// g.Utils.getUnifiedDisplayBounds() is modifying the displays object so assigning it to original bounds
			var originalBounds = displayBounds.originalBounds;
			
			for(var idx=0; idx < displays.length; idx++) {
			  var cur = displays[idx];
				if(checkPointOnRect(centerX, centerY, originalBounds[idx]) == true) {
					display = originalBounds[idx];
				}

				if (cur["isPrimary"] == true) {
				  primary = originalBounds[idx];
				}
			}
			
			// Use primary in case mid-point is somehow not in any monitor (L shape monitor layout?)
			// Use primary for multimonitor desktop (fullscreen) or app.
			if (!display || (!displayBounds.isUnifiedMode &&
			                  createWindowOptions.mmEnabled === true &&
			                 (isSeamless || createWindowOptions.state == 'fullscreen'))) {
			  display = primary;
			}
			
			if (displayBounds.isUnifiedMode) {
			  createWindowOptions.left = 0;
			  createWindowOptions.top = 0;
			  createWindowOptions.width = (isSeamless) ? screen['availWidth'] : primary['width'];
			  createWindowOptions.height = screen['availHeight'];
			  uiWidth = primary.width;
			  uiHeight = createWindowOptions.height;
			} else {
			  createWindowOptions.left = display['left'];
			  createWindowOptions.top = display['top'];
			  createWindowOptions.width = display['width'];
			  createWindowOptions.height = display['height'];
			  uiWidth = createWindowOptions.width;
			  uiHeight = createWindowOptions.height;
			}
			
			createWindowOptions.uiWidth = uiWidth;
			createWindowOptions.uiHeight = uiHeight;
			if (isSeamless) {
			  // Make window framless and initially show only connecting dialog
			  createWindowOptions.frame = "none";
			  var sw = 342, sh = 142; 
			  createWindowOptions.shapeRects = [{
			    left: (uiWidth - sw >> 1) -2, 
          		top: (uiHeight - sh >> 1) -2, 
          		width: sw+6, 
          		height: sh+6}];
				createWindowOptions.isSeamless = isSeamless;
				createWindowOptions.state = 'maximized';
		  		//Deleting the state as it is not cutting apps at correct location.
				//delete createWindowOptions.state;
			} 

			// validate createWindowOptions state and set it to normal only if it is invalid
			//
			if (!createWindowOptions.state || ((createWindowOptions.state !== 'fullscreen') && (createWindowOptions.state !== 'maximized') &&
			(createWindowOptions.state !== 'minimized') && (createWindowOptions.state !== 'normal'))) {
				createWindowOptions.state = 'normal';
			}
			if(displayBounds.isUnifiedMode && createWindowOptions.state == 'maximized'){
				createWindowOptions.state = 'normal';
			}
				
			HTML5Interface.createWindow(url, callbacks, createWindowOptions);
		});
	}else{
		HTML5Interface.createWindow(url, callbacks, createWindowOptions);
	}
};

HTML5Interface.getClientAddress = function (callback) {
	var defaultAddress = "0.0.0.0";
	if (HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.NETWORKLIST, HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) == true) {
		chrome.system.network.getNetworkInterfaces(function (interfaces) {

			//Test combinations
			/*interfaces = [
				{
					name: "Other",
					address: "BBBB::BBBB:BBBB:BBBB:BBBB"
				},
				{
					name: "Other1",
					address: "AAAA::AAAA:AAAA:AAAA:AAAA"
				},
				{
					name: "Other2",
					address: "55.55.55.55"
				},
				{
					name: "wlan0",
					address: "100.100.100.100"
				},
				{
					name: "wlan0",
					address: "CCCC::CCCC:CCCC:CCCC:CCCC"
				},
				{
					name: "eth0",
					address: "10.10.10.10"
				},
				{
					name: "eth0",
					address: "FFFF::FFFF:FFFF:FFFF:FFFF"
				}
			];*/

			if (!interfaces.length) {
				callback(defaultAddress);
				return true;
			}


			function IpInfo() {
				this.v4 = null;
				this.v6 = null;
				this.set = false;
			}
			var lan = new IpInfo();
			var wireless = new IpInfo();
			var firstIp = new IpInfo();
			var version;
			for(var i = 0; i < interfaces.length; i++) {
				version = (/:/g.test(interfaces[i].address)) ? 6 : 4;

				if (firstIp.v4 == null && version == 4) {
					firstIp.v4 = interfaces[i].address;
					firstIp.set = true;
				}

				if (firstIp.v6 == null && version == 6) {
					firstIp.v6 = interfaces[i].address;
					firstIp.set = true;
				}

				if (interfaces[i].name === "eth0") {
					if (version == 6) {
						lan.v6 = interfaces[i].address;
					} else {
						lan.v4 = interfaces[i].address;
					}
					lan.set = true;
					break;
				} else if (interfaces[i].name === "wlan0") {
					if (version == 6) {
						wireless.v6 = interfaces[i].address;
					} else {
						wireless.v4 = interfaces[i].address;
					}
					wireless.set = true;
					break;
				}
			}

			var preferredIp;
			var preferredInterface;
			if (lan.set) {
				preferredInterface = lan;
			} else if (wireless.set) {
				preferredInterface = wireless;
			}else if(firstIp.set) {
				preferredInterface = firstIp;
			}

			if(preferredInterface) {
				preferredIp = (preferredInterface.v4) ? preferredInterface.v4 : preferredInterface.v6;
			}else {
				preferredIp = defaultAddress;
			}
			callback(preferredIp);
		});
	}else{
		callback(defaultAddress);
		return true;
	}
};
/*
 * format (yy or yyyy , mm , dd) seperate by seperator
 * if(seperator null) then ":"
 * if(format null) date + seperator + month + seperator + fullyear ;
 */
HTML5Interface.getDate = function(format, seperator){
	if(!seperator){
		seperator = ":";
	}
	var currentDate = new Date( );
	var d = parseInt(currentDate.getDate());
	var m = parseInt(currentDate.getMonth() + 1);
	var fy = parseInt(currentDate.getFullYear());
	var y = fy % 100;
	
	d = (d <= 9)? "0" + d:d;
	m = (m <= 9)? "0" + m:m;
	fy = (fy <= 9)? "0" + fy:fy;
	y = (y <= 9)? "0" + y:y;
	
	if(!format){	
		return d + seperator + m + seperator + fy ;
	}
	format = format.toLowerCase( );
	var formatarr = format.split(seperator);
	var index = 0;
	var rvalue = "";
	for( ; index< formatarr.length ;index++){
		switch(formatarr[index]){
			case 'yyyy':
				rvalue += fy;
			break;
			case 'yy':
				rvalue += yy;
			break;
			case 'mm':
				rvalue += m;
			break;
			case 'dd':
				rvalue += d;
			break;			   
		}
		if(index != formatarr.length -1){
			rvalue += seperator;
		}
	}
	return rvalue;
};

/*
 * format (hh , mm , ss) seperate by seperator
 * if(seperator null) then ":"
 * if(format null) hh + seperator + mm + seperator + ss;
 */
HTML5Interface.getTime = function(format, seperator){
	if(!seperator){
		seperator = ":";
	}
	var currentDate = new Date( );
	var hh = parseInt(currentDate.getHours());
	var mm = parseInt(currentDate.getMinutes());
	var ss = parseInt(currentDate.getSeconds());
	
	hh = (hh <= 9)? "0" + hh:hh;
	mm = (mm <= 9)? "0" + mm:mm;
	ss = (ss <= 9)? "0" + ss:ss;
	
	if(!format){	
		return hh + seperator + mm + seperator + ss ;
	}
	format = format.toLowerCase( );
	var formatarr = format.split(seperator);
	var index = 0;
	var rvalue = "";
	for( ; index< formatarr.length ;index++){
		switch(formatarr[index]){
			case 'hh':
				rvalue += hh;
			break;
			case 'mm':
				rvalue += mm;
			break;
			case 'ss':
				rvalue += ss;
			break;
			case 'dd':
				rvalue += d;
			break;			   
		}
		if(index != formatarr.length -1){
			rvalue += seperator;
		}
	}
	return rvalue;
};
HTML5Interface.getWinTimezoneName = function(timezoneString, offset) {
	/*var timezoneNameArray = new Array();
	var index = 0;
	var timezoneName = null;

	//Timezone is a tricky issue where any browser returns OS specific timezone
	//Ids based on which OS the browser is running
	
	//Windows specific code
	if (navigator.appVersion.indexOf("Win") !== -1 && timezoneString.length != 0) {
		//Replace "Daylight" with "Standard" for Windows to set proper timezone with DST
		//Passing as it is will not set the daylight time in Windows
		if(timezoneString.indexOf("Daylight") !== -1) {
			timezoneString = timezoneString.replace("Daylight", "Standard");
		}
		return timezoneString;
	}

	//For non-Windows HTML5 sessions, just map the offset to avoid
	//Windows applying daylight twice. 
	//Windows will ignore the time zone if any unrecognised string is sent to VDA
	//Based on the above behaviour, sending timezoneString.
	if (HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.NETWORKLIST, HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) == false) {
		return timezoneString;
	}

	
	//This part is applicable only for Chrome receiver
	//This table maps Chrome specific time zones to Windows time zone ids
	//Index 0 -> Chrome time zone Ids
	//Index 1 -> Windows time zone Ids (http://msdn.microsoft.com/en-us/library/ms912391(v=winembedded.11).aspx)
	//Index 2 -> Timezone offset


	timezoneNameArray[index++] = ["IDL", "Dateline Standard Time", 720];
	timezoneNameArray[index++] = ["UTC-11", "UTC-11", 660];	
	timezoneNameArray[index++] = ["HST", "Hawaiian Standard Time", 600];
	timezoneNameArray[index++] = ["AKST", "Alaskan Standard Time", 540];
	timezoneNameArray[index++] = ["PST", "Pacific Standard Time", 480];
	timezoneNameArray[index++] = ["MST","US Mountain Standard Time", 420];
	timezoneNameArray[index++] = ["PDT", "Pacific Standard Time", 420];
	timezoneNameArray[index++] = ["CST", "Central Standard Time", 360];
	timezoneNameArray[index++] = ["MDT", "Mountain Standard Time", 360];
	timezoneNameArray[index++] = ["EST", "Eastern Standard Time", 300];
	timezoneNameArray[index++] = ["CDT", "Central Standard Time", 300];
	timezoneNameArray[index++] = ["VET", "Venezuela Standard Time", 270];
	timezoneNameArray[index++] = ["AST", "SA Western Standard Time", 240];
	timezoneNameArray[index++] = ["EDT", "Eastern Standard Time", 240];
	timezoneNameArray[index++] = ["AMT", "SA Western Standard Time", 240];
	timezoneNameArray[index++] = ["NST", "Newfoundland and Labrador Standard Time", 210];
	timezoneNameArray[index++] = ["ADT", "SA Eastern Standard Time", 180];
	timezoneNameArray[index++] = ["NDT", "Newfoundland and Labrador Standard Time", 150];
	timezoneNameArray[index++] = ["UTC-02", "UTC-02", 120];
	timezoneNameArray[index++] = ["AZOST","Azores Standard Time", 60];
	timezoneNameArray[index++] = ["CVT", "Cape Verde Standard Time", 60];
	timezoneNameArray[index++] = ["GMT", "GMT Standard Time", 0];
	timezoneNameArray[index++] = ["CET","Central European Standard Time", -60];
	timezoneNameArray[index++] = ["WAT", "W. Central Africa Standard Time", -60];	
	timezoneNameArray[index++] = ["WEST", "GMT Standard Time", -60];
	timezoneNameArray[index++] = ["IST", "GMT Standard Time", -60];
	timezoneNameArray[index++] = ["BST", "GMT Standard Time", -60];
	timezoneNameArray[index++] = ["EET", "E. Europe Standard Time", -120];
	timezoneNameArray[index++] = ["EET", "FLE Standard Time", -120];	
	timezoneNameArray[index++] = ["CEST", "Central Europe Standard Time", -120];
	timezoneNameArray[index++] = ["CAT", "South Africa Standard Time", -120];
	timezoneNameArray[index++] = ["SAST", "South Africa Standard Time", -120];
	timezoneNameArray[index++] = ["IST", "Israel Standard Time ", -120]; //Israel Standard Time 
	timezoneNameArray[index++] = ["AST", "Arabic Standard Time", -180];
	timezoneNameArray[index++] = ["EAT", "E. Africa Standard Time", -180];
	timezoneNameArray[index++] = ["EEST", "Middle East Standard Time", -180];
	timezoneNameArray[index++] = ["MSK", "Belarus Standard Time", -180]; //Russian Standard Time
	timezoneNameArray[index++] = ["IDT", "Jordan Standard Time", -180]; //Israel Daylight Time 
	timezoneNameArray[index++] = ["IRST", "Iran Standard Time", -210];
	timezoneNameArray[index++] = ["AMT", "Armenian Standard Time", -240];
	timezoneNameArray[index++] = ["MUT", "Mauritius Standard Time", -240];
	timezoneNameArray[index++] = ["GST", "Arabian Standard Time", -240];
	timezoneNameArray[index++] = ["AFT", "Transitional Islamic State of Afghanistan Standard Time", -270];
	timezoneNameArray[index++] = ["WAST", "West Asia Standard Time", -300];
	timezoneNameArray[index++] = ["PKT", "Pakistan Standard Time", -300];
	timezoneNameArray[index++] = ["AZST", "Azerbaijan Standard Time", -300];
	timezoneNameArray[index++] = ["IST", "India Standard Time", -330];
	timezoneNameArray[index++] = ["NPT", "Nepal Standard Time", -345];
	timezoneNameArray[index++] = ["BST", "Central Asia Standard Time", -360];
	timezoneNameArray[index++] = ["ALMT", "Central Asia Standard Time", -360];
	timezoneNameArray[index++] = ["NOVT", "N. Central Asia Standard Time", -360];
	timezoneNameArray[index++] = ["MMT", "Myanmar Standard Time", -390];
	timezoneNameArray[index++] = ["WIB","SE Asia Standard Time", -420];
	timezoneNameArray[index++] = ["THA", "SE Asia Standard Time", -420];
	timezoneNameArray[index++] = ["CST", "China Standard Time", -480];
	timezoneNameArray[index++] = ["SST", "Singapore Standard Time", -480];
	timezoneNameArray[index++] = ["AWST","W. Australia Standard Time", -480];
	timezoneNameArray[index++] = ["NAEST", "North Asia East Standard Time", -480];	
	timezoneNameArray[index++] = ["HKT", "China Standard Time", -480];
	timezoneNameArray[index++] = ["MYT", "Malay Peninsula Standard Time", -480];
	timezoneNameArray[index++] = ["SGT", "Malay Peninsula Standard Time", -480];
	timezoneNameArray[index++] = ["JST", "Tokyo Standard Time", -540];
	timezoneNameArray[index++] = ["KST", "Korea Standard Time", -540];
	timezoneNameArray[index++] = ["YST", "Yakutsk Standard Time", -540];
	timezoneNameArray[index++] = ["CST", "AUS Central Standard Time", -570];
	timezoneNameArray[index++] = ["AEDT", "Central Pacific Standard Time", -660];
	timezoneNameArray[index++] = ["FJT", "Fiji Islands Standard Time", -720];
	timezoneNameArray[index++] = ["NZST", "New Zealand Standard Time", -720];
	timezoneNameArray[index++] = ["NZDT", "New Zealand Standard Time", -780];
	timezoneNameArray[index++] = ["SST", "Samoa Standard Time", -780];
	timezoneNameArray[index++] = ["SDT", "Samoa Standard Time", -840];
	timezoneNameArray[index++] = ["LINT", "Line Islands Standard Time", -840];	

	for (var i = 0; i < timezoneNameArray.length; i++) {
		if(timezoneNameArray[i][0] === timezoneString && timezoneNameArray[i][2] === offset) {
			timezoneName  = timezoneNameArray[i][1];
			break;
		}
		if(timezoneNameArray[i][2] < offset) {
			break;
		}
	}*/

    var timezoneName = tz.mapper.getTimezoneName(timezoneString, offset);
    return timezoneName ? timezoneName : timezoneString;
};



HTML5Interface.setWindowIcon = function(dataObj){
	
			var link = document.getElementById('windowIcon');
			if(!link){
				link = document.createElement('link');
				link.id = 'windowIcon';
			}
			var url = dataObj.url;
			if(!url){
				url =  '../resources/images/icon_16x16.png';
			}
			if(dataObj.type == 'image/png')
			{
				if (g.environment.isFirefox == true ) {
					var img = new Image();
					img.onload = function() {
						var tabImgCanvas = document.createElement("canvas");
						link.rel = String('shortcut icon');
						link.type = String('image/png');
						tabImgCanvas.width = 32;
						tabImgCanvas.height = 32;
						var tabImgIcon = tabImgCanvas.getContext("2d");
						tabImgIcon.drawImage(img, 0, 0, img.width, img.height, 0, 0, tabImgCanvas.width, tabImgCanvas.height);
						link.href = tabImgCanvas.toDataURL();
					};
					img.src = url;
				}//Changing frome  BrowserInfo["MSIE "] to BrowserInfo["MSIE"] and checking for both IE and Edge
				else if (g.environment.isMSBrowser == true) {
					link.type = String('image/x-icon');
					link.rel = String('shortcut icon');
					//link.href = '../../media/ReceiverSmall.ico';
					link.href = url;
				} else {
					link.type = String('image/png');
					link.rel = String('shortcut icon');
					link.href = url;
				}
			}
			
			document.getElementsByTagName('head')[0].appendChild(link);
};

HTML5Interface.setKeyboardFocus = function() {
    /*Setting the focus inside timeout to make sure keyboard does not popup in hybrid touch devices.
     For mobiles,on touchend focus is given to IME.*/
    if(!g.environment.os.isMobile){
        setTimeout(function(){
            var ime = document.getElementById("CitrixClientImeBuffer");
            ime && ime.focus();
        },500);
    }
};

// window show/hide only for non-workers
if ( typeof importScripts !== 'undefined') {
	HTML5Interface.window = {
		focus : function() {
			return false;
		},
		addEventListener : function(type, callback) {
			return false;
		},
		removeEventListener : function(type, callback) {
			return false;
		},
		isFullscreen : function(){
			return false;
		},
		setTitle : function(){
			return false;
		},
		setIcon : function(){
			return false;
		},
		toggleFullScreen : function(){
			
		}
	};
} else if (HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.RECEIVERTYPE, HTML5Interface.platformInfo.RECEIVER.HTML5_RECEIVER) == true) {
	HTML5Interface.window = {
		fullscreenBtnClicked : false,
		focus : function() {
			window.focus();
			return true;
		},
		addEventListener : function(type, callback) {
			if (type === "beforeunload" || type === "unload" || type === "help" || type === "contextmenu" || (type === "orientationchange" && "onorientationchange" in window)) {
				window.addEventListener(type, callback,false);
				return true;
			}			
			return false;
		},
		removeEventListener : function(type, callback) {
			if (type === "beforeunload") {
				window.removeEventListener(type, callback);
				return true;
			}
			
			return false;
		},
		isFullscreen : function(){
			return false;
		},
		setTitle : function(){
			return false;
		},
		setIcon : HTML5Interface.setWindowIcon,
		toggleFullScreen : function(callback,evt){
			var doc = window.document;
			var docEl = doc.documentElement;

			var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
			var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
			//Used to resize the session in case of touch os 
			HTML5Interface.window.fullscreenBtnClicked =true;			
			CEIP.incrementCounter("toolbar:buttons:fullscreen");
			if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
				requestFullScreen.call(docEl);				
				callback("fullscreen");				
			}
			else {				
				cancelFullScreen.call(doc);
				callback("restore");
			}
		}		
	};
}else if (HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.RECEIVERTYPE, HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) == true) {
	HTML5Interface.window = {
		fullscreenBtnClicked : false,
		focus : function(appWindow) {
			if(!HTML5Interface.isKiosk()) {
				
				appWindow = appWindow || chrome.app.window.current();
				// show the window and focus it
				if (appWindow) {
					appWindow.show(true);
				}
			}
			return true;
		},
		addEventListener : function(type, callback) {
			if (type === "unload") {
				if(HTML5Interface.isKiosk()){
					document.addEventListener("unload", callback);
				}else{
					chrome.app.window.current().onClosed.addListener(callback);				
				}
				
				return true;
			}else if(type === "focus" || type === "blur" ){
				window.addEventListener(type, callback);
			}
			
			return false;
		},
		removeEventListener : function(type, callback) {			
			return false;
		},
		isFullscreen: function(){
			if(HTML5Interface.isKiosk())
			{
				return true;
			}
			else{
				return chrome.app.window.current().isFullscreen();
				}
			},
		setTitle : function(dataObj){
			document.title = dataObj.Title;
			// set title of the secondary displays if it exists
			if (displayManager) {
				displayManager.setTitle(document.title);
			}
			return true;
		},
		setIcon : HTML5Interface.setWindowIcon,
		toggleFullScreen : function(callback,evt){
			//Used to resize the session in case of touch os 
			HTML5Interface.window.fullscreenBtnClicked =true;
			CEIP.incrementCounter("toolbar:buttons:fullscreen");
			if(HTML5Interface.window.isFullscreen()){
				chrome.app.window.current().restore();
				callback("restore");
			}
			else{
				chrome.app.window.current().fullscreen();
				callback("fullscreen");				
			}
		}
	};
}

HTML5Interface.openAboutPage = function(e){
	
	if (g.environment.receiver.isChromeApp) {
		//In case of KIOSK, the iframe created in case of account settings in Chromeapp is reused
		if(HTML5Interface.isKiosk()){
				var licensesContainer = window.parent.document.getElementById("KioskLicenses");
				if(licensesContainer){
					licensesContainer.style.display = "block";
					licensesContainer.style.position = "absolute";
					licensesContainer.style.left = "0px";
					licensesContainer.style.top = "0px";
					licensesContainer.style.width = "100%";
					licensesContainer.style.height = "100%";
					licensesContainer.style.zIndex = "15";
				}
				
			}else{
				var aboutPageURL = '/ChromeAppUI/ReceiverThirdPartyNotices.html';
				
				var options = { 
					'id': 'licenses',
					'minWidth': 800,
					'minHeight': 600,
					'state': 'maximized',
					'customWindow' : {
						'type' : 'nativeWindow',
						"containerID" : "__body__"
					}
				};
				//chrome.app.window.create (pageURL, options);
				HTML5Interface.createWindow(aboutPageURL,function(win){},options);
			}
	}else{
		var aboutPageURL =  clientURL+"src/ReceiverThirdPartyNotices.html";
		HTML5Interface.createWindow(aboutPageURL,function(win){},{"customWindow" : {"type" : "nativeWindow"}});
	}
};
HTML5Interface.isUSBAPIAvailable = function(){
	
	if (HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.USB, null) == true) {
		return true;
	}
	return false;
};

// TLS sockets available from Chrome 38 onwards
HTML5Interface.isChromeSocketAvailable = function(){	
	if (HTML5_CONFIG['transport']['nativeSocket'] != true) {
		return false;
	}
	if (HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.NATIVESOCKET, HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) == true) {
		return true;
	}
	return false;
};

HTML5Interface.Notifications = {};

HTML5Interface.Notifications.showTextMessage = function(titleText, messageText, iconURL, callback ,id) {
	if (HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.NOTIFICATION, HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) == true) {
		    var options = {
	        'type': 'basic',
	        'iconUrl': iconURL,
	        'title': titleText,
	        'message': messageText
	    };
	    if (options.iconUrl) {
	        var manifest = chrome.runtime.getManifest ();
	        var iconSize = ['16', '48', '128'];
	        var icons = [];
	        iconSize.forEach (function (index) {
	            var iconUrl = manifest["icons"][index];
	            if (iconUrl) {
	                icons.push (iconUrl);
	            }
	        });
	        options.iconUrl = icons.pop ();
	    }
	    if (callback || ('function' !== typeof callback)) {
	        callback = function (e) {
	        };
	    }
	     var notificationId = id;
	    if(!id)
	    {
	     	 var d = new Date ();
	    	 var notificationId = 'HTML5_CRA-' + d.getTime();
	     }   
	    chrome.notifications.create (notificationId, options, callback);
	  }
};

HTML5Interface.Notifications.showError = function (errorText, iconURL, callback) {
    HTML5Interface.Notifications.showTextMessage (HTML5Engine.i18n.getMessage("error"), errorText, iconURL, callback);
};
HTML5Interface.Notifications.showInformation = function (informationText, iconURL, callback) {
    HTML5Interface.Notifications.showTextMessage (HTML5Engine.i18n.getMessage("information"), informationText, iconURL, callback);
};
HTML5Interface.Notifications.showInformationWithId = function (informationText, iconURL, callback ,id) {
    HTML5Interface.Notifications.showTextMessage (HTML5Engine.i18n.getMessage("information"), informationText, iconURL, callback ,id);
};
HTML5Interface.Notifications.showInternalError = function (internalErrorText, iconURL, callback) {
    HTML5Interface.Notifications.showTextMessage (HTML5Engine.i18n.getMessage("internal_error"), internalErrorText, iconURL, callback);
};

/**
 * @Object HTML5Interface.ChromeNaCl
 * @type {Object}
 */
HTML5Interface.ChromeNacl = {
    isAvailable:  function() {
        return (HTML5_CONFIG['nacl'] && HTML5_CONFIG['nacl']['supportNacl'] && HTML5Interface.platformInfo.checkAPISupport(HTML5Interface.platformInfo.APIIDENTIFIER.RECEIVERTYPE, HTML5Interface.platformInfo.RECEIVER.CHROME_RECEIVER) == true);   
    },

    isFeatureEnabled: function(feature) {
        // Use native client "graphics" only for ChromeOS
        if (feature === "graphics") {
            return (HTML5Interface.ChromeNacl.isAvailable() && HTML5_CONFIG['nacl'][feature] && HTML5_CONFIG['nacl'][feature]['enable'] && isChromeOS);
        }
        
        return (HTML5Interface.ChromeNacl.isAvailable() && HTML5_CONFIG['nacl'][feature] && HTML5_CONFIG['nacl'][feature]['enable']);
    }
};
