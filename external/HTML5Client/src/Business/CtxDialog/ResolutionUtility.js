var UiControls;
var dependency;
(function (UiControls) {

	var _window = typeof window != 'undefined' ? window : null;
	var _chrome = typeof chrome != 'undefined' ? chrome : null;
	var _document = typeof document != 'undefined' ? document : null;
	var constants = {
		//VDA session size
		vdaSessionSize: 1,
		//if true and on window resize,session will resize else session sizee should be set explicitly
		autoResize: 2,
		fitToWindow: "Fit_To_Window",
		fixed: "Fixed",
		resolutionConfig: 3,
		/*
		 * seame as calculatedSessionSize
		 */
		sessionResize: 4,
		setting_based_resolution: 5,
		useDpr: "Use_Device_Pixel_Ratio",
		/*
		 * Call for all type of info change ex workarea change , resolution change , setting change
		 */
		registerForAll: '*',
		/*
		 * Register function which will be executed before event callback
		 */
		onBeforeEvtCallbacks: 6,
		onEvtCallbacks: 7,
		pinchZoomInvoked: 8,
		autoDisplayInfo: 9,
		displayInformation: 10,
		fullScreen: 11,
		displayWindowsUpdated: 12
	};
	var ResolutionUtility = (function () {
		var evtCallbacks = {};
		var beforeEvtCallbacks = {};
		var blockSetFun = {};
		var autoDisplayInfo = true;
		var maximizeToFullscreen = false;
		var monitorLayouts = [];
		var setDisplayInfo = false;
		var displayDetails = {
			// Use all the monitors if the configuration field is set to true
			useAllMyMonitors: false,
			boundary: {
				left: 0,
				top: 0,
				right: 0,
				bottom: 0
			},
			currentSetting: null, //"Fit_To_Window" | "Use_Device_Pixel_Ratio"
			prefResStr: null, // null | "1600x1200" | "1280x800"
			devicePixelRatio: 1.0,
			isPreferedResolution: false,
			primaryMonitor: 0, // primary monitor index
			currentMonitor: 0,
			isFullScreen: false,
			multimonitor: false,
			monitorCount: 1,
			monitorCountToVDA: 0,
			isUnifiedMode: false,
			sessionSize: { //if unified mode, total width and height; else, bounding rectangle of all the monitors
				width: 0,
				height: 0
			},
			displayInfo: [{ // screen details whatever is sent to server
					workArea: {
						left: 0,
						top: 0,
						width: 0,
						height: 0
					},
					bounds: {
						left: 0,
						top: 0,
						width: 0,
						height: 0
					}
				}
			],
			originalBounds: {},
			settingBasedResolution: {},
			innerBounds: {
				left: 0,
				top: 0,
				width: 0,
				height: 0
			},
			outerBounds: {
				left: 0,
				top: 0,
				width: 0,
				height: 0
			},
			vdaRes: {
				width: 0,
				height: 0
			}
		};

		displayDetails.settingBasedResolution[constants.fitToWindow] = {
			width: 0,
			height: 0
		};

		displayDetails.settingBasedResolution[constants.useDpr] = {
			width: 0,
			height: 0
		};
		var listenerAdded = null;

		/*
		 * Contain older data
		 */
		var preResInfo;
		// for stopping frequent resizing
		var resizeTimerObj = null;
		var is_resize = false;
		var resizeTimeInterval = 500;
		var displayInfoInterval = 100;
		var updateSessionSize = webSessionSize;
		var isSessionResizeRequired;
		var orientationMode;
		var timeStamp;
		var pinchZoomInvoked = false;
		var previousFullScreen;
		var curScreenSize = {
			'width': screen['width'],
			'height': screen['height']
		};
		var LOGGER = "ResUtil : ";
		// In IE, screen["availLeft"] & screen["availTop"] is not defined
		// so assigning it to 0 to fix session launch issue
		// It needs to be handled properly
		if (screen["availLeft"] == undefined) {
			screen["availLeft"] = screen["availTop"] = 0;
		}
		var prevDisplayWindowScreenLeft = [];
		var prevDisplayWindowScreenHeight = [];

		var screenBoundLeft = [];
		var screenBoundTop = [];

		// function to get current window orientation
		// To get window orientation, MS Edge supports window.screen.msOrientation
		// chrom & firefox support window.screen.orientation.type
		// Ipad safari supports window.orientation

		function getCurrentWindowOrientation() {
			var orientationMode;
			if (typeof _window.screen.msOrientation !== "undefined") {
				orientationMode = _window.screen.msOrientation;
			} else if (typeof _window.screen.orientation !== "undefined") {
				orientationMode = _window.screen.orientation.type;
			} else if (typeof _window.orientation !== "undefined") {
				orientationMode = _window.orientation;
			}
			return orientationMode;
		}

		// Assign coorect function to check if resize required based on touch and non-touch devices
		function assignResizeCheckMethod() {
			if (g.environment.receiver.isChromeApp == true && g.environment.receiver.isKiosk != true) {
				return isResizeRequiredForchromeApp;
			} else if (g.environment.os.isTouch) {
				return isResizeRequiredForTouchDevices;
			} else {
				return isResizeRequiredForNonTouchDevices;
			}
		}

		function onWindowResize() {
			if (is_resize == true && resizeTimerObj != null) {
				clearTimeout(resizeTimerObj);
				resizeTimerObj = setTimeout(function () {
						if (isSessionResizeRequired() == true) {
							if (!g.environment.receiver.isChromeApp && displayDetails.currentSetting == constants.fixed) { //suppressing resize event for fixed resolution in html receiver.
								return;
							}
							updateOnResize();
						}
					}, resizeTimeInterval);
				return;
			}
			is_resize = true;
			resizeTimerObj = setTimeout(function () {
					if (isSessionResizeRequired() == true) {
						if (!g.environment.receiver.isChromeApp && displayDetails.currentSetting == constants.fixed) { //suppressing resize event for fixed resolution in html receiver.
							return;
						}
						updateOnResize();
					}
				}, resizeTimeInterval);
		}

		function checkForResize(res, oldRes) {
			if (Math.abs(res.width - oldRes.width) < 2 && Math.abs(res.height - oldRes.height) < 2) {
				return false;
			}
			return true;
		}

		function isFirstTime(dataObj, previousData) {
			if (previousData.sessionSize.width == 0 || previousData.sessionSize.height == 0) {
				Utility.copyJson(previousData, dataObj);
				return true;
			}
			return false;
		}

		function updateOnResize(display) {
			var result = false;
			displayDetails.devicePixelRatio = _window.devicePixelRatio;
			updateParameterOnWindowResize();
			updateSessionSize();
			calculateSettingBasedRes();
			adjustSessionSize(displayDetails.sessionSize);
			if (typeof display != 'undefined') {
				updateChromeDisplayInfo(display);
			} else if (checkForResize(displayDetails.sessionSize, preResInfo.sessionSize) == true) {
				getSystemDisplayInfo();
			}
		}

		function getSystemDisplayInfo() {
			//update sessionSize only after displayInfo is triggered so that isUnifiedMode is valid

			if ((g.environment.receiver.isChromeApp == true) && displayDetails.useAllMyMonitors) {
				if (displayInfoTimer) {
					clearTimeout(displayInfoTimer);
					displayInfoTimer = null;
				}
				displayInfoTimer = setTimeout(function () {
						_chrome['system']['display']['getInfo'](updateChromeDisplayInfo);
					}, displayInfoInterval);
			} else {
				resizeOrDisplayInfoEvent();
			}
		}

		function resizeOrDisplayInfoEvent() {
			checkForCurrentMonitor();
			var monitorData = [];
			displayDetails.monitorCountToVDA = 1;
			Utility.makeResolutionEven(displayDetails.sessionSize);
			if (displayDetails.useAllMyMonitors && displayDetails.monitorCount > 1 && // enabled and count > 1
				(g.environment.receiver.seamlessMode || displayDetails.isFullScreen) && // enable multimonitor for seamless apps always and for desktops only in fullscreen.
				(!g.environment.receiver.isKiosk || displayDetails.isUnifiedMode)) { // we support multimonitor for kiosk mode only in unified mode. TODO: support true multimonitor mode for kiosk as well.
				displayDetails.monitorCountToVDA = displayDetails.monitorCount;
				if (g.environment.receiver.seamlessMode) {
					monitorData = multimonitorForApps();
				} else {
					monitorData = multimonitorForDesktop();
				}
			} else {
				monitorData = singleMonitor();
			}
			if (monitorData) {
				displayDetails.displayInfo = monitorData;
				Utility.makeBoundsEven(monitorData);
			}
			writeHTML5Log(0, LOGGER + 'Session displayInfo event: ' + JSON.stringify(displayDetails));
			invokeCallback(constants.sessionResize, displayDetails.sessionSize, preResInfo);
			invokeCallback(constants.displayInformation, displayDetails, preResInfo);
			console.warn('[remove][ru] resizeOrDisplayInfoEvent end ', JSON.stringify(displayDetails));
		}

		function singleMonitor() {
			writeHTML5Log(0, LOGGER + 'singleMonitor function');
			var monitorData = [];
			displayDetails.multimonitor = false;
			if (displayDetails.monitorCount > 1 && displayDetails.useAllMyMonitors) {
				setAndInvokeFullScreenCallback('multimonitor');
			}
			var sessionSizeCheck = setDisplayInfo || displayDetails.isPreferedResolution; //If session size is less that min width or min height, set displayInfo to sessionSize.
			var width = sessionSizeCheck ? displayDetails.sessionSize.width : window['innerWidth'];
			var height = sessionSizeCheck ? displayDetails.sessionSize.height : window['innerHeight'];
			monitorData.push({
				'bounds': {
					'left': 0, //for single monitor left and top should be zero and not screen['availLeft'] or screen['availTop']
					'top': 0,
					'width': width,
					'height': height
				},
				'workArea': {
					'left': 0,
					'top': 0,
					'width': width,
					'height': height
				}
			});
			setDisplayInfo = false;
			return monitorData;
		}

		function updateSessionSizeInTrueMM() {
			if (!displayDetails.isUnifiedMode) {
				displayDetails.sessionSize.width = displayDetails.boundary.right;
				displayDetails.sessionSize.height = displayDetails.boundary.bottom;
				Utility.makeResolutionEven(displayDetails.sessionSize);
			}
		}

		function multimonitorForDesktop() {
			updateSessionSizeInTrueMM();
			writeHTML5Log(0, LOGGER + 'multimonitorForDesktop function');
			var monitorData = [];
			displayDetails.isFullScreen = true;
			displayDetails.multimonitor = true;
			for (var i = 0; i < displayDetails.monitorCount; i++) {
				monitorData.push({
					'bounds': monitorLayouts[i].bounds,
					'workArea': monitorLayouts[i].workArea
				});
			}
			return monitorData;
		}

		function multimonitorForApps() {
			updateSessionSizeInTrueMM();
			writeHTML5Log(0, LOGGER + 'multimonitorForApps function');
			var monitorData = [];
			displayDetails.multimonitor = true;
			for (var i = 0; i < displayDetails.monitorCount; i++) {
				var workAreaHeight = displayDetails.isUnifiedMode ? screen['availHeight'] : monitorLayouts[i]['workArea']['height'];
				var boundsHeight = displayDetails.isUnifiedMode ? screen['availHeight'] : monitorLayouts[i]['bounds']['height'];
				monitorData.push({
					'bounds': {
						'left': monitorLayouts[i]['bounds']['left'],
						'top': monitorLayouts[i]['bounds']['top'],
						'width': monitorLayouts[i]['bounds']['width'],
						'height': boundsHeight
					},
					'workArea': {
						'left': monitorLayouts[i]['workArea']['left'],
						'top': monitorLayouts[i]['workArea']['top'],
						'width': monitorLayouts[i]['workArea']['width'],
						'height': workAreaHeight
					}
				});
			}
			return monitorData;
		}

		function calculateSettingBasedRes() {
			displayDetails.settingBasedResolution[constants.useDpr].width = Math.round(_window.devicePixelRatio * displayDetails.innerBounds.width);
			displayDetails.settingBasedResolution[constants.useDpr].height = Math.round(_window.devicePixelRatio * displayDetails.innerBounds.height);
			displayDetails.settingBasedResolution[constants.fitToWindow].width = displayDetails.innerBounds.width;
			displayDetails.settingBasedResolution[constants.fitToWindow].height = displayDetails.innerBounds.height;
		}

		function updateParameterOnWindowResize() {
			displayDetails.innerBounds.width = _window.innerWidth;
			displayDetails.innerBounds.height = _window.innerHeight;
			displayDetails.outerBounds.width = _window.outerWidth;
			displayDetails.outerBounds.height = _window.outerHeight;
		}

		function webSessionSize() {
			var currentOrientation = getCurrentWindowOrientation();
			if (g.environment.os.isTouch && (currentOrientation != orientationMode)) {
				touchdeviceSessionsize();
				orientationMode = currentOrientation;
			} else {
				displayDetails.sessionSize.width = displayDetails.innerBounds.width;
				displayDetails.sessionSize.height = displayDetails.innerBounds.height;
			}
		}

		function chromeAppSessionsize() {
			displayDetails.sessionSize.width = displayDetails.innerBounds.width;
			displayDetails.sessionSize.height = displayDetails.innerBounds.height;
		}

		function touchdeviceSessionsize() {
			if (_window.orientation != orientationMode) {
				if (_window.outerWidth) {
					var factor = _window.outerWidth / _window.innerWidth;
				} else {
					factor = _document.body.clientWidth / _window.innerWidth;
				}
				displayDetails.sessionSize.width = Math.round(_window.innerWidth * factor);
				displayDetails.sessionSize.height = Math.round(_window.innerHeight * factor);
				orientationMode = _window.orientation;
			}
		}

		function dprSessionSize() {
			displayDetails.sessionSize.width = Math.round(_window.devicePixelRatio * displayDetails.innerBounds.width);
			displayDetails.sessionSize.height = Math.round(_window.devicePixelRatio * displayDetails.innerBounds.height);
		}

		function fixedSessionsize() {
			var resolutionstr = displayDetails.prefResStr;
			var resolution = resolutionstr.split("x");
			displayDetails.sessionSize.width = parseInt(resolution[0]);
			displayDetails.sessionSize.height = parseInt(resolution[1]);
		}

		function invokeCallback(type, dataObj, previousData) {
			blockSetFun[type] = true;
			var evtInfo = {
				stopPropagation: false,
				data: dataObj,
				previousData: previousData
			};
			var bCallbacks = beforeEvtCallbacks[type];
			if (bCallbacks) {
				for (var i = 0; i < bCallbacks.length; i++) {
					bCallbacks[i].callback(evtInfo);
					if (evtInfo.stopPropagation == true) {
						Utility.copyJson(dataObj, previousData);
						break;
					}
				}
			}
			if (evtInfo.stopPropagation == false) {
				dataObj.__timestamp = timestamp();
				var callbacks = evtCallbacks[type];
				Utility.copyJson(previousData, dataObj);
				if (callbacks) {
					for (var i = 0; i < callbacks.length; i++) {
						callbacks[i].callback(evtInfo.data);
					}
				}
				callbacks = evtCallbacks[constants.registerForAll];
				if (callbacks) {
					for (var i = 0; i < callbacks.length; i++) {
						callbacks[i].callback(evtInfo.data, type);
					}
				}
			}
			blockSetFun[type] = false;
		}

		//Handles resolution change from display resolution dialog
		function onResolutionSettingChange(setting) {
			if (g.environment.receiver.isChromeApp && g.environment.receiver.seamlessMode && g.environment.receiver.isKiosk != true) {
				return;
			}
			if (setting !== displayDetails.currentSetting) {
				parseSetting(setting);
				HTML5Engine.localStorage.setItem("defaultResolutionSetting", setting);
			}
		}

		function adjustSessionSize(sessionResolution) {
			//Uses the value defined below when minwidth and minheight is undefined in configuration.js
			var minwidth = 400;
			var minheight = 300;
			if (HTML5_CONFIG && HTML5_CONFIG["ui"] && HTML5_CONFIG["ui"]["sessionsize"]) {
				var sessionSize = HTML5_CONFIG["ui"]["sessionsize"];
				if (sessionSize["minwidth"] && sessionSize["minheight"]) {
					minwidth = sessionSize["minwidth"] > 0 ? sessionSize["minwidth"] : minwidth;
					minheight = sessionSize["minheight"] > 0 ? sessionSize["minheight"] : minheight;
				}
			}
			if (sessionResolution.width < minwidth) {
				sessionResolution.width = minwidth;
				setDisplayInfo = true;

			}
			if (sessionResolution.height < minheight) {
				sessionResolution.height = minheight;
				setDisplayInfo = true;
			}
		}

		//Check if the resize of session is required based on the resolution setting
		function isResizeRequiredForNonTouchDevices() {
			var result = false;
			var max_pixel_diff_in_noresize = 2;
			var width = Math.round(_window.devicePixelRatio * _window.innerWidth);
			var height = Math.round(_window.devicePixelRatio * _window.innerHeight);
			if (HTML5Interface.window.fullscreenBtnClicked) {
				result = true;
				HTML5Interface.window.fullscreenBtnClicked = false;
			}
			// in case of Mac Safari check if there is change in window.outerWidth or window.outerHeight
			else if (g.environment.os.isMac && g.environment.browser.isSafari) {
				if ((_window.outerWidth > (displayDetails.outerBounds.width + max_pixel_diff_in_noresize)) || (_window.outerWidth < (displayDetails.outerBounds.width - max_pixel_diff_in_noresize)) || (_window.outerHeight > (displayDetails.outerBounds.height + max_pixel_diff_in_noresize)) || (_window.outerHeight < (displayDetails.outerBounds.height - max_pixel_diff_in_noresize))) {
					result = true;
				}
			} else if ((width > (displayDetails.innerBounds.width * displayDetails.devicePixelRatio + max_pixel_diff_in_noresize)) || (width < (displayDetails.innerBounds.width * displayDetails.devicePixelRatio - max_pixel_diff_in_noresize)) || (height > (displayDetails.innerBounds.height * displayDetails.devicePixelRatio + max_pixel_diff_in_noresize)) || (height < (displayDetails.innerBounds.height * displayDetails.devicePixelRatio - max_pixel_diff_in_noresize))) {
				result = true;
			}
			return result;
		}

		function isResizeRequiredForchromeApp() {
			var result = false;
			var max_pixel_diff_in_noresize = 2;
			var current = _chrome.app.window.current();
			var width = current['innerBounds'].width;
			var height = current['innerBounds'].height;
			if (current["isMinimized"]() == true) {
				result = false;
			} else if ((width > (displayDetails.innerBounds.width + max_pixel_diff_in_noresize)) || (width < (displayDetails.innerBounds.width - max_pixel_diff_in_noresize)) || (height > (displayDetails.innerBounds.height + max_pixel_diff_in_noresize)) || (height < (displayDetails.innerBounds.height - max_pixel_diff_in_noresize))) {
				result = true;
			}
			return result;
		}

		// Checking Resize requitrd in case of touch and hybrid devices
		var isResizeRequiredForTouchDevices = function () {
			var result = false;
			var max_pixel_diff_in_noresize = 2;
			var currentOrientation = getCurrentWindowOrientation();
			if (HTML5Interface.window.fullscreenBtnClicked || currentOrientation != orientationMode) {
				result = true;
				HTML5Interface.window.fullscreenBtnClicked = false;
			}
			// In case of hybrid devices (other than  Android, IOS, Windows phone) resize is required only when there is tab size change
			else if (!g.environment.os.isMobile) {
				if (pinchZoomInvoked == false) {
					var width = Math.round(_window.devicePixelRatio * _window.innerWidth);
					var height = Math.round(_window.devicePixelRatio * _window.innerHeight);
					if ((width > (displayDetails.innerBounds.width * displayDetails.devicePixelRatio + max_pixel_diff_in_noresize)) || (width < (displayDetails.innerBounds.width * displayDetails.devicePixelRatio - max_pixel_diff_in_noresize)) || (height > (displayDetails.innerBounds.height * displayDetails.devicePixelRatio + max_pixel_diff_in_noresize)) || (height < (displayDetails.innerBounds.height * displayDetails.devicePixelRatio - max_pixel_diff_in_noresize))) {
						result = true;
					}
				}
				pinchZoomInvoked = false;
			}
			return result;
		};

		//Reads and updates HTML5_CONFIG with the preferred resolution stored in localstorage. If not present then it will read from configuration.js.
		function setPreferedResolution(userPreferredResolution) {
			if (g.environment.receiver.isChromeApp && g.environment.receiver.seamlessMode && g.environment.receiver.isKiosk != true) {
				parseSetting(constants.fitToWindow);
				return;
			}
			var resolutionConfig = getResolutionConfig();
			if (resolutionConfig && userPreferredResolution != undefined && resolutionConfig["default"] != userPreferredResolution) {
				HTML5_CONFIG["ui"]["sessionsize"]["available"]["default"] = userPreferredResolution;
			}
			var setting = HTML5_CONFIG["ui"]["sessionsize"]["available"]["default"];
			parseSetting(setting);
		}

		//Gives resolution based on the setting from display resolution dialog
		function parseSetting(setting) {
			displayDetails.currentSetting = setting;
			switch (setting) {
			case constants.fitToWindow:
				displayDetails.isPreferedResolution = false;
				if (g.environment.receiver.isChromeApp && g.environment.receiver.isKiosk != true) {
					updateSessionSize = chromeAppSessionsize;
				} else {
					updateSessionSize = webSessionSize;
				}
				addResizeEventListener();
				break;
			case constants.useDpr:
				displayDetails.isPreferedResolution = true;
				updateSessionSize = dprSessionSize;
				addResizeEventListener();
				break;
			default:
				displayDetails.isPreferedResolution = true;
				updateSessionSize = fixedSessionsize;
				displayDetails.prefResStr = setting;
				displayDetails.currentSetting = constants.fixed;
				break;
			}
			updateOnResize();

		}

		/*
		 * type :-Event type
		 * cb:Callback
		 * //info is json
		 * info.id  id of callback
		 * info.callbackExecution when to  call callback
		 */
		function registerCallback(type, cb, info) {
			if (!info) {
				info = {};
				info.callbackExecution = constants.onEvtCallbacks;
			}
			if (info.callbackExecution == constants.onBeforeEvtCallbacks) {
				if (!beforeEvtCallbacks[type]) {
					beforeEvtCallbacks[type] = [];
				}
				beforeEvtCallbacks[type].push({
					id: info.id,
					callback: cb
				});
			} else {
				if (!evtCallbacks[type]) {
					evtCallbacks[type] = [];
				}
				evtCallbacks[type].push({
					id: info.id,
					callback: cb
				});
			}
		}

		//Returns the resolution related config from HTML5_CONFIG
		function getResolutionConfig() {
			if (HTML5_CONFIG && HTML5_CONFIG["ui"] && HTML5_CONFIG["ui"]["sessionsize"] && HTML5_CONFIG["ui"]["sessionsize"]["available"] && HTML5_CONFIG["ui"]["sessionsize"]["available"]["values"]) {
				return HTML5_CONFIG["ui"]["sessionsize"]["available"];
			}
		}

		function addResizeEventListener() {
			if (!listenerAdded) {
				listenerAdded = true;
				_window.addEventListener("resize", onWindowResize.bind(this), false);
			}
		}

		function removeResizeEventListener() {
			listenerAdded = false;
			_window.removeEventListener("resize", onWindowResize, false);
		}

		function updateScreenLeft(displays) {
			for (var i = 0; i < displays.length; i++) {
				prevDisplayWindowScreenLeft[i] = displays[i].workArea.left;
				prevDisplayWindowScreenHeight[i] = displays[i].workArea.height;
				screenBoundLeft[i] = displays[i].bounds.left;
				screenBoundTop[i] = displays[i].bounds.top;
			}
		}

		function updateChromeDisplayInfo(displayDevices) {
			var displays = [];
			updateScreenLeft(displayDevices);
			primaryMonitorHasChanged(displayDevices);
			/*
			// Check out which monitor the midpoint of window belongs to as sometimes window may be partially present in two monitors.
			var centerX = finalBounds.left + (finalBounds.width >> 1);
			var centerY = finalBounds.top + (finalBounds.height >> 1);
			function checkPointOnRect(x, y, rect) {
			//if ((x >= rect.left) && (x <= (rect.left + rect.width)) && (y >= rect.top) && (y <= (rect.top + rect.height))) {
			if ((Math.abs(x) >= Math.abs(rect.left)) && ((rect.left + Math.abs(x)) <=  rect.width) && (Math.abs(y) >= Math.abs(rect.top)) && ((Math.abs(y) + rect.top) <= rect.height)) {
			return true;
			}
			return false;
			}

			for (var idx = 0; idx < displayDevices.length; idx++) {
			var cur = displayDevices[idx];
			//console.log(idx,centerX,centerY);
			if (checkPointOnRect(centerX, centerY, cur['workArea']) == true) {
			display = cur;
			//console.log('idx = ',idx,display);
			break;
			}
			}*/
			displayDetails.monitorCount = displayDevices.length;
			var displayBounds = g.Utils.getUnifiedDisplayBounds(displayDevices);
			displayDetails.isUnifiedMode = displayBounds.isUnifiedMode;
			displayDetails.boundary = displayBounds.boundary;
			displayDetails.originalBounds = displayBounds.originalBounds;
			if (displayDetails.isUnifiedMode) {
				CEIP.add("multimonitor:unified", true);
			}
			if (displayDetails.originalBounds.length > 1) {
				CEIP.add("multimonitor:resolution", JSON.stringify(displayDetails.originalBounds));
				CEIP.add("multimonitor:monitorCount", displayDetails.originalBounds.length);
			}
			checkMaximizedListener();
			for (var i = 0; i < displayDevices.length; i++) {
				displays[i] = {};
				displays[i].id = displayDevices[i]['id'];
				displays[i].bounds = displayDevices[i]['bounds'];
				displays[i].workArea = displayDevices[i]['workArea'];
				displays[i].isPrimary = displayDevices[i]['isPrimary'];
			}
			checkInvokeDisplayListeners(displays, false);
		}

		function checkInvokeDisplayListeners(displayDevices, updateOnly) {
			var index;
			var hasPrimary = false;
			if (updateOnly != true) {
				monitorLayouts = [];
			}
			for (var i = 0; i < displayDevices.length; i++) {
				index = -1;
				if (!displayDevices[i].id) {
					displayDevices[i].id = i;
				}
				for (var j = 0; j < monitorLayouts.length; j++) {
					if (monitorLayouts[j] && monitorLayouts[j].id == displayDevices[i].id) {
						index = j;
						break;
					}
				}
				if (index == -1) {
					index = monitorLayouts.length;
					monitorLayouts[index] = {};
				}
				monitorLayouts[index].id = displayDevices[i].id;
				monitorLayouts[index].bounds = displayDevices[i].bounds;
				monitorLayouts[index].workArea = displayDevices[i].workArea;
				monitorLayouts[index].isPrimary = displayDevices[i].isPrimary;
				if (monitorLayouts[index].isPrimary == true) {
					hasPrimary = true;
				}
			}
			if (hasPrimary == false) {
				monitorLayouts[0].isPrimary = true;
			}
			resizeOrDisplayInfoEvent();

		}

		function calculateAutoDisplayInfo() {
			if (autoDisplayInfo == true) {
				var monitorlayout = [{
						workArea: {
							left: 0,
							top: 0,
							bottom: displayDetails.sessionSize.height,
							right: displayDetails.sessionSize.width,
						},
						bounds: {
							left: 0,
							top: 0,
							bottom: displayDetails.sessionSize.height,
							right: displayDetails.sessionSize.width,
						}
					}
				];
				checkInvokeDisplayListeners(monitorlayout, true);
				autoDisplayInfo = false;
			} else {
				checkInvokeDisplayListeners([], true);
			}
		}

		var displayInfoTimer = null;
		var displayInfoTimer1 = null;

		function onDisplayChange() {
			// screen.width/height seems to be updated after a delay during unified mode change
			if (displayInfoTimer1) {
				clearTimeout(displayInfoTimer1);
				displayInfoTimer1 = null;
			}
			displayInfoTimer1 = setTimeout(function () {
					_chrome['system']['display']['getInfo'](checkForChangeInDisplay);
				}, displayInfoInterval);
		}

		function checkForChangeInDisplay(displayInfo) {
			if (isScreenSizeChanged(displayInfo)) {
				updateOnResize(displayInfo);
				//updateChromeDisplayInfo(displayInfo);
			}
		}

		function isScreenSizeChanged(display) {
			var result = false;
			//If monitor count has changed
			if (display.length != displayDetails.monitorCount) {
				result = true;
			}
			//If primary monitor has changed
			if (primaryMonitorHasChanged(display)) {
				result = true;
			}

			// seamless workarea
			/*if (g.environment.receiver.seamlessMode) {
			for (var i = 0; i < display.length; i++) {
			if (prevDisplayWindowScreenLeft[i] != display[i].workArea.left) {
			prevDisplayWindowScreenLeft[i] = display[i].workArea.left;
			result = true;
			}
			}
			for (var i = 0; i < display.length; i++) {
			if (prevDisplayWindowScreenHeight[i] != display[i].workArea.height) {
			prevDisplayWindowScreenHeight[i] = display[i].workArea.height;
			result = true;
			}
			}
			}*/

			// bounds changed
			if (hasBoundaryChanged(display)) {
				result = true;
			}
			return result;
		}

		function hasBoundaryChanged(displays) {
			var leftBound = displays[0].bounds.left;
			var topBound = displays[0].bounds.top;
			var rightBound = (displays[0].bounds.left + displays[0].bounds.width);
			var bottomBound = (displays[0].bounds.top + displays[0].bounds.height);
			for (var i = 0; i < displays.length; i++) {
				if (leftBound > displays[i].bounds.left) {
					leftBound = displays[i].bounds.left;
				}
				if (topBound > displays[i].bounds.top) {
					topBound = displays[i].bounds.top;
				}
				if (rightBound < (displays[i].bounds.left + displays[i].bounds.width)) {
					rightBound = (displays[i].bounds.left + displays[i].bounds.width);
				}
				if (bottomBound < (displays[i].bounds.top + displays[i].bounds.height)) {
					bottomBound = (displays[i].bounds.top + displays[i].bounds.height);
				}
			}
			rightBound -= leftBound;
			bottomBound -= topBound;
			if (displayDetails.boundary.left != leftBound || displayDetails.boundary.top != topBound || displayDetails.boundary.right != rightBound || displayDetails.boundary.bottom != bottomBound) {
				return true;
			}
			return false;
		}

		function primaryMonitorHasChanged(display) {
			for (var i = 0; i < display.length; i++) {
				if (display[i]['isPrimary'] == true && (displayDetails.primaryMonitor != i)) {
					displayDetails.primaryMonitor = i;
					return true;
				}
			}
			return false;
		}

		function fullScreenListener() {
			if (g.environment.receiver.isChromeApp == true && !g.environment.receiver.isKiosk) {
				var current = _chrome['app']['window']['current']();
				if (current) {
					if (current['isMinimized']()) {
						if (displayManager) {
							displayManager.minimizeAllDisplay();
						}
						return;
					}
					displayDetails.isFullScreen = current['isFullscreen']();
					if (previousFullScreen != displayDetails.isFullScreen) {
						if (displayDetails.isFullScreen) {
							setAndInvokeFullScreenCallback('fullscreen');
						} else {
							setAndInvokeFullScreenCallback('restore');
						}
						previousFullScreen = displayDetails.isFullScreen;
						if (displayDetails.originalBounds.length > 1) { //CHeck MMconfig
							if (!displayDetails.isFullScreen && displayDetails.isPreferedResolution) {
								updateSessionSize = fixedSessionsize;
							} else {
								updateSessionSize = chromeAppSessionsize;
							}
							//updateOnResize();
						}
					}
				}
			}
		}

		function checkForCurrentMonitor() {
			if (g.environment.receiver.isChromeApp && !g.environment.receiver.isKiosk) {
				var current = _chrome.app.window.current();
				var curLeft = current['outerBounds'].left;
				var curTop = current['outerBounds'].top;
				for (var i = 0; i < displayDetails.originalBounds.length; i++) {
					if (displayDetails.originalBounds[i].left == curLeft && displayDetails.originalBounds[i].top == curTop) {
						displayDetails.currentMonitor = i;
						break;
					}
				}
			}
		}

		function addListeners() {
			if (g.environment.receiver.isChromeApp == true) {

				if (displayDetails.useAllMyMonitors) {
					writeHTML5Log(0, "RU: AddEventListener : DisplayChange");
					_chrome['system']['display']['onDisplayChanged']['addListener'](onDisplayChange);
				}

				/* Ideally all the initialization for chrome app and html5 should be done separately
				This function should just add the fullscreen listener.
				 */
				if (!g.environment.receiver.isKiosk) {
					var current = _chrome['app']['window']['current']();
					if (current) {
						if (current['onFullscreened'] && current['onRestored']) {
							current['onFullscreened']['addListener'](fullScreenListener);
							current['onRestored']['addListener'](fullScreenListener);
						}

						fullScreenListener();
						writeHTML5Log(0, "RU: AddEventListener : Fullscreen, Restore. Fullscreen state : " + displayDetails.isFullscreen);
					}
				}
			}
		}

		function setAndInvokeSessionRes(res, alwaysSend) {
			var needTosend = true;
			/*
			 * in multimonitor & seamless case it will not set size until it come from rendersurface fallback
			 */
			if (g.environment.receiver.isChromeApp && g.environment.receiver.seamlessMode && alwaysSend != true) {
				return;
			}
			if (alwaysSend == false || !alwaysSend) {
				if (displayDetails.sessionSize.width == res.width && displayDetails.sessionSize.height == res.height) {
					needTosend = false;
				}
			}
			if (needTosend == true) {
				displayDetails.sessionSize.width = res.width;
				displayDetails.sessionSize.height = res.height;
				//	updateOnResize();
				//displayDetails.isPreferedResolution = true;
				setDisplayInfo = true;
				resizeOrDisplayInfoEvent(constants.displayInformation, displayDetails, preResInfo);
			}
		}

		function setAndInvokeVdaRes(res) {
			//if (!(displayDetails.vdaRes.width == res.width && displayDetails.vdaRes.height == res.height)) {
			console.log("displayDetails.vdaRes ", displayDetails.vdaRes, res);
			displayDetails.vdaRes.width = res.width;
			displayDetails.vdaRes.height = res.height;
			invokeCallback(constants.vdaSessionSize, displayDetails.vdaRes, preResInfo.vdaRes);
			//}
		}

		function get(id, func) {
			if (id == constants.setting_based_resolution) {
				rValue = displayDetails.settingBasedResolution;
			} else if (id == constants.resolutionConfig) {
				rValue = getResolutionConfig();
			} else if (id == constants.sessionResize) {
				rValue = displayDetails.sessionSize;
			} else if (id == constants.vdaSessionSize) {
				rValue = displayDetails.vdaRes;
			} else if (id == constants.fullScreen) {
				if (!displayDetails.multimonitor && displayDetails.monitorCount > 1 && displayDetails.useAllMyMonitors) {
					rValue = 'multimonitor';
				} else if (displayDetails.isFullScreen) {
					rValue = 'fullscreen';
				} else {
					rValue = 'restore';
				}
			} else if (id == constants.displayInformation) {
				rValue = displayDetails;
			}
			if (func) {
				func(rValue);
			}
			return rValue;
		}

		function setpinchZoomInvoked(value) {
			pinchZoomInvoked = value;
		}

		/*
		 * id == constants.displayInfo
		 *  value ={
		 *      displayInfo = [{
		 *              id : optional if not defined index will be id
		bounds : {width,height}
		workArea : {left,top,width,height}
		isPrimary : optional,by default index = 0 will be primary
		 *      }]
		 *      updateOnly: if true it update existing  monitor info otherwise it will remove previous monitor entry
		 *  }
		 */

		/*
		 * id == constants.sessionResize
		 *  value ={
		 *    width,height
		 *  }
		 */

		/*
		 * id == constants.vdaSessionSize
		 * Not for user to set
		 *  value ={
		 *      width,height
		 *  }
		 */
		/*
		 * id == constants.preferredResolution
		 * value = set resolution, value type string(widthxheight or "1024x1024")
		 */
		function set(id, value) {
			if (blockSetFun[id] == true) {
				return;
			}
			if (id == constants.autoResize) {
				if (value == true) {
					addResizeEventListener();
					parseSetting(constants.fitToWindow);
				} else {
					removeResizeEventListener();
					displayDetails.currentSetting = constants.fixed;
				}
			} else if (id == constants.autoDisplayInfo) {
				autoDisplayInfo = value;
				calculateAutoDisplayInfo();
			} else if (id == constants.sessionResize) {
				setAndInvokeSessionRes(value, value.alwaysSend);
			} else if (id == constants.setting_based_resolution) {
				onResolutionSettingChange(value);
			} else if (id == constants.vdaSessionSize) {
				setAndInvokeVdaRes(value);
			} else if (id == constants.pinchZoomInvoked) {
				setpinchZoomInvoked(value.pinchZoomInvoked);
			} else if (id == constants.fullScreen) {
				setAndInvokeFullScreenCallback(value);
			} else if (id == constants.displayWindowsUpdated) {
				invokeCallback(constants.displayWindowsUpdated, value);
			}
		}

		function setAndInvokeFullScreenCallback(value) {
			if (value == 'fullscreen') {
				displayDetails.isFullScreen = true;
			} else if (value == 'restore') {
				displayDetails.isFullScreen = false;
			}
			if (value != 'multimonitor') {
				if (g.environment.receiver.isChromeApp == true && g.environment.receiver.isKiosk != true && !g.environment.receiver.seamlessMode) {
					_chrome.storage.local.set({
						'fullscreen': displayDetails.isFullScreen
					});
				}
			}
			var returnString = value;
			invokeCallback(constants.fullScreen, returnString);
		}

		function setFullScreen(value) {
			if (value == "fullscreen") {
				displayDetails.isFullScreen = true;
			} else if (value == "restore") {
				displayDetails.isFullScreen = false;
			}
			if (g.environment.receiver.isChromeApp == true && g.environment.receiver.isKiosk != true && !g.environment.receiver.seamlessMode) {
				_chrome.storage.local.set({
					'fullscreen': displayDetails.isFullScreen
				});
			}
		}

		/*Unified desktop mode -
		Desktop sessions are launched in primary monitor resolution and clicking on maximized button makes session to go to fullscreen
		and exiting from fullscreen would restore back to primary monitor resolution*/
		function checkMaximizedListener() {
			if (g.environment.receiver.isChromeApp == true && !g.environment.receiver.isKiosk && !g.environment.receiver.seamlessMode) {
				var current = _chrome['app']['window']['current']();
				if (displayDetails.isUnifiedMode) {
					if (current['isMaximized']()) {
						maximizeToFullscreen = !maximizeToFullscreen;
						(maximizeToFullscreen) ? current.fullscreen() : current.restore();
					}
				} else {
					maximizeToFullscreen = false;
				}
			}
		}

		function init(displayInfo, prefRes, multiMonitorPref) {
			// Set useAllMyMonitors to true only if enabled in configuration. This configuration itself will be available only for
			// chrome. For HTML5 the configuration will not be available.
			//
			if (HTML5_CONFIG && HTML5_CONFIG['features'] && HTML5_CONFIG['features']['graphics'] && HTML5_CONFIG['features']['graphics']['multiMonitor'] &&
				HTML5_CONFIG['features']['graphics']['multiMonitor'] === true) {
				displayDetails.useAllMyMonitors = true;
			}

			// Override the useAllMyMonitors field based on local pref only if it is
			//	enabled in configuration
			if (displayDetails.useAllMyMonitors && (typeof multiMonitorPref === "boolean")) {
				displayDetails.useAllMyMonitors = multiMonitorPref;
			}

			preResInfo = Utility.copyJson(null, displayDetails);
			isSessionResizeRequired = assignResizeCheckMethod();
			orientationMode = getCurrentWindowOrientation();
			timestamp = HTML5Interface.timeStamp();
			if (typeof _window != 'undefined') {
				addListeners();
				addResizeEventListener();
				if (typeof prefRes == 'undefined' || prefRes == constants.fitToWindow) {
					if (!g.environment.receiver.isChromeApp) {
						var defaultRes = HTML5_CONFIG && HTML5_CONFIG['ui'] && HTML5_CONFIG['ui']['sessionsize'] && HTML5_CONFIG['ui']['sessionsize']['available'] && HTML5_CONFIG['ui']['sessionsize']['available']["default"];
						parseSetting(defaultRes);
					} else {
						updateOnResize(displayInfo);
					}
				} else {
					setPreferedResolution(prefRes);
				}
			}
		}

		return {
			registerCallback: registerCallback,
			get: get,
			set: set,
			init: init,
			constants: constants

		};
	});

	var _ResolutionUtility = (function () {
		var getNewInstance = function (mockObj) {
			if (mockObj && mockObj.window) {
				_window = mockObj.window;
			}
			if (mockObj && mockObj.chrome) {
				_chrome = mockObj.chrome;
			}
			if (mockObj && mockObj.document) {
				_document = mockObj.document;
			}
			return ResolutionUtility();
		};

		var resObject = ResolutionUtility();
		resObject.getNewInstance = getNewInstance;
		return resObject;
	});
	UiControls.ResolutionUtility = (dependency && dependency.testEnv === true) ? _ResolutionUtility() : ResolutionUtility();

})(UiControls || (UiControls = {}));
