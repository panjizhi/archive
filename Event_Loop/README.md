# The Node.js Event Loop, Timers, and process.nextTick()


## 什么是 Event Loop ？

Event Loop 通过将 I/O 操作下发到系统内核执行，使单线程 JavaScript 引擎实现非阻塞 I/O 操作。

当前主流操作系统内核实现都是多线程，可同时在后台执行多个操作。当某个操作执行完，系统内核通知 NodeJS 
将对应的回调函数推送到 poll 队列，并最终得以执行。


## Event Loop 详解

NodeJS 启动后初始化 Event Loop，解析执行入口脚本文件，执行脚本中的异步 API 调用，时钟任务（timer），
调用 `process.nextTick()`等，然后开始处理 Event Loop。

下图展示了简化的 Event Loop 执行流程：

 ```
   ┌───────────────────────┐
┌─>│        timers         │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
│  │     I/O callbacks     │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
│  │     idle, prepare     │
│  └──────────┬────────────┘      ┌───────────────┐
│  ┌──────────┴────────────┐      │   incoming:   │
│  │         poll          │<─────┤  connections, │
│  └──────────┬────────────┘      │   data, etc.  │
│  ┌──────────┴────────────┐      └───────────────┘
│  │        check          │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
└──┤    close callbacks    │
   └───────────────────────┘
 ```

 _*注：图例中每一个区块对应 Event Loop 中的一个执行阶段*_

每个执行阶段都维护一个 FIFO 回调队列。尽管每个执行阶段都有各种的特点，一般来说，当进入某一执行阶段，该阶段相关的操作
将被执行，然后执行回调函数列表，直到全部回调执行完成或者达到最大回调执行上线。当执行完全部回调或者达到最大执行上线，
Event Loop 顺序走到下一个阶段执行。

在任何操作过程中都可以插入新的操作，系统内核会向 poll 阶段推送事件队列，在执行回调队列时，可以向队列中添加新的回调，这
就导致 poll 阶段的执行时常超过时钟任务的阀值，导致时钟任务 delay 执行时间多于预期。

_*注：Windows/Linux 在实现上存在细微的差异，但对本文的阐述并无太多影响。实际上 Event Loop 分为七到八个阶段，然而实际
上我们关心的，NodeJS 真正用到的也就是上图所述流程*_


### 概览

+ **timers:** 执行 setTimeout() 和 setInterval() 产生的时钟回调

+ **I/O callbacks:** 执行除了 `close callbacks`、时钟回调、和 `setImmediate()` 回调之外的一切回调

+ **idle, prepare:** 仅限于内部使用

+ **poll:** 获取新的 `I/O events`，必要时 Node 会在此处阻塞执行

+ **check:** 执行 `setImmediate()` 回调

+ **close callbacks:** 比如：`socket.on('close', ...)`

每次重新执行 Event Loop 时，NodeJS 检查是否还有等待执行的异步 I/O 操作或者时钟回调，没有则关闭 Event Loop 并退出
执行。


### 执行阶段详解

#### timers

timers 用于指定回调函数在给定阀值时间之后执行，注意是在给定阀值时间之后执行，并不是在精确的阀值时间点执行。在给定阀值
的时间过后，回调函数会尽可能快地被安排执行，然而实际的执行时间点会受到系统调度或其他操作执行影响而被延迟。

_*注：技术上来讲，poll phase 控制了 timers 实际执行的时间*_

看如下示例：

```js
var fs = require('fs');

function someAsyncOperation (callback) {
    // 假设读取文件消耗 95ms
    fs.readFile('/path/to/file', callback);
}

var timeoutScheduled = Date.now();

setTimeout(function () {
    var delay = Date.now() - timeoutScheduled;
    console.log(delay + "ms have passed since I was scheduled");
}, 100);


// someAsyncOperation 消耗 95ms 完成
someAsyncOperation(function () {
    var startCallback = Date.now();

    // 执行耗时 10ms
    while (Date.now() - startCallback < 10) {
        ; // do nothing
    }
});
```

当 Event Loop 进入 poll 阶段时，由于 `fs.readFile` 尚未完成，poll 队列为空，于是开始等待，95 ms 之后 `fs.readFile`
执行完成，对应的回调添加到 poll 队列并执行，10ms 之后完成回调函数的执行，同时 poll 队列为空，Event Loop 检查到时钟回调的
时间阀值已经到达，返回 timers 阶段执行回调。可以看到，实际上时钟回调是 105ms 后才得以执行。

_*注：为了避免 poll 阶段长期执行而陷入`饥饿`状态，libuv 硬编码 poll 阶段最大连续执行时长，具体值和系统相关*_


#### I/O callbacks

本阶段执行系统相关回调，比如：TCP 错误处理。当 TCP 尝试连接时收到 `ECONNREFUSED`，一些 *nix 系统希望报告此类错误，将在 I/O callbacks 得以执行。


#### poll

poll 阶段主要实现两个功能：

+ 执行到达时间阀值的时钟回调，然后

+ 处理 poll 队列中的回调

当 Event Loop 进入 poll 阶段，且没有时钟回调函数，将执行如下分支：

+ 如果 poll 队列非空，Event Loop 将同步执行队列中的每一个回调，直到队列为空或者达到最大连续执行时间

+ 如果 poll 队列为空，走如下流程：

    * 如果定时任务通过 `setImmediate()` 调用加载，Event Loop 将结束 poll 阶段，进入 check 阶段并执行定时回调

    * 如果定时任务不是通过 `setImmediate()` 调用加载，Event Loop 将进入等待，直到有回调函数进入 poll 队列，并立即执行回调。

一旦 poll 队列为空，Event Loop 将检查时钟函数 delay 阀值是否到达，如果到达，Event Loop 返回 timers 阶段执行对应的回调函数。


#### check

check 阶段用于在 poll 阶段执行完成后立即执行回调。一旦 poll 空闲且有脚本通过 `setImmediate()` 加载，Event Loop 立即进入 check

阶段并执行脚本。

`setImmediate()` 是一个特殊的时钟函数，用于在 poll 阶段完成后执行指定的回调函数。

一般来讲，程序开始执行后，Event Loop 最终会执行到 poll 阶段，然后等待 incoming 连接或者请求到来。但是，一旦有通过 `setImmediate()` 
加载的回调并且 poll 阶段空闲， Event Loop 将进入 check 阶段并执行回调，而非继续等待。


#### close callbacks

如果一个 socket 连接意外关闭，`close` 事件将推送到 close 阶段。正常关闭 `close` 事件则推送到 `process.nextTick()`。

#### `setImmediate()` vs `setTimeout()`

`setImmediate` 和 `setTimeout` 相似，在不同的调用场景下却又大不相同。

`setImmediate()` 用于在 poll 阶段结束后执行脚本，而 `setTimeout()` 用于在给定时间阀值后执行脚本。

两者的执行顺序与调用上下文有关，如果两者在主模板中同步调用，具体的执行时机和进程的性能有关，受同一机器中其他应用影响，执行先后顺序不确定。

如下：

```js
// timeout_vs_immediate.js
setTimeout(function timeout () {
    console.log('timeout');
},0);

setImmediate(function immediate () {
    console.log('immediate');
});
```

```
$ node timeout_vs_immediate.js
timeout
immediate

$ node timeout_vs_immediate.js
immediate
timeout
```


