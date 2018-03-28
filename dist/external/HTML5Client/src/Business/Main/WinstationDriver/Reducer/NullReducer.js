function NullReducer()
{

}//close NullReducer

/**
 * Reduce an input packet into an output buffer, also taking as many queued
 * virtual writes as it can.  Returns whether or not the last packet/virtual
 * write was completely used up.
 * @param arrBuffer the packet to compress
 * @param intOffset the offset into the packet at which to start
 * @param intLength the number of input bytes to use
 * @param queue the VirtualWriteQueue of queued virtual writes/virtual acks.
 * @param redExOutbuf the RedExOutputBuffer representing the output buffer.
 * @param wdContext the WDContext containing output control parameters.
 * @param htContext the HighThroughputContext containing specific control
 * parameters for High Throughput mode.
 * @return a boolean indicating whether the last write was completely written or not.
 */

NullReducer.prototype.reduce = function (arrBuffer, intOffset, intLength ,virtualWrites, redExOutbuf, wdContext, htContext)
{
    var intMaxBufferLength = redExOutbuf.getMaxLength();
    if (!wdContext.highThroughputSupported)
    {
        // If we cannot support High Throughput, *and* the previous virtual
        // write was partial, then we *must* complete the previous virtual
        // write before sending the ICA packet.
        if (wdContext.lastVirtualWriteWasPartial)
        {
            var queueItem = virtualWrites.getHeadItem();
            if (queueItem instanceof VirtualWriteItem)
            {
                var item             = queueItem;
                var arrVirtualBuffer = item.getBuffer();
                var intChannel       = item.getChannel();
                var intOff           = item.getOffset();
                var intLen           = item.getLength();
                var bPartialWrite    = item.getPartial();

                if (!bPartialWrite) {
                    // Error! We cannot complete a partial write if we don't have one!
                    throw ReducerError.PARTIALWRITE_ERROR;
                }

                if (intLen > intMaxBufferLength) {
                    // Error! We cannot complete this write in this output buffer!
                    //virtual write too geat for non-High Throughput server!
                    throw ReducerError.CANT_COMPLETE_WRITE;
                }

                redexOutbuf.copyFromArray(arrVirtualBuffer, intOff, intLength);
                virtualWrites.incrementPosition();

                //TODO
                //WinstationDriver.vdCounts[channel]--;
                // The last write is no longer partial.
                wdContext.lastVirtualWriteWasPartial = false;
            }
            else
            {
                // Error!Partial write of a non-virtual write
                throw ReducerError.PARTIAL_WRITE_OF_NONVIRT_WRITE;
            }
        }
    }

    intMaxBufferLength = redExOutbuf.getMaxLength();
    if (intLength > intMaxBufferLength) {
        //Too large an ICA packet for outbuf!
        throw ReducerError.TOO_LARGE_ICA_PACKET;
    }

    redExOutbuf.copyFromArray(arrBuffer, intOffset, intLength);
    return this.reduce1(virtualWrites, redExOutbuf, wdContext, htContext);
}; //close NullReducer::Reduce

NullReducer.prototype.reduce1 = function (virtualWrites, redExOutbuf, wdContext, htContext)
{
    var bPartial = false;
    while (!virtualWrites.isEmpty())
    {
        var intMaxBufferLength = redExOutbuf.getMaxLength();
        var queueItem = virtualWrites.getHeadItem();
        //check for virtual ACK first
        if (queueItem instanceof VirtualAckItem) {
            //enough space to add virtual ACK
            var item = queueItem;
            var arrBuffer = item.getBuffer();
            var intOffset    = item.getOffset();
            var intLength    = item.getLength();
            var intMaxLengthOfData  =   (intLength < intMaxBufferLength)?intLength:intMaxBufferLength;
            redExOutbuf.copyFromArray(arrBuffer, intOffset, intMaxLengthOfData);
            if (intMaxLengthOfData === intLength) {
                //we've taken all of this write
                virtualWrites.incrementPosition();
            } else {
                // maxLengthOfData must be less than length, due to minimum  of len and maxbufferlen above.
                item.decrementLength(intMaxLengthOfData);
                bPartial = true;
            }
            if (intMaxBufferLength <= intMaxLengthOfData) {
                // Shouldn't be less than, but...
                // We've filled the buffer
                break;
            }
            // Keep processing more queued items.
            continue;
        }
        var item              = queueItem;
        var arrVirtualBuffer  = item.getBuffer();
        var intChannel        = item.getChannel();
        var intOffset         = item.getOffset();
        var intLength         = item.getLength();
        var bPartialWrite     = item.getPartial();

        // Length of of the virtual write - includes channel byte.
        var intDataLen = intLength + 1;

        if (!bPartialWrite)
        {
            // Initial write - add VIRTUAL_WRITE{0|1|2} header.
            // Ignore resume flag - we don't actually have a partial write to resume.
            // Zero-length virtual write is meaningless.
            if (intLength === 0) {
                throw ReducerError.NULL_VIRTUAL_WRITE_REQUEST;
            }

            var intHeaderLength;

            if (intLength === 1) {
                intHeaderLength = Reducer.WRITE0_HEADER_LENGTH;
            } else if (intDataLen  <= Reducer.WRITE1_DATA_MAX_LENGTH) {
                intHeaderLength = Reducer.WRITE1_HEADER_LENGTH;
            } else if (intDataLen <= Reducer.WRITE2_DATA_MAX_LENGTH) {
                intHeaderLength = Reducer.WRITE2_HEADER_LENGTH;
            } else {
                throw ReducerError.CANT_CREATE_2E32BYTE_VIRTUALWRITE;
            }

            if (intMaxBufferLength < Reducer.WRITE0_MAX_LENGTH) {
                break;
            }

            if (intMaxBufferLength <= intHeaderLength) {
                 // Don't have enough buffer space for virtual write header
                 // plus at least one byte of data.  Quit the loop here, and
                 // process this queue item next time we get called.
                 break;
            }

            var arrHeader;
            var intOverAllLength = intLength + intHeaderLength;
            if (intOverAllLength > Reducer.WRITE0_MAX_LENGTH)
            {
                // Can use WRITE1 or WRITE2
                if (intOverAllLength > Reducer.WRITE1_MAX_LENGTH) {
                    // Can use WRITE2
                    //Bangalore
                    //header = (byte[])WRITE2.clone();
                    arrHeader = new Array(Reducer.WRITE2.length);
                    Utility.CopyArray(Reducer.WRITE2, 0, arrHeader, 0, Reducer.WRITE2.length);
                    //FIXME Bangalore byte typecast coversion
                    arrHeader[0] = Reducer.WRITE2_COMMAND;
                    arrHeader[1] = intDataLen & 0xff;
                    arrHeader[2] = (intDataLen >> 8) & 0xff;
                    arrHeader[3] = intChannel & 0xff;
                }
                else
                {
                    // Must use WRITE1
                    //Bangalore
                    //header = (byte[])WRITE1.clone();
                    arrHeader = new Array(Reducer.WRITE1.length);
                    Utility.CopyArray(Reducer.WRITE1, 0, arrHeader, 0, Reducer.WRITE1.length);
                    //FIXME Bangalore conversion to byte
                    arrHeader[0] = Reducer.WRITE1_COMMAND & 0xff;
                    arrHeader[1] = intDataLen & 0xff;
                    arrHeader[2] = intChannel & 0xff;
                }
            }
            else
            {
                // Must use WRITE0
                //Bangalore
                //header = (byte[])WRITE0.clone();
                arrHeader = new Array(Reducer.WRITE0.length);
                Utility.CopyArray(Reducer.WRITE0, 0, arrHeader, 0, Reducer.WRITE0.length);
                //FIXME Bangalore
                arrHeader[0] = Reducer.WRITE0_COMMAND;
                arrHeader[1] = intChannel & 0xff;
            }
            redExOutbuf.copyFromArray(arrHeader, 0, arrHeader.length);
        }
        else
        {
            var bResume = wdContext.needToResumeVirtualWrite;
            if (bResume) {
                // Need to add a PACKET_RESUME_VIRTUAL_WRITE header.
                // Allow for at least one byte of data.
                if (intMaxBufferLength < Reducer.RESUME_HEADER_LENGTH + 1) {
                  // We can't do this.  Just return, and the next time we
                  // process a virtual write we'll send the resume command.
                  break;
                }

                // Create a RESUME header, and copy it into the outbuf.
                //Bangalore
                //byte[] header = (byte[])RESUME.clone();
                var arrHeader = new Array(Reducer.RESUME.length);
                Utility.CopyArray(Reducer.RESUME,0,arrHeader,0,Reducer.RESUME.length);
                //FIXME Bangalore

                arrHeader[0] = Reducer.RESUME_COMMAND;
                arrHeader[1] = intDataLen & 0xff;
                arrHeader[2] = (intDataLen >> 8) & 0xff;
                arrHeader[3] = intChannel & 0xff;
                redExOutbuf.copyFromArray(arrHeader, 0, arrHeader.length);
                // We've now processed the "resume" flag, so we clear it.
                wdContext.needToResumeVirtualWrite = false;
            }
        }

        intMaxBufferLength        = redExOutbuf.getMaxLength();
        var intMaxLengthOfData    = (intLength < intMaxBufferLength)?intLength:intMaxBufferLength;
        redExOutbuf.copyFromArray(arrVirtualBuffer, intOffset, intMaxLengthOfData);
        if (intMaxLengthOfData === intLength) {
            //we've taken all of this write
            virtualWrites.incrementPosition();
            //TODO
            //WinstationDriver.vdCounts[channel]--;
        } else {
            // maxLengthOfData must be less than length, due to Math.min() above.
            //virtualWrites.decrementHeadLength(maxLengthOfData);
            item.decrementLength(intMaxLengthOfData);
            bPartial = true;
        }

        if (intMaxBufferLength <= intMaxLengthOfData) {
            // Shouldn't be less than, but...
            // We've filled the buffer
            break;
        }
    }
    return bPartial;
};

NullReducer.prototype.init = function (pow2, max) {
    // Do nothing - no need to initialize the NullReducer
};