# Blocking vs Non-Blocking 概览

本文主要阐述 Node.js 中的 **_阻塞_** 调用，**_非阻塞_** 调用之间的区别。

> 本文中涉及的 "I/O" 操作指本地文件系统的读写操作和执行 `libuv` 支持的网络操作。


## Blocking

`Blocking` 指 I/O 操作阻塞 Node.js 进程中的代执行。遇到 I/O 操作时，Node.js 
必须等待 I/O 操作结束，才能继续执行后续代码。`blocking` 操作会阻塞 event loop 的执行。

然而实际上，影响 Node.js 性能的主要因素是处理 cpu 资源密集型的负责计算，而非 I/O 操作。
Node.js 中的多数 I/O 操作，默认都支持非阻塞异步调用。





