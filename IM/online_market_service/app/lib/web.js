/**
 * Created by richardmaglaya on 2014-10-21.
 */
'use strict';
const os = require('os');
var moment = require('moment');

var async = require('async');
var http = require('http');
var moment = require('moment');
// accurately calculate payment
var accounting = require('accounting');
var xml2js = require('xml2js');
var co = require('co');
var momentzone = require('moment-timezone');
var fs = require("fs");
var path = require("path");

var PRINTEDFLAG = { TRUE: true, FALSE: false };

function sendFileContent(response, fileName, contentType){
	fs.readFile(fileName, function(err, data){
		if(err){
			response.writeHead(404);
			response.write("Not Found!");
		}
		else{
			response.writeHead(200, {'Content-Type': contentType});
			response.write(data);
		}
		response.end();
	});
}


var LogoWeb = function(callback){

    var _this = exports;

	_this.logger.info('INFO: LogoWeb...');

	//XXX should be put into memory
	var file = path.join(__dirname, '/../../public/logoWeb.html');
	fs.readFile(file, (err, data) => {
	  if (err){
			_this.logger.error("%j", {function:"ERROR: LogoWeb", error:err});
			_this.logger.error("%j", {function:"ERROR: LogoWeb", dir:file});
		}	

		callback(err, data);
	});
	
}

var DownloadSpa = function(callback){

    var _this = exports;

	_this.logger.info('INFO: DownloadSpa...');

	var file = path.join(__dirname, '/../../public/logoWeb.html');
	//XXX should be put into memory
	if (fs.existsSync(file)) {
		// Do something
		callback(null, file);
	}
	else{
		callback(new Error("file not exists"), file);
	}
}

module.exports = function init(app,config, mongoConfig, logger) {
    var _this = exports;

    _this.app = app;
    _this.config = config;
    _this.otherServers = _this.config.other_servers;
    _this.logger = logger || console;
    _this.mongoConfig = mongoConfig;

    _this.restaurantDataAPI = require(_this.app.dbApiPath)(_this.config, _this.mongoConfig, _this.logger);
    _this.orderManager = require('./services/order-manager')(_this.app, _this.config, _this.mongoConfig, _this.logger);
    _this.orderCalculate = require('./services/order-calculate')(_this.app, _this.config, _this.mongoConfig, _this.logger);
    _this.backendHelpers = require(_this.app.utilsPath)(_this.config, {}, _this.logger);
    _this.enums = _this.backendHelpers.enums;
    _this.httpExceptions =_this.backendHelpers.httpExceptions;
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.payHelper = _this.backendHelpers.payHelper;
    _this.serverHelper = _this.backendHelpers.serverHelper;


    _this.logoWeb = LogoWeb;
    _this.downloadSpa= DownloadSpa;

    return _this;
};
