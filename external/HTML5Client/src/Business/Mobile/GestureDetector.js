function GestureDetector(MobEventHandlerObj, uiObj, MobReceiverViewObj) {
    var motionEventState;
    var FINGERS_TAP_TIMEOUT = 350;
    var ONE_TOUCH_POINTERS = 1;
    var TWO_TOUCH_POINTERS = 2;
    var THREE_TOUCH_POINTERS = 3;
    var touchDownTime;
    var m_twoFingerGestureDistance;
    var startx0;
    var starty0;
    var startx1;
    var starty1;
    var prevX0;
    var prevY0;
    var prevX1;
    var prevY1;
	var currX0;
	var currY0;
	var currX1;
	var currY1;
    var fingers;
    var prevTimeStamp;
    var currTimeStamp;
    var radiusX = 5;
    var radiusY = 5;
    var myself = this;
    var ui = uiObj;
    var noiseX = 15;
    var noiseY = 15;
    var direction;
    var touchStart = "touchstart";
    var touchEnd = "touchend";
    var touchMove = "touchmove";
    var noEvent1 = "noevent1"; // Don't handle and let browser handle it
	var noEvent2 = "noevent";  // Don't handle and also don't le browser handle it
    var zoomEvent = "zoomevent";
    var mobileEventHandlerObject = MobEventHandlerObj;
    var mobileReceiverViewObject = MobReceiverViewObj;
	var boundingRectangle = null; //Used to store the editing area in case of autokeyboard popup MRVC.
    this.getLastTouchCoord = function(){
		return new Point(currX0,currY0);
	};
    this.touchEventHandler = function (event) {
		CEIP.add('multitouch:gesture',true);
        var evType = filterEventType(event);
        if (evType === touchStart || evType == touchMove) {
            return this.onTouchStartMove(evType);
        }
        else if (evType === touchEnd) {
            return this.onTouchEnd();
        }
        else if (evType === zoomEvent) {
            HTML5Engine.setMobileZoom(null, null, null);
            // In case of zooming,disable scrolling	
            if (ui.getScrollingMode()) {
                ui.setScrollingMode(false);
            }
            // hide mouse cursor if enabled so that user can able to pan session
            if(ui.getCursorMode())
            {
                ui.hideCursor();
            }
			// pinchZoomInvoked is used by resize handlee to ignore the resize event for pinch/zoom ation
			// Chrome browser on hybrid and android doesn't trigger resize event, so don't need to use
			// this variable in case of chrome
			if(!g.environment.browser.isChrome){
            	UiControls.ResolutionUtility.set(UiControls.ResolutionUtility.constants.pinchZoomInvoked , { pinchZoomInvoked:true});
          
			}
            
            return true;  // browser to handle zooming
        }
        else if(evType === noEvent1) {
            return true; //do nothing and let browser handle it
        }
		else if(evType === noEvent2){
			 return false; //do nothing and also don't let browser handle it
        }
    };


    /* this function determines whether to handle or not handle event
    * It also detects zooming
    */
    var filterEventType = function (event) {

        fingers = event.touches.length;
        currTimeStamp = event.timeStamp;
        if (event.type == touchStart) {
            if (fingers == 1) {
                prevX0 = event.touches[0].clientX;
                prevY0 = event.touches[0].clientY;
                startx0 = prevX0;
                starty0 = prevY0;
                currX0 = prevX0;
                currY0 = prevY0;
                prevTimeStamp = event.timeStamp;

            }
            else if (fingers == 2) {
                prevX0 = event.touches[0].clientX;
                prevY0 = event.touches[0].clientY;
                prevX1 = event.touches[1].clientX;
                prevY1 = event.touches[1].clientY;
                startx0 = prevX0;
                starty0 = prevY0;
                startx1 = prevX1;
                starty1 = prevY1;
                currX0 = prevX0;
                currY0 = prevY0;
                currX1 = prevX1;
                currY1 = prevY1;
                prevTimeStamp = event.timeStamp;
            }
            return event.type;
        }
        else if (event.type == touchMove) {
            if (fingers == 1) {
                currX0 = event.touches[0].clientX;
                currY0 = event.touches[0].clientY;
                var deltax0 = currX0 - prevX0;
                var deltay0 = currY0 - prevY0;
                if (motionEventState == MotionEventState.OnePointerDown) {
                    /* In IPad touchmove event generated even if there is very negligible movement of finger
                    * in that case we are not handling touchmove event instead we are just telling tha we have handled it
                    */
					if (Math.abs(deltax0) < radiusX && Math.abs(deltay0) < radiusY) {
						if(!mobileEventHandlerObject.isSessionZoomed()) // zoom = 100%
						{
							return noEvent2;
						}
						else{
							return noEvent1;
						}
                    }
                    else {
                        return event.type;
                    }
                }
                else if (motionEventState == MotionEventState.OnePointerMove) {
					  if ((Math.abs(deltax0) < noiseX && Math.abs(deltay0) < noiseY)) {
						if(!mobileEventHandlerObject.isSessionZoomed()) // zoom = 100%
						{
							return noEvent2;
						}
						else{
							return noEvent1;
						}
                    }
                    else {
                        return event.type;
                    }
                }
            }
            if (fingers == 2) {
                currX0 = event.touches[0].clientX;
                currY0 = event.touches[0].clientY;
                currX1 = event.touches[1].clientX;
                currY1 = event.touches[1].clientY;
                direction = myself.getTwoFingerScrollDirection(currX0, currY0, currX1, currY1, prevX0, prevY0, prevX1, prevY1, startx0, starty0, startx1, starty1);
                if (motionEventState == MotionEventState.TwoPointersDown) {
                    if (direction == MultiFingerGestureDirection.NONE) {

                        return zoomEvent;
                    }
                    else {
                            return event.type;
                    }
                }
                else if (motionEventState == MotionEventState.TwoPointersMove) {
                    if (direction == MultiFingerGestureDirection.NONE) {
                        return zoomEvent;
                    }
                    else {
                            return event.type;
                    }
                }
            }

        }
        else if (event.type == touchEnd) {
            if (fingers == 1) {
                currX0 = event.changedTouches[0].clientX;
                currY0 = event.changedTouches[0].clientY;
            }
            return event.type;
        }
    };

    this.onTouchStartMove = function (evType) {
        var bEventConsumed = false;
        // on the basis of no of fingers calling different functions
        switch (fingers) {
            case ONE_TOUCH_POINTERS: bEventConsumed = handleOneFingerStartMoveEvent(evType);
                break;
            case TWO_TOUCH_POINTERS: bEventConsumed = handleTwoFingersStartMoveEvent(evType);
                break;
            case THREE_TOUCH_POINTERS: bEventConsumed = handleThreeFingersStartMoveEvent(evType);
                break;
        }
        return !bEventConsumed;
    };
    var handleOneFingerStartMoveEvent = function (evType) {
        var bEventConsumed = false;
        if (evType === touchStart) {
            motionEventState = MotionEventState.OnePointerDown;
            bEventConsumed = mobileEventHandlerObject.onDown(currTimeStamp, currX0, currY0);
        }
        else {
            if (motionEventState == MotionEventState.OnePointerDown || motionEventState == MotionEventState.OnePointerMove) {
                var distanceX = myself.getOneFingerScrollDistanceX();
                var distanceY = myself.getOneFingerScrollDistanceY();
                var difftime = (currTimeStamp - prevTimeStamp) / 1000;
                var velocity = Math.abs(Math.floor(distanceY / (difftime)));
                bEventConsumed = mobileEventHandlerObject.onScroll(startx0, starty0, currX0, currY0, distanceX, distanceY, currTimeStamp, velocity);
                prevTimeStamp = currTimeStamp;
                prevX0 = currX0;
                prevY0 = currY0;
                motionEventState = MotionEventState.OnePointerMove;
            }
        }
        return bEventConsumed;
    };
    var handleTwoFingersStartMoveEvent = function (evType) {
        var bEventConsumed = false;
        if (evType == touchStart) {
            motionEventState = MotionEventState.TwoPointersDown;
            touchDownTime = currTimeStamp;
            bEventConsumed = false;
        }
        else {
            if (motionEventState == MotionEventState.TwoPointersDown || motionEventState == MotionEventState.TwoPointersMove) {

                var difftime = (currTimeStamp - prevTimeStamp) / 1000;
                var velocity = Math.floor((currY0 - prevY0) / (difftime));
                /* since in mousewheel events coordinates values remain fixed
                * we are sending same startring xy values for all consecutive 2 fingers touch move eventsfor the scrolling 
                */
                mobileEventHandlerObject.onTwoFingerScroll(direction, startx0, starty0, m_twoFingerGestureDistance, velocity);
                bEventConsumed = true;
            }
            prevTimeStamp = currTimeStamp;
            prevX0 = currX0;
            prevY0 = currY0;
            prevX1 = currX1;
            prevY1 = currY1;
            motionEventState = MotionEventState.TwoPointersMove;
        }
        return bEventConsumed;
    };
    var handleThreeFingersStartMoveEvent = function (evType) {
        var bEventConsumed = false;
        if (evType === touchStart) {
            motionEventState = MotionEventState.ThreePointersDown;
            touchDownTime = currTimeStamp;
            bEventConsumed = true;
        }
        return bEventConsumed;
    };
    this.getOneFingerScrollDistanceX = function () {
        var scrollX0 = currX0 - prevX0;
        return scrollX0;
    };
    this.getOneFingerScrollDistanceY = function () {
        var scrollY0 = currY0 - prevY0;
        return scrollY0;
    };
    this.getTwoFingerScrollDirection = function (currX0, currY0, currX1, currY1, prevX0, prevY0, prevX1, prevY1, startx0, starty0, startx1, starty1) {
        var direction = MultiFingerGestureDirection.NONE;
        var scrollX0 = prevX0 - currX0;
        var scrollX1 = prevX1 - currX1;
        var scrollY0 = prevY0 - currY0;
        var scrollY1 = prevY1 - currY1;

        // Let's work out the angle between where we're at now and where we started this motion
        var deltax0 = currX0 - startx0;
        var deltay0 = currY0 - starty0;
        var deltax1 = currX1 - startx1;
        var deltay1 = currY1 - starty1;

        var anglePointer0 = (180 / Math.PI) * (Math.atan2(deltay0, deltax0));
        var anglePointer1 = (180 / Math.PI) * (Math.atan2(deltay1, deltax1));


        var difference = Math.abs(anglePointer0 - anglePointer1);
        if (difference < 90) // this is being generous - we're really looking for two fingers moving in the same direction
        {
            // This might be a scroll, let's at least consider it
            if ((Math.abs(scrollY1) >= Math.abs(scrollX1)) && (Math.abs(scrollY0) >= Math.abs(scrollX0))) {
                if (scrollY0 < 0 && scrollY1 < 0) {
                    direction = MultiFingerGestureDirection.DOWN;
                    m_twoFingerGestureDistance = scrollY0 > scrollY1 ? scrollY1 : scrollY0;
                }
                else if (scrollY0 > 0 && scrollY1 > 0) {
                    direction = MultiFingerGestureDirection.UP;
                    m_twoFingerGestureDistance = scrollY0 > scrollY1 ? scrollY0 : scrollY1;
                }
            }
            else {
                if (scrollX0 < 0 && scrollX1 < 0) {
                    direction = MultiFingerGestureDirection.RIGHT;
                    m_twoFingerGestureDistance = scrollX0 > scrollX1 ? scrollX1 : scrollX0;
                }
                else if (scrollX0 > 0 && scrollX1 > 0) {
                    direction = MultiFingerGestureDirection.LEFT;
                    m_twoFingerGestureDistance = scrollX0 > scrollX1 ? scrollX0 : scrollX1;
                }
            }
        }
        return direction;
    };
    this.onTouchEnd = function () {
        var bEventConsumed = false;
		bEventConsumed = handleFingerEndEvent();
        return !bEventConsumed;
    };
	
	var handleFingerEndEvent = function()
	{
		var bEventConsumed = true;
		if (motionEventState == MotionEventState.OnePointerDown || motionEventState == MotionEventState.OnePointerMove) {
			
            mobileEventHandlerObject.onSingleTapUp(currTimeStamp, currX0, currY0,boundingRectangle,motionEventState);
			motionEventState = MotionEventState.Idle;
        }
		else if (motionEventState == MotionEventState.TwoPointersDown) {
            var duration = (currTimeStamp - touchDownTime);
            var isSessionZoomed = mobileEventHandlerObject.isSessionZoomed();
			// enable mouse pointer if session is not in zoomed state
            if (duration <= FINGERS_TAP_TIMEOUT && !isSessionZoomed && !isChromeOS) {				
                bEventConsumed = mobileReceiverViewObject.onTwoFingerTap(currX0, currY0);
            }
			motionEventState = MotionEventState.TwoPointersUp;
        }
		else if(motionEventState == MotionEventState.ThreePointersDown)
		{
			// since we don't support virtual keyboard on Chrome OS, disabling it for chromeOS
			if((currTimeStamp - touchDownTime) < FINGERS_TAP_TIMEOUT && !isChromeOS) {
				// send 3 finger tapup gesture
				bEventConsumed = mobileReceiverViewObject.onThreeFingerTap();
        }
			motionEventState = MotionEventState.ThreePointersUP;
		}
		return bEventConsumed;
		
    };
	
	this.setBoundingRectangle = function(boundingRect){
		boundingRectangle = boundingRect;
	};
}

function MotionEventState() { };
MotionEventState.Idle = 0;
MotionEventState.OnePointerDown = 1;
MotionEventState.OnePointerMove = 2;
MotionEventState.OnePointerUp = 3;
MotionEventState.TwoPointersDown = 4;
MotionEventState.TwoPointersMove = 5;
MotionEventState.TwoPointersUp = 6;
MotionEventState.ThreePointersDown = 7;
MotionEventState.ThreePointersMove = 8;
MotionEventState.ThreePointersUP = 9;

function MultiFingerGestureDirection() { };
MultiFingerGestureDirection.NONE = 0;
MultiFingerGestureDirection.DOWN = 1;
MultiFingerGestureDirection.UP = 2;
MultiFingerGestureDirection.LEFT = 3;
MultiFingerGestureDirection.RIGHT = 4;
     
