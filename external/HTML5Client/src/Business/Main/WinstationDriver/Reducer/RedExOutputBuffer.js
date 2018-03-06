/**
 * Storage for an output buffer.
 * @author Mohit Sharma
 */
/**
 * Creates a representation of an expansion or reduction output buffer.  Takes a
 * buffer to expand/reduce into, an offset to write to and the maximum length
 * that may be written.
 * @param
 */
function RedExOutputBuffer (arrBuffer, intOffset, intMaxLength)
{  
	var arrBuffer        = arrBuffer;
	var intOffset        = intOffset;
	var intMaxLength     = intMaxLength;
	var intLength        = 0;
	
	/**
	* Gets the maximum write length for the buffer.
	* @return the maximum writable length.
	*/ 
	this.getMaxLength = function ()
	{
		return intMaxLength;
	};
	
	/**
	* Gets the length of the written data in the buffer.
	* @return the length of the written data.
	*/
	this.getLength = function ()
	{
		return intLength;
	};
	
	/**
	* Copies from an byte array into this RedExOutputBuffer.
	* @param array the byte array to copy from.
	* @param off the offset from which to start reading.
	* @param len the number of bytes to read.
	* @return the actual number of bytes read.
	*/
	this.copyFromArray = function (arrByteArray, intOff, intLen)
	{
		var intToCopy     = intLen;
		Utility.CopyArray(arrByteArray, intOff, arrBuffer, intOffset, intToCopy);
		intLength    += intToCopy;
		intMaxLength -= intToCopy;
		intOffset    += intToCopy;
		return intToCopy;        
	};
	
	this.reverseCopyFromArray = function (arrByteArray, intOff, intLen)
    {
		 var destOff = intOffset;
	     for(var ind = 0 ;ind < intLen ; ind++)
	     {
		 	arrBuffer[destOff + ind] = arrByteArray[intOff - ind];
	     }	    
	     intLength    += intLen;
         intMaxLength -= intLen;
         intOffset    += intLen;
         return intLen;        
    };
}
