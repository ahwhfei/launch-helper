function AUDIOPLAYERCONSTANT() {}
AUDIOPLAYERCONSTANT.MOZILLAPLAYER = 0;
AUDIOPLAYERCONSTANT.WEBAUDIOPLAYER = 1;
var audio_no_ofqueue = 5 ;
var audio_COMMAND_BUFFER_COUNT = 0x40;
var audio_data_buffer_perqueue = 8 ;
var audio_size_perdatabuffer = 0x7fff ;
var audio_DATA_BUFFER_COUNT    = 0x40;
var audio_queue_length =   audio_data_buffer_perqueue * audio_size_perdatabuffer  ;
var audio_MAX_DATA_SIZE = audio_no_ofqueue * audio_queue_length ;

var Audio_SUBFMT_LINEAR_PCM_8kHz	        = 0x0000 ;
var Audio_SUBFMT_LINEAR_PCM_11kHz           = 0x0001 ;
var Audio_SUBFMT_LINEAR_PCM_22kHz           = 0x0002 ;
var Audio_SUBFMT_LINEAR_PCM_44kHz           = 0x0003 ;
var Audio_LINEAR_PCM_8kHz	                = 8000 ;
var Audio_LINEAR_PCM_11kHz                  = 11025 ;
var Audio_LINEAR_PCM_22kHz                  = 22050 ;
var Audio_LINEAR_PCM_44kHz                  = 44100 ;
var Audio_SUBFMT_LINEAR_PCM_MASK_RATE       = 0x0003 ;

var Audio_SUBFMT_LINEAR_PCM_MONO	        = 0x0000 ;
var Audio_SUBFMT_LINEAR_PCM_STEREO	        = 0x0010 ;
var Audio_LINEAR_PCM_MONO	                = 1 ;
var Audio_LINEAR_PCM_STEREO	                = 2 ;
var Audio_SUBFMT_LINEAR_PCM_MASK_CHANNELS   = 0x0010 ;

var Audio_SUBFMT_LINEAR_PCM_8_BIT	        = 0x0000 ;
var Audio_SUBFMT_LINEAR_PCM_16_BIT	        = 0x0100 ;
var Audio_LINEAR_PCM_8_BIT	                = 8 ;
var Audio_LINEAR_PCM_16_BIT	                = 16 ;
var Audio_SUBFMT_LINEAR_PCM_MASK_DEPTH      = 0x0100 ;


var Audio_SUBFMT_CTX_VORBIS_Q0 	= 0x0000 ;
var Audio_SUBFMT_CTX_VORBIS_Q1 	= 0x0001 ;
var Audio_SUBFMT_CTX_VORBIS_Q2 	= 0x0002 ;
var Audio_SUBFMT_CTX_VORBIS_Q3 	= 0x0003 ;
var Audio_SUBFMT_CTX_VORBIS_Q4 	= 0x0004 ;
var Audio_SUBFMT_CTX_VORBIS_Q5 	= 0x0005 ;
var Audio_SUBFMT_CTX_VORBIS_Q6 	= 0x0006 ;
var Audio_SUBFMT_CTX_VORBIS_Q7 	= 0x0007 ;
var Audio_SUBFMT_CTX_VORBIS_Q8 	= 0x0008 ;
var Audio_SUBFMT_CTX_VORBIS_Q9 	= 0x0009 ;
var Audio_SUBFMT_CTX_VORBIS_Q10	= 0x000a ;
var Audio_SUBFMT_CTX_VORBIS_MASK_QUALITY = 0x000F ;

var Audio_SUBFMT_CTX_VORBIS_MONO         =	0x0010 ;
var Audio_SUBFMT_CTX_VORBIS_STEREO       =	0x0020 ;
var Audio_VORBIS_MONO         =	1 ;
var Audio_VORBIS_STEREO       =	2 ;
var Audio_SUBFMT_CTX_VORBIS_MASK_CHANNELS =	0x00F0 ;
var audio_vorbis_samplerate = 44100 ;

var Audio_SUBFMT_CTX_SPEEX_Q0 	= 0x0000 ;
var Audio_SUBFMT_CTX_SPEEX_Q1 	= 0x0001 ;
var Audio_SUBFMT_CTX_SPEEX_Q2 	= 0x0002 ;
var Audio_SUBFMT_CTX_SPEEX_Q3 	= 0x0003 ;
var Audio_SUBFMT_CTX_SPEEX_Q4 	= 0x0004 ;
var Audio_SUBFMT_CTX_SPEEX_Q5 	= 0x0005 ;
var Audio_SUBFMT_CTX_SPEEX_Q6 	= 0x0006 ;
var Audio_SUBFMT_CTX_SPEEX_Q7 	= 0x0007 ;
var Audio_SUBFMT_CTX_SPEEX_Q8 	= 0x0008 ;
var Audio_SUBFMT_CTX_SPEEX_Q9 	= 0x0009 ;
var Audio_SUBFMT_CTX_SPEEX_Q10	= 0x000a ;
var Audio_SUBFMT_CTX_SPEEX_MASK_QUALITY = 0x000F ;

var Audio_SUBFMT_CTX_SPEEX_NARROWBAND		= 0x0000 ; //8khz
var Audio_SUBFMT_CTX_SPEEX_WIDEBAND         = 0x0100 ; //16khz
var Audio_SUBFMT_CTX_SPEEX_ULTRAWIDWBAND 	= 0x0200 ; //32khz(not supported)
var Audio_SUBFMT_CTX_SPEEX_MASK_BAND      =  0x0F00;
var Audio_SUBFMT_CTX_SPEEX_MONO         =	0x0010 ;
var Audio_SUBFMT_CTX_SPEEX_STEREO       =	0x0020 ;  //not supported
var Audio_SUBFMT_CTX_SPEEX_MASK_CHANNELS =	0x00F0 ;

var no_of_format = 6 ;
var FORMAT_NONE	        = 0x0000 ;
var FORMAT_LINEAR_PCM	= 0x0001 ;
var FORMAT_CTX_ADPCM	= 0x0002 ;
var FORMAT_CTX_ADPCM_EX	= 0x0003 ;
var FORMAT_CTX_VORBIS	= 0x0004 ;
var FORMAT_CTX_SPEEX	= 0x0005 ;


 /* used for quick comparisons */
  /* these are sorted in highest quality to lowest */
var pcm_supportArray = new Int32Array( 16 );
var		PCM_44K_16B_STER = pcm_supportArray[0]  =(  Audio_SUBFMT_LINEAR_PCM_44kHz | Audio_SUBFMT_LINEAR_PCM_16_BIT | Audio_SUBFMT_LINEAR_PCM_STEREO );
var		PCM_44K_16B_MONO = pcm_supportArray[1]  =(  Audio_SUBFMT_LINEAR_PCM_44kHz | Audio_SUBFMT_LINEAR_PCM_16_BIT | Audio_SUBFMT_LINEAR_PCM_MONO );
var		PCM_44K_8B_STER  = pcm_supportArray[2]  =(  Audio_SUBFMT_LINEAR_PCM_44kHz | Audio_SUBFMT_LINEAR_PCM_8_BIT  | Audio_SUBFMT_LINEAR_PCM_STEREO );
var		PCM_44K_8B_MONO  = pcm_supportArray[3]  =(  Audio_SUBFMT_LINEAR_PCM_44kHz | Audio_SUBFMT_LINEAR_PCM_8_BIT  | Audio_SUBFMT_LINEAR_PCM_MONO );
var		PCM_22K_16B_STER = pcm_supportArray[4]  =(  Audio_SUBFMT_LINEAR_PCM_22kHz | Audio_SUBFMT_LINEAR_PCM_16_BIT | Audio_SUBFMT_LINEAR_PCM_STEREO );
var		PCM_22K_16B_MONO = pcm_supportArray[5]  =(  Audio_SUBFMT_LINEAR_PCM_22kHz | Audio_SUBFMT_LINEAR_PCM_16_BIT | Audio_SUBFMT_LINEAR_PCM_MONO );
var		PCM_22K_8B_STER  = pcm_supportArray[6]  =(  Audio_SUBFMT_LINEAR_PCM_22kHz | Audio_SUBFMT_LINEAR_PCM_8_BIT  | Audio_SUBFMT_LINEAR_PCM_STEREO );
var		PCM_22K_8B_MONO  = pcm_supportArray[7]  =(  Audio_SUBFMT_LINEAR_PCM_22kHz | Audio_SUBFMT_LINEAR_PCM_8_BIT  | Audio_SUBFMT_LINEAR_PCM_MONO ); 
var		PCM_11K_16B_STER = pcm_supportArray[8]  =(  Audio_SUBFMT_LINEAR_PCM_11kHz | Audio_SUBFMT_LINEAR_PCM_16_BIT | Audio_SUBFMT_LINEAR_PCM_STEREO );
var		PCM_11K_16B_MONO = pcm_supportArray[9]  =(  Audio_SUBFMT_LINEAR_PCM_11kHz | Audio_SUBFMT_LINEAR_PCM_16_BIT | Audio_SUBFMT_LINEAR_PCM_MONO ); 
var		PCM_11K_8B_STER  = pcm_supportArray[10] =(  Audio_SUBFMT_LINEAR_PCM_11kHz | Audio_SUBFMT_LINEAR_PCM_8_BIT  | Audio_SUBFMT_LINEAR_PCM_STEREO );
var		PCM_11K_8B_MONO  = pcm_supportArray[11] =(  Audio_SUBFMT_LINEAR_PCM_11kHz | Audio_SUBFMT_LINEAR_PCM_8_BIT  | Audio_SUBFMT_LINEAR_PCM_MONO ); 
var		PCM_8K_16B_STER  = pcm_supportArray[12] =(  Audio_SUBFMT_LINEAR_PCM_8kHz  | Audio_SUBFMT_LINEAR_PCM_16_BIT | Audio_SUBFMT_LINEAR_PCM_STEREO ); 
var		PCM_8K_16B_MONO  = pcm_supportArray[13] =(  Audio_SUBFMT_LINEAR_PCM_8kHz  | Audio_SUBFMT_LINEAR_PCM_16_BIT | Audio_SUBFMT_LINEAR_PCM_MONO );
var		PCM_8K_8B_STER   = pcm_supportArray[14] =(  Audio_SUBFMT_LINEAR_PCM_8kHz  | Audio_SUBFMT_LINEAR_PCM_8_BIT  | Audio_SUBFMT_LINEAR_PCM_STEREO );
var		PCM_8K_8B_MONO   = pcm_supportArray[15] =(  Audio_SUBFMT_LINEAR_PCM_8kHz  | Audio_SUBFMT_LINEAR_PCM_8_BIT  | Audio_SUBFMT_LINEAR_PCM_MONO );

var vorbisSupportArray = new Int32Array(20 );
var VORBIS_Q10_STER = vorbisSupportArray[0] = ( Audio_SUBFMT_CTX_VORBIS_STEREO | Audio_SUBFMT_CTX_VORBIS_Q10 );
var VORBIS_Q10_MONO = vorbisSupportArray[1] = ( Audio_SUBFMT_CTX_VORBIS_MONO | Audio_SUBFMT_CTX_VORBIS_Q10 );
var VORBIS_Q9_STER = vorbisSupportArray[2] = ( Audio_SUBFMT_CTX_VORBIS_STEREO | Audio_SUBFMT_CTX_VORBIS_Q9 );
var VORBIS_Q9_MONO = vorbisSupportArray[3] = ( Audio_SUBFMT_CTX_VORBIS_MONO | Audio_SUBFMT_CTX_VORBIS_Q9 );
var VORBIS_Q8_STER = vorbisSupportArray[4] = ( Audio_SUBFMT_CTX_VORBIS_STEREO | Audio_SUBFMT_CTX_VORBIS_Q8 );
var VORBIS_Q8_MONO = vorbisSupportArray[5] = ( Audio_SUBFMT_CTX_VORBIS_MONO | Audio_SUBFMT_CTX_VORBIS_Q8 );
var VORBIS_Q7_STER = vorbisSupportArray[6] = ( Audio_SUBFMT_CTX_VORBIS_STEREO | Audio_SUBFMT_CTX_VORBIS_Q7 );
var VORBIS_Q7_MONO = vorbisSupportArray[7] = ( Audio_SUBFMT_CTX_VORBIS_MONO | Audio_SUBFMT_CTX_VORBIS_Q7 );
var VORBIS_Q6_STER = vorbisSupportArray[8] = ( Audio_SUBFMT_CTX_VORBIS_STEREO | Audio_SUBFMT_CTX_VORBIS_Q6 );
var VORBIS_Q6_MONO = vorbisSupportArray[9] = ( Audio_SUBFMT_CTX_VORBIS_MONO | Audio_SUBFMT_CTX_VORBIS_Q6 );
var VORBIS_Q5_STER = vorbisSupportArray[10] = ( Audio_SUBFMT_CTX_VORBIS_STEREO | Audio_SUBFMT_CTX_VORBIS_Q5 );
var VORBIS_Q5_MONO = vorbisSupportArray[11] = ( Audio_SUBFMT_CTX_VORBIS_MONO | Audio_SUBFMT_CTX_VORBIS_Q5 );
var VORBIS_Q4_STER = vorbisSupportArray[12] = ( Audio_SUBFMT_CTX_VORBIS_STEREO | Audio_SUBFMT_CTX_VORBIS_Q4 );
var VORBIS_Q4_MONO = vorbisSupportArray[13] = ( Audio_SUBFMT_CTX_VORBIS_MONO | Audio_SUBFMT_CTX_VORBIS_Q4 );
var VORBIS_Q3_STER = vorbisSupportArray[14] = ( Audio_SUBFMT_CTX_VORBIS_STEREO | Audio_SUBFMT_CTX_VORBIS_Q3 );
var VORBIS_Q3_MONO = vorbisSupportArray[15] = ( Audio_SUBFMT_CTX_VORBIS_MONO | Audio_SUBFMT_CTX_VORBIS_Q3 );
var VORBIS_Q2_STER = vorbisSupportArray[16] = ( Audio_SUBFMT_CTX_VORBIS_STEREO | Audio_SUBFMT_CTX_VORBIS_Q2 );
var VORBIS_Q2_MONO = vorbisSupportArray[17] = ( Audio_SUBFMT_CTX_VORBIS_MONO | Audio_SUBFMT_CTX_VORBIS_Q2 );
var VORBIS_Q1_STER = vorbisSupportArray[18] = ( Audio_SUBFMT_CTX_VORBIS_STEREO | Audio_SUBFMT_CTX_VORBIS_Q1 );
var VORBIS_Q1_MONO = vorbisSupportArray[19] = ( Audio_SUBFMT_CTX_VORBIS_MONO | Audio_SUBFMT_CTX_VORBIS_Q1 );

var speexSupportArray = new Int32Array(22);
var SPEEX_Q10_MONO_NARROWBAND = speexSupportArray[0] = (Audio_SUBFMT_CTX_SPEEX_NARROWBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q10);
var SPEEX_Q10_MONO_WIDEBAND = speexSupportArray[1] = (Audio_SUBFMT_CTX_SPEEX_WIDEBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q10);
var SPEEX_Q9_MONO_NARROWBAND = speexSupportArray[2] = (Audio_SUBFMT_CTX_SPEEX_NARROWBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q9);
var SPEEX_Q9_MONO_WIDEBAND = speexSupportArray[3] = (Audio_SUBFMT_CTX_SPEEX_WIDEBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q9);
var SPEEX_Q8_MONO_NARROWBAND = speexSupportArray[4] = (Audio_SUBFMT_CTX_SPEEX_NARROWBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q8);
var SPEEX_Q8_MONO_WIDEBAND = speexSupportArray[5] = (Audio_SUBFMT_CTX_SPEEX_WIDEBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q8);
var SPEEX_Q7_MONO_NARROWBAND = speexSupportArray[6] = (Audio_SUBFMT_CTX_SPEEX_NARROWBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q7);
var SPEEX_Q7_MONO_WIDEBAND = speexSupportArray[7] = (Audio_SUBFMT_CTX_SPEEX_WIDEBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q7);
var SPEEX_Q6_MONO_NARROWBAND = speexSupportArray[8] = (Audio_SUBFMT_CTX_SPEEX_NARROWBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q6);
var SPEEX_Q6_MONO_WIDEBAND = speexSupportArray[9] = (Audio_SUBFMT_CTX_SPEEX_WIDEBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q6);
var SPEEX_Q5_MONO_NARROWBAND = speexSupportArray[10] = (Audio_SUBFMT_CTX_SPEEX_NARROWBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q5);
var SPEEX_Q5_MONO_WIDEBAND = speexSupportArray[11] = (Audio_SUBFMT_CTX_SPEEX_WIDEBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q5);
var SPEEX_Q4_MONO_NARROWBAND = speexSupportArray[12] = (Audio_SUBFMT_CTX_SPEEX_NARROWBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q4);
var SPEEX_Q4_MONO_WIDEBAND = speexSupportArray[13] = (Audio_SUBFMT_CTX_SPEEX_WIDEBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q4);
var SPEEX_Q3_MONO_NARROWBAND = speexSupportArray[14] = (Audio_SUBFMT_CTX_SPEEX_NARROWBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q3);
var SPEEX_Q3_MONO_WIDEBAND = speexSupportArray[15] = (Audio_SUBFMT_CTX_SPEEX_WIDEBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q3);
var SPEEX_Q2_MONO_NARROWBAND = speexSupportArray[16] = (Audio_SUBFMT_CTX_SPEEX_NARROWBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q2);
var SPEEX_Q2_MONO_WIDEBAND = speexSupportArray[17] = (Audio_SUBFMT_CTX_SPEEX_WIDEBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q2);
var SPEEX_Q1_MONO_NARROWBAND = speexSupportArray[18] = (Audio_SUBFMT_CTX_SPEEX_NARROWBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q1);
var SPEEX_Q1_MONO_WIDEBAND = speexSupportArray[19] = (Audio_SUBFMT_CTX_SPEEX_WIDEBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q1);
var SPEEX_Q0_MONO_NARROWBAND = speexSupportArray[20] = (Audio_SUBFMT_CTX_SPEEX_NARROWBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q0);
var SPEEX_Q0_MONO_WIDEBAND = speexSupportArray[21] = (Audio_SUBFMT_CTX_SPEEX_WIDEBAND | Audio_SUBFMT_CTX_SPEEX_MONO | Audio_SUBFMT_CTX_SPEEX_Q0);

var in_audioformatsubformatArray = new Array( no_of_format ); 
in_audioformatsubformatArray[0] = null ;
in_audioformatsubformatArray[1] = pcm_supportArray ;
in_audioformatsubformatArray[4] = vorbisSupportArray ;
in_audioformatsubformatArray[5] = speexSupportArray ;

var audio_support_array = [ [] ,   [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] , [],[],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21] ] ;
