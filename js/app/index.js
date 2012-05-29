// Ext.Loader.setPath({
//     'Ext.io': 'js/lib/io/src/io',
//     'Ext.cf': 'js/lib/io/src/cf'
// });

Ext.application({

    name: 'Demo',

    viewport: {
        autoMaximize: true
    },

    appFolder: 'js/app',

    controllers: ['Main']

});
