/**
 * Created by richardmaglaya on 2014-10-31.
 */
'use strict';


var InitializeServer = function(hasParent) {
    if (!(this instanceof InitializeServer)) {
        return new InitializeServer(hasParent);
    }
    switch (process.env.NEW_RELIC) {
        case 'true':
            require('newrelic');
            break;
    }

    var DefaultCallback = function () {};

    //-- External modules
    var express = require('express');
    var async = require('async');
    var path = require('path');

    //-- Middleware
    var favicon = require('serve-favicon');
    var bodyParser = require('body-parser');
    var methodOverride = require('method-override');
    var cookieParser = require('cookie-parser');
    var session = require('cookie-session');
    var serveStatic = require('serve-static');
    var lodash = require('lodash');
    var jsonfile = require('jsonfile');
    var zk = {};

    var exports = module.exports = express();

    if (hasParent) {
        initializeExports();
        initializeSIGTerm();
        initializeExpress();
        initializeGlobalConfiguration();
//XXX
    //    initializeDBConnection();
        initializeRouting();
        initializeZooKeeper();
        initializeAPIServer();
        initializeServiceLocator();
    } else {
        async.series([
                    function (cb) { initializeExports(cb); },
                    function (cb) { initializeSIGTerm(cb); },
                    function (cb) { initializeExpress(cb); },
                    function (cb) { initializeGlobalConfiguration(cb); },
			//XXX 
			//function (cb) { initializeDBConnection(cb); },
                    function (cb) { initializeRouting(cb); },
                    function (cb) { initializeZooKeeper(cb); },
                    function (cb) { initializeAPIServer(cb); },
                    function (cb) { initializeServiceLocator(cb);}
                ],
                function(error) {
                    var _this = exports;
                    if (error) {
                        _this.logger.error(error.message);
                    } else {
                        _this.logger.info('Initialization Complete');
                    }
                }
        );
    }


    function initializeExports(cb) {
        var _this = exports;
        cb = cb || DefaultCallback;
        _this.backendHelpers = require('./utils/lib/backend-helpers')();
        _this.loggers = _this.backendHelpers.loggers();
        _this.log4jsHelper = _this.loggers.log4jsHelper(path.join(__dirname, './config/log4js-configuration.json'))
        _this.config = require('./config/server').config;
        loadEnvironmentConfig();
        _this.resolvedConfig = _this.backendHelpers.configHelper().resolveRawConfig(_this.config);
        _this.logger = _this.log4jsHelper.initialize('order', _this.config.express.shared.server_name);
        _this.backendHelpers.logger = _this.logger;
        _this.unhandledExceptionLogger = _this.log4jsHelper.initialize('unhandled-exceptions');

        _this.utilsPath= path.join(__dirname, './utils/lib/backend-helpers');
        _this.dbApiPath= path.join(__dirname, './dbapi/lib/restaurant-data-api');

        _this.logger.info('Initialize Exports');
        cb();
    }

    function loadEnvironmentConfig() {
        var _this = exports;
        _this.country = process.argv[2]? process.argv[2]: 'NA';  // NA or CN
        _this.env = process.argv[3] ? process.argv[3] : 'development';  // development, qa or production
        _this.customConfig = require('./config/custom-server').config[_this.country][_this.env];
        _this.config = lodash.defaultsDeep(_this.customConfig, _this.config);
        _this.config['deployEnvironment'] = {country: _this.country, env: _this.env};
        jsonfile.writeFileSync(path.join(__dirname, './config/temp.json'), _this.config, {spaces: 4});
    }


    function initializeSIGTerm(cb) {
        var _this = exports;
        cb = cb || DefaultCallback;
        _this.logger.info('Initialize SIGTerm');
        process.on('SIGTERM', function() {
            _this.logger.info('API is shutting down');
        });
        process.on('uncaughtException', function (err) {
            _this.logger.error((new Date()).toUTCString() + ' uncaughtException:', err.message);
            _this.logger.error(err.stack);
        });
        cb();
    };


    function initializeExpress(cb) {
        var _this = exports;
        cb = cb || DefaultCallback;
        _this.logger.info('Initializing Express Server');

        //-- Environments
        _this.set('port', process.env.PORT || _this.config.express.shared.server_port);
        _this.set('environment', process.env.NODE_ENV || 'development');
        _this.set('views', __dirname + '/public/views');
        _this.set('usertoken', 'something-something');
        _this.engine('html', require('ejs').renderFile);
        _this.set('view engine', 'html');
        _this.use(favicon(__dirname + '/favicon.ico'));
        _this.use(bodyParser.urlencoded({limit: _this.config.express.shared.maxRequestSize, extended: true}));
        _this.use(bodyParser.json({limit: _this.config.express.shared.maxRequestSize}));
        _this.use(methodOverride());
        _this.use(cookieParser('something-something'));
        _this.use(session({secret: 'something-something'}));
        _this.use('/api', serveStatic(path.join(__dirname, 'public')));
        _this.use('api/docs', serveStatic(path.join(__dirname, 'docs')));
        _this.use(express.static(path.join(__dirname, 'public')));  // set the static content directory
        cb();
    };


    function initializeGlobalConfiguration(cb) {
        var _this = exports;
        cb = cb || DefaultCallback;
        _this.logger.info('Initializing Global Configuration');

        if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = _this.get('environment')
        }

        _this.logger.info('_this.get(environment)=' + _this.get('environment'));
        _this.logger.info('process.env.NODE_ENV=' + process.env.NODE_ENV);

        cb();
    };


    function initializeDBConnection(cb) {
        var _this = exports;
        cb = cb || DefaultCallback;
        _this.logger.info('Initializing DB Connection');

        /**
         * For a connection to be successful, the following should exist:
         *    1) mongoConfig.hosts = [{'server':'127.0.0.1','port':27017},{'server':'127.0.0.1','port':27018},{'server':'127.0.0.1','port':27019}]
         *    2) mongoConfig.database = 'fandine_development'
         */
        var mongoConfig = _this.resolvedConfig.mongo;
        var mongoClientHelper = _this.backendHelpers.mongoClientHelper(mongoConfig);
        mongoClientHelper.ensureConnection(function(error) {
            _this.logger.info('Inside EnsureConnection');
            if (error) {
                cb(error);
            } else {
                _this.logger.info('Connection Successful');
                cb(null);
            }
        });
    };


    function initializeRouting(cb) {
        var _this = exports;
        cb = cb || DefaultCallback;
        _this.logger.info('Initializing Routes');
        _this.apiRoutes = require('./config/routes')(_this);
        _this.apiRoutes.initializeRoutes();
        _this.options('/*', function(req, res) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Origin,Access-Control-Allow-Origin,Content-Type,Authorization,X-Requested-With');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, PATCH, OPTIONS');
            res.send(200);
        });
        cb();
    };


    function initializeAPIServer(cb) {
        var _this = exports;
        cb = cb || DefaultCallback;
        _this.logger.info('Initializing API Server');
        _this.listen(_this.get('port'), function() {
            _this.logger.info('API Server Listening @ Port: ' + _this.get('port') + ' [' + _this.get('environment') + ']')
        });
        cb();
    };

    function initializeZooKeeper(cb) {
        var _this = exports;
        cb = cb || DefaultCallback;
        _this.logger.info('Initializing ZooKeeper Client');
        zk = require('./app/helpers/zk-helper')(_this.logger);
        zk.initializeZooKeeper(function(error, result){
            if (error) {
                _this.logger.error(error);
                cb(error);
            } else {
                _this.logger.info(result);
                cb();
            }
        });
    }

    function initializeServiceLocator(cb){
        var _this=exports;
        var servloc=require('./utils/lib/backend-helpers')(_this.config, {}, _this.logger).serviceLocator;
        servloc.configure(zk.getClient(),_this.logger);
        cb = cb || DefaultCallback;
        cb();
    }
    exports.logger.info('App is ready');
};


//-- Mockable
if (module.parent) {
    new InitializeServer(true);
} else {
    //-- Node run
    new InitializeServer();
}
