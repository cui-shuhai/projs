process.env.NODE_ENV = 'development';

var should = require('should');
var zk = require('../../app/helpers/zk-helper')();
var config = require('../../config/server').config;

describe('zk-helper [Unit]',function(){
    describe('when instantiating the zk-helper', function() {
        it('should be successful', function (done) {
            should.exist(zk);
            done();
        });

        it('should have getClient as an function', function (done) {
            should(typeof zk.getClient).eql('function');
            done();
        });

        it('should have getLocalAddress as an function', function (done) {
            should(typeof zk.getLocalAddress).eql('function');
            done();
        });

        it('should have initializeZooKeeper as an function', function (done) {
            should(typeof zk.initializeZooKeeper).eql('function');
            done();
        });
    });

    describe('when initialize zoo keeper client', function(){

        it('should not exist client', function(done){
            var client = zk.getClient();
            should.not.exist(client);
            done();
        });

        it('should get ip address', function(done){
            var ip = zk.getLocalAddress();
            should.exist(ip);
            done();
        });

        it('should register ip and port to zookeeper server successfully', function(done){
            if(!config.other_servers.zookeeper.enabled) {
                console.log('zookeeper switch disabled, please turn on');
                done();
            } else {
                zk.initializeZooKeeper(function (error, result) {
                    should.not.exist(error);
                    should.exist(result);

                    var client = zk.getClient();
                    should.exist(client);

                    client.exists(result.path, function (error, stat) {
                        should.not.exist(error);
                        should.exist(stat);

                        //get register data
                        client.getData(result.path, function (error, data, stat) {
                            should.not.exist(error);
                            should.exist(stat);
                            should.exist(data);
                            var obj = JSON.parse(data.toString('utf8'));
                            console.log(obj);
                            var ip = zk.getLocalAddress();
                            var port = config.express.shared.server_port;
                            should(obj.host).eql(ip);
                            should(obj.port).eql(port);
                            done();
                        });
                    });
                });
            }
        });
    });
});