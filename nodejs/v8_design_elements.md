# V8 Design Elements

上世纪 90 年代中期，JavaScript 首次应用在网景公司的 Netscape Navigator 浏览器，JavaScript 的出现使得 web
开发者可以十分方便地操作 HTML 元素（比如：表单、frames、图片）。JavaScript 也越来越多地被用来实现动态网页效果。
到 90 年代后期，大部分 JavaScript 脚本的主要功能是用来响应用户鼠标操作，实现图片的简单切换。

随着 AJAX 的兴起，JavaScript 逐渐成为开发 web 应用的核心技术，比如谷歌公司的 GMail。JavaScript 代码复杂度直线上升，
从最初的数行代码变为数百 KB。一方面，JavaScript 确实非常适合作为 web 应用的开发语言，另一方面，JavaScript
的执行性能成了制约开发大型复杂 web 应用系统的关键因素。

V8 是一个全新的 JavaScript 引擎，专门用于快速执行大型、复杂 web 应用。充分的 benchmark 数据显示，V8 引擎 JavaScript
脚本的执行速度比现行主流 JS 引擎快数倍（IE浏览器的 JScript、火狐浏览的 SpiderMonkey，以及 Safari 浏览器的 JavaScriptCore）。
如果您的 web 应用正受限于 JavaScript 执行速度的影响，推荐您换成 V8 引擎，将能极大提升系统的性能。当然，具体能提升多少，
取决于系统 JavaScript 的复杂度，以及具体的执行场景。使用 V8 引擎，针对 JavaScript 被反复执行的场景，优化效果将会明显优于
JavaScript 单次执行的场景。

V8 实现 ECMA-262 规范，Document Object Model (DOM) 由浏览器实现，而非 V8。

V8 实现高性能的三个关键特性如下：

1. Fast Property Access

2. Dynamic Machine Code Generation

3. Efficient Garbage Collection

## Fast Property Access

JavaScript 属于动态编程语言：代码运行时，可随时向 Object 数据中添加新属性，也可以随时将属性从 Object 对象中删除。也即是说
Object 的属性集合是随时可变的。大多数 JavaScript 引擎使用类似字典的数据结构来存储 Object 的属性。针对 Object 的每一次属性操作，
都需要动态查询字典才能获得待操作属性在内存中的具体位置。相较于 JAVA、Smalltalk 这类强类型语言的实现方式，JavaScript
实现的属性访问机制就显得非常缓慢。针对 JAVA 和 Smalltalk，因为 class 的结构是固定已知的，编译器编译过程中，class 对应的每个 instance
实例，其拥有的各个属性值位置偏移（offset）已经确定。因此 instance 中属性的访问就是单纯的内存操作，不涉及任何查询，一个操作指令即可完成。

为了降低 JavaScript 中 Object 属性值的访问时间，V8 引擎摒弃了动态字典查询的实现机制。而是借鉴了同属于 prototype-based 编程语言 Self
的实现机制（[参考](http://research.sun.com/self/papers/implementation.html)），V8 引擎在 Object 属性访问过程中，自动创建 `hidden classes`，
Object 新增或删除属性时，对应的 `hidden classes` 随之改变。

为了更为清晰地说明 V8 的实现，来看如下代码：

```js
function Point(x, y) {
  this.x = x;
  this.y = y;
}
```

执行 `new Point(x, y)` 即可创建新的 Point 对象，如果是第一次创建 Point 对象，V8 为 Point 对象创建初始化的 `hidden classes`，
用 `C0` 表示，此时 Point 对象没有定义任何属性，C0 为空。

![C0](./img/map_trans_a.png)

随即执行 Point 构造函数中的第一条语句 `this.x = x` 创建新的属性 `x`，V8 执行：

在 C0 的基础上创建新的 `hidden classes`，名为 C1，C1 中包含 Point 对象 `x` 属性的相关信息，`x` 属性值存放在 Point 对象 offset 0 的位置。
并将 Point 对象的 `hidden classes` 由 C0 变成 C1。

![C1](./img/map_trans_b.png)

继续执行 Point 构造函数中的第二条语句 `this.y = y` 创建新的属性 `y`，V8 执行：

在 C1 的基础上创建新的 `hidden classes`，名为 C2，除了包含 `x` 属性的信息，C2 中还包含 Point 对象 `y` 属性的相关信息，
`y` 属性值存放在 Point 对象 offset 1 的位置。并将 Point 对象的 `hidden classes` 由 C1 变成 C2。

![C2](./img/map_trans_c.png)

咋一看上去，上述机制略显复杂，Object 中每次新增属性，都要重新创建 `hidden classes`，并不见得能够提升对象属性访问效率。深入思考一下，
首次创建的 `hidden classes` 结构机器关系是可以复用的，针对同一类型的多个 Object 实例，只需要在第一次创建对象的时候构建 `hidden classes`，
后续重复创建同一类型的对象，直接可以复用前面的 `hidden classes` 结构。重复创建 Point 实例：

* 初始化 Point 对象，对象不包含任何属性值，`hidden classes` 指向 C0

* Point 对象添加 `x` 属性，`hidden classes` 由 C0 变为 C1，并将 `x` 属性值写入 C1 中 offset 0 的位置

* Point 对象添加 `y` 属性，`hidden classes` 由 C1 变为 C2，并将 `y` 属性值写入 C2 中 offset 1 的位置

相较于绝大多数面向对象的编程语言，JavaScript 以支持灵活的动态类型著称。有充分的实际运行数据显示，绝大部分 JavaScript 应用中，存在很大比例的执行
cases 都符合上述共享一份数据结构的模型。

使用 `hidden classes` 机制有如下两个优势：

1. Object 中访问属性值不需要查询字典，直接定位属性值

2. V8 可以充分利用经典的 class-based 优化方法，`inline caching` 来优化执行

更多信息可参考 [Efficient Implementation of the Smalltalk-80 System](http://portal.acm.org/citation.cfm?id=800017.800542)

## Dynamic Machine Code Generation

V8 引擎在首次执行 JavaScript 代码时直接将源文件编译成机器码执行。没有中间码，也没有解释器。V8 执行时，会对 `inline cache` 优化过的 Object 属性访问代码进行校正。

在访问给定对象的属性之前，V8 首先确定了当前对象的 `hidden classes`。利用局部性原理，V8 引擎假定在当前代码段中，后续所有 Object 的属性访问都使用相同的 `hidden classes`，
也即是已经确定的 `hidden classes`。使用此 `hidden classes` 中的信息对 `inline cache` 优化过的属性访问代码进行校正。如果预测成功，就可以直接访问 Object 的属性值，
如果预测失败，执行 `inline cache` 优化前的流程。

比如：访问 Point 对象中的 `x` 属性：

```js
point.x
```

V8 生成的机器码如下：

```assembly
/* ebx = the point object */
cmp [ebx,<hidden class offset>],<cached hidden class>
jne <inline cache miss>
mov eax,[ebx, <cached x offset>]
```

如果 `hidden classes` 命中，直接访问 Point 对象 `x` 属性值，如果 `hidden classes` 未命中，跳转到 `inline cache` 优化前的执行流程。
充分的实际运行的数据表明，多数情况下都能命中。

针对同一类型 Object 实例频繁创建并访问的场景，也即是 `inline cache` 高命中率的场景。综合使用 `hidden classes` 属性访问机制、`inline cache` 优化和机器码编译优化，
能极大提高 JavaScript 代码的执行效率。`inline cache` 命中率越高，优化效果就越接近静态语言。


## Efficient Garbage Collection

V8 通过垃圾回收机制回收不再需要的内存空间（主要是 Object 数据）。V8 引擎的实现了更精准、更高效的垃圾回收机制，做到了 Object 内存分配更快、回收暂停更短、并解决了内存泄露问题。
V8 垃圾回收机制有如下特点：

1. 执行垃圾回收时停止全部执行任务

2. 多数轮次的垃圾回收过程中，仅处理部分 Object heap，尽量减少任务暂停时间（ `stop-the-world` 时间）

3. 精确记录全部 Object 和指针在内存中的状态，避免由于识别不准而导致的内存泄露

V8 引擎中的 Object heap 分为两块：一块存放新创建的 Object 对象（`新区块`），一块存放经过单轮垃圾回收之后依然存在的 Object 对象（`旧区块`）。
每轮垃圾回收过后，如果有 Object 从 `新区块` 移动到 `旧区块`，V8 更新所有 Object 和 `指针` 的记录信息。
