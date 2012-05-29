Ext.define('Demo.utils.Io', {

    extend: 'Object',

    singleton: true,

    requires: [
        'Ext.io.Io'
        // 'Ext.io.data.Proxy'
    ],

    mixins: ['Ext.mixin.Observable'],

    config: {
        user: null,
        group: null,
        logLevel: 'error',
        appSecret: '9405rg963AuFxmWE',
        appId: 'CXFd0Z2ccKaoySGP29smEEVd98C'
    },

    constructor: function(config) {
        this.initConfig(config);
        this.setup();
        // this.init();
    },

    setup: function() {
        Ext.io.Io.setup({
            appId: this.getAppId(),
            logLevel: this.getLogLevel(),
            appSecret: this.getAppSecret()
        });
    },

    init: function() {
        Ext.io.Io.init(function() {
            // console.warn('IO Init', this, arguments);
            this.getCurrentGroup();
            this.getCurrentUser();
        }, this);
    },

    authenticate: function(params) {
        var group = this.getGroup();

        group.authenticate({
            scope: this,
            params: params.values,
            success: function(user) {
                console.warn('login USER:', user);
                this.setUser(user);
                params.success.call(params.scope, user);
            },
            failure: function(error) {
                // console.warn('login failure', this, arguments);
                params.failure.call(params.scope, error);
            }
        });
    },

    register: function(params) {
        var group = this.getGroup();

        group.register({
            scope: this,
            params: params.values,
            success: function(user) {
                console.warn('register USER:', user);
                this.setUser(user);
                params.success.call(params.scope, user);
            },
            failure: function(error) {
                // console.warn('register failure', this, arguments);
                params.failure.call(params.scope, error);
            }
        });
    },

    getCurrentGroup: function() {
        Ext.io.Io.getCurrentGroup({
            scope: this,
            success: function(group) {
                // console.warn('getCurrentGroup success', this, arguments);
                this.setGroup(group);
            },
            failure: function(error) {
                console.warn('getCurrentGroup failure', this, arguments);
            }
        });
    },

    getCurrentUser: function() {
        Ext.io.Io.getCurrentUser({
            scope: this,
            success: function(user) {
                // console.warn('getCurrentUser success', this, arguments);
                this.setUser(user);
                this.fireEvent('ioready', this);
            },
            failure: function(user) {
                console.warn('getCurrentUser failure', this, arguments);
                this.fireEvent('ioready', this);
            }
        });
    }

});
