const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  version: '2.1.0',
  
  storage: {
    saveClient: (client) => ipcRenderer.invoke('storage:saveClient', client),
    loadClient: (cpf) => ipcRenderer.invoke('storage:loadClient', cpf),
    loadAllClients: () => ipcRenderer.invoke('storage:loadAllClients'),
    deleteClient: (cpf) => ipcRenderer.invoke('storage:deleteClient', cpf),
    
    saveRegistro: (registro) => ipcRenderer.invoke('storage:saveRegistro', registro),
    loadRegistrosByDate: (year, month, day) => ipcRenderer.invoke('storage:loadRegistrosByDate', year, month, day),
    loadAllRegistros: () => ipcRenderer.invoke('storage:loadAllRegistros'),
    getOrganizedStructure: () => ipcRenderer.invoke('storage:getOrganizedStructure'),
    
    getStoragePath: () => ipcRenderer.invoke('storage:getStoragePath')
  }
});
