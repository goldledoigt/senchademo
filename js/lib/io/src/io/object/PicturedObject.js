/**
 * @private
 *
 * An Object that can have an picture.
 * 
 */
Ext.define('Ext.io.object.PicturedObject', {
    /** 
     * @private
     *
     * Upload Picture
     *
     * @param {Object} options
     * 
     */
    uploadPicture: function(options) {
        var self = this;

        var errorCallback = function(err) {
            Ext.callback(options.callback, options.scope, [options, false, err]);
            Ext.callback(options.failure, options.scope, [err, options]);
        };

        if (typeof options.file != "undefined") {
            options.file.ftype = 'icon';
            self.messaging.sendContent({
                params:options.file,
                failure: function(err) {
                    errorCallback(err);
                },
                success: function(csId) {
                    var tmp = options.file.name.split('.');
                    var ext = "."+tmp[tmp.length - 1];

                    self.setPicture(csId, ext, function(err, fileName) {
                        if (fileName) {
                            Ext.callback(options.callback, options.scope, [options, true, fileName]);
                            Ext.callback(options.success, options.scope, [fileName, options]);
                        } else {
                            errorCallback(err || null);
                        }
                    }, self);
                }
            });
        } else {
            var err = { code : 'FILE_PARAMS_MISSED', message : 'File parameters are missed' };
            errorCallback(err);
        }
    },

    /** 
     * @private
     *
     * Set picture
     *
     * @param {String} csKey
     * @param {String} ext
     * @param {Function} callback
     * @param {Object} scope
     * 
     */
    setPicture: function(csKey, ext, callback, scope) {
        var self = this;
        
        self.defineManager(function(err, manager) {
            if (!err) {
                self.messaging.getService({
                    name: manager,
                    success: function(managerService) {
                        managerService.setPicture(function(result) {
                            if(result.status == "success") {
                                callback.call(scope, false, result.value);
                            } else {
                                callback.call(scope, result.error || true, null);
                            }
                        }, self.bucket, self.key, csKey, ext);
                    },
                    failure: function(err) {
                        callback.call(scope, err, null);
                    }
                });
            } else {
                callback.call(scope, err, null);
            }
        });
    },

    /** 
     * @private
     *
     * Remove Icon
     *
     * @param {Object} options
     * 
     */
    removePicture: function(options) {
        var self = this;

        var errorCallback = function(err) {
            Ext.callback(options.callback, options.scope, [options, false, err]);
            Ext.callback(options.failure, options.scope, [err, options]);
        };

        self.defineManager(function(err, manager) {
            if (!err) {
                self.messaging.getService({
                    name: manager,
                    success: function(managerService) {
                        managerService.removePicture(function(result) {
                            if(result.status == "success") {
                                Ext.callback(options.callback, options.scope, [options, true, true]);
                                Ext.callback(options.success, options.scope, [true, options]);
                            } else {
                                errorCallback(result.error || null);
                            }
                        }, self.bucket, self.key);
                    },
                    failure: function(err) {
                        errorCallback(err);
                    }
                });
            } else {
                errorCallback(err);
            }
        });
    },

    /** 
     * @private
     *
     * Define object manager service
     *
     * @param {Function} callback
     * 
     */
    defineManager: function(callback) {
        var manager = null;
        switch(this.bucket) {
            case 'Apps':
                manager = 'AppService';
            break;
            case 'Teams':
                manager = 'TeamService';
            break;
        }
        if (manager) {
            callback(null, manager);
        } else {
            callback({code:'NOT_SUPPORTED', message:'This class of object does not support picture operations'}, null);
        }
    }

});

