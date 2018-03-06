class ScriptLoad {
    constructor(script, callback) {
        this._url = script;
        this._callback = callback;
    }

    loadScript() {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = this._url;
        script.onreadystatechange = this._callback;
        script.onload = this._callback;

        document.body.appendChild(script);
    }
}

export default ScriptLoad;
