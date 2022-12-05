const { ipcRenderer } = require('electron');
const events = require('../../events');
const { writeJsonFile } = require('../../utils/fileUtils');
const parser = require('../../parsers/tweetPageParser');
const { parseComplexTweet } = require('../../parsers/inFeedTweetParser');
const { scrapedFileNameFromUrl, parseTweetUrl } = require('../../utils/stringUtils');
const uiLogger = require('../../utils/uiLogger');
const { PageLoadingWorker } = require('../../PageLoadingWorker');

let pageLoadingWorker;

ipcRenderer.on(events.CONTEXT_MENU_STOP_SCRAPING, (event, args) => {
  if (pageLoadingWorker) {
    pageLoadingWorker.finish();
  }
});

ipcRenderer.on(events.CONTEXT_MENU_SCROLL_AND_SCRAPE_CLICKED, (event, args) => {
  if (pageLoadingWorker) {
    // already in progress, don't initiate it until stopped
    return;
  }
  console.log('preload:', events.CONTEXT_MENU_SCROLL_AND_SCRAPE_CLICKED, { args });
  const { targetFolder, url } = args;
  const startTime = new Date().getTime();
  const SCROLL_INTERVAL = 600;
  const NEW_MUTATIONS_TIMEOUT = 5000;
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

  const isLoading = () => parser.isProgressCircleVisible(document);

  const scrollDownAndScrape = () => {
    if (isLoading()) {
      return;
    }

    const tweets = [...document.querySelectorAll('[data-testid="tweet"]')];
    tweets.forEach((element) => {
      const parsedResults = parseComplexTweet(element);
      if (parsedResults?.length > 0) {
        parsedResults.forEach((parsed) => {
          if (parsed && !linksArray.find((v) => v.tweetId === parsed.tweetId)) {
            linksArray.push(parsed);
            console.log(`${linksArray.length}:`, parsed);
            uiLogger.success(`${linksArray.length}: ${parsed.url}`);
          }
        });
      }
    });

    // if (linksArray.length < 10)
    window.scrollBy({
      top: document.body.clientHeight * 2,
    });
  };

  const onFinished = () => {
    console.log(
      `Colected ${linksArray.lengthFinished} links in ${
        (new Date().getTime() - startTime) / 1000
      } seconds`
    );
    console.log('Total links scraped:', linksArray.length);
    writeJsonFile(linksArray, targetFolder, scrapedFileNameFromUrl(url));
    pageLoadingWorker = null;
  };

  pageLoadingWorker = new PageLoadingWorker(
    tweetsContainer,
    () => isLoading(),
    scrollDownAndScrape,
    onFinished,
    SCROLL_INTERVAL,
    NEW_MUTATIONS_TIMEOUT
  );
  pageLoadingWorker.start();
});
