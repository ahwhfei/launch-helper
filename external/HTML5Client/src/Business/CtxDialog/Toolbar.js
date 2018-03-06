var UiControls;
(function(UiControls) {
	var frameWidth = 100;;
	var frameHeight = 100;

	
	var ToolbarView = (function() {
		var menu;
		var CtxToolbar;
		var receiverBtn;
		var toolbarState;
		function ToolbarView() {
			CEIP.add("toolbar:enabled",true);
			UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation ,function(displayDetails){
				if(displayDetails.multimonitor == true){
					frameWidth = displayDetails.displayInfo[displayDetails.primaryMonitor].bounds.width;
					frameHeight = displayDetails.displayInfo[displayDetails.primaryMonitor].bounds.height;
				}else{
					frameWidth = displayDetails.sessionSize.width;
					frameHeight = displayDetails.sessionSize.height;
				}
			});
			UiControls.ResolutionUtility.registerCallback( UiControls.ResolutionUtility.constants.displayInformation, function(displayDetails){
				if(displayDetails.multimonitor == true){
					frameWidth = displayDetails.displayInfo[displayDetails.primaryMonitor].bounds.width;
					frameHeight = displayDetails.displayInfo[displayDetails.primaryMonitor].bounds.height;
				}else{
					frameWidth = displayDetails.sessionSize.width;
					frameHeight = displayDetails.sessionSize.height;
				}
			});
			menu = new PrimaryMenu();
		}		

		
		ToolbarView.prototype.hide = function(){
			    CtxToolbar = document.getElementById("CtxToolbar");
				if(CtxToolbar){
					CtxToolbar.style.display = "none";	
				}else{
					CtxToolbar =  document.createElement("div");
					CtxToolbar.id = "CtxToolbar";
					CtxToolbar.style.position = "absolute";
					CtxToolbar.style.width	= "100%";
					CtxToolbar.style.height = "100%";
					CtxToolbar.style.left = "0px";
					CtxToolbar.style.top = "0px";
					CtxToolbar.style.zIndex = "auto";
					document.getElementById("CitrixXtcRoot").appendChild(CtxToolbar);
					CtxToolbar.style.display = "none";	
				}
		}
		ToolbarView.prototype.addToolBarEntry  = function(id,toolBarEntry){
			menu.addToolBarEntry(id,toolBarEntry);
		};
		ToolbarView.prototype.removeToolBarEntry  = function(id,tItem){
			menu.removeToolBarEntry(id,tItem);
		};
		
			
		ToolbarView.prototype.setPositionOnResize = function(resizeParams){
		   
			var newSessionWidth =  resizeParams[0];
			var newSessionHeight = resizeParams[1];
			
			toolbarState = 'collapsed';
			document.getElementById("CtxReceiver").draggable = true;
			document.getElementById("secondaryMenu").style.display = "none";
			setInitialPosition(newSessionWidth);
			if(isChromeOS ||!PlatformInfo["isTouchOS"]){
		
					 receiverBtn = document.getElementById('CtxReceiver');
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIcon","");
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconTop","");
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconLeft","");
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconBottom","");
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconRight","");
					receiverBtn.className = receiverBtn.className.replace(" receiver","");
					
					receiverBtn.className += " halfToolbarIcon halfToolbarIconTop";
					
					for(var i=0;i<receiverBtn.childNodes.length;i++)
					{
						var x = receiverBtn.childNodes[i];
						if(x){
							x.style.display="block";
						}
					}
			}		
			
			setOnTop('leftFloat');
			
			if((!isChromeOS && PlatformInfo["isTouchOS"]) && (newSessionHeight > newSessionWidth))
			{
					setInitialPositionForMobile(newSessionHeight);
			}	
		};
		
		function setInitialPosition(newSessionWidth){
		
			var width;
		    width =(newSessionWidth!==undefined)?newSessionWidth:frameWidth;
			var CtxReceiver = document.getElementById("CtxReceiver");
			CtxReceiver.style.left = ((width-40)/2) + "px";
			CtxReceiver.style.top = "0px";
			CtxReceiver.style.margin= "0px 12px 0px 0px";
			var toolbarPrimary = document.getElementById("toolbarPrimary");
			
				
			toolbarPrimary.style.left = (parseInt(CtxReceiver.style.left) + 40 + 12) + "px";
			toolbarPrimary.style.top =  "0px";
			toolbarPrimary.style.marginTop = "0px";
			toolbarPrimary.className = toolbarPrimary.className.replace("leftFloat","");
			toolbarPrimary.className = toolbarPrimary.className.replace("rightFloat","");
			toolbarPrimary.className += " leftFloat";
			
			for(i=0;i<toolbarPrimary.children.length;i++)	{
			
			toolbarPrimary.children[i].className = toolbarPrimary.children[i].className.replace("leftFloat","");
			toolbarPrimary.children[i].className = toolbarPrimary.children[i].className.replace("rightFloat","");
			toolbarPrimary.children[i].className += " leftFloat";
			
				toolbarPrimary.children[i].style.margin= "0px 12px 0px 0px";
				
				toolbarPrimary.children[i].children[0].className = toolbarPrimary.children[i].children[0].className.replace("toolTipLeft","toolTipTop");
				toolbarPrimary.children[i].children[0].className = toolbarPrimary.children[i].children[0].className.replace("toolTipRight","toolTipTop");
				toolbarPrimary.children[i].children[0].className = toolbarPrimary.children[i].children[0].className.replace("toolTipBottom","toolTipTop");
			}
						
			hideToolbarPrimary();
			
			if(!CtxToolbar){
				CtxToolbar = document.getElementById("CtxToolbar");
			}
			CtxToolbar.style.zIndex ="auto";
		}
		
		function halfToFullReceiver(){
				
			 receiverBtn = document.getElementById("CtxReceiver");
			 if(toolbarState==='collapsed' && (isChromeOS ||!PlatformInfo["isTouchOS"]))
				   {
						var edge = determineEdge(parseInt(receiverBtn.style.left),parseInt(receiverBtn.style.top));
						
						if(edge==='halfToolbarIconLeft')
						{		
							receiverBtn.style.left = "0px";
							
						}
						else if(edge==='halfToolbarIconRight')
						{		
							receiverBtn.style.left = (frameWidth-receiverBtn.clientWidth-5)+"px";
							document.getElementById("toolbarPrimary").style.left = receiverBtn.style.left;
						}
						else if(edge==='halfToolbarIconBottom')
						{
							receiverBtn.style.top = (parseInt(receiverBtn.style.top)-20)+ "px";
							document.getElementById("toolbarPrimary").style.top = receiverBtn.style.top;
						}
						
						receiverBtn.className = receiverBtn.className.replace(" halfToolbarIcon","");
						receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconTop","");
						receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconLeft","");
						receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconBottom","");
						receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconRight","");
						
						receiverBtn.className = receiverBtn.className.replace(" receiver","");
						receiverBtn.className += " receiver";
						for(var i=0;i<receiverBtn.childNodes.length;i++)
						{
							var x = receiverBtn.childNodes[i];
							if(x){
								x.style.display="none";
							}
						}
					}else if((isChromeOS ||!PlatformInfo["isTouchOS"]) && toolbarState==='expanded')
						{
							for(var i=0;i<receiverBtn.childNodes.length;i++)
							{
								var x = receiverBtn.childNodes[i];
								if(x){
									x.style.display="none";
								}
							}
						}
		}
		function fullToHalfReceiver(){
			
			 receiverBtn = document.getElementById("CtxReceiver");
			 
			 if((toolbarState==='collapsed') && (isChromeOS||!PlatformInfo["isTouchOS"]))
				{
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIcon","");
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconTop","");
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconLeft","");
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconBottom","");
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconRight","");
					receiverBtn.className = receiverBtn.className.replace(" receiver","");
					
					receiverBtn.className += " halfToolbarIcon";
					receiverBtn.className += " "+ determineEdge(parseInt(receiverBtn.style.left),parseInt(receiverBtn.style.top));
					for(var i=0;i<receiverBtn.childNodes.length;i++)
					{
						var x = receiverBtn.childNodes[i];
						if(x){
							x.style.display="block";
						}
					}
					
					var edge = determineEdge(parseInt(receiverBtn.style.left),parseInt(receiverBtn.style.top));
					
					if(edge==='halfToolbarIconLeft')
					{				
						receiverBtn.style.left =  "-9px";
					} 
					else if(edge==='halfToolbarIconRight')
					{				
						receiverBtn.style.left =  (frameWidth-receiverBtn.clientWidth+8)+"px";
					} 
					else if(edge==='halfToolbarIconBottom')
					{
						receiverBtn.style.top = (frameHeight-23)+"px";
					} 
					
				}else if((isChromeOS ||!PlatformInfo["isTouchOS"]) && toolbarState==='expanded'){
					for(var i=0;i<receiverBtn.childNodes.length;i++)
					{
						var x = receiverBtn.childNodes[i];
						if(x){
							x.style.display="none";
						}
					}
				}
			
			 	 
		}
		function setInitialPositionForMobile(newSessionHeight){
		
			 var CtxReceiver = document.getElementById("CtxReceiver");
                //Set the default position to bottom left in case of touch os (mainly mobiles) May need to be written properly for tablet/desktop/mobile based on screen size
                                
                CtxReceiver.style.left = "20px";
                CtxReceiver.style.top = (newSessionHeight-CtxReceiver.clientHeight - 90) + "px";
				if(isChromeOS ||!PlatformInfo["isTouchOS"])
				{ //TODO: check if is required
				    CtxReceiver.className = CtxReceiver.className.replace(" halfToolbarIcon","");
					CtxReceiver.className = CtxReceiver.className.replace(" halfToolbarIconTop","");
					CtxReceiver.className = CtxReceiver.className.replace(" halfToolbarIconLeft","");
					CtxReceiver.className = CtxReceiver.className.replace(" halfToolbarIconBottom","");
					CtxReceiver.className = CtxReceiver.className.replace(" halfToolbarIconRight","");
					CtxReceiver.className = CtxReceiver.className.replace(" receiver","");
					
					CtxReceiver.className += " halfToolbarIcon";
					CtxReceiver.className += " "+ 'halfToolbarIconLeft';
					
				}
                                               
               setOnLeft('bottom');
		}
		
		ToolbarView.prototype.construct  = function(){
			
			 CtxToolbar = document.getElementById("CtxToolbar");
			if(!CtxToolbar){
				CtxToolbar =  document.createElement("div");
				CtxToolbar.id = "CtxToolbar";
				CtxToolbar.style.position = "absolute";
				CtxToolbar.style.width	= "100%";
				CtxToolbar.style.height = "100%";
				CtxToolbar.style.left = "0px";
				CtxToolbar.style.top = "0px";
				CtxToolbar.style.zIndex = "auto";
				//document.body.appendChild(CtxToolbar);
				document.getElementById("CitrixXtcRoot").appendChild(CtxToolbar);
			}
			 CtxToolbar.addEventListener("drop",dropComplete);
			CtxToolbar.addEventListener("dragleave",onDragLeave);
			 CtxToolbar.addEventListener("dragover",allowDropStatus);
			 CtxToolbar.addEventListener("touchend",touchEnd);
			 
			 //dismiss toolbar
			 CtxToolbar.addEventListener("click",function(e){
				var primaryToolbar = document.getElementById("toolbarPrimary");							
				if(primaryToolbar && primaryToolbar.style["zIndex"] == 12){
					expander(e);
					if(isChromeOS ||!PlatformInfo["isTouchOS"]){
						fullToHalfReceiver();
					}
				}
				e.stopPropagation();
				e.cancelBubble = true;
				
				// TODO: Need to do better focus handling instead of these variables.
				// If we give focus to session, clipboard dialog will lose focus of selected text!
				if (!clipboardDialogShown) {
					HTML5Interface.setKeyboardFocus();
				}
				return false;
			 },false);
			 
			 receiverBtn = document.createElement("div");
			 CtxToolbar.appendChild(receiverBtn);
			 receiverBtn.id = "CtxReceiver";
			 receiverBtn.style.display = "none";
			 receiverBtn.setAttribute("draggable",true);
			 
			 receiverBtn.addEventListener("dragstart",dragInitialize);
			 receiverBtn.addEventListener("click",expander);
			
			 receiverBtn.addEventListener("touchstart",touchStart);
			 receiverBtn.addEventListener("touchend",touchEnd);
			 receiverBtn.addEventListener("touchmove",function(event){
			 
			   if(toolbarState==='collapsed'){
					var touch = event.targetTouches[0];
					receiverBtn.style.left = touch.pageX-25 +'px';
					receiverBtn.style.top =touch.pageY-25 +'px' ;
				}
				event.preventDefault();
			});

			receiverBtn.className  = "toolbarItem halfToolbarIcon halfToolbarIconTop";
			 for(var i=0;i<3;i++){
				var x = document.createElement("div");
				x.className = "toolbarLines";
				receiverBtn.appendChild(x);
			 }
			 toolbarState='collapsed';
			 if((!isChromeOS && PlatformInfo["isTouchOS"]))
			 {
					//ToDO: remove left and right, bottom
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIcon","");
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconTop","");
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconLeft","");
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconBottom","");
					receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconRight","");
					
					receiverBtn.className = receiverBtn.className.replace(" receiver","");
					receiverBtn.className += " receiver";
					for(var i=0;i<receiverBtn.childNodes.length;i++)
					{
						var x = receiverBtn.childNodes[i];
						if(x){
							x.style.display="none";
						}
					}
			 }
			 
			   receiverBtn.addEventListener("mouseover",function(evt){
					halfToFullReceiver();  
				},false);	 
				
			  receiverBtn.addEventListener("mouseout",function(evt){
					fullToHalfReceiver();
				},false);
				
				menu.construct();
				
				setInitialPosition();
			if((!isChromeOS &&PlatformInfo["isTouchOS"]) && (frameHeight > frameWidth))
			{
				setInitialPositionForMobile(frameHeight);
			}				
		}

		//functions:
		
		function onDragLeave(e){
		// check if toolbar is dragged outside drop zone and reduce zIndex
		 if(e.clientX == 0 && e.clientY == 0){
		   document.getElementById("CtxToolbar").style.zIndex = "auto";		   
			hideToolbarPrimary();
		 }
		 e.preventDefault();
		 return false;
		}
		
	  function allowDropStatus(ev) {
			ev.preventDefault();
			return false;
		}
		
	  function determineEdge(x,y){
		 
				if(x <45){
					
					return 'halfToolbarIconLeft';					
				}else{
					if(y <45){
						return 'halfToolbarIconTop';
					}else if(y <= (frameHeight-55)){
						return 'halfToolbarIconRight';
					}
				}
					return 'halfToolbarIconBottom';
			}
			
	  function determineMobileEdge(x,y){
			
			if(frameHeight > frameWidth)
			{
				if(x <45){
					return 'halfToolbarIconLeft';					
				}else{
					return 'halfToolbarIconRight';
				}	

			}
			else{
					if(y < 45)
					{
						return 'halfToolbarIconTop';
						
					}
					else
					{
						return 'halfToolbarIconBottom';
					}
				}
			}
		
	  function touchStart(event)
				{
					clientX1 = 0;
					clientY1 = 0;
				}
	  function setToolBar(pos){
			switch(pos)
						{
								case "LeftFirstQuadrant":
									
									if((frameHeight < frameWidth) && (frameHeight <375))
										{
											setOnTop('leftFloat');
										}else{
										
											setOnLeft('top');
										}
										break;
									case "TopFirstQuadrant":
										if((frameHeight > frameWidth)&& (frameWidth <375))
										{
											setOnLeft('top');
										}
										else{
										
											setOnTop('leftFloat');
										}
										break;
									case "RightSecondQuadrant":
									
										if((frameHeight < frameWidth)&& (frameHeight <375))
										{
											setOnTop('rightFloat');
										}
										else{
											setOnRight('top');
										}
										break;
									case "TopSecondQuadrant":
										if((frameHeight > frameWidth)&& (frameWidth <375))
										{
											setOnRight('top');
										}
										else{
										
											setOnTop('rightFloat');
										}
										break;
									case "BottomThirdQuadrant":
										if((frameHeight > frameWidth)&& (frameWidth <375))
										{
											setOnLeft('bottom');
										}
										else{
										
											setOnBottom('leftFloat');
										}
										break;
									case "LeftThirdQuadrant":
									
									if((frameHeight < frameWidth)&& (frameHeight <375))
										{
										
											setOnBottom('leftFloat');
										}
										else{
											setOnLeft('bottom');
										}
										
										break;
									case "BottomFourthQuadrant":
										if((frameHeight > frameWidth)&& (frameWidth <375))
										{
											setOnRight('bottom');
										}
										else{
											setOnBottom('rightFloat');
										}
										break;
									case "RightFourthQuadrant":
									
									if((frameHeight < frameWidth)&& (frameHeight <375))
										{
											setOnBottom('rightFloat');
										}
										else{
											setOnRight('bottom');
										}
									break;
						};
		}
	  function touchEnd(event)
			{
				  var srcElement = document.getElementById("CtxReceiver");
				  if(srcElement.style.left && srcElement.style.top )
				  {
						var pos = determineToolbarPosition(parseInt(srcElement.style.left),parseInt(srcElement.style.top));
						setToolBar(pos);
				  }
				  
				  if(toolbarState==='collapsed' && (isChromeOS||!PlatformInfo["isTouchOS"]))
				  {
				    srcElement.className = srcElement.className.replace(" halfToolbarIcon","");
					srcElement.className = srcElement.className.replace(" halfToolbarIconTop","");
					srcElement.className = srcElement.className.replace(" halfToolbarIconLeft","");
					srcElement.className = srcElement.className.replace(" halfToolbarIconBottom","");
					srcElement.className = srcElement.className.replace(" halfToolbarIconRight","");
					srcElement.className = srcElement.className.replace(" receiver","");
					
					srcElement.className += " halfToolbarIcon";
					
					if(!isChromeOS)
					{
						  srcElement.className += " "+ determineMobileEdge(parseInt(srcElement.style.left),parseInt(srcElement.style.top));	
					}
					else{
						  srcElement.className += " "+ determineEdge(parseInt(srcElement.style.left),parseInt(srcElement.style.top));
					}
					for(var i=0;i<srcElement.childNodes.length;i++)
					{
						var x = srcElement.childNodes[i];
						if(x){
							x.style.display="block";
						}
					}
				}
			 }
	  function dragInitialize(ev) {
		
		   document.getElementById("CtxToolbar").style.zIndex = "12";		 
			hideToolbarPrimary();
		   clientX1 = parseInt(ev.target.style.left) -ev.pageX;
		   clientY1 = parseInt(ev.target.style.top) -ev.pageY;
		   
		   //console.log("At Start: pageX"+ ev.pageX +"pageY: "+ ev.pageY + "clientX:"+ ev.clientX + "clientY:" + ev.clientY);
		   
		   ev.dataTransfer.effectAllowed='move';
		   ev.dataTransfer.setData("Text", ev.target.getAttribute('id'));
		   //pass coordinates
		   return true;
		}
		
	  function dropComplete(ev) {
			document.getElementById("CtxToolbar").style.zIndex = "auto";			
			hideToolbarPrimary();
			ev.preventDefault();
			var buttons = document.getElementById("toolbarPrimary");
			var secMenu = document.getElementById("secondaryMenu");
			
			var i;
			var src = ev.dataTransfer.getData("Text");
			var srcElement = document.getElementById("CtxReceiver");
			srcElement.style.position = "absolute";
			var toolbarPos= determineToolbarPosition(ev.pageX,ev.pageY);
			setToolBar(toolbarPos);
			fullToHalfReceiver();
            HTML5Interface.setKeyboardFocus();
			
			ev.stopPropagation();
			return false;
	}	
		
	  function expander(event){
		var src = event['target'] || event['srcElement'];
		  if(src.id == 'CtxReceiver'){
			CEIP.incrementCounter("toolbar:click");
		  }
		CtxToolbar = document.getElementById("CtxToolbar");		
		
		var state = document.getElementById("toolbarPrimary").style.zIndex;
		
		switch(state){			
			case "12": //Chrome, FF, Safari returns string but IE returns number . Need to support both
			case 12 :
				document.getElementById("CtxReceiver").draggable = true;
				toolbarState='collapsed';
				CtxToolbar.style.backgroundColor = "transparent";
				CtxToolbar.style.zIndex = "auto";				
				document.getElementById("secondaryMenu").style.display = "none";				
				hideToolbarPrimary();
				break;
			case "auto" :							
				showToolbarPrimary();
				toolbarState='expanded';
				moveToolBar(event);
				var receiverBtn = document.getElementById("CtxReceiver");
			    receiverBtn.className = receiverBtn.className.replace(" halfToolbarIcon","");
				receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconTop","");
				receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconLeft","");
				receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconBottom","");
				receiverBtn.className = receiverBtn.className.replace(" halfToolbarIconRight","");
				
				receiverBtn.className = receiverBtn.className.replace(" receiver","");
				receiverBtn.className += " receiver";
				
				for(var i=0;i<receiverBtn.childNodes.length;i++)
				{
					var x = receiverBtn.childNodes[i];
					if(x){
						x.style.display="none";
					}
				}
				
				CtxToolbar.style.backgroundColor = "rgba(0,0,0,0.2)";
				CtxToolbar.style.zIndex = "12";
				document.getElementById("CtxReceiver").draggable = false;


				break;
		}		
		
		event.stopPropagation();
		return false;
	}
	/* Bug no : https://issues.citrite.net/browse/RFHTMCRM-1399   -  Toolbar icons are shown black when session launched from gateway sometimes.
	   Fix : If user does not click the toolbar icon once also and the gateway is logged off,
	   icons were not fetched due to authentication failure.
	   Hence, showing the icons at the background but setting visibility to hidden and zindex to auto.
	   This way icons are not shown blank. However if we are changing dynamic icons not during the toolbar construction it may still show black.
	*/
	function hideToolbarPrimary(){
		var toolbarPrimary = document.getElementById("toolbarPrimary");
		if(toolbarPrimary){
			toolbarPrimary.style["visibility"] = "hidden";			
			toolbarPrimary.style["zIndex"] = "auto";
		}
	}
	
	function showToolbarPrimary(){
		var toolbarPrimary = document.getElementById("toolbarPrimary");
		if(toolbarPrimary){
			toolbarPrimary.style["visibility"] = "visible";			
			toolbarPrimary.style["zIndex"] = "12";
		}
	}
	
	  function moveToolBar(event){
		
			var srcElement = document.getElementById("CtxReceiver");

			clientX1 = 0;
			clientY1 = 0;
			var toolbarPos = determineToolbarPosition(parseInt(srcElement.style.left),parseInt(srcElement.style.top));
				
			switch(toolbarPos)
			{
								    case "LeftFirstQuadrant":	
								
										if((frameHeight <750) && (frameHeight >400))
										{
											
											 if((frameHeight - parseInt(srcElement.style.top))<485){
												 
													srcElement.style.top = frameHeight -485 + "px";
													setOnLeft('top');
											 }
										}
										
										break;
									case "TopFirstQuadrant":
										if((frameWidth <750) && (frameWidth >400))
										{
											 if((frameWidth - parseInt(srcElement.style.left))<425){
													srcElement.style.left = frameWidth -425 + "px";
													setOnTop('leftFloat');	
											 }
										}
										break;
									case "RightSecondQuadrant":
										if((frameHeight <750)&& (frameHeight >400))
										{
												 if((frameHeight - parseInt(srcElement.style.top))<485){
													srcElement.style.top = frameHeight -485 + "px";
													setOnRight('top');
											 }
										}
										break;
									case "TopSecondQuadrant":
										if((frameWidth <750)&& (frameWidth >375))
										{
											 if(parseInt(srcElement.style.left)<375){
													srcElement.style.left = 375 +"px";
													setOnTop('rightFloat');	
											 }
										}
										break;
									case "BottomThirdQuadrant":
										if((frameWidth <750)&& (frameWidth >425))
										{
											if((frameWidth - parseInt(srcElement.style.left))<425){
													srcElement.style.left = frameWidth -425 + "px";
												  	setOnBottom('leftFloat');	
											 }
										}
										break;
									case "LeftThirdQuadrant":
										if((frameHeight <750)&& (frameHeight >375))
										{
											 if(parseInt(srcElement.style.top)<375){
													srcElement.style.top = 375 +"px";
													setOnLeft('bottom');
											 }
										}
										break;
									case "BottomFourthQuadrant":
										if((frameWidth <750)&& (frameWidth >375))
										{
											 if(parseInt(srcElement.style.left)<375){
													srcElement.style.left = 375 +"px";
													setOnBottom('rightFloat');
											 }
										}
										break;
									case "RightFourthQuadrant":	
										if((frameHeight <750)&& (frameHeight >375))
										{
											if(parseInt(srcElement.style.top)<375){
													srcElement.style.top = 375 +"px";
													setOnRight('bottom');
											 }
										}
										break;
			};
		}
		
	  function determineToolbarPosition(x,y){
	
		    var srcElement = document.getElementById("CtxReceiver");
			srcElement.style.position = "absolute";
			
			var valueX = x + clientX1;
			
			if(valueX < 0){
				srcElement.style.left  = "0px";
			}else if(valueX <= frameWidth-srcElement.clientWidth){
				srcElement.style.left = (valueX) + 'px';
			}else{
				srcElement.style.left = (frameWidth-srcElement.clientWidth)+"px";
			}
			
			
			var valueY = y + clientY1;
			
			if(valueY < 0){
				srcElement.style.top  = "0px";
			}else if(valueY <= frameHeight-srcElement.clientHeight){
				srcElement.style.top = (valueY) + 'px';	
			}else{
				srcElement.style.top = (frameHeight-srcElement.clientHeight)+"px";
			}
			
			
		if((parseInt(srcElement.style.left) <= (frameWidth/2)) && (parseInt(srcElement.style.top) <= (frameHeight/2)))
		{
			//quadrant 1
			
			if(parseInt(srcElement.style.left) < parseInt(srcElement.style.top))
			{
				return "LeftFirstQuadrant";		
			}
			else
			{
				return "TopFirstQuadrant";
			}
		}
		else if((parseInt(srcElement.style.left) > (frameWidth/2)) && (parseInt(srcElement.style.top) <= (frameHeight/2)))
		{
			//quadrant 2
			if(((frameWidth) - parseInt(srcElement.style.left)) < parseInt(srcElement.style.top))
			{
				return "RightSecondQuadrant";
			}
			else
			{
				return "TopSecondQuadrant";
			}
		}
		else if((parseInt(srcElement.style.left) <= (frameWidth/2)) && (parseInt(srcElement.style.top) > (frameHeight/2)))
		{
			//quadrant 3
			if(parseInt(srcElement.style.left)>((frameHeight)- parseInt(srcElement.style.top)))
			{
				return "BottomThirdQuadrant";
			}
			else
			{
				return "LeftThirdQuadrant";
			}
		}
		else 
		{
			//quadrant 4
		 
			if((frameWidth - parseInt(srcElement.style.left)) > ((frameHeight) - parseInt(srcElement.style.top)))
			{
				return "BottomFourthQuadrant";	
			}
			else
			{
				return "RightFourthQuadrant";	
			}
		}
	}	 
	  function setOnTop(floatDirection){
		menu.setOnTop(floatDirection);
	  }
	  
	  function setOnLeft(floatDirection){
		menu.setOnLeft(floatDirection);	
	  }
	  
	  function setOnRight(floatDirection){
	  	menu.setOnRight(floatDirection);	
	  }
	  
	  function setOnBottom(floatDirection){
	   	 menu.setOnBottom(floatDirection);	  
	  }

	  return ToolbarView;
	})();


	var PrimaryMenu = (function () {
	    var secMenu;
		var iconLength=40;
		var iconSpace=12;
		function PrimaryMenu() {

			//construct();
			secMenu = new SecondaryMenu();
		}

		PrimaryMenu.prototype.construct  = function () {

			var toolbarBtns = document.createElement("div");
			toolbarBtns.id= "toolbarPrimary"; 
			toolbarBtns.style.marginTop = "0px";
			toolbarBtns.style.top = "0px";			
			toolbarBtns.style.position = "absolute";		
			toolbarBtns.style.visibility = "hidden";		
			toolbarBtns.style.zIndex = "auto";
			
			CtxToolbar = document.getElementById("CtxToolbar");
			CtxToolbar.appendChild(toolbarBtns);		 
			
			var tItem = document.createElement("div");
			tItem.id = "more";
			tItem.className = "leftFloat toolbarItem more";
			tItem.addEventListener("click", expandSecondaryMenu.bind(null,"more"));
			toolbarBtns.appendChild(tItem);
			
			secMenu.construct();
		};
		
		
        PrimaryMenu.prototype.addToolBarEntry = function(id,toolBarEntry){			
			if(toolBarEntry["config"]["isPrimary"]){
					
				var toolbarPrimary = document.getElementById("toolbarPrimary");
				
				var tItem = document.createElement("div");
				tItem.id = id;
				tItem.className = "leftFloat toolbarItem";
				if(toolBarEntry["config"]["cssClass"]){
					tItem.className += " " + toolBarEntry["config"]["cssClass"];
				}else if(toolBarEntry["config"]["imageUrl"]){
					tItem.style.backgroundImage = 'url('+toolBarEntry["config"]["imageUrl"]+')';	
				}
				
				tItem.style.margin ="0px 12px 0px 0px";
				
				//Have a wrapper and then call inside the handler
				// Add touchend handler to keyboard button in case of MS Edge browser
				if(tItem.id === "keyboard" && g.environment.os.isWindows && g.environment.browser.isMSEdge)
				{
					tItem.addEventListener("touchend", clickHandler.bind(null,toolBarEntry));
				}
				else{
				 tItem.addEventListener("click", clickHandler.bind(null,toolBarEntry));
				}
								
				var ttItem = document.createElement("div");
				ttItem.id = id + "tooltip";
				ttItem.className = "tooltip toolTipTop";
				ttItem.style.display = "none";
				ttItem.innerHTML = HTML5Engine.i18n.getMessage(toolBarEntry["config"]["toolTip"]);
				tItem.appendChild(ttItem);
				if(tItem.id === _toolbar.getRearFirstCustomId()){
						tItem.isRearIndex = true;
				}
				
				if(!PlatformInfo["isTouchOS"])
				{
				
					tItem.addEventListener("mouseout",  showTooltip.bind(null,ttItem.id ,'none'));
					tItem.addEventListener("mouseover", showTooltip.bind(null,ttItem.id ,'inline-block'));
				
				}
				var position = toolBarEntry["config"]["position"];
				if(position === "rear"){							
					tItem.rearFlag = true;
					var more  = document.getElementById("more");									
					if(more){
						toolbarPrimary.insertBefore(tItem,more);
					}
					else{
						toolbarPrimary.appendChild(tItem);
					}
				}else if(position ==="front"){																	
					toolbarPrimary.insertBefore(tItem,toolbarPrimary.childNodes[0]);								
				}else{							
					var rearIndexCustomBtn  = document.getElementById(_toolbar.getRearFirstCustomId()) ;
					if(rearIndexCustomBtn){
						toolbarPrimary.insertBefore(tItem,rearIndexCustomBtn);
					}else{
						var more  = document.getElementById("more");
						toolbarPrimary.insertBefore(tItem,more);
					}					
				}
			}
			else
			{
			   secMenu.addToolBarEntry(id,toolBarEntry);
			}
		};
		PrimaryMenu.prototype.removeToolBarEntry = function(id,tItem){
			if(tItem["config"]["isPrimary"]){
				var toolbarEntry = document.getElementById(id);
				if(toolbarEntry){
					if(toolbarEntry.isRearIndex){
						if(toolbarEntry.nextSibling){
							if(toolbarEntry.nextSibling.id === "more"){
								_toolbar.setRearFirstCustomId("");
							}else{													
								toolbarEntry.nextSibling.isRearIndex = true;
								_toolbar.setRearFirstCustomId(toolbarEntry.nextSibling.id);
							}
						}
					}
					toolbarEntry.parentElement.removeChild(toolbarEntry);
				}
			}else{
				secMenu.removeToolBarEntry(id,tItem);
			}
		};
		function clickHandler(toolbarEntry,event)
		{
			toolbarEntry["clickHandler"](event);
		}
		
		function showTooltip(id,state,event){
			var element = document.getElementById(id);
			if(element && state){		
				 element.style.display = state;		
				}
		}
		
		function expandSecondaryMenu(id,event)
		{	
			secMenu.expand(id,event);
			
		}
		
		
	  PrimaryMenu.prototype.setOnTop = function(floatDirection){
	  
		var buttons = document.getElementById("toolbarPrimary");
		var srcElement = document.getElementById("CtxReceiver");
		srcElement.style.top="0px";
		
			if( parseInt(srcElement.style.left)>= (frameWidth-srcElement.clientWidth))
			{
				srcElement.style.left = (frameWidth-srcElement.clientWidth-10)+"px";
			}
		    buttons.className = buttons.className.replace("leftFloat","");
			buttons.className = buttons.className.replace("rightFloat","");
			buttons.className += " ";
			buttons.className += floatDirection;			
			buttons.style.marginTop = "0px";
			
			if(floatDirection==='leftFloat')
			{
				buttons.style.left =  parseInt(srcElement.style.left)+(iconLength+iconSpace-4)+8+"px";
				srcElement.style.margin = "0px 12px 0px 0px";
				buttons.style.transform="none";
				buttons.style.webkitTransform="none";
			}
			else
			{
				buttons.style.left = parseInt(srcElement.style.left)-20-((buttons.children.length)*(iconLength+iconSpace-2))+"px";
				srcElement.style.margin = "0px 0px 0px 12px";
				buttons.style.transform="none";
				buttons.style.webkitTransform="none";
			}
			buttons.style.top = "0px";
			buttons.style.position = "absolute";
			
			for(i=0;i<buttons.children.length;i++)	{
			
				buttons.children[i].className = buttons.children[i].className.replace("leftFloat","");
				buttons.children[i].className = buttons.children[i].className.replace("rightFloat","");
				buttons.children[i].className += " ";
				buttons.children[i].className += floatDirection;
				if(floatDirection==='leftFloat')
				{
					buttons.children[i].style.margin= "0px 12px 0px 0px";
					buttons.children[i].style.transform="none";
					buttons.children[i].style.webkitTransform="none";
				}
				else
				{
					buttons.children[i].style.margin= "0px 0px 0px 12px";
					buttons.children[i].style.transform="none";
					buttons.children[i].style.webkitTransform="none";
				}
				
				buttons.children[i].children[0].className = buttons.children[i].children[0].className.replace("toolTipLeft","toolTipTop");
				buttons.children[i].children[0].className = buttons.children[i].children[0].className.replace("toolTipRight","toolTipTop");
				buttons.children[i].children[0].className = buttons.children[i].children[0].className.replace("toolTipBottom","toolTipTop");
			}
			
			secMenu.setOnTop(floatDirection);	
	  };
	  
	  PrimaryMenu.prototype.setOnLeft = function(floatDirection){
	  
	  	var buttons = document.getElementById("toolbarPrimary");
		var srcElement = document.getElementById("CtxReceiver");
	  
			srcElement.style.left= "0px";
			
			if(parseInt(srcElement.style.top)> (frameHeight-55))
			{
				srcElement.style.top=(frameHeight-srcElement.clientHeight-15)+"px";
			}
			if(parseInt(srcElement.style.top)< srcElement.clientHeight)
			{
				srcElement.style.top="10px";
			}
			
			buttons.className = buttons.className.replace("leftFloat","");
			buttons.className = buttons.className.replace("rightFloat","");
			buttons.style.left= "0px";
			buttons.style.top= "";
			buttons.style.position = "absolute";
			if(floatDirection==='top')
			{
				buttons.style.marginTop =   (parseInt(srcElement.style.top))+(iconLength+iconSpace-4)+8+"px";
				buttons.style.transform="scaleY(1)";
				buttons.style.webkitTransform="scaleY(1)";
			    srcElement.style.margin = "0px 0px 0px 0px";
			}
			else
			{
				buttons.style.marginTop =  (parseInt(srcElement.style.top))-10-((buttons.children.length)*(iconLength+iconSpace-2))+"px";
				buttons.style.transform="scaleY(-1)";
				buttons.style.webkitTransform="scaleY(-1)";
				srcElement.style.margin = "12px 0px 0px 0px";
			}
			
			
			for(i=0;i<buttons.children.length;i++)	{
				buttons.children[i].className = buttons.children[i].className.replace("leftFloat","");
				buttons.children[i].className = buttons.children[i].className.replace("rightFloat","");
				
				
				if(floatDirection==='top')
				{
					buttons.children[i].style.margin= "0px 0px 12px 0px";
					buttons.children[i].style.transform="scaleY(1)";
					buttons.children[i].style.webkitTransform="scaleY(1)";
				}
				else
				{
					buttons.children[i].style.margin= "12px 0px 0px 0px";
					buttons.children[i].style.transform="scaleY(-1)";
					buttons.children[i].style.webkitTransform="scaleY(-1)";
				}
				
				buttons.children[i].children[0].className = buttons.children[i].children[0].className.replace("toolTipTop","toolTipLeft");
				buttons.children[i].children[0].className = buttons.children[i].children[0].className.replace("toolTipRight","toolTipLeft");
				buttons.children[i].children[0].className = buttons.children[i].children[0].className.replace("toolTipBottom","toolTipLeft");
			}
			
			secMenu.setOnLeft(floatDirection);
		
	  };
	  
	  PrimaryMenu.prototype.setOnRight = function(floatDirection){
		  
		
	  
	  	var buttons = document.getElementById("toolbarPrimary");
		var srcElement = document.getElementById("CtxReceiver");
		
			if(isChromeOS ||!PlatformInfo["isTouchOS"])
			{				
				if(parseInt(srcElement.style.top)<=375)
				{
					srcElement.style.left = (parseInt(srcElement.style.left)-10)+"px";
				}else{
					srcElement.style.left=(frameWidth-srcElement.clientWidth-20)+"px";
				}
			}
			else
			{
				
				srcElement.style.left=(frameWidth-srcElement.clientWidth-20)+"px";
			}
			
			if(parseInt(srcElement.style.top)> (frameHeight-55))
			{
				srcElement.style.top=(frameHeight-srcElement.clientHeight-15)+"px";
			}
			
			buttons.className = buttons.className.replace("leftFloat","");
			buttons.className = buttons.className.replace("rightFloat","");
			
		
				
			buttons.style.left= ( parseInt(srcElement.style.left))+"px";
			
			buttons.style.top= "";
			buttons.style.position = "absolute";
			
			if(floatDirection==='top')
			{
				buttons.style.marginTop =   (parseInt(srcElement.style.top))+(iconLength+iconSpace-4)+8+"px";
				buttons.style.transform="scaleY(1)";
				buttons.style.webkitTransform="scaleY(1)";
				srcElement.style.margin = "0px 0px 0px 0px";
			}
			else
			{
				buttons.style.marginTop =  (parseInt(srcElement.style.top))-10-((buttons.children.length)*(iconLength+iconSpace-2))+"px";
				buttons.style.transform="scaleY(-1)";
				buttons.style.webkitTransform="scaleY(-1)";
				srcElement.style.margin = "12px 0px 0px 0px";
			}
			
			for(i=0;i<buttons.children.length;i++)	{
				buttons.children[i].className = buttons.children[i].className.replace("leftFloat","");
				buttons.children[i].className = buttons.children[i].className.replace("rightFloat","");
				if(floatDirection==='top')
				{
					buttons.children[i].style.margin= "0px 0px 12px 0px";
					buttons.children[i].style.transform="scaleY(1)";
					buttons.children[i].style.webkitTransform="scaleY(1)";
				}
				else
				{
					buttons.children[i].style.margin= "12px 0px 0px 0px";
					buttons.children[i].style.transform="scaleY(-1)";
					buttons.children[i].style.webkitTransform="scaleY(-1)";
				}
				
				buttons.children[i].children[0].className = buttons.children[i].children[0].className.replace("toolTipTop","toolTipRight");
				buttons.children[i].children[0].className = buttons.children[i].children[0].className.replace("toolTipLeft","toolTipRight");
				buttons.children[i].children[0].className = buttons.children[i].children[0].className.replace("toolTipBottom","toolTipRight");	
			}
			secMenu.setOnRight(floatDirection);
	  };
	  
	  PrimaryMenu.prototype.setOnBottom = function(floatDirection){
	  //TODO: replace 50 by variable
	   	var buttons = document.getElementById("toolbarPrimary");
		var srcElement = document.getElementById("CtxReceiver");
		
			srcElement.style.top = (frameHeight-iconLength-3)+"px";
			
			buttons.className = buttons.className.replace("leftFloat","");
			buttons.className = buttons.className.replace("rightFloat","");
			buttons.className += " ";
			buttons.className += floatDirection ;			
			buttons.style.marginTop = "0px";
			buttons.style.top = srcElement.style.top;
			buttons.style.position = "absolute";
			if(floatDirection==='leftFloat')
			{
				buttons.style.left =  parseInt(srcElement.style.left)+(iconLength+iconSpace-4)+8+"px";
				srcElement.style.margin = "0px 12px 0px 0px";
			}
			else
			{
				buttons.style.left = parseInt(srcElement.style.left)-20-((buttons.children.length)*(iconLength+iconSpace-2))+"px";
				srcElement.style.margin = "0px 0px 0px 12px";
			}
			if(parseInt(srcElement.style.left) > frameWidth-srcElement.clientWidth-20){
				srcElement.style.left = (frameWidth-srcElement.clientWidth-20) + "px"
			}
			
			for(i=0;i<buttons.children.length;i++)	{
				buttons.children[i].className = buttons.children[i].className.replace("leftFloat","");
				buttons.children[i].className = buttons.children[i].className.replace("rightFloat","");
				buttons.children[i].className += " ";
				buttons.children[i].className += floatDirection;
				if(floatDirection==='leftFloat')
				{
					buttons.children[i].style.margin= "0px 12px 0px 0px";
				}
				else
				{
					buttons.children[i].style.margin= "0px 0px 0px 12px";
				}
				
				buttons.children[i].children[0].className = buttons.children[i].children[0].className.replace("toolTipTop","toolTipBottom");
				buttons.children[i].children[0].className = buttons.children[i].children[0].className.replace("toolTipRight","toolTipBottom");
				buttons.children[i].children[0].className = buttons.children[i].children[0].className.replace("toolTipLeft","toolTipBottom");
			}
			
			secMenu.setOnBottom(floatDirection);
	  };
		return PrimaryMenu;
	})();

	var SecondaryMenu = (function() {
		var secMenu;
		function SecondaryMenu() {
			
			
			//construct();
		}

		SecondaryMenu.prototype.construct  = function () {
		    var more = document.getElementById("more");
			var sItem = document.createElement("div");
			sItem.id = "secondaryMenu";
			sItem.style.display = "none";
			sItem.className = "secondaryMenu secondaryTopMenu";
			more.appendChild(sItem);
		};

		SecondaryMenu.prototype.addToolBarEntry = function(id,toolBarEntry){
		
			  //  console.log("register secondary menu called!"+ id);
				var sItem = document.getElementById("secondaryMenu");
				var tItem = document.createElement("div");
				tItem.innerHTML = HTML5Engine.i18n.getMessage(toolBarEntry["config"]["toolTip"]);
				tItem.id = id;
				tItem.addEventListener("click", clickHandler.bind(null,toolBarEntry));
				sItem.appendChild(tItem);
		};
		SecondaryMenu.prototype.removeToolBarEntry = function(id,tItem){
			var toolbarEntry = document.getElementById(id);
			if(toolbarEntry){									
				toolbarEntry.parentElement.removeChild(toolbarEntry);
			}
		};
		function clickHandler(toolbarEntry,event)
		{
			toolbarEntry["clickHandler"](event);
		}
		
		SecondaryMenu.prototype.setOnTop = function(floatDirection){
			 secMenu = document.getElementById("secondaryMenu");
			secMenu.className = secMenu.className.replace("secondaryLeftMenu","secondaryTopMenu");
			secMenu.className = secMenu.className.replace("secondaryRightMenu","secondaryTopMenu");
			secMenu.className = secMenu.className.replace("secondaryBottomMenu","secondaryTopMenu");
		};
		
		SecondaryMenu.prototype.setOnLeft = function(floatDirection){
			 secMenu = document.getElementById("secondaryMenu");
			secMenu.className = secMenu.className.replace("secondaryTopMenu","secondaryLeftMenu");
			secMenu.className = secMenu.className.replace("secondaryRightMenu","secondaryLeftMenu");
			secMenu.className = secMenu.className.replace("secondaryBottomMenu","secondaryLeftMenu");
		};
		
		SecondaryMenu.prototype.setOnRight = function(floatDirection){
			 secMenu = document.getElementById("secondaryMenu");
			secMenu.className= secMenu.className.replace("secondaryTopMenu","secondaryRightMenu");
			secMenu.className= secMenu.className.replace("secondaryLeftMenu","secondaryRightMenu");
			secMenu.className= secMenu.className.replace("secondaryBottomMenu","secondaryRightMenu");
		};
		
		SecondaryMenu.prototype.setOnBottom = function(floatDirection){
			 secMenu = document.getElementById("secondaryMenu");
			secMenu.className = secMenu.className.replace("secondaryTopMenu","secondaryBottomMenu");
			secMenu.className = secMenu.className.replace("secondaryLeftMenu","secondaryBottomMenu");
			secMenu.className = secMenu.className.replace("secondaryRightMenu","secondaryBottomMenu");	
		};
		
		SecondaryMenu.prototype.expand = function(id,event){
			//console.log("Secondary Menu is getting called");
			CEIP.incrementCounter("toolbar:buttons:secondaryMenu");
			
			var state = document.getElementById("secondaryMenu").style.display;
			switch(state){
				case "block":
					state = "none";
					//document.getElementById("buttonsDiv").pointerEvents = 'none';
					break;
				case "none" : 
					state = "block";
					//document.getElementById("buttonsDiv").pointerEvents = 'auto';
					break;
			}
			document.getElementById("secondaryMenu").style.display = state;
			//To avoid collapsing toolbar only on clicking more button and not for other secondary menu items.
			if(event.target.id === "more"){
				event.stopPropagation();
				return false;
			}
		};
		return SecondaryMenu;
	})(); 
	
	var ToolBar = (function() {		
		var registeredToolbarBtns = {};
		
		//TODO: change the structure of config 
		 var TOOLBAR_CONFIG = {                        
				"clipboard":
				{
					"isPrimary":true,
					"cssClass": "clipboard",
					"index":"1",
					"toolTip":"toolbar-copy"
				},
				"usb":
				{
					"isPrimary":true,
					"cssClass": "usb",
					"index":"2",
					"toolTip":"toolbar-usb"
				},
				"fileUpload":
				{
					"isPrimary":true,
					"cssClass": "fileUpload",
					"index":"3",
					"toolTip":"toolbar-file-upload"
				},
				"fileDownload":
				{
					"isPrimary":true,
					"cssClass": "fileDownload",
					"index":"4",
					"toolTip":"toolbar-file-download"
				},
				"fullscreen":
				{
					"isPrimary":true,
					"cssClass": "fullscreen",
					"index":"5",
					"toolTip":"toolbar-fullscreen"
				},
				"keyboard":
				{
					"isPrimary":false,
					"cssClass": "keyboard",
					"index":"1",
					"toolTip":"toolbar-keyboard"
				},
				"multitouch":
				{
					"isPrimary":false,
					"cssClass": "multitouch",
					"index":"1",
					"toolTip":"toolbar-multitouch"
				},
				"switchApp":
				{
					"isPrimary":false,
					"cssClass": "switchApp",
					"index":"1",
					"toolTip":"toolbar-switchApp"
				},
				"lock":
				{
					"isPrimary":false,
					"cssClass": "lock",
					"index":"6",
					"toolTip":"toolbar-lock"
				},
				"disconnect":
				{
					"isPrimary":false,
					"cssClass": "disconnect",
					"index":"7",
					"toolTip":"toolbar-disconnect"
				},
				"logoff":
				{
					"isPrimary":false,
					"cssClass": "logoff",
					"index":"8",
					"toolTip":"toolbar-logoff"
				},
				"viewLogs":
				{
					"isPrimary":false,
					"cssClass":"viewLogs",
					"index":"9",
					"toolTip":"toolbar-viewLogs",
				},
				"about":
				{
					"isPrimary":false,
					"cssClass": "about",
					"index":"9",
					"toolTip":"toolbar-about"
				},
				"preferences":
				{
					"isPrimary":false,
					"cssClass": "preferences",
					"index":"9",
					"toolTip":"toolbar-preferences"
				},
                "gestureGuide":
				{
					"isPrimary":false,
					"cssClass": "gestureGuide",
					"index":"9",
					"toolTip": "toolbar-gestureGuide"
				}
                
	  }; 
	  
	  var TOOLBAR_TOUCH_CONFIG = {                        
				"clipboard":
				{
					"isPrimary":true,
					"cssClass": "clipboard",
					"index":"1",
					"toolTip":"toolbar-copy"
				},
				"usb":
				{
					"isPrimary":true,
					"cssClass": "usb",
					"index":"2",
					"toolTip":"toolbar-usb"
				},
				"fileUpload":
				{
					"isPrimary":false,
					"cssClass": "fileUpload",
					"index":"3",
					"toolTip":"toolbar-file-upload"
				},
				"fileDownload":
				{
					"isPrimary":false,
					"cssClass": "fileDownload",
					"index":"4",
					"toolTip":"toolbar-file-download"
				},
				"fullscreen":
				{
					"isPrimary":false,
					"cssClass": "fullscreen",
					"index":"5",
					"toolTip":"toolbar-fullscreen"
				},
				"keyboard":
				{
					"isPrimary":true,
					"cssClass": "keyboard",
					"index":"1",
					"toolTip":"toolbar-keyboard"
				},
				"multitouch":
				{
					"isPrimary":true,
					"cssClass": "multitouch",
					"index":"1",
					"toolTip":"toolbar-multitouch"
				},
				"switchApp":
				{
					"isPrimary":true,
					"cssClass": "switchApp",
					"index":"1",
					"toolTip":"toolbar-switchApp"
				},
				"lock":
				{
					"isPrimary":false,
					"cssClass": "lock",
					"index":"6",
					"toolTip":"toolbar-lock"
				},
				"disconnect":
				{
					"isPrimary":false,
					"cssClass": "disconnect",
					"index":"7",
					"toolTip":"toolbar-disconnect"
				},
				"logoff":
				{
					"isPrimary":false,
					"cssClass": "logoff",
					"index":"8",
					"toolTip":"toolbar-logoff"
				},
				"viewLogs":
				{
					"isPrimary":false,
					"cssClass":"viewLogs",
					"index":"9",
					"toolTip":"toolbar-viewLogs",
				},
				"about":
				{
					"isPrimary":false,
					"cssClass": "about",
					"index":"9",
					"toolTip":"toolbar-about"
				},
				"preferences":
				{
					"isPrimary":false,
					"cssClass": "preferences",
					"index":"9",
					"toolTip":"toolbar-preferences"
				},
                "gestureGuide":
				{
					"isPrimary":false,
					"cssClass": "gestureGuide",
					"index":"9",
					"toolTip":"toolbar-gestureGuide"
				}
                
	  };
		function ToolBar() {
			this.toolbarView = new ToolbarView();	
		}
		
		ToolBar.prototype.hide = function(){
			this.toolbarView.hide();
		};
		//Removes the toolbar button. Exposed for custom buttons
		ToolBar.prototype.removeButton = function(id){
			if(registeredToolbarBtns[id]){
				this.toolbarView.removeToolBarEntry(id,registeredToolbarBtns[id]);
			}
		};		
		//Stores the first id of the custom buttons added at the rear end.
		ToolBar.prototype.setRearFirstCustomId = function(btnId){
			this.rearFirstCustomId = btnId;
		};
		//Returns the first id of the custom buttons added at the rear end.
		ToolBar.prototype.getRearFirstCustomId = function(){
			return this.rearFirstCustomId;
		};
		ToolBar.prototype.register = function(buttonData){
			var id = buttonData["id"];
			var config = buttonData["config"];
			var handler = buttonData["handler"];
			
			if(config){
				registeredToolbarBtns[id] = {"clickHandler" : handler, "config" : config};
			}else{
				if(isChromeOS ||!PlatformInfo["isTouchOS"])
				{
					registeredToolbarBtns[id] = {"clickHandler" : handler, "config" : TOOLBAR_CONFIG[id]};
				}
				else
				{
					registeredToolbarBtns[id] = {"clickHandler" : handler, "config" : TOOLBAR_TOUCH_CONFIG[id]};
				}
			}

			if(document.getElementById("toolbarPrimary")===null)
			{
				this.toolbarView.construct();
			}
					
			this.toolbarView.addToolBarEntry(id,registeredToolbarBtns[id]);
					
		};
		
		ToolBar.prototype.load = function(){
		
			var receiverBtn = document.getElementById("CtxReceiver");		 		 
			if(receiverBtn){
				receiverBtn.style.display = "block";
			}
		};
		
		ToolBar.prototype.setPositionOnResize = function(resizeParams){
		
			this.toolbarView.setPositionOnResize(resizeParams);
		};
					

		return ToolBar;
	})();
	
	
	//Toolbar should be initialized only after the reading  menubar field from configuration
	var _toolbar = null;	
	UiControls.createToolBar = function() {
		if(_toolbar == null) {
			_toolbar = new ToolBar();			
		}
		UiControls.Toolbar = _toolbar;
	};	
})(UiControls||(UiControls={}));