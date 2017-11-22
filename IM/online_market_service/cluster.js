/**
 * Created by Webber.Wang on 2014/8/8.
 */
var conf = require('./config/server').config.express.shared;
var cluster = require('cluster');
var os = require('os');
var zk = require('./app/helpers/zk-helper')();

// Get number of CPUs
var numCPUs = os.cpus().length;

var workers = {};
if (cluster.isMaster) {
    // ------------------- main process branch -------------------

    // when the process dead, restart the process
    cluster.on('death', function (worker) {
        delete workers[worker.pid];
        worker = cluster.fork();
        workers[worker.pid] = worker;
    });
    // when the process exit, restart the process
    cluster.on('exit', function (err) {
        delete workers[worker.pid];
        worker = cluster.fork();
        workers[worker.pid] = worker;
    })
    // Initialize same number of process as the number of CPUs
    for (var i = 0; i < numCPUs; i++) {
        var worker = cluster.fork();
        workers[worker.pid] = worker;
    }
    
    var path=require('path');
    var backendHelpers = require('utils/lib/backend-helpers')();
    var loggers = backendHelpers.loggers();
    var log4jsHelper = loggers.log4jsHelper(path.join(__dirname, './config/log4js-configuration.json'));
    var config = require('./config/server').config;
    var resolvedConfig = backendHelpers.configHelper().resolveRawConfig(config);
    var logger = log4jsHelper.initialize('order', config.express.shared.server_name);
    //only start one time
    zk.initializeZooKeeper(function(error, result){
        if (error) {
            console.log(error);
        } else {
            console.log(result);
            backendHelpers.serviceLocator.configure(zk.getClient(),logger);
        }
    });
} else {
    // ------------------- work process branch -------------------
    var server = require('./app');
}

// Shutdown all the process when the main process terminated
process.on('SIGTERM', function () {
    for (var pid in workers) {
        process.kill(pid);
    }
    process.exit(0);
});

process.on('uncaughtException', function (err) {
    console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
    console.error(err.stack)
    //process.exit(1)
})
