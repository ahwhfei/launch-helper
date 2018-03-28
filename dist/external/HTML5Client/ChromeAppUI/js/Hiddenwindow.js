/**
 * Created by rajasekarp on 11-09-2015.
 */

(function() {
	var current = chrome.app.window.current();

	function setTitle(title) {
		document.title = title;
	}

	function setIcon(iconSrc) {
		var link = document.getElementById("pageIcon");
		if(!link){
  		link = document.createElement('link');
  		link.rel = String('SHORTCUT ICON');
  		link.type = String('image/png');
  		link.id = "pageIcon";
  		document.getElementsByTagName('head')[0].appendChild(link);
		}
		link.href = iconSrc;
        document.getElementById('iconContent').setAttribute('src', iconSrc);
	}
	
	function closeWindow( ){
		var win = chrome.app.window.current();
		win.close( );
	}
	current.applyCmd = function(cmd) {
		switch (cmd.type) {
			case 'title' :
				console.log("setting title data" + cmd.data);
				setTitle(cmd.data);
				break;
			case 'icon' :
				console.log("setting Icon");
				setIcon(cmd.data);
				break;
			case 'close':
				closeWindow();
				break;
			default:
				break;
		}
	};
})();

window.onload = function(e) {
  // set background color black as icons are transparent.
  document.body.style.backgroundColor = "black";
};

