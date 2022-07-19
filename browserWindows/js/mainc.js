const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    startDanMuConfig: (data) => ipcRenderer.send('startDanMuConfig', data)
})