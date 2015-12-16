var Class           = require("osr-class");
var EventEmitter    = require("events").EventEmitter;
var EventClass      = Class.extends(EventEmitter);
var Server          = require("./server");
var Client          = require("./client");
var Rpc = EventClass.extends({
    $ : function( id, name, opts ){
        this.id = id;
        this.name = name;
        this.opts = opts;
    },
    listen: function( port ){
        return new Server( this.id, this.name, this.opts ).listen( port );
    },
    connect: function( port , host ){
        return new Client( port, host );
    }
});


var MyRpc = function( id, name, opts ){
    // return new Rpc( id, name, opts );
    return new Server( id, name, opts );
}

MyRpc.createClient = function( opts ){
    return new Client( opts );
}

module.exports = MyRpc;