function MobileReceiverView(clientImeHandler) {
    var m_bShowCursor = false;
    var m_bSystemSoftKeyboardShowing = false;
    var ui = new MobileUI();
    var myself = this;
    var imeHandlerObj = clientImeHandler;
    var gestureDetectorObject;
    var autoPopupKbdButton = true;
    var mobileEventHandlerObject;
    var setMobileZoomRequired = false;
	var kbd;
    this.getMobileUI = function()
    {
    	return ui;
    };
  
    // Initialise all objects related to mobility gesture support
    this.Initialise = function (icaframe) {
        mobileEventHandlerObject = new MobileEventHandler(icaframe, ui);
        gestureDetectorObject = new GestureDetector(mobileEventHandlerObject, ui, myself);
        icaframe.setGestureObject(gestureDetectorObject);
		icaframe.setMobileUI(ui);
		// read autoPopupKbdButton setting from UI preference module
        autoPopupKbdButton = UiControls.sessionPreferences.getAutoKbdCheckBoxDefaulltSetting();
        // attach orientationchange event handler
		HTML5Interface.window.addEventListener("orientationchange", onOrientationchange);
    };
	
    function onOrientationchange()
    {
        //if virtual keyboard is up, hiding it for proper resize (BUG0619197)
        if (m_bSystemSoftKeyboardShowing) {
            myself.closeKeyBoard();
        }
    };
    
    
    this.getGestureDetectorObj = function()
    {
        return gestureDetectorObject;
    }
    this.setShowAutoPopupKbdButton = function(value)
    {
        autoPopupKbdButton = value;
        if(kbd){
            kbd.style.display = "none";
		}        
    }
    this.toggleCursor = function (x,y) {
        var bb = GetBrowserBox();
        if (ui.getCursorMode()) {
            ui.hideCursor();
            bb.showMobilePopOverMessage(HTML5Engine.i18n.getMessage('pointerOff'));
        }
        else {
        	//show cursor image at (x,y)
            ui.showCursor(x,y);
            bb.showMobilePopOverMessage(HTML5Engine.i18n.getMessage('pointerOn'));
        }
    };
    this.onTwoFingerTap = function (x,y) {
        this.toggleCursor(x,y);
        return true;
    };
    this.closeKeyBoard = function () {
        imeHandlerObj.imeBufferObject.Blur();
		var topWindow = window.top;
	    topWindow.scrollTo(0, 0);
        if(setMobileZoomRequired == true){
            //if session was zoomed in through code then zoomed out the session
    	    HTML5Engine.setMobileZoom(1,1,1);
            setMobileZoomRequired = false;
        }
		m_bSystemSoftKeyboardShowing = false;
        
    };
    this.popupKeyBoard = function (autoKbdCoords) {
		var ui = myself.getMobileUI();
		ui.setScrollingMode(false);	
		m_bSystemSoftKeyboardShowing = true;
        imeHandlerObj.imeBufferObject.Focus(null,autoKbdCoords);
        var isSessionZoomed = mobileEventHandlerObject.isSessionZoomed();
        if(!isSessionZoomed){
            // If session is not zoomed in and When we pop-up keyboard from client side, we are zooming page slightly so user will be able to pan and see the editable area
            // if it is behind keyboard. Since we can't know editable area
            HTML5Engine.setMobileZoom("1.1","1.1","1");
            setMobileZoomRequired = true;
		}	
        
    };
    this.toggleKeyBoardDisplay = function () {
        if (m_bSystemSoftKeyboardShowing) {
            this.closeKeyBoard();
        }
        else {
			this.popupKeyBoard();           
        }
    };


    
    this.onThreeFingerTap = function () {
    	// toggle keyboard display
        this.toggleKeyBoardDisplay();
    };

    this.AddEventListenerImeBuffer = function (name, listener) {
        imeHandlerObj.imeBufferObject.AddListener(name, listener, false);
    }

    this.RemoveEventListenerImeBuffer = function (name, listener) {
        imeHandlerObj.imeBufferObject.RemoveListener(name, listener, false);
    };
	
	function autoKbdBtnClickHandler(e)
	{
		var autoKbdCoords  = {};
		autoKbdCoords["left"] = kbd.style.left;
		autoKbdCoords["top"] = kbd.style.top;
					
		myself.popupKeyBoard(autoKbdCoords);				
					
		kbd.style.display = "none";
		e.preventDefault();
	}
	
	this.showAutoKeyboardBtn = function(boundingRectangle){
		// show kbd button only if autoPopupKbdButton setting and  boundingRectangle are set
		if(boundingRectangle && autoPopupKbdButton && !m_bSystemSoftKeyboardShowing){
			gestureDetectorObject.setBoundingRectangle(boundingRectangle);
			
			if(!kbd){
				kbd = document.createElement("div");
				kbd.id = "autoKeyboardBtn";
				kbd.className = "autoKeyboardBtn toolbarItem";
				var xtcRoot = document.getElementById("CitrixXtcRoot");
				if(xtcRoot){
					xtcRoot.appendChild(kbd);
				}else{
					document.body.appendChild(kbd);
				}
				if(g.environment.os.isWindows && g.environment.browser.isMSEdge){
					kbd.addEventListener("touchend",autoKbdBtnClickHandler,false);
				}
				else{
					kbd.addEventListener("click",autoKbdBtnClickHandler,false);
				} 
			}
			kbd.style.top = boundingRectangle["top"] + "px";
			kbd.style.left = boundingRectangle["left"] + "px"; 
			 var lastTouchCoord = gestureDetectorObject.getLastTouchCoord();
			if(lastTouchCoord){
				if(lastTouchCoord.X >= boundingRectangle["left"]  && lastTouchCoord.X <= boundingRectangle["right"]){						
					kbd.style.left = lastTouchCoord.X + "px";
				}
				if(lastTouchCoord.Y >= boundingRectangle["top"]  && lastTouchCoord.Y <= boundingRectangle["bottom"]){
					kbd.style.top = lastTouchCoord.Y + "px";						
				}
			} 
			
			kbd.style.display = "block";	
		}		
	};
	this.hideAutoKeyboardBtn = function(){
		if(kbd){			
			myself.closeKeyBoard();
			kbd.style.display = "none";
			gestureDetectorObject.setBoundingRectangle(null);
		}
	};
}
