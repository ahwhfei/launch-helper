import HelperElement from './helper-element.js';

class Manifest {
    constructor() {
        window.manifest || (window.manifest = {});

        const helperElement = new HelperElement();
        this.xenDesktopApi = helperElement.xenDesktopApi;
        this.staticResource = helperElement.staticResource || window.location.origin;
    }

    get manifest() {
        return window.manifest;
    }

    set xenDesktopApi(url) {
        window.manifest.xenDesktopApi || (window.manifest.xenDesktopApi = url);
    }

    set staticResource(url) {
        window.manifest.staticResource || (window.manifest.staticResource = url);
    }
}

export default Manifest;