var displayManager = function DisplayManager(){
    var LOGGER = "DM" + ": ";
    var idSurfaceRootElement = "citrixHTML5root";
    var idMousePointerDiv = "MousePointerDiv";
    var idMultiDiv = "multiDiv";
    var idSuperRenderSurface = "CitrixSuperRenderCanvas";
    var idRenderSurface = "CitrixRenderCanvas";
    var idRenderEmbedSurface = "CitrixRenderElement";
    
    var idPrimarySurface = "CtxSurfacePrimary";
    var idSecondarySurface = "CtxSurfaceSecondary";
    
    var idDisplayOverlay = "overlay";
    
    var displayWindowUrl = "../../src/DisplayWindow.html"; //'displaywindow.html';

    // The primary appWindow object on which the session launches
    var primaryDisplayWindow;

    // Primary surface
    var primaryDisplaySurface;
    
    // Secondary display window object and surface
    var secondaryDisplayWindows = [];

    var displayWindowCanvasArray = [];

    var displayWindows = [];
    var displayWindowCanvasContextArray = [];
    var mouseDivInSecondaryMonitorArray = [];
    var currentMonitorCount = 1;

    var mainWindowCanvasContext;
    var appWnd;
    var icaFrame;
    var mainEngine;
    var secondaryDisplays;
 
    var indexDisplayWindowTitle = 0;
    var windowCreateCount = 1;
    var onDisplaysUpdatedFn;

    var isMouseDown = false;
    var isMouseOut = false;

    // RFHTMCRM-1438
    // store the index of the primary monitor and
    // if the index changes then destroy and create all secondary display
    // surfaces, which avoids indexing issue during rendering.
    //
    var indexOfPrimaryMonitor = 0;

    // TODO: remove type detection from DM and handle it within the
    // corresponding render surface manager
    var renderSurfaceType;

    // TODO: templating engine for dom access separation
    function createMainWindowCanvas(){
        var append = false;
        var appWindow = chrome.app.window.current();

        var mainWindowCanvas = document.getElementById("mainwindowcanvas");

        if(!mainWindowCanvas) {
            mainWindowCanvas = document.createElement("canvas");
            append = true;
        }

        if (mainWindowCanvas) {
            mainWindowCanvas.id = "mainwindowcanvas";

            if (appWindow.isFullscreen()) {
                mainWindowCanvas.width = appWindow["outerBounds"]["width"];
                mainWindowCanvas.height = appWindow["outerBounds"]["height"];
                mainWindowCanvas.style.left = appWindow["outerBounds"]["left"] + "px";
                mainWindowCanvas.style.top = appWindow["outerBounds"]["top"] + "px";
            } else {
                mainWindowCanvas.width = appWindow["innerBounds"]["width"];
                mainWindowCanvas.height = appWindow["innerBounds"]["height"];
                mainWindowCanvas.style.left = appWindow["innerBounds"]["left"] + "px";
                mainWindowCanvas.style.top = appWindow["innerBounds"]["top"] + "px";
            }

            mainWindowCanvas.style.backgroundColor = 'black';
            mainWindowCanvas.style.position = "absolute";
            mainWindowCanvas.style.zIndex = "7";
            mainWindowCanvasContext = mainWindowCanvas.getContext('2d');
        } else {
            writeHTML5Log(0, LOGGER + "Error create primary display surface");
            // TODO: handle error unable to create primary monitor canvas
            throw(-22);
            return;
        }

        if (append) {
            document.body.appendChild(mainWindowCanvas);
        }
    }

    function setCursor(cursor){
        if(mouseDivInSecondaryMonitorArray.length !== 0){
          for(var i in mouseDivInSecondaryMonitorArray)
           mouseDivInSecondaryMonitorArray[i].style.cursor = cursor;
           
           // temp fix for cursor
           for (var j in secondaryDisplays) {
            var seamlessui = secondaryDisplays[j].contentWindow.document.getElementById("seamlessui");
            if (seamlessui) {
              seamlessui.style.cursor = cursor;
            }
           }
        }
    }

    function createCanvas(appWindow,id){
        var canvas = document.createElement("canvas");
        var width = appWindow["innerBounds"]["width"];
        var height = appWindow["innerBounds"]["height"];
        var left = appWindow["innerBounds"]["left"];
        var top = appWindow["innerBounds"]["top"];
        canvas.width = width;
        canvas.height = height;
        canvas.style.left = 0 + "px";
        canvas.style.top = 0 + "px";
        canvas.style.backgroundColor = 'black';
        canvas.id = id;
        return canvas;
    }
   
    function focusAllDisplay(e) {
        //console.warn("DM: onfocus: " + e['srcElement'].document.title);
        var srcContentWindow = e['srcElement'];
        
        // RFHTMCRM-1417
        // wait for the timeout of 100ms for the src window to get focused
        // (default behavior)
        setTimeout(focusHandler.bind(this, srcContentWindow), 100);
    }
    
    function focusHandler(contentWindow) {
        var allDisplay;
        var srcDisplay;
        
        // RFHTMCRM-1417
        // If the src display is not focused after 100ms then it means
        // it got blurred by itself due to overview window mode button action.
        // so it is the intented blur and stop focussing other display windows.
        if (!contentWindow.document['hasFocus']()) {
            return;
        }
  
        allDisplay = getDisplayWindows();
        
              
        // RFHTMCRM-1417
        // focus the src display at the end again so that the src display on which
        // the event got triggered will be in focus at the end of the handler.
  			  			
        // TODO: for now removing and adding the focus listerner to avoid recursive event
        // handler execution. find a better way to do it.
        // Remove this event listener from all display windows to prevent
        // recursive focus event trigger.
        //
        for (var i = 0; i < allDisplay.length; i++) {
            if (allDisplay[i]) {
                allDisplay[i].contentWindow.removeEventListener("focus", focusAllDisplay);
            }
        }

        for (var i = 0; i < allDisplay.length; i++) {
      			
            if (allDisplay[i]) {
                // for non-src display focus it if it is not in focus state
                if (allDisplay[i].contentWindow !== contentWindow) {
                    if (!allDisplay[i].contentWindow.document['hasFocus']()) {
                        allDisplay[i].focus();
                    }
                } else {
                    srcDisplay = allDisplay[i];
                }
            }
        }
        // focus the srcDisplay now
        if (srcDisplay && !srcDisplay.contentWindow.document['hasFocus']()) {
            srcDisplay.focus();
        }

        // Set the focus event listener after focusing the all displays
        // So that it will bahave as asyc addition of focus listener and
        // thereby avoids recursive execution of focus event handler
        //
        setTimeout(function() {
            for (var i = 0; i < allDisplay.length; i++) {
                if (allDisplay[i]) {
                    allDisplay[i].contentWindow.addEventListener("focus", focusAllDisplay);
                }
            }
        }, 100);
    }


    // Returns true if any of the secondary display is focussed otherwise
    // returns false
    function isSecondaryWindowFocussed(){
        if (displayWindows) {
            for (var i in displayWindows) {
                if (displayWindows[i] && displayWindows[i]['contentWindow']['document']['hasFocus']()) {
                    return true;
                }
            }
        }
        return false;
    }
    
    function onFullscreen() {
		primaryDisplayWindow = chrome.app.window.current();
        primaryDisplayWindow['fullscreen']();
    }

    function onRestore(appWindow) {
        primaryDisplayWindow = chrome.app.window.current();
        if (appWindow) {
            if (appWindow['isFullscreen']()) {
                primaryDisplayWindow['focus']();
            }
            if (!appWindow['isMinimized']() && !appWindow['isFullscreen']()) {
                primaryDisplayWindow['restore']();
            } 
        }
    }

    function enableAllDisplay(state) {
        var overlayDivElement;
        state = (state === 'block') ? state : 'none';
        
        if (secondaryDisplays) {
            for (var i = 0; i < secondaryDisplays.length; i++) {
                if (secondaryDisplays[i]) {
                    overlayDivElement = secondaryDisplays[i].contentWindow.document.getElementById(idDisplayOverlay);
                    if (overlayDivElement) {
                        overlayDivElement.style.display = state;
                    }
                }
            }
        }
    }
    
    function disableAllDisplay() {
        enableAllDisplay('block');
    }

    function onDOMContentLoaded(appWindow, id, e){
        appWindow['onFullscreened']['addListener'](onFullscreen);
        appWindow['onRestored']['addListener'](onRestore.bind(null, appWindow));

        // Secondary display itself will be loaded only for chrome app.
        // Add the focus listener only for desktop session of chrome app receiver.
        if (!g.environment.receiver.seamlessMode) {
            appWindow.contentWindow.addEventListener("focus", focusAllDisplay);
            focusAllDisplay({"srcElement": appWindow.contentWindow});
        }

        var curTime = (new Date()).getTime();
        var displayWindowCanvas = createCanvas(appWindow,"displaywindowcanvas");// + curTime);
        displayWindowCanvasArray[id] = displayWindowCanvas;
          //displayWindow.contentWindow.document.body.appendChild(displayWindowCanvas);
          appWindow.contentWindow.document.getElementById("citrixHTML5root2").appendChild(displayWindowCanvas);

        var displayWindowCanvasContext = displayWindowCanvas.getContext('2d');
        displayWindowCanvasContextArray[id] = displayWindowCanvasContext;
        var mouseDivInSecondaryMonitor = document.createElement("div");
        var width = appWindow["innerBounds"]["width"];
        var height = appWindow["innerBounds"]["height"];
        var left = appWindow["innerBounds"]["left"];
        var top = appWindow["innerBounds"]["top"];
        mouseDivInSecondaryMonitor.style.position = 'absolute';
        mouseDivInSecondaryMonitor.style.width = width + "px";;
        mouseDivInSecondaryMonitor.style.height = height + "px";;
        mouseDivInSecondaryMonitor.style.left = 0 + "px";
        mouseDivInSecondaryMonitor.style.top = 0 + "px";
        //mouseDivInSecondaryMonitor.style.zIndex = 0;
        // canvas.style.backgroundColor = 'black';
        mouseDivInSecondaryMonitor.id = "MousePointerDiv";
        appWindow.contentWindow.document.body.appendChild(mouseDivInSecondaryMonitor);
        mouseDivInSecondaryMonitorArray[id] = mouseDivInSecondaryMonitor;

        mouseDivInSecondaryMonitor.inputEvt = mouseEventHandler;
        mouseDivInSecondaryMonitor.onmousedown = mouseEventHandler;
        mouseDivInSecondaryMonitor.onmouseup = mouseEventHandler;
        mouseDivInSecondaryMonitor.onmousemove = mouseEventHandler;
        mouseDivInSecondaryMonitor.onmouseout = mouseEventHandler;
        mouseDivInSecondaryMonitor.onmouseover = mouseEventHandler;
        mouseDivInSecondaryMonitor.onmousewheel = mouseEventHandler;
        mouseDivInSecondaryMonitor.oncontextmenu = function(evt) {
            return false;
        };
        mouseDivInSecondaryMonitor.onselectstart = function(evt) {
            return false;
        };
        
        var overlayDivElement = appWindow.contentWindow.document.getElementById(idDisplayOverlay);
        overlayDivElement.style.width = "100%";
        overlayDivElement.style.height = "100%";
        overlayDivElement.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        overlayDivElement.style.zIndex = 14;
        overlayDivElement.style.position = "absolute";
        overlayDivElement.style.left = 0 + 'px';
        overlayDivElement.style.top = 0 + 'px';
        overlayDivElement.style.display = 'none';
         overlayDivElement.oncontextmenu = function() {
            return false;
        };
        overlayDivElement.onselectstart = function() {
            return false;
        };

        indexDisplayWindowTitle = indexDisplayWindowTitle + 1;        
        appWindow.contentWindow.document['title'] = "Extn" + indexDisplayWindowTitle + "_" + document['title'];
        //setMouseEvtHandler()
        setKeyBoardEvtHandler(appWindow.contentWindow, gInputEvt);

        if (g.environment.receiver.isChromeApp) {
            appWindow.contentWindow.document.onmouseup = chromeMouseEventHandler;
            appWindow.contentWindow.document.onmousemove = chromeMouseEventHandler;
        }
    }
    
    function mouseEventHandler(event) {        
        var data = {type: event.type, clientX: event.screenX, clientY: event.screenY, button: event.button, wheelDelta: event.wheelDelta};      
        isMouseOut = false;
        if (event.type === "mousedown") {
            isMouseDown = true;
        } else if (event.type === "mouseout") {
            isMouseOut = true;
            return true;
        } else if (event.type === "mouseup") {
            isMouseDown = false;
        }

        if (icaFrame) {
            icaFrame.MouseEventHandler(data);
        }
    }

    function chromeMouseEventHandler(event) {
        var data = {type: event.type, clientX: event.screenX, clientY: event.screenY, button: event.button, wheelDelta: event.wheelDelta};
        if(g.environment.receiver.seamlessMode && mainEngine) {
            mainEngine.uiEngine.callMouseEvt(data);
        }
        else {
            // TODO: handle better
            // For now handle mouse events from document only if mouse is down and 
            // out of the super surface 
            //
            if (isMouseDown && isMouseOut) {
                if (event.type === "mouseup") {
                    isMouseDown = false;					
                }

                if (icaFrame) {
                    icaFrame.MouseEventHandler(data);
                }
            }
        }		
    }
    
    function updateSecondarySurface(rect, id){
        var appWindow = secondaryDisplays[id];
        var bounds = {
          'left' : rect['left'],
          'top' : rect['top'],
          'width' : rect['right'] - rect['left'],
          'height' : rect['bottom'] - rect['top']
        };
        bounds = Utility.convertRectToScreenCoordinates(bounds);
        if(appWindow) {
            appWindow["serverBounds"] = bounds;
            if (appWindow['setBounds']){
                appWindow['setBounds'](bounds);
            }
            appWindow["outerBounds"]["setPosition"](bounds['left'], bounds['top']);
            appWindow["outerBounds"]["setSize"](bounds['width'], bounds['height']); 
            writeHTML5Log(0, LOGGER + "set display " + id + " bounds {" + bounds['left'] + ", " + bounds['top'] + ", " + bounds['width'] + ", " + bounds['height'] + "}");         
            var canvas = appWindow.contentWindow.document.getElementById("displaywindowcanvas");
            if(canvas){
                var width = rect["right"] - rect["left"];
                var height = rect["bottom"] - rect["top"];
                canvas.width = width;
                canvas.height = height;
                canvas.style.left = 0 + "px";
                canvas.style.top = 0 + "px";
            }
        }
    }
    
    function updatePrimarySurface(rect) {
        var append = false;
        var appWindow = chrome.app.window.current();
        
        var superSurface = getSuperSurface();
        var primaryDisplaySurface = getDomElement(idPrimarySurface);
        var bounds = {
          'left' : rect['left'],
          'top' : rect['top'],
          'width' : rect['right'] - rect['left'],
          'height' : rect['bottom'] - rect['top']
         };
        bounds = Utility.convertRectToScreenCoordinates(bounds);
        if(appWindow) {
            // In Asus chromebox for some reasons setPosition does not reposition the window
            // especially when connected to 4k monitor. But the deprecated setBounds works fine 
            // in this case. So as a workaround execute both the calls until find a proper API
            // which works in all the chromedevices.
            if (appWindow['setBounds']) {
                appWindow['setBounds'](bounds);
            }
            appWindow["outerBounds"].setPosition(bounds['left'], bounds['top']);
            appWindow["outerBounds"]["setSize"](bounds['width'], bounds['height']);
        	appWindow["serverBounds"] = bounds;
            writeHTML5Log(0, LOGGER + "set primary display bounds {" + bounds['left'] + ", " + bounds['top'] + ", " + bounds['width'] + ", " + bounds['height'] + "}");         
		}

        if(!primaryDisplaySurface) {
            primaryDisplaySurface = document.createElement("canvas");
            primaryDisplaySurface.id = idPrimarySurface;
            append = true;
        }

        if (primaryDisplaySurface) {
            primaryDisplaySurface.width = bounds['width'];
            primaryDisplaySurface.height = bounds['height'];
            primaryDisplaySurface.style.left = 0 + "px";
            primaryDisplaySurface.style.top = 0 + "px";

            primaryDisplaySurface.style.backgroundColor = 'black';
            primaryDisplaySurface.style.position = "absolute";
            primaryDisplaySurface.style.zIndex = "7";
            mainWindowCanvasContext = primaryDisplaySurface.getContext('2d');
        }

        if (append && superSurface) {
            superSurface.appendChild(primaryDisplaySurface);
        }
    }
    
    function deletePrimarySurface() {
        var superSurface = getSuperSurface();
        var primaryDisplaySurface = getDomElement(idPrimarySurface)
        if (primaryDisplaySurface && superSurface) {
            superSurface.removeChild(primaryDisplaySurface);
        }
        mainWindowCanvasContext = null;
    }
    
    function deleteSecondaryDisplays() {
        displayWindowCanvasContextArray = [];
        for(var displayIndex in secondaryDisplays) {
            if (secondaryDisplays[displayIndex]) {
                secondaryDisplays[displayIndex].close();
            }
        }
        secondaryDisplays = [];
    }
    
    function createDisplay(id, rect, onCreated) {
        var curTime = Date.now();
        
        var outerBounds = {
               'left': rect['left'],
               'top' : rect['top'],
               'width' : rect['right'] - rect['left'],
               'height' : rect['bottom'] - rect['top']
            }
        outerBounds = Utility.convertRectToScreenCoordinates(outerBounds);
        var sessionId = chrome.app.window.current().id;
        var winId = sessionId + '-display' + curTime;
        var state;
        if (g.environment.receiver.isChromeApp && g.environment.receiver.seamlessMode){
            state = 'maximized';
        }
        else{
            state = 'fullscreen';
        }
        var options = {
            'id' : winId,
            'outerBounds' : outerBounds,
            'frame' : 'none',
            'state' :  state //'fullscreen' // 'maximized' //
        };
        
        writeHTML5Log(0, LOGGER + "create display " + id + " bounds {" + outerBounds['left'] + ", " + outerBounds['top'] + ", " + outerBounds['width'] + ", " + outerBounds['height'] + "}");         
        // creating secondary display in progress. pushing dummy placeholder
        //secondaryDisplays.push(displayObj);
        windowCreateCount++;
        chrome.app.window.create(displayWindowUrl, options, function(createdAppWindow){
            if(createdAppWindow.id !== winId){
                deleteSecondaryDisplays();
                return;
            }
            secondaryDisplays[id] = createdAppWindow;
            //console.info("WindowsCreated: ", createdAppWindow, numDisplay, displayInfo);
            if (createdAppWindow) {
                createdAppWindow["serverBounds"] = outerBounds;
                onCreated(createdAppWindow,id);
                writeHTML5Log(0, LOGGER + "created display " + id + " bounds {" + createdAppWindow["outerBounds"].left + ", " + createdAppWindow["outerBounds"].top + ", " + 
                    createdAppWindow["outerBounds"].width + ", " + createdAppWindow["outerBounds"].height + "}");         
            }
        });
    }
    
    function onCreated(createdAppWindow,id) {
        // async
        if (createdAppWindow) {
            createdAppWindow.contentWindow.addEventListener('DOMContentLoaded', onDOMContentLoaded.bind(null,createdAppWindow,id));                     
            // send seamless pause/ resume command on all display windows created
            if(windowCreateCount == currentMonitorCount){
                onDisplaysUpdatedFn();
                var data = [];
                UiControls.ResolutionUtility.set(UiControls.ResolutionUtility.constants.displayWindowsUpdated,data);
      		  }
        }
    }
    
    
    
    function updateDisplaySurface(numDisplay, primaryDisplayIndex, displayInfo, surfaceWidth, surfaceHeight, isUnifiedMode, callBack) {
       onDisplaysUpdatedFn = callBack;
        // Update main render surface setSize
        var bounds;
        var renderSurface = getSurface();
        if (renderSurface && (renderSurfaceType != GFX_SURFACE_MODE.NATIVE)) {
            setSizeSurface(surfaceWidth, surfaceHeight);
        }

        indexDisplayWindowTitle = 0;
        
        // If no monitor info or only one monitor info is available then
        // display only main surface and remove primary, secondary displays
        if (numDisplay <= 1 || isUnifiedMode) {
            indexOfPrimaryMonitor = primaryDisplayIndex;
            currentMonitorCount = 1;
            if (renderSurface && (renderSurfaceType != GFX_SURFACE_MODE.NATIVE)) {
                renderSurface.style.visibility = "visible";
                renderSurface.style.display = "block";
            }

            // Remove focus event listerner for primary display window only for desktop session
            // of chrome app receiver
            if (g.environment.receiver.isChromeApp && !g.environment.receiver.seamlessMode) {
				primaryDisplayWindow = chrome.app.window.current();
				if(primaryDisplayWindow){
					primaryDisplayWindow.contentWindow.removeEventListener("focus", focusAllDisplay);
				}
            }

            setSizePointerDiv(surfaceWidth, surfaceHeight);
            deletePrimarySurface();
            deleteSecondaryDisplays();
            return;
        }    

        // For multimonitor add focus event lister for primary display window only for desktop session
        // of chrome app receiver
        if (g.environment.receiver.isChromeApp && !g.environment.receiver.seamlessMode) {
			if(primaryDisplayWindow){
			    primaryDisplayWindow.contentWindow.removeEventListener("focus", focusAllDisplay);
				primaryDisplayWindow.contentWindow.addEventListener("focus", focusAllDisplay);
			}
        }

        if (renderSurface) {
            renderSurface.style.visibility = "hidden";
            renderSurface.style.display = "none";
        }

        if ((currentMonitorCount !== numDisplay) || (indexOfPrimaryMonitor !== primaryDisplayIndex)) {
            currentMonitorCount = numDisplay;
            indexOfPrimaryMonitor = primaryDisplayIndex;
            deletePrimarySurface();
            deleteSecondaryDisplays();
            windowCreateCount = 1;
            for (var i = 0; i < numDisplay; i++) {
              if(g.environment.receiver.seamlessMode){
                bounds = displayInfo[i].workArea;
              }
              else{
                bounds = displayInfo[i].rect;
              }
              if (i === primaryDisplayIndex) {
                  updatePrimarySurface(bounds);
                  setSizePointerDiv(bounds['right'] - bounds['left'], bounds['bottom'] - bounds['top']);
              } else {
                  createDisplay(i, bounds, onCreated);
              }
            }
        }
        else{
          for (var i = 0; i < numDisplay; i++) {
            if(g.environment.receiver.seamlessMode){
                bounds = displayInfo[i].workArea;
              }
              else{
                bounds = displayInfo[i].rect;
              }
                if (i === primaryDisplayIndex) {
                  updatePrimarySurface(bounds);
                  setSizePointerDiv(bounds['right'] - bounds['left'], bounds['bottom'] - bounds['top']);
                } else {
                  updateSecondarySurface(bounds,i);
                }
            }
        }
        onDisplaysUpdatedFn();
    }

    function drawScene(canvas) {
        if (!canvas || currentMonitorCount <= 1)
            return;
      
        var displayDetails = UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation,null);
        var mainWindowIndex;
      
        for(var i = 0; i < displayDetails.displayInfo.length; i++){
            if(i == displayDetails.primaryMonitor){
                mainWindowIndex = i;
            }
        }
      
        var monitorInfo = displayDetails.displayInfo;
        var bounds;
        if (mainWindowCanvasContext && (mainWindowIndex != undefined)) {
            if(g.environment.receiver.seamlessMode){
                bounds = monitorInfo[mainWindowIndex].workArea;
            }
            else{
                bounds = monitorInfo[mainWindowIndex].bounds;
            }
            mainWindowCanvasContext.drawImage(canvas,bounds.left,bounds.top,bounds.width,bounds.height,0,0,bounds.width,bounds.height);
        }
        
        if (displayWindowCanvasContextArray.length !== 0) {
            for(var i in displayWindowCanvasContextArray) {
				if(monitorInfo[i]){
					if(g.environment.receiver.seamlessMode) {
						bounds = monitorInfo[i].workArea;
					}
					else{
						bounds = monitorInfo[i].bounds;
					}
				}
				else{
					// TODO: need to check why we are hitting this case?
                    console.warn("DM : monitor info undefined ", monitorInfo, i);
				}
                displayWindowCanvasContextArray[i].drawImage(canvas,bounds.left,bounds.top,bounds.width,bounds.height,0,0,bounds.width,bounds.height);
            }
        }
    }

    function closeAllWindow() {
        writeHTML5Log(0, "closing all windows");
        /*console.info(chrome.app.window.current());
        chrome.app.window.current().close();
        if(appWnd){
          appWnd.close();
        }*/
        deleteSecondaryDisplays();
    }

    function closeDisplayWindow(){
        currentMonitorCount = 1;
        if(mainWindowCanvas){
          mainWindowCanvas.remove();
          mainWindowCanvas = null;
          mainWindowCanvasContext = null;
        }
        if(appWnd){
          appWnd.close();
          displayWindowCanvasContext = null;
        }
    }

    function createRenderCanvas(parent, width, height) {
		var canvasDoc = document.createElement('canvas');
		canvasDoc.width = width;
		canvasDoc.height = height;
		canvasDoc.style.position = 'absolute';
		canvasDoc.style.top = 0 + 'px';
		canvasDoc.style.left = 0 + 'px';
		canvasDoc.style.backgroundColor = 'black';
        //canvasDoc.style.display = 'none';
		parent.appendChild(canvasDoc);
		
		if(!document.getElementById('MousePointerDiv')){
			var mouseDiv = document.createElement('div');
			mouseDiv.id = "MousePointerDiv";
			mouseDiv.style.position = 'absolute';
			mouseDiv.style.top = 0;//50 + 'px';
			mouseDiv.style.left = 0;//50 + 'px';
			mouseDiv.style.width = width + "px";
			mouseDiv.style.height = height + "px";
			mouseDiv.style.zIndex = 8;
			parent.appendChild(mouseDiv);
		}
		
		return canvasDoc;
	}
    
    function createUiElement(parentElement, frameWidth, frameHeight) {
		var superRenderCanvas = document.getElementById('CitrixSuperRenderCanvas');
		superRenderCanvas.style.width = 'auto';
		superRenderCanvas.style.height = 'auto';
		superRenderCanvas.tabIndex = '0';
        //superRenderCanvas.style.zIndex = '-1';
		var canvasDoc = createRenderCanvas(superRenderCanvas, frameWidth, frameHeight);
		canvasDoc.id = String("CitrixRenderCanvas");
 		MediaEncoder.canvas = document.getElementById('MousePointerDiv');
	}
    
    function createSurface(width, height, type) {
        var superSurface = getSuperSurface();
        var embedSurface = getDomElement(idRenderEmbedSurface);
        var canvasSurface = getDomElement(idRenderSurface);
        
        renderSurfaceType = type;
        switch (type) {
            case GFX_SURFACE_MODE.NATIVE:
                if (embedSurface) {
                    embedSurface.style.visibility = "visible";
                    // TODO: when switching surface delete/remove the
                    // previous surface
                    if (canvasSurface) {
                        canvasSurface.style.visibility = "hidden";
                        canvasSurface.style.block = "none";
                    }                   
                }
                break;
                
            default:
                if (!canvasSurface) {
                    var canvasDoc = createRenderCanvas(superSurface, width, height);
                    canvasDoc.id = "CitrixRenderCanvas";
                }
        
                // hide embed nacl element
                if (embedSurface) {
                    embedSurface.style.visibility = "hidden";
                }
                break
        }
    }
    
    function getSuperSurface() {
        return getDomElement(idSuperRenderSurface);
    }
    
    function getSurface() {
        // TODO: determine the surface and return
        return getDomElement(idRenderSurface);
    }
    
    function setSizeSurface(width, height) {
        var element = getSurface();
        if (element) {
            element.width = width;
            element.height = height;
            
            element.style.width = width + "px";
            element.style.height = height + "px";
        }
    }
    
    function removeSurface(surface) {
        var parent;
        if (surface) {
            parent = getSuperSurface();
            parent.removeChild(surface);
        }
    }
    
    function getPointerDiv() {
        return getDomElement(idMousePointerDiv);
    }
    
    function setSize(width, height) {
        var displayDetails = UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation);
        
        if(displayDetails.multimonitor == true && !displayDetails.isUnifiedMode){
            var bounds;
            if(g.environment.receiver.seamlessMode){
                width = displayDetails.displayInfo[displayDetails.primaryMonitor].workArea.width;
                height = displayDetails.displayInfo[displayDetails.primaryMonitor].workArea.height
            }
            else{
                width = displayDetails.displayInfo[displayDetails.primaryMonitor].bounds.width;
                height = displayDetails.displayInfo[displayDetails.primaryMonitor].bounds.height;
            }                
        }
        displayManager.setSizePointerDiv(width, height);
        displayManager.setSizeMultiDiv(width, height);
    }

    function setSizePointerDiv(width, height) {
        var pointerDivObj = getPointerDiv();
        if (pointerDivObj) {
            pointerDivObj.width = width;
            pointerDivObj.height = height;
            
            pointerDivObj.style.width = width + "px";
            pointerDivObj.style.height = height + "px";
        }
    }
    
    function setSizeMultiDiv(width, height) {
        var multiDiv = getDomElement(idMultiDiv);
        if(multiDiv){
            multiDiv.style.width = width+'px';
            multiDiv.style.height = height+'px';
        }
    }
    
    function getRootElement() {
        return getDomElement(idSurfaceRootElement);
    }
    
    function getDomElement(id) {
        var element = document.getElementById(id);
        return element;
    }
    
    function setKeyBoardEvtHandler(wnd, gInputEvt) {
        wnd.document.body.addEventListener('keydown', gInputEvt, false);
        wnd.document.body.addEventListener('keyup', gInputEvt, false);
        wnd.document.body.addEventListener('keypress', gInputEvt, false);
    }
    
    function getSecondaryWindowHandles(){
      return secondaryDisplays;
    }

    function getDisplayWindows() {
        displayWindows = [];
        primaryDisplayWindow = chrome.app.window.current();
        displayWindows.push(primaryDisplayWindow);
        if(secondaryDisplays){
          displayWindows = displayWindows.concat(secondaryDisplays);
        }
        return displayWindows;
    }
    
    function getActiveDisplayCount() {
        var displayWindows = getDisplayWindows();        
        var numDisplays = displayWindows.length;
        // Preventive test/check against null/unassigned data pushed into the array
        // if so ignore it for calculating the display count
        for (var i = 0; i < displayWindows.length; i++) {
            if (!displayWindows[i]) {
                numDisplays = numDisplays - 1;
            }
        }
        return numDisplays;
    }
    
    function minimizeAllDisplay() {
      if (secondaryDisplays) {
          for (var i = 0; i < secondaryDisplays.length; i++) {
              if (secondaryDisplays[i]) {
                  secondaryDisplays[i]['minimize']();
              }
          }
      }
    }

    function setIcaFrame(refIcaFrame){
        icaFrame = refIcaFrame;
    }
    function setIcaMainEngine(refMainEngine){
      mainEngine = refMainEngine;
    }

    function setTitle (title) {
        var indexDisplayWindowTitle = 0;
        if (secondaryDisplays) {
            for (var i in secondaryDisplays) {
                if (secondaryDisplays[i]) {
                    indexDisplayWindowTitle = indexDisplayWindowTitle + 1;
                    secondaryDisplays[i].contentWindow.document['title'] = "Extn" + indexDisplayWindowTitle + "_" + title;
                }
            }
        }
    }

    return {
        createUiElement: createUiElement,
        createSurface: createSurface,
        getSuperSurface: getSuperSurface,
        getSurface: getSurface,         // returns canvas or embed render surface
        removeSurface: removeSurface,   // delete the given surface object from the renderer
        
        getPointerDiv: getPointerDiv,

        setSize: setSize,
        setSizePointerDiv: setSizePointerDiv,
        setSizeMultiDiv: setSizeMultiDiv,
                
        getRootElement: getRootElement,
        
        //createRenderCanvas: createRenderCanvas,
        drawScene: drawScene,
        createDisplay: createDisplay, //onDisplayChange,
        closeAllWindow:closeAllWindow,
        setCursor : setCursor,
        
        updateDisplaySurface: updateDisplaySurface,
        
        setKeyBoardEvtHandler: setKeyBoardEvtHandler,
        getSecondaryWindowHandles : getSecondaryWindowHandles,
        getDisplayWindows : getDisplayWindows,
        getActiveDisplayCount : getActiveDisplayCount,
        isSecondaryWindowFocussed : isSecondaryWindowFocussed,
        setIcaFrame : setIcaFrame,
        minimizeAllDisplay: minimizeAllDisplay,
        setIcaMainEngine : setIcaMainEngine,
        enableAllDisplay : enableAllDisplay,
        disableAllDisplay : disableAllDisplay,
        setTitle : setTitle
    };
}();
