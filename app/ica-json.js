import userInstance from './user.js';
import IcaUrl from './ica-url.js';
import HelperElement from './helper-element.js';

class IcaJson {
    get icaAsync() {
        return this._fetchIcaJson().then(ica => ica);
    }

    async _fetchIcaJson() {
        const method = new HelperElement().method;

        const response = await fetch(IcaUrl.url, {
            method: method,
            headers: {
                Authorization: `CWSAuth bearer=${userInstance.user.token}`
            }
        });
        return await response.json();
    }
}

export default IcaJson;
