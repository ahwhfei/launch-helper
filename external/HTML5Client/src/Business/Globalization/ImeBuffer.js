// Client IME hidden text buffer and parent container used for entering
// text into the local browser to enable client-side IME and positioning
// the buffer close to user activity to simulate native IME menu experience
function ImeBuffer(icaFrame, eventHandler, traits, underline)
{
    // Number of milliseconds ellapsing before last caret position information
    // is considered stale and will be ignored
    var CARET_EXPIRY_MS = 2000;
	
    // X-offset on page to place text input when caret not detected
    var DEFAULT_X_POSITION = 10;
	
    // Y-offset from bottom of page to place text input when caret not detected
    var DEFAULT_Y_POSITION = 80;
	
    var caretPositionKnown = false;
    var currentText = '';
    var fontSize = 0;
    var imeContainer = null;
    var textInput = null;
    var caretX = 0;
    var caretY = 0;
    var caretW = 1;
    var caretH = 18;
    var currentPosX = 0;
    var currentPosY = 0;
    var lastCaretDetected = 0;
    var lastUserActivity = CARET_EXPIRY_MS + 1;
	
    // Create mark painter if needed to mark IME position in canvas
    var markPainter = null;
    if (underline) {
        markPainter = new ImeMarkPainter(eventHandler);
    }

    // Create IME container (<div>) which holds the hidden IME buffer.  It is
    // needed to move the IME buffer close to active ICA session cursor so IME
    // menus appear directly under modifications, simulating real client IME
    // sessions in native apps
    imeContainer = document.createElement('div');
    imeContainer.style.position = 'absolute';
    imeContainer.style.left = window.pageXOffset + 'px';
    imeContainer.style.top = window.pageYOffset + 'px';
    imeContainer.style.width = '0px';
    imeContainer.style.height = '0px';
    imeContainer.style.zIndex = '-1';
    document.getElementById("citrixHTML5root").appendChild(imeContainer);
    
    // Create hidden IME buffer (<textarea>) which will always have focus in
    // the canvas, acting as a hidden text buffer to make client-side IME work
    // and to capture IME related events to propagate text changes to server
    textInput = document.createElement('textarea');
    textInput.setAttribute('rows', '1');
    textInput.setAttribute('id', 'CitrixClientImeBuffer');
    textInput.style.height = '0px';
    textInput.style.width = '0px';
    textInput.style.resize = 'none';
    textInput.style.border = 'none';
    textInput.style.outline = 'none';
    textInput.style.overflow = 'hidden';
    textInput.style.background = 'transparent';
    textInput.style.color = 'rgba(0,0,0,0)';
    if (traits.supports0FontSize) {
        textInput.style.fontSize = '0px';
    } else {
        textInput.style.fontSize = '10px';
    }
    
    imeContainer.appendChild(textInput);
	
    // Container holding textarea input
    this.Container = function container() {
        return imeContainer;
    };
	
    // Add event listener to text input element
    this.AddListener = function addListener(name, listener, useCapture) {
        textInput.addEventListener(name, listener, useCapture);
    };
	
    // Remove event listener from text input element
    this.RemoveListener = function removeListener(name, listener, useCapture) {
        textInput.removeEventListener(name, listener, useCapture);
    };
    
    this.Blur = function()
    {
    	textInput.style.display = "none";
    	textInput.blur();
    };
	
    // Place local cursor inside hidden text buffer
    this.Focus = function focus(evt,autoKbdCoords,isSessionZoomed) {
        if (evt) {
            // Make sure IME container is inside current view area so focus()
            // does not unintentionally move browser scroll bars
            // See BUG0321440
            
            // For non zero-font browsers make sure text input buffer takes
            // up no space when moved.  If width/height outside of current
            // view area, browser scroll bars can be affected
            if (!traits.supports0FontSize) {
                textInput.style.height = '0px';
                textInput.style.width = '0px';
            }
            
            // Move IME container to top-left position in page to not cause
            // any scroll bars to appear unexpectedly
            var x = window.pageXOffset;
            var y = window.pageYOffset;
            imeContainer.style.left = x + 'px';
            imeContainer.style.top = y + 'px';
            
            // Mark caret position as unknown to force repositioning when
            // IME becomes active again
            caretPositionKnown = false; 
        } else if(autoKbdCoords){						
			//Viewport movement when auto keyboard button is clicked
				imeContainer.style.position = "absolute";
				imeContainer.style.left = autoKbdCoords["left"];
				imeContainer.style.top = autoKbdCoords["top"];		
		}
        textInput.style.display = "block";
        textInput.focus();
    };
	
    // Clear out IME buffer and clear IME marker if needed
    this.ClearState = function clearState() {
        currentText = '';
        textInput.value = '';
        if (markPainter != null) {
            markPainter.Clear();
        }
    };

    // Look for new changes to IME buffer text and update server ICA session
    this.UpdateText = function updateText(text) {
        var currText = '';
        if (text != null && text != undefined) {
            // Use text data passed in by caller
            currText = text;
        } else {
            // Grab text user entered via IME editor
            currText = textInput.value;
        }
		
        // Compare with previous value
        var prev = 0;
        var curr = 0;
        var prevLen = currentText.length;
        var currLen = currText.length;
        for ( ; prev < prevLen && curr < currLen; prev++, curr++) {
            if (currentText.charCodeAt(prev) != currText.charCodeAt(curr)) {
                break;
            }
        }
		
        // Handle corner cases where caret was unknown but now is known
        // This happens when IME first used and caret update callback was just
        // registered for first time
        if (!isCaretStale() && isPositionStale(currText)) {
            // Move caret over a bit to cover beginning of word
            caretX -= fontSize;
            this.UpdatePosition();
        }

        // Notify mark painter text changes are about to happen
        if (markPainter != null && caretPositionKnown) {
            markPainter.TextUpdated(currText, fontSize);
        }
		
        // Push text change to server-side 
        if (prev < prevLen || curr < currLen) {
            var charsToRemove = prevLen - prev;
            var newText = '';
            if (curr < currLen) {
                newText = currText.substr(curr);
            }
            icaFrame.WriteUnicodeString(charsToRemove, newText);
        }
        currentText = currText;
    };

    // Move position of hidden IME buffer to specific point
    this.UpdatePosition = function updatePosition() {
        if (markPainter != null) {
            markPainter.Clear();
        }
		
        // Caret callback registration is lazy to optimize image handling
        // engine code for non-client IME locales.  See if we need to register
        if (!window.UpdateCaretPosition) {
            window.UpdateCaretPosition = updateCaretPosition;
        } 
		
        // See if caret position is stale, if so move to lower-left corner
        if (isCaretStale()) {
            caretPositionKnown = false;
			
            var left = window.pageXOffset + DEFAULT_X_POSITION;
            var top = window.pageYOffset + window.innerHeight - DEFAULT_Y_POSITION;
            imeContainer.style.left = left + 'px';
            imeContainer.style.top = top + 'px';
			
            // For browsers that don't support 0 font size, make sure font is
            // small to avoid text input cursor causing auto-scrolling
            if (!traits.supports0FontSize) {
                textInput.style.fontSize = '4px';
                var bufferWidth = window.innerWidth - DEFAULT_X_POSITION;
                textInput.style.width = bufferWidth + 'px';
                textInput.style.height = '80px';
            }
            return;
        }
        
        caretPositionKnown = true;
        currentPosX = caretX;
        currentPosY = caretY;
        var x = currentPosX + traits.xBufferOffset;
        var y = currentPosY + caretH + traits.yBufferOffset;
		
        if (traits.supports0FontSize) {
            imeContainer.style.left = x + 'px';
            imeContainer.style.top = y + 'px';
        } else {
            // Account for non-zero font height
            y -= fontSize;
            positionWithPadding(x, y);
        }
    };
	
    // Position text input using text-indent padding to prevent auto-scrolling
    // when text cursor goes beyond screen. Instead text will wrap within page 
    var positionWithPadding = function(x, y) {
        textInput.style.fontSize = fontSize + 'px';
        var leftMargin = window.pageXOffset;
        var paddingNeeded = x - leftMargin;
        var bufferWidth = window.innerWidth - 10;
		
        // Moving IME cursor into place before text entered
        imeContainer.style.left = leftMargin + 'px';
        imeContainer.style.top = y + 'px';
        textInput.style.textIndent = paddingNeeded + 'px';
		
        // Make text buffer as big as possible while still fitting in page
        var bufferHeight = window.pageYOffset + window.innerHeight - y;
        textInput.style.width = bufferWidth + 'px';
        textInput.style.height = bufferHeight + 'px';
    };

    // Update activity time to compare against last caret detection time
    this.UpdateActivityTime = function updateActivityTime() {
        var date = new Date();
        lastUserActivity = date.getTime();
    };
	
    // See if last caret detection is too old to be considered valid
    var isCaretStale = function() {
        return lastUserActivity - lastCaretDetected > CARET_EXPIRY_MS;
    };
	
    // See if current buffer position is significantly different where the
    // caret currently is
    var isPositionStale = function(currText) {
        if (!caretPositionKnown) {
            return true;
        }
		
        // Only consider positions where text has just begun getting entered
        // otherwise natural caret updates/new lines will be considered
        if (currText.length > 1) {
            return false;
        }
		
        // Check if current position is on different line than caret
        if (currentPosY < caretY - caretH || currentPosY > caretY + caretH) {
            return true;
        }
		
        // Check if current X position far from caret
        if (currentPosX - caretX < -fontSize * 2
            || currentPosX - caretX > fontSize * 2) {
            return true;
        }
		
        return false;
    };
	
    // Caret change handler method
    var updateCaretPosition = function(x, y, w, h) {
        // Record time to determine how stale caret position info is later
        var date = new Date();
        lastCaretDetected = date.getTime();
        
        // Caret update logic ported from iOS Receiver method:
        // SessionViewController.adjustViewportForCaretLocation
	
        // First see if this is new caret position (moved beyond incremental
        // striping)
        var newPosition = false;
        if (caretX + caretW < x || x + w < caretX || // Horizontal separation
            caretY + caretH < y || y + h < caretY) { // Vertical separation
            
            // Store new caret position
            caretX = x;
            caretY = y;
            caretW = w;
            caretH = h;
            newPosition = true;
        } else {
            // Join adjacent rectangles to update original caret rect
            var joinedRight = Math.max(caretX + caretW, x + w);
            var joinedBottom = Math.max(caretY + caretH, y + h);
            caretX = Math.min(caretX, x);
            caretY = Math.min(caretY, y);
            caretW = joinedRight - caretX;
            caretH = joinedBottom - caretY;
        }

        // Estimate font size based on current caret height
        fontSize = Math.round(caretH / 1.2);
		
        if (markPainter != null) {
            markPainter.CaretUpdated(caretX, caretY, caretH, newPosition);
        }
    };
	
    // Wrapper for mouse events, passing events to caller's handler
    var propagateEvent = function(evt) {
        eventHandler(evt);
        return false;
    };
	
    // Mouse handlers to propagate  mouse events to parent's handler so IME
    // buffer does not interfere with canvas interaction
    imeContainer.addEventListener('mousedown', propagateEvent, false);
    imeContainer.addEventListener('mouseup', propagateEvent, false);
    imeContainer.addEventListener('mousemove', propagateEvent, false);
    imeContainer.addEventListener('mouseout', propagateEvent, false);
    imeContainer.addEventListener('mouseover', propagateEvent, false);
}


