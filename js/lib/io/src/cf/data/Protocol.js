/**
 * 
 * @private
 *
 * Replication Protocol
 *
 */
Ext.define('Ext.cf.data.Protocol', {
    requires: [
        'Ext.cf.data.Updates', 
        'Ext.cf.data.Transaction',
        'Ext.cf.ds.CSV',
        'Ext.cf.data.Updates',
        'Ext.io.Proxy'
    ],

    
    /** 
     * Constructor
     *
     * @param {Object} local
     *
     */
    constructor: function(local) {
        this.version= 2;
        this.local= local;
        this.logger = Ext.cf.util.Logger;
    },

    /** 
     * Sync
     *
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    sync: function(callback,scope) {
        var self= this;
        this.sendGetUpdate({},function(r){
            self.logger.debug('Protocol.sync: done',Ext.encode(r));
            callback.call(scope,r);
        });
    },

    /** 
     * @private
     * 
     * @param {Object} r
     * @param {Function} callback
     *
     */
    sendGetUpdate: function(r,callback) {
        this.logger.debug('Protocol.sendGetUpdate');
        var self= this;
        Ext.io.Io.getService({
            name: "sync", 
            success: function(service) {
                var message= {
                    dd: this.local.databaseDefinition.getCurrentConfig(),
                    rd: this.local.replicaDefinition.getCurrentConfig(),
                    csv: this.local.csv.encode()
                };
                service.getUpdates(
                    function(response){
                        if(!response.r) {
                            response= response.value; // JCM the sync server integration tests need this.... some bug in the mock transport that i don't understand
                        }
                        self.receiveResponse(response,r,function(r){
                            if(response.r==='ok'){
                                var updates_csv= Ext.create('Ext.cf.ds.CSV').decode(response.updates_csv);
                                var required_csv= Ext.create('Ext.cf.ds.CSV').decode(response.required_csv);
                                self.updateLocalState(self.local,updates_csv,function(){
                                    var updates= Ext.create('Ext.cf.data.Updates').decode(response.updates);
                                    r.received= updates.length();
                                    self.local.putUpdates(updates,updates_csv,function(response){
                                        self.sendPutUpdate(required_csv,response,callback);
                                    },this);
                                },this);
                            }else{
                                callback(r);
                            }
                        });
                    },
                    message
                );
            },
            failure: callback,
            scope: this
        });
    },

    /** 
     * @private
     *
     * Receive response
     * 
     * @param {Object} response 
     * @param {Object} r
     * @param {Function} callback
     *
     */
    receiveResponse: function(response,r,callback){
        this.logger.debug('Protocol.receiveResponse',Ext.encode(response));
        switch(response.r||response.value.r){ // JCM the sync server integration tests need this.... some bug in the mock transport that i don't understand
        case 'ok':
            callback(response);
            break;
        case 'set_replica_number':
        case 'new_replica_number':
            //
            // A replica number collision, or re-initialization, has occured. 
            // In either case we must change our local replica number.
            //
            if(r.new_replica_number==response.replicaNumber){
                this.logger.error("Protocol.receiveResponse: The server returned the same replica number '",response,"'");
                callback.call({r:'error_same_replica_number'});
            }else{
                r.new_replica_number= response.replicaNumber;
                this.logger.info('Protocol.receiveResponse: Change local replica number to',response.replicaNumber);
                this.local.setReplicaNumber(response.replicaNumber,function(){
                    this.sendGetUpdate(r,callback);
                },this);
            }
            break;
        case 'new_generation_number':
            //
            // The database generation has changed. We clear out the database,
            // and update the definition. 
            //
            if (response.generation>this.local.definition.generation) {
                r.new_generation_number= response.generation;
                this.local.definition.set({generation:response.generation},function(){
                    this.local.reset(function(){
                        this.sendGetUpdate(r,callback);
                    },this);
                },this);
            } else {
                // local is the same, or greater than the server.
            }
            break;
        case 'error':
            this.logger.error("Protocol.receiveResponse: The server returned the error '",response.message,"'");
            callback(response);
            break;
        default:
            this.logger.error('Protocol.receiveResponse: Received unknown message:',response);
            callback(response);
        }
    },

    /** 
     * @private
     * 
     * @param {Ext.cf.ds.CSV} required_csv 
     * @param {Object} r
     * @param {Function} callback
     *
     */
    sendPutUpdate: function(required_csv,r,callback) {
        this.logger.debug('Protocol.sendPutUpdate',required_csv);
        r.sent= 0;
        r.r= 'ok';
        if(!required_csv.isEmpty()){
            //
            // The required CSV contains only the difference between the local
            // CSV and the remote CSV. We combine the local and required CSV to
            // get the remote CSV.
            //
            var remote_csv= Ext.create('Ext.cf.ds.CSV',this.local.csv);
            remote_csv.setCSV(required_csv);
            this.local.getUpdates(remote_csv,function(updates,local_csv){
                if((updates && !updates.isEmpty()) || (local_csv && !local_csv.isEmpty())){
                    Ext.io.Io.getService({
                        name:"sync", 
                        success: function(service) {
                            r.sent= updates.length();
                            var message= {
                                dd: this.local.databaseDefinition.getCurrentConfig(),
                                rd: this.local.replicaDefinition.getCurrentConfig(),
                                csv: this.local.csv.encode(),
                                updates: Ext.encode(updates.encode())
                            };
                            service.putUpdates(
                                function(r2){
                                    Ext.apply(r,r2);
                                    callback(r);
                                },
                                message
                            );
                        },
                        failure: callback,
                        scope: this
                    });
                }else{
                    this.logger.debug('Protocol.sendPutUpdate: no work');
                    callback(r);
                }
            },this);
        }else{
            this.logger.debug('Protocol.sendPutUpdate: no work');
            callback(r);
        }
    },

    /** 
     * @private
     * 
     * @param {Object} local  
     * @param {Ext.cf.ds.CSV} csv 
     * @param {Function} callback
     * @param {Object} scope
     *
     */
    updateLocalState: function(local,csv,callback,scope) {
        Ext.create('Ext.cf.data.Transaction',local,function(t){
            //
            // The remote CSV describes the state of updated-ness of the
            // server this client is talking to. We add any replica numbers
            // that are new to us to our local CSV.
            //
            t.updateReplicaNumbers(csv);
            //
            // And we update the CS generator with the maximum CS in the
            // CSV, so that the local time is bumped forward if one of 
            // the other replicas is ahead of us.
            //
            // We do this ahead of receiving updates to ensure that any
            // updates we generate will be ahead of the updates that
            // were just received. 
            //
            t.updateGenerator(csv);
            t.commit(callback,scope);
        },this);
    }

});

