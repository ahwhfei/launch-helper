/**
 * @author Goutham Peepala
 *  *
 * @(#) SecureConfiguration.js
 * Copyright ? 2016 Citrix Systems, Inc.  All rights reserved.
 *
 * $History: $
 *
 */

function SecureConfiguration () {}

    // enforce static-ness:
    //private SecureConfiguration() {}

    // Names for dynamic loading via reflection
    //public static final String packagePrefix = "com.citrix.client.module.pd.encrypt.SecureICA.";
    SecureConfiguration.cryptoOptions = "DHRC5Options";

    // A component of the Crypto library:
    //private static final String cryptoComponent = "com.rsa.jsafe.JSAFE_SecureRandom";


    SecureConfiguration.getCryptoOptions = function() {
        // Attempt to find the SecureICA crypto options
        //try {
            return 0;// Return Secure ICA
       // }
       /* } catch (IllegalAccessException e) {
        } catch (InstantiationException e) {
        } catch (ClassFormatError e) {
            // Netscape 6 will throw this error from an HTTPS connection if the class
            // doesn't exist.
        }*/

        //return 1;// Return XOR Options new XOROptions();
        //*/Debug.trace("Secure ICA PD = XOR");
    };


//      public class EncryptionLevel {
//      private final int level;

//      private EncryptionLevel(int level) (this.level = level;}

//      public static final EncryptionLevel NONE = new EncryptionLevel(0);
//      public static final EncryptionLevel BASIC = new EncryptionLevel(1);
//      public static final EncryptionLevel RC5_128_LOGIN= new EncryptionLevel(2);
//      public static final EncryptionLevel RC5_40 = new EncryptionLevel(4);
//      public static final EncryptionLevel RC5_56 = new EncryptionLevel(8);
//      public static final EncryptionLevel RC5_128 = new EncryptionLevel(10);

//      private static final EncryptionLevel[] VALUES = {
//          NONE, BASIC, RC5_128_LOGIN, RC5_40, RC5_56, RC5_128};

//      EncryptionLevel getEncryptionLevel(int value) throws IllegalValueException {
//          EncryptionLevel level = NONE;
//          if (value == 0)
//              level = NONE;
//          else if (value == 1)
//              level = BASIC;
//          ... etc;
//          return level;
//      }
//      }

    /**
     * The way in which enums are handled (universally within the JICA
     * code) is perhaps too close to C enums, suffering from the same
     * type unsafe characteristics - hence CPR 200174.  The "typesafe
     * enum pattern" might be a better alternative, something along
     * the lines of EncryptionLevel above.
     *
     * But ... in the meantime, with the enum approach, we need to at
     * least ensure that the value is valid.
     */
    SecureConfiguration.getEncryptionLevel= function(profile) {
        var encryptionLevel = profile.split("-")[1];

        var retVal = Constants.ENCRYPTION_LEVEL_NONE;

        // As 40 and 56bit crypto are now deprecated we default to using the
        // next best crypto (128 bit in both cases)
        if (!encryptionLevel) {
            retVal = Constants.ENCRYPTION_LEVEL_NONE;
        }
        else if (encryptionLevel == null) {
            retVal = Constants.ENCRYPTION_LEVEL_BASIC;
        }
        else if (encryptionLevel == 0) {
            retVal = Constants.ENCRYPTION_LEVEL_RC5_128_LOGIN;
        }
        else if ( (encryptionLevel == 40) || (encryptionLevel == 56)|| (encryptionLevel == 128)) {
            retVal = Constants.ENCRYPTION_LEVEL_RC5_128;
        }
        return retVal;

    };


    /**
     * This is a poor way of enforcing a valid enum!
     * See comments in getEncryptionLevel method for an alternative approach.
     */
     SecureConfiguration.isValid = function(encryptionLevel) {
        // Although 40 and 56 bit modes are deprecated we still allow them
        // through, we will convert them into 128bit mode later on.
        return ((encryptionLevel == Constants.ENCRYPTION_LEVEL_NONE) ||
                (encryptionLevel == Constants.ENCRYPTION_LEVEL_BASIC) ||
                (encryptionLevel == Constants.ENCRYPTION_LEVEL_RC5_128_LOGIN) ||
                (encryptionLevel == Constants.ENCRYPTION_LEVEL_RC5_40) ||
                (encryptionLevel == Constants.ENCRYPTION_LEVEL_RC5_56) ||
                (encryptionLevel == Constants.ENCRYPTION_LEVEL_RC5_128));
    };

    SecureConfiguration.getEncryptionDriverClassName = function(profile) {
        var encryptionDriverClassName;

        var encryptionLevel = SecureConfiguration.getEncryptionLevel(profile);
        switch (encryptionLevel)
            {
            case Constants.ENCRYPTION_LEVEL_NONE:
                // Is this really as for BASIC ???
            case Constants.ENCRYPTION_LEVEL_BASIC:
                encryptionDriverClassName = "EncryptProtocolDriver";
                break;
            default:
                encryptionDriverClassName = "SecureICAProtocolDriver";
                break;
            }

        return encryptionDriverClassName;
    };

    /*function decodeEncryptionLevelSessionValue(encryptionLevel)
    {
        console.log("Encryption Level Availabel is : ", encryptionLevel);
        var retVal = Constants.ENCRYPTION_LEVEL_NONE;

        // As 40 and 56bit crypto are now deprecated we default to using the
        // next best crypto (128 bit in both cases)
        if (!encryptionLevel) {
            retVal = Constants.ENCRYPTION_LEVEL_NONE;
        }
        else if (encryptionLevel === null) {
            retVal = Constants.ENCRYPTION_LEVEL_BASIC;
        }
        else if (encryptionLevel === "0") {
            retVal = Constants.ENCRYPTION_LEVEL_RC5_128_LOGIN;
        }
        else if ( (encryptionLevel === "40") || (encryptionLevel === "56")|| (encryptionLevel === "128")) {
            retVal = Constants.ENCRYPTION_LEVEL_RC5_128;
        }

        return retVal;
    }*/
