/**
 * @private
 *
 */
Ext.define('Ext.cf.messaging.EnvelopeWrapper', {
    requires: ['Ext.data.identifier.Uuid'],
    extend: 'Ext.data.Model',

    config: { 
        identifier: 'uuid',
        fields: [
            {name: 'e', type: 'auto'}, // envelope
            {name: 'ts', type: 'integer'} // timestamp
        ]
    }
});
