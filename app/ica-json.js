import userInstance from './user.js';
import IcaUrl from './ica-url.js';
import HelperElement from './helper-element.js';

class IcaJson {
    get icaAsync() {
        return this._fetchIcaJson().then(ica => ica);
    }

    async _fetchIcaJson() {
        const method = HelperElement().method;

        const options = {
            method: method,
            headers: {
                Authorization: `CWSAuth bearer=${userInstance.user.token}`,
                'content-type': 'application/json'
            }
        };

        if (method.toLowerCase() === 'post') {
            options.body = JSON.stringify({
                SessionId: window.cwcSessionId
            });
        }

        const response = await fetch(new IcaUrl().url, options);
        return await response.json();
    }
}

export default IcaJson;
