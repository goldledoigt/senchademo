Ext.define('Demo.view.Navigation', {

    extend: 'Ext.NavigationView',

    xtype: 'navigation',

    // override
    pop: function() {
        this.fireEvent('beforepop', this);
        this.callParent(arguments);
    }

});
