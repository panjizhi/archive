# Web性能优化 #
- 写在最前面
- dns解析
- http/1.0
- http/1.1
- http/2
- 浏览器渲染模型


## 写在最前面 ##

理解Web各个环节的实现原理，才能有效实施性能优化策略。


## dns解析 ##

应用层http协议使用域名标识Web服务，而网络传输过程中实际上是使用ip地址来标识通信的两端，因此，访问Web服务的第一步是做dns解析，将Web服务器的域名解析成对应的ip地址。如下（windows平台）：

![dns resolution](./dns-resolution.gif)

*如能提前执行dns解析，用户请求Web资源时就能够节省dns解析的时间延迟，这就是dns预取策略。*

<https://developer.mozilla.org/zh-CN/docs/Controlling_DNS_prefetching>


- http/1.0

http协议是Web应用的基础，http协议目前有三个版本：http/1.0、http/1.1、http/2。首先需要理解各个版本的特点，先从http/1.0开始。

http协议使用tcp来实现可靠的数据传输，在http/1.0中，一次http请求对应一个tcp连接，用户通过浏览器发送http request，Web服务器返回http response数据，数据传输完成之后即断开tcp连接。这里引入两个问题：

- tcp连接不可复用，导致重复建立连接的开销
- Web服务器主动关闭tcp连接，维护大量TIME_WAIT状态

另，http/1.0规范中，request头部字段缺乏Host字段的定义，无法识别一台主机中的不同域名。


<https://www.w3.org/Protocols/HTTP/1.0/HTTPPerformance.html>

>    `/* IE6 */`

>    `#once { _color: blue }`

>    `/* IE6, IE7 */`

>    `#doce { *color: blue; /* or #color: blue */ }`

<http://www.paulirish.com/2009/browser-specific-css-hacks/> 

- 不支持outline

IE6/7下的link元素通过 *hidefocus="true"* 属性清除outline，如下：

>    `outline: 0;//IE>=8`

>    `<a href="http://xxx" hidefocus="true">text</a><!--IE6/7-->`


- 触发hasLayout

>    `zoom: 1;`

很多时候，IE6、IE7下的布局bug可以通过触发hasLayout解决。

<http://riny.net/2013/haslayout/>

<https://msdn.microsoft.com/en-us/library/bb250481(v=vs.85).aspx>

- inline-block样式

IE6/7下通过对 *inline元素* 触发hasLayout获得inline-block布局，如下：

>    `#selecotr {`

>    `    display: inline-block;`

>    `    *display: inline;`

>    `    zoom: 1;`

>    `}`


- IE6下的block元素嵌套

    两个div嵌套的情况下，如果被包含的子div宽度超过父div宽度，则父div宽度自动延伸，直到能包含子div。

    通过设置子div的`position: absolute;`解决，fixed或者float都不能解决此问题。

- `overflow: hidden;`的问题

    IE6、IE7中，父元素设置`overflow: hidden;`，若子元素尺寸超过父元素，且设置了相对定位`position: relative;`，父元素必须设置`position: relative;`，否则子元素尺寸将溢出。

*参考链接*

<http://www.virtuosimedia.com/dev/css/ultimate-ie6-cheatsheet-how-to-fix-25-internet-explorer-6-bugs>


## class命名规范 ##

*HTML中标签元素的id和class取值应避免包含下划线，使用连字符代替。*

1996年发布的CSS1标准，1998年发布的CSS2标准不允许class和id属性值中使用下划线，除非被转义过，各个浏览器厂商的早期版本对此标准支持极不一致。

1. <https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Underscores_in_class_and_ID_Names>

2. <http://stackoverflow.com/questions/1696864/naming-class-and-id-html-attributes-dashes-vs-underlines>


## z-index属性 ##

z-index只适用于定位元素（relative、absolute、fixed），z-index指定元素的stack level。元素的展现层次首先比较stacking context的z-index值，处于同一个stacking context下的元素才比较各自的z-index值。

<http://www.w3.org/TR/2011/REC-CSS2-20110607/visuren.html#z-index>


## inline-block间距 ##

inline-block的区块之间存在的空格文本会引入水平间距，两种解决方案：

1. 清除区块中的空格文本；
2. 设置父容器的`font-size: 0;`，子区块中恢复；

    The spacing effect is because of the font's spacing setting, 
    so you must reset it for the inlined elements and set it again for the content within.


## inline-block垂直对齐 ##

水平方向并排展现的inline-block元素，最后一个元素常会出现顶部不能对齐的问题。

通过添加`overflow: hidden;`解决。

    The baseline of an 'inline-block' is the baseline of its last line box in the normal flow, 
    unless it has either no in-flow line boxes or if its 'overflow' property has a computed value 
    other than 'visible', in which case the baseline is the bottom margin edge.

<http://stackoverflow.com/questions/9273016/why-is-this-inline-block-element-pushed-downward>


