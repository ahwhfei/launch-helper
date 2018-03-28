/**
 * This class handles the ChannelMonitor WD packet (0x3F) and is responsible for
 * tracking the average roundtrip latency of the connection.
 */
function ChannelMonitor(driv, lt, ht)
{
    // WinstationDriver that owns this ChannelMonitor
    var driver = driv;

    // Ping response times. lastLatency in millisecs, averageLatency in
    // millisecs * 8.
    var averageLatency = 0;
    var lastLatency = 0;

    var numSent     = 0;
    var numReceived = 0;

    var startTime;
	//Intialize AppendPing to an empty function.
	this.AppendPing = function(){
		writeHTML5Log(0,"SESSION:|:ICA:|:CHANNELMONITOR:|: Channel Monitoring is Disabled. Shouldn't have received this.");
		return false;
	};

	// Is this channel monitor active? We only activate the channel monitor
    // once the capability has been negotiated with the server. (See
    // ICA30WinstationDriver)
	// Refactoring this so that if check is disabled. No need of checking for enabled everytime.*/
    this.Enable = function enable()
	{
		// Intialize AppendPing if the channel Monitoring is enabled.
        this.AppendPing = function (){
	        numSent++;
	        driver.WritePacketPingRequest(lastLatency, averageLatency);
	        startTime = (new Date()).getTime();
			return true;
		};
		
   };


	

    this.ReadPing = function readPing(stream, size)
    {
        var command = stream.ReadByte();

        switch (command) {
            case 1:				//This from spec should be hit when server sends Latencies. But why would server send latencies?
			{
                lastLatency    = stream.ReadInt32();
                averageLatency = stream.ReadInt32();
				//writeHTML5Log(0,"SESSION:|:ICA:|:CHANNELMONITOR:|:SESSIONINFO:|:READPING Reading latencies and Writing Response.");
				//Response is a simple Array. Nothing with latencies sent here. This is just to update server sent info.
                driver.WritePacketPingResponse();
                break;
            }

            case 2:
			{
				numReceived++;
				if (numReceived == numSent)
				{
					lastLatency = ((new Date()).getTime() - startTime);
				}
				// We keep getting this.
				//writeHTML5Log(0,"SESSION:|:ICA:|:CHANNELMONITOR:|:SESSIONINFO:|:PING FROM SERVER RECEIVED. Need to calculateAverageLatency and update ping received.");
				this.CalculateAverageLatency();
				driver.PingReceived();
                break;
            }

            case 3:
			{
				writeHTML5Log(0,"SESSION:|:ICA:|:CHANNELMONITOR:|:SESSIONINFO:|:READPING Need to check when we hit this. And what the flags are for.");
				// TODO: CHECK:Where are these even used?? these are local variables??
				//############## dont delete as this reads data(ReadUint16 moves pointer on stream.) and might corrupt the chain if taken off.
                var repeatDelay = stream.ReadUInt16();
                var flags = stream.ReadUInt16();
                break;
            }
			
			//adding a default block to see if anyother resopnse is present. Ideally from spec this should never be hit.
			default:
			{
				writeHTML5Log(0,"SESSION:|:ICA:|:CHANNELMONITOR:|:SESSIONINFO:|:READPING. ERROR THIS CASE IS NOT COVERED. COMMAND RECEIVED is : " +command);
			}
        }
    };

    /**
     * calculates the averageLatency. Uses integer shift for speed, and to avoid
     * floating point. See wd\wdica30\chmon.c
     */
	this.CalculateAverageLatency = function calculateAverageLatency()
	{
	
    // Ping response times. lastLatency in millisecs, averageLatency in millisecs * 8.
        var iError = lastLatency - (averageLatency >> 3);
        averageLatency += iError;
   };
}