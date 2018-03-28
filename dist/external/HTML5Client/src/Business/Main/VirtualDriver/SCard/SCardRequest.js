var SCard;
(function (SCard) {

    var Request = {};

    (function (Request) {

        function writeHeaderPacket(buffer, cmd, size, offset) {
            offset = Utility.WriteInt2(buffer, offset, size);
            buffer[offset++] = cmd;
            buffer[offset++] = 0;
            return offset;
        }

        Request.BindRequest = (function () {
            var scard_native_support = function (count) {
                this.size = 8;
                this.SupportedReadersCount = count;
                this.capId = SCard.Constants.SCARDVD_CAP_TYPE_NATIVE_OS_SCARD_SUPPORT;
            };

            scard_native_support.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.capId, this.size, 0);
                offset = Utility.WriteInt2(buffer, offset, this.SupportedReadersCount);
                offset = Utility.WriteByte(buffer, offset, 0);
                offset = Utility.WriteByte(buffer, offset, 0);
                return {
                    size: offset,
                    buffer: buffer
                }
            };

            //string encoding
            var string_encoding = function (flag, data) {
                this.encodingFlag = flag;
                this.size = 12;
                this.capId = SCard.Constants.SCARDVD_CAP_TYPE_STRING_ENCODING;
                if (data == null)
                    data = 0;
                this.encodingData = data;
            };

            string_encoding.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.capId, this.size, 0);
                offset = Utility.WriteByte(buffer, offset, this.encodingFlag);
                offset = Utility.WriteByte(buffer, offset, 0);//3 reserve bytes
                offset = Utility.WriteByte(buffer, offset, 0);
                offset = Utility.WriteByte(buffer, offset, 0);
                offset = Utility.WriteInt4(buffer, offset, this.encodingData);
                return {
                    size: offset,
                    buffer: buffer
                }
            };

            //pnp
            var plug_n_play = function () {
                this.capId = SCard.Constants.SCARDVD_CAP_TYPE_READER_PNP_SUPPORT;
                this.size = 8;
            };

            plug_n_play.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.capId, this.size, 0);
                offset = Utility.WriteByte(buffer, offset, 0);//4 reserve bytes
                offset = Utility.WriteByte(buffer, offset, 0);
                offset = Utility.WriteByte(buffer, offset, 0);
                offset = Utility.WriteByte(buffer, offset, 0);
                return {
                    size: offset,
                    buffer: buffer
                }
            }
            
            var resource_manager_status = function(){
                this.capId = SCard.Constants.SCARDVD_CAP_TYPE_RESOURCE_MANAGER_STATUS_SUPPORT;
                this.size = 8;
            };
            
            resource_manager_status.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.capId, this.size, 0);
                offset = Utility.WriteByte(buffer, offset, 0);//4 reserve bytes
                offset = Utility.WriteByte(buffer, offset, 0);
                offset = Utility.WriteByte(buffer, offset, 0);
                offset = Utility.WriteByte(buffer, offset, 0);
                return {
                    size: offset,
                    buffer: buffer
                }
            }

            var bind = function () {
                this.respond = true;
            }

            bind.prototype.getObject = function (stream, respond) {
                var obj;
                var constants = SCard.Constants;
                var offset = stream.ReadUInt16();
                var originalOffset = offset;
                var numCaps = stream.ReadByte();
                stream.ReadByte();//reserve byte
                var capsArray = [];
                for (var i = 0; i < numCaps; i++) {
                    var byteCount = stream.ReadUInt16();
                    var capabilityID = stream.ReadByte();
                    stream.ReadByte();
                    switch (capabilityID) {
                        case constants.SCARDVD_CAP_TYPE_NATIVE_OS_SCARD_SUPPORT:
                            var SupportedReadersCount = stream.ReadUInt16();
                            stream.ReadUInt16();
                            //TODO check this 1
                            SupportedReadersCount = 1;
                            if (this.respond) {
                                obj = new scard_native_support(SupportedReadersCount);
                                var nativeSupportResponse = obj.getBuffer();
                                capsArray.push(nativeSupportResponse);
                            }
                            break;

                        case constants.SCARDVD_CAP_TYPE_STRING_ENCODING:
                            var EncodingTypeBitMask = stream.ReadByte();
                            if (EncodingTypeBitMask > 0 && EncodingTypeBitMask < 4) {
                                if (EncodingTypeBitMask & constants.CTXSCARD_STRING_ENCODING_ASCII) {

                                }
                                if (EncodingTypeBitMask & constants.CTXSCARD_STRING_ENCODING_UNICODE) {
                                    if (this.respond) {
                                        obj = new string_encoding(EncodingTypeBitMask & constants.CTXSCARD_STRING_ENCODING_UNICODE, null);
                                        var stringEncodingResponse = obj.getBuffer();
                                        capsArray.push(stringEncodingResponse);
                                    }
                                }
                            } else {
                                console.log("error in EncodingTypeBitMask =" + EncodingTypeBitMask);
                                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:ERROR=error in EncodingTypeBitMask =" + EncodingTypeBitMask);
                            }
                            stream.ReadByte(); //3 reserved bytes
                            stream.ReadByte();
                            stream.ReadByte();
                            var EncodingData = stream.ReadInt32();
                            break;
                        case constants.SCARDVD_CAP_TYPE_EXTENDED_COMMAND_SUPPORT:
                            stream.SkipByte(byteCount - 4);
                            break;
                        case constants.SCARDVD_CAP_TYPE_READER_PNP_SUPPORT:
                            stream.ReadByte(); //4 reserved bytes
                            stream.ReadByte();
                            stream.ReadByte();
                            stream.ReadByte();
                            if (this.respond) {
                                obj = new plug_n_play();
                                var pnpResponse = obj.getBuffer();
                                capsArray.push(pnpResponse);
                                this.serverSupportsPNP = true;
                            }
                            break;
                        case constants.SCARDVD_CAP_TYPE_RESOURCE_MANAGER_STATUS_SUPPORT:
                            stream.ReadByte(); //4 reserved bytes
                            stream.ReadByte();
                            stream.ReadByte();
                            stream.ReadByte();
                            if (this.respond) {
                                obj = new resource_manager_status();
                                var rmsResponse = obj.getBuffer();
                                capsArray.push(rmsResponse);
                                this.resourceManagerStatusSupported = true;
                            }
                            
                            //stream.SkipByte(byteCount - 4);
                            break;
                        case constants.SCARDVD_CAP_TYPE_CONCURRENT_PROTOCOL_SUPPORT:
                            stream.SkipByte(byteCount - 4);
                            break;
                        case constants.SCARDVD_CAP_TYPE_READER_INFO_SUPPORT:
                            stream.SkipByte(byteCount - 4);
                            break;
                        default:
                            {
                                stream.SkipByte(byteCount - 4);
                                //do nothing.
                            }
                    }

                }
                var obj = {};
                obj.respond = this.respond;
                if (this.respond) {
                    obj.capsArray = capsArray;
                }
                return obj;
            };

            bind.prototype.process = function (reqObj, vcContext) {
                if (reqObj.respond) {
                    if (this.serverSupportsPNP == true) {
                        vcContext.serverSupportsPNP = true;
                    }
                    if (this.resourceManagerStatusSupported == true) {
                        vcContext.resourceManagerStatusSupported = true;
                    }
                    var obj = new SCard.Response.Bind(reqObj.capsArray);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                    //sendBindResponse(reqObj.capsArray);
                }

                var sendBindResponse = function (capsArray) {

                };
            }
            return bind;
        })();

        Request.BindCommit = (function () {
            var scard_native_support = function (count) {
                this.size = 8;
                this.SupportedReadersCount = count;
                this.capId = SCard.Constants.SCARDVD_CAP_TYPE_NATIVE_OS_SCARD_SUPPORT;
            };

            scard_native_support.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.capId, this.size, 0);
                offset = Utility.WriteInt2(buffer, offset, this.SupportedReadersCount);
                offset = Utility.WriteByte(buffer, offset, 0);
                offset = Utility.WriteByte(buffer, offset, 0);
                return {
                    size: offset,
                    buffer: buffer
                }
            };

            //string encoding
            var string_encoding = function (flag, data) {
                this.encodingFlag = flag;
                this.size = 12;
                this.capId = SCard.Constants.SCARDVD_CAP_TYPE_STRING_ENCODING;
                if (data == null)
                    data = 0;
                this.encodingData = data;
            };

            string_encoding.prototype.getBuffer = function () {
                var buffer = new Uint8Array(this.size);
                var offset = writeHeaderPacket(buffer, this.capId, this.size, 0);
                offset = Utility.WriteByte(buffer, offset, this.encodingFlag);
                offset = Utility.WriteByte(buffer, offset, 0);//3 reserve bytes
                offset = Utility.WriteByte(buffer, offset, 0);
                offset = Utility.WriteByte(buffer, offset, 0);
                offset = Utility.WriteInt4(buffer, offset, this.encodingData);
                return {
                    size: offset,
                    buffer: buffer
                }
            };

            var bind = function () {
                this.respond = false;
            }

            bind.prototype.getObject = function (stream) {
                var constants = SCard.Constants;
                var offset = stream.ReadUInt16();
                var originalOffset = offset;
                var numCaps = stream.ReadByte();
                stream.ReadByte();//reserve byte
                var capsArray = [];
                for (var i = 0; i < numCaps; i++) {
                    var byteCount = stream.ReadUInt16();
                    var capabilityID = stream.ReadByte();
                    stream.ReadByte();
                    switch (capabilityID) {
                        case constants.SCARDVD_CAP_TYPE_NATIVE_OS_SCARD_SUPPORT:
                            var SupportedReadersCount = stream.ReadUInt16();
                            stream.ReadUInt16();
                            //TODO check this 1
                            SupportedReadersCount = 1;
                            break;

                        case constants.SCARDVD_CAP_TYPE_STRING_ENCODING:
                            var EncodingTypeBitMask = stream.ReadByte();
                            if (!(EncodingTypeBitMask > 0 && EncodingTypeBitMask < 4)) {
                                console.log("error in EncodingTypeBitMask =" + EncodingTypeBitMask);
                                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:ERROR=error in EncodingTypeBitMask =" + EncodingTypeBitMask);
                            }
                            stream.ReadByte(); //3 reserved bytes
                            stream.ReadByte();
                            stream.ReadByte();
                            var EncodingData = stream.ReadInt32();
                            break;
                        case constants.SCARDVD_CAP_TYPE_EXTENDED_COMMAND_SUPPORT:
                            stream.SkipByte(byteCount - 4);
                            break;
                        case constants.SCARDVD_CAP_TYPE_READER_PNP_SUPPORT:
                            stream.ReadByte(); //4 reserved bytes
                            stream.ReadByte();
                            stream.ReadByte();
                            stream.ReadByte();
                            break;
                        case constants.SCARDVD_CAP_TYPE_RESOURCE_MANAGER_STATUS_SUPPORT:
                            stream.SkipByte(byteCount - 4);
                            break;
                        case constants.SCARDVD_CAP_TYPE_CONCURRENT_PROTOCOL_SUPPORT:
                            stream.SkipByte(byteCount - 4);
                            break;
                        case constants.SCARDVD_CAP_TYPE_READER_INFO_SUPPORT:
                            stream.SkipByte(byteCount - 4);
                            break;
                        default:
                            {
                                stream.SkipByte(byteCount - 4);
                                //do nothing.
                            }
                    }

                }
                var obj = {};
                obj.respond = this.respond;
                if (this.respond) {
                    obj.capsArray = capsArray;
                }
                return obj;
            };

            bind.prototype.process = function (reqObj, vcContext) {
                if (reqObj.respond) {
                    var obj = new SCard.Response.Bind(reqObj.capsArray);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                    //sendBindResponse(reqObj.capsArray);
                }

                var sendBindResponse = function (capsArray) {

                };
            }
            return bind;
        })();

        Request.ManagerStatus = (function () {
            var managerStatus = function () {

            };

            managerStatus.prototype.getObject = function (stream) {
                //var scope = stream.ReadInt32();
                return {
                    //scope: scope
                };
            };

            managerStatus.prototype.process = function (reqObj, vcContext) {
				
				var sendManagerStatus = function() {
					var obj = new SCard.Response.ManagerStatus();
                    var data = obj.getBuffer();
                    vcContext.onData(data);
				};
				
                var getManagerStatusSuccess = function () {
                    vcContext.pcscInitialised = true;
                    if (!vcContext.firstTimeMonitorInitated) {
                        vcContext.monitor = new SCard.Monitor(vcContext);
                        vcContext.firstTimeMonitorInitated = true;
                    }
					
					sendManagerStatus();
                };

                var getManagerStatusFailure = function () {
					vcContext.pcscInitialised = false;
                    vcContext.onSCardFailure('getManagerStatusFailure, there is no pcsc instance running', arguments);
					
					// We should send this only when we have Smartcard connector, however if app is not present it is never going to come up.
					// Since we are not setting pcscInitialised, an error would be returned on subsequent call to establishContext.
					sendManagerStatus();
                };

                try {
                    vcContext.apiContainer.getManagerStatus(getManagerStatusSuccess, getManagerStatusFailure);
                } catch (error) {
                    console.log(error.stack);
                    writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:ERROR:" + error.stack);
                }

            };

            return managerStatus;
        })();

        Request.EstablishContext = (function () {
            var establishContext = function () {

            };

            establishContext.prototype.getObject = function (stream) {
                var scope = stream.ReadInt32();
                return {
                    scope: scope
                };
            };

            establishContext.prototype.process = function (reqObj, vcContext) {
                var EstablishContextSuccess = function (context) {
                    var obj = new SCard.Response.EstablishContext(vcContext.successCode, context);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var EstablishContextFailure = function (errorCode) {
                    errorCode = vcContext.mapPrototypeErrorCode(errorCode);
                    var obj = new SCard.Response.EstablishContext(errorCode, 0);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
					if(!(vcContext.pcscInitialised == false)){//if pcscInitialised is undefined, still want to log
						vcContext.onSCardFailure('EstablishContextFailure ' + errorCode);
					}
                };

                if (vcContext.pcscInitialised) {
                    vcContext.scard.EstablishContext(reqObj.scope, EstablishContextSuccess, EstablishContextFailure);
                } else {
					// We got establish even though we were not initialized. So we need to give an error now.
					EstablishContextFailure(SCard.Constants.CTXSCARD_E_NO_READERS_AVAILABLE);
				}
            };

            return establishContext;
        })();

        Request.ListReaderRequest = (function () {
            var listReaderRequest = function () {

            }
            listReaderRequest.prototype.getObject = function (stream) {
                var listArrayFromServer = [];
                var context = stream.ReadInt32();
                var oReaderGroupsMultiStr = stream.ReadUInt16();
                var ReaderGroupsMultiStrByteCount = stream.ReadUInt16();
                if (oReaderGroupsMultiStr > 0 && ReaderGroupsMultiStrByteCount > 0) {
                    if (oReaderGroupsMultiStr == 12) {
                        for (var i = 0; i < ReaderGroupsMultiStrByteCount; i++) {
                            listArrayFromServer[i] = stream.ReadByte();
                        }
                    }
                }
                return {
                    context: context,
                    groupName: listArrayFromServer
                };
            };

            listReaderRequest.prototype.process = function (reqObj, vcContext) {
                var ListReaderGroupsSuccess = function (context, readerGroups) {
                    if (!readerGroups) {
                        vcContext.onSCardFailure('ListReaderGroupsSuccess readerGroups undefined');
                        return;
                    }
                    vcContext.scard.ListReaders(context, ListReadersSuccess.bind(undefined, context), ListReadersFailure);
                };

                var ListReaderGroupsFailure = function (errorCode) {
					errorCode = vcContext.mapPrototypeErrorCode(errorCode);
                    var obj = new SCard.Response.ListReader(errorCode, '');
                    var data = obj.getBuffer();
                    vcContext.onData(data);
					vcContext.onSCardFailure('ListReaderGroupsFailure ' + errorCode);
                };

                var ListReadersSuccess = function (context, readerName) {
                    var obj = new SCard.Response.ListReader(vcContext.successCode, readerName[0]);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var ListReadersFailure = function (errorCode) {
                    errorCode = vcContext.mapPrototypeErrorCode(errorCode);
                    var obj = new SCard.Response.ListReader(errorCode, '');
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                    vcContext.onSCardFailure('ListReadersFailure ' + errorCode);
                };

                vcContext.scard.ListReaderGroups(reqObj.context, ListReaderGroupsSuccess.bind(undefined, reqObj.context), ListReaderGroupsFailure);
            }
            return listReaderRequest;
        })();

        Request.ReleaseContext = (function () {
            var releaseContext = function () {

            }
            releaseContext.prototype.getObject = function (stream) {
                var context = stream.ReadInt32();
                return {
                    context: context
                };
            };

            releaseContext.prototype.process = function (reqObj, vcContext) {
                var ReleaseContextSuccess = function () {
                    var obj = new SCard.Response.ReleaseContext(vcContext.successCode);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var ReleaseContextFailure = function (errorCode) {
                    errorCode = vcContext.mapPrototypeErrorCode(errorCode);
                    var obj = new SCard.Response.ReleaseContext(errorCode);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                    vcContext.onSCardFailure('ReleaseContextFailure ' + errorCode);
                };

                vcContext.scard.ReleaseContext(reqObj.context, ReleaseContextSuccess, ReleaseContextFailure);
            }

            return releaseContext;
        })();

        Request.Connect = (function () {
            var connect = function () {

            }
            connect.prototype.getObject = function (stream) {
                var context = stream.ReadInt32();
                var readerOffset = stream.ReadUInt16();
                var readerSize = stream.ReadUInt16();
                var shareModeFlag = stream.ReadInt32();
                var preferredProtocolBitMask = stream.ReadInt32();
                var buffer = new Uint8Array(readerSize);
                for (var i = 0; i < readerSize; i++) {
                    buffer[i] = stream.ReadByte();
                }
                var readerName = Convert.ToUTF16LEFromByteArray(buffer);
                return {
                    context: context,
                    readerName: readerName,
                    shareModeFlag: shareModeFlag,
                    preferredProtocolBitMask: preferredProtocolBitMask,
                };
            };
            connect.prototype.process = function (reqObj, vcContext) {
                var ConnectSuccess = function (handle, activeProtocol) {
                    var obj = new SCard.Response.Connect(vcContext.successCode, handle, activeProtocol);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
					CEIP.add('smartcard:used',true);
                };

                var ConnectFailure = function (errorCode) {
                    errorCode = vcContext.mapPrototypeErrorCode(errorCode);
                    var obj = new SCard.Response.Connect(errorCode, 0, 0);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                    vcContext.onSCardFailure('ConnectFailure ' + errorCode);
                };
                vcContext.scard.Connect(reqObj.context, reqObj.readerName, reqObj.shareModeFlag, reqObj.preferredProtocolBitMask, ConnectSuccess, ConnectFailure);
            }
            return connect;
        })();

        Request.BeginTransaction = (function () {
            var beginTransaction = function () {

            }
            beginTransaction.prototype.getObject = function (stream) {
                var handle = stream.ReadInt32();
                return {
                    handle: handle
                };
            };

            beginTransaction.prototype.process = function (reqObj, vcContext) {
                var BeginTransactionSuccess = function () {
                    var obj = new SCard.Response.BeginTransaction(vcContext.successCode);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var BeginTransactionFailure = function (errorCode) {
                    errorCode = vcContext.mapPrototypeErrorCode(errorCode);
                    var obj = new SCard.Response.BeginTransaction(errorCode);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                    vcContext.onSCardFailure('BeginTransactionFailure ' + errorCode);
                };

                vcContext.scard.BeginTransaction(reqObj.handle, BeginTransactionSuccess, BeginTransactionFailure);
            }

            return beginTransaction;
        })();

        Request.Status = (function () {
            var status = function () {

            }
            status.prototype.getObject = function (stream) {
                var handle = stream.ReadInt32();
                return {
                    handle: handle
                };
            };

            status.prototype.process = function (reqObj, vcContext) {
                var StatusSuccess = function (readerName, state, protocol, atr) {
                    vcContext.curProtocol = protocol;
                    var mappedStateValue = vcContext.mapSCardStateValue(state, protocol);
					writeHTML5Log(0, "STATUS_COMMAND: protocol = " + protocol + " mappedStateValue = " + mappedStateValue + " state = " + state);
                    var obj = new SCard.Response.Status(vcContext.successCode, readerName, mappedStateValue, protocol, atr);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var StatusFailure = function (errorCode) {
                    errorCode = vcContext.mapPrototypeErrorCode(errorCode);
                    var obj = new SCard.Response.Status(errorCode, "", 0, 0, []);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                    vcContext.onSCardFailure('StatusFailure ' + errorCode);
                };

                vcContext.scard.Status(reqObj.handle, StatusSuccess, StatusFailure);
            }
            return status;
        })();

        Request.GetAttribute = (function () {
            var getAttribute = function () {

            }
            getAttribute.prototype.getObject = function (stream) {
                var handle = stream.ReadInt32();
                var attrId = stream.ReadInt32();
                return {
                    handle: handle,
                    attrId: attrId
                };
            };

            getAttribute.prototype.process = function (reqObj, vcContext) {
                var GetAttribSuccess = function (attrId, attrValue) {
                    var atr = attrValue;
                    if (attrId == SCard.Constants.SCARD_ATTR_DEVICE_FRIENDLY_NAME_A) {
                        atr = mapPrototypeAttribute(attrValue);
                    }
                    var obj = new SCard.Response.GetAttribute(vcContext.successCode, atr);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var mapPrototypeAttribute = function (atr) {
                    var temp = [];
                    for (var i = 0; i < 2 * atr.length; i++) {
                        temp[i++] = atr[parseInt(i / 2)];
                        temp[i] = 0;
                    }
                    return temp;
                };

                var GetAttribFailure = function (errorCode) {
                    errorCode = vcContext.mapPrototypeErrorCode(errorCode);
                    vcContext.onSCardFailure('GetAttribFailure ' + errorCode);
                    var attrValue = [];
                    var obj = new SCard.Response.GetAttribute(errorCode, []);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var constants = SCard.Constants;
                var value;
                var grcr;
                var attrId = reqObj.attrId;
                switch (attrId) {
                    case constants.SCARD_ATTR_ATR_STRING:
                        writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=SCARD_ATTR_ATR_STRING");
                        break;
                    case constants.SCARD_ATTR_DEVICE_FRIENDLY_NAME:
                        writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=SCARD_ATTR_DEVICE_FRIENDLY_NAME");
                        attrId = constants.SCARD_ATTR_DEVICE_FRIENDLY_NAME_A;
                        break;
                    case constants.SCARD_ATTR_DEVICE_SYSTEM_NAME:
                        writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=SCARD_ATTR_DEVICE_SYSTEM_NAME");
                        break;
                    case constants.SCARD_ATTR_ICC_INTERFACE_STATUS:
                        writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=SCARD_ATTR_ICC_INTERFACE_STATUS");
                        break;
                    case constants.SCARD_ATTR_ICC_PRESENCE:
                        writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=SCARD_ATTR_ICC_PRESENCE");
                        break;
                    case constants.SCARD_ATTR_MAXINPUT:
                        writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=SCARD_ATTR_MAXINPUT");
                        break;
                    case constants.SCARD_ATTR_VENDOR_IFD_SERIAL_NO:
                        writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=SCARD_ATTR_VENDOR_IFD_SERIAL_NO");
                        break;
                    case constants.SCARD_ATTR_VENDOR_IFD_VERSION:
                        writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=SCARD_ATTR_VENDOR_IFD_VERSION");
                        break;
                    case constants.SCARD_ATTR_VENDOR_NAME:
                        writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=SCARD_ATTR_VENDOR_NAME");
                        break;
                    case constants.SCARD_ATTR_CURRENT_PROTOCOL_TYPE:
                        writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=SCARD_ATTR_CURRENT_PROTOCOL_TYPE");
                        value = [vcContext.curProtocol, 0x00, 0x00, 0x00];
                        var obj = new SCard.Response.GetAttribute(vcContext.successCode, value);
                        var data = obj.getBuffer();
                        vcContext.onData(data);
                        return;
                        break;
                    case constants.SCARD_ATTR_CHANNEL_ID:
                        writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=SCARD_ATTR_CHANNEL_ID");
                        break;
                    default:
                        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++");
                        console.log("error attribute id = " + attrId);
                        writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:ERROR=error attribute id = " + attrId);
                        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++");
                }
                vcContext.scard.GetAttrib(reqObj.handle, attrId, GetAttribSuccess.bind(undefined, attrId), GetAttribFailure);
            }
            return getAttribute;
        })();

        Request.Transmit = (function () {
            var transmit = function () {

            }
            transmit.prototype.getObject = function (stream) {
                var handle = stream.ReadInt32();
                var pciBuffOffset = stream.ReadUInt16();
                var pciBuffSize = stream.ReadUInt16();
                var sendBuffOffset = stream.ReadUInt16();
                var sendBuffSize = stream.ReadUInt16();
                var receiveBuffSize = stream.ReadUInt16();
                stream.ReadUInt16();//reserved bytes
                var hostReceiveBuffSize = stream.ReadInt32();
                var sendBufferTotalByteCount = stream.ReadInt32();
                var protocol = null;
                var picByteCount = null;
                var rawData = null;
                if (pciBuffOffset == 28) {
                    protocol = stream.ReadInt32();
                    picByteCount = stream.ReadInt32();
                }
                if (sendBuffOffset == 36) {//36 because pci buffer size is always 8
                    rawData = [];//new Uint8Array(sendBuffSize);
                    for (var i = 0; i < sendBuffSize; i++) {
                        rawData.push(stream.ReadByte());
                    }
                }
                return {
                    handle: handle,
                    proto: protocol,
                    rawData: rawData
                };
            };

            transmit.prototype.process = function (reqObj, vcContext) {
                var TransmitSuccess = function (responseProtocolInformation, responseData) {
                    var obj = new SCard.Response.Transmit(vcContext.successCode, responseData);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var TransmitFailure = function (errorCode) {
                    errorCode = vcContext.mapPrototypeErrorCode(errorCode);
                    vcContext.onSCardFailure('TransmitFailure ' + errorCode);
                    var obj = new SCard.Response.Transmit(errorCode, []);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var temp = { 'protocol': reqObj.proto };
                vcContext.scard.Transmit(reqObj.handle, temp, reqObj.rawData, TransmitSuccess, TransmitFailure);
            }
            return transmit;
        })();

        Request.EndTransaction = (function () {
            var endTransaction = function () {

            }
            endTransaction.prototype.getObject = function (stream) {
                var handle = stream.ReadInt32();
                var dispositionFlag = stream.ReadInt32();
                return {
                    handle: handle,
                    dispositionFlag: dispositionFlag
                };
            };

            endTransaction.prototype.process = function (reqObj, vcContext) {
                var EndTransactionSuccess = function () {
                    var obj = new SCard.Response.EndTransaction(vcContext.successCode);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var EndTransactionFailure = function (errorCode) {
                    errorCode = vcContext.mapPrototypeErrorCode(errorCode);
                    var obj = new SCard.Response.EndTransaction(errorCode);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                    vcContext.onSCardFailure('EndTransactionFailure ' + errorCode);
                };

                vcContext.scard.EndTransaction(reqObj.handle, reqObj.dispositionFlag, EndTransactionSuccess, EndTransactionFailure);
            }
            return endTransaction;
        })();

        Request.Disconnect = (function () {
            var disconnect = function () {

            }
            disconnect.prototype.getObject = function (stream) {
                var handle = stream.ReadInt32();
                var dispositionFlag = stream.ReadInt32();
                return {
                    handle: handle,
                    dispositionFlag: dispositionFlag
                };
            };

            disconnect.prototype.process = function (reqObj, vcContext) {
                var DisconnectSuccess = function () {
                    var obj = new SCard.Response.Disconnect(vcContext.successCode);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var DisconnectFailure = function (errorCode) {
                    errorCode = vcContext.mapPrototypeErrorCode(errorCode);
                    var obj = new SCard.Response.Disconnect(errorCode);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                    vcContext.onSCardFailure('DisconnectFailure ' + errorCode);
                };

                vcContext.scard.Disconnect(reqObj.handle, reqObj.dispositionFlag, DisconnectSuccess, DisconnectFailure);
            }
            return disconnect;
        })();

        Request.IsValidContext = (function () {
            var isValidContext = function () {

            }
            isValidContext.prototype.getObject = function (stream) {
                var context = stream.ReadInt32();
                return {
                    context: context
                };
            };

            isValidContext.prototype.process = function (reqObj, vcContext) {
                var IsValidContextSuccess = function () {
                    var obj = new SCard.Response.IsValidContext(vcContext.successCode);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var IsValidContextFailure = function (errorCode) {
                    errorCode = vcContext.mapPrototypeErrorCode(errorCode);
                    var obj = new SCard.Response.IsValidContext(errorCode);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                    vcContext.onSCardFailure('IsValidContextFailure ' + errorCode);
                };

                vcContext.scard.IsValidContext(reqObj.context, IsValidContextSuccess, IsValidContextFailure);
            }
            return isValidContext;
        })();

        Request.Reconnect = (function () {
            var reconnect = function () {

            }
            reconnect.prototype.getObject = function (stream) {
                var handle = stream.ReadInt32();
                var shareModeFlag = stream.ReadInt32();
                var preferredProtocolBitMask = stream.ReadInt32();
                var initializationFlag = stream.ReadInt32();
                return {
                    handle: handle,
                    shareModeFlag: shareModeFlag,
                    preferredProtocolBitMask: preferredProtocolBitMask,
                    initializationFlag: initializationFlag
                };
            };

            reconnect.prototype.process = function (reqObj, vcContext) {
                var ReconnectSuccess = function (protocol) {
                    var obj = new SCard.Response.Reconnect(vcContext.successCode, vcContext.curProtocol);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var ReconnectFailure = function (errorCode) {
                    var obj = new SCard.Response.Reconnect(errorCode, 0);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };
                vcContext.scard.Reconnect(reqObj.handle, reqObj.shareModeFlag, reqObj.preferredProtocolBitMask, reqObj.initializationFlag, ReconnectSuccess.bind(undefined, reqObj.preferredProtocolBitMask), ReconnectFailure);

            }


            return reconnect;
        })();

        Request.Control = (function () {
            var control = function () {

            }
            control.prototype.getObject = function (stream) {
                var handle = stream.ReadInt32();
                var controlCode = stream.ReadInt32();
                var bufferOffset = stream.ReadUInt16();
                var bufferSize = stream.ReadUInt16();
                var outBufferByteCount = stream.ReadInt32();
                var BufferSize = stream.ReadInt32();
                var data = [];
                for (var i = 0; i < bufferSize; i++) {
                    data.push(stream.ReadByte());
                }
                return {
                    handle: handle,
                    controlCode: controlCode,
                    data: data
                };
            };

            control.prototype.process = function (reqObj, vcContext) {
                var ControlSuccess = function (responseData) {
                    var obj = new SCard.Response.Control(vcContext.successCode, responseData);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                };

                var ControlFailure = function (errorCode) {
                    errorCode = vcContext.mapPrototypeErrorCode(errorCode);
                    var obj = new SCard.Response.Control(errorCode, []);
                    var data = obj.getBuffer();
                    vcContext.onData(data);
                    vcContext.onSCardFailure('Control ' + errorCode);
                };

                vcContext.scard.Control(reqObj.handle, reqObj.controlCode, reqObj.data, ControlSuccess, ControlFailure);
            }
            return control;
        })();


    })(Request);

    SCard.Request = Request;

})(SCard || (SCard = {}));