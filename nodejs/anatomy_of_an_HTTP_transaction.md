# HTTP 交互剖析

## 创建 Web server

```js
var http = require('http');

var server = http.createServer(function(request, response) {
  // magic happens here!
});
```

每当 server 端收到 request 请求，创建 server 时传递给 `http.createServer()` 的回调函数将被调用。

`http.createServer()` 返回值是一个 `EventEmitter` 实例对象，上述代码等价：

```js
var server = http.createServer();
server.on('request', function(request, response) {
  // the same kind of magic happens here!
});
```

## Method, URL and Headers

处理 http request 的回调函数接收两个参数，request、response。request 参数值为 `IncomingMessage` 
实例，包含 request 的相关信息。

```js
var method = request.method;
var url = request.url;

var headers = request.headers;
var userAgent = headers['user-agent'];
```

## Request Body

针对 POST、PUT 请求，我们需要获取请求中的数据。

```js
var body = [];
request.on('data', function(chunk) {
  body.push(chunk);
}).on('end', function() {
  body = Buffer.concat(body).toString();
  // at this point, `body` has the entire request body stored in it as a string
});
```

上述处理略显冗余，幸运的是，npm 上已经有成熟模块实现上述封装操作。

+ [concat-stream](https://www.npmjs.com/package/concat-stream)
+ [body](https://www.npmjs.com/package/body)


## 错误处理

request 对象既是一个 `EventEmitter` 实例，同时还实现了 `ReadableStream` 接口，发生错误时，
request 触发 `error` 事件，如果 `error` 事件没有绑定处理函数，Node.js 直接抛出错误异常，
程序直接退出。

```js
request.on('error', function(err) {
  // This prints the error message and stack trace to `stderr`.
  console.error(err.stack);
});
```

## 阶段性成果


