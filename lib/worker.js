'use strict';
const EventEmitter = require("events").EventEmitter;
const debug = require("debug")("RPC-Worker");
const Thrift = require("thrift");
const WokerService = require("./thrift/gen-nodejs/WokerService");
const pathToRegexp = require("path-to-regexp");
const Client = require("./client");
class Worker extends EventEmitter{
    
    constructor ( id, name ,detail ){
        super();
        this.id = id;
        this.name = name;
        this.detail = detail;
        this.server = Thrift.createServer(WokerService,this);
        this.routes = { };
        this.client = null;
        let self = this;
        this.server.on('error',function(err){
            self.emit('error',err);
        });
        this.on('@@WORKERINFOS',function( data, callback ){
            callback( 200, null, { routes: self.routes, name: self.name, detail: self.detail } );
        });
    }
    
    mathMethod ( key, regexp, method , opts ){
        let maths = regexp.exec(method);
        if(!maths)return null;
        let args = maths.slice(1).map(this.decode);
        let result = {};
        regexp.keys.forEach(function(item,index){
            result[item.name] = args[index];
        });
        return { key: key, params: result , opts: opts };
    }
    
    on ( name, fn , opts ){
        var key = pathToRegexp(name);
        this.routes[name] = { key: key , opts: opts };
        this.addListener(name,fn);
        return this;
    }
    
    decode (val){
        if(val)return decodeURIComponent(val);
    }
    
    getMethod ( method ){
        let self        = this;
        let data        = null;
        Object.keys(this.routes).forEachExt(function(key,index){
            let item    = self.routes[key];
            return data = self.mathMethod( key , item.key, method, item.opts );
        });
        return data;
    }
    
    toResult( code, err ,result ){
        let msg = { status: code, err: err ? { message: err.message, stack: err.stack, errors: err.errors }: undefined, result: result };
        return JSON.stringify(msg);
    }
    
    invoke( method, request, callback ){
        if('@@WORKERINFOS' !== method){
            method = '/' + method;
        }
        let mydatas     = this.getMethod( method );
        let self = this;
        if(!mydatas){
            return callback( null, this.toResult(404,new Error(`Method [${method}] not found!`)));
        }
        let data        = JSON.parse(request);
        if(mydatas.opts){
            var isIllegal = false;
            var illegalKey = null;
            Object.keys(mydatas.opts.params).forEachExt(function(key,index){
                var item = mydatas.opts.params[key];
                data[key] = new item.type(data[key]);
                if(item.required && (data[key] == undefined || data[key] == null || 'NaN' == data[key].toString())){
                    isIllegal = true;
                    illegalKey = key;
                    return true;
                }
            });
            if(isIllegal){
                return callback( null, self.toResult(400,new Error(`${illegalKey} can not be null!`)));
            }
        }
        this.emit(mydatas.key,{ params: mydatas.params , data: data },function( status, err, result ){
            return callback( null, self.toResult( status, err, result ));
        });
    }
    
    remoteInvoke ( method, request, callback ){
        if(!this.client){
            var err = new Error(`the master should be connect, and remote invoke`);
            err.status = 410;
            callback(err);
        }else{
            let self = this;
            if('object' === typeof(request)){
                request = JSON.stringify(request);
            }
            this.client.invoke(method,request,function(err,result){
                let data = JSON.parse(result);
                let error = null;
                if( data.err ){
                    error = new Error(data.err.message);
                    error.stack = data.err.stack;
                    error.status = data.status;
                }
                callback( error, data.result );
            });
        }
        return this;
    }
    
    listen ( port ){
        this.port = port;
        this.server.listen(this.port);
        debug('listen',this.port);
        return this;
    }
    
    connect ( port, host ){
        this.client = new Client( this.id, this.name, { type: 'worker'});
        var self = this;
        this.client.on('connect',function(){
            self.client.registe( self.port, function( err, result ){
                if(result.err){
                    self.emit('error',result.err);
                }else{
                    self.emit('connect',result.result);
                }
            });
        });
        this.client.on('error',function(err){
            self.emit('error',err);
        });
        this.client.connect( port, host );
    }

}

module.exports = Worker;