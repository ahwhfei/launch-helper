/**
 * Created by rajasekarp on 28-07-2015.
 */

var overlayWindow = function() {
	function DivRegion(elementId) {
		var element = document.getElementById(elementId);
		//Make sure alpha enabled is set

		this.setBounds = function(bounds) {
			element.style.left = bounds.left + 'px';
			element.style.top = bounds.top + 'px';
			element.style.width = bounds.width + 'px';
			element.style.height = bounds.height + 'px';
		};

		this.id = elementId;

		this.getBounds = function() {
			if(element) {
				var bounds = element.getBoundingClientRect();

				return {
					top : bounds.top,
					left: bounds.left,
					width : bounds.width,
					height : bounds.height
				};
			}
		};

		this.setEffect = function(state) {
			if(state == 'onUpdating' && element) {
				element.style.borderColor = "green";
				element.style.backgroundColor = 'rgba(0,0,0,0.2)';
				element.style.borderWidth = "2px";
			}else if(state == 'onStart') {
				element.style.display = "block";
			}else if(state == 'init') {
				document.body.style.backgroundColor = 'rgba(0,0,0,0.1)';
			}
		};
	}


	function WindowRegion() {
		var current ;
		var _winBounds, _bounds, _initialBounds; // Do not use window bounds for calculations as window may take time to update and is just for user display
		chrome.runtime.getBackgroundPage(function (bg) {
			bg.asyncObjects.get('appWindow.overlayWindow' ,function(appWindow){
				current = appWindow;
				_winBounds = current['outerBounds'];

			});
		});
		this.id = 'default';
		this.borderWidth = 3;

		this.setBounds = function(bounds) {
			_winBounds['left'] = bounds.left;
			_winBounds['top'] = bounds.top;
			_winBounds['width'] = bounds.width;
			_winBounds['height'] = bounds.height;
			
			_bounds = bounds;
		};
		
		this.setInitialBounds = function(bounds){
		 _initialBounds = bounds;
		};
		
		this.cutRect = function(rects) {
			current.setShape({'rects': rects});
		};
		this.cutBoundaryRect = function( ){
			var bounds = _winBounds;
			var rects = [];
			rects[0] = {top:0, left: 0, width : bounds.width, height : this.borderWidth};
			rects[1] = {top:0, left: 0, width : this.borderWidth, height : bounds.height};
			rects[2] = {top: 0, left: bounds.width - this.borderWidth, width : this.borderWidth, height : bounds.height};
			rects[3] = {top: bounds.height - this.borderWidth, left: 0, width : bounds.width, height : this.borderWidth};
			current.setShape({'rects': rects});
		};

		this.getBounds = function() {
			//return _winBounds;
			return _bounds;
		};

    this.getInitialBounds = function(){
      return _initialBounds;
    };
		this.setEffect = function(state) {

		};

		this.hide = function () {
			current.hide();
		};

		this.show = function() {
			current.show();
		};
		
	}

  var displayWindows;
	var numberOfDisplayWindow;
	var clicked = null;
	var region;
	var minWidth = 30;
	var minHeight = 30;
	var _referenceBounds = {left : 0, top : 0, width : 0, height : 0};

	function start(clickedEvent ,sessionBounds, numDisplays, displaywindows) {
	 displayWindows = displaywindows;
		numberOfDisplayWindow = numDisplays;
		onUpdating();
		_referenceBounds.top = sessionBounds.top;
		_referenceBounds.left = sessionBounds.left;
		_referenceBounds.width = sessionBounds.width;
		_referenceBounds.height = sessionBounds.height;
		region.setBounds(getAbsoluteBound(clickedEvent.bounds));
		region.setInitialBounds(getAbsoluteBound(clickedEvent.bounds)); // store initial position
		region.setEffect('onStart');
		region.id = clickedEvent.id;
		region.window_info = clickedEvent.window_info;

		clicked = {};
		clicked.srcDiv = clickedEvent.srcDiv;
		clicked.b = clickedEvent.bounds;
		clicked.x = clickedEvent.e.clientX - clicked.b.left;
		clicked.y = clickedEvent.e.clientY - clicked.b.top;
		clicked.cx = clickedEvent.e.clientX;
		clicked.cy = clickedEvent.e.clientY;
		clicked.w = clicked.b.width;
		clicked.h = clicked.b.height;

		if(clicked.srcDiv !=  'captionRect') {
			clicked.onTopEdge = clicked.srcDiv == 'cornerRT' || clicked.srcDiv == 'cornerLT' || clicked.srcDiv == 'sideTop';
			clicked.onLeftEdge = clicked.srcDiv == 'cornerLT' || clicked.srcDiv == 'sideLeft' || clickedEvent.srcDiv == 'cornerLB';
			clicked.onRightEdge = clicked.srcDiv == 'cornerRT' || clicked.srcDiv == 'sideRight' || clicked.srcDiv == 'cornerRB';
			clicked.onBottomEdge = clicked.srcDiv == 'cornerRB' || clicked.srcDiv == 'cornerLB' || clicked.srcDiv == 'sideBottom';
			clicked.action = "resize";
		}else {
			clicked.action = "move";
		}
		
		
	}

	function update(e) {
		if(!clicked) {
			console.log("No valid start state to update");
			return;
		}

		var x = e.clientX - clicked.b.left;
		var y = e.clientY - clicked.b.top;

		var bounds = {
			top : clicked.b.top,
			left : clicked.b.left,
			width: clicked.b.width,
			height : clicked.b.height
		};

		if(clicked.action == 'move') {
			bounds.top = (e.clientY - clicked.y);
			bounds.left = (e.clientX - clicked.x);
		}else if(clicked.action == 'resize') {
			if (clicked.onRightEdge) {
				bounds.width = Math.max(x, minWidth);
			}
			if (clicked.onBottomEdge) bounds.height = Math.max(y, minHeight);

			if (clicked.onLeftEdge) {
				var currentWidth = Math.max(clicked.cx - e.clientX + clicked.w, minWidth);
				if (currentWidth > minWidth) {
					bounds.width = currentWidth;
					bounds.left = e.clientX;
				}
			}

			if (clicked.onTopEdge) {
				var currentHeight = Math.max(clicked.cy - e.clientY + clicked.h, minHeight);
				if (currentHeight > minHeight) {
					bounds.height = currentHeight;
					bounds.top = e.clientY;
				}
			}
		}
		region.setBounds(getAbsoluteBound(bounds));
		region.cutBoundaryRect( );
	}
	
	function onUpdating() {
		//console.log("applying border");
		region.setEffect('onUpdating');
		region.show();
	}
	function checkPointOnRect(x, y) {
	 for (var i in displayWindows) {
      appWindow = displayWindows[i];
      var appBounds = appWindow['serverBounds'] || appWindow['innerBounds'];
      var windowBounds = {
          'left': appBounds['left'],
          'top': appBounds['top'],
          'right': appBounds['width'] + appBounds['left'],
          'bottom': appBounds['height'] + appBounds['top']
      };
      if ((x >= windowBounds.left) && (x <= windowBounds.right) && (y >= windowBounds.top) && (y <= windowBounds.bottom)) {
			 return true;
		 }
	 }
		return false;
	}
	function stop(callback ,e) {
		// If we drag the overlay window outside bounds, update it to its initial position when drag started
		// else update with new position
		if(checkPointOnRect(e.screenX, e.screenY) == true){
			callback(region.window_info, region.getBounds());
		}
		else{
			callback(region.window_info, region.getInitialBounds());
		}
		region.id = "";
		region.hide();
		clicked = null;
	}
	function getAbsoluteBound(bounds){
		return {
			left : bounds.left + _referenceBounds.left,
			top :  bounds.top + _referenceBounds.top,
			width :  bounds.width ,
		    height :  bounds.height ,
		};	
	}
	function getRelativeBounds(bounds){
		return  {
			left : bounds.left - _referenceBounds.left,
			top :  bounds.top - _referenceBounds.top,
			width :  bounds.width ,
		    height :  bounds.height ,
		};
	}
	
	function init() {
		//region = new DivRegion('pane');
		region = new WindowRegion();
		region.setEffect('init');
	}

	return {
		start: start,
		update : update,
		stop : stop,
		init : init
	}
}();

document.addEventListener('DOMContentLoaded', OnDOMLoaded, false);

function OnDOMLoaded() {
	overlayWindow.init();
	chrome.runtime.getBackgroundPage(function (bg) {
		bg.asyncObjects.add('object.overlayWindow' ,overlayWindow);
	});
	console.log("Overlay init successful");
}


