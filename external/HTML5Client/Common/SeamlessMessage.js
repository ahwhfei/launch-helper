
var SeamlessUI;

(function(SeamlessUI){
	var Message = function() {
		function Message(msg){
            this.command = (msg)? msg : {};
            this.slMessage = true;
		}

		 var seamlessToUIAttrMap = {
		  	dimension : 'dimension',
		  	icon :'icon',
		  	focus : 'focus',
		  	minimize :'minimize',
		  	maximize : 'maximize',
		  	windowName :'windowName',
		  	minimizeWindow : 'minimizeWindow',
		  	isFullScreen : 'isFullScreen'
	    };

		Object.defineProperties(Message.prototype, {
			windowInfo: {
				get: function () {

					return this.command.window_info;
				},
				set: function (value) {
					this.command.window_info = value;
				},
				enumerable: true,
				configurable: true
			},
			sessionId: {
				get: function () {
					return this.command.window_info.sessionId;
				},
				set: function (value) {
					if (!this.command.window_info) {
						this.command.window_info = {};
					}
					this.command.window_info.sessionId = value;
				},
				enumerable: true,
				configurable: true
			},
			appId: {
				get: function () {
					return this.command.window_info.appId;
				},
				set: function (value) {
					if (!this.command.window_info) {
						this.command.window_info = {};
					}
					return this.command.window_info.appId = value;
				},
				enumerable: true,
				configurable: true
			},
			message: {
				get: function () {
					return this.command;
				},
				set: function (value) {
					this.command = value;
				},
				enumerable: true,
				configurable: true
			},

			windowName : {
				get: function() {
					return this.command.attributes.windowName;
				},
				enumerable : true,
				configurable: true
			},
			
			minimizeWindow:{
				get: function() {
					return this.command.attributes.minimizeWindow;
				},
				set: function(value) {
					if(this.command.attributes || (this.command.attributes = {})) {
						this.command.attributes.minimizeWindow = true;
					}
				},
				enumerable : true,
				configurable: true
			},
			isFullScreen:{
				get: function () {
					return this.command.window_info.isFullScreen;
				},
				set: function (value) {
					if (!this.command.window_info) {
						this.command.window_info = {};
					}
					return this.command.window_info.isFullScreen = value;
				},
				enumerable: true,
				configurable: true				
			},
			iconData : {
				get: function() {
					return this.command.attributes.icon;
				},
				enumerable : true,
				configurable: true
			},

			decoration : {
				get: function() {
					return this.command.attributes.dimension.decoration;
				},
				enumerable : true,
				configurable: true
			},

			position:{
				get: function() {
					return this.command.attributes.dimension.position;
				},set : function(value) {
					if(this.command.attributes || ((this.command.attributes = {}))) {
						if(this.command.attributes.dimension || (this.command.attributes.dimension = {})){
							this.command.attributes.dimension.position = value;
						}
					}
				},
				enumerable : true,
				configurable: true
			},


			cmd:{
				get: function() {
					return this.command.cmd;
				},
				set : function (value) {
					this.command.cmd = value;
				},
				enumerable : true,
				configurable: true
			},

			uiCmd: {
				get: function() {

					return this.command.uiCmd;
				},
				set: function(value) {
					this.command.uiCmd = value;
				},
				enumerable : true,
				configurable: true
			},

			maximize:{
				get: function() {
					return (this.command.attributes && this.command.attributes.hasMaximize);
				},
				set : function(value) {
					if(this.command.attributes || (this.command.attributes = {})) {
						this.command.attributes.hasMaximize = value;
					}
				},
				enumerable : true,
				configurable: true
			},

			minimize:{
				get: function() {
					return (this.command.attributes && this.command.attributes.hasMinimize);
				}, set : function(value) {
					if(this.command.attributes || (this.command.attributes = {})) {
						this.command.attributes.hasMinimize = value;
					}
				},
				enumerable : true,
				configurable: true
			},

			dragdrop: {
				get: function () {
					return this.command.attributes.dragdrop;
				},
				enumerable: true,
				configurable: true
			},

			resize:{
				get: function() {
					return this.command.attributes.resizable;
				},
				enumerable : true,
				configurable: true
			},

			taskbar:{
				get: function() {
					return (this.command['attributes'] &&  this.command.attributes.taskbar);
				},
				enumerable : true,
				configurable: true
			},

			dimension:{
				get: function() {
					return this.command.attributes.dimension;
				},
				enumerable : true,
				configurable: true
			},
			
			serverName:{
				get: function() {
					return this.command.attributes.serverName;
				},set: function(value) {
					if(this.command.attributes || (this.command.attributes = {})) {
						this.command.attributes.serverName = value;
					}
					
				},
				enumerable : true,
				configurable: true
			},

			focus:{
				get: function() {
					return this.command.attributes.focus;
				},
				set: function(value) {
					if(this.command.attributes || (this.command.attributes = {})) {
						this.command.attributes.focus = true;
					}
				},
				enumerable : true,
				configurable: true
			},

			attributes:{
				get: function() {
					   for(var key in this.command.attributes){
			              	if(this.command.attributes.hasOwnProperty(key)){
			              		this.command.attributes[seamlessToUIAttrMap[key]] = this.command.attributes[key];
			              	}
			              }
						return this.command.attributes;
				},
				enumerable : true,
				configurable: true
			},

			action:{
				get: function() {
					return this.command.action;
				},set : function (value) {
					this.command.action = value;
				},
				enumerable : true,
				configurable: true
			},

			actionData:{
				get: function() {
					return this.command.actionData;
				},set : function(value) {
					this.command.actionData = value;
				},
				enumerable : true,
				configurable: true
			},

			fixedPosition:{
				get: function() {
					return this.command.attributes.movable;
				},
				enumerable : true,
				configurable: true
			},

			title: {
				get : function() {
					return this.command.attributes.windowName;
				},
				enumerable : true,
				configurable: true
			},
			 seamlessMode: {
                get : function() {
                    if(this.command) {
                        if(this.command.attributes) {
                            return this.command.attributes.seamlessMode;
                        }
                    }
                },
                enumerable : true,
                configurable: true
            },
            usbEnabled: {
                get : function() {
                    if(this.command) {
                        if(this.command.attributes || (this.command.attributes = {})) {
                            return this.command.attributes.usbMode;
                        }
                    }
                },
                set :function(value) {
                    if(this.command) {
                        if(this.command.attributes || (this.command.attributes = {})) {
                            this.command.attributes.usbMode = value;
                        }
                    }
                },
                enumerable : true,
                configurable: true
            },
            clientWindow : {
                get : function() {
                    return this.command.attributes.clientWindow;
				},set : function(value) {
                   if(!this.command.attributes) {
                       this.command.attributes = {};                       
                   }
                   this.command.attributes.clientWindow = value;
                },
				enumerable : true,
				configurable: true
            }
		});

		return Message;
	}();
	SeamlessUI.Message = Message;
})(SeamlessUI || (SeamlessUI = {}));
