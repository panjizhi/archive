# 前端笔记 #
- 写在最前面
- 还记得IE6吗
- z-index
- flow

## 写在最前面 ##
确保*HTML结构合乎自然观感*总是值得的！

## 还记得IE6吗 ##
1. 不支持*position:fixed*;

2. 只对IE6生效
>/* IE6 */
>#once { _color: blue }

>/* IE6, IE7 */
>#doce { *color: blue; /* or #color: blue */ }
[详细参考](http://www.paulirish.com/2009/browser-specific-css-hacks/) 

**3. 不能支持outline(IE7也一样)**

IE6/7下清除元素的outline应该使用*hidefocus="true"*属性，如下：

>    `outline: 0;//IE>=8`    
>    `<a href="http://xxx" hidefocus="true">text</a><!--IE6/7-->`


**4. **
    
    
