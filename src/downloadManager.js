const events = require('./events');
const downloadUtils = require('./utils/downloadUtils');
const stringUtils = require('./utils/stringUtils');
const fileUtils = require('./utils/fileUtils');
const { getTargetFolder } = require('./fileManager');
const uiLogger = require('./utils/uiLogger');

const MAX_BUFFER_SIZE = 15; // will wait until this number of downloads is complete before updating service files

let finishedDownloads = [];
let finishedDownloadsBuffer = [];

const isInFinishedDownloads = (tweetId) => {
  if (finishedDownloads?.length === 0 && finishedDownloadsBuffer.length === 0) {
    finishedDownloads = fileUtils.readFinishedDownloadsFile(getTargetFolder());
  }
  return finishedDownloads.includes(tweetId) || finishedDownloadsBuffer.includes(tweetId);
};

// TODO; change to supporting array of parsed tweets
const runDownloads = async (parsedTweet) => {
  console.log('runDownloads()', events.TWEET_PAGE_LOADED);
  const tweetUrl = stringUtils.urlFromTweetIdAndUserHandle(
    parsedTweet?.tweetId,
    parsedTweet?.userHandle
  );
  const noFailedDownloads = await downloadUtils.downloadTweetImages(parsedTweet, getTargetFolder());
  if (noFailedDownloads) {
    finishedDownloadsBuffer.push(parsedTweet.tweetId);
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
};
