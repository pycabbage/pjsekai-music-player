const { app, BrowserWindow, Tray, Menu } = require('electron');
var Positioner = require('electron-positioner')
let positioner = null;
let mainWindow = null;
let tray = null;
const dev = process.argv.indexOf("--dev") != -1;
let autohide = true;

app.on('ready', () => {
    iconPath = __dirname + "/icon.png"
    mainWindow = new BrowserWindow({
        width: 360,
        height: 480,
        icon: iconPath,
        frame: false,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        alwaysOnTop: true,
        minimizable: false,
        maximizable: false,
        show: dev || !autohide,
        webPreferences: {
            webSecurity: false,
            nodeIntegration: false,
            contextIsolation: true,
            worldSafeExecuteJavaScript: true
        }
    });
    positioner = new Positioner(mainWindow)
    positioner.move('bottomRight')
    mainWindow.getBounds
    if (dev) {
        mainWindow.loadURL('http://localhost:3000/');
        mainWindow.openDevTools();
    } else {
        mainWindow.loadFile('./build/index.html');
    }
    mainWindow.on('closed', () => {
        mainWindow = null
    });
    tray = new Tray(iconPath);
    tray.setToolTip("pjsekai music player.")

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Autohide',
            type: "checkbox",
            checked: autohide,
            click(menuItem) {
                autohide = menuItem.checked
                if (!autohide) mainWindow.show()
            }
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            role: "close",
            accelerator: "Q",
            click(menuItem) {
                app.quit();
            }
        }
    ])
    tray.setContextMenu(contextMenu)

    if (!dev) {
        mainWindow.on("blur", () => !autohide || mainWindow.hide())
        tray.on("click", () => mainWindow.show())
    }
});