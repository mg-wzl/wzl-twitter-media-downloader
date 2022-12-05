const { ipcRenderer } = require('electron');
const events = require('../../events');
const { writeJsonFile } = require('../../utils/fileUtils');
const parser = require('../../parsers/tweetPageParser');
const { parseComplexTweet } = require('../../parsers/inFeedTweetParser');
const { scrapedFileNameFromUrl, parseTweetUrl } = require('../../utils/stringUtils');
const uiLogger = require('../../utils/uiLogger');

ipcRenderer.on(events.CONTEXT_MENU_STOP_SCRAPING, (event, args) => {});

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
      writeJsonFile(linksArray, targetFolder, scrapedFileNameFromUrl(url));
    }
  }, NEW_MUTATIONS_TIMEOUT);
});
