function ByteArrayOutputStream() {
    this.stream = [];
}

ByteArrayOutputStream.prototype.Reset = function reset() {
    this.stream = [];
};

ByteArrayOutputStream.prototype.Size = function size() {
    return this.stream.length;
};

ByteArrayOutputStream.prototype.ToByteArray = function toByteArray() {
    var byteArr = new Uint8Array(this.stream.length);
    Utility.CopyArray(this.stream, 0, byteArr, 0, this.stream.length);
    return byteArr;
};

ByteArrayOutputStream.prototype.WriteByte = function writeByte(data) {
    this.stream[this.stream.length] = (data & 0xFF);
};

ByteArrayOutputStream.prototype.WriteByteArray = function writeByteArray(byteData, offset, length) {
    if (byteData.length >= offset + length) {

        Utility.CopyArray(byteData, offset, this.stream, this.stream.length, length);
    }
};

ByteArrayOutputStream.prototype.WriteString = function writeString(string, totalBytes) {
    var barr = [];
    for (var i = totalBytes; i--; ) {
        barr[i] = 0;
    }

    if (string !== null) {
        var len = string.length > totalBytes ? totalBytes : string.length;
        for (var i = len; i--; ) {
            barr[i] = string.charCodeAt(i);
        }
    }
    this.WriteByteArray(barr, 0, totalBytes);
};


function OffsetableOutputStream() {
    var baos = new ByteArrayOutputStream();
    var gPendingData = [];
    var gPendingBigData = [];

    this.WriteByte = function writeByte(data) {
        baos.WriteByte(data);
    };

    this.WriteString = function writeString(string, totalBytes) {
        baos.WriteString(string, totalBytes);
    };

    this.WriteByteArray = function writeByteArray(byteData, offset, length) {
        baos.WriteByteArray(byteData, offset, length);
    };

    this.Size = function size() {
        return baos.Size();
    };
    this.WriteByteWithOffset = function writeByteWithOffset(data) {
        var temp = new Uint8Array(1);
        temp[0] = data & 0xFF;

        this.WriteByteArrayWithOffset(temp, 0, 1);
    };

    this.WriteByteArrayWithOffset = function writeByteArrayWithOffset(byteData, offset, length) {
        if (arguments.length === 1) {
            offset = 0;
            length = byteData.length;
        }

        if ((byteData !== null) && (byteData.length >= (offset + length))) {
            var dummy = new Uint8Array(length);
            Utility.CopyArray(byteData, offset, dummy, 0, length);

            if (dummy !== null && dummy.length > 0) {
                var no = new NumberedObject(this.Size(), dummy);
                gPendingData[gPendingData.length] = no;
            }
        }
        this.WriteByte(0);
        this.WriteByte(0);
    };

    this.WriteByteArrayWithBigOffset = function writeByteArrayWithBigOffset(byteData, offset, length) {
        if (arguments.length === 1) {
            offset = 0;
            length = byteData.length;
        }

        if ((byteData !== null) && (byteData.length >= (offset + length))) {
            var dummy = new Uint8Array(length);
            Utility.CopyArray(byteData, offset, dummy, 0, length);


            if (dummy !== null && dummy.length > 0) {
                var no = new NumberedObject(this.Size(), dummy);
                gPendingBigData[gPendingBigData.length] = no;
            }
        }
        this.WriteByte(0);
        this.WriteByte(0);
        this.WriteByte(0);
        this.WriteByte(0);
    };

    this.Reset = function reset() {
        baos.Reset();
        gPendingData = [];
        gPendingBigData = [];
    };

    this.ToByteArray = function toByteArray() {
        var result = [];
        var tempLength;
        if (gPendingData.length === 0 && gPendingBigData.length === 0) {
            return baos.ToByteArray();
        }
        else {
            var body = baos.ToByteArray();
            var no, diff, data, index;

            // Add two-byte offset data
            var offset = 0;
            var stream = new ByteArrayOutputStream();
            tempLength = gPendingData.length;
            for (var i = 0; i < tempLength; ++i) {
                offset = stream.Size() + body.length;
                no = gPendingData[i];
                data = no.Object;
                stream.WriteByteArray(data, 0, data.length);
                if (body.length < no.Number + 1) {
                    diff = no.Number + 1 - body.length;
                    index = body.length;
                    for (var j = 0; j < diff; ++i)
                        body[index + j] = 0;
                }
                body[no.Number] = offset;
                body[no.Number + 1] = offset >> 8;
            }
            var tail1 = stream.ToByteArray();

            // Add four-byte offset data (two-byte padded as two-short)
            var bigOffset = 0;
            var bigStream = new ByteArrayOutputStream();
            tempLength = gPendingBigData.length;
            for (var i = 0; i < tempLength; ++i) {
                bigOffset = bigStream.Size() + body.length + tail1.length;
                no = gPendingBigData[i];
                data = no.Object;
                bigStream.WriteByteArray(data, 0, data.length);
                if (body.length < no.Number + 1) {
                    diff = no.Number + 1 - body.length;
                    index = body.length;
                    for (var j = 0; j < diff; ++i)
                        body[index + j] = 0;
                }
                body[no.Number] = bigOffset;
                body[no.Number + 1] = 0;
                body[no.Number + 2] = bigOffset >> 8;
                body[no.Number + 3] = 0;
            }
            var tail2 = bigStream.ToByteArray();

            //TODO PERFORMANCE
            //result = body.slice(0);

            result = new Uint8Array(body.length + tail1.length + tail2.length);
            Utility.CopyArray(body, 0, result, 0, body.length);
            Utility.CopyArray(tail1, 0, result, body.length, tail1.length);
            Utility.CopyArray(tail2, 0, result, body.length + tail1.length, tail2.length);
        }
        return result;
    };
}
