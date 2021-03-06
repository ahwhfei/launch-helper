class Helper {

    constructor (ica) {
        this.ica = ica;
    }

    createSession() {
        const citrix = window.citrix;
        try {
            citrix.receiver.setPath(`${manifest.staticResource}/external/HTML5Client`);
            citrix.receiver.createSession(null, this._sessionParams, this._sessionCreated.bind(this));
        } catch (e) {
            console.error(e);
        }
    }

    get _sessionParams() {
        return {
            launchType: 'embed',
            closeOptions: { showDisconnectAlert: false },
            // TBD : set preferredLang based on the admin's language selection in CC, which is available in a cookie
            //preferredLang: { },
            container: {
                type: 'iframe',
                id: 'studio'
            },
            preferences: {
                ui: {
                    toolbar: {
                        fileTransfer: false,
                        about: false,
                        lock: false,
                        disconnect: false,
                        logoff: true,
                        fullscreen: false,
                        multitouch: false,
                        switchApp: false,
                        preferences: false
                    },
                    appSwitcher: {
                        showTaskbar: false
                    }
                }
            }
        };
    }

    _sessionCreated(sessionObject) {
        this._sessionCreatedConfig(sessionObject);
        this._startSession(sessionObject);  
    }

    _startSession(sessionObject) {
        const icaJson = typeof this.ica === 'string' ? JSON.parse(this.ica) : this.ica;
        const icaJsonObject = {
            type: 'json',
            value: icaJson
        };
    
        sessionObject.start(icaJsonObject);
    }

    _sessionCreatedConfig(sessionObject) {
        //Handle session interactions like events, start, disconnect here.              
        // Adding onConnection event handler
        function connectionHandler(event) {
            console.log('Event Received : ' + event.type);
            console.log(event.data);
        }
        sessionObject.addListener('onConnection', connectionHandler);
        
        // Adding onConnectionClosed event handler
        function connectionClosedHandler(event) {
            console.log('Event Received : ' + event.type);
            console.log(event.data);
        }
        sessionObject.addListener('onConnectionClosed', connectionClosedHandler);
    
        // Adding onError event handler
        function onErrorHandler(event) {
            console.log('Event Received : ' + event.type);
            console.log(event.data);
        }
        sessionObject.addListener('onError', onErrorHandler);
    
        //Adding onURLRedirection event handler
        function onURLRedirectionHandler(event) {
            console.log('Event Received : ' + event.type);
            console.log(event.data);
        }
        sessionObject.addListener('onURLRedirection', onURLRedirectionHandler);  
    }
}

export default Helper;
