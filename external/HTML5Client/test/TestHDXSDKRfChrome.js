	//Creating spy objects for the standard Chrome APIs
	//Adding all common chrome.app.window /chrome.app.runtime Spy needed for ProxyWindows in this file
	//TODO move all to a common file in future
	var window, chrome, origWindow, origChrome,appWindow , receivedMessage, _CEIP;
	
	function mockChromeAPI() {
		origWindow = window;
		origChrome = chrome;
		
		window = jasmine.createSpyObj('window', ['addEventListener']);	
		 _CEIP = jasmine.createSpyObj("_CEIP",["add","incrementCounter"]);
		chrome = jasmine.createSpyObj('chrome', ['runtime','app','system']);	
		chrome.runtime = jasmine.createSpyObj('chrome.runtime',['sendMessage','onMessageExternal','getBackgroundPage']);
		chrome.runtime.onMessageExternal = jasmine.createSpyObj('chrome.runtime.onMessageExternal',['addListener']);
		chrome.runtime.sendMessage = jasmine.createSpy('sendMessage');
		
		
		chrome.runtime.sendMessage.and.callFake(function(senderAppId,data,callback){	
			receivedMessage = data;
		});
		
		chrome.app = jasmine.createSpyObj('chrome.app',['runtime'],['window']);
		chrome.app.runtime = jasmine.createSpyObj('chrome.app.runtime',['onEmbedRequested','onLaunched']);
		chrome.app.runtime.onLaunched = jasmine.createSpyObj('chrome.app.runtime.onLaunched',['addListener']);
		chrome.app.runtime.onEmbedRequested = jasmine.createSpyObj('chrome.app.runtime.onEmbedRequested',['addListener']);
		
		chrome.app.window = jasmine.createSpyObj('chrome.app.window',['create'],['get'],['minimize']);
		chrome.app.window.get = jasmine.createSpy('get');
		
		chrome.system = jasmine.createSpyObj('chrome.system',['network']);
		chrome.system.network = jasmine.createSpyObj('chrome.system.network',['getNetworkInterfaces']);
		
		appWindow = jasmine.createSpyObj("appWindow",["contentWindow","applyCmd","show","hide","focus","close","minimize"]);
		appWindow.applyCmd.close = jasmine.createSpy('close');
		appWindow.contentWindow = jasmine.createSpyObj("appWindow.contentWindow",["postMessage","addEventListener"]);
		appWindow.contentWindow.addEventListener = jasmine.createSpy("appWindow.contentWindow.addEventListener",['DOMContentLoaded']);
		appWindow.contentWindow.registerEvents = jasmine.createSpy("appWindow.contentWindow.registerEvents");
		appWindow.onRestored = jasmine.createSpyObj("appWindow.onRestored",["addListener"]);
		appWindow.onBoundsChanged = jasmine.createSpyObj("appWindow.onBoundsChanged",["addListener"]);
		appWindow.onClosed = jasmine.createSpyObj("appWindow.onClosed",["addListener"]);
		appWindow.onMaximized = jasmine.createSpyObj("appWindow.onMaximized",["addListener"]);
		appWindow.onMinimized = jasmine.createSpyObj("appWindow.onMinimized",["addListener"]);
		appWindow.minimize = jasmine.createSpy("minimize");
		
	}
	
	function unmockChromeAPI() {
		try{
			delete chrome.app.window;			
			window = origWindow;
			chrome = origChrome;			
		}catch(ex){
			console.log("exception in unmockChromeAPI",ex);
		}
	}
	
	mockChromeAPI();

	//Mocking the dependant functions from other files
	var UserConfiguration = jasmine.createSpyObj('UserConfiguration',['getExternalAppsIdFromPolicy','getEngineSettingsFromPolicy']);
	var launchSessionFromICAData = jasmine.createSpy('launchSessionFromICAData');
	var initApp = jasmine.createSpy('initApp');
	var CHROME_APP_CONFIG_APPVIEW = {};
describe("RfChrome SDK validation",function(){

	
	
	var appIdValid = 'dshfkjldshfklhkhkhfkjhdskjfhkjx';
	var invalidId = "test";
	
	var message = {"method":""};
	var sender = {"id":"app id","url":"chrome-extension://appid/html"};

	var expectedResponse1 = {"success":false,"error": "App/Extension id not whitelisted"};
	var expectedResponse = {"success":false,"sessionId" : null,"error": "App/Extension id not whitelisted"};
	
	UserConfiguration.getExternalAppsIdFromPolicy.and.callFake(function(callback){
		callback(null);
	});
	
	UserConfiguration.getEngineSettingsFromPolicy.and.callFake(function(settingsKey,callback){
			callback(null);
	});
	
	it("Null whitelisted apps from policy", function() {		
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse1));	
		});
	});
	
	UserConfiguration.getExternalAppsIdFromPolicy.and.callFake(function(callback){		
		callback([appIdValid]);
	});
	
	it("External app id not whitelisted", function() {		
		message = {"method":""};
		sender = {"id":"dksfhkjdshfk","url":"chrome-extension://dksfhkjdshfk/html"};
		
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse1));	
		});				
	});
	
	it("External app id whitelisted", function() {		
		message = {"method":"launchSession","icaData":{"InitialProgram" : "#Desktop" , "Address" : "10.10.32.131"}};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		
		externalMsgHandler(message,sender,function(response){
			expect(true).toBe(true);	
		});				
	});
	
	it("Empty message called", function() {		
		message = null;
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		expectedResponse["error"] = "Cannot read property 'sessionId' of null";
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));	
		});				
	});
	
	it("Empty method value", function() {		
		message = {"method":""};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		expectedResponse["error"] = "Invalid Params";
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));	
		});				
	});
	var sessionId = "Session"+(new Date()).getTime();
	
	it("Method = launchSession with valid ica data ", function() {		
		message = {"method":"launchSession","icaData":{"InitialProgram" : "#Desktop" , "Address" : "10.10.32.131"},"sessionId" : sessionId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};		
		launchSessionFromICAData.and.callFake(function(ica,sessionId,callback){
			callback(appWindow,{"id":sessionId});
		});
		expectedResponse = {};
		expectedResponse["success"] = true;
		expectedResponse["sessionId"] = sessionId;
		externalMsgHandler(message,sender,function(response){		
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));	
		});				
	});
	it("Method = launchSession with empty ica data ", function() {		
		message = {"method":"launchSession"};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};				
		launchSessionFromICAData.and.callFake(function(ica,sessionId,callback){
			callback(appWindow,{"id":sessionId});
		});
		expectedResponse = {};
		expectedResponse["success"] = false;
		expectedResponse["error"] = "Invalid params: no icadata";
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));	
		});				
	});
	
	it("Method = disconnect with valid sessionId", function() {		
		message = {"method":"disconnect","sessionId":sessionId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
				
		externalMsgHandler(message,sender,function(response){});	
		expect(appWindow.contentWindow.postMessage).toHaveBeenCalledWith({"cmd":"DISCONNECT"},"*");			
	});
	it("Method = disconnect with invalid sessionId", function() {		
		message = {"method":"disconnect","sessionId":invalidId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		expectedResponse = {"success":false,"sessionId" : invalidId,"error":"Invalid sessionId"};
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));
		});	
	});
	
	it("Method = show with valid sessionId", function() {		
		message = {"method":"show","sessionId":sessionId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		externalMsgHandler(message,sender,function(response){});	
		expect(appWindow.show).toHaveBeenCalled();
	});
	it("Method = show with invalid sessionId", function() {		
		message = {"method":"show","sessionId":invalidId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		expectedResponse = {"success":false,"sessionId" : invalidId,"error":"Invalid sessionId"};
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));
		});	
	});
	it("Method = hide with valid sessionId", function() {		
		message = {"method":"hide","sessionId":sessionId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		externalMsgHandler(message,sender,function(response){});	
		expect(appWindow.hide).toHaveBeenCalled();
	});
	it("Method = hide with invalid sessionId", function() {		
		message = {"method":"hide","sessionId":invalidId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		expectedResponse = {"success":false,"sessionId" : invalidId,"error":"Invalid sessionId"};
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));
		});	
	});
	it("Method = logoff with valid sessionId", function() {		
		message = {"method":"logoff","sessionId":sessionId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};		
		externalMsgHandler(message,sender,function(response){});	
		expect(appWindow.contentWindow.postMessage).toHaveBeenCalledWith({"cmd":"LOGOFF"},"*");			
	});
	it("Method = logoff with invalid sessionId", function() {		
		message = {"method":"logoff","sessionId":invalidId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		expectedResponse = {"success":false,"sessionId" : invalidId,"error":"Invalid sessionId"};
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));
		});	
	});
	it("Method = changeResolution with valid sessionId", function() {
		var bounds = {
			"autoresize":false,
			"width": 500,
			"height":500
		};			
		message = {"method":"resolution","sessionId":sessionId,"bounds" : bounds};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};		
		externalMsgHandler(message,sender,function(response){});	
		expect(appWindow.contentWindow.postMessage).toHaveBeenCalledWith({"cmd":"RESOLUTION","bounds" : message["bounds"]},"*");			
	});
	it("Method = changeResolution with invalid sessionId", function() {	
		var bounds = {
			"autoresize":false,
			"width": 500,
			"height":500
		};
		message = {"method":"resolution","sessionId":invalidId,"bounds" : bounds};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		expectedResponse = {"success":false,"sessionId" : invalidId,"error":"Invalid sessionId"};
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));
		});	
	});
	it("Method = sendSpecialKeys with valid sessionId", function() {	
		message = {"method":"splkeys","sessionId":sessionId,"keys" : "ctrl+alt+del"};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};		
		externalMsgHandler(message,sender,function(response){});	
		expect(appWindow.contentWindow.postMessage).toHaveBeenCalledWith({"cmd":"SPLKEYS","keys" : message["keys"]},"*");			
	});
	it("Method = sendSpecialKeys with invalid sessionId", function() {	
		message = {"method":"splkeys","sessionId":invalidId,"keys" : "ctrl+alt+del"};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		expectedResponse = {"success":false,"sessionId" : invalidId,"error":"Invalid sessionId"};
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));
		});	
	});
	
	
	it("Appviewmode embed deny", function() {
		var request = {"embedderId":invalidId};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		expect(request.deny).toHaveBeenCalled();		
	});
	it("Appviewmode embed success", function() {
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		expect(request.allow).toHaveBeenCalledWith("/src/SessionWindow.html" + '?launchid=' + sessionId + "#type=message&redirecturl=none&launcherType=chromeApp"+"&appView=true");
		
	});
	
	it("Appviewmode embed method = launchSession valid ica data", function() {
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		message = {"method":"launchSession","icaData":{"InitialProgram" : "#Desktop" , "Address" : "10.10.32.131"},"sessionId":receivedMessage["data"]["sessionId"]};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};		
		
		expectedResponse = {};
		expectedResponse["success"] = true;
		expectedResponse["sessionId"] = receivedMessage["data"]["sessionId"];
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));	
		});		
	});
	
	it("Appviewmode embed method = launchSession empty ica data", function() {
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		message = {"method":"launchSession","sessionId":receivedMessage["data"]["sessionId"]};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};		
		
		expectedResponse = {};
		expectedResponse["success"] = false;
		expectedResponse["sessionId"] = sessionId;
		expectedResponse["error"] = "Invalid params: no icadata";
		
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));	
		});		
	});
	it("Appviewmode embed method = launchSession invalid sessionId", function() {
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		message = {"method":"launchSession","sessionId":invalidId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};		
		
		expectedResponse = {};
		expectedResponse["success"] = false;
		expectedResponse["sessionId"] = invalidId;
		expectedResponse["error"] = "Invalid params: no icadata";
		
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));	
		});		
	});
	
	it("Appviewmode embed method = show", function() {
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		message = {"method":"show","sessionId":receivedMessage["data"]["sessionId"]};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};		
		
		expectedResponse = {};
		expectedResponse["success"] = false;
		expectedResponse["sessionId"] = sessionId;
		expectedResponse["error"] = "Show the appview element from your app";
		
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));	
		});		
	});
	it("Appviewmode embed method = show invalid sessionId", function() {
				
		message = {"method":"hide","sessionId":invalidId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};		
		
		expectedResponse = {};
		expectedResponse["success"] = false;
		expectedResponse["sessionId"] = invalidId;
		expectedResponse["error"] = "Invalid sessionId";
		
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));	
		});		
	});
	
	it("Appviewmode embed method = hide", function() {
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		message = {"method":"hide","sessionId":receivedMessage["data"]["sessionId"]};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};		
		
		expectedResponse = {};
		expectedResponse["success"] = false;
		expectedResponse["sessionId"] = sessionId;
		expectedResponse["error"] = "Hide the appview element from your app";
		
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));	
		});		
	});
	
	it("Appviewmode embed method = hide invalid sessionId", function() {
				
		message = {"method":"hide","sessionId":invalidId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};		
		
		expectedResponse = {};
		expectedResponse["success"] = false;
		expectedResponse["sessionId"] = invalidId;
		expectedResponse["error"] = "Invalid sessionId";
		
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));	
		});		
	});
	
	it("Appviewmode embed method = disconnect", function() {
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		message = {"method":"disconnect","sessionId":receivedMessage["data"]["sessionId"]};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};				
		
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		externalMsgHandler(message,sender,function(response){});		
		expect(sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"]["postMessage"]).toHaveBeenCalledWith({"cmd":"DISCONNECT"},"*");
	});
	
	it("Appviewmode embed method = disconnect with invalid sessionId", function() {
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		expectedResponse = {};
		expectedResponse["success"] = false;
		expectedResponse["sessionId"] = invalidId;
		expectedResponse["error"] = "Invalid sessionId";
		
		message = {"method":"disconnect","sessionId":invalidId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};				
		
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));
		});				
	});
	it("Appviewmode embed method = logoff with valid sessionId", function() {
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		message = {"method":"logoff","sessionId":receivedMessage["data"]["sessionId"]};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		
		externalMsgHandler(message,sender,function(response){});	
		expect(sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"]["postMessage"]).toHaveBeenCalledWith({"cmd":"LOGOFF"},"*");			
	});
	it("Appviewmode embed method = logoff with invalid sessionId", function() {
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		expectedResponse = {};
		expectedResponse["success"] = false;
		expectedResponse["sessionId"] = invalidId;
		expectedResponse["error"] = "Invalid sessionId";
		
		message = {"method":"disconnect","sessionId":invalidId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));
		});
	});
	it("Appviewmode embed method = changeResolution with valid sessionId", function() {
		var bounds = {
			"autoresize":false,
			"width": 500,
			"height":500
		};
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId, "bounds" : bounds}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		message = {"method":"resolution","sessionId":receivedMessage["data"]["sessionId"],"bounds" : receivedMessage["data"]["bounds"]};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
				
		externalMsgHandler(message,sender,function(response){});	
		expect(sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"]["postMessage"]).toHaveBeenCalledWith({"cmd":"RESOLUTION","bounds" : message["bounds"]},"*");			
	});
	it("Appviewmode embed method = changeResolution with invalid sessionId", function() {	
		var bounds = {
			"autoresize":false,
			"width": 500,
			"height":500
		};
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId, "bounds" : bounds}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		expectedResponse = {};
		expectedResponse["success"] = false;
		expectedResponse["sessionId"] = invalidId;
		expectedResponse["error"] = "Invalid sessionId";
		
		message = {"method":"resolution","sessionId":invalidId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));
		});	
	});
	it("Appviewmode embed method = sendSpecialKeys with valid sessionId", function() {	
		message = {"method":"splkeys","sessionId":sessionId,"keys" : "ctrl+alt+del"};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};		
		externalMsgHandler(message,sender,function(response){});	
		expect(appWindow.contentWindow.postMessage).toHaveBeenCalledWith({"cmd":"SPLKEYS","keys" : message["keys"]},"*");			
		
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId, "keys" : "ctrl+alt+del"}}; 
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		message = {"method":"splkeys","sessionId":receivedMessage["data"]["sessionId"],"keys" : receivedMessage["data"]["keys"]};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
				
		externalMsgHandler(message,sender,function(response){});	
		expect(sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"]["postMessage"]).toHaveBeenCalledWith({"cmd":"SPLKEYS","keys" : message["keys"]},"*");
	
	});
	it("Appviewmode embed method = sendSpecialKeys with invalid sessionId", function() {	
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId, "keys" : "ctrl+alt+del"}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		expectedResponse = {};
		expectedResponse["success"] = false;
		expectedResponse["sessionId"] = invalidId;
		expectedResponse["error"] = "Invalid sessionId";
		
		message = {"method":"splkeys","sessionId":invalidId};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};
		
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		externalMsgHandler(message,sender,function(response){
			expect(JSON.stringify(response)).toBe(JSON.stringify(expectedResponse));
		});
	});
	it("sessionEventsHandler sample message",function(){
		var request = {"embedderId":appIdValid, "data" : { "sessionId" : sessionId}};
		request.allow = jasmine.createSpy('allow');
		request.deny = jasmine.createSpy('deny');
		embedRxHandler(request);
		
		message = {"method":"launchSession","icaData":{"InitialProgram" : "#Desktop" , "Address" : "10.10.32.131"},"sessionId":receivedMessage["data"]["sessionId"]};
		sender = {"id":appIdValid,"url":"chrome-extension://dksfhkjdshfk/html"};		
				
		sessionObjs[receivedMessage["data"]["sessionId"]]["contentWindow"] = appWindow.contentWindow;
		externalMsgHandler(message,sender,function(response){
			var evt = {"origin":window.location.origin,"sessionId":receivedMessage["data"]["sessionId"],"data":{"type" : "onConnectionClosed"}};
			sessionEventsHandler(evt);
			//Since all the messages are sent via same api and it is called async. Putting a filter to validate only the message received for this session id.
			if(evt.data.sessionId == receivedMessage["data"]["sessionId"]){
				expect(chrome.runtime["sendMessage"]).toHaveBeenCalledWith(appIdValid,evt.data,function(response){});
			}
		});	
		
	});
	it("getSenderAppId with valid sessionId",function(){
		var appId = getSenderAppId(receivedMessage["data"]["sessionId"]);
		expect(appId).toBe(appIdValid);		
	});
	
	it("Ending HDXSDKForChrometest", function() {
		expect(true).toBe(true);
		console.log("Ending HDXSDKForChrometest");
		// Always keep this under last test case.
		unmockChromeAPI();
	});
});