# Node.js' layered architecture

```
  +---------------------------------------------------+
   |          Module and Application Ecosystem         |
   +---------------------------------------------------+
        |                |            |              |
        |                | +----------------------+  |
        |                | |  Binary Abstraction  |  |
        |                | |        Layer         |  |
        |                | +----------------------+  |
        |                |     |             |       |
   +----------------+    |     |             |       /
   |  Node.js Core  |    |     |             |      /
   |  Library API   |    |     |             |     /
   +----------------+    |     |             |    /
   |     js impl    |    |     |             |   /
   +----------------+    |     |             |  /
            |            |     |             | /
   +--------------------------------------+  |/
   | Node.js Application Binary Interface |  |
   +--------------------------------------|  |
   |              C/C++ impl              |  |
   +--------------------------------------+  |
                      |                      |
        +---------------------------------------+
        | Dependencies: v8, libuv, openssl, etc |
        +---------------------------------------+
```

Node.js currently builds on top of several key dependencies including the V8 JavaScript engine, libuv, openssl and others. The Node.js Application Binary Interface provides access to functionality central to how Node.js operates. The Node.js Core Library is the primary interface through which most Modules and Applications built on top of Node perform I/O operations, manipulate data, access the network, etc. Some modules and applications choose to go beyond the Core Library and bind directly to the Application Binary Interface and dependencies to perform more advanced operations. An optional Binary abstraction layer is used to buffer module and application developers from changes in the Application Binary Interface and Dependencies.