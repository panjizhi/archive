# Node.js 简介

Node.js 是一个 **_异步_** 的、基于 **_事件驱动_** 的 JavaScript 运行环境，用于构建高扩展性的网络应用。

老规矩，先看 `hello world`，代码运行后，Node.js 可并发处理多个连接请求，执行每个请求绑定的回调函数，
当所有连接都处理完，Node.js 并不退出，而是进入监听状态，等待新请求的到来。

```js
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```

相较于多数基于多线程实现的并发模型，Node.js 更为高效，且易于开发维护。主要得益于 Node.js 单进程、
无阻塞（Node.js 不会直接处理 I/O 操作）的实现模式，不会存在多线程模型中不得不考虑的 **死锁** 问题。
非常适合高扩展的系统需求。

Node.js 设计思想和 Ruby 的 `Event Machine`、Python 的 `Twisted` 类似，实现中也受到两者的影响。
Node.js 对时间模型做了更深层次的挖掘，实现了名为 `event loop` 的运行机制。Node.js 处理完入口脚本
同步操作之后，自动进入 event loop 模式，处理异步操作，当所有异步操作全部处理完之后，Node.js 
退出执行。

HTTP 是 Node.js 中的第一类函数库，着重于数据的流式处理和降低网络延迟，使 Node.js 极其适合用于网络应用的开发平台。

尽管 Node.js 采用了单进程模型，不支持多线程，开发者可以通过 `hild_process.fork()` API 创建多个 Node.js 
实例，充分利用多核操作系统的性能。

