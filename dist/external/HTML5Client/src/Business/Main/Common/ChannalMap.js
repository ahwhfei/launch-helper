function ChannalMap()
{}
	ChannalMap.availableChannalNosForCustomVC = [28,29,30]; //Handle dynamic channel nos in future.
	
	ChannalMap.revVirtualChannalMap = [];
    ChannalMap.revVirtualChannalMap[0] = "CTXSCRN";
    ChannalMap.revVirtualChannalMap[1] = "CTXLPT1";
    ChannalMap.revVirtualChannalMap[2]=  "CTXLPT2";
    ChannalMap.revVirtualChannalMap[3] = "CTXINT";
    ChannalMap.revVirtualChannalMap[4] =  "CTXCPM ";
    ChannalMap.revVirtualChannalMap[5] =  "CTXCOM1";
    ChannalMap.revVirtualChannalMap[6] =  "CTXCOM2";
    ChannalMap.revVirtualChannalMap[7] =  "CTXINT ";
    ChannalMap.revVirtualChannalMap[8] =  "CTXCCM ";
    ChannalMap.revVirtualChannalMap[9] =  "CTXTW  ";
    ChannalMap.revVirtualChannalMap[10] =  "CTXCDM ";
    ChannalMap.revVirtualChannalMap[11] =  "CTXSHDW";
	ChannalMap.revVirtualChannalMap[12] =  "CTXTWI\0";
    ChannalMap.revVirtualChannalMap[14] =   "CTXOEM " ;
    ChannalMap.revVirtualChannalMap[16]  =  "CTXOEM2";
    ChannalMap.revVirtualChannalMap[17] =   "CTXCLIP";
    ChannalMap.revVirtualChannalMap[18] =   "CTXCAM ";
    ChannalMap.revVirtualChannalMap[19] =   "CTXMM  ";
    ChannalMap.revVirtualChannalMap[20] =   "CTXCTL ";
    ChannalMap.revVirtualChannalMap[21] =  "CTXEUEM";
	ChannalMap.revVirtualChannalMap[22] = "CTXGUSB";
	ChannalMap.revVirtualChannalMap[23] =   "CTXFILE";
	ChannalMap.revVirtualChannalMap[24] =   "CTXMOB";
	ChannalMap.revVirtualChannalMap[25] =   "CTXMTCH";
	ChannalMap.revVirtualChannalMap[26] =   "CTXSCRD";
	
	//Do not use Channel numbers 28,29,30 -> Used for Custom VC
	


   ChannalMap.virtualChannalMap = [];
    ChannalMap.virtualChannalMap["CTXSCRN"] = 0;
    ChannalMap.virtualChannalMap["CTXLPT1"] = 1;
    ChannalMap.virtualChannalMap["CTXLPT2"] = 2;
    ChannalMap.virtualChannalMap["CTXINT "] = 3;
    ChannalMap.virtualChannalMap["CTXCPM "] = 4;
    ChannalMap.virtualChannalMap["CTXCOM1"] = 5;
    ChannalMap.virtualChannalMap["CTXCOM2"] = 6;
    ChannalMap.virtualChannalMap["CTXINT "] = 7;
    ChannalMap.virtualChannalMap["CTXCCM "] = 8;
    ChannalMap.virtualChannalMap["CTXTW  "] = 9;
    ChannalMap.virtualChannalMap["CTXCDM "] = 10;
    ChannalMap.virtualChannalMap["CTXSHDW"] = 11;
	ChannalMap.virtualChannalMap["CTXTWI\0"] = 12;
    ChannalMap.virtualChannalMap["CTXOEM "] = 14 ;
    ChannalMap.virtualChannalMap["CTXOEM2"] = 16;
    ChannalMap.virtualChannalMap["CTXCLIP"] = 17;
    ChannalMap.virtualChannalMap["CTXCAM "] = 18;
    ChannalMap.virtualChannalMap["CTXMM  "] = 19;
    ChannalMap.virtualChannalMap["CTXCTL "] = 20;
    ChannalMap.virtualChannalMap["CTXEUEM"] = 21;
	ChannalMap.virtualChannalMap["CTXGUSB"] = 22;
	ChannalMap.virtualChannalMap["CTXFILE"] = 23;
	ChannalMap.virtualChannalMap["CTXMOB"] = 24;
	ChannalMap.virtualChannalMap["CTXMTCH"] = 25;
	ChannalMap.virtualChannalMap["CTXSCRD"] = 26;