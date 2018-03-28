var g_sfr = null;

/* Create account settings button when preference page is shown */
function createAccountSettingsPage(){

	// Get latest information from DB
	UserConfiguration.getSFRecord (UserConfiguration.settingsKey, function (sfr) {
		g_sfr = sfr;
		if(g_sfr[UserConfiguration.defSfrKey]["configure_type"] === UserConfiguration.types.GOOGLEPOLICY || window.isKioskMode){
			document.getElementById ('storefront-settings-value').readOnly = true;
			document.getElementById ('storefront-settings-value-apply-button').style.display= "none";
		}else{
			document.getElementById ('storefront-settings-value').readOnly = false;
			document.getElementById ('storefront-settings-value-apply-button').style.display= "inherit";
		}
		if (Utils.isValid (sfr)) {
			document.getElementById ('storefront-settings-value').value = sfr[UserConfiguration.defSfrKey]["rf_web"]['url'];
		}
	});
	
	// Load the log page.
	var logger = document.createElement("iframe");
	logger.className = "settings-log"; 
	logger.src = "/src/viewLog.html";
	document.getElementById("settings").appendChild(logger);
	
	var thirdPartyLicensesLink = document.getElementById("thirdPartyLicensesLink");
	thirdPartyLicensesLink.innerHTML = chrome.i18n.getMessage("thirdPartyLicenses");
	
	if(window.isKioskMode){
		/*load the template in case of Kiosk mode*/
		var templateLicenses = document.getElementById('templateLicenses');
		var templateInstance = document.importNode(templateLicenses.content, true);
		
		var divContainer = templateInstance.getElementById('KioskLicenses');
		
		var closeLicensesBtn = templateInstance.getElementById('closeLicensesBtn');
		
		divContainer.style.display = "none";
		document.getElementById("parent").appendChild(divContainer);
		var thirdPartyLicenses = document.getElementById("thirdPartyLicenses");
		var thirdPartyLicensesDoc = (thirdPartyLicenses.contentDocument || thirdPartyLicenses.contentWindow.document);
		if(thirdPartyLicensesDoc){
			thirdPartyLicensesDoc.getElementsByTagName('html')[0].style.overflow = "scroll";
		}
	
		closeLicensesBtn.onclick = function(e){
			divContainer.style.display = "none";
		};
		thirdPartyLicensesLink.onclick = function(e){
			divContainer.style.display = "block";		
		};
	}else{
		var sendFeedback = document.getElementById("sendFeedback");		
		sendFeedback.innerHTML = chrome.i18n.getMessage("sendFeedback");		
		sendFeedback.onclick= sendFeedbackHandler;
		
		thirdPartyLicensesLink.onclick = function(e){
			UserConfiguration.getPrimaryMonitorDisplayInfo(function(bounds){    
				var pageURL = '/ChromeAppUI/ReceiverThirdPartyNotices.html';
				var options = { 
					'id': 'licenses',
					'minWidth': 800,
					'minHeight': 600,
					'state': 'maximized'				
				};
				if(bounds){
					options["outerBounds"]  = bounds;
					options["state"] = "normal";
				}
				chrome.app.window.create (pageURL, options);
			});
		};
		
	}
	
}
function sendFeedbackHandler(e){
	var subject = encodeURIComponent("Feedback to improve Citrix Receiver");
	var emailBody = encodeURIComponent("My issue is :\r\n\r\n \r\n\r\n About my device : \r\n\r\nDevice model : <model of the ChromeBook> \r\n\r\n\r\nCitrix Receiver version : "+ chrome.runtime.getManifest()["version"] +"\r\nUseragent : "+navigator.userAgent+"\r\n ");
	var url ="mailto:chrome@citrix.com?Subject="+subject+"&Body="+emailBody;
	window.open(url,"_blank");
}

/* Apply button handler */
function OnApply () {
    var newRfWeb = document.getElementById ('storefront-settings-value').value;
    if (Utils.isValid (g_sfr)) {
		if (newRfWeb != g_sfr[UserConfiguration.defSfrKey]["rf_web"]['url']) {
			g_sfr = sfRecord.createFromRFWeb (newRfWeb);
			UserConfiguration.setSFRecord (UserConfiguration.settingsKey, g_sfr);
			
			// inform user that changes apply on restart. Notification created in background.js so that on closing of all the windows, restart now would work.
			chrome.runtime.getBackgroundPage(function(backgroundPage){
				
				backgroundPage.postMessage({"cmd":"STORE_CHANGE_NOTIFICATION"},backgroundPage.location.origin);
				
				// Need smarts to check if the new connection is https or not and change the flag.
				var isSecure = (-1 !== newRfWeb.search (/^https:\/\//i)) ? true : false;
				UserConfiguration.setUnsecureSFPrompt(isSecure);
			});		
        }
    }
}
document.getElementById ('storefront-settings-value-apply-button').addEventListener ('click', OnApply);

/* Close button handler */
function OnClose() {
    document.getElementById ("settingsPageBackground").style.display = 'none';
}
var acctSettingsCloseBtn = document.getElementById ('settingsCloseButton');
acctSettingsCloseBtn.addEventListener ('click', OnClose,false);
//To enable close from keyboard
acctSettingsCloseBtn.addEventListener ('keydown', function(e){
	if (e.which == 13) {
		OnClose();
	}
},false);
