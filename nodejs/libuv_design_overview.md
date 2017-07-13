# `libuv` Design overview

`libuv` 最早是专门为 NodeJS 开发的一个基础库，实现事件驱动的 I/O 访问模型。目前已实现跨平台支持。

`libuv` 基于系统内置支持的轮询机制（ `epoll` on Linux, `kqueue` on OSX and other BSDs, `event ports` on SunOS and `IOCP` on Windows），
抽象封装 I/O 操作，同时抽象出 `handles`，`streams` 接口，用于处理 socket 操作，另外还实现了跨平台的文件 I/O 操作，并提供线程管理功能函数。

下图是 libuv 的基本组织结构图：

![architecture.png](./img/architecture.png)

## handles and requests

