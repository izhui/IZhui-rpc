var Rpc = require("../");
var crypto = require("crypto");
var key = crypto.createHash("md5").update("c@v@cn.c0m","utf8").digest("hex").substr(8,16);
var server = Rpc("myserverid2","测试DEMO2",{
    key:key
})
.on("error",function(err){
    console.log(err.message);
    console.log(err.stack);
})
.on("connect",function(){
    // this.disConnectCluster();
})
.on("hello",function( req, callback ){
    callback( 203, new Error("来自第三方拷贝"));
})
.on("demo",function( req, callback ){
    callback( 200, null, req);
}).listen(8880)
.connectCluster( key,6660 );
