/**
 *  COOKIE hijack：通过重写document.cookie的data/accessor descriptor实现cookie读/写监控
 *  
 *  测试环境: 
 *  OS：windows 7 64bit
 *  Browsers：IE8/9/10/11, Firefox 36.0.4, chrome 41.0.2272.118 m
 *
 *  @author panjizhi
 *  @date 2015/04/10
 */
try{
    (function(){
        var hijackProperty = {}, 
            iframeDocument = null, 
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
                           
        function hijacking(value, type){
            type = type || 'get';
            console.log('Cookies hijacking(' + type + '): \n' + value);        
        }
        
        function nativeGetter(){
            return iframeDocument.cookie;
        }
        
        function nativeSetter(newValue){
            return iframeDocument.cookie = newValue;
        }
        
        if(_descriptor && _descriptor.hasOwnProperty('configurable') && _descriptor.hasOwnProperty('enumerable')){
            if(_descriptor.hasOwnProperty('value') && _descriptor.hasOwnProperty('writable')){ // Browsers: chrome 41.0.2272.118 m, IE8; Type: data descriptor
                hijackProperty = { // accessor descriptor
                    get: function(){
                        var ret = nativeGetter();
                        hijacking(ret, 'get');
                        return ret;
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
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);
                    iframeDocument = iframe.contentDocument || iframe.contentWindow.document;                
                })();
            }else if(_descriptor.hasOwnProperty('get') && _descriptor.hasOwnProperty('set')){ // accessor descriptor
                _getter = _descriptor.get || function(){console.log('Error: native getter not found!')};
                _setter = _descriptor.set || function(){console.log('Error: native setter not found!')};
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
}catch(ex){
    console.log(ex);
}

// test code snippet
var data = new Date().getTime();
document.cookie;
document.cookie = 'hj_author'+data+'=x3xtxt';
document.cookie;
document.cookie = 'x3xtxt'+data+'=hj_author';
document.cookie;
