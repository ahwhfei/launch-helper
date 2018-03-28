describe("File VC Engine test", function() {
	var callbackWrapper  = jasmine.createSpyObj('callbackWrapper',['enableFileVC','raiseSessionReadyEvent','sendUploadResponseNotificationToUi','showFileTransferError','sendFileTransferConfigToUi']);
	var engine = new FileVirtualDriver(callbackWrapper);
	var stream = engine.SetStack(null);
	engine.Run();
	debugger;
	beforeEach(function() {
		spyOn(stream, 'WriteByte');
		spyOn(engine, 'processBindCommit').and.callThrough();
		spyOn(engine, 'createFileUploadRequest');
		spyOn(engine, 'resetUploadObjectQueue');
		
		});
	afterEach(function() {
		callbackWrapper.enableFileVC.calls.reset();
		stream.WriteByte.calls.reset();
	});
	it("Bind request validation", function(){
		var input  = [20,0,0,0,4,0,1,0,1,0,16,0,64,0,0,16,255,255,255,127,10,0,0,0];	
		stream.consumeData(input, 0, input.length);
		
		// Make sure to check that Ui component is informed about file transfer
		console.log("Bind request test : Test if the UI is informeed that file tranfser is enabled");
		expect(callbackWrapper.enableFileVC).toHaveBeenCalled();

		var expectedArray = [20, 0, 1, 0, 4, 0, 1, 0, 1, 0, 16, 0, 64, 0, 0, 16, 255, 255, 255, 127, 10, 0, 0, 0];
		
		//Make sure the write packet is written to wire
		console.log("Bind request test : Test if the bind response is written to the wire");
		var typedExpectedArray = new Uint8Array(expectedArray, 0, expectedArray.length);
		expect(stream.WriteByte).toHaveBeenCalledWith(typedExpectedArray, 0, typedExpectedArray.length);	
		
	});
	 it("Bind Commit validation", function(){
		var input  = [20,0,2,0,4,0,1,0,1,0,16,0,64,0,0,16,255,255,255,127,10,0,0,0];
		console.log("--------------sdssdsdsd--------");
		stream.consumeData(input, 0, input.length);
		var expectedArray = [4, 0, 1, 0, 1, 0, 16, 0, 64, 0, 0, 16, 255, 255, 255, 127, 10, 0, 0, 0];
		console.log("Bind commit test : Test if parseBindRequest is called with input array ");
		expect(engine.processBindCommit).toHaveBeenCalled();	
		
	}); 
	it("Testing File upload Request Packet to Server ", function(){
		// mocking file object which we get on selecting file from file explorer dialog
		var fileObj = {name:"sampleupload.zip",size : 27245458};
		engine.setFileUploadObject(fileObj);
		engine.sendFileUploadRequest();
		var expectedArray = [46, 0, 3, 0, 12, 0, 0, 0, 146, 187, 159, 1, 0, 0, 0, 0, 115, 0, 97, 0, 109, 0, 112, 0, 108, 0, 101, 0, 117, 0, 112, 0, 108, 0, 111, 0, 97, 0, 100, 0, 46, 0, 122, 0, 105, 0, 112, 0, 0, 0];
		
		//Make sure the write packet is written to wire
		console.log("C2H_Upload_Request: Test if the upload request is written to the wire");
		var typedExpectedArray = new Uint8Array(expectedArray, 0, expectedArray.length);
		expect(stream.WriteByte).toHaveBeenCalledWith(typedExpectedArray, 0, typedExpectedArray.length);
		
		// in case where user file upload queue is empty
		engine.sendFileUploadRequest();
		expect(engine.createFileUploadRequest).not.toHaveBeenCalled();
	});
	
	it("Testing File upload response with success code", function(){
		var input = [12,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0];	// response with success code
		stream.consumeData(input, 0, input.length);
		
		// Make sure to check that Ui component is notified about server response of file upload request
		console.log("File upload response test : Test if the UI is informeed about the file upload response");
		expect(callbackWrapper.sendUploadResponseNotificationToUi).toHaveBeenCalled();
	});
	
	it("Testing File upload response with failure code", function(){
		var input = [12,0,4,0,4,0,0,0,0,0,0,0,0,0,0,0];	// response with failure code
		stream.consumeData(input, 0, input.length);
		
		// Make sure to check that Ui component is notified about server response of file upload request
		console.log("File upload response test : Test if the UI is informeed about the file upload response");
		expect(callbackWrapper.sendUploadResponseNotificationToUi).toHaveBeenCalled();
		
		console.log("File upload response test : Test if file upload queue is reset")
		expect(engine.resetUploadObjectQueue).toHaveBeenCalled();
	});
	
});

describe("Packet Parsing Test", function() {
	var mockStream = new VirtualStream(0x10, function() {}, 0x2000);
	mockStream.RegisterCallback(function() {
		//Do nothing..
	});
	var callbackWrapper  = jasmine.createSpyObj('callbackWrapper',['enableFileVC','raiseSessionReadyEvent','sendUploadResponseNotificationToUi','showFileTransferError','sendFileTransferConfigToUi']);
	var engine = new FileVirtualDriver(callbackWrapper);
	it("Parse Bind request", function() {
		console.log("-------------------------------------------");
		console.log(" Staring to validate packet parsing logic ");
		console.log("-------------------------------------------");
		var output = "[{\"id\":1,\"size\":16,\"maxDataQueueLength\":64,\"maxGenericBlockSize\":4096,\"maxFileSize\":2147483647,\"maxFilesCount\":10}]";
		var input  = [4,0,1,0,1,0,16,0,64,0,0,16,255,255,255,127,10,0,0,0];

		console.log("Validating file vc packet parsing for bind request");
		var temp = JSON.stringify(engine.parseBindRequest(input));
		expect(JSON.stringify(engine.parseBindRequest(input))).toEqual(output);
	});
	
	it("Create bind response packet", function() {
		var input = "[{\"id\":1,\"size\":16,\"maxDataQueueLength\":64,\"maxGenericBlockSize\":4096,\"maxFileSize\":2147483647,\"maxFilesCount\":10}]";
		var output = "{\"0\":20,\"1\":0,\"2\":1,\"3\":0,\"4\":4,\"5\":0,\"6\":1,\"7\":0,\"8\":1,\"9\":0,\"10\":16,\"11\":0,\"12\":64,\"13\":0,\"14\":0,\"15\":16,\"16\":255,\"17\":255,\"18\":255,\"19\":127,\"20\":10,\"21\":0,\"22\":0,\"23\":0}";

		console.log("Validating bind response packet creation");
		var x = JSON.stringify(engine.createBindResponsePacket(input));
		expect(JSON.stringify(engine.createBindResponsePacket(JSON.parse(input)))).toEqual(output);
	});
	
	it("Create file upload request packet", function(){
		var input = {name:"sampleupload.zip",size : 27245458};
		var output = "{\"0\":46,\"1\":0,\"2\":3,\"3\":0,\"4\":12,\"5\":0,\"6\":0,\"7\":0,\"8\":146,\"9\":187,\"10\":159,\"11\":1,\"12\":0,\"13\":0,\"14\":0,\"15\":0,\"16\":115,\"17\":0,\"18\":97,\"19\":0,\"20\":109,\"21\":0,\"22\":112,\"23\":0,\"24\":108,\"25\":0,\"26\":101,\"27\":0,\"28\":117,\"29\":0,\"30\":112,\"31\":0,\"32\":108,\"33\":0,\"34\":111,\"35\":0,\"36\":97,\"37\":0,\"38\":100,\"39\":0,\"40\":46,\"41\":0,\"42\":122,\"43\":0,\"44\":105,\"45\":0,\"46\":112,\"47\":0,\"48\":0,\"49\":0}";

		console.log("Validating file upload request packet creation");
		expect(JSON.stringify(engine.createFileUploadRequest(input))).toEqual(output);
	});
	
	it("Parse file upload  response", function() {

		var output = "{\"statusCode\":0,\"fileContext\":0}";
		var input  = [0,0,0,0,0,0,0,0,0,0,0,0];

		console.log("Validating file vc packet parsing for upload response from server");
		expect(JSON.stringify(engine.parseFileUploadResponse(input))).toEqual(output);
	});
	it("Parse file download  response", function() {

		var output = "{\"statusCode\":0,\"fileContext\":0,\"fileSize\":105,\"fileName\":\"sampleFile.txt\"}";
		var input  = [0,0,0,0,0,0,16,0,105,0,0,0,0,0,0,0,115,97,109,112,108,101,70,105,108,101,46,116,120,116,0];

		console.log("Validating file vc packet parsing for download response from server");
		expect(JSON.stringify(engine.parseFileDownloadResponse(input))).toEqual(output);
	});
	
	
});