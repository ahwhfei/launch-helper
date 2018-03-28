/* ProxyServerConnector */

function ProxyServerConnector(useChromeSock, proxyAddress, proxyPort, onOpenCallback, onMessageCallback, onCloseCallback, onErrorCallBack, callBackWrapper1) {
	var socketConnector = null;
	if (!useChromeSock) {
		socketConnector = new MyWebSocket(proxyAddress, proxyPort, onOpenCallback, onMessageCallback, onCloseCallback, onErrorCallBack, callBackWrapper1);
	} else {
		socketConnector = new ChromeSocket(proxyAddress, proxyPort, onOpenCallback, onMessageCallback, onCloseCallback, onErrorCallBack, callBackWrapper1);
	}
	this.Connect = function(hostname, port, isSSLEnabled) {
		socketConnector.Connect(hostname, port, isSSLEnabled);
	};
	this.Disconnect = socketConnector.Disconnect;
	this.Send = socketConnector.Send;
	this.setReceiveCallback = socketConnector.setReceiveCallback;
	this.Suspend = socketConnector.Suspend;
}
