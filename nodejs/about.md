# Node.js 简介

作为一个基于 **_事件驱动_**、实现 **_异步 I/O 操作_** 的 JavaScript runtime。Node.js 特别适合用来构建高并发、
易扩展的网络应用。

老规矩，从 `hello world` 开始：

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

执行代码，Node.js 监听 3000 端口，并发处理连接请求，执行请求绑定的回调函数。
处理完所有接收到的请求后，Node.js 进入监听状态，等待新请求的到来。

与基于 **_多线程_** 实现的并发模型相比，Node.js 更为高效，且易于开发维护。主要得益于 Node.js 单进程、
无阻塞（Node.js 不会直接处理 I/O 操作）的实现模式，避免了多线程模型中不得不考虑的 **死锁** 问题。

Node.js 采用的设计思想和 Ruby 的 `Event Machine`、Python 的 `Twisted` 类似，具体实现也受到两者的影响。
相较于 `Event Machine` 和 `Twisted`，Node.js 对事件驱动模型做了更深层次的挖掘，实现名为 `event loop` 的机制。
Node.js 启动之后，首选执行入口脚本中的同步操作，随后自动进入 event loop 模式，处理异步 I/O 操作和定时任务，
当所有异步 I/O 操作和定时任务都处理完，Node.js 退出执行。

HTTP 库是 Node.js 最最核心的基础库之一，实现流式处理，并优化网络延迟。

虽然 Node.js 采用单线程模型，欣慰的是，基础库中的 `child_process` 模块提供了 `child_process.fork()` 接口，
可同时创建多个 Node.js 运行实例，实现多核系统性能的充分利用。

**_一句话，Node.js 是构建高并发、高吞吐网络应用的首选。_**

