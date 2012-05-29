Ext.define("Ext.io.ux.Authenticate", {
    extend: 'Ext.Container',
    xtype: "siologin",
    requires: ["Ext.form.Panel", "Ext.form.FieldSet", "Ext.field.Password"],
    config: {
        id: "loginpanel",
        layout: "fit",
        fullscreen: true,
        
        control: {
           '.formpanel': {
               beforesubmit: 'login'
           }
        },

        login: function() {
            console.log("login!", arguments);
            return false;
        },
  
 
        items: [
        {
            docked: 'top',
            xtype: 'titlebar',
            title: 'Login',
            items: [
            {
                text: "cancel",
                action: "cancellogin"
            },
             {
                  text: "register",
                  action: "showRegister",
                  align: 'right'
              }
            ]
        },
        {
            xtype: "panel",
            layout: "fit",
            items: [
            {
                xtype: "formpanel",
                id: "siologinform",
                listeners: {
                  submit:function(){
                    console.log("listeners.submit", arguments);
                    
                  }
                },
                items: [
                {
                    xtype: 'fieldset',
                    title: 'Login with SIO',
                    items: [
                    {
                        xtype: 'textfield',
                        placeHolder: "Username",
                        name: 'username'
                    },
                    {
                        xtype: 'passwordfield',
                        placeHolder: "Password",
                        name: 'password'
                    },
                    {
                        xtype: 'emailfield',
                        placeHolder: "Email",
                        name: 'email',
                        hidden: true
                    },
                    {
                        xtype: 'button',
                        text: 'Login',
                        action: "siologin"
                    },
                    {
                        xtype: 'button',
                        text: 'Register',
                        action: "sioRegister",
                        hidden: "true"
                    }
                    ]
                }
                ]

            }

            ]
        }
        ]
    }

});