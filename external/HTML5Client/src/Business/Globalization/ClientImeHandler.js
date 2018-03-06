// Client IME state handler, tracks local IME editor state, updating
// IME buffer position and ICA session text data accordingly
function ClientImeHandler(icaFrame, eventHandler)
{
	// Special key code indicating IME activity used by IE, Chrome, Safari,
	// and Firefox on Windows.
	var WIN_IME_KEYCODE = 229;
    
	var imeBuffer = null;
	var isImeActive = false;
	var imeEventsRegistered = false;
	var lastEvent = '';
	var lastKeyDownEvent = null;
	var lastKeyDownCode = 0;
	var textInputData = null;
	var willSendInputDataByKeyUp = false;
	
	// Detect IME-related traits for this browser
	var traits = ImeTraits.Detect();
	
	// Called from parent body mouseup handler to ensure IME buffer has focus
	// to always receive key events
	this.MouseUpInCanvas = function mouseUpInCanvas(evt) {
		if (traits.supported) {
			imeBuffer.Focus(evt);
			imeBuffer.UpdateActivityTime();
		}
	};
    
	// Is client IME session is currently active
	this.IsActive = function isActive() {
		return isImeActive;
	};
    
	// If not supported do not create IME buffer or register any events
	if (!traits.supported) {
		return;
	}
	
	// Set focus on IME buffer immediately at load time to capture all text
	imeBuffer = new ImeBuffer(icaFrame, eventHandler, traits, true);
	//create a reference to imeBuffer
	this.imeBufferObject = imeBuffer;
	// in case of touch devices keyboard will pop up, which we don't want
	if(!(PlatformInfo["isTouchOS"]))
	{
		imeBuffer.Focus(null);
	}

	// Some browsers (i.e. Firefox) fire a <<keydown>> event before
	// <<compositionstart>>. In Windows, the keyCode for this event is always
	// 229, but in OS X it can be the actual key pressed.  Since we do not know
	// if this key down is the beginning of an IME session, hold on to it and
	// prevent the main event handler from processing until we know it is not
	// an IME related event and can be passed as normal to ICA engine
	var keyDownEventHandler = function(evt) {
		lastEvent = 'keydown';
        lastKeyDownCode = evt.keyCode;
		// Do not hold up special keys including Command key on Mac (224)
		if (evt.keyCode != WIN_IME_KEYCODE && !evt.ctrlKey && !evt.altKey
			&& !evt.shiftKey && evt.keyCode != 224) {
			if (traits.keyDownBeforeStart) {
				lastKeyDownEvent = evt;
				evt.stopPropagation();
			} else {
				imeBuffer.UpdateActivityTime();
			}
		}
		
		// BUG0532314, if some data is input in textInput event and the keyCode of 
		// keydown event is 229, the input data would be sent to VDA in "keyUpEventHandler".
		if ((textInputData) && (evt.keyCode == WIN_IME_KEYCODE)) {
			willSendInputDataByKeyUp = true;
		}
	};

	// See if <<keydown>> event is being held captive. Key press/up events do
	// not happen if IME is being activated
	var keyPressEventHandler = function(evt) {
		// Note: not recording lastEvent for keypress because keypress events
		// happen on some browsers for non-key-related events such as direct
		// input from Character Viewer or Trackpad Handwriting in OS X
		if (lastKeyDownEvent) {
			eventHandler(lastKeyDownEvent);
			lastKeyDownEvent = null;
			imeBuffer.UpdateActivityTime();
		}
	};

	var keyUpEventHandler = function(evt) {
		lastEvent = 'keyup';
		if (lastKeyDownEvent) {
			eventHandler(lastKeyDownEvent);
			lastKeyDownEvent = null;
			imeBuffer.UpdateActivityTime();
		}
		
		// BUG0532314, if the input data in textInput event is number or symbol and 
		// the keyCode of keydown event is 229, the data would be sent to VDA here.
		if (textInputData && willSendInputDataByKeyUp && isNumberOrSymbol(textInputData)) {
			icaFrame.WriteUnicodeString(0, textInputData);
			textInputData = null;
			willSendInputDataByKeyUp = false;
		}
	};
	
	// BUG0532314, check whether the input string is alphabet character, number or symbol in SC, TC and JA languages.
	function isNumberOrSymbol(str) {
		return (/^[\x20-\x7E\u3000-\u303f\uff00-\uff9f\u00a5]*$/.test(str) || (['‘', '’', '“', '”', '——'].indexOf(str) >= 0));
	}

	// Handles <<compositionstart>> events which mark beginning of IME session
	var startImeHandler = function(evt) {
		lastEvent = 'compositionstart';
        
		// Clear last key down event state now that we know IME is active
		lastKeyDownEvent = null;

		// Handle spurious repeat compositionstart event
		if (!isImeActive) {
			// Move IME buffer into place so IME selection drop-downs are
			// positioned beneath live text being entered
			imeBuffer.UpdatePosition();
		
			// Update IME state
			isImeActive = true;
		}
	};

	// Process IME <<compositionupdate>> event
	var updateImeHandler = function(evt) {
		lastEvent = 'compositionupdate';
	};
	
	// <<input>> events signify text changes in the text buffer and are the
	// most consistent way of detecting IME changes across browsers
	var inputEventHandler = function(evt) {
		if (isImeActive || (lastEvent !== 'keydown' && lastEvent !== 'keyup')) {
			imeBuffer.UpdateText();
		}
		
		// Two <<input>> events in a row signifies active word was implicitly
		// confirmed by starting a new word while IME was in selection mode
		// Update IME hidden input buffer position
		if (!isImeActive) {
			imeBuffer.ClearState();
		} else if (!traits.implicitImeCommitSupported && lastEvent === 'input') {
			imeBuffer.UpdatePosition();
		}
		
		lastEvent = 'input';
	};
	
	// <<textInput>> events also signify text changes in the text buffer on
    // WebKit-based browsers.  Need to track this event to handle some IME
    // key events that do not trigger <<composition*>> events such as
    // shift+printable-key combinations in Chinese IME like Traditional
    // Chinese New Phonetic IME (BUG0310996).  In those cases, a
    // <<keydown: keyCode==229>> event is directly followed by <<textInput>>
	var textInputEventHandler = function(evt) {
		if (!isImeActive
            && evt.data
            && lastEvent === 'keydown'
            && lastKeyDownCode == WIN_IME_KEYCODE) {
            // Write IME data directly to ICA session instead of through
            // ImeBuffer to avoid underline which is not desired
            icaFrame.WriteUnicodeString(0, evt.data);
		}
		
		// BUG0532314
		// Root cause: In Mac Safari, when the user inputs a number or symbol key like "2"
		// 			   with IME, the events caught are "textInput(data=2), keydown(keyCode=229) 
		//			   and keyup(keyCode=50)", the above code can't handle this condition, so that
		//			   the numbers and symbols in IME couldn't be sent to VDA.
		// Solution: Use two marks "textInputData" and "willSendInputDataByKeyUp" to mark the event 
		//			 list, if the two marks are positive, the input data would be sent to VDA in "keyUpEventHandler".		 
		if ((PlatformInfo["browserid"] == BrowserInfo["SAFARI"]) && (PlatformInfo["OS"] == OSInfo["MAC"]) && !isImeActive && evt.data) {
			textInputData = evt.data;
		}
	};

	// Process <<compositionend>> events signifying word has been confirmed
	var endImeHandler = function(evt) {
		lastEvent = 'compositionend';
		
		// Simply mark IME as inactive, text updates are handled in <<input>>
		isImeActive = false;
	};
    
	var registerImeEvents = function() {
		if (imeEventsRegistered) {
			return;
		}
        
		// All modern browsers except Opera fire composition events
		imeBuffer.AddListener('compositionstart', startImeHandler, false);
		imeBuffer.AddListener('compositionupdate', updateImeHandler, false);
		imeBuffer.AddListener('compositionend', endImeHandler, false);

		// <<input>> events are used to detect IME buffer text changes
		// generically across the different browsers
		imeBuffer.AddListener('input', inputEventHandler, false);
        
        // <<textInput>> events happen in WebKit browsers but are only tracked
        // here to handle some special cases with Chinese IMEs in Windows
        if (traits.chineseViaTextInputEvent) {
            imeBuffer.AddListener('textInput', textInputEventHandler, false);
        }
        
		// Track last event history and do key proxying for some browsers
		imeBuffer.AddListener('keydown', keyDownEventHandler, true);
		imeBuffer.AddListener('keypress', keyPressEventHandler, true);
		imeBuffer.AddListener('keyup', keyUpEventHandler, true);

		imeEventsRegistered = true;
	};
    
	// Register IME events
	registerImeEvents();
}
