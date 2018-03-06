function ReadEvent()
{
	var receiveAction = new Array();
	var receiveLength = new Array();
	var receiveId = new Array();
	var receiveWait = new Array();
	
	this.IsEmpty = function isEmpty()
	{
		if (receiveLength.length > 0)
			return false;
		else
			return true;
	};
		
	this.Register = function register(ID, func, length, waiting)
	{
		var len = receiveLength.push(length);
		len = len - 1;
		receiveAction[len] = func;
		receiveId[len] = ID; 
		receiveWait[len] = waiting;
	};
	
	this.ReadLength = function readLength()
	{
		if (receiveLength.length > 0) 
		{
			var len = receiveLength[0];
			return len;
		}
		return -1;
	};
	
	this.ID = function id(ID)
	{
		if (receiveLength.length > 0) 
		{
			return receiveId[0];
		}
		return null;
	};
	
	this.Wait = function wait()
	{
		if (receiveLength.length > 0) 
		{
			return receiveWait[0];
		}
		return null;
	};
	
	this.Deregister = function deregister()
	{
		if (receiveLength.length > 0) 
		{
			receiveLength.splice(0,1);
			receiveAction.splice(0,1);
			receiveId.splice(0,1);
			receiveWait.splice(0,1);
		}
	};
	
	this.Fire = function fire(sender, eventArgs)
	{
		if (receiveLength.length > 0) 
		{
			var func = receiveAction.shift();
			if (func !== null) {
				receiveLength.splice(0,1);
				receiveAction.splice(0,1);
				receiveId.splice(0,1);
				receiveWait.splice(0,1);			
				func(sender, eventArgs);
			}
			else
			{
				// TODO Contender of throwing an error...
			}
		}
	};
} 
