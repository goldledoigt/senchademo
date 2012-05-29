Ext.define('Ext.cf.messaging.DeviceAllocator', {
    
    requires: ['Ext.cf.util.Logger'],

    statics: {
        register: function(url, appId, callback) {
            this.callServer(url, "/device/register", {appId: appId}, callback);
        },

        authenticate: function(url, deviceSid, deviceId, callback) {
            this.callServer(url, "/device/authenticate", {deviceSid: deviceSid, deviceId: deviceId}, callback);
        },

        callServer: function(url, api, data, callback) {
            Ext.Ajax.request({
                method: "POST",
                url: url + api,
                params: {},
                jsonData: data,
                scope: this,
                callback: function(options, success, response) {
                    if(success) {
                        callback(Ext.decode(response.responseText));
                    } else {
                        callback({status:'error', error: {code: 'API_ERROR', message:'Error during API call' + api + ' Status ' + response.status }});
                    }
                }
            });            
        }
    }
});
