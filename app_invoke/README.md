# 前端调起App实现 #


# 写在最前面 #

目前前端实现App调起有三种方式：

- `scheme uri`

- `intent scheme`

- `universal links`

&emsp;&emsp;无论采用哪种方式，都需要App客户端配合实现相应的调起规范。

+ *scheme uri*： iOS, Android两个平台同时支持；

+ *intent scheme*：适用于Android下的Chrome浏览器；[reference](https://developer.chrome.com/multidevice/android/intents)

+ *universal links*：iOS9新增特性，用于适用于iOS9系统；[reference](https://developer.apple.com/library/prerelease/ios/documentation/General/Conceptual/AppSearch/UniversalLinks.html#//apple_ref/doc/uid/TP40016308-CH12)

&emsp;&emsp;本文主要讨 *scheme uri* 这一调起方式。

    另：国内浏览器厂商众多，且分别实现各自的调起白名单、黑名单过滤策略。



## iOS平台 ##

- iOS9之前

&emsp;&emsp;创建隐藏的iframe标签，通过iframe加载App对应的scheme uri完成调起。

&emsp;&emsp;*通过隐藏的iframe标签实现调起，优点在于可以规避App未安装情况下出现的错误提示信息。*

- iOS9

`1.` Safari浏览器

&emsp;&emsp;不支持iframe标签调，只能使用`location.href`直接加载scheme uri完成调起(也可以使用A标签跳转)。

&emsp;&emsp;*问题：App未安装时出现无法规避的错误提示。*

`2.` 非Safari浏览器

&emsp;&emsp;支持iframe标签实现调起。


## Android平台 ##

- iframe标签调起

&emsp;&emsp;创建隐藏的iframe标签，通过iframe加载App对应的scheme uri完成调起。

&emsp;&emsp;Android下多数浏览器，可使用此方式调起。

- *location.href* 加载调起

&emsp;&emsp;使用`location.href`直接加载scheme uri完成调起。


- 用户行为触发

&emsp;&emsp;无论是使用iframe加载，或是使用`location.href`加载，Android, versions 25 and later，必须基于用户交互动作，否则无法调起。

    总的来说，Android平台碎片化太严重，目前未整理各种调起方式的适用场景（Android版本，浏览器厂商）。
    
    遇到问题参照上述三点。优先采用隐藏ifram标签实现调起，App未安装时可以规避错误提示。


## 调起状态检测 ##

- scheme uri调起

&emsp;&emsp;使用scheme uri的调起方式，通过Page Visibility API判断页面可视状态的变化，获得App调起状态。

&emsp;&emsp;<https://www.w3.org/TR/page-visibility/>

&emsp;&emsp;<https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API>

- intent scheme调起

&emsp;&emsp;通过`S.browser_fallback_url`字段指定调起失败的回调地址（S.browser_fallback_ur这个值由Chrome浏览器自动过滤，并不会到达App客户端）。S.browser_fallback_url设置为当前页面地址加上变化的hash值，结合window.onhashchange事件即可判断App调起状态。


