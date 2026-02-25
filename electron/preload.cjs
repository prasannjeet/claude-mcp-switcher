const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  loadConfig: (filePath) => ipcRenderer.invoke("load-config", filePath),
  toggleServer: (filePath, serverName, enable) =>
    ipcRenderer.invoke("toggle-server", filePath, serverName, enable),
  addServer: (filePath, serverName, serverConfig) =>
    ipcRenderer.invoke("add-server", filePath, serverName, serverConfig),
  updateServer: (filePath, serverName, newConfig) =>
    ipcRenderer.invoke("update-server", filePath, serverName, newConfig),
  deleteServer: (filePath, serverName) =>
    ipcRenderer.invoke("delete-server", filePath, serverName),
  getSystemPaths: () =>
    ipcRenderer.invoke("get-system-paths"),
  checkCommandExists: (command, extraPaths) =>
    ipcRenderer.invoke("check-command-exists", command, extraPaths),
  testServerStdio: (serverConfig, extraPaths) =>
    ipcRenderer.invoke("test-server-stdio", serverConfig, extraPaths),
  testServerHttp: (serverConfig) =>
    ipcRenderer.invoke("test-server-http", serverConfig),
});
