'use strict';
const Client = require("./client");
const Master = require("./master");
const Worker = require("./worker");
const Utils  = require("./utils");

var RPC = function(){
    
}

RPC.createMaster = function( name ){
    return new Master( name );
}

RPC.createClient = function( clientId, name, opts ){
    return new Client( clientId, name, opts );
}

RPC.createWorker = function( serverId, name , detail ){
    return new Worker( serverId, name , detail );
}

module.exports = RPC;