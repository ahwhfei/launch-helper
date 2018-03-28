var promiseGCPWrapper = (function () {

    function getPrinterList(authId) {
        return new Promise(function (reslove, reject) {
            googleCloudPrintAPI.getPrinterList(authId, reslove, reject);
        });
    }

    function printFile(authId, printId, title, blob, contentType) {
        return new Promise(function (reslove, reject) {
            googleCloudPrintAPI.printFile(authId, printId, title, blob, contentType, reslove, reject);
        });
    }

    return {
        getPrinterList: getPrinterList,
        printFile: printFile
    };
})();