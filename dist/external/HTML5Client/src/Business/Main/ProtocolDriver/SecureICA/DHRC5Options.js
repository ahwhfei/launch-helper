// Copyright © 2016 Citrix Systems, Inc.  All rights reserved.
/*
package com.citrix.client.module.pd.encrypt.SecureICA;

import java.util.ResourceBundle;

import com.citrix.client.Constants;
import com.citrix.client.module.pd.encrypt.CryptoOptions;
*/

/**
   SecureICA implementation of the CryptoOptions interface.
 */
function DHRC5Options (){
    /**
       Returns an instance of DomesticDHConstants, ignoring encryptionLevel.
     */
    this.getConstants(encryptionLevel)
    {
        return new DomesticDHConstants();
    }

    /** This part is not used any where. #Clean
       Returns set of crypto options appropriate to available crypto strength.

    function getEncryptionStrings(bundle) {
        return new String[] {
            bundle.getString("ENCRYPTION_NONE"),
            bundle.getString("ENCRYPTION_BASIC"),
            bundle.getString("ENCRYPTION_RC5_128_LOGIN"),
            bundle.getString("ENCRYPTION_RC5_128")
        };
    }

    var ENCRYPTION_VALUES = [Constants.ENCRYPTION_LEVEL_NONE,
                            Constants.ENCRYPTION_LEVEL_BASIC,
                            Constants.ENCRYPTION_LEVEL_RC5_128_LOGIN,
                            Constants.ENCRYPTION_LEVEL_RC5_128];


       Returns set of crypto options appropriate to available crypto strength.

    function getEncryptionValues() {
        return ENCRYPTION_VALUES;
    }  */
}
