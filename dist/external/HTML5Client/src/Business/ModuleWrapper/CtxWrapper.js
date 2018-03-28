/* 
 * 
 * CtxWrapper.js
 *      Interface to Citrix naTive eXtension module (CTXModule).
 *      
 */

/// At present only two command channels to native client module
/// 1) CTX Wrapper counterpart of module
///         Cmd orginated from ctx wrapper itself use this channel
/// 2) GRAPHICS
///         Cmd from graphics channel, this can be any graphics
///     module includes thinwire, rendermanager etc.,
///
function CTX_MODULE_CMD_CHANNEL() {};
         CTX_MODULE_CMD_CHANNEL.CTX      = 0;
         CTX_MODULE_CMD_CHANNEL.GRAPHICS = 1;


function CtxWrapper(wrappers) {
   
    var cmdChannel = CTX_MODULE_CMD_CHANNEL.CTX;
    this.WrapperId = DRIVERID.ID_CTX_MODULE;

    if (wrappers) {
        wrappers[this.WrapperId] = this;
    }
    
    function CTXCMD(){};
        CTXCMD.HIDDEN_TAB_NOTIFY      = 1;
        CTXCMD.SWITCH_CONSOLE_LOG     = 2;
        CTXCMD.SWITCH_CONSOLE_FPS     = 3;
        CTXCMD.DISCARD_MODULE         = 4;
        CTXCMD.SESSION_RESIZE_NOTIFY  = 5;
               
    function CTX_STATUS() {};
            CTX_STATUS.INIT = 0;
            CTX_STATUS.LOADED = 1;
            CTX_STATUS.READY = 2;
            CTX_STATUS.CRASH = 3;
            CTX_STATUS.UNKNOWN = 4;

    var msgHandler = {};
    
        var FALLBACK_LEVEL_IGNORE = 0;
        var FALLBACK_LEVEL_CRITICAL = 1;
        var MSG_ERROR_FALLBACK	= 22;
        
        var myself = this;
        
        var status =  CTX_STATUS.UNKNOWN;
        var error_code = -1;
        var level = FALLBACK_LEVEL_IGNORE;
        var isGraphicsCallbackReady = false;        
        var thinwireWrapper = null;
       
        var moduleListener = null;
        var ctxModule = null;
        
        var superRenderCanvas = document.getElementById('CitrixSuperRenderCanvas');        
        
        function attachListener(parent) {
            var listenerEl = document.createElement('div');
            parent.appendChild(listenerEl);
            return listenerEl;
        }

        function attachModule(parent, width, height) {
            var embedEl = document.createElement('embed');
            embedEl.id = 'CitrixRenderElement';
            embedEl.width = width;
            embedEl.height = height;
            embedEl.style.position = 'absolute';
            embedEl.style.top = 0 + 'px';
            embedEl.style.left = 0 + 'px';
            embedEl.style.backgroundColor = 'black';
			embedEl.style.visibility = "hidden";
            embedEl.src = '../NativeClient/ctxmodule.nmf';
            embedEl.type = 'application/x-pnacl';
            parent.appendChild(embedEl);
            return embedEl;
        };

        // Binded event listeners
        this.onModLoadError = function() {
            // console.log('onModLoadError');
            status = CTX_STATUS.CRASH;
            level = FALLBACK_LEVEL_CRITICAL;
        };

        this.onModLoad = function() {
           //console.log('onModLoad');
            status = CTX_STATUS.READY;
        };
      
        this.handleModuelCrash = function(event) { 
            if(status === CTX_STATUS.CRASH) {
                return;
            } 
            status = CTX_STATUS.CRASH;
            level = FALLBACK_LEVEL_CRITICAL;
            moduleListener.removeEventListener('load', this.onModLoad.bind(myself), true);   
            moduleListener.removeEventListener('error', this.onModLoadError.bind(myself), true);
            moduleListener.removeEventListener('crash', this.handleModuelCrash.bind(myself), true);
            ctxModule.removeEventListener('message', this.handleModuleMessage.bind(myself), true);
                    
            ctxModule = null;
            moduleListener = null;
            // todo: post crash event to all handlers
            if (msgHandler.hasOwnProperty(CTX_MODULE_CMD_CHANNEL.GRAPHICS) && msgHandler[CTX_MODULE_CMD_CHANNEL.GRAPHICS]) {
                msgHandler[CTX_MODULE_CMD_CHANNEL.GRAPHICS]({'cmd': MSG_ERROR_FALLBACK,
                    'error': error_code,
                    'code': error_code,
                    'level': level
                });
            }
        };
        
        this.setMessageHandler = function (channel, handler) {
            if (channel === CTX_MODULE_CMD_CHANNEL.GRAPHICS) {
                // any module error notify to thinwire wrapper here
                if (status === CTX_STATUS.CRASH) {
                    handler({'cmd': MSG_ERROR_FALLBACK,
                        'error': error_code,
                        'code': error_code,
                        'level': level
                    });
                    return;
                }
                if(ctxModule) {
                    ctxModule.style.visibility = "visible";
                }
            }        
            msgHandler[channel] = handler;
        };

        // Binded module message listener
        this.handleModuleMessage = function(msg) {
           if(status === CTX_STATUS.CRASH) {
                return;
           }
           var channel = msg["data"]["channel"];
           if (msgHandler[channel]) {
               msgHandler[channel](msg["data"]);
           }
        };
        
        this.setThinwireWrapper = function(thinwireWrapperObj) {        
            thinwireWrapper = thinwireWrapperObj;
        };

        // Called from other wrapper modules to process commands        
        this.postMessage = function(dataObj) {
            if (ctxModule) {
                ctxModule.postMessage(dataObj);
            }
        };
         
        this.exitGfxModule = function() {
            ctxModule.style.visibility = "hidden";  
        };
        
        this.onSessionResize = function(width, height) {
            // RFHTMCRM-1471
            // Do not send session resize notification to nacl. As nacl resets the 
            // decoder and does nothing, session resize will hangs the graphics channel.
            // Anyhow on session resize, the tw engine will gets reinit if required which in turn
            // resets the nacl graphics module.
            //
            return;
            /*if (null !== ctxModule) {
                ctxModule.postMessage({'channel': cmdChannel, 
                    'cmd': CTXCMD.SESSION_RESIZE_NOTIFY,
                    'width' : width,
                    'height' : height});
            }*/
        };
        
        this.setModuleSize = function(width, height) {
            ctxModule.width = width;
            ctxModule.height = height;
        };
     
        this.removeModule = function() { 
            if (moduleListener !== null) {
                moduleListener.removeEventListener('load', myself.onModLoad.bind(myself), true);   
                moduleListener.removeEventListener('error', myself.onModLoadError.bind(myself), true);
                moduleListener.removeEventListener('crash', myself.handleModuelCrash.bind(myself), true);
            }
          
            if (ctxModule !== null) {
                ctxModule.removeEventListener('message', this.handleModuleMessage.bind(myself), true);
            }
            ctxModule = null;
            moduleListener = null;     
            try {
                if (document.getElementById('ModListener')) {
                    var divListener = document.getElementById('ModListener');
                    divListener.parentNode.removeChild(divListener);
                }
            }catch (e) {
                // do nothing
                console.log("throwing error" + e);
            }
        };

        this.initialize = function () {
            thinwireWrapper = wrappers[DRIVERID.ID_THINWIRE];
            status = CTX_STATUS.INIT;

            moduleListener = attachListener(superRenderCanvas);
            moduleListener.id = 'ModListener';

            moduleListener.addEventListener('load', this.onModLoad.bind(myself), true);   
            moduleListener.addEventListener('error', this.onModLoadError.bind(myself), true);
            moduleListener.addEventListener('crash', this.handleModuelCrash.bind(myself), true);

            ctxModule = attachModule(moduleListener, 100, 100);
            ctxModule.addEventListener('message', this.handleModuleMessage.bind(myself), true);             

            document.addEventListener('visibilitychange', function(){
                    if (null === ctxModule) {
                        return;
                    }
                    //console.log("tab changed");
                    ctxModule.postMessage({'channel': cmdChannel, 
                            'cmd': CTXCMD.HIDDEN_TAB_NOTIFY,
                            'state': document["hidden"]});
                });
        };
        
};    
