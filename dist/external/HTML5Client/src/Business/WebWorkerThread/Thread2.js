if ( typeof importScripts != 'undefined') 
{	
	HTML5OFFUSCATIONJSASSEMBLERSTARTTEB;
	loadScript("Business/Main/Common/VirtualStream.js");
	loadScript("Business/Main/Common/OutputStream.js");
	loadScript("Business/Main/Common/ByteWriter.js");
	loadScript("Business/Main/Common/Utility.js");
	loadScript("Business/Main/VirtualDriver/TWIDriver/TWIEngine.js");
	loadScript("Business/Main/VirtualDriver/AudioDriver/AudioEngine.js");
	loadScript("Business/Main/VirtualDriver/AudioDriver/audio_format.js");
	loadScript("Business/Main/VirtualDriver/AudioDriver/PCM_decoder.js");
	loadScript("Business/Main/VirtualDriver/AudioDriver/AudioPlayer.js");
	loadScript("Business/Main/VirtualDriver/AudioDriver/AudioDecoderInterface.js");
	loadScript("Business/Main/VirtualDriver/TWIDriver/TWIProcessor.js");
	//loadScript("Business/Main/VirtualDriver/Usb/UsbEngine.js");
	//loadScript("Business/Main/VirtualDriver/Usb/byteReader.js");
	//loadScript("Business/Main/VirtualDriver/Usb/descriptors.js");
	//loadScript("Business/Main/VirtualDriver/Usb/transfers.js");
	loadScript("Business/ModuleWrapper/TWIWrapper.js");
	loadScript("Business/ModuleWrapper/IcaThreadWrapper.js");
	loadScript("Business/ModuleWrapper/UiWrapper.js");
	loadScript("Business/ModuleWrapper/AudioWrapper.js");
	//loadScript("Business/ModuleWrapper/UsbWrapper.js");
	loadScript("Business/Main/Common/WorkerCommand.js");
	loadScript("Business/Main/Common/ChannalMap.js");
	loadScript("Business/Main/Common/IntHashtable.js");
	loadScript("Business/Main/Common/Error.js");
	HTML5OFFUSCATIONJSASSEMBLERENDTEB;
	loadThirdPartyScript("Compiled/speex.js");
	loadThirdPartyScript("Compiled/vorbis.js");
	var uiWrapper = new UiWrapper(null);
	var icaWrapper = new IcaThreadWrapper(uiWrapper);
	uiWrapper.setIcaWrapper(icaWrapper);
	var twiWrapper ;
	var audioWrapper ;
	//var usbWrapper;
	uiWrapper.initialize(THREADCOMMAND.INIT_ENGINE, self);
	icaWrapper.initialize(THREADCOMMAND.INIT_ENGINE, self);
	
	function onMessage(event) {
		var data = event.data;
		switch( data.destination ) {
			case DRIVERID.ID_TWI:
				twiWrapper.processSelfWrapperCmd(data);
				break;
			case DRIVERID.ID_AUDIO:
				audioWrapper.processSelfWrapperCmd(data);
				break;
			/*case DRIVERID.ID_USB:
		        usbWrapper.processSelfWrapperCmd(data);
		        break;*/
		    case DRIVERID.ID_UI:
		    	switch(data.cmd ){
			    	case WorkerCommand.NOTIFY_RESOLUTION_CHANGE:
			    	if(typeof UiControls !== 'undefined' && UiControls.ResolutionUtility){
			    		UiControls.ResolutionUtility.set(data.type ,data.data);
			    	}
			    	break;
			    	default:
			    		uiWrapper.processSelfWrapperCmd(data);
		    		break;
		    	}
			default:
				handleOtherCommand(data);
		}
	}
	
	function handleOtherCommand(data) {
		if (data.cmd == THREADCOMMAND.INIT_ENGINE) {
			initializeVC(data);
		}
	}
	
	function initializeVC(data) {
		if (data.streamname == "CTXCAM ") {
			audioWrapper = new AudioWrapper(null, icaWrapper);
			audioWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null, data.config);
			//have to implement other command for initializing audio player		
			audioWrapper.initialize(THREADCOMMAND.INIT_AUDIOPLAYER, self);
		} else if (data.streamname == "CTXTWI\0") {
			twiWrapper = new TWIWrapper(null, icaWrapper);
			twiWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null);
		}
		/*else if (data.streamname == "CTXGUSB") {
		    usbWrapper = new UsbWrapper(uiWrapper, icaWrapper);
		    console.log("initializing usbwrapper");
		    usbWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null);
		    console.log("after initializing usbwrapper");
		}*/
	}
	
	self.addEventListener('message', onMessage, false);
}