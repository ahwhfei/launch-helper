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
            'portrait-primary' : {
                orientation : {
                    angle : 0,
                    type : "portrait-primary"
                },
                'bounds' : {
                    innerWidth : 600,
                    innerHeight : 784,
                    outerWidth : 600,
                    outerHeight : 784 ,

                },
                'pinch-zoom-bounds' : {
                    innerWidth : 308,
                    innerHeight : 224,
                    outerWidth : 600,
                    outerHeight : 438 ,

                },
                'with-keyboard-bounds' : {
                    innerWidth : 546,
                    outerWidth : 398,
                    innerHeight : 600,
                    outerHeight : 438 ,

                }
            },
            'landscape-primary' : {
                orientation : {
                    angle : 90,
                    type : "landscape-primary"
                },
                'bounds' : {
                    innerWidth : 962,
                    innerHeight : 432,
                    outerWidth : 962,
                    outerHeight : 432 ,

                },
                'pinch-zoom-bounds' : {
                    innerWidth : 592,
                    outerWidth : 266,
                    innerHeight : 962,
                    outerHeight : 432 ,

                },
                'with-keyboard-bounds' : {
                    innerWidth : 962,
                    outerWidth : 134,
                    innerHeight : 962,
                    outerHeight : 134 ,

                }
            }
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
                mockWindow.screen[browserInfo.orientation.key] = info['portrait-primary']['orientation'];

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

            testInfos['landscape-primary'] = {
                testName : 'sessionSize',
                orientation : info['portrait-primary'].orientation,
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                evtData : {
                    width : info['landscape-primary'].bounds.innerWidth,
                    height : info['landscape-primary'].bounds.innerHeight
                },
                expectedData : {
                    width : info['landscape-primary'].bounds.innerWidth,
                    height : info['landscape-primary'].bounds.innerHeight
                },
                bounds : info['landscape-primary'].bounds
            };
            testInfos['portrait-primary'] = {
                orientation : info['portrait-primary'].orientation,
                testName : 'sessionSize',
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                evtData : {
                    width : info['portrait-primary'].bounds.innerWidth,
                    height : info['portrait-primary'].bounds.innerHeight
                },
                expectedData : {
                    width : info['portrait-primary'].bounds.innerWidth,
                    height : info['portrait-primary'].bounds.innerHeight
                },
                bounds : info['portrait-primary'].bounds
            };

            testInfos['portrait-primary_pinchzoom'] = {
                testName : 'sessionSize',
                orientation : info['portrait-primary'].orientation,
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                evtData : {
                    width : info['portrait-primary']['pinch-zoom-bounds'].innerWidth,
                    height : info['portrait-primary']['pinch-zoom-bounds'].innerHeight
                },
                expectedData : {
                    width : info['portrait-primary']['pinch-zoom-bounds'].innerWidth,
                    height : info['portrait-primary']['pinch-zoom-bounds'].innerHeight
                },
                bounds : info['portrait-primary']['pinch-zoom-bounds']
            };
            
            testInfos['portrait-primary_keyboard'] = {
                testName : 'sessionSize',
                orientation : info['portrait-primary'].orientation,
                evtType : UiControls.ResolutionUtility.constants.sessionResize,
                evtData : {
                    width : info['portrait-primary']['with-keyboard-bounds'].innerWidth,
                    height : info['portrait-primary']['with-keyboard-bounds'].innerHeight
                },
                expectedData : {
                    width : info['portrait-primary']['with-keyboard-bounds'].innerWidth,
                    height : info['portrait-primary']['with-keyboard-bounds'].innerHeight
                },
                bounds : info['portrait-primary']['with-keyboard-bounds']
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
                mockWindow.innerWidth = testInfos['portrait-primary'].bounds.innerWidth;
                mockWindow.innerHeight = testInfos['portrait-primary'].bounds.innerHeight;
                mockWindow.outerWidth = testInfos['portrait-primary'].bounds.outerWidth;
                mockWindow.outerHeight = testInfos['portrait-primary'].bounds.outerHeight;
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

            it('Native Resize(mock orientation change)', function(done) {
                mockWindow.screen[browserInfo.orientation.key] = info['landscape-primary']['orientation'];
                changeMockWindowSize(testInfos['landscape-primary'].bounds);
                callEventCallback('resize', {});
                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['landscape-primary'].expectedData]);
                    done();
                }, 1000);

            });

            it('pinch zoom ', function(done) {
                changeMockWindowSize(testInfos['portrait-primary_pinchzoom'].bounds);
                callEventCallback('resize', {});
                setTimeout(function() {
                    expect(callbackObj['callback'].calls.count()).toEqual(0);
                    done();
                }, 1000);

            });
            
            
             it('keyboard popup', function(done) {
                changeMockWindowSize(testInfos['portrait-primary_keyboard'].bounds);
                callEventCallback('resize', {});
                setTimeout(function() {
                    expect(callbackObj['callback'].calls.count()).toEqual(0);
                    done();
                }, 1000);

            });

            it('ResizeType = set -->resizeType = set', function() {
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['500x500'].evtData);
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['500x500'].evtData);
                expect(callbackObj['callback'].calls.count()).toEqual(1);
            });

            it('ResizeType = Native Resize(mock orientation change) -->resizeType = set', function(done) {
                mockWindow.screen[browserInfo.orientation.key] = info['landscape-primary']['orientation'];
                changeMockWindowSize(testInfos['landscape-primary'].bounds);
                callEventCallback('resize', {});
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['landscape-primary'].evtData);
                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['landscape-primary'].expectedData]);
                    expect(callbackObj['callback'].calls.count()).toEqual(1);
                    done();
                }, 1000);
            });

            it('ResizeType = set -->resizeType =  Native Resize(mock orientation change)', function(done) {
                changeMockWindowSize(testInfos['landscape-primary'].bounds);
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.sessionResize, testInfos['landscape-primary'].evtData);
                mockWindow.screen[browserInfo.orientation.key] = info['landscape-primary']['orientation'];
                callEventCallback('resize', {});
                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['landscape-primary'].expectedData]);
                    expect(callbackObj['callback'].calls.count()).toEqual(1);
                    done();
                }, 1000);

            });

            it('setting = fixedResolution ', function() {
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, '500x500');
                expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['500x500'].evtData]);
            });

            it('setting = fixedResolution(500x500), resizeType=Native Resize(mock orientation change) ', function(done) {
                changeMockWindowSize(testInfos['landscape-primary'].bounds);
                resolutionActivityInstance.set(UiControls.ResolutionUtility.constants.setting_based_resolution, '500x500');
                mockWindow.screen[browserInfo.orientation.key] = info['landscape-primary']['orientation'];
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

            it(' resizeType=Native Resize(mock orientation change)  ,seamlessMode= true', function(done) {
                g.environment.receiver.seamlessMode = true;
                mockWindow.screen[browserInfo.orientation.key] = info['landscape-primary']['orientation'];
                changeMockWindowSize(testInfos['landscape-primary'].bounds);
                callEventCallback('resize', {});
                setTimeout(function() {
                    expect(callbackObj['callback'].calls.argsFor(0)).toEqual([testInfos['landscape-primary'].expectedData]);
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

    var mobilebrowsers = [];

    mobilebrowsers[mobilebrowsers.length] = {
        isTouchOS : true,
        appVersion : "5.0 (Linux; Android 5.1.1; Nexus 7 Build/LMY47V) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.89 Safari/537.36",
        orientation : {
            'key' : 'orientation',
            'value' : {
                angle : 0,
                type : "landscape-primary"
            }
        },
        browser : 'chrome',
        userAgent : "Mozilla/5.0 (Linux; Android 5.1.1; Nexus 7 Build/LMY47V) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.89 Safari/537.36"
    };

    for (var i = 0; i < mobilebrowsers.length; i++) {
        executeTestCase(mobilebrowsers[i]);
    }

})();

