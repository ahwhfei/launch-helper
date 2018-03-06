var g_sfr = null;
var engine = null;

/*Base config as per configuration.js
This should be used before merging with any config received outside app*/
var CHROME_APP_BASE_CONFIG;

/*This stores the CONFIG derived after merging with CHROME_APP_BASE_CONFIG and chromeapppreferences from web.config*/
var CHROME_APP_CONFIG;

//Used for appview launches (base config merged with kiosk settings)
var CHROME_APP_CONFIG_APPVIEW;

var asyncObjects ;
(function() {
	var objectCache = { };
	var objectListeners = [];
	
	function checkForEntry(idStr){
		if(objectCache[idStr]){
			return true;
		}else{
			return false;
		}
	}
	function add(idStr ,obj){
		objectCache[idStr] = obj;
		if(objectListeners[idStr]){
			for(var i = 0 ; i < objectListeners[idStr].length ;i++) {
			    objectListeners[idStr][i](obj);
			}
		}
		objectListeners[idStr] = [];
		
	}
	function remove(idStr ){
		delete objectCache[idStr];
	}
	function get(idStr ,callback){
		if(objectCache[idStr]){
			callback(objectCache[idStr]);
		}else{
			if(!objectListeners[idStr]){
				objectListeners[idStr] = [ ];
			}
			objectListeners[idStr].push(callback);
		}
	}
	function clear( ){
		objectCache = { };
		objectListeners = { };
	}
	asyncObjects = {add : add , remove :remove , get :  get ,clear:clear, checkForEntry:checkForEntry};
})();

this.asyncObjects = asyncObjects;

function loadHTML5Engine( ){
    function startHTMLSession( ){
        engine = new HTML5Engine( );
        var parent = document.createElement('div');
        parent.id = "citrixuiElement";
        document.body.appendChild(parent);
        engine.setParameter({'ui':{'root':"citrixuiElement"}});
        engine.setParameter({'engine':{'type':"chromeApp" }});
        engine.initEngine( );
    
    }
    (function() {
        var script = document.createElement('script');
		script.onload = startHTMLSession;
		script.async = false;
		script.src = "../src/SessionWindow.js";
		script.type = "text/javascript";
		document.body.appendChild(script);
    })();
}

// Open the Preferences page (a.k.a LaunchPage/LandingPage)
function openLaunchPage (launchData) {	
	UserConfiguration.getPrimaryMonitorDisplayInfo(function(bounds){    	 
  
		var pageURL = '/ChromeAppUI/Main.html', id = 'Main';
		if (launchData["cmdLineParams"]){
			pageURL += '?cmdLine=' + encodeURIComponent(launchData["cmdLineParams"]);
			id += (new Date()).getTime();
		}
			
		//Creating a hidden window by default and is shown if required later.
		var options = {
			'state' : 'maximized',
			'id': id,
			'minWidth': 800,
			'minHeight': 600
		};
		if(bounds){
		  options["outerBounds"]  = bounds;
		  options["state"] = "normal";
		}
		chrome.app.window.create (pageURL, options,function(createdWindow) {
			/*
			 * Disabling chrome app specific setting in htmlreceiver
			 */
			createdWindow.contentWindow.isKioskMode = launchData["isKioskSession"];
		});
	 });
}

// Launch FTA
function launchFTA(filePath) {
	// FileOnCloudStorage is hint for XA app launcher to use File Access, '0+' tells FileAccess application to interpret cmdLine parameter as "GoogleDrive file path"
	var cmdLineParams = '\"FileOnCloudStorage\" \"0+' + filePath.replace (/\/special\/drive.*\/root/, '/root') + '\"';
	openLaunchPage({"isKioskSession":false,"cmdLineParams":cmdLineParams});
}


// Launch session from .ica file
//for SDK launches sessionId is passed from SDK 
function launchSessionFromICAData(icaData,sessionId,onWindowCreated) {
	UserConfiguration.getEngineSettingsFromPolicy(UserConfiguration.engineSettingsKey,function(policyConfig){	
		initApp(null);
		
		//Copies the base config of chrome app derived using configuration.js to configObj and applies any policy from admin console.
		var configObj = JSON.parse(JSON.stringify(CHROME_APP_BASE_CONFIG));		
		
		//If any preferences sent using ica file then that is merged.
		if(icaData["chromeAppPreferences"]){
			try{
				var prefsFrmIca = icaData["chromeAppPreferences"];
				configObj =  mergeConfig(configObj,prefsFrmIca);
				_CEIP.add('configuration:defaultIca',true);
			}catch(e){
				console.log("Invalid JSON string from icaData chromeAppPreferences");
			}
		}
		
		//Finally config using policy if any will be merged
		if (Utils.isValid (policyConfig)) {
			configObj =  mergeConfig(configObj,policyConfig)
		}
		var currentTime = (new Date()).getTime();
		var lang;
		  var isSeamless = false;
		  if(icaData && (icaData['TWIMode'] == 'on' || icaData['TWIMode'] == 'On')){
			isSeamless = true;
		}
		
		if(icaData["UILocale"]) {
			lang=icaData["UILocale"];
		}
		else {
			lang=chrome.i18n.getUILanguage();
		}
		

						
		var winId = sessionId || 'Session' + currentTime;			
		var pageURL = "/src/SessionWindow.html" + '?launchid=' + winId + "#type=message&redirecturl=none&launcherType=chromeApp&lang="+lang;
		UserConfiguration.getWindowStatus(configObj,callback);
		function callback(state){
		  UserConfiguration.getMultimonitorEnabled(configObj, function (mmEnabled) {
			var options = {
				minWidth : 800,
				minHeight: 600,
				id: winId,
  				state: state,
  				mmEnabled : mmEnabled
			};
		if((configObj && configObj['seamless'] && configObj['seamless']['showInShelf']) && !isSeamless){
			options['showInShelf'] = true;
				if(icaData['ConnectionBar']== 1)
				 options['icon'] = "/ChromeAppUI/resources/images/DesktopIcon.png";
		}
			function onLoad(appWindow){
				appWindow.contentWindow.HTML5_CONFIG = configObj;
				appWindow.contentWindow.postMessage({"cmd": "ICADATA", "icaData": icaData}, self.location.origin);
				console.log("posting message");    		
				if(onWindowCreated){
					var winId = sessionId || 'Session' + currentTime;
					onWindowCreated(appWindow,{"id":winId})
				}
			
			}			
			HTML5Interface.launchSessionWindow(pageURL, {onDOMContentLoaded: onLoad } , options, icaData);
		  });
		}
	});
}

var parseIcaData = function (data, keyVals) {
    if (data && keyVals) {
        if(data.indexOf('\r')==-1){
            var dataArr = data.split('\n');
        }else{
            var dataArr = data.split('\r\n');
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
    }
};

function processICAFile (icaFile) {
	_CEIP.add('session:launchType','icaFile');
    UserConfiguration.readICAFile (icaFile, function (data /* Contents of ICA File as JSON Object */) {
        if (Utils.isValid (data)) {
            var icaData = {};
            parseIcaData(data, icaData);

            if (icaData["RemoveICAFile"] == "yes") {
                chrome.fileSystem.getWritableEntry(icaFile, function(writableFileEntry) {
                    writableFileEntry.remove(function() {console.log(writableFileEntry.name + " deleted");}, function(e) {
                        console.log(writableFileEntry.name + " not deleted");
                        console.log(e);});
                });
            }

            launchSessionFromICAData(icaData,null,null);
        }
        else {
            Notifications.showInternalError (chrome.i18n.getMessage("error_app_open",[chrome.i18n.getMessage("citrix_receiver")]) + " : " + icaFile.name);
        }
    });
}

// Configure from CR file
function processCRFile (crFile) {
	var processCR = true;
	_CEIP.add('configuration:cr',true);
	
	UserConfiguration.getSFRecord (UserConfiguration.settingsKey, function (sfr) {		
		if (Utils.isValid (sfr)) {
			if(sfr[UserConfiguration.defSfrKey]["configure_type"] === UserConfiguration.types.GOOGLEPOLICY){
				processCR = false;
				Notifications.showInformation (chrome.i18n.getMessage("policy_applied_config_fail"));
			}
		}
		
		if(processCR){		
			 UserConfiguration.readConfigFile (crFile, function (jsonObject /* Contents of CR File as JSON Object */) {
				if (Utils.isValid (jsonObject)) {
					jsonObject["fileName"] = crFile["name"];
					
					// Show the trust SF message and store info if user allows it.
					var pageURL = '/ChromeAppUI/Message.html';
					var options = {
						'frame':'none',
						'minWidth':520,
						'maxWidth':520,
						'minHeight':300,
						'maxHeight':300,
						'id': 'Message'
					};

					chrome.app.window.create (pageURL, options, function (createdWindow) {
						createdWindow.contentWindow.crFileObj = jsonObject;
					});
						
				}
				else {
					Notifications.showInternalError (chrome.i18n.getMessage("error_config_fail",[chrome.i18n.getMessage("citrix_receiver"),crFile["name"]]));
				}
			});
		}
	}); 
}

// Process all other file types
function processFile (entry, filePath) {
    
	// Only launch main page if RfWeb already available.
    if (Utils.isValid (g_sfr)) {
        launchFTA(filePath);
    }
    else {
        Notifications.showInternalError (chrome.i18n.getMessage("error_notConfigured",[chrome.i18n.getMessage("citrix_receiver")]));
    }
}

function processFiles (fileEntries) {
    fileEntries.forEach (function (fileEntry) {
        var entry = fileEntry.entry;
        var mimeType = fileEntry.type;

        var fileName = entry.name;
        var fileExtension = Utils.getFileExtension (fileName);

        if (UserConfiguration.types.CR === fileExtension.toLowerCase ()) {
            processCRFile (entry);
        } else if ('ica' === fileExtension.toLowerCase ()) {
            processICAFile(entry);
        }
        else {
             chrome.fileSystem.getDisplayPath (entry, function (filePath) {
                if (Utils.isFileOnGoogleDrive (filePath)) {
                    processFile (entry, filePath);
                }
                else {
                    Notifications.showInformation (chrome.i18n.getMessage("error_file_open_gdrive",[chrome.i18n.getMessage("citrix_receiver")]));
                }
             });
        }
    });
}

// Process launchData
function processLaunchData (launchData) {
    if (Utils.isValid (launchData) && Utils.isValid (launchData.items)) {
        Utils.safeDispatcher (processFiles, launchData.items);
    }
    else {
		if(!launchData['isKioskSession']){
			launchData['isKioskSession'] = false;
		}
        openLaunchPage ({"isKioskSession":launchData['isKioskSession']});
    }
}

//V0 is the old configuration format used. This needs to be migrated to the V1 settings format.

function migrateOldConfiguration(result){
	var sfr = sfRecord.createV1Record();
	sfr[UserConfiguration.defSfrKey]["configure_type"] = UserConfiguration.types.ACCOUNTURL;
	
	//Fetching the values stored using old key and storing under new key
	if(Utils.isValid(result)){
		if(result["rfWeb"]){
			sfr["store_settings"]["rf_web"]["url"] = result["rfWeb"];
		}
		
		if(result["internalBeacon"]){
			sfr['store_settings']['beacons']['internal'].push({'url':result['internalBeacon']});
		}
		
		if(result['accessGateway']){
			sfr['store_settings']['gateways'].push({'url': result['accessGateway']});
		}
		
		if (Utils.isValid(result['externalBeacons'])&&(Array.isArray(result['externalBeacons']) || (result['externalBeacons'] instanceof Array))){
			for(var i=0;i<result['externalBeacons'].length;i++){
				sfr['store_settings']['beacons']['external'].push({'url': result['externalBeacons'][i]});
			}
		}
		else{
			sfr['store_settings']['beacons']['external'].push( {'url': result['externalBeacons']});
		}
		Storage.setValue(UserConfiguration.settingsKey, sfr);
		Storage.removeKey(UserConfiguration.oldDefSfrKey);
		UserConfiguration.setUnsecureSFPrompt(true);			
	}
}

function mergeConfig(baseConfig,extendedConfig) {
	return configUtils.merge(baseConfig,extendedConfig);
}
function launchOverlayWindow() {
    console.log("creating overlay window");
    if(asyncObjects.checkForEntry('appWindow.overlayWindow') == false) {
        console.log("creating overlay window in bg page");
        chrome.app.window.create('../ChromeAppUI/overlayWindow.html', {
            'frame': 'none',
            'id': 'overlayWindow',
            'hidden' : true,
            'alwaysOnTop' : true,
            'focused':false,		
        }, function (appWindow) {
        	asyncObjects.add('appWindow.overlayWindow' ,appWindow);
        });
    }
}


loadProxyWindow = function() {
    console.log("Creating proxy window");
    var bg = this;
    chrome.app.window.create('../ChromeAppUI/ProxyWindows.html', {
        'hidden' : true,
        'id' : 'proxyWindows',
        'frame': 'none',
        'alwaysOnTop' : true,
        'focused':false
    },function (appWindow) {
    	if(appWindow){
    	asyncObjects.add('appWindow.proxyDomWindow' ,appWindow.contentWindow);
    	asyncObjects.add('appWindow.proxyWindow' ,appWindow);
    	asyncObjects.add('appWindow.chromeConfig' ,CHROME_APP_CONFIG);
    	}
    });
};

this.context = {}; 
var bgContext = this.context;


function chromeRxLaunched(launchData) {

	var launchType = launchData["isKioskSession"] ? "kiosk": null;
	initApp(launchType);
	if(launchData["isKioskSession"]){
		_CEIP.add("sessionMode","kiosk");
	}else if(launchData["isPublicSession"]){
		_CEIP.add("sessionMode","public");
	}
	 //Read the localStorage
	 UserConfiguration.getSFRecord (UserConfiguration.settingsKey, function (sfr) {
		g_sfr = sfr;
		if (!Utils.isValid (g_sfr)) {
			//If in case of upgrade , old JSON structure needs to be migrated to new JSON structure.
			Storage.getValue(UserConfiguration.oldDefSfrKey, function(result){
				if(Utils.isValid(result)){
					migrateOldConfiguration(result);
					processLaunchData (launchData);
				}
				else{
					//Read default.cr file
					UserConfiguration.readConfigFile2 ('default.cr', true, function (jsonObject /* Content of CR file as JSON object */) {
						if (Utils.isValid (jsonObject)) {
							if(Utils.isValid (jsonObject["Services"]) && Utils.isValid(jsonObject["Services"]["Service"]) && Utils.isValid(jsonObject["Services"]["Service"]["rfWeb"])) {				
								g_sfr = sfRecord.createFromCRFile (jsonObject);
								UserConfiguration.setSFRecord (UserConfiguration.settingsKey, g_sfr);
								Notifications.showInformation (chrome.i18n.getMessage("CR_config_applied",[chrome.i18n.getMessage("citrix_receiver"),"default.cr"]));
							}
							else{
								Notifications.showInternalError (chrome.i18n.getMessage("error_config_fail_withError",[chrome.i18n.getMessage("citrix_receiver"),"default.cr","No rfWeb entry."]));
							}
						}
						
						// Continue to do what the user is intending to do. 
						// We don't care if AutoConfig failed above. We are anyways handling errors.
						processLaunchData (launchData);
					});
				}
			});
		}
		else {
			processLaunchData (launchData);
		}
	}); 	
}
function initApp(launchType){
	initConfiguration(launchType);
	initHTML5Engine();
	initCEIP(false);
}


// Set default base configuration based on platform constraints here
function overrideBaseConfiguration(baseConfig) {
	// Get Chrome OS Major version number to set version contraint configuration settings.
	// TODO: move platform / browser information methods to common utility and make it generic.
	//
	function getMajorVersion() {
		var majorVersion = 0;

		if (navigator.appVersion.search(/CrOS/i) !== -1) {
			var nAgt = navigator.userAgent;
			var verOffset = nAgt.indexOf("Chrome");
			var osVersion = nAgt.substring(verOffset + 7, verOffset + 19);
			majorVersion = parseInt('' + osVersion, 10);
		}

		return majorVersion;
	}

	// Assuming baseconfig must be there.
	if (baseConfig ) {
		// Default value set: enable showInShelf for chrome os version 61 and above
		baseConfig['seamless'] || (baseConfig['seamless'] = {});

		// set default value only if defined in configuration file
		if (typeof baseConfig['seamless']['showInShelf'] !== "boolean") {
			baseConfig['seamless']['showInShelf'] = (getMajorVersion() > 60);
		}
	}
}

function initConfiguration(launchType){

	if(!CHROME_APP_BASE_CONFIG){
		//Cloning the base chrome app config
		CHROME_APP_BASE_CONFIG = configUtils.getChromeAppBaseConfig();

		// Set default base configuration based on platform constraints
		overrideBaseConfiguration(CHROME_APP_BASE_CONFIG);

		//Cloning the base chrome app config
		CHROME_APP_CONFIG = JSON.parse(JSON.stringify(CHROME_APP_BASE_CONFIG));		
	}
	
	if(launchType == "kiosk"){
		var kioskConfig = {"ui":{"toolbar":{"menubar":"false"}}};		 
		CHROME_APP_CONFIG = mergeConfig(CHROME_APP_CONFIG,kioskConfig);
	}else if(launchType == "appview"){
		var kioskConfig = {"ui":{"toolbar":{"menubar":"false"}}};	
		CHROME_APP_CONFIG_APPVIEW = JSON.parse(JSON.stringify(CHROME_APP_BASE_CONFIG));		
		CHROME_APP_CONFIG_APPVIEW = mergeConfig(CHROME_APP_CONFIG_APPVIEW,kioskConfig);
	}

	
}
function initHTML5Engine(){		
	if(!engine){
		loadHTML5Engine ();

		//Start seamless related windows
		launchOverlayWindow();
		loadProxyWindow();
	 
		// suspend when we are idle
		IdleChecker.start();
	}
}
// OnLaunched handler
chrome.app.runtime.onLaunched.addListener(chromeRxLaunched);

//check if application update available
chrome.runtime.onUpdateAvailable.addListener( function(details) {
  // Show a notification to the user that an update is available, and ask if they want to update now
  	var diff_version = 0;
  	console.log("Trying to Update CRA " + details.version);
  	var manifest = chrome.runtime.getManifest();
	console.log("Current Verson" + manifest.version);
	var cur_version = (manifest.version).split(".");
	var new_version = (details.version).split(".");
	if(cur_version.length == new_version.length)
	{
		for(var i=0;i<=cur_version.length;i++)
		{
			if(parseInt(cur_version[i]) != parseInt(new_version[i]))
				diff_version = 1;
		}
	}
	else
		diff_version = 1;
	if(diff_version)
	{
		//If version is different, then only show update notification
		console.log("Show notification");
		var buttonConfig = {"buttons"    : [chrome.i18n.getMessage("Button_Now"),chrome.i18n.getMessage("Button_Later")],
  		"btncallback" : updateChromeApp};
	
		Notifications.showInfoWithButtons(chrome.i18n.getMessage("CRA_update_notification",[chrome.i18n.getMessage("citrix_receiver")]),chrome.i18n.getMessage("CRA_restart_message",[chrome.i18n.getMessage("citrix_receiver")]),buttonConfig);
	}	
});

//PostMessage listener to process the messages sent from the other app windows.
function MessageHandler(event){
	//Create the store address changed notification.
	if(event.origin === window.location.origin && event.data){ 
		if(event.data['cmd'] === "STORE_CHANGE_NOTIFICATION"){			
			
			var buttonConfig = {"buttons"    : [chrome.i18n.getMessage("restart_now")],"btncallback" : reloadChromeApp};
			
			Notifications.showInfoWithButtons(chrome.i18n.getMessage("store_address_change",[chrome.i18n.getMessage("citrix_receiver")]),chrome.i18n.getMessage("CRA_restart_message",[chrome.i18n.getMessage("citrix_receiver")]),buttonConfig); 
		}else if(event.data['cmd'] === "STORE_CHANGE_BY_CR_NOTIFICATION"){			
			var crFileName="";
			if(event.data['crFileName'])
				crFileName = event.data['crFileName'];
			var buttonConfig = {"buttons"    : [chrome.i18n.getMessage("restart_now")],"btncallback" : reloadChromeApp};
			Notifications.showInfoWithButtons(chrome.i18n.getMessage("CR_config_applied",[chrome.i18n.getMessage("citrix_receiver"),crFileName]),chrome.i18n.getMessage("CRA_restart_message",[chrome.i18n.getMessage("citrix_receiver")]),buttonConfig); 
		}
	}
}

//Handler to reload the chrome app when restart button is clicked from notification.
function updateChromeApp(notID,iBtn){
	if(notID){
		if(iBtn == 0){
			chrome.runtime.reload();
		}else{
			chrome.notifications.clear(notID,function(){});
		}
	}
	asyncObjects.clear( );
}
function reloadChromeApp(notID,iBtn){
	asyncObjects.clear( );
	if(notID){
		if(iBtn == 0){
			var chromeAppWindows = chrome.app.window.getAll();
			if(chromeAppWindows.length>0){
				chrome.runtime.reload();
				return;
			}
			//FileAccess and Kiosk are mutually exclusive features. So disabling kiosk mode
			openLaunchPage({"isKioskSession":false});
		}else{
			chrome.notifications.clear(notID,function(){});
		}
	}
}

// Handler for session windows to add resources to be cleaned up upon exit.
// Supported types: socket, usb, serial
var SessionCleanupHelper = (function sessionCleanupHelper(){
	// Sends CGP_FINISH packet before closing the socket. 
	// TODO: Ideally we need to know if it was CGP connection before doing this.
	function closeSocket(socketId) {
		try {
			console.log("start cleanup of sockId: " + socketId);
			chrome.socket.write(socketId, (new Uint8Array([4,3,0,0,0])).buffer, function(sendInfo) {
				console.log("sent final cgp packet, result: ", sendInfo);
				chrome.socket.disconnect(socketId);
				chrome.socket.destroy(socketId);
				console.log("socket cleanup end: ", socketId);
			});
		} catch (ex) {
			console.log("error during socket cleanup: ", ex);
		}
	}
	
	// Close the USB device
	function closeUsb(device) {
		console.log("start cleanup of USB device: " + JSON.stringify(device));
		chrome.usb.closeDevice(device, function(){
			console.log("finish cleanup of device");
		});
	}
	
	// Close the Serial connection
	function closeSerial(connectionId) {
		console.log("start cleanup of Serial connection: " + connectionId);
		chrome.serial.disconnect(connectionId, function(finalResult){
			console.log("finish cleanup of serial connection result: " + finalResult);
		});
	}
	
	// data store for objects to be cleaned up
	var root = {
		"socket" : {
			close : closeSocket
		},
		"usb" : {
			close : closeUsb
		},
		"serial" : {
			close : closeSerial
		}
	};
	
	// Enumerate session stores and close all the objects.
	function onClosed(session) {
		for (var type in root) {
			// only process chidren of root
			if (!root.hasOwnProperty(type)) {
				continue; 
			}
			
			var store = root[type];
			var objs = store[session]; // get object array to be cleaned up
			if (!objs) {
				continue;
			}
			
			// clean all objs
			for (var idx = 0; idx < objs.length; idx++) {
				store.close(objs[idx]);
			}
			
			delete store[session]; // remove session key from store
		}
	}
	
	// adds an object for cleanup using wnd.id as key
	function add(type, wnd, obj) {
		var key = wnd.id;
		var store = root[type];
		if (!store) {
			console.error("Unsupported type of object being added: " + type);
			return;
		}
		
		if (!store[key]) { // first time registration
			wnd.onClosed.addListener(onClosed.bind(null, key));
			store[key] = [];
		}
		
		store[key].push(obj); // append.
		console.log("adding obj for cleanup of type: " + type + ", for session: " + key + ", obj: ", obj);
	}
	
	// removes an object for cleanup using wnd.id as key
	function remove(type, wnd, obj) {
		var key = wnd.id;
		var store = root[type];
		if (!store) {
			console.error("Unsupported type of object being removed: " + type);
			return;
		}
		
		var idx = (store[key]) ? store[key].indexOf(obj) : -1;
		if (idx !== -1) {
			store[key].splice(idx, 1); // delete the obj
		}
		console.log("removing obj for cleanup of type: " + type + ", for session: " + key + ", obj: ", obj);
	}
	
	// sets an object for cleanup using wnd.id as key, useful if only one object is needed at a time
	function set(type, wnd, obj) {
		var key = wnd.id;
		var store = root[type];
		if (!store) {
			console.error("Unsupported type of object being updated: " + type);
			return;
		}
		
		if (!store[key]) { // first time registration
			wnd.onClosed.addListener(onClosed.bind(null, key));
			store[key] = [];
		}
		
		store[key][0] = obj; // set first element only always.
		console.log("setting obj for cleanup of type: " + type + ", for session: " + key + ", obj: ", obj);
	}
	
	return {add : add, set: set, remove: remove};
})();

// Notification that app is idle and can be unloaded now.
// We want to exit app after user has closed all windows. 
// Let's also ignore helper windows that are important only when session is active.
var IdleChecker = (function idleChecker() {
  var ignoreList = ["proxyWindows", "overlayWindow"];
  var timeout = 5000;
  
  function onIdle() {
    // close all ignored windows if any
    for (var idx = 0; idx < ignoreList.length; idx++){
      var temp = chrome.app.window.get(ignoreList[idx]);
      if (temp) {
        temp.close();
      }
    }
    
    // close background page.
    window.close();
  }
  
  function cantIgnore(win, idx, list) { // if window id is not in ignorelist
    return (ignoreList.indexOf(win.id) === -1);
  }
  
  function isActive() { // if there is any window that is not in ignorelist, then we are active
    return chrome.app.window.getAll().some(cantIgnore);
  }
  
  function check() {
    if (!isActive() && Object.keys(sessionObjs).length === 0){
		onIdle();
		return;
    }
    
    setTimeout(check, timeout); // issue next checker
  }
  
  function start() { // start check timer, this also gives enough chance for receiver to be fully started
    setTimeout(check, timeout);
  }
  
  return {start : start};
})();

window.addEventListener("message",MessageHandler,false);



var createProperties = {
	'type' 	: "normal",
	'id'	: "someGUID",
	'title'	: chrome.i18n.getMessage('connection_center_title'),
	'contexts'	:  ["launcher"],
	'onclick'	: ContextMenuOnClickCallBack
};
var ContextMenuOnClickCallBack = function(event){
	console.log(event);
	var windowWidth = 720;
	var windowHeight = 470;
	var Wleft = parseInt((screen.availWidth-windowWidth)/2);
	var Wtop = parseInt((screen.availHeight-windowHeight)/2);
	console.log(Wleft+" "+Wtop);
	 chrome.app.window.create(
	   '/ChromeAppUI/ConnectionCenter.html', 
  	 {
  	   'id': 'ConnectionCenter',
  	   'resizable': false,
  	    'frame': {
  	      'type': "none"
  	    },
  	   'outerBounds':{
  	     'minWidth':windowWidth,
  	     'minHeight':windowHeight,
  	     'left':Wleft,
  	     'top':Wtop 
  	   }
  	 }
	 );
};
var ContextMenuCallback = function(){
  if (chrome.runtime.lastError) {
	  console.log("errorCallback is called!!!!");
	  console.log(chrome.runtime.lastError);
  }
  console.log("registered context menu successfully");
};



chrome.contextMenus.create(createProperties, ContextMenuCallback);

chrome.contextMenus.onClicked.addListener(ContextMenuOnClickCallBack);

chrome['alarms'].get("CEIP", function (alarm){
	initConfiguration();
	var timeout = (CHROME_APP_CONFIG && CHROME_APP_CONFIG['ceip']) ? CHROME_APP_CONFIG['ceip']['timeSpan'] : 7;
	if(typeof timeout == 'undefined' || timeout < 1 || timeout > 7){
		timeout = 7;
	}
	if(typeof alarm === 'undefined'){
		var alarmInfo = {
			'periodInMinutes' : 24*60*timeout
		}
		chrome['alarms'].create("CEIP", alarmInfo);
	}else{
		console.log('alarm ',alarm);
	}
});

function initCEIP(sendData){
	UserConfiguration.getEngineSettingsFromPolicy(UserConfiguration.engineSettingsKey,function(policyConfig){
		var configObj = JSON.parse(JSON.stringify(CHROME_APP_CONFIG));
		if (Utils.isValid (policyConfig)) {
			configObj =  mergeConfig(configObj,policyConfig)
		}
		_CEIP.init(sendData,configObj);
	});
}

var _CEIP = CEIPObj;

chrome['alarms']['onAlarm'].addListener(function (alarm){
	console.log('alarm is triggered ',alarm);
	initConfiguration();
	initCEIP(true);
});