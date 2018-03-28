/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var Profiler;

// Profiler Namespace for all profiler related objects
(function Profiler(Profiler){
   
    // Ui Module 
    function Ui() {
        
        var isEnabled,
        monitorTable,
        profile = {},
        rowCount = 0,
        isLogEnabled = false;

        // Initialize once and use update method to add/update the monitoring field value
        function initialize(parentId) {
            isEnabled = HTML5_CONFIG['fpsMeter'] && HTML5_CONFIG['fpsMeter']['visibility'];
            if (!isEnabled){
            return;
            }

            isLogEnabled = HTML5_CONFIG['fpsMeter'] && HTML5_CONFIG['fpsMeter']['logMetrices'];

            var citrixSuperRenderCanvas = document.getElementById(parentId);
            var monitor = document.getElementById('ClientMonitor')
            if (!monitor) {
            monitor = document.createElement('div');
            monitor.id = "ClientMonitor" ;
            monitor.className = 'FpsDivElement';
            citrixSuperRenderCanvas.appendChild(monitor);
            }

            monitorTable = document.createElement('table');
            monitorTable.className = 'FPSTableElement';
            monitorTable.id = "FPSTable";
            monitor.appendChild(monitorTable);
        }
        
        // Add or update the monitoring field value
        function update(name, value) {
            var row;
            var fieldName;
            var fieldValue;

            if (!monitorTable) {
                // Monitor not initialized
                return;
            }

            if (!profile[name]) {
                profile[name] = {};
                profile[name]['field'] = name;
                profile[name]['row'] = rowCount;

                row = monitorTable.insertRow(rowCount);
                fieldName = row.insertCell(0);
                fieldName.innerHTML = name;
                fieldName.className = 'FPSTableLeftElement';

                fieldValue = row.insertCell(1);
                fieldValue.id = name;
                fieldValue.className = 'FPSTableRightElement';
                rowCount++;
            } else {
                row = monitorTable.rows[profile[name]['row']];
                fieldValue = row.cells[1];
            }

            profile[name]['value'] = value;
            fieldValue.innerHTML = value;

            // TODO: Type (Enhancement), Priority (medium)
            // Do not access file logger from profiler instead write the 
            // log data to memory and retrive it using appropriate mechanism (say
            // start/stop option from profiler to start/stop/save log data)
            //  
            isLogEnabled ? writeHTML5Log(0, name + " : " + value) : null;
        }
        
        function isEnabled() {
            isEnabled = HTML5_CONFIG['fpsMeter'] && HTML5_CONFIG['fpsMeter']['visibility'];
            return isEnabled;    
        }
        
        return {
            initialize: initialize,
            update: update,
            isEnabled: isEnabled
        };
    }
    
    // Configuration 
    function Config() {
        return {
            
        };
    }
        
    // Profiler Jpeg
    function Jpeg() {
        
    }
    
    // Profiler Stream
    function VStream(stream) {
        
        var timestamp;
        try {
            timestamp = performance.now.bind(performance);
        } catch (error) {
            timestamp = Date.now.bind(Date);
        }
        
        // Add wrapper to the public methods in Profilable Object
        function addProfiler(object) {
            for (var func in object) {
                if (object.hasOwnProperty(func) && object[func].profile) {
                    object[func] = addWrapper(object[func], object);
                }
            }
        }
        
        // Wrapper methods for the public methods in profilable object
        function addWrapper(func, object) {
            var totalTm = 0;
            return function() {
                var start, stop, result;
                // startProfiler
                start = timestamp();
                
                // return status of the thr profileFn
                result = func.apply(object, arguments);
                
                // stopProfiler
                stop = timestamp() - start;
                totalTm += stop;
                
                // TODO: put into memory logger
                //console.log("Execution Time of " + stream + ": " + func['name'] + ": " + stop.toFixed(2) + " ms. Total time spent : " + totalTm.toFixed(2) + " ms.");
                
                return result;
            }
        }
        
        this.addProfiler = addProfiler;
    }
    
    // Profile Thinwire Capability
    function ThinwireCapability() {
        
        var ThinwireProfile = Object.freeze(
            {
                Full: 0,
                Reduced: 1,
                H264: 2,
                H264PlusLossless: 3
            });
        
        var TwProfile = {};
            TwProfile[ThinwireProfile.Full] = "Full";
            TwProfile[ThinwireProfile.Reduced] = "Reduced";
            TwProfile[ThinwireProfile.H264] = "H.264";
            TwProfile[ThinwireProfile.H264PlusLossless] = "H.264 Lossless";

        // Add your own logic to profile the object
        function addProfiler(object) {
            for(var func in object) {
                if (object.hasOwnProperty(func) && object[func]["profile"]) {
                    object[func] = addWrapper(object[func], object);
                }
            }
        }
        
        function addWrapper(func, object) {
            return function() {
                var status;                
                // Call the original function (here parser)
                status = func.apply(object, arguments);
                
                // In case of ThinwireCapability profile the object to find 
                // the capabilities parser
                Profiler.Ui.update("TwProfile", TwProfile[object.thinwireProfile]);
                Profiler.Ui.update("DirtyRect", object.dirtyRegions);
            }
        }
        
        return {
            addProfiler: addProfiler
        };
    }
        
    // Stream recorder utility function for session virtual stream record and playback
    function StreamRecorder(unitSize) {
    
        var recordedSize = 0;
        var recordBuffer;    
        var unitId = 0;

        var recording = true;
        var stopRequested = false;

        if (!unitSize) {
            unitSize = 100 * 1024 * 1024;
            recordBuffer = new Uint8Array(unitSize);
        }

        function saveUnit() {
            var blob = new Blob([recordBuffer.subarray(0, recordedSize)], {type:"application/octet-binary"});
            var url = URL.createObjectURL(blob);
            console.log("Recorded unit " + unitId++ + " " + url);
        };
  
        this.record = function record(data, offset, len) {
            if (!recording)
                return;

            if (stopRequested) {
                saveUnit();
                recording = false;
                return;
            }

            // save the unit if len overflows the recordBuffer
            if (recordedSize + len > unitSize) {
                saveUnit();
                recordBuffer = new Uint8Array(unitSize);
            }

            for (var i = 0; i < len; i++) {
                recordBuffer[recordedSize + i] = data[offset + i];
            }

            recordedSize += len;
        };

        this.stop = function stop() {
            stopRequested = true;
        };

        this.save = function save() {
            saveUnit();
            recording = false;
        };
    }
    
    // Objects
    Profiler.Ui = Ui();
    //Profiler.Config = Config();
    
    // Contructor methods
    //Profiler.Jpeg = Jpeg;
    //Profiler.VStream = VStream;
    
    // Thinwire Profilers
    // Thinwire Capability
    //Profiler.ThinwireCapability = ThinwireCapability();
      
})(Profiler || (Profiler = {}));
