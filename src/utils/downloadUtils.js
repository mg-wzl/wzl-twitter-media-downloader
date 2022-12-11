const { BrowserWindow } = require('electron');
const path = require('path');
const { download } = require('electron-dl');
const windowManager = require('../windowManager');
const uiLogger = require('./uiLogger');

const downloadImage = async (url, name, extension, targetFolder) => {
  // console.log('Download image()', { url, name, extension, targetFolder });
  const win = windowManager.getDownloaderWindow();
  const filename = `${name}.${extension}`;

  const result = await download(win, url, {
    directory: targetFolder,
    filename,
    onProgress: (progress) =>
      console.log(`${filename}: ${progress.transferredBytes}/${progress.totalBytes} bytes`),
  }).catch((error) => {
    uiLogger.error(error);
  });
  if (result?.getState() === 'completed') {
    return true;
  } else {
    return false;
  }
};

const getFileName = (tweetContent, image, index) => {
  let fileName = '' + tweetContent.userHandle;
  const date = tweetContent.datetime ? new Date(tweetContent.datetime) : null;
  fileName += `_${tweetContent.tweetId}`;
  if (date) {
    fileName += `_${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
      date.getDate()
    ).padStart(2, '0')}`;
  }
  if (tweetContent.origName) {
    fileName += `_${tweetContent.origName}`;
  } else {
    fileName += `_${Number(index) + 1}`;
  }
  return fileName;
};

// tweetContent must have: mediaFiles: [{url, extension}]
const downloadTweetImages = async (tweetContent, targetFolder) => {
  console.log('Download media files', { mediaFiles: tweetContent?.mediaFiles, targetFolder });
  let noFailedDownloads = false;
  if (tweetContent.mediaFiles) {
    noFailedDownloads = true;
    for (const i in tweetContent.mediaFiles) {
      const image = tweetContent.mediaFiles[i];
      if (image && image.url && image.extension) {
        let fileName = getFileName(tweetContent, image, i);
        const isCompleted = await downloadImage(image.url, fileName, image.extension, targetFolder);
        console.log('image download RESULT:', { url: image.url, result: isCompleted });
        if (!isCompleted) {
          noFailedDownloads = false;
        }
      } else {
        console.log('Cannot download file: not enough data:', { image });
        noFailedDownloads = false;
      }
    }
  }
  return noFailedDownloads;
};

module.exports = {
  downloadTweetImages,
};
