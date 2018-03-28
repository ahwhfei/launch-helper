
var tz;
(function(tz) {
    //Cache the computed result for one time calculation
    var computed = "";

    function readClientTimezone() {
        var _tz = self['jstz']['determine']();
        _tz = _tz.name();
		writeHTML5Log(0, "SESSION:|:ICA:|:TIMEZONE:|:time zone determined: " + _tz );
        return _tz;
    }


    var checkIfEngilsh = (function() {
        var engLangSet = ['en', 'en-gb', 'en-ie', 'en-ca', 'en-us'];
        var isEnglish = false;
        var lang = navigator.language;
        if(lang===null||(navigator.browserLanguage))     //In the case of IE both we go ahead with navigator.browserlanguage, in other browsers navigator.browserlanguage is null
        {
            lang= navigator.browserLanguage;
        }

        if(engLangSet.indexOf(lang.toLowerCase()) !== -1 ){
            isEnglish = true;
        }
        return function() {
            return isEnglish;
        };
    })();




    function getWindowsTimezone(browserTz, bias) {
        try {
            if (!computed) {
                if(g.environment.os.isWindows && checkIfEngilsh()){
					writeHTML5Log(0, "SESSION:|:ICA:|:TIMEZONE:|Windows OS EN returning timezone " +  browserTz);
                    return browserTz;
                }
                computed = tz.dynamicRules.lookup(browserTz, bias);
                if (!computed) {
                    var tzName = readClientTimezone();
                    computed = tz.rules.lookup(tzName);
                }
            }
        }catch(ex) {
			writeHTML5Log(0, "SESSION:|:ICA:|:TIMEZONE:|:ERROR:|:Unrecognised time zone.. exception while reading client timezone " + ex.message );
        }
        return computed;
    }

    function getLinuxTimezone(browserTz) {
        return readClientTimezone();
    }

    tz.mapper = {
        getTimezoneName : getWindowsTimezone
    };

    if(dependency.testEnv === true) {
        tz.mapper.resetComputed = function() {
            computed = undefined;
        }
    }
})(tz || ( tz = {}));