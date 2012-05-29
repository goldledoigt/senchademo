Ext.define('Demo.view.authentication.Register', {

    extend: 'Ext.form.Panel',

    xtype: 'register',

    requires: [
        'Ext.Button',
        'Ext.field.Text',
        'Ext.field.Email',
        'Ext.form.FieldSet',
        'Ext.field.Password'
    ],

    config: {
        // submitOnAction: true,
        items: [{
            xtype: 'fieldset',
            items: [{
                name: 'username',
                label: 'User name',
                xtype: 'textfield'
            }, {
                name: 'password',
                label: 'Password',
                xtype: 'passwordfield'
            }, {
                name: 'email',
                label: 'Email',
                xtype: 'emailfield'
            }]
        }, {
            xtype: 'button',
            text: 'SUBMIT'
        }]
    }

});
