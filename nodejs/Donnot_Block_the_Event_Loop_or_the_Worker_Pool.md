# Don't Block the Event Loop (or the Worker Pool)

本文主要针对 Linux 平台下的 Node server 进行探讨，尽管如此，本文阐述的思路可以应用到 Node 实现的其他复杂应用。

我们知道，Node.js 在 Event Loop 中响应事件回调，并将耗时的任务放到 worker 池中执行（比如：file I/O）。
基于 Node 实现的 server，甚至可以做到优于 Apache 的吞吐量。核心在于 Node 实现了线程的复用，一个线程同时响应多个 request 请求。
使用较少的线程，意味着更少的维护开销（线程管理，上下文切换），也就能将更多的系统资源用于任务处理。

由于多个请求复用一个线程，这就要求开发者合理规划单个 request 的响应操作，一旦某个 request 的响应出现阻塞，将导致后续多个请求被阻塞。

一个行之有效的原则是：

> Node is fast when the work associated with each client at any given time is "small".

## 为什么需要避免在 Event Loop 和 Worker Pool 中出现阻塞？

Node 中存在两种线程：一种是执行 Event Loop 的主线程，一种是 libuv 提供的全局线程池。

libuv 提供的全局线程池主要处理如下操作：

- 本地文件操作

- DNS 相关操作 (getaddrinfo and getnameinfo)

- 调用 `uv_queue_work()` 指定的用户自定义代码

如果线程正在执行一项耗时很长的操作，就认为线程处于阻塞状态。当线程处于阻塞状态，余下的任务就得不到处理。这就导致两个可能：

- 性能问题：如果 Node 服务频繁处于阻塞状态，将严重影响服务的吞吐量

- 安全问题：如果通过构造特定的请求数据，将 Node 服务处理线程引入阻塞状态，就能实现 DoS 攻击

## Node.js 快速回顾

Node.js 使用事件驱动架构：由 Event Loop 处理事件响应，由全局 worker 池处理耗时任务。

### 在 Event Loop 执行的操作

Node 服务启动之初首先执行初始化操作，导入所需的库模块并注册事件回调函数，随后程序进入 Event Loop，等待新连接请求到来并执行回调函数进行响应。
其中，回调函数的执行是同步串行的，回调函数中可以进一步发起异步操作（异步操作依然在 Event Loop 中执行，比如：网络 I/O）。

### Worker 池中执行的操作

Node 中的全局 Worker 池是由 libuv 实现并提供调用的。主要用来处理耗时长、CPU 计算资源消耗密集型的任务。包括如下：

- I/O-intensive

    1. [DNS](https://nodejs.org/api/dns.html): dns.lookup(), dns.lookupService()

    2. [File System](https://nodejs.org/api/fs.html#fs_threadpool_usage): 除 `fs.FSWatcher()` 之外的所有文件 API 操作，当然，也除了明确采用同步调用方式的接口（以 `Sync` 结尾）

- CPU-intensive

    1. Crypto: crypto.pbkdf2(), crypto.randomBytes(), crypto.randomFill()
    2. Zlib: 所有 zlib API 接口（除了明确采用同步调用方式，以 `Sync` 结尾的调用）

除了上述调用 APIs，开发者可以通过 [C++ 扩展](https://nodejs.org/api/addons.html)向 Worker 池中提交任务。

### Node 如何决定代码的执行顺序？

Event Loop 通过系统内置的机制(epoll, kqueue, IOCP)监听一系列的文件描述符，每个文件描述符对应一个网络 socket 连接，当连接状态发生变化，Event Loop 调用对应回调函数响应事件。

Worker 池则是维护了一个任务队列，存放待处理任务，每个 Worker 依次冲队列中取出任务执行，当单个任务处理完，立即向 Event Loop 发送 **At least one task is finished** 事件。

### 开发 Node 应用时需要考虑的问题

对于 Apache 这类一个 request 请求对应一个线程的架构设计，如果某个线程出现阻塞，操作系统中断操作并自动将执行权限转给其他线程，也就是说，由操作系统负责线程调度。
而针对基于 Node 实现的 Web 服务，一个线程处理多个 request 请求，其中任意一个响应回调函数的阻塞将导致后面所有 request 请求的响应被阻塞。**开发者需要自己处理回调函数阻塞的问题，
确保响应每个 request 请求的回调函数能够快速完成。**

## 避免阻塞 Event Loop

Node.js 中的 Event Loop 是单线程模式运行的，所有的网络 request 请求和 response 响应都是在 Event Loop 中处理。任何一处阻塞都将导致后续的 request 得不到及时处理，进而影响服务器的吞吐量。
开发者需要做的是保证任意 request 的响应回调都能快速完成（包括所有的微任务：process.nextTick, Promises, Object.observe, MutationObserver）。

一般来讲，可以通过 **运算的时间复杂度** 来衡量函数的执行时长。

- Example 1: A constant-time callback.

```js
app.get('/constant-time', (req, res) => {
  res.sendStatus(200);
});
```

- Example 2: An O(n) callback

```js
app.get('/countToN', (req, res) => {
  let n = req.query.n;

  // n iterations before giving someone else a turn
  for (let i = 0; i < n; i++) {
    console.log(`Iter {$i}`);
  }

  res.sendStatus(200);
});
```

- Example 3: An O(n^2) callback.

```js
app.get('/countToN2', (req, res) => {
  let n = req.query.n;

  // n^2 iterations before giving someone else a turn
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      console.log(`Iter ${i}.${j}`);
    }
  }

  res.sendStatus(200);
});
```

### 开发过程中需要特别注意的点

Node.js 底层使用 Google 的 V8 引擎解析执行 JavaScript 脚本，针对多数的操作，V8 已经足够快，有两个点需要特别注意：**正则表达式** 和 **JSON 操作**。

针对复杂系统，开发者需要做好 **最坏的打算**，通过限制单次 request 事件回调处理的操作复杂度，控制在最坏情况下，回调执行时耗依然在可接受的范围。

### 阻塞 Event Loop: `REDOS`

实现 Event Loop 阻塞最常用的方法是利用 *vulnerable* 的正则表达式。通过精心构造输入，触发正则表达式执行引擎花费超长时间进行处理，进一步导致 Event Loop 阻塞，
最终实现基于正则表达式的拒绝服务攻击。

- A REDOS example

```js
app.get('/redos-me', (req, res) => {
  let filePath = req.query.filePath;

  // REDOS
  if (fileName.match(/(\/.+)+$/)) {
    console.log('valid path');
  }
  else {
    console.log('invalid path');
  }

  res.sendStatus(200);
});
```

如果 `filePath` 取值为 `///.../\n`(换行符前有 100 个 `/`)，将导致 Event Loop 阻塞。

- 规避 REDOS

开发过程中可以通过如下工具对书写的正则表达式进行校验：[safe-regex](https://github.com/substack/safe-regex)，[rxxr2](http://www.cs.bham.ac.uk/~hxt/research/rxxr2/)。

如果开发过程中的匹配需求是典型、常用的场景，比如：URL，文件路径。可以考虑直接使用现成的实现：[regexp library](http://www.regexlib.com/)，[ip-regex](https://www.npmjs.com/package/ip-regex)。

### 阻塞 Event Loop：Node 核心模块

- [Encryption](https://nodejs.org/api/crypto.html)

- [Compression](https://nodejs.org/api/zlib.html)

- [File system](https://nodejs.org/api/fs.html)

- [Child process](https://nodejs.org/api/child_process.html)

上述核心模块提供的接口属于长时耗操作，此类接口的调用极易导致 Event Loop 阻塞。这一类接口主要用于本地命令行脚本程序，而应避免用于 Web 服务上下文。

在 Node 实现的 Web 服务中，一定要避免调用下面的接口：

- Encryption:

    * crypto.randomBytes (synchronous version)

    * crypto.randomFillSync

    * crypto.pbkdf2Sync

    * You should also be careful about providing large input to the encryption and decryption routines.

- Compression:

    * zlib.inflateSync

    * zlib.deflateSync

- File system:

    * Do not use the synchronous file system APIs. For example, if the file you access is in a distributed file system like NFS, access times can vary widely.

- Child process:

    * child_process.spawnSync

    * child_process.execSync

    * child_process.execFileSync

