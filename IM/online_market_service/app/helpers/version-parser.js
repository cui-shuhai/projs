'use strict';

var path = require('path');

function getDependencyVersionInfo(parentPath, parentObject) {
    var _this = exports;
    var packagePath = path.join(parentPath, 'package.json');
    if (!_this.fs.existsSync(packagePath)) {
        return;
    }
    var packageInfo = JSON.parse(_this.fs.readFileSync(packagePath, {
        encoding: 'utf-8'
    }));
    if (!packageInfo.name) {
        return;
    }
    var dependency = {};
    dependency.version = packageInfo.version;
    parentObject[packageInfo.name] = dependency;
    for (var dependencyKey in packageInfo.dependencies) {
        if (!dependency.dependencies) {
            dependency.dependencies = {};
        }
        getDependencyVersionInfo(path.join(parentPath, 'node_modules', dependencyKey), dependency.dependencies);
    }
}

var GetVersionInfo = function () {
    var versionTree = {};
    getDependencyVersionInfo(path.dirname(process.argv[1]), versionTree);
    return versionTree;
};

module.exports = function versionParserInit() {
    var _this = exports;
    _this.fs = require('fs');
    _this.getVersionInfo = GetVersionInfo;
    return _this;
};