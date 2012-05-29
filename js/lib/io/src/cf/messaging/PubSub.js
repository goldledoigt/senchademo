/**
 * @private
 *
 */
Ext.define('Ext.cf.messaging.PubSub', {
    
    queueCallbackMap: {},

    transport: null,

    config: {

    },

    /** 
     * Constructor
     *
     * @param {Object} config
     * @param {Object} transport
     *
     */
    constructor: function(config, transport) {
        this.initConfig(config);
        this.transport = transport;

        return this;
    },

    /** 
     * Handle incoming envelope
     *
     * @param {Object} envelope
     *
     */
    handleIncoming: function(envelope) {
        var queueName = envelope.msg.queue;
        if(queueName && this.queueCallbackMap[queueName]) {
            var item = this.queueCallbackMap[queueName];
            var sender = {
              deviceId: envelope.from,
              userId: envelope.userId
            };
            item.callback.call(item.scope,sender,envelope.msg.data);
        } else {
            Ext.cf.util.Logger.warn("PubSub: No callback for queueName " + queueName);
        }
    },

    /** 
     * Publish
     *
     * @param {String} queueName
     * @param {String} qKey
     * @param {Object} data
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    publish: function(queueName, qKey, data, callbackFunction, scope) {
        this.transport.send({service:"client-pubsub", msg:{api:"publish", queue:queueName, 
            qKey: qKey, data:data}}, callbackFunction, scope);
    },

    /** 
     * Subscribe
     *
     * @param {String} queueName
     * @param {String} qKey
     * @param {Function} callback
     * @param {Object} scope
     * @param {Function} errCallback
     *
     */
    subscribe: function(queueName, qKey, callbackFunction, scope, errCallbackFunction) {
        var self = this;

        this.transport.setListener("client-pubsub", this.handleIncoming, this);

        this.transport.send({service:"client-pubsub", msg:{api:"subscribe", queue:queueName, qKey: qKey}}, function(err, response) {
            if(err) {
                if (errCallbackFunction) {
                    errCallbackFunction.call(scope, err, response);
                }
            } else {
                self.queueCallbackMap[queueName] = {callback:callbackFunction,scope:scope};
                Ext.cf.util.Logger.info("client-pubsub: " + self.transport.getDeviceId() + " subscribed to " + queueName);
            }
        }, this);
    },

    /** 
     * Unsubscribe
     *
     * @param {String} queueName
     * @param {String} qKey
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    unsubscribe: function(queueName, qKey, callbackFunction, scope) {
        var self = this;

        delete this.queueCallbackMap[queueName];
        this.transport.send({service:"client-pubsub", msg:{api:"unsubscribe", queue:queueName, qKey: qKey}}, function(err, response) {
            Ext.cf.util.Logger.info("client-pubsub: " + self.transport.getDeviceId() + " unsubscribed to " + queueName);
            if(callbackFunction){
                callbackFunction.call(scope, err, response);
            }
        }, this);
    }
});

