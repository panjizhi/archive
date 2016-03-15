# 前端笔记 #
- 写在最前面
- 古老的IE6、IE7
- class命名规范
- z-index属性
- inline-block间距
- to be continue

## 写在最前面 ##

*确保「HTML结构合乎自然观感」总是值得的。*

## 古老的IE6、IE7 ##

- IE6不支持`position:fixed;`

- 选择生效CSS

>    `/* IE6 */`

>    `#once { _color: blue }`

>    `/* IE6, IE7 */`

>    `#doce { *color: blue; /* or #color: blue */ }`

<http://www.paulirish.com/2009/browser-specific-css-hacks/> 

- 不支持outline

IE6/7下清除元素outline使用*hidefocus="true"*属性，如下：

>    `outline: 0;//IE>=8`

>    `<a href="http://xxx" hidefocus="true">text</a><!--IE6/7-->`


- 触发hasLayout

>    `zoom: 1;`

很多时候，IE6、IE7下的布局bug可以通过触发hasLayout解决。

<http://riny.net/2013/haslayout/>

<https://msdn.microsoft.com/en-us/library/bb250481(v=vs.85).aspx>

- inline-block样式

IE6/7下对 *inline元素* 触发hasLayout即可获得inline-block布局，如下：

>    `#selecotr {`

>    `    display: inline-block;`

>    `    *display: inline;`

>    `    zoom: 1;`

>    `}`


- IE6下block元素嵌套

    两个div嵌套的情况下，如果被包含的子div宽度超过父div宽度，则父div宽度自动延伸，直到能包含子div。

通过设置子div的`position: absolute;`解决，fixed或者float都不能解决此问题。

- `overflow: hidden;`的问题

    IE6、IE7中，父元素设置`display: none;`，若子元素尺寸超过父元素，且设置了相对定位`position: relative;`，父元素必须设置`position: relative;`，否则子元素尺寸将溢出。

## class命名规范 ##

*HTML代码中标签元素的id和class取值应避免包含下划线，使用连字符代替。*

1996年发布的CSS1规范，1998年发布的CSS2规范不允许在class和id属性中使用下划线，除非被转义过，而各个浏览器厂商的早期版本对此标准支持极不一致。

*参考：*

1. <https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Underscores_in_class_and_ID_Names>

2. <http://stackoverflow.com/questions/1696864/naming-class-and-id-html-attributes-dashes-vs-underlines>

## z-index属性 ##

z-index只适用于定位元素（relative、absolute、fixed），z-index指定元素的stack level，只有比较的元素处于同一个stack level，z-index比较才有意义。非定位元素的stack context为根元素节点。

<http://www.w3.org/TR/2011/REC-CSS2-20110607/visuren.html#z-index>

## inline-block间距 ##

    显示样式为inline-block的元素之间存在的空格字符会产生额外间距。
    
    `The spacing effect is because of the font's spacing setting, so you must reset it for the inlined elements and set it again for the content within.`



