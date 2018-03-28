function printObject(callbackWrapper){
    var that;
    if (!window.chrome || !window.chrome.app || !window.chrome.app.window) {
        that=new HTMLPrintObject(callbackWrapper);
    }
    else {
		var isKiosk = g.environment.receiver.isKiosk;
		if(isKiosk){
			that=new KioskPrintObject(callbackWrapper);
		}else{
			that=new CRAPrintObject(callbackWrapper);
		}
    }

    that.showDownloadingPDFDialog=function() {
		CEIP.add('printing:used',true);
        callbackWrapper.showDownloadingPDFDialog();
    };

    that.hideDownloadingPDFDialog=function() {
        callbackWrapper.hideDownloadingPDFDialog();
    };
    return that;
}
function HTMLPrintObject(callbackWrapper1) {
    var callbackWrapper = callbackWrapper1;
    var printQueue=[];
    var queueIndex=0;
    var queueEmpty=true;

    this.showPrintDialog=function(blob) {
        if(queueEmpty) {
            queueEmpty=false;
            callbackWrapper.setTotalFiles((queueIndex+1)+"/"+(printQueue.length+1));
            callbackWrapper.showPrintDialog(blob);
        }
        else {
            printQueue.push(blob);
            callbackWrapper.setTotalFiles((queueIndex+1)+"/"+(printQueue.length+1));
        }
    };

    /*Function to handel print job queue.
     * After user clicks on continue/close button send the next PDF file to UI if Queue is not empty*/
    this.PDFFileCallBack = function(status) {
        if(printQueue.length===0 || printQueue.length===queueIndex) {
            queueEmpty=true;
            queueIndex=0;
            printQueue=[];
        }
        else {
            callbackWrapper.setTotalFiles((queueIndex+2)+"/"+(printQueue.length+1));
            callbackWrapper.showPrintDialog(printQueue[queueIndex]);
            printQueue[queueIndex++]=null;
        }
    };
}

function CRAPrintObject(callbackWrapper1) {
    var callbackWrapper = callbackWrapper1;

    this.showPrintDialog=function(blob) {
        callbackWrapper.openPrintWindow(blob);
    };
}

function KioskPrintObject(callbackWrapper1) {
    var callbackWrapper = callbackWrapper1;
    var printQueue=[];
    var queueIndex=0;
    var queueEmpty=true;

    this.showPrintDialog=function(blob) {
        if(queueEmpty) {
            queueEmpty=false;
            callbackWrapper.kioskModeSendPrintObject(blob);

        }
        else {
            printQueue.push(blob);
        }
    };

    /*Function to handel print job queue.
     * After user clicks on continue/close button send the next PDF file to UI if Queue is not empty*/
    this.PDFFileCallBack = function(status) {
        if(printQueue.length===0 || printQueue.length===queueIndex) {
            queueEmpty=true;
            queueIndex=0;
            printQueue=[];
        }
        else {
            callbackWrapper.kioskModeSendPrintObject(printQueue[queueIndex]);
            printQueue[queueIndex++]=null;
        }
    };

}