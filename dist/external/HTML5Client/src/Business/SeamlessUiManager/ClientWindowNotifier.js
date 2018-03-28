var SeamlessUI;

(function (SeamlessUI) {    
    var IClientUiNotifier = (function(){
        function IClientUiNotifier(notifier, elementId) {
        }
        
        IClientUiNotifier.prototype.add = function() {};
        IClientUiNotifier.prototype.remove = function() {};
        IClientUiNotifier.prototype.update = function() {};
        IClientUiNotifier.prototype.clone = function () {
            return this;
        };

        return IClientUiNotifier;
    })();
        
    /*
    Element id is only unique way of identifying the client window.
    Before using this class, check for unambiguous element Id being set for every dialog.
    
    Following are the different usages :
    ----------------------------------
    
    function notifier(cmd) {
        //Code to send  the command to seamlessUIManger instantiated in UiWrapper.js        
    }   
    
    var urlWindowNotifier = new SeamlessUI.ClientWindowNotifier(notifier, "UrlRedirectionDivId");
    // urlWindowNotifier is specific for urlwindow and can call any of the funciton without any parameter
    urlWindowNotifier.add();
    urlWindowNotifier.update();
    urlWindowNotifier.remove();
 
        
    var windowNotifierNoElement = new SeamlessUI.ClientWindowNotifier(notifier);
    //windowNotifierNoElement is not associated to any dialog. Pass on the window id for specific window 
    windowNotifierNoElement.add("2345");
    windowNotifierNoElement.update("2345");
    windowNotifierNoElement.remove("2345");
    console.log(document);


    var windowNotifierNoElementNoNotifier = new SeamlessUI.ClientWindowNotifier();
    windowNotifierNoElementNoNotifier.add("999", function (cmd) {
          //Code to send  the command to seamlessUIManger instantiated in UiWrapper.js 
    });

    SeamlessUI.ClientWindowNotifier.prototype.add("00000",function (cmd) {
       //Code to send  the command to seamlessUIManger instantiated in UiWrapper.js 
    });
    */    
    
    var ClientWindowNotifier = (function (_super) {
        _ts.extends(ClientWindowNotifier, _super);
        
        function ClientWindowNotifier(notifier, elementId, decorator) {
            this.elementId = elementId;
            this.notifier = notifier;
            this.decorator = decorator;
            this.applyDecorator  = (decorator != undefined && decorator != null);
        }        
        
        function addOrUpdate(event, notifier, elementId) {
            if (event == 'create' || event == 'update') {                
                var elem = document.getElementById(elementId);                
                var msg = new SeamlessUI.Message();
                if (elem) {
                    var bounds = elem.getBoundingClientRect();
                    msg.appId = elementId;
                    msg.cmd = event;
                    msg.position = { left: Math.round(bounds.left), top: Math.round(bounds.top), width: Math.round(bounds.width), height: Math.round(bounds.height) };
                    msg.clientWindow = true;
                }                
                if (notifier) {
                    notifier(msg.message);
                }
            }
        }        

        ClientWindowNotifier.prototype.remove = function (elementId, notifier) {
            if(g.environment.receiver.seamlessMode === true) {
                if (elementId == null) {
                    elementId = this.elementId;
                }
                if (elementId) {
                    var elem = document.getElementById(elementId);
                    var msg = new SeamlessUI.Message();
                    if (elem) {
                        msg.appId = elementId;
                        msg.cmd = "close";
                        msg.clientWindow = true;
                    }

                    if (!notifier) {
                        notifier = this.notifier;
                    }
                    if (notifier) {
                        notifier(msg.message);
                    }
                }
            }
        };


        ClientWindowNotifier.prototype.add = function (elementId, notifier) {
            if(g.environment.receiver.seamlessMode === true) {
                if (this.applyDecorator) {
                    this.decorator(elementId);
                    this.applyDecorator = false;
                }

                if (notifier == null) {
                    notifier = this.notifier;
                }

                if (elementId == null) {
                    elementId = this.elementId;
                }

                if (elementId && notifier) {
                    addOrUpdate('create', notifier, elementId);
                }
            }
        };
            
        ClientWindowNotifier.prototype.update = function (elementId, notifier) {
            if(g.environment.receiver.seamlessMode === true) {
                if (notifier == null) {
                    notifier = this.notifier;
                }

                if (elementId == null) {
                    elementId = this.elementId;
                }

                if (elementId && notifier) {
                    addOrUpdate('update', notifier, elementId);
                }
            }
        };

        ClientWindowNotifier.prototype.clone = function (elementId, decorator) {
            return new ClientWindowNotifier(this.notifier, elementId, decorator);
        };
        
        return g.environment.receiver.receiverName === 'chrome'  && !g.environment.receiver.isKiosk ? ClientWindowNotifier : _super;
    })(IClientUiNotifier);
    
    SeamlessUI.ClientWindowNotifier = ClientWindowNotifier;
})(SeamlessUI || (SeamlessUI = {}));




