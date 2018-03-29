var NetworkErrors;
(function(NetworkErrors){
	
	var CHROME_NETWORK_ERROR = {};
	CHROME_NETWORK_ERROR['-1'] = 'IO_PENDING';
	CHROME_NETWORK_ERROR['-2'] = 'FAILED';
	CHROME_NETWORK_ERROR['-3'] = 'ABORTED';
	CHROME_NETWORK_ERROR['-4'] = 'INVALID_ARGUMENT';
	CHROME_NETWORK_ERROR['-5'] = 'INVALID_HANDLE';
	CHROME_NETWORK_ERROR['-6'] = 'FILE_NOT_FOUND';
	CHROME_NETWORK_ERROR['-7'] = 'TIMED_OUT';
	CHROME_NETWORK_ERROR['-8'] = 'FILE_TOO_BIG';
	CHROME_NETWORK_ERROR['-9'] = 'UNEXPECTED';
	CHROME_NETWORK_ERROR['-10'] = 'ACCESS_DENIED';
	CHROME_NETWORK_ERROR['-11'] = 'NOT_IMPLEMENTED';
	CHROME_NETWORK_ERROR['-12'] = 'INSUFFICIENT_RESOURCES';
	CHROME_NETWORK_ERROR['-13'] = 'OUT_OF_MEMORY';
	CHROME_NETWORK_ERROR['-14'] = 'UPLOAD_FILE_CHANGED';
	CHROME_NETWORK_ERROR['-15'] = 'SOCKET_NOT_CONNECTED';
	CHROME_NETWORK_ERROR['-16'] = 'FILE_EXISTS';
	CHROME_NETWORK_ERROR['-17'] = 'FILE_PATH_TOO_LONG';
	CHROME_NETWORK_ERROR['-18'] = 'FILE_NO_SPACE';
	CHROME_NETWORK_ERROR['-19'] = 'FILE_VIRUS_INFECTED';
	CHROME_NETWORK_ERROR['-20'] = 'BLOCKED_BY_CLIENT';
	CHROME_NETWORK_ERROR['-21'] = 'NETWORK_CHANGED';
	CHROME_NETWORK_ERROR['-22'] = 'BLOCKED_BY_ADMINISTRATOR';
	CHROME_NETWORK_ERROR['-23'] = 'SOCKET_IS_CONNECTED';
	CHROME_NETWORK_ERROR['-24'] = 'BLOCKED_ENROLLMENT_CHECK_PENDING';
	CHROME_NETWORK_ERROR['-100'] = 'CONNECTION_CLOSED';
	CHROME_NETWORK_ERROR['-101'] = 'CONNECTION_RESET';
	CHROME_NETWORK_ERROR['-102'] = 'CONNECTION_REFUSED';
	CHROME_NETWORK_ERROR['-103'] = 'CONNECTION_ABORTED';
	CHROME_NETWORK_ERROR['-104'] = 'CONNECTION_FAILED';
	CHROME_NETWORK_ERROR['-105'] = 'NAME_NOT_RESOLVED';
	CHROME_NETWORK_ERROR['-106'] = 'INTERNET_DISCONNECTED';
	CHROME_NETWORK_ERROR['-107'] = 'SSL_PROTOCOL_ERROR';
	CHROME_NETWORK_ERROR['-108'] = 'ADDRESS_INVALID';
	CHROME_NETWORK_ERROR['-109'] = 'ADDRESS_UNREACHABLE';
	CHROME_NETWORK_ERROR['-110'] = 'SSL_CLIENT_AUTH_CERT_NEEDED';
	CHROME_NETWORK_ERROR['-111'] = 'TUNNEL_CONNECTION_FAILED';
	CHROME_NETWORK_ERROR['-112'] = 'NO_SSL_VERSIONS_ENABLED';
	CHROME_NETWORK_ERROR['-113'] = 'SSL_VERSION_OR_CIPHER_MISMATCH';
	CHROME_NETWORK_ERROR['-114'] = 'SSL_RENEGOTIATION_REQUESTED';
	CHROME_NETWORK_ERROR['-115'] = 'PROXY_AUTH_UNSUPPORTED';
	CHROME_NETWORK_ERROR['-116'] = 'CERT_ERROR_IN_SSL_RENEGOTIATION';
	CHROME_NETWORK_ERROR['-117'] = 'BAD_SSL_CLIENT_AUTH_CERT';
	CHROME_NETWORK_ERROR['-118'] = 'CONNECTION_TIMED_OUT';
	CHROME_NETWORK_ERROR['-119'] = 'HOST_RESOLVER_QUEUE_TOO_LARGE';
	CHROME_NETWORK_ERROR['-120'] = 'SOCKS_CONNECTION_FAILED';
	CHROME_NETWORK_ERROR['-121'] = 'SOCKS_CONNECTION_HOST_UNREACHABLE';
	CHROME_NETWORK_ERROR['-122'] = 'NPN_NEGOTIATION_FAILED';
	CHROME_NETWORK_ERROR['-123'] = 'SSL_NO_RENEGOTIATION';
	CHROME_NETWORK_ERROR['-124'] = 'WINSOCK_UNEXPECTED_WRITTEN_BYTES';
	CHROME_NETWORK_ERROR['-125'] = 'SSL_DECOMPRESSION_FAILURE_ALERT';
	CHROME_NETWORK_ERROR['-126'] = 'SSL_BAD_RECORD_MAC_ALERT';
	CHROME_NETWORK_ERROR['-127'] = 'PROXY_AUTH_REQUESTED';
	CHROME_NETWORK_ERROR['-128'] = 'SSL_UNSAFE_NEGOTIATION';
	CHROME_NETWORK_ERROR['-129'] = 'SSL_WEAK_SERVER_EPHEMERAL_DH_KEY';
	CHROME_NETWORK_ERROR['-130'] = 'PROXY_CONNECTION_FAILED';
	CHROME_NETWORK_ERROR['-131'] = 'MANDATORY_PROXY_CONFIGURATION_FAILED';
	CHROME_NETWORK_ERROR['-133'] = 'PRECONNECT_MAX_SOCKET_LIMIT';
	CHROME_NETWORK_ERROR['-134'] = 'SSL_CLIENT_AUTH_PRIVATE_KEY_ACCESS_DENIED';
	CHROME_NETWORK_ERROR['-135'] = 'SSL_CLIENT_AUTH_CERT_NO_PRIVATE_KEY';
	CHROME_NETWORK_ERROR['-136'] = 'PROXY_CERTIFICATE_INVALID';
	CHROME_NETWORK_ERROR['-137'] = 'NAME_RESOLUTION_FAILED';
	CHROME_NETWORK_ERROR['-138'] = 'NETWORK_ACCESS_DENIED';
	CHROME_NETWORK_ERROR['-139'] = 'TEMPORARILY_THROTTLED';
	CHROME_NETWORK_ERROR['-140'] = 'HTTPS_PROXY_TUNNEL_RESPONSE';
	CHROME_NETWORK_ERROR['-141'] = 'SSL_CLIENT_AUTH_SIGNATURE_FAILED';
	CHROME_NETWORK_ERROR['-142'] = 'MSG_TOO_BIG';
	CHROME_NETWORK_ERROR['-143'] = 'SPDY_SESSION_ALREADY_EXISTS';
	CHROME_NETWORK_ERROR['-145'] = 'WS_PROTOCOL_ERROR';
	CHROME_NETWORK_ERROR['-146'] = 'PROTOCOL_SWITCHED';
	CHROME_NETWORK_ERROR['-147'] = 'ADDRESS_IN_USE';
	CHROME_NETWORK_ERROR['-148'] = 'SSL_HANDSHAKE_NOT_COMPLETED';
	CHROME_NETWORK_ERROR['-149'] = 'SSL_BAD_PEER_PUBLIC_KEY';
	CHROME_NETWORK_ERROR['-150'] = 'SSL_PINNED_KEY_NOT_IN_CERT_CHAIN';
	CHROME_NETWORK_ERROR['-151'] = 'CLIENT_AUTH_CERT_TYPE_UNSUPPORTED';
	CHROME_NETWORK_ERROR['-152'] = 'ORIGIN_BOUND_CERT_GENERATION_TYPE_MISMATCH';
	CHROME_NETWORK_ERROR['-153'] = 'SSL_DECRYPT_ERROR_ALERT';
	CHROME_NETWORK_ERROR['-154'] = 'WS_THROTTLE_QUEUE_TOO_LARGE';
	CHROME_NETWORK_ERROR['-155'] = 'TOO_MANY_SOCKET_STREAMS';
	CHROME_NETWORK_ERROR['-156'] = 'SSL_SERVER_CERT_CHANGED';
	CHROME_NETWORK_ERROR['-157'] = 'SSL_INAPPROPRIATE_FALLBACK';
	CHROME_NETWORK_ERROR['-158'] = 'CT_NO_SCTS_VERIFIED_OK';
	CHROME_NETWORK_ERROR['-159'] = 'SSL_UNRECOGNIZED_NAME_ALERT';
	CHROME_NETWORK_ERROR['-160'] = 'SOCKET_SET_RECEIVE_BUFFER_SIZE_ERROR';
	CHROME_NETWORK_ERROR['-161'] = 'SOCKET_SET_SEND_BUFFER_SIZE_ERROR';
	CHROME_NETWORK_ERROR['-162'] = 'SOCKET_RECEIVE_BUFFER_SIZE_UNCHANGEABLE';
	CHROME_NETWORK_ERROR['-163'] = 'SOCKET_SEND_BUFFER_SIZE_UNCHANGEABLE';
	CHROME_NETWORK_ERROR['-164'] = 'SSL_CLIENT_AUTH_CERT_BAD_FORMAT';
	CHROME_NETWORK_ERROR['-200'] = 'CERT_COMMON_NAME_INVALID';
	CHROME_NETWORK_ERROR['-201'] = 'CERT_DATE_INVALID';
	CHROME_NETWORK_ERROR['-202'] = 'CERT_AUTHORITY_INVALID';
	CHROME_NETWORK_ERROR['-203'] = 'CERT_CONTAINS_ERRORS';
	CHROME_NETWORK_ERROR['-204'] = 'CERT_NO_REVOCATION_MECHANISM';
	CHROME_NETWORK_ERROR['-205'] = 'CERT_UNABLE_TO_CHECK_REVOCATION';
	CHROME_NETWORK_ERROR['-206'] = 'CERT_REVOKED';
	CHROME_NETWORK_ERROR['-207'] = 'CERT_INVALID';
	CHROME_NETWORK_ERROR['-208'] = 'CERT_WEAK_SIGNATURE_ALGORITHM';
	CHROME_NETWORK_ERROR['-210'] = 'CERT_NON_UNIQUE_NAME';
	CHROME_NETWORK_ERROR['-211'] = 'CERT_WEAK_KEY';
	CHROME_NETWORK_ERROR['-212'] = 'CERT_NAME_CONSTRAINT_VIOLATION';
	CHROME_NETWORK_ERROR['-213'] = 'CERT_END';
	CHROME_NETWORK_ERROR['-300'] = 'INVALID_URL';
	CHROME_NETWORK_ERROR['-301'] = 'DISALLOWED_URL_SCHEME';
	CHROME_NETWORK_ERROR['-302'] = 'UNKNOWN_URL_SCHEME';
	CHROME_NETWORK_ERROR['-310'] = 'TOO_MANY_REDIRECTS';
	CHROME_NETWORK_ERROR['-311'] = 'UNSAFE_REDIRECT';
	CHROME_NETWORK_ERROR['-312'] = 'UNSAFE_PORT';
	CHROME_NETWORK_ERROR['-320'] = 'INVALID_RESPONSE';
	CHROME_NETWORK_ERROR['-321'] = 'INVALID_CHUNKED_ENCODING';
	CHROME_NETWORK_ERROR['-322'] = 'METHOD_NOT_SUPPORTED';
	CHROME_NETWORK_ERROR['-323'] = 'UNEXPECTED_PROXY_AUTH';
	CHROME_NETWORK_ERROR['-324'] = 'EMPTY_RESPONSE';
	CHROME_NETWORK_ERROR['-325'] = 'RESPONSE_HEADERS_TOO_BIG';
	CHROME_NETWORK_ERROR['-326'] = 'PAC_STATUS_NOT_OK';
	CHROME_NETWORK_ERROR['-327'] = 'PAC_SCRIPT_FAILED';
	CHROME_NETWORK_ERROR['-328'] = 'REQUEST_RANGE_NOT_SATISFIABLE';
	CHROME_NETWORK_ERROR['-329'] = 'MALFORMED_IDENTITY';
	CHROME_NETWORK_ERROR['-330'] = 'CONTENT_DECODING_FAILED';
	CHROME_NETWORK_ERROR['-331'] = 'NETWORK_IO_SUSPENDED';
	CHROME_NETWORK_ERROR['-332'] = 'SYN_REPLY_NOT_RECEIVED';
	CHROME_NETWORK_ERROR['-333'] = 'ENCODING_CONVERSION_FAILED';
	CHROME_NETWORK_ERROR['-334'] = 'UNRECOGNIZED_FTP_DIRECTORY_LISTING_FORMAT';
	CHROME_NETWORK_ERROR['-335'] = 'INVALID_SPDY_STREAM';
	CHROME_NETWORK_ERROR['-336'] = 'NO_SUPPORTED_PROXIES';
	CHROME_NETWORK_ERROR['-337'] = 'SPDY_PROTOCOL_ERROR';
	CHROME_NETWORK_ERROR['-338'] = 'INVALID_AUTH_CREDENTIALS';
	CHROME_NETWORK_ERROR['-339'] = 'UNSUPPORTED_AUTH_SCHEME';
	CHROME_NETWORK_ERROR['-340'] = 'ENCODING_DETECTION_FAILED';
	CHROME_NETWORK_ERROR['-341'] = 'MISSING_AUTH_CREDENTIALS';
	CHROME_NETWORK_ERROR['-342'] = 'UNEXPECTED_SECURITY_LIBRARY_STATUS';
	CHROME_NETWORK_ERROR['-343'] = 'MISCONFIGURED_AUTH_ENVIRONMENT';
	CHROME_NETWORK_ERROR['-344'] = 'UNDOCUMENTED_SECURITY_LIBRARY_STATUS';
	CHROME_NETWORK_ERROR['-345'] = 'RESPONSE_BODY_TOO_BIG_TO_DRAIN';
	CHROME_NETWORK_ERROR['-346'] = 'RESPONSE_HEADERS_MULTIPLE_CONTENT_LENGTH';
	CHROME_NETWORK_ERROR['-347'] = 'INCOMPLETE_SPDY_HEADERS';
	CHROME_NETWORK_ERROR['-348'] = 'PAC_NOT_IN_DHCP';
	CHROME_NETWORK_ERROR['-349'] = 'RESPONSE_HEADERS_MULTIPLE_CONTENT_DISPOSITION';
	CHROME_NETWORK_ERROR['-350'] = 'RESPONSE_HEADERS_MULTIPLE_LOCATION';
	CHROME_NETWORK_ERROR['-351'] = 'SPDY_SERVER_REFUSED_STREAM';
	CHROME_NETWORK_ERROR['-352'] = 'SPDY_PING_FAILED';
	CHROME_NETWORK_ERROR['-354'] = 'CONTENT_LENGTH_MISMATCH';
	CHROME_NETWORK_ERROR['-355'] = 'INCOMPLETE_CHUNKED_ENCODING';
	CHROME_NETWORK_ERROR['-356'] = 'QUIC_PROTOCOL_ERROR';
	CHROME_NETWORK_ERROR['-357'] = 'RESPONSE_HEADERS_TRUNCATED';
	CHROME_NETWORK_ERROR['-358'] = 'QUIC_HANDSHAKE_FAILED';
	CHROME_NETWORK_ERROR['-359'] = 'REQUEST_FOR_SECURE_RESOURCE_OVER_INSECURE_QUIC';
	CHROME_NETWORK_ERROR['-360'] = 'SPDY_INADEQUATE_TRANSPORT_SECURITY';
	CHROME_NETWORK_ERROR['-361'] = 'SPDY_FLOW_CONTROL_ERROR';
	CHROME_NETWORK_ERROR['-362'] = 'SPDY_FRAME_SIZE_ERROR';
	CHROME_NETWORK_ERROR['-363'] = 'SPDY_COMPRESSION_ERROR';
	CHROME_NETWORK_ERROR['-364'] = 'PROXY_AUTH_REQUESTED_WITH_NO_CONNECTION';
	CHROME_NETWORK_ERROR['-400'] = 'CACHE_MISS';
	CHROME_NETWORK_ERROR['-401'] = 'CACHE_READ_FAILURE';
	CHROME_NETWORK_ERROR['-402'] = 'CACHE_WRITE_FAILURE';
	CHROME_NETWORK_ERROR['-403'] = 'CACHE_OPERATION_NOT_SUPPORTED';
	CHROME_NETWORK_ERROR['-404'] = 'CACHE_OPEN_FAILURE';
	CHROME_NETWORK_ERROR['-405'] = 'CACHE_CREATE_FAILURE';
	CHROME_NETWORK_ERROR['-406'] = 'CACHE_RACE';
	CHROME_NETWORK_ERROR['-407'] = 'CACHE_CHECKSUM_READ_FAILURE';
	CHROME_NETWORK_ERROR['-408'] = 'CACHE_CHECKSUM_MISMATCH';
	CHROME_NETWORK_ERROR['-409'] = 'CACHE_LOCK_TIMEOUT';
	CHROME_NETWORK_ERROR['-501'] = 'INSECURE_RESPONSE';
	CHROME_NETWORK_ERROR['-502'] = 'NO_PRIVATE_KEY_FOR_CERT';
	CHROME_NETWORK_ERROR['-503'] = 'ADD_USER_CERT_FAILED';
	CHROME_NETWORK_ERROR['-601'] = 'FTP_FAILED';
	CHROME_NETWORK_ERROR['-602'] = 'FTP_SERVICE_UNAVAILABLE';
	CHROME_NETWORK_ERROR['-603'] = 'FTP_TRANSFER_ABORTED';
	CHROME_NETWORK_ERROR['-604'] = 'FTP_FILE_BUSY';
	CHROME_NETWORK_ERROR['-605'] = 'FTP_SYNTAX_ERROR';
	CHROME_NETWORK_ERROR['-606'] = 'FTP_COMMAND_NOT_SUPPORTED';
	CHROME_NETWORK_ERROR['-607'] = 'FTP_BAD_COMMAND_SEQUENCE';
	CHROME_NETWORK_ERROR['-701'] = 'PKCS12_IMPORT_BAD_PASSWORD';
	CHROME_NETWORK_ERROR['-702'] = 'PKCS12_IMPORT_FAILED';
	CHROME_NETWORK_ERROR['-703'] = 'IMPORT_CA_CERT_NOT_CA';
	CHROME_NETWORK_ERROR['-704'] = 'IMPORT_CERT_ALREADY_EXISTS';
	CHROME_NETWORK_ERROR['-705'] = 'IMPORT_CA_CERT_FAILED';
	CHROME_NETWORK_ERROR['-706'] = 'IMPORT_SERVER_CERT_FAILED';
	CHROME_NETWORK_ERROR['-707'] = 'PKCS12_IMPORT_INVALID_MAC';
	CHROME_NETWORK_ERROR['-708'] = 'PKCS12_IMPORT_INVALID_FILE';
	CHROME_NETWORK_ERROR['-709'] = 'PKCS12_IMPORT_UNSUPPORTED';
	CHROME_NETWORK_ERROR['-710'] = 'KEY_GENERATION_FAILED';
	CHROME_NETWORK_ERROR['-711'] = 'ORIGIN_BOUND_CERT_GENERATION_FAILED';
	CHROME_NETWORK_ERROR['-712'] = 'PRIVATE_KEY_EXPORT_FAILED';
	CHROME_NETWORK_ERROR['-713'] = 'SELF_SIGNED_CERT_GENERATION_FAILED';
	CHROME_NETWORK_ERROR['-714'] = 'CERT_DATABASE_CHANGED';
	CHROME_NETWORK_ERROR['-715'] = 'CHANNEL_ID_IMPORT_FAILED';
	CHROME_NETWORK_ERROR['-800'] = 'DNS_MALFORMED_RESPONSE';
	CHROME_NETWORK_ERROR['-801'] = 'DNS_SERVER_REQUIRES_TCP';
	CHROME_NETWORK_ERROR['-802'] = 'DNS_SERVER_FAILED';
	CHROME_NETWORK_ERROR['-803'] = 'DNS_TIMED_OUT';
	CHROME_NETWORK_ERROR['-804'] = 'DNS_CACHE_MISS';
	CHROME_NETWORK_ERROR['-805'] = 'DNS_SEARCH_EMPTY';
	CHROME_NETWORK_ERROR['-806'] = 'DNS_SORT_ERROR';
	CHROME_NETWORK_ERROR['default'] = 'UNKNOWN_ERROR';
	
	function getErrorMsg(errorCode){
		return (CHROME_NETWORK_ERROR[errorCode]) ? CHROME_NETWORK_ERROR[errorCode] : CHROME_NETWORK_ERROR['default'];
	}
	
	NetworkErrors.getErrorMsg = getErrorMsg;
})(NetworkErrors||(NetworkErrors={}));