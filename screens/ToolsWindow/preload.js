const { contextBridge, ipcRenderer } = require('electron');
const events = require('../../src/events'); // Why can't I import the events object???

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
  downloadFavesClicked: () => {
    return ipcRenderer.invoke(events.DOWNLOAD_FAVES_CLICKED);
  },
  twitterLoginClicked: () => {
    console.log('on.twitterLoginClicked');
    return ipcRenderer.invoke(events.TWITTER_LOGIN_CLICKED);
  },
});
