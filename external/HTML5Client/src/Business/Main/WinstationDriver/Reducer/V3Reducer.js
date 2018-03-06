function V3Reducer()
{

    // Flags, masks and shifts.
    var COMPRESSED_FLAG               = 1;
    var COMPLETED_FLAG                = 2;
    var ENCODED_LENGTH_CONTINUES_FLAG = 0x80;
    var ENCODED_LENGTH_MASK           = 0x7f;
    var ENCODED_LENGTH_SHIFT          = 7;
    var CHANNEL_SHIFT                 = 2;

    // Channel numbers.
    /** Channel number: 'Null' channel - for escape/command sequences. */
    var NULL_CHANNEL                  = 0x3E;
    /** Channel number: 'Base' channel - for base ICA. */
    var BASE_CHANNEL                  = 0x3F;
    /** Channel number: Client drive mapping virtual channel. */
    var CDM_CHANNEL                   = 10;


    // Commands
    /** 'Escape' byte. */
    var ESCAPE                        = (NULL_CHANNEL << CHANNEL_SHIFT) & 0xff ;
    /** Command to define the number of coders. */
    var DEFINE_NUMBER_CODERS          = 0;
    /** Command to assign a coder to a channel. */
    var ASSIGN_CODER                  = 1;
    /** Minimum 'big block' length - large enough to get compressed. */
    var MIN_BIG_BLOCK_LENGTH          = 450;
    /** Maximum number of writes per network packet */
    var MAX_QUEUED_VIRTUAL_WRITES     = 50;

    /**
     * Initial length of temporary header array.  3 for reasonable length, plus 1 for
     * channel+flags.
     */
    var HEADER_LENGTH                 = 3+1;
     /**
       * Default number of client to server coders.  Currently 1 for CDM and 1 for
       * everything else, plus 2 spare.
       */
    var DEFAULT_CLT_TO_SVR_CODERS     = 4;
    var COMPRESSIBILITY_COUNTDOWN     = 6;

    // FIXME - MUST be kept in sync with WriteItem!
    var ACTION_CHECK = -1;
    var ACTION_COMPRESS = 0;
    var ACTION_COPY = 1;


	var bBandwidthThrottleCompression     = false ;
	var v3Coder                           = null;
	var bReductionEnabled                 = false;
	var intMaxRawDataPerOutputPacket      = 0;
	var arrCompressibilityTestCountdown   = null;
	var arrReducerMapChannelToEncoder     = null;

	this.init = function (intPow2, intMax)
	{
		// V3InitReducerExpander
		if (intPow2 > 0)
		{
			//type conversion to byte
			v3Coder                          = new V3Coder(intPow2, DEFAULT_CLT_TO_SVR_CODERS, true);
			arrCompressibilityTestCountdown  = new Int32Array(BASE_CHANNEL + 1);
			arrReducerMapChannelToEncoder    = new Int32Array(BASE_CHANNEL + 1);
			bReductionEnabled                = true;
		}
		else
		{
			bReductionEnabled                = false;
		}
		// The size of the history buffer sets an upper limit for the amount we can
		// compress per packet.
		intMaxRawDataPerOutputPacket       = 1 << intPow2;
	};

	this.reduce = function (arrBuffer, intOffset, intLength,queue, redExOutBuf, wdContext, htContext)
	{
			// Create an ICA write item, to be passed to the reducer itself.
			var writeItem = new ICAWriteItem(arrBuffer, intOffset, intLength);
			queue.addHighPriorityItem(writeItem);
			return this.reduce1(queue, redExOutBuf, wdContext, htContext);
	};


	this.reduce1 = function (queue, redExOutBuf, wdContext, htContext)
		{
			var bPartial = false;
			// Create a new header.
			var arrHeader = new Array(HEADER_LENGTH); //this is dynamically increasing array ,dont convert to typed array
			var intHeaderPos =  - 1;
			var headerStore = new V3HeaderStore(arrHeader, intHeaderPos);

			if (bReductionEnabled && !v3Coder.getFullyInitialized()) {
				headerStore.ensureSpace(4);
				arrHeader = headerStore.getHeader();
				intHeaderPos = headerStore.getHeaderPos();
				arrHeader[++intHeaderPos] = ESCAPE;
				arrHeader[++intHeaderPos] = 1; // number of parameter bytes after the command.
				arrHeader[++intHeaderPos] = DEFINE_NUMBER_CODERS;
				arrHeader[++intHeaderPos] = DEFAULT_CLT_TO_SVR_CODERS;
				headerStore.setHeaderPos(intHeaderPos);

				var intMaxVirtualWriteLength = wdContext.getMaxVirtualWriteLength();
				v3Coder.V3FinishInitialization(DEFAULT_CLT_TO_SVR_CODERS, intMaxVirtualWriteLength);
			}

			var intNumberWritesCompleted = 0;
			var intTotalBytesConsumed = 0;

			// Loop until we've written everything, or we've written as many virtual
			// writes as we're allowed to.
			while (!queue.isEmpty() && intNumberWritesCompleted < MAX_QUEUED_VIRTUAL_WRITES) {
				var queueItem = queue.getHeadItem();
				if (!(queueItem instanceof WriteItem)) {
					//VirtualWriteQueue cannot contain write items!
					throw V3ReducerError.VIRTUALWRITEQUEUE_CANT_WRITEITEMS;
				}
				var item = queueItem;
				if (bReductionEnabled) {
					// Check limit on amount of raw data per packet.
					if ((intTotalBytesConsumed + item.getLength()) >= intMaxRawDataPerOutputPacket) {
						// This virtual write would exceed the limit.
						break;
					}
				}
				arrHeader = headerStore.getHeader();
				intHeaderPos = headerStore.getHeaderPos();
				var intMaxBufferLength = redExOutBuf.getMaxLength();
				var intOutputLength = intMaxBufferLength - (intHeaderPos + 1);				
				var arrOutput = new Uint8Array(intOutputLength);
				var intOutputPos = 0;

				var reducedData = new V3ReducedData();
				// Actually compress the virtual write.
				var bCompleted = reduce2(item, headerStore, arrOutput, intOutputPos, intMaxBufferLength, reducedData, htContext);
				if (reducedData.nrOfBytesConsumed === 0) {
					// Could not generate anything in the available space.

					// Exit from the loop - no point copying any data or attempting to
					// update any structures, since no bytes were "used up".
					break;
				}
				intTotalBytesConsumed += reducedData.nrOfBytesConsumed;
				// Copy the compressed output into the outbuf.
				redExOutBuf.copyFromArray(arrOutput, intOutputPos, reducedData.nrOfBytesGenerated);

				if (bCompleted) {
					// We've taken all of this write.
					queue.incrementPosition();
					intNumberWritesCompleted++;
				}
				else {
					// Decrement the virtual write.
					item.decrementLength(reducedData.nrOfBytesConsumed);
					bPartial = true;
				// Now keep looping - in case of history buffer wrap around, reducer
				// will exit early (makes tests much easier).  Just keep going, and
				// remaining data will be stored at the start of the history buffer.
				}
			}

			arrHeader = headerStore.getHeader();
			intHeaderPos = headerStore.getHeaderPos();
			redExOutBuf.reverseCopyFromArray(arrHeader, intHeaderPos , intHeaderPos + 1 );
			return bPartial;
		};




	/**
	* Reduces a WriteItem into an output byte array.
	* @param item WriteItem to reduce.
	* @param headerStore V3HeaderStore the growable header store.
	* @param output output buffer.
	* @param outputPos output buffer write position.
	* @param maximumLength maximum length of output (output data length + header length).
	* @param reducedData the length of data written, and size of reduced version.
	*/

	var reduce2 = function (item, headerStore, arrOutput, intOutputPos, intMaximumLength, reducedData, htContext)
	{
		var arrHeader;
		var intHeaderPos    = headerStore.getHeaderPos();
		// Length of data already in header.
		var intHeaderLength =  intHeaderPos + 1;
		// Leave four bytes for maximum sized "length-encoding" header.
		var intSpaceAvailable  = intMaximumLength - intHeaderLength - 4;
		if (intSpaceAvailable < 12)
		{
			/* too little useful space left */
			return false;
		}

		// Obtain information about this write.
		var arrInBuff     = item.getBuffer();
		var intOff        = item.getOffset();
		var intLen        = item.getLength();
		var bPartialWrite = item.getPartial();

		var intChannel;
		if (item instanceof VirtualWriteItem)
		{
			intChannel      = item.getChannel();
		}
		else
		{
			intChannel      = BASE_CHANNEL;
		}
		var intLengthToEncode = 0;

		// FIXME ensure (somehow) that ACTION_{CHECK,COMPRESS,COPY} in here and
		// in VirtualWriteItem are kept in sync.
		if (item.getV3Action() == ACTION_CHECK)
		{
			if (bReductionEnabled)
			{
				item.setV3Action(ACTION_COMPRESS);
			}
			else
			{
				item.setV3Action(ACTION_COPY);
			}
		}

		if (item.getV3Action() == ACTION_COMPRESS && bBandwidthThrottleCompression)
		{
			// Try to save CPU by avoiding pointless compression of large blocks
			// of incompressible data.
			var intLengthToTest   = intLen;
			var intUntestedLength = 0;

			if (intLengthToTest > intSpaceAvailable)
			{
				intLengthToTest     = intSpaceAvailable;
				intUntestedLength   = intLen - intSpaceAvailable;
			}

			if (htContext.outputSpeedInBytesPerSec >= 100000 && arrCompressibilityTestCountdown[intChannel] > 0)
			{
			if (intLengthToTest < MIN_BIG_BLOCK_LENGTH)
			{
			if (arrCompressibilityTestCountdown[intChannel] == COMPRESSIBILITY_COUNTDOWN )
			{
				// Too small to test, but last one didn't compress so
				// assume this won't either.
				item.setV3Action(ACTION_COPY);
				arrCompressibilityTestCountdown[intChannel]--;
			}
			}
			else if (intUntestedLength < MIN_BIG_BLOCK_LENGTH)
			{
				// Test whole of remaining data.
				if (!v3Coder.DataLooksCompressible(arrInBuff, intOff, intLengthToTest+intUntestedLength))
				{
					item.setV3Action(ACTION_COPY);
					arrCompressibilityTestCountdown[intChannel] = COMPRESSIBILITY_COUNTDOWN;
				}
				else
				{
					arrCompressibilityTestCountdown[intChannel]--;
				}
			}
			else
			{
				// Test just this packet's worth.
				if (!v3Coder.DataLooksCompressible(arrInBuff, intOff, intLengthToTest))
				{
					item.setV3Action(ACTION_COPY);
					arrCompressibilityTestCountdown[intChannel] = COMPRESSIBILITY_COUNTDOWN;
				}
				else
				{
					arrCompressibilityTestCountdown[intChannel]--;
				}
			}
			}
		}

		if (bReductionEnabled && arrReducerMapChannelToEncoder[intChannel] === 0)
		{
			var intEncoderNumber;
			// Unassigned
			if (intChannel == CDM_CHANNEL)
			{
				intEncoderNumber = 0;
			}
			else
			{
				intEncoderNumber = 1;
			}

			headerStore.ensureSpace(5);
			arrHeader                 = headerStore.getHeader();
			intHeaderPos              = headerStore.getHeaderPos();
			arrHeader[++intHeaderPos] = ESCAPE;
			arrHeader[++intHeaderPos] = 2; // number of parameter bytes after the command
			arrHeader[++intHeaderPos] = ASSIGN_CODER;
			arrHeader[++intHeaderPos] = intChannel & 0xff;
			arrHeader[++intHeaderPos] = intEncoderNumber & 0xff;
			headerStore.setHeaderPos(intHeaderPos);
			intSpaceAvailable        -= 5;

			// Add one to encoder number, so that 0 means undefined.
			arrReducerMapChannelToEncoder[intChannel] = intEncoderNumber + 1;
		}

		var bCompleted  = false;
		var bCompress   = false;
		var bCopied     = true;

		var intLengthOfData;

		if (item.getV3Action() == ACTION_COMPRESS)
		{
			bCopied   = false;
			bCompress = true;

			intEncoderNumber = arrReducerMapChannelToEncoder[intChannel] - 1;

			v3Coder.ReducerV3(intChannel,         // channel
			intEncoderNumber,   // encoder nr
			arrInBuff,          // input to compress
			intOff,
			intLen,
			arrOutput,          // where to compress the data to
			intOutputPos,
			intSpaceAvailable,  // max output length
			reducedData);    // returns (nr of bytes consumed/generated)
			if (reducedData.nrOfBytesConsumed === 0)
			{
				// Could not generate anything in the available space.
				return false;
			}

			intLengthOfData = reducedData.nrOfBytesGenerated;

			if (intLengthOfData >= (MIN_BIG_BLOCK_LENGTH*3)/4)
			{
				if (intLengthOfData > (reducedData.nrOfBytesConsumed*3)/4)
				{
					//did not compress very well - check next n blocks
					arrCompressibilityTestCountdown[intChannel] = COMPRESSIBILITY_COUNTDOWN;
				}
			}

			if (intLengthOfData > reducedData.nrOfBytesConsumed)
			{
				//reducing made it bigger! revert to a copy
				bCopied = true;
				// Set the space available to be the number of bytes actually
				// consumed, so that the recipient will process the same amount
				// as we did
				intSpaceAvailable = reducedData.nrOfBytesConsumed;
			}
			else
			{
				// add compressed output
				intLengthToEncode = reducedData.nrOfBytesConsumed;
				//outbuf.copyfromarray(output, outputPos, lengthofdata);
			}

		}

		if (bCopied)
		{
			intLengthOfData = intLen;
			if (intLengthOfData > intSpaceAvailable)
			{
				//can't copy it all
				intLengthOfData = intSpaceAvailable;
			}

			//copy uncompressed data into output buffer
			//outbuff.copyfromarray()
			Utility.CopyArray(arrInBuff, intOff, arrOutput, intOutputPos, intLengthOfData);

			//leave space for compressed bit
			intLengthToEncode = intLengthOfData << 1;

			if (bCompress) {
				//was compressed as well - receiver will need to do dummy compression
				intLengthToEncode |= 1;
			}

			reducedData.nrOfBytesConsumed = intLengthOfData;
			reducedData.nrOfBytesGenerated = intLengthOfData;
		}

		if (reducedData.nrOfBytesConsumed >= intLen)
		{
			// we now point past the end of data - this virtual write is finished
			bCompleted = true;
		}

		var headerByte = (intChannel << CHANNEL_SHIFT) & 0xff;

		if (!bCopied)
		{
			//add compressed flag
			headerByte |= COMPRESSED_FLAG;
		}

		if (bCompleted)
		{
			headerByte |= COMPLETED_FLAG;
		}

		headerStore.ensureSpace(1);
		arrHeader = headerStore.getHeader();
		intHeaderPos = headerStore.getHeaderPos();
		arrHeader[++intHeaderPos] = headerByte;
		headerStore.setHeaderPos(intHeaderPos);

		while (intLengthToEncode > ENCODED_LENGTH_MASK)
		{
			headerStore.ensureSpace(1);
			arrHeader = headerStore.getHeader();
			intHeaderPos = headerStore.getHeaderPos();
			//TODO byte typecast conversion
			arrHeader[++intHeaderPos] = 0xff & (ENCODED_LENGTH_CONTINUES_FLAG | (intLengthToEncode & ENCODED_LENGTH_MASK));
			headerStore.setHeaderPos(intHeaderPos);
			intLengthToEncode >>>= ENCODED_LENGTH_SHIFT;
		}

		headerStore.ensureSpace(1);
		arrHeader = headerStore.getHeader();
		intHeaderPos = headerStore.getHeaderPos();
		//TODO byte typecast conversion
		arrHeader[++intHeaderPos] = (intLengthToEncode & ENCODED_LENGTH_MASK) & 0xff;
		headerStore.setHeaderPos(intHeaderPos);

		return bCompleted;
	}; //close reduce2

} //close V3Reducer




