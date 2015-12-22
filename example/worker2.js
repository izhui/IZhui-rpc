'use strict';
const Rpc = require("../");

let worker = Rpc.createWorker( 'demo2', '测试案例2','用于测试的第二个案例');

worker.on('/:name',function( request, callback){
    callback( 200, null, request );
})
.on('error',function( err ){
    console.log('error',err);
})
.on('connect',function(){
    // console.log('connect');
    setInterval(function(){
        worker.remoteInvoke('/demo/0.2/hello',{ uname: Date.now(), upass: Date.now(), age: '12' },console.log);
    },1000);
})
.listen( 5002 )
.connect( 8888 ); 