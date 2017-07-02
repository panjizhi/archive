# 兼容老版本 IE

* 写在最前面

* ie6/7

* `class` 命名

* `z-index` 属性
* `inline-block` 间距
* `inline-block` 垂直对齐

## 写在最前面

**_确保「HTML结构合乎自然观感」总是值得的。_**


## ie6/7

+ IE6不支持`position:fixed;`

+ 选择生效CSS

```css
/* ie6 */
#once { _color: blue }

/* ie6/7 */
#doce { *color: blue; /* or #color: blue */ }
```

<http://www.paulirish.com/2009/browser-specific-css-hacks/> 

+ 不支持 `outline`

ie6/7 下的链接通过 *hidefocus="true"* 清除 outline

```css
outline: 0; // ie >= 8
```

```html
<a href="http://xxx" hidefocus="true">text</a><!-- ie6/7 -->
```

+ 触发 `hasLayout`

```css
zoom: 1;
```

多数时候，ie6/7 下的布局问题都可以通过触发 hasLayout 解决。

<http://riny.net/2013/haslayout/>

<https://msdn.microsoft.com/en-us/library/bb250481(v=vs.85).aspx>

+ `inline-block` 样式

ie6/7 通过对 *inline 元素* 触发 hasLayout 实现 inline-block 布局。

```css
#selecotr {
    display: inline-block;
    *display: inline;
    zoom: 1;
}
```

+ ie6 中的 block 嵌套

    两个 div 嵌套的情况下，如果子 div 宽度超过父 div 宽度，则父 div 宽度自动拉伸，直到能包含子 div。

    设置子 div 的 `position: absolute;` 属性解决，fixed 或者 float 都不能解决此问题。

+ `overflow: hidden;` 的问题

    ie6/7 中，父元素设置 `overflow: hidden;`，若子元素尺寸超过父元素，且设置了相对定位 `position: relative;`，
    父元素必须设置 `position: relative;`，否则子元素尺寸将溢出。

*参考链接*

<http://www.virtuosimedia.com/dev/css/ultimate-ie6-cheatsheet-how-to-fix-25-internet-explorer-6-bugs>


## `class` 命名

**_HTML 中标签元素的 id 和 class 取值应避免包含下划线，使用连字符代替。_**

1996 年发布的 CSS1 标准、1998 年发布的 CSS2 标准不允许 class 和 id 属性值中使用下划线（可使用转义过的），
各个浏览器厂商的早期版本对此标准支持极不一致。

    1. <https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Underscores_in_class_and_ID_Names>

    2. <http://stackoverflow.com/questions/1696864/naming-class-and-id-html-attributes-dashes-vs-underlines>


## `z-index` 属性

z-index 只适用于定位元素（relative、absolute、fixed），z-index 指定元素的 stack level。
元素的展现层次首先比较 stacking context 的 stack level，处于同一个 stacking context 下的元素才比较各自的 stack level。

    <http://www.w3.org/TR/2011/REC-CSS2-20110607/visuren.html#z-index>


## `inline-block` 间距

inline-block 的区块之间存在的空格文本会引入水平间距，两种解决方案：

    1. 清除区块中的空格文本；
    2. 父容器中设置 `font-size: 0;`，子区块中恢复；

>    The spacing effect is because of the font's spacing setting, 
>    so you must reset it for the inlined elements and set it again for the content within.


## `inline-block` 垂直对齐

水平方向并排展现的 inline-block 元素，最后一个元素常会出现顶部不能对齐的问题。

通过添加 `overflow: hidden;` 解决。

>    The baseline of an 'inline-block' is the baseline of its last line box in the normal flow, 
>    unless it has either no in-flow line boxes or if its 'overflow' property has a computed value 
>    other than 'visible', in which case the baseline is the bottom margin edge.

    <http://stackoverflow.com/questions/9273016/why-is-this-inline-block-element-pushed-downward>


