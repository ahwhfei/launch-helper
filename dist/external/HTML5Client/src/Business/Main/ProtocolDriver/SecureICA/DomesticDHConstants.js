/**
 * DomesticDHConstants.js
 * @author Goutham Peepala
 * @version @(#) $Id$
 *
 * @(#) DomesticDHConstants.js
 * Copyright © 2016 Citrix Systems, Inc.  All rights reserved.
 *
 * $History: $
 *
 */

/**
   Specifies values for strong crypto parameters.
   The presence of this file, determines whether the client is authorised to use strong crypto.
 */
function DomesticDHConstants(){
    this.getDefaultPrimeSize = function(encryptionLevel) {
        if (encryptionLevel == ProtocolConstants.kCRYPT_LEVEL_RC5_128)
            return 1024/8;
        return 512/8;
    };

    this.getMaximumPrimeSize = function(encryptionLevel) {
        if (encryptionLevel == ProtocolConstants.kCRYPT_LEVEL_RC5_128)
            return 2048/8;
        return 512/8;
    };


    this.getDefaultAuthEncryptKeyLen = function() {return 128/8;};
    this.getMaximumAuthEncryptKeyLen = function() {return 512/8;};

    this.getDefaultAuthDecryptKeyLen = function() {return 128/8;};
    this.getMaximumAuthDecryptKeyLen = function() {return 512/8;};

    this.getDefaultAuthEncryptRounds = function() {return 12;};
    this.getMaximumAuthEncryptRounds = function() {return 255;};

    this.getDefaultAuthDecryptRounds = function() {return 12;};
    this.getMaximumAuthDecryptRounds = function() {return 255;};


    this.getDefaultDataEncryptKeyLen = function() {return 128/8;};
    this.getMaximumDataEncryptKeyLen = function() {return 512/8;};

    this.getDefaultDataDecryptKeyLen = function() {return 128/8;};
    this.getMaximumDataDecryptKeyLen = function() {return 512/8;};

    this.getDefaultDataEncryptRounds = function() {return 12;};
    this.getMaximumDataEncryptRounds = function() {return 255;};

    this.getDefaultDataDecryptRounds = function() {return 12;};
    this.getMaximumDataDecryptRounds = function() {return 255;};
}
