'use strict';
const Rpc = require("../");

let worker = Rpc.createWorker( '/demo/0.2', '测试案例','用于测试的第一个案例' );

worker.on('/:name',function( request, callback ){
    // console.log(request,callback);
    // console.log("======>")
    callback( 200, null, request );
},{
    name:       '获取用户信息',
    detail:     '得到用户详情,非详细',
    params: {
        uname:  { required: true , detail: '用户名', type: String },
        upass:  { required: true , detail: '密码' , type: String },
        age:    { required: true , detail: '年龄', type: Number }
    },
    response:{
        uname: { required: true , detail: '用户名' },
        upass: { required: true , detail: '密码'}
    }
})
.on('error',function( err ){
    console.log('error', err )
})
.listen( 5001 )
.connect( 8888 );