function MutableInt(value) {  
  this.value = value;
}

function V3Coder(historyBufferPower, defaultNumberCoders, reduce)
{
    var INITIAL                   = 0;
    var NEXT_SECTION              = 1;
    var NEXT_BYTE                 = 2;
    var NEXT_STRING_BYTE          = 3;
    var END_OF_STRING             = 4;
    var UNMATCHED_BYTE            = 5;
    var END_OF_SECTION_IN_STRING  = 6;
    var END_OF_SECTION            = 7;
    var FINISH                    = 8;

    var NR_OF_BANDS                 = 9;
    var V3_MAX_CODER_SIZE           = 860; /* maximum size of encoder or decoder data structure */
    var INITIAL_RECALC_COUNTDOWN    = 50;
    var RECALC_COUNTDOWN_LIMIT      = 500;
    var FORCE_WRAP_DISTANCE         = 2048;
    var V3_SPECIAL_THINWIRE_CHANNEL = 0x3D;    /* thinwire channel with special extra processing */

    var INDEX_NR_OF_BITS            = 0;
    var INDEX_BIT_PATTERN           = 1;
    var INDEX_NR_OF_EXTRA_BITS      = 2;
    var INDEX_EXTRA_BITS_MASK       = 3;

    /* entries must be powers of 2 */
    var StartOfBand                 = new Array(10);  /*const USHORT*/
    var NrOfExtraBits               = new Array(9);    /*const UCHAR*/
    var InitialFrequency            = new Array(9);   /*const UCHAR*/
    var IndexToBand                 = new Uint8Array(256);  /*const UCHAR*/
    var NextVictim                  = new Uint8Array(256);  /*const UCHAR*/
    var StringEncodingNrOfBits      = new Uint8Array(128);  /*const USHORT*/
    var StringEncodingBitPattern    = new Array(128); /*const USHORT*/
    var StringDecodingNrOfBits      = new Uint8Array(128);  /*const UCHAR*/
    var StringDecodingBaseIndex     = new Uint8Array(128);  /*const UCHAR*/
    var StringDecodingNrOfExtraBits = new Uint8Array(128);  /*const UCHAR*/
    var StringDecodingExtraBitsMask = new Uint8Array(128);  /*const UCHAR*/

    //this was static block in java
    {
      var i = 0, j = 0, band, countInBand, lastInBand, index,
          baseValue, additionalValue, increment, nrOfBits,
          firstValue, value, mask;

      StartOfBand[0] = 0;
      for (i = 0;  i <= 8;  i++) {
        // & 0xffff to type cast to short (2 byte in java)
        StartOfBand[i+1] = (1 << i) & 0xffff;
      }

      NrOfExtraBits[0] = 0;
      for (i = 0;  i <= 7;  i++) {
        // & 0xff to type cast to byte
        NrOfExtraBits[i+1] = i & 0xff;
      }

      InitialFrequency[0] = 1;
      for (i = 0;  i <= 7;  i++) {
        // & 0xffff to type cast to short (2 byte in java)
        InitialFrequency[i+1] = (1 << i) & 0xffff;
      }

      IndexToBand[0] = 0;
      for (i = 0;  i <= 7;  i++) {
        // & 0xff to type cast to byte
        band = (i + 1) & 0xff;
        countInBand = 1 << i;
        for (j = 0;  j < countInBand;  j++) {
            IndexToBand[countInBand + j] = band;
        }
      }

      NextVictim[0] = 0;
      for (i = 0;  i <= 7;  i++) {
          countInBand = 1 << i;
          lastInBand = countInBand-1;
          for (j = 0;  j < lastInBand;  j++) {
              index = countInBand + j;
              // & 0xff to type cast to byte
              NextVictim[index] = (index+1) & 0xff;
          }
          NextVictim[countInBand + lastInBand] = countInBand & 0xff;
      }

      StringEncodingNrOfBits[0] = 0;
      for (i = 0;  i <= 6;  i++) {
          // & 0xff to type cast to byte
          nrOfBits = ((i * 2) + 1) & 0xff;
          countInBand = 1 << i;
          for (j = 0;  j < countInBand;  j++) {
              StringEncodingNrOfBits[countInBand + j] = nrOfBits;
          }
      }

      StringEncodingBitPattern[0] = 0;
      for (i = 0, baseValue = 1, increment = 2;
           i <= 6;
           i++, increment <<= 1, baseValue <<= 1)
      {
          var countInBand = 1 << i;
          for (var j = 0, additionalValue = 0;
               j < countInBand;
               j++, additionalValue += increment)
          {
            // & 0xffff to type cast to short (2 byte in java)
            StringEncodingBitPattern[countInBand + j] = (baseValue | additionalValue) & 0xffff;
          }
      }

      StringDecodingNrOfBits[0] = 0;
      for (i = 1;  i <= 7;  i++) {
          increment  = 1 << i;
          firstValue = increment >>> 1;
          for (var j = firstValue;  j < 128;  j+= increment) {
              StringDecodingNrOfBits[j] = i;
          }
      }

      StringDecodingBaseIndex[0] = 0;
      for (i = 1;  i <= 64;  i <<= 1) {
          increment = i << 1;
          // & 0xff to type cast to byte
          value = i & 0xff;
          for (var j = i;  j < 128;  j+= increment) {
              StringDecodingBaseIndex[j] = value;
          }
      }

      StringDecodingNrOfExtraBits[0] = 0;
      for (i = 1;  i < 8;  i++) {
          // & 0xff to type cast to byte
          value = (i - 1) & 0xff;
          increment = 1 << i;
          for (j = increment >>> 1;  j < 128;  j+=increment) {
              StringDecodingNrOfExtraBits[j] = value;
          }
      }

      for (var i = 0, extraBitLen = StringDecodingNrOfExtraBits.length;  i < extraBitLen;  i++) {
        nrOfBits = StringDecodingNrOfExtraBits[i];
        mask = (nrOfBits > 0) ? ((1 << nrOfBits) - 1) : 0;
        // & 0xff to type cast to byte
        StringDecodingExtraBitsMask[i] = mask & 0xff;
      }
    }


    var NrOfXyBytes = [1, 2, 4, 8];

    var SpecialRopCode = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];  /* 0, 5, A or F */



    /* --------------------------- */
    /* THINWIRE PARSER DATA TYPES  */
    /* --------------------------- */

    var T_COMMAND                   = 0;
    var T_GLYPH_HANDLE_LOW          = 1;
    var T_BITMAP_ENCODING           = 2;
    var T_FIRST_BYTE_OF_PIXEL       = 3;
    var T_START_CLIP_RECTANGLE      = 4;
    var T_OBJECT                    = 5;
    var T_SPARE_STOPPABLE           = 6;       /* not currently used - for future expansion */

    var HIGHEST_STOPPABLE_STATE     = T_SPARE_STOPPABLE;

    var T_SPARE_NOT_STOPPABLE       = 7;       /* not currently used - for future expansion */
    var T_BITMAP_ENCODING_EXTRA     = 8;
    var T_HANDLE_HIGH               = 9;
    var T_SIGNED_XY                 = 10;
    var T_SIGNED_XY_EXTRA           = 11;
    var T_UNSIGNED_XY               = 12;
    var T_UNSIGNED_XY_EXTRA         = 13;
    var T_BUCKET_0                  = 14;
    var T_BUCKET_1                  = 15;
    var T_BUCKET_2                  = 16;
    var T_BUCKET_3                  = 17;
    var T_BUCKET_4                  = 18;
    var T_BUCKET_5                  = 19;

    /* mapped states */
    var T_COLOR_0                   = T_BUCKET_0;
    var T_COLOR_2                   = T_BUCKET_2;
    var T_CONTROL                   = T_BUCKET_3;
    var T_SMALL_NUMBER              = T_BUCKET_4;

    var T_COLOR_1                   = T_BUCKET_1;
    var T_HANDLE_LOW                = T_BUCKET_5;
    var T_NUMBER                    = T_BUCKET_2;


    var BITBLT_SOURCE_BMP_CONTROL_bHAS_PALETTE = 0x01;
    var BITBLT_SOURCE_BMP_CONTROL_bCLIP = 0x02;
    var BITBLT_SOURCE_BMP_CONTROL_bFromRemoteSurface = 0x04;

    var PATTERN_BRUSH_CONTROL_bHAS_PALETTE = 0x01;
    var PATTERN_BRUSH_CONTROL_bOFFSET = 0x02;

    var PATH_CONTROL_NOT_CACHED  = 0x80;
    var PATH_CONTROL_COLORCHANGE = 0x10;
    var PATH_CONTROL_MIXCHANGE   = 0x08;
    var PATH_CONTROL_TYPE        = 0x07;
    var PATH_TYPE_STRIPS         = 0x00;
    var PATH_TYPE_SEGMENTS       = 0x01;
    //private static final int PATH_TYPE_BEZIERS        = 0x02;
    //private static final int PATH_TYPE_ELLIPSE        = 0x03;

    var BMP_CODEC_NULL          = 0x00; /* uncompressed bitmap - used in pathological cases */
    //private static final int BMP_CODEC_ID_2DRLE      = 0x01; /* normal original codec */
    //private static final int BMP_CODEC_ID_2DRLE_V2   = 0x02; /* improved for 16 and 24 bit cases */
    var BMP_CODEC_ID_JPEG_LOSSY = 0x03; /*Lossy JPEG codec*/

    /* codec constants */
    var TW2_INITIAL_PHOTOGRAPHIC_WEIGHTING = -10;

    /* TW2 Commands */
    var CMD_TW2_INIT                                = 0x90;
    var CMD_TW2_SET_MOUSE_POINTER                   = 0x91;
    var CMD_TW2_HIDE_MOUSE_POINTER                  = 0x92;
    var CMD_TW2_NULL_CLIP_REGION                    = 0x93;
    var CMD_TW2_SIMPLE_CLIP_REGION                  = 0x94;
    var CMD_TW2_COMPLEX_CLIP_REGION                 = 0x95;
    var CMD_TW2_NEW_SOLID_BRUSH                     = 0x96;
    var CMD_TW2_NEW_PATTERN_BRUSH                   = 0x97;
    var CMD_TW2_CHANGE_TEXT_MODE                    = 0x98;
    var CMD_TW2_CHANGE_TEXT_COLOR                   = 0x99;
    var CMD_TW2_CHANGE_TEXT_BACKGROUND_COLOR        = 0x9A;
    var CMD_TW2_CHANGE_PALETTE                      = 0x9B;
    var CMD_TW2_SOLID_FILL                          = 0x9C;
    var CMD_TW2_SOLID_FILL_NEW_COLOR                = 0x9D;
    var CMD_TW2_SOLID_FILL_NO_CLIPPING              = 0x9E;
    var CMD_TW2_SOLID_FILL_NEW_COLOR_NO_CLIPPING    = 0x9F;
    var CMD_TW2_PARTIAL_BITBLT_TRICK                = 0xA0;
    var CMD_TW2_BITBLT_TRICK                        = 0xA1;
    var CMD_TW2_SCR_TO_SCR_BLT                      = 0xA2;
    var CMD_TW2_BITBLT                              = 0xA3;
    var CMD_TW2_TEXTOUT                             = 0xA4;
    var CMD_TW2_DRAW_PATH                           = 0xA5;
    var CMD_TW2_CACHE_NEW_OBJECT                    = 0xA6;
    var CMD_TW2_CACHE_NEW_OBJECT_INCOMPLETE         = 0xA7;
    var CMD_TW2_CACHE_EXTEND_OBJECT                 = 0xA8;
    var CMD_TW2_CACHE_EXTEND_OBJECT_INCOMPLETE      = 0xA9;
    var CMD_TW2_CACHE_WRITE_DISK_OBJECTS            = 0xAA;
    var CMD_TW2_CACHE_WRITE_DISK_COOKIES            = 0xAB;
    var CMD_TW2_CACHE_READ_DISK_OBJECT              = 0xAC;
    var CMD_TW2_CACHE_PURGE_MEMORY_CACHE            = 0xAD;
    var CMD_TW2_START_STOPWATCH                     = 0xAE;
    var CMD_TW2_STOP_STOPWATCH                      = 0xAF;
    var CMD_TW2_CACHE_RECOVERY_MARKER               = 0xB0;
    /* new thinwire command */
    var CMD_TW2_SAVE_SCREEN_BITS                    = 0xB1;
    var CMD_TW2_RESTRORE_AND_FREE_SCREEN_BITS       = 0xB2;
    var CMD_TW2_FREE_SCREEN_BITS                    = 0xB3;
    var CMD_TW2_CREATE_SURFACE                      = 0xB4;
    var CMD_TW2_DELETE_SURFACE                      = 0xB5;
    var CMD_TW2_CHANGE_SURFACE                      = 0xB6;
    var CMD_TW2_BITBLT_SPEEDBROWSE                  = 0xB7;
    var CMD_TW2_CREATE_SPEEDBROWSE_IMAGE            = 0xB8;
    var CMD_TW2_DELETE_SPEEDBROWSE_IMAGE            = 0xB9;
    var CMD_TW2_ASSOCIATE_SPEEDBROWSE_DATA_CHUNK    = 0xBA;
    var CMD_TW2_ACTIVATE_THINWIRE_REDUCER           = 0xBB;
    var CMD_TW2_RESTORE_MOUSE_POINTER               = 0xBC;
    var CMD_TW2_STRETCHIMAGE_SPEEDBROWSE            = 0xBD;
    var CMD_TW2_END_OF_FRAME						= 0xBE;

    //private static final int TW2_UNKNOWN_BMP_FORMAT = 0;
    var TW2_1BPP  = 1;
    var TW2_4BPP  = 2;
    var TW2_8BPP  = 3;
    var TW2_15BPP = 4;
    var TW2_24BPP = 5;

    //private static final int TW2_CACHE_OBJ_ID_UNKNOWN             = 0;
    var TW2_CACHE_OBJ_ID_BITMAP              = 1;
    var TW2_CACHE_OBJ_ID_1BPP_GLYPH          = 2;
    var TW2_CACHE_OBJ_ID_RGB_PALETTE         = 3;
    var TW2_CACHE_OBJ_ID_INDEX_PALETTE       = 4;
    var TW2_CACHE_OBJ_ID_COMPLEX_RECT_REGION = 5;
    var TW2_CACHE_OBJ_ID_STRIP               = 6;
    var TW2_CACHE_OBJ_ID_SEGMENT             = 7;


    var ColorTypes = [T_COLOR_0, T_COLOR_1, T_COLOR_2];

    var LengthDecodeTable = [
        0x0000,
        0x0001,
        0x0002,
        0x0003,
        0x0004,
        0x0005,
        0x0006,
        0x0007,
        0x0008,
        0x0009,
        0x000A,
        0x000B,
        0x000C,
        0x000D,
        0x000E,
        0x000F,
        0x0010,
        0x0011,
        0x0012,
        0x0013,
        0x0014,
        0x0015,
        0x0016,
        0x00FF,

        0x0100,
        0x0101,
        0x0102,
        0x0103,
        0x0104,
        0x0105,
        0x0106,
        0x0107,
        0x0108,
        0x0109,
        0x010A,
        0x01FF,

        0x0200,
        0x0201,
        0x0202,
        0x0203,
        0x0204,
        0x02FF,

        0x0300,
        0x0400,
        0x0500,
        0x0600,
        0x0700,
        0x0800,
        0x0900,
         0x0A00,
        0x0B00,
        0x0C00,
        0x0D00,
        0xFF00,

        0x0301,
        0x0401,
        0x0501,
        0x0601,
        0x0701,
        0xFF01,

        0x0302,
        0x0402,
        0xFF02,

        0xFFFF
    ];

    var NODE  = function()
    {
      this.intFrequency    = 0;
      this.intParentIndex  = 0;
      this.intNextIndex    = 0;
      this.intCode         = 0;
    };

    var CODER = function()
    {
      this.arrValueOfIndex        = new Array(256);
      this.arrIndexOfValue        = new Array(256);
      this.arrNextVictim          = new Array(NR_OF_BANDS);
      this.intRecalcCountdown     = 0;
      this.intNextRecalcCountdown = 0;
      this.arrBandCount           = new Array(NR_OF_BANDS);
      this.arrEncoding            = new Array(NR_OF_BANDS);
      var encodingLength          = this.arrEncoding.length;
      var i                       = 0;
      for (i = 0; i < encodingLength; i++) {
        this.arrEncoding[i] = new Array(4);
      }
      this.arrDecoding            = new Array(256);
    };

    var IsSourceROP = function(rop)
    {

        var/*UCHAR*/ h = (rop >>> 4) & 0x0f;
        var/*UCHAR*/ l = rop & 0x0f;

        return (((SpecialRopCode[h] & SpecialRopCode[l]) ^ 1) != 0);
    };



    var bRedexData_FullyInitialized                    = false;
    var bRedexData_Reducer                             = false;
    var intRedexData_DefaultNrOfCoders                 = 0;
    var intRedexData_ActualNrOfCoders                  = 0; /*ULONG*/
    var arrRedexData_historyBuffer                     = null;
    var intRedexData_historyBufferPos                  = 0;
    var arrRedexData_hashTable                         = null;
    var intRedexData_HistoryBufferLength               = 0; /*ULONG*/
    var intRedexData_HistoryBufferMask                 = 0; /*ULONG*/
    var intRedexData_HashTableMask                     = 0; /*ULONG*/
    var intRedexData_HashShift                         = 0; /*ULONG*/
    var intRedexData_CheckMask                         = 0; /*ULONG*/
    var intRedexData_headPos                           = 0; // Index into historyBuffer
    var arrRedexData_coders                            = null;
    var intRedexData_StringLength                      = 0; /*INT32*/
    var intRedexData_MaxVirtualWriteLength             = 0; /*ULONG*/
    var bRedexData_InString                            = false; /*BOOL*/
    var bRedexData_UseLightweightObjectParsing         = false;/*BOOL*/
    var intRedexData_matchPos                          = 0;
    var intRedexData_NrOfExpanderBytesRemaining        = 0; /*INT32*/
    var arrRedexData_compressedData                    = null;
    var intRedexData_compressedIndex                   = 0;
    var intRedexData_highestPhysicalUshort             = 0; // Maximum index into compressed data.
    var intRedexData_CompressedBits                    = 0; /*ULONG*/
    var arrRedexData_DummyOutputBuffer                 = new Array(4); /*UCHAR*/
    var bytRedexData_NrOfCompressedBits                = 0; /*UCHAR*/
    var intRedexData_ThinwireParserLevel               = 0; /*UCHAR*/
    var bytRedexData_NrOfColorBytes                    = 0; /*UCHAR*/
    var intRedexData_CurrentCommand                    = 0; /*UCHAR*/
    var bytRedexData_CurrentObjectType                 = 0; /*UCHAR*/
    var bytRedexData_CurrentBitmapType                 = 0; /*UCHAR*/
    var bytRedexData_CurrentCodecID                    = 0; /*UCHAR*/
    var bytRedexData_CurrentState                      = 0; /*UCHAR*/
    var bytRedexData_ThinwireParserErrorCode           = 0; /*UCHAR*/
    var bytRedexData_ExpanderErrorCode                 = 0; /*UCHAR*/
    var intRedexData_CurrentLength                     = 0; /*INT32*/
    var intRedexData_CurrentSubLength                  = 0; /*INT32*/
    var intRedexData_PhotographicWeightingCarriedOver  = 0; /* LONG */
    var intRedexData_CurrentPhotographicWeighting      = 0; /*LONG*/
    var intRedexData_EncodingNr                        = 0; /*ULONG*/
    var arrRedexData_Nodes                             = new Array((NR_OF_BANDS * 2) + 2);

    var initReducerExpander = function(historyBufferPower, /* exponent (power of 2) of history buffer */
		defaultNrOfCoders, /* nr of coders to preallocate */ /*BOOL*/
		reducer)/* reducer or expander? */
	{
			var intHashPower, intHistoryBufferLength, i;
			/* comfigure history buffer and hash table */
			intHashPower = historyBufferPower - 3;
			//hashTableLength = (1 << (hashPower + 2));    /* ULONGs */
			intHistoryBufferLength = (1 << historyBufferPower);

            arrRedexData_coders = new Array(defaultNrOfCoders);

            intHistoryBufferLength -= 4;

            
			arrRedexData_historyBuffer = new Uint8Array(intHistoryBufferLength + 1 + 4);

			//pred->pHistoryBufferEnd = pred->pHistoryBuffer + historyBufferLength;
			intRedexData_HistoryBufferLength = intHistoryBufferLength;
			intRedexData_HistoryBufferMask = (1 << historyBufferPower) - 1;
			//pred->pHashTable = (PULONG)(pred->pHistoryBuffer + historyBufferLength);
			var hashTableLength = 1 << intHashPower;
			
			arrRedexData_hashTable = new Int32Array(hashTableLength);
			
			intRedexData_HashShift = /*(UCHAR)*/ ((32 - intHashPower) | 1); /* used in hash calculations */
			intRedexData_HashTableMask = (1 << intHashPower) - 1;
			intRedexData_StringLength = -1;
			intRedexData_headPos = 4; // Allowing for pre-matching
			intRedexData_CheckMask = ((1 << 24) - 1) ^ (intRedexData_HistoryBufferMask); /* mask to lose top byte and buffer index bits */
			bRedexData_Reducer = reducer;
			intRedexData_DefaultNrOfCoders = defaultNrOfCoders;
			bRedexData_UseLightweightObjectParsing = false;
			// Initialise objects
			for (var i = arrRedexData_Nodes.length; i--;) {
				arrRedexData_Nodes[i] = new NODE();
			}
			for (var i = defaultNrOfCoders; i--;) {
				arrRedexData_coders[i] = new CODER();
			}
	};
  initReducerExpander(historyBufferPower, defaultNumberCoders, reduce);

   /**
     * Calculates Huffman codes.
     * @param coder the CODER for which the Huffman codes will be calculated.
     */
  var MakeHuffmanCodes = function(coder)
  {

    var intFrequency, intBand, j;
    var intNrOfCodeBits, intNrOfExtraBits, intCode, intStepSize;
    var intNodeIndex, intPrevNodeIndex;

    var arrNodes      = arrRedexData_Nodes;
    var arrBandCounts = coder.arrBandCount;
    var arrEncodings  = coder.arrEncoding;
    var arrDecodings  = coder.arrDecoding;
    var bReducer      = bRedexData_Reducer;

    arrNodes[0].intFrequency = arrBandCounts[0];
    arrNodes[0].intNextIndex = -1;

    var intLowEndIndex        = 0;
    var intHighEndIndex       = 0;
    var intNextFreeNodeIndex  = 1;

    /* make initial list in ascending frequency order */
    for (intBand = 1; intBand < NR_OF_BANDS; intBand++) {
      intFrequency = arrBandCounts[intBand];
      if (intFrequency <= arrNodes[intLowEndIndex].intFrequency) {
        /* before beginning */
        //pNextFreeNode.pNext = pLowEnd;
        arrNodes[intNextFreeNodeIndex].intNextIndex = intLowEndIndex;
        //pLowEnd = pNextFreeNode;
        intLowEndIndex = intNextFreeNodeIndex;
      } else if (intFrequency >= arrNodes[intHighEndIndex].intFrequency) {
        /* after end */
        //pHighEnd.pNext = pNextFreeNode;
        arrNodes[intHighEndIndex].intNextIndex = intNextFreeNodeIndex;
        //pHighEnd = pNextFreeNode;
        intHighEndIndex = intNextFreeNodeIndex;
      } else {
        /* somewhere in the middle */
        //pPrevNode = pLowEnd;
        intPrevNodeIndex = intLowEndIndex;
        //pNode = pLowEnd.pNext;
        intNodeIndex = arrNodes[intLowEndIndex].intNextIndex;
        //while (frequency > pNode.Frequency)
        while (intFrequency > arrNodes[intNodeIndex].intFrequency)
        {
            //pPrevNode = pNode;
            intPrevNodeIndex = intNodeIndex;
            //pNode = pNode.pNext;
            intNodeIndex = arrNodes[intNodeIndex].intNextIndex;
        }
        //pPrevNode.pNext = pNextFreeNode;
        arrNodes[intPrevNodeIndex].intNextIndex = intNextFreeNodeIndex;
        //pNextFreeNode.pNext = pNode;
        arrNodes[intNextFreeNodeIndex].intNextIndex = intNodeIndex;
      }
      //pNextFreeNode.Frequency = frequency;
      arrNodes[intNextFreeNodeIndex].intFrequency = intFrequency;
      //pNextFreeNode.pParent = null;
      arrNodes[intNextFreeNodeIndex].intParentIndex = -1;
      //pNextFreeNode++;
      //pNextFreeNode = nodes[++nextFreeNodeIndex];
      intNextFreeNodeIndex++;
    }

    /* build and refine the tree */
    for (intBand = 2; intBand < NR_OF_BANDS; intBand++) {

      /* take two lowest members out of the list */
      //NODE pFirstChild = pLowEnd;
      //NODE pSecondChild = pLowEnd.pNext;
      var intFirstChildIndex = intLowEndIndex;
      var intSecondChildIndex = arrNodes[intLowEndIndex].intNextIndex;
      //pLowEnd = pSecondChild.pNext;
      intLowEndIndex = arrNodes[intSecondChildIndex].intNextIndex;

      /* combine into new node */
      //pFirstChild.pParent = pNextFreeNode;
      arrNodes[intFirstChildIndex].intParentIndex = intNextFreeNodeIndex;
      //pFirstChild.Code = 0;
      arrNodes[intFirstChildIndex].intCode = 0;
      //pSecondChild.pParent = pNextFreeNode;
      arrNodes[intSecondChildIndex].intParentIndex = intNextFreeNodeIndex;
      //pSecondChild.Code = 1;
      arrNodes[intSecondChildIndex].intCode = 1;
      //frequency = pFirstChild.Frequency + pSecondChild.Frequency;
      intFrequency = arrNodes[intFirstChildIndex].intFrequency + arrNodes[intSecondChildIndex].intFrequency;

      /* put into sorted list */
      //if (frequency <= pLowEnd.Frequency)
      if (intFrequency <= arrNodes[intLowEndIndex].intFrequency)
      {
          /* before beginning */
          //pNextFreeNode.pNext = pLowEnd;
          arrNodes[intNextFreeNodeIndex].intNextIndex = intLowEndIndex;
          //pLowEnd = pNextFreeNode;
          intLowEndIndex = intNextFreeNodeIndex;
      }
      //else if (frequency >= pHighEnd.Frequency)
      else if (intFrequency >= arrNodes[intHighEndIndex].intFrequency)
      {
          /* after end */
          //pHighEnd.pNext = pNextFreeNode;
          arrNodes[intHighEndIndex].intNextIndex = intNextFreeNodeIndex;
          //pHighEnd = pNextFreeNode;
          intHighEndIndex = intNextFreeNodeIndex;
      } else {
        /* somewhere in the middle */
        //pPrevNode = pLowEnd;
        intPrevNodeIndex = intLowEndIndex;
        //pNode = pLowEnd.pNext;
        intNodeIndex = arrNodes[intLowEndIndex].intNextIndex;
        //while (frequency > pNode.Frequency)
        while (intFrequency > arrNodes[intNodeIndex].intFrequency)
        {
            //pPrevNode = pNode;
            intPrevNodeIndex = intNodeIndex;
            //pNode = pNode.pNext;
            intNodeIndex = arrNodes[intNodeIndex].intNextIndex;
        }
        //pPrevNode.pNext = pNextFreeNode;
        arrNodes[intPrevNodeIndex].intNextIndex = intNextFreeNodeIndex;
        //pNextFreeNode.pNext = pNode;
        arrNodes[intNextFreeNodeIndex].intNextIndex = intNodeIndex;
      }

      //pNextFreeNode.Frequency = frequency;
      arrNodes[intNextFreeNodeIndex].intFrequency = intFrequency;
      //pNextFreeNode.pParent = null;
      arrNodes[intNextFreeNodeIndex].intParentIndex = -1;
      //pNextFreeNode = nodes[++nextFreeNodeIndex];
      //pNextFreeNode++;
      intNextFreeNodeIndex++;
    }//end for


    //pLowEnd.pParent = null;
    arrNodes[intLowEndIndex].intParentIndex = -1;
    //pLowEnd.Code = 0;
    arrNodes[intLowEndIndex].intCode = 0;
    //pHighEnd.pParent = null;
    arrNodes[intHighEndIndex].intParentIndex = -1;
    //pHighEnd.Code = 1;
    arrNodes[intHighEndIndex].intCode = 1;



    /* construct the encoding or decoding table */
    var intEncodingIndex;
    for (intBand = 0, intEncodingIndex = 0;  intBand < NR_OF_BANDS;  intBand++, intEncodingIndex++)
    {
        /* work out code for the band */
        intNrOfCodeBits = 0;
        intCode = 0;
        //pNode = nodes[band];
        intNodeIndex = intBand;
        do
        {
            intCode <<= 1;
            //code |= pNode.Code;
            intCode |= arrNodes[intNodeIndex].intCode;
            //pNode = pNode.pParent;
            intNodeIndex = arrNodes[intNodeIndex].intParentIndex;
            intNrOfCodeBits++;
        //} while (pNode != null);
        } while (intNodeIndex >= 0);
        intNrOfExtraBits = NrOfExtraBits[intBand];

        /* set encoding data */
        //& 0xff fir byte cast
        arrEncodings[intEncodingIndex][INDEX_NR_OF_BITS]       = /*(UCHAR)*/intNrOfCodeBits & 0xff;
        arrEncodings[intEncodingIndex][INDEX_BIT_PATTERN]      = /*(UCHAR)*/intCode & 0xff;
        arrEncodings[intEncodingIndex][INDEX_NR_OF_EXTRA_BITS] = /*(UCHAR)*/intNrOfExtraBits & 0xff;
        arrEncodings[intEncodingIndex][INDEX_EXTRA_BITS_MASK]  = /*(UCHAR)*/((1 << intNrOfExtraBits) - 1) & 0xff;
        //pEncodings++;

        if (!bReducer)
        {
            /* set decoding data */
            intStepSize = 1 << intNrOfCodeBits;
            for (j = intCode; j < 256; j += intStepSize)
            {
                //pDecodings[j].BandAndNrOfBits = (UCHAR)(band | (intNrOfCodeBits << 4));
                //& 0xff to byte cast
                arrDecodings[j] = /*(UCHAR)*/(intBand | (intNrOfCodeBits << 4)) & 0xff;
            }
        }
    }


    /* reset the counts to half current values */
    for (intBand = 0; intBand < NR_OF_BANDS; intBand++)
    {
        //coder->BandCount[band] = (USHORT)((coder->BandCount[band] >> 1) + 1);
        coder.arrBandCount[intBand] = /*(USHORT)*/((coder.arrBandCount[intBand] >>> 1) + 1) & 0xffff;
    }

    /* set next countdown */
    coder.intRecalcCountdown = coder.intNextRecalcCountdown;
    if (coder.intNextRecalcCountdown < RECALC_COUNTDOWN_LIMIT)
    {
        coder.intNextRecalcCountdown = (coder.intNextRecalcCountdown * 3) >>> 1;
        if (coder.intNextRecalcCountdown > RECALC_COUNTDOWN_LIMIT)
        {
            coder.intNextRecalcCountdown = RECALC_COUNTDOWN_LIMIT;
        }
    }
  };


  /**
   * Initialize reducer/expander
   */
  var InitCoder = function (pCoder)
  {
      var i, intBand;

      for (i = 0; i < 256; i++)
      {
        //byte cast
        pCoder.arrIndexOfValue[i] = i & 0xff;
        pCoder.arrValueOfIndex[i] = i & 0xff;
      }
      for (intBand = 0; intBand < NR_OF_BANDS; intBand++)
      {
          if (intBand === 0)
          {
              pCoder.arrNextVictim[intBand] = (0) & 0xff;
          }
          else
          {
              pCoder.arrNextVictim[intBand] = (StartOfBand[intBand - 1]) & 0xff;
          }
          pCoder.arrBandCount[intBand] = InitialFrequency[intBand];
      }
      pCoder.intNextRecalcCountdown = INITIAL_RECALC_COUNTDOWN;
      MakeHuffmanCodes(pCoder);
  }














   /* returns FALSE if error */
  this.V3FinishInitialization = function (//PUCHAR predIn,                                 /* reducere/expander data structures */
      /*UCHAR*/  actualNrOfCoders,     /* actual nr of coders to be used */
      /*ULONG*/  maxVirtualWriteLength)   /* maximum length of a virtual write */
  {
      var/*ULONG*/ intNrOfExtraCoders, intExtraMemory, i;
      //PCODER pCoder;
      var coder;
      //PREDUCER_EXPANDER_DATA pred = (PREDUCER_EXPANDER_DATA)predIn;
      //REDUCER_EXPANDER_DATA pred;

      if (actualNrOfCoders > intRedexData_DefaultNrOfCoders)
      {

          /* need more coders than are currently allocated - eat into history buffer to extend array */
          intNrOfExtraCoders = actualNrOfCoders - intRedexData_DefaultNrOfCoders;
          intExtraMemory = intNrOfExtraCoders * V3_MAX_CODER_SIZE;
          if (intExtraMemory >= (intRedexData_HistoryBufferLength >>> 1))
          {
              /* unreasonable number of extra coders - too suspicious */
              return false;
          }
          //pred->pHistoryBuffer += extraMemory;
          //pred->pHead += extraMemory;
          intRedexData_HistoryBufferLength -= intExtraMemory;

          var temp = arrRedexData_coders;
          arrRedexData_coders = new Array(actualNrOfCoders);
          Utility.CopyArray(temp, 0, arrRedexData_coders, 0, temp.length);

          for (i = temp.length, coderLen = arrRedexData_coders.length;  i < coderLen;  i++) {
              arrRedexData_coders[i] = new CODER();
          }
      }

      /* initialize coders */
//         pCoder = pred->pCoders;
//         for (i = 0; i < actualNrOfCoders; i++)
//         {
//             InitCoder(pred, pCoder);
//             pCoder++;
//         }
      for (var i = 0;  i < actualNrOfCoders;  i++) {
          InitCoder(/*pred,*/ arrRedexData_coders[i]);
      }

      intRedexData_ActualNrOfCoders = actualNrOfCoders;
      intRedexData_MaxVirtualWriteLength = maxVirtualWriteLength;
      bRedexData_FullyInitialized = true;
      return true;
 };



  // ==============================================================================
  // Now the actual reduction and expansion functions follow.  They are reasonably
  // complex...
  // ==============================================================================


  /* --------- */
  /* EXPANDING */
  /* --------- */


  var DecodeHandle = function ()
  {
        ExpandByte(T_HANDLE_LOW);
        ExpandByte(T_HANDLE_HIGH);
  };

  var DecodeColor = function ()
  {
        var i;
        for (i = 0; i < bytRedexData_NrOfColorBytes ; i++) {
            ExpandByte(ColorTypes[i]);
        }
  };

  //private void StartBitmapLessThan8BPP() { DoStartGeneralObject();     }
  var StartBitmap8BPP        = function () { DoStartBitmap8BPP();        };
  var StartBitmap16BPP       = function () { DoStartBitmap16BPP();       };
  var StartBitmap24BPP       = function () { DoStartBitmap24BPP();       };
  var StartBitmapJPEG        = function () { DoStartGeneralObject();     };
  //private void StartGlyph()              { DoStartGeneralObject();     }
  var StartComplexClipRegion = function () { DoStartComplexClipRegion(); };
  //private void StartRgbPalette()         { DoStartGeneralObject();     }
  //private void StartStrip()              { DoStartGeneralObject();     }
  //private void StartIndexPalette()       { DoStartGeneralObject();     }
  //private void StartSegment()            { DoStartGeneralObject();     }

  var ContinueBitmapLessThan8BPP = function () { DoContinueGeneralObject();     };
  var ContinueBitmap8BPP = function () { DoContinueBitmap8BPP();        };
  var ContinueBitmap16BPP = function () { DoContinueBitmap16BPP();       };
  var ContinueBitmap24BPP = function () { DoContinueBitmap24BPP();       };
  var ContinueBitmapJPEG = function () { DoContinueGeneralObject();     };
  var ContinueGlyph = function () { DoContinueGeneralObject();     };
  var ContinueComplexClipRegion = function () { DoContinueComplexClipRegion(); };
  var ContinueRgbPalette = function () { DoContinueGeneralObject();     };
  var ContinueStrip = function () { DoContinueGeneralObject();     };
  var ContinueIndexPalette = function () { DoContinueGeneralObject();     };
  var ContinueSegment = function () { DoContinueGeneralObject();     };

  var ContinueGeneralObject = function () { DoContinueGeneralObject();     };
  var ContinueTextout = function () { DoContinueTextout();           };

  var ContinueCurrentCommand = function () { DoContinueCurrentCommand();    };

  //private void DoDecodeIntXy() {
  var DecodeIntXy  = function ()
  {
      //UCHAR code;
      //ULONG furtherBytes;

      var code = ExpandByte(T_SIGNED_XY) & 0xff;
      var furtherBytes = NrOfXyBytes[code >>> 6] - 1;
      if (furtherBytes > 0)
      {
          ExpandBytes(T_SIGNED_XY_EXTRA, furtherBytes);
      }
  };

   var DoObjDecodeIntXy = function(//PREDUCER_EXPANDER_DATA pred,
        /*UCHAR*/                  syntaxType,
        /*INT32*/                  pCurrentLength)
    {
        //UCHAR code;
        //ULONG furtherBytes;

        var code = ExpandByte(syntaxType) & 0xff;
        var furtherBytes = NrOfXyBytes[code >>> 6] - 1;
        if (furtherBytes > 0)
        {
            ExpandBytes(T_SIGNED_XY_EXTRA, furtherBytes);
        }
        pCurrentLength -= (1 + furtherBytes);

        return pCurrentLength;
    };

    var DecodeUintXy = function ()
    {

        //UCHAR code;
        //ULONG furtherBytes;

        var code = ExpandByte(T_UNSIGNED_XY) & 0xff;
        var furtherBytes = NrOfXyBytes[code >>> 6] - 1;
        if (furtherBytes > 0)
        {
            ExpandBytes(T_UNSIGNED_XY_EXTRA, furtherBytes);
        }
    };

    var DoObjDecodeUintXy = function (//PREDUCER_EXPANDER_DATA pred,
        /*INT32*/                 pCurrentLength)
    {
        //UCHAR code;
        //ULONG furtherBytes;

        var code = ExpandByte(T_UNSIGNED_XY) & 0xff;
        var furtherBytes = NrOfXyBytes[code >>> 6] - 1;
        if (furtherBytes > 0)
        {
            ExpandBytes(T_UNSIGNED_XY_EXTRA, furtherBytes);
        }
        //*pCurrentLength -= (1 + furtherBytes);

        return pCurrentLength - (1 + furtherBytes);
    };

    var DecodeUint = function (syntaxType)
    {

        //UCHAR  tempByte;
        //UINT32 theInteger;
        var/*UINT32*/ intLeftShiftBits=0;

        var intTempByte = ExpandByte(syntaxType) & 0xff;
        var intTheInteger = intTempByte & 0x7F;
        while ((intTempByte & 0x80) !== 0)
        {
            intLeftShiftBits+=7;
            /* get the next 7 bits ( more significant) */
            intTempByte = ExpandByte(T_SMALL_NUMBER) & 0xff;
            //theInteger = (theInteger) |(/*(UINT32)*/(tempByte & 0x7F))<<leftShiftBits;
            intTheInteger |=  (/*(UINT32)*/(intTempByte & 0x7F)) << intLeftShiftBits;
            if (intLeftShiftBits == 28)
            {
                /* must not eat more than 5 bytes (the data may be corrupt and we would loop indefinitely) */
                break;
            }
        }

        return intTheInteger;
    };

    var DoObjDecodeUint = function (//PREDUCER_EXPANDER_DATA pred,
        /*UCHAR*/                  syntaxType,
        /*INT32*/                 pCurrentLength)
    {
        //UCHAR  tempByte;
        var/*UINT32*/ intLeftShiftBits=0;

        var intTempByte = ExpandByte(syntaxType) & 0xff;
        pCurrentLength -= 1;
        while ((intTempByte & 0x80) !== 0)
        {
            intLeftShiftBits+=7;
            /* get the next 7 bits ( more significant) */
            intTempByte = ExpandByte(T_SMALL_NUMBER) & 0xff;
            pCurrentLength -= 1;
            if (intLeftShiftBits == 28)
            {
                /* must not eat more than 5 bytes (the data may be corrupt and we would loop indefinitely) */
                break;
            }
        }

        return pCurrentLength;
    };

    var DecodeUint16 = function (syntaxType0, syntaxType1)
    {

        //USHORT b0, b1;

        var intB0 = ExpandByte(syntaxType0) & 0xff;
        var intB1 = ExpandByte(syntaxType1) & 0xff;

        return (intB0 | (intB1 << 8));
    };

    /**
     * @param mutableLength a MutableInt containing the current length; this will be
     * updated by the method to reflect the new length after decoding the big number.
     * @return the decoded big number.
     */
    var DoObjDecodeBigNumber = function(//PREDUCER_EXPANDER_DATA pred,
        /*INT32*/                 mutableLength)
    {
        var intpCurrentLength = mutableLength.value;
        var/*ULONG*/ intN, intN0, intN1, intN2, intN3;

        intN = ExpandByte(T_BITMAP_ENCODING_EXTRA) & 0xff;
        intpCurrentLength -= 1;
        if (intN == 255)
        {
            intN0 = ExpandByte(T_NUMBER) & 0xff;
            intN1 = ExpandByte(T_NUMBER) & 0xff;
            intN = intN0 | (intN1 << 8);
            intpCurrentLength -= 2;
            if (intN == 0xFFFF)
            {
                intN0 = ExpandByte(T_NUMBER) & 0xff;
                intN1 = ExpandByte(T_NUMBER) & 0xff;
                intN2 = ExpandByte(T_NUMBER) & 0xff;
                intN3 = ExpandByte(T_NUMBER) & 0xff;
                intN = intN0 | (intN1 << 8) | (intN2 << 16) | (intN3 << 24);
                intpCurrentLength -= 4;
            }
        }
        mutableLength.value = intpCurrentLength;
        //pCurrentLength.length = n;
        return intN;
    };

    var DoStartGeneralObject = function ()
    {

    };

    var DoStartBitmap8BPP = function ()
    {
        //DoStartBitmap8BPP(pred)

        //TRACE((TC_WD, TT_API3,"DoStartBitmap8BPP\n"));

        /* brand new object */
        intRedexData_CurrentLength  = DoObjDecodeUintXy(/*pred,*/ intRedexData_CurrentLength );

        bytRedexData_CurrentState = T_BITMAP_ENCODING;
    };

    var DoContinueBitmap8BPP = function ()
    {
      var intRunLength, intRawLength = 0, intLocalCurrentLength;
      var intMask;
      var intLengthInfo;

      var mutableLocalLength = new MutableInt(0);


      intLocalCurrentLength = intRedexData_CurrentLength < intRedexData_NrOfExpanderBytesRemaining?intRedexData_CurrentLength:intRedexData_NrOfExpanderBytesRemaining;
      intRedexData_CurrentLength -= intLocalCurrentLength;
      if (intRedexData_CurrentLength <= 0)
      {
          /* this will end the command */
          intRedexData_CurrentCommand  = 0;
      }

      if (intLocalCurrentLength <= 0)
      {
          if (intLocalCurrentLength !== 0) {
              bytRedexData_ThinwireParserErrorCode = 11;
          }
          return;
      }

      if (bytRedexData_CurrentCodecID == BMP_CODEC_NULL)
      {
          ExpandBytes(/*pred,*/ T_FIRST_BYTE_OF_PIXEL, intLocalCurrentLength);
          return;
      }

      var bSkipMatches = false;

      if (bytRedexData_CurrentState == T_FIRST_BYTE_OF_PIXEL)
      {
          /* we are in the middle of a run of raw pixels */
          intRawLength = intRedexData_CurrentSubLength;
          bSkipMatches = true;
      }

      outer_section:
      {
          do {

              if (!bSkipMatches) {
                  var intEncoding = ExpandByte(T_BITMAP_ENCODING) & 0xff;
                  intLocalCurrentLength--;

				
                  intLengthInfo = LengthDecodeTable[intEncoding & 0x3F];

                  intRunLength = intLengthInfo & 0xFF;
                  intRawLength = intLengthInfo >>> 8;

                  if ((intRunLength | intRawLength) == 0xFF)
                  {
                      /* some extension is needed */

                      mutableLocalLength.value = intLocalCurrentLength;
                      if (intRawLength == 0xFF)
                      {
                          /* extend raw length */
                          intRawLength = DoObjDecodeBigNumber(mutableLocalLength);
                      }
                      if (intRunLength == 0xFF)
                      {
                          /* extend run length */
                          intRunLength = DoObjDecodeBigNumber(mutableLocalLength);
                      }
                      intLocalCurrentLength = mutableLocalLength.value;
                  }

                  intRedexData_EncodingNr++;


                  // Check bit 6 (2-color/multi-color).  If 2-color, the intRawLength
                  // does *not* represent more bytes to decode.
                  if ((intEncoding & (1<<6)) == 0)
                      intRawLength = 0;
              }

            deal_with_unmatched_pixels:
              bSkipMatches = false;

              /* a non-empty multi-color section - process the raw unmatched bytes */
              if (intRawLength > 0)
              {
                  if (intRawLength < intLocalCurrentLength)
                  {
                      /* can do all this and more */
                      ExpandBytes(/*pred,*/ T_FIRST_BYTE_OF_PIXEL, intRawLength);
                      intLocalCurrentLength -= intRawLength;
                      continue;
                  }
                  else
                  {
                      /* this is where we stop */
                      if (intLocalCurrentLength > 0)
                      {
                          ExpandBytes(/*pred,*/ T_FIRST_BYTE_OF_PIXEL, intLocalCurrentLength);
                          intRawLength -= intLocalCurrentLength;
                          intLocalCurrentLength = 0;
                      }
                      if (intRawLength > 0)
                      {
                          intRedexData_CurrentSubLength  = intRawLength;
                          bytRedexData_CurrentState      = T_FIRST_BYTE_OF_PIXEL;
                      }
                      else
                      {
                          bytRedexData_CurrentState  = T_BITMAP_ENCODING;
                      }
                      break outer_section;
                  }
              }

          } while (intLocalCurrentLength > 0);

          bytRedexData_CurrentState = T_BITMAP_ENCODING;
      }

      check_exit:

      if (intLocalCurrentLength != 0)
      {
          //TRACE((TC_WD, TT_ERROR,"8-BIT BITMAP PARSE ERROR lcl = %d\n", intLocalCurrentLength));
          bytRedexData_ThinwireParserErrorCode = 11;
      }

      //TRACE((TC_WD, TT_API3,"------- HALT 8BPP -----------\n"));
    };



    var DoStartBitmap16BPP = function ()
    {
        //TRACE((TC_WD, TT_API3,"DoStartBitmap16BPP\n"));

        /* brand new object */
        intRedexData_CurrentLength = DoObjDecodeUintXy(/*pred,*/ intRedexData_CurrentLength);

        bytRedexData_CurrentState = T_BITMAP_ENCODING;
        intRedexData_CurrentPhotographicWeighting = TW2_INITIAL_PHOTOGRAPHIC_WEIGHTING;
    };

    var DoContinueBitmap16BPP = function ()
    {
      //UCHAR encoding, code;
      var/*INT32*/ /*intRunLength,*/ intRawLength = 0;
      var/*LONG*/ intPhotographicWeighting, intPhotographicWeightingToTest;
      //INT32 mask;
      //USHORT lengthInfo;
      var/*INT32*/ intLocalCurrentLength;

      var mutableLocalLength = new MutableInt(0);

      //TRACE((TC_WD, TT_API3,"------- CONTINUE 16BPP -----------\n"));

      intPhotographicWeighting = intRedexData_CurrentPhotographicWeighting;
      intPhotographicWeightingToTest = intRedexData_CurrentPhotographicWeighting;

      intLocalCurrentLength = intRedexData_CurrentLength < intRedexData_NrOfExpanderBytesRemaining?intRedexData_CurrentLength:intRedexData_NrOfExpanderBytesRemaining;
      intRedexData_CurrentLength -= intLocalCurrentLength;
      if (intRedexData_CurrentLength <= 0)
      {
          /* this will end the command */
          intRedexData_CurrentCommand = 0;
      }

      exit_section:
      {
          if (intLocalCurrentLength <= 0)
          {
              //goto check_exit;
              //checkExit(intLocalCurrentLength, intPhotographicWeighting, 12);
              //return;
              break exit_section;
          }

          if (bytRedexData_CurrentCodecID == BMP_CODEC_NULL)
          {
              while (intLocalCurrentLength >= 2)
              {
                  ExpandByte(T_FIRST_BYTE_OF_PIXEL);
                  ExpandByte(T_COLOR_1);
                  intLocalCurrentLength -= 2;
              }
              //goto check_exit;
              //checkExit(intLocalCurrentLength, intPhotographicWeighting, 12);
              //return;
              break exit_section;
          }

          var  bSkipMatches = false;

          if (bytRedexData_CurrentState == T_FIRST_BYTE_OF_PIXEL)
          {
              /* we are in the middle of a run of raw pixels */
              intPhotographicWeightingToTest = intRedexData_PhotographicWeightingCarriedOver; /* can't change mode in the middle of a sequence */
              intRawLength = intRedexData_CurrentSubLength;
              //goto deal_with_unmatched_pixels;
              bSkipMatches = true;
          }

        next_section:
          do {
              if (!bSkipMatches) {
                  var intEncoding = ExpandByte(T_BITMAP_ENCODING) & 0xff;
                  intLocalCurrentLength--;

                  var intLengthInfo = LengthDecodeTable[intEncoding & 0x3F];

                  var intRunLength = intLengthInfo & 0xFF;
                  intRawLength = intLengthInfo >>> 8;

                  if ((intRunLength | intRawLength) == 0xFF)
                  {
                      /* some extension is needed */
                      mutableLocalLength.value = intLocalCurrentLength;
                      if (intRawLength == 0xFF)
                      {
                          /* extend raw length */
                          //intRawLength = DoObjDecodeBigNumber(pred, &intLocalCurrentLength);
                          intRawLength = DoObjDecodeBigNumber(mutableLocalLength);
                          //TRACE((TC_WD, TT_API3,"RAW LENGTH = %d\n", intRawLength));
                      }
                      if (intRunLength == 0xFF)
                      {
                          /* extend run length */
                          //intRunLength = DoObjDecodeBigNumber(pred, &intLocalCurrentLength);
                          intRunLength = DoObjDecodeBigNumber(mutableLocalLength);
                          //TRACE((TC_WD, TT_API3,"RUN LENGTH = %d\n", intRunLength));
                      }
                      intLocalCurrentLength = mutableLocalLength.value;
                  }

                  //TRACE((TC_WD, TT_API3,"ENCODING NR %d: code = %x, raw = %d, run = %d\n", pred->EncodingNr, encoding, intRawLength, intRunLength));
                  intRedexData_EncodingNr++;

//                     int mask = /*(INT32)*/encoding << 25; /* get the 2-color/multi-color bit to the top */
//                     mask = mask >> 31; /* should give a mask of 0 or 0xFFFFFFFF */
//                     intRawLength &= mask;  /* only significant for us if we were multi-color mode */
//                     intRawLength = (encoding & (1<<6)) != 0 ? intRawLength : 0;
                  // Check bit 6 (2-color/multi-color).  If 2-color, the intRawLength
                  // does *not* represent more bytes to decode.
                  if ((intEncoding & (1<<6)) == 0)
                      intRawLength = 0;
              }

            deal_with_unmatched_pixels:
              bSkipMatches = false;

              /* a non-empty multi-color section - process the raw unmatched bytes */
              if (intRawLength > 0)
              {
                  if (intPhotographicWeightingToTest > 0)
                  {
                      /* encoded using differencing method */
                      while ((intRawLength > 0) && (intLocalCurrentLength > 0))
                      {
                          var intCode = ExpandByte(T_FIRST_BYTE_OF_PIXEL) & 0xff;
                          intRawLength--;

                          if ((intCode & 0x80) == 0)
                          {
                              /* 7 bits of difference data */
                              intPhotographicWeighting++;
                              intLocalCurrentLength--; /* we only ate one byte */
                          }
                          else
                          {
                              /* 15 bits of difference data */
                              ExpandByte(T_COLOR_1);
                              intPhotographicWeighting--;
                              intLocalCurrentLength -= 2; /* we ate two bytes */
                          }
                      }
                      if (intRawLength > 0)
                      {
                          /* did not manage to complete the sequence */
                          intRedexData_PhotographicWeightingCarriedOver = 1; /* make sure we don't start off in photo mode next time to complete this sequence */
                          intRedexData_CurrentSubLength = intRawLength;
                          bytRedexData_CurrentState = T_FIRST_BYTE_OF_PIXEL;
                          //goto check_exit;
                          //checkExit(intLocalCurrentLength, intPhotographicWeighting, 12);
                          //return;
                          break exit_section;
                      }
                  }
                  else
                  {
                      /* encoded using caching method */
                      while ((intRawLength > 0)  && (intLocalCurrentLength > 0))
                      {
                          var intCode = ExpandByte(T_FIRST_BYTE_OF_PIXEL) & 0xff;
                          intRawLength--;
                          if ((intCode & 0x80) == 0)
                          {
                              /* a cache hit */
                              intPhotographicWeighting--;
                              intLocalCurrentLength--; /* we only ate one byte */
                          }
                          else
                          {
                              /* we have the pixel data in full */
                              ExpandByte(T_COLOR_1);
                              intPhotographicWeighting++;
                              intLocalCurrentLength -= 2; /* we ate two bytes */
                          }
                      }
                      if (intRawLength > 0)
                      {
                          /* did not manage to complete the sequence */
                          intRedexData_PhotographicWeightingCarriedOver = -1; /* make sure we start off in normal mode next time to complete this sequence */
                          intRedexData_CurrentSubLength = intRawLength;
                          bytRedexData_CurrentState = T_FIRST_BYTE_OF_PIXEL;
                          //goto check_exit;
                          //checkExit(intLocalCurrentLength, intPhotographicWeighting, 12);
                          //return;
                          break exit_section;
                      }
                  }
              }

              intPhotographicWeightingToTest = intPhotographicWeighting; /* from now on test real value */
//             if (intLocalCurrentLength > 0)
//             {
//                 goto next_section;
//             }
          } while (intLocalCurrentLength > 0);

          bytRedexData_CurrentState = T_BITMAP_ENCODING;
      }
      check_exit:
      //checkExit(intLocalCurrentLength, intPhotographicWeighting, 12);
      intRedexData_CurrentPhotographicWeighting = intPhotographicWeighting;

      if (intLocalCurrentLength != 0)
      {
          //TRACE((TC_WD, TT_ERROR,"16-BIT BITMAP PARSE ERROR\n"));

          bytRedexData_ThinwireParserErrorCode = 12;
      }

      //TRACE((TC_WD, TT_API3,"------- HALT 16BPP -----------\n"));
    };

    var DoStartBitmap24BPP = function ()
    {
      /* brand new object */
      intRedexData_CurrentLength = DoObjDecodeUintXy(/*pred,*/ intRedexData_CurrentLength);

      bytRedexData_CurrentState = T_BITMAP_ENCODING;
      intRedexData_CurrentPhotographicWeighting = TW2_INITIAL_PHOTOGRAPHIC_WEIGHTING;
    };


    var DoContinueBitmap24BPP = function()
    {
      //UCHAR encoding, code;
      var/*INT32*/ /*intRunLength,*/ intRawLength = 0;
      var/*LONG*/ intPhotographicWeighting, intPhotographicWeightingToTest;
      //INT32 mask;
      //USHORT lengthInfo;
      var/*INT32*/ intLocalCurrentLength;

      var mutableLocalLength = new MutableInt(0);

      //TRACE((TC_WD, TT_API3,"------- CONTINUE 24BPP -----------\n"));

      intPhotographicWeighting = intRedexData_CurrentPhotographicWeighting;
      intPhotographicWeightingToTest = intRedexData_CurrentPhotographicWeighting;

      intLocalCurrentLength = intRedexData_CurrentLength < intRedexData_NrOfExpanderBytesRemaining?intRedexData_CurrentLength:intRedexData_NrOfExpanderBytesRemaining;
      intRedexData_CurrentLength -= intLocalCurrentLength;
      if (intRedexData_CurrentLength <= 0)
      {
          /* this will end the command */
          intRedexData_CurrentCommand = 0;
      }

    exit_section:
      {
          if (intLocalCurrentLength <= 0)
          {
              //goto check_exit;
              //checkExit(intLocalCurrentLength, intPhotographicWeighting, 13);
              //return;
              break exit_section;
          }

          if (bytRedexData_CurrentCodecID  == BMP_CODEC_NULL)
          {
              while (intLocalCurrentLength >= 3)
              {
                  ExpandByte(T_FIRST_BYTE_OF_PIXEL);
                  ExpandByte(T_COLOR_1);
                  ExpandByte(T_COLOR_2);
                  intLocalCurrentLength -= 3;
              }
              //goto check_exit;
              //checkExit(intLocalCurrentLength, intPhotographicWeighting, 13);
              //return;
              break exit_section;
          }

          var bSkipMatches = false;

          if (bytRedexData_CurrentState == T_FIRST_BYTE_OF_PIXEL)
          {
              /* we are in the middle of a run of raw pixels */
              intPhotographicWeightingToTest = intRedexData_PhotographicWeightingCarriedOver; /* can't change mode in middle of a sequence */
              intRawLength = intRedexData_CurrentSubLength;
              //goto deal_with_unmatched_pixels;
              bSkipMatches = true;
          }

        next_section:

          do {
              if (!bSkipMatches) {
                  var intEncoding = ExpandByte(T_BITMAP_ENCODING) & 0xff;
                  intLocalCurrentLength--;

                  var intLengthInfo = LengthDecodeTable[intEncoding & 0x3F];

                  var intRunLength = intLengthInfo & 0xFF;
                  intRawLength = intLengthInfo >>> 8;

                  if ((intRunLength | intRawLength) == 0xFF)
                  {
                      /* some extension is needed */
                      mutableLocalLength.value = intLocalCurrentLength;
                      if (intRawLength == 0xFF)
                      {
                          /* extend raw length */
                          //intRawLength = DoObjDecodeBigNumber(pred, &intLocalCurrentLength);
                          intRawLength = DoObjDecodeBigNumber(mutableLocalLength);
                          //TRACE((TC_WD, TT_API3,"RAW LENGTH = %d\n", intRawLength));
                      }
                      if (intRunLength == 0xFF)
                      {
                          /* extend run length */
                          //intRunLength = DoObjDecodeBigNumber(pred, &intLocalCurrentLength);
                          intRunLength = DoObjDecodeBigNumber(mutableLocalLength);
                          //TRACE((TC_WD, TT_API3,"RUN LENGTH = %d\n", intRunLength));
                      }
                      intLocalCurrentLength = mutableLocalLength.value;
                  }

                  //TRACE((TC_WD, TT_API3,"ENCODING NR %d: code = %x, raw = %d, run = %d\n", pred->EncodingNr, encoding, intRawLength, intRunLength));
                  intRedexData_EncodingNr++;

//                     int mask = /*(INT32)*/encoding << 25; /* get the 2-color/multi-color bit to the top */
//                     mask = mask >> 31; /* should give a mask of 0 or 0xFFFFFFFF */
//                     intRawLength &= mask;  /* only significant for us if we were multi-color mode */
//                     intRawLength = (encoding & (1<<6)) != 0 ? intRawLength : 0;
                  // Check bit 6 (2-color/multi-color).  If 2-color, the intRawLength
                  // does *not* represent more bytes to decode.
                  if ((intEncoding & (1<<6)) == 0)
                      intRawLength = 0;
              }

            deal_with_unmatched_pixels:
              bSkipMatches = false;

              /* a non-empty multi-color section - process the raw unmatched bytes */
              if (intRawLength > 0)
              {
                  if (intPhotographicWeightingToTest > 0)
                  {
                      /* encoded using differencing method */
                      while ((intRawLength > 0) && (intLocalCurrentLength > 0))
                      {
                          var intCode = ExpandByte(T_FIRST_BYTE_OF_PIXEL) & 0xff;
                          intRawLength--;

                          if ((intCode & 0x80) == 0)
                          {
                              /* 15 bits of difference data */
                              ExpandByte(T_COLOR_1);
                              intPhotographicWeighting++;
                              intLocalCurrentLength -= 2; /* we ate two bytes */
                          }
                          else if ((intCode & 0x40) == 0)
                          {
                              /* 6 bits of difference data */
                              intPhotographicWeighting += 2;
                              intLocalCurrentLength--; /* we only ate one byte */
                          }
                          else if ((intCode & 0x20) == 0)
                          {
                              /* 21 bits of difference data */
                              ExpandByte(T_COLOR_1);
                              ExpandByte(T_COLOR_2);
                              intPhotographicWeighting--;
                              intLocalCurrentLength -= 3; /* we ate three bytes */
                          }
                          else
                          {
                              /* get 24 bits of data */
                              ExpandByte(T_COLOR_0);
                              ExpandByte(T_COLOR_1);
                              ExpandByte(T_COLOR_2);
                              intPhotographicWeighting -= 2;
                              intLocalCurrentLength -= 4; /* we ate four bytes */
                          }
                      }
                      if (intRawLength > 0)
                      {
                          /* did not manage to complete the sequence */
                          intRedexData_PhotographicWeightingCarriedOver = 1; /* make sure we don't start off in photo mode next time to complete this sequence */
                          intRedexData_CurrentSubLength = intRawLength;
                          bytRedexData_CurrentState = T_FIRST_BYTE_OF_PIXEL;
                          //goto check_exit;
                          //checkExit(intLocalCurrentLength, intPhotographicWeighting, 13);
                          //return;
                          break exit_section;
                      }
                  }
                  else
                  {
                      /* encoded using caching method */
                      while ((intRawLength > 0)  && (intLocalCurrentLength > 0))
                      {
                          var intCode = ExpandByte(T_FIRST_BYTE_OF_PIXEL) & 0xff;
                          intRawLength--;

                          if ((intCode & 0x80) == 0)
                          {
                              /* a cache hit */
                              intPhotographicWeighting--;
                              intLocalCurrentLength--; /* we only ate one byte */
                          }
                          else
                          {
                              /* we have the pixel data in full */
                              ExpandByte(T_COLOR_0);
                              ExpandByte(T_COLOR_1);
                              ExpandByte(T_COLOR_2);
                              intPhotographicWeighting++;
                              intLocalCurrentLength -= 4; /* we ate four bytes */
                          }
                      }
                      if (intRawLength > 0)
                      {
                          /* did not manage to complete the sequence */
                          intRedexData_PhotographicWeightingCarriedOver = -1; /* make sure we start off in photo mode next time to complete this sequence */
                          intRedexData_CurrentSubLength = intRawLength;
                          bytRedexData_CurrentState  = T_FIRST_BYTE_OF_PIXEL;
                          //goto check_exit;
                          //checkExit(intLocalCurrentLength, intPhotographicWeighting, 13);
                          //return;
                          break exit_section;
                      }
                  }
              }

              intPhotographicWeightingToTest = intPhotographicWeighting; /* from now on test real value */

          //         if (intLocalCurrentLength > 0)
          //         {
          //             goto next_section;
          //         }
          } while (intLocalCurrentLength > 0);
          bytRedexData_CurrentState = T_BITMAP_ENCODING;
      }
    check_exit:

      intRedexData_CurrentPhotographicWeighting = intPhotographicWeighting;

      if (intLocalCurrentLength != 0)
      {
          //TRACE((TC_WD, TT_ERROR,"16-BIT BITMAP PARSE ERROR\n"));

          bytRedexData_ThinwireParserErrorCode = 13;
      }
      //checkExit(intLocalCurrentLength, intPhotographicWeighting, 13);

      //TRACE((TC_WD, TT_API3,"------- HALT 24BPP -----------\n"));
    };


    var DoStartComplexClipRegion = function()
    {
        //TRACE((TC_WD, TT_API3,"DoStartComplexClipRegion: currentLength = %d\n", pred->CurrentLength));

        /* decode dimension of first rectangle */
        intRedexData_CurrentLength = DoObjDecodeUintXy(/*pred,*/ intRedexData_CurrentLength);

        /* decode rectangle count (which we will not actually use here) */
        intRedexData_CurrentLength = DoObjDecodeUint(/*pred,*/ T_NUMBER, intRedexData_CurrentLength);

        //TRACE((TC_WD, TT_API3,"DoStartComplexClipRegion: currentLength now = %d\n", pred->CurrentLength));
    };

    var DoContinueComplexClipRegion = function()
    {
        var /*INT32*/ intLocalCurrentLength;

        //TRACE((TC_WD, TT_API3,"------- CONTINUE COMPLEX CLIP -----------\n"));

        intLocalCurrentLength = intRedexData_CurrentLength < intRedexData_NrOfExpanderBytesRemaining?intRedexData_CurrentLength:intRedexData_NrOfExpanderBytesRemaining;
        intRedexData_CurrentLength -= intLocalCurrentLength;
        if (intRedexData_CurrentLength <= 0)
        {
            /* this will end the command */
            intRedexData_CurrentCommand = 0;
        }

        while (/*(INT32)*/intLocalCurrentLength > 0)
        {
            /* decode next rectangle */
            intLocalCurrentLength = DoObjDecodeIntXy(/*pred,*/ T_START_CLIP_RECTANGLE,
                                                  intLocalCurrentLength);
            intLocalCurrentLength = DoObjDecodeUintXy(/*pred,*/ intLocalCurrentLength);
        }

        if (intLocalCurrentLength != 0)
        {
            bytRedexData_ThinwireParserErrorCode = 14;
        }
    };


    var DoContinueTextout = function()
    {
        var/*INT32*/ intLocalCurrentLength;

        //TRACE((TC_WD, TT_API3,"-------- DoContinueTextout ---------\n"));

        intLocalCurrentLength = intRedexData_CurrentLength<intRedexData_NrOfExpanderBytesRemaining?intRedexData_CurrentLength:intRedexData_NrOfExpanderBytesRemaining;
        intRedexData_CurrentLength -= intLocalCurrentLength;
        if (intRedexData_CurrentLength <= 0)
        {
            /* this will end the command */
            intRedexData_CurrentCommand = 0;
        }

        while (intLocalCurrentLength >= 2)
        {
            intLocalCurrentLength -= 2;
            ExpandByte(T_GLYPH_HANDLE_LOW);
            ExpandByte(T_HANDLE_HIGH);
        }

        if (intLocalCurrentLength != 0)
        {
            //TRACE((TC_WD, TT_ERROR,"TEXT PARSE ERROR\n"));
            bytRedexData_ThinwireParserErrorCode = 15;
        }
    };

     var DoContinueGeneralObject = function(//PREDUCER_EXPANDER_DATA pred)
                                        )
    {
        //INT32 localCurrentLength;

        //TRACE((TC_WD, TT_API3,"CONTINUE GENERAL BEFORE cmd = %x, ot = %d, bt = %d, cl = %d, csl = %d\n",
        //     pred->CurrentCommand, pred->CurrentObjectType, pred->CurrentBitmapType, pred->CurrentLength, pred->CurrentSubLength));

        var intLocalCurrentLength = intRedexData_CurrentLength<intRedexData_NrOfExpanderBytesRemaining?intRedexData_CurrentLength:intRedexData_NrOfExpanderBytesRemaining;
        intRedexData_CurrentLength -= intLocalCurrentLength;
        if (intRedexData_CurrentLength <= 0)
        {
            /* this will end the command */
            intRedexData_CurrentCommand = 0;
        }

        if (intLocalCurrentLength > 0)
        {
            ExpandBytes(/*pred,*/ T_OBJECT, intLocalCurrentLength);
        }
        else if (intLocalCurrentLength < 0)
        {
            //TRACE((TC_WD, TT_ERROR,"GENERAL OBJECT PARSE ERROR\n"));
            bytRedexData_ThinwireParserErrorCode = 16;
        }
    };

    var DoContinueCurrentCommand = function()
    {
        //TRACE((TC_WD, TT_API3,"DoContinueCurrentCommand %x\n", pred->CurrentCommand));

        switch (intRedexData_CurrentCommand)
        {

        case CMD_TW2_TEXTOUT:

            ContinueTextout();
            break;

        case CMD_TW2_CACHE_WRITE_DISK_OBJECTS:
        case CMD_TW2_CACHE_PURGE_MEMORY_CACHE:

            ContinueGeneralObject();
            break;

        case CMD_TW2_CACHE_NEW_OBJECT:
        case CMD_TW2_CACHE_NEW_OBJECT_INCOMPLETE:
        case CMD_TW2_CACHE_EXTEND_OBJECT:
        case CMD_TW2_CACHE_EXTEND_OBJECT_INCOMPLETE:

            if (bRedexData_UseLightweightObjectParsing)
            {
                ContinueGeneralObject();
                break;
            }

            if (bytRedexData_CurrentObjectType == TW2_CACHE_OBJ_ID_BITMAP)
            {
                switch (bytRedexData_CurrentBitmapType)
                {
                case TW2_1BPP:

                    ContinueBitmapLessThan8BPP();
                    break;

                case TW2_4BPP:

                    ContinueBitmapLessThan8BPP();
                    break;

                case TW2_8BPP:

                    ContinueBitmap8BPP();
                    break;

                case TW2_15BPP:

                    ContinueBitmap16BPP();
                    break;

                case TW2_24BPP:

                    if (bytRedexData_CurrentCodecID == BMP_CODEC_ID_JPEG_LOSSY)
                    {
                        ContinueBitmapJPEG();
                    }
                    else
                    {
                        ContinueBitmap24BPP();
                    }
                    break;
                }
            }
            else
            {
                switch (bytRedexData_CurrentObjectType)
                {

                case TW2_CACHE_OBJ_ID_1BPP_GLYPH:

                    ContinueGlyph();
                    break;

                case TW2_CACHE_OBJ_ID_COMPLEX_RECT_REGION:

                    ContinueComplexClipRegion();
                    break;

                case TW2_CACHE_OBJ_ID_RGB_PALETTE:

                    ContinueRgbPalette();
                    break;

                case TW2_CACHE_OBJ_ID_STRIP:

                    ContinueStrip();
                    break;

                case TW2_CACHE_OBJ_ID_INDEX_PALETTE:

                    ContinueIndexPalette();
                    break;

                case TW2_CACHE_OBJ_ID_SEGMENT:

                    ContinueSegment();
                    break;
                }
            }
            break;
        }
    };


    var ExpandThinwireData = function(//PREDUCER_EXPANDER_DATA pred)    /* expander data structure */
                                   )
    {
        var/*ULONG*/ /*nrOfGlyphs,*/ intObjectLength/*, i*/, intCount;
        //int/*INT32*/ length;
        //byte/*UCHAR*/ /*command,*/ /*intControl,*/ intRop3;
        var /*command,*/ intControl/*, intRop3*/;
        var/*UCHAR*/ /*intTw2Version,*/ /*intColorDepth,*/ /*flags,*/ /*colorFlags,*/ /*objectType,*/ /*bitmapType,*/ bytCodecID;
        //int /*intTw2Version,*/ /*intColorDepth,*/ /*flags,*/ /*colorFlags,*/ /*objectType,*/ bitmapType;
        //int/*USHORT*/ /*capsListLength,*/ capsListOffset;
        //boolean/*BOOL*/ newObject;

        //TRACE((TC_WD, TT_API3,"ExpandThinwireData: ENTER cmd = %x, ot = %d, bt = %d, cl = %d, csl = %d\n",
        //    pred->CurrentCommand, pred->CurrentObjectType, pred->CurrentBitmapType, pred->CurrentLength, pred->CurrentSubLength));

        if (intRedexData_CurrentCommand > 0)
        {
            /* we are in the middle of a command */
            ContinueCurrentCommand();
        }

      processCommands:
        {
            while (intRedexData_NrOfExpanderBytesRemaining > 0)
            {
                var intCommand = ExpandByte(T_COMMAND) & 0xff;

                switch (intCommand)
                {
                case CMD_TW2_INIT:

                    var intTw2Version = ExpandByte(T_CONTROL) & 0xff;               /* tw2 version */
                    //DecodeUint32(T_NUMBER);                           /* session id */
                    ExpandBytes(T_NUMBER, 4);                           /* session id */
                    var intColorDepth = ExpandByte(T_CONTROL) & 0xff;               /* color depth */
                    DecodeUintXy();                                   /* screen resolution */
                    DecodeUint(T_SMALL_NUMBER);                       /* cache power */
                    DecodeUint(T_SMALL_NUMBER);                       /* handle power */
                    DecodeUint(T_NUMBER);                             /* max objectlength */
                    DecodeUint(T_NUMBER);                             /* min disk object length */
                    DecodeUint(T_NUMBER);                             /* initial seed value */

                    if (intTw2Version >= 3)
                    {
                        // Capabilities list length
                        var intCapsListLength = DecodeUint16(T_NUMBER, T_NUMBER);
                        // Capabilities list offset
                        var intCapsListOffset = DecodeUint16(T_NUMBER, T_NUMBER);

                        // BUGBUG assumes that capabilities list immediately follows
                        // the header.
                        // Capability list items
                        ExpandBytes(T_NUMBER, intCapsListLength);
                    }

                    if (intColorDepth == TW2_24BPP)
                    {
                        bytRedexData_NrOfColorBytes = 3;
                    }
                    else if (intColorDepth == TW2_15BPP)
                    {
                        bytRedexData_NrOfColorBytes = 2;
                    }
                    else
                    {
                        bytRedexData_NrOfColorBytes = 1;
                    }
                    break;

                case CMD_TW2_ACTIVATE_THINWIRE_REDUCER:

                    /* special activation string */
                    ExpandBytes(T_CONTROL, 16);

                    /* parser level */
                    intRedexData_ThinwireParserLevel = ExpandByte(T_CONTROL) & 0xff;
                    if (intRedexData_ThinwireParserLevel > 1)
                    {
                        /* I only understand parser levels zero and one - should not have got this */
                        //TRACE((TC_WD, TT_ERROR,"Illegal parser level %d\n", pred->ThinwireParserLevel));

                        bytRedexData_ThinwireParserErrorCode = 1;
                        //goto error;
                        break processCommands;
                    }
                    break;

                case CMD_TW2_SET_MOUSE_POINTER:

                    var intFlags = ExpandByte(T_CONTROL) & 0xff;
                    DecodeUintXy();
                    if ((intFlags & 0x01) == 0)
                    {
                        /* color info */
                        var intColorFlags = ExpandByte(T_CONTROL) & 0xff;
                        if ((intColorFlags & 0x01) != 0)
                        {
                            DecodeHandle();
                        }
                        DecodeHandle();
                    }
                    DecodeHandle();
                    break;

                case CMD_TW2_HIDE_MOUSE_POINTER:
                case CMD_TW2_NULL_CLIP_REGION:
                case CMD_TW2_CHANGE_TEXT_MODE:
                case CMD_TW2_RESTORE_MOUSE_POINTER:

                    break;

                case CMD_TW2_SIMPLE_CLIP_REGION:

                    DecodeIntXy();
                    DecodeUintXy();
                    break;

                case CMD_TW2_COMPLEX_CLIP_REGION:

                    DecodeIntXy();
                    DecodeHandle();
                    break;

                case CMD_TW2_NEW_SOLID_BRUSH:
                case CMD_TW2_CHANGE_TEXT_COLOR:
                case CMD_TW2_CHANGE_TEXT_BACKGROUND_COLOR:

                    DecodeColor();
                    break;

                case CMD_TW2_NEW_PATTERN_BRUSH:

                    intControl = ExpandByte(T_CONTROL) & 0xff;
                    if ((intControl & PATTERN_BRUSH_CONTROL_bHAS_PALETTE) != 0)
                    {
                        DecodeHandle();
                    }
                    DecodeHandle();
                    if ((intControl & PATTERN_BRUSH_CONTROL_bOFFSET) != 0)
                    {
                        DecodeUintXy();
                    }
                    break;

                case CMD_TW2_CHANGE_PALETTE:

                    ExpandByte(T_NUMBER);
                    DecodeHandle();
                    break;

                case CMD_TW2_SOLID_FILL_NEW_COLOR:
                case CMD_TW2_SOLID_FILL_NEW_COLOR_NO_CLIPPING:

                    DecodeColor();
                    /* fall trhough */

                case CMD_TW2_SOLID_FILL:
                case CMD_TW2_SOLID_FILL_NO_CLIPPING:

                    DecodeIntXy();
                    DecodeUintXy();
                    break;

                case CMD_TW2_PARTIAL_BITBLT_TRICK:

                    DecodeIntXy();
                    DecodeUintXy();
                    /* fall through */

                case CMD_TW2_BITBLT_TRICK:

                    DecodeHandle();
                    DecodeIntXy();
                    break;

                case CMD_TW2_SCR_TO_SCR_BLT:

                    //intRop3 = DecodeByte(T_CONTROL);
                    ExpandByte(T_CONTROL);
                    DecodeIntXy();
                    DecodeUintXy();
                    DecodeIntXy();
                    break;

                case CMD_TW2_BITBLT:

                    var intRop3 = ExpandByte(T_CONTROL) & 0xff;
                    if (IsSourceROP(intRop3))
                    {
                        intControl = ExpandByte(T_CONTROL) & 0xff;
                        if ((intControl & BITBLT_SOURCE_BMP_CONTROL_bFromRemoteSurface) != 0)
                        {
                            DecodeUint16(T_NUMBER, T_SMALL_NUMBER);
                        }
                        else
                        {
                            if ((intControl & BITBLT_SOURCE_BMP_CONTROL_bHAS_PALETTE) != 0)
                            {
                                DecodeHandle();
                            }
                            DecodeHandle();
                        }
                        if ((intControl & BITBLT_SOURCE_BMP_CONTROL_bCLIP) != 0)
                        {
                            DecodeUintXy();
                            DecodeUintXy();
                        }
                        DecodeIntXy();
                    }
                    else
                    {
                        DecodeIntXy();
                        DecodeUintXy();
                    }
                    break;

                case CMD_TW2_TEXTOUT:

                    DecodeIntXy();
                    DecodeUintXy();
                    var intNrOfGlyphs = (ExpandByte(T_SMALL_NUMBER) & 0xff) + 1;
                    DecodeIntXy();

                    var intLength = intNrOfGlyphs * 2;
                    intRedexData_CurrentCommand  = CMD_TW2_TEXTOUT;
                    intRedexData_CurrentLength  = intLength;
                    ContinueTextout();
                    break;

                case CMD_TW2_DRAW_PATH:

                    intControl = ExpandByte(T_CONTROL) & 0xff;
                    if ((intControl & PATH_CONTROL_COLORCHANGE) != 0)
                    {
                        DecodeColor();
                    }
                    if ((intControl & PATH_CONTROL_MIXCHANGE) != 0)
                    {
                        ExpandByte(T_NUMBER);
                    }
                    DecodeIntXy();
                    if ((intControl & PATH_CONTROL_NOT_CACHED) != 0)
                    {
                        switch (intControl & PATH_CONTROL_TYPE)
                        {
                        case PATH_TYPE_STRIPS:
                            /* fetch number of segments */
                            intCount = (ExpandByte(T_NUMBER) & 0xff) + 1;
                            while (intCount-- > 0)
                            {
                                /* fetch angle */
                                ExpandByte(T_NUMBER);

                                /* fetch number of strips */
                                var i = (ExpandByte(T_NUMBER) & 0xff) + 1;
                                while (i-- > 0)
                                {
                                    var stripByte;

                                    /* fetch strip byte */
                                    stripByte = ExpandByte(T_NUMBER);

                                    if ((stripByte & 0x3f) == 0)
                                    {
                                        /* decode the length */

                                        DecodeUint(T_NUMBER);
                                    }
                                }
                            }
                            break;

                        case PATH_TYPE_SEGMENTS:
                            intCount = DecodeUint16(T_NUMBER, T_SMALL_NUMBER) + 1;
                            for (var i = 0;  i < intCount;  i++)
                            {
                                DecodeIntXy();
                                DecodeIntXy();
                            }
                            break;
                        }
                    }
                    else
                    {
                        DecodeHandle();
                    }
                    break;

                case CMD_TW2_CACHE_NEW_OBJECT:
                case CMD_TW2_CACHE_NEW_OBJECT_INCOMPLETE:
                case CMD_TW2_CACHE_EXTEND_OBJECT:
                case CMD_TW2_CACHE_EXTEND_OBJECT_INCOMPLETE:

                    /* get the object length */
                    intObjectLength = DecodeUint(T_NUMBER);
                    intRedexData_CurrentLength = intObjectLength;
                    intRedexData_CurrentCommand = intCommand;

                    if (bRedexData_UseLightweightObjectParsing)
                    {
                        ContinueGeneralObject();
                        break;
                    }

                    var bNewObject = (((intCommand - CMD_TW2_CACHE_NEW_OBJECT) & 2) ^ 2) != 0;
                    if (bNewObject)
                    {
                        var intObjectType = ExpandByte(T_CONTROL) & 0xff;      /* object type */
                        intObjectLength--;
                        bytRedexData_CurrentObjectType  = intObjectType & 0xff;
                        intRedexData_CurrentSubLength = 0;
                        intRedexData_CurrentLength = intObjectLength;
                        if (intObjectType == TW2_CACHE_OBJ_ID_BITMAP)
                        {
                            var intBitmapType = ExpandByte(T_CONTROL) & 0xff;  /* bitmap type */
                            intObjectLength--;
                            bytCodecID = (intBitmapType >>> 4) & 0xff;
                            intBitmapType &= 0xF;
                            bytRedexData_CurrentBitmapType = intBitmapType & 0xff;
                            bytRedexData_CurrentCodecID = bytCodecID;
                            intRedexData_CurrentLength = intObjectLength;

                            //TRACE((TC_WD, TT_API3,"NEW BITMAP cmd = %x, ot = %d, bt = %d, cl = %d, csl = %d\n",
                            //    pred->CurrentCommand, pred->CurrentObjectType, pred->CurrentBitmapType, pred->CurrentLength, pred->CurrentSubLength));

                            switch (intBitmapType & 0xff)
                            {

                            case TW2_1BPP:

                                //StartBitmapLessThan8BPP();
                                break;

                            case TW2_4BPP:

                                //StartBitmapLessThan8BPP();
                                break;

                            case TW2_8BPP:

                                StartBitmap8BPP();
                                break;

                            case TW2_15BPP:

                                StartBitmap16BPP();
                                break;

                            case TW2_24BPP:

                                if (bytCodecID == BMP_CODEC_ID_JPEG_LOSSY)
                                {
                                    StartBitmapJPEG();
                                }
                                else
                                {
                                    StartBitmap24BPP();
                                }
                                break;

                            default:

                                //TRACE((TC_WD, TT_ERROR,"ExpandThinwireData: ERROR unexpected bitmap type %d\n", bitmapType));
                                bytRedexData_ThinwireParserErrorCode = 2;
                                //goto error;
                                break processCommands;
                            }
                        }
                        else
                        {
                            //TRACE((TC_WD, TT_API3,"NEW NON BITMAP cmd = %x, ot = %d, bt = %d, cl = %d, csl = %d\n",
                            //    pred->CurrentCommand, pred->CurrentObjectType, pred->CurrentBitmapType, pred->CurrentLength, pred->CurrentSubLength));

                            switch (intObjectType & 0xff)
                            {

                            case TW2_CACHE_OBJ_ID_1BPP_GLYPH:

                                //StartGlyph();
                                break;

                            case TW2_CACHE_OBJ_ID_COMPLEX_RECT_REGION:

                                StartComplexClipRegion();
                                break;

                            case TW2_CACHE_OBJ_ID_RGB_PALETTE:

                                //StartRgbPalette();
                                break;

                            case TW2_CACHE_OBJ_ID_STRIP:

                                //StartStrip();
                                break;

                            case TW2_CACHE_OBJ_ID_INDEX_PALETTE:

                                //StartIndexPalette();
                                break;

                            case TW2_CACHE_OBJ_ID_SEGMENT:

                                //StartSegment();
                                break;

                            default:

                                //TRACE((TC_WD, TT_ERROR,"ExpandThinwireData: ERROR unexpected object type %d\n", objectType));

                                bytRedexData_ThinwireParserErrorCode = 3;
                                //goto error;
                                break processCommands;
                            }
                        }
                    }

                    //TRACE((TC_WD, TT_API3,"CONTINUE OBJECT cmd = %x, ot = %d, bt = %d, cl = %d, csl = %d\n",
                    //            pred->CurrentCommand, pred->CurrentObjectType, pred->CurrentBitmapType, pred->CurrentLength, pred->CurrentSubLength));

                    ContinueCurrentCommand();
                    break;

                case CMD_TW2_CACHE_WRITE_DISK_OBJECTS:

                    intCount = ExpandByte(T_SMALL_NUMBER) & 0xff;
                    intCount *= 10;
                    intRedexData_CurrentCommand = CMD_TW2_CACHE_WRITE_DISK_OBJECTS;
                    intRedexData_CurrentLength  = intCount;
                    ContinueGeneralObject();
                    break;

                case CMD_TW2_CACHE_READ_DISK_OBJECT:

                    DecodeUint(T_NUMBER);
                    ExpandBytes(T_NUMBER, 8);
                    break;

                case CMD_TW2_CACHE_PURGE_MEMORY_CACHE:

                    intObjectLength = (DecodeUint(T_NUMBER) + 7) / 8;
                    intRedexData_CurrentCommand  = CMD_TW2_CACHE_PURGE_MEMORY_CACHE;
                    intRedexData_CurrentLength = intObjectLength;
                    ContinueGeneralObject();
                    break;

                case CMD_TW2_START_STOPWATCH:

                    DecodeUint16(T_NUMBER, T_SMALL_NUMBER);
                    break;

                case CMD_TW2_STOP_STOPWATCH:

                    DecodeUint16(T_NUMBER, T_SMALL_NUMBER);
                    break;

                case CMD_TW2_CACHE_RECOVERY_MARKER:

                    ExpandBytes(T_NUMBER, 20);
                    break;

                case CMD_TW2_SAVE_SCREEN_BITS:

                    ExpandByte(T_SMALL_NUMBER);
                    DecodeIntXy();
                    DecodeUintXy();
                    break;

                case CMD_TW2_RESTRORE_AND_FREE_SCREEN_BITS:
                case CMD_TW2_FREE_SCREEN_BITS:

                    ExpandByte(T_SMALL_NUMBER);
                    break;

                case CMD_TW2_CREATE_SURFACE:

                    DecodeUint(T_NUMBER);
                    DecodeUintXy();
                    break;

                case CMD_TW2_DELETE_SURFACE:
                case CMD_TW2_CHANGE_SURFACE:

                    DecodeUint(T_NUMBER);
                    break;

                case CMD_TW2_BITBLT_SPEEDBROWSE:

                    //DecodeUint32(T_NUMBER);
                    ExpandBytes(T_NUMBER, 4);
                    DecodeIntXy();
                    DecodeIntXy();
                    DecodeUintXy();
                    break;

                case CMD_TW2_CREATE_SPEEDBROWSE_IMAGE:

                    //DecodeUint32(T_NUMBER);
                    ExpandBytes(T_NUMBER, 4);
                    ExpandByte(T_CONTROL);
                    //DecodeUint32(T_NUMBER);
                    ExpandBytes(T_NUMBER, 4);
                    ExpandByte(T_CONTROL);
                    break;

                case CMD_TW2_DELETE_SPEEDBROWSE_IMAGE:

                    //DecodeUint32(T_NUMBER);
                    ExpandBytes(T_NUMBER, 4);
                    break;

                case CMD_TW2_ASSOCIATE_SPEEDBROWSE_DATA_CHUNK:

                    //DecodeUint32(T_NUMBER);
                    ExpandBytes(T_NUMBER, 4);
                    //DecodeUint32(T_NUMBER);
                    ExpandBytes(T_NUMBER, 4);
                    break;

                case CMD_TW2_STRETCHIMAGE_SPEEDBROWSE:

                    /* 4 byte SpeedBrowse Image Id */
                    //DecodeUint32(T_NUMBER);
                    ExpandBytes(T_NUMBER, 4);

                    /* Clip flag*/
                    ExpandByte(T_CONTROL);

                    /* Clipping rectangle*/
                    DecodeIntXy();
                    DecodeUintXy();

                    /* Destination rectangle*/
                    DecodeIntXy();
                    DecodeUintXy();

                    /* Source rectangle*/
                    DecodeIntXy();
                    DecodeUintXy();
                    break;
                    
				case CMD_TW2_END_OF_FRAME:
					ExpandByte(T_CONTROL);
                    break;

                default: /* error */

                    //TRACE((TC_WD, TT_API3,"ExpandThinwireData: ERROR unexpected intCommand type %x\n", intCommand));

                    bytRedexData_ThinwireParserErrorCode = 4;
                    //goto error;
                    break processCommands;
                }
            }

            return;
        }


      error:
        return;
    }; //end expandthinwiredata

   /* returns FALSE if error */
    var RestartExpander = function(//PREDUCER_EXPANDER_DATA pred,                    /* expander data structure */
        /*PUCHAR*/                 pInput,                  /* compressed data */
                                   inputPos,
        /*ULONG*/                  nrOfBytesToMake,         /* nr of bytes to generate */
        /*PUCHAR*/                 pHighestPhysicalUshort)  /* don't read past this or may cause seggie */
    {
        var/*ULONG*/ intNewBits;
        var/*ULONG*/ intBottomBits, intStringShift, intStringLength;
        //STRING_DECODING stringDecoding;

        arrRedexData_compressedData = pInput;
        intRedexData_compressedIndex = inputPos;
        intRedexData_NrOfExpanderBytesRemaining = nrOfBytesToMake;
        intRedexData_highestPhysicalUshort = pHighestPhysicalUshort;

        /* must be legal to read at least one ushort even if encroaching on header data */
        intNewBits = LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(arrRedexData_compressedData,
                                                      intRedexData_compressedIndex);
        intRedexData_compressedIndex += 2;
        intRedexData_CompressedBits = intNewBits;
        if (intRedexData_compressedIndex <= pHighestPhysicalUshort)
        {
            intNewBits = LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(arrRedexData_compressedData,
                                                          intRedexData_compressedIndex);
        }
        intRedexData_compressedIndex += 2;
        // BUGBUG?
        intRedexData_CompressedBits |= intNewBits << 16;
        bytRedexData_NrOfCompressedBits = 32;

        if (intRedexData_StringLength == -1)
        {
            /* the last expansion did not end with a string */
            return true;
        }

        /* the last expansion did end with a string */
        if ((intRedexData_CompressedBits & 1) != 0)
        {
            /* but there is no continuation */
            intRedexData_CompressedBits >>>= 1;
            bytRedexData_NrOfCompressedBits--;
            intRedexData_StringLength = 0;
            return true;
        }

        /* a continuation string - get length of it */
        intRedexData_CompressedBits >>>= 1;
        bytRedexData_NrOfCompressedBits--;

        intBottomBits = intRedexData_CompressedBits & 0x7F;
        if (intBottomBits == 0x00)
        {
            /* a long string */
            intStringShift = 0;
            intStringLength = 0;
            do
            {
                intRedexData_CompressedBits >>>= 7;
                intStringLength |= ((intRedexData_CompressedBits & 0x7F) << intStringShift);
                intRedexData_CompressedBits >>>= 7;
                bytRedexData_NrOfCompressedBits -= 14;
                intStringShift += 7;

                if (intStringShift >= 21)
                {
                    //TRACE((TC_WD, TT_ERROR,"RestartExpander: Infeasibly large string length = %d\n", intStringLength));
                    bytRedexData_ExpanderErrorCode = 1;
                    return false;
                }

                if (bytRedexData_NrOfCompressedBits <= 16)
                {
                    /* refill compressed bits silo */
                    if (intRedexData_compressedIndex  <= pHighestPhysicalUshort)
                    {
                        intNewBits = LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(arrRedexData_compressedData,
                                                                      intRedexData_compressedIndex);
                    }
                    intRedexData_CompressedBits  |= intNewBits << /*(ULONG)*/bytRedexData_NrOfCompressedBits;
                    intRedexData_compressedIndex += 2;
                    bytRedexData_NrOfCompressedBits += 16;
                }

                intBottomBits = intRedexData_CompressedBits & 0x7F;
            } while (intBottomBits == 0x00);

//             stringDecoding = StringDecoding[intBottomBits];
//             intRedexData_CompressedBits >>>= stringDecoding.NrOfBits & 0xff;
//             bytRedexData_NrOfCompressedBits -=  stringDecoding.NrOfBits & 0xff;
//             intStringLength |= (((stringDecoding.BaseIndex & 0xff)
//                               | (intRedexData_CompressedBits & stringDecoding.ExtraBitsMask))
//                              << intStringShift);
            intRedexData_CompressedBits >>>= StringDecodingNrOfBits[intBottomBits];
            bytRedexData_NrOfCompressedBits -=  StringDecodingNrOfBits[intBottomBits];
            intStringLength |= ((StringDecodingBaseIndex[intBottomBits]
                              | (intRedexData_CompressedBits & StringDecodingExtraBitsMask[intBottomBits]))
                             << intStringShift);

            if (intStringLength > intRedexData_MaxVirtualWriteLength)
            {
                //TRACE((TC_WD, TT_ERROR,"RestartExpander: string (%d) longer than max virtual write (%d)\n",
                bytRedexData_ExpanderErrorCode = 2;
                return false;
            }
        }
        else
        {
            /* a short string */
//             stringDecoding = StringDecoding[intBottomBits];
//             intRedexData_CompressedBits >>>= stringDecoding.NrOfBits & 0xff;
//             bytRedexData_NrOfCompressedBits -=  stringDecoding.NrOfBits & 0xff;
//             intStringLength = (stringDecoding.BaseIndex & 0xff)
//                 | (intRedexData_CompressedBits & stringDecoding.ExtraBitsMask);
            intRedexData_CompressedBits >>>= StringDecodingNrOfBits[intBottomBits];
            bytRedexData_NrOfCompressedBits -=  StringDecodingNrOfBits[intBottomBits];
            intStringLength = StringDecodingBaseIndex[intBottomBits]
                | (intRedexData_CompressedBits  & StringDecodingExtraBitsMask[intBottomBits]);
        }

        intRedexData_CompressedBits >>>= StringDecodingNrOfExtraBits[intBottomBits];
        bytRedexData_NrOfCompressedBits -=  StringDecodingNrOfExtraBits[intBottomBits];

        if (bytRedexData_NrOfCompressedBits <= 16)
        {
            /* refill compressed bits silo */
            if (intRedexData_compressedIndex <= pHighestPhysicalUshort)
            {
                intNewBits = LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(arrRedexData_compressedData,
                                                              intRedexData_compressedIndex);
            }
            intRedexData_CompressedBits |= intNewBits << /*(ULONG)*/bytRedexData_NrOfCompressedBits;
            intRedexData_compressedIndex += 2;
            bytRedexData_NrOfCompressedBits += 16;
        }

        intRedexData_StringLength = intStringLength;

        return true;
    };


     /* returns FALSE if error */
    this.V3Expander = function(//PUCHAR predIn,                  /* expander data structure */
        channel,                 /* channel */
        decoderNr,               /* decoder nr */
        pInput,                  /* compressed data */
        inputPos,
        pHighestPhysicalUshort,  /* don't read past this or may cause seggie */
        nrOfBytesToMake,         /* nr of bytes to make via expansion */
//                        ULONG  *pNrOfBytesConsumed,     /* return nr of bytes consumed */
//                        PUCHAR *ppOutput,               /* pointer to start of expanded data */
//                        ULONG  *pOutputLength)          /* length of expanded data */
        expandedData)     // nr bytes, start and length
        //TODO: throws V3ExpanderException
    {
        var intLengthToEndOfHistoryBuffer;
        //PREDUCER_EXPANDER_DATA pred;
        //PUCHAR pHeadStart;
        var intHeadStart;

        //pred = (PREDUCER_EXPANDER_DATA)predIn;

        bytRedexData_ThinwireParserErrorCode = 0;
        bytRedexData_ExpanderErrorCode = 0;

        /* enforce wrap avoidance policy */
        //intLengthToEndOfHistoryBuffer = pred->pHistoryBufferEnd - pred->pHead;
        intLengthToEndOfHistoryBuffer = (intRedexData_HistoryBufferLength + 4) - intRedexData_headPos;


        if (/*(signed)*/intLengthToEndOfHistoryBuffer <= FORCE_WRAP_DISTANCE)
        {
            /* force the required wrap that sender will have done wrap if too close */
            //pred->pHead = pred->pHistoryBuffer;
            intRedexData_headPos = 4;
        }
        else if (nrOfBytesToMake > intLengthToEndOfHistoryBuffer)
        {
            /* this would wrap - sender is faulty - fatal error! */
            //TRACE((TC_WD, TT_ERROR, "V3Expander: WRAP ERROR distance = %d, nrOfBytesToMake = %d\n", intLengthToEndOfHistoryBuffer, nrOfBytesToMake));
            bytRedexData_ExpanderErrorCode = 98;
            //return false;
            //throw new V3ExpanderException("WRAP ERROR distance = "+intLengthToEndOfHistoryBuffer+
            //                              ", nrOfBytesToMake = "+nrOfBytesToMake+"\n");
            throw V3ExpanderError.WRAP_ERROR_SENDERFAULTY;
        }

        //pHeadStart = pred->pHead;
        intHeadStart = intRedexData_headPos;

        if (!RestartExpander(/*pred,*/ pInput, inputPos, nrOfBytesToMake, pHighestPhysicalUshort))
        {
            //return false;
            //throw new V3ExpanderException("Could not restart expander");
            throw V3ExpanderError.CANT_RESTART_EXPANDER;
        }

        //TRACE((TC_WD, TT_API3,"V3Expander: ENTER string length = %d\n", pred->StringLength));

        if (channel == V3_SPECIAL_THINWIRE_CHANNEL)
        {
            ExpandThinwireData(/*pred*/);
        }
        else
        {
            ExpandBytes(/*pred,*/ decoderNr, nrOfBytesToMake);
        }

        /* set the InString variable in case we need to run the reducer using the expander data */
//         if (intRedexData_StringLength == -1)
//         {
//             bRedexData_InString = false;
//         }
//         else
//         {
//             bRedexData_InString = true;
//         }
        bRedexData_InString = (intRedexData_StringLength != -1);

        /* work out how many compressed bytes we actually used to make the output */
        //*pNrOfBytesConsumed = (pred->pCompressedData - pInput) - ((unsigned)(pred->NrOfCompressedBits) >> 3);
        expandedData.nrOfBytesConsumed = (intRedexData_compressedIndex - inputPos)
            -  ((bytRedexData_NrOfCompressedBits & 0xff) >>> 3);

        /* indicate the new data */
        //*ppOutput = pHeadStart;
        expandedData.start = intHeadStart;
        //*pOutputLength = pred->pHead - pHeadStart;
        expandedData.exDataLength = intRedexData_headPos - intHeadStart;
        expandedData.data   = arrRedexData_historyBuffer;

        if (bytRedexData_ExpanderErrorCode != 0)
        {
            //TRACE((TC_WD, TT_ERROR,"V3Expander: EXPANDER ERROR %d\n", pred->ExpanderErrorCode));
            //return false;
            //throw new V3ExpanderException("EXPANDER ERROR "+bytRedexData_ExpanderErrorCode);
            throw V3ExpanderError.EXPANDER_ERROR;
        }

        if (bytRedexData_ThinwireParserErrorCode != 0)
        {
            //TRACE((TC_WD, TT_ERROR,"V3Expander: THINWIRE PARSER ERROR %d\n", pred->ThinwireParserErrorCode));
            //return false;
            //throw new V3ExpanderException("THINWIRE PARSER ERROR "+
            //                              redexData_ThinwireParserErrorCode);
            throw V3ExpanderError.EXPANDER_ERROR;
        }

        if (intRedexData_NrOfExpanderBytesRemaining != 0)
        {
            //TRACE((TC_WD, TT_ERROR,"V3Expander: TERMINATION ERROR\n"));
            //return false;
            //throw new V3ExpanderException("TERMINATION ERROR");
            throw V3ExpanderError.TERMINATION_ERROR;
        }

        //if ((*pOutputLength) > pred->MaxVirtualWriteLength)
        if (expandedData.exDataLength > intRedexData_MaxVirtualWriteLength)
        {
            //TRACE((TC_WD, TT_ERROR,"V3Expander: Generated too much data (%d bytes)\n", *pOutputLength));
            bytRedexData_ExpanderErrorCode = 99;
            //return false;
            //throw new V3ExpanderException("Generated too much data ("+
            //                              expandedData.length+" bytes)");
            throw V3ExpanderError.TOO_MUCH_DATA;
        }

        //return true;
   };


	var ExpandBytes = function(state, nrOfBytes)
    {
        var intNewHashInfo = 0, intNewBits = 0;
        var intStringLength;
        var newByte;
        var intHashIndex = 0;
        var pCoder;

        intRedexData_NrOfExpanderBytesRemaining -= nrOfBytes;

        var bSkipHashing = false;

        if (intRedexData_StringLength > 0)
        {
            // JEAC: investigate changing this to a for() loop (we know
            // intRedexData_StringLength, and nrOfBytes, so we can easily terminate).
            // This would reduce the number of tests from one-per-loop to
            // one-per-call.
            // JEAC: note that this doesn't actually loop often; on the order of
            // twice per call.
            var intBytesToCopy = intRedexData_StringLength < nrOfBytes?intRedexData_StringLength:nrOfBytes;

            intRedexData_StringLength -= intBytesToCopy;
            nrOfBytes              -= intBytesToCopy;

            while (intBytesToCopy--) {
                arrRedexData_historyBuffer[intRedexData_headPos++] =
                    arrRedexData_historyBuffer[intRedexData_matchPos++];
            }

            if (!nrOfBytes) {
                // Got everything we were after
                return;
            }

            intRedexData_StringLength = -1;
            intHashIndex = -1;
            pCoder = arrRedexData_coders[state];
            bSkipHashing = true;

        }
        else if (intRedexData_StringLength == 0)
        {
            /* we had just finished a string the previous time - skip the hashing */
            intRedexData_StringLength = -1;
            intHashIndex = -1;
            pCoder = arrRedexData_coders[state];
            bSkipHashing = true;
        } else {
            pCoder = arrRedexData_coders[state];
        }

      next_byte:

        do {
            if (!bSkipHashing) {
                /* use hash table to look for a match with current context (the previous 3 bytes) */
                var intContextKey = ((arrRedexData_historyBuffer[intRedexData_headPos-1] & 0xff) << 24  |
                                  (arrRedexData_historyBuffer[intRedexData_headPos-2] & 0xff) << 16  |
                                  (arrRedexData_historyBuffer[intRedexData_headPos-3] & 0xff) << 8);

                var intHash = ((intContextKey >>> 8) ^ (intContextKey >>> intRedexData_HashShift)) & intRedexData_HashTableMask;
                intHashIndex = intHash;
                var intHashInfo = arrRedexData_hashTable[intHashIndex];
                var intContextIndex = intRedexData_headPos - 4;
                /* don't know new byte yet so update hash table later */
                intNewHashInfo = (intContextKey & intRedexData_CheckMask) | intContextIndex;

                /* do we have a matching context? */
                if (((intHashInfo ^ intNewHashInfo) & intRedexData_CheckMask) != 0)
                {
                    /* no */
                }
				else if ((intRedexData_CompressedBits & 1) != 0) /* we have a context match */
                {
                    /* but no string */
                    intRedexData_CompressedBits >>>= 1;
                    bytRedexData_NrOfCompressedBits--;

                    /* note that we can get the 1 bit above without a pipeline check there are */
                    /* at this point at least 15 bits in the pipeline, enough for unmatchedByte */
                }
				else
				{

                    /* we have a string match of at least 1 byte */
                    intRedexData_CompressedBits >>>= 1;
                    bytRedexData_NrOfCompressedBits--;

                    intRedexData_matchPos = 4 + (intHashInfo & intRedexData_HistoryBufferMask);
                    newByte = /*(UCHAR)*/(intHashInfo >>> 24) & 0xff;

                    /* update hash table now new byte is known */
                    arrRedexData_hashTable[intHashIndex] = intNewHashInfo | ((newByte & 0xff) << 24);

                    if (arrRedexData_historyBuffer[intRedexData_matchPos] != newByte)
                    {
                        /* but the special 1-byte only in hash table */
                        /* put new byte in history */
                        arrRedexData_historyBuffer[intRedexData_headPos++] = newByte;

                        if (bytRedexData_NrOfCompressedBits <= 16)
                        {
                            /* refill compressed bits silo */
                            if (intRedexData_compressedIndex <= intRedexData_highestPhysicalUshort)
                            {
                                intNewBits = (arrRedexData_compressedData[intRedexData_compressedIndex]&0xff)
                                    | ((arrRedexData_compressedData[intRedexData_compressedIndex+1]&0xff)
                                       <<  8);
                            }
                            intRedexData_CompressedBits |=
                                intNewBits << /*(ULONG)*/bytRedexData_NrOfCompressedBits;
                            intRedexData_compressedIndex += 2;
                            bytRedexData_NrOfCompressedBits += 16;
                        }

                        if (nrOfBytes != 1)
                        {
                            /* more to do */
                            continue;
                        }
                        return;
                    }

                    /* normal string - decode length */
                    var intBottomBits = intRedexData_CompressedBits & 0x7F;
                    if (intBottomBits == 0x00)
                    {
                        /* a long string */
                        var intStringShift = 0;
                        intStringLength = 0;
                        do
                        {
                            intRedexData_CompressedBits >>>= 7;
                            intStringLength |= ((intRedexData_CompressedBits & 0x7F) << intStringShift);
                            intRedexData_CompressedBits >>>= 7;
                            bytRedexData_NrOfCompressedBits -= 14;
                            intStringShift += 7;

                            if (intStringShift >= 21)
                            {
                                bytRedexData_ExpanderErrorCode = 1;
                                return;
                            }

                            if (bytRedexData_NrOfCompressedBits <= 16)
                            {
                                /* refill compressed bits silo */
                                if (intRedexData_compressedIndex <= intRedexData_highestPhysicalUshort)
                                {
                                    intNewBits = ( arrRedexData_compressedData[intRedexData_compressedIndex]
                                                & 0xff )
                                        |  (( arrRedexData_compressedData[intRedexData_compressedIndex+1]
                                              & 0xff )
                                            <<  8);
                                }
                                intRedexData_CompressedBits |=
                                    intNewBits << bytRedexData_NrOfCompressedBits;
                                intRedexData_compressedIndex += 2;
                                bytRedexData_NrOfCompressedBits += 16;
                            }

                            intBottomBits = intRedexData_CompressedBits & 0x7F;
                        } while (intBottomBits == 0x00);
                        
                        intRedexData_CompressedBits >>>= StringDecodingNrOfBits[intBottomBits];
                        bytRedexData_NrOfCompressedBits -=  StringDecodingNrOfBits[intBottomBits];
                        intStringLength |= ((StringDecodingBaseIndex[intBottomBits]
                                          | (intRedexData_CompressedBits & StringDecodingExtraBitsMask[intBottomBits]))
                                         << intStringShift);

                        intRedexData_CompressedBits >>>= StringDecodingNrOfExtraBits[intBottomBits];
                        bytRedexData_NrOfCompressedBits -=  StringDecodingNrOfExtraBits[intBottomBits];

                        if (bytRedexData_NrOfCompressedBits <= 16)
                        {
                            /* refill compressed bits silo */
                            if (intRedexData_compressedIndex <= intRedexData_highestPhysicalUshort)
                            {
                                intNewBits = (arrRedexData_compressedData[intRedexData_compressedIndex]&0xff)
                                    | ((arrRedexData_compressedData[intRedexData_compressedIndex+1]&0xff)
                                       <<  8);
                            }
                            intRedexData_CompressedBits |=
                                intNewBits << /*(ULONG)*/bytRedexData_NrOfCompressedBits;
                            intRedexData_compressedIndex += 2;
                            bytRedexData_NrOfCompressedBits += 16;
                        }

                        if (intStringLength > intRedexData_MaxVirtualWriteLength)
                        {
                            bytRedexData_ExpanderErrorCode = 2;
                            return;
                        }
                    }
                    else
                    {
                        /* a short/medium length string */
                        intRedexData_CompressedBits >>>= StringDecodingNrOfBits[intBottomBits];
                        bytRedexData_NrOfCompressedBits -=  StringDecodingNrOfBits[intBottomBits];
                        intStringLength = StringDecodingBaseIndex[intBottomBits]
                            | (intRedexData_CompressedBits & StringDecodingExtraBitsMask[intBottomBits]);

                        intRedexData_CompressedBits >>>= StringDecodingNrOfExtraBits[intBottomBits];
                        bytRedexData_NrOfCompressedBits -=  StringDecodingNrOfExtraBits[intBottomBits];

                        if (bytRedexData_NrOfCompressedBits <= 16)
                        {
                            /* refill compressed bits silo */
                            if (intRedexData_compressedIndex <= intRedexData_highestPhysicalUshort)
                            {
                                intNewBits = (arrRedexData_compressedData[intRedexData_compressedIndex]&0xff)
                                    | ((arrRedexData_compressedData[intRedexData_compressedIndex+1]&0xff)
                                       <<  8);
                            }
                            intRedexData_CompressedBits |=
                                intNewBits << /*(ULONG)*/bytRedexData_NrOfCompressedBits;
                            intRedexData_compressedIndex += 2;
                            bytRedexData_NrOfCompressedBits += 16;
                        }
                    }

                    /* now copy the string */
                    var intBytesToCopy = intStringLength<nrOfBytes?intStringLength:nrOfBytes;

                    intStringLength -= intBytesToCopy;
                    nrOfBytes    -= intBytesToCopy;

                    while (intBytesToCopy-- > 0) {
                        arrRedexData_historyBuffer[intRedexData_headPos++] =
                            arrRedexData_historyBuffer[intRedexData_matchPos++];
                    }

                    if (nrOfBytes == 0) {
                        // Got everything we were after but still have data left,
                        // remember it til later.
                        intRedexData_StringLength = intStringLength;
                        return;
                    }

                    intHashIndex = -1;
                    /* fall through to unmatched byte */
                }
            } // bSkipHashing
      unmatched_byte:

            bSkipHashing = false;
            var bytDecoding = pCoder.arrDecoding[intRedexData_CompressedBits & 0xFF];
            var intBand = bytDecoding & 0xF;
            var intNrOfBits = (bytDecoding & 0xff) >> 4;

            intRedexData_CompressedBits >>>= intNrOfBits;
            bytRedexData_NrOfCompressedBits -= intNrOfBits;
            var intNrOfExtraBits = NrOfExtraBits[intBand];
            var index = /*(UCHAR)*/(StartOfBand[intBand] | (intRedexData_CompressedBits & ((1 << intNrOfExtraBits) - 1)))
                & 0xff;
            intRedexData_CompressedBits >>>= intNrOfExtraBits;
            bytRedexData_NrOfCompressedBits -= intNrOfExtraBits;

            /* lookup new byte */
            newByte = pCoder.arrValueOfIndex[index];
            
            /* update hash table now new byte is known */
            if (intHashIndex >= 0)
                arrRedexData_hashTable[intHashIndex] = intNewHashInfo | ((newByte & 0xff) << 24);

            if (bytRedexData_NrOfCompressedBits <= 16)
            {
                /* refill compressed bits silo */
                if (intRedexData_compressedIndex <= intRedexData_highestPhysicalUshort)
                {
                    intNewBits = (arrRedexData_compressedData[intRedexData_compressedIndex] & 0xff)  |
                        ((arrRedexData_compressedData[intRedexData_compressedIndex + 1] & 0xff) << 8);

                }
                intRedexData_CompressedBits |= intNewBits << /*(ULONG)*/bytRedexData_NrOfCompressedBits;
                intRedexData_compressedIndex += 2;
                bytRedexData_NrOfCompressedBits += 16;

                if (pCoder.intRecalcCountdown-- == 0)
                {
                    /* recalculate the huffman codings */
                    MakeHuffmanCodes(/*pred,*/ pCoder);
                }
            }

            /* update statistics */
            pCoder.arrBandCount[intBand]++;

            /* pick victim in lower band to swap places with */
            var intVictimIndex = pCoder.arrNextVictim[intBand] & 0xff;
            pCoder.arrNextVictim[intBand] = NextVictim[intVictimIndex];

            /* swap places with victim */
            var intVictimValue = pCoder.arrValueOfIndex[intVictimIndex] & 0xff;
            pCoder.arrIndexOfValue[intVictimValue] = index & 0xff;
            pCoder.arrIndexOfValue[newByte & 0xff] = intVictimIndex & 0xff;
            pCoder.arrValueOfIndex[intVictimIndex] = newByte;
            pCoder.arrValueOfIndex[index] = intVictimValue & 0xff;

            //*(pred->pHead++) = newByte;
            arrRedexData_historyBuffer[intRedexData_headPos++] = newByte;
        } while (nrOfBytes-- != 1);

        /* that was the last byte */
    };


    var ExpandByte = function (//PREDUCER_EXPANDER_DATA pred,
        /*UCHAR*/                  state)
    {
        //int/*ULONG*/ /*contextKey,*/ /*hash,*/ /*contextIndex,*/ dummyUlong;
        var /*ULONG*/ /*hashInfo,*/ intNewHashInfo = 0, intNewBits = 0;
        var/*ULONG*/ /*bottomBits,*/ /*stringShift,*/ intStringLength;
        //byte/*UCHAR*/ /*band,*/ /*nrOfBits,*/ /*index,*/ /*nrOfExtraBits,*/ /*victimIndex,*/ /*victimValue*/;
        //int /*band,*/ /*nrOfBits,*/ /*nrOfExtraBits,*/ /*index,*/ /*victimIndex,*/ victimValue;
        var/*UCHAR*/ newByte/*, decoding*/;
        //int decoding;
        //PULONG pHashEntry;
        var intHashIndex;
        var/*PCODER*/ pCoder;
        //STRING_DECODING stringDecoding;

        intRedexData_NrOfExpanderBytesRemaining--;

        //TRACE((TC_WD, TT_API3,"Expand 1 byte of state %d\n", state));
        if (intRedexData_StringLength > 0)
        {
            intRedexData_StringLength--;

            /* pick up next byte in string */
            //newByte = *(pred->pMatch++);
            newByte = arrRedexData_historyBuffer[intRedexData_matchPos++];

            /* put new byte in history */
            //*(pred->pHead++) = newByte;
            arrRedexData_historyBuffer[intRedexData_headPos++] = newByte;

            return (newByte);
        }
        else if (intRedexData_StringLength == 0)
        {
            /* we had just finished a string the previous time - skip the hashing */
            intRedexData_StringLength = -1;
            //pHashEntry = &dummyUlong; /* so real hash table update will not occur */
            intHashIndex = -1;
            //goto unmatched_byte;
        } else {

            /* next_byte */

            /* use hash table to look for a match with current context (the previous 3 bytes) */
// #if (LITTLE_ENDIAN_MACHINE) && (!NEED_ALIGNMENT)
//         /* load 4 bytes but don't use low order byte (the fourth last byte) */
//         LOAD_LITTLE_ENDIAN_ULONG_UNALIGNED(contextKey, (pred->pHead - 4));  /* low order byte (*(pHead - 4)) will not be used */
// #else
            /* load just 3 bytes to be used */
            //PUCHAR pHead = pred->pHead;
            //contextKey = (*(pHead - 1) << 24) | (*(pHead - 2) << 16) | (*(pHead - 3) << 8);
            var intContextKey = (((arrRedexData_historyBuffer[intRedexData_headPos-1] & 0xff)  <<  24) |
                              ((arrRedexData_historyBuffer[intRedexData_headPos-2] & 0xff)  <<  16) |
                              ((arrRedexData_historyBuffer[intRedexData_headPos-3] & 0xff)  <<  8));
// #endif
            var intHash = ((intContextKey >>> 8) ^ (intContextKey >>> intRedexData_HashShift))
                & intRedexData_HashTableMask;
            //pHashEntry = pred->pHashTable + hash;
            intHashIndex = intHash;
            //hashInfo = *pHashEntry;
            var intHashInfo = arrRedexData_hashTable[intHashIndex];
            //contextIndex = pred->pHead - pred->pHistoryBuffer;
            var intContextIndex = intRedexData_headPos - 4;
            /* don't know new byte yet so update hash table later */
            intNewHashInfo = (intContextKey & intRedexData_CheckMask) | intContextIndex;

// #if EXTREME_TRACING
//         TRACE((TC_WD, TT_API3,"V3TRACE: Hash at %d, [%d] = %d\n", pred->pHead - pred->pHistoryBuffer, hash, hashInfo));
// #endif


            /* do we have a matching context? */
            if (((intHashInfo ^ intNewHashInfo) & intRedexData_CheckMask) != 0)
            {
                /* no */
                //goto unmatched_byte;
            } else

            /* we have a context match */
            if ((intRedexData_CompressedBits & 1)  !=  0)
            {
                /* but no string */
                intRedexData_CompressedBits >>>= 1;
                bytRedexData_NrOfCompressedBits--;

                /* note that we can get the 1 bit above without a pipeline check there are */
                /* at this point at least 15 bits in the pipeline, enough for unmatchedByte */
                //goto unmatched_byte;
            } else {

                /* we have a string match of at least 1 byte */
                intRedexData_CompressedBits >>>= 1;
                bytRedexData_NrOfCompressedBits--;

                // TODO see if this will ever be negative - I doubt we'll have a
                // multi-gigabyte-sized history buffer!
                //pred->pMatch = pred->pHistoryBuffer + (intHashInfo & pred->HistoryBufferMask);
                intRedexData_matchPos = 4 + (intHashInfo & intRedexData_HistoryBufferMask);
                newByte = /*(UCHAR)*/(intHashInfo >>> 24) & 0xff;

                /* update hash table now new byte is known */
                //*pHashEntry = newHashInfo | (newByte << 24);
                arrRedexData_hashTable[intHashIndex] = intNewHashInfo | ((newByte & 0xff) << 24);

                //if (*(pred->pMatch) != newByte)
                if (arrRedexData_historyBuffer[intRedexData_matchPos] != newByte)
                {
                    //TRACE((TC_WD, TT_API3,"ExpandBytes: Single at %d\n", pred->pHead - pred->pHistoryBuffer));
// #if EXTREME_TRACING
//             TRACE((TC_WD, TT_API3,"V3TRACE: Single at %d\n", pred->pHead - pred->pHistoryBuffer));
// #endif


                    /* but the special 1-byte only in hash table */
                    /* put new byte in history */
                    //*(pred->pHead++) = newByte;
                    arrRedexData_historyBuffer[intRedexData_headPos++] = newByte;

                    if (bytRedexData_NrOfCompressedBits <= 16)
                    {
                        /* refill compressed bits silo */
                        if (intRedexData_compressedIndex <= intRedexData_highestPhysicalUshort)
                        {
                            //LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(newBits, arrRedexData_compressedData, redexData_compressedIndex);
                            //newBits = LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(redexData_compressedData,
                            //                                              redexData_compressedIndex);
                            intNewBits = (arrRedexData_compressedData[intRedexData_compressedIndex] & 0xff)
                                | ((arrRedexData_compressedData[intRedexData_compressedIndex+1] & 0xff)
                                   <<  8);

                        }
                        intRedexData_CompressedBits |=
                            intNewBits << /*(ULONG)*/bytRedexData_NrOfCompressedBits;
                        intRedexData_compressedIndex += 2;
                        bytRedexData_NrOfCompressedBits += 16;
                    }

                    return (newByte);
                }

                /* normal string - decode length */
                var intBottomBits = intRedexData_CompressedBits & 0x7F;
                if (intBottomBits == 0x00)
                {
                    /* a long string */
                    var intStringShift = 0;
                    intStringLength = 0;
                    do
                    {
                        intRedexData_CompressedBits >>>= 7;
                        intStringLength |= ((intRedexData_CompressedBits & 0x7F) << intStringShift);
                        intRedexData_CompressedBits >>>= 7;
                        bytRedexData_NrOfCompressedBits -= 14;
                        intStringShift += 7;

                        if (intStringShift >= 21)
                        {
                            //TRACE((TC_WD, TT_ERROR,"ExpandByte: Infeasibly large string length = %d\n", stringLength));

                            bytRedexData_ExpanderErrorCode = 1;
                            return 0;
                        }

                        if (bytRedexData_NrOfCompressedBits <= 16)
                        {
                            /* refill compressed bits silo */
                            //if (pred->pCompressedData <= pred->pHighestPhysicalUshort)
                            if (intRedexData_compressedIndex <= intRedexData_highestPhysicalUshort)
                            {
                                //LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(newBits, redexData_compressedData, redexData_compressedIndex);
                                //newBits = LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(redexData_compressedData,
                                //                                              redexData_compressedIndex);
                                intNewBits = (arrRedexData_compressedData[intRedexData_compressedIndex]&0xff)
                                    | ((arrRedexData_compressedData[intRedexData_compressedIndex+1]&0xff)
                                       <<  8);


                            }
                            intRedexData_CompressedBits |=
                                intNewBits << /*(ULONG)*/bytRedexData_NrOfCompressedBits;
                            intRedexData_compressedIndex += 2;
                            bytRedexData_NrOfCompressedBits += 16;
                        }

                        intBottomBits = intRedexData_CompressedBits & 0x7F;
                    } while (intBottomBits == 0x00);

//                     stringDecoding = StringDecoding[bottomBits];
//                     redexData_CompressedBits >>>= stringDecoding.NrOfBits & 0xff;
//                     redexData_NrOfCompressedBits -=  stringDecoding.NrOfBits & 0xff;
//                     stringLength |= (((stringDecoding.BaseIndex & 0xff)
//                                       | (redexData_CompressedBits & stringDecoding.ExtraBitsMask))
//                                      << stringShift);

//                     redexData_CompressedBits >>>= stringDecoding.NrOfExtraBits;
//                     redexData_NrOfCompressedBits -=  stringDecoding.NrOfExtraBits;
                    intRedexData_CompressedBits >>>= StringDecodingNrOfBits[intBottomBits];
                    bytRedexData_NrOfCompressedBits -=  StringDecodingNrOfBits[intBottomBits];
                    intStringLength |= (StringDecodingBaseIndex[intBottomBits]
                                      | (intRedexData_CompressedBits & StringDecodingExtraBitsMask[intBottomBits]))
                                     << intStringShift;

                    intRedexData_CompressedBits >>>= StringDecodingNrOfExtraBits[intBottomBits];
                    bytRedexData_NrOfCompressedBits -=  StringDecodingNrOfExtraBits[intBottomBits];

                    if (bytRedexData_NrOfCompressedBits <= 16)
                    {
                        /* refill compressed bits silo */
                        //if (pred->pCompressedData <= pred->pHighestPhysicalUshort)
                        if (intRedexData_compressedIndex <= intRedexData_highestPhysicalUshort)
                        {
                            //LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(newBits, redexData_compressedData, redexData_compressedIndex);
                            //newBits = LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(redexData_compressedData,
                            //                                              redexData_compressedIndex);
                            intNewBits = (arrRedexData_compressedData[intRedexData_compressedIndex] & 0xff)
                                | ((arrRedexData_compressedData[intRedexData_compressedIndex+1] & 0xff)
                                   <<  8);

                        }
                        intRedexData_CompressedBits |=
                            intNewBits << /*(ULONG)*/bytRedexData_NrOfCompressedBits;
                        intRedexData_compressedIndex += 2;
                        bytRedexData_NrOfCompressedBits += 16;
                    }

                    if (intStringLength > intRedexData_MaxVirtualWriteLength)
                    {
                        //                 TRACE((TC_WD, TT_ERROR,"ExpandByte: string (%d) longer than max virtual write (%d)\n",
                        //                        stringLength, pred->MaxVirtualWriteLength));


                        bytRedexData_ExpanderErrorCode = 2;
                        return 0;
                    }

                }
                else
                {
                    /* a short/medium length string */
//                     stringDecoding = StringDecoding[bottomBits];
//                     redexData_CompressedBits >>>= stringDecoding.NrOfBits & 0xff;
//                     redexData_NrOfCompressedBits -=  stringDecoding.NrOfBits & 0xff;
//                     stringLength = (stringDecoding.BaseIndex & 0xff)
//                         | (redexData_CompressedBits & stringDecoding.ExtraBitsMask);

//                     redexData_CompressedBits >>>= stringDecoding.NrOfExtraBits;
//                     redexData_NrOfCompressedBits -=  stringDecoding.NrOfExtraBits;
                    intRedexData_CompressedBits >>>= StringDecodingNrOfBits[intBottomBits];
                    bytRedexData_NrOfCompressedBits -=  StringDecodingNrOfBits[intBottomBits];
                    intStringLength = StringDecodingBaseIndex[intBottomBits]
                        | (intRedexData_CompressedBits & StringDecodingExtraBitsMask[intBottomBits]);

                    intRedexData_CompressedBits >>>= StringDecodingNrOfExtraBits[intBottomBits];
                    bytRedexData_NrOfCompressedBits -=  StringDecodingNrOfExtraBits[intBottomBits];

                    if (bytRedexData_NrOfCompressedBits <= 16)
                    {
                        /* refill compressed bits silo */
                        //if (pred->pCompressedData <= pred->pHighestPhysicalUshort)
                        if (intRedexData_compressedIndex <= intRedexData_highestPhysicalUshort)
                        {
                            //LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(newBits, redexData_compressedData, redexData_compressedIndex);
                            //newBits = LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(redexData_compressedData,
                            //                                              redexData_compressedIndex);
                            intNewBits = (arrRedexData_compressedData[intRedexData_compressedIndex] & 0xff)
                                | ((arrRedexData_compressedData[intRedexData_compressedIndex+1] & 0xff)
                                   <<  8);

                        }
                        intRedexData_CompressedBits |=
                            intNewBits << /*(ULONG)*/bytRedexData_NrOfCompressedBits;
                        intRedexData_compressedIndex += 2;
                        bytRedexData_NrOfCompressedBits += 16;
                    }
                }

// #if EXTREME_TRACING
//         TRACE((TC_WD, TT_API3,"V3TRACE: String of length %d at %d\n", stringLength, pred->pHead - pred->pHistoryBuffer));
// #endif


                /* now copy one byte of the string */
                intStringLength--;

                /* pick up next byte in string */
                //newByte = *(pred->pMatch++);
                newByte = arrRedexData_historyBuffer[intRedexData_matchPos++];

                /* put new byte in history */
                //*(pred->pHead++) = newByte;
                arrRedexData_historyBuffer[intRedexData_headPos++] = newByte;

                intRedexData_StringLength = intStringLength;
                return newByte;
            }
        }

      unmatched_byte:

        //pCoder = pred->pCoders + state;
        pCoder = arrRedexData_coders[state];
        //byte decoding = pCoder.Decoding[redexData_CompressedBits & 0xFF].BandAndNrOfBits;
        var bytDecoding = pCoder.arrDecoding[intRedexData_CompressedBits & 0xFF];
        var intBand = bytDecoding & 0xF;
        var intNrOfBits = (bytDecoding & 0xff) >> 4; // UCHAR

        intRedexData_CompressedBits >>>= intNrOfBits;
        bytRedexData_NrOfCompressedBits -= intNrOfBits;

        // TODO see if the bitwise ANDs (masks) are necessary.
        var intNrOfExtraBits = NrOfExtraBits[intBand] & 0xff;
        var index = /*(UCHAR)*/(StartOfBand[intBand] | (intRedexData_CompressedBits & ((1 << intNrOfExtraBits) - 1)))
            & 0xff;
        intRedexData_CompressedBits >>>= intNrOfExtraBits;
        bytRedexData_NrOfCompressedBits -= intNrOfExtraBits;

        /* lookup new byte */
        newByte = pCoder.arrValueOfIndex[index];
        //TRACE((TC_WD, TT_API3,"ExpandBytes: NewByte %d at %d, index = %d\n", newByte, pred->pHead - pred->pHistoryBuffer, index));

        /* update hash table now new byte is known */
        //*pHashEntry = newHashInfo | (newByte << 24);
        if (intHashIndex >= 0)
            arrRedexData_hashTable[intHashIndex] = intNewHashInfo | ((newByte & 0xff) << 24);

// #if EXTREME_TRACING
//         TRACE((TC_WD, TT_API3,"V3TRACE: Unmatched %x at %d, index = %d, recalc = %d\n", newByte, pred->pHead - pred->pHistoryBuffer, index, pCoder->RecalcCountdown));
// #endif


        if (bytRedexData_NrOfCompressedBits <= 16)
        {
            /* refill compressed bits silo */
            //if (pred->pCompressedData <= pred->pHighestPhysicalUshort)
            if (intRedexData_compressedIndex <= intRedexData_highestPhysicalUshort)
            {
                //LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(newBits, redexData_compressedData, redexData_compressedIndex);
                //newBits = LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED(redexData_compressedData,
                //                                              redexData_compressedIndex);
                intNewBits = (arrRedexData_compressedData[intRedexData_compressedIndex] & 0xff)
                    | ((arrRedexData_compressedData[intRedexData_compressedIndex + 1] & 0xff)  <<  8);

            }
            intRedexData_CompressedBits |= intNewBits << /*(ULONG)*/bytRedexData_NrOfCompressedBits;
            intRedexData_compressedIndex += 2;
            bytRedexData_NrOfCompressedBits += 16;

            if ((pCoder.intRecalcCountdown--) == 0)
            {
                /* recalculate the huffman codings */
                MakeHuffmanCodes(/*pred,*/ pCoder);
            }
        }

        /* update statistics */
        pCoder.arrBandCount[intBand]++;

        /* pick victim in lower band to swap places with */
        var intVictimIndex = pCoder.arrNextVictim[intBand] & 0xff;
        pCoder.arrNextVictim[intBand] = NextVictim[intVictimIndex];

        /* swap places with victim */
        var intVictimValue = pCoder.arrValueOfIndex[intVictimIndex] & 0xff;
        pCoder.arrIndexOfValue[intVictimValue] = index & 0xff;
        pCoder.arrIndexOfValue[newByte & 0xff] = intVictimIndex & 0xff;
        pCoder.arrValueOfIndex[intVictimIndex] = newByte;
        pCoder.arrValueOfIndex[index] = intVictimValue & 0xff;

        //*(pred->pHead++) = newByte;
        arrRedexData_historyBuffer[intRedexData_headPos++] = newByte;

        return newByte;
    };




    // Returns a 16-bit value in an int.
    var LOAD_LITTLE_ENDIAN_USHORT_UNALIGNED = function(buffer, index)
    {
        //v = *(p) | (*((p) + 1) << 8);
        return (buffer[index] & 0xff)  |  ((buffer[index + 1] & 0xff)  <<  8);
    };

    var STORE_LITTLE_ENDIAN_USHORT_UNALIGNED = function(value, buffer, index)
    {
        buffer[index] = value & 0xff;
        buffer[index+1] = (value >>> 8) & 0xff;
    };


    // REDUCTION


    /* -------- */
    /* REDUCING */
    /* -------- */


    this.ReducerV3 = function(//PUCHAR   predIn,                /* reducer data structure */
        /*UCHAR*/    channel,                   /* channel */
        /*UCHAR*/    encoderNr,             /* encoder nr */
        /*PUCHAR*/   pInput,                /* input to compress */
        inputPos,
        /*ULONG*/    inputLength,           /* length of input */
        /*PUCHAR*/   pOutput,               /* where to compress the data to - null means don't want the output */
        outputPos,
        /*ULONG*/    maxOutputLength,       /* do not generate more than this */
//                    ULONG   *pNrOfBytesConsumed,    /* return nr of bytes consumed */
//                    ULONG   *pNrOfBytesGenerated)   /* return nr of bytes generated */
        reducedData) // nr bytes consumed, generated
    {
        var/*ULONG*/ /*contextKey,*/ /*hash = 0,*/ /*contextIndex,*/ intNrOfPendingStringBits = -1;
        //int/*INT32*/ nrOfBytesToProcess/*, spaceRemaining*//*, nrOfBytesRemaining*/;
        //int/*ULONG*/ HashShift/*, lengthToEndOfHistoryBuffer*/;
        var/*UCHAR*/ newByte = 0/*, index,*/ /*band,*/ /*victimIndex,*/ /*victimValue*/;
        //int /*index,*/ band;
        //byte/*UCHAR*/ nrOfCompressedBits;
        var /*ULONG*/ /*HashTableMask,*/ /*CheckMask,*/ stringLength/*, compressedBits*/;
        var/*ULONG*/ /*hashInfo = 0,*/ /*newHashInfo,*/ /*HistoryBufferMask,*/ intOutputIncrement;
        var intMatchPos = -1, intStartMatchPos = -1/*, historyPos,*/ /*historyEndPos*/;




        /* enforce wrap avoidance policy */
        //lengthToEndOfHistoryBuffer = pred->pHistoryBufferEnd - pred->pHead;
        var intLengthToEndOfHistoryBuffer = (intRedexData_HistoryBufferLength + 4) - intRedexData_headPos;
        if (/*(signed)*/intLengthToEndOfHistoryBuffer <= FORCE_WRAP_DISTANCE)
        {
            /* force a wrap if too close */
            //pred->pHead = pred->pHistoryBuffer;
            intRedexData_headPos = 4;
        }
        else if (inputLength > intLengthToEndOfHistoryBuffer)
        {
            /* or truncate long job if it would wrap */
            inputLength = intLengthToEndOfHistoryBuffer;
        }

        /* setup pointers to input */
        //pRawData = pInput;
        var arrRawData = pInput;
        var intRawDataPos = inputPos;
        //pRawDataOverallEnd = pInput + inputLength;
        var intRawDataOverallEndPos = intRawDataPos + inputLength;

        /* setup pointers to output */
        if (pOutput == null)
        {
            /* caller does not want the output */
            pOutput = arrRedexData_DummyOutputBuffer;
            outputPos = 0;
            maxOutputLength = 0x7FFFFFF;
            intOutputIncrement = 0;
        }
        else
        {
            intOutputIncrement = 2; /* 2 bytes at a time */
        }
        var arrpCompressedData = pOutput;
        var intCompressedPos = outputPos;
        //pCompressedDataMax = pOutput + maxOutputLength;
        var intCompressedDataMaxPos = outputPos + maxOutputLength;

        /* setup pointer to coder */
        //pCoder = pred->pCoders + encoderNr;
        var pCoder = arrRedexData_coders[encoderNr];

        /* setup reducer variables */
        //pHead = pred->pHead;
        var intHeadPos = intRedexData_headPos;
        //pHistoryBuffer = redexData_pHistoryBuffer;
        var intHistoryPos = 4;
        //pHistoryBufferEnd = redexData_pHistoryBufferEnd;
        var intHistoryEndPos = 4 + intRedexData_HistoryBufferLength;
        //pHashTable = redexData_pHashTable;
        var hashIndex = 0;
        var intHashShift = intRedexData_HashShift;
        var intHashTableMask = intRedexData_HashTableMask;
        var intHistoryBufferMask = intRedexData_HistoryBufferMask;
        var intCheckMask = intRedexData_CheckMask;
        var intCompressedBits = 0;
        var bytNrOfCompressedBits = 0;

        //*pNrOfBytesConsumed = 0;
        //*pNrOfBytesGenerated = 0;
        reducedData.nrOfBytesConsumed = 0;
        reducedData.nrOfBytesGenerated = 0;

        /* Before doing anything irreversible, we must check that we can consume at least some input */
        //spaceRemaining = pCompressedDataMax - pCompressedData - 1;
        var intSpaceRemaining = intCompressedDataMaxPos - intCompressedPos - 1;
        if (intSpaceRemaining < 6)
        {
            return;
        }

        //nrOfBytesRemaining = pRawDataOverallEnd - pRawData;
        var intNrOfBytesRemaining = intRawDataOverallEndPos - intRawDataPos;
        var intNrOfBytesToProcess = intNrOfBytesRemaining;
        if (intNrOfBytesToProcess > (intSpaceRemaining >>> 1))
        {
            /* can't guarantee to fit this in assuming very worst case of each input byte = 2 output bytes */
            intNrOfBytesToProcess = intSpaceRemaining >>> 1;
        }

        //pRawDataSectionEnd = pRawData + nrOfBytesToProcess;
        var intRawDataSectionEndPos = intRawDataPos + intNrOfBytesToProcess;

        var intState = INITIAL;

        /* can we continue a string from the previous virtual write */
        var bInString = false;

      outside:
        while (true) {
            switch (intState) {
            case INITIAL:
                if (bRedexData_InString)
                {
                    //pMatch = pred->pMatch;
                    intMatchPos = intRedexData_matchPos;
                    bytNrOfCompressedBits = 1; /* need to output a bit either way */
                    //newByte = *pRawData;
                    newByte = arrRawData[intRawDataPos];
                    //if ((newByte == *pMatch)  && (pMatch < pHistoryBufferEnd))
                    if ((newByte == arrRedexData_historyBuffer[intMatchPos]) &&
                        (intMatchPos < intHistoryEndPos))
                    {
                        /* yes */
                        //pStartMatch = pMatch;
                        intStartMatchPos = intMatchPos;
                        //goto next_string_byte;
                        intState = NEXT_STRING_BYTE;
                    }
                    else
                    {
                        /* no - indicate non-continuation of string */
                        intCompressedBits = 1;

                        /* the rule is that at the end of a string we do not update the hash table */
                        //goto unmatched_byte;
                        intState = UNMATCHED_BYTE;
                    }
                }
                else
                {
                    //goto next_byte;
                    intState = NEXT_BYTE;
                }
                break;
                // NO FALLTHROUGH

            case NEXT_SECTION:
              next_section:

                /* decide how many bytes to process */
                //intNrOfBytesRemaining = pRawDataOverallEnd - pRawData;
                intNrOfBytesRemaining = intRawDataOverallEndPos - intRawDataPos;
                intNrOfBytesToProcess = intNrOfBytesRemaining;
                if (intNrOfBytesToProcess > (intSpaceRemaining >>> 1))
                {
                    /* can't guarantee to fit this in assuming very worst case of each input byte = 2 output bytes */
                    intNrOfBytesToProcess = intSpaceRemaining >>> 1;
                }

                //pRawDataSectionEnd = pRawData + nrOfBytesToProcess;
                intRawDataSectionEndPos = intRawDataPos + intNrOfBytesToProcess;

                if (bInString)
                {
                    bInString = false;

                    //newByte = *pRawData;
                    newByte = arrRawData[intRawDataPos];

                    //if ((*pMatch == newByte) && (pMatch < pHistoryBufferEnd))
                        //goto next_string_byte;
                        //else
                        //goto end_of_string;

                    if (arrRedexData_historyBuffer[intMatchPos] == newByte  &&
                        intMatchPos < intHistoryEndPos)
                    {
                        intState = NEXT_STRING_BYTE;
                    } else {
                        intState = END_OF_STRING;
                        break;
                    }
                } else {
                    intState = NEXT_BYTE;
                    break;
                }

                // Fallthrough when intState is NEXT_STRING_BYTE

            case NEXT_STRING_BYTE:
              //next_string_byte:
                var arrHistBuf = arrRedexData_historyBuffer;
                var arrInData  = arrRawData;

                while(intState == NEXT_STRING_BYTE) {
                    //pRawData++;
                    intRawDataPos++;
                    //pMatch++;
                    intMatchPos++;
                    //*(pHead++) = newByte;
                    arrHistBuf[intHeadPos++] = newByte;

                    //if (pRawData == pRawDataSectionEnd)
                    if (intRawDataPos == intRawDataSectionEndPos)
                    {
                        //goto end_of_section_in_string;
                        intState = END_OF_SECTION_IN_STRING;
                    } else {

                        //newByte = *pRawData;
                        newByte = arrInData[intRawDataPos];

                        //if ((*pMatch == newByte) && (pMatch < pHistoryBufferEnd))

//                        if ((arrRedexData_historyBuffer[intMatchPos] == newByte)  &&
//                            (intMatchPos < historyEndPos))
//                        {
//                            //goto next_string_byte;
//                            // Don't change state
//
//                            //state = NEXT_STRING_BYTE;
//                        } else {
//                            state = END_OF_STRING;
//                        }

                        if ((intMatchPos >= intHistoryEndPos) ||
                            (arrHistBuf[intMatchPos] != newByte))
                        {
                            intState = END_OF_STRING;
                        }// else {
                            //goto next_string_byte;
                            // Don't change state
                            // state = NEXT_STRING_BYTE;
                        //}
                    }
                }

                if (intState != END_OF_STRING) {
                    break;
                }

                // Fallthrough to end_of_string

            case END_OF_STRING:
              end_of_string:

                /* end of string */
                //stringLength = pMatch - pStartMatch;
                stringLength = intMatchPos - intStartMatchPos;

// #if EXTREME_TRACING
//         TRACE((TC_WD, TT_API3,"V3TRACE: String of length %d at %d\n", stringLength, pHead - pHistoryBuffer - stringLength));
// #endif


                while (stringLength >= 128)
                {
                    /* set bit pattern (0x00) as 7 bits */
                    bytNrOfCompressedBits += 7;  /* all zeros so nothing to OR */

                    /* set bottom 7 bits of string length */
                    intCompressedBits = intCompressedBits | ((stringLength & 0x7F) << bytNrOfCompressedBits);
                    bytNrOfCompressedBits += 7;
                    stringLength >>>= 7;

                    if (bytNrOfCompressedBits >= 16)
                    {
                        /* flush compressed bits silo */
                        STORE_LITTLE_ENDIAN_USHORT_UNALIGNED(intCompressedBits & 0x0ffff,
                                                             arrpCompressedData, intCompressedPos);
                        //pCompressedData += intOutputIncrement;
                        intCompressedPos += intOutputIncrement;
                        intCompressedBits >>>= 16;
                        bytNrOfCompressedBits -= 16;
                    }
                }

                /* deal with non-zero string length < 128 */
//                 stringEncoding = StringEncoding[stringLength];
//                 intCompressedBits = compressedBits
//                     | ((stringEncoding.BitPattern & 0xffff) << nrOfCompressedBits);
//                 nrOfCompressedBits += stringEncoding.NrOfBits & 0xffff;
                intCompressedBits = intCompressedBits
                    | (StringEncodingBitPattern[stringLength] << bytNrOfCompressedBits);
                bytNrOfCompressedBits += StringEncodingNrOfBits[stringLength];

                if (bytNrOfCompressedBits >= 16)
                {
                    /* flush compressed bits silo */
                    STORE_LITTLE_ENDIAN_USHORT_UNALIGNED(intCompressedBits &0xffff,
                                                         arrpCompressedData, intCompressedPos);
                    //pCompressedData += intOutputIncrement;
                    intCompressedPos += intOutputIncrement;
                    intCompressedBits >>>= 16;
                    bytNrOfCompressedBits -= 16;
                }

                intState = UNMATCHED_BYTE;
                // Fallthrough to UNMATCHED_BYTE

            case NEXT_BYTE:
            case UNMATCHED_BYTE:
              next_byte:
              unmatched_byte:

                while (intState == NEXT_BYTE || intState == UNMATCHED_BYTE) {
                    if (intState == NEXT_BYTE) {
                        // case NEXT_BYTE:
                        //newByte = *pRawData;
                        newByte = arrRawData[intRawDataPos];

                        /* use hash table to look for a match with current context (the previous 3 bytes) */
                        // #if (LITTLE_ENDIAN_MACHINE) && (!NEED_ALIGNMENT)
                        //         /* load 4 bytes but don't use low order byte (the fourth last byte) */
                        //         LOAD_LITTLE_ENDIAN_ULONG_UNALIGNED(contextKey, (pHead - 4));  /* low order byte (*(pHead - 4)) will not be used */
                        // #else
                        /* load just 3 bytes to be used */
                        //contextKey = (*(pHead - 1) << 24) | (*(pHead - 2) << 16) | (*(pHead - 3) << 8);
                        var intContextKey = (((arrRedexData_historyBuffer[intHeadPos - 1] & 0xff)  <<  24)  |
                                          ((arrRedexData_historyBuffer[intHeadPos - 2] & 0xff)  <<  16)  |
                                          ((arrRedexData_historyBuffer[intHeadPos - 3] & 0xff)  <<   8));
                        // #endif

                        // #if EXTREME_TRACING
                        //         TRACE((TC_WD, TT_API3,"V3TRACE: Hash at %d, [%d] = %d\n", pHead - pHistoryBuffer, hash, hashInfo));
                        // #endif
                        //                 if (Debug.verbose)
                        //                     Debug.verbose(this, "V3TRACE: Hash at "+(intHeadPos-historyPos)+", ["+hash+"] = "
                        //                                   +hashInfo+"\n");

                        var intHash = ((intContextKey >>> 8) ^ (intContextKey >>> intHashShift)) & intHashTableMask;
                        //hashInfo = pHashTable[hash];
                        var intHashInfo = arrRedexData_hashTable[intHash];
                        //contextIndex = pHead - pHistoryBuffer;
                        var intContextIndex = intHeadPos - intHistoryPos;
                        var  intNewHashInfo =
                            (intContextKey & intCheckMask) | ((newByte & 0xff) << 24) | intContextIndex;
                        //pHashTable[hash] = newHashInfo;
                        arrRedexData_hashTable[intHash] = intNewHashInfo;



                        if (((intHashInfo ^ intNewHashInfo) & intCheckMask) != 0)
                        {
                            /* no */
                            //goto unmatched_byte;
                            intState = UNMATCHED_BYTE;
                        } else if ((intHashInfo >>> 24) != (newByte & 0xff)) /* we have a context match */
                        {
                            /* but no string */
                            /* set 1-bit pattern (0x1) (meaning no string) */
                            intCompressedBits = intCompressedBits | (0x1 << bytNrOfCompressedBits);
                            bytNrOfCompressedBits++;

                            /* note that we can put the 1 bit above without a flush check since unmatched byte */
                            /* can cope and will flush (worst case unmatched byte encoding is 15 bits) */
                            //goto unmatched_byte;
                            intState = UNMATCHED_BYTE;
                        } else {
                            /* we have a string match of at least 1 byte */
                            //pMatch = pHistoryBuffer + (hashInfo & HistoryBufferMask);
                            intMatchPos = intHistoryPos + (intHashInfo & intHistoryBufferMask);

                            /* set 1-bit pattern (0x0) (meaning a string) */
                            bytNrOfCompressedBits++; /* zero so nothing to OR */

                            //if (*pMatch != newByte)
                            if (arrRedexData_historyBuffer[intMatchPos] != newByte)
                            {
                                //TRACE((TC_WD, TT_API3,"V3Reducer: Single at %d\n", pHead - pHistoryBuffer));

                                // #if EXTREME_TRACING
                                //             TRACE((TC_WD, TT_API3,"V3TRACE: Single at %d\n", pHead - pHistoryBuffer));
                                // #endif


                                /* but the special 1-byte only */
                                //pRawData++;
                                intRawDataPos++;

                                /* put new byte in history */
                                //*(pHead++) = newByte;
                                arrRedexData_historyBuffer[intHeadPos++] = newByte;

                                /* set 1-bit pattern 0x0 */
                                /* the expander will know that this is a one-byte string since if will also */
                                /* do the above test of (*pMatch != newByte) */

                                if (bytNrOfCompressedBits >= 16)
                                {
                                    /* flush compressed bits silo */
                                    //STORE_LITTLE_ENDIAN_USHORT_UNALIGNED((short)compressedBits,
                                    //                                     pCompressedData, intCompressedPos);
                                    // inlined:
                                    arrpCompressedData[intCompressedPos] = intCompressedBits & 0xff;
                                    arrpCompressedData[intCompressedPos+1] = (intCompressedBits >>> 8) & 0xff;

                                    //pCompressedData += intOutputIncrement;
                                    intCompressedPos += intOutputIncrement;
                                    intCompressedBits >>>= 16;
                                    bytNrOfCompressedBits -= 16;
                                }

                                if (intRawDataSectionEndPos >= intRawDataPos) {
                                    intNrOfPendingStringBits = 0;
                                    //goto end_of_section;
                                    intState = END_OF_SECTION;
                                } else {
                                    //intState = NEXT_BYTE;
                                    continue;
                                }

                                /*
                                //if (pRawData < pRawDataSectionEnd)
                                if (intRawDataPos < rawDataSectionEndPos)
                                {
                                //goto next_byte;
                                state = NEXT_BYTE;
                                } else {
                                intNrOfPendingStringBits = 0;
                                //goto end_of_section;
                                state = END_OF_SECTION;
                                }
                                */
                            } else {
                                /* a normal string */
                                //pStartMatch = pMatch;
                                intStartMatchPos = intMatchPos;

                                intState = NEXT_STRING_BYTE;
                            }

                            break;
                        }
                        // end of case NEXT_BYTE:
                    }

                    // fall through, state will be UNMATCHED_BYTE
                    //case UNMATCHED_BYTE:

                    //TRACE((TC_WD, TT_API3,"Unmatched byte %x at %d\n", newByte, pHead - pHistoryBuffer));

                    /* put new byte in history */
                    //*(pHead++) = newByte;
                    arrRedexData_historyBuffer[intHeadPos++] = newByte;

                    /* lookup current index of the value and its encoding */
                    var index = pCoder.arrIndexOfValue[newByte & 0xff] & 0xff;
                    var intBand = IndexToBand[index] & 0xff;
                    //ENCODING encoding = pCoder.Encoding[band];
                    var arrEncoding = pCoder.arrEncoding[intBand];

                    // #if EXTREME_TRACING
                    //         TRACE((TC_WD, TT_API3,"V3TRACE: Unmatched %x at %d, index = %d, recalc = %d\n", newByte, pHead - pHistoryBuffer - 1, index, pCoder->RecalcCountdown));
                    // #endif


                    /* output the encoding */
                    //                 compressedBits = compressedBits
                    //                     | (((encoding.BitPattern) & 0xff) << nrOfCompressedBits);
                    //                 nrOfCompressedBits += (encoding.NrOfBits) & 0xff;
                    //                 compressedBits = compressedBits
                    //                     | ((index & (encoding.ExtraBitsMask & 0xff)) << nrOfCompressedBits);
                    //                 nrOfCompressedBits += (encoding.NrOfExtraBits) & 0xff;
                    intCompressedBits = intCompressedBits
                        | (((arrEncoding[INDEX_BIT_PATTERN]) & 0xff) << bytNrOfCompressedBits);
                    bytNrOfCompressedBits += (arrEncoding[INDEX_NR_OF_BITS]) & 0xff;
                    intCompressedBits = intCompressedBits
                        | ((index & (arrEncoding[INDEX_EXTRA_BITS_MASK] & 0xff)) << bytNrOfCompressedBits);
                    bytNrOfCompressedBits += (arrEncoding[INDEX_NR_OF_EXTRA_BITS]) & 0xff;

                    if (bytNrOfCompressedBits >= 16)
                    {
                        //TRACE((TC_WD, TT_API3,"V3Reducer: NewByte %x at %d, index = %d, DOSWAP = %d\n", newByte, pHead - pHistoryBuffer - 1, index, nrOfCompressedBits));

                        /* flush compressed bits silo */
                        STORE_LITTLE_ENDIAN_USHORT_UNALIGNED(intCompressedBits & 0xffff,
                                                             arrpCompressedData, intCompressedPos);
                        //pCompressedData += outputIncrement;
                        intCompressedPos += intOutputIncrement;
                        intCompressedBits >>>= 16;
                        bytNrOfCompressedBits -= 16;

                        //TRACE((TC_WD, TT_API3,"V3Reducer: Put %x in %d and %x in %d\n", newByte, victimIndex, victimValue, index));
                        if ((pCoder.intRecalcCountdown--) == 0)
                        {
                            /* recalculate the huffman codings */
                            MakeHuffmanCodes(/*pred,*/ pCoder);
                        }
                    }

                    /* update statistics */
                    pCoder.arrBandCount[intBand]++;

                    /* pick victim in lower band to swap places with */
                    var intVictimIndex = pCoder.arrNextVictim[intBand] & 0xff;
                    pCoder.arrNextVictim[intBand] = NextVictim[intVictimIndex];

                    /* swap places with victim */
                    var intVictimValue = pCoder.arrValueOfIndex[intVictimIndex] & 0xff;
                    pCoder.arrIndexOfValue[intVictimValue] = /*(UCHAR)*/index & 0xff;
                    pCoder.arrIndexOfValue[newByte & 0xff] = /*(UCHAR)*/intVictimIndex & 0xff;
                    pCoder.arrValueOfIndex[intVictimIndex] = /*(UCHAR)*/newByte;
                    pCoder.arrValueOfIndex[index]          = /*(UCHAR)*/intVictimValue & 0xff;

                    //pRawData++;
                    intRawDataPos++;

                    //if (pRawData < pRawDataSectionEnd)
                    if (intRawDataPos < intRawDataSectionEndPos)
                    {
                        //goto next_byte;
                        intState = NEXT_BYTE;
                        // VERY common, continue loop
                    } else {
                        intNrOfPendingStringBits = 0;
                        //goto end_of_section;
                        intState = END_OF_SECTION;
                        // will end loop
                    }
                }

                break;

                // NO FALLTHROUGH

            case END_OF_SECTION_IN_STRING:
              end_of_section_in_string:

                bInString = true;

                /* estimate how many bits max will be needed to output the pending string length */
                /* if we get a few more bytes added to string (which could cause a quantum jump effect) */
                /* i.e. be cautious */
                //stringLength = pMatch - pStartMatch + 10;
                stringLength = intMatchPos - intStartMatchPos + 10;
                if (stringLength < 128)
                {
                    //intNrOfPendingStringBits = StringEncoding[stringLength].NrOfBits & 0xffff;
                    intNrOfPendingStringBits = StringEncodingNrOfBits[stringLength];
                }
                else if (stringLength < (128 * 128))
                {
                    intNrOfPendingStringBits = 32; /* safe estimate for encoding long string length */
                }
                else
                {
                    intNrOfPendingStringBits = 48; /* safe estimate for encoding ridiculusly long string length */
                }

                // Fallthrough to end_of_section

            case END_OF_SECTION:
              end_of_section:

                //if (pRawData < pRawDataOverallEnd)
                if (intRawDataPos < intRawDataOverallEndPos)
                {
                    /* we have not got to the true end yet */
                    //spaceRemaining = pCompressedDataMax - pCompressedData - ((nrOfCompressedBits + intNrOfPendingStringBits + 7) >> 3);
                    intSpaceRemaining = intCompressedDataMaxPos - intCompressedPos -
                        ((bytNrOfCompressedBits + intNrOfPendingStringBits + 7) >>> 3);
                    if (intSpaceRemaining >= 6)
                    {
                        /* there is at least a little more space - so keep going a bit more */
                        //goto next_section;
                        intState = NEXT_SECTION;
                        break;
                    }
                }
                intState = FINISH;
                //break;
                //
                // Fallthrough to FINISH

            case FINISH:
                break outside;

            default:
                //throw new IllegalStateException("We've had an unknown state!!!:"+intState);
                throw V3CoderError.UNKNOWN_STATE;
            }
        } // End of state machine

        /* now we are really going to exit */
        //pred->pHead = pHead;
        intRedexData_headPos = intHeadPos;

        if (bInString)
        {
            /* output string length encoding */
            //stringLength = pMatch - pStartMatch;
            stringLength = intMatchPos - intStartMatchPos;

// #if EXTREME_TRACING
//             TRACE((TC_WD, TT_API3,"V3TRACE: String of length %d at %d\n", stringLength, pHead - pHistoryBuffer - stringLength));
// #endif


            while (stringLength >= 128)
            {
                /* set bit pattern (0x00) as 7 bits */
                bytNrOfCompressedBits += 7;  /* all zeros so nothing to OR */

                /* set bottom 7 bits of string length */
                intCompressedBits = intCompressedBits | ((stringLength & 0x7F) << bytNrOfCompressedBits);
                bytNrOfCompressedBits += 7;
                stringLength >>>= 7;

                if (bytNrOfCompressedBits >= 16)
                {
                    //Debug.trace(this, "CompressedBits = "+Debug.toHexString(compressedBits, 16));
                    /* flush compressed bits silo */
                    STORE_LITTLE_ENDIAN_USHORT_UNALIGNED(intCompressedBits & 0xffff,
                                                         arrpCompressedData, intCompressedPos);
                    //pCompressedData += outputIncrement;
                    intCompressedPos += intOutputIncrement;
                    intCompressedBits >>>= 16;
                    bytNrOfCompressedBits -= 16;
                }
            }

            /* deal with non-zero string length < 128 */
//             stringEncoding = StringEncoding[stringLength];
//             compressedBits = compressedBits
//                 | ((stringEncoding.BitPattern & 0xffff) << nrOfCompressedBits);
//             nrOfCompressedBits += stringEncoding.NrOfBits & 0xffff;
            intCompressedBits = intCompressedBits
                | (StringEncodingBitPattern[stringLength] << bytNrOfCompressedBits);
            bytNrOfCompressedBits += StringEncodingNrOfBits[stringLength];

            if (bytNrOfCompressedBits >= 16)
            {
                /* flush compressed bits silo */
                STORE_LITTLE_ENDIAN_USHORT_UNALIGNED(intCompressedBits & 0xffff,
                                                     arrpCompressedData, intCompressedPos);
                //pCompressedData += outputIncrement;
                intCompressedPos += intOutputIncrement;
                intCompressedBits >>>= 16;
                bytNrOfCompressedBits -= 16;
            }
        }

        /* flush out remaining bytes from pipeline */
        //while ((signed char)nrOfCompressedBits > 0)
        while (bytNrOfCompressedBits > 0)
        {
            //*pCompressedData = (UCHAR)compressedBits;
            arrpCompressedData[intCompressedPos] = intCompressedBits & 0xff;
            //pCompressedData += (outputIncrement >> 1);
            intCompressedPos += (intOutputIncrement >>> 1);
            intCompressedBits >>>= 8;
            bytNrOfCompressedBits -= 8;
        }

        bRedexData_InString = bInString;
        //pred->pMatch = pMatch;
        intRedexData_matchPos = intMatchPos;

        /* set the StringLength variable in case we are reducing only to keep
         * expander data in step */
        if (bInString)
        {
            intRedexData_StringLength = 0;
        }
        else
        {
            intRedexData_StringLength = -1;
        }

        //TRACE((TC_WD, TT_API3,"V3Reducer: EXIT bytes consumed = %d, inString = %d\n", pRawData - pInput, inString));


        /* tell caller what we did */
        //*pNrOfBytesConsumed = pRawData - pInput;
        reducedData.nrOfBytesConsumed = intRawDataPos - inputPos;
        //*pNrOfBytesGenerated = pCompressedData - pOutput;
        reducedData.nrOfBytesGenerated = intCompressedPos - outputPos;
    };


    // Compute average distance between each data byte and its previous occurrence to
    // see if data looks random or non-random.  100% random data gives an average
    // distance of around 256.  Assume if average is above 190 it will not compress
    // well
    this.DataLooksCompressible = function(/*PUCHAR*/   pInput,       /* input to test */
                                   inputPos,
                                  /*ULONG*/    inputLength)  /* length of input */
    {
        var arrPrevOccurrence = new Array(256);

        if (inputLength < 350)
        {
            /* only work with reasonably sized blocks */
            return true;  /* assume compressible */
        }

        for (var i = 0; i < 256; i += 4)
        {
            arrPrevOccurrence[i] = i;
            arrPrevOccurrence[i + 1] = i + 1;
            arrPrevOccurrence[i + 2] = i + 2;
            arrPrevOccurrence[i + 3] = i + 3;
        }

        var intCurrentOccurrence = 256;

        // Process first 128 bytes to get occurrence table in reasonable start state.
        var intEndOfFirstPart = 128 + 256;
        var intEndOfSecondPart = inputLength + (256 - 4);
        var arrpData = pInput;
        //var intDataPos = inputPos;

        var intValue;
        while (intCurrentOccurrence < intEndOfFirstPart) {
            intValue = arrpData[inputPos++] & 0xff;
            arrPrevOccurrence[intValue] = intCurrentOccurrence++;
            intValue = arrpData[inputPos++] & 0xff;
            arrPrevOccurrence[intValue] = intCurrentOccurrence++;
            intValue = arrpData[inputPos++] & 0xff;
            arrPrevOccurrence[intValue] = intCurrentOccurrence++;
            intValue = arrpData[inputPos++] & 0xff;
            arrPrevOccurrence[intValue] = intCurrentOccurrence++;
        }

        // Process second part to compute distances.
        var intTotalDistance = 0;
        var intStartOccurrence = intCurrentOccurrence;
        while (intCurrentOccurrence < intEndOfSecondPart) {
            intValue = arrpData[inputPos++] & 0xff;
            intTotalDistance -= arrPrevOccurrence[intValue];  // should be intTotalDistance += (intCurrentOccurrence - arrPrevOccurrence[intValue])
            arrPrevOccurrence[intValue] = intCurrentOccurrence++;
            intValue = arrpData[inputPos++] & 0xff;
            intTotalDistance -= arrPrevOccurrence[intValue];  // should be intTotalDistance += (intCurrentOccurrence - arrPrevOccurrence[intValue])
            arrPrevOccurrence[intValue] = intCurrentOccurrence++;
            intValue = arrpData[inputPos++] & 0xff;
            intTotalDistance -= arrPrevOccurrence[intValue];  // should be intTotalDistance += (intCurrentOccurrence - arrPrevOccurrence[intValue])
            arrPrevOccurrence[intValue] = intCurrentOccurrence++;
            intValue = arrpData[inputPos++] & 0xff;
            intTotalDistance -= arrPrevOccurrence[intValue];  // should be intTotalDistance += (intCurrentOccurrence - arrPrevOccurrence[intValue])
            arrPrevOccurrence[intValue] = intCurrentOccurrence++;
        }
        var intTotalOccurrences = intCurrentOccurrence - intStartOccurrence;

        // Add in the missing part of each calculation
        // (totalDistance += (intCurrentOccurrence .....))
        intTotalDistance += (((intStartOccurrence + intCurrentOccurrence) * intTotalOccurrences) >> 1);

        // Compute average distance.
        var intAverageDistance = intTotalDistance / intTotalOccurrences;


        if (intAverageDistance < 190) {
            // Random data will have about half its values in the top band 128-255 so
            // this looks non-random.
            return true;
        }
        return false;
    };

    this.getFullyInitialized =  function()
    {
        return bRedexData_FullyInitialized ;
    };

    this.setUseLightweightObjectParsing = function(useLightweightObjectParsing)
    {
        bRedexData_UseLightweightObjectParsing = useLightweightObjectParsing;
    };

    this.getUseLightweightObjectParsing = function()
    {
        return bRedexData_UseLightweightObjectParsing;
    };
}
