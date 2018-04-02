import HelperElement from './helper-element.js';
import Helper from './helper.js';
import IcaJson from './ica-json.js';
import ScriptLoad from './script-load.js';

window.launchHelper = function (handlers, config) {
    const launchHelperElement = new HelperElement();

    const loadCitrixSDKPromise = new Promise(resolve => {
        new ScriptLoad(`${launchHelperElement.staticResource || (config && config.res)}/CitrixHTML5SDK.js`, () => {
            resolve();
        }).loadScript();
    });
    
    const getIcaJsonPromise = new IcaJson(config).icaAsync;

    Promise.all([loadCitrixSDKPromise, getIcaJsonPromise])
        .then(results => {
            const ica = results[1];
            launchHelperElement.appendIframe();
        
            const helper = new Helper(ica, handlers);
            helper.createSession();
        }).catch(err => {
            console.log(err);
        });
};
