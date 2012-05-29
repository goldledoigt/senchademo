/**
 * @private
 * Instances of {@link Ext.io.Proxy} represent proxy objects to services running in the backend. Any
 * RPC method defined by the service can be invoked on the proxy as if it were a local method.
 *
 * The first parameter to any RPC method is always a callback function, followed by the parameters
 * to the method being called on the server.
 *
 * For example:
 *
 *     Ext.io.getService("calculator", function(calculator) {
 *         calculator.add(
 *             function(result) { // callback
 *                 display("Calculator: " + number1 + " + " + number2 + " = " + result.value);
 *             },
 *             number1, number2 // arguments
 *         );
 *     });
 *
 * The callback function to the RPC method is passed the result of the RPC call.
 */
Ext.define('Ext.io.Proxy', {

    config: {
        /**
         * @cfg name
         * @accessor
         */
        name: null,

        /**
         * @cfg descriptor
         * @accessor
         * @private
         */
        descriptor: null,

        /**
         * @cfg descriptor
         * @accessor
         * @private
         */
        rpc: null,
    },

    /**
     * @private
     *
     * Constructor
     *
     * @param {String} name The name of the service.
     * @param {Object} descriptor The service descriptor
     * @param {Object} rpc 
     *
     */
    constructor: function(config) {
        if(config.descriptor.kind != 'rpc') {
            Ext.cf.util.Logger.error(config.name + " is not a RPC service");
            throw "Error, proxy does not support non-RPC calls";
        }
        this.initConfig(config);
        this._createMethodProxies();
        return this;
    },

    /**
     * @private
     *
     * Creates proxy functions for all the methods described in the service descriptor.
     */
    _createMethodProxies: function() {
        var descriptor= this.getDescriptor();
        for(var i = 0; i < descriptor.methods.length; i++) {
            var methodName = descriptor.methods[i];
            this[methodName] = this._createMethodProxy(methodName);
        }
    },

    /**
     * @private
     *
     * Create a function that proxies a calls to the method to the server.
     *
     * @param {String} methodName
     *
     */
    _createMethodProxy: function(methodName) {
        var self = this;

        return function() {
            var descriptor= self.getDescriptor();
            var serviceArguments = Array.prototype.slice.call(arguments, 0);
            var style = descriptor.style[0];
            if(descriptor.style.indexOf("subscriber") > 0) {
                style = "subscriber"; // prefer subscriber style if available
            }
            self.getRpc().call(serviceArguments[0], self.getName(), style, methodName, serviceArguments.slice(1));
        };
    }

});
