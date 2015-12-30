'use strict';
const Rpc = require("../");

let master = Rpc.createMaster( 'Cavacn.com@Master' );

master.on('error',function(err){
    console.log('err',err);
})
.listen( 8888 );