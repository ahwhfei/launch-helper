(function generatePrintFrame() {
    var pageUrl = self.location.href;
    var printPage = /Print.html/i;
    var found = pageUrl.search(printPage);
    var isKiosk = false;
    if ((typeof window !== "undefined"))
        isKiosk = window.isKioskMode || false;
    var pdfElement;
    var url;
    var urlHandler;
    if (((found >= 0) || isKiosk) && (typeof window !== "undefined")) {

        //if the blob is not of type 'application/pdf' blob is not loaded into iframe.
        if (isKiosk === false && (window.printInfo!== undefined && window.printInfo['bloburl'] === undefined || window.printInfo['bloburl'].type !== 'application/pdf')) {
            return;
        }

        urlHandler = (function () {
            var windowURL = (window.URL || window.webkitURL);

            function getUrl() {
                return windowURL.createObjectURL(window.printInfo['bloburl']);
            }

            function revokeUrl(url) {
                windowURL.revokeObjectURL(url);
                if (window.printInfo) {
                    window.printInfo['bloburl'] = null;
                    window.printInfo = null;
                }
            }

            return {
                getUrl: getUrl,
                revokeUrl: revokeUrl
            }
        })();

        function permissionRequestListner(event) {
            if (event.permission === 'loadplugin') {
                event.request.allow();
            }
        }

        function loadStopListner(event) {
            this.executeScript({code: "window.print();"});
        }

        //for browsers other than internet explorer IFRAME element is created and PDF file is loaded in IFRAME using bloburl
        if (!window.chrome || !window.chrome.app || !window.chrome.app.window) {
            document.title = window.printInfo['title'];
            var onLoadFunction = function () {
                url = urlHandler.getUrl();
                if (window.printInfo && window.printInfo['bloburl']) {
                    var iFrame;
                    iFrame = document.createElement("IFRAME");
                    iFrame.id = "print";
                    var isFirefox = typeof InstallTrigger !== 'undefined';
                    if (isFirefox) {
                        iFrame.sandbox = "allow-scripts";
                    }
                    iFrame.setAttribute("src", url);
                    iFrame.style.width = "100%";
                    iFrame.style.height = "100%";
                    document.body.appendChild(iFrame);
                }
            };
            var onUnloadFunction = function () {
                if (url !== null) {
                    urlHandler.revokeUrl(url);
                }
            };
            window.addEventListener('load', onLoadFunction, false);
            window.addEventListener('unload', onUnloadFunction, false);
        } else if (isKiosk && !window["appViewMode"]) {
            /*For kiosk mode webview element and close button will be created in  main.js using templates.
            * data-print-url custom attribute set in main.js to div element contains URL to be loaded into webview.
            * When user clicks on close button div element (id='KioskPDF') containing webview and close button will be removed*/
            var divContainer = document.getElementById('KioskPDF');
            url = divContainer.getAttribute('data-print-url');
            pdfElement = document.getElementById('webviewPrint');
            pdfElement.setAttribute("src", url);
            pdfElement.addEventListener('loadstop', loadStopListner.bind(pdfElement));
            pdfElement.addEventListener('permissionrequest', permissionRequestListner);
            var closePDFBtn = document.getElementById('closePDFBtn');
            closePDFBtn.addEventListener("click", function () {
                urlHandler.revokeUrl(url);
                divContainer.remove();
                var sessionWindow = document.getElementById('sessionwindow');
                if (sessionWindow) {                   
                    sessionWindow.contentWindow.postMessage({"cmd": "PRINTDONE"},self.location.origin);
                }

            });
        }
        else {
            //for chrome app  webview element created inside the html file and PDF file is loaded in webview using bloburl
            document.addEventListener('DOMContentLoaded', function () {
                document.title = window.printInfo['title'];
                if (window.printInfo && window.printInfo['bloburl']) {
                    url = urlHandler.getUrl();
                    pdfElement = window.document.createElement("webview");
                    pdfElement.id = "PDFPrint";
                    pdfElement["partition"] = "Printing";
                    pdfElement.style.width = "100%";
                    pdfElement.style.height = "100%";
                    pdfElement.setAttribute("src", url);
                    window.document.body.appendChild(pdfElement);
                    pdfElement.addEventListener("loadstop", loadStopListner.bind(pdfElement));
                    pdfElement.addEventListener('permissionrequest', permissionRequestListner);
                    chrome.app.window.current().onClosed.addListener(function () {
                        if (url !== null) {
                            urlHandler.revokeUrl(url);
                        }
                    });
                }
            });
        }
    }
})();