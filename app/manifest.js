import HelperElement from './helper-element.js';

class Manifest {
    constructor() {
        window.manifest || (window.manifest = {});

        const helperElement = new HelperElement();
        this.xdApi = helperElement.xdApi;
        this.staticResource = helperElement.staticResource || window.location.origin;
    }

    get manifest() {
        return window.manifest;
    }

    set xdApi(url) {
        window.manifest.xdApi = url;
    }

    set staticResource(url) {
        window.manifest.staticResource || (window.manifest.staticResource = url);
    }
}

export default Manifest;