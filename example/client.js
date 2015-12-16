var Rpc = require("../");
var crypto = require("crypto");
var client = Rpc.createClient({key:crypto.createHash("md5").update("c@v@cn.c0m","utf8").digest("hex").substr(8,16)});
client.on("connect",function( rpc ){
    // console.log("connect");
    this.process({ method: "demo", request: { name: "cavacn"}},function( status, err, result){
        console.log(status,err,result);
    });
    this.process({ method: "wwwww", request: { name: "cavacn"}},function( status, err, result){
        console.log(status,err,result);
    });
    
    console.log(rpc);
})
.on("error",function(){
    client.reconnect();
})
.connect( 8880, 'localhost');

setInterval(function(){
    // console.log("....");
},1000);