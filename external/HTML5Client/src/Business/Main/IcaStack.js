function ICAStack( icaData1 , callBackWrapper , width , height )
{
	var icaDisplay				= null ;
	var uiModule				= null ;	
	var icaData = icaData1 ;
	var addressInfo = Utility.getAddressInfo(icaData);	
	uiModule = new UIModule();
	icaDisplay = new ICADisplay( width ,height, icaData["DesiredColor"]);		
	var myself = this;
	this.uiModule = uiModule;
	var supported_channel = new Array(0) ;
	// ------------------------------
	// Construct a Winstation Driver.
	// ------------------------------
	this.wsDriver = new WinstationDriver( callBackWrapper );
	this.wsDriver.IcaStackControl = this;
	this.wsDriver.SetLaunchData(icaData);
	var customVCInfo = [];

	// Set WinStattion driver in Display as it needs to send mouse/keyboard events.
	//icaFrame.SetWinstationDriver(this.wsDriver);

	// -----------------------------
	// Construct a Transport Driver.
	// -----------------------------
    this.transportDriver = new TransportDriver(addressInfo, icaData , callBackWrapper);
	// -------------------------------
	// Construct the Protocol Drivers.
	// -------------------------------
	this.pdCount = 2;
	this.protocolDrivers = [];
	this.protocolDriversStack = [];
	var Encryption = Utility.getEncryptionInfo(icaData);
	this.protocolDrivers[0] = new RFrameProtocolDriver(callBackWrapper);
	this.protocolDriversStack[0] = new RFrameProtocolDriverStack();
	if(Encryption == null){
        writeHTML5Log(0,"SESSION:|:ICA:|:Encryption level : Basic");
		this.protocolDrivers[1] = new EncryptProtocolDriver(callBackWrapper);
		this.protocolDriversStack[1] = new EncryptProtocolDriverStack();
	} else {
		CEIP.add('secureIca:used', true);
        writeHTML5Log(0,"SESSION:|:ICA:|:Encryption level :  Encryption");
		this.protocolDrivers[1] = new SecureICAProtocolDriver(Encryption);
		this.protocolDriversStack[1] = new SecureICAProtocolDriverStack(this.protocolDrivers[1]);
	}

	this.GetWinstationDriver = function getWinstationDriver()
	{
		return this.wsDriver;
	};
	
	var newWidth = 0;
	var newHeight = 0;

	// ------------------------------
	// Construct the Virtual Drivers.
	// ------------------------------
	this.virtualDrivers = [];
	
	function createRequiredVirtualChannel() {	
		// Create Thinwire VC
		myself.thinwire = new ThinWireStack();
		myself.virtualDrivers[myself.vdCount++] = myself.thinwire;
		myself.thinwire.SetDisplay(icaDisplay);//make a dummy frame with width and height
	}
	
	function createOptionalVirtualChannel( )
	{		
		if( supported_channel["CTXTWI\0"] == true )
		   {
		   		myself.virtualDrivers[myself.vdCount++] = new TWIStack();
		   }
		if( supported_channel["CTXCLIP"] == true )
		   {
		   		myself.virtualDrivers[myself.vdCount++] = new ClipBoardStack();
		   }	
		if( supported_channel["CTXCAM "] == true )
		   {
		   		myself.audio = new  AudioStack();
		   		myself.virtualDrivers[myself.vdCount++] = myself.audio;
		   }
		  if( supported_channel["CTXCTL "] == true )
		   {
		   		myself.ctlStack = new CTLStack();
		   		myself.virtualDrivers[myself.vdCount++] = myself.ctlStack;
		   }
		  if( supported_channel["CTXEUEM"] == true )
		   {
				myself.virtualDrivers[myself.vdCount++] = new EuemStack();
		   }
		  if( supported_channel["CTXFILE"] == true )
		   {
		   		myself.fileStack = new FileStack();
		   		myself.virtualDrivers[myself.vdCount++] = myself.fileStack;
		   }
		  if( supported_channel["CTXMM  "] == true && HTML5Interface.ChromeNacl.isFeatureEnabled('video'))
		   {
           		myself.virtualDrivers[myself.vdCount++] = new VdmmStack();				
		   }
		   if( supported_channel["CTXCPM "] == true )
		   {
				myself.virtualDrivers[myself.vdCount++]  = new PrinterStack( );		   	
		   }
		     if( supported_channel["CTXCCM "] == true && isChromeOS == true && g.environment.receiver.isChromeApp == true)
		   {
				myself.virtualDrivers[myself.vdCount++]  = new SerialStack( );		   	
		   }
		if (supported_channel["CTXGUSB"] == true) //USB
		  {
		      myself.virtualDrivers[myself.vdCount++] = new UsbStack();
		  }
		   if (supported_channel["CTXMOB"] == true)
		  {
		      myself.virtualDrivers[myself.vdCount++] = new MRVCStack();
		  } 
		  if( supported_channel["CTXMTCH"] == true )
		   {
		   		myself.virtualDrivers[myself.vdCount++] = new MultiTouchStack();
			}
			  if( supported_channel["CTXSCRD"] == true && isChromeOS == true && g.environment.receiver.isChromeApp == true)
		   {
		   		myself.scardStack = new SCardStack();
		   		myself.virtualDrivers[myself.vdCount++] = myself.scardStack;
		   }
		  
	}
	
	
	

	var linkInput = function(provider, consumer)
	{
		provider.SetDataConsumer(consumer);
	};

	var linkOutput = function(writer, stream)
	{
		writer.SetWriteStream(stream);
	};

	var linkWinstationDriverInput = function(provider, wsDriver)
	{
		var wdStream = new WdStream();
		var wdDispatcher = new WdDispatcher(wsDriver);
		var highThroughput = new HighThroughputExtractor();
		var expander = new Expander();

		highThroughput.SetDispatcher(wdDispatcher);
		highThroughput.setWinStationDriver(wsDriver);
        provider.SetDataConsumer(highThroughput);
		highThroughput.SetDataConsumer(expander);
		expander.setDataConsumer(wdDispatcher);

        wsDriver.setHighThroughputExtractor(highThroughput);

		wdDispatcher.SetDataConsumer(wdStream);
		wsDriver.setExpander(expander);
		wsDriver.WdStream = wdStream;
	};

	var linkWinstationDriverOutput = function(stream, wsDriver)
	{
		wsDriver.SetWriteStream(stream);
	};

	// -------------------------------------------
	// Link the stack in the input (up) direction.
	// -------------------------------------------
	var provider = this.transportDriver;
	var consumer;

	// Link in the Protocol Drivers.
	for (var i = 0;  i < this.pdCount;  ++i) {
		consumer = this.protocolDrivers[i];
		linkInput(provider, consumer);
		provider = this.protocolDrivers[i];
	}

	// Link in the Winstation Driver etc.
	linkWinstationDriverInput(provider, this.wsDriver);


	// ----------------------------------------------
	// Link the stack in the output (down) direction.
	// ----------------------------------------------
	var stream = this.transportDriver;
	var writer;

	// Link in the Protocol Drivers.
	for (var i = 0;  i < this.pdCount;  ++i) {
		writer = this.protocolDrivers[i];
		linkOutput(writer, stream);
		stream = this.protocolDrivers[i];
	}

	// Link in the Winstation Driver etc.
	linkWinstationDriverOutput(stream, this.wsDriver);


	// Let the WinstationDriver know about the modules it needs to know about.
	this.wsDriver.TransportDriver = this.transportDriver;
	this.SupportedChannel = function ( channelName )
	{
		writeHTML5Log(0,"SESSION:|:ICA:|:CHANNEL:|:supported channel" + channelName);
		supported_channel[channelName] = true ;
	};
	this.GetIcaModules = function getIcaModules()
	{
		this.vdCount = 0;
		var length = 1 + 1 + this.pdCount + this.vdCount + 1; // WD + TD + PDs + VDs + UI
		var array = [];
		var i = 0;

		// Add Winstation Driver
		array[i++] = this.wsDriver;

		// Add Transport Driver
		array[i++] = this.transportDriver;

		// Add Protocol Drivers
		for (; i < (2 + this.pdCount); ++i) {
			array[i] = this.protocolDriversStack[i - 2];
		}

		// Add Virtual Drivers
		createRequiredVirtualChannel();
		createOptionalVirtualChannel( );
		createCustomVirtualChannel();
		for (; i < (2 + this.pdCount + this.vdCount); ++i) {
			array[i] = this.virtualDrivers[i - 2 - this.pdCount];
		}

		// Add in UI module.
		array[i] = this.uiModule;

		return array;
	};

	this.ResetProtocolDrivers = function resetProtocolDrivers()
	{
		for (var i = 0;  i < this.pdCount;  ++i) {
			this.protocolDrivers[i].Reset();
		}
	};

	this.EnableProtocolDrivers = function enableProtocolDrivers()
	{
		for (var i = 0;  i < this.pdCount;  ++i) {
			this.protocolDrivers[i].SetEnabled(true);
		}
	};
	this.CloseConnection = function closeConnection(reason)
	{

		if( this.wsDriver !=null && this.transportDriver !=null)
		    this.wsDriver.EndWriting(reason);
		    
		var data = new Object();
    		data.cmd = WorkerCommand11.CMD_ENDWRITING;
		data.msg = reason;
   		self.postMessage(data);
	};

	this.start = function start( )
	{
		// Start all the virtual channel threads first.
		// Let's start the transport driver which will start the connect process.
		this.transportDriver.Connect(addressInfo);
	};
	this.setDisplayInfo = function(displayInfo){

	};
	this.setCustomVCInfo = function(obj){
		customVCInfo = obj;
	};
	function ICADisplay(w, h, c)
	{
		this.width = w;
		this.height = h;
		this.color = c;
	}
	function createCustomVirtualChannel(){
		for(var i=0;i<customVCInfo.length;i++){					
			myself.virtualDrivers[myself.vdCount++] = new CustomVCStack(customVCInfo[i]);
		}
	}
}
