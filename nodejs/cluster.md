# Cluster

Node.js 实例以单线程模式运行。为了充分利用多核处理器的处理能力，可同时启动多个 Node.js 实例处理负载。

利用 `Cluster` 模块可以轻松创建多个子进程处理 request 负载，各个子进程共享同一个监听端口。 

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

执行脚本，多个 worker 共享同一个 8000 端口。

```
$ node server.js
Master 3596 is running
Worker 4324 started
Worker 4520 started
Worker 6056 started
Worker 5644 started
```

## 运行原理

`cluster` 模块使用 `child_process.fork()` 创建 worker 进程，各个 worker 利用 IPC 与父进程通信。

`cluster` 模块实现了两种负载均衡算法，用于处理 server 中接收到的 request。

第一种称为 `round-robin approach`，主进程监听给定的端口号，接受到新 request 之后，采用简单轮转的方式，
将 request 交给对应的 worker 进程执行（这一算法是除了 Windows 之外各平台采用的默认算法）。

第二种 ...

子 worker 进程相互独立，任何时候主进程都可以创建新的 worker。






