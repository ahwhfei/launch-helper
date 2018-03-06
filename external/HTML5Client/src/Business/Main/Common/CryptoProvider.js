/* PdCryptoProvider protocol: Used ny Encrypt Protocol Driver */

function PdCryptoProvider() {
    //double bitwise NOT to floor the number
    this.Seed = (~ ~(Math.random() * 256)) & 0xFF;
    var gLrb = (this.Seed | 0x43) & 0xFF;
    var gLwb = (this.Seed | 0x43) & 0xFF;
	
	this.Reset = function(){
		gLrb = (this.Seed | 0x43) & 0xFF;
		gLwb = (this.Seed | 0x43) & 0xFF;
	};
    this.Encrypt = function pdEncrypt(byteData, offset, length) {
        var last_i = offset + length - 1;
        var dummy = gLwb ^ this.Seed;
        dummy &= 0xFF;

        byteData[offset] = byteData[offset] ^ dummy;
        byteData[offset] &= 0xFF;

        for (var i = offset + 1; i <= last_i; ++i) {
            dummy = byteData[i - 1] ^ this.Seed;
            dummy &= 0xFF;

            byteData[i] = byteData[i] ^ dummy;
            byteData[i] &= 0xFF;
        }
        gLwb = byteData[last_i];
    };

    this.Decrypt = function pdDecrypt(byteData, offset, length) {
        var last_i = offset + length - 1;
        var e_b = byteData[last_i];
        var seed = this.Seed;
        for (var i = last_i; i > offset; --i) {
            byteData[i] ^= (byteData[i - 1] ^ seed);

        }
        byteData[offset] ^= (gLrb ^ this.Seed);
        gLrb = e_b;
    };

}

function WdCryptoProvider() { }

WdCryptoProvider.LightEncrypt = function lightEncrypt(byteArray, seed) {
    if (byteArray === null) {
        return null;
    }
    byteArray[0] = byteArray[0] ^ (seed | 0x43);
    byteArray[0] &= 0xFF;

    var byteArrLength = byteArray.length;
    for (var i = 1; i < byteArrLength; ++i) {
        var dummy = byteArray[i - 1] ^ seed;
        dummy &= 0xFF;

        byteArray[i] = byteArray[i] ^ dummy;
        byteArray[i] &= 0xFF;
    }
};