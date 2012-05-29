Ext.define('Ext.cf.Overrides', {
    requires: [
        'Ext.data.Store'
    ]
}, function(){
   var patch_st2_b2b3rc= function(){
        Ext.data.Store.prototype.storeSync= Ext.data.Store.prototype.sync;

        Ext.data.Store.override({
            /**
             * Synchronizes the Store with its Proxy. This asks the Proxy to batch together any new, updated
             * and deleted records in the store, updating the Store's internal representation of the records
             * as each operation completes.
             */
            sync: function(callback,scope) {
                if (typeof(this.getProxy().sync) === "undefined") {
                    return this.storeSync();
                }else{
                    return this.getProxy().sync(this,callback,scope);
                }
            }
        });
    };

    var patch_ext41_b2= function(){

        Ext.io_Observable= 'Ext.util.Observable';

        Ext.data.Store.prototype.storeSync= Ext.data.AbstractStore.prototype.sync;

        Ext.data.Store.override({
            /**
             * Synchronizes the Store with its Proxy. This asks the Proxy to batch together any new, updated
             * and deleted records in the store, updating the Store's internal representation of the records
             * as each operation completes.
             */
            sync: function(callback,scope) {
                if (typeof(this.getProxy().sync) === "undefined") {
                    return this.storeSync();
                }else{
                    return this.getProxy().sync(this,callback,scope);
                }
            }
        });
        
    };
    
    var m= "ERROR: The Sencha.io SDK requires either the Sencha Touch SDK or the Sencha Ext JS SDK.";
    if(typeof Ext==='undefined'){
        console.log(m);
        throw m;
    }else{
        var coreVersion= Ext.getVersion('core'), t;
        if(!coreVersion){
            t= m+" Ext is defined, but getVersion('core') did not return the expected version information.";
            console.log(t);
            throw t;
        }else{
            var version= coreVersion.version;
            var touchVersion= Ext.getVersion('touch');
            var extjsVersion= Ext.getVersion('extjs');
            if(touchVersion && extjsVersion){
                t= "WARNING: Both the Sencha Touch SDK and the Sencha Ext JS SDK have been loaded. This could lead to unpredicatable behaviour.";
                console.log(t);
            }
            if(!touchVersion && !extjsVersion){
                t= m+" The Ext Core SDK is on its own is not sufficient.";
                console.log(t);
                throw t;
            }
            if(extjsVersion){
                version= extjsVersion.version;
                if(version === "4.1.0") {
                    patch_ext41_b2();
                } else {
                    t= m+" Version "+version+" of the Sencha Ext SDK and this version of the Sencha.io SDK are not fully compatible.";
                    console.log(t);
                    throw t;
                }
            }else if(touchVersion){
                version= touchVersion.version;
                switch(version){
                    case '2.0.0.beta2':
                    case '2.0.0.beta3':
                    case '2.0.0.rc':
                    case '2.0.0':
                    case '2.0.1':
                        patch_st2_b2b3rc();
                        break;
                    default:
                        t= m+" Version "+version+" of the Sencha Touch SDK and this version of the Sencha.io SDK are not fully compatible.";
                        console.log(t);
                        throw t;
                }
            }else{
                t= m+" They were here, but now I can't find them.";
                console.log(t);
                throw t;
            }
        }
    }
});