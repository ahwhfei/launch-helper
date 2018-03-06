var UiControls;
(function(UiControls) {
    var MobileAppSwitcher = (function() {

        var mobileAppSwitcherElement;
        var mobileAppSwitcherOverlayElement;

        var currentlyFocusedMobileItem;

        var mobileEntryStringId = "mobile_entry";
        var mobileEntryIconStringId = "mobile_icon";
        var mobileEntryRadioStringId = "mobile_radio";
        var mobileEntryTitleStringId = "mobile_title";

        var SwitcherEntriesSnapshot;

        var appSwitcher;

        var showTaskbar;
        var showTaskbarCb;

        function MobileAppSwitcher(parent) {
            if (parent) {
                appSwitcher = parent;
            }
            if (appSwitcher && appSwitcher.SwitcherEntriesSnapshot) {
                SwitcherEntriesSnapshot = appSwitcher.SwitcherEntriesSnapshot;
            }
            addMobileAppSwitcherToCitrixParentDiv();
        }

        var updatePreferences = function() {
            if (appSwitcher) {
                var storedValue = appSwitcher.GetPreferences();
                showTaskbar = storedValue['showTaskbar'];
                if (showTaskbar) {
                    showTaskbarCb.checked = true;
                    appSwitcher.ShowDesktopAppSwitcher();
                } else {
                    showTaskbarCb.checked = false;
                    appSwitcher.HideDesktopAppSwitcher();
                }
            }
        };

        MobileAppSwitcher.prototype.addEntry = function(appId) {
            for (var elem in SwitcherEntriesSnapshot) {
                var curElem = SwitcherEntriesSnapshot[elem].entries[appId];
                addElementToMobileAppSwitcher(mobileAppSwitcherElement, appId, curElem);
            }
        };

        MobileAppSwitcher.prototype.removeEntry = function(appId) {
            var elementId = mobileEntryStringId + appId;
            var elem = document.getElementById(elementId);
            mobileAppSwitcherElement.removeChild(elem);
        };

        MobileAppSwitcher.prototype.showOverlay = function() {
            mobileAppSwitcherOverlayElement.style.display = "block";
        };

        MobileAppSwitcher.prototype.changeFocus = function(appId) {
            if (currentlyFocusedMobileItem != null || currentlyFocusedMobileItem != undefined) {
                var className = currentlyFocusedMobileItem.className;
                className = className.replace(" mobileAppSwitcherEntryChecked", "");
                currentlyFocusedMobileItem.className = className;
            }
            currentlyFocusedMobileItem = document.getElementById(mobileEntryStringId + appId);
            currentlyFocusedMobileItem.className += " mobileAppSwitcherEntryChecked";
        };

        MobileAppSwitcher.prototype.updateIcon = function(appId, iconData) {
            var iconElem = document.getElementById(mobileEntryIconStringId + appId);
            if (iconElem) {
                var urlData = "url('" + iconData + "')";
                iconElem.style.backgroundImage = urlData;
            }
        };

        MobileAppSwitcher.prototype.initialize = function() {
            updatePreferences();
        };

        MobileAppSwitcher.prototype.updateTitle = function(appId, title) {
            var titleElem = document.getElementById(mobileEntryTitleStringId + appId);
            if (titleElem) {
                if (title && title[title.length - 1] == '\0') {
                    title = title.slice(0, title.length - 1);
                }
                titleElem.textContent = title;
            }
        };

        var addElementToMobileAppSwitcher = function(parent, id, curElem) {
            var div = document.createElement('div');
            div.setAttribute('class', 'mobileAppSwitcherEntry');
            div.id = mobileEntryStringId + id;
            parent.appendChild(div);

            createMobileAppSwitcherRadioElement(div, id);
            addMobileAppSwitcherIconDiv(div, curElem.iconLink, id);
            addMobileAppSwitcherNameDiv(div, curElem.windowName, id);
        };

        var createMobileAppSwitcherRadioElement = function(parent, id) {
            var radio = document.createElement('input');
            radio.setAttribute('type', 'radio');
            radio.id = mobileEntryRadioStringId + id;
            radio.setAttribute('class', 'appSwitcherRadio');
            radio.setAttribute('name', 'MobileAppSwitcherRadioGroup');
            parent.appendChild(radio);
            parent.addEventListener('click', MobileAppSwitcherEntryClickHandler.bind(null, parent, radio));
            parent.addEventListener('contextmenu', mobileAppSwitcherContextMenuHandler, false);
        };

        var addMobileAppSwitcherIconDiv = function(parent, iconData, id) {
            var div = document.createElement('div');
            div.setAttribute('class', 'mobileAppSwitcherIcon');
            div.id = mobileEntryIconStringId + id;
            var urlData = "url('" + iconData + "')";
            div.style.backgroundImage = urlData;
            parent.appendChild(div);
        };

        var addMobileAppSwitcherNameDiv = function(parent, name, id) {
            var div = document.createElement('div');
            div.setAttribute('class', 'mobileAppSwitcherName');
            div.id = mobileEntryTitleStringId + id;
            if (name && name[name.length - 1] == '\0') {
                name = name.slice(0, name.length - 1);
            }
            div.textContent = name;
            parent.appendChild(div);
        };

        var MobileAppSwitcherEntryClickHandler = function(parent, radioElement, event) {
            event.stopPropagation();
            if (radioElement) {
                radioElement.checked = true;
                parent.className += " mobileAppSwitcherEntryChecked";
            }
            if (currentlyFocusedMobileItem == null) {
                currentlyFocusedMobileItem = parent;
            } else {
                var className = currentlyFocusedMobileItem.className;
                className = className.replace(" mobileAppSwitcherEntryChecked", "");
                currentlyFocusedMobileItem.className = className;
                currentlyFocusedMobileItem = parent;
            }
            var id = currentlyFocusedMobileItem.id;
            id = id.split(mobileEntryStringId);
            var appIdInFocus = id[1];
            var slMessage = new SeamlessUI.Message();
            //slMessage.sessionId = focusAppId;
            slMessage.appId = appIdInFocus;
            slMessage.cmd = 'update';
            slMessage.focus = true;
            if (appSwitcher) {
                appSwitcher.Dispatch(slMessage.message);
            }
            hideMobileAppSwitcherOverlayElement();
            HTML5Interface.setKeyboardFocus();
		};

        var mobileAppSwitcherContextMenuHandler = function(event) {
            event.preventDefault();
            event.stopPropagation();
            event.cancelBubble = true;
            return false;
        };

        var addMobileAppSwitcherToCitrixParentDiv = function() {
            var mobileAppSwitcher = document.createElement('div');
            mobileAppSwitcher.id = "MobileAppSwitcherParentOverlay";
            mobileAppSwitcher.setAttribute('class', 'mobileAppSwitcherBackground');
            mobileAppSwitcherOverlayElement = mobileAppSwitcher;

            var mobileAppSwitcherOverlay = document.createElement('div');
            mobileAppSwitcherOverlay.id = "MobileAppSwitcherOverlay";
            mobileAppSwitcherOverlay.setAttribute('class', 'mobileAppSwitcherOverlay mobileAppSwitcherOverlayCommon noselect');
            mobileAppSwitcher.appendChild(mobileAppSwitcherOverlay);

            var mobileAppSwitcherHeader = document.createElement('div');
            mobileAppSwitcherHeader.id = "MobileAppSwitcherHeader";
            mobileAppSwitcherHeader.setAttribute('class', 'mobileAppSwitcherHeader');
            mobileAppSwitcherOverlay.appendChild(mobileAppSwitcherHeader);

            var mobileAppSwitcherHeaderTitle = document.createElement('span');
            mobileAppSwitcherHeaderTitle.id = "MobileAppSwitcherHeaderTitle";
            mobileAppSwitcherHeaderTitle.setAttribute('class', 'mobileAppSwitcherHeaderTitle');
            mobileAppSwitcherHeaderTitle.textContent = HTML5Engine.i18n.getMessage('app_switcher_title');
            mobileAppSwitcherHeader.appendChild(mobileAppSwitcherHeaderTitle);

            var mobileAppSwitcherCloseButton = document.createElement('div');
            mobileAppSwitcherCloseButton.id = "MobileAppSwitcherCloseButton";
            mobileAppSwitcherCloseButton.setAttribute('class', 'close_button');
            mobileAppSwitcherCloseButton.addEventListener('click', hideMobileAppSwitcherOverlayElement);
            mobileAppSwitcherHeader.appendChild(mobileAppSwitcherCloseButton);

            var mobileAppSwitcherContainerParent = document.createElement('div');
            mobileAppSwitcherContainerParent.id = "MobileAppSwitcherContainerParent";
            mobileAppSwitcherContainerParent.setAttribute('class', 'mobileAppSwitcherContainerParent');
            mobileAppSwitcherOverlay.appendChild(mobileAppSwitcherContainerParent);

            var mobileAppSwitcherContainer = document.createElement('div');
            mobileAppSwitcherContainer.id = "MobileAppSwitcherContainer";
            mobileAppSwitcherContainer.setAttribute('class', 'mobileAppSwitcherContainer');
            mobileAppSwitcherContainerParent.appendChild(mobileAppSwitcherContainer);
            mobileAppSwitcherElement = mobileAppSwitcherContainer;

            var checkboxContainer = document.createElement('div');
            checkboxContainer.id = "AppSwitcherToggleContainer";
            checkboxContainer.setAttribute('class', 'appSwitcherToggleContainer');
            mobileAppSwitcherOverlay.appendChild(checkboxContainer);

            var checkboxElement = document.createElement('input');
            checkboxElement.id = "AppSwitcherToggleCheckbox";
            checkboxElement.setAttribute('class', 'appSwitcherToggleCheckbox');
            checkboxElement.setAttribute('type', 'checkbox');
            checkboxElement.checked = true;
            checkboxElement.addEventListener('click', showTaskbarCheckboxClickHandler);
            checkboxContainer.appendChild(checkboxElement);
            showTaskbarCb = checkboxElement;

            var checkboxLabel = document.createElement('label');
            checkboxLabel.id = "appSwitcherToggleLabel";
            checkboxLabel.setAttribute('for', 'AppSwitcherToggleCheckbox');
            checkboxLabel.setAttribute('class', 'appSwitcherToggleLabel');
            checkboxLabel.textContent = HTML5Engine.i18n.getMessage('app_switcher_checkbox_label');
            checkboxContainer.appendChild(checkboxLabel);

            document.getElementById('CitrixXtcRoot').appendChild(mobileAppSwitcher);
        };

        var showTaskbarCheckboxClickHandler = function(event) {
            var storedValue;
            if (event.target.checked) {
                if (appSwitcher) {
                    appSwitcher.ShowDesktopAppSwitcher();
                    if (appSwitcher.getFullScreenStatus()) {
                        appSwitcher.FullscreenAppSwitcherAutoHide();
                    }
                }
                storedValue = appSwitcher.GetPreferences();
                storedValue['showTaskbar'] = true;
                HTML5Engine.localStorage.setItem("appSwitcher", JSON.stringify(storedValue));
            } else {
                if (appSwitcher) {
                    appSwitcher.HideDesktopAppSwitcher();
                }
                storedValue = appSwitcher.GetPreferences();
                storedValue['showTaskbar'] = false;
                HTML5Engine.localStorage.setItem("appSwitcher", JSON.stringify(storedValue));
            }
        };

        var hideMobileAppSwitcherOverlayElement = function() {
            mobileAppSwitcherOverlayElement.style.display = "none";
        };

        return MobileAppSwitcher;
    })();
    UiControls.MobileAppSwitcher = MobileAppSwitcher;
})(UiControls || (UiControls = {}));