/**
 * @private
 *
 */
Ext.define('Ext.cf.messaging.Rpc', {
    
    requires: ['Ext.cf.util.Logger'],


    currentCallId: 0,

    callMap: {},

    transport: null,

    rpcTimeoutInterval: null,

    config: {
        rpcTimeoutDuration: 60 * 1000, // 1 minute
        rpcTimeoutCheckInterval: 5 * 1000 // check for timeouts every 5 sec
    },

    /** 
     * Constructor
     *
     * @param {Object} config
     * @param {Object} transport
     *
     */
    constructor: function(config, transport) {
        var self = this;

        this.initConfig(config);
        this.transport = transport;

        this.rpcTimeoutInterval = setInterval(function() {
            self.processRpcTimeouts();
        }, this.getRpcTimeoutCheckInterval());


        return this;
    },

    /** 
     * Process Rpc timeouts
     *
     */
    processRpcTimeouts: function() {
        var self = this;

        var currentTime = new Date().getTime();
        var rpcTimeoutDuration = this.getRpcTimeoutDuration();
        var toRemove = [];

        try {
            for(var corrId in this.callMap) {
                var map = this.callMap[corrId];
                if(map && map.requestTime && ((currentTime - map.requestTime) > rpcTimeoutDuration)) {
                    toRemove.push(corrId);
                }
            }

            // remove the timed out corrIds, and return a timeout error to the callers
            toRemove.forEach(function(corrId) {
                var map = self.callMap[corrId];
                if(map && map.callback) {
                    delete self.callMap[corrId];

                    Ext.cf.util.Logger.warn("RPC request has timed out as there was no reply from the server. Correlation Id:", corrId);
                    Ext.cf.util.Logger.warn("See documentation for Ext.io.Io.setup (rpcTimeoutDuration, rpcTimeoutCheckInterval) to configure the timeout check");

                    map.callback({ status:"error", description: "RPC request has timed out as there was no reply from the server" });
                }
            });
        } catch(e) {
            Ext.cf.util.Logger.error("Error running RPC timeout checks", e);
        }
    },

    /** 
     * Generate call id
     *
     */
    generateCallId: function() {
        return ++this.currentCallId;
    },

    /** 
     * Subscribe
     *
     * @param {Object} envelope
     *
     */
    subscribe: function(envelope) {
        // got a response envelope, now handle it
        this.callback(envelope.msg["corr-id"], envelope);
    },

    /** 
     * Dispatch
     *
     * @param {Object} envelope
     * @param {Function} callback
     *
     */
    dispatch: function(envelope, callbackFunction) {
        var self = this;

        var corrId = this.generateCallId();
        envelope.msg["corr-id"] = corrId;
        envelope.from = this.transport.getDeviceId();

        this.callMap[corrId] = { callback: callbackFunction, 
            requestTime: (new Date().getTime()),
            method: envelope.msg.method };

        // send the envelope
        this.transport.send(envelope, function(err, response) {
            if(err) { // couldn't even send the envelope
                self.callMap[corrId].callback({ status:"error", description: response.responseText });
                delete self.callMap[corrId];
            }
        }, this);
    },

    /** 
     * Callback
     *
     * @param {Number} correlation id
     * @param {Object} envelope
     *
     */
    callback: function(corrId, envelope) {
        var id = parseInt(corrId, 10);
        if (!this.callMap[id]) {
            Ext.cf.util.Logger.warn("No callback found for this correspondance id: " + corrId);
        } else {
            var map = this.callMap[id];
            var currentTime = new Date().getTime();
            var clientTime = currentTime - map.requestTime;
            var serverTime = envelope.debug === true ? (envelope.debugInfo.outTime - envelope.debugInfo.inTime) : 'NA';
            var networkTime = (serverTime === "NA") ? "NA" : (clientTime - serverTime);
            var apiName = envelope.service + "." + map.method;
            Ext.cf.util.Logger.perf(corrId, apiName, "total time", clientTime, 
                "server time", serverTime, "network time", networkTime);

            map.callback(envelope.msg.result);

            delete this.callMap[id];
        }
    },

    /** 
     * Call
     *
     * @param {Function} callback
     * @param {String} serviceName
     * @param {String} style
     * @param {String} method
     * @param {Array} args
     *
     */
    call: function(callbackFunction, serviceName, style, method, args) {

        var envelope;

        // register for rpc-direct receive calls
        this.transport.setListener("rpc", this.subscribe, this);

        // register for serviceName receive calls (subscriber rpc)
        this.transport.setListener(serviceName, this.subscribe, this);

        switch(style) {
            case "subscriber":
                envelope = {service: serviceName, from: this.transport.getDeviceId(), msg: {method: method, args: args}};
                this.dispatch(envelope, callbackFunction);
                break;
            case "direct":
                envelope = {service: 'rpc', from: this.transport.getDeviceId(), msg: {service: serviceName, method: method, args: args}};
                this.dispatch(envelope, callbackFunction);
                break;
            default:
                Ext.cf.util.Logger.error(style + " is an invalid RPC style. Should be 'direct' or 'subscriber'");
                throw "Invalid RPC style: " + style;
        }
    }

});

