/**
 * This class allows the client to make use of queues. A queue accepts messages which
 * are published to it and distributes a copy of the message to all of the registered
 * subscribers. Using this mechanism a client can send messages to other clients, with
 * the benefit that messages for offline clients will be stored on the Sencha.io
 * servers until they can be delivered.
 *
 * {@img queue1.png Class Diagram}
 *
 *       app.getQueue({
 *           params:{name:'rendezvous'},
 *           success:function(queue){
 *           
 *           }
 *       });
 *
 * ## Publish
 *
 * A message, which is a simple Javascript object, can be sent to a queue using the
 * `publish` method. If the device is offline then the message is queued locally in
 * a store.
 *
 *      Ext.io.Io.getQueue({
 *         params: {
 *           name: "table-123",
 *           category: "sports/poker",
 *           refresh: "1 day"
 *         },
 *         success: function(queue) {
 *           queue.publish({
 *             message: {casino:"royale"},
 *             success: function() {
 *          
 *             }   
 *           });
 *         }
 *       });     
 *
 * {@img queue2.png Publish}
 *
 * ## Subscribe
 *
 * To receive messages the client must subscribe to the queue. The device must be 
 * online when the call to subscribe is made in order for the client to register
 * its interest in the queue. Subsequently if the device goes offline then any
 * messages will be queued on the server for delivery when the device comes back
 * online.
 *
 * {@img queue3.png Subscribe}
 *
 * ## Unsubscribe
 *
 * Once a queue has been subscribed to, messages will be delivered until a subsequent
 * call to the unsubscribe method is made.
 *
 * ## Many Subscribers
 *
 * A queue can have multiple subscribers, and messages sent to the queue are delivered to each subscriber.
 * Messages published by a device are not sent back to the same device (i.e. echo is prevented)
 *
 * {@img queue4.png Many Subscribers}
 *
 *
 */
Ext.define('Ext.io.Queue', {
    extend: 'Ext.io.object.Object',
    
    name: null, // the name of the queue within the app

    qName: null, // the rabbitmq identifier of the queue (appId + "." + name)

    /**
     * @private
     *
     * Constructor
     *
     * @param {String} bucket
     * @param {String} key
     * @param {Object} data
     * @param {Object} messaging
     *
     */
    constructor: function(bucket, key, data, messaging) {
        this.superclass.constructor.call(this, bucket, key, data, messaging);
        this.name = data.name;
        this.qName = data.qName;

        return this;
    },

    /**
     * Publish a message to this queue.
     *
     * The message will be delivered to all devices subscribed to the queue.
     *
     *      Ext.io.Io.getQueue({
     *         params: {
     *           name: "table-123",
     *           category: "sports/poker",
     *           refresh: "1 day"
     *         },
     *         success: function(queue) {
     *           queue.publish({
     *             message: {casino:"royale"},
     *             success: function() {
     *          
     *             }   
     *           });
     *         }
     *       });     
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
    publish: function(options) {
        this.messaging.pubsub.publish(this.qName, this.key, options.message, function(err, response) {
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
     * Subscribe to receive messages from this queue.
     *
     * To receive messages from a queue, it is necessary to subscribe to the queue.
     * Subscribing registers interest in the queue and starts delivery of messages
     * published to the queue using the callback.
     *
     *
     *       Ext.io.Io.getQueue({
     *         params: {
     *           name: "table-123",
     *           category: "sports/poker",
     *           refresh: "1 day"
     *         },
     *         success: function(queue) {
     *           queue.subscribe({
     *             success: function(sender, message) {
     *             }
     *           });
     *         }
     *       });
     *
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after subscribing to this Queue.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {String} options.callback.from The sending Device ID.
     * @param {Object} options.callback.message A simple Javascript object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {String} options.success.from The sending Device ID.
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
        this.messaging.pubsub.subscribe(this.qName, this.key, function(from, message) {
            Ext.callback(options.callback, options.scope, [options, true, from, message]);
            Ext.callback(options.success, options.scope, [from, message, options]);
        }, this, function(err, response) {
            Ext.callback(options.callback, options.scope, [options, false, response]);
            Ext.callback(options.failure, options.scope, [response, options]);
        });
    },

    /**
     * Unsubscribe from receiving messages from this queue.
     *
     * Once a queue has been subscribed to, message delivery will continue until a call to unsubscribe is made.
     * If a device is offline but subscribed, messages sent to the queue will accumulate on the server,
     * to be delivered after the device reconnects at a later point of time.
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after unsubscribing from this Queue.
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
        this.messaging.pubsub.unsubscribe(this.qName, this.key, function(err, response) {
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
