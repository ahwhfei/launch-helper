(function() {
    function executeTestCase(browserInfo) {

        function callEventCallback(type, data) {
            var cbs = eventListeners[type];
            if (cbs && cbs.length > 0) {
                for (var i = 0; i < cbs.length; i++) {
                    cbs[i](data);
                }
            }

        }

        function checkForDimension(res1, res2) {

            if ( typeof res1 == 'object') {
                if (res1 && res2 && res1.length >= 1 && res2.length >= 1 && res1[0].width == res2[0].width && res1[0].height == res2[0].height) {
                    return true;
                } else {
                    return false;
                }
            } else {
                if (res1 == res2) {
                    return true;
                } else {
                    return false;
                }
            }
        }

        var displayInfoArr = {
            0 : {
                'singleMonitor' : {
                    displayInfo : [{
                        "bounds" : {
                            "height" : 864,
                            "left" : 0,
                            "top" : 0,
                            "width" : 1536
                        },
                        "dpiX" : 133.1549530029297,
                        "dpiY" : 133.1549530029297,
                        "id" : "0",
                        "isEnabled" : true,
                        "isInternal" : true,
                        "isPrimary" : true,
                        "mirroringSourceId" : "",
                        "name" : "Internal Display",
                        "overscan" : {
                            "bottom" : 0,
                            "left" : 0,
                            "right" : 0,
                            "top" : 0
                        },
                        "rotation" : 0,
                        "workArea" : {
                            "height" : 816,
                            "left" : 0,
                            "top" : 0,
                            "width" : 1536
                        }
                    }],
                    screen : {
                        width : 1536,
                        height : 864,
                        availWidth : 1536,
                        availHeight : 816,
						availLeft : 0,
						availTop : 0

                    },
                    window : {
                        devicePixelRatio : 1.25
                    }
                },
                'chekedSpanDisplayMultiMonitor' : {
                    displayInfo : [{
                        "bounds" : {
                            "height" : 1080,
                            "left" : 0,
                            "top" : 0,
                            "width" : 1920
                        },
                        "dpiX" : 166.4436798095703,
                        "dpiY" : 166.4436798095703,
                        "id" : "0",
                        "isEnabled" : true,
                        "isInternal" : true,
                        "isPrimary" : true,
                        "mirroringSourceId" : "",
                        "name" : "Internal Display",
                        "overscan" : {
                            "bottom" : 0,
                            "left" : 0,
                            "right" : 0,
                            "top" : 0
                        },
                        "rotation" : 0,
                        "workArea" : {
                            "height" : 1080,
                            "left" : 0,
                            "top" : 0,
                            "width" : 1920
                        }
                    }, {
                        "bounds" : {
                            "height" : 1080,
                            "left" : 1920,
                            "top" : 0,
                            "width" : 1920
                        },
                        "dpiX" : 101.5999984741211,
                        "dpiY" : 101.5999984741211,
                        "id" : "2763893501653249",
                        "isEnabled" : true,
                        "isInternal" : false,
                        "isPrimary" : false,
                        "mirroringSourceId" : "",
                        "name" : "BenQ G2220HD",
                        "overscan" : {
                            "bottom" : 0,
                            "left" : 0,
                            "right" : 0,
                            "top" : 0
                        },
                        "rotation" : 0,
                        "workArea" : {
                            "height" : 1080,
                            "left" : 1920,
                            "top" : 0,
                            "width" : 1920
                        }
                    }],
                    screen : {
                        width : 3072,
                        height : 864,
                        availWidth : 3072,
                        availHeight : 816,
						availLeft : 0,
						availTop : 0

                    },
                    window : {
                        devicePixelRatio : 1.25
                    }
                },
                'unChekedSpanDisplayMultiMonitor' : {
                    displayInfo : [{
                        "bounds" : {
                            "height" : 864,
                            "left" : 0,
                            "top" : 0,
                            "width" : 1536
                        },
                        "dpiX" : 133.1549530029297,
                        "dpiY" : 133.1549530029297,
                        "id" : "0",
                        "isEnabled" : true,
                        "isInternal" : true,
                        "isPrimary" : true,
                        "mirroringSourceId" : "",
                        "name" : "Internal Display",
                        "overscan" : {
                            "bottom" : 0,
                            "left" : 0,
                            "right" : 0,
                            "top" : 0
                        },
                        "rotation" : 0,
                        "workArea" : {
                            "height" : 816,
                            "left" : 0,
                            "top" : 0,
                            "width" : 1536
                        }
                    }, {
                        "bounds" : {
                            "height" : 1080,
                            "left" : 1536,
                            "top" : 0,
                            "width" : 1920
                        },
                        "dpiX" : 101.5999984741211,
                        "dpiY" : 101.5999984741211,
                        "id" : "2763893501653249",
                        "isEnabled" : true,
                        "isInternal" : false,
                        "isPrimary" : false,
                        "mirroringSourceId" : "",
                        "name" : "BenQ G2220HD",
                        "overscan" : {
                            "bottom" : 0,
                            "left" : 0,
                            "right" : 0,
                            "top" : 0
                        },
                        "rotation" : 0,
                        "workArea" : {
                            "height" : 1032,
                            "left" : 1536,
                            "top" : 0,
                            "width" : 1920
                        }
                    }],
                    screen : {
                        width : 1536,
                        height : 864,
                        availWidth : 1536,
                        availHeight : 816,
						availLeft : 0,
						availTop : 0

                    },
                    window : {
                        devicePixelRatio : 1.25
                    }
                }

            },

            "0_changed" : {
                'singleMonitor' : {
                    displayInfo : [{
                        "bounds" : {
                            "height" : 864,
                            "left" : 0,
                            "top" : 0,
                            "width" : 1536
                        },
                        "dpiX" : 133.1549530029297,
                        "dpiY" : 133.1549530029297,
                        "id" : "0",
                        "isEnabled" : true,
                        "isInternal" : true,
                        "isPrimary" : true,
                        "mirroringSourceId" : "",
                        "name" : "Internal Display",
                        "overscan" : {
                            "bottom" : 0,
                            "left" : 0,
                            "right" : 0,
                            "top" : 0
                        },
                        "rotation" : 0,
                        "workArea" : {
                            "height" : 864,
                            "left" : 0,
                            "top" : 0,
                            "width" : 1536
                        }
                    }],
                    screen : {
                        width : 1536,
                        height : 864,
                        availWidth : 1536,
                        availHeight : 816,
						availLeft : 0,
						availTop : 0

                    },
                    window : {
                        devicePixelRatio : 1.25
                    }
                },
                'chekedSpanDisplayMultiMonitor' : {
                    displayInfo : [{
                        "bounds" : {
                            "height" : 1080,
                            "left" : 0,
                            "top" : 0,
                            "width" : 1920
                        },
                        "dpiX" : 166.4436798095703,
                        "dpiY" : 166.4436798095703,
                        "id" : "0",
                        "isEnabled" : true,
                        "isInternal" : true,
                        "isPrimary" : true,
                        "mirroringSourceId" : "",
                        "name" : "Internal Display",
                        "overscan" : {
                            "bottom" : 0,
                            "left" : 0,
                            "right" : 0,
                            "top" : 0
                        },
                        "rotation" : 0,
                        "workArea" : {
                            "height" : 1080,
                            "left" : 0,
                            "top" : 0,
                            "width" : 1920
                        }
                    }, {
                        "bounds" : {
                            "height" : 1080,
                            "left" : 1920,
                            "top" : 0,
                            "width" : 1920
                        },
                        "dpiX" : 101.5999984741211,
                        "dpiY" : 101.5999984741211,
                        "id" : "2763893501653249",
                        "isEnabled" : true,
                        "isInternal" : false,
                        "isPrimary" : false,
                        "mirroringSourceId" : "",
                        "name" : "BenQ G2220HD",
                        "overscan" : {
                            "bottom" : 0,
                            "left" : 0,
                            "right" : 0,
                            "top" : 0
                        },
                        "rotation" : 0,
                        "workArea" : {
                            "height" : 1080,
                            "left" : 1920,
                            "top" : 0,
                            "width" : 1920
                        }
                    }],
                    screen : {
                        width : 3072,
                        height : 864,
                        availWidth : 3072,
                        availHeight : 816,
						availLeft : 0,
						availTop : 0

                    },
                    window : {
                        devicePixelRatio : 1.25
                    }
                },
                'unChekedSpanDisplayMultiMonitor' : {
                    displayInfo : [{
                        "bounds" : {
                            "height" : 864,
                            "left" : 0,
                            "top" : 0,
                            "width" : 1536
                        },
                        "dpiX" : 133.1549530029297,
                        "dpiY" : 133.1549530029297,
                        "id" : "0",
                        "isEnabled" : true,
                        "isInternal" : true,
                        "isPrimary" : true,
                        "mirroringSourceId" : "",
                        "name" : "Internal Display",
                        "overscan" : {
                            "bottom" : 0,
                            "left" : 0,
                            "right" : 0,
                            "top" : 0
                        },
                        "rotation" : 0,
                        "workArea" : {
                            "height" : 864,
                            "left" : 0,
                            "top" : 0,
                            "width" : 1536
                        }
                    }, {
                        "bounds" : {
                            "height" : 1080,
                            "left" : 1536,
                            "top" : 0,
                            "width" : 1920
                        },
                        "dpiX" : 101.5999984741211,
                        "dpiY" : 101.5999984741211,
                        "id" : "2763893501653249",
                        "isEnabled" : true,
                        "isInternal" : false,
                        "isPrimary" : false,
                        "mirroringSourceId" : "",
                        "name" : "BenQ G2220HD",
                        "overscan" : {
                            "bottom" : 0,
                            "left" : 0,
                            "right" : 0,
                            "top" : 0
                        },
                        "rotation" : 0,
                        "workArea" : {
                            "height" : 1032,
                            "left" : 1536,
                            "top" : 0,
                            "width" : 1920
                        }
                    }],
                    screen : {
                        width : 1536,
                        height : 864,
                        availWidth : 1536,
                        availHeight : 816,
						availLeft : 0,
						availTop : 0

                    },
                    window : {
                        devicePixelRatio : 1.25
                    }
                }

            }

        };
        var boundChangeByUnitTest = true;
        var constants = {};
        var uniqueId = 1;
        constants.systemDisplayChange = 1;
        var eventListeners = { };
        var config = {};
        config.currentMode = "singleMonitor";
        config.unifiedModeDataIndex = 0;
        var originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

        var windowScreen = window.screen;
        var currentScreen = windowScreen;
        /*
         * make screen valriable proper for unified desktop mode in proper way
         */
        function ConfigChange() {

        }


        Object.defineProperties(ConfigChange.prototype, {
            changeDisplay : {
                set : function(afterCallback) {
                    setTimeout(function() {
                        window.screen = displayInfoArr[config.unifiedModeDataIndex][config.currentMode].screen;
                        mockWindow.devicePixelRatio = displayInfoArr[config.unifiedModeDataIndex][config.currentMode].window.devicePixelRatio;
                        callEventCallback(constants.systemDisplayChange);
                        afterCallback();
                    }, 100);

                },
                enumerable : true,
                configurable : true
            }
        });
        config.modeChange = new ConfigChange();

        var boundChangeTimer;
        var boundChangeTime = 100;

        var currentWindowInfo = {
            outerBounds : {
                left : 0,
                top : 0,
                width : 0,
                height : 0
            },
            innerBounds : {
                left : 0,
                top : 0,
                width : 0,
                height : 0
            },
            window : {
                outerBounds : {
                    left : 0,
                    top : 0,
                    width : 0,
                    height : 0
                },
                innerBounds : {
                    left : 0,
                    top : 0,
                    width : 0,
                    height : 0
                }
            }
        };

        var mockWindow = jasmine.createSpyObj('window', ['addEventListener', 'screen', 'system', 'chrome', 'isMinimized','isFullscreen']);
        function setBoundChangeTimer() {
            clearTimeout(boundChangeTimer);
            boundChangeTimer = setTimeout(function() {
                callEventCallback('resize', {});
            });

        }

        var Window1 = function() {

        };
        Object.defineProperties(Window1.prototype, {

            innerWidth : {
                get : function() {
                    return currentWindowInfo.window.innerBounds.width;
                },
                set : function(value) {
                    currentWindowInfo.window.innerBounds.width = value;
                    currentWindowInfo.innerBounds.width = value;
                    mockWindow.innerWidth = value;
                    setBoundChangeTimer();
                },
                enumerable : true,
                configurable : true
            },
            innerHeight : {
                get : function() {
                    return currentWindowInfo.window.innerBounds.height;
                },
                set : function(value) {
                    currentWindowInfo.window.innerBounds.height = value;
                    currentWindowInfo.innerBounds.height = value;
                    mockWindow.innerHeight = value;
                    setBoundChangeTimer();
                },
                enumerable : true,
                configurable : true
            },
            outerWidth : {
                get : function() {
                    return currentWindowInfo.window.outerBounds.width;
                },
                set : function(value) {
                    currentWindowInfo.window.outerBounds.width = value;
                    currentWindowInfo.outerBounds.width = value;
                    mockWindow.outerWidth = value;
                    setBoundChangeTimer();
                },
                enumerable : true,
                configurable : true
            },
            outerHeight : {
                get : function() {
                    return currentWindowInfo.window.outerBounds.height;
                },
                set : function(value) {
                    currentWindowInfo.window.outerBounds.height = value;
                    currentWindowInfo.outerBounds.height = value;
                    mockWindow.outerHeight = value;
                    setBoundChangeTimer();
                },
                enumerable : true,
                configurable : true
            }
        });
        mockWindow.window = new Window1();

        mockWindow.addEventListener.and.callFake(function(evtType, callback) {
            if (!eventListeners[evtType]) {
                eventListeners[evtType] = [];
            }
            callback.__ID = uniqueId++;
            eventListeners[evtType].push(callback);
        });

        var mockChromeAPI = jasmine.createSpyObj('chrome', ['app', 'onBoundsChanged']);

        mockChromeAPI.onBoundsChanged = jasmine.createSpyObj('onBoundsChanged', ['addListener', 'removeListener']);
        mockChromeAPI.onBoundsChanged.addListener.and.callFake(function(callback) {
            if (!eventListeners["resize"]) {
                eventListeners["resize"] = [];
            }
            callback.__ID = uniqueId++;
            eventListeners["resize"].push(callback);
        });

        mockChromeAPI.onBoundsChanged.removeListener.and.callFake(function(callback) {
            var callbacks = eventListeners[resize];
            if (callbacks) {
                var len = callbacks.length;
                for (var i = len - 1; i >= 0; i--) {
                    if (callback.__ID == callbacks[i].__ID)
                        callbacks.splice(i, 1);
                }
            }
        });
        var isMinimized = false;

        mockChromeAPI.isMinimized = function() {
            return isMinimized;
        };

        mockChromeAPI.app = jasmine.createSpyObj('mockChromeAPI.app', ['window']);
        mockChromeAPI.app.window = jasmine.createSpyObj('mockChromeAPI.app.window', ['current']);

        mockChromeAPI.app.window.current.and.callFake(function(callback) {
            return mockChromeAPI;
        });
		
		var storageObj = jasmine.createSpyObj('storage', ['local']);
        mockChromeAPI.storage = storageObj;
        var getObj = jasmine.createSpyObj('local', ['get','set']);
		storageObj.local = getObj;

        getObj.get.and.callFake(function(callback) {
            //setTimeout(callback(displayInfoArr[config.unifiedModeDataIndex][config.currentMode].displayInfo), 10);
        });
		
		getObj.set.and.callFake(function(callback) {
            //setTimeout(callback(displayInfoArr[config.unifiedModeDataIndex][config.currentMode].displayInfo), 10);
        });
		
		var isFullScreen = false;
		mockChromeAPI.isFullscreen = function() {
            return isFullScreen;
        };
		
        mockWindow.chrome = mockChromeAPI;

        var outerBoundsFn = function() {

        };
        Object.defineProperties(outerBoundsFn.prototype, {
            left : {
                get : function() {
                    return currentWindowInfo.outerBounds.left;
                },
                set : function(value) {
                    currentWindowInfo.window.outerBounds.left = value;
                    currentWindowInfo.outerBounds.left = value;
                    if (g.environment.receiver.seamlessMode == true) {
                        currentWindowInfo.window.innerBounds.left = currentWindowInfo.window.outerBounds.left;
                        currentWindowInfo.innerBounds.left = currentWindowInfo.outerBounds.left;
                    }
                    setBoundChangeTimer();

                },
                enumerable : true,
                configurable : true
            },
            top : {
                get : function() {
                    return currentWindowInfo.outerBounds.top;
                },
                set : function(value) {

                    currentWindowInfo.window.outerBounds.top = value;
                    currentWindowInfo.outerBounds.top = value;
                    if (g.environment.receiver.seamlessMode == true) {
                        currentWindowInfo.window.innerBounds.top = currentWindowInfo.window.outerBounds.top;
                        currentWindowInfo.innerBounds.top = currentWindowInfo.outerBounds.top;
                    }
                    setBoundChangeTimer();
                },
                enumerable : true,
                configurable : true
            },
            width : {
                get : function() {
                    return currentWindowInfo.outerBounds.width;
                },
                set : function(value) {
                    currentWindowInfo.window.outerBounds.width = value;
                    currentWindowInfo.outerBounds.width = value;
                    if (g.environment.receiver.seamlessMode == true) {
                        currentWindowInfo.window.innerBounds.width = currentWindowInfo.window.outerBounds.width;
                        currentWindowInfo.innerBounds.width = currentWindowInfo.outerBounds.width;
                    }
                    setBoundChangeTimer();
                },
                enumerable : true,
                configurable : true
            },
            height : {
                get : function() {
                    return currentWindowInfo.outerBounds.height;
                },
                set : function(value) {
                    currentWindowInfo.window.outerBounds.height = value;
                    currentWindowInfo.outerBounds.height = value;
                    if (g.environment.receiver.seamlessMode == true) {
                        currentWindowInfo.innerBounds.height = currentWindowInfo.outerBounds.height;
                        currentWindowInfo.window.innerBounds.height = currentWindowInfo.window.outerBounds.height;
                    }
                    setBoundChangeTimer();
                },
                enumerable : true,
                configurable : true
            }
        });
        mockChromeAPI.outerBounds = new outerBoundsFn();

        var innerBoundsFn = function() {
        };

        Object.defineProperties(innerBoundsFn.prototype, {
            left : {
                get : function() {
                    return currentWindowInfo.innerBounds.left;
                },
                set : function(value) {
                    currentWindowInfo.window.innerBounds.left = value;
                    currentWindowInfo.innerBounds.left = value;

                    if (g.environment.receiver.seamlessMode == true) {
                        currentWindowInfo.window.outerBounds.left = currentWindowInfo.window.innerBounds.left;
                        currentWindowInfo.outerBounds.left = currentWindowInfo.innerBounds.left;
                    }
                    setBoundChangeTimer();

                },
                enumerable : true,
                configurable : true
            },
            top : {
                get : function() {
                    return currentWindowInfo.innerBounds.top;
                },
                set : function(value) {
                    currentWindowInfo.window.innerBounds.top = value;
                    currentWindowInfo.innerBounds.top = value;
                    if (g.environment.receiver.seamlessMode == true) {
                        currentWindowInfo.window.outerBounds.top = currentWindowInfo.window.innerBounds.top;
                        currentWindowInfo.outerBounds.top = currentWindowInfo.innerBounds.top;
                    }
                    setBoundChangeTimer();
                },
                enumerable : true,
                configurable : true
            },
            width : {
                get : function() {
                    return currentWindowInfo.innerBounds.width;
                },
                set : function(value) {
                    currentWindowInfo.window.innerBounds.width = value;
                    currentWindowInfo.innerBounds.width = value;
                    if (g.environment.receiver.seamlessMode == true) {
                        currentWindowInfo.outerBounds.width = currentWindowInfo.innerBounds.width;
                        currentWindowInfo.window.outerBounds.width = currentWindowInfo.window.innerBounds.width;
                    }
                    setBoundChangeTimer();
                },
                enumerable : true,
                configurable : true
            },
            height : {
                get : function() {
                    return currentWindowInfo.innerBounds.height;
                },
                set : function(value) {
                    currentWindowInfo.window.innerBounds.height = value;
                    currentWindowInfo.innerBounds.height = value;
                    if (g.environment.receiver.seamlessMode == true) {
                        currentWindowInfo.outerBounds.height = currentWindowInfo.innerBounds.height;
                        currentWindowInfo.window.outerBounds.height = currentWindowInfo.window.innerBounds.height;
                    }
                    setBoundChangeTimer();
                },
                enumerable : true,

                configurable : true
            }
        });

        mockChromeAPI.innerBounds = new innerBoundsFn();

        var systemObj = jasmine.createSpyObj('system', ['display']);
        mockChromeAPI.system = systemObj;
        var displayObj = jasmine.createSpyObj('display', ['getInfo', 'onDisplayChanged']);

        displayObj.getInfo.and.callFake(function(callback) {
            setTimeout(callback(displayInfoArr[config.unifiedModeDataIndex][config.currentMode].displayInfo), 10);
        });
        mockChromeAPI.system.display = displayObj;
        var onDisplayChangedObj = jasmine.createSpyObj('onDisplayChanged', ['addListener']);

        onDisplayChangedObj.addListener.and.callFake(function(callback) {
            var evtType = constants.systemDisplayChange;
            console.log("regidtrying diplay change");
            if (!eventListeners[evtType]) {
                eventListeners[evtType] = [];
            }
            eventListeners[evtType].push(callback);
        });
        mockChromeAPI.system.display.onDisplayChanged = onDisplayChangedObj;
        var browserId;

        var info = {
            'normalWindow' : {
                'resolutionInfo' : {
                    'bounds' : {
                        innerWidth : 1920,
                        innerHeight : 940,
                        outerWidth : 1920,
                        outerHeight : 1040  ,

                    },
                    'devicePixelRatio' : 1
                },

                'zoomed_resolutionInfo' : {
                    'bounds' : {
                        innerWidth : 1280,
                        innerHeight : 627,
                        outerWidth : 1920,
                        outerHeight : 1040   ,

                    },
                    'devicePixelRatio' : 1.5
                }
            },
            'resizedWindow' : {
                'resolutionInfo' : {
                    'bounds' : {
                        innerWidth : 790,
                        innerHeight : 436,
                        outerWidth : 800,
                        outerHeight : 558,
						left: 0,
						top: 0
                    },
                    'devicePixelRatio' : 1
                },
                'zoomed_resolutionInfo' : {
                    'bounds' : {
                        innerWidth : 527,
                        innerHeight : 291,
                        outerWidth : 800,
                        outerHeight : 558    ,

                    },
                    'devicePixelRatio' : 1.5
                }
            },
        };
        function setBrowserSpecificData(winbounds) {
            g.environment.window = mockWindow;
            if (browserInfo.userAgent)
                g.environment.navigator.userAgent = browserInfo.userAgent;
            if (browserInfo.appVersion) {
                g.environment.navigator.appVersion = browserInfo.appVersion;
            }
            if (browserInfo.isTouchOS)
                g.environment.os.isTouch = browserInfo.isTouchOS;
            if (browserInfo.orientation)
                mockWindow.screen[browserInfo.orientation.key] = browserInfo.orientation.value;

            browserId = "(browser = " + g.environment.browser.name + ", os = " + g.environment.os.name + ", receiver = " + g.environment.receiver.name;
            if (browserInfo.deviceType) {
                browserId += ", device=" + browserInfo.deviceType;
            }
            browserId += ")";

            if (winbounds) {
                currentWindowInfo.innerBounds.width = winbounds.bounds.innerWidth;
                currentWindowInfo.innerBounds.height = winbounds.bounds.innerHeight;
                currentWindowInfo.outerBounds.width = winbounds.bounds.outerWidth;
                currentWindowInfo.outerBounds.height = winbounds.bounds.outerHeight;

                currentWindowInfo.window.innerBounds.width = winbounds.bounds.innerWidth;
                currentWindowInfo.window.innerBounds.height = winbounds.bounds.innerHeight;
                currentWindowInfo.window.outerBounds.width = winbounds.bounds.outerWidth;
                currentWindowInfo.window.outerBounds.height = winbounds.bounds.outerHeight;

                mockWindow.innerWidth = winbounds.bounds.innerWidth;
                mockWindow.innerHeight = winbounds.bounds.innerHeight;
                mockWindow.outerWidth = winbounds.bounds.outerWidth;
                mockWindow.outerHeight = winbounds.bounds.outerHeight;
            }
            mockWindow.devicePixelRatio = 1.0;
            window.screen = windowScreen;

        }

        setBrowserSpecificData();
        function resetBrowserSpecificData() {
            g.environment.window = window;
            g.environment.navigator.userAgent = navigator.userAgent;
            g.environment.receiver.seamlessMode = false;
            window.screen = windowScreen;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        }
		
        describe("Register Callback" + browserId, function() {
            var resolutionActivityInstance;
            var testInfos = [];
            testInfos[testInfos.length] = {
                testName : 'sessionSize',
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                evtData : {
                    width : 500,
                    height : 500
                },
				callbackEvent : UiControls.ResolutionUtility.constants.sessionResize
            };
            testInfos[testInfos.length] = {
                testName : 'vdaSessionSize',
                evtType : UiControls.ResolutionUtility.constants.vdaSessionSize,
                evtData : {
                    width : 500,
                    height : 500
                },
				callbackEvent : UiControls.ResolutionUtility.constants.vdaSessionSize
            };

            testInfos[testInfos.length] = {
                testName : 'fullScreen',
                evtType : UiControls.ResolutionUtility.constants.fullScreen,
                evtData : true,
				callbackEvent : UiControls.ResolutionUtility.constants.fullScreen
            };
            testInfos[testInfos.length] = {
                testName : 'settingBasedResolution',
                evtType : UiControls.ResolutionUtility.constants.setting_based_resolution,
                evtData : "800x800",
				callbackEvent : UiControls.ResolutionUtility.constants.sessionResize
            };

			var callbackObj = {

            };
			
            beforeEach(function() {
                setBrowserSpecificData();
                resolutionActivityInstance = UiControls.ResolutionUtility.getNewInstance({
                    window : mockWindow,
                    chrome : mockChromeAPI
                });
                resolutionActivityInstance.init(displayInfoArr[0].singleMonitor.displayInfo);

            });
            afterEach(function() {
                resetBrowserSpecificData();

            });
            function testForRegisterCallback(name, evtType, evtData, callbackEvent) {
                it("evtType = " + name, function() {
                    callbackObj['callback'] = function() {

                    };
                    spyOn(callbackObj, 'callback');
                    resolutionActivityInstance.registerCallback(callbackEvent, callbackObj['callback']);
                    resolutionActivityInstance.set(evtType, evtData);
					expect(callbackObj['callback']);
                });
            }

            for (var i = 0; i < testInfos.length; i++) {
                testForRegisterCallback(testInfos[i].testName, testInfos[i].evtType, testInfos[i].evtData, testInfos[i].callbackEvent);
            }

        });
		
		describe("Register Callbacks" + browserId, function() {
            var resolutionActivityInstance;
            var testInfos = [];
            testInfos[testInfos.length] = {
                testName : 'sessionSize',
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                evtData : {
                    width : 500,
                    height : 500
                },
				callbackEvent : UiControls.ResolutionUtility.constants.sessionResize
            };
            testInfos[testInfos.length] = {
                testName : 'vdaSessionSize',
                evtType : UiControls.ResolutionUtility.constants.vdaSessionSize,
                evtData : {
                    width : 500,
                    height : 500
                },
				callbackEvent : UiControls.ResolutionUtility.constants.vdaSessionSize
            };

            testInfos[testInfos.length] = {
                testName : 'fullScreen',
                evtType : UiControls.ResolutionUtility.constants.fullScreen,
                evtData : true,
				callbackEvent : UiControls.ResolutionUtility.constants.fullScreen
            };
			
            var callbackObj = {

            };

            beforeEach(function() {
                setBrowserSpecificData();
                resolutionActivityInstance = UiControls.ResolutionUtility.getNewInstance({
                    window : mockWindow,
                    chrome : mockChromeAPI
                });
                resolutionActivityInstance.init(displayInfoArr[0].singleMonitor.displayInfo);

            });
            afterEach(function() {
                resetBrowserSpecificData();
            });
            function testForRegisterCallback(name, evtType, evtData, callbackEvent) {
                it("evtType = " + name, function() {
                    callbackObj['callback'] = function() {

                    };
                    spyOn(callbackObj, 'callback');
                    resolutionActivityInstance.registerCallback(callbackEvent, callbackObj['callback']);
                    resolutionActivityInstance.registerCallback(callbackEvent, callbackObj['callback']);
                    resolutionActivityInstance.set(evtType, evtData);
                    expect(callbackObj['callback'].calls.count()).toEqual(2);
                });
            }

            for (var i = 0; i < testInfos.length; i++) {
                testForRegisterCallback(testInfos[i].testName, testInfos[i].evtType, testInfos[i].evtData, testInfos[i].callbackEvent)
            }

        });
		
		describe("Register For All Event" + +browserId, function() {
            var resolutionActivityInstance;
            var testInfos = [];
            testInfos[UiControls.ResolutionUtility.constants.sessionResize] = {
                testName : 'sessionSize',
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                evtData : {
                    width : 500,
                    height : 500
                }
            };
            var callbackObj = {

            };
            testInfos[UiControls.ResolutionUtility.constants.vdaSessionSize] = {
                testName : 'vdaSessionSize',
                evtType : UiControls.ResolutionUtility.constants.vdaSessionSize,
                evtData : {
                    width : 500,
                    height : 500
                }
            };
            beforeEach(function() {
                setBrowserSpecificData();
                resolutionActivityInstance = UiControls.ResolutionUtility.getNewInstance({
                    window : mockWindow,
                    chrome : mockChromeAPI
                });
                resolutionActivityInstance.init(displayInfoArr[0].singleMonitor.displayInfo);
                callbackObj['callback'] = function() {

                };
                spyOn(callbackObj, 'callback');
                resolutionActivityInstance.registerCallback(UiControls.ResolutionUtility.constants.sessionResize, callbackObj['callback']);
                resolutionActivityInstance.registerCallback(UiControls.ResolutionUtility.constants.vdaSessionSize, callbackObj['callback']);

            });
            afterEach(function() {
                resetBrowserSpecificData();
            });
            it('evtType = registerForAll', function() {
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos[UiControls.ResolutionUtility.constants.sessionResize].evtData);
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.vdaSessionSize, testInfos[UiControls.ResolutionUtility.constants.vdaSessionSize].evtData);
                expect(callbackObj['callback'].calls.count()).toEqual(2);
                ;
            });

        });
		
		describe("Resize" + browserId, function() {
            var resolutionActivityInstance;
            var RESIZE_DIFF = 20;

            var testInfos = {};
            testInfos['500x500'] = {
                testName : 'sessionSize',
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                evtData : {
                    width : 500,
                    height : 500
                },
                expectedData : {
                    width : 500,
                    height : 500
                }
            };

            testInfos['600x600'] = {
                testName : 'sessionSize',
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                evtData : {
                    width : 600,
                    height : 600
                },
                expectedData : {
                    width : 600,
                    height : 600
                }
            };

            testInfos['resizedWindow'] = {
                testName : 'sessionSize',
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                evtData : {
                    width : info['resizedWindow']['resolutionInfo']['bounds'].innerWidth,
                    height : info['resizedWindow']['resolutionInfo']['bounds'].innerHeight
                },
                expectedData : {
                    width : info['resizedWindow']['resolutionInfo']['bounds'].innerWidth,
                    height : info['resizedWindow']['resolutionInfo']['bounds'].innerHeight
                },
                bounds : info['resizedWindow']['resolutionInfo']['bounds']
            };

            testInfos['normalWindow'] = {
                testName : 'sessionSize',
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                evtData : {
                    width : info['normalWindow']['resolutionInfo']['bounds'].innerWidth,
                    height : info['normalWindow']['resolutionInfo']['bounds'].innerHeight
                },
                expectedData : {
                    width : info['normalWindow']['resolutionInfo']['bounds'].innerWidth,
                    height : info['normalWindow']['resolutionInfo']['bounds'].innerHeight
                },
                bounds : info['normalWindow']['resolutionInfo']['bounds']
            };

            testInfos['resizedWindow_zoomed'] = {
                testName : 'sessionSize',
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                devicePixelRatio : info['resizedWindow']['resolutionInfo']['devicePixelRatio'],
                evtData : {
                    width : info['resizedWindow']['resolutionInfo']['bounds'].innerWidth,
                    height : info['resizedWindow']['resolutionInfo']['bounds'].innerHeight
                },
                expectedData : {
                    width : Math.round((info['resizedWindow']['resolutionInfo']['bounds'].innerWidth) * info['resizedWindow']['resolutionInfo']['devicePixelRatio']),
                    height : Math.round((info['resizedWindow']['resolutionInfo']['bounds'].innerHeight) * info['resizedWindow']['resolutionInfo']['devicePixelRatio'])
                },
                expectedData_nodpr : {
                    width : info['resizedWindow']['resolutionInfo']['bounds'].innerWidth,
                    height : info['resizedWindow']['resolutionInfo']['bounds'].innerHeight
                },
                bounds : info['resizedWindow']['resolutionInfo']['bounds']
            };

            var callbackObj = {

            };

            function changeMockWindowSize(bounds) {
				mockChromeAPI.innerBounds.left = bounds.left;
				mockChromeAPI.innerBounds.top = bounds.top;
                mockChromeAPI.innerBounds.width = bounds.innerWidth;
                mockChromeAPI.innerBounds.height = bounds.innerHeight;
				mockChromeAPI.outerBounds.left = bounds.left;
				mockChromeAPI.outerBounds.top = bounds.top;
                mockChromeAPI.outerBounds.width = bounds.outerWidth;
                mockChromeAPI.outerBounds.height = bounds.outerHeight;
				
				mockWindow.innerWidth = bounds.innerWidth;
                mockWindow.innerHeight = bounds.innerHeight;
                mockWindow.outerWidth = bounds.outerWidth;
                mockWindow.outerHeight = bounds.outerHeight;
            }

            function changeMockWindowPosition(bounds) {
                if (typeof(bounds.left) != 'undefined')
                    mockChromeAPI.outerBounds.left = bounds.left;
                if (typeof(bounds.top) != 'undefined')
                    mockChromeAPI.outerBounds.top = bounds.top;
            }

            beforeEach(function() {
                isMinimized = false;
                setBrowserSpecificData(testInfos['normalWindow']);

                currentWindowInfo.devicePixelRatio = 1;
                eventListeners = { };
                jasmine.addCustomEqualityTester(checkForDimension);
                resolutionActivityInstance = UiControls.ResolutionUtility.getNewInstance({
                    window : mockWindow,
                    chrome : mockChromeAPI
                });

                config.currentMode = "singleMonitor";
                config.unifiedModeDataIndex = 0;
	
                resolutionActivityInstance.init(displayInfoArr[0].singleMonitor.displayInfo);
                jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
                callbackObj['callback'] = function(x) {

                };

                spyOn(callbackObj, 'callback');
                resolutionActivityInstance.registerCallback(UiControls.ResolutionUtility.constants.sessionResize, callbackObj['callback']);
            });
            afterEach(function() {
                config.currentMode = "singleMonitor";
                config.unifiedModeDataIndex = 0;
                g.environment.receiver.isKiosk = false;
                resetBrowserSpecificData();
            });

            it('set&get value', function() {
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['500x500'].evtData);
                expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['500x500'].expectedData]);
            });

            it('Native Resize(mock)', function(done) {
                changeMockWindowSize(testInfos['resizedWindow'].bounds);

                setTimeout(function() {
                    //expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['resizedWindow'].expectedData]);
                    done();
                }, 1000);

            });

            it('ResizeType = set -->resizeType = set', function() {
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['500x500'].evtData);
                expect(callbackObj['callback'].calls.count()).toEqual(1);
            });

            it('ResizeType = native_resize -->resizeType = set', function(done) {
                changeMockWindowSize(testInfos['resizedWindow'].bounds);

                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['resizedWindow'].evtData);
                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['resizedWindow'].expectedData]);
                    expect(callbackObj['callback'].calls.count()).toEqual(1);
                    done();
                }, 1000);
            });

            it('ResizeType = set -->resizeType = native_resize', function(done) {
                changeMockWindowSize(testInfos['resizedWindow'].bounds);
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['resizedWindow'].evtData);

                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['resizedWindow'].expectedData]);
                    expect(callbackObj['callback'].calls.count()).toEqual(1);
                    done();
                }, 1000);

            });

            it('usedpr=1.5 ,setting = fitToWindow ,resizeType =native_resize', function(done) {
                changeMockWindowSize(testInfos['resizedWindow_zoomed'].bounds);
                mockWindow.devicePixelRatio = testInfos['resizedWindow_zoomed'].devicePixelRatio;

                setTimeout(function() {
                    //expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['resizedWindow_zoomed'].expectedData_nodpr]);
                   // expect(callbackObj['callback'].calls.count()).toEqual(1);
                    done();
                }, 1000);

            });

            it('usedpr=1.5 ,setting = usedpr ,resizeType =native_resize', function(done) {
                changeMockWindowSize(testInfos['resizedWindow_zoomed'].bounds);
                mockWindow.devicePixelRatio = testInfos['resizedWindow_zoomed'].devicePixelRatio;
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, UiControls.ResolutionUtility.constants.useDpr);

                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['resizedWindow_zoomed'].expectedData]);
                    expect(callbackObj['callback'].calls.count()).toEqual(1);
                    done();
                }, 1000);

            });

            it('setting = fixedResolution(500x500), resizeType=native_resize ', function(done) {
                changeMockWindowSize(testInfos['resizedWindow'].bounds);
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, '500x500');

                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['500x500'].expectedData]);
                    expect(callbackObj['callback'].calls.count()).toEqual(1);
                    done();
                }, 1000);

            });

            it('setting = fixedResolution(600x600) ,by setting set res', function() {
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['600x600'].evtData);
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, '500x500');
                expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['500x500'].expectedData]);
                expect(callbackObj['callback'].calls.count()).toEqual(2);
            });

            it('setting = fixedResolution(500x500) ,setting = set,seamless = true', function() {
                g.environment.receiver.seamlessMode = true;
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, '500x500');
                expect(callbackObj['callback'].calls.count()).toEqual(0);
            });

            it('Native Resize(mock) & when window minimized window', function(done) {
                changeMockWindowSize(testInfos['normalWindow'].bounds);
                isMinimized = true;

                setTimeout(function() {
                    expect(callbackObj['callback'].calls.count()).toEqual(0);
                    done();
                }, 1000);

            });

            it('seamless == true & single monitor mode & ( moniotor1 ---> changeWorkarea of monitor1)', function(done) {
                g.environment.receiver.seamlessMode = true;
                config.unifiedModeDataIndex = "0_changed";
                config.modeChange.changeDisplay = function() {
                    setTimeout(function() {
                       // expect(callbackObj['callback'].calls.argsFor(0)).toEqual([displayInfoArr[config.unifiedModeDataIndex][config.currentMode].displayInfo[0]['workArea']]);

                        done();
                    }, 2000);

                };

            });

            it('seamless == true  & (  moniotor1 ---> monitor2)', function(done) {
                g.environment.receiver.seamlessMode = true;
                config.currentMode = "unChekedSpanDisplayMultiMonitor";
                config.modeChange.changeDisplay = function() {
                    setTimeout(function() {
                      //  expect(callbackObj['callback'].calls.argsFor(0)).toEqual([displayInfoArr[config.unifiedModeDataIndex][config.currentMode].displayInfo[0]['workArea']]);
                        var workAreaInfo = displayInfoArr[config.unifiedModeDataIndex][config.currentMode].displayInfo[1]['workArea'];
                        changeMockWindowSize({
                            innerWidth : workAreaInfo.width,
                            innerHeight : workAreaInfo.height,
                            outerWidth : workAreaInfo.width,
                            outerHeight : workAreaInfo.height
                        });
                        changeMockWindowPosition({
                            left : workAreaInfo.left,
                            top : workAreaInfo.top
                        });
                        setTimeout(function() {
                            //expect(callbackObj['callback'].calls.argsFor(0)).toEqual([workAreaInfo]);
                            expect(mockChromeAPI.innerBounds.left).toEqual(workAreaInfo.left);
                            expect(mockChromeAPI.innerBounds.top).toEqual(workAreaInfo.top);
                            done();
                        }, 1000);

                    }, 2000);

                };

            });

            it('seamless == true &  ( {unified mode , window span cheked } -- > {unified mode , window span uncheked }-- > {unified mode , window span cheked })', function(done) {
                g.environment.receiver.seamlessMode = true;
                config.currentMode = "chekedSpanDisplayMultiMonitor";
                config.modeChange.changeDisplay = function() {
                    setTimeout(function() {
                        var sc = displayInfoArr[config.unifiedModeDataIndex][config.currentMode].displayInfo[0].bounds;
                        
                        //expect(mockChromeAPI.innerBounds.left).toEqual(0);
                        expect(mockChromeAPI.innerBounds.top).toEqual(0);
                        config.currentMode = "unChekedSpanDisplayMultiMonitor";
                        config.modeChange.changeDisplay = function() {
                            setTimeout(function() {
                                //expect(callbackObj['callback'].calls.argsFor(0)).toEqual([displayInfoArr[config.unifiedModeDataIndex][config.currentMode].displayInfo[0]['workArea']]);
                                config.currentMode = "unChekedSpanDisplayMultiMonitor";
                                config.modeChange.changeDisplay = function() {
                                    setTimeout(function() {
                                        var sc = displayInfoArr[config.unifiedModeDataIndex][config.currentMode].screen;
                                      
                                       // expect(mockChromeAPI.innerBounds.left).toEqual(0);
                                        expect(mockChromeAPI.innerBounds.top).toEqual(0);
                                        done();
                                    }, 2000);
                                };
                            }, 2000);

                        };

                    }, 2000);

                };

            });

        });
		
		describe("Kisok Mode" + browserId, function() {
            var callbackObj = {

            };

            var appCurrentFn = mockChromeAPI.app.window.current;
            var testInfos = [];
            testInfos['resizedWindow'] = {
                testName : 'sessionSize',
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                evtData : {
                    width : info['resizedWindow']['resolutionInfo']['bounds'].innerWidth,
                    height : info['resizedWindow']['resolutionInfo']['bounds'].innerHeight
                },
                expectedData : {
                    width : info['resizedWindow']['resolutionInfo']['bounds'].innerWidth,
                    height : info['resizedWindow']['resolutionInfo']['bounds'].innerHeight
                },
                bounds : info['resizedWindow']['resolutionInfo']['bounds']
            };

            testInfos['normalWindow'] = {
                testName : 'sessionSize',
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                evtData : {
                    width : info['normalWindow']['resolutionInfo']['bounds'].innerWidth,
                    height : info['normalWindow']['resolutionInfo']['bounds'].innerHeight
                },
                expectedData : {
                    width : info['normalWindow']['resolutionInfo']['bounds'].innerWidth,
                    height : info['normalWindow']['resolutionInfo']['bounds'].innerHeight
                },
                bounds : info['normalWindow']['resolutionInfo']['bounds']
            };
            function changeMockWindowSize(bounds) {
                mockWindow.window.innerWidth = bounds.innerWidth;
                mockWindow.window.innerHeight = bounds.innerHeight;
                mockWindow.window.outerWidth = bounds.outerWidth;
                mockWindow.window.outerHeight = bounds.outerHeight;
            }

            beforeEach(function() {

                setBrowserSpecificData(testInfos['normalWindow']);
                g.environment.receiver.isKiosk = true;
                mockChromeAPI.app.window.current = function() {
                    return null;
                }
                isMinimized = false;

                mockWindow.devicePixelRatio = 1;
                eventListeners = { };
                jasmine.addCustomEqualityTester(checkForDimension);
                resolutionActivityInstance = UiControls.ResolutionUtility.getNewInstance({
                    window : mockWindow,
                    chrome : mockChromeAPI
                });
                resolutionActivityInstance.init(displayInfoArr[0].singleMonitor.displayInfo);
                callbackObj['callback'] = function(x) {

                };

                spyOn(callbackObj, 'callback');
                resolutionActivityInstance.registerCallback(UiControls.ResolutionUtility.constants.sessionResize, callbackObj['callback']);
            });
            afterEach(function() {
                g.environment.receiver.isKiosk = false;
                mockChromeAPI.app.window.current = appCurrentFn;
                resetBrowserSpecificData();
            });

            it('kisok mode enabled', function(done) {
                changeMockWindowSize(testInfos['resizedWindow'].bounds);

                setTimeout(function() {
                   // expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['resizedWindow'].expectedData]);

                    done();
                }, 1000);

            });
        });
		
		//comments here
		resetBrowserSpecificData();
    }

    var chromeOs = [];

    chromeOs[chromeOs.length] = {
        appVersion : "5.0 (X11; CrOS x86_64 7978.66.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.91 Safari/537.36",
        orientation : {
            'key' : 'orientation',
            'value' : {
                angle : 0,
                type : "landscape-primary"
            }
        },
        browser : 'chrome',
        userAgent : "Mozilla/5.0 (X11; CrOS x86_64 7978.66.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.91 Safari/537.36"
    };

    for (var i = 0; i < chromeOs.length; i++) {
        executeTestCase(chromeOs[i]);
    }

})();

