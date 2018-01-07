# Setting up prototypes in V8

JavaScript 使用 `prototype` 来模拟 `class`。 class 中的 `method` 都挂在原型对象上。一般来说，原型对象一旦构建好，
后续操作中很少对其修改。

## Transitioning object shapes

JavaScript 中常规 `Object` 对象的结构模型可参考 [Fast Property Access](https://github.com/v8/v8/wiki/Design-Elements#user-content-fast-property-access)。

## Prototypes are special snowflakes

相较于常规 `Object` 对象，`prototype` 不存在多个实例共用 `constructor` 的场景。基于这一特性，构建 `hidden classes tree`
不仅没有降低内存开销、提升访问时间，反倒是做了不必要的初始化操作。因此，针对 `prototype` 对象，采用 `dictionary object` 
结构进行实例化，实现快速访问。

> Prototypes in the setup phase are encoded as dictionary objects. Stores to prototypes in that state are really fast, 
> and do not necessarily need to **enter the C++ runtime (a boundary crossing which is pretty expensive)**. 
> This is a huge improvement over the initial object setup that needs to create a transitioning hidden class; 
> partially because this has to be done in the C++ runtime.

## Is it a prototype?

问题来了，`prototype` 和常规 Object 对象使用不同的处理方式，如何判断一个对象是否是 `prototype` 对象 ?

```js
var o = {x:1};
func.prototype = o;
```

首行代码中，对象实例 `o` 首先作为普通 Object 类型，构建 `hidden classes`；到第二行即知道 `o` 作为 `prototype` 对象，
切换到 `dictionary object` 构建。

```js
var o = {};
func.prototype = o;
o.x = 1;
```

相较于上一示例代码，首行执行即可知道 `o` 作为 `prototype` 对象，省掉构建 `hidden classes` 的过程，程序执行更为高效。

## How to set up prototypes

```js
// Omit the following line if the default Object.prototype as __proto__ is fine.
func.prototype = Object.create(…);
func.prototype.method1 = …
func.prototype.method2 = …
```

上述代码段规避了构建 `hidden classes` 这一不必要的过程，实现了较好的优化。然而每次添加 `method` 都需要重复查找 `func.prototype`，
可做如下改进：

```js
var proto = func.prototype = Object.create(…);
proto.method1 = …
proto.method2 = …
```
