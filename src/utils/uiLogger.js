const dayjs = require('dayjs');
const { ipcMain, ipcRenderer } = require('electron');

const LoggerEvent = { NEW_MESSAGE: 'uiLog:newMsg' };
const LogLevel = { SUCCESS: 'success', ERROR: 'error', WARNING: 'warning', INFO: 'info' };

let loggerWindow;

const init = (window) => {
  loggerWindow = window;
  ipcMain.on(LoggerEvent.NEW_MESSAGE, (event, args) =>
    loggerWindow.send(LoggerEvent.NEW_MESSAGE, args)
  );
};

const sendMessage = (logLevel, msg) => {
  const timestamp = `${dayjs().format('HH:mm:ss SSS')}`;
  if (ipcMain) {
    loggerWindow.send(LoggerEvent.NEW_MESSAGE, {
      message: msg || '',
      timestamp,
      logLevel: logLevel,
    });
  } else {
    ipcRenderer?.send(LoggerEvent.NEW_MESSAGE, {
      message: msg || '',
      timestamp,
      logLevel: logLevel,
    });
  }
};

const success = (msg) => {
  sendMessage(LogLevel.SUCCESS, msg);
};

const error = (msg) => {
  sendMessage(LogLevel.ERROR, msg);
};

const warning = (msg) => {
  sendMessage(LogLevel.WARNING, msg);
};

const info = (msg) => {
  sendMessage(LogLevel.INFO, msg);
};

module.exports = {
  init,
  LoggerEvent,
  LogLevel,
  success,
  error,
  warning,
  info,
};
