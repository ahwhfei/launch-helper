var UiControls;
(function(UiControls){
    /*Clipboard dialog module*/
    var clipboardDialog = (function(){
      var callBackWrapper;
      var xtcRoot;
      var clipboard;
      var clipContentArea;
      var toastMsg;
      var updateBtn;
      var clipboardHelpTextEle;
	  var localClip; 
      var textData;
	  var emptyPasteMessage;
	  
	  //Constructs the dialog
      function create(callbackWrapper1){
        callBackWrapper = callbackWrapper1;
        clipboard = document.createElement("div");
		clipboard.id = "clipboardDialog";
        clipboard.className = "clipboardDialog borderClass";
		
		var clipHelpBtn = document.createElement("button");
        clipHelpBtn.className = "clipboardHelpBtn";        
		clipHelpBtn.innerHTML = "?";        
		clipboard.appendChild(clipHelpBtn);
		
		xtcRoot = document.getElementById("CitrixXtcRoot");
        if(xtcRoot){
            xtcRoot.appendChild(clipboard);
        }	

		var closeButton = document.createElement("span");
		clipboard.appendChild(closeButton);
		closeButton.className = "closeBtn";
		closeButton.addEventListener("click",hide);         	
		
		//Help text based on mac/windows
        var isMac = /mac/i.test(navigator.userAgent);
        var clipboardHelpText;
		var copyCmd = HTML5Engine.i18n.getMessage("ctrl+c");
		var pasteCmd = HTML5Engine.i18n.getMessage("ctrl+v");
		
        if(isMac){
			copyCmd = HTML5Engine.i18n.getMessage("cmd+c");
			pasteCmd = HTML5Engine.i18n.getMessage("cmd+v");
        }
			
        clipboardHelpText = HTML5Engine.i18n.getMessage("copy-desc",{"copyCmd" : copyCmd}) + "<br>" + HTML5Engine.i18n.getMessage("paste-desc",{"pasteCmd" : pasteCmd}) + "<br>" + HTML5Engine.i18n.getMessage("editClipUsingUpdateBtn");
		emptyPasteMessage = HTML5Engine.i18n.getMessage("paste-message-empty",{"copyCmd" : copyCmd,"pasteCmd":pasteCmd});
		       
        var clipboardTitle = document.createElement("div"); 								
		clipboardTitle.className = "clipboardTitle";
        
		var showClipHelpText = false;
        
		clipboardTitle.innerHTML = HTML5Engine.i18n.getMessage("clipboard");        
		clipboard.appendChild(clipboardTitle);
        
        clipboardHelpTextEle = document.createElement("div");
        clipboardHelpTextEle.className = "clipboardHelpText";
        clipboardHelpTextEle.innerHTML = clipboardHelpText;
        clipboard.appendChild(clipboardHelpTextEle);
         
		//Adds message for touch os
        if(g.environment.os.isTouch){
			clipboardHelpTextEle.innerHTML += "<br/>";
			var touchOSMsg = document.createElement("span");
			touchOSMsg.innerText = HTML5Engine.i18n.getMessage("touchOSClipboardMsg");
			touchOSMsg.className = "touchOSClipboardMsg";
			clipboardHelpTextEle.appendChild(touchOSMsg);
        }
        
        function showHideHelpText(e) {
			showClipHelpText = !showClipHelpText;			
            if (showClipHelpText) {
                clipboardHelpTextEle.style.display = "block";
            }else{
                clipboardHelpTextEle.style.display = "none";
            }
		}
        
		clipHelpBtn.addEventListener("click",showHideHelpText);				      
        		
		clipContentArea = document.createElement('textarea');
		clipContentArea.id = "clipboardContentArea";
        clipContentArea.className = "clipboardContentArea";
	    clipboard.appendChild(clipContentArea);
		       
		
		updateBtn = document.createElement("button");
		updateBtn.innerHTML = HTML5Engine.i18n.getMessage("update");		
        updateBtn.className = "clipboardUpdateBtn";
        updateBtn.disabled = true;
        
		clipboard.appendChild(updateBtn);
		
		updateBtn.addEventListener("click",function(){
			var clipFormatData = {};
			clipFormatData["text/plain"] = clipContentArea.value;
			SetServerSideClipData(clipFormatData);
			updateBtn.disabled = true;
			clipContentArea.focus();
		});			
				
		clipContentArea.addEventListener('paste', HandlePasteEvent, false);
		clipContentArea.addEventListener('copy', HandleCopyEvent, false);
		clipContentArea.addEventListener('cut', HandleCopyEvent, false);
		
		clipContentArea.addEventListener('contextmenu', function(e) {
			e.stopPropagation();
			e.cancelBubble = true;
		}, false);
		
		clipContentArea.addEventListener("keydown",function(e){
			e.stopPropagation();
			e.cancelBubble = true;
        },false);
		
		clipContentArea.addEventListener("keyup",function(e){       
			enableDisableUpdateBtn();					
			e.stopPropagation();
			e.cancelBubble = true;
        },false);
		clipContentArea.addEventListener("keypress",function(e){       
			e.stopPropagation();
			e.cancelBubble = true;
        },false);       
        
        var mousediv=document.getElementById('MousePointerDiv');
        if(mousediv)
        {
            /*An event is attached to the element 'MousePointerDiv' to hide the clipboard dialog when it looses the focus.*/
            mousediv.addEventListener('click',function mouseClickOutsideClipboard(event){
                hide();               
            });
			if(g.environment.os.isTouch){
				mousediv.addEventListener('touchend',function mouseClickOutsideClipboard(event){
					clipContentArea.blur();
					hide();               
				});
			}
        }
		function hideHelpTooltip(e){
			if(e.target.id === "clipboardDialog" || e.target.id === "clipboardContentArea"){
				showClipHelpText = true;
				showHideHelpText();
				clipContentArea.focus();
			}
		}
		clipboard.addEventListener("click",hideHelpTooltip);	
      }              
        
		function enableDisableUpdateBtn(){
			if(clipContentArea.value !== textData && clipContentArea.value!== ""){
                updateBtn.disabled = false;
            }else{
				updateBtn.disabled = true;
			}
		}
        function SetServerSideClipData(formatData) {  
			textData = formatData["text/plain"];
			if (textData === '\0' || textData === "" || textData == null) {
			     clipContentArea.placeholder = emptyPasteMessage;
				 clipContentArea.value = "";
            }
            else
            {
                if(textData.length>1024){
                    textData=textData.substring(0,1024)+"...";
                }
                clipContentArea.value = textData;
	            callBackWrapper.changeServerClipboard(formatData);
	            showToastMsg(HTML5Engine.i18n.getMessage("toastMsgPaste"));           
            }
        }
        
        //Copy from server
        function SetClientSideClipData(showMsg) {
            localClip = callBackWrapper.copyToLocalClipBoard();
            textData = localClip["text/plain"];
                       
            if (textData === '\0' || textData === "" || textData == null) {
			     clipContentArea.placeholder =HTML5Engine.i18n.getMessage('copy-message-empty',{"copyCmd" :HTML5Engine.i18n.getMessage("ctrl+c")});
				 clipContentArea.value = "";
            }
            else{
                if(textData.length>1024){
                    textData=textData.substring(0,1024)+"...";
                }
                clipContentArea.value = textData;
                
				//To show message only on copy action.
				if(showMsg){               
					showToastMsg(HTML5Engine.i18n.getMessage("toastMsgCopy"));
				}
            }                                                    		
        }

        function HandlePasteEvent(evt) {            
			var clipData =(!window.clipboardData) ? evt.clipboardData : window.clipboardData;
			var clipTextData, clipHTMLData, clipFormatData = {};
			try {
				clipHTMLData = clipData.getData('text/html'); // try html first if it throws fallback to text.
				clipTextData = clipData.getData('text/plain');
			} catch (e) {
				clipTextData = clipData.getData('text'); // fallback to using old method for older IE versions.
			}
			clipFormatData["text/plain"] = clipTextData;
			
			if (clipHTMLData && clipHTMLData != "") {
				// remove extra chars, script tags etc, see santizeHtml function comments to know more.
				clipHTMLData = ClipFormatConverter.sanitizeHtml(clipHTMLData);
				clipFormatData["text/html"] = clipHTMLData;
			}
			SetServerSideClipData(clipFormatData);				

			evt.preventDefault();
			clipContentArea.value = clipTextData;            
        }

        function HandleCopyEvent(evt) {
			var clipData = (!window.clipboardData) ? evt.clipboardData : window.clipboardData;
			localClip = callBackWrapper.copyToLocalClipBoard();
			textData = localClip["text/plain"];
			if(!textData) { textData = ""; }
			var htmlData = localClip["text/html"];

			try {
				// try html first, if it throws fallback to text
				if (htmlData && htmlData != "") { clipData.setData('text/html', htmlData); }
				clipData.setData('text/plain', textData);
			} catch (e) {
				clipData.setData('text', textData); // fallback to using old method for older IE versions.
			}
			/*In case of IPAD, clipboard.setData is not effective. So, we should not call evt.preventDefault().
			Calling SetClientSideClipData within setTimeout is required to make sure copy works in iOS safari browsers.					
			*/
			setTimeout(function(){SetClientSideClipData(true)},10);
			
			if(!g.environment.os.isIOS){
				evt.preventDefault();
			}
        }
            
        function show(){
			CEIP.incrementCounter("toolbar:buttons:clipboard");
			
            clipboardDialogShown = true;            
            SetClientSideClipData(false);
			clipboard.style.display = "block";
			
			//Disable the update button by default on showing the dialog.
			updateBtn.disabled = true;
			
            clipContentArea.focus();
			//Select should be called after the element is shown otherwise it will throw error in IE
			clipContentArea.select();			
        }
        
        function hide(){
            clipboardDialogShown = false;
            clipboard.style.display = "none";
			clipboardHelpTextEle.style.display = "none";
            showClipHelpText = false;	
        }
    
        function showToastMsg(text){
            if(!toastMsg){
                toastMsg = document.createElement("span");
                clipboard.appendChild(toastMsg);
                toastMsg.className = "popover";
            }
            toastMsg.innerHTML = text;
            toastMsg.style.display = 'block';
			clipContentArea.blur();
            UiControls.utils.fadeIn(toastMsg,{"fadeValue":"0","maxFadeValue":"1","interval":"20","totalTime":"200"});
            setTimeout(function() {
                UiControls.utils.fadeOutPop(toastMsg,{"fadeValue":"1","minFadeValue":"0","interval":"50","totalTime":"500"});
				clipContentArea.focus();
            }, 2200);
        }
        
        function OnClipboardChange(){            
            if(clipContentArea){
                clipContentArea.value = (HTML5Engine.i18n.getMessage('clipboard-message'));
            }
        }
        
      return {
          create : create,
          show : show,
          hide : hide,
          OnClipboardChange : OnClipboardChange
      }; 
    })();
    UiControls.clipboardDialog = clipboardDialog;
})(UiControls||(UiControls={}));