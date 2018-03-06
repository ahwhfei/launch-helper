/**
 * This class implements the ICA TWI (Transparent Window Interface,
 * aka Seamless) virtual channel client functionality.
 *
 */
function TWIEngine(callbackWrapper1) {
	var callbackWrapper = callbackWrapper1;
	var processor = null;
	var myself = this;
	var vStream;
	var streamName = "CTXTWI\0";
	var streamSize = 0x2000;
	var createVirtualStream = function(streamName, streamSize) {
		var chnl = ChannalMap.virtualChannalMap[streamName];
		stream = new VirtualStream(chnl, callbackWrapper, streamSize);
		return stream;
	};

	this.getVStream = function() {
		return vStream;
	};
	this.EndWriting = function endWriting(reason) {

	};
	this.getTwiManager = function() {
		return processor.getTwiManager();
	};
	this.onIcaFile = function( ){
		processor.onIcaFile();
	};
	this.setVdaRes = function(res){
	    processor.setVdaRes(res);
	};
	var prevReadIndex = 0;
	this.Run = function run() {
		prevReadIndex = 0;
		vStream.RegisterCallback(this._Run);
	};

	this._Run = function _run() {
		var errorHandle = function() {
			vStream.setReadIndex(prevReadIndex);
			vStream.compact();
		};

		try {
			while (vStream.Available() >= 3) {
				/* Main processing */
				prevReadIndex = vStream.GetReadIndex();
				try {
					var command = vStream.ReadByte();
					var packet_len = vStream.ReadUInt16();
					vStream.WaitForSpace(packet_len);
					processor.handleCmd(command, packet_len);

				} catch(error) {
					if (error == VirtualStreamError.NO_SPACE_ERROR) {
						errorHandle();
						return;
					} else {
						throw error;
					}
				}

				prevReadIndex = vStream.GetReadIndex();
			}
		} catch(error) {
			throw error;
		}
	};
	this.initialize = function(config) {
		vStream = createVirtualStream(streamName, streamSize);
		processor = new TWIProcessor(callbackWrapper);
		processor.initialize(vStream ,config);
	};
}