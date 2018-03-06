function Cache(){}

Cache.ID_BITMAP       	 = 1;
Cache.ID_GLYPH           = 2;
Cache.ID_RGB_PALETTE     = 3;
Cache.ID_INDEX_PALETTE   = 4;
Cache.ID_CLIPPING_REGION = 5;
Cache.ID_LINE_STRIPS     = 6;


function MemoryCache()
{
	var QUAD_MASK = (~0x3) & 0xffffffff;
	var HEADER_SIZE = 4;
	var EXPANDED_BITMAP_MASK = 0x7f;
	var EMPTY_EXPANDED_SLOT = -1;
	var cachePower = 0, maxObjectSize = 0, memoryCacheLength = 0;
	var memoryIndexMask = 0, handlePower = 0, handleMask = 0, minDiskObjectLength = 0;
	var headIndex = 0, tailHandle = 0, headHandle = 0, lastHeadIndex = 0;
	var map = null;
	var dataStore = null;
	var cacheStream = new CacheStream();
	var expandedMap = null;
	
	var expandedBitmaps = new Array(EXPANDED_BITMAP_MASK + 1);
	
	var inverseExpandedMap = new Int32Array(EXPANDED_BITMAP_MASK + 1);
	
	var oldestExpandedIndex = 0;

	var SetInternalVariable = function setInternalVariables(cp, mos, mcl, mim, hp, hm, mdol, hi, th, hh, lhi, oei)
	{
		cachePower = cp, maxObjectSize = mos, memoryCacheLength = mcl;
		memoryIndexMask = mim, handlePower = hp, handleMask = hm, minDiskObjectLength = mdol;
		headIndex = hi, tailHandle = th, headHandle = hh, lastHeadIndex = lhi;
		oldestExpandedIndex = oei;
	};

	this.ClearCache= function clearCache()
	{
		dataStore = null ;
		map = null;
	};

	var v = new Int32Array(14);
	this.GetAllVariable = function getAllVariable()
	{
		var cs = cacheStream.GetAllVariable();
		v[0] = cachePower, v[1] = maxObjectSize,v[2] = memoryCacheLength,v[3] = memoryIndexMask,v[4] = handlePower,v[5] = handleMask,v[6] = minDiskObjectLength,v[7] = headIndex,v[8] = tailHandle,v[9] = headHandle,v[10] = lastHeadIndex,v[11] = oldestExpandedIndex, v[12] = cs[0], v[13] = cs[1];
		return v;
	};

	this.RestoreAllVariable = function restoreAllVariable(data)
	{
		SetInternalVariable(data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7], data[8], data[9], data[10], data[11]);
		cacheStream.RestoreAllVariable(data[12], data[13]);
	};

	if (QUAD_MASK<0) QUAD_MASK += 0xFFFFFFFF + 1;

	this.Initialize = function initialize(cPower, hPower, maximumObjectSize, minimumDiskObjectLength)
	{
		cachePower          = cPower;
		handlePower         = hPower;
		maxObjectSize       = maximumObjectSize;
		minDiskObjectLength = minimumDiskObjectLength;

		memoryCacheLength = 1 << cachePower;
		if (memoryCacheLength <= 0)
		{
			OutputError.WriteToInputBox('ErrorO', "Invalid MemoryCacheLength!");
		}
		memoryIndexMask   = memoryCacheLength - 1;

		var storeSize = memoryCacheLength + maxObjectSize + 100;
       
		if (dataStore == null || dataStore.length < storeSize)
		{
			dataStore = new Uint8Array(storeSize);

		}

		var mapSize = 1 << handlePower;

		if (map == null || map.length < mapSize)
		{
			map = new Int32Array(mapSize);
		}

		  expandedMap = new Int32Array(mapSize);
		for (var i = 0; i < (mapSize); ++i)
		{
			expandedMap[i] = EMPTY_EXPANDED_SLOT;
		}

		for (var i = 0; i < (EXPANDED_BITMAP_MASK + 1); ++i)
		{
			inverseExpandedMap[i] = EMPTY_EXPANDED_SLOT;
			var bm = expandedBitmaps[i];
			if (bm != null)
			{
				expandedBitmaps[i] = null;
			}
		}

		handleMask  = mapSize - 1;
		headIndex  = 0;
		tailHandle = 0;
		headHandle = 0;
	};

	var LocateHeader = function locateHeader(handle)
	{
		var ret = map[handle & handleMask] & memoryIndexMask;
		return ret;
	};

	var GetObjectSize = function getObjectSize(index)
	{
  		return ByteConverter.Byte4ToInt32AtOffset(dataStore, index);
	};

	var NewCacheEntry = function newCacheEntry(entrySize)
	{
		if (entrySize == null)
			OutputError.WriteToInputBox('ErrorO',"NewCacheEntry: Null EntrySize");
		var entry = (headIndex + 3) & QUAD_MASK;
		if (entry < 0) entry += 0xffffffff + 1;
		var index = headHandle & handleMask;
		++headHandle;
	   	map[index] = entry;
		var expandedCacheIndex = expandedMap[index];
		if (expandedCacheIndex != EMPTY_EXPANDED_SLOT)
		{
			var bm = expandedBitmaps[expandedCacheIndex];
			if (bm != null)
			{
				expandedBitmaps[expandedCacheIndex] = null;
				inverseExpandedMap[expandedCacheIndex] = EMPTY_EXPANDED_SLOT;
				expandedMap[index] = EMPTY_EXPANDED_SLOT;
			}
		}
		lastHeadIndex = headIndex;
		headIndex = entry + HEADER_SIZE + entrySize;
		return ByteWriter.WriteInt32ToBuffer(dataStore, entry & memoryIndexMask, entrySize);
	};

	var Preserve = function preserve(handle)
	{
		var headerIndex = LocateHeader(handle);
		var objectSize  = GetObjectSize(headerIndex);
		var source      = headerIndex + HEADER_SIZE;
		var destination = NewCacheEntry(objectSize);

		Utility.CopyInSameArray(dataStore, source, dataStore, destination, objectSize);
	};

    // OPT_JPEG start
    function newObjectNoException(twTwoReadStream, complete) {
        var length = twTwoReadStream.ReadVarUInt();
		// We are about to modify cache data store so do a check on available virtual stream before..
		if (!twTwoReadStream.isEnoughData(length)) {
            return false;
        }
		if (length > maxObjectSize)
		{
		    try {
                twTwoReadStream.SkipByte(length);
                console.warn("OPT_JPEG: new object " + length + " too large then " + maxObjectSize + ". so skip but how throw err?");
		    }
		    catch (err) {
                throw CacheError.OBJECT_TOO_LARGE;
            }
		}

		var index = NewCacheEntry(length);
		twTwoReadStream.ReadBytes(dataStore, index, length);
        return true;
    }
    
    function extendObjectNoException(twTwoReadStream, complete) // srchk what is the role of complete here??
	{
		var extraLength = twTwoReadStream.ReadVarUInt();
		 // We are about to modify cache data store so do a check on available virtual stream before..
        if (!twTwoReadStream.isEnoughData(extraLength)) {
            return false;
        }
        
		var objectHandle 	= headHandle - 1;
		var startIndex     	= LocateHeader(objectHandle);
		var extendIndex    	= headIndex & memoryIndexMask;
		var extendedLength 	= ByteConverter.Byte4ToInt32AtOffset(dataStore, startIndex) + extraLength;

		if (extendedLength > maxObjectSize)
		{
			try {
				// srchk is it possible to throw here??
                twTwoReadStream.SkipByte(extraLength);
           } catch (err) {
                throw CacheError.OBJECT_TOO_LARGE;
            }
		}

	   

		headIndex += extraLength;

		if (extendIndex < startIndex)
		{
			extendIndex += memoryCacheLength;
		}

		ByteWriter.WriteInt32ToBuffer(dataStore, startIndex, extendedLength);

		twTwoReadStream.ReadBytes(dataStore, extendIndex, extraLength);
        return true;
	}
    
    if (HTML5_CONFIG && HTML5_CONFIG['features'] && HTML5_CONFIG['features']['graphics'] && HTML5_CONFIG['features']['graphics']['noWaitForSpaceEx']) {
        Profiler.Ui.update('GfxObjEx', 'No');
        this.NewObject = newObjectNoException;
        this.ExtendObject = extendObjectNoException;
    } else {
        Profiler.Ui.update('GfxObjEx', 'Yes');
        this.NewObject = newObject;
        this.ExtendObject = extendObject;
    }
    

	function newObject(twTwoReadStream, complete) // srchk what the role of complete here. its not being consumed??
	{
		var length = twTwoReadStream.ReadVarUInt();
		// We are about to modify cache data store so do a check on available virtual stream before..
		twTwoReadStream.WaitForSpace(length);
		if (length > maxObjectSize)
		{
		    try {
                twTwoReadStream.SkipByte(length);
		    }
		    catch (err) {
                throw CacheError.OBJECT_TOO_LARGE;
            }
		}

		

		var index = NewCacheEntry(length);

		twTwoReadStream.ReadBytes(dataStore, index, length);
        return true;
	}

	function extendObject(twTwoReadStream, complete) // srchk what is the role of complete here??
	{
		var extraLength = twTwoReadStream.ReadVarUInt();
		 // We are about to modify cache data store so do a check on available virtual stream before..
		twTwoReadStream.WaitForSpace(extraLength);
		var objectHandle 	= headHandle - 1;
		var startIndex     	= LocateHeader(objectHandle);
		var extendIndex    	= headIndex & memoryIndexMask;
		var extendedLength 	= ByteConverter.Byte4ToInt32AtOffset(dataStore, startIndex) + extraLength;

		if (extendedLength > maxObjectSize)
		{
			try {
                twTwoReadStream.SkipByte(extraLength);
           } catch (err) {
                throw CacheError.OBJECT_TOO_LARGE;
            }
		}

	   

		headIndex += extraLength;

		if (extendIndex < startIndex)
		{
			extendIndex += memoryCacheLength;
		}

		ByteWriter.WriteInt32ToBuffer(dataStore, startIndex, extendedLength);

		twTwoReadStream.ReadBytes(dataStore, extendIndex, extraLength);
        return true;
	}

    // OPT_JPEG End
    
	this.Purge = function purge(twTwoReadStream)
	{
		var nrOfBits = 0, bits = 0;

		var oC = twTwoReadStream.ReadVarUInt();
		var  objectLength = Math.floor( ( oC + 7 ) / 8 );
		twTwoReadStream.WaitForSpace(objectLength );
		for (var objectCount = oC; objectCount > 0; --objectCount)
		{
			if (nrOfBits == 0)
			{
				bits = twTwoReadStream.ReadUInt8();
				nrOfBits = 8;
			}

			if ((bits & 0x01) != 0)
			{
				Preserve(tailHandle);
			}
			else
			{
				var index = tailHandle & handleMask;
				var expandedCacheIndex = expandedMap[index];
				if (expandedCacheIndex != EMPTY_EXPANDED_SLOT)
				{
					expandedBitmaps[expandedCacheIndex] = null;
					inverseExpandedMap[expandedCacheIndex] = EMPTY_EXPANDED_SLOT;
					expandedMap[index] = EMPTY_EXPANDED_SLOT;
				}
			}

			--nrOfBits;
			bits >>>= 1;
			++tailHandle;
		}
	};

	this.GetExpandedBitmap = function getExpandedBitmap(bitmapRef)
	{
		var index = bitmapRef & handleMask;
		var expandedCacheIndex = expandedMap[index];
		if (expandedCacheIndex != EMPTY_EXPANDED_SLOT)
		{
			var bm = expandedBitmaps[expandedCacheIndex];
			if (bm == null) {
				expandedMap[index] = EMPTY_EXPANDED_SLOT;
			}
			return bm;
		}
		else
		{
			return null;
		}
	};

	this.CacheExpandedBitmap = function cacheExpandedBitmap(bitmapRef, newBm)
	{
		var index = bitmapRef & handleMask;
		var expandedCacheIndex = expandedMap[index];

		if (expandedCacheIndex == EMPTY_EXPANDED_SLOT)
		{
			var oldBm = expandedBitmaps[oldestExpandedIndex];
			if (oldBm != null)
			{
				var oldHandle = inverseExpandedMap[oldestExpandedIndex];
				expandedMap[oldHandle] = EMPTY_EXPANDED_SLOT;
			}

			expandedBitmaps[oldestExpandedIndex] = newBm;
			expandedMap[index] = oldestExpandedIndex;
			inverseExpandedMap[oldestExpandedIndex] = index;

			oldestExpandedIndex = (oldestExpandedIndex + 1) & EXPANDED_BITMAP_MASK;
		}
	};

	this.ReadObject = function readObject(handle)
	{
		var headerIndex = LocateHeader(handle);
		var objectSize  = GetObjectSize(headerIndex);
		var index  = headerIndex + HEADER_SIZE;

		cacheStream.Reset(dataStore, index, objectSize);

		return cacheStream;
	};
}

