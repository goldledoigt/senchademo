var extjsVersion = Ext.getVersion("extjs");
if(extjsVersion && extjsVersion.version === "4.1.0") {
    // stores disabled in ExtJS for now (store/proxy/model issues)
    if(typeof(process) !== "undefined" && process.title && process.title === "node") {
        // We don't log the error when running under node as it will cloud the mocha test output
        // Logger level cannot be set to "none", since here we are including SIO itself
        // i.e. require("../../deploy/sencha-io-debug.js");
    } else {
        Ext.cf.util.Logger.error("Disabling SIO data directory since we seem to be running the ExtJS SDK, version", extjsVersion.version);
    }
} else {
    Ext.define("Ext.io.data.Directory.Model", {
        extend: "Ext.data.Model",
        requires: ['Ext.data.identifier.Uuid'],
        config: {
             identifier: 'uuid',
             fields: [
                { name:'name', type: 'string' },
                { name:'type', type: 'string' },
                { name:'meta', type: 'auto' }
            ],
            proxy: {
                id: 'ext-io-data-directory',
                type: 'localstorage'
            }
        }
    });

    /** 
     * @private
     *
     * A directory of stores in local storage.
     *
     */
    Ext.define('Ext.io.data.Directory', {
        requires: ['Ext.data.Store'],
        store: undefined,
        
        /**
         * @private
         *
         * Constructor
         *
         * @param {Object} config
         *
         */
        constructor: function(config) {
            this.store = Ext.create('Ext.data.Store', {
                model: 'Ext.io.data.Directory.Model',
                sorters: [
                    {
                        property : 'name',
                        direction: 'ASC'
                    }               
                ],
                autoLoad: true,
                autoSync: true
            });
        },

        /**
         * Get Store
         *
         * @param {String} name
         *
         * @return {Object} Store
         *
         */
        get: function(name) {
            var index = this.store.find("name", name);
            if(index == -1) { // not found
                return null;
            } else {
                return this.store.getAt(index).data;
            }
        },

        /**
         * Get all stores
         *
         * @return {Array} Stores
         *
         */
        getAll: function() {
            var entries = this.store.getRange();
            var all = [];

            for(var i = 0; i < entries.length; i++) {
                all[i] = entries[i].data;   
            }

            return all;
        },

        /**
         * Get each store entry
         *
         * @param {Function} callback
         * @param {Object} scope
         *
         * @return {Object} Store entry
         *
         */
        each: function(callback, scope) {
          this.store.each(function(entry) {
              return callback.call(scope || entry.data, entry.data);
          }, this);  
        },

        /**
         * Add new store entry
         *
         * @param {String} name
         * @param {String} type
         * @param {String} meta
         *
         */
        add: function(name, type, meta) {
            var entry = Ext.create('Ext.io.data.Directory.Model', {
                name: name,
                type: type,
                meta: meta
            });

            this.store.add(entry);
        },

        /**
         * Update store
         *
         * @param {String} name
         * @param {String} type
         * @param {String} meta
         *
         */
        update: function(name, type, meta) {
            var index = this.store.find("name", name);
            if(index == -1) { // not found
                this.add(name, type, meta);
            } else {
               var record = this.store.getAt(index);
               record.set("type", type);
               record.set("meta", meta);
               record.save();
            }
        },

        /**
         * Remove store
         *
         * @param {String} name
         *
         */
        remove: function(name) {
            var index = this.store.find("name", name);
            if(index != -1) {
                this.store.removeAt(index);
            }

            return index;
        }
    });

}
