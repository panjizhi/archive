# 浏览器端的并发模型与 Event Loop

浏览器端 JavaScript 的并发模型基于 `event loop` 实现，与 C、Java 中的并发模型迥然不同。


## Runtime 概念

本文阐述的是理论模型，现实中 JavaScript 引擎针对理论模型做了大幅优化调整。


### 直观展示

<div  align="center">    
    <img src="https://mdn.mozillademos.org/files/4617/default.svg" width="270" height="270" alt="event loop" align=center />
</div>


### 栈

先看函数调用过程中的 `栈` 结构变化 (**_stack frames_**)。如下：

```js
function foo(b) {
    var a = 10;
    return a + b + 11;
}

function bar(x) {
    var y = 3;
    return foo(x * y);
}

console.log(bar(7));
```

调用 bar() 时，创建对应的 stack frame 结构（包含 `bar` 函数执行时的参数值、变量信息）。当函数执行到 foo() ，创建对应的
stack frame（包含 `foo` 函数执行时的参数值、变量信息），并推送到调用栈的栈顶。当 foo() 执行完，对应的 stack frame 出栈，
继续执行 bar()，当 bar() 执行完，对应的 stack frame 出栈，此时调用栈为空，程序完成。


### 堆

`堆` 是 JavaScript 中的一块非结构化的内存区域。JavaScript 中的 Object 数据实际是存放在 `堆` 中，`栈` 中只存放其引用地址。


### 消息队列

JavaScript 运行时维护一个消息队列，存储待处理的消息列表。每个消息都关联对应的回调函数，一旦调用栈空闲，系统就逐个处理队列中的消息，
执行回调函数。


### Event loop

```js
while (queue.waitForMessage()) {
    queue.processNextMessage();
}
```

如果消息队列为空，`waitForMessage()` 进入等待，直到有新的消息到来，并开始处理。


### "Run-to-completion"

单个消息的处理过程是连续的，只有在当前消息相关操作全部执行完之后，才能处理下一个消息。这一点和 C 语言不一样，在 C 语言中，
对于 A 线程中正在执行的函数，任意时刻都可以被停下来，执行 B 线程中的代码。

实际上，这一实现模式存在问题，如果某一耗时的操作正在执行，那么，在操作完成之前，用户发起的任何交互都得不到响应（比如：点击事件，滚动行为都不会响应）。
当前，浏览器采取的解决方案是弹出 `a script is taking too long to run` 提示用户。**好的开发实践应避免耗时过长的操作。**


### 推送新消息

在浏览器中，当用户触发交互操作时，如果该操作绑定了监听函数（`event listener`），那么该交互事件对应的消息将被推送到消息队列中处理。
如果该交互操作没有绑定任何监听函数，交互消息被自动丢弃。

`setTimeout` 的作用在于：在指定的时间延迟之后，将执行回调函数的消息推送到消息队列中。如果消息队列没有其他消息，新添加的消息立即被处理，
回调函数立即执行。如果队列中尚有未执行的消息，新添加的消息必须等前面的所有消息处理完之后才会被处理。也即是说，**_setTimeout
在指定的延迟后，回调函数未必就能立即执行。_**


### `setTimeout` 零延迟

```js
(function() {

  console.log('this is the start');

  setTimeout(function cb() {
    console.log('this is a msg from call back');
  });

  console.log('this is just a message');

  setTimeout(function cb1() {
    console.log('this is a msg from call back1');
  }, 0);

  console.log('this is the end');

})();
```

```
"this is the start"
"this is just a message"
"this is the end"
"this is a msg from call back"
"this is a msg from call back1"
```

`setTimeout` 指定的回调并不会按照代码顺序执行，只有在同步操作全部执行完之后，消息队列中的消息才会被处理。


### 多个 runtimes 间的通信

`web worker` 或跨域 `iframe` 拥有独立的 `堆`、`栈`、`消息队列`。不同的 runtimes 只能通过 `postMessage` 通信。
通过 `postMessage` 向目标 runtime 中的消息队列添加新消息，从而实现交互。


## Never blocking

JavaScript 中的 event loop 最大的特点就是非阻塞的执行方式，通过事件回调实现异步 I/O 操作。

