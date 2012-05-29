Ext.Loader.setPath({
    'Ext.io': 'js/lib/io/src/io',
    'Ext.cf': 'js/lib/io/src/cf'
});

Ext.application({

    name: 'Demo',

    requires: [
        'Demo.utils.Io'
    ],

    viewport: {
        autoMaximize: true,
        showAnimation: 'slideIn'
    },

    appFolder: 'js/app',

    controllers: ['Main', 'Authentication', 'Messages']

    // launch: function() {
    //     console.log('launch', this);
    // }

});
