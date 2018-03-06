function PrinterProcessor( ) {
    var vStream;
    var vd = null;
    var PRINT_JOB_CONTEXT = 1;//context is constant as there will be only one PDF printer for HTML5/chrome Receiver
    var printJobData = [];//contains an array of arraybuffer each of size ARRAYBUFFERSIZE
    var ARRAYBUFFERSIZE=4*1048576;//
	var arrayBuffer=null;
    var arrayBufferOffset=0;
    var printObject;
	this.initialize = function (vd1) {
        vd = vd1;
        vStream = vd.getVStream();
        printObject=vd.getPrintObject();
    };

    this.processCommand = function (cmd) {
        switch (cmd.h_type) {
            case CPMCONSTANT.ENUMPRINTER_REQUEST:
                handelEnumPrinterRequest(cmd);
                break;
            case CPMCONSTANT.CONNECT2_REQUEST:
                handelConnect2Request(cmd);
                break;
            case CPMCONSTANT.OPENPRINTER_REQUEST:
                handelOpenPrinterRequest(cmd);
                break;

            case CPMCONSTANT.WRITEPRINTER_REQUEST:
                handelWritePrinterRequest(cmd);
                break;

            case CPMCONSTANT.CLOSEPRINTER_REQUEST:
                handelClosePrinterRequest(cmd);
                break;
            default:
        }
    };

    function errorWord(errorCode, errorClass) {
        return ((errorCode << 8) | errorClass);
    }

    /*function to handel ENUMPRINTER REQUEST*/
    function handelEnumPrinterRequest(cmd) {
        var enumPrinterRequest = new EnumPrinterRequest();
        var enumPrinterReply = new EnumPrinterReply();
        var packet = new Uint8Array(CPMCONSTANT.ENUMPRINTER_REPLY_PACKET_HEADER_SIZE);
        var offset = 0;
        var header = new CpmPacketHeader();
        header.initialize(CPMCONSTANT.ENUMPRINTER_REPLY, cmd.mpxId);
        enumPrinterRequest.header = cmd;
        enumPrinterReply.header = header;
        marshallReadEnumPrinterRequest(vStream, enumPrinterRequest);
        enumPrinterReply.result = errorWord(CPMCONSTANT.CPM_DOSERROR_NOFILES, CPMCONSTANT.CPM_ERROR_NOTFOUND);
        enumPrinterReply.numberOfPrinter = 0;
        enumPrinterReply.size = 0;
        offset = marshallWriteEnumPrinterReply(packet, offset, enumPrinterReply);
        vStream.WriteByte(packet, 0, offset);
    }

    /*function to handel CONNECT2 REQUEST*/
    function handelConnect2Request(cmd) {
        var connect2Request = new Connect2Request();
        connect2Request.header = cmd;
        marshallReadConnect2Request(vStream, connect2Request);
    }

    /*function to handel OPENPRINTER REQUEST
     This request is to start a print job.
     After a successful open, data sent to the printer until a
     CLOSEPRINTER REQUEST is received defines a print job.
     */
    function handelOpenPrinterRequest(cmd) {
        var openPrintRequest = new OpenPrinterRequest();
        var openPrintReply = new OpenPrinterReply();
        var packet = new Uint8Array(CPMCONSTANT.OPENPRINTER_REPLY_PACKET_SIZE);
        var offset = 0;
        var header = new CpmPacketHeader();
        var byteName;
        header.initialize(CPMCONSTANT.OPENPRINTER_REPLY, cmd.mpxId);
        openPrintRequest.header = cmd;
        marshallReadOpenPrinterRequest(vStream, openPrintRequest);
        byteName = new Uint8Array(openPrintRequest.nameSize);
        vStream.ReadBytes(byteName, 0, openPrintRequest.nameSize);//reading the printer name
        openPrintReply.header = header;
        if(!(CPMCONSTANT.CPM_EXCLUSIVE_MODE & openPrintRequest.accessMode) || !(CPMCONSTANT.CPM_WRITEACCESS & openPrintRequest.accessMode)) {
            openPrintReply.result = errorWord(CPMCONSTANT.CPM_DOSERROR_BADACCESS, CPMCONSTANT.CPM_ERROR_INVALID);
            openPrintReply.context = -1;
        }
        else {
            openPrintReply.result = errorWord(CPMCONSTANT.CPM_DOSERROR_NOERROR, CPMCONSTANT.CPM_ERROR_NONE);
            openPrintReply.context = PRINT_JOB_CONTEXT;
            printObject.showDownloadingPDFDialog();
        }
		if(arrayBuffer===null) {
				arrayBuffer= new Uint8Array(ARRAYBUFFERSIZE);
		}
        printJobData=[];//initializing to array to store the data received from WritePrinter Request
        offset = marshallWriteOpenPrinterReply(packet, offset, openPrintReply);
        vStream.WriteByte(packet, 0, offset);
    }

    /*function to handel WRITEPRINTER REQUEST
    * data received from the virtual channel is stored into an arraybuffer of size ARRAYBUFFERSIZE.
     * each arraybuffer of size ARRAYBUFFERSIZE is pushed to printJobData array*/
    function handelWritePrinterRequest(cmd) {
        var writePrintRequest = new WritePrinterRequest();
        var writePrintReply = new WritePrinterReply();
        var packet = new Uint8Array(CPMCONSTANT.WRITEPRINTER_REPLY_PACKET_SIZE);
        var offset = 0;
        var header = new CpmPacketHeader();
        var data;
        header.initialize(CPMCONSTANT.WRITEPRINTER_REPLY, cmd.mpxId);
        writePrintRequest.header = cmd;
        writePrintReply.header = header;
        marshallReadWritePrinterRequest(vStream, writePrintRequest);
        if (writePrintRequest.context === PRINT_JOB_CONTEXT) {
            vStream.WaitForSpace(writePrintRequest.size);
			vStream.ReadBytes(arrayBuffer, arrayBufferOffset, writePrintRequest.size);
			arrayBufferOffset+=writePrintRequest.size;
			if(arrayBufferOffset===ARRAYBUFFERSIZE) {
				printJobData.push(arrayBuffer);
				arrayBuffer= new Uint8Array(ARRAYBUFFERSIZE);
				arrayBufferOffset=0;
			}
			else if(arrayBufferOffset>(ARRAYBUFFERSIZE-4096)) {
				data = arrayBuffer.subarray(0,arrayBufferOffset);
				printJobData.push(data);
				data=null;
				arrayBuffer= new Uint8Array(ARRAYBUFFERSIZE);
				arrayBufferOffset=0;
			}
            if (cmd.mpxId != 0) {
                writePrintReply.size = writePrintRequest.size;
                writePrintReply.result = errorWord(CPMCONSTANT.CPM_DOSERROR_NOERROR, CPMCONSTANT.CPM_ERROR_NONE);
                offset = marshallWriteWritePrinterReply(packet, offset, writePrintReply);
                vStream.WriteByte(packet, 0, offset);
            }
        }
        else {
            writePrintReply.size = 0;
            writePrintReply.result = errorWord(CPMCONSTANT.CPM_DOSERROR_UNKNOWN, CPMCONSTANT.CPM_ERROR_UNKNOWN);
            offset = marshallWriteWritePrinterReply(packet, offset, writePrintReply);
            vStream.WriteByte(packet, 0, offset);
            printObject.hideDownloadingPDFDialog();
        }
    }

    /*function to handel CLOSEPRINTER REQUEST*/
    function handelClosePrinterRequest(cmd) {
        var closePrinterRequest = new ClosePrinterRequest();
        var closePrinterReply = new ClosePrinterReply();
        var packet = new Uint8Array(CPMCONSTANT.CLOSEPRINTER_REPLY_PACKET_SIZE);
        var offset = 0;
        var header = new CpmPacketHeader();
        var data;
        var tempvar;
        var lastArrayBuffer;
        header.initialize(CPMCONSTANT.CLOSEPRINTER_REPLY, cmd.mpxId);
        closePrinterReply.header = header;
        closePrinterRequest.header = cmd;
        printObject.hideDownloadingPDFDialog();
        marshallReadClosePrinterRequest(vStream, closePrinterRequest);
        if (closePrinterRequest.context === PRINT_JOB_CONTEXT) {
            closePrinterReply.result = errorWord(CPMCONSTANT.CPM_DOSERROR_NOERROR, CPMCONSTANT.CPM_ERROR_NONE);
            if(arrayBufferOffset!==0) {
                //Push the arraybuffer which contains last bytes of print job (size of arraybuffer<ARRAYBUFFERSIZE) to array.
                data = arrayBuffer.subarray(0,arrayBufferOffset);
                printJobData.push(data);
                data=null;
                arrayBuffer= null;
                arrayBufferOffset=0;
            }
            // in case when we get closePrinterRequest immediate after openPrinter request,
            // there will be no data in printJobData array, so just cancel the print operation
            if(printJobData.length == 0){
                closePrinterReply.result = errorWord(CPMCONSTANT.CPM_DOSERROR_INVALIDHANDLE, CPMCONSTANT.CPM_ERROR_INVALID);
            }
            else{
                lastArrayBuffer=printJobData[printJobData.length-1];
                tempvar=lastArrayBuffer.length;
                //comparing the last 5 bytes of PDF file. If last 6 bytes is equal to "%%EOF." then complete file is received else print job is cancelled or restarted.
                if((lastArrayBuffer[tempvar-1]===0x0d || lastArrayBuffer[tempvar-1]===0x0a) && lastArrayBuffer[tempvar-2]===0x46 && lastArrayBuffer[tempvar-3]===0x4f && lastArrayBuffer[tempvar-4]===0x45 && (lastArrayBuffer[tempvar-5] && lastArrayBuffer[tempvar-6])===0x25) {
                    lastArrayBuffer=null;
                    printObject.showPrintDialog(new Blob(printJobData, {type: 'application/pdf'}));
                }
            }
        }
        else {
            closePrinterReply.result = errorWord(CPMCONSTANT.CPM_DOSERROR_INVALIDHANDLE, CPMCONSTANT.CPM_ERROR_INVALID);
        }
        offset = marshallWriteClosePrinterReply(packet, offset, closePrinterReply);
        vStream.WriteByte(packet, 0, offset);
        printJobData=null;
    }
}
