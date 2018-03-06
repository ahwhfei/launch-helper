/**
 * Created by rajasekarp on 29-12-2015.
 */

var g;

(function(g) {
	if(!g.Utils) {
		g.Utils = {};
	}
	
	g.Utils.getUnifiedDisplayBounds = function(displays){
	// Check if window.screen is in any of current displays.
	    var leftBound = displays[0].bounds.left;
	    var topBound = displays[0].bounds.top;
	    var rightBound = (displays[0].bounds.left + displays[0].bounds.width);
	    var bottomBound = (displays[0].bounds.top + displays[0].bounds.height);
	    var originalBounds = [];
	    originalBounds.push(displays[0].bounds);
	    if(displays.length == 1){
  			  return {
    			  isUnifiedMode : false,
    			  boundary:{
    			    left:leftBound,
    			    right:rightBound,
    			    top:topBound,
    			    bottom:bottomBound
    			  },
    			  originalBounds: originalBounds
    		  };
	    }
	    originalBounds = [];
	    for(var i=0;i<displays.length;i++){
	        if(leftBound > displays[i].bounds.left){
	            leftBound = displays[i].bounds.left;
	        }
	        if(topBound > displays[i].bounds.top){
	            topBound = displays[i].bounds.top;
	        }
	        if(rightBound < (displays[i].bounds.left + displays[i].bounds.width)){
	            rightBound = (displays[i].bounds.left + displays[i].bounds.width);
	        }
	        var height = displays[i].bounds.height;
	        if(bottomBound < (displays[i].bounds.top + displays[i].bounds.height)){
	            bottomBound = (displays[i].bounds.top + displays[i].bounds.height);
	        }
	        originalBounds.push({
	          left : displays[i].bounds.left,
	          top : displays[i].bounds.top,
	          width : displays[i].bounds.width,
	          height : height
	        });
	    }
	    
	    
	    //               .->leftBound
	    //               .
	    //topBound <-.... _______..............
	    //               |       |            .
	    //               |   M1  | ___________.
	    //               |_______||           |
	    //               .        |     M2    |
	    //               .        |           |
	    //               .........|___________|......->bottomBound
	    //                                    .
	    //                                    .
	    //                                    . ->rightBound
	    
	    for(var i=0;i<displays.length;i++){
	        displays[i].bounds.left -= leftBound;
	        displays[i].workArea.left -= leftBound;
	        
	        displays[i].bounds.top -= topBound;
	        displays[i].workArea.top -= topBound;
	    }
	    rightBound -= leftBound;
	    bottomBound -= topBound;
	    
		var devicePixelRatio = window.devicePixelRatio;
		if(!devicePixelRatio){
			devicePixelRatio = 1;
		}
		var screenIdx = -1, totalWidth = 0, sameHeight = true;
		for (var idx = 0; idx < displays.length; idx++){
			var display = displays[idx];
			if (screenIdx === -1 && Math.floor(screen.width * devicePixelRatio) === display["bounds"].width && Math.floor(screen.height *devicePixelRatio) === display["bounds"].height){
				screenIdx = idx;
			}

			totalWidth += display["bounds"].width;
			sameHeight = (sameHeight && ( Math.abs(Math.floor(screen.height * devicePixelRatio) - display["bounds"].height) <= displays.length ));
		}

		// Unified means screen width is total width of all monitors and all displays scaled to be of same height
		var widthDiff = (Math.abs(Math.floor(screen.width * devicePixelRatio) - totalWidth));

		if (screenIdx === -1 && widthDiff <= displays.length && sameHeight === true) {
			if(widthDiff > 0){
				displays[displays.length-1]['bounds'].width-=widthDiff;
				displays[displays.length-1]['workArea'].width-=widthDiff;
			}
			if(devicePixelRatio != 1)
			{
				updateDisplayWidthDPR(displays,devicePixelRatio);
			}
			return {
			  isUnifiedMode : true,
			  boundary:{
    			    left:leftBound,
    			    right:rightBound,
    			    top:topBound,
    			    bottom:bottomBound
    			  },
    			  originalBounds: originalBounds
		  };
		}
		  return {
			  isUnifiedMode : false,
			  boundary:{
    			    left:leftBound,
    			    right:rightBound,
    			    top:topBound,
    			    bottom:bottomBound
    			  },
    			  originalBounds: originalBounds
		  };
	}
  
  function updateDisplayWidthDPR(displays,devicePixelRatio){
    for (var i = 0; i < displays.length; i++){
		var display = displays[i];
          if(display['bounds']){
            display["bounds"].left = Math.floor(display["bounds"].left/devicePixelRatio);
            display["bounds"].top = Math.floor(display["bounds"].top/devicePixelRatio);
            display["bounds"].width = Math.floor(display["bounds"].width/devicePixelRatio);
            display["bounds"].height = Math.floor(display["bounds"].height/devicePixelRatio);
          }
          if(display['workArea']){
            display["workArea"].left = Math.floor(display["workArea"].left/devicePixelRatio);
            display["workArea"].top = Math.floor(display["workArea"].top/devicePixelRatio);
            display["workArea"].width = Math.floor(display["workArea"].width/devicePixelRatio);
            display["workArea"].height = Math.floor(display["workArea"].height/devicePixelRatio);
          }
        }
  }

	g.Utils.IconHandler = function () {
		var doc = window.document;
		var drawingCanvas = doc.createElement('canvas');
		drawingCanvas.style.left = -1000 + 'px';
		drawingCanvas.style.top = -1000 + 'px';
		//doc.body.appendChild(drawingCanvas);
		var fdrawingCanvas = doc.createElement('canvas');
		fdrawingCanvas.style.left = -1000 + 'px';
		fdrawingCanvas.style.top = -1000 + 'px';
		fdrawingCanvas.width = 32;
		fdrawingCanvas.height = 32;
		//doc.body.appendChild(fdrawingCanvas);
		var fcontext = fdrawingCanvas.getContext('2d');

		function convertToPng(data) {
			drawingCanvas.height = data.height;
			drawingCanvas.width = data.width;
			var context = drawingCanvas.getContext('2d');
			var canvasData = context.getImageData(0, 0, data.width, data.height);
			var canData = canvasData.data;

			canData.set(new Uint8Array(data.iconData.rawdata.buffer));
			context.putImageData(canvasData, 0, 0);
			fcontext.clearRect(0, 0, fdrawingCanvas.width, fdrawingCanvas.height);
			fcontext.drawImage(drawingCanvas, 0, 0, drawingCanvas.width, drawingCanvas.height, 0, 0, fdrawingCanvas.width, fdrawingCanvas.height);
			return fdrawingCanvas.toDataURL();
		}

		return {
			convertToPng : convertToPng
		}
	};
    
    var switchClass = (function() {
        function switchClass(obj) {

            this.switchObj = obj;
            this.switchMap = {};    
            this.init();
        }

        switchClass.prototype.init = function() {
            for ( var method in Object.getPrototypeOf(this.switchObj)) {
                if(this.switchObj[method].$id) {       
                    this.switchMap[this.switchObj[method].$id] = method;
                }
            }
        };
    
    
        switchClass.prototype.execute = function(key, args) {
            var fnToCall = this.switchObj[this.switchMap[key]];
            if(fnToCall) {            
                this.switchObj[this.switchMap[key]](args);
            }            
        };

        return switchClass;
    })();
    
    g.Utils.SwitchClass = switchClass;
})(g || (g = {}));