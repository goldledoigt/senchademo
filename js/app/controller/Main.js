Ext.define('Demo.controller.Main', {

    extend: 'Ext.app.Controller',

    config: {
        views: ['Loader'],
        refs: {
            loader: {
                xtype: 'loader',
                autoCreate: true,
                selector: 'viewport loader'
            },
            messages: {
                autoCreate: true,
                xtype: 'messages',
                selector: 'viewport messages'
            },
            authentication: {
                autoCreate: true,
                xtype: 'authentication',
                selector: 'viewport authentication'
            }
        },
        control: {

        },
        before: {

        },
        routes: {
            '': 'showLoader',
            'messages': 'showMessages',
            'authentication/:type': 'showAuthentication'
        }
    },

    init: function() {
        Demo.utils.Io.on('ioready', this.onIoReady, this);
        Demo.utils.Io.init();
    },

    showLoader: function() {
        var loader = this.getLoader();

        Ext.Viewport.setActiveItem(loader);
    },

    showMessages: function() {
        console.log('showMessages', this, arguments);
        var panel = this.getMessages(),
            store = panel.getStore();

        Ext.Viewport.animateActiveItem(panel, {
            type: 'slide',
            direction: 'left',
            duration: 500
        });
        store.load();
        store.sync(function() {
            console.log('SYNC CALLBACK', this, arguments);
        });
    },

    showAuthentication: function(type) {
        console.log('showAuthentication', this, arguments);
        var panel = this.getAuthentication();

        Ext.Viewport.animateActiveItem(panel, {
            type: 'fade'
            // direction: 'left',
            // duration: 500
        });
    },

    onIoReady: function() {
        var io = Demo.utils.Io,
            user = io.getUser();

        console.log('onIoReady', user);
        if (!user) {
            this.redirectTo('authentication/login');
        } else {
            this.redirectTo('messages');
        }
    }

});
