// Copyright 2004 Citrix Systems, Inc. All rights reserved.

//package com.citrix.sdk.cgp;

/**
 * The CGPSvcToCore interface is used by CGPServices to communicate with their
 * associated CGPCores.
 */
function ServiceToCore (){
    this.openChannel = function(framed, priority, channelOpenHeader){};
}

