function HorizontalLayout(parentObj, row, width, height, spacing) {

	var childItems = [];
	var childItemsSize = 0;
	var rows = row;
	var spacingInfo = spacing;
	var layoutElement = document.createElement("div");
	var layoutElementStyle = layoutElement.style;

	layoutElementStyle.width = width;
	layoutElementStyle.height = height;
	layoutElementStyle.position = 'absolute';

	// Only for webkit browsers and mozilla
	layoutElementStyle.webkitUserSelect = 'none';
	layoutElementStyle.mozUserSelect = 'none';

	var elementHeight = parseInt(height);
	var elementWidth = parseInt(width);

	layoutElementStyle.padding = '0px';
	layoutElementStyle.margin = '0px';

	var elementWidth;
	var elementHeight, space;
	var backgroundColor, hoverColor;

	var isDropDownMenuItem = false;
	this.isHoverEnabled = false;
	var clickable = false;

	// Only for drop down menu items
	this.isSelected = false;

	// Used when it has a parent only to identify the
	// layout.
	this.layoutIndex = -1;

	var myself = this;

	function MouseOverEventHandler(evt) {
		layoutElementStyle.backgroundColor = hoverColor;
		parentObj.childActive = true;
	}

	function MouseOutEventHandler(evt) {
		if (!myself.isSelected) {
			layoutElementStyle.backgroundColor = backgroundColor;
			parentObj.childActive = true;
		}
	}


	this.Init = function(spacingInfo, widgetList) {

		var left = 0, width, nextLeft = 0;

		layoutElementStyle.display = 'block';
		//layoutElementStyle.border = '1px';

		for (var i = 0; i < widgetList.length; i++) {

			widgetElement = widgetList[i].GetElement();
			if (spacingInfo[i]) {
				space = parseFloat(spacingInfo[i]);
				left += parseInt((space / 100) * elementWidth);
				widgetList[i].StyleWidget(elementWidth, elementHeight, left, nextLeft - left);
			} else {
				nextLeft += widgetElement.offsetWidth;
				widgetList[i].StyleWidget(elementWidth, elementHeight, left, nextLeft - left);
				left = nextLeft;
			}
			childItems[childItemsSize++] = widgetList[i];
		}
	};

	this.DisableBorder = function() {
		layoutElementStyle.border = '0px';
		layoutElementStyle.borderStyle = 'none';
	};

	this.Show = function() {
		layoutElementStyle.display = 'block';
	};

	this.Hide = function() {
		layoutElementStyle.display = 'none';
	};

	this.GetElement = function() {
		return layoutElement;
	};

	if (!parentObj) {
		document.body.appendChild(layoutElement);
	} else {
		parentObj.GetElement().appendChild(layoutElement);
	}

	this.SetBackgroundColor = function(color) {
		backgroundColor = color;
		layoutElementStyle.backgroundColor = color;
	};
	this.SetHoverColor = function(color) {
		hoverColor = color;
		layoutElement.addEventListener('mouseover', MouseOverEventHandler, true);
		layoutElement.addEventListener('mouseout', MouseOutEventHandler, true);
		this.isHoverEnabled = true;
	};

	this.SetDropDownMenuItem = function() {
		isDropDownMenuItem = true;

		layoutElement.onclick = function(evt) {

			if (!evt.ctrlKey) {

				if (!parentObj.IsLayoutSelected(myself.layoutIndex)) {
					parentObj.ResetSelectedLayouts();
					parentObj.SelectLayout(myself.layoutIndex);
					myself.isSelected = true;
					layoutElementStyle.backgroundColor = hoverColor;

				} else {

					parentObj.UnSelectLayout(myself.layoutIndex);
					myself.isSelected = false;
					layoutElementStyle.backgroundColor = backgroundColor;
				}
			} else {
				if (!parentObj.IsLayoutSelected(myself.layoutIndex)) {
					parentObj.SelectLayout(myself.layoutIndex);
					myself.isSelected = true;
					layoutElementStyle.backgroundColor = hoverColor;
				} else {
					parentObj.UnSelectLayout(myself.layoutIndex);
					myself.isSelected = false;
					layoutElementStyle.backgroundColor = backgroundColor;
				}
			}
			evt.stopPropagation();
		};

	};
	this.ResetColor = function() {
		layoutElementStyle.backgroundColor = backgroundColor;
		this.isSelected = false;
	};
	this.GetChildItems = function() {
		return childItems;
	};

	this.SetClickable = function() {
		this.SetDropDownItem();
	};

	this.GetWidth = function() {
		var width = parseInt(layoutElementStyle.width) + parseInt(layoutElementStyle.paddingRight) + parseInt(layoutElementStyle.paddingLeft) + parseInt(layoutElementStyle.marginLeft) + parseInt(layoutElementStyle.marginRight);
		return width;
	};

	this.GetHeight = function() {
		var height = parseInt(layoutElementStyle.height) + parseInt(layoutElementStyle.paddingTop) + parseInt(layoutElementStyle.paddingBottom) + parseInt(layoutElementStyle.marginTop) + parseInt(layoutElementStyle.marginBottom);
		return height;
	};

	this.StyleWidget = function(parentWidth, parentHeight, leftPos) {

		var elementWidth = layoutElement.offsetWidth;
		var elementHeight = layoutElement.offsetHeight;

		layoutElementStyle.width = elementWidth + 'px';
		layoutElementStyle.height = elementHeight + 'px';
		layoutElementStyle.position = 'absolute';
		layoutElementStyle.left = leftPos + 'px';
		layoutElementStyle.top = (parentHeight - elementHeight) / 2 + 'px';
		layoutElementStyle.padding = '0px';
		layoutElementStyle.margin = '0px';
		layoutElementStyle.border = '0px';
		layoutElementStyle.resize = 'none';
	};

}

function GridLayout(parentObj) {

	var gridLayoutElement = document.createElement('div');
	var gridLayoutElementStyle = gridLayoutElement.style;
	var gridWidth = 0, gridHeight = 0;
	var hLayout;
	var hLayoutElement, hLayoutElementStyle;

	var isDropDownMenuItem = false;
	var selectedChildList = [];
	var childrenReset = false;
	var layoutDirection = String("vertical");

	var childItems = [];
	childItems.length = 0;
	this.childActive = false;
	myself = this;

	if (!parentObj) {
		document.body.appendChild(gridLayoutElement);
	} else {
		parentObj.GetElement().appendChild(gridLayoutElement);
	}

	function MouseClickHandler(evt) {
		gridLayoutElement.focus();
		if (evt.stopPropagation) {
			evt.stopPropagation();
		}

	}

	// Default:vertical stacking of the layouts.
	this.Init = function(hLayoutList, direction) {

		layoutDirection = direction;

		for (var i = 0; i < hLayoutList.length; i++) {

			hLayout = hLayoutList[i];
			this.AddLayout(hLayout, i);
		}

		//Not really needed for child layouts withc equal dimensions.

		//this.AdjustPositions();

		gridLayoutElementStyle.display = 'none';
		//gridLayoutElementStyle.position = 'absolute';

		// Only for webkit browsers and mozilla
		gridLayoutElementStyle.webkitUserSelect = 'none';
		gridLayoutElementStyle.mozUserSelect = 'none';
		if (window.addEventListener) {
			gridLayoutElement.addEventListener('click', MouseClickHandler, true);
		} else {
			gridLayoutElement.attachEvent('onclick', MouseClickHandler);
		}

	};

	this.AddLayout = function(hLayout, layoutIndex) {

		var hLayoutElement = hLayout.GetElement();
		var hLayoutElementStyle = hLayoutElement.style;

		hLayout.layoutIndex = layoutIndex;

		var hLayoutWidth = parseInt(hLayoutElementStyle.width);
		var hLayoutHeight = parseInt(hLayoutElementStyle.height);

		if (layoutDirection == "vertical") {

			gridWidth = gridWidth < hLayoutWidth ? hLayoutWidth : gridWidth;
			hLayoutElementStyle.top = gridHeight + 'px';

			gridHeight += hLayoutHeight;
		} else {
			gridHeight = gridHeight < hLayoutHeight ? hLayoutHeight : gridHeight;
			hLayoutElementStyle.left = gridWidth + 'px';
			gridWidth += hLayoutWidth;
		}
		gridLayoutElement.appendChild(hLayoutElement);
		childItems[layoutIndex] = hLayout;
		selectedChildList[layoutIndex] = false;

		gridLayoutElementStyle.width = gridWidth + 'px';
		gridLayoutElementStyle.height = gridHeight + 'px';

	};

	this.AdjustPositions = function() {

		if (layoutDirection == "horizontal") {
			for (var i = 0; i < childItems.length; i++) {

				hLayout = childItems[i];
				hLayoutElement = hLayout.GetElement();
				hLayoutElementStyle = hLayoutElement.style;

				hLayoutElementStyle.top = ((gridHeight - hLayoutElement.offsetHeight) / 2) + 'px';
			}
		} else {
			for (var i = 0; i < childItems.length; i++) {

				hLayout = childItems[i];
				hLayoutElement = hLayout.GetElement();
				hLayoutElementStyle = hLayoutElement.style;

				hLayoutElementStyle.left = ((gridWidth - hLayoutElement.offsetWidth) / 2) + 'px';
			}

		}
	};

	this.RemoveLayoutsByPosition = function(position, count) {
		var element;
		var elementStyle;
		var elementWidth;
		var elementHeight;

		for (var i = position; i < position + count; i++) {
			element = childItems[i].GetElement();
			gridLayoutElement.removeChild(element);
		}

		ctr = childItems.splice(position, count);
		selectedChildList.splice(position, count);

		gridWidth = 0;
		gridHeight = 0;

		for ( i = 0; i < childItems.length; i++) {
			childItems[i].layoutIndex = i;
			childItems[i].ResetColor();
			element = childItems[i].GetElement();
			elementStyle = element.style;

			elementWidth = parseInt(elementStyle.width);
			elementHeight = parseInt(elementStyle.height);

			if (layoutDirection == "vertical") {
				gridWidth = gridWidth < elementWidth ? elementWidth : gridWidth;
				elementStyle.top = gridHeight + 'px';

				gridHeight += elementHeight;
			} else {
				gridHeight = gridHeight < elementHeight ? elementHeight : gridHeight;
				elementStyle.left = gridWidth + 'px';
				gridWidth += elementWidth;
			}
		}

	};

	this.RemoveLayouts = function(layoutList) {
		for (var i = 0; i < layoutList.length; i++) {
			index = childItems.indexOf(layoutList[i]);
			if (index != -1) {
				childItems.splice(index, 1);
				selectedChildList.splice(index, 1);
			}
		}

		gridWidth = 0;
		gridHeight = 0;

		for ( i = 0; i < childItems.length; i++) {
			childItems[i].layoutIndex = i;
			childItems[i].ResetColor();
			element = childItems[i].GetElement();
			elementStyle = element.style;

			elementWidth = parseInt(elementStyle.width);
			elementHeight = parseInt(elementStyle.height);

			if (layoutDirection == "vertical") {

				gridWidth = gridWidth < elementWidth ? elementWidth : gridWidth;
				elementStyle.top = gridHeight + 'px';

				gridHeight += elementHeight;
			} else {
				gridHeight = gridHeight < elementHeight ? elementHeight : gridHeight;
				elementStyle.left = gridWidth + 'px';
				gridWidth += elementWidth;
			}
		}

	};

	this.Show = function() {
		gridLayoutElementStyle.display = 'block';
	};

	this.Hide = function() {
		gridLayoutElementStyle.display = 'none';
	};

	this.GetElement = function() {
		return gridLayoutElement;
	};

	this.SetPosition = function(left, top) {
		gridLayoutElementStyle.left = left + 'px';
		gridLayoutElementStyle.top = top + 'px';
	};

	this.SetBorderColor = function(color) {
		gridLayoutElementStyle.border = '1px';
		gridLayoutElementStyle.borderStyle = 'inset';
		gridLayoutElementStyle.borderColor = color;
	};

	this.SetDropDownMenuItem = function() {
		isDropDownMenuItem = true;
		gridLayoutElement.onmousedown = function(evt) {
			parentObj.childActive = true;
		};
		gridLayoutElement.onmouseout = function(evt) {
			parentObj.childActive = false;
		};
	};
	this.GetType = function() {
		return String("gridLayout");
	};

	this.SelectLayout = function(index) {
		selectedChildList[index] = true;
		childrenReset = false;
	};
	this.UnSelectLayout = function(index) {
		selectedChildList[index] = false;
	};

	this.IsLayoutSelected = function(index) {
		return selectedChildList[index];
	};

	this.ResetSelectedLayouts = function() {
		if (!childrenReset) {
			for (var i = 0; i < selectedChildList.length; i++) {
				selectedChildList[i] = false;
				childItems[i].ResetColor();
			}
			childrenReset = true;
		}
	};
	this.GetSelectedLayouts = function() {
		var selectedLayouts = [];
		var count = 0;
		for (var i = 0; i < childItems.length; i++) {
			if (selectedChildList[i]) {
				selectedLayouts[count++] = childItems[i];
			}
		}
		return selectedLayouts;
	};

	this.GetChildItems = function() {
		return childItems;
	};

	this.GetWindowCoords = function() {

		coords = parentObj.GetWindowCoords();
		absX = parseInt(gridLayoutElementStyle.left) + coords[0];
		absY = parseInt(gridLayoutElementStyle.top) + coords[1];

		return [absX, absY];
	};

	this.GetDirection = function() {
		return layoutDirection;
	};
	this.GetWidth = function() {
		var width = parseInt(gridLayoutElementStyle.width) + parseInt(gridLayoutElementStyle.paddingRight) + parseInt(gridLayoutElementStyle.paddingLeft) + parseInt(gridLayoutElementStyle.marginLeft) + parseInt(gridLayoutElementStyle.marginRight);
		return gridWidth + 1;
	};

	this.GetHeight = function() {
		var height = parseInt(gridLayoutElementStyle.height) + parseInt(gridLayoutElementStyle.paddingTop) + parseInt(gridLayoutElementStyle.paddingBottom) + parseInt(gridLayoutElementStyle.marginTop) + parseInt(gridLayoutElementStyle.marginBottom);
		return gridHeight + 1;
	};
}

