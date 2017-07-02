# 并发模型与 Event Loop

JavaScript 基于 event loop 实现了并发模型。JavaScript 中的并发模型和 C、Java 中的并发模型大不相同。


## Runtime 概念

本文阐述的是理论性的模型，现实中 JavaScript 引擎的实现针对理论模型做了大幅优化调整。


### 直观展示

<div  align="center">    
    <img src="https://mdn.mozillademos.org/files/4617/default.svg" width="270" height="270" alt="event loop" align=center />
</div>


### 栈

先来看函数调用过程中的 `栈` 结构 (* stack frames*)。如下：

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

调用 bar() 时，创建新的 stack frame 结构，其中包含 bar() 函数的参数值、变量信息。当函数执行到 foo() ，创建新的 stack frame
（包含 foo() 函数的调用参数值、变量信息），并推送到调用栈的栈顶，执行 foo() 函数，foo() 函数执行完之后，对应的 stack frame 出栈，
继续执行 bar()，bar() 执行完成之后，bar() 函数的 stack frame 出栈，此时调用栈为空，程序完成。


### 堆

`堆` 是 JavaScript 中的一块非结构化的内存区域。JavaScript 中的 Object 数据实际是存放在 `堆` 中，`栈` 中只存放其引用地址。


### 队列

JavaScript 运行时维护一个消息队列，存储待处理的消息列表。每个消息都关联对应的函数，一旦调用栈空闲，系统就逐个处理队列中的消息，调用消息
对应的函数。


### Event loop

```js
while (queue.waitForMessage()) {
    queue.processNextMessage();
}
```

如果消息队列为空，`waitForMessage()` 进入等待，直到有新的消息到来，并开始处理。


### "Run-to-completion"

当个消息的处理过程的连续的，只有当前消息完全处理完之后，才会处理下一个消息。这点和 C 不一样，例如：A 线程中执行的函数，
任意时刻都可以停下来执行 B 线程中的代码。

当然，这一执行模式也存在问题，当某一耗时的操作正在执行，在操作得以执行完之前，用户的交互将得不到响应（比如：点击事件，滚动行为都不会响应）。
此时，浏览器就会弹出 `a script is taking too long to run` 提示用户。好的开发实践是避免耗时过长的操作。


### 推送新消息

在浏览器中，当某一交互发生，如果交互绑定监听函数（event listener），对应的消息将被添加到消息队列。如果触发的交互行为没有
绑定监听函数，那么交互信息被自动丢弃。

调用  setTimeout 是指在给定的时间延迟之后，向消息队列中添加绑定回调函数的消息，如果消息队列没有其他消息，新添加的消息立即被执行，如果队列
中尚有未执行的消息，新添加的消息必须等前面的所有消息执行之后才会调用执行。也即是说，setTimeout 指定的回调函数在延迟时间阀值到达后未必能够
立即执行。


### 零延迟执行

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

setTimeout 指定的回调并不会按照语句定义的顺序执行，只有当前同步操作全部执行完之后，消息队列中的消息才会被处理。


### 多个 runtimes 间的通信

`web worker` 或跨域 `iframe` 拥有独立的 `堆`、`栈`、`消息队列`。不同的 runtimes 只能通过 `postMessage` 进行通信。
通过 `postMessage` 向目标 runtime 中的消息队列添加新消息，从而实现交互。


### Never blocking

JavaScript 中的 event loop 最大的特点是非阻塞的执行方式，通过事件回调实现异步 I/O 操作。

