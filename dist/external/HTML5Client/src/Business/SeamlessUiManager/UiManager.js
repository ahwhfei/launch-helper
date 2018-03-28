var SeamlessUI;

(function(SeamlessUI){
	SeamlessUI.WindowMap = {};

	if(SeamlessUI.create === undefined) {
		SeamlessUI.create = 1;
		SeamlessUI.restore = 2;
		SeamlessUI.close = 3;
		SeamlessUI.minimise = 4;
		SeamlessUI.maximise = 5;
		SeamlessUI.focus = 6;
		SeamlessUI.icon = 7;
		SeamlessUI.none = 8;
		SeamlessUI.move = 14;
		SeamlessUI.UiAction = 15;
		SeamlessUI.title = 16;
		SeamlessUI.sessionInfo = 17;
		SeamlessUI.minimizeWindow = 18;
		SeamlessUI.reset = 19;
	}

	var UIManager = (function () {
		var sessionId;
		var virtualWindow;
		var listeners = [];
		var listenerMapping = [];		
		var proxyDomWindow;
		var uiManager;
		var uiManagerCommands;
        var sessionInfoManager;
        var seamlessMode = true;
        var pendingSessionInfoCmd = [];
        function sendToSessionInfo(message ){
        	if(!sessionInfoManager)	{
        		pendingSessionInfoCmd[pendingSessionInfoCmd.length] = message;
        	}else{
        		sessionInfoManager.notify(message);
        	}
        }
		function UIManager(_sessionId) {
			sessionId = _sessionId;
            virtualWindow = dependency.resolve(SeamlessUI, 'WindowPresenter');
			virtualWindow.init(this);

			uiManager = this;
			chrome.runtime.getBackgroundPage(function (bg) {
				bg.asyncObjects.get( 'object.sessionInfoManager' ,function(mgr){
						 sessionInfoManager = mgr;
		                 sessionInfoManager.register(sessionId, uiManager);
		                 for(var i = 0 ; i < pendingSessionInfoCmd.length ;i++){
		                 	sendToSessionInfo(pendingSessionInfoCmd[i]);
		                 }
		                 pendingSessionInfoCmd = [];
				});	
                bg.asyncObjects.get( 'appWindow.proxyDomWindow' ,function(win){
                	console.log("UiManger setting proxy window instance");
                	proxyDomWindow = win;
                });
			});

            HTML5Interface.window.addEventListener("unload", function() {                
            	proxyDomWindow.postMessage({'cmd' : 'unRegister' , 'sessionId' : sessionId} , self.location.origin);
            });

			uiManagerCommands = UiManagerCommands();
		}

		UIManager.prototype.process = function (message) {
			function processUpdate (message) {
				if(message.attributes) {
					var attributes = message.attributes;
					if(!message.keys) {
						message.keys = [];
						for (var key in attributes) {
							if (attributes.hasOwnProperty(key)) {
								message.keys.push(key);
							}
						}
						message.keyIndex = 0;
						message.processPending = message.keys.length != 0;
					}

                    message.uiCmd = SeamlessUI.none;
					if(message.processPending) {
						switch(message.keys[message.keyIndex]) {
							case 'dimension' :
								message.uiCmd = SeamlessUI.move;
								break;
							case 'icon' :
								message.uiCmd = SeamlessUI.icon;
								break;
							case 'focus':
								message.uiCmd = SeamlessUI.focus;
								break;
							case 'minimize' :
								message.uiCmd = SeamlessUI.minimise;
								break;
							case 'maximize' :
								message.uiCmd = SeamlessUI.maximise;
								break;
							case 'windowName':
								message.uiCmd = SeamlessUI.title;
								break;
							case 'minimizeWindow':
							  message.uiCmd = SeamlessUI.minimizeWindow;
							  break;
						}

						message.keyIndex++;
						message.processPending = message.keys.length > message.keyIndex;
					}
				}
			}
			if(g.environment.receiver.isChromeApp && !g.environment.receiver.isKiosk){
				message.WinId = chrome.app.window.current().id;
			}

			switch (message.cmd) {
				case 'create' :
					message.uiCmd = SeamlessUI.create;
					message.processPending = false;
					break;
				case 'close':
					message.uiCmd = SeamlessUI.close;
					message.processPending = false;
					break;
				case 'update':
					processUpdate(message);
					break;
				case 'action':
					message.uiCmd = SeamlessUI.UiAction;
					message.processPending = false;
					break;
				case 'sessionInfo':
					message.uiCmd = SeamlessUI.sessionInfo;                    
					message.processPending = false;
					break;
				case 'reset':
				  message.uiCmd = SeamlessUI.reset;
					message.processPending = false;
					break;
				default :
					message.uiCmd = message.cmd;
					message.processStop = true;
					break;
			}
			
		};

		var lastCmd;
		UIManager.prototype.execute = function(message) {
            if(message.cmd != 'sessionInfo' && seamlessMode == false) {
                return;
            }
            var slMessage = new SeamlessUI.Message(message);
			if(message.cmd != "action") {
				//console.log("Executing command in UiManager : " + JSON.stringify(slMessage.message));
				if (!slMessage.windowInfo) {
					console.log("No valid window information, discarding this message");
				}

				if (slMessage.processPending === undefined) {
					slMessage.processPending = true;
				}

				while (slMessage.processPending) {
					this.process(slMessage);
					if(slMessage.processStop) {
						console.log("invalid command");
						break;
					}
					lastCmd = slMessage.uiCmd;
                    if(slMessage.uiCmd != SeamlessUI.none) {
                        uiManagerCommands.execute(slMessage);
                    }
				}
			}else {
				uiManagerCommands.execute(slMessage);
			}
		};

		UIManager.prototype.addListener = function(listener) {
			listeners.push(listener);
		};
		/*
		 * has to merge with add listener
		 */
		UIManager.prototype.addListenerById = function(id, listener) {
			if(!listenerMapping[id]){
				listenerMapping[id] = [ ];
			}
			listenerMapping[id].push(listener);
		};


		UIManager.prototype.dispatch = function(message) {
            if(message.slMessage) {
                message = message.message;
            }
            for(var i = 0; i < listeners.length; i++) {
                listeners[i](message);
            }
		};

		UIManager.prototype.unFocus = function(windowInfo){
			virtualWindow.unFocus(windowInfo);
		};

		function UiManagerCommands() {
			var cmdDict = {};

			cmdDict[SeamlessUI.create] = function create() {
				return {
					execute : function execute(message) {                        
						//console.log("Execute : " + JSON.stringify(message));
						if(message.taskbar) {
							sendToSessionInfo(message );
						}else {
							console.log("Not task bar entry, not creating proxyWindow");
						}
						virtualWindow.create(message);
					}
				};
			}();

			cmdDict[SeamlessUI.close] = function() {
				return {
					execute : function(message){
						//console.log("Execute : " + JSON.stringify(message));
						virtualWindow.close(message);
                        if(message.taskbar) {
						  sendToSessionInfo(message);
                        }                        
					}
				};
			}();

			cmdDict[SeamlessUI.icon] = function() {
				return {
					execute : function(message){
						//console.log("Execute : " + JSON.stringify(message));
						sendToSessionInfo(message);
					}
				};
			}();

			cmdDict[SeamlessUI.focus] = function () {
				return {
					execute: function(message) {
						virtualWindow.focus(message.windowInfo);
						sendToSessionInfo(message);				
                    }
				};
			}();

			cmdDict[SeamlessUI.move] = function () {
				return{
					execute: function execute(message) {
						//console.log("Execute : " + JSON.stringify(message));
						virtualWindow.update(message);
					}
				};
			}();
			cmdDict[SeamlessUI.minimizeWindow] = function () {
				return{
					execute: function execute(message) {
						virtualWindow.unFocus(message.windowInfo);
						sendToSessionInfo(message);
					}
				};
			}();

			cmdDict[SeamlessUI.title] = function() {
				return {
					execute : function(message){
						//console.log("Execute : " + JSON.stringify(message));
						sendToSessionInfo(message);
					}
				};
			}();

			cmdDict[SeamlessUI.reset] = function() {
				return {
					execute : function(message){
						virtualWindow.reset();
					}
				};
			}();


			cmdDict[SeamlessUI.sessionInfo] = function() {
				return {
					execute : function(message){
                        if(message.seamlessMode === false) {
                            seamlessMode = false;
                            console.log("Setting seamless mode to false");
                        } else {
                            seamlessMode = true;
                        }                        
						var listeners = listenerMapping['sessionInfo'];
						if(listeners.length){
							for(var i = 0; i < listeners.length; i++) {
								listeners[i](message.command);
							}
						}
						console.log("Received sessionInfo");
						sendToSessionInfo(message);
 					}
				};
			}();


			cmdDict[SeamlessUI.UiAction] = function () {
				return{
					execute: function execute(message) {

					}
				};
			}();

			return {
				execute: function (message) {
					if (cmdDict[message.uiCmd]) {
						cmdDict[message.uiCmd].execute(message);
					}
				}
			};
		}
		return UIManager;
	})();

	SeamlessUI['ChromeUIManager'] = g.environment.receiver.isKiosk === true ? SeamlessUI['HTML5UiManager'] :UIManager;
	SeamlessUI.name = 'SeamlessUI';
})(SeamlessUI || (SeamlessUI = {}));
