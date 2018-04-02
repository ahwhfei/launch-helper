import userInstance from './user.js';
import HelperElement from './helper-element.js';

class IcaUrl {
    get url() {
        return `${this._xenDesktopApi}/${HelperElement.src}`;
    }

    get _xenDesktopApi() {
        return HelperElement.xdApi.replace('[customer]', userInstance.user.customer);
    }
}

export default new IcaUrl();
