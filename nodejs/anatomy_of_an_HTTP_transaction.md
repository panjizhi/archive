# HTTP 交互剖析

## 创建 Web server

```js
var http = require('http');

var server = http.createServer(function(request, response) {
  // magic happens here!
});
```

每当 server 收到来自客户端的 request 请求，server 创建时指定的回调函数将被调用。

`http.createServer()` 的返回值是一个 `EventEmitter` 实例对象，上述代码等价：

```js
var server = http.createServer();
server.on('request', function(request, response) {
  // the same kind of magic happens here!
});
```

## Method, URL and Headers

处理 request 的回调函数接收两个参数：request 和 response。request 对象是一个 `IncomingMessage` 实例，
包含 http 请求的所有信息。

```js
var method = request.method;
var url = request.url;

var headers = request.headers;
var userAgent = headers['user-agent'];
```

## Request Body

对于 POST、PUT 类型的请求，我们需要提取请求中的数据。

```js
var body = [];
request.on('data', function(chunk) {
  body.push(chunk);
}).on('end', function() {
  body = Buffer.concat(body).toString();
  // at this point, `body` has the entire request body stored in it as a string
});
```

上述的处理过程略显冗余，幸运的是，npm 上已经有成熟模块实现了对上述操作的封装。

+ [concat-stream](https://www.npmjs.com/package/concat-stream)
+ [body](https://www.npmjs.com/package/body)


## 错误处理

request 对象是一个实现了 `ReadableStream` 接口 的 `EventEmitter` 实例，错误发生时，
自动触发 `error` 事件。如果 `error` 事件没有绑定处理函数，Node.js 将直接抛出错误异常，
程序直接退出。

```js
request.on('error', function(err) {
  // This prints the error message and stack trace to `stderr`.
  console.error(err.stack);
});
```

## 阶段性成果展示


