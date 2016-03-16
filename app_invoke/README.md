# 前端调起App实现 #


# 写在最前面 #

目前通过前端调起App有三种方式：

- `scheme uri`

- `intent scheme`

- `universal links`

无论采用哪种方式，都需求客户端App实现对应的调起接口。

+ *scheme uri*： iOS, Android两个平台同时支持；

+ *intent scheme*：适用于Android下的Chrome浏览器；[reference](https://developer.chrome.com/multidevice/android/intents)

+ *universal links*：iOS9新增特性，用于适用于iOS9系统；[reference](https://developer.apple.com/library/prerelease/ios/documentation/General/Conceptual/AppSearch/UniversalLinks.html#//apple_ref/doc/uid/TP40016308-CH12)

本文主要讨 *scheme uri* 这一调起方式。

    另：国内浏览器厂商众多，且分别实现各自的调起白名单、黑名单策略，针对具体的App调起做了处理。



## iOS平台 ##

- iOS9之前

&emsp;&emsp;创建隐藏的iframe标签，通过iframe加载App对应的scheme，从而实现App调起。

&emsp;&emsp;*通过隐藏iframe标签实现调起，优点在于可以有效规避App未安装情况下出现的错误提示信息。*

- iOS9

&emsp;&emsp;Safari浏览器无法使用iframe标签调起App，转而只能使用`A标签`，`location.href`加载scheme uri实现调起。

&emsp;&emsp;*问题：App未安装时出现无法规避的错误提示。*

&emsp;&emsp;非Safari浏览器依然可以使用iframe标签实现调起。



## Android平台 ##

- iframe标签调起

&emsp;&emsp;创建隐藏的iframe标签，通过iframe加载App对应的scheme，从而实现App调起。

&emsp;&emsp;针对Android下多数分浏览器，可使用此方式调起。

- A标签、`location.href`调起

&emsp;&emsp;通过A标签、`location.href`直接加载scheme uri调起。


	无论使用iframe加载，或是使用A标签加载，Android, versions 25 and later，必须基于用户交互动作，否则无法调起。

    总的来说，Android平台版本碎片化太严重，目前尚未整理各种调起方式适用的
    场景（Android版本，浏览器厂商）。使用时注意结合使用上述三种方法。


## 调起状态检测 ##

利用iframe标签加载scheme来调起App适用于版本号在25之前的Chrome浏览器，之后的Chrome浏览器不再支持iframe标签的自定义scheme调起，转而支持intent协议调起APP。
通过S.browser_fallback_url指定App调起失败的回跳地址（browser_fallback_ur这个值Chrome浏览器自动过滤，并不会到达App）。
利于S.browser_fallback_url值，结合window.onhashchange事件即可判断APP是否成功调起。

注意，下述两种场景会导致App调起失败：

另：针对App调起支持，国内浏览器厂商有各自的白名单、黑名单策略。
