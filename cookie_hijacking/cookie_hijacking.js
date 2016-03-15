/**
 *  @file cookie_hijacking.js
 *  @author panjizhi
 *  @date 2015/04/10
 *  
 *  重写document.cookie的data/accessor descriptor, 监测前端js对浏览器cookie的读/写操作
 *
 *  环境:
 *  OS：windows 7 64bit
 *  Browsers：IE8/9/10/11, Firefox 36.0.4, chrome 41.0.2272.118 m
 *
 */
try {
    (function () {
        if (typeof Object.defineProperty === 'undefined' || 
              typeof Object.getOwnPropertyDescriptor === 'undefined' ) { // 低版本浏览器不支持
            return;
        }

        var _iframe = null, // 提供原生的cookie读/写操作，类型为data descriptor时使用
            _iframeDocument = null, 
            _setter,
            _getter,
                          // Type: data descriptor
                          // Browsers: IE8, chrome 41.0.2272.118 m
                          //
                          // Internet Explorer 8 standards mode supports DOM objects but not user-defined objects.
                          // The enumerable and configurable attributes can be specified, but they are not used.
            _descriptor = Object.getOwnPropertyDescriptor(document, 'cookie') || 
                            // Type: accessor descriptor
                            // Browsers: firefox 36.0.4, IE9/10
                            Object.getOwnPropertyDescriptor(Object.getPrototypeOf(document), 'cookie') || 
                            // Type: accessor descriptor
                            // Browsers: IE11
                            Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');

        function hijacking(newValue) {
            // hijacking code here
            console.log('cookie hijacking');
        }

        function nativeGetter() {
            return _iframeDocument.cookie;
        }

        function nativeSetter(newValue) {
            return _iframeDocument.cookie = newValue;
        }
        
        function replaceDescriptor(){
            _iframeDocument = _iframe.contentDocument || _iframe.contentWindow.document;
            Object.defineProperty(document, 'cookie', { // accessor descriptor
                get : function () {
                    return nativeGetter();
                },
                set : function (newValue) {
                    hijacking(newValue);
                    return nativeSetter(newValue);
                },
                enumerable : false, 
                configurable : true // IE8: true for configurable, false for enumerable for accessor descriptor
            });            
        }

        if (_descriptor && _descriptor.hasOwnProperty('configurable') && _descriptor.hasOwnProperty('enumerable')) {
            if (_descriptor.hasOwnProperty('value') && _descriptor.hasOwnProperty('writable')) { // Browsers: chrome 41.0.2272.118 m, IE8; Type: data descriptor
                // 通过iframe执行原生态的cookie读写
                _iframe = document.createElement('iframe');
                _iframe.width = 0;
                _iframe.height = 0;
                _iframe.border = 0;
                _iframe.setAttribute('src', 'nativecall.html');
                _iframe.style.display = 'none';
                if (_iframe.attachEvent) {
                    _iframe.attachEvent("onload", replaceDescriptor);
                } else {
                    _iframe.onload = replaceDescriptor;
                }
                document.body.appendChild(_iframe);
            } else if (_descriptor.hasOwnProperty('get') && _descriptor.hasOwnProperty('set')) { // accessor descriptor
                _getter = _descriptor.get || function () {};
                _setter = _descriptor.set || function () {};
                Object.defineProperty(document, 'cookie', {
                    get : function () {
                        return _getter.call(document);
                    },
                    set : function (newValue) {
                        hijacking(newValue);
                        return _setter.call(document, newValue);
                    },
                    enumerable : true,
                    configurable : false
                });
            }
        }
    })();
} catch (ex) {
    
}
