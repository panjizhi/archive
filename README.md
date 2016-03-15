# 前端笔记 #
- 写在最前面
- 还记得IE6吗
- z-index
- flow

## 写在最前面 ##
*HTML结构必须合乎自然*

## 还记得IE6吗 ##
### 1. 不支持*position:fixed*; ###


### 2. 对background-color处理不够聪明(IE7也一样); ###




**3. 不能支持outline(IE7也一样)**

IE6/7下清除元素的outline应该使用*hidefocus="true"*属性，如下：

>    `outline: 0;//IE>=8`    
>    `<a href="http://xxx" hidefocus="true">text</a><!--IE6/7-->`


**4. **
    
    
