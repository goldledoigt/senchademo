Ext.define('Demo.model.User', {

    extend: 'Ext.data.Model',

    config: {
        fields: [
            {name: 'id'},
            {name: 'displayName', type: 'string'},
            {name: 'email', type: 'string'},
            {name: 'phoneNumber', type: 'string'},
            {name: 'photo', type: 'string'}
        ]
    }

    // toUrl: function() {
    //     return 'register';
    // }

});
