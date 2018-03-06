var ThinwireFlowControl = (function () {
    var FPS_VARIANCE_FOR_CHANGE = 3;
    var NUM_FRAMES_FOR_FRAME_TIME_AVG = 150;
    var NUM_FRAMES_FOR_QUEUE_TIME_AVG = 30;
    var INITIAL_FRAMES_TO_SKIP = 10;
    var INITIAL_DELAY_TIME = 10000;
    var MAX_FPS = 256;
	var fpsToIncrease = new Uint8Array(MAX_FPS);
	var fpsToDecrease = new Uint8Array(MAX_FPS);
	for(var i = 0 ;i < 8 ; i++ ){
		fpsToIncrease[i] = 2;
		fpsToDecrease[i] = 1;
	}
	for(var i = 8 ;i < 12 ; i++ ){
		fpsToIncrease[i] = 3;
		fpsToDecrease[i] = 2;
	}
	for(var i = 12 ;i < 30 ; i++ ){
		fpsToIncrease[i] = 3;
		fpsToDecrease[i] = 3;
	}
	for(var i = 30 ;i <MAX_FPS ; i++ ){
		fpsToIncrease[i] = 4;
		fpsToDecrease[i] = 4;
	}
    var timestamp;
    try {
        timestamp = performance.now.bind(performance);
    }
    catch (error) {
        timestamp = Date.now.bind(Date);
    }

    function ThinwireFlowControl(fpsChangeCallback, minimumFps) {
		var fpsTimes = Array(64);
        var fpsTimesIndex = 0;
        var maxFps = 16;  // starting with 8 makes slow growth of FPS for higher end machines.      
		var firstSent = false;
        var frameTimeMovingAvg = (1000 / maxFps);
        var frameTimeAlpha = 2 / (NUM_FRAMES_FOR_FRAME_TIME_AVG + 1);
        var queueTimeMovingAvg = 0;
        var queueTimeAlpha = 2 / (NUM_FRAMES_FOR_QUEUE_TIME_AVG + 1);
        var skippedFrames = 0;
        var initialDelayTimer = null;
		var timeRef = HTML5Interface.getTimeTicks();
		var prevTime = timeRef();
		var h264FPS = 0, avgh264FPS = 0;
		var h264count=0,h264sumFps = 0;
	
        function calculateExactFps() {
            var time = timestamp();
            fpsTimes[fpsTimesIndex] = time;
            fpsTimesIndex = ((++fpsTimesIndex) & 63);
            if (fpsTimesIndex === 0) {
                currentFps = 0;
                var lastSecond = time - 1000;
                for (var i = 0; i < fpsTimes.length; i++) {
                    if (fpsTimes[i] > lastSecond) {
                        currentFps++;
                    }
                }
            }
        }

        this.frameProcessed = function (frameTime) {
            // Leave for debugging
            //calculateExactFps();
            
            // skip the first few frames or a fixed amount of time as timing is off at connection time
            if (skippedFrames < INITIAL_FRAMES_TO_SKIP) {
                if (initialDelayTimer == null) {
                    initialDelayTimer = setTimeout(function () { skippedFrames = INITIAL_FRAMES_TO_SKIP; }, INITIAL_DELAY_TIME);
                }
                skippedFrames++;

                frameTime.renderTime = 0;
                frameTime.queuedTime = 0;
            }

            var totalFrameTime = 0;
            if (frameTime.parallelDecodeAndRender) {
                totalFrameTime = Math.max(frameTime.decodeTime, frameTime.renderTime) + frameTime.waitForPresentTime;
            }
            else {
                totalFrameTime = frameTime.decodeTime + frameTime.renderTime + frameTime.waitForPresentTime;
            }
            //console.log("qt = %d, dt = %d, rt = %d, wt = %d", frameTime.queuedTime, frameTime.decodeTime, frameTime.renderTime, frameTime.waitForPresentTime);

            // calculate exp moving avg, see: http://en.wikipedia.org/wiki/Moving_average#Exponential_moving_average
            var oldFrameTimeMovingAvg = frameTimeMovingAvg;
            var oldQueueTimeMovingAvg = queueTimeMovingAvg;
            
            frameTimeMovingAvg += frameTimeAlpha * (totalFrameTime - frameTimeMovingAvg);
            queueTimeMovingAvg += queueTimeAlpha * (frameTime.queuedTime - queueTimeMovingAvg);
            //console.log("avg frameTime = %d, avg queueTime = %d", frameTimeMovingAvg, queueTimeMovingAvg);
            var fps = (1000 / (frameTimeMovingAvg + queueTimeMovingAvg));
            fps = Math.ceil(fps);
            // stopping fps that is nearly equal to 0
            if (fps < minimumFps) {
                fps = minimumFps;
            }
            
            if (fps > 32) {
                frameTimeMovingAvg = oldFrameTimeMovingAvg;
                queueTimeMovingAvg = oldQueueTimeMovingAvg;
                return;
            }
            
            //console.log("Fps = %d, ema = %d", fps, frameTimeMovingAvg);
            if ((fps > (maxFps + fpsToIncrease[maxFps])) || ( fps <( maxFps - fpsToDecrease[maxFps])) || (firstSent == false)) {
            	firstSent = true;
                maxFps = fps;
                fpsChangeCallback(maxFps);
            }

        };
    }

    return ThinwireFlowControl;
})();