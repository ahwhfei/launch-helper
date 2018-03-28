function NullExpander()
{
	var arrGBuff    	= {};
	var offset  	= 0;
	var length  	=0 ;
	
	this.expand = function(inBuff, off, len)
	{
	    arrGBuff 	= inBuff;
	    offset 	= off;
	    length 	= len;
	    return 1;
	};
	
	this.outputBuffer = function()
	{
	    return arrGBuff;
	};
	
	this.outputOffset = function()
	{
	    return offset;
	};
	
	this.outputLength = function()
	{
	    return length;
	};
	
	this.init = function(pow2, max)
	{
	    // Do nothing - no need to initialize the NullExpander
	};
}