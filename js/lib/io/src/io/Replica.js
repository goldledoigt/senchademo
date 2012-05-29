/**
 * @private
 *
 */
Ext.define('Ext.io.Replica', {
    extend: 'Ext.io.object.Object',

    statics: {

        /** 
         * @private
         * @static
         */
        get: function(options) {
            var replicas = Ext.create('Ext.io.object.Objects', 'Replicas', Ext.io.Io.messaging);
            replicas.get(options.id, function(err, store) {
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
        return this;
    },

});

