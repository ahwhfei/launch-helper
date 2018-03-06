var UiControls;
(function(UiControls){
    var utils = (function(){
        function fadeIn(element,ejson)
        {
            var fadeDelta=parseFloat(ejson['interval'])/parseFloat(ejson['totalTime']);
            var fadeValue=parseFloat(ejson['fadeValue']);
            var maxFadeValue=parseFloat(ejson['maxFadeValue']);
            var fadeInTimer=setInterval(function(){
            if(fadeValue>=maxFadeValue)
            {
                window.clearInterval(fadeInTimer);
                fadeInTimer = null;
                element.style.opacity=maxFadeValue;
                return;
            }
            fadeValue+=fadeDelta;
            element.style.opacity=fadeValue;

            },ejson['interval']);
        }
        function fadeOutPop (element,ejson) {
            var fadeValue=parseFloat(ejson['fadeValue']);
            var minFadeValue=parseFloat(ejson['minFadeValue']);
            var fadeDelta=parseFloat(ejson['interval'])/parseFloat(ejson['totalTime']);
            var fadeInTimer=setInterval(function(){
                if(fadeValue<=minFadeValue)
                {
                    window.clearInterval(fadeInTimer);
                    fadeInTimer = null;
                    element.style.opacity=minFadeValue;
                    element.style.display = 'none';
                    return;
                }
                fadeValue-=fadeDelta;
                element.style.opacity=fadeValue;
            },ejson['interval']);
        }
        return {
			fadeIn : fadeIn,
			fadeOutPop : fadeOutPop
		};  
   })();
    UiControls.utils = utils;
} )(UiControls||(UiControls={}));