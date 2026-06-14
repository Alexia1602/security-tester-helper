const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Importăm backend-ul tău existent pentru a rula în interiorul aplicației desktop
// Presupunem că serverul tău este în folderul /backend/server.js
require('./backend/server.js'); 

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 850,
        backgroundColor: '#000000', // Păstrăm tema neagră
        title: "Security IAST Audit Suite",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // În dezvoltare, încărcăm URL-ul de la Vite
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // <--- Adaugă asta temporar

    // Scoatem meniul standard pentru un aspect mai "pro"
    mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

// =========================================================================
// 🔍 FUNCȚIA NOUĂ: Selector de fișiere pentru aplicația victimă
// =========================================================================
ipcMain.handle('open-victim-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Selectează folderul aplicației victima pentru scanare'
    });
    
    if (result.canceled) return null;
    
    const folderPath = result.filePaths[0];
    const appJsPath = path.join(folderPath, 'app.js');

    // Citim codul sursă al victimei pentru analiza IAST
    if (fs.existsSync(appJsPath)) {
        const sourceCode = fs.readFileSync(appJsPath, 'utf8');
        return { path: folderPath, code: sourceCode };
    }
    
    return { path: folderPath, code: "app.js negăsit în folder." };
});