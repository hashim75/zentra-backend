const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Simplifies communication for offline logic
    },
    // icon: path.join(__dirname, 'favicon.ico') 
  });

  // Check if we are in Dev mode or Production
  const isDev = !app.isPackaged;

  // Vite default port is 5173
  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  win.loadURL(startUrl);
  
  // Open DevTools in dev mode
  if (isDev) {
    // win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});