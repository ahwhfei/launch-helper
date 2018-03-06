function RFrameProtocolDriverStack( )
{
	
	var MODULE_PARAMETER = new ProtocolDriverParameter("Framing", 1, 2, "PDRFRAME", ProtocolDriverStack.PD_FRAME);	
	var DEFAULT_ENABLED  = false;
	var pd = new ProtocolDriverStack(DEFAULT_ENABLED, MODULE_PARAMETER  );
	this.GetCapabilityList = function() { return pd.GetCapabilityList(); 						};
	this.SetCapabilityList = function(capabilityList) { pd.SetCapabilityList(capabilityList);  	};
	this.GetModuleClass 	= function() { return pd.GetModuleClass();			 		};
	this.GetVersionL 		= function() { return pd.GetVersionL();				 		};
	this.GetVersionH 		= function() { return pd.GetVersionH();				 		};		
	this.GetModuleDate 		= function() { return pd.GetModuleDate();			 		};	
	this.GetHostModuleName 	= function() { return pd.GetHostModuleName();				};	
	this.GetModuleSize 		= function() { return pd.GetModuleSize();			 		};		
	this.GetProtocolClass 	= function() { return pd.GetProtocolClass();				};	
	this.AddInitResponseData = function addInitResponseData(offsetableOutputStream){pd.AddInitResponseData(offsetableOutputStream);};

	
}

function EncryptProtocolDriverStack( defaultEnabled, protocolDriverParameter )
{
	var ENCRYPTION_LEVEL = 1;
	var MODULE_PARAMETER = new ProtocolDriverParameter("Encryption", 1, 1, "PDCRYPT1", ProtocolDriverStack.PD_ENCRYPT);
	var DEFAULT_ENABLED  = false;
	var pd = new ProtocolDriverStack(DEFAULT_ENABLED, MODULE_PARAMETER );
	this.GetCapabilityList = function() { return pd.GetCapabilityList(); 						};
	this.SetCapabilityList = function(capabilityList) { pd.SetCapabilityList(capabilityList);  	};
	this.GetModuleClass 	= function() { return pd.GetModuleClass();			 		};
	this.GetVersionL 		= function() { return pd.GetVersionL();				 		};
	this.GetVersionH 		= function() { return pd.GetVersionH();				 		};
	this.GetHostModuleName 	= function() { return pd.GetHostModuleName();				};	
	this.GetModuleDate 		= function() { return pd.GetModuleDate();			 		};	
	this.GetModuleSize 		= function() { return pd.GetModuleSize();			 		};	
	this.GetProtocolClass 	= function() { return pd.GetProtocolClass();				};
	this.AddInitResponseData = function addInitResponseData(offsetableOutputStream)
	{
		offsetableOutputStream.WriteByte(ENCRYPTION_LEVEL);
	};
}

function SecureICAProtocolDriverStack( secureICAProtocolDriver, protocolDriverParameter )
{
    var ENCRYPTION_LEVEL = 1;
    var MODULE_PARAMETER = new ProtocolDriverParameter("Encryption", 1, 1, "PDCRYPT2", ProtocolDriverStack.PD_ENCRYPT);
    var DEFAULT_ENABLED  = false;
    var pd = new ProtocolDriverStack(DEFAULT_ENABLED, MODULE_PARAMETER );
    this.GetCapabilityList = function() { return pd.GetCapabilityList(); 						};
    this.SetCapabilityList = function(capabilityList) { pd.SetCapabilityList(capabilityList);  	};
    this.GetModuleClass 	= function() { return pd.GetModuleClass();			 		};
    this.GetVersionL 		= function() { return pd.GetVersionL();				 		};
    this.GetVersionH 		= function() { return pd.GetVersionH();				 		};
    this.GetHostModuleName 	= function() { return pd.GetHostModuleName();				};
    this.GetModuleDate 		= function() { return pd.GetModuleDate();			 		};
    this.GetModuleSize 		= function() { return pd.GetModuleSize();			 		};
    this.GetProtocolClass 	= function() { return pd.GetProtocolClass();				};
    this.AddInitResponseData = function addInitResponseData(offsetableOutputStream)
    {
		//console.log("SECURE ICA PROTOCOL DRIVER STACK: ADDING PDCRYPT");
		secureICAProtocolDriver.writeInitResponse(offsetableOutputStream);
    };



}

function ProtocolDriverStack(defaultEnabled, protocolDriverParameter)
	{
		var parameter = protocolDriverParameter ;
		this.GetModuleClass 	= function() { return parameter.Parameter.ModuleClass; 		};
		this.GetVersionL 		= function() { return parameter.Parameter.MinVersion; 		};
		this.GetVersionH 		= function() { return parameter.Parameter.MaxVersion; 		};		
		this.GetHostModuleName 	= function() { return parameter.Parameter.HostModuleName;	};
		this.GetCapabilityList = function() { return null; };
		this.SetCapabilityList = function(capabilityList) {}	;		
		this.GetModuleDate 		= function() { return parameter.Parameter.ModuleDate; 		};		
		this.GetModuleSize 		= function() { return parameter.Parameter.ModuleSize; 		}	;	
		this.GetProtocolClass 	= function() { return parameter.ProtocolClass;				};		
		this.AddInitResponseData = function addInitResponseData(offsetableOutputStream){};
	}
	
/* ProtocolDriverParameter Prototype*/

function ProtocolDriverParameter(displayName, minVersion, maxVersion, hostName, protocolClass)
{
	this.ProtocolClass = protocolClass;
	this.Parameter = new ModuleParameter(displayName, UIModule.PROTOCOL_DRIVER, minVersion, maxVersion, null, hostName, 0);
}

ProtocolDriverStack.PD_FRAME       	=  9;
ProtocolDriverStack.PD_ENCRYPT    	= 11;