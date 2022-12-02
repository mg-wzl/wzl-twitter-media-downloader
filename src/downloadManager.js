const { ipcMain, BrowserWindow } = require('electron');
const events = require('./events');
const downloadUtils = require('./utils/downloadUtils');
const parser = require('./parser');
const fileUtils = require('./utils/fileUtils');
const tweetApiHelper = require('./tweetApiHelper');
const { getTargetFolder } = require('./fileManager');

const STATUSES = {
  IDLE: 'idle',
  IN_PROGRESS: 'in_progress',
};

let __win;

let queueStatus = STATUSES.IDLE;
const queue = [];

let finishedDownloads = [];

const addTasks = (tweetsToDownload) => {
  if (tweetsToDownload?.length > 0) {
    queue.push(...tweetsToDownload);
  }
};

const getNextTask = () => {
  if (queue?.length === 0) {
    return null;
  }

  finishedDownloads = fileUtils.readFinishedDownloadsFile(getTargetFolder());
  let nextTask;
  while (!nextTask && queue?.length > 0) {
    const temp = queue.shift();
    const parsedTask = parser.parseTweetUrl(temp);
    if (parsedTask?.tweetId) {
      if (finishedDownloads.includes(parsedTask.tweetId)) {
        console.log('Skipping task:', temp);
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
    startTask(__win, task);
  } else {
    queueStatus = STATUSES.IDLE;
    ipcMain.removeAllListeners(events.TWEET_PAGE_LOADED);
    ipcMain.removeAllListeners(events.TWEET_FAILED_TO_LOAD);
    ipcMain.removeAllListeners(events.SESSION_GOT_BLOCKED);
    console.log('Finished processing queue');
  }
};

// TODO; change to supporting array of parsed tweets
const runDownloads = async (parsedTweet) => {
  console.log('MAIN RECEIVED', events.TWEET_PAGE_LOADED);
  console.log('MAIN RECEIVED parsed Tweet:', parsedTweet);
  const noFailedDownloads = await downloadUtils.downloadTweetImages(
    __win.webContents,
    parsedTweet,
    getTargetFolder()
  );
  if (noFailedDownloads) {
    finishedDownloads?.push(parsedTweet.tweetId);
    fileUtils.rewriteFinishedDownloadsFile(getTargetFolder(), finishedDownloads);
  }
  console.log('Tweet media loaded!');
  startNextTaskOrFinishWork();
};

const startTask = async (win, task) => {
  console.log('start task', { task });
  // FIRST we need to try external api. This way we can avoid parsing, which is HUGE
  const parsedTask = parser.parseTweetUrl(task);
  const apiResult = await tweetApiHelper
    .fetchTweetContent(parsedTask.tweetId)
    .catch((e) =>
      console.log(
        'Could not get tweet content from API:',
        e?.response?.status,
        e?.response?.statusText
      )
    );
  console.log('API RESULT!!!', { apiResult, images: apiResult?.[0].images });
  if (apiResult?.length) {
    runDownloads(apiResult[0]); // TODO: change to passing whole array
  } else {
    console.log('Start page scraping:', task);
    // API could not get the tweet data. The tweet might might be protected or the API isn't responding
    await __win.webContents.loadURL(task).catch((e) => console.log('Could not load url:', e));
    __win.send(events.WAIT_FOR_TWEET_PAGE_LOAD, task);
    // TODO: handle cases where the user has no access to tweet
    // TODO: handle cases where the user is suddenly logged out because twitter thinks they're a bot
  }
};

const onTweetPageLoadedHandler = (event, parsedTweet) => {
  runDownloads(parsedTweet);
};

const onTweetPageLoadFailedHandler = (event, parsedTweet) => {
  console.log('-- Failed to load tweet: ', parsedTweet, '---');
  // TODO: add to failed.js file
  startNextTaskOrFinishWork();
};

const onSessionGotBlockedHandler = (event, parsedTweet) => {
  console.log(
    "Session is blocked! We can't continue parsing. Wait for 10 minutes or more and try again"
  );
};

const start = async (win, targetFolder) => {
  if (!win) {
    console.log("Download window is empty, can't start!");
    return;
  }
  if (queue.length == 0) {
    console.log('Queue is empty - nothing to download');
    return;
  }
  if (queueStatus === STATUSES.IN_PROGRESS) {
    console.log("Queue already in progress - can't start");
    return;
  }
  __win = win;
  ipcMain.on(events.TWEET_PAGE_LOADED, onTweetPageLoadedHandler);
  ipcMain.on(events.TWEET_FAILED_TO_LOAD, onTweetPageLoadFailedHandler);
  ipcMain.on(events.SESSION_GOT_BLOCKED, onSessionGotBlockedHandler);
  queueStatus = STATUSES.IN_PROGRESS;
  console.log('TargetFolder:', getTargetFolder());
  startNextTaskOrFinishWork();
};

module.exports = { start, addTasks };
