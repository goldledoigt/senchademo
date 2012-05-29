/**
 * @private
 * Developer 
 *
 */
Ext.define('Ext.io.Developer', {
    extend: 'Ext.io.object.Object',
    requires: [
        'Ext.cf.util.Md5', 
        'Ext.io.object.Objects'
    ],

    statics: {

        developersObject: null,

        /**
         * @private
         *
         * Get Developers object.
         *
         * @return {Object} Developers Object
         *
         */
         getDevelopersObject: function() {
            if(!this.developersObject) {
                this.developersObject = Ext.create('Ext.io.object.Objects', 'Developers', Ext.io.Io.messaging);
            }             
            return this.developersObject;            
        },

        /**
         * @private
         * @static
         * Authenticate developer
         *
         * @param {Object} options
         *
         */
        authenticate: function(options) {
            var self = this;

            Ext.io.Io.getService({
                name: "teammanager",
                success: function(devService) {
                    devService.authenticate(function(result) {
                        if (result.status == "success") {
                            var developer = Ext.create('Ext.io.Developer', result.value._bucket, result.value._key, result.value.data, Ext.io.Io.messaging);
                            
                            Ext.io.Io.naming.getStore().setSid('developer', result.session.sid);
                            Ext.io.Io.naming.getStore().setId('developer', result.value._key);

                            Ext.callback(options.callback, options.scope, [options, true, developer]);
                            Ext.callback(options.success, options.scope, [developer, options]);
                        } else {
                            var err = { code : 'CAN_NOT_AUTH', message : 'Can not authenticate this developer' };
                            Ext.callback(options.callback, options.scope, [options, false, err]);
                            Ext.callback(options.failure, options.scope, [err, options]);
                        }
                    }, {username : options.params.username, password : Ext.cf.util.Md5.hash(options.params.password), provider:"sencha"});
                },
                failure: function(err) {
                    Ext.callback(options.callback, options.scope, [options, false, err]);
                    Ext.callback(options.failure, options.scope, [err, options]);
                }
            });
        },

        /**
         * @private
         * @static
         * Get current developer
         *
         * @param {Object} options
         *
         */
        getCurrent: function(options) {
            var developerId = Ext.io.Io.naming.getStore().getId('developer');
            if (!developerId) {
                var err = { code : 'NOT_LOGGED', message: 'Developer is not logged in' };
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                this.getDevelopersObject().get(developerId, function(err, dev) {
                    if(err) {
                        Ext.callback(options.callback, options.scope, [options, false, err]);
                        Ext.callback(options.failure, options.scope, [err, options]);
                    } else {
                        Ext.callback(options.callback, options.scope, [options, true, dev]);
                        Ext.callback(options.success, options.scope, [dev, options]);
                    }
                }, this);
            }
        },

        /**
         * @private
         * @static
         * Get Developer
         *
         * @param {Object} options
         *
         */
        get: function(options) {
            this.getDevelopersObject().get(options.id, function(err, dev) {
                if(err) {
                    Ext.callback(options.callback, options.scope, [options, false, err]);
                    Ext.callback(options.failure, options.scope, [err, options]);
                } else {
                    Ext.callback(options.callback, options.scope, [options, true, dev]);
                    Ext.callback(options.success, options.scope, [dev, options]);
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
     * Get Teams
     *
     * @param {Object} options
     *
     */
    getTeams: function(options) {
        var tag = (typeof(options.owner) != "undefined") ? ((options.owner) ? 'owner' : 'member') : null;
        this.getRelatedObjects("Teams", tag, 'Ext.io.Team', function(err, teams) {
            if (err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, teams]);
                Ext.callback(options.success, options.scope, [teams, options]);
            }
        }, this);
    },

    /**
     * @private
     *
     * Create Team
     *
     * @param {Object} options
     *
     */
    createTeam: function(options) {
        this.createRelatedEntity("createTeam", 'Ext.io.Team', options.data, function(err, team) {
            if (team) {
                Ext.callback(options.callback, options.scope, [options, true, team]);
                Ext.callback(options.success, options.scope, [team, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            }
        }, this);
    },

    /**
     * Logout
     *
     */
    logout: function() {
        Ext.io.Io.naming.getStore().remove('developer','sid');
        Ext.io.Io.naming.getStore().remove('developer','id');
    }
    
});