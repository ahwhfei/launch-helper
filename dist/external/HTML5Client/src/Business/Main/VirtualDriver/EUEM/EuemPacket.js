/**
 * Created by rajasekarp on 20-05-2014.
 * EuemPacket helper defines static methods to parse and create stream for
 * various commands supported in EUEM.
 */
function EuemPacketHelper() {}

EuemPacketHelper.headerLength = 0x4;
EuemPacketHelper.capBlockLength = 0x5;

/**
 *
 * @param length
 * @param command
 * @returns {ByteArrayOutputStream}
 * @constructor
 */

/*
 +--------------------------------------+
 |          EUEM HEADER                 |
 +----------------+---------+-----------+
 | ByteCount      | Command | Reserved  |
 | USHORT(2)      | Byte(1) | Byte(1)   |
 +----------------+---------+-----------+
 */

EuemPacketHelper.CreateCommitResponseWithConnectionInfo = function (capabilities, connectionInfo) {
	var connectionPktLen = EuemPacketHelper.CreateConnectionInfoPacketEx(connectionInfo, true, null);
	var buffer = EuemPacketHelper.CreateCommitResponseExtended(capabilities, connectionPktLen.length);
	var bufferInfo = EuemPacketHelper.CreateConnectionInfoPacketEx(connectionInfo, false, buffer);
	return bufferInfo.buffer;
}

EuemPacketHelper.CreateCommitResponse = function WriteHeader(capabilities) {
	return EuemPacketHelper.CreateCommitResponseExtended(capabilities, 0).buffer;
}

EuemPacketHelper.CreateCommitResponseExtended = function WriteHeader(capabilities, extendedLength) {
	var capCount = capabilities.length;
	var length = 0;

	var BufferInfo = {
		buffer: null,
		length: 0
	}

	if (capCount == 0) {
		return;
	}

	length += EuemPacketHelper.headerLength;
	length += 4; //Bind_Response_fields
	var capBlockOffset = length;
	length += (capabilities.length * ( EuemPacketHelper.capBlockLength)); //Cap header length + version

	//Write Header
	var buffer = new Uint8Array(length + extendedLength);
	var offset = ByteWriter.WriteInt16ToBuffer(buffer, 0, length);
	buffer[offset++] = EuemCommands.EUEMVD_BIND_RESPONSE;
	buffer[offset++] = 0; //Reserved

	//Write response  fields
	offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, capBlockOffset); //oCapBlocks (offset from start of the packet)
	buffer[offset++] = capCount;
	buffer[offset++] = 0; //Reserved

	for (var i = 0; i < capCount; i++) {
		offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, EuemPacketHelper.capBlockLength);
		buffer[offset++] = capabilities[i].id;
		buffer[offset++] = 0; //Reserved
		buffer[offset++] = capabilities[i].version;
	}

	BufferInfo.buffer = buffer;
	BufferInfo.length = length;
	return BufferInfo;
}

EuemPacketHelper.ParseBindRequest = function (vStream) {

	//We can safely assume that header will be already processed
	//the stream points to capBlocks
	var capBlockOffset = vStream.ReadUInt16();
	var blockCount = vStream.ReadByte();
	var reserved = vStream.ReadByte();
	var capabilities = [];

	if (blockCount == 0 && reserved != 0) {
		return;
	}

	var i = 0;
	while (i < blockCount) {
		vStream.ReadUInt16();
		var capId = vStream.ReadByte();

		//handle reserved byte
		vStream.ReadByte();

		switch (capId) {
			case EuemConstants.EUEMVD_CAPABILITY_VERSION:
				var capability = new EuemCapability();
				capability.id = capId;
				capability.version = vStream.ReadByte();
				capabilities.push(capability);
				break;
			default :
				break;
		}
		i++;
	}
	return capabilities;
}

EuemPacketHelper.ParseSettingPkt = function (vStream) {
	var settingBlocksOffset = vStream.ReadUInt16();
	var settingBlockCount = vStream.ReadByte();
	if (vStream.ReadByte() !== 0) { //Reserved field
		return; //EUEM etodo log error
	}

	var settings = {
		roundTripPeriod: 0,
		measureOnIdle: false
	}

	for (var i = 0; i < settingBlockCount; i++) {		
		var byteCount = vStream.ReadUInt16() - 2;
		if (vStream.Available() >= byteCount) {
			var settingId = vStream.ReadByte();
			if (vStream.ReadByte() !== 0) { //Reserved field
				return; //EUEM etodo log error
			}
			switch (settingId) {
				case EuemConstants.EUEMVD_SETTINGS_ICA_ROUNDTRIP_PERIOD:
					settings.roundTripPeriod = vStream.ReadUInt16();
					break;
				case EuemConstants.EUEMVD_SETTINGS_ICA_ROUNDTRIP_WHEN_IDLE:
					settings.measureOnIdle = (vStream.ReadByte() == 0) ? false : true;
					break;
			}
		}
	}
	return settings;
}


EuemPacketHelper.CreateConnectionInfoPacketEx = function (connectionInfo, findOnlyLength, bufferInfo) {
	var length = EuemPacketHelper.headerLength;
	length += 16; //(4 + 4 + 2 + 2 + 2 + 2)

	var BufferInfo = {
		buffer: null,
		length: 0
	}

	if (findOnlyLength == true) {
		BufferInfo.length = length +
			connectionInfo.name.length +
			connectionInfo.address.length + 2;
		return BufferInfo;
	}

	var offsetName = length;
	var offsetAddress = offsetName + connectionInfo.name.length + 1;
	length = offsetAddress + connectionInfo.address.length + 1;

	var buffer = 0;
	var offset = 0;
	//Write header
	if (bufferInfo == null || bufferInfo == undefined) {
		buffer = new Uint8Array(length);
	} else {
		buffer = bufferInfo.buffer;
		offset = bufferInfo.length;
	}

	offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, length);
	buffer[offset++] = EuemCommands.EUEMVD_PKT_CONNECTION_ID;
	buffer[offset++] = 0; //Reserved

	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, connectionInfo.sessionId);
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, connectionInfo.timestamp);
	offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, connectionInfo.name.length + 1);
	offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, offsetName);
	offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, connectionInfo.address.length + 1);
	offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, offsetAddress);
	offset = ByteWriter.WriteAsciiStringWithNullEnding(buffer, offset, connectionInfo.name);
	offset = ByteWriter.WriteAsciiStringWithNullEnding(buffer, offset, connectionInfo.address);

	BufferInfo.buffer = buffer;
	BufferInfo.length = length;

	return BufferInfo;
}

EuemPacketHelper.CreateConnectionInfoPacket = function (connectionInfo) {
	var bufferInfo = EuemPacketHelper.CreateConnectionInfoPacketEx(connectionInfo, false, null);
	return bufferInfo.buffer;
}

/**
 *
 * Creates round trip packet
 * @param sequenceId (int)
 *
 */
EuemPacketHelper.CreateRoundTripStartPacket = function (sequenceId) {
	var length = EuemPacketHelper.headerLength;
	length += 2; //RoundtripSequenceId (Byte)

	//Write header
	var buffer = new Uint8Array(length);
	var offset = ByteWriter.WriteInt16ToBuffer(buffer, 0, length);
	buffer[offset++] = EuemCommands.EUEMVD_PKT_ROUNDTRIP_START;
	buffer[offset++] = 0; //Reserved
	buffer[offset++] = sequenceId;

	return buffer;
}

EuemPacketHelper.parseRoundTripAbort = function (vStream) { //VirtualStream
	return vStream.ReadByte(); //RoundtripSequenceId (Byte)
}

EuemPacketHelper.CreateRoundTripResult = function (icaResult) { //Array of RoundTripDuration
	var length = EuemPacketHelper.headerLength;
	length += 9; //4 + 1 + 1 + 2 + 1;

	var durationsOffset = length;
	var durationsByteCount = 5;  //len(DurationLengthMs[ushort]) + len(DurationType[Byte])

	length += (icaResult.durations.length * durationsByteCount);

	//Write header
	var buffer = new Uint8Array(length);
	var offset = ByteWriter.WriteInt16ToBuffer(buffer, 0, length);
	buffer[offset++] = EuemCommands.EUEMVD_PKT_ICA_RESULT;
	buffer[offset++] = 0; //Reserved
	var durationLen = icaResult.durations.length;
	offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, icaResult.roundTripDuration);
	buffer[offset++] = icaResult.sequenceId;
	buffer[offset++] = durationLen;
    offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, durationsOffset);
	buffer[offset++] = durationsByteCount;

	for (var i = 0; i < durationLen; i++) {
		offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, icaResult.durations[i].durationLength);
		buffer[offset++] = icaResult.durations[i].id;
	}
	return buffer;
}

//EUEM todo : AutoReconnect to be implemented

EuemPacketHelper.CreateClientStartupPacket = function (startupInfo) {
	var length = EuemPacketHelper.headerLength;

	/*
	 * Calculate overall for basic info excluding app name lengths, durations
	 * and launch mechanism
	 *  Length = 1 (clientStartFlags) + 1 (Reserved) + 2 (AppNameLength)
	 *                   + 2 (offsettToAppName) + 2 (offsetDuration)
	 *                     + 1 (DurationCount) + 1 (DurationByteCount)
	 *                       + 2 (launchMechanismLength) + 2 (offsetLaunchMechanism)
	 */

	//Incase of XA 6.5, remove the duplicates

	for(var i = 0; i < startupInfo.durations.length; i++) {
		var current = startupInfo.durations[i].id;
		for(var j = startupInfo.durations.length -1; j > i ; j--) {
			if(current == startupInfo.durations[j].id) {
				startupInfo.durations.splice(j,1);
			}
		}
	}

	length += 14;
	var offsetApplicationName = length;
	var appNameLen = startupInfo.appName.length + 1;
	var launchMechanismLen = startupInfo.launchMechanism.length + 1;
	var offsetLauncMechanism = length + appNameLen;
	var offsetDurations = offsetLauncMechanism + launchMechanismLen;
	var durationByteCount = 5;
	var extendedStartupTimes = false;
	var durationCount = startupInfo.durations.length;
	
	if(EuemContext.bindVersion > EuemConstants.INITIAL_RELEASE_VERSION) {
		extendedStartupTimes = true;
		durationCount += 4;
	}
			
	length += (appNameLen + launchMechanismLen + (durationCount * durationByteCount));

	//Write header
	var buffer = new Uint8Array(length);
	var offset = ByteWriter.WriteInt16ToBuffer(buffer, 0, length);
	buffer[offset++] = EuemCommands.EUEMVD_PKT_CLIENT_STARTUP_TIMES;
	buffer[offset++] = 0; //Reserved

	buffer[offset++] = startupInfo.startupFlag;
	buffer[offset++] = 0; //Reserved
	offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, appNameLen);
	offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, offsetApplicationName);
	offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, offsetDurations);
	buffer[offset++] = durationCount;
	buffer[offset++] = durationByteCount;
	offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, launchMechanismLen);
	offset = ByteWriter.WriteInt16ToBuffer(buffer, offset, offsetLauncMechanism);

	offset = ByteWriter.WriteAsciiStringWithNullEnding(buffer, offset, startupInfo.appName);
	offset = ByteWriter.WriteAsciiStringWithNullEnding(buffer, offset, startupInfo.launchMechanism);
	
	if(extendedStartupTimes) {
		var startTime = Utility.SplitLongInt(startupInfo.startSCD);
		startupInfo.durations.push(new EuemDuration(EuemConstants.SCTW_HIGH, startTime.hiBits));
		startupInfo.durations.push(new EuemDuration(EuemConstants.SCTW_LOW, startTime.loBits));

		var currentTime = Utility.SplitLongInt(Date.now());
		startupInfo.durations.push(new EuemDuration(EuemConstants.SCTM_HIGH, currentTime.hiBits));
		startupInfo.durations.push(new EuemDuration(EuemConstants.SCTM_LOW, currentTime.loBits));
	}
	
	for (var i = 0; i < startupInfo.durations.length; i++) {
		offset = ByteWriter.WriteInt32ToBuffer(buffer, offset, startupInfo.durations[i].durationLength);
		buffer[offset++] = startupInfo.durations[i].id;
	}

	return buffer;
};
