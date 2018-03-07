import userInstance from './user.js';
import HelperElement from './helper-element.js';

class IcaUrl {
    get url() {
        return `${this._xenDesktopApi}/${new HelperElement().src}`;
    }

    get _xenDesktopApi() {
        return manifest.xenDesktopApi.replace('[customer]', userInstance.user.customer);
    }
}

export default new IcaUrl();
