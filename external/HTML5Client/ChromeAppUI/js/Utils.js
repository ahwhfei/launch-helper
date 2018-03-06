// Generic functions serving as utilities
var Utils;
(function(Utils) {	
	Utils.closeWindowTimeOut = 100;
	Utils.isNullOrUndefined = function (object) {
		return ((null === object) || ('undefined' === typeof object)) ? true : false;
	};
	Utils.isNullOrEmpty = function (string) {
		return ((null === string) || (0 === string.length)) ? true : false;
	};
	Utils.isValid = function (object) {
		return !Utils.isNullOrUndefined (object);
	};
	Utils.getFileExtension = function (fileName) {
		return fileName.replace (/"/g, '').split ('.').pop (); // remove quotes in filename and split by .
	};
	Utils.getMessage = function (id) {
		return chrome.i18n.getMessage (id);
	};
	Utils.include = function (jsFile) {
		if (Utils.isValid (jsFile)) {
			var includeJS = document.createElement ('script');
			includeJS.setAttribute ('src', jsFile);
			includeJS.setAttribute ('type', 'text/javascript');
			document.getElementsByTagName ('head')[0].appendChild (includeJS);
		}
		else {
			console.log ("Utils.include(): invalid jsFile = %s", jsFile);
		}
	};
	Utils.getJSON = function (url, async, callback) {
		function dispatchResult (xhr, callback) {
			var response = (200 === xhr.status) ? xhr.responseText : null;
			callback (JSON.parse (response));
		}
		var options = {
			'url': url,
			'async': async,
			'operation': 'GET',
			'onreadystatechange': null
		};
		if (true === async) {
			options.onreadystatechange = function () {
				if (4 === this.readyState) {
					dispatchResult (this, callback);
				}
			};
			Utils.executeXHR (options);
		}
		else {
			var xhr = Utils.executeXHR (options);
			dispatchResult (xhr, callback);
		}
	};
	//
	// Utils.executeXHR method take "options" as parameter. where options is
	// var options = {
	//   'url': url,                                  // URI of the resource to fetch
	//   'async': async,                              // true/false to make send() unblocking or blocking
	//   'operation': operation,                      //  "GET", "POST", "PUT", "DELETE", etc.
	//   'timeout': timeout,                          // timeout in millisec. 0 (default)
	//   'ontimeout': ontimeout,                      // callback method on timeout. of type function () {}
	//   'responseType': responseType,                // 'json', '' (default), 'blob', 'document', 'arraybuffer'
	//   'onreadystatechange': onreadystatechange,    // callback method onreadystatechange of type function () {}
	//   'onerror': onerror                           // callback method onerror of type function () {}
	//   }
	//
	Utils.executeXHR = function (options) {
		var xhr = new XMLHttpRequest ();
		if ((true === options['async']) && Utils.isValid (options['timeout'])) {
			xhr['timeout'] = options['timeout'];
		}
		if ((true === options['async']) && Utils.isValid (options['ontimeout'])) {
			xhr['ontimeout'] = options['ontimeout'];
		}
		if (Utils.isValid (options['responseType'])) {
			xhr['responseType'] = options['responseType'];
		}
		if ((true === options['async']) && Utils.isValid (options['onreadystatechange'])) {
			xhr['onreadystatechange'] = options['onreadystatechange'];
		}
		if (Utils.isValid (options['onerror'])) {
			xhr['onerror'] = options['onerror'];
		}

		xhr.open (options['operation'], options['url'], options['async']);
		xhr.send ();
		return xhr;
	};
	/*
	 * This fn always return success and similiar to Utils.isServerReachable fn
	 */
	Utils.alwaysServerReachable = function (xhrInfo, onSuccess ,onError) {
		xhrInfo.succeed = true;
		if (xhrInfo.responseInfo) {
			if (xhrInfo.responseInfo.status == null) {
				xhrInfo.responseInfo.status = 200;
			}
		}
		onSuccess(xhrInfo);
		
	};
	Utils.isServerReachable = function (xhrInfo, onSuccess ,onError) {	
		var replyback = 0;
		var replycallback = null;
		xhrInfo.succeed = false;
		var options = {
			'url': xhrInfo.url,
			'async': true,
			'operation': 'HEAD',
			'onreadystatechange': function (events) {            
				if (4 === this.readyState) {
					var status = this.status;
					if ((status >= 200 && status <=399) || ( status >= 401 && status <= 403)) {
						console.log ("Utils.isServerReachable(): %s accessible!!!", xhrInfo.url);
						xhrInfo.succeed = true;
						replyback = (replyback == 0)?1:replyback;
						replycallback = onSuccess;
						sendResponse(this);
					}
					else {
						  console.log ("Utils.isServerReachable(): %s not accessible @1, status = %d", xhrInfo.url, this.status);
						  xhrInfo.succeed = false;
						  replyback = (replyback == 0)?1:replyback;
						  replycallback = onError;
						  sendResponse(this);
					}
				}
			},
			'onerror': function (events)  {
				  console.log ("Utils.isServerReachable(): %s not accessible @2, status = %d", xhrInfo.url, this.status);
				  xhrInfo.succeed = false;
				  replyback = (replyback == 0)?1:replyback;
				  replycallback = onError;
				 sendResponse(this);
			}
		};
		
		function sendResponse(xhrResponse)
		{
			if(replyback == 1){
				replyback = 2;
				if(replycallback)
				{
					if(xhrInfo.responseInfo){
						if(xhrInfo.responseInfo.status == null)
						{
							xhrInfo.responseInfo.status = (xhrResponse.status)?xhrResponse.status:0;					
						}
					}
					
					// delay the response a bit so that all network requests do not happen at same time.
					setTimeout(function() {
						replycallback(xhrInfo);
					}, 100);
				}    		
			}	
		}    
		console.log ("Utils.isServerReachable(): Check if %s is accessible?", xhrInfo.url);
		var xhr = Utils.executeXHR (options);
	};
	Utils.checkNetworkConnectivity = function (externalBeacons) {
		if (Utils.isNullOrEmpty (externalBeacons)) {
			console.log ('Utils.checkNetworkConnectivity(): externalBeacons = null. May be not configured');
		}
		else {
			externalBeacons.forEach (function (url) {
				Utils.isServerReachable (url, function (reachable) {
					if (false === reachable) {
						Notifications.showTextMessage (chrome.i18n.getMessage("network_error"), chrome.i18n.getMessage("error_network_conn",[url]));
					}
					else {
						console.log ("Utils.checkNetworkConnectivity(): %s reachable!", url);
					}
				});
			});
		}
	};
	Utils.getURLComponents = function (url) {
		var t = document.createElement ('a');
		t.href = url;
		var urlComponents = {
			'hash': t.hash,
			'host': t.host,
			'hostname': t.hostname,
			'origin': t.origin,
			'pathname': t.pathname,
			'protocol': t.protocol,
			'search': t.search,
			'url': url
		};
		return urlComponents;
	};
	Utils.safeDispatcher = function (callback, argumentToCallback) {
		try {
			Utils.unsafeDispatcher (callback, argumentToCallback);
		}
		catch (e) {
			Notifications.showInternalError (e.message);
		}
	};
	Utils.unsafeDispatcher = function (callback, argumentToCallback) {
		if (Utils.isValid (callback)) {
			callback (argumentToCallback);
		}
		else {
			console.log ("callback = null");
			throw new GenericError (chrome.i18n.getMessage("null_callback"));
		}
	};
	Utils.isFileOnGoogleDrive = function (filePath) {
		// This is how filePath looks 
		// Download  ->     ~/Download/<path to file>
		// USB Drive ->     /media/removable/USB Drive/<path to file>
		// GoogleDrive ->   /special/drive*/(root|other)/<path to file>
		// var re = new RegExp (/^\/special\/drive.*\/(root|other)\//i);
		// Commenting above line till Fusion Labs fixes honouring "Shared with me" folder files. Will answer BUG0464185 as designed by third party limitation. 
		var re = new RegExp (/^\/special\/drive.*\/root\//i);
		return re.test (filePath);
	};
	Utils.isAssociatedFileType = function (associatedFileTypes, fileExtn) {
		for (var i = 0; i < associatedFileTypes.length; i++) {
			if (fileExtn.toLowerCase () === associatedFileTypes[i].toLowerCase ()) {
				return true;
			}
		}
		return false;
	};
	Utils.getDefaultGateway = function(gateways) {
		var defGateway = "";
		if (Utils.isValid (gateways)) {
			if (Array.isArray(gateways)) {
				defGateway = gateways[0]["Location"];
				for (var i = 0; i < gateways.length; i++) {
					if (gateways[i]["_Default"] === "true") {
						defGateway = gateways[i]["Location"];
						break;
					}
				}			
			} else {
				defGateway = gateways["Location"];
			}
		}
		return defGateway;
};
})(Utils || ( Utils = {}));

// Notification for the system
function Notifications () {
}
Notifications.showTextMessage = function (titleText, messageText, iconURL, callback ,id, buttonDetails) {
	var btnclkListener;
	//check atleast one button and button callback are defined
	if ((!Utils.isNullOrUndefined (buttonDetails)) && (!Utils.isNullOrUndefined (buttonDetails.btncallback)) && ('function' === typeof buttonDetails.btncallback) &&(!Utils.isNullOrUndefined (buttonDetails.buttons[0])) ){
			btnclkListener = buttonDetails.btncallback;
			btn1 = buttonDetails.buttons[0];
			//Check whether two buttons are defined
			if(!Utils.isNullOrUndefined (buttonDetails.buttons[1])){
				btn2 = buttonDetails.buttons[1];
				var options = {
    	    	'type': 'basic',
		        'iconUrl': iconURL,
    	    	'title': titleText,
    		    'message': messageText,
	        	buttons: [{ title: btn1},
        	          { title: btn2}]
    			};
			}
			else{
				var options = {
    	    	'type': 'basic',
		        'iconUrl': iconURL,
    	    	'title': titleText,
    		    'message': messageText,
	        	buttons: [{ title: btn1}]
    			};	
			}
	}
	//without button options
	else{
    	var options = {
        	'type': 'basic',
	        'iconUrl': iconURL,
	        'title': titleText,
    	    'message': messageText
    	};
    }
    if (Utils.isNullOrUndefined (options.iconUrl)) {
        var manifest = chrome.runtime.getManifest ();
        var iconSize = ['16', '32','48', '128','256'];
        var icons = [];
        iconSize.forEach (function (index) {
            var iconUrl = manifest["icons"][index];
            if (Utils.isValid (iconUrl)) {
                icons.push (iconUrl);
            }
        });
        options.iconUrl = icons.pop ();
    }
    if (Utils.isNullOrUndefined (callback) || ('function' !== typeof callback)) {
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
    if ((!Utils.isNullOrUndefined (buttonDetails)) &&(!Utils.isNullOrUndefined (buttonDetails.btncallback)) && ('function' === typeof buttonDetails.btncallback))
    	chrome.notifications.onButtonClicked.addListener(btnclkListener);
};
Notifications.showError = function (errorText, iconURL, callback) {
    Notifications.showTextMessage (chrome.i18n.getMessage("error"), errorText, iconURL, callback);
};
Notifications.showInformation = function (informationText, iconURL, callback) {
    Notifications.showTextMessage (chrome.i18n.getMessage("information"), informationText, iconURL, callback);
};
Notifications.showInformationWithId = function (informationText, iconURL, callback ,id) {
    Notifications.showTextMessage (chrome.i18n.getMessage("information"), informationText, iconURL, callback ,id);
};
Notifications.showInternalError = function (internalErrorText, iconURL, callback) {
    Notifications.showTextMessage (chrome.i18n.getMessage("internal_error"), internalErrorText, iconURL, callback);
};

Notifications.showInfoWithButtons = function (titleText,messageText,buttonDetails,iconURL, callback,id) 
{
    Notifications.showTextMessage (titleText, messageText, iconURL, callback, id, buttonDetails);
}

// Generic error object that can be throw
function GenericError (msg)
{
    this.message = msg;
}
GenericError.prototype.message = '';

