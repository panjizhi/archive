# Node.js 调试

## 安装 Chrome 插件 [NIM(Node.js 调试管理工具)](https://chrome.google.com/webstore/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj)

## 启动 Inspector

两种方式可选：

- 使用 `--inspect` 选项

- 向 Node 进程发送 `SIGUSR1` 信号: `kill -s SIGUSR1 ${pid}` （非常适合 cluster 模式下指定具体的进程）

[Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)