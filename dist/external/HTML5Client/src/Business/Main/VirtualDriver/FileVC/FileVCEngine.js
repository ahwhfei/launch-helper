function FileTransferCapability() {
	this.id;
	this.maxDataQueueLength;
	this.maxFilesCount;
	this.maxFileSize;
	this.maxGenericBlockSize;
	this.size;
}

/**
* This class implements the ICA File
* virtual channel client functionality.
*
*/	

function FileVirtualDriver(callbackWrapper1) {
    var myself = this;
    var callBackWrapper = callbackWrapper1;
    var streamName = "CTXFILE";
	//Instead of creating Uint8array of entire file size
	// creating array of Uint8array of constant size 4MB
	var UINT8_ARRAY_LIMIT = 4*1048576;
	var arrayBuffer = null;
	var currentDownloadOffset = 0;
	
    //TODO: Why is this 0x2000?
    var streamSize = 0x2000;

    var ICAFT_BIND_REQUEST = 0x00;
    var ICAFT_BIND_RESPONSE = 0x01;
    var ICAFT_BIND_COMMIT = 0x02;
	var ICAFT_C2H_UPLOAD_REQUEST     =  0x03;
	var ICAFT_H2C_UPLOAD_RESPONSE    =  0x04;
	var ICAFT_C2H_DOWNLOAD_REQUEST   =   0x05;
	var ICAFT_H2C_DOWNLOAD_RESPONSE  =   0x06;
	var ICAFT_H2C_UPLOAD_REQUEST	=	0x07;
	var ICAFT_C2H_UPLOAD_RESPONSE	=	0x08;
	var ICAFT_H2C_DOWNLOAD_REQUEST	=	0x09;
	var ICAFT_C2H_DOWNLOAD_RESPONSE	=	0x0A;
	var ICAFT_C2H_CONTROL_TRANSFER	=	0x0B;
	var ICAFT_H2C_CONTROL_TRANSFER	=	0x0C;
	var ICAFT_H2C_READ_REQUEST		=	0x0D;
	var ICAFT_C2H_READ_RESPONSE		=	0x0E;
	var ICAFT_H2C_WRITE_REQUEST		=	0x0F;
	var ICAFT_C2H_WRITE_RESPONSE	=	0x10;
	
/* File transfer control related status codes */

	/*Success Codes */
	var ICAFT_STATUS_SUCCESS	=	0x00;
	
	/* Notification codes */
	var ICAFT_STATUS_ABORT		=	0x01;
	var ICAFT_STATUS_PAUSE		=	0x02;
	var ICAFT_STATUS_RESUME		=	0x03;
	var ICAFT_STATUS_USER_CANCELED	= 0x04;
	
	/* Error codes */
	var ICAFT_STATUS_GENERIC_ERROR			=	0x80000001;
	var ICAFT_STATUS_INCORRECT_PARAMETER	=	0x80000002;
	var ICAFT_STATUS_INSUFFICIENT_MEMORY	=	0x80000003;
	var ICAFT_STATUS_TOO_MANY_FILES			=	0x80000004;
	var ICAFT_STATUS_ACCESS_DENIED			=	0x80000005;
	var ICAFT_STATUS_INVALID_HANDLE			=	0x80000006;
	var ICAFT_STATUS_ABORT_SHARING_VIOLATION	= 0x80000007;
	var ICAFT_STATUS_ABORT_DISK_FULL		=	0x80000008;
	var ICAFT_CAPABILITY_FILE_CAPACITY = 0x01;
	var BIND_RESPONSE_LENGTH = 4;
    var GENERIC_PARAMETERS_CAP_LENGTH = 10;
    var UPLOAD_REQUEST_LENGTH = 12;
    var FILE_READ_RESPONSE_LENGTH = 14;
    var DOWNLOAD_REQUEST_LENGTH = 0;
	var FILE_READ_REQUEST_LENGTH = 8;
	var FILE_WRITE_RESPONSE_LENGTH = 8;
	var FILE_DOWNLOAD_RESPONSE_LENGTH = 8;
	var FILE_TRANSFER_CONTROL_REQUEST_LENGTH = 8;
    var hasCommitted = false;

 
    var channelActive = false;
    var vStream = null;
	var uploadFileObj;
	var fileReader = new FileReader();
	var downloadFileName = new Array(0);
	var downloadFileSize = new Array(0);
	var fileDataArray = new Array(0);
	var receivedDataSize = new Array(0);
	var useChromeSock = HTML5Interface.isChromeSocketAvailable();
	var gFilePacketSize = (useChromeSock === true)? 4116 : 800; // Can send bigger packet sizes for regular sockets.
	var sentFileSIze = new Array(0);
	var uplaodRequestQueue = new Array(0);
	var isDownloadResponseReceived = true;
	var endIndex = 0;
	var startIndex = 0;
	var isFileTransferPaused = false;
	var uploadFileObjArray = new Array(0);
	var readRequestBuffer = [];
	var loadFileChunkSize = 0;
	var maxUploadChunkQueueLength = 64;
	var fileVCHeaderLength = 4;
	
	//Functions names needed for UT.
	var fns = {};	
	
    this.getStreamName = function () {
        return streamName;
    };

	var fileTransferConfig = Utility.GetFileTransferConfig();



    /**
    * Processes the commands as they come over the virtual channel.  This
    * method is currently designed to run continually in the thread.  This
    * consuming is synchronized by the vStream which blocks on any read until
    * data is available.
    */
    var processCommand = function (vStream) {
        var packet_len = vStream.ReadUInt16();  // Length is two-byte
        var command = vStream.ReadByte();   // Commands are 1-byte
        vStream.ReadByte();  //reserved one.

        var cmdBuffer = new Uint8Array(packet_len);
        vStream.ReadBytes(cmdBuffer, 0, packet_len);
        switch (command) {
            case ICAFT_BIND_REQUEST:
				processBindRequest(cmdBuffer);
				callBackWrapper.enableFileVC();
                break;

            case ICAFT_BIND_COMMIT:
				fns.processBindCommit(cmdBuffer);
				callBackWrapper.raiseSessionReadyEvent();
                break;
            case ICAFT_H2C_UPLOAD_RESPONSE:
            	handleFileUploadResponse(cmdBuffer);
            	break;
			case ICAFT_H2C_DOWNLOAD_RESPONSE:
				handleFileDownload(cmdBuffer);
            	break;
            case ICAFT_H2C_READ_REQUEST:
            	handleFileRead(cmdBuffer);
            	break;
            case ICAFT_H2C_WRITE_REQUEST:
            	handleFileWrite(cmdBuffer);
            	break;
            case ICAFT_H2C_CONTROL_TRANSFER:
            	handleFileControlRequest(cmdBuffer);
            	break;
			case ICAFT_H2C_DOWNLOAD_REQUEST:
				handleFileDownloadRequest(cmdBuffer);
			default:
                // Unknown command
                //throw new ProtocolException("Control Virtual Channel unknown command: "+Util.twoHexChars(command));
                //break;
        }
    };

    var driverShutdown = function () {

    };

    var createVirtualStream = function (streamName, streamSize) {
        var chnl = ChannalMap.virtualChannalMap[streamName];
        var stream = new VirtualStream(chnl, callBackWrapper, streamSize);
        return stream;
    };
    this.EndWriting = function endWriting(reason) {

    };

    this.driverStart = function () {
    };

	var processBindRequest = function(buffer){
		var hostCapabilities = parseBindRequest(buffer);
		console.log(hostCapabilities);
		var buffer = createBindResponsePacket(hostCapabilities);
		vStream.WriteByte(buffer, 0, buffer.length);
	};
	
	var processBindCommit = function(buffer){
		var hostCapabilities = parseBindRequest(buffer);
	};


	var parseBindRequest = function(buffer) {
	    //We can safely assume that header will be already processed
	    //the stream points to capBlocks
	    var offset = ByteWriter.readUInt2(buffer, 0);
	    var numCaps = buffer[2];
	    var returningCapsNum = 0;
	    var capabilities = [];

	    var i = 0;
	    while (i < numCaps) {
	        var capOffset = offset;
	        var capabilityID = ByteWriter.readUInt2(buffer, offset);
	        offset += 2;
	        var capabilitySize = buffer[offset++];
	        offset++; // Reserved byte


	        switch (capabilityID) {
	            case ICAFT_CAPABILITY_FILE_CAPACITY:
	                var capability = new FileTransferCapability();
	                capability.id = capabilityID;
	                capability.size = capabilitySize;
	                capability.maxDataQueueLength = ByteWriter.readUInt2(buffer, offset);
	                maxUploadChunkQueueLength = capability.maxDataQueueLength;
	                offset += 2;
	                capability.maxGenericBlockSize = ByteWriter.readUInt2(buffer, offset);
	                offset += 2;
	                capability.maxFileSize = Math.abs(ByteConverter.Byte4ToInt32AtOffset(buffer, offset));
	                offset += 4;
	                capability.maxFilesCount = ByteWriter.readUInt2(buffer, offset);
	                sendFileTransferConfigToUi(capability.maxFilesCount);
	                capabilities.push(capability);
	                break;
	            default:
	                break;
	        }
	        offset = capOffset + capabilitySize;
	        i++;
	    }
	    return capabilities;
	}

                    
	var createBindResponsePacket = function(clientCapabilities){
		var numCaps = clientCapabilities.length;
		
		var packetLen = 0;
		for(var i = 0; i < clientCapabilities.length; i++){
			packetLen += clientCapabilities[i].size;
                    }
		var totalLength = packetLen + BIND_RESPONSE_LENGTH ;
		var completePacketLength = totalLength + fileVCHeaderLength; // including header length
		var packet = new Uint8Array(completePacketLength);
		
		var offset = 0;
		
		// 2-byte total length of packet
		packet[offset++] = totalLength & 0xff;
		packet[offset++] = (totalLength >> 8) & 0xff;
		
		// 2-byte command
		packet[offset++] = ICAFT_BIND_RESPONSE;
		packet[offset++] = 0;
		
		//offset to the capability blocks.
		packet[offset++] = BIND_RESPONSE_LENGTH & 0xff;
		packet[offset++] = (BIND_RESPONSE_LENGTH >> 8) & 0xff;
		
		// number of returning capability blocks.
		packet[offset++] = numCaps;
		 //reserved byte
		packet[offset++] = 0;
		
		for (var i = 0; i < numCaps; i++) {
			var capability = clientCapabilities[i];	
			if(capability.id === ICAFT_CAPABILITY_FILE_CAPACITY){
				var capabilityPacket = new Uint8Array( [capability.id & 0xff,(capability.id >> 8) & 0xff,
				capability.size, 0,
				capability.maxDataQueueLength & 0xff, (capability.maxDataQueueLength >> 8) & 0xff, // 2-byte data queue length
				capability.maxGenericBlockSize & 0xff, (capability.maxGenericBlockSize >> 8) & 0xff, // 2-byte max block size
				capability.maxFileSize & 0xff, (capability.maxFileSize >> 8) & 0xff,(capability.maxFileSize >> 16) & 0xff,(capability.maxFileSize >> 24) & 0xff, // 4-bytes file max size
				capability.maxFilesCount & 0xff, (capability.maxFilesCount >> 8) & 0xff, // 2-byte max no of file allowed to transfer
				0,0 // reserved set to zero
				]);
				packet.set(capabilityPacket,offset);
            }
        }
		return packet;
        }
	
	var parseFileUploadResponse = function(buffer){
		var statusCode = ByteConverter.Byte4ToInt32AtOffset(buffer, 0);
		var fileContext = ByteWriter.readUInt2(buffer,4);
		return {"statusCode" : statusCode,"fileContext" : fileContext};
    };
	
	var handleFileUploadResponse = function(buffer)
	{
		sendUploadResponseNotificationToUi();
		var uploadResponse = parseFileUploadResponse(buffer);
		if(uploadResponse["statusCode"] == ICAFT_STATUS_SUCCESS)
		{
			sentFileSIze[uploadResponse["fileContext"]] = 0;
			uploadFileObjArray[uploadResponse["fileContext"]] = uploadFileObj;
			fileUploadStartRequest();
		}
		else
		{
			fns.resetUploadObjectQueue();
		}
	};

	var handleFileChunksUpload = function(uploadFileObj, chunkSize) 
	{
		var loadChunkFromFile = null;

		// after load to memory, send them to VDA by the size of request from VDA
		var loadChunkCallback = function(e) {
		    var fileDataUnit = new Uint8Array(e.target.result);
		    var buffer = null,
		        mpxId = null,
		        fileContext = null,
		        offset = 0,
		        length = null;
		    var fileData = null;

		    for (var i = 0; i < readRequestBuffer.length; i++) {
		        buffer = readRequestBuffer[i];
		        mpxId = ByteWriter.readUInt2(buffer, 0);
		        fileContext = ByteWriter.readUInt2(buffer, 2);
		        length = ByteWriter.readUInt2(buffer, 8);

		        fileData = fileDataUnit.subarray(offset, length + offset);
		        if (isFileTransferCanceled)
		            break;
		        sendFileData(fileData, mpxId, fileContext, ICAFT_STATUS_SUCCESS);

		        offset += length;
		    }

		    loadFileChunkSize = 0;
		    readRequestBuffer = [];
		};


		loadChunkFromFile = function (_offset, _length, _file, _fileContext)
		{
			var r = new FileReader();
			var blob = _file.slice(_offset, _length + _offset);
			r.onload = loadChunkCallback;
			r.onerror = function(e)
			{
				cancelFileTransfer(_fileContext);
			}
			try
			{
				r.readAsArrayBuffer(blob);
			}
			catch (e)
			{
				cancelFileTransfer(_fileContext);
			}
		};

		// load about 64 or the last part of chunk to memory to improve the performance first, then send them by 4K to VDA
		loadChunkFromFile(ByteConverter.Byte4ToInt32AtOffset(readRequestBuffer[0], 4), chunkSize, uploadFileObj, ByteWriter.readUInt2(readRequestBuffer[0], 2));
	};

	
	var sendUploadResponseNotificationToUi = function()
	{
		callBackWrapper.sendUploadResponseNotificationToUi();
	};
	var sendFileTransferConfigToUi = function(maxFileCount)
	{
		callBackWrapper.sendFileTransferConfigToUi(maxFileCount);
	};
	

    //Sends the bind response packet with all the capabilities the client could handle.
    var sendBindResponsePacket = function (numCaps, capsArray) {

        var packetLen = capsArray.length;
		var totalLength = packetLen + BIND_RESPONSE_LENGTH ;
		var completePacketLength = totalLength + fileVCHeaderLength; // including header length
		var packet = new Uint8Array(completePacketLength);
		
		var offset = 0;
		
		// 2-byte total length of packet
		packet[offset++] = totalLength & 0xff;
		packet[offset++] = (totalLength >> 8) & 0xff;
		
		// 2-byte command
		packet[offset++] = ICAFT_BIND_RESPONSE;
		packet[offset++] = 0;
		
		//offset to the capability blocks.
		packet[offset++] = BIND_RESPONSE_LENGTH & 0xff;
		packet[offset++] = (BIND_RESPONSE_LENGTH >> 8) & 0xff;
		
		// number of returning capability blocks.
		packet[offset++] = numCaps;
		 //reserved byte
		packet[offset++] = 0;
		
		packet.set(capsArray,offset);
        vStream.WriteByte(packet, 0, packet.length);
    };
    
   var handleFileWrite = function(buffer,packet_len)
   {
   		if(isFileTransferCanceled == true )
    		return;
	   	var mpxId = ByteWriter.readUInt2(buffer,0);
	   	var fileContext = ByteWriter.readUInt2(buffer,2);
		
		// send write response
		var statusCode = ICAFT_STATUS_SUCCESS;
		sendFileWriteResponse(fileContext,mpxId,statusCode);
		
	   	var fileWriteOffset = ByteConverter.Byte4ToInt32AtOffset(buffer, 4);
	   	var fileDataOffset = ByteWriter.readUInt2(buffer,8);
	   	var dataLength = ByteWriter.readUInt2(buffer,12);
	   	
	   	var tempArray = new Uint8Array(dataLength);
	
	    Utility.CopyArray(buffer, fileDataOffset, tempArray, 0, tempArray.length);
	   	
	   	if(receivedDataSize[fileContext] === 0 || currentDownloadOffset>=UINT8_ARRAY_LIMIT)   // write start
	   	{
			if(receivedDataSize[fileContext] === 0){
				fileDataArray[fileContext] = [];
			}else{
				fileDataArray[fileContext].push(arrayBuffer);
				currentDownloadOffset=0;
			}
			var remSize = downloadFileSize[fileContext]-receivedDataSize[fileContext];	
			if(remSize>=UINT8_ARRAY_LIMIT)
				arrayBuffer = new Uint8Array(UINT8_ARRAY_LIMIT);
			else
				arrayBuffer = new Uint8Array(remSize);
	   	}
	    arrayBuffer.set(tempArray, currentDownloadOffset); 
		receivedDataSize[fileContext] += dataLength;
		currentDownloadOffset+=dataLength;
		if(receivedDataSize[fileContext] >= downloadFileSize[fileContext] ){
			fileDataArray[fileContext].push(arrayBuffer);
			currentDownloadOffset=0;
			// whole file data has come, download the file
			ICAFtSendControlPacket(statusCode,fileContext);
			downloadFile(fileDataArray[fileContext],fileContext);
			receivedDataSize[fileContext] = 0;
			fileDataArray[fileContext] = [];
		}
   };

	var sendFileWriteResponse = function(fileContxt,mpxId,status)
	{
		var packet = new Uint8Array( [FILE_WRITE_RESPONSE_LENGTH & 0xff,(FILE_WRITE_RESPONSE_LENGTH >> 8) & 0xff,
			ICAFT_C2H_WRITE_RESPONSE, 0, // 2-byte command
			mpxId & 0xff, (mpxId >> 8) & 0xff, // 2-byte mpxId
			fileContxt & 0xff, (fileContxt >> 8) & 0xff, // 2-byte file context
			status & 0xff, (status >> 8) & 0xff,(status >> 16) & 0xff,(status >> 24) & 0xff // 4-bytes status code
		]);

		/* Write packet to the wire. */
		vStream.WriteByte(packet, 0, packet.length);
	};
	var DownloadAttributeSupport = 'download' in document.createElement('a');
    var downloadFile = function(tempFileArray,fileContext)
    {
		CEIP.add('fileTransfer:used',true);
		// Create blob from file data
		var blob = new Blob(tempFileArray);
		tempFileArray = [];
		// In IE use saveas directly
		if (navigator.msSaveBlob) {
			navigator.msSaveBlob(blob, downloadFileName[fileContext]);
		} else if (DownloadAttributeSupport == true) {
			// Create anchor with download option
			var a = document.getElementById('downloadButton');
			a.download = downloadFileName[fileContext];
			a.href = window.URL.createObjectURL(blob);
			var blobURL = a.href;
			a.style.display = "block";
			a.click();
			window.setTimeout((function(blobURL){
				URL.revokeObjectURL(blobURL);
			}).bind(null,blobURL),3000);
			//Deleting blob after 3 seconds
		}
    };
    
    var handleFileRead = function(buffer)
    {
    	if(isFileTransferCanceled == true )
    		return;
    	var mpxId = ByteWriter.readUInt2(buffer, 0); 
    	var fileContext = ByteWriter.readUInt2(buffer, 2); 
    	var readOffset =  ByteConverter.Byte4ToInt32AtOffset(buffer, 4);
    	var reqNoOfBytes = ByteWriter.readUInt2(buffer, 8); 

    	if(readOffset == 0)
    		sentFileSIze[fileContext] = 0;
    	sentFileSIze[fileContext] = readOffset + reqNoOfBytes ;
		// In case of chrome browser, during upload if we rename or delete that file,the we don't get any error but size of that file changed to 0,
		// so detecting it and showing  the error
		if(uploadFileObjArray[fileContext].size == 0 && reqNoOfBytes != 0)
		{
			cancelFileTransfer(fileContext);
			return;
		}

		// store read requests to array
		readRequestBuffer.push(buffer);
		loadFileChunkSize += reqNoOfBytes;
		if ((readOffset + reqNoOfBytes) >= uploadFileObjArray[fileContext].size || readRequestBuffer.length == maxUploadChunkQueueLength)
		{
			// begin file load one by one
			handleFileChunksUpload(uploadFileObjArray[fileContext], loadFileChunkSize);
		}
    };
    
    var handleFileControlRequest = function(buffer) {
        var statusCode = ByteConverter.Byte4ToInt32AtOffset(buffer, 0);
        var fileContext = ByteWriter.readUInt2(buffer, 4);
        if (statusCode == ICAFT_STATUS_USER_CANCELED || statusCode == ICAFT_STATUS_ABORT)
        {
        	isFileTransferCanceled = true;
        	loadFileChunkSize = 0;
        	readRequestBuffer = [];
        }
        isFileTransferPaused = (ICAFT_STATUS_PAUSE == statusCode) ? true : false;
        isDownloadResponseReceived = true;
    };

	var cancelFileTransfer = function(fileContext)
	{
		loadFileChunkSize = 0;
		readRequestBuffer = [];
		var status = ICAFT_STATUS_ABORT;
		ICAFtSendControlPacket(status, fileContext);
		callBackWrapper.showFileTransferError(FileTransferConstants.FILE_GENERIC_ERROR);
	};
	
	
	var handleFileDownloadRequest = function(buffer)
	{
		var statusCode;
		isFileTransferCanceled = false;
		isDownloadResponseReceived = true;
		//var downloadResponse = parseFileDownloadResponse(buffer);
		var fileContext = ByteWriter.readUInt2(buffer,0);
		var oFileName = ByteWriter.readUInt2(buffer, 2);
		downloadFileSize[fileContext] = ByteConverter.Byte4ToInt32AtOffset(buffer, 4);
		var index;
       	for (index = oFileName; index < buffer.length; index++) {
            var ch = buffer[index];
            if (ch == 0) //looking for the null termination at the end of the file name given by the server.
                break;
        }
       	var tempArray = new Uint8Array(index - oFileName);
        Utility.CopyArray(buffer, 12, tempArray, 0, tempArray.length);
        downloadFileName[fileContext] = "";
        // server send file name in UTF-8 format so converting it to byte
		downloadFileName[fileContext] = Convert.ToUTF8FromByteArray(tempArray,0,tempArray.length);
		receivedDataSize[fileContext] = 0;
		currentDownloadOffset = 0;
		if(!fileTransferConfig['allowFileDownload']){
			statusCode = ICAFT_STATUS_ABORT;
			callBackWrapper.showFileTransferError(FileTransferConstants.POLICY_ERROR);
		}
		else if(downloadFileSize[fileContext]>fileTransferConfig['fileTransferDownloadSizeLimit'])
		{
			statusCode = ICAFT_STATUS_ABORT;
			callBackWrapper.showFileTransferError(FileTransferConstants.SIZE_LIMIT_ERROR);
		}
		else
		{
		statusCode = ICAFT_STATUS_SUCCESS;
		}
		sendFileDownloadResponse(fileContext,statusCode);
	};
	var sendFileDownloadResponse = function(fileContext,status)
	{
		var packet = new Uint8Array( [FILE_DOWNLOAD_RESPONSE_LENGTH & 0xff,(FILE_DOWNLOAD_RESPONSE_LENGTH >> 8) & 0xff,
			ICAFT_C2H_DOWNLOAD_RESPONSE, 0, // 2-byte command
			status & 0xff, (status >> 8) & 0xff,(status >> 16) & 0xff,(status >> 24) & 0xff, // 4-bytes status code
			fileContext & 0xff, (fileContext >> 8) & 0xff, // 2-byte file context
			0,0 // Reserved; set to zero
		]);

		/* Write packet to the wire. */
		vStream.WriteByte(packet, 0, packet.length);
	};
	
	var parseFileDownloadResponse = function(buffer){
		var statusCode = ByteConverter.Byte4ToInt32AtOffset(buffer, 0);
		var fileContext = ByteWriter.readUInt2(buffer,4);
		var oFileName = 0;
		var fileSize = 0;
		var fileName = "";
		if (statusCode == ICAFT_STATUS_SUCCESS)
		{
			oFileName = ByteWriter.readUInt2(buffer, 6);
			fileSize = ByteConverter.Byte4ToInt32AtOffset(buffer, 8);
			var index;
       	 	for (index = oFileName; index < buffer.length; index++) {
            	var ch = buffer[index];
				
            	if (ch == 0) //looking for the null termination at the end of the file name given by the server.
                	break;
        	}
       	 	var tempArray = new Uint8Array(index - oFileName);
        	Utility.CopyArray(buffer, 16, tempArray, 0, tempArray.length);
			// server send file name in UTF-8 format so converting it to byte
			fileName = Convert.ToUTF8FromByteArray(tempArray,0,tempArray.length);
		}	
		return {"statusCode" : statusCode,"fileContext" : fileContext,"fileSize" : fileSize,"fileName" :fileName};
	}
	
	var handleFileDownload = function(buffer)
	{
		isFileTransferCanceled = false;
		isDownloadResponseReceived = true;
		var fileDownloadResponse = parseFileDownloadResponse(buffer);
		var fileContext = fileDownloadResponse["fileContext"];
		if(fileDownloadResponse["statusCode"] == ICAFT_STATUS_SUCCESS){
			downloadFileSize[fileContext] = fileDownloadResponse["fileSize"];
			//Compare current file size with config file and abort if greater
			if(downloadFileSize[fileContext]>fileTransferConfig['fileTransferDownloadSizeLimit']){
				var curStatus = ICAFT_STATUS_ABORT;
				isFileTransferCanceled = true;
				ICAFtSendControlPacket(curStatus,fileContext);
				callBackWrapper.showFileTransferError(FileTransferConstants.SIZE_LIMIT_ERROR);
				return;
			}
			downloadFileName[fileContext] = fileDownloadResponse["fileName"];
			receivedDataSize[fileContext] = 0;
			currentDownloadOffset = 0;
		}		
			
	};

	this.setFileUploadObject = function(file)
	{
		uplaodRequestQueue[endIndex++] = file;
	};
	var getUploadFileObject = function()
	{
		if(startIndex == endIndex)
		{
			startIndex = endIndex = 0;
			return -1;
		}
		else
		{
			return uplaodRequestQueue[startIndex++];
		}
	};
	var resetUploadObjectQueue = function()
	{
		startIndex = 0;
		endIndex = 0;
	};
	
	//Appending date and time string to file name
	var updateFileName = function(filename){
		var name = filename.split(".")[0];
		var ext = filename.split(".")[1];
		var date= new Date();
		var dateString = "(";
		dateString += (((parseInt(date.getMonth())+1)<10)?"0"+(parseInt(date.getMonth())+1):(parseInt(date.getMonth())+1)) +"-" ;
		dateString += ((date.getDate()<10)?"0"+date.getDate():date.getDate()) + "-" ;
		dateString += date.getFullYear() +"-" ;
		dateString += ((date.getHours()<10)?"0"+date.getHours():date.getHours()) + "-" ;
		dateString += ((date.getMinutes()<10)?"0"+date.getMinutes():date.getMinutes()) + "-" ;
		dateString += ((date.getSeconds()<10)?"0"+date.getSeconds():date.getSeconds()) + "-" ;
		dateString += ((date.getMilliseconds()<10)?"0"+date.getMilliseconds():date.getMilliseconds()) +")";
		name += dateString + "." + ext;
		return name;
	};
	
	this.sendFileUploadRequest = function()
	{
		isFileTransferCanceled = false;
		uploadFileObj = getUploadFileObject();
		if(uploadFileObj == -1)
			return;
		var packet = createFileUploadRequest(uploadFileObj);
		vStream.WriteByte(packet, 0, packet.length);
	};
	
	var createFileUploadRequest = function(uploadFileObj){
		if(!dependency.testEnv){
			CEIP.add('fileTransfer:used',true);
		}
		var fileName = uploadFileObj.name;
		// IOS safari always gives same file name for upload, e.g. "image.jpg" for image files.
		// So to make them unique adding date-time string to file name
		if(g.environment.os.isIOS){
			fileName = updateFileName(uploadFileObj.name);
		}
		fileName += "\0";
		var fileNameLength = Utility.getUnicodeStringSize(fileName, 0);
		var totalLength = fileNameLength + UPLOAD_REQUEST_LENGTH; // packet length excluding FileVc header
		var completePacketLength = totalLength + fileVCHeaderLength; // include header length
		var packet = new Uint8Array(completePacketLength);
		var offset = 0;
		
		// 2-byte total length of packet
		packet[offset++] = totalLength & 0xff;
		packet[offset++] = (totalLength >> 8) & 0xff;
		
		// 2-byte command
		packet[offset++] = ICAFT_C2H_UPLOAD_REQUEST;
		packet[offset++] = 0;
		
		// offset to null terminated file name
		packet[offset++] = UPLOAD_REQUEST_LENGTH & 0xff;
		packet[offset++] = (UPLOAD_REQUEST_LENGTH >> 8) & 0xff;
		
		// Reserved; set to zero
		packet[offset++] = 0;
		packet[offset++] = 0;
		
		// File size of the upload
		packet[offset++] = uploadFileObj.size & 0xff;
		packet[offset++] = (uploadFileObj.size >> 8) & 0xff;
		packet[offset++] = (uploadFileObj.size >> 16) & 0xff;
		packet[offset++] = (uploadFileObj.size >> 24) & 0xff;
		
		// Last modified time of file
		packet[offset++] = 0;
		packet[offset++] = 0;
		packet[offset++] = 0;
		packet[offset++] = 0;
		
		// file name
		Utility.writeUnicodeString(packet, offset, fileName, fileName.length);
		return packet;
	};
		
	this.sendFileDownloadRequest = function()
	{
		if(isDownloadResponseReceived == false)
			return;
		var packet = new Uint8Array( [DOWNLOAD_REQUEST_LENGTH & 0xff,(DOWNLOAD_REQUEST_LENGTH >> 8) & 0xff, // complete packet length
			ICAFT_C2H_DOWNLOAD_REQUEST, 0 // 2-byte command
		]);

		/* Write packet to the wire. */
		vStream.WriteByte(packet, 0, packet.length);
		isDownloadResponseReceived = false;
	};
	
	function ICAFtSendControlPacket(status,fileContext)
	{
		if(status == ICAFT_STATUS_ABORT)
		{
			isFileTransferCanceled = true;
		}
		var packet = new Uint8Array( [FILE_TRANSFER_CONTROL_REQUEST_LENGTH & 0xff,(FILE_TRANSFER_CONTROL_REQUEST_LENGTH >> 8) & 0xff,
			ICAFT_C2H_CONTROL_TRANSFER, 0, // 2-byte command
			status & 0xff, (status >> 8) & 0xff,(status >> 16) & 0xff,(status >> 24) & 0xff ,// 4-bytes status code
			fileContext & 0xff, (fileContext >> 8) & 0xff, // 2-byte file context
			0,0 // 2-bytes reserved
		]);

		/* Write packet to the wire. */
		vStream.WriteByte(packet, 0, packet.length);
	}
	
	function sendFileDataToHost(data, offset, length) {
		while (length > gFilePacketSize) {
			vStream.WriteByte(data, offset, gFilePacketSize);
			offset += gFilePacketSize;
			length -= gFilePacketSize;
		}
		vStream.WriteByte(data, offset, length);
	}
	
	function sendFileData(fileData, mpxId, fileContext, status)
	{
		var statusCode = status;
		var outputStream = new ByteArrayOutputStream();
		var fileDataLength = fileData.length;
		var totalLength = fileDataLength + FILE_READ_RESPONSE_LENGTH;
		var completePacketLength = totalLength + fileVCHeaderLength;
		var packet = new Uint8Array(completePacketLength);
		var offset = 0;
		
		// 2-byte total length of packet
		packet[offset++] = totalLength & 0xff;
		packet[offset++] = (totalLength >> 8) & 0xff;
		
		// 2-byte command
		packet[offset++] = ICAFT_C2H_READ_RESPONSE;
		packet[offset++] = 0;
		
		// 2-byte mpxId
		packet[offset++] = mpxId & 0xff;
		packet[offset++] = (mpxId >> 8) & 0xff;
		
		// 2-byte file context
		packet[offset++] = fileContext & 0xff;
		packet[offset++] = (fileContext >> 8) & 0xff;
		
		// 4-byte status of read request
		packet[offset++] = statusCode & 0xff;
		packet[offset++] = (statusCode >> 8) & 0xff;
		packet[offset++] = (statusCode >> 16) & 0xff;
		packet[offset++] = (statusCode >> 24) & 0xff;
		
		// 2-byte offset to file data
		packet[offset++] = FILE_READ_RESPONSE_LENGTH & 0xff;
		packet[offset++] = (FILE_READ_RESPONSE_LENGTH >> 8) & 0xff;
		
		// Reserved; set to zero
		packet[offset++] = 0;
		packet[offset++] = 0;
		
		// Length of data present at the end
		packet[offset++] = fileDataLength & 0xff;
		packet[offset++] = (fileDataLength >> 8) & 0xff;
		
		// actual file data
		packet.set(fileData,offset);
		sendFileDataToHost(packet, 0, packet.length);
	};
		
	var isFileTransferCanceled = false;
	
fileUploadStartRequest = this.sendFileUploadRequest;
fileReader.onload = this.sendFileData;

    /**************************************************************************
    *                                                                        *
    *  ICAModule Interface Implementation                                    *
    *                                                                        *
    **************************************************************************/


    /**
    * Initialize using any needed parameters in the profile, etc.
    */
    this.initialize = function (configObj) {
        // Read profile data for initial program launching.
        initialProgram = configObj.initialprogram;
        longCommandLine = configObj.cmdLine;
    };

    this.SetStack = function (virtualStreamSupplier) {
        vStream = createVirtualStream(streamName, streamSize);
        return vStream;
    };


    var prevReadIndex = 0;

    this.Run = function run() {
        prevReadIndex = 0;
        vStream.RegisterCallback(this._Run);
    };

    this._Run = function _run() {
        var errorHandle = function () {
            vStream.setReadIndex(prevReadIndex);
			vStream.compact();
        };

        try {
            while (vStream.Available( ) > 0) {
                /* Main processing */
                prevReadIndex = vStream.GetReadIndex();
                try {
                    processCommand(vStream);

                }
                catch (error) {
                    if (error == VirtualStreamError.NO_SPACE_ERROR) {
                        errorHandle();
                        return;
                    }
                    else {
                        throw error;
                    }
                }

                prevReadIndex = vStream.GetReadIndex();
            }
        }
        catch (error) {
            throw error;
        }
    };
	
	fns.processBindCommit = processBindCommit;
	fns.resetUploadObjectQueue = resetUploadObjectQueue;
	
	//Exposing the functions as public in case of UT
	if(dependency.testEnv === true) {
		var myself = this;	
		var arr = [processBindCommit,resetUploadObjectQueue];
		
		/*CreateWrapper function creates a wrapper around the private functions 
		  that need to be verified in UT scripts. 
		  The wrapper is created by routing the private function calls 
		  through exposed public functions so that UT framework detects the private function call references. */
		for(var i=0;i<arr.length;i++){			
			//To ensure UT runs successfully with correct function reference
			var wrapperObj = unitTestUtils.createWrapper(myself,arr[i]);
			this[arr[i].name] = wrapperObj.actualFn;
			fns[arr[i].name] = wrapperObj.wrapper;		
		}		
	
	this.createBindResponsePacket = createBindResponsePacket;
	this.createFileUploadRequest = createFileUploadRequest;
	this.parseFileUploadResponse = parseFileUploadResponse;
	this.parseBindRequest = parseBindRequest;
	this.parseFileDownloadResponse = parseFileDownloadResponse;
}

}
