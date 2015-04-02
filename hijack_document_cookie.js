;(function(){
    if(Object.getOwnPropertyDescriptor(document, 'cookie')){ // chrome
        var _cDescriptor = Object.getOwnPropertyDescriptor(document, 'cookie')
            
        Object.defineProperty(document, 'cookie', {
            value: _cDescriptor.value,
            writable: _cDescriptor.writable,
            enumerable: _cDescriptor.enumerable,
            configurable: _cDescriptor.configurable
        });
    }else if(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(document), 'cookie')){// firefox, IE9/10
        var _cDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(document), 'cookie'),
            _get = _cDescriptor.get || function(){console.log('Error!')},
            _set = _cDescriptor.set || function(){console.log('Error!')};

        Object.defineProperty(document, 'cookie', {
            get: function () {
                console.log('get cookie action!');
                return _get.call(document);
            },
            set: function (value) {
                console.log('set cookie action!');
                return _set.call(document, value);
            },
            enumerable: true,
            configurable: true
        });
    }else if(Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')){// IE11
        var _cDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie'),
            _get = _cDescriptor.get || function(){console.log('Error!')},
            _set = _cDescriptor.set || function(){console.log('Error!')};

        Object.defineProperty(document, 'cookie', {
            get: function () {
                console.log('get cookie action!');
                return _get.call(document);
            },
            set: function (value) {
                console.log('set cookie action!');
                return _set.call(document, value);
            },
            enumerable: true,
            configurable: true
        });
    }
})();
