# `V8` Design Elements

上世纪90年代中期，JavaScript 首次应用到网景公司的 Netscape Navigator 浏览器，JavaScript 的到来使得 web
开发者可以十分方便地操作 HTML 元素（比如：表单、frames、图片）。JavaScript 越来越多地被用来实现动态网页效果。
到90年代后期，大部分 JavaScript 脚本主要用来响应用户鼠标操作，实现图片的简单切换。

后来，随着 AJAX 的兴起，JavaScript 逐渐成了实现 web 应用的核心技术，比如：GMail。JavaScript 代码的复杂度也直线上升，
从最初的数行代码变为数百 KB。一方面，JavaScript 很好地完成了开发 web 应用的需求，另一方面，JavaScript
性能成了影响开发大型复杂 web 应用系统的关键因素。

V8 是一个新的 JavaScript 引擎，主要用于执行大型 web 应用。充分的 benchmark 显示，V8 引擎的执行速度比现行主流
JS 引擎快数倍（包括：IE浏览器使用的 JScript、火狐浏览使用的 SpiderMonkey，以及 Safari 浏览器的 JavaScriptCore）。
假如你的 web 应用受限于 JavaScript 的执行速度，推荐你换成 V8，将能极大提升系统的性能。具体能提升多少，取决于系统
JavaScript 代码的量以及执行场景。JavaScript 被反复执行的场景使用 V8 引擎的优化效果将明显优于 JavaScript 单次执行的场景。

V8 实现高性能的三个关键特性如下：

1. Fast Property Access

2. Dynamic Machine Code Generation

3. Efficient Garbage Collection

## Fast Property Access


