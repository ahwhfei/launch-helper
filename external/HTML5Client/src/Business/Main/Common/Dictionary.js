/* 
This is a very basic Dictionary and does not 
worry about performance and other stuffs. 
*/
function Dictionary() {
    var k = new Array();
    var v = new Array();

    this.Add = function add(key, value) {
        if (k.indexOf(key) < 0) {
            k[value.length] = key;
            v[key.length - 1] = value;
            return 0;
        }
        else
            return DictionaryError.DUPLICATE_ELEMENT;
    };

    this.Value = function value(key) {
        var index = k.indexOf(key);
        if (index >= 0) {
            return v[index];
        }
        else
            return null;
    };
}
