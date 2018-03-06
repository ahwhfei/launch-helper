var promiseIdentityWrapper = (function promiseIdentityWrapper() {

    function getAuthToken(interactive, resolve, reject) {
        chrome.identity.getAuthToken(interactive, function (token) {
            if (chrome.runtime.lastError) {
                //todo check error string language as there is no id for error message
                reject(chrome.runtime.lastError.message);
            } else {
                resolve(token);
            }
        });
    }

    function getAuthTokenInteractive() {
        return new Promise(function (resolve, reject) {
            getAuthToken({'interactive': true}, resolve, reject);
        });
    }

    function getAuthTokenBackground() {
        return new Promise(function (resolve, reject) {
            getAuthToken({'interactive': false}, resolve, reject);
        });
    }

    return {
        getAuthTokenInteractive: getAuthTokenInteractive,
        getAuthTokenBackground: getAuthTokenBackground
    };
})();
