var UiControls;
(function(UiControls){
	var preferencesDialog;
	var xtcRoot;
	
	//Display resolution dialog module
	var displayResolutionDialog = (function(){
		var dpContainer;		
		var displayResolutionConfig; 		
		var previousSelectedRes = null;
		var fitToWindow;
		var useDpr;
		
		//Creates the dialog
		function create(){			
			fitToWindow = UiControls.ResolutionUtility.constants.fitToWindow;
			useDpr = UiControls.ResolutionUtility.constants.useDpr;
			
			displayResolutionConfig = UiControls.ResolutionUtility.get( UiControls.ResolutionUtility.constants.resolutionConfig  , null);
			dpContainer = document.createElement("div");
			dpContainer.id = "displayResolutionDialog";
			dpContainer.className = "displayResolutionDialog borderClass";
			xtcRoot = document.getElementById("CitrixXtcRoot");		
			if(xtcRoot){
				xtcRoot.appendChild(dpContainer);
			}
			
			var closeButton = document.createElement("span");
			dpContainer.appendChild(closeButton);
			closeButton.className = "closeBtn";
			closeButton.addEventListener("click",hide); 			
			
			var displayResolutionTitle = document.createElement("div");
			displayResolutionTitle.textContent = HTML5Engine.i18n.getMessage("resolution");
			displayResolutionTitle.setAttribute("class","displayResolutionTitle");
			dpContainer.appendChild(displayResolutionTitle);
						
			var resolutionValues = displayResolutionConfig["values"];
			for(var i=0;i<resolutionValues.length;i++){				
				createEntry(resolutionValues[i]);
			}
			
			//Selecting the default value
			var defaultOption = document.getElementById("radio_" + displayResolutionConfig["default"]);
			if(defaultOption){
				resolutionRadioHandler(displayResolutionConfig["default"], defaultOption,null);
			}
			
			UiControls.ResolutionUtility.registerCallback(UiControls.ResolutionUtility.constants.setting_based_resolution ,updateResolutionInUI);
			UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.setting_based_resolution ,updateResolutionInUI);
		}
		
		function show(){
			dpContainer.style.display = "block";
			sessionPreferences.hide();
		}
		
		function hide(){
			dpContainer.style.display = "none";
		}
		
		//Creates resolution entry
		function createEntry(resolutionValue){
			
			//parent div
			var displayResolutionEntry = document.createElement('div');
			displayResolutionEntry.id = resolutionValue;
			displayResolutionEntry.setAttribute('class', 'displayResolutionEntry');

			//actual radio button
			var radioButtonElement = document.createElement('input');
			radioButtonElement.setAttribute('type', 'radio');
			radioButtonElement.setAttribute('class', 'displayResolutionRadio');
			radioButtonElement.id = "radio_"+resolutionValue;
			radioButtonElement.name = "displayResolutionRadio";
			radioButtonElement.addEventListener("change",resolutionRadioHandler.bind(null,resolutionValue,radioButtonElement));//add click handler

			//custom radio button div
			var customRadioButtonElement =  document.createElement('div');
			customRadioButtonElement.setAttribute('class', 'dpRadioOuterCircle');
			customRadioButtonElement.addEventListener('click',resolutionRadioHandler.bind(null,resolutionValue,radioButtonElement));//handler to be added

			//custom radio button inner div
			var customRadioInnerCircle = document.createElement('div');
			customRadioInnerCircle.setAttribute('class', 'dpRadioInnerCircle');
			customRadioInnerCircle.id = "radioInner_"+resolutionValue;

			//label for radio button
			var label = document.createElement('label');
			label.setAttribute('for', radioButtonElement.id);
			label.setAttribute('class', 'dpFixedRadiolabel');			

			customRadioButtonElement.appendChild(customRadioInnerCircle);
			
			displayResolutionEntry.appendChild(radioButtonElement);
			displayResolutionEntry.appendChild(customRadioButtonElement);
			displayResolutionEntry.appendChild(label);
			
			//Adding the div to show pixels for fit to window and device pixel ratio options
			if(resolutionValue === fitToWindow || resolutionValue === useDpr){				
				label.textContent = HTML5Engine.i18n.getMessage(resolutionValue);
				var dpResolutionValue = document.createElement("div");
				dpResolutionValue.id = "dpResolutionValue_"+resolutionValue;
				dpResolutionValue.textContent = "";
				dpResolutionValue.setAttribute("class","dpResolutionValue");
				displayResolutionEntry.appendChild(dpResolutionValue);
				label.setAttribute('class', 'dpChangingRadiolabel');				
			}else{
				//Parsing the fixed resolution value and updating the textcontent to the localized value.
				var resolution = resolutionValue.split("x");
				if(resolution){
					var options = {"width" :parseInt(resolution[0])  ,"height" : parseInt(resolution[1])};				
					label.textContent = HTML5Engine.i18n.getMessage("resolutionVal", options);
				}
			}							
			dpContainer.appendChild(displayResolutionEntry);
		}
		
		//Radio button handler to change the resolution settings
		function resolutionRadioHandler(resolutionValue,radioButtonElement,evt){						
			var curElement = null;
			if(radioButtonElement){
				radioButtonElement.checked = true;
				curElement = radioButtonElement;
			}
			//Checks if the same radio button is clicked
			if(previousSelectedRes == resolutionValue){
				return;
			}
			
			//Updates the custom radio button divs
			if(curElement.checked){
				var innerCircle = document.getElementById("radioInner_"+resolutionValue);
				if(innerCircle)				{
					innerCircle.style.display = "block";
				}
				if(previousSelectedRes == null){
					previousSelectedRes = resolutionValue;
				}else{
					var previousOption = document.getElementById("radioInner_"+previousSelectedRes);
					if(previousOption){
						previousOption.style.display = "none";
					}
					previousSelectedRes = resolutionValue;
				}
			}
			//Calls the resolution settings handler to resize the session
			UiControls.ResolutionUtility.set(UiControls.ResolutionUtility.constants.setting_based_resolution ,resolutionValue);			
		}

		//Updates the div with the resolution for auto fit screen and use device pixel ratio
		function updateResolutionInUI(resolutionObj){
		
			var fitToWindowResolutionDiv = document.getElementById("dpResolutionValue_"+fitToWindow);
			if(fitToWindowResolutionDiv){
				var options = {"width" : resolutionObj[fitToWindow]["width"] ,"height" : resolutionObj[fitToWindow]["height"]};
				fitToWindowResolutionDiv.textContent = HTML5Engine.i18n.getMessage("resolutionVal", options); 
			}
			
			var useDprResolutionDiv = document.getElementById("dpResolutionValue_"+useDpr);
			if(useDprResolutionDiv){
				var options = {"width" : resolutionObj[useDpr]["width"] ,"height" : resolutionObj[useDpr]["height"]};				
				useDprResolutionDiv.textContent = HTML5Engine.i18n.getMessage("resolutionVal", options);
			}
		}
		
		return {
			create : create,
			show : show,
			hide : hide
		};
	})();
		
	//Preferences dialog module	
	var sessionPreferences = (function(){		
		var prefsContainer;
        var showAutoKbdCheckBox;
		var ceipCheckBox;
	    var mobileReceiverView_obj = null;
		var disableCEIPCb = false;
		
		//Creates the dialog
		function create(){
			prefsContainer = document.createElement("div");
			prefsContainer.id = "preferencesDialog";
			prefsContainer.className = "preferencesDialog";
			
			xtcRoot = document.getElementById("CitrixXtcRoot");
			if(xtcRoot){
				xtcRoot.appendChild(prefsContainer);
			}
			
			var innerContainer;			
			innerContainer = document.createElement("div");
			innerContainer.className = "prefsInnerContainer borderClass";
			if(g.environment.receiver.isChromeApp){
				innerContainer.className += " chromePrefsInnerContainer";
			}
			prefsContainer.appendChild(innerContainer);
			
			var title = document.createElement("div");
			title.className = "preferencesDialogHeader"
			title.textContent = HTML5Engine.i18n.getMessage("preferences");
			innerContainer.appendChild(title);
			
			var closeButton = document.createElement("span");
			innerContainer.appendChild(closeButton);
			closeButton.className = "closeBtn";
			closeButton.addEventListener("click",hide); 
			
			var autoKbdCheckBoxContainer = document.createElement("div");
			autoKbdCheckBoxContainer.id = "autoKbdCheckBoxContainer";
			autoKbdCheckBoxContainer.className = "autoKbdCheckBoxContainer";
			
			showAutoKbdCheckBox = document.createElement('input');
			showAutoKbdCheckBox.type = "checkbox";
			showAutoKbdCheckBox.name = "showAutoKbdCheckBox";
			showAutoKbdCheckBox.value = "value";
			showAutoKbdCheckBox.id = "showAutoKbdCheckBox";
			showAutoKbdCheckBox.className = "preferenceDialogCheckBox";			

			var showAutoKbdCheckBoxLabel = document.createElement('label')
			showAutoKbdCheckBoxLabel.setAttribute("for","showAutoKbdCheckBox");
			showAutoKbdCheckBoxLabel.className = "preferenceDialogCheckBoxLabel";
			showAutoKbdCheckBoxLabel.textContent = HTML5Engine.i18n.getMessage("showAutoKbdCheckBoxLabel");

			// disable autokbdcheckbox on non-touch os
            if(!g.environment.os.isTouch || isChromeOS) {
                showAutoKbdCheckBox.disabled = true;
				showAutoKbdCheckBoxLabel.style.opacity = "0.5";
            }
            else
            {
                showAutoKbdCheckBox.checked = true;
            }
            showAutoKbdCheckBox.addEventListener("click",autoPopupKbdBtnCheckBoxHandler);
						
			autoKbdCheckBoxContainer.appendChild(showAutoKbdCheckBox);
			autoKbdCheckBoxContainer.appendChild(showAutoKbdCheckBoxLabel);

			
			//CEIP dialog
			innerContainer.appendChild(autoKbdCheckBoxContainer);
			if(!g.environment.receiver.isChromeApp){
				var ceipCheckBoxContainer = document.createElement("div");
				ceipCheckBoxContainer.className = "ceipCheckBoxContainer";
				
				ceipCheckBox = document.createElement('input');
				ceipCheckBox.type = "checkbox";
				ceipCheckBox.name = "ceipCheckBox";
				ceipCheckBox.value = "value";
				ceipCheckBox.id = "ceipCheckBox";
				ceipCheckBox.className = "preferenceDialogCheckBox";
				
				ceipCheckBox.addEventListener("click",ceipCheckBoxHandler);
				
				var ceipCheckBoxLabel = document.createElement('label')
				ceipCheckBoxLabel.setAttribute("for","ceipCheckBox");
				ceipCheckBoxLabel.className = "preferenceDialogCheckBoxLabel";
				ceipCheckBoxLabel.textContent = HTML5Engine.i18n.getMessage("ceipCheckBoxLabel");
				
				var checked = true;
				if (HTML5_CONFIG && HTML5_CONFIG['ceip'] && typeof HTML5_CONFIG['ceip']['enabled'] != 'undefined') {
					checked = HTML5_CONFIG['ceip']['enabled'];
				}
				if(disableCEIPCb){
					ceipCheckBox.disabled = true;
					ceipCheckBox.checked = false;
					ceipCheckBoxLabel.style.opacity = "0.5";
				}else{
					ceipCheckBox.checked = checked;
				}
				
				ceipCheckBoxContainer.appendChild(ceipCheckBox);
				ceipCheckBoxContainer.appendChild(ceipCheckBoxLabel);
				innerContainer.appendChild(ceipCheckBoxContainer);
			}				
			var displayResolutionBtn = document.createElement("button");
			displayResolutionBtn.textContent = HTML5Engine.i18n.getMessage("displayResolution");
			displayResolutionBtn.id = 'displayResolutionBtn';
			displayResolutionBtn.className = "displayResolutionBtn";
			
			displayResolutionDialog.create();
			
			displayResolutionBtn.addEventListener("click",displayResolutionDialog.show)	;
			
			innerContainer.appendChild(displayResolutionBtn);
			
			UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation,onDisplayChange);
			UiControls.ResolutionUtility.registerCallback(UiControls.ResolutionUtility.constants.displayInformation,onDisplayChange);
			return prefsContainer;
		}
        function setAutoKbdCheckBoxDefaulltSetting(showAutoPopupKbdButton1){   
			if(showAutoKbdCheckBox){		
				showAutoKbdCheckBox.checked = (showAutoPopupKbdButton1 === "true")? true : false;           
			}
        }
		
        function autoPopupKbdBtnCheckBoxHandler(){
            if(mobileReceiverView_obj == null){
                var bb = GetBrowserBox();
                mobileReceiverView_obj = bb.getMobileReceiverView();
            }
            if(showAutoKbdCheckBox.checked){
                mobileReceiverView_obj.setShowAutoPopupKbdButton(true);
				//Remember this setting and store it in local storage
                HTML5Engine.localStorage.setItem("showAutoPopupKbdButton",true);
            }
            else{
                mobileReceiverView_obj.setShowAutoPopupKbdButton(false);
				//Remember this setting and store it in local storage
                HTML5Engine.localStorage.setItem("showAutoPopupKbdButton",false);
            }
        }
		
		function ceipCheckBoxHandler(){
            if(ceipCheckBox.checked){
                HTML5Engine.localStorage.setItem("ceipEnabled",true);
            }
            else{
                HTML5Engine.localStorage.setItem("ceipEnabled",false);
            }
        }
		
        function getAutoKbdCheckBoxDefaulltSetting()
        {
			/*showAutoKbdCheckBox is undefined when toolbar/preferences option is hidden through configuration. If undefined then checks for ChromeOS to show/hide auto keyboard popup button*/
            return (typeof showAutoKbdCheckBox !== "undefined")?showAutoKbdCheckBox.checked:(isChromeOS?false:true);
        }
		
		function show(){
			CEIP.incrementCounter("toolbar:buttons:preferences");
			prefsContainer.style.display = "block";
		}
		
		function hide(){
			prefsContainer.style.display = "none";
		}
		
		function showDisplayResButton(){
		  if(document.getElementById('displayResolutionBtn')){
		    document.getElementById('displayResolutionBtn').disabled = false;
		  }
		}
		
		function hideDisplayResButton(){
		  if(document.getElementById('displayResolutionBtn')){
		    document.getElementById('displayResolutionBtn').disabled = true;
		  }
		  if(document.getElementById('displayResolutionDialog')){
		      document.getElementById('displayResolutionDialog').style.display = "none";
		  }
		}
		
		function onDisplayChange(data){
		  if(data.multimonitor){
		    hideDisplayResButton();
		  }else{
		    showDisplayResButton();
		  }
		}
		
		function setCEIPCbDisable(){
			disableCEIPCb = true;
		}
		
		return {
			create : create,
			show : show,
			hide : hide,
            setAutoKbdCheckBoxDefaulltSetting : setAutoKbdCheckBoxDefaulltSetting,
            getAutoKbdCheckBoxDefaulltSetting : getAutoKbdCheckBoxDefaulltSetting,
			setCEIPCbDisable : setCEIPCbDisable
		}
	})();
	
	UiControls.sessionPreferences = sessionPreferences;
	UiControls.displayResolution = displayResolutionDialog;
	
})(UiControls||(UiControls={}));