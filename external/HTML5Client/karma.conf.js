// Karma configuration
// Generated on Fri Apr 10 2015 17:35:29 GMT+0530 (India Standard Time)
// Author : Rajasekar Pandiyan.

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
	  'test/UnitTestDependency.js',
      "Common/environment.js",
      'Common/TypeScriptStub.js',
      'Common/*.js',
      'Common/**/*.js',
      'thirdPartyLibrary/**/*.js',
      'src/*.js',
	  'configuration.js',
	  "Common/HTML5CommonInterface/HTML5Interface.js",
	  "src/Business/CtxDialog/ResolutionUtility.js",	  
      'src/Business/Main/WinstationDriver/WriteItem.js',
      'src/Business/Main/TransportDriver/CGP/cgpConstants.js',
      'ChromeAppUI/js/Proxywindows.js',
	  'src/**/*.js',
      'test/*.js',
	  'test/Resolution/*.js',
	  'ChromeAppUI/js/RfChromeSDKLauncher.js',
	  'ChromeAppUI/js/Utils.js',
	  'test/CEIP/*.js' //Load it at the end
    ],


    // list of files to exclude
    exclude: [
      'thirdPartyLibrary/**/facescroll.js'
      
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {		
		'src/**/!(V3Coder).js' : 'coverage',
		'Common/*.js' : 'coverage',
		'src/*.js' : 'coverage',
        'ChromeAppUI/**/*.js' : 'coverage',
        'Common/**/*.js' : 'coverage'        
    },

	 coverageReporter: {
      type : 'html',
      dir : '../logs/reports/coverage/engine/'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
	reporters: ['progress','html','coverage'],
        
	htmlReporter: {
		 outputFile: '../logs/reports/ut/ut_engine_report.html',

	      // Optional 
	      pageTitle: 'Rx for Chrome, HTML5 unit test report',
	      subPageTitle: 'Test results for HTML5 engine (EUEM, Resolution Utility, Smart Card)'
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],
	

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,
	
	// How long will Karma wait for a message from a browser before disconnecting from it (in ms)
	browserNoActivityTimeout : 30000
  });
};
