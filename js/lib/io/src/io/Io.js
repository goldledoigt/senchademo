Ext.setVersion('sio', '0.1.3');
/**
 * @class Ext.io.Io
 * @singleton
 *
 * {@img io.png Class Diagram}
 *
 * Ext.io is the namespace for the Sencha.io SDK. The Ext.io.Io class is a singleton that
 * both initializes the Sencha.io client, and provides useful methods for accessing all
 * Sencha.io services.
 *
 * At the start of your app you should call the `setup` and `init` method. 
 * 
 * Calling `setup` is not mandatatory if the app is being served by sencha.io, as it
 * will provide the app with its configuration information when it is served. But
 * for development purposes, and for app deployment through other services, both
 * the App Id and App Secret should be passed through the `setup` method.
 *
 *     Ext.setup({
 *         //logLevel: 'debug',
 *         appId: 'DsmMwW3b0hrUT5SS2n2TYwSR6nY',
 *         appSecret: 'WucvCx3Wv1P3'
 *     })
 *
 * There are additional configuration options, which are documented in the Ext.io.Io.setup
 * method.
 *
 *
 * Calling `init` is not mandatorym as Sencha.io will lazily initialize intself, but it is
 * better for the app explicitly initialize it.
 *
 *     Ext.io.Io.init(function(){
 *         // your app code
 *     });
 *
 * This class has has static methods to get the current {@link Ext.io.App}, {@link Ext.io.Device}, 
 * {@link Ext.io.Group} and {@link Ext.io.User} objects. Every app has a current App
 * and a current Device object. Only apps that have been configured with a Group have
 * a current Group object. And only apps that have a Group and have authenticated the
 * user will have a current User object. 
 *
 * A factory method is available for creating a {@link Ext.io.Queue} through which messages 
 * can be passed between clients.
 * 
 */
Ext.define('Ext.io.Io', {
    requires: (function() {
        var classesToRequire = [
            'Ext.cf.Overrides',
            'Ext.cf.naming.Naming',
            'Ext.cf.messaging.DeviceAllocator',
            'Ext.cf.messaging.Messaging',
            'Ext.cf.util.Logger',
            'Ext.io.Group',
            'Ext.io.User',
            'Ext.io.App',
            'Ext.io.Device',
            'Ext.io.Queue',
            'Ext.io.data.Proxy'
        ];

        var extjsVersion = Ext.getVersion("extjs");
        if(!extjsVersion) {
            classesToRequire.push('Ext.io.data.Directory');
        }

        return classesToRequire;
        })(),

    statics: {

    config: {
        url: 'http://msg.sencha.io:80'
    },

    /**
     * @private
     */
    naming: undefined,

    /**
     * @private
     */
    messaging: undefined,

    /**
     * @private
     */
    storeDirectory: undefined,

    /**
     * Setup Ext.io for use.
     *
     *     Ext.setup({
     *         logLevel: 'debug'
     *     })     
     *
     * @param {Object} config
     * @param {String} config.appId
     * @param {String} config.url the server URL. Defaults to http://msg.sencha.io
     * @param {String} config.logLevel logging level. Should be one of "none", "debug", "info", "warn" or "error". Defaults to "error".
     * @param {String} config.transportName the transport type to use for communicating with the server. Should be one of "polling" (HTTP polling) or "socket" (SocketIO). Defaults to "polling".
     * @param {Boolean} config.piggybacking for "polling" transport, if HTTP responses can carry piggybacked envelopes from the server. Defaults to true.
     * @param {Number} config.maxEnvelopesPerReceive for "polling" transport, the maximum number of envelopes to return in one poll request. Defaults to 10.
     * @param {Number} config.pollingDuration for "polling" transport, the duration in milliseconds between poll requests. Defaults to 5 seconds.
     * @param {Number} config.rpcTimeoutDuration for RPC calls, the maximum time to wait for a reply from the server, after which an error is returned to the caller. Defaults to 60 seconds.
     * @param {Number} config.rpcTimeoutCheckInterval how often the RPC timeout check should be performed. Defaults to 5 seconds.
     *
     * Calling this method is optional. We assume the above defaults otherwise.
     */
    setup: function(config) {
        Ext.apply(Ext.io.Io.config, config);
        if (Ext.io.Io.config.logLevel) {
            Ext.cf.util.Logger.setLevel(Ext.io.Io.config.logLevel);
        }
    },

    callbacks: [], // Nothing much can happen until Ext.io.Io.init completes, so we queue up all the requests until after it has completed

    /**
     *
     * Explicitly initialize Sencha.io
     *
     *     Ext.io.Io.init(function(){
     *         // your app code
     *     });
     *
     */
    init: function(callback,scope) {
        var self = this;

        if (Ext.io.Io.config.logLevel) {
            Ext.cf.util.Logger.setLevel(Ext.io.Io.config.logLevel);
        }

        //
        // We only allow init to be called once.
        //
        if(self.initializing) {
            if(callback){
                this.callbacks.push([callback,scope]); // call this callback once initialization is complete
            }else{
                Ext.cf.util.Logger.warn("A call to Ext.io.Io.init is already in progress. It's better to always provide a init with a callback, otherwise calls into Ext.io may fail.");
            }
            return;
        }
        if(self.initialized) {
            if(callback){
                callback.call(scope);
            }
            return;
        }
        self.initializing= true;
        if(!callback) {
            Ext.cf.util.Logger.warn("Ext.io.Io.init can be called without a callback, but calls made into Ext.io before init has completed, may fail.");
        }

        // 
        // Instantiate the naming service proxy.
        //
        Ext.io.Io.naming = Ext.create('Ext.io.Naming', Ext.io.Io.config);

        // JCM we need to check if we are online,
        // JCM if not... we will not be able to get all the bits we need
        // JCM and when the device does get online, then the app is not
        // JCM going to be able to communicate... so it should really
        // JCM run through this bootstrapping process again.... 

        this.initDeveloper(function(){
            this.initApp(function(){
                this.initDevice(function(){
                    this.initMessaging(function(){
                        this.initGroup(function(){
                            this.initUser(function() {
                                self.initialized= true;
                                self.initializing= false;
                                if(callback) {
                                    callback.call(scope);  
                                }
                                for(var i=0;i<this.callbacks.length;i++){
                                    callback = this.callbacks[i];
                                    callback[0].call(callback[1]);
                                }
                            },this)
                        },this)
                    },this)
                },this)
            },this)
        },this);
    },

    /**
     * @private
     *
     * initDeveloper
     *
     */
    initDeveloper: function(callback,scope) {
        var idstore = Ext.io.Io.naming.getStore();
        idstore.stash('developer','id');
        callback.call(scope);
    },

    /**
     * @private
     *
     * initApp
     *
     */
    initApp: function(callback,scope) {
        //
        // Every App has an Id and a Secret.
        //
        var idstore = Ext.io.Io.naming.getStore();
        var appId= idstore.stash('app','id',Ext.io.Io.config.appId);
        if (!appId) {
            Ext.cf.util.Logger.error('Could not find App Id.');
            Ext.cf.util.Logger.error('The App Id is either provided by senchafy.com when the App is served, or can be passed through Ext.io.Io.setup({appId:id,appSecret:secret})');
        }
        var appSecret= idstore.stash('app','secret',Ext.io.Io.config.appSecret);
        if (!appSecret) {
            Ext.cf.util.Logger.error('Could not find App Secret.');
            Ext.cf.util.Logger.error('The App Secret is either provided by senchafy.com when the App is served, or can be passed through Ext.io.Io.setup({appId:id,appSecret:secret})');
        }
        callback.call(scope);
    },

    /**
     * @private
     *
     * initDevice
     *
     */
    initDevice: function(callback, scope) {
        //
        // If a device id was passed throuh the call to setup, then we use that.
        // Otherwise we check for them in the id store, as they may have been
        // stashed there, or provided by the web server. 
        //
        var idstore = Ext.io.Io.naming.getStore();
        if(this.config.deviceId) {
            idstore.setId('device', this.config.deviceId);
            if(this.config.deviceSid) {
                idstore.setSid('device', this.config.deviceSid);
            }
            Ext.cf.util.Logger.debug("Ext.io.Io.setup provided the device id",this.config.deviceId);
            callback.call(scope);
        } else {
            var deviceSid = idstore.getSid('device');
            var deviceId = idstore.getId('device');
            if(deviceSid && deviceId) {
                this.authenticateDevice(deviceSid, deviceId, callback, scope);
            } else {
                this.registerDevice(callback, scope);
            }
        }
    },

    /**
     * @private
     *
     * initMessaging
     *
     */
    initMessaging: function(callback,scope) {
        var idstore = Ext.io.Io.naming.getStore();
        /*
         * Every App has a messaging endpoint URL. 
         * The URL is provided by senchafy.com when the App is served,
         * or is passed through Ext.io.Io.setup({url:url}), or it defaults
         * to 'http://msg.sencha.io'
         */
         // JCM should check that the url is really a url, and not just a domain name... 
        Ext.io.Io.config.url = idstore.stash("msg", "server", Ext.io.Io.config.url);
        /* 
         * Instantiate the messaging service proxies.
         */
        this.config.deviceId= idstore.getId('device');
        this.config.deviceSid= idstore.getSid('device');
        Ext.io.Io.messaging = Ext.create('Ext.cf.messaging.Messaging', this.config, Ext.io.Io.naming);
        Ext.io.Io.naming.setMessaging(Ext.io.Io.messaging);
        callback.call(scope);
    },

    /**
     * @private
     *
     * initGroup
     *
     */
    initGroup: function(callback,scope) {
        // 
        // If an App is associated with a Group, then senchafy.com provides the group id.
        //
        var idstore = Ext.io.Io.naming.getStore();
        if(this.config.groupId) {
            idstore.setId('group', this.config.groupId);
            callback.call(scope);
        }else{
            idstore.stash('group','id');
            this.config.groupId = idstore.getId('group');
            if(!this.config.groupId) {
                Ext.io.App.getCurrent({
                    success: function(app){
                        app.getGroup({
                            success: function(group){
                                this.config.groupId= group? group.key : null;
                                idstore.setId('group', this.config.groupId);
                            },
                            callback: callback,
                            scope: scope
                        });
                    },
                    failure: callback,
                    scope: scope
                });
            }else{
                callback.call(scope);
            }
        }
    },

    /**
     * @private
     *
     * initUser
     *
     */
    initUser: function(callback,scope) {
        // 
        // If an App is associated with a Group which is configured for on-the-web user auth
        // then senchafy.com provides the user id.
        //
        var idstore = Ext.io.Io.naming.getStore();
        idstore.stash('user','id');
        callback.call(scope);
    },

    /**
     * @private
     *
     * registerDevice
     *
     */
    registerDevice: function(callback,scope) {
        var self = this;
        var idstore = Ext.io.Io.naming.getStore();
        Ext.cf.messaging.DeviceAllocator.register(this.config.url, this.config.appId, function(response) {
            if(response.status === "success") {
                Ext.cf.util.Logger.debug("registerDevice", "succeeded", response);
                idstore.setId("device", response.result.deviceId);
                idstore.setSid("device", response.result.deviceSid);
                callback.call(scope);
            } else {
                var errorMessage = "Registering device failed. Please check if the appId is valid: " + self.config.appId;
                Ext.cf.util.Logger.error("registerDevice", errorMessage, response);
                throw errorMessage;
            }
        });
    },

    /**
     * @private
     *
     * authenticateDevice
     *
     */
    authenticateDevice: function(deviceSid, deviceId, callback, scope) {
        var self = this;
        Ext.cf.messaging.DeviceAllocator.authenticate(this.config.url, deviceSid, deviceId, function(response) {
            if(response.status === "success") {
                Ext.cf.util.Logger.debug("authenticateDevice", "succeeded", response);
                callback.call(scope);
            } else {
                Ext.cf.util.Logger.warn("authenticateDevice", "failed, re-registering device", response);
                self.registerDevice(callback,scope);
            }
        });
    },

    /**
     * The Store Directory contains a list of all known stores,
     * both local and remote.
     */
    getStoreDirectory: function() {
        if(!Ext.io.Io.storeDirectory){
            try {
                Ext.io.Io.storeDirectory = Ext.create('Ext.io.data.Directory', {});
            } catch(e) {
                Ext.cf.util.Logger.error("SIO data directory could not be created");
            }
        }
        return Ext.io.Io.storeDirectory;
    },

    /**
     * Get the current App.
     *
     * The current App object is an instance of the {@link Ext.io.App} class. It represents
     * the web app itself. It is always available, and serves as the root of
     * the server side objects available to this client.
     *
     *          Ext.io.Io.getCurrentApp({
     *             success: function(app){
     *              
     *             } 
     *          });
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
     */
    getCurrentApp: function(options) {
        Ext.io.Io.init(function() {
            Ext.io.App.getCurrent(options);    
        });
    },

    /**
     * Get the current Device.
     *
     * The current Device object is an instance of {@link Ext.io.Device} class. It represents
     * the device that this web app is running on. It is always available.
     *
     *          Ext.io.Io.getCurrentDevice({
     *             success: function(device){
     *              
     *             } 
     *          });
     *
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
    getCurrentDevice: function(options) {
        Ext.io.Io.init(function() {
            Ext.io.Device.getCurrent(options);
        });
    },

    /**
     * Get the current user Group, if any.
     *
     * The current user Group object is an instance of {@link Ext.io.Group}. It represents
     * the group associated with the app. If the app is not associated with a group,
     * then there will no current group.
     *
     *          Ext.io.Io.getCurrentGroup({
     *             success: function(group){
     *              
     *             } 
     *          });
     *
     * The group is used for registering and authenticating users, and for searching
     * for other users.
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after getting the current Group object.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.group The current {Ext.io.Group} object if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.Group} options.success.group The current {Ext.io.Group} object.
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
    getCurrentGroup: function(options) {
        Ext.io.Io.init(function() {
            Ext.io.Group.getCurrent(options);
        });
    },

    /**
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
     *          Ext.io.Io.getCurrentUser({
     *             success: function(user){
     *              
     *             } 
     *          });
     *     
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
    getCurrentUser: function(options) {
        Ext.io.Io.init(function() {
            Ext.io.User.getCurrent(options);
        });
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
     *          Ext.io.Io.getQueue({
     *               params:{
     *                   name:music,
     *                   city:austin
     *               },
     *               success:function(queue){
     *               }
     *           });     
     *
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
     * @param {Object} options.callback.queue An {Ext.io.Queue} object if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.Queue} options.success.queue An {Ext.io.Queue} object.
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
        Ext.io.Io.init(function() {
            Ext.io.App.getCurrent({
                success: function(app) {
                    app.getQueue(options);
                },
                failure: function(errResponse) {
                    Ext.callback(options.callback, options.scope, [options, false, errResponse]);
                    Ext.callback(options.failure, options.scope, [errResponse, options]);
                }
            });
        });
    },

    /**
     * @private
     * Get a proxy interface for a service.
     *
     * For RPC services, an instance of {@link Ext.io.Proxy} is returned, whereas for
     * async message based services, an instance of {@link Ext.io.Service} is returned.
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {String} options.name Name of the service
     *
     * @param {Function} options.callback The function to be called after getting the service.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.service An {Ext.io.Service} or {Ext.io.Proxy} object if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.Service|Ext.io.Proxy} options.success.service An {Ext.io.Service} or {Ext.io.Proxy} object.
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
    getService: function(options) {
        Ext.io.Io.init(function() {
            Ext.io.Io.messaging.getService(options);
        });
    },

    /**
     * @private
     *
     * Authenticate Developer
     *
     * @param {Object} options
     *
     */
    authenticateDeveloper: function(options) {
        Ext.io.Io.init(function() {
            Ext.io.Developer.authenticate(options);
        });
    },

    /**
     * @private
     *
     * Get current developer
     *
     * @param {Object} options
     *
     */
    getCurrentDeveloper: function(options) {
        Ext.io.Io.init(function() {
            Ext.io.Developer.getCurrent(options);
        });
    },

    /**
     * @private
     *
     * Get current version
     *
     * @param {Object} options
     *
     */
    getCurrentVersion: function(options) {
        Ext.io.Io.init(function() {
            Ext.io.Device.getCurrent({
                success: function(device) {
                    device.getVersion(options);
                },
                failure: function(errResponse) {
                    Ext.callback(options.callback, options.scope, [options, false, errResponse]);
                    Ext.callback(options.failure, options.scope, [errResponse, options]);
                }
            });
        });
    },

    /**
     * @private
     *
     * Get App
     *
     * @param {Object} options
     *
     */
    getApp: function(options) {
        Ext.io.Io.init(function() {
            Ext.io.App.get(options);
        });
    },
    /**
     * @private
     *
     * Get Developer
     *
     * @param {Object} options
     *
     */
    getDeveloper: function(options) {
        Ext.io.Io.init(function() {
            Ext.io.Developer.get(options);
        });
    },

    /**
     * @private
     *
     * Get Device
     *
     * @param {Object} options
     *
     */
    getDevice: function(options) {
        Ext.io.Io.init(function() {
            Ext.io.Device.get(options);
        });
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
        Ext.io.Io.init(function() {
            Ext.io.Team.get(options);
        });
    },
    /**
     * @private
     *
     * Get User
     *
     * @param {Object} options
     *
     */
    getUser: function(options) {
        Ext.io.Io.init(function() {
            Ext.io.User.get(options);
        });
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
        Ext.io.Io.init(function() {
            Ext.io.Version.get(options);
        });
    },
    /**
     * @private
     *
     * Get Group
     *
     * @param {Object} options
     *
     */
    getGroup: function(options) {
        Ext.io.Io.init(function() {
            Ext.io.Group.get(options);
        });
    },

    } // close for 'statics'
});

