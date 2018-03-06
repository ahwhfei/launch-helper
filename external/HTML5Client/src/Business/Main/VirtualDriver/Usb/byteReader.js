// JavaScript source code

function ByteReader(data, length)
{
    var self = this;
    this.buffer = data; //it must be byte stream
    this.size = length;
    this.offset = 0;

    this.readByte = function()
    {
        if (self.offset >= self.size)
            throw "Invalid offset requested";
        return self.buffer[self.offset++];
    };
    this.readUInt16 = function () {
        if (self.offset + 1 >= self.size)
            throw "Invalid offset requested";

        var result = self.buffer[self.offset] | self.buffer[self.offset + 1] << 8; //little endian
        self.offset += 2;
        return result;
    };
    this.readUInt24 = function () {
        if (self.offset + 2 >= self.size)
            throw "Invalid offset requested";

        var result = self.buffer[self.offset] | self.buffer[self.offset + 1] << 8 | self.buffer[self.offset + 2] << 16;
        self.offset += 3;
        return result;
    };
    this.readUInt32 = function () {
        if (self.offset + 3 >= self.size)
            throw "Invalid offset requested";

        var result = self.buffer[self.offset] | self.buffer[self.offset + 1] << 8 | self.buffer[self.offset + 2] << 16 | self.buffer[self.offset + 3] << 24;
        self.offset += 4;
        return result;
    };

    this.remaining = function () {
        return self.size - self.offset;
    };
}