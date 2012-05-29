Ext.define('Demo.store.Users', {

    extend: 'Ext.data.Store',

    requires: [
        'Demo.model.User'
    ],

    config: {
        storeId: 'usersStore',
        model: 'Demo.model.User',
        data: [
            {'id':1, 'displayName': 'Marie Testu', 'phoneNumber': '06 89 34 57 33', 'email': 'mtestu@hotmail.com', 'photo': 'http://m4.licdn.com/mpr/mpr/shrink_100_100/p/4/000/145/015/1a4c5ed.jpg'},
            {'id':2, 'displayName': 'Philippe Dubert', 'phoneNumber': '06 57 33 89 34', 'email': 'pdubert@gmail.com', 'photo': 'http://media01.linkedin.com/mpr/mpr/shrink_60_60/p/2/000/015/017/174ca01.jpg'},
            {'id':3, 'displayName': 'Francois Damien', 'phoneNumber': '06 89 68 34 56', 'email': 'fdamien@wanadoo.fr', 'photo': 'http://media01.linkedin.com/mpr/mpr/shrink_60_60/p/2/000/0cc/12c/1c01ee7.jpg'}
        ]
    }

});
