# Node.js 调试

1. 安装 Chrome 插件 [NIM(Node.js 调试管理工具)](https://chrome.google.com/webstore/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj)

2. 启动 Inspector

两种方式可选：

- 使用 `--inspect` 选项

- 向 Node 进程发送 `SIGUSR1` 信号: `kill -s SIGUSR1 ${pid}` （适用于 cluster 模式下）

[Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)