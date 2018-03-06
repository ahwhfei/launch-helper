// Copyright 2015 Citrix Systems, Inc. All rights reserved.

//BindCapability.prototype = new CGPCapability(CGPConstants.CGP_SERVICEID_CORE, CGPConstants.CGP_CAPABILITY_SERVICES_BINDING);

function BindCapability(services){
    var noServices  = services.length;
    var names       = new Array(services.length);
    var versions    = new Array(services.length);
    var ids         = new Array(services.length);
	this.serviceId 	= CGPConstants.CGP_SERVICEID_CORE;
	this.capabilityId=CGPConstants.CGP_CAPABILITY_SERVICES_BINDING;
    for (var i = 0; i < services.length; i++) {
        names[i]    = services[i].getServiceName();
        versions[i] = services[i].getServiceVersion();
        // We get to assign the service numbers as we are performing the bind.
        ids[i]      = i + 1;
    }

    this.read = function(data)  {
        this.noServices  = data.readVarInt();
        this.names       = new Array(noServices);
        this.versions    = new Array(noServices);
        this.ids         = new Array(noServices);
        for (var i = 0; i < this.noServices; i++) {
            var serviceBlockLength  = data.readVarInt();
            var serviceBlock        = data.readBuffer(serviceBlockLength);
            this.ids[i]      = serviceBlock.readUInt16();
            this.versions[i] = serviceBlock.readUInt8();
            serviceBlock.readReservedByte(); // discard reserved byte
            serviceBlock.readReservedByte(); // discard reserved byte
            var serviceNameLen = serviceBlock.readVarInt();
            this.names[i]    = serviceBlock.readAsciiString(serviceNameLen);
        }
        return this;
    };

    this.getBytes = function() {
        var serviceName;
        var i;
        var noServices          = names.length;
        var serviceBlockLengths = new Array(noServices);
        var capabilitySize      = 0;
        for(i = 0; i < noServices; i++) {
            serviceName = names[i];
            if ((versions[i] & 0xff) != versions[i]) {
                //throw new IllegalArgumentException("Service versions must be between 0x00 and 0xff");
            }
            if (serviceName.length > CGPConstants.MAX_SERVICE_NAME_LENGTH) {
                //throw new IllegalArgumentException("Service names must be at most 255 characters long");
            }
            serviceBlockLengths[i] = 2 + 1 + 2 // serviceId length + serviceVersion length + 2 reserved bytes
            + getVarLenLength(serviceName.length)
            + serviceName.length;
            capabilitySize += serviceBlockLengths[i] + getVarLenLength(serviceBlockLengths[i]);
        }

        capabilitySize += 2 + 2 + 2 // serviceId length + capabilityId length + 2 reserved bytes
        + getVarLenLength(noServices);

        var capability = new Uint8Array(capabilitySize + getVarLenLength(capabilitySize));
        var offset = 0;

        offset = cgpWriteVarLength(capabilitySize, offset, capability);
        offset = writeUint16(this.serviceId, offset, capability);
        offset = writeUint16(this.capabilityId, offset, capability);
        offset = writeUint16(0, offset, capability); //reserved bytes
        offset = cgpWriteVarLength(noServices, offset, capability);

        for(i = 0; i < noServices; i++) {
            offset = cgpWriteVarLength(serviceBlockLengths[i], offset, capability);
            offset = writeUint16(ids[i], offset, capability);
            capability[offset++] = versions[i];
            offset = writeUint16(0, offset, capability); // 2 reserved bytes
            serviceName = names[i];
            offset = cgpWriteVarLength(serviceName.length, offset, capability);

            var serviceNameChars;

            for(var j=0;j< serviceName.length ; j++)
            {
                serviceNameChars = serviceName.charCodeAt(j);
                capability[offset++] = serviceNameChars;
            }
        }
        //console.log("Bind Capability is : ", capability);
        return capability;
    };
}


