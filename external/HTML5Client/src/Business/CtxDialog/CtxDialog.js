var UiControls;

(function (UiControls) {
    var seamlessNotifier;    
    
    UiControls.CtxDialog = function() {

	/* Following 2 images are prefetched as they need to be displayed during network disconnect.
	Removing this code might not show up these images for error dialog and reconnecting dialog during network disconnect.*/

	/*Required for caching close button in Error dialog */
	window.closeBtnImg = new Image();
	closeBtnImg.src = resourceTree + 'icon_close.png';

	/*Required for caching receiver icon during reconnecting dialog (Session reliability)*/
	window.receiverIcon = new Image();
	receiverIcon.src = resourceTree + 'icon_16x16.png';

	var errordialog = new ErrorDialog();
	var fileTransferErrorDialog = new FileTransferErrorDialog();
	var urldialog = null;
	var printDialog=null;
    var downloadPDFDialog=null;
	var aboutDialog;

        this.setSeamlessNotifier = function (notifier) {
            seamlessNotifier = notifier;
        };
        
        //Reconnecting overlay for session reliability
        var reconnectingOverlay = null;

	//Overlay is used for connecting and resizing overlay. 
	var overlay = new Overlay();
	
	this.showError = function(textheader, message, bText, disableClose, callback1) {
		writeHTML5Log(0,"ERROR:|:error =" + message);
		CEIP.incrementCounter("session:error:count");
		if (!disableClose) {
			disableClose = false;
		}
		if (!bText) {
			// in child thread
			bText = HTML5Engine.i18n.getMessage(String("ok"));
		}
				
		//While connecting dialog is shown if error dialog comes up then connecting dialog is hiding the error dialog
		
        HideAllDialogs(["urlRedirectionDialog", 
                        "clipboardDialog", 
                        "ftuDialog", 
                        "downloadPDFDialog", 
                        "FpsDivElement", 
                        "overlay", 
                        { id: "reconnectingOverlay", innerDivs: ["reconnectingDiv"] }, //Complex dialogs where the inner divs have to be cut by seamless 
                        "usbredirectiondialog", 
                        "releaseAllConfirmationDiv", 
                        "fileTransferErrorDialog",
						"aboutDialog"]);
		if (disableClose == true) {
			errordialog.HideCloseButton();
		}
		if ( typeof (message) == 'string') {
			errordialog.SetErrorMessage(HTML5Engine.i18n.getMessage(message));
		} else if (message.length == 2) {
			errordialog.SetErrorMessage(HTML5Engine.i18n.getMessage(message[0]), HTML5Engine.i18n.getMessage(message[1]));
		}
		errordialog.setCallback(callback1);
		NetPromoters.onError();
	};
	this.showFileTransferError = function(cmd)
	{
		var msg = "";
		var indexMessage = "";
		switch(cmd){
			case FileTransferConstants.POLICY_ERROR :
				indexMessage = 'error-fileTransferPolicy';
				msg = HTML5Engine.i18n.getMessage(indexMessage);
			break;
			case FileTransferConstants.SIZE_LIMIT_ERROR :
				indexMessage = 'error-fileTransferSizeLimit';
				msg = HTML5Engine.i18n.getMessage(indexMessage);
			break;
			case FileTransferConstants.FILE_COUNT_ERROR :
				indexMessage = 'error-fileTransferFileCount';
				msg = HTML5Engine.i18n.getMessage(indexMessage);
			break;
			default:
				indexMessage = 'error-fileTransferGeneric';
				msg = HTML5Engine.i18n.getMessage(indexMessage);
			break;
		}
		writeHTML5Log(0,"FILETRANSFER_ERROR:|:error =" + indexMessage);
		fileTransferErrorDialog.SetErrorMessage(msg);
	};
	this.showURLMessage = function(ctxUrl, ctxCallback) {
		writeHTML5Log(0,"SESSION:|:UI:|:url redirect request =" + ctxUrl);
		CEIP.add('urlRedirection:used',true);
		if (urldialog == null) {
			urldialog = new URLRedirectionDialog();
		}
		urldialog.setCallback(ctxCallback);
		urldialog.SetURLMessage(ctxUrl); 
		
		urldialog.Show();

	};
	
	this.showPrintData=function(printInfo, PrinterCallback){
		if (printDialog===null) {
			printDialog=new PrintDialog();
			
		}
		printDialog.SetPrintInfo(printInfo);
		printDialog.setCallback(PrinterCallback);
		printDialog.Show();
		
	};

    var kioskPrinterCallbackHandler = (function () {
        var windowURL = (window.URL || window.webkitURL);
        var url, callbackOnPrintDone;

        function postMessageUrl(printInfo, printerCallback) {
			if(window["appViewMode"]){
				var appViewPrintDiv = document.getElementById("appViewPrintDiv");			
				if(!appViewPrintDiv){
					appViewPrintDiv = document.createElement("div");
					appViewPrintDiv.id ="appViewPrintDiv";
					
					
					var printWebview = document.createElement("webview");
					printWebview.id = "printWebview"							
					appViewPrintDiv.appendChild(printWebview);
					
					var closeBtn = document.createElement("span");
					closeBtn.className = "closeBtn";
					closeBtn.addEventListener("click",function(e){
						appViewPrintDiv.style.display = "none";
						printWebview.src ="about:blank";
						printerCallback();
						HTML5Interface.setKeyboardFocus();
					});
					appViewPrintDiv.appendChild(closeBtn);

					
					var citrixXtcRoot = document.getElementById("CitrixXtcRoot");
					if(citrixXtcRoot){
						citrixXtcRoot.appendChild(appViewPrintDiv);
					}
				}			
				//callbackOnPrintDone = printerCallback;
				appViewPrintDiv.style.display = "block"
				var printWebview = document.getElementById("printWebview");
				printWebview.src = windowURL.createObjectURL(printInfo['bloburl']);
			}else{
            url = windowURL.createObjectURL(printInfo['bloburl']);
            eventSource.postMessage({"cmd": "PRINT", "url": url}, self.location.origin);
            callbackOnPrintDone = printerCallback;
            printInfo['bloburl'] = null;
            printInfo = null;
        }
        }

        function onPrintDone() {
            if (url !== undefined && callbackOnPrintDone instanceof Function) {
                windowURL.revokeObjectURL(url);
                callbackOnPrintDone();
            }
        }

        return {
            postMessageUrl: postMessageUrl,
            onPrintDone: onPrintDone
        }
    })();

    this.kioskPrinterCallbackOnMessage = function () {
        kioskPrinterCallbackHandler.onPrintDone();
    };

    this.kioskModeSendPrintObject = function (printInfo, printerCallback) {
        kioskPrinterCallbackHandler.postMessageUrl(printInfo, printerCallback);
    };

    this.showTotalFile=function(fileRatio) {
        if (printDialog===null) {
            printDialog=new PrintDialog();
        }
        printDialog.setTotalFiles(fileRatio);
    };

    this.showDownloadingPDFDialog=function() {
        if (downloadPDFDialog===null) {
            downloadPDFDialog=new DownloadPDFDialog();
        }
        downloadPDFDialog.Show();
    };

    this.hideDownloadingPDFDialog=function() {
        downloadPDFDialog.Hide();
    };

    this.openChromeAppPrintWindow=function(printInfo){
        printInfo['title'] = HTML5Engine.i18n.getMessage('Doc') + printInfo['printcounter'] ;
        printInfo['filename'] =  HTML5Engine.i18n.getMessage('Doc') + printInfo['printcounter'] + '.pdf' ;
        printInfo['sessionName'] =  document.title ;

        chrome.runtime.getBackgroundPage(function (backgroundPage) {
            backgroundPage.chromeAppGCP.printFile(printInfo);
            printInfo=null;
        });
        /*HTML5Interface.createWindow("/src/Print.html",function(createdWindow){
            createdWindow.contentWindow.printInfo = printInfo;
            printInfo = null;
        });*/
    };
	this.showOverlay = function(options){
		if (overlay) {
			overlay.setMessage(options);
			overlay.Show();
		}
	};
	this.hideOverlay = function(){
		if (overlay) {
            overlay.Hide();
        }
	};
	this.showReconnectingOverlay = function(UIDimmingPercentage){
		if (reconnectingOverlay == null) {
			reconnectingOverlay = new ReconnectingOverlay();
		}
		reconnectingOverlay.Show(UIDimmingPercentage);
	};
	this.hideReconnectingOverlay = function(){
		if (reconnectingOverlay) {
            reconnectingOverlay.Hide();
        }
	};
	this.showAboutDialog = function(){
		if(!aboutDialog){
			aboutDialog = new AboutDialog();
		}
		aboutDialog.Show();
	};	
    
}
function ReconnectingOverlay(){
	var ui = GetUI();
	var superReconnectingOverlay = new GridLayout(ui);
	var reconnectingOverlay = new GridLayout(ui);
	var superReconnectingOverlayElement = superReconnectingOverlay.GetElement();
	var reconnectingOverlayElement = reconnectingOverlay.GetElement();
    var uiId = "reconnectingDiv";
	reconnectingOverlayElement.id = "reconnectingOverlay";
	superReconnectingOverlayElement.id = "superReconnectingOverlay";
	reconnectingOverlayElement.className = "overlay";
	superReconnectingOverlayElement.className = "superOverlay";
	var reconnectingDiv = document.createElement("div");
	reconnectingDiv.className = "reconnectingDiv";
	reconnectingDiv.id = "reconnectingDiv";
	
	var reconnectingReceiver = document.createElement("span");
	reconnectingReceiver.className = "reconnectingReceiver";
	reconnectingDiv.appendChild(reconnectingReceiver);
	
	var connectionStatus = document.createElement("span");
	connectionStatus.className = "connectionStatus";
	reconnectingDiv.appendChild(connectionStatus);
	connectionStatus.innerHTML = HTML5Engine.i18n.getMessage("connectionInterrupted");

	var reconnectingStatus = document.createElement("div");
	reconnectingStatus.className = "reconnectingStatus";
	reconnectingDiv.appendChild(reconnectingStatus);
	reconnectingStatus.innerHTML = HTML5Engine.i18n.getMessage("reconnectingStatus");

	reconnectingOverlayElement.appendChild(reconnectingDiv);
	
	this.Show = function(UIDimmingPercentage) {
	  UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation ,function(displayDetails){
         // in case of multimonitor in UDM, set the width of overlay to the total width of all monitors
		 if(displayDetails.multimonitor == true && displayDetails.isUnifiedMode == true){
           var totalWidth = 0;
           for(var i=0;i<displayDetails.displayInfo.length;i++){
             totalWidth += displayDetails.displayInfo[i].workArea.width;
           }
           superReconnectingOverlayElement.style.width = totalWidth+'px';
         }
          reconnectingOverlay.Show(UIDimmingPercentage);
          
          if (displayManager) {
              displayManager.disableAllDisplay();
          }
          
          superReconnectingOverlay.Show();
	        reconnectingOverlayElement.style.backgroundColor = "rgba(0,0,0,"+UIDimmingPercentage/100+")";
          seamlessNotifier.add(uiId);
       });
    };

    this.Hide = function () {
        reconnectingOverlay.Hide();
        superReconnectingOverlay.Hide();
        if (displayManager) {
            displayManager.enableAllDisplay();
        }
        seamlessNotifier.remove(uiId);
    };
    reconnectingOverlay.Hide();
}

    function Overlay() {
        var ui = GetUI();
        var dialogId = "overlayInnerDiv";
        var superOverlay = new GridLayout(ui);
        var superOverlayElement = superOverlay.GetElement();
        superOverlayElement.className = "superOverlay";
        superOverlayElement.id = 'superOverlay';
        var overlay = new GridLayout(ui);
		
		var overlayElement = overlay.GetElement();
		overlayElement.id = "overlay";
		overlayElement.className = "overlay";
        
		var overlayNotifier = null;
        //Seamless notifier
        function getNotifier(){
            if(!overlayNotifier && seamlessNotifier) {
                overlayNotifier = seamlessNotifier.clone('overlayInnerDiv',
                    function decorator() { //Decorator to be executed only on seamless mode is true
                        overlayInnerDiv.style.border = "1px solid white";
                    }
                );
            }
            return overlayNotifier;
        }

        var overlayInnerDiv = document.createElement("div");
        overlayElement.appendChild(overlayInnerDiv);
        overlayInnerDiv.className = "overlayInnerDiv";
        overlayInnerDiv.id = "overlayInnerDiv";
				
		var overlaySpin = document.createElement("div");
		overlayInnerDiv.appendChild(overlaySpin);
		overlaySpin.className = "spinner28x28 spinnerRotate";
		
		var overlayText = document.createElement("div");
		overlayInnerDiv.appendChild(overlayText);
		overlayText.className = "overlayTextStyle";
		
		var overlayTextInfo = document.createElement("div");
		overlayInnerDiv.appendChild(overlayTextInfo);
		overlayTextInfo.className = "overlayTextStyle";
	
		this.setMessage = function (options){
			if(options){
				if(options['title']){
					overlayText.innerHTML = options['title'];
					if(options['info']){
						overlayTextInfo.innerHTML = options['info'];
					}
				}
			}
		};
		
		this.Show = function() {
		   
		   UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.displayInformation ,function(displayDetails){
			 // in case of multimonitor in UDM, set the width of overlay to the total width of all monitors
			 if(displayDetails.multimonitor == true && displayDetails.isUnifiedMode == true){
			   var totalWidth = 0;
			   for(var i=0;i<displayDetails.displayInfo.length;i++){
				 totalWidth += displayDetails.displayInfo[i].bounds.width;
			   }
			   superOverlayElement.style.width = totalWidth+'px';
			 }
			 overlay.Show();
			 
        	if (displayManager) {
            	displayManager.disableAllDisplay();
       		}
			 
			 superOverlay.Show();
			  getNotifier() && getNotifier().add();
		   });
		};

		this.Hide = function () {
			//Hiding the close button added during seamless app sessions.
			if(g.environment.receiver.seamlessMode && g.environment.receiver.isChromeApp){
				var connCloseBtn = document.getElementById("connectionCloseBtn");
				if(connCloseBtn){
					connCloseBtn.style.display = "none";
				}
			}
			overlay.Hide();
			if (displayManager) {
            	displayManager.enableAllDisplay();
        	}
			superOverlay.Hide();
			getNotifier() && getNotifier().remove();		
		};
		overlay.Hide();
	}
    
    function HideAllDialogs(dialogs) {
        for (var i = 0; i < dialogs.length; i++) {
            var dialog = dialogs[i];
            if (typeof (dialog) === "object") {
                if (dialog.innerDivs) {
                    for (var j = 0; j < dialog.innerDivs.length; j++) {
                        seamlessNotifier.remove(dialog.innerDivs[j]);
                    }
                }
                dialog = dialog.id;
            }
            else {
                seamlessNotifier.remove(dialog);
            }
            
            var dialogEle = document.getElementById(dialog);
            if (dialogEle) {
                dialogEle.style.display = "none";                
            }
        }
    }

    /*DownloadPDFDialog is shown when the PDF file is received from Host.
    This Dialog is shown only for chrome app*/
    function DownloadPDFDialog() {
        var ui = GetUI();
        var dialogId = "downloadPDFDialog";
        var myself = this;
        var downloadPDFDialog = new GridLayout(ui);
    var downloadPDFDialogElement=downloadPDFDialog.GetElement();
    downloadPDFDialogElement.className = "downloadPDFDialog borderClass ";
    downloadPDFDialogElement.id = "downloadPDFDialog";

    var closeButton = document.createElement("span");
    downloadPDFDialogElement.appendChild(closeButton);
    closeButton.className = "smallCloseBtn downloadDialogCloseBtn";

    var downloadPDFImage = document.createElement("span");
    downloadPDFDialogElement.appendChild(downloadPDFImage);
    downloadPDFImage.id = "downloadPDFImage";
    downloadPDFImage.className = "spinner28x28 spinnerRotate downloadingImage";

    var downloadPDFMsg = document.createElement("span");
    downloadPDFMsg.innerHTML = HTML5Engine.i18n.getMessage('download-PDF-file-msg');
    downloadPDFDialogElement.appendChild(downloadPDFMsg);
    downloadPDFMsg.id = "downloadPDFMsg";
    downloadPDFMsg.className = "downloadPDFMsg";

    downloadPDFDialog.Hide();

        function CloseButtonHandler(evt) {            
            myself.Hide();            
        }

        closeButton.addEventListener('click', CloseButtonHandler, false);

        this.Show = function () {            
            downloadPDFDialog.Show();
            seamlessNotifier.add(dialogId);
        };

        this.Hide = function () {
            downloadPDFDialog.Hide();
            seamlessNotifier.remove(dialogId);
        };
    }

    /*PrintDialog is shown when the PDF file is completely received from host.
    * This dialog is shown only for HTML5 receiver.
    * ProcessingMessage element gets updated when the user clicks on continue button or another file is received from the host.*/
    function PrintDialog() {
        var printInfo;
        var openPDFFileCallBack = null;
        var ui = GetUI();
		var myself = this;
        var printDialog = new GridLayout(ui);
        var printDialogElement = printDialog.GetElement();
        printDialogElement.id = "printDialog";
        printDialogElement.className = "printDialog borderClass";

        var closeButton = document.createElement("span");
        printDialogElement.appendChild(closeButton);
        closeButton.className = "closeBtn";

        var titleTextItem = document.createElement("div");
        printDialogElement.appendChild(titleTextItem);
        titleTextItem.id = "printHeader";
        titleTextItem.className = "printDialogHeader";
        titleTextItem.innerHTML = HTML5Engine.i18n.getMessage('pdf-print-msg');

        var processingMessage = document.createElement("div");
        printDialogElement.appendChild(processingMessage);
        processingMessage.id = "ProcessingMessage";
        processingMessage.className = "printProcessingMessage";
        processingMessage.innerHTML = HTML5Engine.i18n.getMessage('processing');

        var continueBtn = document.createElement("button");
        printDialogElement.appendChild(continueBtn);
        continueBtn.className = "continueBtn";
        continueBtn.innerHTML = HTML5Engine.i18n.getMessage('continue');
	
        //delete the blob url after the load of the pdf file. using addEventListener inside continueButtonHandler        
		closeButton.addEventListener('click', CloseButtonHandler, false);
		continueBtn.addEventListener('click', continueButtonHandler, false);
        
		
        function CloseButtonHandler(evt) {
            myself.Hide();
            printInfo = null;
            openPDFFileCallBack(true);

        }

        function continueButtonHandler(evt) {
            myself.Hide();
            if (window.navigator.msSaveOrOpenBlob) {
                var val = navigator.msSaveOrOpenBlob(printInfo['bloburl'], printInfo['filename']);
            }
            else {
                var myWindow;		
				var windowURL = (window.URL || window.webkitURL);
				var url = windowURL.createObjectURL(printInfo['bloburl']);
				HTML5Interface.createWindow(url,{onCreate : function(createdWindow){
					createdWindow.contentWindow.addEventListener("unload",function(e){
						if (url == e.target.location.href) {							
							windowURL.revokeObjectURL(url);
						}						
					});
				}});
				
            }
            openPDFFileCallBack(true);
        }

        this.Show = function () {
            var isKiosk = g.environment.receiver.isKiosk;
            if (!isKiosk) {
                printDialog.Show();
            }
        };

        this.Hide = function () {
            var isKiosk = g.environment.receiver.isKiosk;
            if (isKiosk) {

                openPDFFileCallBack(true);
            } else {
                printDialog.Hide();
            }
        };

        this.setCallback = function (PrinterCallback) {
            openPDFFileCallBack = PrinterCallback;
        };

        this.SetPrintInfo = function (printInfo1) {
            printInfo = printInfo1;
            printInfo['title'] = HTML5Engine.i18n.getMessage('Doc') + printInfo['printcounter'];
            printInfo['filename'] = HTML5Engine.i18n.getMessage('Doc') + printInfo['printcounter'] + '.pdf';
        };

        this.setTotalFiles = function (fileRatio) {
            processingMessage.innerHTML = HTML5Engine.i18n.getMessage('processing') + (" (" + fileRatio + ")");
        };
        printDialog.Hide();
    }


    function URLRedirectionDialog() {
        var urlRedirectionCallback;
        var redirectedUrl;
        //This is used to keep track of the choice of the user to open in device or server always.
        var selectedDefaultOption = "";
        var ui = GetUI();
        var urlRedirectionDialog = new GridLayout(ui);
            
        var urlRedirectionDialogElement = urlRedirectionDialog.GetElement();
        urlRedirectionDialogElement.id = "urlRedirectionDialog";
        var uiId = urlRedirectionDialogElement.id;
        urlRedirectionDialogElement.className = "borderClass urlRedirectionDialog";

        var closeButton = document.createElement("span");
        urlRedirectionDialogElement.appendChild(closeButton);
        closeButton.className = "closeBtn";

        var urlRedirectionTitle = document.createElement("div");
        urlRedirectionTitle.id = 'urlRedirectionTitle';
        urlRedirectionTitle.className = "urlRedirectionTitle";
        urlRedirectionTitle.innerHTML = HTML5Engine.i18n.getMessage('openLink');
        urlRedirectionDialogElement.appendChild(urlRedirectionTitle);

        var titleTextItem = document.createElement("div");
        urlRedirectionDialogElement.appendChild(titleTextItem);
        titleTextItem.id = "urlDialogHeader";
        titleTextItem.className = "urlDialogHeader";
        titleTextItem.innerHTML = HTML5Engine.i18n.getMessage('urlredirection-message');

        var urlElement = document.createElement("div");
        urlElement.id = "urlRedirected";
        urlElement.className = "urlRedirected";
        urlRedirectionDialogElement.appendChild(urlElement);

        var dontShowAgainContainer = document.createElement("div");
        dontShowAgainContainer.className = "dontShowAgainContainer";

        var rememberURLOpenerCB = document.createElement("input");
        rememberURLOpenerCB.setAttribute("type", "checkbox");
        rememberURLOpenerCB.id = "rememberURLOpenerCB";
        rememberURLOpenerCB.className = "checkboxURL";

        dontShowAgainContainer.appendChild(rememberURLOpenerCB);

        var dontShowAgainLabel = document.createElement("label");
        dontShowAgainLabel.setAttribute("for", "rememberURLOpenerCB");
        dontShowAgainLabel.innerHTML = HTML5Engine.i18n.getMessage("rememberOptionForSession");
        dontShowAgainLabel.className = "checkboxLabelURL";

        dontShowAgainContainer.appendChild(dontShowAgainLabel);

        var allowPopupsMsg = document.createElement("div");
        allowPopupsMsg.innerHTML = HTML5Engine.i18n.getMessage("allowPopupsMsg");
        allowPopupsMsg.className = "allowPopupsMsg";

        dontShowAgainContainer.appendChild(allowPopupsMsg);

        urlRedirectionDialogElement.appendChild(dontShowAgainContainer);

        var viewInComputerBtn = document.createElement("button");
        urlRedirectionDialogElement.appendChild(viewInComputerBtn);
        viewInComputerBtn.className = "viewInComputerBtn";
        viewInComputerBtn.innerHTML = HTML5Engine.i18n.getMessage('url-open-local');

        var viewInSessionBtn = document.createElement("button");
        urlRedirectionDialogElement.appendChild(viewInSessionBtn);
        viewInSessionBtn.className = "viewInSessionBtn";
        viewInSessionBtn.innerHTML = HTML5Engine.i18n.getMessage('url-open-session');

        var myself = this;

        function CloseButtonHandler(evt) {
            myself.Hide();
            seamlessNotifier.remove(uiId);
            urlRedirectionCallback(true);
        }

        function viewInComputerButtonHandler(evt) {
            if (rememberURLOpenerCB.checked) {
                selectedDefaultOption = "device";
            }
            window.open(redirectedUrl, '_blank');
            myself.Hide();
            seamlessNotifier.remove(uiId);
            if (urlRedirectionCallback)
                urlRedirectionCallback(true);
        }

        function viewInSessionButtonHandler(evt) {
            if (rememberURLOpenerCB.checked) {
                selectedDefaultOption = "server";
            }
            myself.Hide();
            seamlessNotifier.remove(uiId);
            if (urlRedirectionCallback)
                urlRedirectionCallback(false);
        }
        function dontShowAgainHandler(evt) {
            if (rememberURLOpenerCB.checked) {
                /*This message is not required to be shown in case of Chrome app */
                if (!window.chrome || !window.chrome.app || !window.chrome.app.window) {
                    allowPopupsMsg.style.display = "block";
                }
                else {
                    allowPopupsMsg.style.display = "none";
                }
            } else {
                allowPopupsMsg.style.display = "none";
            }
        }
        
        closeButton.addEventListener('click', CloseButtonHandler, false);
        

        viewInComputerBtn.addEventListener('click', viewInComputerButtonHandler, false);
        viewInSessionBtn.addEventListener('click', viewInSessionButtonHandler, false);
        rememberURLOpenerCB.addEventListener("change", dontShowAgainHandler,false);
        this.Show = function () {
            var isKiosk = g.environment.receiver.isKiosk;
            if (isKiosk) {
                urlRedirectionCallback(false);
                return;
            }
            if (selectedDefaultOption === "device") {
                viewInComputerButtonHandler();
            } else if (selectedDefaultOption === "server") {
                urlRedirectionCallback(false);
            } else {
                rememberURLOpenerCB.checked = false;
                urlRedirectionDialog.Show();
                seamlessNotifier.add(uiId);                
            }
        };

        this.Hide = function () {
            urlRedirectionDialog.Hide();
            seamlessNotifier.remove(uiId);
        };
        this.setCallback = function (urlRedirectionCallback1) {
            urlRedirectionCallback = urlRedirectionCallback1;
        };

        this.SetURLMessage = function (url) {
            if (url) {
                //Removing the null Character explicitly as it is not handled in Firefox.Otherwise,null character is shown in tooltip. 
                if (url.charCodeAt(url.length - 1) === 0) {
                    url = url.substr(0, url.length - 1);
                }
                redirectedUrl = url;
                var decodedUrl = "";
                try {
                    decodedUrl = decodeURI(url);
                    if (!decodedUrl) {
                        decodedUrl = url;
                    }
                } catch (ex) {
                    console.log("Error in decoding URL");
                    decodedUrl = url;
                }
                urlElement.innerHTML = HTML5Engine.i18n.getMessage("url") + " " + decodedUrl;
                var temp = decodedUrl;
                var tooltip = "";
                var chunkSize = 50;

                while (temp) {
                    if (temp.length < chunkSize) {
                        tooltip += temp;
                        break;
                    }
                    else {
                        tooltip += (temp.substr(0, chunkSize)) + "\n";
                        temp = temp.substr(chunkSize);
                    }
                }
                urlElement.title = tooltip;
            }
        };
        urlRedirectionDialog.Hide();
    }

    function ErrorDialog() {
        var callback;
        var showMoreDetails = false;
        var detailErrorMsg = "";
		var myself = this;
		
        // Initialize the error dialog here.
        var ui = GetUI();
        var errorDialog = new GridLayout(ui);
        
        var errorDialogElement = errorDialog.GetElement();
        errorDialogElement.id = "errorDialog";
        var uiId =  "errorDialog";

        errorDialogElement.className = "borderClass errorDialog";

        var closeButton = document.createElement("span");
        errorDialogElement.appendChild(closeButton);
        closeButton.className = "closeBtn";

        var titleTextItem = document.createElement("div");
        errorDialogElement.appendChild(titleTextItem);
        titleTextItem.id = "errorDialogHeader";
        titleTextItem.className = "errorDialogHeader";
        titleTextItem.innerHTML = HTML5Engine.i18n.getMessage("error");

        var errorMainMsg = document.createElement("div");
        errorDialogElement.appendChild(errorMainMsg);
        errorMainMsg.id = "errorMainMsg";
        errorMainMsg.className = "errorMainMsg";
        errorMainMsg.innerHTML = HTML5Engine.i18n.getMessage("error-server");

        var showHideErrorContainer = document.createElement('div');
        showHideErrorContainer.id = 'show_hide_error_Container';
        showHideErrorContainer.className = 'showHideContainer';
        errorDialogElement.appendChild(showHideErrorContainer);

        var showHideErrorArrow = document.createElement('span');
        showHideErrorArrow.id = 'show_hide_error_arrow';
        showHideErrorArrow.className = 'show_hide_arrow';
        showHideErrorContainer.appendChild(showHideErrorArrow);

        var showHideErrorDetails = document.createElement("span");
        showHideErrorContainer.appendChild(showHideErrorDetails);
        showHideErrorDetails.id = "showHideErrorDetails";
        showHideErrorDetails.className = "show_hide_details";
        showHideErrorDetails.innerHTML = HTML5Engine.i18n.getMessage("show-details");

        var errorDetailsMsg = document.createElement("div");
        showHideErrorContainer.appendChild(errorDetailsMsg);
        errorDetailsMsg.id = "errorDetailsMsg";
        errorDetailsMsg.className = "errorDetailsMsg";

        var closeSessionBtn = document.createElement("button");
        errorDialogElement.appendChild(closeSessionBtn);
        closeSessionBtn.className = "closeSessionBtn";
        closeSessionBtn.innerHTML = HTML5Engine.i18n.getMessage('close-session');


        function CloseButtonHandler(evt) {
            myself.Hide();
            seamlessNotifier.remove(uiId);
            if (callback) {
                callback(false, true);
            }
        }

        function ToggleMoreDetails(evt) {
            if (showHideErrorDetails.innerHTML == HTML5Engine.i18n.getMessage('show-details')) {
                errorDetailsMsg.innerHTML = detailErrorMsg;
                errorDetailsMsg.style.display = "block";
                showHideErrorDetails.innerHTML = HTML5Engine.i18n.getMessage('hide-details');
                showHideErrorArrow.className += " show_hide_arrow_rotate"
                seamlessNotifier.update(uiId);
            }
            else {
                showHideErrorDetails.innerHTML = HTML5Engine.i18n.getMessage('show-details');
                errorDetailsMsg.style.display = "none";
                showHideErrorArrow.className = "show_hide_arrow";
                seamlessNotifier.update(uiId);
            }
        }

		closeSessionBtn.addEventListener('click', CloseButtonHandler, false);
		closeButton.addEventListener('click', CloseButtonHandler, false);
		showHideErrorArrow.addEventListener('click', ToggleMoreDetails, false);
		showHideErrorDetails.addEventListener('click', ToggleMoreDetails, false);
        
        this.Show = function () {            
            errorDialog.Show();
            if (displayManager) {
                displayManager.disableAllDisplay();
            }
            (seamlessNotifier) ? seamlessNotifier.add(uiId) : SeamlessUI.Utils.tryApplySeamless(uiId);
        };

        this.Hide = function () {
            errorDialog.Hide();
        	  if (displayManager) {
                displayManager.enableAllDisplay();
            }
            seamlessNotifier.remove(uiId);
        };
        this.HideCloseButton = function () {
            //closeButtonStyle.display = "none";
        };
        this.setCallback = function (callback1) {
            callback = callback1;
        };
        this.SetErrorMessage = function (message, moreMessage) {
            if (message) {
                errorMainMsg.innerHTML = message;
            }
            if (moreMessage) {
                detailErrorMsg = moreMessage;
                showHideErrorContainer.style.display = "block";
            }
            else {
                showHideErrorContainer.style.display = "none";
            }
            
            errorDialog.Show();
            seamlessNotifier.add(uiId);
        };
        
        errorDialog.Hide();        
    }


    function FileTransferErrorDialog() {
        // Initialize the error dialog here.
        var ui = GetUI();
        var myself = this;
        var fileTransferErrorDialog = new GridLayout(ui);
        var uiId = "fileTransferErrorDialog";
        var fileTransferErrorDialogElement = fileTransferErrorDialog.GetElement();
        fileTransferErrorDialogElement.id = "fileTransferErrorDialog";
        fileTransferErrorDialogElement.className = "borderClass errorDialog";

        var closeButton = document.createElement("span");
        fileTransferErrorDialogElement.appendChild(closeButton);
        closeButton.className = "closeBtn";

        var titleTextItem = document.createElement("div");
        fileTransferErrorDialogElement.appendChild(titleTextItem);
        titleTextItem.id = "fileTransferErrorDialogHeader";
        titleTextItem.className = "fileTransferErrorDialogHeader";
        titleTextItem.innerHTML = HTML5Engine.i18n.getMessage('error-fileTransferHeaderMessage');

        var fileTransferErrorMainMsg = document.createElement("div");
        fileTransferErrorDialogElement.appendChild(fileTransferErrorMainMsg);
        fileTransferErrorMainMsg.id = "fileTransferErrorMainMsg";
        fileTransferErrorMainMsg.className = "fileTransferErrorMainMsg";


        this.Show = function () {
            fileTransferErrorDialog.Show();
            seamlessNotifier.add(uiId);
        };

        this.Hide = function () {
            fileTransferErrorDialog.Hide();
            seamlessNotifier.remove(uiId);            
        };
        
		closeButton.addEventListener('mousedown', CloseButtonHandler, false);      
		
        function CloseButtonHandler(evt) {
            myself.Hide();
        }
        this.SetErrorMessage = function (message) {
            if (message) {
                fileTransferErrorMainMsg.innerHTML = message;
            }
            myself.Show();
        };
        
        fileTransferErrorDialog.Hide();
    }
	
	var AboutDialog = function(){
		var ui = GetUI();
        var myself = this;
		var aboutDialog = new GridLayout(ui);
		var uiId = "aboutDialog";
        var aboutDialogElement = aboutDialog.GetElement();
		aboutDialogElement.id = uiId;
        aboutDialogElement.className = "borderClass aboutDialog";

        var closeButton = document.createElement("span");
        aboutDialogElement.appendChild(closeButton);
        closeButton.className = "closeBtn";
		
		var ctxRxIcon = document.createElement("div");
		aboutDialogElement.appendChild(ctxRxIcon);
		ctxRxIcon.className = "aboutCtxRxIcon";
		
		var tpNotices = document.createElement("div");
		aboutDialogElement.appendChild(tpNotices);
		tpNotices.className = "abtTPNotices";
		tpNotices.innerText = HTML5Engine.i18n.getMessage("tpNotices");
						
		var rxName =  document.createElement("a");
		rxName.className = "abtRxName";
		aboutDialogElement.appendChild(rxName);
		rxName.innerText = (g.environment.receiver.isChromeApp) ? HTML5Engine.i18n.getMessage("ctxChromeRx") : HTML5Engine.i18n.getMessage("ctxHTML5Rx");		
		rxName.addEventListener("click",HTML5Interface.openAboutPage);
		
		var rxVersion = document.createElement("div");
		rxVersion.className = "rxVersion";
		aboutDialogElement.appendChild(rxVersion);		
		var version = (('undefined' !== typeof versionInfo) && versionInfo)?versionInfo['major'] + "." + versionInfo['minor'] + "." + versionInfo['patch'] + "." + versionInfo['build']:"";
		rxVersion.innerText = HTML5Engine.i18n.getMessage("rxVersion",{"no":version});
		
		var copyRightMsg = document.createElement("div");
		aboutDialogElement.appendChild(copyRightMsg);
		copyRightMsg.className = "abtCopyRightMsg";
		copyRightMsg.innerText = HTML5Engine.i18n.getMessage("copyRightMsg",{"year" :new Date().getFullYear()});
		
		var allRightsReservedMsg = document.createElement("div");
		aboutDialogElement.appendChild(allRightsReservedMsg);
		allRightsReservedMsg.className = "abtAllRightsReservedMsg";
		allRightsReservedMsg.innerText = HTML5Engine.i18n.getMessage("allRightsReserved");						
		
		this.Show = function () {
            aboutDialog.Show();
            seamlessNotifier.add(uiId);
        };

        this.Hide = function () {
            aboutDialog.Hide();
            seamlessNotifier.remove(uiId);            
        };
        
		closeButton.addEventListener('click', CloseButtonHandler, false);      
		
        function CloseButtonHandler(evt) {
            myself.Hide();
        }
		
	};
	
})(UiControls || (UiControls = {}));