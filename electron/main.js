const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const StorageBackend = require('./storage-backend');

let mainWindow;
let storage;

function createWindow() {
  const iconPath = path.join(__dirname, 'icon.png');
  const fs = require('fs');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true
    },
    backgroundColor: '#f1f5f9',
    show: false
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const menuTemplate = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Recarregar',
          accelerator: 'F5',
          click: () => {
            mainWindow.reload();
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'selectAll', label: 'Selecionar Tudo' }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'resetZoom', label: 'Zoom Normal' },
        { role: 'zoomIn', label: 'Aumentar Zoom' },
        { role: 'zoomOut', label: 'Diminuir Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia' }
      ]
    },
    {
      label: 'Ferramentas',
      submenu: [
        {
          label: 'Ferramentas do Desenvolvedor',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre',
              message: 'Gestão de Bicicletário',
              detail: 'Versão 2.1.0\n\nSistema de gerenciamento de bicicletário\n\nBICICLETARIO SHOP. BOULEVARD V.V.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  storage = new StorageBackend();
  setupIPCHandlers();
  createWindow();
});

function setupIPCHandlers() {
  ipcMain.handle('storage:saveClient', (event, client) => {
    return storage.saveClient(client);
  });

  ipcMain.handle('storage:loadClient', (event, cpf) => {
    return storage.loadClient(cpf);
  });

  ipcMain.handle('storage:loadAllClients', () => {
    return storage.loadAllClients();
  });

  ipcMain.handle('storage:deleteClient', (event, cpf) => {
    return storage.deleteClient(cpf);
  });

  ipcMain.handle('storage:saveRegistro', (event, registro) => {
    return storage.saveRegistro(registro);
  });

  ipcMain.handle('storage:loadRegistrosByDate', (event, year, month, day) => {
    return storage.loadRegistrosByDate(year, month, day);
  });

  ipcMain.handle('storage:loadAllRegistros', () => {
    return storage.loadAllRegistros();
  });

  ipcMain.handle('storage:getOrganizedStructure', () => {
    return storage.getOrganizedStructure();
  });

  ipcMain.handle('storage:getStoragePath', () => {
    return storage.getStoragePath();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
