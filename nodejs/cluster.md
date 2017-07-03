# Cluster

Node.js 以单线程模式在系统中运行。为充分利用多核处理器的处理能力，可同时启动多个 Node.js 实例处理负载请求。

利用 Node.js 内置的 `cluster` 模块可以轻松创建多个子进程，并行处理 request 负载，各子进程共享同一个监听端口。 

```js
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
  }).listen(8000);

  console.log(`Worker ${process.pid} started`);
}
```

执行脚本，多个 workers 共享同一个 8000 端口。

```
$ node server.js
Master 3596 is running
Worker 4324 started
Worker 4520 started
Worker 6056 started
Worker 5644 started
```

## 运行原理

`cluster` 模块使用 `child_process.fork()` 创建子 worker 进程，子 worker 进程使用 IPC 与父进程通信。

`cluster` 模块实现两种负载均衡分发算法，处理 server 中接收到的 request。

第一种称为 `round-robin approach`，主进程监听给定的端口号，接收到新 request 之后，采用简单轮转的方式，
将 request 交给对应的 worker 进程执行（这是除了 Windows 之外各平台所采用的默认算法）。这一算法实现原理简单，
而实际运行效果奇佳。

第二种 ...

子 workers 进程间相互独立，任何时候主进程都可以创建新的 worker。

## `child_process.fork()`

`child_process.fork()` 用于创建新的 Node.js 进程，父、子进程间通过 IPC 传递消息。

父、子进程之间除了用于传递消息的 IPC 通道，他们之间完全独立。每个进程都拥有自己的内存空间、V8 引擎实例，
一方面保证了各个进程的独立性，一方面导致创建新进程需要分配较多资源，因此，新进程的数量需要适中，
不建议创建太多 Node.js 进程。


