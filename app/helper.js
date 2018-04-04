import HelperElement from './helper-element.js';

class Helper {

    constructor (ica, handlers) {
        this.ica = ica;
        this.handlers = handlers;
    }

    createSession() {
        const citrix = window.citrix;
        try {
            citrix.receiver.setPath(`${HelperElement().staticResource}/external/HTML5Client`);
            citrix.receiver.createSession(null, this._sessionParams, this._sessionCreated.bind(this));
            return {
                success: true
            };
        } catch (err) {
            console.error(err);
            return {
                success: false,
                msg: 'create receiver session failed'   
            };
        }
    }

    get _sessionParams() {
        return {
            launchType: 'embed',
            container: {
                id: 'studio',
                type: 'iframe'
            },
            bounds: {
                autoresize: false,
                width: HelperElement().element.clientWidth,
                height: HelperElement().element.clientHeight
            },
            closeOptions: {
                type: 'close',
                showDisconnectAlert: false // false won't prompt when the session is about to disconnect due to the actions like close/reload of the tab.
            },
            // preferredLang: this._translateService.currentLang,
            preferences: {
                ui: {
                    toolbar: {
                        menubar: true, // false - hides the toolbar
                        clipboard: true, // false - hides the clipboard button from toolbar
                        fileTransfer: true, // false - hides the file upload and download buttons from toolbar
                        about: true, // false - hides the about button from toolbar
                        lock: false, // false - hides the ctrl+alt+del button from toolbar
                        disconnect: false, // false - hides the disconnect button from toolbar
                        logoff: true, // false - hides the logoff button from toolbar
                        fullscreen: false, // false - hides the fullscreen button from toolbar
                        keyboard: true, // false - hides the keyboard button from toolbar, this button appears only in touch devices
                        multitouch: true, // false - hides the multitouch button from toolbar, this button appears only in touch devices
                        switchApp: false, // false - hides the switchApp button from toolbar, this button appears only for apps session
                        preferences: true, // false - hides the preferences button from toolbar
                        gestureGuide: true // false - hides the gestureGuide button from toolbar, this button appears only in touch devices
                    },
                    hide: {
                        urlredirection: true, // true - hides the urlredirection dialog shown by HTML5 Engine
                        error: false, // true - hides the error dialog shown by HTML5 Engine
                        ftu: true // true - hides the FTU(first time user dialog) shown by HTML5 Engine
                    },
                    appSwitcher: {
                        showTaskbar: false, // false - disables the desktop appSwitcher/taskbar seen at the bottom
                        autoHide: false, // true - selects the Auto Hide checkbox present in the context menu of desktop appSwitcher/taskbar at the bottom
                        showIconsOnly: false // true - selects the Show Icons only checkbox present in the context menu of desktop appSwitcher/taskbar at the bottom
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
            if (this.handlers 
                && this.handlers.connectionHandler
                && typeof this.handlers.connectionHandler === 'function') {
                    this.handlers.connectionHandler(event);
            } else {
                console.log('Event Received : ' + event.type);
                console.log(event.data);
            }

            switch (event.data.state) {
                case 'sessionReady':
                    sessionObject.changeResolution({ 'autoresize': true });
                    break;
                default:
                    break;
            }
        }
        sessionObject.addListener('onConnection', connectionHandler);
        
        // Adding onConnectionClosed event handler
        function connectionClosedHandler(event) {
            if (this.handlers 
                && this.handlers.connectionClosedHandler
                && typeof this.handlers.connectionClosedHandler === 'function') {
                    this.handlers.connectionClosedHandler(event);
            } else {
                console.log('Event Received : ' + event.type);
                console.log(event.data);
            }
        }
        sessionObject.addListener('onConnectionClosed', connectionClosedHandler);
    
        // Adding onError event handler
        function onErrorHandler(event) {
            if (this.handlers 
                && this.handlers.onErrorHandler
                && typeof this.handlers.onErrorHandler === 'function') {
                    this.handlers.onErrorHandler(event);
            } else {
                console.log('Event Received : ' + event.type);
                console.log(event.data);
            }
        }
        sessionObject.addListener('onError', onErrorHandler);
    
        //Adding onURLRedirection event handler
        function onURLRedirectionHandler(event) {
            if (this.handlers 
                && this.handlers.onURLRedirectionHandler
                && typeof this.handlers.onURLRedirectionHandler === 'function') {
                    this.handlers.onURLRedirectionHandler(event);
            } else {
                console.log('Event Received : ' + event.type);
                console.log(event.data);
            }
        }
        sessionObject.addListener('onURLRedirection', onURLRedirectionHandler);  
    }
}

export default Helper;
