'use strict';

let Rpc = require("../");

let client = Rpc.createClient( 'Cavacn.com@Client', 'Client客户端');

client.on('error',function(err){
    console.log('error',err);
}).on('connect',function(){
    client.invoke('/demo/aaa',{ uname: 'cavacn', upass: 'cavacnpwd', age: 'hello'}  , console.log);
    client.workerList(console.log);
})
.connect( 8888 );