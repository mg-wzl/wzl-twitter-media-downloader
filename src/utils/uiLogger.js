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

const success = (msg, repeatInConsole) => {
  sendMessage(LogLevel.SUCCESS, msg);
  if (repeatInConsole) {
    console.log(msg);
  }
};

const error = (msg, repeatInConsole) => {
  sendMessage(LogLevel.ERROR, msg);
  if (repeatInConsole) {
    console.error(msg);
  }
};

const warn = (msg, repeatInConsole) => {
  sendMessage(LogLevel.WARNING, msg);
  if (repeatInConsole) {
    console.warn(msg);
  }
};

const info = (msg, repeatInConsole) => {
  sendMessage(LogLevel.INFO, msg);
  if (repeatInConsole) {
    console.info(msg);
  }
};

module.exports = {
  init,
  LoggerEvent,
  LogLevel,
  success,
  error,
  warn,
  info,
};
