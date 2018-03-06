import Helper from './helper.js';
import IcaJson from './ica-json.js';
import HelperElement from './helper-element.js';

window.launchHelper = function () {
    new IcaJson().icaAsync.then(ica => {
        const launchHelperElement = new HelperElement();
        launchHelperElement.appendIframe();
    
        const helper = new Helper(ica);
        helper.createSession();
    }).catch(err => {
        console.log(err);
    })
};
