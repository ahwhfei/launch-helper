var googleCloudPrintAPI = (function googleCloudPrintAPI() {
    /*[status-code:status-message] act as name value pair for handling HTTP related errors*/
    var httpErrorMessages = {};
    httpErrorMessages[403] = chrome.i18n.getMessage("http_error_code_403");//authentication error.
    httpErrorMessages[404] = chrome.i18n.getMessage("http_error_code_404");//page not found error
    httpErrorMessages[413] = chrome.i18n.getMessage("http_error_code_413");//HTTP request size is larger than the server accepts
    httpErrorMessages['default'] = chrome.i18n.getMessage("GCP_error_code_default");//default message for other error codes.

    function handelHttpErrorCase(status, reject) {

        if (httpErrorMessages.hasOwnProperty(status)) {
            reject(httpErrorMessages[status]);
        }

        //todo log the status of the message.
        reject(httpErrorMessages['default']);
    }

    /*[errorCode:message]  act as name value pair for handling GCP related errors.*/
    var GCPErrorMessage = {};
    GCPErrorMessage[111] = chrome.i18n.getMessage("GCP_error_code_111");
    GCPErrorMessage[403] = chrome.i18n.getMessage("GCP_error_code_403");
    GCPErrorMessage['default'] = chrome.i18n.getMessage("GCP_error_code_default");

    function handelGCPError(response, reject) {
        if (GCPErrorMessage[response['errorCode']]) {
            reject(GCPErrorMessage[response['errorCode']]);
        }
        reject(GCPErrorMessage['default']);
    }

    var xsrfTokenHandler = (function () {
        /*xsrf_token is sent by GCP for every response,
         * When submitting the print job to GCP we need to send the latest xsrf_token.
         * */
        var xsrf_token;

        function readXsrfTokenFromResponse(response) {
            if (response['xsrf_token']) {
                xsrf_token = response['xsrf_token'];
            }
        }

        function getLatestXsrfToken() {
            return xsrf_token;
        }

        return {
            readXsrfTokenFromResponse: readXsrfTokenFromResponse,
            getLatestXsrfToken: getLatestXsrfToken
        };
    })();

    function handelJsonResponse(jsonRresponse, reject) {
        var response;
        try {
            response = JSON.parse(jsonRresponse);
        } catch (e) {
            reject(chrome.i18n.getMessage("GCP_error_code_default"));
        }
        xsrfTokenHandler.readXsrfTokenFromResponse(response);
        return response;
    }

    var getPrinterList = (function () {
        var count = 0;
        /*responseHandler functions should be called with .call() or .apply() function.
         * 'this' should reference to response object from XHR*/
        var responseHandler = {};
        responseHandler[200] = function (oAuthId, resolve, reject) {
            count = 0;
            var response = handelJsonResponse(this.response, reject);
            if (response['success'] === true) {
                if (response['printers'].length <= 0) {
                    reject(chrome.i18n.getMessage("GCP_no_printer_error"));
                }
                resolve(printerListHandler(response['printers']));
            } else {
                console.log(this.response);
                handelGCPError(response, reject);
            }
        };

        responseHandler[500] = function (oAuthId, resolve, reject) {
            if (count < 3) {
                setTimeout(function () {
                    count++;
                    console.log('retrying for ' + count + ' times, as the response is 500');
                    getPrinterListWithRetry(oAuthId, resolve, reject);
                }, 500);
            } else {
                count = 0;
                handelHttpErrorCase(this.status, reject);
                console.log('rejecting as max number of retries reached');
            }
        };

        responseHandler['default'] = function (resolve, reject) {
            handelHttpErrorCase(this.status, reject);
        };

        function getPrinterListWithRetry(oAuthId, resolve, reject) {
            var xhr = new XMLHttpRequest();
            var form = new FormData();
            //todo need to check weather printers which are offline(DORMANT) for long time needs to be dispalyed
            form.append('connection_status', 'ALL');
            xhr.onload = function (res) {
                if (responseHandler[this.status]) {
                    responseHandler[this.status].call(this, oAuthId, resolve, reject);
                } else {
                    responseHandler['default'].call(this, resolve, reject);
                }
            };
            xhr.open('POST', 'https://www.google.com/cloudprint/search');
            xhr.setRequestHeader('Authorization', 'OAuth ' + oAuthId);
            xhr.send(form);
        }

        return getPrinterListWithRetry;
    })();

    function printFile(oAuthId, printId, title, blob, contentType, resolve, reject) {
        var xhr = new XMLHttpRequest();
        var form = new FormData();
        var xsrf_token = xsrfTokenHandler.getLatestXsrfToken();
        form.append('printerid', printId);
        form.append('title', title);
        form.append('ticket', JSON.stringify({
            "version": "1.0",
            "print": {}
        }));
        form.append('content', blob);
        form.append('contentType', contentType);
        if (xsrf_token) {
            form.append('xsrf_token', xsrf_token);
        }
        xhr.onload = function (res) {
            var response;
            if (this.status === 200) {
                response = handelJsonResponse(this.response, reject);
                if (response['success'] === true) {
                    resolve();
                } else {
                    console.log(this.response);
                    handelGCPError(response, reject);
                }
            }
            else {
                handelHttpErrorCase(this.status, reject);
            }
        };

        xhr.addEventListener("progress", function (event) {
            console.log('progress', this.status, event);
            if (this.status === 413) {
                handelHttpErrorCase(this.status, reject);
            }
        }, false);

        xhr.open('POST', 'https://www.google.com/cloudprint/submit');
        xhr.setRequestHeader('Authorization', 'OAuth ' + oAuthId);
        xhr.send(form);
    }

    var printerListHandler = function (printerListResponse) {
        var printHashTable = {};
        var printerList = [];
        var i;
        for (i = 0; i < printerListResponse.length; i++) {
            printerList[i] = {
                displayName: printerListResponse[i]['displayName'],
                name: printerListResponse[i]['name'],
                id: printerListResponse[i]['id'],
                connectionStatus: printerListResponse[i]['connectionStatus']
            };
            printHashTable[printerListResponse[i]['id']] = printerList[i];
        }

        function getPrinterObjById(id) {
            return printHashTable[id];
        }

        function getAllPrinter() {
            return printerList;
        }

        return {
            getAllPrinter: getAllPrinter,
            getPrinterObjById: getPrinterObjById
        };
    };

    return {
        getPrinterList: getPrinterList,
        printFile: printFile
    };
})();
