/* Timer prototype */
function Timer(count, interval, tickCallBack, endCallBack)
{
	var infinite = false;
	var secs = count;
	var timerID = null;
	var timerRunning = false;
	var delay = interval;
	var me = this;
	var dynamic = false;
	var timerTick = 0;
	
	/* if count < 0 we assume that it is an infinite timer */
	if (count < 0)
		infinite = true;
	
	this.UpdateInterval = function updateInterval(newInterval)
	{
		delay = newInterval;
	};
		
	this.Start = function start()
	{
		if (dynamic === false) 
		{
			if ((timerTick === secs) && (infinite === false)) 
			{
				if (endCallBack !== null) 
					endCallBack();
			}
			else 
			{
				timerTick = timerTick + 1;
				timerRunning = true;
				timerID = setTimeout(function(){me.Start();}, delay);
				if (tickCallBack !== null) 
					tickCallBack();
			}
		}
	};
	
	var startTime = 0;
	var endTime = 0;
	var missedTicks = 0;
	var delayStatic = interval;
	
	this.GetAndClearMissedTicks = function getAndClearMissedTicks()
	{
		var ret = missedTicks;
		missedTicks = 0;
		return ret;
	};
	
	this.StartDynamic = function startDynamic()
	{
		dynamic = true;
		
		if (startTime === 0) startTime = (new Date()).getTime();
		
		endTime = (new Date()).getTime();
		
		var timeTaken = endTime-startTime;
		missedTicks += (timeTaken / delayStatic);
		delay = interval - (timeTaken % delayStatic);
		
		if ( (timerTick === secs) && (infinite === false) ) 
		{
			if (endCallBack !== null)
				endCallBack();
		}
		else 
		{
			timerTick = timerTick + 1;
			timerRunning = true;
			timerID = setTimeout(function(){me.StartDynamic();}, delay);
			if (tickCallBack !== null)
				tickCallBack();
		}
	};
	
	this.Stop = function stop()
	{
		if (timerRunning) 
				clearTimeout(timerID);
			timerRunning = false;
			infinite = false;
		if (endCallBack !== null)
				endCallBack();
	};
	
	this.IsAlive = function isAlive()
	{
		return timerRunning;
	};
	
}


