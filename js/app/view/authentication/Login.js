Ext.define('Demo.view.authentication.Login', {

    extend: 'Ext.form.Panel',

    xtype: 'login',

    requires: [
        'Ext.Button',
        'Ext.field.Text',
        'Ext.form.FieldSet',
        'Ext.field.Password'
    ],

    config: {
        submitOnAction: true,
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
            }]
        }, {
            xtype: 'button',
            text: 'SUBMIT'
        }]
    }

});
