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



