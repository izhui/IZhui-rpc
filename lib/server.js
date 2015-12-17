var Class           = require("osr-class");
var EventEmitter    = require("events").EventEmitter;
var EventClass      = Class.extends(EventEmitter);
var Thrift          = require("thrift");
var RPCService      = require("./thrift/gen-nodejs/RPCService");
var ClusterService  = require("./thrift/gen-nodejs/ClusterService");
var debug           = require("debug")("IZhui-RPC-SERVER");
var utils           = require("./utils");
var fetch           = require("fetch");
var os              = require("os");
var _               = require("osr-utils");
var Server = EventClass.extends({
    $ : function( id, name, opts ){
        this.id             = id;
        this.name           = name;
        this.opts           = opts || {};
        if( !this.opts.key ){
            this.opts.key   = utils.randomKey();
        }
        if(this.opts.key.length != 16){
            throw new Error("key's length must be 16");
        }
        var self    = this;
        this.root   = Thrift.createServer(RPCService,this);
        this.root.on("error",function(err){
            debug("error",err.message);
            debug("error",err.stack);
            self.emit("error",err);
        });
        this.isRunning = false;
        // this.myFnMaps = {};
    },
    listen: function( port ){
        this.port = port;
        this.root.listen(this.port);
        debug("listen",this.port);
        return this;
    },
    getRPC: function( callback ){
        var functions = [];
        Object.keys(this._events).forEach(function(item,index){
            if("error" === item || "connect" === item )return;
            functions.push(item);
        });
        var result = { id: this.id, name: this.name, functions: functions };
        callback(null,this.toResult( 200, null, result));
    },
    toResult: function( code, err, result , key){
        var result = { status: code, code: code, err: err ? { message: err.message, stack: err.stack } : null , result: result };
        return utils.encrypt( JSON.stringify(result) , key || this.opts.key );
    },
    process: function( data, key, callback ){
        var self    = this;
        try{
            var mydata  = JSON.parse(utils.decrypt(data,key||this.opts.key));
            var method  = mydata["method"];
            var request = mydata["request"];
            if(!method){
                return callback(null,self.toResult(400,new Error('method can not be null'),null,key));
            }else if(self.listeners(method).length == 0){
                return callback(null,self.toResult(404,new Error(method+' not Found'),null,key));
            }else{
                self.emit( method, request, function( code, error, result){
                    return callback( null,self.toResult( code, error, result, key));
                });
            }
        }catch(e){
            console.log(e.message);
            console.log(e.stack);
            callback(null,self.toResult(500,e,null,key));
        }
    },
    connectCluster : function( key, port, host , callback ){
        callback = callback || function(){};
        this.cluster            = { opts: { port: port || 8881 , host: host || 'localhost' , key: key}};
        this.cluster.connection = Thrift.createConnection( this.cluster.opts.host, this.cluster.opts.port ,{ max_attempts : 1000 * 60 *60 * 8});
        this.cluster.client     = Thrift.createClient( ClusterService, this.cluster.connection );
        var self                = this;
        this.cluster.connection.on("error", function( err ){
            debug("error","cluster-connection",err.message);
            debug("error","cluster-connection",err.stack);
            self.emit("cluster-error",err);
            callback( err );
        });
        var data = { id: this.id, name: this.name , port: this.port, ips: os.networkInterfaces() };
        this.cluster.client.registe( this.id, utils.encrypt(JSON.stringify(data),this.cluster.opts.key ), function( err, str ){
            try{
                var dedata = JSON.parse(utils.decrypt(str,self.cluster.opts.key));
                var result = dedata.result;
                self.cluster.tkey = result;
                debug("connect-registe","success",dedata);
                self.emit("connect",dedata);
                callback( null, self.cluster.client);
            }catch(e){
                console.log(e.message);
                console.log(e.stack);
                process.exit();
            }
        });
        this.cluster.connection.on("connect",function(){
            self.emit("connect",self);
        });
        this.cluster.connection.on("close",function(){
            // process.exit();
            debug("cluster-close",Date.now());
        });
        return this;
    },
    reconnect: function( callback ){
        if(!this.isRunning){
            this.isRunning = true;
            debug("cluster-reconnect",Date.now());
            this.connectCluster( this.cluster.opts.key, this.cluster.opts.port, this.cluster.opts.host , callback );
        }
    },
    disConnectCluster: function(){
        var self = this;
        var data = { id: this.id, name: this.name, port: this.port };
        this.cluster.client.unregiste( this.id, utils.encrypt(JSON.stringify(data),self.cluster.tkey),function( err, str){
            try{
                var dedata = JSON.parse(utils.decrypt(str,self.cluster.tkey));
                var result = dedata.result;
                debug("connect-unregiste","success",dedata);
                self.cluster.connection.end();
            }catch(e){
                console.log(e.message);
                console.log(e.stack);
            }
        });
        return this;
    },
    invoke: function( to , method, data, callback ){
        var self = this;
        if(this.cluster && this.cluster.client && this.cluster.tkey){
            data = JSON.stringify({ method: method, request: data });
            this.cluster.client.process( this.id, to, utils.encrypt(data,self.cluster.tkey), function( err, str ){
                var dedata  = JSON.parse( utils.decrypt( str, self.cluster.tkey ));
                var err     = dedata["err"];
                var result  = dedata["result"];
                var status  = dedata["status"];
                callback( status, err, result );
            });
        }else{
            callback(500,new Error("Cluster已经断开"));
        }
        return this;
    }
});

module.exports = Server;
