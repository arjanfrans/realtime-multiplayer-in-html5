'use strict';

module.exports = {
    naiveApproach: false,   // Whether or not to use the naive approach
    showServerPosition: false,  // Whether or not to show the server position
    showDestinationPosition: false,    // Whether or not to show the interpolation goal
    clientPrediction: true,    // Whether or not the client is predicting input
    clientSmoothing: true,  // Whether or not the client side prediction tries to smooth things out
    networkOffset: 100,         // 100 ms latency between server and client interpolation for other clients
    networkBufferSize: 2,          // The size of the server history to keep for rewinding/interpolating.
    pingTimeout: 1000, // How often to ping the server.
    serverUrl: 'http://localhost:4004'
};
