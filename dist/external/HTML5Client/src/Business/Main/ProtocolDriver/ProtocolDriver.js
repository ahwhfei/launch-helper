/* ProtocolDriverParameter Prototype*/

function ProtocolDriverParameter(displayName, minVersion, maxVersion, hostName, protocolClass)
{
	this.ProtocolClass = protocolClass;
	this.Parameter = new ModuleParameter(displayName, UIModule.PROTOCOL_DRIVER, minVersion, maxVersion, null, hostName, 0);
}


/* ProtocolDriver Prototype*/

function ProtocolDriver(defaultEnabled, protocolDriverParameter)
{
	var parameter = protocolDriverParameter, dEnabled = defaultEnabled, gEnabled = defaultEnabled;
	var gCharEncoding = SupportedEncoding.UNICODE_ENCODING;

	this.SetEnabled 		= function(enabled) {gEnabled = enabled;					};
	this.GetEnabled 		= function() { return gEnabled;								};
	this.Reset 				= function() { this.SetEnabled(gDefaultEnabled);			};
	
	var WriteStream = null;
	var DataConsumer = null;

	this.EndWriting =function endWriting(reason)
	{
		if(WriteStream != null)
		    WriteStream.EndWriting(reason);
	};
	this.SetDataConsumer = function setDataConsumer(consumer)
	{
		DataConsumer = consumer;
	};

	this.GetDataConsumer = function getDataConsumer()
	{
		return DataConsumer;
	};

	this.SetWriteStream = function setWriteStream(stream)
	{
		WriteStream = stream;
	};

	this.GetWriteStream = function getWriteStream()
	{
		return WriteStream;
	};

}

//ProtocolDriver.PD_NONE          =  0;
//ProtocolDriver.PD_CONSOLE       =  1;
//ProtocolDriver.PD_NETWORK       =  2;
//ProtocolDriver.PD_ASYNC         =  3;
//ProtocolDriver.PD_SECURITY      =  4;
//ProtocolDriver.PD_ISDN          =  5;
//ProtocolDriver.PD_X25           =  6;
//ProtocolDriver.PD_MODEM         =  7;
//ProtocolDriver.PD_OEM_CONNECT   =  8;
ProtocolDriver.PD_FRAME       	=  9;
//ProtocolDriver.PD_RELIABLE      = 10;
ProtocolDriver.PD_ENCRYPT    	= 11;
//ProtocolDriver.PD_COMPRESS      = 12;
//ProtocolDriver.PD_TELNET        = 13;
//ProtocolDriver.PD_OEM_FILTER    = 14;
//ProtocolDriver.PD_NASI          = 15;
//ProtocolDriver.PD_CLASS_MAXIMUM = 16;


/* EncryptProtocolDriver Prototype */

function EncryptProtocolDriver()
{
	var MODULE_PARAMETER = new ProtocolDriverParameter("Encryption", 1, 1, "PDCRYPT1", ProtocolDriver.PD_ENCRYPT);
	var DEFAULT_ENABLED  = false;
	var MAX_PREFIX_SIZE  = 1, MAX_SUFFIX_SIZE  = 0;
	var cryptoProvider = new PdCryptoProvider();
	var pd = new ProtocolDriver(DEFAULT_ENABLED, MODULE_PARAMETER);
	var IsStreamMode = false;
	var IsEncryptOn = false;

    this.EndWriting =function endWriting(reason)
	{
        pd.EndWriting(reason);
	};

	this.SetDataConsumer = function setDataConsumer(consumer)
	{
		pd.SetDataConsumer(consumer);
	};

	this.GetDataConsumer = function getDataConsumer()
	{
		return pd.GetDataConsumer();
	};

	this.SetWriteStream = function setWriteStream(stream)
	{
		pd.SetWriteStream(stream);
	};

	this.GetWriteStream = function getWriteStream()
	{
		return pd.GetWriteStream();
	};

	this.HandleHeaderedPacket = function handleHeaderedPacket(byteData, offset, length)
	{
		var pdDataConsumer = this.GetDataConsumer();

		var header = byteData[offset] & 0xFF;
		offset = offset + 1;
		length = length - 1;

		switch (header) {
			case 0x00:
			pdDataConsumer.consumeData(byteData, offset, length);
				break;
				
			case 0x01:
			cryptoProvider.Decrypt(byteData, offset, length);
			pdDataConsumer.consumeData(byteData, offset, length);
				break;
				
			case 0x02:
			WriteCryptSessionKey();
			IsEncryptOn = true;
				break;
				
			case 0x03:
			case 0x04:
			case 0x05:
			throw ProtocolError.UNKNOWN_PROTOCOL;
				break;

			case 0x06:
			HandleCryptStreamMode(false, byteData, offset, length);
				break;
			
			case 0x07:
			HandleCryptStreamMode(true, byteData, offset, length);
				break;
			
			default:
			throw ProtocolError.UNKNOWN_PROTOCOL;
				break;
		}
	};

	var HandleCryptStreamMode = function handleCryptStreamMode(permanent, byteData, offset, length)
	{
		cryptoProvider.Decrypt(byteData, offset, length);

		var s = "";
		for (var i=0; i<9; ++i)
			s = s + String.fromCharCode(byteData[i+offset+length-9]);

		var response = new Uint8Array(length +1);
		Utility.CopyArray(byteData ,offset ,response,1,length);
		
		cryptoProvider.Encrypt(response, 1, length);
		

		if (permanent == true)
		{
			if (s == "PermCrypt")
			{
				response[0] = 0x07;
				IsStreamMode = true;
				IsEncryptOn = true;
			}
			else
			{
				throw ProtocolError.PROTOCOL_ENCRYPT_INIT_FAILED;
			}
		}
		else
		{
			if (s == "OffCrypt ")
			{
				response[0] = 0x06;
				IsStreamMode = true;
				IsEncryptOn = false;
			}
			else
			{
				throw ProtocolError.PROTOCOL_ENCRYPT_INIT_FAILED;
			}
		}

		var str = pd.GetWriteStream();
		str.WriteByte(response, 0, response.length);
	};

	var WriteCryptSessionKey = function writeCryptSessionKey()
	{
		var packet = new Uint8Array(3);
		packet[0] = 0x04;
		packet[1] = 0x00;
		packet[2] = cryptoProvider.Seed;
		var str = pd.GetWriteStream();
		str.WriteByte(packet, 0, packet.length);
	};

	this.SetEnabled = function setEnabled(value)
	{
		pd.SetEnabled(value);
	};

	this.WriteByte = function writeByte(byteData, offset, length)
	{
		var actualLength = length & 0x3FFF; //Skip first two priority bits	
		if (pd.GetEnabled() == true)
		{
			if (IsStreamMode == true)
			{
				// we don't have to prefix the data with any header.
				if (IsEncryptOn == true)
				{
					cryptoProvider.Encrypt(byteData, offset, actualLength);
				}
			}
			else
			{
				if (offset < 1)
				{
                    temp = new Uint8Array(actualLength + 1);
                    Utility.CopyArray( byteData, offset, temp, 1, actualLength );
                    byteData = temp;
                    offset = 1;
				}

				if (IsEncryptOn == true)
				{
					byteData[offset-1] = 0x01;
					cryptoProvider.Encrypt(byteData, offset, actualLength);
				}
				else
				{
					byteData[offset-1] = 0x00;
				}

				offset = offset - 1;
				length = length + 1;
			}
		}

		var str = pd.GetWriteStream();
		str.WriteByte(byteData, offset, length);

	};

	this.consumeData = function consumeData(byteData, offset, length)
	{
		var pdDataConsumer = pd.GetDataConsumer();

		if (pd.GetEnabled() == true)
		{
			if (IsStreamMode == true)
			{
				if (IsEncryptOn == true)
				{
					cryptoProvider.Decrypt(byteData, offset, length);
				}
				pdDataConsumer.consumeData(byteData, offset, length);
			}
			else
			{
				this.HandleHeaderedPacket(byteData, offset, length);
			}
		}
		else
		{
			pdDataConsumer.consumeData(byteData, offset, length);
		}
	};

	this.SetEnabled 		= function(enabled) {
		pd.SetEnabled(enabled);
		if (enabled == true) {
			cryptoProvider.Reset();
		}
	};
	this.GetEnabled 		= function() { return pd.GetEnabled();						};
	this.Reset 				= function() { pd.SetEnabled(DEFAULT_ENABLED);				};
	
}


/* RFrameProtocolDriver prototype */

function RFrameProtocolDriver()
{
	var MODULE_PARAMETER = new ProtocolDriverParameter("Framing", 1, 2, "PDRFRAME", ProtocolDriver.PD_FRAME);
	var DEFAULT_ENABLED  = false;
	var MAX_PREFIX_SIZE  = 2, MAX_SUFFIX_SIZE  = 0;
	var pd = new ProtocolDriver(DEFAULT_ENABLED, MODULE_PARAMETER);
	var gBufPending = false, gBufLenUnknown = false;
	var gBufOff = 0, gBufLen = 0, gBufLeft = 0, gHeader0 = 0;
	var gBuf = [];

	this.EndWriting =function endWriting(reason)
	{
       pd.EndWriting(reason);
	};


	this.SetDataConsumer = function setDataConsumer(consumer)
	{
		pd.SetDataConsumer(consumer);
	};

	this.GetDataConsumer = function getDataConsumer()
	{
		return pd.GetDataConsumer();
	};

	this.SetWriteStream = function setWriteStream(stream)
	{
		pd.SetWriteStream(stream);
	};

	this.GetWriteStream = function getWriteStream()
	{
		return pd.GetWriteStream();
	};

	this.WriteByte = function writeByte(byteData, offset, length)
	{
		var lenghtWithPriority = length;
		length &= 0x3FFF; //Skip first two bits of last two bytes(Priority bits)		
		if (pd.GetEnabled()==true)
		{
			if (offset < 2) {
				temp = new Uint8Array(length + 2 );
                Utility.CopyArray( byteData, offset, temp, 2, length);
                byteData = temp;
                offset = 2;
			}
			byteData[offset-2] = lenghtWithPriority & 0xFF;
			byteData[offset-1] = (lenghtWithPriority >>> 8) & 0xFF;
			offset = offset - 2;
			length = length + 2;
		}

		var str = pd.GetWriteStream();
		str.WriteByte(byteData, offset, length);
	};

	var pDCounter = 0;

	this.consumeData = function consumeData(byteData, offset, length)
	{
		var pdDataConsumer = this.GetDataConsumer();

		if (pd.GetEnabled()==true)
		{
			var szFrame = 0;
			if (gBufPending == true)
			{
				//console.log("buffer pending");
				if (gBufLenUnknown == true)
				{
					byteData[0] = byteData[0] & 0x3F;
					var dummy = byteData[0] & 0xFF;
					dummy = dummy << 8;
					gBufLen  = gHeader0 | dummy;
					gBufOff  = 0;
					gBufLeft = gBufLen;

					offset = offset + 1;
					length = length - 1;
					gBufLenUnknown = false;
				}

				if (gBufLeft <= length)
				{

					Utility.CopyArray(byteData,offset,gBuf,gBufOff,gBufLeft);
					pdDataConsumer.consumeData(gBuf, 0, gBufLen);
					offset = offset + gBufLeft;
					length = length - gBufLeft;
					gBufPending = false;
				}
				else
				{
					Utility.CopyArray(byteData,offset,gBuf,gBufOff,length);
					gBufOff = gBufOff + length;
					gBufLeft = gBufLeft - length;
					return null;
				}
			}

			while(length != 0)
			{
				if (length >= 2 )
				{
					var dummy1 = byteData[offset++] & 0xFF;
					var dummy2 = byteData[offset] & 0x3F;
					byteData[offset] = byteData[offset++] & 0x3F;
					dummy2 = dummy2 << 8;
					szFrame = dummy1 | dummy2;
					length = length - 2;

					if ( szFrame <= length )
					{
						pdDataConsumer.consumeData(byteData, offset, szFrame);
						offset = offset + szFrame;
						length = length - szFrame;
					}
					else
					{
						//console.log(dummy1 + " | len bytes | " + dummy2);
						gBufPending = true;
						Utility.CopyArray(byteData,offset, gBuf, 0, length );
						gBufLen  = szFrame;
						gBufOff  = length;
						gBufLeft = szFrame - length;
						return null;
					}
				}
				else
				{
					gHeader0 = byteData[offset] & 0xFF;
					gBufLenUnknown = true;
					gBufPending = true;
					return null;
				}
			}

		}
		else // framing disabled:
		{
			pdDataConsumer.consumeData(byteData, offset, length);
		}
	};

	this.SetEnabled 		= function(enabled) {pd.SetEnabled(enabled);				};
	this.GetEnabled 		= function() { return pd.GetEnabled();						};
	this.Reset 				= function() { pd.SetEnabled(DEFAULT_ENABLED);				};
	
}
