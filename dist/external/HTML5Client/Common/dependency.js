/**
 * Created by rajasekarp on 14-08-2015.
 */

var dependency;

(function(dependency) {
	dependency.html5 = 'html5';
	dependency.chrome = 'chrome';
	dependency.all = 'all';

	dependency.IOC = {
		'SeamlessUI': {
			'VirtualWindowPresenter': {
				'chrome': 'ChromeRectManager',
				'html5': 'CanvasManager'
			},
            'WindowPresenter' : {
                'all' : 'VirtualWindow'
            },
			'UiManager' : {
				'chrome' : 'ChromeUIManager',
				'html5' : 'HTML5UiManager'
			}
		}
	}

	/*dependency.IOC = {};

	//SeamlessUI dependencies

	dependency.IOC.SeamlessUI = {};
	var seamlessUI  = dependency.IOC.SeamlessUI;
	seamlessUI['VirtualWindowPresenter'] = {};
	seamlessUI['VirtualWindowPresenter'][dependency.chrome] =  'ChromeRectManager';
	seamlessUI['VirtualWindowPresenter'][dependency.html5] = 'CanvasManager';

	seamlessUI['WindowPresenter'] = {};
	seamlessUI['WindowPresenter'][dependency.all] = 'SimpleRectCutWindow';

	SeamlessUI['UiManager'] = {};
	SeamlessUI['UiManager'][dependency.chrome] = 'ChromeUIManager';
	SeamlessUI['UiManager'][dependency.html5] = 'HTML5UiManager';*/
})(dependency || (dependency = {}));

var dependency;

(function(dependency){
    var Resolver = function(){
        function Resolver() {

        }

		function create(key, className, module, args) {
			if(key != {}) {
                var id;
				if (key[g.environment.receiver.receiverName]) {
					className = key[g.environment.receiver.receiverName];
                    id = key[g.environment.receiver.receiverName];
				}else if(key['all']) {
                    className  = key['all'];
                    id = 'all';
                }
			}
            console.log("DI request: [key : " + key + "] [id: " + id + "][Class Name : " + className +"]");
			return createObject(module, className, args);
		}

		Resolver.prototype.resolve = function(module, className, args) {
			var result;
			//console.log(JSON.stringify(module));
			//console.log(dependency.IOC[module.name]);


			if(module.name && dependency.IOC[module.name] && dependency.IOC[module.name][className]) {
				var key = dependency.IOC[module.name][className];
				if(!key['single']) {
					result = create(key, className, module, args);
				}else
				{
					var singletonKey  = '_s' + className;
					if(module[singletonKey]){
						result =  module[singletonKey];
					}else {
						module[singletonKey] = create(key, className, module, args);
						result = module[singletonKey];
					}
				}
			}else {
				throw new Error("Error creating instance : " + className)
			}
			return result;
		};

		function createObject(_module, className, args)
		{
			var _constructor = _module[className].prototype;
			var classObj = Object.create(_constructor);
			return (_module[className].call(classObj, args) || classObj);
		}
		return Resolver;
	}();

	/*var dependencies;
	dependency.setDependencies = function(_dependencies) {
		dependencies = _dependencies;
	};
	dependency.resolve = function() {
		if(dependencies) {
			return new Resolver().resolve;
		}else {
			console.log("Dependencies not set");
			return function() {};
		}
	}();*/

	dependency.resolve = new Resolver().resolve;
})(dependency || (dependency = {}));

