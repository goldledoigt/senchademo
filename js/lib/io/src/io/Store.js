/**
 * @private
 *
 */
Ext.define('Ext.io.Store', {
    extend: 'Ext.io.object.Object',

    name: null,

    statics: {

        /**
         * @private
         *
         */
         getStores: function() {
            this.stores = this.stores || Ext.create('Ext.io.object.Objects', 'DataStores', Ext.io.Io.messaging);
            return this.stores;            
        },
    
        /** 
         * @private
         * @static
         */
        get: function(options) {
            this.getStores().get(options.id, function(err, store) {
                if(err) {
                    Ext.callback(options.callback, options.scope, [options, false, err]);
                    Ext.callback(options.failure, options.scope, [err, options]);
                } else {
                    Ext.callback(options.callback, options.scope, [options, true, store]);
                    Ext.callback(options.success, options.scope, [store, options]);
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
        this.name = data.name;
        return this;
    },

    /**
     * @private
     *
     */
    findReplicas: function(options) {
        this.findRelatedObjects("Replicas", this.key, null, options.query, "Ext.io.Replica", function(err, replicas) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, replicas]);
                Ext.callback(options.success, options.scope, [replicas, options]);
            }
        }, this);    
    },

});

