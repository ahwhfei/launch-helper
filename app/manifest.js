class Manifest {
    constructor() {
        window.manifest || (window.manifest = {});
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