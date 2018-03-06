function CaptureDevice(engine) {
    
    // MMX Commands for video
    var MMX_STREAM_INIT		= 0;
    var MMX_STREAM_EXIT		= 1;

    // MMX Control commands
    var MMX_CONTROL_PLAY	= 10;
    var MMX_CONTROL_PAUSE	= 11;
    var MMX_CONTROL_STOP	= 12;
    
    'use strict';

    // TODO: declare once common for engine and capture device
    var UNKNOWN_FORMAT = 0,
        THEORA_FORMAT = 1,
        H264_FORMAT = 2;

    // private variables
    var videoSources = [],
        videoElement = null,
        startCallback = null,
        width = 352, // default
        height = 288, // default        
        videoFrameFormat = 2,  // I420 - 2
        prefEncodeFormat = 1,  // 1 - Theora, 2 - H264
        prefVideoProfile = 0,  // H264 0-base, 1-main, 2-extended, 3-high
        frameRate = 10,        
        quality = 16,
        bitRate = 160000,
        enableThread = false
        
        constraints = {
            video: {
                optional: [{
                }]
            },
            width: width,
            height: height
        },
        videoURL = null,
        videoTrack = null;

    var CH_MMEDIA_VIDEO	= 2;
    var ctxModule = document.getElementById("CitrixRenderElement");
        
    navigator.getMedia = (navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);

    if (HTML5_CONFIG['nacl'] && HTML5_CONFIG['nacl']['video'] && HTML5_CONFIG['nacl']['video']['config']) {
        videoFrameFormat = HTML5_CONFIG['nacl']['video']['config']['videoFrameFormat'] || 2;  // I420 - 2
        prefEncodeFormat = HTML5_CONFIG['nacl']['video']['config']['prefEncodeFormat'] || H264_FORMAT;   // 1 - Theora, 2 - H264
        prefVideoProfile = HTML5_CONFIG['nacl']['video']['config']['prefVideoProfile'] || 0;
        frameRate = HTML5_CONFIG['nacl']['video']['config']['frameRate'] || 4;
        quality = HTML5_CONFIG['nacl']['video']['config']['quality'] || 16;
        bitRate = HTML5_CONFIG['nacl']['video']['config']['bitRate'] || 160000;
        enableThread = HTML5_CONFIG['nacl']['video']['config']['enableThread'] || false;
    }
    
    var ctxWrapper = Utility.getCtxWrapper();
    ctxWrapper.setMessageHandler(CH_MMEDIA_VIDEO, ctxMessageHandler);
    function ctxMessageHandler(data) {
        if (data['header'] === true) {
            engine.mmvdSendContextResponse(data['buffer'], data["format"]);
        } else {
            engine.mmvdSendSampleToHost(data['buffer']);
        }
    };
    
    
    function postCtxMessage(msg) {
        if (ctxModule) {
            ctxModule.postMessage(msg)
        }
    }

    var CH_MMEDIA_VIDEO	= 2;
    // private methods
      
    
    function Device(majorHandle, minorHandle) {
      
        function onMediaSuccess(stream) {
            videoTrack = stream.getVideoTracks()[0];
            postCtxMessage({'channel': CH_MMEDIA_VIDEO, 
                            'cmd': MMX_CONTROL_PLAY,
                            'track': videoTrack,
                            'majorId': majorHandle,
                            'minorId': minorHandle});

            if (startCallback) {
                startCallback({
                    status: true,
                    stream: stream
                });
            }
        }
        
        function onMediaSuccess(stream) {
            videoTrack = stream.getVideoTracks()[0];
            postCtxMessage({'channel': CH_MMEDIA_VIDEO, 
                            'cmd': MMX_CONTROL_PLAY,
                            'track': videoTrack,
                            'majorId': majorHandle,
                            'minorId': minorHandle});

            if (startCallback) {
                startCallback({
                    status: true,
                    stream: stream
                });
            }
        }
        
        function onMediaError(error) {
            console.log(error);
            if (startCallback) {
                startCallback({
                    status: false,
                    stream: null
                });
            }
        }

        // public methods
        // enumerate list of capture devices
        this.getDeviceList = function getDeviceList(callback) {
            var getSources = MediaStreamTrack.getSources || function localGetSources(callback) {
                if (callback) {
                    callback([]); // send empty array to callback 
                }
            };

            getSources(function(sources) {
                sources.forEach(function(source, index) {
                    if (source.kind === 'video') {
                        videoSources.push({
                            id: source.id,
                            label: source.label || 'Camera ' + (videoSources.length + 1)
                        });
                    }
                });

                if (callback) {
                    callback(videoSources);
                }
            });
        };
        
         // stop the video stream track and release the hardware
        this.stop = function stop() {

            if (videoTrack) {
                videoTrack.stop();
                videoTrack = null;
            }

            postCtxMessage({'channel': CH_MMEDIA_VIDEO, 
                            'cmd': MMX_CONTROL_STOP, 
                            'majorId': majorHandle,
                            'minorId': minorHandle});

        };

        this.play = function play(deviceId, callback) {
            if (deviceId) {
                constraints['video']['optional']['0']['sourceId'] = deviceId;
            } else {
                constraints = {'video':true}; //, width:352, height:288};
            }
            startCallback = callback;
            navigator.webkitGetUserMedia({'audio': false, 'video': true}, onMediaSuccess, onMediaError);
        };

        this.pause = function pause() {
            postCtxMessage({'channel': CH_MMEDIA_VIDEO, 
                            'cmd': MMX_CONTROL_PAUSE,
                            'majorId': majorHandle,
                            'minorId': minorHandle});
        };      
    };

    this.initializeDevice = function initializeDevice(context) {    
        
        // if pref encode format is not theora then set it to H264 by default (only
        // if VDA supports H264), else set it to theora
        if ((prefEncodeFormat != THEORA_FORMAT) && context.mediaFormats & H264_FORMAT) {
            prefEncodeFormat = H264_FORMAT;
        } else {
            prefEncodeFormat = THEORA_FORMAT;
        }
        
        postCtxMessage({'channel': CH_MMEDIA_VIDEO, 
                       'cmd': MMX_STREAM_INIT,
                       
                       'videoFrameFormat': videoFrameFormat,    // I420 - 2
                       'encodeFormats': context.mediaFormats,
                       'prefEncodeFormat': prefEncodeFormat,    // 1 - Theora, 2 - H264
                       'prefVideoProfile': prefVideoProfile,    // depends on the encoder
                       'frameRate': frameRate,          //
                       'quality': quality,
                       'bitRate': bitRate,
                        
                       'enableThread': enableThread,
                       
                       // 'preferFormat: from configuration TODO
                       // 'preferProfile: from configuration TODO   // H264Baseline 0, main - 1, extended - 2, high - 3
                       
                       'width': width,    
                       'height': height,   
                       
                       'majorId': context.majorHandle,
                       'minorId': context.minorHandle});
                   
        context.device = new Device(context.majorHandle, context.minorHandle);
    };
        
    this.releaseDevice = function releaseDevice() {
         postCtxMessage({'channel': CH_MMEDIA_VIDEO, 
                       'cmd': MMX_STREAM_EXIT
                   });
    };  
}
