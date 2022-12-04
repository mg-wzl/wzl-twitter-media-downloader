const { BrowserWindow } = require('electron');
const path = require('path');
const uiLogger = require('./utils/uiLogger');

const ANONYMOUS_SESSION_PARTITION = 'anonymous';

// only to be used from main thread
let toolsWindow;
let webWindow;

let singleTweetWindow;
let anonSingleTweetWindow;

const getToolsWindow = () => toolsWindow;

const getWebWindow = () => webWindow;

const getSingleTweetWindow = () => singleTweetWindow;

const getAnonSingleTweetWindow = () => anonSingleTweetWindow;

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
  if (!targetWindow) {
    targetWindow = new BrowserWindow({
      show: true,
      width: 1200,
      height: 900,
      title: 'Twitter',
      webPreferences: {
        // find the way to control DOM of the external page
        sandbox: false,
        preload: path.join(__dirname, 'screens', 'SingleTweetWindow', 'preload.js'),
        backgroundThrottling: false,
        partition: isAnonymous ? ANONYMOUS_SESSION_PARTITION : undefined,
      },
    });
    targetWindow.loadFile(path.join(__dirname, 'screens', 'SingleTweetWindow', 'index.html'));
    targetWindow.on('closed', () => (targetWindow = null));
    targetWindow.webContents.openDevTools();
    if (isAnonymous) {
      anonSingleTweetWindow = targetWindow;
    } else {
      singleTweetWindow = targetWindow;
    }
  }
};

const openSingleTweetWindow = () => {
  openSingleTweetWindowInner(false);
};

const openAnonSingleTweetWindow = () => {
  openSingleTweetWindowInner(true);
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
};
