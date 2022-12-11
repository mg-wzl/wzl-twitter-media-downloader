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
const { readTweetsListFile, FileType } = require('./src/utils/fileUtils');
const uiLogger = require('./src/utils/uiLogger');
const windowManager = require('./src/windowManager');
const downloadManager = require('./src/downloadManager');
const { scrapedFileNameFromUrl } = require('./src/utils/stringUtils');

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
        const url = webWindow?.webContents?.getURL();
        const targetFileName = scrapedFileNameFromUrl(url);
        webWindow?.send(events.CONTEXT_MENU_SCROLL_AND_SCRAPE_CLICKED, {
          targetFolder: getTargetFolder(),
          url,
          targetFileName,
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
      filters: [{ name: 'Tweet data files', extensions: ['json', 'js', 'txt'] }],
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
      filters: [{ name: 'Tweet data files', extensions: ['json', 'js', 'txt'] }],
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

  ipcMain.handle(events.DOWNLOAD_FROM_DIRECT_LINKS_CLICKED, async () => {
    console.log(events.DOWNLOAD_FROM_DIRECT_LINKS_CLICKED);
    const { tweetsList, fileType } = readTweetsListFile(getFavesFilePath());
    if (fileType === FileType.UNKNOWN) {
      uiLogger.error(`Unknown file format: ${getFavesFilePath()}`, true);
      return;
    }
    if (fileType === FileType.OFFICIAL) {
      uiLogger.info(`Official Twitter likes file loaded: ${getFavesFilePath()}`, true);
      uiLogger.error(
        `Official Twitter likes file can't be used for direct links downlad. Please use "Scan tweet by tweet" command`,
        true
      );
    }
    if (fileType === FileType.PARSED) {
      uiLogger.info(`Parsed tweets file loaded: ${getFavesFilePath()}`, true);
      const downloadTasks = downloadManager.DownloadTask.fromParsedTweetsList(tweetsList);
      console.log('Converted DownloadTasks:', downloadTasks.length);
      for (const task of downloadTasks) {
        if (!downloadManager.isInFinishedDownloads(task.tweetId)) {
          await downloadManager.runDownloads(task);
        } else {
          uiLogger.info(`Skipped (already dowloaded): ${task.url}`, true);
        }
      }
      uiLogger.info('Finished downloading media', true);
      downloadManager.finish();
    }
  });

  ipcMain.handle(events.PARSE_TWEET_BY_TWEET_AND_DOWNLOAD_CLICKED, async () => {
    console.log(events.PARSE_TWEET_BY_TWEET_AND_DOWNLOAD_CLICKED);
    const { tweetsList, fileType } = readTweetsListFile(getFavesFilePath());
    if (fileType === FileType.UNKNOWN) {
      uiLogger.error(`Unknown file format: ${getFavesFilePath()}`, true);
      return;
    }
    if (fileType === FileType.OFFICIAL) {
      uiLogger.info(`Official Twitter likes file loaded: ${getFavesFilePath()}`, true);
      tweetPageParserQueue.addTasks(
        tweetPageParserQueue.TweetPageTask.fromOfficialLikesList(tweetsList)
      );
      tweetPageParserQueue.start();
    }
    if (fileType === FileType.PARSED) {
      uiLogger.info(`Parsed tweets file loaded: ${getFavesFilePath()}`, true);
      tweetPageParserQueue.addTasks(
        tweetPageParserQueue.TweetPageTask.fromParsedTweetsList(tweetsList)
      );
      tweetPageParserQueue.start();
    }
  });

  ipcMain.handle(events.FEED_PAGE_END_REACHED, (event, args) => {
    console.log(events.FEED_PAGE_END_REACHED);
    const { targetFolder, url, targetFileName, lastTweetDate } = args;
    let userHandle;

    if (url) {
      const currentUrl = new URL(url);
      const pathParts = currentUrl.pathname.split('/').filter(Boolean);
      if (
        (pathParts.length === 1 && pathParts[0] !== 'search') ||
        (pathParts.length === 2 && pathParts[1] === 'media')
      ) {
        // if there's only one path part - assuming it's the username
        // if 2 and the last one is "media" - we're on media page
        userHandle = pathParts[0];
      }
    }
    console.log(`Reached the end of the page: ${url} ${userHandle} ${lastTweetDate}`);
    if (userHandle) {
      // try to search for more tweets in search
    }
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
