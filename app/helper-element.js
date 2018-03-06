import Manifest from './manifest.js';

class HelperElement {
    constructor() {
        this._element = document.getElementsByTagName('launch-helper')[0];
        
        const manifest = new Manifest();
        manifest.xenDesktopApi = this.xenDesktopApi;
        manifest.staticResource = this.staticResource;
    }

    get element() {
        return this._element;
    }

    get src() {
        const url = this._element.getAttribute('src');

        return url[0] === '/' ? url.slice(1) : url;
    }

    get method() {
        return this._element.getAttribute('method') || 'GET';
    }

    get xenDesktopApi() {
        return this._element.getAttribute('api');
    }

    get staticResource() {
        return this._element.getAttribute('res');
    }

    appendIframe() {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('id', 'studio');
        iframe.setAttribute('width', '100%');
        iframe.setAttribute('height', '100%');
        this._element.appendChild(iframe);
    }
}

export default HelperElement;
