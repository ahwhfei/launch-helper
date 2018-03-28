/*
 * This will be used during HTML5 Logging and supports all browsers that support FileAPI or IndexDB. 
 */

var logRootDir	= 'CitrixReceiverLog'; 		// Not to be changed. This would be the default db name in Index DB also.
var fileLogDelimiter = "@^_";
// Chrome and Opera use webkitRequestFileSystem.
self.requestFileSystem = self.requestFileSystem || self.webkitRequestFileSystem;
var html5Logger = null;
var fileCreated = null;

var LogEngine = {};
LogEngine.i18n = {};

function clearAndDeleteLogs(){
	html5Logger.clearLogs();
	var fileList = document.getElementById("log-files-list");
	if(fileList)
	{
		if(!navigator.msSaveOrOpenBlob)
		{
			var anchorList = fileList.getElementsByTagName('a');
			for(var i=0;i<anchorList.length;i++)
			{
				window.URL.revokeObjectURL(anchorList[i].href);
			}
		}
		document.getElementById("log-files-list").innerHTML = "";	
		document.getElementById("log-clear").style.visibility = "hidden";
	}
}
var writeHTML5Log = function (label,logMsg){
	try{
		if(self.html5LogEnabled){
			if(html5Logger.initiated === false){
					html5Logger.initLog("write");
					html5Logger.initiated = true;
				}
				if(html5Logger){
					if(!label){
						label = 0;
					}
					html5Logger.writeLog(label,logMsg);
				}
		}
	}catch(error){
		
	}
};
function writeHTML5LogAppName(appname){
	appname =  appname + fileLogDelimiter + Date.now();
	if(appname[0]=='#'){
		appname = appname.substr(1);
	}
	html5Logger.setAppName(appname);
}

function readHTML5Log(){
	if(html5Logger.initiated === false){
		html5Logger.initLog("read");
		html5Logger.initiated = true;
	} else {
		html5Logger.readLog();
	}
}

// Implements the Fillers for FILE API supported by Chrome.
// This will have all the functions required to implement File System in a browser.
function fileLogAPI(){
	var fs				= 	null;		// used to store the entire FS object.
	var cwd				= 	null;		// used to set the current working directory.
	var fileName		= 	null;		// used to store the fileName of the log being written.
	var logSize			=	5;
	var logMsgArray		= 	[];
	var myself 			= 	this;
	var appLogWriter	=	null;
	var type 			= 	null;
	var testAppName 	= 	null;
	this.initiated		=	false;
	this.setAppName 	=	function(appName){
			testAppName = 	appName;
		};
	var DomError1 = self.DOMError || self.FileError;
	var logFilesList = {};
	
	// Function to handle HTML5 file Logging Errors
	onError = function (e) {
		if(type === "write"){
			logMsgArray = [];
			if (e.code === DomError1.NOT_FOUND_ERR){
				this.InitLog(type);
			}		
			else if(e.code != DomError1.QUOTA_EXCEEDED_ERR){
				this.writeLog = emptyFnc;	
			}
		}
		switch (e.code) {
			case DomError1.QUOTA_EXCEEDED_ERR:
			      msg = 'QUOTA_EXCEEDED_ERR';
			  break;
			case DomError1.NOT_FOUND_ERR:
			  msg = 'NOT_FOUND_ERR';
			  break;
			case DomError1.SECURITY_ERR:
			  msg = 'SECURITY_ERR';
			  break;
			case DomError1.INVALID_MODIFICATION_ERR:
			  msg = 'INVALID_MODIFICATION_ERR';
			  break;
			case DomError1.INVALID_STATE_ERR:
			  msg = 'INVALID_STATE_ERR';
			  break;
			default:
			  msg = 'Unknown Error';
			  break;
		};
	};
	
	// Request temporary FS of 5MB for logging. 
	// Hardcoded to TEMPORARY Since PERSISTENT is not supported by all browsers.
	function requestFS (callback) {
		self.requestFileSystem(self.TEMPORARY, logSize*1024*1024, function(myFs) {
		    	fs = myFs;
		    	cwd = fs.root;
		    	callback(cwd);
	 		},onError);
	}
	
	// Creates a new Directory With "dirName". By default the directory is set to value of "logRootDir"
	function createDirectory(directory,dirName,callback) {
		directory.getDirectory(dirName, {create: true}, function(dirEntry) {
	    callback(dirEntry);
	  }, onError);
	  
	}
	
	// Initialize the File Writer to handle Log Write functions.
	function initializeWriteLog(appName){
		requestFS( function(root){
			createDirectory(root,logRootDir,function(dirEntry){
				createFile(dirEntry,appName,function(fileEntry){
					fileCreated = fileEntry;
					createFileWriter(fileEntry,function(fileWriter){
						appLogWriter = fileWriter;
						myself.writeLog(0,  logMsgArray.join("\r\n"));
						logMsgArray = [];
					});
				});
			});
		});
	}
	
	function initializeReadLog(){
		if(!document.getElementById("log-files-list"))
		{	
			var ul = document.createElement('ul');
			ul.className = 'log-files-list';
			ul.id = 'log-files-list';
			document.getElementById("log-files").appendChild(ul);
		}
		requestFS( function(root){
			createDirectory(root,logRootDir,function(dirEntry){
				var dirReader = dirEntry.createReader();
				dirReader.readEntries(function(logFiles){
					for(var i =0; i< logFiles.length; i++){
						createDownloadLink(logFiles[i]);
					}
					if(logFiles.length === 0)
					{
						document.getElementById("log-clear").style.visibility = "hidden";
					}
				},onError);
			});
		});
	}
	
	function createDownloadLink(fileEntry){	
		if(logFilesList[fileEntry.name]!== undefined)
			return;
		
		var li = document.createElement("li");
		li.className = "log-list-item";		
		
		var appName = fileEntry.name.split(fileLogDelimiter)[0];
		var timeStamp= fileEntry.name.split(fileLogDelimiter)[1];
		var date= new Date(parseInt(timeStamp));
		logFilesList[fileEntry.name] = "";
		
		// create file name to store
		var fileName = getLogFileName(appName,date);
		var fileToWrite = fileEntry;
		
		// create display name
		var display = document.createElement("span");
		display.className = "log-display";	
		display.innerHTML = getLogDisplayName(appName, date);

		li.appendChild(display);	
		
		// create download button
		var dwldBtn = document.createElement("a");
		dwldBtn.className = "log-download";
		if (chrome.fileSystem) {
			dwldBtn.href = "#";
			dwldBtn.addEventListener("click", function(e) {
				chrome.fileSystem.chooseEntry({'type': 'saveFile', 'suggestedName': fileName}, 
					function(writableFileEntry) {
						writableFileEntry.createWriter(function(writer) {
							writer.onwriteend = function(e) {console.log("save complete for " + fileName);};
							writer.onerror = function(e) {console.log("write error"); console.error(e)};							
							
							fileToWrite.file(function(file) {
							  var reader = new FileReader();

							  reader.onload = function(e) {
								var blob = new Blob([this.result], {type: 'text/plain'});
								writer.write(blob);
							  };

							  reader.readAsText(file);
							}, function(e) {console.log("read file error"); console.error(e)});
							
						}, function(e) {console.log("create writer error"); console.error(e)});
				}	);
				e.preventDefault();
			}, false);
		} else {
			dwldBtn.download = fileName;
			dwldBtn.href = fileEntry.toURL();
		}
		dwldBtn.style.visibility = "hidden";
		
		
		var delBtn = document.createElement("a");
		delBtn.className = "log-delete";
		delBtn.addEventListener("click", function(e) {
			fileToWrite.remove(function() {console.log("deleted log file " + fileName);}, onError);
			li.parentNode.removeChild(li);
			var fileList=document.getElementById("log-files-list");
			if(fileList.childNodes.length ==0)
			{
				document.getElementById("log-clear").style.visibility = "hidden";
			}
			delete logFilesList[fileEntry.name];
		}, false);
		delBtn.style.visibility = "hidden";
		
		li.appendChild(delBtn);
		li.appendChild(dwldBtn);
		
		li.onmouseover = function(evt) {
			dwldBtn.style.visibility = "visible";
			delBtn.style.visibility = "visible";
		};
		li.onmouseout = function(evt) {
			dwldBtn.style.visibility = "hidden";
			delBtn.style.visibility = "hidden";
		};
		
		document.getElementById("log-files-list").appendChild(li);		
		document.getElementById("log-clear").style.visibility = "visible";
	}
	
	this.initLog = function(type){		
		this.initiated = true;
		if(type === "read"){
			initializeReadLog();
		}
		if(type === "write"){
			initializeWriteLog(testAppName);
		}
	};
	
	// Creates the file with Application Name to log.
	function createFile (dirEntry,fileName,callback){
		dirEntry.getFile(fileName, {create: true}, function(fileEntry) {
			callback(fileEntry);
		}, onError);
	}
	
	// Create a writer for the specified app Name log
	function createFileWriter (fileEntry, callback){
		fileEntry.createWriter(function(fileWriter) {
			fileWriter.onwriteend = function(e) {
				if(logMsgArray.length >= 1){			
					myself.writeLog(0,  logMsgArray.join("\r\n"));
				}
				logMsgArray =[];
			};
			fileWriter.onerror = function( ){
			};
			callback(fileWriter);
		}, onError); 
	}

	// Reads the Log File from filesystem/DB and writes it to a HTML page
	// Its is recommended to write it to HTML page to maintain consistency across browsers.
	this.readLog = function () {
		initializeReadLog();		
	};
	

	// Appends data to the file created.
	// Always use this Append data to the existing file. 
	this.writeLog = function (label, log) {
		if(!log){
			return;
		}
		if( appLogWriter ){			
			if(appLogWriter.readyState === 1){
				logMsgArray[logMsgArray.length] = log;
			}else{
				appLogWriter.seek(appLogWriter.length); 
  				var blob = new Blob([log + "\r\n"], {type: 'text/plain'});
  				appLogWriter.write(blob);
			}
			
		} else {
			logMsgArray[logMsgArray.length] = log;
		}
		
	};
	function emptyFnc(){
		return;
	}
	
	this.clearLogs = function () {
		fs.root.createReader().readEntries(function(results) {
			for(var i =0;i < results.length;i++){
				var entry = results[i];
				if (entry.isDirectory) {
					entry.removeRecursively(function() {}, onError);
				} else {
					entry.remove(function() {}, onError);
				}
			}
		}, onError);
	};
}

// Implements the Index DB filler required for browsers that do not support File API.
function IndexDBLog() {
	var appStoreName	= 'CitrixApplicationStore'; // Not to be changed. Used in Index DB logging.
	var logStoreName 	= 'CitrixLogStore'; 		// Not to be changed. Used for Index DB logging
	var dbName			= logRootDir;
	var applicationName;
	var store;
	var timestamp;
	var errorCallback;
	var logArray		= [];
	var databaseroot;
	var testAppName;
	this.initiated = false;
	var logFilesList = {};

	this.setAppName 	=	function(appName){
			testAppName = 	appName;
	};
	
	onerror = function (e) {
		
	};
	
	this.clearLogs = function(){
		// Clear the AppStore and Log Store instead of clearing the entire DB.
		var objAppStore = databaseroot.transaction([appStoreName], "readwrite");
		var clrAppStore = objAppStore.objectStore(appStoreName);
		var clrAStr = clrAppStore.clear();
		clrAStr.onsuccess = function (evt) {
			
		};
		clrAStr.onerror = function () {
			
		};
		
		var objLogStore = databaseroot.transaction([logStoreName], "readwrite");
		var clrLogStore = objLogStore.objectStore(logStoreName);
		var clrLStr = clrLogStore.clear();
		clrLStr.onsuccess = function (evt) {
			
		};
		clrLStr.onerror = function () {
			
		};
	};

	this.initLog = function(type){
		this.initiated = true;
		if(type === "read"){
			initializeReadLog();
		}
		if(type === "write"){
			initializeWriteLog(testAppName);
		}
	};
	
	var myself = this;
	function initializeWriteLog (testAppName){
		createDirectory(function(){
			applicationName = testAppName;
			storeApplicationname(testAppName);
			var str = logArray.join("\r\n");
			myself.writeLog(0,str);
			logArray = [];
		});
	}
	
	function initializeReadLog(){
		var fileList=document.getElementById("log-files-list");
		if(!fileList)
		{
			var ul = document.createElement('ul');
			ul.className = "log-files-list";
			ul.id = 'log-files-list';
			document.getElementById("log-files").appendChild(ul);
			fileList = ul;
		}
		createDirectory(function(){
			readLog(fileList);
		});
	}
			
	//Creates the DB with the "logRootDir"
	function createDirectory (callback) {
		var request = indexedDB.open(dbName);
		request.onupgradeneeded = onupgrade;
		request.onsuccess = function(evt){
			databaseroot = evt.target.result;
			callback();
		};
		request.onerror = onerror;
		request.onabort = onerror;
		request.onclose = onerror;
		
		request.onblocked = function(event) {
		  // If some other tab is loaded with the database, then it needs to be closed
		  // before we can proceed.
		  
		};
	}
	
	function onupgrade(evt) {
		databaseroot = evt.target.result;
		var appNameStore = databaseroot.createObjectStore(appStoreName, {
			'keyPath'	: 'appName'
		});
		var nameIndex = appNameStore.createIndex("by_name", 'appName');
		var storeName = databaseroot.createObjectStore(logStoreName, {
			'autoIncrement' : true
		});
		var name = storeName.createIndex("by_name", "appName");
		var time = storeName.createIndex("by_time", "storetime");
		var level = storeName.createIndex("by_level", "level");
		var logs = storeName.createIndex("by_logs", "logstring");
	}

	function storeApplicationname(appname) {
		var transaction = databaseroot.transaction([appStoreName], "readwrite");
		transaction.oncomplete = function(event) {
		};
		transaction.onerror = function(event) {
		};
		// Get the datastore.
		var objStore = transaction.objectStore(appStoreName);
		objStore.put({
			'appName' : appname
		});
	}


	this.writeLog = function(level, log) {
		if(!log){
			return;
		}
		if(!databaseroot){
			logArray[logArray.length] = log;
			return;
		}
		log = log + "\r\n";
		var transaction = databaseroot.transaction([logStoreName], "readwrite");
		transaction.oncomplete = function(event) {
		};
		transaction.onerror = function(event) {
		};
		var objStore = transaction.objectStore(logStoreName);
		objStore.put({
			'appName'	: applicationName,
			'storetime'	: 0,
			'level'		: level,
			'logstring'	: log
		});
	};
	
	function readLog(logElement){
		if(!databaseroot){
			return;
		}
		var objectStore = databaseroot.transaction([appStoreName], "readonly").objectStore(appStoreName);
		objectStore.openCursor().onsuccess = function(event) {
			var cursor = event.target.result;
			if (cursor) {
				readApplicationlog(cursor.value.appName , logElement);
				cursor.continue();
			}
		};
	};
	
	this.readLog = readLog;
	function readApplicationlog( appname , element){
		var objectStore = databaseroot.transaction([logStoreName], "readonly").objectStore(logStoreName);
		var index = objectStore.index("by_name");
		var dataArray =[];
		index.openCursor(IDBKeyRange.only(appname)).onsuccess = function(event) {
			var cursor = event.target.result;
			if (cursor) {
				cursor.continue();
				dataArray[dataArray.length] = cursor.value.logstring + "\n";
			} else {
				createDBDownloadLink(dataArray,appname);
			}
		};
	}
	
	function createDBDownloadLink(array, appname){
		var blob = new Blob(array, {type: 'text/plain'});
		var DownloadAttributeSupport = 'download' in document.createElement('a');
		
		var displayName = appname.split(fileLogDelimiter)[0];
		var timeStamp= appname.split(fileLogDelimiter)[1];
		var date= new Date(parseInt(timeStamp));
		var fileName = getLogFileName(displayName,date);
		
		if(logFilesList[appname]!== undefined)
		{
			if(logFilesList[appname] === blob.size)
			{
				return;
			}
			else
			{
				var anchor = document.getElementById(appname);
				if(anchor)
				{
					if(!navigator.msSaveOrOpenBlob)
					{						
						window.URL.revokeObjectURL(anchor.href);
					}
					logFilesList[appname] = blob.size;
					if (navigator.msSaveOrOpenBlob) {
						anchor.href = "#";
						anchor.name = fileName; //to be deleted
						anchor.onclick = function(e) { 
							navigator.msSaveOrOpenBlob(blob, fileName);
							e.preventDefault();
						};
					} else {
						// add the link anyway so that url can be opened in safari
						anchor.href = URL.createObjectURL(blob);
						if (DownloadAttributeSupport == true) {
							anchor.download = fileName;
						}
					}
					return;
				}
			}
		}
		/* if(isDBDownloadLinkPresent(appname))
			return; */
		logFilesList[appname] = blob.size;
		
		var li = document.createElement("li");
		li.className = "log-list-item";
		
		var display = document.createElement("span");
		display.className = "log-display";
		display.innerHTML = getLogDisplayName(displayName, date);
		li.appendChild(display);

		var a = document.createElement("a");			
		a.className = "log-download";
		a.id = appname;
		
		if (navigator.msSaveOrOpenBlob) {
			a.href = "#";
			a.name = fileName; //to be deleted
			a.onclick = function(e) { 
				navigator.msSaveOrOpenBlob(blob, fileName);
				e.preventDefault();
			};
		} else {
			// add the link anyway so that url can be opened in safari
			a.href = URL.createObjectURL(blob);
			if (DownloadAttributeSupport == true) {
				a.download = fileName;
			}
		}
		a.style.visibility = "hidden";
		
		
		var fileList=document.getElementById("log-files-list");
		if(!fileList)
		{
			fileList=document.createElement('ul');
			fileList.id = 'log-files-list';
			document.getElementById("log-files").appendChild(fileList);
		}
		
		var delBtn = document.createElement("a");
		delBtn.className = "log-delete";
		delBtn.addEventListener("click", function(e) {
			var objLogStore = databaseroot.transaction([appStoreName], "readwrite");
			var clrLogStore = objLogStore.objectStore(appStoreName);
			var index = clrLogStore.index("by_name");
			index.openCursor(IDBKeyRange.only(appname)).onsuccess = function(event) {
				var delreq = clrLogStore.delete(appname);
				delreq.onsuccess = function(evt){
					li.parentNode.removeChild(li);
					if(fileList.childNodes.length ==0)
					{
						document.getElementById("log-clear").style.visibility = "hidden";
					}
					delete logFilesList[appname];
				};
				delreq.onerror = function(evt){
					console.log("Error in deleting the file from db");
				}; 
			};					
		}, false);
		
		delBtn.style.visibility = "hidden";
		li.appendChild(delBtn);
		li.appendChild(a);
		
		li.onmouseover = function(evt) {
			a.style.visibility = "visible";
			delBtn.style.visibility = "visible";
		};
		li.onmouseout = function(evt) {
			a.style.visibility = "hidden";
			delBtn.style.visibility = "hidden";
		};

		fileList.appendChild(li);
		document.getElementById("log-clear").style.visibility = "visible";
	}
}


function generateReadLogPage(){

	document.getElementById("log-label").innerHTML = LogEngine.i18n.getMessage("logFiles");
	document.getElementById("log-clear").innerHTML = LogEngine.i18n.getMessage("clearLogs");	
	CheckLogging();
	document.getElementById("log-start").addEventListener("click", ToggleLogging);
	document.getElementById("log-clear").style.visibility = "hidden";
	document.getElementById("log-clear").addEventListener("click",clearAndDeleteLogs,false);
		
	readHTML5Log();
	setInterval(function() {readHTML5Log();},5000);	 
}

//Downloads the dependent files. SDK launcher file sets the path when launched through API.
function loadDependentFiles(path){
	/*Single css file is shared between sessions and log page. For sessions we need background color to be black. Hence, 
	overriding the log page background to white for log page*/
	var htmlElement = document.getElementsByTagName("html");
	if(htmlElement && htmlElement[0]){
		htmlElement[0].style.backgroundColor = "white";
	}
	/*Create the div elements required and append to body. 
	This is moved to JS so that log page is constructed dynamically when we need to open through HDX HTML5 SDK.*/

	document.body.innerHTML += '<div id="logMainDiv">'+
		'<div id= "logContentsDiv">'+
			'<div class="log-label" id="log-label"></div>'+
			'<div class="log-files" id="log-files">'+
				'<ul class="log-files-list" id="log-files-list"></ul>'+
			'</div>'+
			'<div id="logsBtnContainer">'+
				'<button class="log-button" id="log-start"></button>'+
				'<button class="log-button" id="log-clear"></button>'+
			'</div>'+
		'</div>'+
	'</div>';
			
	//Adding the CSS file
	var head  = document.getElementsByTagName('head')[0];
	var link  = document.createElement('link');
	link.rel  = 'stylesheet';
	link.type = 'text/css';
	link.href = path['sourcecode']['csspath']+"ctxs.mainstyle.css";
	link.media = "all";
	head.appendChild(link);

	var thirdPartyPath = path['sourcecode']['thirdpartypath'] +"i18n/";
	var localizationpath = path['sourcecode']['localizationpath'];
			
	var files = [thirdPartyPath+"i18next-3.1.0.min.js",localizationpath+"en.js"];
	
	loadScripts(files,langFileLoaded);
			
	function langFileLoaded() {
		var lang = navigator.language;
		if(lang==null || lang==undefined){
			lang = navigator.browserLanguage; //IE 10 returns navigator.language as undefined.
		}		
	
		if (!lang) {
            lang = 'en';
        }
        
		lang = (lang.split("-")[0]).toLowerCase();
		var url = localizationpath + lang +".js";
		var resources = {};
				
		if(lang == "en"){
			resources[lang] = {"translation" : localeString};
			LogEngine.i18n.init(lang,resources,i18nLoadedInLog);
		}else{
			var xobj = new XMLHttpRequest();
			xobj.overrideMimeType("text/javascript");
			xobj.open('GET', url, true); 
			xobj.onerror = function(e){
				console.log("error in ajax",e);
				resources[lang] = {"translation" : localeString};
				LogEngine.i18n.init(lang,resources,i18nLoadedInLog);
			};
		
			xobj.onreadystatechange = function () {
				if (xobj.readyState == 4){
					lang = (xobj.status == "200") ? lang : "en";				  						
					try{
						var translationJSON = (xobj.status == "200") ? (JSON.parse(xobj.responseText)) : localeString;						
						resources[lang] = {"translation" : translationJSON};	
					}catch(e){
						lang = "en";
						resources[lang] = {"translation" : localeString};	
					}
					LogEngine.i18n.init(lang,resources,i18nLoadedInLog);					
				}		
			};
			xobj.send(null);
		}
    }
	function loadScripts(files,callback) {
		var count = files.length;
		var totalLoaded = 0;
		
		function onloadEnd() {
			totalLoaded++;
			if (totalLoaded === count) {
				callback();
			}
		}
				
		for(var i=0;i< files.length; i++){
			var script = document.createElement('script');
			script.onload = onloadEnd;
			script.onerror = onloadEnd;
			script.async = false;
			script.src =files[i] ;
			script.type = "text/javascript";
			document.body.appendChild(script);
		}
	}
	
	function i18nLoadedInLog(){				
		generateReadLogPage();
	}
}
try{
	var url = window.location.href;
	var logPage = /viewLog.html/i;
	var found = url.search(logPage);
	if( found >= 0) {
		window.onload = function(){
			if (window.chrome && window.chrome.app && window.chrome.app.window) {
				document.body.style.margin = "0";
				document.body.style.padding = "0";
			} else {
				document.body.className = "log-page";
			}			
			
			//Setting the default path - Launching through RFWEb and chrome app
			var path = {
				'sourcecode' : {                                     
					'localizationpath' : "../locales/",              // locales folder path
					'thirdpartypath' : "../ThirdPartyLibrary/",       // 3rd party lib path
					'csspath' : "../CascadingStyleSheet/"             // css folder path            
                }
			};
			loadDependentFiles(path);
		};
	} else {
	}
		
} catch(err){
};

function DummyLogger( )
{
	this.setAppName 	=	function(appName){
			
	};
	
	this.clearLogs = function(){
		
	};

	this.initLog = function(type){
		
	};
	this.writeLog = function(level ,logs){
		console.log(logs);
	};
	this.readLog = function(){
	};
	
}
// Create Log Object based on the supported mechanism.
// Uses file API or Index DB.

if (self.requestFileSystem) {
	html5Logger = new fileLogAPI();
} else if(self.indexedDB) {
	html5Logger = new IndexDBLog();
}else{
	html5Logger = new DummyLogger();
}


// wrap local storage for regular html5 and Chrome app
if ( typeof importScripts === 'undefined') {
	if (!window.HTML5Engine) {
		window.HTML5Engine = {};
		if (!window.chrome || !window.chrome.storage) {
				if (self && !self.ctxLocalStorage) {
					try {
						if (!self.localStorage) {
							self.ctxLocalStorage = {};
						} else {
							self.ctxLocalStorage = localStorage;
						}
					} catch (ex) {
					  console.error(ex);
					  self.ctxLocalStorage = {};
					}
				}
				HTML5Engine.localStorage = {
					getItem: function(key, callback) {
						try{
							var result = {};
							// if it is array, then get value for each of them
							if (Array.isArray(key)) {
								for (var i=0; i< key.length;i++) {
									var keyName = key[i];
									result[keyName] = self.ctxLocalStorage[keyName];
								}
							} else {
								result[key] = self.ctxLocalStorage[key];
							}
							
							callback && callback(result);
						}catch(ex){							
						}
					},
					setItem: function(key, val) {
						try{
							self.ctxLocalStorage[key] = val;
						}catch(ex){
						}
					}
				};
			
		} else {
			HTML5Engine.localStorage = {
				getItem: function(key, callback) {
					chrome.storage.local.get(key, callback);
				},
				setItem: function(key, val) {
					var temp = {};
					temp[key] = val;
					chrome.storage.local.set(temp);
				}
			};
		}
	}
}

function ToggleLogging() {
	HTML5Engine.localStorage.getItem("LOGENABLED" , function(result){
		if(result["LOGENABLED"] === "true"){
			document.getElementById("log-start").innerHTML = LogEngine.i18n.getMessage("startLogging");
			HTML5Engine.localStorage.setItem("LOGENABLED", "false");
			if(window.top)
				window.top.html5LogEnabled = false;
			console.log("Logging is disabled now");
		} else {
			document.getElementById("log-start").innerHTML = LogEngine.i18n.getMessage("stopLogging");
			HTML5Engine.localStorage.setItem("LOGENABLED", "true");
			console.log("Logging is enabled now");		
			if(window.top)	
				window.top.html5LogEnabled = true;
		}
	});
}

function CheckLogging() {
	// change text name based on logging enabled or not.
	HTML5Engine.localStorage.getItem("LOGENABLED" , function(result){
		if(result["LOGENABLED"] === "true"){
			document.getElementById("log-start").innerHTML = LogEngine.i18n.getMessage("stopLogging");
			console.log("Logging was enabled");
		} else {
			document.getElementById("log-start").innerHTML = LogEngine.i18n.getMessage("startLogging");
			console.log("Logging was disabled");
		}
	});
}

function getLogDisplayName(appName, date)
{
	var dateString = appName+ " "; 
	dateString += (((parseInt(date.getMonth())+1)<10)?"0"+(parseInt(date.getMonth())+1):(parseInt(date.getMonth())+1)) +"/" ;
	dateString += ((date.getDate()<10)?"0"+date.getDate():date.getDate()) + "/" ;
	dateString += date.getFullYear() +"    " ;
	dateString += ((date.getHours()<10)?"0"+date.getHours():date.getHours()) + ":" ;
	dateString += ((date.getMinutes()<10)?"0"+date.getMinutes():date.getMinutes()) + ":" ;
	dateString += ((date.getSeconds()<10)?"0"+date.getSeconds():date.getSeconds())  ;
	return dateString;
}

function getLogFileName(appName, date){
	var dateString = appName + " (";
	dateString += (((parseInt(date.getMonth())+1)<10)?"0"+(parseInt(date.getMonth())+1):(parseInt(date.getMonth())+1)) +"-" ;
	dateString += ((date.getDate()<10)?"0"+date.getDate():date.getDate()) + "-" ;
	dateString += date.getFullYear() +"-" ;
	dateString += ((date.getHours()<10)?"0"+date.getHours():date.getHours()) + "-" ;
	dateString += ((date.getMinutes()<10)?"0"+date.getMinutes():date.getMinutes()) + "-" ;
	dateString += ((date.getSeconds()<10)?"0"+date.getSeconds():date.getSeconds()) +")" + ".txt" ;
	return dateString;
}

/*TODO : Move the code below to a common file while refactoring the code for service workers. 
Below code should be present before the connection to the server. 
*/
LogEngine.i18n.init = function(lang, resources,callback){
	var i18nOptions = {            
		"useCookie" : false,
		"debug" : true,
		"lowerCaseLng" : true,
		"fallbackLng" : 'en',
		"lng" : lang,			
		"resources": resources,
		"interpolation": {"prefix": '__', "suffix": '__'},
		onerror : function() {
			callback();
		}
	};					
				
	i18next.init(i18nOptions, function() {	
		callback();
	});
};

LogEngine.i18n.getMessage = function(str,keyobj){
	if(!i18next || !i18next.t){
		if ((!localeString[str]) === true) {
            return str;
        } else {
			var rstr = localeString[str];
			if ( typeof keyobj === "Object")
				for (var k in keyobj) {
					var regex = new RegExp('__' + k + '__', 'g');
					rstr = rstr.replace(regex, keyobj[k]);
				}
			return rstr;
		}
	}
	if(str){
		if(keyobj){
			return i18next.t(str,keyobj);	
		}
		return i18next.t(str);	
	}
}