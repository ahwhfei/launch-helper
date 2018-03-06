/**
 * Created by rajasekarp on 17-12-2015.
 */


/**
 * Created by rajasekarp on 16-12-2015.
 */

var SeamlessUI;

(function(SeamlessUI){
	var Utils = function() {
		function Utils() {

		}

		Utils.prototype.setBounds = function (element, bounds) {
			element.style.left = bounds.left + 'px';
			element.style.top = bounds.top + 'px';
			element.style.width = bounds.width + 'px';
			element.style.height = bounds.height + 'px';
		};

		Utils.prototype.setRelativeBounds = function (element, parent, bounds) {
			element.style.left = (bounds.left - parent.appBounds.left) + 'px';
			element.style.top = (bounds.top - parent.appBounds.top) + 'px';
			element.style.width = bounds.width + 'px';
			element.style.height = bounds.height + 'px';
		};

		Utils.prototype.spyContainers = function () {
			Utils.prototype.spyElement(document.getElementById('MousePointerDiv'));
			Utils.prototype.spyElement(document.getElementById('CitrixSuperRenderCanvas'));
			Utils.prototype.spyElement(document.getElementById('citrixHTML5root'));
		};

		Utils.prototype.spyElement = function (elem) {
			function callBack(e) {
				console.log("Source : " + e.srcElement.id + "    type : " + e.type);
			}
			if(!elem)
				return;
			elem.addEventListener('mouseup', callBack, false);
			//elem.addEventListener('mousemove', callBack);
			elem.addEventListener('mousedown', callBack, false);
			elem.addEventListener('mouseout', callBack);
			document.body.addEventListener('blur', callBack);
		};

        Utils.prototype.tryApplySeamless = function (divId) {
            if(g.environment.receiver.seamlessMode && g.environment.receiver.isChromeApp) {
                var elem = document.getElementById(divId);
                var bounds = elem.getBoundingClientRect();
                var position = { left: Math.round(bounds.left), top: Math.round(bounds.top), width: Math.round(bounds.width), height: Math.round(bounds.height) };
                chrome.app.window.current().setShape({'rects': [position]});
            }
        };

 		return Utils;
	}();

	SeamlessUI.Utils = new Utils();
})(SeamlessUI || (SeamlessUI = {}));