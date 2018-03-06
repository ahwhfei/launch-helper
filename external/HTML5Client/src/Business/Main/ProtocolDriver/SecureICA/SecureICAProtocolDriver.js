/**
 * SecureICAProtocolDriver.java
 * @author David Franklin
 * @version @(#) $Id$
 *
 * @(#) SecureICAProtocolDriver.js
 * Copyright � 2016 Citrix Systems, Inc.  All rights reserved.
 *
 * $History: $
 *
 */


/**
 * Protocol Driver for Secure ICA
 * (Diffie-Hellman key exchange plus RC5 crypto)
 *
 * The protocol is documented in:
 * <cite>
 *     RC5 Encryption Protocol Driver, ICA 3.0, Addendum
 *     Revision 1.0, 9th September 1997
 * </cite>
 */
function SecureICAProtocolDriver (encryption) {
    var version = 1;
    var offsetPublicValue = 6;
    var MODULE_PARAMETER = new ProtocolDriverParameter("SecureICA", 1, 1, "PDCRYPT2", ProtocolDriver.PD_ENCRYPT);
    var DEFAULT_ENABLED  = false;
    var f_DiffieHellmanValues = new DiffieHellmanValues();
    var f_A_B_P1 = new A_B_P1();
    // var f_RNG; Will not be used as NaCl will do the Random Number seeding from OpenSSl
    // Both DH and RC5 are to be implemented in Native Client. #Clean
    var f_DH;
    var f_RC5;
    var f_DataCanBeUnencrypted = true;

    // This would be the Interface to the Secure ICA Native Client Module. All messages should be posted using this.
    var SecureICANaClModule = null;
    //var pubKey, sharedSecret ;


    var pd = new ProtocolDriver(DEFAULT_ENABLED, MODULE_PARAMETER);
    initialize(encryption);
    // Not used anywhere, need to delete during Cleanup.    #Cleanf
    // var lock= new Object();
    // var numInvocations = 0;
    var pdDataConsumer;
    var WriteStream;
    this.EndWriting =function endWriting(reason)
    {
        pd.EndWriting(reason);
    };

    this.SetDataConsumer = function setDataConsumer(consumer)
    {
        pd.SetDataConsumer(consumer);
    };

    this.GetDataConsumer = function getDataConsumer()
    {
        return pd.GetDataConsumer();
    };

    this.SetWriteStream = function setWriteStream(stream)
    {
        pd.SetWriteStream(stream);
    };

    this.GetWriteStream = function getWriteStream()
    {
        return pd.GetWriteStream();
    };

    /**
     * Each packet from the server comprises a 1 byte header and zero or more bytes of data.
     */

    function handlePacket (data, offset, length) {
        var header = data[offset++];

        length--;

        switch (header) {
            case ProtocolConstants.kCRYPT_NOT_ENCRYPTED:
                //console.log("NotEncrypted packet");
                handleNotEncryptedPacket(data, offset, length);
                break;

            case ProtocolConstants.kCRYPT_ENCRYPTED:
                //console.log("Encrypted packet");
                handleEncryptedPacket(data, offset, length);
                break;

            case ProtocolConstants.kCRYPT_PUBLICKEY:
                //console.log("PublicKey packet");
                handlePublicKeyPacket(data, offset, length);
                break;

            case ProtocolConstants.kCRYPT_AUTH:
                //console.log("Auth packet");
                handleAuthPacket(data, offset, length);
                break;

            case ProtocolConstants.kCRYPT_DATA:
                //console.log("Data packet");
                handleDataPacket(data, offset, length);
                break;

            default:
                console.error("Unrecognised SecureICA header: " + header);
        }
    }


    function handleNotEncryptedPacket(data, offset, length)    {
        if (f_DataCanBeUnencrypted){
            pdDataConsumer.consumeData(data, offset, length);
        }
        else {
            console.error("!!! Expected cipher text; got plain text");
        }
    }

    function handleEncryptedPacket(data, offset, length)   {
        var paddedText = f_RC5.decrypt(data, offset, length);
        var plainText = removePadding(paddedText);
        pdDataConsumer.consumeData(plainText, 0, plainText.length);
    }

    /**
     * Check that the crypto offered by the server is at least as strong as that
     * requested by the client.
     * (Specified in the PACKET_INIT_RESPONSE message which contains a PDCRYPT2 struct)
     * Do the Diffie-Hellman handshake:
     * <ul>
     *  <li> Extract the AB and Public values sent by the server.
     *  <li> Generate the client's public key.
     *  <li> Send the client-generated public key to the server.
     *  <li> Calculate the shared secret.
     * </ul>
     * The connection between client and server is now secured via RC5.
     */
    function handlePublicKeyPacket(data, offset, length)   {
        writeHTML5Log(0,"SESSION:|:ICA:|:PD:|:Received Public Key");
        if (cryptoStrengthOK(data, offset, length)) {
            extractServerParameters(data, offset, length);
            if (SecureICANaClModule.sslReady) {
                generatePublicValue(SecureICANaClModule);
            } else {
                SecureICANaClModule.havePublicKey = true;
            }
        } else {
            writeHTML5Log(0,"SESSION:|:ICA:|:PD:|:Crypto offered is too weak");
            throw new Error("Detected weak ICA encryption");
        }
    }

    /**
     * Server instructs the client to use 'Authentication' IVs/Keys.
     * Refer to specifcation for details.
     */
    function handleAuthPacket(data, offset, length)   {
        changeMode(ProtocolConstants.kCRYPT_AUTH, data, offset, length);
    }

    /**
     * Server instructs the client to use 'Data' IVs/Keys.
     * Refer to specifcation for details.
     */
    function handleDataPacket(data, offset, length)   {
        changeMode(ProtocolConstants.kCRYPT_DATA, data, offset, length);
    }


    function changeMode(mode, data, offset, length){
        console.log(">> changeMode " + mode);
        if (aberrantBehaviourInCaseOfZeroBitKeys()) {
            f_DiffieHellmanValues.setMode(mode);
            f_RC5.initialize(f_DiffieHellmanValues);
        }

        var plainText = f_RC5.decrypt(data, offset, length);
        processSrvModeChangeBuf(mode, plainText);
        console.log("<< changeMode " + mode);
    }

    /**
     * When going from 128 bit authentication to 0 bit data,
     * the CRYPT_DATA message, although tagged as encrypted, is sent in clear.
     * In all other cases the CRYPT_DATA message is sent encrypted with the
     * authentication parameters.
     */
    function aberrantBehaviourInCaseOfZeroBitKeys() {
        var aberr = (f_RequestedCrypto.getEncryptionLevel() == ProtocolConstants.kCRYPT_LEVEL_RC5_0);
        console.log("aberrantBehaviourInCaseOfZeroBitKeys : " + aberr);
        return aberr;
    }

    /**
     * The CRYPT_DATA and CRYPT_AUTH messages wrap the _SrvModeChangeBuf struct.
     * These messages are processed as follows:
     * <ul>
     *  <li> Extracts the parameters embedded within the struct.
     *  <li> Check the validity of the message.
     *  <li> Acknowledge receipt of the command.
     *  <li> Change to the specified mode.
     * </ul>
     */
    function processSrvModeChangeBuf(mode, srvModeChangeBuf){
        //*/displayBytes("CRYPT_DATA Packet (decrypted):", srvModeChangeBuf);

        checkMode(mode);

        // Extract information from the message:
        var hostWriteIV = new Uint8Array[ProtocolConstants.kCryptoIVLen];
        var hostReadIV = new Uint8Array[ProtocolConstants.kCryptoIVLen];
        var random = new Uint8Array[ProtocolConstants.kCryptoIVLen];
        var xorSecret = new Uint8Array[ProtocolConstants.kCryptoIVLen];

        var offset = 1;
        Utility.CopyArray(srvModeChangeBuf, offset, hostWriteIV, 0,
                ProtocolConstants.kCryptoIVLen);
        offset += ProtocolConstants.kCryptoIVLen;
        Utility.CopyArray(srvModeChangeBuf, offset, hostReadIV, 0,
                ProtocolConstants.kCryptoIVLen);
        offset += ProtocolConstants.kCryptoIVLen;
        Utility.CopyArray(srvModeChangeBuf, offset, random, 0,
                ProtocolConstants.kCryptoIVLen);
        offset += ProtocolConstants.kCryptoIVLen;
        Utility.CopyArray(srvModeChangeBuf, offset, xorSecret, 0,
                ProtocolConstants.kCryptoIVLen);

        // Iff it is a legitimate command,
        // acknowledge receipt, then switch to the specified mode:
        var validCommand = checkCommand(random, f_DiffieHellmanValues.getSecret(), xorSecret);
        if (validCommand) {
            sendAcknowledgement(mode);
            toggleKeysAndIVs(mode, hostReadIV, hostWriteIV);
        } else {
            console.log("!!! Not a valid mode command");
        }
    }

    function checkMode(mode){
        if ((mode != ProtocolConstants.kCRYPT_AUTH) &&
                (mode != ProtocolConstants.kCRYPT_DATA)) {
            console.log("!!! Bad mode:" + mode);
        }
    }

    /**
     * Command is valid iff:
     * A xor B = expected_AxorB
     */
    function checkCommand(A, B, expected_AxorB) {
        var expectedLen = expected_AxorB.length;

        if (A.length != expectedLen || B.length != expectedLen)
            return false;

        for (var i = 0;  i < expectedLen;  i++) {
            if ((A[i] ^ B[i]) != expected_AxorB[i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Simply send the new mode back to the server.
     * (No crypto is involved as there is no associated data)
     */
    function sendAcknowledgement(mode){

        console.log(">> sendAcknowledgement mode:" + mode);
        var ack = [mode];
        WriteStream.WriteByte(ack, 0, ack.length);
        console.log("<< sendAcknowledgement mode:" + mode);
    }

    /**
     * Switch to the specified mode and set the IVs accordingly.
     */
    function toggleKeysAndIVs(mode, hostReadIV, hostWriteIV){
        console.log(">> toggleKeysAndIVs mode:" + mode);
        f_DiffieHellmanValues.setMode(mode);
        f_DiffieHellmanValues.setInitVectorEncrypt(hostReadIV);
        f_DiffieHellmanValues.setInitVectorDecrypt(hostWriteIV);
        f_RC5.initialize(f_DiffieHellmanValues);
        console.log("<< toggleKeysAndIVs mode:" + mode);
    }

    /**
     * Ensure that we got what we asked for - if not, the connection should be aborted.
     */
    function cryptoStrengthOK(_srvKeyBuf, offset, length) {
        //console.log("Checking if Crypto Strenght is Ok");
        var offeredCrypto = new DiffieHellmanRC5Parameters();
        offeredCrypto.init(_srvKeyBuf, offset, length);
        //console.log("Server crypto: ", offeredCrypto);
        //console.log("Client crypto: ", f_RequestedCrypto);

        return !offeredCrypto.weakerThan(f_RequestedCrypto);
    }

    /**
     * Extract the A,B,P parameters sent by the server.
     */
    function extractServerParameters(_srvKeyBuf, offset, length) {
        writeHTML5Log(0,"SESSION:|:ICA:|:PD:|:Extracting Server Parameters");
        f_A_B_P1 = new A_B_P1();
        f_A_B_P1.init(_srvKeyBuf, offset, length)
    }

    /**
     * Send the CRYPT_SESSIONKEY message to the server
     * (in response to the CRYPT_PUBLICKEY message frosm the server).
     */
    function generatePublicValue(icaNaCL) {
        var ab = f_A_B_P1.getAB();
        var peerPublicValue = f_A_B_P1.getP1();
        
        f_DH = new DH(icaNaCL, ab, peerPublicValue);
        var pubkey = f_DH.getPublicKey();
        sendPublicValue(pubkey);
    }

    function sendPublicValue(publicValue){
        var header = ProtocolConstants.kCRYPT_SESSIONKEY;
        var pvLength = publicValue.length;
        var size = 7 + pvLength;
        var offset = 0;
        var buffer = new Uint8Array(size);
        buffer[offset++] = header;
        offset = Utility.WriteInt2(buffer, offset, version);
        offset = Utility.WriteInt2(buffer, offset, offsetPublicValue);
        offset = Utility.WriteInt2(buffer, offset, pvLength);
        Utility.CopyArray(publicValue, 0, buffer, offset, pvLength);
        WriteStream.WriteByte(buffer, 0, size);
        setUpCrypto();
    }

    /**
     * Calculate the shared secret - hereon, all client-server interaction is 'secure'.
     */
    function setUpCrypto(){
        var sharedSecret = f_DH.calculateSharedSecret();
        f_DiffieHellmanValues = new DiffieHellmanValues();
        f_DiffieHellmanValues.init(sharedSecret, f_RequestedCrypto);
        f_RC5 = new RC5(f_DiffieHellmanValues, SecureICANaClModule);
        //f_RC5.init();
        f_DataCanBeUnencrypted = false;
        f_EncryptOn = true;
    }


    //--------------------------------------------------
    // ProtocolDriver interface:


    function reset() {
        console.log("### reset - DISCONNECTED SESSION ###");

        f_DiffieHellmanValues.setDisconnected();
        f_DataCanBeUnencrypted = true;
        f_RC5.initialize(f_DiffieHellmanValues);
       
    }

    /**
     * Specify the crypto requirements in the PACKET_INIT_RESPONSE message.
     */
    function addInitResponseData(stream) {
        console.log(">> SecureICAProtocolDriver.addInitResponseData ", stream);
        f_RequestedCrypto.write(stream);
        console.log("<< SecureICAProtocolDriver.addInitResponseData");
    }

    var f_RequestedCrypto;

    function initialize(profile){
        f_RequestedCrypto = new DiffieHellmanRC5Parameters();
        f_RequestedCrypto.initByProfile(profile);
        
        initSecureICANaCl();
    }


    function initSecureICANaCl(){
        // Create a new Div for SecureICA under citrix UI Element.
        var ModListener = document.createElement('div');
        document.getElementById('citrixuiElement').appendChild(ModListener);
        // Initialize the div element
        ModListener.id = 'SecureICA';
        ModListener.addEventListener('load', onModLoad, false);
        ModListener.addEventListener('error', onModLoadError, false);
        ModListener.addEventListener('crash', handleModuleCrash, false);
        SecureICANaClModule = loadNaClModule(ModListener);
        ModListener.addEventListener('message', handleModuleMessage, true);
    }

    function onModLoad() {
        console.log('SecureICA Module loaded');
    }
    
    function onModLoadError(e) {
        console.error('SecureICA Module load error ', e);
    }
    
    function handleModuleCrash(e) {
        console.error('SecureICA Module crashed ', e);
    }
    
    function handleModuleMessage (msg) {
        if (msg.data == "sslready") {
            SecureICANaClModule.sslReady = true;
            if (SecureICANaClModule.havePublicKey) {
                generatePublicValue(SecureICANaClModule);
            }
        } else {
            console.error("Unhandled secure ica module message ", msg);
        }
    }
    
    function removePadding(paddedPlainText) {
        var paddedLength = paddedPlainText.length;
        var nPadBytes = paddedPlainText[paddedLength-1] & 0xFF;

        if ((nPadBytes > paddedLength) || (nPadBytes > 8)) {
            // Console Error This should not be hit. Exception.
            console.error("Incorrect Padding detected " + nPadBytes);
            return paddedPlainText;
        }

        var unpaddedPlainText = new Uint8Array(paddedLength - nPadBytes);
        Utility.CopyArray(paddedPlainText, 0, unpaddedPlainText, 0, paddedLength - nPadBytes);

        return unpaddedPlainText;
    }
  
    function loadNaClModule(listener){
        var embedEl = document.createElement('embed');
        embedEl.id = 'SecureICANaCl';
        embedEl.width = 10;
        embedEl.height = 10;
        embedEl.style.position = 'absolute';
        embedEl.style.top = 0 + 'px';
        embedEl.style.left = 0 + 'px';
        embedEl.style.backgroundColor = 'black';
        embedEl.src = '../NativeClient/secureica.nmf';
        embedEl.style.visibility = "hidden";
        embedEl.type = 'application/x-pnacl';
        embedEl.sslReady = false;
        listener.appendChild(embedEl);
        return embedEl;
    }

    //--------------------------------------------------
    // DataConsumer interface:

    var f_EncryptOn = false;

    this.consumeData = function (data, offset, length){
        pdDataConsumer = this.GetDataConsumer();
   
        if (pd.GetEnabled()) {
            //console.log("Handling Secure ICA Packet");
            handlePacket(data, offset, length);
        } else {
            //Debug.allege((pdDataConsumer != null), "Consumer is null");
            pdDataConsumer.consumeData(data, offset, length);
        }
    };

    this.writeInitResponse = function(stream){
        f_RequestedCrypto.write(stream);
    };

    this.SetEnabled = function setEnabled(value)
    {
        pd.SetEnabled(value);
    };
    //--------------------------------------------------
    // WriteStream interface:

    // DJF !!!
    this.WriteByte = function(data, offset, length){
        WriteStream = pd.GetWriteStream();
        if (!pd.GetEnabled()) {
            WriteStream.WriteByte(data, offset, length);
        } else {
            if (f_EncryptOn) {
                var encText = f_RC5.encrypt(data, offset, length, 1);
                encText[0] = ProtocolConstants.kCRYPT_ENCRYPTED;
                WriteStream.WriteByte(encText, 0, encText.length);
            } else {
                if (offset < 1) {
                    var output = new Uint8Array(length + 1);
                    Utility.CopyArray(data, offset, output, 1, length);
                    data = output;
                    offset = 1;
                }

                data[offset-1] = ProtocolConstants.kCRYPT_NOT_ENCRYPTED;
                offset--;
                length++;
                WriteStream.WriteByte(data, offset, length);
            }
        }
    };
}
