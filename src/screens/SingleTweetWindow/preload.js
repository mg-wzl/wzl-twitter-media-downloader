const { ipcRenderer } = require('electron');
const events = require('../../events');
const parser = require('../../parsers/tweetPageParser');
const { ANONYMOUS_WINDOW_ARG } = require('../../windowManager');
const { Titlebar, Color } = require('custom-electron-titlebar');

const OBSERVER_TIMEOUT = 5000;

const isAnonymous = () => window.process?.argv?.includes(ANONYMOUS_WINDOW_ARG);

let titleBar;

window.addEventListener('DOMContentLoaded', () => {
  // Custom Title bar implemenation
  console.log('updatingtitle');
  const isAnon = isAnonymous();
  titleBar = new Titlebar({
    backgroundColor: isAnon ? Color.fromHex('#900') : Color.fromHex('#457'),
  });
  titleBar.updateTitle(`${isAnon ? '(Anonymous) ' : ''}Parser: ${window.location.href}`);
});

ipcRenderer.on(events.WAIT_FOR_TWEET_PAGE_LOAD, (event, tweetPageTask) => {
  const waitForTwitPage = () => {
    const tweetUrl = tweetPageTask.url;
    console.log('preload: received', events.WAIT_FOR_TWEET_PAGE_LOAD);
    console.log('preload: received', tweetPageTask);
    return new Promise((resolve, reject) => {
      // if (parser.isTweetLoaded(document)) {
      if (parser.isTweetImageLoaded(document, tweetPageTask.tweetId)) {
        const parsedTweet = parser.parseTweetWithDOM(document, tweetUrl);
        return resolve(parsedTweet);
      }

      const timeout = setTimeout(() => {
        observer?.disconnect();
        reject(tweetPageTask);
      }, OBSERVER_TIMEOUT);

      const observer = new MutationObserver((mutations) => {
        console.log('mutations:', mutations);
        // if (parser.isTweetLoaded(document)) {
        if (parser.isTweetImageLoaded(document, tweetPageTask.tweetId)) {
          const parsedTweet = parser.parseTweetWithDOM(document, tweetUrl);
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
          reject(tweetPageTask);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  };

  setTimeout(() => {
    console.log('SingleTweetWindow: <-', events.WAIT_FOR_TWEET_PAGE_LOAD);
    waitForTwitPage()
      .then((tweet) => {
        console.log('Tweet loaded!', tweet);
        ipcRenderer.send(events.TWEET_PAGE_LOADED, tweet);
      })
      .catch((e) => {
        console.log('Tweet failed to load!', e);
        if (isAnonymous()) {
          console.log('Anonymous window failed to parse the tweet - try in non-anonymous window.');
          ipcRenderer.send(events.TWEET_FAILED_TO_LOAD_ANONYMOUSLY, {
            error: e,
            task: tweetPageTask,
          });
        } else {
          ipcRenderer.send(events.TWEET_FAILED_TO_LOAD, { error: e, task: tweetPageTask });
        }
      });
  }, 1000);
});
