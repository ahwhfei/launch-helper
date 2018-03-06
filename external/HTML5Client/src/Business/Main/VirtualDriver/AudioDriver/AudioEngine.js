function AudioDeviceType() { };
AudioDeviceType.Audio_Out = 1;
AudioDeviceType.Audio_In = 2;
var INPUT_PERIOD_INTERVAL = 10;
function AudioDeviceState() { };
AudioDeviceState.Closed = 0;
AudioDeviceState.Open = 1;
AudioDeviceState.Error = 2;

var requestcount = 0;
var sentcount = 0;

function AudioDevice(type, id, engine)
{
    var self = this;
    this.type = type;
    this.localDeviceId = 0;
    this.deviceId = id;
    this.audioFormat = null;
    this.converter = null;

    this.deviceBuffers = null;      //Array of buffers
    this.currentBuffersCount = 0;

    this.cmdQueue = null;
    this.cmdQueueSize = 0;

    this.deviceName = null;
    this.deviceState = AudioDeviceState.Closed;
    this.blockAlign = 0;
    this.dataItemsToAck = 0;
    this.controlValue = new Int32Array(3);

    this.devInstance = null;
    this.audioEngine = engine;
    this.timer = null;
    this.cmdToAck = 0
    this.dataToAck = 0;
}

function AudioEngine(callback) {
	var callbackWrapper = callback;
	var CAM_C2H_BASE = 0x80;
    var CAM_H2C_BASE = 0x00;
	var audioengine = this;
    var INIT            = 0x00;
    var OPEN            = 0x01;
    var CLOSE           = 0x02;
    var WRITE           = 0x03;
    var RESET_ACK       = 0x04;
    var REQUEST_CAPINFO = 0x05;
	
 	var READ_REQUEST = (CAM_H2C_BASE+0x06);
    var START_RECORD    =(CAM_H2C_BASE+ 0x07);
    var STOP_RECORD = (CAM_H2C_BASE + 0x08);
    var RESET_RECORD = (CAM_H2C_BASE+ 0x09);
    var SET_CONTROL = (CAM_H2C_BASE+ 0x0A);
    var CONTROL_UPDATE = (CAM_C2H_BASE + 0x05);

    var RESOURCE_ACK      = 0x80;
    var RESOURCE_COMMANDS = 0x0001;
    var RESOURCE_DATA = 0x0002;
    var RESET = (CAM_C2H_BASE + 0x01);
    var CAPABILITY_INFO = 0x82;
    var READ_RESPONSE = (CAM_C2H_BASE + 0x03);
    var OPEN_RESPONSE = (CAM_C2H_BASE + 0x04);        

    var CAM_FLOW_CONTROL_VERSION = 1;
    var COMMAND_BUFFER_COUNT = audio_COMMAND_BUFFER_COUNT;
    var DATA_BUFFER_COUNT    = audio_DATA_BUFFER_COUNT;
    var MAX_DATA_SIZE = audio_MAX_DATA_SIZE;
    var audioDecoderInterface = null;
	var myself = this;	
	var vStream ;
	var streamName = "CTXCAM ";
	var streamSize= 0x1000;
	var audioFormat;
	var  no_of_channel = 2 , sampleRate = 44100  , bitsPersample = 16  ; //default setting
	var playerType = null ;
	var mode;
	var hostCamVersion = 1;
	var audioConfig;
	
	var AudioDeviceList = new Array();

    //Protocol device types
    var CAM_DEVICE_NONE	= 0x00;
    var CAM_DEVICE_PCM_OUT = 0x01;
    var CAM_DEVICE_PCM_IN = 0x02;

	var createVirtualStream = function(streamName,streamSize)
    {
      var chnl = ChannalMap.virtualChannalMap[streamName];
        var stream = new VirtualStream(chnl, callbackWrapper, streamSize);
        return stream;
    };
    
	 this.getStreamName = function()
	 {
	 	return streamName;
    };
	this.setqueue =  function( tqueue )
	{ 
		queue = tqueue ;
	};
	var initialize = function ( ) 
    {
		if(audioDecoderInterface == null)
		{
           audioDecoderInterface = new AudioDecoderInterface(callbackWrapper);
        }
        
        var audioInput = new AudioDevice(AudioDeviceType.Audio_In, 2, audioengine); //Hard coded IDs as of now
        var audioOutput = new AudioDevice(AudioDeviceType.Audio_Out, 1, audioengine); //Hard coded IDs as of now
        AudioDeviceList[0] = audioOutput;
        AudioDeviceList[1] = audioInput;
    };

	var findDevice = function (deviceId)
    {
        var device = null;
        for (var i = 0 ; i < AudioDeviceList.length; i++) {
            if (AudioDeviceList[i].deviceId == deviceId) {
                device = AudioDeviceList[i];
                break;
            }
        }
        return device;
    }
	
	this.EndWriting = function endWriting(reason)
	{
	
	};

	function sendFlowControl (commands, data)
	{
		var stream;
		var bytes;
		
		if( commands > 0  )
		{
			stream = new OffsetableOutputStream();
			stream.WriteByte([RESOURCE_ACK],0,1);
			ByteWriter.WriteInt16ToStream(stream, RESOURCE_COMMANDS);
			ByteWriter.WriteInt16ToStream(stream, commands);
			bytes = stream.ToByteArray();
			vStream.WriteByte(bytes, 0, bytes.length);
		}
		
	 if( data > 0)
		{
			stream = new OffsetableOutputStream();
			stream.WriteByte([RESOURCE_ACK],0,1);
			ByteWriter.WriteInt16ToStream(stream, RESOURCE_DATA);
			ByteWriter.WriteInt16ToStream(stream, data);
			bytes = stream.ToByteArray();
			vStream.WriteByte(bytes, 0, bytes.length);
		}
	}
	
	var initializeDevice = function (device, iFormat, wSubFormat)
    {
        var retval = true;
        console.log("Open format " + iFormat + ", subformat " + wSubFormat);
        switch (iFormat) {
            case FORMAT_LINEAR_PCM: // linear pcm data 
                device.audioFormat = FORMAT_LINEAR_PCM;
                var samplebit = wSubFormat & Audio_SUBFMT_LINEAR_PCM_MASK_RATE;
                switch (samplebit) {
                    case Audio_SUBFMT_LINEAR_PCM_8kHz:
                        device.sampleRate = Audio_LINEAR_PCM_8kHz;
                        break;
                    case Audio_SUBFMT_LINEAR_PCM_11kHz:
                        device.sampleRate = Audio_LINEAR_PCM_11kHz;
                        break;
                    case Audio_SUBFMT_LINEAR_PCM_22kHz:
                        device.sampleRate = Audio_LINEAR_PCM_22kHz;
                        break;
                    case Audio_SUBFMT_LINEAR_PCM_44kHz:
                        device.sampleRate = Audio_LINEAR_PCM_44kHz;
                        break;
                    default:
                        device.sampleRate = Audio_LINEAR_PCM_44kHz;
                }

                var channelbit = wSubFormat & Audio_SUBFMT_LINEAR_PCM_MASK_CHANNELS;
                device.no_of_channel = Audio_LINEAR_PCM_STEREO;
                if (channelbit == Audio_SUBFMT_LINEAR_PCM_MONO)
                    device.no_of_channel = Audio_LINEAR_PCM_MONO;
                var no_of_bitpersamplebit = wSubFormat & Audio_SUBFMT_LINEAR_PCM_MASK_DEPTH;
                device.bitsPersample = Audio_LINEAR_PCM_16_BIT;
                if (no_of_bitpersamplebit == Audio_SUBFMT_LINEAR_PCM_8_BIT)
                    device.bitsPersample = Audio_LINEAR_PCM_8_BIT;
                break;

            case FORMAT_CTX_VORBIS:
                device.audioFormat = FORMAT_CTX_VORBIS;
                sampleRate = audio_vorbis_samplerate;
                var channelbit = wSubFormat & Audio_SUBFMT_CTX_VORBIS_MASK_CHANNELS;
                // Audio_VORBIS_STEREO 
                device.no_of_channel = 2;
                if (channelbit == Audio_SUBFMT_CTX_VORBIS_MONO)
                    device.no_of_channel = 1;
                break;

            case FORMAT_CTX_SPEEX:
                device.audioFormat = FORMAT_CTX_SPEEX;
                mode = wSubFormat & Audio_SUBFMT_CTX_SPEEX_MASK_BAND;
                if (mode == Audio_SUBFMT_CTX_SPEEX_NARROWBAND) {
                    // Narrowband mode supports 8KHz input audio
                    device.sampleRate = 8000;
                }
                else {
                    // Narrowband mode supports 16KHz input audio
                    device.sampleRate = 16000;
                }
                var channelBit = wSubFormat & Audio_SUBFMT_CTX_SPEEX_MASK_CHANNELS;
                device.no_of_channel = 2;
                if (channelBit == Audio_SUBFMT_CTX_SPEEX_MONO)
                    device.no_of_channel = 1;
                break;

            default:
                //Put device into ERROR state and report back with RESET
                device.deviceState = AudioDeviceState.Error;
                //Tbd Issue a reset
                retval = false;
                break;

        }
     
        callbackWrapper.sendInputCommand({
	        'cmd': OPEN, //CAM_COMMAND_OPEN; 
	        'destination': DRIVERID.ID_AUDIO,
            'sampleRate': device.sampleRate,
            'channels': device.no_of_channel
	    });
        
        device.deviceState = AudioDeviceState.Open;
       
        return retval;
    };

	 var doOpenInit = function(iFormat, wSubFormat)
 	{
 		switch( iFormat )
 		 {
 		 case FORMAT_LINEAR_PCM: // linear pcm data 
 		    audioFormat = FORMAT_LINEAR_PCM ;
 		   	var samplebit = wSubFormat & Audio_SUBFMT_LINEAR_PCM_MASK_RATE ;
 		   	switch( samplebit )
 		   	{
 		   	 case Audio_SUBFMT_LINEAR_PCM_8kHz:
 		   	         sampleRate = Audio_LINEAR_PCM_8kHz ;
 		   	        break;
 		   	 case Audio_SUBFMT_LINEAR_PCM_11kHz:
 		   	        sampleRate = Audio_LINEAR_PCM_11kHz ;
 		   	        break;
 		   	 case Audio_SUBFMT_LINEAR_PCM_22kHz:
 		   	        sampleRate = Audio_LINEAR_PCM_22kHz ;
 		   	        break;
 		   	 case Audio_SUBFMT_LINEAR_PCM_44kHz:
 		   	         sampleRate = Audio_LINEAR_PCM_44kHz ;
 		   	        break;
 		   	 default:
 		   	        sampleRate = Audio_LINEAR_PCM_44kHz ;
 		   	} 
 		   	 
 		    var channelbit = wSubFormat &  Audio_SUBFMT_LINEAR_PCM_MASK_CHANNELS ;
 		    no_of_channel = Audio_LINEAR_PCM_STEREO ;
 		    if( channelbit == Audio_SUBFMT_LINEAR_PCM_MONO )
 		    	no_of_channel = Audio_LINEAR_PCM_MONO ;
 		    var no_of_bitpersamplebit = wSubFormat & Audio_SUBFMT_LINEAR_PCM_MASK_DEPTH  ;
 		    bitsPersample = Audio_LINEAR_PCM_16_BIT ;
 		    if( no_of_bitpersamplebit == Audio_SUBFMT_LINEAR_PCM_8_BIT )
 		       bitsPersample = Audio_LINEAR_PCM_8_BIT ; 
 		    break ;
 			case FORMAT_CTX_VORBIS:
 				audioFormat = FORMAT_CTX_VORBIS;
				sampleRate = audio_vorbis_samplerate;
				var channelbit = wSubFormat &  Audio_SUBFMT_CTX_VORBIS_MASK_CHANNELS;
				// Audio_VORBIS_STEREO 
				no_of_channel =2 ;
				if( channelbit == Audio_SUBFMT_CTX_VORBIS_MONO )
					no_of_channel = 1  ;
			break;
			case FORMAT_CTX_SPEEX :
				audioFormat = FORMAT_CTX_SPEEX;
				 mode = wSubFormat &  Audio_SUBFMT_CTX_SPEEX_MASK_BAND ;
				if(mode == Audio_SUBFMT_CTX_SPEEX_NARROWBAND)
					{
						// Narrowband mode supports 8KHz input audio
						sampleRate = 8000;
					}
					else
						{
							// Narrowband mode supports 16KHz input audio
							sampleRate = 16000;
						}
				var channelBit = wSubFormat &  Audio_SUBFMT_CTX_SPEEX_MASK_CHANNELS;
				no_of_channel =2 ;
				if( channelBit == Audio_SUBFMT_CTX_SPEEX_MONO )
					no_of_channel = 1  ;
				break;
 		   
 		}
 		
 		audioDecoderInterface.initializeDecodeInfo(no_of_channel , sampleRate, bitsPersample,audioFormat,playerType,mode);
 		callbackWrapper.setPlayerConfig( no_of_channel , sampleRate,audioConfig);
 		
 		
 		
 	};
	this.setAudioConfig = function(audioConfig1)
	{
		audioConfig = audioConfig1;
		//initializeDecoderInterface();
        initialize();
		audioDecoderInterface.setAudioConfig(audioConfig1);
	};
	var getOpenPacket = function()
	{
		var deviceId = vStream.ReadUInt8();
		var iFormat = vStream.ReadUInt16();
		var wSubFormat = vStream.ReadUInt16();
		var extra1 = vStream.ReadUInt8();
		var extra2 = vStream.ReadUInt8();
		var extra3 = vStream.ReadUInt8();
		var extra4 = vStream.ReadUInt8();
		var device = findDevice(deviceId);
        var result;
        if (device !== null) {
            if (device.type == AudioDeviceType.Audio_Out) {
                doOpenInit(iFormat, wSubFormat);
                sendFlowControl(1, 0);
            }
            else if (device.type == AudioDeviceType.Audio_In) {
                result = initializeDevice(device, iFormat, wSubFormat);
            }
        }
    };

    function getClosePacket(command) {
        var deviceId = vStream.ReadUInt8();

        var device = findDevice(deviceId);
        if (device !== null) {
            if (device.type == AudioDeviceType.Audio_Out) {
               device.deviceState = AudioDeviceState.Closed;
            } else {
                callbackWrapper.sendInputCommand({
                    'cmd': command});
            }
        }
        sendFlowControl(1, 0);
    };

	
	var getWritePacket = function () {
        var deviceId = vStream.ReadUInt8();
        var device = findDevice(deviceId);

        var offset = vStream.ReadUInt16();
        var numBytes = vStream.ReadUInt16();
        vStream.WaitForSpace(numBytes);
        vStream.SkipByte(2);

        if (offset > 8) {
            offset -= 8;
            vStream.SkipByte(offset);
        }

        var audioBuffer = new Uint8Array(numBytes);
        vStream.ReadBytes(audioBuffer, 0, numBytes);

        if (device !== null) {
            if (device.type == AudioDeviceType.Audio_In) {
                device.deviceState = AudioDeviceState.Error;

                //tbd - Set this in error and issue a reset response
                var reason = 0x03; //tbd
                sendResetDevice(deviceId, reason);
                sendFlowControl(1, 1);
                return;
            }
        }
        sendFlowControl(1, 1);
        try {
            audioDecoderInterface.processAudioData(audioBuffer);
        }
        catch (error) { 
        
        }
    };
	this.SetStack = function  (virtualStreamSupplier)
	{
		vStream = createVirtualStream(streamName,streamSize);
	      return vStream;
	};
	var isUnderstoodFormat = function(formatID, subFormat)
	{
		try {
			var support_array = audio_support_array[formatID] ;
			var data_support_array = in_audioformatsubformatArray[formatID];
			if( (support_array == null) || (data_support_array == null)||(support_array == undefined ) || (data_support_array == undefined )  )
			 return false ;
			var len = support_array.length ;
		
			var temp = false ;
			for ( var i = 0 ; i < len ; i++ )
			{
				if( data_support_array[support_array[i]] == subFormat  ){
					
					temp = true;
					break ;
				}
			}
			return temp;
		}catch(error)
		  {
		  	return false ;
		  }
	};
	var sendRequestCapInfo = function()
	{
		var deviceId = vStream.ReadUInt8();
        var offset   = vStream.ReadUInt16();
        var count    = vStream.ReadUInt16();
        var ourCount = 0;

        console.log("Device Id " + deviceId + ", count " + count);
        var device = findDevice(deviceId);

        if (offset > 6) {
            offset -= 6;
            vStream.SkipByte(offset);
        }

        var format = new Int32Array(count);
        var subformat = new Int32Array(count);
		
        for (var i = 0;  i < count;  i++) {
            format[i] = vStream.ReadUInt16();
            subformat[i] = vStream.ReadUInt16();
            //tbd - hard coded 44.1k 16 bit stereo
            //change it to be flexible with the capacity tos convert un and down from what audiocontext supports
            //One instance of audiocontext should be opened at the start of the session
            //and should be used to query the capabiltity of the device
            //same isntance should be used to operate the input audio device.
            //console.log("Format " + format[i]);
            //console.log("Subformat " + subformat[i]);
            
            
            if (device !== null && device.type == AudioDeviceType.Audio_In)
            {
                if (format[i] == FORMAT_CTX_SPEEX && (subformat[i] & Audio_SUBFMT_CTX_SPEEX_MONO)) { // && subformat[i] == PCM_44K_16B_STER) {
                // if (format[i] == FORMAT_LINEAR_PCM && subformat[i] == PCM_44K_16B_MONO) {
                    if (isUnderstoodFormat(format[i], subformat[i])) {
                        ourCount++;
                    }
                }
            }
            else {
                if (isUnderstoodFormat(format[i], subformat[i])) {
                    ourCount++;
                }
            }
        }
        var stream = new OffsetableOutputStream();
        stream.WriteByte(CAPABILITY_INFO);
        stream.WriteByte(deviceId);

        // Offset to format ID's.
		ByteWriter.WriteInt16ToStream(stream, 0x06);

        // Number of format ID's.
        ByteWriter.WriteInt16ToStream(stream, ourCount);
        for (var i = 0; i < count; i++) {
            //TBd - hard coded as of now
            if (device !== null && device.type == AudioDeviceType.Audio_In)
            {
                if (format[i] == FORMAT_CTX_SPEEX && (subformat[i] & Audio_SUBFMT_CTX_SPEEX_MONO)) { // && subformat[i] == PCM_44K_16B_STER) {
                //if (format[i] == FORMAT_LINEAR_PCM && subformat[i] == PCM_44K_16B_MONO) {
                    if (isUnderstoodFormat(format[i], subformat[i])) {
                        if (isUnderstoodFormat(format[i], subformat[i])) {
                            ByteWriter.WriteInt16ToStream(stream, format[i]);
                            ByteWriter.WriteInt16ToStream(stream, subformat[i]);
                        }
                    }
                }
            }
            else {
                if (isUnderstoodFormat(format[i], subformat[i])) {
                    ByteWriter.WriteInt16ToStream(stream, format[i]);
                    ByteWriter.WriteInt16ToStream(stream, subformat[i]);
                }
            }
        }
        var bytes = stream.ToByteArray();
        vStream.WriteByte(bytes, 0, bytes.length);
        sendFlowControl(1, 1);
	};

    var sendResetDevice = function (deviceId, reason) {
        try {
            var stream = new OffsetableOutputStream();
            stream.WriteByte(RESET);
            stream.WriteByte(deviceId);
            stream.WriteByte(reason);
            var bytes = stream.ToByteArray();
            vStream.WriteByte(bytes, 0, bytes.length);
        }
        catch (error)
        {
            console.log("sendResetDevice error: " + error);
        }            
        //tbd check if flow control is needed
    };

    function processDeviceCommand(command) {
        var deviceId = vStream.ReadUInt8();
        var device = findDevice(deviceId);
        var dataObj = {'cmd': command};
        
        switch(command) {
            case READ_REQUEST:
                var pktSize = vStream.ReadUInt16();
                var pktCount = vStream.ReadUInt16();
                dataObj['count'] = pktCount;
                dataObj['size'] = pktSize;
                break;
                
            default:
                break;
        }
        
        if (device && device.type == AudioDeviceType.Audio_In) {
            callbackWrapper.sendInputCommand(dataObj);
        } else {
            if (device)
                device.deviceState = AudioDeviceState.Error;
            var reason = 0x3;//tbd
            sendResetDevice(deviceId, reason);
        }
        sendFlowControl(1, 0);
    }

    var setControl = function () {
        var deviceId = vStream.ReadUInt8();
        var control = vStream.ReadUInt8();
        vStream.ReadUInt8(); //pad
        var controlValue = vStream.ReadUInt32();
        sendFlowControl(1, 0);
    };


    var getResetAck = function()
    {
        var deviceId = vStream.ReadUInt8();
        var device = findDevice(deviceId);
        if (device !== null) {
            if (device.type == AudioDeviceType.Audio_In) {
                //put device in closed state to be re-opened later
                device.deviceState = AudioDeviceState.Closed;
            }
        }
        sendFlowControl(1, 0);
    };
	
	// for debug
    var commandText = {};
        commandText[INIT] = "INIT";
        commandText[OPEN] = "OPEN";
        commandText[CLOSE] = 'CLOSE';
        commandText[WRITE]= 'WRITE';
        commandText[RESET_ACK]= 'RESET_ACK';
        commandText[REQUEST_CAPINFO]= 'REQUEST_CAPINFO';
        commandText[START_RECORD]= 'START_RECORD';
        commandText[READ_REQUEST]= 'READ_REQUEST';
        commandText[STOP_RECORD]= 'STOP_RECORD';
        commandText[RESET_RECORD]= 'RESET_RECORD';
        commandText[SET_CONTROL]= 'SET_CONTROL';
    
	this.ProcessNextCmd = function()
    {
        var command = vStream.ReadByte();
            //if (command != WRITE)
            //    console.info("AUDIO ", commandText[command]);
            switch (command) {
                case INIT:
                    initialize();
                    var hostCAMVersion = vStream.ReadUInt8();
                    var flowControlVersion = vStream.ReadUInt8();
                    console.log("HOST CAM Version " + hostCAMVersion);
                    console.log("HOST flow control version " + flowControlVersion);
            		sendFlowControl(COMMAND_BUFFER_COUNT, DATA_BUFFER_COUNT);
                    break;
                case OPEN:
                    getOpenPacket();
                    break;
                case CLOSE:
                    getClosePacket(command);
                    break;
                case WRITE:
                    getWritePacket();
                    break;
                case RESET_ACK:
                    getResetAck();
                    break;
                case REQUEST_CAPINFO:
                    sendRequestCapInfo();
                    break;
                    
                case START_RECORD:
                case RESET_RECORD:
                case STOP_RECORD:
                case READ_REQUEST:
                    processDeviceCommand(command);
                    break;
               
                case SET_CONTROL:
                    setControl();
                    break;
                default:
                    //what is this command???
                    sendFlowControl(1, 0);
                    //throw error
            }
       
    };

	this.setPlayerType = function( type )
	{
		playerType = type ;
	};
	this.Run = function run()
	{
		
		prevReadIndex = 0;
		vStream.RegisterCallback(this._Run);
	};
	
	this._Run = function()
	{
		var errorHandle = function() {
			vStream.setReadIndex(prevReadIndex);
		 	vStream.RegisterCallback(myself._Run);
		 	vStream.compact( );
        };
		
		try 
		{
			while (true)
			 {
			      /* Main processing */
			    var result = 0;	
				
				 prevReadIndex = vStream.GetReadIndex();				
				    try
					 {
						result = myself.ProcessNextCmd();
					 }
					catch(error)
					{
						if (error == VirtualStreamError.NO_SPACE_ERROR) {
								errorHandle();
							return;
						}
						else
						{
							throw error;
						}
							}
					prevReadIndex = vStream.GetReadIndex();
			 }
		}
		catch(error)
		{
			throw error;
		}
	};
}