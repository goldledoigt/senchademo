/**
 * {@img user.png Class Diagram}
 *
 * The {@link Ext.io.User} class represents a user. If the current app is associated
 * with a user group and that user group has been configured appropriatly,
 * then a current user object will be available for the user currently
 * using the app. Instances of this class are also used to represent other users
 * using the same app. We can communicate with them using this class.
 *
 *          Ext.io.Io.getCurrentUser({
 *             success: function(user){
 *              
 *             } 
 *          });
 *
 * Methods are provided for navigation through the graph of objects available
 * to the currently running client code.

 */
Ext.define('Ext.io.User', {
    extend: 'Ext.io.object.Object',

    requires: [
        'Ext.io.object.Objects',
        'Ext.io.Sender',
        'Ext.io.Store'
    ],
    
    statics: {

        usersObject: null,

        /**
         * @private
         *
         * Get Users object.
         *
         * @return {Object} Users Object
         *
         */
         getUsersObject: function() {
            if(!this.usersObject) {
                this.usersObject = Ext.create('Ext.io.object.Objects', 'Users', Ext.io.Io.messaging);
            }             
            return this.usersObject;            
        },

        /**
         * @static        
         * Get the current User, if any.
         *
         * The current User object is an instance of {@link Ext.io.User}. It represents
         * the user of the web app. If there is no group associated with the app,
         * then there will not be a current user object. If there is a group, and
         * it has been configured to authenticate users before download then the
         * current user object will be available as soon as the app starts running.
         * If the group has been configured to authenticate users within the app
         * itself then the current user object will not exist until after a
         * successful call to Ext.io.Group.authenticate has been made.
         *
         *          Ext.io.User.getCurrent({
         *              success: function(user){
         *              } 
         *          });
         *
         * @param {Object} options An object which may contain the following properties:
         *
         * @param {Function} options.callback The function to be called after getting the current User object.
         * The callback is called regardless of success or failure and is passed the following parameters:
         * @param {Object} options.callback.options The parameter to the API call.
         * @param {Boolean} options.callback.success True if the call succeeded.
         * @param {Object} options.callback.user The current {Ext.io.User} object if the call succeeded, else an error object.
         *
         * @param {Function} options.success The function to be called upon success.
         * The callback is passed the following parameters:
         * @param {Ext.io.User} options.success.user The current {Ext.io.User} object.
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
            var idstore = Ext.io.Io.naming.getStore();
            var userId = idstore.getId('user');
            var userSid = idstore.getSid('user');
            if (!userId) {
                var err = { code : 'NO_CURENT_USER', message : 'User ID not found' };
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else if (!userSid) {
                var err = { code : 'NO_CURENT_USER', message : 'User not authenticated' };
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                this.getUsersObject().get(userId, function(err, user) {
                    if(err) {
                        Ext.callback(options.callback, options.scope, [options, false, err]);
                        Ext.callback(options.failure, options.scope, [err, options]);
                    } else {
                        Ext.callback(options.callback, options.scope, [options, true, user]);
                        Ext.callback(options.success, options.scope, [user, options]);
                    }
                }, this);
            }
        },

        /**
         * @private
         * @static
         * Get User
         *
         * @param {Object} options
         *
         */
        get: function(options) {
            this.getUsersObject().get(options.id, function(err, user) {
                if(err) {
                    Ext.callback(options.callback, options.scope, [options, false, err]);
                    Ext.callback(options.failure, options.scope, [err, options]);
                } else {
                    Ext.callback(options.callback, options.scope, [options, true, user]);
                    Ext.callback(options.success, options.scope, [user, options]);
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
        this.userQueueName = bucket + '/' + key;
        // name of the user queue (inbox)
    },

    /**
     * Get all devices that belong to this user
     *
     *          user.getDevices({
     *              success: function(devices){
     *              } 
     *          });
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after getting the devices that belong to this user.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.devices The {Ext.io.Device[]} devices belonging to this User if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.Device[]} options.success.devices The devices belonging to this User.
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
    getDevices: function(options) {
        this.getRelatedObjects("Devices", null, "Ext.io.Device", function(err, devices) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, devices]);
                Ext.callback(options.success, options.scope, [devices, options]);
            }
        }, this);
    },

    /**
     * Get the user group that this user is a member of.
     *
     *          user.getGroup({
     *              success: function(group){
     *              } 
     *          });
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after getting the Group object.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.group The {Ext.io.Group} object for this User if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.Group} options.success.group The {Ext.io.Group} object for this User.
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
    getGroup: function(options) {
        this.getSingleLink("Groups", this.data.group, null, "Ext.io.Group", function(err, group) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, group]);
                Ext.callback(options.success, options.scope, [group, options]);
            }
        }, this);
    },

    /**
     * Send a message to this User.
     *
     *
     *        user.send({
     *            message: {fromDisplayName: 'John', text: 'Hello'},
     *            success: function(response,options) {
     *              console.log("sent a message:",options);
     *            }
     *        });
     *
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
     */
    send: function(options) {
        this.messaging.pubsub.publish(this.userQueueName, null, options.message, function(err, response) {
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
     * Receive messages for this User.
     *
     *      user.receive({
     *          success: function(sender, message) {
     *              console.log("received a message:", sender, message);
     *          }
     *      });
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after a message is received for this User.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {String} options.callback.from The sending Device ID.
     * @param {Object} options.callback.message A simple Javascript object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.Sender} options.success.sender The sending Device ID.
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
     */
    receive: function(options) {
        this.messaging.pubsub.subscribe(this.userQueueName, null, function(from, message) {
            var sender = Ext.create('Ext.io.Sender', from);
            Ext.callback(options.callback, options.scope, [options, true, sender, message]);
            Ext.callback(options.success, options.scope, [sender, message, options]);
        }, this, function(err, response) {
            Ext.callback(options.callback, options.scope, [options, false, response]);
            Ext.callback(options.failure, options.scope, [response, options]);
        });        
    },

    /**
     * Logout
     *
     */
    logout: function() {
        Ext.io.Io.naming.getStore().remove('user','sid');
        Ext.io.Io.naming.getStore().remove('user','id');
    },

    /**
     * Get a Store
     *
     * All instances of a user have access to the same stores. 
     *
     *          user.getStore({
     *               params:{
     *                   name:music,
     *                   city:austin
     *               },
     *               success:function(store){
     *               }
     *           });     
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Object} options.params Store options may contain custom metadata in addition to the name, which is manadatory
     * @param {String} options.params.name Name of the store
     *
     * @param {Function} options.callback The function to be called after getting the store.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.store The named {Ext.io.Queue} if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.Queue} options.success.store The store.
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
    getStore: function(options) {
        var self = this;
        var errResponse;
        self.messaging.getService({
            name: "naming-rpc",
            success: function(namingRpc) {
                namingRpc.getStore(function(result) {
                    if(result.status == "success") {
                        var store = Ext.create('Ext.io.Store', result.value._bucket, result.value._key, result.value.data, self);
                        Ext.callback(options.callback, options.scope, [options, true, store]);
                        Ext.callback(options.success, options.scope, [store, options]);
                    } else {
                        errResponse = { code: 'STORE_CREATE_ERROR', message: 'Store creation error' };
                        Ext.callback(options.callback, options.scope, [options, false, errResponse]);
                        Ext.callback(options.failure, options.scope, [errResponse, options]);
                    }
                }, self.key, options.params);
            },
            failure: function() {
                errResponse = { code: 'STORE_CREATE_ERROR', message: 'Store creation error' };
                Ext.callback(options.callback, options.scope, [options, false, errResponse]);
                Ext.callback(options.failure, options.scope, [errResponse, options]);
            }
        });

    },

    /**
     * Find stores that match a query.
     * 
     * Returns all the store objects that match the given query. The query is a String
     * of the form name:value. For example, "city:austin", would search for all the
     * stores in Austin, assuming that the app is adding that attribute to all
     * its stores. 
     *
     *       user.findStores({
     *           query:'city:austin',
     *           success:function(stores){
     *           }
     *       });
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Object} options.query
     *
     * @param {Function} options.callback The function to be called after finding the matching stores.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.stores The {Ext.io.Store[]} matching stores found for the App if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.Queue[]} options.success.stores The matching stores found for the App.
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
    findStores: function(options) {
        this.findRelatedObjects("DataStores", this.key, null, options.query, "Ext.io.Store", function(err, stores) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, stores]);
                Ext.callback(options.success, options.scope, [stores, options]);
            }
        }, this);    
    },

});
