var printerSettingsHandler = (function () {
    var backgroundPage;
    var savedPrinterSetting;
    chrome.runtime.getBackgroundPage(function (background) {
        backgroundPage = background;
    });

    var printerTab = document.getElementById('printerSettings');
    var openPDF = document.getElementById('openPDF');
    var googleCloudPrint = document.getElementById('googleCloudPrint');
    var doneBtn = document.getElementById('printSettingDoneButton');

    /*Assigning the language specific strings to print dialog*/
    (function () {
        /*pTags refers to an array 3 paragraph(<P>) tags of #printerSettingTabContent div element*/
        var pTags = document.querySelectorAll('#printerSettingTabContent p');
        var addGoogleCloudPrinterLink = document.querySelector('#printerSettingTabContent a');
        document.getElementById("printerSettings").labels[0].textContent = chrome.i18n.getMessage("printer");
        pTags[0].textContent = chrome.i18n.getMessage("printer_setting_description");
        openPDF.labels[0].textContent= chrome.i18n.getMessage("open_PDF_option");
        pTags[1].textContent = chrome.i18n.getMessage("open_PDF_option_description");
        googleCloudPrint.labels[0].textContent = chrome.i18n.getMessage("google_cloud_print_option");
        pTags[2].textContent = chrome.i18n.getMessage("google_cloud_print_option_description");
        addGoogleCloudPrinterLink.textContent = chrome.i18n.getMessage("add_google_cloud_printer");
        doneBtn.textContent = chrome.i18n.getMessage("done");
        pTags[3].textContent = chrome.i18n.getMessage("printing_support_warning_message");
    })();

    /*Hiding the Printer Setting tab UI for KIOSK mode or manifest.json file doesn't contain Oauth2 permission for GCP*/
    (function(){
        if(window.isKioskMode){
            removePrinterSettingTab();
            return;
        }
        var manifest=chrome.runtime.getManifest();
        if(manifest['oauth2']===undefined || manifest['oauth2']['scopes']===undefined){
            removePrinterSettingTab();
            return;
        }
        var scopes=manifest['oauth2']['scopes'];
        var i;
        for(i=0;i<scopes.length;i++){
            if(scopes[i].search('cloudprint')>0){
                return;
            }
        }
        removePrinterSettingTab();
    })();


    var printerListHandler = (function (selectElementId) {
        var printerList = document.getElementById(selectElementId);
        var defaultOption = document.createElement("option");
        var selectedOption = "";
        printerList.appendChild(defaultOption);
        defaultOption.selected = true;
        defaultOption.disabled = true;
        printerList.addEventListener('change', function (event) {
            doneBtn.disabled = false;
            selectedOption = event.target.value;
        });

        function clear() {
            selectedOption = "";
            var length = printerList.options.length;
            var i;
            for (i = length - 1; i > 0; i--) {
                printerList.options[i] = null;
            }
        }

        function add(printerArray, defaultPrinterId) {
            clear();
            var option, i;
            for (i = 0; i < printerArray.length; i++) {
                option = document.createElement("option");
                option.text = printerArray[i].displayName;
                option.value = printerArray[i].id;
                printerList.appendChild(option);
                if (printerArray[i].id === defaultPrinterId) {
                    option.selected = true;
                    selectedOption = option.value;
                }
            }
        }

        function disable() {
            defaultOption.text = chrome.i18n.getMessage("disabled_printer_option");
            clear();
            printerList.disabled = true;
        }

        function enable(printerArray, defaultPrinterId) {
            defaultOption.text = chrome.i18n.getMessage("default_printer_list_option");
            printerList.disabled = false;
			//Selecting Choose printer as the default which gets overriden if any option is selected earlier.
			printerList["options"][0]["selected"] =  true;
            if (printerArray !== undefined) {
                add(printerArray, defaultPrinterId);
            }
        }

        function getSelectedOption() {
            return selectedOption;
        }

        return {
            disable: disable,
            enable: enable,
            getSelectedOption: getSelectedOption
        };

    })('printerList');

    var openPDFRadioBtnHandler = function () {
        if (this.checked) {
            printerListHandler.disable();
            doneBtn.disabled = false;
        }
    }.bind(openPDF);

    openPDF.addEventListener('change', openPDFRadioBtnHandler);


    var gcpRadioBtnHandler = function (event) {
        if (event !== undefined) {
            getPrinterList();
        }
        if (this.checked) {
            if (savedPrinterSetting.defaultPrinterId === "") {
                doneBtn.disabled = true;
            }
            if (savedPrinterSetting.printerList !== undefined) {
                printerListHandler.enable(savedPrinterSetting.printerList, savedPrinterSetting.defaultPrinterId);
            } else {
                printerListHandler.enable([]);
            }
        }
    }.bind(googleCloudPrint);
    googleCloudPrint.addEventListener('change', gcpRadioBtnHandler);

    printerTab.addEventListener('change', function () {
        if (this.checked) {
            getPrinterSetting();
        }
    });
	
	var printerLabel=document.getElementById('printerLabel');
	printerLabel.addEventListener("keydown",function(e){ 
		if (event.which == 13) {
			printerTab.checked = true;
			getPrinterSetting();
			var acctSettingsRadioBtn = document.getElementById("AccountSettings");
			acctSettingsRadioBtn.checked = false;
		}
		e.stopPropagation();
	},false);

    doneBtn.addEventListener('click', function () {
        if (openPDF.checked) {
            setPrinterSetting({
                openPDF: true,
                defaultPrinterId: ""
            });
        } else {
            setPrinterSetting({
                openPDF: false,
                defaultPrinterId: printerListHandler.getSelectedOption()
            });
        }
        document.getElementById("settingsPageBackground").style.display = 'none';
    });

    function showPrintSettingUI() {
        if (savedPrinterSetting) {
            if (savedPrinterSetting.openPDF === true) {
                openPDF.checked = true;
                openPDFRadioBtnHandler();
            } else {
                googleCloudPrint.checked = true;
                gcpRadioBtnHandler();
            }
        }
    }

    function comparePrinterSetting(oldPrinterSetting, newPrinterSetting) {
        var oldPrinterListArr = (oldPrinterSetting.printerList === undefined) ? [] : oldPrinterSetting.printerList;
        var newPrinterListArr = (newPrinterSetting.printerList === undefined) ? [] : newPrinterSetting.printerList;
        var i = 0;
        if (oldPrinterSetting.openPDF !== newPrinterSetting.openPDF || oldPrinterSetting.defaultPrinterId !== newPrinterSetting.defaultPrinterId) {
            return false;
        }
        if (oldPrinterListArr.length === newPrinterListArr.length) {
            for (i = 0; i < oldPrinterListArr.length; i++) {
                if (oldPrinterListArr[i].id !== newPrinterListArr[i].id) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }

    function getPrinterSetting() {
        backgroundPage.chromeAppGCP.getPrinterSetting(function (latestPrinterSetting) {
            //call showPrintSettingUI function only when saved printerSetting is different from the existing printerSetting.
            if (savedPrinterSetting === undefined || !comparePrinterSetting(savedPrinterSetting, latestPrinterSetting)) {
                savedPrinterSetting = latestPrinterSetting;
                showPrintSettingUI();
            }
        });
        showPrintSettingUI();
    }

    function disableOptions() {
        openPDF.disabled = true;
        googleCloudPrint.disabled = true;
        doneBtn.disabled = true;
        printerListHandler.disable();
    }

    function enableOptions() {
        openPDF.disabled = false;
        googleCloudPrint.disabled = false;
        doneBtn.disabled = false;
        printerListHandler.enable();
    }

    function getPrinterList() {
        disableOptions();
        backgroundPage.chromeAppGCP.getPrintersFromGCP(function (errorMdg, latestPrinterSetting) {
            enableOptions();
            if (errorMdg !== undefined) {
                Notifications.showError(errorMdg);
                openPDF.checked = true;
                openPDFRadioBtnHandler();
                return;
            }
            savedPrinterSetting = latestPrinterSetting;
            gcpRadioBtnHandler();
        });
    }

    function setPrinterSetting(printerSetting) {
        savedPrinterSetting.openPDF = printerSetting.openPDF;
        savedPrinterSetting.defaultPrinterId = printerSetting.defaultPrinterId;
        backgroundPage.chromeAppGCP.setPrinterSetting(printerSetting);
    }

    function removePrinterSettingTab(){
        var printerSettingContainer=document.getElementById('printerSettingsTabContainer');
        if(printerSettingContainer!==undefined){
            printerSettingContainer.style.display='none';
        }
    }

    return {
        getPrinterSetting: getPrinterSetting,
        removePrinterSettingTab:removePrinterSettingTab
    };
})();