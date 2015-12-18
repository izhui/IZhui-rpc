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
.on("giveme5",function( req, callback){
    callback( 201, null, "对不起。这是真的");
})
.on("demo",function( req, callback ){
    // callback( 200, null, req);
    callback( 200,null,"对不起，我错了");
}).listen(8881)
.connectCluster( key,6660 );

setInterval(function(){
    server.invoke("myserverid2","demo",{ a: 'a', b: 'b', c: 'c' },function(err,result){
      // console.log(error.message,msg);
      if(err){
          console.log(err.stack);
          console.log(err.message);
          console.log(err.status);
      }else{
          console.log(result);
      }
    });
    server.invoke("myserverid2","hello",{ a: 'a', b: 'b', c: 'c' },function(err,result){
      // console.log(error.message,msg);
      if(err){
          console.log(err.stack);
          console.log(err.message);
          console.log(err.status);
      }else{
          console.log(result);
      }
    });
},1000);
