var configUtils = (function(){	
	var appSwitcherConfig = {};
	function filter(data){
		if(data["preferences"] && data["preferences"]["ui"]){
			var config = {};
			config["type"] = "update";			
			config["ui"]={};		
			
			if(data["preferences"]["ui"]["toolbar"]){			
				config["ui"]["toolbar"]={};
				config["ui"]["toolbar"] = data["preferences"]["ui"]["toolbar"];								
			}
			if(data["preferences"]["ui"]["hide"]){
				config["ui"]["hide"]={};
				config["ui"]["hide"] = data["preferences"]["ui"]["hide"];
			}
			if(data["preferences"]["ui"]["appSwitcher"]){
				config["ui"]["appSwitcher"]={};
				config["ui"]["appSwitcher"] = data["preferences"]["ui"]["appSwitcher"];
			}
			if(data["preferences"]["ui"]["sessionsize"]){
				config["ui"]["sessionsize"]={};
				config["ui"]["sessionsize"] = data["preferences"]["ui"]["sessionsize"];
			}
			if((config["ui"]["toolbar"] && Object.keys(config["ui"]["toolbar"]).length > 0) || (config["ui"]["hide"] && Object.keys(config["ui"]["hide"]).length >0) || (config["ui"]["appSwitcher"] && Object.keys(config["ui"]["appSwitcher"]).length >0) || (config["ui"]["sessionsize"] && Object.keys(config["ui"]["sessionsize"]).length >0)){				
				return config;				
			}
		}
	}
	
	//Merges baseConfig with extendedConfig
	function merge(baseConfig,extendedConfig){

		if (extendedConfig) {				
			for (var key in extendedConfig) {
				if (extendedConfig.hasOwnProperty(key)) {
					changeAtrribute(key, baseConfig, extendedConfig);
				}
			}
		}
		return baseConfig;
	}

		
	function changeAtrribute(key, output, input) {
		if (input.hasOwnProperty(key)) {
			if (!output[key]) {										
				output[key] = input[key];
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
			}else{
				output[key] = input[key];
			}			
		}
	}
	
	function getChromeAppBaseConfig(){
		if(HTML5_CONFIG["appPrefs"] && HTML5_CONFIG["appPrefs"]["chromeApp"]) {
			var craConfig = HTML5_CONFIG["appPrefs"]["chromeApp"];											
			merge(HTML5_CONFIG,craConfig);
			delete HTML5_CONFIG["appPrefs"];
		}		
		return HTML5_CONFIG;			
	}
	
	function localStorageCallback(result){
		if (result['appSwitcher'] !== undefined) {
			var json = JSON.parse(result['appSwitcher']);
			for (var key in appSwitcherConfig) {
				if (appSwitcherConfig.hasOwnProperty(key)) {
					json[key] = appSwitcherConfig[key];
				}
			}
			HTML5Engine.localStorage.setItem("appSwitcher", JSON.stringify(json));
		}
	}
	
	function updateLocalStorage(config){
		if(config && config["ui"]){
			if(config["ui"]["appSwitcher"]){
				appSwitcherConfig = config["ui"]["appSwitcher"];
				HTML5Engine.localStorage.getItem("appSwitcher", localStorageCallback);
				
			}
		}
	}
	
	return ({
		filter :filter,
		merge : merge,
		getChromeAppBaseConfig : getChromeAppBaseConfig,
		updateLocalStorage : updateLocalStorage
	});
})();