module.exports = Object.freeze({
  PICK_TARGET_FOLDER_CLICKED: 'button:pickTargetFolderClicked',
  PICK_FAVES_FILE_CLICKED: 'button:pickFavesFileClicked',
  CLEAR_COOKIES_CLICKED: 'button:clearCookieClicked',
  DOWNLOAD_FROM_DIRECT_LINKS_CLICKED: 'button:downloadFromDirectLinksClicked',
  PARSE_TWEET_BY_TWEET_AND_DOWNLOAD_CLICKED: 'button:parseTweetByTweetAndDownloadClicked',
  OPEN_TWITTER_WINDOW_CLICKED: 'button:twitterLoginClicked',

  CONTEXT_MENU_SCROLL_AND_SCRAPE_CLICKED: 'contextMenu:scrollAndScrape',
  CONTEXT_MENU_STOP_SCRAPING: 'contextMenu:stopScraping',
  FEED_PAGE_END_REACHED: 'webWindow:feedPageEndReached',

  WAIT_FOR_TWEET_PAGE_LOAD: 'waitForTweetPageLoad',
  TWEET_PAGE_LOADED: 'tweetPageLoaded',
  TWEET_FAILED_TO_LOAD: 'tweetFailedToLoad',
  TWEET_FAILED_TO_LOAD_ANONYMOUSLY: 'tweetFailedToLoadAnonymously',
  SESSION_GOT_BLOCKED: 'sessionGotBlocked',
});
