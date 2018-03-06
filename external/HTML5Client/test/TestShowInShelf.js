
var shelfMsg = {};
var sessionId = 1;
var appId = 123;
var windowId = sessionId + '-' + appId;
shelfMsg.windowId = windowId;

var windowMap = {};
windowMap[shelfMsg.windowId] = { appWindow: null,  flags: { created: false, loaded: false ,pendingRestart:false} };
mockChromeAPI();
describe("ShowInShelf validation",function(){
	var StgdCmds = new SeamlessUI.StagedCommands(windowMap);

	it("queueCmds with null message",function(){
		expect(StgdCmds.queueCmds(null,null)).toBe(null);
	});
	it("queueCmds with empty window id ",function(){
		expect(StgdCmds.queueCmds(null,{"windowId":""})).toBe(null);
	});
	
	it("queueCmds to push the Cmds when window is not loaded",function(){
		windowMap[shelfMsg.windowId] = { appWindow: null,  flags: { created: false, loaded: false ,pendingRestart:false} };
		windowMap[shelfMsg.windowId].queueCmds = [];
		var qCmds = windowMap[shelfMsg.windowId].queueCmds;
		var action = jasmine.createSpy('action');
		var testQueue = [{"action": action, "message" : shelfMsg}];
		StgdCmds.queueCmds(action,shelfMsg);
		var x = testQueue[testQueue.length-1].action.toString();
		var y = qCmds[qCmds.length-1].action.toString();
		expect(x == y).toBe(true);
	});

 	it("queueCmds with valid action or after window loads ",function(){
		windowMap[shelfMsg.windowId] = { appWindow: null,  flags: { created: false, loaded: true ,pendingRestart:false} };
		windowMap[shelfMsg.windowId].queueCmds = [];
		var action = jasmine.createSpy('action');
		StgdCmds.queueCmds(action,shelfMsg);
		expect(action).toHaveBeenCalledWith(shelfMsg);
	}); 
	
	it("flushCmds with null message",function(){
		expect(StgdCmds.flushCmds(null)).toBe(null);
	});
	
	it("flushCmds with empty window id ",function(){
		shelfMsg.windowId = "";
		expect(StgdCmds.flushCmds(shelfMsg)).toBe(null);
	});
	
	it("flushCmds after window loaded ",function(){
		shelfMsg.windowId = windowId;
		windowMap[shelfMsg.windowId] = { appWindow: null,  flags: { created: false, loaded: true ,pendingRestart:false} };
		windowMap[shelfMsg.windowId].queueCmds = [];
		var action = jasmine.createSpy('action');
		StgdCmds.queueCmds(action,shelfMsg);
		StgdCmds.flushCmds(shelfMsg);
		expect(windowMap[shelfMsg.windowId].queueCmds).toBe(undefined);
	});
	
	it("flushCmds with null message",function(){
		expect(StgdCmds.flushCmds(null)).toBe(null);
	});
	
	it("updateWindowID validate",function(){
		var myWindowInfo = {};
		var SessionMsg = {};
		
        myWindowInfo.sessionId = sessionId;
		myWindowInfo.appId = appId;
		shelfMsg.windowInfo = myWindowInfo;
		SessionMsg.srcMessage = shelfMsg;
		SeamlessUI.ProxyWindows.prototype.create(SessionMsg);
		expect(shelfMsg.windowId).toBe(windowId);
	});
	
	it("ProxyWindows.prototype.close test ",function(){
		windowMap[shelfMsg.windowId] = { appWindow: appWindow,  flags: { created: false, loaded: true ,pendingRestart:false} };
		windowMap[shelfMsg.windowId].queueCmds = [];
		
		windowMap[shelfMsg.windowId].appWindow.applyCmd = jasmine.createSpy(windowMap[shelfMsg.windowId].appWindow.applyCmd);
		var appWnd = jasmine.createSpy(windowMap[shelfMsg.windowId].appWindow.applyCmd);

		shelfMsg.windowMap = windowMap[shelfMsg.windowId];
		SeamlessUI.ProxyWindows.prototype.close(shelfMsg);
		expect(windowMap[shelfMsg.windowId].appWindow).toBeDefined();	
		appWnd({type: "close"});
		expect(appWnd).toHaveBeenCalledWith({type: "close"});
	});

	it("ProxyWindows.prototype.closeAll test ",function(){
		shelfMsg.windowInfo = {};
		shelfMsg.windowInfo.sessionId = sessionId;
		shelfMsg.windowInfo.appId = appId;
		windowMap[shelfMsg.windowId] = { appWindow: appWindow,  flags: { created: true, loaded: true ,pendingRestart:false} };
		windowMap[shelfMsg.windowId].windowInfo = shelfMsg.windowInfo;
		shelfMsg.windowMap = windowMap[shelfMsg.windowId]

		SeamlessUI.ProxyWindows.prototype.closeAll(shelfMsg);

		expect(appWindow.close).toHaveBeenCalled();
	});	
	
	it("ProxyWindows.prototype.setIcon call create ",function(){
		var myWindowInfo = {};
		var shelfMsg = {};
		shelfMsg.windowId = windowId;
        myWindowInfo.sessionId = sessionId;
		myWindowInfo.appId = appId;
		shelfMsg.windowInfo = myWindowInfo;
		
		
		shelfMsg.windowMap = {};
		
		appWindow["outerBounds"]={};
		appWindow["outerBounds"]["left"] = 0;
        appWindow["outerBounds"]["top"] = 0;
		appWindow.id = windowId;
		windowMap[shelfMsg.windowId] = { appWindow: appWindow,  flags: { created: false, loaded: false ,pendingRestart:false} };
		var uiManager = jasmine.createSpyObj(uiManager,['dispatch']);

		shelfMsg.fakewindowMap = windowMap[shelfMsg.windowId];

		
		shelfMsg.isCreate = true;
		shelfMsg.uiManager = uiManager;
		shelfMsg.hasMaximize = true;
		shelfMsg.minimize = true;
		shelfMsg.data = {};
		var wordpad = "data:image/png;base64,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";
		shelfMsg.data.iconLink = wordpad;
		shelfMsg.data.windowName = "Notepad";
		
	    SeamlessUI.ProxyWindows.prototype.setIcon(shelfMsg);
		expect(shelfMsg.windowId).toBe(windowId);
		
		expect(appWindow["outerBounds"]["left"]).toBe(-10000);
		expect(appWindow["outerBounds"]["top"]).toBe(-10000);
	});
	
		it("ProxyWindows.prototype.setIcon call recreate ",function(){
		var myWindowInfo = {};
		var shelfMsg = {};
		shelfMsg.windowId = windowId;
        myWindowInfo.sessionId = sessionId;
		myWindowInfo.appId = appId;
		shelfMsg.windowInfo = myWindowInfo;
		
		windowMap[shelfMsg.windowId] = { appWindow: appWindow,  flags: { created: false, loaded: true ,pendingRestart:false} };
			shelfMsg.windowId = windowId;
		shelfMsg.data = {};
		shelfMsg.windowMap = windowMap;
		windowMap[shelfMsg.windowId].appWindow.applyCmd = jasmine.createSpy(windowMap[shelfMsg.windowId].appWindow.applyCmd);
		 var wordpad = "data:image/png;base64,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";
		shelfMsg.data.iconLink = wordpad;
	    SeamlessUI.ProxyWindows.prototype.setIcon(shelfMsg);
		expect(shelfMsg.windowId).toBe(windowId);
		
		
		SeamlessUI.ProxyWindows.prototype.setIcon(shelfMsg);
		var pR = windowMap[shelfMsg.windowId].flags.pendingRestart;
		expect(pR).toBe(true);
		expect(appWindow.applyCmd).toHaveBeenCalledWith({ type: 'icon', data: shelfMsg.data.iconLink});

	});	
	
	it("ProxyWindows.prototype.minimizeWindow test ",function(){
	    var myWindowInfo = {};
		var shelfMsg = {};
		shelfMsg.windowId = windowId;
        myWindowInfo.sessionId = sessionId;
		myWindowInfo.appId = appId;
		shelfMsg.windowInfo = myWindowInfo;
		
		windowMap[shelfMsg.windowId] = { appWindow: appWindow,  flags: { loaded: true} };
			shelfMsg.windowId = windowId;
		//Fake it whenever want to reuse in the appropriate test case
		chrome.app.window.get.and.callFake(function(winId){
			return appWindow;
		});
		
	    SeamlessUI.ProxyWindows.prototype.minimizeWindow(shelfMsg);
		expect(appWindow.minimize).toHaveBeenCalled();
		

	});

it("ProxyWindows.prototype.setTitle test ",function(){
		var myWindowInfo = {};
		var shelfMsg = {};
		shelfMsg.windowId = windowId;
        myWindowInfo.sessionId = sessionId;
		myWindowInfo.appId = appId;
		shelfMsg.windowInfo = myWindowInfo;
		
		windowMap[shelfMsg.windowId] = { appWindow: appWindow,  flags: { loaded: true} };
			shelfMsg.windowId = windowId;
			shelfMsg.data = {};
			shelfMsg.data.windowName = "Notepad";
		
		 
	    SeamlessUI.ProxyWindows.prototype.setTitle(shelfMsg);
		
		expect(appWindow.applyCmd).toHaveBeenCalledWith({ type: "title", data: shelfMsg.data.windowName});		
	});	
	
	it("Ending Show In Shelf", function() {
		expect(true).toBe(true);
		console.log("Ending  Show In Shelf");

		// Always keep this under last test case.
		unmockChromeAPI();
	});
});
 