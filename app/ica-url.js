import userInstance from './user.js';
import HelperElement from './helper-element.js';

class IcaUrl {
    constructor() {
        this._element = new HelperElement();
    }

    get url() {
        return `${this._xenDesktopApi}/${this._element.src}`;
    }

    get _xenDesktopApi() {
        return this._element.xdApi.replace('[customer]', userInstance.user.customer);
    }
}

export default IcaUrl;
