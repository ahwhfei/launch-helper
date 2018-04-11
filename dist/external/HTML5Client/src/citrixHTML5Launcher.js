function getQueryParams(){
	var queryParams = [];
	var temp = location.href.split('?');
	if(temp && temp[1]){
		var key_Values = temp[1].split('&');
		for (var i = 0; i < key_Values.length; i++) {
			var key_Value = key_Values[i].split("=");
			if (key_Value.length == 2)
				queryParams[key_Value[0]] = key_Value[1];
		}
	}
	return queryParams;
}

function getHashParams(){
	var hashParams = [];
	var temp = location.href.split('?');
	if(temp && temp[1]){
		var key_Values = temp[1].split('#');
		if(key_Values){
			for (var i = 0; i < key_Values.length; i++) {
				var key_Value = key_Values[i].split("=");
				if (key_Value.length == 2)
					hashParams[key_Value[0]] = key_Value[1];
			}
		}
	}
	return hashParams;
}

if(typeof window != "undefined" )
{		
		var engine;
		var sessionId;
		/*
		* Will be relative path for session launch via Storefront.
		* In case of session launch via SDK then we need client path. This will be set in HDXLauncher.js for SDK.
		*/
		var clientURL = "../"; 
		var eventArray = new Array(0);
		var appViewMode = false;// used in session window
		window.isSDK = false;
				
		//Chrome HDX SDK - To get the launch id to set the session id		
		var hashParams = getHashParams();
		sessionId = (hashParams && hashParams["launchid"])? hashParams["launchid"] : null;
		
		//Chrome HDX SDK - To check if the session is embedded using appview
		var queryParams = getQueryParams();
		appViewMode = (queryParams && queryParams["appView"]) ? queryParams["appView"] : false;
		
		function startHTMLSession( ){
			engine = new HTML5Engine( );
			engine.setSessionId(sessionId);
			engine.setParameter({'ui':{'root':"citrixuiElement"}});
			engine.setParameter({'ica':{'type':"unknown"}});
			engine.setConfigurationPath(null);
			engine.initEngine( );
			if(eventArray.length > 0){
				engine.handleMessage(eventArray, eventArray.length);
				eventArray = new Array(0);
			}			
		}
		(function() {
			var script = document.createElement('script');
					script.onload = startHTMLSession;
					script.async = false;
					script.src = "../src/SessionWindow.js";
					script.type = "text/javascript";
					document.body.appendChild(script);//TODO
					
			
		})();


		// To be used when posting ICA data via message to HTML5 receiver
		window.addEventListener("message", function(event) {
			if (engine) {
				engine.handleMessage(event);
			}else{
				eventArray[eventArray.length] = event;
			}		
		}, false);
}else{
	var HTML5LocationParam = new Array(0);
	(function() {	
		HTML5LocationParam = getQueryParams();
	})();
	importScripts(HTML5LocationParam["filepath"] + "workerhelper.js");
}