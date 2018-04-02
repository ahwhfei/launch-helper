import HelperElement from './helper-element.js';
import Manifest from './manifest.js';
import Helper from './helper.js';
import IcaJson from './ica-json.js';
import ScriptLoad from './script-load.js';

window.launchHelper = function (handlers) {
    const loadCitrixSDKPromise = new Promise(resolve => {
        new ScriptLoad(`${new Manifest().manifest.staticResource}/CitrixHTML5SDK.js`, () => {
            resolve();
        }).loadScript();
    });
    
    const getIcaJsonPromise = new IcaJson().icaAsync;

    Promise.all([loadCitrixSDKPromise, getIcaJsonPromise])
        .then(results => {
            const ica = results[1];
            const launchHelperElement = new HelperElement();
            launchHelperElement.appendIframe();
        
            const helper = new Helper(ica, handlers);
            helper.createSession();
        }).catch(err => {
            console.log(err);
        });
};
