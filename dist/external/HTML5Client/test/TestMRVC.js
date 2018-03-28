describe("MRVC packet parsing validation", function () {
	var mockStream = new VirtualStream(0x18, function () {}, 0x2000);
	mockStream.RegisterCallback(function () {
		//Do nothing..
	});

	var engine = new MRVCEngine();	
	var browserBox = jasmine.createSpyObj('bb',['getMobileReceiverView']);
	
	var mobileReceiverViewObj = jasmine.createSpyObj('mobileReceiverView_obj',['showAutoKeyboardBtn','hideAutoKeyboardBtn']);
	
	browserBox.getMobileReceiverView.and.callFake(function(){	
		return mobileReceiverViewObj;
	});
	engine.setBrowserBox(browserBox);
	
	beforeEach(function() {
		spyOn(mockStream, 'WriteByte');
	});
	
	it("Parse Bind request", function() {		
		var output = {"input":{"deviceInputTypes":15,"keyboardTypes":511,"keyboardFeatures":511,"returnKeyTypes":511}};//capabilities object
		var input  = [4,0,20,0,12,0,1,0,15,0,255,1,255,1,255,1,40,0,2,0,36,0,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,5,0,63,3,8,0,6,0,7,0,1,0,6,0,7,0,15,0,6,0,8,0,1,0,4,0,9,0,6,0,10,0,3,0,4,0,11,0,4,0,12,0,6,0,14,0,3,0,6,0,15,0,15,0,6,0,16,0,1,0,6,0,17,0,1,0,6,0,18,0,1,0,24,0,19,0,7,0,3,0,127,0,0,0,31,0,3,0,0,0,15,0,15,0,0,0,70,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,21,0,15,0,6,0,22,0,0,0];

		console.log("Validating mrvc packet parsing for bind request");
		mockStream.consumeData(input, 0, input.length);
		expect(JSON.stringify(engine.parseBindRequest(mockStream))).toEqual(JSON.stringify(output));
	});
	it("Parse Bind response", function() {				
		var capabilities = {"input":{"deviceInputTypes":15,"keyboardTypes":511,"keyboardFeatures":511,"returnKeyTypes":511}};
		console.log("Validating mrvc packet parsing for bind commit");
		var transactionId =0;
		var expectedArray = [22,0,2,0,0,0,4,0,1,0,12,0,1,0,1,0,2,0,1,0,1,0];//to be updated based on the capabilities		
		var typeExpectedArray = new Uint8Array(expectedArray);
		engine.sendBindResponse(mockStream,capabilities,transactionId);			
		expect(mockStream.WriteByte).toHaveBeenCalledWith(typeExpectedArray,0,typeExpectedArray.length);
	});
	
	it("Sendkeyboardstate response", function() {					
		console.log("Validating mrvc packet parsing for sendKeyboardStateResponse");
		var transactionId =0;
		var expectedArray = [34, 0, 136, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var typeExpectedArray = new Uint8Array(expectedArray);
		engine.sendKeyboardStateResponse(mockStream,transactionId);	
		expect(mockStream.WriteByte).toHaveBeenCalledWith(typeExpectedArray,0,typeExpectedArray.length);
	});
	it("processShowKeyboardRequest", function() {					
		console.log("Validating mrvc packet parsing for processShowKeyboardRequest");
		var input = [2,0,10,0,0,0,1,0,38,0,0,0,190,0,0,0,104,3,0,0,60,1,0,0];
		var output = {left: 38, top: 190, right: 872, bottom: 316};
		mockStream.consumeData(input,0, input.length);		
		engine.processShowKeyboardRequest(mockStream);		
		expect(browserBox.getMobileReceiverView().showAutoKeyboardBtn).toHaveBeenCalledWith(output);
	});	
	it("processHideKeyboardRequest", function() {					
		console.log("Validating mrvc packet parsing for processHideKeyboardRequest");		
		engine.processHideKeyboardRequest();			
		expect(browserBox.getMobileReceiverView().hideAutoKeyboardBtn).toHaveBeenCalled();
	});	
});

describe("MRVC Engine flow unit test", function () {	
	var callbackWrapper  = jasmine.createSpyObj('callbackWrapper',['raiseSessionReadyEvent']);
	var engine = new MRVCEngine(callbackWrapper);	
	var browserBox = jasmine.createSpyObj('bb',['getMobileReceiverView']);
	
	var mobileReceiverViewObj = jasmine.createSpyObj('mobileReceiverView_obj',['showAutoKeyboardBtn','hideAutoKeyboardBtn']);
	
	browserBox.getMobileReceiverView.and.callFake(function(){	
		return mobileReceiverViewObj;
	});
	engine.setBrowserBox(browserBox);
	var vStream = engine.SetStack(null);
	engine.Run();	
	beforeEach(function() {
		spyOn(vStream, 'WriteByte');
		spyOn(engine, 'processBindRequest').and.callThrough();
		spyOn(engine, 'sendKeyboardStateResponse').and.callThrough();
		spyOn(engine, 'processShowKeyboardRequest').and.callThrough();
		spyOn(engine, 'processHideKeyboardRequest').and.callThrough();
	});
	
	it("processCommand parseBindRequest MRVC_BIND_REQUEST", function() {
		var input = [2,1,1,0,0,0,4,0,20,0,12,0,1,0,15,0,255,1,255,1,255,1,40,0,2,0,36,0,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,5,0,63,3,8,0,6,0,7,0,1,0,6,0,7,0,15,0,6,0,8,0,1,0,4,0,9,0,6,0,10,0,3,0,4,0,11,0,4,0,12,0,6,0,14,0,3,0,6,0,15,0,15,0,6,0,16,0,1,0,6,0,17,0,1,0,6,0,18,0,1,0,24,0,19,0,7,0,3,0,127,0,0,0,31,0,3,0,0,0,15,0,15,0,0,0,70,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,21,0,15,0,6,0,22,0,0,0];
		
		vStream.consumeData(input,0,input.length);
		expect(engine.processBindRequest).toHaveBeenCalled();
	});	
	
	it("processCommand parseBindRequest MRVC_BIND_COMMIT", function() {
		var input = [22,0,3,0,0,0,4,0,1,0,12,0,1,0,1,0,2,0,1,0,1,0];
		
		vStream.consumeData(input,0,input.length);		
		expect(engine.processBindRequest).toHaveBeenCalled();
	});	
	
	it("processCommand sendKeyboardStateResponse MRVC_CMD_KEYBOARD_STATE_GET_REQUEST", function() {
		var input = [6,0,128,0,251,214];
		
		vStream.consumeData(input,0,input.length);
		expect(engine.sendKeyboardStateResponse).toHaveBeenCalled();
	});
	
	it("processCommand processShowKeyboardRequest MRVC_CMD_KEYBOARD_SHOW_REQUEST", function() {
		var input = [30,0,129,0,79,22,2,0,10,0,0,0,1,0,38,0,0,0,190,0,0,0,104,3,0,0,60,1,0,0];
		
		vStream.consumeData(input,0,input.length);
		expect(engine.processShowKeyboardRequest).toHaveBeenCalled();
	});
	
	it("processCommand processHideKeyboardRequest MRVC_CMD_KEYBOARD_HIDE_REQUEST", function() {
		var input = [6,0,130,0,101,124];
		
		vStream.consumeData(input,0,input.length);
		expect(engine.processHideKeyboardRequest).toHaveBeenCalled();
	});
});
