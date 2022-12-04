const { app, BrowserWindow, dialog, ipcMain, session } = require('electron');
const path = require('path');
const os = require('os');

const contextMenu = require('electron-context-menu');
const electronDl = require('electron-dl');

const events = require('./src/events');
const downloadManager = require('./src/downloadManager');
const { setTargetFolder, getTargetFolder } = require('./src/fileManager');
const { readFavesFile } = require('./src/utils/fileUtils');
const uiLogger = require('./src/utils/uiLogger');
const windowManager = require('./src/windowManager');

electronDl();

contextMenu({
  showSaveImageAs: true,
  showCopyLink: true,
  prepend: (defaultActions, parameters, browserWindow) => [
    {
      label: 'Scroll to bottom',
      visible: browserWindow?.id === windowManager?.getWebWindow()?.id,
      click: () => {
        const webWindow = windowManager?.getWebWindow();
        webWindow?.send(events.CONTEXT_MENU_SCROLL_AND_SCRAPE_CLICKED, {
          targetFolder: getTargetFolder(),
          url: webWindow?.webContents?.getURL(),
        });
      },
    },
  ],
});

let toolsWindow;

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
      setTargetFolder(filePaths[0]);
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
    session.defaultSession.clearStorageData([]).then(() => {
      console.log('Cleared cookies');
    });
  });

  ipcMain.handle(events.OPEN_TWITTER_WINDOW_CLICKED, async () => {
    console.log(events.OPEN_TWITTER_WINDOW_CLICKED);
    windowManager.openWebWindow();
  });

  ipcMain.handle(events.DOWNLOAD_FAVES_CLICKED, async () => {
    windowManager.openWebWindow();
    console.log(events.DOWNLOAD_FAVES_CLICKED);
    const favesList = readFavesFile(favesFilePath);
    downloadManager.addTasks(favesList);
    downloadManager.start(windowManager.getWebWindow());
  });
};

const createWindow = () => {
  toolsWindow = new BrowserWindow({
    width: 800,
    height: 900,
    title: 'Tools',
    webPreferences: {
      preload: path.join(__dirname, 'src', 'screens', 'ToolsWindow', 'preload.js'),
      sandbox: false,
    },
  });

  uiLogger.init(toolsWindow);
  setupHandlers();

  // TODO: why it throws an error?
  // app.on('activate', () => {
  //   if (BrowserWindow.getAllWindows().length === 0) {
  //     createWindow();
  //   }
  // });

  toolsWindow.loadFile(path.join(__dirname, 'src', 'screens', 'ToolsWindow', 'index.html'));
};

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
