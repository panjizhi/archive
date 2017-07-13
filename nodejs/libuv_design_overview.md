# `libuv` Design overview

`libuv` 最早是专门为 NodeJS 开发的一个基础库，实现基于事件驱动的异步 I/O 访问模型。目前已实现跨平台支持。

`libuv` 基于系统内置支持的轮询机制（ `epoll` on Linux, `kqueue` on OSX and other BSDs, `event ports` on SunOS and `IOCP` on Windows），
抽象封装 I/O 操作，同时抽象出 `handles`，`streams` 接口，用于处理 socket 相关操作，还实现了跨平台的文件 I/O 操作，并提供线程功能函数。

下图是 libuv 的基本组织结构图：

![architecture.png](./img/architecture.png)


## handles and requests

`libuv` 提供了两种抽象结构：`handles` 和 `requests`，与 `event loop` 结合使用。

`handles` 一般是常驻对象，用于响应特定的事件，执行事件处理回调。在绑定的事件发生时，对应的 `handles` 被调用执行，处理事件。比如：TCP server 的 handle 每次收到新的连接，
调用执行对应的 connection callback。

`requests` 一般是指某一个具体的行为。

> Requests represent (typically) short-lived operations. 
> These operations can be performed over a handle: write requests are used to write data on a handle; 
> or standalone: getaddrinfo requests don’t need a handle they run directly on the loop.


## The I/O loop



`The I/O (or event) loop` 是 libuv 的核心部分，为所有的 I/O 操作提供执行上下文，每一个 event loop 都是以单线程运行。当然，也可以同时运行多个 libuv 实例，
但是必须保证每个 libuv 实例都运行在单独的线程中。一般情况下，除非有特殊说明，`The I/O (or event) loop` 模型都是非线程安全的。

`event loop` 实现的单线程异步 I/O 访问机制非常简单：所有的 I/O 操作都执行在非阻塞模式下，采用系统内置支持的轮询机制（`epoll` on Linux, `kqueue` on OSX and other BSDs, `event ports` on SunOS and `IOCP` on Windows）。在 `event loop` 轮转中的特定时期，执行流程会阻塞等待，直到 I/O 操作对应的事件出现，立即处理接收到的事件并执行对应操作。

下图是 event loop 轮询执行流程：

![loop_iteration.png](./img/loop_iteration.png)

> 1. The loop concept of ‘now’ is updated. The event loop caches the current time at the start of the event loop tick in order to reduce the number of time-related system calls.
> 2. If the loop is alive an iteration is started, otherwise the loop will exit immediately. So, when is a loop considered to be alive? If a loop has active and ref’d handles, active requests or closing handles it’s considered to be alive.
> 3. Due timers are run. All active timers scheduled for a time before the loop’s concept of now get their callbacks called.
> 4. Pending callbacks are called. All I/O callbacks are called right after polling for I/O, for the most part. There are cases, however, 
> in which calling such a callback is deferred for the next loop iteration. If the previous iteration deferred any I/O callback it will be run at this point.
> 5. Idle handle callbacks are called. Despite the unfortunate name, idle handles are run on every loop iteration, if they are active.
> 6. Prepare handle callbacks are called. Prepare handles get their callbacks called right before the loop will block for I/O.
> 7. Poll timeout is calculated. Before blocking for I/O the loop calculates for how long it should block. These are the rules when calculating the timeout:
>     * If the loop was run with the UV_RUN_NOWAIT flag, the timeout is 0.
>     * If the loop is going to be stopped (uv_stop() was called), the timeout is 0.
>     * If there are no active handles or requests, the timeout is 0.
>     * If there are any idle handles active, the timeout is 0.
>     * If there are any handles pending to be closed, the timeout is 0.
>     * If none of the above cases matches, the timeout of the closest timer is taken, or if there are no active timers, infinity.
> 8. The loop blocks for I/O. At this point the loop will block for I/O for the duration calculated in the previous step.
> All I/O related handles that were monitoring a given file descriptor for a read or write operation get their callbacks called at this point.
> 9. Check handle callbacks are called. Check handles get their callbacks called right after the loop has blocked for I/O. 
> Check handles are essentially the counterpart of prepare handles.
> 10. Close callbacks are called. If a handle was closed by calling uv_close() it will get the close callback called.
> 11. Special case in case the loop was run with UV_RUN_ONCE, as it implies forward progress. It’s possible that no I/O callbacks were fired after blocking for I/O, 
> but some time has passed so there might be timers which are due, those timers get their callbacks called.
> 12. Iteration ends. If the loop was run with UV_RUN_NOWAIT or UV_RUN_ONCE modes the iteration ends and uv_run() will return. 
> If the loop was run with UV_RUN_DEFAULT it will continue from the start if it’s still alive, otherwise it will also end.

**_`libuv` 中的文件 I/O 操作使用了线程池，而网络 I/O 操作都是单线程_**


## File I/O

Unlike network I/O, there are no platform-specific file I/O primitives libuv could rely on, so the current approach is to run blocking file I/O operations in a `thread pool`.

For a thorough explanation of the cross-platform file I/O landscape, checkout [this post](http://blog.libtorrent.org/2012/10/asynchronous-disk-io/).

**_libuv currently uses a global thread pool on which all loops can queue work on._** 3 types of operations are currently run on this pool:

* File system operations

* DNS functions (getaddrinfo and getnameinfo)

* User specified code via uv_queue_work()

