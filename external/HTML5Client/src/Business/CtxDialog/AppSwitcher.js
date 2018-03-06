var UiControls;
(function(UiControls) {
    var AppSwitcher = (function() {
        //static variable
        var SeamlessUiWrapper;

        this.SwitcherEntriesSnapshot = {};

        var myself;
        var mobileAppSwitcher;
        var desktopAppSwitcher;

        var storedValue = {};
        var sessionSize = {};

        var isForcedTaskBarHide = false;
        var isFullScreen = false;

        //Constructor
        function AppSwitcher(seamlessUiWrapper,prefs) {
            myself = this;
            readPreferences(prefs);
            SeamlessUiWrapper = seamlessUiWrapper;
            if (SeamlessUiWrapper && SeamlessUiWrapper.sessionInfoManager) {
                this.SwitcherEntriesSnapshot = SeamlessUiWrapper.sessionInfoManager.getSnapShot();
                console.log(SeamlessUiWrapper.sessionInfoManager.getSnapShot());
            }
            //TODO some business logic to check mobile or desktop
            if (SeamlessUiWrapper.sessionInfoManager) {
                SeamlessUiWrapper.sessionInfoManager.addListener(onMessageFromSeamless);
            }
			// check if Tollbar and switchapp button is enabled before registering callback
			if(HTML5_CONFIG['ui'] && HTML5_CONFIG['ui']['toolbar'] && HTML5_CONFIG['ui']['toolbar']['menubar'] !== false && HTML5_CONFIG['ui']['toolbar']['switchApp'] !== false){
				UiControls.Toolbar.register({"id" : "switchApp","handler" : onToolBarClickSwitchAppHandler});
			}

            desktopAppSwitcher = new UiControls.DesktopAppSwitcher(myself);
            mobileAppSwitcher = new UiControls.MobileAppSwitcher(myself);
			CEIP.add("appSwitcher:used",true);
        }

        var readPreferences = function(prefs) {
			if (prefs['appSwitcher'] == undefined) {
                storedValue['autoHide'] = HTML5_CONFIG['ui']['appSwitcher']['autoHide'];
                storedValue['showIconsOnly'] = HTML5_CONFIG['ui']['appSwitcher']['showIconsOnly'];
                storedValue['showTaskbar'] = HTML5_CONFIG['ui']['appSwitcher']['showTaskbar'];
            } else {
                var json = JSON.parse(prefs['appSwitcher']);
                storedValue['autoHide'] = json['autoHide'];
                storedValue['showIconsOnly'] = json['showIconsOnly'];
                storedValue['showTaskbar'] = json['showTaskbar'];
            }
        };

        var onMessageFromSeamless = function(cmd) {
            AppSwitcher.prototype.ParseCommand(cmd);
			 
        };
		
		function forceAutoHideOnFullScreen(isFullScreen) {
			desktopAppSwitcher.ForceFullscreenAppSwitcherAutoHide(isFullScreen);
		}

        AppSwitcher.prototype.addEntry = function(appId) {
            desktopAppSwitcher.addEntry(appId);
            mobileAppSwitcher.addEntry(appId);
        };

        AppSwitcher.prototype.removeEntry = function(appId) {
            desktopAppSwitcher.removeEntry(appId);
            mobileAppSwitcher.removeEntry(appId);
        };

        AppSwitcher.prototype.updateIcon = function(appId, iconData) {
            desktopAppSwitcher.updateIcon(appId, iconData);
            mobileAppSwitcher.updateIcon(appId, iconData);
        };

        AppSwitcher.prototype.updateTitle = function(appId, title) {
            desktopAppSwitcher.updateTitle(appId, title);
            mobileAppSwitcher.updateTitle(appId, title);
        };

        AppSwitcher.prototype.changeFocus = function(appId) {
            desktopAppSwitcher.changeFocus(appId);
            mobileAppSwitcher.changeFocus(appId);
        };

        AppSwitcher.prototype.Resize = function(width, height) {
                desktopAppSwitcher.checkForDesktopAppSwitcherOverflow(width);
                if (storedValue) {
                    if (storedValue['autoHide'] == true || storedValue['showTaskbar'] == false) {
                        AppSwitcher.prototype.SendWorkArea(width, height);
                    } else {
                        AppSwitcher.prototype.SendWorkArea(width, height - 50);
                    }
                }
        };


        AppSwitcher.prototype.Dispatch = function(msg) {
            SeamlessUiWrapper.dispatch(msg);
        };

        AppSwitcher.prototype.ShowDesktopAppSwitcher = function() {
            desktopAppSwitcher.showDesktopAppSwitcher();
        };

        AppSwitcher.prototype.HideDesktopAppSwitcher = function() {
            desktopAppSwitcher.hideDesktopAppSwitcher();
        };

        AppSwitcher.prototype.initialize = function(size) {
        	UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.sessionResize ,function(resolution ){
        	        AppSwitcher.prototype.Resize(resolution.width , resolution.height);
					
					// Check with Suhas why this code was added, it was failing so commenting it
        	      //  UiControls.ResolutionUtility.set(UiControls.ResolutionUtility.constants.autoDisplayInfo , false);
        		 	UiControls.ResolutionUtility.registerCallback(UiControls.ResolutionUtility.constants.vdaSessionSize ,function(resolution){
        		 		sessionSize = {width : resolution.width, height : resolution.height };
        		 		AppSwitcher.prototype.Resize(resolution.width , resolution.height);
        		 	});
           			sessionSize = {width : resolution.width, height : resolution.height };
            		mobileAppSwitcher.initialize();
           			desktopAppSwitcher.initialize(sessionSize);
        		
        	});
       
        };

        AppSwitcher.prototype.getSessionSize = function() {
        	return sessionSize;
        };

        AppSwitcher.prototype.SendWorkArea = function(width, height) {
			var monitorlayout =  [{
				workArea: {
						left: 0,
						top: 0,
						height: height,
						width: width
                        }
                    }];
			var data = {
				'cmd' : "workArea",
				monitorInfo: monitorlayout
			};		
            AppSwitcher.prototype.Dispatch(data);
        };

        AppSwitcher.prototype.GetPreferences = function() {
            return storedValue;
        };

        AppSwitcher.prototype.ParseCommand = function(msg) {
            var appId = msg.windowInfo.appId;
            switch (msg.cmd) {
                case "add":
                    AppSwitcher.prototype.addEntry(appId);
                    break;
                case "remove":
                    AppSwitcher.prototype.removeEntry(appId);
                    break;
                case "focus":
                    AppSwitcher.prototype.changeFocus(appId);
                    break;
                case "icon":
                    var iconData = msg.data.iconLink;
                    AppSwitcher.prototype.updateIcon(appId, iconData);
                    break;
                case "title":
                    var title = msg.data.windowName;
                    AppSwitcher.prototype.updateTitle(appId, title);
                    break;
                case "sessionUpdate":
				    break;
                case "isFullScreen":
					if(msg.windowInfo && msg.windowInfo.isFullScreen!= undefined && !g.environment.os.isTouch && !g.environment.receiver.isKiosk)
					   forceAutoHideOnFullScreen(msg.windowInfo.isFullScreen );
                    break;
                default:
                    console.log("Unknown command in AppSwitcher ", msg);
                    break;
            }
        };

        var onToolBarClickSwitchAppHandler = function(event) {
			CEIP.incrementCounter("toolbar:buttons:switchApps");
            mobileAppSwitcher.showOverlay();
        };

        return AppSwitcher;
    })();
    UiControls.AppSwitcher = AppSwitcher;
})(UiControls || (UiControls = {}));
