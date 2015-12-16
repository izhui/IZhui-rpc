var Rpc = require("../");
var crypto = require("crypto");
var server = Rpc("myid","测试DEMO",{
    key:crypto.createHash("md5").update("c@v@cn.c0m","utf8").digest("hex").substr(8,16)
})
.on("error",console.log)
.on("demo",function( req, callback ){
    callback( 200, null, req);
}).listen(8880)