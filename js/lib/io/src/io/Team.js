/**
 * @private
 * Team
 */
Ext.define('Ext.io.Team', {
    extend: 'Ext.io.object.Object',
    requires: [
        'Ext.io.object.Objects'
    ],

    mixins: {
        picturedobject: 'Ext.io.object.PicturedObject'
    },

    statics: {

        teamsObject: null,

        /**
         * @private
         *
         * Get Teams object.
         *
         * @return {Object} Teams Object
         *
         */
         getTeamsObject: function() {
            if(!this.teamsObject) {
                this.teamsObject = Ext.create('Ext.io.object.Objects', 'Teams', Ext.io.Io.messaging);
            }             
            return this.teamsObject;            
        },

        /**
         * @private
         * @static
         * Get Team
         *
         * @param {Object} options
         *
         */
        get: function(options) {
            this.getTeamsObject().get(options.id, function(err, team) {
                if(err) {
                    Ext.callback(options.callback, options.scope, [options, false, err]);
                    Ext.callback(options.failure, options.scope, [err, options]);
                } else {
                    Ext.callback(options.callback, options.scope, [options, true, team]);
                    Ext.callback(options.success, options.scope, [team, options]);
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
     * @private
     *
     * Create App
     *
     * @param {Object} options
     *
     */
    createApp: function(options) {
        this.createRelatedEntity("createApp", 'Ext.io.App', options.data, function(err, app) {
            if (app) {
                Ext.callback(options.callback, options.scope, [options, true, app]);
                Ext.callback(options.success, options.scope, [app, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            }
        }, this);
    },

    /**
     * @private
     *
     * Create Group
     *
     * @param {Object} options
     *
     */
    createGroup: function(options) {
        this.createRelatedEntity("createGroup", 'Ext.io.Group', options.data, function(err, group) {
            if (group) {
                Ext.callback(options.callback, options.scope, [options, true, group]);
                Ext.callback(options.success, options.scope, [group, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            }
        }, this);
    },

    /**
     * @private
     *
     * Get Developers
     *
     * @param {Object} options
     *
     */
    getDevelopers: function(options) {
        var tag = (typeof(options.owner) != "undefined") ? ((options.owner) ? 'owner' : 'member') : '_';
        this.getRelatedObjects("Developers", tag, "Ext.io.Developer", function(err, developers) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, developers]);
                Ext.callback(options.success, options.scope, [developers, options]);
            }
        }, this);
    },

    /**
     * @private
     *
     * Get Apps
     *
     * @param {Object} options
     *
     */
    getApps: function(options) {
        this.getRelatedObjects("Apps", null, "Ext.io.App", function(err, apps) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, apps]);
                Ext.callback(options.success, options.scope, [apps, options]);
            }
        }, this);
    },

    /**
     * @private
     *
     * Get Groups
     *
     * @param {Object} options
     *
     */
    getGroups: function(options) {
        this.getRelatedObjects("Groups", null, "Ext.io.Group", function(err, groups) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, groups]);
                Ext.callback(options.success, options.scope, [groups, options]);
            }
        }, this);
    },

    /**
     * @private
     *
     * Manage Developer
     *
     * @param {Object} options
     *
     */
    manageDeveloper: function(options) {
        var self = this;
        
        this.messaging.getService({
            name: "TeamService",
            success: function(teamService) {
                teamService[options.method](function(result) {
                    if(result.status == "success") {
                        Ext.callback(options.callback, options.scope, [options, true, true]);
                        Ext.callback(options.success, options.scope, [true, options]);
                    } else {
                        var err = { message: result.description };
                        Ext.callback(options.callback, options.scope, [options, false, err]);
                        Ext.callback(options.failure, options.scope, [err, options]);
                    }
                }, self.key, options.key);
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
     * Add Developer
     *
     * @param {Object} options
     *
     */
    addDeveloper: function(options) {
        options.method = 'addDeveloper';
        this.manageDeveloper(options);
    },

    /**
     * @private
     *
     * Remove Developer
     *
     * @param {Object} options
     *
     */
    removeDeveloper: function(options) {
        options.method = 'removeDeveloper';
        this.manageDeveloper(options);
    },

    /**
     * @private
     *
     * Invite Developer
     *
     * @param {Object} options
     *
     */
    inviteDeveloper: function(options) {
        var self = this;

        var errCallback = function(err) {
            Ext.callback(options.callback, options.scope, [options, false, err]);
            Ext.callback(options.failure, options.scope, [err, options]);
        }

        Ext.io.Io.getService({
            name: "teammanager",
            success: function(devService) {
                devService.inviteDeveloper(function(result) {
                    if (result.status == "success") {
                        Ext.callback(options.callback, options.scope, [options, true, true]);
                        Ext.callback(options.success, options.scope, [true, options]);
                    } else {
                        errCallback(result.error);
                    }
                }, {username : options.username, org : self.key});
            },
            failure: function(err) {
                errCallback(err);
            }
        });
    }

});