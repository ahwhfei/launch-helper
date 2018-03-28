var H264DecoderFactory = function H264DecoderFactory(decoderChangeCallback) {
    var decoder,
        currentDecoderType = 0,
        allowedDecoders = DecoderType.CoreAvc | DecoderType.CoreAvcWorker | DecoderType.PPAPIDecoder, // For debugging
        availableDecoders = DecoderType.CoreAvc;
    
    var LOGGER = "TW" + "_" + "DFA" + ": "; 
    if (HTML5Interface.ChromeNacl.isFeatureEnabled('graphics')) {
        availableDecoders |= DecoderType.PPAPIDecoder;
    }

    if (Utility.isWorkerEnabled() && !HTML5_CONFIG['other']['h264nonworker']) {
        availableDecoders |= DecoderType.CoreAvcWorker;
    }

    availableDecoders &= allowedDecoders;

    function checkDecoderChange(decoderType, available) {
        if (available && ((allowedDecoders & decoderType) != 0)) {
            availableDecoders |= decoderType;
        }
        else {
            availableDecoders &= (~decoderType);
        }
        var prefDecoder = preferredDecoderType();
        var invalidateSurface = false;
        if (prefDecoder !== currentDecoderType) {
            writeHTML5Log(0, LOGGER + "decoder change " + currentDecoderType + " " + prefDecoder);
            decoder.dispose();
            decoder = null;
            // For NACL suface should be invalidated 
            invalidateSurface = (currentDecoderType == DecoderType.PPAPIDecoder)
            decoderChangeCallback(prefDecoder, invalidateSurface);
        }
    }

    var preferredDecoderType = function () {
        var prefDecoderType = DecoderType.None;
        
        if ((availableDecoders & DecoderType.PPAPIDecoder) != 0) {
            prefDecoderType = DecoderType.PPAPIDecoder;
        }
        else if ((availableDecoders & DecoderType.CoreAvcWorker) != 0) {
            prefDecoderType = DecoderType.CoreAvcWorker;
        }
        else if ((availableDecoders & DecoderType.CoreAvc) != 0) {
            prefDecoderType = DecoderType.CoreAvc;
        }
        return prefDecoderType;
    };

    var getDecoder = function (decodeCallback, modeChangeCallback, maxDecodeTime, maxFramesBeforeFallback) {
        var decoderType;

        currentDecoderType = preferredDecoderType();
        switch (currentDecoderType) {
            case DecoderType.CoreAvc:
                decoder = new CoreAvcDecoder(decodeCallback, modeChangeCallback, maxDecodeTime, maxFramesBeforeFallback);
                decoder.addAvailabilityListener(checkDecoderChange);
                decoderType = "H264 (M)";
            break;

            case DecoderType.CoreAvcWorker:
                decoder = new CoreAvcWorkerDecoder(decodeCallback, modeChangeCallback, maxDecodeTime, maxFramesBeforeFallback);
                decoder.addAvailabilityListener(checkDecoderChange);
                decoderType = "H264 (W)";
            break;

            case DecoderType.PPAPIDecoder:
                decoder = PPAPIDecoder(decodeCallback, modeChangeCallback);
                decoder.addAvailabilityListener(checkDecoderChange);
                decoderType = "NaCl";
            break;
        }
        writeHTML5Log(0, LOGGER + "Decoder " + decoderType);
        Profiler.Ui.update("Decoder", decoderType);      
        return decoder;
    }
        
    return {
        getDecoder: getDecoder
    };
};