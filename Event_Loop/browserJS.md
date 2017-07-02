# 并发模型与 Event Loop

JavaScript 基于 event loop 实现了并发模型。JavaScript 中的并发模型和 C、Java 中的并发模型大不相同。


## Runtime 概念

本文阐述的是理论性的模型，现实中 JavaScript 引擎的实现针对理论模型做了大幅优化调整。


### 直观展示

<div  align="center">    
    <img src="https://mdn.mozillademos.org/files/4617/default.svg" width="270" height="270" alt="event loop" align=center />
</div>

## 什么是 Event Loop ？

Event Loop 通过将 I/O 操作下发到系统内核执行，使单线程的 JavaScript 引擎实现非阻塞 I/O 操作。

当前主流操作系统都采用了多线程实现方式，可在后台同时处理多个任务。当某个 I/O 操作执行完成，系统立刻通知 Node.js 
进程将 i/O 操作对应的回调函数推送到 poll 队列，由 Event Loop 调用执行。


## Event Loop 详解

Node.js 在启动后，首先会初始化 Event Loop，随后执行入口脚本文件，执行完进入 Event Loop，处理入口文件中定
义的各种异步操作（异步 API 调用，定时任务，`process.nextTick()` 调用等）。

下图展示了简化版的 Event Loop 执行流程：

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

 _*注：图例中每一个区块对应 Event Loop 中的一个 `phase`*_

每个 `phase` 都维护一个 FIFO 回调队列。尽管每个 `phase` 的执行过程都会略有差异，总的来看，当 Event Loop 进
到特定的 `phase` ，就会立即执行当前 `phase` 涉及的操作，随后执行 `phase` 回调队列，直到队列全部执行完、或是达到
回调函数最大执行数的上线。当执行完队列中的全部回调或达到回调函数最大执行数上线时，Event Loop 进到下一个 `phase` 。

需要注意的是，在执行的过程中，允许随时添加新的执行任务，同时，操作系统随时会将需要执行的 I/O 操作回调推送到 `poll phase` 
的回调队列（即便是 Event Loop 正在执行 poll 队列）。这就会不断增大 `poll phase` 的执行时间，以至于超过定时任务
的时间阀值，最终导致定时任务实际 delay 时间超过预期。

_*注：尽管 Windows/Linux 实现上存在差异，但并不影响本文对 Event Loop 基本原理的阐述。实际上 Event Loop 可分为七、
八个步骤，我们需要关注的、Node.js 真正用到的也就是上图所述流程*_


### `phase` 概览

+ **timers:** 执行 setTimeout() 和 setInterval() 指定的定时回调

+ **I/O callbacks:** 执行除了 `close callbacks`、定时回调、以及 `setImmediate()` 回调除外的一切回调

+ **idle, prepare:** 仅限于内部使用

+ **poll:** 获取新的 `I/O events`，必要时 Node.js 会在此处阻塞执行

+ **check:** 执行 `setImmediate()` 回调

+ **close callbacks:** 比如：`socket.on('close', ...)`

每次重新执行 Event Loop 时，Node.js 检查是否存在尚未执行的异步 I/O 操作或者定时回调，如果没有则关闭 Event Loop 
并结束当前任务。


###  `phase` 详解

#### timers

timers 用作定时回调，指定特定的时间延迟后执行回调。注意是在 **给定的时间延迟之后** 执行，而不是在 **精确的延迟时间点** 执行。
在给定的时间阀值过后，回调函数会尽可能快地被安排执行，然而实际的执行时间点会受到系统调度或其他操作的影响而被延迟。

_*注：技术上来讲，poll phase 控制 timers 回调的实际执行的时间*_

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

当 Event Loop 进入 poll phase 时，`fs.readFile` 尚未完成，poll 队列为空，于是等待，95 ms 之后 `fs.readFile`
执行完成，对应的回调添加到 poll 队列并执行，10ms 之后 readFile 回调函数执行完，且 poll 队列再次为空，Event Loop 
检查到定时回调的延迟时间阀值已经到达，Event Loop 返回 timers phase 执行定时回调。可以看到，定时回调实际上延迟了 105ms 
后才得以执行。

_*注：为避免 poll phase 长期占用执行进程而陷入`饥饿`状态，libuv 硬编码指定 poll phase 的最大连续执行时长（具体值
和系统相关），一旦达到最大值， poll phase 将停止处理 poll 事件*_


#### I/O callbacks

执行系统操作相关的回调，比如：TCP 错误处理。当 TCP 在尝试建立连接时收到 `ECONNREFUSED`，一些 *nix 系统期望报告此类错误，
错误处理回调将在 I/O callbacks 得以执行。


#### poll

poll phase 主要完成两项功能：

+ 执行到达时间延迟阀值的定时回调，然后

+ 处理 poll 队列中的回调事件

当 Event Loop 进入 poll phase，且没有定时回调，执行如下分支：

+ 如果 poll 队列非空，Event Loop 将同步顺序执行队列中的每一个回调，直到队列为空或者达到最大连续执行时间

+ 如果 poll 队列为空，走如下流程：

    * 如果存在 `setImmediate()` 载入的定时回调，Event Loop 结束 poll phase，进入 check phase 并执行回调

    * 如果不存在 `setImmediate()` 载入的定时回调，Event Loop 进入等待，直到有新的回调事件进入 poll 队列，并立即执行回调

一旦 poll 队列为空，Event Loop 将检查定时函数是否到达 delay 阀值，如果到达，Event Loop 返回 timers phase 执行对应的回调函数。


#### check

check phase 用于在 poll phase 执行完成后立即执行回调。一旦 poll 空闲且存在通过 `setImmediate()` 加载的回调，Event Loop 
立即进入 check phase 并执行回调。

`setImmediate()` 是一个特殊的定时函数，用于在 poll phase 结束后执行指定的回调函数。

一般来讲，程序开始运行后，Event Loop 总会进到 poll phase，并等待 incoming 连接或者请求到来。在存在 `setImmediate()` 定时回调
的情况下，一旦 poll phase 处于空闲状态， Event Loop 直接进入 check phase 并执行回调，而非继续等待。


#### close callbacks

当 socket 连接或操作句柄意外关闭，对应的 `close` 事件将推送到 close phase。其他情况通过 `process.nextTick()` 处理 `close` 事件。

#### `setImmediate()` vs `setTimeout()`

`setImmediate` 和 `setTimeout` 都是实现定时回调，然而，在不同的执行环境中，两者的表现又各不相同。

`setImmediate()` 用于在 poll phase 结束后执行回调，而 `setTimeout()` 用于在给定时间延迟后执行回调。

两者的执行顺序与调用上下文有关，主入口的同步调用中，两者的实际执行时机并不确定（和进程的性能有关，受同一机器中其他应用影响）。

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

如果两者在异步 I/O 操作的回调函数中执行，那么 `setImmediate()` 一定先于 `setTimeout()` 被执行。

```js
// timeout_vs_immediate.js
var fs = require('fs')

fs.readFile(__filename, () => {
    setTimeout(() => {
        console.log('timeout')
    }, 0)
    setImmediate(() => {
        console.log('immediate')
    })
})
```

```
$ node timeout_vs_immediate.js
immediate
timeout

$ node timeout_vs_immediate.js
immediate
timeout
```

`setImmediate()` 的优势在于无论有多少个 timers 定时回调，只要是在异步 I/O 操作回调函数的上下文中执行，`setImmediate()` 一定先于 timers 执行。


#### `process.nextTick()`

#####  理解 process.nextTick()

也许你已经注意到，尽管 `process.nextTick()` 属于异步 API，然而它并没有出现在上述的流程图中。从技术的角度来看，
`process.nextTick()` 并不属于 Event Loop。无论当前操作处于 Event Loop 的哪一个 phase，`nextTickQueue` 
都将会在当前操作完成之后被调用执行。

回顾一下之前的流程图，无论当前的操作处于哪一个 phase，只要执行 `process.nextTick()` 推送回调函数，回调函数将在
本次操作执行完，Event Loop 进入下一个 phase 之前被调用执行。**如果出现递归调用 `process.nextTick()` ，将导致
 I/O 操作陷入 `饥饿` 状态，最终程序执行无法进入到 poll phase**，这是极端糟糕的场景。

##### 为什么允许 process.nextTick() 机制存在？

为什么 Node.js 中会存在 `process.nextTick()` 这样的机制？原因在于 Node.js 的设计哲学：无论实际需要与否，任何 API 
都应当允许通过异步的方式调用。

请看如下代码：

```js
function apiCall (arg, callback) {
    if (typeof arg !== 'string')
        return process.nextTick(callback,
            new TypeError('argument should be string'));
}
```

上述代码主要是校验 `arg` 参数的类型，如果 `arg` 参数不是字符串类型，则将错误信息传递给 callback 处理。

假设我们的期望是在当前操作执行完之后，如果参数不合规范，调用 callback 函数，处理错误信息并展示给用户。
使用 `process.nextTick()` 就能实现 callback 在当前 apiCall 操作执行完成之后、Event Loop 进入下一个
phase 之前被调用。

Node.js 允许执行完当前操作之后，调用栈临时释放执行权限，执行 `process.nextTick()` 推送的回调函数。同时
还允许递归调用 `process.nextTick()` 执行多个回调，且不会触发 `RangeError: Maximum call stack size exceeded from v8.`

这种设计思想存在潜在问题，请看如下代码：

```js
// this has an asynchronous signature, but calls callback synchronously
function someAsyncApiCall (callback) { callback(); };

// the callback is called before `someAsyncApiCall` completes.
someAsyncApiCall(() => {

    // since someAsyncApiCall has completed, bar hasn't been assigned any value
    console.log('bar', bar); // undefined

});

var bar = 1;
```

`someAsyncApiCall` 函数看起来像异步回调，而实际上 callback 是同步执行，执行 callback 时，基于 JS 变量定义前置
的机制，`bar` 变量已经定义，但尚未赋值，因此程序输出 `undefined`。

利用 `process.nextTick()` 调整代码：

```js
function someAsyncApiCall (callback) {
    process.nextTick(callback);
};

someAsyncApiCall(() => {
    console.log('bar', bar); // 1
});

var bar = 1;
```

上述代码中，callback 会在当前代码全部执行完，即将进入下一个 Event Loop phase 之前被执行。这样既保证 callback 调用
时 bar 变量被正确赋值，同时也保证了 callback 先于下一个 Event Loop phase 执行。


#### `process.nextTick()` vs `setImmediate()`

两者功能相似确又容易混淆。`process.nextTick()` 在同一个 Event Loop phase 中立即执行，而 `setImmediate()` 则
是在 check phase 被执行。实际上，两者的名称交换一下更为合理。然而由于历史的原因，如果现在交换两者名称，`npm` 中大
量有依赖的包将不可用，而随着时间推移，有依赖的包变得越来越多，矫正命名更是不可能。

**我们推荐开发者在开发过程中尽可能使用 `setImmediate()`，其更易于理解，且在多个执行环境中兼容，包括浏览器**


#### 什么情况下使用 `process.nextTick()` ?

两种场景：

1. 错误处理，清理无用资源，或是实现在 `event loop` 继续执行之前重新发起请求

2. 回调函数期望在当前调用栈释放之后、进入下一个 Event Loop phase 前被执行的场景

