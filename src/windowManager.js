const { BrowserWindow } = require('electron');
const path = require('path');

// only to be used from main thread
let toolsWindow;
let webWindow;

let singleTweetWindow;
let anonSingleTweetWindow;

const setToolsWindow = (window) => {
  toolsWindow = window;
};
const getToolsWindow = () => toolsWindow;

const setWebWindow = (window) => {
  webWindow = window;
};
const getWebWindow = () => webWindow;

const setSingleTweetWindow = (window) => {
  singleTweetWindow = window;
};
const getSingleTweetWindow = () => singleTweetWindow;

const setAnonSingleTweetWindow = (window) => {
  anonSingleTweetWindow = window;
};
const getAnonSingleTweetWindow = () => anonSingleTweetWindow;

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

module.exports = { openWebWindow, getWebWindow };
