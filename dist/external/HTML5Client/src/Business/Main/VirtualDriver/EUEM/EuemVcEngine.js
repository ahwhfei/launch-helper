/**
 * Created by rajasekarp on 09-05-2014.
 */
function EuemEngine(callBackWrapper1) {
	var callBackWrapper = callBackWrapper1;
	var vStream;
	var streamName = EuemConstants.EUEM_CHANNEL_NAME;
	var streamSize = 0x2000;

	/**** Round trip specific code starts *****/

	var ROUNDTRIP_SEQ_WINDOW = 16;
	var ROUNDTRIP_SEQ_MASK = ROUNDTRIP_SEQ_WINDOW - 1;
	var ROUNDTRIP_IDLE = 0xffffffff;
	var nextRoundTripSequence = 0;
	var roundTripStartTime = new Array(ROUNDTRIP_SEQ_WINDOW);

	//Euem round trip command
	var EUEM_TRIGGER_FLAG = [0x1, 1];
	var FIRST_GDI_DRAW_FLAG = [0x2, 0];
	var FRAME_CUT_FLAG = [0x4, 2];
	var SEND_TO_WD_FLAG = [0x8, 3];
	var WD_TIGGER_FLAG = [0x10, 4];
	var updateSettings = false;
	var timeout = 60000;
	var sendDuringIdle = false;
	
	//Captures acknowledgement for every RT packet from WD
	var roundTripAck = {
		received : true,
		success : true
	};

	//Called when WD sends acknowledgement
	this.ackReceivedForRT= function(isSuccess) {
		roundTripAck.received = true;
		roundTripAck.success = isSuccess;
	}
	
	//Roundtrip start packet scheduler
	function startRoundTripSequence() {
		if(updateSettings) {
			if (EuemSettings.roundTripPeriod != 0) {
				timeout = EuemSettings.roundTripPeriod * 1000;
				sendDuringIdle = EuemSettings.roundTripWhenIdle;
				if(!sendDuringIdle) {
					roundTripAck.received = true;
					roundTripAck.success = true;
				}
			}
			updateSettings = false;
		}
		if(!sendDuringIdle) {
			if (roundTripAck.received === true) {
				roundTripAck.received = false;
				//Send roundtrip packet only on activity
				sendRTStartOnActivity(roundTripAck.success);
			}
		}else {
			sendRTStart();
		}
		setTimeout(function () {
			startRoundTripSequence();
		}, timeout);
	}

	var cachedPacket = [];
	//Check for previous acknowledgement and try to queue roundtrip packet 
	function sendRTStartOnActivity(isPreviousSuccess) {
		try {
			var buffer = [];
			if(!isPreviousSuccess) {
				//Found no activity for last RT start packet and hence packet was not sent to host.
				//No need to reconstruct the packet just send the cached packet again to WD

				nextRoundTripSequence--;
				buffer = cachedPacket;
			}else {
				buffer = EuemPacketHelper.CreateRoundTripStartPacket(nextRoundTripSequence);
			}			
			var timeNow = Date.now();
			callBackWrapper.checkAndQueueRTWrite(buffer, 0, buffer.length, false);
			roundTripStartTime[nextRoundTripSequence & ROUNDTRIP_SEQ_MASK] = timeNow;
			nextRoundTripSequence = (nextRoundTripSequence + 1) & ROUNDTRIP_SEQ_MASK;
			cachedPacket = buffer;
		} catch (error) {
			console.log("error while sending RT start for sequence " + nextRoundTripSequence);
		}
	}

	//Function to send roundtrip during idle time
	//No need to check and queue for activity in WD, just write like anyother EUEM packet
	//No acknowledgement complications
	function sendRTStart(){
		var buffer = EuemPacketHelper.CreateRoundTripStartPacket(nextRoundTripSequence);
		var timeNow = Date.now();
		vStream.WriteByte(buffer, 0, buffer.length);
		roundTripStartTime[nextRoundTripSequence & ROUNDTRIP_SEQ_MASK] = timeNow;
		nextRoundTripSequence = (nextRoundTripSequence + 1) & ROUNDTRIP_SEQ_MASK;
	}

	function handleRoundTripAbort() {
		var abortedSequence = EuemPacketHelper.parseRoundTripAbort(vStream);
		console.log("Received RT abort for sequence :  " + abortedSequence);
		roundTripStartTime[abortedSequence & ROUNDTRIP_SEQ_MASK] = ROUNDTRIP_IDLE;
	}

	//Receive and process Thinwire metrics 
	this.handleTWFrameMetrics = function (frameMetrics) {
	    if(!dependency.testEnv){
			CEIP.add('euem:used',true);
		}
		function updateMetrics(rtMetrics, mask, field, value) {
			if (mask & field[0]) {
				rtMetrics.durations.push(new EuemDuration(field[1], value));
			}
			return rtMetrics;
		}
		
		var windowIndex = nextRoundTripSequence - frameMetrics.seqId;
		if (windowIndex > ROUNDTRIP_SEQ_WINDOW) {
			return;
		}
		
		windowIndex = nextRoundTripSequence - windowIndex & ROUNDTRIP_SEQ_MASK;
		if (roundTripStartTime[windowIndex] != ROUNDTRIP_IDLE) {
			var rtMetrics = new EuemIcaRoundTripResult();
			rtMetrics.roundTripDuration = Date.now() -
				roundTripStartTime[windowIndex];

			rtMetrics.sequenceId = frameMetrics.seqId;
			rtMetrics = updateMetrics(rtMetrics, frameMetrics.mask, FIRST_GDI_DRAW_FLAG, frameMetrics.firstDrawDelta);
			rtMetrics = updateMetrics(rtMetrics, frameMetrics.mask, EUEM_TRIGGER_FLAG, frameMetrics.euemTriggerDelta);
			rtMetrics = updateMetrics(rtMetrics, frameMetrics.mask, FRAME_CUT_FLAG, frameMetrics.frameCutDelta);
			rtMetrics = updateMetrics(rtMetrics, frameMetrics.mask, SEND_TO_WD_FLAG, frameMetrics.frameSendDelta);
			rtMetrics = updateMetrics(rtMetrics, frameMetrics.mask, WD_TIGGER_FLAG, frameMetrics.wdTriggerDelta);
            console.log("RT : " + rtMetrics.roundTripDuration);
			var buffer = EuemPacketHelper.CreateRoundTripResult(rtMetrics);
			roundTripStartTime[windowIndex] = ROUNDTRIP_IDLE;
			callBackWrapper.checkAndQueueRTWrite(buffer, 0, buffer.length, true);
		}
	};

	/**** Round trip specific code ends *****/


	var createVirtualStream = function (streamName, streamSize) {
		var channelId = ChannalMap.virtualChannalMap[streamName];
		var stream = new VirtualStream(channelId, callBackWrapper, streamSize);
		return stream;
	};

	this.SetStack = function (virtualStreamSupplier) {
		vStream = createVirtualStream(streamName, streamSize);
		return vStream;
	};

	this.EndWriting = function endWriting(reason) {

	};

	this.Initialize = function (profile) {
	};


	this.getStreamName = function () {
		return streamName;
	};

	this.driverStart = function () {
	};


	var prevReadIndex = 0;

	this.Run = function run() {
		prevReadIndex = 0;
		vStream.RegisterCallback(this._Run);
	};

	this._Run = function _run() {

		var errorHandle = function () {
			vStream.setReadIndex(prevReadIndex);
			vStream.allocateSpace();
			vStream.compact();
		};

		try {
			while (vStream.Available() > 0) {
				/* Main processing */
				var result = 0;

				prevReadIndex = vStream.GetReadIndex();
				try {
					result = processNextCmd();
				} catch (error) {
					if (error == VirtualStreamError.NO_SPACE_ERROR) {
						errorHandle();
						return;
					} else {
						console.log(error);
					}

				}

				prevReadIndex = vStream.GetReadIndex();
				//We have used this command data completely safe to shrink virtual stream
				//vStream.shrinkBuffer(prevReadIndex);
			}
		} catch (error) {
			console.log(error);
		}
	};

	/**
	 * Processes the commands as they come over the virtual channel.  This method
	 * is currently designed to run continually in the thread.  This consuming
	 * is synchronized by the vStream which blocks on any read until data is
	 * available.
	 */

	function processNextCmd() {
		var packetSize = vStream.ReadUInt16();

		if (packetSize > vStream.Available() + 2) {
			return;
		}

		var command = vStream.ReadByte();
		//handle Reserved field
		if (vStream.ReadByte() != 0) {
			//EUEM return proper error
			return;
		}

		switch (command) {
			case EuemCommands.EUEMVD_BIND_REQUEST:
				receiveBindRequest();
				break;
			case  EuemCommands.EUEMVD_BIND_COMMIT:
					callBackWrapper.raiseSessionReadyEvent();
					receiveBindCommit();
				break;
			case  EuemCommands.EUEMVD_PKT_SETTINGS:
				receiveSettings();
				break;
			case EuemCommands.EUEMVD_PKT_ROUNDTRIP_ABORT:
				handleRoundTripAbort();
				CEIP.add('euem:used',true);
				break;
			default:
				console.log("Unrecognised EUEM command : " + command);
		}
	};

	function receiveBindRequest() {
		var hostCapabilities = EuemPacketHelper.ParseBindRequest(vStream);

		if(hostCapabilities && hostCapabilities.length > 0) {
			EuemContext.bindVersion = hostCapabilities[0].version;
		}

		var clientCapabilities = [];
		var euemCapability = new EuemCapability();

		if(EuemContext.bindVersion > EuemConstants.EUEMVD_CURRENT_VERSION) {
			euemCapability.version = EuemConstants.EUEMVD_CURRENT_VERSION;
		}

		clientCapabilities.push(euemCapability)

		var buffer = EuemPacketHelper.CreateCommitResponseWithConnectionInfo(clientCapabilities, GetConnectionInfo());
		//console.log("Sending bind response with connection info");
		vStream.WriteByte(buffer, 0, buffer.length);
	}


	function receiveBindCommit() {
		//console.log("received commit response");
		var finalCapabilities = EuemPacketHelper.ParseBindRequest(vStream);

		if(finalCapabilities && finalCapabilities.length > 0) {
			EuemContext.bindVersion = finalCapabilities[0].version;
		}
        if(!EuemContext.bindComplete && euemStartupInfo.appName.length != 0) {
	        EuemContext.bindComplete = true;
	        prepareStartupTimes();
        }
	}


	function prepareStartupTimes() {
	    if(EuemContext.bindComplete && euemStartupInfo.appName.length != 0){
            var buffer = EuemPacketHelper.CreateClientStartupPacket(euemStartupInfo);
            vStream.WriteByte(buffer, 0, buffer.length);
            euemStartupInfo.reset();
        }
	}

	function GetConnectionInfo() {
		var connectionInfo = new EuemConnectionInfo();
		connectionInfo.name = EuemContext.clientName;
		connectionInfo.address = EuemContext.clientIp;
		connectionInfo.sessionId = 0;
		connectionInfo.timestamp = 0;
		return connectionInfo;
	}
	
	//Process settings packet, this may arrive later at any time
	function receiveSettings() {
		//console.log("received EUEM setting packet");
		var settings = EuemPacketHelper.ParseSettingPkt(vStream);
		EuemSettings.roundTripPeriod = settings.roundTripPeriod;
		EuemSettings.roundTripWhenIdle = settings.measureOnIdle;
		updateSettings = true;
		//console.log("EUEM settings received : [Interval : " + settings.roundTripPeriod + "] [SendOnIdle : " + settings.measureOnIdle +"]");
		startRoundTripSequence();
	}

	this.sendStartupMetrics = function () {
		prepareStartupTimes();
	}
}

