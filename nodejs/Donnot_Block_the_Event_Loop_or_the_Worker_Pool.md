# Don't Block the Event Loop (or the Worker Pool)

本文主要针对 Linux 平台下的 Node server 进行探讨，尽管如此，本文阐述的思路可以平移到基于 Node 实现的其他复杂应用。

我们知道，Node.js 在 Event Loop 中响应事件回调，并将耗时的任务放到特定的 worker 池里面执行（比如： file I/O）。
基于 Node 实现的 server，有时能实现优于 Apache 的吞吐量。原因在于 Node 实现了线程的复用，同一线程处理多个 request 请求。
使用较少的线程，意味着更少的维护开销（线程管理，上下文切换），也就能将更多的系统资源用于任务处理。

由于多个请求复用一个线程，这就要求开发者合理规划针对单个 request 的处理响应，一旦某个 request 的请求阻塞，将导致后续多个请求阻塞。
一个行之有效的原则是：

> Node is fast when the work associated with each client at any given time is "small".

## 为什么需要避免在 Event Loop 和 Worker Pool 中出现阻塞？






