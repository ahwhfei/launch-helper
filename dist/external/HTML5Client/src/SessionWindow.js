/*THESE VARIABLE USED FOR OFFUSCATION in jSAssembler*/
var HTML5OFFUSCATIONJSASSEMBLERSTARTTEB;
//start of replaceable
var HTML5OFFUSCATIONJSASSEMBLERENDTEB;
var HTML5_OBFUSCATE_THIRDPARTY_DIRECTORY = "./";
//have to remove
var clipboardDialogShown = false;
var clipboardPolicyEnabled = false;
var isIE10;
var isChromeOS;
var ui = null;
var browserBox = null;
var eventSource ; 
var resourceTree="";
//This is an initial object of ceip. This acts as temporary storage of data points.
//Once CEIP is initialized from HTML5Interface, all data points are pushed to database.
var CEIP = (function(){
	var buffer = [];
	function add(key,value){
		buffer.push({key:key,value:value});
	}
	function popAll(){
		return buffer;
	}
	return {
		add:add,
		popAll:popAll
	}
})();
function GetUI() {
    if (ui === null) {
        ui = new UI();
    }
    return ui;
}

function GetBrowserBox() {
    if (browserBox === null) {
        browserBox = new BrowserBox();
        browserBox.Init(HTML5_CONFIG['ui']);
    }
    return browserBox;
}

//If appview mode then sets the window reference in backgroundPage for post messages
if(window["appViewMode"]){
	chrome.runtime.getBackgroundPage(function(bg){
		window.isKioskMode = true; //Works similar to kiosk mode needed as for printing this variable is used 
		bg.sessionObjs[sessionId]["contentWindow"] = window;
	});
}

var icaConnected = false;
var BrowserInfo = new Array(0);
BrowserInfo["FIREFOX"] = 1;
BrowserInfo["MSIE"] = 2;
BrowserInfo["CHROME"] = 3;
BrowserInfo["SAFARI"] = 4;
BrowserInfo["BB10"] = 5;
BrowserInfo["NONSUPPORTEDBROWSER"] = 6;
BrowserInfo["OTHERS"] = 7;
BrowserInfo["EDGE"] = 8;

var isMSBrowser = function(id){
	if(id==BrowserInfo["MSIE"]||id==BrowserInfo["EDGE"])
		return true;
	return false;
};

var OSInfo = new Array(0);
OSInfo["WINDOWS"] = 1;
OSInfo["MAC"] = 2;
OSInfo["LINUX"] = 3;
OSInfo["UNIX"] = 4;
OSInfo["IPAD"] = 5;
OSInfo["ANDTAB"] = 6;
OSInfo["NONSUPPORTEDOS"] = 7;
OSInfo["IPHONE"] = 8;
OSInfo["ANDPHONE"] = 9;
OSInfo["BLACKBERRY"] = 10;
var PlatformInfo = new Array(0);
var HTML5_WORKER_URL = "";

function HTML5Engine() {
	var hasStarted = false;
	var html5sessionInfo = {};
	var icafileDownloadComplete = false;
	var domDownloadComplete = false;
	var localizefileloaded = false;
	var configfileloaded = false;
	var thirdPartyFilesLoaded = false;
	this.icaEngine = null;
	this.uiEngine = null;
	var myself = this;
	var mainsourcefile = [];
	var optionalsourcefile = [];
	var cssfiles = [];
	var thirdpartysourcefile = [];
	var uithirdpartysourcefile = [];
	var lnsourcefile = [];
	var configsourcefile = [];
	var helperEngine = null;
	var startTime = Date.now();
	var defaultLocation = "../";
	var eventArray = new Array(0);
	var eventArrayLen = 0;
	var clientInfo={};
	var clientAddress;
	var sessionId = "";
	var messageSource;
	var selfDomain = window.location.origin ? window.location.origin : (window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : ''));
	var customVCApps = [];//VC apps id will be stored in this. Read from Config
	var availableVCApps;
	//Metrics for EUEM
	var startSCD = startTime;
	var icaDownloadTime = 0;
	// Enabling or disabling logging
	self.html5LogEnabled = false;
	HTML5Engine.localStorage.getItem("LOGENABLED" , function(result){
				if(result["LOGENABLED"] === "true"){
					self.html5LogEnabled = true;
			}
		});
	
	function writeLog() {
		var prestartlog = new Array(0);
		this.writeLog= function(level,logs){
			prestartlog[prestartlog.length] = logs ;
		};
		this.flush = function( ){
			for(var i =0;i< prestartlog.length ;i++){
				writeHTML5Log(0,prestartlog[i]);
			}				
			prestartlog = new Array(0);
		};
	}
        
        ctxDataVer  =   0;
        ctxCrashed  =   false;
        gfxTested   =   false;	
        gfxColorDif =   0;
	
	HTML5Engine.localStorage.getItem("CtxDataVer" , function(result) {        
	    if (result["CtxDataVer"] !== undefined) {
	        ctxDataVer = result["CtxDataVer"];
	    }
	});
	
	// Is there recorded NACL crash event
	HTML5Engine.localStorage.getItem("CtxCrashed" , function(result){
	    if (result["CtxCrashed"] === "true") {
	        ctxCrashed = true;
	    } 
	});
	
        // Is Gfx Test done once
	HTML5Engine.localStorage.getItem("GfxTested" , function(result){
	    if (result["GfxTested"] === "true") {
	        gfxTested = true;
	    }
	});
        
	// Is NACL Gfx tesed once for color difference
	HTML5Engine.localStorage.getItem("GfxColorDif", function(result){
	    if (result["GfxColorDif"] !== undefined) {
	        gfxColorDif = Number(result["GfxColorDif"]);
	    }
	});

    function ErrorInfo() {
        /*
         * These variable are used for storing information when some error come
         * but Ctxdialog are not able to be shown because  file needed for ctxdialog has not been download
         */
        var errorInSessionWindow = false;
        var ctxTxtHeader;
        var ctxMsg;
        var ctxbText;
        var ctxDisableClose;
        var ctxCallback;
        var optMsg;
        /*
         * this function called when error come in sessionwindow.js and other file
         * are not loaded till that time then this function store variable for ctxdialog and
         * when all file download it call ctxdialog
         */
        this.errorInSessionWindow = function(par1, par2, par3, par4, par5, par6) {
            if (errorInSessionWindow === false) {
                errorInSessionWindow = true;
                // Set source path
                ctxTxtHeader = par1;
                ctxMsg = par2;
                ctxbText = par3;
                ctxDisableClose = par4;
                ctxCallback = par5;
                optMsg = par6;
            }
        };
		this.setError = function(){
			errorInSessionWindow = true;
		};
        this.checkError = function() {
            return errorInSessionWindow;
        };
        this.showError = function() {
            if ( typeof (ctxMsg) === 'string') {
				if (optMsg) {
					ctxMsg = HTML5Engine.i18n.getMessage(ctxMsg, optMsg);
				} else {
					ctxMsg = HTML5Engine.i18n.getMessage(ctxMsg);
				}
            } else if (ctxMsg.length === 2) {
				if (optMsg) {
					var temp = HTML5Engine.i18n.getMessage(ctxMsg[0], optMsg);
					ctxMsg = [temp, HTML5Engine.i18n.getMessage(ctxMsg[1])];
				} else {
					ctxMsg = [HTML5Engine.i18n.getMessage(ctxMsg[0]), HTML5Engine.i18n.getMessage(ctxMsg[1])];
				}
            }
            
            if (1 === ctxCallback) {
                ctxCallback = myself.closeCurrentTab;
            }
            
            if (myself.uiEngine) {
            	if(ctxbText){
            		ctxbText = HTML5Engine.i18n.getMessage(ctxbText);
            	}
                myself.uiEngine.showError(HTML5Engine.i18n.getMessage(ctxTxtHeader), ctxMsg, ctxbText , ctxDisableClose, ctxCallback);
            }

        };
    }
	var errObj = new ErrorInfo();
	this.logger = new writeLog();
	this.logger.writeLog(0,"start Session");

	function updateClientAddress(address) {
		clientAddress = address;
	}

    function initializeDefaultParam() {
        html5sessionInfo.ui = {};
        html5sessionInfo.window = {};
        html5sessionInfo.sourcecode = {};
        html5sessionInfo.ica = {};
        html5sessionInfo.window.ajax = isAjaxSupported();
        html5sessionInfo.window.ajaxheader = null;
        html5sessionInfo.preferences = {};        
        html5sessionInfo.ui.sessionsize = {};
		html5sessionInfo['engine'] = {};
		html5sessionInfo['engine']['type'] = 'receiver';
    }
    
    var IcaFileWrapper = function () {
        var methods = {
            // First two are used by RfWeb, these are inferred by HTML5 engine.
            AUTO_OPENER    : "autoOpener", //?launchid=XXXX, icaData in winOpener.html5LaunchData[XXXX]
            AUTO_XHR       : "autoXhr",    //?launchid=XX#launchurl=XX&iconurl=XX&clientpreferences=XX&resourcename=XX&resourcetype=XX, 'Csrf-Token' in window.name, baseUrl is referrer
            
            // The below ones are to be passed in URL to support custom HTML5 engine launches
            CUSTOM_XHR     : "xhr",        //?launchid=XX#type=xhr&redirecturl=XX&baseurl=XX&launchurl=XX&launchurlmethod=POST&iconurl=XX, Custom header key-value pairs in window.name
            CUSTOM_URL     : "url",        //?launchid=XXXX#type=url&redirecturl=XX&icadata=XXXX
            CUSTOM_MESSAGE : "message",    //?launchid=XXXX#type=message&redirecturl=XX, wait for ICA message
            CUSTOM_FILE    : "file",       //?launchid=XXXX#type=file&redirecturl=XX, show file open/drag n drop UI
            
            // The below ones are not passed in URL
            EMBED          : "embed",      // icafile passed via sent via javascript function call,
            UNKNOWN        : "unknown"
        };
        
        var icaFileSuccess, icaFileFailure;
        
        var parseIcaData = function (data, keyVals) {
            if (data && keyVals) {
                var dataArr;
                if(data.indexOf('\r')==-1){
                    dataArr = data.split('\n');
                }else{
                    dataArr = data.split('\r\n');
                }
                for (var i = 0; i < dataArr.length; i++) {
                    var nameValue = dataArr[i].split('=', 2);
                    if (nameValue.length === 2) {
                        keyVals[nameValue[0]] = nameValue[1];
                    }
                    // This is required as LaunchReference will contain '=' as well. The above split('=',2) will not provide
                    // the complete LaunchReference. Ideally, something like the following should be used generically as well
                    // since there can be other variables with '=' character as part of the value.
                    if (nameValue[0] === "LaunchReference") {
                        var index = dataArr[i].indexOf('=');
                        var value = dataArr[i].substr(index + 1);
                        keyVals[nameValue[0]] = value;
                    }
                }
            } else {
            }
        };
        
        var parseParams = function(params, outParams) {
            if (params) {
                var s = params.split("&");
                for (var i = 0; s && i < s.length; i++) {
                    var keyVal = s[i].split('=');
                    if (keyVal) {
                        outParams[keyVal[0]] = decodeURIComponent(keyVal[1]); // decode each value
                    }
                }
            }
        };
        
        var makeBaseURL = function (src) {
            if (src) {
                var result = src;
                var idx = result.indexOf("?");
                if (idx == -1) idx = result.indexOf("#");
                if (idx !== -1) result = result.substr(0, idx);
                return result;
            } else {
                return "";
            }
        };
        
        // For now define XHR request here, use it from common utility later.
        function SendXHR(type, res, headers, async, onsuccess, onerror) {
            var xmlHttp;

            // for Mozilla/Safari/Chrome
            if (window.XMLHttpRequest) {
                xmlHttp = new XMLHttpRequest();
            }
            else if (window.ActiveXObject) { // IE
                xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
            }
            
            if (xmlHttp !== null) {
                xmlHttp.open(type, res, async);
                xmlHttp.onloadend = function() {
                    if (xmlHttp.status == 200) {
                        clearTimeout(timeout);
                        icaResponse = xmlHttp.responseText;
                        onsuccess(icaResponse);
                    } else {
                        onerror("XHR request failed with status: " + xmlHttp.status);
                    }
                };
                var timeout = setTimeout(
                    function () {
                        xmlHttp.abort(); // call error callback
                    },
                    60*1000 // timeout after a minute
                );

                // Need to set all headers one by one
                if (headers) {
                    for (var key in headers) {
                       if(headers.hasOwnProperty(key)){
                            xmlHttp.setRequestHeader(key, headers[key]);
                       }
                    }
                }
                xmlHttp.send();
            } else {
                onerror("No Ajax support");
            }
        }

        // Ica data is present in the URL itself
        var icaFromURL = function(data) {
            if (data) {
                var icaData = {};
                parseIcaData(data, icaData);
                icaFileSuccess(icaData);
            } else {
                icaFileFailure("icaData not present in the url");
            }
        };

        // Client should show some Fileopen or drag-drop UI to let user choose ICA file.
        var icaFromFile = function() {
            icaFileFailure("icaFromFile not implemented");
        };

        // ICA data is received via postMessage.
        var icaFromPostMessage = function () {
        };
        
        // ICA data is present in the opener page, we have to wait till timeout.
		// RfWeb sets icaDwldComplete variable in our page when ica file is downloaded.
        var icaFromWindowOpener = function (launchID) {
            var winOpener = window.opener;
            if (!winOpener || !launchID) {
                icaFileFailure("Window.opener  or launchID is not present");
                return;
            } else if (window.icaDwldComplete && winOpener.html5LaunchData && winOpener.html5LaunchData[launchID]){
				// if ica file already downloaded by the time we ran then process it.
                var icaData = winOpener.html5LaunchData[launchID];
                icaFileSuccess(icaData);
            } else {
				// lets wait for ICA Data to be set.
                var varCounter = 0;
				var ICA_CHECK_INTERVAL = 250, ICA_CHECK_TIMEOUT = 30000, ICA_CHECK_COUNT = Math.floor(ICA_CHECK_TIMEOUT/ICA_CHECK_INTERVAL);
                var icaFileChecker = function () {
					varCounter++;
                    if (varCounter > ICA_CHECK_COUNT) {					
						// BUG0573662 Incase of pop-ups windows via session roaming, user can launch session using pop-up blocker UI.
						// In this case window.opener could be present but icaDwldComplete is not set as RfWeb did not get a chance because of pop-up blocker.
						if (winOpener.html5LaunchData && winOpener.html5LaunchData[launchID]){
							var icaData = winOpener.html5LaunchData[launchID];
							icaFileSuccess(icaData);
						} else {
							// Error after ICA_CHECK_TIMEOUT
							icaFileFailure("Timeout waiting for window.opener launchID ica data");
						}
						return;
                    }
					
					// ica file downloaded, process it.
                    if (window.icaDwldComplete && winOpener.html5LaunchData && winOpener.html5LaunchData[launchID]){
						var icaData = winOpener.html5LaunchData[launchID];
						icaFileSuccess(icaData);
						return;
					}
					
					// queue next check
					setTimeout(icaFileChecker, ICA_CHECK_INTERVAL);
                };
				setTimeout(icaFileChecker, ICA_CHECK_INTERVAL);
            }
        };

        // ICA data need to fetched by ourselves using XHR from RfWeb via provided params.
        var icaFromXHR = function (launchUrl, csrfHeader, iconUrl, resName, resType, clientPrefs) {
            // validate params
            if (!launchUrl || !iconUrl || !resType || !csrfHeader || !resName) {
                icaFileFailure("Not all params are available for downloading ica file");
                return;
            }

            // get icafile first.
            var onSuccess = function (data) {
                // Checks that data returned starts with '[' (ICA file starts with [Encoding])
                if (data && (data.toString().match('^\\[') === null || data.toString().match('^\\[')[0] !== '[')) {
                    // Data returned is not an ICA file (happens when launch fails, e.g., licensing server issue etc...)
                    icaFileFailure("Data returned is not an ICA file");
                    return;
                } else {
                    var icaData = {};
                    parseIcaData(data, icaData);
                    icaData['IconUrl'] = iconUrl;
                    icaData['resourceName'] = resName;
                    icaData['resourceType'] = resType;
                    icaData['clientPreferences'] = clientPrefs;
                    icaFileSuccess(icaData);
                }
            };
            SendXHR('GET', launchUrl, csrfHeader, true, onSuccess, icaFileFailure);
        };

        // ICA file need to fetched by ourselves using XHR from a possibly thirdpary URL.
        var icaFromCustomXHR = function (launchUrl, launchUrlMethod, customHeaders, iconUrl) {
            // validate params
            if (!launchUrl || !iconUrl) {
                icaFileFailure("Not all params are available for downloading ica file");
                return;
            }

            // get icafile first.
            var onSuccess = function (data) {
                // Checks that data returned starts with '[' (ICA file starts with [Encoding])
                if (data && (data.toString().match('^\\[') === null || data.toString().match('^\\[')[0] !== '[')) {
                    // Data returned is not an ICA file (happens when launch fails, e.g., licensing server issue etc...)
                    icaFileFailure("Data returned is not an ICA file");
                    return;
                } else {
                    var icaData = {};
                    parseIcaData(data, icaData);
                    icaData['IconUrl'] = iconUrl;
                    icaFileSuccess(icaData);
                }
            };
            SendXHR(launchUrlMethod, launchUrl, customHeaders, true, onSuccess, icaFileFailure);
        };
        
        /*
        * Checks the url, executes the ica file retrieval method and calls appropriate callback.
        */
        return {
            // Parses URL and updates paramaters only if not already provided.
            parseUrlParams : function(icaParams, wndHeaders) {
			
				var baseUrl = "";
                
                // read from query string and hash without ? or #               
                parseParams(window.location.hash.substring(1), icaParams);
                parseParams(window.location.search.substring(1), icaParams);
                
                // Check if launch is via RfWeb.
                // RfWeb launches, type to be inferred automatically.
                if (!icaParams["type"]) {
                    // Single tab RfWeb launch.
                    if (icaParams["launchurl"]) {
                        icaParams["type"] = methods.AUTO_XHR;
                        if (!icaParams["redirecturl"]) {
                            icaParams["redirecturl"] = makeBaseURL(document.referrer);
                        }
                        
                        // Expand launchurl and iconurl
                        baseUrl = icaParams["redirecturl"];
                        icaParams['launchurl'] = baseUrl + icaParams['launchurl'];
                        icaParams['iconurl'] = baseUrl + icaParams['iconurl'];
                        
                        if (!wndHeaders['Csrf-Token']) {
                            wndHeaders['Csrf-Token'] = window.name;
                        }
                        window.name = null;
                    } else { // Default window.open from RfWeb.
                        icaParams["type"] = methods.AUTO_OPENER;
                    }
                    return;
                }
                
                // Expand redirect url if reqd.
                if (icaParams["redirecturl"] == "referrer") {
                    icaParams["redirecturl"] = makeBaseURL(document.referrer);
                }
                
                // Now parse window.name if reqd.
                if (icaParams["type"] == methods.CUSTOM_XHR) {
                    // read custom header key-value pairs from window.name
                    parseParams(window.name, wndHeaders);
                    window.name = null;
                    
                    // Expand launchurl and iconurl
                    baseUrl = makeBaseURL(icaParams["baseurl"]);
                    icaParams['launchurl'] = baseUrl + icaParams['launchurl'];
                    icaParams['iconurl'] = baseUrl + icaParams['iconurl'];
                    
                    // get request method, use GET if not present
                    var method = icaParams['launchurlmethod'];
                    if (!method || method !== 'POST') {
                        icaParams['launchurlmethod'] = 'GET';
                    }
                }               
            },
            // Calls different ICA method depending on method.
            getIcaData : function (icaParams, wndHeaders, onSuccess, onError) {
                
                // assign the callbacks.
                icaFileSuccess = onSuccess;
                icaFileFailure = onError;
                
                var type = icaParams["type"];
                myself.logger.writeLog(0,"SESSION:|:CONNECTION:|:ICA:|:ica type=" + type);  
                if (type == methods.AUTO_OPENER) {
                    icaFromWindowOpener(icaParams["launchid"]);
                } else if (type == methods.AUTO_XHR) {
                    icaFromXHR(icaParams['launchurl'], wndHeaders, icaParams['iconurl'], icaParams['resourcename'], icaParams['resourcetype'], icaParams['clientpreferences']);
                } else if (type == methods.CUSTOM_XHR) {
                    icaFromCustomXHR(icaParams['launchurl'], icaParams['launchurlmethod'], wndHeaders, icaParams['iconurl']);
                } else if (type == methods.CUSTOM_URL) {
                   // icaFromURL(icaParams['icadata']);
                    icaFileFailure("url type not supported");
                } else if (type == methods.CUSTOM_MESSAGE) {
                    icaFromPostMessage();
                } else if (type == methods.CUSTOM_FILE) {
                    icaFromFile();
                } else {
                    icaFileFailure("Unknown type passed");
                }
            }
        };
    }();
	
	this.setSessionId = function(id){
		sessionId = id;
	};

    this.setParameter = function(data) {
        for (var key in data) {
			if (data.hasOwnProperty(key)) {
				changeAtrribute(key, html5sessionInfo, data);
			}
        }
        if (hasStarted === true) {
            processCommand(data);
        }
    };
    /*
     * This function is used for setting configuration path
     * This file path can not be passed in URL as it make code location and setting unsecure
     */
	this.setConfigurationPath = function(path){
		if(!path){
			path = defaultLocation;
		}
		html5sessionInfo['sourcecode']['configPath'] = path;
	};
    this.initEngine = function(data) {
       	if (hasStarted === false) {
       		/*
       		 * Config file path should be set either to html5receiver domain
       		 * or set by setConfigurationPath this path can not be passed in url
       		 */
       		if(!html5sessionInfo['sourcecode']['configPath']){
       			html5sessionInfo['sourcecode']['configPath'] = defaultLocation;
       		}
			if (data) {
				for (var key in data) {
					if (data.hasOwnProperty(key)) {
						changeAtrribute(key, html5sessionInfo, data);
					}
				}
			}			
						
			processStartParameter();
			hasStarted = true;
		}
    };
    function processCommand(data) {
        if (data.ui) {
            if (data.ui.root) {
                setParentElement(data.ui.root);
            }
			if(data.ui.autoresize === false){
				
				var sessionSize = adjustSessionSize(data.ui.sessionsize.width,data.ui.sessionsize.height);
				changeSessionSize(sessionSize['width'], sessionSize['height']);
				html5sessionInfo.ui.autoresize = false;
				html5sessionInfo.ui.sessionsize.width = sessionSize["width"];
				html5sessionInfo.ui.sessionsize.height = sessionSize["height"];
				HTML5Engine.localStorage.setItem("defaultResolutionSetting",sessionSize["width"] + "x" + sessionSize["height"]);
			}
            if (data.ui.automouseevent) {
                setMouseEvent(data.ui.automouseevent);
            }
            if (data.ui.autokeyboardevent) {
                setKeyBoardEvent(data.ui.autokeyboardevent);
            }
        }		
        if (data.window) {
			if(data.window.redirecturl){
				html5sessionInfo.window.redirecturl = data.window.redirecturl;
			}
			
			html5sessionInfo.window["showDisconnectAlert"] = data.window["showDisconnectAlert"];
			
        }

		if(configUtils){
			var config = configUtils.filter(data);			
            configUtils.merge(HTML5_CONFIG,config);
			configUtils.updateLocalStorage(config);
		} 		 
    }
    
    function setURLParams() {
        // Parse params from URL here if available.
        if (!html5sessionInfo.window.ajaxheader) html5sessionInfo.window.ajaxheader = {};
        if (!html5sessionInfo.window.urlparam) html5sessionInfo.window.urlparam = {};
        IcaFileWrapper.parseUrlParams(html5sessionInfo.window.urlparam, html5sessionInfo.window.ajaxheader);
    }
    
    function adjustParams() {
        // ica params
        if (!html5sessionInfo.ica.type || html5sessionInfo.ica.type === 'unknown') {
            html5sessionInfo.ica.type = html5sessionInfo.window.urlparam.type;
        } else {
			html5sessionInfo.window.urlparam.type = html5sessionInfo.ica.type;
		}
        if(html5sessionInfo.window.urlparam["launcherType"])
			html5sessionInfo['engine']['launcherType'] = html5sessionInfo.window.urlparam["launcherType"];
			
		if(html5sessionInfo['window']['urlparam']['closeCallback']){
			html5sessionInfo['window']['closeCallback'] = html5sessionInfo.window.urlparam["closeCallback"];
		}
		//For singleTabLaunch , lang from SF is set in URL.
		if(!html5sessionInfo.preferences.lang && html5sessionInfo['window']['urlparam']['UILocale']){
			html5sessionInfo.preferences.lang = html5sessionInfo.window.urlparam["UILocale"];
		}
        // ui params
        if (!html5sessionInfo.ui.automouseevent) {
            html5sessionInfo.ui.automouseevent = (html5sessionInfo.window.urlparam.automouseevent === "false") ? false : true;
        }
        if (!html5sessionInfo.ui.autokeyboardevent) {
            html5sessionInfo.ui.autokeyboardevent = (html5sessionInfo.window.urlparam.autokeyboardevent === "false") ? false : true;
        }
        if (!html5sessionInfo.ui.autoresize) {
            html5sessionInfo.ui.autoresize = (html5sessionInfo.window.urlparam.autoresize === "false") ? false : true;
        }
		if (!html5sessionInfo.ui.sessionsize.width) {
            html5sessionInfo.ui.sessionsize.width = (html5sessionInfo.window.urlparam.width !== 'undefined') ? html5sessionInfo.window.urlparam.width : 300;
        }
		if (!html5sessionInfo.ui.sessionsize.height) {
            html5sessionInfo.ui.sessionsize.height = (html5sessionInfo.window.urlparam.height !== 'undefined') ? html5sessionInfo.window.urlparam.height : 300;
        }
        
        // src code params
        if (!html5sessionInfo.sourcecode.filepath) {
            html5sessionInfo.sourcecode.filepath = html5sessionInfo.window.urlparam.filepath;
        }
        if (!html5sessionInfo.sourcecode.imagepath) {
            html5sessionInfo.sourcecode.imagepath = html5sessionInfo.window.urlparam.imagepath;
        }
        if (!html5sessionInfo.sourcecode.localizationpath) {
            html5sessionInfo.sourcecode.localizationpath = html5sessionInfo.window.urlparam.localizationpath;
        }
        if (!html5sessionInfo.sourcecode.thirdpartypath) {
            html5sessionInfo.sourcecode.thirdpartypath = html5sessionInfo.window.urlparam.thirdpartypath;
        }
        if (!html5sessionInfo.sourcecode.workerpath) {
            html5sessionInfo.sourcecode.workerpath = html5sessionInfo.window.urlparam.workerpath;
        }
        
        // window params
        if (html5sessionInfo.window.urlparam["showDisconnectAlert"] === false) {
            html5sessionInfo.window["showDisconnectAlert"] = html5sessionInfo.window.urlparam["showDisconnectAlert"];
        }
        if (!html5sessionInfo.window.redirecturl) {
            html5sessionInfo.window.redirecturl = html5sessionInfo.window.urlparam.redirecturl;
        }
        
        // preferences
        if (!html5sessionInfo.preferences.lang) {
            html5sessionInfo.preferences.lang = html5sessionInfo.window.urlparam.lang;
        }
    }
	function processStartParameter() {

		// get URL params first and then adjust params.
		setURLParams();
		adjustParams();
		setParentElement(html5sessionInfo.ui.root);
		setcodeLocation();
		var scriptElement = document.createElement("div");
		document.getElementById(html5sessionInfo.ui.parentElementID).appendChild(scriptElement);
		html5sessionInfo.ui.scriptElement = scriptElement;
		loadScripts(html5sessionInfo.ui.scriptElement, configsourcefile, onconfigfileload);
	}

	function loadReceiverEngine() {
		if (errObj.checkError() === false) {
			loadScripts(html5sessionInfo.ui.scriptElement, optionalsourcefile.concat(thirdpartysourcefile), onScriptLoadEnd);
		} else {
			domDownloadComplete = true;
		}
		loadScripts(html5sessionInfo.ui.scriptElement, mainsourcefile.concat(uithirdpartysourcefile, lnsourcefile), thirdPartyLibrariesLoaded);
		loadcssfile(document.getElementsByTagName('head')[0], cssfiles, null);
		if (html5sessionInfo.ica.type && html5sessionInfo.ica.type !== "embed") {
			var onIcaSuccess = myself.setIcaData.bind(myself);
			var onIcaError = myself.icaFileError.bind(myself);
			IcaFileWrapper.getIcaData(html5sessionInfo.window.urlparam, html5sessionInfo.window.ajaxheader, onIcaSuccess, onIcaError);
		}
	}
	
	function onconfigfileload() {			      
		if (html5sessionInfo['engine'] && html5sessionInfo['engine']['type'] === 'receiver') {
			loadReceiverEngine();		
		} else {
			loadHelperEngine();
		}
		configfileloaded = true;
		processMessage();
	}
	function checkIfVCAppIsInstalled(index,cb){
		if(g.environment.receiver.isChromeApp){
			if(customVCApps && index < customVCApps.length){
				if((!ChannalMap.virtualChannalMap[customVCApps[index]["streamName"]]) && customVCApps.streamNames.indexOf(customVCApps[index]["streamName"]) == -1){
					customVCApps.streamNames.push(customVCApps[index]["streamName"]);		
					chrome.runtime["sendMessage"](customVCApps[index]["appId"],{"cmd": "DRIVER_OPEN","streamName":customVCApps[index]["streamName"],"sessionId":window.sessionId},function(response) {
						console.log(customVCApps[index]["appId"] + " is available ?  " + response);								
						if(response && response["enable"]){
							customVCApps[index]["installed"] = response["enable"];
							customVCApps[index]["description"] = response["description"];
							customVCApps[index]["minVersion"] = response["minVersion"];
							customVCApps[index]["maxVersion"] = response["maxVersion"];						
							chrome.runtime["sendMessage"](customVCApps[index]["appId"],{"cmd": "DRIVER_INFO","streamName":customVCApps[index]["streamName"],"sessionId":window.sessionId},function(response) {
								if(response){
									customVCApps[index]["driverInfo"] = response;//get validated by sdk
								}
								checkIfVCAppIsInstalled(index+1,cb);				
							});
						}else{
							customVCApps.streamNames.splice(customVCApps.streamNames.indexOf(customVCApps[index]["streamName"]),1);
							checkIfVCAppIsInstalled(index+1,cb);		
						}
					});
				}else{
					checkIfVCAppIsInstalled(index+1,cb);
				}
			}else{
				cb();
			}
		}else{
			cb();
		}
	}
	
	function loadHelperEngine() {
		if (errObj.checkError() === true) {
			return false;
		} else {
			loadScripts(html5sessionInfo.ui.scriptElement, optionalsourcefile, startHelperEngine);
			return true;
		}
	}

	function startHelperEngine() {	
		if (html5sessionInfo['engine']['type'] === 'chromeApp') {			
			helperEngine = new ChromeAppHelper();			
			helperEngine.initEngine(html5sessionInfo, HTML5_CONFIG);
		}
	}

    function setResizeFunction() {
        if (html5sessionInfo.ui.autoresize === false) {
        	myself.uiEngine.setAutoresize(false);
        } else {
        }
		// Hide Scrollbars if there is no need.
		document.documentElement.style.overflow = "auto";
        document.body.style.margin = "0px";
    }

    this.icaFileError = function(str) {
    	myself.logger.writeLog(0,"SESSION:|:CONNECTION:|:ICA:|:could not load ica file error=" + str);
        var resType = (html5sessionInfo.window.urlparam['resourcetype']) ? html5sessionInfo.window.urlparam['resourcetype'] : '';
        var resName = (html5sessionInfo.window.urlparam['resourcename']) ? html5sessionInfo.window.urlparam['resourcename'] : '';
        var target = ((resType !== '') ? resType : 'app') + ((resName !== '') ? (' "' + resName + '"') : '');
        errObj.errorInSessionWindow('receiver-brand', ['error-start','error-ica-server'], 'ok', false, 1, {'target': target});
        var loadtime = Date.now( ) - startTime;
        myself.logger.writeLog(0,"SESSION:|:CONNECTION:|:LOADTIME:|:ica failure time=" + loadtime); 
        icafileDownloadComplete = true;
		loadLanguage();
        startIcaConnection();
    };

    this.setIcaData = function(icaData1) {
        html5sessionInfo.ica.data = icaData1;
        
        icafileDownloadComplete = true;
		icaDownloadTime = Date.now( ) - startTime;
		myself.logger.writeLog(0,"SESSION:|:CONNECTION:|:LOADTIME:|:ica load time =" + icaDownloadTime);
		if(!html5sessionInfo.preferences.lang){
			html5sessionInfo.preferences.lang = html5sessionInfo.ica.data["UILocale"];
		}
		loadLanguage();
        startIcaConnection();
    };
    
    // End session handling.    
    function BeforeUnloadHandler(event) {
        if ((myself.uiEngine && myself.uiEngine.beforeUnloadCheck === true) ) {
			(event || window.event).returnValue=HTML5Engine.i18n.getMessage("exit-confirm"); //Gecko + IE
            return HTML5Engine.i18n.getMessage("exit-confirm"); //Webkit, Safari, Chrome etc.
        }
    }
	function onUnload(event){
		clearHTML5Session( );
        if (displayManager) {
            displayManager.closeAllWindow();
        }
	}
    function CloseTab() {
    	writeHTML5Log(0,"SESSION:|:CONNECTION:|:closing tab");
        writeHTML5Log(0, "closing tab window");
        window.open('', String('_self'), '');
        
        if (displayManager) {
            writeHTML5Log(0, "closing extended windows");
            displayManager.closeAllWindow();
        }
        window.close();
        /*
        * In firefox, we can't close  tabs using window.close(),
        * which are not opened by javascript. In this case we will show error message
        * with close button disabled
        
        var disableClose = true;
		if (myself.uiEngine) {
                myself.uiEngine.showError(HTML5Engine.i18n.getMessage('receiver-brand'),HTML5Engine.i18n.getMessage('error-server'), null,disableClose, null);
               }
		*/
    }
    
   function clearHTML5Session() {
		if(html5sessionInfo['window']['closeCallback'] === "true"){
			closesessionCallback();
		}
        if(html5sessionInfo['engine']['type'] === 'receiver'){
			if (myself.uiEngine) {
				myself.uiEngine.closeConnection();
			}
			if (myself.icaEngine) {
				myself.icaEngine.closeConnection();
			}
		}else{
			helperEngine.closeConnection( );
		}
		
    }
	function closesessionCallback(){
		if(!eventSource){
			eventSource = window.opener;
		}		
		eventSource.postMessage({"cmd": "CLOSESESSION"}, selfDomain);
	}
	
    this.clearHTML5Session = clearHTML5Session;
    this.closeCurrentTab = function(isserverinitiated) {
		//TODO : For chromeApp use events and remove this
		if(html5sessionInfo['window']['closeCallback']  === "true"){
			closesessionCallback();
		}		
    	writeHTML5Log(0,"SESSION:|:CONNECTION:|:session ended");  
        
        if (isserverinitiated === true) {        	
			if(html5sessionInfo.window["showDisconnectAlert"] !== false){
				HTML5Interface.window.removeEventListener("beforeunload", BeforeUnloadHandler);
			}
        }	 
		myself.postReceiverEvent("onConnectionClosed");
		
		//html5sessionInfo.window.redirecturl != "none" is used in ChromeApp to close the session window.
        if (html5sessionInfo.window.redirecturl && html5sessionInfo.window.redirecturl != "none") {
            window.location = html5sessionInfo.window.redirecturl;
            return;
        }
		
		CloseTab();
    };
    
	this.postReceiverEvent = function(eventType,data){
		if(!messageSource){
			messageSource = window.opener;
		}
		if(eventType){					
			var messageObj ={
				'sessionId' : sessionId,							
				'source' : 'HTML5Client'
			};			
			messageObj['type'] = eventType;
			if(data){
				messageObj['data'] = data;
			}
			if(messageSource){
				messageSource.postMessage(messageObj,selfDomain);
			} 
		}
	};
	
    function setMouseEvent(enable) {
        myself.uiEngine.resetMouseHandler(enable);
    }

    function setKeyBoardEvent(enable) {
        myself.uiEngine.resetKeyBoardHandler(enable);
    }

    function setcodeLocation() {
        if (!html5sessionInfo.sourcecode.filepath) {
            html5sessionInfo.sourcecode.filepath = defaultLocation + "src/";
        }
        if (!html5sessionInfo.sourcecode.imagepath) {
            html5sessionInfo.sourcecode.imagepath = defaultLocation + "resources/";
        }
        if (!html5sessionInfo.sourcecode.localizationpath) {
            html5sessionInfo.sourcecode.localizationpath = defaultLocation + "locales/";
        }
        if (!html5sessionInfo.sourcecode.thirdpartypath) {
            html5sessionInfo.sourcecode.thirdpartypath = defaultLocation + "ThirdPartyLibrary/";
        }
        if (!html5sessionInfo.sourcecode.workerpath) {
            html5sessionInfo.sourcecode.workerpath = defaultLocation + "src/citrixHTML5Launcher.js";
        }
        if (!html5sessionInfo.sourcecode.csspath) {
            html5sessionInfo.sourcecode.csspath = defaultLocation + "CascadingStyleSheet/";
        }

        html5sessionInfo.sourcecode.filepath = removingTrailingslash(html5sessionInfo.sourcecode.filepath);
        html5sessionInfo.sourcecode.imagepath = removingTrailingslash(html5sessionInfo.sourcecode.imagepath);
        html5sessionInfo.sourcecode.localizationpath = removingTrailingslash(html5sessionInfo.sourcecode.localizationpath);
        html5sessionInfo.sourcecode.thirdpartypath = removingTrailingslash(html5sessionInfo.sourcecode.thirdpartypath);
        html5sessionInfo.sourcecode.csspath = removingTrailingslash(html5sessionInfo.sourcecode.csspath);
        initializefileArray();
        HTML5_WORKER_URL = html5sessionInfo.sourcecode.workerpath + "?" + "filepath=" + html5sessionInfo.sourcecode.filepath + "&thirdpartypath=" + html5sessionInfo.sourcecode.thirdpartypath;
		resourceTree =  html5sessionInfo.sourcecode.imagepath+"images/"; //Find a better way if possible.
    }

    function removingTrailingslash(str) {
        var index = str.length - 1;
        while ((index >= 0 ) && (str[index] === "/")) {
            index--;
        }
        str = str.substr(0, index + 1);
        return str + "/";
    }

    function setParentElement(elementID) {
        if (elementID) {
            var temp = document.getElementById(elementID);
            if (!temp) {
            }
        } else {
            temp = document.body;
            document.body.style.background = "black";
        }
        var parentElement = document.getElementById("citrixHTML5root");
        if (!parentElement) {
            parentElement = document.createElement("div");
            parentElement.tabindex = "0";
            parentElement.id = "citrixHTML5root";
            html5sessionInfo.ui.parentElementID = "citrixHTML5root";
            
            var superRenderCanvas = document.createElement('div');
            superRenderCanvas.id = "CitrixSuperRenderCanvas";
            parentElement.appendChild(superRenderCanvas);
            
            var xtcRoot = document.createElement('div');
            xtcRoot.id = "CitrixXtcRoot";
            parentElement.appendChild(xtcRoot);
            
            document.body.style.background = "black";
            document.body.style.overflow = 'hidden';
            xtcRoot.style.background = "black";
        }
        temp.appendChild(parentElement);
    }


    this.getResolution = function() {
        return {
            'Width' : engineWindow.width,
            'Height' : engineWindow.height
        };
    };
	this.getClientInfo = function(){
		return clientInfo;
	};
	this.getCustomVCInfo = function(){	
		if(!availableVCApps){
			availableVCApps = [];
			for(var i=0;i<customVCApps.length && i<=2;i++){ // Restricting to 3 custom vcs
				if(customVCApps[i]["installed"]){
					availableVCApps.push(customVCApps[i]);
				}
			}
		}
		return availableVCApps;		
	};
	
    function onScriptLoadEnd() {
        
        var loadtime = Date.now( ) - startTime;
        myself.logger.writeLog(0,"SESSION:|:CONNECTION:|:LOADTIME:|:script load =" + loadtime);
		HTML5Interface.getClientAddress(updateClientAddress);
		
		// set handler to prompt user not to exit now.
		if (html5sessionInfo.window["showDisconnectAlert"] !== false) {
            HTML5Interface.window.addEventListener("beforeunload", BeforeUnloadHandler);
        }
		
		// check if clientname/serialnumber was present, generate otherwise and store it
		
		HTML5Interface.getClientInfo(function(result) {
			clientInfo['ClientName'] = result['ClientName'];	
			clientInfo['SerialNumber'] = result['SerialNumber'];
			clientInfo['KbdLayout'] = result['KbdLayout'];		
			clientInfo['defaultResolutionSetting'] = result['defaultResolutionSetting'];		
            clientInfo['showAutoPopupKbdButton'] = result['showAutoPopupKbdButton'];
            clientInfo['displayInfo'] = result['displayInfo'];
			
            clientInfo['appSwitcher'] = result['appSwitcher'];
			
			clientInfo['useAllMyMonitors'] = result['useAllMyMonitors'];
			clientInfo['ceipEnabled'] = result['ceipEnabled'];
			clientInfo['CEIP'] = result['CEIP'];
			//To ensure the session is loaded only after reading the default resolution setting
			domDownloadComplete = true;
			startIcaConnection();			
			
		}.bind(this));
	}

    function startIcaConnection() {
        if ((domDownloadComplete === true) && (icafileDownloadComplete === true ) && (localizefileloaded === true)) {
			if(g.environment.receiver.isChromeApp){
				customVCApps = JSON.parse(JSON.stringify(HTML5_CONFIG && HTML5_CONFIG["customVC"]));
				customVCApps.streamNames = []; //Storing the stream Names				
			}
			console.log("VC apps status checking");
			checkIfVCAppIsInstalled(0,function(){
				console.log("VC apps status done",customVCApps);
			
				var npsConfig = {};
				npsConfig["HTML5_CONFIG"] = HTML5_CONFIG;
				npsConfig["isChromeOS"] = isChromeOS;
				npsConfig["isChromeApp"] = g.environment.receiver.isChromeApp;
				npsConfig["isKiosk"] = g.environment.receiver.isKiosk;		
				NetPromoters.init(npsConfig);
			
				HTML5Interface.window.addEventListener("unload", onUnload);
				g.environment.receiver.seamlessMode = (html5sessionInfo.ica && (html5sessionInfo.ica.data['TWIMode'] == 'on' ||  html5sessionInfo.ica.data['TWIMode'] == 'On')) ? true : false;
			
				writeHTML5LogAppName((html5sessionInfo.ica.data && html5sessionInfo.ica.data['InitialProgram']) ? html5sessionInfo.ica.data['InitialProgram'] : "ICAERROR" );
				myself.logger.flush();
				writeHTML5Log(0,"SESSION:|:CONNECTION:|:initializing session"); 
				startTime =  Date.now( );
				UiControls.ResolutionUtility.init(clientInfo['displayInfo'],clientInfo['defaultResolutionSetting'], clientInfo['useAllMyMonitors']);
				if(HTML5_CONFIG && HTML5_CONFIG['ceip'] && HTML5_CONFIG['ceip']['enabled'] == false){
					UiControls.sessionPreferences.setCEIPCbDisable();
				}else if(clientInfo['ceipEnabled'] == 'false' || clientInfo['ceipEnabled'] == false){
					HTML5_CONFIG['ceip']['enabled'] = false;
				}
				var tempData = CEIP.popAll();
				CEIP = clientInfo['CEIP'];//Refer HTML5Interface. Initial dummy CEIP object is updated from background in case of RfChrome.
				console.log("[CEIP] clientInfo['ceipEnabled']",clientInfo['ceipEnabled']);
				if(g.environment.receiver.isChromeApp){
					if (clientInfo['ceipEnabled'] == false){
						CEIP.disable();
					}else{
						CEIP.enable();
					}
				}
				for(var i=0;i<tempData.length;i++){
					CEIP.add(tempData[i].key,tempData[i].value);
				}
				console.log('[CEIP] tempData ',tempData);
				tempData = [];
				if(window['isSDK']){
					CEIP.add('session:launchType','sdk');
				}
				CEIP.incrementCounter("session:attempt");
				var receiverVersion = (('undefined' !== typeof versionInfo) && versionInfo) ? versionInfo['major'] + "." + versionInfo['minor'] + "." + versionInfo['patch'] + "." + versionInfo['build'] : "";
				if (receiverVersion != '') {
					CEIP.add('receiverVersion',receiverVersion);
				}
				if(!g.environment.receiver.isChromeApp){
					CEIP.init();
					//CEIP is initialized only for HTML as it will be running in background in case of chrome.
				}
				if (!myself.uiEngine) {
					 writeHTML5Log(0,"SESSION:|:CONNECTION:|:UI:|:initializing ui-interface");     
					 myself.uiEngine = new UIEngine(myself);
					 //myself.uiEngine.setUserPreferredResolution(clientInfo["defaultResolutionSetting"]);
					 setResizeFunction();				 
					 myself.uiEngine.initEngine(html5sessionInfo.ui.parentElementID, errObj.checkError());
				   }
				if (errObj.checkError() === true) {
					errObj.showError();
					return;
				} 
			
				//update showAutoPopupKbdButton setting to UI preference module
				if(clientInfo['showAutoPopupKbdButton']){
					UiControls.sessionPreferences.setAutoKbdCheckBoxDefaulltSetting(clientInfo['showAutoPopupKbdButton']);
				}
				
			  
				myself.uiEngine.processIcaData(html5sessionInfo.ica.data);             
				myself.uiEngine.resetConnectStatus(false);
				myself.postReceiverEvent("onConnection",{'state' : 'connecting'});
				myself.uiEngine.resetInputHandler(html5sessionInfo.ui.automouseevent, html5sessionInfo.ui.autokeyboardevent);
				var loadtime = Date.now( ) - startTime;
				writeHTML5Log(0,"SESSION:|:CONNECTION:|:LOADTIME:|:ui initialize =" + loadtime);    
				startTime =  Date.now( );
				if (('undefined' !== typeof versionInfo) && versionInfo ) {
					html5sessionInfo.ica.data['ClientVersion'] = versionInfo['major'] + "." + versionInfo['minor'] + "." + versionInfo['patch'] + "." + versionInfo['build'];
					html5sessionInfo.ica.data['ClientBuildNumber'] = parseInt(versionInfo['build'], 10);
					writeHTML5Log(0," SESSION:|:CONNECTION:|:ICA:|:ClientVersion " +	html5sessionInfo.ica.data['ClientVersion']);
				}
				// use generated client name only if ica file doesnt have it
				if (!html5sessionInfo.ica.data['ClientName'] && clientInfo['ClientName']) {
					html5sessionInfo.ica.data['ClientName'] = clientInfo['ClientName'];
				}
				if (!html5sessionInfo.ica.data['SerialNumber'] && clientInfo['SerialNumber']) {
					html5sessionInfo.ica.data['SerialNumber'] = clientInfo['SerialNumber'];
				}
				if (!html5sessionInfo.ica.data['KeyboardLayout'] && clientInfo['KbdLayout']) {
					html5sessionInfo.ica.data['KeyboardLayout'] = clientInfo['KbdLayout'];
				}
				html5sessionInfo.ica.data['ClientIp'] = clientAddress;
				if(html5sessionInfo.ui.sessionsize.width){
					UiControls.ResolutionUtility.set(UiControls.ResolutionUtility.constants.sessionResize , {width :html5sessionInfo.ui.sessionsize.width ,height:html5sessionInfo.ui.sessionsize.height });
				}
				if (!myself.icaEngine) {
					writeHTML5Log(0,"SESSION:|:CONNECTION:|:ICA:|:initializing ica-interface"); 
					myself.icaEngine = new IcaEngine(myself);
					myself.icaEngine.connect(html5sessionInfo.ica.data, html5sessionInfo.ui.sessionsize.width, html5sessionInfo.ui.sessionsize.height, { startSCD: startSCD, icaTime : icaDownloadTime});
				}
				var loadtime = Date.now( ) - startTime;
				writeHTML5Log(0,"SESSION:|:CONNECTION:|:LOADTIME:|:ica initialize =" + loadtime);         
			});
        }
    }
    
	
	
	this.handleMessage = function(events ,len){
		if(!len){
			eventArray[eventArrayLen++] = events;
		}else{
			for(var i = 0; i<len; i++){
				eventArray[eventArrayLen++] = events[i];
			}
		}
		if(configfileloaded === true){
			processMessage( );
		}		
	};
	function processMessage( ){
		var messagedomain = HTML5_CONFIG['domain']['message'];
		if(!messagedomain){
			messagedomain = "";
		}		
		messagedomain =  selfDomain + ";" + messagedomain;
		var domains = messagedomain.split(";");
		for(var i = 0; i<eventArrayLen; i++){
			var domainmatch = false;
			var evt = eventArray[i];			
			for(var j=0 ; j< domains.length ;j++){
				if(evt.origin === domains[j]){
					domainmatch = true;
					break;
				}
			}
			if(domainmatch === true){
				var data = evt.data;
				eventSource = evt.source;//This global variable needs to be removed when during kiosk changes for printing is done
				messageSource = evt.source;
				if (data['cmd'] === "ICADATA") {
					if (data['icaData']) {
						myself.setIcaData(data['icaData']);				
					}
				} else if (data['cmd'] === "PRINTDONE") {
                    myself.uiEngine.kioskPrinterCallbackOnMessage();
                }else if(data['cmd'] === "CONFIG"){
					if(data['config']){
						myself.setParameter(data["config"]);
					}
				}else if(data['cmd'] === "DISCONNECT"){
					clearHTML5Session();
				}else if(data['cmd'] === "LOGOFF"){
					myself.uiEngine.connectionAction({"window_info":{},"cmd":"action","action":"logoff"});
				}else if(data['cmd'] === "SPLKEYS"){
					if(data["keys"] === "ctrl+alt+del" ){
						myself.uiEngine.initiateCtrlAltDel();
					}else {
						myself.uiEngine.sendSpecialKeys(data["keys"]);
					}
				}
				else if(data['cmd'] === "RESOLUTION"){
					var sessionSize;
					if(data["bounds"]["autoresize"] === false){
						sessionSize = adjustSessionSize(data["bounds"]["sessionsize"]["width"],data["bounds"]["sessionsize"]["height"]);
						myself.uiEngine.setAutoresize(false);
					}
					else{
						sessionSize = adjustSessionSize(window.innerWidth,window.innerHeight);
						myself.uiEngine.setAutoresize(true);
					}
					UiControls.ResolutionUtility.set(UiControls.ResolutionUtility.constants.sessionResize , {width :sessionSize["width"] ,height:sessionSize["height"]});
				}else if(data["cmd"] === "TOOLBAR_BTN_ADD"){	
					UiControls.CustomToolbar.setPostMsgHandler(myself.postReceiverEvent);
					UiControls.CustomToolbar.register(data["customToolbar"]);										
				}else if(data["cmd"] === "TOOLBAR_BTN_DEL"){						
					UiControls.CustomToolbar.removeButtons(data["buttonIds"]);								
				}
				else if(data["cmd"] === "HIDE_DISPLAY_WINDOW"){
					if (displayManager) {
						var numDisplays = displayManager.getActiveDisplayCount() || 1;
						if(numDisplays > 1){
							var secondaryDisplayWindows = displayManager.getSecondaryWindowHandles();
							for(var i in secondaryDisplayWindows){
								secondaryDisplayWindows[i].hide();
							}
						}
					}
				}
				else if(data["cmd"] === "SHOW_DISPLAY_WINDOW"){
					if (displayManager) {
						var numDisplays = displayManager.getActiveDisplayCount() || 1;
						if(numDisplays > 1){
							var secondaryDisplayWindows = displayManager.getSecondaryWindowHandles();
							for(var i in secondaryDisplayWindows){
								secondaryDisplayWindows[i].show();
							}
						}
					}
				}
			}
		}
		eventArrayLen = 0;	
	}	
    function changeSessionSize(width, height) {		
		html5sessionInfo.ui.sessionsize.width = width;
        html5sessionInfo.ui.sessionsize.height = height;
		var sessionSize = adjustSessionSize(width,height);		
    }
	
	function adjustSessionSize(width,height){
		//Uses the value defined below when minwidth and minheight is undefined in configuration.js
		var minwidth = 400;
		var minheight = 300;
		
		if(HTML5_CONFIG && HTML5_CONFIG["ui"] && HTML5_CONFIG["ui"]["sessionsize"]){
			var sessionSize = HTML5_CONFIG["ui"]["sessionsize"];
			if(sessionSize["minwidth"] && sessionSize["minheight"]){
					minwidth = sessionSize["minwidth"] > 0 ? sessionSize["minwidth"] : minwidth;
					minheight = sessionSize["minheight"] > 0 ? sessionSize["minheight"] : minheight;
			}
		}				
		
		/* Adding customization code for CWC to start the session with a particular width/height and still allow it to resize later.		
		   TODO : Handle this in a better way.
		*/
		if ((isNaN(width) || width == 0) && html5sessionInfo.ui.sessionsize.width > -1) {
            width = html5sessionInfo.ui.sessionsize.width;
        }
        else {
            width = (width < minwidth) ? minwidth : width;
        }
        if ((isNaN(height) || height == 0) && html5sessionInfo.ui.sessionsize.height > -1) {
            height = html5sessionInfo.ui.sessionsize.height;
        }
        else {
            height = (height < minheight) ? minheight : height;
        } 
		
		return {
			'width' : width,
			'height' : height
		}
	}

    this.changeSessionSize = changeSessionSize;
	
	function thirdPartyLibrariesLoaded(){
		thirdPartyFilesLoaded = true;
		loadLanguage();		
	}
	
    function loadLanguage() {				
		if(thirdPartyFilesLoaded && icafileDownloadComplete){			
		
			var preferredLanguage = html5sessionInfo.preferences.lang;
			myself.logger.writeLog(0,"SESSION:|:PREFERENCE:|:language=" + preferredLanguage);  
			
			if (!preferredLanguage) {
				preferredLanguage = 'en';
			}
			var temp = preferredLanguage.split("-");			
			if(temp[0] == "zh"){
				preferredLanguage = (!temp[1]) ? temp[0] : temp[0] +"-"+temp[1];
			}else{
				preferredLanguage = temp[0];
			}
			preferredLanguage = (preferredLanguage).toLowerCase();
			var url = html5sessionInfo.sourcecode.localizationpath + preferredLanguage +".js";
			var resources = {};
			CEIP.add('language:session',preferredLanguage);
			/*if(preferredLanguage == "en"){
				resources[preferredLanguage] = {"translation" : localeString};
				HTML5Engine.i18n.init(preferredLanguage,resources,i18nLoaded);
			}else*/
			//Avoiding xhr will call startIcaConnection twice.
			{
				var xobj = new XMLHttpRequest();
				xobj.overrideMimeType("text/javascript");
				xobj.open('GET', url, true); 
				xobj.onerror = function(e){
					resources[preferredLanguage] = {"translation" : localeString};
					HTML5Engine.i18n.init(preferredLanguage,resources,i18nLoaded);
				};
			
				xobj.onreadystatechange = function () {
					if (xobj.readyState == 4){
						preferredLanguage = (xobj.status == "200") ? preferredLanguage : "en";				  						
						try{
							var translationJSON = (xobj.status == "200") ? (JSON.parse(xobj.responseText)) : localeString;						
							resources[preferredLanguage] = {"translation" : translationJSON};	
						}catch(e){
							preferredLanguage = "en";
							resources[preferredLanguage] = {"translation" : localeString};	
						}
						HTML5Engine.i18n.init(preferredLanguage,resources,i18nLoaded);					
					}		
				};
				xobj.send(null);
			}
		}
    }
	function i18nLoaded(){
		localizefileloaded = true;
		var loadtime = Date.now( ) - startTime;
		myself.logger.writeLog(0,"SESSION:|:CONNECTION:|:LOADTIME:|:language =" + loadtime); 
		startIcaConnection();
	}
	
    function supportBasicFeature() {
        var rc = true;
        if ((( typeof Uint32Array) === "undefined") || (( typeof Int32Array) === "undefined") || (( typeof Uint8Array) === "undefined") || (( typeof Int8Array) === "undefined") || (( typeof Uint16Array) === "undefined") || (( typeof Int16Array) === "undefined") || (( typeof ArrayBuffer) === "undefined") || (( typeof Float32Array) === "undefined") || (( typeof Float64Array) === "undefined")) {
            rc = false;
        }
        if (( typeof WebSocket) === "undefined") {
            rc = false;
        }
        try {
            var elem = document.createElement('canvas');
            if ((!(elem.getContext && elem.getContext('2d'))) === true) {
                rc = false;
            }
        } catch (error) {
            rc = false;
        }
        return rc;
    }
    

    function loadcssfile(element, files, callback) {
        var count = files.length;
        var totalLoaded = 0;        
        for (var i = 0; i < count; i++) {
            var fileref = document.createElement("link");
            fileref.setAttribute("rel", "stylesheet");
            fileref.setAttribute("type", "text/css");
            fileref.setAttribute("href", files[i]);
            element.appendChild(fileref);
        }

    }

    function loadScripts(element, files, callback) {
        var count = files.length;
        var totalLoaded = 0;
        function onloadEnd() {
            totalLoaded++;
            if (totalLoaded === count) {
                callback();
            }
        }

        for (var i = 0; i < count; i++) {
            var script = document.createElement('script');
            script.onload = onloadEnd;
            script.onerror = onloadEnd;
            script.async = false;
            script.src = files[i];
            script.type = "text/javascript";
            element.appendChild(script);
            //TODO
        }
    }

 	function changeAtrribute(key, output, input) {
		if (input.hasOwnProperty(key)) {
			if (!output[key]) {
				if ( typeof input[key] === 'Object' || typeof value === 'object') {
					output[key] = new Object(input[key]);
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

    function isAjaxSupported() {
        var ajaxRequest;
        var rvalue = true;
        try {
            ajaxRequest = new XMLHttpRequest();
        } catch (e) {

            try {
                ajaxRequest = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    ajaxRequest = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) {

                    rvalue = false;
                }
            }
        }
        myself.logger.writeLog(0,"SESSION:|:PREFERENCE:|:ajax=" + rvalue);  
        return rvalue;
    }

    function setBrowserInfo() {
        PlatformInfo["browserVersion"] = null;
        PlatformInfo["OS"] = null;
        PlatformInfo["browserid"] = null;
        PlatformInfo["isTouchOS"] = ('ontouchstart' in document.documentElement) ? true : false;
        function GetOS() {
            if (navigator.appVersion.indexOf("Win") !== -1) {
                return OSInfo["WINDOWS"];
            }
			
			// iPhone and iPad can be reliably identified with the navigator.platform
            // string, which is currently only available on these devices. Mac is found in appVersion for iOs as well.
            if (navigator.platform.indexOf("iPhone") !== -1) {
                return OSInfo["IPHONE"];
            }

            if (navigator.platform.indexOf("iPad") !== -1) {
                return OSInfo["IPAD"];
            }
			
            if (navigator.appVersion.indexOf("Mac") !== -1) {
                return OSInfo["MAC"];
            }
            if (navigator.appVersion.indexOf("X11") !== -1) {
                return OSInfo["UNIX"];
            }
            if (navigator.appVersion.indexOf("Linux") !== -1) {
                return OSInfo["LINUX"];
            }

            var agent = navigator.userAgent.toLowerCase();
            // We need to eliminate Symbian, Series 60, Windows Mobile and Blackberry
            // browsers for this quick and dirty check. This can be done with the user agent.
            var otherBrowser = (agent.indexOf("series60") !== -1) || (agent.indexOf("symbian") !== -1) || (agent.indexOf("windows ce") !== -1) || (agent.indexOf("blackberry") !== -1);
            // If the screen orientation is defined we are in a modern mobile OS
            var mobileOS = typeof orientation !== 'undefined' ? true : false;
            // If touch events are defined we are in a modern touch screen OS
            var touchOS = ('ontouchstart' in document.documentElement) ? true : false;

            if (navigator.platform.indexOf("BlackBerry") !== -1) {
                return OSInfo["BLACKBERRY"];
            }

            // If the user agent string contains "android" then it's Android. If it
            // doesn't but it's not another browser, not an iOS device and we're in
            // a mobile and touch OS then we can be 99% certain that it's Android.
            if ((agent.search("android") > -1) && !(agent.search("mobile") > -1)) {
                return OSInfo["ANDTAB"];
            }

            if (((agent.search("android") > -1) && (agent.search("mobile") > -1)) || (!otherBrowser && touchOS && mobileOS)) {
                return OSInfo["ANDPHONE"];
            }
            
        
            return OSInfo["NONSUPPORTEDOS"];
        }

        function GetBrowser() {
            //document.loadScript("./Business/CtxDialog.js",function(){});
            var nVer = navigator.appVersion;
            var nAgt = navigator.userAgent;
            var browserID = null;
            var fullVersion = '' + parseFloat(navigator.appVersion);
            var nameOffset, verOffset, ix;

            // In MSIE, the true version is after "MSIE" in userAgent
            if (( verOffset = nAgt.indexOf("MSIE")) !== -1) {
                browserID = BrowserInfo["MSIE"];
                fullVersion = nAgt.substring(verOffset + 5);
            } else if((verOffset = nAgt.indexOf("Edge")) !== -1){
				browserID = BrowserInfo["EDGE"];
				//UserAgent = "...Edge/12.0 .."
				fullVersion = nAgt.substring(verOffset + 5, verOffset + 5+4);
			}else if (nAgt.indexOf("Trident") !== -1) {
                browserID = BrowserInfo["MSIE"];
                verOffset = nAgt.indexOf("rv:");
                fullVersion = nAgt.substring(verOffset + 3, verOffset + 3 + 4);
            }
            // In BB10, the true version is after after "Version"
            else if (( verOffset = nAgt.indexOf("BB10")) !== -1) {
                browserID = BrowserInfo["BB10"];
                fullVersion = nAgt.substring(verOffset + 7);
                if (( verOffset = nAgt.indexOf("Version")) !== -1)
                    fullVersion = nAgt.substring(verOffset + 8);
            }
			
			 // In chrome, the true version is after "chrome"
            else if (( verOffset = nAgt.indexOf("Chrome")) !== -1) {
                browserID = BrowserInfo["CHROME"];
                fullVersion = nAgt.substring(verOffset + 7);
                if (( verOffset = nAgt.indexOf("Version")) !== -1)
                    fullVersion = nAgt.substring(verOffset + 8);
            }
			
            // In Safari, the true version is after "Safari" or after "Version"
            else if (( verOffset = nAgt.indexOf("Safari")) !== -1) {
                browserID = BrowserInfo["SAFARI"];
                fullVersion = nAgt.substring(verOffset + 7);
                if (( verOffset = nAgt.indexOf("Version")) !== -1)
                    fullVersion = nAgt.substring(verOffset + 8);
				
				//Added for worxweb as fullVersion will be empty when session is running inside UIWebview and hence reading applewebkit no
				if (fullVersion == "" && (verOffset = nAgt.indexOf("AppleWebKit")) !== -1)
                    fullVersion = nAgt.substring(verOffset + 12);
            }
            // In Firefox, the true version is after "Firefox"
            else if (( verOffset = nAgt.indexOf("Firefox")) !== -1) {
                browserID = BrowserInfo["FIREFOX"];
                fullVersion = nAgt.substring(verOffset + 8);
            } else {
                if (supportBasicFeature() === false) {
                    browserID = BrowserInfo["NONSUPPORTEDBROWSER"];
                } else {
                    browserID = BrowserInfo["OTHERS"];
                }
            }

            // trim the fullVersion string at semicolon/space if present
            if (( ix = fullVersion.indexOf(";")) !== -1) {
                fullVersion = fullVersion.substring(0, ix);
            }
            if (( ix = fullVersion.indexOf(" ")) !== -1) {
                fullVersion = fullVersion.substring(0, ix);
            }

            PlatformInfo["browserVersion"] = parseInt('' + fullVersion, 10);
            if (isNaN(PlatformInfo["browserVersion"])) {
                fullVersion = '' + parseFloat(navigator.appVersion);
                PlatformInfo["browserVersion"] = parseInt(navigator.appVersion, 10);
            }
            return browserID;
        }
        PlatformInfo["browserid"] = GetBrowser();
        PlatformInfo["OS"] = GetOS();
        myself.logger.writeLog(0,"SESSION:|:BROWSERINFO:|:navigator =" + navigator.userAgent);   
        HTML5Engine.getKeyName(OSInfo ,PlatformInfo["OS"] ,function(osname){
        	 myself.logger.writeLog(0,"SESSION:|:BROWSERINFO:|:os =" + osname);  
        });   
        HTML5Engine.getKeyName(BrowserInfo ,PlatformInfo["browserid"] ,function(browsername){
        	 myself.logger.writeLog(0,"SESSION:|:BROWSERINFO:|:browser =" + browsername + ";version=" + PlatformInfo["browserVersion"]);  
        });     
		
        switch(PlatformInfo["browserid"] ) {
            case BrowserInfo["MSIE"]:
                {
                    if (PlatformInfo["browserVersion"] < 10) {
                        errObj.errorInSessionWindow('receiver-brand', 'error-ie', null, null, 1);
                    }
                }
                break;
            case BrowserInfo["FIREFOX"]:
                {
                    if (PlatformInfo["browserVersion"] < 17) {
                        errObj.errorInSessionWindow('receiver-brand', 'error-firefox', null, null, 1);
                    }
                }
                break;
            case BrowserInfo["BB10"]:
                {
                    if (PlatformInfo["browserVersion"] < 10) {
                        errObj.errorInSessionWindow('receiver-brand', 'error-bb', null, null, 1);
                    }
                }
                break;
            case BrowserInfo["SAFARI"]:
                {
                    if (PlatformInfo["browserVersion"] < 6) {
                        errObj.errorInSessionWindow('receiver-brand', "error-safari", null, null, 1);
                    }
                }
                break;
            case BrowserInfo["NONSUPPORTEDBROWSER"]:
                {
                    errObj.errorInSessionWindow('receiver-brand', 'error-browser', null, null, 1);
                }
                break;
        }
		//Checking for both IE and Edge
        if (isMSBrowser(PlatformInfo["browserid"])) {
            isIE10 = true;
        }
    }

    isIE10 = false;
    isChromeOS = (((navigator.userAgent.search(/CrOS/i) !== -1) && (navigator.appVersion.search(/CrOS/i) !== -1) && (navigator.platform.search(/Linux/i) !== -1) ) ) ? true : false;
    setBrowserInfo();
    initializeDefaultParam();

	function initializefileArray() {
		thirdpartysourcefile.push(html5sessionInfo.sourcecode.thirdpartypath + 'Compiled/frameDecode.js');
		thirdpartysourcefile.push(html5sessionInfo.sourcecode.thirdpartypath + 'Compiled/speex.js');
		thirdpartysourcefile.push(html5sessionInfo.sourcecode.thirdpartypath + 'Compiled/vorbis.js');
		thirdpartysourcefile.push(html5sessionInfo.sourcecode.thirdpartypath + 'Compiled/jpeg-1.5.0.js');
        thirdpartysourcefile.push(html5sessionInfo.sourcecode.thirdpartypath + 'jstz/jstz.min.js');
        uithirdpartysourcefile.push(html5sessionInfo.sourcecode.thirdpartypath + "i18n/i18next-3.1.0.min.js");
		if(isChromeOS){
			uithirdpartysourcefile.push(html5sessionInfo.sourcecode.thirdpartypath + "PCSC/scard.js");
		}
		lnsourcefile.push(html5sessionInfo.sourcecode.localizationpath + "en.js");
        
        /*Configuration.js file is loaded in background.js file in case of chrome app and merged with configuration if any received from policy/storefront*/        
        if(!window.HTML5_CONFIG){
		    configsourcefile.push(html5sessionInfo['sourcecode']['configPath'] + "configuration.js");
        }		
		
        configsourcefile.push(html5sessionInfo.sourcecode.filepath + "configUtils.js");		
        
		cssfiles.push(html5sessionInfo.sourcecode.csspath + "ctxs.mainstyle.css");

        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "../Common/environment.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "../Common/dependency.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "../Common/TypeScriptStub.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "../Common/HTML5CommonInterface/HTML5Interface.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "../Common/Timezone/rules.dynamic.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "../Common/Timezone/rules.olsonToWindows.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "../Common/Timezone/timezone.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "../Common/CommonUtils.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "../Common/SeamlessMessage.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "../Common/SessionInfoManager.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "../Common/NetPromoters.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "../Common/CEIP.js");

		 HTML5OFFUSCATIONJSASSEMBLERSTARTTEB ;//do not remove used in JSAssembler
         mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/utils.js");
        mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/CtxDialog.js");
		mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/browserbox.js");
		mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/ui.js");
		mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/Toolbar.js");
		mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/CustomToolbar.js");
		mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/preferences.js");
		mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/GestureGuide.js");
		mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/Layout.js");		
		mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/DesktopAppSwitcher.js");
		mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/MobileAppSwitcher.js");
		mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/AppSwitcher.js");
		mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/ResolutionUtility.js");
        mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/ClipboardDialog.js");
		mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/CtxDialog/Logger/log.js");
		//mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "versionInfo.js");
		HTML5OFFUSCATIONJSASSEMBLERENDTEB;HTML5OFFUSCATIONJSASSEMBLERSTARTTEB;
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/WorkerCommand.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/NetworkMonitor.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/ChromeNetworkMonitor.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/ByteConverter.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/ByteWriter.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/Constants.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/Geometry.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/Dictionary.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/Profiler.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/Utility.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/Convert.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/OutputStream.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/NumberedObject.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/IntHashtable.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/Error.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/UiModule.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/ModuleParameter.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/ChannalMap.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/VirtualStream.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/OutputStream.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/NumberedObject.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/IntHashtable.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/Error.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/UiModule.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/CustomEvent.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/CryptoProvider.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/Timer.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/V3ReducedData.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/V3Coder.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/VirtualDriver.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Common/Queue.js");
		
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SeamlessUiManager/Common.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SeamlessUiManager/ClientWindowNotifier.js");        
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SeamlessUiManager/VirtualWinFrame.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SeamlessUiManager/ChromeRectManager.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SeamlessUiManager/virtualWindow.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SeamlessUiManager/HTML5UiManager.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SeamlessUiManager/UiManager.js");

		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/IcaThreadWrapper.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/CtxWrapper.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/CustomVCWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/UiWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/AudioWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/TWIWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/ClipBoardWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/CVCWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/FileVCWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/MRVCWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/SCardWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/SessionManagerWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/ReceiverManagerWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/EuemWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/PrinterWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/SerialWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/UsbWrapper.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/MultimediaWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/MultiTouchWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ReceiverManager/ReceiverManager.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ReceiverManager/ClipboardSeamlessManager.js");
	optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ReceiverManager/UsbSeamlessManager.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ReceiverManager/SessionContainer.js");

		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SessionManager/SessionManager.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SessionManager/ClipboardHelper.js");
	optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SessionManager/UsbHelper.js");

		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/ModuleWrapper/ThinwireWrapper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/MainWorkerManager.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/UI/ICAFrame.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/UI/RenderForm.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/UI/MediaEncoder.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/UI/KeyMapping.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Bitmap/Bitmap.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SurfaceRender/DisplayManager.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SurfaceRender/RenderSurfInterface.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SurfaceRender/NaclRenderer/NaclRenderer.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SurfaceRender/CanvasRenderer/CanvasRenderer.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SurfaceRender/WebGlRenderer/WebGLRenderer.js");

		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/CVC/CtlEngine.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/FileVC/FileVCEngine.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/MRVC/MRVCEngine.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/MultiTouch/MultiTouchEngine.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/MultiTouch/MtVcTouchData.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/SCard/SCardEngine.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/SCard/SCardConstants.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/SCard/SCardApiWrapper.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/SCard/SCardRequest.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/SCard/SCardResponse.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/SCard/SCardMonitor.js");

		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/cgpConstants.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/CGPCapability.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/CgpUtil.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/capabilities/BindCapability.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/capabilities/EndPointCapability.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/capabilities/KeepAliveCapability.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/capabilities/ReliabilityCapability.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/capabilities/SecurityTicketCapability.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/capabilities/ReliabilityParamsCapability.js");		

        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/cgpBuffer.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/CGPChannel.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/CGPService.js");

        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/services/TcpProxyService.js");


        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/CGPServiceToCore.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/CgpCore.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/CGP/CGPSocket.js");



		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/ProxyServerConnector.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/SocketConnection/ChromeSocket.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/SocketConnection/NetworkErrors.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/SocketConnection/websocket.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/SocksV5.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/TransportDriver/TransportDriver.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/IcaStack.js");

		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/ProtocolDriver/ProtocolDriver.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/ProtocolDriver/SecureConfiguration.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/ProtocolDriver/SecureICA/ProtocolConstants.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/ProtocolDriver/SecureICA/A_B_P1.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/ProtocolDriver/SecureICA/DH.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/ProtocolDriver/SecureICA/DiffieHellmanValues.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/ProtocolDriver/SecureICA/DiffieHellmanRC5Parameters.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/ProtocolDriver/SecureICA/RC5.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/ProtocolDriver/SecureICA/SecureICAProtocolDriver.js");


		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/Expander/Expander.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/Expander/NullExpander.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/Expander/V3ExpandedData.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/Expander/V3Expander.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/mouse.js");

		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Capability/Capability.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/Capability/CapabilityList.js");

		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/WinstationDriverConstants.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/WriteItem.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/HighThroughput.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/WinstationDriver.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/ChannelMonitor.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualWriteItem.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualWriteQueue.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/ICAWriteItem.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/WdDispatcher.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/WdStream.js");

		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/AudioStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/ClipboardStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/ProtocolDriverStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/ThinWireStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/TWIStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/VdmmStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/CtlStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/FileStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/MRVCStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/CustomVCStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/SCardStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/EuemStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/PrinterStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/SerialStack.js");
			optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/UsbStack.js");
			optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/VirtualDriverStack/MultiTouchStack.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/Reducer/NullReducer.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/Reducer/Reducer.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/Reducer/V3Reducer.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/Reducer/RedExOutputBuffer.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/WinstationDriver/Reducer/V3HeaderStore.js");

		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/SurfaceRender/WebGlRenderer/WebGLAPI.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/CoreAvcDecoder/DecoderCommand.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/CoreAvcDecoder/CoreAvcWorkerDecoder.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/CoreAvcDecoder/CoreAvcDecoder.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/CoreAvcDecoder/PPAPIDecoder.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Bitmap/CtxIndexColorModel.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Bitmap/GraphicsContext.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Bitmap/DirectFrameBuffer.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Bitmap/GridPainter.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/Tw2Capabilities.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/H264DecoderFactory.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/RleDecode.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/RleDecode8.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/RleDecodeByte.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/RleDecodeInt.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/CacheStream.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/Cache.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/LineGraphics.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/BlockGraphics.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/TextGraphics.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/ImageGraphics.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/PointerGraphics.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/TwWireStream.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/TwTwoDriver.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwAnyDriver.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/H264Renderer.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/FlowController.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/ThinwireEngine.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/ThinwireConstants.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/EUEM/EuemVcEngine.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/EUEM/EuemPacket.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/EUEM/EuemConstants.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/EUEM/EuemInfo.js");

		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/clipboard/ClipFormatConverter.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/clipboard/clipBoardEngine.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/AudioDriver/AudioEngine.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/AudioDriver/AudioPlayer.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/AudioDriver/AudioDecoderInterface.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/AudioDriver/audio_format.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/AudioDriver/Input/Adapter.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/AudioDriver/Input/AudioCapture.js");	optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/TWIDriver/TWIConstant.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/TWIDriver/TWIStruct.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/TWIDriver/TWIWire.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/TWIDriver/TWIWindowManager.js");
		


        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/TWIDriver/TWIEngine.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/TWIDriver/TWIProcessor.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/TWIDriver/seamlessUIInfo.js");



		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Printer/CpmConstant.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Printer/splwire.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Printer/splwirem.js");
        	optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Printer/PrintObject.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Printer/PrinterEngine.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Serial/SerialEngine.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Printer/PrintProcessor.js");
			optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Serial/SerialProcessor.js");
			optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Serial/CcmConstant.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Serial/ccmwire.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Serial/ccmwirem.js");

		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/AudioDriver/PCM_decoder.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/TwTwo/PointerUtil.js");
	optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Usb/UsbEngine.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Usb/descriptors.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Usb/transfers.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Usb/byteReader.js");
        
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Mmedia/CaptureDevice.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Mmedia/VdmmCapability.js");
        optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Mmedia/VdmmEngine.js");
		mainsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/initSession.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Globalization/TextMetrics.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Globalization/ImeTraits.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Globalization/ImeMarkPainter.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Globalization/ImeBuffer.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Globalization/ClientImeHandler.js");
		/*
		 * Preload some worker file
		 */
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/WebWorkerThread/Thread2.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "workerhelper.js");
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Main/VirtualDriver/Thinwire/CoreAvcDecoder/CoreAvcWorkerInterface.js");

		//should have different file if common file size increase much because of other files which
		//are not part of engine
		optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/HelperEngine/ChromeAppHelper/chromeAppHelper.js");

		// Load mobile related files for touch devices
			optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Mobile/MultiTouchHandler.js");
			optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Mobile/MobileUI.js");
			optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Mobile/MobileReceiverView.js");
			optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Mobile/MobileEventHandler.js");
			optionalsourcefile.push(html5sessionInfo.sourcecode.filepath + "Business/Mobile/GestureDetector.js");
			HTML5OFFUSCATIONJSASSEMBLERENDTEB ;//do not remove used in JSAssemble		

	}


}

HTML5Engine.setMobileZoom = function(maximumScale, minimumScale, userScalable) {
    var viewport = document.querySelector("meta[name=viewport]");
    if (maximumScale !== null && minimumScale !== null) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0,maximum-scale=' + String(maximumScale) + ',minimum-scale=' + String(minimumScale) + ', user-scalable=' + String(userScalable));
    } else {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0,user-scalable=1');
    }

};
HTML5Engine.getKeyName = function(obj, value,callback){
	for(var key in obj){
		if(obj.hasOwnProperty(key) && obj[key] === value){
			if(callback){
				callback (key);
				return;
			}
			
		}		
	}
	callback(null);
};

/*TODO : Move the code below to a common file while refactoring the code for service workers. 
Below code should be present before the connection to the server. 
*/

HTML5Engine.i18n = {};
HTML5Engine.i18n.init = function(lang, resources,callback){
	var i18nOptions = {            
		"useCookie" : false,
		"debug" : true,
		"lowerCaseLng" : true,
		"fallbackLng" : 'en',
		"lng" : lang,			
		"resources": resources,
		"interpolation": {"prefix": '__', "suffix": '__'},
		onerror : function() {
			callback();
		}
	};					
				
	i18next.init(i18nOptions, function() {			
		callback();
	});
};
HTML5Engine.i18n.getMessage = function(str,keyobj){
	if(!i18next || !i18next.t){
		if ((!localeString[str]) === true) {
            return str;
        } else {
			var rstr = localeString[str];
			if ( typeof keyobj === "Object")
				for (var k in keyobj) {
					var regex = new RegExp('__' + k + '__', 'g');
					rstr = rstr.replace(regex, keyobj[k]);
				}
			return rstr;
		}
	}
	if(str){
		if(keyobj){
			return i18next.t(str,keyobj);	
		}
		return i18next.t(str);	
	}
}
// wrap local storage for regular html5 and Chrome app
if (!window.chrome || !window.chrome.storage) {
    // Use global variable
	if (self && !self.ctxLocalStorage) {
		try {
			if (!self.localStorage) {
				self.ctxLocalStorage = {};
			} else {
				self.ctxLocalStorage = localStorage;
			}
		} catch (ex) {
			console.error(ex);
			self.ctxLocalStorage = {};
		}
	}
	HTML5Engine.localStorage = {
		getItem: function(key, callback) {
			try{
				var result = {};
				// if it is array, then get value for each of them
				if (Array.isArray(key)) {
					for (var i=0; i< key.length;i++) {
						var keyName = key[i];
						result[keyName] = self.ctxLocalStorage[keyName];
					}
				} else {
					result[key] = self.ctxLocalStorage[key];
				}
				
				callback && callback(result);
			}catch(ex){				
			}
		},
		setItem: function(key, val) {
			try{
				self.ctxLocalStorage[key] = val;
			}catch(ex){
			}
		}
	};
} else {
	HTML5Engine.localStorage = {
		getItem: function(key, callback) {
			chrome.storage.local.get(key, callback);
		},
		setItem: function(key, val) {
			var temp = {};
			temp[key] = val;
			chrome.storage.local.set(temp);
		}
	};

}
