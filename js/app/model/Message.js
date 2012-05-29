Ext.define('Demo.model.Message', {

    extend: 'Ext.data.Model',

    config: {
        fields: [
            {name: 'from'},
            {name: 'date', type: 'int'},
            {name: 'text', type: 'string'}
            // {name: 'userId', type: 'string'}
            // {name: 'username', type: 'string'}
        ]
    }

    // toUrl: function() {
    //     return 'register';
    // }

});
