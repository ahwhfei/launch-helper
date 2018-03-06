/**
 * Created by rajasekarp on 22-12-2015.
 */

var SeamlessUI;

(function (SeamlessUI) {
	var SessionInfoManager = function () {
		var iconHandler;
        function SessionInfoManager() {
			this.sessionListeners = [];
            iconHandler = new g.Utils.IconHandler();
            this.sessionSnapShot = {};
        }

        SessionInfoManager.prototype.sessionListener = function (message) {
            for (var listenerId in this.sessionListeners) {
                this.sessionListeners[listenerId](message);
            }
        };
        
        
		SessionInfoManager.prototype.notify = function (slMessage) {
            var sessionUiManager = sessionMap[slMessage.sessionId];           
			var sessionInfoData;
            var sendBlock = false;
            switch (slMessage.cmd) {
                case 'create':
                    console.log("received create for " , slMessage.windowInfo);
                    if (slMessage.taskbar != true) {
                        return;
                    }
                    if (this.sessionSnapShot[slMessage.sessionId] == undefined) {
                        var sessionInfo = {};
                        sessionInfo.entries = {};
                        if (sessionUiManager) {
                            sessionInfo.sessionCall = sessionUiManager.actionCallback;
                        }
                        this.sessionSnapShot[slMessage.sessionId] = sessionInfo;
                    }
                    var entry = {
                        windowName: slMessage.windowName,
                        iconData: slMessage.iconData
                    };
                    this.sessionSnapShot[slMessage.sessionId].entries[slMessage.appId] = entry;
                    this.sessionListener({ cmd: 'add', data: entry, windowInfo: slMessage.windowInfo, srcMessage: slMessage });
					if (slMessage.isFullScreen != undefined) {
                                this.sessionListener({ cmd: 'isFullScreen', data: entry, windowInfo: slMessage.windowInfo });
                    }
                    break;
                case 'close':
                    console.log("received close for " , slMessage.windowInfo);
                    if (this.sessionSnapShot[slMessage.sessionId]) {
                        var cmdData = {};
                        if (this.sessionSnapShot[slMessage.sessionId].entries[slMessage.appId]) {
                            delete this.sessionSnapShot[slMessage.sessionId].entries[slMessage.appId];
                            cmdData.app = slMessage.appId;
                        }
                        /*if (Object.keys(this.sessionSnapShot[slMessage.sessionId].entries).length == 0) {
                            console.log("Deleting session map for session : ", slMessage.sessionId);
                            delete this.sessionSnapShot[slMessage.sessionId];
                            cmdData.session = slMessage.sessionId;
                        }*/
                    }
                    this.sessionListener({ cmd: 'remove', data: cmdData, windowInfo: slMessage.windowInfo });
                    break;
                  case 'sessionInfo':
                    var sessionBlock = this.sessionSnapShot[slMessage.sessionId];
                    if (sessionUiManager) {
                        //if sessionId is created first time
                        if (sessionBlock == undefined) {
                            sessionBlock = {};
                            sessionBlock.entries = {};
                            sessionBlock.usbEnabled = false;
                            sessionBlock.sentOnce = false;
                            sessionBlock.sessionCall = sessionUiManager.actionCallback;
                            this.sessionSnapShot[slMessage.sessionId] = sessionBlock;
                        }
                        //if caption is received
                        if (slMessage.serverName ) {
                            sessionBlock.caption = slMessage.serverName;
                        }
                        //if desktopMode is received
                        if (slMessage.seamlessMode != undefined) {
                            sessionBlock.desktopMode = !slMessage.seamlessMode;
                        }
                        // if usbEnabled is true, send data
                        if (slMessage.usbEnabled == true) {
                            sessionBlock.usbEnabled = true;
                            sessionInfoData = {
                                usbEnabled: true
                            };
                            sendBlock = true;
                        }//if both caption and desktopMode are defined, send data
                        else if (sessionBlock.sentOnce === false && sessionBlock.caption != undefined && sessionBlock.desktopMode != undefined) {
                            sessionInfoData = {
                                caption: sessionBlock.caption,
                                desktopMode: sessionBlock.desktopMode,
                                usbEnabled: false
                            };
                            sendBlock = true;
                            sessionBlock.sentOnce = true;
                        }else if(sessionBlock.sentOnce == true && sessionBlock.caption != undefined){
                        	 sessionInfoData = {
                                caption: sessionBlock.caption
                            };
                            sendBlock = true;
                        }                       
                    }
                    
                    if (sendBlock == true) {
                        this.sessionListener({
                            cmd: 'sessionUpdate',
                            data: sessionInfoData,
                            windowInfo: slMessage.windowInfo
                        });
                    }
                    console.log("Received session info : " , sessionInfoData);
                    break;
                   case 'update':
	                    var entry;
	                    if(this.sessionSnapShot[slMessage.sessionId]) {
	                        entry = this.sessionSnapShot[slMessage.sessionId].entries[slMessage.appId];
	                    }
	                    
	                    if(entry) {
                            if (slMessage.iconData) {
                                entry.iconLink = iconHandler.convertToPng(slMessage.iconData);
                                this.sessionListener({ cmd: 'icon', data: entry, windowInfo: slMessage.windowInfo, WinId: slMessage.WinId });
                            } else if (slMessage.title) {
                                entry.windowName = slMessage.title;
                                this.sessionListener({ cmd: 'title', data: entry, windowInfo: slMessage.windowInfo });
                            } else if (slMessage.focus) {
                                this.sessionListener({ cmd: 'focus', data: entry, windowInfo: slMessage.windowInfo });
                            } else if (slMessage.minimizeWindow) {
                                this.sessionListener({ cmd: 'minimizeWindow', data: entry, windowInfo: slMessage.windowInfo });
                            }
							if (slMessage.isFullScreen != undefined){
                                this.sessionListener({ cmd: 'isFullScreen', data: entry, windowInfo: slMessage.windowInfo });
                            }
	                    }
						break;
                          
				default:
					console.log("Notification not available for " + slMessage.cmd + "  command[SessionInfoManager]");
					break;
			}
		};
        SessionInfoManager.prototype.getSnapShot = function () {
			return this.sessionSnapShot;
		};

		SessionInfoManager.prototype.addListener = function (callback) {
			this.sessionListeners.push(callback);
		};
        
        var sessionMap = {};
        SessionInfoManager.prototype.register = function (sessionId, uiManager) {
			if(!sessionMap[sessionId]) {
				sessionMap[sessionId] = uiManager;
				sessionMap[sessionId].count = 0;
                console.log("Registering session : " + sessionId);
			}else {
				sessionMap[sessionId].count++;
			}
		};

		SessionInfoManager.prototype.unRegister = function (sessionId) {
			if(sessionMap[sessionId]) {
				if(sessionMap[sessionId].count > 0) {
					sessionMap[sessionId].count--;
				}else {					                    
					if(this.sessionSnapShot[sessionId]) {
                        delete this.sessionSnapShot[sessionId];
                    }
                    delete sessionMap[sessionId];
                    console.log("Unregistering session : " + sessionId);
                    this.sessionListener({cmd: 'unregister', data: sessionId, windowInfo: {sessionId: sessionId}});
				}
			}
		};
        
        SessionInfoManager.prototype.getUiManager = function(sessionId) {
            return sessionMap[sessionId];
        }

		return SessionInfoManager;
	}();

	var HTML5SessionInfoManager = (function(_super) {
		_ts.extends(HTML5SessionInfoManager, _super);

		var iconHandler;
		function HTML5SessionInfoManager(_sessions) {
			iconHandler = new g.Utils.IconHandler();
			_super.call(this, _sessions);
		}

		HTML5SessionInfoManager.prototype.notify = function(slMessage) {
			switch(slMessage.cmd) {
                case 'update' :
                    var entry;
                    if(this.sessionSnapShot[slMessage.sessionId]) {
                        entry = this.sessionSnapShot[slMessage.sessionId].entries[slMessage.appId];
                    }
                    
                    if(entry) {
                        if(slMessage.iconData) {
                            entry.iconLink = iconHandler.convertToPng(slMessage.iconData);
                            this.sessionListener({cmd: 'icon',  data: entry, windowInfo: slMessage.windowInfo});
                        }else if(slMessage.title) {
                            entry.windowName = slMessage.title;
                            this.sessionListener({cmd: 'title',  data: entry, windowInfo: slMessage.windowInfo});
                        }else if(slMessage.focus) {
                            this.sessionListener({cmd: 'focus',  data: entry, windowInfo: slMessage.windowInfo});
                        }
                    }
					break;
				default:
					_super.prototype.notify.call(this, slMessage);
					break;
			}
		};

		return HTML5SessionInfoManager;
	})(SessionInfoManager);

	SeamlessUI.SessionInfoManager = SessionInfoManager;
	SeamlessUI.HTML5SessionInfoManager = HTML5SessionInfoManager;
})(SeamlessUI || (SeamlessUI = {}));