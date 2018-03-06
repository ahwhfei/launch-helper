function MobileUI() {
    var m_pointer = false;
    var m_scroll = true;
    var img;
	var offsetX = 0;
	var offsetY = 0;
   
    //Function to load mousePointer image
    var createCursor = function () {
       img = new Image();
       img.className = "mousePointer";
       var ui = GetUI().GetElement();
       ui.appendChild(img);
    };


    createCursor();  //load cursor image

    var ConvertCssPxToInt = function (cssPxValueText) {
        return parseInt(cssPxValueText.substring(0, cssPxValueText.length - 2));
    };
	this.setCursorImage = function(cursor,X,Y)
	{
		img.src = cursor;
		offsetX = X;
		offsetY = Y;
	};
	this.getCursorOffsetPosition = function()
	{
		var cursorPoint = new Point(ConvertCssPxToInt(img.style.left) + offsetX, ConvertCssPxToInt(img.style.top) + offsetY);
        return cursorPoint;
	};
    this.showCursor = function (x, y) {
        img.style.left = x + "px";
        img.style.top = y + "px";
        img.style.display = "block";
        m_pointer = true;
    };
    this.hideCursor = function () {
        img.style.display = "none";
        m_pointer = false;
    };

    this.getImageObject = function () {
        return img;
    };
    this.getScrollingMode = function () {
        return m_scroll;
    };
    this.setScrollingMode = function (value) {
        m_scroll = value;
    };
    this.getCursorMode = function () {
        return m_pointer;
    };
    this.getCursorPointer = function () {
        var cursorPoint = new Point(ConvertCssPxToInt(img.style.left), ConvertCssPxToInt(img.style.top));
        return cursorPoint;
    };
}
