'use strict';

let Rpc = require("../");

let client = Rpc.createClient( 'Cavacn.com@Client', 'Client客户端');

client.on('error',function(err){
    console.log('error',err);
}).on('connect',function(){
    // client.invoke('/demo/aaa',{ uname: 'cavacn', upass: 'cavacnpwd', age: 'hello'}  , console.log);
    client.workerList(function( err, result ){
        // console.log(result);
        var data = result.result;
        data.forEach(function(item,index){
            client.readme(item.id,function(err,readme){
                console.log(readme.result);
            });
        });
    });
})
.connect( 8888 );