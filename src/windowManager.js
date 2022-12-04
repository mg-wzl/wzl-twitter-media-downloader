const { BrowserWindow } = require('electron');
const path = require('path');
const uiLogger = require('./utils/uiLogger');

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

module.exports = { openWebWindow, getWebWindow, openToolsWindow, getToolsWindow };
