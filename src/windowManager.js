const { BrowserWindow } = require('electron');
const path = require('path');
const uiLogger = require('./utils/uiLogger');

const ANONYMOUS_SESSION_PARTITION = 'anonymous';

// only to be used from main thread
let toolsWindow;
let webWindow;

let singleTweetWindow;
let anonSingleTweetWindow;

let downloaderWindow; // goes invisible

const getToolsWindow = () => toolsWindow;

const getWebWindow = () => webWindow;

const openToolsWindow = () => {
  toolsWindow = new BrowserWindow({
    width: 800,
    height: 900,
    title: 'Tools',
    webPreferences: {
      preload: path.join(__dirname, 'screens', 'ToolsWindow', 'preload.js'),
      sandbox: false,
    },
  });
  toolsWindow.loadFile(path.join(__dirname, 'screens', 'ToolsWindow', 'index.html'));

  uiLogger.init(toolsWindow);
};

const openWebWindow = () => {
  if (!webWindow) {
    webWindow = new BrowserWindow({
      show: true,
      width: 1200,
      height: 900,
      title: 'Twitter',
      webPreferences: {
        // find the way to control DOM of the external page
        sandbox: false,
        preload: path.join(__dirname, 'screens', 'WebWindow', 'preload.js'),
        backgroundThrottling: false,
      },
    });
    webWindow.on('closed', () => (webWindow = null));
    webWindow.loadURL('https://twitter.com/');
    webWindow.webContents.openDevTools();
  }
};

const openSingleTweetWindowInner = (isAnonymous) => {
  let targetWindow = isAnonymous ? anonSingleTweetWindow : singleTweetWindow;
  if (targetWindow) {
    return targetWindow;
  } else {
    targetWindow = new BrowserWindow({
      show: true,
      width: 1200,
      height: 900,
      title: `Twitter parser${isAnonymous ? ' - anonymous' : ''}`,
      webPreferences: {
        // find the way to control DOM of the external page
        sandbox: false,
        preload: path.join(__dirname, 'screens', 'SingleTweetWindow', 'preload.js'),
        backgroundThrottling: false,
        partition: isAnonymous ? ANONYMOUS_SESSION_PARTITION : undefined,
      },
    });
    targetWindow.loadFile(path.join(__dirname, 'screens', 'empty.html'));
    targetWindow.webContents.openDevTools();
    return targetWindow;
    // if (isAnonymous) {
    //   anonSingleTweetWindow = targetWindow;
    // } else {
    //   singleTweetWindow = targetWindow;
    // }
  }
};

const getDownloaderWindow = () => {
  if (!downloaderWindow) {
    downloaderWindow = new BrowserWindow({
      show: false,
      width: 100,
      height: 100,
      title: 'Downloader',
      webPreferences: {
        // find the way to control DOM of the external page
        sandbox: false,
        backgroundThrottling: false,
        partition: ANONYMOUS_SESSION_PARTITION,
      },
    });
    downloaderWindow.loadFile(path.join(__dirname, 'screens', 'empty.html'));
  }
  return downloaderWindow;
};

const closeDownloaderWindow = () => {
  downloaderWindow?.close();
  downloaderWindow = null;
};

const openSingleTweetWindow = () => {
  singleTweetWindow = openSingleTweetWindowInner(false);
  singleTweetWindow.on('closed', () => (singleTweetWindow = null));
};

const openAnonSingleTweetWindow = () => {
  anonSingleTweetWindow = openSingleTweetWindowInner(true);
  anonSingleTweetWindow.on('closed', () => (anonSingleTweetWindow = null));
};

const getSingleTweetWindow = () => {
  if (!singleTweetWindow) {
    openSingleTweetWindow();
  }
  return singleTweetWindow;
};

const getAnonSingleTweetWindow = () => {
  if (!anonSingleTweetWindow) {
    openAnonSingleTweetWindow();
  }
  return anonSingleTweetWindow;
};

module.exports = {
  openWebWindow,
  getWebWindow,
  openToolsWindow,
  getToolsWindow,
  openSingleTweetWindow,
  getSingleTweetWindow,
  openAnonSingleTweetWindow,
  getAnonSingleTweetWindow,
  getDownloaderWindow,
  closeDownloaderWindow,
};
