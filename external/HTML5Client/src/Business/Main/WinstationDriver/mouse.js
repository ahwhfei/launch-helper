function MouseHandler(wd) {
	var winDriver = wd;
	var SIZEOF_MOUSEDATA = 5;
	var SIZEOF_MOUSEDATA_EXTENDED = 8;
	var PACKET_MOUSE_EXTENDED1 = 0x3D;
	var PACKET_MOUSE_EXTENDED2 = 0x3E;
	var PACKET_MOUSE0 = 0x0D;
	var PACKET_MOUSE1 = 0x0E;
	var PACKET_MOUSE2 = 0x0F;
	var fDeferMouse = false;
	var fMouseWheelSupported = false;
	var gDisplayWidth = 0, gDisplayHeight = 0;
	/*
	 * Below is min and max timer for mouse move delay
	 */
	var DefaultMouse_Move_Queue = 20;
	var MAX_MOUSE_MOVEDELAY = 900;
	var eventPosition = new Point(0, 0);
	var gUserInputEnabled = false;
	var context = null;
	/*
	 * This function is used for storing multiple mouse event data and
	 * send them when flush function is getting called
	 */
	function IcaMouseBuffer() {
		var writeBuffer = new Uint8Array(0);
		var appendOffset = 0;
		this.writeByte = function(data) {
			writeBuffer[appendOffset++] = data;
		};
		this.writeUint2 = function(data) {
			writeBuffer[appendOffset++] = data & 0xff;
			writeBuffer[appendOffset++] = (data >> 8) & 0xff;
		};
		this.writeMouseExtended = function(size, x, y, state, amount) {

			writeBuffer[appendOffset++] = size;
			writeBuffer[appendOffset++] = x & 0xff;
			writeBuffer[appendOffset++] = (x >> 8) & 0xff;
			writeBuffer[appendOffset++] = y & 0xff;
			writeBuffer[appendOffset++] = (y >> 8) & 0xff;
			writeBuffer[appendOffset++] = state & 0xff;
			writeBuffer[appendOffset++] = amount & 0xff;
			writeBuffer[appendOffset++] = (amount >> 8) & 0xff;

		};
		this.writePacketMouse = function(x, y, state) {
			writeBuffer[appendOffset++] = x & 0xFF;
			writeBuffer[appendOffset++] = (x >>> 8) & 0xFF;
			writeBuffer[appendOffset++] = y & 0xFF;
			writeBuffer[appendOffset++] = (y >>> 8) & 0xFF;
			writeBuffer[appendOffset++] = state & 0xFF;
		};
		this.flush = function() {
			if (appendOffset > 0) {
				winDriver.writeByte(writeBuffer, 0, appendOffset);
			}
			appendOffset = 0;
		};
		this.allocateBuffer = function(len) {
			var i;
			if ((appendOffset + len) > writeBuffer.length) {
				var temp = writeBuffer;
				writeBuffer = new Uint8Array(appendOffset + len);
				for ( i = 0; i < appendOffset; i++) {
					writeBuffer[i] = temp[i];
				}
			}
		};
	}

	/*
	 * This function store some previous event information
	 * These information are used when timer function for
	 * mouse event get called
	 */
	function MouseMetaHandler() {
		this.fMouMovePending = false;
		this.mouMoveTmrCounter = 0;
		this.mouMoveTmr = null;
		this.lastMove = null;
	}


	this.setDisplay = function(w, h) {
		gDisplayWidth = w;
		gDisplayHeight = h;
	};
	var setEventPosition = function setEventPosition(x, y) {
		if (gDisplayWidth <= 0 || gDisplayHeight <= 0) {
			return;
		}

		if (x <= 1) {
			x = 0;
		}
		if (x >= gDisplayWidth - 2) {
			x = gDisplayWidth - 1;
		}

		if (y < 0) {
			y = 0;
		}
		if (y >= gDisplayHeight) {
			y = gDisplayHeight - 1;
		}
		//double bitwise NOT to floor
		eventPosition.X = (~~((x * 0x10000) / gDisplayWidth)) + 1;
		eventPosition.Y = (~~((y * 0x10000) / gDisplayHeight)) + 1;
	};
	/*
	 * This function handle mouse event data
	 * dataObj:array for mouse event that has to be sent
	 * mouCount:-no of mouse event to send
	 * offset:-array index dataObj form where effective event start
	 */
	function mouWrite(dataObj, mouCount, offset) {
		var i;
		var plastMove = null;
		var lastnonMoveOffset = -1;
		if (fDeferMouse === false) {
			if ((mouCount === 1) && (dataObj[offset].state === MouseConstant.MOU_STATUS_WHEEL) && (dataObj[offset].uiType === MouseConstant.MOUSE_DATA_CLIENT_EXTRA)) {
				mouDirectWriteExtended(dataObj, mouCount, offset);
				offset++;
				mouCount--;
			}
			if (mouCount > 0) {
				mouDirectWrite(dataObj, mouCount, offset);

			}

			mousebuffer.flush();
		} else {
			lastnonMoveOffset = offset - 1;
			for ( i = 0; i < mouCount; i++) {
				if ((dataObj[offset + i].state === MouseConstant.MOUSE_STATUS_MOVED) && (dataObj[offset + i].uiType === MouseConstant.MOUSE_DATA_CLIENT_NORMAL)) {
					plastMove = dataObj[offset + i];
				} else {
					lastnonMoveOffset = offset + i;
					plastMove = null;
				}
			}
			if ((lastnonMoveOffset - offset + 1 ) > 0) {
				mouseMetaHandler.fMouMovePending = false;
				mouDirectWrite(dataObj, lastnonMoveOffset - offset + 1, offset);
				mousebuffer.flush();
			}
			if (plastMove === null) {
				mouseMetaHandler.fMouMovePending = false;
			} else {
				mouseMetaHandler.fMouMovePending = true;
				mouseMetaHandler.lastMove = plastMove;
			}

		}
	}

	/*
	 * This variable maintain mouse event data so that multiple event can
	 * be send at one ica packet
	 */
	var mousebuffer = new IcaMouseBuffer();
	/*
	 * This variable keep some history of mouse event
	 * 1:-This history either used by timer function or
	 * It is used at starting of next mouse event
	 */
	var mouseMetaHandler = new MouseMetaHandler();
	/*
	 * dataObj:-Array for mouse events
	 * mouCount:-no of event of MOUSEDATA_EXTENDED  type
	 *
	 */
	function mouDirectWriteExtended(dataObj, mouCount, offset) {
		var extraLen = 0;
		var i = 0;
		if (!mouCount) {
			return;
		}
		if (fMouseWheelSupported == false) {
			return;
		}
		var outBufMouCount = mouCount * SIZEOF_MOUSEDATA_EXTENDED;
		var totalLen = outBufMouCount + 3 + extraLen;
		mousebuffer.allocateBuffer(totalLen);

		if (outBufMouCount < 256) {
			mousebuffer.writeByte(PACKET_MOUSE_EXTENDED1);
			mousebuffer.writeByte(outBufMouCount);
		} else {
			mousebuffer.writeByte(PACKET_MOUSE_EXTENDED2);
			mousebuffer.writeUint2(outBufMouCount);
		}

		for ( i = offset; i < offset + mouCount; i++) {
			var temp = dataObj[i];
			setEventPosition(temp.x, temp.y);
			mousebuffer.writeMouseExtended(SIZEOF_MOUSEDATA_EXTENDED, eventPosition.X, eventPosition.Y, temp.state, temp.amount);
		}

	}

	/*
	 * dataObj:-Array for mouse events
	 * mouCount:-no of event of MOUSEDATA_NORMAL  type
	 *
	 */
	function mouDirectWriteOld(dataObj, mouCount, offset) {
		var extraLen = 0;
		var i = 0;
		if (!mouCount) {
			return;
		}
		var outBufMouCount = mouCount * SIZEOF_MOUSEDATA;
		var totalLen = outBufMouCount + 3 + extraLen;
		mousebuffer.allocateBuffer(totalLen);

		if (outBufMouCount === SIZEOF_MOUSEDATA) {
			mousebuffer.writeByte(PACKET_MOUSE0);
		} else if (outBufMouCount < 256) {
			mousebuffer.writeByte(PACKET_MOUSE1);
			mousebuffer.writeByte(outBufMouCount);
		} else {
			mousebuffer.writeByte(PACKET_MOUSE2);
			mousebuffer.writeUint2(outBufMouCount);
		}

		for ( i = offset; i < offset + mouCount; i++) {
			var temp = dataObj[i];
			setEventPosition(temp.x, temp.y);
			mousebuffer.writePacketMouse(eventPosition.X, eventPosition.Y, temp.state);
			mousebuffer.flush();

		}
		return;

	}

	function mouDirectWrite(dataObj, mouCount, offset) {
		var totalCount = offset;
		var fOldDataType = 0;
		var dataCount = 0;
		var rc = false;
		if (mouCount >= 1) {
			while (totalCount !== mouCount) {
				dataCount = getNextDataCount(dataObj, totalCount, mouCount - totalCount, fOldDataType);
				rc = fOldDataType ? mouDirectWriteOld(dataObj, dataCount, offset + totalCount) : mouDirectWriteExtended(dataObj, dataCount, offset + totalCount);
				totalCount += dataCount;
				fOldDataType = !(fOldDataType);
			}
		}
		return rc;
	}

	/*
	 * This function is getting called if HTML5_CONFIG['userinput']['mousetimer'] >  DefaultMouse_Move_Queue
	 * and send last move pending data
	 */
	function mouMoveTmrTick() {
		mouseMetaHandler.mouMoveTmrCounter++;
		/*
		 * Check for wifi
		 */

		if ((context.roundTripTime > 600) || (context.outputSpeedInBytesPerSec < 6000) || (context.inputSpeedInBytesPerSec < 3000)) {
			/* a line with response/throughput problems */
			if ((mouseMetaHandler.mouMoveTmrCounter & 1) == 0) {
				/* skip every other timer tick to reduce packet frequency */
				return;
			}
		}
		if ((gUserInputEnabled === true) && (mouseMetaHandler.fMouMovePending === true)) {
			/*
			 * Write last move data
			 */
			dummyArray[0] = mouseMetaHandler.lastMove;
			mouDirectWriteOld(dummyArray, 1, 0);
			mousebuffer.flush();
			mouseMetaHandler.fMouMovePending = false;
		}
	}

	/*
	 * This function return number of  same type mouse event consecutive
	 */
	function getNextDataCount(pMouseData, offset, totalCount, fOldType) {
		var dataCount = 0;
		var i;
		var type = ( fOldType ? MouseConstant.MOUSE_DATA_CLIENT_NORMAL : MouseConstant.MOUSE_DATA_CLIENT_EXTRA);
		pData = pMouseData[offset++];
		for ( i = 0; i < totalCount; i++) {
			if (pData.uiType === type) {
				dataCount++;
			} else {
				break;
			}
			pData = pMouseData[offset++];
		}
		return dataCount;
	}

	var dummyArray = new Array(1);
	this.processSingleMouseCmd = function(dataObj) {
		if (gUserInputEnabled === false) {
			return;
		}
		dummyArray[0] = dataObj;
		mouWrite(dummyArray, 1, 0);
	};
	this.processMultiMouseCmd = function(dataObj, offset, mouCount) {

		if (gUserInputEnabled === false) {
			return;
		}
		mouWrite(dataObj, mouCount, offset);
	};
	this.setUserInput = function(usrinput) {
		gUserInputEnabled = usrinput;
		if (gUserInputEnabled === true) {
			if (mouseMetaHandler.mouMoveTmr === null) {
				var timer = HTML5_CONFIG['userinput']['mousetimer'];
				if ( timer !== "*") {
					timer = timer + "";
					var timeInterval = parseInt(timer);
					if (timeInterval > DefaultMouse_Move_Queue) {
						if (timeInterval > MAX_MOUSE_MOVEDELAY) {
							timeInterval = MAX_MOUSE_MOVEDELAY;
						}
						mouseMetaHandler.mouMoveTmr = setInterval(function() {
							mouMoveTmrTick();
						}, timeInterval);
						fDeferMouse = true;
					}

				}

			}

		} else {
			if (mouseMetaHandler.mouMoveTmr) {
				clearInterval(mouseMetaHandler.mouMoveTmr);
			}

		}
	};
	this.setContext = function(ctx) {
		context = ctx;
	};

	this.setWheelSuppot = function(whellsuppot) {
		fMouseWheelSupported = whellsuppot;
	};
}
