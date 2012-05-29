Ext.define('Ext.cf.util.LoggerConstants', {
    statics: {
        NONE: 10,
        ERROR: 5,
        WARNING: 4,
        INFO: 3,
        DEBUG: 2,
        PERF: 1,
 
        STR_TO_LEVEL: {
          "perf": 1,
          "debug": 2,
          "info": 3,
          "warn": 4,
          "error": 5,
          "none": 10
        }
    }
});
 
Ext.define('Ext.cf.util.Logger', {
    statics: {
        level: Ext.cf.util.LoggerConstants.ERROR,
 
        setLevel: function(levelString) {
            if(Ext.cf.util.LoggerConstants.STR_TO_LEVEL[levelString]) {
                Ext.cf.util.Logger.level = Ext.cf.util.LoggerConstants.STR_TO_LEVEL[levelString];
            } else {
                Ext.cf.util.Logger.level = Ext.cf.util.LoggerConstants.NONE;
            }
        },

        perf: function() {
            if(Ext.cf.util.Logger.level <= Ext.cf.util.LoggerConstants.PERF) {
                Ext.cf.util.Logger.message('PERF:',arguments);
            }
        },

        debug: function() {
            if(Ext.cf.util.Logger.level <= Ext.cf.util.LoggerConstants.DEBUG) {
                Ext.cf.util.Logger.message('DEBUG:',arguments);
            }
        },
 
        info: function() {
            if(Ext.cf.util.Logger.level <= Ext.cf.util.LoggerConstants.INFO) {
                Ext.cf.util.Logger.message('INFO:',arguments);
            }
        },
 
        warn: function() {
            if(Ext.cf.util.Logger.level <= Ext.cf.util.LoggerConstants.WARNING) {
                Ext.cf.util.Logger.message('WARNING:',arguments);
            }
        },
 
        error: function() {
            if(Ext.cf.util.Logger.level <= Ext.cf.util.LoggerConstants.ERROR) {
                Ext.cf.util.Logger.message('ERROR:',arguments);
            }
        },
 
        message: function(level,a){
            var b= Array.prototype.slice.call(a);
            b.unshift(level);

            if (typeof console != "undefined") {
                switch (typeof console.log) {
                    case 'function':
                        console.log.apply(console,b);
                    break;
                    case 'object':
                        console.log(b.join(" "));
                    break;
                }
            }
        }
 
    }
});
 
