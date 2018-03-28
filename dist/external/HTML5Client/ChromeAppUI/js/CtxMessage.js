function CtxMessage(){};
CtxMessage.showErrorDialog = function (message)
{	
	var errorDiv = document.getElementById('inline_error');
	errorDiv.parentNode.style.display = "list-item";
	errorDiv.innerHTML = message;
}

//Shows error message embedded as part of Green bubble background similar to RFWeb error message.
CtxMessage.showEmbeddedError = function (textheader ,message ,bText,isModal,func)
{	
	document.body.style.cursor = "default"; // when error occur cursor become invisible 
	
	if(bText == null)
	{
		bText = chrome.i18n.getMessage("ok_button");
	}
	if(isModal == null)
	{
		isModal = true;
	}	
	var embeddedErrorDialog = document.getElementById("embeddedErrorDialog");
  	embeddedErrorDialog.innerHTML = '<div class="embeddedError">'+message+'</div>';
	embeddedErrorDialog.style.display = "table";	
	
	/*In case the button is hidden during network disruption or any other error while X1 SF is loading, showing the account settings button*/
	showHideAccountSettingsBtn(true); 
}
CtxMessage.hideEmbeddedError = function(){
	var embeddedErrorDialog = document.getElementById("embeddedErrorDialog");
	if(embeddedErrorDialog){
		embeddedErrorDialog.style.display = "none";	
	}
	/*In case the button is hidden during network disruption or any other error while X1 SF is loading, showing the account settings button*/
	showHideAccountSettingsBtn(true);
}
CtxMessage.showUnsecureURL = function ( message1 , message2 , message3 , b1Text , b2Text , isModal , func )
{
	document.body.style.cursor = "default"; // when error occur cursor become invisible 
	
	if( b1Text == null )
	{
		b1Text = chrome.i18n.getMessage("ok_button");
	}
	if( b2Text == null )
	{
		b2Text = chrome.i18n.getMessage("cancel") ;
	}
	if(isModal == null)
	{
		isModal = true;
	}	
	
	var dialogMessage1 = document.getElementById("unsecureURLHeaderMsg");
	var dialogMessage2 = document.getElementById("unsecureURLMsg");
	var dialogbutton1 = document.getElementById("dialog-buttonURL1");
	var dialogbutton2 = document.getElementById("dialog-buttonURL2");
	var dialogCloseBtn = document.getElementById("closeUnsecureURLBoxBtn");
	var dialogBox     = document.getElementById("dialog-boxURL");
	var buttonText1   = document.getElementById	("dialog-button-textURL1");	
	var buttonText2   = document.getElementById	("dialog-button-textURL2");		
	var checkbox = document.getElementById( "checkboxURL" );
	var labelforURL   = document.getElementById	("labelforURL"); 
	dialogbutton1.innerText = b1Text;
	dialogbutton2.innerText = b2Text;
	dialogbutton1.onclick = function(){
	   
	   if( checkbox.checked )
		 {
			UserConfiguration.setUnsecureSFPrompt(true);
		 }
		dialogBox.style.display="none";
		if(dialogBox.isModal !=undefined && dialogBox.isModal == true)
		   dialogBox.overlay.style.visibility = "hidden";
		 if(func != undefined && func != null)
		   func( "ok" );
	   
	};	
	
	
	var closeDialogHandler = function(){
		
		if( checkbox.checked )
		 {
			UserConfiguration.setUnsecureSFPrompt(true);
		 }
		dialogBox.style.display="none";
		if(dialogBox.isModal !=undefined && dialogBox.isModal == true)
		   dialogBox.overlay.style.visibility = "hidden";
		  
		if(func != undefined && func != null)
		   func( "cancel" );
		return ;
	};
	
	dialogbutton2.onclick = closeDialogHandler;
	dialogCloseBtn.onclick = closeDialogHandler;
	
	 dialogMessage1.innerText = message1 ;
	 dialogMessage2.innerText = message2 ;
	 labelforURL.innerText = message3 ;
	 var elements = document.getElementsByTagName("*");
	 var highest_index = 0;
	 for (var i = 0; i < elements.length - 1; i++) {
		if (parseInt(elements[i].style.zIndex) > highest_index) {
			highest_index = parseInt(elements[i].style.zIndex);
		}
	}

	dialogBox.style.zIndex =highest_index +2;
	dialogBox.style.display ="block";
	dialogbutton1.focus(); 
	
	var left = "50%";
	var top = "50%";
	dialogBox.style.left =left;
	dialogBox.style.top =top;
	dialogBox.style.marginTop = -1 * (dialogBox.clientHeight/2) + "px";
	dialogBox.style.marginLeft = -1*(dialogBox.clientWidth/2) + "px";
	if(isModal == true)
	{
		var overlay = document.getElementById("overlayURL");
		overlay.style.visibility="visible";
		overlay.style.zIndex = highest_index+1;
		dialogBox.isModal = true;
		dialogBox.overlay = overlay;
	}
	dialogbutton1.focus(); 
}
CtxMessage.errorTimer = function ()
{
	var dialogBox = document.getElementById("dialog-box"); 
	var left = Math.floor((window.innerWidth - dialogBox.clientWidth)/2);
	var top =  Math.floor((window.innerHeight - dialogBox.clientHeight)/2);
	
	
	if( (left < 0 ) || (top < 0) ) 
	 {
		setTimeout( function() { CtxMessage.errorTimer();},2000);
		
	 }
	 else
	 {
				dialogBox.style.left =left+"px";
				dialogBox.style.top =top+"px";
	 }	 
	 
}
CtxMessage.ShowSpinner = function()
{
	document.getElementById("_inner_box").style.visibility = "hidden";
	var pspinner = document.getElementById("pspinner");
	pspinner.style.visibility ="visible";
	pspinner.isVisible = true;
}

CtxMessage.HideSpinner = function()
{
   var pspinner = document.getElementById("pspinner");
   if (pspinner != undefined && pspinner.isVisible != undefined && pspinner.isVisible == true)
	{
		pspinner.style.visibility = "hidden";
		document.getElementById("_inner_box").style.visibility = "visible";
		if (pspinner.isVisible != undefined) 
		  pspinner.isVisible = false;
   }
}

function OnLoad() {
	// If CR File object is valid, load the trust dialog.
	if (window.crFileObj && Utils.isValid (crFileObj)) {
	
		document.body.style.margin = "0px";
		document.body.style.padding = "0px";
		
		var storeName = "";
		var rfWebUrl = "";
		var gatewayAddress = "";
		
		try {		
			if (Utils.isValid (crFileObj) && Utils.isValid (crFileObj["Services"])) {
				if (Utils.isValid (crFileObj["Services"]["Service"])) {
					
					//Name of the store
					storeName = crFileObj["Services"]["Service"]["Name"];
					if (!storeName) storeName = "Store";
					
					//RfWeb Url
					rfWebUrl = crFileObj["Services"]["Service"]["rfWeb"];
					if (!rfWebUrl) rfWebUrl = "";
					var temp = rfWebUrl.split("/");
					var sfUrl = (temp && temp.length > 2) ? temp[2] : rfWebUrl;
					if (Utils.isNullOrEmpty (sfUrl)) {
						throw new GenericError("No rfWeb entry.");
					}
					
					// Gateway
					if (Utils.isValid (crFileObj["Services"]["Service"]["Gateways"])) {
						gatewayAddress = Utils.getDefaultGateway(crFileObj["Services"]["Service"]["Gateways"]["Gateway"]);
					}
				}
			}
			else {
				throw new GenericError('No Services entry.');
			}
		}
		catch (e) {
			console.log (e);
			Notifications.showInternalError (chrome.i18n.getMessage("error_config_fail_withError",[chrome.i18n.getMessage("citrix_receiver"),crFileObj["fileName"],e.message]));
			
			chrome.app.window.current().hide(); // Hide immediately but close after timeout to show notification.
			setTimeout(function() {
				chrome.app.window.current().close();
				}, Utils.closeWindowTimeOut);
		}
		
		var title = chrome.i18n.getMessage("configure_cra",[chrome.i18n.getMessage("citrix_receiver")]);
		var desc = chrome.i18n.getMessage("add_store",[storeName,sfUrl]);
		
		function shortenUrl(origUrl) {
			var ret = origUrl;
			if (ret.length > 50) {
				ret = ret.substr(0, 49) + " ...";
			}
			return ret;
		}
		
		var details = chrome.i18n.getMessage("storeName",[chrome.i18n.getMessage("store")])+" " + storeName + "<br><br>" +
            		      chrome.i18n.getMessage("storeAddress",[chrome.i18n.getMessage("store")])+" <a href=\"" + rfWebUrl + "\" target=\"_blank\"" + "title=\"" + rfWebUrl + "\">" + shortenUrl(rfWebUrl) +"</a><br><br>" +
            		      chrome.i18n.getMessage("gatewayAddress")+" <a href=\"" + gatewayAddress + "\" target=\"_blank\"" + "title=\"" + gatewayAddress + "\">"+ shortenUrl(gatewayAddress) + "</a><br><br>";
		
		CtxMessage.showTrustSF(title, desc, details, chrome.i18n.getMessage("cancel"), chrome.i18n.getMessage("add"));
	}
}

CtxMessage.showTrustSF = function ( title , desc , details , b1Text , b2Text )
{
	document.body.style.cursor = "default"; // when error occur cursor become invisible 

	var msgTitle = document.getElementById("msg-title-text");
	var msgDesc = document.getElementById("msg-desc");
	var msgDetails  = document.getElementById("msg-details");
	var btnCancel = document.getElementById("msg-cancel");
	var btnAdd = document.getElementById("msg-add");
	var btnClose = document.getElementById("msg-close");
  
	msgTitle.innerText = title;
	msgDesc.innerText = desc;
	msgDetails.innerHTML = details;
	btnCancel.innerText = b1Text;
	btnAdd.innerText = b2Text;
	btnClose.title = "close";
	btnAdd.focus();
	
	var onClose = function(){
		chrome.app.window.current().close();
	};
	
	var onAdd = function(){
		var sfr = sfRecord.createFromCRFile (crFileObj);

		// no prompting as user is trusting the Store.		
		UserConfiguration.setUnsecureSFPrompt(true);

        UserConfiguration.setSFRecord (UserConfiguration.settingsKey, sfr);
        chrome.runtime.getBackgroundPage(function(backgroundPage){
			backgroundPage.postMessage({"cmd":"STORE_CHANGE_BY_CR_NOTIFICATION","crFileName":crFileObj["fileName"]},backgroundPage.location.origin);
			chrome.app.window.current().hide(); // Hide immediately but close after timeout to show notification.
			setTimeout(function() {
				chrome.app.window.current().close();
			}, Utils.closeWindowTimeOut);
		});		
	};
	
	btnCancel.onclick = onClose;
	btnClose.onclick = onClose;
	btnAdd.onclick = onAdd;
	
	window.onkeydown = function(e) {
		if (e.keyCode === 27) { //esc
			onClose();
		}
	}
}
document.addEventListener('DOMContentLoaded', OnLoad, false);