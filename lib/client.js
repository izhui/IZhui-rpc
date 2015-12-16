var Class           = require("osr-class");
var EventEmitter    = require("events").EventEmitter;
var EventClass      = Class.extends(EventEmitter);
var RPCService      = require("./thrift/gen-nodejs/RPCService");
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
        this.connection     = Thrift.createConnection( host, port );
        this.client         = Thrift.createClient( RPCService, this.connection );
        var self            = this;
        this.connection.on("error",function( err ){
            debug("error","connection",err.message);
            debug("error","connection",err.stack);
            self.emit("error",err);
        });
        this.client.getRPC(function( err, rpc){
            var rpcServer = utils.decrypt( rpc, self.opts.key );
            self.emit("connect", rpcServer );
        });
        return this;
    },
    
    reconnect: function(){
        this.connect( this.port, this.host );
    },
    
    process : function( data, callback ){
        if(_.isObject( data )){
            data = JSON.stringify( data );
        }
        var self = this;
        this.client.process.bind(this.client)( utils.encrypt( data, this.opts.key ), function( err, endata ){
            if(err){
                return callback(500,err,endata,data.debug ? err.stack : null );
            }
            try{
                var dedata = JSON.parse(utils.decrypt( endata, self.opts.key ));
                debug("from server ::",dedata);
                return callback(dedata.status||200,dedata.err,dedata.result,data.debug ? dedata.stack : null );
            }catch(e){
                debug("from server ::",endata,self.opts.key);
                return callback(500,e,endata,data.debug ? e.stack : null);
            }
        });
    }
});

module.exports = Client;