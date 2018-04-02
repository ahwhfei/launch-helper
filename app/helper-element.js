class HelperElement {
    constructor(config) {
        this._element = document.getElementsByTagName('launch-helper')[0];
        this._config = config;
    }

    get element() {
        return this._element;
    }

    get src() {
        const url = this._element.getAttribute('src') || (this._config && this._config.src);

        return url[0] === '/' ? url.slice(1) : url;
    }

    get method() {
        return this._element.getAttribute('method') || (this._config && this._config.method) || 'GET';
    }

    get xdApi() {
        return this._element.getAttribute('api') || (this._config && this._config.api);
    }

    get staticResource() {
        return this._element.getAttribute('res') || (this._config && this._config.res) || window.location.origin;
    }

    appendIframe() {
        this._removeIframe();
        const iframe = document.createElement('iframe');
        iframe.setAttribute('id', 'studio');
        iframe.setAttribute('width', '100%');
        iframe.setAttribute('height', '100%');
        this._element.appendChild(iframe);
    }

    _removeIframe() {
        const iframes = this._element.getElementsByTagName('iframe');
        for (const iframe of iframes) {
            this._element.removeChild(iframe);
        }
    }
}

export default HelperElement;
