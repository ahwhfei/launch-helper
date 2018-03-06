/**
 * Created by rajasekarp on 14-08-2015.
 */

var SeamlessUI;
var dependency = (dependency || {}); 

(function (SeamlessUI) {
    if (SeamlessUI.create === undefined) {
        SeamlessUI.create = 1;
        SeamlessUI.restore = 2;
        SeamlessUI.close = 3;
        SeamlessUI.minimise = 4;
        SeamlessUI.maximise = 5;
        SeamlessUI.focus = 6;
        SeamlessUI.icon = 7;
        SeamlessUI.none = 8;
        SeamlessUI.move = 14;
        SeamlessUI.title = 16;
        SeamlessUI.sessionInfo = 17;
        SeamlessUI.minimizeWindow  = 18;
    }
	
    var StagedCommands = (function() {
        function StagedCommands(windowMap){
            this.windowMap = windowMap;
            this.stagedCommands = {};
        }

      StagedCommands.prototype.queueCmds = function (action, message) {
            if(!message || !message.windowId) {
                return null;
            }

            if(this.windowMap[message.windowId] && (this.windowMap[message.windowId].flags && this.windowMap[message.windowId].flags.loaded == false)) {
                console.log("Staging " + action.name + " for " + message.windowId);
                if(this.windowMap[message.windowId].queueCmds || (this.windowMap[message.windowId].queueCmds = [])){
                    this.windowMap[message.windowId].queueCmds.push({action: action, message : message});
                }
            }else {
                action(message);
            }
        };

        StagedCommands.prototype.flushCmds = function(message) {
          if(!message || !message.windowId) {
                return null;
            }
            var commands = [];
            if(this.windowMap[message.windowId] && this.windowMap[message.windowId].flags.loaded === true)  {
                commands = this.windowMap[message.windowId].queueCmds;
				delete this.windowMap[message.windowId].queueCmds;
            }
			
            for(var i = 0; i < commands.length; i++) {
                var command = commands[i];
                console.log("flushing " + command.action.name + " for " + message.windowId);
                command.action(command.message);
            }
        };

        return StagedCommands;
    })();


    var ProxyWindows = (function () {
        // Dictionary to hold all the new hidden windows
        var windowMap = {};
        var iconHandler;
        var proxyWindows;
        var stagedCommands = new StagedCommands(windowMap);

        function ProxyWindows() {
            iconHandler = new g.Utils.IconHandler();
            proxyWindows = this;
            this.sessionInfoManager = new SeamlessUI.SessionInfoManager();
            this.sessionInfoManager.addListener(sessionListener);
			if(!(dependency && dependency.testEnv === true))
			{
				this.vMonitorActivity = virtualMonitorActivity;
				this.vMonitorActivity.init( );
			}
        }
		
        function updateWindowId(message) {
            var windowInfo = message.windowInfo;
            message.windowId = windowInfo.sessionId + '-' + windowInfo.appId;
        }

        ProxyWindows.prototype.create = function (sessionMessage) {
            var message = sessionMessage.srcMessage;
            updateWindowId(message);
        };		

        function _create(message) {       
		if(!(dependency && dependency.testEnv === true))
		{	
            windowMap[message.windowId] = { sessionWinId:message.WinId,appWindow: null, windowInfo: message.windowInfo, flags: { created: false, loaded: false ,pendingRestart:false} };
            windowMap[message.windowId].queueCmds = [];
		}
            console.log("Creating window" + message.windowId);
            var pageURL = '/ChromeAppUI/HiddenWindow.html';

            var options = {
                'frame': 'none',
                'id': message.windowId,
                'focused':false,
                'outerBounds': { 'left': -10000, 'top': -10000, 'width' : 64, 'height' : 64}
            };
			if(!(dependency && dependency.testEnv === true))
			{
				chrome.runtime.getBackgroundPage(function(bg) {
					bg.asyncObjects.get('appWindow.chromeConfig' ,function(chromeConfig){
					if (chromeConfig && chromeConfig["seamless"] && chromeConfig["seamless"]["showInShelf"] === true) {
						options["showInShelf"] = true;
						if (message.data && message.data.iconLink) {
							console.log("Setting Icon during window Create");
							options["icon"] = message.data.iconLink;
						}
						else
						{
						console.log("Did not get Icon during create");
						}
					}
					chrome.app.window.create(pageURL, options, function (appWindow) {
						windowCreationHandler(appWindow, message);
						appWindow.contentWindow.showInShelf = options["showInShelf"];
					});
					});
				});
			}
			else{
				registerEvents(message);
			}

			function registerEvents(message) {
				if(dependency && dependency.testEnv)
				{
					windowMap[message.windowId] = message.fakewindowMap;
				}
                var windowInfo = message.windowInfo;
	
                var appWindow = windowMap[message.windowId].appWindow;
				
				 function onFocus() {
                    console.log("UI: focus event");
					var uiManager;
					
					if(dependency && dependency.testEnv)
					{
						uiManager = message.uiManager;
                    }
					else{
						uiManager = proxyWindows.sessionInfoManager.getUiManager(windowInfo.sessionId);	
					}
                    if (uiManager) {
                        var slMessage = new SeamlessUI.Message();
                        slMessage.sessionId = windowInfo.sessionId;
                        slMessage.appId = windowInfo.appId;
                        slMessage.cmd = 'update';
                        slMessage.uiCmd = SeamlessUI.focus;
                        slMessage.focus = true;
                        uiManager.dispatch(slMessage.message);
                    }
                }
					if(dependency && dependency.testEnv)
						onFocus();
					else
						appWindow.contentWindow.addEventListener("focus",onFocus);
                
                function outerBoundsReset(appWindow)
                {
                  appWindow["outerBounds"]["left"] = -10000;
                  appWindow["outerBounds"]["top"] = -10000;
                }
				
                function onRestored(appWindow){
                  outerBoundsReset(appWindow);
                  console.log("UI: restore event");
				}
				
				
				if(dependency && dependency.testEnv)
					onRestored(appWindow);
				else
					appWindow.onRestored.addListener(onRestored.bind(null,appWindow));
			
				function onBoundsChanged(appWindow) {
                  outerBoundsReset(appWindow);
                  console.log("UI: onBoundsChanged event");
                }
				
				if(dependency && dependency.testEnv)
					onBoundsChanged(appWindow);
				else
					appWindow.onBoundsChanged.addListener(onBoundsChanged.bind(null,appWindow));
				
				function onClosed(){
                   console.log("UI: close clicked  and pendingRestart is "+windowMap[message.windowId].flags.pendingRestart );
                    if(windowMap[message.windowId].flags.pendingRestart === false)
                    {
                    var slMessage = new SeamlessUI.Message();
					var uiManager;
					
                    if(dependency && dependency.testEnv)
					{
						uiManager = message.uiManager;
                    }
					else{
					   uiManager = proxyWindows.sessionInfoManager.getUiManager(windowInfo.sessionId);	
					}
                    if (uiManager) {
                        slMessage.sessionId = windowInfo.sessionId;
                        slMessage.appId = windowInfo.appId;
                        slMessage.cmd = 'close';
                        slMessage.uiCmd = SeamlessUI.close;
                        console.log("Dsipatching : " + JSON.stringify(message));
                        uiManager.dispatch(slMessage.message);                        
                    }
                    delete windowMap[message.windowId];
                    }
                    else
                    {                 
                      delete windowMap[message.windowId];
                      _create(message);
                    }
                }
				
				if(dependency && dependency.testEnv)
					onClosed();
				else
				appWindow.onClosed.addListener(onClosed);

                if (message.hasMaximize) {
					function onMaximized(){
                        console.log("UI: window Maximized" + appWindow.id);
                        var slMessage = new SeamlessUI.Message();
						var uiManager;
						
                        if(dependency && dependency.testEnv)
						{
							uiManager = message.uiManager;
						}
						else{
							uiManager = proxyWindows.sessionInfoManager.getUiManager(windowInfo.sessionId);	
						}
                        if (uiManager) {
                            slMessage.sessionId = windowInfo.sessionId;
                            slMessage.appId = windowInfo.appId;
                            slMessage.uiCmd = SeamlessUI.maximise;
                            slMessage.maximize = true;
                            uiManager.dispatch(slMessage.message);
                        }
                    }
					if(dependency && dependency.testEnv)
						onMaximized();
					else
						appWindow.onMaximized.addListener(onMaximized);
                }


                if (message.minimize) {
					function onMinimized() {
                        console.log("UI: onMinimized");
                        var slMessage = new SeamlessUI.Message();
						var uiManager;
						
                        if(dependency && dependency.testEnv)
						{
							uiManager = message.uiManager;
						}
						else{
							uiManager = proxyWindows.sessionInfoManager.getUiManager(windowInfo.sessionId);	
						}
                        if (uiManager) {
                            slMessage.sessionId = windowInfo.sessionId;
                            slMessage.appId = windowInfo.appId;
                            slMessage.cmd = 'update';
                            slMessage.uiCmd = SeamlessUI.minimise;
                            slMessage.minimize = true;
                            uiManager.dispatch(slMessage.message);
                        }
                    }
					if(dependency && dependency.testEnv)
						onMinimized();
					else
						appWindow.onMinimized.addListener(onMinimized);
                }
            }
			
            function windowCreationHandler(appWindow, message) {
                var windowInfo = message.windowInfo;
                windowMap[appWindow.id].flags.created = true;
                appWindow.contentWindow.addEventListener('DOMContentLoaded', function () {
                    windowMap[appWindow.id].flags.loaded = true;
                    if( windowMap[appWindow.id].flags.pendingRestart === true)
                    windowMap[appWindow.id].flags.pendingRestart = false;
                    appWindow.contentWindow.registerEvents(message);
                    stagedCommands.flushCmds(message);
                    //Since the title and icon anre updated in message, we can just directly set them whenever window is loaded
                    {
                      _setTitle(message);
                      _setIcon(message);
                    }
                }, false);
                windowMap[appWindow.id].appWindow = appWindow;
                windowMap[appWindow.id].windowInfo = windowInfo;
                appWindow.contentWindow.windowInfo = message;
                appWindow.contentWindow.registerEvents = registerEvents;
            }
        };
        
        ProxyWindows.prototype.close = function (message) {
          console.log("ProxyWindows.prototype.close ");
            updateWindowId(message);
            console.log("Received close event" + message.windowId);
            stagedCommands.queueCmds(_close, message);
        };
        function _close(message) {
			if(dependency && dependency.testEnv)
				windowMap[message.windowId] = message.windowMap;
            if(windowMap[message.windowId] && windowMap[message.windowId].appWindow)
            windowMap[message.windowId].appWindow.applyCmd({type: "close"});
        }

        ProxyWindows.prototype.closeAll = function (message) {
			if(dependency && dependency.testEnv)
				windowMap[message.windowId] = message.windowMap;
            var sessionId = message.windowInfo.sessionId;
            console.log("received close all request for session : " + sessionId);
            Object.keys(windowMap).forEach(function (windowEntry) {                
                if(windowEntry && windowMap[windowEntry].windowInfo)
                {
                if (windowMap[windowEntry].windowInfo.sessionId == sessionId) {
                    message = new SeamlessUI.Message();
                    message.sessionId = sessionId;
                    message.appId = windowMap[windowEntry].windowInfo.appId;
                    message.cmd = 'close';
                    if(windowMap[windowEntry].appWindow)
                    windowMap[windowEntry].appWindow.close();
                    delete windowMap[windowEntry];
                }
                }
            });
        };        
		
        ProxyWindows.prototype.focus = function (message) {
        
        };

        ProxyWindows.prototype.setIcon = function (message) {
            updateWindowId(message);
            stagedCommands.queueCmds(_setIcon, message);
			if(dependency && dependency.testEnv)
			{
				windowMap = message.windowMap;
			}
            if(windowMap[message.windowId])
            {
				stagedCommands.queueCmds(_recreate, message);
              
            }
            else
            {
               _create(message);
            }
        };

        function _recreate(message)
        {
          if(windowMap[message.windowId] && (windowMap[message.windowId].appWindow != null) && ((windowMap[message.windowId].flags.pendingRestart) === false))
            {
              windowMap[message.windowId].flags.pendingRestart = true;
              windowMap[message.windowId].appWindow.close();
            }
        }
        function _setIcon(message) {
          console.log("received set Icon command");
          if (message.data && message.data.iconLink) {
            if(windowMap[message.windowId] && windowMap[message.windowId].appWindow)
            {
                console.log("Dsipatching : " + JSON.stringify(message));
                windowMap[message.windowId].appWindow.applyCmd({ type: 'icon', data: message.data.iconLink});
            }
            }
        }
        ProxyWindows.prototype.minimizeWindow  = function (message) {
          console.log("ProxyWindows Minimize");      
          updateWindowId(message);
          stagedCommands.queueCmds(_minimizeWindow,message);
        };
        
        function _minimizeWindow (message)
        {
          var windowInfo = message.windowInfo;
          message.windowId = windowInfo.sessionId + '-' + windowInfo.appId;
          var wnd = chrome.app.window.get(message.windowId);
    	  if (wnd) {
    		wnd.minimize();
    	   }
        }

        ProxyWindows.prototype.setTitle = function (message) {
            updateWindowId(message);
            stagedCommands.queueCmds(_setTitle,message);
        };
		
		ProxyWindows.prototype.hideAll = function (sessionWindId) {			
			Object.keys(windowMap).forEach(function (windowEntry) {                
                if (windowMap[windowEntry].sessionWinId == sessionWindId) {
					windowMap[windowEntry].appWindow.hide();             
                }
            });
        };
		ProxyWindows.prototype.showAll = function (sessionWindId) {
			Object.keys(windowMap).forEach(function (windowEntry) {                
                if (windowMap[windowEntry].sessionWinId == sessionWindId) {
					windowMap[windowEntry].appWindow.show();
                }
            });
        };

        function _setTitle(message) {
            console.log("received set title command");
            if (message.data && message.data.windowName) {
              if(windowMap[message.windowId] && windowMap[message.windowId].appWindow)
              {
                windowMap[message.windowId].appWindow.applyCmd({ type: "title", data: message.data.windowName});
              }
            }
        }
   
        var commandSwitcher;
        function sessionListener(message) {
                if(!commandSwitcher) {
                    commandSwitcher = new g.Utils.SwitchClass(proxyWindows);
                }                
                commandSwitcher.execute(message.cmd, message);
        };
        
        ProxyWindows.prototype.create.$id = 'add';
        ProxyWindows.prototype.close.$id = 'remove';
        ProxyWindows.prototype.setIcon.$id = 'icon';
        ProxyWindows.prototype.setTitle.$id = 'title';
        ProxyWindows.prototype.focus.$id = 'focus';
        ProxyWindows.prototype.minimizeWindow.$id = 'minimizeWindow';
        ProxyWindows.prototype.closeAll.$id = 'unregister';
        ProxyWindows.prototype.hideAll.$id = 'hideAll';
        ProxyWindows.prototype.showAll.$id = 'showAll';
        
        return ProxyWindows;
    })();

    //Export class for DI
    SeamlessUI['ProxyWindows'] = ProxyWindows;

	if(dependency && dependency.testEnv === true){
		SeamlessUI['StagedCommands'] = StagedCommands;
	}
})(SeamlessUI || (SeamlessUI = {}));

	(function () {
		window.onload = function () {
			var proxyWindows = new SeamlessUI['ProxyWindows']();
			var sessionInfoManager = proxyWindows.sessionInfoManager;
			
			if(!(dependency && dependency.testEnv === true)){
			chrome.runtime.getBackgroundPage(function(bg) {
				bg.asyncObjects.add('object.sessionInfoManager' ,sessionInfoManager);
				bg.asyncObjects.add('object.proxyWindows' ,proxyWindows);
				
			});
		}
			window.addEventListener("message", handleOnMessage.bind(undefined, proxyWindows), false);
		};
		
		function handleOnMessage(proxyWindows, event) {
			var sessionInfoManager = proxyWindows.sessionInfoManager;
			var data = event.data;
			if(event.origin === self.location.origin){
				switch (data['cmd']) {
					case 'unRegister':
						sessionInfoManager.unRegister(data['sessionId']);            
						break;
					case "hideAll" :
						proxyWindows.hideAll(data["sessionWinId"]);
						break;
					case "showAll" :
						proxyWindows.showAll(data["sessionWinId"]);
						break;
				}
			}
		}
	})();


