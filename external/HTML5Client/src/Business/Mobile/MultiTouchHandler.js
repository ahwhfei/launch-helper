
function MultiTouchHandler(icaFrame1) {

    var TOUCH_DOWN = 0x00;
    var TOUCH_UPDATE = 0x01;
    var TOUCH_UP = 0x02;
    var touchInputState = {};
    var touchInputTime = {};
    var touchPointerDictionary = {};
    var touchDictionary = {};
    var touchPointerX = {};
    var touchPointerY = {};
    var NoOfTouches = 0;
    var touchPositionX = {};
    var touchPositionY = {};
    var uiWrapper = null;
    var icaFrame = icaFrame1;
    var LONG_PRESS_TIMEOUT = 250;
    this.setUiWrapper = function (wrapper) {
        uiWrapper = wrapper;
    }

    function sendTouchDataToMTWrapper(hashTouchData, touchCount) {
        uiWrapper.sendTouchDataToMTWrapper({
            cmd: WorkerCommand.SEND_MULTI_TOUCH_DATA,
            source: myself.WrapperId,
            destination: DRIVERID.ID_MTU,
            touchData: hashTouchData,
            touchDataCount: touchCount
        });
    }
    var TouchUpdatesRequired = false;




    this.handleTouchEvents = function (event) {
		CEIP.add('multitouch:vc',true);
        var touchState;
        var hashTouchData = {};
        switch (event.type) {
            case "touchstart":
                touchState = TOUCH_DOWN;
                break;
            case "touchend":
                touchState = TOUCH_UP;
                break;
            case "touchmove":
                touchState = TOUCH_UPDATE;
                break;
            default:
                break;
        }

        var touch;
        for (var i = 0; i < event.changedTouches.length; i++) {
            touch = event.changedTouches[i];
            var mtvcTouchData = new MtVcTouchData();

            if (touchState == TOUCH_DOWN) {
                touchDictionary[touch.identifier] = NoOfTouches;
                NoOfTouches++;
                touchPositionX[touch.identifier] = touch.pageX;
                touchPositionY[touch.identifier] = touch.pageY;
            }
            var tempNumber = 0;
            for (var key in touchPositionX) {
                tempNumber++;
            }

            mtvcTouchData.initialize(touch.pageX, touch.pageY, 0, touchDictionary[touch.identifier], touchState);
            hashTouchData[touchDictionary[touch.identifier]] = mtvcTouchData;
            if (touchState != TOUCH_UP) {
                touchInputState[touchDictionary[touch.identifier]] = touchState;
                touchInputTime[touchDictionary[touch.identifier]] = new Date().getTime();
            }
            else if (touchState == TOUCH_UP && touchInputState[touchDictionary[touch.identifier]] == TOUCH_DOWN) {

                var timeDifference = new Date().getTime() - touchInputTime[touchDictionary[touch.identifier]];
                if (timeDifference > LONG_PRESS_TIMEOUT && event.touches.length == 0) {
					//send right click through mouse data
                    icaFrame.mouseDownByCoordinates(2, touch.pageX, touch.pageY);
                    icaFrame.mouseUpByCoordinates(2, touch.pageX, touch.pageY);
					
                    delete touchInputState[touchDictionary[touch.identifier]];
                    delete touchInputTime[touchDictionary[touch.identifier]];
                    delete touchPositionX[touch.identifier];
                    delete touchPositionY[touch.identifier];
                }
            }
            if (touchState == TOUCH_UP) {
                NoOfTouches--;
                delete touchDictionary[touch.identifier];
                delete touchPositionX[touch.identifier];
                delete touchPositionY[touch.identifier];
            }
        }

        var totalTouches = event.touches.length;
        for (var i = 0; i < event.touches.length; i++) {
            touch = event.touches[i];
            if (!hashTouchData.hasOwnProperty(touchDictionary[touch.identifier])) {
                var mtvcTouchData = new MtVcTouchData();
                mtvcTouchData.initialize(touch.pageX, touch.pageY, 0, touchDictionary[touch.identifier], TOUCH_UPDATE);
                hashTouchData[touchDictionary[touch.identifier]] = mtvcTouchData;
                touchInputState[touchDictionary[touch.identifier]] = TOUCH_UPDATE;
                touchInputTime[touchDictionary[touch.identifier]] = new Date().getTime();
            }
        }


        sendTouchDataToMTWrapper(hashTouchData, Object.keys(hashTouchData).length);
        return false;
    }
}

	