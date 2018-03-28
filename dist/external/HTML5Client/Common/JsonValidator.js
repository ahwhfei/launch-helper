/**
 * Created by rajasekarp on 8/19/2016.
 */

var Utils;
(function(Utils) {
    if (!String.prototype.format) {
        String.prototype.format = function() {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined'
                    ? args[number]
                    : match
                    ;
            });
        };
    }

    var JsonValidator = (function(){
        function JsonValidator(){

        }

        JsonValidator.prototype.validate = function(json, ruleClass){
            process(json, ruleClass);
            return true;
        };

        return JsonValidator;
    })();

    function process(json, ruleClass) {
        for(var key in ruleClass) {
            rules.checkOptional(json, ruleClass, key)
                .checkType(json, ruleClass, key)
                .checkPermitted(json, ruleClass, key);
        }
    }

    var rules = (function () {
        var rulesObj = {
            checkOptional : Optional,
            checkType : Type,
            checkPermitted : PermittedValue
        };

        function Optional(json, ruleClass, field) {
            var checkOptional = true;
            if (ruleClass[field]["rule"]["requiredOnlyOn"] !== undefined) {
                checkOptional = ruleClass[field]["rule"]["requiredOnlyOn"](json);
            }
            var optional = ruleClass[field]["rule"]["optional"];
            if (checkOptional && json[field] === undefined && (optional === undefined || optional !== true)) {
                var ex = {
                    'exception': "ValueNotFound",
                    'message': "Value not found in the object [{0}, Problem field : {1}".format(JSON.stringify(json), field)
                };
                if (ruleClass[field]["rule"]["exceptionMsg"] != undefined) {
                    ex.message = ruleClass[field]["rule"]["exceptionMsg"];
                }
                console.log(ex);
                throw ex;
            }
            return rulesObj;
        }


        function Type(json, ruleClass, field) {
            if(ruleClass[field]["rule"]["type"] == "object" &&  !(ruleClass[field]["rule"]["optional"] == true &&  json[field] === undefined)) {
                process(json[field], ruleClass[field]["rule"]["class"]);
            }

            if(json[field] === undefined && ruleClass[field]["rule"]["optional"]) {
                return rulesObj;
            }

            if(typeof (json[field]) != ruleClass[field]["rule"]["type"]) {
                console.log("Invalid type in object [{0}, Problem field : {1}".format(JSON.stringify(json), field));
                var ex =  {
                    exception : "InvalidType",
                    message : "Invalid type in object [{0}, Problem field : {1}".format(JSON.stringify(json), field)
                };
                if(ruleClass[field]["rule"]["exceptionMsg"] != undefined) {
                    ex.message = ruleClass[field]["rule"]["exceptionMsg"];
                }
                console.log(ex);
                throw ex;
            }
            return rulesObj;
        }

        function PermittedValue(json, ruleClass, field) {
            if(json[field] === undefined && ruleClass[field]["rule"]["optional"]) {
                return rulesObj;
            }
            if(ruleClass[field]["rule"]["type"] !== 'object' && ruleClass[field]["rule"]["permitted"]) {
                if (ruleClass[field]["rule"]["permitted"].indexOf(json[field]) === -1) {
                    console.log("Value not matching permitted values in the object [{0}, Problem field : {1}, expected : {2}".format(JSON.stringify(json),
                        field, JSON.stringify(ruleClass[field]["rule"]["permitted"])));
                    var ex = {
                        'exception': "NonPermittedValue",
                        'message': "Value not matching permitted values in the object [{0}, Problem field : {1}, expected : {2}".format(JSON.stringify(json),
                            field, JSON.stringify(ruleClass[field]["rule"]["permitted"]))
                    };
                    if(ruleClass[field]["rule"]["exceptionMsg"] != undefined) {
                        ex.message = ruleClass[field]["rule"]["exceptionMsg"];
                    }
                    console.log(ex);
                    throw ex;
                }
            }
            return rulesObj;
        }

        return rulesObj;
    })();
    Utils.JsonValidator = new JsonValidator();
})(Utils || ( Utils = {}));




