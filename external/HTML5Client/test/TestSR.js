/**
 * Created by Goutham Peepala on 28-11-2016
 */


/********************************************************************************************
 *                                  CGP-Core Validation                                     *
 ********************************************************************************************/
describe("Unit Test for SR-CGPCore", function() {
    var srTimeOut = 180;
    var socket = jasmine.createSpyObj("socket", ["send","Disconnect","Suspend"]);
    var user = jasmine.createSpyObj("user", ["sessionResumed","sessionAccepted","sessionClosing","sessionClosed"]);
    var callBack = jasmine.createSpyObj("callBackWrapper", ["hideReconnectingOverlay","CGP_Resume"]);
	var channel;
    debugger;
    var cgpCore = new CGPCore(user, [TcpProxyService], socket, callBack, srTimeOut);
    it("Testing GetReliabilityParams()", function() {
        console.log("-------------------------------------------");
        console.log("      Validating SR Reliability Params     ");
        console.log("-------------------------------------------");
        var output = {'reliabilityTimeOut' : 180, 'UIFlags': 1, 'UIDimmingPercentage' : 25};
        expect(cgpCore.getReliabilityParams()).toEqual(output);
    });
	changeCoreState(CORESTATE_CONNECTED);
	it("Testing Close", function() {
        console.log("-------------------------------------------");
        console.log("      Validating Close Function     ");
        console.log("-------------------------------------------");
		cgpCore.Close();
    });
	
	it("Testing networkStateChange", function() {
        console.log("-------------------------------------------");
        console.log("      Validating networkStateChange Function     ");
        console.log("-------------------------------------------");
		cgpCore.networkStateChange();
		//expect(cgpCore.Close()).toEqual(0);
    });

	it("Testing getSentOpenRequests", function() {
        console.log("-------------------------------------------");
        console.log("      Validating getSentOpenRequests Function     ");
        console.log("-------------------------------------------");
		cgpCore.getSentOpenRequests();
		//expect(cgpCore.Close()).toEqual(0);
    });
	it("Testing sendNop", function() {
        console.log("-------------------------------------------");
        console.log("      Validating sendNop Function    ");
        console.log("-------------------------------------------");
		cgpCore.sendNop();
		//expect(cgpCore.Close()).toEqual(0);
    });
	
	it("Testing setting ReliabilityParamsCapability", function() {
		var testBuffer = [1, 180, 0, 1, 0, 80, 0, 60, 0, 14, 0, 0, 7, 0, 0, 0, 184, 11, 0, 0, 184, 11, 0, 0, 164, 0, 0, 0, 1, 0, 0, 0, 1, 28, 1, 0, 1, 0, 0, 22, 67, 105, 116, 114, 105, 120, 46, 84, 99, 112, 80, 114, 111, 120, 121, 83, 101, 114, 118, 105, 99, 101];
		var cgpBuffer = new CGPBuffer(testBuffer, testBuffer.length, 9);
        console.log("-------------------------------------------");
        console.log("      Validating handleReliabilityParamsCapability Function    ");
        console.log("-------------------------------------------");
		cgpCore.setCapability(CGPConstants.CGP_SERVICEID_CORE, CGPConstants.CGP_CAPABILITY_RELIABILITY_PARAMS, cgpBuffer);
		//expect(cgpCore.Close()).toEqual(0);
    });
	
	
	it("Testing setting Security Ticket Capability", function() {
		var testBuffer = [1, 180, 0, 1, 0, 80, 0, 60, 0, 14, 0, 0, 7, 0, 0, 0, 184, 11, 0, 0, 184, 11, 0, 0, 164, 0, 0, 0, 1, 0, 0, 0, 1, 28, 1, 0, 1, 0, 0, 22, 67, 105, 116, 114, 105, 120, 46, 84, 99, 112, 80, 114, 111, 120, 121, 83, 101, 114, 118, 105, 99, 101];
		var cgpBuffer = new CGPBuffer(testBuffer, testBuffer.length, 9);
        console.log("-------------------------------------------");
        console.log("      Validating Handling SecurityTicketCapability Function    ");
        console.log("-------------------------------------------");
		cgpCore.setCapability(CGPConstants.CGP_SERVICEID_CORE, CGPConstants.CGP_CAPABILITY_SECURITY_TICKET, cgpBuffer);
		//expect(cgpCore.Close()).toEqual(0);
    });
	
	it("Testing setting Session Reliability Capability", function() {
		var testBuffer = new Uint8Array([1, 1, 1, 2, 5, 0, 1, 2, 5, 0, 0, 0, 0, 0, 0, 2, 16, 78, 83, 1, 0, 203, 30, 206, 127, 121, 232, 3, 72, 51, 102, 162, 187, 0, 15, 0, 0, 9, 0, 0, 0, 1, 180, 0, 1, 0, 80, 0, 60, 0, 14, 0, 0, 7, 0, 0, 0, 184, 11, 0, 0, 184, 11, 0, 0, 164, 0, 0, 0, 1, 0, 0, 0, 1, 28, 1, 0, 1, 0, 0, 22, 67, 105, 116, 114, 105, 120, 46, 84, 99, 112, 80, 114, 111, 120, 121, 83, 101, 114, 118,105,99,101]);
        var cgpBuffer = new CGPBuffer(testBuffer, testBuffer.length, 34);
        console.log("-------------------------------------------");
        console.log("      Validating handleSessionReliabilityCapability Function    ");
        console.log("-------------------------------------------");
		cgpCore.setCapability(CGPConstants.CGP_SERVICEID_CORE, CGPConstants.CGP_CAPABILITY_SESSION_RELIABILITY, cgpBuffer);
    });
	
	it("Testing handleKeepAliveCapability", function() {
		var testBuffer = new Uint8Array([184, 11, 0, 0, 184, 11, 0, 0, 164, 0, 0, 0, 1, 0, 0, 0, 1, 28, 1, 0, 1, 0, 0, 22, 67, 105, 116, 114, 105, 120, 46, 84, 99, 112, 80, 114, 111, 120, 121, 83, 101, 114, 118, 105, 99, 101]);
		var cgpBuffer = new CGPBuffer(testBuffer, testBuffer.length, 8);
        console.log("-------------------------------------------");
        console.log("      Validating handleKeepAliveCapability Function    ");
        console.log("-------------------------------------------");
		cgpCore.setCapability(CGPConstants.CGP_SERVICEID_CORE, CGPConstants.CGP_CAPABILITY_KEEP_ALIVES, cgpBuffer);
    });
	
	it("Testing handlingBindCapability", function() {
		var testBuffer = new Uint8Array([1, 28, 1, 0, 1, 0, 0, 22, 67, 105, 116, 114, 105, 120, 46, 84, 99, 112, 80, 114, 111, 120, 121, 83, 101, 114, 118, 105, 99, 101]);
        var cgpBuffer = new CGPBuffer(testBuffer, testBuffer.length, 30);
        console.log("-------------------------------------------");
        console.log("      Validating handlingBindCapability Function    ");
        console.log("-------------------------------------------");
		expect(cgpCore.setCapability(CGPConstants.CGP_SERVICEID_CORE, CGPConstants.CGP_CAPABILITY_SERVICES_BINDING, cgpBuffer)).toEqual(undefined);
    });
	
	it("Testing Undefined Service ID", function() {
		var testBuffer = new Uint8Array([1, 28, 1, 0, 1, 0, 0, 22, 67, 105, 116, 114, 105, 120, 46, 84, 99, 112, 80, 114, 111, 120, 121, 83, 101, 114, 118, 105, 99, 101]);
        var cgpBuffer = new CGPBuffer(testBuffer, testBuffer.length, 30);
        console.log("-------------------------------------------");
        console.log("      Validating Undefined Service ID Function    ");
        console.log("-------------------------------------------");
		expect(cgpCore.setCapability(CGPConstants.CGP_CAPABILITY_SERVICES_BINDING, CGPConstants.CGP_CAPABILITY_SERVICES_BINDING, cgpBuffer)).toEqual(undefined);
    });
	
	it("Testing ProcessAckDelta", function() {
        console.log("-------------------------------------------");
        console.log("      Validating ProcessAckDelta Function    ");
        console.log("-------------------------------------------");
		expect(cgpCore.processAckDelta(0)).toEqual(undefined);
		expect(cgpCore.processAckDelta(-1)).toEqual(-1);
		cgpCore.processAckDelta(1);
    });
	
	it("Testing getAndResetAckDelta", function() {
        console.log("-------------------------------------------");
        console.log("      Validating getAndResetAckDelta Function    ");
        console.log("-------------------------------------------");
		expect(cgpCore.getAndResetAckDelta(0)).toEqual(0);
    });
	
	it("Testing getCoreState", function() {
		changeCoreState(CORESTATE_DISCONNECTED);
        console.log("-------------------------------------------");
        console.log("      Validating getCoreState Function    ");
        console.log("-------------------------------------------");
		expect(getCoreState()).toEqual(CORESTATE_DISCONNECTED);
		changeCoreState(CORESTATE_UNCONNECTED)
    });
	
	it("Testing isConnected", function() {
		changeCoreState(CORESTATE_CONNECTED);
        console.log("-------------------------------------------");
        console.log("      Validating isConnected Function    ");
        console.log("-------------------------------------------");
		expect(cgpCore.isConnected()).toEqual(true);
		changeCoreState(CORESTATE_UNCONNECTED);
		expect(cgpCore.isConnected()).toEqual(false);
    });
	
	it("Testing isSuspended", function() {
		changeCoreState(CORESTATE_SUSPENDED);
        console.log("-------------------------------------------");
        console.log("      Validating isSuspended Function    ");
        console.log("-------------------------------------------");
		expect(cgpCore.isSuspended()).toEqual(true);
		changeCoreState(CORESTATE_UNCONNECTED);
		expect(cgpCore.isSuspended()).toEqual(false);
    });
	it("Testing isServer", function() {
        console.log("-------------------------------------------");
        console.log("      Validating isServer Function    ");
        console.log("-------------------------------------------");
		expect(cgpCore.isServer()).toEqual(false);
    });
	
	it("Testing sendRealTimeData", function() {
        console.log("-------------------------------------------");
        console.log("      Validating sendRealTimeData Function    ");
        console.log("-------------------------------------------");
		cgpCore.sendRealtimeData ([0,1,3,4,6], 0,0);
    });
	
	it("Testing setSecurityTicket", function() {
        console.log("-------------------------------------------");
        console.log("      Validating setSecurityTicket Function    ");
        console.log("-------------------------------------------");
		cgpCore.setSecurityTicket(CGPConstants.CGP_TICKET_TYPE_STA,[0,0,0]);
    });
	it("Testing sendFinishRequest", function() {
        console.log("-------------------------------------------");
        console.log("      Validating sendFinishRequest Function    ");
        console.log("-------------------------------------------");
		cgpCore.sendFinishRequest(CGPConstants.CGP_FINISH_TYPE_CLOSE);
    });
	
	it("Testing sendFinishResponse", function() {
        console.log("-------------------------------------------");
        console.log("      Validating sendFinishResponse Function    ");
        console.log("-------------------------------------------");
		cgpCore.sendFinishResponse(CGPConstants.CGP_FINISH_TYPE_CLOSE);
    });
	
	it("Testing getKnownServiceByName", function() {
        console.log("-------------------------------------------");
        console.log("      Validating getKnownServiceByName Function    ");
        console.log("-------------------------------------------");
		expect(cgpCore.getKnownServiceByName("Citrix.TcpProxyService")).toEqual(null);
    });

	it("Testing assignChannelNumber	",function(){
		console.log("-------------------------------------------");
        console.log("      Validating assignChannelNumber Function    ");
        console.log("-------------------------------------------");
		expect(cgpCore.assignChannelNumber()).toEqual(0);
	});
	
	it("Testing createAndRegisterChannel",function(){
		console.log("-------------------------------------------");
        console.log("      Validating createAndRegisterChannel Function    ");
        console.log("-------------------------------------------");
		channel = cgpCore.createAndRegisterChannel();
	});
			
	it("Testing sendChannelClose",function(){
		console.log("-------------------------------------------");
        console.log("      Validating sendChannelClose Function    ");
        console.log("-------------------------------------------");
		expect(cgpCore.sendChannelClose(0,0,0)).toEqual(undefined);
	});
	
	it("Testing sendData",function(){
		console.log("-------------------------------------------");
        console.log("      Validating sendData Function    ");
        console.log("-------------------------------------------");
		expect(cgpCore.sendData(channel,[1,0,0,4,2,5],0, 5)).toEqual(undefined);
	});
	
	it("Testing sendOpenChannelRequest",function(){
		console.log("-------------------------------------------");
        console.log("      Validating sendOpenChannelRequest Function    ");
        console.log("-------------------------------------------");
		cgpCore.openChannel(TcpProxyService,false, CGPConstants.CGP_CHANNEL_PRIORITY_REALTIME, new Uint8Array(8));
	});
	
	 changeCoreState(CORESTATE_UNCONNECTED);
});

/********************************************************************************************
 *                                  CGP-Buffer Validation                                   *
 ********************************************************************************************/

// We validate the Functional Calls separately from Data Validation.

describe("Unit Test for SR-CGPBuffer Function Validation", function(){
    beforeEach(function() {
        spyOn(Utility, 'CopyArray');
    });
    it("Testing readData() CGPBuffer", function(){
        var testBuffer = new Uint8Array([4,8,7,6,9]);
        var varBufferLength = testBuffer.length;
        var varOffset = 0;
        var cgpVarBuffer = new CGPBuffer(testBuffer, varBufferLength, varOffset);
        var readValue = new Uint8Array([8,7,6,9]);
        console.log("-------------------------------------------");
        console.log("      Validating readData() CGPBuffer      ");
        console.log("-------------------------------------------");
        cgpVarBuffer.readData(testBuffer, 0, 4);
        expect(Utility.CopyArray).toHaveBeenCalled();
    });
});

describe("Unit Test for SR-CGPBuffer Data Validation", function(){
    var inputBuffer = new Uint8Array([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
    var bufferLength = inputBuffer.length;
    var offset = 0;
    var cgpBuffer = new CGPBuffer(inputBuffer, bufferLength, offset);
    //var Utility = jasmine.createSpyObj('Utility',['CopyArray']);


    /* TODO :Need More work use JSON.Stringify to validate - Too tedious Skipping for now
     it("Testing readBuffer()", function(){
     var readBytes = 4;
     var outputBuff = new Uint8Array([2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
     var output = new CGPBuffer(outputBuff, 4, 0);
     var actualOutput = cgpBuffer.readBuffer(readBytes);
     console.log("-------------------------------------------");
     console.log("      Validating readBuffer CGPBuffer      ");
     console.log("-------------------------------------------");
     expect(actualOutput).toEqual(output);
     });*/
    it("Testing readUint8()", function(){
        var readValue = 0;
        console.log("-------------------------------------------");
        console.log("      Validating readUint8 CGPBuffer       ");
        console.log("-------------------------------------------");
        expect(cgpBuffer.readUInt8()).toEqual(readValue);
    });
    /*
     Reads 1 and 2 from InputBuffer and
     Converts them to Uint16.
     */
    it("Testing readUint16()", function(){
        var readValue = 513;
        console.log("-------------------------------------------");
        console.log("      Validating readUint16 CGPBuffer      ");
        console.log("-------------------------------------------");
        expect(cgpBuffer.readUInt16()).toEqual(readValue);
    });
    /*
     Reads 3,4,5 and 6 from InputBuffer and
     Converts them to Uint32.
     */
    it("Testing readUint32()", function(){
        var readValue = 100992003;
        console.log("-------------------------------------------");
        console.log("      Validating readUint32 CGPBuffer      ");
        console.log("-------------------------------------------");
        expect(cgpBuffer.readUInt32()).toEqual(readValue);
    });
    /*
     Reads 7 from InputBuffer.
     Should Return 7.
     */
    it("Testing readVarInt()", function(){
        var readValue = 7;
        console.log("-------------------------------------------");
        console.log("      Validating readVarInt CGPBuffer      ");
        console.log("-------------------------------------------");
        expect(cgpBuffer.readVarInt()).toEqual(readValue);
    });
    /*
     Reads 8,9,10 from InputBuffer.
     and returns 8,910 as ASCII Uint8Array().
     */
    it("Testing readAsciiString()", function(){
        var readValue = new Uint8Array([8,9,10]);
        console.log("-------------------------------------------");
        console.log("    Validating readAsciiString CGPBuffer   ");
        console.log("-------------------------------------------");
        expect(cgpBuffer.readAsciiString(3)).toEqual(readValue);
    });

    /*
     Reads 11,12,13 from InputBuffer.
     and returns them as new Uint8Array().
     */
    it("Testing copyData()", function(){
        var readValue = new Uint8Array([11,12,13]);
        console.log("-------------------------------------------");
        console.log("       Validating copyData CGPBuffer       ");
        console.log("-------------------------------------------");
        expect(cgpBuffer.copyData(3)).toEqual(readValue);
    });
    /*
     Reads 11,12,13 from InputBuffer.
     and returns them as new Uint8Array().
     */
    it("Testing copyVarData()", function(){
        var testBuffer = new Uint8Array([4,8,7,6,9]);
        var varBufferLength = testBuffer.length;
        var varOffset = 0;
        var cgpVarBuffer = new CGPBuffer(testBuffer, varBufferLength, varOffset);
        var readValue = new Uint8Array([8,7,6,9]);
        console.log("-------------------------------------------");
        console.log("     Validating copyVarData CGPBuffer      ");
        console.log("-------------------------------------------");
        //cgpVarBuffer.copyVarData();
        expect(cgpVarBuffer.copyVarData()).toEqual(readValue);
        //expect(cgpVarBuffer.copyData()).toHaveBeenCalled();
    });
});

/********************************************************************************************
 *                                  CGP-Utils Validation                                    *
 ********************************************************************************************/

describe("Unit Test for SR-CGPUtils Validation", function(){
    //var inputBuffer = new Uint8Array([[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]]);
    it("Testing CgpEncodeVarlen() CGPUtils", function(){
        var testBuffer = new Uint8Array([8,7,6,9]);
        var offset = 0;
        // Have Inputs >128 which should return 2 and <128 which should return 1.
        var input1 = 57, input2= 140;
        console.log("-------------------------------------------");
        console.log("  Validating CgpEncodeVarlen() CGPUtils    ");
        console.log("-------------------------------------------");
        expect(CgpEncodeVarlen(input1, offset, testBuffer)).toEqual(1);
        expect(CgpEncodeVarlen(input2, offset, testBuffer)).toEqual(2);
    });
    it("Testing CgpEncodeVarlenBytesMacro() CGPUtils", function(){
        // Have Inputs >128 which should return 2 and <128 which should return 1.
        var input1 = 57, input2= 140;
        console.log("-------------------------------------------");
        console.log("  Validating CgpEncodeVarlenBytesMacro()   ");
        console.log("-------------------------------------------");
        expect(CgpEncodeVarlenBytesMacro(input1)).toEqual(1);
        expect(CgpEncodeVarlenBytesMacro(input2)).toEqual(2);
    });
    it("Testing getVarDataLength() CGPUtils", function(){
        //Have InputBuffers with lengths >128 which should return 2 and <128 which should return 1.
        var testBuffer1 = new Uint8Array([8,7,6,9]);
        var testBuffer2 = new Uint8Array(140);
        var dataLength1 = testBuffer1.length;
        var dataLength2 = testBuffer2.length;
        console.log("-------------------------------------------");
        console.log("  Validating getVarDataLength() CGPUtils   ");
        console.log("-------------------------------------------");
        expect(getVarDataLength(testBuffer1)).toEqual((dataLength1 + 1));
        expect(getVarDataLength(testBuffer2)).toEqual((dataLength2 + 2));
    });
    it("Testing getVarLength() CGPUtils", function(){
        var testBuffer1 = new Uint8Array([8,7,6,9]);
        var testBuffer2 = new Uint8Array(140);
        //Have Inputs >128 which should return 2 and <128 which should return 1.
        var dataLength1 = testBuffer1.length;
        var dataLength2 = testBuffer2.length;
        console.log("-------------------------------------------");
        console.log("  Validating getVarLength() CGPUtils   ");
        console.log("-------------------------------------------");
        expect(getVarLength(dataLength1)).toEqual((dataLength1 + 1));
        expect(getVarLength(dataLength2)).toEqual((dataLength2 + 2));
    });
    it("Testing CgpEncodeLong() CGPUtils", function(){
        var testBuffer = new Uint8Array([8,7,6,9]);
        var offset = 0;
        var input1 = 57;
        console.log("-------------------------------------------");
        console.log("    Validating CgpEncodeLong() CGPUtils    ");
        console.log("-------------------------------------------");
        expect(CgpEncodeLong(input1, offset, testBuffer)).toEqual(4);
    });
    it("Testing cgpWriteVarLength() CGPUtils", function(){
        var testBuffer = new Uint8Array([8,7,6,9]);
        var offset = 0;
        //Have Inputs >128 which should return 2 and <128 which should return 1.
        var input1 = 57, input2 =140;
        console.log("-------------------------------------------");
        console.log("  Validating cgpWriteVarLength() CGPUtils  ");
        console.log("-------------------------------------------");
        expect(cgpWriteVarLength(input1, offset, testBuffer)).toEqual(1);
        offset = 0;
        expect(cgpWriteVarLength(input2, offset, testBuffer)).toEqual(2);
    });
    it("Testing cgpWriteVarData() CGPUtils", function(){
        var testBuffer1 = new Uint8Array([8,7,6,9]);
        var testBuffer2 = new Uint8Array(130);
        var lengthTestBuf1 = testBuffer1.length;
        var offset = 0;
        console.log("-------------------------------------------");
        console.log("    Validating cgpWriteVarData() CGPUtils    ");
        console.log("-------------------------------------------");
        expect(cgpWriteVarData(testBuffer1, offset, testBuffer2)).toEqual((1+lengthTestBuf1));
        //  expect(cgpWriteVarLength).toHaveBeenCalledWith(testBuffer1, offset, testBuffer2);
    });
    it("Testing writeUint16() CGPUtils", function(){
        var testBuffer = new Uint8Array([8,7,6,9]);
        var offset = 0;
        var input1 = 57;
        console.log("-------------------------------------------");
        console.log("     Validating writeUint16() CGPUtils     ");
        console.log("-------------------------------------------");
        expect(writeUint16(input1, offset, testBuffer)).toEqual(2);
    });
    it("Testing writeUint32() CGPUtils", function(){
        var testBuffer = new Uint8Array([8,7,6,9]);
        var offset = 0;
        var input1 = 57;
        console.log("-------------------------------------------");
        console.log("     Validating writeUint32() CGPUtils     ");
        console.log("-------------------------------------------");
        expect(writeUint32(input1, offset, testBuffer)).toEqual(4);
    });
    it("Testing getVarLenLength() CGPUtils", function(){
        // Have Inputs >128 which should return 2 and <128 which should return 1.
        var input1 = 57, input2= 140;
        console.log("-------------------------------------------");
        console.log("       Validating getVarLenLength()        ");
        console.log("-------------------------------------------");
        expect(getVarLenLength(input1)).toEqual(1);
        expect(getVarLenLength(input2)).toEqual(2);
    });
    it("Testing stringToBytes() CGPUtils", function(){
        //Have InputBuffers with lengths >128 which should return 2 and <128 which should return 1.
        var testString = 'Hello';
        var buffer = new Uint8Array([72,101,108,108,111]);
        console.log("-------------------------------------------");
        console.log("    Validating stringToBytes() CGPUtils    ");
        console.log("-------------------------------------------");
        expect(stringToBytes(testString)).toEqual(buffer);
    });
});

/********************************************************************************************
 *                                  CGP-Capabilities Validation                                    *
 ********************************************************************************************/

describe("Unit Test for SR-CGPCapabilities Validation", function(){
    var cap = new CGPCapability(1,0);
    it("Testing End Point Capability", function(){
        var testBuffer = new Uint8Array([8, 0, 0, 2, 0, 0, 0, 0, 0]);
        var ticketData = new Uint8Array(0);
        var cap = new EndPointCapability();
        cap.set(CGPConstants.CGP_TICKET_TYPE_STA, ticketData);
        console.log("-------------------------------------------");
        console.log("       Validating End Point Capability     ");
        console.log("-------------------------------------------");
        expect(cap.getBytes()).toEqual(testBuffer);
    });
    it("Testing SecurityTicket Capability", function(){
        var ticketData = ';40;STA490101972;E22678CF749AB3225AB0D11FC3C9A5';
        var testBuffer = new Uint8Array([55, 0, 0, 6, 0, 0, 0, 0, 47, 59, 52, 48, 59, 83, 84, 65, 52, 57, 48, 49, 48, 49, 57, 55, 50, 59, 69, 50, 50, 54, 55, 56, 67, 70, 55, 52, 57, 65, 66, 51, 50, 50, 53, 65, 66, 48, 68, 49, 49, 70, 67, 51, 67, 57, 65, 53]);
        var cap = new SecurityTicketCapability(CGPConstants.CGP_TICKET_TYPE_STA, ticketData);
        cap.set(CGPConstants.CGP_TICKET_TYPE_STA, ticketData);
        console.log("-------------------------------------------");
        console.log("   Validating SecurityTicket Capability    ");
        console.log("-------------------------------------------");
        expect(cap.getBytes()).toEqual(testBuffer);
        var cgpBuffer = new CGPBuffer(testBuffer, testBuffer.length, 0);
        cap.read(cgpBuffer);
    });
    it("Testing Reliability Capability", function(){
        var testBuffer = new Uint8Array([24, 0, 0, 5, 0, 0, 0, 1, 1, 1, 2, 5, 0, 1, 2, 5, 0, 0, 0, 0, 0, 0, 2, 0, 0]);
        var cap = new ReliabilityCapability();
        cap.set(2,null, 0,[]);
        console.log("-------------------------------------------");
        console.log("      Validating Reliability Capability    ");
        console.log("-------------------------------------------");
        expect(cap.getBytes()).toEqual(testBuffer);
        var cgpBuffer = new CGPBuffer(testBuffer, testBuffer.length, 0);
        cap.read(cgpBuffer);
    });

    it("Testing Reliability Params Capability", function(){
        var testBuffer = new Uint8Array([15, 0, 0, 9, 0, 0, 0, 1, 180, 0, 1, 0, 25, 0, 10, 0]);
        var cap = new ReliabilityParamsCapability();
        console.log("-------------------------------------------");
        console.log(" Validating Reliability Params Capability  ");
        console.log("-------------------------------------------");
        expect(cap.getBytes()).toEqual(testBuffer);
        expect(cap.getReliabilityTimeout()).toEqual(180);
        expect(cap.getEstimatedTCPTimeout()).toEqual(10);
        expect(cap.getUIFlag()).toEqual(CGPConstants.CGP_RELIABILITY_UIFLAG_DIMMING);
        expect(cap.getUIDimmingPercentage()).toEqual(25);
        var cgpBuffer = new CGPBuffer(testBuffer, testBuffer.length, 0);
        cap.read(cgpBuffer);
    });

    it("Testing Bind Capability", function(){
        var testBuffer = new Uint8Array([36, 0, 0, 1, 0, 0, 0, 1, 28, 1, 0, 1, 0, 0, 22, 67, 105, 116, 114, 105, 120, 46, 84, 99, 112, 80, 114, 111, 120, 121, 83, 101, 114, 118, 105, 99, 101]);
        var cap = new BindCapability([TcpProxyService]);
        var cgpBuffer = new CGPBuffer(testBuffer, testBuffer.length, 0);
        cap.read(cgpBuffer);
        console.log("-------------------------------------------");
        console.log("       Validating Bind Capability          ");
        console.log("-------------------------------------------");
        expect(cap.getBytes()).toEqual(testBuffer);
    });

});


/********************************************************************************************
 *                                  CGP-Services Validation                                 *
 ********************************************************************************************/

describe("Unit Test for SR-Services Validation", function(){
    var serviceName = 'TestSRService';
    var serviceVersion = 12;
    var serviceID = 5;
    var cgpService = new CGPService(serviceName,serviceVersion);
    var cgpSTC = new ServiceToCore();
    cgpSTC.openChannel(null,null,null);
    var CGPCore =  jasmine.createSpyObj("CGPCore", ["openChannel","writeData","Suspend"]);
    var rec = jasmine.createSpyObj("REC",["writeData"]);
    rec.writeData();
    cgpService.register(CGPCore);
    CGPCore.openChannel();
    CGPCore.writeData();

    cgpService.bind(serviceVersion,serviceID);
    it("Testing getServiceName CGPService", function(){
        console.log("-------------------------------------------");
        console.log("       Validating getServiceName           ");
        console.log("-------------------------------------------");
        expect(cgpService.getServiceName()).toEqual(serviceName);
    });
    it("Testing getServiceVersion CGPService", function(){
        console.log("-------------------------------------------");
        console.log("       Validating getServiceVersion        ");
        console.log("-------------------------------------------");
        expect(cgpService.getServiceVersion()).toEqual(serviceVersion);
    });
    it("Testing getServiceID CGPService", function(){
        console.log("-------------------------------------------");
        console.log("         Validating getServiceID           ");
        console.log("-------------------------------------------");
        expect(cgpService.getServiceId()).toEqual(serviceID);
    });
    it("Testing getCapabilities CGPService", function(){
        console.log("-------------------------------------------");
        console.log("         Validating getServiceID           ");
        console.log("-------------------------------------------");
        expect(cgpService.getCapabilities()).toEqual(null);
    });
    it("Testing Service OpenConnection TCPProxyService", function(){
        var host = '127.0.0.1';
        var port = 1494;
        var hostAddress = new Uint8Array([49, 50, 55, 46, 48, 46, 48, 46, 49, 58, 49, 52, 57, 52]);
        var expectedHeader  = new Uint8Array([1, 14, 49, 50, 55, 46, 48, 46, 48, 46, 49, 58, 49, 52, 57, 52, 3, 0]);
        TcpProxyService.register(CGPCore);
        console.log("-------------------------------------------");
        console.log("        Make Channel Open Header           ");
        console.log("-------------------------------------------");
        //TcpProxyService.openConnection(host, port, rec);
        //expect(makeChannelOpenHeader).toHaveBeenCalledWith(hostAddress,TcpProxyService.CGP_TCPPROXY_PROTOCOL_ICA);
        expect(makeChannelOpenHeader(hostAddress, 3)).toEqual(expectedHeader);
    });
});


/********************************************************************************************
 *                                  CGP-Channel Validation                                 *
 ********************************************************************************************/

describe("Unit Test for SR-CGPChannel Validation", function(){
    var CGPCore = jasmine.createSpyObj("CGPCore", ["sendChannelClose","deregisterChannel","sendRealtimeData","sendData"]);
    var service = jasmine.createSpyObj("service",["channelClosed","dataArrived"]);
    var channelID = 1;
    var framed = false;
    var realTime = false;
    var channel = new CGPChannel(CGPCore,service,channelID,framed,realTime);

    it("Testing storeOpenRequest CGPChannel", function(){
        var request = 'hello Goutham';
        console.log("-------------------------------------------");
        console.log("       Validating storeOpenRequest         ");
        console.log("-------------------------------------------");
        channel.storeOpenRequest(request);
        console.log("-------------------------------------------");
        console.log("       Validating getOpenRequest           ");
        console.log("-------------------------------------------");
        expect(channel.getOpenRequest()).toEqual(request);
        channel.storeOpenRequest(request);
    });

    it("Testing Close() CGPChannel", function(){
        console.log("-------------------------------------------");
        console.log("       Validating Close CGPChannel         ");
        console.log("-------------------------------------------");
        channel.close(1);
        expect(CGPCore.sendChannelClose).toHaveBeenCalled();
    });
    it("Testing CloseReceived() CGPChannel", function(){
        console.log("-------------------------------------------");
        console.log("   Validating CloseReceived CGPChannel     ");
        console.log("-------------------------------------------");
        channel.closeReceived();
        expect(service.channelClosed).toHaveBeenCalled();
    });
    it("Testing destroy() CGPChannel", function(){
        console.log("-------------------------------------------");
        console.log("       Validating destroy CGPChannel       ");
        console.log("-------------------------------------------");
        channel.destroy();
        expect(CGPCore.deregisterChannel).toHaveBeenCalled();
    });

    it("Testing writeData() CGPChannel", function(){
        var testBuffer = new Uint8Array([4,8,7,6,9]);
        var varBufferLength = testBuffer.length;
        var varOffset = 0;
        console.log("-------------------------------------------");
        console.log("     Validating writeData CGPChannel       ");
        console.log("-------------------------------------------");
        channel.writeData(testBuffer,varOffset, varBufferLength);
        expect(CGPCore.sendData).toHaveBeenCalled();
    });

    it("Testing writeData() Realtime CGPChannel", function(){
        var testBuffer = new Uint8Array([4,8,7,6,9]);
        var varBufferLength = testBuffer.length;
        var varOffset = 0;
        console.log("-------------------------------------------");
        console.log("  Validating writeData Realtime CGPChannel ");
        console.log("-------------------------------------------");
        channel.isRealtime = true;
        channel.writeData(testBuffer,varOffset, varBufferLength);
        expect(CGPCore.sendRealtimeData).toHaveBeenCalled();
    });

    it("Testing dataArrived() CGPChannel", function(){
        var testBuffer = new Uint8Array([4,8,7,6,9]);
        var varBufferLength = testBuffer.length;
        var varOffset = 0;
        console.log("-------------------------------------------");
        console.log("    Validating dataArrived CGPChannel      ");
        console.log("-------------------------------------------");
        // Intially send Partial Data
        var data = new CGPBuffer(testBuffer,varBufferLength,varOffset);
        //channel.dataArrived(data,true);
        // Now send data, terminating data read.
        channel.dataArrived(data,false);
        expect(service.dataArrived).toHaveBeenCalled();
    });
});


/********************************************************************************************
 *                                  CGP-Socket Validation                                 *
 ********************************************************************************************/

describe("Unit Test for SR-CGPSocket Validation", function(){
    var CGPCore = jasmine.createSpyObj("CGPCore", ["sendChannelClose","deregisterChannel","sendRealtimeData","sendData",]);
    var socket = jasmine.createSpyObj("socket",["Send","Disconnect","setReceiveCallback"]);
    var OnConnectCallback = function () {
        return 'OnConnect';
    };
    var OnReceiveCallback = function () {
        return 'OnReceive';
    };
    var OnCloseCallback = function () {
        return 'OnClose';
    };

    var OnErrorCallback = function () {
        return 'OnError';
    };
    var callBackWrapper = function(){
        return 'CallBack';
    };
    var SRTimeout = 180;
    var cgpSocket = new CGPSocket(socket,OnConnectCallback,OnReceiveCallback,OnCloseCallback,OnErrorCallback,callBackWrapper,SRTimeout );
	changeCoreState(CORESTATE_UNCONNECTED);
    it("Testing OnConnect CGPSocket", function(){

        console.log("-------------------------------------------");
        console.log("     Validating OnConnect CGP Socket       ");
        console.log("-------------------------------------------");
        cgpSocket.OnConnect();
        // TODO if possibleexpect()
    });
    it("Testing WriteByte CGPSocket", function(){
        var testBuffer = new Uint8Array([4,8,7,6,9]);
        var varBufferLength = testBuffer.length;
        var varOffset = 0;
        var tcpSvc = TcpProxyService;
        console.log("-------------------------------------------");
        console.log("     Validating WriteByte CGP Socket       ");
        console.log("-------------------------------------------");
        var data = new CGPBuffer(testBuffer,varBufferLength,varOffset);
        //cgpSocket.close();
        cgpSocket.WriteByte(data,0,varBufferLength);
        //expect(tcpSvc.WriteStream).toHaveBeenCalled();
    });
    it("Testing Close CGPSocket", function(){
        console.log("-------------------------------------------");
        console.log("     Validating close CGP Socket       ");
        console.log("-------------------------------------------");
        cgpSocket.close();
    });
    it("Testing Reconnect CGPSocket", function(){
        console.log("-------------------------------------------");
        console.log("     Validating Reconnect CGP Socket       ");
        console.log("-------------------------------------------");
        cgpSocket.Reconnect();
    });
    it("Testing Suspend CGPSocket", function(){
        console.log("-------------------------------------------");
        console.log("     Validating Suspend CGP Socket         ");
        console.log("-------------------------------------------");
        cgpSocket.Suspend();
    });
    it("Testing SessionAccepted CGPSocket", function(){
        console.log("-------------------------------------------");
        console.log("  Validating SessionAccepted CGP Socket    ");
        console.log("-------------------------------------------");
        cgpSocket.sessionAccepted();
    });
    it("Testing SessionResumed CGPSocket", function(){
        console.log("-------------------------------------------");
        console.log("  Validating SessionResumed CGP Socket    ");
        console.log("-------------------------------------------");
        cgpSocket.sessionResumed();
    });
   
    it("Testing OnReceiveCallBack CGPSocket", function(){
        var event = {data:[0,1,2]};
        console.log("-------------------------------------------");
        console.log("  Validating OnReceiveCallBack CGP Socket    ");
        console.log("-------------------------------------------");
        expect(cgpSocket.OnReceiveCallback(event)).toEqual(undefined);
    });


 
    it("Testing OnConnect CGPChannel", function(){
        var ticketData = ';40;STA490101972;E22678CF749AB3225AB0D11FC3C9A5';
        console.log("-------------------------------------------");
        console.log("Validating OnConnect with SecurityTicket");
        console.log("-------------------------------------------");
        expect(cgpSocket.OnConnect(null,null,ticketData)).toEqual(undefined);
    });
});
