const dayjs = require('dayjs');
const { ipcMain, ipcRenderer } = require('electron');

const LoggerEvent = { NEW_MESSAGE: 'uiLog:newMsg' };
const LogLevel = { SUCCESS: 'success', ERROR: 'error', WARNING: 'warning' };

let loggerWindow;

const init = (window) => {
  loggerWindow = window;
  ipcMain.on(LoggerEvent.NEW_MESSAGE, (event, args) =>
    loggerWindow.send(LoggerEvent.NEW_MESSAGE, args)
  );
};

const success = (msg) => {
  const timestamp = `${dayjs().format('HH:mm:ss SSS')}`;
  ipcRenderer.send(LoggerEvent.NEW_MESSAGE, {
    message: msg || '',
    timestamp,
    logLevel: LogLevel.SUCCESS,
  });
};

module.exports = {
  init,
  LoggerEvent,
  LogLevel,
  success,
};
