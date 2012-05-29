Ext.define('Demo.view.UsersList', {

    extend: 'Ext.List',

    xtype: 'userslist',

    config: {
        title: 'USERS LIST',
        store: 'usersStore',
        itemTpl: '{displayName}'
    }

});
