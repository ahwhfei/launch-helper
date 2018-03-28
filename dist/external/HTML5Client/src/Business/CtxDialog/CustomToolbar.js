var UiControls;
(function(UiControls) {
	function CustomToolBar() {
		this.postMsgHandler=null;		
	}
	function customToolbarBtnHandler(id,e){		
		UiControls.CustomToolbar.postMsgHandler("onToolbarBtnClick_"+id,{"id":id});
	}
	
	CustomToolBar.prototype.register = function(customBtns){
		if(customBtns && UiControls && UiControls.Toolbar){		
			var rearPrimaryCustomButtons = [];
			var frontPrimaryCustomButtons = [];
			var secondaryCustomButtons = [];	
			
			for(var i=0;i<customBtns.length;i++){		
				var config = customBtns[i]["config"];
				if(config["isPrimary"] === false){
					secondaryCustomButtons.push(customBtns[i]);
				}else{	
					customBtns[i]["config"]["isPrimary"] = true;
					var position = customBtns[i]["config"]["position"];
					if(position === "rear"){
						rearPrimaryCustomButtons.push(customBtns[i]);	
					}else {
						customBtns[i]["config"]["position"] = "front";
						frontPrimaryCustomButtons.push(customBtns[i]);
					}
				}
			}						
			
			if(secondaryCustomButtons.length >0){
				for(var i=0;i<secondaryCustomButtons.length;i++){					
					secondaryCustomButtons[i]["handler"] = customToolbarBtnHandler.bind(null,secondaryCustomButtons[i]["id"]);
					UiControls.Toolbar.register(secondaryCustomButtons[i]);
				}
			}
			if(frontPrimaryCustomButtons.length >0){
				for(var i=frontPrimaryCustomButtons.length-1;i>=0;i--){					
					frontPrimaryCustomButtons[i]["handler"] = customToolbarBtnHandler.bind(null,frontPrimaryCustomButtons[i]["id"]);
					UiControls.Toolbar.register(frontPrimaryCustomButtons[i]);
				}
			}
			
			if(rearPrimaryCustomButtons.length > 0){
				if(!UiControls.Toolbar.getRearFirstCustomId()){					
					UiControls.Toolbar.setRearFirstCustomId(rearPrimaryCustomButtons["0"]["id"]);
				}
				
				for(var i=0;i<rearPrimaryCustomButtons.length;i++){							
					rearPrimaryCustomButtons[i]["handler"] = customToolbarBtnHandler.bind(null,rearPrimaryCustomButtons[i]["id"]);
					UiControls.Toolbar.register(rearPrimaryCustomButtons[i]);
				}
			}					
		}
	};		
	
	CustomToolBar.prototype.setPostMsgHandler = function(handler){
		this.postMsgHandler = handler;
	};
	
	CustomToolBar.prototype.removeButtons = function(buttonIds){
		for(var i=0;i<buttonIds.length;i++){
			UiControls.Toolbar.removeButton(buttonIds[i]);
		}
	};
	UiControls.CustomToolbar = new CustomToolBar();
})(UiControls||(UiControls={}));