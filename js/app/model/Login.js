Ext.define('Demo.model.Login', {

    extend: 'Ext.data.Model',

    config: {
        fields: [
            'username',
            'password'
        ],
        validations: [{
            type: 'presence',
            field: 'username'
        }, {
            type: 'presence',
            field: 'password'
        }]
    }

    // toUrl: function() {
    //     return 'login';
    // }

});
