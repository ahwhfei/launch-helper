var XMLHttpRequest = jasmine.createSpyObj('window', ['addEventListener', 'send', 'open', 'setRequestHeader']);
(function () {
	var dummyCEIP;
	var DBOpenRequest;
	var db;
	var dbName = "CitrixDatabase";
	var tableName = "CEIP";
	var transaction;
	var isCEIPEnabled = true;
	var entryID = 1;
	var objectStore;
	var originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
	var K_VPairAdd = [];
	K_VPairAdd[K_VPairAdd.length] = {
		key: 'touch',
		value: true
	};
	K_VPairAdd[K_VPairAdd.length] = {
		key: 'network:type',
		value: 'https'
	};
	K_VPairAdd[K_VPairAdd.length] = {
		key: 'graphics:caps:selectiveH264',
		value: true
	};
	K_VPairAdd[K_VPairAdd.length] = {
		key: 'graphics:decoder:type',
		value: 'Nacl'
	};
	K_VPairAdd[K_VPairAdd.length] = {
		key: 'network:reconnectionTimeOut',
		value: '180'
	};
	var keyIncrement = [];
	keyIncrement[keyIncrement.length] = {
		key: 'session:attempt'
	};
	keyIncrement[keyIncrement.length] = {
		key: 'session:error:count'
	};
	keyIncrement[keyIncrement.length] = {
		key: 'toolbar:click'
	};
	keyIncrement[keyIncrement.length] = {
		key: 'toolbar:buttons:upload'
	};
	g.environment.receiver.isChromeApp = false;

	function initDB(callback) {
		window['indexedDB'] = window['indexedDB'] || window['mozIndexedDB'] || window['webkitIndexedDB'] || window['msIndexedDB'];
		window['IDBTransaction'] = window['IDBTransaction'] || window['webkitIDBTransaction'] || window['msIDBTransaction'];
		window['IDBKeyRange'] = window['IDBKeyRange'] || window['webkitIDBKeyRange'] || window['msIDBKeyRange'];
		DBOpenRequest = window['indexedDB'].open(dbName);
		DBOpenRequest['onerror'] = function () {
			console.log('onerror');
		};
		DBOpenRequest['onsuccess'] = function () {
			db = DBOpenRequest['result'];
			callback();
		};
		DBOpenRequest['onupgradeneeded'] = function () {
			console.log('upgrade needed');
			db = event.target.result;
			objectStore = db.createObjectStore(tableName, {
					'keyPath': "id",
					'autoIncrement': true
				});
		};
	}

	function makeDbTransaction() {
		transaction = db.transaction(["CEIP"], "readwrite");
		transaction.oncomplete = function (e) {
			//console.log('makeDbTransaction ', e);
		};

		transaction.onerror = function (e) {
			console.log('makeDbTransaction error', e);
		};
		objectStore = transaction.objectStore("CEIP");
	}

	function getFromDB(Key, callback) {
		makeDbTransaction();
		var getRequest = objectStore.get(entryID);
		getRequest.onsuccess = function (e) {
			var data = getRequest.result;
			var keys = Key.split(":");
			var key = keys[0];
			var dbValue = data[key];
			data = data[key];
			for (var i = 1; i < keys.length; i++) {
				key = keys[i];
				dbValue = data[key];
				data = dbValue;
			}
			callback(dbValue);
		};
		getRequest.onerror = function (e) {
			console.log('openRequestSuccess:getRequest.onerror ', e);
		}
	}
	
	describe("CEIP test case for", function () {
		beforeEach(function (done) {
			jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000000;
			initDB(callback);
			function callback() {
				HTML5Interface.getClientInfo(function (result) {
					dummyCEIP = result['CEIP'];
					entryID = dummyCEIP.Constants.ceipEntry;
					dummyCEIP.init(false, undefined, done);
				});
			}
		});
		afterEach(function (done) {
			jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
			done();
		});
		it('init db', function (done) {
			done();
		});
	});
	
	function startUTCasesForAdd(key, value) {
		describe("CEIP test case for", function () {
			var result;
			beforeEach(function (done) {
				jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000000;
				var x = dummyCEIP.add(key, value, done);
			});
			afterEach(function (done) {
				jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
				done();
			});
			it('add of key = ' + key, function (done) {
				getFromDB(key, callback);
				function callback(r) {
					result = r;
					expect(result).toEqual(value);
					done();
				}
			});
		});
	}
	for (var i = 0; i < K_VPairAdd.length; i++) {
		startUTCasesForAdd(K_VPairAdd[i].key, K_VPairAdd[i].value);
	}

	function startUTCasesForIncrementCounter(key) {
		describe("CEIP test case for", function () {
			var result;
			var value;
			beforeEach(function (done) {
				jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000000;
				dummyCEIP.incrementCounter(key, callback1);
				function callback1() {
					dummyCEIP.incrementCounter(key, done);
				}
			});
			afterEach(function (done) {
				jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
				done();
			});
			it('incrementCounter for key = ' + key, function (done) {
				getFromDB(key, callback);
				function callback(r) {
					result = r;
					expect(result).toEqual(2);
					done();
				}
			});
		});
	}
	for (var i = 0; i < keyIncrement.length; i++) {
		startUTCasesForIncrementCounter(keyIncrement[i].key);
	}

	function startUTCasesForGet(key, value) {
		describe("CEIP test case for", function () {
			var result;
			beforeEach(function (done) {
				jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000000;
				result = dummyCEIP.get(key);
				result = result.data;
				done();
			});
			afterEach(function (done) {
				jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
				done();
			});
			it('get key = ' + key, function (done) {
				expect(result).toEqual(value);
				done();
			});
		});
	}
	for (var i = 0; i < K_VPairAdd.length; i++) {
		startUTCasesForGet(K_VPairAdd[i].key, K_VPairAdd[i].value);
	}

	describe("CEIP test case for", function () {
		beforeEach(function (done) {
			jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000000;
			var timeStamp = Date.now() - 7 * 24 * 3600 * 1000;
			var data = {
				'id': 3,
				'timeStamp': timeStamp
			}
			makeDbTransaction();
			var putRequest = objectStore.put(data);
			putRequest.onsuccess = function (e) {
				HTML5Interface.getClientInfo(function (result) {
					dummyCEIP = result['CEIP'];
					dummyCEIP.init(false, undefined, done);
					entryID = dummyCEIP.Constants.ceipEntry;
				});
			}
			putRequest.onerror = function (e) {
				console.log('addToDB:putRequest.onerror ', e);
				done();
			}
		});
		it('uploading data to server', function (done) {
			expect(XMLHttpRequest.send.calls.count()).toEqual(1);
			done();
		});
	});

})();
