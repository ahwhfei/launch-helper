// Individual line dimensions and state as recorded by ImeMarkPainter
function MarkLine(x, y, h) {
	this.start = x;
	this.origStart = x;
	this.end = x;
	this.top = y;
	this.bottom = y + h;
	this.maxChars = 0;
	this.isLocked = false;
	
	// Current length of line
	this.Length = function length() {
		return this.end - this.start;
	};
	
	// Length from original start point of line to current end, used to
	// determine how far the cursor has traveled since this.start can be
	// modified for middle-/right-justified text
	this.OrigLength = function origLength() {
		return this.end - this.origStart;
	};

	// Checks if cursor is within this line or not
	this.Contains = function contains(x, y, h) {
		return y + h >= this.top && y <= this.bottom && x >= this.start;
	};
	
	// Update current line dimensions with new cursor position data
	this.Update = function update(x, y, h, text) {
		this.start = Math.min(this.start, x);
		this.top = Math.min(this.top, y);
		this.bottom = Math.max(this.bottom, y + h);

		// Update end of line if line not locked or text length is smaller
		// (backspace) or current X is longer than line end
		// This logic is needed to avoid shortening the previous line when
		// selecting words in the IME that strattle line boundaries
		if (!this.isLocked || x > this.end || text.length < this.maxChars) {
			this.end = x;
		}
		this.maxChars = Math.max(this.maxChars, text.length);
	};
	
	this.toString = function() {
		return '(' + this.start + ',' + this.top + ') -> ('
		+ this.end + ',' + this.bottom + ')';
	};
}

// IME underline indicator painter draws IME indicator on canvas to emulate
// native IME experience and indicate to user which word(s) are active in IME
function ImeMarkPainter(eventHandler)
{	
	// Tolerance allowed between our line length and estimated text length
	// Specified as ratio of font-size
	var TOLERANCE_RATIO = 0.4;
	
	// Distance as ratio of expecting length cursor must travel in first two
    // characters to be considered left-justified text
	var LEFT_JUSTIFIED_RATIO = 0.6;
	
	var isActive = false;
	var lines = [];
	var currentX = 0;
	var currentY = 0;
	var currentText = '';
	var fontSize = 0;
	var leftJustified = true;
	var testedJustify = false;
	
	var textMetrics = new TextMetrics();
	
	// IME canvas that will be placed on top of render canvas to enable drawing
	// of IME underlines without affecting render canvas which draws the ICA
	// session
	var imeCanvas = null;
	
	// Grab 2D context to perform draw operations
	var imeContext = null;
	
	this.TextUpdated = function textUpdated(text, size) {
		currentText = text;
		fontSize = size;
		if (!isActive) {
			// Lazily create IME canvas
			if (imeCanvas == null) {
				// Create new, transparent canvas
				imeCanvas = document.createElement('canvas');
				imeCanvas.style.position = 'absolute';
				imeCanvas.style.backgroundColor = 'transparent';
				
				// Mouse handlers to propagate events to parent handler so IME
				// canvas does not interfere with user/application interaction
				imeCanvas.addEventListener('mousedown', propagateEvent, false);
				imeCanvas.addEventListener('mouseup', propagateEvent, false);
				imeCanvas.addEventListener('mousemove', propagateEvent, false);
				imeCanvas.addEventListener('mouseout', propagateEvent, false);
				imeCanvas.addEventListener('mouseover', propagateEvent, false);
				imeCanvas.addEventListener('mousewheel', propagateEvent, false);
				imeCanvas.addEventListener('contextmenu', ignoreEvent, false);
				document.getElementById("citrixHTML5root").appendChild(imeCanvas);
				
				// Cache 2d context
				imeContext = imeCanvas.getContext('2d');
			}
			
			// Move IME canvas to forefront and resize to fit current screen
			imeCanvas.style.zIndex = '1000';
			imeCanvas.style.left = window.pageXOffset + 'px';
			imeCanvas.style.top = window.pageYOffset + 'px';
			imeCanvas.width = window.innerWidth;
			imeCanvas.height = window.innerHeight;
			isActive = true;
		}
	};
	
	this.CaretUpdated = function caretUpdated(x, y, h, newPosition) {
        
        // Make sure x and y are adjusted by page offsets
        x -= window.pageXOffset;
        y -= window.pageYOffset;
		
		if (!isActive) {
			// Just update current caret position
			currentX = x;
			currentY = y;
			return;
		}
		
		// If IME session is active, update mark indicator on IME canvas
		// First, has text been shortened and wrapped back to previous line
		var currentLine = null;
		while (lines.length > 0) {
			currentLine = lines[lines.length - 1];
			if (y + h >= currentLine.top) {
				break;
			}
			currentLine = null;
			lines.pop();
		}

		// Handle new line case
		if (currentLine == null || !currentLine.Contains(x, y, h)) {
			// Looks like new line, create line and add to list
			addNewLine(x, y, h);
		} else if (currentLine != null) {
			// Cursor appears to be in current line, update end
			currentLine.Update(x, y, h, currentText);
		}

		drawLines();
		currentX = x;
		currentY = y;
	};
	
	this.Clear = function clear() {
		// Clear state and canvas and move canvas z-order behind everything
		leftJustified = true;
		testedJustify = false;
		if (isActive) {
			isActive = false;
			lines.length = 0;
			if (imeCanvas) {
				imeCanvas.style.zIndex = '-1000';
				clearCanvas();
			}
		}
	};
	
	var addNewLine = function(x, y, h) {
		// See if this point extends current x and y
		var newLine = new MarkLine(x, y, h);
		if (x > currentX &&
			y >= currentY - fontSize * 2 &&
			y <= currentY + fontSize * 2) {
			newLine.start = currentX;
			newLine.origStart = currentX;
		}
		
		if (currentText.length > 0) {
			// Special case where first character (probably Roman) is converted
			// to a different single character in the local IME on the next key
			// stroke, and this wider character moves the text to the next line
			// In this case, prevent previous start line from being drawn
			if (lines.length > 0 && currentText.length == 1) {
				lines.length = 0;
			}
		}
		
		// Fix the start position of the previous line to make sure line
		// length estimates are accurate.  Cursor position sometimes quickly
		// shoots back to previous line when IME options are chosen which makes
		// the previous line length too short.  Locking the previous line
		// position here to fix this case
		if (lines.length > 0) {
			lines[lines.length - 1].isLocked = true;
		}

		lines.push(newLine);
	};
	
	// Draw underlines for all text lines in active IME session 
	var drawLines = function() {
		drawTimer = null;
		if (!imeContext) {
			return;
		}
		
		clearCanvas();
		var length = 0;
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			
			// Test to see if line looks left-justified
			if (i == 0 && !testedJustify && currentText.length >= 2) {
                var estimate = textMetrics.Length(currentText, fontSize);
				leftJustified = line.OrigLength()
					> estimate * LEFT_JUSTIFIED_RATIO;
                testedJustify = true;
			}
			
			// Check our line lengths vs. estimated line length to adjust line
			// lengths for middle-/right-justified text and line straddling
			// cases where not all cursor positions were sent from server
			if ((!leftJustified || i > 0)
				&& !line.isLocked
				&& i == lines.length - 1) {
				
				// Get estimated length and our total line length
				var estimatedLength = textMetrics.Length(currentText, fontSize);
				var totalLength = length + line.Length();
				
				// See if difference is bigger than tolerance level
				var difference = estimatedLength - totalLength;
				var tolerance = fontSize * TOLERANCE_RATIO;
				
				// Adjust line start
				if (difference > tolerance || difference < -tolerance) {
					line.start -= difference;
					
					// Sanity check start position
					if (line.start > line.end) {
						line.start = line.end;
					}
				}
			}
			
			// Draw line in canvas
			length += line.Length();
			imeContext.beginPath();
			imeContext.moveTo(line.start, line.bottom);
			imeContext.lineTo(line.end, line.bottom);
			imeContext.closePath();
			imeContext.strokeStyle = 'rgb(160,160,160)';
			imeContext.lineCap = 'butt';
			imeContext.stroke();
		}
	};
	
	// Erase all lines on IME canvas
	var clearCanvas = function() {
		if (imeContext) {
			imeContext.clearRect(0, 0, imeCanvas.width, imeCanvas.height);
		}
	};
	
	// Wrapper for mouse events, passing events to main render canvas handler
	var propagateEvent = function(evt) {
		eventHandler(evt);
		return false;
	};
	
	var ignoreEvent = function(evt) {
		return false;
	};
}
