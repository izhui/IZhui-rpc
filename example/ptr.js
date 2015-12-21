var pathToRegexp = require("path-to-regexp");

var cmd = pathToRegexp("/hello/:user/:game");

var m = cmd.exec("/hello/cavacn/ttt");

function decode(val) {
  if (val) return decodeURIComponent(val);
}

var args = m.slice(1).map(decode);

// console.log(cmd);

var result = {};

cmd.keys.forEach(function(item,index){
    result[item.name] = args[index];
});

console.log(result);

