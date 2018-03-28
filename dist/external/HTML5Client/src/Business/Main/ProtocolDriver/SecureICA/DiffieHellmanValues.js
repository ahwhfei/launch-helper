/**
 * DiffieHellmanValues.js
 * @author Goutham Peepala
 * @version @(#) $Id$
 *
 * @(#) DiffieHellmanValues.js
 * Copyright � 2016 Citrix Systems, Inc.  All rights reserved.
 *
 * $History: $
 *
 */

//package com.citrix.client.module.pd.encrypt.SecureICA;


//import com.citrix.client.Debug;


/*

  SessionKey contents
  -------------------

  Authentication Key for HostWrite    f_AuthDecryptKey
  Authentication Key for HostRead     f_AuthEncryptKey
  DataTransfer Key for   HostWrite    f_DataDecryptKey
  DataTransfer Key for   HostRead     f_DataEncryptKey
  Secret                              f_Secret
  IV                     HostWrite    f_AuthInitVectorDecrypt
  IV                     HostRead     f_AuthInitVectorEncrypt
  ResetIV                HostWrite    f_ResetInitVectorDecrypt
  ResetIV                HostRead     f_ResetInitVectorEncrypt

  _SrvModeChangeBuf struct
  ------------------------

  InitVectorHostWrite                 f_DataInitVectorDecrypt
  InitVectorHostRead                  f_DataInitVectorEncrypt

 */


/**
   Provides accessor methods for keys and IVs, plus miscellaneous other crypto parameters.
 */
function DiffieHellmanValues() {
    var f_Mode; // Authentication (128-bit) or Data (128/56/40/0-bit) mode.

    var f_DiffieHellmanRC5Parameters;//= new DiffieHellmanRC5Parameters();
    var f_AuthEncryptKey;
    var f_AuthDecryptKey;
    var f_DataEncryptKey = null;
    var f_DataDecryptKey = null;

    var f_Secret;

    var f_AuthInitVectorEncrypt = new Uint8Array(ProtocolConstants.kCryptoIVLen);
    var f_AuthInitVectorDecrypt = new Uint8Array(ProtocolConstants.kCryptoIVLen);
    var f_ResetInitVectorEncrypt = new Uint8Array(ProtocolConstants.kCryptoIVLen);
    var f_ResetInitVectorDecrypt = new Uint8Array(ProtocolConstants.kCryptoIVLen);

    var f_DataInitVectorEncrypt = new Uint8Array(ProtocolConstants.kCryptoIVLen);
    var f_DataInitVectorDecrypt = new Uint8Array(ProtocolConstants.kCryptoIVLen);

    var isDisconnected = false;


    /**
       Extract keys and IVs from sharedSecret.
     */
    this.init = function(sharedSecret, params) {

        //*/ Debug.trace("DiffieHellmanValues ctr, sharedSecret #bytes:" + sharedSecret.length);
        f_DiffieHellmanRC5Parameters = params;
        f_Mode = ProtocolConstants.kCRYPT_AUTH;

        var offset = 0;
        var encryptionLevel = f_DiffieHellmanRC5Parameters.getEncryptionLevel();

        f_AuthDecryptKey = new Uint8Array(ProtocolConstants.k128);
        Utility.CopyArray(sharedSecret, offset, f_AuthDecryptKey, 0, ProtocolConstants.k128);
        offset += ProtocolConstants.k128;

        f_AuthEncryptKey = new Uint8Array(ProtocolConstants.k128);
        Utility.CopyArray(sharedSecret, offset, f_AuthEncryptKey, 0, ProtocolConstants.k128);
        offset += ProtocolConstants.k128;

        var nBytes = keyByteLen(encryptionLevel);
        if (nBytes > 0) {
            f_DataDecryptKey = new Uint8Array(nBytes);
            Utility.CopyArray(sharedSecret, offset, f_DataDecryptKey, 0, nBytes);
            offset += nBytes;

            f_DataEncryptKey = new Uint8Array(nBytes);
            Utility.CopyArray(sharedSecret, offset, f_DataEncryptKey, 0, nBytes);
            offset += nBytes;
        }

        f_Secret = new Uint8Array(ProtocolConstants.kSecretLen);
        Utility.CopyArray(sharedSecret, offset, f_Secret, 0, ProtocolConstants.kSecretLen);
        offset += ProtocolConstants.kSecretLen;

        doAuthInitVectors(encryptionLevel, sharedSecret, offset);

        //displayBytes();
    };


    function isEnough(source, offset, amount) {
        return (source.length >= (offset + amount));
    }

    function arrayCopy(sourcePrimary, offset, sourceAlternative,
                                  dest, amount) {
        if (isEnough(sourcePrimary, offset, amount)) {
            Utility.CopyArray(sourcePrimary, offset, dest, 0, amount);
        } else {
            Utility.CopyArray(sourceAlternative, 0, dest, 0, amount);
        }
    }

    /**
     * The assignment of bytes from the shared secret to the IVs is as follows:
     *   AuthDecrypt      <- first chunk
     *   AuthEncrypt      <- next chunk, or as for AuthDecrypt
     *   ResetAuthDecrypt <- next chunk, or as for AuthDecrypt
     *   ResetAuthEncrypt <- next chunk, or as for AuthEncrypt
     */
    function doAuthInitVectors(encryptionLevel, sharedSecret, offset) {
        var ivs =         [
            f_AuthInitVectorEncrypt,
            f_ResetInitVectorDecrypt,
            f_ResetInitVectorEncrypt];
        var fallbackIVs = [
            f_AuthInitVectorDecrypt,
            f_AuthInitVectorDecrypt,
            f_AuthInitVectorEncrypt];

        var copyFrom = offset;
        Utility.CopyArray(sharedSecret, copyFrom,
                         f_AuthInitVectorDecrypt, 0, ProtocolConstants.kCryptoIVLen);
        copyFrom += ProtocolConstants.kCryptoIVLen;

        for (var i=0; i< ivs.length; i++) {
            arrayCopy(sharedSecret, copyFrom,
                      fallbackIVs[i],
                      ivs[i], ProtocolConstants.kCryptoIVLen);
            copyFrom += ProtocolConstants.kCryptoIVLen;
        }
    }


//      void displayBytes() {
//      SecureICAProtocolDriver.displayBytes("AuthEncryptKey", f_AuthEncryptKey);
//      SecureICAProtocolDriver.displayBytes("AuthInitVectorEncrypt", f_AuthInitVectorEncrypt);
//      SecureICAProtocolDriver.displayBytes("ResetInitVectorEncrypt", f_ResetInitVectorEncrypt);
//      SecureICAProtocolDriver.displayBytes("AuthDecryptKey", f_AuthDecryptKey);
//      SecureICAProtocolDriver.displayBytes("AuthInitVectorDecrypt", f_AuthInitVectorDecrypt);
//      SecureICAProtocolDriver.displayBytes("ResetInitVectorDecrypt", f_ResetInitVectorDecrypt);

//      if (f_DataEncryptKey != null)
//          SecureICAProtocolDriver.displayBytes("DataEncryptKey", f_DataEncryptKey);
//      if (f_DataInitVectorEncrypt != null)
//          SecureICAProtocolDriver.displayBytes("DataInitVectorEncrypt", f_DataInitVectorEncrypt);
//      if (f_DataDecryptKey != null)
//          SecureICAProtocolDriver.displayBytes("DataDecryptKey", f_DataDecryptKey);
//      if (f_DataInitVectorDecrypt != null)
//          SecureICAProtocolDriver.displayBytes("DataInitVectorDecrypt", f_DataInitVectorDecrypt);
//      }


    function keyByteLen( encryptionLevel) {
        var retVal = 0;
        switch (encryptionLevel)
            {
            case ProtocolConstants.kCRYPT_LEVEL_RC5_128:
                retVal = ProtocolConstants.k128;
                break;
            case ProtocolConstants.kCRYPT_LEVEL_RC5_0:
                retVal = ProtocolConstants.k0;
                break;
            default:
                break;
            }

        return retVal;
    }

    /**
       Accessor methods for various keys and IVs.
       Returns key/IV appropriate to current mode.
     */

    this.getMode = function() {return f_Mode;};

    this.setMode = function (mode) {
        // System.out.println("CHANGING CRYPTO MODE (0x4=Auth 0x5=Data): " + mode);
        console.log("CHANGING CRYPTO MODE (0x4=Auth 0x5=Data): " + mode);
        f_Mode = mode;
    };

    /**
     * This is 'correct' - but doesn't work for 128-0 bit case to server!!
     * Seem to be able to do 128-bit login without a key ie ok if return null here!!!
     */
    this.getEncryptKey = function() {
        return (f_Mode == ProtocolConstants.kCRYPT_AUTH) ?
            f_AuthEncryptKey : f_DataEncryptKey;
    };

    this.getInitVectorEncrypt = function() {
        var retVal = null;

        if (isDisconnected)
            retVal = f_ResetInitVectorEncrypt;
        else {
            retVal = (f_Mode == ProtocolConstants.kCRYPT_AUTH) ?
                f_AuthInitVectorEncrypt :
                f_DataInitVectorEncrypt;
        }

        return retVal;
    };

    this.setInitVectorEncrypt = function(iv) {
        var copy = new Uint8Array(iv.length);
        Utility.CopyArray(iv, 0, copy, 0, iv.length);

        if (f_Mode == ProtocolConstants.kCRYPT_AUTH)
            f_AuthInitVectorEncrypt = copy;
        else
            f_DataInitVectorEncrypt = copy;
    };


    this.getDecryptKey = function() {
        return (f_Mode == ProtocolConstants.kCRYPT_AUTH) ?
            f_AuthDecryptKey : f_DataDecryptKey;
    };

    this.getInitVectorDecrypt = function() {
        var retVal = null;

        if (isDisconnected)
            retVal = f_ResetInitVectorDecrypt;
        else {
            retVal = (f_Mode == ProtocolConstants.kCRYPT_AUTH) ?
                f_AuthInitVectorDecrypt :
                f_DataInitVectorDecrypt;
        }

        return retVal;
    };

    this.setInitVectorDecrypt = function(iv) {
        var copy = new Uint8Array(iv.length);
        Utility.CopyArray(iv, 0, copy, 0, iv.length);

        if (f_Mode == ProtocolConstants.kCRYPT_AUTH)
            f_AuthInitVectorDecrypt = copy;
        else
            f_DataInitVectorDecrypt = copy;
    };


    this.getEncryptRounds = function() {
        return (f_Mode == ProtocolConstants.kCRYPT_AUTH) ?
            f_DiffieHellmanRC5Parameters.getAuthEncryptRounds() :
            f_DiffieHellmanRC5Parameters.getDataEncryptRounds();
    };

    this.getDecryptRounds = function() {
        return (f_Mode == ProtocolConstants.kCRYPT_AUTH) ?
            f_DiffieHellmanRC5Parameters.getAuthDecryptRounds() :
            f_DiffieHellmanRC5Parameters.getDataDecryptRounds();
    };


    this.getSecret = function() {return f_Secret;};

    this.setDisconnected = function() {
        isDisconnected = true;
    };

}
