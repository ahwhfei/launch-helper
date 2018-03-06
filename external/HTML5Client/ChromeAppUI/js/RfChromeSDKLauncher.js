var sessionObjs = [];
var senderAppId;

window.addEventListener("message", sessionEventsHandler, false);
var dependency = (dependency || {}); 
//Listens to the events posted by the session
function sessionEventsHandler(evt) {
	console.log(evt);
	if (evt.origin === window.location.origin && evt.data) {
		senderAppId = getSenderAppId(evt.data["sessionId"]);
		if (senderAppId) {
			if (evt.data["type"] === "onConnectionClosed") {
				delete sessionObjs[evt.data["sessionId"]];
			}
			chrome.runtime["sendMessage"](senderAppId, evt.data,
				function (response) {});
		}
	}
}
function getSenderAppId(sessionId) {
	if (sessionObjs[sessionId]) {
		return sessionObjs[sessionId]["senderAppId"];
	}
	return null;
}

function externalMsgHandler(request, sender, sendResponse) {
	var message;
	try {
		//Read the message only when the external app/extension id is whitelisted using policy
		UserConfiguration.getExternalAppsIdFromPolicy(function (appIds) {
			var sessionId = request["sessionId"];
			var sessionObj = sessionObjs[sessionId];
			if (appIds && appIds.indexOf(sender["id"]) !== -1) {
				switch (request["method"]) {
				case "launchSession":
					if (request["icaData"]) {
						if (sessionObj && sessionObj["appViewMode"]) {
							initApp("appview"); //send kioskmode as true for appview mode as well
							UserConfiguration.getEngineSettingsFromPolicy(UserConfiguration.engineSettingsKey, function (policyConfig) {
								var configObj = JSON.parse(JSON.stringify(CHROME_APP_CONFIG_APPVIEW));

								//If any preferences sent using ica file then that is merged.
								if (request["icaData"]["chromeAppPreferences"]) {
									try {
										var prefsFrmIca = request["icaData"]["chromeAppPreferences"];
										configObj = mergeConfig(configObj, prefsFrmIca);
										delete request["icaData"]["chromeAppPreferences"];
									} catch (e) {
										console.log("Invalid JSON string from icaData chromeAppPreferences");
									}
								}
								//Any config through policy is merged
								if (Utils.isValid(policyConfig)) {
									configObj = mergeConfig(configObj, policyConfig)
								}
								_CEIP.add('session:launchType', 'appview');
								sessionObj["contentWindow"].HTML5_CONFIG = configObj; //need to set config b4 posting ica data
								sessionObj["contentWindow"].postMessage({
									"cmd": "ICADATA",
									"icaData": request["icaData"]
								}, "*");
								sendResponse({
									"success": true,
									"sessionId": embedSessionId
								});
							});

						} else {
							_CEIP.add('session:launchType', 'externalMessage');
							launchSessionFromICAData(request["icaData"],request["sessionId"],function (appWindow, response) {
								// TODO: wait for session launch and give response
								sendResponse({
									"success": true,
									"sessionId": response["id"]
								});
								sessionObjs[response["id"]] = {
									"senderAppId": sender["id"]
								};
								sessionObjs[response["id"]]["appWindow"] = appWindow;
							});
						}
					} else {
						message = "Invalid params: no icadata";
					}
					break;
				case "disconnect":
					if (sessionId && sessionObjs[sessionId]) {
						var sObj = sessionObjs[sessionId]
							if (sObj["appViewMode"] == true) {
								sObj["contentWindow"].postMessage({
									"cmd": "DISCONNECT"
								}, "*");
							} else {
								sObj["appWindow"]["contentWindow"].postMessage({
									"cmd": "DISCONNECT"
								}, "*");
							}
					} else {
						message = "Invalid sessionId";
					}
					break;
				case "hide":
					var sessionObj = sessionObjs[sessionId];
					if (sessionId && sessionObj) {
						var sw = sessionObj["appWindow"];
						if (sessionObj["appViewMode"]) {
							message = "Hide the appview element from your app";
						} else if (sw) {
							sw.hide();
							// hide seamless app windows
							asyncObjects.get("appWindow.proxyDomWindow", function (r) {
								r.postMessage({
									"sessionWinId": sessionId,
									"cmd": "hideAll"
								}, "*");
							});
							// hide secondary display windows in case of MultiMonitor
							sessionObj["appWindow"]["contentWindow"].postMessage({
								"cmd": "HIDE_DISPLAY_WINDOW"
							}, "*");
						} else {
							message = "Invalid sessionId";
						}
					} else {
						message = "Invalid sessionId";
					}
					break;
				case "show":
					var sessionObj = sessionObjs[sessionId];
					if (sessionId && sessionObj) {
						var sw = sessionObj["appWindow"];
						if (sessionObj["appViewMode"]) {
							message = "Show the appview element from your app";
						} else if (sw) {
							// In case of UT, call show() method without any timeout
							if(dependency && dependency.testEnv){
								sw.show();
							}
							// show seamless app windows
							asyncObjects.get("appWindow.proxyDomWindow", function (r) {
								r.postMessage({
									"sessionWinId": sessionId,
									"cmd": "showAll"
								}, "*");
							});
							
							setTimeout(function () {
								sw.show();
								// show secondary display windows in case of MultiMonitor
								sessionObj["appWindow"]["contentWindow"].postMessage({
									"cmd": "SHOW_DISPLAY_WINDOW"
								}, "*");
							}, 1000);
						}
					} else {
						message = "Invalid sessionId";
					}
					break;
				case "logoff":
					if (sessionId && sessionObjs[sessionId]) {
						var sObj = sessionObjs[sessionId]
							if (sObj["appViewMode"] == true) {
								sObj["contentWindow"].postMessage({
									"cmd": "LOGOFF"
								}, "*");
							} else {
								sObj["appWindow"]["contentWindow"].postMessage({
									"cmd": "LOGOFF"
								}, "*");
							}
					} else {
						message = "Invalid sessionId";
					}
					break;
				case "resolution":
					if (sessionId && sessionObjs[sessionId]) {
						var sObj = sessionObjs[sessionId]
							if (sObj["appViewMode"] == true) {
								sObj["contentWindow"].postMessage({
									"cmd": "RESOLUTION",
									"bounds" : request["bounds"]
								}, "*");
							} else {
								sObj["appWindow"]["contentWindow"].postMessage({
									"cmd": "RESOLUTION",
									"bounds" : request["bounds"]
								}, "*");
							}
					} else {
						message = "Invalid sessionId";
					}
					break;
					case "splkeys":
					if (sessionId && sessionObjs[sessionId]) {
						var sObj = sessionObjs[sessionId]
							if (sObj["appViewMode"] == true) {
								sObj["contentWindow"].postMessage({
									"cmd": "SPLKEYS",
									"keys" : request["keys"]
								}, "*");
							} else {
								sObj["appWindow"]["contentWindow"].postMessage({
									"cmd": "SPLKEYS",
									"keys" : request["keys"]
								}, "*");
							}
					} else {
						message = "Invalid sessionId";
					}
					break;
				default:
					sessionId = null;
					message = "Invalid Params";
					break;
				}
			} else {
				message = "App/Extension id not whitelisted";
			}
			if (message) {
				sendResponse({
					"success": false,
					"sessionId" : sessionId,
					"error": message
				});
			}
			else if(request["method"] !== "launchSession"){
				sendResponse({
					"success": true,
					"sessionId" : sessionId
				});
			}
		});
	} catch (e) {
		sendResponse({
			"success": false,
			"sessionId" : null,
			"error": e.message
		});
	}
	//Means return response async
	return true;
}

//To receive messages from other app/extensions.
chrome.runtime["onMessageExternal"].addListener(externalMsgHandler);

//var appViewMode;
var embedSessionId;
function embedRxHandler(request) {
	UserConfiguration.getExternalAppsIdFromPolicy(function (appIds) {
		if (appIds && appIds.indexOf(request["embedderId"]) !== -1) {
			var currentTime = (new Date()).getTime();
			embedSessionId = request["data"]["sessionId"];
			var pageURL = "/src/SessionWindow.html" + '?launchid=' + embedSessionId + "#type=message&redirecturl=none&launcherType=chromeApp" + "&appView=true";
			sendMessageToApp(request["embedderId"], {
				"type": "EmbedRequest",
				"origin": window.location.origin,
				"data": {
					"state": "success",
					"sessionId": embedSessionId
				}
			});
			sessionObjs[embedSessionId] = {
				"senderAppId": request["embedderId"],
				"appViewMode": true
			};
			request.allow(pageURL);
		} else {
			message = "App/Extension id not whitelisted";
			sendMessageToApp(request["embedderId"], {
				"type": "EmbedRequest",
				"origin": window.location.origin,
				"data": {
					"state": "deny"
				}
			});
			request.deny();
		}
	});
	//Means return response async
	return true;
}
chrome.app.runtime["onEmbedRequested"].addListener(embedRxHandler);

function sendMessageToApp(senderAppId, data) {
	chrome.runtime["sendMessage"](senderAppId, data,
		function (response) {});
}
