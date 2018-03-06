var promiseLocalStorageWrapper = (function () {

    function getItem(key) {
        return new Promise(function (resolve, reject) {
            chrome.storage.local.get(key, function (item) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                } else {
                    if (item[key]) {
                        resolve(item);
                    } else {
                        reject(key + " not set");
                    }
                }
            });
        });
    }

    function setItem(item) {
        return new Promise(function (resolve, reject) {
            chrome.storage.local.set(item, function () {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                } else {
                    resolve();
                }
            });
        });
    }

    function removeItem(key) {
        return new Promise(function (reslove, reject) {
            chrome.storage.local.remove(key, function () {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                } else {
                    reslove();
                }
            });
        });
    }

    return {
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem
    };
})();