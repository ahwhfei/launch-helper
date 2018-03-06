describe("Json validator", function () {
    var testObj = {
        'field2': "test"
    };

    var testObjMoreFields = {
        'field1': 1,
        'field2': "valid",
        'field6' : "test"
    };

    var testObj1 = {
        'field1' : 1,
        'field2': "string"
    };

    var testObj2 = {
        'field1' : 1,
        'field2': "string",
        'field3': "test"
    };

    var testObj3 = {
        'field1' : 1,
        'field2': "number",
        'field3': "true"
    };

    var testObj4 = {
        'field1': 1,
        'field2': "number",
        'field3': "true",
        'field4' : {
            'field1': 1,
            'field2': "number",
            'field3': "true"
        }
    };


    var TestInnerObj = {
        'field1': {
            'rule': {
                'type': 'number',
                'permitted': [1, 2]
            }
        },
        'field2': {
            'rule': {
                'type': 'string'
            }
        },
        'field3': {
            'rule': {
                'optional': true,
                'type': 'string',
                'permitted': ['true', 'false']
            }
        }
    };

    var TestObj = {
        'field1': {
            'rule': {
                'type': 'number',
                'permitted': [1, 2]
            }
        },
        'field2': {
            'rule': {
                'type': 'string'
            }
        },
        'field3': {
            'rule': {
                'optional': true,
                'type': 'string',
                'permitted': ['true', 'false']
            }
        },
        'field4' : {
            'rule' : {
                'optional': true,
                'type': 'object',
                'class': TestInnerObj
            }
        }
    };

    console.log("---------------------------------------------------------------");
    console.log("\t\t Testing json validator");
    console.log("---------------------------------------------------------------");

    it('Test invalid object ', function () {
        var validator = Utils.JsonValidator;
        function testObject() {
            validator.validate(testObj, TestObj);
        }

        expect(testObject).toThrow();
    });

    it('Test invalid object 1 ', function () {
        var validator = Utils.JsonValidator;

        function testObject() {
            validator.validate(testObj1, TestObj);
        }

        expect(testObject).not.toThrow();
    });

    it('Test invalid object 2', function () {
        var validator = Utils.JsonValidator;
        function testObject() {
            validator.validate(testObj2, TestObj);
        }
        expect(testObject).toThrow();
    });

    it('Test invalid object 3', function () {
        var validator = Utils.JsonValidator;

        function testObject() {
            validator.validate(testObj3, TestObj);
        }
        expect(testObject).not.toThrow();
    });

    it('Test invalid object 4', function () {
        var validator = Utils.JsonValidator;

        function testObject() {
            validator.validate(testObj4, TestObj);
        }
        expect(testObject).not.toThrow();
    });

    it('Test more field object ', function () {
        var validator = Utils.JsonValidator;

        function testObject() {
            validator.validate(testObjMoreFields, TestObj);
        }
        expect(testObject).not.toThrow();
    });

});