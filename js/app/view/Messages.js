Ext.define('Demo.view.Messages', {

    extend: 'Ext.List',

    xtype: 'messages',

    config: {
        cls: 'messages',
        store: 'messagesStore',
        itemTpl: '{text}',
        items: [{
            docked: 'top',
            xtype: 'toolbar',
            title: 'Messages'
        }, {
            height: 100,
            docked: 'bottom',
            xtype: 'toolbar',
            layout: {
                type: 'hbox',
                pack: 'start',
                align: 'stretch'
            },
            items: [{
                flex: 1,
                clearIcon: false,
                xtype: 'textareafield',
                placeHolder: 'Message...'
            }, {
                height: 24,
                text: 'SEND',
                margin: '8 5 0 0',
                xtype: 'button'
            }]
        }]
    }

});
