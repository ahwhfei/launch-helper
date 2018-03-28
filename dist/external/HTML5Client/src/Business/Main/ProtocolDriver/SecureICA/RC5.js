/**
 * RC5
 * @author Goutham Peepala
 *
 * @(#) RC5.js
 * Copyright � 2000 - 2001 Citrix Systems, Inc.  All rights reserved.
 * Citrix confidential.
 *
 */

/**
 * Encapsulation of the RC5 algorithm.
 */

function RC5(diffieHellmanValues, icaNaClInst) {
    var noEncrypt, noDecrypt;   // boolean Values
    initialize(diffieHellmanValues);
 
    this.initialize = function(dhValues){
        initialize(dhValues);
    };

    function initialize(values) {
        var cipherName = "EVP_rc5_32_12_16_cbc()";// = "RC5-0x10-32-" + values.getEncryptRounds() + "/CBC/NoPad";

        var key;
        var cipher = null;
        var rawKey = values.getEncryptKey();
        var IV = values.getInitVectorEncrypt();
        //console.log("RC5 : INITIALIZE : Value of Encryption Key is : ", rawKey);

        if (rawKey == null) {
            //console.log("RC5 : INITIALIZE : No Key present so Setting No Encrypt to true: ");
            noEncrypt = true;
        } else {
            //console.log("RC5 : INITIALIZE : IV Value for Encryption is : ", IV);
            icaNaClInst.postMessageAndAwaitResponse({'Module' :"RC5", 'cmd':"initEnc", 'EncryptKey' :rawKey.buffer, 'EncryptIV': IV.buffer});
        }

        rawKey = values.getDecryptKey();
        IV = values.getInitVectorDecrypt();
        
        //console.log("RC5 : INITIALIZE : Value of Decryption Key is : ", rawKey);
        if (rawKey == null) {
            // No key flags no decryption.
            //console.log("RC5 : INITIALIZE : No Key present so Setting No Decrypt to true: ");
            noDecrypt = true;
        } else {
            //console.log("RC5 : INITIALIZE : IV Value for Decryption is : ", IV);
            icaNaClInst.postMessageAndAwaitResponse({'Module' :"RC5", 'cmd':"initDec", 'DecryptKey' :rawKey.buffer, 'DecryptIV': IV.buffer});
        }
    }

    this.encrypt = function(plainText, offset, length, cipherTextOffset){
        length &= 0x3FFF;
        if (noEncrypt) {
            var retVal = new Uint8Array(length + cipherTextOffset);
            Utility.CopyArray(plainText, offset, retVal, cipherTextOffset, length);
            return retVal;
        }

        // We don't need to pad text as encryptor will do it for us
        var paddedPlainText = new Uint8Array(length);
        Utility.CopyArray(plainText, offset, paddedPlainText, 0, length);        
        var msg  = icaNaClInst.postMessageAndAwaitResponse({'Module' :"RC5", 'cmd':"encText", 'plainText' :paddedPlainText.buffer, 'offset': cipherTextOffset, 'length': length});
        return new Uint8Array(msg["dBuffer"]);
    };

    this.decrypt = function(cipherText, offset, length){        
        var retVal = new Uint8Array(length);
        Utility.CopyArray(cipherText, offset, retVal, 0, length);
        if (noDecrypt) {
            return retVal;
        }

        var msg = icaNaClInst.postMessageAndAwaitResponse({'Module' :"RC5", 'cmd':"decText", 'cipherText' :retVal.buffer, 'offset': offset, 'length': length});
        return new Uint8Array(msg["dBuffer"]);
    };

    return 0;
}
