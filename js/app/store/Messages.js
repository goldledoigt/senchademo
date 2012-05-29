Ext.define('Demo.store.Messages', {

    extend: 'Ext.data.Store',

    requires: [
        'Ext.io.data.Proxy',
        'Demo.model.Message'
    ],

    config: {
        // autoLoad: true,
        storeId: 'messagesStore',
        model: 'Demo.model.Message',
        proxy: {
            owner: 'group',
            type: 'syncstorage',
            id: 'messages'
        }
    }

});
