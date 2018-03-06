function MtVcTouchData(){
	    this.DATA_SIZE = 14;
		this.x;
		this.y;
		this.Time;
		this.ID;
		this.TouchState;
		this.Pressure;
		this.Name = "touchData";
		this.initialize  = function(xx,yy,time,id,touchState){
			this.x = xx;
			this.y = yy;
			this.Time= time;
			this.ID= id;
			this.TouchState = touchState;
		};
	}
