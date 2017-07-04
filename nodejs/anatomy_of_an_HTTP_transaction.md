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

```js
var http = require('http');

http.createServer(function(request, response) {
  var headers = request.headers;
  var method = request.method;
  var url = request.url;
  var body = [];
  request.on('error', function(err) {
    console.error(err);
  }).on('data', function(chunk) {
    body.push(chunk);
  }).on('end', function() {
    body = Buffer.concat(body).toString();
    // At this point, we have the headers, method, url and body, and can now
    // do whatever we need to in order to respond to this request.
  });
}).listen(8080); // Activates this server, listening on port 8080.
```

运行上面的代码，使用浏览器访问 `http://localhost:8080/`，将会收到连接超时的错误。这是因为到目前为止，
尚未向客户端返回任何数据（ 请求回调函数中的 response 参数）。

## HTTP 状态码

正常返回的 response 对象，默认状态码为 200。当然，也可以指定其他值：

```js
response.statusCode = 404; // Tell the client that the resource wasn't found.
```

## 设置响应头字段

response 对象提供 `setHeader()` 方法来设置响应头。

```js
response.setHeader('Content-Type', 'application/json');
response.setHeader('X-Powered-By', 'bacon');
```

响应头中的字段名不区分大小写，重复定义的响应头以最后一次定义为准。

response 对象还提供更直观的方法 `writeHead()` 来设置响应头信息：

```js
response.writeHead(200, {
  'Content-Type': 'application/json',
  'X-Powered-By': 'bacon'
});
```

## 设置响应主体

设置完 response 的响应头之后，接下来就是设置响应主体数据。

response 对象是一个实现了 `WritableStream` 接口的 `ServerResponse` 实例。

```js
response.write('<html>');
response.write('<body>');
response.write('<h1>Hello, World!</h1>');
response.write('</body>');
response.write('</html>');
response.end();
```

等价于：

```js
response.end('<html><body><h1>Hello, World!</h1></body></html>');
```

*_注意：务必保证在设置响应主体数据之前设置响应状态码和头部字段_*


## 错误处理

和 request 对象一样，出现错误时 response 对象同样触发 `error` 事件。

## 阶段性成果展示

```js
var http = require('http');

http.createServer(function(request, response) {
  var headers = request.headers;
  var method = request.method;
  var url = request.url;
  var body = [];
  request.on('error', function(err) {
    console.error(err);
  }).on('data', function(chunk) {
    body.push(chunk);
  }).on('end', function() {
    body = Buffer.concat(body).toString();
    // BEGINNING OF NEW STUFF

    response.on('error', function(err) {
      console.error(err);
    });

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    // Note: the 2 lines above could be replaced with this next one:
    // response.writeHead(200, {'Content-Type': 'application/json'})

    var responseBody = {
      headers: headers,
      method: method,
      url: url,
      body: body
    };

    response.write(JSON.stringify(responseBody));
    response.end();
    // Note: the 2 lines above could be replaced with this next one:
    // response.end(JSON.stringify(responseBody))

    // END OF NEW STUFF
  });
}).listen(8080);
```

## Echo Server Example

我们通过简化上一个实例，实现简单的 Echo server。

首先，限定请求 method (响应 GET 方法) 和 path（url = '/echo'）。

```js
var http = require('http');

http.createServer(function(request, response) {
  if (request.method === 'GET' && request.url === '/echo') {
    var body = [];
    request.on('data', function(chunk) {
      body.push(chunk);
    }).on('end', function() {
      body = Buffer.concat(body).toString();
      response.end(body);
    })
  } else {
    response.statusCode = 404;
    response.end();
  }
}).listen(8080);
```

如前所述，request 对象实现了 `ReadableStream` 接口，response 对象实现了 `WritableStream` 接口，
利用 `pipe` 调整代码。如下：

```js
var http = require('http');

http.createServer(function(request, response) {
  if (request.method === 'GET' && request.url === '/echo') {
    request.pipe(response);
  } else {
    response.statusCode = 404;
    response.end();
  }
}).listen(8080);
```

进一步完善代码，添加错误处理。如下：

```js
var http = require('http');

http.createServer(function(request, response) {
  request.on('error', function(err) {
    console.error(err);
    response.statusCode = 400;
    response.end();
  });
  response.on('error', function(err) {
    console.error(err);
  });
  if (request.method === 'GET' && request.url === '/echo') {
    request.pipe(response);
  } else {
    response.statusCode = 404;
    response.end();
  }
}).listen(8080);
```






