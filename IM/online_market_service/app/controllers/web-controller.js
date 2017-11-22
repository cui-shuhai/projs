
/**
 * Created by Shuhia on  Tue Nov 21 02:20:31 PST 2017
 */
'use strict';


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

var LoadJs = function(req, res) {
    var _this = exports;

	_this.logger.info('INFO: Web-controller.LoadJs...');

	sendFileContent(res, req.url.toString().substring(1), "text/javascript");
};

var LoadCss = function(req, res) {
    var _this = exports;

	_this.logger.info('INFO: Web-controller.LoadCss...');
	sendFileContent(res, req.url.toString().substring(1), "text/css");
};

var LogoWeb = function(req, res) {
    var _this = exports;

	_this.logger.info('INFO: Web-controller.LogoWeb...');
	_this.webApi.logoWeb(function(err, result){
		if(err){
			_this.logger.error("%j", {function:'ERROR: Web-controller.LogoWeb...', error:err});
            _this.httpHelper.sendRawResponse(err, null, null, res);
		}
		else{
			_this.logger.info("%j", {function:'ERROR: Web-controller.LogoWeb...', result:result});
            _this.httpHelper.sendRawResponse(err, result, 200, res);
		}
	});
};

var DownloadSpa = function(req, res) {
    var _this = exports;

	_this.logger.info('INFO: Web-controller.DownloadSpa...');
	_this.webApi.downloadSpa(function(err, result){
		if(err){
			_this.logger.error("%j", {function:'ERROR: Web-controller.DownloadSpa...', error:err});
            _this.httpHelper.sendRawResponse(err, null, null, res);
		}
		else{
			_this.logger.info("%j", {function:'ERROR: Web-controller.DownloadSpa...', result:result});
			res.download(result); // magic of download fuction


		}
	});
};

module.exports = function (app) {
    var _this = exports;
    _this.app = app;
    _this.logger = app.logger;
    _this.config = app.config;
    _this.mongoConfig = app.resolvedConfig.mongo;
    _this.otherServers = _this.config.other_servers;

    _this.backendHelpers = require(_this.app.utilsPath)(_this.config, _this.mongoConfig, _this.logger);

    _this.enums = _this.backendHelpers.enums;

    //-- Default is NA
    var country = _this.enums.RegionCode.NA;
    var locale = _this.enums.LocaleCode.EN_US;
    if (process.argv[2] && process.argv[2] !== _this.enums.RegionCode.NA) {
        country = _this.enums.RegionCode.CHINA;
        locale = _this.enums.LocaleCode.ZH_CN;
    }
    _this.otherServers.country = country;
    _this.otherServers.locale = locale;

    _this.webApi = require('./../lib/web')(_this.app,_this.config, _this.mongoConfig, _this.logger);
    _this.httpHelper = _this.backendHelpers.httpHelper();
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.loggerName = 'webLogo';
    _this.logger = _this.app.log4jsHelper.initialize(_this.loggerName);

    _this.oauthUtils = _this.backendHelpers.oauthUtils;
    _this.oauthPermission = 'webLogo';

    _this.Schema = _this.backendHelpers.Schemas;
    _this.validators = _this.backendHelpers.SchemaValidator;
    _this.validateRequestBody = _this.validators.validateRequestBody;    //-- Helpers, Schemas, and Validators
    _this.responseUtilsAPI = _this.backendHelpers.responseUtilsAPI;
    _this.logger.info('webLogo-controller: initialized');

    _this.logoWeb= LogoWeb;
    _this.loadJs= LoadJs;
    _this.loadCss= LoadCss;
    _this.downloadSpa= DownloadSpa;

    return _this;

};
