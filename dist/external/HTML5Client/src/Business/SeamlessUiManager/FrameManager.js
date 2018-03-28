var SeamlessUI;

(function(SeamlessUI) {	

var AutoFrameManager = (function() {
		//Constructor
		function AutoFrameManager() {

		}

		AutoFrameManager.prototype.cornerWidth = '10px';
		AutoFrameManager.prototype.cornerOffsetWidth = 10;

		AutoFrameManager.prototype.decorationMap = {
			"cornerLT" : {
				cursor : "nwse-resize",
				type : "corner"
			},
			"cornerRT" : {
				cursor : "nesw-resize",
				type : "corner"
			},
			"cornerLB" : {
				cursor : "nesw-resize",
				type : "corner"
			},
			"cornerRB" : {
				cursor : "nwse-resize",
				type : "corner"
			},
			"sideTop" : {
				cursor : "ns-resize",
				type : "side"
			},
			"sideLeft" : {
				cursor : "ew-resize",
				type : "side"
			},
			"sideRight" : {
				cursor : "ew-resize",
				type : "side"
			},
			"sideBottom" : {
				cursor : "ns-resize",
				type : "side"
			},
			"captionRect" : {
				cursor : "none",
				type : "title"
			}
		};

		AutoFrameManager.prototype.updateOnCreate = function(id, parent) {
			var iDiv = parent.decoration[id].div;
			var type = this.decorationMap[id].type;
			var applyCorner = true;
			var s = {};

			switch (type) {
			case "corner" :
				iDiv.style.width = this.cornerWidth;
				iDiv.style.height = this.cornerWidth;
				switch (id) {
				case "cornerLT" :
					s.left = 0;
					s.top = 0;
					s.background = "black";
					s.cursor = "nwse-resize";
					break;
				case "cornerRT" :
					s.left = parent.offsetWidth - this.cornerOffsetWidth;
					s.top = 0;
					s.background = "blue";
					s.cursor = "nesw-resize";
					break;
				case "cornerLB" :
					s.left = 0;
					s.top = parent.offsetHeight - this.cornerOffsetWidth;
					s.background = "green";
					s.cursor = "nesw-resize";
					break;
				case "cornerRB" :
					s.left = parent.offsetWidth - this.cornerOffsetWidth;
					s.top = parent.offsetHeight - this.cornerOffsetWidth;
					s.background = "yellow";
					s.cursor = "nwse-resize";
					break;
				default :
					break;
				}
				iDiv.style.cursor = s.cursor;
				break;
			case "side" :
				switch (id) {
				case "sideTop":
					s.left = this.cornerOffsetWidth;
					s.top = 0;
					s.width = parent.offsetWidth - (2 * this.cornerOffsetWidth);
					s.background = "purple";
					s.height = this.cornerOffsetWidth;
					s.cursor = "ns-resize";
					break;
				case "sideBottom":
					s.left = this.cornerOffsetWidth;
					s.top = parent.offsetHeight - this.cornerOffsetWidth;
					s.width = parent.offsetWidth - (2 * this.cornerOffsetWidth);
					s.height = this.cornerOffsetWidth;
					s.background = "aqua";
					s.cursor = "ns-resize";
					break;
				case "sideLeft":
					s.left = 0;
					s.top = this.cornerOffsetWidth;
					s.width = this.cornerOffsetWidth;
					s.height = parent.offsetHeight - (2 * this.cornerOffsetWidth);
					s.background = "brown";
					s.cursor = "ew-resize";
					break;
				case "sideRight":
					s.left = parent.offsetWidth - this.cornerOffsetWidth;
					s.top = this.cornerOffsetWidth;
					s.width = this.cornerOffsetWidth;
					s.height = parent.offsetHeight - (2 * this.cornerOffsetWidth);
					s.background = "coral";
					s.cursor = "ew-resize";
					break;
				default :
					break;
				}
				iDiv.style.width = s.width + "px";
				iDiv.style.height = s.height + "px";
				iDiv.style.cursor = s.cursor;
				break;
			case "title" :
				s.left = this.cornerOffsetWidth;
				s.top = this.cornerOffsetWidth;
				s.height = 30;
				s.width = parent.offsetWidth - (2 * this.cornerOffsetWidth) - 30;
				s.background = "gold";
				iDiv.style.width = s.width + "px";
				iDiv.style.height = s.height + "px";
				break;
			default :
				console.log("Error in Virtual window...");
				applyCorner = false;
			}
			if (applyCorner) {
				iDiv.style.left = s.left + "px";
				iDiv.style.top = s.top + "px";
				iDiv.style.background = s.background;
			}

			iDiv.id = parent.id + '-' + id;
			iDiv.draggable = "true";
			iDiv.style.position = "absolute";
		};

		AutoFrameManager.prototype.create = function(parent, dragStart) {
			var autoFrameManager = this;
			Object.keys(AutoFrameManager.prototype.decorationMap).forEach(function(id) {
				parent.decoration[id] = {};
				var iDiv = document.createElement('div');
				parent.appendChild(iDiv);
				parent.decoration[id].div = iDiv;
				iDiv.ondragstart = dragStart;
				slFrameManager.updateOnCreate(id, parent);
			});
		};

		AutoFrameManager.prototype.update = function(message) {
			var id = message.appId;
			var bounds = message.position;
			var vDiv = document.getElementById(id);

			//Adjust content divs
			document.getElementById(vDiv.id + "-sideLeft").style.height = (bounds.height - (2 * this.cornerOffsetWidth)) + "px";
			document.getElementById(vDiv.id + "-sideRight").style.height = (bounds.height - (2 * this.cornerOffsetWidth)) + "px";
			document.getElementById(vDiv.id + "-cornerLB").style.top = (bounds.height - this.cornerOffsetWidth) + "px";
			document.getElementById(vDiv.id + "-cornerRB").style.top = (bounds.height - this.cornerOffsetWidth) + "px";
			document.getElementById(vDiv.id + "-sideBottom").style.top = (bounds.height - this.cornerOffsetWidth) + "px";

			//Adjust content divs
			var title = document.getElementById(vDiv.id + "-captionRect");
			if (title) {
				title.style.width = (bounds.width - (2 * AutoFrameManager.prototype.cornerOffsetWidth) - 30) + "px";
			}
			document.getElementById(vDiv.id + "-sideTop").style.width = (bounds.width - (2 * AutoFrameManager.prototype.cornerOffsetWidth)) + "px";
			document.getElementById(vDiv.id + "-sideBottom").style.width = (bounds.width - (2 * AutoFrameManager.prototype.cornerOffsetWidth)) + "px";
			document.getElementById(vDiv.id + "-cornerRT").style.left = (bounds.width - AutoFrameManager.prototype.cornerOffsetWidth) + "px";
			document.getElementById(vDiv.id + "-cornerRB").style.left = (bounds.width - AutoFrameManager.prototype.cornerOffsetWidth) + "px";
			document.getElementById(vDiv.id + "-sideRight").style.left = (bounds.width - AutoFrameManager.prototype.cornerOffsetWidth) + "px";
		};

		return AutoFrameManager;
	})();



	var SlFrameManager = (function() {
		function SlFrameManager() {

		}

		var decorationMap = {
			cornerLT : {
				cursor : "nwse-resize",
				type : "corner",
				color : "blue",
				idStr : "cornerLT"
			},
			cornerRT : {
				cursor : "nesw-resize",
				type : "corner",
				color : "green",
				idStr : "cornerRT"
			},
			cornerLB : {
				cursor : "nesw-resize",
				type : "corner",
				color : "gray",
				idStr : "cornerLB"
			},
			cornerRB : {
				cursor : "nwse-resize",
				type : "corner",
				color : "ivory",
				idStr : "cornerRB"
			},
			sideTop : {
				cursor : "ns-resize",
				type : "side",
				color : "lightgreen",
				idStr : "sideTop"
			},
			sideLeft : {
				cursor : "ew-resize",
				type : "side",
				color : "black",
				idStr : "sideLeft"
			},
			sideRight : {
				cursor : "ew-resize",
				type : "side",
				color : "red",
				idStr : "sideRight"

			},
			sideBottom : {
				cursor : "ns-resize",
				type : "side",
				color : "violet",
				idStr : "sideBottom"

			},
			captionRect : {
				cursor : "none",
				type : "title",
				color : "orange",
				idStr : "captionRect"
			}
		};

		SlFrameManager.prototype.updateOnCreate = function (decoratedKey, key, parent, message) {
			var iDiv = parent.decoration[key].div;
			this.updateUnit(decoratedKey, iDiv, message);

			if (decorationMap[decoratedKey].cursor != "none") {
				iDiv.style.cursor = decorationMap[decoratedKey].cursor;
				iDiv.style.background = decorationMap[decoratedKey].color;
			}

			iDiv.style.background = decorationMap[decoratedKey].color;
			iDiv.id = parent.id + '-' + key;
			iDiv.draggable = "true";
			iDiv.style.position = "absolute";
		};

		var dragStart;
		SlFrameManager.prototype.create = function(parent, _dragstart) {
			var slFrameManager = this;
			dragStart = _dragstart;
			Object.keys(decorationMap).forEach(function(decoratedKey) {
				var key = decorationMap[decoratedKey].idStr;
				if (parent.srcMessage.decoration[decoratedKey]) {
					console.log(decoratedKey);
					parent.decoration[key] = {};
					var divContent = document.createElement('div');
					parent.appendChild(divContent);
					parent.decoration[key].div = divContent;
					divContent.ondragstart = dragStart;
					slFrameManager.updateOnCreate(decoratedKey, key, parent, parent.srcMessage);
				}
			});
		};

		SlFrameManager.prototype.updateUnit = function(decoratedKey, iDiv, slMessage) {
			iDiv.style.visibility = "visible";
			iDiv.style.top = (slMessage.decoration[decoratedKey].top - slMessage.position.top) + "px";
			iDiv.style.left = (slMessage.decoration[decoratedKey].left - slMessage.position.left) + "px";
			iDiv.style.width = slMessage.decoration[decoratedKey].width + "px";
			iDiv.style.height = slMessage.decoration[decoratedKey].height + "px";
		};		

		SlFrameManager.prototype.update = function(message) {
			var appId = message.appId;
			var vDiv = document.getElementById(appId);
			Object.keys(decorationMap).forEach(function(decoratedKey) {
				var key = decorationMap[decoratedKey].idStr;
				if (message.decoration[decoratedKey] && vDiv.decoration[key]) {
					SlFrameManager.prototype.updateUnit(decoratedKey, vDiv.decoration[key].div, message);
				} else if (vDiv.decoration[key]) {
					vDiv.decoration[key].div.style.visibility = "hidden";
				} else if (message.decoration[decoratedKey]) {
					console.log("Adding new decoration div : " + key);
					var divContent = document.createElement('div');
					vDiv.appendChild(divContent);
					vDiv.decoration[key] = {};
					vDiv.srcMessage = message;
					vDiv.decoration[key].div = divContent;
					divContent.ondragstart = dragStart;
					SlFrameManager.prototype.updateOnCreate(decoratedKey, key, vDiv, message);
				}
			});
		};

		return SlFrameManager;
	})();


	var frameManager = (function() {
		var autoFrameMgr = new AutoFrameManager();
		var slFrameMgr = new SlFrameManager();

		function FrameManager() {
		}


		FrameManager.prototype.create = function(parent, dragstart) {
			this.filter(parent.srcMessage).create(parent, dragstart);
		};

		FrameManager.prototype.update = function(message) {
			this.filter(message).update(message);
		};

		FrameManager.prototype.filter = function(message) {
			var frameMgr = autoFrameMgr;
			if (message.cmd == "update" && message.decoration) {
				frameMgr = slFrameMgr;
			} else if (message.resize && message.decoration) {
				frameMgr = slFrameMgr;
			}
			return (frameMgr);
		};

		return new FrameManager();
	})();
	
})(SeamlessUI || ( SeamlessUI = {}));