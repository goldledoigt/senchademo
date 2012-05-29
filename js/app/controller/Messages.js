Ext.define('Demo.controller.Messages', {

    extend: 'Ext.app.Controller',

    config: {
        views: ['Messages'],
        models: ['Message'],
        stores: ['Messages'],
        refs: {
            messages: 'messages'
        },
        control: {
            'messages button': {
                tap: 'onSendButtonTap'
            }
        },
        before: {

        },
        routes: {

        }
    },

    sendMessage: function() {
        console.log('sendMessage 1');
        var message,
            user = Demo.utils.Io.getUser(),
            messages = this.getMessages(),
            store = messages.getStore(),
            field = messages.down('textfield'),
            text = field.getValue(),
            from = Ext.cf.util.Md5.hash(user.data.email);

        // message = Ext.create('Demo.model.Message', {
        //     text: value,
        //     userId: user.key,
        //     username: user.username
        // });

        console.log('sendMessage 2', user);
        store.add({
            from: from,
            text: text,
            date: Ext.Date.format(new Date(), 'U')
            // userId: user.key,
            // username: user.username
        });
        console.log('sendMessage 3', store.getRange());
        store.sync(function() {
            console.log('SYNC CALLBACK 2', this, arguments);
        });
        console.log('sendMessage 4');
    },

    onSendButtonTap: function() {
        this.sendMessage();
    }

});
