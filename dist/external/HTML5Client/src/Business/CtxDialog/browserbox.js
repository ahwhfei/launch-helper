// Images used by ImageItem and img tags.
var clipboardDialogShown = false, fileUploadDialogShown = false;
var usbEnabled = false;
var fileElement, fileDownloadElement;

function BrowserBox() {
	var mobileReceiverView_obj;	
	var usbRedirectionDialog;
	var myself = this;
    var mobilePopOverElement;
    var mobilePopOverText;
	ui = GetUI();
	
	var fileUploadDialog;
	var clipboardEnabled = false;
	var fileTransferToolbarEnabled = false;
	var showToolTip = false;
	var myself = this;
	var config = {};	
	var fileTransferEnabled = false;
	var uploadAllowed = true;
	var fileTransferCountLimit = 10;
	var fileTransferConfig = Utility.GetFileTransferConfig();
		
	this.getShowToolTip = function() {
		return showToolTip;
	};
	this.setShowToolTip = function(value) {
		showToolTip = value;
	};
	var ctxdialog = new UiControls.CtxDialog();
    var seamlessNotifier;        
    
	this.showError = function(textheader, message, bText, disableClose, cboption) {
		ctxdialog.showError(textheader, message, bText, disableClose, cboption);
	};
	this.showURLMessage = function(ctxUrl, ctxCallback) {
		ctxdialog.showURLMessage(ctxUrl, ctxCallback);
	};
	this.showPrintData=function(printInfo, PrinterCallback){
		ctxdialog.showPrintData(printInfo, PrinterCallback);
	};
    this.kioskModeSendPrintObject=function(printInfo, PrinterCallback){
        ctxdialog.kioskModeSendPrintObject(printInfo, PrinterCallback);
    };
    this.kioskPrinterCallbackOnMessage=function(){
        ctxdialog.kioskPrinterCallbackOnMessage();
    };
    this.showTotalFile=function(fileRatio) {
        ctxdialog.showTotalFile(fileRatio);
    };
    this.showDownloadingPDFDialog=function() {
        ctxdialog.showDownloadingPDFDialog();
    };
    this.hideDownloadingPDFDialog=function() {
        ctxdialog.hideDownloadingPDFDialog();
    };
	this.showOverlay =function(options) {
        ctxdialog.showOverlay(options);
    };
    this.hideOverlay=function() {
        ctxdialog.hideOverlay();
    };
	this.showReconnectingOverlay =function(UIDimmingPercentage) {
        ctxdialog.showReconnectingOverlay(UIDimmingPercentage);
    };
    this.hideReconnectingOverlay=function() {
        ctxdialog.hideReconnectingOverlay();
    };
    this.openChromeAppPrintWindow=function(printInfo){
        ctxdialog.openChromeAppPrintWindow(printInfo);
    };
	this.showAboutDialog = function(){
		CEIP.incrementCounter("toolbar:buttons:about");
		ctxdialog.showAboutDialog();
	};
	
	this.resetConnectStatus = function(ishide) {
		if(ishide){
			ctxdialog.hideOverlay();			
		}else{
			var options= {};
			options["title"] = HTML5Engine.i18n.getMessage("connecting");
			options["info"] = HTML5Engine.i18n.getMessage("connectingMsg");
			ctxdialog.showOverlay(options);
		}	
	};
	
	this.setMobileReceiverView = function(mrv) {
		mobileReceiverView_obj = mrv;
	};
	
	this.getMobileReceiverView = function() {
		return mobileReceiverView_obj;
	};
	
	this.SetCallbackWrapper = function(cb) {
		this.callBackWrapper = cb;
       
        seamlessNotifier = new SeamlessUI.ClientWindowNotifier(function (cmd) {
            if (myself.callBackWrapper != undefined) {                                
                myself.callBackWrapper.sendToSeamlessUiManager(cmd);
            }
        });
        
        ctxdialog.setSeamlessNotifier(seamlessNotifier);
		NetPromoters.setSeamlessNotifier(seamlessNotifier);
	};
	
	this.Init = function(config1) {
		config = config1;		
		if(config && config['toolbar'] && config['toolbar']['menubar'] == false){
			return;
		}
		//Toolbar should be initialized only after the reading  menubar field from configuration
		UiControls.createToolBar();
		if(config && config['toolbar']){			
			toolbarConfig = config["toolbar"];
		}
		
		if(toolbarConfig && toolbarConfig["preferences"] !== false){
			UiControls.sessionPreferences.create();		
			UiControls.Toolbar.register({"id":"preferences","handler":UiControls.sessionPreferences.show});
			
		}
		if(g.environment.os.isTouch && toolbarConfig && toolbarConfig["gestureGuide"] !== false){
		   UiControls.gestureGuide.create();        
           UiControls.Toolbar.register({"id":"gestureGuide","handler":UiControls.gestureGuide.show});
		}
		function openLogPage(event){
			CEIP.incrementCounter("toolbar:buttons:openLog");
			
			/*Now checking whether the viewLogs button is to be added in SDK mode or not*/
			if(window.isSDK)
			{
				/*in case of calling the SDK calling the api to view the logs*/
				var rootWindow=window.opener||window.parent;
				if(rootWindow!=null)
				{
					rootWindow.citrix.receiver.viewLog();
				}
			}
			else
			{
				window.open(clientURL+'src/viewlog.html');
			}
		  
		}
		if(toolbarConfig && toolbarConfig["viewLogs"] && !g.environment.receiver.isChromeApp){
			UiControls.Toolbar.register({"id":"viewLogs","handler":openLogPage});
		}
		
		if(toolbarConfig && toolbarConfig["about"] !== false){
			UiControls.Toolbar.register({"id":"about","handler":myself.showAboutDialog});
		}
		this.EnableCtrlAltDel();
		
		//Add the fullscreen button to Toolbar only if the API is available.
		var doc = window.document;
		var docEl = doc.documentElement;
		var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
		
		//API not available in case of IPAD safari/Chrome
		
		if(requestFullScreen && !g.environment.receiver.isKiosk){					
			function toggleFullScreenBtnImg(state){
				var fullScreenEle = document.getElementById("fullscreen");
				var fullScreenTooltip = document.getElementById("fullscreentooltip");
				var text;
				if(state === "fullscreen"){
					text = HTML5Engine.i18n.getMessage("toolbar-fullscreen");
				}else if(state === "restore"){
					text = HTML5Engine.i18n.getMessage("toolbar-restore-fullscreen");
				}else if(state === "multimonitor"){
					text = HTML5Engine.i18n.getMessage("toolbar-multimonitor");
				}
				if(fullScreenEle){					
					//TODO : have a better logic to determine if it is primary or secondary.
					if(fullScreenEle.className.indexOf("fullscreen") !== -1 || fullScreenEle.className.indexOf("windowRestore") !== -1 || fullScreenEle.className.indexOf("multimonitor") !== -1){
						//is primary menu item
						if(fullScreenTooltip){
							fullScreenTooltip.innerHTML = text;
						}
						if(state === "fullscreen"){
							/*Removing all the occurrences of windowRestore string.
							When user presses F11/browser menu to go fullscreen and clicks on toolbar button to go fullscreen , multiple times windowRestore is added 
							and button image will be restore*/
							fullScreenEle.className = fullScreenEle.className.replace(new RegExp(" windowRestore","g"),"");
							fullScreenEle.className = fullScreenEle.className.replace(new RegExp(" multimonitor","g"),"");
							fullScreenEle.className += " fullscreen";
						}else if(state === "restore"){
							fullScreenEle.className = fullScreenEle.className.replace(new RegExp(" fullscreen","g"),"");
							fullScreenEle.className = fullScreenEle.className.replace(new RegExp(" multimonitor","g"),"");
							fullScreenEle.className += " windowRestore";								
						}else if(state === "multimonitor"){
							fullScreenEle.className = fullScreenEle.className.replace(new RegExp(" fullscreen","g"),"");
							fullScreenEle.className = fullScreenEle.className.replace(new RegExp(" windowRestore","g"),"");
							fullScreenEle.className += " multimonitor";
						}						
					}else{
						//secondary menu item
						fullScreenEle.innerHTML = text;
					}					
				}
			}
			
			function fullscreenListener(value){
				UiControls.ResolutionUtility.set(UiControls.ResolutionUtility.constants.fullScreen,value);
			}
		if(requestFullScreen && !HTML5Interface.isKiosk() && (toolbarConfig && toolbarConfig["fullscreen"] !== false) && !g.environment.browser.isSafari){					
			UiControls.Toolbar.register({"id":"fullscreen","handler":HTML5Interface.window.toggleFullScreen.bind(null,fullscreenListener)});
			function fullScreenEventHandler(windowMode){
			  if(windowMode == 'restore'){//If windowMode is restore, show fullscreen icon
				toggleFullScreenBtnImg('fullscreen');
			  }else if(windowMode == 'fullscreen'){//If windowMode is fullscreen, show restore icon
			    toggleFullScreenBtnImg('restore');
			  }else if(windowMode == 'multimonitor'){
				 toggleFullScreenBtnImg('multimonitor'); 
			  }
			}
			UiControls.ResolutionUtility.get(UiControls.ResolutionUtility.constants.fullScreen,fullScreenEventHandler);
			UiControls.ResolutionUtility.registerCallback(UiControls.ResolutionUtility.constants.fullScreen,fullScreenEventHandler);
			
		}
		}
		//enableDragDrop();					
		};	
	//this button is added only in touch devices
	
	this.enableKeyboardButton = function EnableKeyboardButton()
	{
            // Chrome pixel keyboard button is not required as hardware keyboard is attached always
			if(isChromeOS || ((config && config['toolbar']) && (config['toolbar']['menubar'] == false || config['toolbar']['keyboard'] == false ))){
				return;
			}
		enableKeyboardPopup();							
	};

	var enableKeyboardPopup = function EnableKeyboardPopup() {
		
	
		function openKeyboard(e){
			CEIP.incrementCounter("toolbar:buttons:keyboard");
			// HACK - Turn off scroll mode to enable dragging
			/*var ui = mobileReceiverView_obj.getMobileUI();
			ui.setScrollingMode(false);		 */
			
			// Toggle the keyboard
			if (mobileReceiverView_obj) {
				mobileReceiverView_obj.toggleKeyBoardDisplay();
				}
                e.preventDefault();
			}

		UiControls.Toolbar.register({"id":'keyboard',"handler":openKeyboard});			
	};
	
	//this button is added only in touch devices

	this.enableMultiTouchButton = function EnableMultiTouchButton()
	{
		if(config && config['toolbar'] && (config['toolbar']['menubar'] == false || config['toolbar']['multitouch'] == false)){
			return;
		}
		enableMultiTouchToggle();							
	};

	var enableMultiTouchToggle = function EnableMultiTouchToggle() {
		
	
		
				function toggleMultiTouchMode(e){
					CEIP.incrementCounter("toolbar:buttons:toggleMultiTouch");
			var multiTouchButton = document.getElementById("multitouch");
			if(multiTouchButton.className.indexOf("multitouch") !== -1) {
				multiTouchButton.className = multiTouchButton.className.replace("multitouch","");
				multiTouchButton.className += " panmode";
				myself.showMobilePopOverMessage(HTML5Engine.i18n.getMessage("multiTouchMode"));
			}
				else if(multiTouchButton.className.indexOf("panmode") !== -1) {
				multiTouchButton.className = multiTouchButton.className.replace("panmode","");
				multiTouchButton.className += " multitouch";
                    myself.showMobilePopOverMessage(HTML5Engine.i18n.getMessage("panningMode"));
				}
                else if(multiTouchButton.innerHTML === HTML5Engine.i18n.getMessage("toolbar-multitouch")){
                    multiTouchButton.innerHTML = HTML5Engine.i18n.getMessage("toolbar-panning");
				myself.showMobilePopOverMessage(HTML5Engine.i18n.getMessage("multiTouchMode"));
                }
                else if(multiTouchButton.innerHTML === HTML5Engine.i18n.getMessage("toolbar-panning")){
                    multiTouchButton.innerHTML = HTML5Engine.i18n.getMessage("toolbar-multitouch");
				myself.showMobilePopOverMessage(HTML5Engine.i18n.getMessage("panningMode"));
			}
			
			// Toggle the multitouch mode
			myself.callBackWrapper.toggleMultiTouchMode();
		}			

		UiControls.Toolbar.register({"id":'multitouch',"handler":toggleMultiTouchMode});			
	};
	var enableFileUpload = function() {
		
		fileElement = document.createElement('input');
		fileElement.type = "file";
		fileElement.multiple = "multiple";
		fileElement.style.display = 'none';
		var ui = GetUI().GetElement(); //Appending to CitrixXtcRoot
		ui.appendChild(fileElement);
		fileElement.addEventListener("change",function(e){
		var files = e.target.files;
		UploadFiles(files);},false);

		function FileUploadClick(evt) {
			CEIP.incrementCounter("toolbar:buttons:upload");
			if (uploadAllowed == false) {
				return;
			}			
			var event = document.createEvent("MouseEvents");
    		event.initMouseEvent("click", true, true, null, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    		fileElement.dispatchEvent(event);
		}
		

		UiControls.Toolbar.register({"id":"fileUpload","handler":FileUploadClick});
		
	};
	
	var enableFileDownload = function() {
			
		function FileDownloadClick(evt) {
			CEIP.incrementCounter("toolbar:buttons:download");
			myself.callBackWrapper.initiateFileDownload();
		}		
		UiControls.Toolbar.register({"id":"fileDownload","handler":FileDownloadClick});
	};
	function UploadFiles(files){
		if(files.length == 0 || uploadAllowed == false)
		{
			return;
		}else if(files.length > fileTransferCountLimit){
			myself.showFileTransferError(FileTransferConstants.FILE_COUNT_ERROR);
			clearFileUploadElement();
			return;
		}
		for(var i=0;i<files.length;i++){
			if(files[i].size>fileTransferConfig['fileTransferUploadSizeLimit']){
				myself.showFileTransferError(FileTransferConstants.SIZE_LIMIT_ERROR);
				clearFileUploadElement();
				return;
			}
		}
		for(var i=0;i<files.length;i++)
		{
			myself.callBackWrapper.setFileUploadObject(files[i]);
		}
		myself.callBackWrapper.initiateFileUpload();
		clearFileUploadElement();
		uploadAllowed = false;
	}
	var clearFileUploadElement = function()
	{
		try {
			fileElement.value = null;
			}
		catch(ex) {	}
		if(fileElement.value) {
			fileElement.parentNode.replaceChild(fileElement.cloneNode(true),fileElement);
		}
		
	}
	this.showFileTransferError = function(cmd){
		ctxdialog.showFileTransferError(cmd);
	};
	this.fileDragOverHandler = function(e){
		if (e.preventDefault){ 
			e.preventDefault();
		} 
		
		if (e.stopPropagation){ 
			e.stopPropagation();		
		}
		if(uploadAllowed == false){
			e.dataTransfer.dropEffect = 'none';
		}
		else{
			e.dataTransfer.dropEffect = 'copy';
		}		
	};
	this.fileDropHandler = function(e){
		if(fileTransferEnabled === false || (fileTransferEnabled === true && fileTransferConfig['allowFileUpload'] == false))
		{
			myself.showFileTransferError(FileTransferConstants.POLICY_ERROR);
			return;
		}
		if(uploadAllowed == false){
			return;
		}
		var isCancelUpload = false;
		if (e.preventDefault){ 
			e.preventDefault(); 
		}
		if (e.stopPropagation){ 
			e.stopPropagation();
		}
		  // Chrome only
		if (e.dataTransfer.items && e.dataTransfer.items.length) {
            for(var i=0;i<e.dataTransfer.items.length;i++)
            {
                if(e.dataTransfer.items[i].kind == "file" && typeof e.dataTransfer.items[i].webkitGetAsEntry !== "undefined")
                {
                    var entry = e.dataTransfer.items[i].webkitGetAsEntry();
			        if (!entry || !entry.isFile) {
				        isCancelUpload = true;
                        break;
			         }
                }
            }
		}
		if(!isCancelUpload){
			var fileList = e.dataTransfer.files;
			CEIP.add('fileTransfer:uploadDnD',true);
			UploadFiles(fileList);
		}
	};
	function enableDragDrop()
	{
		var mousePointerDiv  = document.getElementById("MousePointerDiv");
		if(mousePointerDiv){
			mousePointerDiv.addEventListener("drop",myself.fileDropHandler,false);
			mousePointerDiv.addEventListener("dragover",myself.fileDragOverHandler,false);			 
		}
	}
	function enableDownloadButton()
	{
		fileDownloadElement = document.createElement('a');
		fileDownloadElement.onmousemove = void(0);
		fileDownloadElement.href = "#";
		fileDownloadElement.style.display = 'none';
		fileDownloadElement.id = "downloadButton";
		var ui = GetUI().GetElement(); //Appending to CitrixXtcRoot
		ui.appendChild(fileDownloadElement);
	}
	
    var releaseAllConfirmationDialog ="";
    var releaseAllConfirmationDiv ="";
	
	this.enableUSB = function() {

		if(config && config['toolbar'] && config['toolbar']['menubar'] == false){
			return;
		}
		if (usbEnabled) {
			return;
		}

		usbEnabled = true;			
		
		enableUSBRedirectionDialog();

	};

	function enableUSBRedirectionDialog() {
		
		usbRedirectionDialog = new USBDialog();

		function USBClick(evt) {
			CEIP.incrementCounter("toolbar:buttons:usb");
            HTML5Interface.window.focus();		
			usbRedirectionDialog.Show();
			usbRedirectionDialog.updateUSBDialogMsg();
			usbRedirectionDialog.resizeUSBDialog();
		}
		
		UiControls.Toolbar.register({"id":"usb","handler":USBClick});
		myself.callBackWrapper.registerUSBClick(USBClick);
	
	};
    
    this.showUSB = function() {
        usbRedirectionDialog.Show();
    };
    
	function USBDialog(){
		var usbDialogElement;
		var releaseAllClicked = false;
		var usbTableBody="";
		var usbDevicesList = [];
		var showUSBdialog = false;
    var dialogId = "usbredirectiondialog";
		
    function Init(){
			UiControls.ResolutionUtility.registerCallback(UiControls.ResolutionUtility.constants.displayInformation, resizeUSBDialogonSessionResize);
			var ui = GetUI();
            
			var usbDialogLayout = new GridLayout(ui);
			usbDialogElement= usbDialogLayout.GetElement();
			usbDialogElement.id = 'usbredirectiondialog';
			usbDialogElement.className = "usbredirectiondialog";
						
			var closeButton = document.createElement("span");
			usbDialogElement.appendChild(closeButton);
			closeButton.className = "closeBtn";
			
			closeButton.addEventListener('click',usbDialogCloseHandler);
			
			var usbTitleDiv = document.createElement("div");
			usbDialogElement.appendChild(usbTitleDiv);
			usbTitleDiv.className = "usbTitle";
			usbTitleDiv.innerHTML = HTML5Engine.i18n.getMessage('toolbar-usb');
			
			var usbHeaderDiv = document.createElement("div");
			usbDialogElement.appendChild(usbHeaderDiv);
			usbHeaderDiv.className = "usbHeaderMsg";
			usbHeaderDiv.id = "usbHeaderMsg";
			usbHeaderDiv.innerHTML = HTML5Engine.i18n.getMessage('usbTitleMsg');

			var usbTableDiv = document.createElement("div");
			usbTableDiv.className = "usbTableDiv";
			usbTableDiv.id = "usbTableDiv";
			usbDialogElement.appendChild(usbTableDiv);
			var usbTable = document.createElement('table');
			
			var usbTableHeader = usbTable.createTHead();

			
			usbTableHeader.innerHTML = "<tr><th>"+HTML5Engine.i18n.getMessage("device")+"</th><th> "+ HTML5Engine.i18n.getMessage("status")+"</th></tr>"
			
			usbTableBody = usbTable.createTBody();
			usbTableBody.className = "usbTableBody";
			usbTableBody.id = "usbTableBody";
			
			usbTableDiv.appendChild(usbTable);
			usbTableDiv.style.display = "none";
			
			var usbButtonsDiv = document.createElement("div");
			usbButtonsDiv.className = "usbButtonsDiv";
			
			var usbAddDeviceBtn = document.createElement("button");
			usbAddDeviceBtn.innerHTML = HTML5Engine.i18n.getMessage('usbAddDevice');
			usbAddDeviceBtn.className = "usbBtnCls usbAddBtnCls";
			usbAddDeviceBtn.addEventListener('click',AddUSBDevice);
			usbButtonsDiv.appendChild(usbAddDeviceBtn);
				
			var usbReleaseAllBtn = document.createElement("button");
			usbReleaseAllBtn.innerHTML = HTML5Engine.i18n.getMessage("releaseAllDevices");
			usbReleaseAllBtn.className = "usbBtnCls";
			usbReleaseAllBtn.id = "usbReleaseAllBtn";
			usbReleaseAllBtn.style.display = "none";
			
			usbButtonsDiv.appendChild(usbReleaseAllBtn);
			releaseAllConfirmationDialog = CreateReleaseAllConfirmationDialog();
			releaseAllConfirmationDiv = document.getElementById('releaseAllConfirmationDiv');
			usbReleaseAllBtn.addEventListener("click",showConfirmationDialog);
			usbDialogElement.appendChild(usbButtonsDiv);
			usbDialogElement.style.display ="none";		  	  
			
			return usbDialogElement;
		}
		function usbDialogCloseHandler(){			
            usbRedirectionDialog.Hide();
		}
		
		this.closeAllUsbDevices = function()
		{
			USBReleaseAllDevices();
		}
  
		this.closeSessionUsbDevices = function()
		{	
            myself.callBackWrapper.closeSessionUsbDevices(document.title);            
		}
		this.Show = function(){
			showUSBdialog = true;
			resizeUSBDialogonSessionResize();
		};
		
		function resizeUSBDialogonSessionResize (){
			  if(showUSBdialog){
    	      var usbLeft = window['innerWidth'] / 2;
		    	  usbDialogElement.style.left = Math.floor(usbLeft) + 'px';
				    usbDialogElement.style.display = "block";
				    if (seamlessNotifier != undefined) {
					      console.log(seamlessNotifier);
					      seamlessNotifier.add(dialogId);
				    }
			  }
		}
		
		this.Hide = function(){
			showUSBdialog = false;
			usbDialogElement.style.display = "none";
            var usbRedirDialog = document.getElementById("usbRedirection"); 	
			if(usbRedirDialog) {
                usbRedirDialog.style.backgroundColor = "#574f5b";
            }
            seamlessNotifier.remove(dialogId);
		};

		/*This will delete the rows of devices which belong to other session.*/
		/*For devices of this session we call silentReleaseDevice on first device*/
		/*SilentreleaseDevice will call  closeUsbDevice. CloseUsbDevice will then send STATUS_SILENT_STOP  if successful closing to browserbox.js. That will again call SilentReleaseDevice on next device */
		this.USBReleaseAllDevices = function(e){

			if(!usbTableBody)
			  usbTableBody = document.getElementById('usbTableBody');

			var tableRows = usbTableBody.childNodes;
			if(tableRows && tableRows[0])
			{
				myself.callBackWrapper.releaseOtherSessionDevices(usbDevicesList[tableRows[0].id]);
				document.getElementById('usbReleaseAllBtn').disabled = true;
				releaseAllClicked = true;
				for(var iter =0; iter < tableRows.length; iter++)
				{
					if(usbDevicesList[tableRows[iter].id]['deviceOwner']!==document.title)
					{
				   
						delete usbDevicesList[tableRows[iter].id];
						tableRows[iter].parentElement.removeChild(tableRows[iter]);
					}
				  usbRedirectionDialog.resizeUSBDialog();
					usbRedirectionDialog.updateUSBDialogMsg();
				}
			}

			tableRows = usbTableBody.childNodes;
			if(tableRows && tableRows[0])
			{
			  silentReleaseDevice(tableRows[0]);
			}
			releaseAllClicked = false;
		}
  
		function ReleaseDevice(tableRow){
	 
			if(tableRow && tableRow.childNodes){
				tableRow.childNodes[1].innerHTML = HTML5Engine.i18n.getMessage("releasing");
				tableRow.childNodes[2].disabled =  true;
				var deviceOwner = usbDevicesList[tableRow.id]['deviceOwner'];
				var device  = usbDevicesList[tableRow.id];
				
				   /*The following if loop works for 'Cancel' during 'Connecting' Phase of 'Add'*/
			   if(usbDevicesList[tableRow.id]['status']===DeviceStatus.STATUS_PENDING ||usbDevicesList[tableRow.id]['status']===DeviceStatus.STATUS_REDIR)
				{
				  delete usbDevicesList[tableRow.id];
				  tableRow.parentElement.removeChild(tableRow);
				  device.status = DeviceStatus.STATUS_FAILED;
				}
				if(deviceOwner===document.title)
				{
					 myself.callBackWrapper.closeUsbDevice(device, DeviceStatus.STATUS_STOP);
				}
			}
		}
		function silentReleaseDevice(tableRow){
	   
			if(tableRow && tableRow.childNodes){
				tableRow.childNodes[1].innerHTML = HTML5Engine.i18n.getMessage("releasing");
				tableRow.childNodes[2].disabled =  true;
				if(usbDevicesList[tableRow.id]['deviceOwner']===document.title)
				{
					myself.callBackWrapper.closeUsbDevice(usbDevicesList[tableRow.id],DeviceStatus.STATUS_SILENT_STOP);
				}
				else{
					delete usbDevicesList[tableRow.id];
					tableRow.parentElement.removeChild(tableRow);
				}
				usbRedirectionDialog.resizeUSBDialog();
				usbRedirectionDialog.updateUSBDialogMsg();
			}
		}
  
		function TransferAdd(productId,vendorId,device){
			var id = productId + "_" + vendorId + "_" +device["device"];
						usbDevicesList[id] = {
							'productId' : productId,
							'vendorId' : vendorId,
							'device' : device,
						'unitId': "",
						'status': "",
						'deviceOwner':document.title,
						'nextOwner':"",
						'deviceName':""
						};
					
					 
			myself.callBackWrapper.initiateUSBRedirection(productId, vendorId, device);
		}
  
		this.TransferDevice= function(e){
			if(e.srcElement){
				var tableRow = e.srcElement.parentNode.parentNode;
				if(tableRow && tableRow.childNodes){
					tableRow.childNodes[1].innerHTML = HTML5Engine.i18n.getMessage("usb-connecting");
					tableRow.childNodes[2].childNodes[0].disabled =  true;
					usbDevicesList[tableRow.id]['nextOwner']= document.title ;
					myself.callBackWrapper.transferUsbDevice(usbDevicesList[tableRow.id]);
				}
			}
		}
  
		function AddUSBDevice(){
            usbDialogElement.className += " usbredirectiondialogExpanded";
            if (displayManager) {
                displayManager.disableAllDisplay();
            }
            usbRedirectionDialog.resizeUSBDialog();
			chrome.usb.getUserSelectedDevices({}, function(devices) {
                usbDialogElement.className = usbDialogElement.className.replace(" usbredirectiondialogExpanded", "");
                if (displayManager) {
                    displayManager.enableAllDisplay();
                }
                usbRedirectionDialog.resizeUSBDialog();
				for (var i = 0; i < devices.length; i++) {
				
					var id = devices[i]["productId"] + "_" + devices[i]["vendorId"] + "_" +devices[i]['device'];
                    var deviceName = devices[i]["productName"];
                    if (!deviceName || deviceName === "") {
                        deviceName = "Unknown product " + devices[i]["productId"].toString(16) + ":" + devices[i]["vendorId"].toString(16);
                    }
					if(!usbDevicesList[id])
					{
						usbDevicesList[id] = {};
						usbDevicesList[id] = {
							'productId' : devices[i]['productId'],
							'vendorId' : devices[i]['vendorId'],
							'device' : devices[i],
							'unitId': "",
							'status': "",
							'deviceOwner':document.title,
							'nextOwner':"",
							'deviceName': deviceName
						};
					}
                    
					createUSBDeviceRow(deviceName,HTML5Engine.i18n.getMessage("connecting"),id,false);
				}
			});
		}

		function createUSBDeviceRow(name,status,id1,isTransfer){
			if(usbTableBody){
				if(!document.getElementById(id1)){			
					var usbTableBodyRow = usbTableBody.insertRow();
					usbTableBodyRow.id=id1;
					var usbTableBodyCell1 = usbTableBodyRow.insertCell();
					usbTableBodyCell1.innerHTML = name;
					var usbTableBodyCell2 = usbTableBodyRow.insertCell();
					usbTableBodyCell2.innerHTML = status;
					var usbTableBodyCell3 = usbTableBodyRow.insertCell();
					if(isTransfer){
					  usbTableBodyCell3.innerHTML = '<button id=' + id1+"_btn " +'class="usbBtnCls stopButton">'+ HTML5Engine.i18n.getMessage('transfer')+ '</button>';              
					  usbTableBodyCell3.childNodes[0].addEventListener("click",showConfirmationDialog);
					}else{
					  usbTableBodyCell3.innerHTML = '<button id=' + id1+"_btn " +'class="usbBtnCls stopButton">'+ HTML5Engine.i18n.getMessage('cancel')+ '</button>';			  
					  usbTableBodyCell3.childNodes[0].addEventListener("click",showConfirmationDialog);
					  usbTableBodyCell3.childNodes[0].disabled = true;
					  if(usbDevicesList[id1])
					  {
						myself.callBackWrapper.initiateUSBRedirection(usbDevicesList[id1]['productId'], usbDevicesList[id1]['vendorId'], usbDevicesList[id1]['device']);
					  }
					}
				}
				usbRedirectionDialog.resizeUSBDialog();
				usbRedirectionDialog.updateUSBDialogMsg();
			}
		}

		this.releaseUSBDevice = function(e){
			if(e.srcElement){
			  var tableRow = e.srcElement.parentNode.parentNode;
			  if(tableRow){
				e.srcElement.disabled = true;
					ReleaseDevice(tableRow);
			  }
			}
		}
		this.updateUSBDialogMsg = function(){
			if(usbTableBody){
				usbTableDiv = document.getElementById('usbTableDiv');
				if(usbTableBody.childNodes.length >0){
					document.getElementById('usbHeaderMsg').innerHTML = HTML5Engine.i18n.getMessage('usbTitleMsg');
			  usbTableDiv.style.display = "block";
				}else{
				
				   if(releaseAllClicked){
					 document.getElementById('usbHeaderMsg').innerHTML = HTML5Engine.i18n.getMessage('releaseAllNoDeviceMsg');
					 document.getElementById('usbReleaseAllBtn').disabled = false;
				   }else{
					document.getElementById('usbHeaderMsg').innerHTML = HTML5Engine.i18n.getMessage('noDeviceMsg');
				   }
			  usbTableDiv.style.display = "none";
				}
				if(usbTableBody.childNodes.length > 1){
					 document.getElementById('usbReleaseAllBtn').style.display = "block";
				}else{
					 document.getElementById('usbReleaseAllBtn').style.display = "none";
					 closeReleaseAllConfirmationDialog();
				}
			}
		};
		
		this.resizeUSBDialog= function(){
			if(usbDialogElement && usbDialogElement.style.display === "block"){
				usbDialogElement.style.marginTop = "-" +(usbDialogElement.clientHeight/2) +"px";
			
				if(releaseAllConfirmationDialog && releaseAllConfirmationDialog.style.display === "block"){
					if(releaseAllConfirmationDiv){
						releaseAllConfirmationDiv.style.width = usbDialogElement.clientWidth+"px";
						releaseAllConfirmationDiv.style.height = usbDialogElement.clientHeight +"px";
						releaseAllConfirmationDiv.style.marginTop = usbDialogElement.style.marginTop;
						releaseAllConfirmationDiv.style.zIndex = 10;
					}
					releaseAllConfirmationDialog.style.marginTop = "-" +(releaseAllConfirmationDialog.clientHeight/2) +"px";
				}
                seamlessNotifier.update(dialogId);
			}
		};
	
	
		this.notifyUSBInfo = function(data){
			//Get all the devices connected from shared worker by other sessions
			if(data['cmd'] === WorkerCommand.CMD_USB_SENDING_LIST){
				if(data && data['usbList']){
					for(var deviceId in data['usbList']){
						var device = data['usbList'][deviceId];
						if(device && device['deviceOwner'] !== document.title){
							if(!usbDevicesList[deviceId]){
								 usbDevicesList[deviceId] = {
									'productId' : device['productId'],
									'vendorId' : device['vendorId'],
									'device' : device['device'],
									'unitId':device['unitId'],
									'status':device['status'],
									'deviceOwner':device['deviceOwner'],
									'nextOwner':device['nextOwner'],
									'deviceName':device['deviceName']
								}; 
								createUSBDeviceRow(device['deviceName'],HTML5Engine.i18n.getMessage("usb-outOfSessionUse"),deviceId,true);
							}
						}
					}
				}
			}
			
			//Add and release of devices owned by other sessions as notified by Shared worker
			if(data['cmd'] === WorkerCommand.SEAMLESS_USB_NOTIFICATIONW2C){
			  
				if(data['action'] === "ADDED"){
					writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|: ADDED NOTIFICATION RECEIVED: "  + data['device']['deviceName']);
			   
					if(data['device']){
						var id = data["device"]["productId"] + "_" + data["device"]["vendorId"] + "_" +data["device"]['device']["device"];
						if(data['device'] && data['device']['deviceOwner'] !== document.title){
							if(!usbDevicesList[id]){
								// writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|: Device is not present in usbDeviceList " );
								
								 usbDevicesList[id] = {
									'productId' : data['device']['productId'],
									'vendorId' : data['device']['vendorId'],
									  'device' : data['device']['device'],
									  'unitId': data['device']['unitId'],
									  'status': data['device']['status'],
									  'deviceOwner':data['device']['deviceOwner'],
									  'nextOwner':data['device']['nextOwner'],
									  'deviceName':data['device']['deviceName']
								}; 
								createUSBDeviceRow(data['device']['deviceName'],HTML5Engine.i18n.getMessage("usb-outOfSessionUse"),id,true);
							}
							else
							{
								// writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|: Device is present in usbDeviceList " );
							
								usbDevicesList[id]['unitId'] =data['device']['unitId'];
								usbDevicesList[id]['status'] =data['device']['status'];
								usbDevicesList[id]['deviceOwner'] =data['device']['deviceOwner'];
								usbDevicesList[id]['nextOwner'] =data['device']['nextOwner'];
								usbDevicesList[id]['deviceName'] =data['device']['deviceName'];
								  
								var id = data["device"]["productId"] + "_" + data["device"]["vendorId"] + "_" +data["device"]['device']["device"];
								var usbDeviceRow = document.getElementById(id);
								if(usbDeviceRow && usbDeviceRow.childNodes){
									usbDeviceRow.childNodes[1].innerHTML = HTML5Engine.i18n.getMessage("usb-outOfSessionUse");
									usbDeviceRow.childNodes[2].childNodes[0].innerHTML = HTML5Engine.i18n.getMessage("transfer");
									usbDeviceRow.childNodes[2].disabled =  false;			             
								}
								else{
									createUSBDeviceRow(data['device']['deviceName'],HTML5Engine.i18n.getMessage("usb-outOfSessionUse"),id,true);
								}
							}
						}
					}

				}else if(data['action'] === "DELETED"){
					writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:DELETED NOTIFICATION RECEIVED: " + data['device']['deviceName'] );
					//console.log(data['device']['deviceName'] + "DELETED:");
					if(data['device']){
						var id = data["device"]["productId"] + "_" + data["device"]["vendorId"] + "_" +data["device"]['device']["device"];
						var usbDeviceRow = document.getElementById(id);
						delete usbDevicesList[id];
						if(usbDeviceRow && usbDeviceRow.childNodes){
							usbDeviceRow.parentNode.removeChild(usbDeviceRow);
						}
					}
				
					if(releaseAllClicked){
						if(usbTableBody.firstChild){
							ReleaseDevice(usbTableBody.firstChild);
						}
					}
				}
				else if(data['action'] === "RELEASE_DEVICES")
				{
					writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:RELEASE DEVICES NOTIFICATION RECEIVED: " + data['sessionName'] );
					// console.log("Closed" + data['sessionName'] + "RELEASE DEVICES:");		 
					if(!usbTableBody)
						usbTableBody = document.getElementById('usbTableBody');
			  
					var tableRows = usbTableBody.childNodes;
					if(tableRows && tableRows[0])
					{
						document.getElementById('usbReleaseAllBtn').disabled = true;
						var tableRowsLength = tableRows.length;
						for(var iter =0; iter< tableRows.length ; iter++)
						{
							for(var i=0; i< data['removeUsbDevicesList'].length;i++){
								if(tableRows[iter].id === data['removeUsbDevicesList'][i]){
									delete usbDevicesList[tableRows[iter].id];
									tableRows[iter].parentNode.removeChild(tableRows[iter]);
									iter--;
									break;
								}
							}
						}
					}
					document.getElementById('usbReleaseAllBtn').disabled = false;
				}else if(data['action'] === "RELEASE_ALL"){
					writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:RELEASE ALL NOTIFICATION RECEIVED: " + data['device']['deviceName'] );
					// console.log(data['device']['deviceName'] + "RELEASE ALL:");
			 
					if(!usbTableBody)
						usbTableBody = document.getElementById('usbTableBody');
			  
					var tableRows = usbTableBody.childNodes;
					if(tableRows && tableRows[0]){
						document.getElementById('usbReleaseAllBtn').disabled = true;
						releaseAllClicked = true;
						for(var iter =0; iter< tableRows.length ; iter++){
							if(usbDevicesList[tableRows[iter].id]['deviceOwner']!==document.title){
								// var usbDeviceRow  = document.getElementById();
								delete usbDevicesList[tableRows[iter].id];
								tableRows[iter].parentNode.removeChild(tableRows[iter]);
								//console.log("Removed : " + usbDevicesList[tableRow.id]['deviceName']);
							}
						}
					}
					tableRows =usbTableBody.childNodes;
					if(tableRows && tableRows[0]){
						silentReleaseDevice(tableRows[0]);
					}
				}else if(data['action'] === "TRANSFER_RELEASED"){		  
					writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:TRANSFER RELEASED NOTIFICATION RECEIVED: " + data['device']['deviceName'] );
				// console.log(data['device']['deviceName']+ "TRANSFER RELEASED");
					if(data['device']){
						var id = data["device"]["productId"] + "_" + data["device"]["vendorId"] + "_" +data["device"]['device']["device"];
						var usbDeviceRow = document.getElementById(id);

						if(usbDeviceRow && usbDeviceRow.childNodes && usbDevicesList[id]['nextOwner']!==document.title){
							usbDeviceRow.childNodes[1].innerHTML = HTML5Engine.i18n.getMessage("usb-outOfSessionUse");           
							usbDeviceRow.childNodes[2].disabled =  true;
						}
						if(usbDevicesList[id]['nextOwner']===document.title){
							productId = usbDevicesList[id]['productId'];
							vendorId = usbDevicesList[id]['vendorId'];
							device = usbDevicesList[id]['device'];
							TransferAdd(productId,vendorId,device);
						}
					}
				}else if(data['action'] === "TRANSFER_RELEASING"){
					writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:TRANSFER_RELEASING NOTIFICATION RECEIVED: " + data['device']['deviceName'] );
					// console.log(data['device']['deviceName']+"TRANSFER_RELEASING:");
					if(data['device']){
						var id = data["device"]["productId"] + "_" + data["device"]["vendorId"] + "_" +data["device"]['device']["device"];
						var usbDeviceRow = document.getElementById(id);
						if(data['device']['deviceOwner']===document.title){				
							if(usbDeviceRow && usbDeviceRow.childNodes){
								usbDeviceRow.childNodes[2].disabled =  true;
								usbDevicesList[usbDeviceRow.id]['status']=DeviceStatus.STATUS_TRANSFER_RELEASING;             
								myself.callBackWrapper.closeUsbDevice(usbDevicesList[usbDeviceRow.id],DeviceStatus.STATUS_STOP);
							}
						}else{
							delete usbDevicesList[id];
							if(usbDeviceRow && usbDeviceRow.childNodes){
								usbDeviceRow.parentNode.removeChild(usbDeviceRow);
							}
						}
					}

				}
			}
			if(data['cmd'] === WorkerCommand.USB_UPDATE_DEVICE){
				var id = data["productId"] + "_" + data["vendorId"] + "_" +data['device']["device"];
				var usbDeviceRow = document.getElementById(id);
				if(usbDeviceRow){
					var childNodes = usbDeviceRow.childNodes;
					if(data['status'] === DeviceStatus.STATUS_PENDING){
						writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:STATUS_PENDING: ");
						usbDevicesList[id]['status'] = DeviceStatus.STATUS_PENDING;
						usbDevicesList[id]['unitId'] = data['unitId'];
						if( childNodes[2].childNodes[0].innerHTML!==HTML5Engine.i18n.getMessage('transfer')){
							childNodes[2].childNodes[0].disabled = false;
						}
						//writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:PENDING STATE DONE for " + data['deviceName'] );
					}else if(data['status'] === DeviceStatus.STATUS_REDIR){
						writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:STATUS_REDIR: DEVICE INFORMATION SENT TO SERVER. WAITING FOR ACCEPTANCE FROM SERVER. ");
						if(data['deviceName']){
							childNodes[0].innerText = data['deviceName'];
						}
						var device = usbDevicesList[id];
						device['unitId'] = data['unitId'];
						usbDevicesList[id]['status'] = DeviceStatus.STATUS_REDIR;
					}else if(data['status'] === DeviceStatus.STATUS_REDIR_SUCCESS){
						writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:STATUS_REDIR_SUCCESS: DEVICE REDIRECTED SUCCESSFULLY " + data['deviceName'] );
						//console.log(data['deviceName'] + "is Added");
						childNodes[1].innerHTML = HTML5Engine.i18n.getMessage('usb-connected');
						
						childNodes[2].childNodes[0].innerHTML = HTML5Engine.i18n.getMessage('release');
									
						childNodes[2].childNodes[0].disabled = false;
						usbDevicesList[id]['status'] = DeviceStatus.STATUS_REDIR_SUCCESS;
					}else if( data['status'] === DeviceStatus.STATUS_GONE){
						writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:STATUS_GONE: " + data['deviceName'] );
						//console.log(data['deviceName'] + "is Removed");
						if(data['deviceName']){
							childNodes[0].innerText = data['deviceName'];
						}
						HTML5Interface.Notifications.showError(HTML5Engine.i18n.getMessage("usbDeviceGone"),"applied");
						usbDeviceRow.parentElement.removeChild(usbDeviceRow);
						delete usbDevicesList[id];
						if(releaseAllClicked){
							if(usbTableBody.firstChild){
								ReleaseDevice(usbTableBody.firstChild);
							}
						}
					}else if( data['status'] === DeviceStatus.STATUS_STOP){
						writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:STATUS_STOP: " + data['deviceName'] );
						//console.log(data['deviceName'] + "is Stopped");
						if(data['deviceName']){
							childNodes[0].innerText = data['deviceName'];
						}
						usbDeviceRow.parentElement.removeChild(usbDeviceRow);
						delete usbDevicesList[id];
					}
					else if( data['status'] === DeviceStatus.STATUS_SILENT_STOP){
						writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:STATUS_SILENT_STOP: " + data['deviceName'] );
						// console.log(data['deviceName'] + "is Silently  Removed");
						if(data['deviceName']){
							childNodes[0].innerText = data['deviceName'];
						}
						usbDeviceRow.parentElement.removeChild(usbDeviceRow);
						delete usbDevicesList[id];
											
						if(releaseAllClicked){
							if(usbTableBody.firstChild){
								silentReleaseDevice(usbTableBody.firstChild);
							}
						}										
					}
					else if( data['status'] === DeviceStatus.STATUS_TRANSFER_RELEASING){
						writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:STATUS_TRANSFER_RELEASING: "  );
						var id = data["productId"] + "_" + data["vendorId"] + "_" +data['device']["device"];
						usbDevicesList[id]['status'] = DeviceStatus.STATUS_TRANSFER_RELEASING;
					}
						
					else if(data['status'] === DeviceStatus.STATUS_FAILED){
						writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:STATUS_FAILED: "  );
						if(data['deviceName']){
							childNodes[0].innerText = data['deviceName'];
						}
						HTML5Interface.Notifications.showError(HTML5Engine.i18n.getMessage("usbServerReject"),"applied");
						usbDeviceRow.parentElement.removeChild(usbDeviceRow);
						delete usbDevicesList[id];
					}else if(data['status'] === DeviceStatus.STATUS_REJECTED){
						writeHTML5Log(0, "SESSION:|:ICA:|:USB:|:UI:|:STATUS_REJECTED: "  );
						HTML5Interface.Notifications.showInternalError(HTML5Engine.i18n.getMessage("usbServerReject"),"applied");
						usbDeviceRow.parentElement.removeChild(usbDeviceRow);
						delete usbDevicesList[id];
					}
						
				}
			}
			usbRedirectionDialog.resizeUSBDialog();
			usbRedirectionDialog.updateUSBDialogMsg();
		}
		Init();
	}
	function showConfirmationDialog(e){
		buttonText = e.srcElement.innerHTML;
		  var confirmationMsg = 	document.getElementById('confirmationMsg');
		  var usbConfirmationBtn = document.getElementById('usbConfirmationBtn');
		  if(buttonText === HTML5Engine.i18n.getMessage('cancel')){
			  usbRedirectionDialog.releaseUSBDevice(e);
			  return;
		  }
		  
		if(buttonText === HTML5Engine.i18n.getMessage("release")){
			  confirmationMsg.innerHTML = HTML5Engine.i18n.getMessage("releaseConfirmationMsg");
			  usbConfirmationBtn.innerHTML = HTML5Engine.i18n.getMessage("release");

		}else if(buttonText === HTML5Engine.i18n.getMessage("transfer")){
			confirmationMsg.innerHTML = HTML5Engine.i18n.getMessage("transferConfirmationMsg");
			  usbConfirmationBtn .innerHTML = HTML5Engine.i18n.getMessage("transfer_btn");

		}else if(buttonText === HTML5Engine.i18n.getMessage("releaseAllDevices")){
			confirmationMsg.innerHTML = HTML5Engine.i18n.getMessage("releaseAllConfirmationMsg");
			  usbConfirmationBtn .innerHTML = HTML5Engine.i18n.getMessage("release");
		}
		releaseAllConfirmationDialog.style.display = "block";
		releaseAllConfirmationDiv.style.display = "block";
		usbRedirectionDialog.resizeUSBDialog();

		/* Passing the event object sent by showConfirmationDialog, and not the one generated by the usbConfirmationBtn click event object */
		  usbConfirmationBtn.onclick = function(){
			closeReleaseAllConfirmationDialog();
			if(buttonText === HTML5Engine.i18n.getMessage("release")){
				usbRedirectionDialog.releaseUSBDevice(e);
			}else if(buttonText === HTML5Engine.i18n.getMessage("transfer")){
				usbRedirectionDialog.TransferDevice(e);
			}else if(buttonText === HTML5Engine.i18n.getMessage("releaseAllDevices")){
				usbRedirectionDialog.USBReleaseAllDevices(e);
			}
		};
	}

	function CreateReleaseAllConfirmationDialog(){
		var ui = GetUI();
		
		var releaseAllDialog =  new GridLayout(ui).GetElement();
		releaseAllDialog.className = "releaseAllConfirmationDiv";
		releaseAllDialog.id = "releaseAllConfirmationDiv";
		
		var releaseAllConfirmationDialog = document.createElement("div");
		releaseAllConfirmationDialog.id = "releaseAllConfirmationDialog";
		releaseAllConfirmationDialog.className = "releaseAllConfirmationDialog releaseAllConfirmationBackground";
		releaseAllDialog.appendChild(releaseAllConfirmationDialog);
		
		var messageDiv =  document.createElement("div");
		
		var warningImgDiv = document.createElement("div");
		warningImgDiv.id = "unsecure_image";
		warningImgDiv.className="usbReleaseAllWarningImg";
		
		messageDiv.appendChild(warningImgDiv);
		
		var confirmationMsg = document.createElement("div");
		confirmationMsg.innerHTML = HTML5Engine.i18n.getMessage("releaseAllConfirmationMsg");
		confirmationMsg.className = "confirmationMsg";
		confirmationMsg.id = "confirmationMsg";
		
		messageDiv.appendChild(confirmationMsg);
		
		releaseAllConfirmationDialog.appendChild(messageDiv);
		
		
		var releaseAllButtonsDiv = document.createElement("div");
		releaseAllButtonsDiv.className = "releaseAllButtonsDiv";

		var releaseAllConfirmedBtn = document.createElement("button");
		releaseAllConfirmedBtn.innerHTML = HTML5Engine.i18n.getMessage("release");
		releaseAllConfirmedBtn.id = 'usbConfirmationBtn';
		releaseAllConfirmedBtn.className = "usbReleaseAllConfirmationBtnCls";
		releaseAllConfirmedBtn.style.marginRight = "24px";

		releaseAllButtonsDiv.appendChild(releaseAllConfirmedBtn);
		
		var releaseAllCancelBtn = document.createElement("button");
		releaseAllCancelBtn.innerHTML = HTML5Engine.i18n.getMessage("cancel");
		releaseAllCancelBtn.className = "usbReleaseAllCancelBtnCls";
		releaseAllCancelBtn.style.marginRight = "24px";
		releaseAllCancelBtn.addEventListener("click",function(e){
			closeReleaseAllConfirmationDialog();
		});
		
		releaseAllButtonsDiv.appendChild(releaseAllCancelBtn);
		
		releaseAllConfirmationDialog.appendChild(releaseAllButtonsDiv);
		releaseAllConfirmationDialog.style.display = "none";
		
		return releaseAllConfirmationDialog;
	}

	function closeReleaseAllConfirmationDialog(){
		releaseAllConfirmationDialog.style.display = "none";
		releaseAllConfirmationDiv.style.display = "none";
		releaseAllConfirmationDiv.style.zIndex = 0;
	}
	
	this.enableFileTransfer = function() {		
		fileTransferEnabled = true;
		writeHTML5Log(0, "SESSION:|:ICA:|:FILEVC:|:CLIENT_CONFIG: FileVC is enabled");
		writeHTML5Log(0, "SESSION:|:ICA:|:FILEVC:|:CLIENT_CONFIG: allowupload "+ fileTransferConfig['allowFileUpload']
		+"; allowdownload " + fileTransferConfig['allowFileDownload']
		+"; maxuploadsize " + fileTransferConfig['fileTransferUploadSizeLimit']
		+"; maxdownloadsize " +   fileTransferConfig['fileTransferDownloadSizeLimit']);
		
		// Enable drag_and_drop and <a> tag to upload/download files even if toolbar is disabled
		enableDragDrop();
		enableDownloadButton();
		
		if(config && config['toolbar'] && config['toolbar']['menubar'] == false){
			return;
		}
		if (fileTransferToolbarEnabled) {
			return;
		}
		if(fileTransferConfig['fileTransferAllowed'])
		{
			fileTransferToolbarEnabled = true;

			// Disable file download in case of IPad/IPhone and Windows 10 mobile / continuum as file download does not work in these devices
			if(fileTransferConfig['allowFileDownload'] && Utility.isFileDownloadAvailable())
			{
				enableFileDownload();
			}
			if(fileTransferConfig['allowFileUpload'])
			{
				enableFileUpload();
			}
		}
	};
	
	this.processUploadResponseNotification = function()
	{
		if(uploadAllowed == false)
			uploadAllowed = true;
	};
	
	this.processFileTransferConfig = function(maxFileCount)
	{
		fileTransferCountLimit = maxFileCount;
	};
	
	this.enableClipboard = function() {
		
		// Make sure clipboard dialog is not
		// initialized by calling more than once.
		if(config && config['toolbar'] && config['toolbar']['menubar'] == false){
			return;
		}
		if (clipboardEnabled) {
			return;
		}
        UiControls.clipboardDialog.create(myself.callBackWrapper);
        
		clipboardEnabled = true;
		
		//Registering the clipboard to the toolbar
		UiControls.Toolbar.register({"id":"clipboard","handler":UiControls.clipboardDialog.show});
	};

	this.EnableCtrlAltDel = function() {
		if(config && config['toolbar'] && config['toolbar']['menubar'] == false){
			return;
		}
		
         var msg ={action:""};
		

		function sendLogoff(evt) {
			CEIP.incrementCounter("toolbar:buttons:logoff");
			var logoffMsg =  {
				window_info:{},
				cmd:"action",
				action:"logoff"
			};
			console.log("lock clicked");
			msg.action="logoff";
			myself.callBackWrapper.connectionAction(logoffMsg);
		}
		function sendLock(evt) {
			CEIP.incrementCounter("toolbar:buttons:lock");
			console.log("lock clicked");
			msg.action="ctrlaltdel";
			myself.callBackWrapper.connectionAction(msg);
		}
		function sendDisconnect(evt){
			CEIP.incrementCounter("toolbar:buttons:disconnect");
			msg.action="disconnect";
			myself.callBackWrapper.connectionAction(msg);
		}		
		if(config && config['toolbar'] && config['toolbar']['lock'] == true){
			UiControls.Toolbar.register({"id":"lock","handler":sendLock});
		}
		if(config && config['toolbar'] && config['toolbar']['disconnect'] == true){
			UiControls.Toolbar.register({"id":"disconnect","handler":sendDisconnect});
		}
		if(config && config['toolbar'] &&  config['toolbar']['logoff'] == true){
			UiControls.Toolbar.register({"id":"logoff","handler":sendLogoff});
		}
	};

	this.OnClipboardChange = function() {
		if(config && config['toolbar'] && config['toolbar']['menubar'] == false){
			return;
		}
        UiControls.clipboardDialog.OnClipboardChange();
	};
	this.notifyUsbUi = function(data) {
		if(config && config['toolbar'] && config['toolbar']['menubar'] == false){
			return;
		}
		if (usbRedirectionDialog) {
			usbRedirectionDialog.notifyUSBInfo(data);
		} else {
			console.info("missed USB notification as it is not initialized: ", data);
		}
	};
	
	this.OnArbitraryKeyPress = function() {
		if (fileUploadDialogShown) {
			fileUploadDialog.HideByFade();

			// Once we start to hide, we set fileUploadDialogShown as false,
			// in order to make sure, that HideByFade is not called when,
			// the dialog is already fading.
			fileUploadDialogShown = false;
			toolbarDialogShown = false;
		}

	};

	this.OnChildClose = function(childObj) {
		if (childObj == fileUploadDialog) {
			fileUploadDialogShown = false;
			toolbarDialogShown = false;
		}
	};

	this.OnResize = function(resizeParams) {
		if(config && config['toolbar'] && config['toolbar']['menubar'] == false){
			return;
		}
		var newSessionWidth = resizeParams[0];
		var newSessionHeight = resizeParams[1];

		var deltaX, deltaY;
		var lessSpace = false;
		var childItemsVisible = true;
		
		UiControls.Toolbar.setPositionOnResize(resizeParams);

		//If USB is disabled then this will be null.
		if(usbRedirectionDialog)
			usbRedirectionDialog.resizeUSBDialog();
	};

	this.AfterResize = function() {
		if(config && config['toolbar'] && config['toolbar']['menubar'] == false){
			return;
		}

        //This is required for seamless when window is dragged over to the other monitor
        //after opening USB dialog
        if(usbRedirectionDialog)
            usbRedirectionDialog.resizeUSBDialog();
	};
    
    // show popover message in case of mouse pointer on/off and multitouch mode on/off
    this.showMobilePopOverMessage= function(message){
        if(!mobilePopOverElement)
				{
            mobilePopOverElement = document.createElement("div");
            mobilePopOverElement.className = "mobilePopOverElement";
            var ui = GetUI().GetElement(); //Appending to CitrixXtcRoot
		    ui.appendChild(mobilePopOverElement);
            
			mobilePopOverText = document.createElement("span");
			mobilePopOverText.innerHTML = message;
            mobilePopOverText.className = "mobilePopOverText";
            mobilePopOverElement.appendChild(mobilePopOverText);
				}
		mobilePopOverText.innerHTML = message;
        mobilePopOverText.style.display = "inline-block";
        UiControls.utils.fadeIn(mobilePopOverText,{"fadeValue":"0","maxFadeValue":"1","interval":"20","totalTime":"200"});
        setTimeout(function() {
		UiControls.utils.fadeOutPop(mobilePopOverText,{"fadeValue":"1","minFadeValue":"0","interval":"50","totalTime":"500"});
		}, 2200)
    };
}