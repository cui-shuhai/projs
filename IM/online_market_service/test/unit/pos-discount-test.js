'use strict';

process.env.NODE_ENV = 'development';

var thisFilePath = module.filename.split('/');
var thisFilename = thisFilePath[thisFilePath.length-1];
var should = require('should');
var orderFixtures = require('./../fixtures/order-fixtures')();
var configServerFixtures = require('./../fixtures/config-server-fixtures').config;
var pos_discount = require('../../app/libv2/pos-discount')(configServerFixtures, configServerFixtures.mongo, console);
var obj;
var backendHelpers = require('backend-helpers')();
var co=require('co');
var sinon = require('sinon');
var discountValidator = new pos_discount.DiscountValidator(backendHelpers.enums,backendHelpers.httpExceptions);

describe('Pos Discount [Unit]', function() {
        it('validate discount_name', function (done) {
            discountValidator.validateDiscountName().should.throw();
            discountValidator.validateDiscountName('').should.throw();
            discountValidator.validateDiscountName(123).should.throw();
            discountValidator.validateDiscountName('12345678901').should.throw();
            done();
        });

        it('validate discount_type', function (done) {
            discountValidator.validateDiscountType.should.throw();
            discountValidator.validateDiscountType.bind(null,123).should.throw();
            discountValidator.validateDiscountType.bind(null,'123').should.throw();
            discountValidator.validateDiscountType('PERCENTAGE');
            discountValidator.validateDiscountType('AMOUNT');
            done();
        });

        it('validate discount_value', function (done) {
            discountValidator.validateDiscountValue.should.throw();
            discountValidator.validateDiscountValue.bind(discountValidator,123).should.throw();
            discountValidator.validateDiscountValue.bind(discountValidator,'123').should.throw();
            discountValidator.validateDiscountValue.bind(discountValidator,{
                discount_value:-1,
                discount_type:'PERCENTAGE'
            }).should.throw();

            discountValidator.validateDiscountValue.bind(discountValidator,{
                discount_value:101,
                discount_type:'PERCENTAGE'
            }).should.throw();

            discountValidator.validateDiscountValue.bind(discountValidator,{
                discount_value:100,
                discount_type:'PERCENTAGE'
            }).should.not.throw();

            discountValidator.validateDiscountValue.bind(discountValidator,{
                discount_value:9,
                discount_type:'AMOUNT'
            }).should.not.throw();


            done();
        });

        it('validate discount_items', function (done) {
            
            co(function *() {
                let fakeDiscountValidator=new pos_discount.DiscountValidator(backendHelpers.enums,backendHelpers.httpExceptions,{
                    find:function*(){
                        return ['menu1','menu2'];
                    }
                });
                let e1,e2,e3;
                try {
                    yield fakeDiscountValidator.validateDiscountItems(123);
                }catch(e){
                    e1=e;
                }
                should.exist(e1);
                e1=null;
                try {
                    yield fakeDiscountValidator.validateDiscountItems('123');
                }catch(e){
                    e1=e;
                }
                should.exist(e1);
                e1=null;
                try {
                    yield fakeDiscountValidator.validateDiscountItems({
                        discount_level: 'ITEM'
                    });
                }catch(e){
                    e1=e;
                }
                should.exist(e1);
                e1=null;

                try {
                    yield fakeDiscountValidator.validateDiscountItems({
                        discount_level: 'ITEM',
                        discount_items: []
                    });
                }catch(e){
                    e1=e;
                }
                should.exist(e1);
                e1=null;


                yield fakeDiscountValidator.validateDiscountItems({
                    discount_level: 'ITEM',
                    discount_items: ['123']
                });

                yield fakeDiscountValidator.validateDiscountItems({
                    discount_level: 'SEAT',
                });
            }).then(done,done);
        });

        it('validate discount time_period', function (done) {
            discountValidator.validateDiscountTimePeriod.should.throw();

            discountValidator.validateDiscountTimePeriod.bind(discountValidator,{}).should.throw();

            discountValidator.validateDiscountTimePeriod.bind(discountValidator,123).should.throw();

            discountValidator.validateDiscountTimePeriod.bind(discountValidator,'123').should.throw();

            discountValidator.validateDiscountTimePeriod.bind(discountValidator,{
                date:{},
                time:{}
            }).should.throw();

            discountValidator.validateDiscountTimePeriod.bind(discountValidator,{
                date:{
                    start_date:123,
                    end_date:123
                },
                time:{
                    start_time:123,
                    end_time:123
                }
            }).should.throw();

            discountValidator.validateDiscountTimePeriod.bind(discountValidator,{
                date:{
                    start_date:"2016-03-28T00:49:47.000Z",
                    end_date:"2016-03-28T00:49:47.000Z"
                },
                time:{
                    start_time:{
                        hour:'12',
                        minute:'00',
                    },
                    end_time: {
                        hour:'13',
                        minute:'00',
                    }
                }
            }).should.throw();


            discountValidator.validateDiscountTimePeriod.bind(discountValidator,{
                date:{
                    start_date:"2016-03-29T00:49:47.000Z",
                    end_date:"2016-03-28T00:49:47.000Z"
                },
                time:{
                    start_time:{
                        hour:'12',
                        minute:'00',
                    },
                    end_time: {
                        hour:'13',
                        minute:'00',
                    }
                }
            }).should.throw();

            discountValidator.validateDiscountTimePeriod.bind(discountValidator,{
                date:{
                    start_date:"2016-03-28T00:49:47.000Z",
                    end_date:"2016-03-29T00:49:47.000Z"
                },
                time:{
                    start_time:{
                        hour:'12',
                        minute:'00',
                    },
                    end_time: {
                        hour:'13',
                        minute:'00',
                    }
                }
            }).should.not.throw();
            done();
        });

        it('validate all together', function (done) {
            co(function *() {
                let fakeDiscountValidator = new pos_discount.DiscountValidator(backendHelpers.enums, backendHelpers.httpExceptions, {
                    find: function*() {
                        return ['menu1', 'menu2'];
                    }
                });
                let res= yield fakeDiscountValidator.validate({
                    discount_name: 'test',
                    discount_value: 9,
                    discount_type: 'AMOUNT',
                    discount_level: 'ITEM',
                    //discount_items: ['123'],
                    user_level: 1,
                    time_period: {
                        date: {
                            start_date: "2016-03-28T00:49:47.000Z",
                            end_date: "2016-03-29T00:49:47.000Z"
                        },
                        time: {
                            start_time: {
                                hour: '12',
                                minute: '00',
                            },
                            end_time: {
                                hour: '13',
                                minute: '00',
                            }
                        }
                    }
                });
                res.should.equal(true);
            }).then(function(){
                done();
            },function(err){
                should.exist(err);
                done();
            });
        });
});
