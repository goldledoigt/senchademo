/**
 * @private
 *
 */
Ext.define('Ext.cf.messaging.Transport', {
    requires: [
        'Ext.cf.messaging.EnvelopeWrapper',
        'Ext.cf.messaging.transports.PollingTransport',
        'Ext.cf.messaging.transports.SocketIoTransport'
    ],
    
    mixins: {
        observable: "Ext.util.Observable"
    },

    naming: null,

    transport: null,

    listeners: {},

    undeliveredIncomingStore: null,

    retryIncomingInProgress: false,

    undeliveredOutgoingStore: null,

    retryOutgoingInProgress: false,

    /** @private
    * Mapping of transport classes to short name
    * transportName provided by config used for transport lookup.
    */
    transportClasses: {
        "polling": 'Ext.cf.messaging.transports.PollingTransport',
        "socket": 'Ext.cf.messaging.transports.SocketIoTransport'
    },

    config: {
        url: 'http://msg.sencha.io',
        deviceId: '',
        piggybacking: true,
        maxEnvelopesPerReceive: 10,
        transportName: "socket",
        debug: false, /* pass debug flag to server in envelope */

        undeliveredIncomingRetryInterval: 5 * 1000, // every 5 secs
        undeliveredIncomingExpiryInterval: 60 * 60 * 24 * 1000, // 24 hours
        undeliveredIncomingMaxCount: 100, // max queue size after which we start dropping new messages

        undeliveredOutgoingRetryInterval: 5 * 1000, // every 5 secs
        undeliveredOutgoingExpiryInterval: 60 * 60 * 24 * 1000, // 24 hours
        undeliveredOutgoingMaxCount: 100 // max queue size after which we start dropping new messages
    },

    /** 
     * Constructor
     *
     * @param {Object} config
     * @param {Object} naming
     *
     */
    constructor: function(config, naming) {
        var self = this;

        this.initConfig(config);
        this.naming = naming;

        Ext.cf.util.Logger.info("Transport type ", this.getTransportName());

        var directory= Ext.io.Io.getStoreDirectory(); 
        if(directory) {
            this.undeliveredIncomingStore = Ext.create('Ext.data.Store', {
                model: 'Ext.cf.messaging.EnvelopeWrapper',
                proxy: {
                    type: 'localstorage', 
                    id: 'sencha-io-undelivered-incoming-envelopes'
                },
                autoLoad: true,
                autoSync: false
            });

            this.undeliveredOutgoingStore = Ext.create('Ext.data.Store', {
                model: 'Ext.cf.messaging.EnvelopeWrapper',
                proxy: {
                    type: 'localstorage', 
                    id: 'sencha-io-undelivered-outgoing-envelopes'
                },
                autoLoad: true,
                autoSync: false
            });

            directory.update("sencha-io-undelivered-incoming-envelopes", "queue", { direction: "in" });
            directory.update("sencha-io-undelivered-outgoing-envelopes", "queue", { direction: "out" });

            Ext.cf.util.Logger.info("Undelivered incoming retry interval: " + this.getUndeliveredIncomingRetryInterval());
            setInterval(function() {
                self.retryUndeliveredIncomingMessages();  
            }, this.getUndeliveredIncomingRetryInterval());

            Ext.cf.util.Logger.info("Undelivered outgoing retry interval: " + this.getUndeliveredOutgoingRetryInterval());
            setInterval(function() {
                self.retryUndeliveredOutgoingMessages();  
            }, this.getUndeliveredOutgoingRetryInterval());
        }else{
            Ext.cf.util.Logger.error("Store directory not initialized, skipping registration of Transport queues");
        }

        Ext.cf.util.Logger.debug("Transport config", Ext.encode(this.config));

        this.transport = Ext.create(this.transportClasses[this.getTransportName()], this.config);
        this.transport.start();
        this.transport.on('receive', function(envelope) { self.receive(envelope); });

        this.setupForbiddenStatusHandler();

        return this;
    },

    setupForbiddenStatusHandler: function() {
        var self = this;

        this.transport.on('forbidden', function(errorInfo) {
            try {
                // polling transport returns a string, so convert to JSON
                // socket transport retuns an object, so no conversion needed
                errorInfo = (typeof(errorInfo) === 'string') ? Ext.decode(errorInfo): errorInfo;

            } catch(e) {
                Ext.cf.util.Logger.warn('Error decoding Forbidden response details:', errorInfo);

                // can't do much, ignore and return
                return; 
            }

            if(errorInfo && errorInfo.code === 'INVALID_SID') {
                // One or more sids are invalid. Fire an event for each invalid Sid
                for(k in errorInfo.details) {
                    if(errorInfo.details[k] === 'INVALID') {
                        self.removeSidFromStores(k);
                        self.fireEvent(k + 'Invalid');
                    }
                }
            }
        });
    },

    removeSidFromStores: function(sid) {
        var idstore = this.naming.getStore();

        switch(sid) {
            case 'deviceSid':
                idstore.remove('device', 'sid');
                break;
            case 'developerSid':
                idstore.remove('developer', 'sid');
                break;
            case 'userSid':
                idstore.remove('user', 'sid');
                break;
            default:
                Ext.cf.util.warn('Unknown sid, cannot remove: ', sid);
                break;
        }
    },

    /** 
     * Retry undelivered outgoing messages
     *
     */
    retryUndeliveredOutgoingMessages: function() {
        var self = this;

        if(self.retryOutgoingInProgress) {
            Ext.cf.util.Logger.debug("Another retry (outgoing) already in progress, skipping...");
            return;
        }

        var pendingCount = this.undeliveredOutgoingStore.getCount();
        if(pendingCount > 0) {
            Ext.cf.util.Logger.debug("Transport trying redelivery for outgoing envelopes:", pendingCount);
        } else {
            return;
        }

        self.retryOutgoingInProgress = true;

        try {
            var now = new Date().getTime();
            var expiryInterval = self.getUndeliveredOutgoingExpiryInterval();

            // get the first envelope for redelivery
            var record = this.undeliveredOutgoingStore.getAt(0);
            var envelope = record.data.e;

            // Expiry based on age
            if((now - record.data.ts) > expiryInterval) {
                Ext.cf.util.Logger.warn("Buffered outgoing envelope is too old, discarding", record);
                this.undeliveredOutgoingStore.remove(record);
                self.undeliveredOutgoingStore.sync();
                self.retryOutgoingInProgress = false;
            } else {
                if(window.navigator.onLine) { // attempt redelivery only if browser says we're online
                    Ext.cf.util.Logger.debug("Transport trying redelivery for outgoing envelope: " + record);
                    self.transport.send(envelope, function(err, response, doBuffering) {
                        if(doBuffering) {
                            // could not be delivered again, do nothing
                            Ext.cf.util.Logger.debug("Redelivery failed for outgoing envelope, keeping it queued", record);

                            self.retryOutgoingInProgress = false;
                        } else {
                            // sent to server, now remove it from the queue
                            Ext.cf.util.Logger.debug("Delivered outgoing envelope on retry", record);
                            self.undeliveredOutgoingStore.remove(record);
                            self.undeliveredOutgoingStore.sync();
                            self.retryOutgoingInProgress = false;
                        }
                    });
                } else {
                    Ext.cf.util.Logger.debug("Browser still offline, not retrying delivery for outgoing envelope", record);  
                    self.retryOutgoingInProgress = false;
                }
            }
        } catch(e) {
            // if an exception occurs, ensure retryOutgoingInProgress is false
            // otherwise future retries will be skipped!
            self.retryOutgoingInProgress = false;

            Ext.cf.util.Logger.debug("Error during retryUndeliveredOutgoingMessages", e);
        }
    },

    /** 
     * Retry undelivered incoming messages
     *
     */
    retryUndeliveredIncomingMessages: function() {
        var self = this;

        if(self.retryIncomingInProgress) {
            Ext.cf.util.Logger.debug("Another retry (incoming) already in progress, skipping...");
            return;
        }

        self.retryIncomingInProgress = true;
        try {
            var now = new Date().getTime();
            var expiryInterval = self.getUndeliveredIncomingExpiryInterval();

            var undelivered = this.undeliveredIncomingStore.getRange();
            if(undelivered.length > 0) {
                Ext.cf.util.Logger.debug("Transport trying redelivery for incoming envelopes:", undelivered.length);
            }

            for(var i = 0; i < undelivered.length; i++) {
                var record = undelivered[i];
                var envelope = record.data.e;

                var map = this.listeners[envelope.service];
                if(map) {
                    map.listener.call(map.scope, envelope);
                    Ext.cf.util.Logger.debug("Delivered incoming envelope on retry", record);
                    this.undeliveredIncomingStore.remove(record);
                } else {
                    // Still can't deliver the message... see if the message is eligible for expiry
                    
                    // Expiry based on age
                    if((now - record.data.ts) > expiryInterval) {
                        Ext.cf.util.Logger.warn("Buffered incoming envelope is too old, discarding", record);
                        this.undeliveredIncomingStore.remove(record);
                    }
                }
            }
        } finally {
            // even if an exception occurs, sync the store and ensure retryIncomingInProgress is false
            // otherwise future retries will be skipped!
            this.undeliveredIncomingStore.sync();
            self.retryIncomingInProgress = false;
        }
    },

    /** 
     * Get Developer sid
     *
     * @return {String/Number} Developer Sid
     *
     */
    getDeveloperSid: function() {
        return this.naming ? this.naming.getStore().getSid('developer') : undefined;
    },

    /** 
     * Get Device sid
     *
     * @return {String/Number} Device Sid
     *
     */
    getDeviceSid: function() {
        return this.naming ? this.naming.getStore().getSid('device') : undefined;
    },

    /** 
     * Get user sid
     *
     * @return {String/Number} User Sid
     *
     */
    getUserSid: function() {
        return this.naming ? this.naming.getStore().getSid('user') : undefined;
    },

    /** 
     * Set listener
     *
     * @param {String} serviceName
     * @param {Object} listener
     * @param {Object} scope
     *
     */
    setListener: function(serviceName, listener, scope) {
        this.listeners[serviceName] = {listener:listener, scope:scope};
    },

    /** 
     * Remove listener
     *
     * @param {String} serviceName
     *
     */
    removeListener: function(serviceName) {
        delete this.listeners[serviceName];
    },

    /** 
     * Send to service
     *
     * @param {String} serviceName
     * @param {Object} payload
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    sendToService: function(serviceName, payload, callbackFunction, scope) {
        this.send({service: serviceName, msg: payload}, callbackFunction, scope);
    },

    /** 
     * Send to client
     *
     * @param {String/Number} targetClientId
     * @param {Object} payload
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    sendToClient: function(targetClientId, payload, callbackFunction, scope) {
        if(payload && typeof(payload) === "object") {
            payload.to = targetClientId;
            this.send({service: "courier", msg: payload}, callbackFunction, scope);
        } else {
            Ext.cf.util.Logger.error("Payload is not a JSON object");
            callbackFunction.call(scope, true, {status: "error", statusText: "Payload is not a JSON object"});
        }
    },

    /** 
     * Send
     *
     * @param {Object} envelope
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    send: function(envelope, callbackFunction, scope) {
        var self = this;

        if(this.getDebug()) {
            envelope.debug = true;
        }

        envelope.from = this.getDeviceId();

        // pass deviceSid if available
        var deviceSid = this.getDeviceSid();
        if(deviceSid) {
            envelope.deviceSid = deviceSid;  
        }

        // pass developerSid if available
        var developerSid = this.getDeveloperSid();
        if(developerSid) {
            envelope.developerSid = developerSid;  
        }
        
        // pass userSid if available
        var userSid = this.getUserSid();
        if(userSid) {
            envelope.userSid = userSid;  
        }
        

        Ext.cf.util.Logger.debug("Transport.send " + JSON.stringify(envelope));
        
        if(window.navigator.onLine) {
            // browser says we are online, which may or may not be true. Try delivery and see...
            this.transport.send(envelope, function(err, response, doBuffering) {
                if(callbackFunction) {
                    callbackFunction.call(scope, err, response, doBuffering);

                    // handling PollingTransport for now. TODO: handle socket transport
                    if(err && doBuffering) {
                        // could not send outgoing envelope. Buffer it!
                        Ext.cf.util.Logger.warn("Error delivering outgoing envelope", envelope, response);
                        self.bufferOutgoingEnvelope(envelope);
                    }
                }
            });
        } else {
            // Browser says we're offline, so we MUST be offline. Don't even bother sending
            self.bufferOutgoingEnvelope(envelope);
        }
    },

    /** 
     * Buffer outgoing envelope
     *
     * @param {Object} envelope
     *
     */
    bufferOutgoingEnvelope: function(envelope) {
        if(this.undeliveredOutgoingStore) {
            if(this.undeliveredOutgoingStore.getCount() < this.getUndeliveredOutgoingMaxCount()) {
                var record = this.undeliveredOutgoingStore.add(Ext.create('Ext.cf.messaging.EnvelopeWrapper', {e: envelope, ts: (new Date().getTime())}));
                this.undeliveredOutgoingStore.sync();
                Ext.cf.util.Logger.debug("Added to outgoing queue, will retry delivery later", record);
            } else {
                // queue is full, start dropping messages now
                Ext.cf.util.Logger.warn("Queue full, discarding undeliverable outgoing message!", envelope);
            }
        }
    },

    /** 
     * Receive
     *
     * @param {Object} envelope
     *
     */
    receive: function(envelope) {
        Ext.cf.util.Logger.debug("Transport.receive " + JSON.stringify(envelope));

        // dispatch it to the correct service listener
        if(this.listeners[envelope.service]) {
            var map = this.listeners[envelope.service];
            map.listener.call(map.scope, envelope);
        } else {
            Ext.cf.util.Logger.error("Transport.receive no listener for service '",envelope.service,"'.",this.listeners);

            // check current length of queue
            if(this.undeliveredIncomingStore) {
                if(this.undeliveredIncomingStore.getCount() < this.getUndeliveredIncomingMaxCount()) {
                    // add it to the undelivered store for trying delivery later
                    var record = this.undeliveredIncomingStore.add(Ext.create('Ext.cf.messaging.EnvelopeWrapper', {e: envelope, ts: (new Date().getTime())}));
                    Ext.cf.util.Logger.debug("Added to incoming queue, will retry delivery later", record);
                    
                    this.undeliveredIncomingStore.sync();      
                } else {
                    // queue is full, start dropping messages now
                    Ext.cf.util.Logger.warn("Queue full, discarding undeliverable incoming message!", envelope);
                }
            }
        }
    },

    /** 
     * Subscribe
     *
     * @param {String} serviceName
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    subscribe: function(serviceName, callbackFunction, scope) {
        Ext.cf.util.Logger.debug("Transport.subscribe " + serviceName);

        var params = { deviceId: this.getDeviceId(), service: serviceName };

        this.transport.subscribe(params, function(err, response) {
            if(callbackFunction){
                callbackFunction.call(scope, err, response);
            }
        });
    },

    /** 
     * Unsubscribe
     *
     * @param {String} serviceName
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    unsubscribe: function(serviceName, callbackFunction, scope) {
        Ext.cf.util.Logger.debug("Transport.unsubscribe " + serviceName);

        var params = { deviceId: this.getDeviceId(), service: serviceName };

        this.transport.unsubscribe(params, function(err, response) {
            if(callbackFunction){
                callbackFunction.call(scope, err, response);
            }
        });
    }
});
