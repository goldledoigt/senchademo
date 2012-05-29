/**
 * @private
 *
 * An Object... but a special one.
 * 
 */
Ext.define('Ext.io.object.Object', {

    bucket: null,

    key: null,

    data: null,

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
        this.bucket = bucket;
        this.key = key;
        this.data = data;
        this.messaging = messaging;
        
        var args = Array.prototype.slice.call(arguments, 0);
        if (args.indexOf(undefined) != -1) {
            Ext.cf.util.Logger.warn("Calling new <Object> does not work. Use the factory method Ext.io.get<Object> instead.");
        }
    },

    /**
     * @inheritable
     *
     * Update the object.
     *
     * @param {Object} options An object which may contain the following properties:
     * @param {Object} options.data The data to be set on the object.
     *
     * @param {Function} options.callback The function to be called after updating the object.
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
    update: function(options) {
        var self = this;

        //update data
        for (var k in options.data) {
            self.data[k] = options.data[k];
        }

        this.messaging.getService({
            name: "naming-rpc",
            success: function(namingRpc) {
                namingRpc.update(function(result) {
                    if(result.status == "success") {
                        Ext.callback(options.callback, options.scope, [options, true, true]);
                        Ext.callback(options.success, options.scope, [true, options]);
                    } else {
                        Ext.callback(options.callback, options.scope, [options, false, result.error || null]);
                        Ext.callback(options.failure, options.scope, [result.error || null, options]);
                    }
                }, self.bucket, self.key, self.data);
            },
            failure: function(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            }
        });
    },

    /** 
     * @private
     *
     * Destroy
     *
     * @param {Object} options
     * 
     */
    destroy: function(options) {
        var self = this;
        
        this.messaging.getService({
            name: "naming-rpc",
            success: function(namingRpc) {
                namingRpc.destroy(function(result) {
                    if(result.status == "success") {
                        Ext.callback(options.callback, options.scope, [options, true, true]);
                        Ext.callback(options.success, options.scope, [true, options]);
                    } else {
                        Ext.callback(options.callback, options.scope, [options, false, result.error || null]);
                        Ext.callback(options.failure, options.scope, [result.error || null, options]);
                    }
                }, self.bucket, self.key);
            },
            failure: function(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            }
        });
    },

    /** 
     * @private
     *
     * Create Related Entity
     *
     * @param {String} method
     * @param {String} entity
     * @param {Object} data
     * @param {Function} callback
     * @param {Object} scope
     * 
     */
    createRelatedEntity: function(method, entity, data, callback, scope) {
        var self = this;

        this.messaging.getService({
            name: "naming-rpc",
            success: function(namingRpc) {
                namingRpc.createRelatedEntity(function(result) {
                    if(result.status == "success") {
                        var ent = Ext.create(entity, result.value._bucket, result.value._key, result.value.data, self.messaging);
                        callback.call(scope, false, ent);
                    } else {
                        callback.call(scope, result.error || true, null);
                    }
                }, self.bucket, self.key, method, data);
            },
            failure: function(err) {
                callback.call(scope, err, null);
            }
        });
    },

    /** 
     * @private
     *
     * Delete BiLinks
     *
     * @param {String} bucket
     * @param {String} key
     * @param {String} tag
     * @param {Function} callback
     * @param {Object} scope
     * 
     */
    delBiLinks: function(bucket, key, tag, callback, scope) {
        var self = this;

        this.messaging.getService({
            name: "naming-rpc",
            success: function(namingRpc) {
                namingRpc.delBiLinks(function(result) {
                    if(result.status == "success") {
                        callback.call(scope, false);
                    } else {
                        callback.call(scope, result.error || true, null);
                    }
                }, self.bucket, self.key, bucket, key, tag);
            },
            failure: function(err) {
                callback.call(scope, err, null);   
            }
        });
    },
    
    /** 
     * @private
     *
     * Add BiLinks
     *
     * @param {String} bucket
     * @param {String} key
     * @param {String} tag
     * @param {Function} callback
     * @param {Object} scope
     * 
     */
    addBiLinks: function(bucket, key, tag, callback, scope) {
        var self = this;

        this.messaging.getService({
            name: "naming-rpc",
            success: function(namingRpc) {
                namingRpc.addBiLinks(function(result) {
                    if(result.status == "success") {
                        callback.call(scope, false);
                    } else {
                        callback.call(scope, result.error || true, null);
                    }
                }, self.bucket, self.key, bucket, key, tag);
            },
            failure: function(err) {
                callback.call(scope, err, null);   
            }
        });
    },

    /** 
     * @private
     *
     * Get Single Link
     *
     * @param {String} bucket
     * @param {String} key
     * @param {String} tag
     * @param {String} entity
     * @param {Function} callback
     * @param {Object} scope
     * 
     */
    getSingleLink: function(bucket, key, tag, entity, callback, scope) {
        var self = this;

        this.messaging.getService({
            name: "naming-rpc",
            success: function(namingRpc) {
                namingRpc.getSingleLink(function(result) {
                    if(result.status == "success") {
                        var linkedEntity = null;
                        if(result.value && result.value !== null) { // it's possible there is no linked entity
                            // Note we are taking bucket from result.value, not self._bucket because the linked entity
                            // might be from a different bucket
                            linkedEntity = Ext.create(entity, result.value._bucket, result.value._key, result.value.data, self.messaging);
                        }
                        callback.call(scope, false, linkedEntity);
                    } else {
                        callback.call(scope, result.error || true, null);
                    }
                }, self.bucket, self.key, bucket, key, tag);
            },
            failure: function(err) {
                callback.call(scope, err, null);   
            }
        });
    },

    /** 
     * @private
     *
     * Get Related Objects
     *
     * @param {String} bucket
     * @param {String} tag
     * @param {String} entity
     * @param {Function} callback
     * @param {Object} scope
     * 
     */
    getRelatedObjects: function(bucket, tag, entity, callback, scope) {
        var self = this;

        this.messaging.getService({
            name: "naming-rpc",
            success: function(namingRpc) {
                namingRpc.getRelatedEntities(function(result) {
                    if(result.status == "success") {
                        var objects = [];
                        for(var i = 0; i < result.value.length; i++) {
                            objects.push(Ext.create(entity, result.value[i]._bucket, result.value[i]._key, result.value[i].data, self.messaging));
                        }
                        callback.call(scope, false, objects);
                    } else {
                        callback.call(scope, result.error || true, null);
                    }
                }, self.bucket, self.key, bucket, tag);
            },
            failure: function(err) {
                callback.call(scope, err, null);   
            }
        });
    },

    /** 
     * @private
     *
     * Find Related Objects
     *
     * @param {String} bucket
     * @param {String} key
     * @param {String} tag
     * @param {String} query
     * @param {String} entity
     * @param {Function} callback
     * @param {Object} scope
     * 
     */
    findRelatedObjects: function(bucket, key, tag, query, entity, callback, scope) {
        var self = this;

        this.messaging.getService({
            name: "naming-rpc",
            success: function(namingRpc) {
                namingRpc.findRelatedEntities(function(result) {
                    if(result.status == "success") {
                        var objects = [];
                        for(var i = 0; i < result.value.length; i++) {
                            objects.push(Ext.create(entity, result.value[i]._bucket, result.value[i]._key, result.value[i].data, self.messaging));
                        }
                        callback.call(scope, false, objects);
                    } else {
                        callback.call(scope, result.error || true, null);
                    }
                }, self.bucket, self.key, bucket, key, tag, query);
            },
            failure: function(err) {
                callback.call(scope, err, null);    
            }
        });
    }
});

