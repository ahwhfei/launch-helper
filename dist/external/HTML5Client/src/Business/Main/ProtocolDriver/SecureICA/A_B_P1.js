/**
 * A_B_P1.js
 * @author Goutham Peepala
 * @version @(#) $Id$
 *
 * @(#) A_B_P1.js
 * Copyright © 2016 Citrix Systems, Inc.  All rights reserved.
 *
 * $History: $
 *
 */



/**
   Extracts the A,B and prime values provided by the Secure ICA server via the
   CRYPT_PUBLICKEY message.
 */
function A_B_P1() {
    var f_AB = null; // BER representation of prime length and maximum exponent length
    var f_P1 = null; // server's public value

    this.init = function(_srvKeyBuf, offset, length) {
        writeHTML5Log(0,"SESSION:|:ICA:|:PD:|:Initializing the Secure Keys");
        var structOffset = 22;
        var runningOffset = offset + structOffset;
        var offsetPublicKey = ByteWriter.readUInt2(_srvKeyBuf, runningOffset);
        runningOffset += 2;
        var lengthPublicKey = ByteWriter.readUInt2(_srvKeyBuf, runningOffset);
        runningOffset += 2;
        var offsetDHparams = ByteWriter.readUInt2(_srvKeyBuf, runningOffset);
        runningOffset += 2;
        var lengthDHparams = ByteWriter.readUInt2(_srvKeyBuf, runningOffset);

        f_AB = new Uint8Array(lengthDHparams);
        Utility.CopyArray(_srvKeyBuf, offset + offsetDHparams, f_AB, 0, lengthDHparams);
        f_P1 = new Uint8Array(lengthPublicKey);
        Utility.CopyArray(_srvKeyBuf, offset + offsetPublicKey, f_P1, 0, lengthPublicKey);
    };

    this.getAB = function() {return f_AB;}
    this.getP1 = function() {return f_P1;}
}
