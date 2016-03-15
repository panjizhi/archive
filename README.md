# 前端笔记 #
- 写在最前面
- 还记得IE6吗
- class命名规范
- z-index属性
- to be continue

## 写在最前面 ##

*确保「HTML结构合乎自然观感」总是值得的*

## 还记得IE6吗 ##

- 不支持*position:fixed;*

- 只对IE6生效（css样式名称以下划线开头）

>    `/* IE6 */`

>    `#once { _color: blue }`

>    `/* IE6, IE7 */`

>    `#doce { *color: blue; /* or #color: blue */ }`

<http://www.paulirish.com/2009/browser-specific-css-hacks/> 

- 不支持outline(IE7同样不支持)

IE6/7下清除元素outline使用*hidefocus="true"*属性，如下：

>    `outline: 0;//IE>=8`

>    `<a href="http://xxx" hidefocus="true">text</a><!--IE6/7-->`


- 触发hasLayout(IE6/7)

>    `zoom: 1;`

很多时候，IE6、IE7下的布局bug触发hasLayout即可解决。

<https://msdn.microsoft.com/en-us/library/bb250481(v=vs.85).aspx>

<http://riny.net/2013/haslayout/>

- inline-block(IE6/7)

>    `#selecotr {`

>    `    display: inline-block;`

>    `    *display: inline;`

>    `    zoom: 1;`

>    `}`

## class命名规范 ##

* HTML代码中标签元素的id和class取值应避免包含下划线，使用连字符代替。*

1996年发布的CSS1规范，1998年发布的CSS2规范不允许在class和id属性中使用下划线，除非被转义过，而各个浏览器厂商的早期版本对此标准支持极不一致。

* 参考：*
1. <https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Underscores_in_class_and_ID_Names>

2. <http://stackoverflow.com/questions/1696864/naming-class-and-id-html-attributes-dashes-vs-underlines>

## z-index属性 ##

z-index只适用于定位元素（relative、absolute、fixed），z-index指定元素的stack level，只有比较的元素处于同一个stack level，z-index比较才有意义。非定位元素的stack context为根元素节点。

<http://www.w3.org/TR/2011/REC-CSS2-20110607/visuren.html#z-index>



