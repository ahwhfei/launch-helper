/**
 * Created by rajasekarp on 8/2/2016.
 */

(function setup() { //Initialize rules

    var dynamicRules = {};

    dynamicRules.rules = {
        'key1': 'defaultTz'
     };

    dynamicRules.chromeRules = {
        'key': 'ChromerxTz',
        'key1': 'ChromeTz1',
        'IST' : {
            "-330" : "India Standard Time",
            "-120" : "Isreal Standard Time"
        }
    };

    dynamicRules.html5Rules = {
        'html': 'defaultHtml5'
    };

    dynamicRules.html5Rules[g.constants.OsIds.WINDOWS] = {
        'key': 'windowsTZ',
        'html': 'windowsHtmlTz'
    };

    dynamicRules.html5Rules[g.constants.OsIds.MAC] = {
        'key': 'macintoshTz'
    };

    dynamicRules.html5Rules[g.constants.OsIds.LINUX] = {
        'key': 'linuxTz'
    };

    dynamicRules.html5Rules[g.constants.OsIds.Chrome] = {};

    tz.dynamicRules.setupRules(dynamicRules);
})();

describe("Some validation", function() {
    var rx;
    var os;

    beforeAll(function() {
        rx = g.environment.receiver.receiverID;
        os = g.environment.os.osID;
    });
    afterAll(function() {
        g.environment.os.osID = os;
        g.environment.receiver.receiverID = rx;
    });

    it('Test oslon mapper', function () {
        expect(tz).not.toBeNull();
        var test = tz.rules.lookup("America/Phoenix");
        console.log(test);
        expect(test).toEqual("US Mountain Standard Time");
    });

    it('Test mapper IST', function() {
        g.environment.receiver.receiverID = 2;
        g.environment.os.osID = g.constants.OsIds.WINDOWS;
        var result = tz.mapper.getTimezoneName("India Standard Time");
        expect(result).not.toBeNull();
        tz.mapper.resetComputed();
    });


    it('Test mapper Linux', function() {
        g.environment.receiver.receiverID = 2;
        g.environment.os.osID = g.constants.OsIds.LINUX;
        var result = tz.mapper.getTimezoneName("key");
        //expect(result).toEqual("linuxTz");
    });
});

describe("Dynamic rules validation", function () {

    var rx;
    var os;
    var bias = -330;
    beforeAll(function() {
        rx = g.environment.receiver.receiverID;
        os = g.environment.os.osID;
    });
    afterAll(function() {
        g.environment.os.osID = os;
        g.environment.receiver.receiverID = rx;
    });

    it('Test default mapping', function() {
        g.environment.receiver.receiverID = 1;
        var value = tz.dynamicRules.lookup('key1');
        expect(value).toEqual('defaultTz');
    });

    it('Test chrome receiver mapping', function() {
        g.environment.receiver.receiverID = 1;
        var value = tz.dynamicRules.lookup('key',bias);
        expect(value).toEqual('ChromerxTz');
    });

    it('Test html5 default mapping', function() {
        g.environment.receiver.receiverID = 2;
        g.environment.os.osID = g.constants.OsIds.WINDOWS;
        var value = tz.dynamicRules.lookup('html',bias);
        expect(value).toEqual('defaultHtml5');
    });

    it('Test html5 windows mapping', function() {
        g.environment.receiver.receiverID = 2;
        g.environment.os.osID = g.constants.OsIds.WINDOWS;
        var value = tz.dynamicRules.lookup('key',bias);
        expect(value).toEqual('windowsTZ');
    });


    it('Test html5 Mac mapping', function() {
        g.environment.receiver.receiverID = 2;
        g.environment.os.osID = g.constants.OsIds.MAC;
        var value = tz.dynamicRules.lookup('key',bias);
        expect(value).toEqual('macintoshTz');
    });


    it('Test html5 Linux mapping', function() {
        g.environment.receiver.receiverID = 2;
        g.environment.os.osID = g.constants.OsIds.LINUX;
        var value = tz.dynamicRules.lookup('key',bias);
        expect(value).toEqual('linuxTz');
    });


    it('Test html5 Chrome mapping', function() {
        g.environment.receiver.receiverID = 2;
        g.environment.os.osID = g.constants.OsIds.Chrome;
        var value = tz.dynamicRules.lookup('key',bias);
        expect(value).not.toBeDefined();
    });

    it('Test html5 multi value Chrome mapping', function() {
        g.environment.receiver.receiverID = 1;
        g.environment.os.osID = g.constants.OsIds.Chrome;
        var value = tz.dynamicRules.lookup('IST',bias);
        expect(value).toEqual("India Standard Time");
    });
});