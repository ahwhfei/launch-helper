/**
* This class implements the ICA File
* virtual channel client functionality.
*
*/
var SCard;
(function (SCard) {
    var Engine = (function () {
        //static variables
        var vcContext = {};
        vcContext.streamName = "CTXSCRD";
        // Why is this 0x2000?
        vcContext.streamSize = 0x2000;
        vcContext.firstTimeMonitorInitated = false;
        vcContext.monitorContext;
        vcContext.monitorReaderName;
        vcContext.curProtocol = 3;

        vcContext.serverSupportsPNP = false;
        vcContext.resourceManagerStatusSupported = false;
        vcContext.isReaderPlugged = false;
        vcContext.pcscInitialised;
        //command map
        var commandMap = {};

        //Constructor
        function Engine(callbackWrapper1) {
            vcContext.callBackWrapper = callbackWrapper1;
            vcContext.constants = SCard.Constants;
            vcContext.apiContainer = new SCard.ApiContainer(vcContext);
            vcContext.scard = vcContext.apiContainer.apiWrapper;
            vcContext.request = SCard.Request;
            vcContext.response = SCard.Response;
            vcContext.successCode = SCard.Constants.CTXSCARD_S_SUCCESS;
            vcContext.readerStatus = SCard.Constants.READER_UNPLUGGED;
            vcContext.cardStatus = SCard.Constants.CTXSCARD_STATE_UNAWARE;
            initialiseCommandMap();
        }

        var initialiseCommandMap = function () {
            commandMap[SCard.Constants.SCARDVD_CMD_BIND_REQUEST] = { obj: SCard.Request.BindRequest, cmdName: 'SCARDVD_CMD_BIND_REQUEST' };
            commandMap[SCard.Constants.SCARDVD_CMD_BIND_COMMIT] = { obj: SCard.Request.BindCommit, cmdName: 'SCARDVD_CMD_BIND_COMMIT' };
            commandMap[SCard.Constants.SCARDVD_CMD_RESOURCE_MANAGER_QUERY_RUNNING] = { obj: SCard.Request.ManagerStatus, cmdName: 'SCARDVD_CMD_RESOURCE_MANAGER_QUERY_RUNNING' };
            commandMap[SCard.Constants.SCARDVD_CMD_ESTABLISH_CONTEXT_REQUEST] = { obj: SCard.Request.EstablishContext, cmdName: 'SCARDVD_CMD_ESTABLISH_CONTEXT_REQUEST' };
            commandMap[SCard.Constants.SCARDVD_CMD_LIST_READERS_REQUEST] = { obj: SCard.Request.ListReaderRequest, cmdName: 'SCARDVD_CMD_LIST_READERS_REQUEST' };
            commandMap[SCard.Constants.SCARDVD_CMD_RELEASE_CONTEXT_REQUEST] = { obj: SCard.Request.ReleaseContext, cmdName: 'SCARDVD_CMD_RELEASE_CONTEXT_REQUEST' };
            commandMap[SCard.Constants.SCARD_CMD_CONNECT_REQUEST] = { obj: SCard.Request.Connect, cmdName: 'SCARD_CMD_CONNECT_REQUEST' };
            commandMap[SCard.Constants.SCARD_CMD_BEGIN_TRANSACTION_REQUEST] = { obj: SCard.Request.BeginTransaction, cmdName: 'SCARD_CMD_BEGIN_TRANSACTION_REQUEST' };
            commandMap[SCard.Constants.SCARD_CMD_STATUS_REQUEST] = { obj: SCard.Request.Status, cmdName: 'SCARD_CMD_STATUS_REQUEST' };
            commandMap[SCard.Constants.SCARDVD_CMD_GET_READER_CAPABILITIES_REQUEST] = { obj: SCard.Request.GetAttribute, cmdName: 'SCARDVD_CMD_GET_READER_CAPABILITIES_REQUEST' };
            commandMap[SCard.Constants.SCARDVD_CMD_TRANSMIT_REQUEST] = { obj: SCard.Request.Transmit, cmdName: 'SCARDVD_CMD_TRANSMIT_REQUEST' };
            commandMap[SCard.Constants.SCARDVD_CMD_END_TRANSACTION_REQUEST] = { obj: SCard.Request.EndTransaction, cmdName: 'SCARDVD_CMD_END_TRANSACTION_REQUEST' };
            commandMap[SCard.Constants.SCARDVD_CMD_DISCONNECT_REQUEST] = { obj: SCard.Request.Disconnect, cmdName: 'SCARDVD_CMD_DISCONNECT_REQUEST' };
            commandMap[SCard.Constants.SCARDVD_CMD_IS_VALID_CONTEXT_REQUEST] = { obj: SCard.Request.IsValidContext, cmdName: 'SCARDVD_CMD_IS_VALID_CONTEXT_REQUEST' };
            commandMap[SCard.Constants.SCARD_CMD_RECONNECT_REQUEST] = { obj: SCard.Request.Reconnect, cmdName: 'SCARD_CMD_RECONNECT_REQUEST' };
            commandMap[SCard.Constants.SCARDVD_CMD_CONTROL_REQUEST] = { obj: SCard.Request.Control, cmdName: 'SCARDVD_CMD_CONTROL_REQUEST' };
        }

        /**
        * Processes the commands as they come over the virtual channel.  This
        * method is currently designed to run continually in the thread.  This
        * consuming is synchronized by the vStream which blocks on any read until
        * data is available.
        */
        var processCommand = function () {
            var obj;
            var packet_len = vStream.ReadUInt16();  // Length is two-byte
            var command = vStream.ReadByte();   // Commands are 1-byte
            var flag = vStream.ReadByte();  //reserved one.
            packet_len = packet_len - 4;

            vStream.WaitForSpace(packet_len);
            var constants = SCard.Constants;
			if(!(vcContext.pcscInitialised == false)){//if pcscInitialised is undefined, still want to log
				writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=" + commandMap[command].cmdName);
			}
            if (commandMap && commandMap[command] != undefined) {
                var req = new commandMap[command].obj();
                var reqObj = req.getObject(vStream);
                req.process(reqObj, vcContext);

            }
            else {
                console.log('----------------------new command/error command---------------------',command);
            }
        }

        vcContext.onData = function (obj) {
            vStream.WriteByte(obj.buffer, 0, obj.size);
        };

        var mapPrototypeErrorCode = function (errorCode) {
            if(isNaN(parseInt(errorCode))){
                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:ERROR=Error code is NaN. Forcing to CTXSCARD_F_UNKNOWN_ERROR "+ errorCode);
                errorCode = SCard.Constants.CTXSCARD_F_UNKNOWN_ERROR;
            }
            if (errorCode < 0) {
                errorCode = 0xFFFFFFFF + errorCode + 1;
            }
            return errorCode;
        };
        vcContext.mapPrototypeErrorCode = mapPrototypeErrorCode;

        vcContext.mapSCardStateValue = function (state, protocol) {
            var ica;
            var constants = SCard.Constants;
            if (state & constants.SCARD_SPECIFIC) {
                ica = constants.CTXSCARD_SPECIFIC;
            }
            else if (state & constants.SCARD_NEGOTIABLE) {
                if (protocol == SCard.Constants.CTXSCARD_PROTOCOL_T0 || protocol == SCard.Constants.CTXSCARD_PROTOCOL_T1) {
                    ica = constants.CTXSCARD_SPECIFIC;
                } else {
                    ica = constants.CTXSCARD_NEGOTIABLE;
                }
            }
            else if (state & constants.SCARD_POWERED) {
                ica = constants.CTXSCARD_POWERED;
            }
            else if (state & constants.SCARD_SWALLOWED) {
                ica = constants.CTXSCARD_SWALLOWED;
            }
            else if (state & constants.SCARD_PRESENT) {
                ica = constants.CTXSCARD_PRESENT;
            }
            else if (state & constants.SCARD_ABSENT) {
                ica = constants.CTXSCARD_ABSENT;
            }
            else {
                ica = constants.CTXSCARD_UNKNOWN;
            }
            return ica;
        }

        vcContext.onSCardFailure = function (errorMessage) {
            writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:ERROR=failure in SCard VC "+ errorMessage);
        };

        //virtual channel
        {
            var driverShutdown = function () {

            };

            var createVirtualStream = function (streamName, streamSize) {
                var chnl = ChannalMap.virtualChannalMap[streamName];
                var stream = new VirtualStream(chnl, vcContext.callBackWrapper, streamSize);
                return stream;
            };

            Engine.prototype.EndWriting = function endWriting(reason) {

            };

            Engine.prototype.driverStart = function () {
            };

            Engine.prototype.initialize = function (configObj) {

            };

            var prevReadIndex = 0;

            Engine.prototype._Run = function _run() {
                var errorHandle = function () {
                    vStream.setReadIndex(prevReadIndex);
                    vStream.compact();
                };

                try {
                    while (vStream.Available() > 0) {
                        /* Main processing */
                        prevReadIndex = vStream.GetReadIndex();
                        try {
                            processCommand();
                        }
                        catch (error) {
                            if (error == VirtualStreamError.NO_SPACE_ERROR) {
                                errorHandle();
                                return;
                            }
                            else {
                                throw error;
                            }
                        }

                        prevReadIndex = vStream.GetReadIndex();
                    }
                }
                catch (error) {
                    throw error;
                }
            };

            Engine.prototype.Run = function run() {
                prevReadIndex = 0;
                vStream.RegisterCallback(this._Run);
            };

            Engine.prototype.SetStack = function (virtualStreamSupplier) {
                vStream = createVirtualStream(vcContext.streamName, vcContext.streamSize);
                return vStream;
            };

            function formatBinaryDataArray(array) {
                var formattedBytes = [];
                array.forEach(function (byte) {
                    var formattedByte = byte.toString(16).toUpperCase();
                    if (formattedByte.length < 2)
                        formattedByte = '0' + formattedByte;
                    formattedBytes.push(formattedByte);
                });
                return '<' + formattedBytes.join(' ') + '>';
            }
        }

        return Engine;
    })();
    SCard.Engine = Engine;
})(SCard || (SCard = {}));

