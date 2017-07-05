# Node.js 中的 Event Loop、Timers 以及 process.nextTick()


## 什么是 Event Loop ？

Event Loop 是 Node.js 能够处理高并发、高吞吐的核心机制，Node.js 将 I/O 操作下放到系统内核执行，
通过 Event loop 执行各个 I/O 操作对应的回调函数。实现单线程下的异步非阻塞 I/O 操作。

当前，主流操作系统内核都采用多线程方式，支持同时在后台处理多项任务。当系统完成某个 I/O 操作，立刻通知 Node.js 
进程，将 i/O 操作对应的回调函数推送到 poll 队列，进而由 Event Loop 调用执行。


## Event Loop 详解

Node.js 启动之后立即初始化 Event Loop，随后执行入口脚本中的同步操作，执行完同步操作，自动进入 Event Loop 
处理入口脚本中定义的各项异步操作（异步 API 调用，定时任务，`process.nextTick()` 调用）。

下图是精简版的的 Event Loop 执行流程：

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

每个 `phase` 都维护一个 FIFO 回调队列。当 Event Loop 进入某个 `phase` ，立即执行当前 `phase` 相关操作，随后处理回调队列，
逐个执行回调函数，直到全部回调函数执行完、或者达到回调函数最大执行数的上线。当队列中的回调函数全部执行完、或者达到最大执行数上线时，
Event Loop 进到下一个 `phase` 。

需要注意的是，Event Loop 执行的过程中，随时可以添加新的执行任务，另外，系统内核随时（即便是 Event Loop 正在执行 poll 队列）
会将已处理完的 I/O 操作所对应的回调函数推送到 `poll` 回调队列。这就使得 `poll phase` 的执行时间被拉长，以至于定时任务在过了
指定的延迟时间后，依然未能被处理，最终导致定时任务实际 delay 时间超过预期。

_*注：尽管 Windows/Linux 实现上存在差异，但并不影响本文对 Event Loop 基本原理的阐述。实际上 Event Loop 可分为七、
八个步骤，我们需要关注的、Node.js 真正用到的也就是上图所述流程*_


### `phase` 概览

+ **timers:** 执行 setTimeout() 和 setInterval() 指定的定时回调

+ **I/O callbacks:** 执行除了 `close callbacks`、定时回调、以及 `setImmediate()` 回调之外的一切回调

+ **idle, prepare:** 仅限于内部使用

+ **poll:** 获取新的 `I/O events`，必要时 Node.js 在此处阻塞执行

+ **check:** 执行 `setImmediate()` 回调

+ **close callbacks:** 比如：`socket.on('close', ...)`

重新轮转 Event Loop 时，Node.js 检查是否存在尚未执行的异步 I/O 操作或者定时回调，如果都没有，则关闭 Event Loop 
并结束当前任务。

调用 `setTimeout()` 和 `setInterval()` 返回的 `Timeout` 对象存在 [ref/unref](https://nodejs.org/docs/latest/api/timers.html#timers_class_timeout)
方法，可以影响 Node.js 对定时回调的判断。


###  `phase` 详解

#### timers

timers 用于在指定的时间延迟后执行回调函数。注意是在 **给定的时间延迟之后** 执行，而不是在 **延迟后精确的时间点** 执行。
在给定的时间延迟过后，回调函数会尽可能快地被安排执行，实际的执行时间受到系统调度或其他操作的影响而可能被延迟。

_**注：技术上讲，poll phase 影响 timers 的实际执行的时间**_

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

Event Loop 进入 poll phase 时，`fs.readFile` 操作尚未完成，poll 队列为空，于是开始等待，95 ms 之后 `fs.readFile`
执行完成，对应的回调函数被添加到 poll 队列并立即执行，10ms 之后 readFile 回调函数执行完，此时 poll 队列再次为空，Event Loop
检查到定时回调的延迟时间已经达到给定阈值，Event Loop 返回 timers phase 执行定时回调。可以看到，定时回调实际上延迟了 105ms 
后才得以执行。

_*注：为避免 poll phase 长期占用执行进程而陷入`饥饿`状态，libuv 通过硬编码指定 poll phase 的最大连续执行时长（具体值
和系统相关），一旦达到最大值， poll phase 将停止处理 poll 事件*_


#### I/O callbacks

执行系统操作相关的回调，比如：TCP 错误处理。当 TCP 在尝试建立连接时收到 `ECONNREFUSED`，一些 *nix 系统期望报告此类错误，
处理错误的回调函数将在 I/O callbacks 得以执行。


#### poll

poll phase 完成两项功能：

1. 执行时间延迟到达给定阈值的定时回调，然后

2. 处理 poll 队列中的回调事件

当 Event Loop 进入 poll phase，且没有定时回调，执行如下分支：

+ 如果 poll 队列非空，Event Loop 同步、顺序执行队列中的每一个回调，直到队列为空或者达到最大连续执行时间

+ 如果 poll 队列为空，走如下流程：

    * 如果存在 `setImmediate()` 载入的回调，Event Loop 结束 poll phase，进入 check phase 并执行回调

    * 如果不存在 `setImmediate()` 载入的回调，Event Loop 开始等待，直到有新的回调事件进入 poll 队列，并立即执行回调

一旦 poll 队列为空，Event Loop 将检查定时函数是否到达 delay 阀值，如果到达，Event Loop 返回 timers phase 执行对应的回调函数。


#### check

check phase 用于在 poll phase 结束后立即执行回调。一旦 poll 空闲且存在通过 `setImmediate()` 加载的回调，Event Loop
立即进入 check phase 并执行回调。

`setImmediate()` 是一个特殊的定时函数，用于在 poll phase 结束后执行指定的回调函数。

进入 poll phase 后，如果存在 `setImmediate()` 回调，只要 poll phase 空闲，Event Loop 直接进入 check phase 并执行
`setImmediate()` 回调。否则，Event Loop 继续停留在 poll phase，等待新的事件到来（incoming 连接请求）。


#### close callbacks

当 socket 连接或操作句柄 *意外关闭* ，对应的 `close` 事件将推送到 close phase 处理。其他情况下，通常使用 `process.nextTick()`
处理 `close` 事件。

#### `setImmediate()` vs `setTimeout()`

`setImmediate` 和 `setTimeout` 都是实现定时回调。在不同的上下文执行环境中，两者的表现各不相同。

+ `setImmediate()` 用于在 poll phase 结束后执行回调
+ `setTimeout()` 用于在给定时间延迟后执行回调

两者的执行顺序与调用上下文有关，对于入口脚本中的同步调用，两者执行的先后顺序是不确定的（和进程的性能有关，受同一机器中其他应用影响）。

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

对于异步 I/O 操作回调函数中的调用，`setImmediate()` 一定先于 `setTimeout()` 执行。

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

`setImmediate()` 的优势在于无论有多少个 timers 回调，只要是处在异步 I/O 回调函数中执行，`setImmediate()` 执行一定先于 timers 回调。


#### `process.nextTick()`

#####  理解 process.nextTick()

也许你已经注意到，尽管 `process.nextTick()` 也属于异步 API，然而它并没有出现在上述的流程图中。从技术的角度来讲，
`process.nextTick()` 并不属于 Event Loop。无论当前操作处于 Event Loop 的哪一个 phase，`nextTickQueue` 
都将会在当前操作完成之后被调用执行。

回顾之前的流程图，无论当前操作处于哪一个 phase，只要执行 `process.nextTick()` 注册回调函数，回调函数都将在本次操作执行完，
Event Loop 进入下一个 phase 之前被调用。存在这样一种极端场景：**如果在 poll phase 之前递归调用 `process.nextTick()`，
程序将无法进入到 poll phase，导致 I/O 操作陷入 `饥饿` 状态而永远都得不到处理。**

##### 为什么允许 process.nextTick() 机制存在？

为什么 Node.js 中会存在 `process.nextTick()` 这样的机制？部分原因在于 Node.js 的设计哲学：任何 API 都应当允许通过异步的方式调用，
无论其是否真的需要。

请看如下代码：

```js
function apiCall (arg, callback) {
    if (typeof arg !== 'string')
        return process.nextTick(callback,
            new TypeError('argument should be string'));
}
```

上述代码主要是校验 `arg` 参数的类型，如果 `arg` 参数不是字符串类型，则将错误信息传递给 callback 处理。

假设我们的期望是不管参数是否有效，都先顺序执行 `apiCall` 函数中的同步操作，之后才调用 `callback` 处理错误信息并展示给用户。
使用 `process.nextTick()` 就能实现 callback 在当前 apiCall 同步操作执行完成之后、Event Loop 进入下一个
phase 之前被调用。

处理完当前 phase 的同步操作，Event Loop 调用栈会临时释放执行权限，执行 `process.nextTick()` 注册的回调函数。
同时还允许循环调用 `process.nextTick()` 注册执行多个回调，而且还不会触发 `RangeError: Maximum call stack size exceeded from v8.`

需要特别注意各种方式下回调函数的执行时机，看如下代码：

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

`someAsyncApiCall` 函数看起来像异步回调，而实际上 callback 是同步执行，执行 callback 时，由于 JS 变量定义前置，
`bar` 变量已经定义，但尚未赋值，因此程序输出 `undefined`。

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

上述代码中，callback 会在当前代码全部执行完，进入下一个 Event Loop phase 之前被执行。这样既保证 callback 调用
时 bar 变量被正确赋值，同时也保证了 callback 先于 Event Loop 的下一个 phase 执行。


#### `process.nextTick()` vs `setImmediate()`

两者功能相似确又容易混淆。`process.nextTick()` 在同一个 phase 执行完成后立即被执行，而 `setImmediate()` 则是在
check phase 中执行。实际上 `process.nextTick()` 先于 `setImmediate()` 执行，两者的名称交换一下更为合理。
然而仅仅是想想而已，矫正命名是不可能的。如果交换两者名称，`npm` 中大量有依赖的包将不可用，而随着时间推移，有依赖的包只会变得越来越多。

**推荐开发者在开发过程中尽可能使用 `setImmediate()`，其更易于理解，且在多个执行环境中兼容，包括浏览器**


#### 什么情况下使用 `process.nextTick()` ?

两种场景：

1. 错误处理，清理无用资源，或是实现在 `event loop` 继续执行之前重新发起请求

2. 回调函数期望在当前调用栈释放之后、进入下一个 Event Loop phase 前被执行的场景

