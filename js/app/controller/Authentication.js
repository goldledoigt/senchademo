Ext.define('Demo.controller.Authentication', {

    extend: 'Ext.app.Controller',

    requires: ['Ext.MessageBox'],

    config: {
        views: [
            'Authentication',
            'authentication.Login',
            'authentication.Register'
        ],
        models: ['Register', 'Login'],
        refs: {
            loginForm: 'login',
            registerForm: 'register'
        },
        control: {
            'login button': {
                tap: 'onLoginButtonTap'
            },
            'register button': {
                tap: 'onRegisterButtonTap'
            }
        },
        before: {

        },
        routes: {

        }
    },

    login: function() {
        console.log('login');
        var io = Demo.utils.Io,
            form = this.getLoginForm();

        form.setMasked({
            xtype: 'loadmask',
            message: 'Login...'
        });

        io.authenticate({
            scope: this,
            values: form.getValues(),
            success: this.onLoginSuccess,
            failure: this.onLoginError
        });
    },

    register: function() {
        var io = Demo.utils.Io,
            form = this.getRegisterForm();

        form.setMasked({
            xtype: 'loadmask',
            message: 'Register...'
        });

        io.register({
            scope: this,
            values: form.getValues(),
            success: this.onRegisterSuccess,
            failure: this.onRegisterError
        });
    },

    validate: function(values, record) {
        var errors;

        record.set(values);
        errors = record.validate();

        if (errors.isValid()) {
            return true;
        }

        this.showValidationErrors(errors);
        return false;
    },

    showValidationErrors: function(errors) {
        var msg = '';

        errors.each(function(error) {
            msg += '<div>'+ error.getField() +': '+ error.getMessage() +'</div>';
        });
        Ext.Msg.alert('Error', msg);
    },

    onLoginSuccess: function() {
        var form = this.getLoginForm();

        form.setMasked(false);
        this.redirectTo('messages');
    },

    onLoginError: function(error) {
        var form = this.getLoginForm();

        form.setMasked(false);
        Ext.Msg.alert('Error', error.message);
    },

    onRegisterSuccess: function() {
        var form = this.getRegisterForm();

        form.setMasked(false);
        this.redirectTo('messages');
    },

    onRegisterError: function(error) {
        var form = this.getRegisterForm();

        form.setMasked(false);
        Ext.Msg.alert('Error', error.message);
    },

    onLoginButtonTap: function() {
        var record = Ext.create('Demo.model.Login'),
            values = this.getLoginForm().getValues();

        if (this.validate(values, record)) {
            this.login();
        }
    },

    onRegisterButtonTap: function() {
        var record = Ext.create('Demo.model.Register'),
            values = this.getRegisterForm().getValues();

        if (this.validate(values, record)) {
            this.register();
        }
    }

});
