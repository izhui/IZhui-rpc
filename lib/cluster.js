'ues strict';
var Class           = require("osr-class");
var EventEmitter    = require("events").EventEmitter;
var EventClass      = Class.extends(EventEmitter);
var Thrift          = require("thrift");
var ClusterService  = require("./thrift/gen-nodejs/ClusterService");
var RPCService      = require("./thrift/gen-nodejs/RPCService");
var debug           = require("debug")("IZhui-RPC-MASTER");
var utils           = require("./utils");
var fetch           = require("fetch");
var mkdirp          = require("mkdirp");
var fs              = require("fs");
var Cluster = EventClass.extends({
    $ : function( opts ){
        this.opts = opts || {};
        this.opts.basedir = this.opts.basedir || __dirname+"/../.tmp";
        mkdirp.sync(this.opts.basedir);
        if( !this.opts.key ){
            this.opts.key   = utils.randomKey();
        }
        if(this.opts.key.length != 16){
            throw new Error("key's length must be 16");
        }
        this.root = Thrift.createServer(ClusterService,this);
        var self = this;
        this.root.on("error",function(err){
            debug("error",err.message);
            debug("error",err.stack);
            self.emit("error",err);
        });
        this.clients = {};
        // this.init();
    },
    
    init : function(){
        var files = fs.readdirSync(this.opts.basedir);
        // console.log(this.opts.basedir+"/"+files);
        var self = this;
        files.forEach(function(item,index){
            var config = require(self.opts.basedir+"/"+item);
            self.connect( config.id, config ,function( err, str ){
                debug( "重新连接",str );
            });;
        });
    },
    
    start : function( port ){
        this.port = port;
        this.root.listen(this.port);
        debug("listen",this.port);
        return this;
    },
    toResult: function( code, err, result , key ){
        var result          = { status: code, code: code, err: err ? { message: err.message, stack: err.stack } : null , result: result };
        key = key || this.opts.key;
        var tmp =  utils.encrypt( JSON.stringify(result) , key );
        // console.log(tmp,key);
        return tmp;
    },
    registe : function( id, str, callback ){
        debug("registe-server",id);
        var self    = this;
        var config  = JSON.parse(utils.decrypt(str,this.opts.key));
        return self.connect( id, config, callback );
    },
    
    connect: function( id, config , callback ){
        debug("connect-server",id);
        var self        = this;
        try{
            var dedata  = config;
            var name    = dedata["name"];
            var port    = dedata["port"];
            var host    = dedata["host"];
            var ips     = dedata["ips"];
            if(!!this.clients[id]){
                callback( null, self.toResult(202,new Error("该服务已经存在")));
            }else{
                var array = [];
                for(var key in ips){
                    var item = ips[key];
                    item.forEach(function(sub,index){
                        array.push(sub);
                    });
                }
                // console.log(array);
                var fn = function(){
                    var item        = array.shift();
                    if(!item){
                        callback( null, self.toResult(500,new Error("连接不上服务器")));
                        return;
                    }
                    var connection  = Thrift.createConnection(item.address,port,{max_attempts:0});
                    connection.on("error",function(err){
                        if(array){
                            fn();
                        }
                    });
                    connection.on("close",function(){
                        var path = self.opts.basedir+"/"+id+".json";
                        fs.existsSync(path) ? fs.unlinkSync(path) : debug(path+"file not found!");
                        self.clients[id] = null;
                        delete self.clients[id];
                    });
                    connection.on("connect",function(){
                        self.clients[id] = Thrift.createClient(RPCService, this);
                        self.clients[id].tkey = config.tkey || utils.randomKey();
                        self.clients[id].connection = this;
                        array = null;
                        config.tkey = self.clients[id].tkey;
                        fs.writeFileSync(self.opts.basedir+"/"+id+".json",JSON.stringify(config));
                        callback( null, self.toResult(200, null, self.clients[id].tkey ));
                    });
                }
                fn();
            }
        }catch(e){
            callback( null, self.toResult(500,e,null,true));
        }
    },
    unregiste : function( id, str, callback ){
        var self = this;
        debug("unregiste-server",id);
        try{
            if(!!self.clients[id]){
                var key     = self.clients[id].tkey;
                var dedata  = JSON.parse(utils.decrypt(str,key));
                var name    = dedata["name"];
                callback(null,self.toResult(200,null,"注销成功", self.clients[id].tkey ));
            }else{
                callback(null,self.toResult(404,new Error(id+" not found")));
            }
        }catch(e){
            callback(null,self.toResult(500,e,null,self.clients[id].tkey));
        }
    },
    process : function( fromid, toid, str, callback ){
        var self = this;
        debug("invoke-server",fromid,"->",toid);
        var fromkey;
        var fromdata;
        try{
            var tokey;
            if(!!self.clients[fromid]){
                fromkey         = self.clients[fromid].tkey;
                fromdata        = utils.decrypt(str,fromkey);
            }else{
                return callback(null,self.toResult(404,new Error(fromid+"原始请求ID未注册")));
            }
            if(!!self.clients[toid]){
                tokey           = self.clients[toid].tkey;
            }else{
                return callback(null,self.toResult(404,new Error(toid+"目标请求ID未注册"),null,fromkey));
            }
            // console.log(utils.encrypt(fromdata,tokey));
            self.clients[toid].process(utils.encrypt(fromdata,tokey), tokey,function( err, result ){
                var todata = utils.decrypt( result, tokey);
                callback(null,utils.encrypt(todata,fromkey));
            });
            // if(!self.clients[fromid]){
                // return callback(null,self.toResult(404,new Error());
            // }
        }catch(e){
            callback(null,self.toResult(500,e,null,fromkey));
        }
    },
    invoke: function( toid , str, callback ){
        var self = this;
        debug("invoke-client","client","->",toid);
        try{
            var endata = utils.decrypt(str,this.opts.key);
            if(!!self.clients[toid]){
                var key = self.clients[toid].tkey;
                self.clients[toid].process( utils.encrypt( endata, key ) , key, function( err, result){
                    var todata = JSON.parse(utils.decrypt(result,key));
                    callback(null,self.toResult(todata.status,todata.err,todata.result));
                });
            }else{
                callback(null,self.toResult(404,new Error(toid+" not found")));
            }
        }catch(e){
            callback(null,self.toResult(500,e));
        }
        return this;
    }
});

module.exports = Cluster;
