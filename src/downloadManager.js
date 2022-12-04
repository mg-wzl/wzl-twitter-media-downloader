const events = require('./events');
const downloadUtils = require('./utils/downloadUtils');
const fileUtils = require('./utils/fileUtils');
const { getTargetFolder } = require('./fileManager');

let finishedDownloads = [];

const isInFinishedDownloads = (tweetId) => {
  finishedDownloads = fileUtils.readFinishedDownloadsFile(getTargetFolder());
  return finishedDownloads.includes(tweetId);
};

// TODO; change to supporting array of parsed tweets
const runDownloads = async (parsedTweet) => {
  console.log('MAIN RECEIVED', events.TWEET_PAGE_LOADED);
  console.log('MAIN RECEIVED parsed Tweet:', parsedTweet);
  const noFailedDownloads = await downloadUtils.downloadTweetImages(parsedTweet, getTargetFolder());
  if (noFailedDownloads) {
    finishedDownloads?.push(parsedTweet.tweetId);
    fileUtils.rewriteFinishedDownloadsFile(getTargetFolder(), finishedDownloads);
  }
  console.log('Tweet media loaded!');
};

module.exports = {
  isInFinishedDownloads,
  runDownloads,
};
