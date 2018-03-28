var SCard;
(function (SCard) {
    var ApiContainer = (function () {
        var pcsc;
        var API;
        var constants;
        var context;
        var CLIENT_TITLE;
        var promise;
        var vcContext;
        var pcscInitialized = 0;
		var maxRetryContextInitCount = 5;

        function ApiContainer(ctxt) {
            constants = SCard.Constants;
            vcContext = ctxt;
            promise = new Promise(function (resolve, reject) {
                CLIENT_TITLE = chrome.i18n.getMessage('citrix_receiver');
                context = new GoogleSmartCard['PcscLiteClient']['Context'](CLIENT_TITLE, constants.managerAppId);
                console.log('pcsc context init called');
                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=pcsc context init called");
                context.addOnInitializedCallback(resolve);
                context.addOnDisposeCallback(reject);
                context.addOnDisposeCallback(onDisposeCallback);
				context.initialize();
			});
		}
		
		function reInitPromise(){
            promise = null;
            context = null;
            promise = new Promise(function (resolve, reject) {
                CLIENT_TITLE = chrome.i18n.getMessage('citrix_receiver');
                context = new GoogleSmartCard['PcscLiteClient']['Context'](CLIENT_TITLE, constants.managerAppId);
                console.log('pcsc context init called in re init');
                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=pcsc context init called in reinit");
                context.addOnInitializedCallback(function(api){
					pcscInitialized = maxRetryContextInitCount;
                    pcsc = api;
                    if(vcContext.resourceManagerStatusSupported){
                        var obj = new SCard.Response.ManagerStatus();
                        var data = obj.getBuffer();
                        vcContext.onData(data);
                    }
                    restartScardMonitor();
                });
                context.addOnDisposeCallback(onDisposeCallback);
                context.initialize();
            });
        }
		
		function restartScardMonitor(){
			delete vcContext.monitor;
			vcContext.readerStatus = SCard.Constants.READER_UNPLUGGED;
			vcContext.cardStatus = SCard.Constants.CTXSCARD_STATE_UNAWARE;
			writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=Re initializing scard monitor");
			vcContext.monitor = new SCard.Monitor(vcContext);
		}
        
        function onDisposeCallback(e){
            if(pcscInitialized == 0){
                writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:ERROR=smart card connector app not installed. Hence rejected");
                return;
            }
            writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:ERROR= onDisposeCallback is called");
            if(!context.isDisposed()){
                context.dispose();
            }
            if(vcContext.resourceManagerStatusSupported){
                var obj = new SCard.Response.ManagerSatusStopped();
                var data = obj.getBuffer();
                vcContext.onData(data);
            }
            if(pcscInitialized > 0){
                pcscInitialized--;
                reInitPromise();
            }
        }

        ApiContainer.prototype.getManagerStatus = function (onSuccess, onFailure) {
            promise.then(contextInitializedListener.bind(undefined, onSuccess),
                function () {
                    console.log('pcsc is undefined');
                    writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:ERROR=pcsc is undefined");
                    onFailure();
                });
        };

        function contextInitializedListener(onSuccess, api) {
            pcscInitialized = maxRetryContextInitCount;
            pcsc = api;
            console.log('pcsc is successfully intialised');
            writeHTML5Log(0, "SESSION:|:ICA:|:VC:|:SCARD:|:INFO=pcsc is successfully intialised");
            API = GoogleSmartCard['PcscLiteClient']['API'];
            onSuccess();
        }

        ApiContainer.prototype.apiWrapper = {
            EstablishContext: function (scope, successCallback, failureCallback) {
                pcsc['SCardEstablishContext'](scope, null, null).then(function (result) {
                    //TODO validate context
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            ListReaderGroups: function (context, successCallback, failureCallback) {
                pcsc['SCardListReaderGroups'](context).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            ListReaders: function (context, successCallback, failureCallback) {
                pcsc['SCardListReaders'](context, null).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            Connect: function (context, name, flag, protocol, successCallback, failureCallback) {
                pcsc['SCardConnect'](context, name, flag, protocol).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            ReleaseContext: function (context, successCallback, failureCallback) {
                pcsc['SCardReleaseContext'](context).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            BeginTransaction: function (handle, successCallback, failureCallback) {
                pcsc['SCardBeginTransaction'](handle).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            Transmit: function (handle, protocol, data, successCallback, failureCallback) {
                pcsc['SCardTransmit'](handle, protocol, data).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            EndTransaction: function (handle, flag, successCallback, failureCallback) {
                pcsc['SCardEndTransaction'](handle, flag).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            Disconnect: function (handle, flag, successCallback, failureCallback) {
                pcsc['SCardDisconnect'](handle, flag).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            Status: function (handle, successCallback, failureCallback) {
                pcsc['SCardStatus'](handle).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            GetAttrib: function (handle, attrId, successCallback, failureCallback) {
                pcsc['SCardGetAttrib'](handle, attrId).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            IsValidContext: function (context, successCallback, failureCallback) {
                pcsc['SCardIsValidContext'](context).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            GetStatusChange: function (context, timeOut, readerName, state, successCallback, failureCallback) {
                var data = [new API.SCARD_READERSTATE_IN(readerName, state)];
                pcsc['SCardGetStatusChange'](context, timeOut, data).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            Reconnect: function (handle, shareModeFlag, protocol, initializationFlag, successCallback, failureCallback) {
                pcsc['SCardReconnect'](handle, shareModeFlag, protocol, initializationFlag).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            Control: function (handle, controlCode, data, successCallback, failureCallback) {
                pcsc['SCardControl'](handle, controlCode, data).then(function (result) {
                    result.get(successCallback, failureCallback);
                }, failureCallback);
            },
            StringifyError: function (errorCode, callback) {
                pcsc['pcsc_stringify_error'](errorCode, callback);
            }
        };

        return ApiContainer;
    })();

    SCard.ApiContainer = ApiContainer;
})(SCard || (SCard = {}));