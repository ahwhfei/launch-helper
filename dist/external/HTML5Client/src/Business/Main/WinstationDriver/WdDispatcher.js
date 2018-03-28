/* WdDispatcher prototype */
function WdDispatcher(winstationDriver)
{
	var GET_COMMAND = 0, GET_CONSUMER = 3, FILL_CONSUMER = 4, ILLEGAL_STATE = -1;
	var PACKET_VIRTUAL_WRITE2 = 0x31, PACKET_VIRTUAL_WRITE0 = 0x2f, PACKET_VIRTUAL_WRITE1 = 0x30, PACKET_RESUME_VIRTUAL_WRITE = 0x43;
	var TWOBYTESIZE = -2, ONEBYTESIZE = -3, BADCOMMAND = -1, HIGH_COMMAND = 0x45;
	var GET_SIZEL = 1, GET_SIZEH = 2;

	
	var dConsumer = null; //DataConsumer
	var wd = winstationDriver;
	var no_of_channel  = 20 ;// Total no of channel if it is not set to correct value then problem will be in this file
    var interruptedVirtualWrites = new genericHashTable( no_of_channel );
    var channel = null;
	var SIZES = new Array (
							TWOBYTESIZE, BADCOMMAND, TWOBYTESIZE, BADCOMMAND,
							BADCOMMAND, ONEBYTESIZE, BADCOMMAND,  BADCOMMAND,
							0, BADCOMMAND, BADCOMMAND, BADCOMMAND, BADCOMMAND,
							BADCOMMAND, BADCOMMAND, BADCOMMAND, 1, BADCOMMAND,
							3, BADCOMMAND, 1, ONEBYTESIZE, TWOBYTESIZE,
							ONEBYTESIZE, TWOBYTESIZE, 5, 6, 4, 4, 1, 2, 1, 1,
							1, 1, 7, 7, 7, 7, 0, 0, 0, 0, 1, 1, 1, 1, 1, ONEBYTESIZE,
							TWOBYTESIZE, BADCOMMAND, ONEBYTESIZE, ONEBYTESIZE,
							ONEBYTESIZE, 3, 1, 2, BADCOMMAND, TWOBYTESIZE, TWOBYTESIZE,
							BADCOMMAND, BADCOMMAND, BADCOMMAND, ONEBYTESIZE, BADCOMMAND,
							TWOBYTESIZE, BADCOMMAND, TWOBYTESIZE, TWOBYTESIZE
						  );
						  
    function  WDDispatcherState( ) 
    {
         this.command;

         this.size    = 0;
         this.state   = GET_COMMAND;
         this.copied  = 0;
         this.channel = 0;
         var myself =  this;
         this.reset =  function () {
             myself.size   = 0;
             myself.state  = GET_COMMAND;
             myself.copied = 0;
             myself.channel = 0;
         };
    }
    var currentState =   new WDDispatcherState(); 
	this.SetDataConsumer = function setDataConsumer(dataConsumer)
	{
		dConsumer = dataConsumer;
	};

	this.EndConsuming = function(level)
	{
		wd.Close(level);
	};

	this.consumeData = function consumeData(data, offset, length)
	{
		var end = offset + length;
		
		while(offset < end)
		{
			switch(currentState.state)
			{
				case GET_COMMAND:
					currentState.command = data[offset++] & 0xFF;
					// BugFix: RFHTMCRM-1539
					// In NS12 we get Packet keepalive command which has only attribute as next P1 byte so just skip that byte 
					// and do not change the currentState. The current state should be 'command' to process 
					// other ICA packets.
					if(currentState.command == PacketIdentifier.PACKET_SET_GLOBAL_ATTR) {
						// Note: Skip the P1 attribute by incrementing the offset. Do not 
						// interpret it as size.										
						offset++;
					} else {
 						currentState.state = GET_SIZEL;
					}
					break;
				case GET_SIZEL:
					if (currentState.command >= HIGH_COMMAND || currentState.command < 0)
					{
						currentState.state = ILLEGAL_STATE;
						break;
					}
					currentState.size = SIZES[currentState.command];

					if (currentState.size == BADCOMMAND)
					{
						currentState.state = ILLEGAL_STATE;
						break;
					}
					if (currentState.size == TWOBYTESIZE)
					{
						currentState.size = data[offset++] & 0xFF;
						currentState.state = GET_SIZEH;
						break;
					}
					if (currentState.size == ONEBYTESIZE)
					{
						currentState.size = data[offset++] & 0xFF;
					}
					currentState.state = GET_CONSUMER;
					break;
				case GET_SIZEH:
					currentState.size |= (data[offset++] & 0xff) << 8;
					//if (currentState.size<0) currentState.size += 0xffffffff + 1;
					currentState.state = GET_CONSUMER;
					break;
				case GET_CONSUMER:
					if (currentState.command == PACKET_RESUME_VIRTUAL_WRITE) {
						  var channel0 = data[offset];
                        // get the saved state from the hash table for this channel
                        // and assign the state
                        var copied = currentState.copied; // Should be zero?
                        resume(channel0);
                        currentState.command = PACKET_VIRTUAL_WRITE2;
                        currentState.size++;
					}
					if (currentState.command == PACKET_VIRTUAL_WRITE0 || currentState.command == PACKET_VIRTUAL_WRITE1 || currentState.command == PACKET_VIRTUAL_WRITE2)
					{
						 channel = data[offset++];
						 currentState.channel = channel;
						 var vs = wd.getVirtualStreamManager();
						 dConsumer =  vs ;
						//dConsumer = new WorkerHelper(channel);
						if (currentState.command == PACKET_VIRTUAL_WRITE1 || currentState.command == PACKET_VIRTUAL_WRITE2)
						{
							--currentState.size;
						}
					}
					else
					{
						dConsumer = wd.WdStream;
					}
					currentState.state = FILL_CONSUMER;
					break;
				case FILL_CONSUMER:
					var toCopy = (end - offset) < (currentState.size - currentState.copied)?end - offset : currentState.size - currentState.copied;
					if (toCopy != 0)
					{
						if( dConsumer)
						{
							dConsumer.consumeData(data, offset, toCopy , channel );
						}
					}
					offset += toCopy;
					currentState.copied += toCopy;
					if (currentState.copied == currentState.size)
					{
						if (currentState.command == PACKET_VIRTUAL_WRITE0 || currentState.command == PACKET_VIRTUAL_WRITE1 || currentState.command == PACKET_VIRTUAL_WRITE2)
						{
						}
						else
						{
							wd.ProcessNextCmd(currentState.command, currentState.size);
						}
						dConsumer = null;
						currentState.size = 0;
						toCopy = 0;
						currentState.copied = 0;
						currentState.state = GET_COMMAND;
					}
					break;
				case ILLEGAL_STATE:
					offset = end;
					currentState.state = GET_COMMAND;
					break;
				default:
					break;
			}

		}
	};
	
	this.AlertInterrupt =  function () {
       // HighThroughputExtractor has received an interrupt virtual write.
       interruptedVirtualWrites.put(currentState.channel, currentState);
       currentState = new WDDispatcherState();
   };
    function resume  ( channel) {
        currentState = interruptedVirtualWrites.get(channel);
    }

}
