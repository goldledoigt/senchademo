/**
 * @private
 *
 */
Ext.define('Ext.cf.Utilities', {
    requires: ['Ext.cf.util.Logger'],

    statics: {

        /**
         * Delegate
         *
         * @param {Object} from_instance
         * @param {Object} to_instance
         * @param {Array} methods
         *
         */
        delegate: function(from_instance, to_instance, methods) {
            if (to_instance===undefined) { 
                var message= "Error - Tried to delegate '"+methods+"' to undefined instance.";
                Ext.cf.util.Logger.error(message);
                throw message;
            }
            methods.forEach(function(method){
                var to_method= to_instance[method];
                if (to_method===undefined) { 
                    message= "Error - Tried to delegate undefined method '"+method+"' to "+to_instance;
                    Ext.cf.util.Logger.error(message);
                    throw message;
                }
                from_instance[method]= function() {
                    return to_method.apply(to_instance, arguments);
                };
            });
        },

        /**
         * Check
         *
         * @param {String} class_name for reporting
         * @param {String} method_name for reporting
         * @param {String} instance_name for reporting
         * @param {Object} instance of the object we are checking
         * @param {Array} properties that we expect to find on the instance 
         *
         */
        check: function(class_name, method_name, instance_name, instance, properties) {
            if (instance===undefined) {
                var message= "Error - "+class_name+"."+method_name+" - "+instance_name+" not provided.";
                Ext.cf.util.Logger.error(message);
            } else {
                properties.forEach(function(property) {
                    var value= instance[property];
                    if (value===undefined) {
                        var message= "Error - "+class_name+"."+method_name+" - "+instance_name+"."+property+" not provided.";
                        Ext.cf.util.Logger.error(message);
                    }
                });
            }
        }
    }

});

