var wrURL = null;
var g_sfr = null;
var showPrefsPage = false;
var googlePolicySet = false;
var inputUrl;

function LoadURL() {
	/*BUG0623810 : Web fonts not loading properly due to caching optimisation in Chrome app. So few strings are showing empty. 
	Applying font-family through inline styling will force chrome app to load the fonts */
	document.body.style.fontFamily = "citrixsans,Helvetica Neue,Helvetica,Arial,Sans Serif";
  
	chrome.system.display['getInfo'](function(displayInfo){
	  var isUnifiedMode = window.parent.g.Utils.getUnifiedDisplayBounds(displayInfo).isUnifiedMode;
		if(window.parent && isUnifiedMode){
        	for(var i=0;i<displayInfo.length;i++){
				if(displayInfo[i]['isPrimary'] === true){
				  var parentDiv =  window.parent.document.getElementById('parent');
				  if(parentDiv){
				    parentDiv.style.maxWidth = displayInfo[i].bounds.width+ 'px';
					  parentDiv.style.maxHeight = displayInfo[i].bounds.height + 'px';
				  }
					break;
				}				
        	}
    	}
	
        inputUrl = document.getElementById("URL");
    	inputUrl.focus ();
        inputUrl.value = '';
    	inputUrl.placeholder = chrome.i18n.getMessage("urlPlaceholder");
    	inputUrl.setAttribute("title",chrome.i18n.getMessage("urlPlaceholder"));
    
    	// Get latest information from DB
    	UserConfiguration.getSFRecord (UserConfiguration.settingsKey, function (sfr) {
    		g_sfr = sfr;
    		//console.log(g_sfr[UserConfiguration.defSfrKey]);
    		if (Utils.isValid (g_sfr) && Utils.isValid (g_sfr[UserConfiguration.defSfrKey]["rf_web"]['url'])) {
    			if(g_sfr[UserConfiguration.defSfrKey]["configure_type"] === UserConfiguration.types.GOOGLEPOLICY){
    				googlePolicySet = true;
    			}
    			var rfWeb = inputUrl.value = g_sfr[UserConfiguration.defSfrKey]["rf_web"]['url'];
    			var isSecure = (-1 !== rfWeb.search (/^https:\/\//gi)) ? true : false;
    			SubmitURL (isSecure);
    		}
    		else{
    			//First time the application is launched we need to show the preferences page.
    			showPrefsPage = true;
    			UserConfiguration.setUnsecureSFPrompt(false);
    			window.parent.showPreferencesPage(showPrefsPage);
    		}
    	});
  });
}

function urlCheck(url) {
    if (!Utils.isNullOrEmpty (url))
    {
		if(!googlePolicySet){
			storeInformation (url);
		}
		CtxMessage.HideSpinner();
		showPrefsPage = false;
		window.parent.showMainPage();
    }
}

function alltrim(str) {
    return str.replace(/^\s+|\s+$/g, '');
}

function storeInformation (rfWeb) {
    if (!Utils.isValid (g_sfr)) {
        // No StoreFront record exists. Create new record.
        g_sfr = sfRecord.createFromRFWeb (rfWeb);
    }
    else {
        if (g_sfr[UserConfiguration.defSfrKey]["rf_web"]['url'] !== rfWeb) {
            // This is a new StoreFront URL. Replace with a new record.
            g_sfr = sfRecord.createFromRFWeb (rfWeb);
        }
    }
    UserConfiguration.setSFRecord (UserConfiguration.settingsKey, g_sfr);
}

function SubmitURL(is_unsecure_url_ok) {
    var msg = null;

    try
    {
        CtxMessage.ShowSpinner();
        wrURL = inputUrl.value;
        if (wrURL != null && wrURL != "") {
            var v = new RegExp();
            var errorStr = null;
			v.compile("^((http)(s?))://.*","i");
			
			var result = inputUrl.checkValidity();
			if(!v.test(wrURL) || !result){
				showPrefsPage = true;
                errorStr = chrome.i18n.getMessage("error_incorrect_url");
                msg = errorStr;
			}else {
                if (wrURL.search(/^https/i) == -1) {
					UserConfiguration.getUnsecureSFPrompt(function(checked) {
                        if (checked === "true" || checked === true || (is_unsecure_url_ok == true)) {
                            msg = urlCheck(wrURL);
                        } else {							
							window.parent.showPreferencesPage(true);
                            CtxMessage.HideSpinner();
                            var message1 = chrome.i18n.getMessage("connect_confirm");
                            var message3 =  chrome.i18n.getMessage("secureMsg_preference");
                            var temp = wrURL.split("/");
                            var message2 =chrome.i18n.getMessage("connect_URL_secure_msg",[temp[2]]);
                            CtxMessage.showUnsecureURL(message1, message2, message3, null, null, null, 
													function(status){ 
														if(status === "ok"){
															SubmitURL(true)
														}
														else if(status === "cancel"){
														//Keyup event is generated on URL element on giving focus.To skip that time out has been used.
															setTimeout(function(){
																if(inputUrl){
																	inputUrl.focus(); 
																}
															},500)
														}
													});
                        }
                    });
                    return; // callback executes urlcheck
                }
                else {
                    msg = urlCheck(wrURL);
                }
            }
        } else {
			showPrefsPage = true;
            msg = chrome.i18n.getMessage("error_invalid_url");
        }
    }
    catch (ex)
    {
        console.log(ex.message);
        msg = chrome.i18n.getMessage("error_incorrect_url");
    }
    if (msg !== null && msg !== undefined)
    {
		showPrefsPage = true;
        CtxMessage.HideSpinner();
        CtxMessage.showErrorDialog(msg);
        inputUrl.focus();
		//To adjust the dynamic height of the url pane
		var urlPane = document.getElementById('_enter_url_pane');
		urlPane.style.height = (document.getElementById('inlineErrorContainer').clientHeight + 250) + "px";
		urlPane.style.marginTop = (-1) * urlPane.clientHeight/2 + "px";
    }
	//If any error or exception, preferences window will be shown.
	if(showPrefsPage)
	{		
		window.parent.showPreferencesPage(true);
	}
}

function HandleKeyUp() {
    if (event.which == 13 && event.target.className == "") {
        SubmitURL(false);
    }
}
document.getElementById("enterurllabelid").innerHTML=chrome.i18n.getMessage("account_url");
document.getElementById("connectUrl").innerHTML=chrome.i18n.getMessage("connect_button");
document.body.style.margin = "0px";
document.addEventListener('DOMContentLoaded', LoadURL, false);
document.getElementById("URL").addEventListener("keyup", HandleKeyUp);
document.getElementById("connectUrl").addEventListener("click", SubmitURL);
document.getElementById("connectUrl").addEventListener("keyup", HandleKeyUp);
