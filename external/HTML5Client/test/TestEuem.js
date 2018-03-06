
describe("Euem packet parsing test", function() {
	
	var mockStream = new VirtualStream(0x10, function() {}, 0x2000);
	mockStream.RegisterCallback(function() {
		//Do nothing..
	});
	
	EuemContext.CurrentCapabilityVersion = EuemConstants.EUEMVD_CURRENT_VERSION;
	//Packet parseing

	it("Parse Bind request", function() {
		console.log("-------------------------------------------");
		console.log(" Staring to validate packet parsing logic ");
		console.log("-------------------------------------------");
		var output = "[{\"id\":1,\"version\":3}]";
		var input  = [8, 0, 1, 0, 5, 0, 1, 0, 3];

		mockStream.consumeData(input, 0, input.length);
		console.log("Validating euem packet parsing for bind request");
		expect(JSON.stringify(EuemPacketHelper.ParseBindRequest(mockStream))).toEqual(output);
	});
	
	it("parse setting packet", function() {
		var output = "{\"roundTripPeriod\":15,\"measureOnIdle\":false}";
		var input = [8, 0, 1, 0, 6, 0, 0, 0, 15, 0];

		mockStream.consumeData(input, 0, input.length);
		console.log("Validating euem packet parsing for setting packet");
		expect(JSON.stringify(EuemPacketHelper.ParseSettingPkt(mockStream))).toEqual(output);
	});
	
	it("Create commit response packet", function() {
		var input = JSON.parse("[{\"id\":1,\"version\":2}]");
		var output = "{\"0\":13,\"1\":0,\"2\":1,\"3\":0,\"4\":8,\"5\":0,\"6\":1,\"7\":0,\"8\":5,\"9\":0,\"10\":1,\"11\":0,\"12\":2}";

		console.log("Validating euem packet creation for bind reponse");
		expect(JSON.stringify(EuemPacketHelper.CreateCommitResponse(input))).toEqual(output);
	});
	
	it("Create connection information packet", function() {
		var input = JSON.parse("{\"sessionId\":0,\"timestamp\":0,\"name\":\"HTML-5748-4000\",\"address\":\"0.0.0.0\"}");
		var output = "{\"0\":43,\"1\":0,\"2\":4,\"3\":0,\"4\":0,\"5\":0,\"6\":0,\"7\":0,\"8\":0,\"9\":0,\"10\":0,\"11\":0," +
						"\"12\":15,\"13\":0,\"14\":20,\"15\":0,\"16\":8,\"17\":0,\"18\":35,\"19\":0,\"20\":72,\"21\":84,\"22\":77" +
						",\"23\":76,\"24\":45,\"25\":53,\"26\":55,\"27\":52,\"28\":56,\"29\":45,\"30\":52,\"31\":48,\"32\":48,\"33\":48," +
						"\"34\":0,\"35\":48,\"36\":46,\"37\":48,\"38\":46,\"39\":48,\"40\":46,\"41\":48,\"42\":0}";
		console.log("Validating euem packet helper to create only connection info packet");
		expect(JSON.stringify(EuemPacketHelper.CreateConnectionInfoPacket(input))).toEqual(output);
	});
	
	it("Create commit response packet with connection info piggy back",function() {
		var inputConnectionInfo = JSON.parse("{\"sessionId\":0,\"timestamp\":0,\"name\":\"HTML-5748-4000\",\"address\":\"0.0.0.0\"}");
		var inputCaps = JSON.parse("[{\"id\":1,\"version\":2}]");

		var expectedLength = 43;

		//Find only length
		console.log("Validating starts for commit response with connection info piggy back");

		console.log("Validating create connection info packet for calculating length");
		expect(EuemPacketHelper.CreateConnectionInfoPacketEx(inputConnectionInfo, true, null).length).toEqual(expectedLength);


		var expectedCommitResponseWithConnectionInfoPlaceholder = "{\"buffer\":{\"0\":13,\"1\":0,\"2\":1,\"3\":0,\"4\":8," +
					"\"5\":0,\"6\":1,\"7\":0,\"8\":5,\"9\":0,\"10\":1,\"11\":0,\"12\":2,\"13\":0,\"14\":0,\"15\":0,\"16\":0," +
					"\"17\":0,\"18\":0,\"19\":0,\"20\":0,\"21\":0,\"22\":0,\"23\":0,\"24\":0,\"25\":0,\"26\":0,\"27\":0,\"28\"" +
					":0,\"29\":0,\"30\":0,\"31\":0,\"32\":0,\"33\":0,\"34\":0,\"35\":0,\"36\":0,\"37\":0,\"38\":0,\"39\":0,\"40\":" +
					"0,\"41\":0,\"42\":0,\"43\":0,\"44\":0,\"45\":0,\"46\":0,\"47\":0,\"48\":0,\"49\":0,\"50\":0,\"51\":0,\"52\":0," +
					"\"53\":0,\"54\":0,\"55\":0}," +
					"\"length\":13}";

		var result = EuemPacketHelper.CreateCommitResponseExtended(inputCaps, expectedLength);

		console.log("Validating create commit response packet with connection info place holder");
		expect(JSON.stringify(result)).toEqual(expectedCommitResponseWithConnectionInfoPlaceholder);



		var expectedCommitRespomseWithConnectionInfo =	"{\"buffer\":{\"0\":13,\"1\":0,\"2\":1,\"3\":0,\"4\":8,\"5\":0," +
			"\"6\":1,\"7\":0,\"8\":5,\"9\":0,\"10\":1,\"11\":0,\"12\":2,\"13\":43,\"14\":0,\"15\":4,\"16\":0,\"17\":0," +
			"\"18\":0,\"19\":0,\"20\":0,\"21\":0,\"22\":0,\"23\":0,\"24\":0,\"25\":15,\"26\":0,\"27\":20,\"28\":0,\"29\":8," +
			"\"30\":0,\"31\":35,\"32\":0,\"33\":72,\"34\":84,\"35\":77,\"36\":76,\"37\":45,\"38\":53,\"39\":55,\"40\":52," +
			"\"41\":56,\"42\":45,\"43\":52,\"44\":48,\"45\":48,\"46\":48,\"47\":0,\"48\":48,\"49\":46,\"50\":48,\"51" +
			"\":46,\"52\":48,\"53\":46,\"54\":48,\"55\":0},\"length\":43}";

		console.log("Validating create commit response packet with valid connection info data");
		expect(JSON.stringify(EuemPacketHelper.CreateConnectionInfoPacketEx(inputConnectionInfo, false, result))).toEqual(expectedCommitRespomseWithConnectionInfo);
	});
	
	it("Create round trip start packet", function() {
		var inputSequence = 1;
		var output =  "{\"0\":6,\"1\":0,\"2\":5,\"3\":0,\"4\":1,\"5\":0}";
		console.log("Validating cration of round trip start packet");
		expect(JSON.stringify(EuemPacketHelper.CreateRoundTripStartPacket(inputSequence))).toEqual(output);
	});

	it("Create Round trip result packet", function() {
		var input = JSON.parse("{\"roundTripDuration\":31,\"sequenceId\":0,\"durations\":[{\"id\":1,\"durationLength\":-44}]}");
		var output = '{"0":18,"1":0,"2":7,"3":0,"4":31,"5":0,"6":0,"7":0,"8":0,"9":1,"10":13,"11":0,"12":5,"13":212,"14":255,"15":255,"16":255,"17":1}';
		console.log("Validating creation of round trip result packet");
		expect(JSON.stringify(EuemPacketHelper.CreateRoundTripResult(input))).toEqual(output);
	});

	it("Test EUEM for older version (2) ref Bug : BUG0525089", function() {
		EuemContext.bindVersion = EuemConstants.INITIAL_RELEASE_VERSION;

		var startupIput  = JSON.parse("{\"startupFlag\":1,\"appName\":\"#Calculator\",\"durations\":[{\"id\":6,\"durationLength" +
			"\":265},{\"id\":7,\"durationLength\":0},{\"id\":8,\"durationLength\":406},{\"id\":9,\"durationLength\":714},{\"id\":10," +
			"\"durationLength\":1},{\"id\":0,\"durationLength\":5627},{\"id\":11,\"durationLength\":1142}],\"launchMechanism\":\"WI\"," +
			"\"startSCD\":1423648058815,\"endSCD\":1423648064442,\"startSCCD\":1423648063300,\"isSharedSession\":false}");

		var expected = "{\"0\":68,\"1\":0,\"2\":9,\"3\":0,\"4\":1,\"5\":0,\"6\":12,\"7\":0,\"8\":18,\"9\":0,\"10\":33," +
			"\"11\":0,\"12\":7,\"13\":5,\"14\":3,\"15\":0,\"16\":30,\"17\":0,\"18\":35,\"19\":67,\"20\":97,\"21\":108," +
			"\"22\":99,\"23\":117,\"24\":108,\"25\":97,\"26\":116,\"27\":111,\"28\":114,\"29\":0,\"30\":87,\"31\":73," +
			"\"32\":0,\"33\":9,\"34\":1,\"35\":0,\"36\":0,\"37\":6,\"38\":0,\"39\":0,\"40\":0,\"41\":0,\"42\":7,\"43" +
			"\":150,\"44\":1,\"45\":0,\"46\":0,\"47\":8,\"48\":202,\"49\":2,\"50\":0,\"51\":0,\"52\":9,\"53\":1,\"54" +
			"\":0,\"55\":0,\"56\":0,\"57\":10,\"58\":251,\"59\":21,\"60\":0,\"61\":0,\"62\":0,\"63\":118,\"64\":4," +
			"\"65\":0,\"66\":0,\"67\":11}";

		var packetData = EuemPacketHelper.CreateClientStartupPacket(startupIput);

		console.log("Validating creation of startup metrics packet");
		expect(JSON.stringify(packetData.subarray(0, packetData.length))).toEqual(expected);
	});
	
	it("Create startup metrics", function() {
		EuemContext.bindVersion = EuemConstants.EUEMVD_CURRENT_VERSION;

		var startupIput  = JSON.parse("{\"startupFlag\":1,\"appName\":\"#Calculator\",\"durations\":[{\"id\":6,\"durationLength" +
			"\":265},{\"id\":7,\"durationLength\":0},{\"id\":8,\"durationLength\":406},{\"id\":9,\"durationLength\":714},{\"id\":10," +
			"\"durationLength\":1},{\"id\":0,\"durationLength\":5627},{\"id\":11,\"durationLength\":1142}],\"launchMechanism\":\"WI\"," +
			"\"startSCD\":1423648058815,\"endSCD\":1423648064442,\"startSCCD\":1423648063300,\"isSharedSession\":false}");

		var expected = "{\"0\":88,\"1\":0,\"2\":9,\"3\":0,\"4\":1,\"5\":0,\"6\":12,\"7\":0,\"8\":18,\"9\":0,\"10\":33," +
			"\"11\":0,\"12\":11,\"13\":5,\"14\":3,\"15\":0,\"16\":30,\"17\":0,\"18\":35,\"19\":67,\"20\":97,\"21\":108," +
			"\"22\":99,\"23\":117,\"24\":108,\"25\":97,\"26\":116,\"27\":111,\"28\":114,\"29\":0,\"30\":87,\"31\":73," +
			"\"32\":0,\"33\":9,\"34\":1,\"35\":0,\"36\":0,\"37\":6,\"38\":0,\"39\":0,\"40\":0,\"41\":0,\"42\":7,\"43" +
			"\":150,\"44\":1,\"45\":0,\"46\":0,\"47\":8,\"48\":202,\"49\":2,\"50\":0,\"51\":0,\"52\":9,\"53\":1,\"54" +
			"\":0,\"55\":0,\"56\":0,\"57\":10,\"58\":251,\"59\":21,\"60\":0,\"61\":0,\"62\":0,\"63\":118,\"64\":4," +
			"\"65\":0,\"66\":0,\"67\":11,\"68\":75,\"69\":1,\"70\":0,\"71\":0,\"72\":14,\"73\":191,\"74\":109,\"75" +
			"\":9,\"76\":120,\"77\":15}";
		var packetData = EuemPacketHelper.CreateClientStartupPacket(startupIput);

		console.log("Validating creation of startup metrics pactek");
        //Remove last two durations SCTM-HIGH and SCTM-LOW from validation which depends on current time
		expect(JSON.stringify(packetData.subarray(0, packetData.length - 10))).toEqual(expected);

		console.log("--------------------------------------");
		console.log(" Done validating packet parsing logic  ");
		console.log("--------------------------------------");
	});

});


describe("EUEM Engine test" , function() {
	var callbackWrapper  = jasmine.createSpyObj('callbackWrapper', ['checkAndQueueRTWrite','raiseSessionReadyEvent']);
	var originalTimeout;
	var engine = new EuemEngine(callbackWrapper);
	var stream = engine.SetStack(null);

	engine.Run();
	//Setup
	beforeEach(function() {
		spyOn(stream, 'WriteByte');
		spyOn(EuemPacketHelper, 'CreateCommitResponseWithConnectionInfo').and.callThrough();
		spyOn(EuemPacketHelper, 'CreateClientStartupPacket').and.callThrough();
		spyOn(EuemPacketHelper, 'ParseBindRequest').and.callThrough();
		spyOn(EuemPacketHelper, 'ParseSettingPkt').and.callThrough();
		spyOn(EuemPacketHelper, 'CreateRoundTripStartPacket').and.callThrough();

		originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
	});

	afterEach(function() {
		jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
		callbackWrapper.checkAndQueueRTWrite.calls.reset();
		EuemPacketHelper.CreateClientStartupPacket.calls.reset();
		EuemPacketHelper.ParseBindRequest.calls.reset();
		EuemPacketHelper.ParseSettingPkt.calls.reset()
		stream.WriteByte.calls.reset();
	});

	it("Bind request validation", function() {
		console.log("--------------------------------");
		console.log(" Starting to validate EUEM engine ");
		console.log("--------------------------------");

		EuemContext.clientName = "HTML-5748-4000";
		EuemContext.clientIp = "0.0.0.0";

		var packetFromVDA = JSON.parse("{\"buff\":{\"0\":13,\"1\":0,\"2\":0,\"3\":0,\"4\":8,\"5\":0,\"6\":1,\"7\":0,\"8\":5,\"9\":0,\"10\":1,\"11\":0,\"12\":3},\"cmd\":9,\"offset\":3,\"toCopy\":13}");
		stream.consumeData(packetFromVDA.buff, 0, packetFromVDA.toCopy);

		var euemCap = new EuemCapability();
		euemCap.version = 3;
		euemCap.id = 1;
		var euemCapList = [euemCap];

		var connectionInfo = new EuemConnectionInfo();
		connectionInfo.name = 'HTML-5748-4000';
		connectionInfo.address = '0.0.0.0';
		connectionInfo.sessionId = 0;
		connectionInfo.timestamp = 0;

		//Make sure commit response packe is created with connection info
		console.log("Bind request test : Test if commit response packet is created");
		expect(EuemPacketHelper.CreateCommitResponseWithConnectionInfo).toHaveBeenCalledWith(euemCapList, connectionInfo);

		//make sure server capabilities are set
		console.log("Bind request test : Test if host capability version is set correctly");
		expect(EuemContext.bindVersion).toEqual(3);

		//Todo, set a higher host cap version

		var expectedArray = [13,0,1,0,8,0,1,0,5,0,1,0,3,43,0,4,0,0,0,0,0,0,0,0,0,15,0,20,0,8,0,35,0,72,84,77,76,45,53,55,52,56,45,52,48,48,48,0,48,46,48,46,48,46,48,0];
		var typedExpectedArray = new Uint8Array(expectedArray, 0, expectedArray.length);

		//Make sure the write packet is written to wire
		console.log("Bind request test : Test if the bind commit is written to the wire");
		expect(stream.WriteByte).toHaveBeenCalledWith(new Uint8Array(typedExpectedArray), 0, typedExpectedArray.length);
	});

	it("Test sendStartMetrics", function(){
		engine.sendStartupMetrics();
		//Client startup packet should not be created since bind is not complete
		console.log("Test sendStartupMetrics  : Test if createClientStartupPacket is not called before bind complete");
		expect(EuemPacketHelper.CreateClientStartupPacket).not.toHaveBeenCalled();
	});

	it("Test Bind commit with setting packet piggy backed", function() {
		euemStartupInfo.appName = "TestAppq";
		var packetFromVDA = JSON.parse("{\"buff\":{\"0\":13,\"1\":0,\"2\":2,\"3\":0,\"4\":8,\"5\":0,\"6\":1,\"7\":0,\"8\":5,\"9\":0,\"10\":1,\"11\":0,\"12\":2," +
			"\"13\":14,\"14\":0,\"15\":3,\"16\":0,\"17\":8,\"18\":0,\"19\":1,\"20\":0,\"21\":6,\"22\":0,\"23\":0,\"24\":0,\"25\":2,\"26\":0}," +
			"\"cmd\":9," +
			"\"offset\":3,\"toCopy\":27}");
		stream.consumeData(packetFromVDA.buff, 0, packetFromVDA.toCopy + packetFromVDA.offset);

		console.log("Test bind commit : Validating if the vda packet is parsed and the Euem version is negotiated");
		expect(EuemPacketHelper.ParseBindRequest).toHaveBeenCalledWith(stream);

		console.log("Test bind commit : Validatin bind complete success...");
		expect(EuemContext.bindComplete).toEqual(true);

		console.log("Test bind commit : Validating final negotiated Euem version");
		expect(EuemContext.bindVersion).toEqual(2);

		console.log("Test bind commit : Validating if client startup info packet is created");
		expect(EuemPacketHelper.CreateClientStartupPacket).toHaveBeenCalledWith(jasmine.any(Object));

		console.log("Test bind commit : Validating if the client startup info is written to wire");
		expect(stream.WriteByte).toHaveBeenCalledWith(jasmine.any(Uint8Array), 0, jasmine.any(Number));

	});

	it("Settings handling validation", function() {
		var bytesRemaining = stream.Available();

		for(var i = 0; i < bytesRemaining; i++) {
			stream.ReadByte();
		}

		var packetFromVDA = JSON.parse("{\"buff\":{\"0\":13,\"1\":0,\"2\":2,\"3\":0,\"4\":8,\"5\":0,\"6\":1,\"7\":0,\"8\":5,\"9\":0,\"10\":1,\"11\":0,\"12\":2," +
			"\"13\":14,\"14\":0,\"15\":3,\"16\":0,\"17\":8,\"18\":0,\"19\":1,\"20\":0,\"21\":6,\"22\":0,\"23\":0,\"24\":0,\"25\":2,\"26\":0}," +
			"\"cmd\":9," +
			"\"offset\":3,\"toCopy\":27}");

		stream.consumeData(packetFromVDA.buff, 0, packetFromVDA.toCopy + packetFromVDA.offset);
		expect(EuemPacketHelper.ParseBindRequest).toHaveBeenCalled();

		console.log("Test setting packet : Validating if the setting packet is being parsed");
		expect(EuemPacketHelper.ParseSettingPkt).toHaveBeenCalled();

		console.log("Test setting packet : Validating parsed setting values");
		//Note that roundtrip period is set to 2 seconds
		expect(EuemSettings).toEqual({ roundTripPeriod : 2, roundTripWhenIdle : false});
	});


	it("Test Round trip sequence [measure on Idle : true, Wait time : 5 seconds] ", function(done) {
		var bytesRemaining = stream.Available();

		for(var i = 0; i < bytesRemaining; i++) {
			stream.ReadByte();
		}
		console.log("Test Round trip start sequence [measure on Idle : false, wd ACk received : false]");

		var packetFromVDA = JSON.parse("{\"buff\":{\"0\":19,\"1\":0,\"2\":3,\"3\":0,\"4\":8,\"5\":0,\"6\":2,\"7\":0,\"8\":6,\"9\":0,\"10\":0,\"11\":0,\"12\":3,\"13\":0,\"14\":5,\"15\":0,\"16\":1,\"17\":0,\"18\":1}," +
			"\"cmd\":9," +
			"\"offset\":0,\"toCopy\":19}");
		stream.consumeData(packetFromVDA.buff, 0, packetFromVDA.toCopy);

		console.log("Test RT [idle : true, Ack : false] : Validating if the setting packet is being parsed");
		expect(EuemPacketHelper.ParseSettingPkt).toHaveBeenCalled();

		console.log("Test RT [idle : true, Ack : false] : Validating parsed setting values");
		//Note that roundtrip period is set to 3 seconds
		expect(EuemSettings).toEqual({ roundTripPeriod : 3, roundTripWhenIdle : true});

		console.log("Test RT [idle : true, Ack : false] : Waiting for 5 seconds for RT loop....");
		var doneWait = false;
		var timer = setInterval(function () {
			if(!doneWait) {
				doneWait = true;
				console.log("Test RT [idle : true, Ack : false] : Test if the packet is written with WriteByte to avoid checking for user activity");
				expect(stream.WriteByte.calls.count()).toBeGreaterThan(1);
				console.log("Test RT [idle : true, Ack : false] : Test if the packet is  never written with checkAndQueueRTWrite");
				expect(callbackWrapper.checkAndQueueRTWrite).not.toHaveBeenCalled();
			}
			clearInterval(timer);
			done();
		}, 5000);
	});

	it("Test RT [idle : false, Ack : false, wait time : 6 seconds]", function(done1) {
		var doneWait = false;
		callbackWrapper.checkAndQueueRTWrite.and.callFake(function(byteData, offset, length, isResultData) {
		});

		var bytesRemaining = stream.Available();

		for(var i = 0; i < bytesRemaining; i++) {
			stream.ReadByte();
		}

		var packetFromVDA = JSON.parse("{\"buff\":{\"0\":19,\"1\":0,\"2\":3,\"3\":0,\"4\":8,\"5\":0,\"6\":2,\"7\":0,\"8\":6,\"9\":0,\"10\":0,\"11\":0,\"12\":3,\"13\":0,\"14\":5,\"15\":0,\"16\":1,\"17\":0,\"18\":0}," +
			"\"cmd\":9," +
			"\"offset\":0,\"toCopy\":19}");

		stream.consumeData(packetFromVDA.buff, 0, packetFromVDA.toCopy);

		console.log("Test RT [idle : false, Ack : false] : Test  for setting information being updated and RT timeout changes accordingly");
		//Note that roundtrip period is set to 3 seconds
		expect(EuemSettings).toEqual({ roundTripPeriod : 3, roundTripWhenIdle : false});

		console.log("Test RT [idle : false, Ack : false] : Waiting for 6 seconds for RT loop....");
		var timer = setInterval(function () {
			if(!doneWait) {
				console.log("Test RT [idle : false, Ack : false] : Test if the packet is written by calling checkAndQueueRTWrite but only once as there are no ACKs from WD after waiting for 6 seconds");
				expect(callbackWrapper.checkAndQueueRTWrite.calls.count()).toEqual(1);
				engine.ackReceivedForRT(false);
				doneWait = true;
			}
			clearInterval(timer);
			done1();
		}, 6000);
	});



	/*var prevByteData;
	it("Test RT [idle : false, Ack : true, Wait time : 10 seconds]", function(done){
		var ackSuccess = true;
		var counter = 1;
		prevByteData = new Uint8Array(1);

		callbackWrapper.checkAndQueueRTWrite.and.callFake(function(byteData, offset, length, isResultData) {
			//console.log("Test RT [Inside mock] Test if packet is RT start and not result");
			expect(isResultData).toEqual(false);

			try {
				if (ackSuccess == true) {
					console.log("Test RT [Inside mock checkAndQueueRTWrite] : Test if new sequence is sent");
					expect(prevByteData).not.toEqual(byteData);
					prevByteData = byteData;
				} else {
					console.log("Test RT [Inside mock checkAndQueueRTWrite] : Test if the previous sequence is sent");
					expect(prevByteData).toEqual(byteData);
				}

				if(counter % 2 == 0) {
					ackSuccess = !ackSuccess;
				}
				counter++;
				console.log("Simulate ack received with status : " + ackSuccess);
				engine.ackReceivedForRT(ackSuccess);

			}catch(error) {
				console.log(error);
			}
		});

		console.log("Test RT [idle : true, Ack : true] : Waiting for 10 seconds for RT loop....");
		//Add 10 seconds delay
		var timer = setInterval(function (){
			expect(callbackWrapper.checkAndQueueRTWrite.calls.count()).toBeGreaterThan(3);
			clearInterval(timer);
			done();
			waitDone = true;
		}, 10000);
	});*/

	/*xit("Test stop RT calculation", function(done) {
		console.log("Stopping RT calc. Waiting to see if no RT is sent for 4 seconds");
		engine.stopRoundTripCalc();
		var doneWait = false;
		setInterval(function () {
			if(!doneWait) {
				doneWait = true;
				expect(EuemPacketHelper.CreateRoundTripStartPacket).not.toHaveBeenCalled();
				done();
			}
		}, 4000);
	});*/


	it("Simulate RT abort", function() {
		var abortPacket = JSON.parse("{\"0\":5,\"1\":0,\"2\":6,\"3\":0,\"4\":4}");
		console.log("Simulate RT abort for sequence 2 for the next test case");
		stream.consumeData(abortPacket, 0, 5);
	});

	it("Validate TW frame metrics with aborted sequence Id", function(){
		callbackWrapper.checkAndQueueRTWrite.and.callFake(function(byteData, offset, length, isResultData) {});
		var frameMetrics = {
			"mask":1,
			"seqId":4,
			"baseTime":340408309,
			"euemTriggerDelta":-44,
			"firstDrawDelta":0,
			"frameCutDelta":0,
			"frameSendDelta":0,
			"wdTriggerDelta":0
		};

		engine.handleTWFrameMetrics(frameMetrics);
		console.log("Test for RT result not to be sent for aborted sequence");
		expect(callbackWrapper.checkAndQueueRTWrite).not.toHaveBeenCalled();
	});

	it("Validate TW frame metrics with valid sequence Id", function(){
		var seqId = 3;
		callbackWrapper.checkAndQueueRTWrite.and.callFake(function(byteData, offset, length, isResultData) {
			if(isResultData){
				console.log("Test if RT result are calculated and sent in case of valid sequence id");
				expect(byteData[8]).toEqual(seqId);
			}

			console.log("--------------------------------");
			console.log(" Done validating EUEM engine ");
			console.log("--------------------------------");
		});

		var frameMetrics = {
			"mask":1,
			"seqId":seqId,
			"baseTime":340408309,
			"euemTriggerDelta":-44,
			"firstDrawDelta":0,
			"frameCutDelta":0,
			"frameSendDelta":0,
			"wdTriggerDelta":0
		};
		engine.handleTWFrameMetrics(frameMetrics);
	});
});


describe("Euem wrapper validation", function(){
	//var engine = jasmine.createSpyObj('EuemEngine', ['sendStartupMetrics', 'handleTWFrameMetrics', 'ackReceivedForRT']);
	var icaWrapper = jasmine.createSpyObj('IcaThreadWrapper', ['processOtherWrapperCmd']);
	var euemWrapper = new EuemWrapper(null, icaWrapper, {});
	euemWrapper.initialize(THREADCOMMAND.INIT_ENGINE, null);
	var engine = euemWrapper.getEngine();
	beforeEach(function() {
		spyOn(EuemPacketHelper,'CreateClientStartupPacket').and.callThrough();
		spyOn(engine, 'handleTWFrameMetrics');
		spyOn(engine, 'ackReceivedForRT');
	})

	it("Validate start SCCD command", function() {
		console.log("--------------------------------");
		console.log(" Starting to test EUEM wrapper ");
		console.log("--------------------------------");
		var inputObj = {
			cmd: 200,
			destination: 9,
			source: 1,
			startSCCD: 1424259521692
		};

		euemWrapper.processOtherWrapperCmd(inputObj);
		console.log("Testing start SCCD command");
		expect(euemStartupInfo.startSCCD).toEqual(1424259521692);
	});

	it("Validate ICA data command", function() {
		var input = {
			cmd: 202,
			destination: 9,
			source: 2,
			icadata: {
				Address: "10.105.32.138:1494",
				AutologonAllowed: "ON",
				BrowserProtocol: "HTTPonTCP",
				CGPAddress: "*:2598",
				Calculator: "",
				ClearPassword: "B5B13D12FA0DAA",
				ClientAudio: "On",
				ClientIp: "0.0.0.0",
				ClientName: "HTML-5748-4000",
				DesiredColor: "8",
				DesiredHRES: "0",
				DesiredVRES: "0",
				DoNotUseDefaultCSL: "On",
				Domain: "\8C09C3B2506F7E17",
				DriverNameWin16: "pdc56w.dll",
				DriverNameWin32: "pdc56n.dll",
				FontSmoothingType: "0",
				IFDCD: 344,
				InitialProgram: "#Calculator",
				InputEncoding: "UTF8",
				LPWD: "359",
				LaunchReference: "D1A146516FB3E672AC96F7987F50E3",
				Launcher: "WI",
				LocHttpBrowserAddress: "!",
				LogonTicket: "B5B13D12FA0DAA8C09C3B2506F7E17",
				LogonTicketType: "CTXS1",
				LongCommandLine: "",
				NRWD: "203",
				ProxyFavorIEConnectionSetting: "Yes",
				ProxyTimeout: "30000",
				ProxyType: "Auto",
				ProxyUseFQDN: "Off",
				RemoveICAFile: "yes",
				SFRAllowed: "Off",
				SSLEnable: "Off",
				SSLProxyHost: undefined,
				SerialNumber: "4034765029",
				SessionsharingKey: "v++ilW3D7+R3X5UfP/z9zEQnNxDHEZnR",
				TRWD: "15",
				TWIMode: "On",
				Title: "Calculator",
				TransparentKeyPassthrough: "Local",
				TransportDriver: "TCP/IP",
				TransportReconnectEnabled: "On",
				UILocale: "en",
				Version: "2",
				VirtualCOMPortEmulation: "On",
				WinStationDriver: "ICA 3.0",
				clientPreferences: "",
				startSCD: 1424259519911,
			}
		};

		euemWrapper.processOtherWrapperCmd(input);

		var expected = {
			"startupFlag":1,
			"appName":"#Calculator",
			"durations":[],
			"launchMechanism":"WI",
			"startSCD":1424259519911,
			"endSCD":0,
			"startSCCD":1424259521692,
			"isSharedSession":false
		};

		console.log("Test ica data is received and euemStartup info durations are extracted from ICA data");
		expected.durations.push(new EuemDuration(6, 203));
		expected.durations.push(new EuemDuration(7, 15));
		expected.durations.push(new EuemDuration(8, 359));
		expected.durations.push(new EuemDuration(9, 344));
		expected.durations.push(new EuemDuration(10, 1));

		expect(euemStartupInfo.appName).toEqual(expected.appName);
		expect(euemStartupInfo.launchMechanism).toEqual(expected.launchMechanism);
		expect(euemStartupInfo.startSCD).toEqual(expected.startSCD);
		expect(euemStartupInfo.startSCCD).toEqual(expected.startSCCD);
		expect(euemStartupInfo.durations).toEqual(expected.durations);
	});

	it("validate end SCD", function() {
		var input = {cmd: 203, endScd: 1424259522850, source: 2, destination: 9, isSharedSession: false};

		euemWrapper.processOtherWrapperCmd(input);
		var calculatedSCD;
		var calculatedSCCD;
		for(var i = 0; i < euemStartupInfo.durations.length; i++) {
			if(euemStartupInfo.durations[i].id == EuemConstants.SCD) {
				calculatedSCD = euemStartupInfo.durations[i].durationLength;

			}else if(euemStartupInfo.durations[i].id == EuemConstants.SCCD) {
				calculatedSCCD = euemStartupInfo.durations[i].durationLength;
			}
		}
		console.log("Test endSCD command with new session");
		expect(calculatedSCD).toEqual(2939);
		expect(calculatedSCCD).toEqual(1158);

	});

	it("validate end SCD with isSharedSession set to true", function() {
		var input = {cmd: 203, endScd: 1424259522850, source: 2, destination: 9, isSharedSession: true};
		EuemContext.bindComplete = true;
		euemWrapper.processOtherWrapperCmd(input);
		console.log("Test endSCD command called for existing session");
		expect(EuemPacketHelper.CreateClientStartupPacket).toHaveBeenCalled();
	});

	it("Validate Thinwire metrics" , function() {
		var input = {
			cmd: 201,
			destination: 9,
			roundTripMetrics: {
				baseTime: 340182546,
				euemTriggerDelta: -46,
				firstDrawDelta: 0,
				frameCutDelta: 0,
				frameSendDelta: 0,
				mask: 1,
				seqId: 1,
				wdTriggerDelta: 0
			},
			source: 0
		};

		euemWrapper.processOtherWrapperCmd(input);
		console.log("Test TW frame metrics are processed");
		expect(engine.handleTWFrameMetrics).toHaveBeenCalled();
	});

	it("Validate RT acknowledgement from WD channel", function() {
		var input = {cmd: 206, status: false, source: 2, destination: 9};
		euemWrapper.processOtherWrapperCmd(input);
		console.log("Test RT ack command sent from WD");
		expect(engine.ackReceivedForRT).toHaveBeenCalledWith(false);

		console.log("--------------------------------");
		console.log(" Euem wrapper test complete");
		console.log("--------------------------------");
	});
});

