
describe("Smartcard packet parsing test;", function () {

	var mockStream = new VirtualStream(0x1A, function () {}, 0x2000);
	mockStream.RegisterCallback(function () {
		//Do nothing..
	});

	//Packet parsing
	//bind request
	it("Parse Bind request with valid input", function () {
		console.log("-------------------------------------------");
		console.log(" Starting to validate packet parsing logic ");
		console.log("-------------------------------------------");
		var output = '{"respond":true,"capsArray":[{"size":8,"buffer":{"0":8,"1":0,"2":1,"3":0,"4":1,"5":0,"6":0,"7":0}},{"size":12,"buffer":{"0":12,"1":0,"2":2,"3":0,"4":2,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0}}]}';
		var input = [8, 0, 3, 0, 8, 0, 1, 0, 0, 0, 0, 0, 12, 0, 2, 0, 3, 0, 0, 0, 0, 0, 0, 0, 8, 0, 3, 0, 3, 0, 0, 0];

		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.BindRequest();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse Bind request with invalid input", function () {
		var output = '{"respond":true,"capsArray":[{"size":8,"buffer":{"0":80,"1":0,"2":1,"3":0,"4":1,"5":0,"6":0,"7":0}},{"size":12,"buffer":{"0":12,"1":0,"2":2,"3":0,"4":2,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0}}]}';
		var input = [8, 0, 3, 0, 8, 0, 1, 0, 0, 0, 0, 0, 12, 0, 2, 0, 3, 0, 0, 0, 0, 0, 0, 0, 8, 0, 3, 0, 3, 0, 0, 0];

		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.BindRequest();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//bind commit
	it("Parse Bind Commit with valid input", function () {
		var output = '{"respond":false}';
		var input = [8, 0, 2, 0, 8, 0, 1, 0, 1, 0, 0, 0, 12, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0];

		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.BindCommit();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse Bind Commit with invalid input", function () {
		var output = '{"respond":true}';
		var input = [8, 0, 2, 0, 8, 0, 1, 0, 1, 0, 0, 0, 12, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0];

		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.BindCommit();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//manager query running
	it("Parse Manager query running with valid input", function () {
		var output = '{}';
		var input = [];

		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.ManagerStatus();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse Manager query running with invalid input", function () {
		var output = '{1}';
		var input = [];

		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.ManagerStatus();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//establish context
	it("Parse Establish context with valid input", function () {
		var output = '{"scope":2}';
		var input = [2, 0, 0, 0];

		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.EstablishContext();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse Establish context with invalid input", function () {
		var output = '{"scope":2}';
		var input = [4, 0, 0, 0];

		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.EstablishContext();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//list reader
	it("Parse list reader with valid input", function () {
		var output = '{"context":1085377743,"groupName":[]}';
		var input = [207, 140, 177, 64, 0, 0, 0, 0];

		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.ListReaderRequest();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse list reader with invalid input", function () {
		var output = '{"context":1085377743,"groupName":[]}';
		var input = [270, 140, 177, 64, 0, 0, 0, 0];

		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.ListReaderRequest();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//connect request
	it("Parse connect request with valid input", function () {
		var output = '{"context":1191391529,"readerName":"OMNIKEY AG CardMan 3121 00 00\\u0000","shareModeFlag":2,"preferredProtocolBitMask":3}';
		var input = [41, 49, 3, 71, 20, 0, 60, 0, 2, 0, 0, 0, 3, 0, 0, 0, 79, 0, 77, 0, 78, 0, 73, 0, 75, 0, 69, 0, 89, 0, 32, 0, 65, 0, 71, 0, 32, 0, 67, 0, 97, 0, 114, 0, 100, 0, 77, 0, 97, 0, 110, 0, 32, 0, 51, 0, 49, 0, 50, 0, 49, 0, 32, 0, 48, 0, 48, 0, 32, 0, 48, 0, 48, 0, 0, 0];

		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.Connect();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse connect request with invalid input", function () {
		var output = '{"context":1191391529,"readerName":"OMNIKEY AG CardMan 3121 00 00\\u0000","shareModeFlag":2,"preferredProtocolBitMask":3}';
		var input = [14, 49, 3, 71, 20, 0, 60, 0, 2, 0, 0, 0, 3, 0, 0, 0, 79, 0, 77, 0, 78, 0, 73, 0, 75, 0, 69, 0, 89, 0, 32, 0, 65, 0, 71, 0, 32, 0, 67, 0, 97, 0, 114, 0, 100, 0, 77, 0, 97, 0, 110, 0, 32, 0, 51, 0, 49, 0, 50, 0, 49, 0, 32, 0, 48, 0, 48, 0, 32, 0, 48, 0, 48, 0, 0, 0];

		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.Connect();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//disconnect request
	it("Parse disconnect request with valid input", function () {
		var output = '{"handle":812669700,"dispositionFlag":0}';
		var input = [4, 91, 112, 48, 0, 0, 0, 0];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.Disconnect();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse disconnect request with invalid input", function () {
		var output = '{"handle":812669700,"dispositionFlag":0}';
		var input = [4, 90, 112, 48, 0, 0, 0, 0];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.Disconnect();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//begin transaction
	it("Parse beginTransaction request with valid input", function () {
		var output = '{"handle":553475508}';
		var input = [180, 93, 253, 32];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.BeginTransaction();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse beginTransaction request with invalid input", function () {
		var output = '{"handle":553475508}';
		var input = [181, 93, 253, 32];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.BeginTransaction();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//status request
	it("Parse status request with valid input", function () {
		var output = '{"handle":553475508}';
		var input = [180, 93, 253, 32];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.Status();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse status request with invalid input", function () {
		var output = '{"handle":553475508}';
		var input = [18, 93, 253, 32];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.Status();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//reader capabilites
	it("Parse get reader capabilities request with valid input", function () {
		var output = '{"handle":553475508,"attrId":590595}';
		var input = [180, 93, 253, 32, 3, 3, 9, 0];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.GetAttribute();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);

		//var input = [180, 93, 253, 32, 5, 0, 255, 127];
		//var output = '{"handle":553475508,"attrId":2147418117}';

		//var input = [180, 93, 253, 32, 16, 1, 2, 0];
		//var output ='{"handle":553475508,"attrId":131344}';
	});

	it("Parse get reader capabilities request with invalid input", function () {
		var output = '{"handle":553475508,"attrId":590595}';
		var input = [18, 93, 253, 32, 3, 3, 9, 0];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.GetAttribute();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//transmit request
	it("Parse transmit request with valid input", function () {
		var output = '{"handle":553475508,"proto":1,"rawData":[128,194,0,0,18,216,0,5,111,0,192,75,78,127,189,222,236,0,4,77,83,67,77]}';
		var input = [180, 93, 253, 32, 28, 0, 8, 0, 36, 0, 23, 0, 0, 0, 0, 0, 2, 1, 0, 0, 23, 0, 0, 0, 1, 0, 0, 0, 8, 0, 0, 0, 128, 194, 0, 0, 18, 216, 0, 5, 111, 0, 192, 75, 78, 127, 189, 222, 236, 0, 4, 77, 83, 67, 77];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.Transmit();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);

		//var input = [180, 93, 253, 32, 28, 0, 8, 0, 36, 0, 5, 0, 0, 0, 0, 0, 2, 1, 0, 0, 5, 0, 0, 0, 1, 0, 0, 0, 8, 0, 0, 0, 0, 192, 0, 0, 15];
		//var output = '{"handle":553475508,"proto":1,"rawData":[0,192,0,0,15]}';
	});

	it("Parse transmit request with invalid input", function () {
		var output = '{"handle":553475508,"proto":1,"rawData":[128,194,0,0,18,216,0,5,111,0,192,75,78,127,189,222,236,0,4,77,83,67,77]}';
		var input = [181, 93, 253, 32, 28, 0, 8, 0, 36, 0, 23, 0, 0, 0, 0, 0, 2, 1, 0, 0, 23, 0, 0, 0, 1, 0, 0, 0, 8, 0, 0, 0, 128, 194, 0, 0, 18, 216, 0, 5, 111, 0, 192, 75, 78, 127, 189, 222, 236, 0, 4, 77, 83, 67, 77];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.Transmit();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//release context
	it("Parse release context request with valid input", function () {
		var output = '{"context":1085377743}';
		var input = [207, 140, 177, 64];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.ReleaseContext();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse release context request with invalid input", function () {
		var output = '{"context":1085377743}';
		var input = [20, 140, 177, 64];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.ReleaseContext();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//end transaction
	it("Parse end transaction request with valid input", function () {
		var output = '{"handle":553475508,"dispositionFlag":0}';
		var input = [180, 93, 253, 32, 0, 0, 0, 0];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.EndTransaction();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse end transaction request with invalid input", function () {
		var output = '{"handle":553475508,"dispositionFlag":0}';
		var input = [181, 93, 253, 32, 0, 0, 0, 0];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.EndTransaction();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//isValid Context
	it("Parse is valid context request with valid input", function () {
		var output = '{"context":1085377743}';
		var input = [207, 140, 177, 64];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.IsValidContext();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse is valid context request with invalid input", function () {
		var output = '{"context":108577743}';
		var input = [207, 140, 177, 64];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.IsValidContext();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//reconnect
	it("Parse reconnect request with valid input", function () {
		var output = '{"context":1085377743}';
		var input = [207, 140, 177, 64];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.IsValidContext();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse reconnect request with invalid input", function () {
		var output = '{"context":108537743}';
		var input = [207, 140, 177, 64];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.IsValidContext();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	//control
	it("Parse control request with valid input", function () {
		var output = '{"handle":1085377743,"controlCode":3224864,"data":[]}';
		var input = [207, 140, 177, 64, 32, 53, 49, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.Control();
		expect(JSON.stringify(temp.getObject(mockStream))).toEqual(output);
	});

	it("Parse control request with invalid input", function () {
		var output = '{"handle":1085377743,"controlCode":324864,"data":[]}';
		var input = [207, 140, 177, 64, 32, 53, 49, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		mockStream.consumeData(input, 0, input.length);
		var temp = new SCard.Request.Control();
		expect(JSON.stringify(temp.getObject(mockStream))).not.toEqual(output);
	});

	it('', function () {
		console.log("-------------------------------------------");
		console.log("  End of packet parsing logic ");
		console.log("-------------------------------------------");
	});
});

describe("Smartcard response test;", function () {
	var successCode = SCard.Constants.CTXSCARD_S_SUCCESS;

	//bind response
	it("Bind response with valid input", function () {
		console.log("-------------------------------------------");
		console.log(" Starting to validate response to wire ");
		console.log("-------------------------------------------");
		var input = [{
				"size" : 8,
				"buffer" : {
					"0" : 8,
					"1" : 0,
					"2" : 1,
					"3" : 0,
					"4" : 1,
					"5" : 0,
					"6" : 0,
					"7" : 0
				}
			}, {
				"size" : 12,
				"buffer" : {
					"0" : 12,
					"1" : 0,
					"2" : 2,
					"3" : 0,
					"4" : 2,
					"5" : 0,
					"6" : 0,
					"7" : 0,
					"8" : 0,
					"9" : 0,
					"10" : 0,
					"11" : 0
				}
			}
		];
		var output = [28, 0, 128, 0, 8, 0, 2, 0, 8, 0, 1, 0, 1, 0, 0, 0, 12, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0];

		var temp = new SCard.Response.Bind(input);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);
	});

	it("Bind response with invalid input", function () {
		var input = [{
				"size" : 8,
				"buffer" : {
					"0" : 8,
					"1" : 0,
					"2" : 1,
					"3" : 0,
					"4" : 1,
					"5" : 0,
					"6" : 0,
					"7" : 0
				}
			}, {
				"size" : 12,
				"buffer" : {
					"0" : 12,
					"1" : 0,
					"2" : 2,
					"3" : 0,
					"4" : 2,
					"5" : 0,
					"6" : 0,
					"7" : 0,
					"8" : 0,
					"9" : 0,
					"10" : 0,
					"11" : 0
				}
			}
		];
		var output = [2, 0, 128, 0, 8, 0, 2, 0, 8, 0, 1, 0, 1, 0, 0, 0, 12, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0];

		var temp = new SCard.Response.Bind(input);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//manager query running
	it("Manager query response with valid input", function () {
		var input = [];
		var output = [4, 0, 131, 0];

		var temp = new SCard.Response.ManagerStatus(input);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);
	});

	it("Manager query response with invalid input", function () {
		var input = [];
		var output = [2, 0, 131, 0];

		var temp = new SCard.Response.ManagerStatus(input);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//establish context
	it("Establish context response with valid input", function () {
		var context = 1085377743;
		var output = [12, 0, 133, 0, 0, 0, 0, 0, 207, 140, 177, 64];

		var temp = new SCard.Response.EstablishContext(successCode, context);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);
	});

	it("Establish context response with invalid input", function () {
		var context = 105377743;
		var output = [12, 0, 133, 0, 0, 0, 0, 0, 70, 246, 181, 75];

		var temp = new SCard.Response.EstablishContext(successCode, context);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//list reader
	it("List reader response with valid input", function () {
		var readerName = 'OMNIKEY AG CardMan 3121 00 00';
		var output = [74, 0, 147, 0, 0, 0, 0, 0, 12, 0, 62, 0, 79, 0, 77, 0, 78, 0, 73, 0, 75, 0, 69, 0, 89, 0, 32, 0, 65, 0, 71, 0, 32, 0, 67, 0, 97, 0, 114, 0, 100, 0, 77, 0, 97, 0, 110, 0, 32, 0, 51, 0, 49, 0, 50, 0, 49, 0, 32, 0, 48, 0, 48, 0, 32, 0, 48, 0, 48, 0, 0, 0, 0, 0];

		var temp = new SCard.Response.ListReader(successCode, readerName);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);
	});

	it("List reader response with invalid input", function () {
		var readerName = 'OMMIKEY AG CardMan 3121 00 00';
		var output = [74, 0, 147, 0, 0, 0, 0, 0, 12, 0, 62, 0, 79, 0, 77, 0, 78, 0, 73, 0, 75, 0, 69, 0, 89, 0, 32, 0, 65, 0, 71, 0, 32, 0, 67, 0, 97, 0, 114, 0, 100, 0, 77, 0, 97, 0, 110, 0, 32, 0, 51, 0, 49, 0, 50, 0, 49, 0, 32, 0, 48, 0, 48, 0, 32, 0, 48, 0, 48, 0, 0, 0, 0, 0];

		var temp = new SCard.Response.ListReader(successCode, readerName);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//connect request
	it("Connect response with valid input", function () {
		var handle = 1191391529;
		var protocol = 1;
		var output = [16, 0, 149, 0, 0, 0, 0, 0, 41, 49, 3, 71, 1, 0, 0, 0];

		var temp = new SCard.Response.Connect(successCode, handle, protocol);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);
	});

	it("Connect response with invalid input", function () {
		var handle = 1191391529;
		var protocol = 1;
		var output = [1, 0, 149, 0, 0, 0, 0, 0, 41, 49, 3, 71, 1, 0, 0, 0];

		var temp = new SCard.Response.Connect(successCode, handle, protocol);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//disconnect request
	it("Disconnect response with valid input", function () {
		var output = [8, 0, 151, 0, 0, 0, 0, 0];

		var temp = new SCard.Response.Disconnect(successCode);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);
	});

	it("Disconnect response with invalid input", function () {
		var output = [8, 0, 150, 0, 0, 0, 0, 0];

		var temp = new SCard.Response.Disconnect(successCode);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//begin transaction
	it("Begin transaction response with valid input", function () {
		var output = [8, 0, 153, 0, 0, 0, 0, 0];

		var temp = new SCard.Response.BeginTransaction(successCode);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);
	});

	it("Begin transaction response with invalid input", function () {
		var output = [7, 0, 153, 0, 0, 0, 0, 0];

		var temp = new SCard.Response.BeginTransaction(successCode);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//status request
	it("Status response with valid input", function () {
		var readerName = 'OMNIKEY AG CardMan 3121 00 00';
		var returnCode = 0x06;
		var protocol = 1;
		var atr = [59, 22, 150, 65, 115, 116, 114, 105, 100];
		var output = [94, 0, 152, 0, 0, 0, 0, 0, 23, 0, 62, 0, 6, 0, 0, 0, 1, 0, 0, 0, 85, 0, 9, 79, 0, 77, 0, 78, 0, 73, 0, 75, 0, 69, 0, 89, 0, 32, 0, 65, 0, 71, 0, 32, 0, 67, 0, 97, 0, 114, 0, 100, 0, 77, 0, 97, 0, 110, 0, 32, 0, 51, 0, 49, 0, 50, 0, 49, 0, 32, 0, 48, 0, 48, 0, 32, 0, 48, 0, 48, 0, 0, 0, 0, 0, 59, 22, 150, 65, 115, 116, 114, 105, 100];

		var temp = new SCard.Response.Status(successCode, readerName, returnCode, protocol, atr);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);
	});

	it("Status response with invalid input", function () {
		var readerName = 'OMNIKEY AG CardMan 3121 00 00';
		var returnCode = 0x05;
		var protocol = 1;
		var atr = [59, 22, 150, 65, 115, 116, 114, 105, 100];
		var output = [94, 0, 152, 0, 0, 0, 0, 0, 23, 0, 62, 0, 6, 0, 0, 0, 1, 0, 0, 0, 85, 0, 9, 79, 0, 77, 0, 78, 0, 73, 0, 75, 0, 69, 0, 89, 0, 32, 0, 65, 0, 71, 0, 32, 0, 67, 0, 97, 0, 114, 0, 100, 0, 77, 0, 97, 0, 110, 0, 32, 0, 51, 0, 49, 0, 50, 0, 49, 0, 32, 0, 48, 0, 48, 0, 32, 0, 48, 0, 48, 0, 0, 0, 0, 0, 59, 22, 150, 65, 115, 116, 114, 105, 100];

		var temp = new SCard.Response.Status(successCode, readerName, returnCode, protocol, atr);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//reader capabilites
	it("Reader capabilites response with valid input", function () {
		var output = [21, 0, 158, 0, 0, 0, 0, 0, 12, 0, 9, 0, 59, 22, 150, 65, 115, 116, 114, 105, 100];
		var atr = [59, 22, 150, 65, 115, 116, 114, 105, 100];

		var temp = new SCard.Response.GetAttribute(successCode, atr);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);

		//var atr = [79, 0, 77, 0, 78, 0, 73, 0, 75, 0, 69, 0, 89, 0, 32, 0, 65, 0, 71, 0, 32, 0, 67, 0, 97, 0, 114, 0, 100, 0, 77, 0, 97, 0, 110, 0, 32, 0, 51, 0, 49, 0, 50, 0, 49, 0, 32, 0, 48, 0, 48, 0, 32, 0, 48, 0, 48, 0, 0, 0];
		//var output = [72, 0, 158, 0, 0, 0, 0, 0, 12, 0, 60, 0, 79, 0, 77, 0, 78, 0, 73, 0, 75, 0, 69, 0, 89, 0, 32, 0, 65, 0, 71, 0, 32, 0, 67, 0, 97, 0, 114, 0, 100, 0, 77, 0, 97, 0, 110, 0, 32, 0, 51, 0, 49, 0, 50, 0, 49, 0, 32, 0, 48, 0, 48, 0, 32, 0, 48, 0, 48, 0, 0, 0];

	});

	it("Reader capabilites response with invalid input", function () {
		var output = [20, 0, 158, 0, 0, 0, 0, 0, 12, 0, 9, 0, 59, 22, 150, 65, 115, 116, 114, 105, 100];
		var atr = [59, 22, 150, 65, 115, 116, 114, 105, 100];

		var temp = new SCard.Response.GetAttribute(successCode, atr);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//transmit request
	it("Transmit response with valid input", function () {
		var output = [42, 0, 156, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 26, 0, 0, 210, 93, 28, 69, 163, 0, 0, 0, 14, 5, 4, 255, 31, 255, 255, 1, 0, 1, 0, 0, 0, 255, 255, 144, 0];
		var atr = [0, 210, 93, 28, 69, 163, 0, 0, 0, 14, 5, 4, 255, 31, 255, 255, 1, 0, 1, 0, 0, 0, 255, 255, 144, 0];

		var temp = new SCard.Response.Transmit(successCode, atr);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);

		//var atr = [97, 15];
		//var output = [18, 0, 156, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 2, 0, 97, 15];

	});

	it("Transmit response with invalid input", function () {
		var output = [41, 0, 156, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 26, 0, 0, 210, 93, 28, 69, 163, 0, 0, 0, 14, 5, 4, 255, 31, 255, 255, 1, 0, 1, 0, 0, 0, 255, 255, 144, 0];
		var atr = [0, 210, 93, 28, 69, 163, 0, 0, 0, 14, 5, 4, 255, 31, 255, 255, 1, 0, 1, 0, 0, 0, 255, 255, 144, 0];

		var temp = new SCard.Response.Transmit(successCode, atr);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//release context
	it("Release context response with valid input", function () {
		var output = [8, 0, 134, 0, 0, 0, 0, 0];

		var temp = new SCard.Response.ReleaseContext(successCode);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);
	});

	it("Release context response with invalid input", function () {
		var output = [7, 0, 134, 0, 0, 0, 0, 0];

		var temp = new SCard.Response.ReleaseContext(successCode);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//end transaction
	it("End transaction response with valid input", function () {
		var output = [8, 0, 154, 0, 0, 0, 0, 0];

		var temp = new SCard.Response.EndTransaction(successCode);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);
	});

	it("End transaction response with invalid input", function () {
		var output = [8, 0, 154, 0, 0, 0, 0];

		var temp = new SCard.Response.EndTransaction(successCode);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//is valid context
	it("Is Valid context response with valid input", function () {
		var output = [8, 0, 160, 0, 0, 0, 0, 0];

		var temp = new SCard.Response.IsValidContext(successCode);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);
	});

	it("Is Valid context response with invalid input", function () {
		var output = [8, 0, 0, 0, 0, 0, 0];

		var temp = new SCard.Response.IsValidContext(successCode);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//reconnect
	it("Reconnect response with valid input", function () {
		var output = [12, 0, 150, 0, 0, 0, 0, 0, 2, 0, 0, 0];
		var protocol = 2;

		var temp = new SCard.Response.Reconnect(successCode, protocol);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);
	});

	it("Reconnect response with invalid input", function () {
		var output = [12, 0, 150, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var protocol = 2;

		var temp = new SCard.Response.Reconnect(successCode, protocol);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	//control
	it("Control response with valid input", function () {
		var output = [18, 0, 157, 0, 0, 0, 0, 0, 12, 0, 6, 0, 12, 4, 42, 33, 0, 12];
		var data = [12, 04, 42, 33, 00, 12];

		var temp = new SCard.Response.Control(successCode, data);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).toEqual(output);
	});

	it("Control response with invalid input", function () {
		var output = [18, 0, 157, 0, 0, 0, 0, 0, 12, 0, 6, 0, 12, 4, 42, 33, 0, 1];
		var data = [12, 04, 42, 33, 00, 12];

		var temp = new SCard.Response.Control(successCode, data);
		var obj = temp.getBuffer();
		expect(Array.prototype.slice.call(obj.buffer)).not.toEqual(output);
	});

	it('', function () {
		console.log("-------------------------------------------");
		console.log("  End of response to wire");
		console.log("-------------------------------------------");
	});
});
