var Class           = require("osr-class");
var EventEmitter    = require("events").EventEmitter;
var EventClass      = Class.extends(EventEmitter);
var Thrift          = require("thrift");
var RPCService      = require("./thrift/gen-nodejs/RPCService");
var debug           = require("debug")("IZhui-RPC-SERVER");
var utils           = require("./utils");
var fetch           = require("fetch");
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
            if("error" === item)return;
            functions.push(item);
        });
        var result = { id: this.id, name: this.name, functions: functions };
        callback(null,this.toResult( 200, null, result));
    },
    toResult: function( code, err, result , debug){
        var result = { status: code, code: code, err: err, result: result };
        if(debug){
            result.stack = err.stack;
        }
        return utils.encrypt( JSON.stringify(result) , this.opts.key );
    },
    process: function( data, callback ){
        try{
            var mydata  = JSON.parse(utils.decrypt(data,this.opts.key));
            var method  = mydata["method"];
            var request = mydata["request"];
            var self    = this;
            if(!method){
                return callback(null,self.toResult(400,'method can not be null'));
            }else if(self.listeners(method).length == 0){
                return callback(null,self.toResult(404,method+' not Found'));
            }else{
                self.emit( method, request, function( code, error, result){
                    return callback( null,self.toResult( code, error, result, request.debug ));
                });
            }
        }catch(e){
            callback(null,self.toResult(500,e,null,true));
        }
    },
    notice: function( uri ){
        var self = this;
        fetch.fetchUrl( uri , function( err, meta, body ){
            if(err){
                return self.emit("error", err );
            }
            var client = JSON.parse(body.toString());
            self.emit("notice", client );
            debug("notice", client );
        });
        return;
    }
});

module.exports = Server;