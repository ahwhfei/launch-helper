/**
 * DiffieHellmanRC5Parameters.js
 * @author Goutham Peepala
 * @version @(#) $Id$
 *
 * @(#) DiffieHellmanRC5Parameters.js
 * Copyright � 2016 Citrix Systems, Inc.  All rights reserved.
 *
 * $History: $
 *
 */

/**
   Holder for the data associated with the Diffie-Hellman and RC5 algorithms.
 */
function DiffieHellmanRC5Parameters(){

    var f_EncryptionLevel = 40;
    var f_Version = 1;
    var f_DHUniqueDHParameters = 0;

    var f_PrimeSize = 128;
    var f_AuthEncryptKeyLen = 16;
    var f_AuthDecryptKeyLen = 16;
    var f_AuthEncryptRounds = 12;
    var f_AuthDecryptRounds = 12;
    var f_DataEncryptKeyLen = 16;
    var f_DataDecryptKeyLen = 16;
    var f_DataEncryptRounds = 12;
    var f_DataDecryptRounds = 12;

    this.getPrimeSize = function() {return f_PrimeSize;};

    this.getAuthEncryptKeyLen= function(){return f_AuthEncryptKeyLen;};

    this.getAuthDecryptKeyLen= function() {return f_AuthDecryptKeyLen;};

    this.getAuthEncryptRounds= function(){return f_AuthEncryptRounds;};

    this.getAuthDecryptRounds= function() {return f_AuthDecryptRounds;};

    this.getDataEncryptKeyLen= function(){return f_DataEncryptKeyLen;};

    this.getDataDecryptKeyLen= function(){return f_DataDecryptKeyLen;};

    this.getDataEncryptRounds= function() {return f_DataEncryptRounds;};

    this.getDataDecryptRounds= function() {return f_DataDecryptRounds;};

    /*
    this.toString = function() {
        return
            "\n\tEncryptionLevel: "      + f_EncryptionLevel      +
            "\n\tVersion: "              + f_Version              +
            "\n\tDHUniqueDHParameters: " + f_DHUniqueDHParameters +
            "\n\tPrimeSize: "            + f_PrimeSize            +
            "\n\tAuthEncryptKeyLen: "    + f_AuthEncryptKeyLen    +
            "\n\tAuthDecryptKeyLen: "    + f_AuthDecryptKeyLen    +
            "\n\tAuthEncryptRounds: "    + f_AuthEncryptRounds    +
            "\n\tAuthDecryptRounds: "    + f_AuthDecryptRounds    +
            "\n\tDataEncryptKeyLen: "    + f_DataEncryptKeyLen    +
            "\n\tDataDecryptKeyLen: "    + f_DataDecryptKeyLen    +
            "\n\tDataEncryptRounds: "    + f_DataEncryptRounds    +
            "\n\tDataDecryptRounds: "    + f_DataDecryptRounds;
    };*/
    /**
       Extract parameters from _SrvKeyBuf struct.
     */
    this.init = function(_srvKeyBuf, offset, len) {
        readParameters(_srvKeyBuf, offset, len);
    };

    /**
       Extract parameters from profile.
    */
    this.initByProfile = function(profile){
        var encryptionLevel = SecureConfiguration.getEncryptionLevel(profile);
    };

    /**
       Compare two sets of parameters (typically, client-requested and server-offered).
     */
    this.weakerThan = function(other) {
        if (other.f_PrimeSize > f_PrimeSize) return true;
        if (other.f_AuthEncryptKeyLen > f_AuthEncryptKeyLen) return true;
        if (other.f_AuthDecryptKeyLen > f_AuthDecryptKeyLen) return true;
        if (other.f_AuthEncryptRounds > f_AuthEncryptRounds) return true;
        if (other.f_AuthDecryptRounds > f_AuthDecryptRounds) return true;
        if (other.f_DataEncryptKeyLen > f_DataEncryptKeyLen) return true;
        if (other.f_DataDecryptKeyLen > f_DataDecryptKeyLen) return true;
        if (other.f_DataEncryptRounds > f_DataEncryptRounds) return true;
        if (other.f_DataDecryptRounds > f_DataDecryptRounds) return true;

        return false;
    }


    this.getEncryptionLevel = function() {return f_EncryptionLevel;}

    /**
       Returns a set of DH constants appropriate to either strong crypto or weak crypto,
       depending on the crypto strength that the client is entitled to have access to.
    */
    function getCryptoConstantsencryptionLevel() {
        var options = new DHRC5Options();
        return options.getConstants(encryptionLevel);
    }

    function getDataKeyLen()
    {
        switch (f_EncryptionLevel) {
            case ProtocolConstants.kCRYPT_LEVEL_RC5_0:
                return ProtocolConstants.k0;
            case ProtocolConstants.kCRYPT_LEVEL_RC5_128:
                return ProtocolConstants.k128;
            default:
                throw new IllegalArgumentException("Bad encryption level in getDataKeyLen:" + f_EncryptionLevel);
        }
    }

    function translate(encryptionLevel) {
        // 40 and 56 bit crypto are deprecated so we now upgrade them to 128
        // bit crypto
        switch (encryptionLevel) {
        case Constants.ENCRYPTION_LEVEL_RC5_128_LOGIN:
            return ProtocolConstants.kCRYPT_LEVEL_RC5_0;
        case Constants.ENCRYPTION_LEVEL_RC5_40:
        case Constants.ENCRYPTION_LEVEL_RC5_56:
        case Constants.ENCRYPTION_LEVEL_RC5_128:
            return ProtocolConstants.kCRYPT_LEVEL_RC5_128;

        // Illegal values:
        case Constants.ENCRYPTION_LEVEL_NONE:
        case Constants.ENCRYPTION_LEVEL_BASIC:
        // Fallthrough
        default:
            //throw new IllegalArgumentException("Bad encryption level in translate:" + encryptionLevel);
            console.error("DH RC5 Param : Bad encryption level in translate:" + encryptionLevel);
        }
    }

    function readParameters(_srvKeyBuf, offset, len) {
        //console.log("DiffieHellmanRC5Parameters : Initiated Read parameters");
        f_Version               = ByteWriter.readUInt2(_srvKeyBuf, offset) & 0xFF; offset += 2;
        //console.log("Version : ", f_Version);
        f_DHUniqueDHParameters  = ByteWriter.readUInt2(_srvKeyBuf, offset) & 0xFF; offset += 2;
        //console.log("Unique Parameters : ", f_DHUniqueDHParameters);
        f_PrimeSize             = ByteWriter.readUInt2(_srvKeyBuf, offset); offset += 2;
        //console.log("Version : ", f_PrimeSize);
        f_AuthEncryptKeyLen     = ByteWriter.readUInt2(_srvKeyBuf, offset); offset += 2;
        //console.log("Auth Encryption Key Len : ", f_AuthEncryptKeyLen);
        f_AuthDecryptKeyLen     = ByteWriter.readUInt2(_srvKeyBuf, offset); offset += 2;
        //console.log("Auth Decryption Key Len : ", f_AuthDecryptKeyLen);
        f_DataEncryptKeyLen     = ByteWriter.readUInt2(_srvKeyBuf, offset); offset += 2;
        //console.log("Data Encryption Key Len : ", f_DataEncryptKeyLen);
        f_DataDecryptKeyLen     = ByteWriter.readUInt2(_srvKeyBuf, offset); offset += 2;
        //console.log("Data Decryption Key Len : ", f_DataDecryptKeyLen);
        f_AuthEncryptRounds     = ByteWriter.readUInt2(_srvKeyBuf, offset); offset += 2;
        //console.log("Auth Encrypt Rounds : ", f_AuthEncryptRounds);
        f_AuthDecryptRounds     = ByteWriter.readUInt2(_srvKeyBuf, offset); offset += 2;
        //console.log("Auth Decrypt Rounds : ", f_AuthDecryptRounds);
        f_DataEncryptRounds     = ByteWriter.readUInt2(_srvKeyBuf, offset); offset += 2;
        //console.log("Data Encrypt Rounds : ", f_DataEncryptRounds);
        f_DataDecryptRounds     = ByteWriter.readUInt2(_srvKeyBuf, offset); offset += 2;
        //console.log("data Decrypt Rounds : ", f_DataDecryptRounds);
        //console.log("DiffieHellmanRC5Parameters : Completed Read parameters");
    }

    /**
       Little-Endian output of a PDCRYPT2 struct.
    */
    this.write = function(stream) {
        stream.WriteByte(f_EncryptionLevel);
        stream.WriteByte(f_Version);
        stream.WriteByte(0);
        stream.WriteByte(f_DHUniqueDHParameters);
        ByteWriter.WriteInt16ToStream(stream, f_PrimeSize);
        ByteWriter.WriteInt16ToStream(stream, f_AuthDecryptKeyLen);
        ByteWriter.WriteInt16ToStream(stream, f_AuthDecryptRounds);
        ByteWriter.WriteInt16ToStream(stream, f_AuthEncryptKeyLen);
        ByteWriter.WriteInt16ToStream(stream, f_AuthEncryptRounds);
        ByteWriter.WriteInt16ToStream(stream, f_DataDecryptKeyLen);
        ByteWriter.WriteInt16ToStream(stream, f_DataDecryptRounds);
        ByteWriter.WriteInt16ToStream(stream, f_DataEncryptKeyLen);
        ByteWriter.WriteInt16ToStream(stream, f_DataEncryptRounds);
        /*
        stream.write(new Uint8Array(f_EncryptionLevel) );
        stream.write(new Uint8Array(f_Version));
        stream.write(new Uint8Array(0));
        stream.write(new Uint8Array(f_DHUniqueDHParameters));

        // Not very OO, but this is how it is for now:
        ByteWriter.WriteInt32ToStream(stream, f_PrimeSize);

        ByteWriter.WriteInt32ToStream(stream, f_AuthDecryptKeyLen);
        ByteWriter.WriteInt32ToStream(stream, f_AuthDecryptRounds);
        ByteWriter.WriteInt32ToStream(stream, f_AuthEncryptKeyLen);
        ByteWriter.WriteInt32ToStream(stream, f_AuthEncryptRounds);

        ByteWriter.WriteInt32ToStream(stream, f_DataDecryptKeyLen);
        ByteWriter.WriteInt32ToStream(stream, f_DataDecryptRounds);en
        ByteWriter.WriteInt32ToStream(stream, f_DataEncryptKeyLen);
        ByteWriter.WriteInt32ToStream(stream, f_DataEncryptRounds);
        */
    };

    //console.log("DH RC5 Param : Initializing DH RC5 Parameters function");
}
