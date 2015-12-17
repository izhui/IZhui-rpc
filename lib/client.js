var Class           = require("osr-class");
var EventEmitter    = require("events").EventEmitter;
var EventClass      = Class.extends(EventEmitter);
var ClusterService  = require("./thrift/gen-nodejs/ClusterService");
var TType           = require("./thrift/gen-nodejs/rpc_types");
var Thrift          = require("thrift");
var debug           = require("debug")("IZhui-RPC-CLIENT");
var utils           = require("./utils");
var _               = require("osr-utils");
var Client = EventClass.extends({
    $ : function( opts ){
        this.opts = opts || {};
    },
    connect : function( port, host ){
        this.port           = port || 8881;
        this.host           = host || '127.0.0.1';
        this.connection     = Thrift.createConnection( host, port , { max_attempts : 1000 * 60 *60 * 8});
        this.client         = Thrift.createClient( ClusterService, this.connection );
        var self            = this;
        this.connection.on("error",function( err ){
            debug("error","connection",err.message);
            debug("error","connection",err.stack);
            self.emit("error",err);
        });
        this.connection.on('close',function(){
            self.emit("close");
        });
        this.connection.on("connect",function(){
            self.emit("connect");
        });
        return this;
    },
    
    toResult: function( code, err, result , key ){
        var result          = { status: code, code: code, err: err ? { message: err.message, stack: err.stack } : null , result: result };
        key = key || this.opts.key;
        var tmp =  utils.encrypt( JSON.stringify(result) , key );
        // console.log(tmp,key);
        return tmp;
    },
    
    invoke: function( toid, method, request , callback ){
        var data = { method: method, request: request };
        var datastr = JSON.stringify(data);
        var self = this;
        this.client.invoke( toid, utils.encrypt(datastr, this.opts.key), function( err, result ){
            var dedata = JSON.parse(utils.decrypt(result,self.opts.key));
            var _err = dedata["err"];
            var _status = dedata["status"];
            var _result = dedata["result"];
            callback(_status,_err,_result);
        });
    }
    
});

module.exports = Client;
