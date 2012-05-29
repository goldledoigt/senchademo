/**
 * 
 * @private
 *
 * A collection of Objects.
 */
Ext.define('Ext.io.object.Objects', {
    
    CLASS_MAP: {
        'Groups': 'Ext.io.Group',
        'Apps': 'Ext.io.App',
        'Users': 'Ext.io.User',
        'Devices': 'Ext.io.Device',
        'Queues' : 'Ext.io.Queue',
        'Developers' : 'Ext.io.Developer',
        'Teams' : 'Ext.io.Team',
        'Versions' : 'Ext.io.Version',
        'DataStores' : 'Ext.io.Store',
        'Replicas' : 'Ext.io.Replica'
    },

    bucket: null,

    /**
     * @private
     *
     * Constructor
     *
     * @param {String} bucket
     * @param {Object} messaging
     *
     */
    constructor: function(bucket, messaging) {
        this.bucket = bucket;
        this.messaging = messaging;
    },

    /**
     * Get a specific Object.
     *
     * @param {String} key
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    get: function(key, callback, scope) {
        var self = this;
            
        this.messaging.getService({
            name: "naming-rpc",
            success: function(namingRpc) {
                namingRpc.get(function(result) {
                    if(result.status == "success") {
                        callback.call(scope, false, Ext.create(self.CLASS_MAP[self.bucket], self.bucket, result.value._key, result.value.data, self.messaging));
                    } else {
                        callback.call(scope, result.error || true, null);
                    }
                }, self.bucket, key);
            },
            failure: function(err) {
                callback.call(scope, err, null);    
            } 
        });
    },

    /**
     * Get a set of Objects that match a query.
     *
     * @param {String} query
     * @param {Number} start
     * @param {Number} rows
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    find: function(query, start, rows, callback, scope) {
        var self = this;

        this.messaging.getService({
            name: "naming-rpc",
            success: function(namingRpc) {
                namingRpc.find(function(result) {
                    if(result.status == "success") {
                        var objects = [];
                        for(var i = 0; i < result.value.length; i++) {
                            objects.push(Ext.create(self.CLASS_MAP[self.bucket], self.bucket, result.value[i]._key, result.value[i].data, self.messaging));
                        }
                        callback.call(scope, false, objects);
                    } else {
                        callback.call(scope, result.error || true, null);
                    }
                }, self.bucket, query, start, rows);
            },
            failure: function(err) {
                callback.call(scope, err, null);    
            } 
        });
    },
    
    /**
     * Add a specific Object.
     *
     * @param {Object} data
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    add: function(data, callback, scope) {
        var self = this;
            
        this.messaging.getService({
            name: "naming-rpc",
            success: function(namingRpc) {
                namingRpc.add(function(result) {
                    if(result.status == "success") {
                        callback.call(scope, false, Ext.create(self.CLASS_MAP[self.bucket], self.bucket, result.value._key, result.value.data, self.messaging));
                    } else {
                        callback.call(scope, result.error || true, null);
                    }
                }, self.bucket, data);
            },
            failure: function(err) {
                callback.call(scope, err, null);    
            } 
        });
    }
});
