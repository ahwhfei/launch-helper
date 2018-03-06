// Copyright © 2003 Citrix Systems, Inc.  All rights reserved.

function ICAWriteItem(buffer, offset, length) {
  
  this.buffer       = buffer;
  this.offset       = offset;
  this.length       = length;
  this.partial      = false;
  this.v3Action     = WriteItem.ACTION_CHECK;
  this.highPriority = true;

}

ICAWriteItem.prototype = new WriteItem();

