

/**
 * Expander for uncompressing server->client data, using the V3 protocol and algorithm.
 */
 
function V3Expander()
{

	// Masks and shifts
	var COMPRESSION_MASK = 0x01;
    var COMPLETION_MASK  = 0x02;
    var CHANNEL_MASK     = 0xFC;
    var MORE_LENGTH_MASK = 0x80;

    var CHANNEL_SHIFT = 2;

    // Channel numbers
    var SPECIAL_THINWIRE_CHANNEL = 0x3D;
    var NULL_CHANNEL             = 0x3E;
    var BASE_CHANNEL             = 0x3F;

    // Compression formats
    var UNCOMPRESSED            = 0;
    var COMPRESSED              = 1;

    // Commands
    var V3_DEFINE_NR_OF_CODERS            = 0;
    var V3_ASSIGN_CODER_TO_CHANNEL        = 1;
    var V3_INIT_SPECIAL_THINWIRE_CHANNEL  = 2;
    var V3_LIGHTWEIGHT_OBJECT_COMPRESSION = 3;
    var V3_HEAVYWEIGHT_OBJECT_COMPRESSION = 4;

    // PACKET_VIRTUAL_WRITE command bytes
    var WRITE0 = 0x2F;
    var WRITE1 = 0x30;
    var WRITE2 = 0x31;


    /** Default number of coders used by thinwire. */
    var DEFAULT_THINWIRE_CODERS = 20;
    /** Default number of coders for other (non-thinwire) channels. */
    var DEFAULT_OTHER_CODERS = 12;
    var DEFAULT_SVR_TO_CLT_CODERS =
        (DEFAULT_THINWIRE_CODERS + DEFAULT_OTHER_CODERS);

    /** Escape sequence */
    var ESCAPE = ((NULL_CHANNEL << 2) | UNCOMPRESSED);


    var PACKET_VIRTUAL_WRITE0 = [
        WRITE0,
        0                      // channel
    ];

    var PACKET_VIRTUAL_WRITE1 = [

        WRITE1,
        0,                      // byte count
        0                      // channel
    ];

    var PACKET_VIRTUAL_WRITE2 = [

        WRITE2,
        0,                      // byte count LSB
        0,                      // byte count MSB
        0                      // channel
    ];

    var v3Coder = null;
    var bExpansionEnabled = false;

    var expandedData = new V3ExpandedData();
    var reducedData  = new V3ReducedData();

    var intNumberOfCoders = 0;
    var hashTChannelMap = new IntHashtable();
	
	var AVERAGE_EXPANDED_DATA_SIZE = 5000; 
	var STEP_SIZE = 3000; 
    var arrOutput = new Uint8Array(AVERAGE_EXPANDED_DATA_SIZE) ; 
	// var arrOutput =[];
	var outputOffset = 0;
	var outputLength = 0;

    /**
     * Expand an input packet, returning the number of buffers used
     * (for wrap-around cases).
     * @param inBuff the input packet
     * @param off the offset into the packet at which to start
     * @param len the number of input bytes to use
     * @return the number of wrap-around buffers used
     */
    this.expand = function(inBuff, off, len)
    {
        // This is where the work is done.
        // The inBuff will be a complete V3 packet.
        
        //remove all elements
        //arrOutput = []; //Save garbage collector time
		outputOffset = 0;
		outputLength = 0;

        var intStartOfDataChunk = off;
        var intEndOfHeaderChunk = off + len - 1;
        // Headers are read from the end of the packet backwards.
        var intHeaderOffset = intEndOfHeaderChunk;

        while (intHeaderOffset - intStartOfDataChunk >= 2) {
            // We have more header chunks

            var intFirstByte = inBuff[intHeaderOffset--] & 0xff;
            var bCompressed = (intFirstByte & COMPRESSION_MASK) !== 0;
            var bCompleted  = (intFirstByte & COMPLETION_MASK) !== 0;
            var intChannelNum = (intFirstByte & CHANNEL_MASK) >>> CHANNEL_SHIFT;

            var intDataLength = 0;
            var intDataLengthShift = 7;

            if (intFirstByte === ESCAPE) {
                // Escape sequence - process command.
                var intNrOfParameterBytes = inBuff[intHeaderOffset--] & 0xff;
                var intCommand = inBuff[intHeaderOffset]; // DO NOT decrement headerOffset here!!!!!!!
                switch (intCommand) {
                case V3_DEFINE_NR_OF_CODERS:
                    if ((intNrOfParameterBytes < 1)  ||  !bExpansionEnabled  ||
                        v3Coder.getFullyInitialized())
                    {
						throw V3ExpanderError.ILLEGAL_USAGE_DEFINE_NR_OF_CODERS;
                    }

                    var intNumberOfCoders = inBuff[intHeaderOffset-1] & 0xff;

                    intNumberOfCoders = intNumberOfCoders;

                    // FIXME get the correct value from the WinstationDriver, when it has one.
                    //int maxVirtualWriteLength = 5000;
                    var  intMaxVirtualWriteLength = 65536;

                    if (!v3Coder.V3FinishInitialization(intNumberOfCoders, intMaxVirtualWriteLength)) {
                        /*if (Debug.trace)
                            Debug.trace(this, "ExpandPacket: Finish initialization failure, "
                                        +"nr of decoders = "+numberOfCoders+"\n");*/
                    }
                    break;
                case V3_ASSIGN_CODER_TO_CHANNEL:
                    if ((intNrOfParameterBytes < 2)  ||  !bExpansionEnabled) {
                        

                        throw V3ExpanderError.ILLEGAL_USAGE_V3_ASSIGN_CODER_TO_CHANNEL;
                    }

                    var intChannel = inBuff[intHeaderOffset-1] & 0xff;
                    var intCoder   = inBuff[intHeaderOffset-2] & 0xff;

                    hashTChannelMap.put(intChannel, intCoder);


                    if (intCoder >= intNumberOfCoders)
                        throw V3ExpanderError.CODER_NUMBER_TOO_GREAT;
                    break;
                case V3_INIT_SPECIAL_THINWIRE_CHANNEL:
                    if ((intNrOfParameterBytes < 3)  &&  !bExpansionEnabled) {
                        

                        throw V3ExpanderError.ILLEGAL_USAGE_V3_INIT_SPECIAL_THINWIRE_CHANNEL;
                    }

                    var intBaseCoder     = inBuff[intHeaderOffset-1];
                    var intNumCoders     = inBuff[intHeaderOffset-2];
                    var intProtocolLevel = inBuff[intHeaderOffset-3];

                    // baseCoder + 1, so zero means undefined.
                    hashTChannelMap.put(SPECIAL_THINWIRE_CHANNEL, (intBaseCoder+1));

                    if (intBaseCoder + intNumCoders  >  intNumberOfCoders) {
                        throw V3ExpanderError.TOO_MANY_CODERS;
                    }
                    break;
                case V3_LIGHTWEIGHT_OBJECT_COMPRESSION:
                    if ((intNrOfParameterBytes < 0)  ||  !bExpansionEnabled) {
                        

                        throw V3ExpanderError.ILLEGAL_USAGE_V3_LIGHTWEIGHT_OBJECT_COMPRESSION;
                    }
                    v3Coder.setUseLightweightObjectParsing(true);
                    break;
                case V3_HEAVYWEIGHT_OBJECT_COMPRESSION:
                    if ((intNrOfParameterBytes < 0)  ||  !bExpansionEnabled) {
                        

                        throw V3ExpanderError.ILLEGAL_USAGE_V3_HEAVYWEIGHT_OBJECT_COMPRESSION;
                    }
                    v3Coder.setUseLightweightObjectParsing(false);
                    break;
                default:
                    /*if (Debug.trace)
                        Debug.trace(this, "ExpandPacket: Unrecognised special intCommand "
                                    +intCommand+"\n");*/
                }
                intHeaderOffset--; // For intCommand byte, since we use post-decrementing above not pre-decrementing.
                intHeaderOffset -= intNrOfParameterBytes;
                continue;
            }

            // Read the length of the data
            var intLengthByte;

            intLengthByte = inBuff[intHeaderOffset--] & 0xff;
            intDataLength = intLengthByte & 0x7f;
            while ((intLengthByte & 0x80) !== 0) {
                if (intDataLengthShift >= 21) {
                    /* this data is definitely corrupt */
                    /*if (Debug.trace)
                        Debug.trace(this, "ExpandPacket: Corrupt data length "+intLengthByte+"\n");*/
                    throw V3ExpanderError.CORRUPT_DATA_LENGTH;
                }
                intLengthByte = inBuff[intHeaderOffset--] & 0xff;
                intDataLength |= intLengthByte << intDataLengthShift;
                intDataLengthShift += 7;
            }

            if (bCompressed) {
                if (!bExpansionEnabled) {
                    /*if (Debug.trace) {
                        Debug.trace(this, "ExpandPacket: EXPANSION NOT ENABLED (1) - FATAL ERROR");
                    }*/
                    throw V3ExpanderError.EXPANSION_NOT_ENABLED;
                }
                var intDecoderNr = hashTChannelMap.get(intChannelNum);
                if (intDecoderNr === 0) {
                    /*if (Debug.trace)
                        Debug.trace(this, "ExpandPacket: UNDEFINED DECODER\n");*/

                    throw V3ExpanderError.UNDEFINED_DECODER;
                }

                

                var inthighestIndex = intEndOfHeaderChunk - 2;
                //if (!v3Coder.V3Expander(intChannelNum,       // channel
                try {
                    v3Coder.V3Expander(intChannelNum,       // channel
                                       intDecoderNr & 0xff,  // decoderNr
                                       inBuff,           // compressed data
                                       intStartOfDataChunk, // compressed data offset
                                       inthighestIndex,     // highest sensible index
                                       intDataLength,       // nr of bytes to make
                                       expandedData);    // outputs
                } catch (e) {
                    /*if (Debug.trace) {
                        Debug.trace(this, "ExpandPacket: EXPANDER DATA ERROR");

                        Debug.trace(this, "generated bytes:");
                        Debug.traceBuf(this,
                                       expandedData.data, expandedData.start, expandedData.exDataLength);
                    }*/

                    throw e;
                }

                if (intStartOfDataChunk + expandedData.nrOfBytesConsumed  >  intHeaderOffset + 1) {
                    /*if (Debug.trace)
                        Debug.trace(this, "ExpandPacket: CONSUMED LENGTH "
                                    +expandedData.nrOfBytesConsumed+" TOO LONG\n");

                    if (Debug.verbose) {
                        Debug.verbose(this, "intStartOfDataChunk="+intStartOfDataChunk);
                        Debug.verbose(this, "intHeaderOffset="+intHeaderOffset);
                        Debug.traceBuf(this, inBuff, off, len);
                        Debug.verbose(this, "channel="+intChannelNum);
                        Debug.verbose(this, "intDataLength requested="+intDataLength);
                        Debug.verbose(this, "bytes generated="+expandedData.length);
                        Debug.verbose(this, "generated bytes:");
                        Debug.traceBuf(this, expandedData.data, expandedData.start,
                                       expandedData.length);
                    }*/

                    throw V3ExpanderError.CONSUMED_LENGTH_TOO_LONG;
                }

                if (expandedData.length  !==  intDataLength) {
                    /*if (Debug.trace) {
                        Debug.trace(this, "Expanded data length: "+expandedData.length);
                        Debug.trace(this, "Requested data length: "+intDataLength);
                    }*/
                }

                /*if (Debug.verbose) {
                    Debug.verbose(this, "Number of bytes not made: "+
                                  (intDataLength - expandedData.length));
                }*/

                intStartOfDataChunk += expandedData.nrOfBytesConsumed;

                if (intChannelNum === SPECIAL_THINWIRE_CHANNEL)
                    intChannelNum = 9; // FIXME use proper constant

                if (intChannelNum !== BASE_CHANNEL) {
                    addChannelHeaderSlab(intChannelNum, expandedData.exDataLength);
                }

                addDataSlab(expandedData.data, expandedData.start, expandedData.exDataLength);
            } else {
                // Copy.  Bottom bit of length indicates if recompression is needed.
                // Length does not incoporate this bit; proper length is in bytes.
                bCompressed = (intDataLength & 0x01) !== 0;
                intDataLength >>>= 1;

                if (intChannelNum !== BASE_CHANNEL) {
                    addChannelHeaderSlab(intChannelNum, intDataLength);
                }

                // Just copy this up the stack.
                addDataSlab(inBuff, intStartOfDataChunk, intDataLength);

                // Now cope with recompressing.
                if (bCompressed) {
                    if (!bExpansionEnabled) {
                        /*if (Debug.trace) {
                            Debug.trace(this,
                                        "ExpandPacket: EXPANSION NOT ENABLED (2) - FATAL ERROR");
                        }*/

                        throw V3ExpanderError.EXPANSION_NOT_ENABLED;
                    }
                    /*if (Debug.trace) {
                        Debug.trace(this, "Recompressing");
                    }*/
                    var intEncoderNr = hashTChannelMap.get(intChannelNum);
                    v3Coder.ReducerV3(intChannelNum,       // channel
                                      intEncoderNr,        // decoder
                                      inBuff,           // data
                                      intStartOfDataChunk, // index of data
                                      intDataLength,       // input length
                                      null,             // don't want compressed data
                                      0,                // output pos
                                      0,                // output length
                                      reducedData);     // results (ignored)
                }

                intStartOfDataChunk += intDataLength;
            }
        }

        

        return arrOutput.length;
    };
    var addChannelHeaderSlab = function (intChannelNum, intDataLength)
    {
        // Increment to take account of channel number byte.
        intDataLength++;
		
		if(arrOutput.length < (outputOffset +4))
		{
			var buff = arrOutput.buffer;
			var temp = new Uint8Array(arrOutput.length +STEP_SIZE);
			for(var i =0 ;i < outputOffset ;++i )
			{
				temp[i] = arrOutput[i];
			}
			arrOutput = temp;
			
		}

        if (intDataLength === 0) {
            // Do nothing - this shouldn't happen.
        } else if (intDataLength === 1) {
			
             arrOutput[outputOffset++] = WRITE0;
		     arrOutput[outputOffset++] = intChannelNum & 0xff;
		     outputLength+=2;
        } else if (intDataLength < 0x100) {
            
            arrOutput[outputOffset++] = WRITE1;
		    arrOutput[outputOffset++] = intDataLength & 0xff;
		    arrOutput[outputOffset++] = intChannelNum & 0xff;
		    outputLength+=3;
		  
        } else if (intDataLength < 0x10000) {
          
		    arrOutput[outputOffset++] = WRITE2;
		    arrOutput[outputOffset++] =  intDataLength & 0xff;
		    arrOutput[outputOffset++] = ((intDataLength >>> 8) & 0xff);
		    arrOutput[outputOffset++] = intChannelNum & 0xff;
		    outputLength+=4;
        } else {
            throw V3ExpanderError.TOO_MUCH_VIRTUAL_DATA;
        }
    };

    var addDataSlab = function(data, offset, length)
    {
		if (arrOutput.length < (outputOffset + length)) {
			var buff = arrOutput.buffer;
			var size = STEP_SIZE >= length ?STEP_SIZE:length;
			var temp = new Uint8Array(arrOutput.length + size);
			for (var i = 0; i < outputOffset; ++i) {
				temp[i] = arrOutput[i];
			}
			arrOutput = temp;
		}

		for(var i =0 ; i<length;++i)
		{
			arrOutput[i+outputOffset] = data[i+offset];
		}
		outputOffset+=length;
		outputLength+=length;
    };

    /**
     * Gets the wrap-around buffers into which expand() has expanded its
     * data.
     * @return an array of buffers
     */
    this.outputBuffer = function()
    {
	   return arrOutput;
    };

    /**
     * Gets the starting offsets into the wrap-around buffers.
     * @return an array of offsets into the wrap-around buffers
     */
    this.outputOffset = function()
    {
        return 0 ;
    };

    /**
     * Gets the length of the new segment within each wrap-around buffer.
     * @return an array of lengths of new segments
     */
    this.outputLength = function()
    {
        return  outputLength;
    };

    /**
     * Initializes the expander.  Allocates memory and sets up data
     * structures, as necessary.
     * @param pow2 the power of 2 size of the in-memory buffer
     * @param max the maximum size of expanded data
     */
    this.init = function(pow2, max)
    {
        // V3InitReducerExpander
        if ((pow2 & 0x100) !== 0)
            throw V3ExpanderError.ILLEGAL_EXPANDER_POWER;

        if (pow2 > 0) {
            bExpansionEnabled = true;
            v3Coder = new V3Coder(pow2 & 0xff, DEFAULT_SVR_TO_CLT_CODERS, false);
        } else {
            bExpansionEnabled = false;
        }

        hashTChannelMap.clear();
    };
}










