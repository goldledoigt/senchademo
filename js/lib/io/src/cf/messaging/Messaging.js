/**
 * @private
 *
 */
Ext.define('Ext.cf.messaging.Messaging', {
    requires: [
        'Ext.cf.naming.Naming',
        'Ext.cf.messaging.Transport',
        'Ext.cf.messaging.Rpc',
        'Ext.cf.messaging.PubSub',
        'Ext.io.Proxy', 
        'Ext.io.Service'],

    proxyCache : {},

    queueCache: {},


    transport: null,

    rpc: null,

    pubsub: null,

    config: {
        naming: null,
    },

    /** 
     * Constructor
     *
     * @param {Object} config
     * @param {Object} naming
     *
     */
    constructor: function(config, naming) {
        this.initConfig(config);

        this.naming = naming;
        this.transport = Ext.create('Ext.cf.messaging.Transport', config, this.naming);
        this.rpc = Ext.create('Ext.cf.messaging.Rpc', config, this.transport);
        this.pubsub = Ext.create('Ext.cf.messaging.PubSub', config, this.transport);

        return this;
    },

    /** 
     * Get service
     *
     * @param {Object} options
     *
     */
    getService: function(options) {
        var self = this;
        if(!options.name || options.name === "") {
            Ext.cf.util.Logger.error("Service name is missing");
            var errResponse = { code: 'SERVICE_NAME_MISSING', message: 'Service name is missing' };
            Ext.callback(options.callback, options.scope, [options, false, errResponse]);
            Ext.callback(options.failure, options.scope, [errResponse, options]);
        } else {
            var service = this.proxyCache[options.name];
            if(service) {
                Ext.callback(options.callback, options.scope, [options, true, service]);
                Ext.callback(options.success, options.scope, [service, options]);
            } else {
                self.naming.getServiceDescriptor(options.name, function(err, serviceDescriptor) {
                    if(err || typeof(serviceDescriptor) === "undefined" || serviceDescriptor === null) {
                        Ext.cf.util.Logger.error("Unable to load service descriptor for " + options.name);
                        var errResponse = { code: 'SERVICE_DESCRIPTOR_LOAD_ERROR', message: 'Error loading service descriptor', cause: err };
                        Ext.callback(options.callback, options.scope, [options, false, errResponse]);
                        Ext.callback(options.failure, options.scope, [errResponse, options]);
                    } else {
                        if(serviceDescriptor.kind == "rpc") {
                            service = Ext.create('Ext.io.Proxy', {name:options.name, descriptor:serviceDescriptor, rpc:self.rpc});
                        } else {
                            service = Ext.create('Ext.io.Service', {name:options.name, descriptor:serviceDescriptor, transport:self.transport});
                        }

                        self.proxyCache[options.name] = service;
                        Ext.callback(options.callback, options.scope, [options, true, service]);
                        Ext.callback(options.success, options.scope, [service, options]);
                    }
                });
            }
        }
    },

    /** 
     * Get queue
     *
     * @param {Object} options
     *
     */
    getQueue: function(options) {
        var self = this;

        var errResponse;

        if(!options.params.name || options.params.name === "") {
            errResponse = { code: 'QUEUE_NAME_MISSING', message: 'Queue name is missing' };
            Ext.callback(options.callback, options.scope, [options, false, errResponse]);
            Ext.callback(options.failure, options.scope, [errResponse, options]);
        } else if(!options.appId || options.appId === "") {
            errResponse = { code: 'APP_ID_MISSING', message: 'App Id is missing' };
            Ext.callback(options.callback, options.scope, [options, false, errResponse]);
            Ext.callback(options.failure, options.scope, [errResponse, options]);
        } else {
            var queueName = options.appId + "." + options.params.name;
            var queue = this.queueCache[queueName];
            if(!queue) {
                self.getService({
                        name: "AppService",
                        success: function(AppService) {
                            AppService.getQueue(function(result) {
                                if(result.status == "success") {
                                    queue = Ext.create('Ext.io.Queue', result.value._bucket, result.value._key, result.value.data, self);

                                    self.queueCache[queueName] = queue;

                                    Ext.callback(options.callback, options.scope, [options, true, queue]);
                                    Ext.callback(options.success, options.scope, [queue, options]);
                                } else {
                                    errResponse = { code: 'QUEUE_CREATE_ERROR', message: 'Queue creation error' };
                                    Ext.callback(options.callback, options.scope, [options, false, errResponse]);
                                    Ext.callback(options.failure, options.scope, [errResponse, options]);
                                }
                            }, options.appId, options.params);
                        },
                        failure: function() {
                            errResponse = { code: 'QUEUE_CREATE_ERROR', message: 'Queue creation error' };
                            Ext.callback(options.callback, options.scope, [options, false, errResponse]);
                            Ext.callback(options.failure, options.scope, [errResponse, options]);
                        }
                });
            } else {
                Ext.callback(options.callback, options.scope, [options, true, queue]);
                Ext.callback(options.success, options.scope, [queue, options]);
            }
        }
    },

    //options.params.file - it should be a handler for file, for example for client side:
    //document.getElementById("the-file").files[0];
    /** 
     * Send content
     *
     * @param {Object} options
     *
     */
    sendContent: function(options) {
        var self  = this;
        var url   = self.config.url || 'http://msg.sencha.io';
        if(!options.params.name || options.params.name === "" || !options.params.file || !options.params.ftype) {
            var errResponse = { code: 'PARAMS_MISSING', message: 'Some of parameters are missing' };
            Ext.callback(options.callback, options.scope, [options, false, errResponse]);
            Ext.callback(options.failure, options.scope, [errResponse, options]);
        } else {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function(){
                if (xhr.readyState == 4) {
                    var parseResult = function(str) {
                        var res;
                        try {
                            res = JSON.parse(str);
                        } catch (e) {
                            return {};
                        }
                        return res;
                    };
                    var result = Ext.merge({status : 'error', error : 'Can not store file'}, parseResult(xhr.responseText));
                    if (result.status == 'success') {
                        Ext.callback(options.callback, options.scope, [options, true, result.value]);
                        Ext.callback(options.success, options.scope, [result.value, options]);
                    } else {
                        errResponse = { code: 'STORE_ERROR', message: result.error };
                        Ext.callback(options.callback, options.scope, [options, false, errResponse]);
                        Ext.callback(options.failure, options.scope, [errResponse, options]);
                    }
                }
            };
            xhr.open('POST', url+'/contenttransfer/'+Math.random(), true);
            xhr.setRequestHeader("X-File-Name", encodeURIComponent(options.params.name));
            xhr.setRequestHeader("Content-Type", "application/octet-stream; charset=binary");
            xhr.overrideMimeType('application/octet-stream; charset=x-user-defined-binary');
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.setRequestHeader("Content-Encoding", "binary");
            xhr.setRequestHeader("File-type", options.params.ftype);

            xhr.send(options.params.file);
        }
    }
});

