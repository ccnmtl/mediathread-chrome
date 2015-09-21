var assert = require('assert');

var hostHandler = require('../src/host-handler.js');

describe('hosthandler', function() {
    it('should exist', function() {
        assert.equal(typeof hostHandler, 'object');
        assert.equal(typeof hostHandler['flickr.com'], 'object');
    });
});
