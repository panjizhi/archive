# 前端笔记 #
- 写在最前面
- 还记得IE6吗
- class命名规范
- z-index
- flow

## 写在最前面 ##
确保*HTML结构合乎自然观感*总是值得的！

## 还记得IE6吗 ##

1. 不支持*position:fixed;*

2. 只对IE6生效（css样式名称以下划线开头）

>    /* IE6 */
>    #once { _color: blue }

>    /* IE6, IE7 */
>    #doce { *color: blue; /* or #color: blue */ }

[详细参考](http://www.paulirish.com/2009/browser-specific-css-hacks/) 

3. 不支持outline(IE7同样不支持)
IE6/7下清除元素outline使用*hidefocus="true"*属性，如下：

>    outline: 0;//IE>=8    
>    <a href="http://xxx" hidefocus="true">text</a><!--IE6/7-->


## class命名规范 ##

* HTML代码中标签元素的id和class取值应避免包含下划线，使用连字符代替。*

1996年发布的CSS1规范，1998年发布的CSS2规范不允许在class和id属性中使用下划线，除非被转义过，而各个浏览器厂商的早期版本对此标准支持极不一致。

* 参考：*
1. [https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Underscores_in_class_and_ID_Names](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Underscores_in_class_and_ID_Names)

2. [http://stackoverflow.com/questions/1696864/naming-class-and-id-html-attributes-dashes-vs-underlines](http://stackoverflow.com/questions/1696864/naming-class-and-id-html-attributes-dashes-vs-underlines)


