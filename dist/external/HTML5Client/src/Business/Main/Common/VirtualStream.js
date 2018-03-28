/*
For time being if the read will not have enough data it will block using a while loop.

*/

function VirtualStream(channelIdentifier, callbackWrapper, maxSize) {
    var channel = channelIdentifier;
    var buffSize = 0;
    var incrementSlice = 1000;
    var buffer;
    var sbuffer;
    var wd = callbackWrapper;
    var lastneededspace = 0;
    var isClosed = false;
    var lastReadByte = 0;
    var head = 0;  // next index to be written
    var tail = 0;  // next index to be read
    
    var callback = null,
        notify = function () {
            if ((callback !== null)) {
                callback();
            }
            else {
                throw VirtualStreamError.CALLBACK_NOT_REGISTERED;
            }
        };

    this.GetReadIndex = function getReadIndex() {
        return tail;
    };
    this.compact = function () {
        head = head - tail;
        if ((head > 0) && (tail !== 0)) {


            for (var i = 0; i < head; ++i) {
                buffer[i] = buffer[i + tail];
            }


        }
        tail = 0;
    };
    this.setReadIndex = function (rdIndex) {
        tail = rdIndex;
    };
    this.GetChannel = function getChannel() { return channel; };

    this.WriteByte = function WriteByte(byteData, offset, length) {
        wd.queueVirtualWrite(channel, byteData, offset, length);
    };
    
	this.writeAck = function(windowSize) {
		wd.writeAck(channel , windowSize);
	};
    
    this.RegisterCallback = function (action) {
        callback = action;
    };
    this.GetCommand = function getCommand() {
        return this.ReadByte();
    };


    this.consumeData = function (byteData, offset, len) {
        if ((len + head) > buffSize) {
            buffSize = len + head + incrementSlice;
            var temp = buffer;
            buffer = new Uint8Array(buffSize);
            sbuffer = new Int8Array(buffer.buffer);
            for (var i = 0; i < head; i++) {
                buffer[i] = temp[i];
            }
        }
        // If the stream has been closed, we discard everything
        if (isClosed) return;

        for (var i = 0; i < len; ++i) {
            buffer[i + head] = byteData[i + offset];
        }
        head = (head + len);
        if (lastneededspace <= len) {

            lastneededspace = 0;
            notify();
        }
        else {
            lastneededspace -= len;
        }



    };


    this.EndConsuming = function endConsuming() {
        isClosed = true;
    };

    this.Available = function available() {
        return (head - tail);
    };

    this.WaitForSpace = function waitForSpace(spaceNeeded) {
        if ((head - tail) < spaceNeeded) {
            lastneededspace = spaceNeeded - (head - tail);
            throw VirtualStreamError.NO_SPACE_ERROR;
        }
    };

    this.isEnoughData = function isEnoughData(spaceNeeded) {
        if ((head - tail) < spaceNeeded) {
            lastneededspace = spaceNeeded - (head - tail);
            return false;
        }
        return true;
    }
            
    this.ReadByte = function readByte() {
        /* wait for data */
        if (head === tail) {
            lastneededspace = 1;
            throw VirtualStreamError.NO_SPACE_ERROR;
        }
        else {
            return buffer[tail++];
        }

    };
    this.ReadSByte = function readSByte() {
        if (head === tail) {
            lastneededspace = 1;
            throw VirtualStreamError.NO_SPACE_ERROR;
        }
        else {
            return sbuffer[tail++];
        }
    };

    /* Formed using only one byte so INT32 > UINT8 */
    this.ReadUInt8 = function readUInt8() {

        return (this.ReadByte());
    };


    /* Formed using only 2 byte so INT32 > UINT16 */
    this.ReadUInt16 = function readUInt16() {
        if ((head - tail) < 2) {
            lastneededspace = 2 - (head - tail);
            throw VirtualStreamError.NO_SPACE_ERROR;
        }
        return buffer[tail++] | (buffer[tail++] << 8);
    };
    this.ReadUInt16Reverse = function readUInt16Reverse() {
        if ((head - tail) < 2) {
            lastneededspace = 2 - (head - tail);
            throw VirtualStreamError.NO_SPACE_ERROR;
        }
        return (buffer[tail++] << 8) | buffer[tail++];
    };
    this.ReadInt16 = function readInt16() {

        var i = this.ReadUInt16();
        if (i & 0x008000) {
            i |= ~0x0000ffff;
        }
        return i;
    };

    /* Formed using only 3 byte so INT32 > UINT24 */
    this.ReadUInt24 = function readUInt24() {
        this.WaitForSpace(3);
        return buffer[tail++] | (buffer[tail++] << 8) | (buffer[tail++] << 16);
    };
    this.ReadUInt24Reverse = function readUInt24Reverse() {
        this.WaitForSpace(3);
        var result = (buffer[tail++] << 16) | (buffer[tail++] << 8) | buffer[tail++];
    };

    this.ReadInt24 = function readInt24() {

        var i = this.ReadUInt24();
        if (i & 0x00800000) {
            i |= ~0x00ffffff;
        }
        return i;
    };


    this.ReadInt32Reverse = function readInt32Reverse() {
        this.WaitForSpace(4);
        return (buffer[tail++] << 24) | (buffer[tail++] << 16) | (buffer[tail++] << 8) | buffer[tail++];
    };
    this.ReadInt32 = function readInt32() {
        this.WaitForSpace(4);
        return buffer[tail++] | (buffer[tail++] << 8) | (buffer[tail++] << 16) | (buffer[tail++] << 24);

    };


    this.SkipByte = function skipByte(numByteToSkip) {
        this.WaitForSpace(numByteToSkip);
        tail = tail + numByteToSkip;
    };

    this.ReadBytes = function (buff, off, len) {
        // local, non-volatile copy

        if ((head - tail) < len) {
            lastneededspace = len - (head - tail);
            throw VirtualStreamError.NO_SPACE_ERROR;
        }

        for (var i = 0; i < len; ++i) {
            buff[i + off] = buffer[i + tail];
        }
        tail = tail + len;

    };
    this.allocateSpace = function () {
        var buffer_data = (head - tail);
        var total_size = lastneededspace + buffer_data;
        if (total_size > buffSize) {
            buffSize = total_size + incrementSlice;
            var temp = buffer;
            buffer = new Uint8Array(buffSize);
            sbuffer = new Int8Array(buffer.buffer);
            var startoffset = this.GetReadIndex();
            head = 0;
            tail = 0;
            this.consumeData(temp, startoffset, buffer_data);
        }
    };


    this.ReadUIntXY = function readUIntXY(point) {
        lastReadByte = 0;
        var firstByte = this.ReadByte();
        lastReadByte++;
        var flags = firstByte >>> 6;
		var dummy;

        switch (flags) {
            case 0x00:
                point.Y = (firstByte & 0x38) >> 3;
                point.X = firstByte & 0x07;
                break;
            case 0x01:
                point.Y = firstByte & 0x3F;
                point.X = this.ReadByte();
                lastReadByte++;
                break;
            case 0x02:
                point.Y = (firstByte & 0x3F) << 8;
                point.Y |= this.ReadByte();
                point.X = this.ReadUInt16Reverse();
                lastReadByte += 3;
                break;
            case 0x03:
                point.Y = (firstByte & 0x3F) << 24;
                point.Y |= this.ReadUInt24Reverse();
                dummy = this.ReadByte();
                point.X = (dummy & 0xFF) << 24;
                if (point.X < 0) point.X += 0xffffffff + 1;
                point.X |= this.ReadUInt24Reverse();
                lastReadByte += 7;
                break;
        }
    };

    this.ReadVarUInt = function readVarUInt() {
        lastReadByte = 0;
        var b = this.ReadByte();
        lastReadByte++;
        var value = 0;
        var shift = 0;
		var dummy;
        for (; (b & 0x80) !== 0; b = this.ReadByte()) {
            dummy = (b & 0x7F) << shift;
            if (dummy < 0) dummy = dummy + 0xffffffff + 1;
            value = value | dummy;
            shift += 7;
            lastReadByte++;
        }
        dummy = b << shift;
        if (dummy < 0) dummy = dummy + 0xffffffff + 1;
        return value | dummy;
    };
    this.getLastReadByte = function () {
        return lastReadByte;
    };
    this.ReadIntXY = function readIntXY(point) {
        lastReadByte = 0;
        var firstByte = this.ReadByte();
        lastReadByte++;
        var flags = firstByte >> 5;
		var dummy;
        switch (flags) {
            default:
                break;
            case 0x00:
                point.X = ((firstByte & 0x1F) << 27) >> 27;
                point.Y = 0;
                break;
            case 0x01:
                point.Y = ((firstByte & 0x1F) << 27) >> 27;
                point.X = 0;
                break;
            case 0x02:
                point.X = ((firstByte & 0x1F) << 27) >> 27;
                point.Y = this.ReadSByte();
                lastReadByte++;
                break;
            case 0x03:
                point.Y = ((firstByte & 0x1F) << 27) >> 27;
                point.X = this.ReadSByte();
                lastReadByte++;
                break;
            case 0x04:
            case 0x05:
                dummy = ((firstByte & 0x3F) << 26) >> 18;
                point.Y = dummy | this.ReadByte();
                dummy = this.ReadByte();
                point.X = (dummy << 24) >> 16;
                point.X |= this.ReadByte();
                lastReadByte += 3;

                break;
            case 0x06:
            case 0x07:
                point.Y = ((firstByte & 0x3F) << 26) >> 2;
                point.Y |= this.ReadUInt24Reverse();
                point.X = this.ReadInt32Reverse();
                lastReadByte += 7; ;
                break;
        }
    };

    /**
     * @method peekUint16
     * @description No space error wont thrown here so caller must check 
     *              available space before calling this method
     * @returns {Number|VirtualStream.buffer|Uint8Array}
     */
    this.peekUint16 = function peekUint16() {
        if ((head - tail) < 2) {
            return null;
        }
        return buffer[tail] | (buffer[tail + 1] << 8);
    };
}

