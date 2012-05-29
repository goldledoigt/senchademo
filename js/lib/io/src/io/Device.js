/**
 * {@img device.png Class Diagram}
 *
 * The {@link Ex.io.Device} class represents the device on which an app instance
 * is running. There is a current device object, for the client code
 * currently running, and is always available. Instances of this class are
 * also used to represent other devices running the same app. We can
 * communicate with them using this class.
 *
 *          Ext.io.Io.getCurrentDevice({
 *             success: function(device){
 *              
 *             } 
 *          });
 *
 * Methods are provided for navigation through the graph of objects available
 * to the currently running client code.
 */
Ext.define('Ext.io.Device', {
    extend: 'Ext.io.object.Object',

    requires: [
        'Ext.io.object.Objects',
    ],

    statics: {

        devicesObject: null,

        /**
         * @private
         * @static
         * Get Devices object.
         *
         * @return {Object} Devices Object
         *
         */
         getDevicesObject: function() {
            if(!this.devicesObject) {
                this.devicesObject = Ext.create('Ext.io.object.Objects', 'Devices', Ext.io.Io.messaging);
            }             
            return this.devicesObject;            
        },

        /**
         * @static
         * Get the current Device object.
         *
         *          Ext.io.Device.getCurrent({
         *              success: function(device){
         *              } 
         *          });
         *
         * The current Device object is an instance of {@link Ext.io.Device} class. It represents
         * the device that this web app is running on. It is always available.
         *
         * @param {Object} options An object which may contain the following properties:
         *
         * @param {Function} options.callback The function to be called after getting the current Device object.
         * The callback is called regardless of success or failure and is passed the following parameters:
         * @param {Object} options.callback.options The parameter to the API call.
         * @param {Boolean} options.callback.success True if the call succeeded.
         * @param {Object} options.callback.device The current {Ext.io.Device} object if the call succeeded, else an error object.
         *
         * @param {Function} options.success The function to be called upon success.
         * The callback is passed the following parameters:
         * @param {Ext.io.Device} options.success.device The current {Ext.io.Device} object.
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
        getCurrent: function(options) {
            var deviceId = Ext.io.Io.naming.getStore().getId('device');
            if (!deviceId) {
                var err = { code : 'NO_DEVICE_ID', message: 'Device ID not found' };
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                this.getDevicesObject().get(deviceId, function(err, device) {
                    if(err) {
                        Ext.callback(options.callback, options.scope, [options, false, err]);
                        Ext.callback(options.failure, options.scope, [err, options]);
                    } else {
                        Ext.callback(options.callback, options.scope, [options, true, device]);
                        Ext.callback(options.success, options.scope, [device, options]);
                    }
                }, this);
            }
        },

        /**
         * @private
         * @static
         * Get Device
         *
         * @param {Object} options
         *
         */
        get: function(options) {
            this.getDevicesObject().get(options.id, function(err, device) {
                if(err) {
                    Ext.callback(options.callback, options.scope, [options, false, err]);
                    Ext.callback(options.failure, options.scope, [err, options]);
                } else {
                    Ext.callback(options.callback, options.scope, [options, true, device]);
                    Ext.callback(options.success, options.scope, [device, options]);
                }
            }, this);
        }
    },

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
    },

    /**
     * Get the App associated with this Device.
     *
     *          device.getApp({
     *              success: function(app){
     *              } 
     *          });
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after getting the App object.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.app The {Ext.io.App} associated with this Device if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.App} options.success.app The {Ext.io.App} object associated with this Device.
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
    getApp: function(options) {
        this.getSingleLink("Versions", this.data.version, null, "Ext.io.Version", function(err, version) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                version.getSingleLink("Apps", null, null, "Ext.io.App", function(err, app) {
                    if(err) {
                        Ext.callback(options.callback, options.scope, [options, false, err]);
                        Ext.callback(options.failure, options.scope, [err, options]);
                    } else {
                        Ext.callback(options.callback, options.scope, [options, true, app]);
                        Ext.callback(options.success, options.scope, [app, options]);
                    }
                }, this);
            }
        }, this);
    },

    /**
     * Get the User associated with this Device, if any.
     *
     *          device.getUser({
     *              success: function(user){
     *              } 
     *          });
     *
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after getting the User object.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.user The {Ext.io.User} associated with this Device if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.User} options.success.user The {Ext.io.User} object associated with this Device.
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
    getUser: function(options) {
        this.getSingleLink("Users", null, null, "Ext.io.User", function(err, user) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, user]);
                Ext.callback(options.success, options.scope, [user, options]);
            }
        }, this);
    },

    /**
     * Send a message to this Device.
     *
     * The send method allow messages to be sent to another device. The message
     * is a simple Javascript object. The message is queued on the server until
     * the destination device next comes online, then it is delivered.
     *
     *        device.send({
     *            message: {city: 'New York', state: 'NY'},
     *            success: function(response,options) {
     *              console.log("sent a message:",options);
     *            }
     *        });
     *
     * See receive for receiving these device to device messages.
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
        this.messaging.transport.sendToClient(this.key, options.message, function(err, response) {
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
     * Receive messages for this Device.
     *
     * To receive messages sent directly to a device the app must use this
     * method to register a handler function. Each message is passed to the
     * callback function as it is received. The message is a simple Javascript
     * object.
     *
     *      user.receive({
     *          success: function(sender, message) {
     *              console.log("received a message:", sender, message);
     *          }
     *      });
     *
     * See send for sending these device to device messages.
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after receiving a message for this Device.
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
    receive: function(options) {
        this.messaging.transport.setListener("courier", function(envelope) {
            Ext.callback(options.callback, options.scope, [options, true, envelope.from, envelope.msg]);
            Ext.callback(options.success, options.scope, [envelope.from, envelope.msg, options]);
        }, this);
    },

    /**
     * @private
     *
     * Get Version
     *
     * @param {Object} options
     *
     */
    getVersion: function(options) {
        this.getSingleLink("Versions", this.data.version, null, "Ext.io.Version", function(err, version) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, version]);
                Ext.callback(options.success, options.scope, [version, options]);
            }
        }, this);
    },

});
