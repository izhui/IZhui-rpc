var Rpc = require("../");
var crypto = require("crypto");
var key = crypto.createHash("md5").update("c@v@cn.c0m","utf8").digest("hex").substr(8,16);
var server = Rpc("myserverid","测试DEMO",{
    key:key
})
.on("error",function(err){
    console.log(err.message);
    console.log(err.stack);
})
.on("connect",function(){
    // this.disConnectCluster();
})
.on("demo",function( req, callback ){
    // callback( 200, null, req);
    callback( 200,null,"对不起，我错了");
}).listen(8881)
.connectCluster( key,6660 );

// setInterval(function(){
    // server.invoke("myserverid2","demo",{ a: 'a', b: 'b', c: 'c' },function(status,err,result){
      // // console.log(error.message,msg);
      // console.log(status,err,result);
    // });
    // server.invoke("myserverid2","hello",{ a: 'a', b: 'b', c: 'c' },function(status,err,result){
      // // console.log(error.message,msg);
      // console.log(status,err,result);
    // });
// },1000);
