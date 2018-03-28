/* Size prototype */

function Size(width, height) {
    this.Width = width;
    this.Height = height;
}

Size.prototype.SetSize = function (width, height) {
    this.Width = width;
    this.Height = height;
};

/* Point prototype */
function Point(cx, cy) {
    this.X = cx;
    this.Y = cy;
}

Point.prototype.SetPoint = function (cx, cy) {
    if (arguments.length === 2) {
        this.X = cx;
        this.Y = cy;

    }
    else {
        this.X = cx.X;
        this.Y = cx.Y;
    }
};

Point.prototype.Translate = function (cx, cy) {
    this.X += cx;
    this.Y += cy;
};

/* Rectangle prototype */
function Rectangle(x, y, width, height) {
    this.X = this.left = x;
    this.Y = this.top = y;
    this.right = this.left + width;
    this.bottom = this.top + height;
    this.Width = width;
    this.Height = height;
}

Rectangle.prototype.SetBounds = function (x, y, width, height) {
    this.X = this.left = x;
    this.Y = this.top = y;
    this.right = this.left + width;
    this.bottom = this.top + height;
    this.Width = width;
    this.Height = height;
};

Rectangle.prototype.Contains = function (tx, ty) {
    return this.Width > 0 && this.Height > 0 && tx >= this.X && tx < this.X + this.Width && ty >= this.Y && ty < this.Y + this.Height;
};

Rectangle.prototype.Equals = function (rectangle) {
    return rectangle.X === this.X && rectangle.Y === this.Y && rectangle.Width === this.Width && rectangle.Height === this.Height;
};

Rectangle.prototype.Translate = function (x, y) {
    this.X = x + this.X;
    this.Y = y + this.Y;
};

Rectangle.prototype.Intersects = function (rectangle) {
    return this.Contains(rectangle.X, rectangle.Y) || this.Contains(rectangle.X + rectangle.Width, rectangle.Y) || this.Contains(rectangle.X, rectangle.Y + rectangle.Height) || this.Contains(rectangle.X + rectangle.Width, rectangle.Y + rectangle.Height);
};

Rectangle.prototype.Intersection = function (rectangle) {
    var x1 = Math.max(this.X, rectangle.X);
    var y1 = Math.max(this.Y, rectangle.Y);
    var x2 = Math.min(this.X + this.Width, rectangle.X + rectangle.Width);
    var y2 = Math.min(this.Y + this.Height, rectangle.Y + rectangle.Height);

    if ((x1 >= x2) || (y1 >= y2)) {
        return null;
    }
    else {
        var rect = new Rectangle(x1, y1, x2 - x1, y2 - y1);
        return rect;
    }
};

Rectangle.prototype.Union = function (rect) {
    var left = Math.min(this.left, rect.left);
    var top = Math.min(this.top, rect.top);
    var right = Math.max(this.right, rect.right);
    var bottom = Math.max(this.bottom, rect.bottom);

    return new Rectangle(left, top, right - left, bottom - top);        
};



