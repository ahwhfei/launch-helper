// IME Traits class describes browser+OS dependent behaviors and capabilities
function ImeTraits(name, supported, implicitImeCommitSupported,
	keyDownBeforeStart, chineseViaTextInputEvent, supports0FontSize,
    supportsTransparentText, xBufferOffset, yBufferOffset)
{
	// Unique name of browser/OS
	this.name = name;
	
	// Is client-side IME supported
	this.supported = supported;
	
	// Does a <<compositionend>> event occur when starting a new word when the
	// IME is in a selection state implicitly committing the previous word
	this.implicitImeCommitSupported = implicitImeCommitSupported;
	
	// Does a normal (non-IME 229) <<keydown>> event occur on first key
	// starting IME session before <<compositionstart>> event.  This occurs
	// in Firefox on Mac OS X
	this.keyDownBeforeStart = keyDownBeforeStart;
	
	// Do some Chinese IME text events cause IME 229 <<keydown>> event but
    // no <<composition*>> events.  Instead <<keydown>> is directly followed
    // by <<textInput>>.  Occurs on WebKit browsers from TC and SC IME editors
    // on Windows.  See BUG0310996
	this.chineseViaTextInputEvent = chineseViaTextInputEvent;
	
	// Does browser support 0pt font-size making text have no width.
	// Non-Webkit browsers support this.  0pt font is useful for avoiding
	// problems where text cursor in hidden IME buffer goes beyond the current
	// web page boundary cauing the page to auto-scroll
	this.supports0FontSize = supports0FontSize;
	
	// Does browser support transparent (invisible) text
	this.supportsTransparentText = supportsTransparentText;
	
	// X-offset to position ImeBuffer in correct place for displaying IME menus
	this.xBufferOffset = xBufferOffset;
	
	// Y-offset to position ImeBuffer in correct place for displaying IME menus
	this.yBufferOffset = yBufferOffset;
}

// Find browser type and return IME traits specific for this browser
ImeTraits.Detect = function detect() {
	
	// Use user-agent to detect browser/OS combination
	var userAgent = navigator.userAgent.toLowerCase();
	var isIos = /ipad/.test(userAgent) || /iphone/.test(userAgent);
	var isOpera = /opera/.test(userAgent);
	
	// Handle explicitly unsupported browser, Opera
	if (isOpera) {
		return ImeTraits.TraitsList.Unsupported;
	}
	
	var isWebkit = /webkit/.test(userAgent);
	var isMsie = /msie/.test(userAgent);
	var isFirefox = !isWebkit && !isMsie && /mozilla/.test(userAgent);
	
	if (isFirefox) {
		var isMac = /mac/.test(userAgent);
		return isMac
			? ImeTraits.TraitsList.FirefoxMac
			: ImeTraits.TraitsList.Firefox;
	}
	if(isIos){
		//BUG0619205 : Similar to webkit except supports0FontSize set to true to avoid blue cursor
		return ImeTraits.TraitsList.iOS;
	}
	if (isWebkit) {
		return ImeTraits.TraitsList.Webkit;
	}
	
	if (isMsie) {
		return ImeTraits.TraitsList.IE9;
	}
	
	return ImeTraits.TraitsList.Unsupported;
};

// List of browser/OS specific IME traits
ImeTraits.TraitsList = {
	Webkit: new ImeTraits("Webkit",
		true,  // supported
		true,  // implicitImeCommitSupported
		false, // keyDownBeforeStart
		true,  // chineseViaTextInputEvent
		false, // supports0FontSize
		true,  // supportsTransparentText
		0,     // xBufferOffset
		4      // yBufferOffset
	),
	Firefox: new ImeTraits("Firefox",
		true,  // supported
		true,  // implicitImeCommitSupported
		false, // keyDownBeforeStart
		false, // chineseViaTextInputEvent
		true,  // supports0FontSize
		true,  // supportsTransparentText
		0,     // xBufferOffset
		4      // yBufferOffset
	),
	FirefoxMac: new ImeTraits("Firefox (Mac)",
		true,  // supported
		true,  // implicitImeCommitSupported
		true,  // keyDownBeforeStart
		false, // chineseViaTextInputEvent
		true,  // supports0FontSize
		true,  // supportsTransparentText
		0,     // xBufferOffset
		4      // yBufferOffset
	),
	IE9: new ImeTraits("IE9",
		true,  // supported
		false, // implicitImeCommitSupported
		false, // keyDownBeforeStart
		false, // chineseViaTextInputEvent
		true,  // supports0FontSize
		false, // supportsTransparentText
		0,     // xBufferOffset
		4      // yBufferOffset
	),
	Unsupported: new ImeTraits("Unsupported",
		false, // supported
		false, // implicitImeCommitSupported
		false, // keyDownBeforeStart
		false, // chineseViaTextInputEvent
		false, // supports0FontSize
		false, // supportsTransparentText
		0,     // xBufferOffset
		0      // yBufferOffset
	),
	iOS: new ImeTraits("Webkit",
		true,  // supported
		true,  // implicitImeCommitSupported
		false, // keyDownBeforeStart
		true,  // chineseViaTextInputEvent
		true, // supports0FontSize
		true,  // supportsTransparentText
		0,     // xBufferOffset
		4      // yBufferOffset
	)
};
