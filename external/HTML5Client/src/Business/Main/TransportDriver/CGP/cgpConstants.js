function CGPConstants() {}
CGPConstants.CGP_HEADER     	= new Uint8Array([0x1a, 0x43, 0x47, 0x50, 0x2f, 0x30, 0x31]);

CGPConstants.DEFAULT_BUFFER_SIZE  		= 0x580; 
// The following define the command bytes for CGP protocol messages.  Every
// CGP message begins with a one-or-two byte message length followed by a
// command byte.  These are not bit flags - every CGP message contains only
// one command.
CGPConstants.CGP_BIND_REQUEST           = 0x01;
CGPConstants.CGP_BIND_RESPONSE          = 0x02;
CGPConstants.CGP_FINISH_REQUEST         = 0x03;
CGPConstants.CGP_FINISH_RESPONSE        = 0x04;
CGPConstants.CGP_NOP                    = 0x05;
CGPConstants.CGP_CHANNEL_OPEN_REQUEST   = 0x06;
CGPConstants.CGP_CHANNEL_OPEN_RESPONSE  = 0x07;
CGPConstants.CGP_CHANNEL_CLOSE          = 0x08;
CGPConstants.CGP_DATA                   = 0x09;
CGPConstants.CGP_DATA_REALTIME          = 0x0A;
CGPConstants.CGP_DATA_REALTIME_WITH_ACK = 0x0B;

// FAKE 'Command' to represent awaiting signature
CGPConstants.CGP_SIGNATURE_COMMAND      = -1;

// The following bit flags appear in the Message Flags field of the CGP_DATA
// message.  They can be or'd together.
CGPConstants.CGP_DATA_FLAG_PARTIAL           = 0x01;
CGPConstants.CGP_DATA_FLAG_PRIORITY_MEDIUM   = 0x02;
CGPConstants.CGP_DATA_FLAG_PRIORITY_REALTIME = 0x04;
CGPConstants.CGP_DATA_FLAG_PUSH_DATA         = 0x08;

// The following indexes of bit flags appear in the Header Flags field of a
// CGP message.  They indicate what header extensions the message carries.
// The flags that the reference can be or'd together for messages that carry
// multiple header extensions.
CGPConstants.CGP_HEADER_EXT_LENGTH__INDEX  = 0;
CGPConstants.CGP_HEADER_MONITORING__INDEX  = 1;
CGPConstants.CGP_HEADER_COMPRESSION__INDEX = 2;
CGPConstants.CGP_HEADER_RELIABILITY__INDEX = 3;

// The following Capability IDs belong to the Core CGP Protocol.  Core 
// Capabilities exchanged during the initial CGP handshake identify
// themselves using these IDs.  These IDs are not bit flags - each
// Capability block contains only a single Capability.
CGPConstants.CGP_CAPABILITY_SERVICES_BINDING    = 0x01;
CGPConstants.CGP_CAPABILITY_ENDPOINT_ADDRESS    = 0x02;
CGPConstants.CGP_CAPABILITY_CHANNEL_MONITORING  = 0x03;
CGPConstants.CGP_CAPABILITY_COMPRESSION         = 0x04;
CGPConstants.CGP_CAPABILITY_SESSION_RELIABILITY = 0x05;
CGPConstants.CGP_CAPABILITY_SECURITY_TICKET     = 0x06;
CGPConstants.CGP_CAPABILITY_KEEP_ALIVES         = 0x07;

CGPConstants.CGP_CAPABILITY_RELIABILITY_PARAMS	= 0x09;


//UI Flags
CGPConstants.CGP_RELIABILITY_UIFLAG_DIMMING = 0x0001;
// The following close types are sent during a CGP connection close (in 
// CGP_FINISH_REQUEST and CGP_FINISH_RSPONSE messages).  They indicate what
// action the CGP User Program should take after the CGP connection is
// closed.  These IDs are not bit flags.
CGPConstants.CGP_FINISH_TYPE_CLOSE   = 0x00;
CGPConstants.CGP_FINISH_TYPE_RESTART = 0x01;

// The following bits occupy the least significant place in a Channel ID and
// indicate whether the CGP Server or CGP Client initiated the channel open.
CGPConstants.CHANNEL_ID_CLIENT_BIT = 0x00;
CGPConstants.CHANNEL_ID_SERVER_BIT = 0x01;

// The following status codes appear in the CGP_CHANNEL_OPEN_RESPONSE
// message and indicate the result of the channel open request.
CGPConstants.CGP_CHANNEL_OPEN_STATUS_ACCEPTED        = 0x0000;
CGPConstants.CGP_CHANNEL_OPEN_STATUS_REJECTED        = 0x0001;
CGPConstants.CGP_CHANNEL_OPEN_STATUS_FAILURE         = 0x0002;
CGPConstants.CGP_CONNECT_OPEN_STATUS_SERVICE_FAILURE = 0x0003;

// The following status codes appear in the CGP_CHANNEL_CLOSE message and
// indicate the way in which the channel is closing.
CGPConstants.CGP_CHANNEL_CLOSE_STATUS_NORMAL = 0x0000;
CGPConstants.CGP_CHANNEL_CLOSE_SERVICE_ERROR = 0x0001;

// The following IDs appear in the Channel Framing field of the
// CGP_CHANNEL_OPEN message.  They indicate whether channel writes from the
// sending side of the connection should be re-assembled to the same
// boundaries before handing the data to the owning Service on the receiving
// side of the connection
CGPConstants.CGP_CHANNEL_FRAMING_STREAM  = 0x00;
CGPConstants.CGP_CHANNEL_FRAMING_MESSAGE = 0x01;

// The following IDs appear in the Channel Priority field of the 
// CGP_CHANNEL_OPEN message.
CGPConstants.CGP_CHANNEL_PRIORITY_LOW      = 0x00;
CGPConstants.CGP_CHANNEL_PRIORITY_NORMAL   = 0x01;
CGPConstants.CGP_CHANNEL_PRIORITY_REALTIME = 0x02;

// The following bit flags appear in the first byte of the Connection
// Monitoring header extension.  They indicate the purpose of the CM header
// extension, and specify what bytes will appear in the CM header extension.
// They can be or'd together.
CGPConstants.CGP_CM_TIME_PACKET              = 0x01;
CGPConstants.CGP_CM_ROUNDTRIP_TOKEN_REQUEST  = 0x02;
CGPConstants.CGP_CM_ROUNDTRIP_TOKEN_RESPONSE = 0x04;
CGPConstants.CGP_CM_BANDWIDTH_ESTIMATE       = 0x08;

// The following bit flags appear in the first byte of the Reliability
// header extension.  They indicate the purpose of the Reliability header
// extension, and specify what bytes will appear in the Reliability header
// extension.  They can be or'd together.
CGPConstants.CGP_RELIABILITY_EXTENSION_TRACK_MESSAGE = 0x01;
CGPConstants.CGP_RELIABILITY_EXTENSION_ACK           = 0x02;

// The following define appears in the session reliabilithy capability block
// and represents a particular algorithm to be used to determing when to
// send reliability ACKs.
CGPConstants.CGP_RELIABILITY_ACKING_ALGORITHM_N_MESSAGES_PER_ACK = 0x01;

CGPConstants.CGP_DEFAULT_MESSAGES_PER_ACK = 5;

// The reserved byte is used throughout the protocol
CGPConstants.CGP_RESERVED = 0x00;

// The following Address Type IDs are sent in the Destination Endpoint Core
// Capability Block from client to server during the initial CGP handshake.
// They indicate the destination endpoint of the CGP connection.  These IDs
// are not bit flags - the Destination Endpoint Capability Block contains
// only a single Address Type.
CGPConstants.CGP_ADDRESSTYPE_DEFAULT         = 0x00;
CGPConstants.CGP_ADDRESSTYPE_HOSTNAME        = 0x01;
CGPConstants.CGP_ADDRESSTYPE_TICKET_STA      = 0x02;
CGPConstants.CGP_ADDRESSTYPE_SECURITY_TICKET = 0x03;

// The following Ticket Type IDs are sent in  the Security Ticket Capability
// Block.  They indicate a type of security ticket.  These IDs are not bit
// flags.
CGPConstants.CGP_TICKET_TYPE_STA = 0x00;
CGPConstants.SECURITYTICKET_PRESENT = false;
CGPConstants.CGP_SECURITY_TOKEN = null;
// This is used to indicate the core protocol in capability blocks
CGPConstants.CGP_SERVICEID_CORE = 0x00;

CGPConstants.MAX_HEADER_EXTENSIONS = 32*7;
CGPConstants.MAX_SERVICE_NAME_LENGTH = 255;


CGPConstants.CGP_FALSE = false;
CGPConstants.CGP_TRUE = true;