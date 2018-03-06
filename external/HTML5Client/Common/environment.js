/**
 * Created by rajasekarp on 8/26/2016.
 */
var g;
(function(g) {
    var OSInfo = new Array(0);
    OSInfo.WINDOWS = 1;
    OSInfo.MAC = 2;
    OSInfo.LINUX = 3;
    OSInfo.UNIX = 4;
    OSInfo.IPAD = 5;
    OSInfo.ANDTAB = 6;
    OSInfo.NONSUPPORTEDOS = 7;
    OSInfo.IPHONE = 8;
    OSInfo.ANDPHONE = 9;
    OSInfo.BLACKBERRY = 10;
    OSInfo.Chrome = 11;
    OSInfo.WINDOWSPHONE = 12;
    OSInfo.CONTINUUM = 13;

    var BrowserInfo = new Array(0);
    BrowserInfo.FIREFOX = 1;
    BrowserInfo.MSIE = 2;
    BrowserInfo.Chrome = 3;
    BrowserInfo.SAFARI = 4;
    BrowserInfo.BB10 = 5;
    BrowserInfo.NONSUPPORTEDBROWSER = 6;
    BrowserInfo.OTHERS = 7;
    BrowserInfo.EDGE = 8;

    var OSName = new Array(0);
    OSName[OSInfo.WINDOWS] = "WINDOWS";
    OSName[OSInfo.MAC] = "MAC";
    OSName[OSInfo.LINUX] = "LINUX";
    OSName[OSInfo.UNIX] = "UNIX";
    OSName[OSInfo.IPAD ]= "IPAD";
    OSName[OSInfo.ANDTAB] = "ANDTAB";
    OSName[OSInfo.NONSUPPORTEDOS] = "NONSUPPORTEDOS";
    OSName[OSInfo.IPHONE] = "IPHONE";
    OSName[OSInfo.ANDPHONE] = "ANDPHONE";
    OSName[OSInfo.BLACKBERRY] = "BLACKBERRY";
    OSName[OSInfo.Chrome] = "Chrome";
    OSName[OSInfo.WINDOWSPHONE] = "WINDOWSPHONE";
    OSName[OSInfo.CONTINUUM] = "CONTINUUM";


    var BrowserName = new Array(0);
    BrowserName[BrowserInfo.FIREFOX] = "FIREFOX";
    BrowserName[BrowserInfo.MSIE ]= "MSIE";
    BrowserName[BrowserInfo.Chrome] = "Chrome";
    BrowserName[BrowserInfo.SAFARI] = "SAFARI";
    BrowserName[BrowserInfo.BB10] = "BB10";
    BrowserName[BrowserInfo.NONSUPPORTEDBROWSER] = "NONSUPPORTEDBROWSER";
    BrowserName[BrowserInfo.OTHERS] = "OTHERS";
    BrowserName[BrowserInfo.EDGE] = "EDGE";
	
	var clientStrings = [{
			s: 'Windows 10',
			r: /(Windows 10.0|Windows NT 10.0)/
		}, {
			s: 'Windows 8.1',
			r: /(Windows 8.1|Windows NT 6.3)/
		}, {
			s: 'Windows 8',
			r: /(Windows 8|Windows NT 6.2)/
		}, {
			s: 'Windows 7',
			r: /(Windows 7|Windows NT 6.1)/
		}, {
			s: 'Windows Vista',
			r: /Windows NT 6.0/
		}, {
			s: 'Windows Server 2003',
			r: /Windows NT 5.2/
		}, {
			s: 'Windows XP',
			r: /(Windows NT 5.1|Windows XP)/
		}, {
			s: 'Windows 2000',
			r: /(Windows NT 5.0|Windows 2000)/
		}, {
			s: 'Windows ME',
			r: /(Win 9x 4.90|Windows ME)/
		}, {
			s: 'Windows 98',
			r: /(Windows 98|Win98)/
		}, {
			s: 'Windows 95',
			r: /(Windows 95|Win95|Windows_95)/
		}, {
			s: 'Windows NT 4.0',
			r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/
		}, {
			s: 'Windows CE',
			r: /Windows CE/
		}, {
			s: 'Windows 3.11',
			r: /Win16/
		}, {
			s: 'Android',
			r: /Android/
		}, {
			s: 'ChromeOS',
			r: /CrOS/
		}, {
			s: 'Open BSD',
			r: /OpenBSD/
		}, {
			s: 'Sun OS',
			r: /SunOS/
		}, {
			s: 'Linux',
			r: /(Linux|X11)/
		}, {
			s: 'iOS',
			r: /(iPhone|iPad|iPod)/
		}, {
			s: 'Mac OS X',
			r: /Mac OS X/
		}, {
			s: 'Mac OS',
			r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/
		}, {
			s: 'QNX',
			r: /QNX/
		}, {
			s: 'UNIX',
			r: /UNIX/
		}, {
			s: 'BeOS',
			r: /BeOS/
		}, {
			s: 'OS/2',
			r: /OS\/2/
		}, {
			s: 'Search Bot',
			r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/
		}
	];
		
    g.constants = {
        OsIds : OSInfo,
        BrowserIds : BrowserInfo,
        OSNames : OSName,
        BrowserNames : BrowserName
    };

    var EnvironmentManager = (function () {
        var osID;
		var osVersion;
        var browserID;
        var receiverID;
        var browserMajorVersion;
        var browserVersion;

        /*
         _navigator will be useful when useragent string is changing dynamically.(example in case of continuum )
         */
        var _navigator = {
            appVersion :  navigator.appVersion ,
            userAgent :  navigator.userAgent ,
            platform : navigator.platform
        };
        var _window = (typeof window != 'undefined') ? window : null;
        function EnvironmentManager() {

        }




        var RECEIVERTYPE = new Array(0);
        RECEIVERTYPE.CHROMEAPP = 1;
        RECEIVERTYPE.HTMLAPP = 2;

        var RECEIVERNAME = new Array(0);
        RECEIVERNAME[RECEIVERTYPE.CHROMEAPP] = "CHROMEAPP";
        RECEIVERNAME[RECEIVERTYPE.HTMLAPP] = "HTMLAPP";


        EnvironmentManager.prototype.OSEnum = OSInfo;
        EnvironmentManager.prototype.BrowserEnum  = BrowserInfo;

        function supportBasicFeature() {
            var rc = true;
            if ((( typeof Uint32Array) === "undefined") || (( typeof Int32Array) === "undefined") || (( typeof Uint8Array) === "undefined") || (( typeof Int8Array) === "undefined") || (( typeof Uint16Array) === "undefined") || (( typeof Int16Array) === "undefined") || (( typeof ArrayBuffer) === "undefined") || (( typeof Float32Array) === "undefined") || (( typeof Float64Array) === "undefined")) {
                rc = false;
            }
            if (( typeof WebSocket) === "undefined") {
                rc = false;
            }
            try {
                var elem = document.createElement('canvas');
                if ((!(elem.getContext && elem.getContext('2d'))) === true) {
                    rc = false;
                }
            } catch (error) {
                rc = false;
            }
            return rc;
        }
		
        function getOS() {
            var osInfo;

            if (_navigator.appVersion.indexOf("X11") !== -1) {
                osInfo = OSInfo.UNIX;
            }
            if (_navigator.appVersion.indexOf("Linux") !== -1) {
                osInfo = OSInfo.LINUX;
            }

            if (_navigator.appVersion.indexOf("Win") !== -1) {
                osInfo = OSInfo.WINDOWS;
            }

            if (_navigator.appVersion.indexOf("Win") !== -1 && _navigator.userAgent.search("ARM") !== -1) {
                osInfo = OSInfo.CONTINUUM;
            }

            if (_navigator.appVersion.indexOf("Mac") !== -1) {
                osInfo = OSInfo.MAC;
            }

            if(((_navigator.userAgent.search(/CrOS/i) !== -1) && (_navigator.appVersion.search(/CrOS/i) !== -1) && (_navigator.platform.search(/Linux/i) !== -1) ) ) {
                osInfo = OSInfo.Chrome;
            }




            // iPhone and iPad can be reliably identified with the _navigator.platform
            // string, which is currently only available on these devices. Mac is found in appVersion for iOs as well.
            if (_navigator.platform.indexOf("iPhone") !== -1) {
                osInfo = OSInfo.IPHONE;
            }

            if (_navigator.platform.indexOf("iPad") !== -1) {
                osInfo = OSInfo.IPAD;
            }


            var agent = _navigator.userAgent.toLowerCase();
            // We need to eliminate Symbian, Series 60, Windows Mobile and Blackberry
            // browsers for this quick and dirty check. This can be done with the user agent.
            var otherBrowser = (agent.indexOf("series60") !== -1) || (agent.indexOf("symbian") !== -1) || (agent.indexOf("windows ce") !== -1) || (agent.indexOf("blackberry") !== -1);
            // If the screen orientation is defined we are in a modern mobile OS
            var mobileOS = typeof orientation !== 'undefined' ? true : false;
            // If touch events are defined we are in a modern touch screen OS
            var touchOS = (self.document && ('ontouchstart' in document.documentElement)) ? true : false;

            if (_navigator.platform.indexOf("BlackBerry") !== -1) {
                osInfo = OSInfo.BLACKBERRY;
            }

            // If the user agent string contains "android" then it's Android. If it
            // doesn't but it's not another browser, not an iOS device and we're in
            // a mobile and touch OS then we can be 99% certain that it's Android.
            if ((agent.search("android") > -1) && !(agent.search("mobile") > -1)) {
                osInfo = OSInfo.ANDTAB;
            }

            if (((agent.search("android") > -1) && (agent.search("mobile") > -1))) {
                osInfo = OSInfo.ANDPHONE;
            }
            if ((agent.search("windows") > -1) && (agent.search("phone") > -1)) {
                osInfo = OSInfo.WINDOWSPHONE;
            }
            return osInfo;
        }
		
		function getOSVersion(){
			var nAgt = _navigator.userAgent;
			var nVer = _navigator.appVersion;
			var os;
			for (var id in clientStrings) {
				var cs = clientStrings[id];
				if (cs.r.test(nAgt)) {
					os = cs.s;
					break;
				}
			}
			var osVersion;

			if (/Windows/.test(os)) {
				osVersion = /Windows (.*)/.exec(os)[1];
				os = 'Windows';
			}

			switch (os) {
			case 'ChromeOS':
			    var verOffset = nAgt.indexOf("Chrome");
			    osVersion = nAgt.substring(verOffset + 7, verOffset + 19);
			    break;
			case 'Mac OS X':
				osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
				break;

			case 'Android':
				osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
				break;

			case 'iOS':
				osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
				osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
				break;
			}
			return osVersion;
		}

        function getBrowser() {
            //document.loadScript("./Business/CtxDialog.js",function(){});
            var nVer = _navigator.appVersion;
            var nAgt = _navigator.userAgent;
            var browserID = null;
            var fullVersion = '' + parseFloat(_navigator.appVersion);
            var nameOffset, verOffset, ix;

            // In MSIE, the true version is after "MSIE" in userAgent
            if (( verOffset = nAgt.indexOf("MSIE")) !== -1) {
                browserID = BrowserInfo.MSIE;
                fullVersion = nAgt.substring(verOffset + 5);
            } else if((verOffset = nAgt.indexOf("Edge")) !== -1){
                browserID = BrowserInfo["EDGE"];
                //UserAgent = "...Edge/12.0 .."
                fullVersion = nAgt.substring(verOffset + 5, verOffset + 5+4);
            }else if (nAgt.indexOf("Trident") !== -1) {
                browserID = BrowserInfo.MSIE;
                verOffset = nAgt.indexOf("rv:");
                fullVersion = nAgt.substring(verOffset + 3, verOffset + 3 + 4);
            }
            // In BB10, the true version is after after "Version"
            else if (( verOffset = nAgt.indexOf("BB10")) !== -1) {
                browserID = BrowserInfo.BB10;
                fullVersion = nAgt.substring(verOffset + 7);
                if (( verOffset = nAgt.indexOf("Version")) !== -1)
                    fullVersion = nAgt.substring(verOffset + 8);
            }

            // In chrome, the true version is after "chrome"
            else if (( verOffset = nAgt.indexOf("Chrome")) !== -1) {
                browserID = BrowserInfo.Chrome;
                fullVersion = nAgt.substring(verOffset + 7);
                if (( verOffset = nAgt.indexOf("Version")) !== -1)
                    fullVersion = nAgt.substring(verOffset + 8);
            }

            // In Safari, the true version is after "Safari" or after "Version"
            else if (( verOffset = nAgt.indexOf("Safari")) !== -1) {
                browserID = BrowserInfo.SAFARI;
                fullVersion = nAgt.substring(verOffset + 7);
                if (( verOffset = nAgt.indexOf("Version")) !== -1)
                    fullVersion = nAgt.substring(verOffset + 8);

                //Added for worxweb as fullVersion will be empty when session is running inside UIWebview and hence reading applewebkit no
                if (fullVersion == "" && (verOffset = nAgt.indexOf("AppleWebKit")) !== -1)
                    fullVersion = nAgt.substring(verOffset + 12);
            }
            // In Firefox, the true version is after "Firefox"
            else if (( verOffset = nAgt.indexOf("Firefox")) !== -1) {
                browserID = BrowserInfo.FIREFOX;
                fullVersion = nAgt.substring(verOffset + 8);
            } else {
                if (supportBasicFeature() === false) {
                    browserID = BrowserInfo.NONSUPPORTEDBROWSER;
                } else {
                    browserID = BrowserInfo.OTHERS;
                }
            }

            // trim the fullVersion string at semicolon/space if present
            if (( ix = fullVersion.indexOf(";")) !== -1) {
                fullVersion = fullVersion.substring(0, ix);
            }
            if (( ix = fullVersion.indexOf(" ")) !== -1) {
                fullVersion = fullVersion.substring(0, ix);
            }

			browserVersion = fullVersion;
            browserMajorVersion  = parseInt('' + fullVersion, 10);

            if (isNaN(browserMajorVersion)) {
                browserMajorVersion = parseInt(_navigator.appVersion, 10);
            }
            return {
                browserID : browserID ,
                browserMajorVersion : browserMajorVersion,
                browserVersion : browserVersion
            };
        }
        function getReceiverStrId( ){
            if(receiverID == RECEIVERTYPE.CHROMEAPP){
                return 'chrome';
            }
            return 'html5';
        }
        function getReceiverID( ){
            if( _window  && _window.chrome && _window.chrome.storage)
            {
                return RECEIVERTYPE.CHROMEAPP ;
            }
            return RECEIVERTYPE.HTMLAPP;
        }

        function getEnvironment() {
            osID = getOS();
			osVersion = getOSVersion();
            var browserObj = getBrowser();
            receiverID = getReceiverID( );
            var rvalue =  {
                browser :{
                    browserID : browserObj.browserID,
                    name : BrowserName[browserObj.browserID],
                    browserMajorVersion : browserObj.browserMajorVersion,
                    browserVersion : browserObj.browserVersion,
                    isMSBrowser : (browserObj.browserID == BrowserInfo.MSIE || browserObj.browserID == BrowserInfo.EDGE) ? true :false,
                    isFirefox : (browserObj.browserID == BrowserInfo.FIREFOX ) ? true :false,
                    isSafari : (browserObj.browserID == BrowserInfo.SAFARI ) ? true :false,
                    isMSEdge : (browserObj.browserID == BrowserInfo.EDGE ) ? true :false,
                    isChrome : (browserObj.browserID == BrowserInfo.Chrome) ? true :false
                },
                os : {
                    osID : osID,
					osVersion : osVersion,
                    name : OSName[osID],
                    isMac : (osID === OSInfo.MAC) ? true :false,
                    isTouch : (self.document && ('ontouchstart' in document.documentElement)) ? true : false,
                    isIOS : (osID === OSInfo.IPAD || osID === OSInfo.IPHONE) ? true :false,
                    isWindows : (osID === OSInfo.WINDOWS) ? true :false,
                    isWindowsPhone : (osID === OSInfo.WINDOWSPHONE) ? true :false,
                    isWindowsContinuum : (osID === OSInfo.CONTINUUM) ? true :false,
                    isMobile : (osID === OSInfo.WINDOWSPHONE || osID === OSInfo.ANDTAB || osID === OSInfo.ANDPHONE || osID === OSInfo.IPAD || osID === OSInfo.IPHONE) ? true:false
                },
                receiver : {
                    receiverID : receiverID ,
                    name : RECEIVERNAME[receiverID],
                    isChromeApp : (receiverID == RECEIVERTYPE.CHROMEAPP) ?true :false ,
                    receiverName : getReceiverStrId( ),
                    isKiosk  : (self.parent && (self.parent.isKioskMode=== true)) || self["appViewMode"]
                },
                navigator : Object.defineProperties({ }, {
                    userAgent: {
                        get: function () {
                            return _navigator.userAgent;
                        },
                        set: function (value) {
                            _navigator.userAgent = value;
                            g.environment = getEnvironment();
                        },
                        enumerable: true,
                        configurable: true
                    },
                    appVersion: {
                        get: function () {
                            return _navigator.userAgent;
                        },
                        set: function (value) {
                            _navigator.appVersion = value;
                            g.environment = getEnvironment();
                        },
                        enumerable: true,
                        configurable: true
                    }
                })
            };

            Object.defineProperties(rvalue ,{
                window : {
                    set : function(value){
                        _window = value;
                    },
                    get : function(){
                        return _window;
                    }
                }
            });

            return rvalue;
        };
        EnvironmentManager.prototype.environment = getEnvironment();
        return EnvironmentManager;
    })();

    g.environment = new EnvironmentManager().environment;

})(g || (g = {}));