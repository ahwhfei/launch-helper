function CapabilityList()
{
	var capabilityList = [];
	var count = 0;

	this.Size = function(){ return count; };

	this.AddCapability = function(capability)
	{
		capabilityList[count] = capability;
		count = count + 1;
	};

	this.AddCapabilityList = function(capList) {	
		if(capList) {	
			capabilityList = capabilityList.concat(capList.GetCapabilityArray());
			count = capabilityList.length;
		}
	}
	
	this.GetCapabilityArray = function() {
		return capabilityList;
	}

	this.GetCapability = function(signature)
	{
		for (var i=count; i--; )
		{
			if (capabilityList[i].gID === signature)
				return capabilityList[i];
		}

		return null;
	};

	this.GetWDBytes = function()
	{
		if (count === 0)
			return null;
		var wdByte = [];
		wdByte[0] = 0;
		wdByte[1] = count & 0xFF;
		wdByte[2] = 4;
		wdByte[3] = 0;
		for (var i=0; i<count; ++i)
		{
			wdByte = wdByte.concat(capabilityList[i].GetBytes());
		}
		return wdByte;
	};

	this.RemoveDuplicates = function()
	{
		for (var i=0; i<capabilityList.length; ++i)
		{
			var chkCap = capabilityList[i];
			for (var j=i+1; j<capabilityList.length; ++j)
			{
				if (chkCap.gID === capabilityList[j].gID)
				{
					capabilityList.splice(j,1);
				}
			}

		}
		count = capabilityList.length;
	};

	/* Packet is byte array and offset is the point from where to read the packets */
	this.ReadWDCapabilityList = function(packet, offset, wdDriver)
	{
		var numCaps = packet[offset+1];
		if (numCaps === 0)
			return null;
		offset = offset + ByteConverter.Byte2ToInt32AtOffset(packet, offset + 2);
		capabilityList = [];
		count = 0;
		var index = offset;
		for (var i = 0; i < numCaps; ++i)
		{
			var byteCount = ByteConverter.Byte2ToInt32AtOffset(packet, index);
			var id = ByteConverter.Byte2ToInt32AtOffset(packet, index + 2);
			var dummy = null;

			if (id === Capability.WD_CAP_ID_LONG_NAME)
			{
				dummy = new LongNameCapability();
			}
			else if (id === Capability.WD_CAP_ID_TIME_ZONE)
			{
				dummy = new TimeZoneCapability();
			}
			else if (id === Capability.WD_CAP_ID_SERVER_VERSION)
			{
				dummy = new ServerVersionCapability(packet, index);
			}
			else if (id === Capability.WD_CAP_ID_CREDENTIALS_PASSING)
			{
				dummy = new CredentialsCapability(packet, index);
			}
			else if (id === Capability.WD_CAP_ID_CHANNEL_MONITORING)
			{
				dummy = new ChannelMonitorCapability(packet, index);
			}
			else if (id === Capability.WD_CAP_ID_HIGH_THROUGHPUT)
			{
				dummy = new HighThroughputCap(packet, index);
			}
			else if (id === Capability.WD_CAP_ID_REDUCERS_SUPPORTED) {

				dummy = new ReducerCap(packet, index);
			}
			else if (id === Capability.WD_CAP_ID_CAPABILITY_EUKS) {
				dummy = new EuksCapability(2, packet, index);
			}
			else if (id === Capability.WD_CAP_ID_SEAMLESS) {
                dummy = new SeamlessCap(packet, index);
			}
			else if(id === Capability.WD_CAP_PACKET_PRIORITY){				
				dummy = new PacketPriority(packet, index, wdDriver);
			}
			else if( id === Capability.WD_CAP_ID_INTELLIMOUSE)
			{
				dummy = new IntelMouseCapability(packet, index);
			}
			else if( id == Capability.WD_CAP_ID_PRT_BW_CTRL)
			{
				dummy = new PrinterBandwidthControl( );
			}
			else if( id == Capability.WD_CAP_ID_WANSCALER_SUPPORT)
			{
				dummy = new WanscalerSupport(packet,index);
			}
			else
			{
				dummy = null;
			}

			if (dummy !== null)
			{
				this.AddCapability(dummy);
			}
			index = index + byteCount;
		}
	};

	/* This function takes input of capability list object only */
	this.NegotiateWithClient = function(clientList)
	{
		if (count === 0)
			return null;
		var result = new CapabilityList();
		for (var i=0; i<count; ++i)
		{
			var hostCap = capabilityList[i];
			var clientCap = clientList.GetCapability(hostCap.gID);
			if (clientCap !== null)
			{
				var newCap = clientCap.Negotiate(hostCap);
				if (newCap !== null)
				{
					result.AddCapability(newCap);
				}
			}
		}
		result.RemoveDuplicates();
		return result;
	};

}


