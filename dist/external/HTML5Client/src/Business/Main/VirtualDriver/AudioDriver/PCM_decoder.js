function PCMDecoder(  )
{
	var  bitsPerSample ;
	var bitAliasing ;
	var bitsUsed ;
	var divider ;
	var no_of_channel , sampleRate ;
	var type = (bitsPerSample + bitAliasing) >> 3 ;
	var decodeCallback;
	this.registerCallback = function(decodeCallback1)
	{
	 	decodeCallback = decodeCallback1;
	};
	this.decode = function(data,doNotDecodePCM)
	{
		if(doNotDecodePCM)
		{
			decodeCallback(data);
		}
		else
		{
			var dataLength = data.length;
			var decodedAudioLength = data.length ;
			if( bitsPerSample == 16 )
				decodedAudioLength =  decodedAudioLength / 2 ;
			var result = new Float32Array( decodedAudioLength );
   
			if( bitsPerSample == 16 )
			{
	           this.decodeSIGNED ( data ,  0 , dataLength , result );
	       
			}
			else
			{
				this.decodeUNSIGNED ( data ,  0 , dataLength , result );
	    
			}
		}
	};
	this.initialize = function ( no_of_channel1 , sampleRate1 , BitsPersample )
	{
		 bitsPerSample = BitsPersample ;
	 	 bitAliasing = (8 - (bitsPerSample & 7)) & 7;
	     bitsUsed = (bitsPerSample > 24) ? 0xFFFFFFFF : ((1 << (bitsPerSample + bitAliasing)) - 1);
	     bitsUsed -= (1 << bitAliasing) - 1;
	     divider = bitsUsed / 2;
	     type = (bitsPerSample + bitAliasing) >> 3 ;
	};
	/*
	 * these decode function return end index of circular queue till where it is filled
	 */
	this.decodeUNSIGNED = function (sourcebuf ,  startoffset , length ,des_arr ) {
	//Unsigned:
	

	var rlength = length - startoffset ;
	var index = 0;
	if ( bitsPerSample == 8) {
	
		for ( ; startoffset < rlength; ++startoffset) {
			des_arr[ index++ ] = (sourcebuf[startoffset] / 127.5) - 1;
		}
		
	}

	else {
		throw  audioError.decodePCMData ;
	  }
	 decodeCallback(des_arr);
  };
   
   
   
   
   this.decodeSIGNED = function ( sourcebuf ,  startoffset , length , des_arr ) {
	//Two's complement packed:
	var temp = 0 ;
	var rlength = length - startoffset ;
	var index = 0;
	switch ( type ) {	//Split the cases as an optimization.
		case 1:
			
			if ( bitsPerSample == 8) {
				
		
				for ( ; startoffset < rlength; ++startoffset) {
					des_arr [ index++ ] = (((sourcebuf[startoffset]  << 24) >> 24) + 0.5) / 127.5 ;
				   
				}
			
			}
			break;
		case 2:
		    rlength -= rlength & 1;
		    var len = startoffset + rlength ;
			if (bitsPerSample == 16 ) {
				for (; index < len ; startoffset += 2) {
					temp =  ( sourcebuf[startoffset + 1] << 8) | sourcebuf[startoffset];
					des_arr[index++] = (((temp << 16) >> 16) + 0.5) / 32767.5;
				}
			
			}
			break ;
		default:
			throw audioError.decodePCMData;
	}
	 decodeCallback(des_arr);
 };
   
   
   
   
}


