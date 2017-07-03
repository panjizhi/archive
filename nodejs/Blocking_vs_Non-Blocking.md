# Blocking vs Non-Blocking 概览

本文主要阐述 Node.js 中的 **_阻塞_** 调用，**_非阻塞_** 调用之间的区别。

> 本文中涉及的 "I/O" 操作指本地文件系统的读写操作和 `libuv` 支持的网络操作。


## Blocking

`Blocking` 指 I/O 操作阻塞 Node.js 进程中的代执行。遇到 I/O 操作时，Node.js 
必须等待 I/O 操作结束，才能继续执行后续代码（`blocking` 阻塞 event loop 执行）。

实际上， Node.js 中影响性能的主要因素是处理 cpu 资源密集型的复杂计算，而非 I/O 操作。
Node.js 中的 I/O 操作，实际上是以异步非阻塞的方式调用执行。最常见的 `Blocking` 
操作是 Node.js 标准库中的同步方法，另外，原生模块中也包含部分 `Blocking` 函数。

Node.js 中所有的 I/O 操作都支持异步非阻塞调用方式，接受回调函数作为参数。
大部分 I/O 操作都有对应的同伴调用接口，同步调用接口通常以 `Sync` 开头。


## 代码对照

**_阻塞操作同步执行，非阻塞操作异步执行。_**

同步文件操作：

```js
const fs = require('fs');
const data = fs.readFileSync('/file.md'); // blocks here until file is read
```

异步文件操作：

const fs = require('fs');
fs.readFile('/file.md', (err, data) => {
    if (err) throw err;
});

对上述示例做一下扩展，如下：

```js
const fs = require('fs');
const data = fs.readFileSync('/file.md'); // blocks here until file is read
console.log(data);
moreWork(); // will run after console.log
```

`console.log` 先于 `moreWork()` 执行。


```js
const fs = require('fs');
fs.readFile('/file.md', (err, data) => {
    if (err) throw err;
    console.log(data);
});
moreWork(); //will run before console.log
```

`moreWork()` 先于 `console.log` 执行，而不需要等待文件读取操作的完成。这里的异步非阻塞执行机制是 Node.js 
实现高吞吐量的关键。


## 并发和吞吐量

Node.js 中的 JavaScript 是以单线程模式解析执行。Nod.js 中的 `并发` 指 event loop 处理回调函数的能力。

考虑这样一种场景：web server 处理每一个 request 耗时 50ms，其中 45ms 用于数据库 I/O 操作。
采用非阻塞异步回调的方式，单个 request 中的数据库 I/O 操作时间可以释放出来，处理其他 request。
相较于同步阻塞模式，非阻塞异步调用并发能力明显增强。

很多语言的并发操作是通过创建多线程来实现，这与 Node.js 中的 event loop 模式截然不同。


## Blocking 和 Non-Blocking 混用

```js
const fs = require('fs');
fs.readFile('/file.md', (err, data) => {
    if (err) throw err;
    console.log(data);
});
fs.unlinkSync('/file.md');
```

上述代码中，`fs.unlinkSync()` 先于 `fs.readFile()` 中的回调函数执行，导致文件在读取之前被删除。

```js
const fs = require('fs');
fs.readFile('/file.md', (err, data) => {
    if (err) throw err;
    console.log(data);
    fs.unlink('/file.md', (err) => {
        if (err) throw err;
    });
});
```

`fs.readFile()` 回调中使用 `fs.unlink()` 实现预期效果。

