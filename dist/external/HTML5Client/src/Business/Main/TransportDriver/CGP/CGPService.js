// Copyright 2004 Citrix Systems, Inc. All rights reserved.

/**
 * The abstract CGPService class is the base for all CGP services.
 */
function CGPService (name, version) {
    // Public names for internal priority values
    var PRIORITY_LOW      = CGPConstants.CGP_CHANNEL_PRIORITY_LOW;
    var PRIORITY_NORMAL   = CGPConstants.CGP_CHANNEL_PRIORITY_NORMAL;
    var PRIORITY_REALTIME = CGPConstants.CGP_CHANNEL_PRIORITY_REALTIME;

    var serviceName = name;
    var serviceId;

    var serviceVersion = version;
    var versionToUse;

    //private CGPServiceToCore serviceToCore;
    this.serviceToCore = null;// Object for Service To core.

    var bound = false; //boolean

    this.register = function(stc) {
        if (this.serviceToCore == null) {
            this.serviceToCore = stc;
        } else {
            //throw new IllegalStateException("Service is already registered");
        }
    };

    /**
     * Opens a channel to the server.

    this.openChannel(boolean framed, byte[] data) {
        openChannel(framed, PRIORITY_NORMAL, data);
    }
     */
    /**
     * Opens a channel to the server.
     */
    this.openChannel = function(framed, priority, data)
    {
        checkBound();

        if (priority != PRIORITY_LOW &&
            priority != PRIORITY_NORMAL &&
            priority != PRIORITY_REALTIME)
        {
            //throw new IllegalArgumentException("Unsupported priority");
        }

        // Is synchronized on core
        return this.serviceToCore.openChannel(framed, priority, data);
    };

    /**
     * Returns the name of the service as used to identify it in the CGP
     * protocol.
     * @return the service name.
     */
    this.getServiceName = function() {
        return serviceName;
    };

    /**
     * Returns the version of the service as used to identify it in the CGP
     * protocol.
     * @return the service version number.
     */
    this.getServiceVersion = function() {
        return serviceVersion;
    };

    /**
     */
    this.bind = function(version, id) {
        if (bound) {
            console.log("Service has already been bound");
        }

        bound = true;

        // TODO: provide overridable methods that can throw exceptions if
        // inappropriate versions are supplied.
        versionToUse = version;
        serviceId    = id;
    };

    /**
     */
    this.getServiceId = function () {

        checkBound();

        return serviceId;
    };

    /**
     */
    this.channelOpenResponse = function(channel, responseHeader, statusCode, serviceStatusCode){

    };

    /**
     */
    this.channelClosed = function(channel){

    };

    /**
     */
    this.connectionClosing = function(){

    };

    /**
     * Notifies the service that there is data ready for processing on the
     * specified channel.
     * @param channel, the channel with data to process.
     * @param data, the data for the channel to process.
     */

    this.dataArrived= function(channel, data){

    };
    /**
     */
    this.connectionClosed = function () {

    };

    /**
     */
    //void setCapabilities();

    /**
     * Gets the capabilities of this service.
     */
    this.getCapabilities = function() {
        return null;
    };

    /**
     * Sets the capabilities of this service.
     */
    this.setCapability = function(capId, body) {

    };

    /**

    this.channelOpenRequest = function (channel) {
        // Unsupported...
    };
     */
    /**
     */
    function checkBound() {
        if (!bound) {
            //throw new IllegalStateException("Service has not been bound");
        }
    }
}

