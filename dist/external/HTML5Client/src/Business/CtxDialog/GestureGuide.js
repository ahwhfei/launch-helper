var UiControls;
(function(UiControls){
    var xtcRoot;
    
    //Gesture guide dialog module
	var gestureGuideDialog = (function(){
        var gestureGuideContainer;

		//Creates the dialog
		function create(){
            
            // gesture guide container
            gestureGuideContainer = document.createElement("div");
			gestureGuideContainer.id = "gestureGuideDialog";
			gestureGuideContainer.className = "gestureGuideDialog";
			xtcRoot = document.getElementById("CitrixXtcRoot");		
			if(xtcRoot){
				xtcRoot.appendChild(gestureGuideContainer);
			}
            
            // gesture guide title
            var gestureGuideTitle = document.createElement("div");
            gestureGuideTitle.textContent = HTML5Engine.i18n.getMessage("gestureGuideTitle");
            gestureGuideTitle.className = "gestureGuideTitle";
			gestureGuideContainer.appendChild(gestureGuideTitle);
            
            //Scroll element
            var scrollElement = document.createElement("div");
            scrollElement.className = "gestureGuideElement";
			gestureGuideContainer.appendChild(scrollElement);
            
            
            var scrollText = document.createElement("div");
            scrollText.className = "gestureGuideMainText";
			scrollElement.appendChild(scrollText);
            
            var scrollboldText =  "<span class='gestureGuideBoldText'>"+ HTML5Engine.i18n.getMessage("scroll") +"</span>";     
            var option = {"scroll" : scrollboldText};
            scrollText.innerHTML = HTML5Engine.i18n.getMessage("scrollText",option);
            
            var scrollIcon = document.createElement("span");
			scrollElement.appendChild(scrollIcon);
			scrollIcon.className = "scrollIcon";
            
            //finger pointer element
            var fingerPointerElement = document.createElement("div");
            fingerPointerElement.className = "gestureGuideElement";
			gestureGuideContainer.appendChild(fingerPointerElement);
            
            var fingerPointerText = document.createElement("div");
            fingerPointerText.className = "gestureGuideMainText";
			fingerPointerElement.appendChild(fingerPointerText);
            
 
            var fingerPointerBoldText =  "<span class='gestureGuideBoldText'>"+  HTML5Engine.i18n.getMessage("fingerPointer") +"</span>";     
            option = {"fingerpointer" : fingerPointerBoldText};
            fingerPointerText.innerHTML = HTML5Engine.i18n.getMessage("fingerPointerText",option);
            
             var fingerPointerIcon = document.createElement("span");
			fingerPointerElement.appendChild(fingerPointerIcon);
			fingerPointerIcon.className = "fingerPointerIcon";
            
            //keyboard element
            var keyboardElement = document.createElement("div");
            keyboardElement.className = "gestureGuideElement borderBottom";
			gestureGuideContainer.appendChild(keyboardElement);
            
            var keyboardText = document.createElement("div");
            keyboardText.className = "gestureGuideMainText";
			keyboardElement.appendChild(keyboardText);
            
            var keyboardBoldText =  "<span class='gestureGuideBoldText'>"+  HTML5Engine.i18n.getMessage("keyboard") +"</span>";     
            option = {"keyboard" : keyboardBoldText};
            keyboardText.innerHTML = HTML5Engine.i18n.getMessage("keyboardText",option);

            var keyboardIcon = document.createElement("span");
			keyboardElement.appendChild(keyboardIcon);
			keyboardIcon.className = "keyboardIcon";
            
            var gesturGuideOkBtn = document.createElement("div");
			gesturGuideOkBtn.textContent = HTML5Engine.i18n.getMessage("gesturGuideOk");
			gesturGuideOkBtn.id = 'gesturGuideOkBtn';
			gesturGuideOkBtn.className = "gesturGuideOkBtn";
            gestureGuideContainer.appendChild(gesturGuideOkBtn);
            gesturGuideOkBtn.addEventListener("click",hide)	;
		}
        
		function show(){
			CEIP.incrementCounter("toolbar:buttons:gestureGuide");
            gestureGuideContainer.style.display = "block";
		}
		
		function hide(){
            gestureGuideContainer.style.display = "none";
		}
		
		return {
			create : create,
			show : show,
			hide : hide,
		};
	})();
    UiControls.gestureGuide = gestureGuideDialog;
} )(UiControls||(UiControls={}));