/**
 * @private
 *
 */
Ext.define('Ext.cf.messaging.AuthStrategies', {
  requires: [
    'Ext.cf.util.UuidGenerator',
    'Ext.cf.util.Md5'
  ],

  statics: {
    nc: 0, // request counter used in Digest auth
    
    /** 
     * Get request counter
     *
     */
    getRequestCounter: function() {
      return ++Ext.cf.messaging.AuthStrategies.nc;
    },
    
    strategies: {
      /** 
       * Digest strategy
       *
       * @param {Object} group
       * @param {Object} params
       * @param {Function} callback
       * @param {Object} scope
       *
       */      
      'digest': function(group, params, callback, scope) {
        var username = params.username;
        var password = params.password;
        
        // step 1
        // send call without digest 'response' field, causing server to return the server nonce
        group.messaging.getService({
          name: "groupmanager",
          success: function(groupManager) {
            groupManager.loginUser(function(result) {
              if(result.status == "success") {
                var nonce = result.value.nonce;
                var qop = "auth";
                var nc = '' + Ext.cf.messaging.AuthStrategies.getRequestCounter();
                var cnonce = Ext.cf.util.UuidGenerator.generate();

                // http://en.wikipedia.org/wiki/Digest_access_authentication#Example_with_explanation

                // HA1 = MD5( "Mufasa:testgroup@host.com:Circle Of Life" )
                // = 939e7578ed9e3c518a452acee763bce9
                var ha1 = Ext.cf.util.Md5.hash(username + ":" + group.key + ":" + password);

                var uri = group.messaging.transport.getUrl();

                // HA2 = MD5( "GET:/dir/index.html" )
                // = 39aff3a2bab6126f332b942af96d3366
                var ha2 = Ext.cf.util.Md5.hash("POST:" + uri);

                /* Response = MD5( "939e7578ed9e3c518a452acee763bce9:\
                      dcd98b7102dd2f0e8b11d0f600bfb0c093:\
                      00000001:0a4f113b:auth:\
                      39aff3a2bab6126f332b942af96d3366" ) */
                var response = Ext.cf.util.Md5.hash(ha1 + ":" + nonce + ":" + nc +
                  ":" + cnonce + ":" + qop + ":" + ha2);

                groupManager.loginUser(function(result) {
                  if(result.status == "success" && result.value._bucket && result.value._bucket == "Users") {
                      var user = Ext.create('Ext.io.User', result.value._bucket, result.value._key, result.value.data, group.messaging);
                      callback.call(scope, false, user, result.sid);
                  } else {
                      callback.call(scope, true, null);
                  }
                }, {groupId : group.key, username : username, nonce : nonce, uri : uri, qop : qop, nc : nc, cnonce : cnonce, response : response, digest : true});

              } else {
                // too bad
                callback.call(scope, true, null);
              }
            }, {groupId : group.key, digest : true});            
          },
          failure: function() {
            callback.call(scope, true, null);  
          } 
        });
      }     
    }
  }
});
