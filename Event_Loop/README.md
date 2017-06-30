# The Node.js Event Loop, Timers, and process.nextTick()


## 什么是 Event Loop ？

Event Loop 通过将 I/O 操作下发到系统内核执行，使单线程执行的 JavaScript 引擎实现非阻塞 I/O 操作。

现在操作系统内核实现都是多线程，可同时在后台执行多个操作。当某个操作执行完，操作系统内核通知 NodeJS 
将操作对应的回调函数推送到 poll 队列，并最终得以执行。