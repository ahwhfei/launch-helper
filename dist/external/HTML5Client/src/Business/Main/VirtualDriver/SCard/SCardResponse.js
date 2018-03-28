var SCard;
(function (SCard) {

    var Response = {};

    (function (Response) {

        function writeHeaderPacket(buffer, cmd, size, offset) {
            offset = Utility.WriteInt2(buffer, offset, size);
            buffer[offset++] = cmd;
            buffer[offset++] = 0;
            return offset;
        }

        Response.ManagerStatus = (function () {
            var managerStatus = function (code, handle) {
                this.cmd = SCard.Constants.SCARDVD_CMD_RESOURCE_MANAGER_RUNNING;
                this.size = 4;
            };

            managerStatus.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            return managerStatus;
        })();
        
        Response.ManagerSatusStopped = (function () { //Sending manager status stopped to server F for failed
            var managerStatus = function (code, handle) {
                this.cmd = SCard.Constants.SCARDVD_CMD_RESOURCE_MANAGER_STOPPED;
                this.size = 4;
            };

            managerStatus.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            return managerStatus;
        })();

        Response.EstablishContext = (function () {
            var establishContext = function (code, handle) {
                this.cmd = SCard.Constants.SCARDVD_CMD_ESTABLISH_CONTEXT_REPLY;
                this.returnCode = code;
                this.contextHandle = handle;
                this.size = 4 + 4 + 4;
            };

            establishContext.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = 0;
                offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                offset = Utility.WriteInt4(buffer, offset, this.returnCode);
                offset = Utility.WriteInt4(buffer, offset, this.contextHandle);
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            return establishContext;
        })();

        Response.ListReader = (function () {
            var listReader = function (code, name) {
                this.returnCode = code;
                this.reader = name;
                this.cmd = SCard.Constants.SCARDVD_CMD_LIST_READERS_REPLY;
            };

            listReader.prototype.getBuffer = function () {
                var tempOffset = 12;
                var data = this.reader;
                var len = data.length;
                var strLen = len * 2 + 4;
                var rvalue = new Uint8Array(2 * (len + 2));
                for (var i = 0; i < len; i++) {
                    code = data.charCodeAt(i);
                    rvalue[2 * i] = code & 0xff;
                    rvalue[2 * i + 1] = (code >> 8) & 0xff;
                }

                rvalue[2 * len] = 0;//for string null
                rvalue[2 * len + 1] = 0;
                rvalue[2 * len + 2] = 0;//for whole sequence
                rvalue[2 * len + 3] = 0;

                var buffer = new Uint8Array(tempOffset + strLen);
                var offset = 4;
                offset = Utility.WriteInt4(buffer, offset, this.returnCode);
                offset = Utility.WriteInt2(buffer, offset, tempOffset);
                offset = Utility.WriteInt2(buffer, offset, strLen);

                for (i = 0; i < strLen; i++) {
                    buffer[offset + i] = rvalue[i];
                }
                offset = offset + i;

                writeHeaderPacket(buffer, this.cmd, offset, 0);
                return {
                    buffer: buffer,
                    size: offset
                };
            };
            return listReader;
        })();

        Response.ReleaseContext = (function () {
            //release context reply
            var releaseContext = function (code) {
                this.returnCode = code;
                this.cmd = SCard.Constants.SCARDVD_CMD_RELEASE_CONTEXT_REPLY;
                this.size = 4 + 4;
            };

            releaseContext.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                offset = Utility.WriteInt4(buffer, offset, this.returnCode);
                return {
                    buffer: buffer,
                    size: offset
                };
            };
            return releaseContext;
        })();

        Response.Connect = (function () {
            //cmd connect reply
            var connect = function (code, contextHandle, proto) {
                this.cmd = SCard.Constants.SCARD_CMD_CONNECT_REPLY;
                this.returnCode = code;
                this.handle = contextHandle;
                this.prot = proto;
                this.size = 16;
            };

            connect.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                offset = Utility.WriteInt4(buffer, offset, this.returnCode);
                offset = Utility.WriteInt4(buffer, offset, this.handle);
                offset = Utility.WriteInt4(buffer, offset, this.prot);
                return {
                    buffer: buffer,
                    size: offset
                };
            };
            return connect;
        })();

        Response.BeginTransaction = (function () {

            //begin transaction reply
            var beginTransaction = function (code) {
                this.returnCode = code;
                this.cmd = SCard.Constants.SCARD_CMD_BEGIN_TRANSACTION_REPLY;
                this.size = 8;
            };

            beginTransaction.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                offset = Utility.WriteInt4(buffer, offset, this.returnCode);
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            return beginTransaction;
        })();

        Response.Status = (function () {

            var status = function (code, name, readerState, proto, attr) {
                this.returnCode = code;
                this.ReaderName = name;
                this.ReaderNameOffset = 23;
                this.ReaderNameSize = 0;
                this.size = 23;
                this.attribute = attr;
                this.attributeSize = 0;
                this.attributeOffset = 23;
                this.ReaderState = readerState;
                this.prot = proto;
                this.cmd = SCard.Constants.SCARD_CMD_STATUS_REPLY;
            };

            status.prototype.getBuffer = function () {
                var len = this.ReaderName.length;
                var strLen = len * 2 + 4;//double null termination
                this.attributeSize = this.attribute.length;
                this.ReaderNameSize = strLen;
                this.attributeOffset = this.size + strLen;
                this.size = this.size + strLen + this.attributeSize;
                var rvalue = new Uint8Array(strLen);
                var data = this.ReaderName;
                for (var i = 0; i < len; i++) {
                    code = data.charCodeAt(i);
                    rvalue[2 * i] = code & 0xff;
                    rvalue[2 * i + 1] = (code >> 8) & 0xff;
                }

                rvalue[2 * len] = 0;//for string null
                rvalue[2 * len + 1] = 0;
                rvalue[2 * len + 2] = 0;//for whole sequence
                rvalue[2 * len + 3] = 0;

                var avalue = new Uint8Array(this.attributeSize);
                for (i = 0; i < this.attributeSize; i++) {
                    avalue[i] = this.attribute[i];
                }

                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                offset = Utility.WriteInt4(buffer, offset, this.returnCode);
                offset = Utility.WriteInt2(buffer, offset, this.ReaderNameOffset);
                offset = Utility.WriteInt2(buffer, offset, this.ReaderNameSize);
                offset = Utility.WriteInt4(buffer, offset, this.ReaderState);
                offset = Utility.WriteInt4(buffer, offset, this.prot);
                offset = Utility.WriteInt2(buffer, offset, this.attributeOffset);
                offset = Utility.WriteByte(buffer, offset, this.attributeSize);
                for (i = 0; i < strLen; i++) {
                    buffer[offset + i] = rvalue[i];
                }
                offset = offset + i;

                for (i = 0; i < this.attributeSize; i++) {
                    buffer[offset + i] = avalue[i];
                }
                offset = offset + i;
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            return status;
        })();

        Response.GetAttribute = (function () {

            //get reader capabilities reply
            var getAttribute = function (code, attr) {
                this.returnCode = code;
                this.attribute = attr;
                this.cmd = SCard.Constants.SCARDVD_CMD_GET_READER_CAPABILITIES_REPLY;
                this.attributeSize = 0;
                this.attributeOffset = 12;
                this.size = 12;
            };

            getAttribute.prototype.getBuffer = function () {
                this.attributeSize = this.attribute.length;
                this.size = this.size + this.attributeSize;
                if (this.attributeSize == 0)
                    this.attributeOffset = 0;
                var avalue = new Uint8Array(this.attributeSize);
                for (var i = 0; i < this.attributeSize; i++) {
                    avalue[i] = this.attribute[i];
                }
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                offset = Utility.WriteInt4(buffer, offset, this.returnCode);
                offset = Utility.WriteInt2(buffer, offset, this.attributeOffset);
                offset = Utility.WriteInt2(buffer, offset, this.attributeSize);

                for (i = 0; i < this.attributeSize; i++) {
                    buffer[offset + i] = avalue[i];
                }
                offset = offset + i;
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            return getAttribute;
        })();

        Response.Transmit = (function () {
            //cmd transmit reply
            var transmit = function (code, data) {
                this.rawData = data;
                this.returnCode = code;
                this.cmd = SCard.Constants.SCARDVD_CMD_TRANSMIT_REPLY;
                this.recvPCIBuffOffset = 0;
                this.recvPCIBuffSize = 0;
                this.recvBuffOffset = 16;
                this.recvBuffSize = 0;
                this.size = 16;
            };

            transmit.prototype.getBuffer = function () {
                this.recvBuffSize = this.rawData.length;

                var data = new Uint8Array(this.recvBuffSize);
                this.size = this.size + this.recvBuffSize + this.recvPCIBuffSize;
                for (var i = 0; i < this.recvBuffSize; i++) {
                    data[i] = this.rawData[i];
                }

                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                offset = Utility.WriteInt4(buffer, offset, this.returnCode);
                offset = Utility.WriteInt2(buffer, offset, this.recvPCIBuffOffset);
                offset = Utility.WriteInt2(buffer, offset, this.recvPCIBuffSize);
                offset = Utility.WriteInt2(buffer, offset, this.recvBuffOffset);
                offset = Utility.WriteInt2(buffer, offset, this.recvBuffSize);

                for (i = 0; i < this.recvBuffSize; i++) {
                    buffer[offset + i] = data[i];
                }
                offset = offset + i;
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            return transmit;
        })();

        Response.EndTransaction = (function () {
            //end transaction reply
            var endTransaction = function (code) {
                this.returnCode = code;
                this.cmd = SCard.Constants.SCARDVD_CMD_END_TRANSACTION_REPLY;
                this.size = 8;
            };

            endTransaction.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                offset = Utility.WriteInt4(buffer, offset, this.returnCode);
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            return endTransaction;
        })();

        Response.Disconnect = (function () {
            //disconnect request
            var disconnect = function (code) {
                this.returnCode = code;
                this.cmd = SCard.Constants.SCARDVD_CMD_DISCONNECT_REPLY;
                this.size = 8;
            };

            disconnect.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                offset = Utility.WriteInt4(buffer, offset, this.returnCode);
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            return disconnect;
        })();

        Response.IsValidContext = (function () {
            //validate context
            var isValidContext = function (code) {
                this.returnCode = code;
                this.cmd = SCard.Constants.SCARDVD_CMD_IS_VALID_CONTEXT_REPLY;
                this.size = 8;
            };

            isValidContext.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                offset = Utility.WriteInt4(buffer, offset, this.returnCode);
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            return isValidContext;
        })();

        Response.Reconnect = (function () {

            var reconnect = function (code, proto) {
                this.returnCode = code;
                this.activeProtocol = proto;
                this.cmd = SCard.Constants.SCARD_CMD_RECONNECT_REPLY;
                this.size = 12;
            };

            reconnect.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                offset = Utility.WriteInt4(buffer, offset, this.returnCode);
                offset = Utility.WriteInt4(buffer, offset, this.activeProtocol);
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            return reconnect;
        })();

        Response.Control = (function () {
            //cmd transmit reply
            var control = function (code, data) {
                this.rawData = data;
                this.returnCode = code;
                this.cmd = SCard.Constants.SCARDVD_CMD_CONTROL_REPLY;
                this.bufferOffset = 12;
                this.bufferSize = 0;
                this.size = 12;
            };

            control.prototype.getBuffer = function () {
                this.bufferSize = this.rawData.length;

                var data = new Uint8Array(this.bufferSize);
                this.size = this.size + this.bufferSize;
                for (var i = 0; i < this.bufferSize; i++) {
                    data[i] = this.rawData[i];
                }

                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                offset = Utility.WriteInt4(buffer, offset, this.returnCode);
                offset = Utility.WriteInt2(buffer, offset, this.bufferOffset);
                offset = Utility.WriteInt2(buffer, offset, this.bufferSize);

                for (i = 0; i < this.bufferSize; i++) {
                    buffer[offset + i] = data[i];
                }
                offset = offset + i;
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            return control;
        })();

        Response.Bind = (function () {

            var bind = function (capsArray) {
                this.array = capsArray;
                this.size = 8;
            };

            bind.prototype.getBuffer = function () {
                var capCount = this.array.length;
                for (var i = 0; i < capCount; i++) {
                    this.size += this.array[i].size;
                }
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, SCard.Constants.SCARDVD_CMD_BIND_RESPONSE, this.size, 0);
                offset = Utility.WriteInt2(buffer, offset, 8);
                offset = Utility.WriteByte(buffer, offset, capCount);
                offset = Utility.WriteByte(buffer, offset, 0);
                for (var i = 0; i < capCount; i++) {
                    for (var j = 0; j < this.array[i].size; j++) {
                        offset = Utility.WriteByte(buffer, offset, this.array[i].buffer[j]);
                    }
                }
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            return bind;
        })();

        Response.ReaderStatus = (function () {

            //cmd readers status
            var readerStatus = function (name, state, attr, pnp) {
                this.oReaderStateBlocksCount = 1;
                this.cmd = SCard.Constants.SCARDVD_CMD_READERS_STATUS;
                this.ReaderName = name;
                this.size = 8;
                this.packetSize = 8;
                this.readerStateBlocksCount = 1;
                this.state = state;
                this.attribute = attr;
                this.readerPnp = pnp;
            };

            readerStatus.prototype.getBuffer = function () {
                var readerState = new reader_state(this.ReaderName, this.state, this.attribute, this.readerPnp);
                var tempBuff = readerState.write();
                this.size = this.size + tempBuff.length;
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.cmd, this.size, 0);
                offset = Utility.WriteInt2(buffer, offset, this.packetSize);
                offset = Utility.WriteByte(buffer, offset, this.readerStateBlocksCount);
                offset = Utility.WriteByte(buffer, offset, 0);
                for (var i = 0; i < tempBuff.length; i++) {
                    buffer[offset + i] = tempBuff[i];
                }
                offset = offset + i;
                return {
                    buffer: buffer,
                    size: offset
                };
            };

            //reader state
            var reader_state = function (name, state, attr, readerPnp) {
                this.ReaderName = name;
                this.ReaderNameOffset = 16;
                this.ReaderCount = 0;
                this.size = 16;
                this.oATR = 16;
                this.ATRLength = 0;
                this.attribute = attr;
                this.ReaderStateBitMask = state;
                this.ReaderPnpBitMask = readerPnp;
            };

            reader_state.prototype.write = function () {
                var len = this.ReaderName.length;
                var strLen = len * 2 + 2;
                this.ReaderCount = strLen;
                this.oATR = this.ReaderNameOffset + this.ReaderCount;
                this.ATRLength = this.attribute.length;
                this.size = this.size + strLen + this.ATRLength;
                var rvalue = new Uint8Array(2 * (len + 1));
                for (var i = 0; i < len; i++) {
                    code = this.ReaderName.charCodeAt(i);
                    rvalue[2 * i] = code & 0xff;
                    rvalue[2 * i + 1] = (code >> 8) & 0xff;
                }
                rvalue[len * 2] = 0;
                rvalue[len * 2 + 1] = 0;//null termination

                var buffer = new Uint8Array(this.size);
                var offset = 0;
                offset = Utility.WriteInt2(buffer, offset, this.size);
                offset = Utility.WriteInt2(buffer, offset, this.ReaderNameOffset);
                offset = Utility.WriteInt2(buffer, offset, this.ReaderCount);
                offset = Utility.WriteInt2(buffer, offset, this.oATR);
                offset = Utility.WriteByte(buffer, offset, this.ATRLength);//ATRByteCount
                offset = Utility.WriteByte(buffer, offset, this.ReaderPnpBitMask);//ReaderPnpBitMask
                offset = Utility.WriteByte(buffer, offset, 0);
                offset = Utility.WriteByte(buffer, offset, 0);
                offset = Utility.WriteInt4(buffer, offset, this.ReaderStateBitMask);

                for (i = 0; i < strLen; i++) {
                    buffer[offset + i] = rvalue[i];
                }
                offset = offset + i;
                for (i = 0; i < this.ATRLength; i++) {
                    buffer[offset + i] = this.attribute[i];
                }
                return buffer;
            };

            return readerStatus;
        })();

    })(Response);

    SCard.Response = Response;

})(SCard || (SCard = {}));