function TwAnyDriver(graphicsContext , twtwoanydriver1 )
{
	var virtualDriver = null;
	var gWD = null;
	var gVStream = null;
	var gDisplayWidth  = 1;
	var gDisplayHeight = 1;
	var context = graphicsContext;
	this.GetGWD = function getGWD(){return gWD;};
	this.SetGWD = function setGWD(gwd){gWD = gwd;};
	var twtwoanydriver = twtwoanydriver1 ;
	this.GetGVStream = function getGVStream(){return gVStream;};
	this.SetGVStream = function setGVStream(gvstream){gVStream = gvstream;};
	
	this.GetVirtualDriver = function getVirtualDriver(){return virtualDriver;};
	this.SetVirtualDriver = function setVirtualDriver(vd){virtualDriver = vd;};
	
	
	this.GetGDisplayWidth = function getGDisplayWidth(){return gDisplayWidth;};
	this.SetGDisplayWidth = function setGDisplayWidth(gdWidth){gDisplayWidth = gdWidth;};
	this.GetGDisplayHeight = function getGDisplayHeight(){return gDisplayHeight;};
	this.SetGDisplayHeight = function setGDisplayHeight(gdHeight){gDisplayHeight = gdHeight;};
	
	this.GetContext = function getContext(){return context;};
	this.SetContext = function setContext(graphicsContext){context = graphicsContext;};
	
	this.SetWinstationDriver = function setWinstationDriver(winstationDriver) 
	{
		gWD = winstationDriver;
		twtwoanydriver.setgWD ( gWD );
		if (gVStream == null) 
		{
			return false;
		}
		return true;
	};
	
	
	this.SetReadStream = function setReadStream(readStream) 
	{
		gVStream = readStream;
	};
	
	this.Close = function close() 
	{
		context.Close();
		gVStream = null;
	};
	
	this.AlterDisplaySize = function alterDisplaySize(width, height, rendForm) 
	{
		gDisplayWidth  = width;
		gDisplayHeight = height;
		context.MakeFrameBuffer(width, height , rendForm);
	};

}