# 前端笔记 #
- 写在最前面
- 古老的IE6、IE7
- class命名规范
- z-index属性
- inline-block间距
- inline-block对齐

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

1. <https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Underscores_in_class_and_ID_Names>

2. <http://stackoverflow.com/questions/1696864/naming-class-and-id-html-attributes-dashes-vs-underlines>

## z-index属性 ##

z-index只适用于定位元素（relative、absolute、fixed），z-index指定元素的stack level。元素的展现层次首先看stacking context的z-index值，处于同一个stacking context下的元素才比较各种的z-index值。

<http://www.w3.org/TR/2011/REC-CSS2-20110607/visuren.html#z-index>

## inline-block间距 ##

display取值为inline-block的元素之间空格字符会引入水平间距。

    The spacing effect is because of the font's spacing setting, 
    so you must reset it for the inlined elements and set it again for the content within.

## inline-block垂直对齐 ##

水平方向并排展现的inline-block元素，最后一个元素常会出现顶部不能对齐的问题。

通过添加`overflow: hidden;`解决。

    The baseline of an 'inline-block' is the baseline of its last line box in the normal flow, 
    unless it has either no in-flow line boxes or if its 'overflow' property has a computed value 
    other than 'visible', in which case the baseline is the bottom margin edge.

<http://stackoverflow.com/questions/9273016/why-is-this-inline-block-element-pushed-downward>

