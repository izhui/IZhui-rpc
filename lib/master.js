'use strict';
const Event = require("events").EventEmitter;
const debug = require("debug")("RPC-Master");
const Thrift = require("thrift");
const MasterService = require("./thrift/gen-nodejs/MasterService");
const pathToRegexp = require("path-to-regexp");
const Client = require("./client"); 
class Master extends Event{
    constructor( name ){
        super();
        this.name = name;
        debug("new master",this.name);
        this.server = Thrift.createServer(MasterService,this);
        let self = this;
        this.workers = {};
        this.clients = {};
        this.server.on('error',function(err){
            debug('error',err.message);
            debug('error',err.stack);
            self.emit('error',err);
        });
    }
    
    listen( port ){
        this.port = port || 6666;
        this.server.listen(this.port);
        debug("listen",this.port);
        return this;
    }
    
    registe ( type, serviceId, request , callback ){
        if('client' == type ){
            return this.clients[serviceId] = JSON.parse( request );
        }
        debug('registe-server', serviceId);
        let config = JSON.parse( request );
        return this.connect( serviceId, config, callback );
    }
    
    toResult( code, err ,result ){
        let msg = { status: code, err: err ? { message: err.message, stack: err.stack, errors: err.errors }: undefined, result: result };
        return JSON.stringify(msg);
    }
    
    connect ( id, config, callback ){
        debug('connect-server',id);
        let self = this;
        try{
            let dedata  = config;
            let name    = config.name;
            let port    = config.port;
            let ips     = config.ips;
            if(!!this.workers[id]){
                return callback( null, self.toResult(202,new Error(`the service[${id}] is already exist`)));
            }
            let array = [];
            Object.keys(ips).forEach(function(key,index){
                let item = ips[key];
                item.forEach(function(sub,index){
                    array.push(sub);
                });
            });
            self.tryConnect( id, array, port, callback );
        }catch(e){
            return callback( null, self.toResult(500,e));
        }
    }
    
    tryConnect ( id ,ips , port, callback ){
        let item = ips.shift();
        let client = new Client(id,'master',{ max_attempts : 0 });
        let self = this;
        if(!item){
            return callback( null, self.toResult(504,new Error(`connect worker[${id}:${port}] fail!`)));
        }
        client.on('error',function(err){
            console.log(err);
            if(ips){
                self.tryConnect( id, ips, port, callback );
            }else{
                callback( null, self.toResult(408,new Error(`can not connect the service : [${id}]`)));
            }
        });
        client.on('close',function(){
            self.workers[id] = null;
            delete self.workers[id];
        });
        client.on('connect',function(){
            self.workers[id] = this;
            ips = null;
            callback( null, self.toResult(200,null,'registe success'));
            this.invoke("@@WORKERINFOS",{},function( err, data ){
                client.routes = data.result.routes;
                client.opts = { name: data.result.name, detail : data.result.detail };
            });
        });
        client.connect( port, item.adress );
        return this;
    }
    
    invoke ( method, request , callback ){
        let service = this.getServiceID( method );
        let serviceId = service.id;
        let _method = service['0'];
        let client = this.workers[serviceId];
        if(!client){
            return callback( null, this.toResult(404,new Error(`ServiceId : [${serviceId}] not found!`)));
        }
        client.invoke( _method, request, callback );
        return this;
    }
    
    workerList ( callback ){
        let workers = [];
        let self = this;
        Object.keys(this.workers).forEach(function(key,index){
            let item = self.workers[key];
            workers.push({ id: key , name: item.opts.name, detail: item.opts.detail });
        });
        return callback( null, this.toResult(200,null,workers));
    }
    
    readme ( serviceId, callback ){
        var worker = this.workers[serviceId];
        if(worker){
            return callback( null, this.toResult(200,null,worker.routes));
        }
        return callback( null, this.toResult(404,new Error(`ServiceId : [${serviceId}] not found!`)));
    }
    
    getServiceID ( method ){
        let regexp = pathToRegexp('/:id/*');
        let methods = regexp.exec(method);
        let args = methods.slice(1).map(this.decode);
        let result = {};
        regexp.keys.forEach(function(item,index){
            result[item.name] = args[index];
        });
        return result;
    }
    
    decode( val){
        if(val)return decodeURIComponent(val);
    }
    
    // process( method, request, callback ){
        // callback( null, this.toResult(501,new Error('Master not support process!')));
    // }
}

module.exports = Master;