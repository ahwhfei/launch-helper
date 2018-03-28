function ICAFrame(x, y, wd, ht) {
	this.width = wd;
	this.height = ht;
	var callBackWrapper = null;
	var keyDown = "keydown";
	var keyUp = "keyup";
	var keyPress = "keypress";
	var mouseDown = "mousedown";
	var mouseUp = "mouseup";
	var mouseMove = "mousemove";
	var mouseWheel = "mousewheel";
	var ffmousewheel = "DOMMouseScroll";
	var myself = this;
	var numLockDown = false;
	var capsLockDown = false;
	var capsLockInitial = false;
	var scrollLockDown = false;
    var searchKeyDown = false;
	var CAPS_LOCK_FLAG = 0x40;
	var NUM_LOCK_FLAG = 0x20;
	var SCROLL_LOCK_FLAG = 0x10;
	var win = window;

	var SHIFT_KEYCODE = 16;
	var CTRL_KEYCODE = 17;
	var ALT_KEYCODE = 18;
	var DELETE_KEYCODE = 46;
	var WIN_KEYCODE = 91;
	var gestureObject = null;
	var mobileUI = null;
	// Chrome+Mac: detect Apple Command key events used to convert to Ctrl
	var isMac = /mac/i.test(navigator.userAgent);
	this.searchKeyPressed = false;
	var ruCombinationKeyDown = false;
	var kbdLayout = undefined;
    var searchKeyDownTimer = null;
	var searchKeyDownTimeOutValue = 5000; // 5 secs
    
	HTML5Interface.getClientInfo(function(langID){
		kbdLayout = langID['KbdLayout'];
		KeyMapping.kbdLayout = kbdLayout;
	});
	if (PlatformInfo["browserid"] == BrowserInfo["FIREFOX"]) {
		var COMMAND_KEYCODE = 224;
		var RUSSIAN_LANGUAGE_ID = 1049;

		// TODO Need to verify that when keyboard/mouse event occurs we will pass it to WD only if focus is in session....
		this.KeyBoardEventHandler = function keyBoardEventHandler(event, evType) {
			if (callBackWrapper != null) {

				var key = event.keyCode;
				if (evType == keyDown) {
					if (key == 144)//num Lock
					{
						numLockDown = !numLockDown;
						callBackWrapper.writePacketSetLed(GetLEDFlags());
					} else if (key == 145) {
						scrollLockDown = !scrollLockDown;
						callBackWrapper.writePacketSetLed(GetLEDFlags());
					} else if (key == 20)//caps lock
					{
						capsLockDown = !capsLockDown;
						callBackWrapper.writePacketSetLed(GetLEDFlags());
					} else if (key == 93) {
						var icaKey = new IcaKey(false, ' ');
						icaKey.KeyChar = key;

						this.searchKeyPressed = true;
						callBackWrapper.writePacketKeyboardUnicode(4, 2);
						//ctrl down
						callBackWrapper.writePacketKeyboardUnicode(99, 0);
						//c down
						callBackWrapper.writePacketKeyboardUnicode(99, 1);
						//c up
						callBackWrapper.writePacketKeyboardUnicode(4, 3);
						//ctrl up

						setTimeout(function() {
							myself.searchKeyPressed = false;
						}, 1000);

					} else if(KeyMapping.keyCodeToScanCode[key]!=undefined && kbdLayout == RUSSIAN_LANGUAGE_ID && this.CtrlKey(event) && !event.altKey && !event.shiftKey)
					{
						callBackWrapper.writePacketKeyboardSingleScanCode(KeyMapping.keyCodeToScanCode[key], false);
						ruCombinationKeyDown = true;
					} else {
						var icaKey = null;

						if (!numLockDown && key >= 96 && key <= 111) {
							numLockDown = true;
							callBackWrapper.writePacketSetLed(GetLEDFlags());
						}
						if (key === CTRL_KEYCODE) {
							modifierStates.ctrlKey = true;
						} else if (key === ALT_KEYCODE) {
							modifierStates.altKey = true;
						} else if (key === SHIFT_KEYCODE) {
							modifierStates.shiftKey = true;
						} else if (key === COMMAND_KEYCODE) {
							// Command key on Mac, map to Ctrl
							modifierStates.ctrlKey = true;
							icaKey = KeyMapping.Converter[CTRL_KEYCODE];
						}

						if (!icaKey) {
							icaKey = KeyMapping.ScanCodeToKey1(event);
							// This is to differentiate between Enter Key and NumPad Enter Key. We might need to do this for Right and Left Ctrl,Alt,Shift
							if(event.keyCode == 13 && event.location == 3) {
								icaKey = new IcaKey(true, 50);
							} else if (event.keyCode == CTRL_KEYCODE && (event.location == 2 || event.keyLocation == 2)) {
								// handle with right Ctrl, location = 1 is left Ctrl
								icaKey = new IcaKey(true, 51);
							}
						}
						if ((icaKey.KeyChar == 219 || icaKey.KeyChar == 221) && modifierStates.ctrlKey && modifierStates.altKey) return;
						KeyEventNormal(icaKey, true);
					}
				} else if (evType == keyUp) {
					if (key == 44)//PrintScreen
					{
						//print screen only fires Keyup events
						KeyEventNormal(KeyMapping.ScanCodeToKey1(event, evType), true);
						//send down
						KeyEventNormal(KeyMapping.ScanCodeToKey1(event, evType), false);
						//send up

					}
					if(KeyMapping.keyCodeToScanCode[key] != undefined && kbdLayout == RUSSIAN_LANGUAGE_ID && ruCombinationKeyDown) {
						callBackWrapper.writePacketKeyboardSingleScanCode(KeyMapping.keyCodeToScanCode[key], true);
						ruCombinationKeyDown = false;
						return;
					}
					if (key != 144 && key != 20 && key != 145) {
						var icaKey = null;

						if (key === CTRL_KEYCODE) {
							modifierStates.ctrlKey = false;
						} else if (key === ALT_KEYCODE) {
							myself.updateAltModifier(event);

							if (event.returnValue != null) {
								event.keyCode = 0;
								event.returnValue = false;
							}
							if (event.cancelBubble != null)
								event.cancelBubble = true;
							if (event.stopPropagation)
								event.stopPropagation();
							if (event.preventDefault)
								event.preventDefault();
							return false;

						} else if (key === SHIFT_KEYCODE) {
							modifierStates.shiftKey = false;
						} else if (key == COMMAND_KEYCODE) {
							// Command key on Mac, map to Ctrl
							modifierStates.ctrlKey = false;
							icaKey = KeyMapping.Converter[CTRL_KEYCODE];
						}

						if (!icaKey) {
							icaKey = KeyMapping.ScanCodeToKey1(event);
							// This is to differentiate between Enter Key and NumPad Enter Key. We might need to do this for Right and Left Ctrl,Alt,Shift
							if(event.keyCode == 13 && event.location == 3) {
								icaKey = new IcaKey(true, 50);
							} else if (event.keyCode == CTRL_KEYCODE && (event.location == 2 || event.keyLocation == 2)) {
								// handle with right Ctrl, location = 1 is left Ctrl
								icaKey = new IcaKey(true, 51);
							}
						}
						if ((icaKey.KeyChar == 219 || icaKey.KeyChar == 221) && modifierStates.ctrlKey && modifierStates.altKey) return;
						KeyEventNormal(icaKey, false);
					}

				} else if (evType == keyPress) {
					/*
					 * handling capslock in key press only code A-Z (65-90) && a-z (97-122)
					 * other overlapped key ( as numlock key having same keycode ) is handled before
					 * so in this keypress no need for worry
					 *
					 */
					var is_capschange = false;
					if (event.shiftKey) {
						if ((!capsLockDown) && (key >= 97) && (key <= 122)) {
							is_capschange = true;
						} else if (capsLockDown && (key >= 65) && (key <= 90)) {
							is_capschange = true;
						}
					} else {
					/* First time  when the session is started, we send the state of capsLock. If we don't do this previous session capsLock state will be used which is wrong.
					  Refer BUG0648652 for more*/
						if(!capsLockInitial)
						{
							capsLockInitial = true;
							callBackWrapper.writePacketSetLed(GetLEDFlags());
						}
						if (capsLockDown && (key >= 97) && (key <= 122)) {
							is_capschange = true;
						} else if ((!capsLockDown) && (key >= 65) && (key <= 90)) {
							is_capschange = true;
						}
					}
					if (is_capschange) {
						capsLockDown = !capsLockDown;
						callBackWrapper.writePacketSetLed(GetLEDFlags());
					}
					if (modifierStates.ctrlKey && modifierStates.altKey) {
						callBackWrapper.writePacketKeyboardUnicode(event.keyCode || event.which, 4);
					} else {
						KeyEventPress(KeyMapping.ScanCodeToKey1(event, evType));
					}
				}
			}
		};
	} else {
		var LEFT_COMMAND_KEYCODE = 91;
		var RIGHT_COMMAND_KEYCODE = 93;
		var RUSSIAN_LANGUAGE_ID = 1049;

		// TODO Need to verify that when keyboard/mouse event occurs we will pass it to WD only if focus is in session....
		this.KeyBoardEventHandler = function keyBoardEventHandler(event) {
			if (callBackWrapper != null) {
				var evType = event.type;
				var key = event.keyCode;
				if (evType == keyDown) {
					if (key == 144)//num Lock
					{    
						numLockDown = !numLockDown;
						callBackWrapper.writePacketSetLed(GetLEDFlags());
					} else if (key == 145) {
						scrollLockDown = !scrollLockDown;
						callBackWrapper.writePacketSetLed(GetLEDFlags());
					} else if (key == 20)//caps lock
					{
						capsLockDown = !capsLockDown;
						callBackWrapper.writePacketSetLed(GetLEDFlags());
					} else if(KeyMapping.keyCodeToScanCode[key]!=undefined && kbdLayout == RUSSIAN_LANGUAGE_ID && this.CtrlKey(event) && !event.altKey && !event.shiftKey)
					{
						callBackWrapper.writePacketKeyboardSingleScanCode(KeyMapping.keyCodeToScanCode[key], false);
						ruCombinationKeyDown = true;
					}
					 else {
						var icaKey = null;

						if (!numLockDown && key >= 96 && key <= 111) {
							numLockDown = true;
							callBackWrapper.writePacketSetLed(GetLEDFlags());
						}
						if (key === CTRL_KEYCODE) {
							modifierStates.ctrlKey = true;
						} else if (key === ALT_KEYCODE) {
							modifierStates.altKey = true;
						} else if (key === SHIFT_KEYCODE) {
							modifierStates.shiftKey = true;
						} else if (isMac && (key === LEFT_COMMAND_KEYCODE || key === RIGHT_COMMAND_KEYCODE)) {
							// Command key on Mac, map to Ctrl
							modifierStates.ctrlKey = true;
							icaKey = KeyMapping.Converter[CTRL_KEYCODE];
						}
						// win/search key pressed on chrome book
                        else if(isChromeOS && key == 91){
							searchKeyDown = true;
							// when user presses "search/windows + L" to lock system, windows keydown gets stuck inside session
							// So resetting it by sending Win keyup event after 5 seconds
							if (event.repeat) {
                            	clearTimeout(searchKeyDownTimer);
								searchKeyDownTimer = null;
							}
							searchKeyDownTimer = setTimeout(function() {
												searchKeyDown = false;
												sendWinKeyUpEvent();
												searchKeyDownTimer = null;
											}, searchKeyDownTimeOutValue);
                    }
						if (!icaKey) {
							icaKey = KeyMapping.ScanCodeToKey(event.keyCode, null, event.shiftKey);
							// This is to differentiate between Enter Key and NumPad Enter Key. We might need to do this for Right and Left Ctrl,Alt,Shift
							if(event.keyCode == 13 && event.location == 3) {
								icaKey = new IcaKey(true, 50);
							} else if (event.keyCode == CTRL_KEYCODE && (event.location == 2 || event.keyLocation == 2)) {
								// handle with right Ctrl, location = 1 is left Ctrl
								icaKey = new IcaKey(true, 51);
							}
						}
						if ((icaKey.KeyChar == 219 || icaKey.KeyChar == 221) && event.ctrlKey && event.altKey) return;
						KeyEventNormal(icaKey, true);
					}
				} else if (evType == keyUp) {
					if (key == 44)//PrintScreen
					{
						//print screen only fires Keyup events
						KeyEventNormal(KeyMapping.ScanCodeToKey(event.keyCode, evType, event.shiftKey), true);
						//send down
						KeyEventNormal(KeyMapping.ScanCodeToKey(event.keyCode, evType, event.shiftKey), false);
						//send up

					}
					if(KeyMapping.keyCodeToScanCode[key] != undefined && kbdLayout == RUSSIAN_LANGUAGE_ID && ruCombinationKeyDown) {
						callBackWrapper.writePacketKeyboardSingleScanCode(KeyMapping.keyCodeToScanCode[key], true);
						ruCombinationKeyDown = false;
						return;
					}
                     if(isChromeOS && key === 91 && searchKeyDown === true){
                        //  cancel the searchKeyDownTimer that was started on keyDown event of search/win key
                        if (searchKeyDownTimer !== null) {
                            clearTimeout(searchKeyDownTimer);
							searchKeyDownTimer = null;
                        }
                        searchKeyDown = false;
                    }
					if (key != 144 && key != 20 && key != 145 ) {
						var icaKey = null;

						if (key === CTRL_KEYCODE) {
							modifierStates.ctrlKey = false;
						} else if (key === ALT_KEYCODE) {
							myself.updateAltModifier(event);

							if (event.returnValue != null) {
								event.keyCode = 0;
								event.returnValue = false;
							}
							if (event.cancelBubble != null)
								event.cancelBubble = true;
							if (event.stopPropagation)
								event.stopPropagation();
							if (event.preventDefault)
								event.preventDefault();
							return false;

						} else if (key === SHIFT_KEYCODE) {
							modifierStates.shiftKey = false;
						} else if (isMac && (key === LEFT_COMMAND_KEYCODE || key === RIGHT_COMMAND_KEYCODE)) {
							// Command key on Mac, map to Ctrl
							modifierStates.ctrlKey = false;
							icaKey = KeyMapping.Converter[CTRL_KEYCODE];
						}

						if (!icaKey) {
							icaKey = KeyMapping.ScanCodeToKey(event.keyCode, null, event.shiftKey);
							// This is to differentiate between Enter Key and NumPad Enter Key. We might need to do this for Right and Left Ctrl,Alt,Shift
							if(event.keyCode == 13 && event.location == 3) {
								icaKey = new IcaKey(true, 50);
							} else if (event.keyCode == CTRL_KEYCODE && (event.location == 2 || event.keyLocation == 2)) {
								// handle with right Ctrl, location = 1 is left Ctrl
								icaKey = new IcaKey(true, 51);
							}
						}
						if ((icaKey.KeyChar == 219 || icaKey.KeyChar == 221) && event.ctrlKey && event.altKey) return;
						KeyEventNormal(icaKey, false);
					}

				} else if (evType == keyPress) {
					/*
					 * handling capslock in key press only code A-Z (65-90) && a-z (97-122)
					 * other overlapped key ( as numlock key having same keycode ) is handled before
					 * so in this keypress no need for worry
					 *
					 */
					var is_capschange = false;
					if (event.shiftKey) {
						if ((!capsLockDown) && (key >= 97) && (key <= 122)) {
							is_capschange = true;
						} else if (capsLockDown && (key >= 65) && (key <= 90)) {
							is_capschange = true;
						}
					} else {
					
					/* First time  when the session is started, we send the state of capsLock. If we don't do this previous session capsLock state will used which is wrong.
					  Refer BUG0648652 for more*/
						if(!capsLockInitial)
						{
							capsLockInitial = true;
							callBackWrapper.writePacketSetLed(GetLEDFlags());
						}
						if (capsLockDown && (key >= 97) && (key <= 122)) {
							is_capschange = true;
						} else if ((!capsLockDown) && (key >= 65) && (key <= 90)) {
							is_capschange = true;
						}
					}
					if (is_capschange) {
						capsLockDown = !capsLockDown;
						callBackWrapper.writePacketSetLed(GetLEDFlags());
					}
					if (event.ctrlKey && event.altKey) {
						callBackWrapper.writePacketKeyboardUnicode(event.keyCode, 4);
					} else {
						KeyEventPress(KeyMapping.ScanCodeToKey(event.keyCode, evType, event.shiftKey));
					}
				}
			}
		};

	}

	var modifierStates = {
		shiftKey : false,
		altKey : false,
		ctrlKey : false
	};
	var isEUKSEnabled = false;
	this.EUKSEnabled = function(enabled) {
		isEUKSEnabled = enabled;
	};

	var KeyEventNormal = function keyEventNormal(icaKey, pressed) {
		if (icaKey.KeyChar != -1) {
			var code = (pressed == true) ? 0 : 1;

			if (icaKey.Special) {
				code += 2;
			}
			callBackWrapper.writePacketKeyboardUnicode(icaKey.KeyChar, code);
		}
	};

	var KeyEventPress = function(icaKey) {
		// Avoid Unicode Injection for printable ASCII range, whose scan codes are required for
		// East-Asian Windows IMEs and some older Windows applications.  This logic is taken partially
		// from iOS, Mac and Android receivers.  If there are some scenarios where Unicode Injection
		// is beneficial for this character range as well, the longer term approach would be to expose
		// a client-side setting to control this behavior (like iOS Receiver) or honoring the UNIKEY
		// keyword in ICA description field (like Android Receiver) to provide more flexibility
		if (isEUKSEnabled && !(icaKey.KeyChar >= 0x20 && icaKey.KeyChar <= 0x7e)) {
			// Code 4 belongs to UNICODE_INJECTION. Only one event is required by XenApp in case of Unicode injection.
			// TODO IT will break if there is a case where server doesn't support EUKS capability, need to research the same..
			callBackWrapper.writePacketKeyboardUnicode(icaKey.KeyChar, 4);
		} else {
			KeyEventNormal(icaKey, true);
			KeyEventNormal(icaKey, false);
		}
	};

	this.SetCallBackWrapper = function SetCallBackWrapper(callBackWrapper1) {
		callBackWrapper = callBackWrapper1;
	};
	// Possibly remove characters and insert Unicode string
	// Method needed for client IME support (Globalization)
	this.WriteUnicodeString = function writeUnicodeString(numRemove, str) {
		if (callBackWrapper != null && str != null) {
			for (var r = 0; r < numRemove; r++) {
				// Send backspace key as many times as needed
				KeyEventNormal(KeyMapping.Converter[8], true);
				KeyEventNormal(KeyMapping.Converter[8], false);
			}

			for (var i = 0, strLen = str.length; i < strLen; i++) {
				var key = str.charCodeAt(i);
				if (isEUKSEnabled) {
					callBackWrapper.writePacketKeyboardUnicode(key, 4);
				} else {
					callBackWrapper.writePacketKeyboardUnicode(key, 0);
					callBackWrapper.writePacketKeyboardUnicode(key, 1);
				}
			}
		}
	};

	var GetLEDFlags = function getLEDFlags() {
		var flags = 0;
		flags |= ( capsLockDown ? CAPS_LOCK_FLAG : 0x0);
		flags |= ( numLockDown ? NUM_LOCK_FLAG : 0x0);
		flags |= ( scrollLockDown ? SCROLL_LOCK_FLAG : 0x0);

		// console.log("flags is" + flags + " capsLockDown " + capsLockDown);
		return flags;

	};

	// Returns whether CTRL key is down by checking event and modifer states
	// Needed when mapping Mac Command key to Ctrl key since Command key
	// does not set ctrlKey on key events
	this.CtrlKey = function ctrlKey(event) {
		return event.ctrlKey || modifierStates.ctrlKey;
	};

	this.setDisplayCursor = function(cursor, X, Y) {
		var mouseDiv = document.getElementById('MousePointerDiv');
		var seamlessParent = document.getElementById('seamlessui');
		if (seamlessParent) {
		  mouseDiv = seamlessParent;
		}
		mouseDiv.style.cursor = "default"; // Chrome has a bug where cursor is not updated correctly, this forces the update.
		var tempcursor = String("url(" + cursor + ") " + X + " " + Y + ",default");
        mouseDiv.style.cursor = tempcursor;
    if (displayManager) {
          displayManager.setCursor(tempcursor);
     }
		if(mobileUI != null)
			mobileUI.setCursorImage(cursor,X,Y);
	};

	//pass the touchevents for Gesture Detection
	this.MouseTouchEventHandler = function mouseTouchEventHandler(touchevent) {
		var canvas = MediaEncoder.canvas;
		var borderWidth = 0;
		if (callBackWrapper != null && canvas != null) {
			var rval = true;
			rval = gestureObject.touchEventHandler(touchevent);
			return rval;
		}
		return false;
	};
	this.updateAltModifier = function(event) {
		if (event == null)
			return;
		if (event.altKey !== modifierStates.altKey) {
			//send alt key event down/up
			if (event.altKey) {
				//send down
				KeyEventNormal(KeyMapping.Converter[ALT_KEYCODE], true);
			} else {
				//send up
				KeyEventNormal(KeyMapping.Converter[ALT_KEYCODE], false);
			}
			modifierStates.altKey = event.altKey;
		}

	};
	this.checkModifiers = function(event) {
		var isControlKey = event.ctrlKey;
		if(isMac){
		// event.metaKey flag indicates if the command key was pressed(true) or not(false)
		// since we map cmd key to ctrl key, isControlKey should consider both flags
			isControlKey = event.ctrlKey || event.metaKey;
		}
		if (event.shiftKey !== modifierStates.shiftKey) {

			//send shift key event down/up
			if (event.shiftKey) {
				//send down
				KeyEventNormal(KeyMapping.Converter[SHIFT_KEYCODE], true);
			} else {
				//send up
				KeyEventNormal(KeyMapping.Converter[SHIFT_KEYCODE], false);
			}
			modifierStates.shiftKey = event.shiftKey;
		}
		if (isControlKey !== modifierStates.ctrlKey && event.keyCode != CTRL_KEYCODE) {
			//send ctrl key event down/up
			if (isControlKey) {
				//send down
				KeyEventNormal(KeyMapping.Converter[CTRL_KEYCODE], true);
			} else {
				//send up
				KeyEventNormal(KeyMapping.Converter[CTRL_KEYCODE], false);
			}
			modifierStates.ctrlKey = isControlKey;
		}
	};

	this.keyboardEventbyCode = function(keycode, evtype) {
		var icaKey = KeyMapping.ScanCodeToKey(keycode, null, false);
		if (evtype == "keyDown") {
			KeyEventNormal(icaKey, true);
		} else {
			KeyEventNormal(icaKey, false);
		}

	};
	this.setGestureObject = function(obj) {
		gestureObject = obj;
	};
	this.setMobileUI = function(obj) {
		mobileUI = obj;
	};
	

	this.MouseEventHandler = function mouseEventHandler(event) {
		var canvas = MediaEncoder.canvas;
		var borderWidth = 0;
		var clientPoint = new Point(event.clientX, event.clientY);
		clientPoint = Utility.convertPointToVdaCoordinates(clientPoint);
		if (callBackWrapper != null && canvas != null) {
			var evType = event.type;
			var X = clientPoint.X - canvas.offsetLeft - borderWidth + win.pageXOffset;
			var Y = clientPoint.Y - canvas.offsetTop - borderWidth + win.pageYOffset;
			if (evType === mouseDown) {
				callBackWrapper.mousePressed(X, Y, event.button);
			} else if (evType === mouseUp) {
				callBackWrapper.mouseReleased(X, Y, event.button);
			} else if (evType === mouseMove) {
				callBackWrapper.mouseMoved(X, Y);
			} else if (evType === mouseWheel || evType === ffmousewheel) {

				callBackWrapper.mouseWheelMoved(X, Y, event.wheelDelta);
			}
		}
		return false;
	};
	this.mouseDownByCoordinates = function(buttonType, X, Y) {
		var canvas = MediaEncoder.canvas;
		var borderWidth = 0;
		if (callBackWrapper != null && canvas != null) {
			X = X - canvas.offsetLeft - borderWidth;
			Y = Y - canvas.offsetTop - borderWidth;
			// On touch devices except IOS devices, touch coordinates we get includes pageXOffset, pageYOffset.
			// So no need to add them
			if(g.environment.os.isIOS){
				X += win.pageXOffset;
				Y += win.pageYOffset;
			}
			callBackWrapper.mousePressed(X, Y, buttonType);
		}
	};
	this.mouseUpByCoordinates = function(buttonType, X, Y) {
		var canvas = MediaEncoder.canvas;
		var borderWidth = 0;
		if (callBackWrapper != null && canvas != null) {
			X = X - canvas.offsetLeft - borderWidth;
			Y = Y - canvas.offsetTop - borderWidth;
			// On touch devices except IOS devices, touch coordinates we get includes pageXOffset, pageYOffset.
			// So no need to add them
			if(g.environment.os.isIOS){
				X += win.pageXOffset;
				Y += win.pageYOffset;
			}
			callBackWrapper.mouseReleased(X, Y, buttonType);
		}
	};
	this.MouseMoveByCoordinates = function(X, Y) {
		var canvas = MediaEncoder.canvas;
		var borderWidth = 0;
		if (callBackWrapper != null && canvas != null) {
			X = X - canvas.offsetLeft - borderWidth;
			Y = Y - canvas.offsetTop - borderWidth;
			// On touch devices except IOS devices, touch coordinates we get includes pageXOffset, pageYOffset.
			// So no need to add again
			if(g.environment.os.isIOS){
				X += win.pageXOffset;
				Y += win.pageYOffset;
			}
			callBackWrapper.mouseMoved(X, Y);
		}

	};
	this.mouseWheelMoveByCoordinates = function(X, Y, distance) {
		var canvas = MediaEncoder.canvas;
		var borderWidth = 0;
		if (callBackWrapper != null && canvas != null) {
			X = X - canvas.offsetLeft - borderWidth;
			Y = Y - canvas.offsetTop - borderWidth;
			// On touch devices except IOS devices, touch coordinates we get includes pageXOffset, pageYOffset.
			// So no need to add them
			if(g.environment.os.isIOS){
				X += win.pageXOffset;
				Y += win.pageYOffset;
			}
			callBackWrapper.mouseWheelMoved(X, Y, distance);
		}
	};
	//Sends CAD to session
	this.initiateCtrlAltDel = function(){
		// when user presses "search/windows + L" to lock system, windows keydown gets stuck inside session
		// So resetting it by sending Win keyup event
		sendWinKeyUpEvent();
		myself.SendCustomKeyEvents([CTRL_KEYCODE,ALT_KEYCODE,DELETE_KEYCODE]);
	};	
	this.SendCustomKeyEvents = function SendCustomKeyEvents(keys) {				
		//send down
		for(var i=0;i<keys.length;i++){
			KeyEventNormal(KeyMapping.Converter[keys[i]], true);
		}
		// send up
		for(var i=keys.length-1;i>=0;i--){
			KeyEventNormal(KeyMapping.Converter[keys[i]], false);
		}
	};
	this.SendPasteCommand = function() {
		var icaKey = new IcaKey(false, ' ');
		icaKey.KeyChar = 118;
		KeyEventNormal(icaKey, true);
		KeyEventNormal(icaKey, false);
	};
	var sendWinKeyUpEvent = function(){
		KeyEventNormal(KeyMapping.Converter[WIN_KEYCODE], false);
	};

}