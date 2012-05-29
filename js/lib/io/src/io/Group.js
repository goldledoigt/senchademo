/**
 * {@img group.png Class Diagram}
 *
 * The {@link Ext.io.Group} class represents a group of users. There is only one
 * group object, called the current group object, available to the client.
 * If the current app is not associated with a user group then there will
 * be no user group.
 *
 *          Ext.io.Io.getCurrentGroup({
 *             success: function(group){
 *              
 *             } 
 *          });
 *
 *
 * Methods are provided for navigation through the graph of objects available
 * to the currently running client code. 
 */
Ext.define('Ext.io.Group', {
    extend: 'Ext.io.object.Object',

    requires: [
        'Ext.cf.messaging.AuthStrategies', 
        'Ext.io.object.Objects'
    ],

    statics: {

        groupsObject: null,

        /**
         * @private
         * @static
         * Get Groups object.
         *
         * @return {Object} Groups Object
         *
         */
         getGroupsObject: function() {
            if(!this.groupsObject) {
                this.groupsObject = Ext.create('Ext.io.object.Objects', 'Groups', Ext.io.Io.messaging);
            }             
            return this.groupsObject;            
        },

        /**
         * @static
         * Get the current user Group object.
         *
         *          Ext.io.Group.getCurrent({
         *              success: function(group){
         *              } 
         *          });
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
        getCurrent: function(options) {
            var groupId = Ext.io.Io.naming.getStore().getId('group');
            if (!groupId) {
                // try to get the group from the app
                Ext.require('Ext.io.App');
                Ext.io.App.getCurrent({
                    success: function(app) {
                        app.getGroup({
                            success: function(group) {
                                Ext.io.Io.naming.getStore().setId('group', group ? group.key : null);
                                
                                Ext.callback(options.callback, options.scope, [options, true, group]);
                                Ext.callback(options.success, options.scope, [group, options]);
                            },
                            failure: function(err) {
                                Ext.callback(options.failure, options.scope, [err, options]);
                            }
                        })
                    },
                    failure: function(err) {
                        Ext.callback(options.failure, options.scope, [err, options]);
                    }
                });
            } else {
                this.getGroupsObject().get(groupId, function(err, group) {
                    if(err) {
                        Ext.callback(options.callback, options.scope, [options, false, err]);
                        Ext.callback(options.failure, options.scope, [err, options]);
                    } else {
                        Ext.callback(options.callback, options.scope, [options, true, group]);
                        Ext.callback(options.success, options.scope, [group, options]);
                    }
                }, this);
            }
        },


        /**
         * @private
         * @static
         * Get Group
         *
         * @param {Object} options
         *
         */
        get: function(options) {
            this.getGroupsObject().get(options.id, function(err, group) {
                if(err) {
                    Ext.callback(options.callback, options.scope, [options, false, err]);
                    Ext.callback(options.failure, options.scope, [err, options]);
                } else {
                    Ext.callback(options.callback, options.scope, [options, true, group]);
                    Ext.callback(options.success, options.scope, [group, options]);
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
     * Get the App associated with this user Group.
     *
     * Returns an instance of {@link Ext.io.App} for the current app.
     *
     *      group.getApp({
     *          success: function(app) {
     *          }
     *      });
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Function} options.callback The function to be called after getting the App object.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.app The {Ext.io.App} associated with this Group if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.App} options.success.app The {Ext.io.App} object associated with this Group.
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
    getApp: function(options) {
        Ext.io.App.getCurrent(options);
    },

    /**
     * Find Users that match a query.
     *
     * Returns all the user objects that match the given query. The query is a String
     * of the form name:value. For example, "hair:brown", would search for all the
     * users with brown hair, assuming that the app is adding that attribute to all
     * its users. 
     *
     *       group.findUsers({
     *           query:'username:bob',
     *           success:function(users){
     *           }
     *       });
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Object} options.query
     *
     * @param {Function} options.callback The function to be called after finding the matching users.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.users The {Ext.io.User[]} matching users found for the Group if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.User[]} options.success.users The matching users found for the Group.
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
    findUsers: function(options) {
        this.findRelatedObjects("Users", this.key, null, options.query, 'Ext.io.User', function(err, users) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, users]);
                Ext.callback(options.success, options.scope, [users, options]);
            }
        }, this);
    },

    /**
     * Register a new User.
     * 
     * If the user does not already exist in the group then a new user is created,
     * and is returned as an instance of {@link Ext.io.User}. The same user is now available
     * through the {@link Ext.io.getCurrentUser}.
     *
     *       group.register({
     *           params:{
     *               username:'bob',
     *               password:'secret',
     *               email:'bob@isp.com'
     *           },
     *           success:function(user){
     *           }
     *      });
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Object} options.params User profile attributes.
     * @param {Object} options.params.username
     * @param {Object} options.params.password
     * @param {Object} options.params.email
     *
     * @param {Function} options.callback The function to be called after registering the user.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.user The {Ext.io.User} if registration succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.User} options.success.user The registered user.
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
    register: function(options) {
        var self = this;

        this.messaging.getService({
            name: "groupmanager",
            success: function(groupManager) {
                groupManager.registerUser(function(result) {
                    if (result.status == "success") {
                        var user = Ext.create('Ext.io.User', result.value._bucket, result.value._key, result.value.data, self.messaging);

                        Ext.io.Io.naming.getStore().setId('user', user.key);
                        Ext.io.Io.naming.getStore().setSid('user', result.sid);

                        Ext.callback(options.callback, options.scope, [options, true, user]);
                        Ext.callback(options.success, options.scope, [user, options]);
                    } else {
                        var err = { code : 'CAN_NOT_REGISTER', message : 'Can not register this user' };
                        Ext.callback(options.callback, options.scope, [options, false, err]);
                        Ext.callback(options.failure, options.scope, [err, options]);
                    }
                }, {authuser:options.params, groupId:self.key});
            },
            failure: function(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            }
        });
    },

    /**
     * Authenticate an existing User.
     *
     * Checks if the user is a member of the group. The user provides a username
     * and password. If the user is a member of the group, and the passwords match,
     * then an instance of {@link Ext.io.User} is returned. The current user object is
     * now available through {@link Ext.io.getCurrentUser}
     *
     *       group.authenticate({
     *           params:{
     *               username:'bob',
     *               password:'secret',
     *           },
     *           success:function(user){
     *           }
     *      });
     *
     * We use a digest based authentication mechanism to ensure that no
     * sensitive information is passed over the network.
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Object} params Authentication credentials
     * @param {Object} params.username
     * @param {Object} params.password
     *
     * @param {Function} options.callback The function to be called after authenticating the user.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.user The {Ext.io.User} if authentication succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.User} options.success.user The authenticated user.
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
    authenticate: function(options) {
        var self = this;

        Ext.cf.messaging.AuthStrategies.strategies.digest(this, options.params, function(err, user, usersid) {
            if(err) {
                err = { code : 'CAN_NOT_AUTH', message : 'Can not authenticate this user' };
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.io.Io.naming.getStore().setId('user', user.key);
                Ext.io.Io.naming.getStore().setSid('user', usersid);
                Ext.io.Io.naming.getStore().setId('group', this.key);
                Ext.callback(options.callback, options.scope, [options, true, user]);
                Ext.callback(options.success, options.scope, [user, options]);
            }
        }, this);
    },

    /**
     * Find stores that match a query.
     * 
     * Returns all the group's store objects that match the given query. The query is a String
     * of the form name:value. For example, "city:austin", would search for all the
     * stores in Austin, assuming that the app is adding that attribute to all
     * its stores. 
     *
     *       group.findStores({
     *           query:'city:austin',
     *           success:function(stores){
     *           }
     *       });
     *
     * @param {Object} options An object which may contain the following properties:
     *
     * @param {Object} options.query
     *
     * @param {Function} options.callback The function to be called after finding the matching stores.
     * The callback is called regardless of success or failure and is passed the following parameters:
     * @param {Object} options.callback.options The parameter to the API call.
     * @param {Boolean} options.callback.success True if the call succeeded.
     * @param {Object} options.callback.stores The {Ext.io.Store[]} matching stores found for the App if the call succeeded, else an error object.
     *
     * @param {Function} options.success The function to be called upon success.
     * The callback is passed the following parameters:
     * @param {Ext.io.Queue[]} options.success.stores The matching stores found for the App.
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
    findStores: function(options) {
        this.findRelatedObjects("DataStores", this.key, null, options.query, "Ext.io.Store", function(err, stores) {
            if(err) {
                Ext.callback(options.callback, options.scope, [options, false, err]);
                Ext.callback(options.failure, options.scope, [err, options]);
            } else {
                Ext.callback(options.callback, options.scope, [options, true, stores]);
                Ext.callback(options.success, options.scope, [stores, options]);
            }
        }, this);    
    },

});
