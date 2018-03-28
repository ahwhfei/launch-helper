// Abstraction for the underlying storage
function Storage (key) {
    this._key = key;
}
Storage.DB = chrome.storage.local;
Storage.prototype.set = function (value, callback) {
    Storage.setValue (this._key, value, callback);
}
Storage.prototype.get = function (callback) {
    Storage.getValue (this._key, callback);
}
Storage.clearDB = function () {
    Storage.DB.clear ();
}
Storage.setValue = function (key, value, callback) {
    var jsonObject = {};
    jsonObject[key] = value;
    Storage.DB.set (jsonObject, callback);
}
Storage.getValue = function (key, callback) {
    var jsonObject = {};
    jsonObject[key] = null;
    Storage.DB.get (jsonObject, function (result) {
        var value = Utils.isValid (result) ? result[key] : null;
        Utils.safeDispatcher (callback, value);
    });
}
//To remove a key from local storage
Storage.removeKey = function (key){
	Storage.DB.remove(key, function(result){		
	});
}

// Abstraction for the user configuration
function UserConfiguration () {
}
//Key for the settings record.
UserConfiguration.settingsKey = 'settings';

//Key for store settings
UserConfiguration.defSfrKey = 'store_settings';
//Old key used to store settings. This is used to migrate to new JSON structure
UserConfiguration.oldDefSfrKey = '12456789';

UserConfiguration.checkboxKey = 'abcdefgkmoksdflsdfsjfbngfb';
//Settings Version 
UserConfiguration.settingsVersion = '1.0';

UserConfiguration.engineSettingsKey = "engine_settings";
UserConfiguration.ssoSettingsKey = "sso";

//Configuration Types
UserConfiguration.types = {};
UserConfiguration.types.ACCOUNTURL = "accountURL";
UserConfiguration.types.GOOGLEPOLICY = "googlePolicy";
UserConfiguration.types.CR = "cr";

UserConfiguration.clear = function () {
    Storage.clearDB ();
}
UserConfiguration.localStorage = {
	getItem : function(key, callback) {
		chrome.storage.local.get(key, callback);
	},
	setItem : function(key, val) {
		var temp = {};
		temp[key] = val;
		chrome.storage.local.set(temp);
	}
};

UserConfiguration.getMultimonitorEnabled = function (configObj, callback) {
  var mmEnabled = false;
  if (configObj && configObj['features'] && configObj['features']['graphics'] && configObj['features']['graphics']['multiMonitor'] &&
		configObj['features']['graphics']['multiMonitor'] === true) {
		
		// config has multimonitor allowed.
		mmEnabled = true;
		// now check for user pref override
		chrome.storage.local.get('useAllMyMonitors',function(data){
      if(data && (typeof data['useAllMyMonitors'] === "boolean")){
        mmEnabled = data['useAllMyMonitors'];
      }
      callback(mmEnabled);
    });
	} else {
	  callback(mmEnabled);
	}
};

UserConfiguration.getWindowStatus = function(configObj,callback){
  var state = 'maximized';
  if(configObj && configObj["ui"] && configObj["ui"]["sessionsize"] && configObj["ui"]["sessionsize"]["windowstate"] === "fullscreen"){
    state = 'fullscreen';
    callback(state);
  }else{
    chrome.storage.local.get('fullscreen',function(data){
      if(data && data['fullscreen']){
        state = 'fullscreen';
      }
      callback(state);
    });
  }
};
UserConfiguration.getPrimaryMonitorDisplayInfo = function(callback){
    chrome.system.display['getInfo'](function(displayInfo){
		var bounds;
		var isUnifiedMode = g.Utils.getUnifiedDisplayBounds(displayInfo).isUnifiedMode;
		if(isUnifiedMode){
			for(var i=0;i<displayInfo.length;i++){
				if(displayInfo[i]['isPrimary'] === true){
					bounds = displayInfo[i]["bounds"];        		    
        		    break;
        		}
        	}
		}
    	if(callback){
          callback(bounds);
        }
    });
}

//Get the managed policy records
UserConfiguration.getManagedSFRecord =  function(key,callback){	
	chrome.storage.managed.get(key, function(result){
		if(result!== undefined && result[key] !== undefined){
			chrome.runtime.getBackgroundPage(function (bp){
				bp._CEIP.add('configuration:policy',true);
			});
			var googlePolicySettings = sfRecord.createGooglePolicyRecordV1(result[key]);
			
			if(Utils.isValid(googlePolicySettings) && googlePolicySettings[UserConfiguration.defSfrKey]['rf_web']['url'])
			{
				UserConfiguration.setUnsecureSFPrompt(true);
				Storage.removeKey(UserConfiguration.settingsKey);
				callback(googlePolicySettings);

			}else{
				callback(null);				
			}
		} else{
			callback(null);			
		}
	}); 
};

UserConfiguration.getSFRecord  = function (key, callback) {
	UserConfiguration.getManagedSFRecord(UserConfiguration.settingsKey , function(sfr){
		if(sfr != null){
			Utils.unsafeDispatcher (callback, sfr);
		}
		else{
			 Storage.getValue(key, function (sfr) {
				Utils.unsafeDispatcher (callback, sfr);
			});
		}
	});
};
UserConfiguration.getEngineSettingsFromPolicy = function(key,callback){
	chrome.storage.managed.get(UserConfiguration.settingsKey, function(result){
		if(result!== undefined && result[UserConfiguration.settingsKey] !== undefined){
			chrome.runtime.getBackgroundPage(function (bp){
				bp._CEIP.add('configuration:policy',true);
			});
			callback(result[UserConfiguration.settingsKey][key]);
		}else{
			callback(null);
		}		
	});
};
// return result from settings.store_settings.sso
UserConfiguration.getSSOSettingsFromPolicy = function(callback){
	chrome.storage.managed.get(UserConfiguration.settingsKey, function(result){
		var response = null;
		if(result!== undefined && result[UserConfiguration.settingsKey] !== undefined){
			var store_settings = result[UserConfiguration.settingsKey][UserConfiguration.defSfrKey];
			if (store_settings !== undefined && store_settings[UserConfiguration.ssoSettingsKey] !== undefined) {
				response = store_settings[UserConfiguration.ssoSettingsKey];
				console.log("Read SSO setting from policy: " + JSON.stringify(response));
			}
		}
			
		callback(response);
	});
};

//Reads the whitelisted external app ids from policy to receive messages
UserConfiguration.getExternalAppsIdFromPolicy = function(callback){	
	chrome.storage.managed.get(UserConfiguration.settingsKey, function(result){
		var response = null;
		if(result!== undefined && result[UserConfiguration.settingsKey] !== undefined){
			var store_settings = result[UserConfiguration.settingsKey][UserConfiguration.defSfrKey];			
			if (store_settings !== undefined && store_settings["externalApps"] !== undefined) {
				response = store_settings["externalApps"];				
			}
		}
		callback(response);
	});
};
UserConfiguration.setSFRecord  = function (key, sfRecord) {
    Storage.setValue(key, sfRecord);
}
UserConfiguration.getUnsecureSFPrompt  = function (callback) {
    Storage.getValue(UserConfiguration.checkboxKey, function (checked) {
        Utils.unsafeDispatcher (callback, checked);
    });
}
UserConfiguration.setUnsecureSFPrompt  = function (checked) {
    Storage.setValue(UserConfiguration.checkboxKey, checked);
}
UserConfiguration.readICAFile = function (icaFileEntry, callback) {
    icaFileEntry.file (function (icaFile) {
        var reader = new FileReader ();
        reader.onerror = function (errMessage) {
            Utils.safeDispatcher (callback, null);
        };
        reader.onload = function (e) {
            var content = e.target.result
            Utils.safeDispatcher (callback, content);
        };
        reader.readAsText (icaFile);
    });
};
UserConfiguration.readConfigFile = function (crFileEntry, callback) {
    crFileEntry.file (function (crFile) {
        var reader = new FileReader ();
        reader.onerror = function (errMessage) {
            Utils.safeDispatcher (callback, null);
        };
        reader.onload = function (e) {
            var adapter = new X2JS ();
            var xmlContent = e.target.result
            var jsonObj = adapter.xml_str2json (xmlContent);
            Utils.safeDispatcher (callback, jsonObj);
        };
        reader.readAsText (crFile);
    });
}
UserConfiguration.readConfigFile2 = function (crFileUrl, async, callback) {
    function dispatchResult (xhr, callback) {
        var xmlContent = (200 === xhr.status) ? xhr.responseText : null;

        var adapter = new X2JS ();
        var jsonObj = adapter.xml_str2json (xmlContent);
        Utils.safeDispatcher (callback, jsonObj);
    }
    var options = {
        'url': crFileUrl,
        'async': async,
        'operation': 'GET',
        'onreadystatechange': null
    };
    if (true === async) {
        options.onreadystatechange = function () {
            if (4 === this.readyState) {
                dispatchResult (this, callback);
            }
        }
        Utils.executeXHR (options);
    }
    else {
        var xhr = Utils.executeXHR (options);
        dispatchResult (xhr, callback);
    }
}

// Abstracts the content of CR file
function sfRecord () {
}

sfRecord.createV1Record = function(){
  var sfr = {
          'settings_version': UserConfiguration.settingsVersion ,
		  "store_settings" : {
			'configure_type':"",
			'name':'mystore',
			'beacons':{
				'external':[],
				'internal':[]
			},
			'gateways':[],
			'rf_web':{}         
		}
	}; 
	return sfr;
};

sfRecord.createFromCRFile = function (crFile) {
	var sfr = sfRecord.createV1Record();
	sfr[UserConfiguration.defSfrKey]["configure_type"] = UserConfiguration.types.CR;
   
    try {
        if (Utils.isValid (crFile) && Utils.isValid (crFile["Services"])) {
          sfr[UserConfiguration.settingsVersion] = crFile["Services"]['_version'];
            if (Utils.isValid (crFile["Services"]["Service"])) {
				sfr[UserConfiguration.defSfrKey]['name'] = crFile["Services"]["Service"]['Name'];
                sfr[UserConfiguration.defSfrKey]['rf_web']['url'] =crFile["Services"]["Service"]["rfWeb"];
                
                if (Utils.isValid (crFile["Services"]["Service"]["Beacons"])) {
                    if (Utils.isValid (crFile["Services"]["Service"]["Beacons"]["Internal"]) && crFile["Services"]["Service"]["Beacons"]["Internal"]["Beacon"])
                    {                        
                        if((typeof crFile["Services"]["Service"]["Beacons"]["Internal"]["Beacon"]).toLocaleLowerCase() == "string" )
                          sfr[UserConfiguration.defSfrKey]['beacons']['internal'].push({url:crFile["Services"]["Service"]["Beacons"]["Internal"]["Beacon"]});
                       
						else if(typeof crFile["Services"]["Service"]["Beacons"]["Internal"]["Beacon"].toLocaleLowerCase() == "array" )
                        {
							var beacons = crFile["Services"]["Service"]["Beacons"]["Internal"]["Beacon"];
							for(var i = 0 ; i < beacons.length ;i++){
								sfr[UserConfiguration.defSfrKey]['beacons']['internal'].push({'url':beacons[i]});
							}                        
						}
                    }    
                    
					if (Utils.isValid (crFile["Services"]["Service"]["Beacons"]["External"]) && crFile["Services"]["Service"]["Beacons"]["External"]["Beacon"])
					{
                        
						if((typeof crFile["Services"]["Service"]["Beacons"]["External"]["Beacon"]).toLocaleLowerCase() == "string" )
						  sfr[UserConfiguration.defSfrKey]['beacons']['external'].push({url:crFile["Services"]["Service"]["Beacons"]["External"]["Beacon"]});
						
						else if((typeof crFile["Services"]["Service"]["Beacons"]["External"]["Beacon"]).toLocaleLowerCase() == "array" || (typeof crFile["Services"]["Service"]["Beacons"]["External"]["Beacon"]).toLocaleLowerCase() == "object")
						{
							var beacons = crFile["Services"]["Service"]["Beacons"]["External"]["Beacon"];
							for(var i = 0 ; i < beacons.length ;i++){
								sfr[UserConfiguration.defSfrKey]['beacons']['external'].push({'url':beacons[i]});
							}
						}         
					}
                   
                }
                
                   // Gateway
				if (Utils.isValid (crFile["Services"]["Service"]["Gateways"])) {
					var gateways = crFile["Services"]["Service"]["Gateways"]["Gateway"];
					if(!gateways.length){
						sfr[UserConfiguration.defSfrKey]['gateways'].push({'url':gateways['Location'] ,'is_default':gateways['_Default']});
					}
					else{
						for(var i = 0 ; i < gateways.length ;i++){
							 sfr[UserConfiguration.defSfrKey]['gateways'].push({'url':gateways[i]['Location'] ,'is_default':gateways[i]['_Default']});
						}
					}
				}
            }

            return sfr;
        }
        else {
            throw new GenericError (chrome.i18n.getMessage("error_notConfigured",[chrome.i18n.getMessage("citrix_receiver")]));
        }
    }
    catch (e) {
        console.log (e.message);
    }

    return null;
};
sfRecord.createFromRFWeb = function (rfWeb) {
	var sfr = sfRecord.createV1Record();
	sfr[UserConfiguration.defSfrKey]["configure_type"] = UserConfiguration.types.ACCOUNTURL;
	sfr[UserConfiguration.defSfrKey]["rf_web"]["url"] = rfWeb;

    return sfr;
};

sfRecord.createGooglePolicyRecordV1 = function(record){
	var sfr = sfRecord.createV1Record();
	sfr[UserConfiguration.defSfrKey]["configure_type"] = UserConfiguration.types.GOOGLEPOLICY;
		
	try{
		if(Utils.isValid(record)){
			
			if(Utils.isValid(record[UserConfiguration.defSfrKey])){
				var storeSettings = record[UserConfiguration.defSfrKey];
				
				if(Utils.isValid(storeSettings["rf_web"]) && storeSettings["rf_web"]["url"]){
					sfr[UserConfiguration.defSfrKey]["rf_web"]["url"] = storeSettings["rf_web"]["url"];
					
					if(Utils.isValid(storeSettings["gateways"]) && (storeSettings["gateways"] instanceof Array)){
						sfr[UserConfiguration.defSfrKey]["gateways"] = storeSettings["gateways"];															
					} 
					
					 if(Utils.isValid(storeSettings["beacons"])){
						if(Utils.isValid(storeSettings["beacons"]["external"]) && (storeSettings["beacons"]["external"] instanceof Array)){
							sfr[UserConfiguration.defSfrKey]["beacons"]["external"] = storeSettings["beacons"]["external"];	
						}
						
						if(Utils.isValid(storeSettings["beacons"]["internal"]) && (storeSettings["beacons"]["internal"] instanceof Array)){
							sfr[UserConfiguration.defSfrKey]["beacons"]["internal"] = storeSettings["beacons"]["internal"];	
						}
					} 
					if(record["name"]){
						sfr["name"] = record["name"]
					}
				}
				else{
					console.log("No storefront configuration applied from policy");
					return null;
				}
			}
		}
		
	}catch(e){
		console.log(e.message);
		sfr = null;
	}
	return sfr;
};