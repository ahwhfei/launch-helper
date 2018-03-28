// Copyright 2004 Citrix Systems, Inc. All rights reserved.

//import java.util.Vector; // TODO Implement a JS function for vector and implement add and get methods.(See how to do this)



function CGPChannel (core, service, channelId, framed, realtime){
    this.core           = core;         // Object to CGPCore;
    this.service        = service;      // Object to CGPService;
    this.channelId      = channelId;
    this.framed         = framed;       // boolean
    this.isRealtime     = realtime;     // boolean

    var closeSent       = false;        // boolean
    var closeReceived   = false;        // boolean
    var destroyed       = false;        // boolean
    var myself = this;
    // Queued frame pieces for framed channels
    //Define this in Data Arrived since it is just local to that.
    // var partialPackets;
    // var partialPacketsSize;

    var openRequest = null;

    this.storeOpenRequest = function(request) {
        if (openRequest != null) {
            //throw new IllegalStateException("Can only store an open request once per channel");
        }
        openRequest = request;
    };

    this.getOpenRequest = function () {
        return openRequest;
    };

    /**
     * Closes this CGPChannel.
     */
    this.close = function(serviceStatusCode) {
        /*if (Debug.trace) {
            Debug.trace(this, "CGPChannel.close(" + serviceStatusCode + ")");
        }*/
        // Commenting out Synchronized as we don't use threads and not required.
        // synchronized(core) {
            if (closeSent || destroyed) {
                //throw new IllegalStateException("Channel is already closed");
            }

            closeSent = true;

            core.sendChannelClose(channelId,
                                  CGPConstants.CGP_CHANNEL_CLOSE_STATUS_NORMAL,
                                  serviceStatusCode);

            if (closeReceived) {
                // Both ends are now closed, discard the channel
                this.destroy();
            }
        //}
    };

    /**
     * Close received.
     */
    this.closeReceived = function() {
        /*
        if (Debug.trace) {
            Debug.trace(this, "CGPChannel.closeReceived(" + statusCode + ", " + serviceStatusCode + ")");
        }*/
        // NOTE: synchronized on core

        closeReceived = true;

        // Tell the service that the server has closed the channel.
        service.channelClosed(myself);

        if (closeSent) {
            // Both ends are now closed, discard the channel
            this.destroy();
        }
    };

    /**
     * Deregisters the channel from the CGPCore and marks it as unusable.
     */
    this.destroy = function() {
        /*if (Debug.trace) {
            Debug.trace(this, "CGPChannel.this.destroy()");
        }*/
        // NOTE: synchronized on core
        destroyed = true;
        core.deregisterChannel(myself);
    };

    /**
     * Send data over the network to the CGP server.
     * @param data the data.
     * @param offset - the start offset in the data.
     * @param length - the number of bytes to write. 
     */
    this.writeData = function(data, offset, length) {
        //synchronized(core) {
            if (closeSent || destroyed) {
                //throw new IllegalStateException("Channel may no longer be written to");
            }
            if (myself.isRealtime) {
                core.sendRealtimeData(data, offset, length);
            } else {
                core.sendData(myself, data, offset, length);
            }
        //}
    };

    /**
     */
    this.dataArrived = function(data, partial) {
        // NOTE: synchronized on core
        var partialPackets = null;
        var partialPacketsSize = 0;
        if (destroyed) {
            //throw new IllegalStateException("Channel has been destroyed, should not get any more data");
        }

        if (partial) {
            if (!framed) {
                // TODO: fault partial packet on unframed channel?
            }
            // Queue up this packet until we receive the rest.
            var partialPacket = data.copyData();
            if (partialPackets == null) {
                partialPackets     = new Vector();
                partialPacketsSize = 0;
            }

           //partialPackets.add(partialPacket);
            partialPacketsSize += partialPacket.length;
        } else {
            if (partialPackets == null) {
                // No frame fragments stored.

                // Deliver complete frame to service
                service.dataArrived(myself, data);
            } else {
                // This packet completes the partial frame.
                var totalSize = partialPacketsSize + data.length;

                // Coalesce packets
                var packet = new Uint8Array(totalSize);
                var offset = 0;

                for(var i = 0; i < partialPackets.size(); i++) {
                    var src = partialPackets.get(i);
                    Utility.CopyArray(src, 0, packet, offset, src.length);
                    offset += src.length;
                }

                data.readData(packet, offset, data.length);

                // Discard old set of packets
                partialPackets = null;

                // Deliver completed frame to service
                service.dataArrived(myself, new CGPBuffer(packet));
            }
        }
    }
}

