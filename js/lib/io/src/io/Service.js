/**
 * @private
 * Instances of {@link Ext.io.Service} represent proxy object to async message based services running in the backend.
 * You can use the proxy to send async messages to the service, to receive async messages from the service,
 * and if the service is a PubSub type of service, to subscribe/unsubscribe to updates from the service.
 *
 * For example:
 *
 *     Ext.io.getService("weather", function(weatherService) {
 *         weatherService.send({temperature: temperature}, function() {
 *             display("Weather Sensor: sent temperature update " + temperature);
 *         }, this);
 *     });
 *
 *
 *     Ext.io.getService("weather", function(weatherService) {
 *         weatherService.subscribe(function(service, msg) {
 *             display(service + " got temperature update: " + msg.temperature);
 *         }, this, function(err, response) {
 *             console.log("Error during subscribe!");
 *         });
 *     });
 *
 */
Ext.define('Ext.io.Service', {

    config: {
        /**
         * @cfg name
         * @accessor
         */
        name: null,

        /**
         * @cfg descriptor
         * @accessor
         * @private
         */
        descriptor: null,

        /**
         * @cfg transport
         * @accessor
         * @private
         */
        transport: null,
    },

    /**
     * @private
     *
     * Constructor
     *
     * @param {String} name
     * @param {Object} descriptor
     * @param {Object} transport
     *
     */
    constructor: function(config) {
        this.initConfig(config);
        return this;
    },

    /**
     * Send an async message to the service
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Object} options.message A simple Javascript object.
     *
     * @param {Function} options.callback The function to be called after sending the message to the server for delivery.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.response A response object from the server to the API call.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Object} options.success.response A response object from the server to the API call.
     * @param {Object} options.success.options The parameter to the API call.
     *
     * @param {Function} options.failure The function to be called upon failure.
     * The callback is passed the following parameters:
     * @param {Object} options.failure.error An error object.
     * @param {Object} options.failure.options The parameter to the API call.
     *
     * @param {Object} options.scope The scope in which to execute the callbacks: The "this" object for
     * the callback function.
     *
     */
    send: function(options) {
        this.getTransport().sendToService(this.getName(), options.message, function(err, response) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, response]);
                Ext.callback(options.failure, options.scope, [response, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, response]);
                Ext.callback(options.success, options.scope, [response, options]);
            }
        }, this);
    },

    /**
     * Receive async messages from the service
     *
     * For PubSub type of services, which need subscription to start getting messages, see the 'subscribe' method.
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after receiving a message from this service.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {String} options.callback.from the service the message originated from, i.e. the name of this service.
     * @param {Object} options.callback.message A simple Javascript object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {String} options.success.from the service the message originated from, i.e. the name of this service.
     * @param {Object} options.success.message A simple Javascript object.
     * @param {Object} options.success.options The parameter to the API call.
     *
     * @param {Function} options.failure The function to be called upon failure.
     * The callback is passed the following parameters:
     * @param {Object} options.failure.error An error object.
     * @param {Object} options.failure.options The parameter to the API call.
     *
     * @param {Object} options.scope The scope in which to execute the callbacks: The "this" object for
     * the callback function.
     *
     */
    receive: function(options) {
        this.getTransport().setListener(this.getName(), function(envelope) {
            Ext.callback(options.callback, options.scope, [options, true, envelope.from, envelope.msg]);
            Ext.callback(options.success, options.scope, [envelope.from, envelope.msg, options]);
        }, this);
    },

    /**
     * Subscribe to receive messages from this service.
     *
     * This method must be used only for PubSub type of services.
     * Some services do not need subscription for delivering messages. Use 'receive' to get messages
     * from such services.
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after receiving a message from this service.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {String} options.callback.from the service the message originated from, i.e. the name of this service.
     * @param {Object} options.callback.message A simple Javascript object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {String} options.success.from the service the message originated from, i.e. the name of this service.
     * @param {Object} options.success.message A simple Javascript object.
     * @param {Object} options.success.options The parameter to the API call.
     *
     * @param {Function} options.failure The function to be called upon failure.
     * The callback is passed the following parameters:
     * @param {Object} options.failure.error An error object.
     * @param {Object} options.failure.options The parameter to the API call.
     *
     * @param {Object} options.scope The scope in which to execute the callbacks: The "this" object for
     * the callback function.
     *
     */
    subscribe: function(options) {
        var self = this;

        self.transport.subscribe(self.name, function(err, response) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, response]);
                Ext.callback(options.failure, options.scope, [response, options]);
            } else {
                self.transport.setListener(self.name, function(envelope) {
                    Ext.callback(options.callback, options.scope, [options, true, envelope.service, envelope.msg]);
                    Ext.callback(options.success, options.scope, [envelope.service, envelope.msg, options]);
                }, self);
            }
        }, self);
    },

    /**
     * Unsubscribe from receiving messages from this service.
     *
     * This method must be used only for PubSub type of services.
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after unsubscribing from this service.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.response A response object from the server to the API call.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Object} options.success.response A response object from the server to the API call.
     * @param {Object} options.success.options The parameter to the API call.
     *
     * @param {Function} options.failure The function to be called upon failure.
     * The callback is passed the following parameters:
     * @param {Object} options.failure.error An error object.
     * @param {Object} options.failure.options The parameter to the API call.
     *
     * @param {Object} options.scope The scope in which to execute the callbacks: The "this" object for
     * the callback function.
     *
     */
    unsubscribe: function(options) {
        Ext.io.Io.messaging.transport.unsubscribe(this.getName(), function(err, response) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, response]);
                Ext.callback(options.failure, options.scope, [response, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, response]);
                Ext.callback(options.success, options.scope, [response, options]);
            }
        }, this);
    }
});
