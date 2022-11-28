const { ipcRenderer } = require('electron');
const events = require('../../src/events');
const { writeJsonFile } = require('../../src/fileUtils');
const parser = require('../../src/parser');
const { parseTweet, parseComplexTweet } = require('../../src/singleTweetParser');
const { scrapingResultFilename } = require('./utils');

const OBSERVER_TIMEOUT = 5000;

ipcRenderer.on(events.WAIT_FOR_TWEET_PAGE_LOAD, (event, tweetUrl) => {
  const waitForTwitPage = () => {
    const fave = tweetUrl;
    console.log('preload: received', events.WAIT_FOR_TWEET_PAGE_LOAD);
    console.log('preload: received', tweetUrl);
    const { tweetId } = parser.parseTweetUrl(tweetUrl);
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

ipcRenderer.on(events.CONTEXT_MENU_SCROLL_AND_SCRAPE_CLICKED, (event, args) => {
  console.log('preload:', events.CONTEXT_MENU_SCROLL_AND_SCRAPE_CLICKED, { args });
  const { targetFolder, url } = args;
  const startTime = new Date().getTime();
  const SCROLL_INTERVAL = 600;
  const NEW_MUTATIONS_TIMEOUT = 5000;
  let containerHasMutations = false;
  const linksArray = [];

  if (!targetFolder) {
    console.log('Please set target folder');
    return;
  }

  const tweetsContainer = document.querySelector('div[data-testid="cellInnerDiv"]')?.parentElement;
  if (!tweetsContainer) {
    console.log('Could not find root tweets container. Aborting');
    return;
  }

  const observer = new MutationObserver((mutations) => {
    // console.log('mutations:', mutations);
    containerHasMutations = true;
  });
  observer.observe(tweetsContainer, {
    childList: true,
    subtree: true,
  });

  const scrollDownAndScrape = () => {
    if (parser.isProgressCircleVisible(document)) {
      return;
    }

    const tweets = [...document.querySelectorAll('[data-testid="tweet"]')];
    tweets.forEach((element) => {
      // const parsed = parseTweet(element);
      // if (parsed && !linksArray.find((v) => v.tweetId === parsed.tweetId)) {
      //   linksArray.push(parsed);
      //   console.log(`${linksArray.length}:`, parsed);
      // }
      const parsedResults = parseComplexTweet(element);
      if (parsedResults?.length > 0) {
        parsedResults.forEach((parsed) => {
          if (parsed && !linksArray.find((v) => v.tweetId === parsed.tweetId)) {
            linksArray.push(parsed);
            console.log(`${linksArray.length}:`, parsed);
          }
        });
      }
    });

    // const timeNodes = document.querySelectorAll('[data-testid="tweet"] a time');
    // const timeArr = [...timeNodes];
    // timeArr.forEach((timeElement, index) => {
    //   const link = timeElement?.closest('a').href;
    //   if (link && !linksArray.includes(link)) {
    //     linksArray.push(link);
    //     console.log(`${linksArray.length}: ${link}`);
    //   }
    // });

    // if (linksArray.length < 10)
    window.scrollBy({
      top: document.body.clientHeight * 2,
    });
  };

  const scraperIntervalId = setInterval(scrollDownAndScrape, SCROLL_INTERVAL);

  const checkIntervalId = setInterval(() => {
    if (parser.isProgressCircleVisible(document)) {
      return;
    }
    if (containerHasMutations) {
      scrollDownAndScrape();
      containerHasMutations = false;
    } else {
      clearInterval(checkIntervalId);
      clearInterval(scraperIntervalId);
      observer.disconnect();
      console.log(
        `Colected ${linksArray.lengthFinished} links in ${
          (new Date().getTime() - startTime) / 1000
        } seconds`
      );
      console.log('Total links scraped:', linksArray.length);
      writeJsonFile(linksArray, targetFolder, scrapingResultFilename(url));
    }
  }, NEW_MUTATIONS_TIMEOUT);
});
