var Rpc = require("../");
var crypto = require("crypto");
var client = Rpc.createClient({key:crypto.createHash("md5").update("c@v@cn.c0m","utf8").digest("hex").substr(8,16)});
client.on("connect",function( rpc ){
    // console.log("connect");
    setInterval(function(){
        client.invoke("myserverid","demo",{request: { name: "cavacn"}},function( status, err, result){
            console.log("===<",status,err,result);
        });
    },1000);
    
})
.on("error",function(err){
    console.log(err);
})
.connect( 6660, 'localhost');

