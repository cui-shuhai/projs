/**
 * Created by richardmaglaya on 2014-11-14.
 */
'use strict';

var RouteTracking = function () {
    var _this = exports;
    return function (req, res, next) {
        var trackedData = {};
        if (req) {
            trackedData.method = req.route.path;
            if (req.body) {
                trackedData.body = req.body;
            }
            if (req.params) {
                var params = {};
                for (var key in req.params) {
                    params[key] = req.params[key];
                }
                trackedData.params = params;
            }
            if (req.query) {
                trackedData.query = req.query;
            }
            if (req.url) {
                trackedData.url = req.url;
            }
        }
        else {
            trackedData.request = null;
        }
        _this.metricsLogger.info(trackedData);
        next();
    };
};

var ManualTracking = function (data) {
    var _this = exports;
    _this.metricsLogger.info(data);
};

module.exports = function init(app){
    var _this = exports;
    _this.routeTracking = RouteTracking;
    _this.manualTracking = ManualTracking;
    _this.metricsLogger = app.log4jsHelper.initialize('metrics');
    return _this;
};