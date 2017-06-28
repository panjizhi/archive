# AMD (RequireJS) vs CMD (SeaJS)

## 目标一致

两种规范都是为了解决浏览器模块化开发的问题。

## 异同对比

-       | RequireJS | SeaJS
--------| --------- | -----
书写风格 | 近似于异步回调风格 | 近似于 CommonJS 风格
依赖加载 | factory 执行前各个依赖必须加载完毕 | 同上
依赖执行 | factory 执行前执行各个依赖, 并按序传递给 factory 作为函数参数 | factory 执行中，用到才执行


