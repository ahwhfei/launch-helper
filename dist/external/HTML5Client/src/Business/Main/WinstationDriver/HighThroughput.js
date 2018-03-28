/**
 * Class for holding High Throughput state and data, such as whether to send a
 * bandwidth estimate and the value of that estimate.  The calculation logic is not
 * currently implemented in this class.
 */
// TODO move calculation logic into this class
function HighThroughputContext()
{
    this.sendInputSpeed     		= false;
    this.sendRoundTripToken 		= true; // we initiate by sending this packet
    this.sendRoundTripTime  		= false;
    this.sendTimeNextPacket 		= false;
	this.outputSpeedInBytesPerSec 	= 9000;
    this.inputSpeedInBytesPerSec  	= 10000;
    this.roundTripTime 				= 100;
}

function WDContext(driver)
{
    this.needToSendInterrupt 		= false;
    this.needToResumeVirtualWrite 	= false;
    this.lastVirtualWriteWasPartial = false;
    this.highThroughputSupported 	= false;
    this.wd 						= driver;
}

WDContext.prototype.getMaxVirtualWriteLength = function()
{
	// This is the ICA buffer length.
    return this.wd.getICABufferLength();
};

/**
 * Class for processing server-to-client and client-to-server High Throughput header bytes.
 */
function HighThroughputExtractor()
{
    /** Default flag set, indicating normal packet */
    var  WD_TO_WD_DEFAULT                 = 0x00;
    /** Flag indicating packet contains 2 extra bytes with round trip time estimate */
    var WD_TO_WD_ROUND_TRIP_ESTIMATE     = 0x08;
    /** Flag indicating packet contains 2 extra bytes with bandwidth estimate */
    var WD_TO_WD_BANDWIDTH_ESTIMATE      = 0x10;
    /** Flag indicating sender wants server to calculate round trip time */
    var WD_TO_WD_ROUND_TRIP_TOKEN        = 0x20;
    /** Flag indicating sender wants server to calculate bandwidth estimate */
    var WD_TO_WD_TIME_NEXT_PACKET        = 0x40;
    /** Flag indicating sender is sending new data, thus interruptinfg the current virtual write */
    var WD_TO_WD_INTERRUPT_VIRTUAL_WRITE = 0x80;

    var TCP_OVERHEAD = 56;
    var SIZE_OF_ROUND_TRIP_HISTORY_TABLE = 64;
    var SIZE_OF_INPUT_SPEED_HISTORY_TABLE = 64;
    /** bytes per sec (don't impose any restrictions if speed above this) */
    var UNRESTRICTED_THRESHOLD = 450000;


    var consumer = null;
    var dispatcher = null;
    var context = null;

    var outputSpeedKnown = false;
    var timeNextPacketReceived = false;
    var roundTripSentPacketSize;
    var countRoundTripMeasurement = 0;
    var roundTripHistoryTable = new Array(SIZE_OF_ROUND_TRIP_HISTORY_TABLE);
    var inputSpeedHistoryLengths = new Array(SIZE_OF_INPUT_SPEED_HISTORY_TABLE);
    var inputSpeedHistoryDurations = new Array(SIZE_OF_INPUT_SPEED_HISTORY_TABLE);
    var totalInputSpeedHistoryLength = 1000;
    var totalInputSpeedHistoryDuration = 10;
    var countInputSpeedMeasurements = 0;
    var roundTripMinimum = 100;
    var lineLoadingPercent = 0; // TODO read from profile.

    var timeRoundTripTokenWasSent = 0;

    var numberOfSavedPackets = 0;
    var sequenceLength;
    var sequenceDuration;
	var sequenceStartTime = -1;


    this.startUsingWDHighThroughput = false;
    this.canDoWDHighThroughput 		= false;
    this.useInterruption 			= false;

    var packetSent = false;
	var wsDriver = null;
	var partialLength = 0;
	var partialDuration = 0;
	var lastSpeedSent  = 0 ;
	var needmorepacket = false ;
    context = new HighThroughputContext();
    for (var count = 0;  count < SIZE_OF_ROUND_TRIP_HISTORY_TABLE;  count++)
	{
        roundTripHistoryTable[count] = 64000;
    }

	
	for (var count = 0;  count < 10 ;  count++)
	{
		totalInputSpeedHistoryLength		+=	60;
		totalInputSpeedHistoryDuration		+= 3;
    	inputSpeedHistoryLengths[count]		= 60;
		inputSpeedHistoryDurations[count] 	= 3;
    }
	
	this.setWinStationDriver = function (wdObject)
	{
		wsDriver = wdObject;
	};

    /**
     * This is the callback used to process recieved data.
     * @param Data byte array to receive
     * @exception Exception If an error occurrs
     */
	this.consumeData = function consumeData(data, off, len)
    {
        if (!this.startUsingWDHighThroughput || !this.canDoWDHighThroughput)
		{
            consumer.consumeData(data, off, len);
        }
		else
		{
            var header = data[off];
            var d = new Date();
	    	var consumestarttime  = d.getTime();
            
            ++off;
            --len;

            if (timeNextPacketReceived && (header & WD_TO_WD_TIME_NEXT_PACKET) == 0 )
			{
				if ( sequenceStartTime > 0)
				{
					CalculateBandwidth(len);
					context.sendInputSpeed = true;
				}
            }

            if ((header & WD_TO_WD_BANDWIDTH_ESTIMATE) != 0)
			{
                var outputSpeed = (data[off++] & 0xff  | ((data[off++] & 0xff) << 8));
                var count = (outputSpeed >> 11) & 0x1F;
                var outputSpeedInBytesPerSec;
                outputSpeedInBytesPerSec = (outputSpeed & 0x7FF);
                outputSpeedInBytesPerSec |= 0x800;   /* set the top-most non-zero bit */
                outputSpeedInBytesPerSec <<= 20;     /* move to top of 32-bit word */
                outputSpeedInBytesPerSec >>>= count;  /* shift down to appropriate location */
                outputSpeedKnown = true;

                context.outputSpeedInBytesPerSec = outputSpeedInBytesPerSec;
                len -= 2;
            }

            if ((header & WD_TO_WD_ROUND_TRIP_ESTIMATE) != 0)
			{
                // Doing nothing @ the moment
                var roundTripTime = (data[off++] & 0xff) | ((data[off++] & 0xff) >> 8);
                len -= 2;
            }

            if ((header & WD_TO_WD_TIME_NEXT_PACKET) != 0)
			{
                context.sendInputSpeed = true;
                if (numberOfSavedPackets == 0)
				{		
					sequenceStartTime = TransportDriver.receiveTime;
					
					sequenceLength = 0;
					TransportDriver.consumptionTime = 0;
                }
				else
				{
                    sequenceLength += GetTrueTransmissionLength(len);
                }
                numberOfSavedPackets++;
                timeNextPacketReceived = true;
            }

            if ((header & WD_TO_WD_ROUND_TRIP_TOKEN) != 0)
			{
                CalculateRoundTripTime(len);
                context.sendRoundTripToken = true;
            }

            if ((header & WD_TO_WD_INTERRUPT_VIRTUAL_WRITE) != 0)
			{
                if (this.useInterruption)
				{
                    dispatcher.AlertInterrupt();
                }
            }
            consumer.consumeData(data,off,len);
            var d = new Date();
	    var consumeEndtime  = d.getTime();
            if( needmorepacket == true )
            {
            	needmorepacket =  false  ;
		var consumetime = consumeEndtime - consumestarttime ;
		if( consumetime == 0 )
		 {
		 	consumetime = .00001 ;
		 }
		var consumespeed = Math.floor( ( len * 1000 ) / consumetime );
		if(  consumespeed > 1.2*context.inputSpeedInBytesPerSec )
		{
			wsDriver.writeBandwidthPacket();
		}
					
            }
        }
    };

	var CalculateRoundTripTime = function calculateRoundTripTime(len)
    {
        var sendTime, receivedTime, elapsedTime;
        elapsedTime = TransportDriver.receiveTime - timeRoundTripTokenWasSent;
        sendTime = Math.floor(roundTripSentPacketSize*1000/context.outputSpeedInBytesPerSec);
        receivedTime = Math.floor(GetTrueTransmissionLength(len)*1000/context.inputSpeedInBytesPerSec);
        elapsedTime -= (sendTime+receivedTime);

        if (elapsedTime < 1)
		{
            elapsedTime = 1;
        }
        if (elapsedTime > 64000)
		{
            elapsedTime = 64000;
        }
        // Put the roundtrip time in the roundtrip time table
        roundTripHistoryTable[countRoundTripMeasurement & SIZE_OF_ROUND_TRIP_HISTORY_TABLE-1] = elapsedTime;
        countRoundTripMeasurement++;

        // Find the minimum from the table
        var minimumValue = 64000;
        for (var count = 0;  count < SIZE_OF_ROUND_TRIP_HISTORY_TABLE; ++count)
		{
            if (roundTripHistoryTable[count] < minimumValue)
			{
                minimumValue = roundTripHistoryTable[count] ;
            }
        }

        // Guard against any very early silly result
        roundTripMinimum += 50;
        if (roundTripMinimum > 64000)
		{
            roundTripMinimum = 64000;
        }
        if (roundTripMinimum < minimumValue)
		{
            minimumValue = roundTripMinimum;
        }

        if (minimumValue != context.roundTripTime)
		{
            context.roundTripTime = minimumValue;
            context.sendRoundTripTime = true;
        }

    };

	var CalculateBandwidth = function calculateBandwidth(len)
	{	
		sequenceLength += GetTrueTransmissionLength(len);
		sequenceDuration = TransportDriver.receiveTime - sequenceStartTime;// - TransportDriver.consumptionTime ;
		
		if (sequenceDuration < 0) // To be on the safe side.
		{
			sequenceDuration = 0;
		}
		
		numberOfSavedPackets = 0;

		if (sequenceDuration > Math.floor(sequenceLength / 10))
		{

            sequenceDuration = Math.floor(sequenceLength / 10);
        }

        while (sequenceLength > 2048)
		{
            sequenceLength >>>= 1;
            sequenceDuration >>>= 1;
        }
		
		partialLength += sequenceLength;
   	    partialDuration += sequenceDuration;
 
 	    if (partialLength < 1000)
 	    {
			return;	// wait till we have accumulated a decent size measurement
 	    }

		sequenceLength = partialLength;
		sequenceDuration = partialDuration;
		
		partialLength = 0;
		partialDuration = 0;
		
        // Take out oldest numbers and put new numbers into history table
        var index = countInputSpeedMeasurements & (SIZE_OF_INPUT_SPEED_HISTORY_TABLE-1);
    
        totalInputSpeedHistoryLength -= (inputSpeedHistoryLengths[index] & 0xffffffff);
        totalInputSpeedHistoryDuration -= (inputSpeedHistoryDurations[index] & 0xffffffff);
        totalInputSpeedHistoryLength += (sequenceLength & 0xffffffff);
        totalInputSpeedHistoryDuration += (sequenceDuration & 0xffffffff);

        inputSpeedHistoryLengths[index] = (sequenceLength & 0xffff);
        inputSpeedHistoryDurations[index] = (sequenceDuration & 0xffff);
        countInputSpeedMeasurements++;
		
		
		var totalLength = totalInputSpeedHistoryLength ;
		var totalDuration = totalInputSpeedHistoryDuration;
		var i = -1;
		var inputSpeedHistoryTableLength = inputSpeedHistoryLengths.length;
	    
		var  worstDuration = 0;
        var  worstLength = 0;
        var  nextWorstDuration = 0;
        var  nextWorstLength = 0;
		var  duration = 0;
		var  length = 0;
		
		for(i = 0; i<inputSpeedHistoryTableLength ;++i)
		{
			duration = inputSpeedHistoryDurations[i];
			length = inputSpeedHistoryLengths[i];
		    if(duration > worstDuration)
			{
				if (worstDuration > nextWorstDuration)
				{
                    nextWorstDuration = worstDuration;
                    nextWorstLength = worstLength;
                }
                worstDuration = duration;
                worstLength = length;
           }
           else if (duration > nextWorstDuration)
           {
                nextWorstDuration = duration;
                nextWorstLength = length;
           }			
		}
		
			totalLength = totalInputSpeedHistoryLength - (worstLength + nextWorstLength);
			totalDuration = totalInputSpeedHistoryDuration - (worstDuration + nextWorstDuration);

			var newSpeed = 0;
		
		if (totalDuration == 0)
	    {
	        /* Infinite speed?  Cap at 800 M bits per second */ 
	        newSpeed = 100000000;  /* 100 M bytes per second */
	    }
		else
	    {
	        newSpeed = Math.floor((totalLength * 1000) / totalDuration);
	        if (newSpeed < 10000)
	        {
				
	            newSpeed = 10000;
	        }
	        else if (newSpeed > 100000000)   /* > 800 M bits per second? */
	        {
	            /* Cap at 800 M bits per second */ 
	            newSpeed = 100000000;  /* 100 M bytes per second */
	        }        
	    }
		sequenceStartTime = -1;  

		context.inputSpeedInBytesPerSec = newSpeed;

        if (!outputSpeedKnown)
		{
            context.outputSpeedInBytesPerSec = Math.floor(0.9 * context.inputSpeedInBytesPerSec);
        }
		
	
		if (1.2 * lastSpeedSent < newSpeed )
		{
			needmorepacket =  true ;
		}
   };

	this.EndConsuming = function endConsuming(level, reason)
    {
        consumer.EndConsuming(level, reason);
    };

    this.SetDataConsumer = function setDataConsumer(cs)
	{
        consumer = cs;
   };

	this.GetMaximumOverheadBytes = function getMaximumOverheadBytes()
    {
		// Flag + 2[roundtrip] + 2[bandwidth]
        return 5;
    };

    /**
     * Adds a High Throughput header to an existing buffer, before the specified position
     * in the buffer.
     * @param data the buffer to which to add a High Throughput header
     * @param off the offset in to the buffer at which the data starts; header is added before this.
     * @param len the length of the data in the data buffer.
     * @param context the WDContext; used for determining whether to send a
     * WD_TO_WD_INTERRUPT_VIRTUAL_WRITE flag.
     */
	this.AddHeader = function addHeader(data, off, len, wdContext)
	{
        var sendRoundTripTime  = context.sendRoundTripTime;
        var sendInputSpeed     = context.sendInputSpeed;
        var sendTimeNextPacket = context.sendTimeNextPacket;
        var sendRoundTripToken = context.sendRoundTripToken;

        var roundTripOffset = sendRoundTripTime  ?  off - 2              :  off;
        var bandwidthOffset = sendInputSpeed     ?  roundTripOffset - 2  :  roundTripOffset;
        var headerOffset;

        if (!this.startUsingWDHighThroughput  || !this.canDoWDHighThroughput)
		{
            // Don't need to do anything.  Just set the headerOffset appropriately.
            headerOffset = off;
        }
		else
		{
            headerOffset = bandwidthOffset - 1;
			//So that we can use one array for writing packets and not create new array every time.
            data[headerOffset] = 0; 
     
            if (wdContext.needToSendInterrupt)
			{
                data[headerOffset] |= WD_TO_WD_INTERRUPT_VIRTUAL_WRITE;
                wdContext.needToSendInterrupt = false;
            }

            if (sendRoundTripTime)
			{
                data[headerOffset] |= WD_TO_WD_ROUND_TRIP_ESTIMATE;

                if (context.roundTripTime > 0xFFFF)
				{
                    context.roundTripTime = 0xFFFF;
                }
                data[roundTripOffset] = context.roundTripTime & 0xFF;
                data[roundTripOffset+1] = (context.roundTripTime >>> 8) & 0xFF;
                context.sendRoundTripTime = false;
            }

            if (sendInputSpeed)
			{
                data[headerOffset] |= WD_TO_WD_BANDWIDTH_ESTIMATE;

                var speed = context.inputSpeedInBytesPerSec;
                var count = 0;
                while ((speed & 0x80000000) == 0)
				{
                    speed <<= 1;
                    count++;
                }
                // encode UNIT16 as shift count (bits 11-15) and remaining significant bits (bits 0-10)
                var result = speed >>> 20;
                result &= 0x7FF;
                result |= (count << 11);

                data[bandwidthOffset] = result & 0xFF;
                data[bandwidthOffset+1] = (result >>> 8) & 0xFF;
				
				lastSpeedSent = context.inputSpeedInBytesPerSec;
               
			    context.sendInputSpeed = false;
            }

            if (sendTimeNextPacket && !packetSent)
			{
                data[headerOffset] |= WD_TO_WD_TIME_NEXT_PACKET;
                context.sendTimeNextPacket = false;
                packetSent = true;
            }

            if (sendRoundTripToken)
			{
                data[headerOffset] |= WD_TO_WD_ROUND_TRIP_TOKEN; // Note the time of sending this packet

				var d = new Date();
                timeRoundTripTokenWasSent = d.getTime();
                roundTripSentPacketSize = GetTrueTransmissionLength(len);
                context.sendRoundTripToken = false;
            }

            if (packetSent && (data[headerOffset] & WD_TO_WD_TIME_NEXT_PACKET) == 0)
			{
                packetSent = false;
            }
        }

        return headerOffset;
   };

    this.SetDispatcher = function setDispatcher(wdDispatcher)
	{
        dispatcher = wdDispatcher;
   };

    var GetTrueTransmissionLength = function getTrueTransmissionLength(size)
	{
        return size + TCP_OVERHEAD; // + dispatcher.GetSSLOverhead();
   };

    this.GetOutputSpeedInBytesPerSec = function getOutputSpeedInBytesPerSec()
	{
        return context.outputSpeedInBytesPerSec;
   };

    this.SetSendTimeNextPacket = function setSendTimeNextPacket(send)
	{
        context.sendTimeNextPacket = send;
   };

    this.GetContext = function getContext()
	{
        return context;
   };
}
