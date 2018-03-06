/**
 * Created by rajasekarp on 17-12-2015.
 */


var SeamlessUI;

(function (SeamlessUI) {
	var WindowFrame = function() {
		var decorationMap = {
			cornerLT: {
				cursor: "nwse-resize",
				type: "corner",
				color: "blue",
				idStr:"cornerLT",
                adjustRect : (function() {
                    var reduced = 10;
                    
                    function getAdjustedBounds(bounds) {
                       var newBounds = {};                        
                       newBounds.left = bounds.left;
                       newBounds.width = reduced;
                       newBounds.height = reduced;
                       newBounds.top = bounds.top;
                       return newBounds;        
                    }
                    
                    return {
                        reduced : reduced,
                        getAdjustedBounds : getAdjustedBounds
                    };
                })()       
			},
			cornerRT : {
				cursor:"nesw-resize",
				type:"corner",
				color: "green",
				idStr: "cornerRT",
                adjustRect : (function() {
                    var reduced = 5;
                    
                    function getAdjustedBounds(bounds) {
                       var newBounds = {};                        
                       newBounds.left = bounds.left + (bounds.width - reduced);
                       newBounds.width = reduced;
                       newBounds.height = reduced;
                       newBounds.top = bounds.top;
                       return newBounds;     
                    }
                                        
                    return {
                        reduced : reduced,
                        getAdjustedBounds : getAdjustedBounds
                    };
                })()            
			},
			cornerLB : {
				cursor:"nesw-resize",
				type: "corner",
				color: "gray",
				idStr : "cornerLB"
			},
			cornerRB : {
				cursor:"nwse-resize",
				type:"corner",
				color: "ivory",
				idStr : "cornerRB"
			},
			sideTop :{
				cursor:"ns-resize",
				type:"side",
				color: "lightgreen",
				idStr : "sideTop"
			},
			sideLeft : {
				cursor:"ew-resize",
				type:"side",
				color: "black",
				idStr: "sideLeft"
			},
			sideRight : {
				cursor:"ew-resize",
				type: "side",
				color: "red",
				idStr : "sideRight"

			},
			sideBottom : {
				cursor:"ns-resize",
				type:"side",
				color: "violet",
				idStr: "sideBottom"

			},
			captionRect : {
				type: "title",
				color: "orange",
				idStr : "captionRect"
			}
		};

		var parentDiv;
		var multiDiv;
		var dragStartFn;
		var chkIfMax;

		var mousePointerDiv;
		var dragProgress = false;
		var currentFocused = null;
		function WindowFrame(_dragStart,_checkIfMaximize){
			dragStartFn = _dragStart;
			chkIfMax = _checkIfMaximize;
		}

		function dragStart(event) {
		  if (!chkIfMax(event)) {
			dragProgress = true;
			return dragStartFn(event);
		  }
		  event.preventDefault();
		}

		function dragLeave(event) {
			dragProgress = false;
		}


		var canvasDoc;
		WindowFrame.prototype.init = function () {
			parentDiv = document.getElementById('seamlessui');
			multiDiv = document.getElementById('multiDiv');
			canvasDoc = document.getElementById('CitrixSuperRenderCanvas');
		};
        
        WindowFrame.prototype.setDragEnd = function (isTrue) {
            dragProgress = !isTrue;
        };
        function redirect(eventObject) {
			  var appWindow = eventObject["appWindow"];
			  var event = eventObject.event;
				var eventObj = {
					returnValue: event.returnValue,
					clientX: event.clientX + appWindow["outerBounds"]["left"],
					clientY: event.clientY + appWindow["outerBounds"]["top"],
					type: event.type,
					wheelDelta: event.wheelDelta,
					button: event.button,
                    touches: event.touches,
                    timestamp: event.timestamp,
                    changedTouches: event.changedTouches,
					ctrlKey: event.ctrlKey,
					metaKey: event.metaKey,
					shiftKey: event.shiftKey,
					altKey: event.altKey
                };
        if(event.type == "mousedown")
        {
          var isMax = chkIfMax(event);
        }
        canvasDoc.inputEvt(eventObj,isMax);
			}

		function redirectEvents(appDiv) {
			if (appDiv) {
				appDiv.addEventListener('touchstart',redirectHandler, false);
				appDiv.addEventListener('touchend',redirectHandler, false);
				appDiv.addEventListener('touchmove',redirectHandler, false);
				appDiv.addEventListener('mousedown',redirectHandler, false);
				appDiv.addEventListener('mouseup',redirectHandler, false);
				appDiv.addEventListener('mousemove',redirectHandler, false);
				appDiv.addEventListener('mouseout',redirectHandler, false);
				appDiv.addEventListener('mouseover',redirectHandler, false);
				appDiv.addEventListener('mousewheel',redirectHandler, false);
				appDiv.addEventListener('contextmenu',function (evt) {
					return false;
				}, false);
				appDiv.addEventListener('selectstart',function (evt) {
					return false;
				}, false);
				
				//Redirecting the file drag and drop handlers.
				var bb = GetBrowserBox();
				appDiv.addEventListener('dragover',bb.fileDragOverHandler,false);
				appDiv.addEventListener('drop',bb.fileDropHandler,false);
			}
		}

		function redirectHandler(event) {
			// Pass all the event properties that are used by session here
			  var appWindow = event.currentTarget.appWindow;

		  if(event.type == "mouseup" || event.type == "mousedown" || event.type == "mouseout" || !dragProgress )
			 redirect({'event' : event, 'appWindow' : appWindow});
		}

		function setAppDivBounds(appDiv, message, monitorBounds) {
			if(appDiv) {
				appDiv.style.resize = "both";
				var bounds = Utility.convertRectToScreenCoordinates(message.position);
				bounds = Utility.convertBoundsToRect(bounds);
				monitorBounds = Utility.convertBoundsToRect(monitorBounds);
				var boundsIntersection = Utility.getWindowIntersection(bounds,monitorBounds);
				if(boundsIntersection){
					boundsIntersection = Utility.convertValueRelativeToWindow(boundsIntersection,monitorBounds);
				}
				SeamlessUI.Utils.setBounds(appDiv, boundsIntersection);
				var appBounds = Utility.convertRectToScreenCoordinates(message.position);
				appBounds = Utility.convertValueRelativeToWindow(appBounds,monitorBounds);
				appDiv.appBounds = boundsIntersection;
			  appDiv.originalAppBounds = appBounds;
				appDiv.window_info = message.windowInfo;
			}
		}
    
		function createDecorDiv(parent, decor, message, appWindow, monitorBounds) {
			var boundsToSet = message.decoration[decor];
			boundsToSet = Utility.convertRectToScreenCoordinates(boundsToSet);
			boundsToSet = Utility.convertBoundsToRect(boundsToSet);
			monitorBounds = Utility.convertBoundsToRect(monitorBounds);
			var boundsIntersection = Utility.getWindowIntersection(boundsToSet,monitorBounds);
			if(boundsIntersection == null){
				return;
			}
			else{
				boundsIntersection = Utility.convertValueRelativeToWindow(boundsIntersection,monitorBounds);
				var decorDiv = appWindow.contentWindow.document.createElement('div');
				var decorStr = decorationMap[decor].idStr;
				parent.appendChild(decorDiv);
				decorDiv.style.position = "absolute";
				parent.decoration[decorStr] = decorDiv;
				if(decorationMap[decor].adjustRect !== undefined) { 
					boundsToSet = decorationMap[decor].adjustRect.getAdjustedBounds(boundsIntersection);
				}
            
				SeamlessUI.Utils.setRelativeBounds(decorDiv, parent, boundsIntersection);
				decorDiv.draggable = "true";
				decorDiv.id = parent.id + '-' + decorStr;
				decorDiv.addEventListener('dragstart',dragStart, false);
				decorDiv.addEventListener('dragend',dragLeave, false);
				decorDiv.addEventListener('mouseup',function () {
					dragProgress = false;
				}, false);

				decorDiv.style.visibility = "visible";
				if(decorationMap[decor].cursor) {
					decorDiv.style.cursor = decorationMap[decor].cursor;
				}
			}
		}
		
		WindowFrame.prototype.create = function(message, monitorBounds) {
			var appWindow = chrome.app.window.get(message.WinId);
			parentDiv = appWindow.contentWindow.document.getElementById('seamlessui');
			multiDiv = appWindow.contentWindow.document.getElementById('multiDiv');
			if(!multiDiv){
				var multiDiv = appWindow.contentWindow.document.createElement('div');
				multiDiv.id = "multiDiv";
				multiDiv.style.position = 'absolute';
				multiDiv.style.overflow = 'hidden';
				multiDiv.style.top = 0;//50 + 'px';
				multiDiv.style.left = 0;//50 + 'px';
				multiDiv.style.width = appWindow['innerBounds']['width'] + 'px';
				multiDiv.style.height = appWindow['innerBounds']['height'] + 'px';
				multiDiv.style.zIndex = 8;
				appWindow.contentWindow.document.getElementById('CitrixXtcRoot').appendChild(multiDiv);
			}
			if(!parentDiv){
				parentDiv = appWindow.contentWindow.document.createElement('div');
				parentDiv.id = "seamlessui";
				parentDiv.style.position = "absolute";
				parentDiv.style.zIndex = 9;
				parentDiv.style.overflow = "hidden";
				parentDiv.style.top = "0px";
				parentDiv.style.left = "0px";
				parentDiv.style.width = "100%";
				parentDiv.style.height = "100%";
				multiDiv.appendChild(parentDiv);
			}
			var appDiv = appWindow.contentWindow.document.getElementById(message.appId);
			// if appDiv is already present then remove old one and create it again
			if(appDiv) {
				this.close(message.appId);
			}
			appDiv = appWindow.contentWindow.document.createElement('div');
			appDiv.appWindow = appWindow;
			appDiv.id = message.appId;
			appDiv.style.position = "absolute";
            appDiv.style.zIndex = 9;
			if(currentFocused == null){
				appDiv.style.zIndex = 10;
			    currentFocused = appDiv;
			}
			setAppDivBounds(appDiv, message, monitorBounds);

			redirectEvents(appDiv);
			parentDiv.appendChild(appDiv);
			appDiv.decoration = {};

			if(message.decoration) {
				Object.keys(message.decoration).forEach(function(decor) {
				  if(message.decoration[decor]) {
					createDecorDiv(appDiv, decor, message, appWindow, monitorBounds);
				  }
				});
			}
		};

		WindowFrame.prototype.focus = function(windowInfo, appWindow) {
			
			if(currentFocused.appWindow == appWindow){
				if(currentFocused.id == windowInfo.appId) 
					return;
				else {
					currentFocused.style.zIndex = 9;				
				}
			}
			
			var appDiv = appWindow.contentWindow.document.getElementById(windowInfo.appId);
			if(appDiv) {
				appDiv.style.zIndex = 10;
				currentFocused = appDiv;
			}

		};

		WindowFrame.prototype.unFocus = function(windowInfo) {
		  
			var appDiv = document.getElementById(windowInfo.appId);
			appDiv = currentFocused;
			if(appDiv) {
				appDiv.style.zIndex = 8;
			}
		};

		WindowFrame.prototype.update = function(message, monitorBounds) {
			var appWindow = chrome.app.window.get(message.WinId);
			var appDiv = appWindow.contentWindow.document.getElementById(message.appId);
			if(!appDiv) {
				this.create(message, monitorBounds);
				return;
			}
			setAppDivBounds(appDiv, message, monitorBounds);
			Object.keys(decorationMap).forEach(function (decor) {
				var decorStr = decorationMap[decor].idStr;
				var decorDiv = appDiv.decoration[decorStr];
				if(message.decoration && message.decoration[decor]) {
                    var boundsToSet = message.decoration[decor];
          			boundsToSet = Utility.convertRectToScreenCoordinates(boundsToSet);
					boundsToSet = Utility.convertBoundsToRect(boundsToSet);
					var monitorBounds1 = Utility.convertBoundsToRect(monitorBounds);
					boundsToSet = Utility.getWindowIntersection(boundsToSet,monitorBounds1);
					if(boundsToSet) {
						boundsToSet = Utility.convertValueRelativeToWindow(boundsToSet,monitorBounds);
						if (decorDiv) {
							if(decorationMap[decor].adjustRect !== undefined) { 
								boundsToSet = decorationMap[decor].adjustRect.getAdjustedBounds(boundsToSet);                    
							}
							SeamlessUI.Utils.setRelativeBounds(decorDiv, appDiv,  boundsToSet);                        
							decorDiv.style.visibility = "visible";
						} else if (decorDiv) {
							decorDiv.style.visibility = "hidden";
						} else if (message.decoration[decor]) {
							createDecorDiv(appDiv,  decor, message, appWindow, monitorBounds);
						}
					}else {
						if(decorDiv)
							decorDiv.style.visibility = "hidden";
					}
				}		
			});
		};

		WindowFrame.prototype.close = function (appId) {
		  var displayWindows;
		  if (displayManager) {
          displayWindows = displayManager.getDisplayWindows();
      }
      for (var i in displayWindows) {
          var appDiv = displayWindows[i].contentWindow.document.getElementById(appId);
			if(appDiv) {
			  var parent = appDiv.parentNode;
			  parent.removeChild(appDiv);
			}
      }
		};

		return WindowFrame;
	}();

	SeamlessUI.WindowFrame = WindowFrame;
})(SeamlessUI || (SeamlessUI = {}));