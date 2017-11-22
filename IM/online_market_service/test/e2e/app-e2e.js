/**
 * Created by richardmaglaya on 2014-11-16.
 */
'use strict';

process.env.NODE_ENV = 'development';

var should = require('should');
//-- var fixtures = require('../fixtures/restaurant-fixtures')();
var app = require('../../app')();

describe('Restaurant (RESTful) Services API [App End-to-End]', function() {
    beforeEach(function(done) {
        //-- Delete existing test data
        //-- Inserting existing test data
        done();
    });
    describe('when instantiating the module', function() {
        it('should be successful', function (done) {
            should.exist(app);
            done();
        });
        it('should have initializeServer as a function', function (done) {
            should(typeof app.initializeAPIServer).eql('function');
            done();
        });

    });

});
