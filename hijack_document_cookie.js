//
//  通过重写document.cookie的accessor descriptor实现cookie读/写监控
//
//  当前测试环境: 
//  OS：windows 7 64bit
//  Browsers：IE11/10/9, Firefox 36.0.4
//
;(function(){
    var hijackProperty = {}, 
        iframeWindow = null, 
        _setter, 
        _getter, 
                       // type: data descriptor
                       // browsers: chrome 41.0.2272.118 m, IE8
                       // 
                       // Internet Explorer 8 standards mode supports DOM objects but not user-defined objects. 
                       // The enumerable and configurable attributes can be specified, but they are not used.
        _descriptor = Object.getOwnPropertyDescriptor(document, 'cookie') || 
                       // type: accessor descriptor
                       // browsers: firefox 36.0.4, IE9/10
                       Object.getOwnPropertyDescriptor(Object.getPrototypeOf(document), 'cookie') || 
                       // type: accessor descriptor
                       // browsers: IE11
                       Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
                       
    function hijacking(value, type){
        type = type || 'get';
        console.log('Cookies hijacking(' + type + '): \n' + value);        
    }
    
    function nativeGetter(){
        //iframeWindow['getCookie']();
        return iframeWindow.document.cookie;
    }
    
    function nativeSetter(newValue){
        //iframeWindow['setCookie'](newValue);
        return iframeWindow.document.cookie = newValue;
    }
    
    if(_descriptor){
        if(_descriptor.hasOwnProperty('value')){ // Browsers: chrome 41.0.2272.118 m, IE8; Type: data descriptor
            hijackProperty = { // accessor descriptor
                get: function(){
                    hijacking(_descriptor.value, 'get');
                    return nativeGetter();
                },
                set: function(newValue){
                    hijacking(newValue, 'set');
                    return nativeSetter(newValue);
                },
                enumerable: false, // IE8不能设置为true
                configurable: true // IE8不能设置为false
            };
            Object.defineProperty(document, 'cookie', hijackProperty);
            
            (function(){ // 通过iframe执行原生态的COOKIE读写
                var iframe = document.createElement('iframe');
                iframe.border = 0;
                iframe.width = 0;
                iframe.height = 0;
                iframe.setAttribute('src', 'http://domain/iframe4nativecall.html');
                document.body.appendChild(iframe);
                iframeWindow = iframe.contentWindow;                
            })();
        }else{ // accessor descriptor
            _getter = descriptor.get || function(){console.log('Error!')};
            _setter = descriptor.set || function(){console.log('Error!')};
            Object.defineProperty(document, 'cookie', {
                get: function () {
                    var ret = _getter.call(document);
                    hijacking(ret, 'get');
                    return ret;
                },
                set: function (value) {
                    var ret = _setter.call(document, value);
                    hijacking(value, 'set');
                    return ret;
                },
                enumerable: true,
                configurable: false
            });            
        }    
    }
})();

// test code snippet
var data = new Date().getTime();
document.cookie;
document.cookie = 'hj_author'+data+'=x3xtxt';
document.cookie;
document.cookie = 'x3xtxt'+data+'=hj_author';
document.cookie;
