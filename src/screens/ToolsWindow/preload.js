const { contextBridge, ipcRenderer } = require('electron');
const events = require('../../events'); // Why can't I import the events object???

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
    return ipcRenderer.invoke(events.OPEN_TWITTER_WINDOW_CLICKED);
  },
});
