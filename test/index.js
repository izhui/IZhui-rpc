// var Event = require("events").EventEmitter;

// var e = new Event();

// e.on("event",function(data,callback){
    // callback("===>",data);
// });

// e.emit("event","data",console.log);

// console.log(e.listeners("event--").length);
// console.log(e);

var ng = require("nodegrass");

ng.post("http://guess.cavacn.com:3002/api/sotck/index/sh/600656",function( status, headers, data){
    console.log(status,headers,data);
});