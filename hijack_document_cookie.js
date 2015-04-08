//
//  通过重写document.cookie的accessor descriptor实现cookie读/写监控
//
//  当前测试环境: 
//  OS：windows 7 64bit
//  Browsers：IE11/10/9, Firefox 36.0.4
//
;(function(){
    var _set, _get,
        _cDescriptor = Object.getOwnPropertyDescriptor(document, 'cookie') || // chrome 41.0.2272.118 m, IE8(Internet Explorer 8 standards mode supports DOM objects but not user-defined objects. The enumerable and configurable attributes can be specified, but they are not used.)
                       Object.getOwnPropertyDescriptor(Object.getPrototypeOf(document), 'cookie') || // firefox 36.0.4, IE9/10
                       Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');// IE11
                       
    if(_cDescriptor){
        if(_cDescriptor.hasOwnProperty('value')){       // chrome 41.0.2272.118 m
            Object.defineProperty(document, 'cookie', { //data descriptor
                value: _cDescriptor.value,
                writable: _cDescriptor.writable,
                enumerable: _cDescriptor.enumerable,
                configurable: false
            });
        }else{ // accessor descriptor
            _get = _cDescriptor.get || function(){console.log('Error!')};
            _set = _cDescriptor.set || function(){console.log('Error!')};
            Object.defineProperty(document, 'cookie', {
                get: function () {
                    console.log('hijack get cookie action!');
                    return _get.call(document);
                },
                set: function (value) {
                    console.log('hijack set cookie action!');
                    return _set.call(document, value);
                },
                enumerable: true,
                configurable: false
            });            
        }    
    }
})();

// test code snippet 
console.log(document.cookie);
document.cookie = "hj_author=x3xtxt";
console.log(document.cookie);
