/**
 * @private
 *
 */
Ext.define('Ext.cf.naming.Naming', {
    alternateClassName: 'Ext.io.Naming',
    requires: ['Ext.cf.naming.IDStore'],

    config: {
        messaging: null,
        store: null
    },

    /**
     * Constructor
     *
     * @param {Object} config
     *
     */
    constructor: function(config) {
        this.initConfig(config);
        this.setStore(Ext.create('Ext.cf.naming.IDStore'));
        return this;
    },

    /**
     * Get device id
     *
     * @return {String/Number} Device Id
     *
     */
    getDeviceId: function() {
        return this.getStore().getId('device');
    },

    /**
     * Get service descriptor
     *
     * @param {String} serviceName
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    getServiceDescriptor: function(serviceName, callback, scope) {
        if(serviceName == "naming-rpc") {
            callback.call(scope, null, {
                kind: "rpc",
                style: ["subscriber"],
                access: ["clients", "servers"],
                depends: ["messaging", "naming"],
                methods: [
                    "getServiceDescriptor",
                    "get", 
                    "find",
                    "update",
                    "add",
                    "destroy",
                    "addBiLinks",
                    "delBiLinks",
                    "getSingleLink", 
                    "getRelatedEntities", 
                    "findRelatedEntities",
                    "getStore",
                    "createRelatedEntity",
                    "setPicture",
                    "dropPicture"
                ]
            });
        } else {
            this.getMessaging().getService({
                name: "naming-rpc",
                success: function(namingRpc) {
                    namingRpc.getServiceDescriptor(function(result) {
                        if(result.status == "success") {
                            callback.call(scope, null, result.value);
                        } else {
                            callback.call(scope, result.error, null);
                        }
                    }, serviceName);
                },
                failure: function() {
                    callback.call(scope, null);
                }
            });
        }
    }
});

