const { app, dialog, ipcMain, session } = require('electron');

const contextMenu = require('electron-context-menu');
const electronDl = require('electron-dl');

const events = require('./src/events');
const tweetPageParserQueue = require('./src/tweetPageParserQueue');
const {
  setTargetFolder,
  getTargetFolder,
  setFavesFilePath,
  getFavesFilePath,
} = require('./src/fileManager');
const { readOfficialLikesFile } = require('./src/utils/fileUtils');
const uiLogger = require('./src/utils/uiLogger');
const windowManager = require('./src/windowManager');

electronDl();

contextMenu({
  showSaveImageAs: true,
  showCopyLink: true,
  prepend: (defaultActions, parameters, browserWindow) => [
    {
      label: 'Scan for media links',
      visible: browserWindow?.id === windowManager?.getWebWindow()?.id,
      click: () => {
        const webWindow = windowManager?.getWebWindow();
        webWindow?.send(events.CONTEXT_MENU_SCROLL_AND_SCRAPE_CLICKED, {
          targetFolder: getTargetFolder(),
          url: webWindow?.webContents?.getURL(),
        });
      },
    },
    {
      label: 'Stop scanning',
      visible: browserWindow?.id === windowManager?.getWebWindow()?.id,
      click: () => {
        const webWindow = windowManager?.getWebWindow();
        webWindow?.send(events.CONTEXT_MENU_STOP_SCRAPING);
      },
    },
  ],
});

const setupHandlers = () => {
  ipcMain.handle(events.PICK_TARGET_FOLDER_CLICKED, async () => {
    console.log(events.PICK_TARGET_FOLDER_CLICKED);
    const { canceled, filePaths } = await dialog.showOpenDialog(windowManager?.getToolsWindow(), {
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
    const { canceled, filePaths } = await dialog.showOpenDialog(windowManager?.getToolsWindow(), {
      properties: ['openFile'],
    });
    console.log('Faves file: ', { canceled, filePaths });
    if (canceled) {
      return;
    } else {
      setFavesFilePath(filePaths[0]);
      return filePaths[0];
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
    console.log(events.DOWNLOAD_FAVES_CLICKED);
    const favesList = readOfficialLikesFile(getFavesFilePath());
    tweetPageParserQueue.addTasks(
      tweetPageParserQueue.TweetPageTask.fromOfficialLikesList(favesList)
    );
    tweetPageParserQueue.start();
  });
};

const createWindow = () => {
  windowManager.openToolsWindow();
  setupHandlers();

  // TODO: why it throws an error?
  // app.on('activate', () => {
  //   if (BrowserWindow.getAllWindows().length === 0) {
  //     createWindow();
  //   }
  // });
};

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
