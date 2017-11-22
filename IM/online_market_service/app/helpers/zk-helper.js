'use strict';

var zookeeper = require('node-zookeeper-client');
var lodash = require('lodash');
var os = require('os');
var client;

function InitializeZooKeeper(callback) {
    var apiResult;
    var _this = exports;
    _this.config = require('../../config/server').config;
    _this.country = process.argv[2]? process.argv[2]: 'NA';  // NA or CN
    _this.env = process.argv[3] ? process.argv[3] : 'development';  // development, qa or production
    _this.customConfig = require('../../config/custom-server').config[_this.country][_this.env];
    _this.config = lodash.defaultsDeep(_this.customConfig, _this.config);

    _this.port = process.env.PORT || _this.config.express.shared.server_port;
    _this.otherServers = _this.config.other_servers;

    if (!_this.otherServers.zookeeper.enabled) {
        _this.logger.info('zookeeper registration not enabled');
        callback(null, {});
        return;
    }

    var address = GetLocalAddress();                                            //get intranet ip address of this service
    var obj = {host:address, port:_this.port};                                  //register ip address and port into zookeeper.
    var connectString = _this.otherServers.zookeeper.server_url;           //zookeeper server
    var sessionTimeOut = _this.otherServers.zookeeper.session_timeout||30000;   //Session timeout in milliseconds, defaults to 30 seconds
    var retriesCount = _this.otherServers.zookeeper.retries||10;                //The number of retry attempts for connection loss exception.
    var nodePath = _this.otherServers.zookeeper.path;                           //node path

    //for more information please refer to the link https://www.npmjs.com/package/node-zookeeper-client
    client = zookeeper.createClient(connectString, {sessionTimeout: sessionTimeOut, retries:retriesCount});

    client.once('connected', function () {
        client.create(nodePath,
            new Buffer(JSON.stringify(obj)),
            zookeeper.CreateMode.EPHEMERAL_SEQUENTIAL,
            function (error, path) {
                if (error) {
                    _this.logger.error('Failed to create node: %s due to: %s.', path, error);
                    callback(error);
                } else {
                    _this.logger.info('Connected to the zookeeper server %s, session time out %s ms, node path %s', connectString, sessionTimeOut, path);
                    apiResult = {host:obj.host, port:obj.port, path:path};
                    callback(null, apiResult);
                }
            }
        );
    });

    client.connect();

    setTimeout(function () {
        if (client.state == zookeeper.State.DISCONNECTED) {
            callback(new Error('could NOT connect to zookeeper ' + connectString), null);
        }
    }, 10000);
}

var GetLocalAddress = function() {
    var _this = exports;

    var IPv4;
    var faces = os.networkInterfaces();
    var platform = os.platform();
    if (platform == 'win32') {
        var reg = /^192\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;//Develop environment
        for (var dev in faces) {
            faces[dev].forEach(function (details) {
                if (dev.indexOf('Virtual') == -1 && details.family === 'IPv4' && reg.test(details.address)) {
                    IPv4 = details.address;
                    return false;
                }
            });
        }
    } else if (platform == 'linux') {
        var arr = faces['eth0'];//eth0 is intranet ip address
        var reg = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;//Aliyun/AWS environment
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].family == 'IPv4' && reg.test(arr[i].address)) {
                IPv4 = arr[i].address;
                break;
            }
        }
    }
    _this.logger.info('os platform = ' + platform + ', IPv4 = ' + IPv4);
    return IPv4;
}

var GetZookeeperClient = function() {
    return client;
}

module.exports = function (logger) {
    var _this = exports;
    _this.logger = logger;

    _this.getClient = GetZookeeperClient;
    _this.getLocalAddress = GetLocalAddress;
    _this.initializeZooKeeper = InitializeZooKeeper;
    return _this;
};