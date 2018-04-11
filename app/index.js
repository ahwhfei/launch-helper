import HelperElement from './helper-element.js';
import Helper from './helper.js';
import IcaJson from './ica-json.js';
import ScriptLoad from './script-load.js';

export function launchHelper (handlers, config) {
    HelperElement().config = config;

    const loadCitrixSDKPromise = new Promise(resolve => {
        new ScriptLoad(`${HelperElement().staticResource}/CitrixHTML5SDK.js`, () => {
            resolve();
        }).loadScript();
    });
    
    const getIcaJsonPromise = new IcaJson().icaAsync;

    return Promise.all([loadCitrixSDKPromise, getIcaJsonPromise])
        .then(results => {
            const ica = results[1];
            HelperElement().appendIframe();
        
            const helper = new Helper(ica, handlers);
            const status = helper.createSession();
            status.ica = ica;
            return status;
        }).catch(err => {
            console.log(err);
            return {
                failed: true,
                msg: 'Failed at getting Ica Json file'
            }
        });
};

export function getIca(config) {
    HelperElement().config = config;
    return new IcaJson().icaAsync;
}

export {
    launchHelper,
    getIca
}
