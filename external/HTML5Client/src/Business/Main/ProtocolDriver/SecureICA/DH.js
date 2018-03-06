/**
 * DH
 * @author Goutham Peepala
 *
 * @(#) DH.js
 * Copyright � 2016 Citrix Systems, Inc.  All rights reserved.
 * Citrix confidential.
 *
 */

/**
 * Encapsulates the Diffie-Hellman shuffle.
 */
function DH (icaNaClInst, peerAB, peerPublicValue){
    var peerPublicValue = peerPublicValue;
   
    this.getPublicKey = function() {
        var msg = icaNaClInst.postMessageAndAwaitResponse({'Module' :"DH", 'cmd':"init", 'param' :peerAB.buffer});
        return new Uint8Array(msg["dBuffer"]);
    }
    
    /**
     * Calculates and returns the shared secret, from which the keys and initialisation vectors are derived.
     * Must not be invoked until generatePublicValue has been invoked.
     */
    this.calculateSharedSecret =function() {
        var msg = icaNaClInst.postMessageAndAwaitResponse({'Module' :"DH", 'cmd':"SharedKey", 'param' :peerPublicValue.buffer});
        return new Uint8Array(msg["dBuffer"]);
    }
}
