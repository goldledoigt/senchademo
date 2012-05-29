Ext.define('Demo.view.Authentication', {

    extend: 'Ext.TabPanel',

    xtype: 'authentication',

    config: {
        tabBarPosition: 'bottom',
        items: [{
            docked: 'top',
            xtype: 'toolbar',
            title: 'Authentication'
        }, {
            iconCls: 'user',
            title: 'Login',
            xtype: 'login'
        }, {
            iconCls: 'user',
            title: 'Register',
            xtype: 'register'
        }]
    }

});
