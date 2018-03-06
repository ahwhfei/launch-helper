/* Reducer Constructor function */
function Reducer()
{    
	//Set up the NullReducer to use for uncompressed transmissions.
	var nullReducer = new NullReducer();
	var fullReducer = null;
	var reducer     = nullReducer;
  
	// These are tied to the ICA 3.0 protocol - DO NOT CHANGE!
	var V4_REDUCTION    = 4;
	var V3_REDUCTION    = 3;
	var MARK2_REDUCTION = 2;
	var NULL_REDUCTION  = 0;
  
	/**
	 *  Switch on reduction, if relevant.
	 */
	this.ActivateReducer =  function (intPow2, intMax, intLevel)
	{
		if (intPow2 > 0 || intLevel == V3_REDUCTION || intLevel == V4_REDUCTION)
		{
			// Create a Reducer depending on type
			switch (intLevel)
			{
				case V4_REDUCTION:
				case V3_REDUCTION:
					if (!(fullReducer instanceof V3Reducer)) {
						fullReducer = new V3Reducer();
					}
					break;
				
				case NULL_REDUCTION:
					if (!(fullReducer instanceof NullReducer)) {
						fullReducer = new NullReducer();
					}
					break;
				
				default:
					throw ReducerError.INVALID_REDUCER_LEVEL_SPECIFIED;
			}
			fullReducer.init(intPow2, intMax);
			this.unPause();
		}
	};//close ActivateReducer
  
	this.pause = function ()
	{
		reducer = nullReducer;
	};
  
	this.unPause = function ()
	{
		reducer = fullReducer;
	};
  
  /**
   * Compresses an ICA packet and (possibly) some virtual writes.  Takes a buffer,
   * offset and length of the ICA command, a queue of virtual writes, an output
   * buffer into which to write, and a WinstationDriver context for ascertaining
   * whether or not to send a RESUME command when writing the virtual write.
   * @param buffer the byte[] representing the ICA command to write.
   * @param offset an int indicating the offset into <code>buffer</code> at which
   *               to start reading the write.
   * @param length an int containing the length of the ICA command.
   * @param VirtualWriteQueue a VirtualWriteQueue of queued virtual writes.
   * @param RedExOutputBuffer the RedExOutputBuffer to use as the output buffer.
   * @param WDContext a WDContext containing state flags, including whether to
   *                  resume the next virtual write.
   * @return whether the last virtual write was incomplete.
   */
	this.compressData = function (arg1,arg2, arg3, arg4, arg5, arg6, arg7)
	{
		if (arguments.length === 7)
		{
			// Pass on to the appropriate BufferReducer to deal with.
			return reducer.reduce(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
		}
		else if (arguments.length === 4)
		{
			return reducer.reduce1(arg1, arg2, arg3, arg4);           
		}
	} ;
}//close Reducer

// Virtual write handling constants.
Reducer.WRITE0_HEADER_LENGTH = 2;
Reducer.WRITE1_HEADER_LENGTH = 3;
Reducer.WRITE2_HEADER_LENGTH = 4;
Reducer.RESUME_HEADER_LENGTH = 4;
Reducer.ACK_HEADER_LENGTH    = 4;
Reducer.WRITE0_DATA_MAX_LENGTH = 0x01;
Reducer.WRITE1_DATA_MAX_LENGTH = 0xff;
Reducer.WRITE2_DATA_MAX_LENGTH = 0xffff;
Reducer.RESUME_DATA_MAX_LENGTH = 0xffff;
Reducer.WRITE0_MAX_LENGTH = Reducer.WRITE0_HEADER_LENGTH + Reducer.WRITE0_DATA_MAX_LENGTH;
Reducer.WRITE1_MAX_LENGTH = Reducer.WRITE1_HEADER_LENGTH + Reducer.WRITE1_DATA_MAX_LENGTH;
Reducer.WRITE0_COMMAND = 0x2F;
Reducer.WRITE1_COMMAND = 0x30;
Reducer.WRITE2_COMMAND = 0x31;
Reducer.RESUME_COMMAND = 0x43;
Reducer.WRITE0 = new Array(Reducer.WRITE0_HEADER_LENGTH);
Reducer.WRITE1 = new Array(Reducer.WRITE1_HEADER_LENGTH);
Reducer.WRITE2 = new Array(Reducer.WRITE2_HEADER_LENGTH);
Reducer.RESUME = new Array(Reducer.RESUME_HEADER_LENGTH);