/**
 * @private
 * Version
 */
Ext.define('Ext.io.Version', {
    extend: 'Ext.io.object.Object',
    requires: [
        'Ext.io.object.Objects',
    ],

    statics: {

        versionsObject: null,

        /**
         * @private
         *
         * Get Versions object.
         *
         * @return {Object} Versions Object
         *
         */
         getVersionsObject: function() {
            if(!this.versionsObject) {
                this.versionsObject = Ext.create('Ext.io.object.Objects', 'Versions', Ext.io.Io.messaging);
            }             
            return this.versionsObject;            
        },

        /**
         * @private
         * @static
         * Get Version
         *
         * @param {Object} options
         *
         */
        get: function(options) {
            this.getVersionsObject().get(options.id, function(err, version) {
                if(err) {
                    Ext.callback(options.callback, options.scope, [options, false, err]);
                    Ext.callback(options.failure, options.scope, [err, options]);
                } else {
                    Ext.callback(options.callback, options.scope, [options, true, version]);
                    Ext.callback(options.success, options.scope, [version, options]);
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
     * Deploy
     *
     * @param {Object} options
     *
     */
    deploy: function(options) {
        var self = this;
        
        this.messaging.getService({
            name: "VersionService",
            success: function(versionService) {
                versionService.deploy(function(result) {
                    if(result.status == "success") {
                        Ext.callback(options.callback, options.scope, [options, true, true]);
                        Ext.callback(options.success, options.scope, [true, options]);
                    } else {
                        Ext.callback(options.callback, options.scope, [options, false, result.error || null]);
                        Ext.callback(options.failure, options.scope, [result.error || null, options]);
                    }
                }, self.key, options.env);
            },
            failure: function(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            }
        });
    },

    /**
     * Undeploy
     *
     * @param {Object} options
     *
     */
    undeploy: function(options) {
        var self = this;
        
        this.messaging.getService({
            name: "VersionService",
            success: function(versionService) {
                versionService.undeploy(function(result) {
                    if(result.status == "success") {
                        Ext.callback(options.callback, options.scope, [options, true, true]);
                        Ext.callback(options.success, options.scope, [true, options]);
                    } else {
                        Ext.callback(options.callback, options.scope, [options, false, result.error || null]);
                        Ext.callback(options.failure, options.scope, [result.error || null, options]);
                    }
                }, self.key, options.env);
            },
            failure: function() {
                Ext.callback(options.callback, options.scope, [options, false, null]);
                Ext.callback(options.failure, options.scope, [null, options]);
            }
        });
    },

    /**
     * Get App
     *
     * @param {Object} options
     *
     */
    getApp: function(options) {
        this.getSingleLink("Apps", null, null, "Ext.io.App", function(err, app) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, app]);
                Ext.callback(options.success, options.scope, [app, options]);
            }
        }, this);
    }

});