/**
 * ProtocolConstants.java
 * @author David Franklin
 * @version @(#) $Id$
 *
 * @(#) ProtocolConstants.java
 * Copyright © 1999 Citrix Systems, Inc.  All rights reserved.
 *
 * $History: $
 *
 */

/**
   Protocol constants as defined in the specification.
 */
function ProtocolConstants() {};
    ProtocolConstants.kCRYPT_NOT_ENCRYPTED = 0x00;
    ProtocolConstants.kCRYPT_ENCRYPTED     = 0x01;
    ProtocolConstants.kCRYPT_PUBLICKEY     = 0x02;
    ProtocolConstants.kCRYPT_SESSIONKEY    = 0x03;
    ProtocolConstants.kCRYPT_AUTH          = 0x04;
    ProtocolConstants.kCRYPT_DATA          = 0x05;

    ProtocolConstants.k128 = 128/8;
    ProtocolConstants.k0 = 0;

    ProtocolConstants.kCryptoIVLen = 8;
    ProtocolConstants.kSecretLen = 8;

    // Confusingly, these are decimal rather than hex:
    ProtocolConstants.kCRYPT_LEVEL_BASIC   = 1;
    ProtocolConstants.kCRYPT_LEVEL_RC5_0   = 10;
    ProtocolConstants.kCRYPT_LEVEL_RC5_40  = 20;
    ProtocolConstants.kCRYPT_LEVEL_RC5_56  = 30;
    ProtocolConstants.kCRYPT_LEVEL_RC5_128 = 40;
