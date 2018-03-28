/**
 * Created by rajasekarp on 8/1/2016.
 */


var tz;
(function(tz) {
    var dynamicRules = {};

    dynamicRules.rules = {

    };

    //Sample : "IST" : { "330" : "India Standard Time }
    dynamicRules.chromeRules = {
        /*
         "IST":{
                "-330" : "India Standard Time",
                "-120" : "Israel Standard Time"
               },
         "MST" : "Mountain Standard Time"
        */
    };

    dynamicRules.html5Rules = {

    };

    dynamicRules.html5Rules[g.constants.OsIds.WINDOWS] = {

    };

    dynamicRules.html5Rules[g.constants.OsIds.MAC] = {

    };

    dynamicRules.html5Rules[g.constants.OsIds.LINUX] = {

    };

    dynamicRules.html5Rules[g.constants.OsIds.Chrome] = {

    };

    //Yet to add browser support

    function getMappingFromRules(key,  bias) {
        var tz;
        if(dynamicRules.rules[key]) {
            return readRules(dynamicRules.rules[key], bias);
        }
        if (g.environment.receiver.receiverID == 1) {
            return readRules(dynamicRules.chromeRules[key], bias);
        }else if(dynamicRules.html5Rules[key]) {
            return readRules(dynamicRules.html5Rules[key], bias);
        }else {
            var rules = dynamicRules.html5Rules[g.environment.os.osID];
            return (rules) ? readRules(rules[key], bias) : tz;
        }
    }

    function readRules(value, bias) {
        if(typeof(value) === "string") {
            return value;
        }else if(typeof(value) === "object"){
            return value[bias.toString()];
        }
    }

    tz.dynamicRules = {
        lookup : getMappingFromRules
    };

    if(dependency.testEnv === true) {
        console.log("adding function");
        tz.dynamicRules.setupRules = function(rules) {
            dynamicRules = rules;
        };
    }
})(tz || ( tz = {}));
