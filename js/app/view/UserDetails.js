Ext.define('Demo.view.UserDetails', {

    extend: 'Ext.Panel',

    xtype: 'userdetails',

    config: {
        title: 'USER DETAILS',
        tpl: [
            '<center>',
                '<div>{displayName}</div>',
                '<div><img src="{photo}" /></div>',
                '<div>{phonenumber}</div>',
                '<div>{email}</div>',
            '</center>'
        ]
    }

});
