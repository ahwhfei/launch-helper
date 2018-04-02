import HelperElement from './helper-element.js';
import Helper from './helper.js';
import IcaJson from './ica-json.js';
import ScriptLoad from './script-load.js';

window.launchHelper = function (handlers, config) {
    HelperElement.config = config;

    const loadCitrixSDKPromise = new Promise(resolve => {
        new ScriptLoad(`${HelperElement.staticResource}/CitrixHTML5SDK.js`, () => {
            resolve();
        }).loadScript();
    });
    
    const getIcaJsonPromise = new IcaJson().icaAsync;

    Promise.all([loadCitrixSDKPromise, getIcaJsonPromise])
        .then(results => {
            const ica = results[1];
            HelperElement.appendIframe();
        
            const helper = new Helper(ica, handlers);
            helper.createSession();
        }).catch(err => {
            console.log(err);
        });
};
