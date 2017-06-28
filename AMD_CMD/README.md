# AMD (RequireJS) vs CMD (SeaJS)


## 目标一致

两种规范都是为了实现模块化协同开发（主要针对浏览器端）。


## 异同对比

<table width="100%">
    <tr>
        <th width="20%">&nbsp;</th>
        <th width="40%">
            <p>RequireJS</p>
        </th>
        <th width="40%">
            <p>SeaJS</p>
        </th>
    <tr>
    <tr>
        <th align="left">书写风格</th>
        <td align="left"><p>近似于异步回调风格</p></td>
        <td align="left"><p>近似于 CommonJS 风格</p></td>
    </tr>
    <tr>
        <th align="left">依赖加载</th>
        <td align="left"><p>factory 执行前各依赖模块必须全部加载</p></td>
        <td align="left"><p>同 RequireJS</p></td>
    </tr>
    <tr>
        <th align="left">依赖执行</th>
        <td align="left"><p>factory 执行前，执行各个依赖模块 factory 函数获取导出值，并作为参数按序传递给 factory 函数。</p></td>
        <td align="left"><p>factory 执行过程中，真正使用依赖模块时才执行模块对应的 factory 获取导出值。</p></td>
    </tr>
    <tr>
        <th align="left">不足之处</th>
        <td align="left"><p>各依赖模块先于 factory 执行前执行，如果部分依赖模块只有在特定条件下才使用，就会造成不必要的执行消耗。 </p></td>
        <td align="left"><p>依赖模块通过解析 factory.toString() 获得，这就要求 factory 中的 require 模块名必须硬编码，同时代码压缩必须保证 factory 中的require 参数名保持不变。</p></td>
    </tr>
</table>


## 几点补充

+ 关于 CMD 强调 `as lazy as possible`，仅仅是推迟了依赖模块 factory 函数的执行时机，依赖模块的仍然需要提前加载，本质上并没有带来任何效率上的优化。
+ AMD 规范同样支持解析 factory.toString() 获得依赖模块，此时调用 define 函数是不能提供依赖模块参数。如下：

```js
define(function (require) {
    var a = require('a');
});
```
