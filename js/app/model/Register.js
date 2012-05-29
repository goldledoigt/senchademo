Ext.define('Demo.model.Register', {

    extend: 'Ext.data.Model',

    config: {
        fields: [
            'username',
            'email',
            'password'
        ],
        validations: [{
            type: 'presence',
            field: 'username'
        }, {
            type: 'presence',
            field: 'password'
        }, {
            type: 'format',
            field: 'email',
            message: 'must be valid',
            matcher: /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
        }]
    }

    // toUrl: function() {
    //     return 'register';
    // }

});
