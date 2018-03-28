
function V3HeaderStore(header, headerPos)
 {
	var arrHeader = header;
	var intHeaderPos = headerPos; //Next element will be placed on intHeaderPos+ position
	var CAPACITY_INCREMENT = 10;

	this.ensureSpace =  function (intSpaceNeeded)
	{

		 var intCurrentSpace =   arrHeader.length - intHeaderPos - 1;

		 if (intCurrentSpace < intSpaceNeeded)
		 {
            //using double bitwise NOT to floor
		 	var intGrowthBlocks = ~~(intSpaceNeeded / CAPACITY_INCREMENT) + 1;
		 	arrHeader.length += (intGrowthBlocks * CAPACITY_INCREMENT);
		}
	};

	this.getHeader = function () {
		return arrHeader;
	};

	this.getHeaderPos = function () {
		return intHeaderPos;
	};

	this.setHeaderPos = function (intPosition) {
	     intHeaderPos = intPosition;
	};
}