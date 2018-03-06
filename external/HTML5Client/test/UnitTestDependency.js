var dependency;
var unitTestUtils;
(function(dependency) {
    dependency.testEnv = true;
})(dependency || (dependency = {}));

(function(unitTestUtils){
	/*CreateWrapper function creates a wrapper around the private functions 
	  that need to be verified in UT scripts. 
	  The wrapper is created by routing the private function calls 
	  through exposed public functions so that UT framework detects the private function call references. */
	function createWrapper(context,actualFunction) {
		var _actualFn = actualFunction;
		return { 
			actualFn: function(){
				return _actualFn.apply(null, arguments);
			},
			wrapper : function() {
				return context[actualFunction.name].apply(context,arguments);
			}
		}
	}
	
	unitTestUtils.createWrapper = createWrapper;	
})(unitTestUtils || (unitTestUtils = {}));
