const { contextBridge, ipcRenderer } = require('electron');
const events = require('../../events');
const { LoggerEvent, LogLevel } = require('../../utils/uiLogger');

contextBridge.exposeInMainWorld('on', {
  pickTargetFolderClicked: () => {
    return ipcRenderer.invoke(events.PICK_TARGET_FOLDER_CLICKED);
  },
  pickFavesFileClicked: () => {
    return ipcRenderer.invoke(events.PICK_FAVES_FILE_CLICKED);
  },
  clearCookiesClicked: () => {
    return ipcRenderer.invoke(events.CLEAR_COOKIES_CLICKED);
  },
  clearLogClicked: () => {
    document.getElementById('logContainer').innerHTML = '';
  },
  downloadFavesClicked: () => {
    return ipcRenderer.invoke(events.DOWNLOAD_FAVES_CLICKED);
  },
  twitterLoginClicked: () => {
    return ipcRenderer.invoke(events.OPEN_TWITTER_WINDOW_CLICKED);
  },
});

ipcRenderer.on(LoggerEvent.NEW_MESSAGE, (event, args) => {
  const logElement = document.createElement('p');
  switch (args.logLevel) {
    case LogLevel.SUCCESS:
      logElement.className = 'logSuccess';
      break;
    case LogLevel.ERROR:
      logElement.className = 'logError';
      break;
    case LogLevel.WARNING:
      logElement.className = 'logWarning';
      break;
  }
  logElement.innerHTML += `<b>${args.timestamp} =></b> ${args.message}`;
  const logContainer = document.getElementById('logContainer');
  logContainer.appendChild(logElement);
  logContainer.scrollBy({ top: 100 });
});
