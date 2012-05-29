Ext.define('Demo.controller.Main', {

    extend: 'Ext.app.Controller',

    config: {
        views: ['Navigation', 'UsersList', 'UserDetails'],
        stores: ['Users'],
        refs: {
            navigation: {
                autoCreate: true,
                xtype: 'navigation',
                selector: 'viewport navigation'
            },
            usersList: {
                autoCreate: true,
                xtype: 'userslist',
                selector: 'viewport navigation userslist'
            },
            userDetails: {
                autoCreate: true,
                xtype: 'userdetails',
                selector: 'viewport navigation userdetails'
            }
        },
        control: {
            navigation: {
                beforepop: 'onNavigationBeforePop'
            },
            usersList: {
                itemtap: 'onUsersListItemTap'
            }
        },
        routes: {
            '': 'showUsersList',
            'user/:id': 'showUserDetails'
        },
        before: {
            showUsersList: ['checkSomething']
        }
    },

    launch: function() {
        var navigation = this.getNavigation();

        Ext.Viewport.add(navigation);
    },

    checkSomething: function(action) {
        // Do something useful before rendering users list...
        action.resume();
    },

    showUsersList: function() {
        console.log('showUsersList');
        var usersList = this.getUsersList(),
            navigation = this.getNavigation(),
            item = navigation.getActiveItem();

        if (item && item.xtype === 'userdetails') {
            navigation.pop();
        } else {
            navigation.push(usersList);
        }
    },

    showUserDetails: function(id) {
        var store = Ext.getStore('usersStore'),
            userDetails = this.getUserDetails(),
            navigation = this.getNavigation(),
            record = store.getById(id);

        navigation.push(userDetails);
        userDetails.setData(record.data);
    },

    onNavigationBeforePop: function(navigation) {
        var action = new Ext.app.Action({url: ''}),
            history = this.getApplication().getHistory();

        history.add(action, true);
    },

    onUsersListItemTap: function(list, index, el, record) {
        var id = record.getId();

        this.redirectTo('user/' + id);
    }

});
