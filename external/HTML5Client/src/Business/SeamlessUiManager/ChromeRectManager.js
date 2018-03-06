var SeamlessUI;

(function(SeamlessUI) {
    var ChromeRectManager = (function() {
        var rects = {};
        var rectList = [];
        var displayWindows;
        var resizeDialogShownOnLayoutChange = false;
        function ChromeRectManager() {

        }

        ChromeRectManager.prototype.create = function(id, bounds, isClientWindow) {
            createAndUpdate(id, bounds, isClientWindow);
        };


        function getParsedRectList(rectList, appWindow) {
            var newRectList = [];
            var current = chrome.app.window.current();
            var numDisplays = 1;
            if (displayManager) {
                numDisplays = displayManager.getActiveDisplayCount() || numDisplays;
            }
            var appBounds = appWindow['innerBounds'];
            if(numDisplays > 1){
              appBounds = appWindow['serverBounds'] || appWindow['innerBounds'];
            }
            var windowBounds = {
                'left': appBounds['left'],
                'top': appBounds['top'],
                'right': appBounds['left'] + appBounds['width'],
                'bottom': appBounds['top'] + appBounds['height']
            };
            for (var j = 0; j < rectList.length; j++) {
                var rect = rectList[j]['bounds'];
                if(rectList[j]['isClientWindow'] == true && current.id == appWindow.id){
                   newRectList.push(rect);
                }
                else if(rectList[j]['isClientWindow'] == undefined){
                  rect = Utility.convertRectToScreenCoordinates(rectList[j]['bounds']);
                  rect = Utility.convertBoundsToRect(rect);
                  var rectIntersection = Utility.getWindowIntersection(rect, windowBounds);
                  if (rectIntersection !== null) {
                      rectIntersection = Utility.convertValueRelativeToWindow(rectIntersection, windowBounds);
                      newRectList.push(rectIntersection);
                  }
                }
                
            }
            return newRectList;
        }
 
        function cutRects(rectList) {
            var appWindow;
            var parsedRectList;
            if (displayManager) {
                displayWindows = displayManager.getDisplayWindows();
            }
            for (var i in displayWindows) {
                parsedRectList = [];
                appWindow = displayWindows[i];
                parsedRectList = getParsedRectList(rectList, appWindow);
                writeHTML5Log(0, "SESSION:|:UI:|:RECT_MANAGER :|: " + appWindow.id + " rects = {" + JSON.stringify({
                'rects': parsedRectList
                }) + "}= ");
                appWindow.setShape({
                    'rects': parsedRectList
                });
            }
        }
        
        function setShape() {
            rectList = [];
            for (var key in rects) {
                rectList.push(rects[key]);
            }
            writeHTML5Log(0, "SESSION:|:UI:|:RECT_MANAGER :|: Initial rects = {" + JSON.stringify({
                'rects': rectList
            }) + "}= ");
            cutRects(rectList);
        }

        function createAndUpdate(id, bounds, isClientWindow) {
            rects[id] = {'bounds' : bounds, 'isClientWindow': isClientWindow};
            setShape();
        }

        ChromeRectManager.prototype.update = function(id, bounds, isClientWindow) {
            if (rects[id]) {
                createAndUpdate(id, bounds, isClientWindow);
            } else {
                writeHTML5Log(0, "SESSION:|:UI:|:RECT_MANAGER :|: No rect exist to update shape for id : " + id);
                console.log("No rect exist to update shape for id : " + id);
            }
        };

        ChromeRectManager.prototype.close = function(id) {
            if (rects[id]) {
                delete rects[id];
                setShape();
            }
        };

        ChromeRectManager.prototype.resetRects = function() {
           rects = {};
        };
        
        return ChromeRectManager;
    })();

    SeamlessUI['ChromeRectManager'] = ChromeRectManager;
    SeamlessUI.name = 'SeamlessUI';
})(SeamlessUI || (SeamlessUI = {}));