/**
 * {@img app.png Class Diagram}
 *
 * The {@link Ext.io.App} class represents the web app itself. There is only one
 * app object, called the current app object. It is always available.
 *
 *          Ext.io.Io.getCurrentApp({
 *             success: function(app){
 *              
 *             } 
 *          });
 *
 * Methods are provided for navigation through the graph of objects available
 * to the currently running client code. 
 *
 */
Ext.define('Ext.io.App', {
    extend: 'Ext.io.object.Object',
    requires: [
        'Ext.io.object.Objects',
        'Ext.io.Queue'
    ],

    mixins: {
        picturedobject: 'Ext.io.object.PicturedObject'
    },

    statics: {

        appsObject: null,

        /**
         * @private
         *
         * Get Apps object.
         *
         * @return {Object} Apps Object
         *
         */
         getAppsObject: function() {
            if(!this.appsObject) {
                this.appsObject = Ext.create('Ext.io.object.Objects', 'Apps', Ext.io.Io.messaging);
            }             
            return this.appsObject;            
        },

        /**
         * @static
         * Get the current App object.
         *
         *          Ext.io.App.getCurrent({
         *              success: function(app){
         *              } 
         *          });
         *
         * The current App object is an instance of the {@link Ext.io.App} class. It represents
         * the web app itself. It is always available, and serves as the root of
         * the server side objects available to this client.
         *
         * @param {Object} options An object which may contain the following properties:
         *
         * @param {Function} options.callback The function to be called after getting the current App object.
         * The callback is called regardless of success or failure and is passed the following parameters:
         * @param {Object} options.callback.options The parameter to the API call.
         * @param {Boolean} options.callback.success True if the call succeeded.
         * @param {Object} options.callback.app The current {Ext.io.App} object if the call succeeded, else an error object.
         *
         * @param {Function} options.success The function to be called upon success.
         * The callback is passed the following parameters:
         * @param {Ext.io.App} options.success.app The current {Ext.io.App} object.
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
            var appId = Ext.io.Io.naming.getStore().getId('app');
            if (!appId) {
                var err = { code : 'NO_APP_ID', message: 'App ID not found' };
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                this.getAppsObject().get(appId, function(err, app) {
                    if(err) {
                        Ext.callback(options.callback, options.scope, [options, false, err]);
                        Ext.callback(options.failure, options.scope, [err, options]);
                    } else {
                        Ext.callback(options.callback, options.scope, [options, true, app]);
                        Ext.callback(options.success, options.scope, [app, options]);
                    }
                }, this);
            }
        },

        /** 
         * @private
         *
         * Get App Object
         *
         * @param {Object} options
         *
         */
        get: function(options) {
            this.getAppsObject().get(options.id, function(err, app) {
                if(err) {
                    Ext.callback(options.callback, options.scope, [options, false, err]);
                    Ext.callback(options.failure, options.scope, [err, options]);
                } else {
                    Ext.callback(options.callback, options.scope, [options, true, app]);
                    Ext.callback(options.success, options.scope, [app, options]);
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
     * Get the current user Group, if any.
     *
     * The current user Group object is an instance of {@link Ext.io.Group}. It represents
     * the group associated with the app. If the app is not associated with a group,
     * then there will no current group.
     *
     *          app.getGroup({
     *              success: function(group){
     *              } 
     *          });
     *
     * The group is used for registering and authenticating users, and for searching
     * for other users.
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after getting the Group object.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.group The {Ext.io.Group} object for the App if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.Group} options.success.group The {Ext.io.Group} object for the App.
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
        this.getSingleLink("Groups", null, null, "Ext.io.Group", function(err, group) {
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
     * @private
     * Register a new Device.
     * 
     * If the device does not already exist for the app then a new device is created,
     * and is returned as an instance of {@link Ext.io.Device}. The same device is now available
     * through the {@link Ext.io.getCurrentDevice}.
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Object} params Device attributes.
     * @param {Object} params.id
     * @param {Object} params.secret
     *
     * @param {Function} options.callback The function to be called after registering the device.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.device The {Ext.io.Device} if registration succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.User} options.success.device The registered device.
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
    register: function(options) {
        var self = this;
        this.messaging.getService({
            name: "AppService",
            success: function(service) {
                service.registerDevice(function(result) {
                    if (result.status == "success") {
                        var device = Ext.create('Ext.io.Device', result.value._bucket, result.value._key, result.value.data, self.messaging);
                        Ext.io.Io.naming.getStore().setId('device',device.id);
                        //Ext.io.Io.naming.getStore().setKey('device',device.key); // JCM secret? 
                        Ext.callback(options.callback, options.scope, [options, true, device]);
                        Ext.callback(options.success, options.scope, [device, options]);
                    } else {
                        var err = { code : 'CAN_NOT_REGISTER', message : 'Can not register this device' };
                        Ext.callback(options.callback, options.scope, [options, false, err]);
                        Ext.callback(options.failure, options.scope, [err, options]);
                    }
                }, self.key, options.params);
            },
            failure: function(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            }
        });
    },

    /**
     * @private
     * Authenticate an existing Device.
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Object} params Authentication credentials
     * @param {Object} params.id
     * @param {Object} params.secret
     *
     * @param {Function} options.callback The function to be called after authenticating the device.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.device The {Ext.io.User} if authentication succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.User} options.success.device The authenticated device.
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
    authenticate: function(options) {
        var self = this;
        this.messaging.getService({
            name: "AppService",
            success: function(service) {
                service.authenticateDevice(function(result) {
                    if (result.status == "success") {
                        var device = Ext.create('Ext.io.Device', result.value._bucket, result.value._key, result.value.data, self.messaging);
                        Ext.io.Io.naming.getStore().setId('device',device.id);
                        //Ext.io.Io.naming.getStore().setKey('device',device.key); // JCM secret? 
                        Ext.callback(options.callback, options.scope, [options, true, device]);
                        Ext.callback(options.success, options.scope, [device, options]);
                    } else {
                        var err = { code : 'DEVICE_AUTH_FAILED', message : 'Can not authenticate this device' };
                        Ext.callback(options.callback, options.scope, [options, false, err]);
                        Ext.callback(options.failure, options.scope, [err, options]);
                    }
                }, self.key, options.params);
            },
            failure: function(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            }
        });
    },

    /**
     * Find devices that match a query.
     * 
     * Returns all the device objects that match the given query. The query is a String
     * of the form name:value. For example, "city:austin", would search for all the
     * devices in Austin, assuming that the app is adding that attribute to all
     * its devices.
     * 
     *       user.findDevices({
     *           query:'city:austin',
     *           success:function(devices){
     *           }
     *       });
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Object} options.query
     *
     * @param {Function} options.callback The function to be called after finding the matching devices.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.devices The {Ext.io.Device[]} matching devices found for the App if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.Device[]} options.success.devices The matching devices found for the App.
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
    findDevices: function(options) {
        // JCM this could/should be this.getRelatedObject, but we don't have links from Apps to Devices
        Ext.io.Device.getDevicesObject().find(options.query, 0, 1000, function(err, devices) { // JCM 1000!
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
     * Get a named queue
     *
     * All instances of an app have access to the same
     * named queues. If an app gets the same named queue on many devices then
     * those devices can communicate by sending messages to each other. Messages 
     * are simple javascript objects, which are sent by publishing them through 
     * a queue, and are received by other devices that have subscribed to the 
     * same queue.
     *
     *          app.getQueue({
     *               params:{
     *                   name:music,
     *                   city:austin
     *               },
     *               success:function(queue){
     *               }
     *           });     
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Object} options.params Queue options may contain custom metadata in addition to the name, which is manadatory
     * @param {String} options.params.name Name of the queue
     *
     * @param {Function} options.callback The function to be called after getting the queue.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.queue The named {Ext.io.Queue} if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.Queue} options.success.queue The named queue.
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
    getQueue: function(options) {
        options.appId = this.key;
        this.messaging.getQueue(options);
    },

    /**
     * Find queues that match a query.
     * 
     * Returns all the queue objects that match the given query. The query is a String
     * of the form name:value. For example, "city:austin", would search for all the
     * queues in Austin, assuming that the app is adding that attribute to all
     * its queues. 
     * its devices.
     * 
     *       user.findQueues({
     *           query:'city:austin',
     *           success:function(queues){
     *           }
     *       });
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Object} options.query
     *
     * @param {Function} options.callback The function to be called after finding the matching queues.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.queues The {Ext.io.Queue[]} matching queues found for the App if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.Queue[]} options.success.queues The matching queues found for the App.
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
    findQueues: function(options) {
        this.findRelatedObjects("Queues", this.key, null, options.query, "Ext.io.Queue", function(err, queues) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, queues]);
                Ext.callback(options.success, options.scope, [queues, options]);
            }
        }, this);    
    },

    /** 
     * @private
     *
     * Create Version
     *
     * @param {Object} options
     *
     */
    createVersion: function(options) {
        var self = this;

        var errorCallback = function(err) {
            Ext.callback(options.callback, options.scope, [options, false, err]);
            Ext.callback(options.failure, options.scope, [err, options]);
        };

        if (typeof options.file != "undefined" && typeof options.data != "undefined") {
            options.file.ftype = 'package';
            self.messaging.sendContent({
                params:options.file,
                failure: function(err) {
                    errorCallback(err);
                },
                success: function(csId) {
                    options.data['package'] = csId; 
                    var tmp = options.file.name.split('.');
                    options.data.ext = "."+tmp[tmp.length - 1];
                    self.createRelatedEntity("createVersion", 'Ext.io.Version', options.data, function(err, version) {
                        if (version) {
                            Ext.callback(options.callback, options.scope, [options, true, version]);
                            Ext.callback(options.success, options.scope, [version, options]);
                        } else {
                            errorCallback(err || null);
                        }
                    }, self);
                }
            });
        } else {
            var err = { code : 'FILE_PARAMS_MISSED', message : 'File or data parameters are missed' };
            errorCallback(err);
        }
        
    },

    /** 
     * @private
     *
     * Get Team
     *
     * @param {Object} options
     *
     */
    getTeam: function(options) {
        this.getSingleLink("Teams", null, null, "Ext.io.Team", function(err, team) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, team]);
                Ext.callback(options.success, options.scope, [team, options]);
            }
        }, this);
    },

    /** 
     * @private
     *
     * Get deployed version
     *
     * @param {Object} options
     *
     */
    getDeployedVersion: function(options) {
        var tag = (typeof(options.env) != "undefined") ? ((options.env == 'dev') ? 'dev' : 'prod') : 'prod';
        this.getSingleLink("Versions", null, tag, "Ext.io.Version", function(err, version) {
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

