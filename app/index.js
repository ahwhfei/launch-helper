import Helper from './helper.js';
import IcaJson from './ica-json.js';
import HelperElement from './helper-element.js';
import ScriptLoad from './script-load.js';

window.launchHelper = function () {
    const loadCitrixSDKPromise = new Promise(resolve => {
        new ScriptLoad('CitrixHTML5SDK.js', () => {
            resolve();
        }).loadScript();
    });
    

    const getIcaJsonPromise = new IcaJson().icaAsync;

    Promise.all([loadCitrixSDKPromise, getIcaJsonPromise])
        .then(results => {
            const ica = results[1];
            const launchHelperElement = new HelperElement();
            launchHelperElement.appendIframe();
        
            const helper = new Helper(ica);
            helper.createSession();
        }).catch(err => {
            console.log(err);
        });
};
