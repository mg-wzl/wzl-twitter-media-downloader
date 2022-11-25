const { app, BrowserWindow, dialog, ipcMain, session } = require('electron');
const path = require('path');
const os = require('os');
const events = require('./src/events');
const downloadManager = require('./src/downloadManager');
const electronDl = require('electron-dl');
const { readFavesFile } = require('./src/fileUtils');

electronDl();

let toolsWindow;
let webWindow;

let favesFilePath = path.join(os.homedir(), 'Documents', 'scraping', 'like.js');

const setupHandlers = (toolsWindow) => {
  ipcMain.handle(events.PICK_TARGET_FOLDER_CLICKED, async () => {
    console.log(events.PICK_TARGET_FOLDER_CLICKED);
    const { canceled, filePaths } = await dialog.showOpenDialog(toolsWindow, {
      properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
    });
    console.log('Target folder: ', { canceled, filePaths });
    if (canceled) {
      return;
    } else {
      downloadManager.setTargetFolder(filePaths[0]);
      return filePaths[0];
    }
  });

  ipcMain.handle(events.PICK_FAVES_FILE_CLICKED, async () => {
    console.log(events.PICK_FAVES_FILE_CLICKED);
    const { canceled, filePaths } = await dialog.showOpenDialog(toolsWindow, {
      properties: ['openFile'],
    });
    console.log('Faves file: ', { canceled, filePaths });
    if (canceled) {
      return;
    } else {
      favesFilePath = filePaths[0];
      return favesFilePath;
    }
  });

  ipcMain.handle(events.CLEAR_COOKIES_CLICKED, async () => {
    console.log(events.CLEAR_COOKIES_CLICKED);
    session.defaultSession.clearStorageData([], (data) => {
      console.log('Cleared cookies:', data);
    });
  });

  ipcMain.handle(events.TWITTER_LOGIN_CLICKED, async () => {
    console.log(events.TWITTER_LOGIN_CLICKED);
    const twitterLoginWindow = new BrowserWindow({
      width: 800,
      height: 900,
      title: 'Twitter login',
      webPreferences: {
        sandbox: true,
      },
    });
    twitterLoginWindow.loadURL('https://twitter.com');
  });

  ipcMain.handle(events.DOWNLOAD_FAVES_CLICKED, async () => {
    console.log(events.DOWNLOAD_FAVES_CLICKED);
    const favesList = readFavesFile(favesFilePath);
    downloadManager.addTasks(favesList);
    downloadManager.start(webWindow);
  });
};

const createWindow = () => {
  toolsWindow = new BrowserWindow({
    width: 500,
    height: 600,
    title: 'Tools',
    webPreferences: {
      preload: path.join(__dirname, 'screens', 'ToolsWindow', 'preload.js'),
      sandbox: false,
    },
  });

  setupHandlers();

  // TODO: why it throws an error?
  // app.on('activate', () => {
  //   if (BrowserWindow.getAllWindows().length === 0) {
  //     createWindow();
  //   }
  // });

  toolsWindow.loadFile(path.join(__dirname, 'screens', 'ToolsWindow', 'index.html'));

  webWindow = new BrowserWindow({
    show: true,
    width: 1000,
    height: 800,
    title: 'Twitter',
    webPreferences: {
      // find the way to control DOM of the external page
      sandbox: false,
      preload: path.join(__dirname, 'screens', 'TweetDownloadWindow', 'preload.js'),
    },
  });
  webWindow.loadURL('https://twitter.com');
  webWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});