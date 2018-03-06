import userInstance from './user.js';
import HelperElement from './helper-element.js';

class IcaUrl {
    constructor() {
        this._helperElement = new HelperElement();
    }

    get icaUrl() {
        return `${this._xenDesktopApi}/${this._helperElement.src}`;
    }

    get _xenDesktopApi() {
        return manifest.xenDesktopApi.replace('[customer]', userInstance.user.customer);
    }
}

const ica = new IcaUrl();

export default ica.icaUrl;
