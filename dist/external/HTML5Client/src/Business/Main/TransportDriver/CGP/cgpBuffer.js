// Copyright 2004 Citrix Systems, Inc. All rights reserved.

function CGPBuffer (data, length, offset){
    this.data   = (data != null)? data : new Uint8Array(0);
    this.offset = (offset != null)? offset : 0;
    if(length){
        this.length = length;
    } /*else if (data.length){
        this.length = data.length;
    } */else{
        this.length = this.data.length;
    }


    /**
     * Returns a new CGPBuffer containing the specified number of bytes from
     * the CGPBuffer (The new buffer uses the same internal byte array.)
     * @param bytes the number of bytes to read.
     */
    this.readBuffer = function (bytes) {
        if (bytes > length) {
            //throw new IllegalStateException("Insufficient data in buffer");
            writeHTML5Log(0, " SESSION :|: CGP :|: CGP-BUFFER :|: Insufficient data in buffer");
        }
        var tempBuff = this.data.subarray(this.offset);
        var b = new CGPBuffer(tempBuff, bytes, 0);

        this.offset += bytes;
        this.length -= bytes;

        return b;
    };

    /**
     * Reads a 8 bit unsigned value from the CGPBuffer.
     */
    this.readReservedByte = function () {
        if (this.readUInt8() != CGPConstants.CGP_RESERVED) {
            //throw new ProtocolException("Non-zero reserved byte");
        }
    };

    /**
     * Reads a 8 bit unsigned value from the CGPBuffer.
     */
    this.readUInt8 = function (){
        //var temp = this.data[this.offset];
        //console.log("Read Data is : ", temp);
        if (this.length < 1) {
            //throw new IllegalStateException("Insufficient data in buffer");
        }

        this.length--;
        return (this.data[this.offset++] & 0xff);
    };

    /**
     * Reads a 16 bit unsigned little endian value from the CGPBuffer.
     */
    this.readUInt16 = function() {
        if (this.length < 2) {
            //throw new IllegalStateException("Insufficient data in buffer");
        }
        this.length -= 2;
        var val = this.data[this.offset++] & 0xff;
        return val | (this.data[this.offset++] & 0xff) << 8;
    };

    /**
     * Reads a 32 bit unsigned little endian value from the CGPBuffer.
     */
    this.readUInt32 = function () {
        if (this.length < 4) {
            //throw new IllegalStateException("Insufficient data in buffer");
        }
        this.length -= 4;
        var val = this.data[this.offset++] & 0xff;
        val |= (this.data[this.offset++] & 0xff) << 8;
        val |= (this.data[this.offset++] & 0xff) << 16;
        return val | (this.data[this.offset++] & 0xff) << 24;
    }

    /**
     * Reads a VarInt value from the CGPBuffer.
     */
    this.readVarInt= function () {
        if (this.length < 1) {
            //throw new IllegalStateException("Insufficient data in buffer");
            writeHTML5Log(0, " SESSION :|: CGP :|: CGP-BUFFER :|: Insufficient data in buffer");
        }

        var val = this.data[this.offset++];
        this.length--;
        //this.data = this.copyData(this.length);
        if ((val & 0x80) == 0x80) {
            if (this.length < 1) {
                //throw new IllegalStateException("Insufficient data in buffer");
            }
            val = (val & 0x7f) | (this.data[this.offset++] & 0xff) << 7;
            this.length--;
        }
        return val;
    };



     // Reads a ascii string from the CGPBuffer.
     
    this.readAsciiString = function(bytes) {
        if (this.length < bytes) {
            //throw new IllegalStateException("Insufficient data in buffer");
        }

        var chars = new Uint8Array(bytes);
        for(var i = 0; i < bytes; i++) {
            chars[i] = this.data[this.offset++] & 0xff;
        }

        return chars;
    };


    /**
     */
    this.copyData = function(bytes) {
        if (length < bytes) {
            //throw new IllegalStateException("Insufficient data in buffer");
        }

        var newData = new Uint8Array(bytes);

        Utility.CopyArray(this.data, this.offset, newData, 0, bytes);
        this.offset += bytes;
        this.length -= bytes;

        return newData;
    };

    /**
     */
    this.copyVarData = function() {
        var length = this.readVarInt();
        return this.copyData(length);
    };

    /**
     * Check this function only on Partial Data
     */
    this.readData = function (buffer, offset, bytes) {
        if (length < bytes) {
            //throw new IllegalStateException("Insufficient data in buffer");
        }

        Utility.CopyArray(this.data, this.offset, buffer, offset, bytes);
        this.offset += bytes;
        length -= bytes;
    };


}

