/**
 * Created by rajasekarp on 14-08-2015.
 */
var SeamlessUI;

(function(SeamlessUI) {
    var VirtualWindows = (function() {
        var virtualWindowPresenter;
        var myself;
        var uiManager;
        var windowFrame;
        var overlayOnWindowDragActivity;
        var virtualMonitorDragActivity;
        var enableVirtualMonitor = false;
        var displayWindows;

        function VirtualWindows() {
            myself = this;
        }

        var initialized = false;
        var seamlessDiv;

        VirtualWindows.prototype.init = function(_uiManager) {
            HTML5Interface.window.addEventListener("focus", onWindowFocus.bind(this));
            HTML5Interface.window.addEventListener("blur", onWindowBlur.bind(this));

            virtualWindowPresenter = dependency.resolve(SeamlessUI, 'VirtualWindowPresenter');
             windowFrame = new SeamlessUI.WindowFrame(dragStart,checkIfMaximize);

            uiManager = _uiManager;
            if (!initialized) {
				chrome.runtime.getBackgroundPage(function(bg) {
					bg.asyncObjects.get('object.proxyWindows', function(proxyWindows) {
						virtualMonitorDragActivity = proxyWindows.vMonitorActivity;
					});
					bg.asyncObjects.get('object.overlayWindow', function(overlayWindow) {
						overlayOnWindowDragActivity = overlayWindow;
					});
                });
                window.addEventListener('mouseup', onMouseUp, false);
                window.addEventListener('mousemove', onMouseMove, false);
                window.addEventListener('mousedown', onMouseDown, false);
                // To attach mouse events on other secondary display windows, listen to on displayWindowsUpdated events
                UiControls.ResolutionUtility.registerCallback(UiControls.ResolutionUtility.constants.displayWindowsUpdated,attachMouseEvtHandlersToSecondaryWindows);  
                UiControls.ResolutionUtility.registerCallback(UiControls.ResolutionUtility.constants.displayWindowsUpdated,attachFocusBlurEvtHandlersToSecondaryWindows);
                windowFrame.init();
                initialized = true;
            }
        };
		
        function attachMouseEvtHandlersToSecondaryWindows() {
          if (displayManager) {
            displayWindows = displayManager.getSecondaryWindowHandles();
          }
          if(displayWindows){
            for(var i in displayWindows){
              var appWindow = displayWindows[i];
              appWindow.contentWindow.addEventListener('mouseup', onMouseUp, false);
              appWindow.contentWindow.addEventListener('mousemove', onMouseMove, false);
              appWindow.contentWindow.addEventListener('mousedown', onMouseDown, false);
            }
          }
        }
        
        function attachFocusBlurEvtHandlersToSecondaryWindows()
        {
          if (displayManager) {
            displayWindows = displayManager.getSecondaryWindowHandles();
          }
          if(displayWindows){
            for(var i in displayWindows){
              var appWindow = displayWindows[i];
              appWindow.contentWindow.addEventListener("focus", onWindowFocusForDisplayWnd, false);
              appWindow.contentWindow.addEventListener("blur", onWindowBlurForDisplayWnd, false);
            }
          }
        }

        function createForDisplayWindows(message) {
            var bounds = message.position;
            var appWindow;
            var isBoundsPresent;
            var numDisplays = 1;
            if (displayManager) {
                displayWindows = displayManager.getDisplayWindows();
                numDisplays = displayManager.getActiveDisplayCount() || numDisplays;
            }
            for(var i in displayWindows){
                appWindow = displayWindows[i];
                var appBounds = appWindow['innerBounds'];
                if(numDisplays > 1){
                  appBounds = appWindow['serverBounds'] || appWindow['innerBounds'];
                }
                var windowBounds = {
                    'left': appBounds['left'],
                    'top': appBounds['top'],
                    'width': appBounds['width'],
                    'height': appBounds['height']
                };
                bounds = Utility.convertRectToScreenCoordinates(message.position);
                bounds = Utility.convertBoundsToRect(bounds);
                isBoundsPresent = Utility.checkIfRectPresentInMonitor(bounds, windowBounds);
                if (isBoundsPresent) {
                    message.WinId = appWindow.id;
                    windowFrame.create(message, windowBounds);
                }
            }
        }
        VirtualWindows.prototype.create = function(message) {
            var id = message.appId;
            if (message.clientWindow == undefined) {
                createForDisplayWindows(message);
            }
            virtualWindowPresenter.create(id, message.position,message.clientWindow);
        };

        function onWindowFocus(e) {
            if (!dragging) {
                var data = {};
                data.cmd = "action";
                data.action = 'focussession';
                data.attributes = {};
                uiManager.dispatch(data);
            }
        }

        function processWindowBlur() {
            if (!dragging && !displayManager.isSecondaryWindowFocussed()) {
                var data = {};
                data.cmd = "action";
                data.action = 'blursession';
				data.bTimeStamp = false;
                data.attributes = {};
                uiManager.dispatch(data);
            }
        }

        function onWindowBlur(e) {
          if (!dragging)
          {
                var data = {};
                data.cmd = "action";
                data.action = 'blursession';
                data.bTimeStamp = true;
                data.attributes = {};
                uiManager.dispatch(data);
          }
            // process blur event only when all other display windows are also in blur state, 
            // so waiting for 50ms before checking all other windows are blurred or not and then process blur
            setTimeout(function() {
                processWindowBlur();
            }, 300);
        }

       function onWindowFocusForDisplayWnd(e) {
            onWindowFocus(e);
        }
        function onWindowBlurForDisplayWnd(e) {
          if (!dragging)
          {
                var data = {};
                data.cmd = "action";
                data.action = 'blursession';
                data.bTimeStamp = true;
                data.attributes = {};
                uiManager.dispatch(data);
          }
            // process blur event only when all other display windows are also in blur state,
            // so waiting for 50ms before checking all other windows are blurred or not and then process blur
            setTimeout(function() {
                processWindowBlur();
            }, 300);
            
        }
        var clicked = {};
        var dragging = false;

        function onMouseDown(e) {
            clicked.e = e;
        }

        function onMouseUp(e) {
            if (dragging) {
              var numDisplays = 1;
              if (displayManager) {
                numDisplays = displayManager.getActiveDisplayCount() || numDisplays;
              }
                if(numDisplays > 1){
                overlayOnWindowDragActivity.stop(update, e, onChangePosition);
            }
                else{
                  virtualMonitorDragActivity.stop(update, e, onChangePosition);
                }
            HTML5Interface.window.focus();
            HTML5Interface.setKeyboardFocus();
            windowFrame && windowFrame.setDragEnd(true);
            dragging = false;
            clicked = {};
            }
        }

        function onMouseMove(e) {
            if (dragging) {
              var numDisplays = 1;
              if (displayManager) {
                numDisplays = displayManager.getActiveDisplayCount() || numDisplays;
              }
              if(numDisplays > 1){
                overlayOnWindowDragActivity.update(e);
            }
              else{
                virtualMonitorDragActivity.update(e);
              }
                
            }
        }

        function checkDisabled(window_info) {
            var data = {};
            var disabled = false;
            data.cmd = "checkDisabled";
            data.attributes = {};
            data.window_info = window_info;
            uiManager.dispatch(data);
            if (data.retDisabled)
                disabled = data.retDisabled;
            return disabled;
        }
      function checkIfMaximize(event)
		  {
		  var ids = event.srcElement.id.split('-');
      windowId = ids[0];
      appDiv = event.target.ownerDocument.getElementById(windowId);
      var window_info = appDiv.window_info;
			var data = { };
			var isMaximize = false;
			data.cmd = "checkIfMaximize";
			data.attributes = { };
			data.window_info = window_info;
			uiManager.dispatch(data);
			if(data.retIsMaximize)
				isMaximize = data.retIsMaximize;
			return isMaximize;
		}
        function dragStart(event) {

            var ids = event.srcElement.id.split('-');
            event.preventDefault();
            var windowId = ids[0];
            var appDiv = event.target.ownerDocument.getElementById(windowId);
            var appWindow = appDiv.appWindow;

            if (checkDisabled(appDiv.window_info)) {
                return;
            }

            dragging = true;
            var bounds = appDiv.originalAppBounds;
            clicked.window_info = appDiv.window_info;

            if (clicked) {
                clicked.id = windowId;
                clicked.bounds = {
                    top: bounds.top,
                    left: bounds.left,
                    width: bounds.width,
                    height: bounds.height
                };
                clicked.srcDiv = ids[1];

                // If multiple display windows are in use then overlay window can
                // be dragged acrocss the displays else prevent it within the primary
                // session display
                // 
                var numDisplays = 1;
                if (displayManager) {
                    numDisplays = displayManager.getActiveDisplayCount() || numDisplays;
                    displayWindows = displayManager.getDisplayWindows();
                }
                if(numDisplays > 1){
                overlayOnWindowDragActivity.start(clicked, appWindow['outerBounds'], numDisplays, displayWindows);
                }
                else{
                  virtualMonitorDragActivity.start(clicked, appWindow['outerBounds'], numDisplays, displayWindows);
                }
            }
        }

        function update(window_info, bounds) {
            var slMessage = new SeamlessUI.Message();
            slMessage.windowInfo = window_info;
            bounds = Utility.convertRectToVdaCoordinates(bounds);
            slMessage.position = bounds;
            slMessage.cmd = 'update';
            uiManager.dispatch(slMessage.message);
        }

        function onChangePosition(bounds) {
            var current = chrome.app.window.current();
            var finalBounds = current['outerBounds'];
            finalBounds.left = bounds.left;
            finalBounds.top = bounds.top;
            finalBounds.width = bounds.width;
            finalBounds.height = bounds.height;
        }

        function updateForDisplayWindows(message) {
            var bounds = message.position;
            var appWindow;
            var isBoundsPresent;
            var numDisplays = 1;
            if (displayManager) {
                displayWindows = displayManager.getDisplayWindows();
                numDisplays = displayManager.getActiveDisplayCount() || numDisplays;
            }
            for (var i in displayWindows) {
                appWindow = displayWindows[i];
                var appBounds = appWindow['innerBounds'];
                if(numDisplays > 1){
                  appBounds = appWindow['serverBounds'] || appWindow['innerBounds'];
                }
                var windowBounds = {
                    'left': appBounds['left'],
                    'top': appBounds['top'],
                    'width': appBounds['width'],
                    'height': appBounds['height']
                };
                bounds = Utility.convertRectToScreenCoordinates(message.position);
                bounds = Utility.convertBoundsToRect(bounds);
                isBoundsPresent = Utility.checkIfRectPresentInMonitor(bounds, windowBounds);
                if (isBoundsPresent) {
                    message.WinId = appWindow.id;
                    windowFrame.update(message, windowBounds);
                }
            }
        }

        VirtualWindows.prototype.update = function(message) {
            var id = message.appId;
            var bounds = message.position;
            if (message.clientWindow == undefined) {
                updateForDisplayWindows(message);
            }
            if (bounds.height == undefined || null == bounds.height) {
                bounds.height = bounds.bottom - bounds.top;
                bounds.width = bounds.right - bounds.left;
            }
            virtualWindowPresenter.update(id, {
                left: bounds.left,
                top: bounds.top,
                height: bounds.height,
                width: bounds.width
            },message.clientWindow);
        };

        VirtualWindows.prototype.close = function(message) {
            if (message.clientWindow == undefined) {
              windowFrame.close(message.appId);
            }
            virtualWindowPresenter.close(message.appId,message.clientWindow);
        };

        VirtualWindows.prototype.focus = function(windowInfo) {
            var appWindow;
            var isBoundsPresent;
            var numDisplays = 1;
            if (displayManager) {
                displayWindows = displayManager.getDisplayWindows();
                numDisplays = displayManager.getActiveDisplayCount() || numDisplays;
            }
            for (var i in displayWindows) {
                appWindow = displayWindows[i];
                var appBounds = appWindow['innerBounds'];
                if(numDisplays > 1){
                  appBounds = appWindow['serverBounds'] || appWindow['innerBounds'];
                }
                var windowBounds = {
                    'left': appBounds['left'],
                    'top': appBounds['top'],
                    'width': appBounds['width'],
                    'height': appBounds['height']
                };
                var bounds;
                var boundsToFocus = {left: windowInfo.bounds.left , top: windowInfo.bounds.top , width : (windowInfo.bounds.right - windowInfo.bounds.left), height : (windowInfo.bounds.bottom - windowInfo.bounds.top) };
                bounds = Utility.convertRectToScreenCoordinates(boundsToFocus);
                bounds = Utility.convertBoundsToRect(bounds);
                isBoundsPresent = Utility.checkIfRectPresentInMonitor(bounds, windowBounds);
                if (isBoundsPresent) {
                    if (!dragging) {
                        HTML5Interface.window.focus(appWindow);
                    }
                    if (!checkDisabled(windowInfo)) {
                        windowFrame.focus(windowInfo, appWindow);
                    }
                }
            }
        };

        VirtualWindows.prototype.unFocus = function(windowInfo) {
            var appWindow;
            var isBoundsPresent;
            var numDisplays = 1;
            if (displayManager) {
                displayWindows = displayManager.getDisplayWindows();
                numDisplays = displayManager.getActiveDisplayCount() || numDisplays;
            }
            for (var i in displayWindows) {
                appWindow = displayWindows[i];
                var appBounds = appWindow['innerBounds'];
                if(numDisplays > 1){
                  appBounds = appWindow['serverBounds'] || appWindow['innerBounds'];
                }
                var windowBounds = {
                    'left': appBounds['left'],
                    'top': appBounds['top'],
                    'width': appBounds['width'],
                    'height': appBounds['height']
                };
                var bounds = Utility.convertRectToScreenCoordinates(windowInfo.bounds);
                isBoundsPresent = Utility.checkIfRectPresentInMonitor(bounds, windowBounds);
                if (isBoundsPresent) {
                    windowFrame.unFocus(windowInfo, appWindow);
                }
            }
        };
        VirtualWindows.prototype.reset = function() {
            virtualWindowPresenter.resetRects();
        };

        return VirtualWindows;
    })();

    var SimpleRectCutWindow = function() {
        var virtualWindowPresenter;

        function SimpleRectCutWindow() {
            console.log("Creating simple rect cut window");
        }

        SimpleRectCutWindow.prototype.init = function() {
            virtualWindowPresenter = dependency.resolve(SeamlessUI, 'VirtualWindowPresenter');
        };

        SimpleRectCutWindow.prototype.create = function(message) {
            virtualWindowPresenter.create(message.appId, message.position);
        };

        SimpleRectCutWindow.prototype.update = function(message) {
            var bounds = message.position;

            virtualWindowPresenter.update(message.appId, {
                left: bounds.left,
                top: bounds.top,
                height: bounds.height,
                width: bounds.width
            });
        };

        SimpleRectCutWindow.prototype.close = function(message) {
            virtualWindowPresenter.close(message.appId);
        };

        SimpleRectCutWindow.prototype.focus = function(message) {

        };

        return SimpleRectCutWindow;
    }();

    SeamlessUI['VirtualWindow'] = VirtualWindows;
    SeamlessUI['SimpleRectCutWindow'] = SimpleRectCutWindow;
    SeamlessUI.name = 'SeamlessUI';
})(SeamlessUI || (SeamlessUI = {}));