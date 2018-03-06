var SCard;
(function (SCard) {

    //Monitoring code
    var Monitor = (function () {
        var vcContext;
        var constants;
        function Monitor(ctxt) {
            vcContext = ctxt;
            constants = SCard.Constants;
            writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:INFO=startMonitor called for getStatusChange");
            vcContext.scard.EstablishContext(SCard.Constants.CTXSCARD_SCOPE_USER, onMonitorContextEstablished, onMonitorEstablishContextFailure);
        };

        var onMonitorEstablishContextFailure = function (errorCode) {
			errorCode = vcContext.mapPrototypeErrorCode(errorCode);
            vcContext.onSCardFailure('monitor failed @ EstablishContext ' + errorCode);
        };

        var onMonitorContextEstablished = function (context) {
            vcContext.monitorContext = context;
            vcContext.scard.ListReaderGroups(context, monitorListReaders, onMonitorListReadersFailure);
        };

        var monitorListReaders = function (readerGroups) {
            if (!readerGroups) {
                vcContext.onSCardFailure('monitorListReaders readerGroups undefined');
                return;
            }
            vcContext.scard.ListReaders(vcContext.monitorContext, monitorListReaderName, onMonitorListReadersFailure);
        };

        var monitorListReaderName = function (readerName) {
            vcContext.monitorReaderName = readerName[0];
            //monitorCard();
            writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:INFO=reader is plugged before launch" + vcContext.monitorReaderName);
            vcContext.readerStatus = constants.READER_PLUGGED;
            monitorReader();
        };

        var onMonitorListReadersFailure = function (errorCode) {
			errorCode = vcContext.mapPrototypeErrorCode(errorCode);
            if (errorCode == constants.CTXSCARD_E_NO_READERS_AVAILABLE) {
                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:ERROR=reader is not plugged in");
                vcContext.onSCardFailure('monitor failed @ ListReaders; Hence checking for reader '+errorCode);
                monitorReader();
            } else {
                vcContext.onSCardFailure('monitor failed @ ListReaders; Error is different that no readers available ' + errorCode);
            }
        };

        /*var monitorReader = function () {
            if (vcContext.readerStatus == constants.READER_UNPLUGGED) {
                vcContext.scard.GetStatusChange(vcContext.monitorContext, constants.TIMEOUT_SECONDS * 1000, constants.SPECIAL_READER_NAME, constants.CTXSCARD_STATE_UNAWARE,
                    monitorReaderSuccess.bind(undefined, constants.CTXSCARD_STATE_UNAWARE), monitorReaderFailure);
            } else if (vcContext.readerStatus == constants.READER_PLUGGED) {
                vcContext.scard.GetStatusChange(vcContext.monitorContext, 0, constants.SPECIAL_READER_NAME, constants.CTXSCARD_STATE_UNAWARE,
                    monitorReaderSuccess.bind(undefined, constants.CTXSCARD_STATE_UNAWARE), monitorReaderFailure);
            }
        };*/
        
        var monitorReader = function () {
            if (vcContext.readerStatus == constants.READER_UNPLUGGED) {
                vcContext.scard.GetStatusChange(vcContext.monitorContext, constants.TIMEOUT_SECONDS * 1000, constants.SPECIAL_READER_NAME, constants.CTXSCARD_STATE_UNAWARE,
                    monitorReaderSuccess.bind(undefined, constants.CTXSCARD_STATE_UNAWARE), monitorReaderFailure);
            }else{
                vcContext.scard.ListReaders(vcContext.monitorContext, monitorCard, monitorReaderFailure);
            }
        }

        var monitorReaderSuccess = function (state, readerStates) {
            if (readerStates[0]['event_state'] & constants.CTXSCARD_STATE_CHANGED) {
                if (vcContext.readerStatus == constants.READER_PLUGGED) {
                    vcContext.readerStatus = constants.READER_UNPLUGGED;
                    writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:INFO=monitorReaderSuccess: reader is unplugged");
                    monitorReader();
                } else {
                    vcContext.readerStatus = constants.READER_PLUGGED;
                    writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:INFO=monitorReaderSuccess: reader is plugged");
                    onMonitorContextEstablished(vcContext.monitorContext);
                }
            }
        };

        var monitorReaderFailure = function (errorCode) {
            errorCode = vcContext.mapPrototypeErrorCode(errorCode);
            if(errorCode == SCard.Constants.CTXSCARD_F_UNKNOWN_ERROR){
                return;
            }
            if (errorCode == constants.CTXSCARD_E_TIMEOUT) {
                if (vcContext.readerStatus == constants.READER_PLUGGED) {
                    monitorCard();
                    return;
                }
                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:ERROR=Timeout");
            }
            else {
                vcContext.readerStatus = constants.READER_UNPLUGGED;
                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:ERROR=sendCmdReaderStatus, reader is not present (monitorReaderFailure)");
                sendCmdReaderStatus(constants.SPECIAL_READER_NAME, constants.CTXSCARD_STATE_EMPTY, [], vcContext.readerStatus);
            }
            monitorReader();
        };

        var monitorCard = function () {
            var timeOut;
            if (vcContext.cardStatus == constants.CTXSCARD_STATE_UNAWARE) {
                timeOut = 0;
            } else {
                timeOut = constants.TIMEOUT_SECONDS * 1000;
            }
            vcContext.scard.GetStatusChange(vcContext.monitorContext, timeOut, vcContext.monitorReaderName, vcContext.cardStatus,
                monitorCardSuccess.bind(undefined, vcContext.cardStatus), monitorCardFailure);
        };

        var monitorCardSuccess = function (curState, readerStates) {
            var eventState = readerStates[0]['event_state'];
            var atr = readerStates[0]['atr'];
            var pnp = 0;
            if (vcContext.serverSupportsPNP) {
                pnp = vcContext.readerStatus;
            }
            //vcContext.cardStatus = constants.CTXSCARD_STATE_EMPTY;
            if (curState == readerStates[0]['current_state'] && (eventState & constants.CTXSCARD_STATE_CHANGED)) {
                if (eventState & constants.CTXSCARD_STATE_MUTE) {
                    writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:INFO=card is unresponsive; updating server");
                    vcContext.cardStatus = constants.CTXSCARD_STATE_MUTE;
                } else if (eventState & constants.CTXSCARD_STATE_UNAVAILABLE) {
                    writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:INFO=card is unavailable; updating server");
                    vcContext.cardStatus = constants.CTXSCARD_STATE_UNAVAILABLE;
                }
                else if (eventState & constants.CTXSCARD_STATE_PRESENT) {
                    writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:INFO=card is present; updating server");
                    vcContext.cardStatus = constants.CTXSCARD_STATE_PRESENT;
                } else if (eventState & constants.CTXSCARD_STATE_EMPTY) {
                    writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:INFO=card is removed; updating server");
                    vcContext.cardStatus = constants.CTXSCARD_STATE_EMPTY;
                }
                sendCmdReaderStatus(vcContext.monitorReaderName, vcContext.cardStatus, atr, pnp);
            }
            monitorReader();
        };

        var sendCmdReaderStatus = function (readerName, state, attr, pnp) {
            if (state == SCard.Constants.CTXSCARD_STATE_PRESENT) {
                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:INFO=send reader status to server : CTXSCARD_STATE_PRESENT");
            }
            else if (state == SCard.Constants.CTXSCARD_STATE_EMPTY) {
                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:INFO=send reader status to server : CTXSCARD_STATE_EMPTY");
            }
            var obj = new SCard.Response.ReaderStatus(readerName, state, attr, pnp);
            var data = obj.getBuffer();
            vcContext.onData(data);
        };

        var monitorCardFailure = function (errorCode) {
            errorCode = vcContext.mapPrototypeErrorCode(errorCode);
            if (errorCode == constants.CTXSCARD_E_TIMEOUT) {
                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:ERROR=Timeout. Calling monitorCard");
            } else if (errorCode == constants.CTXSCARD_E_UNKNOWN_READER) {
                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:ERROR=unknown reader error! Mostly reader in unplugged");
                vcContext.readerStatus = constants.READER_UNPLUGGED;
                vcContext.cardStatus = constants.CTXSCARD_STATE_UNAWARE;
            }
            else {
                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:MONITOR:|:ERROR=unknown error in monitorCardFailure " + errorCode);
				return;
            }
            monitorReader();
        };
        return Monitor;
    })();
    SCard.Monitor = Monitor;

})(SCard || (SCard = {}));