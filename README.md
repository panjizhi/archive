fe之路，前端琐碎
=================

* 首先当然是IE6


## 首先当然是IE6 ##
1. 不能支持*position:fixed*;

2. 对background-color处理不够聪明(IE7也一样);    
`background-color: #4d4d4d;`    
`background-color: rgba(0,0,0,0.7);`    
上面的CSS在IE6下将得不到任何背景颜色，猜测是*background-color: rgba(0,0,0,0.7);*覆盖前面的*background-color: #4d4d4d;*,而IE6不能支持*rgba(0,0,0,0.7)*，导致无背景。可改为如下：    
`background-color: #4d4d4d;`    
`background-color: rgba(0,0,0,0.7);`    
`*background-color: #4d4d4d;`

3. 123
    
    
