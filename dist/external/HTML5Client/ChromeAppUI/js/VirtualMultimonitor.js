/**
 * Object to shift session to different monitor.
 * UI is shown on a monitor using ProxyWindows when mouse enters new monitor
 * Overlay is monitored during drag and switched when it is dropped on the UI
 * 
*/

var virtualMonitorActivity = function() {
  var sessionbounds = {};
	var sessionDisplayDeviceId;
	var currentDropWindowId;
	var initialized = false;
	var overlayObj;
	var displayDevices;
	var disPlayDevicescenterPoints = [];
	var dropAreaBound;
	var proxyWindow;
	var overlayWindow;
	var isDropWinHidden = true;
	var isPointerInOtherMonitor = false;
	
	// UI shown on ProxyWindows for switching monitor
	var dropArea = {
		bounds : {
			height : 396,
			width : 396,
			left : 0,
			top : 0
		},
		id : 'droparea',
		windowWidth : 400,
		windowHeight : 400
	};

  // Overlay adjusted when mouse is in different monitor from session
	var dragArea = {
		bounds : {
			height : 48,
			width : 48,
			left : 0,
			top : 0
		},
		id : 'dragarea'
	};
	
	// overlay shown relative to current mouse position
	var mousePositionRelativeToOverLay = {
		left:24,
		top:24
	};

	function createDropAreaElement() {
		var dropDiv = document.getElementById(dropArea.id);
		if (!dropDiv) {			
			// remove margin and adjust window bounds
			document.body.style.margin = "0px";
			chrome.app.window.current()["outerBounds"].width = dropArea.windowWidth;
			chrome.app.window.current()["outerBounds"].height = dropArea.windowHeight;
			
			// create container
			dropDiv = document.createElement('div');
			dropDiv.id = dropArea.id;
			dropDiv.style.width = dropArea.bounds.width + 'px';
			dropDiv.style.height = dropArea.bounds.height + 'px';
			dropDiv.style.backgroundColor = 'rgba(87, 79, 91, 1.0)';
			dropDiv.style.display = "table";
			dropDiv.style.border = "2px dashed";
			
			// create inner text div.			
			var dropText = document.createElement('div');
			dropText.id = "dropText";
			dropText.style.verticalAlign = 'middle';
			dropText.style.textAlign = 'center';
			dropText.style.display = "table-cell";
			dropText.style.fontSize = "32px";
			dropText.style.padding = "5px";
			dropText.innerHTML = chrome.i18n.getMessage('seamless_multimonitor_drop_here');
			dropDiv.appendChild(dropText);
			
			document.body.appendChild(dropDiv);
		}
	}

	function createDragMessageOnOverlay() {
		var dragDiv = overlayWindow.contentWindow.document.getElementById(dragArea.id);
		if (!dragDiv) {
			dragDiv = document.createElement('div');
			dragDiv.id = dragArea.id;
			dragDiv.style.position = 'absolute';
			dragDiv.style.left = dragArea.bounds.left + 'px';
			dragDiv.style.top = dragArea.bounds.top + '0px';
			dragDiv.style.width = dragArea.bounds.width + 'px';
			dragDiv.style.height = dragArea.bounds.height + 'px';
			dragDiv.style.visibility = "hidden";
			dragDiv.style.backgroundImage = "url(/ChromeAppUI/resources/images/icon_48x48.png)";
			overlayWindow.contentWindow.document.body.appendChild(dragDiv);		
		  overlayWindow.contentWindow.dragDiv = dragDiv;
		}
	}

	function changeDropAreaOnPointer(inDropArea) {
		var dropDiv = document.getElementById(dropArea.id);
		if (inDropArea == true) {
			dropDiv.style.backgroundColor = "rgba(87, 79, 91, 0.5)";
			dropDiv.style.color = "black";
		} else {
			dropDiv.style.backgroundColor = "rgba(87, 79, 91, 1.0)";
			dropDiv.style.color = "white";
		}
		
		// TODO: Do not do this on every mouse movement.
		chrome.app.window.current()["outerBounds"].width = dropArea.windowWidth;
		chrome.app.window.current()["outerBounds"].height = dropArea.windowHeight;
	}
	
	function pointerInOtherMonitor(x, y){
		if (isPointerInOtherMonitor == false) {
			isPointerInOtherMonitor = true;
			overlayWindow.contentWindow.dragDiv.style.visibility = 'visible';
			var rects = [{
				left : 0,
				top : 0,
				width : dragArea.bounds.width,
				height : dragArea.bounds.height
			}];
			overlayWindow.setShape({
				'rects' : rects
			});
		}
		var bounds = overlayWindow['outerBounds'];
		bounds.left = x - mousePositionRelativeToOverLay.left;
		bounds.top = y - mousePositionRelativeToOverLay.top;
	}
	
	function pointerInOtherMonitorLeave( ){
		if (isPointerInOtherMonitor == true) {
			 isPointerInOtherMonitor = false;
			 overlayWindow.contentWindow.dragDiv.style.visibility = 'hidden';
		 }
	}
	
	function displayDeviceMidPoint(displayDevices) {
	  disPlayDevicescenterPoints = [];
		for (var i = 0; i < displayDevices.length; i++) {
			disPlayDevicescenterPoints[i] = {
				x : Math.floor(displayDevices[i]['bounds'].left + displayDevices[i]['bounds'].width / 2),
				y : Math.floor(displayDevices[i]['bounds'].top + displayDevices[i]['bounds'].height / 2),
			};
		}
	}
	
	function updateDisplayInfo(displays) {
	  // NOTE: If display is unified we need to use screen width and height until we support true multimonitor
	  var isUnifiedMode = g.Utils.getUnifiedDisplayBounds(displays).isUnifiedMode;
	  if (isUnifiedMode){
	    var screenBounds = {top: 0, left :0, width: screen.width, height: screen.height};
	    var screenBoundsAvailable = {top: 0, left :0, width: screen['availWidth'], height: screen['availHeight']};
	    displayDevices = [
	      {
	        "bounds":screenBounds,
	        "workArea":screenBoundsAvailable
	      }];
	  } else {
	    displayDevices = displays;
	  }
		displayDeviceMidPoint(displayDevices);
	}

	function init() {
		if (!initialized) {

			chrome.runtime.getBackgroundPage(function(bg) {
				bg.asyncObjects.get('object.overlayWindow', function(obj) {
					overlayObj = obj;

				});
				bg.asyncObjects.get('appWindow.proxyWindow', function(appWindow) {
					proxyWindow = appWindow;
				});
				bg.asyncObjects.get('appWindow.overlayWindow', function(appWindow) {
					overlayWindow = appWindow;
					createDragMessageOnOverlay();
				});

			});

			chrome['system']['display']['getInfo'](updateDisplayInfo);
			chrome['system']['display']['onDisplayChanged']['addListener'](function() {
				// screen.width/height seems to be updated after a delay during unified mode change
				setTimeout(function() {
					chrome['system']['display']['getInfo'](updateDisplayInfo);
				}, 500);
			});
			initialized = true;
		}
		createDropAreaElement();
		sessionbounds = { };
	}

	function checkPointOnRect(x, y, rect) {
		if ((x >= rect.left) && (x <= (rect.left + rect.width)) && (y >= rect.top) && (y <= (rect.top + rect.height))) {
			return true;
		}
		return false;
	}

	function getDisplayDeviceIndexId(pointX, pointY) {
		for (var i = 0; i < displayDevices.length; i++) {
			if (checkPointOnRect(pointX, pointY, displayDevices[i]['bounds']) == true) {
				return i;
			}
		}
		return null;
	}

	function showDropArea() {
		if (isDropWinHidden == true) {
			isDropWinHidden = false;
			proxyWindow.show();
		}
	}

	function hideDropArea() {
		if (isDropWinHidden == false) {
			isDropWinHidden = true;
			proxyWindow.hide();
		}
	}

	function focusOverlay() {
		overlayWindow.show();
	}

	function hideOverlay() {
		overlayWindow.hide();
	}

	function setBounds(bounds) {
		proxyWindow.setBounds(bounds);
	}

	function moveWindowtoDevice(index) {
		var centerPoint = disPlayDevicescenterPoints[index];
		if (currentDropWindowId == index) {
			return;
		}
		currentDropWindowId = index;
		var bounds = {
			left : centerPoint.x - dropArea.bounds.left - Math.floor(dropArea.bounds.width / 2),
			top : centerPoint.y - dropArea.bounds.top - Math.floor(dropArea.bounds.height / 2),
			width : dropArea.bounds.width,
			height : dropArea.bounds.height,
		};
		dropAreaBound = bounds;
		setBounds(bounds);
	}

	function start(clicked, bounds, numDisplays, displayWindows) {
		sessionbounds = bounds;
		overlayObj.start(clicked, sessionbounds, numDisplays, displayWindows);
		sessionDisplayDeviceId = getDisplayDeviceIndexId(Math.floor(sessionbounds.left + sessionbounds.width / 2), Math.floor(sessionbounds.top + sessionbounds.height / 2));
		currentDropWindowId = sessionDisplayDeviceId;
		if (clicked.srcDiv == 'captionRect') {
			virtualMonitorActivity.update = onDragupdate;
			virtualMonitorActivity.stop = onDragStop;
		} else {
			virtualMonitorActivity.update = overlayObj.update;
			virtualMonitorActivity.stop = overlayObj.stop;
		}
	}

	function onDragupdate(e) {
		var pointerOnDevice = getDisplayDeviceIndexId(e.screenX, e.screenY);
		if (pointerOnDevice != sessionDisplayDeviceId) {
			
			moveWindowtoDevice(pointerOnDevice);
			showDropArea();
			var pointerIndropArea = checkPointOnRect(e.screenX, e.screenY, dropAreaBound);
			changeDropAreaOnPointer(pointerIndropArea);
			pointerInOtherMonitor(e.screenX, e.screenY);
			focusOverlay();
		} else {
			pointerInOtherMonitorLeave( );
			hideDropArea();
			overlayObj.update(e);
		}

	}

	function onDragStop(onStop, e, onChangePosition) {
		var pointerOnDevice = getDisplayDeviceIndexId(e.screenX, e.screenY);
		if (pointerOnDevice != sessionDisplayDeviceId) {
			var pointerIndropArea = checkPointOnRect(e.screenX, e.screenY, dropAreaBound);
			if (pointerIndropArea) {
				onChangePosition({
					left : displayDevices[pointerOnDevice]['workArea'].left,
					top : displayDevices[pointerOnDevice]['workArea'].top,
					width : displayDevices[pointerOnDevice]['workArea'].width,
					height : displayDevices[pointerOnDevice]['workArea'].height
				});
				hideOverlay( );
			} else {
				overlayObj.stop(onStop, e);
			}
		} else {
			overlayObj.stop(onStop, e);
		}
		
		hideDropArea();

	}

	return {
		start : start,
		update : onDragupdate,
		stop : onDragStop,
		init : init
	};
}();
