
//Currently this queue will have only one item always .
function VirtualWriteQueue() {
  
  var items  = new Array(VirtualWriteQueue.INITIAL_CAPACITY);
  /** Count of virtual writes */
  var count  = 0;
  /** Index position of "head" write */
  var head   = 0;
  /** Index position of "tail" write */
  var tail   = 0;
  
  this.addWrite = function (channel, buffer, offset, length, priority) 
  {
    var newItem = new VirtualWriteItem(channel, buffer, offset, length, priority);
    count++;
    items[tail] = newItem;
    tail++;
  };
  
  this.addHighPriorityItem = function (virtualQueueItem) {
    var length  = head + count;
    var index   = head;  
    if (!virtualQueueItem.highPriority) {
      virtualQueueItem.highPriority = true;
    }
    // Find the first low priority item.
    while (index < length && items[index].highPriority) {
      index++;
    }
    count++;
	
	items.length = head + count;
	items.splice(index,0,virtualQueueItem);
    // index now points at first low priority item.  count is one greater than
    // the length of the items available.
  //  Utility.CopyArray(items, index, items, index+1, count-index-1);
		
	//items[index] = virtualQueueItem;
	tail++;
  };

  /**
     * Gets the head item in the queue.
  */
  this.getHeadItem = function() {
    if (count <= 0) {
        return null;
    }
    return items[head];
  };
  
   /**
     * Increments the position counter.  This *must* be followed later by a call to
     * compact(), otherwise there is a memory leak.  This is a fast "pointer
     * increment" method.
     */
   this.incrementPosition = function() {
     if (count < 0) {
       throw VirtualWriteQueueError.NEGATIVE_COUNT;
     }
     if (count === 0) {
       return;
     }
     if (head < tail) {
       head++;
     }
     count--;
   };
   
   this.compact = function() {
     var temp;
     if (head === 0) {
       return;
     }
     if (count > 0) {
       temp = new Array(count + VirtualWriteQueue.INCREMENT_CAPACITY);
       Utility.Copyarray(items, head, temp, 0, count);
       items = temp;
     }
     head = 0;
     tail = count;
   };
   
   this.isEmpty = function() {
     if ((tail-head) !== count) {
       return VirtualWriteQueueError.HEAD_TAIL_COUNT_MISMATCH;
     }
     return (count === 0);
   } ;
   
    this.addAck = function(channel, windowSize) {
    var newItem = new VirtualAckItem(channel, windowSize);
    count++;
    items[tail] = newItem;
    tail++;
  };
}

VirtualWriteQueue.INITIAL_CAPACITY    = 5;
VirtualWriteQueue.INCREMENT_CAPACITY  = 5;