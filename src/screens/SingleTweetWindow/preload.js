const { ipcRenderer } = require('electron');
const events = require('../../events');
const { writeJsonFile } = require('../../utils/fileUtils');
const parser = require('../../parsers/tweetPageParser');
const { parseComplexTweet } = require('../../parsers/inFeedTweetParser');
const { scrapedFileNameFromUrl, parseTweetUrl } = require('../../utils/stringUtils');
const uiLogger = require('../../utils/uiLogger');

const OBSERVER_TIMEOUT = 5000;

ipcRenderer.on(events.WAIT_FOR_TWEET_PAGE_LOAD, (event, tweetUrl) => {
  const waitForTwitPage = () => {
    const fave = tweetUrl;
    console.log('preload: received', events.WAIT_FOR_TWEET_PAGE_LOAD);
    console.log('preload: received', tweetUrl);
    const { tweetId } = parseTweetUrl(tweetUrl);
    return new Promise((resolve, reject) => {
      // if (parser.isTweetLoaded(document)) {
      if (parser.isTweetImageLoaded(document, tweetId)) {
        const parsedTweet = parser.parseTweetWithDOM(document, fave);
        return resolve(parsedTweet);
      }

      const timeout = setTimeout(() => {
        observer?.disconnect();
        reject(fave);
      }, OBSERVER_TIMEOUT);

      const observer = new MutationObserver((mutations) => {
        console.log('mutations:', mutations);
        // if (parser.isTweetLoaded(document)) {
        if (parser.isTweetImageLoaded(document, tweetId)) {
          const parsedTweet = parser.parseTweetWithDOM(document, fave);
          observer.disconnect();
          if (timeout) {
            clearTimeout(timeout);
          }
          resolve(parsedTweet);
        }
        if (parser.isSessionBlocked(document)) {
          console.log(
            "Session is blocked! We can't continue parsing. Wait for 10 minutes or more and try again"
          );
          ipcRenderer.send(events.SESSION_GOT_BLOCKED);
          observer.disconnect();
          if (timeout) {
            clearTimeout(timeout);
          }
          reject(fave);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  };

  waitForTwitPage()
    .then((tweet) => {
      console.log('Tweet loaded!', tweet);
      ipcRenderer.send(events.TWEET_PAGE_LOADED, tweet);
    })
    .catch((e) => {
      console.log('Tweet failed to load!', e);
      ipcRenderer.send(events.TWEET_FAILED_TO_LOAD, e);
    });
});
