var curReqId = null;
var cmdLine = null;
var craPrefs = null;
var ftaMappings = {};
var curAppId = null;
var fileExtension = null;
var rfconnector = null;
var d = new Date();
var accountSettings = "";
var accountSettingsPage = "";
var isFTA = false;
var CEIP;

var main_logInfo = {
	filename : 'Receiver',
	logseprator : ':|:',
	source : 'ChromeApp(0)',
	majorHigher : 'MainWindow',
	majorLower : 'RfConnector',
	state : '',
	type : '',
	minor : '',
	module : 'Main',
	comment : ''

};



self.html5LogEnabled = false;
UserConfiguration.localStorage.getItem("LOGENABLED", function(result) {
	if (result["LOGENABLED"] === "true") {
		self.html5LogEnabled = true;
	}
});

function writeMainWindowLog() {
	var log = main_logInfo.source + 
	main_logInfo.logseprator      + 
	main_logInfo.majorHigher      + 
	main_logInfo.logseprator      + 
	main_logInfo.majorLower       + 
	main_logInfo.logseprator      + 
	main_logInfo.state            + 
	main_logInfo.logseprator      + 
	main_logInfo.type             + 
	main_logInfo.logseprator      + 
	main_logInfo.minor            + 
	main_logInfo.logseprator      + 
	main_logInfo.module           + 
	main_logInfo.logseprator      + 
	main_logInfo.comment ;
	console.log(log);
	writeHTML5Log(0, log);
}

var notificationId = 'HTML5_CRA' + d.getTime();

var SSOCookieHelper = (function ssoCookieHelper(){
	var ssoExtId = "aoggjnmghgmcllfenalipjhmooomfdce"; // default Google Store App

	// send a request for a given url and set cookies
	function handleReq(request, onReqDone) {
		// Load webview element with request URL. Use same partition as Receiver to share cookies
		var	webviewElem = document.createElement("webview");
		webviewElem["partition"] = "persist:Rfweb";
		
		// We need to always callback after success or error so loadstop event is enough
		webviewElem.addEventListener("loadstop", function(e) {
			console.log("Done with request for: " + request.url);
			// we are done with webview
			document.body.removeChild(webviewElem);
			onReqDone();
		});
			
		// Set the cookies in response headers
		webviewElem.request["onHeadersReceived"].addListener(function (e) {
			var headers = e["responseHeaders"];
			if (e.type === "main_frame") {
				console.log("Updating cookies for url: " + e["url"]);
				var cookieList = request.cookieList;
				if (cookieList.length > 0) {
					for (var idx in cookieList) {
						// Set each cookie as Set-Cookie response header
						// Reference: https://msdn.microsoft.com/en-us/library/windows/desktop/aa384321(v=vs.85).aspx
						var cookie = cookieList[idx];
						var result = cookie["name"] + "=" + cookie["value"]; // set name
						if (cookie["expirationDate"]) { // set expiry
							var date = new Date(cookie["expirationDate"] * 1000);
							result += "; expires=" + date["toUTCString"]();
						}
						if (cookie["domain"]) { // set domain
							result += "; domain=" + cookie["domain"];
						}
						if (cookie["path"]) { // set path
							result += "; path=" + cookie["path"];
						}
						if (cookie["secure"] === true) { // set secure
							result += "; secure";
						}
						if (cookie["httpOnly"] === true) { // set secure
							result += "; httpOnly";
						}
						//console.log("trying to set-cookie with value: " + result);
						headers.push({"name" : "Set-Cookie", "value" : result});
					}
				}
			}
			
			// return final headers now
			return {
				"responseHeaders": headers
			};
		}, { urls: ["<all_urls>"] }, ['blocking', "responseHeaders"]);
		
		// start the actual request
		console.log("request received to set cookies for the URL: ", request);
		webviewElem.style.display = "none";
		webviewElem.src = request.url;
		document.body.appendChild(webviewElem); // this will be removed once we are done with request
	}
	
	// persist cookies to our main webview cookie store partition: RfWeb
	function persistCookies(cookies, onPersisted) {
		// Generate list of URL->cookie mappings.
		var reqUrls = {}, reqCount = 0;
		for (var idx = 0; idx < cookies.length; idx++) {
			var cookie = cookies[idx];
            if (!cookie) continue;
            
			var cookie_dom = cookie["domain"];
			if (cookie_dom[0] === ".") { // trim the leading dot.
				cookie_dom = cookie_dom.substr(1);
			}
			
			// Get URL from cookie
			var url = "http" + (cookie["secure"] ? "s" : "") + "://" + cookie_dom;
			if (!reqUrls[url]) {
				reqUrls[url] = [];
				reqCount++;
			}
			reqUrls[url].push(cookie); // add cookie to pending url request
		}
        
        // We are done if we have no requests
        if (reqCount === 0) {
            onPersisted();
            return;
        }
		
		// send request for each URL, set cookie on response and when all are done callback
		for (var key in reqUrls) {
			handleReq({url: key, cookieList: reqUrls[key]}, function() {
				if (--reqCount === 0) { // done with all reqs
					onPersisted();
				}
			});
		}
	}
	
	// get cookies from helper extension and persist them
	function update(ssoSettings, onUpdated) {
		// Update extension id if provided
		if (ssoSettings && ssoSettings["extensionId"] && ssoSettings["extensionId"] !== "" ) {
			ssoExtId = ssoSettings["extensionId"];
		}
		chrome.runtime["sendMessage"](
			ssoExtId,
			{ "method" : "getAllCookies" },
			function(response) {
				console.log("response received from SSO extension: ", response);
				if (response && response["cookies"]) {
					// set them on webview cookie store now and callback once done
					persistCookies(response["cookies"], onUpdated);
				} else {
					// no cookies, we are done. Most common case when nothing is configured.
					onUpdated();
				}
			}
		);
	}

	return {
		update : update
	};
})();

function RfWebConnector() {
	var WEBVIEWSTATUS = {};
	WEBVIEWSTATUS.NOT_STARTED = 0;
	WEBVIEWSTATUS.IN_PROGRESS = 1;
	WEBVIEWSTATUS.ON_ERROR = 2;
	WEBVIEWSTATUS.ON_LOADCOMPLETE = 3;
	function UiEngine() {
		var webViewSetting = {};
		webViewSetting.callback = {};
		webViewSetting.callback.loadWebViewSucceed = null;
		webViewSetting.callback.loadWebViewFailure = null;
		webViewSetting.callback.onwebviewstatuschange = null;
		webViewSetting.urlObj = {};
		webViewSetting.urlObj.url = null;
		webViewSetting.urlObj.type = null;
		webViewSetting.icaPingSent = true;
		webViewSetting.loaded = null;
		webViewSetting.status = null;
		webViewSetting.errorObj = null;
		webViewSetting.statusSent = false;
		webViewSetting.loadExpireTimer = null;
		webViewSetting.maxloadtime = 3 * 60 * 1000;
		webViewSetting.expectedRequestId = -1;
		var webViewElement = null;
		var rootElementId = "body";
		var rootElement = null;
		var webviewLoadCounter = 0;
		var urlRequestString = "requestId";

		//Get the ICA data instead of downloading ICA file (for older SFs)
		function WebviewMessageHandler() {
			function MainparseIcaData(ICAdata, keyVals) {
				if (ICAdata && keyVals) {
					if (ICAdata.indexOf('\x5c\x72') == -1) {
						var dataArry = ICAdata.split('\x5c\x6e');
					} else {
						var dataArry = ICAdata.split('\x5c\x72\x5c\x6e');
					}
					for (var i = 0; i < dataArry.length; i++) {
						var nameValue = dataArry[i].split('=', 2);
						if (nameValue.length === 2) {
							keyVals[nameValue[0]] = nameValue[1];
						}
						if (nameValue[0] === "LaunchReference") {
							var index = dataArry[i].indexOf('=');
							var value = dataArry[i].substr(index + 1);
							keyVals[nameValue[0]] = value;
						}
					}
				}
			}

			var ParentWindow;
			this.addEventListener('message', function(e) {
				ParentWindow = e.source;
				var LocationOrigin = e.origin;
				var data = e.data;
				if (data.type == 'FetchIca') {
					var oReq = new XMLHttpRequest();
					oReq.withCredentials = true;
					oReq.onload = function(event) {
						var icaDoc = oReq.response;
						if (icaDoc && (icaDoc.toString().match('\x5e\x5c\x5c\x5b') === null || icaDoc.toString().match('\x5e\x5c\x5c\x5b')[0] !== '[')) {
							// Data returned is not an ICA file (happens when launch fails, e.g., licensing server issue etc...)
							console.log("Data returned is not an ICA file");
							return;
						} else {
							var keyICA = {};
							MainparseIcaData(icaDoc, keyICA);
							if (ParentWindow) {
								var PostMessageVar = {
									'ICAFile' : keyICA,
									'type' : "ICAData"
								};
								ParentWindow.postMessage(PostMessageVar, LocationOrigin);
							}
						}
					};
					oReq.onerror = function(event) {
						if (ParentWindow) {
							var PostMessageVar = {
								'error' : "GeneralAppLaunchError",
								'type' : "ICAData"
							};
							ParentWindow.postMessage(PostMessageVar, LocationOrigin);
						}
					};
					oReq.ontimeout = function(event) {
						if (ParentWindow) {
							var PostMessageVar = {
								'error' : "GeneralAppLaunchError",
								'type' : "ICAData"
							};
							ParentWindow.postMessage(PostMessageVar, LocationOrigin);
						}
					};
					oReq.open("GET", data.url, true);
					oReq.send();
				}
			}, false);
		}

		function adjustSize() {
			var windowWidth, windowHeight;
			chrome.system.display['getInfo'](function(displayInfo){
			  var isUnifiedMode = g.Utils.getUnifiedDisplayBounds(displayInfo).isUnifiedMode;
				if(isUnifiedMode){
					for(var i=0;i<displayInfo.length;i++){
						if(displayInfo[i]['isPrimary'] == true){
							windowWidth = displayInfo[i].bounds.width+ 'px';
							windowHeight = window.innerHeight+'px';
							break;
						}						
					}
				}else{
				  windowWidth = window.innerWidth+'px';
				  windowHeight = window.innerHeight+'px';
				}

				var parentDiv = document.getElementById('parent');
				parentDiv.style.maxWidth = windowWidth;
				parentDiv.style.maxHeight = windowHeight;
				if (webViewElement != null && !webViewElement['is_hide']) {
					webViewElement.style.maxWidth = windowWidth;
					webViewElement.style.maxHeight = windowHeight;
					webViewElement.style.width = "100%";
					webViewElement.style.height = "100%";
				}
			});
		}

		function resize() {
			adjustSize();
		};

		this.processCommand = function(cmdObj) {
			if (cmdObj.cmd == "start") {
				start(cmdObj.data);
			} else if (cmdObj.cmd == "resize") {
				resize(cmdObj.data);
			} else if (cmdObj.cmd == 'loadwebview') {
				loadWebViewWithURL(cmdObj.data);
			} else if (cmdObj.cmd == "displayWebView") {
				displayWebView(cmdObj.data);
			} else if (cmdObj.cmd == "displayspinner") {
				displaySpinner(cmdObj.data);
			} else if (cmdObj.cmd == "postmessage") {
				sendMessage(cmdObj.data);
			} else if (cmdObj.cmd == "callback") {
				registerCallback(cmdObj.data);
			}
		};
		function registerCallback(dataObj) {
			if (dataObj.type == 'func') {
				if (dataObj.key == 'webviewsuccess') {
					webViewSetting.callback.loadWebViewSucceed = dataObj.value;
				} else if (dataObj.key == 'webviewerror') {
					webViewSetting.callback.loadWebViewFailure = dataObj.value;
				} else if (dataObj.key == 'webviewchangestatus') {
					webViewSetting.callback.onwebviewstatuschange = dataObj.value;
				} else if (dataObj.key == 'onchangeurl') {
					webViewSetting.callback.onwebviewURLchange = dataObj.value;
                   } else if (dataObj.key == 'onloadurl') {
                        webViewSetting.callback.onwebviewURLLoad = dataObj.value;
				}

			}
		}

		function sendMessage(dataObj) {
			if (webViewElement) {
				var origin = dataObj.origin;
				if (dataObj.origin == "self" || !dataObj.origin) {
					origin = getDomain(webViewElement.src);
				}
				webViewElement.contentWindow.postMessage(dataObj.data, origin);
			}
		}

		function displaySpinner(dataObj) {
			if (dataObj.is_hide == true) {
				hideSpinner();
			} else if (dataObj.is_hide == false) {
				showSpinner();
			}
		}

		function displayWebView(dataObj) {
			if (dataObj.is_hide == true) {
				hideWebview();

			} else if (dataObj.is_hide == false) {
				showWebview();

			}
		}

		function changeWebViewStatus(status, isToSend) {
			webViewSetting.status = status;
			if (isToSend != false) {
				webViewSetting.callback.onwebviewstatuschange(status);
			}
		}

		function changeWebURLObj(urlObj, isToSend) {
			webViewSetting.urlObj = urlObj;
			if (isToSend == true) {
				webViewSetting.callback.onwebviewURLchange(urlObj);
			}
		}

          function changeWebloadURL(url) {
              if(webViewSetting.callback.onwebviewURLLoad)
                   webViewSetting.callback.onwebviewURLLoad(url);

          }

		function sendSuccessStatus() {
			cancelloadTimer();
			if (webViewSetting.statusSent == false) {
				webViewSetting.statusSent = true;
				webViewSetting.callback.loadWebViewSucceed(webViewSetting.urlObj);
			}
		}

		function checkExpireForLoad() {
			webViewSetting.loadExpireTimer = setTimeout(function() {
				onloadTimerExpire();
			}, webViewSetting.maxloadtime);
		}

		function cancelloadTimer() {
			if (webViewSetting.loadExpireTimer != null) {
				clearTimeout(webViewSetting.loadExpireTimer);
			}
		}

		function onloadTimerExpire() {
			if (webViewSetting.statusSent == false && webViewSetting.status == WEBVIEWSTATUS.IN_PROGRESS) {
				sendFailureStatus();
			}
		}

		function sendFailureStatus() {
			cancelloadTimer();
			if (webViewSetting.statusSent == false) {
				webViewSetting.statusSent = true;
				if (!webViewSetting.errorObj) {
					webViewSetting.errorObj = {
						type : "unknown",
						error : "unknown"
					};
				}
				webViewSetting.callback.loadWebViewFailure(webViewSetting.urlObj, webViewSetting.errorObj);
			}
		}

		function loadWebViewWithURL(dataObj) {
			if (webViewElement.setUserAgentOverride && webViewElement.getUserAgent) {
				var UserAgentString = webViewElement.getUserAgent();
				UserAgentString = UserAgentString.replace('CrOS', 'Windows');
				if(UserAgentString.indexOf('CitrixChromeApp')==-1){
					UserAgentString = UserAgentString + ' CitrixChromeApp';
					// NSG doesn't like CitrixReceiver version due to some reason will add it later.
					/*var chromeAppVersion = chrome.runtime.getManifest();
					chromeAppVersion = chromeAppVersion['version'];
					if(chromeAppVersion)
						UserAgentString = UserAgentString +" CitrixReceiver/"+chromeAppVersion;*/
					webViewElement.setUserAgentOverride(UserAgentString);
				}
			}
			var urlObj = dataObj.urlObj;
			main_logInfo.state = 'connecting', main_logInfo.comment = 'JSON={  url:"' + urlObj.url + '"}=';
			writeMainWindowLog();
			var urlRequestInfo = parseUrl_requestId(webViewSetting.urlObj.url);
			var skipToLoad = (webViewSetting.loaded == true) && urlRequestInfo.url && checkURL(urlRequestInfo.url, urlObj.url);
			cancelloadTimer();
			changeWebURLObj(urlObj, true);
			var needToReload = urlRequestInfo.url && checkURL(urlRequestInfo.url, urlObj.url);
			if (skipToLoad == true) {
				changeWebViewStatus(WEBVIEWSTATUS.ON_LOADCOMPLETE);
				main_logInfo.state = 'connecting', main_logInfo.comment = 'JSON={  url:"' + urlObj.url + '" }= ;+ STR={"Already Connected"}=';
				writeMainWindowLog();
				if (webViewSetting.callback.loadWebViewSucceed) {
					webViewSetting.callback.loadWebViewSucceed(webViewSetting.urlObj);
				}
				changeWebloadURL(webViewElement.src);
				return;
			}
			webViewElement.addEventListener("loadstart", function(e) {
				main_logInfo.comment = 'STR={webview loadstart for url: ' + e["url"] + '}=';
				writeMainWindowLog();
			});
			webViewElement.addEventListener("contentload", function(e) {
			});
			webViewElement.addEventListener("exit", function(e) {
			});
			webViewElement.addEventListener("loadabort", function(e) {
				main_logInfo.comment = 'STR={webview loadabort for url: ' + e["url"] + '}=';
				writeMainWindowLog();
			});
			webViewElement.addEventListener("loadcommit", function(e) {
			});
			webViewElement.addEventListener("responsive", function(e) {
			});
			webViewElement.addEventListener("unresponsive", function(e) {
			});
			webViewElement.addEventListener("dialog", function(e) {
			});
			webViewElement.addEventListener("loadstop", function(e) {
				main_logInfo.comment = 'STR={webview loadstop. webview status: ' + webViewSetting.status + '}=';
				writeMainWindowLog();
				
				if (webViewSetting.status == WEBVIEWSTATUS.IN_PROGRESS) {
					checkExpireForLoad();
				} else if (webViewSetting.status == WEBVIEWSTATUS.ON_LOADCOMPLETE) {
					sendSuccessStatus();
				} else if (webViewSetting.status == WEBVIEWSTATUS.ON_ERROR) {
					sendFailureStatus();
				}
				if (webViewSetting.icaPingSent != true) {
					sendMessage({
						data : "ICA",
						origin : 'self'
					});
					webViewSetting.icaPingSent = true;
				}

			});
			
			changeWebViewStatus(WEBVIEWSTATUS.IN_PROGRESS);
			webViewSetting.loaded = false;
			webViewSetting.icaPingSent = true;
			webViewSetting.errorObj = null;
			webViewSetting.statusSent = false;
			if (needToReload == true) {
				webViewSetting.expectedRequestId = webViewElement['REQUESTID'];
				// When webView.reload is called userAgent of webview is set to default one.
				//so session is launched in browser
				//ChromeOS updates userAgent and reloads webview only when its source is changed
				webViewElement.src = webViewElement.src;
				//webViewElement.reload();
			} else {
				var temp = urlObj.url;
				var delimiter = '#';
				if (temp.indexOf(delimiter) !== -1) {
					var url1 = temp.split(delimiter);
					webViewElement.src = url1[0] + delimiter + urlRequestString + '=' + webviewLoadCounter + "&" + url1[1];
				} else {
					webViewElement.src = urlObj.url + delimiter + urlRequestString + '=' + webviewLoadCounter;
				}
				webViewElement['HTML5CURRENTURL'] = urlObj.url;
				webViewElement['REQUESTID'] = webviewLoadCounter;
				webViewSetting.expectedRequestId = webviewLoadCounter;
			}
			webviewLoadCounter++;
		}

		function parseUrl_requestId(url1) {

			var requestId = null;
			var url = null;
			if (url1) {
				var res = url1.split("#");
				url = res[0];
				if (res[1]) {
					var res1 = res[1].split("=");
					if (res1[0] == urlRequestString) {
						requestId = parseInt(res1[1]);
					}
				}
			}
			return {
				url : url1,
				requestid : requestId
			};
		}

		function showWebview() {
			if (webViewElement && (webViewElement['is_hide'] == true || !webViewElement['is_hide'])) {
				CtxMessage.hideEmbeddedError();				
				webViewElement.style.display = "block";
				webViewElement['is_hide'] = false;
				adjustSize();
				webViewElement.focus();
			}

		}

		function hideWebview() {
			if (webViewElement && (webViewElement['is_hide'] == false || !webViewElement['is_hide'])) {
				webViewElement.style.display = "none";
				webViewElement['is_hide'] = true;
			}
		}

		function hideSpinner() {
			var pspinner = document.getElementById("main_pspinner");
			if (pspinner != undefined && (pspinner.isVisible == true || !pspinner.isVisible)) {
				pspinner.style.visibility = "hidden";
				pspinner.isVisible = false;
			}
		}

		function showSpinner() {
			var pspinner = document.getElementById("main_pspinner");
			if (pspinner != undefined && (pspinner.isVisible == false || !pspinner.isVisible)) {
				pspinner.style.visibility = "visible";
				pspinner.isVisible = true;
			}
		}

		function start(config) {
			if (config && config.rootElementId) {
				rootElementId = config.rootElementId;
			} else {
				rootElementId == "body";
			}
			webViewElement = createWebViewElement();
			hideWebview();
			if (rootElementId == "body") {
				rootElement = document.body;
			} else {
				rootElement = document.getElementById(rootElementId);
			}
			adjustSize();
			rootElement.appendChild(webViewElement);
		};

		function createWebViewElement() {
			var webViewElement1 = document.createElement("webview");
			webViewElement1.tabIndex = "0";
			webViewElement1.id = "WRFrame";
			webViewElement1["partition"] = "persist:Rfweb";
			//OnComplete handler
			webViewElement1.request.onCompleted.addListener(function(e) {
				if (e.type === "main_frame") {
					if (webViewSetting.status == WEBVIEWSTATUS.ON_ERROR) {
						return;
					}

					main_logInfo.state = 'Connected', main_logInfo.comment = 'JSON={  url:"' + e['url'] + '" , ip:"' + e['ip'] + '" ,statusCode:"' + e['statusCode'] + '"}= ;';
					writeMainWindowLog();
					var urlRequestInfo = parseUrl_requestId(e['url']);
					if (e['statusCode'] == 200) {
						webViewSetting.icaPingSent = false;
					}
					if ((!(urlRequestInfo.requestid == webViewSetting.expectedRequestId) )) {
						//return;
					}
					webViewSetting.expectedRequestId = -1;
					if (e['statusCode'] == 200) {
						if (webViewSetting.callback.loadWebViewSucceed) {
                                  changeWebloadURL(e['url']);
							changeWebViewStatus(WEBVIEWSTATUS.ON_LOADCOMPLETE);
							webViewSetting.loaded = true;
						}
					} else {
						var errorObj = {
							type : "onCompleted",
							error : e['statusCode']
						};
						changeWebViewStatus(WEBVIEWSTATUS.ON_ERROR);
						webViewSetting.loaded = false;
						webViewSetting.errorObj = errorObj;
					}

				}
			}, {
				urls : ["<all_urls>"]
			});

			webViewElement1.request.onErrorOccurred.addListener(function(e) {
				if (e.type === "main_frame") {
					var urlRequestInfo = parseUrl_requestId(e['url']);
					main_logInfo.state = 'Disconnected', main_logInfo.comment = 'JSON={  url:"' + e['url'] + '", + error:"' + e['error'] + '"}= ;';
					writeMainWindowLog();
					if (webViewSetting.callback.loadWebViewFailure && (urlRequestInfo.requestid == webViewSetting.expectedRequestId)) {
						webViewSetting.expectedRequestId = -1;
						var errorObj = {
							type : 'onErrorOccurred',
							error : e['error']
						};
						changeWebViewStatus(WEBVIEWSTATUS.ON_ERROR);
						webViewSetting.loaded = false;
						webViewSetting.errorObj = errorObj;
					}
				}

			}, {
				urls : ["<all_urls>"]
			});
			
			// Allow file downloads so that older RfWeb or WI can download ICA file.
			webViewElement1.addEventListener('permissionrequest', function(e) {
				if (e.permission === 'download') {
					var icaURL = e.url;
					var checkURL = icaURL.split('?');
					var rExp = /\.cr$/;
					if (rExp.test(checkURL[0])) {
						e.request.allow();
					} else {
						var postMessageVar = {
							type : "FetchIca",
							url : icaURL,
						};
						sendMessage({
							data : postMessageVar,
							origin : 'self'
						});
						e.request.deny();
					}
				}
			});
			webViewElement1.addEventListener('contentload', function() {
				var reloadButton = document.getElementById('reload_settings');
				if(reloadButton){
					reloadButton.style.display = 'block';
				}
				webViewElement1.executeScript({
					code : generateScriptText(WebviewMessageHandler)
				});
			});
			// Allow new window open by RfWeb - required for published content in XA
			webViewElement1.addEventListener('newwindow', function(e) {
				var url = e["targetUrl"];
				e.preventDefault();
				// Allow the urls to be opened from rfweb like 3rd party notices, published content etc
				if (url && url !== 'about:blank') {
					window.open(url);
				}
			});

			// Override user agent. From Chrome 34 onwards.
			if (webViewElement1.setUserAgentOverride && webViewElement1.getUserAgent) {
				var UserAgentString = webViewElement1.getUserAgent();
				UserAgentString = UserAgentString.replace('CrOS', 'Windows');
				webViewElement1.setUserAgentOverride(UserAgentString + ' CitrixChromeApp');
			}
			return webViewElement1;
		}

	}

	function checkURL(url1, url2) {
		var url1 = url1.toLowerCase();
		var url2 = url2.toLowerCase();
		var result = false;

		if (url1 === url2) {
			result = true;
		} else if (url1 === url2 + '/') {
			result = true;
		} else if (url2 === url1 + '/') {
			result = true;
		}
		return result;
	}

	//used per store
	var beaconsetting = null;
	var main_beaconsetting = {};
	main_beaconsetting.enable = true;
	main_beaconsetting.ping = {};
	main_beaconsetting.ping.enable = true;
	main_beaconsetting.ping.afterconnect = true;
	main_beaconsetting.ping.timeInterval = 60000;
	main_beaconsetting.fncall = {};
	main_beaconsetting.fncall.serverReachablefn = null;
	main_beaconsetting.accessType = {};
	main_beaconsetting.accessType.internal = {
		enable : true,
		usebeacon : true
	};
	main_beaconsetting.accessType.external = {
		enable : true,
		usebeacon : true,
		minimal : false
	};
	var currentStore = null;
	var currentSetting = {};
	currentSetting.connect = {};
	currentSetting.webView = {};
	currentSetting.webView.urlObj = {};
	currentSetting.webView.urlObj.url = null;
     currentSetting.webView.urlObj.finalLoadedUrl = null;
	currentSetting.webView.urlObj.type = null;
	currentSetting.webView.urlPending = true;
	currentSetting.webView.status = WEBVIEWSTATUS.NOT_STARTED;
	currentSetting.storexhrTime = -1;
	currentSetting.forceToReconnect = false;
	var networkStatus = {};
	networkStatus.finalStateProcessed = false;
	networkStatus.responseArray = [];
	networkStatus.isXHRPending = [];
	networkStatus.requestArray = [];
	networkStatus.checkedinwebview = [];
	networkStatus.ping = {};
	networkStatus.ping.currentState = null;
	networkStatus.ping.currentConnection = {};
	networkStatus.ping.requestArray = [];
	networkStatus.ping.responseArray = [];
	networkStatus.ping.pingCounter = 0;
	networkStatus.ping.networklist = [];
	networkStatus.ping.statusTimer = null;
	networkStatus.ping.statusTimerSequece = [];
	networkStatus.ping.statusTimerSequece['no_session'] = [{
		type : 'xhr',
		count : 1,
		interval : 5000
	}, {
		type : 'networklist',
		count : 1,
		interval : 5000
	}];
	networkStatus.ping.statusTimerSequece['with_session'] = [{
		type : 'xhr',
		count : 1,
		interval : main_beaconsetting.ping.timeInterval
	}, {
		type : 'networklist',
		count : 1,
		interval : 5000
	}];
	networkStatus.ping.currentTimerSequece = networkStatus.ping.statusTimerSequece['no_session'];
	networkStatus.ping.statusTimerState = {
		index : 0,
		count : 0
	};
	networkStatus.ping.statusTimerXHR = -1;

	var checkstate = 'Default';
	var onlineStatus;
	var reconnectTimerOnLine = null;
	var reconnectTimeOnLine = 100;
	var lastNetworkDetect = -1;

	var myself = this;

	var uiEngine = new UiEngine();
	this.start = function(config) {
		onlineStatus = config.onlinestatus;
		uiEngine.processCommand({
			cmd : 'callback',
			data : {
				type : 'func',
				key : 'webviewsuccess',
				value : loadWebViewSuccess
			}
		});
		uiEngine.processCommand({
			cmd : 'callback',
			data : {
				type : 'func',
				key : 'webviewerror',
				value : loadWebViewFailed
			}
		});
		uiEngine.processCommand({
			cmd : 'callback',
			data : {
				type : 'func',
				key : 'webviewchangestatus',
				value : webViewStatusChange
			}
		});
		uiEngine.processCommand({
			cmd : 'callback',
			data : {
				type : 'func',
				key : 'onchangeurl',
				value : webViewURLChange
			}
		});

		uiEngine.processCommand({
              cmd : 'callback',
              data : {
                   type : 'func',
                   key : 'onloadurl',
                   value : webViewURLLoaded
              }
          });

          uiEngine.processCommand({
			cmd : 'start',
			data : config
		});
		uiEngine.processCommand({
			cmd : 'displayspinner',
			data : {
				is_hide : false
			}
		});
		uiEngine.processCommand({
			cmd : 'displayWebView',
			data : {
				is_hide : true
			}
		});

	};
	this.setStore = function(store) {
		main_logInfo.state = 'connecting', main_logInfo.comment = 'JSON={store:"' + JSON.stringify(store) + '"}=';
		writeMainWindowLog();
		checkstate = 'Default';
		var timenow = Date.now.bind(Date);
		currentSetting.forceConnectTime = timenow();
		currentStore = store;
		beaconsetting = JSON.parse(JSON.stringify(main_beaconsetting));
	};

	this.changeNetWorkStatus = function(status) {
		var timeNow = Date.now.bind(Date);
		lastNetworkDetect = timeNow();
		if (status != onlineStatus) {
			onlineStatus = status;
			if (reconnectTimerOnLine == null) {
				reconnectTimerOnLine = setTimeout(function() {
					reConnect();
				}, reconnectTimeOnLine);
			}
		}
	};
	function reConnect() {
		reconnectTimerOnLine = null;
		if (onlineStatus == 'online') {
			myself.reConnection(lastNetworkDetect);
		} else {
			myself.reConnection(-1);
		}
	}

	function removeReconnectionTimer() {
		if (reconnectTimerOnLine) {
			clearTimeout(reconnectTimerOnLine);
			reconnectTimerOnLine = null;
		}
		if (networkStatus.ping.statusTimer) {
			clearTimeout(networkStatus.ping.statusTimer);
			networkStatus.ping.statusTimer = null;
		}
	}


	this.getCurrentUrl = function() {
		var rvalue = null;
          if (currentSetting.webView.urlObj.finalLoadedUrl) {
              rvalue = currentSetting.webView.urlObj.finalLoadedUrl;
		}
		return rvalue;
	};
	this.sendRfMessage = function(data, origin) {
		uiEngine.processCommand({
			cmd : 'postmessage',
			data : {
				data : data,
				origin : origin
			}
		});
	};
	this.resize = function() {
		uiEngine.processCommand({
			cmd : 'resize',
			data : null
		});
	};
	
	//To show or hide the webview containing RF web page for kiosk.
	this.displayRFPageWebview = function(isHide){
		uiEngine.processCommand({
			cmd : 'displayWebView',
			data : {
				is_hide : isHide
			}
		});
	};

	function reallocate() {
		networkStatus.responseArray = [];
		networkStatus.isXHRPending = [];
		networkStatus.requestArray = [];
		networkStatus.checkedinwebview = [];
		networkStatus.finalStateProcessed = false;
		currentSetting.forceToReconnect = false;
		currentSetting.webView.urlPending = false;
		var count = Math.floor(beaconsetting.ping.timeInterval / 5000);
		networkStatus.ping.statusTimerSequece['no_session'][1].count = Math.floor(count / 2) + 1;
		networkStatus.ping.statusTimerSequece['with_session'][1].count = count + 1;
		if (beaconsetting.enable == true) {
			beaconsetting.fncall.serverReachablefn = Utils.isServerReachable;
		} else {
			alwaysPingable();
			beaconsetting.accessType.internal.usebeacon = false;
			beaconsetting.accessType.external.usebeacon = false;
			beaconsetting.accessType.external.minimal = true;
			beaconsetting.ping.enable = false;
		}
		if (beaconsetting.accessType.external.enable == false) {
			beaconsetting.accessType.external.usebeacon = false;
			beaconsetting.accessType.external.minimal = false;
		}
		if (beaconsetting.accessType.internal.enable == false) {
			beaconsetting.accessType.internal.usebeacon = false;
		}

	}

	function alwaysPingable() {
		beaconsetting.fncall.serverReachablefn = Utils.alwaysServerReachable;
		beaconsetting.ping.afterconnect = false;
	}


	this.reConnection = function(time) {
		if (!currentStore) {
			loadPreferenceEngine();
			return;
		}
		if (onlineStatus == 'offline') {
			currentSetting.storexhrTime = -1;
			removeReconnectionTimer();
			currentSetting.forceToReconnect = false;
			checkAndreload();
			return;
		}
		if (!time) {
			var temp = Date.now.bind(Date);
			time = temp();
		}
		if (time < currentSetting.storexhrTime) {
			return;
		}
		if (checkstate != 'Default' && checkstate != 'DefaultError') {
			currentSetting.forceToReconnect = true;
			currentSetting.forceConnectTime = time;
			return;
		}
		currentSetting.storexhrTime = time;
		main_logInfo.state = 'Connecting', main_logInfo.comment = 'JSON={  timestamp:"' + currentSetting.storexhrTime + '"}= ;';
		writeMainWindowLog();
		reallocate();
		removeReconnectionTimer();
		createRequestarray();
		removeUnnecessaryInfo();
		checkWebViewStatus('rfweb');
		reStartUI();
		checkAvailability(networkStatus.requestArray, serverReachable, serverUnReachable);
		checkAndreload();
	};
	function removeUnnecessaryInfo() {
		if (networkStatus.requestArray.length == 1) {
			beaconsetting.ping.afterconnect = false;
		}

	}

	function checkWebViewStatus(type) {
		var urlObj = currentSetting.webView.urlObj;
		var rvalue = 'NOTSTARTED';
		if (currentSetting.webView.urlPending == true || (urlObj.type == type && currentSetting.webView.urlObj.timestamp == currentSetting.storexhrTime)) {
			if (currentSetting.webView.status == WEBVIEWSTATUS.IN_PROGRESS || currentSetting.webView.urlPending == true || networkStatus.isXHRPending[urlObj.arrIndex] == true) {
				rvalue = 'IN_PROGRESS';
			} else if (currentSetting.webView.status == WEBVIEWSTATUS.ON_LOADCOMPLETE) {
				rvalue = 'LOADED';
			} else if (currentSetting.webView.status == WEBVIEWSTATUS.NOT_STARTED) {
				rvalue = 'NOTSTARTED';
			} else {
				rvalue = 'ERROR';
			}
		} else {
			currentSetting.webView.status = WEBVIEWSTATUS.NOT_STARTED;
			if (currentSetting.webView.urlObj.timestamp != currentSetting.storexhrTime) {
				if (isInBeaconPresent(networkStatus) == true) {
					checkstate = 'SF_INBEACON';
				} else if (isRfPresent(networkStatus) == true) {
					checkstate = 'SF_ONLY';
				} else if (isExBeaconPresent(networkStatus) == true) {
					checkstate = 'AG_EXBEACON';
				} else if (isAgPresent(networkStatus) == true) {
					checkstate = 'AG_ONLY';
				} else {
					console.log("invalid configuration");
				}
			}

			rvalue = 'NOTSTARTED';
		}
		return rvalue;
	}

	function showErorMessage(textheader, message, bText, isModal,messageParam) {
		if(message !== "networkUnreachable"){
			//Reset NPS for SF error.
			NetPromoters.onError();
		}
	
		if(messageParam){
		
			CtxMessage.showEmbeddedError(chrome.i18n.getMessage(textheader), chrome.i18n.getMessage(message,[chrome.i18n.getMessage(messageParam)]), chrome.i18n.getMessage(bText), isModal, function() {
			});
			
		}else{
		
			CtxMessage.showEmbeddedError(chrome.i18n.getMessage(textheader), chrome.i18n.getMessage(message), chrome.i18n.getMessage(bText), isModal, function() {
			});
		}
	}

	function reStartUI() {
		CtxMessage.hideEmbeddedError();
		uiEngine.processCommand({
			cmd : 'displayWebView',
			data : {
				is_hide : true
			}
		});
		uiEngine.processCommand({
			cmd : 'displayspinner',
			data : {
				is_hide : false
			}
		});

	}


	function checkAndreload() {
		var urlObj;
		if (onlineStatus == 'offline' && checkstate != 'DefaultError') {
			checkstate = 'ERROR';
		}
		switch(checkstate) {
			case 'SF_INBEACON':
				var status = checkWebViewStatus('rfweb');
				if (status == 'NOTSTARTED') {
					var success = loadNextURL('rfweb');
					if (success == false) {
						checkstate = 'ERROR';
						checkAndreload();
					}
				} else if (status == 'LOADED') {
					if (isInBeaconPresent(networkStatus) == true && isInBeaconReachable(networkStatus) == 'N') {
						if (isAgPresent(networkStatus) == true) {
							if (isExBeaconPresent(networkStatus)) {
								checkstate = 'AG_EXBEACON';
								checkAndreload();
							} else {
								checkstate = 'AG_ONLY';
								checkAndreload();
							}
						} else {
							checkstate = 'ERROR';
							checkAndreload();
						}

					} else if (isInBeaconPresent(networkStatus) == true && isInBeaconReachable(networkStatus) == 'YN') {
						return;
					} else {
						checkstate = "SUCCESS";
						checkAndreload();
					}
				} else if (status == 'IN_PROGRESS') {
					return;
				} else {
					if (isInBeaconPresent(networkStatus) == true && isInBeaconReachable(networkStatus) == 'N') {
						if (isAgPresent(networkStatus) == true) {
							if (isExBeaconPresent(networkStatus)) {
								checkstate = 'AG_EXBEACON';
								checkAndreload();
							} else {
								checkstate = 'AG_ONLY';
								checkAndreload();
							}
						} else {
							checkstate = 'ERROR';
							checkAndreload();
						}
					} else if (isInBeaconPresent(networkStatus) == true && isInBeaconReachable(networkStatus) == 'Y') {
						if (isRfReachable(networkStatus) != true) {
							checkstate = 'ERROR';
							checkAndreload();
						}
					} else if (isInBeaconPresent(networkStatus) == false) {

						if (isAgPresent(networkStatus) == false) {
							checkstate = 'ERROR';
							checkAndreload();
							//show error as only setting is storefront
						} else if (isExBeaconPresent(networkStatus) == true) {
							checkstate = 'AG_EXBEACON';
							checkAndreload();
						} else {
							checkstate = 'AG_ONLY';
							checkAndreload();
						}
					}
				}
				break;
			case 'SF_ONLY':
				var status = checkWebViewStatus('rfweb');
				if (status == 'NOTSTARTED') {
					var success = loadNextURL('rfweb');
					if (success == false) {
						checkstate = 'ERROR';
						checkAndreload();
					}
				} else if (status == 'LOADED') {
					checkstate = "SUCCESS";
					checkAndreload();
				} else if (status == 'IN_PROGRESS') {
					return;
				} else {
					if (isAgPresent(networkStatus) == false) {
						checkstate = 'ERROR';
						checkAndreload();
						//show error as only setting is storefront
					} else if (isExBeaconPresent(networkStatus) == true) {
						checkstate = 'AG_EXBEACON';
						checkAndreload();
					} else {
						checkstate = 'AG_ONLY';
						checkAndreload();
					}
				}
				break;
			case 'AG_EXBEACON':
				var status = checkWebViewStatus('gateway');
				if (isAgPresent(networkStatus) == false) {
					checkstate = 'ERROR';
					checkAndreload();
					//show error as only setting is storefront
				} else if (status == 'NOTSTARTED') {
					var success = loadNextURL('gateway');
					if (success == false) {
						checkstate = 'ERROR';
						checkAndreload();
					}
				} else if (status == 'LOADED') {
					if (isExBeaconPresent(networkStatus) == true && isExBeaconReachable(networkStatus) == 'N') {
						checkstate = 'ERROR';
						checkAndreload();
					} else {
						checkstate = "SUCCESS";
						checkAndreload();
					}

				} else {
					if (isExBeaconPresent(networkStatus) == true && isExBeaconReachable(networkStatus) == 'N') {
						checkstate = 'ERROR';
						checkAndreload();
					} else if (status == 'IN_PROGRESS') {
						return;
					} else {
						var success = loadNextURL('gateway');
						if (success == false) {
							checkstate = 'ERROR';
							checkAndreload();
						}
					}
				}
				break;
			case 'AG_ONLY':
				var status = checkWebViewStatus('gateway');
				if (isAgPresent(networkStatus) == false) {
					checkstate = 'ERROR';
					checkAndreload();
					//show error as only setting is storefront
				} else if (status == 'NOTSTARTED') {
					var success = loadNextURL('gateway');
					if (success == false) {
						checkstate = 'ERROR';
						checkAndreload();
					}
				} else if (status == 'LOADED') {
					checkstate = "SUCCESS";
					checkAndreload();

				} else {
					if (status == 'IN_PROGRESS') {
						return;
					}
					var success = loadNextURL('gateway');
					if (success == false) {
						checkstate = 'ERROR';
						checkAndreload();
					}
				}
				break;
			case 'ERROR':
				checkstate = 'DefaultError';
				parseAndShowError( );
				uiEngine.processCommand({
					cmd : 'displayspinner',
					data : {
						is_hide : true
					}
				});
				uiEngine.processCommand({
					cmd : 'displayWebView',
					data : {
						is_hide : true
					}
				});
				checkAndreload();
				break;
			case 'SUCCESS':
				checkstate = 'Default';
				CtxMessage.hideEmbeddedError();
				uiEngine.processCommand({
					cmd : 'displayWebView',
					data : {
						is_hide : false
					}
				});
				uiEngine.processCommand({
					cmd : 'displayspinner',
					data : {
						is_hide : true
					}
				});
				checkAndreload();
				break;
			case 'Default':
			case 'DefaultError':
				if (currentSetting.forceToReconnect == true) {
					currentSetting.forceToReconnect = false;
					myself.reConnection(currentSetting.forceConnectTime);
				} else {
					parseFinalState();
				}
				break;

		}
		return true;
	}
	
	var errorMapping = {
		message : {
			'OFFLINE' : 'networkUnreachable',
			'NONE' : "storeUnreachable",
			'IB-Y:RF-N' : "storeUnreachable",
			'RF-N' : "storeUnreachable",
			'EB-N' : "storeUnreachable",
			'EB-Y:AG-N' : "storeUnreachable",
			'AG-N' : "storeUnreachable"
		}
	};
	
	function parseAndShowError() {
		var checkExternal = false;
		var errorObj = {
			textheader : "citrix_receiver",
			message : 'NONE',
			bText : 'ok_button',
			isModal : true,
			messageParam : 'store'
		};
		if (onlineStatus == 'offline') {
			errorObj.message = 'OFFLINE';
		} else {
			if (isInBeaconPresent(networkStatus)) {
				if (isInBeaconReachable(networkStatus) == 'Y') {
					if (isRfReachable(networkStatus) == 'N') {
						errorObj.message = 'IB-Y:RF-N';
					}
				} else if (isExBeaconPresent(networkStatus) == true || isAgPresent(networkStatus) == true) {
					checkExternal = true;
				} else if (isRfReachable(networkStatus) == 'N') {
					errorObj.message = 'RF-N';
				}
			} else if (isRfReachable(networkStatus) == 'N') {
				if (isExBeaconPresent(networkStatus) == true || isAgPresent(networkStatus) == true) {
					checkExternal = true;
				} else {
					errorObj.message = 'RF-N';
				}
			}
			if (checkExternal === true) {
				if (isExBeaconPresent(networkStatus) == true) {
					if (isExBeaconReachable(networkStatus) == 'N') {
						errorObj.message = 'EB-N';
					} else if (isAnyGatewayReachable(networkStatus) != 'Y') {
						errorObj.message = 'EB-Y:AG-N';
					}
				} else if (isAgPresent(networkStatus) == true) {
					if (isAnyGatewayReachable(networkStatus) != 'Y') {
						errorObj.message = 'AG-N';
					}
				}
	
			}
		}
		
		showErorMessage(errorObj.textheader, errorMapping.message[errorObj.message], errorObj.bText, errorObj.isModal, errorObj.messageParam);	
	}
	function parseFinalState() {
		if (checkForXHRComplete() == false || networkStatus.finalStateProcessed == true) {
			return;
		}
		if (networkStatus.ping.statusTimer) {
			clearTimeout(networkStatus.ping.statusTimer);
			networkStatus.ping.statusTimer = null;
		}
		if (checkstate == "DefaultError") {
			main_logInfo.state = 'Disconnected';
			var comment = 'JSON={';
			var arr = networkStatus.requestArray;
			for (var i = 0; i < arr.length; i++) {
				comment += 'url :"' + arr[i].url + '",urltype:"' + networkStatus.requestArray[i].type + '",xhrStatus:"' + networkStatus.responseArray[i].responseInfo.status + '"\n';
			}
			comment += '"}=';
			main_logInfo.comment = comment;
			writeMainWindowLog();
		}

		networkStatus.finalStateProcessed = true;
		if (beaconsetting.ping.enable == true) {
			networkStatus.ping.statusTimerXHR = currentSetting.storexhrTime;
			networkStatus.ping.statusTimerState.count = 0;
			networkStatus.ping.statusTimerState.index = 0;
			networkStatus.ping.networklist = null;
			getNetworkList.call(this, function(list, time) {
				if (time != currentSetting.storexhrTime) {
					return;
				}
				networkStatus.ping.networklist = list;
				createAndStartPing();
				setStatusTimer();
			}, currentSetting.storexhrTime);
		}
	}

	function startPingReconnect() {
		if (networkStatus.ping.statusTimerXHR == currentSetting.storexhrTime) {
			main_logInfo.state = 'connecting', main_logInfo.comment = 'STR={ "Connecting on network list change/ xhr status"}=';
			writeMainWindowLog();
			var timeNow = Date.now.bind(Date);
			rfconnector.reConnection(timeNow());
		}
	}

	/*
	 * If all xhr response got then start pinging else wait for complete
	 */
	function checkForXHRComplete() {
		var rvalue = false;
		var requestArr = networkStatus.requestArray;
		var count = 0;
		for (var i = 0; i < requestArr.length; i++) {
			if (currentSetting.storexhrTime === requestArr[i].timestamp && networkStatus.isXHRPending[i] == false) {
				count++;
			}
		}

		if (count == requestArr.length) {
			rvalue = true;
		}
		return rvalue;
	}

	function createPingPacket() {
		networkStatus.ping.requestArray = [];
		networkStatus.ping.isXHRPending = [];
		networkStatus.ping.responseArray = [];
		var currentConnectType = networkStatus.ping.currentConnection;
		var index = 0;
		if (isInBeaconPresent(networkStatus)) {
			var index1 = -1;
			while (( index1 = getFirstUrli('internalbeacon', index1)) != null) {
				var arr = networkStatus.requestArray[index1];
				networkStatus.ping.requestArray[index] = {
					url : arr.url,
					timestamp : currentSetting.storexhrTime,
					type : 'internalbeacon',
					currentConnect : currentConnectType,
					arrIndex : index,
					responseInfo : {
						status : null
					}
				};
				index++;
			}
		} else {
			if (isRfPresent(networkStatus) == true) {
				var index1 = getFirstUrli('rfweb', -1);
				var arr = networkStatus.requestArray[index1];
				networkStatus.ping.requestArray[index] = {
					url : arr.url,
					timestamp : currentSetting.storexhrTime,
					type : 'rfweb',
					currentConnect : currentConnectType,
					arrIndex : index,
					responseInfo : {
						status : null
					}
				};
				index++;
			}

		}

		if (currentConnectType == 'external' || currentConnectType == 'error') {
			var index1 = -1;
			if (isExBeaconPresent(networkStatus)) {
				while (( index1 = getFirstUrli('externalbeacon', index1)) != null) {
					var arr = networkStatus.requestArray[index1];
					networkStatus.ping.requestArray[index] = {
						url : arr.url,
						timestamp : currentSetting.storexhrTime,
						type : 'externalbeacon',
						arrIndex : index++,
						currentConnect : currentConnectType,
						responseInfo : {
							status : null
						}
					};
				}

				if (currentConnectType == 'external') {
					var arrIndex = currentSetting.webView.urlObj.arrIndex;
					var connectedArr = networkStatus.requestArray[arrIndex];
					networkStatus.ping.requestArray[index] = {
						url : connectedArr.url,
						timestamp : currentSetting.storexhrTime,
						type : 'gateway',
						arrIndex : index,
						currentConnect : currentConnectType,
						responseInfo : {
							status : null
						}
					};
				}

			} else {
				if (currentConnectType == 'external') {
					var arrIndex = currentSetting.webView.urlObj.arrIndex;
					var connectedArr = networkStatus.requestArray[arrIndex];
					networkStatus.ping.requestArray[index] = {
						url : connectedArr.url,
						timestamp : currentSetting.storexhrTime,
						type : 'gateway',
						arrIndex : index,
						currentConnect : currentConnectType,
						responseInfo : {
							status : null
						}
					};
				} else {
					if (isAgPresent(networkStatus) == true) {
						var index1 = -1;
						while (( index1 = getFirstUrli('gateway', index1)) != null) {
							var arr = networkStatus.requestArray[index1];
							networkStatus.ping.requestArray[index] = {
								url : arr.url,
								timestamp : currentSetting.storexhrTime,
								type : 'externalbeacon',
								arrIndex : index++,
								currentConnect : currentConnectType,
								responseInfo : {
									status : null
								}
							};

						}
					}

				}

				index++;
			}
		}
	}

	function createAndStartPing() {
		if (checkstate != 'Default' && checkstate != 'DefaultError') {
			return;
		}
		if (networkStatus.ping.statusTimer) {
			return;
		}
		if (beaconsetting.ping.afterconnect == false) {
			return;
		}
		networkStatus.ping.currentState = null;
		networkStatus.ping.currentState = checkstate;
		var arrIndex = currentSetting.webView.urlObj.arrIndex;
		var connectedArr = networkStatus.requestArray[arrIndex];
		networkStatus.ping.currentConnection = 'error';
		if (checkstate == 'Default') {
			//This means it is already connected
			var currentConnectType = (connectedArr.type == 'rfweb') ? 'internal' : 'external';
			networkStatus.ping.currentConnection = currentConnectType;
			createPingPacket();
		} else if (checkstate == 'DefaultError') {
			//Some error happen
			createPingPacket();
		} else {
		}
	}

	function starPingingAtInterval() {
		networkStatus.ping.pingCounter++;
		for (var i = 0; i < networkStatus.ping.requestArray.length; i++) {
			networkStatus.ping.isXHRPending[i] = true;
			networkStatus.ping.requestArray[i].pingCounter = networkStatus.ping.pingCounter;
		}
		checkAvailability(networkStatus.ping.requestArray, onPingSuccess, onPingFail);
	}

	function onPingSuccess(xhrInfo) {
		if (currentSetting.storexhrTime === xhrInfo.timestamp && xhrInfo.pingCounter == networkStatus.ping.pingCounter) {
			networkStatus.ping.isXHRPending[xhrInfo.arrIndex] = false;
			networkStatus.ping.responseArray[xhrInfo.arrIndex] = xhrInfo;
			checkForPingConnect();
		}
	}

	function onPingFail(xhrInfo) {
		if (currentSetting.storexhrTime === xhrInfo.timestamp && xhrInfo.pingCounter == networkStatus.ping.pingCounter) {
			networkStatus.ping.isXHRPending[xhrInfo.arrIndex] = false;
			networkStatus.ping.responseArray[xhrInfo.arrIndex] = xhrInfo;
			checkForPingConnect();
		}
	}

	function checkForPingConnect() {
		var arr = networkStatus.ping.requestArray;
		var count = 0;

		for (var i = 0; i < arr.length; i++) {
			if (networkStatus.ping.isXHRPending[i] == false && currentSetting.storexhrTime === networkStatus.ping.responseArray[i].timestamp && networkStatus.ping.responseArray[i].pingCounter == networkStatus.ping.pingCounter) {
				count++;
			}
		}

		if (count != arr.length) {
			return;
		}
		networkStatus.ping.pingCounter++;
		var reConnect = false;
		if (networkStatus.ping.currentConnection == 'internal') {
			if ((isInBeaconPresent(networkStatus) && isInBeaconReachable(networkStatus.ping) == 'Y') || ((!isInBeaconPresent(networkStatus) && isRfReachable(networkStatus.ping) == 'Y'))) {
				reConnect = false;
			} else {
				reConnect = true;
			}

		} else if (networkStatus.ping.currentConnection == 'external') {
			if ((isInBeaconPresent(networkStatus) == true && isInBeaconReachable(networkStatus.ping) == 'Y') || ((!isInBeaconPresent(networkStatus) && isRfReachable(networkStatus.ping) == 'Y'))) {
				reConnect = true;
			} else if ((isExBeaconPresent(networkStatus) && isExBeaconReachable(networkStatus.ping) == 'Y') || (!isExBeaconPresent(networkStatus) && isAnyGatewayReachable(networkStatus.ping) == 'Y')) {
				reConnect = false;
			} else {
				reConnect = true;
			}

		} else if (networkStatus.ping.currentConnection == 'error') {
			if ((isInBeaconPresent(networkStatus) && isInBeaconReachable(networkStatus.ping) == 'Y' && isRfReachable(networkStatus.ping) == 'Y') || ((!isInBeaconPresent(networkStatus) && isRfReachable(networkStatus.ping) == 'Y'))) {
				reConnect = true;
			} else if ((isExBeaconPresent(networkStatus) && isExBeaconReachable(networkStatus.ping) == 'Y' && isAnyGatewayReachable(networkStatus.ping) == 'Y') || (!isExBeaconPresent(networkStatus) && isAnyGatewayReachable(networkStatus.ping) == 'Y')) {
				reConnect = true;
			} else {
				reConnect = false;
			}

		}
		if (reConnect == true) {
			startPingReconnect();
		} else {
			setStatusTimer();
		}

	}

	function setStatusTimer() {

		if (networkStatus.ping.statusTimerXHR != currentSetting.storexhrTime) {
			return;
		}
		var nrWinArr = chrome.app.window.getAll();
		if (nrWinArr.length > 1) {
			networkStatus.ping.currentTimerSequece = networkStatus.ping.statusTimerSequece['with_session'];
		} else {
			networkStatus.ping.currentTimerSequece = networkStatus.ping.statusTimerSequece['no_session'];
		}
		networkStatus.ping.statusTimerState.index = (networkStatus.ping.statusTimerState.index ) % networkStatus.ping.currentTimerSequece.length;
		if (networkStatus.ping.statusTimerState.count >= networkStatus.ping.currentTimerSequece[networkStatus.ping.statusTimerState.index].count) {
			networkStatus.ping.statusTimerState.count = 0;
			networkStatus.ping.statusTimerState.index = (networkStatus.ping.statusTimerState.index + 1) % networkStatus.ping.currentTimerSequece.length;
		}
		var checkfunc = null;
		switch(networkStatus.ping.currentTimerSequece[networkStatus.ping.statusTimerState.index].type) {
			case 'networklist':
				checkfunc = checkNetworkList;
				break;
			case 'xhr':
				if (beaconsetting.ping.afterconnect == false) {
					checkfunc = dummyPingFunc;
				} else {
					checkfunc = starPingingAtInterval;
				}

				break;
		}
		var timer = networkStatus.ping.currentTimerSequece[networkStatus.ping.statusTimerState.index].interval;
		if (timer <= 10) {
			timer = 10000;
		}
		networkStatus.ping.statusTimer = setTimeout(function() {
			checkfunc();
		}, timer);
		networkStatus.ping.statusTimerState.count++;
	}

	function dummyPingFunc() {
		setStatusTimer();
	}

	function compare(firstconn, secondconn) {
		if (firstconn['address'] > secondconn['address']) {
			return 1;
		} else if (firstconn['address'] < secondconn['address']) {
			return -1;
		} else {
			if (firstconn['name'] > secondconn['name']) {
				return 1;
			} else if (firstconn['name'] < secondconn['name']) {
				return -1;
			} else {
				return 0;
			}
		}
	}

	function getNetworkList(callback, parameter) {
		chrome.system.network.getNetworkInterfaces(function(x) {
			callback(x.sort(compare), parameter);
		});
	}

	function checkNetworkList() {
		getNetworkList.call(this, function(list, pingTime) {
			if (pingTime != currentSetting.storexhrTime) {
				return;
			}
			var currentList = list;
			var reconnect = false;
			if (networkStatus.ping.networklist == null) {
				networkStatus.ping.networklist = list;
			}
			if (currentList.length != networkStatus.ping.networklist.length) {
				reconnect = true;
			} else {
				for (var i = 0; i < currentList.length; i++) {
					if (compare(currentList[i], networkStatus.ping.networklist[i]) != 0) {
						reconnect = true;
						break;
					}
				}
			}
			if (reconnect == true) {
				// Update SSO cookies on network change and reconnect
				SSOCookieHelper.update(null, startPingReconnect);
			} else {
				setStatusTimer();
			}

		}, currentSetting.storexhrTime);
	}

	function getFirstUrli(type, index) {
		var rvalue = null;
		var arr = networkStatus.requestArray;
		if (index < 0) {
			index = -1;
		}
		for (var i = index + 1; i < arr.length; i++) {
			if (arr[i].type == type) {
				rvalue = arr[i].arrIndex;
				break;
			}
		}
		return rvalue;

	}

	function loadNextURL(type) {
		var rvalue = false;
		var arr = networkStatus.requestArray;
		for (var i = 0; i < arr.length; i++) {
			if ((arr[i].type == 'rfweb' || arr[i].type == 'gateway') && networkStatus.checkedinwebview[i].checked != true && (!(networkStatus.isXHRPending[i] == false && networkStatus.responseArray[i].succeed == false))) {
				rvalue = true;
				break;
			}
		}
		urlObj = getNextUrlToLoad(type);
		loadURL(urlObj);
		return rvalue;
	}

	function loadURL(urlObj) {
		if (urlObj.url == null && currentSetting.webView.urlPending == false) {
			return false;
		}
		urlObj.timestamp = currentSetting.storexhrTime;
		urlObj.arrIndex = getIndexNetworkStatus(urlObj);
		currentSetting.webView.urlPending = true;
		var data = {
			cmd : 'loadwebview',
			data : {
				urlObj : urlObj,
				status : currentSetting.webView.status
			}
		};
		uiEngine.processCommand(data);
	}

	function getIndexNetworkStatus(urlObj) {
		var arr = networkStatus.requestArray;
		var rvalue = -1;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].type == urlObj.type && checkURL(urlObj.url, arr[i].url)) {
				rvalue = arr[i].arrIndex;
				break;
			}
		}
		return rvalue;
	}

	function loadPreferenceEngine() {
		var currentTime = (new Date()).getTime();
		chrome.app.window.create("/ChromeAppUI/Preferences.html", // url
		{
			// options
			'bounds' : {
				'width' : 800,
				'height' : 600
			},
			'id' : 'preferences'
		}, function(createdWindow) {
			// if reqd pass any values to createdWindow
			chrome.app.window.current().close();
		});
	}

	function webViewStatusChange(status) {
		currentSetting.webView.status = status;
		if (status == WEBVIEWSTATUS.ON_ERROR || status == WEBVIEWSTATUS.ON_LOADCOMPLETE) {
			currentSetting.webView.urlPending == false;
		}
	}

	function webViewURLChange(urlObj) {
		currentSetting.webView.urlObj = urlObj;
	}

     function webViewURLLoaded(url) {
          currentSetting.webView.urlObj.finalLoadedUrl = url;
     }

	function loadWebViewFailed(urlObj, errorObj) {
		if (urlObj.timestamp != currentSetting.storexhrTime) {
			return;
		}
		currentSetting.webView.urlPending = false;
		if (networkStatus.checkedinwebview[urlObj.arrIndex].checked != true) {
			networkStatus.checkedinwebview[urlObj.arrIndex] = {
				checked : true,
				succeed : false,
				errorObj : errorObj
			};
			if (networkStatus.isXHRPending[urlObj.arrIndex] == false) {
				checkAndreload();
			}
		}
	}

	function loadWebViewSuccess(urlObj) {
		if (urlObj.timestamp != currentSetting.storexhrTime) {
			return;
		}
		currentSetting.webView.urlPending = false;
		if (networkStatus.checkedinwebview[urlObj.arrIndex].checked != true) {
			networkStatus.checkedinwebview[urlObj.arrIndex] = {
				checked : true,
				succeed : true
			};
			if (networkStatus.isXHRPending[urlObj.arrIndex] == false) {
				checkAndreload();
			}
		}

	}

	function serverReachable(xhrInfo) {
		if (currentSetting.storexhrTime === xhrInfo.timestamp && networkStatus.isXHRPending[xhrInfo.arrIndex] == true) {
			networkStatus.isXHRPending[xhrInfo.arrIndex] = false;
			networkStatus.responseArray[xhrInfo.arrIndex] = xhrInfo;
			checkAndreload();
		}
	}

	function serverUnReachable(xhrInfo) {
		if (currentSetting.storexhrTime === xhrInfo.timestamp && networkStatus.isXHRPending[xhrInfo.arrIndex] == true) {
			networkStatus.isXHRPending[xhrInfo.arrIndex] = false;
			networkStatus.responseArray[xhrInfo.arrIndex] = xhrInfo;
			if (xhrInfo.arrIndex == currentSetting.webView.urlObj.arrIndex) {
				currentSetting.webView.urlPending = false;
				currentSetting.webView.status = WEBVIEWSTATUS.ON_ERROR;
			}

			checkAndreload();
		}
	}

	function getunLoadedRfIndex() {
		var rvalue = null;
		var arr = networkStatus.requestArray;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].type == 'rfweb' && networkStatus.checkedinwebview[i].checked != true) {
				if (networkStatus.isXHRPending[i] == true || (networkStatus.isXHRPending[i] == false && networkStatus.responseArray[i].succeed == true)) {
					rvalue = arr[i].arrIndex;
					break;
				}
			}
		}
		return rvalue;
	}

	function getPingedGateWayIndex() {
		//first get default gateway and if it already checked then get reachable gateway
		var rvalue = null;
		var arr = networkStatus.requestArray;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].type == 'gateway' && networkStatus.checkedinwebview[i].checked != true && arr[i].is_default == true) {
				if (networkStatus.isXHRPending[i] == true || (networkStatus.isXHRPending[i] == false && networkStatus.responseArray[i].succeed == true)) {
					rvalue = arr[i].arrIndex;
					break;
				}
			}
		}
		if (rvalue == null) {
			for (var i = 0; i < arr.length; i++) {
				if (arr[i].type == 'gateway' && networkStatus.checkedinwebview[i].checked != true) {
					if ((networkStatus.isXHRPending[i] == false && networkStatus.responseArray[i].succeed == true)) {
						rvalue = arr[i].arrIndex;
						break;
					}
				}
			}
		}
		return rvalue;
	}

	function getGateWayIndex() {
		//first get default gateway and if it already checked then get other gateway
		var rvalue = null;
		var arr = networkStatus.requestArray;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].type == 'gateway' && networkStatus.checkedinwebview[i].checked != true && arr[i].is_default == true) {
				if (networkStatus.isXHRPending[i] == true) {
					rvalue = arr[i].arrIndex;
					break;
				}
			}
		}
		if (rvalue == null) {
			for (var i = 0; i < arr.length; i++) {
				if (arr[i].type == 'gateway' && networkStatus.checkedinwebview[i].checked != true) {
					if (networkStatus.isXHRPending[i] == true) {
						rvalue = arr[i].arrIndex;
						break;
					}
				}
			}
		}
		return rvalue;
	}

	function isExBeaconReachable(arr1) {

		var rvalue = 'YN';
		var totalCount = 0;
		var reachablecount = 0;
		var pendingCount = 0;
		var arr = arr1.requestArray;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].type == 'externalbeacon') {
				if ((arr1.isXHRPending[i] == false && arr1.responseArray[i].succeed == true)) {
					reachablecount++;
				} else if (arr1.isXHRPending[i] == true) {
					pendingCount++;
				}
				totalCount++;
			}
		}

		if (reachablecount >= 1) {
			rvalue = 'Y';
		} else if (pendingCount == 0) {
			rvalue = 'N';
		} else {
			rvalue = 'YN';
		}
		return rvalue;
	}

	function isAnyGatewayReachable(arr1) {
		var rvalue = 'YN';
		var arr = arr1.requestArray;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].type == 'gateway') {
				if ((arr1.isXHRPending[i] == false && arr1.responseArray[i].succeed == true )) {
					rvalue = 'Y';
					break;
				}
			}
		}

		return rvalue;
	}

	function isRfReachable(arr1) {
		var rvalue = 'YN';
		var arr = arr1.requestArray;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].type == 'rfweb') {
				if ((arr1.isXHRPending[i] == false && arr1.responseArray[i].succeed == true )) {
					rvalue = 'Y';
				} else if ((arr1.isXHRPending[i] == false && arr1.responseArray[i].succeed == false)) {
					rvalue = 'N';
				}
			}
		}

		return rvalue;
	}
	function isInBeaconReachable(arr1) {
		if (isInBeaconPresent(arr1) == false) {
			return 'Y';
		}
		var rvalue = 'YN';
		var totalCount = 0;
		var reachablecount = 0;
		var pendingCount = 0;
		var arr = arr1.requestArray;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].type == 'internalbeacon') {
				if ((arr1.isXHRPending[i] == false && arr1.responseArray[i].succeed == true)) {
					reachablecount++;
				} else if (arr1.isXHRPending[i] == true) {
					pendingCount++;
				}
				totalCount++;
			}
		}

		if (reachablecount >= 1) {
			rvalue = 'Y';
		} else if (pendingCount == 0) {
			rvalue = 'N';
		} else {
			rvalue = 'YN';
		}
		return rvalue;
	}

	function isInBeaconPresent(arr1) {
		var rvalue = false;
		var arr = arr1.requestArray;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].type == 'internalbeacon') {
				rvalue = true;
				break;
			}
		}
		return rvalue;
	}

	function isExBeaconPresent(arr1) {
		var rvalue = false;
		var arr = arr1.requestArray;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].type == 'externalbeacon') {
				rvalue = true;
				break;
			}
		}
		return rvalue;
	}

	function isAgPresent(arr1) {
		var rvalue = false;
		var arr = arr1.requestArray;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].type == 'gateway') {
				rvalue = true;
				break;
			}
		}
		return rvalue;
	}

	function isRfPresent(arr1) {
		var rvalue = false;
		var arr = arr1.requestArray;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].type == 'rfweb') {
				rvalue = true;
				break;
			}
		}
		return rvalue;
	}

	function getNextUrlToLoad(type) {
		var connectUrl = null;
		var connecttype = null;
		var index = null;
		if (type == 'rfweb') {
			index = getunLoadedRfIndex();
		} else if (type == 'gateway') {
			index = getPingedGateWayIndex();
			if (index == null) {
				index = getGateWayIndex();
			}
		}
		var arr = networkStatus.requestArray;
		if (index != null) {
			connectUrl = arr[index].url;
			connecttype = arr[index].type;
		}
		return {
			url : connectUrl,
			type : connecttype
		};
	}

	function checkAvailability(arr, successfull, onError) {
		for (var i = 0; i < arr.length; i++) {
			beaconsetting.fncall.serverReachablefn(arr[i], successfull, onError);
		}
	}

	function createRequestarray() {
		var arrIndex = 0;
		var sfRecord = currentStore['store_settings'];

		//check for gateway
		if (beaconsetting.accessType.external.enable == true) {
			if (beaconsetting.accessType.external.minimal == false) {
				if (sfRecord['gateways'] && sfRecord['gateways'].length > 0) {
					for (var i = 0; i < sfRecord['gateways'].length; i++) {
						var url = sfRecord['gateways'][i]['url'];
						var is_default = sfRecord['gateways'][i]['is_default'];						
						if (is_default == "true") {
							is_default = true;
						}
						networkStatus.isXHRPending[arrIndex] = true;
						networkStatus.checkedinwebview[arrIndex] = false;
						var requestData = {
							url : url,
							is_default : is_default,
							arrIndex : arrIndex,
							timestamp : currentSetting.storexhrTime,
							type : 'gateway',
							responseInfo : {
								status : null
							}
						};
						networkStatus.requestArray[arrIndex] = requestData;
						networkStatus.checkedinwebview[arrIndex] = {
							checked : false
						};
						arrIndex++;
					}
				}
			} else {

				if (sfRecord['gateways'] && sfRecord['gateways'].length > 0) {
					var defIndex = 0;
					for (var i = 0; i < sfRecord['gateways'].length; i++) {
						var is_default = sfRecord['gateways'][i]['is_default'];
						if (is_default == true) {
							defIndex = i;
							break;
						}

					}
					var url = sfRecord['gateways'][defIndex]['url'];
					var is_default = sfRecord['gateways'][defIndex]['is_default'];
					if (is_default == "true") {
						is_default = true;
					}
					networkStatus.isXHRPending[arrIndex] = true;
					networkStatus.checkedinwebview[arrIndex] = false;
					var requestData = {
						url : url,
						is_default : is_default,
						arrIndex : arrIndex,
						timestamp : currentSetting.storexhrTime,
						type : 'gateway',
						responseInfo : {
							status : null
						}
					};
					networkStatus.requestArray[arrIndex] = requestData;
					networkStatus.checkedinwebview[arrIndex] = {
						checked : false
					};
					arrIndex++;

				}
			}
		}
		//check for external beacons
		if (isAgPresent(networkStatus) == true && beaconsetting.accessType.external.usebeacon == true && sfRecord['beacons'] && sfRecord['beacons']['external'] && sfRecord['beacons']['external'].length > 0) {
			for (var i = 0; i < sfRecord['beacons']['external'].length; i++) {
				var url = sfRecord['beacons']['external'][i]['url'];
				//url null check
				if(!Utils.isNullOrEmpty(url)){
					var is_default = sfRecord['beacons']['external'][i]['is_default'];
						if(is_default == "true"){
								is_default = true;
							}
					networkStatus.isXHRPending[arrIndex] = true;
					var requestData = {
						url : url,
						is_default : is_default,
						arrIndex : arrIndex,
						timestamp : currentSetting.storexhrTime,
						type : 'externalbeacon',
						responseInfo : {
							status : null
						}
					};
					networkStatus.requestArray[arrIndex] = requestData;
					networkStatus.checkedinwebview[arrIndex] = {
						checked : false
					};
					arrIndex++;
				}
			}
		}

		if (sfRecord['rf_web'] && beaconsetting.accessType.internal.enable == true) {
			var url = sfRecord['rf_web']['url'];
			networkStatus.isXHRPending[arrIndex] = true;
			networkStatus.checkedinwebview[arrIndex] = false;
			var requestData = {
				url : url,
				is_default : true,
				arrIndex : arrIndex,
				timestamp : currentSetting.storexhrTime,
				type : 'rfweb',
				responseInfo : {
					status : null
				}
			};
			networkStatus.requestArray[arrIndex] = requestData;
			networkStatus.checkedinwebview[arrIndex] = {
				checked : false
			};
			arrIndex++;
		}

		if (isRfPresent(networkStatus) == true && beaconsetting.accessType.internal.usebeacon == true && sfRecord['beacons'] && sfRecord['beacons']['internal'] && sfRecord['beacons']['internal'].length > 0) {
			for (var i = 0; i < sfRecord['beacons']['internal'].length; i++) {
				var url = sfRecord['beacons']['internal'][i]['url'];
				//url null check
				if(!Utils.isNullOrEmpty(url)){
					var is_default = sfRecord['beacons']['internal'][i]['is_default'];
						if(is_default == "true"){
								is_default = true;
							}
					networkStatus.isXHRPending[arrIndex] = true;
					var requestData = {
						url : url,
						is_default : is_default,
						arrIndex : arrIndex,
						timestamp : currentSetting.storexhrTime,
						type : 'internalbeacon',
						responseInfo : {
							status : null
						}
					};
					networkStatus.requestArray[arrIndex] = requestData;
					networkStatus.checkedinwebview[arrIndex] = {
						checked : false
					};
					arrIndex++;
				}
			}
		}

	}

}

//To inject script into Webview
function generateScriptText(fn) {
	var fnText = fn.toString().replace(/"/g, '\\"').replace(/(\r?\n|\r)/g, '\\n');
	// Insert newlines correctly.
	var scriptText = '(function() {\n' + '  var script = document.createElement("script");\n' + '  script.innerHTML = "(function() { (' + fnText + ')(); })()" \n' + '  document.body.appendChild(script);\n' + '})()';
	return scriptText;
}

function launchSession(icaData, is_reconnect) {
	chrome.runtime.getBackgroundPage(function(bgwindow){ 
		CEIP = bgwindow._CEIP;
		//Get the policy pushed through Google Admin console
		UserConfiguration.getEngineSettingsFromPolicy(UserConfiguration.engineSettingsKey,function(policyConfig){
		
			//Read the config stored in background window which has config from configuration.js + chromeAppPreferences through web.config	
			var configObj = bgwindow.CHROME_APP_CONFIG;
			
			//Merge any config set using default.ica
			if(icaData["chromeAppPreferences"]){
				try{
					var prefsFrmIca = JSON.parse(icaData["chromeAppPreferences"]);
					configObj = bgwindow.mergeConfig(configObj,prefsFrmIca);
					CEIP.add('configuration:defaultIca',true);
				}catch(e){
					console.log("Invalid JSON string from icaData chromeAppPreferences");
				}
			}
			
			//Any config through policy is merged
			if (Utils.isValid (policyConfig)) {
				configObj =  bgwindow.mergeConfig(configObj,policyConfig)
			}
			
			var currentTime = (new Date()).getTime();
			var lang;
			if (icaData["UILocale"]) {
				lang = icaData["UILocale"];
			} else {
				lang = chrome.i18n.getUILanguage();
			}
			var url = "/src/SessionWindow.html" + '?launchid=' + currentTime + "#type=message&redirecturl=none&launcherType=chromeApp&lang=" + lang;
			

			// Update cmdline to .ica file, if available
			if ((null !== cmdLine) && (cmdLine.length > 0) && is_reconnect == false) {
				icaData["LongCommandLine"] = cmdLine;
			}
			var options = { };
			var isSeamless = false;
			if(icaData){
				if((icaData['TWIMode'] == 'on' || icaData['TWIMode'] == 'On')){
				  isSeamless = true;
			  }
			}
	
			UserConfiguration.getWindowStatus(configObj,function (state){
			  UserConfiguration.getMultimonitorEnabled(configObj, function (mmEnabled) {
				if(isKioskMode){
					url = url+"&closeCallback=" +true;
					if(rfconnector){
						rfconnector.displayRFPageWebview(true);
					}
					options.id = "sessionwindow";
				}else{
    				options = {
    						id: 'Session' + currentTime,
    						minWidth: 800,
    						minHeight: 600,
      						state : state,
      						mmEnabled : mmEnabled
    				};
    				if((configObj && configObj['seamless'] && configObj['seamless']['showInShelf']) && !isSeamless)
						options.showInShelf = true;
					if(options.showInShelf )
					{
						options['icon'] = icaData['IconUrl'];
						//options['title'] = icaData['title'];
					}
					}
				HTML5Interface.launchSessionWindow(url, {onDOMContentLoaded: function(appWindow){
					passConfigToSession(appWindow,icaData,is_reconnect,configObj);
				} } , options, icaData);
			});
		});
	});
	});
}

function passConfigToSession(element,icaData,is_reconnect,configObj){
	
	element.contentWindow.HTML5_CONFIG = configObj;
	element.contentWindow.postMessage({"cmd": "ICADATA", "icaData": icaData}, self.location.origin);

	if ((null !== cmdLine) && (cmdLine.length > 0) && is_reconnect == false) {
		if(!isKioskMode){
			chrome.app.window.current().close();
		}
	}
	
}

// show notification, hide, wait for notification to appear and exit.
function closeWithError(errMsg) {
	Notifications.showError(errMsg);
	if(!isKioskMode){
		chrome.app.window.current().hide();
		setTimeout(function() {
			chrome.app.window.current().close();
		}, Utils.closeWindowTimeOut);
	}
}

function displayError() {

}

function showNotification(err) {
	Notifications.showError(chrome.i18n.getMessage(err));
}

function receiveMessage(event) {
	var wrUrl = null;
	if (rfconnector) {
		wrUrl = rfconnector.getCurrentUrl();
	}
	if(verify(event, self.location.origin)){
		if (event.data && event.data['cmd'] === "CLOSESESSION") {
			console.log("close session command came");
			var element = document.getElementById('sessionwindow');
			element.style.display = "none";
			if (element) {
				element.parentNode.removeChild(element);
				if (rfconnector) {
					rfconnector.displayRFPageWebview(false);
				}
			}
			return;
		} else if (event.data && event.data['cmd'] === "PRINT") {
			/*template is instantiated and appended to the dody of Main.html when print command is created.
			 * 'data-print-url' custom attribute is set to the url of the blob object containing PDF.*/
			var templatePDF = document.getElementById('templatePDF');
			var templateInstance = document.importNode(templatePDF.content, true);
		   
			var divContainer = templateInstance.querySelector('div');
			divContainer.setAttribute('data-print-url', event.data['url']);		
			document.getElementById("parent").appendChild(templateInstance);
			return;
		}
	}
	// Verify that message comes from RfWeb
	if (verify(event, wrUrl) && event.data) {		
		var type = event.data["type"];
		if (type === "ResourceData") {// Resource data from RfWeb after logon.
			var resources = event.data["resources"];
			var error = event.data["error"];

			// resource enum failed. error will be shown below.
			if (error) {
				var err = chrome.i18n.getMessage("genericError") + " " + error;
				if (error === "ResourcesFailed")
					err = chrome.i18n.getMessage("enumerate_res_error");
				else if (error === "Unauthorized")
					err = chrome.i18n.getMessage("unauthorized_user_error");

				closeWithError(err);
			} else if (resources) {
				for (var i = 0; i < resources.length; i++) {
					var res = resources[i];
					var playsFta = res["playsfiletypes"];
					if (playsFta && res["disabled"] !== true) {// has FTA and is app enabled?
						for ( j = 0; j < playsFta.length; j++) {// category of file types
							var exts = playsFta[j]["fileextensions"];
							// extensions for the category
							for ( k = 0; k < exts.length; k++) {// store all fta with ext as key so that its easy to lookup
								var ext = exts[k].toLowerCase();
								// store it in lower case to compare it with real file easily
								ftaMappings[ext] = res["id"];
							}
						}
					}
				}
			}

			// Login is complete now, lets check some settings.
			rfconnector.sendRfMessage({
				"type" : "Settings"
			}, 'self');

			// Check if its fta launch and request .ica file from rfweb.
			if ((null !== cmdLine) && (cmdLine.length > 0)) {
				fileExtension = "." + Utils.getFileExtension(decodeURIComponent(cmdLine)).toLowerCase();
				if (ftaMappings[fileExtension]) {
					isFTA = true;
					curReqId = (new Date()).getTime();
					// use timestamp
					curAppId = ftaMappings[fileExtension];
					main_logInfo.comment = "STR={'FileAccess started'}=;JSON={  cmdLine:'"+cmdLine+"'}=;";
                    writeMainWindowLog();
					rfconnector.sendRfMessage({
						"type" : "LaunchApp", //app launch req
						"appID" : curAppId, // app reqd
						"uniqueIdentifier" : curReqId
					}, //unique id, if we want to post multiple msgs.
					'self');
					// request .ica for a given id.
				} else {
					var errMsg = chrome.i18n.getMessage("error_file_extension", [chrome.i18n.getMessage("citrix_receiver"), fileExtension]);
					if (error) {
						errMsg += chrome.i18n.getMessage("error") + ": " + error;
					}
					closeWithError(errMsg);
				}
			}
		} else if (type === "ChromeAppPreferences" || type === "Settings") {
			craPrefs = event.data["data"];
			// Settings response from RfWeb.
			chrome.runtime.getBackgroundPage(function(bgwindow){
				CEIP = bgwindow._CEIP;
				//Merge any configuration sent from storefront web.config
				if(craPrefs){
					try{
						var sfConfigObj = JSON.parse(craPrefs);						
						bgwindow.mergeConfig(bgwindow.CHROME_APP_CONFIG,sfConfigObj);
						CEIP.add('configuration:webConfig',true);
					}catch(ex){
						console.log("Configuration from Web.config is invalid JSON string: " + ex.message);					
					}
				}
			});
		} else if (type === "ICAData") {// ICA data for a given app			
			var error = event.data["error"];
			var icaData = event.data["ICAFile"];
			var appId = event.data["appID"];
			var reqId = event.data["uniqueIdentifier"];
			// if we want to queue fta reqs, then we need to match these.
			if (appId != curAppId || reqId !== curReqId) {
				console.log("AppId and req Id are different!");
			}

			// app launch failed, may be app/desktop is down
			if (error) {
				var errMap = {
					"AppRemoved" : chrome.i18n.getMessage("AppRemoved"),
					"NoMoreActiveSessions" : chrome.i18n.getMessage("NoMoreActiveSessions"),
					"NotLicensed" : chrome.i18n.getMessage("NotLicensed"),
					"UnavailableDesktop" : chrome.i18n.getMessage("UnavailableDesktop"),
					"CouldNotConnectToWorkstation" : chrome.i18n.getMessage("CouldNotConnectToWorkstation"),
					"WorkstationInMaintenance" : chrome.i18n.getMessage("WorkstationInMaintenance"),
					"ResourceError" : chrome.i18n.getMessage("ResourceError"),
					"GeneralAppLaunchError" : chrome.i18n.getMessage("GeneralAppLaunchError"),
					"Unauthorized" : chrome.i18n.getMessage("Unauthorized")
				};

				closeWithError(chrome.i18n.getMessage("error_launch_generic", [chrome.i18n.getMessage("citrix_receiver"), errMap[error]]));
			} else if (icaData) {// success
				main_logInfo.comment = "STR={'Received ICA data. Closing main log helper as FTA launch was successful.'}=;";
				writeMainWindowLog();				
				CEIP.add('session:launchType','fta');

				setTimeout(function() {
					launchSession(icaData, false);
				}, 2000);
			}
		}		
		/*HideAccountSettings and ShowAccountSettings messages are added as part of X1 storefront build 29 onwards. */
		else if(type === "ShowAccountSettings" || type === "HideAccountSettings") {				
			/*Ignoring these messages as few cases messages are not sent properly by RFWeb which is causing AccountSettings button to be hidden.*/
		}
		else if(event.data && event.data["InitialProgram"]){
			CEIP.add('session:launchType','store');
			// ICAData only when user clicked on a resource.
				launchSession(event.data, true);
		}else{
			console.log("Unrecognised post message");
			console.log(event.data);
		}
	} else {
		console.log("There is no data in the event!!");
	}
}
/*Hide/Show account settings button.*/
function showHideAccountSettingsBtn(isShow){
	if(isShow){
		if(accountSettings){
			accountSettings.style.display = "block";
		}	
	}else{
		if(accountSettings){
			accountSettings.style.display = "none";
		}
		/*Hides the account settings page*/
		if(accountSettingsPage && accountSettingsPage.style.display === "block"){	
			accountSettingsPage.style.display = "none";
		}
	}
}

function getQueryVariable(variable) {
	var query = window.location.search;
	query = query.replace(/^\?/, '');
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		if (pair[0] === variable) {
			return decodeURIComponent(pair[1]);
		}
	}
}

function openAccountSettings() {
	var printSettingsRadioBtn=document.getElementById('printerSettings');
    if(!accountSettingsPage){
		accountSettingsPage = document.getElementById("settingsPageBackground");
	}
	accountSettingsPage.style.display = 'block';
    if(printSettingsRadioBtn.checked){
        printerSettingsHandler.getPrinterSetting();				
	} else{	
		var sfInput = document.getElementById("storefront-settings-value");	
		sfInput.focus();
	}
	updateCheckBoxes();
}

function initGeneralSettings(){
	var generalButton = document.getElementById('generalSettings');
	generalButton.labels[0].textContent = chrome.i18n.getMessage("generalSettings");
	var multimonitorSettings = document.getElementById('multimonitorSettingsTitle').innerHTML = chrome.i18n.getMessage("multimonitorSettingsTitle");
	var multimonitorSettingsCheckbox = document.getElementById('multimonitorCheckbox');
	multimonitorSettingsCheckbox.labels[0].textContent = chrome.i18n.getMessage("multimonitorSettingsCheckboxLabel");
	multimonitorSettingsCheckbox.addEventListener('click',multimonitorSettingsListener);
	
	var ceipSettings = document.getElementById('ceipSettingsTitle').innerHTML = chrome.i18n.getMessage("ceipSettingsTitle");
	var ceipSettingsCheckbox = document.getElementById('ceipCheckbox');
	ceipSettingsCheckbox.labels[0].textContent = chrome.i18n.getMessage("ceipSettingsCheckboxLabel");
	ceipSettingsCheckbox.addEventListener('click',ceipSettingsListener);
	updateCheckBoxes(multimonitorSettingsCheckbox,ceipSettingsCheckbox);
}

function multimonitorSettingsListener(event){
	UserConfiguration.localStorage.setItem('useAllMyMonitors',this['checked']);
}

function ceipSettingsListener(event){
	UserConfiguration.localStorage.setItem('ceipEnabled',this['checked']);
}

function updateCheckBoxes(){
	chrome.runtime.getBackgroundPage(function (bgwindow) {		
		UserConfiguration.getEngineSettingsFromPolicy(UserConfiguration.engineSettingsKey,function(policyConfig){
			var multimonitor = document.getElementById('multimonitorCheckbox');
			var ceip = document.getElementById('ceipCheckbox');
			
			var config = JSON.parse(JSON.stringify(bgwindow.CHROME_APP_CONFIG));
			if (Utils.isValid (policyConfig)) {
				config =  bgwindow.mergeConfig(config,policyConfig)
			}
			var isMultiMonitorEnabled = config && config['features'] && config['features']['graphics'] && 
									config['features']['graphics']['multiMonitor'] && 
									(config['features']['graphics']['multiMonitor'] === true);
									
			if (isMultiMonitorEnabled) {
				// TODO: use setAttribute but add the property once during element creation so that 
				// setAttribute can override it.
				//
				multimonitor['disabled'] = false;
				UserConfiguration.localStorage.getItem('useAllMyMonitors',function(result){
					if(result['useAllMyMonitors'] == false){
						multimonitor['checked'] = false;
					}
				});
			} else {
				multimonitor['disabled'] = true;
				multimonitor['checked'] = false;
			}
			
			var isCEIPEnabled = config && config["ceip"] && config["ceip"]["enabled"];
			if(isCEIPEnabled){
				UserConfiguration.localStorage.getItem('ceipEnabled',function(result){
					if(result['ceipEnabled'] == false){
						ceip['checked'] = false;
					}else{
						ceip['checked'] = true;
					}
					ceip["disabled"] = false;
				});
			}else{
				ceip["disabled"] = true;
				ceip["checked"] = false;
			}
		});
	});
}

//Adding keydown for account label to open account settings page through enter key
document.getElementById("accountSettingsLabel").addEventListener("keydown",function(e){
	if (e.which == 13) {
		var printSettingsRadioBtn=document.getElementById('printerSettings');
		printSettingsRadioBtn.checked = false;
		var acctSettingsRadioBtn = document.getElementById("AccountSettings");
		acctSettingsRadioBtn.checked = true;
		var sfInput = document.getElementById("storefront-settings-value");	
		sfInput.focus();
	}
	e.stopPropagation();
});
//Adding keydown for account label to open account settings page through enter key
document.getElementById("generalSettingsLabel").addEventListener("keydown",function(e){
	if (e.which == 13) {
		var generalSettings = document.getElementById("generalSettings");
		generalSettings.checked = true;
	}
	e.stopPropagation();
});
function addAccountSettingsLink() {
	createAccountSettingsPage();
	var reloadImg = document.createElement('span');
	reloadImg.id = 'reload_image';
	reloadImg.title = chrome.i18n.getMessage("reload_store_main");
	
	var accountSettingsImg = document.createElement('span');
	accountSettingsImg.id = 'account_settings_image';
	accountSettingsImg.title = chrome.i18n.getMessage("settings_main");

	accountSettings = document.getElementById('account_settings');
	reloadSettings = document.getElementById('reload_settings');
	reloadSettings.style.display = "none";
	reloadSettings.appendChild(reloadImg);
	accountSettings.appendChild(accountSettingsImg);

	accountSettings.addEventListener('click',openAccountSettings);		
	reloadSettings.addEventListener('click',reloadApplication);	
}
function AccountSettingsKeyUpHandler(e){	
	if (event.which == 13) {
        openAccountSettings();
    }
}

function ReloadImageKeyUpHandler(e){	
	if (event.which == 13) {
        reloadApplication();
    }
}

function reloadApplication(event){
  var webView = document.getElementById('WRFrame');
  var ClearDataOptions = {'since':0};
  var ClearDataTypeSet = {'cookies':true};
  if(webView){
    webView.clearData(ClearDataOptions,ClearDataTypeSet,function(){
		// Update SSO cookies if available and reload as we just cleared them
		SSOCookieHelper.update(null, function(){			
			var url = webView['HTML5CURRENTURL'];
			if (!url) url = webView.src;
			console.log("Reloading after clearing cookies: " + url);
			webView.src = url;
			webView.focus();
		});
	});
  }
}


function showPreferencesPage(is_show){
	var prefsIframe = document.getElementById("preferences");
	if(prefsIframe){
		if(is_show){
			prefsIframe.style.display = "block";		
		}else{
			prefsIframe.style.display = "none";
		}
	}
}
function showMainPage(){
	showPreferencesPage(false);
	document.getElementById("main").style.display = "block";
	writeHTML5LogAppName(main_logInfo.filename);
	rfconnector = new RfWebConnector();
	var condition = navigator.onLine ? "online" : "offline";
	rfconnector.start({
		rootElementId : 'main',
		onlinestatus : condition
	});
	addAccountSettingsLink();
	initGeneralSettings();
	Redirect();	
	chrome.runtime.getBackgroundPage(function(bgwindow){
		CEIP = bgwindow._CEIP;		
		var npsConfig = {};
		npsConfig["HTML5_CONFIG"] = bgwindow.CHROME_APP_CONFIG;
		npsConfig["isChromeOS"] = (((navigator.userAgent.search(/CrOS/i) !== -1) && (navigator.appVersion.search(/CrOS/i) !== -1) && (navigator.platform.search(/Linux/i) !== -1) ) ) ? true : false;
		npsConfig["isChromeApp"] = true;
		npsConfig["isKiosk"] = isKioskMode;	
		NetPromoters.init(npsConfig);
	});
}

function Redirect() {
	try {
		// Hide Scrollbars if there is no need.
		document.body.style.margin = "0px";		
		document.body.style.overflow = 'hidden';
		
		/*BUG0623810 : Web fonts not loading properly due to caching optimisation in Chrome app. So few strings are showing empty. 
		Applying font-family through inline styling will force chrome app to load the fonts */
		document.body.style.fontFamily = "citrixsans,Helvetica Neue,Helvetica,Arial,Sans Serif";		

		// SSO configuration
		UserConfiguration.getSSOSettingsFromPolicy(function(sso_settings){
			SSOCookieHelper.update(sso_settings, function() {
				// Get latest information from DB
				UserConfiguration.getSFRecord(UserConfiguration.settingsKey, function(sfr) {
					var g_sfr = sfr;
					if (Utils.isValid(g_sfr) && Utils.isValid(g_sfr[UserConfiguration.defSfrKey]["rf_web"]['url'])) {
						// Check if we have cmdline
						var queryParams = decodeURIComponent(window.location.search);
						if (queryParams.search(/cmdLine/i) !== -1) {
							cmdLine = getQueryVariable('cmdLine');
						}
						rfconnector.setStore(g_sfr);
						var timeNow = Date.now.bind(Date);
						rfconnector.reConnection(timeNow());
					} else {
						closeWithError(chrome.i18n.getMessage("error_notConfigured", [chrome.i18n.getMessage("citrix_receiver")]));
					}
				});
			});
		});
	} catch (e) {
		CtxMessage.showEmbeddedError(chrome.i18n.getMessage("citrix_receiver"), chrome.i18n.getMessage("error_help_desk", [e.message]), null, null, null);
		throw e;
	}
}

function AdjustSize() {
	if (rfconnector) {
		rfconnector.resize();
	}else{
		chrome.system.display['getInfo'](function(displayInfo){
		  var isUnifiedMode = g.Utils.getUnifiedDisplayBounds(displayInfo).isUnifiedMode;
			if(isUnifiedMode){
				for(var i=0;i<displayInfo.length;i++){
					if(displayInfo[i]['isPrimary'] == true){
						windowWidth = displayInfo[i].bounds.width+ 'px';
						windowHeight = window.innerHeight+'px';
						break;
					}					
				}
			}else{
				windowWidth = window.innerWidth+'px';
				windowHeight = window.innerHeight+'px';
			}
			var parentDiv = window.parent.document.getElementById("parent");
			parentDiv.style.maxWidth = windowWidth;
			parentDiv.style.maxHeight = windowHeight;
		});
	}
}

function getDomain(wrURL) {
	if (!wrURL) {
		return null;
	}
	var url_parts = wrURL.split("/");
	var target = url_parts[0] + "//" + url_parts[2];
	return target;
}

function verify(event, rfUrl) {
	return (event.origin == getDomain(rfUrl));
}

function updateOnlineStatus(event) {

	var condition = navigator.onLine ? "online" : "offline";
	var state = 'connecting';
	if (condition == "offline") {
		state = 'Disconnected';
	}
	main_logInfo.state = state, main_logInfo.comment = 'JSON={  network-status:"' + condition + '"}=';
	writeMainWindowLog();
	if (condition == "online") {
	} else {
		Notifications.showInformationWithId(chrome.i18n.getMessage('offlinestatus'), null, null, notificationId);
	}

	if (rfconnector) {
		rfconnector.changeNetWorkStatus(condition);
	}
}

document.getElementById("AccountSettings").labels[0].textContent=chrome.i18n.getMessage("account");
document.getElementById("storefront-settings-value-apply-button").innerHTML = chrome.i18n.getMessage("apply");
document.getElementById("storefront-settings-label").innerHTML = chrome.i18n.getMessage("store_address",[chrome.i18n.getMessage("store")]);

window.addEventListener("message", receiveMessage, false);
window.addEventListener("resize", AdjustSize, false);
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
function onfocusStoreFrontSettingValue(e) {
	document.getElementById('storefront-settings-value-apply-button').style.backgroundColor = "#02a1c1";
	document.getElementById('storefront-settings-value-apply-button').style.color = "rgba(255, 255, 255, 1.0)";
	e.stopPropagation();
}

function onblurStoreFrontSettingValue(e) {
	document.getElementById('storefront-settings-value-apply-button').style.backgroundColor = "rgba(2, 161, 193, 0.5)";
	document.getElementById('storefront-settings-value-apply-button').style.color = "rgba(255, 255, 255, 0.6)";
	e.stopPropagation();
}

function storeInputKeyUpHandler(e){
	e.which = e.which || e.keyCode;
    if(e.which == 13) {
        OnApply();
		document.getElementById('storefront-settings-value-apply-button').focus();
    }
}

document.getElementById('storefront-settings-value').addEventListener('blur', onblurStoreFrontSettingValue, false);
document.getElementById('storefront-settings-value').addEventListener('focus', onfocusStoreFrontSettingValue, false);
document.getElementById('storefront-settings-value').addEventListener('keydown', storeInputKeyUpHandler, false);
