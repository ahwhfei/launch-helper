var CoreAvcWorkerDecoder = (function () {
    function CoreAvcWorkerDecoder(decodeCallback, modeChangeCallback) {
        var availabilityListeners = new Array();
		var path =  createWorkerPath(THREADID.H264);
        var worker = new Worker(path);
        worker.onerror = function (event) {
            console.log(event.message + " @ " + event.filename + ":" + event.lineno);
        };

        worker.onmessage = onWorkerMessage;
		
		// test for transferable object support, IE 10 or older Firefox don't support it.
		(function() {
			var useTransferable = true;
			try {
			  var ab = new ArrayBuffer(1);
			  var data = { cmd: DecoderCommand.CHECK_TRANSFER_BEGIN, data: ab};
			  worker.postMessage(data, [data.data]);
			  // if transferred then length is no longer valid
			  if (ab.byteLength) {
				useTransferable = false;
			  }
			} catch(e) {
			  useTransferable = false;
			}
			// Use real postMessage if supported, else strip transfer list
			if (useTransferable === true) {
				worker.postMessageTransfer = worker.postMessage;
			} else {
				worker.postMessageTransfer = function(data, transferList) {
					worker.postMessage(data);
				};
				writeHTML5Log(0,"SESSION:|:ICA:|:THINWIRE:|:DRIVER:|:Transferable object not available in worker decoder" );
			}
			// inform worker about the result
			worker.postMessage({cmd: DecoderCommand.CHECK_TRANSFER_END, useTransferable: useTransferable});
		})();

        function onWorkerMessage(event) {
            var data = event.data;
            switch (data.cmd) {
                case DecoderCommand.DECODE_COMPLETE:
                    decodeCallback(data.ybuffer, data.ubuffer, data.vbuffer, data.rectCount, data.dirtyRects, data.frameNr, data.decodeTime, data.queueTime, data.colorFormat);
                    break;
                case DecoderCommand.CHANGE_MODE:
                    modeChangeCallback(data);
                    break;
                case DecoderCommand.CONSOLE:
                    console.log(data.message);
                    break;
                case DecoderCommand.AVAILABILITY_CHANGE:
                    for (var i = 0; i < availabilityListeners.length; i++) {
                        availabilityListeners[i](DecoderType.CoreAvcWorker, data.available);
                    }
                    break;
            }
        }

        this.reinitialize = function (width, height) {
            worker.postMessage({ cmd: DecoderCommand.INIT_DECODER, width: width, height: height});
        };

        this.decodeFrames = function (bufferData, rectCount, dirtyRects, frameNr, queueTime, frameWidth, frameHeight, colorFormat) {
			var data = { cmd: DecoderCommand.DECODE_H264, buffer: bufferData, rectCount: rectCount, dirtyRects: dirtyRects, frameNr: frameNr, queueTime: queueTime, frameWidth: frameWidth, frameHeight: frameHeight, colorFormat: colorFormat};
            worker.postMessageTransfer(data, [data.buffer.buffer]);
        };

        this.dispose = function () {
            worker.postMessage({ cmd: DecoderCommand.TERMINATE });
			
			// ignore any more messages from worker from now
			worker.onmessage = function(e) {
				//console.log("message after dispose!", e);
			};
        };

        this.isDecodeAndRenderParallel = function () {
            return true;
        };

        this.addAvailabilityListener = function (listener) {
            availabilityListeners.push(listener);
        };
    }
    return CoreAvcWorkerDecoder;
})();

