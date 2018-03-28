
function WriteItem(buff, offs, len) {  
	this.buffer = buff;
	this.offset = offs;
	this.length = len;
	this.v3Action = WriteItem.ACTION_CHECK;
	this.highPriority = false;
	this.partial = false;  
}

WriteItem.prototype.decrementLength = function (dataWritten)
{
	this.offset += dataWritten;
	this.length -= dataWritten;
	this.partial = true;
};
  
WriteItem.prototype.setV3Action = function (action)
{
	if (action !== WriteItem.ACTION_COPY && action !== WriteItem.ACTION_COMPRESS) {
		throw WriteItemError.INVALID_V3_ACTION; 
	}
	this.v3Action = action;
};
  
WriteItem.prototype.getBuffer = function ()
{
	return this.buffer;
};
  
WriteItem.prototype.getOffset = function ()
{
	return this.offset;
};
  
WriteItem.prototype.getLength = function ()
{
	return this.length;
};
  
WriteItem.prototype.getPartial = function ()
{
	return this.partial;
};
  
WriteItem.prototype.getV3Action = function ()
{
	return this.v3Action;
};

WriteItem.ACTION_CHECK      = -1;
WriteItem.ACTION_COPY       = 0;
WriteItem.ACTION_COMPRESS   = 1;