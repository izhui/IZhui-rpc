var Rpc = require("../");
var crypto = require("crypto");

var cluster = Rpc.createCluster({key:crypto.createHash("md5").update("c@v@cn.c0m","utf8").digest("hex").substr(8,16)})
  .on("error",function(err){
    console.log(err.message);
    console.log(err.stack);
  })
  .start( 6660 )
