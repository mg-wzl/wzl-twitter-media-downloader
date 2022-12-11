const { ipcMain, BrowserWindow } = require('electron');
const events = require('./events');
const downloadUtils = require('./utils/downloadUtils');
const fileUtils = require('./utils/fileUtils');
const tweetApiHelper = require('./tweetApiHelper');
const { getTargetFolder } = require('./fileManager');
const { parseTweetUrl, urlFromTweetIdAndUserHandle } = require('./utils/stringUtils');
const uiLogger = require('./utils/uiLogger');
const downloadManager = require('./downloadManager');
const windowManager = require('./windowManager');

class TweetPageTask {
  constructor(url, isProtected, mediaType) {
    this.url = url;
    this.isProtected = isProtected || null;
    this.mediaType = mediaType || null;
    const parsed = parseTweetUrl(url);
    this.tweetId = parsed?.tweetId || '';
  }

  static fromOfficialLikesList = (urlList) => {
    const result = [];
    if (Array.isArray(urlList)) {
      urlList.forEach((url, index) => result.push(new TweetPageTask(url)));
    }
    return result;
  };

  static fromParsedTweetsList = (tweetsList) => {
    const result = [];
    if (Array.isArray(tweetsList)) {
      tweetsList.forEach((tweet, index) => {
        if (tweet?.url)
          result.push(new TweetPageTask(tweet?.url, tweet?.isProtected, tweet?.mediaType));
      });
    }
    return result;
  };
}

const STATUSES = {
  IDLE: 'idle',
  IN_PROGRESS: 'in_progress',
};

let queueStatus = STATUSES.IDLE;
const queue = [];

const addTasks = (tweetPageTasks) => {
  if (tweetPageTasks?.length > 0) {
    queue.push(...tweetPageTasks);
  }
};

// TODO: handle protected
const canStartTask = (task) => {
  if (!task?.tweetId) {
    console.log('Cannot run empty task:', task);
    return false;
  }
  if (task?.mediaType === 'youtube') {
    console.log('Cannot run youtube task:', task);
    return false;
  }
  return true;
};

const getNextTask = () => {
  if (queue?.length === 0) {
    return null;
  }

  let nextTask;
  while (!nextTask && queue?.length > 0) {
    const temp = queue.shift();
    if (canStartTask(temp)) {
      if (downloadManager.isInFinishedDownloads(temp.tweetId)) {
        console.log('Skipping finished task:', temp);
      } else {
        nextTask = temp;
      }
    }
  }
  console.log(nextTask ? `nextTask: ${nextTask}` : 'No tasks to run');
  return nextTask;
};

const startNextTaskOrFinishWork = () => {
  const task = getNextTask();
  if (task) {
    startTask(task);
  } else {
    queueStatus = STATUSES.IDLE;
    ipcMain.removeAllListeners(events.TWEET_PAGE_LOADED);
    ipcMain.removeAllListeners(events.TWEET_FAILED_TO_LOAD);
    ipcMain.removeAllListeners(events.SESSION_GOT_BLOCKED);
    console.log('Finished processing queue');
    downloadManager.finish();
  }
};

const sendTweetTaskToWindow = async (parserWindow, task) => {
  await parserWindow.webContents
    .loadURL(task.url)
    .catch((e) => console.log('Could not load url:', e));
  parserWindow.send(events.WAIT_FOR_TWEET_PAGE_LOAD, task);
};

const startTask = async (task) => {
  console.log('start task', { task });
  // FIRST we need to try external api. This way we can avoid parsing, which is HUGE
  // const parsedTask = parseTweetUrl(task);
  let apiResult;
  if (!task?.isProtected) {
    apiResult = await tweetApiHelper
      .fetchTweetContent(task.tweetId)
      .catch((e) =>
        console.log(
          'Could not get tweet content from API:',
          e?.response?.status,
          e?.response?.statusText
        )
      );
    console.log('API RESULT!!!', { apiResult, mediaFiles: apiResult?.[0].mediaFiles });
  }
  if (apiResult?.length) {
    download(
      new downloadManager.DownloadTask(
        apiResult[0].tweetId,
        apiResult[0].userHandle,
        apiResult[0].url,
        apiResult[0].datetime,
        apiResult[0].mediaFiles
      )
    ); // TODO: change to passing whole array
  } else {
    console.log('Start page scraping:', task);
    // API could not get the tweet data. The tweet might might be protected or the API isn't responding
    const parserWindow = task.isProtected
      ? windowManager.getSingleTweetWindow()
      : windowManager.getAnonSingleTweetWindow();
    sendTweetTaskToWindow(parserWindow, task);

    // TODO: handle cases where the user has no access to tweet
    // TODO: handle cases where the user is suddenly logged out because twitter thinks they're a bot
  }
};

const onTweetPageLoadedHandler = (event, parsedTweet) => {
  download(
    new downloadManager.DownloadTask(
      parsedTweet.tweetId,
      parsedTweet.userHandle,
      parsedTweet.url,
      parsedTweet.datetime,
      parsedTweet.mediaFiles
    )
  );
};

const download = async (parsedTweet) => {
  await downloadManager.runDownloads(parsedTweet);
  startNextTaskOrFinishWork();
};

const onTweetPageLoadFailedAnonymously = (event, { error, task }) => {
  console.log('-- Failed to load tweet anonymously ', task, '---');
  sendTweetTaskToWindow(windowManager.getSingleTweetWindow(), task);
};

const onTweetPageLoadFailedHandler = (event, { error, task }) => {
  console.log('-- Failed to load tweet: ', task, '---');
  const tweetUrl = urlFromTweetIdAndUserHandle(task?.tweetId, task?.userHandle);
  uiLogger.error(`Failed to parse: ${tweetUrl}`);
  fileUtils.appendFailedDownloadsFile(getTargetFolder(), [tweetUrl]);
  // TODO: add to failed.js file
  startNextTaskOrFinishWork();
};

const onSessionGotBlockedHandler = (event, parsedTweet) => {
  console.log(
    "Session is blocked! We can't continue parsing. Wait for 10 minutes or more and try again"
  );
};

const start = async () => {
  if (queue.length == 0) {
    console.log('Queue is empty - nothing to download');
    return;
  }
  if (queueStatus === STATUSES.IN_PROGRESS) {
    console.log("Queue already in progress - can't start");
    return;
  }
  ipcMain.on(events.TWEET_PAGE_LOADED, onTweetPageLoadedHandler);
  ipcMain.on(events.TWEET_FAILED_TO_LOAD, onTweetPageLoadFailedHandler);
  ipcMain.on(events.TWEET_FAILED_TO_LOAD_ANONYMOUSLY, onTweetPageLoadFailedAnonymously);
  ipcMain.on(events.SESSION_GOT_BLOCKED, onSessionGotBlockedHandler);
  queueStatus = STATUSES.IN_PROGRESS;
  console.log('TargetFolder:', getTargetFolder());
  startNextTaskOrFinishWork();
};

module.exports = { start, addTasks, TweetPageTask };
