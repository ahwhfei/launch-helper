(function() {
    function executeTestCase(browserInfo) {
        var eventListeners = { };
        var mockWindow = jasmine.createSpyObj('window', ['addEventListener', 'devicePixelRatio', 'innerHeight', 'innerWidth', 'outerHeight', 'outerWidth', 'removeEventListener', 'screen']);
        mockWindow.addEventListener.and.callFake(function(evtType, callback) {
            if (!eventListeners[evtType]) {
                eventListeners[evtType] = [];
            }
            eventListeners[evtType].push(callback);
        });

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
                        innerHeight : 626,
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
                        outerHeight : 558   ,

                    },
                    'devicePixelRatio' : 1
                },
                'zoomed_resolutionInfo' : {
                    'bounds' : {
                        innerWidth : 526,
                        innerHeight : 290,
                        outerWidth : 800,
                        outerHeight : 558    ,

                    },
                    'devicePixelRatio' : 1.5
                }
            },
        };

        function setBrowserSpecificData() {
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

        }

        setBrowserSpecificData();
        function resetBrowserSpecificData() {
            g.environment.navigator.userAgent = navigator.userAgent;
            g.environment.receiver.seamlessMode = false;
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
                    window : mockWindow
                });
                resolutionActivityInstance.init();

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
                    expect(callbackObj['callback']).toHaveBeenCalled();
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
                    window : mockWindow
                });
                resolutionActivityInstance.init();

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
                    ;
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
                    window : mockWindow
                });
                resolutionActivityInstance.init();
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

            function callEventCallback(type, data) {
                var cbs = eventListeners[type];
                if (cbs && cbs.length > 0) {
                    for (var i = 0; i < cbs.length; i++) {
                        cbs[i](data);
                    }
                }

            }

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

            function changeMockWindowSize(bounds) {
                mockWindow.innerWidth = bounds.innerWidth;
                mockWindow.innerHeight = bounds.innerHeight;
                mockWindow.outerWidth = bounds.outerWidth;
                mockWindow.outerHeight = bounds.outerHeight;
            }

            beforeEach(function() {
                setBrowserSpecificData();
                mockWindow.innerWidth = testInfos['normalWindow'].bounds.innerWidth;
                mockWindow.innerHeight = testInfos['normalWindow'].bounds.innerHeight;
                mockWindow.outerWidth = testInfos['normalWindow'].bounds.outerWidth;
                mockWindow.outerHeight = testInfos['normalWindow'].bounds.outerHeight;
                mockWindow.devicePixelRatio = 1;
                eventListeners = { };
                jasmine.addCustomEqualityTester(checkForDimension);
                resolutionActivityInstance = UiControls.ResolutionUtility.getNewInstance({
                    window : mockWindow
                });
                resolutionActivityInstance.init();
                callbackObj['callback'] = function(x) {

                };

                spyOn(callbackObj, 'callback');
                resolutionActivityInstance.registerCallback(UiControls.ResolutionUtility.constants.sessionResize, callbackObj['callback']);
            });
            afterEach(function() {
                resetBrowserSpecificData();
            });

            it('set&get value', function() {
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['500x500'].evtData);
                expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['500x500'].expectedData]);
            });

            it('Native Resize(mock)', function(done) {
                changeMockWindowSize(testInfos['resizedWindow'].bounds);
                callEventCallback('resize', {});
                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['resizedWindow'].expectedData]);
                    done();
                }, 1000);

            });

            it('ResizeType = set -->resizeType = set', function() {
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['500x500'].evtData);
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['500x500'].evtData);
                expect(callbackObj['callback'].calls.count()).toEqual(1);
            });

            it('ResizeType = native_resize -->resizeType = set', function(done) {
                changeMockWindowSize(testInfos['resizedWindow'].bounds);
                callEventCallback('resize', {});
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
                callEventCallback('resize', {});
                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['resizedWindow'].expectedData]);
                    expect(callbackObj['callback'].calls.count()).toEqual(1);
                    done();
                }, 1000);

            });

            it('usedpr=1.5 ,setting = fitToWindow ,resizeType =native_resize', function(done) {
                changeMockWindowSize(testInfos['resizedWindow_zoomed'].bounds);
                mockWindow.devicePixelRatio = testInfos['resizedWindow_zoomed'].devicePixelRatio;
                callEventCallback('resize', {});
                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['resizedWindow_zoomed'].expectedData_nodpr]);
                    expect(callbackObj['callback'].calls.count()).toEqual(1);
                    done();
                }, 1000);

            });

            it('usedpr=1.5 ,setting = usedpr ,resizeType =native_resize', function(done) {
                changeMockWindowSize(testInfos['resizedWindow_zoomed'].bounds);
                mockWindow.devicePixelRatio = testInfos['resizedWindow_zoomed'].devicePixelRatio;
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, UiControls.ResolutionUtility.constants.useDpr);
                callEventCallback('resize', {});
                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['resizedWindow_zoomed'].expectedData]);
                    expect(callbackObj['callback'].calls.count()).toEqual(1);
                    done();
                }, 1000);

            });

            it('setting = fixedResolution ', function() {
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, '500x500');
                expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['500x500'].evtData]);
            });

            it('setting = fixedResolution(500x500), resizeType=native_resize ', function(done) {
                changeMockWindowSize(testInfos['resizedWindow'].bounds);
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, '500x500');
                callEventCallback('resize', {});
                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['500x500'].expectedData]);
                    expect(callbackObj['callback'].calls.count()).toEqual(1);
                    done();
                }, 1000);

            });
            it('setting = fixedResolution(500x500) ,setting = fixedResolution(600x600)', function() {
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, '500x500');
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, '600x600');
                expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['600x600'].expectedData]);
                expect(callbackObj['callback'].calls.count()).toEqual(2);
            });

            it('setting = fixedResolution(500x500) ,by setting set res', function() {
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, '500x500');
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['600x600'].evtData);
                expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['600x600'].expectedData]);
                expect(callbackObj['callback'].calls.count()).toEqual(2);
            });

            it('setting = fixedResolution(600x600) ,by setting set res', function() {
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['600x600'].evtData);
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, '500x500');
                expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['500x500'].expectedData]);
                expect(callbackObj['callback'].calls.count()).toEqual(2);
            });

            it('Native Resize(mock),seamlessMode= true', function(done) {
                g.environment.receiver.seamlessMode = true;
                changeMockWindowSize(testInfos['resizedWindow'].bounds);
                callEventCallback('resize', {});
                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['resizedWindow'].expectedData]);
                    done();
                }, 1000);

            });

            it('setting = fixedResolution(500x500) ,setting = set,seamless = true', function() {
                g.environment.receiver.seamlessMode = true;
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, '500x500');
                expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['500x500'].expectedData]);
            });

        });

    }

    var hybridbrowsers = [];

    hybridbrowsers[hybridbrowsers.length] = {
        isTouchOS : true,
        appVersion : "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.47 Safari/537.36",
        deviceType : 'hybrid',
        orientation : {
            'key' : 'orientation',
            'value' : {
                angle : 0,
                type : "landscape-primary"
            }
        },
        browser : 'CHROME',
        userAgent : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.36 Safari/537.36"
    };

    hybridbrowsers[hybridbrowsers.length] = {
        isTouchOS : true,
        appVersion : "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586",
        deviceType : 'hybrid',
        orientation : {
            'key' : 'msOrientation',
            'value' : "landscape-primary"
        },
        browser : 'IE',
        userAgent : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586"
    };

    for (var i = 0; i < hybridbrowsers.length; i++) {
        executeTestCase(hybridbrowsers[i]);
    }

})();

