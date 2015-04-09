//
//  通过重写document.cookie的accessor descriptor实现cookie读/写监控
//
//  当前测试环境: 
//  OS：windows 7 64bit
//  Browsers：IE11/10/9, Firefox 36.0.4
//
;(function(){
    var nativeProperty = {},
        hijackProperty = {},
        nativeSetter, 
        nativeGetter, 
                       // type: data descriptor
                       // browsers: chrome 41.0.2272.118 m, IE8
                       // 
                       // Internet Explorer 8 standards mode supports DOM objects but not user-defined objects. 
                       // The enumerable and configurable attributes can be specified, but they are not used.
        descriptor = Object.getOwnPropertyDescriptor(document, 'cookie') || 
                       // type: accessor descriptor
                       // browsers: firefox 36.0.4, IE9/10
                       Object.getOwnPropertyDescriptor(Object.getPrototypeOf(document), 'cookie') || 
                       // type: accessor descriptor
                       // browsers: IE11
                       Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
                       
    function hijacking(newValue, type){
        type = type || 'get';
        console.log('Cookies hijacking(' + type + '): \n' + newValue);        
    }
    
    function nativeCall(newValue){
        Object.defineProperty(document, 'cookie', { // data descriptor
                value: descriptor.value,
                writable: descriptor.writable,
                enumerable: descriptor.enumerable,
                configurable: descriptor.configurable
        });        
        document.cookie = newValue;
        
        descriptor = Object.getOwnPropertyDescriptor(document, 'cookie');
        Object.defineProperty(document, 'cookie', hijackProperty);
    }
    
    if(descriptor){
        if(descriptor.hasOwnProperty('value')){ // chrome 41.0.2272.118 m
            nativeProperty = { // data descriptor
                value: descriptor.value,
                writable: descriptor.writable,
                enumerable: descriptor.enumerable,
                configurable: descriptor.configurable
            };
            hijackProperty = { // accessor descriptor
                value: '',
                writable: true,
                get: function(){
                    var reserved = descriptor.value;
                    hijacking(reserved, 'get');
                    return reserved;
                },
                set: function(newValue){
                    hijacking(newValue, 'set');
                    nativeCall(newValue);
                },
                enumerable: true,
                configurable: true
            };
            Object.defineProperty(document, 'cookie', nativeProperty);
        }else{ // accessor descriptor
            nativeGetter = descriptor.get || function(){console.log('Error!')};
            nativeSetter = descriptor.set || function(){console.log('Error!')};
            Object.defineProperty(document, 'cookie', {
                get: function () {
                    var ret = nativeGetter.call(document);
                    hijacking(ret, 'get');
                    return ret;
                },
                set: function (value) {
                    var ret = nativeSetter.call(document, value);
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
