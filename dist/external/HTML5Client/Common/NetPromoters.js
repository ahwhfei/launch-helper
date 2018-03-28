var NetPromoters =(function(){
	var ratingDialog;
	var ratingStarNodes = [];
	var userRating = 0; 
	var maxRating = 5, minRating=0;
	var sendFeedback;
	var closeBtn;
	var rateInStore;		
	var version;//Gets the version no from manifest.
	var appVersion;//Contains only the major and minor version no
	var storageObj = {};
	var laterBtn;		
	var seamlessNotifier;//Needed to show the dialog if running in seamless apps session
	var uiId = "ratingDialog";
	var whiteListedAppIds = ["haiffjcadagjlijoggckpgfnoeiflnem","kdndmepchimlohdcdkokdddpbnniijoa"];				
	var isNPSApplicable = false;
		
	var npsRatingDialog = (function(){
		function createDialog(){
			ratingDialog = document.createElement("div");
			ratingDialog.id = uiId;
			ratingDialog.className = "ratingDialog";

			laterBtn = document.createElement("button");
			laterBtn.className = "rateLaterBtn";
			laterBtn.innerHTML = HTML5Engine.i18n.getMessage("later");
			laterBtn.addEventListener("click",rateLaterBtnHandler);
			ratingDialog.appendChild(laterBtn);
			
			var receiverImg = document.createElement("div");
			receiverImg.className = "ratingReceiverIcon";
			ratingDialog.appendChild(receiverImg);
						
			var title = document.createElement("div");
			title.innerHTML = HTML5Engine.i18n.getMessage("rateReceiver");		
			title.className = "ratingDialogTitle";		
			ratingDialog.appendChild(title);		
			
			var ratingsDiv = document.createElement("div");
			ratingsDiv.className = "ratingsStarDiv";
			
			for(var i=0;i<maxRating;i++){
				var star = document.createElement("div");
				star.className = "ratingStar";
				ratingsDiv.appendChild(star);
				
				var nodeRating = i+1;
				star.addEventListener("mouseover",starMouseOver.bind(null,nodeRating));
				star.addEventListener("mouseout",starMouseOut);
				star.addEventListener("click",ratingsHandler.bind(null,nodeRating));
				
				ratingStarNodes[i] = star;
			}
			ratingDialog.appendChild(ratingsDiv);	
			
			closeBtn = document.createElement("button");
			closeBtn.className = "ratingCloseBtn";
			closeBtn.innerHTML = HTML5Engine.i18n.getMessage("close");
			closeBtn.addEventListener("click",closeDialog);
			ratingDialog.appendChild(closeBtn);
			
			sendFeedback = document.createElement("button");
			sendFeedback.className = "sendFeedbackBtn";
			sendFeedback.innerHTML = HTML5Engine.i18n.getMessage("sendFeedback");
			sendFeedback.addEventListener("click",sendFeedbackHandler);
			ratingDialog.appendChild(sendFeedback);
			
			rateInStore = document.createElement("button");
			rateInStore.className = "rateInStoreBtn";
			rateInStore.innerHTML = HTML5Engine.i18n.getMessage("rateInStore");
			rateInStore.addEventListener("click",rateInStoreHandler);
			ratingDialog.appendChild(rateInStore);
			
			var xtcRoot = document.getElementById("CitrixXtcRoot");
			if(xtcRoot){
				xtcRoot.appendChild(ratingDialog);			
			}else{
				document.body.appendChild(ratingDialog);
			}
		}
		
		function starMouseOver(rating,e){
			e.stopPropagation();
			e.cancelBubble = true;
			 if(e.srcElement){				
				if(userRating > 0){
					styleStarsToYellowOrGrey(rating);
				}else{
					styleStarsToYellowOrGrey(rating);
				}
			}
		}
		function starMouseOut(e){
			e.stopPropagation();
			e.cancelBubble = true;			
			if(e.srcElement){
				if(userRating > 0){
					styleStarsToYellowOrGrey(userRating);
				}else{
					styleStarsToYellowOrGrey(0);
				}										
			} 
		}
		function changeToYellowStar(element){
			element.style.backgroundImage = "url('../ChromeAppUI/resources/images/yellow-star.png')";
		}
		function changeToGreyStar(element){
			element.style.backgroundImage = "url('../ChromeAppUI/resources/images/grey-star.png')";
		}
		
		function ratingsHandler(rating,e){
			userRating = rating;		
			styleStarsToYellowOrGrey(rating);
			closeBtn.style.display = "block";
			laterBtn.style.display = "none";
			
			if(rating > 3){
				rateInStore.style.display = "block";
				sendFeedback.style.display = "none";
			}else{
				sendFeedback.style.display = "block";
				rateInStore.style.display = "none";
			}
			seamlessNotifier.update(uiId); 
			
			//Sets the rating in storage
			readStorage(appVersion,function(r){
				var result = {};
				try{
					result = JSON.parse(r[appVersion]);				
				}catch(e){
				}
				userRating = result["rating"] = rating;
				CEIP.add('nps:rating',rating);
				result = JSON.stringify(result);
				storageObj[appVersion] = result;
				writeToStorage(storageObj);
			});
		}
		function styleStarsToYellowOrGrey(index){
			for(var i=0;i<=index-1;i++){
				changeToYellowStar(ratingStarNodes[i]);
			}
			for(var i=index;i<ratingStarNodes.length;i++){
				changeToGreyStar(ratingStarNodes[i]);
			}
		}
		
		/*Creates and shows the dialog*/
		function showDialog(){									
			setTimeout(function(){
				createDialog();
				if(userRating > 3){
					ratingsHandler(userRating);
				}
				seamlessNotifier.add(uiId); 
			},2000);
		}
		function closeDialog(){
			if(ratingDialog){
				ratingDialog.style.display = "none";
				seamlessNotifier.remove(uiId); 
			}
		}
		
		return {
			showDialog : showDialog,
			closeDialog : closeDialog
		}
	})();
		
	/*Reads the storage*/
	function readStorage(key,callback){
		chrome.storage.sync.get(key,function(result){
			if(callback){
				callback(result);
			}
		});
	}
	
	function writeToStorage(record){
		chrome.storage.sync.set(record,function(){});
	}
	function deleteKeyFromStorage(key){
		chrome.storage.sync.remove(key,function(){});
	}
		
	function init(configObj){			
		
		var netPromotersEnabled = (configObj["HTML5_CONFIG"] && configObj["HTML5_CONFIG"]["ui"] && configObj["HTML5_CONFIG"]["ui"]["netPromoters"])? configObj["HTML5_CONFIG"]["ui"]["netPromoters"] : false;
		isNPSApplicable = configObj["isChromeOS"] && configObj["isChromeApp"] && !configObj["isKiosk"] && netPromotersEnabled && (whiteListedAppIds.indexOf(chrome.runtime.id) !== -1);
	}
	/*Checks if the environment is Chrome receiver running on Chrome OS and not in KIOSK mode or public session and the config is enabled for netPromoters*/
	function isApplicable(cb){			
		if(isNPSApplicable){
			chrome.identity.getProfileUserInfo(function(userInfo){					
				if(!version){
					version = chrome.runtime.getManifest()["version"].split("."); //Gets the version no from manifest.
					appVersion = version[0]+"."+version[1];//Contains only the major and minor version no
				}
				if(userInfo["email"]){					
					cb(true);
				}else{
					cb(false);
				}
			});
		}else{
			cb(false);
		}
	}
		
	/*Increments successful launches or shows the dialog accordingly*/
	function launchSuccess(){
		isApplicable(function(allowed){
			if(!allowed){
				return;
			}
			//Read the current version record from storage
			readStorage(appVersion,function(r){
				var result = {};
				try{
					result = JSON.parse(r[appVersion]);				
				}catch(e){
				}
				//First time initialize the object
				if(Object.keys(result).length === 0){
					result["sLaunches"] = 0;
					result["rating"] = 0;
				}					

				userRating = result["rating"];				
				
				/*Checks if launch counter to be updated in storage 	
				1) If dialog is not shown at all and counter is <5 OR
				2) Dialog is shown once and 1 month is elapsed and counter < 5 if rating is 0 or rating is 5 and not clicked on rate in store button
				*/					
				if(shouldIncrementLaunch(result)){										
					result["sLaunches"] += 1;					
					storageObj[appVersion] =JSON.stringify(result);
					writeToStorage(storageObj);
				}else{
					/*Reads any stored information for last version rated*/
					readStorage("lastReceiverVersion",function(res){
						
						//Stores if current version is the first time user is rating for.
						if(!res["lastReceiverVersion"]){														
							updateLastReceiverVersion();
						}
						
						//If the lastReceiverVersion rated is not same as current app version							
						if(isReceiverUpgraded(res)){
							var lastAppVersion = res["lastReceiverVersion"];
							
							//Reads the rating info of lastReceiverVersion							
							readStorage(lastAppVersion,function(lastVersionRes){
								var lastVerObj = {};
								try{
									lastVerObj =JSON.parse(lastVersionRes[lastAppVersion]);
								}catch(e){									
								}									
								
								//Changing the lastReceiverVersion to appVersion as the rating dialog is now shown
								updateLastReceiverVersion();
								
								//Read last version rating info and apply for the current version
								processAndApplyLastVersionRating(lastVerObj);
								
								//Deleting the last version rating related information
								deleteKeyFromStorage(lastAppVersion);
								
							});
						}else{
							//Checking if dialog needs to be shown for the current version
							userRating = result["rating"];
							result["timeStamp"] = new Date().getTime();

							//If dialog is already shown and userRating is 0 or 5 with rate in store button not clicked
							if(result["dialogShownOnce"]){ 
								if(showDialogAgain(result)){
									npsRatingDialog.showDialog();
								}
							}else{
								result["dialogShownOnce"] = true;
								var newVersionRecord = {};
								newVersionRecord[appVersion] = JSON.stringify(result);
								writeToStorage(newVersionRecord);
								npsRatingDialog.showDialog();
							}
						}
					});
				}
			});	
		});
	}
	
	/*Checks if launch counter to be updated in storage 	
		1) If dialog is not shown at all and counter is <5 OR
		2) Dialog is shown once and 1 month is elapsed and counter < 5 if rating is 0 or rating is 5 and not clicked on rate in store button
	*/
	function shouldIncrementLaunch(result){
		return (result["sLaunches"] < 5 && (!result["dialogShownOnce"] || showDialogAgain(result)));
	}
	/*Checks if the rating is either 0 or 5 and rate in store button not clicked after 1 month since the dialog was shown previous time*/
	function showDialogAgain(input){
		return (userRating == minRating || (userRating == maxRating && input["rateInStoreClicked"] !== true)) && checkIfOneMonthElapsed(input["timeStamp"])
	}
	
	/*Checks for receiver upgrade*/
	function isReceiverUpgraded(result){
		return (result["lastReceiverVersion"] && result["lastReceiverVersion"] !== appVersion);
	}
	/*Stores last receiver version to current version in storage*/
	function updateLastReceiverVersion(){
		writeToStorage({"lastReceiverVersion":appVersion});
	}
	function checkIfOneMonthElapsed(lastShownDate){
		var today= new Date().getTime();
		var diffDays = Math.abs((today - lastShownDate)/(24*60*60*1000));		
		if(diffDays < 30){
			return false;
		}
		return true;
	}
	
	/*Reads the rating info from the last version record and uses some information for the current version*/
	function processAndApplyLastVersionRating(lastVerObj){			
		var lastRating = lastVerObj["rating"];
		var clickedOnRateInStore = lastVerObj["rateInStoreClicked"];
		
		//Creating the new storage record for current app version
		var newAppVersionVal = {};
		newAppVersionVal["dialogShownOnce"] = true;	
		newAppVersionVal["sLaunches"] = 5;//6th successful launch this function is called
		newAppVersionVal["timeStamp"] = new Date().getTime();//Stores the date of the dialog shown
		
		//If user had rated 5 and clicked on rate in store button then don't show the dialog for this version
		if(lastRating ==5 && clickedOnRateInStore === true){	
			newAppVersionVal["rateInStoreClicked"] = clickedOnRateInStore;
			newAppVersionVal["rating"] = lastRating;
			var newVersionRecord={};
			newVersionRecord[appVersion] = JSON.stringify(newAppVersionVal);
			writeToStorage(newVersionRecord);
		}else{				
			//If last given rating is 4 or 5 then show the dialog with preselected rating
			if(lastRating > 3){
				//ratingsHandler(lastRating);
				userRating = newAppVersionVal["rating"] = lastRating;
			}else{
				userRating = newAppVersionVal["rating"] = minRating;
			}
			var newVersionRecord = {};
			newVersionRecord[appVersion] = JSON.stringify(newAppVersionVal);
			writeToStorage(newVersionRecord);
			npsRatingDialog.showDialog();
		}
	}
	/*Reset the successful launch to 0 on any errors during launch or after launch */
	function onError(){			
		isApplicable(function(allowed){
			if(!allowed){
				return;
			}
			readStorage(appVersion,function(r){
				var result = {};
				try{
					result = JSON.parse(r[appVersion]);				
				}catch(e){
				}		
				//First time initialize the object
				if(Object.keys(result).length === 0){
					result["sLaunches"] = 0;
					result["rating"] = 0;
				}					
				
				//Reset only when rating is not given.
				if(result && (result["rating"] ===minRating || (result["rating"] === maxRating && result["rateInStoreClicked"] !== true))){
					if(result["sLaunches"]){
						result["sLaunches"] = 0;									
					}								
					result = JSON.stringify(result); 
					storageObj[appVersion] = result;
					writeToStorage(storageObj);
					npsRatingDialog.closeDialog();						
				}
			});	
		});
	}		
	
	function rateLaterBtnHandler(){
		readStorage(appVersion,function(r){
			var result = {};
			try{
				result = JSON.parse(r[appVersion]);				
			}catch(e){
			}
			result["rating"] = 0;
			result["dialogShownOnce"] = true;
			result["timeStamp"] = new Date().getTime();//Stores the date of the dialog shown
			result = JSON.stringify(result); 
			storageObj[appVersion] =result;
			writeToStorage(storageObj);
			npsRatingDialog.closeDialog();
		});
	}
	function sendFeedbackHandler(e){
		
		var subject = encodeURIComponent("Feedback to improve Citrix Receiver");
		var emailBody = encodeURIComponent("My issue is :\r\n\r\n \r\n\r\nMy Rating : "+ userRating +"\r\n\r\nAbout my device : \r\n\r\n\tDevice model : <model of the ChromeBook> \r\n\r\n\r\n\tCitrix Receiver version : "+ chrome.runtime.getManifest()["version"] +"\r\n\tUseragent : "+navigator.userAgent);
		var url ="mailto:chrome@citrix.com?Subject="+subject+"&Body="+emailBody;
		window.open(url,"_blank");
		npsRatingDialog.closeDialog();
	}
	
	function rateInStoreHandler(e){
		var url ="https://chrome.google.com/webstore/detail/citrix-receiver/haiffjcadagjlijoggckpgfnoeiflnem/reviews";
		window.open(url,"_blank");
		readStorage(appVersion,function(r){
			var result = {};
			try{
				result = JSON.parse(r[appVersion]);				
			}catch(e){
			}
			result["rateInStoreClicked"] = true;
			result = JSON.stringify(result); 
			storageObj[appVersion] =result;
			writeToStorage(storageObj);
			npsRatingDialog.closeDialog();
		});
	}				
	
	function setSeamlessNotifier(seamlessNotifier1){
		seamlessNotifier = seamlessNotifier1;
	}				
	
	return {
		init : init,
		launchSuccess : launchSuccess,
		onError : onError,
		setSeamlessNotifier : setSeamlessNotifier
	};
})();