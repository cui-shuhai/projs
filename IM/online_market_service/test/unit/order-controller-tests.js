/**
 * Created by richardmaglaya on 2014-10-21.
 */
'use strict';

process.env.NODE_ENV = 'test';

var thisFilePath = module.filename.split('/');
var thisFilename = thisFilePath[thisFilePath.length-1];
var should = require('should');
var configServer = require('./../../config/server').config;

var obj;

//-- console.log('\tTEST-INFO: this = %j', thisFilename);
describe('Order Sub-Module [Unit]', function() {

    describe('when instantiating the `order` module', function () {

        it('should be successful', function (done) {
            should.exist(order);
            done();
        });

        it('should have orderManager as an object', function (done) {
            obj = order.orderManager;
            should(typeof obj).eql('object');
            done();
        });

        it('should have restaurantDataAPI as an object', function (done) {
            obj = order.restaurantDataAPI;
            should(typeof obj).eql('object');
            done();
        });

        it('should have orderCalculate as an object', function (done) {
            obj = order.orderCalculate;
            should(typeof obj).eql('object');
            done();
        });

        //-- function

        it('should have getBillByOrderId as an function', function (done) {
            obj = order.getBillByOrderId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have createOrder as an function', function (done) {
            obj = order.createOrder;
            should(typeof obj).eql('function');
            done();
        });

        it('should have getOrdersByUserId as an function', function (done) {
            obj = order.getOrdersByUserId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have getOrderByOrderId as an function', function (done) {
            obj = order.getOrderByOrderId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have deleteOrderByOrderId as an function', function (done) {
            obj = order.deleteOrderByOrderId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have getParameterByOrderId as an function', function (done) {
            obj = order.getParameterByOrderId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have updateParameterByOrderId as an function', function (done) {
            obj = order.updateParameterByOrderId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have updateOrderItemByOrderId as an function', function (done) {
            obj = order.updateOrderItemByOrderId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have updateOrderItemParameterByOrderItemId as an function', function (done) {
            obj = order.updateOrderItemParameterByOrderItemId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have deleteUsersByOrderId as an function', function (done) {
            obj = order.deleteUsersByOrderId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have deleteOrderItemByOrderItemId as an function', function (done) {
            obj = order.deleteOrderItemByOrderItemId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have getOrders as a function', function (done) {
            obj = order.getOrders;
            should(typeof obj).eql('function');
            done();
        });

        it('should have deleteOrdersByRestaurantId as an function', function (done) {
            obj = order.deleteOrdersByRestaurantId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have getHaveEatenRestaurantsByUserId as a function', function (done) {
            obj = order.getHaveEatenRestaurantsByUserId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have getLastOrderTimeByUserId as a function', function (done) {
            obj = order.getLastOrderTimeByUserId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have updateStaffToTable as a function', function (done) {
            obj = order.updateStaffToTable;
            should(typeof obj).eql('function');
            done();
        });

        it('should have deleteStaffFromTable as a function', function (done) {
            obj = order.deleteStaffFromTable;
            should(typeof obj).eql('function');
            done();
        });

        it('should have getStaffByTableId as a function', function (done) {
            obj = order.getStaffByTableId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have getTableByStaffId as a function', function (done) {
            obj = order.getTableByStaffId;
            should(typeof obj).eql('function');
            done();
        });

        it('should have updateTableAssignment as a function', function (done) {
            obj = order.updateTableAssignment;
            should(typeof obj).eql('function');
            done();
        });

        it('should have getTableAssignments as a function', function (done) {
            obj = order.getTableAssignments;
            should(typeof obj).eql('function');
            done();
        });
    });

    describe('when creating an order', function () {

        it('should have valid userId as a parameter', function (done) {
            obj = order.createOrder;
            should(typeof obj).eql('function');
            done();
        });

    });

});
