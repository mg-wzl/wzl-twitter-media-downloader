const { BrowserWindow } = require('electron');
const path = require('path');
const { download } = require('electron-dl');

const downloadImage = async (webContents, url, name, extension, targetFolder) => {
  console.log('Download image()', { url, name, extension, targetFolder });
  const win = BrowserWindow.getAllWindows();
  const filename = `${name}.${extension}`;

  const result = await download(win?.[0], url, {
    directory: targetFolder,
    filename,
    onProgress: (progress) =>
      console.log(`${filename}: ${progress.transferredBytes}/${progress.totalBytes} bytes`),
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
    fileName += `_${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;
  }
  if (tweetContent.origName) {
    fileName += `_${tweetContent.origName}`;
  } else {
    fileName += `_${Number(index) + 1}`;
  }
  return fileName;
};

const downloadTweetImages = async (webContents, tweetContent, targetFolder) => {
  console.log('Download images', { tweetContent, targetFolder });
  let noFailedDownloads = false;
  if (tweetContent.images) {
    noFailedDownloads = true;
    for (const i in tweetContent.images) {
      const image = tweetContent.images[i];
      if (image && image.url && image.extension) {
        let fileName = getFileName(tweetContent, image, i);
        const isCompleted = await downloadImage(
          webContents,
          image.url,
          fileName,
          image.extension,
          targetFolder
        );
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
