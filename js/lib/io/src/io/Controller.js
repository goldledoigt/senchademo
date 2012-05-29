/**



Io App Controller

events:
initComplete
connected
disconnected
authorized
message
logout

properties:

authenticationView

Added Methods:

app.sio.login() <--  trigger the login controller.
app.sio.logout(callback)  <-- wipe all local data for user.
app.sio.publish( topic, key, message, callback); 
app.sio.subscribe( topic, key, callback);
app.sio.getUser()  user object or null if no auth
app.sio.getGroup() group object or null
app.sio.isConected() 



SyncStore:
Store subclass that simplifies creating stores:

config: {
	scope: "group|user" (default to user) 
	ioKey: String -- unique key for the store. should fail loudly if not provided. 
}

Proxy is set automatically
Reader isn't configurable.
All other store properties are usable like model, sort, filter etc.

Long run we need an expressive way to control how data is loaded from the server both for number of rows and columns. 
We will need something similar for auto syncing on specific events.

To handle offline correctly we need to store enough user/group information in local storage so that the application can function correctly wen not connected.
A call to getUser or getGroup should return correctly if we are offline but have a user in local storage.


When the store is created it calls getUser() and getGroup() (as appropriate) and it checks to see if there is data in localstorage already.
Auto load needs to work correctly.  If autoLoad is false then don't pull from local storage.  If true then pull from local storage then call sync if we are connected.
It should then listen for "connected", "disconnected", "authorized" and  "logout" events of the application.
"authorized"  will trigger: 1) dumping any local data if old and new user don't match 2) sync() if autoload is set to true. 
"connected" will trigger sync()
"logout" will trigger a wipe of local data for the store
"disconnected" will result in sync being a no-op



*/


Ext.define('Ext.io.Controller', {
    extend: 'Ext.app.Controller',

    requires: [
      'Ext.io.Io'             /* requires base Io singlton so that we can call Ext.io.init(); FIXME: simplify for the release. */
    , 'Ext.io.data.Proxy'
    ],

    config: {
      authenticationView: null
    },


    init: function() {
      
      var conf = this.getApplication().config.io;
      console.log("IO.init", this, conf);
      var io = this;
      /*
      * add a getter for IO to the application for easy access. 
      */
      this.getApplication().sio = io;
      
      Ext.io.Io.setup(conf);
      
      Ext.io.Io.init(function() {
        io.fireEvent("initComplete");
      });
    
      
    },
    
   launch: function() {
      console.log("IO.lanuch");
      this.login();  
   },
    
   /**
   * Connect to IO servers using app's config.io
   */
   connect: function(){
     console.log("IO.connect");
   },
   
   /**
   * Disconnect from the IO servers without logging out or removing user data.
   */
   disconnect: function(){
     console.log("IO.disconnect");     
   },
  
   /**
   * Authenticate the user against the group of the application. 
   */
   login: function() {
      console.log("IO.login");
      this.getUser(function(isAuth, user){
        if(isAuth) {
             this.fireEvent("authorized", user);
        } else {
          //Show login!
        }
      }, this);
    },
    
    /**
    * Removes all local data about the user and disconnects from the io servers if connected.
    */
    logout: function(){
      console.log("IO.logout");
      
    },
    
    /**
    * Broadcasts a message to a Queue
    */
    publish: function(topic, key, message, callback){
      console.log("IO.publish");
      
      
    },
    
    /**
    * Instructs IO to listen for messages on a topic and key.
    * will fire an application event whenver a message is recieved.
    * supploy a callback to attach a function to the event in one step.
    */
    subscribe: function(topic, key, callback){
      console.log("IO.subscribe");
      
    },
    
    /**
    * Get a reference to the current user.
    */
    getUser: function(callback, scope){
      console.log("IO.getUser");
      if(!callback) {
        return;
      }
      scope = scope || this;
      callback = callback || Ext.emptyFn;
      
       Ext.io.Io.getCurrentUser({
            callback: function(cb, isAuth, user) {
                console.log("getcurrentuser", arguments);
                callback.call(scope, isAuth, user);
            }
        });
      
    },
    
    
    /**
    * Get a reference to the application's group
    */
    getGroup: function(callback, scope){
      console.log("IO.getGroup");
      if(!callback) {
        return;
      }
      scope = scope || this;
      callback = callback || Ext.emptyFn;
      
      Ext.io.Io.getCurrentGroup({
          callback: function(options, success, group) {
              console.log("getCurrentGroup", group);
              callback.call(scope, isAuth, user); 
          }
      });
      
    },
    
    /**
    * Are we connected to the IO servers?
    */
    isConected: function(){
      console.log("IO.isConected");
      return false;
      
    }
});