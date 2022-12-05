const events = require('./events');
const downloadUtils = require('./utils/downloadUtils');
const stringUtils = require('./utils/stringUtils');
const fileUtils = require('./utils/fileUtils');
const { getTargetFolder } = require('./fileManager');
const uiLogger = require('./utils/uiLogger');

const MAX_BUFFER_SIZE = 15; // will wait until this number of downloads is complete before updating service files

let finishedDownloads = [];
let finishedDownloadsBuffer = [];

class DownloadTask {
  constructor(tweetId, userHandle, datetime, mediaFiles) {
    this.tweetId = tweetId;
    this.userHandle = userHandle;
    this.datetime = datetime;
    this.mediaFiles = mediaFiles;
  }

  static fromParsedTweetsList(parsedTweets) {
    const result = [];
    if (Array.isArray(parsedTweets)) {
      const tweetsWithMedia = parsedTweets.filter(
        (tweet) => tweet?.media && (tweet?.media?.images || tweet?.media?.video)
      );
      tweetsWithMedia.forEach((tweet) => {
        const mediaFiles = [];
        if (tweet?.media?.images?.length) {
          tweet?.media?.images.forEach((url) => {
            if (url) {
              mediaFiles.push({ url, extension: stringUtils.getFileExtensionFromUrl(url) });
            }
          });
        }
        if (tweet?.media?.video?.src) {
          mediaFiles.push({
            url: tweet?.media?.video?.src,
            extension: stringUtils.getFileExtensionFromUrl(tweet?.media?.video?.srcl),
          });
        }
        const task = new DownloadTask(tweet.tweetId, tweet.userHandle, tweet.datetime, mediaFiles);
        result.push(task);
      });
    }
    return result;
  }
}

const isInFinishedDownloads = (tweetId) => {
  if (finishedDownloads?.length === 0 && finishedDownloadsBuffer.length === 0) {
    finishedDownloads = fileUtils.readFinishedDownloadsFile(getTargetFolder());
  }
  return finishedDownloads.includes(tweetId) || finishedDownloadsBuffer.includes(tweetId);
};

// TODO; change to supporting array of parsed tweets
// parsedTweet must have: mediaFiles: [{url, extension}]
const runDownloads = async (downloadTask) => {
  console.log('runDownloads()', events.TWEET_PAGE_LOADED);
  const tweetUrl = stringUtils.urlFromTweetIdAndUserHandle(
    downloadTask?.tweetId,
    downloadTask?.userHandle
  );
  const noFailedDownloads = await downloadUtils.downloadTweetImages(
    downloadTask,
    getTargetFolder()
  );
  if (noFailedDownloads) {
    finishedDownloadsBuffer.push(downloadTask.tweetId);
    uiLogger.success(
      `#${finishedDownloads.length + finishedDownloadsBuffer.length} Downloaded: ${tweetUrl}`
    );
    if (finishedDownloadsBuffer.length >= MAX_BUFFER_SIZE) {
      finishedDownloads.push(...finishedDownloadsBuffer);
      finishedDownloadsBuffer = [];
      fileUtils.rewriteFinishedDownloadsFile(getTargetFolder(), finishedDownloads);
    }
    // finishedDownloads?.push(parsedTweet.tweetId);
    // fileUtils.rewriteFinishedDownloadsFile(getTargetFolder(), finishedDownloads);
  } else {
    uiLogger.error(`Failed to load: ${tweetUrl}`);
    fileUtils.appendFailedDownloadsFile(getTargetFolder(), [tweetUrl]);
  }
  console.log('Tweet media loaded!');
};

module.exports = {
  isInFinishedDownloads,
  runDownloads,
  DownloadTask,
};
