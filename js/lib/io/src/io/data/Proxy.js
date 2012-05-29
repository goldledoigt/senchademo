
/** 
 *
 * This class provides a data synchronization service. It stores Ext.data.Model data in
 * HTML5 localStorage as JSON encoded values, and replicates those data values
 * to the Sencha.io servers. Operations can be performed on the store even when the
 * the device is offline. Offline updates are replicated to the servers when the device
 * next comes online.
 *  
 * ## Store Creation
 *
 * Models stored in a sync store are similar to Models stored in any Ext.data.Store,
 * with the exception that the sync store includes its own id generator, so an 'id'
 * field need not be declared.
 *
 *      Ext.define("Example.model.Model", {
 *          extend: "Ext.data.Model", 
 *          config: {
 *              fields: [
 *                  {name: 'name', type:'string'}, 
 *              ]
 *          }
 *      });
 *  
 * A store is declared in a similar way to any Ext.data.Store, with the type being
 * set to 'syncstorage'. 
 *
 *           Ext.define('Example.store.Store', {
 *               extend: 'Ext.data.Store',
 *               config: {
 *                   model: 'Example.model.Model',
 *                   proxy: {
 *                       type: 'syncstorage',
 *                       id: 'mystore'
 *                   },
 *               }
 *           });
 *
 * The sync store is used just like any Ext.data.Store, for example you can load
 * records, add them, or create and save them:
 *
 *          store.load();
 *          store.add({name:'bob'});
 *          var model= Ext.create('Model',{name:'joe'})
 *          model.save();
 * 
 * All of these operations are executed against the in-memory store. 
 *
 * It is only when the `sync` method is called that the store commits any 
 * changes to the proxy through its CRUD interface; create, read, update,
 * and destroy. 
 *
 *          store.sync();
 *
 * {@img store1.png}
 *
 * ## One User, One Device  
 *
 * So far, what we have described, is exactly how any Ext.data.Store behaves.
 * The advantage of the sync proxy is that it will synchronize the local
 * store to the Sencha.io servers. For a user with one device this allows
 * them to backup their data to the cloud, and thus fully recover from a
 * data loss.
 *
 * When the `sync` method is called and the device is offline then once any 
 * local updates have been applied to localStorage then the call to sync will
 * terminate and control will return to the app. However, if the device
 * is online then the proxy will initiate a replication session with the 
 * Sencha.io servers. The client uses a replication protocol to send any
 * updates required to bring the server up to date with respect to the client.
 *
 * {@img store3.png}
 *
 * ## User Owned Store
 *
 * All sync stores have an owner.
 * By default all stores are created belonging to the currently authenticated user.
 * To enable your app for user authentication it must be associated with a group.
 * You can create a group and associate it with your app using the [Developer Console](http://developer.sencha.io)
 *
 * (screen shot here)
 * 
 * If no
 * user is authenticated, then the app will not be able to syncronize the store
 * with the server and will fail with an access control error.
 *
 * User owned stores are accessible only by that user. No other users can access the store.
 *      
 *           Ext.define('Example.store.Store', {
 *               extend: 'Ext.data.Store',
 *               config: {
 *                   model: 'Example.model.Model',
 *                   proxy: {
 *                       type: 'syncstorage',
 *                       owner: 'user',
 *                       id: 'mystore'
 *                   },
 *               }
 *           });
 *
 * ## One User, Many Devices
 *
 * A user can have many devices, and they can have a copy of a particular sync
 * store on each of them. This gives them the benefit of device portability.
 * They have access to the same data from whichever device they happen to be
 * using, and can update their data right there.
 *
 * This capability is provided by the proxy. The replication protocol operates
 * in both directions, from client to server for local updates, and also from
 * server to client for remote updates. Remote updates are handled by the proxy,
 * which applies the updates to localStorage and to the bound Ext.data.Store.
 * Any views bound to the store will recieve events as if the update operations
 * had originated locally. In this way the views will be updated automatically
 * to reflect any underlying changes to the data.
 *
 * {@img store4.png}
 *
 * ## Group owned Store
 *
 * All sync stores have an owner. A group can own a store, which means that
 * the store is accessible to all the members of that group.
 * For an app to have a group owned store it must be associated with a group.
 * You can create a group and associate it with your app using the [Developer Console](http://developer.sencha.io)
 * Group stores are created by explicitly declaring their ownership upon
 * creation.
 *
 *           Ext.define('Example.store.Store', {
 *               extend: 'Ext.data.Store',
 *               config: {
 *                   model: 'Example.model.Model',
 *                   proxy: {
 *                       type: 'syncstorage',
 *                       owner: 'group',
 *                       id: 'mystore'
 *                   },
 *               }
 *           });
 *
 * ## Many Users, Many Devices
 *
 * Just as with the previous scenario of a single user with many devices,
 * when many users are sharing a store there is a copy of the store on
 * many devices. Every copy of the store can be updated and the clients
 * keep the replicas in sync by exchanging updates with the Sencha.io
 * servers.
 *
 * {@img store5.png} 
 *
 * Because updates can be applied independently at the same time on
 * different copies of the same store conflicting updates can occur.
 * The proxy includes a conflict detection and resolution algorithm
 * that ensures that all copies of the store will eventually contain
 * exactly the same data. The resolution algorithm merges conflicting
 * objects and selects the last update for conflicting primitive values.
 *
 * ## Synchronization Policy
 *
 * Since the replication protocol is always client initiated updates
 * are only exchanged when the client explicitly calls the `sync` method on
 * the store. A call to `sync` when there are no local updates pending will
 * still initiate a replication session to collect any remote updates.
 *
 *          store.sync();
 *
 * For this reason the app should implement a sync policy. Common policies are:
 *
 *  - call sync when a local change occurs
 *  - call sync when the user takes some action, like clicking on 'refresh'
 *  - call sync on an internal timer, perhaps every few seconds
 *  - call sync when a message arrives on a shared queue, which is used to
 *    broadcast an update notification.
 */
Ext.define('Ext.io.data.Proxy', {
    extend: 'Ext.data.proxy.Client',
    alias: 'proxy.syncstorage',
    requires: [
        'Ext.cf.Utilities',
        'Ext.cf.data.SyncProxy',
        'Ext.cf.data.SyncStore',
        'Ext.cf.data.Protocol'
    ],

    proxyInitialized: false,
    proxyLocked: true,
   
    
    /**
     * @private
     *
     * Constructor
     *
     * @param {Object} config
     *
     */
    constructor: function(config) {
        this.logger = Ext.cf.util.Logger;
        Ext.cf.Utilities.check('Ext.io.data.Proxy', 'constructor', 'config', config, ['id']);
        this.config= config;
        this.config.databaseName= config.id;
        this.proxyLocked= true;
        this.proxyInitialized= false;
        this.callParent([config]);
        //
        // Check the Database Directory
        //   The store might be known about, but was cleared.
        //
        var directory= Ext.io.Io.getStoreDirectory();
        var db= directory.get(this.config.databaseName, "syncstore");
        if(db){
            directory.add(this.config.databaseName, "syncstore");
        }
    },

    /**
     * @private
     * Create
     *
     */
    create: function(){
        var a= arguments;
        this.with_proxy(function(remoteProxy){
            remoteProxy.create.apply(remoteProxy,a);
        },this);
    },

    /**
     * @private
     * Read
     *
     */
    read: function(){
        var a= arguments;
        this.with_proxy(function(remoteProxy){
            remoteProxy.read.apply(remoteProxy,a);
        },this);
    },

    /**
     * @private
     * Update
     *
     */
    update: function(){
        var a= arguments;
        this.with_proxy(function(remoteProxy){
            remoteProxy.update.apply(remoteProxy,a);
        },this);
    },

    /**
     * @private
     * Destroy
     *
     */
    destroy: function(){
        var a= arguments;
        this.with_proxy(function(remoteProxy){
            remoteProxy.destroy.apply(remoteProxy,a);
        },this);
    },

    /**
     * @private
     * Set Model
     *
     */
    setModel: function(){
        var a= arguments;
        this.with_proxy(function(remoteProxy){
            remoteProxy.setModel.apply(remoteProxy,a);
        },this);
    },

    /**
     * @private
     * Sync
     *
     * @param {Object} store The store this proxy is bound to. The proxy fires events on it to update any bound views.
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    sync: function(store,callback,scope) {
        if(this.proxyLocked){
            // 
            // if there are local updates to be applied, then we should queue the call, and call it once the sync in progress has completed.
            //
            if(this.storeHasUpdates(store)){
                // JCM queue the request to sync
                // JCM do another sync when this one finishes
                // JCM we only have to queue one..?
                if(callback) {
                    callback.call(scope,{r:'error',message:'local updates do need to be synched, but a remote sync is currently in progress'});
                }
            }else{
                //
                // if there are no local updates, then we do nothing, since the sync in progress is already doing the requested sync. 
                //
                callback.call(scope,{r:'ok',message:'no local updates to sync, and remote sync is already in progress'});
            }
        } else {
            this.with_proxy(function(remoteProxy){
                this.proxyLocked= true;
                try {
                    //
                    // sync the local storage proxy
                    //
                    var changes= store.storeSync();
                    store.removed= []; // clear the list of records to be deleted
                    //
                    // sync the remote storage proxy
                    //
                    this.logger.info('Ext.io.data.Proxy.sync: Start sync of database:',this.config.databaseName);
                    this.protocol.sync(function(r){
                        if(r.r=='ok'){
                            this.setDatabaseDefinitionRemote(true); // the server knows about the database now
                        }
                        this.updateStore(store,r.created,r.updated,r.removed);
                        this.proxyLocked= false;
                        this.logger.info('Ext.io.data.Proxy.sync: End sync of database:',this.config.databaseName);
                        if(callback) {
                            callback.call(scope,r);
                        }
                    },this);
                } catch (e) {
                    this.proxyLocked= false;
                    this.logger.error('Ext.io.data.Proxy.sync: Exception thrown during synchronization');
                    this.logger.error(e);
                    this.logger.error(e.stack);
                    throw e;
                }
            },this);
        }
    },

    /**
     * @private
     *
     * Check if the store has any pending updates: add, update, delete
     *
     */
    storeHasUpdates: function(store) {
        var toCreate = store.getNewRecords();
        if(toCreate.length>0) {
            return true;
        }else{
            var toUpdate = store.getUpdatedRecords();
            if(toUpdate.length>0){
                return true;
            }else{
                var toDestroy = store.getRemovedRecords();
                return (toDestroy.length>0);
            }
        }
    },

    /**
     * @private
     *
     * Update the store with any created, updated, or deleted records.
     *
     * Fire events so that any bound views will update themselves.
     *
     */
    updateStore: function(store,createdRecords,updatedRecords,removedRecords){
        var changed = false;
        if(createdRecords && createdRecords.length>0) {
            store.data.addAll(createdRecords);
            store.fireEvent('addrecords', this, createdRecords, 0);
            changed = true;
        }
        if(updatedRecords && updatedRecords.length>0) {
            store.data.addAll(updatedRecords);
            store.fireEvent('updaterecord', this, updatedRecords);
            changed = true;
        }
        if(removedRecords && removedRecords.length>0) {
            var l= removedRecords.length;
            for(var i=0;i<l;i++){
                var id= removedRecords[i].getId();
                store.data.removeAt(store.data.findIndexBy(function(i){ // slower, but will match
                    return i.getId()===id;
                }));
            }
            store.fireEvent('removerecords', this, removedRecords);
            changed = true;
        }
        if(changed) {
            //
            // We only want to call refresh if something changed, otherwise sync will cause
            // UI strangeness as the components refresh for no reason.
            //
            store.fireEvent('refresh');
        }
    },
    
    /**
     * @private
     * Clear
     *
     * The proxy can be reused after it has been cleared.
     *
     */
    clear: function() {
        if(this.proxyInitialized) {
            this.proxyLocked= true;
            this.setDatabaseDefinitionLocal(false); // we no longer have a local copy of the data
            this.remoteProxy.clear(function(){ // JCM why are we clearing the remote... shouldn't it clear the local?
                delete this.localProxy;
                delete this.remoteProxy;
                delete this.protocol;
                this.proxyInitialized= false;
                this.proxyLocked= false;
            },this);
        }
    },
    
    // private

    /**
     * @private
     *
     * Set DB Definition = Local
     *
     * @param {Boolean/String} flag
     *
     */
    setDatabaseDefinitionLocal: function(flag){
        Ext.io.Io.getStoreDirectory().update(this.config.databaseName, "syncstore", {local: flag});
    },
    
    /**
     * @private
     *
     * Set DB Definition = Remote
     *
     * @param {Boolean/String} flag
     *
     */
    setDatabaseDefinitionRemote: function(flag){
        Ext.io.Io.getStoreDirectory().update(this.config.databaseName, "syncstore", {remote: flag});
    },

    /**
     * @private
     *
     * create the local proxy, remote proxy, and protocol
     *
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    with_proxy: function(callback,scope) {
        if(this.proxyInitialized){
            callback.call(scope,this.remoteProxy);
        }else{
            Ext.io.Io.init(function(){
                this.createLocalProxy(function(localProxy){
                    this.localProxy= localProxy;
                    this.createRemoteProxy(function(remoteProxy){
                        this.remoteProxy= remoteProxy;
                        this.protocol= Ext.create('Ext.cf.data.Protocol',this.remoteProxy);
                        Ext.cf.Utilities.delegate(this,this.remoteProxy,['read','update','destroy']);
                        this.setDatabaseDefinitionLocal(true); // we have a local copy of the data now
                        this.proxyLocked= false; // we're open for business
                        this.proxyInitialized= true;
                    },this);
                },this);
            },this);
        }
    },

    /**
     * @private
     *
     * create local storage proxy
     *
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    createLocalProxy: function(callback,scope) {
        //
        // Local Storage Proxy
        //
        var syncStoreName= this.config.localSyncProxy||'Ext.cf.data.SyncStore';
        var localProxy= Ext.create(syncStoreName);
        localProxy.asyncInitialize(this.config,function(r){
            if(r.r!=='ok'){
                this.logger.error('Ext.io.data.Proxy: Unable to create local proxy:',syncStoreName,':',Ext.encode(r));
            }
            callback.call(scope,localProxy);
        },this);
    },

    /**
     * @private
     *
     * create remote storage proxy
     *
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    createRemoteProxy: function(callback,scope) {
        var owner= this.getOwner(this.config.owner);
        var databaseDefinition= {
            databaseName: this.config.databaseName,
            generation: 0
        };
        Ext.apply(databaseDefinition,owner);
        var config= {
            databaseDefinition: databaseDefinition,
            replicaDefinition: {
                deviceId: this.config.deviceId||Ext.io.Io.naming.getStore().getId('device'),
                replicaNumber: 0
            },
            store: this.localProxy,
            clock: this.config.clock
        };
        var remoteProxy= Ext.create('Ext.cf.data.SyncProxy');
        remoteProxy.asyncInitialize(config,function(r){
            if(r.r!=='ok'){
                this.logger.error('Ext.io.data.Proxy: Unable to create remote proxy:',Ext.encode(r));
            }
            callback.call(scope,remoteProxy);
        },this);
    },

    /**
     * @private
     *
     * get owner
     *
     * @param {Function} callback
     * @param {Object} scope
     *
     */
     getOwner: function(owner){
        var r= {};
        if(!owner || owner==='user'){
            r= {userId: this.config.userId || Ext.io.Io.naming.getStore().getId('user')};
        } else if(owner==='group'){
            r= {groupId: this.config.groupId || Ext.io.Io.naming.getStore().getId('group')};
        } else {
            this.logger.error('Ext.io.data.Proxy: Unknown owner:',owner);
        }
        return r;
     },
});

