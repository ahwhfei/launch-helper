this.UI = function() {

	uiElement = document.getElementById("CitrixXtcRoot");
	uiElementStyle = uiElement.style;

	uiElementStyle.width = '900px';
	uiElementStyle.height = '900px';
	uiElementStyle.left = '0px';
	uiElementStyle.top = '0px';
	uiElementStyle.backgroundColor = '#FFF';
	uiElementStyle.padding = '0px';
	uiElementStyle.margin = '0px';
	uiElementStyle.border = '0px';
	uiElementStyle.cursor = "default";
	this.width = 900;
	this.height = 900;
       
	// Disable right click on all child elements
	// of the UI
	uiElement.addEventListener("contextmenu", function(evt) {
		  evt.preventDefault();		 
		 evt.stopPropagation();
		 evt.cancelBubble = true;
		 return false;
	}, false);

	this.AddWidget = function(element) {
		uiElement.appendChild(element);
	};

	this.GetElement = function() {
		return uiElement;
	};

	this.GetObjectType = function() {
		return String("root");
	};

	this.SetDimensions = function(width, height) {

		uiElementStyle.width = width + 'px';
		uiElementStyle.height = height + 'px';
	};	

	this.GetWidth = function() {
		var width = parseInt(uiElementStyle.width) + parseInt(uiElementStyle.paddingRight) + parseInt(uiElementStyle.paddingLeft) + parseInt(uiElementStyle.marginLeft) + parseInt(uiElementStyle.marginRight);
		return width;
	};

	this.GetHeight = function() {
		var height = parseInt(uiElementStyle.height) + parseInt(uiElementStyle.paddingTop) + parseInt(uiElementStyle.paddingBottom) + parseInt(uiElementStyle.marginTop) + parseInt(uiElementStyle.marginBottom);
		return height;
	};
};
