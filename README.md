## IZhui-rpc

### How to use

	npm install izhui-rpc


### 依赖:

* [thrift](https://www.npmjs.com/package/thrift)
* [debug](https://www.npmjs.com/package/debug)

#### [Example](./example)

### Master
	
	var Rpc = require("izhui-rpc");

	var master = Rpc.createMaster('name');

	master.listen( 8888 );

#### Events
* [error]
	* 发生错误...包括client断开连接，worker断开连接
* [connect]
	* 连接成功...包括连接worker

### Worker

	var Rpc = require("izhui-rpc");

	var worker = Rpc.createWorker( serverId, name, detail );

	worker.listen( 5001 ).connect( 8888 )

#### Events
* [error]
	* 发生错误...包括master断开连接
* [connect]
	* 连接成功...连接master成功

### Client

	var Rpc = require("izhui-rpc");

	var client = Rpc.createClient( serverId, name, opts );

	client.connect( 8888 );

#### Events
* [error]
	* 发生错误...包括master断开连接
* [connect]
	* 连接成功...连接master成功