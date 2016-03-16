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

    另：国内浏览器厂商众多，且分别实现各自的调起白名单、黑名单策略，
    针对具体的App调起做了处理。



## iOS平台 ##

- iOS 9之前

创建隐藏的iframe标签（display:none;），通过iframe加载App对应的scheme，从而实现App调起。

*iframe标签调起可以规避App未安装情况下出现的错误信息*

- iOS9之后
iframe标签调起方式在Safari中失效，只能直接location.href调起，但APP未安装时出现无法规避的错误提示。

另，iOS9之后新增universal links机制，遵循规范开发App可实现平滑调起。
https://developer.apple.com/library/prerelease/ios/documentation/General/Conceptual/AppSearch/UniversalLinks.html#//apple_ref/doc/uid/TP40016308-CH12

iOS8、iOS9下的Safari浏览器支持Page Visibility特性，通过监听document.visibilitychange事件，可以判断App是否成功调起。
http://www.w3.org/TR/page-visibility/

注意：iOS下的其他浏览器虽然支持Page Visibility接口，然而网页中调起App并不触发document.visibilitychange事件。

二、Android平台

利用iframe标签加载scheme来调起App适用于版本号在25之前的Chrome浏览器，之后的Chrome浏览器不再支持iframe标签的自定义scheme调起，转而支持intent协议调起APP。
通过S.browser_fallback_url指定App调起失败的回跳地址（browser_fallback_ur这个值Chrome浏览器自动过滤，并不会到达App）。
利于S.browser_fallback_url值，结合window.onhashchange事件即可判断APP是否成功调起。

注意，下述两种场景会导致App调起失败：

另：针对App调起支持，国内浏览器厂商有各自的白名单、黑名单策略。
