/**
 * Created by rajasekarp on 11-12-2015.
 */


var SeamlessUI;

(function(SeamlessUI) {
	var HTML5UiManager = (function() {
		var uiManager;

		function HTML5UiManager(sessionId) {
			uiManager = this;
			console.log("Creating html5UiManager");
			this.sessionInfoManager = new SeamlessUI.SessionInfoManager(uiManager);
			this.taskbarApps = {};
            this.sessionInfoManager.register(sessionId, uiManager);
		}

		HTML5UiManager.prototype.execute = function(message) {
			var message = new SeamlessUI.Message(message);
			switch (message.cmd) {
				case 'create' :
					if(message.taskbar) {
						this.taskbarApps[message.appId] = message.appId;
						this.sessionInfoManager.notify(message);
					}
					break;
				case 'close' :
					if(this.taskbarApps[message.appId]) {
						this.sessionInfoManager.notify(message);
						delete this.taskbarApps[message.appId];
					}
					break;
				case 'update' :
					if(this.taskbarApps[message.appId]) {
						this.sessionInfoManager.notify(message);
					}
					break;
				case 'sessionInfo':
					this.sessionInfoManager.notify(message);
					var listeners = listenerMap['sessionInfo'];
					if(listeners.length){
						for(var i = 0; i < listeners.length; i++) {
							console.log("Dispatching message to sessionInfo Listener" );
							listeners[i](message.command);
						}
					}
				default:
					break;
			}
		};

		var listeners  = [];
		HTML5UiManager.prototype.addListener = function (sessionListener) {
			listeners.push(sessionListener);
		};

		HTML5UiManager.prototype.dispatch = function (command) {
			listeners.forEach(function(listener) {
				listener(command);
			});
		};

		var listenerMap = {};
		HTML5UiManager.prototype.addListenerById = function (id, listener) {
			if(!listenerMap[id]) {
				listenerMap[id] = [];
			}
			listenerMap[id].push(listener);
		};

		HTML5UiManager.prototype.getUiManager = function (sessionId) {
			return uiManager;
		};

		return HTML5UiManager;
	})();

	SeamlessUI['HTML5UiManager'] = HTML5UiManager;
	SeamlessUI.name = 'SeamlessUI';
})(SeamlessUI || (SeamlessUI = {}));