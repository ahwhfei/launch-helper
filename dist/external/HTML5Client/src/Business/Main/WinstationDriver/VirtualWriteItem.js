
function VirtualWriteItem(channel, buffer, offset, length, priority) {
  
  this.buffer = buffer;
  this.offset = offset;
  this.length = length;
  this.v3Action = WriteItem.ACTION_CHECK;
  this.highPriority = false;
  this.partial = false;
  this.priority = priority;
  this.channel = channel;
  
  this.getChannel = function ()
  {
    return this.channel;
  };
                                                                                                                                             
} 

VirtualWriteItem.prototype = new WriteItem();

function  VirtualAckItem(channel , windowSize){
	this.buffer = new Uint8Array([0x32 ,  channel, windowSize & 0xff , (windowSize >>8)&0xff]);
	this.offset = 0;
	this.length = 4;	
}
VirtualAckItem.prototype = new WriteItem();
