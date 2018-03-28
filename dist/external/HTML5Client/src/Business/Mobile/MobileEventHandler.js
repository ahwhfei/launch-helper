function MobileEventHandler(icaframe1, uiObj) {
    var inDrag;
    var ui = uiObj;
    var LONG_PRESS_TIMEOUT = 350;
    var icaFrame = icaframe1;
    var sendInitialMouseDownEvent;
    var mousePointerLongPressTimer;
    var downTouchEventTime;
    var applicationScrolling;
    var lastTapPointClient;
    var lastTapPointServer;
    var doubleTapSlopSquare = 200;
    var lastTapTime = 0;
    var DOUBLETAP_TIMEOUT = 200;
    var max_pixel_diff_in_noresize = 20;
	var myself = this;
    
    function getSessionWindow(){
		if(window.isSDK && g.environment.os.isIOS){
			return window.top;
		}
		return window;
	};
	
	var topWindow = getSessionWindow();

	function onSessionResize(resolution){
		sessionWidth = resolution.width;      
	}
	
   	UiControls.ResolutionUtility.get( UiControls.ResolutionUtility.constants.sessionResize, function(resolution ){
		sessionWidth = resolution.width; 
		UiControls.ResolutionUtility.registerCallback( UiControls.ResolutionUtility.constants.sessionResize,onSessionResize);
	});
	
	
   	
    this.isSessionZoomed = function () {
		if(sessionWidth - topWindow.innerWidth <= max_pixel_diff_in_noresize){
			return false;
		}else{
			/*To be able to pan the session when session size is more than the tab size*/
			ui.setScrollingMode(false);
			return true;
		}
			
    };
    this.onDown = function (currTimeStamp, x, y) {

        var rvalue = false;
        var ctxPoint;
        downTouchEventTime = currTimeStamp;
        mousePointerLongPressTimer = setTimeout(function () {
            sendInitialMouseDownEvent = true;
        }, LONG_PRESS_TIMEOUT);
        inDrag = false;
        applicationScrolling = false;
        if (ui.getCursorMode()) {
            ctxPoint = getCtxPointAtMouseCursorPosition();
        }
        else {
            ctxPoint = new Point(x, y);
        }
        // zoom > 100% so during panning we want browser to handle
        // if (!ui.getScrollingMode()) {
            // rvalue = false;
        // }
        return rvalue;
    };



    this.onScroll = function (startx0, starty0, currX0, currY0, distanceX, distanceY, currTimeStamp, velocity) {
        var bResult = false;
        if (mousePointerLongPressTimer != null) {
            clearTimeout(mousePointerLongPressTimer);
        }
        //  if zoom == 100%, then enable scrolling 
        if (!myself.isSessionZoomed() && !ui.getScrollingMode() )  {
            ui.setScrollingMode(true);
        }
        // Do scrolling
        if (ui.getScrollingMode() && !ui.getCursorMode() && !((currTimeStamp - downTouchEventTime > LONG_PRESS_TIMEOUT) || inDrag)) {
            // We are in scroll mode so we send a mouse wheel event
            bResult = true;
            sendApplicationScroll(startx0, starty0, distanceX, distanceY, velocity);
        }
        else {
            if (ui.getCursorMode()) {
                // do dragging if touch,hold & move happens
                if ((currTimeStamp - downTouchEventTime > LONG_PRESS_TIMEOUT) || inDrag) {
                    if (sendInitialMouseDownEvent) {
                        sendInitialMouseDownEvent = false;
                        // send initial mousedown for start dragging
                        sendMouseDownEvent(startx0, starty0);
                    }
                    sendMouseMoveEvent(currX0, currY0);
                    inDrag = true;
                }
                bResult = true;
                // if no dragging, then move pointer according to finger movement
                handleCursorMove(distanceX, distanceY);

            }
            else {
                if ((currTimeStamp - downTouchEventTime > LONG_PRESS_TIMEOUT) || inDrag) {
                    if (sendInitialMouseDownEvent) {
                        sendInitialMouseDownEvent = false;
                        sendMouseDownEvent(startx0, starty0);
                    }
                    sendMouseMoveEvent(currX0, currY0);
                    inDrag = true;
                    bResult = true;
                }
				else{
					 bResult = false;
				}
                applicationScrolling = true;

            }
        }
        return bResult;
    };
    var handleCursorMove = function (distanceX, distanceY) {

        var img = ui.getImageObject();
        var w = window.innerWidth;
        var h = window.innerHeight;
        var imageWidth = img.width;
        var imageHeight = img.height;
        var cursorPoint = ui.getCursorPointer();
        if (distanceY > 0) {
            if (cursorPoint.Y + distanceY + imageHeight >= h) {
                img.style.top = h - 10 + "px";
            }
            else {
                img.style.top = cursorPoint.Y + distanceY + "px";
                Y = cursorPoint.Y + distanceY;
            }
        }
        if (distanceY < 0) {
            if (cursorPoint.Y + distanceY < 0) {
                img.style.top = "0px";
            }
            else {
                img.style.top = cursorPoint.Y + distanceY + "px";
            }
        }
        if (distanceX > 0) {
            if (cursorPoint.X + distanceX + imageWidth >= w) {
                img.style.left = w + "px";
            }
            else {
                img.style.left = cursorPoint.X + distanceX + "px";
            }
        }
        if (distanceX < 0) {
            if (cursorPoint.X + distanceX < 0) {
                img.style.left = "0px";
            }
            else {
                img.style.left = cursorPoint.X + distanceX + "px";
            }
        }
        applicationScrolling = true;
    };
    var sendMouseDownEvent = function (x, y) {
        if (ui.getCursorMode()) {
            var CtxPoint = getCtxPointAtMouseCursorPosition();
            icaFrame.mouseDownByCoordinates(0, CtxPoint.X, CtxPoint.Y);
        }
        else {
            var CtxPoint = new Point(x, y);
            icaFrame.mouseDownByCoordinates(0, CtxPoint.X, CtxPoint.Y);
        }
    };
    var sendMouseMoveEvent = function (x, y) {
        if (ui.getCursorMode()) {
            var CtxPoint = getCtxPointAtMouseCursorPosition();
            icaFrame.MouseMoveByCoordinates(CtxPoint.X, CtxPoint.Y);
        }
        else {
            var CtxPoint = new Point(x, y);
            icaFrame.MouseMoveByCoordinates(CtxPoint.X, CtxPoint.Y);
        }
    };

    var sendApplicationScroll = function (x, y, distanceX, distanceY, velocity) {
        if (Math.abs(distanceY) > Math.abs(distanceX)) {
            // Scrolling vertical
            var wheelDelta = 120; // in mousewheel event wheelDelta will always be multiple of 120

            // wheelDelta should be negative in case of scrolling down
            if (distanceY < 0) {
                wheelDelta = (-wheelDelta);
            }
            else {
                wheelDelta = wheelDelta;
            }
            var wheelDeltaMultiplier = 1;
            // on the basis of finger speed we are dtermining how far scroll should happen
            if (velocity < 3000) {
                wheelDeltaMultiplier = 2;
            }
            else if (velocity < 7500) {
                wheelDeltaMultiplier = 3;
            }
            else
                wheelDeltaMultiplier = 4;

            // on the basis of scrooling distance we are determining how far scroll should happen   
            var scrollDistanceFactor = Math.floor(Math.abs(distanceY) / 60);
            scrollDistanceFactor++;
            if (scrollDistanceFactor > 4) {
                scrollDistanceFactor = 4;
            }
            if (scrollDistanceFactor > wheelDeltaMultiplier) {
                wheelDeltaMultiplier = scrollDistanceFactor;
            }
            wheelDelta = wheelDelta * wheelDeltaMultiplier;
            icaFrame.mouseWheelMoveByCoordinates(x, y, wheelDelta);
        }
        else {
            if (distanceX < 0) {
                //send right arrown key press event for scrolling right
                icaFrame.keyboardEventbyCode(39, "keyDown");
                icaFrame.keyboardEventbyCode(39, "keyUp");
            }
            else if (distanceX > 0) {
                //send left arrow key press event for scrolling left
                icaFrame.keyboardEventbyCode(37, "keyDown");
                icaFrame.keyboardEventbyCode(37, "keyUp");
            }
        }
        applicationScrolling = true;
    };

    this.onTwoFingerScroll = function (direction, x, y, distance, velocity) {
        var handled = this.handleApplicationScroll(direction, x, y, distance, velocity);
        if (handled) {
            applicationScrolling = true;
        }

        return handled;
    };
    this.handleApplicationScroll = function (direction, x, y, distance, velocity) {
        if (direction == MultiFingerGestureDirection.NONE) {
            return false;
        }

        if (direction == MultiFingerGestureDirection.DOWN || direction == MultiFingerGestureDirection.UP) {
            // Scrolling vertical
            var wheelDelta = 120; // in mousewheel event wheelDelta will always be multiple of 120
            // wheelDelta should be negative in case of scrolling down
            if (distance > 0) {
                wheelDelta = (-wheelDelta);
            }
            else {
                wheelDelta = wheelDelta;
            }
            var wheelDeltaMultiplier = 1;
            // on the basis of finger speed we are dtermining how far scroll should happen
            if (velocity < 3000) {
                wheelDeltaMultiplier = 1;
            }
            else if (velocity < 7500) {
                wheelDeltaMultiplier = 3;
            }
            else {
                wheelDeltaMultiplier = 4;
            }
            // on the basis of scrooling distance we are determining how far scroll should happen     
            var scrollDistanceFactor = Math.floor(Math.abs(distance) / 60);
            scrollDistanceFactor++;
            if (scrollDistanceFactor > 4) {
                scrollDistanceFactor = 4;
            }
            if (scrollDistanceFactor > wheelDeltaMultiplier) {
                wheelDeltaMultiplier = scrollDistanceFactor;
            }
            wheelDelta = wheelDelta * wheelDeltaMultiplier;
            icaFrame.mouseWheelMoveByCoordinates(x, y, wheelDelta);
        }
        else if (direction == MultiFingerGestureDirection.LEFT) {
            // send right arrow key press event for scrolling Right 
            icaFrame.keyboardEventbyCode(39, "keyDown");
            icaFrame.keyboardEventbyCode(39, "keyUp");
        }
        else if (direction == MultiFingerGestureDirection.RIGHT) {
            // send left arrow key press event for scrolling left
            icaFrame.keyboardEventbyCode(37, "keyDown");
            icaFrame.keyboardEventbyCode(37, "keyUp");
        }

        return true;
    };
    this.onSingleTapUp = function (currTimeStamp, currX0, currY0,boundingRectangle,motionEventState) {
        //  cancel the long press timer event that was started onDown event
        if (mousePointerLongPressTimer != null) {
            clearTimeout(mousePointerLongPressTimer);
        }
		if(boundingRectangle !== null && motionEventState === MotionEventState.OnePointerDown){			
			var clickPoint;
			if (ui.getCursorMode()) {
				clickPoint = getCtxPointAtMouseCursorPosition();
			}else {
				clickPoint = new Point(currX0, currY0);
			}
			//Change the autoKeyboardBtn position based on the touched location when the button is shown
			if(clickPoint.X >= boundingRectangle["left"] && clickPoint.X <= boundingRectangle["right"] && clickPoint.Y >= boundingRectangle["top"] && clickPoint.Y <= boundingRectangle["bottom"]){
				var kbd = document.getElementById("autoKeyboardBtn");
				if(kbd && kbd.style.display === "block"){
					kbd.style.left = clickPoint.X + "px";
					kbd.style.top = clickPoint.Y + "px";
				}else{
					//Show the keyboard automatically in the boundingRectangle when the keyboard is hidden manually
					var bb = GetBrowserBox();
					var mobileReceiverViewObj = bb.getMobileReceiverView();
					mobileReceiverViewObj.popupKeyBoard();
				}				
			}
		}
        // we are not doing scrolling and  long press event occurs  so send right click 
        if (!applicationScrolling && this.isMotionEventRightClickEvent(currTimeStamp)) {
            this.sendRightClick(currX0, currY0);
        }
        else {
            var clickPoint = null;
            // we are in pointer mode, get pointer location
            if (ui.getCursorMode()) {
                clickPoint = getCtxPointAtMouseCursorPosition();
            }
            else {
                clickPoint = new Point(currX0, currY0);
            }
            // We've got a valid tap inside our session - determine whether this is a double or single tap.
            var bSendDoubleTap = false;
            if (lastTapTime != 0) {
                // We already have another tap before this one - is this new tap within the time and space requirements to be
                // considered a double tap?
                if ((currTimeStamp - lastTapTime) < DOUBLETAP_TIMEOUT && tapMeetsProximityForDoubleTap(lastTapPointClient, clickPoint)) {
                    bSendDoubleTap = true;
                    lastTapTime = 0;
                    // Reset our timer
                }
            }

            if (bSendDoubleTap) {
                // Set the tap position to be the same as the last one so the server sees a double tap
                this.sendSingleLeftClick(lastTapPointServer.X, lastTapPointServer.Y);
            }
            else {
                if (ui.getCursorMode()) {
                    lastTapPointClient = getCtxPointAtMouseCursorPosition();
                }
                else {
                    // Record the last tap position 
                    lastTapPointClient = new Point(currX0, currY0);
                }

                lastTapPointServer = clickPoint;
                //  Record the last tap time
                lastTapTime = currTimeStamp;
                // send left click only when either ending of drag happens or during simple tap
                if ((inDrag && applicationScrolling) || (!inDrag && !applicationScrolling)) {
                    this.sendSingleLeftClick(clickPoint.X, clickPoint.Y);
                }
            }

        }

        inDrag = false;
        return true;
    };
    var getCtxPointAtMouseCursorPosition = function () {
        return ui.CursorPoint;
    };
    this.isMotionEventRightClickEvent = function (currTimeStamp) {
        var result = false;
        var isMouseRightClickPressed = false;
        var isLongPress = false;

		if((currTimeStamp - downTouchEventTime > LONG_PRESS_TIMEOUT))
		{
            isLongPress = true;
        }

        /*
        * If either of above happens we send the right click event to server
        */
        if (isMouseRightClickPressed || isLongPress) {
            result = true;
        }
        return result;
    };
    var sendMouseUpEvent = function (event) {
        var CtxPoint = getCtxPointAtMouseCursorPosition();
        icaFrame.mouseUpByCoordinates(0, CtxPoint.X, CtxPoint.Y);
    };
    var getCtxPointAtMouseCursorPosition = function () {
        var clickPoint = null;
        clickPoint = ui.getCursorOffsetPosition();
        return clickPoint;
    };

    this.sendRightClick = function (currX0, currY0) {
        var clickPoint = null;
        // we are in pointer mode, get pointer location
        if (ui.getCursorMode()) {
            clickPoint = getCtxPointAtMouseCursorPosition();
        }
        else {
            clickPoint = new Point(currX0, currY0);
        }
        icaFrame.mouseDownByCoordinates(2, clickPoint.X, clickPoint.Y);
        icaFrame.mouseUpByCoordinates(2, clickPoint.X, clickPoint.Y);
    };
    this.sendSingleLeftClick = function (X, Y) {
        //When in drag mode, we do not want to send down event as it has already been sent during  startDrag 

        if (inDrag) {
            icaFrame.mouseUpByCoordinates(0, X, Y);
        }
        else {
            //emulating mouse behavior as we left click on any location, first pointer move on location and then mouseup/down
            icaFrame.MouseMoveByCoordinates(X,Y);
            setTimeout(function(){
            icaFrame.mouseDownByCoordinates(0, X, Y);
            icaFrame.mouseUpByCoordinates(0, X, Y);
            },50);
            
        }

    };
    var tapMeetsProximityForDoubleTap = function (firstDown, secondDown) {
        var deltaX = firstDown.X - secondDown.X;
        var deltaY = firstDown.Y - secondDown.Y;

        return (deltaX * deltaX + deltaY * deltaY < doubleTapSlopSquare);
    };
}	
