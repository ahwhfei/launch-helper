if ( typeof importScripts != 'undefined') {
	HTML5OFFUSCATIONJSASSEMBLERSTARTTEB;
	loadScript("Business/Main/VirtualDriver/Thinwire/CoreAvcDecoder/DecoderCommand.js");
	loadScript("Business/Main/VirtualDriver/Thinwire/CoreAvcDecoder/CoreAvcDecoder.js");
	HTML5OFFUSCATIONJSASSEMBLERENDTEB ;

	/*
	 * These file will not be include or process by obfuscate tool/JsAssembler
	 */
	loadThirdPartyScript("Compiled/frameDecode.js");

	function onDecodeComplete(yData, uData, vData, rectCount, dirtyRects, frameNr, decodeTime, queueTime, colorFormat) {
		var data = {
	        cmd: DecoderCommand.DECODE_COMPLETE,
	        ybuffer: yData,
	        ubuffer: uData,
	        vbuffer: vData,
	        rectCount: rectCount,
	        dirtyRects: dirtyRects,
	        frameNr: frameNr,
	        decodeTime: decodeTime,
	        queueTime: queueTime,
	        colorFormat: colorFormat
	    };
	    self.postMessageTransfer(data, [data.ybuffer.buffer, data.ubuffer.buffer, data.vbuffer.buffer]);
	}

	function onModeChange(data) {
        data['cmd'] = DecoderCommand.CHANGE_MODE;
	    self.postMessage(data);
	}

	function onAvailabilityChange(decoderType, available) {
	    self.postMessage({ cmd: DecoderCommand.AVAILABILITY_CHANGE, available: available });
	}

	var decoder = new CoreAvcDecoder(onDecodeComplete, onModeChange);
	decoder.addAvailabilityListener(onAvailabilityChange);
	var onMessage = function (e) {
	    var data = e.data;
	    switch (data.cmd) {
			case DecoderCommand.CHECK_TRANSFER_BEGIN:
				// ignore this message as it could have been transferred using copy method.
				break;
			case DecoderCommand.CHECK_TRANSFER_END:
				// Use real postMessage if supported, else strip transfer list
				if (data.useTransferable === true) {
					self.postMessageTransfer = self.postMessage;
				} else {
					self.postMessageTransfer = function(data, transferList) {
						self.postMessage(data);
					};
				}
				break;
	        case DecoderCommand.INIT_DECODER:
	            decoder.reinitialize(data.width, data.height);
	            break;
	        case DecoderCommand.DECODE_H264:
	            decoder.decodeFrames(data.buffer, data.rectCount, data.dirtyRects, data.frameNr, data.queueTime, data.frameWidth, data.frameHeight, data.colorFormat);
	            break;
	        case DecoderCommand.TERMINATE:
	            decoder.dispose();
	            self.close();
	            break;
	    }
	};

	self.addEventListener('message', onMessage, false);
}