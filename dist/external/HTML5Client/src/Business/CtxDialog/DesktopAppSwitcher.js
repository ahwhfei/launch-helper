var UiControls;
(function(UiControls) {
    var DesktopAppSwitcher = (function() {
        var desktopAppSwitcher;
        var desktopAppSwitcherElement;
        var desktopAppSwitcherContextMenu;
        var desktopAppSwitcherAutoHideElement;
        var autoHideEnabled;
        var showIconsOnly;
		var showTaskbar;
        var showIconsCb, autoHideCb;
        var rightScrollElement;
        var leftScrollElement;

        var currentlyFocusedDesktopItem;

        var desktopAppSwitcherContainerElement;

        var desktopEntryStringId = "desktop_entry";
        var desktopEntryIconStringId = "desktop_icon";
        var desktopEntryRadioStringId = "desktop_radio";
        var desktopEntryTitleStringId = "desktop_title";

        var consumedWidth = 0;
        var consumedIconsWidth = 0;

        var desktopAppSwitcherEntryWidth = 205; //TODO dont hardcode (width + margin);
        var iconsOnlyWidth = 69; //TODO dont hardcode;

        var SwitcherEntriesSnapshot;

        var appSwitcher;

        var sessionSize;
        var frameWidth;

        var contextMenuShownIos = false;

        function DesktopAppSwitcher(parent) {
            if (parent) {
                appSwitcher = parent;
            }
            if (appSwitcher && appSwitcher.SwitcherEntriesSnapshot) {
                SwitcherEntriesSnapshot = appSwitcher.SwitcherEntriesSnapshot;
            }
            addDesktopAppSwitcherToCitrixParentDiv();
        }

        var updatePreferences = function() {
            var storedValue = appSwitcher.GetPreferences();
            autoHideEnabled = storedValue['autoHide'];
            showIconsOnly = storedValue['showIconsOnly'];
			showTaskbar = storedValue['showTaskbar'];
			autoHideCb.checked = autoHideEnabled;
            if (autoHideEnabled && showTaskbar) {
                //By default autoHide will be disabled. But autoHide is read true from local storage.
                autoHideAppSwitcherEnabled(false);
            }
			showIconsCb.checked = showIconsOnly;
            if (showIconsOnly && showTaskbar) {
                showIconsOnlyInAppSwitcherEnabled(false);
            }
        };

        DesktopAppSwitcher.prototype.addEntry = function(appId) {
            for (var elem in SwitcherEntriesSnapshot) {
                var curElem = SwitcherEntriesSnapshot[elem].entries[appId];
                addElementToDesktopAppSwitcher(desktopAppSwitcherElement, appId, curElem);
            }
        };


        DesktopAppSwitcher.prototype.updateIcon = function(appId, iconData) {
            var iconElem = document.getElementById(desktopEntryIconStringId + appId);
            if (iconElem) {
                var urlData = "url('" + iconData + "')";
                iconElem.style.backgroundImage = urlData;
            }
        };


        DesktopAppSwitcher.prototype.updateTitle = function(appId, title) {
            var titleElem = document.getElementById(desktopEntryTitleStringId + appId);
            var parent = document.getElementById(desktopEntryStringId + appId);
            if (titleElem) {
                if (title && title[title.length - 1] == '\0') {
                    title = title.slice(0, title.length - 1);
                }
                titleElem.textContent = title;
                parent.title = title;
            }
        };

        DesktopAppSwitcher.prototype.removeEntry = function(appId) {
            consumedWidth -= desktopAppSwitcherEntryWidth;
            var elementId = desktopEntryStringId + appId;
            var elem = document.getElementById(elementId);
            desktopAppSwitcherElement.removeChild(elem);
            DesktopAppSwitcher.prototype.checkForDesktopAppSwitcherOverflow(frameWidth);
            consumedIconsWidth -= iconsOnlyWidth;
        };

        DesktopAppSwitcher.prototype.changeFocus = function(appId) {
            var className;
            if (currentlyFocusedDesktopItem != null || currentlyFocusedDesktopItem != undefined) {
                className = currentlyFocusedDesktopItem.className;
                className = className.replace(" desktopAppSwitcherEntryChecked", "");
                currentlyFocusedDesktopItem.className = className;
            }
            currentlyFocusedDesktopItem = document.getElementById(desktopEntryStringId + appId);
            currentlyFocusedDesktopItem.className += " desktopAppSwitcherEntryChecked";
        };

        DesktopAppSwitcher.prototype.showDesktopAppSwitcher = function() {
            if (autoHideEnabled) {
                desktopAppSwitcherAutoHideElement.style.display = "block";
                desktopAppSwitcherContainerElement.style.display = "none";
                sendWorkArea(0);
            } else {
                desktopAppSwitcherContainerElement.style.display = "block";
                sendWorkArea(50);
            }

        }

        DesktopAppSwitcher.prototype.hideDesktopAppSwitcher = function() {
            desktopAppSwitcherAutoHideElement.style.display = "none";
            desktopAppSwitcherContainerElement.style.display = "none";
            sendWorkArea(0);
        }

		DesktopAppSwitcher.prototype.ForceFullscreenAppSwitcherAutoHide = function(hideAppSwitcher) {
			if(!autoHideEnabled)
			{
				if(hideAppSwitcher){
					desktopAppSwitcherContainerElement.style.display = "none";
				}else{
					desktopAppSwitcherContainerElement.style.display = "block";
				}
			}
        }
		
        var addElementToDesktopAppSwitcher = function(parent, id, curElem) {
            var div = document.createElement('div');
            div.setAttribute('class', 'desktopAppSwitcherEntry');
            div.id = desktopEntryStringId + id;
            parent.appendChild(div);
            createDesktopAppSwitcherRadioElement(div, id);
            addDesktopAppSwitcherIconDiv(div, curElem.iconLink, id);
            addDesktopAppSwitcherNameDiv(div, curElem.windowName, id);
            consumedWidth += desktopAppSwitcherEntryWidth;
            consumedIconsWidth += iconsOnlyWidth;
            DesktopAppSwitcher.prototype.checkForDesktopAppSwitcherOverflow(frameWidth);
        };

        var createDesktopAppSwitcherRadioElement = function(parent, id) {
            var radio = document.createElement('input');
            radio.setAttribute('type', 'radio');
            radio.id = desktopEntryRadioStringId + id;
            radio.setAttribute('class', 'appSwitcherRadio');
            radio.setAttribute('name', 'desktopAppSwitcherRadioGroup');
            parent.appendChild(radio);
            parent.addEventListener('click', desktopAppSwitcherEntryClickHandler.bind(null, parent, radio));
        };

        var addDesktopAppSwitcherNameDiv = function(parent, name, id) {
            var div = document.createElement('div');
            div.id = desktopEntryTitleStringId + id;
            div.setAttribute('class', 'desktopAppSwitcherName');
            if (name && name[name.length - 1] == '\0') {
                name = name.slice(0, name.length - 1);
            }
            div.textContent = name;
            parent.title = name;
            parent.appendChild(div);
            if (showIconsCb && showIconsCb.checked) {
                div.style.display = "none";
            }
        };

        var addDesktopAppSwitcherIconDiv = function(parent, iconData, id) {
            var div = document.createElement('div');
            div.setAttribute('class', 'desktopAppSwitcherIcon');
            div.id = desktopEntryIconStringId + id;
            var urlData = "url('" + iconData + "')";
            div.style.backgroundImage = urlData;
            parent.appendChild(div);
            if (showIconsCb && showIconsCb.checked) {
                div.className += " desktopAppSwitcherIconOnly";
            }
        };

        var desktopAppSwitcherEntryClickHandler = function(parent, radioElement, event) {
            event.stopPropagation();
            event.cancelBubble = true;

            if (radioElement) {
                radioElement.checked = true;
                parent.className += " desktopAppSwitcherEntryChecked";
            }
            if (currentlyFocusedDesktopItem == null) {
                currentlyFocusedDesktopItem = parent;
            } else {
                var className = currentlyFocusedDesktopItem.className;
                className = className.replace(" desktopAppSwitcherEntryChecked", "");
                currentlyFocusedDesktopItem.className = className;
                currentlyFocusedDesktopItem = parent;
            }
            var id = currentlyFocusedDesktopItem.id;
            id = id.split(desktopEntryStringId);
            var appIdInFocus = id[1];
            var slMessage = new SeamlessUI.Message();
            //slMessage.sessionId = focusAppId;
            slMessage.appId = appIdInFocus;
            slMessage.cmd = 'update';
            slMessage.focus = true;
            if (appSwitcher) {
                appSwitcher.Dispatch(slMessage.message);
            }
            hideContextMenu();
            HTML5Interface.setKeyboardFocus();
        };

        var desktopAppSwitcherContextMenuHandler = function(event) {
			/*Increasing the z-index when context menu is shown. 
			This will ensure the clicks will go to desktopAppSwitcher div to be able to hide the menu.
			TODO : Should do in a better way*/
            desktopAppSwitcher.style.zIndex = "11";
            desktopAppSwitcherContextMenu.style.display = "block";

            var contextMenuWidth = desktopAppSwitcherContextMenu.clientWidth;
            var contextMenuContainerWidth = desktopAppSwitcherContainerElement.clientWidth;

			/*Setting the position of context menu div to the click/touch point.
			Adjusting the position if the position is to the right most 
			and there is no space to display the menu.*/
            var posX = ((event.pageX) && (event.pageX + contextMenuWidth)) < contextMenuContainerWidth ? event.pageX : (contextMenuContainerWidth - contextMenuWidth-2);
            desktopAppSwitcherContextMenu.style.left = posX + "px";

            event.preventDefault();
            event.stopPropagation();
            event.cancelBubble = true;
            return false;
        };
        function checkForDesktopAppSwitcherOverflow(width) {
            frameWidth = (typeof width === "undefined") ? frameWidth : width;
            if (showIconsCb && showIconsCb.checked) {
                if (consumedIconsWidth > frameWidth) {
                    rightScrollElement.style.display = "block";
                    leftScrollElement.style.display = "block";
                    desktopAppSwitcherElement.style.marginLeft = "20px";
                } else if (consumedIconsWidth < frameWidth) {
                    rightScrollElement.style.display = "none";
                    leftScrollElement.style.display = "none";
                    desktopAppSwitcherElement.style.marginLeft = "0px";
                }
            } else {
                if (consumedWidth > frameWidth) {
                    rightScrollElement.style.display = "block";
                    leftScrollElement.style.display = "block";
                    desktopAppSwitcherElement.style.marginLeft = "20px";
                } else if (consumedWidth < frameWidth) {
                    rightScrollElement.style.display = "none";
                    leftScrollElement.style.display = "none";
                    desktopAppSwitcherElement.style.marginLeft = "0px";
                }
            }
        }
        DesktopAppSwitcher.prototype.checkForDesktopAppSwitcherOverflow = checkForDesktopAppSwitcherOverflow;

        DesktopAppSwitcher.prototype.initialize = function(size) {
            sessionSize = size;
            frameWidth = sessionSize.width;
            updatePreferences();
        };

        var addDesktopAppSwitcherToCitrixParentDiv = function() {
            desktopAppSwitcher = document.createElement("div");
            desktopAppSwitcher.id = "desktopAppSwitcher";
            desktopAppSwitcher.className = "desktopAppSwitcher";

            var desktopAppSwitcherContainer = document.createElement('div');
            desktopAppSwitcherContainer.id = 'DesktopAppSwitcherContainer';
            desktopAppSwitcherContainer.setAttribute('class', 'desktopAppSwitcherContainer noselect');
            desktopAppSwitcherContainer.addEventListener('mouseleave', autoHideMouseLeaveHandler);

            var leftScrollDiv = document.createElement('div');
            leftScrollDiv.id = 'DesktopAppSwitcherLeftScrollDiv';
            leftScrollDiv.setAttribute('class', 'desktopAppSwitcherLeftScrollDiv desktopAppSwitcherArrowLeft');
            leftScrollDiv.addEventListener('click', leftScrollDesktopAppSwitcherHandler);

            desktopAppSwitcherContainer.appendChild(leftScrollDiv);
            leftScrollElement = leftScrollDiv;

            var rightScrollDiv = document.createElement('div');
            rightScrollDiv.id = 'DesktopAppSwitcherRightScrollDiv';
            rightScrollDiv.setAttribute('class', 'desktopAppSwitcherRightScrollDiv desktopAppSwitcherArrowRight');
            rightScrollDiv.addEventListener('click', rightScrollDesktopAppSwitcherHandler);

            desktopAppSwitcherContainer.appendChild(rightScrollDiv);
            rightScrollElement = rightScrollDiv;

            var desktopAppSwitcherDiv = document.createElement('div');
            desktopAppSwitcherDiv.id = 'DesktopAppSwitcherDiv';
            desktopAppSwitcherDiv.setAttribute('class', 'desktopAppSwitcherDiv');
            desktopAppSwitcherContainer.appendChild(desktopAppSwitcherDiv);

            var contextMenutimer;
            //Context menu event handler works in every browser and platform except iOS Safari.
            if (!g.environment.os.isIOS) {
                desktopAppSwitcherDiv.addEventListener("contextmenu", desktopAppSwitcherContextMenuHandler, false);
            }
            else {
                //Detecting touch and hold to generate context menu event incase of iOS Safari.
                desktopAppSwitcherDiv.addEventListener("touchstart", function(e) {
                    hideContextMenu();
                    contextMenutimer = setTimeout(function() {
                        desktopAppSwitcherContextMenuHandler(e);
                        contextMenuShownIos = true;
                    }, 350);
                    e.stopPropagation();
                    e.cancelBubble = true;
                }, false);

                desktopAppSwitcherDiv.addEventListener("touchend", function(e) {
                    clearTimeout(contextMenutimer);
                    e.stopPropagation();
                    if (contextMenuShownIos) {
                        e.preventDefault();
                        contextMenuShownIos = false;
                    }
                    e.cancelBubble = true;
                }, false);
            }

            desktopAppSwitcherElement = desktopAppSwitcherDiv;

            //Context menu UI creation
            desktopAppSwitcherContextMenu = document.createElement("div");
            desktopAppSwitcherContextMenu.setAttribute("id", "desktopAppSwitcherContextMenu borderClass");
            desktopAppSwitcherContextMenu.setAttribute("class", "desktopAppSwitcherContextMenu");
            var showIconsOnlyDiv = document.createElement("div");
            showIconsOnlyDiv.setAttribute("class", "desktopAppSwitcherContextMenuOption");

            showIconsCb = document.createElement("input");
            showIconsCb.setAttribute("id", "desktopAppSwitcherShowIconsOnly");
            showIconsCb.setAttribute("type", "checkbox");
            showIconsOnlyDiv.appendChild(showIconsCb);
            showIconsCb.addEventListener("click", showIconsOnlyInAppSwitcher, false);

            var showIconsLabel = document.createElement("label");
            showIconsLabel.textContent = HTML5Engine.i18n.getMessage("show-icons-only");
            showIconsLabel.setAttribute("for", "desktopAppSwitcherShowIconsOnly");
            showIconsOnlyDiv.appendChild(showIconsLabel);

            var autoHide = document.createElement("div");
            autoHide.setAttribute("class", "desktopAppSwitcherContextMenuOption");

            autoHideCb = document.createElement("input");
            autoHideCb.setAttribute("id", "desktopAppSwitcherAutoHide");
            autoHideCb.setAttribute("type", "checkbox");
            autoHide.appendChild(autoHideCb);
            autoHideCb.addEventListener("click", autoHideAppSwitcher.bind(null, autoHideCb), false);

            var autoHideLabel = document.createElement("label");
            autoHideLabel.textContent = HTML5Engine.i18n.getMessage("autoHide");
            autoHideLabel.setAttribute("for", "desktopAppSwitcherAutoHide");
            autoHide.appendChild(autoHideLabel);

            desktopAppSwitcherContextMenu.appendChild(showIconsOnlyDiv);
            if (g.environment.os.isMobile == false) {
                //Disable autoHide for mobile devices
                desktopAppSwitcherContextMenu.appendChild(autoHide);
            }

            var desktopAppSwitcherAutoHideDiv = document.createElement("div");
            desktopAppSwitcherAutoHideDiv.setAttribute("id", "DesktopAppSwitcherAutoHideDiv");
            desktopAppSwitcherAutoHideDiv.setAttribute("class", "desktopAppSwitcherAutoHideDiv");
            desktopAppSwitcherAutoHideDiv.addEventListener('mouseover', autoHideMouseOverHandler);
            desktopAppSwitcherAutoHideElement = desktopAppSwitcherAutoHideDiv;

            desktopAppSwitcher.appendChild(desktopAppSwitcherContainer);
            desktopAppSwitcher.appendChild(desktopAppSwitcherAutoHideDiv);
            desktopAppSwitcher.appendChild(desktopAppSwitcherContextMenu);

            document.getElementById('CitrixXtcRoot').appendChild(desktopAppSwitcher);
            desktopAppSwitcherContainerElement = desktopAppSwitcherContainer;

            //Hides the context menu on clicking anywhere else on the session.
            //TODO : Find a better way to unhide the context menu using mousepointerdiv
            desktopAppSwitcher.addEventListener("click", function(event) {
                hideContextMenu();
                event.stopPropagation();
                event.cancelBubble = true;
                return false;
            }, false);


        };

        var autoHideMouseLeaveHandler = function(event) {
            if (autoHideEnabled) {
                desktopAppSwitcherContainerElement.style.display = "none";
            }
        };

        var autoHideMouseOverHandler = function(event) {
            desktopAppSwitcherContainerElement.style.display = "block";
        };

        var leftScrollDesktopAppSwitcherHandler = function(event) {
            var windowWidth = frameWidth;
            leftScrollDesktopAppSwitcherTimer(0, parseInt(windowWidth * 0.7));
        };

        var leftScrollDesktopAppSwitcherTimer = function(width, windowWidth, event) {
            if (width < windowWidth) {
                desktopAppSwitcherElement.scrollLeft -= 20;
                width += 20;
                setTimeout(leftScrollDesktopAppSwitcherTimer.bind(null, width, windowWidth), 10);
            }
        };

        var rightScrollDesktopAppSwitcherHandler = function(event) {
            var windowWidth = frameWidth;
            rightScrollDesktopAppSwitcherTimer(0, parseInt(windowWidth * 0.7));
        };

        var rightScrollDesktopAppSwitcherTimer = function(width, windowWidth, event) {
            if (width < windowWidth) {
                desktopAppSwitcherElement.scrollLeft += 20;
                width += 20;
                setTimeout(rightScrollDesktopAppSwitcherTimer.bind(null, width, windowWidth), 10);
            }
        };

        //Context menu auto hide option click handler	
        function autoHideAppSwitcher(event) {
            if (autoHideCb && autoHideCb.checked) {
                autoHideAppSwitcherEnabled(true);
            } else {
                autoHideAppSwitcherDisabled(true);
            }
            hideContextMenu();
            event.cancelBubble = true;
            return false;
        }

        function autoHideAppSwitcherEnabled(store) {
            autoHideEnabled = true;
            desktopAppSwitcherAutoHideElement.style.display = "block";
            desktopAppSwitcherContainerElement.style.display = "none";
            sendWorkArea(0);
			if(store){
				var storedValue = appSwitcher.GetPreferences();
				storedValue['autoHide'] = true;
				HTML5Engine.localStorage.setItem("appSwitcher", JSON.stringify(storedValue));
			}
        }

        function autoHideAppSwitcherDisabled(store) {
            autoHideEnabled = false;
            desktopAppSwitcherAutoHideElement.style.display = "none";
            desktopAppSwitcherContainerElement.style.display = "block";
            sendWorkArea(50);
			if(store){
				var storedValue = appSwitcher.GetPreferences();
				storedValue['autoHide'] = false;
				HTML5Engine.localStorage.setItem("appSwitcher", JSON.stringify(storedValue));
			}
        }

        var sendWorkArea = function(pixelHeight) {
            var sessionSize = appSwitcher.getSessionSize();
            var width = sessionSize.width;
            var height = sessionSize.height - pixelHeight;
            appSwitcher.SendWorkArea(width, height);
        };

        //Context menu show icons only option click handler
        function showIconsOnlyInAppSwitcher(event) {
            if (showIconsCb && showIconsCb.checked) {
                showIconsOnlyInAppSwitcherEnabled(true);
            } else {
                showIconsOnlyInAppSwitcherDisabled(true);
            }
            checkForDesktopAppSwitcherOverflow();
            hideContextMenu();
            event.stopPropagation();
            event.cancelBubble = true;
            return false;
        }

        function showIconsOnlyInAppSwitcherEnabled(store) {
            var nameDivs = document.getElementsByClassName("desktopAppSwitcherName");
            var iconDivs = document.getElementsByClassName("desktopAppSwitcherIcon");
            for (var i = 0; i < nameDivs.length; i++) {
                nameDivs[i].style.display = "none";
            }

            for (var i = 0; i < iconDivs.length; i++) {
                iconDivs[i].className += " desktopAppSwitcherIconOnly";
            }
            if (store) {
                var storedValue = appSwitcher.GetPreferences();
                storedValue['showIconsOnly'] = true;
                HTML5Engine.localStorage.setItem("appSwitcher", JSON.stringify(storedValue));
            }
        }


        function showIconsOnlyInAppSwitcherDisabled(store) {
            var nameDivs = document.getElementsByClassName("desktopAppSwitcherName");
            var iconDivs = document.getElementsByClassName("desktopAppSwitcherIcon");
            for (var i = 0; i < nameDivs.length; i++) {
                nameDivs[i].style.display = "block";
            }

            for (var i = 0; i < iconDivs.length; i++) {
                iconDivs[i].className = iconDivs[i].className.replace(" desktopAppSwitcherIconOnly", "");
            }
            if (store) {
                var storedValue = appSwitcher.GetPreferences();
                storedValue['showIconsOnly'] = false;
                HTML5Engine.localStorage.setItem("appSwitcher", JSON.stringify(storedValue));
            }
        }
        
        //Hides the context menu and reduces the z-index to ensure clicks go to mousepointer div
        function hideContextMenu() {
            desktopAppSwitcher.style.zIndex = "auto";
            desktopAppSwitcherContextMenu.style.display = "none";
        }
        return DesktopAppSwitcher;
    })();
    UiControls.DesktopAppSwitcher = DesktopAppSwitcher;
})(UiControls || (UiControls = {}));