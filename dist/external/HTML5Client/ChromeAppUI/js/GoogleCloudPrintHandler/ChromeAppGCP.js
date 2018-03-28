var chromeAppGCP = (function () {
    var defaultPrinterSetting = {
        "printerSetting": {
            "openPDF": true,
            "defaultPrinterId": ""
        }
    };

    var printerSettingData = (function () {
        var printerList;
        var savedPrinterSetting;

        function getPrinterSettingAndPrinterList() {
            var printerListArr = (printerList === undefined) ? undefined : printerList.getAllPrinter();
            return (savedPrinterSetting === undefined) ? undefined : {
                openPDF: savedPrinterSetting['openPDF'],
                defaultPrinterId: savedPrinterSetting['defaultPrinterId'],
                printerList: printerListArr
            };
        }

        function setPrinterSetting(printerSetting) {
            savedPrinterSetting = printerSetting['printerSetting'];
        }

        function setPrinterList(list) {
            if (list === undefined || list.getPrinterObjById(savedPrinterSetting['defaultPrinterId']) === undefined) {
                savedPrinterSetting['openPDF'] = true;
                savedPrinterSetting['defaultPrinterId'] = "";
            }
            printerList = list;
        }

        function getPrinterList() {
            return printerList;
        }

        function setDefaultPrinterId(printerId) {
            /*check if printerId exist in printerList*/
            if (printerList !== undefined && printerList.getPrinterObjById(printerId) !== undefined) {
                savedPrinterSetting['defaultPrinterId'] = printerId;
            } else {
                savedPrinterSetting['defaultPrinterId'] = "";
                savedPrinterSetting['openPDF'] = true;
            }
        }

        function setOpenPDFOption(value) {
            savedPrinterSetting['openPDF'] = value;
        }

        return {
            getPrinterSettingAndPrinterList: getPrinterSettingAndPrinterList,
            setPrinterSetting: setPrinterSetting,
            setPrinterList: setPrinterList,
            getPrinterList: getPrinterList,
            setDefaultPrinterId: setDefaultPrinterId,
            setOpenPDFOption: setOpenPDFOption
        };
    })();

    function storePrinterSetting(printerSetting) {
        if (printerSetting === undefined) {
            printerSetting = defaultPrinterSetting;
        }
        promiseLocalStorageWrapper.setItem(printerSetting)
            .then(function () {
                console.log('saved the setting to local storage');
            })
            .catch(function (val) {
                console.log('failed to store the setting to local storage  ', val);
            });
    }

    var getPrinterSetting = (function () {
        var requestPending = false;
        var printerSettingChangeCallback;

        function loadPrinterSetting() {
            var savedPrinterSetting = printerSettingData.getPrinterSettingAndPrinterList();
            if (savedPrinterSetting !== undefined) {
                return Promise.resolve();
            } else {
                return promiseLocalStorageWrapper.getItem('printerSetting')
                    .then(function (printSetting) {
                        console.log('setting the data from local storage');
                        printerSettingData.setPrinterSetting(printSetting);
                    })
                    .catch(function () {
                        storePrinterSetting();
                        printerSettingData.setPrinterSetting(defaultPrinterSetting);
                    });
            }
        }

        function getSetting() {
            loadPrinterSetting()
                .then(function () {
                    return promiseIdentityWrapper.getAuthTokenBackground();
                })
                .then(function (authid) {
                    return promiseGCPWrapper.getPrinterList(authid);
                })
                //todo test the then execution of all path
                .then(function (list) {
                    printerSettingData.setPrinterList(list);
                })
                .catch(function (val) {
                    /*restoring the setting to default printer setting as error caused during */
                    printerSettingData.setPrinterList();
                    printerSettingData.setPrinterSetting(defaultPrinterSetting);
                })
                .then(function () {
                    printerSettingChangeCallback(printerSettingData.getPrinterSettingAndPrinterList());
                    requestPending = false;
                });
        }

        return function (callback) {
            if (requestPending === false) {
                if (typeof callback === "function") {
                    printerSettingChangeCallback = callback;
                    getSetting();
                    requestPending = true;
                }
            }
        };
    })();

    function getPrintersFromGCP(callback) {
        console.log(printerSettingData.getPrinterSettingAndPrinterList());
        promiseIdentityWrapper.getAuthTokenInteractive()
            .then(function (authid) {
                return promiseGCPWrapper.getPrinterList(authid);
            })
            .then(function (list) {
                printerSettingData.setPrinterList(list);
                return undefined;
            })
            .catch(function (errorMsg) {
                printerSettingData.setPrinterList();
                printerSettingData.setPrinterSetting(defaultPrinterSetting);
                return errorMsg;
            })
            .then(function (message) {
                callback(message, printerSettingData.getPrinterSettingAndPrinterList());
            });
    }

    function setPrinterSetting(printerSetting) {
        printerSettingData.setOpenPDFOption(printerSetting.openPDF);
        printerSettingData.setDefaultPrinterId(printerSetting.defaultPrinterId);
        storePrinterSetting({
            'printerSetting': {
                'openPDF': printerSetting.openPDF,
                'defaultPrinterId': printerSetting.defaultPrinterId
            }
        });
    }

    var printFile = (function googleCloudPrintQueue() {

        var printerSetting;
        var printQueue = {
            _queue: [],
            _printerBusy: false,
            get printerBusy() {
                return this._printerBusy;
            },
            set printerBusy(value) {
                //if queue is not empty print the first file in the queue to GCP
                if (value === false && !this.isEmpty()) {
                    console.log('Removing the printJob from queue and print the file to GCP');
                    printFile();
                } else {
                    this._printerBusy = value;
                }
            }
        };

        printQueue.addPrintJob = function (printJob) {
            this._queue.push(printJob);
        };

        printQueue.getPrintJob = function () {
            return this._queue.shift();
        };

        printQueue.isEmpty = function () {
            return this._queue.length === 0;
        };

        function openPDFInChromeAppWindow(printJob) {
            chrome.app.window.create('../../src/Print.html', {
                'minWidth': 800,
                'minHeight': 600,
                'state': 'maximized'
            }, function (createdWindow) {
                createdWindow.contentWindow.printInfo = printJob;
                printQueue.printerBusy = false;
            });
        }

        function showOneTimeDialog(){
            /*If local storage doesn't contain 'printerSetting' key notification is shown to the user.*/
            promiseLocalStorageWrapper.getItem('printerSetting')
                .catch(function(){
                    var manifest=chrome.runtime.getManifest();
                    if(manifest['oauth2']===undefined || manifest['oauth2']['scopes']===undefined){
                        return;
                    }
                    var scopes=manifest['oauth2']['scopes'];
                    var i;
                    for(i=0;i<scopes.length;i++){
                        if(scopes[i].search('cloudprint')>0){
                            /*showing the notification only if manifest.json has permission to access GCP*/
                            Notifications.showInformation(chrome.i18n.getMessage("one_time_printer_setup_message"));
                        }
                    }
                });
        }

        function printFile() {
            printerSetting = printerSettingData.getPrinterSettingAndPrinterList();
            if (printerSetting === undefined) {
                /*if printerSetting is not loaded in memory so loading the printerSetting*/
                showOneTimeDialog();
                getPrinterSetting(printFile);
                return;
            }
            var printJob = printQueue.getPrintJob();
            if (printerSetting.openPDF === true) {
                openPDFInChromeAppWindow(printJob);
            } else {
                printFileToGCP(printJob);
            }
        }


        function printFileToGCP(printJob) {
            promiseIdentityWrapper.getAuthTokenBackground()
                .then(function (authid) {
                    console.log('authid is', authid);
                    return promiseGCPWrapper.printFile(authid, printerSetting.defaultPrinterId, printJob['title'], printJob['bloburl'], printJob['bloburl']['type']);
                })
                .then(function () {
                    var printerName=printerSettingData.getPrinterList().getPrinterObjById(printerSetting.defaultPrinterId).displayName;
                    return {
                        success: true,
                        text: chrome.i18n.getMessage("printed_file_to_GCP",[printJob['title'],printerName])
                    };
                })
                .catch(function (errorMsg) {
                    return {
                        success: false,
                        text: errorMsg
                    };
                })
                .then(function (message) {
                    printJob = null;
                    showNotification(message);
                    printQueue.printerBusy = false;
                });
        }

        return function (printJob) {
            printQueue.addPrintJob(printJob);
            if (!printQueue.printerBusy) {
                console.log('printing the file as queue is empty');
                printFile();
                printQueue.printerBusy = true;
            } else {
                var message = {
                    success: true,
                    text: chrome.i18n.getMessage("add_print_job_to_queue",[printJob['title'],printJob['sessionName']])
                };
                showNotification(message);
            }
        };
    })();

    function showNotification(message) {
        if (message.success) {
            Notifications.showInformation(message.text, undefined, function (notificationId) {
                setTimeout(function () {
                    chrome.notifications.clear(notificationId);
                }, 3000);
            });
        } else {
            Notifications.showError(message.text);
        }
    }

    return {
        getPrinterSetting: getPrinterSetting,
        getPrintersFromGCP: getPrintersFromGCP,
        setPrinterSetting: setPrinterSetting,
        printFile: printFile
    };
})();